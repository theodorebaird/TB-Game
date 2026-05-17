import { create } from "zustand";
import { HeroState } from "@engine/types";
import { newHero, HeroArchetype, awardXp } from "@engine/heroes";
import { storage } from "./persistence";

interface MetaStore {
  hero: HeroState | null;
  totalMatches: number;
  totalWins: number;
  unlockedFactions: string[];

  createHero: (archetype: HeroArchetype, name: string) => void;
  endMatch: (won: boolean, score: number) => void;
  equip: (slot: "weapon" | "armor" | "relic" | "companion", itemKey: string | undefined) => void;
  spendSalvage: (amount: number) => boolean;
  reset: () => void;
  load: () => void;
  save: () => void;
}

const STORAGE_KEY = "tb-game-meta-v1";

export const useMetaStore = create<MetaStore>((set, get) => ({
  hero: null,
  totalMatches: 0,
  totalWins: 0,
  unlockedFactions: ["scrappers", "reclaimers", "choir", "hollow", "drifters"],

  createHero: (archetype, name) => {
    set({ hero: newHero(archetype, name) });
    get().save();
  },

  endMatch: (won, score) => {
    const { hero } = get();
    if (!hero) return;
    hero.matchesPlayed += 1;
    if (won) hero.matchesWon += 1;
    hero.salvage += Math.round(score / 10) + (won ? 50 : 20);
    awardXp(hero, won ? 10 : 4);
    set({
      hero: { ...hero },
      totalMatches: get().totalMatches + 1,
      totalWins: get().totalWins + (won ? 1 : 0),
    });
    get().save();
  },

  equip: (slot, itemKey) => {
    const { hero } = get();
    if (!hero) return;
    hero.equipped[slot] = itemKey;
    set({ hero: { ...hero } });
    get().save();
  },

  spendSalvage: (amount) => {
    const { hero } = get();
    if (!hero || hero.salvage < amount) return false;
    hero.salvage -= amount;
    set({ hero: { ...hero } });
    get().save();
    return true;
  },

  reset: () => {
    storage.delete(STORAGE_KEY);
    set({ hero: null, totalMatches: 0, totalWins: 0 });
  },

  load: () => {
    const s = storage.getString(STORAGE_KEY);
    if (s) {
      try {
        const data = JSON.parse(s);
        set(data);
      } catch {}
    }
  },

  save: () => {
    const { hero, totalMatches, totalWins, unlockedFactions } = get();
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ hero, totalMatches, totalWins, unlockedFactions })
    );
  },
}));
