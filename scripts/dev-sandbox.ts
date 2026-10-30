import { networkInterfaces } from "node:os";
import { isDevelopmentHost } from "../packages/contracts/src/index.js";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { CoreClient } from "../packages/core-client/src/index.js";
import {
  Store,
  InventoryService,
  createServer,
} from "../apps/bridge/src/index.js";
const directory = resolve(".data/sandbox");
await mkdir(join(directory, "runtime"), { recursive: true, mode: 0o700 });
const env = {
  ...process.env,
  XDG_STATE_HOME: join(directory, "state"),
  XDG_CONFIG_HOME: join(directory, "config"),
  XDG_RUNTIME_DIR: join(directory, "runtime"),
  HC_SESSION: "companion-sandbox",
  HC_SOCKET: join(directory, "core.sock"),
};
const executable =
  process.env.COMPANION_HC ?? `${process.env.HOME}/.local/bin/hc`;
const core = await CoreClient.open({ executable, env });
core.close();
await writeFile(
  join(directory, "core-env.json"),
  JSON.stringify(
    {
      executable,
      env: Object.fromEntries(
        Object.entries(env).filter(
          ([key]) => key.startsWith("XDG_") || key.startsWith("HC_"),
        ),
      ),
    },
    null,
    2,
  ),
);
const lan = process.argv.includes("--lan");
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter(
    (a) => a?.family === "IPv4" && !a.internal && isDevelopmentHost(a.address),
  )
  .map((a) => a!.address);
const store = new Store(join(directory, "bridge")),
  inventory = new InventoryService({ executable, env });
const app = await createServer({
  store,
  inventory,
  origins: [
    "http://localhost:8081",
    "http://localhost:8082",
    ...(lan
      ? lanAddresses.flatMap((address) => [
          `http://${address}:8081`,
          `http://${address}:8082`,
        ])
      : []),
  ],
  development: true,
  lanOnly: lan,
  logger: true,
});
await inventory.start();
await app.listen({ host: lan ? "0.0.0.0" : "127.0.0.1", port: 7318 });
console.log(
  "Sandbox ready. Pair with: pnpm companion pair --endpoint http://localhost:7318 --development --data .data/sandbox/bridge",
);
if (lan)
  console.log(
    "LAN bridge:",
    lanAddresses.map((address) => `http://${address}:7318`).join(", "),
  );
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    void app.close().then(() => store.close());
  });
