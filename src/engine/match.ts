import { MatchState, PlayerState, Hex, Unit, Faction } from "./types";
import { generateMap, tileAt, inBounds } from "./map";
import { spawnUnit } from "./units";
import { foundCity, computeIncome, BUILDINGS } from "./cities";
import { FACTIONS } from "./factions";
import { resolveCombat, xpForKill } from "./combat";
import { tickEnvironment, rollSeason, spawnInitialStorms } from "./environment";
import { reachableHexes, attackableHexes } from "./pathfinding";
import { hexDistance, hexKey } from "./hex";
import { TECH, canResearch, applyTechEffect } from "./tech";
import { isAttackable, markBetrayal, setDiplo, getDiplo } from "./diplomacy";

const PLAYER_COLORS = ["#c97b3a", "#5fa86b", "#7a6dbf", "#b94a4a", "#d4b048"];

export interface NewMatchOptions {
  seed: number;
  width: number;
  height: number;
  factions: Faction[]; // length = playerCount; first is human
  humanIdx?: number;
  maxRounds?: number;
}

export function createMatch(opts: NewMatchOptions): MatchState {
  const { tiles, spawns } = generateMap({
    width: opts.width,
    height: opts.height,
    seed: opts.seed,
    playerCount: opts.factions.length,
  });

  const players: PlayerState[] = opts.factions.map((f, i) => ({
    id: `p${i}`,
    name: i === (opts.humanIdx ?? 0) ? "You" : `${FACTIONS[f].name}`,
    faction: f,
    isAI: i !== (opts.humanIdx ?? 0),
    resources: { scrap: 10, food: 5, power: 0, tech: 0, influence: 5 },
    ap: 6,
    apMax: 6,
    knownTech: [],
    diplomacy: {},
    trust: {},
    eliminated: false,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
  }));

  // Initial diplomatic state: everyone at war (default).
  for (const a of players) {
    for (const b of players) {
      if (a.id === b.id) continue;
      a.diplomacy[b.id] = "war";
      a.trust[b.id] = 0;
    }
  }

  const units: Record<string, Unit> = {};
  const cities: Record<string, any> = {};

  // Spawn starting units + city at each player's spawn.
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const spawn = spawns[i] ?? { q: 1 + i * 3, r: 1 + i * 3 };
    const cityObj = foundCity(p.id, spawn, true);
    cities[cityObj.id] = cityObj;
    tiles[spawn.q][spawn.r].cityId = cityObj.id;
    tiles[spawn.q][spawn.r].owner = p.id;

    const def = FACTIONS[p.faction];
    // Worker adjacent
    const wq = Math.max(0, Math.min(opts.width - 1, spawn.q + 1));
    const wr = spawn.r;
    if (!tiles[wq][wr].unitId) {
      const w = spawnUnit(def.startingWorker, p.id, { q: wq, r: wr });
      units[w.id] = w;
      tiles[wq][wr].unitId = w.id;
    }
    // Starting combat unit on the city tile (cities can host a unit).
    const u = spawnUnit(def.startingUnit, p.id, spawn);
    units[u.id] = u;
    tiles[spawn.q][spawn.r].unitId = u.id;
  }

  const season = rollSeason(opts.seed);
  const match: MatchState = {
    seed: opts.seed,
    round: 1,
    maxRounds: opts.maxRounds ?? 30,
    currentPlayerIdx: 0,
    players,
    tiles,
    units,
    cities,
    storms: [],
    season,
    log: [`Match begins. Season: ${season}.`],
    width: opts.width,
    height: opts.height,
  };
  spawnInitialStorms(match);
  recomputeAllVisibility(match);
  collectIncome(match, players[0]);
  return match;
}

export function currentPlayer(m: MatchState): PlayerState {
  return m.players[m.currentPlayerIdx];
}

