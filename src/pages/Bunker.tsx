import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMetaStore } from "@state/metaStore";
import { HERO_ARCHETYPES, HeroArchetype } from "@engine/heroes";
import itemsJson from "@data/items.json";

const ITEMS = itemsJson as Record<string, { slot: string; tier: number; cost: number; desc: string }>;

export function Bunker() {
  const navigate = useNavigate();
  const hero = useMetaStore((s) => s.hero);
  const createHero = useMetaStore((s) => s.createHero);
  const equip = useMetaStore((s) => s.equip);
  const spend = useMetaStore((s) => s.spendSalvage);
  const [name, setName] = useState("Dust");
  const [arch, setArch] = useState<HeroArchetype>("reaver");

  if (!hero) {
    return (
      <div className="min-h-screen p-4 pb-20 overflow-y-auto">
        <button onClick={() => navigate("/")} className="text-ink text-sm mb-4">← Back</button>
        <h1 className="text-gold text-3xl font-black tracking-widest mb-3">FORGE A WARLORD</h1>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full bg-bg border border-line rounded-md p-3 text-white mb-4"
        />

        <h2 className="text-gold font-bold mb-2 tracking-widest">PICK ARCHETYPE</h2>
        {Object.values(HERO_ARCHETYPES).map((a) => (
          <button
            key={a.id}
            onClick={() => setArch(a.id)}
            className={`w-full text-left border rounded-lg p-3 mb-2 ${arch === a.id ? "border-2 border-gold" : "border-line"}`}
          >
            <div className="text-white font-bold">{a.name}</div>
            <div className="text-ink/70 italic text-xs mt-0.5">{a.flavor}</div>
            <div className="text-ink text-xs mt-1">HP {a.baseStats.hp} · ATK {a.baseStats.atk} · DEF {a.baseStats.def}</div>
            <div className="text-choir text-xs mt-1">Signature: {a.signatureDesc}</div>
          </button>
        ))}

        <button onClick={() => createHero(arch, name)} className="btn btn-primary w-full mt-4">FORGE</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20 overflow-y-auto">
      <button onClick={() => navigate("/")} className="text-ink text-sm mb-4">← Back</button>
      <h1 className="text-gold text-3xl font-black tracking-widest">{hero.name}</h1>
      <div className="text-ink text-sm mt-1">
        {HERO_ARCHETYPES[hero.archetype].name} · Lvl {hero.level} · {hero.salvage} Salvage
      </div>
      <div className="text-ink/60 text-xs mt-1">HP {hero.stats.hp} · ATK {hero.stats.atk} · DEF {hero.stats.def}</div>
      <div className="text-ink/60 text-xs">Matches {hero.matchesPlayed} · Wins {hero.matchesWon}</div>

      <h2 className="text-gold font-bold mt-6 mb-2 tracking-widest">WORKBENCH</h2>
      {(["weapon", "armor", "relic", "companion"] as const).map((slot) => (
        <div key={slot} className="mb-4">
          <div className="text-ink mb-2 capitalize">{slot}: <span className="text-white">{hero.equipped[slot] ?? "—"}</span></div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.entries(ITEMS).filter(([, def]) => def.slot === slot).map(([k, def]) => {
              const owned = hero.equipped[slot] === k;
              return (
                <button
                  key={k}
                  onClick={() => {
                    if (owned) return equip(slot, undefined);
                    if (hero.salvage >= def.cost && spend(def.cost)) equip(slot, k);
                  }}
                  className={`flex-shrink-0 w-36 border rounded-md p-2 text-left ${owned ? "border-2 border-gold" : "border-line"}`}
                >
                  <div className="text-white text-xs font-semibold">{k}</div>
                  <div className="text-choir text-[10px] mt-1">T{def.tier} · {def.cost}</div>
                  <div className="text-ink/60 text-[10px] mt-1">{def.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
