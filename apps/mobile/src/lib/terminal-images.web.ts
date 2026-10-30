import {
  imageId,
  MAX_IMAGE_BYTES,
  type TerminalImage,
} from "./terminal-images.types";
export async function fileImage(file: File): Promise<TerminalImage> {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type))
    throw Error("Choose a PNG, JPEG, WebP or GIF image");
  if (file.size > MAX_IMAGE_BYTES)
    throw Error("Images must be 8 MB or smaller");
  const uri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(Error("Could not read image"));
    reader.readAsDataURL(file);
  });
  return {
    id: imageId(),
    name: file.name || "image.png",
    data: uri.split(",")[1]!,
    uri,
  };
}
export function pickTerminalImages(): Promise<TerminalImage[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.multiple = true;
    input.onchange = () =>
      void Promise.all(Array.from(input.files ?? []).map(fileImage)).then(
        resolve,
        reject,
      );
    input.oncancel = () => resolve([]);
    input.click();
  });
}
export async function pasteTerminalContent(): Promise<{
  images: TerminalImage[];
  text: string;
}> {
  const items = await navigator.clipboard.read();
  const images: TerminalImage[] = [];
  let text = "";
  for (const item of items) {
    const type = item.types.find((t) => /^image\/(png|jpeg|webp|gif)$/.test(t));
    if (type)
      images.push(
        await fileImage(
          new File(
            [await item.getType(type)],
            `clipboard.${type.split("/")[1]}`,
            { type },
          ),
        ),
      );
    else if (item.types.includes("text/plain"))
      text += await (await item.getType("text/plain")).text();
  }
  return { images, text };
}
export function registerImagePaste(
  target: unknown,
  onImages: (images: TerminalImage[]) => void,
  onError: (message: string) => void,
) {
  const node = target as HTMLElement;
  const receive = (event: ClipboardEvent | DragEvent) => {
    const files = Array.from(
      ("clipboardData" in event ? event.clipboardData : event.dataTransfer)
        ?.files ?? [],
    );
    if (!files.length) return;
    event.preventDefault();
    if (files.length > 4) {
      onError("Attach up to four images at a time");
      return;
    }
    void Promise.all(files.map(fileImage)).then(onImages, (error) =>
      onError((error as Error).message),
    );
  };
  const paste = (e: ClipboardEvent) => receive(e),
    drop = (e: DragEvent) => receive(e),
    drag = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };
  node.addEventListener("paste", paste);
  node.addEventListener("drop", drop);
  node.addEventListener("dragover", drag);
  return () => {
    node.removeEventListener("paste", paste);
    node.removeEventListener("drop", drop);
    node.removeEventListener("dragover", drag);
  };
}
