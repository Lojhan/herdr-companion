# Release validation

October 30, 2026. This is an implementation evidence log for the initial slice, not complete-release acceptance.

## Local checks

Host: macOS arm64. Node 24.10.0, pnpm 10.32.1. Real official hc 0.1.14. Tests isolate core state/config/runtime/socket from the owner's sessions.

- Core protocol integration: real hello/server.status, framed event snapshot/channel, shell terminal.run, terminal.get identity, attach first paint, raw input and observed shell response, event stream, credit, detach/kill/rm. A second real test streams more than 512 KiB through replenished credit.
- Protocol unit checks: plain→framed coalescing, byte-by-byte fragmented headers/payloads, UTF-8 byte preservation, oversized header rejection, lossless max uint64 CAS round trip, required params and null semantics.
- Bridge tests: unauthenticated denial; native token authentication and revocation; one-time approval credential delivery; reused/expired claims; wrong bridge ID; browser HTTP-only session, CSRF, Origin; no credential fields in device listing; one-use WebSocket tickets and command refusal immediately after revocation.
- Browser acceptance exercises local claim/approval, real inventory, real terminal observe/control, keyboard input and response, HTTP-only cookie persistence and reload. It also checks the 268 px desktop sidebar, collapse/expand, space/tab discovery, Paper/Graphite switching, and 390 px list/detail navigation without horizontal overflow. The test harness uses a temporary desktop-document fixture only in the isolated sandbox.
- The locally bundled WebView document is exercised in Chromium: embedded JetBrains Mono loading, theme updates and output-consumption acknowledgments pass. This is not a native WebView or physical-device test. Screenshots are written to ignored `test-results/`.
- Expo dependency compatibility check and Expo Doctor: 20/20 checks passed.
- Web production export and iOS/Android Hermes JavaScript exports succeeded. These are not signed builds, native compilation or physical-device tests.
- Bridge compilation/bundling succeeds; standalone distribution remains pending.

Final local result after the workspace redesign: 12 unit/security tests passed, 2 real-core integration tests passed, and 3 browser tests passed. Typecheck, lint, deterministic regeneration, bridge/web builds, native JS exports, and Expo Doctor passed. The Linux CI workflow has been authored but has not run on GitHub. The first browser runs found and fixed an empty-JSON-body request error and a credential-restoration/terminal-attachment race. An invalid OSC sequence in the test fixture was replaced with a plain echo shell; fixture status is not presented as agent readiness.

## UI and native follow-up

The subsequent [UI audit](UI-AUDIT.md) records 25 viewport profiles in two browser engines, detailed geometry/capture evidence, a native iOS compilation, actual iPhone/iPad simulator WebView input/output flows, and a real Codex CLI process through core. These supersede the initial browser-only evidence above for those specific paths. Physical devices and the full spec scenario remain unvalidated.

## Not validated

Physical iPhone/Android WebView behavior, IME and external keyboard, platform push, Windows input mode, multiple execution machines, desktop concurrent layout writes, GitHub/GitLab integration, safe worktree cleanup, transcript binding, offline cache/drafts, resource targets, high-throughput terminal stress, production HTTPS deployment, signing/distribution, installers and upgrades.

The spec's full pair → worktree → agent → official desktop → PR/MR merge → push → cleanup → archive scenario has not passed. Those features are not yet implemented. No cleanup runs against user repositories.
