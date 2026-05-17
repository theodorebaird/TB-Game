import { HeroState, Unit } from "./types";

export type HeroArchetype = "reaver" | "verdant" | "mute" | "ironVow" | "longWalker";

export interface HeroArchetypeDef {
  id: HeroArchetype;
  name: string;
  flavor: string;
  baseStats: { hp: number; atk: number; def: number };
  signature: string;
  signatureDesc: string;
  unlockedAbilitiesAt: { level: number; ability: string }[];
}

export const HERO_ARCHETYPES: Record<HeroArchetype, HeroArchetypeDef> = {
  reaver: {
    id: "reaver",
    name: "The Reaver",
    flavor: "Scrap-flavored brawler. Loud, painful.",
    baseStats: { hp: 25, atk: 5, def: 3 },
    signature: "junkbomb",
    signatureDesc: "3-hex AoE, 4 dmg, leaves a Wreck.",
    unlockedAbilitiesAt: [
      { level: 3, ability: "scrapStorm" },
      { level: 6, ability: "ironLung" },
      { level: 10, ability: "warhowl" },
      { level: 15, ability: "lastStand" },
    ],
  },
  verdant: {
    id: "verdant",
    name: "The Verdant",
    flavor: "Reclaimer-flavored. Slow, terrible, growing.",
    baseStats: { hp: 22, atk: 3, def: 5 },
    signature: "surge",
    signatureDesc: "Raise Bloom +2 on 4 adjacent tiles.",
    unlockedAbilitiesAt: [
      { level: 3, ability: "rootShield" },
      { level: 6, ability: "sporeBurst" },
      { level: 10, ability: "broodCall" },
      { level: 15, ability: "verdantAvatar" },
    ],
  },
  mute: {
    id: "mute",
    name: "The Mute",
    flavor: "Choir-flavored. Silent and surgical.",
    baseStats: { hp: 18, atk: 4, def: 4 },
    signature: "hush",
    signatureDesc: "Silence all enemy units in 4-hex radius for 1 turn.",
    unlockedAbilitiesAt: [
      { level: 3, ability: "whisper" },
      { level: 6, ability: "puppet" },
      { level: 10, ability: "chorus" },
      { level: 15, ability: "silenceEternal" },
    ],
  },
  ironVow: {
    id: "ironVow",
    name: "The Iron Vow",
    flavor: "Legion-flavored. The wall that walks.",
    baseStats: { hp: 28, atk: 4, def: 6 },
    signature: "rally",
    signatureDesc: "Allies in 3 hexes: +2 atk for 2 turns.",
    unlockedAbilitiesAt: [
      { level: 3, ability: "phalanxStance" },
      { level: 6, ability: "ironGrip" },
      { level: 10, ability: "lastOrder" },
      { level: 15, ability: "neverFall" },
    ],
  },
  longWalker: {
    id: "longWalker",
    name: "The Long Walker",
    flavor: "Drifter-flavored. The road is the only god.",
    baseStats: { hp: 20, atk: 6, def: 3 },
    signature: "slipstream",
    signatureDesc: "Teleport up to 5 hexes; next attack +3 dmg.",
    unlockedAbilitiesAt: [
      { level: 3, ability: "wayfind" },
      { level: 6, ability: "ghostStep" },
      { level: 10, ability: "stormSong" },
      { level: 15, ability: "horizonCall" },
    ],
  },
};

export function newHero(archetype: HeroArchetype, name: string): HeroState {
  const def = HERO_ARCHETYPES[archetype];
  return {
    id: `hero_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    archetype,
    name,
    level: 1,
    xp: 0,
    statPoints: 0,
    stats: { ...def.baseStats },
    unlockedAbilities: [def.signature],
    equipped: {},
    salvage: 200,
    cosmetics: {},
    matchesPlayed: 0,
    matchesWon: 0,
  };
}

export function xpForNextLevel(level: number): number {
  return 50 + level * 30;
}

export function awardXp(hero: HeroState, amount: number): { leveledUp: boolean; newLevel: number } {
  hero.xp += amount;
  let leveledUp = false;
  while (hero.xp >= xpForNextLevel(hero.level) && hero.level < 20) {
    hero.xp -= xpForNextLevel(hero.level);
    hero.level += 1;
    hero.stats.hp += 1;
    if (hero.level % 3 === 0) hero.statPoints += 1;
    const def = HERO_ARCHETYPES[hero.archetype];
    const unlock = def.unlockedAbilitiesAt.find((a) => a.level === hero.level);
    if (unlock && !hero.unlockedAbilities.includes(unlock.ability)) {
      hero.unlockedAbilities.push(unlock.ability);
    }
    leveledUp = true;
  }
  return { leveledUp, newLevel: hero.level };
}

export function heroToUnit(hero: HeroState, owner: string, hex: { q: number; r: number }): Unit {
  return {
    id: hero.id,
    type: `hero_${hero.archetype}`,
    owner,
    hex,
    hp: hero.stats.hp,
    hpMax: hero.stats.hp,
    atk: hero.stats.atk,
    def: hero.stats.def,
    range: 1,
    movement: 3,
    ap: 1,
    veterancy: 0,
    xp: 0,
    abilities: [...hero.unlockedAbilities],
    tags: ["infantry", "hero"],
    isHero: true,
  };
}
