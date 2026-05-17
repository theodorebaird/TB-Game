import React, { useEffect, useRef, useState, useCallback } from "react";
import { useMatchStore } from "@state/matchStore";
import { TERRAIN } from "@engine/terrain";
import { hexToPixel, pixelToHex, hexNeighbors, hexEq, HEX_DIRS, hexAdd } from "@engine/hex";
import { Hex } from "@engine/types";
import { animations } from "../lib/animations";
import { getTerrainTexture } from "../lib/textures";
import { drawUnit, drawHero, drawCity } from "../lib/sprites";

const HEX_SIZE = 30;

export function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef({ panX: 200, panY: 200, scale: 1 });
  const [, forceRender] = useState(0);
  const rafRef = useRef<number | null>(null);

  const dragState = useRef<{ active: boolean; startX: number; startY: number; startPanX: number; startPanY: number; moved: boolean } | null>(null);
  const pinchState = useRef<{ active: boolean; startDist: number; startScale: number } | null>(null);

  const match = useMatchStore((s) => s.match);
  const selectedUnitId = useMatchStore((s) => s.selectedUnitId);
  const highlightedMoves = useMatchStore((s) => s.highlightedMoves);
  const highlightedAttacks = useMatchStore((s) => s.highlightedAttacks);
  const selectUnit = useMatchStore((s) => s.selectUnit);
  const moveSelected = useMatchStore((s) => s.moveSelected);
  const attackSelected = useMatchStore((s) => s.attackSelected);

  // --- The render loop ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !match) return;
    const ctx = canvas.getContext("2d")!;
    const view = viewRef.current;
    const now = performance.now();
    animations.prune(now);
    const shake = animations.shakeOffset(now);
    const ambient = Math.sin(now / 800) * 0.5 + 0.5; // 0..1, pulses every ~5s

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width / dpr;
    const ch = canvas.height / dpr;
    // Day/night palette based on round progress
    const dayT = Math.min(1, (match.round - 1) / Math.max(1, match.maxRounds - 1));
    const bgTop = lerpColor("#2a1a10", "#1a0f15", dayT);
    const bgBot = lerpColor("#1a0f08", "#0a0508", dayT);
    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, bgTop);
    grad.addColorStop(1, bgBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(view.panX + shake.x, view.panY + shake.y);
    ctx.scale(view.scale, view.scale);

    const human = match.players[0];
    const moveSet = new Set(highlightedMoves.map((h) => `${h.q},${h.r}`));
    const atkSet = new Set(highlightedAttacks.map((h) => `${h.q},${h.r}`));

    // --- Pass 1: terrain tiles + textures ---
    for (let q = 0; q < match.width; q++) {
      for (let r = 0; r < match.height; r++) {
        const tile = match.tiles[q][r];
        const visible = tile.visibility[human.id];
        const c = hexToPixel({ q, r }, HEX_SIZE);
        let baseColor = TERRAIN[tile.terrain].color;
        if (tile.bloom >= 1) baseColor = mixColor(baseColor, "#5fa86b", tile.bloom / 3);
        if (tile.radiation >= 1) {
          const radPulse = 0.6 + 0.4 * Math.sin(now / 300 + q + r);
          baseColor = mixColor(baseColor, "#aaff44", (tile.radiation / 3) * radPulse * 0.5);
        }
        if (tile.inStorm) {
          const stormPulse = 0.3 + 0.2 * Math.sin(now / 250 + q * 0.3);
          baseColor = mixColor(baseColor, "#333344", stormPulse);
        }
        ctx.globalAlpha = visible ? 1 : 0.3;
        fillHex(ctx, c.x, c.y, HEX_SIZE, baseColor);
        // Texture overlay
        if (visible) {
          const tex = getTerrainTexture(tile.terrain, HEX_SIZE);
          ctx.save();
          ctx.beginPath();
          hexPath(ctx, c.x, c.y, HEX_SIZE);
          ctx.clip();
          ctx.globalAlpha = 0.6;
          ctx.drawImage(tex, c.x - HEX_SIZE, c.y - HEX_SIZE, HEX_SIZE * 2, HEX_SIZE * 2);
          ctx.restore();
        }
        // Hex edge stroke
        ctx.globalAlpha = visible ? 0.4 : 0.15;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        strokeHex(ctx, c.x, c.y, HEX_SIZE);
      }
    }
    ctx.globalAlpha = 1;

    // --- Pass 2: territory borders ---
    for (let q = 0; q < match.width; q++) {
      for (let r = 0; r < match.height; r++) {
        const tile = match.tiles[q][r];
        if (!tile.owner) continue;
        if (!tile.visibility[human.id]) continue;
        const owner = match.players.find((p) => p.id === tile.owner);
        if (!owner) continue;
        const c = hexToPixel({ q, r }, HEX_SIZE);
        ctx.strokeStyle = owner.color;
        ctx.lineWidth = 2.2;
        // Draw only the edges where the neighbor is NOT same owner
        for (let i = 0; i < 6; i++) {
          const d = HEX_DIRS[i];
          const nb = match.tiles[q + d.q]?.[r + d.r];
          if (nb?.owner === tile.owner) continue;
          drawHexEdge(ctx, c.x, c.y, HEX_SIZE, i);
        }
      }
    }

    // --- Pass 3: feature glyphs (geyser, wreck, etc.) ---
    for (let q = 0; q < match.width; q++) {
      for (let r = 0; r < match.height; r++) {
        const tile = match.tiles[q][r];
        if (!tile.visibility[human.id]) continue;
        if (!tile.feature) continue;
        const c = hexToPixel({ q, r }, HEX_SIZE);
        drawFeature(ctx, c.x, c.y, HEX_SIZE, tile.feature);
      }
    }

    // --- Pass 4: move/attack highlights ---
    if (selectedUnitId) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 200);
      for (const h of highlightedMoves) {
        const c = hexToPixel(h, HEX_SIZE);
        ctx.fillStyle = `rgba(255,255,255,${0.12 + pulse * 0.08})`;
        fillHex(ctx, c.x, c.y, HEX_SIZE - 2);
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 1.5;
        strokeHex(ctx, c.x, c.y, HEX_SIZE - 4);
      }
      for (const h of highlightedAttacks) {
        const c = hexToPixel(h, HEX_SIZE);
        ctx.fillStyle = `rgba(255,60,60,${0.25 + pulse * 0.15})`;
        fillHex(ctx, c.x, c.y, HEX_SIZE - 2);
        ctx.strokeStyle = "#ff3030";
        ctx.lineWidth = 2;
        strokeHex(ctx, c.x, c.y, HEX_SIZE - 4);
      }
    }

    // --- Pass 5: cities ---
    for (const city of Object.values(match.cities)) {
      const tile = match.tiles[city.hex.q][city.hex.r];
      if (!tile.visibility[human.id]) continue;
      const c = hexToPixel(city.hex, HEX_SIZE);
      const owner = match.players.find((p) => p.id === city.owner);
      if (!owner) continue;
      drawCity(ctx, c.x, c.y, HEX_SIZE, owner.color, owner.faction, city.isCapital);
    }

    // --- Pass 6: units (with movement tweens) ---
    for (const u of Object.values(match.units)) {
      const tile = match.tiles[u.hex.q]?.[u.hex.r];
      if (!tile?.visibility[human.id]) continue;
      const tween = animations.currentPos(u.id, now);
      let cx: number, cy: number;
      if (tween) {
        const from = hexToPixel(tween.fromHex, HEX_SIZE);
        const to = hexToPixel(tween.toHex, HEX_SIZE);
        cx = from.x + (to.x - from.x) * tween.t;
        cy = from.y + (to.y - from.y) * tween.t;
        // Add small arc on jump
        cy -= Math.sin(tween.t * Math.PI) * 6;
      } else {
        const p = hexToPixel(u.hex, HEX_SIZE);
        cx = p.x;
        cy = p.y;
        // Idle bob
        cy += Math.sin(now / 600 + parseInt(u.id.slice(1)) * 1.3) * 1.2;
      }
      const owner = match.players.find((p) => p.id === u.owner);
      const color = owner?.color ?? "#fff";
      const flash = animations.isFlashing(u.id, now);

      if (u.isHero) {
        drawHero({ ctx, x: cx, y: cy, size: HEX_SIZE, color, flashAmount: flash }, u.type);
      } else {
        drawUnit({ ctx, x: cx, y: cy, size: HEX_SIZE, color, flashAmount: flash }, u.type);
      }

      // HP bar
      const hpPct = u.hp / u.hpMax;
      if (hpPct < 1) {
        const bw = HEX_SIZE * 0.8;
        const bh = 3;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(cx - bw / 2, cy + HEX_SIZE * 0.45, bw, bh);
        ctx.fillStyle = hpPct > 0.5 ? "#5fa86b" : hpPct > 0.25 ? "#d4b048" : "#b94a4a";
        ctx.fillRect(cx - bw / 2, cy + HEX_SIZE * 0.45, bw * hpPct, bh);
      }

      // Selected ring
      if (u.id === selectedUnitId) {
        const ringPulse = 0.4 + 0.3 * Math.sin(now / 200);
        ctx.strokeStyle = `rgba(255,255,255,${ringPulse + 0.3})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, HEX_SIZE * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Veterancy stars
      if (u.veterancy > 0) {
        ctx.fillStyle = "#d4b048";
        for (let i = 0; i < u.veterancy; i++) {
          ctx.beginPath();
          ctx.arc(cx - HEX_SIZE * 0.3 + i * 4, cy - HEX_SIZE * 0.45, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- Pass 7: damage numbers ---
    for (const d of animations.damageNumbers) {
      const t = (now - d.start) / d.duration;
      const c = hexToPixel(d.hex, HEX_SIZE);
      const y = c.y - HEX_SIZE * 0.5 - t * 28;
      ctx.globalAlpha = 1 - t;
      ctx.font = "bold 18px Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#000";
      ctx.fillText(`-${d.amount}`, c.x + 1, y + 1);
      ctx.fillStyle = d.color;
      ctx.fillText(`-${d.amount}`, c.x, y);
    }
    ctx.globalAlpha = 1;

    // --- Pass 8: storm overlay (animated) ---
    for (const storm of match.storms) {
      const c = hexToPixel(storm.center, HEX_SIZE);
      ctx.save();
      const stormR = HEX_SIZE * 1.6;
      const grad2 = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, stormR);
      grad2.addColorStop(0, "rgba(80,80,100,0.5)");
      grad2.addColorStop(1, "rgba(80,80,100,0)");
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, stormR, 0, Math.PI * 2);
      ctx.fill();
      // Swirling particles
      for (let i = 0; i < 8; i++) {
        const a = (now / 600 + i / 8) * Math.PI * 2;
        const r = stormR * (0.4 + 0.4 * ((now / 300 + i) % 1));
        ctx.fillStyle = `rgba(180,180,200,${0.4 - (r / stormR) * 0.4})`;
        ctx.beginPath();
        ctx.arc(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // --- Vignette + day/night tint ---
    const vgrad = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.3, cw / 2, ch / 2, ch * 0.7);
    vgrad.addColorStop(0, "rgba(0,0,0,0)");
    vgrad.addColorStop(1, `rgba(0,0,0,${0.3 + dayT * 0.2})`);
    ctx.restore();
    ctx.fillStyle = vgrad;
    ctx.fillRect(0, 0, cw, ch);

    rafRef.current = requestAnimationFrame(draw);
  }, [match, selectedUnitId, highlightedMoves, highlightedAttacks]);

  // Resize canvas to container
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      canvas.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Start the animation loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  // Center on first city on first load
  useEffect(() => {
    if (!match || !canvasRef.current || !containerRef.current) return;
    const human = match.players[0];
    const myCity = Object.values(match.cities).find((c) => c.owner === human.id);
    if (myCity) {
      const p = hexToPixel(myCity.hex, HEX_SIZE);
      viewRef.current = {
        panX: containerRef.current.clientWidth / 2 - p.x,
        panY: containerRef.current.clientHeight / 2 - p.y,
        scale: 1,
      };
      forceRender((n) => n + 1);
    }
  }, [match?.seed]);

  const handleTap = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !match) return;
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const view = viewRef.current;
    const lx = (sx - view.panX) / view.scale;
    const ly = (sy - view.panY) / view.scale;
    const h = pixelToHex(lx, ly, HEX_SIZE);
    if (h.q < 0 || h.q >= match.width || h.r < 0 || h.r >= match.height) return;
    const tile = match.tiles[h.q][h.r];
    if (selectedUnitId && highlightedAttacks.some((a) => a.q === h.q && a.r === h.r)) {
      attackSelected(h);
      return;
    }
    if (selectedUnitId && highlightedMoves.some((a) => a.q === h.q && a.r === h.r)) {
      moveSelected(h);
      return;
    }
    if (tile.unitId) selectUnit(tile.unitId);
    else selectUnit(null);
  }, [match, selectedUnitId, highlightedMoves, highlightedAttacks, selectUnit, moveSelected, attackSelected]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" && e.isPrimary === false) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: viewRef.current.panX,
      startPanY: viewRef.current.panY,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current?.active) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragState.current.moved = true;
      viewRef.current.panX = dragState.current.startPanX + dx;
      viewRef.current.panY = dragState.current.startPanY + dy;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    if (!dragState.current.moved) handleTap(e.clientX, e.clientY);
    dragState.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    viewRef.current.scale = Math.max(0.4, Math.min(2.5, viewRef.current.scale * delta));
  };

  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        dragState.current = null;
        pinchState.current = {
          active: true,
          startDist: touchDist(e.touches),
          startScale: viewRef.current.scale,
        };
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (pinchState.current?.active && e.touches.length === 2) {
        const d = touchDist(e.touches);
        const ratio = d / pinchState.current.startDist;
        viewRef.current.scale = Math.max(0.4, Math.min(2.5, pinchState.current.startScale * ratio));
      }
    },
    onTouchEnd: () => { pinchState.current = null; },
  };

  return (
    <div
      ref={containerRef}
      className="w-full flex-1 bg-bg relative overflow-hidden touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      {...touchHandlers}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}

// --- helpers ---
function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    const x = cx + size * Math.cos(a);
    const y = cy + size * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
function fillHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, fill?: string) {
  ctx.beginPath();
  hexPath(ctx, cx, cy, size);
  if (fill) ctx.fillStyle = fill;
  ctx.fill();
}
function strokeHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  hexPath(ctx, cx, cy, size);
  ctx.stroke();
}
function drawHexEdge(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, i: number) {
  const a1 = (Math.PI / 3) * i;
  const a2 = (Math.PI / 3) * ((i + 1) % 6);
  ctx.beginPath();
  ctx.moveTo(cx + size * Math.cos(a1), cy + size * Math.sin(a1));
  ctx.lineTo(cx + size * Math.cos(a2), cy + size * Math.sin(a2));
  ctx.stroke();
}
function drawFeature(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, feature: string) {
  const u = size * 0.18;
  switch (feature) {
    case "geyser":
      ctx.fillStyle = "#7a6dbf";
      ctx.beginPath();
      ctx.arc(cx + size * 0.3, cy - size * 0.3, u, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "wreck":
      ctx.fillStyle = "#c97b3a";
      ctx.fillRect(cx + size * 0.2, cy - size * 0.3, u, u);
      break;
    case "relic":
      ctx.fillStyle = "#d4b048";
      ctx.beginPath();
      ctx.moveTo(cx + size * 0.3, cy - size * 0.4);
      ctx.lineTo(cx + size * 0.3 + u, cy - size * 0.4 + u);
      ctx.lineTo(cx + size * 0.3, cy - size * 0.4 + u * 2);
      ctx.lineTo(cx + size * 0.3 - u, cy - size * 0.4 + u);
      ctx.closePath();
      ctx.fill();
      break;
    case "wellspring":
      ctx.fillStyle = "#5fa86b";
      ctx.beginPath();
      ctx.arc(cx + size * 0.3, cy - size * 0.3, u, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "bloomNode":
      ctx.fillStyle = "#5fa86b";
      ctx.beginPath();
      ctx.arc(cx + size * 0.3, cy - size * 0.3, u * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#aaff44";
      ctx.beginPath();
      ctx.arc(cx + size * 0.3, cy - size * 0.3, u * 0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}
function touchDist(t: React.TouchList): number {
  const dx = t[0].clientX - t[1].clientX;
  const dy = t[0].clientY - t[1].clientY;
  return Math.hypot(dx, dy);
}
function mixColor(a: string, b: string, t: number): string {
  const pa = parseHex(a); const pb = parseHex(b);
  const r = Math.round(pa.r * (1 - t) + pb.r * t);
  const g = Math.round(pa.g * (1 - t) + pb.g * t);
  const bl = Math.round(pa.b * (1 - t) + pb.b * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}
function lerpColor(a: string, b: string, t: number): string {
  return mixColor(a, b, t);
}
function parseHex(h: string): { r: number; g: number; b: number } {
  const x = h.replace("#", "");
  return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
}
