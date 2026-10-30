import { useEffect, useRef, type ReactNode } from "react";
import { View } from "react-native";
export default function ContextMenuTarget({
  children,
  onOpen,
}: {
  children: ReactNode;
  onOpen: (point?: { x: number; y: number }) => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <View
      style={{ flex: 1, minHeight: 0 }}
      onTouchStart={(event) => {
        cancel();
        start.current = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
        };
        if (event.nativeEvent.touches.length === 1)
          timer.current = setTimeout(() => {
            timer.current = null;
            onOpen();
          }, 400);
      }}
      onTouchMove={(event) => {
        const origin = start.current;
        if (
          origin &&
          Math.hypot(
            event.nativeEvent.pageX - origin.x,
            event.nativeEvent.pageY - origin.y,
          ) > 10
        )
          cancel();
      }}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
    >
      {children}
    </View>
  );
}