export function endTurn(m: MatchState): void {
  const cur = currentPlayer(m);
  // refresh unit AP
  for (const u of Object.values(m.units)) {
    if (u.owner === cur.id) u.ap = 1;
  }
  // research tick
  if (cur.queuedResearch) {
    const t = TECH[cur.queuedResearch];
    if (t && cur.resources.tech >= t.cost) {
      cur.resources.tech -= t.cost;
      cur.knownTech.push(cur.queuedResearch);
      applyTechEffect(cur, cur.queuedResearch);
      m.log.push(`${cur.name} researched ${cur.queuedResearch}.`);
      cur.queuedResearch = undefined;
    }
  }
  // city production tick
  for (const city of Object.values(m.cities)) {
    if (city.owner !== cur.id) continue;
    const front = city.productionQueue[0];
    if (!front) continue;
    front.turnsLeft -= 1;
    if (front.turnsLeft <= 0) {
      if (front.type === "unit") {
        // try to spawn on city tile if free, else adjacent
        const tile = tileAt(m.tiles, city.hex);
        if (tile && !tile.unitId) {
          const u = spawnUnit(front.key, cur.id, city.hex);
          m.units[u.id] = u;
          tile.unitId = u.id;
          m.log.push(`${cur.name} produced ${front.key}.`);
        }
      } else if (front.type === "building") {
        city.buildings.push(front.key);
        m.log.push(`${cur.name} built ${front.key} in city.`);
      }
      city.productionQueue.shift();
    }
  }

  // advance player index
  m.currentPlayerIdx = (m.currentPlayerIdx + 1) % m.players.length;
  // skip eliminated
  let safety = m.players.length;
  while (m.players[m.currentPlayerIdx].eliminated && safety-- > 0) {
    m.currentPlayerIdx = (m.currentPlayerIdx + 1) % m.players.length;
  }
  // if we looped back to player 0, end-of-round
  if (m.currentPlayerIdx === 0) {
    m.round += 1;
    tickEnvironment(m);
  }
  // give next player AP & income
  const next = currentPlayer(m);
  next.ap = next.apMax;
  collectIncome(m, next);
  recomputeAllVisibility(m);
  checkWin(m);
}

export function collectIncome(m: MatchState, p: PlayerState): void {
  const inc = computeIncome(m, p.id);
  p.resources.scrap += inc.scrap;
  p.resources.food += inc.food;
  p.resources.power += inc.power;
  p.resources.tech += inc.tech;
  p.resources.influence += inc.influence;
}

export function moveUnit(
  m: MatchState,
  unitId: string,
  target: Hex
): boolean {
  const u = m.units[unitId];
  if (!u) return false;
  const owner = m.players.find((p) => p.id === u.owner);
  if (!owner || owner.ap <= 0 || u.ap <= 0) return false;
  const reach = reachableHexes(u, m.tiles, m.width, m.height, m.units);
  if (!reach.some((h) => h.q === target.q && h.r === target.r)) return false;
  const fromTile = tileAt(m.tiles, u.hex);
  const toTile = tileAt(m.tiles, target);
  if (!toTile || toTile.unitId) return false;
  if (fromTile) fromTile.unitId = undefined;
  u.hex = target;
  toTile.unitId = unitId;
  u.ap -= 1;
  owner.ap -= 1;
  // claim border tiles around moving unit
  toTile.owner = u.owner;
  return true;
}

export function attackUnit(
  m: MatchState,
  attackerId: string,
  targetHex: Hex
): boolean {
  const attacker = m.units[attackerId];
  if (!attacker) return false;
  const owner = m.players.find((p) => p.id === attacker.owner)!;
  if (owner.ap <= 0 || attacker.ap <= 0) return false;
  const tile = tileAt(m.tiles, targetHex);
  if (!tile?.unitId) return false;
  const defender = m.units[tile.unitId];
  if (!defender) return false;
  if (hexDistance(attacker.hex, targetHex) > attacker.range) return false;
  const defOwner = m.players.find((p) => p.id === defender.owner)!;
  if (!isAttackable(owner, defOwner)) {
    markBetrayal(m, owner, defOwner);
  }
  const result = resolveCombat(attacker, defender, tile);
  attacker.hp = result.attackerHp;
  defender.hp = result.defenderHp;
  m.log.push(
    `${attacker.type} hits ${defender.type} for ${result.damageDealt}${result.retaliation > 0 ? ` (retal ${result.retaliation})` : ""}.`
  );
  if (result.defenderDied) {
    awardKillRewards(m, owner, defender);
    const dt = tileAt(m.tiles, defender.hex);
    if (dt) dt.unitId = undefined;
    delete m.units[defender.id];
  }
  if (result.attackerDied) {
    const at = tileAt(m.tiles, attacker.hex);
    if (at) at.unitId = undefined;
    delete m.units[attacker.id];
  } else {
    attacker.xp += xpForKill(defender);
    levelUpUnit(attacker);
  }
  attacker.ap -= 1;
  owner.ap -= 1;
  checkWin(m);
  return true;
}

function levelUpUnit(u: Unit): void {
  const thresholds = [3, 6, 10];
  for (let i = 0; i < thresholds.length; i++) {
    if (u.xp >= thresholds[i] && u.veterancy <= i) {
      u.veterancy = (i + 1) as 0 | 1 | 2 | 3;
      u.atk += 1;
      u.def += 1;
    }
  }
}

function awardKillRewards(m: MatchState, killer: PlayerState, victim: Unit): void {
  if (killer.faction === "scrappers") {
    const def = (m as any).__unitDefs?.[victim.type];
    // Simpler: just give a flat 2 scrap on kill for scrappers
    killer.resources.scrap += 2;
  }
}

