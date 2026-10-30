import { it, expect } from "vitest";
import {
  encodeShortcut,
  validateHotkeys,
} from "../../apps/mobile/src/lib/hotkey-codec";
it("encodes terminal modifier chords and multiplexer sequences", () => {
  expect(encodeShortcut("Ctrl+B, %")).toBe("\x02%");
  expect(encodeShortcut("Alt+Enter")).toBe("\x1b\r");
  expect(encodeShortcut("Shift+Tab")).toBe("\x1b[Z");
  expect(encodeShortcut("Ctrl+Shift+Left")).toBe("\x1b[1;6D");
  expect(encodeShortcut("Alt+F5")).toBe("\x1b[15;3~");
  expect(encodeShortcut("Comma, Plus")).toBe(",+");
});
it("rejects malformed shortcuts and oversized saved preferences", () => {
  for (const key of ["", "Ctrl+", "Cmd+X", "Ctrl+Ctrl+X", "NoSuchKey"])
    expect(() => encodeShortcut(key)).toThrow();
  expect(() =>
    validateHotkeys([
      { id: "1", label: "Interrupt", shortcut: "Ctrl+C" },
      { id: "1", label: "Duplicate", shortcut: "Tab" },
    ]),
  ).toThrow();
  expect(() =>
    validateHotkeys(
      Array.from({ length: 13 }, (_, i) => ({
        id: String(i),
        label: "Key",
        shortcut: "Tab",
      })),
    ),
  ).toThrow();
});
