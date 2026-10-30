# Herdr Companion: complete implementation specification

Version 1.0 — research checked October 30, 2026.
Working project name: Herdr Companion. Use distinct app identifiers and original branding; this is an independent client.
Status: ready for implementation. This document specifies a product to build, not functionality already tested in a prototype.

## 0. Instructions to the implementing agent

Build the complete application described here. Start by reading sections 1–6 and the pinned upstream evidence in section 25. Implement in the dependency order in section 23, retaining the full release scope in section 2. Do not stop after mock screens or a transport demonstration.

Deliver a working React Native iOS/Android application, a browser build, a host bridge/CLI, shared protocol libraries, migrations, tests, installation instructions, a sample configuration, and runnable acceptance demonstrations. Create a repository with a lockfile and explicit tested version matrix. Source-code reuse must retain required licenses and attribution.

Use the generated herdr-core schema as the authority for RPC names and types. Do not invent a core worktree API, a core approval API, or a core conversation API. Implement those workflow features in the companion service using existing core execution, file, document, and terminal APIs. A terminal must remain usable when a particular agent integration is unsupported.

No application login account, Linear API, agent-provider subscription management, or public relay is required for the first complete release. Tailscale and optional Expo/platform push distribution still require their own setup/accounts. The user already has agent CLIs and subscriptions. Do not provision paid services, publish builds, change provider account configuration, or migrate running sessions without an explicit request.

If upstream changes make a pinned integration incompatible, fail visibly and retain the working generic terminal path. Record the incompatibility; do not silently downgrade destructive-operation checks or claim a feature works through a mock.

## 1. Product and actual user workflow

The owner runs many coding agents concurrently across a Mac and other machines. A task begins by copying an issue title and URL, usually from Linear. The owner chooses a repository/machine, creates a space and isolated Git worktree, launches an existing CLI agent, monitors it, and removes the checkout after the associated PR/MR merges.

The application must make this workflow usable from a phone and a browser while interoperating with the NEW Herdr desktop app and herdr-core. It must not depend on the original Herdr TUI, Orca Desktop, or Ovis.

Primary workflow:

1. Paste issue title and URL; optional detailed prompt.
2. Select repo location, base branch, installed agent profile, and cleanup policy.
3. Create an isolated worktree on the selected execution machine.
4. Launch the agent there and publish a compatible space/tab into the new Herdr desktop app.
5. Watch agents across all machines; focus on those requiring input.
6. Send messages, use the terminal, inspect files/diffs, optionally read a verified Claude/Codex transcript.
7. Associate a GitHub PR or GitLab MR; open it in the code host for review/merge.
8. When the code host reports merged, safely remove the managed checkout according to policy.
9. Keep task metadata and a compact audit record after removal.

The issue URL is initially an opaque reference. The application does not need to fetch Linear content to run the task. Agents receive exactly the supplied title, URL, and prompt. If they have their own issue integration, they may use it.

## 2. Complete-release scope

P0 means required for the complete first release. Milestones are implementation order, not permission to ship an incomplete app.

| ID | Capability | Release |
| --- | --- | --- |
| P01 | Native iOS and Android app, phone/tablet layouts | P0 |
| P02 | Browser client using the same domain/protocol packages | P0 |
| P03 | Pair/unpair/revoke devices; multiple coordinator profiles | P0 |
| P04 | Connect to new core, negotiate capabilities, show unsupported versions | P0 |
| P05 | List local/remote machines, connection health, cores and agents | P0 |
| P06 | Terminal view, input, resize, special keys, observation/control modes | P0 |
| P07 | Repo registration by machine and absolute checkout path | P0 |
| P08 | Task creation from title + URL; worktree create/adopt/remove | P0 |
| P09 | Agent templates/profiles, launch, follow-up, interrupt, explicit stop | P0 |
| P10 | Shared desktop spaces/tabs through a versioned compatibility adapter | P0 |
| P11 | Background attention/completion notifications and deep links | P0 |
| P12 | GitHub and GitLab PR/MR association and merge observation | P0 |
| P13 | Manual cleanup and opt-in automatic safe cleanup after merge | P0 |
| P14 | File browsing/preview and read-only Git diff review | P0 |
| P15 | Verified read-only Claude/Codex transcript adapters where binding is proven | P0 |
| P16 | Durable jobs, retries, idempotency, reconciliation after crashes | P0 |
| P17 | Offline caches/drafts, explicit uncertain-delivery states | P0 |
| P18 | English/pt-BR, accessibility, dark/light themes | P0 |
| P19 | Export/import configuration without secrets; diagnostics redaction | P0 |
| P20 | Trusted-owner advanced core operations with capability checks | P0 |
| P21 | Structured approvals for particular agents | Later; terminal is P0 approval UI |
| P22 | Public encrypted relay, account service, hosted SaaS | Later |
| P23 | Automated code merging or automatic bypass of agent permissions | Excluded |
| P24 | Full editor, embedded desktop browser, desktop IDE replacement | Excluded |
| P25 | Automated issue fetching/Linear OAuth | Later |
| P26 | Personal/company credential routing and account hot-swapping | Later |
| P27 | Direct native SSH on phones | Later; bridge avoids this requirement |

P15 must never guess which conversation belongs to a terminal. If reliable binding cannot be established for an agent version, display "Transcript unavailable for this session" and the terminal, with a tested compatibility entry. Do not block the generic app on an unprovable transcript feature.

No fabricated usage meters, token estimates, financial costs, completion percentages, or agent status inferred from a spinner.

## 3. Architecture decisions

### 3.1 Deployment topology

One always-on coordinator runs the companion bridge and SQLite database. It connects to one local herdr-core, which already manages the configured remote SSH machines. Execution machines need herdr-core, Git, and their chosen agent CLIs. They do not need a companion server, Node runtime, database, or public endpoint.

The phone/browser reaches the bridge using HTTPS/WSS through Tailscale Serve. The bridge binds to loopback by default. The local core reaches execution machines through its existing SSH configuration. Prefer an always-on Linux machine for the coordinator; macOS is also supported. A sleeping coordinator makes remote control unavailable even though agents on other hosts continue.

Multiple coordinator profiles are supported. Each is an independent trust/storage boundary. Do not synchronize two SQLite writers or route a single task through two coordinators. Deduplicate display entries by permanent core identity when a terminal is reachable by multiple routes, but keep mutation ownership explicit.

~~~mermaid
flowchart TD
    N["Phone: React Native / Expo"] --> B["Authenticated companion bridge"]
    W["Browser client"] --> B
    B --> D["SQLite jobs and task metadata"]
    B --> C["Local herdr-core"]
    H["Herdr desktop app"] --> C
    C --> R["Remote cores over SSH"]
    B --> P["GitHub / GitLab APIs"]
    B --> Q["Push provider"]
~~~

This is a local single-owner product. The bridge is a mobile-facing client and workflow coordinator, not a new PTY runtime, agent harness, SSH multiplexer, or shared multi-tenant service.

### 3.2 Technology selection

