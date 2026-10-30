import type { CreationResult } from "@companion/contracts";
import { readDesktopSpaces } from "./desktop-spaces.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { CoreRpcError } from "@companion/core-client";
import type { InventoryService } from "./inventory.js";
const text = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[^\x00-\x1f\x7f]+$/);
export const creationInput = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("space"),
      coreId: z.string().min(1).max(128),
      name: text,
      folder: z
        .string()
        .trim()
        .min(1)
        .max(2048)
        .regex(/^[^\x00-\x1f\x7f]+$/),
    })
    .strict(),
  z
    .object({
      kind: z.enum(["terminal", "agent"]),
      coreId: z.string().min(1).max(128),
      spaceId: z.string().min(1).max(300),
      name: text,
      command: z.string().trim().max(4096),
    })
    .strict(),
  z
    .object({
      kind: z.literal("machine"),
      name: z.string().regex(/^[a-z0-9][a-z0-9_.-]{0,31}$/),
      target: z
        .string()
        .trim()
        .min(1)
        .max(200)
        .regex(/^(?!-)[a-zA-Z0-9_@.:[\]-]+$/),
      session: z.string().regex(/^[a-zA-Z0-9_.-]{0,64}$/),
    })
    .strict(),
]);
export class CreationError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function createWorkspaceResource(
  inventory: InventoryService,
  input: z.infer<typeof creationInput>,
): Promise<CreationResult> {
  const core = inventory.client;
  if (!core || !inventory.snapshot.connected)
    throw new CreationError("Coordinator is offline", 503);
  if (input.kind === "machine") {
    const machine = await core.call("machine.add", {
      name: input.name,
      target: input.target,
      ...(input.session ? { session: input.session } : {}),
    });
    await inventory.refreshMachines();
    return { machine: machine.name };
  }
  const coreId = input.coreId;
  const remote = inventory.snapshot.machines.find(
    (m) => m.id === coreId && m.state === "connected",
  );
  if (core.hello?.core.id !== coreId && !remote)
    throw new CreationError("Execution machine changed or is offline", 409);
  const on = remote ? { on: remote.name } : {};
  const qualified = (id: string) => `${coreId}:${id}`;
  const localSpaceId =
    input.kind === "space"
      ? randomUUID()
      : input.spaceId.slice(coreId.length + 1);
  if (input.kind !== "space" && !input.spaceId.startsWith(coreId + ":"))
    throw new CreationError("Workspace does not belong to this machine", 409);
  // Validate and preserve the complete shared desktop document, including unknown fields.
  async function read() {
    const document = await core!.call("doc.get", { name: "herdr-app", ...on });
    const value = document.value ?? { spaces: [] };
    if (typeof value !== "object" || !Array.isArray((value as any).spaces))
      throw new CreationError(
        "This desktop layout format is not supported",
        409,
      );
    const spaces = (value as any).spaces as any[];
    if (
      spaces.some(
        (s) => !s || typeof s.id !== "string" || !Array.isArray(s.tabs),
      )
    )
      throw new CreationError(
        "This desktop layout format is not supported",
        409,
      );
    try {
      readDesktopSpaces(value, coreId, remote?.name ?? null);
    } catch {
      throw new CreationError(
        "This desktop layout format is not supported",
        409,
      );
    }
    return { document, value: value as Record<string, unknown>, spaces };
  }
  let current = await read();
  const existing =
    input.kind === "space"
      ? undefined
      : current.spaces.find((s) => s.id === localSpaceId);
  if (input.kind !== "space" && !existing)
    throw new CreationError(
      "Workspace no longer exists. Refresh and choose another.",
      409,
    );
  if (input.kind === "agent" && !input.command)
    throw new CreationError("Enter the agent command");
  if (current.spaces.length >= 1000 && input.kind === "space")
    throw new CreationError("This machine has reached the workspace limit");
  if (existing?.tabs.length >= 1000)
    throw new CreationError("This workspace has reached the tab limit");
  const tabId = randomUUID();
  let address: string | undefined, createdMs: string | undefined;
  if (input.kind !== "space") {
    // Launch exactly once. Layout conflicts retry only the append, never the process.
    const run = await core.call("terminal.run", {
      ...on,
      ...(input.command ? { line: input.command } : {}),
      cwd: existing.folder || undefined,
      wait: false,
      no_parent: true,
      keep: false,
      rm: false,
      labels: {
        "companion.created": "true",
        "companion.kind": input.kind,
        "companion.space": localSpaceId,
      },
    });
    address = run.address;
    const terminal = await core.call("terminal.get", { terminal: address });
    createdMs = terminal.created_ms;
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const spaces = [...current.spaces];
      if (input.kind === "space")
        spaces.push({
          id: localSpaceId,
          name: input.name,
          folder: input.folder,
          tabs: [],
        });
      else {
        const index = spaces.findIndex((s) => s.id === localSpaceId);
        if (index < 0)
          throw new CreationError(
            "Workspace was removed while the terminal started",
            409,
          );
        const localAddress =
          remote && address!.startsWith(remote.name + "/")
            ? address!.slice(remote.name.length + 1)
            : address!;
        spaces[index] = {
          ...spaces[index],
          tabs: [
            ...spaces[index].tabs,
            {
              id: tabId,
              name: input.name,
              root: {
                id: randomUUID(),
                type: "block",
                content: { terminal: localAddress },
              },
            },
          ],
        };
      }
      await core.call("doc.set", {
        name: "herdr-app",
        ...on,
        version: current.document.version,
        value: { ...current.value, spaces },
      });
      await inventory.refreshDocuments();
      return {
        spaceId: qualified(localSpaceId),
        ...(address
          ? { tabId: qualified(tabId), address, createdMs, coreId }
          : {}),
      };
    } catch (error) {
      if (
        error instanceof CoreRpcError &&
        error.kind === "conflict" &&
        attempt < 3
      ) {
        current = await read();
        continue;
      }
      if (address)
        return {
          address,
          createdMs,
          coreId,
          warning:
            "Terminal started, but its tab could not be saved. Open the terminal below; do not launch it again.",
        };
      throw error;
    }
  }
  throw new CreationError("Layout changed. Refresh and try again.", 409);
}
