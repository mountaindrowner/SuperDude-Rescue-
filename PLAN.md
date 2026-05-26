# Super Dude Danny — Full Design History

> This file preserves the chronological design / planning history that
> Mark and previous Claude Code sessions agreed on across Passes 1
> through 11. **Almost all of it has shipped** (cross-reference
> `git log` against the per-pass file lists). New sessions should read
> `CLAUDE.md` first for the current state and active work-in-progress;
> this file is here as a record of *why* the codebase looks the way it
> does, and as a source for any deferred follow-ups still on the queue.
>
> One known divergence from the plan: **Day 6-2 was changed from
> "MANKIND" (NPC village) to "BUG WORLD" (bug-scale canopy)** during
> the most recent session. The Mankind spec below is historical.

---

## Project Overview

### Context

"Super Dude Danny" is the real game now, not a POC. It's a Mario-style,
kid-accessible 2D platformer themed around the seven days of God's
creation. All 12 stages (Days 1 through 7-1, two per day for Days 2-6),
the title / menu / overworld / cinematic framing, the PixelLab Danny
sprites, the per-biome themed enemies and tiles, the Flappy-style 5-1,
the underwater 5-2, the per-day signature mechanics, the in-game god
mode for testing — all in place and pushed to main. Top priority stays
the same: accessibility (young kids, playable on mobile). The rest of
this document is the chronological design history of how each pass
landed, ending with the active pass at the bottom.

### Plot

Danny is a scientist in his 30s — backwards hat, black-rimmed glasses,
scruffy beard and hair, white lab coat, wristwatch (left hand), jeans,
sneakers, black shirt with an atomic symbol. He built a time machine
to witness God's creation, traveled back, and got stranded. He must
collect power cores and recover time-machine parts to repower the
machine and return home. The full journey spans the seven days of
creation; this POC covers Day 1 (Light & Darkness) end to end.

### Confirmed decisions

- **Scope**: Day 1 only — one polished level plus full title / menu /
  overworld / cinematic framing. Engine built so more days and stages
  drop in later.
- **Packaging**: multiple files (HTML / CSS / JS in folders), runnable
  by opening `index.html` directly — no build step, no server.
- **Controls**: keyboard (arrows + A/B keys) AND on-screen touch
  controls (D-pad + A/B).
- **Art**: hand-coded canvas pixel art in an 8/16-bit style, structured
  so final art assets swap in cleanly.

### Design (settled over a five-round requirements interview)

#### Gameplay & mechanics

- In-level controls: left/right to move, A to jump, B to fire the light
  blast (once that ability is held).
- Day 1 theme: light vs darkness is cosmetic only — bright palette,
  themed backgrounds/parallax. Standard, accessible platforming; no
  light mechanic.
- Health = hidden 2-hit bar (size): small Danny / big Danny, like Mario.
  A growth power-up inside a hittable block grows small→big. A hit
  shrinks big→small; a hit while small triggers the death animation
  (defeated pose, then he disappears). No health HUD — Danny's size
  IS the health bar.
- Light-blast ability (B): a separate power-up found in special,
  hard-to-reach power blocks. Once collected, B fires a short-range
  burst of light that destroys enemies. Retained until death; on
  respawn Danny returns small with no blast.
- Blocks: Mario-style hittable blocks — some hold the growth power-up,
  some the light-blast power-up (placed to be a challenge to reach),
  others give bonus power cores.
- Enemies — shadow creatures, drawn cute, not scary: a shuffling
  shadow-blob walker, a floating wisp flyer (hovering/vertical
  movement), and a stationary shade thrower that lobs slow dark orbs
  at fixed intervals. The walker and flyer can be stomped; the shade
  thrower is stomp-proof and must be hit with the light blast or
  avoided — giving the blast a clear purpose.
- Power cores: optional bonus collectibles, in plain sight but on
  challenging routes; story-framed as repowering the time machine.
  Shown on the HUD.
- Level goal: Danny recovers a time-machine part at the level's end;
  grabbing it completes Day 1.
- Hazards: bottomless pitfalls and moving platforms (timing challenge).

#### UI & UX

