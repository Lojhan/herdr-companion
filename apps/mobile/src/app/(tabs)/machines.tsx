import { useWorkspaceCreation } from "@/lib/workspace-creation";
import { View, Text } from "react-native";
import { Icon } from "@/components/icons";
import { useCoordinator, useInventory } from "@/lib/coordinator";
import { useHerdrTheme } from "@/lib/theme";
import { WorkspaceToolbar } from "@/components/workspace-toolbar";
import {
  Page,
  Heading,
  Body,
  Label,
  Section,
  Empty,
  Notice,
  Button,
} from "@/components/ui";
export default function Machines() {
  const { open: create } = useWorkspaceCreation();
  const { profile } = useCoordinator(),
    { data, error, refetch } = useInventory(),
    { theme: t } = useHerdrTheme();
  return (
    <View style={{ flex: 1 }}>
      <WorkspaceToolbar title="Machines" />
      <Page>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Heading>Machines</Heading>
          <Button
            secondary
            icon="plus"
            onPress={() => create({ kind: "machine" })}
          >
            Add machine
          </Button>
        </View>
        <Body muted>Your coordinator and its execution machines.</Body>
        {error ? <Notice error>{error.message}</Notice> : null}
        {data?.core ? (
          <Section>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <Icon name="monitor" size={17} color={t.muted} />
              <Text
                selectable
                style={{
                  fontFamily: "Geist",
                  fontSize: 14,
                  color: t.foreground,
                  flex: 1,
                }}
              >
                {data.core.core.name}
              </Text>
              <Label>{data.connected ? "Connected" : "Offline"}</Label>
            </View>
            <Body muted>herdr-core {data.core.version} · Coordinator</Body>
            <Text
              selectable
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 11,
                color: t.dim,
              }}
            >
              {data.core.core.id}
            </Text>
          </Section>
        ) : (
          <Empty
            icon="server"
            title={profile ? "Waiting for the core" : "No machines connected"}
            description="Connect a coordinator in Settings to discover its machines."
          />
        )}
        {data?.machines.map((machine) => (
          <Section key={machine.id}>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <Icon name="server" size={16} color={t.muted} />
              <Text
                selectable
                style={{
                  fontFamily: "Geist",
                  fontSize: 14,
                  color: t.foreground,
                  flex: 1,
                }}
              >
                {machine.name}
              </Text>
              <Label>{machine.state.replaceAll("_", " ")}</Label>
            </View>
            <Body muted>{machine.target}</Body>
            <Text
              selectable
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 11,
                color: t.dim,
              }}
            >
              {machine.id}
            </Text>
          </Section>
        ))}
        {data?.connected && !data.machines.length ? (
          <Body muted>
            No remote machines configured. Add a machine here or from Herdr
            desktop.
          </Body>
        ) : null}
        <Button secondary icon="refresh-cw" onPress={() => void refetch()}>
          Refresh machines
        </Button>
      </Page>
    </View>
  );
}
