import { useWindowDimensions } from "react-native";
export function useViewport() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    touch: true,
    hinge: null as {
      orientation: "vertical" | "horizontal";
      offset: number;
      size: number;
    } | null,
  };
}
