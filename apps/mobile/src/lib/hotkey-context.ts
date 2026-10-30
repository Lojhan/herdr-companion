import { createContext } from "react";
import type { CustomHotkey } from "./hotkey-codec";
export const HotkeyContext = createContext<{
  keys: CustomHotkey[];
  ready: boolean;
  error: string;
  save: (keys: CustomHotkey[]) => Promise<void>;
} | null>(null);
