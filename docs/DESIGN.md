# Herdr workspace UI

The companion now follows the default Herdr desktop workspace, replacing the initial dashboard. The reference is `herdrdev/herdr-app` at `3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2`, specifically `src/settings.rs`, `defaults/layouts/main.json` and the workspace-chrome, spaces, agents, tabs and workspace-status mods. References are vendored with the Apache-2.0 license and listed in `vendor/SOURCES.json`.

## Tokens and type

`apps/mobile/src/lib/theme.tsx` ports all four built-in palettes and the desktop's exact color-mixing rules. Graphite is the initial appearance; Settings offers Graphite, Ink, Moss and Paper. The choice persists separately from credentials. Terminal ANSI colors, foreground, cursor and selection follow the selected palette on both web and native WebView.

The UI uses the same Geist font file as Herdr. The terminal uses Herdr’s default JetBrains Mono at 14 px, with 14 px horizontal and 12 px vertical padding. The unmodified fonts retain their copyrights and SIL OFL files under `apps/mobile/assets/fonts/`. Icons use the pinned Herdr SVG paths, rendered in explicit square boxes through react-native-svg. Supplemental icons follow the same line geometry.

Desktop dimensions follow the source: 268 px expanded sidebar, 46 px brand row, 42 px tabs, 31 px sidebar section headers, 30 px sidebar rows and terminal pane header, 28 px status bar, 8 px pane gutters, 10 px pane radius, and 8 px row radius. The compact rail is 52 px, chosen for the browser rather than emulating macOS window controls. Navigation and controls on phones use larger touch targets.

## Responsive navigation

At widths of 800 px and up, spaces and live agents/terminals stay in the sidebar while content fills the remaining width. Settings and machines occupy the same content area. The sidebar can collapse without discarding the current terminal. Search filters actual spaces and terminals. No bottom navigation bar is shown.

Below 800 px, the workspace route is a full-width spaces/agents list. Selecting a space or agent opens its detail page. The back button returns to the list. Touch layouts use 44 px controls and a horizontally scrolling terminal special-key bar, including tablets. Dense mouse layouts retain desktop dimensions. Browser viewport segments reserve a dual-screen hinge and place the sidebar and content in separate segments; horizontal hinges stack the panels. Native uses available window dimensions and all four safe-area edges. Terminal streams detach on navigation blur as well as background/disconnect.

## Desktop spaces

The bridge subscribes before reading each connected core's `herdr-app` document. A bounded, read-only projection extracts space/tab names, folders, stable execution core identity, and terminal leaves including floating nodes. IDs are qualified with permanent core identity, and terminal addresses with their current machine route. Documents refresh after reconnect, missed events and matching document events.

Unknown structures produce a visible compatibility notice and preserve generic terminal access. Creation appends workspaces or terminal/agent tabs through a bounded CAS adapter. It reads the latest complete document, preserves unknown fields and existing nodes, and retries version conflicts without relaunching the process. A failed tab save returns the already-started terminal for recovery. The browser acceptance harness inserts/removes its own temporary fixture only inside the isolated sandbox core to test discovery/navigation; this does not establish real desktop coexistence.

This is a companion client: no desktop window buttons, fake spaces, fabricated agent statuses, or fabricated file changes. Space tabs currently display their first connected terminal; other terminals remain reachable from the agents list. Full split layout rendering and additional layout editing remain future work.

## Current workspace panels

Authorized local terminals attach in control mode immediately; there is no observe/control toggle. Web exposes xterm directly, while the native app retains the composer, image input and saved hotkeys. The terminal pane has no outer border, radius or padding; its text inset belongs to the renderer.

Files and Changes use one toolbar control each. Wide content areas dock the inspector alongside the terminal; narrower layouts show a closable overlay with text tabs. Both navigation and inspector dividers resize with pointer/keyboard input, close/collapse below 40 px for navigation or 60 px for the inspector (25% of the former close widths), and retain widths for the browser session. Navigation has a fixed 22 px connection-indicator row in both expanded and collapsed layouts. Expanded section actions have 4 px vertical padding in addition to their chrome row inset.

Modal metrics come from the pinned Herdr prompt and machine-add sources: 18 px outer inset, 15 px titles, 12.8 px body/input text and 36 px desktop inputs. Native and touch inputs retain 16 px text and 44 px targets. Runtime sample inventories and the DEV overlay have been removed. Drag updates run at most once per animation frame; terminal resize RPCs are throttled and geometry-only inventory notifications are coalesced. Code and diff rows are memoized.

Files provide bounded media previews and original-file downloads. Diff actions use a compact Herdr menu, shared between context clicks, native long presses and an accessible header action. Native downloads use the system save/share sheet. File/diff selections survive switching panels.
