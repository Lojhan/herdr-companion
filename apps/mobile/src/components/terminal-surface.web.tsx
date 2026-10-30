import { installTerminalScrollbar } from "@/lib/terminal-scrollbar";
import { useEffect, useRef } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import type { TerminalSurfaceProps } from "./terminal-surface.types";
export default function TerminalSurface({
  onReady,
  onInput,
  onResize,
  register,
  control,
  directInput,
  registerActions,
  theme,
}: TerminalSurfaceProps) {
  const host = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onReady, onInput, onResize, register });
  useEffect(() => {
    handlers.current = { onReady, onInput, onResize, register };
  }, [onReady, onInput, onResize, register]);
  const terminal = useRef<Terminal | null>(null);
  useEffect(() => {
    const term = new Terminal({
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
      theme: { background: "#17191d", foreground: "#d2d4d9" },
      screenReaderMode: true,
      scrollback: 2000,
      convertEol: false,
      disableStdin: true,
    });
    terminal.current = term;
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host.current!);
    const removeScrollbarActivity = installTerminalScrollbar(term);
    const resize = () => {
      fit.fit();
      handlers.current.onResize(term.cols, term.rows);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host.current!);
    let collecting: string[] | null = null;
    const data = term.onData((text) => {
      if (collecting) collecting.push(text);
      else handlers.current.onInput(text);
    });
    registerActions({
      encodePaste: async (text) => {
        collecting = [];
        const disabled = term.options.disableStdin;
        try {
          term.options.disableStdin = false;
          term.paste(text);
          return collecting.join("");
        } finally {
          collecting = null;
          term.options.disableStdin = disabled;
        }
      },
      focus: () => term.focus(),
      blur: () => term.blur(),
    });
    handlers.current.register((bytes, consumed) => term.write(bytes, consumed));
    handlers.current.onReady();
    resize();
    return () => {
      removeScrollbarActivity();
      observer.disconnect();
      data.dispose();
      handlers.current.register(null);
      registerActions(null);
      term.dispose();
      terminal.current = null;
    };
    // Input mode is updated without discarding the terminal screen.
  }, [registerActions]);
  useEffect(() => {
    if (terminal.current) {
      terminal.current.options.disableStdin = !control;
      const input = host.current?.querySelector("textarea");
      if (input) input.readOnly = !directInput;
      if (control && directInput) terminal.current.focus();
    }
  }, [control, directInput]);
  useEffect(() => {
    if (terminal.current) terminal.current.options.theme = theme;
  }, [theme]);
  return (
    <div
      style={{
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        width: "100%",
        padding: "12px 14px",
        boxSizing: "border-box",
        background: theme.background,
      }}
    >
      {/* FitAddon measures this element's full box. Keep the inset outside it. */}
      <div
        ref={host}
        style={{ height: "100%", width: "100%", overflow: "hidden" }}
        aria-label="Live terminal"
      />
    </div>
  );
}
