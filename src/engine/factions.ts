import { Faction } from "./types";

export interface FactionDef {
  id: Faction;
  name: string;
  motto: string;
  passive: string;
  startingUnit: string;
  startingWorker: string;
  tier2Unit: string;
  techBranch: string;
  winCondition: string;
  color: string;
  aiWeights: { expand: number; military: number; tech: number; diplo: number; environment: number };
}

export const FACTIONS: Record<Faction, FactionDef> = {
  reclaimers: {
    id: "reclaimers",
    name: "The Reclaimers",
    motto: "We are gardeners with rifles.",
    passive: "Bloom does not damage you. Bloom tiles you own yield +1 Food.",
    startingUnit: "sporeWeaver",
    startingWorker: "vinekin",
    tier2Unit: "broodMother",
    techBranch: "Mycology",
    winCondition: "Total Bloom: cover 40% of explored map in Bloom L2+.",
    color: "#5fa86b",
    aiWeights: { expand: 1.2, military: 0.8, tech: 1.0, diplo: 0.9, environment: 1.6 },
  },
  scrappers: {
    id: "scrappers",
    name: "The Scrappers",
    motto: "Everything broken can kill again.",
    passive: "Salvage 50% Scrap from kills. Ruins give double loot.",
    startingUnit: "wrenchGang",
    startingWorker: "picker",
    tier2Unit: "junkerMech",
    techBranch: "Jury Rigging",
    winCondition: "Salvage Throne: 500 Scrap + 6 cities.",
    color: "#c97b3a",
    aiWeights: { expand: 1.3, military: 1.2, tech: 0.9, diplo: 0.7, environment: 0.6 },
  },
  choir: {
    id: "choir",
    name: "The Choir",
    motto: "The signal called. We answered.",
    passive: "See all enemy Warlords. Convert villages with Influence.",
    startingUnit: "whisperer",
    startingWorker: "acolyte",
    tier2Unit: "choirVox",
    techBranch: "Resonance",
    winCondition: "The Sermon: 3 Relay Towers broadcasting 5 turns.",
    color: "#7a6dbf",
    aiWeights: { expand: 0.9, military: 0.7, tech: 1.1, diplo: 1.5, environment: 0.7 },
  },
  hollow: {
    id: "hollow",
    name: "The Hollow Legion",
    motto: "Discipline is the cure for hope.",
    passive: "+1 def per adjacent friendly. Upkeep in Power.",
    startingUnit: "linebreaker",
    startingWorker: "engineer",
    tier2Unit: "howitzer",
    techBranch: "Doctrine",
    winCondition: "Pax Cinder: hold every Capital 3 turns OR conquest.",
    color: "#b94a4a",
    aiWeights: { expand: 1.0, military: 1.5, tech: 0.8, diplo: 0.6, environment: 0.5 },
  },
  drifters: {
    id: "drifters",
    name: "The Drifters",
    motto: "Roots are for the dead.",
    passive: "+1 move all units. Build mobile Camps instead of cities.",
    startingUnit: "skirmishRider",
    startingWorker: "pathfinder",
    tier2Unit: "sandbarge",
    techBranch: "Wayfaring",
    winCondition: "Long Road: Warlord crosses every starting quadrant.",
    color: "#d4b048",
    aiWeights: { expand: 0.9, military: 1.0, tech: 0.9, diplo: 1.0, environment: 1.2 },
  },
};

export const FACTION_LIST: Faction[] = [
  "reclaimers",
  "scrappers",
  "choir",
  "hollow",
  "drifters",
];
