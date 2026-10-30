import { isDevelopmentHost } from "@companion/contracts";
import {
  fileQuery,
  workspaceRoot,
  listWorkspaceFiles,
  readWorkspaceFile,
  workspaceChanges,
  workspaceDiff,
  readWorkspaceMedia,
  workspaceAsset,
  WorkspaceFileError,
} from "./workspace-files.js";
import {
  creationInput,
  createWorkspaceResource,
  CreationError,
} from "./workspace-create.js";
import { imageUpload, validateImage } from "./terminal-attachments.js";
import Fastify, { type FastifyRequest } from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { randomUUID } from "node:crypto";
import { Kind } from "@companion/core-client";
import { claimRequest, wsCommand } from "@companion/contracts";
import { Store, secret, hash, type Device } from "./store.js";
import { InventoryService } from "./inventory.js";
import type WebSocket from "ws";
interface Options {
  store: Store;
  inventory: InventoryService;
  origins: string[];
  development?: boolean;
  logger?: boolean;
  lanOnly?: boolean;
}
export async function createServer(options: Options) {
  const { store, inventory } = options;
  const app = Fastify({
    logger: options.logger
      ? {
          redact: [
            "req.headers.authorization",
            "req.headers.cookie",
            "res.headers.set-cookie",
          ],
          serializers: {
            req: (req) => ({ method: req.method, url: req.url.split("?")[0] }),
          },
        }
      : false,
    bodyLimit: 128 * 1024,
    requestTimeout: 15000,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 120,
    timeWindow: 60000,
    // Paired devices on the same LAN/NAT each get their own budget. Anonymous
    // requests and pairing attempts remain limited by source IP.
    keyGenerator: (req) => {
      const device = authenticate(req)?.device;
      return device ? `device:${device.id}` : `ip:${req.ip}`;
    },
  });
  await app.register(websocket, { options: { maxPayload: 128 * 1024 } });
  let aggregateOutputBacklog = 0;
  const tickets = new Map<string, { deviceId: string; expiresAt: number }>();
  const sockets = new Map<WebSocket, Device>();
  const failure = (code: string, message: string) => ({
    code,
    message,
    retryable: false,
    delivery: "not_sent" as const,
  });
  function authenticate(
    req: FastifyRequest,
  ): { device: Device; csrf?: string } | undefined {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      const device = store.authenticate(auth.slice(7));
      return device ? { device } : undefined;
    }
    const token = req.cookies.companion_session;
    return token ? store.session(token) : undefined;
  }
  app.addHook("onRequest", async (req, reply) => {
    const origin = req.headers.origin;
    if (options.lanOnly && !isDevelopmentHost(req.ip.replace(/^::ffff:/, "")))
      return reply
        .code(403)
        .send(failure("lan_only", "Only local network clients are allowed"));
    if (origin && !options.origins.includes(origin))
      return reply
        .code(403)
        .send(failure("origin_denied", "Origin is not allowed"));
    if (origin) {
      reply.header("Access-Control-Allow-Origin", origin);
      reply.header("Access-Control-Allow-Credentials", "true");
      reply.header("Vary", "Origin");
      reply.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-CSRF-Token",
      );
      reply.header(
        "Access-Control-Allow-Methods",
        "GET, POST, DELETE, OPTIONS",
      );
    }
    if (req.method === "OPTIONS") return reply.code(204).send();
    reply.header("Cache-Control", "no-store");
    reply.header("X-Content-Type-Options", "nosniff");
  });
  app.setErrorHandler((error, req, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    reply
      .code(status >= 400 && status < 500 ? status : 500)
      .send(
        failure(
          "request_failed",
          status === 429
            ? "Too many requests. Please wait a minute and retry."
            : status < 500
              ? "Invalid request"
              : "Request failed",
        ),
      );
  });
  app.get("/healthz", () => ({ ok: true }));
  app.post(
    "/v1/pairing/claim",
    { config: { rateLimit: { max: 10, timeWindow: 60000 } } },
    async (req, reply) => {
      const parsed = claimRequest.safeParse(req.body);
      if (!parsed.success)
        return reply
          .code(400)
          .send(failure("invalid_claim", "Invalid pairing details"));
      if (parsed.data.bridgeId !== store.bridgeId)
        return reply
          .code(403)
          .send(failure("wrong_bridge", "Bridge identity does not match"));
      try {
        return store.claim(
          parsed.data.secret,
          parsed.data.deviceName,
          parsed.data.platform,
        );
      } catch {
        return reply
          .code(409)
          .send(
            failure("claim_unavailable", "Pairing expired or already claimed"),
          );
      }
    },
  );
  app.get<{ Params: { id: string } }>(
    "/v1/pairing/claims/:id",
    { config: { rateLimit: { max: 90, timeWindow: 60000 } } },
    async (req, reply) => {
      const credential = req.headers.authorization?.replace(/^Bearer /, "");
      if (!credential)
        return reply
          .code(401)
          .send(failure("unauthorized", "Claim credential required"));
      try {
        const result = store.poll(req.params.id, credential);
        if (result.state === "pending") return result;
        if (result.platform === "web") {
          const session = store.createSession(result.deviceId);
          reply.setCookie("companion_session", session.token, {
            httpOnly: true,
            secure: !options.development,
            sameSite: "strict",
            path: "/",
            maxAge: 43200,
          });
          return { state: "approved", csrf: session.csrf };
        }
        return { state: "approved", token: result.token };
      } catch {
        return reply
          .code(410)
          .send(
            failure(
              "claim_unavailable",
              "Claim expired or credential already delivered. Pair again.",
            ),
          );
      }
    },
  );
  // All remaining endpoints require a paired device; no public raw core tunnel.
  app.register(async (secured) => {
    secured.addHook("preHandler", async (req, reply) => {
      const identity = authenticate(req);
      if (!identity)
        return reply
          .code(401)
          .send(failure("unauthorized", "Pair this device to continue"));
      if (
        identity.csrf &&
        req.method !== "GET" &&
        req.method !== "HEAD" &&
        req.headers["x-csrf-token"] !== identity.csrf
      )
        return reply
          .code(403)
          .send(failure("csrf", "Session confirmation required"));
    });
    secured.get("/v1/status", (req) => ({
      bridgeId: store.bridgeId,
      apiVersion: 1,
      core: inventory.snapshot.core ?? null,
      connected: inventory.snapshot.connected,
      device: authenticate(req)!.device,
      csrf: authenticate(req)!.csrf,
    }));
    secured.get("/v1/inventory", () => inventory.snapshot);
    secured.get("/v1/machines", () => ({
      machines: inventory.snapshot.machines,
      connected: inventory.snapshot.connected,
    }));
    secured.get("/v1/tasks", () => ({
      tasks: [],
      supported: false,
      reason: "Task provisioning is not implemented yet",
    }));
    for (const kind of [
      "tree",
      "file",
      "changes",
      "diff",
      "media",
      "asset",
    ] as const)
      secured.get(`/v1/workspace/${kind}`, async (req, reply) => {
        const parsed = fileQuery.safeParse(req.query);
        if (!parsed.success)
          return reply
            .code(400)
            .send(
              failure("invalid_path", "Choose a valid workspace and file path"),
            );
        try {
          const q = parsed.data,
            root = await workspaceRoot(inventory, q);
          if (kind === "media") return await readWorkspaceMedia(root, q.path);
          if (kind === "asset") {
            const asset = await workspaceAsset(
              root,
              q.path,
              typeof req.headers.range === "string"
                ? req.headers.range
                : undefined,
            );
            reply
              .header("Content-Type", asset.mime)
              .header("Content-Length", asset.length)
              .header("Accept-Ranges", "bytes")
              .header("Content-Security-Policy", "default-src 'none'; sandbox");
            if (q.download === "1")
              reply.header(
                "Content-Disposition",
                `attachment; filename*=UTF-8''${encodeURIComponent(asset.name).replaceAll("'", "%27")}`,
              );
            if (asset.partial)
              reply
                .code(206)
                .header(
                  "Content-Range",
                  `bytes ${asset.start}-${asset.end}/${asset.size}`,
                );
            return reply.send(asset.stream);
          }
          if (kind === "tree") return await listWorkspaceFiles(root, q.path);
          if (kind === "file") return await readWorkspaceFile(root, q.path);
          if (kind === "changes") return await workspaceChanges(root);
          return await workspaceDiff(root, q.path, q.stage);
        } catch (error) {
          const status =
            error instanceof WorkspaceFileError
              ? error.status
              : ["ENOENT", "ENOTDIR"].includes((error as any).code)
                ? 404
                : 500;
          return reply
            .code(status)
            .send(
              failure(
                "workspace_read_failed",
                error instanceof WorkspaceFileError
                  ? error.message
                  : status === 404
                    ? "This file or folder no longer exists"
                    : "The workspace could not be read",
              ),
            );
        }
      });
    secured.post(
      "/v1/terminal-images",
      {
        bodyLimit: 12 * 1024 * 1024,
        config: { rateLimit: { max: 12, timeWindow: 60000 } },
      },
      async (req, reply) => {
        const device = authenticate(req)!.device;
        if (device.role === "observer")
          return reply
            .code(403)
            .send(
              failure("forbidden", "Terminal control permission is required"),
            );
        const parsed = imageUpload.safeParse(req.body);
        if (!parsed.success)
          return reply
            .code(400)
            .send(
              failure(
                "invalid_image",
                "Invalid image upload; maximum size is 8 MB",
              ),
            );
        const input = parsed.data,
          core = inventory.client;
        if (input.terminal.includes("/") || process.platform === "win32")
          return reply
            .code(403)
            .send(
              failure(
                "unsupported_host",
                "Attachments require a controllable local execution host",
              ),
            );
        if (!core || !inventory.snapshot.connected)
          return reply
            .code(503)
            .send(failure("core_offline", "Coordinator is offline"));
        if (core.hello?.core.id !== input.coreId)
          return reply
            .code(409)
            .send(
              failure("identity_changed", "Execution core identity changed"),
            );
        let image;
        try {
          image = validateImage(input.data, input.name);
        } catch (error) {
          return reply
            .code(400)
            .send(failure("invalid_image", (error as Error).message));
        }
        const terminal = await core.call("terminal.get", {
          terminal: input.terminal,
        });
        if (
          terminal.created_ms !== input.createdMs ||
          terminal.state !== "live"
        )
          return reply
            .code(409)
            .send(
              failure(
                "identity_changed",
                "Terminal was replaced or has exited",
              ),
            );
        // Core owns the upload directory and removes it with this terminal. Uploading types nothing.
        const result = await core.call("terminal.put", {
          terminal: input.terminal,
          ...image,
        });
        return { path: result.path, bytes: result.bytes };
      },
    );
    secured.post(
      "/v1/workspace/create",
      { config: { rateLimit: { max: 12, timeWindow: 60000 } } },
      async (req, reply) => {
        const role = authenticate(req)!.device.role;
        if (role === "observer")
          return reply
            .code(403)
            .send(
              failure("forbidden", "Terminal control permission is required"),
            );
        const input = creationInput.safeParse(req.body);
        if (!input.success)
          return reply
            .code(400)
            .send(
              failure(
                "invalid_creation",
                "Check the name, workspace, path and command",
              ),
            );
        if (input.data.kind === "machine" && role !== "owner")
          return reply
            .code(403)
            .send(
              failure(
                "forbidden",
                "Only the coordinator owner can add machines",
              ),
            );
        try {
          return await createWorkspaceResource(inventory, input.data);
        } catch (error) {
          if (error instanceof CreationError)
            return reply
              .code(error.status)
              .send(failure("creation_failed", error.message));
          // A connection can drop after a process starts. Never invite automatic replay.
          return reply.code(502).send({
            ...failure(
              "creation_unconfirmed",
              "Creation could not be confirmed. Check the live list before trying again.",
            ),
            delivery: "unknown",
          });
        }
      },
    );
    secured.post("/v1/ws-tickets", (req, reply) => {
      const device = authenticate(req)!.device;
      const token = secret();
      if (tickets.size >= 1000)
        return reply
          .code(429)
          .send(failure("ticket_limit", "Too many pending connections"));
      tickets.set(hash(token), {
        deviceId: device.id,
        expiresAt: Date.now() + 30000,
      });
      return { ticket: token, expiresIn: 30 };
    });
    secured.get("/v1/devices", (req, reply) => {
      if (authenticate(req)!.device.role !== "owner")
        return reply
          .code(403)
          .send(failure("forbidden", "Owner permission required"));
      return {
        devices: store.db
          .prepare("SELECT id,name,role,created_at,revoked_at FROM devices")
          .all(),
      };
    });
    secured.delete<{ Params: { id: string } }>(
      "/v1/devices/:id",
      (req, reply) => {
        if (authenticate(req)!.device.role !== "owner")
          return reply
            .code(403)
            .send(failure("forbidden", "Owner permission required"));
        store.revoke(req.params.id);
        for (const [socket, device] of sockets)
          if (device.id === req.params.id) socket.close(1008, "Device revoked");
        return { revoked: true };
      },
    );
    secured.delete("/v1/sessions/current", (req, reply) => {
      if (req.cookies.companion_session)
        store.db
          .prepare("DELETE FROM sessions WHERE id_hash=?")
          .run(hash(req.cookies.companion_session));
      reply.clearCookie("companion_session", { path: "/" });
      return { ok: true };
    });
  });
  app.get<{ Querystring: { ticket?: string } }>(
    "/v1/ws",
    { websocket: true },
    (socket, req) => {
      const key = hash(req.query.ticket ?? ""),
        ticket = tickets.get(key);
      tickets.delete(key);
      const device =
        ticket && ticket.expiresAt > Date.now()
          ? (store.db
              .prepare(
                "SELECT id,name,role,revoked_at FROM devices WHERE id=? AND revoked_at IS NULL",
              )
              .get(ticket.deviceId) as Device | undefined)
          : undefined;
      if (!device) {
        socket.close(1008, "Invalid session ticket");
        return;
      }
      sockets.set(socket, device);
      type Stream = {
        channel: number;
        mode: "observe" | "control";
        detach: () => void;
        pending: number;
        seq: number;
        core: NonNullable<typeof inventory.client>;
      };
      const streams = new Map<string, Stream>();
      let subscribed = false;
      let busy = false;
      const send = (value: unknown) => {
        if (socket.readyState === 1) socket.send(JSON.stringify(value));
      };
      const changed = () => {
        if (!inventory.snapshot.connected) {
          for (const [id, stream] of streams) {
            stream.detach();
            send({
              type: "terminalClosed",
              streamId: id,
              reason: "Core disconnected",
            });
          }
          streams.clear();
        }
        if (subscribed)
          send({ type: "inventorySnapshot", inventory: inventory.snapshot });
      };
      inventory.on("change", changed);
      send({ type: "hello", apiVersion: 1, bridgeId: store.bridgeId });
      socket.on("message", async (raw, isBinary) => {
        if (
          !store.db
            .prepare("SELECT id FROM devices WHERE id=? AND revoked_at IS NULL")
            .get(device.id)
        ) {
          socket.close(1008, "Device revoked");
          return;
        }
        if (isBinary) {
          socket.close(1008, "Expected JSON command");
          return;
        }
        let command;
        try {
          command = wsCommand.parse(JSON.parse(raw.toString()));
        } catch {
          send({
            type: "error",
            ...failure("invalid_command", "Invalid WebSocket command"),
          });
          return;
        }
        try {
          if (command.type === "ping") {
            send({ type: "pong" });
            return;
          }
          if (command.type === "subscribeInventory") {
            subscribed = true;
            changed();
            return;
          }
          if (command.type === "attachTerminal") {
            if (busy || streams.size >= 4) throw Error("Stream limit reached");
            busy = true;
            try {
              const core = inventory.client;
              if (!core || !inventory.snapshot.connected)
                throw Error("Core unavailable");
              if (
                command.mode === "control" &&
                (device.role === "observer" ||
                  command.terminal.includes("/") ||
                  process.platform === "win32")
              )
                throw Error(
                  "Control unavailable for this device or execution host",
                );
              const executionCoreId = command.terminal.includes("/")
                ? inventory.snapshot.machines.find(
                    (machine) =>
                      machine.name === command.terminal.split("/")[0],
                  )?.id
                : core.hello?.core.id;
              if (executionCoreId !== command.coreId)
                throw Error("Execution core identity changed");
              const terminal = await core.call("terminal.get", {
                terminal: command.terminal,
              });
              if (terminal.created_ms !== command.createdMs)
                throw Error("Terminal identity changed");
              const attached = await core.call("terminal.attach", {
                terminal: command.terminal,
                cols: command.cols,
                rows: command.rows,
                observe: command.mode === "observe",
                resumed: true,
                history: 100,
              });
              if (socket.readyState !== 1) {
                core.send(attached.channel, Kind.Close);
                return;
              }
              const streamId = randomUUID();
              const stream: Stream = {
                channel: attached.channel,
                mode: command.mode,
                detach: () => {},
                pending: 0,
                seq: 0,
                core,
              };
              streams.set(streamId, stream);
              send({
                type: "terminalAttached",
                streamId,
                mode: command.mode,
                terminal: command.terminal,
              });
              const detachCore = core.stream(attached.channel, (frame) => {
                if (frame.kind === Kind.Close) {
                  stream.detach();
                  streams.delete(streamId);
                  send({
                    type: "terminalClosed",
                    streamId,
                    reason: "Core stream closed",
                  });
                  return;
                }
                if (frame.kind !== Kind.Data) return;
                stream.pending += frame.payload.length;
                aggregateOutputBacklog += frame.payload.length;
                const total = [...streams.values()].reduce(
                  (sum, s) => sum + s.pending,
                  0,
                );
                if (
                  stream.pending > 4 * 1024 * 1024 ||
                  total > 16 * 1024 * 1024 ||
                  aggregateOutputBacklog > 32 * 1024 * 1024 ||
                  socket.bufferedAmount > 4 * 1024 * 1024
                ) {
                  stream.detach();
                  streams.delete(streamId);
                  send({
                    type: "streamReset",
                    streamId,
                    reason: "Viewer fell behind. Reattach for a fresh screen.",
                  });
                  return;
                }
                const bytes = Buffer.allocUnsafe(21 + frame.payload.length);
                Buffer.from(streamId.replaceAll("-", ""), "hex").copy(bytes, 0);
                bytes[16] = Kind.Data;
                bytes.writeUInt32LE(frame.payload.length, 17);
                frame.payload.copy(bytes, 21);
                send({
                  type: "terminalOutput",
                  streamId,
                  seq: ++stream.seq,
                  bytes: frame.payload.length,
                });
                socket.send(bytes);
              });
              stream.detach = () => {
                aggregateOutputBacklog -= stream.pending;
                stream.pending = 0;
                detachCore();
              };
            } finally {
              busy = false;
            }
            return;
          }
          const stream = streams.get(command.streamId);
          if (!stream) throw Error("Stream no longer attached");
          if (command.type === "detachTerminal") {
            stream.detach();
            streams.delete(command.streamId);
            return;
          }
          if (command.type === "terminalCredit") {
            if (command.bytes > stream.pending)
              throw Error("Credit exceeds consumed output");
            stream.pending -= command.bytes;
            aggregateOutputBacklog -= command.bytes;
            stream.core.credit(stream.channel, command.bytes);
            return;
          }
          if (stream.mode !== "control" || device.role === "observer")
            throw Error("Take control before sending input");
          if (command.type === "terminalInput") {
            stream.core.send(
              stream.channel,
              Kind.Data,
              Buffer.from(command.data),
            );
            if (command.requestId)
              send({
                type: "terminalInputAccepted",
                requestId: command.requestId,
              });
            return;
          }
          if (command.type === "terminalResize") {
            const size = Buffer.alloc(4);
            size.writeUInt16LE(command.cols);
            size.writeUInt16LE(command.rows, 2);
            stream.core.send(stream.channel, Kind.Resize, size);
          }
        } catch {
          send({
            type: "error",
            ...("requestId" in command ? { requestId: command.requestId } : {}),
            ...failure(
              "operation_refused",
              "Operation refused. Check connection, terminal identity and permissions.",
            ),
          });
        }
      });
      socket.on("close", () => {
        inventory.off("change", changed);
        for (const stream of streams.values()) stream.detach();
        streams.clear();
        sockets.delete(socket);
      });
    },
  );
  const maintenance = setInterval(() => {
    for (const [key, value] of tickets)
      if (value.expiresAt <= Date.now()) tickets.delete(key);
    for (const [socket, device] of sockets) {
      const active = store.db
        .prepare("SELECT id FROM devices WHERE id=? AND revoked_at IS NULL")
        .get(device.id);
      if (!active) socket.close(1008, "Device revoked");
    }
  }, 1000);
  maintenance.unref();
  app.addHook("onClose", async () => {
    clearInterval(maintenance);
    for (const socket of sockets.keys())
      socket.close(1001, "Bridge shutting down");
    inventory.stop();
  });
  return app;
}
