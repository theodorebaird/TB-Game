import { Hex } from "@engine/types";
import { hexToPixel } from "@engine/hex";

// Returns the 6 corners of a flat-top hex centered at (cx, cy) with given size (center-to-corner).
export function hexCorners(cx: number, cy: number, size: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    out.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
  }
  return out;
}

export function hexPolygonPath(cx: number, cy: number, size: number): string {
  const c = hexCorners(cx, cy, size);
  return `M${c[0].x} ${c[0].y} L${c[1].x} ${c[1].y} L${c[2].x} ${c[2].y} L${c[3].x} ${c[3].y} L${c[4].x} ${c[4].y} L${c[5].x} ${c[5].y} Z`;
}

export function getHexCenter(h: Hex, size: number, offsetX = 0, offsetY = 0): { x: number; y: number } {
  const p = hexToPixel(h, size);
  return { x: p.x + offsetX, y: p.y + offsetY };
}
