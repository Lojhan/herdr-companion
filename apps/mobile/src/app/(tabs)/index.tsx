import { router } from "expo-router";
import { View } from "react-native";
import { useCoordinator, useInventory } from "@/lib/coordinator";
import { useHerdrTheme } from "@/lib/theme";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";
import { WorkspaceToolbar } from "@/components/workspace-toolbar";
import { Button, Body, Empty, Notice, useWide } from "@/components/ui";
export default function Workspace() {
  const wide = useWide(),
    { theme: t } = useHerdrTheme(),
    { profile } = useCoordinator(),
    { data, error } = useInventory();
  if (!wide) return <WorkspaceSidebar mobile />;
  return (
    <View style={{ flex: 1 }}>
      <WorkspaceToolbar title="Workspace" back={false} />
      <View style={{ flex: 1, padding: 8 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: t.background,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Empty
            align="center"
            icon="layers"
            title={profile ? "No space selected" : "Connect to your workspace"}
            description={
              profile
                ? "Choose a space or an agent in the sidebar. Your terminals keep running when you leave."
                : "Your spaces, agents, and terminals.\nOn any machine, from here."
            }
          >
            <Button
              align="center"
              secondary
              onPress={() => router.push("/settings")}
              icon="link"
            >
              {profile ? "Coordinator settings" : "Connect a coordinator"}
            </Button>
            {error ? <Notice error>{error.message}</Notice> : null}
            {data && !data.connected ? (
              <Body muted>
                Coordinator disconnected. Showing the last known state.
              </Body>
            ) : null}
          </Empty>
        </View>
      </View>
    </View>
  );
}
