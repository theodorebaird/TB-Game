import unitsData from "../data/units.json";
import { Unit, Hex } from "./types";

interface UnitDef {
  faction: string;
  tier: number;
  cost: Record<string, number>;
  hpMax: number;
  atk: number;
  def: number;
  range: number;
  movement: number;
  tags: string[];
  abilities: string[];
  requires?: string;
}

export const UNITS = unitsData as Record<string, UnitDef>;

let _uid = 1;
export function nextUnitId(): string {
  return `u${_uid++}`;
}

export function spawnUnit(
  type: string,
  owner: string,
  hex: Hex
): Unit {
  const def = UNITS[type];
  if (!def) throw new Error(`Unknown unit type: ${type}`);
  return {
    id: nextUnitId(),
    type,
    owner,
    hex,
    hp: def.hpMax,
    hpMax: def.hpMax,
    atk: def.atk,
    def: def.def,
    range: def.range,
    movement: def.movement,
    ap: 1,
    veterancy: 0,
    xp: 0,
    abilities: [...def.abilities],
    tags: [...def.tags],
  };
}

export function getUnitDef(type: string): UnitDef | undefined {
  return UNITS[type];
}
