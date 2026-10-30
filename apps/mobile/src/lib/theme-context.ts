import { createContext } from "react";
import type { HerdrTheme, ThemeName } from "./theme-tokens";
export const HerdrThemeContext = createContext<{
  theme: HerdrTheme;
  setTheme: (name: ThemeName) => void;
} | null>(null);
