import { create } from "zustand";
import { MatchState, Hex, Faction } from "@engine/types";
import {
  createMatch,
  currentPlayer,
  endTurn as engineEndTurn,
  moveUnit as engineMove,
  attackUnit as engineAttack,
  foundCityAction as engineFound,
  queueProduction as engineProduce,
  startResearch as engineResearch,
} from "@engine/match";
import { runAITurn } from "@engine/ai";
import { reachableHexes, attackableHexes } from "@engine/pathfinding";
import { animations } from "../lib/animations";
import { sfx } from "../lib/sounds";

interface MatchStore {
  match: MatchState | null;
  selectedUnitId: string | null;
  selectedHex: Hex | null;
  highlightedMoves: Hex[];
  highlightedAttacks: Hex[];

  startMatch: (factions: Faction[], seed?: number) => void;
  selectUnit: (unitId: string | null) => void;
  selectHex: (h: Hex | null) => void;
  moveSelected: (target: Hex) => boolean;
  attackSelected: (target: Hex) => boolean;
  foundCity: () => boolean;
  queueUnit: (cityId: string, unitKey: string) => boolean;
  queueBuilding: (cityId: string, buildingKey: string) => boolean;
  research: (techKey: string) => boolean;
  endTurn: () => void;
  loadMatch: (m: MatchState) => void;
  clearSelection: () => void;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  match: null,
  selectedUnitId: null,
  selectedHex: null,
  highlightedMoves: [],
  highlightedAttacks: [],

  startMatch: (factions, seed = Date.now() & 0xffffffff) => {
    const m = createMatch({ seed, width: 16, height: 20, factions });
    set({
      match: m,
      selectedUnitId: null,
      selectedHex: null,
      highlightedMoves: [],
      highlightedAttacks: [],
    });
  },

  loadMatch: (m) => set({ match: m }),

  clearSelection: () => set({
    selectedUnitId: null,
    highlightedMoves: [],
    highlightedAttacks: [],
  }),

  selectUnit: (unitId) => {
    const m = get().match;
    if (!m || !unitId) {
      set({ selectedUnitId: null, highlightedMoves: [], highlightedAttacks: [] });
      return;
    }
    const u = m.units[unitId];
    if (!u) return;
    const cur = currentPlayer(m);
    if (u.owner !== cur.id) {
      set({ selectedUnitId: unitId, highlightedMoves: [], highlightedAttacks: [] });
      return;
    }
    const moves = reachableHexes(u, m.tiles, m.width, m.height, m.units);
    const atks = attackableHexes(u, m.units);
    set({
      selectedUnitId: unitId,
      highlightedMoves: moves,
      highlightedAttacks: atks,
    });
  },

  selectHex: (h) => set({ selectedHex: h }),

  moveSelected: (target) => {
    const { match, selectedUnitId } = get();
    if (!match || !selectedUnitId) return false;
    const unit = match.units[selectedUnitId];
    const fromHex = unit ? { ...unit.hex } : null;
    const ok = engineMove(match, selectedUnitId, target);
    if (ok) {
      if (fromHex) animations.unitMove(selectedUnitId, fromHex, target);
      sfx.move();
      set({ match: { ...match } });
      get().selectUnit(selectedUnitId);
    }
    return ok;
  },

  attackSelected: (target) => {
    const { match, selectedUnitId } = get();
    if (!match || !selectedUnitId) return false;
    const targetTile = match.tiles[target.q][target.r];
    const defenderId = targetTile?.unitId;
    const defenderBefore = defenderId ? match.units[defenderId] : null;
    const defenderHpBefore = defenderBefore?.hp ?? 0;
    const attackerBefore = match.units[selectedUnitId];
    const attackerHpBefore = attackerBefore?.hp ?? 0;
    const ok = engineAttack(match, selectedUnitId, target);
    if (ok) {
      sfx.attack();
      animations.doShake(6, 220);
      // Damage to defender
      const defenderAfter = defenderId ? match.units[defenderId] : null;
      const dmgToDefender = defenderHpBefore - (defenderAfter?.hp ?? 0);
      if (dmgToDefender > 0) {
        animations.damage(target, dmgToDefender, "#ff7070");
        if (defenderId) animations.flash(defenderId);
      }
      // Retaliation
      const attackerAfter = match.units[selectedUnitId];
      const retalDmg = attackerHpBefore - (attackerAfter?.hp ?? 0);
      if (retalDmg > 0 && attackerAfter) {
        animations.damage(attackerAfter.hex, retalDmg, "#ffb070");
        animations.flash(selectedUnitId);
      }
      if (!defenderAfter && defenderBefore) {
        sfx.death();
      }
      set({ match: { ...match } });
      get().selectUnit(selectedUnitId);
    }
    return ok;
  },

  foundCity: () => {
    const { match, selectedUnitId } = get();
    if (!match || !selectedUnitId) return false;
    const ok = engineFound(match, selectedUnitId);
    if (ok) {
      sfx.cityFound();
      set({ match: { ...match }, selectedUnitId: null, highlightedMoves: [], highlightedAttacks: [] });
    }
    return ok;
  },

  queueUnit: (cityId, unitKey) => {
    const { match } = get();
    if (!match) return false;
    const ok = engineProduce(match, cityId, "unit", unitKey);
    if (ok) set({ match: { ...match } });
    return ok;
  },

  queueBuilding: (cityId, buildingKey) => {
    const { match } = get();
    if (!match) return false;
    const ok = engineProduce(match, cityId, "building", buildingKey);
    if (ok) set({ match: { ...match } });
    return ok;
  },

  endTurn: () => {
    const { match } = get();
    if (!match) return;
    sfx.endTurn();
    engineEndTurn(match);
    let safety = 10;
    while (currentPlayer(match).isAI && !match.winner && safety-- > 0) {
      runAITurn(match, currentPlayer(match), "marauder");
    }
    if (match.winner) {
      const human = match.players[0];
      if (match.winner === human.id) sfx.win();
      else sfx.lose();
    }
    set({
      match: { ...match },
      selectedUnitId: null,
      highlightedMoves: [],
      highlightedAttacks: [],
    });
  },

  research: (techKey) => {
    const { match } = get();
    if (!match) return false;
    const cur = currentPlayer(match);
    const ok = engineResearch(match, cur.id, techKey);
    if (ok) { sfx.research(); set({ match: { ...match } }); }
    return ok;
  },
}));
