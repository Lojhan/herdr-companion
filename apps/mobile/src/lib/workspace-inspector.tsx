import { use, useState, type ReactNode } from "react";
import { useGlobalSearchParams, usePathname } from "expo-router";
import { useInventory } from "./coordinator";
import { terminalSpace, terminalCoreId, spaceLabel } from "./workspace";
import type { WorkspaceScope } from "@companion/contracts";
import {
  WorkspaceInspectorContext as Context,
  type InspectorPanel,
  type InspectorTarget,
} from "./workspace-inspector-context";
export type {
  InspectorPanel,
  InspectorTarget,
} from "./workspace-inspector-context";
export function WorkspaceInspectorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [panel, setPanel] = useState<InspectorPanel | null>(null),
    { data } = useInventory(),
    path = usePathname(),
    params = useGlobalSearchParams<{
      id?: string;
      address?: string;
      createdMs?: string;
    }>();
  let target: InspectorTarget | null = null;
  if (data) {
    const terminal = path.startsWith("/terminal/")
      ? data.terminals.find(
          (t) =>
            t.address === params.address && t.created_ms === params.createdMs,
        )
      : undefined;
    const workspace = path.startsWith("/space/")
      ? data.spaces?.find((s) => s.id === params.id)
      : terminal
        ? terminalSpace(terminal, data)
        : undefined;
    if (workspace && workspace.folder)
      target = {
        scope: { spaceId: workspace.id, coreId: workspace.coreId },
        name: spaceLabel(workspace),
        folder: workspace.folder,
      };
    else if (terminal?.cwd) {
      const coreId = terminalCoreId(terminal, data);
      if (coreId)
        target = {
          scope: {
            terminal: terminal.address,
            createdMs: terminal.created_ms,
            coreId,
          },
          name: terminal.cwd.split("/").at(-1) || "Workspace",
          folder: terminal.cwd,
        };
    }
  }
  return (
    <Context
      value={{
        panel,
        target,
        toggle: (next) => setPanel((p) => (p === next ? null : next)),
        close: () => setPanel(null),
      }}
    >
      {children}
    </Context>
  );
}
export function useWorkspaceInspector() {
  const value = use(Context);
  if (!value) throw Error("WorkspaceInspectorProvider missing");
  return value;
}
export function scopeQuery(
  scope: WorkspaceScope,
  extra: Record<string, string> = {},
) {
  return new URLSearchParams({ ...scope, ...extra } as Record<
    string,
    string
  >).toString();
}
