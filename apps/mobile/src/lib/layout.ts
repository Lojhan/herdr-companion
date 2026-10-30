import { usePanelLayout } from "./panel-layout";
import { uiSize } from "./design-tokens";
import { useViewport } from "./viewport";
export function useLayout() {
  const viewport = useViewport();
  const panels = usePanelLayout();
  const vertical = viewport.hinge?.orientation === "vertical",
    horizontal = viewport.hinge?.orientation === "horizontal";
  const split = vertical || horizontal || viewport.width >= 800;
  const sidebarWidth = vertical
    ? viewport.hinge!.offset
    : panels.collapsed
      ? !viewport.touch && viewport.width >= 800
        ? uiSize.railMouse
        : uiSize.railTouch
      : Math.min(panels.navigation, Math.max(200, viewport.width - 360));
  const paneWidth = vertical
    ? viewport.width - sidebarWidth - viewport.hinge!.size
    : split && !horizontal
      ? viewport.width - sidebarWidth
      : viewport.width;
  return {
    ...viewport,
    split,
    sidebarWidth,
    paneWidth,
    dense: !viewport.touch && viewport.width >= 800,
    short: viewport.height < 500,
  };
}
