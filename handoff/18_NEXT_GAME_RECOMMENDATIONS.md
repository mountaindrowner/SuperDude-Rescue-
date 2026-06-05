# 18 — Next Game Recommendations

The synthesized recommendation. If you only read one file in this handoff, read this one and `00_README_START_HERE.md`.

## The TL;DR stack for the next game

For a small 2D platformer / runner / casual game targeting browser + iOS:

> **Phaser 3 + Tiled + Capacitor 6 + Codemagic + Cloudflare Pages.**

Why each:
- **Phaser 3** — eliminates the engine-writing weeks (scene manager, asset loader, input, physics, animation, audio, camera). Same Capacitor wrap path as this project.
- **Tiled** (tiled.org) — eliminates the level-editor weeks. Open source, free, exports Phaser-compatible JSON.
- **Capacitor 6** — same iOS wrap path we now know. All the gotchas in this handoff still apply but with proven solutions.
- **Codemagic** — same CI/CD. Cert reuse + bulletproof icon generation already documented.
- **Cloudflare Pages** — unlimited bandwidth (Netlify free tier capped at 100GB; we hit it during testing). Same git-connected deploy model.

If the project ambitions exceed "small platformer" (cutscenes, larger world, native console / desktop someday): **Godot 4** instead.

## Recommended folder structure

See `04_REPO_AND_FILE_ORGANIZATION.md` for the full structure. The short version:

```
src/        — game code, organized in scenes / entities / systems / data
public/     — what ships to user (HTML, manifest, SW, assets)
levels/     — Tiled JSON files
resources/  — source art (1024+ originals, icon, splash)
docs/       — handoff/, design docs, changelog
tools/      — dev-only utilities (NOT shipped)
tests/      — automated tests
```

## Recommended first prototype

**Goal:** a single moving square jumping on a single platform, deployed to a real iPhone via TestFlight.

**Timeline:** end of week 1.

**What this teaches:**
- Phaser scene structure
- Asset loading
- Touch input working
- iOS wrap pipeline working
- Code-signing pipeline working
- Service worker / PWA pipeline working
- Cloudflare Pages deploy pipeline working

After this prototype works end-to-end, the rest of the game is content + polish. The infrastructure is the hard part. **Get it out of the way first.**

## Recommended level editor approach

**Use Tiled.** Don't build your own.

Tiled handles:
- Tile painting with auto-tiling
- Multiple layers (collision, decoration, foreground)
- Per-entity property editing (drop a pickup, edit its properties)
- Export as JSON consumable by Phaser via `LoaderPlugin.tilemapTiledJSON`
- Free forever

If Tiled is genuinely insufficient for your game's needs (rare), build the MVLE described in `10_LEVEL_EDITOR_LESSONS.md`. Don't over-build.

## Recommended art pipeline

See `05`, `06`, `07` for the full pipeline. The short version:

1. **Lock the style bible on day 1.** 5-color palette, sprite frame size, character proportions, art reference games.
2. **Build the master character sheet first.** Confirm the look works at target size.
3. **Use PixelLab for sprite generation** (optionally via MCP for speed).
4. **Use Aseprite for cleanup.** Buy it on day 1. Use it for every sprite that lands in the project.
5. **Use Midjourney / ChatGPT image for backdrops.** Generate, re-cut into layers, integrate.
6. **Pre-render parallax layers to cached canvases.** Don't paint per-frame.

## Recommended audio pipeline

See `11` for the full pipeline. The short version:

1. **Decide bitrate on day 1.** Mono VBR ~96 kbps for music, mono ~64 kbps for SFX.
2. **Lazy-load all but startup tracks.** Title + menu + intro eager, everything else on-demand.
3. **Use Web Audio for SFX**, `<audio>` element for music.
4. **Wait for user gesture before any audio init.**
5. **Warm AVAudioSession on first gesture for iOS.**
6. **Handle Range requests in service worker** for Safari MP3 compatibility.

Phaser's audio plugin handles most of this if you opt for HTML5 audio mode. Still apply the patterns above for iOS gotchas.

## Recommended deployment path

### For browser PWA
1. Build to `dist/` (or `public/` for Phaser CLI)
2. Push to git
3. Cloudflare Pages auto-deploys on push
4. PWA available immediately

### For iOS App Store
1. Capacitor wraps the same web build
2. Codemagic builds the .ipa on cloud Mac
3. Codemagic auto-uploads to TestFlight
4. App Store Connect → attach build → submit for review

Both paths from a single codebase. No duplicate maintenance.

## What to do differently from day one

### 1. Pick the framework before line 1
We picked vanilla. Pay the price for engine-writing. Don't.

### 2. Pick the render resolution + aspect ratio
Decide if you're dynamic or fixed. If fixed, pick the aspect that matches your target.

