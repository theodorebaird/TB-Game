import { Hex } from "./types";

export const HEX_DIRS: Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexEq(a: Hex, b: Hex): boolean {
  return a.q === b.q && a.r === b.r;
}

export function hexAdd(a: Hex, b: Hex): Hex {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function hexSub(a: Hex, b: Hex): Hex {
  return { q: a.q - b.q, r: a.r - b.r };
}

export function axialToCube(h: Hex): { x: number; y: number; z: number } {
  const x = h.q;
  const z = h.r;
  const y = -x - z;
  return { x, y, z };
}

export function hexDistance(a: Hex, b: Hex): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return Math.max(
    Math.abs(ac.x - bc.x),
    Math.abs(ac.y - bc.y),
    Math.abs(ac.z - bc.z)
  );
}

export function hexNeighbors(h: Hex): Hex[] {
  return HEX_DIRS.map((d) => hexAdd(h, d));
}

export function hexesInRange(center: Hex, range: number): Hex[] {
  const out: Hex[] = [];
  for (let dq = -range; dq <= range; dq++) {
    const rMin = Math.max(-range, -dq - range);
    const rMax = Math.min(range, -dq + range);
    for (let dr = rMin; dr <= rMax; dr++) {
      out.push({ q: center.q + dq, r: center.r + dr });
    }
  }
  return out;
}

export function hexLine(a: Hex, b: Hex): Hex[] {
  const n = hexDistance(a, b);
  if (n === 0) return [a];
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  const out: Hex[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = ac.x + (bc.x - ac.x) * t;
    const y = ac.y + (bc.y - ac.y) * t;
    const z = ac.z + (bc.z - ac.z) * t;
    out.push(cubeRoundToAxial(x, y, z));
  }
  return out;
}

function cubeRoundToAxial(x: number, y: number, z: number): Hex {
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const xd = Math.abs(rx - x);
  const yd = Math.abs(ry - y);
  const zd = Math.abs(rz - z);
  if (xd > yd && xd > zd) rx = -ry - rz;
  else if (yd > zd) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}

// Flat-top hex pixel layout (better for portrait phones — width < height per hex).
export function hexToPixel(
  h: Hex,
  size: number
): { x: number; y: number } {
  const x = size * (1.5 * h.q);
  const y = size * (Math.sqrt(3) * (h.r + h.q / 2));
  return { x, y };
}

export function pixelToHex(
  x: number,
  y: number,
  size: number
): Hex {
  const q = ((2 / 3) * x) / size;
  const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / size;
  return cubeRoundToAxial(q, -q - r, r);
}

export function hexKey(h: Hex): string {
  return `${h.q},${h.r}`;
}

export function parseHexKey(k: string): Hex {
  const [q, r] = k.split(",").map(Number);
  return { q, r };
}
