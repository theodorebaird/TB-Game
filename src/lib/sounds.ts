// Web Audio synthesis. No asset files — every sound is generated procedurally
// from oscillators and noise so the PWA stays tiny and loads instantly.

let ctx: AudioContext | null = null;
let enabled = true;

const STORAGE_KEY = "tb-game-sound-v1";

export function initAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  // Resume on first user gesture (browser requirement).
  if (ctx?.state === "suspended") ctx.resume();
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) enabled = saved === "1";
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function tone(opts: {
  freq: number;
  endFreq?: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
}) {
  if (!enabled || !ctx) return;
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(0.01, opts.endFreq), t0 + opts.duration);
  }
  const v = opts.volume ?? 0.15;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(v, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + opts.duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + opts.duration);
}

function noise(opts: {
  duration: number;
  volume?: number;
  filterFreq?: number;
  delay?: number;
}) {
  if (!enabled || !ctx) return;
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const bufferSize = Math.floor(ctx.sampleRate * opts.duration);
  const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = opts.filterFreq ?? 800;
  const gain = ctx.createGain();
  const v = opts.volume ?? 0.1;
  gain.gain.setValueAtTime(v, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + opts.duration);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + opts.duration);
}

// --- Public SFX library ---
export const sfx = {
  tap: () => tone({ freq: 800, endFreq: 600, duration: 0.08, type: "triangle", volume: 0.06 }),
  select: () => tone({ freq: 520, duration: 0.12, type: "triangle", volume: 0.08 }),
  move: () => noise({ duration: 0.15, volume: 0.05, filterFreq: 600 }),
  attack: () => {
    tone({ freq: 220, endFreq: 80, duration: 0.18, type: "sawtooth", volume: 0.12 });
    noise({ duration: 0.12, volume: 0.08, filterFreq: 1200, delay: 0.02 });
  },
  death: () => {
    tone({ freq: 180, endFreq: 60, duration: 0.4, type: "triangle", volume: 0.14 });
    noise({ duration: 0.3, volume: 0.1, filterFreq: 400 });
  },
  cityFound: () => {
    tone({ freq: 440, duration: 0.12, type: "triangle", volume: 0.1 });
    tone({ freq: 660, duration: 0.15, type: "triangle", volume: 0.1, delay: 0.08 });
    tone({ freq: 880, duration: 0.2, type: "triangle", volume: 0.1, delay: 0.16 });
  },
  cityCaptured: () => {
    tone({ freq: 200, endFreq: 100, duration: 0.5, type: "sawtooth", volume: 0.18 });
    tone({ freq: 300, endFreq: 150, duration: 0.5, type: "triangle", volume: 0.12, delay: 0.05 });
  },
  endTurn: () => {
    tone({ freq: 392, duration: 0.1, type: "sine", volume: 0.08 });
    tone({ freq: 587, duration: 0.15, type: "sine", volume: 0.08, delay: 0.08 });
  },
  research: () => {
    tone({ freq: 660, duration: 0.08, type: "triangle", volume: 0.08 });
    tone({ freq: 880, duration: 0.08, type: "triangle", volume: 0.08, delay: 0.06 });
    tone({ freq: 1100, duration: 0.12, type: "triangle", volume: 0.08, delay: 0.12 });
  },
  win: () => {
    [0, 0.15, 0.3, 0.45].forEach((d, i) => {
      tone({ freq: 392 + i * 120, duration: 0.25, type: "triangle", volume: 0.15, delay: d });
    });
  },
  lose: () => {
    tone({ freq: 200, endFreq: 50, duration: 0.8, type: "sawtooth", volume: 0.2 });
  },
};
