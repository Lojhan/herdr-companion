import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type CDPSession,
} from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
import { CoreClient } from "../../packages/core-client/src/index";
import { Store } from "../../apps/bridge/src/store";
export const directory = resolve("artifacts/ui-audit/after");
export const fixtureName = "UI audit · café 日本語";
export type Size = {
  name: string;
  width: number;
  height: number;
  touch: boolean;
  hinge?: {
    orientation: "vertical" | "horizontal";
    offset: number;
    maskLength: number;
  };
};
export const sizes: Size[] = [
  { name: "phone-320", width: 320, height: 568, touch: true },
  { name: "phone-360", width: 360, height: 800, touch: true },
  { name: "iphone-375", width: 375, height: 667, touch: true },
  { name: "iphone-390", width: 390, height: 844, touch: true },
  { name: "iphone-large-430", width: 430, height: 932, touch: true },
  { name: "phone-landscape", width: 844, height: 390, touch: true },
  { name: "keyboard-reduced", width: 390, height: 336, touch: true },
  { name: "tablet-768", width: 768, height: 1024, touch: true },
  { name: "tablet-834", width: 834, height: 1194, touch: true },
  { name: "tablet-landscape", width: 1194, height: 834, touch: true },
  { name: "large-tablet", width: 1024, height: 1366, touch: true },
  { name: "breakpoint-799", width: 799, height: 600, touch: true },
  { name: "breakpoint-800", width: 800, height: 600, touch: true },
  { name: "breakpoint-801", width: 801, height: 600, touch: true },
  { name: "fold-cover-344", width: 344, height: 882, touch: true },
  {
    name: "fold-open-720",
    width: 720,
    height: 960,
    touch: true,
    hinge: { orientation: "vertical", offset: 360, maskLength: 0 },
  },
  { name: "duo-single-540", width: 540, height: 720, touch: true },
  {
    name: "duo-spanned",
    width: 1114,
    height: 720,
    touch: true,
    hinge: { orientation: "vertical", offset: 540, maskLength: 34 },
  },
  {
    name: "duo-horizontal",
    width: 720,
    height: 1114,
    touch: true,
    hinge: { orientation: "horizontal", offset: 540, maskLength: 34 },
  },
  { name: "iphone-duo-cover-proxy", width: 466, height: 678, touch: true },
  { name: "iphone-duo-open-proxy", width: 890, height: 626, touch: true },
  { name: "iphone-duo-portrait-proxy", width: 626, height: 890, touch: true },
  { name: "desktop-1024", width: 1024, height: 768, touch: false },
  { name: "desktop-1440", width: 1440, height: 900, touch: false },
  { name: "desktop-1920", width: 1920, height: 1080, touch: false },
];
let lastPairingClaim = 0;
export class Harness {
  constructor(public label = `${fixtureName} · ${randomUUID().slice(0, 6)}`) {}
  core!: CoreClient;
  store = new Store(resolve(".data/sandbox/bridge"));
  prefix = `audit-${randomUUID().slice(0, 8)}`;
  terminals: string[] = [];
  coreId = "";
  spaceId = "";
  async start() {
    const config = JSON.parse(
      readFileSync(".data/sandbox/core-env.json", "utf8"),
    );
    this.core = await CoreClient.open({
      executable: config.executable,
      env: { ...process.env, ...config.env },
    });
    this.coreId = this.core.hello!.core.id;
    mkdirSync(".data/ui-audit", { recursive: true });
    const path = resolve(".data/ui-audit/receiver.py");
    writeFileSync(
      path,
      `import sys,base64\ndef report(state):\n print('\\x1b]7501;state='+state+':app=companion-audit\\x1b\\\\',end='',flush=True)\nprint('\\x1b]0;UI audit receiver · café 日本語\\x1b\\\\',end='',flush=True)\nprint('Herdr Companion · real core integration\\nUTF-8: café 日本語 🌿\\nReady for explicit test input.',flush=True)\nreport('blocked')\nfor line in sys.stdin:\n report('working')\n print('ack:'+line.strip(),flush=True)\n report('blocked')\n`,
    );
    const terminal = await this.core.call("terminal.run", {
      argv: ["python3", "-u", path],
      name: this.prefix,
      wait: false,
      no_parent: true,
      keep: false,
      rm: false,
      labels: { "companion.audit": this.prefix },
    });
    this.terminals.push(terminal.address);
    const document = await this.core.call("doc.get", { name: "herdr-app" }),
      value = (document.value ?? { spaces: [] }) as { spaces: any[] };
    this.spaceId = `${this.prefix}-space`;
    const tabs = [
      {
        id: "receiver",
        name: "Integration terminal",
        root: {
          id: "pane",
          type: "block",
          content: { terminal: terminal.address },
        },
      },
      {
        id: "long",
        name: "A deliberately long tab title for clipping and scrolling checks",
        root: {
          id: "pane2",
          type: "block",
          content: { terminal: terminal.address },
        },
      },
      {
        id: "empty",
        name: "Empty tab",
        root: { id: "empty", type: "row", children: [] },
      },
    ];
    await this.core.call("doc.set", {
      name: "herdr-app",
      version: document.version,
      value: {
        ...value,
        spaces: [
          ...value.spaces,
          {
            id: this.spaceId,
            name: this.label,
            folder: resolve(".data/ui-audit"),
            tabs,
          },
          ...Array.from({ length: 5 }, (_, i) => ({
            id: `${this.prefix}-${i}`,
            name:
              i === 2
                ? "A very long project name with Unicode · revisão e acessibilidade"
                : `Audit project ${i + 1}`,
            folder: resolve(".data/ui-audit"),
            tabs: [tabs[0]],
          })),
        ],
      },
    });
  }
  async context(
    browser: Browser,
    size: Size,
    role: "owner" | "observer" = "owner",
  ) {
    const context = await browser.newContext({
      baseURL: "http://localhost:8081",
      viewport: { width: size.width, height: size.height },
      hasTouch: size.touch,
      deviceScaleFactor: 1,
    });
    const wait = 6100 - (Date.now() - lastPairingClaim);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    const pairing = this.store.createPairing();
    let claim = await context.request.post(
      "http://localhost:7318/v1/pairing/claim",
      {
        data: {
          secret: pairing.secret,
          bridgeId: this.store.bridgeId,
          deviceName: `UI audit ${size.name}`,
          platform: "web",
        },
      },
    );
    if (claim.status() === 429) {
      const retry = Math.min(
        60000,
        Math.max(1000, Number(claim.headers()["retry-after"] ?? 60) * 1000),
      );
      await new Promise((resolve) => setTimeout(resolve, retry + 100));
      claim = await context.request.post(
        "http://localhost:7318/v1/pairing/claim",
        {
          data: {
            secret: pairing.secret,
            bridgeId: this.store.bridgeId,
            deviceName: `UI audit ${size.name}`,
            platform: "web",
          },
        },
      );
    }
    lastPairingClaim = Date.now();
    expect(claim.status()).toBe(200);
    const pending = await claim.json();
    const deviceId = this.store.approve(pending.id, role);
    const approved = await context.request.get(
      `http://localhost:7318/v1/pairing/claims/${pending.id}`,
      { headers: { Authorization: `Bearer ${pending.claimSecret}` } },
    );
    expect(approved.status()).toBe(200);
    await context.addInitScript(
      (profile) => localStorage.setItem("coordinator", JSON.stringify(profile)),
      { endpoint: "http://localhost:7318", bridgeId: this.store.bridgeId },
    );
    return {
      context,
      close: async () => {
        if (this.store.db.open) this.store.revoke(deviceId);
        await context.close();
      },
    };
  }
  async stop() {
    if (!this.core) {
      this.store.close();
      return;
    }
    try {
      const document = await this.core.call("doc.get", { name: "herdr-app" }),
        value = document.value as { spaces: any[] };
      await this.core.call("doc.set", {
        name: "herdr-app",
        version: document.version,
        value: {
          ...value,
          spaces: value.spaces.filter(
            (space) => !space.id.startsWith(this.prefix),
          ),
        },
      });
      for (const terminal of this.terminals) {
        await this.core.call("terminal.kill", { terminal });
        await this.core.call("terminal.rm", { terminal });
      }
    } finally {
      this.core.close();
      this.store.close();
    }
  }
}
export async function posture(
  context: BrowserContext,
  page: Page,
  size: Size,
): Promise<CDPSession | null> {
  if (!size.hinge || context.browser()?.browserType().name() !== "chromium")
    return null;
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: size.width,
    height: size.height,
    screenWidth: size.width,
    screenHeight: size.height,
    deviceScaleFactor: 1,
    mobile: true,
    displayFeature: size.hinge,
    devicePosture: { type: "folded" },
  });
  return cdp;
}
export async function inspect(page: Page, size: Size) {
  return page.evaluate(
    ({ touch, hinge }) => {
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        return (
          !!r.width &&
          !!r.height &&
          getComputedStyle(el).visibility !== "hidden" &&
          !!el.getClientRects().length
        );
      };
      const controls = [
        ...document.querySelectorAll(
          '[role="button"],[role="tab"],input,textarea',
        ),
      ]
        .filter(visible)
        .filter(
          (el) =>
            !el.closest('[aria-hidden="true"]') &&
            !el.classList.contains("xterm-helper-textarea"),
        );
      const problems: string[] = [];
      const measurements: any[] = [];
      for (const el of controls) {
        const r = el.getBoundingClientRect();
        const name =
          el.getAttribute("aria-label") ??
          el.textContent?.trim().slice(0, 70) ??
          el.tagName;
        measurements.push({
          name,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
        });
        if (
          touch &&
          el.getAttribute("aria-disabled") !== "true" &&
          (r.width < 43.5 || r.height < 43.5)
        )
          problems.push(`Small touch target ${name}: ${r.width}×${r.height}`);
        let clip = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
        for (
          let parent = el.parentElement;
          parent;
          parent = parent.parentElement
        ) {
          const style = getComputedStyle(parent),
            bounds = parent.getBoundingClientRect();
          if (/hidden|scroll|auto/.test(style.overflowX)) {
            clip.left = Math.max(clip.left, bounds.left);
            clip.right = Math.min(clip.right, bounds.right);
          }
          if (/hidden|scroll|auto/.test(style.overflowY)) {
            clip.top = Math.max(clip.top, bounds.top);
            clip.bottom = Math.min(clip.bottom, bounds.bottom);
          }
        }
        const hit = {
          left: Math.max(r.left, clip.left),
          right: Math.min(r.right, clip.right),
          top: Math.max(r.top, clip.top),
          bottom: Math.min(r.bottom, clip.bottom),
        };
        if (
          hinge &&
          hit.right > hit.left &&
          hit.bottom > hit.top &&
          r.bottom > 0 &&
          r.top < innerHeight &&
          r.right > 0 &&
          r.left < innerWidth
        ) {
          const crosses =
            hinge.orientation === "vertical"
              ? hit.left < hinge.offset + hinge.maskLength &&
                hit.right > hinge.offset
              : hit.top < hinge.offset + hinge.maskLength &&
                hit.bottom > hinge.offset;
          if (crosses) problems.push(`Control crosses hinge: ${name}`);
        }
        for (const icon of el.querySelectorAll('[data-testid="ui-icon"]')) {
          if (icon.closest('[role="button"],[role="tab"]') !== el) continue;
          const b = icon.getBoundingClientRect();
          if (Math.abs((b.top + b.bottom - r.top - r.bottom) / 2) > 1)
            problems.push(`Icon vertical alignment ${name}`);
          if (
            b.left < r.left - 0.5 ||
            b.right > r.right + 0.5 ||
            b.top < r.top - 0.5 ||
            b.bottom > r.bottom + 0.5
          )
            problems.push(`Icon clipped ${name}`);
        }
      }
      if (document.documentElement.scrollWidth > innerWidth + 1)
        problems.push("Horizontal document overflow");
      const shell = document
        .querySelector('[data-testid="workspace-shell"]')
        ?.getBoundingClientRect();
      if (shell && shell.bottom > innerHeight + 1)
        problems.push(
          `Shell exceeds viewport by ${shell.bottom - innerHeight}px`,
        );
      return {
        problems,
        measurements,
        viewport: { width: innerWidth, height: innerHeight },
        coarse: matchMedia("(pointer:coarse)").matches,
      };
    },
    { touch: size.touch, hinge: size.hinge ?? null },
  );
}
export async function shot(page: Page, path: string) {
  mkdirSync(join(directory, path.substring(0, path.lastIndexOf("/"))), {
    recursive: true,
  });
  const segmented = await page.evaluate(
    () =>
      matchMedia("(horizontal-viewport-segments:2)").matches ||
      matchMedia("(vertical-viewport-segments:2)").matches,
  );
  if (
    segmented &&
    page.context().browser()?.browserType().name() === "chromium"
  ) {
    // Playwright's viewport reset during screenshot discards CDP display features.
    // Capture the actual spanned surface directly, without changing emulation.
    const cdp = await page.context().newCDPSession(page);
    const result = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
    });
    writeFileSync(
      join(directory, path + ".png"),
      Buffer.from(result.data, "base64"),
    );
    await cdp.detach();
  } else
    await page.screenshot({
      path: join(directory, path + ".png"),
      animations: "disabled",
    });
}
