import { describe, it, expect } from "vitest";
import { hexDistance, hexNeighbors, hexesInRange, hexLine, hexToPixel, pixelToHex, hexEq } from "../src/engine/hex";

describe("hex math", () => {
  it("distance is 0 to self", () => {
    expect(hexDistance({ q: 3, r: 4 }, { q: 3, r: 4 })).toBe(0);
  });
  it("distance is 1 to each neighbor", () => {
    const center = { q: 5, r: 5 };
    for (const n of hexNeighbors(center)) {
      expect(hexDistance(center, n)).toBe(1);
    }
  });
  it("each hex has 6 neighbors", () => {
    expect(hexNeighbors({ q: 0, r: 0 }).length).toBe(6);
  });
  it("hexesInRange(c, 1) has 7 hexes (center + 6)", () => {
    expect(hexesInRange({ q: 0, r: 0 }, 1).length).toBe(7);
  });
  it("hexesInRange(c, 2) has 19 hexes", () => {
    expect(hexesInRange({ q: 0, r: 0 }, 2).length).toBe(19);
  });
  it("hexLine endpoints match input", () => {
    const a = { q: 0, r: 0 };
    const b = { q: 4, r: -2 };
    const line = hexLine(a, b);
    expect(hexEq(line[0], a)).toBe(true);
    expect(hexEq(line[line.length - 1], b)).toBe(true);
  });
  it("pixel <-> hex roundtrip", () => {
    const h = { q: 7, r: 3 };
    const p = hexToPixel(h, 30);
    const back = pixelToHex(p.x, p.y, 30);
    expect(hexEq(h, back)).toBe(true);
  });
});
