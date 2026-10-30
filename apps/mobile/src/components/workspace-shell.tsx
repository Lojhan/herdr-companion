import PanelResizeHandle from "./panel-resize-handle";
import { usePanelLayout } from "@/lib/panel-layout";
import { WorkspaceInspector } from "./workspace-inspector";
import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useInventory, useCoordinator } from "@/lib/coordinator";
import { metrics, useHerdrTheme } from "@/lib/theme";
import { useLayout } from "@/lib/layout";
import { Icon } from "./icons";
import { WorkspaceSidebar } from "./workspace-sidebar";
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const panels = usePanelLayout();
  const layout = useLayout(),
    { theme: t } = useHerdrTheme(),
    { profile } = useCoordinator(),
    { data } = useInventory();
  const terminals =
      data?.terminals.filter((terminal) => terminal.state === "live") ?? [],
    needs = terminals.filter((terminal) =>
      ["blocked", "error"].includes(terminal.status?.state ?? ""),
    ).length;
  const horizontal = layout.hinge?.orientation === "horizontal";
  return (
    <View
      testID="workspace-shell"
      style={{
        flex: 1,
        minHeight: 0,
        flexDirection: horizontal ? "column" : "row",
        backgroundColor: t.canvas,
      }}
    >
      <StatusBar style={t.light ? "dark" : "light"} />
      {layout.split ? (
        <View
          style={
            horizontal
              ? { height: layout.hinge!.offset, minHeight: 0 }
              : {
                  width: layout.hinge ? layout.sidebarWidth : undefined,
                  minHeight: 0,
                  position: "relative",
                  zIndex: 10,
                }
          }
        >
          <WorkspaceSidebar />
          {!layout.hinge ? (
            <PanelResizeHandle
              label="Resize navigation sidebar"
              side="left"
              value={layout.sidebarWidth}
              min={200}
              max={Math.min(520, layout.width - 360)}
              defaultValue={268}
              onClose={() => {
                panels.setNavigation(200);
                panels.setCollapsed(true);
              }}
              onChange={panels.setNavigation}
            />
          ) : null}
        </View>
      ) : null}
      {layout.hinge ? (
        <View
          testID="fold-hinge"
          pointerEvents="none"
          style={
            horizontal
              ? { height: layout.hinge.size, backgroundColor: t.chrome }
              : { width: layout.hinge.size, backgroundColor: t.chrome }
          }
        />
      ) : null}
      <View
        testID="workspace-content"
        style={{ flex: 1, minWidth: 0, minHeight: 0 }}
      >
        <View
          style={{
            flex: 1,
            minHeight: 0,
            flexDirection: "row",
            position: "relative",
          }}
        >
          <View style={{ flex: 1, minHeight: 0, minWidth: 0 }}>{children}</View>
          <WorkspaceInspector />
        </View>
        {layout.split && !horizontal ? (
          <View
            style={{
              height: metrics.status,
              flexDirection: "row",
              paddingHorizontal: 12,
              alignItems: "center",
              gap: 12,
              borderTopWidth: 1,
              borderTopColor: t.border,
              backgroundColor: t.chrome,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                flex: 1,
                minWidth: 0,
              }}
            >
              <Icon name="monitor" size={12} color={t.muted} />
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: "Geist",
                  fontSize: 11.5,
                  lineHeight: 16,
                  color: t.muted,
                  flexShrink: 1,
                }}
              >
                {data?.core?.core.name ?? "No coordinator"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: t.dim,
                }}
              />
              <Text
                style={{
                  fontFamily: "Geist",
                  fontSize: 11.5,
                  lineHeight: 16,
                  color: t.muted,
                }}
              >
                {terminals.length}{" "}
                {terminals.length === 1 ? "terminal" : "terminals"}
              </Text>
              {needs && layout.paneWidth > 500 ? (
                <Text
                  style={{
                    fontFamily: "Geist",
                    fontSize: 11.5,
                    color: t.blocked,
                  }}
                >
                  · {needs} needs you
                </Text>
              ) : null}
            </View>
            {layout.paneWidth > 600 ? (
              <Text style={{ fontFamily: "Geist", fontSize: 11, color: t.dim }}>
                {data?.connected
                  ? "Connected"
                  : profile
                    ? "Coordinator offline"
                    : "Not paired"}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