- Boot: Church of the Crossroads logo as the intro card — fades in,
  chirp, fades out — then the menu.
- Start menu: SUPER DUDE DANNY title with New Game and Continue
  (Continue only when a save exists), plus Options (sound on/off +
  volume) and How to Play.
- Overworld: creation-themed map with all seven days as nodes along a
  path; Danny walks to a node and presses A to enter; Day 1 unlocked,
  Days 2-7 locked.
- HUD (in level): lives remaining, power cores collected, level timer.
  Health is shown by Danny's size, not a HUD pip.

#### Story & cinematics

- Opening: a short animated intro in the game's pixel style on New
  Game — Danny in his lab, the time machine sparks to life, he travels
  back, it breaks down, and he's stranded at the dawn of creation. A
  few scene beats with short captions; skippable.
- Day 1 completion: a "Day 1 Complete!" results screen (timer, power
  cores, lives), then back to the overworld. No finale teaser — the
  grand ending cinematic waits until the rest of the days are built.

#### Difficulty & accessibility

- Lives: classic 3 lives, no mid-level checkpoint; death restarts the
  level; game over returns to the overworld and the level stays
  retryable.
- Hazards: bottomless pitfalls and moving platforms only.
- Bright, non-scary art; clear How to Play screen; keyboard + touch
  controls.

#### Technical

- Runs with no build step or server: `index.html` loads plain classic
  `<script>` files (not ES modules), so the game works opened directly
  from the file system — deliberate, for shareability and accessibility.
- Rendering: HTML5 Canvas 2D at a fixed internal resolution (320×180,
  16:9), scaled up with nearest-neighbour
  (`image-rendering: pixelated`); canvas scales responsively to any
  window size or orientation.
- Game loop: `requestAnimationFrame` with a fixed-timestep accumulator
  for deterministic physics.
- Input: keyboard (arrows/WASD; Space or Z = A/jump; X or Shift =
  B/blast) and an on-screen multi-touch overlay (D-pad bottom-left,
  A/B bottom-right).
- Audio: Web Audio API only — synthesized chiptune music
  (title/overworld/level loops) and SFX (jump, stomp, blast, coin,
  hit, death, chirp). AudioContext resumed on first user gesture.
  Mute/volume in Options, persisted.
- Save: localStorage (key `superDudeDanny.save`) — completed/unlocked
  days, Day 1 best time and best power-core count, audio options.
  Continue appears only when a save exists.
- Art is swap-ready: sprites are small pixel-maps + a palette,
  pre-rendered to offscreen canvases at boot.

---

## Days 2-7 — Full Game Expansion Plan

### Context

Day 1 is built and Mark is happy with it ("absolutely fantastic").
Time to expand to the full seven-days-of-creation arc. Genesis groups
two created things on most days, so each day cleanly splits into two
stages.

### Confirmed decisions

- **Structure**: 2 stages per day after Day 1 → Days 2-6 = 2 stages
  each (10 new stages), Day 7 = 1 peaceful stage + grand finale
  cinematic.
- **Mechanic variety**: core controls stay identical; 3 specific days
  get a single new mechanic — climbing (Day 3), low-gravity (Day 4),
  swimming (Day 5).
- **Enemies**: the existing 3 archetypes (walker / flyer / thrower)
  are re-themed per day, plus 1 signature new enemy per day.
- **Goal**: Danny recovers a time-machine part at the end of every
  stage (11 parts across the full game).
- **Power-ups**: same growth + light-blast everywhere. No new
  abilities to learn.
- **Difficulty arc**: gentle — Days 2-3 ≈ Day 1, Days 4-6 a touch
  tougher, Day 7 calm. Accessibility for kids stays priority #1.

### Day-by-day design

