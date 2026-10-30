# Companion UI and integration audit

October 30, 2026. This covers the implemented workspace, settings, machines, tasks placeholder, space tabs and live terminal. It does not establish completion of the full build spec.

## Changes made

- Replaced mixed icon-font glyphs with pinned Herdr SVG paths in explicit square boxes. Normalized icon/text alignment, line height and native font padding.
- Preserved Herdr's dense mouse layout while making touch controls at least 44 × 44 logical pixels, including tablet controls, tabs, sidebar actions and terminal keys.
- Made long tabs and special keys scroll horizontally. Removed terminal minimum heights that squeezed short landscape/keyboard layouts. Measured terminal cells with xterm FitAddon instead of guessing dimensions.
- Made short and phone workspace lists scroll as one surface. Kept the footer reachable and removed the large unused gaps between list sections.
- Added visual-viewport resizing for browser keyboards, iOS keyboard avoidance, four-edge native safe areas and browser viewport-segment handling for vertical and horizontal hinges.
- Kept observers and remote execution hosts from offering unavailable terminal control. Detach on navigation blur; resizing does not replay input.
- Fixed native WebSocket origin handling: native SocketRocket's inferred origin is suppressed, while one-use authenticated session tickets remain required. Browser Origin checks remain enforced.
- Isolated authenticated rate budgets by device so paired clients sharing a LAN/NAT do not exhaust one another's budget. Anonymous requests remain limited by source IP. Added a regression test and a clear rate-limit message.
- Hid Expo's floating debug tool overlay: its invisible touch frame intercepted controls below the painted icon. The development menu remains accessible using the standard gesture.

## Browser coverage

Chromium and WebKit each exercise 25 viewport profiles. Every profile has captures and control measurements for Graphite workspace, observed terminal, empty tab, Paper settings, expanded compatibility details, machines, tasks, empty search and Paper terminal. The terminal flow pairs with the actual bridge, observes a real core PTY, explicitly takes control, sends UTF-8 clipboard input and verifies its actual process response and terminal dimensions.

| Group                       | Logical viewport sizes                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| Phones                      | 320×568, 360×800, 375×667, 390×844, 430×932                                                  |
| Landscape / keyboard        | 844×390, 390×336                                                                             |
| Tablets                     | 768×1024, 834×1194, 1194×834, 1024×1366                                                      |
| Breakpoint boundaries       | 799×600, 800×600, 801×600                                                                    |
| Foldable cover/open         | 344×882, 720×960 with a zero-gap vertical fold                                               |
| Dual-screen profiles        | 540×720 single; 1114×720 with a 34 px vertical hinge; 720×1114 with a 34 px horizontal hinge |
| iPhone Duo viewport proxies | 466×678 cover, 890×626 open, 626×890 rotated                                                 |
| Desktop                     | 1024×768, 1440×900, 1920×1080                                                                |

The iPhone Duo proxies assume 3× scaling from Apple's published pixel dimensions; they are layout stress profiles, not measured Safari viewports. See [Apple specifications](https://www.apple.com/iphone-duo/specs/) and [Apple's adaptive-layout guidance](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo). Dual-screen gap profiles are separate from the continuous iPhone Duo screen.

Chromium's actual CSS viewport-segment environment values are exercised through CDP. WebKit exercises fluid-width fallback at those dimensions; this WebKit runner does not expose the segment API. Segmented captures use CDP directly because Playwright's screenshot viewport reset discards the emulated display feature.

Checks cover visible interactive elements, 44 px touch targets, icon centering/clipping, horizontal document overflow, shell viewport height and visible hit areas crossing a hinge. Additional tests cover unpaired fields, invalid pairing details, Ink/Moss, observer permissions, expired sessions and an active control session resized through phone → tablet → spanned → landscape → phone without duplicate input. Screenshots are also reviewed visually; geometric checks alone cannot establish visual quality.

## Actual integration evidence

The isolated sandbox uses official hc 0.1.14 and the real bridge, document subscription, inventory, pairing and streaming paths. Temporary document nodes and PTYs are owned by the harness and removed after each test. No user repository or production core session is modified.

A real Codex CLI 0.164.0 process ran through core in a disposable directory with the read-only sandbox, returned `HERDR_INTEGRATION_OK`, and exited 0. Its actual terminal output was verified in the browser. This validates the generic agent-terminal path; it does not validate transcript adapters, permission-request cards, worktree/PR workflows or coexistence with the running Herdr desktop GUI.

The native iOS development build compiled successfully with Xcode 27.0. Maestro 2.12.0 passed the complete pairing → observe → control → type → Enter → real PTY acknowledgement flow on iPhone 16 Pro and 13-inch iPad Pro simulators running iOS 18.5. Both result files report exit code 0 and `realCoreInputEcho: true`. Native captures include the actual software keyboard, terminal key bar and returned process output. Rotation captures cover portrait and landscape settings.

The audit found and fixed a native first-snapshot race when changing observe/control mode: the new WebView now announces readiness before attaching the stream. Native xterm also enables its accessible text layer.

Final browser evidence covers all 50 profile/engine combinations and 450 screen states with zero recorded geometry findings, plus 14 additional state/machine tests. The complete matrix initially passed 47 cases; the two segmented cases and an interrupted trace were corrected in the harness and passed focused reruns. Segmented captures were then recaptured without losing their display features. Machines captures were explicitly synchronized to the Machines page and refreshed across the matrix.

