// Palette adapted from pinned herdr-app settings.rs (Apache-2.0).
export type ThemeName = "graphite" | "ink" | "moss" | "paper";
const palettes = {
  graphite: {
    background: 0x17191d,
    terminal: 0xd2d4d9,
    selection: 0x394454,
    ansi: [
      0x45484f, 0xdc8c95, 0xa6bd91, 0xd8be87, 0x96b2d7, 0xb5a2ce, 0x8cbdc3,
      0xd2d4d9, 0x818793, 0xf0a5ad, 0xbad5a2, 0xead2a1, 0xb0cbef, 0xcbb7e6,
      0xa4d5db, 0xf0f0f2,
    ],
  },
  ink: {
    background: 0x111720,
    terminal: 0xcdd6e4,
    selection: 0x344861,
    ansi: [
      0x414b5a, 0xe58c9a, 0x89c5aa, 0xd9be82, 0x91b6ee, 0xb9a0e2, 0x85c4d0,
      0xcdd6e4, 0x7f91a7, 0xf5a5b2, 0xa5dec3, 0xedd39c, 0xaccbfa, 0xd0b7f4,
      0xa0dce5, 0xf0f5fc,
    ],
  },
  moss: {
    background: 0x151c19,
    terminal: 0xcdd7ce,
    selection: 0x354a40,
    ansi: [
      0x435248, 0xdf978d, 0xa0c4a2, 0xd4bc8b, 0x99b9cd, 0xbba4c8, 0x8bbdb5,
      0xcdd7ce, 0x82968a, 0xf1afa3, 0xb8dab9, 0xe9d2a5, 0xb1d0e2, 0xd1bddc,
      0xa4d6ca, 0xeff5ee,
    ],
  },
  paper: {
    background: 0xffffff,
    terminal: 0x25272c,
    selection: 0xcfdcf5,
    ansi: [
      0x25272c, 0xc62a2a, 0x1a7f37, 0x8f5d00, 0x1f62d0, 0x7a45c8, 0x0f6f74,
      0x5f6068, 0x7b7e87, 0xd1242f, 0x1f883d, 0x9a6700, 0x0969da, 0x8250df,
      0x1b7c83, 0x111214,
    ],
  },
};
const hex = (value: number) => `#${value.toString(16).padStart(6, "0")}`;
const mix = (a: number, b: number, t: number) =>
  [16, 8, 0].reduce(
    (result, shift) =>
      result |
      (Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t) <<
        shift),
    0,
  );
export function resolveTheme(name: ThemeName) {
  const p = palettes[name],
    bg = p.background,
    light = name === "paper",
    fg = light ? 0x1b1b1e : 0xeeeeef;
  const theme = {
    name,
    light,
    background: hex(bg),
    foreground: hex(fg),
    terminalForeground: hex(p.terminal),
    surface: hex(bg),
    canvas: hex(mix(bg, light ? 0xe8e8e2 : 0, light ? 0.2 : 0.16)),
    chrome: hex(mix(bg, light ? 0xe8e8e2 : 0, light ? 0.6 : 0.32)),
    popover: hex(light ? bg : mix(bg, 0xffffff, 0.06)),
    raised: hex(mix(bg, light ? 0 : 0xffffff, light ? 0.035 : 0.09)),
    hover: light ? "#0000000c" : "#ffffff0e",
    selected: light ? "#00000012" : "#ffffff17",
    border: light ? "#00000017" : "#ffffff18",
    input: light ? "#00000026" : "#ffffff24",
    muted: hex(mix(bg, fg, light ? 0.66 : 0.6)),
    dim: hex(mix(bg, fg, light ? 0.46 : 0.38)),
    accent: hex(p.ansi[4]!),
    solid: hex(fg),
    solidForeground: hex(light ? 0xffffff : mix(bg, 0, 0.28)),
    selection: hex(p.selection),
    cursor: hex(light ? 0x25272c : p.terminal),
    working: light ? "#9a6700" : "#e5c07b",
    blocked: light ? "#c93c2c" : "#f0705f",
    done: light ? "#2f6fe4" : "#76a8ff",
    idle: hex(mix(bg, fg, 0.38)),
    ansi: p.ansi.map(hex),
  };
  return theme;
}
export type HerdrTheme = ReturnType<typeof resolveTheme>;
