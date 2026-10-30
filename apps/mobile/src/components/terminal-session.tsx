import { randomUUID } from "expo-crypto";
import { TerminalComposer } from "./terminal-composer";
import type { TerminalSurfaceActions } from "./terminal-surface.types";
import type { TerminalImage } from "@/lib/terminal-images.types";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Icon } from "@/components/icons";
import { useHerdrTheme, terminalTheme } from "@/lib/theme";
import { WorkspaceToolbar } from "@/components/workspace-toolbar";
import { useCoordinator } from "@/lib/coordinator";
import TerminalSurface from "@/components/terminal-surface";
import { useLayout } from "@/lib/layout";
import { Button, Notice } from "@/components/ui";
function LiveTerminalSession({
  address,
  createdMs,
  coreId,
  title,
  tabs,
}: {
  address: string;
  createdMs: string;
  coreId: string;
  title?: string;
  tabs?: React.ReactNode;
}) {
  const { theme: t } = useHerdrTheme();
  const { dense } = useLayout();
  const {
    socket: openSocket,
    ready: coordinatorReady,
    profile,
    role,
    request,
  } = useCoordinator();
  const canControl =
    (role === "owner" || role === "controller") && !address.includes("/");
  const [liveInput, setLiveInput] = useState(false);
  const control = canControl;
  const actions = useRef<TerminalSurfaceActions | null>(null);
  const inputRequests = useRef(
    new Map<
      string,
      {
        resolve: () => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    >(),
  );
  const registerActions = useCallback(
    (value: TerminalSurfaceActions | null) => {
      actions.current = value;
    },
    [],
  );
  const rejectInputs = useCallback(() => {
    for (const pending of inputRequests.current.values()) {
      clearTimeout(pending.timer);
      pending.reject(Error("Input forwarding was not confirmed"));
    }
    inputRequests.current.clear();
  }, []);
  const [ready, setReady] = useState(false),
    [connection, setConnection] = useState("Connecting…"),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const socket = useRef<WebSocket | null>(null),
    stream = useRef<string | null>(null),
    geometry = useRef({ cols: 80, rows: 24 }),
    writer = useRef<((bytes: Uint8Array, consumed: () => void) => void) | null>(
      null,
    ),
    sequence = useRef(0);
  const send = useCallback((message: unknown) => {
    if (socket.current?.readyState === 1)
      socket.current.send(JSON.stringify(message));
  }, []);
  const register = useCallback(
    (write: ((bytes: Uint8Array, consumed: () => void) => void) | null) => {
      writer.current = write;
    },
    [],
  );
  const onReady = useCallback(() => setReady(true), []);
  const onInput = useCallback(
    (data: string) => {
      if (control && stream.current)
        send({ type: "terminalInput", streamId: stream.current, data });
    },
    [control, send],
  );
  const commit = useCallback(
    async (text: string, submit: boolean) => {
      if (
        !control ||
        !stream.current ||
        socket.current?.readyState !== 1 ||
        !actions.current
      )
        throw Error("Connect a controllable terminal before sending");
      const data =
        (await actions.current.encodePaste(text)) + (submit ? "\r" : "");
      if (!control || !stream.current || socket.current?.readyState !== 1)
        throw Error("Terminal disconnected");
      const requestId = randomUUID();
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          inputRequests.current.delete(requestId);
          reject(Error("Input forwarding was not confirmed"));
        }, 8000);
        inputRequests.current.set(requestId, { resolve, reject, timer });
        send({
          type: "terminalInput",
          streamId: stream.current,
          data,
          requestId,
        });
      });
    },
    [control, send],
  );
  const uploadImage = useCallback(
    async (image: TerminalImage) => {
      const result = await request<{ path: string; bytes: number }>(
        "/v1/terminal-images",
        {
          method: "POST",
          body: JSON.stringify({
            terminal: address,
            createdMs,
            coreId,
            name: image.name,
            data: image.data,
          }),
        },
      );
      return result.path;
    },
    [request, address, createdMs, coreId],
  );
  const resizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResize = useRef(0);
  useEffect(
    () => () => {
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
    },
    [],
  );
  const onResize = useCallback(
    (cols: number, rows: number) => {
      if (geometry.current.cols === cols && geometry.current.rows === rows)
        return;
      geometry.current = { cols, rows };
      if (!control || !stream.current) return;
      const publish = () => {
        resizeTimer.current = null;
        lastResize.current = Date.now();
        if (stream.current)
          send({
            type: "terminalResize",
            streamId: stream.current,
            ...geometry.current,
          });
      };
      const elapsed = Date.now() - lastResize.current;
      if (elapsed >= 80) {
        if (resizeTimer.current) clearTimeout(resizeTimer.current);
        publish();
      } else if (!resizeTimer.current)
        resizeTimer.current = setTimeout(publish, 80 - elapsed);
    },
    [control, send],
  );
  useFocusEffect(
    useCallback(() => {
      if (!ready || !coordinatorReady || !profile || role === null) return;
      let cancelled = false;
      stream.current = null;
      sequence.current = 0;
      void openSocket()
        .then((ws) => {
          if (cancelled) {
            ws.close();
            return;
          }
          socket.current = ws;
          ws.onopen = () => {
            if (cancelled) return;
            setError("");
            setConnection("Connecting…");
            ws.send(
              JSON.stringify({
                type: "attachTerminal",
                terminal: address,
                createdMs,
                coreId,
                mode: control ? "control" : "observe",
                ...geometry.current,
              }),
            );
          };
          ws.onmessage = (event) => {
            if (cancelled) return;
            if (typeof event.data === "string") {
              const message = JSON.parse(event.data);
              if (message.requestId) {
                const pending = inputRequests.current.get(message.requestId);
                if (
                  pending &&
                  (message.type === "terminalInputAccepted" ||
                    message.type === "error")
                ) {
                  clearTimeout(pending.timer);
                  inputRequests.current.delete(message.requestId);
                  if (message.type === "terminalInputAccepted")
                    pending.resolve();
                  else
                    pending.reject(Error(message.message ?? "Input refused"));
                  if (message.type === "terminalInputAccepted") return;
                }
              }
              if (message.type === "terminalAttached") {
                stream.current = message.streamId;
                setConnection("Connected");
              }
              if (message.type === "terminalOutput") {
                if (message.seq !== sequence.current + 1) {
                  setError("Output gap detected. Reattach for a fresh screen.");
                  ws.close();
                  return;
                }
                sequence.current = message.seq;
              }
              if (
                ["terminalClosed", "streamReset", "error"].includes(
                  message.type,
                )
              ) {
                setError(message.message ?? message.reason ?? "Stream closed");
                setConnection("Detached");
                stream.current = null;
              }
              return;
            }
            const bytes = new Uint8Array(event.data as ArrayBuffer);
            if (
              bytes.length < 21 ||
              new DataView(bytes.buffer).getUint32(17, true) !==
                bytes.length - 21
            ) {
              setError("Invalid terminal frame");
              ws.close();
              return;
            }
            const streamId = stream.current;
            const expected = streamId?.replaceAll("-", "");
            const actual = Array.from(bytes.subarray(0, 16), (byte) =>
              byte.toString(16).padStart(2, "0"),
            ).join("");
            if (!expected || expected !== actual || bytes[16] !== 0) {
              ws.close();
              return;
            }
            writer.current?.(bytes.subarray(21), () => {
              if (
                !cancelled &&
                stream.current === streamId &&
                ws.readyState === 1
              )
                ws.send(
                  JSON.stringify({
                    type: "terminalCredit",
                    streamId,
                    bytes: bytes.length - 21,
                  }),
                );
            });
          };
          ws.onerror = () =>
            setError(
              "Terminal connection failed. Reattach when the coordinator is reachable.",
            );
          ws.onclose = () => {
            rejectInputs();
            if (!cancelled) {
              setConnection("Disconnected");
              stream.current = null;
            }
          };
        })
        .catch((e) => {
          if (!cancelled) {
            setError((e as Error).message);
            setConnection("Disconnected");
          }
        });
      const lifecycle = AppState.addEventListener("change", (state) => {
        if (state !== "active") {
          socket.current?.close();
          stream.current = null;
          setConnection("Detached in background");
        }
      });
      return () => {
        cancelled = true;
        lifecycle.remove();
        rejectInputs();
        socket.current?.close();
        socket.current = null;
        stream.current = null;
      };
      // Reattach only on explicit mode/retry changes, never replay input after reconnect.
      // A manual retry deliberately recreates this focused connection callback.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      ready,
      coordinatorReady,
      profile,
      role,
      openSocket,
      address,
      createdMs,
      coreId,
      control,
      attempt,
      rejectInputs,
    ]),
  );
  return (
    <View style={{ flex: 1, backgroundColor: t.canvas }}>
      <WorkspaceToolbar title={title ?? address}>{tabs}</WorkspaceToolbar>
      <View style={{ flex: 1, minHeight: 0, gap: 8 }}>
        {error ? <Notice error>{error}</Notice> : null}
        <View
          style={{
            flex: 1,
            minHeight: 0,
            backgroundColor: t.background,

            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: dense ? 30 : 46,
              flexShrink: 0,
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
            }}
          >
            <Icon name="terminal" size={12} color={t.dim} />
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "Geist",
                fontSize: 11.5,
                lineHeight: 16,
                color: t.muted,
                flex: 1,
                minWidth: 0,
              }}
            >
              {address}
            </Text>
            <Text
              testID="terminal-connection"
              accessibilityLiveRegion="polite"
              numberOfLines={1}
              style={{
                fontFamily: "Geist",
                fontSize: 11,
                lineHeight: 16,
                color: t.dim,
                maxWidth: "50%",
                flexShrink: 1,
              }}
            >
              {connection === "Connected" && !control
                ? "Read only"
                : connection}
            </Text>
          </View>
          {connection.includes("Disconnected") ||
          connection.includes("Detached") ? (
            <View style={{ padding: 12 }}>
              <Button
                secondary
                onPress={() => {
                  setConnection("Connecting…");
                  setReady(false);
                  setError("");
                  setAttempt((value) => value + 1);
                }}
              >
                Reattach
              </Button>
            </View>
          ) : null}
          <View
            key={`${address}:${createdMs}:${control}:${attempt}`}
            style={{ flex: 1, minHeight: 0, backgroundColor: t.background }}
          >
            <TerminalSurface
              theme={terminalTheme(t)}
              control={control}
              directInput={process.env.EXPO_OS === "web" || liveInput}
              registerActions={registerActions}
              onReady={onReady}
              onInput={onInput}
              onResize={onResize}
              register={register}
            />
          </View>
        </View>
      </View>
      {process.env.EXPO_OS !== "web" ? (
        <TerminalComposer
          enabled={control && connection === "Connected"}
          liveInput={liveInput}
          onLiveInput={setLiveInput}
          onKey={onInput}
          onCommit={commit}
          uploadImage={uploadImage}
        />
      ) : null}
    </View>
  );
}

export default function TerminalSession(
  props: Parameters<typeof LiveTerminalSession>[0],
) {
  return <LiveTerminalSession {...props} />;
}
