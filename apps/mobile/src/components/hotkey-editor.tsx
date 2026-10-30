import { useState } from "react";
import { View, Text } from "react-native";
import { useHotkeys } from "@/lib/hotkeys";
import { encodeShortcut } from "@/lib/hotkey-codec";
import { useHerdrTheme } from "@/lib/theme";
import { FormDialog } from "./form-dialog";
import { Body, Button, Field, IconButton, Notice } from "./ui";
export function HotkeyEditor({ onClose }: { onClose: () => void }) {
  const { keys, save, ready, error: loadError } = useHotkeys(),
    { theme: t } = useHerdrTheme();
  const [editing, setEditing] = useState<string | null>(null),
    [label, setLabel] = useState(""),
    [shortcut, setShortcut] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function commit() {
    try {
      setError("");
      encodeShortcut(shortcut);
      setBusy(true);
      const item = {
        id: editing ?? Date.now().toString(36),
        label: label.trim(),
        shortcut: shortcut.trim(),
      };
      await save(
        editing
          ? keys.map((k) => (k.id === editing ? item : k))
          : [...keys, item],
      );
      setEditing(null);
      setLabel("");
      setShortcut("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    try {
      await save(keys.filter((k) => k.id !== id));
      if (editing === id) {
        setEditing(null);
        setLabel("");
        setShortcut("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <FormDialog title="Custom hotkeys" onClose={onClose} busy={busy}>
      <Body muted>
        {process.env.EXPO_OS === "web"
          ? "Saved for this browser tab’s session, including reloads."
          : "Saved on this device across app restarts."}{" "}
        Hotkeys send input only when you tap them while controlling a terminal.
      </Body>
      {keys.map((k) => (
        <View
          key={k.id}
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ fontFamily: "Geist", fontSize: 13, color: t.foreground }}
            >
              {k.label}
            </Text>
            <Body muted>{k.shortcut}</Body>
          </View>
          <IconButton
            icon="settings"
            label={`Edit hotkey ${k.label}`}
            disabled={busy}
            onPress={() => {
              setEditing(k.id);
              setLabel(k.label);
              setShortcut(k.shortcut);
              setError("");
            }}
          />
          <IconButton
            icon="x"
            label={`Delete hotkey ${k.label}`}
            disabled={busy}
            onPress={() => void remove(k.id)}
          />
        </View>
      ))}
      <Field
        label="Hotkey label"
        value={label}
        onChangeText={setLabel}
        maxLength={20}
        placeholder="Split pane"
      />
      <Field
        label="Shortcut"
        value={shortcut}
        onChangeText={setShortcut}
        maxLength={64}
        placeholder="Ctrl+B, %"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Body muted>
        Use Ctrl, Alt or Shift with letters, arrows, F1–F12 or named keys such
        as Enter, Tab, Home and PageUp. Separate a sequence with commas: Ctrl+B,
        %.
      </Body>
      {error || loadError ? <Notice error>{error || loadError}</Notice> : null}
      <Button
        disabled={!ready || busy || !label.trim() || !shortcut.trim()}
        icon="plus"
        onPress={() => void commit()}
      >
        {editing ? "Save hotkey" : "Add hotkey"}
      </Button>
      {editing ? (
        <Button
          secondary
          onPress={() => {
            setEditing(null);
            setLabel("");
            setShortcut("");
          }}
        >
          Cancel edit
        </Button>
      ) : null}
    </FormDialog>
  );
}
