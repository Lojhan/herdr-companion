import { it, expect, vi } from "vitest";
import { CoreRpcError } from "@companion/core-client";
import { createWorkspaceResource, creationInput } from "./workspace-create.js";
import type { InventoryService } from "./inventory.js";
function fixture() {
  const original = {
    extra: { keep: true },
    spaces: [
      {
        id: "s",
        name: "Project",
        folder: "/tmp",
        custom: "retain",
        tabs: [
          { id: "old", name: "Original", root: { type: "row", children: [] } },
        ],
      },
    ],
  };
  let document = structuredClone(original),
    version = 1;
  let conflict = false;
  const call = vi.fn(async (method: string, params: any) => {
    if (method === "doc.get")
      return { version: String(version), value: structuredClone(document) };
    if (method === "terminal.run") return { address: "t8" };
    if (method === "terminal.get") return { created_ms: "456" };
    if (method === "doc.set") {
      if (conflict) {
        conflict = false;
        version++;
        document.spaces[0]!.tabs.push({
          id: "desktop",
          name: "Concurrent desktop tab",
          root: { type: "row", children: [] },
        });
        throw new CoreRpcError("version changed", "conflict", "confirmed");
      }
      expect(params.version).toBe(String(version));
      document = params.value;
      version++;
      return { version: String(version) };
    }
    if (method === "machine.add") return { name: params.name };
    throw Error(method);
  });
  const inventory = {
    client: { hello: { core: { id: "local" } }, call },
    snapshot: { connected: true, machines: [] },
    refreshDocuments: vi.fn(async () => {}),
    refreshMachines: vi.fn(async () => {}),
  } as unknown as InventoryService;
  return {
    inventory,
    call,
    original,
    document: () => document,
    conflict: () => {
      conflict = true;
    },
  };
}
it("appends a tab without replacing existing layout fields and retries CAS without relaunching", async () => {
  const f = fixture();
  f.conflict();
  const result = await createWorkspaceResource(f.inventory, {
    kind: "terminal",
    coreId: "local",
    spaceId: "local:s",
    name: "Shell",
    command: "",
  });
  expect(result.spaceId).toBe("local:s");
  expect(result.address).toBe("t8");
  expect(f.call.mock.calls.filter(([m]) => m === "terminal.run")).toHaveLength(
    1,
  );
  const doc = f.document();
  expect(doc.extra).toEqual(f.original.extra);
  expect(doc.spaces[0]?.custom).toBe("retain");
  expect(doc.spaces[0]?.tabs.map((t) => t.name)).toEqual([
    "Original",
    "Concurrent desktop tab",
    "Shell",
  ]);
});
it("refuses stale or wrong-machine workspaces before launching a process", async () => {
  const f = fixture();
  await expect(
    createWorkspaceResource(f.inventory, {
      kind: "agent",
      coreId: "local",
      spaceId: "other:s",
      name: "Agent",
      command: "codex",
    }),
  ).rejects.toThrow("does not belong");
  await expect(
    createWorkspaceResource(f.inventory, {
      kind: "agent",
      coreId: "local",
      spaceId: "local:deleted",
      name: "Agent",
      command: "codex",
    }),
  ).rejects.toThrow("no longer exists");
  expect(f.call.mock.calls.some(([m]) => m === "terminal.run")).toBe(false);
});
it("returns the launched terminal if shared layout storage fails", async () => {
  const f = fixture();
  const call = f.call.getMockImplementation()!;
  f.call.mockImplementation(async (m, p) => {
    if (m === "doc.set") throw Error("offline");
    return call(m, p);
  });
  const result = await createWorkspaceResource(f.inventory, {
    kind: "agent",
    coreId: "local",
    spaceId: "local:s",
    name: "Agent",
    command: "codex",
  });
  expect(result).toMatchObject({
    address: "t8",
    createdMs: "456",
    coreId: "local",
  });
  expect(result.warning).toContain("Terminal started");
  expect(f.call.mock.calls.filter(([m]) => m === "terminal.run")).toHaveLength(
    1,
  );
});
it("rejects unsupported machine commands and option-like SSH targets", () => {
  for (const target of [
    "-oProxyCommand",
    "host;whoami",
    "user@host with spaces",
  ])
    expect(
      creationInput.safeParse({
        kind: "machine",
        name: "host",
        target,
        session: "",
      }).success,
    ).toBe(false);
  expect(
    creationInput.safeParse({
      kind: "machine",
      name: "build",
      target: "user@host",
      session: "scratch",
    }).success,
  ).toBe(true);
});
it("routes remote workspace writes to the owning core and stores machine-local terminal references", async () => {
  const f = fixture();
  f.inventory.snapshot.machines = [
    { id: "remote", name: "box", state: "connected" } as any,
  ];
  const call = f.call.getMockImplementation()!;
  f.call.mockImplementation(async (m, p) =>
    m === "terminal.run" ? { address: "box/t8" } : call(m, p),
  );
  const result = await createWorkspaceResource(f.inventory, {
    kind: "agent",
    coreId: "remote",
    spaceId: "remote:s",
    name: "Remote agent",
    command: "codex",
  });
  expect(result.spaceId).toBe("remote:s");
  expect(
    f.call.mock.calls.find(([m]) => m === "terminal.run")?.[1],
  ).toMatchObject({ on: "box", line: "codex", cwd: "/tmp" });
  const saved = f.call.mock.calls.find(([m]) => m === "doc.set")?.[1];
  expect(saved.on).toBe("box");
  expect(saved.value.spaces[0].tabs.at(-1).root.content.terminal).toBe("t8");
});
it("adds a named SSH machine using the constrained core API and refreshes inventory", async () => {
  const f = fixture();
  const result = await createWorkspaceResource(f.inventory, {
    kind: "machine",
    name: "build",
    target: "user@host",
    session: "scratch",
  });
  expect(result.machine).toBe("build");
  expect(f.call).toHaveBeenCalledWith("machine.add", {
    name: "build",
    target: "user@host",
    session: "scratch",
  });
  expect(f.inventory.refreshMachines).toHaveBeenCalledOnce();
});
