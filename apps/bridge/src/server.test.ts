import { beforeEach, afterEach, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "./store.js";
import { InventoryService } from "./inventory.js";
import { createServer } from "./server.js";
let directory: string,
  store: Store,
  app: Awaited<ReturnType<typeof createServer>>;
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "companion-auth-"));
  store = new Store(directory);
  app = await createServer({
    store,
    inventory: new InventoryService({}),
    origins: ["http://localhost:8081"],
    development: true,
  });
});
afterEach(async () => {
  await app.close();
  store.close();
  rmSync(directory, { recursive: true, force: true });
});
async function paired(platform: "native" | "web" = "native") {
  const pairing = store.createPairing();
  const claim = await app.inject({
    method: "POST",
    url: "/v1/pairing/claim",
    payload: {
      secret: pairing.secret,
      bridgeId: store.bridgeId,
      deviceName: "test phone",
      platform,
    },
  });
  expect(claim.statusCode).toBe(200);
  const pending = claim.json();
  store.approve(pending.id, "owner");
  return {
    pending,
    response: await app.inject({
      method: "GET",
      url: `/v1/pairing/claims/${pending.id}`,
      headers: { authorization: `Bearer ${pending.claimSecret}` },
    }),
  };
}
it("authenticates native devices and immediately refuses revoked credentials", async () => {
  expect((await app.inject("/v1/status")).statusCode).toBe(401);
  const { response } = await paired();
  const headers = { authorization: `Bearer ${response.json().token}` };
  const status = await app.inject({ url: "/v1/status", headers });
  expect(status.statusCode).toBe(200);
  store.revoke(status.json().device.id);
  expect((await app.inject({ url: "/v1/status", headers })).statusCode).toBe(
    401,
  );
});
it("delivers approved credentials exactly once and rejects a reused QR", async () => {
  const { pending, response } = await paired();
  expect(response.json().token).toHaveLength(43);
  expect(
    (
      await app.inject({
        url: `/v1/pairing/claims/${pending.id}`,
        headers: { authorization: `Bearer ${pending.claimSecret}` },
      })
    ).statusCode,
  ).toBe(410);
  const qr = store.createPairing();
  store.claim(qr.secret, "phone", "native");
  expect(() => store.claim(qr.secret, "imposter", "native")).toThrow();
});
it("keeps browser credentials HTTP-only and enforces CSRF and Origin", async () => {
  const { response } = await paired("web");
  expect(response.json().token).toBeUndefined();
  const cookie = response.cookies[0]!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Strict");
  const headers = {
    cookie: `${cookie.name}=${cookie.value}`,
    origin: "http://localhost:8081",
  };
  expect(
    (await app.inject({ method: "POST", url: "/v1/ws-tickets", headers }))
      .statusCode,
  ).toBe(403);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/ws-tickets",
        headers: { ...headers, "x-csrf-token": response.json().csrf },
      })
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await app.inject({
        url: "/healthz",
        headers: { origin: "https://evil.example" },
      })
    ).statusCode,
  ).toBe(403);
});
it("cannot approve expired claims or claim a forged bridge identity", async () => {
  const qr = store.createPairing();
  store.db.prepare("UPDATE pairings SET expires_at=0 WHERE id=?").run(qr.id);
  expect(() => store.claim(qr.secret, "late", "native")).toThrow();
  const result = await app.inject({
    method: "POST",
    url: "/v1/pairing/claim",
    payload: {
      secret: qr.secret,
      bridgeId: "00000000-0000-4000-8000-000000000000",
      deviceName: "phone",
      platform: "native",
    },
  });
  expect(result.statusCode).toBe(403);
});
it("does not expose credential material in device lists", async () => {
  const { response } = await paired();
  const result = await app.inject({
    url: "/v1/devices",
    headers: { authorization: `Bearer ${response.json().token}` },
  });
  expect(result.statusCode).toBe(200);
  expect(result.body).not.toContain("token");
  expect(result.body).not.toContain("secret");
});
it("uses a one-use WebSocket ticket and rejects commands immediately after revocation", async () => {
  const { response } = await paired();
  const token = response.json().token;
  const ticket = await app.inject({
    method: "POST",
    url: "/v1/ws-tickets",
    headers: { authorization: `Bearer ${token}` },
  });
  const ws = await app.injectWS(`/v1/ws?ticket=${ticket.json().ticket}`);
  const messages: any[] = [];
  ws.on("message", (data) => messages.push(JSON.parse(data.toString())));
  ws.send(JSON.stringify({ type: "subscribeInventory" }));
  await expect
    .poll(() => messages.some((m) => m.type === "inventorySnapshot"))
    .toBe(true);
  const reused = await app.injectWS(`/v1/ws?ticket=${ticket.json().ticket}`);
  const reusedClose = new Promise<number>((resolve) =>
    reused.on("close", (code) => resolve(code)),
  );
  expect(await reusedClose).toBe(1008);
  const device = store.authenticate(token)!;
  store.revoke(device.id);
  const closed = new Promise<number>((resolve) =>
    ws.on("close", (code) => resolve(code)),
  );
  ws.send(JSON.stringify({ type: "ping" }));
  expect(await closed).toBe(1008);
});
it("isolates authenticated rate budgets for devices sharing an IP", async () => {
  const first = await paired(),
    second = await paired();
  const a = { authorization: `Bearer ${first.response.json().token}` };
  const b = { authorization: `Bearer ${second.response.json().token}` };
  for (let i = 0; i < 120; i++)
    expect(
      (await app.inject({ url: "/v1/status", headers: a })).statusCode,
    ).toBe(200);
  const limited = await app.inject({ url: "/v1/status", headers: a });
  expect(limited.statusCode).toBe(429);
  expect(limited.json().message).toContain("wait a minute");
  expect((await app.inject({ url: "/v1/status", headers: b })).statusCode).toBe(
    200,
  );
});
it("protects creation with authentication, observer permissions, owner-only machine access and CSRF", async () => {
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/workspace/create",
        payload: {},
      })
    ).statusCode,
  ).toBe(401);
  const { response } = await paired();
  const token = response.json().token;
  const device = store.authenticate(token)!;
  store.db
    .prepare("UPDATE devices SET role=? WHERE id=?")
    .run("observer", device.id);
  const headers = { authorization: `Bearer ${token}` };
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/workspace/create",
        headers,
        payload: {},
      })
    ).statusCode,
  ).toBe(403);
  store.db
    .prepare("UPDATE devices SET role=? WHERE id=?")
    .run("controller", device.id);
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/workspace/create",
        headers,
        payload: { kind: "machine", name: "box", target: "host", session: "" },
      })
    ).statusCode,
  ).toBe(403);
  const web = await paired("web"),
    cookie = web.response.cookies[0]!;
  expect(
    (
      await app.inject({
        method: "POST",
        url: "/v1/workspace/create",
        headers: {
          cookie: `${cookie.name}=${cookie.value}`,
          origin: "http://localhost:8081",
        },
        payload: {
          kind: "space",
          coreId: "local",
          name: "Project",
          folder: "/tmp",
        },
      })
    ).statusCode,
  ).toBe(403);
});
it("requires a paired device for every workspace file and diff endpoint", async () => {
  for (const kind of ["tree", "file", "changes", "diff"])
    expect(
      (await app.inject(`/v1/workspace/${kind}?coreId=local&spaceId=local:s`))
        .statusCode,
    ).toBe(401);
});
