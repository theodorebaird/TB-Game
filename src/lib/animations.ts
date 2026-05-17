// Lightweight animation system: tweens, floating damage numbers, hit flashes, screen shake.
// Everything is keyed off requestAnimationFrame in MapView's render loop.

import { Hex } from "@engine/types";

export interface UnitTween {
  unitId: string;
  fromHex: Hex;
  toHex: Hex;
  start: number;
  duration: number;
}

export interface DamageNumber {
  id: number;
  hex: Hex;
  amount: number;
  color: string;
  start: number;
  duration: number;
}

export interface HitFlash {
  unitId: string;
  start: number;
  duration: number;
}

export interface Shake {
  start: number;
  duration: number;
  amplitude: number;
}

export interface AmbientPulse {
  // Time-based seed for animated ambient effects (storms, bloom, radiation).
  t: number;
}

class AnimationManager {
  unitTweens: UnitTween[] = [];
  damageNumbers: DamageNumber[] = [];
  hitFlashes: HitFlash[] = [];
  shake: Shake | null = null;
  private nextId = 1;

  unitMove(unitId: string, fromHex: Hex, toHex: Hex, duration = 280) {
    this.unitTweens.push({ unitId, fromHex, toHex, start: performance.now(), duration });
  }

  damage(hex: Hex, amount: number, color = "#fff") {
    this.damageNumbers.push({
      id: this.nextId++,
      hex,
      amount,
      color,
      start: performance.now(),
      duration: 1200,
    });
  }

  flash(unitId: string, duration = 250) {
    this.hitFlashes.push({ unitId, start: performance.now(), duration });
  }

  doShake(amplitude = 8, duration = 240) {
    this.shake = { start: performance.now(), duration, amplitude };
  }

  // Garbage-collect finished animations.
  prune(now: number) {
    this.unitTweens = this.unitTweens.filter((t) => now - t.start < t.duration);
    this.damageNumbers = this.damageNumbers.filter((d) => now - d.start < d.duration);
    this.hitFlashes = this.hitFlashes.filter((f) => now - f.start < f.duration);
    if (this.shake && now - this.shake.start >= this.shake.duration) this.shake = null;
  }

  // Get the current interpolated position for a unit. Returns null if no tween active.
  currentPos(unitId: string, now: number): { fromHex: Hex; toHex: Hex; t: number } | null {
    const tween = this.unitTweens.find((tw) => tw.unitId === unitId);
    if (!tween) return null;
    const t = Math.min(1, (now - tween.start) / tween.duration);
    return { fromHex: tween.fromHex, toHex: tween.toHex, t: easeOutCubic(t) };
  }

  isFlashing(unitId: string, now: number): number {
    const f = this.hitFlashes.find((x) => x.unitId === unitId);
    if (!f) return 0;
    return 1 - (now - f.start) / f.duration;
  }

  shakeOffset(now: number): { x: number; y: number } {
    if (!this.shake) return { x: 0, y: 0 };
    const t = (now - this.shake.start) / this.shake.duration;
    const decay = 1 - t;
    const amp = this.shake.amplitude * decay;
    return {
      x: (Math.random() - 0.5) * amp * 2,
      y: (Math.random() - 0.5) * amp * 2,
    };
  }
}

export const animations = new AnimationManager();

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}
