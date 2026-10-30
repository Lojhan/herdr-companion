import { createContext } from "react";
import type { Role } from "@companion/contracts";
export interface Profile {
  endpoint: string;
  bridgeId: string;
}
export interface Connection {
  profile: Profile | null;
  ready: boolean;
  role: Role | null;
  request: <T>(path: string, init?: RequestInit) => Promise<T>;
  save: (profile: Profile, token?: string, csrf?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  socket: () => Promise<WebSocket>;
}
// Keep context identity outside the refreshable provider/hooks module. Cached
// Expo Router screens and the provider must share it during Fast Refresh.
export const CoordinatorContext = createContext<Connection | null>(null);
