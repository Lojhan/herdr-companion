import { createContext } from "react";
export const PanelLayoutContext = createContext({
  navigation: 268,
  inspector: 420,
  collapsed: false,
  setNavigation: (_value: number) => {},
  setInspector: (_value: number) => {},
  setCollapsed: (_value: boolean | ((value: boolean) => boolean)) => {},
});
