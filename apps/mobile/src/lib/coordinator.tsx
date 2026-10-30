import { isDevelopmentHost } from "@companion/contracts";
import {
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Inventory, Role } from "@companion/contracts";
import { readCredential, saveCredential, deleteCredential } from "./storage";
import {
  CoordinatorContext as Context,
  type Profile,
} from "./coordinator-context";
export function validateEndpoint(value: string) {
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error("Use the coordinator origin, without a path or credentials");
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
        (__DEV__ && isDevelopmentHost(url.hostname)))
    )
  )
    throw Error("Use HTTPS, or a local network host in development");
  return url.origin;
}
export function CoordinatorProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null),
    [token, setToken] = useState<string | null>(null),
    [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const queryClient = useQueryClient();
  const csrfRef = useRef<string | null>(null);
  useEffect(() => {
    void (async () => {
      try {
        const saved = await readCredential("coordinator");
        if (saved) setProfile(JSON.parse(saved));
        setToken(await readCredential("device-token"));
      } catch {
        setProfile(null);
        setToken(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);
  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      if (!profile) throw Error("Connect a coordinator in Settings");
      const response = await fetch(`${profile.endpoint}${path}`, {
        ...init,
        credentials: "include",
        headers: {
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(csrfRef.current ? { "X-CSRF-Token": csrfRef.current } : {}),
          ...init.headers,
        },
      });
      const body = await response.json();
      if (!response.ok)
        throw Error(body.message ?? `Request failed (${response.status})`);
      if (path === "/v1/status") {
        if (body.bridgeId !== profile.bridgeId)
          throw Error("Coordinator identity changed. Pair again.");
        if (body.csrf) csrfRef.current = body.csrf;
        setRole(body.device?.role ?? null);
      }
      return body as T;
    },
    [profile, token],
  );
  const save = useCallback(
    async (next: Profile, nextToken?: string, nextCsrf?: string) => {
      validateEndpoint(next.endpoint);
      await saveCredential("coordinator", JSON.stringify(next));
      if (nextToken) await saveCredential("device-token", nextToken);
      setToken(nextToken ?? null);
      csrfRef.current = nextCsrf ?? null;
      setProfile(next);
      queryClient.clear();
    },
    [queryClient],
  );
  const disconnect = useCallback(async () => {
    try {
      await request("/v1/sessions/current", { method: "DELETE" });
    } catch {}
    await deleteCredential("coordinator");
    await deleteCredential("device-token");
    setProfile(null);
    setToken(null);
    setRole(null);
    csrfRef.current = null;
    queryClient.clear();
  }, [request, queryClient]);
  const socket = useCallback(async () => {
    await request("/v1/status");
    const result = await request<{ ticket: string }>("/v1/ws-tickets", {
      method: "POST",
    });
    const url = new URL("/v1/ws", profile!.endpoint);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("ticket", result.ticket);
    // Native sockets have no browser origin. Suppress SocketRocket's inferred
    // HTTP origin; authentication still requires the single-use session ticket.
    const ws =
      process.env.EXPO_OS === "web"
        ? new WebSocket(url.toString())
        : new (
            WebSocket as unknown as {
              new (
                url: string,
                protocols: undefined,
                options: { headers: Record<string, string> },
              ): WebSocket;
            }
          )(url.toString(), undefined, { headers: { Origin: "" } });
    ws.binaryType = "arraybuffer";
    return ws;
  }, [request, profile]);
  useEffect(() => {
    if (!ready || !profile) return;
    let cancelled = false;
    let active = AppState.currentState === "active";
    let ws: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const connect = async () => {
      if (cancelled || !active) return;
      try {
        const connection = await socket();
        if (cancelled || !active) {
          connection.close();
          return;
        }
        ws = connection;
        connection.onopen = () =>
          connection.send(JSON.stringify({ type: "subscribeInventory" }));
        connection.onmessage = (event) => {
          if (cancelled || typeof event.data !== "string") return;
          const message = JSON.parse(event.data);
          if (message.type === "inventorySnapshot")
            queryClient.setQueryData(
              ["inventory", profile.bridgeId],
              message.inventory,
            );
        };
        connection.onclose = () => {
          if (cancelled || !active) return;
          queryClient.setQueryData<Inventory>(
            ["inventory", profile.bridgeId],
            (previous) =>
              previous
                ? {
                    ...previous,
                    connected: false,
                    error: "Coordinator disconnected. Reconnecting…",
                  }
                : previous,
          );
          retry = setTimeout(() => void connect(), 3000);
        };
      } catch {
        if (!cancelled && active)
          retry = setTimeout(() => void connect(), 5000);
      }
    };
    void connect();
    const lifecycle = AppState.addEventListener("change", (state) => {
      active = state === "active";
      if (retry) clearTimeout(retry);
      if (active) {
        void queryClient.invalidateQueries({
          queryKey: ["inventory", profile.bridgeId],
        });
        void connect();
      } else {
        ws?.close();
        ws = undefined;
      }
    });
    return () => {
      cancelled = true;
      lifecycle.remove();
      if (retry) clearTimeout(retry);
      ws?.close();
    };
  }, [ready, profile, socket, queryClient]);
  return (
    <Context
      value={{ profile, ready, role, request, save, disconnect, socket }}
    >
      {children}
    </Context>
  );
}
export function useCoordinator() {
  const context = use(Context);
  if (!context) throw Error("CoordinatorProvider missing");
  return context;
}
export function useInventory() {
  const { profile, ready, request } = useCoordinator();
  const query = useQuery({
    queryKey: ["inventory", profile?.bridgeId],
    queryFn: async () => {
      await request("/v1/status");
      return request<Inventory>("/v1/inventory");
    },
    enabled: ready && !!profile,
    refetchInterval: false,
    retry: false,
  });
  return query;
}
