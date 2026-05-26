# Super Dude Danny — Handover for Claude Code

This file is the durable handover between Claude Code sessions. The web
execution environment is ephemeral — every session starts from a fresh
clone, so anything not pushed to GitHub is gone. Read this top to bottom
before you touch code.

## Project at a glance

**Super Dude Danny** is a kid-friendly retro HTML5 platformer. It's a
single-page web game — plain HTML + CSS + JS, **no build step, no
dependencies**. The Canvas + Web Audio APIs do everything. Game logic
runs in fixed 60 Hz steps; world coords are 320 × 180, the canvas
backing-store is 960 × 540 (3× render scale, nearest-neighbour).

The story: Danny is a scientist stranded in time, traveling through
God's seven days of creation collecting power cores and time-machine
parts to get home.

## How to run

Browsers block `fetch()` from `file://`, and the MP3 music loader uses
fetch. So:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/ in any modern browser
```

The README's "just open index.html" advice works for the synthesised
chiptune fallback but the MP3 soundtrack won't load without a server.

On mobile, touch controls appear automatically (see `#touch-controls`
in `index.html`).

## Dev shortcuts (god mode)

Wired in `js/main.js`:

| Key       | Where             | Effect                                |
| --------- | ----------------- | ------------------------------------- |
| `G`       | any scene         | Toggle god mode on/off (persisted).   |
| `N`       | level scene only  | Skip current level (god mode).        |
| `1`–`7`   | any scene         | Jump straight to Day N (god mode).    |

God mode also unlocks the day, so use this to test deep levels fast.

## File layout

```
index.html             entry point — loads all scripts in dep order
css/style.css          page + touch-control layout
js/
  save.js              localStorage save (key: superDudeDanny.save.v2)
  input.js             keyboard + touch input
  audio.js             chiptune synth + MP3 music loader
  sprites.js           ~2100 lines of procedural pixel art (no PNGs)
  engine.js            physics, collisions, level helpers
  entities.js          player + enemies + items (~1100 lines)
  level1.js            Day 1-1 data
  level_<d>_<s>.js     Days 2-1 through 7-1 (12 stages total)
  scenes.js            logo/title/menu/intro/overworld/level/results
  main.js              boot, scene manager, fixed-timestep loop
assets/
  music/               MP3 soundtrack (wired)
  Super Dude Danny Big Sprites/      reference PNG art (not loaded at runtime)
  Super Dude Danny Small Sprites -/  reference PNG art (not loaded at runtime)
  *.png                title.png, overworld.png, lab.png, timemachine*.png
tests/
  test_overworld.js    static + optional Puppeteer in-game render
  test_vines_3_2.js    Puppeteer vine-reachability test
test/sprites.html      standalone sprite preview page
```

## Architecture

- Everything lives on the global `window.SDD`. Each JS file is an IIFE
  that attaches its exports to `SDD`. No modules, no bundler.
- **Scene manager**: `SDD.setScene(name, data)`. Scenes are objects
  with `{ enter, exit, update(dt), render(ctx) }`. Registered scenes:
  `logo`, `title`, `menu`, `intro`, `overworld`, `level`, `results`.
- **Render scale**: world is 320 × 180; canvas is 960 × 540; main
  loop calls `ctx.setTransform(3, 0, 0, 3, 0, 0)` before each scene
  render and resets after.
- **Levels**: registered as `SDD.levels['d-s']` (e.g.
  `SDD.levels['3-2']`). Each level is a plain object with `width`,
  `height`, `ground`, `tiles`, `spawns`, `movers`, `name`, `theme`.
  Tile grid is 16 px; level widths are typically 200–320 cols × 14 rows.

## Save system

- Key: `localStorage['superDudeDanny.save.v2']`.
- Stores per-stage best time, best core count, completion flags
  (`'d-s'` keys), and options (`muted`, `volume`, `god`).
