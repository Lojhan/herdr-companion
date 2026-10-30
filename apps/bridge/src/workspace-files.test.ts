import { beforeEach, afterEach, it, expect } from "vitest";
import {
  mkdtempSync,
  realpathSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  listWorkspaceFiles,
  readWorkspaceFile,
  workspaceChanges,
  workspaceDiff,
  workspaceRoot,
  fileQuery,
  readWorkspaceMedia,
  workspaceAsset,
} from "./workspace-files.js";
import type { InventoryService } from "./inventory.js";
let root: string, outside: string;
const git = (...args: string[]) =>
  execFileSync(
    "git",
    [
      "-C",
      root,
      "-c",
      "core.hooksPath=/dev/null",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    { encoding: "utf8" },
  );
beforeEach(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), "companion-files-")));
  outside = mkdtempSync(join(tmpdir(), "companion-outside-"));
  git("init", "--initial-branch=main");
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "src", "hello.ts"), "export const count = 1;\n");
  writeFileSync(join(root, "staged.txt"), "old\n");
  writeFileSync(join(root, "deleted.txt"), "removed\n");
  writeFileSync(join(root, "rename me.txt"), "rename\n");
  git("add", ".");
  git(
    "-c",
    "user.name=Companion Test",
    "-c",
    "user.email=test@example.invalid",
    "commit",
    "--no-verify",
    "-m",
    "fixture",
  );
  writeFileSync(join(root, "src", "hello.ts"), "export const count = 2;\n");
  writeFileSync(join(root, "staged.txt"), "new\n");
  git("add", "staged.txt");
  git("mv", "rename me.txt", "renamed.txt");
  unlinkSync(join(root, "deleted.txt"));
  writeFileSync(join(root, "new file.txt"), "untracked\n");
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(outside, { recursive: true, force: true });
});
it("lists files lazily and previews text/binary with a bounded read", async () => {
  const tree = await listWorkspaceFiles(root, "");
  expect(tree.entries[0]?.name).toBe("src");
  expect(tree.entries.some((e) => e.name === ".git")).toBe(false);
  expect((await readWorkspaceFile(root, "src/hello.ts")).content).toBe(
    "export const count = 2;\n",
  );
  writeFileSync(join(root, "image.bin"), Buffer.from([0, 1, 2]));
  expect((await readWorkspaceFile(root, "image.bin")).binary).toBe(true);
  writeFileSync(join(root, "large.txt"), "a".repeat(300000));
  const big = await readWorkspaceFile(root, "large.txt");
  expect(big.content.length).toBe(256 * 1024);
  expect(big.truncated).toBe(true);
});
it("rejects traversal, Git internals and links outside the workspace", async () => {
  writeFileSync(join(outside, "secret.txt"), "not inside");
  symlinkSync(outside, join(root, "outside"));
  for (const path of [
    "../secret.txt",
    "/etc/passwd",
    ".git/config",
    "outside/secret.txt",
  ])
    await expect(readWorkspaceFile(root, path)).rejects.toThrow();
  await expect(listWorkspaceFiles(root, "outside")).rejects.toThrow("outside");
});
it("reads real Git changes including staged, renamed, deleted and untracked files", async () => {
  const changes = await workspaceChanges(root);
  expect(changes.branch).toBe("main");
  expect(changes.files).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: "src/hello.ts",
        index: " ",
        worktree: "M",
      }),
      expect.objectContaining({
        path: "staged.txt",
        index: "M",
        worktree: " ",
      }),
      expect.objectContaining({
        path: "renamed.txt",
        oldPath: "rename me.txt",
        index: "R",
      }),
      expect.objectContaining({ path: "new file.txt", untracked: true }),
      expect.objectContaining({ path: "deleted.txt", worktree: "D" }),
    ]),
  );
  expect(
    (await workspaceDiff(root, "src/hello.ts", "working")).patch,
  ).toContain("+export const count = 2;");
  expect((await workspaceDiff(root, "staged.txt", "staged")).patch).toContain(
    "+new",
  );
  expect(
    (await workspaceDiff(root, "new file.txt", "working")).patch,
  ).toContain("+untracked");
  expect((await workspaceDiff(root, "deleted.txt", "working")).patch).toContain(
    "-removed",
  );
});
it("limits nested-workspace Git status and refuses replaced core identities", async () => {
  expect(
    (await workspaceChanges(join(root, "src"))).files.map((f) => f.path),
  ).toEqual(["hello.ts"]);
  const inventory = {
    snapshot: {
      connected: true,
      core: { core: { id: "local" } },
      spaces: [{ id: "local:s", coreId: "local", folder: root }],
      terminals: [],
    },
  } as unknown as InventoryService;
  expect(
    await workspaceRoot(
      inventory,
      fileQuery.parse({ coreId: "local", spaceId: "local:s" }),
    ),
  ).toBe(root);
  await expect(
    workspaceRoot(
      inventory,
      fileQuery.parse({ coreId: "replaced", spaceId: "local:s" }),
    ),
  ).rejects.toThrow("coordinator machine");
});

it("previews media from bytes and streams exact download ranges", async () => {
  const bytes = Buffer.from("89504e470d0a1a0a0001020304050607", "hex");
  writeFileSync(join(root, "preview.png"), bytes);
  const file = await readWorkspaceFile(root, "preview.png");
  expect(file.media).toEqual({
    kind: "image",
    mime: "image/png",
    previewable: true,
  });
  const media = await readWorkspaceMedia(root, "preview.png");
  expect(Buffer.from(media.data, "base64")).toEqual(bytes);
  for (const [range, expected] of [
    [undefined, bytes],
    ["bytes=2-5", bytes.subarray(2, 6)],
    ["bytes=-4", bytes.subarray(-4)],
  ] as const) {
    const asset = await workspaceAsset(root, "preview.png", range);
    const chunks: Buffer[] = [];
    for await (const chunk of asset.stream) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks)).toEqual(expected);
    expect(asset.length).toBe(expected.length);
    expect(asset.partial).toBe(!!range);
  }
  await expect(
    workspaceAsset(root, "preview.png", "bytes=999-"),
  ).rejects.toMatchObject({ status: 416 });
  await expect(
    workspaceAsset(root, "preview.png", "bytes=0-2,5-7"),
  ).rejects.toMatchObject({ status: 416 });
  await expect(workspaceAsset(root, "../outside.png")).rejects.toThrow();
  await expect(readWorkspaceMedia(root, "staged.txt")).rejects.toThrow(
    "format",
  );
});
