import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { MainMenu } from "@pages/MainMenu";
import { NewGame } from "@pages/NewGame";
import { Match } from "@pages/Match";
import { Bunker } from "@pages/Bunker";
import { Tutorial } from "@pages/Tutorial";
import { UpdateBanner } from "@components/UpdateBanner";
import { useMetaStore } from "@state/metaStore";
import { useMatchStore } from "@state/matchStore";
import { loadMatch } from "@state/persistence";

export default function App() {
  const loadMeta = useMetaStore((s) => s.load);
  const setMatch = useMatchStore((s) => s.loadMatch);

  useEffect(() => {
    loadMeta();
    const saved = loadMatch();
    if (saved) setMatch(saved);
  }, [loadMeta, setMatch]);

  return (
    <>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/new-game" element={<NewGame />} />
        <Route path="/match" element={<Match />} />
        <Route path="/bunker" element={<Bunker />} />
        <Route path="/tutorial" element={<Tutorial />} />
      </Routes>
      <UpdateBanner />
    </>
  );
}
