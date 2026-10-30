import { useWorkspaceInspector } from "@/lib/workspace-inspector";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Icon } from "@/components/icons";
import { useHerdrTheme } from "@/lib/theme";
import { uiSize, space } from "@/lib/design-tokens";
import { useLayout } from "@/lib/layout";
import { IconButton, useWide } from "./ui";
export function WorkspaceToolbar({
  title,
  children,
  back = true,
}: {
  title: string;
  children?: React.ReactNode;
  back?: boolean;
}) {
  const { panel, target, toggle } = useWorkspaceInspector();
  const { theme: t } = useHerdrTheme(),
    wide = useWide();
  const { dense } = useLayout();
  return (
    <View
      testID="workspace-toolbar"
      style={{
        height: dense ? uiSize.chromeMouse : uiSize.chromeTouch,
        flexShrink: 0,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: space.sm,
        gap: 6,
        backgroundColor: t.chrome,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
      }}
    >
      {!wide && back ? (
        <IconButton
          icon="chevron-left"
          label="Back to spaces and agents"
          onPress={() => router.dismissTo("/")}
        />
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1, minWidth: 0, alignSelf: "stretch" }}
        contentContainerStyle={{
          alignItems: "center",
          gap: 3,
          paddingVertical: 5,
        }}
      >
        {children ?? (
          <View
            testID="chrome-tab"
            style={{
              height: dense ? uiSize.mouseAction : uiSize.touchTarget,
              paddingHorizontal: space.sm,
              gap: 7,
              borderRadius: 7,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: t.raised,
              borderWidth: 1,
              borderColor: t.border,
            }}
          >
            <Icon name="layout" size={uiSize.icon} color={t.muted} />
            <Text
              style={{
                fontFamily: "Geist",
                fontSize: 12.8,
                lineHeight: 18,
                includeFontPadding: false,
                color: t.foreground,
              }}
            >
              {title}
            </Text>
          </View>
        )}
      </ScrollView>
      <>
        <IconButton
          icon="folder"
          label="Files"
          disabled={!target}
          selected={panel === "files"}
          onPress={() => toggle("files")}
        />
        <IconButton
          icon="git-compare"
          label="Changes"
          disabled={!target}
          selected={panel === "changes"}
          onPress={() => toggle("changes")}
        />
      </>
    </View>
  );
}
