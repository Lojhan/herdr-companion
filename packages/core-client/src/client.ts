import { EventEmitter } from "node:events";
import { connect } from "node:net";
import { spawn } from "node:child_process";
import type { Duplex, Readable, Writable } from "node:stream";
import { Decoder, Kind, encodeFrame, type Frame } from "./framing.js";
import {
  methodSchema,
  parseCore,
  stringifyCore,
  transform,
  validate,
} from "./codec.js";
import type { CoreMethods, MethodName } from "./generated/types.js";
export class CoreRpcError extends Error {
  constructor(
    message: string,
    public kind: string,
    public delivery = "confirmed",
  ) {
    super(message);
  }
}
interface Pending {
  method: MethodName;
  resolve: (value: any) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
}
export class CoreClient extends EventEmitter {
  hello?: CoreMethods["hello"]["result"];
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private streams = new Map<number, (frame: Frame) => void>();
  private early: Frame[] = [];
  private detached = new Set<number>();
  private earlyBytes = 0;
  private closed = false;
  private decoder: Decoder;
  constructor(
    private input: Readable,
    private output: Writable,
    private dispose: () => void,
  ) {
    super();
    this.decoder = new Decoder(
      (line) => this.receive(line),
      (frame) => this.receiveFrame(frame),
    );
    input.on("data", (chunk) => {
      try {
        this.decoder.push(chunk);
      } catch (error) {
        this.shutdown(error as Error);
      }
    });
    input.on("error", (error) => this.shutdown(error));
    output.on("error", (error) => this.shutdown(error));
    input.on("end", () => this.shutdown(Error("Core disconnected")));
  }
  static async open(
    options: {
      socket?: string;
      executable?: string;
      env?: NodeJS.ProcessEnv;
    } = {},
  ): Promise<CoreClient> {
    let client: CoreClient;
    if (options.socket) {
      const socket = connect(options.socket);
      await new Promise<void>((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("error", reject);
      });
      client = new CoreClient(socket, socket, () => socket.destroy());
    } else {
      const process = spawn(options.executable ?? "hc", ["connect"], {
        env: options.env ?? globalThis.process.env,
        stdio: ["pipe", "pipe", "pipe"],
      });
      client = new CoreClient(process.stdout, process.stdin, () =>
        process.kill(),
      );
      process.on("error", (error) => client.shutdown(error));
      process.on("exit", () => client.shutdown(Error("hc connect exited")));
      // Drain stderr, never mix untrusted core diagnostics into protocol or logs.
      process.stderr.resume();
    }
    try {
      client.hello = await client.call("hello", {
        generation: 1,
        framed: true,
      });
      if (client.hello.generation !== 1 || !client.hello.framed)
        throw Error("Unsupported core protocol generation/framing");
      return client;
    } catch (error) {
      client.close();
      throw error;
    }
  }
  call<M extends MethodName>(
    method: M,
    params: CoreMethods[M]["params"],
    timeoutMs = 15000,
  ): Promise<CoreMethods[M]["result"]> {
    if (this.closed)
      return Promise.reject(
        new CoreRpcError("Core disconnected", "unavailable", "not_sent"),
      );
    if (this.hello && !this.hello.methods.includes(method))
      return Promise.reject(
        new CoreRpcError(
          `Unsupported core method: ${method}`,
          "unsupported",
          "not_sent",
        ),
      );
    validate(method, "params", params);
    const id = this.nextId++,
      wire = stringifyCore({
        jsonrpc: "2.0",
        id,
        method,
        params: transform(params, methodSchema(method, "params"), true),
      });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new CoreRpcError(`Core ${method} timed out`, "timeout", "unknown"),
        );
      }, timeoutMs);
      this.pending.set(id, { method, resolve, reject, timer });
      this.output.write(
        this.decoder.framed
          ? encodeFrame(0, Kind.Data, Buffer.from(wire))
          : `${wire}\n`,
      );
    });
  }
  private receive(text: string): void {
    const message = parseCore(text);
    if (typeof message.id !== "number") {
      this.emit("notification", message);
      return;
    }
    const pending = this.pending.get(message.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(message.id);
    if (message.error) {
      pending.reject(
        new CoreRpcError(
          message.error.message,
          message.error.data?.kind ?? "unknown",
        ),
      );
      return;
    }
    try {
      const result = transform(
        message.result,
        methodSchema(pending.method, "result"),
      );
      validate(pending.method, "result", result);
      if (pending.method === "hello" && result.framed)
        this.decoder.framed = true;
      pending.resolve(result);
    } catch (error) {
      pending.reject(error as Error);
      this.shutdown(error as Error);
    }
  }
  private receiveFrame(frame: Frame): void {
    if (frame.channel === 0) {
      if (frame.kind !== Kind.Data) throw Error("Invalid RPC channel frame");
      this.receive(frame.payload.toString("utf8"));
      return;
    }
    if (this.detached.has(frame.channel)) {
      if (frame.kind === Kind.Close) this.detached.delete(frame.channel);
      return;
    }
    const listener = this.streams.get(frame.channel);
    if (listener) {
      listener(frame);
      if (frame.kind === Kind.Close) this.streams.delete(frame.channel);
    } else {
      this.earlyBytes += frame.payload.length;
      if (this.earlyBytes > 4 * 1024 * 1024 || this.early.length > 1024)
        throw Error("Unclaimed stream backlog exceeded");
      this.early.push(frame);
    }
  }
  stream(channel: number, listener: (frame: Frame) => void): () => void {
    this.detached.delete(channel);
    this.streams.set(channel, listener);
    const queued = this.early.filter((frame) => frame.channel === channel);
    this.early = this.early.filter((frame) => frame.channel !== channel);
    for (const frame of queued) {
      this.earlyBytes -= frame.payload.length;
      listener(frame);
      if (frame.kind === Kind.Close) this.streams.delete(channel);
    }
    return () => {
      this.streams.delete(channel);
      this.detached.add(channel);
      if (!this.closed) this.send(channel, Kind.Close);
    };
  }
  send(
    channel: number,
    kind: number,
    payload: Uint8Array = new Uint8Array(),
  ): void {
    if (!this.closed) this.output.write(encodeFrame(channel, kind, payload));
  }
  credit(channel: number, bytes: number): void {
    const payload = Buffer.alloc(4);
    payload.writeUInt32LE(bytes);
    this.send(channel, Kind.Credit, payload);
  }
  private shutdown(error: Error): void {
    if (this.closed) return;
    this.closed = true;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(
        new CoreRpcError("Core disconnected", "unavailable", "unknown"),
      );
    }
    this.pending.clear();
    this.streams.clear();
    this.detached.clear();
    this.early = [];
    this.dispose();
    this.emit("disconnect", error);
  }
  close(): void {
    this.shutdown(Error("Core client closed"));
  }
}