| Day | Stage 1 | Stage 2 | New mechanic | Signature new enemy |
| --- | ------- | ------- | ------------ | ------------------- |
| 2 Sky & Waters | The Firmament (clouds, wind) | The Waters Below (waves, splashes) | — | Wind gust — stationary, pushes Danny back |
| 3 Land & Plants | Forming Land (rocky / mountains) | Vegetation (forest) | Vine climb (Stage 2) | Thorn vine — vertical wall hazard |
| 4 Sun, Moon & Stars | The Sun (bright high sky) | Moon & Stars (night cosmos) | Low gravity (Stage 2) | Comet — falls in a diagonal arc |
| 5 Birds & Sea Life | The Skies (birds soaring) | The Seas (underwater) | Swimming (Stage 2) | Jellyfish — drifting water hazard |
| 6 Animals & Mankind | Wild Animals (savanna / jungle) | Mankind (peaceful village) | — | Friendly NPCs (Adam & Eve hand Danny power cores) |
| 7 Rest (Sabbath) | Garden of Eden — no enemies, gentle collectibles, calm music. Reaching the rebuilt time machine triggers the Grand Finale Cinematic | — | — | — |

(See full pass plans below for engine work, asset checklists, and
implementation order.)

---

## Pass 1 — Polish & Identity Pass

Per-day signature looks (per-biome sky painters + themed ground
variants), block + brick redesigns, gravity softening, HUD day
subtitle, Day 1 light burst, low-gravity tuning for Day 4-2. Pass 2
deferred (Flappy 5-1, fully-underwater 5-2, multi-biome 6-1,
civilization arc 6-2, vine-maze 3-2, Eden enhancements, etc.).

---

## Pass 3 — Design Overhaul (12 levels redesigned)

### Context

Mark played through Pass 2 and audited: per-day "look" only changed
in the sky (ground/bricks/platforms stayed generic), most levels feel
same-y, maps too short for the variety, character drop-shadow
ellipses no longer fit.

Platformer-design philosophy: **Teach → Test → Twist → Reward**.

### Tile family map (6 families ⇒ 12 themes)

| Family | Themes that use it | Palette / look |
| ------ | ------------------ | -------------- |
| Lush | forest (3-2), eden (7-1), village-dusk (6-2) | deep green grass, rich brown earth, mossy stone |
| Bright-Sky | sky (2-1), bird-sky (5-1) | pale cloud-soft ground, white/pink stone |
| Sea | sea-surface (2-2), seaside (5-2) | sand top, wet sand sub, coral bricks |
| Rocky | rocky (3-1), savanna (6-1) | gray/tan stone, dry dirt, jagged rock bricks |
| Cosmic | galactic (1-1), cosmic-night (4-2) | dark crater surface, starry sub, meteor bricks |
| Sunlit | sunlit (4-1) | gold sand top, sunbleached sub, sandstone brick |

### Per-level redesign briefs

Every level rewritten with a signature mechanic following the
Teach → Test → Twist → Reward arc, roughly doubled in width. Existing
engine mechanics reused; only Day 4-1 and Day 4-2 introduce a new
"sky hazard" projectile spawner.

| # | Name | W | Signature mechanic |
| --- | --- | --- | --- |
| 1-1 | LIGHT AND DARKNESS | ~380 | Foundational: jump → pit → moving platform → blast power-up |
| 2-1 | THE FIRMAMENT | ~240 | Stacked one-way cloud ladders (vertical climbing without vines) |
| 2-2 | THE WATERS BELOW | ~240 | Timed moving platforms over water |
| 3-1 | FORMING LAND | ~240 | Brick-stack climbing |
| 3-2 | VEGETATION | ~260 | Vine maze |
| 4-1 | THE SUN | ~240 | Solar-flare drops |
| 4-2 | MOON & STARS | ~260 | Low gravity + drifting meteors |
| 5-1 | THE SKIES | ~360 | Flappy mode |
| 5-2 | THE SEAS | ~320 | Fully underwater |
| 6-1 | WILD ANIMALS | ~240 | Enemy gauntlet |
| 6-2 | MANKIND | ~240 | NPC trail / village navigation (**now Bug World — see CLAUDE.md**) |
| 7-1 | DAY OF REST | ~200 | Peaceful walk |

---

## Pass 4 — Critical Playtest Fixes

### Highlights

- **Drop-through one-way platforms**: Down + A (Mario / SMB3 style).
- **Mobile viewport fix**: `viewport-fit=cover`, `100dvh` with `100vh`
  fallback, `env(safe-area-inset-*)` padding.
