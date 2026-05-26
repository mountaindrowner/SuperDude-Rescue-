# Super Dude Danny — Session Handover

> **If you're a new Claude Code session reading this for the first time:**
> read this whole file before touching anything. It is the durable
> handover between sessions. The remote execution env is ephemeral —
> only what's pushed to GitHub survives a crash. Update this file as
> major work lands.

---

## WHERE WE ARE RIGHT NOW (latest first — read this first)

- **Active branch**: `claude/super-dude-danny-platformer-Jftc7` (always work here)
- **Latest commit**: Day 6-2 canopy image wired into `drawSky_bugscale`
  — painted jungle PNG drawn tiled with 0.3 parallax, procedural
  far/mid/top/foreground branches dropped, sun pool + pollen motes +
  hanging cocoon kept as overlays. Service-worker cache bumped to
  `sdd-shell-v4`. Visual change is live on `origin`.
- **Full design history** is in `PLAN.md` (Passes 1-11 + music asset
  list, mostly shipped). Read that for the "why" of any feature; this
  section is just the active edge.

### Immediate next step — Screenshot + iterate the canopy

1. Open the GitHack URL in a fresh tab with the service worker
   unregistered (Application → Service Workers → Unregister, then
   Storage → Clear site data).
2. God-mode in (`G`, then `6`) and walk through 6-2. Confirm: painted
   canopy fills the sky, parallaxes slowly with player movement, sun
   glow sits at top-centre, pollen drifts across mid-air, cocoon
   appears every ~screen-width.
3. If parallax factor / blur radius / cocoon density needs tuning:
   `js/scenes.js` `drawSky_bugscale` (around L1881) is now ~50 lines —
   `bgPx` controls parallax, blur is in `js/sprites.js` (`blur(1.5px)`
   inside the bugBg onload handler around L2862).

### Pending roadmap

1. **Editor pass on 6-2 layout** — 6-2 was generator-built, not
   editor-tuned. Open in-game editor → 6-2 → walk the level for
   awkward gaps / unfair density / impossible sequences, save the
   variant back to `js/level_6_2.js` via FSAPI.
2. **Sprite-popping background audit** (Pass 9 follow-up) — only if
   the issue actually persists with MP3 music swapped in.
3. **Custom climb animation for vines** — Mark to provide PixelLab
   frames.
4. **Animated overlays on painted overworld** (drifting clouds over
   Sky island, twinkling stars in Cosmic Void, water shimmer on
   Ocean) — possible polish.
5. **Capacitor App Store wrap** — PWA shipped; native wrap optional
   follow-up if Mark wants to publish on iOS / Play.
6. **Spacesuit + jetpack Danny sprites** — Mark mentioned these
   in-flight; some costume sprites already wired (commit `af34470`).
   Confirm with Mark if more are coming.

### Most recent session in plain English

Mark and a previous Claude session built out Day 6-2 from scratch
across 4 commits:
1. `9d01ba7` — scrapped MANKIND, generated a 280×14 bug-scale canopy
   stage with bees, branches, leaf platforms.
2. `15a34d6` — added bark/wood floor tiles, branch-parallax sky,
   goliath beetle walker.
3. `a825a96` — blurred far/mid sky layers for bokeh depth.
4. `754e600` — cohesive canopy: bokeh distance, leafy overhang, hanging
   cocoon, foreground branches anchored to foliage.

Then Mark gave us the painted canopy PNG, the session crashed, this
session recovered onto the right branch, and we pushed `b6f6149` (the
loader, no visual change yet). Next step is to rewire the sky function
to actually use the image.

---

## Quick start for a new session

1. You're on branch `claude/super-dude-danny-platformer-Jftc7`. Do not
   switch branches unless told. The other branches (`main`,
   `claude/project-continuation-L24du`) are stale/dead-end.
2. Read this whole file.
3. Read the **"Where we are right now"** section above for current
   work-in-progress.
4. If Mark says "continue from where we left off", look at the latest
   `git log` and this file's WIP section together.

## Project at a glance

**Super Dude Danny** — a kid-friendly retro HTML5 platformer. Plain
HTML + CSS + JS, **no build step, no dependencies**. Canvas + Web
Audio APIs do everything. 60 Hz fixed-step loop. World coords 320 × 180,
canvas 960 × 540 (3× render scale, nearest-neighbour).

Story: Danny is a scientist stranded in time, traveling through God's
seven days of creation collecting power cores and time-machine parts
to get home.

