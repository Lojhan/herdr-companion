import { it, expect } from "vitest";
import { validateImage, MAX_IMAGE_BYTES } from "./terminal-attachments.js";
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);
it("retains image bytes, detects format and strips paths from filenames", () => {
  const result = validateImage(
    png.toString("base64"),
    "../../demo;echo bad.jpeg",
  );
  expect(result.name).toBe("demo_echo bad.png");
  expect(Buffer.from(result.data, "base64")).toEqual(png);
});
it("refuses malformed, non-image and oversized uploads", () => {
  for (const data of [
    "abc!",
    "eA==",
    Buffer.alloc(MAX_IMAGE_BYTES + 1).toString("base64"),
  ])
    expect(() => validateImage(data, "test.png")).toThrow();
});
