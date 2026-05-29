# Super Dude Danny — Session Handover

> **If you're a new Claude Code session reading this for the first time:**
> read this whole file before touching anything. It is the durable
> handover between sessions. The remote execution env is ephemeral —
> only what's pushed to GitHub survives a crash. Update this file as
> major work lands.

---

## WHERE WE ARE RIGHT NOW (latest first — read this first)

- **Active branch**: `claude/super-dude-danny-platformer-Jftc7` (always work here)
- **Latest commit**: New mechanic — falling-leaf platform streams.
  `LeafFall` + `LeafSpawner` entities in `entities.js`, `leafstream`
  spawn type in `scenes.js`, editor palette + defaults, 3 demo
  spawners placed across the cols-87→113 gap in 6-2. Leaves drift
  down with gentle horizontal sway, act as one-way platforms (plug
  into the existing `level.platforms` array + ride logic), despawn
  past the bottom. Continuous flow gated by `period` per spawner.
- **Batch progression**: A ✅ B ✅ C ✅ D ✅ E ✅ F ✅ — all Mark-queued
  batches shipped. Falling-leaves landed on top as a new freeform
  mechanic he proposed mid-flight.

### Batch tracker

| Batch | Status | Notes |
| --- | --- | --- |
| A — Editor flappy hitbox sliders | shipped | `e331bf8` |
| B — 6-1 enemies | shipped | `8058c5b` Batch B |
| C — 6-2 → Bug World | shipped + extended | `9d01ba7` + 4 follow-ups + canopy PNG (`42a4a5b`) |
| D — 7-1 Adam/Eve dialogue | shipped | Per-spawn `line` field; 7 NPCs themed (`c140271`) |
| E1 — remove wing-burst + friendship-token | shipped | `b5236c4` |
| E2 — pearl shell / cooling water lava-walk / leaf shot | shipped | `6c252d3` |
| E3 — three Bug World signatures (friendly-bugs, pollen-trail, beetle-ride) | shipped | `c49f2b8` |
| E4 — air-bubble visible bubble + calling-horn freeze tint + duration bump | shipped | `2daef0f` |
| E5 — verbiage polish + 4-2 gravity bump | shipped | `d9f461c` |
| F — Per-signature particle indicators | shipped | `drawSigParticles` switch on kind, called from `drawSignatureSymbol`. Each kind gets unique emissions around the floating icon. |

### Pending roadmap (outside the batch flow)

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

## Dev-kit removal list (strip before public release)

Mark wants these three dev-only things kept for now but **removed when
the game is fully shipped to the public**:

1. **God mode** — toggle in OPTIONS scene (`scenes.js`, options `idx===2`),
   the `GOD` HUD badge (`scenes.js` ~`text(g,'GOD',...)`), the
   "PRESS G…" hint line, and all `SDD.save.data.options.god` branches in
   `entities.js` / `scenes.js`.
2. **Level editor** — `js/editor.js` + its `<script>` tag in `index.html`
   + the menu item (auto-hidden when the script is absent, so removing the
   script tag is enough).
3. **On-screen version number** — `SDD.VERSION` display on the menu
   (`scenes.js` menu render) + the `SDD.VERSION` constant in `js/main.js`.

### Build version (front-page) + ship process

- `SDD.VERSION` lives at the top of `js/main.js` and renders bottom-right
  on the menu so we can tell at a glance which build is live.
- **On every ship/push, bump `SDD.VERSION` (`v0.NN`) in lockstep with the
  service-worker `CACHE_NAME` (`sdd-shell-vNN`)** so the displayed version
  and the cache generation always match. Current: `v0.38` / `sdd-shell-v38`.

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
- **2026-05-26** — Batch D: per-spawn Adam/Eve dialogue in Day 7-1.
  NPC constructor now takes an optional `line` override; spawns can
  set `line: '...'` to differ from the kind default. 7 Adam/Eve
  NPCs themed across the level. Added a batch tracker table to the
  WIP section so progression is obvious at a glance.
- **2026-05-26** — Batch E (E1-E5): signatures redesign. Removed
  wing-burst + friendship-token (both inert). Pearl became a 1-hit
  protective shell (replaces the old useless drag tweak). Cooling
  water now actually lets Danny walk on L lava tiles, not just block
  lava-plume projectiles. Vine grapple renamed `leafshot` with a
  new green-leaf projectile fired by B (player doesn't need blast
  power-up while signature is active). Three new Bug-World
  signatures placed in 6-2: friendly-bugs (bees + beetles phase
  through), pollen-trail (cores magnet within 48 px), beetle-ride
  (visible goliath beetle mount auto-stomps Walkers). Air-bubble
  now draws a visible bubble around Danny; calling-horn bumped
  8s → 12s + frozen enemies render desaturated/translucent so the
  freeze is obvious. 4-2 gravity un-floated 0.48 → 0.72.
- **2026-05-26** — Batch F: per-kind particle effects on every
  active signature's floating indicator. New `drawSigParticles`
  helper in `entities.js` switches on kind; each emits unique
  visuals (sunburst rays, cloud-glide wisps, pearl sparkles,
  cooling-water droplets, leafshot spinning leaves, sunshield
  expanding halos, starjump pop sparkles, airbubble rising bubbles,
  callinghorn forward sound waves, friendly-bugs orbiting bees,
  pollen-trail rising flecks, beetle-ride dust kicks, dove-blessing
  falling feathers). Called from `drawSignatureSymbol` right after
  the icon draw. All effects driven by `signatureT` so no
  per-particle state needs tracking.
- **2026-05-26** — New mechanic: falling-leaf platform streams.
  Two new classes in `entities.js`: `LeafFall` (one-way moving
  platform that drifts vertically + gently sways horizontally,
  removes itself off-screen) and `LeafSpawner` (invisible periodic
  spawner that pushes new `LeafFall`s into `level.platforms`).
  Wired as a `leafstream` spawn type in scenes.js; editor palette +
  defaults updated. Platform compaction added so dead leaves are
  culled. Plugs into the existing `MovPlat` ride logic without any
  engine changes - LeafFall just exposes `x/y/w/h/dx/dy` and the
  player rides it. 3 demo spawners placed across cols 87-113 in 6-2;
  Mark can editor-tune positions / period / fall speed / sway in-game.
- **2026-05-26** — Cinematic polish: rename DANNY → SUPER DUDE
  DANNY across intro + finale beat text + game-over caption + lab
  caption + end-card recap. Intro beat 3 (arrival) now uses a
  cosmic backdrop (deep navy gradient + starfield + two nebula
  blobs) instead of the dawn gradient with green ground + yellow
  sun; busted machine has five rising smoke puffs that drift up
  and fade. Finale beats 0/1/2/4 now use the painted ART_LAB
  backdrop + painted ART_MACHINE PNG (instead of the procedural
  box) so the lab beats match the intro's painted look; charging
  beat 2 keeps the electric arcs + brief flash but the machine is
  the painted version with the dome glow overlay. End-card text
  updated.
