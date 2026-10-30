import { use, useState, type ReactNode } from "react";
import {
  WorkspaceCreationContext as Context,
  type CreationIntent,
} from "./workspace-creation-context";
export type { CreationIntent } from "./workspace-creation-context";
export function WorkspaceCreationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [intent, setIntent] = useState<CreationIntent | null>(null);
  return (
    <Context value={{ intent, open: setIntent, close: () => setIntent(null) }}>
      {children}
    </Context>
  );
}
export function useWorkspaceCreation() {
  const value = use(Context);
  if (!value) throw Error("WorkspaceCreationProvider missing");
  return value;
}
