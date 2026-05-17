import React from "react";
import { useNavigate } from "react-router-dom";

const STEPS = [
  { title: "1. The Hex Grid", body: "Tap any tile to inspect it. Drag to pan, pinch or scroll to zoom. Darkened tiles are fog of war." },
  { title: "2. Units & Movement", body: "Tap one of your units (color-coded). White hexes = move range. Red hexes = enemies in attack range." },
  { title: "3. Combat & Retaliation", body: "Melee attacks: the defender hits back at half power if it survives. Ranged (range 2+) never triggers retaliation. Terrain gives defenders a bonus." },
  { title: "4. Cities & Economy", body: "Workers found a settlement (2 AP) on flats, ruin, or forest. Cities produce units and buildings from Scrap, Food, Power, and Tech income." },
  { title: "5. Research", body: "Tap TECH to spend Tech points on upgrades. Faction-unique branches give you tools no one else has." },
  { title: "6. The World Fights Back", body: "Radiation drifts. Dust storms move. The Bloom spreads. Each round these tick. Adapt." },
  { title: "7. Diplomacy", body: "Tap DIPLO for truce, peace, trade. Attacking an ally drops you to TRAITOR — the rest of the world remembers." },
  { title: "8. Your Warlord", body: "Create one in The Bunker. They persist across matches with XP and Salvage you can spend on gear." },
  { title: "9. Winning", body: "Each faction has a unique win condition. Otherwise: highest Legacy Score at round 30 wins." },
];

export function Tutorial() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen p-4 pb-20 overflow-y-auto">
      <button onClick={() => navigate("/")} className="text-ink text-sm mb-4">← Back</button>
      <h1 className="text-gold text-2xl font-black tracking-widest mb-4">HOW TO SURVIVE THE DUST</h1>
      {STEPS.map((s, i) => (
        <div key={i} className="border border-line rounded-lg p-3 mb-2">
          <div className="text-white font-bold">{s.title}</div>
          <div className="text-ink text-sm mt-1 leading-relaxed">{s.body}</div>
        </div>
      ))}
    </div>
  );
}
