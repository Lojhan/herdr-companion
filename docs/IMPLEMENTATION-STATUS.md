# Implementation status

Updated October 30, 2026. The complete scope is defined in the root build specification. This first implementation is not a complete release.

## Built

- pnpm TypeScript workspace with Expo SDK 58 app, Node 24 Fastify bridge, shared contracts/domain, generated core client, and locally bundled xterm assets.
- Pinned schema, protocol/security/template/machine docs, desktop mirror/layout reference sources, original upstream licenses and release manifest. Deterministic generation with checksum and regeneration check.
- All 32 method request/result types and ahead-of-time Ajv validators. `uint64` fields use decimal strings across the companion boundary; core JSON uses a lossless codec.
- Plain hello → framed transition, fragmented/coalesced parsing, core RPC multiplexing, bounded early stream frames, attach event channels and renderer-driven output credit.
- Persistent bridge identity and SQLite migration, one-use expiring pairing secrets, claim-scoped polling, local approval CLI, encrypted pending credential delivery, hashed device credentials, role checks and revocation.
- Browser HTTP-only SameSite sessions with CSRF and origin restrictions; native SecureStore credentials; single-use short-lived WebSocket tickets. Loopback listen by default. No raw core RPC proxy.
- Live inventory over a WebSocket subscription and TanStack Query read model, reconnect snapshots, attention grouping by actual reported status, machine inventory and honest stale state. No fabricated tasks/usage/statuses.
- xterm on web and a bundled WebView document on native. Automatic authorized local Unix control, terminal identity timestamp checks, special keys, bounded streams, foreground/background detach and no input replay.
- Herdr workspace shell with a desktop spaces/agents sidebar, separate mobile list/detail pages, exact source-derived palettes and dimensions, Geist typography, theme switching, and terminal palette synchronization. Desktop space/tab projection and append-only workspace/terminal/agent creation now use the owning core’s shared document with conflict-aware CAS writes. Owner-only SSH machine creation is available. Tasks explains the upcoming workflow rather than pretending task creation works.
- Real-iPhone Expo Go launch and LAN pairing verified; terminal/media interactions on that physical device still need completion.
- Local media previews (up to 20 MB), original-file downloads, native save/share integration and diff context menus.
- Custom hotkey editing with native persistent storage and web session storage, including terminal modifier chords and multi-key sequences.
- Unit/security tests, a real-core integration test, browser acceptance test, development sandbox, build/check scripts and an initial Linux CI workflow.

## Milestone progress

| Spec milestone                        | Status                                                                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Evidence/codegen/core connectivity | Implemented and tested on macOS arm64; native rendering and full protocol matrix remain unverified                                                                                          |
| 2. Bridge/pairing                     | Functional initial slice; JSON paste, one saved coordinator, no HTTPS/service installer automation                                                                                          |
| 3. Inventory/terminal                 | Initial implementation; no Windows/remote control or verified high-volume/performance guarantees                                                                                            |
| 4. Repositories/tasks/jobs            | Not implemented; task state transition domain skeleton only                                                                                                                                 |
| 5. Desktop writes                     | Append-only workspace/tab creation implemented and core-tested; actual desktop GUI coexistence and other layout operations still need validation                                            |
| 6. Files/diffs/providers              | Local read-only file tree/text/media, downloads, diff actions and Git status/diffs implemented; remote file browsing, editing and provider integrations remain absent                                                      |
| 7. Safe cleanup                       | Not implemented; no deletion API exists                                                                                                                                                     |
| 8. Push/transcripts                   | Not implemented                                                                                                                                                                             |
| 9. Product finish                     | Pending: pt-BR, offline persistence/drafts, accessibility/device audits, installers, upgrades and performance measurements. Responsive tablet/desktop panes and four themes are implemented |

## Known limits and next work

1. Fix or explicitly account for upstream schema/runtime inconsistencies; retain strict generated validators. Current event snapshots keep inventory/terminal access working without calling the incompatible empty `terminal.list` response.
2. Exercise the WebView on actual iPhone/Android devices, verify IME/geometry/flow control, and implement the Win32 input mode adapter before enabling Windows control.
3. Expand pairing to QR scanning, coordinator profiles, session renewal and OS secret-store integration. Pending approval credentials currently use AES-GCM with a separate local master-key file; backup that file separately from SQLite.
4. Implement workflow persistence, idempotency receipts, leases and repository/task provisioning using the exact generated core methods. No speculative worktree/agent/conversation RPCs.
5. Validate append-only CAS creation with the running desktop GUI, expand layout operations, then proceed through the remaining spec milestones. Preserve every P0 requirement in the final release.

A local bounded filesystem reader is implemented. The remote filesystem helper, durable jobs, task mutation API, code hosts, destructive cleanup, push and verified transcripts remain absent. No claim of production readiness, full P0 completion, physical-device acceptance, or official desktop coexistence is made.
