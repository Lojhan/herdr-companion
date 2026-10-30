import { describe, it, expect } from "vitest";
import { Decoder, encodeFrame, Kind, MAX_PAYLOAD } from "./framing.js";
import {
  parseCore,
  transform,
  methodSchema,
  validate,
  stringifyCore,
} from "./codec.js";
describe("core framing", () => {
  it("switches at hello with coalesced framed bytes and fragmented headers", () => {
    const received: any[] = [];
    const decoder = new Decoder(
      (line) => {
        received.push(JSON.parse(line));
        decoder.framed = true;
      },
      (frame) => received.push(frame),
    );
    const data = Buffer.concat([
      Buffer.from('{"framed":true}\n'),
      encodeFrame(0, 0, Buffer.from("rpc")),
      encodeFrame(7, 0, Buffer.from("Olá 🌿")),
    ]);
    for (const byte of data) decoder.push(Buffer.from([byte]));
    expect(received[0]).toEqual({ framed: true });
    expect(received[1].payload.toString()).toBe("rpc");
    expect(received[2].channel).toBe(7);
    expect(received[2].payload.toString()).toBe("Olá 🌿");
  });
  it("rejects oversized frames before buffering payload", () => {
    const decoder = new Decoder(
      () => {},
      () => {},
    );
    decoder.framed = true;
    const header = Buffer.alloc(9);
    header.writeUInt32LE(MAX_PAYLOAD + 1, 5);
    expect(() => decoder.push(header)).toThrow("Invalid frame");
  });
  it("keeps CAS versions lossless across the companion boundary", () => {
    const raw = parseCore('{"version":18446744073709551615,"value":null}');
    const value = transform(raw, methodSchema("doc.get", "result"));
    validate("doc.get", "result", value);
    expect(value.version).toBe("18446744073709551615");
    const outbound = transform(
      { name: "herdr-app", value: null, version: value.version },
      methodSchema("doc.set", "params"),
      true,
    );
    expect(stringifyCore(outbound)).toContain('"version":18446744073709551615');
  });
  it("preserves nullable and required params", () => {
    expect(() =>
      validate("terminal.attach", "params", { terminal: "t1" }),
    ).toThrow();
    expect(() =>
      validate("terminal.attach", "params", {
        terminal: "t1",
        cols: 80,
        rows: 24,
        observe: true,
      }),
    ).not.toThrow();
    expect(() =>
      validate("terminal.send", "result", { started: null }),
    ).toThrow();
  });
});
