import { it, expect } from "vitest";
import { parseUnifiedDiff } from "../../apps/mobile/src/lib/unified-diff";
it("tracks both line number columns across multiple diff hunks", () => {
  const rows = parseUnifiedDiff(
    "--- a/a.ts\n+++ b/a.ts\n@@ -1,2 +1,2 @@\n same\n-old\n+new\n@@ -9 +9,2 @@\n nine\n+ten\n\\ No newline at end of file\n",
  );
  expect(rows.find((r) => r.text === "old")).toMatchObject({
    kind: "remove",
    oldLine: 2,
    newLine: null,
  });
  expect(rows.find((r) => r.text === "new")).toMatchObject({
    kind: "add",
    oldLine: null,
    newLine: 2,
  });
  expect(rows.find((r) => r.text === "ten")).toMatchObject({
    kind: "add",
    newLine: 10,
  });
});
