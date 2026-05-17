import { MMKV } from "react-native-mmkv";
import { MatchState } from "@engine/types";

// MMKV may fail to init in pure-web/test contexts; fall back to in-memory map.
let _storage: MMKV | { getString: (k: string) => string | undefined; set: (k: string, v: string) => void; delete: (k: string) => void };
try {
  _storage = new MMKV({ id: "tb-game" });
} catch {
  const mem = new Map<string, string>();
  _storage = {
    getString: (k) => mem.get(k),
    set: (k, v) => { mem.set(k, v); },
    delete: (k) => { mem.delete(k); },
  };
}
export const storage = _storage;

const MATCH_KEY = "tb-game-active-match-v1";

export function saveMatch(m: MatchState): void {
  storage.set(MATCH_KEY, JSON.stringify(m));
}

export function loadMatch(): MatchState | null {
  const s = storage.getString(MATCH_KEY);
  if (!s) return null;
  try {
    return JSON.parse(s) as MatchState;
  } catch {
    return null;
  }
}

export function clearMatch(): void {
  storage.delete(MATCH_KEY);
}
