// Generated from pinned herdr-core 0.1.14 (Apache-2.0). Do not edit.
export type IdleOrWorking = 'idle' | 'working';
export type Children = 'any' | 'all';

export interface CoreMethods {
  hello: {
    params: {
      /**
       * What that core calls this one (`rohan`), so news about `t7` reaches it as `rohan/t7`.
       */
      calls_you?: string | null;
      /**
       * Another core dialing in: who it is. Its terminals may then be parents
       * of terminals here, and hear from them.
       */
      core?: CoreInfo | null;
      /**
       * Switch this connection to framed mode after the reply.
       */
      framed?: boolean;
      /**
       * Protocol generation the caller speaks.
       */
      generation?: number | null;
    };
    result: HelloResult;
  };
  'server.status': {
    params: {};
    result: StatusResult;
  };
  'server.stop': {
    params: {};
    result: StopResult;
  };
  'server.restart': {
    params: {};
    result: StopResult;
  };
  'terminal.run': {
    params: {
      /**
       * Program and arguments, or a template name and its task. With neither
       * argv nor line: that machine's own shell.
       */
      argv?: string[];
      /**
       * Who is calling (`HC_TERMINAL_ID` inside a terminal).
       */
      caller?: string | null;
      /**
       * Working directory (default: where hc runs; through the API, the core's;
       * with --on, that machine's home).
       */
      cwd?: string | null;
      /**
       * Ignored: children end with their parent unless `outlive_parent`.
       */
      die_with_parent?: boolean;
      /**
       * Set on top of the core's environment. Clients pass their terminal
       * identity here (TERM, TERM_PROGRAM, COLORTERM).
       */
      env?: {
        [k: string]: string;
      };
      /**
       * Replace lost programs with a shell in place, never re-run the original command.
       */
      keep?: boolean;
      /**
       * Labels, key=value (repeatable).
       */
      labels?: {
        [k: string]: string;
      };
      /**
       * A shell line instead of argv, run by that machine's shell (`sh -c`;
       * Windows `%COMSPEC% /d /s /c`). The CLI sends one string with spaces or
       * shell signs as a line.
       */
      line?: string | null;
      /**
       * Name, unique among live terminals: 1-32 of a-z 0-9 - _ .
       */
      name?: string | null;
      /**
       * Don't type notes about it into its parent.
       */
      no_notify?: boolean;
      /**
       * No parent, even when started from a terminal.
       */
      no_parent?: boolean;
      /**
       * Run it on another machine (see `hc machine ls`); its address is `machine/t7`.
       */
      on?: string | null;
      /**
       * Keep it running when its parent's program ends (by default it ends too).
       */
      outlive_parent?: boolean;
      /**
       * Parent terminal (default: the terminal it is started from).
       */
      parent?: string | null;
      /**
       * Remove it right after it exits (once a waiting parent has the exit code).
       */
      rm?: boolean;
      /**
       * Seconds before a wait checks in, leaving it running (default: config
       * `wait_timeout`, else 180).
       */
      timeout?: number | null;
      /**
       * Then wait until it is not working, like `terminal.wait`, and return its
       * output (the CLI waits unless --bg).
       */
      wait?: boolean;
    };
    result: RunResult;
  };
  'templates.list': {
    params: {};
    result: TemplatesResult;
  };
  'terminal.list': {
    params: {
      /**
       * Include finished terminals.
       */
      all?: boolean;
      /**
       * Only terminals carrying all of these labels (repeatable).
       */
      labels?: {
        [k: string]: string;
      };
    };
    result: ListResult;
  };
  'terminal.get': {
    params: {
      /**
       * Who is calling; a parent looking at its child has seen its news.
       */
      caller?: string | null;
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
    };
    result: Terminal;
  };
  'terminal.kill': {
    params: {
      /**
       * Who is calling; a parent looking at its child has seen its news.
       */
      caller?: string | null;
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
    };
    result: Terminal;
  };
  'terminal.rm': {
    params: {
      /**
       * Who is calling; a parent looking at its child has seen its news.
       */
      caller?: string | null;
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
    };
    result: RemoveResult;
  };
  'terminal.keep': {
    params: {
      /**
       * Keep this live terminal after loss. Existing streams end with the loss reason; reattach after `restarted`.
       */
      keep: boolean;
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
    };
    result: Terminal;
  };
  'terminal.label': {
    params: {
      /**
       * Labels to set, key=value; `key=` removes one.
       */
      labels: {
        [k: string]: string;
      };
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
    };
    result: Terminal;
  };
  'terminal.read': {
    params: {
      caller?: string | null;
      /**
       * Lines of history above the screen.
       */
      lines?: number;
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
    };
    result: ReadResult;
  };
  'terminal.attach': {
    params: {
      /**
       * Who is calling (`HC_TERMINAL_ID` inside a terminal): never itself.
       */
      caller?: string | null;
      /**
       * The viewer's size in cells.
       */
      cols: number;
      display?: Display;
      /**
       * Scrollback lines to show first (main screen only).
       */
      history?: number;
      /**
       * Watch only: never type or resize.
       */
      observe?: boolean;
      /**
       * Back after a dropped line: sets the size only once active again.
       */
      resumed?: boolean;
      rows: number;
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
    };
    result: AttachResult;
  };
  'terminal.send': {
    params: {
      /**
       * Who is sending (`HC_TERMINAL_ID`, else the calling process's parent), so a
       * bare wait from the same caller waits for this send's turn.
       */
      caller?: string | null;
      /**
       * Type even if the program is blocked (it may answer its dialog).
       */
      force?: boolean;
      /**
       * Only type if the status is exactly this.
       */
      if?: IdleOrWorking | null;
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
      /**
       * Pasted, then submitted with Enter.
       */
      text: string;
      /**
       * With wait: seconds before it checks in (default: config, else 180).
       */
      timeout?: number | null;
      /**
       * Then wait for the turn this send started.
       */
      wait?: boolean;
    };
    result: SendResult;
  };
  'terminal.wait': {
    params: {
      /**
       * See `terminal.send`.
       */
      caller?: string | null;
      /**
       * Wait on children instead: all = until none is working, any = next news or a message to you.
       *
       * `all`: until none of the children is working (one that hasn't reported
       * yet counts as working). `any`: the parent's unseen news (a turn ended, it
       * blocked, it hit an error, it exited), else the next child to stop working; for the parent
       * itself, also a message typed into it while it worked (reason `message`).
       */
      children?: Children | null;
      /**
       * For programs, not agents: end when output printed after the wait started
       * contains this text (plain text, escape sequences stripped). Blocked,
       * error or exit end it too.
       */
      output?: string | null;
      /**
       * The terminal; with `children`, whose children (default: the caller).
       */
      terminal?: string | null;
      /**
       * Seconds before it checks in (default: config `wait_timeout`, else 180).
       */
      timeout?: number | null;
    };
    result: WaitResult;
  };
  'terminal.keys': {
    params: {
      caller?: string | null;
      /**
       * Key names: enter, esc, tab, up, ctrl+c, alt+x, f5, a, ...
       */
      keys: string[];
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
    };
    result: KeysResult;
  };
  'terminal.interrupt': {
    params: {
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
      /**
       * Seconds to watch for an effect (default 10).
       */
      timeout?: number | null;
    };
    result: InterruptResult;
  };
  'terminal.put': {
    params: {
      /**
       * Its bytes, base64; at most 8 MB raw.
       */
      data: string;
      /**
       * The file's name, kept so `.png` stays `.png` (CLI: the local file to send).
       */
      name: string;
      /**
       * The terminal: `t7`, a name, or `machine/t7`.
       */
      terminal: string;
    };
    result: PutResult;
  };
  'machine.exec': {
    params: {
      /**
       * Program and arguments, run as given (no shell).
       */
      argv?: string[];
      /**
       * Working directory (default: where hc runs; through the API, the core's;
       * with --on, that machine's home).
       */
      cwd?: string | null;
      /**
       * Set on top of the core's environment, key=value (repeatable).
       */
      env?: {
        [k: string]: string;
      };
      /**
       * Bytes for its stdin, base64, at most 8 MB raw (without: stdin is closed).
       */
      input?: string | null;
      /**
       * A shell line instead of argv, run by that machine's shell (`sh -c`;
       * Windows `%COMSPEC% /d /s /c`). The CLI sends one string with spaces or
       * shell signs as a line.
       */
      line?: string | null;
      /**
       * Run it on another machine (see `hc machine ls`).
       */
      on?: string | null;
      /**
       * Seconds before it and everything it started are ended (default 60, at most 600).
       */
      timeout?: number | null;
    };
    result: ExecResult;
  };
  'file.read': {
    params: {
      /**
       * Where a relative path starts (default: where hc runs; through the API,
       * the core's; with --on, that machine's home).
       */
      cwd?: string | null;
      /**
       * At most this many lines (default: all, up to 8 MB).
       */
      limit?: number | null;
      /**
       * The first line to give, from 1.
       */
      offset?: number | null;
      /**
       * On another machine (see `hc machine ls`).
       */
      on?: string | null;
      /**
       * The file: absolute, or from `cwd`.
       */
      path: string;
    };
    result: FileReadResult;
  };
  'file.write': {
    params: {
      /**
       * Where a relative path starts (default: where hc runs; through the API,
       * the core's; with --on, that machine's home).
       */
      cwd?: string | null;
      /**
       * Its new content, base64, at most 8 MB raw (CLI: what is piped in).
       */
      data: string;
      /**
       * On another machine (see `hc machine ls`).
       */
      on?: string | null;
      /**
       * The file: absolute, or from `cwd`.
       */
      path: string;
    };
    result: FileResult;
  };
  'file.edit': {
    params: {
      /**
       * Where a relative path starts (default: where hc runs; through the API,
       * the core's; with --on, that machine's home).
       */
      cwd?: string | null;
      /**
       * Replacements, all made or none (CLI: --old/--new pairs).
       */
      edits: Edit[];
      /**
       * On another machine (see `hc machine ls`).
       */
      on?: string | null;
      /**
       * The file: absolute, or from `cwd`.
       */
      path: string;
    };
    result: FileResult;
  };
  'doc.get': {
    params: {
      /**
       * Document name, using the terminal name rules.
       */
      name: string;
      /**
       * Another machine; omitted for this core.
       */
      on?: string | null;
    };
    result: DocGetResult;
  };
  'doc.set': {
    params: {
      name: string;
      on?: string | null;
      /**
       * Any JSON value, at most 1 MiB when serialized; null deletes it.
       */
      value: {
        [k: string]: unknown;
      };
      /**
       * Current version from doc.get; zero for a name never written. Lossless uint64: decimal string on companion boundary.
       */
      version: string;
    };
    result: DocSetResult;
  };
  'events.subscribe': {
    params: {
      /**
       * Only children of this terminal.
       */
      children_of?: string | null;
      /**
       * Only terminals carrying all of these labels (repeatable).
       */
      labels?: {
        [k: string]: string;
      };
      /**
       * Only this terminal.
       */
      terminal?: string | null;
    };
    result: SubscribeResult;
  };
  'machine.add': {
    params: {
      /**
       * What to call it here (default: the target's host).
       */
      name?: string | null;
      /**
       * The hc session on that machine (default: its default).
       */
      session?: string | null;
      /**
       * How ssh reaches it: `vps`, `can@10.0.0.7`, a Host from ~/.ssh/config.
       */
      target?: string | null;
      /**
       * Mark it short-lived (a sandbox for a task), so clients can show it apart
       * from machines that stay. hc treats it like any other; remove it with
       * `hc machine rm`.
       */
      temporary?: boolean;
      /**
       * Reach it with this command instead of ssh: it is given a shell line to
       * run there as its last argument, like ssh (`ssh -p 2222 -i key user@ip`,
       * `fly ssh console -a app --pty=false -C`). It must pass bytes both ways
       * untouched and ask nothing. Needs --name.
       */
      via?: string | null;
    };
    result: Machine;
  };
  'machine.list': {
    params: {};
    result: MachineListResult;
  };
  'machine.connect': {
    params: {
      /**
       * The machine's name.
       */
      machine: string;
    };
    result: MachineView;
  };
  'machine.rename': {
    params: {
      /**
       * The machine's name now.
       */
      machine: string;
      /**
       * Its new name. Addresses with the old one stop working.
       */
      new_name: string;
    };
    result: Machine;
  };
  'machine.rm': {
    params: {
      /**
       * The machine's name.
       */
      machine: string;
    };
    result: RemoveResult;
  };
  'rpc.discover': {
    params: {};
    /**
     * Opaque OpenRPC document; external meta-schema is not fetched during generation.
     */
    result: {
      [k: string]: unknown;
    };
  };
}
export interface CoreInfo {
  /**
   * Permanent random id, reset only when state is wiped.
   */
  id: string;
  /**
   * Display name, the hostname by default.
   */
  name: string;
}
export interface HelloResult {
  core: CoreInfo;
  features: string[];
  framed: boolean;
  generation: number;
  methods: string[];
  version: string;
}
export interface StatusResult {
  core: CoreInfo;
  finished: number;
  /**
   * The holder new terminals go to.
   */
  holder?: HolderInfo | null;
  /**
   * Every holder: after an update, older ones run their terminals to the end.
   */
  holders: HolderInfo[];
  /**
   * The package manager this hc came from (homebrew, nix, mise): it
   * updates hc, `hc update` won't. Null for a plain install.
   */
  installed_by?: string | null;
  live: number;
  pid: number;
  /**
   * Lossless uint64: decimal string on companion boundary.
   */
  uptime_ms: string;
  version: string;
}
export interface HolderInfo {
  /**
   * Same build as the core: takes new terminals. Others drain.
   */
  current: boolean;
  instance: string;
  pid: number;
  /**
   * Live terminals it runs.
   */
  terminals: number;
}
export interface StopResult {
  stopped: boolean;
}
export interface RunResult {
  /**
   * `t7`: this terminal forever on this core.
   */
  address: string;
  argv: string[];
  cols: number;
  /**
   * Lossless uint64: decimal string on companion boundary.
   */
  created_ms: string;
  cwd: string;
  die_with_parent?: boolean;
  exit_code?: number | null;
  /**
   * Lossless uint64: decimal string on companion boundary.
   */
  finished_ms?: string | null;
  /**
   * Template runs: whether the first message went in.
   */
  first_message?: FirstMessage | null;
  /**
   * What runs in it right now and where (null once it has finished).
   */
  foreground?: Foreground | null;
  /**
   * Which terminal the program believes it runs in (TERM_PROGRAM and
   * version), fixed at start; XTVERSION answers with it.
   */
  identity?: string;
  /**
   * Replace a lost program with this machine’s shell, in place. Exit with a code and kill remain final.
   */
  keep?: boolean;
  labels: {
    [k: string]: string;
  };
  name?: string | null;
  /**
   * Its parent gets notes about it (see `--no-notify`).
   */
  notify?: boolean;
  /**
   * With `wait`: its text then, like `terminal.read` (the screen, plus
   * history unless it is a full-screen app).
   */
  output?: string | null;
  /**
   * The terminal that started it (`t3`), set once at start.
   */
  parent?: string | null;
  /**
   * Lossless uint64: decimal string on companion boundary.
   */
  paste_gap_ms?: string | null;
  pid?: number | null;
  /**
   * Why its program ended or is pending (`spawn_pending` means its initial
   * spawn timed out, but the holder may still be starting it):
   * exited, killed, server_stop, host_shutdown (Windows
   * is ending the session, including logout), signaled (a kept program
   * died by signal without an exit code), holder_lost (its holder
   * died), stopped_by_restart (nothing ran it any more after a restart).
   */
  reason?: string | null;
  /**
   * Other 7501 records by id (programs reporting on several things).
   */
  records?: {
    [k: string]: Status;
  };
  /**
   * Whether the program ever sent a 7501 report.
   */
  reported?: boolean;
  /**
   * Removed right after it exits (once a waiting parent has the exit code).
   */
  rm?: boolean;
  rows: number;
  /**
   * "exact", or "inexact" after a core crash (older history may be missing).
   */
  screen: string;
  signal?: number | null;
  /**
   * "live" or "finished".
   */
  state: string;
  /**
   * The program's own word for what it's doing (OSC 7501 root record);
   * null if it never said, or after it exited.
   */
  status?: Status | null;
  /**
   * When that word last changed, ms since the epoch; null if it never said. Lossless uint64: decimal string on companion boundary.
   */
  status_ms?: string | null;
  stop?: string | null;
  /**
   * Template overrides: the key that submits a message, the stop key, the pause
   * between paste and submit.
   */
  submit?: string | null;
  /**
   * The template that started it.
   */
  template?: string | null;
  title?: string;
  /**
   * Goes up each time the status leaves `working`. Lossless uint64: decimal string on companion boundary.
   */
  turn?: string;
  /**
   * With `wait`: how the wait ended (exit, a status, or timeout: still running).
   */
  wait?: WaitResult | null;
}
export interface FirstMessage {
  /**
   * Why it was not sent.
   */
  reason?: string | null;
  sent: boolean;
  /**
   * Whether the agent started working on it (see terminal.send).
   */
  started?: boolean | null;
  /**
   * The turn when it went in (see terminal.send). Lossless uint64: decimal string on companion boundary.
   */
  turn?: string | null;
}
export interface Foreground {
  argv: string[];
  /**
   * Its working directory now (resolved by the OS).
   */
  cwd: string;
  /**
   * Its name as the OS has it (`node`, `vim`, `sh`).
   */
  name: string;
  /**
   * The foreground process group's leader.
   */
  pid: number;
}
/**
 * One 7501 record. Words are the program's own; nothing is translated.
 */
