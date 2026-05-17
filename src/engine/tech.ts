import techData from "../data/tech.json";
import { PlayerState } from "./types";

interface TechDef {
  tier: number;
  cost: number;
  effect: string;
  prereq: string[];
  faction?: string;
  desc: string;
}

export const TECH = techData as Record<string, TechDef>;

export function canResearch(player: PlayerState, key: string): boolean {
  const t = TECH[key];
  if (!t) return false;
  if (player.knownTech.includes(key)) return false;
  if (t.faction && t.faction !== player.faction) return false;
  for (const pre of t.prereq) {
    if (!player.knownTech.includes(pre)) return false;
  }
  return player.resources.tech >= t.cost;
}

export function availableTech(player: PlayerState): string[] {
  return Object.keys(TECH).filter((k) => {
    const t = TECH[k];
    if (player.knownTech.includes(k)) return false;
    if (t.faction && t.faction !== player.faction) return false;
    return t.prereq.every((p) => player.knownTech.includes(p));
  });
}

export function applyTechEffect(player: PlayerState, key: string): void {
  const t = TECH[key];
  if (!t) return;
  switch (t.effect) {
    case "ap+1":
      player.apMax = Math.min(9, player.apMax + 1);
      break;
    // Many effects are situational (read at use-time, not applied here).
    // We persist `knownTech` and let combat/movement/income code check membership.
    default:
      break;
  }
}
