import { it, expect } from "vitest";
import { readDesktopSpaces } from "./desktop-spaces.js";
it("projects nested and floating terminals without changing the desktop document", () => {
  const document = {
    spaces: [
      {
        id: "s1",
        name: "Companion",
        folder: "/repo",
        custom: true,
        tabs: [
          {
            id: "tab1",
            name: "Code",
            root: {
              children: [
                { content: { terminal: "t1" } },
                { floating: [{ content: { terminal: "t2" } }] },
              ],
            },
          },
        ],
      },
    ],
  };
  const before = JSON.stringify(document);
  const result = readDesktopSpaces(document, "permanent-core", "vps");
  expect(result[0]?.tabs[0]?.terminals).toEqual(["vps/t1", "vps/t2"]);
  expect(result[0]?.id).toBe("permanent-core:s1");
  expect(JSON.stringify(document)).toBe(before);
});
it("keeps unwritten documents empty and rejects unsupported structures", () => {
  expect(readDesktopSpaces(null, "core", null)).toEqual([]);
  expect(() => readDesktopSpaces({ unrecognized: [] }, "core", null)).toThrow();
});
