import { usePanelLayout } from "@/lib/panel-layout";
import { useWorkspaceCreation } from "@/lib/workspace-creation";
import { useState } from "react";
import { router, useGlobalSearchParams, usePathname } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useCoordinator, useInventory } from "@/lib/coordinator";
import { useHerdrTheme } from "@/lib/theme";
import { useLayout } from "@/lib/layout";
import {
  rank,
  spaceLabel,
  terminalHref,
  terminalLabel,
  terminalSpace,
  workspaceMachines,
  type WorkspaceTerminal,
} from "@/lib/workspace";
import { Icon, type IconName } from "./icons";
import { uiSize, space } from "@/lib/design-tokens";
import {
  ChromeRow,
  ChromeAction,
  SidebarSectionHeader,
  SidebarSearch,
  NavigationItem,
  SidebarEmpty,
} from "./workspace-primitives";
export function StatusDot({
  terminal,
  compact = false,
}: {
  terminal: WorkspaceTerminal;
  compact?: boolean;
}) {
  const { theme: t } = useHerdrTheme();
  const state = terminal.status?.state;
  if (compact)
    return (
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor:
            state === "blocked" || state === "error"
              ? t.blocked
              : state === "working"
                ? t.working
                : state === "done"
                  ? t.done
                  : t.dim,
        }}
      />
    );
  if (state === "blocked" || state === "error")
    return (
      <View
        accessibilityLabel="Needs you"
        style={{
          backgroundColor: t.blocked + "26",
          width: 16,
          height: 16,
          flexShrink: 0,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: t.blocked,
            fontFamily: "Geist",
            fontSize: 11,
            lineHeight: 14,
            fontWeight: "700",
            includeFontPadding: false,
          }}
        >
          !
        </Text>
      </View>
    );
  return (
    <View
      accessibilityLabel={state ?? "Status not reported"}
      style={{
        width: 7,
        height: 7,
        flexShrink: 0,
        borderRadius: 4,
        borderWidth: state === "idle" ? 1.5 : 0,
        borderColor: t.idle,
        backgroundColor:
          state === "done"
            ? t.done
            : state === "working"
              ? t.working
              : state === "idle"
                ? "transparent"
                : t.dim,
      }}
    />
  );
}
export function WorkspaceSidebar({ mobile = false }: { mobile?: boolean }) {
  const { theme: t } = useHerdrTheme(),
    layout = useLayout(),
    { profile } = useCoordinator(),
    { data, error } = useInventory();
  const { open: create } = useWorkspaceCreation();
  const path = usePathname(),
    params = useGlobalSearchParams<{
      address?: string;
      id?: string;
      tab?: string;
    }>();
  const { collapsed, setCollapsed } = usePanelLayout();
  const [searching, setSearching] = useState(false),
    [search, setSearch] = useState("");
  const compact = collapsed && !mobile && !layout.hinge;
  const singleScroll =
    mobile ||
    compact ||
    layout.short ||
    layout.hinge?.orientation === "horizontal";
  const matches = (value: string) =>
    value.toLowerCase().includes(search.toLowerCase());
  const spaces = (data?.spaces ?? []).filter((space) =>
    matches(`${spaceLabel(space)} ${space.folder}`),
  );
  const terminals = (data?.terminals ?? [])
    .filter(
      (terminal) =>
        terminal.state === "live" &&
        matches(
          `${terminalLabel(terminal)} ${terminal.address} ${terminal.cwd}`,
        ),
    )
    .sort((a, b) => rank(b) - rank(a));
  const groups = [
    {
      name: "Needs you",
      items: terminals.filter((terminal) => rank(terminal) === 4),
    },
    {
      name: "Done",
      items: terminals.filter((terminal) => rank(terminal) === 3),
    },
    {
      name: "Working",
      items: terminals.filter((terminal) => rank(terminal) === 2),
    },
    {
      name: "Idle",
      items: terminals.filter((terminal) => rank(terminal) === 1),
    },
    {
      name: "Terminals",
      items: terminals.filter((terminal) => rank(terminal) === 0),
    },
  ];
  const machines = workspaceMachines(data).filter((machine) =>
    matches(machine.name),
  );
  const textStyle = {
    fontFamily: "Geist",
    fontSize: layout.dense ? 13 : 14,
    lineHeight: layout.dense ? 18 : 20,
    color: t.muted,
    includeFontPadding: false,
  };
  const currentSpace = data?.spaces?.find((space) => space.id === params.id),
    currentTab =
      currentSpace?.tabs.find((tab) => tab.id === params.tab) ??
      currentSpace?.tabs[0];
  const spaceHeader = (
    <SidebarSectionHeader
      title="Spaces"
      compact={compact}
      action={
        <ChromeAction
          icon="plus"
          label="New workspace"
          onPress={() => create({ kind: "space" })}
        />
      }
    />
  );
  const agentHeader = (
    <SidebarSectionHeader
      title="Agents"
      compact={compact}
      action={
        <ChromeAction
          icon="plus"
          label="New agent"
          onPress={() => create({ kind: "agent", spaceId: currentSpace?.id })}
        />
      }
    />
  );
  const machineHeader = (
    <SidebarSectionHeader
      title="Machines"
      compact={compact}
      onPress={() => router.navigate("/machines")}
      action={
        <ChromeAction
          icon="plus"
          label="Add machine"
          onPress={() => create({ kind: "machine" })}
        />
      }
    />
  );
  const machineRows = (
    <View
      style={{
        paddingHorizontal: space.sm,
        paddingBottom: space.sm,
        gap: compact ? uiSize.railGap : 2,
      }}
    >
      {machines.map((machine) => (
        <NavigationItem
          key={machine.id}
          label={`Open machine ${machine.name}`}
          compact={compact}
          icon={
            <Icon
              name={machine.coordinator ? "monitor" : "server"}
              size={uiSize.icon}
              color={t.muted}
            />
          }
          onPress={() => router.navigate("/machines")}
          trailing={
            compact ? (
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor:
                    machine.state === "connected"
                      ? t.ansi[2]
                      : machine.state === "connecting"
                        ? t.working
                        : t.blocked,
                }}
              />
            ) : (
              <Text
                style={{
                  fontFamily: "Geist",
                  fontSize: 10,
                  lineHeight: 16,
                  color: machine.state === "connected" ? t.dim : t.blocked,
                }}
              >
                {machine.state === "connected"
                  ? "Connected"
                  : machine.state === "connecting"
                    ? "Connecting…"
                    : machine.state === "offline"
                      ? "Offline"
                      : machine.state.replaceAll("_", " ")}
              </Text>
            )
          }
        >
          <Text numberOfLines={1} style={{ ...textStyle, color: t.muted }}>
            {machine.name}
          </Text>
        </NavigationItem>
      ))}
      {compact ? (
        <ChromeAction
          rail
          icon="plus"
          label="Add machine"
          onPress={() => create({ kind: "machine" })}
        />
      ) : null}
      {!machines.length && !compact ? (
        <SidebarEmpty
          title="No machines connected"
          description="Connect a coordinator to see its hosts."
        />
      ) : null}
    </View>
  );
  const spaceRows = (
    <View
      style={{
        paddingHorizontal: space.sm,
        paddingBottom: compact ? space.sm : space.lg,
        gap: compact ? uiSize.railGap : 2,
      }}
    >
      {spaces.map((space, index) => {
        const active =
          (path.startsWith("/space/") && params.id === space.id) ||
          (path.startsWith("/terminal/") &&
            space.tabs.some((tab) =>
              tab.terminals.includes(params.address ?? ""),
            ));
        return (
          <NavigationItem
            key={space.id}
            compact={compact}
            icon={
              <Icon
                name="folder"
                size={uiSize.icon}
                color={t.ansi[[6, 3, 4, 5, 2, 1][index % 6]!]}
              />
            }
            trailing={
              !compact ? (
                <Text
                  style={{
                    fontFamily: "Geist",
                    fontSize: 10,
                    lineHeight: 14,
                    color: t.dim,
                    flexShrink: 0,
                  }}
                >
                  {space.tabs.length}
                </Text>
              ) : undefined
            }
            label={`Open space ${spaceLabel(space)}`}
            selected={active}
            onPress={() =>
              router.navigate({
                pathname: "/space/[id]",
                params: { id: space.id },
              })
            }
          >
            {!compact ? (
              <>
                <Text
                  numberOfLines={1}
                  style={{
                    ...textStyle,
                    minWidth: 0,
                    color: active ? t.foreground : t.muted,
                  }}
                >
                  {spaceLabel(space)}
                </Text>
              </>
            ) : null}
          </NavigationItem>
        );
      })}
      {compact ? (
        <ChromeAction
          rail
          icon="plus"
          label="New workspace"
          onPress={() => create({ kind: "space" })}
        />
      ) : null}
      {!spaces.length && !compact ? (
        <SidebarEmpty
          title={profile ? "No desktop spaces" : "No spaces connected"}
          description={
            profile
              ? "Spaces from Herdr desktop appear here."
              : "Connect a coordinator to see your spaces."
          }
        />
      ) : null}
    </View>
  );
  const agentRows = (
    <View
      style={{
        paddingHorizontal: space.sm,
        paddingBottom: compact ? space.sm : space.lg,
        gap: compact ? uiSize.railGap : 3,
      }}
    >
      {groups
        .filter((group) => group.items.length)
        .map((group) => (
          <View key={group.name} style={{ gap: compact ? uiSize.railGap : 2 }}>
            {!compact ? (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingTop: 7,
                  paddingBottom: 5,
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Geist",
                    fontSize: 10.5,
                    lineHeight: 15,
                    color: group.name === "Needs you" ? t.blocked : t.dim,
                  }}
                >
                  {group.name}
                </Text>
                <Text
                  style={{
                    fontFamily: "Geist",
                    fontSize: 10.5,
                    lineHeight: 15,
                    color: t.dim,
                  }}
                >
                  {group.items.length}
                </Text>
              </View>
            ) : null}
            {group.items.map((terminal) => {
              const terminalProject = data
                  ? terminalSpace(terminal, data)
                  : undefined,
                selected =
                  (path.startsWith("/terminal/") &&
                    params.address === terminal.address) ||
                  (path.startsWith("/space/") &&
                    !!currentTab?.terminals.includes(terminal.address));
              return (
                <NavigationItem
                  key={`${terminal.address}:${terminal.created_ms}`}
                  compact={compact}
                  icon={
                    <Icon
                      name="terminal"
                      size={uiSize.icon}
                      color={selected ? t.foreground : t.muted}
                    />
                  }
                  trailing={
                    <View
                      style={{
                        flexDirection: "row",
                        gap: space.xs,
                        alignItems: "center",
                      }}
                    >
                      {!compact && terminal.status?.progress != null ? (
                        <Text
                          style={{
                            fontFamily: "Geist",
                            fontSize: 10,
                            lineHeight: 14,
                            color: t.dim,
                          }}
                        >
                          {Math.round(
                            Math.max(
                              0,
                              Math.min(100, terminal.status.progress),
                            ),
                          )}
                          %
                        </Text>
                      ) : null}
                      <StatusDot terminal={terminal} compact={compact} />
                    </View>
                  }
                  label={`Open terminal ${terminalLabel(terminal)}`}
                  selected={selected}
                  onPress={() =>
                    data && router.navigate(terminalHref(terminal, data))
                  }
                >
                  {!compact ? (
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          ...textStyle,
                          color: selected ? t.foreground : t.muted,
                        }}
                      >
                        {terminalLabel(terminal)}
                      </Text>
                      {mobile ? (
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: "Geist",
                            fontSize: 11,
                            lineHeight: 16,
                            color: t.dim,
                          }}
                        >
                          {terminalProject
                            ? spaceLabel(terminalProject)
                            : terminal.address}{" "}
                          · {terminal.status?.state ?? "Status not reported"}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </NavigationItem>
              );
            })}
          </View>
        ))}
      {compact ? (
        <ChromeAction
          rail
          icon="plus"
          label="New agent"
          onPress={() => create({ kind: "agent", spaceId: currentSpace?.id })}
        />
      ) : null}
      {!terminals.length && !compact ? (
        <SidebarEmpty
          title="No agents running"
          description={
            profile
              ? "Live terminals appear as they connect."
              : "Your agents will appear here."
          }
        />
      ) : null}
    </View>
  );
  const footerItems: {
    label: string;
    icon: IconName;
    href: "/settings" | "/machines" | "/tasks";
  }[] = [
    { label: "Settings", icon: "settings", href: "/settings" },
    ...(mobile
      ? [
          {
            label: "Tasks",
            icon: "git-branch" as const,
            href: "/tasks" as const,
          },
        ]
      : []),
  ];
  return (
    <View
      testID={mobile ? "workspace-list" : "workspace-sidebar"}
      style={{
        width:
          mobile || layout.hinge?.orientation === "horizontal"
            ? "100%"
            : compact
              ? layout.dense
                ? uiSize.railMouse
                : uiSize.railTouch
              : layout.sidebarWidth,
        flex: 1,
        minHeight: 0,
        backgroundColor: t.chrome,
        borderRightWidth:
          mobile || layout.hinge?.orientation === "horizontal" ? 0 : 1,
        borderRightColor: t.border,
      }}
    >
      <View
        style={{
          borderBottomWidth: uiSize.divider,
          borderBottomColor: t.border,
        }}
      >
        <ChromeRow brand compact={compact}>
          {!compact ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Herdr workspace"
                onPress={() => router.dismissTo("/")}
                style={{
                  minHeight: layout.dense ? 30 : 44,
                  minWidth: 44,
                  flexShrink: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginLeft: space.sm,
                }}
              >
                <Image
                  source={require("../../assets/herdr.png")}
                  style={{ width: 20, height: 20, borderRadius: 5 }}
                  accessibilityLabel="Herdr"
                />
                <Text
                  style={{
                    ...textStyle,
                    fontSize: 13.5,
                    fontWeight: "600",
                    color: t.foreground,
                  }}
                >
                  Herdr
                </Text>
                <Text
                  style={{
                    fontFamily: "Geist",
                    fontSize: 10.5,
                    lineHeight: 16,
                    color: t.dim,
                  }}
                >
                  companion
                </Text>
              </Pressable>
              <View style={{ flex: 1 }} />
              <ChromeAction
                icon="search"
                label="Search spaces and agents"
                onPress={() => {
                  setSearching((value) => !value);
                  setSearch("");
                }}
              />
            </>
          ) : null}
          {!mobile && !layout.hinge ? (
            <ChromeAction
              rail={compact}
              icon="sidebar"
              label={compact ? "Expand sidebar" : "Collapse sidebar"}
              onPress={() => setCollapsed((value) => !value)}
            />
          ) : null}
        </ChromeRow>
      </View>
      {searching && !compact ? (
        <SidebarSearch value={search} onChangeText={setSearch} />
      ) : null}
      {singleScroll ? (
        <ScrollView
          testID="workspace-list-scroll"
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {spaceHeader}
          {spaceRows}
          <View style={{ borderTopWidth: 1, borderTopColor: t.border }}>
            {agentHeader}
            {agentRows}
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: t.border }}>
            {machineHeader}
            {machineRows}
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={{ flex: 1, minHeight: 0 }}>
            {spaceHeader}
            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              style={{ flex: 1, minHeight: 0 }}
            >
              {spaceRows}
            </ScrollView>
          </View>
          <View
            style={{
              flex: 1,
              minHeight: 0,
              borderTopWidth: 1,
              borderTopColor: t.border,
            }}
          >
            {agentHeader}
            <ScrollView
              contentInsetAdjustmentBehavior="automatic"
              style={{ flex: 1, minHeight: 0 }}
            >
              {agentRows}
            </ScrollView>
          </View>
          <View
            style={{
              maxHeight: 180,
              minHeight: 0,
              flexShrink: 1,
              borderTopWidth: 1,
              borderTopColor: t.border,
            }}
          >
            {machineHeader}
            <ScrollView style={{ flexGrow: 0, flexShrink: 1, minHeight: 0 }}>
              {machineRows}
            </ScrollView>
          </View>
        </>
      )}
      <View
        style={{
          paddingHorizontal: 8,
          paddingTop: space.sm,
          paddingBottom: space.sm,
          gap: 1,
          borderTopWidth: 1,
          borderTopColor: t.border,
        }}
      >
        <View
          style={{
            flexDirection: singleScroll && !compact ? "row" : "column",
            gap: compact ? uiSize.railGap : singleScroll ? 4 : 1,
          }}
        >
          {footerItems.map((item) =>
            singleScroll && !compact ? (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => router.navigate(item.href)}
                style={({ pressed, hovered }) => ({
                  flex: 1,
                  minWidth: 44,
                  minHeight: 44,
                  flexDirection: "row",
                  gap: 6,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  backgroundColor:
                    path === item.href
                      ? t.selected
                      : pressed || hovered
                        ? t.hover
                        : "transparent",
                })}
              >
                <Icon name={item.icon} size={15} color={t.muted} />
                <Text
                  style={{
                    fontFamily: "Geist",
                    fontSize: 11.5,
                    lineHeight: 17,
                    color: t.muted,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ) : (
              <NavigationItem
                key={item.label}
                compact={compact}
                icon={
                  <Icon name={item.icon} size={uiSize.icon} color={t.muted} />
                }
                label={item.label}
                selected={path === item.href}
                onPress={() => router.navigate(item.href)}
              >
                {!compact ? <Text style={textStyle}>{item.label}</Text> : null}
              </NavigationItem>
            ),
          )}
        </View>
        {
          <View
            accessibilityLabel={
              data?.connected
                ? "Core connected"
                : error
                  ? "Connection unavailable"
                  : "Core disconnected"
            }
            testID="core-connection-indicator"
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 8,
              paddingTop: 6,
              height: 22,
              flexShrink: 0,
              justifyContent: compact ? "center" : "flex-start",
              gap: 6,
            }}
          >
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: data?.connected ? t.ansi[2] : t.dim,
              }}
            />
            {!compact ? (
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: "Geist",
                  fontSize: 10.5,
                  lineHeight: 16,
                  includeFontPadding: false,
                  color: error ? t.blocked : t.dim,
                }}
              >
                {error
                  ? "Connection unavailable"
                  : data?.connected
                    ? "Core connected"
                    : data && !data.connected
                      ? "Coordinator offline"
                      : profile
                        ? "Connecting…"
                        : "Not connected"}
              </Text>
            ) : null}
          </View>
        }
      </View>
    </View>
  );
}
