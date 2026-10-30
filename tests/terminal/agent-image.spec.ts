import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Harness } from "../ui/harness";
test("real Codex reads an image sent through core attachment upload", async ({
  browser,
  browserName,
}) => {
  test.skip(
    process.env.RUN_CODEX_IMAGE !== "1",
    "Explicit opt-in: uses existing Codex CLI authentication and one model request",
  );
  test.skip(browserName !== "chromium", "One real model request is sufficient");
  test.setTimeout(180000);
  const h = new Harness("Codex image verification");
  await h.start();
  const folder = resolve(".data/ui-audit/agent-image");
  mkdirSync(folder, { recursive: true });
  const runner = resolve(".data/ui-audit/run-image-agent.py");
  writeFileSync(
    runner,
    `import subprocess,sys\nr=subprocess.run(['${process.env.HOME}/.local/bin/codex','exec','--sandbox','read-only','--skip-git-repo-check','-C','${folder}','Name the dominant color in the attached image, then write HERDR_IMAGE_OK. Do not run commands or change files.','--image',sys.argv[1]])\nprint('\\nAGENT_EXIT:'+str(r.returncode),flush=True)\n`,
  );
  let session: Awaited<ReturnType<Harness["context"]>> | undefined;
  try {
    const terminal = await h.core.call("terminal.run", {
      argv: ["/bin/sh", "-i"],
      name: h.prefix + "-image",
      cwd: folder,
      wait: false,
      no_parent: true,
      keep: false,
      rm: false,
      labels: { "companion.audit": h.prefix },
    });
    h.terminals.push(terminal.address);
    const doc = await h.core.call("doc.get", { name: "herdr-app" }),
      value = doc.value as any;
    value.spaces.find(
      (s: any) => s.id === h.spaceId,
    ).tabs[0].root.content.terminal = terminal.address;
    await h.core.call("doc.set", {
      name: "herdr-app",
      version: doc.version,
      value,
    });
    session = await h.context(browser, {
      name: "agent-image",
      width: 1440,
      height: 900,
      touch: false,
    });
    const page = await session.context.newPage();
    await page.goto("http://localhost:8081");
    await page
      .getByRole("button", { name: "Open space " + h.label, exact: true })
      .click();
    await expect(page.getByTestId("terminal-connection").filter({hasText:/^Connected$/})).toBeVisible();
    await expect(page.getByTestId("terminal-connection").filter({hasText:/^Connected$/})).toBeVisible();
    const status = await session.context.request.get(
      "http://localhost:7318/v1/status",
    );
    const upload = await session.context.request.post(
      "http://localhost:7318/v1/terminal-images",
      {
        headers: { "x-csrf-token": (await status.json()).csrf },
        data: {
          coreId: h.coreId,
          terminal: terminal.address,
          createdMs: (
            await h.core.call("terminal.get", { terminal: terminal.address })
          ).created_ms,
          name: "terminal-image.png",
          data: readFileSync("tests/fixtures/terminal-image.png").toString(
            "base64",
          ),
        },
      },
    );
    expect(upload.status()).toBe(200);
    const uploaded = await upload.json();
    await page.locator(".xterm-helper-textarea:visible").focus();
    await page.keyboard.type(`python3 -u '${runner}' '${uploaded.path}'`);
    await page.keyboard.press("Enter");
    mkdirSync("artifacts/terminal-live/agent-image", { recursive: true });
    await expect
      .poll(
        async () =>
          (
            await h.core.call("terminal.read", {
              terminal: terminal.address,
              lines: 300,
            })
          ).text,
        { timeout: 120000 },
      )
      .toMatch(/AGENT_EXIT:\d/);
    const text = (
      await h.core.call("terminal.read", {
        terminal: terminal.address,
        lines: 300,
      })
    ).text;
    expect(text).toContain("AGENT_EXIT:0");
    expect(text).toMatch(/\bgreen\b/i);
    expect(text).toContain("HERDR_IMAGE_OK");
    await expect(page.locator(".xterm-accessibility")).toContainText(
      "AGENT_EXIT:0",
    );
    await page.screenshot({
      path: "artifacts/terminal-live/agent-image/result.png",
    });
    writeFileSync(
      "artifacts/terminal-live/agent-image/result.json",
      JSON.stringify(
        {
          passed: true,
          coreUpload: "terminal.put",
          agentExit: 0,
          imageColorRecognized: "green",
          marker: "HERDR_IMAGE_OK",
        },
        null,
        2,
      ),
    );
  } finally {
    await session?.close();
    await h.stop();
  }
});
