# TB Game — Tribes of the Endless Dust

A post-apocalyptic, hex-based 4X mobile game inspired by Polytopia. Five asymmetric factions, a living wasteland that fights back, fragile diplomacy, and persistent hero warlords.

Built with **React Native + Expo + Skia + TypeScript**.

---

## What's in here

```
/app                  Expo Router screens (index, new-game, match, bunker, tutorial)
/src
  /engine             Pure game logic (no React)
    types.ts          Shared interfaces
    hex.ts            Axial/cube hex math
    map.ts            Map generation
    combat.ts         Damage formula
    environment.ts    Radiation, storms, Bloom
    pathfinding.ts    Move/attack range calc
    factions.ts       The five tribes
    heroes.ts         Warlord archetypes + leveling
    diplomacy.ts      Truce/peace/alliance/betrayal
    cities.ts         City + building logic
    tech.ts           Research tree
    units.ts          Unit factory
    match.ts          Match orchestrator (turn flow)
    ai.ts             Utility AI
    rng.ts            Seedable PRNG
  /state              Zustand stores
    matchStore.ts     Active match state + actions
    metaStore.ts      Hero + cross-match progression
    persistence.ts    MMKV save/load
  /render             Skia-based rendering
    MapView.tsx       Pannable/zoomable hex map
    HudOverlay.tsx    Resources, AP, action bar
    hexGeometry.ts    Pixel coords for hexes
  /data               Static game data
    units.json
    buildings.json
    tech.json
    items.json
/tests                Vitest tests (engine only)
/assets               Logo, icons, splash
/landing              Static marketing site for DigitalOcean
```

---

## Run it

```bash
# install
npm install

# run on iOS sim (Mac only)
npm run ios

# run on Android emulator
npm run android

# run in browser (fastest preview)
npm run web

# tests
npm test

# typecheck
npm run typecheck
```

First-time setup: install [Expo Go](https://expo.dev/client) on your phone, run `npm start`, scan the QR code.

---

## How to play

1. **Main menu → New Game** — pick a faction and number of AI opponents.
2. **Tap a unit** to select it. White hexes = where you can move. Red hexes = enemies in attack range.
3. **Tap End Turn** when you're done. AI players take their turns automatically.
4. **Workers can found cities** (2 AP) on flats, ruin, or forest.
5. **Cities produce units and buildings** — tap a city to open its panel.
6. **Tech and Diplo** are on the bottom bar.
7. **Visit The Bunker** between matches to level your Warlord and buy equipment.

---

## Deploy the landing page to DigitalOcean (free static site)

The `landing/` folder is a single-page static site. Push the repo to GitHub, then on DO App Platform select "Static Site" and point it at `landing/`. **DO App Platform's static-site tier is free.**

### Step-by-step

1. **Create a GitHub repo and push.**
   ```bash
   git init
   git add .
   git commit -m "Initial: TB Game scaffold + landing page"
   git branch -M main
   gh repo create tb-game --private --source . --push
   # or push manually if you don't have `gh` CLI
   ```

2. **Connect DO to GitHub.**
   - Log into https://cloud.digitalocean.com/apps
   - Click **Create App** → **GitHub** → authorize the DO GitHub app and select your `tb-game` repo
   - Branch: `main`

3. **Configure the source.**
   - **Source directory:** `/landing`
   - **Type:** DO will auto-detect "Static Site" because there's no build step needed (plain HTML)
   - **HTTP routes:** `/` → `/`
   - **Output directory:** leave blank (or `.`)
   - **Build command:** leave blank

4. **Pick the Starter plan.**
   - It says **"Starter — Free"** ($0/month, 3 static sites included on the free tier)
   - Region: pick whatever's closest to you

5. **Click Create Resources.** Build takes ~30 seconds. You'll get a `*.ondigitalocean.app` URL.

6. **(Optional) Custom domain.** App Platform → Settings → Domains. DO will give you DNS records to add at your registrar.

**That's it.** Every push to `main` rebuilds the site automatically.

### What if you'd rather use Vercel or Netlify

Both are also free for static sites. Same `landing/` folder. Vercel: `npx vercel` from inside `landing/`. Netlify: drag-and-drop the folder at app.netlify.com.

---

## What's working in v0.1

- Full engine layer (hex math, map gen, combat, radiation drift, bloom, storms)
- 5 asymmetric factions with unique starting units/workers
- 5 hero archetypes with leveling and equipment
- Cities, buildings, production queues
- 48-node tech tree (18 shared + 6 faction-unique each)
- Diplomacy (truce/peace/alliance/betrayal) with trust scores
- Utility AI with faction-flavor weights
- Skia-rendered pannable/zoomable hex map
- Hero meta-progression in The Bunker
- Local save/load via MMKV
- Vitest unit tests for hex math, combat, and AI smoke

## Known gaps (next up)

- City pop growth and tile-yield per-tile is approximate (uses city-level totals); full per-tile worked-yield is stubbed
- Tutorial is text-only (no interactive scenarios per §12.4)
- Sounds/music not wired
- Async multiplayer not built (out of scope for solo build)
- Cosmetic shop not built (you said free use only)

---

## Design source

The full game design lives in [ASHFALL_design_doc.md](./ASHFALL_design_doc.md). This codebase implements §17 Phase 1 (MVP) and most of Phase 2 (vertical slice). The build order follows §20 with a few merged steps because the engine has been built end-to-end before UI rather than step-by-step.

## License

Personal project. Use the code freely. Logo is yours.
