import { z } from "zod";
import type { CoreMethods, Terminal } from "@companion/core-client/types";
export type Role = "owner" | "controller" | "observer";
export interface DesktopSpace {
  id: string;
  name: string;
  folder: string;
  coreId: string;
  machine: string | null;
  tabs: { id: string; name: string; terminals: string[] }[];
}
export interface Inventory {
  connectionEpoch: string;
  observedAt: number;
  connected: boolean;
  error?: string;
  warnings?: string[];
  core?: CoreMethods["hello"]["result"];
  machines: CoreMethods["machine.list"]["result"]["machines"];
  terminals: Terminal[];
  spaces?: DesktopSpace[];
}
export const claimRequest = z
  .object({
    secret: z.string().min(40).max(128),
    bridgeId: z.uuid(),
    deviceName: z.string().trim().min(1).max(80),
    platform: z.enum(["native", "web"]),
  })
  .strict();
export const wsCommand = z.discriminatedUnion("type", [
  z.object({ type: z.literal("subscribeInventory") }),
  z.object({
    type: z.literal("attachTerminal"),
    coreId: z.string().min(1).max(128),
    terminal: z.string().min(1).max(200),
    createdMs: z.string().regex(/^\d+$/),
    mode: z.enum(["observe", "control"]),
    cols: z.number().int().min(1).max(500),
    rows: z.number().int().min(1).max(300),
  }),
  z.object({ type: z.literal("detachTerminal"), streamId: z.uuid() }),
  z.object({
    type: z.literal("terminalInput"),
    requestId: z.uuid().optional(),
    streamId: z.uuid(),
    data: z.string().max(65536),
  }),
  z.object({
    type: z.literal("terminalResize"),
    streamId: z.uuid(),
    cols: z.number().int().min(1).max(500),
    rows: z.number().int().min(1).max(300),
  }),
  z.object({
    type: z.literal("terminalCredit"),
    streamId: z.uuid(),
    bytes: z
      .number()
      .int()
      .min(1)
      .max(4 * 1024 * 1024),
  }),
  z.object({ type: z.literal("ping") }),
]);
export type WsCommand = z.infer<typeof wsCommand>;
export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  delivery: "not_sent" | "unknown" | "confirmed";
}
/** v1 binary envelope: UUID[16], kind u8, payload length u32 LE, payload. Output sequence is sent in preceding terminalOutput metadata. */
export const TERMINAL_HEADER_BYTES = 21;

export type CreationKind = "space" | "terminal" | "agent" | "machine";
export interface CreationResult {
  spaceId?: string;
  tabId?: string;
  address?: string;
  createdMs?: string;
  coreId?: string;
  machine?: string;
  warning?: string;
}

export interface WorkspaceScope {
  coreId: string;
  spaceId?: string;
  terminal?: string;
  createdMs?: string;
}
export interface WorkspaceFile {
  name: string;
  path: string;
  kind: "directory" | "file" | "symlink";
}
export interface WorkspaceTree {
  path: string;
  entries: WorkspaceFile[];
  truncated: boolean;
}
export interface WorkspaceFileContent {
  media?: { kind: WorkspaceMediaKind; mime: string; previewable: boolean };
  path: string;
  content: string;
  binary: boolean;
  truncated: boolean;
  size: number;
}
export interface WorkspaceChange {
  path: string;
  oldPath?: string;
  index: string;
  worktree: string;
  untracked: boolean;
}
export interface WorkspaceChanges {
  branch: string;
  files: WorkspaceChange[];
}
export interface WorkspaceDiff {
  path: string;
  patch: string;
  stage: "working" | "staged";
  truncated: boolean;
}

/** Development-only HTTP hosts; callers must separately require development mode. */
export function isDevelopmentHost(hostname: string): boolean {
  if (["localhost", "127.0.0.1", "[::1]"].includes(hostname)) return true;
  const octets = hostname.split(".");
  if (
    octets.length !== 4 ||
    octets.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)
  )
    return false;
  const [a, b] = octets.map(Number);
  return (
    a === 10 || (a === 172 && b! >= 16 && b! <= 31) || (a === 192 && b === 168)
  );
}

export type WorkspaceMediaKind = "image" | "audio" | "video" | "pdf";
export interface WorkspaceMedia {
  mime: string;
  kind: WorkspaceMediaKind;
  size: number;
  data: string;
}