export function foundCityAction(m: MatchState, workerId: string): boolean {
  const worker = m.units[workerId];
  if (!worker) return false;
  if (!worker.abilities.includes("foundCity") && !worker.abilities.includes("foundCamp")) return false;
  const owner = m.players.find((p) => p.id === worker.owner)!;
  if (owner.ap < 2) return false;
  const tile = tileAt(m.tiles, worker.hex);
  if (!tile) return false;
  if (!["flats", "ruin", "forest"].includes(tile.terrain)) return false;
  if (tile.cityId) return false;
  const city = foundCity(owner.id, worker.hex, false);
  m.cities[city.id] = city;
  tile.cityId = city.id;
  tile.owner = owner.id;
  tile.unitId = undefined;
  delete m.units[workerId];
  owner.ap -= 2;
  m.log.push(`${owner.name} founded a settlement.`);
  return true;
}

export function queueProduction(
  m: MatchState,
  cityId: string,
  type: "unit" | "building",
  key: string
): boolean {
  const city = m.cities[cityId];
  if (!city) return false;
  const owner = m.players.find((p) => p.id === city.owner)!;
  if (owner.ap < 2) return false;
  // cost check (simplified: just unit/building cost lookup)
  if (type === "building") {
    const b = BUILDINGS[key];
    if (!b) return false;
    for (const [k, v] of Object.entries(b.cost)) {
      if ((owner.resources as any)[k] < v) return false;
    }
    for (const [k, v] of Object.entries(b.cost)) {
      (owner.resources as any)[k] -= v;
    }
    city.productionQueue.push({ type, key, turnsLeft: b.buildTurns });
  } else {
    const ud = require("../data/units.json")[key];
    if (!ud) return false;
    for (const [k, v] of Object.entries(ud.cost as Record<string, number>)) {
      if ((owner.resources as any)[k] < v) return false;
    }
    for (const [k, v] of Object.entries(ud.cost as Record<string, number>)) {
      (owner.resources as any)[k] -= v;
    }
    city.productionQueue.push({ type, key, turnsLeft: ud.tier + 1 });
  }
  owner.ap -= 2;
  return true;
}

export function startResearch(m: MatchState, playerId: string, techKey: string): boolean {
  const p = m.players.find((x) => x.id === playerId);
  if (!p || p.ap < 1) return false;
  if (!canResearch(p, techKey)) return false;
  p.queuedResearch = techKey;
  p.ap -= 1;
  return true;
}

// --- Visibility ---
export function recomputeAllVisibility(m: MatchState): void {
  for (const p of m.players) {
    for (let q = 0; q < m.width; q++) {
      for (let r = 0; r < m.height; r++) {
        m.tiles[q][r].visibility[p.id] = false;
      }
    }
  }
  for (const u of Object.values(m.units)) {
    const vision = 2;
    for (let dq = -vision; dq <= vision; dq++) {
      for (let dr = -vision; dr <= vision; dr++) {
        const h = { q: u.hex.q + dq, r: u.hex.r + dr };
        if (!inBounds(m.width, m.height, h)) continue;
        if (hexDistance(u.hex, h) > vision) continue;
        m.tiles[h.q][h.r].visibility[u.owner] = true;
      }
    }
  }
  for (const c of Object.values(m.cities)) {
    const vision = 2;
    for (let dq = -vision; dq <= vision; dq++) {
      for (let dr = -vision; dr <= vision; dr++) {
        const h = { q: c.hex.q + dq, r: c.hex.r + dr };
        if (!inBounds(m.width, m.height, h)) continue;
        if (hexDistance(c.hex, h) > vision) continue;
        m.tiles[h.q][h.r].visibility[c.owner] = true;
      }
    }
  }
}

// --- Win conditions ---
export function legacyScore(m: MatchState, p: PlayerState): number {
  let cities = 0;
  for (const c of Object.values(m.cities)) if (c.owner === p.id) cities += 1;
  const units = Object.values(m.units).filter((u) => u.owner === p.id).length;
  return (
    cities * 10 +
    p.knownTech.length * 3 +
    units * 1 +
    p.resources.influence * 0.5
  );
}

export function checkWin(m: MatchState): void {
  if (m.winner) return;
  // Elimination
  for (const p of m.players) {
    if (p.eliminated) continue;
    const hasCity = Object.values(m.cities).some((c) => c.owner === p.id);
    if (!hasCity) p.eliminated = true;
  }
  const alive = m.players.filter((p) => !p.eliminated);
  if (alive.length === 1) {
    m.winner = alive[0].id;
    m.log.push(`${alive[0].name} wins by elimination!`);
    return;
  }
  // Round limit -> Legacy Score winner
  if (m.round > m.maxRounds) {
    let best: PlayerState | null = null;
    let bestScore = -Infinity;
    for (const p of alive) {
      const s = legacyScore(m, p);
      if (s > bestScore) {
        bestScore = s;
        best = p;
      }
    }
    if (best) {
      m.winner = best.id;
      m.log.push(`${best.name} wins by Legacy Score (${Math.round(bestScore)}).`);
    }
  }
}
