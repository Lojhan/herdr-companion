import { test, expect } from "@playwright/test";
test("global scrollbar overlays content, drags and fades without a gutter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 });
  await page.goto("/settings");
  await expect(page.locator("[data-global-scrollbars]")).toHaveCount(1);
  const selector = await page.evaluate(() => {
    const node = [...document.querySelectorAll<HTMLElement>("*")].find(
      (el) =>
        /auto|scroll/.test(getComputedStyle(el).overflowY) &&
        el.scrollHeight > el.clientHeight + 50 &&
        !el.closest("[data-global-scrollbars]"),
    );
    if (!node) throw Error("No scrollable settings surface");
    node.dataset.scrollbarProbe = "true";
    return "[data-scrollbar-probe]";
  });
  const surface = page.locator(selector);
  const dimensions = await surface.evaluate((el) => {
    const node = el as HTMLElement,
      s = getComputedStyle(el);
    return {
      gutter:
        node.offsetWidth -
        node.clientWidth -
        parseFloat(s.borderLeftWidth) -
        parseFloat(s.borderRightWidth),
      width: node.getBoundingClientRect().width,
    };
  });
  expect(dimensions.gutter).toBeLessThan(0.6);
  await surface.evaluate((el) => (el.scrollTop = 100));
  const thumb = page.locator('[data-scrollbar="y"]').filter({ visible: true });
  await expect
    .poll(() =>
      page
        .locator('[data-scrollbar="y"]')
        .evaluateAll((nodes) =>
          nodes.some((el) => Number(getComputedStyle(el).opacity) > 0.99),
        ),
    )
    .toBe(true);
  const bar = await page.locator('[data-scrollbar="y"]').evaluateAll((nodes) =>
    nodes
      .find((el) => Number(getComputedStyle(el).opacity) > 0.99)
      ?.getBoundingClientRect()
      .toJSON(),
  );
  expect(bar?.width).toBe(12);
  await page.mouse.move(bar!.x + 8, bar!.y + bar!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bar!.x + 8, bar!.y + bar!.height / 2 + 40);
  await page.mouse.up();
  expect(await surface.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
  await page.mouse.move(0, 0);
  await expect
    .poll(
      () =>
        page
          .locator('[data-scrollbar="y"]')
          .evaluateAll((nodes) =>
            nodes.every((el) => Number(getComputedStyle(el).opacity) < 0.01),
          ),
      { timeout: 3000 },
    )
    .toBe(true);
  expect(await surface.evaluate((el) => el.getBoundingClientRect().width)).toBe(
    dimensions.width,
  );
});
