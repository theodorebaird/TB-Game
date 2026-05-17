import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { MainMenu } from "@pages/MainMenu";
import { NewGame } from "@pages/NewGame";
import { Match } from "@pages/Match";
import { Bunker } from "@pages/Bunker";
import { Tutorial } from "@pages/Tutorial";
import { Settings } from "@pages/Settings";
import { UpdateBanner } from "@components/UpdateBanner";
import { useMetaStore } from "@state/metaStore";
import { useMatchStore } from "@state/matchStore";
import { loadMatch } from "@state/persistence";
import { initAudio } from "./lib/sounds";

export default function App() {
  const loadMeta = useMetaStore((s) => s.load);
  const setMatch = useMatchStore((s) => s.loadMatch);

  useEffect(() => {
    loadMeta();
    const saved = loadMatch();
    if (saved) setMatch(saved);
    // Audio context needs a user gesture to start — register a one-shot listener.
    const onFirstGesture = () => {
      initAudio();
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [loadMeta, setMatch]);

  return (
    <>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/new-game" element={<NewGame />} />
        <Route path="/match" element={<Match />} />
        <Route path="/bunker" element={<Bunker />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <UpdateBanner />
    </>
  );
}
