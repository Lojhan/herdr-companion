import { FormStyleContext } from "@/lib/form-style";
import { use, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { useLayout } from "@/lib/layout";
import { space, shape, uiSize, formSize } from "@/lib/design-tokens";
import { useHerdrTheme } from "@/lib/theme";
export function useWide() {
  return useLayout().split;
}
export function Page({ children }: { children: ReactNode }) {
  const { theme: t } = useHerdrTheme();
  const { split } = useLayout();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{
        padding: split ? space.xl : space.lg,
        paddingBottom: space.xxl + space.lg,
        gap: space.xl,
        width: "100%",
        maxWidth: 760,
        alignSelf: "center",
      }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
export function Label({ children }: { children: ReactNode }) {
  const form = use(FormStyleContext);
  const { theme: t } = useHerdrTheme();
  return (
    <Text
      style={{
        fontFamily: "Geist",
        fontSize: form ? formSize.label : 12,
        fontWeight: "500",
        color: form ? t.dim : t.muted,
      }}
    >
      {children}
    </Text>
  );
}
export function Heading({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "center";
}) {
  const { theme: t } = useHerdrTheme();
  return (
    <Text
      style={{
        fontFamily: "Geist",
        fontSize: 20,
        textAlign: align,
        fontWeight: "600",
        color: t.foreground,
      }}
    >
      {children}
    </Text>
  );
}
export function Body({
  children,
  muted = false,
  align = "left",
}: {
  children: ReactNode;
  muted?: boolean;
  align?: "left" | "center";
}) {
  const form = use(FormStyleContext);
  const { theme: t } = useHerdrTheme();
  return (
    <Text
      selectable
      style={{
        fontFamily: "Geist",
        fontSize: form ? formSize.body : 13,
        textAlign: align,
        lineHeight: form ? formSize.bodyLine : 20,
        color: muted ? t.muted : t.foreground,
      }}
    >
      {children}
    </Text>
  );
}
export function Section({ children }: { children: ReactNode }) {
  const { theme: t } = useHerdrTheme();
  const { split } = useLayout();
  return (
    <View
      testID="content-section"
      style={{
        borderWidth: split ? 1 : 0,
        borderBottomWidth: 1,
        borderColor: t.border,
        borderRadius: split ? shape.panel : 0,
        padding: split ? space.lg : 0,
        paddingBottom: split ? space.lg : space.xl,
        gap: space.md,
        backgroundColor: split ? t.background : "transparent",
      }}
    >
      {children}
    </View>
  );
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  icon,
  align = "start",
}: {
  children: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
  align?: "start" | "center" | "stretch";
}) {
  const form = use(FormStyleContext);
  const { theme: t } = useHerdrTheme(),
    { dense } = useLayout();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }) => ({
        minHeight: dense ? formSize.button : 44,
        minWidth: 44,
        maxWidth: "100%",
        flexShrink: 1,
        backgroundColor: secondary ? (hovered ? t.hover : t.raised) : t.solid,
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        paddingHorizontal: form ? 14 : 12,
        paddingVertical: 7,
        borderRadius: form ? 8 : 6,
        borderWidth: 1,
        borderColor: secondary ? t.border : "transparent",
        flexDirection: "row",
        gap: 7,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: align === "start" ? "flex-start" : align,
      })}
    >
      {icon ? (
        <Icon
          name={icon}
          size={16}
          color={secondary ? t.foreground : t.solidForeground}
        />
      ) : null}
      <Text
        style={{
          fontFamily: "Geist",
          fontSize: dense ? (form ? 12.5 : 12.8) : 14,
          lineHeight: 18,
          includeFontPadding: false,
          textAlign: "center",
          flexShrink: 1,
          fontWeight: "500",
          color: secondary ? t.foreground : t.solidForeground,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  icon,
  label,
  onPress,
  selected = false,
  disabled = false,
  size,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: number;
}) {
  const { theme: t } = useHerdrTheme(),
    { dense } = useLayout();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ hovered, pressed }) => ({
        width: size ?? (dense ? uiSize.mouseAction : uiSize.touchTarget),
        height: size ?? (dense ? uiSize.mouseAction : uiSize.touchTarget),
        borderRadius: 6,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: selected
          ? t.selected
          : hovered || pressed
            ? t.hover
            : "transparent",
        opacity: disabled ? 0.35 : 1,
      })}
    >
      <Icon
        name={icon}
        size={uiSize.icon}
        color={selected ? t.foreground : t.muted}
      />
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const form = use(FormStyleContext);
  const { theme: t } = useHerdrTheme();
  const { dense } = useLayout();
  return (
    <View style={{ gap: 7 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        testID={`field-${label.toLowerCase().replaceAll(" ", "-")}`}
        placeholderTextColor={t.dim}
        autoCapitalize="none"
        style={{
          fontFamily: "Geist",
          borderWidth: 1,
          borderColor: t.input,
          paddingHorizontal: form ? 10 : 11,
          paddingVertical: form && dense ? 7 : 11,
          borderRadius: form ? 9 : 6,
          backgroundColor: t.chrome,
          minHeight: form && dense ? formSize.input : 44,
          color: t.foreground,
          fontSize: dense ? (form ? 12.8 : 14) : 16,
          lineHeight: form && dense ? 20 : 22,
          textAlignVertical: props.multiline ? "top" : "center",
          includeFontPadding: false,
        }}
        {...props}
      />
    </View>
  );
}
export function Empty({
  icon,
  title,
  description,
  children,
  align = "start",
}: {
  icon: IconName;
  title: string;
  description: string;
  children?: ReactNode;
  align?: "start" | "center";
}) {
  const { theme: t } = useHerdrTheme();
  const centered = align === "center";
  return (
    <View
      testID="empty-state"
      style={{
        paddingVertical: space.xl,
        gap: space.md,
        alignItems: centered ? "center" : "flex-start",
        maxWidth: 440,
        width: "100%",
      }}
    >
      <Icon name={icon} color={t.dim} size={28} />
      <Heading align={centered ? "center" : "left"}>{title}</Heading>
      <View style={{ maxWidth: 440 }}>
        <Body muted align={centered ? "center" : "left"}>
          {description}
        </Body>
      </View>
      {children ? (
        <View
          testID="empty-actions"
          style={{
            alignSelf: centered ? "center" : "flex-start",
            maxWidth: "100%",
            gap: space.md,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  const { theme: t } = useHerdrTheme();
  return (
    <View
      accessibilityRole={error ? "alert" : undefined}
      style={{
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: error ? t.blocked + "55" : t.border,
        backgroundColor: error ? t.blocked + "0c" : t.hover,
      }}
    >
      <Text
        selectable
        style={{
          fontFamily: "Geist",
          fontSize: 12,
          lineHeight: 19,
          color: error ? t.blocked : t.muted,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export function Loading() {
  const { theme: t } = useHerdrTheme();
  return (
    <ActivityIndicator
      color={t.accent}
      accessibilityLabel="Loading coordinator"
    />
  );
}
