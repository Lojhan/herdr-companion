import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import { icons } from "./paths";
export type IconName = keyof typeof icons;
export function Icon({
  name,
  size = 16,
  color,
}: {
  name: IconName;
  size?: number;
  color: string;
}) {
  return (
    <View
      testID="ui-icon"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <SvgXml
        xml={icons[name].replace(/\sclass="[^"]*"/g, "")}
        width={size}
        height={size}
        color={color}
      />
    </View>
  );
}
