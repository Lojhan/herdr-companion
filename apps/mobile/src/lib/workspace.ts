import type { Inventory, DesktopSpace } from "@companion/contracts";
export type WorkspaceTerminal = Inventory["terminals"][number];
export const terminalLabel = (terminal: WorkspaceTerminal) =>
  terminal.title ||
  terminal.name ||
  terminal.template ||
  terminal.foreground?.name ||
  terminal.argv[0]?.split(/[\\/]/).at(-1) ||
  terminal.address;
export const spaceLabel = (space: DesktopSpace) =>
  space.name ||
  space.folder.split(/[\\/]/).filter(Boolean).at(-1) ||
  "Untitled space";
export function terminalCoreId(
  terminal: WorkspaceTerminal,
  inventory: Inventory,
) {
  return terminal.address.includes("/")
    ? inventory.machines.find(
        (machine) => machine.name === terminal.address.split("/")[0],
      )?.id
    : inventory.core?.core.id;
}
export function terminalHref(
  terminal: WorkspaceTerminal,
  inventory: Inventory,
) {
  return {
    pathname: "/terminal/[address]" as const,
    params: {
      address: terminal.address,
      createdMs: terminal.created_ms,
      coreId: terminalCoreId(terminal, inventory) ?? "",
    },
  };
}
export function terminalSpace(
  terminal: WorkspaceTerminal,
  inventory: Inventory,
) {
  return inventory.spaces?.find((space) =>
    space.tabs.some((tab) => tab.terminals.includes(terminal.address)),
  );
}
export const rank = (terminal: WorkspaceTerminal) =>
  ({ blocked: 4, error: 4, done: 3, working: 2, idle: 1 })[
    terminal.status?.state ?? ""
  ] ?? 0;

export function workspaceMachines(inventory: Inventory | undefined) {
  return [
    ...(inventory?.core
      ? [
          {
            id: inventory.core.core.id,
            name: inventory.core.core.name,
            state: inventory.connected ? "connected" : "offline",
            coordinator: true,
          },
        ]
      : []),
    ...(inventory?.machines ?? []).map((machine) => ({
      id: machine.id,
      name: machine.name,
      state: machine.state,
      coordinator: false,
    })),
  ];
}
