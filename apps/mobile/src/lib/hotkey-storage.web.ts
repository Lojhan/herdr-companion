export const readHotkeys = async () =>
  sessionStorage.getItem("herdr:terminal-hotkeys");
export const writeHotkeys = async (value: string) => {
  sessionStorage.setItem("herdr:terminal-hotkeys", value);
};
