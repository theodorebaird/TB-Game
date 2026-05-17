import { Unit, Tile } from "./types";
import { TERRAIN } from "./terrain";
import { hexDistance } from "./hex";

export interface CombatResult {
  damageDealt: number;
  retaliation: number;
  attackerHp: number;
  defenderHp: number;
  defenderDied: boolean;
  attackerDied: boolean;
}

export function computeDamage(
  attacker: Unit,
  defender: Unit,
  defenderTile: Tile
): number {
  const attackForce = attacker.atk * (attacker.hp / attacker.hpMax);
  const terrainMult = TERRAIN[defenderTile.terrain].defenseMult;
  const defenseForce =
    defender.def * (defender.hp / defender.hpMax) * terrainMult;
  if (attackForce + defenseForce === 0) return 0;
  const raw =
    4.5 * (attackForce / (attackForce + defenseForce)) * attacker.atk;
  return Math.min(defender.hp, Math.round(raw));
}

export function computeRetaliation(
  attacker: Unit,
  defender: Unit,
  postDamageDefenderHp: number
): number {
  // Only at melee distance and only if defender survived.
  if (hexDistance(attacker.hex, defender.hex) !== 1) return 0;
  if (postDamageDefenderHp <= 0) return 0;
  if (defender.range < 1) return 0;
  const defForce = defender.def * (postDamageDefenderHp / defender.hpMax);
  const atkForce = attacker.def * (attacker.hp / attacker.hpMax);
  if (defForce + atkForce === 0) return 0;
  const raw = (4.5 * defForce) / (defForce + atkForce) * defender.atk * 0.5;
  return Math.min(attacker.hp, Math.round(raw));
}

export function resolveCombat(
  attacker: Unit,
  defender: Unit,
  defenderTile: Tile
): CombatResult {
  const dmg = computeDamage(attacker, defender, defenderTile);
  const newDefHp = defender.hp - dmg;
  const retal = computeRetaliation(attacker, defender, newDefHp);
  const newAtkHp = attacker.hp - retal;
  return {
    damageDealt: dmg,
    retaliation: retal,
    attackerHp: Math.max(0, newAtkHp),
    defenderHp: Math.max(0, newDefHp),
    defenderDied: newDefHp <= 0,
    attackerDied: newAtkHp <= 0,
  };
}

// XP awarded per kill (cheap clamp).
export function xpForKill(victim: Unit): number {
  return Math.max(1, Math.min(5, Math.round(victim.hpMax / 5)));
}
