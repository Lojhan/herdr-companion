import { useHotkeys } from "@/lib/hotkeys";
import { encodeShortcut } from "@/lib/hotkey-codec";
import { HotkeyEditor } from "./hotkey-editor";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLayout } from "@/lib/layout";
import { useHerdrTheme } from "@/lib/theme";
import { space, shape, uiSize } from "@/lib/design-tokens";
import {
  pickTerminalImages,
  pasteTerminalContent,
  registerImagePaste,
} from "@/lib/terminal-images";
import { MAX_IMAGES, type TerminalImage } from "@/lib/terminal-images.types";
import { quoteTerminalPath, terminalKeys } from "@/lib/terminal-input";
import { IconButton } from "./ui";
export interface TerminalComposerProps {
  enabled: boolean;
  liveInput: boolean;
  onLiveInput: (value: boolean) => void;
  onKey: (data: string) => void;
  onCommit: (text: string, submit: boolean) => Promise<void>;
  uploadImage: (image: TerminalImage) => Promise<string>;
}
export function TerminalComposer({
  enabled,
  liveInput,
  onLiveInput,
  onKey,
  onCommit,
  uploadImage,
}: TerminalComposerProps) {
  const { theme: t } = useHerdrTheme(),
    { dense } = useLayout();
  const [draft, setDraft] = useState(""),
    [images, setImages] = useState<TerminalImage[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [height, setHeight] = useState(0);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const addImages = useCallback((picked: TerminalImage[]) => {
    setImages((current) => {
      if (current.length + picked.length > MAX_IMAGES) {
        setError("Attach up to four images at a time");
        return current;
      }
      return [...current, ...picked];
    });
  }, []);
  useEffect(
    () => registerImagePaste(input.current, addImages, setError),
    [addImages],
  );
  async function attach() {
    try {
      setError("");
      addImages(await pickTerminalImages());
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function paste() {
    try {
      setError("");
      const content = await pasteTerminalContent();
      addImages(content.images);
      if (content.text) {
        if (liveInput && enabled) await onCommit(content.text, false);
        else setDraft((value) => value + content.text);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function submit() {
    if (!enabled || busy || (!draft.trim() && !images.length)) return;
    setBusy(true);
    setError("");
    try {
      const uploaded: TerminalImage[] = [];
      for (const image of images) {
        const next = {
          ...image,
          path: image.path ?? (await uploadImage(image)),
        };
        uploaded.push(next);
        setImages((current) =>
          current.map((item) => (item.id === next.id ? next : item)),
        );
      }
      const paths = uploaded
        .map((image) => quoteTerminalPath(image.path!))
        .join(" ");
      await onCommit([draft, paths].filter(Boolean).join(" "), true);
      setDraft("");
      setImages([]);
    } catch (e) {
      setError(
        `${(e as Error).message} Draft kept; check the terminal before sending again.`,
      );
    } finally {
      setBusy(false);
    }
  }
  const { keys: customKeys } = useHotkeys();
  const [editingHotkeys, setEditingHotkeys] = useState(false);
  const size = dense ? uiSize.mouseAction : uiSize.touchTarget;
  return (
    <View
      testID="terminal-composer"
      style={{
        flexShrink: 0,
        backgroundColor: t.chrome,
        borderTopWidth: 1,
        borderTopColor: t.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingRight: space.xs,
        }}
      >
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1, minWidth: 0 }}
          contentContainerStyle={{
            padding: space.xs,
            gap: space.xs,
            alignItems: "center",
          }}
        >
          <IconButton
            icon={liveInput ? "terminal" : "file-text"}
            label={
              liveInput ? "Use command composer" : "Use direct terminal input"
            }
            selected={liveInput}
            disabled={!enabled || busy}
            onPress={() => {
              onLiveInput(!liveInput);
              if (liveInput) input.current?.focus();
              else Keyboard.dismiss();
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Paste from clipboard"
            disabled={busy}
            onPress={() => void paste()}
            style={{
              minHeight: size,
              paddingHorizontal: space.sm,
              justifyContent: "center",
              borderRadius: shape.control,
              backgroundColor: t.raised,
            }}
          >
            <Text
              style={{
                fontFamily: "Geist",
                fontSize: 12,
                lineHeight: 18,
                color: t.muted,
              }}
            >
              Paste
            </Text>
          </Pressable>
          {[
            ...terminalKeys,
            ...customKeys.map(
              (k) => [k.label, encodeShortcut(k.shortcut)] as const,
            ),
          ].map(([label, data], index) => (
            <Pressable
              key={`${index}:${label}`}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ disabled: !enabled || busy }}
              disabled={!enabled || busy}
              onPress={() => onKey(data)}
              style={{
                minWidth: size,
                minHeight: size,
                paddingHorizontal: space.sm,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: shape.control,
                backgroundColor: t.raised,
                opacity: enabled ? 1 : 0.4,
              }}
            >
              <Text
                style={{
                  fontFamily: "Geist",
                  fontSize: 12,
                  lineHeight: 18,
                  includeFontPadding: false,
                  color: t.foreground,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
          <IconButton
            icon="chevron-down"
            label="Dismiss keyboard"
            onPress={() => {
              Keyboard.dismiss();
              input.current?.blur();
              onLiveInput(false);
            }}
          />
        </ScrollView>
        <IconButton
          icon="plus"
          label="Manage hotkeys"
          onPress={() => setEditingHotkeys(true)}
        />
      </View>
      {editingHotkeys ? (
        <HotkeyEditor onClose={() => setEditingHotkeys(false)} />
      ) : null}
      {images.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: space.sm,
            paddingTop: space.xs,
            gap: space.sm,
          }}
        >
          {images.map((image) => (
            <View
              key={image.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.xs,
                padding: space.xs,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: shape.control,
              }}
            >
              <Image
                source={{ uri: image.uri }}
                style={{ width: 40, height: 40, borderRadius: 4 }}
                accessibilityLabel={image.name}
              />
              <Text
                numberOfLines={1}
                style={{
                  maxWidth: 120,
                  fontFamily: "Geist",
                  fontSize: 11,
                  color: t.muted,
                }}
              >
                {image.name}
              </Text>
              <IconButton
                icon="x"
                label={`Remove image ${image.name}`}
                disabled={busy}
                onPress={() =>
                  setImages((current) =>
                    current.filter((item) => item.id !== image.id),
                  )
                }
              />
            </View>
          ))}
        </ScrollView>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          padding: space.sm,
          gap: space.sm,
          borderTopWidth: 1,
          borderTopColor: t.border,
        }}
      >
        <TextInput
          ref={input}
          testID="terminal-command-input"
          accessibilityLabel="Terminal command"
          multiline
          editable={!busy}
          placeholder={liveInput ? "Compose a command…" : "Type a command…"}
          placeholderTextColor={t.dim}
          value={draft}
          onChangeText={setDraft}
          autoCapitalize="none"
          autoCorrect={false}
          onContentSizeChange={(e) =>
            setHeight(
              Math.min(
                120,
                Math.max(size, e.nativeEvent.contentSize.height + 2),
              ),
            )
          }
          onKeyPress={(e) => {
            if (
              process.env.EXPO_OS === "web" &&
              e.nativeEvent.key === "Enter" &&
              !(e.nativeEvent as { shiftKey?: boolean }).shiftKey
            ) {
              e.preventDefault();
              void submit();
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: size,
            height: height || size,
            maxHeight: 120,
            paddingHorizontal: space.md,
            paddingVertical: dense ? 4 : 11,
            borderRadius: shape.control,
            borderWidth: 1,
            borderColor: t.input,
            backgroundColor: t.raised,
            fontFamily: "Geist",
            fontSize: dense ? 13 : 16,
            lineHeight: dense ? 18 : 20,
            includeFontPadding: false,
            color: t.foreground,
            textAlignVertical: "top",
          }}
        />
        <IconButton
          icon="image-plus"
          label="Attach images"
          disabled={busy}
          onPress={() => void attach()}
        />
        <IconButton
          icon="arrow-up"
          label={busy ? "Sending command" : "Send command"}
          selected={enabled && !!(draft.trim() || images.length)}
          disabled={!enabled || busy || (!draft.trim() && !images.length)}
          onPress={() => void submit()}
        />
      </View>
      {error ? (
        <Text
          accessibilityRole="alert"
          style={{
            paddingHorizontal: space.md,
            paddingBottom: space.sm,
            fontFamily: "Geist",
            fontSize: 11,
            lineHeight: 17,
            color: t.blocked,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
