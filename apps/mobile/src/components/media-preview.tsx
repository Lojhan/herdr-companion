import { Image } from "expo-image";
import { WebView } from "react-native-webview";
import { View } from "react-native";
import type { MediaPreviewProps } from "./media-preview.types";
export default function MediaPreview({ media, name }: MediaPreviewProps) {
  const uri = `data:${media.mime};base64,${media.data}`;
  if (media.kind === "image")
    return (
      <View
        testID="media-preview"
        style={{ flex: 1, minHeight: 240, padding: 12 }}
      >
        <Image
          source={{ uri }}
          contentFit="contain"
          accessibilityLabel={name}
          style={{ flex: 1, minHeight: 240 }}
        />
      </View>
    );
  const tag = media.kind === "audio" ? "audio" : "video";
  const html = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';media-src data:;style-src 'unsafe-inline'"><style>html,body{margin:0;background:#17191d;height:100%;display:grid;place-items:center}video,audio{max-width:100%;max-height:100%;width:100%}</style><${tag} controls playsinline preload="metadata" src="${uri}"></${tag}>`;
  return (
    <WebView
      testID="media-preview"
      source={media.kind === "pdf" ? { uri } : { html }}
      javaScriptEnabled={false}
      originWhitelist={["about:blank", "data:*"]}
      onShouldStartLoadWithRequest={(request) =>
        request.url === "about:blank" || request.url.startsWith("data:")
      }
      allowFileAccess={false}
      allowsInlineMediaPlayback
      style={{ flex: 1, minHeight: 240 }}
    />
  );
}
