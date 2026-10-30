export interface TerminalImage {
  id: string;
  name: string;
  data: string;
  uri: string;
  path?: string;
}
export const MAX_IMAGES = 4;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const imageId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;
