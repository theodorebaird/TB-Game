import { MatchState } from "@engine/types";

const MATCH_KEY = "tb-game-active-match-v1";

export function saveMatch(m: MatchState): void {
  try {
    localStorage.setItem(MATCH_KEY, JSON.stringify(m));
  } catch {}
}

export function loadMatch(): MatchState | null {
  try {
    const s = localStorage.getItem(MATCH_KEY);
    if (!s) return null;
    return JSON.parse(s) as MatchState;
  } catch {
    return null;
  }
}

export function clearMatch(): void {
  try {
    localStorage.removeItem(MATCH_KEY);
  } catch {}
}

export const storage = {
  getString: (k: string): string | undefined => {
    try { return localStorage.getItem(k) ?? undefined; } catch { return undefined; }
  },
  set: (k: string, v: string): void => {
    try { localStorage.setItem(k, v); } catch {}
  },
  delete: (k: string): void => {
    try { localStorage.removeItem(k); } catch {}
  },
};
