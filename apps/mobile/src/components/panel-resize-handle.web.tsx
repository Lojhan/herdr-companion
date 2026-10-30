import { useEffect, useRef, useState } from "react";
import { useHerdrTheme } from "@/lib/theme";
import type { PanelResizeHandleProps } from "./panel-resize-handle.types";
export default function PanelResizeHandle({
  label,
  side,
  value,
  min,
  max,
  onChange,
  defaultValue,
  onClose,
}: PanelResizeHandleProps) {
  const { theme: t } = useHerdrTheme(),
    [active, setActive] = useState(false),
    [hovered, setHovered] = useState(false);
  const frame = useRef<number | null>(null);
  const pending = useRef<number | null>(null);
  const drag = useRef<{
    x: number;
    value: number;
    cursor: string;
    selection: string;
  } | null>(null);
  function finish() {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    if (pending.current !== null) {
      onChange(pending.current);
      pending.current = null;
    }
    const previous = drag.current;
    if (previous) {
      document.body.style.cursor = previous.cursor;
      document.body.style.userSelect = previous.selection;
      drag.current = null;
    }
    setActive(false);
  }
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      const previous = drag.current;
      if (previous) {
        document.body.style.cursor = previous.cursor;
        document.body.style.userSelect = previous.selection;
      }
    },
    [],
  );
  function change(next: number) {
    const state = { value, min, max, onChange };
    if (
      next < (state.min - 40) * 0.25 &&
      onClose &&
      drag.current &&
      drag.current.value >= state.min
    ) {
      pending.current = null;
      finish();
      onClose();
      return;
    }
    const clamped = Math.max(
      drag.current ? Math.max(32, (state.min - 40) * 0.25) : state.min,
      Math.min(state.max, next),
    );
    if (!drag.current) {
      state.onChange(clamped);
      return;
    }
    pending.current = clamped;
    if (frame.current === null)
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const width = pending.current;
        pending.current = null;
        if (width !== null) onChange(width);
      });
  }
  const direction = side === "left" ? 1 : -1;
  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = {
          x: e.clientX,
          value,
          cursor: document.body.style.cursor,
          selection: document.body.style.userSelect,
        };
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        setActive(true);
      }}
      onPointerMove={(e) => {
        if (drag.current)
          change(drag.current.value + (e.clientX - drag.current.x) * direction);
      }}
      onPointerUp={finish}
      onLostPointerCapture={finish}
      onPointerCancel={finish}
      onDoubleClick={() => change(defaultValue)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const delta = (e.key === "ArrowRight" ? 16 : -16) * direction;
          if (delta < 0 && value <= min && onClose) onClose();
          else change(value + delta);
        } else if (e.key === "Home") {
          e.preventDefault();
          change(defaultValue);
        }
      }}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side === "left" ? "right" : "left"]: -4,
        width: 8,
        zIndex: 50,
        cursor: "col-resize",
        touchAction: "none",
        outlineOffset: -2,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: active || hovered ? 2 : 1,
          height: "100%",
          background: active || hovered ? t.accent : "transparent",
          transition: "background 120ms",
        }}
      />
    </div>
  );
}
