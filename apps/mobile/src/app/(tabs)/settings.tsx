import { useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import {
  useCoordinator,
  useInventory,
  validateEndpoint,
} from "@/lib/coordinator";
import {
  Page,
  Heading,
  Body,
  Label,
  Section,
  Button,
  Field,
  Notice,
} from "@/components/ui";
import { useHerdrTheme, type ThemeName } from "@/lib/theme";
import { WorkspaceToolbar } from "@/components/workspace-toolbar";
export default function Settings() {
  const { theme: t, setTheme } = useHerdrTheme();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { profile, save, disconnect } = useCoordinator();
  const { data: inventory } = useInventory();
  const [details, setDetails] = useState(""),
    [name, setName] = useState("My companion"),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      controller.current?.abort();
    },
    [],
  );
  async function pair() {
    setError("");
    setBusy(true);
    try {
      const data = JSON.parse(details) as {
        endpoint: string;
        bridgeId: string;
        secret: string;
      };
      const endpoint = validateEndpoint(data.endpoint);
      if (!data.bridgeId || !data.secret)
        throw Error("Paste the full JSON printed by companion pair");
      controller.current = new AbortController();
      const response = await fetch(`${endpoint}/v1/pairing/claim`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: data.secret,
          bridgeId: data.bridgeId,
          deviceName: name,
          platform: Platform.OS === "web" ? "web" : "native",
        }),
        signal: controller.current.signal,
      });
      const claim = await response.json();
      if (!response.ok) throw Error(claim.message ?? "Pairing failed");
      setDetails("");
      setStatus(
        `Waiting for local approval. Run companion approve ${claim.id} on your coordinator.`,
      );
      const deadline = Date.now() + 120000;
      const poll = async () => {
        try {
          if (Date.now() > deadline)
            throw Error("Pairing expired. Create a new pairing.");
          const reply = await fetch(
            `${endpoint}/v1/pairing/claims/${claim.id}`,
            {
              credentials: "include",
              headers: { Authorization: `Bearer ${claim.claimSecret}` },
              signal: controller.current!.signal,
            },
          );
          const result = await reply.json();
          if (!reply.ok) throw Error(result.message ?? "Approval failed");
          if (result.state === "approved") {
            await save(
              { endpoint, bridgeId: data.bridgeId },
              result.token,
              result.csrf,
            );
            setStatus("Device paired. Your inventory is ready.");
            setBusy(false);
          } else timer.current = setTimeout(() => void poll(), 1500);
        } catch (e) {
          if ((e as Error).name !== "AbortError")
            setError((e as Error).message);
          setBusy(false);
        }
      };
      void poll();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <View style={{ flex: 1 }}>
      <WorkspaceToolbar title="Settings" />
      <Page>
        <Heading>Settings</Heading>
        <Section>
          <Label>Appearance</Label>
          <Body muted>
            Herdr themes, shared across the workspace and terminal.
          </Body>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {(["graphite", "ink", "moss", "paper"] as ThemeName[]).map(
              (name) => (
                <Button
                  key={name}
                  secondary={t.name !== name}
                  onPress={() => setTheme(name)}
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Button>
              ),
            )}
          </View>
        </Section>
        {profile ? (
          <Section>
            <Label>Coordinator</Label>
            <Text
              selectable
              style={{
                fontFamily: "Geist",
                fontSize: 14,
                fontWeight: "500",
                color: t.foreground,
              }}
            >
              {profile.endpoint}
            </Text>
            <Body muted>{profile.bridgeId}</Body>
            <Button secondary onPress={() => void disconnect()} icon="log-out">
              Disconnect this device
            </Button>
            <Body muted>
              Disconnect signs out here. Revoke the device on the coordinator to
              invalidate its credential.
            </Body>
          </Section>
        ) : (
          <Section>
            <Label>Connect a coordinator</Label>
            <Body>
              On your coordinator, run companion pair with its HTTPS endpoint.
              Paste the pairing JSON below, then approve this device locally.
            </Body>
            <Field
              label="Device name"
              value={name}
              onChangeText={setName}
              maxLength={80}
              autoCapitalize="sentences"
            />
            <Field
              label="Pairing details"
              value={details}
              onChangeText={setDetails}
              placeholder={
                '{"endpoint":"https://…","bridgeId":"…","secret":"…"}'
              }
              multiline
              numberOfLines={5}
              autoCorrect={false}
              secureTextEntry={false}
            />
            <Button
              onPress={() => void pair()}
              disabled={busy || !details.trim() || !name.trim()}
              icon="link"
            >
              {busy ? "Waiting for approval…" : "Pair this device"}
            </Button>
          </Section>
        )}
        {showDiagnostics
          ? inventory?.warnings?.map((warning) => (
              <Notice key={warning}>{warning}</Notice>
            ))
          : null}
        {status ? <Notice>{status}</Notice> : null}
        {error ? <Notice error>{error}</Notice> : null}
        <Button secondary onPress={() => setShowDiagnostics((value) => !value)}>
          {showDiagnostics
            ? "Hide compatibility details"
            : "Show compatibility details"}
        </Button>
        <Section>
          <Label>Herdr Companion · 0.1.0</Label>
          <Body>Core 0.1.14 · protocol generation 1</Body>
          <Body muted>
            An independent client for Herdr. Task workflows, desktop layout
            writes, push, transcripts and safe cleanup are still in progress.
          </Body>
        </Section>
        <View style={{ gap: 8 }}>
          <Label>Privacy</Label>
          <Body muted>
            No application account. No relay. Credentials stay in native secure
            storage or a browser HTTP-only session.
          </Body>
        </View>
      </Page>
    </View>
  );
}
