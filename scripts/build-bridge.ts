import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
await build({
  entryPoints: ["apps/bridge/src/cli.ts"],
  outfile: "apps/bridge/dist/cli.js",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  external: [
    "fastify",
    "@fastify/*",
    "better-sqlite3",
    "ws",
    "lossless-json",
    "zod",
  ],
});
await mkdir("apps/bridge/migrations", { recursive: true });
