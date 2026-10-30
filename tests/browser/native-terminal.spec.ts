import { test, expect } from "@playwright/test";
import { terminalDocument } from "../../apps/mobile/src/components/terminal-document";
test("bundled WebView document loads its font, applies theme and acknowledges consumed output", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.evaluate(() => {
    (window as any).nativeMessages = [];
    (window as any).ReactNativeWebView = {
      postMessage: (message: string) =>
        (window as any).nativeMessages.push(JSON.parse(message)),
    };
  });
  await page.setContent(terminalDocument);
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).nativeMessages.some(
          (message: any) => message.type === "ready",
        ),
      ),
    )
    .toBe(true);
  await page.evaluate(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        data: JSON.stringify({
          type: "theme",
          theme: {
            background: "#ffffff",
            foreground: "#25272c",
            cursor: "#25272c",
          },
        }),
      }),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        data: JSON.stringify({
          type: "output",
          id: 7,
          data: btoa("native document ready\r\n"),
        }),
      }),
    );
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).nativeMessages.some(
          (message: any) => message.type === "consumed" && message.id === 7,
        ),
      ),
    )
    .toBe(true);
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  ).toBe("rgb(255, 255, 255)");
  for (const viewport of [
    { width: 320, height: 336 },
    { width: 390, height: 844 },
    { width: 834, height: 1194 },
    { width: 1440, height: 701 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page.locator("#terminal").evaluate((host) => {
          const bounds = host.getBoundingClientRect();
          const screen = host
            .querySelector(".xterm-screen")!
            .getBoundingClientRect();
          return (
            screen.height > 0 &&
            screen.bottom <= bounds.bottom + 0.5 &&
            screen.right <= bounds.right + 0.5
          );
        }),
      )
      .toBe(true);
  }
  expect(
    await page
      .locator("#terminal-frame")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(255, 255, 255)");
  await page.evaluate(() => {
    const send = (data: unknown) =>
      window.dispatchEvent(
        new MessageEvent("message", { data: JSON.stringify(data) }),
      );
    send({ type: "control", enabled: true, direct: false });
    send({ type: "output", id: 8, data: btoa("\x1b[6n") });
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).nativeMessages.some(
          (message: any) =>
            message.type === "input" && /^\x1b\[\d+;\d+R$/.test(message.data),
        ),
      ),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});
