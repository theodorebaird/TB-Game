import { create } from "zustand";
import { MatchState, Hex, Unit, Faction } from "@engine/types";
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
    const ok = engineMove(match, selectedUnitId, target);
    if (ok) {
      set({ match: { ...match } });
      get().selectUnit(selectedUnitId);
    }
    return ok;
  },

  attackSelected: (target) => {
    const { match, selectedUnitId } = get();
    if (!match || !selectedUnitId) return false;
    const ok = engineAttack(match, selectedUnitId, target);
    if (ok) {
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
      set({
        match: { ...match },
        selectedUnitId: null,
        highlightedMoves: [],
        highlightedAttacks: [],
      });
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

  research: (techKey) => {
    const { match } = get();
    if (!match) return false;
    const cur = currentPlayer(match);
    const ok = engineResearch(match, cur.id, techKey);
    if (ok) set({ match: { ...match } });
    return ok;
  },

  endTurn: () => {
    const { match } = get();
    if (!match) return;
    engineEndTurn(match);
    // Run AI turns until human is next.
    let safety = 10;
    while (currentPlayer(match).isAI && !match.winner && safety-- > 0) {
      runAITurn(match, currentPlayer(match), "marauder");
    }
    set({
      match: { ...match },
      selectedUnitId: null,
      highlightedMoves: [],
      highlightedAttacks: [],
    });
  },
}));
