import { useRef } from "react";
import { View } from "react-native";
import type { PanelResizeHandleProps } from "./panel-resize-handle.types";
export default function PanelResizeHandle(props: PanelResizeHandleProps) {
  const drag = useRef<{ x: number; value: number; closed: boolean } | null>(
    null,
  );
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={props.label}
      accessibilityValue={{ min: props.min, max: props.max, now: props.value }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => {
        if (
          e.nativeEvent.actionName === "decrement" &&
          props.value <= props.min &&
          props.onClose
        )
          props.onClose();
        else
          props.onChange(
            Math.max(
              props.min,
              Math.min(
                props.max,
                props.value +
                  (e.nativeEvent.actionName === "increment" ? 16 : -16),
              ),
            ),
          );
      }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        drag.current = {
          x: e.nativeEvent.pageX,
          value: props.value,
          closed: false,
        };
      }}
      onResponderMove={(e) => {
        const start = drag.current;
        if (!start || start.closed) return;
        const next =
          start.value +
          (e.nativeEvent.pageX - start.x) * (props.side === "left" ? 1 : -1);
        if (
          next < (props.min - 40) * 0.25 &&
          start.value >= props.min &&
          props.onClose
        ) {
          start.closed = true;
          props.onClose();
          return;
        }
        props.onChange(
          Math.max((props.min - 40) * 0.25, Math.min(props.max, next)),
        );
      }}
      onResponderRelease={() => {
        drag.current = null;
      }}
      onResponderTerminate={() => {
        drag.current = null;
      }}
      hitSlop={18}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [props.side === "left" ? "right" : "left"]: -4,
        width: 8,
        zIndex: 50,
      }}
    />
  );
}