### 3. Pick sprite frame size + anchor + bbox conventions
32×32 + bottom-center anchor + 80%-of-visual collision box. Document. Enforce.

### 4. Lock the audio bitrate
Mono VBR ~96 kbps. Encode every track at this from day one.

### 5. Build the level editor in week 1
Tiled, used. Day 4–5.

### 6. Ship a single moving square to TestFlight in week 1
Then build the game. Don't discover iOS at the end.

### 7. Write CLAUDE.md / HANDOVER.md on day 1
Update continuously. Read at the start of every session.

### 8. Test on a real device weekly
Not just at the end. Find mobile bugs while they're small.

### 9. Build the QA checklist on day 5
Use it before every shipped build.

### 10. Set up version bumps in lockstep
`SDD.VERSION` / `CACHE_NAME` / `MARKETING_VERSION` — automate via a script if possible.

## What to reuse from this project

### Architecture patterns that worked
- **`window.SDD` namespace** for global access (if going vanilla)
- **IIFE-per-module** with attaching to namespace
- **Scene manager with enter/update/render/exit**
- **Save migration pattern** (v1 → v2 → v3 → v4 with each migrator function)
- **Audio system** with lazy loading + variant pools

### Code that can be cribbed
- **`audio.js`** — the iOS gotchas are all handled correctly now. Extract the lazy-load + gesture-warm + Range-support patterns.
- **`service-worker.js`** — the Range request handler in particular
- **`engine.js`** — the AABB collision math is solid
- **`save.js`** — the v1→v4 migration pattern
- **`input.js`** — the touch + keyboard + gamepad merger
- **`scenes.js` parallax painter functions** — `_cyPaintFar` / `_cyPaintMid` etc. are good reference for cached canvas painting

### Tooling decisions that worked
- Codemagic for cloud build
- Capacitor for iOS wrap
- Puppeteer for screenshot testing

## What NOT to reuse

### Anti-patterns to skip
- **Hand-coding levels in JS arrays** — use Tiled
- **`PL_BBOX` measurement table** — pick a sprite frame size and stick to it instead
- **Multi-folder asset chaos** — `assets/New Assets/Adventure city Music/` with spaces in names was bad
- **Procedural everything** — painted backdrops in cached canvases look better, build the helper once
- **Cache trap** — automate version bump (commit hook or build script)
- **No build step** — Phaser-Vite is fine, give yourself a bundler

### Code that doesn't generalize
- **The `THEMES` dispatch + per-theme sky painters** — that's a vanilla-JS solution to a problem Phaser handles via tilemaps + layers
- **The custom level editor** — replaced by Tiled
- **The custom dialog renderer** — Phaser has a UI plugin

## First 30 days roadmap for the next game

### Week 1 — Infrastructure
- Day 1: decisions documented in `docs/DECISIONS.md`
- Day 2: Phaser-Vite scaffold, "hello cube" on screen
- Day 3: deploy to Cloudflare Pages, view on phone browser
- Day 4: Capacitor + Codemagic setup, "hello cube" on TestFlight
- Day 5: input wired, cube moves on touch + keyboard
- Day 6: asset folder structure, manifest + service worker
- Day 7: review week 1, update `docs/DECISIONS.md`

### Week 2 — Core gameplay
- Day 8: Tiled installed, first tilemap loading in Phaser
- Day 9: player sprite + idle/walk animations
- Day 10: collision with tilemap
- Day 11: jump physics that feel right
- Day 12: camera follows player
- Day 13: one enemy (walker) with patrol
- Day 14: review playtest, deploy build

### Week 3 — Content multiplication
- Day 15: pickups + score
- Day 16: HUD (lives, score, time)
- Day 17: second level
- Day 18: third level
- Day 19: scene transitions polished
- Day 20: pause menu + options
- Day 21: real-device test pass

### Week 4 — Polish
- Day 22: audio pipeline (BGM + SFX)
- Day 23: title screen + main menu
- Day 24: game over + results scenes
- Day 25: save system
- Day 26: visual polish (effects, particles)
- Day 27: difficulty pass
- Day 28: QA checklist + bug fixes

### Day 30: First TestFlight build of "real" game
A playable game beta on TestFlight. Probably rough, but everything is wired together.

After day 30: content expansion + polish + submission prep, on whatever timeline the game's scope allows.

## A final word

**The infrastructure is the hard part. The content is the slow part. The polish is the satisfying part.**

Skip the infrastructure shortcuts. Don't skimp on it. The rest follows.

For Super Dude Adventures, the infrastructure took ~70% of our total time because we built it ad-hoc. With the next stack, that should be ~20%. The other 50% is yours to spend on actually making the game.
