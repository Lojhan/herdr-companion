import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { Harness, type Size } from "../ui/harness";
let h: Harness;
const ownedSpaces: string[] = [];
test.beforeAll(async () => {
  h = new Harness("Creation controls integration");
  await h.start();
  writeFileSync(
    ".data/ui-audit/custom-hotkey-probe.py",
    `import os,sys,tty,termios\nsaved=termios.tcgetattr(0)\ntry:\n tty.setraw(0)\n os.write(1,b'\\r\\nCUSTOM_READY\\r\\n')\n data=b''\n while True:\n  c=os.read(0,1)\n  if c==b'\\x04':break\n  data+=c\n os.write(1,('\\r\\nCUSTOM_KEYS:'+data.hex()+'\\r\\n').encode())\nfinally:\n termios.tcsetattr(0,termios.TCSADRAIN,saved)\n`,
  );
});
test.afterAll(async () => {
  if (!h) return;
  const doc = await h.core.call("doc.get", { name: "herdr-app" }),
    value = doc.value as any;
  value.spaces = value.spaces.filter((s: any) => !ownedSpaces.includes(s.id));
  await h.core.call("doc.set", {
    name: "herdr-app",
    version: doc.version,
    value,
  });
  await h.stop();
});
for (const size of [
  { name: "phone", width: 390, height: 844, touch: true },
  { name: "desktop", width: 1440, height: 900, touch: false },
] satisfies Size[])
  test(`${size.name}: create workspace, shell and agent tabs with direct web input`, async ({
    browser,
    browserName,
  }) => {
    const session = await h.context(browser, size);
    const page = await session.context.newPage();
    const suffix = `${browserName}-${size.name}`,
      name = `Created ${suffix}`;
    async function create(button: string) {
      const response = page.waitForResponse(
        (r) =>
          r.url().endsWith("/v1/workspace/create") &&
          r.request().method() === "POST",
      );
      await page.getByRole("button", { name: button, exact: true }).click();
      const reply = await response;
      expect(reply.status()).toBe(200);
      return reply.json();
    }
    try {
      await page.goto("/");
      await page
        .getByRole("button", { name: "New workspace", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "Workspace name", exact: true })
        .fill(name);
      await page
        .getByRole("textbox", { name: "Project folder", exact: true })
        .fill(resolve(".data/ui-audit"));
      const space = await create("Create workspace");
      ownedSpaces.push(space.spaceId.slice(h.coreId.length + 1));
      await expect(
        page.getByText("No terminal in this tab", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "New terminal tab", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "Tab name", exact: true })
        .fill("Created shell");
      await expect(
        page.getByRole("heading", { name: "New terminal tab", exact: true }),
      ).toHaveCSS("font-size", "15px");
      await expect(
        page.getByRole("textbox", { name: "Tab name", exact: true }),
      ).toHaveCSS("font-size", size.touch ? "16px" : "12.8px");
      mkdirSync(`artifacts/creation/${suffix}`, { recursive: true });
      await page.screenshot({
        animations: "disabled",
        path: `artifacts/creation/${suffix}/new-terminal.png`,
      });
      const shell = await create("Create terminal");
      h.terminals.push(shell.address);
      await expect(
        page.getByRole("tab", { name: "Created shell", exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      await expect(page.getByTestId("terminal-composer")).toHaveCount(0);
      await page.locator(".xterm-helper-textarea:visible").focus();
      await page.keyboard.type("printf 'CREATED_SHELL_OK\\n'");
      await page.keyboard.press("Enter");
      await expect
        .poll(
          async () =>
            (
              await h.core.call("terminal.read", {
                terminal: shell.address,
                lines: 100,
              })
            ).text,
        )
        .toContain("CREATED_SHELL_OK");
      await page
        .getByRole("button", { name: "New terminal tab", exact: true })
        .click();
      await page.getByRole("button", { name: "Agent", exact: true }).click();
      await page
        .getByRole("textbox", { name: "Tab name", exact: true })
        .fill("Created Codex");
      // Start the actual installed CLI; no prompt or model request is submitted.
      await page
        .getByRole("textbox", { name: "Agent command", exact: true })
        .fill("codex");
      const agent = await create("Start agent");
      h.terminals.push(agent.address);
      await expect(
        page.getByRole("tab", { name: "Created Codex", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Created shell", exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      await expect
        .poll(
          async () =>
            (
              await h.core.call("terminal.read", {
                terminal: agent.address,
                lines: 100,
              })
            ).text,
          { timeout: 20000 },
        )
        .toContain("Codex");
      const doc = await h.core.call("doc.get", { name: "herdr-app" }),
        record = (doc.value as any).spaces.find(
          (s: any) => `${h.coreId}:${s.id}` === space.spaceId,
        );
      expect(record.tabs.map((t: any) => t.name)).toEqual([
        "Created shell",
        "Created Codex",
      ]);
      await page.screenshot({
        animations: "disabled",
        path: `artifacts/creation/${suffix}/agent-tabs.png`,
      });
      await page
        .getByRole("tab", { name: "Created shell", exact: true })
        .click();
      if (!size.touch) {
        await page
          .getByRole("button", { name: "Collapse sidebar", exact: true })
          .click();
        for (const label of ["New workspace", "New agent", "Add machine"]) {
          const action = page.getByRole("button", { name: label, exact: true });
          await action.scrollIntoViewIfNeeded();
          const bounds = await action.boundingBox();
          expect(bounds!.width).toBe(28);
          expect(bounds!.height).toBe(28);
          expect(
            await action.evaluate(
              (e) =>
                Array.from(
                  e.parentElement!.querySelectorAll('[role="button"]'),
                ).at(-1) === e,
            ),
          ).toBe(true);
        }
        await page
          .getByRole("button", { name: "Add machine", exact: true })
          .click();
        await expect(
          page.getByRole("textbox", { name: "SSH target", exact: true }),
        ).toBeVisible();
        await page.screenshot({
          animations: "disabled",
          path: `artifacts/creation/${suffix}/add-machine.png`,
        });
        await page
          .getByRole("button", { name: "Close Add machine", exact: true })
          .click();
        await page
          .getByRole("button", { name: "New workspace", exact: true })
          .click();
        await expect(
          page.getByRole("textbox", { name: "Workspace name", exact: true }),
        ).toBeVisible();
        await page
          .getByRole("button", { name: "Close New workspace", exact: true })
          .click();
      }
    } finally {
      await session.close();
    }
  });
