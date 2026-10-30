import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import {
  CoreClient,
  Kind,
  parseCore,
  decodeResult,
  type Terminal,
} from "@companion/core-client";
import { readDesktopSpaces } from "./desktop-spaces.js";
import type { Inventory } from "@companion/contracts";
export class InventoryService extends EventEmitter {
  client?: CoreClient;
  private stopStream?: () => void;
  private retry?: NodeJS.Timeout;
  private sizePublish?: NodeJS.Timeout;
  private stopped = false;
  private eventBuffer = Buffer.alloc(0);
  private seq = 0n;
  private documentRefresh?: Promise<void>;
  private documentDirty = false;
  snapshot: Inventory = {
    connected: false,
    connectionEpoch: randomUUID(),
    observedAt: Date.now(),
    machines: [],
    terminals: [],
  };
  constructor(
    private options: {
      socket?: string;
      executable?: string;
      env?: NodeJS.ProcessEnv;
    },
  ) {
    super();
  }
  async start(): Promise<void> {
    try {
      const client = await CoreClient.open(this.options);
      if (this.stopped) {
        client.close();
        return;
      }
      this.client = client;
      client.on("disconnect", () => {
        if (this.stopped || this.client !== client) return;
        this.snapshot = {
          ...this.snapshot,
          connected: false,
          error: "Core disconnected",
          observedAt: Date.now(),
        };
        this.emit("change");
        this.schedule();
      });
      await client.call("server.status", {});
      const [machines, events] = await Promise.all([
        client.call("machine.list", {}),
        client.call("events.subscribe", {}),
      ]);
      this.seq = BigInt(events.seq);
      this.snapshot = {
        connected: true,
        connectionEpoch: randomUUID(),
        observedAt: Date.now(),
        core: client.hello!,
        machines: machines.machines,
        terminals: events.terminals,
        warnings: [
          "Core 0.1.14 terminal.list omits machines when empty despite its schema. Inventory uses the validated events.subscribe snapshot; terminal.list remains strict.",
        ],
      };
      this.eventBuffer = Buffer.alloc(0);
      if (events.channel != null) {
        const channel = events.channel;
        this.stopStream = client.stream(channel, (frame) => {
          if (frame.kind === Kind.Close) {
            client.close();
            return;
          }
          if (frame.kind !== Kind.Data) return;
          this.eventBuffer = Buffer.concat([this.eventBuffer, frame.payload]);
          if (this.eventBuffer.length > 16 * 1024 * 1024) {
            client.close();
            return;
          }
          let end: number;
          while ((end = this.eventBuffer.indexOf(10)) >= 0) {
            const line = this.eventBuffer.subarray(0, end).toString();
            this.eventBuffer = this.eventBuffer.subarray(end + 1);
            try {
              this.apply(parseCore(line));
            } catch {
              client.close();
              return;
            }
          }
          client.credit(channel, frame.payload.length);
        });
      }
      await this.refreshDocuments();
      this.emit("change");
    } catch {
      this.client?.close();
      this.snapshot = {
        ...this.snapshot,
        connected: false,
        error:
          "Core unavailable or incompatible. Check hc and the compatibility notes.",
        observedAt: Date.now(),
      };
      this.emit("change");
      this.schedule();
    }
  }
  private schedule() {
    if (!this.retry && !this.stopped)
      this.retry = setTimeout(() => {
        this.retry = undefined;
        void this.start();
      }, 3000);
  }
  private apply(message: any) {
    if (message.method === "heartbeat") return;
    const params = message.params;
    if (!params) return;
    const seq = BigInt(params.seq);
    if (message.method === "missed") {
      const fresh = decodeResult("events.subscribe", {
        seq: params.seq,
        terminals: params.terminals,
      });
      this.seq = seq;
      this.snapshot = {
        ...this.snapshot,
        terminals: fresh.terminals,
        observedAt: Date.now(),
      };
      void this.client
        ?.call("machine.list", {})
        .then((result) => {
          this.snapshot = { ...this.snapshot, machines: result.machines };
          void this.refreshDocuments();
          this.emit("change");
        })
        .catch(() => this.client?.close());
      this.emit("change");
      return;
    }
    if (message.method !== "event" || seq <= this.seq) return;
    if (seq !== this.seq + 1n) {
      this.client?.close();
      return;
    }
    this.seq = seq;
    if (params.type === "doc" && params.data?.name === "herdr-app") {
      void this.refreshDocuments();
      return;
    }
    const terminals = new Map(
      this.snapshot.terminals.map((t) => [t.address, t]),
    );
    const previous = terminals.get(params.terminal);
    if (params.type === "created" || params.type === "restarted") {
      const terminal = decodeResult("terminal.get", params.data);
      terminals.set(terminal.address, terminal);
    } else if (params.type === "removed") terminals.delete(params.terminal);
    else if (previous) {
      const data = params.data;
      let next: Terminal = previous;
      switch (params.type) {
        case "status":
          next = {
            ...previous,
            status: data.status,
            records: data.records,
            reported: data.reported,
          };
          break;
        case "turn":
          next = { ...previous, turn: String(data.turn) };
          break;
        case "title":
          next = { ...previous, title: data.title };
          break;
        case "labels":
          next = { ...previous, labels: data.labels };
          break;
        case "size":
          next = { ...previous, cols: data.cols, rows: data.rows };
          break;
        case "keep":
          next = { ...previous, keep: data.keep };
          break;
        case "foreground":
          next = { ...previous, foreground: data };
          break;
        case "finished":
          next = {
            ...previous,
            state: "finished",
            reason: data.reason,
            exit_code: data.exit_code,
            signal: data.signal,
            finished_ms:
              data.finished_ms == null ? null : String(data.finished_ms),
            foreground: null,
          };
          break;
        case "lost":
          next = {
            ...previous,
            reason: data.reason,
            exit_code: data.exit_code,
            signal: data.signal,
            pid: null,
            foreground: null,
            finished_ms: null,
          };
          break;
      }
      terminals.set(previous.address, next);
    }
    this.snapshot = {
      ...this.snapshot,
      terminals: [...terminals.values()],
      observedAt: Date.now(),
    };
    // Resize bursts still update the snapshot immediately, but do not rebuild
    // every client's inventory for each intermediate terminal geometry.
    if (params.type === "size") {
      this.sizePublish ??= setTimeout(() => {
        this.sizePublish = undefined;
        if (!this.stopped) this.emit("change");
      }, 150);
    } else {
      if (this.sizePublish) clearTimeout(this.sizePublish);
      this.sizePublish = undefined;
      this.emit("change");
    }
  }
  async refreshMachines() {
    const result = await this.client!.call("machine.list", {});
    this.snapshot = {
      ...this.snapshot,
      machines: result.machines,
      observedAt: Date.now(),
    };
    await this.refreshDocuments();
    this.emit("change");
  }
  refreshDocuments(): Promise<void> {
    this.documentDirty = true;
    if (this.documentRefresh) return this.documentRefresh;
    this.documentRefresh = (async () => {
      while (this.documentDirty && !this.stopped) {
        this.documentDirty = false;
        const client = this.client;
        if (!client || !this.snapshot.connected) return;
        const routes = [
          { id: client.hello!.core.id, name: null },
          ...this.snapshot.machines
            .filter((machine) => machine.state === "connected")
            .map((machine) => ({ id: machine.id, name: machine.name })),
        ];
        const results = await Promise.all(
          routes.map(async (route) => {
            try {
              const document = await client.call("doc.get", {
                name: "herdr-app",
                ...(route.name ? { on: route.name } : {}),
              });
              return {
                spaces: readDesktopSpaces(document.value, route.id, route.name),
                warning: null,
              };
            } catch {
              return {
                spaces: [],
                warning: `Desktop spaces unavailable on ${route.name ?? "this computer"}. Terminal access remains available.`,
              };
            }
          }),
        );
        if (this.client !== client || !this.snapshot.connected) return;
        this.snapshot = {
          ...this.snapshot,
          spaces: results.flatMap((result) => result.spaces),
          warnings: [
            ...(this.snapshot.warnings ?? []).filter(
              (warning) => !warning.startsWith("Desktop spaces unavailable"),
            ),
            ...results.flatMap((result) =>
              result.warning ? [result.warning] : [],
            ),
          ],
        };
        this.emit("change");
      }
    })().finally(() => {
      this.documentRefresh = undefined;
    });
    return this.documentRefresh;
  }
  stop() {
    this.stopped = true;
    if (this.retry) clearTimeout(this.retry);
    if (this.sizePublish) clearTimeout(this.sizePublish);
    this.stopStream?.();
    this.client?.close();
  }
}
