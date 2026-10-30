import type { ReactNode } from "react";
export default function ContextMenuTarget({
  children,
  onOpen,
}: {
  children: ReactNode;
  onOpen: (point?: { x: number; y: number }) => void;
}) {
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        onOpen({ x: e.clientX, y: e.clientY });
      }}
      style={{ display: "contents" }}
    >
      {children}
    </div>
  );
}
