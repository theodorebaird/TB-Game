import { Hex, Tile, Unit } from "./types";
import { hexKey, hexNeighbors, hexDistance } from "./hex";
import { inBounds, tileAt } from "./map";
import { TERRAIN, isImpassable } from "./terrain";

// Returns a set of hex keys the unit can reach this turn given its movement.
export function reachableHexes(
  unit: Unit,
  tiles: Tile[][],
  width: number,
  height: number,
  units: Record<string, Unit>
): Hex[] {
  const visited = new Map<string, number>();
  visited.set(hexKey(unit.hex), 0);
  const frontier: { h: Hex; cost: number }[] = [{ h: unit.hex, cost: 0 }];
  while (frontier.length > 0) {
    const cur = frontier.shift()!;
    for (const nb of hexNeighbors(cur.h)) {
      if (!inBounds(width, height, nb)) continue;
      const tile = tiles[nb.q][nb.r];
      if (isImpassable(tile.terrain) && !unit.tags.includes("flying"))
        continue;
      const occupant = tile.unitId ? units[tile.unitId] : undefined;
      if (occupant && occupant.owner !== unit.owner) continue; // can't path through enemy
      const stepCost = TERRAIN[tile.terrain].moveCost;
      const newCost = cur.cost + stepCost;
      if (newCost > unit.movement) continue;
      const k = hexKey(nb);
      const prev = visited.get(k);
      if (prev === undefined || newCost < prev) {
        visited.set(k, newCost);
        frontier.push({ h: nb, cost: newCost });
      }
    }
  }
  visited.delete(hexKey(unit.hex));
  return Array.from(visited.keys()).map((k) => {
    const [q, r] = k.split(",").map(Number);
    return { q, r };
  });
}

export function attackableHexes(
  unit: Unit,
  units: Record<string, Unit>
): Hex[] {
  const out: Hex[] = [];
  for (const target of Object.values(units)) {
    if (target.owner === unit.owner) continue;
    if (hexDistance(unit.hex, target.hex) <= unit.range) {
      out.push(target.hex);
    }
  }
  return out;
}
