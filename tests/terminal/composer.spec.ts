import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { Harness, type Size } from "../ui/harness";
const profiles: Size[] = [
  { name: "phone-320", width: 320, height: 568, touch: true },
  { name: "phone-390", width: 390, height: 844, touch: true },
  { name: "tablet-834", width: 834, height: 1194, touch: true },
  { name: "desktop-1440", width: 1440, height: 900, touch: false },
];
let h: Harness, terminal: string;
test.beforeAll(async () => {
  h = new Harness("Direct web terminal");
  await h.start();
  const shell = await h.core.call("terminal.run", {
    argv: ["/bin/sh", "-i"],
    cwd: resolve(".data/ui-audit"),
    wait: false,
    no_parent: true,
    keep: false,
    rm: false,
    labels: { "companion.audit": h.prefix },
  });
  terminal = shell.address;
  h.terminals.push(terminal);
  const doc = await h.core.call("doc.get", { name: "herdr-app" }),
    value = doc.value as any;
  value.spaces.find(
    (s: any) => s.id === h.spaceId,
  ).tabs[0].root.content.terminal = terminal;
  await h.core.call("doc.set", {
    name: "herdr-app",
    version: doc.version,
    value,
  });
});
test.afterAll(async () => await h?.stop());
for (const size of profiles)
  test(`${size.name}: automatic control, direct input, no web composer and full terminal bounds`, async ({
    browser,
    browserName,
  }) => {
    const session = await h.context(browser, size),
      page = await session.context.newPage();
    const marker = `DIRECT_${browserName}_${size.name}`;
    try {
      await page.goto("/");
      await page
        .getByRole("button", { name: "Open space " + h.label, exact: true })
        .click();
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      await expect(page.getByTestId("terminal-composer")).toHaveCount(0);
      for (const name of [
        "Take control",
        "Observe only",
        "Attach images",
        "Manage hotkeys",
      ])
        await expect(
          page.getByRole("button", { name, exact: true }),
        ).toHaveCount(0);
      await page.locator(".xterm-helper-textarea:visible").focus();
      await page.keyboard.type(`printf '${marker}\\n'`);
      await page.keyboard.press("Enter");
      await expect
        .poll(
          async () =>
            (await h.core.call("terminal.read", { terminal, lines: 100 })).text,
        )
        .toContain(marker + "\n");
      for (const height of [size.height - 140, size.height + 73, size.height]) {
        await page.setViewportSize({ width: size.width, height });
        await expect
          .poll(() =>
            page
              .locator('[aria-label="Live terminal"]:visible')
              .evaluate((host) => {
                const b = host.getBoundingClientRect(),
                  s = host
                    .querySelector(".xterm-screen")!
                    .getBoundingClientRect();
                return (
                  s.height > 0 &&
                  s.bottom <= b.bottom + 0.5 &&
                  s.right <= b.right + 0.5
                );
              }),
          )
          .toBe(true);
      }
      mkdirSync(`artifacts/terminal-live/${browserName}`, { recursive: true });
      await page.screenshot({
        animations: "disabled",
        path: `artifacts/terminal-live/${browserName}/${size.name}.png`,
      });
      const before = (
        await h.core.call("terminal.read", { terminal, lines: 100 })
      ).text.split(marker).length;
      await page.reload();
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      expect(
        (
          await h.core.call("terminal.read", { terminal, lines: 100 })
        ).text.split(marker).length,
      ).toBe(before);
    } finally {
      await session.close();
    }
  });
