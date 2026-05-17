import React from "react";
import { Link } from "react-router-dom";
import { useMetaStore } from "@state/metaStore";

export function MainMenu() {
  const hero = useMetaStore((s) => s.hero);

  return (
    <div className="min-h-screen flex flex-col px-6 pt-20 pb-8">
      <div className="flex-1 flex flex-col items-center justify-center">
        <img src="/logo.svg" alt="TB Game" className="w-40 h-40 mb-6" />
        <h1 className="text-6xl font-black text-gold tracking-[0.4em]">TB GAME</h1>
        <p className="text-ink/60 text-xs tracking-[0.3em] mt-2 uppercase">Tribes of the Endless Dust</p>
      </div>

      <div className="space-y-3 mb-10">
        <Link to="/new-game" className="btn btn-primary block">New Game</Link>
        <Link to="/tutorial" className="btn block">Tutorial</Link>
        <Link to="/bunker" className="btn block">The Bunker</Link>
        <Link to="/settings" className="btn block">Settings</Link>
      </div>

      <div className="text-center text-ink/50 text-xs">
        {hero ? (
          <span>{hero.name} · Lvl {hero.level} · {hero.salvage} Salvage</span>
        ) : (
          <span>No Warlord yet. Visit The Bunker to create one.</span>
        )}
      </div>
    </div>
  );
}
