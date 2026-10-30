import { use, useEffect, useState, type ReactNode } from "react";
import { readPanelWidths, writePanelWidths } from "./panel-preferences";
import { PanelLayoutContext as Context } from "./panel-layout-context";
export function PanelLayoutProvider({ children }: { children: ReactNode }) {
  const [widths, setWidths] = useState(
      () => readPanelWidths() ?? { navigation: 268, inspector: 420 },
    ),
    [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    writePanelWidths(widths);
  }, [widths]);
  return (
    <Context
      value={{
        ...widths,
        collapsed,
        setCollapsed,
        setNavigation: (navigation) => {
          setCollapsed(false);
          setWidths((w) => ({ ...w, navigation }));
        },
        setInspector: (inspector) => setWidths((w) => ({ ...w, inspector })),
      }}
    >
      {children}
    </Context>
  );
}
export const usePanelLayout = () => use(Context);
