export type Hex = { q: number; r: number };

export type Terrain =
  | "flats"
  | "dune"
  | "ruin"
  | "forest"
  | "marsh"
  | "mountain"
  | "water"
  | "road"
  | "crater";

export type Feature =
  | "ford"
  | "geyser"
  | "wreck"
  | "relic"
  | "wellspring"
  | "bloomNode"
  | "oldRoad";

export type Faction =
  | "reclaimers"
  | "scrappers"
  | "choir"
  | "hollow"
  | "drifters";

export type ResourceKind = "scrap" | "food" | "power" | "tech" | "influence";

export type DiploState =
  | "war"
  | "truce"
  | "peace"
  | "alliance"
  | "vassal"
  | "traitor";

export type Season = "dry" | "wet" | "coldsnap" | "sun" | "ash";

export interface Tile {
  hex: Hex;
  terrain: Terrain;
  feature?: Feature;
  resource?: { kind: ResourceKind; yield: number };
  owner?: string;
  unitId?: string;
  cityId?: string;
  radiation: 0 | 1 | 2 | 3;
  bloom: 0 | 1 | 2 | 3;
  inStorm: boolean;
  visibility: Record<string, boolean>;
}

export interface Unit {
  id: string;
  type: string;
  owner: string;
  hex: Hex;
  hp: number;
  hpMax: number;
  atk: number;
  def: number;
  range: number;
  movement: number;
  ap: number;
  veterancy: 0 | 1 | 2 | 3;
  xp: number;
  abilities: string[];
  tags: string[];
  isHero?: boolean;
}

export interface City {
  id: string;
  owner: string;
  hex: Hex;
  pop: number;
  hp: number;
  hpMax: number;
  buildings: string[];
  productionQueue: {
    type: "unit" | "building";
    key: string;
    turnsLeft: number;
  }[];
  isCapital: boolean;
  borderRadius: 1 | 2 | 3;
}

export interface Resources {
  scrap: number;
  food: number;
  power: number;
  tech: number;
  influence: number;
}

export interface PlayerState {
  id: string;
  name: string;
  faction: Faction;
  isAI: boolean;
  warlordId?: string;
  resources: Resources;
  ap: number;
  apMax: number;
  knownTech: string[];
  queuedResearch?: string;
  diplomacy: Record<string, DiploState>;
  trust: Record<string, number>;
  eliminated: boolean;
  color: string;
}

export interface Storm {
  center: Hex;
  radius: number;
  heading: Hex;
}

export interface MatchState {
  seed: number;
  round: number;
  maxRounds: number;
  currentPlayerIdx: number;
  players: PlayerState[];
  tiles: Tile[][];
  units: Record<string, Unit>;
  cities: Record<string, City>;
  storms: Storm[];
  season: Season;
  modifier?: string;
  winner?: string;
  log: string[];
  width: number;
  height: number;
}

export interface HeroState {
  id: string;
  archetype: "reaver" | "verdant" | "mute" | "ironVow" | "longWalker";
  name: string;
  level: number;
  xp: number;
  statPoints: number;
  stats: { hp: number; atk: number; def: number };
  unlockedAbilities: string[];
  equipped: {
    weapon?: string;
    armor?: string;
    relic?: string;
    companion?: string;
  };
  salvage: number;
  cosmetics: { portrait?: string; banner?: string };
  matchesPlayed: number;
  matchesWon: number;
}
