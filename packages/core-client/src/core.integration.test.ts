import { beforeAll, afterAll, it, expect } from "vitest";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { CoreClient } from "./client.js";
import { Kind } from "./framing.js";
let directory: string, client: CoreClient, env: NodeJS.ProcessEnv;
const executable =
  process.env.COMPANION_HC ?? `${process.env.HOME}/.local/bin/hc`;
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "companion-core-"));
  await mkdir(join(directory, "runtime"));
  env = {
    ...process.env,
    XDG_STATE_HOME: join(directory, "state"),
    XDG_CONFIG_HOME: join(directory, "config"),
    XDG_RUNTIME_DIR: join(directory, "runtime"),
    HC_SESSION: "companion-test",
    HC_SOCKET: join(directory, "test.sock"),
  };
  client = await CoreClient.open({ executable, env });
});
afterAll(async () => {
  client?.close();
  if (env)
    try {
      execFileSync(executable, ["server", "stop"], {
        env,
        stdio: "pipe",
        timeout: 10000,
      });
    } catch {}
  if (directory) await rm(directory, { recursive: true, force: true });
});
it("negotiates real core, snapshots events, attaches, consumes output and controls a test process", async () => {
  expect(client.hello?.generation).toBe(1);
  expect(client.hello?.version).toBe("0.1.14");
  const status = await client.call("server.status", {});
  expect(status.core.id).toBe(client.hello?.core.id);
  const events = await client.call("events.subscribe", {});
  expect(typeof events.seq).toBe("string");
  let eventText = "";
  const detachEvents = client.stream(events.channel!, (frame) => {
    if (frame.kind === Kind.Data) {
      eventText += frame.payload.toString();
      client.credit(events.channel!, frame.payload.length);
    }
  });
  const launched = await client.call("terminal.run", {
    argv: [
      "/bin/sh",
      "-c",
      'printf "companion-ready\\n"; read line; printf "received:%s\\n" "$line"; sleep 1',
    ],
    wait: false,
    keep: false,
    rm: false,
    no_parent: true,
    labels: { "companion.test": "roundtrip" },
  });
  const terminal = await client.call("terminal.get", {
    terminal: launched.address,
  });
  expect(terminal.labels["companion.test"]).toBe("roundtrip");
  const attached = await client.call("terminal.attach", {
    terminal: terminal.address,
    cols: 80,
    rows: 24,
    resumed: true,
    history: 10,
  });
  let output = "";
  const detach = client.stream(attached.channel, (frame) => {
    if (frame.kind === Kind.Data) {
      output += frame.payload.toString();
      client.credit(attached.channel, frame.payload.length);
    }
  });
  await expect.poll(() => output).toContain("companion-ready");
  client.send(attached.channel, Kind.Data, Buffer.from("real-roundtrip\r"));
  await expect.poll(() => output).toContain("received:real-roundtrip");
  await expect.poll(() => eventText).toContain("created");
  detach();
  detachEvents();
  await client.call("terminal.kill", { terminal: terminal.address });
  await client.call("terminal.rm", { terminal: terminal.address });
});
it("continues a real output stream beyond the initial 256 KiB credit window", async () => {
  const launched = await client.call("terminal.run", {
    argv: [
      "/bin/sh",
      "-c",
      'printf "stream-ready\\n"; read line; head -c 524288 /dev/zero | tr "\\000" x; printf "\\nstream-finished\\n"; read line',
    ],
    wait: false,
    no_parent: true,
    keep: false,
    rm: false,
    labels: { "companion.test": "credit" },
  });
  const attached = await client.call("terminal.attach", {
    terminal: launched.address,
    cols: 80,
    rows: 24,
    resumed: true,
  });
  let count = 0,
    tail = "";
  const detach = client.stream(attached.channel, (frame) => {
    if (frame.kind === Kind.Data) {
      count += frame.payload.length;
      tail = (tail + frame.payload.toString()).slice(-1000);
      client.credit(attached.channel, frame.payload.length);
    }
  });
  await expect.poll(() => tail).toContain("stream-ready");
  client.send(attached.channel, Kind.Data, Buffer.from("start\r"));
  await expect
    .poll(() => tail, { timeout: 10000 })
    .toContain("stream-finished");
  expect(count).toBeGreaterThan(512 * 1024);
  detach();
  await client.call("terminal.kill", { terminal: launched.address });
  await client.call("terminal.rm", { terminal: launched.address });
});