- v1 → v2 auto-migration is in place in `js/save.js`. Don't break it.

## Audio system

Two paths in `js/audio.js`, in this order of preference:

1. **MP3 tracks** loaded from `assets/music/` via `fetch` →
   `decodeAudioData`. Expected files: `title`, `menu`, `intro`,
   `overworld_a`, `overworld_b`, `results_a`, `results_b`,
   `gameover_a`, `gameover_b`, and per-level
   `level_<d>_<s>_<a|b|c>.mp3`. 38 MP3s currently committed.
2. **Synthesised chiptune fallback** — `NOTES`, `tone()`, `noise()`,
   plus `SFX` and `SONGS` dictionaries. Always works.

SFX (jump, stomp, blast, core, power, grow, hit, die, chirp, select,
confirm, …) are synthesised regardless.

## Day-by-day status

All 12 stages have complete level data and are playable end-to-end:

| Day-Stage | Theme                | Notes                             |
| --------- | -------------------- | --------------------------------- |
| 1-1       | Light & Darkness     | Tutorial-style.                   |
| 2-1       | Firmament            | Cloud ladder climbing.            |
| 2-2       | Waters Below         | Moving-platform rhythm over water.|
| 3-1       | Forming Land         | Brick-stack vertical scrambling.  |
| 3-2       | Vegetation           | Vine mazes + canopy climb.        |
| 4-1       | The Sun              | Solar flares + walkers.           |
| 4-2       | Moon & Stars         | Low gravity + drifting meteors.   |
| 5-1       | The Skies            | Flappy mode (tap to flap).        |
| 5-2       | The Seas             | Underwater swimming.              |
| 6-1       | Wild Animals         | Lion + porcupine + wisp gauntlet. |
| 6-2       | Mankind              | NPC trail navigation.             |
| 7-1       | Day of Rest          | Calm Eden, no enemies.            |

**The README.md line "only Day 1 is fully playable" is outdated — ignore
it.** All days have real level data.

## Tests

```sh
node tests/test_overworld.js              # static placement checks
node tests/test_overworld.js --ingame     # + Puppeteer screenshot
node tests/test_vines_3_2.js              # Puppeteer vine reachability
```

Puppeteer + canvas modules are expected in `/tmp/node_modules/` and
are installed on demand — not committed. If a test errors with a
missing module, run `cd /tmp && npm install puppeteer canvas`.

## Conventions

### Commit messages

Title-case scope + colon + comma-separated specifics. Match the
existing log:

- `Day 6-1 savanna: lion + porcupine walker variants`
- `Pass 9 polish wave 6: clam walker, visible lava + nozzles, blast height fix`
- `Wire Mark's MP3 music: per-scene/per-level loader with variants`
- `Vine logic overhaul + Day 3-2 canopy + pit fixes`

### Branch policy

- Develop on `claude/project-continuation-<token>` (currently
  `claude/project-continuation-L24du`).
- Always `git push -u origin <branch>` so work survives a session
  crash. The container is ephemeral; unpushed commits are lost.
- **Never** push to `main` without explicit permission from the user.
- **Do not** open pull requests unless the user explicitly asks.

### Code style

- IIFEs attaching to `window.SDD` — never use `import`/`export` or
  bundler-only syntax.
- Plain `var`/`function` is fine; existing code is ES5-ish on purpose
  so the game runs in any modern browser without transpiling.
- No emojis in code or commits.

## Known loose ends (for the next session to ask about)

1. **15 duplicate MP3s at the repo root** — `level 4-1.mp3`,
   `level 5-2.1.mp3`, etc. were dropped in commit `d7dd274 Add files
   via upload`. They are byte-identical to the properly-named files
   in `assets/music/` and are unreferenced. They bloat the repo by
   ~45 MB. Ask the user before deleting.
2. **README.md is stale** — claims only Day 1 is playable; all days
   are now complete. A one-line edit fixes it.
