import { test, expect } from "@playwright/test";
import { Harness, sizes, inspect, shot, posture } from "./harness";
for (const name of ["phone-320", "iphone-390", "tablet-834", "desktop-1440"])
  test(`${name}: unpaired fields, error and remaining themes`, async ({
    browser,
    browserName,
  }) => {
    const size = sizes.find((s) => s.name === name)!,
      context = await browser.newContext({
        viewport: size,
        hasTouch: size.touch,
      }),
      page = await context.newPage();
    try {
      await page.goto("http://localhost:8081/settings");
      const pairing = page.getByRole("textbox", {
        name: "Pairing details",
        exact: true,
      });
      await expect(pairing).toBeVisible();
      expect((await inspect(page, size)).problems).toEqual([]);
      await pairing.fill("invalid pairing json");
      await page
        .getByRole("button", { name: "Pair this device", exact: true })
        .click();
      await expect(page.getByRole("alert")).toBeVisible();
      for (const theme of ["Ink", "Moss"]) {
        await page.getByRole("button", { name: theme, exact: true }).click();
        await pairing.scrollIntoViewIfNeeded();
        expect((await inspect(page, size)).problems).toEqual([]);
        await shot(
          page,
          `${browserName}/${name}/unpaired-error-${theme.toLowerCase()}`,
        );
      }
    } finally {
      await context.close();
    }
  });
test("observer permissions and expired browser session", async ({
  browser,
  browserName,
}) => {
  const h = new Harness("Observer audit");
  await h.start();
  const size = sizes.find((s) => s.name === "iphone-390")!,
    s = await h.context(browser, size, "observer");
  try {
    const page = await s.context.newPage();
    await page.goto("http://localhost:8081");
    await page
      .getByRole("button", { name: "Open space " + h.label, exact: true })
      .click();
    await expect(page.getByText(/^Read only$/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Take control", exact: true }),
    ).toHaveCount(0);
    await shot(page, `${browserName}/iphone-390/observer-terminal`);
    await s.context.clearCookies();
    await page.reload();
    await expect(
      page.getByText("Space unavailable", { exact: true }),
    ).toBeVisible();
    await shot(page, `${browserName}/iphone-390/session-expired`);
  } finally {
    await s.close();
    await h.stop();
  }
});
test("live terminal adapts between phone, tablet and spanned fold without replaying input", async ({
  browser,
  browserName,
}) => {
  const h = new Harness("Resize audit");
  await h.start();
  const size = sizes.find((s) => s.name === "iphone-390")!,
    s = await h.context(browser, size);
  try {
    const page = await s.context.newPage();
    await page.goto("http://localhost:8081");
    await page
      .getByRole("button", { name: "Open space " + h.label, exact: true })
      .click();
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
    await page.locator(".xterm-helper-textarea").focus();
    await page.keyboard.type("resize-no-replay");
    await page.keyboard.press("Enter");
    await expect(page.locator(".xterm-accessibility")).toContainText(
      "ack:resize-no-replay",
    );
    for (const name of [
      "tablet-834",
      "duo-spanned",
      "phone-landscape",
      "iphone-390",
    ]) {
      const target = sizes.find((s) => s.name === name)!;
      await page.setViewportSize(target);
      const cdp = await posture(s.context, page, target);
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      if (cdp) await expect(page.getByTestId("fold-hinge")).toHaveCount(1);
      await expect
        .poll(
          async () =>
            (
              await inspect(page, {
                ...target,
                hinge: cdp ? target.hinge : undefined,
              })
            ).problems,
        )
        .toEqual([]);
      await shot(page, `${browserName}/${name}/live-resize`);
      if (cdp) await cdp.send("Emulation.clearDeviceMetricsOverride");
    }
    const read = await h.core.call("terminal.read", {
      terminal: h.terminals[0]!,
      lines: 200,
    });
    expect(read.text.split("ack:resize-no-replay").length - 1).toBe(1);
  } finally {
    await s.close();
    await h.stop();
  }
});
