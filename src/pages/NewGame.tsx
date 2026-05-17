import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FACTIONS, FACTION_LIST } from "@engine/factions";
import { useMatchStore } from "@state/matchStore";
import { Faction } from "@engine/types";

export function NewGame() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<Faction>("scrappers");
  const [opponents, setOpponents] = useState(2);
  const startMatch = useMatchStore((s) => s.startMatch);

  function start() {
    const others = FACTION_LIST.filter((f) => f !== picked);
    const ai = others.sort(() => Math.random() - 0.5).slice(0, opponents);
    startMatch([picked, ...ai]);
    navigate("/match");
  }

  return (
    <div className="min-h-screen p-4 pb-20 overflow-y-auto">
      <button onClick={() => navigate("/")} className="text-ink text-sm mb-4">← Back</button>

      <h2 className="text-gold text-2xl font-bold tracking-widest mb-4">PICK YOUR FACTION</h2>
      <div className="space-y-2">
        {FACTION_LIST.map((f) => {
          const def = FACTIONS[f];
          const sel = picked === f;
          return (
            <button
              key={f}
              onClick={() => setPicked(f)}
              className={`w-full text-left flex gap-3 border rounded-lg p-3 ${sel ? "border-2" : "border-line"}`}
              style={sel ? { borderColor: def.color } : undefined}
            >
              <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: def.color }} />
              <div className="flex-1">
                <div className="text-white font-bold">{def.name}</div>
                <div className="text-ink/70 text-xs italic mt-0.5">"{def.motto}"</div>
                <div className="text-ink text-xs mt-1.5">{def.passive}</div>
                <div className="text-gold/80 text-xs mt-1">Win: {def.winCondition}</div>
              </div>
            </button>
          );
        })}
      </div>

      <h2 className="text-gold text-2xl font-bold tracking-widest mt-6 mb-3">OPPONENTS</h2>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setOpponents(n)}
            className={`py-4 rounded-lg font-bold text-lg border ${opponents === n ? "bg-gold text-bg border-gold" : "border-line text-ink"}`}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        onClick={start}
        className="btn btn-primary w-full mt-8 !py-5 !text-xl !tracking-[0.4em]"
      >
        BEGIN
      </button>
    </div>
  );
}
