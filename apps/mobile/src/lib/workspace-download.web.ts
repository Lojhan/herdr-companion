export async function downloadWorkspaceFile(
  url: string,
  name: string,
  _mime?: string,
) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
