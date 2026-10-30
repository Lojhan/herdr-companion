import type { DesktopSpace } from "@companion/contracts";
/** Read-only projection of the pinned desktop document. No document mutation or layout ownership. */
export function readDesktopSpaces(
  value: unknown,
  coreId: string,
  machine: string | null,
): DesktopSpace[] {
  if (value === null) return [];
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as any).spaces)
  )
    throw Error("Unsupported desktop document");
  const qualify = (id: string) => `${coreId}:${id}`;
  const address = (id: string) => (machine ? `${machine}/${id}` : id);
  const terminals = (root: unknown): string[] => {
    const found = new Set<string>();
    let visited = 0;
    const walk = (node: any, depth: number) => {
      if (!node || typeof node !== "object" || depth > 64 || ++visited > 10000)
        return;
      if (node.content && typeof node.content.terminal === "string")
        found.add(address(node.content.terminal));
      if (Array.isArray(node.children))
        for (const child of node.children) walk(child, depth + 1);
      if (Array.isArray(node.floating))
        for (const child of node.floating) walk(child, depth + 1);
    };
    walk(root, 0);
    return [...found];
  };
  return (value as any).spaces.slice(0, 1000).map((space: any) => {
    if (
      !space ||
      typeof space.id !== "string" ||
      typeof space.name !== "string" ||
      typeof space.folder !== "string" ||
      !Array.isArray(space.tabs)
    )
      throw Error("Unsupported desktop space");
    return {
      id: qualify(space.id),
      name: space.name,
      folder: space.folder,
      coreId,
      machine,
      tabs: space.tabs.slice(0, 1000).map((tab: any) => {
        if (!tab || typeof tab.id !== "string" || typeof tab.name !== "string")
          throw Error("Unsupported desktop tab");
        return {
          id: qualify(tab.id),
          name: tab.name,
          terminals: terminals(tab.root),
        };
      }),
    };
  });
}
