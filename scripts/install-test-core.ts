import {
  readFile,
  mkdir,
  mkdtemp,
  writeFile,
  rm,
  copyFile,
  chmod,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const manifest = JSON.parse(
  await readFile("vendor/herdr-core/release-0.1.14.json", "utf8"),
);
const platform =
  process.platform === "darwin"
    ? "macos"
    : process.platform === "linux"
      ? "linux"
      : null;
if (!platform)
  throw Error("This development installer supports macOS and Linux only");
const arch =
  process.arch === "arm64"
    ? "aarch64"
    : process.arch === "x64"
      ? "x86_64"
      : null;
const asset = manifest.targets[`${platform}-${arch}`];
if (!asset) throw Error("Unsupported architecture");
const response = await fetch(asset.url);
if (!response.ok) throw Error(`Core download failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
  throw Error("Core release checksum mismatch");
const directory = await mkdtemp(join(tmpdir(), "companion-install-"));
try {
  const archive = join(directory, "core.tar.gz");
  await writeFile(archive, bytes);
  execFileSync("tar", ["-xzf", archive, "-C", directory]);
  await mkdir(".data/bin", { recursive: true });
  const path = resolve(".data/bin/hc");
  await copyFile(join(directory, "herdr-core"), path);
  await chmod(path, 0o755);
  console.log(
    `Installed ${execFileSync(path, ["--version"]).toString().trim()} to ${path}`,
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
