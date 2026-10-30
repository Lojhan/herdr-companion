// Palette and resolution ported from herdr-app/src/settings.rs at 3e32d75 (Apache-2.0).
// Upstream license and source are retained in vendor/herdr-app; fonts use SIL OFL.
import { use, useEffect, useState, type ReactNode } from "react";
import { readCredential, saveCredential } from "./storage";
import { HerdrThemeContext as Context } from "./theme-context";
import { resolveTheme, type ThemeName, type HerdrTheme } from "./theme-tokens";
export { resolveTheme } from "./theme-tokens";
export type { ThemeName, HerdrTheme } from "./theme-tokens";
export function HerdrThemeProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<ThemeName>("graphite");
  useEffect(() => {
    void readCredential("appearance")
      .then((value) => {
        if (value && ["graphite", "ink", "moss", "paper"].includes(value))
          setName(value as ThemeName);
      })
      .catch(() => {});
  }, []);
  return (
    <Context
      value={{
        theme: resolveTheme(name),
        setTheme: (next) => {
          setName(next);
          void saveCredential("appearance", next);
        },
      }}
    >
      {children}
    </Context>
  );
}
export function useHerdrTheme() {
  const value = use(Context);
  if (!value) throw Error("HerdrThemeProvider missing");
  return value;
}
export const metrics = {
  sidebar: 268,
  brand: 46,
  tabs: 42,
  status: 28,
  paneHeader: 30,
  paneGap: 8,
  paneRadius: 10,
  row: 30,
  rowRadius: 8,
  sectionHeader: 31,
  uiFont: 13,
  mobileTarget: 44,
} as const;
export function terminalTheme(theme: HerdrTheme) {
  return {
    background: theme.background,
    foreground: theme.terminalForeground,
    cursor: theme.cursor,
    selectionBackground: theme.selection,
    black: theme.ansi[0],
    red: theme.ansi[1],
    green: theme.ansi[2],
    yellow: theme.ansi[3],
    blue: theme.ansi[4],
    magenta: theme.ansi[5],
    cyan: theme.ansi[6],
    white: theme.ansi[7],
    brightBlack: theme.ansi[8],
    brightRed: theme.ansi[9],
    brightGreen: theme.ansi[10],
    brightYellow: theme.ansi[11],
    brightBlue: theme.ansi[12],
    brightMagenta: theme.ansi[13],
    brightCyan: theme.ansi[14],
    brightWhite: theme.ansi[15],
  };
}

export type ReturnTerminalTheme = ReturnType<typeof terminalTheme>;
