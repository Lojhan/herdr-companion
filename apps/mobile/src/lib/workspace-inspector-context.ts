import { createContext } from "react";
import type { WorkspaceScope } from "@companion/contracts";
export type InspectorPanel = "files" | "changes";
export interface InspectorTarget {
  scope: WorkspaceScope;
  name: string;
  folder: string;
}
export const WorkspaceInspectorContext = createContext<{
  panel: InspectorPanel | null;
  target: InspectorTarget | null;
  toggle: (panel: InspectorPanel) => void;
  close: () => void;
} | null>(null);
