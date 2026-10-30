import { useCallback, useEffect, useRef } from "react";
import { WebView } from "react-native-webview";
import { fromByteArray } from "base64-js";
import { terminalDocument } from "./terminal-document";
import type { TerminalSurfaceProps } from "./terminal-surface.types";
export default function TerminalSurface({
  onReady,
  onInput,
  onResize,
  register,
  control,
  directInput,
  registerActions,
  theme,
}: TerminalSurfaceProps) {
  const view = useRef<WebView<object>>(null),
    pending = useRef(new Map<number, () => void>()),
    nextId = useRef(1),
    ready = useRef(false);
  const pasteRequests = useRef(
    new Map<
      number,
      { resolve: (value: string) => void; reject: (error: Error) => void }
    >(),
  );
  useEffect(() => {
    const requests = pasteRequests.current;
    registerActions({
      encodePaste: (text) =>
        new Promise((resolve, reject) => {
          if (!ready.current) {
            reject(Error("Terminal renderer is not ready"));
            return;
          }
          const id = nextId.current++;
          const timer = setTimeout(() => {
            requests.delete(id);
            reject(Error("Terminal paste encoding timed out"));
          }, 5000);
          requests.set(id, {
            resolve: (value) => {
              clearTimeout(timer);
              resolve(value);
            },
            reject: (error) => {
              clearTimeout(timer);
              reject(error);
            },
          });
          view.current?.postMessage(
            JSON.stringify({ type: "encodePaste", id, text }),
          );
        }),
      focus: () => view.current?.postMessage(JSON.stringify({ type: "focus" })),
      blur: () => view.current?.postMessage(JSON.stringify({ type: "blur" })),
    });
    return () => {
      registerActions(null);
      for (const request of requests.values())
        request.reject(Error("Terminal renderer changed. Draft kept."));
      requests.clear();
    };
  }, [registerActions]);
  const write = useCallback((bytes: Uint8Array, consumed: () => void) => {
    if (!ready.current) return;
    const id = nextId.current++;
    pending.current.set(id, consumed);
    view.current?.postMessage(
      JSON.stringify({ type: "output", id, data: fromByteArray(bytes) }),
    );
  }, []);
  useEffect(() => {
    register(write);
    const acknowledgements = pending.current;
    return () => {
      register(null);
      acknowledgements.clear();
    };
  }, [register, write]);
  useEffect(() => {
    if (ready.current)
      view.current?.postMessage(
        JSON.stringify({
          type: "control",
          enabled: control,
          direct: directInput,
        }),
      );
    if (control && directInput)
      view.current?.postMessage(JSON.stringify({ type: "focus" }));
  }, [control, directInput]);
  useEffect(() => {
    if (ready.current)
      view.current?.postMessage(JSON.stringify({ type: "theme", theme }));
  }, [theme]);
  return (
    <WebView<object>
      ref={view}
      source={{ html: terminalDocument }}
      originWhitelist={["about:blank"]}
      onShouldStartLoadWithRequest={(request) => request.url === "about:blank"}
      keyboardDisplayRequiresUserAction={false}
      javaScriptEnabled
      setSupportMultipleWindows={false}
      allowFileAccess={false}
      allowUniversalAccessFromFileURLs={false}
      mixedContentMode="never"
      style={{ flex: 1, backgroundColor: theme.background }}
      onMessage={(event) => {
        try {
          const message = JSON.parse(event.nativeEvent.data);
          if (message.type === "ready") {
            ready.current = true;
            view.current?.postMessage(
              JSON.stringify({
                type: "control",
                enabled: control,
                direct: directInput,
              }),
            );
            view.current?.postMessage(JSON.stringify({ type: "theme", theme }));
            onReady();
          } else if (message.type === "pasteEncoded") {
            pasteRequests.current.get(message.id)?.resolve(message.data);
            pasteRequests.current.delete(message.id);
          } else if (
            message.type === "input" &&
            typeof message.data === "string"
          )
            onInput(message.data);
          else if (
            message.type === "resize" &&
            Number.isInteger(message.cols) &&
            Number.isInteger(message.rows)
          )
            onResize(message.cols, message.rows);
          else if (message.type === "consumed") {
            pending.current.get(message.id)?.();
            pending.current.delete(message.id);
          }
        } catch {}
      }}
    />
  );
}
