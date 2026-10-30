import Database from "better-sqlite3";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  chmodSync,
} from "node:fs";
import { join } from "node:path";
import {
  createHash,
  randomBytes,
  randomUUID,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import type { Role } from "@companion/contracts";
export const secret = () => randomBytes(32).toString("base64url");
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export interface Device {
  id: string;
  name: string;
  role: Role;
  revoked_at: number | null;
}
export class Store {
  readonly db: Database.Database;
  readonly bridgeId: string;
  private key: Buffer;
  constructor(directory: string) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    chmodSync(directory, 0o700);
    const keyPath = join(directory, "master.key");
    if (!existsSync(keyPath))
      writeFileSync(keyPath, randomBytes(32), { mode: 0o600, flag: "wx" });
    this.key = readFileSync(keyPath);
    this.db = new Database(join(directory, "companion.sqlite"));
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("busy_timeout = 5000");
    this.db.exec(
      readFileSync(
        new URL("../migrations/001-pairing.sql", import.meta.url),
        "utf8",
      ),
    );
    this.db
      .prepare("INSERT OR IGNORE INTO settings VALUES (?,?)")
      .run("bridge_id", randomUUID());
    this.bridgeId = (
      this.db
        .prepare("SELECT value FROM settings WHERE key=?")
        .get("bridge_id") as { value: string }
    ).value;
  }
  private seal(value: string): string {
    const iv = randomBytes(12),
      cipher = createCipheriv("aes-256-gcm", this.key, iv);
    return Buffer.concat([
      iv,
      cipher.update(value),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString("base64");
  }
  private unseal(value: string): string {
    const data = Buffer.from(value, "base64"),
      cipher = createDecipheriv("aes-256-gcm", this.key, data.subarray(0, 12));
    cipher.setAuthTag(data.subarray(-16));
    return Buffer.concat([
      cipher.update(data.subarray(12, -16)),
      cipher.final(),
    ]).toString();
  }
  createPairing() {
    const id = randomUUID(),
      token = secret(),
      expiresAt = Date.now() + 120000;
    this.db
      .prepare("INSERT INTO pairings(id,secret_hash,expires_at) VALUES (?,?,?)")
      .run(id, hash(token), expiresAt);
    return { id, secret: token, expiresAt, bridgeId: this.bridgeId };
  }
  claim(token: string, name: string, platform: string) {
    return this.db.transaction(() => {
      const pairing = this.db
        .prepare(
          "SELECT id FROM pairings WHERE secret_hash=? AND claimed_at IS NULL AND expires_at>?",
        )
        .get(hash(token), Date.now()) as { id: string } | undefined;
      if (!pairing) throw Error("Pairing expired or already claimed");
      const claimSecret = secret();
      this.db
        .prepare(
          "UPDATE pairings SET claimed_at=?,claim_hash=?,device_name=?,platform=? WHERE id=?",
        )
        .run(Date.now(), hash(claimSecret), name, platform, pairing.id);
      return { id: pairing.id, claimSecret };
    })();
  }
  pending() {
    return this.db
      .prepare(
        "SELECT id,device_name,expires_at FROM pairings WHERE claimed_at IS NOT NULL AND approved_at IS NULL AND expires_at>?",
      )
      .all(Date.now());
  }
  approve(id: string, role: Role) {
    return this.db.transaction(() => {
      const pair = this.db
        .prepare(
          "SELECT * FROM pairings WHERE id=? AND claimed_at IS NOT NULL AND approved_at IS NULL AND expires_at>?",
        )
        .get(id, Date.now()) as any;
      if (!pair) throw Error("No pending unexpired claim");
      const deviceId = randomUUID(),
        token = secret();
      this.db
        .prepare(
          "INSERT INTO devices(id,name,token_hash,role,created_at) VALUES (?,?,?,?,?)",
        )
        .run(deviceId, pair.device_name, hash(token), role, Date.now());
      this.db
        .prepare(
          "UPDATE pairings SET approved_at=?,device_id=?,sealed_token=? WHERE id=?",
        )
        .run(Date.now(), deviceId, this.seal(token), id);
      return deviceId;
    })();
  }
  poll(id: string, claimSecret: string) {
    return this.db.transaction(() => {
      const pair = this.db
        .prepare(
          "SELECT * FROM pairings WHERE id=? AND claim_hash=? AND expires_at>? AND delivered_at IS NULL",
        )
        .get(id, hash(claimSecret), Date.now()) as any;
      if (!pair) throw Error("Claim expired or credential already delivered");
      if (!pair.approved_at) return { state: "pending" as const };
      this.db
        .prepare(
          "UPDATE pairings SET delivered_at=?,sealed_token=NULL WHERE id=?",
        )
        .run(Date.now(), id);
      return {
        state: "approved" as const,
        token: this.unseal(pair.sealed_token),
        platform: pair.platform as string,
        deviceId: pair.device_id as string,
      };
    })();
  }
  authenticate(token: string): Device | undefined {
    return this.db
      .prepare(
        "SELECT id,name,role,revoked_at FROM devices WHERE token_hash=? AND revoked_at IS NULL",
      )
      .get(hash(token)) as Device | undefined;
  }
  createSession(deviceId: string) {
    const token = secret(),
      csrf = secret();
    this.db
      .prepare("INSERT INTO sessions VALUES (?,?,?,?)")
      .run(hash(token), deviceId, csrf, Date.now() + 12 * 3600000);
    return { token, csrf };
  }
  session(token: string): { device: Device; csrf: string } | undefined {
    const row = this.db
      .prepare(
        "SELECT d.id,d.name,d.role,d.revoked_at,s.csrf FROM sessions s JOIN devices d ON d.id=s.device_id WHERE s.id_hash=? AND s.expires_at>? AND d.revoked_at IS NULL",
      )
      .get(hash(token), Date.now()) as (Device & { csrf: string }) | undefined;
    return row ? { device: row, csrf: row.csrf } : undefined;
  }
  revoke(id: string) {
    this.db
      .prepare("UPDATE devices SET revoked_at=? WHERE id=?")
      .run(Date.now(), id);
    this.db.prepare("DELETE FROM sessions WHERE device_id=?").run(id);
  }
  close() {
    this.db.close();
  }
}
