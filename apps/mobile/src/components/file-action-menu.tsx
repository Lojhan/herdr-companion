import { Modal, Pressable, Text, View } from "react-native";
import { useHerdrTheme } from "@/lib/theme";
import { useLayout } from "@/lib/layout";
import { Icon, type IconName } from "./icons";
export interface FileAction {
  label: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
}
export function FileActionMenu({
  point,
  actions,
  onClose,
}: {
  point?: { x: number; y: number };
  actions: FileAction[];
  onClose: () => void;
}) {
  const { theme: t } = useHerdrTheme(),
    { width, height, dense } = useLayout();
  const row = dense ? 32 : 44,
    pad = 8,
    menuWidth = Math.min(240, width - 32),
    menuHeight = actions.length * row + pad;
  const left = Math.max(
      8,
      Math.min(point?.x ?? (width - menuWidth) / 2, width - menuWidth - 8),
    ),
    top = Math.max(
      8,
      Math.min(point?.y ?? (height - menuHeight) / 2, height - menuHeight - 24),
    );
  return (
    <Modal transparent animationType="none" visible onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Dismiss file actions"
        accessibilityRole="button"
        onPress={onClose}
        style={{ position: "absolute", inset: 0 }}
      />
      <View
        accessibilityViewIsModal
        accessibilityRole="menu"
        testID="file-action-menu"
        style={{
          position: "absolute",
          left,
          top,
          width: menuWidth,
          padding: 4,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 8,
          backgroundColor: t.popover,
        }}
      >
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="menuitem"
            accessibilityLabel={action.label}
            accessibilityState={{ disabled: !!action.disabled }}
            disabled={action.disabled}
            onPress={() => {
              onClose();
              action.onPress();
            }}
            style={({ hovered, pressed }) => ({
              height: row,
              paddingHorizontal: 8,
              flexDirection: "row",
              gap: 9,
              alignItems: "center",
              borderRadius: 6,
              opacity: action.disabled ? 0.4 : 1,
              backgroundColor: hovered || pressed ? t.hover : "transparent",
            })}
          >
            <Icon name={action.icon} size={15} color={t.muted} />
            <Text
              style={{
                fontFamily: "Geist",
                fontSize: dense ? 12.5 : 14,
                color: t.foreground,
              }}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
