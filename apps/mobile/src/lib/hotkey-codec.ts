export interface CustomHotkey {
  id: string;
  label: string;
  shortcut: string;
}
const names: Record<string, string> = {
  esc: "\x1b",
  escape: "\x1b",
  enter: "\r",
  return: "\r",
  tab: "\t",
  backspace: "\x7f",
  space: " ",
  plus: "+",
  comma: ",",
  up: "\x1b[A",
  down: "\x1b[B",
  right: "\x1b[C",
  left: "\x1b[D",
  home: "\x1b[H",
  end: "\x1b[F",
  insert: "\x1b[2~",
  delete: "\x1b[3~",
  pageup: "\x1b[5~",
  pagedown: "\x1b[6~",
  f1: "\x1bOP",
  f2: "\x1bOQ",
  f3: "\x1bOR",
  f4: "\x1bOS",
  f5: "\x1b[15~",
  f6: "\x1b[17~",
  f7: "\x1b[18~",
  f8: "\x1b[19~",
  f9: "\x1b[20~",
  f10: "\x1b[21~",
  f11: "\x1b[23~",
  f12: "\x1b[24~",
};
export function encodeShortcut(shortcut: string): string {
  if (!shortcut.trim() || shortcut.length > 64)
    throw Error("Enter a shortcut, up to 64 characters");
  const chords = shortcut.split(",").map((s) => s.trim());
  if (chords.length > 8) throw Error("Use up to eight keys in a sequence");
  return chords
    .map((chord) => {
      const parts = chord.split("+");
      const key = parts.pop()!;
      const modifiers = parts.map((s) => s.trim().toLowerCase());
      if (
        !key ||
        modifiers.some((m) => !["ctrl", "alt", "shift"].includes(m)) ||
        new Set(modifiers).size !== modifiers.length
      )
        throw Error(
          "Use Ctrl, Alt or Shift with a key, such as Ctrl+B or Alt+Enter",
        );
      const ctrl = modifiers.includes("ctrl"),
        alt = modifiers.includes("alt"),
        shift = modifiers.includes("shift");
      const named = names[key.toLowerCase()];
      if (key.length === 1) {
        let value = shift ? key.toUpperCase() : key;
        if (ctrl) {
          const code = key.toUpperCase().charCodeAt(0);
          if (code < 64 || code > 95)
            throw Error("Ctrl supports letters and @ [ \\ ] ^ _");
          value = String.fromCharCode(code - 64);
        }
        return (alt ? "\x1b" : "") + value;
      }
      if (!named) throw Error(`Unknown key: ${key}`);
      const modifier = 1 + Number(shift) + Number(alt) * 2 + Number(ctrl) * 4;
      if (modifier === 1) return named;
      if (named === "\t" && shift && !ctrl && !alt) return "\x1b[Z";
      if (/^\x1b\[[A-DHF]$/.test(named))
        return `\x1b[1;${modifier}${named.at(-1)}`;
      if (/^\x1b\[\d+~$/.test(named))
        return named.slice(0, -1) + `;${modifier}~`;
      if (/^\x1bO[P-S]$/.test(named))
        return `\x1b[1;${modifier}${named.at(-1)}`;
      if (alt && !ctrl && !shift) return "\x1b" + named;
      throw Error(`That modifier combination is not supported for ${key}`);
    })
    .join("");
}
export function validateHotkeys(value: unknown): CustomHotkey[] {
  if (!Array.isArray(value) || value.length > 12)
    throw Error("Save up to 12 custom hotkeys");
  const ids = new Set<string>();
  for (const item of value) {
    if (
      !item ||
      typeof item.id !== "string" ||
      item.id.length > 40 ||
      ids.has(item.id) ||
      typeof item.label !== "string" ||
      !item.label.trim() ||
      item.label.length > 20 ||
      typeof item.shortcut !== "string"
    )
      throw Error("Invalid hotkey");
    encodeShortcut(item.shortcut);
    ids.add(item.id);
  }
  if (
    encodeURIComponent(JSON.stringify(value)).replace(/%[A-F0-9]{2}/g, "x")
      .length > 1800
  )
    throw Error("Hotkey storage is full; shorten a label or sequence");
  return value;
}
