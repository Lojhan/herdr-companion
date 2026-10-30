import { test, expect } from "@playwright/test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Harness, sizes, posture, inspect, shot, directory } from "./harness";
test("machines page geometry and captures at every viewport", async ({
  browser,
  browserName,
}) => {
  const h = new Harness("Machines audit");
  await h.start();
  const session = await h.context(browser, sizes[0]!);
  try {
    await session.context.addInitScript(() =>
      localStorage.setItem("appearance", "paper"),
    );
    const page = await session.context.newPage();
    await page.goto("http://localhost:8081/machines");
    await expect(
      page.getByRole("button", { name: "Refresh machines", exact: true }),
    ).toBeVisible();
    for (const size of sizes) {
      await page.setViewportSize(size);
      const cdp = await posture(session.context, page, size);
      const actual = { ...size, hinge: cdp ? size.hinge : undefined };
      if (cdp) await expect(page.getByTestId("fold-hinge")).toHaveCount(1);
      await expect
        .poll(async () => (await inspect(page, actual)).problems)
        .toEqual([]);
      await shot(page, `${browserName}/${size.name}/machines-paper`);
      const path = join(directory, browserName, size.name, "geometry.json");
      const reports = existsSync(path)
        ? JSON.parse(readFileSync(path, "utf8"))
        : [{ state: "machines-paper" }];
      reports[reports.findIndex((r: any) => r.state === "machines-paper")] = {
        state: "machines-paper",
        ...(await inspect(page, actual)),
      };
      writeFileSync(path, JSON.stringify(reports, null, 2));
      if (cdp) {
        await cdp.send("Emulation.clearDeviceMetricsOverride");
        await cdp.detach();
      }
    }
  } finally {
    await session.close();
    await h.stop();
  }
});
