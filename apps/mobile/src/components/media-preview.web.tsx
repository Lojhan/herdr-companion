import { useState } from "react";
import { View } from "react-native";
import { Body } from "./ui";
import type { MediaPreviewProps } from "./media-preview.types";
export default function MediaPreview({ media, name }: MediaPreviewProps) {
  const [error, setError] = useState(false);
  const uri = `data:${media.mime};base64,${media.data}`;
  if (error)
    return (
      <Body muted>
        This format cannot be played here. Download the file to open it.
      </Body>
    );
  return (
    <View
      testID="media-preview"
      style={{ flex: 1, minHeight: 240, padding: 12 }}
    >
      {media.kind === "image" ? (
        <img
          alt={name}
          src={uri}
          onError={() => setError(true)}
          style={{
            width: "100%",
            height: "100%",
            maxHeight: "70vh",
            minHeight: 200,
            objectFit: "contain",
          }}
        />
      ) : media.kind === "video" ? (
        <video
          aria-label={name}
          src={uri}
          controls
          playsInline
          preload="metadata"
          onError={() => setError(true)}
          style={{ width: "100%", maxHeight: "70vh", background: "#000" }}
        />
      ) : media.kind === "audio" ? (
        <audio
          aria-label={name}
          src={uri}
          controls
          preload="metadata"
          onError={() => setError(true)}
          style={{ width: "100%" }}
        />
      ) : (
        <iframe
          title={name}
          src={uri}
          sandbox=""
          style={{ width: "100%", height: "70vh", border: 0 }}
        />
      )}
    </View>
  );
}
