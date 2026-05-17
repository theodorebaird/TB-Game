import { Tile, Terrain, Feature, Hex } from "./types";
import { RNG } from "./rng";
import { hexDistance, hexesInRange } from "./hex";

export interface MapGenOptions {
  width: number;
  height: number;
  seed: number;
  playerCount: number;
}

const TERRAIN_WEIGHTS: { t: Terrain; w: number }[] = [
  { t: "flats", w: 40 },
  { t: "dune", w: 14 },
  { t: "ruin", w: 8 },
  { t: "forest", w: 12 },
  { t: "marsh", w: 6 },
  { t: "mountain", w: 6 },
  { t: "water", w: 8 },
  { t: "crater", w: 6 },
];

function weightedPick(rng: RNG): Terrain {
  const total = TERRAIN_WEIGHTS.reduce((s, x) => s + x.w, 0);
  let n = rng.int(total);
  for (const w of TERRAIN_WEIGHTS) {
    if (n < w.w) return w.t;
    n -= w.w;
  }
  return "flats";
}

export function generateMap(opts: MapGenOptions): {
  tiles: Tile[][];
  spawns: Hex[];
} {
  const { width, height, seed, playerCount } = opts;
  const rng = new RNG(seed);
  const tiles: Tile[][] = [];

  for (let q = 0; q < width; q++) {
    tiles[q] = [];
    for (let r = 0; r < height; r++) {
      const terrain = weightedPick(rng);
      let feature: Feature | undefined;
      const featRoll = rng.next();
      if (terrain === "ruin" && featRoll < 0.2) feature = "wreck";
      else if (terrain === "forest" && featRoll < 0.15) feature = "bloomNode";
      else if (terrain === "flats" && featRoll < 0.05) feature = "geyser";
      else if (terrain === "flats" && featRoll < 0.08) feature = "wellspring";
      else if (terrain === "ruin" && featRoll < 0.04) feature = "relic";
      else if (terrain === "water" && featRoll < 0.3) feature = "ford";

      tiles[q][r] = {
        hex: { q, r },
        terrain,
        feature,
        radiation: terrain === "crater" ? 1 : 0,
        bloom: feature === "bloomNode" ? 1 : 0,
        inStorm: false,
        visibility: {},
      };
    }
  }

  // Pick spawn points: spread across map corners/edges, must be flats/ruin, far apart.
  const spawns: Hex[] = [];
  const candidates: Hex[] = [];
  for (let q = 2; q < width - 2; q++) {
    for (let r = 2; r < height - 2; r++) {
      const t = tiles[q][r];
      if (t.terrain === "flats" || t.terrain === "ruin") candidates.push(t.hex);
    }
  }
  // Greedy farthest-point insertion.
  if (candidates.length > 0) {
    spawns.push(candidates[rng.int(candidates.length)]);
    while (spawns.length < playerCount && candidates.length > spawns.length) {
      let best: Hex | null = null;
      let bestDist = -1;
      for (const c of candidates) {
        const minDist = Math.min(...spawns.map((s) => hexDistance(c, s)));
        if (minDist > bestDist) {
          bestDist = minDist;
          best = c;
        }
      }
      if (best) spawns.push(best);
      else break;
    }
  }

  // Clear immediate area around spawns to flats (no impassable on doorstep).
  for (const s of spawns) {
    for (const h of hexesInRange(s, 1)) {
      if (h.q < 0 || h.q >= width || h.r < 0 || h.r >= height) continue;
      const tile = tiles[h.q][h.r];
      if (tile.terrain === "mountain" || tile.terrain === "water") {
        tile.terrain = "flats";
        tile.feature = undefined;
      }
    }
  }

  return { tiles, spawns };
}

export function tileAt(tiles: Tile[][], h: Hex): Tile | undefined {
  if (h.q < 0 || h.r < 0) return undefined;
  if (!tiles[h.q]) return undefined;
  return tiles[h.q][h.r];
}

export function inBounds(width: number, height: number, h: Hex): boolean {
  return h.q >= 0 && h.q < width && h.r >= 0 && h.r < height;
}
