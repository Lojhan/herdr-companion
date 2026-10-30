import * as Clipboard from "expo-clipboard";
import { downloadWorkspaceFile } from "@/lib/workspace-download";
import MediaPreview from "./media-preview";
import ContextMenuTarget from "./context-menu-target";
import { FileActionMenu } from "./file-action-menu";
import PanelResizeHandle from "./panel-resize-handle";
import { usePanelLayout } from "@/lib/panel-layout";
import { memo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type {
  WorkspaceMedia,
  WorkspaceChanges,
  WorkspaceFileContent,
  WorkspaceTree,
  WorkspaceDiff,
  WorkspaceChange,
} from "@companion/contracts";
import { useCoordinator } from "@/lib/coordinator";
import {
  useWorkspaceInspector,
  scopeQuery,
  type InspectorTarget,
} from "@/lib/workspace-inspector";
import { parseUnifiedDiff } from "@/lib/unified-diff";
import { useHerdrTheme } from "@/lib/theme";
import { useLayout } from "@/lib/layout";
import { space, uiSize } from "@/lib/design-tokens";
import { Icon } from "./icons";
import { Body, Button, IconButton, Notice } from "./ui";
export function WorkspaceInspector() {
  const { target, panel } = useWorkspaceInspector();
  return target && panel ? (
    <Inspector key={JSON.stringify(target.scope)} target={target} />
  ) : null;
}
function Inspector({ target }: { target: InspectorTarget }) {
  const panels = usePanelLayout();
  const { panel, close, toggle } = useWorkspaceInspector(),
    { request, profile } = useCoordinator(),
    { theme: t } = useHerdrTheme(),
    { dense, paneWidth } = useLayout();
  const [directory, setDirectory] = useState(""),
    [selectedFile, setSelectedFile] = useState<string | null>(null),
    [selectedDiff, setSelectedDiff] = useState<string | null>(null),
    [stage, setStage] = useState<"working" | "staged">("working");
  const selected = panel === "files" ? selectedFile : selectedDiff;
  const setSelected = panel === "files" ? setSelectedFile : setSelectedDiff;
  const [menu, setMenu] = useState<{ x: number; y: number } | null | undefined>(
    null,
  );
  const [actionError, setActionError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const docked = paneWidth >= 720;
  const panelWidth = Math.min(panels.inspector, paneWidth - 360);
  const key = ["workspace-inspector", target.scope];
  const tree = useQuery({
    queryKey: [...key, "tree", directory],
    queryFn: () =>
      request<WorkspaceTree>(
        "/v1/workspace/tree?" + scopeQuery(target.scope, { path: directory }),
      ),
    enabled: panel === "files",
    retry: false,
  });
  const changes = useQuery({
    queryKey: [...key, "changes"],
    queryFn: () =>
      request<WorkspaceChanges>(
        "/v1/workspace/changes?" + scopeQuery(target.scope),
      ),
    enabled: panel === "changes",
    retry: false,
  });
  const mediaPath =
    !!selected &&
    /\.(png|jpe?g|gif|webp|svg|wav|mp3|ogg|ogv|mp4|m4a|mov|webm|weba|pdf)$/i.test(
      selected,
    );
  const file = useQuery({
    queryKey: [...key, "file", selected],
    queryFn: () =>
      request<WorkspaceFileContent>(
        "/v1/workspace/file?" + scopeQuery(target.scope, { path: selected! }),
      ),
    enabled: !!selected && (panel === "files" || mediaPath),
    retry: false,
  });
  const diff = useQuery({
    queryKey: [...key, "diff", selected, stage],
    queryFn: () =>
      request<WorkspaceDiff>(
        "/v1/workspace/diff?" +
          scopeQuery(target.scope, { path: selected!, stage }),
      ),
    enabled: panel === "changes" && !!selected,
    retry: false,
  });
  const media = useQuery({
    queryKey: [...key, "media", selected],
    queryFn: () =>
      request<WorkspaceMedia>(
        "/v1/workspace/media?" + scopeQuery(target.scope, { path: selected! }),
      ),
    enabled: !!selected && !!file.data?.media?.previewable,
    retry: false,
  });
  const current = changes.data?.files.find((f) => f.path === selected);
  const error =
    panel === "files"
      ? selected
        ? file.error
        : tree.error
      : selected
        ? diff.error
        : changes.error;
  function pickChange(change: WorkspaceChange) {
    setSelected(change.path);
    setStage(
      change.untracked || change.worktree !== " " ? "working" : "staged",
    );
  }
  function refresh() {
    if (panel === "files") {
      void tree.refetch();
      if (selected) {
        void file.refetch();
        void media.refetch();
      }
    } else {
      void changes.refetch();
      if (selected) void diff.refetch();
    }
  }
  async function download() {
    if (!selected || !profile) return;
    setDownloading(true);
    setActionError("");
    try {
      await downloadWorkspaceFile(
        `${profile.endpoint}/v1/workspace/asset?${scopeQuery(target.scope, { path: selected, download: "1" })}`,
        selected.split("/").at(-1)!,
        file.data?.media?.mime,
      );
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setDownloading(false);
    }
  }
  function copy(text: string) {
    void Clipboard.setStringAsync(text).catch((error: Error) =>
      setActionError(error.message),
    );
  }
  function openFile() {
    if (!selected) return;
    setSelectedFile(selected);
    setDirectory(selected.split("/").slice(0, -1).join("/"));
    if (panel !== "files") toggle("files");
  }
  function openFolder() {
    if (!selected) return;
    setDirectory(selected.split("/").slice(0, -1).join("/"));
    setSelectedFile(null);
    if (panel !== "files") toggle("files");
  }
  const actions = selected
    ? [
        {
          label: "Open file",
          icon: "file-text" as const,
          onPress: openFile,
          disabled: current?.worktree === "D" || current?.index === "D",
        },
        {
          label: "Open containing folder",
          icon: "folder" as const,
          onPress: openFolder,
        },
        {
          label: "Copy relative path",
          icon: "file-text" as const,
          onPress: () => copy(selected),
        },
        ...(panel === "changes" && diff.data
          ? [
              {
                label: "Copy diff",
                icon: "git-compare" as const,
                onPress: () => copy(diff.data!.patch),
              },
            ]
          : []),
        {
          label: downloading ? "Downloading…" : "Download file",
          icon: "arrow-down" as const,
          onPress: () => void download(),
          disabled:
            downloading || current?.worktree === "D" || current?.index === "D",
        },
      ]
    : [];
  return (
    <View
      testID="workspace-inspector"
      style={{
        ...(docked
          ? { width: panelWidth, flexShrink: 0 }
          : { position: "absolute" as const, inset: 0, zIndex: 30 }),
        minHeight: 0,
        backgroundColor: t.background,
        borderLeftWidth: 1,
        borderLeftColor: t.border,
      }}
    >
      {docked ? (
        <PanelResizeHandle
          label="Resize workspace panel"
          side="right"
          value={panelWidth}
          min={280}
          max={Math.min(720, paneWidth - 360)}
          defaultValue={420}
          onClose={() => {
            panels.setInspector(280);
            close();
          }}
          onChange={panels.setInspector}
        />
      ) : null}
      <View
        style={{
          height: dense ? uiSize.chromeMouse : uiSize.chromeTouch,
          flexDirection: "row",
          alignItems: "center",
          gap: space.xs,
          paddingHorizontal: space.sm,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
          backgroundColor: t.chrome,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: "Geist",
            fontSize: 12.8,
            color: t.foreground,
            fontWeight: "500",
          }}
        >
          {panel === "files" ? "Files" : "Changes"}
        </Text>
        {!docked ? (
          <View style={{ flexDirection: "row", gap: 4 }}>
            {(["files", "changes"] as const).map((next) => (
              <Pressable
                key={next}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${next}`}
                accessibilityState={{ selected: panel === next }}
                onPress={() => {
                  if (panel !== next) toggle(next);
                }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 8,
                  justifyContent: "center",
                  borderRadius: 6,
                  backgroundColor: panel === next ? t.selected : "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Geist",
                    fontSize: 12.8,
                    color: panel === next ? t.foreground : t.dim,
                  }}
                >
                  {next === "files" ? "Files" : "Changes"}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {selected ? (
          <IconButton
            icon="list"
            label="File actions"
            onPress={() => setMenu(undefined)}
          />
        ) : null}
        <IconButton
          icon="refresh-cw"
          label="Refresh workspace panel"
          onPress={refresh}
        />
        <IconButton icon="x" label="Close workspace panel" onPress={close} />
      </View>
      <View
        style={{
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
          gap: space.xs,
          borderBottomWidth: 1,
          borderBottomColor: t.border,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ fontFamily: "Geist", fontSize: 12, color: t.foreground }}
        >
          {target.name}
          {changes.data && panel === "changes"
            ? ` · ${changes.data.branch}`
            : ""}
        </Text>
        <Text
          numberOfLines={1}
          style={{ fontFamily: "Geist", fontSize: 11, color: t.dim }}
        >
          {selected ??
            (panel === "files"
              ? directory || "Project files"
              : "Working tree and staged changes")}
        </Text>
      </View>
      {selected ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.xs,
            padding: space.xs,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          }}
        >
          <IconButton
            icon="chevron-left"
            label={panel === "files" ? "Back to files" : "Back to changes"}
            onPress={() => setSelected(null)}
          />
          {panel === "changes" && current ? (
            <>
              <Button
                secondary={stage !== "working"}
                disabled={!current.untracked && current.worktree === " "}
                onPress={() => setStage("working")}
              >
                Working tree
              </Button>
              <Button
                secondary={stage !== "staged"}
                disabled={current.untracked || current.index === " "}
                onPress={() => setStage("staged")}
              >
                Staged
              </Button>
            </>
          ) : (
            <Text style={{ fontFamily: "Geist", fontSize: 11, color: t.dim }}>
              Read only
            </Text>
          )}
        </View>
      ) : null}
      {menu !== null ? (
        <FileActionMenu
          point={menu}
          actions={actions}
          onClose={() => setMenu(null)}
        />
      ) : null}
      {actionError ? <Notice error>{actionError}</Notice> : null}
      {error ? (
        <View style={{ padding: space.md }}>
          <Notice error>{error.message}</Notice>
          <Button secondary onPress={refresh}>
            Retry
          </Button>
        </View>
      ) : null}
      {panel === "files" && !selected ? (
        <ScrollView contentContainerStyle={{ padding: space.sm, gap: 2 }}>
          {directory ? (
            <FileRow
              label="Parent folder"
              name=".."
              directory
              onPress={() =>
                setDirectory(directory.split("/").slice(0, -1).join("/"))
              }
            />
          ) : null}
          {tree.isPending ? <Body muted>Loading files…</Body> : null}
          {tree.data?.entries.map((entry) => (
            <FileRow
              key={entry.path}
              label={`Open ${entry.kind === "directory" ? "folder" : "file"} ${entry.name}`}
              name={entry.name}
              directory={entry.kind === "directory"}
              onPress={() =>
                entry.kind === "directory"
                  ? setDirectory(entry.path)
                  : setSelected(entry.path)
              }
            />
          ))}
          {tree.data && !tree.data.entries.length ? (
            <Body muted>This folder is empty.</Body>
          ) : null}
          {tree.data?.truncated ? (
            <Body muted>Showing the first 500 entries.</Body>
          ) : null}
        </ScrollView>
      ) : null}
      {panel === "changes" && !selected ? (
        <ScrollView contentContainerStyle={{ padding: space.sm, gap: 2 }}>
          {changes.isPending ? <Body muted>Loading changes…</Body> : null}
          {changes.data?.files.map((change) => (
            <FileRow
              key={change.path}
              label={`View diff ${change.path}`}
              name={change.path}
              badge={
                change.untracked ? "U" : (change.index + change.worktree).trim()
              }
              onPress={() => pickChange(change)}
            />
          ))}
          {changes.data && !changes.data.files.length ? (
            <View style={{ padding: space.md, gap: space.sm }}>
              <Body>No changes</Body>
              <Body muted>Your working tree is clean.</Body>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
      {selected && panel === "files" && !error ? (
        file.isPending ? (
          <Body muted>Loading file…</Body>
        ) : file.data ? (
          <>
            <View
              style={{ paddingHorizontal: space.md, paddingVertical: space.xs }}
            >
              <Body muted>
                {file.data.size.toLocaleString()} bytes
                {file.data.truncated ? " · Preview limited to 256 KB" : ""}
              </Body>
            </View>
            <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
              <Button
                secondary
                disabled={downloading}
                icon="arrow-down"
                onPress={() => void download()}
              >
                {downloading ? "Downloading…" : "Download file"}
              </Button>
            </View>
            {file.data.media ? (
              file.data.media.previewable ? (
                media.isPending ? (
                  <Body muted>Loading preview…</Body>
                ) : media.error ? (
                  <Notice error>{media.error.message}</Notice>
                ) : media.data ? (
                  <MediaPreview
                    key={selected}
                    media={media.data}
                    name={selected}
                  />
                ) : null
              ) : (
                <Body muted>
                  Media previews are limited to 20 MB. Download this file to
                  open it.
                </Body>
              )
            ) : file.data.binary ? (
              <View style={{ padding: space.md }}>
                <Body>Binary file</Body>
                <Body muted>
                  A text preview is not available for this file.
                </Body>
              </View>
            ) : (
              <CodeView content={file.data.content} />
            )}
          </>
        ) : null
      ) : null}
      {selected && panel === "changes" && !error ? (
        diff.isPending ? (
          <Body muted>Loading diff…</Body>
        ) : diff.data ? (
          <>
            {diff.data.truncated ? (
              <Body muted>Diff preview is truncated.</Body>
            ) : null}
            <ContextMenuTarget onOpen={(point) => setMenu(point)}>
              {file.data?.media && selected ? (
                <>
                  <Body muted>Current file preview</Body>
                  {media.isPending ? (
                    <Body muted>Loading preview…</Body>
                  ) : media.error ? (
                    <Notice error>{media.error.message}</Notice>
                  ) : media.data ? (
                    <MediaPreview
                      key={selected}
                      media={media.data}
                      name={selected}
                    />
                  ) : (
                    <Body muted>Use File actions to download this file.</Body>
                  )}
                </>
              ) : (
                <DiffView patch={diff.data.patch} />
              )}
            </ContextMenuTarget>
          </>
        ) : null
      ) : null}
    </View>
  );
}
function FileRow({
  label,
  name,
  directory = false,
  badge,
  onPress,
}: {
  label: string;
  name: string;
  directory?: boolean;
  badge?: string;
  onPress: () => void;
}) {
  const { theme: t } = useHerdrTheme(),
    { dense } = useLayout();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered, pressed }) => ({
        minHeight: dense ? 32 : 44,
        flexDirection: "row",
        gap: space.sm,
        alignItems: "center",
        paddingHorizontal: space.sm,
        borderRadius: 6,
        backgroundColor: hovered || pressed ? t.hover : "transparent",
      })}
    >
      <Icon
        name={directory ? "folder" : "file-text"}
        size={uiSize.icon}
        color={t.muted}
      />
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontFamily: "Geist",
          fontSize: 12.8,
          color: t.foreground,
        }}
      >
        {name}
      </Text>
      {badge ? (
        <Text
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: 11,
            color: badge.includes("D") ? t.ansi[1] : t.ansi[2],
          }}
        >
          {badge}
        </Text>
      ) : null}
    </Pressable>
  );
}
const CodeView = memo(function CodeView({ content }: { content: string }) {
  const { theme: t } = useHerdrTheme();
  const lines = content.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return (
    <ScrollView style={{ flex: 1, minHeight: 0 }}>
      <ScrollView
        horizontal
        contentContainerStyle={{ minWidth: "100%", paddingVertical: space.sm }}
      >
        <View testID="file-code" style={{ minWidth: "100%" }}>
          {lines.map((line, i) => (
            <View key={i} style={{ flexDirection: "row", minHeight: 20 }}>
              <Text
                style={{
                  width: 44,
                  textAlign: "right",
                  paddingRight: 12,
                  fontFamily: "JetBrains Mono",
                  fontSize: 11,
                  lineHeight: 20,
                  color: t.dim,
                }}
              >
                {i + 1}
              </Text>
              <Text
                selectable
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 12.5,
                  lineHeight: 20,
                  flexShrink: 0,
                  paddingRight: 16,
                  color: t.foreground,
                }}
              >
                {line || " "}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
});
const DiffView = memo(function DiffView({ patch }: { patch: string }) {
  const { theme: t } = useHerdrTheme();
  const rows = parseUnifiedDiff(patch);
  return !patch ? (
    <View style={{ padding: space.md }}>
      <Body muted>No changes in this section.</Body>
    </View>
  ) : (
    <ScrollView style={{ flex: 1, minHeight: 0 }}>
      <ScrollView
        horizontal
        contentContainerStyle={{ minWidth: "100%", paddingVertical: space.sm }}
      >
        <View testID="diff-code" style={{ minWidth: "100%" }}>
          {rows.map((line, i) => {
            const color =
              line.kind === "add"
                ? t.ansi[2]
                : line.kind === "remove"
                  ? t.ansi[1]
                  : line.kind === "hunk"
                    ? t.accent
                    : line.kind === "meta"
                      ? t.dim
                      : t.foreground;
            return (
              <View
                key={i}
                testID={`diff-${line.kind}`}
                style={{
                  flexDirection: "row",
                  minHeight: 20,
                  backgroundColor:
                    line.kind === "add" || line.kind === "remove"
                      ? color + "15"
                      : line.kind === "hunk"
                        ? t.selected
                        : "transparent",
                }}
              >
                <Text
                  style={{
                    width: 34,
                    textAlign: "right",
                    fontFamily: "JetBrains Mono",
                    fontSize: 10.5,
                    lineHeight: 20,
                    color: t.dim,
                  }}
                >
                  {line.oldLine ?? ""}
                </Text>
                <Text
                  style={{
                    width: 34,
                    textAlign: "right",
                    paddingRight: 8,
                    fontFamily: "JetBrains Mono",
                    fontSize: 10.5,
                    lineHeight: 20,
                    color: t.dim,
                  }}
                >
                  {line.newLine ?? ""}
                </Text>
                <Text
                  style={{
                    width: 16,
                    fontFamily: "JetBrains Mono",
                    fontSize: 12,
                    lineHeight: 20,
                    color,
                  }}
                >
                  {line.kind === "add"
                    ? "+"
                    : line.kind === "remove"
                      ? "-"
                      : ""}
                </Text>
                <Text
                  selectable
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: 12.5,
                    lineHeight: 20,
                    flexShrink: 0,
                    paddingRight: 16,
                    color,
                  }}
                >
                  {line.text || " "}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScrollView>
  );
});