export interface Status {
  app?: string;
  /**
   * permission, question or auth (blocked only, when the program said).
   */
  kind?: string | null;
  msg?: string;
  /**
   * 0..100 (working or blocked, when the program said).
   */
  progress?: number | null;
  /**
   * idle, working, done, blocked or error.
   */
  state: string;
  title?: string;
}
export interface WaitResult {
  /**
   * With `children`: one result per child it reports on.
   */
  children: WaitResult[];
  /**
   * False on timeout: a check-in, the terminal is still running.
   */
  ended: boolean;
  exit_code?: number | null;
  /**
   * With a message: the sender's address (the text is already in your input);
   * null when a person sent it.
   */
  from?: string | null;
  /**
   * status, exit (including program loss in a kept terminal), output, timeout,
   * or not_started (after a send: it did not start working; a plain wait
   * still follows that send's turn); with
   * `children`: children; message (someone messaged the waiter, any
   * wait); for each child in `children`: status, exit, or running (still
   * working).
   */
  reason: string;
  signal?: number | null;
  /**
   * The exact word the program reported (current word on timeout or output).
   */
  status?: string | null;
  terminal: string;
  /**
   * Lossless uint64: decimal string on companion boundary.
   */
  turn: string;
}
export interface TemplatesResult {
  templates: TemplateInfo[];
}
export interface TemplateInfo {
  command: string;
  description: string;
  /**
   * Set when the file can't be used.
   */
  error?: string | null;
  name: string;
}
export interface ListResult {
  /**
   * Finished terminals left out (see `all`).
   */
  hidden_finished: number;
  /**
   * Machines added here and their lines: one that is not connected is
   * listed here, not waited on.
   */
  machines: MachineView[];
  /**
   * This machine's terminals, then each connected machine's (`machine/t7`).
   */
  terminals: Terminal[];
}
/**
 * A machine as `machine ls` and `ls` show it: its profile and its line now.
 */