- Impassable spots in 2-1, 3-2, 4-1, 5-1 fixed.
- Pit-escape rule: every walking-mode level gets a single bottom row
  of `X` (death floor) below any pit so falls trigger clean death.
- Day 1 planetoid removed from `drawSkyGalactic`.
- Results screen layout cleanup (drop LIVES LEFT, contiguous rows).

### Queued for Pass 5

Lava plumes for 3-1, crab thrower variant for 2-2, horizontal meteors
for 4-1, more space platforms for 4-2, cloud-creature shooter wisp for
2-1, bigger animated bird wisp, Day 3-2 background (green mountains +
dense forest), menu/god-mode text overlap fix, overworld map redesign,
intro polish, spacesuit + jetpack Danny sprites.

---

## Pass 7 — Painted Overworld Backdrop

### Context

Pass 6 swapped the procedural 7-day overworld for a 12-named-stage
serpentine map with a swap-in art hook at `assets/overworld.png`.
Mark commissioned a hand-painted overworld illustration with 12
isometric biome "islands" connected by a glowing yellow path.

### Decisions

- Use the UNNAMED variant (HUD shows stage name).
- Rename 12 stages to biome names: COSMIC VOID, DAWN SKY, OCEAN,
  MOUNTAINS, FOREST, DESERT, NIGHT SKY, CLOUDS, UNDERWATER, SAVANNA,
  VILLAGE, EDEN GARDEN.
- Don't redraw path or number circles — the image has both painted in.
- State feedback (locked / done / selected) drawn as overlays on top of
  the image.

---

## Pass 9 — Full Playthrough Polish + Bugfix Pass

### P1 — Game-ending blockers

- **Day 5-1 "stuck on barrier" bug**: flapping into the top of a gate
  pillar locks the player; flappy collision resolution fix.
- **Day 3-1 impossible jump** after first lava spout — re-layout
  brick-stack climb.
- **Item-bricks Big Danny can't walk under** — qb() audit + lift.
- **Pause menu Down doesn't work** — listNav fix.

### P2 — High-impact gameplay tuning

- Day 4-2: lower jump impulse / more float, drop meteor count ~40%,
  better meteor art, constellation/light-beam mover platforms.
- Day 2-2: reduce crab shot cadence by 25%.
- Day 4-1: drop meteorH count by ~30%, re-art falling things as sun
  rays.
- Reward: every 20 cores → +1 life.

### P3 — Per-day art + level polish

(Glassy ground for 1-1, smoke wisp + visible lava nozzles + visible
red lava floors + stairs to goal for 3-1, jungle re-skin for 3-2,
sweat overlay for 4-1, cosmic mover platforms for 4-2, wider gates
+ shorter level for 5-1, etc.)

### P4 — Menu / UI / boot polish

Drop placeholder logo screen (painted title IS the title), menu size
+ tagline ("CROSSROADS FOUNDATION ADVENTURE"), intro beat 1 halo
removal, results-screen layout (Big Danny to the right), pause
fix (covered in P1).

### P5 — Player feel / animations

Danny offset on movers, big→small shrink animation + audio, footstep
SFX, overworld walking speed, MAX_FALL terminal-velocity tuning,
growth power-up sprite recenter, blast bound to left-click.

### Out of scope (queued for later)

- Unique power-up per day (deferred — became Pass 10's per-stage
  signature power-ups).
- Sprint / dash button (deferred).
- Astronaut + jetpack Danny sprites (Mark producing).
- Per-day music tracks (Mark composing).
- Background "weird popping" audit (only if it persists after music
  swap-in).
- Custom climb animation for vines (Mark to provide).

---

## Music Asset Shopping List

### Totals

- **7 framing tracks**: title, menu, intro, overworld_a/b, results_a/b,
  gameover_a/b
- **12 biomes × 2 tracks = 24 level tracks** (A theme + B variant)
- = **31 tracks total** (Optional C track per biome for pause overlay)

### Filename convention

`assets/music/<id>.ogg` or `.mp3`. The loader (`js/audio.js`) falls
back to the procedural pattern if the file is missing. `loadFileTrack`
+ `loadLevelTrack` handle this.

(All 31+ tracks have shipped — see `assets/music/`.)

---

