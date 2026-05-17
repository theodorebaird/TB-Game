import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkForUpdate, applyUpdate } from "../lib/pwa";
import { useMetaStore } from "@state/metaStore";
import { clearMatch } from "@state/persistence";

const APP_VERSION = "0.1.0";

type Status = "idle" | "checking" | "current" | "updated" | "unavailable";

export function Settings() {
  const navigate = useNavigate();
  const reset = useMetaStore((s) => s.reset);
  const [status, setStatus] = useState<Status>("idle");
  const [confirmErase, setConfirmErase] = useState(false);

  async function handleCheck() {
    setStatus("checking");
    const result = await checkForUpdate();
    setStatus(result);
  }

  function handleErase() {
    if (!confirmErase) {
      setConfirmErase(true);
      return;
    }
    reset();
    clearMatch();
    setConfirmErase(false);
    navigate("/");
  }

  return (
    <div className="min-h-screen p-4 pb-20 overflow-y-auto">
      <button onClick={() => navigate("/")} className="text-ink text-sm mb-4">← Back</button>
      <h1 className="text-gold text-3xl font-black tracking-widest mb-6">SETTINGS</h1>

      {/* APP UPDATE */}
      <section className="mb-8">
        <h2 className="text-gold font-bold mb-2 tracking-widest">APP UPDATE</h2>
        <div className="border border-line rounded-lg p-4">
          <div className="text-ink text-xs mb-1">Current version</div>
          <div className="text-white font-mono mb-4">v{APP_VERSION}</div>

          <button
            onClick={handleCheck}
            disabled={status === "checking"}
            className="btn btn-primary w-full !py-3"
          >
            {status === "checking" ? "CHECKING…" : "CHECK FOR UPDATES"}
          </button>

          {status === "updated" && (
            <div className="mt-3 p-3 bg-gold/20 border border-gold rounded">
              <div className="text-gold font-bold text-sm mb-2">New version available!</div>
              <button onClick={applyUpdate} className="btn btn-primary w-full !py-2 !text-sm">
                INSTALL UPDATE NOW
              </button>
            </div>
          )}
          {status === "current" && (
            <div className="mt-3 text-bloom text-sm text-center">✓ You're on the latest version.</div>
          )}
          {status === "unavailable" && (
            <div className="mt-3 text-ink/60 text-xs text-center italic">
              Update check unavailable. The service worker only runs in the installed/deployed app, not local dev.
            </div>
          )}
        </div>
      </section>

      {/* DANGER ZONE */}
      <section className="mb-8">
        <h2 className="text-rust font-bold mb-2 tracking-widest">DANGER ZONE</h2>
        <div className="border border-rust/50 rounded-lg p-4">
          <div className="text-ink text-xs mb-3">
            Erases your Warlord, all progress, salvage, and any active match. Cannot be undone.
          </div>
          <button
            onClick={handleErase}
            className={`w-full py-3 rounded-lg font-bold tracking-widest border ${
              confirmErase ? "bg-rust text-white border-rust" : "border-rust text-rust"
            }`}
          >
            {confirmErase ? "TAP AGAIN TO CONFIRM" : "ERASE ALL DATA"}
          </button>
          {confirmErase && (
            <button
              onClick={() => setConfirmErase(false)}
              className="w-full text-ink/60 text-sm mt-2"
            >
              Cancel
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
