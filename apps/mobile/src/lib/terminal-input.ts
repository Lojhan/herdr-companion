// Shell quoting applies only to host-generated attachment paths, never to the user's command.
export const quoteTerminalPath = (path: string) =>
  `'${path.replaceAll("'", "'\\''")}'`;
export const terminalKeys = [
  ["Esc", "\x1b"],
  ["Tab", "\t"],
  ["Shift+Tab", "\x1b[Z"],
  ["Enter", "\r"],
  ["↑", "\x1b[A"],
  ["↓", "\x1b[B"],
  ["←", "\x1b[D"],
  ["→", "\x1b[C"],
  ["Ctrl+C", "\x03"],
  ["Ctrl+D", "\x04"],
  ["Ctrl+L", "\x0c"],
  ["Home", "\x1b[H"],
  ["End", "\x1b[F"],
] as const;
