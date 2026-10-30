import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  Harness,
  directory,
  sizes,
  posture,
  inspect,
  shot,
  type Size,
} from "./harness";
let harness: Harness;
test.beforeAll(async () => {
  harness = new Harness();
  await harness.start();
});
test.afterAll(async () => {
  await harness?.stop();
});
for (const size of sizes) {
  test(`${size.name}: every screen, paired live terminal, two themes`, async ({
    browser,
    browserName,
  }) => {
    const session = await harness.context(browser, size),
      page = await session.context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let cdp: any = null;
    let audited = { ...size, hinge: undefined as Size["hinge"] };
    const reports: any[] = [];
    const prefix = `${browserName}/${size.name}`;
    const audit = async (state: string) => {
      if (cdp) {
        await posture(session.context, page, size);
        await expect(page.getByTestId("fold-hinge")).toHaveCount(1);
      }
      const result = await inspect(page, audited);
      reports.push({ state, ...result });
      await shot(page, `${prefix}/${state}`);
      if (cdp) await posture(session.context, page, size);
      expect.soft(result.problems, `${size.name} ${state}`).toEqual([]);
    };
    try {
      await page.goto("/");
      cdp = await posture(session.context, page, size);
      audited = { ...size, hinge: cdp ? size.hinge : undefined };
      await expect(page.getByText("Core connected")).toBeVisible();
      if (cdp) {
        await expect(page.getByTestId("fold-hinge")).toHaveCount(1);
        const r = await page.getByTestId("fold-hinge").boundingBox();
        expect(r?.[size.hinge!.orientation === "vertical" ? "x" : "y"]).toBe(
          size.hinge!.offset,
        );
      }
      await audit("workspace-graphite");
      await page
        .getByRole("button", {
          name: `Open space ${harness.label}`,
          exact: true,
        })
        .click();
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      await audit("terminal-graphite");
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      const message = `audit-${size.name}-${browserName}-café-日本語`;
      await page.locator(".xterm-helper-textarea").focus();
      await page.locator(".xterm-helper-textarea").evaluate((element, text) => {
        const data = new DataTransfer();
        data.setData("text/plain", text);
        element.dispatchEvent(
          new ClipboardEvent("paste", {
            clipboardData: data,
            bubbles: true,
            cancelable: true,
          }),
        );
      }, message);
      await page.keyboard.press("Enter");
      await expect
        .poll(async () =>
          (await page.locator(".xterm-accessibility").innerText()).replace(
            /\s/g,
            "",
          ),
        )
        .toContain(`ack:${message}`);
      const terminal = await harness.core.call("terminal.get", {
        terminal: harness.terminals[0]!,
      });
      expect(terminal.cols).toBeGreaterThan(10);
      expect(terminal.rows).toBeGreaterThan(1);
      await page.getByRole("tab", { name: "Empty tab", exact: true }).click();
      await expect(page.getByText("No terminal in this tab")).toBeVisible();
      await audit("empty-tab");
      await page
        .getByRole("tab", { name: "Integration terminal", exact: true })
        .click();
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      if (
        !(await page
          .getByRole("button", { name: "Settings", exact: true })
          .isVisible())
      )
        await page
          .getByRole("button", { name: "Back to spaces and agents" })
          .click();
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page.getByRole("button", { name: "Paper", exact: true }).click();
      await audit("settings-paper");
      await page
        .getByRole("button", { name: "Show compatibility details" })
        .click();
      await page
        .getByRole("button", { name: "Hide compatibility details" })
        .scrollIntoViewIfNeeded();
      await audit("settings-details");
      if (
        await page
          .getByRole("button", { name: "Machines", exact: true })
          .isVisible()
      )
        await page
          .getByRole("button", { name: "Machines", exact: true })
          .click();
      else {
        await page
          .getByRole("button", { name: "Back to spaces and agents" })
          .click();
        await page
          .getByRole("button", { name: "Machines", exact: true })
          .click();
      }
      await expect(
        page.getByRole("button", { name: "Refresh machines", exact: true }),
      ).toBeVisible();
      await audit("machines-paper");
      await page.goto("/tasks");
      await expect(page.getByText("No managed tasks yet")).toBeVisible();
      await audit("tasks-paper");
      await page.goto("/");
      if (cdp) {
        await posture(session.context, page, size);
        await expect(page.getByTestId("fold-hinge")).toHaveCount(1);
      }
      await page
        .getByRole("button", { name: "Search spaces and agents", exact: true })
        .click();
      const search = page.getByRole("textbox", {
        name: "Search spaces and agents",
        exact: true,
      });
      await search.fill("no matching audit terminal");
      await audit("search-empty-paper");
      await search.fill("");
      await page
        .getByRole("button", {
          name: `Open space ${harness.label}`,
          exact: true,
        })
        .click();
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      await audit("terminal-paper");
      expect(errors).toEqual([]);
    } finally {
      mkdirSync(join(directory, prefix), { recursive: true });
      writeFileSync(
        join(directory, prefix, "geometry.json"),
        JSON.stringify(reports, null, 2),
      );
      await session.close();
    }
  });
}