Thirteen unit/security tests, two real-core integration tests and the original three browser acceptance tests pass. Typecheck, lint, deterministic protocol generation, bridge compilation and the production web export pass. Expo Doctor passes all 20 checks after final dependency cleanup.

## Reproduce

Use Node 24 and the repository's pnpm version. Start `pnpm dev:sandbox` and `pnpm dev:web --port 8081`. Install browser engines with `pnpm exec playwright install chromium webkit`, then run `pnpm test:ui`. The matrix takes several minutes because it exercises real pairing and PTYs.

`pnpm test:ui:codex` explicitly runs one real Codex request using the existing CLI login. It is separate from the default tests.

For iOS, make a development build with `pnpm --filter @companion/mobile exec expo run:ios --device <simulator-id> --no-bundler`, start Metro on 8081, and run `IOS_AUDIT_DEVICE=<simulator-id> IOS_AUDIT_NAME=iphone pnpm test:ui:native`. Maestro can be supplied through `MAESTRO_BIN`; this host uses the official Maestro 2.12.0 distribution under `.data/maestro/`. Analytics are disabled in the test launcher.

Captures and measured geometry are ignored artifacts under `artifacts/ui-audit/after/`. `scripts/audit-gallery.py` builds contact sheets and a linked gallery using Pillow; the current gallery is `artifacts/ui-audit/review/index.html`. The native logs contain disposable pairing details; do not publish the raw logs.

## Limits

Physical iPhone Duo/foldable devices, Android native WebView, actual iOS 27 reserved regions, hardware/IME keyboards, enlarged system text, screen-reader traversal and production HTTPS deployment still need device validation. Native currently adapts to available window dimensions and safe areas; native dual-screen hinge-gap reservation is not implemented. Expo Hinge reports angle/status and explicitly is not a layout API, so it was not used to invent native hinge geometry.

The full worktree → agent → desktop → PR/MR → merge → push → cleanup scenario remains outside the implemented slice. Existing implementation-status documentation lists those gaps.

## Terminal bottom-row regression

A live Codex session exposed clipping that the earlier shell-output checks missed. The xterm FitAddon reads its parent's computed height without subtracting padding on that parent. The previous 12 px top/bottom inset therefore caused the grid to extend below the visible pane. Both web and bundled WebView now keep the inset on an outer frame and measure an unpadded inner host.

The composer integration checks now assert that the rendered screen fits inside its host before and after image attachment and through three height changes, across phone 320/390, tablet 834 and desktop 1440 in Chromium and WebKit. The bundled WebView document also checks these bounds at phone, keyboard-reduced, tablet and desktop dimensions. Live browser evidence is `artifacts/ui-refinement/terminal-bottom-fixed.png`.

## Creation and custom hotkeys

Workspace, agent and machine groups now expose creation actions in expanded headers and as the last square item in each collapsed group. A workspace tab bar exposes a plus button with terminal/agent choices. A shared responsive form dialog and choice field are used by these flows. Custom hotkeys have a pinned editor button in the composer, so they remain reachable when the key bar scrolls.

Browser integration covers 390 px phone and 1440 px desktop in Chromium and WebKit: create workspace → default shell tab → take control → save custom chord sequence → reload → verify observe-mode gating → send exact bytes to a real raw PTY → edit/delete key → start an installed Codex CLI as a second tab. No model prompt is submitted. Screenshots are under `artifacts/creation`. Service tests cover concurrent desktop CAS updates without duplicate launches, preserving unknown document fields, orphan-terminal recovery, remote document/address routing, input validation and permission/CSRF checks. Native storage uses the existing SecureStore module; the serialized hotkey preference is limited to 1800 UTF-8 bytes.

The iPhone 16 Pro / iOS 18.5 simulator passed the native hotkey flow: real pairing and PTY acknowledgement, save a custom key, stop the app, launch it again, reopen the editor and verify the key, then delete it. `artifacts/ui-audit/native/hotkeys/result.json` reports `exitCode: 0` and `realCoreInputEcho: true`; the restart capture is `artifacts/ui-audit/native/hotkeys/hotkey-after-restart.png`. The harness now scrolls the pairing field into view and drags to dismiss the multiline keyboard. Shared pages and form dialogs dismiss the keyboard on drag.

## October 30: LAN, media and resize follow-up

- Real iPhone Expo Go launch and LAN credential delivery succeeded. Physical-device terminal/media interactions remain pending because iPhone Mirroring reports the phone in use.
- Final local checks: lint and workspace typecheck pass; 32 unit/security tests and two real-core integration tests pass; bridge build passes.
- Six live Files/Changes browser cases pass in Chromium/WebKit at 320, 834 and 1440 px. They cover staged/working diffs, opening a diff in Files through its context menu, direct image previews in Changes, image/audio/video decoding and playback, byte-exact downloads, resizable panes, the reduced close thresholds, persisted widths and fixed indicator spacing.
- Four composition cases pass across the 25 viewport profiles, including foldable/posture proxies. These are browser proxies, not physical foldable acceptance.
- Fixed a browser scheduling race in the width restored after collapsing a panel. Pointer updates are batched per frame, terminal resize RPCs throttled and geometry inventory updates coalesced. No quantitative performance claim is made.
- Test-owned workspaces and PTYs are removed after each harness. The explicit Diff playground repository remains available with real modified/staged/untracked files and sample image/audio/video files.
