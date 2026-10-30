export interface DiffLine {
  kind: "context" | "add" | "remove" | "hunk" | "meta";
  text: string;
  oldLine: number | null;
  newLine: number | null;
}
export function parseUnifiedDiff(patch: string): DiffLine[] {
  let oldLine = 0,
    newLine = 0,
    hunk = false;
  const rows: DiffLine[] = [];
  const lines = patch.split("\n");
  if (lines.at(-1) === "") lines.pop();
  for (const line of lines) {
    const match = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (match) {
      oldLine = Number(match[1]);
      newLine = Number(match[2]);
      hunk = true;
      rows.push({ kind: "hunk", text: line, oldLine: null, newLine: null });
      continue;
    }
    if (line.startsWith("diff --git ")) hunk = false;
    if (hunk && line.startsWith("+"))
      rows.push({
        kind: "add",
        text: line.slice(1),
        oldLine: null,
        newLine: newLine++,
      });
    else if (hunk && line.startsWith("-"))
      rows.push({
        kind: "remove",
        text: line.slice(1),
        oldLine: oldLine++,
        newLine: null,
      });
    else if (hunk && line.startsWith(" "))
      rows.push({
        kind: "context",
        text: line.slice(1),
        oldLine: oldLine++,
        newLine: newLine++,
      });
    else rows.push({ kind: "meta", text: line, oldLine: null, newLine: null });
  }
  return rows;
}
