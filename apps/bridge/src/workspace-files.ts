import { createReadStream } from "node:fs";
import { basename, extname } from "node:path";
import type { WorkspaceMedia, WorkspaceMediaKind } from "@companion/contracts";
import { realpath, readdir, stat, open } from "node:fs/promises";
import { resolve, relative, isAbsolute, sep } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import type {
  WorkspaceTree,
  WorkspaceFileContent,
  WorkspaceChanges,
  WorkspaceChange,
  WorkspaceDiff,
} from "@companion/contracts";
import type { InventoryService } from "./inventory.js";
const exec = promisify(execFile);
export const fileQuery = z
  .object({
    coreId: z.string().min(1).max(128),
    spaceId: z.string().min(1).max(300).optional(),
    terminal: z.string().min(1).max(200).optional(),
    createdMs: z.string().regex(/^\d+$/).optional(),
    path: z.string().max(2048).default(""),
    stage: z.enum(["working", "staged"]).default("working"),
    download: z.enum(["0", "1"]).default("0"),
  })
  .strict();
type Query = z.infer<typeof fileQuery>;
export class WorkspaceFileError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function inside(root: string, path: string) {
  const rel = relative(root, path);
  return (
    rel === "" ||
    (!rel.startsWith(".." + sep) && rel !== ".." && !isAbsolute(rel))
  );
}
function relativePath(root: string, path: string) {
  if (
    path.includes("\0") ||
    path.includes("\\") ||
    path.split("/").includes("..") ||
    isAbsolute(path)
  )
    throw new WorkspaceFileError("Choose a path inside the workspace", 403);
  const full = resolve(root, path);
  if (!inside(root, full) || path.split("/").includes(".git"))
    throw new WorkspaceFileError("Choose a path inside the workspace", 403);
  return full;
}
export async function workspaceRoot(inventory: InventoryService, query: Query) {
  if (!inventory.snapshot.connected)
    throw new WorkspaceFileError("Coordinator is offline", 503);
  if (query.coreId !== inventory.snapshot.core?.core.id)
    throw new WorkspaceFileError(
      "File browsing currently requires a workspace on the coordinator machine",
      409,
    );
  let folder: string | undefined;
  if (query.spaceId) {
    const space = inventory.snapshot.spaces?.find(
      (s) => s.id === query.spaceId && s.coreId === query.coreId,
    );
    folder = space?.folder;
  } else if (query.terminal) {
    const terminal = inventory.snapshot.terminals.find(
      (t) =>
        t.address === query.terminal &&
        t.created_ms === query.createdMs &&
        !t.address.includes("/"),
    );
    folder = terminal?.cwd ?? undefined;
  }
  if (!folder)
    throw new WorkspaceFileError(
      "Choose an available workspace with a project folder",
      404,
    );
  const root = await realpath(folder);
  if (!(await stat(root)).isDirectory())
    throw new WorkspaceFileError("Project folder is unavailable", 404);
  return root;
}
async function checkedPath(root: string, path: string) {
  const full = await realpath(relativePath(root, path));
  if (!inside(root, full))
    throw new WorkspaceFileError("This link points outside the workspace", 403);
  return full;
}
export async function listWorkspaceFiles(
  root: string,
  path: string,
): Promise<WorkspaceTree> {
  const full = await checkedPath(root, path);
  const entries = (await readdir(full, { withFileTypes: true }))
    .filter((e) => e.name !== ".git")
    .sort(
      (a, b) =>
        Number(b.isDirectory()) - Number(a.isDirectory()) ||
        a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
  return {
    path,
    entries: entries.slice(0, 500).map((e) => ({
      name: e.name,
      path: [path, e.name].filter(Boolean).join("/"),
      kind: e.isDirectory()
        ? "directory"
        : e.isSymbolicLink()
          ? "symlink"
          : "file",
    })),
    truncated: entries.length > 500,
  };
}
export async function readWorkspaceFile(
  root: string,
  path: string,
): Promise<WorkspaceFileContent> {
  if (!path) throw new WorkspaceFileError("Choose a file");
  const full = await checkedPath(root, path);
  const info = await stat(full);
  if (!info.isFile())
    throw new WorkspaceFileError("This entry is not a regular file");
  const limit = 256 * 1024,
    buffer = Buffer.alloc(Math.min(info.size, limit));
  const file = await open(full, "r");
  let bytesRead: number;
  try {
    ({ bytesRead } = await file.read(buffer, 0, buffer.length, 0));
  } finally {
    await file.close();
  }
  const bytes = buffer.subarray(0, bytesRead);
  let content = "";
  let binary = bytes.includes(0);
  if (!binary) {
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(bytes, {
        stream: info.size > limit,
      });
    } catch {
      binary = true;
    }
  }
  return {
    path,
    content: binary ? "" : content,
    binary,
    size: info.size,
    ...(mediaType(path, bytes)
      ? {
          media: {
            ...mediaType(path, bytes)!,
            previewable: info.size <= 20 * 1024 * 1024,
          },
        }
      : {}),
    truncated: info.size > limit,
  };
}
async function git(root: string, args: string[]) {
  try {
    const r = await exec(
      "git",
      [
        "--no-pager",
        "--literal-pathspecs",
        "-c",
        "core.fsmonitor=false",
        ...args,
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          GIT_OPTIONAL_LOCKS: "0",
          GIT_TERMINAL_PROMPT: "0",
        },
        maxBuffer: 2 * 1024 * 1024,
        timeout: 10000,
      },
    );
    return r.stdout;
  } catch (error) {
    if ((error as any).code === "ENOENT")
      throw new WorkspaceFileError(
        "Git is not installed on the coordinator",
        503,
      );
    throw new WorkspaceFileError(
      "Git could not read this repository. Check the folder and repository access.",
    );
  }
}
async function repoRoot(root: string) {
  try {
    return await realpath(
      (await git(root, ["rev-parse", "--show-toplevel"])).trim(),
    );
  } catch {
    throw new WorkspaceFileError(
      "This folder is not an accessible Git repository",
    );
  }
}
export function parseGitStatus(
  output: string,
  root: string,
  top: string,
): WorkspaceChange[] {
  const records = output.split("\0");
  const files: WorkspaceChange[] = [];
  for (let i = 0; i < records.length; i++) {
    const record = records[i]!;
    if (!record) continue;
    const index = record[0]!,
      worktree = record[1]!,
      raw = record.slice(3);
    let old: string | undefined;
    if (/[RC]/.test(index + worktree)) old = records[++i];
    const full = resolve(top, raw);
    if (!inside(root, full)) continue;
    const path = relative(root, full).split(sep).join("/");
    if (!path || path.split("/").includes(".git")) continue;
    const oldFull = old ? resolve(top, old) : undefined;
    files.push({
      path,
      ...(oldFull && inside(root, oldFull)
        ? { oldPath: relative(root, oldFull).split(sep).join("/") }
        : {}),
      index,
      worktree,
      untracked: index === "?" && worktree === "?",
    });
  }
  return files;
}
export async function workspaceChanges(
  root: string,
): Promise<WorkspaceChanges> {
  const top = await repoRoot(root);
  const [status, branch] = await Promise.all([
    git(root, [
      "status",
      "--porcelain=v1",
      "-z",
      "--untracked-files=all",
      "--",
      ".",
    ]),
    git(root, ["rev-parse", "--abbrev-ref", "HEAD"]).catch(() =>
      git(root, ["symbolic-ref", "--short", "HEAD"]),
    ),
  ]);
  return { branch: branch.trim(), files: parseGitStatus(status, root, top) };
}
export async function workspaceDiff(
  root: string,
  path: string,
  stage: "working" | "staged",
): Promise<WorkspaceDiff> {
  relativePath(root, path);
  const changes = await workspaceChanges(root),
    change = changes.files.find((f) => f.path === path);
  if (!change)
    throw new WorkspaceFileError("This file has no current changes", 404);
  if (change.untracked) {
    if (stage === "staged")
      throw new WorkspaceFileError("This file is not staged");
    const file = await readWorkspaceFile(root, path);
    const lines = file.content.split("\n");
    if (lines.at(-1) === "") lines.pop();
    return {
      path,
      stage,
      truncated: file.truncated,
      patch: file.binary
        ? "Binary file (untracked)"
        : `--- /dev/null\n+++ b/${path}\n@@ -0,0 +1,${lines.length} @@\n${lines.map((l) => "+" + l).join("\n")}\n`,
    };
  }
  const patch = await git(root, [
    "diff",
    ...(stage === "staged" ? ["--cached"] : []),
    "--no-ext-diff",
    "--no-textconv",
    "--no-color",
    "--",
    path,
    ...(change.oldPath ? [change.oldPath] : []),
  ]);
  return { path, stage, patch, truncated: false };
}

