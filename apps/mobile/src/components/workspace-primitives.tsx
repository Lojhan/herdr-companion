import { type ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useLayout } from "@/lib/layout";
import { useHerdrTheme } from "@/lib/theme";
import { space, shape, uiSize } from "@/lib/design-tokens";
import { Icon, type IconName } from "./icons";
import { IconButton } from "./ui";

export function ChromeRow({
  children,
  compact = false,
  brand = false,
}: {
  children: ReactNode;
  compact?: boolean;
  brand?: boolean;
}) {
  const { dense } = useLayout();
  return (
    <View
      testID={brand ? "sidebar-brand-row" : undefined}
      style={{
        minHeight: brand
          ? (dense ? uiSize.chromeMouse : uiSize.chromeTouch) - uiSize.divider
          : dense
            ? 32
            : 44,
        paddingHorizontal: compact ? 0 : uiSize.sidebarInset,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: compact ? "center" : "space-between",
        gap: space.xs,
      }}
    >
      {children}
    </View>
  );
}
export function ChromeAction({
  icon,
  label,
  onPress,
  disabled = false,
  decorative = false,
  rail = false,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  decorative?: boolean;
  rail?: boolean;
}) {
  const { dense } = useLayout(),
    { theme: t } = useHerdrTheme();
  if (decorative)
    return (
      <View
        testID="chrome-action-slot"
        accessibilityElementsHidden
        aria-hidden
        style={{
          width: dense ? uiSize.mouseAction : uiSize.touchTarget,
          height: dense ? uiSize.mouseAction : uiSize.touchTarget,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={uiSize.icon} color={t.dim} />
      </View>
    );
  return (
    <IconButton
      size={
        rail
          ? dense
            ? uiSize.railButtonMouse
            : uiSize.railButtonTouch
          : undefined
      }
      icon={icon}
      label={label}
      onPress={onPress ?? (() => {})}
      disabled={disabled}
    />
  );
}
export function SidebarSectionHeader({
  title,
  action,
  compact = false,
  onPress,
}: {
  title: string;
  action?: ReactNode;
  compact?: boolean;
  onPress?: () => void;
}) {
  const { theme: t } = useHerdrTheme(),
    { dense } = useLayout();
  if (compact) return <View style={{ height: space.sm }} />;
  return (
    <View
      testID={`sidebar-section-${title.toLowerCase()}`}
      style={{ paddingVertical: space.xs }}
    >
      <ChromeRow>
        {onPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={onPress}
            style={{
              minHeight: dense ? uiSize.mouseAction : uiSize.touchTarget,
              minWidth: uiSize.touchTarget,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Geist",
                fontSize: 11.5,
                lineHeight: 16,
                color: t.dim,
                paddingLeft: space.sm,
                includeFontPadding: false,
              }}
            >
              {title}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={{
              fontFamily: "Geist",
              fontSize: 11.5,
              lineHeight: 16,
              color: t.dim,
              paddingLeft: space.sm,
              includeFontPadding: false,
            }}
          >
            {title}
          </Text>
        )}
        {action}
      </ChromeRow>
    </View>
  );
}
export function SidebarSearch({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  const { dense } = useLayout(),
    { theme: t } = useHerdrTheme();
  return (
    <View
      testID="sidebar-search-region"
      style={{
        paddingHorizontal: uiSize.sidebarContentInset,
        paddingVertical: uiSize.searchGap,
      }}
    >
      <TextInput
        testID="sidebar-search-input"
        autoFocus
        accessibilityLabel="Search spaces and agents"
        placeholder="Search…"
        placeholderTextColor={t.dim}
        value={value}
        onChangeText={onChangeText}
        style={{
          height: dense ? 36 : uiSize.touchTarget,
          paddingHorizontal: space.md,
          paddingVertical: 0,
          borderWidth: 1,
          borderColor: t.input,
          borderRadius: shape.control,
          fontFamily: "Geist",
          fontSize: dense ? 13 : 16,
          lineHeight: 22,
          includeFontPadding: false,
          color: t.foreground,
          backgroundColor: t.chrome,
        }}
      />
    </View>
  );
}
export function NavigationItem({
  icon,
  label,
  onPress,
  selected = false,
  compact = false,
  children,
  trailing,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  selected?: boolean;
  compact?: boolean;
  children?: ReactNode;
  trailing?: ReactNode;
}) {
  const { dense } = useLayout(),
    { theme: t } = useHerdrTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={compact ? "rail-item" : undefined}
      style={({ hovered, pressed }) => ({
        minHeight: compact
          ? dense
            ? uiSize.railButtonMouse
            : uiSize.railButtonTouch
          : dense
            ? 30
            : uiSize.touchTarget,
        width: compact
          ? dense
            ? uiSize.railButtonMouse
            : uiSize.railButtonTouch
          : undefined,
        height: compact
          ? dense
            ? uiSize.railButtonMouse
            : uiSize.railButtonTouch
          : undefined,
        alignSelf: compact ? "center" : undefined,
        paddingHorizontal: compact ? 0 : space.sm,
        gap: space.sm,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: compact ? "center" : "flex-start",
        borderRadius: shape.row,
        backgroundColor: selected
          ? t.selected
          : hovered || pressed
            ? t.hover
            : "transparent",
      })}
    >
      <View
        testID="navigation-icon-slot"
        style={{
          width: uiSize.iconSlot,
          height: uiSize.iconSlot,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </View>
      {!compact ? (
        <>
          <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
          {trailing}
        </>
      ) : trailing ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: 2,
            top: 2,
          }}
        >
          {trailing}
        </View>
      ) : null}
    </Pressable>
  );
}
export function SidebarEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { theme: t } = useHerdrTheme();
  return (
    <View
      style={{
        paddingHorizontal: space.sm,
        paddingTop: space.xs,
        paddingBottom: space.xs,
        gap: space.xs,
      }}
    >
      <Text
        style={{
          fontFamily: "Geist",
          fontSize: 12,
          lineHeight: 18,
          color: t.dim,
          includeFontPadding: false,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: "Geist",
          fontSize: 11,
          lineHeight: 17,
          color: t.dim,
          includeFontPadding: false,
        }}
      >
        {description}
      </Text>
    </View>
  );
}
