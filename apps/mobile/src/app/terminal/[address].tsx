import { useLocalSearchParams } from "expo-router";
import { useInventory } from "@/lib/coordinator";
import { terminalLabel } from "@/lib/workspace";
import TerminalSession from "@/components/terminal-session";
export default function TerminalScreen() {
  const { address, createdMs, coreId } = useLocalSearchParams<{
    address: string;
    createdMs: string;
    coreId: string;
  }>();
  const { data } = useInventory();
  const terminal = data?.terminals.find(
    (terminal) =>
      terminal.address === address && terminal.created_ms === createdMs,
  );
  return (
    <TerminalSession
      key={`${coreId}:${address}:${createdMs}`}
      address={address}
      createdMs={createdMs}
      coreId={coreId}
      title={terminal ? terminalLabel(terminal) : address}
    />
  );
}