- Monorepo: TypeScript, pnpm workspaces, strict typechecking.
- Native app: Expo with development builds, React Native, Expo Router.
- Web: Expo web/React Native Web for shared screens, DOM-specific terminal/file implementations when necessary.
- Bridge: Node.js 24 supported line, Fastify, @fastify/websocket, ws; Node net sockets or spawned hc connect for core transport.
- SQLite: better-sqlite3, WAL mode, foreign keys, explicit SQL migrations and prepared statements. Keep work bounded because the driver is synchronous; move expensive parsing to worker threads.
- Validation: Zod for companion contracts; generated JSON Schema validators compiled ahead of time with Ajv 2020 for core types. Never compile arbitrary remote schemas into executable code at runtime.
- Core code generation: json-schema-to-typescript plus a small deterministic OpenRPC generator for named method params/results. Pin versions selected by the first implementation compatibility spike.
- Mobile state: TanStack Query for server-owned snapshots; Zustand only for transient UI and normalized live event state. Do not maintain competing authoritative caches.
- Mobile persistence: expo-sqlite for drafts/read models, expo-secure-store for device credential; web uses IndexedDB for cache, HTTP-only sessions for credentials.
- Terminal: @xterm/xterm inside react-native-webview; DOM xterm directly for web. Prefer canvas/default renderer on mobile; enable WebGL only after real-device testing. Bundle assets locally.
- Notifications: expo-notifications and Expo Push API as the first provider, behind PushProvider. APNs/FCM direct adapters remain replaceable.
- Lists: React Native FlatList initially. Add FlashList only if profiling justifies another dependency.
- Tests: Vitest for shared/bridge behavior, Fastify injection/real WebSocket tests, Playwright for browser, Maestro or equivalent real native automation, plus manual physical iPhone/Android checks.
- Logging: Pino with redaction. No default telemetry or remote error service.

Use the current mutually supported Expo dependency matrix during implementation; do not copy arbitrary React Native versions from Orca's lockfile. Run expo install/doctor and freeze the working lockfile. Record actual versions and platforms in COMPATIBILITY.md.

### 3.3 Layers and module boundaries

Use vertical feature modules with small domain objects, application handlers, and adapters. Avoid generic repositories for every table or a large enterprise layering framework.

Modules: pairing, core-connections, machines, repositories, tasks, launches, terminals, desktop-sync, code-hosts, cleanup, transcripts, notifications, diagnostics.

Pure domain code decides allowed state transitions and policies. Application handlers orchestrate external effects. Adapters handle core RPC, SQLite, Git via machine.exec, provider HTTP and push. UI never runs Git directly.

Important ports: CoreClient, GitExecutor, CodeHostProvider, TranscriptAdapter, DesktopDocumentAdapter, PushProvider, Clock and durable JobStore. Inject them where they allow failure simulation or provider replacement, rather than creating one interface per function.

## 4. Ownership and persistence

| State | Authority |
| --- | --- |
| PTYs, terminal lifecycle/history, reported program status | herdr-core |
| SSH machine profiles/connections | herdr-core |
| Spaces/tabs for official desktop interoperability | core document named herdr-app |
| Companion task, repo, launch and cleanup records | coordinator SQLite |
| Job attempts, mutation receipts and notification outbox | coordinator SQLite |
| Agent conversation contents | agent's native session files/stores |
| PR/MR merge truth | configured code-host API |
| Focus, zoom, selected task, local read state and draft | each client |
| Pairing tokens and push registrations | coordinator SQLite + device secure storage |

Core documents are versioned opaque JSON with compare-and-swap, not relational transactions. The herdr-app document is a private app contract layered on a public storage primitive. Do not assume the OpenRPC schema describes its layout structure.

Use separate companion metadata only if useful for desktop integration; never place secrets, SQL job state, or unbounded transcripts in core documents. SQLite remains workflow authority. Optional task labels on terminals are an index/reconciliation aid, not the only durable task record.

Maintain an installation UUID for the bridge, permanent core IDs from hello/server.status, stable task UUIDs, launch UUIDs, repo UUIDs, device UUIDs and idempotency keys. Remote aliases are routes, not identities.

TerminalRef = permanent execution core ID + local address + created_ms. Resolve its current coordinator route when executing. Changing an SSH alias must not change task identity. If core state is wiped, its ID changes; do not reconnect an old task to a new t7.

A coordinator restart changes its ephemeral connectionEpoch. Core event seq is valid only within its current connection epoch; always resubscribe and take a fresh snapshot after reconnect.

## 5. Data model

Use database timestamps in UTC epoch milliseconds; display with the device locale/timezone.

| Aggregate/table | Required fields |
| --- | --- |
| devices | id, name, tokenHash, createdAt, lastSeenAt, revokedAt, permissions |
| pairings | id, bootstrapSecretHash, expiresAt, claimedAt, requestedDevice, approvedAt |
| coordinator_settings | key, schemaVersion, valueJson |
| machine_bindings | coreId, routeAlias, lastVersion, lastSeenAt, platform, homePath, health |
| repositories | id, displayName, machineCoreId, mainPath, commonGitDir, remoteName, remoteUrl, baseRef, worktreeRoot, codeHostConfigId, createdAt |
| repository_policies | repoId, allowedAgentProfiles, maxActiveTasks, setupStepsJson, cleanupMode, autoStopOwnedProcesses, retentionDays |
| agent_profiles | id, machineCoreId or reusable definition, templateName, commandArgv, readinessMode, supportedVersionRange, trustSettings |
| tasks | id, repoId, title, issueUrl, issueKey?, prompt, status, revision, branch, baseRef, baseSha, worktreePath, ownsWorktree, createdAt, archivedAt |
| launches | id, taskId, role, terminalCoreId, terminalAddress, terminalCreatedAt, attempt, launchState, initialPromptState, stoppedAt |
| task_change_requests | id, taskId, provider, host, projectIdentity, number, url, headBranch, headSha, baseBranch, state, mergedAt, observedAt |
| jobs | id, type, aggregateId, idempotencyKey, payloadHash, state, step, leaseOwner, leaseUntil, attempt, runAfter, errorJson |
| operation_steps | jobId, stepName, state, inputHash, observedResourceJson, startedAt, completedAt |
| mutation_receipts | deviceId, key, payloadHash, operationId, state, resultJson |
| cleanup_reviews | id, taskId, expiresAt, taskRevision, headSha, statusHash, ownedTerminalSetHash, providerEvidenceJson, blockersJson |
| notification_outbox | id, dedupeKey, deviceId, eventJson, state, attempt, runAfter, receiptId |
| push_subscriptions | deviceId, provider, tokenEncrypted, projectId, enabled, lastReceiptAt |
| activity | id, taskId?, actorDeviceId?, action, outcome, resourceIdsJson, createdAt |
| transcript_bindings | launchId, adapter, identityEvidenceHash, sessionIdentity, sourceLocation, processFingerprint, verifiedAt, invalidatedAt |

Secrets: provider access tokens belong in the bridge OS secret store where possible; fallback encrypted local file whose master key is separate from the SQLite backup. Provide credential references, never raw tokens, in JSON exports. Do not store complete terminal output in activity or mutation logs.

Database constraints: unique (deviceId,key) mutation receipt; unique job idempotency key; unique active managed worktree per repo/path; unique terminal identity per launch association; foreign keys with explicit archival behavior. Keep archived tasks even after resource removal.

Task status is workflow state, separate from reported agent status and code-host merge state:

draft → provisioning → active → merged → cleanup_pending → cleaned → archived

Branches: provisioning_failed, needs_attention, cleanup_blocked, cancelled. active may persist while an agent is idle or done. An agent saying done is not a merge. A closed-unmerged PR/MR is not merged. Agent crash does not erase task state.

## 6. Generated core client and exact API mapping

Pin the research baseline in section 25 and vendor hc.openrpc.json with Apache-2.0 attribution. Do not execute downloaded code as part of codegen. Derive types, validators, method metadata, required params and error kinds deterministically; CI must fail on a dirty regeneration.

At startup: hello with generation 1 and framed true; read its generation/version/core/methods/features. Then server.status, machine.list, events.subscribe and doc reads as required. Use advertised methods and tested semantics, not only a minimum semver. Never assert an unsupported generation works.

The pinned schema version is 0.1.14. It contains no workspace.*, worktree.* or agent.approve method.

