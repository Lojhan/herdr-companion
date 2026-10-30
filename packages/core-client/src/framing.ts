export const MAX_PAYLOAD = 16 * 1024 * 1024;
export const INITIAL_CREDIT = 256 * 1024;
export const Kind = {
  Data: 0,
  Credit: 1,
  Close: 2,
  Resize: 3,
  Focus: 4,
  Facts: 5,
} as const;
export interface Frame {
  channel: number;
  kind: number;
  payload: Buffer;
}
export function encodeFrame(
  channel: number,
  kind: number,
  payload: Uint8Array = new Uint8Array(),
): Buffer {
  if (
    !Number.isInteger(channel) ||
    channel < 0 ||
    channel > 0xffffffff ||
    kind < 0 ||
    kind > 5 ||
    payload.length > MAX_PAYLOAD
  )
    throw Error("Invalid frame");
  const frame = Buffer.allocUnsafe(9 + payload.length);
  frame.writeUInt32LE(channel, 0);
  frame[4] = kind;
  frame.writeUInt32LE(payload.length, 5);
  frame.set(payload, 9);
  return frame;
}
/** Changes mode synchronously in onLine, preserving framed bytes following hello in the same chunk. */
export class Decoder {
  private pending = Buffer.alloc(0);
  framed = false;
  constructor(
    private onLine: (line: string) => void,
    private onFrame: (frame: Frame) => void,
  ) {}
  push(chunk: Uint8Array): void {
    this.pending = Buffer.concat([this.pending, chunk]);
    while (this.pending.length) {
      if (!this.framed) {
        const end = this.pending.indexOf(10);
        if (end < 0) {
          if (this.pending.length > MAX_PAYLOAD)
            throw Error("Oversized plain message");
          return;
        }
        const line = this.pending.subarray(0, end).toString("utf8");
        this.pending = this.pending.subarray(end + 1);
        this.onLine(line);
        continue;
      }
      if (this.pending.length < 9) return;
      const length = this.pending.readUInt32LE(5),
        kind = this.pending[4]!;
      if (length > MAX_PAYLOAD || kind > 5) throw Error("Invalid frame header");
      if (this.pending.length < 9 + length) return;
      const frame = {
        channel: this.pending.readUInt32LE(0),
        kind,
        payload: this.pending.subarray(9, 9 + length),
      };
      this.pending = this.pending.subarray(9 + length);
      this.onFrame(frame);
    }
  }
}
