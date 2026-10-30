import { z } from "zod";
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const imageUpload = z
  .object({
    terminal: z.string().min(1).max(200),
    coreId: z.string().min(1).max(128),
    createdMs: z.string().regex(/^\d+$/),
    name: z.string().min(1).max(255),
    data: z
      .string()
      .min(4)
      .max(Math.ceil(MAX_IMAGE_BYTES / 3) * 4),
  })
  .strict();
export function validateImage(data: string, name: string) {
  if (data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data))
    throw Error("Image must be valid base64");
  const bytes = Buffer.from(data, "base64");
  if (
    !bytes.length ||
    bytes.length > MAX_IMAGE_BYTES ||
    bytes.toString("base64") !== data
  )
    throw Error("Image exceeds 8 MB or has invalid encoding");
  const ext = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? "png"
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? "jpg"
      : /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString())
        ? "gif"
        : bytes.subarray(0, 4).toString() === "RIFF" &&
            bytes.subarray(8, 12).toString() === "WEBP"
          ? "webp"
          : null;
  if (!ext) throw Error("Choose a PNG, JPEG, WebP or GIF image");
  const stem =
    name
      .split(/[\\/]/)
      .at(-1)!
      .replace(/\.[^.]*$/, "")
      .replace(/[^a-zA-Z0-9 _.-]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 100) || "image";
  return { name: `${stem}.${ext}`, data: bytes.toString("base64") };
}
