import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapView } from "@components/MapView";
import { HudOverlay } from "@components/HudOverlay";
import { useMatchStore } from "@state/matchStore";
import { useMetaStore } from "@state/metaStore";
import { availableTech, TECH } from "@engine/tech";
import { BUILDINGS } from "@engine/cities";
import { UNITS } from "@engine/units";
import { FACTIONS } from "@engine/factions";
import { currentPlayer } from "@engine/match";
import { setDiplo, getDiplo } from "@engine/diplomacy";
import { saveMatch, clearMatch } from "@state/persistence";

export function Match() {
  const navigate = useNavigate();
  const match = useMatchStore((s) => s.match);
  const research = useMatchStore((s) => s.research);
  const queueUnit = useMatchStore((s) => s.queueUnit);
  const queueBuilding = useMatchStore((s) => s.queueBuilding);
  const endMatchMeta = useMetaStore((s) => s.endMatch);

  const [techOpen, setTechOpen] = useState(false);
  const [diploOpen, setDiploOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState<string | null>(null);

  useEffect(() => {
    if (match) saveMatch(match);
  }, [match]);

  useEffect(() => {
    if (match?.winner) {
      const human = match.players[0];
      const won = match.winner === human.id;
      const score = Object.values(match.cities).filter((c) => c.owner === human.id).length * 10;
      endMatchMeta(won, score);
      clearMatch();
    }
  }, [match?.winner, endMatchMeta, match]);

  if (!match) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-ink mb-6">No active match.</p>
        <button onClick={() => navigate("/")} className="btn btn-primary">Back to Menu</button>
      </div>
    );
  }

  const cur = currentPlayer(match);

  return (
    <div className="fixed inset-0 flex flex-col bg-bg">
      <MapView />
      <HudOverlay
        onOpenDiplo={() => setDiploOpen(true)}
        onOpenTech={() => setTechOpen(true)}
        onOpenCity={(id) => setCityOpen(id)}
      />

      {techOpen && (
        <Modal onClose={() => setTechOpen(false)} title="Research">
          {cur.queuedResearch && (
            <div className="text-choir text-sm mb-2">Queued: {cur.queuedResearch}</div>
          )}
          {availableTech(cur).map((k) => {
            const t = TECH[k];
            const canAfford = cur.resources.tech >= t.cost;
            return (
              <button
                key={k}
                disabled={!canAfford}
                className={`w-full flex items-center gap-2 py-3 border-b border-line text-left ${!canAfford && "opacity-40"}`}
                onClick={() => { if (research(k)) setTechOpen(false); }}
              >
                <div className="flex-1">
                  <div className="text-white text-sm font-semibold">{k} <span className="text-ink/50 text-xs">T{t.tier}</span></div>
                  <div className="text-ink text-xs">{t.desc}</div>
                </div>
                <div className="text-choir font-bold">{t.cost}⚙</div>
              </button>
            );
          })}
        </Modal>
      )}

      {diploOpen && (
        <Modal onClose={() => setDiploOpen(false)} title="Diplomacy">
          {match.players.filter((p) => p.id !== cur.id && !p.eliminated).map((other) => {
            const state = getDiplo(cur, other);
            const trust = cur.trust[other.id] ?? 0;
            return (
              <div key={other.id} className="flex items-center gap-2 py-3 border-b border-line">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: other.color }} />
                <div className="flex-1">
                  <div className="text-white text-sm font-semibold">{other.name} ({FACTIONS[other.faction].name})</div>
                  <div className="text-ink text-xs">State: {state} · Trust: {trust}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="bg-line text-ink text-xs px-2 py-1 rounded"
                    onClick={() => {
                      if (cur.resources.influence >= 5) {
                        cur.resources.influence -= 5;
                        setDiplo(cur, other, "truce");
                      }
                    }}
                  >Truce 5⚜</button>
                  <button
                    className="bg-rust text-white text-xs px-2 py-1 rounded"
                    onClick={() => setDiplo(cur, other, "war")}
                  >War</button>
                </div>
              </div>
            );
          })}
        </Modal>
      )}

      {cityOpen && match.cities[cityOpen] && (
        <Modal onClose={() => setCityOpen(null)} title="City">
          <div className="text-gold font-bold mt-1 mb-1 tracking-wider">BUILD UNIT</div>
          {Object.entries(UNITS)
            .filter(([, def]) => def.faction === "any" || def.faction === cur.faction)
            .map(([k, def]) => (
              <button
                key={k}
                className="w-full flex items-center gap-2 py-2 border-b border-line text-left"
                onClick={() => { if (cityOpen && queueUnit(cityOpen, k)) setCityOpen(null); }}
              >
                <div className="flex-1">
                  <div className="text-white text-sm font-semibold">{k}</div>
                  <div className="text-ink text-xs">HP {def.hpMax} · ATK {def.atk} · DEF {def.def}</div>
                </div>
                <div className="text-choir text-xs">{Object.entries(def.cost).map(([r, v]) => `${v}${r[0]}`).join(" ")}</div>
              </button>
            ))}
          <div className="text-gold font-bold mt-4 mb-1 tracking-wider">BUILD BUILDING</div>
          {Object.entries(BUILDINGS).map(([k, def]) => (
            <button
              key={k}
              className="w-full flex items-center gap-2 py-2 border-b border-line text-left"
              onClick={() => { if (cityOpen && queueBuilding(cityOpen, k)) setCityOpen(null); }}
            >
              <div className="flex-1">
                <div className="text-white text-sm font-semibold">{k}</div>
                <div className="text-ink text-xs">{Object.entries(def.cost as Record<string, number>).map(([r, v]) => `${v} ${r}`).join(", ")}</div>
              </div>
            </button>
          ))}
        </Modal>
      )}

      {match.winner && (
        <button
          onClick={() => navigate("/")}
          className="absolute bottom-20 inset-x-6 btn btn-primary z-50"
        >
          Return to Menu
        </button>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-40 flex items-end" onClick={onClose}>
      <div className="modal-card w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gold text-xl font-bold tracking-widest">{title}</h3>
          <button onClick={onClose} className="text-ink text-2xl px-2">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
