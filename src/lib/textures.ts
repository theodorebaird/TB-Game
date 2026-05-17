// Per-terrain hex texture overlays drawn into offscreen canvases once and reused.
// Adds visual depth without art assets.

import { Terrain } from "@engine/types";

const cache = new Map<Terrain, HTMLCanvasElement>();

export function getTerrainTexture(terrain: Terrain, size: number): HTMLCanvasElement {
  const key = terrain;
  if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement("canvas");
  const px = Math.ceil(size * 2);
  c.width = px;
  c.height = px;
  const ctx = c.getContext("2d")!;
  // Seeded RNG so terrain noise is deterministic per type
  let s = hash(terrain);
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  switch (terrain) {
    case "flats":
      drawSpeckles(ctx, px, rng, "#0002", 24);
      break;
    case "dune":
      drawWaves(ctx, px, rng, "#fff2", 4);
      break;
    case "ruin":
      drawBlocks(ctx, px, rng, "#0003");
      break;
    case "forest":
      drawDots(ctx, px, rng, "#0004", 18, 2.5);
      drawDots(ctx, px, rng, "#fff1", 8, 1.2);
      break;
    case "marsh":
      drawWaves(ctx, px, rng, "#0004", 6);
      drawDots(ctx, px, rng, "#fff1", 10, 1);
      break;
    case "mountain":
      drawTriangles(ctx, px, rng, "#0006");
      break;
    case "water":
      drawWaves(ctx, px, rng, "#fff3", 5);
      drawWaves(ctx, px, rng, "#fff1", 8);
      break;
    case "road":
      drawDashes(ctx, px, rng, "#fff2");
      break;
    case "crater":
      drawConcentric(ctx, px, "#0005");
      drawSpeckles(ctx, px, rng, "#fff1", 12);
      break;
  }
  cache.set(key, c);
  return c;
}

function drawSpeckles(ctx: CanvasRenderingContext2D, size: number, rng: () => number, color: string, n: number) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 0.8 + rng() * 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
function drawDots(ctx: CanvasRenderingContext2D, size: number, rng: () => number, color: string, n: number, r: number) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
function drawWaves(ctx: CanvasRenderingContext2D, size: number, rng: () => number, color: string, count: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 0; i < count; i++) {
    const y = rng() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 6) {
      ctx.lineTo(x, y + Math.sin(x * 0.4 + i) * 1.6);
    }
    ctx.stroke();
  }
}
function drawBlocks(ctx: CanvasRenderingContext2D, size: number, rng: () => number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < 8; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const w = 3 + rng() * 5;
    const h = 3 + rng() * 5;
    ctx.fillRect(x, y, w, h);
  }
}
function drawTriangles(ctx: CanvasRenderingContext2D, size: number, rng: () => number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const h = 6 + rng() * 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - h * 0.5, y + h);
    ctx.lineTo(x + h * 0.5, y + h);
    ctx.closePath();
    ctx.fill();
  }
}
function drawDashes(ctx: CanvasRenderingContext2D, size: number, rng: () => number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}
function drawConcentric(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let r = 4; r < size / 2; r += 4) {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}
