import Constants, { ExecutionEnvironment } from "expo-constants";
import { PanelLayoutProvider } from "@/lib/panel-layout";
import { WorkspaceInspectorProvider } from "@/lib/workspace-inspector";
import { HotkeyProvider } from "@/lib/hotkeys";
import { WorkspaceCreationProvider } from "@/lib/workspace-creation";
import { WorkspaceCreateDialog } from "@/components/workspace-create-dialog";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { View, KeyboardAvoidingView } from "react-native";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CoordinatorProvider } from "@/lib/coordinator";
import { useLayout } from "@/lib/layout";
import { HerdrThemeProvider, useHerdrTheme } from "@/lib/theme";
import { GlobalScrollbars } from "@/components/global-scrollbars";
import { WorkspaceShell } from "@/components/workspace-shell";
function RootNavigator() {
  const { theme: t } = useHerdrTheme();
  const viewport = useLayout();
  useEffect(() => {
    if (
      __DEV__ &&
      process.env.EXPO_OS !== "web" &&
      Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
    ) {
      // The developer FAB has a larger invisible hit box than its painted icon.
      // Keep app controls reachable; the shake gesture still opens the dev menu.
      void import("expo-dev-client")
        .then((menu) => menu.setToolsButtonVisible(false))
        .catch(() => {});
    }
  }, []);
  return (
    <SafeAreaView
      edges={["top", "right", "bottom", "left"]}
      style={{
        ...(process.env.EXPO_OS === "web"
          ? { height: viewport.height, maxHeight: viewport.height }
          : { flex: 1 }),
        minHeight: 0,
        backgroundColor: t.chrome,
      }}
    >
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, minHeight: 0 }}
      >
        <WorkspaceShell>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: t.canvas },
              animation: "none",
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="terminal/[address]" />
            <Stack.Screen name="space/[id]" />
          </Stack>
        </WorkspaceShell>
      </KeyboardAvoidingView>
      <WorkspaceCreateDialog />
      <GlobalScrollbars />
    </SafeAreaView>
  );
}
export default function Layout() {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 2000 } } }),
  );
  const [fontsLoaded, fontError] = useFonts({
    Geist: require("../../assets/fonts/Geist.ttf"),
    "JetBrains Mono": require("../../assets/fonts/JetBrainsMono-Variable.ttf"),
  });
  if (!fontsLoaded && !fontError)
    return <View style={{ flex: 1, backgroundColor: "#101114" }} />;
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <PanelLayoutProvider>
          <HerdrThemeProvider>
            <CoordinatorProvider>
              <HotkeyProvider>
                <WorkspaceCreationProvider>
                  <WorkspaceInspectorProvider>
                    <RootNavigator />
                  </WorkspaceInspectorProvider>
                </WorkspaceCreationProvider>
              </HotkeyProvider>
            </CoordinatorProvider>
          </HerdrThemeProvider>
        </PanelLayoutProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
