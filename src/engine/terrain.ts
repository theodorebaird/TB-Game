import { Terrain } from "./types";

export interface TerrainDef {
  moveCost: number; // 99 = impassable
  defenseMult: number;
  description: string;
  color: string; // for Skia rendering
}

export const TERRAIN: Record<Terrain, TerrainDef> = {
  flats:    { moveCost: 1,  defenseMult: 1.0,  description: "Cracked Flats",       color: "#b58764" },
  dune:     { moveCost: 2,  defenseMult: 1.1,  description: "Glass Dune",          color: "#dbb98b" },
  ruin:     { moveCost: 1,  defenseMult: 1.2,  description: "Pre-Collapse Ruin",   color: "#7a6b5d" },
  forest:   { moveCost: 2,  defenseMult: 1.25, description: "Fungal Forest",       color: "#56715a" },
  marsh:    { moveCost: 2,  defenseMult: 1.1,  description: "Toxic Marsh",         color: "#4d5b3a" },
  mountain: { moveCost: 99, defenseMult: 1.0,  description: "Slag Peak",           color: "#5a5550" },
  water:    { moveCost: 99, defenseMult: 1.0,  description: "Brine",               color: "#2e4a55" },
  road:     { moveCost: 0.5, defenseMult: 1.0, description: "Ash Road",            color: "#9a8a75" },
  crater:   { moveCost: 1,  defenseMult: 0.9,  description: "Strike Crater",       color: "#4a3530" },
};

export function isImpassable(t: Terrain): boolean {
  return TERRAIN[t].moveCost >= 99;
}
