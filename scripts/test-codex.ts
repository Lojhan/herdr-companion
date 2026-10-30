import { chromium } from "@playwright/test";
import { Harness } from "../tests/ui/harness";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const h = new Harness("Real Codex integration");
await h.start();
const path = resolve(".data/ui-audit/codex");
mkdirSync(path, { recursive: true });
const wrapper = resolve(".data/ui-audit/codex-run.py");
writeFileSync(
  wrapper,
  `import subprocess,time\nr=subprocess.run(['${process.env.HOME}/.local/bin/codex','exec','--sandbox','read-only','--skip-git-repo-check','-C','${path}','Reply exactly HERDR_INTEGRATION_OK. Do not modify files or run commands.'])\nprint('\\r\\nCodex process exited: '+str(r.returncode),flush=True)\ntime.sleep(180)\n`,
);
const browser = await chromium.launch();
let session: Awaited<ReturnType<Harness["context"]>> | undefined;
try {
  const terminal = await h.core.call("terminal.run", {
    argv: ["python3", "-u", wrapper],
    name: "real-codex-audit",
    wait: false,
    no_parent: true,
    keep: false,
    rm: false,
    cwd: path,
    labels: { "companion.audit": h.prefix },
  });
  h.terminals.push(terminal.address);
  const doc = await h.core.call("doc.get", { name: "herdr-app" });
  const value = doc.value as any;
  value.spaces.find(
    (s: any) => s.id === h.spaceId,
  ).tabs[0].root.content.terminal = terminal.address;
  await h.core.call("doc.set", {
    name: "herdr-app",
    version: doc.version,
    value,
  });
  let text = "";
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    text = (
      await h.core.call("terminal.read", {
        terminal: terminal.address,
        lines: 200,
      })
    ).text;
    if (text.includes("Codex process exited:")) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  session = await h.context(browser, {
    name: "codex-desktop",
    width: 1440,
    height: 900,
    touch: false,
  });
  const page = await session.context.newPage();
  await page.goto("http://localhost:8081");
  await page
    .getByRole("button", { name: "Open space " + h.label, exact: true })
    .click();
  await page.getByText(/^Observing$/).waitFor();
  await page
    .locator(".xterm-accessibility")
    .getByText("HERDR_INTEGRATION_OK", { exact: true })
    .first()
    .waitFor({ timeout: 10000 });
  mkdirSync("artifacts/ui-audit/real-codex", { recursive: true });
  await page.screenshot({ path: "artifacts/ui-audit/real-codex/desktop.png" });
  const passed =
    text.includes("HERDR_INTEGRATION_OK") &&
    text.includes("Codex process exited: 0");
  writeFileSync(
    "artifacts/ui-audit/real-codex/result.json",
    JSON.stringify(
      {
        passed,
        corePTY: true,
        cli: "codex 0.164.0",
        sandbox: "read-only",
        exitCode: passed ? 0 : null,
      },
      null,
      2,
    ),
  );
  if (!passed) throw Error("Actual Codex CLI did not complete successfully");
  console.log(
    "Actual Codex CLI completed through real core PTY; browser output verified.",
  );
} finally {
  await session?.close();
  await browser.close();
  await h.stop();
}
