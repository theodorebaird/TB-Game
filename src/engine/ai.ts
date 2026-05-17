import { MatchState, PlayerState, Unit } from "./types";
import { reachableHexes, attackableHexes } from "./pathfinding";
import { moveUnit, attackUnit, foundCityAction, queueProduction, startResearch, endTurn } from "./match";
import { hexDistance } from "./hex";
import { FACTIONS } from "./factions";
import { availableTech } from "./tech";

export type Difficulty = "scout" | "marauder" | "warlord";

interface Action {
  utility: number;
  exec: () => void;
}

// Take one AI turn (entire turn: act until AP depleted, then end turn).
export function runAITurn(m: MatchState, p: PlayerState, difficulty: Difficulty = "marauder"): void {
  if (p.eliminated) {
    endTurn(m);
    return;
  }
  let safety = 30;
  while (p.ap > 0 && safety-- > 0) {
    const action = pickBestAction(m, p, difficulty);
    if (!action) break;
    action.exec();
  }
  endTurn(m);
}

function pickBestAction(m: MatchState, p: PlayerState, diff: Difficulty): Action | null {
  const actions: Action[] = [];
  const weights = FACTIONS[p.faction].aiWeights;

  // For each unit owned: consider attack / move / found
  for (const u of Object.values(m.units)) {
    if (u.owner !== p.id || u.ap <= 0) continue;
    const targets = attackableHexes(u, m.units);
    for (const t of targets) {
      const enemy = Object.values(m.units).find(
        (x) => x.hex.q === t.q && x.hex.r === t.r
      );
      if (!enemy) continue;
      const enemyOwner = m.players.find((pl) => pl.id === enemy.owner);
      if (!enemyOwner) continue;
      const isHostile = (p.diplomacy[enemyOwner.id] ?? "war") === "war";
      if (!isHostile) continue;
      const u_atk = (enemy.hpMax - enemy.hp) / Math.max(1, enemy.hpMax) * 30 + u.atk * 5 + 20;
      actions.push({
        utility: u_atk * weights.military,
        exec: () => attackUnit(m, u.id, t),
      });
    }
    // Move toward nearest enemy city
    const targetCity = Object.values(m.cities).find((c) => c.owner !== p.id);
    const reach = reachableHexes(u, m.tiles, m.width, m.height, m.units);
    if (targetCity && reach.length > 0) {
      let best = reach[0];
      let bestDist = hexDistance(best, targetCity.hex);
      for (const r of reach) {
        const d = hexDistance(r, targetCity.hex);
        if (d < bestDist) {
          best = r;
          bestDist = d;
        }
      }
      actions.push({
        utility: (20 - bestDist) * weights.military,
        exec: () => moveUnit(m, u.id, best),
      });
    } else if (reach.length > 0) {
      // wander
      const r = reach[Math.floor(Math.random() * reach.length)];
      actions.push({
        utility: 5 * weights.expand,
        exec: () => moveUnit(m, u.id, r),
      });
    }
    // Worker founds city
    if (u.abilities.includes("foundCity") || u.abilities.includes("foundCamp")) {
      actions.push({
        utility: 60 * weights.expand,
        exec: () => foundCityAction(m, u.id),
      });
    }
  }

  // For each city: queue production
  for (const c of Object.values(m.cities)) {
    if (c.owner !== p.id) continue;
    if (c.productionQueue.length > 0) continue;
    const def = FACTIONS[p.faction];
    actions.push({
      utility: 40 * weights.military,
      exec: () => queueProduction(m, c.id, "unit", def.startingUnit),
    });
  }

  // Research
  if (!p.queuedResearch) {
    const avail = availableTech(p);
    if (avail.length > 0 && p.resources.tech >= 5) {
      const pick = avail[Math.floor(Math.random() * avail.length)];
      actions.push({
        utility: 25 * weights.tech,
        exec: () => startResearch(m, p.id, pick),
      });
    }
  }

  if (actions.length === 0) return null;
  actions.sort((a, b) => b.utility - a.utility);
  // Difficulty cap on Scout
  if (diff === "scout") {
    actions[0].utility = Math.min(actions[0].utility, 60);
  }
  return actions[0];
}
