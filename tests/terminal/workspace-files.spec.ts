import { test, expect } from "@playwright/test";
import { resolve, join } from "node:path";
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Harness, type Size } from "../ui/harness";
let h: Harness, root: string;
test.beforeAll(async () => {
  h = new Harness("Files and changes audit");
  await h.start();
  root = resolve(".data/ui-audit/" + h.prefix + "-repo");
  mkdirSync(join(root, "src"), { recursive: true });
  const git = (...args: string[]) =>
    execFileSync(
      "git",
      [
        "-C",
        root,
        "-c",
        "core.hooksPath=/dev/null",
        "-c",
        "commit.gpgsign=false",
        ...args,
      ],
      { encoding: "utf8" },
    );
  git("init", "--initial-branch=main");
  writeFileSync(
    join(root, "src", "workspace.ts"),
    "export const machines = 1;\n",
  );
  writeFileSync(join(root, "theme.ts"), "export const gap = 8;\n");
  git("add", ".");
  git(
    "-c",
    "user.name=Companion Test",
    "-c",
    "user.email=test@example.invalid",
    "commit",
    "--no-verify",
    "-m",
    "Fixture",
  );
  writeFileSync(
    join(root, "src", "workspace.ts"),
    "export const machines = 3;\n",
  );
  writeFileSync(join(root, "theme.ts"), "export const gap = 12;\n");
  git("add", "theme.ts");
  writeFileSync(join(root, "notes.md"), "# Mobile changes\n");
  writeFileSync(join(root, "image.bin"), Buffer.from([0, 1, 2]));
  writeFileSync(
    join(root, "preview.png"),
    readFileSync("tests/fixtures/terminal-image.png"),
  );
  writeFileSync(
    join(root, "sample.mp4"),
    readFileSync("tests/fixtures/terminal-video.mp4"),
  );
  const wav = Buffer.alloc(44 + 8000);
  wav.write("RIFF");
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(8000, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(8000, 40);
  wav.fill(128, 44);
  writeFileSync(join(root, "sample.wav"), wav);
  const doc = await h.core.call("doc.get", { name: "herdr-app" }),
    value = doc.value as any;
  value.spaces.find((s: any) => s.id === h.spaceId).folder = root;
  await h.core.call("doc.set", {
    name: "herdr-app",
    version: doc.version,
    value,
  });
});
test.afterAll(async () => {
  await h?.stop();
  if (root) rmSync(root, { recursive: true, force: true });
});
for (const size of [
  { name: "phone", width: 320, height: 700, touch: true },
  { name: "tablet", width: 834, height: 1112, touch: true },
  { name: "desktop", width: 1440, height: 900, touch: false },
] satisfies Size[])
  test(`${size.name}: live files, staged/working diffs, resizable panels and stable status dot`, async ({
    browser,
    browserName,
  }) => {
    const session = await h.context(browser, size),
      page = await session.context.newPage();
    const switchPanel = async (kind: "files" | "changes") => {
      const overlay = page.getByRole("button", {
        name: `Switch to ${kind}`,
        exact: true,
      });
      if (await overlay.isVisible()) await overlay.click();
      else
        await page
          .getByRole("button", {
            name: kind === "files" ? "Files" : "Changes",
            exact: true,
          })
          .click();
    };

    try {
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: "Open UI preview", exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "Open space " + h.label, exact: true })
        .click();
      await expect(
        page
          .getByTestId("terminal-connection")
          .filter({ hasText: /^Connected$/ }),
      ).toBeVisible();
      await expect(page.getByTestId("terminal-composer")).toHaveCount(0);
      await page.getByRole("button", { name: "Files", exact: true }).click();
      const panel = page.getByTestId("workspace-inspector");
      await expect(panel).toBeVisible();
      await page
        .getByRole("button", { name: "Open folder src", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Open file workspace.ts", exact: true })
        .click();
      await expect(page.getByTestId("file-code")).toContainText(
        "export const machines = 3;",
      );
      await switchPanel("changes");
      await page
        .getByRole("button", {
          name: "View diff src/workspace.ts",
          exact: true,
        })
        .click();
      await expect(page.getByTestId("diff-add")).toContainText(
        "export const machines = 3;",
      );
      await expect(page.getByTestId("diff-remove")).toContainText(
        "export const machines = 1;",
      );
      await page.getByTestId("diff-code").click({ button: "right" });
      await expect(
        page.getByRole("menuitem", { name: "Copy diff", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("menuitem", { name: "Open file", exact: true })
        .click();
      await expect(page.getByTestId("file-code")).toContainText(
        "export const machines = 3;",
      );
      await switchPanel("changes");
      await expect(page.getByTestId("diff-add")).toContainText(
        "export const machines = 3;",
      );
      mkdirSync(`artifacts/workspace-files/${browserName}`, {
        recursive: true,
      });
      await page.screenshot({
        animations: "disabled",
        path: `artifacts/workspace-files/${browserName}/${size.name}-diff.png`,
      });
      await page
        .getByRole("button", { name: "Back to changes", exact: true })
        .click();
      await page
        .getByRole("button", { name: "View diff preview.png", exact: true })
        .click();
      await expect(
        page.getByTestId("media-preview").locator("img"),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Back to changes", exact: true })
        .click();
      await page
        .getByRole("button", { name: "View diff theme.ts", exact: true })
        .click();
      await expect(page.getByTestId("diff-add")).toContainText(
        "export const gap = 12;",
      );
      await expect(
        page.getByRole("button", { name: "Working tree", exact: true }),
      ).toBeDisabled();
      await switchPanel("files");
      await page
        .getByRole("button", { name: "Back to files", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Parent folder", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Open file image.bin", exact: true })
        .click();
      await expect(
        page.getByText("Binary file", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Back to files", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Open file preview.png", exact: true })
        .click();
      await expect(
        page.getByTestId("media-preview").locator("img"),
      ).toBeVisible();
      await expect
        .poll(() =>
          page
            .getByTestId("media-preview")
            .locator("img")
            .evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(0);
      const downloadEvent = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Download file", exact: true })
        .click();
      const downloaded = await downloadEvent;
      expect(readFileSync((await downloaded.path())!)).toEqual(
        readFileSync(join(root, "preview.png")),
      );
      await page
        .getByRole("button", { name: "Back to files", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Open file sample.wav", exact: true })
        .click();
      await expect(
        page.getByTestId("media-preview").locator("audio"),
      ).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator("audio")
            .evaluate((audio: HTMLAudioElement) => audio.readyState),
        )
        .toBeGreaterThan(0);
      await page
        .getByRole("button", { name: "Back to files", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Open file sample.mp4", exact: true })
        .click();
      await expect(
        page.getByTestId("media-preview").locator("video"),
      ).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator("video")
            .evaluate((video: HTMLVideoElement) => video.readyState),
        )
        .toBeGreaterThan(0);
      await page
        .locator("video")
        .evaluate((video: HTMLVideoElement) => video.play());
      await expect
        .poll(() =>
          page
            .locator("video")
            .evaluate((video: HTMLVideoElement) => video.currentTime),
        )
        .toBeGreaterThan(0);
      if (size.name === "desktop") {
        const handle = page.getByRole("separator", {
          name: "Resize workspace panel",
          exact: true,
        });
        await handle.focus();
        await handle.press("ArrowLeft");
        await expect(panel).toHaveCSS("width", "436px");
        const box = await handle.boundingBox();
        await page.mouse.move(box!.x + box!.width / 2, box!.y + 80);
        await page.mouse.down();
        await page.mouse.move(box!.x - 44, box!.y + 80);
        await page.mouse.up();
        await expect
          .poll(async () => (await panel.boundingBox())!.width)
          .toBeGreaterThan(470);
        const closingBox = await handle.boundingBox();
        await page.mouse.move(closingBox!.x + 4, closingBox!.y + 80);
        await page.mouse.down();
        await page.mouse.move(closingBox!.x + 700, closingBox!.y + 80);
        await page.mouse.up();
        await expect(panel).toHaveCount(0);
        await page.getByRole("button", { name: "Files", exact: true }).click();
        await expect(panel).toBeVisible();
        const navHandle = page.getByRole("separator", {
          name: "Resize navigation sidebar",
          exact: true,
        });
        await navHandle.focus();
        await navHandle.press("ArrowRight");
        await expect(page.getByTestId("workspace-sidebar")).toHaveCSS(
          "width",
          "284px",
        );
        await page
          .getByRole("button", { name: "Close workspace panel", exact: true })
          .click();
        const indicator = page.getByTestId("core-connection-indicator");
        const getOffset = () =>
          indicator.evaluate((el) => {
            const dot = el.firstElementChild!.getBoundingClientRect();
            return innerHeight - dot.y - dot.height / 2;
          });
        const offset = await getOffset();
        const closingNav = await navHandle.boundingBox();
        await page.mouse.move(closingNav!.x + 4, closingNav!.y + 80);
        await page.mouse.down();
        await page.mouse.move(100, closingNav!.y + 80);
        await expect(
          page.getByRole("button", { name: "Expand sidebar", exact: true }),
        ).toHaveCount(0);
        await page.mouse.move(20, closingNav!.y + 80);
        await page.mouse.up();
        await expect(
          page.getByRole("button", { name: "Expand sidebar", exact: true }),
        ).toBeVisible();
        expect(await getOffset()).toBeCloseTo(offset, 1);
        await expect(indicator).toBeVisible();
        await page
          .getByRole("button", { name: "Expand sidebar", exact: true })
          .click();
        expect(await getOffset()).toBeCloseTo(offset, 1);
        // Padding is measured around the actual square action, not its icon.
        for (const group of ["spaces", "agents", "machines"]) {
          const section = page.getByTestId(`sidebar-section-${group}`);
          const inset = await section.evaluate((el) => {
            const parent = el.getBoundingClientRect(),
              button = el
                .querySelector('button,[role="button"]:last-child')!
                .getBoundingClientRect();
            return {
              top: button.top - parent.top,
              bottom: parent.bottom - button.bottom,
            };
          });
          expect(inset.top).toBeGreaterThanOrEqual(4);
          expect(inset.bottom).toBeGreaterThanOrEqual(4);
        }
        await page.reload();
        await expect(page.getByTestId("workspace-sidebar")).toHaveCSS(
          "width",
          "200px",
        );
      } else
        await page
          .getByRole("button", { name: "Close workspace panel", exact: true })
          .click();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    } finally {
      await session.close();
    }
  });
