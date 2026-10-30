import { formSize } from "@/lib/design-tokens";
import { ChoiceField } from "./choice-field";
import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { CreationResult } from "@companion/contracts";
import { useCoordinator, useInventory } from "@/lib/coordinator";
import {
  useWorkspaceCreation,
  type CreationIntent,
} from "@/lib/workspace-creation";
import { spaceLabel, workspaceMachines } from "@/lib/workspace";
import { FormDialog } from "./form-dialog";
import { Body, Button, Field, Notice } from "./ui";
export function WorkspaceCreateDialog() {
  const { intent, close } = useWorkspaceCreation();
  return intent ? (
    <CreationForm
      key={`${intent.kind}:${intent.spaceId ?? ""}`}
      intent={intent}
      onClose={close}
    />
  ) : null;
}
function CreationForm({
  intent,
  onClose,
}: {
  intent: CreationIntent;
  onClose: () => void;
}) {
  const { open } = useWorkspaceCreation();
  const { data } = useInventory(),
    { request, role, profile } = useCoordinator(),
    query = useQueryClient();
  const [selected, setSelected] = useState(
    intent.spaceId ?? data?.spaces?.[0]?.id ?? "",
  );
  const [coreId, setCoreId] = useState(data?.core?.core.id ?? "");
  const [name, setName] = useState(
    intent.kind === "terminal"
      ? "Terminal"
      : intent.kind === "agent"
        ? "Codex"
        : "",
  );
  const [folder, setFolder] = useState(""),
    [command, setCommand] = useState(intent.kind === "agent" ? "codex" : ""),
    [target, setTarget] = useState(""),
    [session, setSession] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<CreationResult | null>(null);
  const creatingSession = intent.kind === "terminal" || intent.kind === "agent",
    workspace = data?.spaces?.find((s) => s.id === selected);
  const title = {
    space: "New workspace",
    terminal: "New terminal tab",
    agent: "New agent",
    machine: "Add machine",
  }[intent.kind];
  const allowed =
    !!profile &&
    data?.connected &&
    role !== "observer" &&
    (intent.kind !== "machine" || role === "owner");
  async function submit() {
    if (busy || !allowed) return;
    setBusy(true);
    setError("");
    try {
      const input =
        intent.kind === "space"
          ? { kind: intent.kind, coreId, name, folder }
          : intent.kind === "machine"
            ? { kind: intent.kind, name, target, session }
            : {
                kind: intent.kind,
                coreId: workspace?.coreId,
                spaceId: selected,
                name,
                command,
              };
      const next = await request<CreationResult>("/v1/workspace/create", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await query.invalidateQueries({
        queryKey: ["inventory", profile!.bridgeId],
      });
      if (next.warning) {
        setResult(next);
        return;
      }
      onClose();
      if (next.spaceId)
        router.navigate({
          pathname: "/space/[id]",
          params: {
            id: next.spaceId,
            ...(next.tabId ? { tab: next.tabId } : {}),
          },
        });
      else router.navigate("/machines");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <FormDialog
      title={title}
      onClose={onClose}
      busy={busy}
      width={intent.kind === "machine" ? formSize.machineWidth : formSize.width}
    >
      {!allowed ? (
        <Notice>
          {intent.kind === "machine" && role !== "owner"
            ? "Only the coordinator owner can add machines."
            : "Connect a coordinator with control permission to continue."}
        </Notice>
      ) : null}
      {creatingSession ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            disabled={busy}
            secondary={intent.kind !== "terminal"}
            onPress={() => open({ kind: "terminal", spaceId: selected })}
          >
            Terminal
          </Button>
          <Button
            disabled={busy}
            secondary={intent.kind !== "agent"}
            onPress={() => open({ kind: "agent", spaceId: selected })}
          >
            Agent
          </Button>
        </View>
      ) : null}
      {creatingSession ? (
        <>
          <ChoiceField
            label="Workspace"
            value={selected}
            onChange={setSelected}
            disabled={busy}
            options={(data?.spaces ?? []).map((s) => ({
              value: s.id,
              label: spaceLabel(s),
            }))}
          />
          {!data?.spaces?.length ? (
            <Body muted>
              Create a workspace first, then add a terminal or agent.
            </Body>
          ) : null}
        </>
      ) : null}
      {intent.kind === "space" ? (
        <>
          <ChoiceField
            label="Machine"
            value={coreId}
            onChange={setCoreId}
            disabled={busy}
            options={workspaceMachines(data)
              .filter((m) => m.state === "connected")
              .map((m) => ({ value: m.id, label: m.name }))}
          />
        </>
      ) : null}
      <Field
        label={
          intent.kind === "machine"
            ? "Machine name"
            : intent.kind === "space"
              ? "Workspace name"
              : "Tab name"
        }
        value={name}
        onChangeText={setName}
        maxLength={intent.kind === "machine" ? 32 : 80}
        autoCapitalize={intent.kind === "machine" ? "none" : "sentences"}
        placeholder={
          intent.kind === "space"
            ? "My project"
            : intent.kind === "machine"
              ? "build-server"
              : undefined
        }
      />
      {intent.kind === "space" ? (
        <>
          <Field
            label="Project folder"
            value={folder}
            onChangeText={setFolder}
            maxLength={2048}
            placeholder="/path/to/project"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Body muted>
            Use an existing folder on the selected machine. This workspace is
            shared with Herdr desktop.
          </Body>
        </>
      ) : null}
      {creatingSession ? (
        <>
          <Field
            label={
              intent.kind === "agent" ? "Agent command" : "Command (optional)"
            }
            value={command}
            onChangeText={setCommand}
            maxLength={4096}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={intent.kind === "agent" ? "codex" : "Default shell"}
          />
          <Body muted>
            {intent.kind === "agent"
              ? "Run an installed agent, such as codex or claude, using the selected machine’s environment."
              : "Leave the command empty to start the machine’s default shell."}
            {workspace
              ? ` Working folder: ${workspace.folder || "machine default"}.`
              : ""}
          </Body>
        </>
      ) : null}
      {creatingSession && workspace?.machine ? (
        <Body muted>Remote terminals currently open in observe-only mode.</Body>
      ) : null}
      {intent.kind === "machine" ? (
        <>
          <Field
            label="SSH target"
            value={target}
            onChangeText={setTarget}
            maxLength={200}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="user@host or SSH config alias"
          />
          <Field
            label="Core session (optional)"
            value={session}
            onChangeText={setSession}
            maxLength={64}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Body muted>
            Uses SSH from your coordinator. Set up its SSH key, known host and
            hc on the remote machine first. Interactive SSH login and automatic
            hc installation are not supported here.
          </Body>
        </>
      ) : null}
      {error ? <Notice error>{error}</Notice> : null}
      {result?.warning ? (
        <>
          <Notice>{result.warning}</Notice>
          <Button
            onPress={() => {
              onClose();
              router.navigate({
                pathname: "/terminal/[address]",
                params: {
                  address: result.address!,
                  createdMs: result.createdMs!,
                  coreId: result.coreId!,
                },
              });
            }}
          >
            Open started terminal
          </Button>
        </>
      ) : (
        <Button
          icon="plus"
          disabled={
            !allowed ||
            busy ||
            !name.trim() ||
            (creatingSession && !workspace) ||
            (intent.kind === "agent" && !command.trim()) ||
            (intent.kind === "space" && (!folder.trim() || !coreId)) ||
            (intent.kind === "machine" && !target.trim())
          }
          onPress={() => void submit()}
        >
          {busy
            ? "Creating…"
            : intent.kind === "space"
              ? "Create workspace"
              : intent.kind === "terminal"
                ? "Create terminal"
                : intent.kind === "agent"
                  ? "Start agent"
                  : "Add machine"}
        </Button>
      )}
    </FormDialog>
  );
}
