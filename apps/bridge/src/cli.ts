import { isDevelopmentHost } from "@companion/contracts";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { Store } from "./store.js";
import { InventoryService } from "./inventory.js";
import { createServer } from "./server.js";
const args = process.argv.slice(2),
  command = args[0] ?? "help";
const option = (name: string, fallback: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? fallback) : fallback;
};
const directory = resolve(
  option(
    "--data",
    process.env.COMPANION_DATA_DIR ??
      `${homedir()}/.local/share/herdr-companion`,
  ),
);
if (command === "help") {
  console.log(
    "companion serve | pair --endpoint <https URL> | claims | approve <claim-id> [--role owner|controller|observer] | devices | revoke <device-id> | doctor\nOptions: --data <directory>; serve: --port 7318 --hc <executable> --socket <endpoint> --origins <comma-separated URLs> --development",
  );
} else {
  const store = new Store(directory);
  if (command === "serve") {
    const development = args.includes("--development"),
      port = Number(option("--port", "7318"));
    const inventory = new InventoryService({
      executable: option("--hc", process.env.COMPANION_HC ?? "hc"),
      ...(args.includes("--socket") ? { socket: option("--socket", "") } : {}),
    });
    const origins = option(
      "--origins",
      development ? "http://localhost:8081,http://localhost:8082" : "",
    )
      .split(",")
      .filter(Boolean);
    const app = await createServer({
      store,
      inventory,
      origins,
      development,
      logger: true,
    });
    await app.listen({ host: "127.0.0.1", port });
    void inventory.start();
    console.log(
      `Companion bridge ${store.bridgeId}. Run companion pair in another terminal.`,
    );
    let stopping = false;
    for (const signal of ["SIGINT", "SIGTERM"] as const)
      process.on(signal, () => {
        if (stopping) return;
        stopping = true;
        void app.close().then(() => store.close());
      });
  } else {
    try {
      if (command === "pair") {
        const endpoint = new URL(option("--endpoint", "http://localhost:7318"));
        if (
          endpoint.protocol !== "https:" &&
          !(
            args.includes("--development") &&
            isDevelopmentHost(endpoint.hostname)
          )
        )
          throw Error(
            "HTTPS endpoint required; local network HTTP needs --development",
          );
        console.log(
          JSON.stringify(
            { ...store.createPairing(), endpoint: endpoint.origin },
            null,
            2,
          ),
        );
        console.log(
          "Paste these details into Settings. Then run claims and approve <claim-id> locally.",
        );
      } else if (command === "claims") console.table(store.pending());
      else if (command === "approve") {
        const role = option("--role", "owner");
        if (!["owner", "controller", "observer"].includes(role))
          throw Error("Invalid role");
        console.log(
          "Approved device:",
          store.approve(
            args[1] ?? "",
            role as "owner" | "controller" | "observer",
          ),
        );
      } else if (command === "devices")
        console.table(
          store.db
            .prepare("SELECT id,name,role,created_at,revoked_at FROM devices")
            .all(),
        );
      else if (command === "revoke") {
        store.revoke(args[1] ?? "");
        console.log("Device revoked");
      } else if (command === "doctor") {
        const core = await import("@companion/core-client");
        const client = await core.CoreClient.open({
          executable: option("--hc", process.env.COMPANION_HC ?? "hc"),
        });
        console.log({
          node: process.version,
          bridgeId: store.bridgeId,
          core: client.hello,
        });
        client.close();
      } else throw Error("Unknown command; run help");
    } finally {
      store.close();
    }
  }
}