## How to run

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

Browsers block `fetch()` from `file://` and MP3 loading uses fetch, so
a static server is required.

**Live preview via GitHack (current branch):**
```
https://raw.githack.com/mountaindrowner/SuperDude-Rescue-/claude/super-dude-danny-platformer-Jftc7/index.html
```

### CACHE TRAP — read this every time the game "won't update"

This game registers a **service worker** (PWA, commit `185d5e4`). Once a
browser loads the game, the service worker caches everything and keeps
serving the cached version even after a `git push`. A regular hard
refresh (Ctrl-Shift-R) is NOT enough.

**To force-update:**
1. DevTools → **Application** tab → **Service Workers** → click
   **Unregister**.
2. **Application** → **Storage** → **Clear site data**.
3. Close the tab, reopen the URL.

**Or** (less disruptive): DevTools → **Network** tab → tick
**Disable cache** → keep DevTools open → refresh. Stays current as
long as DevTools is open.

Service worker cache key is `CACHE_NAME = 'sdd-shell-v3'` in
`service-worker.js`. **Bump this when you ship asset changes** so users
get the new version automatically — but it's already aggressive about
hash-busting JS files, so a bump is only critical for behavioural
changes.

## Dev shortcuts (god mode)

Wired in `js/main.js`. God mode persists across sessions (saved to
localStorage):

| Key       | Where             | Effect                                |
| --------- | ----------------- | ------------------------------------- |
| `G`       | any scene         | Toggle god mode on/off.               |
| `N`       | level scene only  | Skip current level (god mode).        |
| `1`–`7`   | any scene         | Jump straight to Day N (god mode).    |

The **in-game level editor** is reached via main menu →
"LEVEL EDITOR" (only shown when `js/editor.js` is loaded).

## File layout

```
index.html             entry point — loads all 22 scripts in dep order
manifest.webmanifest   PWA manifest
service-worker.js      PWA service worker (cache-first; bump CACHE_NAME)
css/style.css          page + touch-control layout

js/
  save.js              localStorage save v3 (3 difficulty slots + options)
  input.js             keyboard + touch
  audio.js             chiptune synth + MP3 loader (assets/music/*.mp3)
  sprites.js           ~2900 lines of procedural pixel art + image loaders
  engine.js            physics, collisions
  entities.js          ~2200 lines: player + enemies + items + variants
  level1.js            Day 1-1 data
  level_<d>_<s>.js     Days 2-1 through 7-1 (12 stages total; ALL editor-tuned)
  quiz_data.js         scripture quiz Q&A per day
  scenes.js            ~3300 lines: logo/title/menu/intro/overworld/
                       level/results/quiz/gameover/finale + drawSky_* per biome
  editor.js            ~1750 lines: in-game level editor (dev tool)
  main.js              boot + scene manager + fixed-timestep loop

assets/
  level 6 bugs background.png   painted canopy for Day 6-2 (current WIP)
  music/                MP3 soundtrack (37 tracks, ALL wired in audio.js)
  Super Dude Danny Big Sprites/    reference PNGs (not loaded at runtime)
  Super Dude Danny Small Sprites -/ reference PNGs (not loaded at runtime)
  title.png, overworld.png, lab.png, timemachine{,_broken}.png
  icon-{192,512,512-maskable}.png, apple-touch-icon.png   (PWA icons)

tests/
  test_overworld.js              static + optional Puppeteer in-game render
  test_vines_3_2.js              Puppeteer vine reachability
  test_editor_flappy_hitbox.js   editor hitbox slider test
  test_preflight_stages.js       per-stage preflight screenshots
  screenshot_stages.js           screenshot helper

tools/
  swim-bbox.html        interactive swim-sprite bbox tuner

test/sprites.html       standalone sprite preview page
```

## Architecture

- Everything lives on the global `window.SDD`. Each JS file is an IIFE
  that attaches its exports. No modules, no bundler.
- **Scene manager**: `SDD.setScene(name, data)`. Scenes implement
  `{ enter, exit, update(dt), render(ctx) }`. Registered scenes:
  `logo`, `title`, `intro`, `menu`, `difficulty`, `overworld`,
  `level`, `quiz`, `results`, `gameover`, `finale`, `editor`.
- **Render scale**: world is 320 × 180; canvas is 960 × 540; main loop
  calls `ctx.setTransform(3, 0, 0, 3, 0, 0)` before each scene render
  and resets after.
