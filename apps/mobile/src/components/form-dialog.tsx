import { FormStyleContext } from "@/lib/form-style";
import type { ReactNode } from "react";
import {
  Modal,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  View,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHerdrTheme } from "@/lib/theme";
import { space, shape, formSize } from "@/lib/design-tokens";
import { IconButton } from "./ui";
export function FormDialog({
  title,
  onClose,
  children,
  busy = false,
  width = formSize.width,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
  width?: number;
}) {
  const { theme: t } = useHerdrTheme(),
    insets = useSafeAreaInsets();
  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          backgroundColor: "#00000066",
          padding: space.lg,
          paddingTop: insets.top + space.lg,
          paddingBottom: insets.bottom + space.lg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${title}`}
          disabled={busy}
          onPress={onClose}
          style={{ position: "absolute", inset: 0 }}
        />
        <View
          testID="form-dialog"
          accessibilityViewIsModal
          style={{
            width: "100%",
            maxWidth: width,
            maxHeight: "100%",
            backgroundColor: t.popover,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: shape.panel,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              paddingLeft: formSize.inset,
              paddingRight: space.sm,
              paddingTop: formSize.inset,
              flexDirection: "row",
              alignItems: "center",
              gap: space.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: "Geist",
                  fontSize: formSize.title,
                  lineHeight: formSize.titleLine,
                  fontWeight: "600",
                  color: t.foreground,
                }}
              >
                {title}
              </Text>
            </View>
            <IconButton
              icon="x"
              label={`Close ${title}`}
              disabled={busy}
              onPress={onClose}
            />
          </View>
          <ScrollView
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              padding: formSize.inset,
              paddingTop: space.lg,
              gap: space.lg,
            }}
          >
            <FormStyleContext value>{children}</FormStyleContext>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
