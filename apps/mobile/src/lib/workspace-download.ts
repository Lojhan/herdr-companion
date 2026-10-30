import { readCredential } from "./storage";
export async function downloadWorkspaceFile(
  url: string,
  name: string,
  mime?: string,
) {
  const [{ File, Paths }, sharing] = await Promise.all([
    import("expo-file-system"),
    import("expo-sharing"),
  ]);
  if (!(await sharing.isAvailableAsync()))
    throw Error("Saving files is not supported on this device");
  const token = await readCredential("device-token");
  if (!token) throw Error("Pair this device before downloading files");
  const safe = name.replace(/[\\/\x00-\x1f]/g, "_").slice(-120) || "download";
  const file = await File.downloadFileAsync(
    url,
    new File(Paths.cache, `${Date.now()}-${safe}`),
    { headers: { Authorization: `Bearer ${token}` }, idempotent: true },
  );
  await sharing.shareAsync(file.uri, {
    mimeType: mime,
    dialogTitle: "Save or share file",
  });
}