export interface MachineView {
  /**
   * What that core calls itself (its hostname).
   */
  host: string;
  /**
   * The other core's permanent id.
   */
  id: string;
  /**
   * What this core calls it: `rohan` in `rohan/t7`.
   */
  name: string;
  /**
   * The hc session there (null: its default).
   */
  session?: string | null;
  /**
   * Since when it is not connected (ms since the epoch). Lossless uint64: decimal string on companion boundary.
   */
  since_ms?: string | null;
  /**
   * connecting, connected, needs_login or unreachable.
   */
  state: string;
  /**
   * How it is reached: an ssh target, or (`via`) a command.
   */
  target: string;
  /**
   * Short-lived (a sandbox for a task): clients may show it apart from the
   * machines that stay. hc treats it like any other.
   */
  temporary?: boolean;
  /**
   * Its hc version when last seen.
   */
  version: string;
  /**
   * `target` is a command that runs a shell line there, given as its last
   * argument, like ssh (a provider's own CLI, ssh with its options).
   */
  via?: boolean;
  why?: string | null;
}
export interface Terminal {
  /**
   * `t7`: this terminal forever on this core.
   */
  address: string;
  argv: string[];
  cols: number;
  /**
   * Lossless uint64: decimal string on companion boundary.
   */
  created_ms: string;
  cwd: string;
  die_with_parent?: boolean;
  exit_code?: number | null;
  /**
   * Lossless uint64: decimal string on companion boundary.
   */
  finished_ms?: string | null;
  /**
   * What runs in it right now and where (null once it has finished).
   */
  foreground?: Foreground | null;
  /**
   * Which terminal the program believes it runs in (TERM_PROGRAM and
   * version), fixed at start; XTVERSION answers with it.
   */
  identity?: string;
  /**
   * Replace a lost program with this machine’s shell, in place. Exit with a code and kill remain final.
   */
  keep?: boolean;
  labels: {
    [k: string]: string;
  };
  name?: string | null;
  /**
   * Its parent gets notes about it (see `--no-notify`).
   */
  notify?: boolean;
  /**
   * The terminal that started it (`t3`), set once at start.
   */
  parent?: string | null;
  /**
   * Lossless uint64: decimal string on companion boundary.
   */
  paste_gap_ms?: string | null;
  pid?: number | null;
  /**
   * Why its program ended or is pending (`spawn_pending` means its initial
   * spawn timed out, but the holder may still be starting it):
   * exited, killed, server_stop, host_shutdown (Windows
   * is ending the session, including logout), signaled (a kept program
   * died by signal without an exit code), holder_lost (its holder
   * died), stopped_by_restart (nothing ran it any more after a restart).
   */
  reason?: string | null;
  /**
   * Other 7501 records by id (programs reporting on several things).
   */
  records?: {
    [k: string]: Status;
  };
  /**
   * Whether the program ever sent a 7501 report.
   */
  reported?: boolean;
  /**
   * Removed right after it exits (once a waiting parent has the exit code).
   */
  rm?: boolean;
  rows: number;
  /**
   * "exact", or "inexact" after a core crash (older history may be missing).
   */
  screen: string;
  signal?: number | null;
  /**
   * "live" or "finished".
   */
  state: string;
  /**
   * The program's own word for what it's doing (OSC 7501 root record);
   * null if it never said, or after it exited.
   */
  status?: Status | null;
  /**
   * When that word last changed, ms since the epoch; null if it never said. Lossless uint64: decimal string on companion boundary.
   */
  status_ms?: string | null;
  stop?: string | null;
  /**
   * Template overrides: the key that submits a message, the stop key, the pause
   * between paste and submit.
   */
  submit?: string | null;
  /**
   * The template that started it.
   */
  template?: string | null;
  title?: string;
  /**
   * Goes up each time the status leaves `working`. Lossless uint64: decimal string on companion boundary.
   */
  turn?: string;
}
export interface RemoveResult {
  removed: string;
}
export interface ReadResult {
  /**
   * False when part of what was asked for may be missing.
   */
  complete: boolean;
  /**
   * "screen", "history", or "stitched" (a full-screen app, read by scrolling it).
   */
  how: string;
  text: string;
  /**
   * Why only the screen: "working" (a full-screen app isn't scrolled while
   * it works; read again once it stops).
   */
  why?: string | null;
}
/**
 * The viewer's own colors and cell size, used to answer display queries.
 */
