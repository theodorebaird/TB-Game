// Procedural sprite drawing — no PNG assets needed. Each unit type gets a
// characterful silhouette built from canvas paths. Keeps the bundle tiny.

import { Faction } from "@engine/types";

export interface SpriteCtx {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  size: number;
  color: string;
  flashAmount?: number; // 0..1, how white-flashed the unit is
}

function applyFlash(color: string, flash: number): string {
  if (flash <= 0) return color;
  const t = Math.min(1, flash);
  const c = parseHex(color);
  const r = Math.round(c.r * (1 - t) + 255 * t);
  const g = Math.round(c.g * (1 - t) + 255 * t);
  const b = Math.round(c.b * (1 - t) + 255 * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function parseHex(h: string): { r: number; g: number; b: number } {
  const x = h.replace("#", "");
  return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Dispatcher
export function drawUnit(s: SpriteCtx, unitType: string) {
  shadow(s.ctx, s.x, s.y + s.size * 0.35, s.size * 0.5, s.size * 0.15);
  const color = applyFlash(s.color, s.flashAmount ?? 0);
  const draw = UNIT_DRAWERS[unitType] ?? UNIT_DRAWERS.default;
  draw({ ...s, color });
}

// Each drawer paints relative to (s.x, s.y) which is the hex center.
const UNIT_DRAWERS: Record<string, (s: SpriteCtx) => void> = {
  // Generic infantry — small humanoid with helmet
  warrior: (s) => drawHumanoid(s, { helmet: true }),
  scout: (s) => drawHumanoid(s, { slim: true }),
  archer: (s) => drawHumanoid(s, { bow: true }),

  // Scrappers
  wrenchGang: (s) => drawHumanoid(s, { spikes: true }),
  junkerMech: (s) => drawMech(s),
  picker: (s) => drawHumanoid(s, { worker: true }),

  // Reclaimers
  sporeWeaver: (s) => drawWeaver(s),
  broodMother: (s) => drawBeast(s),
  vinekin: (s) => drawHumanoid(s, { worker: true, biological: true }),

  // Choir
  whisperer: (s) => drawRobed(s),
  choirVox: (s) => drawRobed(s, { halo: true }),
  acolyte: (s) => drawRobed(s, { small: true }),

  // Hollow Legion
  linebreaker: (s) => drawHumanoid(s, { helmet: true, shield: true }),
  howitzer: (s) => drawArtillery(s),
  engineer: (s) => drawHumanoid(s, { helmet: true, worker: true }),

  // Drifters
  skirmishRider: (s) => drawRider(s),
  sandbarge: (s) => drawBarge(s),
  pathfinder: (s) => drawHumanoid(s, { slim: true, worker: true }),

  husk: (s) => drawHusk(s),

  default: (s) => drawHumanoid(s, {}),
};

// Hero variants — handled by type pattern "hero_*"
export function drawHero(s: SpriteCtx, archetype: string) {
  shadow(s.ctx, s.x, s.y + s.size * 0.4, s.size * 0.6, s.size * 0.18);
  const color = applyFlash(s.color, s.flashAmount ?? 0);
  drawHumanoid({ ...s, color, size: s.size * 1.15 }, { helmet: true, hero: true });
}

// --- Primitive drawers ---

function drawHumanoid(
  s: SpriteCtx,
  opts: { helmet?: boolean; shield?: boolean; bow?: boolean; spikes?: boolean; worker?: boolean; slim?: boolean; biological?: boolean; hero?: boolean }
) {
  const { ctx, x, y, size, color } = s;
  const u = size * 0.32;
  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  if (opts.slim) {
    ctx.ellipse(x, y, u * 0.6, u * 1.1, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(x, y, u * 0.85, u * 1.1, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  // Head
  ctx.fillStyle = mix(color, "#1a0f08", 0.3);
  ctx.beginPath();
  ctx.arc(x, y - u, u * 0.6, 0, Math.PI * 2);
  ctx.fill();
  if (opts.helmet) {
    ctx.fillStyle = mix(color, "#000", 0.4);
    ctx.beginPath();
    ctx.arc(x, y - u, u * 0.65, Math.PI, Math.PI * 2);
    ctx.fill();
    if (opts.hero) {
      // Gold crest
      ctx.fillStyle = "#d4b048";
      ctx.fillRect(x - 1.5, y - u - u * 0.65 - 2, 3, 5);
    }
  }
  if (opts.shield) {
    ctx.fillStyle = mix(color, "#fff", 0.2);
    ctx.beginPath();
    ctx.ellipse(x - u * 0.8, y + u * 0.1, u * 0.45, u * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = mix(color, "#000", 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (opts.bow) {
    ctx.strokeStyle = "#8a5a20";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + u * 0.6, y - u * 0.2, u * 0.7, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
  }
  if (opts.spikes) {
    ctx.fillStyle = mix(color, "#000", 0.5);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * u * 0.85, y + Math.sin(a) * u);
      ctx.lineTo(x + Math.cos(a) * u * 1.3, y + Math.sin(a) * u * 1.3);
      ctx.lineTo(x + Math.cos(a + 0.2) * u * 0.85, y + Math.sin(a + 0.2) * u);
      ctx.fill();
    }
  }
  if (opts.worker) {
    // Tool icon — small wrench/staff
    ctx.strokeStyle = "#d4b048";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + u * 0.7, y - u * 0.5);
    ctx.lineTo(x + u * 1.1, y + u * 0.3);
    ctx.stroke();
  }
  if (opts.biological) {
    ctx.strokeStyle = "#5fa86b";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - u * 0.6, y + u * 0.5);
      ctx.quadraticCurveTo(x + (i - 1) * u * 0.3, y + u * 1.5, x + u * 0.6, y + u * 0.5);
      ctx.stroke();
    }
  }
}

function drawMech(s: SpriteCtx) {
  const { ctx, x, y, size, color } = s;
  const u = size * 0.42;
  // Legs
  ctx.fillStyle = mix(color, "#000", 0.4);
  ctx.fillRect(x - u * 0.8, y + u * 0.5, u * 0.5, u * 0.6);
  ctx.fillRect(x + u * 0.3, y + u * 0.5, u * 0.5, u * 0.6);
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x - u, y - u * 0.5, u * 2, u);
  ctx.strokeStyle = "#1a0f08";
  ctx.lineWidth = 1;
  ctx.strokeRect(x - u, y - u * 0.5, u * 2, u);
  // Cockpit window
  ctx.fillStyle = "#7a6dbf";
  ctx.fillRect(x - u * 0.5, y - u * 0.3, u, u * 0.4);
  // Antenna
  ctx.strokeStyle = "#d4b048";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - u * 0.5);
  ctx.lineTo(x, y - u);
  ctx.stroke();
}

function drawArtillery(s: SpriteCtx) {
  const { ctx, x, y, size, color } = s;
  const u = size * 0.38;
  // Base
  ctx.fillStyle = mix(color, "#000", 0.4);
  ctx.fillRect(x - u, y + u * 0.2, u * 2, u * 0.5);
  // Wheels
  ctx.fillStyle = "#1a0f08";
  ctx.beginPath();
  ctx.arc(x - u * 0.6, y + u * 0.8, u * 0.3, 0, Math.PI * 2);
  ctx.arc(x + u * 0.6, y + u * 0.8, u * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Barrel
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.4);
  ctx.fillRect(-u * 0.15, -u * 1.3, u * 0.3, u * 1.5);
  ctx.restore();
}

function drawRobed(s: SpriteCtx, opts: { halo?: boolean; small?: boolean } = {}) {
  const { ctx, x, y, size, color } = s;
  const u = size * (opts.small ? 0.28 : 0.36);
  // Robe (triangle)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - u);
  ctx.lineTo(x - u * 0.9, y + u * 1.1);
  ctx.lineTo(x + u * 0.9, y + u * 1.1);
  ctx.closePath();
  ctx.fill();
  // Hood/head
  ctx.fillStyle = mix(color, "#000", 0.5);
  ctx.beginPath();
  ctx.arc(x, y - u * 0.7, u * 0.55, 0, Math.PI * 2);
  ctx.fill();
  if (opts.halo) {
    ctx.strokeStyle = "#d4b048";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - u * 0.7, u * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawWeaver(s: SpriteCtx) {
  const { ctx, x, y, size, color } = s;
  const u = size * 0.36;
  // Bulbous body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + u * 0.2, u * 0.9, u * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Spore puffs
  ctx.fillStyle = mix(color, "#fff", 0.4);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * u * 0.7, y - u * 0.4 + Math.sin(a) * u * 0.3, u * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  // Tendrils
  ctx.strokeStyle = mix(color, "#000", 0.4);
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (i - 1) * u * 0.4, y + u);
    ctx.quadraticCurveTo(x + (i - 1) * u * 0.6, y + u * 1.4, x + (i - 1) * u * 0.3, y + u * 1.5);
    ctx.stroke();
  }
}

function drawBeast(s: SpriteCtx) {
  const { ctx, x, y, size, color } = s;
  const u = size * 0.42;
  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + u * 0.1, u, u * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Spines
  ctx.fillStyle = mix(color, "#000", 0.4);
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * u * 0.3, y - u * 0.3);
    ctx.lineTo(x + i * u * 0.3, y - u * 0.8);
    ctx.lineTo(x + i * u * 0.3 + 3, y - u * 0.4);
    ctx.fill();
  }
  // Eyes
  ctx.fillStyle = "#d4b048";
  ctx.beginPath();
  ctx.arc(x - u * 0.4, y, 1.5, 0, Math.PI * 2);
  ctx.arc(x + u * 0.4, y, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawRider(s: SpriteCtx) {
  const { ctx, x, y, size, color } = s;
  const u = size * 0.38;
  // Mount body
  ctx.fillStyle = mix(color, "#000", 0.3);
  ctx.beginPath();
  ctx.ellipse(x, y + u * 0.3, u, u * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Mount legs
  ctx.fillRect(x - u * 0.7, y + u * 0.5, u * 0.2, u * 0.5);
  ctx.fillRect(x + u * 0.5, y + u * 0.5, u * 0.2, u * 0.5);
  // Rider body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y - u * 0.2, u * 0.4, u * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = mix(color, "#1a0f08", 0.3);
  ctx.beginPath();
  ctx.arc(x, y - u * 0.8, u * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBarge(s: SpriteCtx) {
  const { ctx, x, y, size, color } = s;
  const u = size * 0.42;
  // Hull (trapezoid)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - u, y + u * 0.5);
  ctx.lineTo(x + u, y + u * 0.5);
  ctx.lineTo(x + u * 0.7, y - u * 0.2);
  ctx.lineTo(x - u * 0.7, y - u * 0.2);
  ctx.closePath();
  ctx.fill();
  // Sail
  ctx.fillStyle = mix(color, "#fff", 0.3);
  ctx.beginPath();
  ctx.moveTo(x, y - u * 1.1);
  ctx.lineTo(x + u * 0.6, y - u * 0.2);
  ctx.lineTo(x - u * 0.6, y - u * 0.2);
  ctx.closePath();
  ctx.fill();
  // Mast
  ctx.strokeStyle = "#1a0f08";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - u * 1.1);
  ctx.lineTo(x, y - u * 0.2);
  ctx.stroke();
}

function drawHusk(s: SpriteCtx) {
  const { ctx, x, y, size, color } = s;
  const u = size * 0.34;
  // Hunched body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + u * 0.3, u * 0.8, u * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.fillStyle = mix(color, "#000", 0.5);
  ctx.beginPath();
  ctx.arc(x - u * 0.3, y - u * 0.2, u * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Glowing eye
  ctx.fillStyle = "#aaff44";
  ctx.beginPath();
  ctx.arc(x - u * 0.3, y - u * 0.2, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

// --- City sprites per faction ---
export function drawCity(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  faction: Faction,
  isCapital: boolean
) {
  shadow(ctx, x, y + size * 0.45, size * 0.7, size * 0.18);

  switch (faction) {
    case "scrappers":
      drawScrapperCity(ctx, x, y, size, color);
      break;
    case "reclaimers":
      drawReclaimerCity(ctx, x, y, size, color);
      break;
    case "choir":
      drawChoirCity(ctx, x, y, size, color);
      break;
    case "hollow":
      drawHollowCity(ctx, x, y, size, color);
      break;
    case "drifters":
      drawDrifterCity(ctx, x, y, size, color);
      break;
  }
  if (isCapital) {
    // Gold star above
    ctx.fillStyle = "#d4b048";
    drawStar(ctx, x, y - size * 0.65, 5, 4);
  }
}

function drawScrapperCity(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const u = size * 0.55;
  ctx.fillStyle = mix(color, "#000", 0.2);
  // Welded tower silhouette
  ctx.beginPath();
  ctx.moveTo(x - u * 0.6, y + u * 0.5);
  ctx.lineTo(x - u * 0.5, y - u * 0.2);
  ctx.lineTo(x - u * 0.2, y - u * 0.4);
  ctx.lineTo(x, y - u * 0.6);
  ctx.lineTo(x + u * 0.3, y - u * 0.3);
  ctx.lineTo(x + u * 0.5, y - u * 0.1);
  ctx.lineTo(x + u * 0.6, y + u * 0.5);
  ctx.closePath();
  ctx.fill();
  // Spikes
  ctx.strokeStyle = "#d4b048";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (i - 1) * u * 0.3, y - u * 0.2);
    ctx.lineTo(x + (i - 1) * u * 0.3 + 1, y - u * 0.7);
    ctx.stroke();
  }
}

function drawReclaimerCity(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const u = size * 0.55;
  // Mushroom dome
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, u * 0.7, Math.PI, Math.PI * 2);
  ctx.fill();
  // Stalk
  ctx.fillStyle = mix(color, "#000", 0.3);
  ctx.fillRect(x - u * 0.25, y, u * 0.5, u * 0.5);
  // Spores
  ctx.fillStyle = mix(color, "#fff", 0.4);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + (i - 1) * u * 0.3, y - u * 0.2, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawChoirCity(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const u = size * 0.55;
  // Tall spire
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - u * 0.7);
  ctx.lineTo(x - u * 0.35, y + u * 0.5);
  ctx.lineTo(x + u * 0.35, y + u * 0.5);
  ctx.closePath();
  ctx.fill();
  // Halo
  ctx.strokeStyle = "#d4b048";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y - u * 0.7, u * 0.25, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHollowCity(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const u = size * 0.55;
  // Bunker — squared block with crenellations
  ctx.fillStyle = mix(color, "#000", 0.2);
  ctx.fillRect(x - u * 0.6, y - u * 0.3, u * 1.2, u * 0.8);
  // Crenellations
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x - u * 0.6 + i * u * 0.32, y - u * 0.5, u * 0.18, u * 0.2);
  }
  // Flag
  ctx.strokeStyle = "#1a0f08";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - u * 0.5);
  ctx.lineTo(x, y - u * 0.9);
  ctx.stroke();
  ctx.fillStyle = "#b94a4a";
  ctx.fillRect(x, y - u * 0.9, u * 0.25, u * 0.18);
}

function drawDrifterCity(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const u = size * 0.55;
  // Tent silhouette
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - u * 0.6, y + u * 0.5);
  ctx.lineTo(x, y - u * 0.6);
  ctx.lineTo(x + u * 0.6, y + u * 0.5);
  ctx.closePath();
  ctx.fill();
  // Center pole
  ctx.strokeStyle = "#1a0f08";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - u * 0.6);
  ctx.lineTo(x, y + u * 0.5);
  ctx.stroke();
  // Cloth band
  ctx.fillStyle = mix(color, "#fff", 0.25);
  ctx.fillRect(x - u * 0.3, y + u * 0.1, u * 0.6, 3);
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, radius: number) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function mix(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa.r * (1 - t) + pb.r * t);
  const g = Math.round(pa.g * (1 - t) + pb.g * t);
  const bl = Math.round(pa.b * (1 - t) + pb.b * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}
