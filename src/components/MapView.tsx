import React, { useEffect, useRef, useState, useCallback } from "react";
import { useMatchStore } from "@state/matchStore";
import { TERRAIN } from "@engine/terrain";
import { hexToPixel, pixelToHex } from "@engine/hex";
import { Hex } from "@engine/types";

const HEX_SIZE = 28;

export function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ panX: 200, panY: 200, scale: 1 });
  const dragState = useRef<{ active: boolean; startX: number; startY: number; startPanX: number; startPanY: number; moved: boolean } | null>(null);
  const pinchState = useRef<{ active: boolean; startDist: number; startScale: number } | null>(null);

  const match = useMatchStore((s) => s.match);
  const selectedUnitId = useMatchStore((s) => s.selectedUnitId);
  const highlightedMoves = useMatchStore((s) => s.highlightedMoves);
  const highlightedAttacks = useMatchStore((s) => s.highlightedAttacks);
  const selectUnit = useMatchStore((s) => s.selectUnit);
  const moveSelected = useMatchStore((s) => s.moveSelected);
  const attackSelected = useMatchStore((s) => s.attackSelected);

  // Draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !match) return;
    const ctx = canvas.getContext("2d")!;
    const { width: cw, height: ch } = canvas;
    ctx.fillStyle = "#1a0f08";
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(view.panX, view.panY);
    ctx.scale(view.scale, view.scale);

    const human = match.players[0];
    const moveKeys = new Set(highlightedMoves.map((h) => `${h.q},${h.r}`));
    const atkKeys = new Set(highlightedAttacks.map((h) => `${h.q},${h.r}`));

    // Tiles
    for (let q = 0; q < match.width; q++) {
      for (let r = 0; r < match.height; r++) {
        const tile = match.tiles[q][r];
        const visible = tile.visibility[human.id];
        const c = hexToPixel({ q, r }, HEX_SIZE);
        let fill = TERRAIN[tile.terrain].color;
        if (tile.bloom >= 1) fill = mixColor(fill, "#5fa86b", tile.bloom / 3);
        if (tile.radiation >= 1) fill = mixColor(fill, "#aaff44", tile.radiation / 3);
        if (tile.inStorm) fill = mixColor(fill, "#444", 0.4);
        ctx.globalAlpha = visible ? 1 : 0.35;
        drawHex(ctx, c.x, c.y, HEX_SIZE, fill, "#0008");
      }
    }
    ctx.globalAlpha = 1;

    // Move/attack highlights
    for (const h of highlightedMoves) {
      const c = hexToPixel(h, HEX_SIZE);
      drawHex(ctx, c.x, c.y, HEX_SIZE - 2, "#ffffff30", undefined);
    }
    for (const h of highlightedAttacks) {
      const c = hexToPixel(h, HEX_SIZE);
      drawHex(ctx, c.x, c.y, HEX_SIZE - 2, "#ff303060", "#ff3030");
    }

    // Cities
    for (const city of Object.values(match.cities)) {
      const c = hexToPixel(city.hex, HEX_SIZE);
      const owner = match.players.find((p) => p.id === city.owner);
      ctx.fillStyle = owner?.color ?? "#fff";
      ctx.beginPath();
      ctx.arc(c.x, c.y, HEX_SIZE * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a0f08";
      ctx.beginPath();
      ctx.arc(c.x, c.y, HEX_SIZE * 0.3, 0, Math.PI * 2);
      ctx.fill();
      if (city.isCapital) {
        ctx.strokeStyle = "#d4b048";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Units
    for (const u of Object.values(match.units)) {
      const c = hexToPixel(u.hex, HEX_SIZE);
      const owner = match.players.find((p) => p.id === u.owner);
      ctx.fillStyle = owner?.color ?? "#fff";
      ctx.beginPath();
      ctx.arc(c.x, c.y, HEX_SIZE * 0.42, 0, Math.PI * 2);
      ctx.fill();
      // HP bar
      const hpPct = u.hp / u.hpMax;
      ctx.fillStyle = "#1a0f08";
      ctx.fillRect(c.x - HEX_SIZE * 0.4, c.y + HEX_SIZE * 0.45, HEX_SIZE * 0.8, 3);
      ctx.fillStyle = hpPct > 0.5 ? "#5fa86b" : hpPct > 0.25 ? "#d4b048" : "#b94a4a";
      ctx.fillRect(c.x - HEX_SIZE * 0.4, c.y + HEX_SIZE * 0.45, HEX_SIZE * 0.8 * hpPct, 3);
      if (u.isHero) {
        ctx.strokeStyle = "#d4b048";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, HEX_SIZE * 0.48, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (u.id === selectedUnitId) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(c.x, c.y, HEX_SIZE * 0.55, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [match, view, selectedUnitId, highlightedMoves, highlightedAttacks]);

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
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Tap / click handler
  const handleTap = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !match) return;
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
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
  }, [match, view, selectedUnitId, highlightedMoves, highlightedAttacks, selectUnit, moveSelected, attackSelected]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" && e.isPrimary === false) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: view.panX,
      startPanY: view.panY,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current?.active) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragState.current.moved = true;
      setView((v) => ({ ...v, panX: dragState.current!.startPanX + dx, panY: dragState.current!.startPanY + dy }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    if (!dragState.current.moved) {
      handleTap(e.clientX, e.clientY);
    }
    dragState.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setView((v) => ({ ...v, scale: Math.max(0.4, Math.min(2.5, v.scale * delta)) }));
  };

  // Touch pinch (two-finger)
  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        dragState.current = null;
        pinchState.current = {
          active: true,
          startDist: touchDist(e.touches),
          startScale: view.scale,
        };
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (pinchState.current?.active && e.touches.length === 2) {
        const d = touchDist(e.touches);
        const ratio = d / pinchState.current.startDist;
        setView((v) => ({ ...v, scale: Math.max(0.4, Math.min(2.5, pinchState.current!.startScale * ratio)) }));
      }
    },
    onTouchEnd: () => {
      pinchState.current = null;
    },
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

function drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, fill: string, stroke?: string) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
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
function parseHex(h: string): { r: number; g: number; b: number } {
  const x = h.replace("#", "");
  if (x.length === 8) {
    return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
  }
  return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
}
