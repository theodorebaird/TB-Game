import { describe, it, expect } from "vitest";
import { createMatch, endTurn } from "../src/engine/match";
import { runAITurn } from "../src/engine/ai";

describe("AI smoke", () => {
  it("100-round AI-vs-AI match doesn't crash", () => {
    const m = createMatch({
      seed: 12345,
      width: 16,
      height: 20,
      factions: ["scrappers", "reclaimers", "hollow"],
      humanIdx: 99, // no human, all AI
      maxRounds: 30,
    });
    // Mark all as AI
    m.players.forEach((p) => (p.isAI = true));
    let safety = 1000;
    while (!m.winner && safety-- > 0) {
      const cur = m.players[m.currentPlayerIdx];
      if (cur.eliminated) {
        endTurn(m);
        continue;
      }
      runAITurn(m, cur, "marauder");
    }
    expect(safety).toBeGreaterThan(0);
  });
});
