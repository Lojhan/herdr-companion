import { it, expect, vi } from "vitest";
import { InventoryService } from "./inventory.js";
it("coalesces geometry notifications while keeping status changes immediate", () => {
  vi.useFakeTimers();
  const service = new InventoryService({});
  service.snapshot.terminals = [{ address: "t1", cols: 80, rows: 24 }] as any;
  const changed = vi.fn();
  service.on("change", changed);
  const apply = (seq: number, type: string, data: unknown) =>
    (service as any).apply({
      method: "event",
      params: { seq, type, terminal: "t1", data },
    });
  try {
    for (let seq = 1; seq <= 10; seq++)
      apply(seq, "size", { cols: 80 + seq, rows: 30 });
    expect(service.snapshot.terminals[0]?.cols).toBe(90);
    expect(changed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    expect(changed).toHaveBeenCalledTimes(1);
    apply(11, "size", { cols: 100, rows: 30 });
    apply(12, "title", { title: "Working" });
    expect(changed).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(150);
    expect(changed).toHaveBeenCalledTimes(2);
    apply(13, "size", { cols: 101, rows: 30 });
    service.stop();
    vi.advanceTimersByTime(150);
    expect(changed).toHaveBeenCalledTimes(2);
  } finally {
    service.stop();
    vi.useRealTimers();
  }
});
