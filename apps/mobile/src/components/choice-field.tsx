import { useLayout } from "@/lib/layout";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useHerdrTheme } from "@/lib/theme";
import { space, shape, uiSize, formSize } from "@/lib/design-tokens";
import { Icon } from "./icons";
import { Label } from "./ui";
export function ChoiceField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { dense } = useLayout();
  const { theme: t } = useHerdrTheme(),
    [open, setOpen] = useState(false);
  return (
    <View style={{ gap: space.sm }}>
      <Label>{label}</Label>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${label.toLowerCase()}`}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => setOpen(!open)}
        style={{
          minHeight: dense ? formSize.input : uiSize.touchTarget,
          paddingHorizontal: space.md,
          borderWidth: 1,
          borderColor: t.input,
          borderRadius: shape.control,
          backgroundColor: t.raised,
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: "Geist",
            fontSize: dense ? formSize.body : 16,
            color: t.foreground,
          }}
        >
          {options.find((o) => o.value === value)?.label ??
            `Choose ${label.toLowerCase()}…`}
        </Text>
        <Icon name="chevron-down" size={uiSize.icon} color={t.muted} />
      </Pressable>
      {open ? (
        <ScrollView
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          style={{
            maxHeight: 180,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: shape.control,
          }}
        >
          {options.map((o) => (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              accessibilityLabel={`Select ${label.toLowerCase()} ${o.label}`}
              accessibilityState={{ selected: o.value === value }}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={({ hovered }) => ({
                minHeight: dense ? formSize.input : uiSize.touchTarget,
                paddingHorizontal: space.md,
                flexDirection: "row",
                gap: space.sm,
                alignItems: "center",
                backgroundColor:
                  o.value === value
                    ? t.selected
                    : hovered
                      ? t.hover
                      : "transparent",
              })}
            >
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontFamily: "Geist",
                  fontSize: 13,
                  color: t.foreground,
                }}
              >
                {o.label}
              </Text>
              {o.value === value ? (
                <Icon name="check" size={uiSize.icon} color={t.muted} />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
