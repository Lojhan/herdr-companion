export type TaskStatus =
  | "draft"
  | "provisioning"
  | "active"
  | "merged"
  | "cleanup_pending"
  | "cleaned"
  | "archived"
  | "provisioning_failed"
  | "needs_attention"
  | "cleanup_blocked"
  | "cancelled";
const transitions: Record<TaskStatus, readonly TaskStatus[]> = {
  draft: ["provisioning", "cancelled"],
  provisioning: ["active", "provisioning_failed", "needs_attention"],
  active: ["merged", "needs_attention", "cancelled"],
  merged: ["cleanup_pending", "cleanup_blocked"],
  cleanup_pending: ["cleaned", "cleanup_blocked"],
  cleaned: ["archived"],
  archived: [],
  provisioning_failed: ["provisioning", "cancelled"],
  needs_attention: ["active", "provisioning", "merged", "cancelled"],
  cleanup_blocked: ["cleanup_pending", "merged"],
  cancelled: ["archived"],
};
export function transitionTask(from: TaskStatus, to: TaskStatus): TaskStatus {
  if (!transitions[from].includes(to))
    throw Error(`Invalid task transition: ${from} → ${to}`);
  return to;
}
