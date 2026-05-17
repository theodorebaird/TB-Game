import buildingsData from "../data/buildings.json";
import { City, Hex, MatchState, Resources } from "./types";
import { hexesInRange } from "./hex";
import { tileAt } from "./map";

interface BuildingDef {
  tier: number;
  cost: Record<string, number>;
  effect?: Record<string, any>;
  unlocks?: string[];
  buildTurns: number;
  requiresFeature?: string;
  factionLock?: string[];
  factionPreferred?: string;
  builtBy?: string;
}

export const BUILDINGS = buildingsData as Record<string, BuildingDef>;

let _cid = 1;
export function nextCityId(): string {
  return `c${_cid++}`;
}

export function foundCity(
  owner: string,
  hex: Hex,
  isCapital: boolean
): City {
  return {
    id: nextCityId(),
    owner,
    hex,
    pop: 1,
    hp: 5,
    hpMax: 5,
    buildings: [],
    productionQueue: [],
    isCapital,
    borderRadius: 1,
  };
}

// Compute income for one player from all their cities & territory.
export function computeIncome(match: MatchState, playerId: string): Resources {
  const r: Resources = { scrap: 0, food: 0, power: 0, tech: 1, influence: 1 };
  for (const city of Object.values(match.cities)) {
    if (city.owner !== playerId) continue;
    // Base per-pop yield: each pop = 1 of mixed resources.
    r.scrap += city.pop;
    r.food += city.pop;
    // Buildings
    for (const bKey of city.buildings) {
      const b = BUILDINGS[bKey];
      if (!b?.effect) continue;
      if (b.effect.scrap) r.scrap += b.effect.scrap;
      if (b.effect.food) r.food += b.effect.food;
      if (b.effect.power) r.power += b.effect.power;
      if (b.effect.tech) r.tech += b.effect.tech;
      if (b.effect.influence) r.influence += b.effect.influence;
    }
    // Tile yields in border radius
    for (const h of hexesInRange(city.hex, city.borderRadius)) {
      const tile = tileAt(match.tiles, h);
      if (!tile || tile.owner !== playerId) continue;
      if (tile.terrain === "ruin") r.scrap += 1;
      if (tile.terrain === "forest") r.food += 1;
      if (tile.terrain === "flats") r.food += 1;
      if (tile.terrain === "marsh") r.tech += 1;
      if (tile.feature === "geyser") r.power += 1;
      if (tile.feature === "wellspring") r.food += 1;
      if (tile.feature === "wreck") r.scrap += 1;
      if (tile.bloom >= 2) r.food += 1; // Reclaimer bonus applied elsewhere
      if (tile.radiation >= 2) r.food -= 1;
    }
  }
  return r;
}

export function canBuildBuilding(
  match: MatchState,
  city: City,
  bKey: string
): boolean {
  const b = BUILDINGS[bKey];
  if (!b) return false;
  if (city.buildings.includes(bKey)) return false;
  const player = match.players.find((p) => p.id === city.owner);
  if (!player) return false;
  if (b.factionLock && !b.factionLock.includes(player.faction)) return false;
  if (b.requiresFeature) {
    const tile = tileAt(match.tiles, city.hex);
    if (tile?.feature !== b.requiresFeature) return false;
  }
  // cost check
  for (const [k, v] of Object.entries(b.cost)) {
    if ((player.resources as any)[k] < v) return false;
  }
  return true;
}
