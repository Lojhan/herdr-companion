import { View } from "react-native";
import { Page, Heading, Body, Section, Empty } from "@/components/ui";
import { WorkspaceToolbar } from "@/components/workspace-toolbar";
export default function Tasks() {
  return (
    <View style={{ flex: 1 }}>
      <WorkspaceToolbar title="Tasks" />
      <Page>
        <Heading>Tasks</Heading>
        <Body muted>Issues, checkouts, and the agents working on them.</Body>
        <Section>
          <Empty
            icon="git-branch"
            title="No managed tasks yet"
            description="Task creation and worktree workflows are coming in a later build. Your existing spaces and terminals are available in the workspace."
          />
        </Section>
      </Page>
    </View>
  );
}
