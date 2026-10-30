import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { Harness, sizes, posture, inspect } from "./harness";
const output = "artifacts/ui-refinement";
test("shared chrome columns, search spacing, square rail and adaptive sections", async ({
  browser,
  browserName,
}) => {
  test.setTimeout(120000);
  const h = new Harness("Composition audit");
  await h.start();
  mkdirSync(`${output}/${browserName}`, { recursive: true });
  try {
    for (const touch of [false, true]) {
      const group = sizes.filter((s) => s.touch === touch);
      const s = await h.context(browser, group[0]!);
      try {
        const page = await s.context.newPage();
        await page.goto("http://localhost:8081");
        for (const size of group) {
          await page.setViewportSize(size);
          const cdp = await posture(s.context, page, size);
          const expectedSplit = size.width >= 800 || !!cdp;
          await expect(page.getByTestId("workspace-sidebar")).toHaveCount(
            expectedSplit ? 1 : 0,
          );
          if (page.url().endsWith("/settings")) {
            if (expectedSplit)
              await page
                .getByRole("button", { name: "Herdr workspace", exact: true })
                .click();
            else
              await page
                .getByRole("button", { name: "Back to spaces and agents" })
                .click();
            await expect(page).not.toHaveURL(/settings$/);
          }
          await expect(page.getByText("Core connected")).toBeVisible();
          if (cdp) await expect(page.getByTestId("fold-hinge")).toHaveCount(1);
          const root = page
            .locator(
              '[data-testid="workspace-sidebar"], [data-testid="workspace-list"]',
            )
            .first();
          const xs = await root.evaluate((el) => {
            const center = (e: Element) => {
              const r = e.getBoundingClientRect();
              return r.x + r.width / 2;
            };
            return [
              el
                .querySelector('[data-testid="sidebar-brand-row"]')!
                .querySelectorAll('[data-testid="ui-icon"]'),
              el
                .querySelector('[data-testid="sidebar-section-spaces"]')!
                .querySelectorAll('[data-testid="ui-icon"]'),
              el
                .querySelector('[data-testid="sidebar-section-agents"]')!
                .querySelectorAll('[data-testid="ui-icon"]'),
            ].map((nodes) => center([...nodes].at(-1)!));
          });
          expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(0.6);
          const field = page.getByTestId("sidebar-search-input");
          if (!(await field.isVisible()))
            await page
              .getByRole("button", {
                name: "Search spaces and agents",
                exact: true,
              })
              .click();
          await expect(field).toBeVisible();
          const spacing = await page
            .getByTestId("sidebar-search-region")
            .evaluate((el) => {
              const r = el.getBoundingClientRect(),
                f = el.querySelector("input")!.getBoundingClientRect();
              return {
                top: f.top - r.top,
                bottom: r.bottom - f.bottom,
                left: f.left - r.left,
                right: r.right - f.right,
              };
            });
          expect(spacing).toEqual({ top: 12, bottom: 12, left: 16, right: 16 });
          if (size.name === "iphone-390")
            await page.screenshot({
              path: `${output}/${browserName}/phone-search.png`,
            });
          const collapse = page.getByRole("button", {
            name: "Collapse sidebar",
            exact: true,
          });
          if (await collapse.isVisible()) {
            await collapse.click();
            const rail = page.getByTestId("workspace-sidebar");
            await expect(rail).toHaveCSS("width", touch ? "61px" : "45px");
            const brand = await page
              .getByTestId("sidebar-brand-row")
              .boundingBox();
            const toolbar = await page
              .getByTestId("workspace-toolbar")
              .boundingBox();
            expect(brand!.height + 1).toBe(toolbar!.height);
            const expand = await page
              .getByRole("button", { name: "Expand sidebar" })
              .boundingBox();
            const tab = await page.getByTestId("chrome-tab").boundingBox();
            expect(expand!.height).toBe(tab!.height);
            expect(
              Math.abs(
                expand!.y + expand!.height / 2 - tab!.y - tab!.height / 2,
              ),
            ).toBeLessThan(0.6);
            const items = rail.getByTestId("rail-item");
            await expect(items.first()).toBeVisible();
            const boxes = await items.evaluateAll((elements) =>
              elements.map((el) => {
                const r = el.getBoundingClientRect(),
                  icon = el
                    .querySelector('[data-testid="navigation-icon-slot"]')!
                    .getBoundingClientRect();
                return {
                  w: r.width,
                  h: r.height,
                  cx: r.x + r.width / 2,
                  icx: icon.x + icon.width / 2,
                  cy: r.y + r.height / 2,
                  icy: icon.y + icon.height / 2,
                };
              }),
            );
            for (const r of boxes) {
              expect(r.w).toBe(touch ? 44 : 28);
              expect(r.h).toBe(r.w);
              expect(Math.abs(r.cx - r.icx)).toBeLessThan(0.6);
              expect(Math.abs(r.cy - r.icy)).toBeLessThan(0.6);
            }
            expect(
              Math.max(...boxes.map((b) => b.cx)) -
                Math.min(...boxes.map((b) => b.cx)),
            ).toBeLessThan(0.6);
            if (size.name === "desktop-1440" || size.name === "tablet-834")
              await page.screenshot({
                path: `${output}/${browserName}/${size.name}-rail.png`,
              });
            await page
              .getByRole("button", { name: "Expand sidebar", exact: true })
              .click();
          }
          await page
            .getByRole("button", { name: "Settings", exact: true })
            .click();
          await expect(page).toHaveURL(/settings$/);
          if (cdp) await posture(s.context, page, size);
          await expect(
            page.getByRole("button", { name: "Graphite", exact: true }),
          ).toBeVisible();
          const sections = await page
            .getByTestId("content-section")
            .evaluateAll((els) =>
              els.map((el) => {
                const s = getComputedStyle(el);
                return {
                  radius: s.borderTopLeftRadius,
                  left: s.borderLeftWidth,
                  padding: s.paddingLeft,
                };
              }),
            );
          const split = !!(await page.getByTestId("workspace-sidebar").count());
          for (const section of sections) {
            expect(section).toEqual(
              split
                ? { radius: "10px", left: "1px", padding: "16px" }
                : { radius: "0px", left: "0px", padding: "0px" },
            );
          }
          await expect
            .poll(
              async () =>
                (
                  await inspect(page, {
                    ...size,
                    hinge: cdp ? size.hinge : undefined,
                  })
                ).problems,
            )
            .toEqual([]);
          if (size.name === "iphone-390" || size.name === "desktop-1440")
            await page.screenshot({
              path: `${output}/${browserName}/${size.name}-sections.png`,
            });
          if (cdp) {
            await cdp.send("Emulation.clearDeviceMetricsOverride");
            await cdp.detach();
          }
        }
      } finally {
        await s.close();
      }
    }
  } finally {
    await h.stop();
  }
});
test("workspace empty state has one centered axis including the action", async ({
  page,
  browserName,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const empty = page.getByTestId("empty-state");
  await expect(
    empty.getByText("Connect to your workspace", { exact: true }),
  ).toBeVisible();
  const centers = await empty.evaluate((el) => {
    const c = (e: Element) => {
      const r = e.getBoundingClientRect();
      return r.x + r.width / 2;
    };
    return [
      c(el),
      ...Array.from(
        el.querySelectorAll('[data-testid="ui-icon"], [role="button"]'),
      )
        .filter(
          (e) =>
            !e.closest('[role="button"]') ||
            e.getAttribute("role") === "button",
        )
        .map(c),
    ];
  });
  expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(0.6);
  mkdirSync(`${output}/${browserName}`, { recursive: true });
  await page.screenshot({
    path: `${output}/${browserName}/centered-empty.png`,
  });
});
