export function readPanelWidths() {
  try {
    const value = JSON.parse(
      sessionStorage.getItem("herdr:panel-widths") ?? "null",
    );
    return value &&
      Number.isFinite(value.navigation) &&
      Number.isFinite(value.inspector)
      ? {
          navigation: Math.max(200, Math.min(520, value.navigation)),
          inspector: Math.max(280, Math.min(720, value.inspector)),
        }
      : null;
  } catch {
    return null;
  }
}
export function writePanelWidths(value: {
  navigation: number;
  inspector: number;
}) {
  try {
    sessionStorage.setItem("herdr:panel-widths", JSON.stringify(value));
  } catch {}
}
