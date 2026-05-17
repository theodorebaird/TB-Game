import React from "react";
import { Link } from "react-router-dom";
import { useMetaStore } from "@state/metaStore";

export function MainMenu() {
  const hero = useMetaStore((s) => s.hero);

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-8 relative overflow-hidden">
      {/* Ambient background flicker */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: "radial-gradient(ellipse at top, #3a2515 0%, transparent 60%), radial-gradient(ellipse at bottom, #0a0508 0%, transparent 70%)",
        }}
      />

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <img src="/logo.svg" alt="TB Game" className="w-44 h-44 mb-6 drop-shadow-[0_8px_20px_rgba(212,176,72,0.3)]" />
        <h1 className="font-display text-6xl font-black text-gold tracking-[0.4em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          TB GAME
        </h1>
        <p className="font-serif italic text-ink/70 text-sm tracking-[0.3em] mt-3 uppercase">
          Tribes of the Endless Dust
        </p>
      </div>

      <div className="space-y-3 mb-10 relative">
        <Link to="/new-game" className="btn btn-primary block font-display">New Game</Link>
        <Link to="/tutorial" className="btn block font-display">Tutorial</Link>
        <Link to="/bunker" className="btn block font-display">The Bunker</Link>
        <Link to="/settings" className="btn block font-display">Settings</Link>
      </div>

      <div className="text-center text-ink/50 text-xs font-serif italic relative">
        {hero ? (
          <span>{hero.name} · Lvl {hero.level} · {hero.salvage} Salvage</span>
        ) : (
          <span>No Warlord yet. Visit The Bunker to forge one.</span>
        )}
      </div>
    </div>
  );
}