- **Levels**: registered as `SDD.levels['d-s']` (e.g.
  `SDD.levels['3-2']`). Each is a plain object with `width`, `height`,
  `ground`, `tiles`, `spawns`, `movers`, `name`, `theme` (and
  optionally `themeZones` for multi-biome stages like 6-1).

## Save system (v3)

- Key: `localStorage['superDudeDanny.save.v3']`.
- **Three independent difficulty slots**: `easy`, `medium`, `hard` —
  each tracks unlocked progress, completed stages/days, best times,
  best core counts, and scripture quizzes passed.
- Global options outside the slots: `muted`, `volume`, `god`.
- Auto-migrates v1 → v2 → v3 into the medium slot. Don't break the
  migration; users have saves out in the wild.
- `SDD.save.data.completedStages.push(...)` etc. still works — `data`
  is a live proxy onto the active slot.

## Audio system (`js/audio.js`)

Two paths, in this order of preference:

1. **MP3 tracks** from `assets/music/`. Files: `title`, `menu`, `intro`,
   `overworld_a/b`, `results_a/b`, `gameover_a/b`, and per-level
   `level_<d>_<s>_<a|b|c>.mp3`. Loaded via `fetch` →
   `decodeAudioData` on first user gesture.
2. **Synthesised chiptune fallback** — `NOTES`, `tone()`, `noise()`,
   `SFX`, `SONGS`. Always works even when MP3s missing.

SFX (jump, stomp, blast, core, power, grow, hit, die, etc.) are
synthesised regardless.

## In-game level editor (`js/editor.js`, scene `editor`)

Accessed via main menu → **LEVEL EDITOR**. Pure dev tool — has clear
removal steps in the file header comments if shipping to public.

Features:
- Paint tiles, place/edit spawns + movers, configure stage settings.
- **Save** writes the edited level back to `js/level_X_Y.js` via the
  File System Access API (Chrome/Edge desktop) or a download fallback.
- **Test** jumps into the regular level scene with edits live.
- **Variant library** (`SDD.editorLib`): save multiple variants per
  stage, swap active variant.
- **STAGE tab**: per-size flappy hitbox sliders, theme/zones, etc.
- **COPY MAINS**: dumps active variants to clipboard.
- Camera overscroll so stage edges clear the UI panels.

**All 12 stages already have editor-tuned data** committed (commits
`db466a6`, `6f8818b`, `38094e9`). Future tuning passes can edit
in-game and re-export.

## Difficulty + scripture quiz

- **Difficulty picker scene** (`difficulty`) — first run picks
  easy/medium/hard; can be changed from pause menu options.
- **Checkpoints** in 11 of 12 stages — touching one stores spawn
  position; death respawns there.
- **Scripture quiz** between days — `quiz` scene reads from
  `js/quiz_data.js`, asks 3 multiple-choice questions about the day's
  Genesis chapter. Pass to unlock the next day; fail to retry.

## Day-by-day status

All 12 stages have complete editor-tuned level data and are playable:

| Stage | Name                    | Theme        | Notes                              |
| ----- | ----------------------- | ------------ | ---------------------------------- |
| 1-1   | Light & Darkness        | sky          | Tutorial-style.                    |
| 2-1   | Sky Above               | sky          | Cloud ladder.                      |
| 2-2   | Sea Below               | sea-surface  | Moving platforms over water.       |
| 3-1   | Mountain Rise           | rocky        | Lava plume + brick climbing.       |
| 3-2   | Garden Path             | forest       | Vine grapple + canopy maze.        |
| 4-1   | Solar Climb             | sunlit       | Solar flares, blast platform.      |
| 4-2   | Moonlit Run             | cosmic-night | Low gravity, scattered parkour.    |
| 5-1   | Wings of Day            | bird-sky     | Flappy mode + tornadoes.           |
| 5-2   | Deep Currents           | seaside      | Underwater + electric eels.        |
| 6-1   | Plains to Forest        | savanna→forest→bugscale | Multi-zone arc.       |
| 6-2   | **Bug World**           | bugscale     | **WIP — image background pending** |
| 7-1   | Sabbath Finale          | eden         | Calm Eden, no enemies, Adam+Eve.   |

(Old `README.md` claims only Day 1 is playable — that's outdated and
should be ignored.)

## Themes / sky functions

Per-biome sky painters live in `scenes.js` and are wired through
`THEMES`:

```
sky, sea-surface, rocky, forest, sunlit, cosmic-night, bird-sky,
seaside, savanna, village-dusk, eden, bugscale, galactic
```

