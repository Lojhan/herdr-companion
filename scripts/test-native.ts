import { execFileSync, spawn } from "node:child_process";
import { Harness } from "../tests/ui/harness";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const harness = new Harness(
  `Native integration ${process.env.IOS_AUDIT_NAME ?? "iphone"}`,
);
await harness.start();
const pairing = harness.store.createPairing();
const details = JSON.stringify({
  bridgeId: pairing.bridgeId,
  secret: pairing.secret,
  endpoint: "http://localhost:7318",
});
const env = {
  ...process.env,
  MAESTRO_CLI_NO_ANALYTICS: "1",
  MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true",
};
const auditName = process.env.IOS_AUDIT_NAME ?? "iphone";
const output = `artifacts/ui-audit/native/${auditName}`;
mkdirSync(output, { recursive: true });
let deviceId: string | undefined;
const poll = setInterval(() => {
  const claim = harness.store.db
    .prepare("SELECT claimed_at,approved_at FROM pairings WHERE id=?")
    .get(pairing.id) as any;
  if (claim?.claimed_at && !claim.approved_at)
    deviceId = harness.store.approve(pairing.id, "owner");
}, 250);
try {
  const binary = process.env.MAESTRO_BIN ?? ".data/maestro/maestro/bin/maestro";
  const device =
    process.env.IOS_AUDIT_DEVICE ??
    Object.values(
      JSON.parse(
        execFileSync(
          "xcrun",
          ["simctl", "list", "devices", "available", "--json"],
          { encoding: "utf8" },
        ),
      ).devices as Record<string, { name: string; udid: string }[]>,
    )
      .flat()
      .find((device) => device.name === "Herdr Companion Audit")?.udid;
  if (!device) throw Error("Set IOS_AUDIT_DEVICE to your test simulator UDID");
  const child = spawn(
    binary,
    [
      "--device",
      device,
      "test",
      "--debug-output",
      `${output}/logs`,
      "-e",
      `OUTPUT_DIR=${output}`,
      "-e",
      `PAIRING_JSON=${details}`,
      "-e",
      `SPACE_LABEL=Open space ${harness.label}`,
      process.env.NATIVE_FLOW ?? "tests/native/iphone.yaml",
    ],
    { env, stdio: "inherit" },
  );
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("exit", resolve);
    child.once("error", reject);
  });
  const read = await harness.core.call("terminal.read", {
    terminal: harness.terminals[0]!,
    lines: 100,
  });
  const echo = read.text.includes("ack:native-ui-audit");
  let nativeImage: { bytes: number; verified: boolean } | undefined;
  if (process.env.NATIVE_FLOW?.includes("terminal-images")) {
    const match = read.text
      .replace(/\s/g, "")
      .match(/ack:native-image-test'([^']+)'/);
    const ownedPrefix =
      process.cwd() +
      `/.data/sandbox/state/herdr-core/companion-sandbox/files/${harness.terminals[0]}/`;
    if (match?.[1].startsWith(ownedPrefix)) {
      const bytes = readFileSync(match[1]);
      nativeImage = {
        bytes: bytes.length,
        verified: bytes.length > 8 && (bytes[0] === 137 || bytes[0] === 255),
      };
    }
    if (!nativeImage?.verified) process.exitCode = 1;
  }
  writeFileSync(
    `${output}/result.json`,
    JSON.stringify(
      {
        exitCode: code,
        realCoreInputEcho: echo,
        nativeImage,
        device: process.env.IOS_AUDIT_NAME ?? "iPhone 16 Pro · iOS 18.5",
      },
      null,
      2,
    ),
  );
  if (code !== 0 || !echo) process.exitCode = 1;
} finally {
  clearInterval(poll);
  if (deviceId) harness.store.revoke(deviceId);
  await harness.stop();
}
