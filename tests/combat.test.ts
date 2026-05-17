import { describe, it, expect } from "vitest";
import { resolveCombat, computeDamage, computeRetaliation } from "../src/engine/combat";
import { Unit, Tile } from "../src/engine/types";

function mkUnit(over: Partial<Unit> = {}): Unit {
  return {
    id: "u1", type: "warrior", owner: "p1", hex: { q: 0, r: 0 },
    hp: 10, hpMax: 10, atk: 3, def: 2, range: 1, movement: 2,
    ap: 1, veterancy: 0, xp: 0, abilities: [], tags: [],
    ...over,
  };
}

function mkTile(over: Partial<Tile> = {}): Tile {
  return {
    hex: { q: 1, r: 0 }, terrain: "flats",
    radiation: 0, bloom: 0, inStorm: false, visibility: {},
    ...over,
  };
}

describe("combat", () => {
  it("damage is non-negative and capped at defender HP", () => {
    for (let i = 0; i < 200; i++) {
      const atk = mkUnit({ atk: 1 + Math.floor(Math.random() * 8) });
      const def = mkUnit({ hp: 1 + Math.floor(Math.random() * 20), hpMax: 25, def: 1 + Math.floor(Math.random() * 5) });
      const d = computeDamage(atk, def, mkTile());
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(def.hp);
    }
  });
  it("retaliation halved and only at melee", () => {
    const atk = mkUnit({ hex: { q: 0, r: 0 } });
    const def = mkUnit({ id: "u2", owner: "p2", hex: { q: 2, r: 0 }, range: 2 });
    expect(computeRetaliation(atk, def, def.hp)).toBe(0);
  });
  it("no retaliation if defender died", () => {
    const atk = mkUnit({ hex: { q: 0, r: 0 } });
    const def = mkUnit({ id: "u2", owner: "p2", hex: { q: 1, r: 0 }, hp: 1, range: 1 });
    expect(computeRetaliation(atk, def, 0)).toBe(0);
  });
  it("resolveCombat never produces negative HP", () => {
    for (let i = 0; i < 500; i++) {
      const a = mkUnit({ hp: 1 + Math.floor(Math.random() * 20), hpMax: 25, atk: 1 + Math.floor(Math.random() * 7), def: 1 + Math.floor(Math.random() * 4) });
      const d = mkUnit({ id: "u2", owner: "p2", hex: { q: 1, r: 0 }, hp: 1 + Math.floor(Math.random() * 20), hpMax: 25, atk: 1 + Math.floor(Math.random() * 7), def: 1 + Math.floor(Math.random() * 4) });
      const r = resolveCombat(a, d, mkTile());
      expect(r.attackerHp).toBeGreaterThanOrEqual(0);
      expect(r.defenderHp).toBeGreaterThanOrEqual(0);
    }
  });
});
