export interface TerminalSurfaceActions {
  encodePaste: (text: string) => Promise<string>;
  focus: () => void;
  blur: () => void;
}
export interface TerminalSurfaceProps {
  onReady: () => void;
  onInput: (text: string) => void;
  onResize: (cols: number, rows: number) => void;
  register: (
    write: ((bytes: Uint8Array, consumed: () => void) => void) | null,
  ) => void;
  registerActions: (actions: TerminalSurfaceActions | null) => void;
  control: boolean;
  directInput: boolean;
  theme: import("@/lib/theme").ReturnTerminalTheme;
}