function mediaType(
  path: string,
  bytes: Buffer,
): { kind: WorkspaceMediaKind; mime: string } | null {
  const ext = extname(path).toLowerCase(),
    head = bytes.subarray(0, 128);
  if (
    head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { kind: "image", mime: "image/png" };
  if (head[0] === 255 && head[1] === 216)
    return { kind: "image", mime: "image/jpeg" };
  if (/^GIF8[79]a/.test(head.toString("ascii")))
    return { kind: "image", mime: "image/gif" };
  if (
    head.subarray(0, 4).toString() === "RIFF" &&
    head.subarray(8, 12).toString() === "WEBP"
  )
    return { kind: "image", mime: "image/webp" };
  if (
    ext === ".svg" &&
    bytes.subarray(0, 4096).toString("utf8").includes("<svg")
  )
    return { kind: "image", mime: "image/svg+xml" };
  if (head.subarray(0, 5).toString() === "%PDF-")
    return { kind: "pdf", mime: "application/pdf" };
  if (
    head.subarray(0, 4).toString() === "RIFF" &&
    head.subarray(8, 12).toString() === "WAVE"
  )
    return { kind: "audio", mime: "audio/wav" };
  if (
    head.subarray(0, 3).toString() === "ID3" ||
    (head[0] === 255 && (head[1]! & 224) === 224)
  )
    return { kind: "audio", mime: "audio/mpeg" };
  if (head.subarray(0, 4).toString() === "OggS")
    return {
      kind: ext === ".ogv" ? "video" : "audio",
      mime: ext === ".ogv" ? "video/ogg" : "audio/ogg",
    };
  if (head.subarray(4, 8).toString() === "ftyp")
    return {
      kind: [".m4a", ".aac"].includes(ext) ? "audio" : "video",
      mime: [".m4a", ".aac"].includes(ext)
        ? "audio/mp4"
        : ext === ".mov"
          ? "video/quicktime"
          : "video/mp4",
    };
  if (head.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])))
    return {
      kind: ext === ".weba" ? "audio" : "video",
      mime: ext === ".weba" ? "audio/webm" : "video/webm",
    };
  return null;
}
export async function readWorkspaceMedia(
  root: string,
  path: string,
): Promise<WorkspaceMedia> {
  const full = await checkedPath(root, path),
    info = await stat(full);
  if (!info.isFile())
    throw new WorkspaceFileError("This entry is not a regular file");
  if (info.size > 20 * 1024 * 1024)
    throw new WorkspaceFileError(
      "Media previews are limited to 20 MB. Download the file to open it.",
    );
  const file = await open(full, "r");
  let bytes: Buffer;
  try {
    bytes = await file.readFile();
  } finally {
    await file.close();
  }
  const type = mediaType(path, bytes);
  if (!type)
    throw new WorkspaceFileError("This media format cannot be previewed");
  return { ...type, size: bytes.length, data: bytes.toString("base64") };
}
export async function workspaceAsset(
  root: string,
  path: string,
  range?: string,
) {
  if (!path) throw new WorkspaceFileError("Choose a file");
  const full = await checkedPath(root, path),
    info = await stat(full);
  if (!info.isFile())
    throw new WorkspaceFileError("This entry is not a regular file");
  const file = await open(full, "r"),
    head = Buffer.alloc(4096);
  let count: number;
  try {
    ({ bytesRead: count } = await file.read(head, 0, head.length, 0));
  } finally {
    await file.close();
  }
  const mime =
    mediaType(path, head.subarray(0, count))?.mime ??
    "application/octet-stream";
  let start = 0,
    end = info.size - 1,
    partial = false;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2]))
      throw new WorkspaceFileError("Invalid byte range", 416);
    if (!match[1]) {
      const suffix = Number(match[2]);
      if (!suffix) throw new WorkspaceFileError("Invalid byte range", 416);
      start = Math.max(0, info.size - suffix);
    } else start = Number(match[1]);
    if (match[1] && match[2]) end = Math.min(end, Number(match[2]));
    if (start > end || start >= info.size)
      throw new WorkspaceFileError("Byte range exceeds file size", 416);
    partial = true;
  }
  const stream = info.size
    ? createReadStream(full, { start, end })
    : createReadStream(full);
  return {
    stream,
    mime,
    name: basename(path),
    size: info.size,
    start,
    end,
    partial,
    length: Math.max(0, end - start + 1),
  };
}