Each is a function `drawSky_<name>(g, camx, camy, prog, t)`. Themed
**one-way platforms** exist for all 13 biomes (commit `d8f7782`).

Currently editing: `drawSky_bugscale` at `scenes.js:1881`. See WIP
section at top.

## Tests

```sh
node tests/test_overworld.js              # static placement checks
node tests/test_overworld.js --ingame     # + Puppeteer screenshot
node tests/test_vines_3_2.js              # vine reachability
node tests/test_editor_flappy_hitbox.js   # editor hitbox slider
node tests/test_preflight_stages.js       # per-stage preflight PNGs
```

Puppeteer + canvas modules expected in `/tmp/node_modules/` — install
on demand: `cd /tmp && npm install puppeteer canvas`.

## Conventions

### Commit messages

Title-case scope + colon + comma-separated specifics. Match existing log:
- `Day 6-1 savanna: lion + porcupine walker variants`
- `Pass 9 polish wave 6: clam walker, visible lava + nozzles, blast height fix`
- `Wire Mark's MP3 music: per-scene/per-level loader with variants`
- `Editor: STAGE tab with per-size flappy hitbox sliders`

### Branch policy

- **Always** work on `claude/super-dude-danny-platformer-Jftc7`.
- **Always** `git push -u origin claude/super-dude-danny-platformer-Jftc7`
  after every commit so work survives a session crash.
- **Never** push to `main` without explicit permission.
- **Do not** open pull requests unless Mark explicitly asks.
- The other branches (`main`, `claude/project-continuation-L24du`)
  are stale; ignore them.

### Code style

- IIFEs attaching to `window.SDD`. No `import`/`export`.
- Plain `var`/`function` — ES5-ish, runs in any modern browser
  without transpiling.
- No emojis in code, commits, or PR bodies.
- No comments unless WHY is non-obvious.

## How to back up the project (Mark, do this anytime)

### Option A — full git clone (preserves history)

```sh
git clone https://github.com/mountaindrowner/SuperDude-Rescue-.git
cd SuperDude-Rescue-
git checkout claude/super-dude-danny-platformer-Jftc7
```

Everything is now on your machine, including this CLAUDE.md and every
commit ever made.

### Option B — ZIP download (no git, no history, just the files)

1. Open
   <https://github.com/mountaindrowner/SuperDude-Rescue-/tree/claude/super-dude-danny-platformer-Jftc7>
2. Green **Code** button → **Download ZIP**.
3. Unzip, open `index.html` via a local server (see "How to run").

### What's essential vs disposable

| Keep                                      | Disposable                          |
| ----------------------------------------- | ----------------------------------- |
| `index.html`, `css/`, `js/`               | The 15 loose `level X-Y.mp3` files at repo root (duplicates of `assets/music/`) |
| `assets/music/`, `assets/*.png`           | `test/sprites.html` (preview only)  |
| `manifest.webmanifest`, `service-worker.js` |                                    |
| `CLAUDE.md` (this file)                   |                                     |
| `README.md`                               |                                     |
| `tests/`, `tools/`                        |                                     |

## How to resume in a new Claude Code session

Paste this into a new session as the first message:

> I'm continuing work on Super Dude Danny. The repo is at
> `mountaindrowner/SuperDude-Rescue-`. **Read `CLAUDE.md` first** —
> it has the full handover, file layout, architecture, and "where we
> are right now" section. The active branch is
> `claude/super-dude-danny-platformer-Jftc7`. Don't switch branches.
> When you've read CLAUDE.md, tell me what the last committed work
> was and what's pending, then wait for instructions.

That single prompt + this file is enough to bootstrap any new session.

---

## Changelog of this handover file

- **2026-05-26** — Initial handover written on Jftc7 at commit
  `b6f6149` (canopy PNG loader, sky function rewire pending).
- **2026-05-26** — Added `PLAN.md` with the full design history
  (Passes 1-11 + music asset list). Updated WIP to point at the bug
  world canopy rewire as the active edge. Added a "Pending roadmap"
  list capturing the still-live polish items.
- **2026-05-26** — Wired Mark's painted canopy PNG into
  `drawSky_bugscale`. Procedural far/mid/top/foreground branches
  dropped; sun pool + pollen + cocoon kept as overlays. Service
  worker cache bumped to `sdd-shell-v4`. WIP section updated to
  "screenshot + iterate"; editor pass on 6-2 moved up the roadmap.
