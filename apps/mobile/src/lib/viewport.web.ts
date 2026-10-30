import { useSyncExternalStore } from "react";
type State = {
  width: number;
  height: number;
  touch: boolean;
  hinge: {
    orientation: "vertical" | "horizontal";
    offset: number;
    size: number;
  } | null;
};
let snapshot: State = { width: 1280, height: 800, touch: false, hinge: null };
let probe: HTMLDivElement | undefined;
const listeners = new Set<() => void>();
let cleanup: (() => void) | undefined;
function start() {
  const horizontal = matchMedia("(horizontal-viewport-segments: 2)"),
    vertical = matchMedia("(vertical-viewport-segments: 2)"),
    touch = matchMedia("(pointer: coarse)");
  probe = document.createElement("div");
  Object.assign(probe.style, {
    position: "fixed",
    visibility: "hidden",
    pointerEvents: "none",
    width: "env(viewport-segment-width 0 0, 0px)",
    height: "env(viewport-segment-height 0 0, 0px)",
    left: "env(viewport-segment-left 1 0, 0px)",
    top: "env(viewport-segment-top 0 1, 0px)",
  });
  document.body.append(probe);
  const update = () => {
    const style = getComputedStyle(probe!),
      size = window.visualViewport;
    const width = size && size.scale === 1 ? size.width : innerWidth,
      height = size && size.scale === 1 ? size.height : innerHeight;
    let hinge: State["hinge"] = null;
    if (horizontal.matches) {
      const offset = parseFloat(style.width),
        end = parseFloat(style.left);
      if (offset > 0 && end >= offset)
        hinge = { orientation: "vertical", offset, size: end - offset };
    } else if (vertical.matches) {
      const offset = parseFloat(style.height),
        end = parseFloat(style.top);
      if (offset > 0 && end >= offset)
        hinge = { orientation: "horizontal", offset, size: end - offset };
    }
    const next = { width, height, touch: touch.matches, hinge };
    if (JSON.stringify(next) !== JSON.stringify(snapshot)) {
      snapshot = next;
      for (const listener of listeners) listener();
    }
  };
  window.addEventListener("resize", update);
  window.visualViewport?.addEventListener("resize", update);
  for (const media of [horizontal, vertical, touch])
    media.addEventListener("change", update);
  update();
  cleanup = () => {
    window.removeEventListener("resize", update);
    window.visualViewport?.removeEventListener("resize", update);
    for (const media of [horizontal, vertical, touch])
      media.removeEventListener("change", update);
    probe?.remove();
    probe = undefined;
    cleanup = undefined;
  };
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (!cleanup) start();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) cleanup?.();
  };
};
const serverSnapshot: State = {
  width: 1280,
  height: 800,
  touch: false,
  hinge: null,
};
export function useViewport() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => serverSnapshot,
  );
}
