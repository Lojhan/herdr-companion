import { test, expect, type Page } from "@playwright/test";
import { Store } from "../../apps/bridge/src/store";
import { CoreClient } from "../../packages/core-client/src/index";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
let core: CoreClient;
const spaceId = "companion-browser-acceptance";
test.beforeAll(async () => {
  const config = JSON.parse(
    readFileSync(".data/sandbox/core-env.json", "utf8"),
  );
  core = await CoreClient.open({
    executable: config.executable,
    env: { ...process.env, ...config.env },
  });
  const snapshot = await core.call("events.subscribe", {});
  const terminal = snapshot.terminals.find(
    (terminal) => terminal.labels["companion.demo"] === "true",
  );
  if (!terminal) throw Error("Sandbox test terminal missing");
  const document = await core.call("doc.get", { name: "herdr-app" });
  const value = (document.value ?? { spaces: [] }) as { spaces: any[] };
  await core.call("doc.set", {
    name: "herdr-app",
    version: document.version,
    value: {
      ...value,
      spaces: [
        ...value.spaces.filter((space) => space.id !== spaceId),
        {
          id: spaceId,
          name: "Companion acceptance",
          folder: terminal.cwd,
          tabs: [
            {
              id: "acceptance-terminal",
              name: "Terminal",
              root: {
                id: "acceptance-pane",
                type: "block",
                content: { terminal: terminal.address },
              },
            },
          ],
        },
      ],
    },
  });
});
test.afterAll(async () => {
  if (!core) return;
  try {
    const document = await core.call("doc.get", { name: "herdr-app" });
    const value = document.value as { spaces: any[] };
    await core.call("doc.set", {
      name: "herdr-app",
      version: document.version,
      value: {
        ...value,
        spaces: value.spaces.filter((space) => space.id !== spaceId),
      },
    });
  } finally {
    core.close();
  }
});
async function pairBrowser(page: Page) {
  const store = new Store(resolve(".data/sandbox/bridge"));
  const pairing = store.createPairing();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Device name").fill("Browser acceptance");
  await page
    .getByLabel("Pairing details")
    .fill(JSON.stringify({ ...pairing, endpoint: "http://localhost:7318" }));
  await page.getByRole("button", { name: "Pair this device" }).click();
  await expect(page.getByText(/Waiting for local approval/)).toBeVisible();
  store.approve(pairing.id, "owner");
  await expect(
    page.getByText("Device paired. Your inventory is ready."),
  ).toBeVisible();
  return () => {
    const pair = store.db
      .prepare("SELECT device_id FROM pairings WHERE id=?")
      .get(pairing.id) as { device_id: string };
    store.revoke(pair.device_id);
    store.close();
  };
}
test("desktop workspace keeps spaces and agents beside a real terminal across control and reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const message = `browser-${Date.now()}`;
  await page.goto("/");
  await expect(page.getByText("Connect to your workspace")).toBeVisible();
  const cleanup = await pairBrowser(page);
  try {
    await page
      .getByRole("button", { name: "Herdr workspace", exact: true })
      .click();
    await expect(page.getByText("Core connected")).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Open space Companion acceptance",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Open space Companion acceptance",
        exact: true,
      })
      .click();
    await expect(
      page
        .getByTestId("terminal-connection")
        .filter({ hasText: /^Connected$/ }),
    ).toBeVisible();
    await expect(page.getByTestId("workspace-sidebar")).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Terminal", exact: true }),
    ).toBeVisible();
    const sidebar = await page.getByTestId("workspace-sidebar").boundingBox();
    expect(sidebar?.width).toBe(268);
    await page.screenshot({
      path: "test-results/herdr-desktop.png",
      fullPage: true,
    });
    await expect(
      page
        .getByTestId("terminal-connection")
        .filter({ hasText: /^Connected$/ }),
    ).toBeVisible();
    await page.locator(".xterm-helper-textarea").focus();
    await page.keyboard.type(message);
    await page.keyboard.press("Enter");
    await expect(page.locator(".xterm-accessibility")).toContainText(
      `received:${message}`,
    );
    await page.reload();
    await expect(
      page
        .getByTestId("terminal-connection")
        .filter({ hasText: /^Connected$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: `received:${message}` }),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    expect(
      (await page.getByTestId("workspace-sidebar").boundingBox())?.width,
    ).toBe(45);
    await page.getByRole("button", { name: "Expand sidebar" }).click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: "Paper", exact: true }).click();
    await page.screenshot({
      path: "test-results/herdr-paper.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Graphite", exact: true }).click();
    const cookies = await page.context().cookies();
    expect(
      cookies.find((cookie) => cookie.name === "companion_session")?.httpOnly,
    ).toBe(true);
    expect(
      (await page.evaluate(() => Object.keys(localStorage))).sort(),
    ).toEqual(["appearance", "coordinator"]);
    expect(errors).toEqual([]);
  } finally {
    cleanup();
  }
});
test("phone uses a full-width list and a separate detail page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.locator("[data-testid=workspace-list]:visible"),
  ).toHaveCount(1);
  await expect(page.getByTestId("workspace-sidebar")).toHaveCount(0);
  const cleanup = await pairBrowser(page);
  try {
    await page
      .getByRole("button", { name: "Back to spaces and agents" })
      .click();
    await expect(
      page.locator("[data-testid=workspace-list]:visible"),
    ).toHaveCount(1);
    await page.screenshot({
      path: "test-results/herdr-mobile-list.png",
      fullPage: true,
    });
    await page
      .getByRole("button", {
        name: "Open space Companion acceptance",
        exact: true,
      })
      .click();
    await expect(
      page
        .getByTestId("terminal-connection")
        .filter({ hasText: /^Connected$/ }),
    ).toBeVisible();
    await expect(
      page.locator("[data-testid=workspace-list]:visible"),
    ).toHaveCount(0);
    await expect(page.getByTestId("workspace-sidebar")).toHaveCount(0);
    await page.screenshot({
      path: "test-results/herdr-mobile-terminal.png",
      fullPage: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    expect(overflow).toBe(false);
    await page
      .getByRole("button", { name: "Back to spaces and agents" })
      .click();
    await expect(
      page.locator("[data-testid=workspace-list]:visible"),
    ).toHaveCount(1);
  } finally {
    cleanup();
  }
});