| Companion operation | Actual core primitive |
| --- | --- |
| List/get terminals | terminal.list, terminal.get |
| Launch a program/template | terminal.run |
| Read screen/history | terminal.read |
| Interactive terminal | terminal.attach + framed stream |
| Follow-up prompt | terminal.send |
| Special keys and interrupt | terminal.keys, terminal.interrupt |
| Stop/remove lifecycle record | terminal.kill, terminal.rm |
| Status/terminal/doc updates | events.subscribe |
| Enumerate templates | templates.list |
| Execute bounded Git command | machine.exec |
| Read/write/edit remote files | file.read, file.write, file.edit |
| Upload file to agent context | terminal.put |
| Add/list/connect/rename/forget SSH profile | machine.add/list/connect/rename/rm |
| Read/write desktop layout | doc.get/doc.set with name herdr-app |
| Core metadata/admin | server.status, server.restart, server.stop, rpc.discover |

Generate coverage for ALL schema methods. The bridge may expose an owner-only advanced RPC route for allowlisted methods; it must not pretend every method needs a main-screen control. server.stop/restart, machine removal, arbitrary file writes and shell execution are admin operations with explicit confirmation and audit entries. Do not expose a raw unauthenticated core tunnel.

terminal.send pastes and submits, waits for human input to be quiet, refuses blocked state unless force, and can condition on idle/working using its "if" param. It is not an exactly-once semantic chat API. SendResult.started may be null and must remain unknown in the UI. No delivery retry after an ambiguous response.

Templates use native herdr-core syntax, not YAML parsing assumptions. A template command is a trusted shell line. The initial task is passed separately through terminal.run argv, not interpolated into that command. Template first_message tells whether the opening prompt went in. Readiness timeout does not mean the terminal failed to launch.

file/exec payloads and terminal.put use documented base64 representations. Decode once; honor schema limits. machine.exec has a bounded timeout and capped output; long setup steps must run as managed terminals, not a long HTTP request.

### 6.1 Terminal stream implementation

Core connection begins with newline-delimited JSON-RPC. Only switch parser after receiving the hello reply that negotiates framed mode. Parse every subsequent byte with the framed decoder; TCP chunks are not frames.

Header: channel uint32 little-endian, kind uint8, payload length uint32 little-endian. Nine bytes total. Max core payload 16 MiB. Kinds: DATA=0, CREDIT=1, CLOSE=2, RESIZE=3, FOCUS=4, FACTS=5. Channel zero is JSON-RPC; other channels are attach/event streams.

Initial stream credit is 256 KiB. Credit is replenished only for bytes consumed by the renderer/consumer. Forward raw terminal bytes without UTF-8 corruption across chunk boundaries. Preserve terminal modes and core's initial repaint. A slow viewer must not stall RPC or other viewers. Respect core's repaint behavior when a viewer falls behind; never replay both an obsolete backlog and a fresh screen.

The bridge owns core channel IDs. The mobile wire uses independent stream UUIDs; map them explicitly per connection. Never let a phone choose an arbitrary core channel number.

Use terminal.attach with observe true for passive viewing; it must not write or resize. Explicit "Take control" attaches interactively. A resumed attach must not immediately steal size from the desktop; use resumed semantics and send focus/geometry when user interaction actually resumes.

Handle Win32 input mode CSI ?9001h/l: use the tested xterm-side keyboard integration or advertise Windows terminal control unavailable until implemented; do not send incorrect escape sequences silently. Complete-release Windows execution-host support requires this acceptance test, though the coordinator may run on Linux/macOS.

Client CREDIT is sent after xterm's write callback; WebView's acknowledgement returns to React Native, then to the bridge. A queued React Native postMessage is not consumed output. Bound queues at each hop. Detach when a terminal screen becomes inactive/backgrounded after a short grace period.

Core events: status, turn, created, lost, restarted, finished, removed, title, labels, size, foreground, doc; unknown event types must not crash the client. heartbeat and missed are control notifications. On missed, replace the terminal snapshot and refetch watched documents. Do the same after a remote connection is re-established. Snapshots do not include document values. Preserve uint64 values losslessly: generated declarations must flag fields that can exceed JavaScript safe integers; use a lossless JSON codec at the core boundary and decimal-string representations in companion JSON for those counters/versions. Never round a CAS version or event sequence.

## 7. Companion HTTP/WebSocket contract

Publish an OpenAPI document for HTTP and JSON Schema for every WebSocket message. Application API version 1 is independent of core generation.

### 7.1 HTTP endpoints

| Method/path | Purpose |
| --- | --- |
| GET /healthz | Liveness only; expose no host details without auth |
| GET /v1/status | Bridge ID, API version, negotiated core generation/version/capabilities |
| POST /v1/pairing/claim | Claim a local-CLI-created one-use secret |
| GET /v1/pairing/claims/:id | Poll approved claim using a claim-scoped secret |
| POST /v1/sessions | Native credential → short-lived session or browser cookie |
| DELETE /v1/sessions/current | Sign out |
| GET/DELETE /v1/devices[/:id] | Inspect/revoke pairing |
| GET /v1/machines | Authoritative machine snapshot + cached health |
| POST /v1/machines | Add SSH profile, explicit owner action |
| POST /v1/machines/:id/reconnect | Reconnect; login-required response stays actionable |
| GET/POST/PATCH /v1/repositories[/:id] | Register/inspect/configure repo |
| GET /v1/agent-profiles | Profiles available on selected machine |
| POST /v1/agent-profiles/:id/install | Explicitly install/update a trusted template |
| GET/POST/PATCH /v1/tasks[/:id] | List, create, edit draft/metadata |
| POST /v1/tasks/:id/launches | Start/restart/add a helper |
| POST /v1/launches/:id/messages | Explicit follow-up with expected terminal identity |
| POST /v1/launches/:id/interrupt | Interrupt current turn |
| POST /v1/launches/:id/stop | Stop owned process; stronger than interrupt |
| POST /v1/tasks/:id/change-requests | Associate validated PR/MR URL |
| POST /v1/tasks/:id/refresh | Refresh code-host and Git state |
| POST /v1/tasks/:id/cleanup-preview | Generate current preview token/blockers |
| POST /v1/tasks/:id/cleanup | Execute a previewed cleanup |
| POST /v1/tasks/:id/archive | Archive metadata; no implied deletion |
| GET /v1/operations/:id | Durable operation status/result |
| GET /v1/tasks/:id/activity | Paginated task events |
| GET /v1/tasks/:id/files | Safe directory listing |
| GET /v1/tasks/:id/file | Bounded preview/download |
| GET /v1/tasks/:id/diff | Bounded structured diff; paginated file contents |
| GET /v1/launches/:id/transcript | Verified conversation page or unsupported reason |
| POST /v1/uploads | Bounded upload, attached to explicit terminal/task |
| PUT/DELETE /v1/push-subscriptions | Register/unregister push |
| POST /v1/admin/core-rpc | Owner-only allowlisted schema method; scope validation |
| GET /v1/diagnostics | Redacted support bundle, no transcript/secrets by default |

Return 202 {operationId,state} for effects with durable jobs. Reads use 200 and revision/ETag where relevant. Mutations require Idempotency-Key and payload hash matching; reuse with a different payload returns 409. Revision conflicts return 409; stale cleanup proof 412; unsupported capability 422; unavailable machine 503; auth 401/403.

Error shape: {code,message,retryable,delivery:"not_sent"|"unknown"|"confirmed",operationId?,details?}. Distinguish bridge acceptance, core acceptance, program-start detection and observed semantic outcome. Do not convert every timeout into retryable failure.

### 7.2 WebSocket

GET /v1/ws authenticates with a short-lived single-use ticket obtained over authenticated HTTPS. For web prefer same-origin secure HTTP-only cookie. Do not put durable tokens in query strings.

Client commands: subscribeInventory, subscribeTask, attachTerminal, detachTerminal, terminalInput, terminalResize, terminalFocus, terminalDisplayFacts, terminalCredit, ping.
Server messages: hello, inventorySnapshot, inventoryDelta, taskChanged, operationChanged, machineChanged, terminalAttached, terminalClosed, streamReset, transcriptInvalidated, error, pong.