export interface Display {
  /**
   * Default background as `#rrggbb`.
   */
  bg?: string | null;
  /**
   * Cell size in pixels: `[width, height]`.
   *
   * @minItems 2
   * @maxItems 2
   */
  cell?: [number, number] | null;
  /**
   * Cursor color as `#rrggbb`.
   */
  cursor?: string | null;
  /**
   * Default foreground as `#rrggbb`.
   */
  fg?: string | null;
}
export interface AttachResult {
  /**
   * Stream channel: first paint, then live bytes. Send keys as DATA on it;
   * RESIZE, FOCUS, FACTS, CREDIT and CLOSE frames control it.
   */
  channel: number;
  terminal: Terminal;
}
export interface SendResult {
  /**
   * Whether it went `working` within a few seconds; null when it doesn't
   * report status, so nobody can tell.
   */
  started?: boolean | null;
  /**
   * The program's status word when the text went in (null: it never said).
   */
  status?: string | null;
  /**
   * The turn when the text went in. Lossless uint64: decimal string on companion boundary.
   */
  turn: string;
  /**
   * With `wait`: how that turn ended.
   */
  wait?: WaitResult | null;
}
export interface KeysResult {
  status?: string | null;
  /**
   * Lossless uint64: decimal string on companion boundary.
   */
  turn: string;
}
export interface InterruptResult {
  /**
   * The key sent: esc for programs that report status, else ctrl+c.
   */
  key: string;
  /**
   * stopped (left working, or a shell got its prompt back), exited,
   * still_working (no change in time), or unknown (it doesn't report status).
   */
  outcome: string;
}
export interface PutResult {
  bytes: number;
  /**
   * Where it landed, as the terminal's machine sees it.
   */
  path: string;
}
export interface ExecResult {
  /**
   * Its exit code; null when a signal ended it.
   */
  code?: number | null;
  /**
   * How long it ran, in milliseconds. Lossless uint64: decimal string on companion boundary.
   */
  ms: string;
  /**
   * The signal that ended it (Unix).
   */
  signal?: number | null;
  /**
   * What it wrote, base64: the first 1 MB.
   */
  stderr: string;
  /**
   * What it wrote, base64: the first 8 MB.
   */
  stdout: string;
  /**
   * It ran out of time and was ended: the output is what came so far.
   */
  timed_out: boolean;
  /**
   * It wrote more than was kept (it still ran to its end).
   */
  truncated: boolean;
}
export interface FileReadResult {
  /**
   * The first and last line given (last < first: none).
   */
  first: number;
  last: number;
  /**
   * Lines in the file.
   */
  lines: number;
  /**
   * The lines as they are in the file, line ends kept.
   */
  text: string;
}
export interface FileResult {
  bytes: number;
  /**
   * The file written, absolute.
   */
  path: string;
}
export interface Edit {
  new: string;
  /**
   * Exact text, found exactly once in the file as it was.
   */
  old: string;
}
export interface DocGetResult {
  value: unknown;
  /**
   * Zero when never written. Deletions retain their version. Lossless uint64: decimal string on companion boundary.
   */
  version: string;
}
export interface DocSetResult {
  /**
   * Lossless uint64: decimal string on companion boundary.
   */
  version: string;
}
export interface SubscribeResult {
  /**
   * Framed mode: the channel events arrive on (JSON lines, with credit).
   * Plain mode: none; this connection now carries only notifications.
   */
  channel?: number | null;
  /**
   * Events after this sequence follow. After a `missed` snapshot, ignore
   * events whose seq is not above the snapshot's. Lossless uint64: decimal string on companion boundary.
   */
  seq: string;
  /**
   * Matching terminals here and on connected machines (`machine/t7`).
   */
  terminals: Terminal[];
}
export interface Machine {
  /**
   * What that core calls itself (its hostname).
   */
  host: string;
  /**
   * The other core's permanent id.
   */
  id: string;
  /**
   * What this core calls it: `rohan` in `rohan/t7`.
   */
  name: string;
  /**
   * The hc session there (null: its default).
   */
  session?: string | null;
  /**
   * How it is reached: an ssh target, or (`via`) a command.
   */
  target: string;
  /**
   * Short-lived (a sandbox for a task): clients may show it apart from the
   * machines that stay. hc treats it like any other.
   */
  temporary?: boolean;
  /**
   * Its hc version when last seen.
   */
  version: string;
  /**
   * `target` is a command that runs a shell line there, given as its last
   * argument, like ssh (a provider's own CLI, ssh with its options).
   */
  via?: boolean;
}
export interface MachineListResult {
  machines: MachineView[];
}

export type MethodName = keyof CoreMethods;
