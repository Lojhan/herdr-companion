import { useWorkspaceCreation } from "@/lib/workspace-creation";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { useInventory } from "@/lib/coordinator";
import { spaceLabel, terminalLabel, terminalCoreId } from "@/lib/workspace";
import { uiSize } from "@/lib/design-tokens";
import { useLayout } from "@/lib/layout";
import { useHerdrTheme } from "@/lib/theme";
import { WorkspaceToolbar } from "@/components/workspace-toolbar";
import TerminalSession from "@/components/terminal-session";
import { Empty, IconButton } from "@/components/ui";
export default function SpaceScreen() {
  const { id, tab: tabId } = useLocalSearchParams<{
      id: string;
      tab?: string;
    }>(),
    { data } = useInventory(),
    { theme: t } = useHerdrTheme();
  const { dense } = useLayout();
  const { open: create } = useWorkspaceCreation();
  const space = data?.spaces?.find((space) => space.id === id);
  const tab = space?.tabs.find((tab) => tab.id === tabId) ?? space?.tabs[0];
  const terminal = data?.terminals.find((terminal) =>
    tab?.terminals.includes(terminal.address),
  );
  const tabs = space?.tabs.map((item) => (
    <Pressable
      key={item.id}
      accessibilityRole="tab"
      accessibilityLabel={item.name || "Terminal"}
      accessibilityState={{ selected: tab?.id === item.id }}
      onPress={() => router.setParams({ tab: item.id })}
      style={({ hovered }) => ({
        height: dense ? uiSize.mouseAction : uiSize.touchTarget,
        minWidth: 44,
        paddingHorizontal: 8,
        gap: 7,
        borderRadius: 7,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor:
          tab?.id === item.id ? t.raised : hovered ? t.hover : "transparent",
        borderWidth: 1,
        borderColor: tab?.id === item.id ? t.border : "transparent",
      })}
    >
      <Icon name="terminal" size={uiSize.icon} color={t.muted} />
      <Text
        style={{
          fontFamily: "Geist",
          fontSize: 12.8,
          lineHeight: 18,
          includeFontPadding: false,
          color: tab?.id === item.id ? t.foreground : t.muted,
        }}
      >
        {item.name || "Terminal"}
      </Text>
    </Pressable>
  ));
  if (space)
    tabs?.push(
      <IconButton
        key="add-tab"
        icon="plus"
        label="New terminal tab"
        onPress={() => create({ kind: "terminal", spaceId: space.id })}
      />,
    );
  if (terminal && data)
    return (
      <TerminalSession
        key={`${terminal.address}:${terminal.created_ms}`}
        address={terminal.address}
        createdMs={terminal.created_ms}
        coreId={terminalCoreId(terminal, data) ?? ""}
        title={terminalLabel(terminal)}
        tabs={tabs}
      />
    );
  return (
    <View style={{ flex: 1 }}>
      <WorkspaceToolbar title={space ? spaceLabel(space) : "Space"}>
        {space ? tabs : undefined}
      </WorkspaceToolbar>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Empty
          icon="terminal"
          title={space ? "No terminal in this tab" : "Space unavailable"}
          description={
            space
              ? "Add a terminal or agent with the plus button, or choose another tab or an agent from the sidebar."
              : "Reconnect the coordinator to refresh its desktop spaces."
          }
        />
      </View>
    </View>
  );
}