Terminal bytes use binary WebSocket frames: app stream UUID as 16 bytes + frame kind uint8 + payload length uint32 LE + payload. Publish the exact v1 layout in packages/contracts; include per-stream sequence numbers in output metadata or the envelope for detecting drops. Wire details are companion-owned, not a claim that core speaks WebSocket.

Authenticate and authorize before creating subscriptions. Validate maximum lengths and message types. A per-connection session owns all stream mappings; disconnect releases them. No terminal keypress buffering/replay across network reconnects. Client inventory subscriptions may replay; mutations may not.

## 8. Pairing and access

Default: loopback bridge at port 7318 behind Tailscale Serve HTTPS, with device auth in addition to tailnet reachability. Do not trust a user-supplied Tailscale identity header. No Funnel/public exposure by default.

CLI: companion serve; companion pair --endpoint https://host.tailnet.ts.net; companion devices; companion revoke <id>; companion doctor. Pair command creates a 256-bit random one-use bootstrap secret valid for 120 seconds and prints a QR with endpoint, bridge UUID and secret. Endpoint must be HTTPS outside a deliberate localhost development mode.

Phone scans QR, shows host identity, submits device name and claims it. Bridge CLI displays the requesting device and requires local approval. A stolen/reused claim must never reveal the long-lived credential. Polling is claim-scoped; only the successful original claimant obtains the approved token, exactly once. If token delivery is lost, pair again rather than reissuing a credential to anyone holding the bootstrap secret.

Device tokens: at least 256 random bits; store only a keyed hash/hash with high entropy on server, secure-store on native. Web exchanges bootstrap claim into Secure, HttpOnly, SameSite=Strict cookies and CSRF protection. Revoke closes sockets and invalidates sessions immediately. Credentials for each coordinator are isolated.

Roles: owner, controller, observer. Owner manages hosts/repos/credentials/policies; controller controls permitted tasks/terminals and creates tasks in registered repos; observer reads allowed resources. This is defense against accidental credential misuse, not multi-tenant isolation: core runs as the OS user and is inherently powerful.

Do not expose arbitrary machine.exec, file.write, machine.add via generic controller RPC. Workflow handlers translate repo/task IDs to trusted paths and commands. Owner advanced mode explicitly grants the broader shell-equivalent surface.

Rate limit claims/authentication, cap body sizes and concurrent streams, validate Origin for browser access, do not enable wildcard credentialed CORS. Disable WebView navigation except intentional external links opened through the OS browser.

## 9. Registering repositories and agent profiles

Repository registration records machine identity and a verified absolute primary checkout. Query Git using machine.exec argv, never by assembling shell text:

git -C <path> rev-parse --show-toplevel
git -C <path> rev-parse --git-common-dir
git -C <path> worktree list --porcelain -z
git -C <path> remote get-url <remote>

Resolve the common directory and selected execution machine identity. A matching URL alone is not a repository identity. Two checkouts on different machines remain different repo locations. Detect bare repositories; require an explicit supported path mode or reject with explanation. Do not set global safe.directory.

Record the base branch explicitly; default from remote HEAD only when unambiguous. Fetch failure must never silently create a task on a stale branch. Allow a clearly labeled user opt-in to use a specific cached base commit.

Keep agent profiles as owner-approved definitions deployed to that machine's core templates. Readiness defaults to native status reporting. Quiet readiness is opt-in and never presented as proof of agent readiness. A launch blocked on login or repo trust must stay visible.

Probe installed binaries with platform-aware argv and bounded --version commands. Do not assume SSH login shell PATH equals an interactive terminal's PATH. Profiles can specify an absolute executable path. Resolve remote template config directories from host configuration/environment; do not assume macOS/Linux paths on Windows.

Template task content is appended by core; do not interpolate issue titles or prompts into command lines. Existing credentials remain in the CLI's native store. Companion never copies personal credentials into a company machine.

Repository setup steps are ordered trusted argv/cwd/env specs, not fetched scripts. Default empty. Examples: install dependencies, copy explicitly allowed local environment files, start dev server. Show these policies when enabling a repo. Never automatically copy every ignored file, .env file, SSH key or package-manager credential into each worktree.

## 10. Durable task provisioning workflow

### 10.1 Input

CreateTask = repoId, issueTitle, issueUrl?, prompt?, baseRef?, agentProfileId, branchOverride?, setupProfile?, cleanupMode.

Limits: title 300 chars; URL 2048 chars and http(s) only; prompt 64 KiB. Preserve Unicode in display; generate a separate bounded ASCII slug. Extract an optional issue key only from recognized patterns, not as proof of issue existence. Reject missing title/repo/profile with field errors.

Branch default: task/<issue-key-or-slug>-<task-id-short>. Verify with git check-ref-format --branch. Never use a raw title as a filesystem path. Worktree path: <configuredRoot>/<repoUuid>/<taskUuid>; stable UUID paths avoid collisions/traversal and survive renames. Do not force compatibility with the desktop mod's own default directory.

### 10.2 Steps and recovery

Persist task, job and receipt in one SQLite transaction before external work. Enforce per-repo provisioning mutex; bounded global concurrency defaults to two setup jobs per machine and eight total. Independent agents may run concurrently after provisioning.

1. Preflight: verify machine core ID, repo common dir, permissions, base ref and profile availability.
2. Fetch the configured remote with explicit argv and timeout; resolve exact baseSha.
3. Reserve branch/path in DB; record intent before mutation.
4. Create worktree using git worktree add -b <branch> <path> <baseSha>. Do not use -B or force existing branches.
5. Query porcelain output and branch HEAD to establish exact resource identity.
6. Run setup steps as labeled background core terminals. Persist their references and exit results; a status saying done is not a successful exit.
7. Launch agent once through terminal.run with wait false, keep true for a durable pane, rm false, no_parent true. Use labels companion.task, companion.launch, companion.repo, companion.role.
8. Capture returned address, created_ms, execution core ID and first_message state. A fresh recovery shell must never be marked as the original agent still working.
9. Publish or reconcile desktop space/tab through the compatibility adapter.
10. Mark provisioning complete, emit taskChanged, acknowledge operation.

Root task agents must not be children of the bridge's transient setup terminal. Optional reviewer helpers may have explicit parent linkage; mark whether they should outlive that parent.

After any crash/timeout, reconcile before retry:
- Worktree exists with same expected branch, path and common dir: adopt into the same job and continue.
- Path or branch belongs to anything else: block; never overwrite.
- terminal.run reply lost: list terminals including finished ones by launch label, verify identity. Never immediately launch a duplicate.
- A terminal may still be spawning: retain unknown state and retry observation, not execution.
- If launch labels cannot establish a unique terminal after a bounded observation window, require explicit recovery choice. Exactly-once cannot be guaranteed by core RPC alone.
- Opening message not confirmed: show its state and terminal. Do not automatically paste it a second time.
- Desktop sync fails after launch: task remains active with a desktop-sync warning; retry the idempotent layout patch, not the launch.
- Setup failure: retain checkout/logs. Offer retry that step, skip with explicit owner action, or abandon/clean safely.
- Automatic rollback removes only resources conclusively created by this job and not subsequently modified. Prefer recoverable provisioning_failed state over deleting user work.

Store every step's observed outcome durably. A DB transaction must never be held open during SSH, HTTP, terminal waits or Git execution.

## 11. Terminal control, follow-up delivery and attention

Home groups: Needs you, Unread finishes, Working, Other. Grouping uses reported program status and explicit process exit observations. Missing/unknown status is a distinct state, never inferred from terminal text. Display task workflow and agent status separately.

