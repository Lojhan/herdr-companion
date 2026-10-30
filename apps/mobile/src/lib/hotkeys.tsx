import { use, useEffect, useState, type ReactNode } from "react";
import { readHotkeys, writeHotkeys } from "./hotkey-storage";
import { validateHotkeys, type CustomHotkey } from "./hotkey-codec";
import { HotkeyContext as Context } from "./hotkey-context";
export function HotkeyProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<CustomHotkey[]>([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const saved = await readHotkeys();
        if (active && saved) setKeys(validateHotkeys(JSON.parse(saved)));
      } catch {
        if (active) setError("Could not load saved hotkeys");
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  async function save(next: CustomHotkey[]) {
    validateHotkeys(next);
    await writeHotkeys(JSON.stringify(next));
    setKeys(next);
    setError("");
  }
  return <Context value={{ keys, ready, error, save }}>{children}</Context>;
}
export function useHotkeys() {
  const value = use(Context);
  if (!value) throw Error("HotkeyProvider missing");
  return value;
}
