import { PlayerState, DiploState, MatchState } from "./types";

export interface DiploAction {
  key: string;
  label: string;
  cost: number; // Influence
  requires?: DiploState[];
  forbids?: DiploState[];
}

export const DIPLO_ACTIONS: DiploAction[] = [
  { key: "truce",    label: "Propose Truce",    cost: 5 },
  { key: "peace",    label: "Propose Peace",    cost: 10, requires: ["war", "truce"] },
  { key: "alliance", label: "Propose Alliance", cost: 20, requires: ["peace"] },
  { key: "trade",    label: "Trade Resources",  cost: 0 },
  { key: "tradeTech",label: "Trade Tech",       cost: 10 },
  { key: "tribute",  label: "Demand Tribute",   cost: 8 },
  { key: "declareWar",label: "Declare War",     cost: 0, forbids: ["truce"] },
  { key: "vassal",   label: "Propose Vassalage",cost: 15 },
];

export function setDiplo(
  a: PlayerState,
  b: PlayerState,
  state: DiploState
): void {
  a.diplomacy[b.id] = state;
  b.diplomacy[a.id] = state;
}

export function getDiplo(a: PlayerState, b: PlayerState): DiploState {
  return a.diplomacy[b.id] ?? "war";
}

export function adjustTrust(a: PlayerState, b: PlayerState, delta: number): void {
  a.trust[b.id] = Math.max(-100, Math.min(100, (a.trust[b.id] ?? 0) + delta));
}

export function isAttackable(a: PlayerState, b: PlayerState): boolean {
  const s = getDiplo(a, b);
  return s === "war" || s === "traitor";
}

// Called when a player attacks an allied/peace/truce unit.
export function markBetrayal(
  match: MatchState,
  betrayer: PlayerState,
  victim: PlayerState
): void {
  setDiplo(betrayer, victim, "traitor");
  for (const p of match.players) {
    if (p.id === betrayer.id) continue;
    adjustTrust(p, betrayer, -50);
  }
  betrayer.resources.influence = 0;
  match.log.push(`${betrayer.name} betrayed ${victim.name}!`);
}

// AI decision helpers (see §9.5).
export function aiShouldPropose(
  ai: PlayerState,
  target: PlayerState,
  action: "alliance" | "peace" | "war"
): boolean {
  const trust = ai.trust[target.id] ?? 0;
  switch (action) {
    case "alliance":
      return trust > 40;
    case "peace":
      return trust > 10;
    case "war":
      return trust < -30;
  }
}