Each terminal screen shows machine, repository/branch, current identity, connection state, last observed time and whether you are observing or controlling. Disconnected screens are visibly stale. Raw terminal is always one tap away.

Special-key bar: Esc, Tab, Ctrl, arrows, Enter, Ctrl+C; configurable secondary row. Support text composition/IME, multiline paste, selection/copy, external keyboard, pinch text sizing, rotation and keyboard-safe layout.

Sending a follow-up:
- Native composer sends an explicit operation with expected TerminalRef and task revision.
- Check program still matches the launch/process binding. Refuse if the pane became a shell or another session.
- For reported idle/working, use terminal.send with the appropriate condition; do not force a blocked dialog.
- If busy, offer Send now or Keep draft. Do not silently promise the CLI will queue text correctly. Agent-specific queueing requires a tested adapter.
- A blocked pane routes the user to the terminal. Structured "Approve" cards are not universal.
- Store bridge acceptance and core result as distinct receipt stages. After a lost reply, show Delivery unknown and allow inspection/copy; no automatic resend.
- Native typed terminal keys are immediate transient events, not durable jobs and not retried.
- Interrupt invokes terminal.interrupt; Stop process invokes terminal.kill with explicit UI wording. Closing a viewer only detaches.

Read/unread state is client/device state. Terminal turn counters are not globally unique events across recreated core state. Notification/read keys include permanent core ID, terminal creation identity, turn and event class.

## 12. Interoperability with Herdr desktop spaces

Required: phone-created task agent is visible in the new Herdr desktop app, and desktop-created terminals remain visible in the companion. No running desktop window is required for the phone to create a task.

At the pinned app commit, src/mirror.rs defines a core document named herdr-app:

~~~json
{
  "spaces": [{
    "id": "companion-s-<uuid>",
    "name": "",
    "folder": "/absolute/worktree",
    "tabs": [{
      "id": "companion-tab-<uuid>",
      "name": "Issue title",
      "root": {
        "id": "companion-pane-<uuid>",
        "type": "block",
        "content": { "terminal": "t7" }
      }
    }]
  }]
}
~~~

This is the minimal adapter fixture, not a new public guarantee from core. Validate it against the pinned desktop source and a real app before enabling writes.

Documents are machine-local: write to the execution core with doc.get/set on the coordinator's current alias as appropriate. Store the local terminal address t7 inside that machine's document, not alias/t7. The desktop qualifies IDs on import. Phone focus/zoom does not overwrite desktop focus.

Adapter rules:
1. Subscribe to document events before reading.
2. Retain the original complete JSON object, including unfamiliar fields and all unrelated spaces/tabs/nodes.
3. Read version, apply a targeted append/update/remove by companion-owned IDs, CAS doc.set.
4. On conflict refetch and reapply intent, at most five times with jitter; never resend a stale whole document.
5. Read back the specific owned node after uncertain writes to determine whether the change took.
6. No duplicate IDs/spaces after retries. Stable IDs are derived from task/launch identity.
7. Never delete an unrelated tab even if it points to the same terminal.
8. If the user renames an owned space/tab on desktop, preserve that name until an explicit companion rename.
9. Preserve complex desktop nodes; the mobile client can display terminal leaves without reproducing every desktop mod.
10. Missing/unsupported document structure disables layout writes while retaining terminal access.

Gate writes by tested desktop compatibility recorded at pairing/setup, combined with structural validation. Core's version does not identify desktop app layout compatibility. For remote headless cores, the coordinator can supply the tested adapter version; show it in diagnostics. Never claim arbitrary future desktop compatibility.

The desktop may rewrite the document from its own model; test concurrent desktop edits and companion patches. If an upstream behavior loses patches, report unsupported concurrent layout writes and use read-only layout integration until fixed. Do not hide that failure through an aggressive write loop.

Cleanup removes only companion-owned tab/space nodes after terminal shutdown. If a user added other tabs to that space, preserve the space and remove only the task's own nodes. If users move the terminal into another structure, detach ownership and flag for review instead of deleting their layout.

## 13. GitHub and GitLab change-request integration

Implement both providers because personal and work repositories may differ. Provider identity includes scheme, host, owner/project and number; support configured enterprise/self-hosted origins. Tokens stay on coordinator and are never sent to the mobile app.

Explicit association by URL is P0. Automatic discovery by exact head repository/project plus branch is convenience: accept only one unambiguous match, else ask the user to choose. Do not fetch arbitrary issue URLs or follow redirects to internal addresses. Allow only registered provider origins and validated project paths.

GitHub: read the exact PR and its merged state/head/base metadata through its REST API. GitLab: read the exact project MR, use state=merged and source/target/head metadata. A closed PR or MR is not proof of merge. A local branch ancestry check is not sufficient for squash/rebase merges.

Polling: one durable scheduler in bridge, default 60 s for active associated requests, jitter ±20%, exponential backoff for failures, respect provider retry/rate-limit headers. Share requests for the same PR/MR. Pause offline hosts' Git checks while provider polling may continue. Persist next run times; no cron process per task.

No public webhook server required. Webhook adapters may be added later and must verify signatures and deduplicate deliveries. Polling remains reconciliation.

Normalize ProviderMergeEvidence = provider, origin, project identity, number, headRepoIdentity, headBranch, headSha, baseBranch, state, mergedAt, observedAt, responseVersion/ETag.

Do not automatically attach a different PR after a branch name is reused. Associate immutable request identity. If GitHub/GitLab removes head branch metadata, retain previous verified identity but do not authorize destructive cleanup without a clear validated match.

The app opens PR/MR externally. Building merge actions or posting comments is outside first-release scope. The agent may independently create a PR using its configured tools; companion discovers/associates it afterward.

## 14. Safe cleanup after merge

Policies: manual (default), notify_after_merge, auto_when_safe. Owner opts a repository into auto_when_safe and reviews whether owned agents/dev servers may be stopped automatically. Global or per-task pause overrides automation immediately.

Cleanup is a durable resumable job with a preview/proof token. It never deletes an unmanaged primary checkout. Branch deletion is a separate disabled-by-default operation; checkout removal is sufficient for this user's lifecycle.

Eligibility:
- Task owns this exact worktree and common Git directory.
- Recorded PR/MR is explicitly merged with verified repository/head identity.
- Machine core ID and path provenance match.
- All changes represented by current HEAD are accounted for. Prefer exact match between current HEAD and observed merged source head; if not provable for a merge strategy, block for manual review.
- No staged/unstaged/untracked or valuable ignored files remain.
- No in-progress merge/rebase/cherry-pick/bisect, locked worktree, unknown submodule state or submodule-only local commits.
- No unclassified live process in this checkout. Core lists its processes; additional OS/process inspection is best effort and cannot prove no external writer exists.
- Owned live terminals may be stopped only under policy; unrelated terminals/processes block.
- Desktop ownership references can be reconciled without removing user-added content.
- Provider/Git/auth failures produce unknown/blocking state, not clean.

