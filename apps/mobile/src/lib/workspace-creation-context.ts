import { createContext } from "react";
import type { CreationKind } from "@companion/contracts";
export interface CreationIntent {
  kind: CreationKind;
  spaceId?: string;
}
export const WorkspaceCreationContext = createContext<{
  intent: CreationIntent | null;
  open: (intent: CreationIntent) => void;
  close: () => void;
} | null>(null);
