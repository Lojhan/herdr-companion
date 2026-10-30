# Compatibility

## Pinned integration

- herdr-core: `dbcdcffc779f7516d5815cbd6f0a37da2b5e6628`; schema info.version `0.1.14`; generation 1.
- Schema SHA-256: `41f3e7734499e114a9a1b88f963b83823ad8383eb5e40fdacdeced2682ad92ba`.
- Actual local runtime: official `hc 0.1.14`, macOS arm64 release archive SHA-256 `ca524329d2e0630219550055dcc71f42aafd85fba356e0d543d6f51244487970`.
- herdr-app layout reference: `3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2`. Append-only workspace/tab writes use conflict-aware CAS; coexistence with the actual desktop GUI is not yet verified.

## Observed upstream discrepancy

The pinned schema requires `ListResult.machines`. The real 0.1.14 runtime omits this property when there are no remote machines. The pinned source explains why: `crates/herdr-core/src/api/types.rs`, `ListResult.machines`, uses `#[serde(skip_serializing_if = "Vec::is_empty")]` while its JsonSchema derivation marks it required. The official release's discovered schema has the same inconsistency. Building that source would retain the issue.

The generated `terminal.list` validator remains strict and rejects the invalid response. The app uses the independently validated `events.subscribe` initial/missed snapshots, documented terminal events, and `machine.list`; Settings reports the discrepancy. No synthetic `machines` field is inserted into raw core responses. Inventory uses program-reported status and terminal identity, preserving generic terminal access.

`rpc.discover` returns an external OpenRPC meta-schema reference. The generator explicitly treats that result as an opaque JSON object; it does not fetch remote schemas or compile network-supplied schemas. All locally described method params/results are generated. Full OpenRPC document validation is not claimed.

## Runtime matrix

Actual package resolutions are frozen in `pnpm-lock.yaml` and summarized below. Native dependency selection comes from Expo's SDK 58 installer, not the reference applications' lockfiles.

| Component           | Tested version                                                            |
| ------------------- | ------------------------------------------------------------------------- |
| Node                | 24.10.0                                                                   |
| pnpm                | 10.32.1                                                                   |
| Expo                | see version table appended below                                          |
| Core protocol       | generation 1, framed                                                      |
| Coordinator host    | macOS arm64                                                               |
| Browser             | Playwright Chromium                                                       |
| iOS/Android         | JS/Hermes export only; no native compilation or device runtime acceptance |
| Windows executor    | observation implementation only; interactive control blocked              |
| Remote Unix control | blocked until platform and core identity probing is implemented           |

Only the pinned runtime is tested. Advertised methods and generation are checked before RPC use; version alone is insufficient. No future desktop compatibility is implied.

### Resolved package versions

| Package                   | Version |
| ------------------------- | ------- |
| expo                      | 58.0.21 |
| react                     | 19.3.0  |
| react-native              | 0.88.1  |
| expo-router               | 58.0.28 |
| react-native-webview      | 14.0.1  |
| @xterm/xterm              | 6.0.0   |
| fastify                   | 5.12.7  |
| @fastify/websocket        | 11.3.4  |
| better-sqlite3            | 12.11.1 |
| ajv                       | 8.20.0  |
| json-schema-to-typescript | 15.0.4  |
| vitest                    | 3.2.7   |
| @playwright/test          | 1.64.1  |
