import { MatchState, Tile, Hex } from "./types";
import { RNG } from "./rng";
import { inBounds, tileAt } from "./map";
import { hexAdd, hexNeighbors, hexDistance, HEX_DIRS } from "./hex";

// Round-end environment tick: radiation drift, bloom spread, storm move, season effects.
export function tickEnvironment(state: MatchState): void {
  const rng = new RNG(state.seed + state.round * 7919);

  // --- Radiation drift ---
  const radSpreads: { hex: Hex; level: 0 | 1 | 2 | 3 }[] = [];
  for (let q = 0; q < state.width; q++) {
    for (let r = 0; r < state.height; r++) {
      const tile = state.tiles[q][r];
      if (tile.radiation >= 1 && rng.chance(0.2)) {
        const dir = HEX_DIRS[rng.int(HEX_DIRS.length)];
        const target = hexAdd(tile.hex, dir);
        if (!inBounds(state.width, state.height, target)) continue;
        const nb = state.tiles[target.q][target.r];
        if (nb.terrain === "water") continue;
        const newLevel = Math.min(3, nb.radiation + 1) as 0 | 1 | 2 | 3;
        if (newLevel > nb.radiation) {
          radSpreads.push({ hex: target, level: newLevel });
        }
      }
    }
  }
  for (const s of radSpreads) {
    state.tiles[s.hex.q][s.hex.r].radiation = s.level;
  }

  // --- Bloom spread ---
  const bloomSpreads: { hex: Hex; level: 0 | 1 | 2 | 3 }[] = [];
  for (let q = 0; q < state.width; q++) {
    for (let r = 0; r < state.height; r++) {
      const tile = state.tiles[q][r];
      const mult = state.season === "wet" ? 1.3 : 1.0;
      if (tile.bloom >= 1 && rng.chance(0.15 * mult)) {
        const dir = HEX_DIRS[rng.int(HEX_DIRS.length)];
        const target = hexAdd(tile.hex, dir);
        if (!inBounds(state.width, state.height, target)) continue;
        const nb = state.tiles[target.q][target.r];
        if (nb.terrain === "water") continue;
        const newLevel = Math.min(3, nb.bloom + 1) as 0 | 1 | 2 | 3;
        if (newLevel > nb.bloom) {
          bloomSpreads.push({ hex: target, level: newLevel });
        }
      }
    }
  }
  for (const s of bloomSpreads) {
    state.tiles[s.hex.q][s.hex.r].bloom = s.level;
  }

  // --- Storms move ---
  const stormStep = state.season === "ash" ? 2 : 1;
  for (const storm of state.storms) {
    for (let i = 0; i < stormStep; i++) {
      const next = hexAdd(storm.center, storm.heading);
      if (inBounds(state.width, state.height, next)) storm.center = next;
      else {
        // bounce: pick random new heading
        storm.heading = HEX_DIRS[rng.int(HEX_DIRS.length)];
      }
    }
  }
  // Recompute inStorm
  for (let q = 0; q < state.width; q++) {
    for (let r = 0; r < state.height; r++) {
      const tile = state.tiles[q][r];
      tile.inStorm = state.storms.some(
        (s) => hexDistance(tile.hex, s.center) <= s.radius
      );
    }
  }

  // --- Apply environmental damage to units ---
  for (const u of Object.values(state.units)) {
    const tile = tileAt(state.tiles, u.hex);
    if (!tile) continue;
    let dmg = 0;
    if (tile.radiation >= 1 && !u.tags.includes("radResistant")) dmg += 1;
    if (tile.terrain === "marsh" && !u.tags.includes("biological")) dmg += 1;
    if (tile.inStorm && u.tags.includes("flying")) dmg += 2;
    if (dmg > 0) {
      u.hp = Math.max(0, u.hp - dmg);
    }
  }
  // Remove dead units
  for (const id of Object.keys(state.units)) {
    if (state.units[id].hp <= 0) {
      const u = state.units[id];
      const t = tileAt(state.tiles, u.hex);
      if (t && t.unitId === id) t.unitId = undefined;
      delete state.units[id];
      state.log.push(`Unit ${id} succumbed to the wasteland.`);
    }
  }
}

export function rollSeason(seed: number): MatchState["season"] {
  const rng = new RNG(seed);
  return rng.pick(["dry", "wet", "coldsnap", "sun", "ash"] as const);
}

export function spawnInitialStorms(state: MatchState): void {
  const rng = new RNG(state.seed + 999);
  const count = state.season === "ash" ? 2 : 1 + rng.int(2);
  for (let i = 0; i < count; i++) {
    state.storms.push({
      center: {
        q: rng.int(state.width),
        r: rng.int(state.height),
      },
      radius: 1,
      heading: HEX_DIRS[rng.int(HEX_DIRS.length)],
    });
  }
}
