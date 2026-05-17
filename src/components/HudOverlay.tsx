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

  // Faction-tinted backdrop
  const tintStyle = {
    background: `linear-gradient(to bottom, ${fac.color}33 0%, transparent 80%)`,
  };
  const accent = fac.color;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      {/* TOP HUD with faction tint */}
      <div style={tintStyle} className="pointer-events-none absolute inset-x-0 top-0 h-32" />

      <div className="pointer-events-auto px-3 pt-12 pb-1 flex items-center justify-between relative">
        <span
          className="px-3 py-1 rounded-full text-bg font-bold text-xs tracking-widest font-display shadow-lg"
          style={{ backgroundColor: accent }}
        >
          {fac.name.replace("The ", "").toUpperCase()}
        </span>
        <span className="text-ink text-sm font-display tracking-wider">
          {match.round}/{match.maxRounds}
        </span>
        <span className="text-white text-sm font-display tracking-wider">
          AP <span style={{ color: accent }}>{cur.ap}</span>/{cur.apMax}
        </span>
      </div>

      <div className="pointer-events-auto px-3 py-1 flex flex-wrap gap-1.5 relative">
        <ResChip label="Scrap" v={cur.resources.scrap} color="#c97b3a" />
        <ResChip label="Food" v={cur.resources.food} color="#5fa86b" />
        <ResChip label="Power" v={cur.resources.power} color="#d4b048" />
        <ResChip label="Tech" v={cur.resources.tech} color="#7a6dbf" />
        <ResChip label="Inf" v={cur.resources.influence} color="#b94a4a" />
      </div>

      <div className="flex-1" />

      {/* CONTEXT PANEL */}
      <div
        className="pointer-events-auto px-3 py-3 border-t-2 backdrop-blur-sm"
        style={{
          background: "rgba(26,15,8,0.85)",
          borderColor: accent + "66",
        }}
      >
        {selectedUnit ? (
          <div>
            <div className="text-white font-display text-base tracking-wider">
              {selectedUnit.type.replace(/([A-Z])/g, " $1").trim()}
              {selectedUnit.isHero && <span className="text-gold ml-2">★</span>}
            </div>
            <div className="text-ink text-xs mt-1 flex gap-3 flex-wrap">
              <span>HP {selectedUnit.hp}/{selectedUnit.hpMax}</span>
              <span>ATK {selectedUnit.atk}</span>
              <span>DEF {selectedUnit.def}</span>
              <span>RNG {selectedUnit.range}</span>
              <span>MOV {selectedUnit.movement}</span>
            </div>
            <div className="text-ink/60 text-[10px] mt-1">
              XP {selectedUnit.xp} · Vet {selectedUnit.veterancy} · AP {selectedUnit.ap}
            </div>
            {(selectedUnit.abilities.includes("foundCity") || selectedUnit.abilities.includes("foundCamp")) && (
              <button
                onClick={() => foundCity()}
                className="mt-2 text-bg px-3 py-2 rounded font-bold text-sm tracking-wider font-display active:scale-95 transition-transform"
                style={{ backgroundColor: accent }}
              >
                FOUND SETTLEMENT (2 AP)
              </button>
            )}
          </div>
        ) : selectedCity ? (
          <div>
            <div className="text-white font-display text-base tracking-wider">CITY · pop {selectedCity.pop}</div>
            <div className="text-ink text-xs mt-1">HP {selectedCity.hp}/{selectedCity.hpMax} · {selectedCity.buildings.length} buildings</div>
            <button
              onClick={() => onOpenCity(selectedCity.id)}
              className="mt-2 text-bg px-3 py-2 rounded font-bold text-sm tracking-wider font-display active:scale-95 transition-transform"
              style={{ backgroundColor: accent }}
            >
              OPEN CITY PANEL
            </button>
          </div>
        ) : (
          <div className="text-ink/60 text-xs italic">Tap a unit or city. Drag to pan, pinch to zoom.</div>
        )}
        {match.log.length > 0 && (
          <div className="text-ink/40 text-[10px] mt-2 truncate font-mono">{match.log.slice(-1)[0]}</div>
        )}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="pointer-events-auto flex gap-2 p-3" style={{ background: "rgba(26,15,8,0.95)" }}>
        <button
          onClick={onOpenTech}
          className="flex-1 py-3 rounded-lg font-display tracking-widest text-sm border active:scale-95 transition-transform"
          style={{ borderColor: accent + "66", color: accent }}
        >
          TECH
        </button>
        <button
          onClick={onOpenDiplo}
          className="flex-1 py-3 rounded-lg font-display tracking-widest text-sm border active:scale-95 transition-transform"
          style={{ borderColor: accent + "66", color: accent }}
        >
          DIPLO
        </button>
        <button
          onClick={endTurn}
          className="flex-1 py-3 rounded-lg font-display tracking-widest text-sm font-bold text-bg active:scale-95 transition-transform shadow-lg"
          style={{ backgroundColor: accent }}
        >
          END TURN
        </button>
      </div>

      {match.winner && (
        <div className="pointer-events-auto absolute inset-0 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="text-gold text-5xl font-display font-black tracking-[0.4em] animate-pulse">
            {match.players.find((p) => p.id === match.winner)?.name === "You" ? "VICTORY" : "DEFEAT"}
          </div>
          <div className="text-ink mt-4 font-serif italic">
            {match.players.find((p) => p.id === match.winner)?.name} wins
          </div>
        </div>
      )}
    </div>
  );
}

function ResChip({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-md text-xs font-mono font-bold border bg-bg/60 backdrop-blur-sm"
      style={{ borderColor: color, color: "#fff" }}
    >
      <span style={{ color }}>{label}</span> {Math.round(v)}
    </span>
  );
}
