import React from "react";
import { useMatchStore } from "@state/matchStore";
import { currentPlayer } from "@engine/match";
import { FACTIONS } from "@engine/factions";

interface Props {
  onOpenDiplo: () => void;
  onOpenTech: () => void;
  onOpenCity: (cityId: string) => void;
}

export function HudOverlay({ onOpenDiplo, onOpenTech, onOpenCity }: Props) {
  const match = useMatchStore((s) => s.match);
  const endTurn = useMatchStore((s) => s.endTurn);
  const selectedUnitId = useMatchStore((s) => s.selectedUnitId);
  const foundCity = useMatchStore((s) => s.foundCity);

  if (!match) return null;
  const cur = currentPlayer(match);
  const fac = FACTIONS[cur.faction];

  const selectedUnit = selectedUnitId ? match.units[selectedUnitId] : null;
  const selectedTile = selectedUnit ? match.tiles[selectedUnit.hex.q][selectedUnit.hex.r] : null;
  const selectedCity = selectedTile?.cityId ? match.cities[selectedTile.cityId] : null;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      {/* TOP HUD */}
      <div className="pointer-events-auto px-3 pt-safe pt-3 pb-1 flex items-center justify-between bg-gradient-to-b from-bg/90 to-transparent">
        <span className="chip text-bg font-bold" style={{ backgroundColor: fac.color, borderColor: fac.color }}>
          {fac.name}
        </span>
        <span className="text-ink text-sm">Round {match.round}/{match.maxRounds}</span>
        <span className="text-white text-sm font-semibold">AP {cur.ap}/{cur.apMax}</span>
      </div>
      <div className="pointer-events-auto px-3 py-1 flex flex-wrap gap-1 bg-bg/70">
        <ResChip label="Scrap" v={cur.resources.scrap} color="#c97b3a" />
        <ResChip label="Food" v={cur.resources.food} color="#5fa86b" />
        <ResChip label="Power" v={cur.resources.power} color="#d4b048" />
        <ResChip label="Tech" v={cur.resources.tech} color="#7a6dbf" />
        <ResChip label="Inf" v={cur.resources.influence} color="#b94a4a" />
      </div>

      <div className="flex-1" />

      {/* CONTEXT PANEL */}
      <div className="pointer-events-auto bg-bg/85 border-t border-line px-3 py-3">
        {selectedUnit ? (
          <div>
            <div className="text-white font-bold">{selectedUnit.type} {selectedUnit.isHero && <span className="text-gold">★</span>}</div>
            <div className="text-ink text-xs mt-1">
              HP {selectedUnit.hp}/{selectedUnit.hpMax} · ATK {selectedUnit.atk} · DEF {selectedUnit.def} · Range {selectedUnit.range} · Move {selectedUnit.movement}
            </div>
            <div className="text-ink text-xs">XP {selectedUnit.xp} · Vet {selectedUnit.veterancy} · AP {selectedUnit.ap}</div>
            {(selectedUnit.abilities.includes("foundCity") || selectedUnit.abilities.includes("foundCamp")) && (
              <button
                onClick={() => foundCity()}
                className="mt-2 bg-ember text-bg px-3 py-2 rounded font-bold text-sm"
              >
                Found Settlement (2 AP)
              </button>
            )}
          </div>
        ) : selectedCity ? (
          <div>
            <div className="text-white font-bold">City · pop {selectedCity.pop}</div>
            <div className="text-ink text-xs mt-1">HP {selectedCity.hp}/{selectedCity.hpMax} · Buildings {selectedCity.buildings.length}</div>
            <button
              onClick={() => onOpenCity(selectedCity.id)}
              className="mt-2 bg-ember text-bg px-3 py-2 rounded font-bold text-sm"
            >
              Open city panel
            </button>
          </div>
        ) : (
          <div className="text-ink/60 text-xs italic">Tap a unit or city. Drag to pan, pinch to zoom.</div>
        )}
        {match.log.length > 0 && (
          <div className="text-ink/40 text-[10px] mt-2 truncate">{match.log.slice(-1)[0]}</div>
        )}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="pointer-events-auto flex gap-2 p-3 bg-bg/95 pb-safe">
        <button onClick={onOpenTech} className="btn flex-1 !py-3 !text-sm">Tech</button>
        <button onClick={onOpenDiplo} className="btn flex-1 !py-3 !text-sm">Diplo</button>
        <button onClick={endTurn} className="btn btn-primary flex-1 !py-3">End Turn</button>
      </div>

      {match.winner && (
        <div className="pointer-events-auto absolute inset-0 bg-black/85 flex flex-col items-center justify-center">
          <div className="text-gold text-4xl font-black tracking-widest">
            {match.players.find((p) => p.id === match.winner)?.name} WINS
          </div>
        </div>
      )}
    </div>
  );
}

function ResChip({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <span className="chip text-white" style={{ borderColor: color }}>
      <span style={{ color }}>{label}</span> {Math.round(v)}
    </span>
  );
}
