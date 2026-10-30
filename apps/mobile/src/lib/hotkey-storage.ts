import * as SecureStore from "expo-secure-store";
export const readHotkeys = () => SecureStore.getItemAsync("terminal-hotkeys");
export const writeHotkeys = (value: string) =>
  SecureStore.setItemAsync("terminal-hotkeys", value);