## Pass 10 — Distribution + Scripture Quiz + Difficulty + Per-Stage Power-Ups

### Four pieces

1. **PWA distribution** — `manifest.webmanifest`, `service-worker.js`
   (cache-first, versioned), `apple-touch-icon`, icon-192/512.
2. **Scripture quiz** — Between major days (6 quizzes total),
   fill-in-the-blank, graduated hints, source ESV.
3. **Difficulty (easy / medium / hard)** — Three save slots, picked at
   New Game.
   - Easy: ∞ lives, checkpoint respawn, platforms 0.6× speed + 10 px
     wider.
   - Medium: checkpoint respawn, normal lives.
   - Hard: full level reload on death, no checkpoints.
4. **Per-stage signature power-ups** — One themed power-up per stage
   that only exists in that stage (Sun-burst, Cloud-glide, Pearl,
   Cooling water, Vine grapple, Sun-shield, Star-jump, Wing-burst,
   Air-bubble, Calling horn, Friendship token, Dove blessing).

### Save data v3

```js
{
  version: 3,
  difficulty: 'medium',
  slots: { easy: {...}, medium: {...}, hard: {...} },
  options: { muted, volume, god }
}
```

Migration from v2 (and v1) preserved.

### Quiz scene

Eden-like soft background, verse with `___` blank, on-screen keyboard
for mobile, graduated hints (ref → first letter → reveal + "ask a
parent"). Wrong submissions advance hintLevel. Correct submission
saves `slot.quizzesPassed += 'day2'` and routes to overworld.

### Checkpoint entity

Tile code `K`, one per stage near midpoint. Easy/medium use it,
hard ignores. Flag flips from grey to yellow when triggered.

---

## Pass 11 — In-Game Level Editor (removable dev tool)

### Decisions

- One shared layout per stage (difficulty is runtime-only).
- Save via **File System Access API** (Chrome/Edge desktop) with
  download fallback.
- Entry: permanent menu item LEVEL EDITOR.
- God-mode keyboard hotkeys removed; god toggle stays in OPTIONS.

### Scene state

```js
{
  day, stage, tool, brushTile, brushSpawn, brushSize,
  selection, drag, history: [], future: [], fileHandle, cam: {x, y}
}
```

### Tools

- **TILE**: click/drag paints; right-click paints space; brush 1×1/3×3/5×5.
- **SPAWN**: click places spawn of brushSpawn at tile; select to edit;
  DEL removes; arrow keys nudge.
- **MOVER**: click-and-drag from start to end defines mover with default
  `spd: 0.018`.
- **SELECT**: hit-tests across all spawn/mover types.

### Save format

Each `js/level_*.js` becomes a literal data assignment (no helpers).
Engine consumes `SDD.levels[key]` shape-only, so the editor's output
is a clean round-trip.

### Removal for public release (3 deletes)

1. Delete `js/editor.js`.
2. Delete `<script src="js/editor.js"></script>` in `index.html`.
3. Delete `{ label: 'LEVEL EDITOR', act: 'editor' }` in `js/scenes.js`
   and the corresponding handler.

---

## Status snapshot at time of writing this file (2026-05-26)

All of the above (Passes 1, 2, 3, 4, 7, 9, 10, 11, music asset list) is
**shipped** on `claude/super-dude-danny-platformer-Jftc7`. The one
divergence from the plan:

- **Day 6-2 pivoted from "MANKIND" (NPC village) to "BUG WORLD"
  (bug-scale canopy with bees, goliath beetles, leaf platforms).**
  See `CLAUDE.md` for the active Bug World work-in-progress.

### Items from the plan that may still be live / deferred

- Eve + kid NPC sprites for the original 6-2 Mankind (now moot unless
  Mark wants them elsewhere).
- Custom climb animation for vines (Mark to provide).
- Background "weird popping" audit (only if it actually persists).
- Sprint / dash button (out of scope unless re-prioritised).
- Capacitor App Store wrap (PWA shipped; native wrap optional follow-up).
- Animated overlays on the painted overworld (drifting clouds, water
  shimmer) — possible future polish.
- Painted scroll/parchment frames for HUD bars on the overworld —
  possible future polish.
