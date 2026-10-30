import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import {
  imageId,
  MAX_IMAGE_BYTES,
  type TerminalImage,
} from "./terminal-images.types";
export async function pickTerminalImages(): Promise<TerminalImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: 4,
    base64: true,
    quality: 0.9,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => {
    if (!asset.base64) throw Error("Could not read the selected image");
    if ((asset.base64.length * 3) / 4 > MAX_IMAGE_BYTES)
      throw Error("Images must be 8 MB or smaller");
    return {
      id: imageId(),
      name: asset.fileName ?? "image.jpg",
      data: asset.base64,
      uri: asset.uri,
    };
  });
}
export async function pasteTerminalContent(): Promise<{
  images: TerminalImage[];
  text: string;
}> {
  if (await Clipboard.hasImageAsync()) {
    const image = await Clipboard.getImageAsync({ format: "png" });
    if (image) {
      const data = image.data.replace(/^data:[^,]+,/, "");
      if ((data.length * 3) / 4 > MAX_IMAGE_BYTES)
        throw Error("Images must be 8 MB or smaller");
      return {
        images: [
          {
            id: imageId(),
            name: "clipboard.png",
            data,
            uri: `data:image/png;base64,${data}`,
          },
        ],
        text: "",
      };
    }
  }
  return { images: [], text: await Clipboard.getStringAsync() };
}
export function registerImagePaste(
  _target: unknown,
  _onImages: (images: TerminalImage[]) => void,
  _onError: (message: string) => void,
) {
  return () => {};
}
