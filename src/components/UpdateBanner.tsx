import React, { useEffect, useState } from "react";
import { registerServiceWorker, applyUpdate } from "../lib/pwa";

export function UpdateBanner() {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    registerServiceWorker({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => {
        // could show a toast — silent for now
      },
    });
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-gold text-bg rounded-lg shadow-lg p-3 flex items-center gap-3">
      <div className="flex-1">
        <div className="font-bold text-sm">New version available</div>
        <div className="text-xs opacity-80">Tap to reload with the latest update.</div>
      </div>
      <button
        onClick={applyUpdate}
        className="bg-bg text-gold font-extrabold px-4 py-2 rounded text-sm tracking-wider"
      >
        UPDATE
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-bg opacity-60 px-2"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