Ignored files: ordinary git status omits them but checkout removal may destroy them. Enumerate ignored and untracked files. Default block on ignored files. Owner may configure explicit disposable patterns such as node_modules/** or known build directories; show these in preview. Never classify .env*, credential files or user uploads as disposable by default. Large scans may be expensive; show scan in progress and cache nothing across a change.

Submodules: first-release automatic cleanup blocks on any initialized submodule. Manual mode may explain and require explicit confirmation after checking nested status and local-only commits. Do not quietly use --force because upstream Herdr's UI does.

Algorithm:
1. Acquire task and repo cleanup locks; pause launches/setup for this task.
2. Refresh provider evidence and inspect Git/path/process state; generate a preview with blockers and expiring token (60 s).
3. For auto mode, apply the same policy evaluator as manual mode; no bypass.
4. Quiesce only tracked owned processes under policy, then await observed exit. An unreachable host is not stopped.
5. Repeat all local mutation checks after quiescence. Confirm token/revision/head/path/evidence still match.
6. Remove checkout with git worktree remove <path> from the primary repo. Never use rm -rf or automatic --force.
7. Reconcile actual worktree list/path after timeout. If removal already happened, continue idempotently.
8. Remove only owned desktop references with CAS.
9. Persist cleaned with audit evidence and send one notification.
10. Retain branch unless separate explicit branch deletion was authorized; no remote branch deletion.

Use a grace period (default 30 s) between merge observation and automatic cleanup, with a cancellation action. Activity on a task cancels pending automatic cleanup and requires reevaluation. Watch for external filesystem changes during preview/removal where supported. There is no atomic transaction spanning arbitrary external editors, Git and provider APIs: recheck immediately, use Git's own refusal behavior, and clearly document the remaining external-writer race. For stricter environments leave automatic cleanup disabled.

If a path disappeared externally, verify Git metadata before marking removed; repair/prune is an explicit recovery operation, not an automatic broad prune. An active branch recreated after a task was cleaned is a new resource, never a reason to retry old cleanup.

## 15. Durable jobs and failure recovery

SQLite jobs plus leases and a periodic scheduler are sufficient. No Redis, Kafka, distributed locks or external workflow engine needed.

States: pending, running, waiting, succeeded, failed, cancelled, uncertain. Claims and lease renewal are transactional; the default lease is 30 s, renewed every 10 s. A lease expiry triggers observation before another worker resumes an external step.

Idempotency is application-level, not a claim of exactly-once upstream execution. Each step has an input hash and observed resource identity. Reads retry with capped exponential backoff/jitter; writes retry only when reconciliation proves they were not applied or the operation is intrinsically idempotent.

Provisioning, cleanup, provider polling and notifications have separate queues/concurrency budgets. A long dependency install cannot starve attention event delivery. Bounded scheduler tick defaults to 1 s; sleep until next deadline when idle. Timer scheduling must remain replaceable through JobStore/Scheduler ports.

After bridge restart:
- Verify DB migrations and acquire one instance lock.
- Reconnect/hello/schema-check core; never kill its terminals.
- Subscribe and snapshot before processing stale jobs.
- Reconcile incomplete worktrees/launches/layout changes.
- Reschedule provider checks and notification receipts.
- Mark uncertain sends for user inspection rather than replaying.
- Resume only jobs whose effects are understood.

After execution-host reboot, retained terminals may become fresh shells. Mark launch needs_restart, preserve task/checkout, and offer an explicit new launch or tested native resume profile. keep=true is not agent checkpointing.

## 16. Notifications and mobile lifecycle

The bridge, not a background phone WebSocket, watches status. Mobile operating systems can suspend the app. On background: save drafts, detach terminal streams, stop high-frequency polling. On foreground: refresh auth/session, reconnect, replace snapshots and refetch current task before enabling controls.

Notify on transition to blocked, explicit agent turn completion/done, process failure and merge/cleanup outcomes. Missing OSC 7501 status cannot produce reliable semantic completion alerts; process exits remain observable. Do not manufacture completion from a quiet screen.

Deduplicate by stable terminal identity, turn/status transition and notification type. Persist outbox before sending. Suppress repeats for the same still-blocked state; cooldown 30 s. A status change to working cancels unsent blocked alerts. Delivery receipts, retries and invalid-token removal are required.

Default push body is generic: "An agent needs your attention." Include opaque task/launch IDs in data, never tokens, raw terminal output, issue title, code, prompt content or credentials. More descriptive titles are opt-in.

Push deep link revalidates live state; tapping a stale notification opens the current task rather than answering its old prompt. Do not approve commands from lock-screen notification actions in v1. Offline execution host shows stale status and no executable action.

Expo Push requires project/device registration and platform credentials. Provide a documented setup path and local in-app notifications when push is not configured. Test on physical devices using development/release builds; a simulator or Expo Go is not sufficient acceptance evidence. No claim of guaranteed push delivery or zero-cost Apple distribution.

## 17. Files and diff review

P0 is read-only browsing and review, not a full editor.

Restrict ordinary file routes to the registered task checkout. Resolve paths on the execution host; protect against absolute paths, .., NULs, symlink escapes and a symlink changing between validation/read. If atomic no-follow behavior cannot be guaranteed through core file.read, do not expose arbitrary file paths: use a tested bounded helper or block symlink traversal and document the same-user trust boundary.

Core lacks a directory-list RPC. Implement directory enumeration with a tiny packaged helper only where required, installed as an explicit host capability, or use core machine.exec with a platform-tested directory command. Do not assume ls -la on Windows. Preferred full-release helper: small Rust executable for safe directory listing/read with an allowed-root argument, no network listener; bridge invokes it through machine.exec. Core-only mode retains Git-tracked file lists and core file previews but advertises reduced symlink hardening. Build/distribute helper for supported hosts, with checksums.

Git tracked file list: git ls-files -z plus safe status parsing. Git diff metadata uses --numstat/-z and --name-status/-z as appropriate; handle renamed paths, spaces, Unicode and binary files. Paginate file patches; never parse display filenames by splitting on whitespace. Compare worktree vs index/HEAD and optionally task baseSha. Display diff truncation prominently.

Default limits: text preview 1 MiB, image/upload 8 MiB raw, per-file patch 256 KiB, total diff page 2 MiB. Respect lower upstream limits and refuse, rather than silently truncate, executable uploads. terminal.put returns a path; append it to a draft only after verified success and explicit send. No automatic execution of uploaded files.

## 18. Verified transcript adapters

Core schema provides terminal screen/status, not normalized agent conversations. Reuse Ovis parser ideas selectively; preserve source licenses. Do not import its old Herdr transport layer.

TranscriptAdapter operations: probeCapabilities, resolveBinding(TerminalRef, foreground, launchMetadata), readPage(cursor), invalidate(reason). It must report verified, unsupported or ambiguous, with evidence.

Initial adapters: Claude Code and Codex. Inspect actual installed versions and upstream/Ovis parser behavior before coding. Bind using explicit session ID/native launch metadata/hooks when available; do not select newest transcript in the folder, match a short answer, or guess from quoted terminal text. A session switch/new process invalidates binding. Test /clear, resume, branch, shared daemons, same cwd parallel agents and transcripts written elsewhere.

Prefer read-only bounded native session files. Use actual store formats and version gates; no hardcoded invented SQL tables. Keep parsing on the execution host/through core file reads or bounded helper commands. Avoid downloading the entire growing transcript on every poll; byte cursors plus file identity and truncation detection.

Normalize messages with stable IDs, role, timestamp?, text blocks, tool blocks and source cursor. Missing information stays absent. Preserve code paths and images within allowed task/session scope; no arbitrary transcript path download API.

The ordinary follow-up composer still uses core terminal.send and its receipts; reading a transcript does not make sending transactional. P0 structured approval is the live terminal. Agent-specific approval cards are a later compatibility surface with prompt identity, freshness checks and proven response semantics.

## 19. UX and screen contracts

Tabs: Attention, Tasks, Machines, Settings. On tablets/web show list/detail split panes without forcing phone-sized layouts.

Attention: grouped live agents across hosts, filters, offline indicators, unread completion state, search, last updated.
Tasks: active/merged/cleanup/archived filters; cards show issue, repo/machine, branch, agent state and cleanup policy.
New task: title/link paste, optional prompt, repo/machine selector, agent profile, base branch, branch preview and Start.
Task detail: Overview, Terminal, Changes, Activity; transcript appears only if supported. Show provisioning steps and recovery action precisely.
Machines: connectivity, core version/identity, template availability, core-only vs helper capabilities; add/reconnect controls for owner.
Repositories: registration, setup commands, disposable ignored patterns, code-host credential references, cleanup policy.
Cleanup sheet: exact checkout, branch/HEAD, merge evidence, local/ignored files, processes to stop, policy/blockers and expiring confirmation.
Settings: devices, notifications, appearance/language, coordinator endpoint, diagnostics, export/import, compatible versions.
Recovery: worktree adopted/unknown, initial message uncertain, unsupported desktop layout, agent replaced with shell, revoked device.

Default paths and worktree internals belong in detail/review screens, not every main card. Use clear wording: "Agent finished a turn" versus "PR merged"; "Detach viewer" versus "Stop process"; "Remove checkout" versus "Delete branch."

Accessibility: screen-reader labels/status announcements, Dynamic Type, contrast, reduced motion, >=44 pt interactive targets, keyboard focus. Full Unicode/Portuguese titles. Persist drafts per coordinator/core/launch/session; never move an old draft to a new shell with the same display address.

## 20. Performance, resources and reliability requirements

Targets to verify on a documented representative host/device; these are product targets, not measured upstream claims.

- 100 live terminals across five execution machines; only foreground terminal streams fully attached.
- Idle bridge with no viewers: <=150 MiB RSS target excluding core/agents and no sustained busy polling; profile before optimization.
- List attention updates p95 <=1 s after bridge receives a core event on a healthy network.
- Terminal input-to-forward p95 <=100 ms excluding network/agent response; terminal renderer stays usable at 200 KiB/s output.
- No unbounded queues: <=4 MiB per output stream and <=32 MiB aggregate bridge output backlog; detach/repaint when exceeded.
- Cap uploads, active streams/device, job concurrency and HTTP request timeouts.
- Mobile cache bounded to 50 MiB; terminal screen history bounded separately. Transcripts opt-in cache, redacted diagnostics.
- Provider polling uses one request per associated request per interval, with caching/backoff.
- Bridge shutdown drains DB writes/jobs, detaches clients, and never stops core/agents by default.
- Runtime survives desktop/phone closure; host/core failure is reported honestly.
- Security and delivery invariants override optimistic latency targets.

## 21. Source reuse and licensing plan

| Upstream | Reuse target | Do not inherit |
| --- | --- | --- |
| herdr-core, Apache-2.0 | OpenRPC schema, protocol rules, templates, permanent IDs | Its runtime implementation unless needed; no duplicate PTY ownership |
| herdr-app, Apache-2.0 | Mirror document shape, worktree behavior as reference, fixtures | Entire native UI or assumption every internal layout is stable |
| Orca, MIT | Mobile terminal/WebView patterns, input/IME, pairing/reconnect test cases | Orca-specific RPC names, full desktop backend, account service |
| Ovis, MIT | Verified transcript parsers and stale-input failure cases | Old Herdr socket client or obsolete workspace API |

Keep copied files' headers and a provenance manifest with upstream commit, original path, license and modifications. Check each file/submodule/asset's actual license; repository-level license is not blanket permission for trademarks or dependencies. Prefer original interface/branding and small extracted modules over a giant mobile fork.

## 22. Required test and acceptance matrix

### Core/transport
- Generated request/response validators agree with pinned schema; required/optional/null semantics preserved.
- Plain hello reply and first framed bytes in the same read; fragmented/coalesced headers and payloads.
- Invalid lengths, max frames, channel isolation, stalled renderer, credit accounting.
- Events missed/seq reset/remote reconnect resnapshot documents and terminals.
- Ctrl, Alt, Esc, arrows, UTF-8 boundaries, IME, multiline paste, resize and focus behavior.
- Desktop and phone observing same terminal; phone viewing does not steal dimensions.
- Win32 input mode, or explicit unsupported capability until complete implementation.

### Workflow
- Two rapid Start taps create exactly one task job/worktree/launch under normal responses.
- Kill bridge after every provisioning step; recovery adopts only matching resources.
- Lost terminal.run reply does not create another agent.
- Unknown initial-message result does not send duplicate prompt.
- Concurrent setup failures do not starve another machine.
- Agent stops/reboots into shell: task needs restart, no automatic prompt resend.
- Host alias changes preserve core identity associations.
- Core state wipe never binds a task to reused terminal address.
- Same repo on two hosts keeps separate path/branch ownership.

### Desktop coexistence
- Real pinned desktop opens phone-created space/tab on local and remote cores.
- Phone lists/attaches to desktop-created terminals without adoption or mutation.
- Complex unrelated layouts survive CAS append/remove byte-equivalently where possible.
- Concurrent desktop rename/add-tab and companion create/remove survive or visibly block.
- Document size limit, malformed doc, unknown app version produce safe fallback.
- No dependence on an open desktop window.

### Cleanup
- GitHub merge, GitLab merge, squash/rebase merge evidence; closed-unmerged blocks.
- Dirty/staged/untracked/ignored/.env changes block.
- Ignored disposable cache policy works without hiding credentials.
- Unpushed/current-head mismatch blocks; submodule and locked worktree block.
- External editor writes after preview; repeated prechecks and non-force Git behavior tested.
- Unrelated process/terminal blocks; owned process stop follows policy.
- Machine offline, provider 401/429/timeout, job lease expiry never authorize deletion.
- Crash after Git remove but before DB commit reconciles once.
- Desktop custom tabs survive cleanup.
- Root/main checkout is never removable; no rm -rf or force fallback.

### Device/security
- Expired/reused QR, parallel claim race, revoked device, forged endpoint and wrong bridge ID.
- Browser cookie/CSRF/Origin checks and WebView navigation restrictions.
- Large/invalid payloads, path traversal, symlink escapes, malicious title/branch/URL input.
- Logs/diagnostic export contain no tokens, credentials, command payloads or private transcripts.
- Foreground reconnection never replays terminal input/mutations.
- Push opens current state; stale notification cannot approve an old command.
- Observer cannot execute keys/prompts/admin calls.

### Agent adapters
- Same cwd with two Claude/Codex sessions; explicit native session binding or terminal fallback.
- Session switches, process replacement, truncated/rotated transcript and shared-daemon cases.
- Transcript unavailable does not impair terminal or cleanup.
- Tool output quoting other sessions does not create a binding.

### End-to-end release scenario
Using real iPhone + Android + browser and two execution cores:
pair → register repo → paste issue title/link → create worktree → run installed agent → see same terminal in official desktop → send follow-up → inspect diff → associate actual test PR/MR → externally merge → receive push → safe cleanup → restart coordinator → verify archive and no deleted unrelated resources.

Use disposable test repos for deletion/merge tests. Do not exercise cleanup against the user's work repos. Record evidence and real-device limits in RELEASE-VALIDATION.md. Unit tests alone are not complete acceptance.

## 23. Implementation milestones and deliverables

1. Evidence/codegen spike: pin schema, build typed core client, real hello/list/events/attach, small native/WebView terminal. Confirm header/credit behavior and permanent identity.
2. Bridge/pairing: authenticated HTTPS deployment, revocation, WebSocket mapping, local service install, app/web host profiles.
3. Inventory: multi-machine snapshots/attention, observer/control terminal, offline lifecycle, diagnostics.
4. Repo/tasks: durable SQLite state, idempotency, worktree creation, trusted setup steps, agent profiles and launch receipts.
5. Desktop integration: CAS document adapter, fixtures and real concurrent-edit verification.
6. Review/providers: safe file helper, diffs, PR/MR association, provider polling and merge evidence.
7. Cleanup: previews/policies/jobs/reconciliation, all destructive-operation tests before auto mode.
8. Push and transcripts: durable notifications/receipts; verified Claude/Codex reading with terminal fallback.
9. Product finish: accessibility, pt-BR, tablets/web, performance, installers, upgrades and complete end-to-end checks.

Repository layout:

~~~text
apps/mobile/                  Expo app and native/web screens
apps/bridge/                  Fastify server, CLI, service installers
packages/core-client/         generated types + protocol/streams
packages/contracts/           companion HTTP/WS schemas and errors
packages/domain/              task/cleanup policies and state transitions
packages/workflows/           handlers, durable job steps, reconciliation
packages/adapters/            SQLite, core/Git, providers, push, transcript
packages/desktop-interop/     versioned herdr-app document adapters
packages/terminal-web/        bundled xterm document and WebView protocol
tools/fs-helper/              tiny Rust allowed-root file helper
vendor/herdr-core/            pinned schema, license, source manifest
fixtures/                     recorded schemas/events/layouts, sanitized
docs/                         setup, architecture, operations, compatibility
~~~

Each feature owns its application behavior; shared packages should stay cohesive. Do not create dozens of packages for individual DTOs.

Required scripts: dev:bridge, dev:mobile, dev:web, generate:core, check:generated, typecheck, test, test:integration, test:e2e:web, test:e2e:native, build:bridge, build:web, build:helper, doctor. Validate actual setup commands during implementation.

Ship a companion.example.json with localhost listen address, hc endpoint/discovery, registered-repo examples, empty credentials and manual cleanup default. Provide launchd and systemd user-service installation with explicit commands; Windows execution hosts supported, Windows coordinator packaging may follow if all P0 behavior otherwise works on Linux/macOS. Do not silently promise Windows service support without tests.

CI: Linux shared/bridge + live-core protocol tests; macOS build/native iOS and Windows terminal-executor test lanes where available; Android build and physical acceptance evidence. Schema updates are reviewed diffs, not automatic production upgrades. Native app and bridge can upgrade independently with compatibility negotiation.

## 24. Operational documentation and completion definition

Document:
- Prerequisites: core/Git/agents installed on executors, SSH keys on coordinator, Tailscale connectivity.
- Pairing and phone access; no smartphone SSH key required.
- How to register personal/company repos without moving credentials.
- What remains running if desktop/app/bridge closes, sleeps or reboots.
- How templates/readiness/status reporting differ.
- How to inspect and recover every uncertain provisioning/send/cleanup state.
- Push setup and distribution requirements; notification delivery limitations.
- Provider token scopes, enterprise origin configuration, revoked credential recovery.
- SQLite backup via backup API/checkpoint strategy, encrypted secret-store backup and restore testing.
- Upgrades, schema changes, desktop document gates and rollback.
- License/provenance notices and original branding.
- Explicit measured resource figures, not Rust/Electron-based assumptions.

The implementation is complete when P0 scenarios pass with real core, desktop coexistence is verified, both provider cleanup flows are tested in disposable repos, and phone/browser control works on real devices. Unsupported transcript versions must be clearly listed, not claimed as working.

The agent must report what was built, exact validation performed, unresolved incompatibilities and any platform/distribution setup the owner must perform. No "production ready" claim based only on compilation.

## 25. Research evidence and pinned references

All implementation decisions above are proposed design unless described as observed upstream behavior. Source snapshots were inspected on October 30, 2026. Upstream is changing rapidly; verify compatibility at these commits first, then explicitly review upgrades.

| Repository | Inspected commit |
| --- | --- |
| herdrdev/herdr-core | dbcdcffc779f7516d5815cbd6f0a37da2b5e6628 |
| herdrdev/herdr-app | 3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2 |
| stablyai/orca | c610633ed0194daa06c5e2c9bc4cb3c825ceb55a |
| devswha/ovis | 52fdc4d413e91866add9166b0bfa441280a34af5 |

Core schema info.version: 0.1.14.
hc.openrpc.json SHA-256: 41f3e7734499e114a9a1b88f963b83823ad8383eb5e40fdacdeced2682ad92ba.

Primary upstream references:

- Core schema: https://github.com/herdrdev/herdr-core/blob/dbcdcffc779f7516d5815cbd6f0a37da2b5e6628/schema/hc.openrpc.json
- Core protocol/streams/events/documents: https://github.com/herdrdev/herdr-core/blob/dbcdcffc779f7516d5815cbd6f0a37da2b5e6628/schema/README.md
- Core security: https://github.com/herdrdev/herdr-core/blob/dbcdcffc779f7516d5815cbd6f0a37da2b5e6628/docs/security.md
- Core templates: https://github.com/herdrdev/herdr-core/blob/dbcdcffc779f7516d5815cbd6f0a37da2b5e6628/docs/templates.md
- Core machines: https://github.com/herdrdev/herdr-core/blob/dbcdcffc779f7516d5815cbd6f0a37da2b5e6628/docs/machines.md
- Desktop document types: https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/src/mirror.rs
- Desktop CAS sync: https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/src/mirror_sync.rs
- Desktop node representation: https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/src/layout.rs
- Desktop worktree mod: https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/defaults/mods/worktree/main.js
- Orca mobile setup/architecture: https://github.com/stablyai/orca/blob/c610633ed0194daa06c5e2c9bc4cb3c825ceb55a/mobile/README.md
- Orca mobile dependency selection reference: https://github.com/stablyai/orca/blob/c610633ed0194daa06c5e2c9bc4cb3c825ceb55a/mobile/package.json
- Orca unknown-delivery policy: https://github.com/stablyai/orca/blob/c610633ed0194daa06c5e2c9bc4cb3c825ceb55a/mobile/src/transport/rpc-delivery-ambiguity.ts
- Orca mobile terminal source: https://github.com/stablyai/orca/tree/c610633ed0194daa06c5e2c9bc4cb3c825ceb55a/mobile/src/terminal
- Ovis old backend client: https://github.com/devswha/ovis/blob/52fdc4d413e91866add9166b0bfa441280a34af5/server/herdr/client.ts
- Ovis transcript/session safeguards: https://github.com/devswha/ovis/tree/52fdc4d413e91866add9166b0bfa441280a34af5/server
- Git worktree semantics: https://git-scm.com/docs/git-worktree
- GitHub PR API: https://docs.github.com/en/rest/pulls/pulls
- GitLab MR API: https://docs.gitlab.com/api/merge_requests/
- Expo notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- Expo Push sending/receipts: https://docs.expo.dev/push-notifications/sending-notifications/
- Expo secure storage: https://docs.expo.dev/versions/latest/sdk/securestore/
- Tailscale Serve: https://tailscale.com/docs/features/tailscale-serve
- Fastify validation: https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/
- Fastify WebSocket: https://github.com/fastify/fastify-websocket
- Ajv: https://github.com/ajv-validator/ajv
- SQLite binding: https://github.com/WiseLibs/better-sqlite3

Research limitations: no runnable companion was built during this specification task; no actual RAM benchmark, real-device terminal test, concurrent desktop-layout test or provider cleanup was executed. These are mandatory implementation validations, not established results. The mobile feasibility is grounded in existing Orca source and core's documented protocol. The desktop document is source-derived and private/version-sensitive.

## 26. Initial agent handoff prompt

Implement Herdr Companion from this specification. Build a standalone React Native/Expo iOS/Android app and web client against NEW herdr-core, with a small authenticated Node/Fastify host bridge. Do not use the old Herdr TUI API or depend on Orca Desktop. Begin by pinning the provided core schema and source commits, generate the typed RPC client, and prove a real terminal attach round trip. Then implement every P0 milestone in order: pairing, multi-machine attention, durable task/worktree creation from title+issue link, native agent launch, compatible desktop spaces, file/diff review, GitHub/GitLab merge observation, safe checkout cleanup, push notifications, verified transcript reading and release tests. Preserve running agents across bridge/client shutdown; never replay uncertain sends or delete dirty/unmanaged checkouts. Treat the schema as authoritative and this document's custom workflows as application behavior to implement. Keep progress in docs/IMPLEMENTATION-STATUS.md, test failures honestly, and complete the real-device/two-machine acceptance scenario before calling the app complete.
