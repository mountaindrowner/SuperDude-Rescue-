# Super Dude Danny — First-Half Project Handoff

**From:** the first-half AI session (the one that built the prototype era — engine, editor, 12-stage tuning, theme system, batches A–C of the design pass)
**To:** the next AI session, the next developer, the next game's junior designer
**Date of handoff:** end of first-half session, after batch C (BUG WORLD bark/branch/beetle pass)

---

## Scope of this document — read this first

This file is one person's lived view of one project's first half. It is **not** a complete history.

What I (the first-half session) personally did and can speak to with authority:
- Built/refined the hand-rolled vanilla-JS engine (`js/engine.js`, `js/scenes.js`, `js/entities.js`, `js/sprites.js`)
- Built/extended the in-browser level editor (`js/editor.js`)
- Migrated all 12 stages from procedural JS to the editor's flat declarative format
- Designed and shipped per-stage tuning (4-2 gravity, 5-1 flappy hitbox per-size config, 6-1 enemies, 6-2 bug world)
- Wrote the headless-puppeteer pre-flight + screenshot test rigs
- Iterated background painters and the theme-family map

What I did **not** own and cannot speak to honestly:
- Audio pipeline (the `SDD.audio.sfx()` calls and `assets/music/` exist but I never touched them)
- iOS / PWA / phone shipping (no real-device validation in my session)
- Menu polish past what was in the scene names at handoff
- Whether the project ended up on Phaser/Godot/staying vanilla after my session
- The "second half" of the project — the user reports the game continued and finished

**Files marked with [GAP] are recommendation-shaped, not lived-through.** The second-half session should overwrite them with real experience.

---

## How to use this handoff

1. Read sections **00, 14, 15** first (lessons, AI workflow, session recovery). They tell you the operating model.
2. Read sections **04, 09, 10** before changing any code (folders, level system, editor). They tell you the data shape.
3. Read sections **05, 06, 07, 08** before touching art or collision. They prevent the worst regressions.
4. Use **section 19** prompt library to bootstrap a new AI session.
5. Use the **templates** at the bottom to capture current status, restart context, and brief new work.

---

## Table of Contents

- [00 — Top 10 lessons + warnings](#00)
- [01 — Project Overview](#01)
- [02 — How we should have started](#02)
- [03 — Tech stack and engine lessons](#03)
- [04 — Repo and file organization](#04)
- [05 — Art direction and style bible](#05)
- [06 — Parallax background pipeline](#06)
- [07 — Sprite creation pipeline](#07)
- [08 — Bounding boxes, collisions, hitboxes](#08)
- [09 — Tilesets and level building](#09)
- [10 — Level editor lessons](#10)
- [11 — Audio and music pipeline [GAP]](#11)
- [12 — Menus, UI, game flow](#12)
- [13 — Mobile, PWA, iOS shipping [GAP]](#13)
- [14 — AI-assisted development workflow](#14)
- [15 — Session handoff and context recovery](#15)
- [16 — Pixel art tools and MCP notes](#16)
- [17 — Testing, debugging, visual QA](#17)
- [18 — Next-game recommendations](#18)
- [19 — Prompt library for future AI](#19)
- [20 — Final senior-designer advice](#20)
- [Reference — Repo snapshot](#ref-repo)
- [Reference — Level file format](#ref-level)
- [Reference — Editor anatomy](#ref-editor)
- [Reference — Signature powers catalog](#ref-sig)
- [Reference — Theme family map](#ref-theme)
- [Reference — Enemy catalog](#ref-enemy)
- [Templates — Session restart, status, bugs, briefs](#templates)

---
<a id="00"></a>
# 00 — README / START HERE

## What this is
A handoff packet from a finite AI session to whatever comes next: another AI session, another developer, or the same human starting a new game. It captures what worked, what hurt, what we should have done from the start.

## Who it's for
- The next AI session continuing or restarting Super Dude Danny
- A future developer joining the project
- The same human starting the next game and wanting to skip the same potholes

## How to use it before touching code
1. Read sections 00, 04, 09, 10, 15 in that order (≈15 minutes).
2. Open the repo, check current branch, last 5 commits.
3. Run the pre-flight test (`node tests/test_preflight_stages.js`) to confirm the project still boots.
4. Only then start changing code.

## Top 10 lessons (every one of these was lived, not theorized)

1. **The level editor was the single biggest force multiplier.** Build it in week 1, not week 6. Manual JS level files (`box(0,0,12,11,'X'); sp('walker', 18, 10);`) felt clever and became unmaintainable the moment the designer wanted to iterate live.

2. **Separate data from code. Levels are data.** When level files were procedural JS with helper calls, every tweak was a recompile-and-retest. When levels became flat declarative objects (tiles as strings, spawns as arrays), the editor and the engine read the same shape and iteration collapsed to seconds.

3. **Themes are a triple, not a single value.** A theme needs a *tile family* (ground/dirt/brick sprites), a *sky painter*, AND a *variant map* (which walker/wisp/thrower auto-skins to it). If any one of the three is missing, the level looks "borrowed from another stage." Mark's exact phrase was "borrowed from the savanna level" — that was the bug.

4. **Hitboxes are configuration, not magic numbers in spawn code.** The flappy-mode hitbox was hard-coded in `scenes.js:2160` and got overwritten the moment Danny grew. Per-size, per-mode hitbox config in the level data fixed it. Plan for this from day 1.

5. **Pre-flight every stage in headless puppeteer before commit.** One test file (`tests/test_preflight_stages.js`) caught five real bugs before they shipped: missing sprite fallbacks, spawn points buried in walls, flappy stages where the player died on idle, JS errors that only fired on certain stages.

6. **A real pixel-art image beats a canvas-painted approximation every time.** I spent multiple iterations hand-painting a "bokeh canopy" background in Canvas2D. It was never going to match what a single 1664×891 PNG with `ctx.filter='blur(4px)'` could deliver. Decide early: are backgrounds painted or imaged?

7. **Don't redesign mechanics in the same batch as renaming user-facing strings.** Mid-pass, I started rewording the "PEARL POWER" tip to describe the *future* pearl-shell mechanic. The mechanic hadn't shipped yet. The tip would have lied to the player. Always: ship behavior, then ship the words that describe it.

8. **Tip text should describe what actually happens, in words a kid understands.** "Touch enemies — they get zapped!" was wrong (the actual sunburst mechanic is invincibility, not contact damage). "RUN INTO BAD GUYS TO ZAP THEM!" is louder but still wrong. Lock the mechanic, then write the tip.

9. **Long AI sessions die.** This one nearly did, mid-batch. Without a handoff file, the second-half session would have re-invented half the engine. Write a handoff *before* you need one.

10. **Tools first, content second.** Every hour spent on the editor, the pre-flight rig, or a constants file saved many hours of content drudgery later. Always.

## Do not repeat these mistakes

- ❌ Don't put spaces in asset filenames. `assets/Super Dude Danny Big Sprites/` is in this repo. Every cross-platform deploy will eventually pay for that.
- ❌ Don't store editor edits in a parallel data structure. Mutate `SDD.levels[key]` directly; that's what the engine reads on entry. Anything else creates a sync bug.
- ❌ Don't hard-code per-stage tunables (gravity, hitbox, theme variants) in `scenes.js`. Put them in the level data. Otherwise designers can't tune without a code change.
- ❌ Don't ship a theme without all three legs (tile family + sky painter + variant map).
- ❌ Don't write level files as procedural JS unless you accept that you'll throw them away on the first iteration.
- ❌ Don't commit without running the pre-flight test.
- ❌ Don't redesign a mechanic and rename its label in the same commit.
- ❌ Don't let a session die without writing a status file.
- ❌ Don't trust AI-generated sprites without a cleanup pass.
- ❌ Don't render backgrounds in Canvas2D when an image-blur+parallax pipeline would do.

---
<a id="01"></a>
# 01 — Project Overview

## What we built
**Super Dude Danny** (working title; this repo is `SuperDude-Rescue-`). A 2D side-scrolling pixel-art platformer, 12 stages organized as a 7-day biblical-creation arc. The player ("Danny") collects power cores and rescues time-machine parts across themed stages: light/darkness, sky/sea, mountain/garden, sun/moon, sky/sea (flappy + underwater), wild-animals/bug-world, day-of-rest.

Each stage drops one themed "signature" pickup — a per-stage power-up tied to the day's theme (sunburst for Day 1, cloud-glide for Day 2, dove-blessing for Day 7, etc.).

## Audience and tone
- **Ages 8–12, kid-safe.** Easy mode runs with unlimited lives; medium/hard reintroduce a 3-life budget.
- **Bright, gentle, biblical-adjacent.** Enemies stomp/zap into particle bursts. No on-screen death blood or scares.
- **Reading load is low.** Signature hints are short ALL-CAPS one-liners (rewritten in batch 1 of the design pass).
- **NPCs include Adam, Eve, animals (lion, deer, dove).** Day 7 ("DAY OF REST") is the eden finale.

## Genre
Classic 2D platformer in the lineage of Mario / Mega Man, with per-stage gimmicks (low gravity on Moon & Stars, underwater swim on The Seas, flappy-bird flight on The Skies, vine grapple on Garden Path).

## Platform
- **Browser-first.** Pure HTML5 canvas, file:// loadable, no build step required.
- **PWA-ready in structure** — index.html is single-file boot, assets/ has icons (`apple-touch-icon.png`, `icon-512.png`, `icon-512-maskable.png`, `icon-192.png`), but I never validated the manifest/service-worker pipeline myself. See [GAP] section 13.
- **iOS "Add to Home Screen" was the target form factor.** [GAP] never tested on real device in my session.
- **Future native export** was discussed but never scoped beyond "maybe Godot or Phaser later."

## Tech journey, honestly
- **Started as vanilla HTML5 + canvas, no framework, no bundler.** Single canvas at 320×180 internal resolution, integer-scaled for the viewport.
- **Hand-rolled engine:** `js/engine.js` (movement/collision math), `js/scenes.js` (scene manager + per-scene rendering), `js/entities.js` (player, enemies, items, projectiles), `js/sprites.js` (procedural pixel-art painters + image loaders), `js/main.js` (boot).
- **No build step. No TypeScript. No module system.** Everything attaches to `window.SDD`. Worked at this scope; would not scale to a 5-person team.
- **Editor added mid-project** (`js/editor.js`, 1683 lines at handoff). This was the inflection point that made the project shippable.
- **Headless puppeteer for QA** (`tests/test_preflight_stages.js`, `tests/screenshot_stages.js`, `tests/test_vines_3_2.js`, `tests/test_overworld.js`).

## Prototype vs. real maintainable game — the difference

A prototype is a one-person artifact that proves a mechanic feels good. Code can be messy, levels can be hard-coded, you can `git commit` a JS file that calls 200 helpers, and that's fine.

A real maintainable game is the moment any of these become true:
- The designer wants to iterate live, not edit code.
- A second person joins.
- The game has to ship through a real distribution channel.
- You start using the phrase "v2 of the engine."

We crossed that line around the time the editor was needed. In retrospect: **the prototype-to-real transition should be planned, not stumbled into.** The decision is "we're building the editor now" or "we're starting over in Phaser." Either way, decide consciously.

---
<a id="02"></a>
# 02 — How we should have started

Be direct: most of the pain in this project came from decisions we didn't make at the start.

## What should have been locked in week 1

### Engine / framework choice
We went vanilla. It worked, but it cost us a tilemap loader, an audio manager, a scene system, an input layer, and an input-mapping config — all of which Phaser ships with. **Make this decision on day 1, not in month 3.** See section 03.

### Screen resolution and scaling
We picked 320×180 internal, integer-scaled. **This was correct and we did it early.** Keep it. Make it the first constant in your codebase.

### Asset folder structure
We were okay, but:
- `assets/Super Dude Danny Big Sprites/` (spaces in path) → never do this.
- No subfolders for sprites/backgrounds/tilesets/audio → assets directory was flat and chaotic.
- Lesson: **decide the asset tree before you have any assets.**

### Sprite dimensions
Small Danny is 18×22 (with collision 13×23). Big Danny is 24×36 (with collision 14×31). Walker is 16×14. Wisp 14×14. Thrower 16×16. Crab 16×16. **These should have been in a central `SPRITE_DIMS` constants object referenced everywhere, not duplicated across `entities.js` and `sprites.js`.**

### Tile size
16px. Correct. Lock it in `js/engine.js C.TILE = 16` (which is where it is). Keep.

### Collision / bounding-box standards
We treated sprite size = hitbox by default, with ad-hoc overrides bolted on (the flappy override at `scenes.js:2160`). **Should have been: every entity declares `{w, h, anchor}` explicitly at construction; mode-specific overrides go through a documented helper (which is now `SDD.applyFlappyHitboxNow`).**

### Audio format and compression [GAP]
Unspecified at start. There's `assets/music/` and `SDD.audio.sfx('jump')` calls everywhere, but I don't know the format, the compression, or the loading strategy. **Should have been: OGG primary, MP3 fallback, all under 200KB per loop, lazy-loaded per scene.** See section 11.

### Level editor plan
We didn't plan one. It emerged out of pain. **Should have been: tile painter + spawn placer + JSON export, week 1.** See section 10.

### GitHub / repo organization
Single repo, single branch initially. Mid-project we moved to `claude/super-dude-danny-platformer-*` feature branches. **Should have been: branch-per-feature from day 1, main always shippable.**

### Testing checklist
We added pre-flight in week N+5. **Should have been: one test that loads every stage and asserts no JS errors, from the first stage onward.**

### Mobile / PWA requirements [GAP]
Unspecified at start. **Should have been: deploy to a phone in week 1, even if ugly. Find out about iOS audio unlock, viewport scaling, safe-area insets, touch controls — early, not at month 3.**

## Problems that came from not deciding early

| Decision skipped | Pain it caused |
|---|---|
| Asset folder structure | Flat `assets/`, filenames with spaces, no per-theme subdirectories |
| Constants centralization | Sprite dims duplicated; hitbox magic numbers scattered |
| Theme system definition | Themes shipped with partial coverage; "borrowed from savanna" bugs |
| Level editor | Six weeks of hand-coded JS levels that all got rewritten |
| Audio plan | Still a [GAP] in this handoff |
| Mobile plan | [GAP] — never validated in my session |
| Test rig | Several regressions only caught after Mark spotted them in screenshots |

## Recommended "first week of development" plan for the next game

**Day 1**
- Pick engine (Phaser 3 + Tiled is my recommendation, see section 03).
- Lock resolution (recommend 320×180 or 480×270 internal, integer-scaled).
- Lock tile size (16 or 32).
- Build a single moving rectangle on a single tilemap. That's the deliverable.

**Day 2**
- Build (or load) the editor. If Phaser+Tiled, install Tiled and configure level export. If custom, build a 200-line tile painter.
- Make one level loadable from declarative data.

**Day 3**
- One player sprite with idle + walk.
- Collision against tilemap.
- Camera follow.

**Day 4**
- One enemy (walker pattern).
- One pickup (collect for score).
- One signature/power-up so you've thought about temporary state.

**Day 5**
- Theme system: tile family + sky painter + entity variant map. All three legs.
- Two themes. Prove the system.

**Day 6**
- Pre-flight test rig in headless browser. Loads every level, asserts no JS errors, asserts player spawns, asserts goal entity exists.
- Screenshot test rig for visual review.

**Day 7**
- Deploy to a phone. Even ugly. Find out about iOS pain now.
- Write `docs/HANDOFF.md` skeleton. Update it every week.

If you can't do this in 7 days you've picked the wrong engine.

---
<a id="03"></a>
# 03 — Tech stack and engine lessons

## What we used (Super Dude Danny, first half)
- **Vanilla HTML5 + canvas**, single `<canvas>` element
- **No bundler, no build step.** Files loaded directly via `<script>` tags in `index.html`. file:// loadable.
- **No module system.** Everything attaches to `window.SDD` (`SDD.scenes`, `SDD.ent`, `SDD.sprites`, `SDD.engine`, `SDD.save`, `SDD.audio`, `SDD.C`, `SDD.levels`).
- **No TypeScript.** Plain JS, IIFE-wrapped per file for local scope.
- **PixelLab integration** scaffolded in `sprites.js` for loading authored sprite frames; falls back to procedural canvas painting.
- **Headless puppeteer** for tests (`/tmp/node_modules/puppeteer` was installed).

## What worked
- **Zero-friction iteration.** Edit a JS file, refresh the browser, done.
- **AI-readable.** Every AI session could grep the entire codebase without tool-chain context. No "wait, what does this transpile to?" overhead.
- **Easy to drop in QA.** Puppeteer + a few lines of evaluate() and you have a test rig.
- **Easy to share.** `file://` open works on any machine; no localhost needed for many scenarios.
- **Editor lives in the same runtime as the game.** Press TEST in the editor → it's instantly playing your edit.

## What did not work
- **No type safety.** Every "is this field on the level data?" question became a grep. Field renames were find-and-replace gambles.
- **Global namespace pollution.** Everything on `window.SDD`. One bad assignment from a third-party script and the engine is gone.
- **No tilemap loader.** We hand-rolled tile codes ('X', '=', '#', etc.) and a custom map class. Phaser would have given us Tiled support for free.
- **No audio manager.** [GAP] — we have `SDD.audio.sfx()` but I don't know how robust it is on iOS.
- **No scene transitions.** Scene swaps are instant (`SDD.setScene('level', {day, stage})`). No fade, no preload.
- **No physics engine.** Hand-rolled AABB collision in `engine.js`. Worked for our scope; would be painful for slopes/curves.

## Honest framework comparison for a small solo/AI-assisted project

### Vanilla HTML5 + canvas
- **Best for:** prototypes, one-person teams that prize iteration speed, projects where AI is the primary collaborator (no tool-chain context cost).
- **Painful at:** anything beyond ~15 levels, multi-developer teams, mobile shipping, audio robustness.
- **Verdict for SDD:** correct choice for the prototype. Outgrew it.

### Phaser 3 (https://phaser.io)
- **Best for:** browser-first 2D games, kid platformers, anything that needs tilemap + physics + audio + input + scene manager without writing it yourself.
- **Tiled integration is the killer feature.** You build the level in Tiled, export to JSON, Phaser loads it. Our `js/editor.js` is ~1700 lines reinventing this.
- **Audio manager handles iOS unlock automatically.**
- **Painful at:** advanced custom rendering (you're inside Phaser's scene graph), some learning curve.
- **Verdict for next game:** **this is my recommendation.** Every problem we hit (editor, audio, mobile, scene transitions) is already solved.

### Godot
- **Best for:** projects that may eventually need native iOS/Android/Steam export. Scene-based, scriptable in GDScript (Python-ish) or C#.
- **Excellent 2D pipeline.**
- **Painful at:** browser export is HTML5-canvas-bundled, larger file sizes, AI assistants are weaker on GDScript than JS.
- **Verdict for SDD-style project:** great if you commit to native shipping. Heavier than Phaser for browser-only.

### Other (Construct 3, GameMaker, Unity 2D)
- **Construct 3:** visual scripting, fast to prototype, weak AI tooling support.
- **GameMaker:** strong 2D engine, GML scripting, paid.
- **Unity 2D:** overkill for a kid platformer; export sizes large; AI assistants drift on Unity-specific APIs.

## Specific recommendations

| Project shape | Recommended stack |
|---|---|
| Browser kid-platformer, PWA, iOS Add-to-Home-Screen | **Phaser 3 + Tiled + Vite for build + PWA manifest** |
| Native iOS/Android/Steam ambition | **Godot 4** |
| Quick prototype to validate a mechanic | **Vanilla HTML5 canvas** (then port if it works) |
| Multi-developer team | Phaser 3 with TypeScript |

## Final recommendation for the next project
**Phaser 3 + TypeScript + Tiled + Vite + PWA manifest from day 1.** Deploy to a static host (Netlify, Vercel, Cloudflare Pages) weekly. Test on a real iPhone weekly.

Caveat: I'm the first-half session. The second-half session may have already chosen, in which case ignore this section.

---
<a id="04"></a>
# 04 — Repo and file organization

## Current SDD repo at handoff time
```
SuperDude-Rescue-/
├── index.html
├── style.css           (if present)
├── manifest.json       (PWA manifest, if present)
├── service-worker.js   (if present — [GAP], not validated by me)
├── assets/
│   ├── README.txt
│   ├── apple-touch-icon.png
│   ├── icon-{192,512,512-maskable}.png
│   ├── lab.png
│   ├── overworld.png
│   ├── timemachine.png, timemachine_broken.png
│   ├── title.png
│   ├── music/
│   ├── Super Dude Danny Big Sprites/    ← spaces, never again
│   └── Super Dude Danny Small Sprites - /  ← spaces + trailing-dash, definitely never again
├── js/
│   ├── engine.js       (movement/collision math, constants)
│   ├── sprites.js      (procedural painters + PixelLab loader)
│   ├── entities.js     (Player + all enemy/item classes)
│   ├── scenes.js       (scene manager, level scene, menu, overworld, sky painters)
│   ├── editor.js       (in-browser level editor)
│   ├── main.js         (boot)
│   ├── level1.js       (1-1, "LIGHT AND DARKNESS")
│   ├── level_2_1.js ... level_7_1.js   (other 11 stages)
│   └── save.js         (localStorage save)
├── tools/
│   └── swim-bbox.html  (one-off bbox visualizer)
├── tests/
│   ├── test_preflight_stages.js
│   ├── screenshot_stages.js
│   ├── test_vines_3_2.js
│   ├── test_overworld.js
│   └── test_editor_flappy_hitbox.js
└── docs/
    └── (this file)
```

## Recommended folder structure for the next game

```
game/
├── public/                          ← what's served to the browser
│   ├── index.html
│   ├── manifest.json                ← PWA manifest, week 1
│   ├── service-worker.js            ← week 1
│   └── assets/
│       ├── sprites/
│       │   ├── characters/
│       │   │   └── danny/
│       │   │       ├── idle.png
│       │   │       ├── walk.png
│       │   │       └── ... (one PNG per anim or one sheet)
│       │   ├── enemies/
│       │   ├── items/
│       │   └── ui/
│       ├── backgrounds/
│       │   ├── day1_galactic/
│       │   │   ├── far.png
│       │   │   ├── mid.png
│       │   │   └── near.png
│       │   └── day2_sky/ ...
│       ├── tilesets/
│       │   ├── galactic.png
│       │   ├── sky.png
│       │   └── ...
│       ├── audio/
│       │   ├── music/
│       │   ├── sfx/
│       │   └── voice/
│       └── icons/
├── src/
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── MenuScene.ts
│   │   ├── LevelScene.ts
│   │   └── OverworldScene.ts
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── Walker.ts
│   │   └── ...
│   ├── systems/
│   │   ├── input.ts
│   │   ├── audio.ts
│   │   └── save.ts
│   ├── data/
│   │   ├── levels/
│   │   │   └── 1-1.json             ← exported from Tiled
│   │   ├── signatures.ts
│   │   └── themes.ts
│   └── config/
│       └── constants.ts             ← TILE, CANVAS_W, CANVAS_H, etc.
├── tools/
│   ├── editor/                      ← only if not using Tiled
│   └── preflight/
├── tests/
│   ├── preflight.spec.ts
│   └── screenshots.spec.ts
├── docs/
│   ├── HANDOFF.md
│   ├── STYLE_BIBLE.md
│   └── LEVEL_DESIGN.md
└── art-source/                      ← gitignored or separate repo
    ├── aseprite/
    └── psd/
```

## File naming conventions

- **kebab-case for files**: `boot-scene.ts`, `walk-cycle.png`
- **snake_case for asset IDs in code**: `danny_walk_0`, `tile_ground_galactic`
- **No spaces in any filename, ever.**
- **Day-stage IDs everywhere**: `1-1`, `2-1`, ..., `7-1`. Consistent across level files, save data, editor stage map, theme variants.
- **Sprite frames**: `<character>_<anim>_<frame>.png` e.g. `danny_walk_0.png`, `danny_walk_1.png`
- **Backgrounds**: `<theme>_<layer>.png` e.g. `galactic_far.png`, `galactic_mid.png`
- **Audio**: `sfx_<event>.ogg`, `music_<scene>.ogg`

## Why `public/assets/` matters for web deployment

- The static host serves `public/` as the web root. Every asset URL is stable: `/assets/sprites/danny_walk_0.png`.
- The service worker caches by URL. If asset paths drift between dev and prod, the cache breaks silently.
- iOS Safari's PWA cache is especially unforgiving. Stable paths = working PWA.
- Build tools (Vite, Webpack) treat `public/` as "pass-through": files copy verbatim, no hashing, no transforms. Predictable.

## How to prevent asset chaos

1. **One canonical location per asset type.** Sprites in `public/assets/sprites/`. Backgrounds in `public/assets/backgrounds/`. Tilesets in `public/assets/tilesets/`. No exceptions, no "temp" folders.
2. **Asset manifest file.** Maintain `src/data/asset-manifest.ts` listing every asset with its path. Loader reads from this. Renaming a file fails loudly.
3. **No source files in `public/`.** PSDs, Aseprite files, raw Midjourney exports go to `art-source/` outside the deploy.
4. **gitignore**: `.DS_Store`, `Thumbs.db`, `node_modules/`, `dist/`, `art-source/raw/`.
5. **Pre-commit hook** (optional): reject filenames with spaces or capital letters.

## Rules for what never goes where

- Never put `.psd` / `.aseprite` / `.kra` files in `public/`. They'll deploy.
- Never put `node_modules` in git.
- Never let level data live in code (helpers + procedural calls). Level data is JSON/declarative.
- Never let constants (TILE, CANVAS dims, sprite sizes) live in multiple files.
- Never put credentials, API keys, or `.env` files in git.

---
<a id="05"></a>
# 05 — Art direction and style bible

## The style we landed on
- **16-bit pixel art** at 16×16 base tile.
- **Filtered light**: every theme has a warm sun-pool radial gradient over a cool vertical gradient (sky → mid → ground).
- **Soft shape language**: rounded silhouettes for friendlies, angular for hazards.
- **Multi-layer parallax**: 3–4 layers per scene; far is bokeh/atmospheric, near is sharp.
- **Limited per-theme palette**: 6–10 colors per theme, named (e.g. forest = `lfA, lfL, lfB, lfStem` in `sprites.js C`).
- **Kid-safe everything**: no blood, no scares, no dark imagery. Even "wild animals" stage has cartoon lions.

## The 12 themes (in shipping order)

| Day-Stage | Name | Theme key | Mood notes |
|---|---|---|---|
| 1-1 | LIGHT AND DARKNESS | galactic | Cosmic void, glassy obsidian platforms, starry parallax. Foundational tutorial level. |
| 2-1 | THE FIRMAMENT | sky | Bright cloud realm, soft pinks/blues, fluffy cloud platforms. |
| 2-2 | THE WATERS BELOW | sea-surface | Surface of the ocean, blue gradients, water tiles, crabs. |
| 3-1 | FORMING LAND | rocky | Mountains rising from sea. Earth tones, lava plumes appear. |
| 3-2 | GARDEN PATH | forest | First plants. Vines + grapple mechanic. Greens dominate. |
| 4-1 | THE SUN | sunlit | Bright sky with sun flares. Sun-shield signature. |
| 4-2 | MOON & STARS | cosmic-night | Low gravity, deep navy with stars. Star-jump (multi-jump) signature. |
| 5-1 | THE SKIES | bird-sky | Flappy-bird mode. Wings of Day. Cloud-glide signature. |
| 5-2 | THE SEAS | seaside | Underwater swim. Eels, octopus, crabs. Air-bubble signature. |
| 6-1 | WILD ANIMALS | savanna → forest → bugscale | Tri-zone stage. Lions + porcupines (unkillable), wildebeest stampede mob. Calling-horn signature. |
| 6-2 | BUG WORLD (was MANKIND) | bugscale | Bug-scale tree canopy. Goliath beetle walkers. Bees. (Rebuilt in batch C.) |
| 7-1 | DAY OF REST | eden | Adam, Eve, deer, lion, dove. Cores rain from sky on dove-blessing. Finale. |

## Concept art vs production background vs parallax layer vs tileable background vs in-game asset

- **Concept art**: a Midjourney/Imagen/AI render that captures the *vibe*. Not in-game. Usually wrong aspect ratio. **Treat as reference only.**
- **Production background**: pixel-art version of the concept, sized to your canvas (e.g. 320×180 or 640×360 for 2× density), color-corrected, no UI/characters.
- **Parallax layer**: one horizontal strip out of the 3–4 that make up the production background. Each layer is its own PNG. Far layer can be opaque; mid/near are transparent PNGs with alpha.
- **Tileable background**: horizontally seamless so it loops with parallax. Test by drawing twice side-by-side; no visible seam.
- **Usable in-game asset**: the tileable PNG, in `public/assets/backgrounds/<theme>/<layer>.png`, registered in the asset manifest, loaded at scene boot.

## Prompt formulas for generating future backgrounds

**Base formula:**
```
[mood phrase], [time of day], [biome description],
pixel art, 16-bit, [palette adjective],
parallax background, [layer depth callout],
game asset, no characters, no UI, no text,
aspect ratio [match canvas]
```

**Jungle bug-world example (worked):**
```
dense rainforest canopy interior, dawn light filtering through leaves,
deep greens with warm gold sun-pool highlights,
pixel art, 16-bit, painterly textured pixels,
parallax background, far layer bokeh haze with no readable detail,
foreground a single thick mossy branch with vines and small leaves,
game asset, no characters, no UI, no text,
aspect ratio 16:9
```

**Solarpunk city example (untested but principled):**
```
high-tech green city skyline at golden hour,
warm amber sky behind soft teal silhouetted skyscrapers,
pixel art, 16-bit, clean limited palette,
parallax background, three layers: far hazy towers, mid sharper buildings with windows, near rooftop ledge with plants,
game asset, no characters, no UI, no text,
aspect ratio 16:9
```

**Eden/biblical example:**
```
lush garden of eden in soft morning light,
green canopy of broad leaves with golden shafts of light,
pixel art, 16-bit, biblical-illustration palette of greens and warm whites,
parallax background, far misty mountain silhouette, mid leafy trees, near rich grass with flowers,
game asset, no characters, no UI, no text, peaceful,
aspect ratio 16:9
```

## How to make image AI produce better backgrounds

1. **Always specify the aspect ratio matching your canvas.** Most image AI defaults to square; you want 16:9 or whatever your viewport is.
2. **Always say "no characters, no UI, no text."** Image AI loves to add a samurai and a HUD.
3. **Reference an existing in-game frame** for color matching. "Match the color palette of [link/upload]." Critical for theme consistency.
4. **Ask for the layers as separate outputs** if the AI supports it (some do; most don't). If not, generate the composite and you separate manually.
5. **Specify mood + light source explicitly.** "Dawn light from upper-left" reads in the output.
6. **Specify the parallax depth explicitly.** "Far layer bokeh haze, mid layer sharper, near layer crisp" produces an image you can manually split.
7. **Iterate on the foreground separately.** Generate the background first, lock it, then generate foreground elements (branches, ledges) on transparent backgrounds.
8. **Resize down to canvas resolution** as the final step, not upscale. Pixel art looks better when downsampled with nearest-neighbor than when AI-rendered at low res.

## What made the best backgrounds work (every one of these was lived)

- **Depth via blur.** Far layers get `ctx.filter='blur(3-4px)'` or are pre-blurred at load. Mid layers get lighter blur (1-2px). Near is sharp. Without this, every layer looks the same distance.
- **Lighting via a single warm sun-pool blob.** One radial gradient over a vertical gradient. Cheap, effective, kid-readable.
- **Foreground/midground/background separation by brightness.** Background = closer to sky color (atmospheric perspective). Foreground = darkest, sharpest. Never let a background branch be the same brightness as an interactive platform — kids will jump on it and fall.
- **Palette discipline.** Each theme: 6–10 named colors, listed in a comment block in `sprites.js` C constants. Don't introduce new colors mid-asset.
- **Atmospheric perspective.** Far things are *closer to the sky color*, not "the same hue but blurry."
- **Stylized shapes over realism.** A giant grass blade reads "bug world" instantly. A photorealistic leaf reads as nothing in particular at 16-bit.
- **Readable gameplay space.** The top 3 rows and bottom 2 rows of tiles are where the player will be. Keep contrast clean there. Don't paint busy detail behind a row Danny walks on.
- **No clutter behind the player.** Mark's exact feedback on 6-2: "those are just floating sticks." The fix was anchoring every background element to a leaf cluster so nothing read as "free-floating gameplay-shaped object."

## Per-aesthetic recommendations

### Adventure / city level
- Three-point lighting: warm sun-pool + cool sky gradient + atmospheric haze band.
- Silhouette skyline mid-layer; readable building windows on near layer; bokeh distance on far.
- Limit verticality of background buildings — keep the top 30% relatively quiet for HUD space.

### Jungle
- Heavy bokeh on far (use real photographic blur reference).
- Mid layer is leaf masses with branches woven through. **Never solo branches floating in midair** — always with leaf clusters attached. Lived lesson.
- Foreground = sharp branch sweeping in from upper-left or upper-right, anchored to off-screen.

### Solarpunk
- Greens + warm metallic accents (copper, brass).
- Silhouette plants on every layer.
- Sun-pool placement matters more here than other themes; the genre is "warm hope."

### Biblical / Eden
- Soft warm whites + greens + gold.
- No harsh contrasts.
- Reference: 16-bit Bible adventure games (e.g. some SNES illustrations).

### Kid-friendly platformer (cross-theme)
- Always at least one bright color in the palette (kids' eyes lock onto it).
- Avoid pure black; use deep navy or dark brown.
- Test at small viewport — if it reads on an iPhone SE, it reads anywhere.

---
<a id="06"></a>
# 06 — Parallax background pipeline

## Layer count
- **Minimum: 3 layers** (far / mid / near).
- **Recommended: 4 layers** (add foreground overlay).
- **5+ layers**: showing off; kids don't read it.

## Layer roles

| Layer | Role | Parallax factor | Blur | Alpha |
|---|---|---|---|---|
| Sky/gradient | Mood, color | 0 (stationary) | none | opaque |
| Far | Atmospheric haze | 0.06–0.10 | 3–4px | opaque |
| Mid | Depth, silhouette | 0.20–0.30 | 1–2px | transparent |
| Near | Identity, landmarks | 0.50–0.70 | 0px (sharp) | transparent |
| Foreground overlay (opt) | Framing, atmosphere | 0.80–1.0 | 0px or 1px | transparent (often additive) |
| Gameplay tiles | Interactive | 1.0 (camera-locked) | none | opaque |

## Opaque vs transparent layers

- **Sky/gradient is opaque.** It IS the sky. Draw it first.
- **Far is opaque** (it covers the sky). Fine if you want sky to show through gaps; in that case, far is transparent and contains foliage/buildings only.
- **Mid + near are transparent PNGs with alpha.** Drawn on top of far.
- **Foreground overlay** uses alpha; sometimes additive blend for fog/light shafts.

## Panel continuation logically left-to-right

Most levels are wider than one screen. Backgrounds need to scroll either:
1. **Seamless tile** (loop horizontally). Each layer is one PNG, drawn twice side-by-side at the parallax offset.
2. **Multi-panel** (designed sequence). Panel 1 → panel 2 → panel 3 with continuity.

### For seamless tiling
- Each layer PNG must be horizontally seamless. Test: paste twice side-by-side, look for the seam.
- Pick layer width to match a comfortable tile interval (e.g. 320, 480, 640).

### For multi-panel
- Pick a horizon line and stick to it across panels.
- Pick 3 silhouette anchor heights (e.g. background trees at y=60, mid trees at y=110, ground at y=160). Carry them through.
- Each panel shares the prior panel's right-edge silhouette as its left-edge silhouette.

## Visual consistency across multiple panels — checklist

- [ ] Same sun direction (where is the sun pool?)
- [ ] Same atmospheric perspective curve (how much do far things fade toward sky?)
- [ ] Same blur amount per layer
- [ ] Same color picker for sky-gradient endpoints
- [ ] Same silhouette anchor heights
- [ ] Same per-theme palette
- [ ] Same time of day

## How to test a background actually works in-game

This is exactly what `tests/screenshot_stages.js` in our repo does:

1. Drop the background into the asset pipeline.
2. Load the stage in puppeteer.
3. Teleport the player to 0%, 25%, 50%, 75%, 100% of the level width.
4. Screenshot each position.
5. **Look for:**
   - Tearing/seams at parallax wrap-around
   - Player sprite invisible against any layer combo
   - Interactive platforms ambiguous against background silhouettes
   - Color clashes at certain camera positions
   - HUD readability against busy background sections

## Prompt template for "next panel to the right"

```
Reference image: [URL or upload of prior panel right-edge]

Generate the next panel continuing right of this one.
Match:
- Horizon at y=[Y]
- Sun direction: [upper-left / upper-right / overhead]
- Carry over these silhouettes from the prior panel's right edge: [A, B, C]
- Same palette as prior panel
- Aspect ratio: [W]×[H]

Introduce in this panel:
- [new element 1]
- [new element 2]

Pixel art, 16-bit, no characters, no UI, no text, no seam at left edge.
```

## Parallax readiness checklist

- [ ] Layer PNGs all match canvas height (e.g. 180px tall for 320×180 internal)
- [ ] Each layer is horizontally seamless (test side-by-side)
- [ ] Parallax factors documented in code or asset manifest
- [ ] Player sprite tested at every X position against every layer combo
- [ ] No interactive-looking shapes in background layers
- [ ] Sky gradient drawn first, behind all layers
- [ ] Foreground overlay (if any) drawn last, in front of gameplay tiles
- [ ] Sun-pool position consistent across panels of same theme

---
<a id="07"></a>
# 07 — Sprite creation pipeline

## The master character sheet — start here

Before any animation, before any variant, paint a **single master pose** of the character. This sheet defines:
- Proportions (head-to-body ratio, action-hero vs chibi)
- Palette (5–8 colors)
- Silhouette
- Anchor (feet at bottom-center, x = left edge)
- Frame canvas size (e.g. 18×22 for small Danny)

**Every later frame, animation, variant, and re-skin derives from this sheet.**

We did not do this in SDD. We painted variants directly. When Mark said "redraw the lion with more silhouette," it became "redo every frame of every variant" instead of "update the master then re-derive."

## Frame size standards (SDD reference)

| Entity | Sprite canvas | Collision box | Anchor |
|---|---|---|---|
| Player small | 18×22 | 13×23 | feet at y+h, x is left edge |
| Player big | 24×36 | 14×31 | same |
| Player flappy (small) | 18×22 sprite | 9×19 collision (dx +2) | preserves feet |
| Player flappy (big) | 24×36 sprite | 11×26 collision (dx 0) | preserves feet |
| Walker (all variants) | 16×14 | 12×10 | feet at y+h |
| Wisp (all variants) | 14×14 | 10×10 | center |
| Thrower | 16×16 | 12×14 | feet at y+h |
| Crab | 16×16 | 14×10 | feet at y+h |
| Core | 14×16 | 12×14 | center |
| NPC (adam/eve/deer/lion/dove) | 20×31 | varies | feet at y+h |
| Stampede mob | 16×16 (tiled 8×) | 128×16 | feet at y+h |

**These should live in `src/config/sprite-dims.ts`** in the next project, not be duplicated across `entities.js` and `sprites.js`.

## Animation rows / columns

Minimum animation set per playable character:
- **idle** (1–2 frames, gentle breathing)
- **walk** (2–4 frames)
- **run** (if different from walk; 3–4 frames)
- **jump** (1 frame, ascending)
- **fall** (1 frame, descending)
- **hurt** (1 frame, brief overlay)
- **attack/blast** (2 frames if used)
- **climb** (2 frames if vines exist)
- **swim** (2 frames if water exists)
- **victory** (2 frames celebratory)

Per enemy:
- **walk** (2 frames)
- **dead/disappear** (1 frame)

## Keeping a character consistent

- **Lock the master sheet.** Reference it before every new frame.
- **Lock the palette.** Eyedropper from the master, never invent new colors.
- **Lock the silhouette.** Squint at the frame — does it read as the same character?
- **Lock the feet baseline.** Pixel-perfect alignment across frames.
- **Use a baseline guide layer** in Aseprite — a horizontal line at the feet level, visible across all frames.

## Avoiding chibi when you want action-hero

Image AI loves to drift to cute. To prevent:
- Specify proportions in the prompt: "head is 1/4 of total body height" or "action hero proportions, not chibi."
- Reference existing action-pixel-hero sheets (Mega Man, Shovel Knight) in your prompt.
- Lock leg length in the master sheet — kids' games often have legs as 40-50% of body height.

## Tool recommendations

- **Aseprite** ($20) — the canonical 2D pixel art tool. Layered files, frame tags for animations, sprite-sheet export. Worth every dollar from day 1.
- **PixelLab** — AI-assisted variant generation. Useful for rapid exploration; output needs cleanup.
- **Photoshop / Krita** — overkill for pixel art; useable.
- **Free pixel editors** (Piskel, LibreSprite) — fine for hobby.

## PixelLab in this repo

`js/sprites.js` has integration scaffolding starting around line 2769:
```js
var pixelLab = { ready: false, frames: {}, bboxes: PL_BBOX, pending: 0, total: 0, failed: 0 };
```
Loads sprite frames per-size, per-anim, per-direction. Falls back to procedural canvas painting if PixelLab assets fail.

The `Player.draw` in `entities.js:693` checks `SDD.sprites.pixelLab.ready && SDD.sprites.pixelLab.failed === 0` and uses pixelLab assets if available, else the painted ones.

**Working pattern.** Keep it.

## AI-generated sprites need cleanup

AI almost never delivers production-ready sprites. Expected cleanup pipeline (5 steps):

1. **Resize/align.** AI output rarely matches your target canvas. Crop or pad to exact frame size.
2. **Palette-quantize.** AI introduces gradient noise. Quantize to your locked palette (Aseprite has this built-in: Sprite → Color Mode → Indexed).
3. **Trim transparency.** Edge ghosts and 1-pixel anti-alias halos kill the pixel-art look. Clean alpha to 1-bit (fully transparent or fully opaque).
4. **Check frame alignment in flipbook.** Cycle through frames; foot must not drift. Fix manually.
5. **Spot-test in-engine.** Drop into the actual game, walk past it at speed, look for shimmer or pop.

## Prompt template for Mega-Man-style action hero

```
Side-view 2D pixel art character, action hero proportions (not chibi),
[character description: gender, outfit, hair, accessories],
32×32 canvas (or 18×22 for small player), facing right,
4-frame walk cycle on one row,
limited palette of 6 colors, no antialiasing, hard-edged pixels,
white background, transparent recommended,
no shadows under feet, feet aligned to bottom of canvas,
classic 16-bit action platformer style, inspired by Mega Man X and Shovel Knight
```

## Readability at small sizes

- **Silhouette test:** fill the sprite with one color; can you still tell what it is? If not, simplify.
- **Squint test:** squint at the sprite; does the main shape read?
- **Color contrast:** at least one strong contrast pair (e.g. light face vs dark hair) so the head reads.

## Common mistakes (every one of these we hit)

- **Sprite drift across frames** — one foot pixel off → walks crooked. Fix: baseline guide layer.
- **Inconsistent proportions** between idle and walk — Danny got slightly taller in some walk frames in early iterations.
- **Wrong frame size** — exported at 24×24, code expected 16×14 → falls back to default sprite silently.
- **Bad transparency** — 1-pixel anti-alias halo around every frame; reads as a glow at game res.
- **Misaligned feet** — feet at y=12 in idle, y=13 in walk → walks "hopping."
- **Sprite drifts during animation** — x position changes across frames → walks sideways.
- **Hitbox set on first frame, sprite resized later** → walker grows as it walks (this exact bug in flappy mode).
- **Variant sprite missing** — `walker_0_l_porcupine` not registered → falls back to default walker → looks wrong.

---
<a id="08"></a>
# 08 — Bounding boxes, collisions, hitboxes

This section has the most authority — I just shipped a per-size hitbox editor.

## Sprite size is NOT collision size

Six distinct boxes any platformer needs:

1. **Visual sprite bounds** — what's drawn on screen.
2. **Player collision box** — what the tilemap tests against.
3. **Damage hurtbox** — what enemies hit (when player is attacker; what hits player when defender).
4. **Attack hitbox** — what your blast/sword/stomp hits.
5. **Platform collision** — what you stand on, including one-way platforms.
6. **Pickup / trigger area** — what activates items, signs, zones.

These are usually different sizes. The visual sprite is the largest (because it includes flourishes, hair, glow). The collision box is smaller (forgiving). The hurtbox can be smaller still.

## Why bad bounding boxes ruin platforming

- **Corner clipping** — collision box larger than sprite → player gets stuck on corners that look passable.
- **Missing pickups by 1px** — pickup trigger area too small → frustrating.
- **Getting hit by enemies that look 3px away** — hurtbox larger than sprite → unfair.
- **"Hitbox is strange" in flappy mode** — Mark's exact complaint. Brushing past obstacles registered as hits because the collision box was the full sprite. Fix: per-mode hitbox override.

## Practical rules (every one from a real bug)

1. **Feet at `y + h` must match across all sprite variants.** If walker_0 has feet at y+14 and walker_1 has feet at y+13, the walker bobs visually.
2. **Collision box slightly smaller than the visual silhouette.** Forgiveness > pixel-perfect. 1–2px inset is typical.
3. **Resize without preserving feet position will pop the player.** Always:
   ```js
   var feet = p.y + p.h;
   p.h = newH;
   p.y = feet - p.h;
   ```
   This is exactly what `SDD.applyFlappyHitboxNow` does in `entities.js`.
4. **Visual effects never alter collision.** A glow particle, a sword swing flourish, a hurt-flash — these are visual only. Collision is unchanged.
5. **One anchor convention.** SDD uses: feet at y+h, x is left edge of collision box. Document this in your engine README. Every new entity follows it.
6. **Mode-specific hitboxes live in data.** Flappy hitbox is in level data, not hard-coded. `level_5_1.js` declares:
   ```js
   flappySmallHitbox: { dx: 2, w: 9, h: 19 },
   flappyBigHitbox:   { dx: 0, w: 11, h: 26 }
   ```

## Text diagram

```
   visual sprite (18×22)            collision box (13×23)
   ┌─────────────────┐              ┌──────────┐
   │   ::head::      │              │          │
   │   ::torso::     │     →        │          │
   │   ::legs::      │              │          │
   │   ::feet::      │              │          │
   └─────────────────┘              └──────────┘
        ▲                                 ▲
   x = left edge                     x = left edge
   feet at y + h                     feet at y + h (same)
```

The visual sprite can extend beyond the collision box (hair, flourishes) but the **feet line** is shared.

## New-sprite import checklist

- [ ] Same anchor convention (feet at y+h, x is left edge)
- [ ] Hitbox dimensions documented separately from sprite dimensions
- [ ] Feet baseline matches the entity family (Walker = 14, Player small = 23, etc.)
- [ ] Tested at small size if entity has size variants
- [ ] Tested under every mode (flappy/underwater/low-grav)
- [ ] Spawn point logic uses `tx*T + 8 - w/2` for x, `(ty+1)*T - h` for y (our convention; aligns feet to tile floor)

---
<a id="09"></a>
# 09 — Tilesets and level building

This is one of the most important files. Mark flagged it.

## Tile size

**16px in SDD.** Justifications:
- Matches sprite scale (small Danny is 18×22, snug in a tile).
- Fits 320×180 canvas comfortably (20×11 visible tiles at native scale).
- Round number for math (`floor(x / 16)` for tile coords).

For the next game, 16 or 32 are the standard choices. Bigger tiles → less detail per tile but easier to author. We'd stay at 16.

## Tile codes (SDD's vocabulary)

| Code | Meaning | Collision | Renderer |
|---|---|---|---|
| (space) | air | none | not drawn |
| `X` | solid ground | solid | `tile_ground_<theme>` if exists, else `tile_ground` |
| `#` | brick (sometimes hidden/breakable) | solid | `tile_brick_<theme>` |
| `=` | one-way platform | one-way (drop-through) | `tile_platform_<theme>` |
| `V` | vine (climbable) | climbable | `tile_vine` |
| `W` | water (full) | swimmable | `tile_water` |
| `~` | water surface | swimmable | `tile_water_top` |
| `L` | lava | lethal | `tile_lava_*` (auto top vs base based on neighbors) |
| `G` | signature pickup spawn anchor (placed in tile grid but spawn comes from spawns array) | passable | — |
| `B` | blast pickup brick | breakable | brick variant |
| `?` | grow brick | breakable | brick variant |

## Three layers — never mix them

1. **Tile code (data)** — what the level data string says.
2. **Sprite (rendering)** — `tile_<code>_<theme>` lookup with fallback.
3. **Collision behavior (engine)** — keyed off the code in `engine.js` / `scenes.js`.

Mixing them produces bugs like "I jumped on a background branch and fell through" — the visual looked like a platform but the data said air.

## Background art vs decorative tile vs collision tile vs interactive object vs level data

| Concept | Lives where | Affects gameplay? |
|---|---|---|
| Background art (sky painter) | `scenes.js drawSky_*` | No |
| Decorative tile (no-collision visual) | tile code + sprite, collision: none | No |
| Collision tile (X, =, etc.) | tile code + sprite + collision rule | **Yes** |
| Interactive object (mover, signature, npc) | spawns array, entity class | **Yes** |
| Level data (the level file itself) | `js/level_X_Y.js` | **Yes — it IS the level** |

## Designing for ages 8–12 (every one of these lived)

### Readable path
The main route should be obvious from the moment you enter the level. If a kid has to study the screen to find the way forward, the level fails.

**Rule:** the timepart (exit) should be visible from the final stretch. Stage 1-1 timepart sits on a pedestal at col 372 (out of 380); you can see it from cols 350+.

### Forgiving jumps
- **Minimum gap:** 3 tiles (~48px). Below that it's pointless.
- **Max for unaided jump:** 5 tiles (~80px). Tested.
- **Beyond 5 tiles:** needs a mover, vine, or signature-power assist.
- **Vertical reach:** 4 tiles up unaided. Big Danny gets a tiny bit more.

### Clear goal
- Timepart sits alone on its own pedestal.
- Pedestal is visually distinct from surrounding terrain.
- No power cores adjacent to it (Mark's rule: "the time-machine part should sit alone and radiate").

### Progressive challenge
- **Teach-test-twist** pattern (see below).
- Difficulty climbs across the 7 days, not within a single stage.
- Each stage introduces ONE new mechanic.

### Not too much punishment
- Easy mode has unlimited lives. Respect it: don't design encounters that assume rage-quit.
- Checkpoints between 40%–60% of every stage.
- Pits are escapable IF the player makes the standard jump.

### Satisfying collectibles
- Cores spaced ~3 tiles, follow the path.
- High routes carry extra cores as bonus.
- Hidden cores in `?` blocks reward curiosity.

## The leap from static scenes to real levels

Pre-editor: every level was hand-coded JS with `box(x0,y0,x1,y1,'X')` helpers. A single new gap took: open file, find the right section, edit coords, save, reload browser, navigate to stage, test. 5 minutes.

Post-editor: click on the canvas. 5 seconds.

**The editor is the leap.** Build it before you have more than 2 stages.

## Level design principles

### Teach, test, twist

For every mechanic:
- **Teach** — first appearance in a safe environment. Show the mechanic with no risk.
- **Test** — second appearance with stakes. Pit below, enemy nearby.
- **Twist** — third appearance combined with another mechanic.

Example (1-1 stomp): teach by placing a walker on flat ground; test by walker on a narrow platform with a pit; twist by walker + thrower at the same height requiring stomp-while-dodging.

### Introduce one mechanic at a time
Don't drop vines + lava + a new enemy in the same screen. Kids' brains saturate.

### Never hide required paths unfairly
Hidden routes are for bonuses, not for "you must find this." Required path is visible from the screen prior.

### Use visual language
- Green = safe (forest platforms)
- Brown = solid (dirt, wood)
- Vines = climbable (vertical green strips)
- Sparkle = collectible
- Pulsing = power-up

Document the language and stick to it across all stages.

### Reward curiosity
- Extra cores in `?` blocks above the main path.
- Optional high routes with extra signatures.
- Easter eggs that don't penalize skipping.

## Checklist for designing a new level from scratch

- [ ] Width chosen (240–360 typical for SDD)
- [ ] Player spawn at row 10, col 3 (our convention)
- [ ] Timepart placed visible from the final stretch
- [ ] Checkpoint at 40–60% mark
- [ ] One new mechanic introduced via teach-test-twist
- [ ] Cores follow the main path, ~every 3 tiles
- [ ] Power-up brick(s) for big-Danny progression
- [ ] One signature pickup matching the day's theme
- [ ] No required jump > 5 tiles unaided
- [ ] Theme variants for walker/wisp/thrower placed deliberately
- [ ] Pre-flight test passes (no JS errors, player spawns, timepart exists)
- [ ] Screenshot at spawn / 25% / 75% / end for design review

---
<a id="10"></a>
# 10 — Level editor lessons

This is the other most important file. Mark called it out specifically.

## Why manual level coding becomes painful (we lived this)

Pre-editor flow for one level tweak:
1. Open `js/level_3_2.js` in editor.
2. Find the function call for the section you want to change.
3. Edit the coords (`box(217, 4, 227, 6, 'X')`).
4. Save.
5. Switch to browser, navigate from title → overworld → stage 3 → 3-2.
6. Walk to the section to verify.
7. If wrong, back to step 1.

That's 3–5 minutes per tweak. A level needs 50–100 tweaks. That's 4–8 hours per level.

Post-editor flow:
1. Click the tile, paint, release.
2. Press TEST.
3. Test the level in 30 seconds.
4. Return to editor.

That's 30 seconds per tweak. Same level: 1–2 hours.

**The editor saved months of work.** Build it before you have more than 2 stages.

## What the editor unlocked

- Mark went from "describe a level" to "build a level" in single sessions.
- Designer iteration without developer involvement.
- The COPY MAINS / EXPORT .js round-trip: Mark builds in browser → exports → I commit → next session reads.
- Per-stage variants stored in localStorage for trying multiple layouts.

## Day-1 editor feature list (everything `js/editor.js` has at handoff)

- **Tile painting** with brush sizes 1, 3, 5
- **Right-click to erase** tiles
- **Spawn placement** with type/variant dropdown (player, walker, wisp, thrower, crab, core, timepart, npc, signature, checkpoint, skyhazard, bubble, octopus, twister, eel, stampede)
- **Mover platform** placement with endpoints, speed, phase
- **Live TEST** button — enters the level scene with current edits in memory; exit returns to editor with edits preserved
- **Per-stage save to disk** via File System Access API (Chrome/Edge), with download fallback for other browsers
- **EXPORT .js** writes the level file in the flat declarative format
- **EXPORT AS** picks a different target file
- **COPY MAINS** copies all MAIN-flagged stages as a single JSON blob for paste into a fresh session
- **Per-stage variant library** in localStorage
- **PROPERTIES tab** for inspecting/editing the selected entity
- **STAGE tab** for level-wide settings (flappy hitbox, theme, etc.) — added in batch A of the design pass
- **VARIANTS tab** for the variant library
- **Zoom in/out/fit/1:1** with persistence across sessions
- **Stage picker** dropdown to jump between day-stages
- **Status bar** with hover coords, entity counts, dirty indicator
- **Hover tooltip** that follows the mouse over the canvas

## How the editor connects to the engine

**Critical pattern:** the editor mutates `SDD.levels[key]` directly. The engine reads from the same object when entering a level. No file I/O at runtime. No parallel data structure.

```js
// Editor flow:
// 1. enter(): scene.lvl = SDD.levels[key]; tiles normalized to char arrays
// 2. User paints/places: scene.lvl.tiles[r][c] = code; scene.lvl.spawns.push({...});
// 3. TEST: SDD.setScene('level', { day, stage }) → engine reads SDD.levels[key] → renders with edits
// 4. Return to editor: re-reads SDD.levels[key] (still has edits)
// 5. EXPORT .js: serializes scene.lvl to the flat declarative format
```

This pattern is the right one. Replicate it in the next game.

## Minimum viable editor (build this week 1 of next project)

200 lines of HTML+JS:
- A canvas mirror of the game canvas, larger scale.
- Click to paint a tile (selected from a palette of 5–10 tile codes).
- Click to place an entity (selected from a palette of 5–10 types).
- Save button → writes JSON to disk via File System Access API or download.

That's it. You'll add features as you need them.

## Dream editor (where SDD's editor was heading)

- Undo/redo with full state (we don't have this yet)
- Multi-cell selection + copy/paste
- Theme-zone painter (paint colored regions to set the theme of a span — we have themeZones in data but no editor UI)
- Mover-path visualizer (draw the path of every mover as a line on the canvas)
- In-editor playtest with hot-reload (we have TEST but it's a full scene swap)
- Tile auto-tiling (paint a region; engine picks the right corner/edge variants)
- Brush stamps (save a 5×5 pattern and stamp it)

## Mistakes to avoid

- ❌ Don't store editor edits in a parallel data structure separate from the engine's runtime. Mutate the same object.
- ❌ Don't make "save" the only way to test. Live mutation is what makes the editor feel magical.
- ❌ Don't gate features behind keyboard shortcuts only. Mobile / iPad designers need buttons.
- ❌ Don't ship the editor enabled in production. Remove the script tag or gate behind a dev flag. (Our editor.js has a removal comment at the top.)
- ❌ Don't let the editor's UI overlay block parts of the game canvas. We use side panels.

---
<a id="11"></a>
# 11 — Audio and music pipeline [GAP]

**First-half session did not own audio.** I never touched `SDD.audio.sfx()` calls or the `assets/music/` directory. The pattern below is general best practice for browser games, not lived experience for this project.

## Structural recommendations (treat as a checklist for the second half / next game)

### File formats
- **OGG Vorbis primary** (best size/quality, all modern browsers support)
- **MP3 fallback** for iOS Safari (which has had OGG quirks historically)
- **WAV during development** for sfx (no compression artifacts when iterating)

### Compression
- Music loops: 96–128 kbps OGG, ≤200KB per loop
- SFX: 64–96 kbps OGG, ≤30KB per effect
- Total audio budget for a 12-stage game: ≤5MB. Larger and mobile load times suffer.

### Looping
- Music tracks designed with seamless loop points (no fade-in/fade-out at start/end)
- Use `audio.loop = true` and ensure the audio file's silence padding is trimmed

### Priority hierarchy
1. UI / hit feedback sfx (must always play)
2. Pickup / progression sfx
3. Music
4. Ambient

When too many sounds collide, drop ambient first.

### Browser autoplay restrictions
- **All modern browsers block audio without a user gesture.** Solution: play the first sound on the first click/tap (often the title screen "PRESS START").
- Maintain an "unlocked" flag in `SDD.audio`. Until first user gesture, queue sounds; play on unlock.

### iOS quirks (recommend testing on real device)
- Web Audio API context starts suspended; must `audioContext.resume()` on first gesture
- HTML5 Audio is more brittle on iOS than Web Audio; prefer Web Audio
- Mute switch on iPhone silences Web Audio (yes, even with volume up) — known issue

### Loading strategy
- Preload UI sfx at boot (small, always needed)
- Lazy-load music per scene (only the current level's music)
- Use `audio.preload = "auto"` for critical, `"none"` for level-specific

### File size reduction
- Trim silence
- Use mono for sfx that don't need stereo
- Convert with `ffmpeg -i in.wav -c:a libvorbis -q:a 4 out.ogg`

## Audio naming and organization

```
public/assets/audio/
├── music/
│   ├── menu.ogg
│   ├── day1.ogg
│   ├── day2.ogg
│   └── ...
├── sfx/
│   ├── jump.ogg
│   ├── jumpbig.ogg
│   ├── stomp.ogg
│   ├── die.ogg
│   ├── core.ogg
│   ├── shrink.ogg
│   ├── grow.ogg
│   ├── power.ogg
│   ├── bump.ogg
│   ├── confirm.ogg
│   └── ...
└── voice/
    └── (if any voiceover)
```

(Check `js/entities.js` for the list of `SDD.audio.sfx('...')` calls in this codebase to find every sfx ID needed.)

## Audio testing checklist

- [ ] All sfx play on first user gesture (no silent first click)
- [ ] Music loops without audible seam
- [ ] No clipping at max volume
- [ ] iOS mute switch behavior documented (it WILL silence Web Audio)
- [ ] Audio pauses when tab loses focus
- [ ] Audio resumes when tab regains focus
- [ ] Music transitions between scenes (fade out / fade in)
- [ ] Each sfx tested standalone and in combination
- [ ] Audio not blocking game loop on slow devices

---
<a id="12"></a>
# 12 — Menus, UI, game flow

What existed at handoff (partial — I didn't polish menus much).

## Scene flow in SDD

```
boot
 └→ title screen
     └→ menu
         ├→ how-to-play
         ├→ level select (overworld map)
         │   └→ level (per day-stage)
         │       ├→ pause menu
         │       │   ├→ resume
         │       │   └→ exit to menu
         │       ├→ death → respawn / game over
         │       └→ victory → next stage / finale
         ├→ settings (music, difficulty, god mode for testing)
         └→ level editor (dev only)
```

## What every menu screen should include

### Title screen
- Logo
- "PRESS START" or button (also serves as audio unlock gesture)
- Version number small in corner (debug)

### Main menu
- Play
- Continue (if save exists)
- Level select / overworld
- Settings
- (Dev only) Level editor

### Level select / overworld
- Visible map with stage icons
- Locked / unlocked state per stage
- Stage name + completion stats
- Easy/Medium/Hard difficulty if exposed

### Pause menu (during level)
- Resume
- Restart stage
- Exit to menu
- Music/SFX toggles

### Settings
- Music on/off
- SFX on/off
- Difficulty
- Touch control style (mobile)
- (Dev) God mode toggle

### Mobile button overlay
- D-pad on left, A/B on right
- Translucent, doesn't obscure gameplay
- Tap-anywhere-on-button-side counts (large hit areas)

### Game over
- "Game Over" text
- Retry stage
- Exit to menu

### Restart
- Same as game over, plus an "are you sure" confirm if mid-stage

### Victory
- "Stage complete!" + stats (time, cores, lives)
- Continue to next stage
- Exit to menu

### Loading screen
- Progress indicator (even fake)
- Tip text
- Logo

## Why menu flow matters
A polished menu flow is what separates "a thing that runs" from "a game." Kids judge games by their menus before they ever play.

## Mobile-first UI rules
- Hit targets ≥ 44×44 px (Apple HIG minimum)
- Critical buttons reachable with thumb on one-handed grip
- No tiny text — minimum 14px UI font, 18px preferred
- Safe area insets respected (iPhone notch)
- Landscape and portrait both planned (or lock one and explain)

## Accessibility / readability for kids
- High contrast text (white on dark, or black with stroke on light)
- Avoid red-green only color coding
- Read times: kids ages 8 read ~150 wpm; menus should be skimmable in 5 seconds
- Avoid sarcasm or wordplay; literal text

## Per-screen checklist
- [ ] Title text legible at smallest target viewport
- [ ] All buttons have a tap state (visual change on press)
- [ ] All buttons have a hover state (desktop)
- [ ] Audio plays on first interaction
- [ ] Back navigation always available
- [ ] Cannot be locked out of the menu by a bug

---
<a id="13"></a>
# 13 — Mobile, PWA, iOS shipping [GAP]

**First-half session did not validate mobile shipping.** The recommendations here are best-practice patterns, not lived experience. Second-half session should overwrite with reality.

## PWA basics

A PWA needs:
1. **Manifest** at `/manifest.json` declaring app name, icons, theme color, display mode.
2. **Service worker** registered from the page, caching essential assets for offline.
3. **HTTPS** in production (PWAs require it).
4. **App icons** in multiple sizes (192, 512, maskable).
5. **Touch-friendly UI.**

## Example manifest
```json
{
  "name": "Super Dude Danny",
  "short_name": "SDD",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "landscape",
  "background_color": "#142036",
  "theme_color": "#142036",
  "icons": [
    { "src": "/assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/assets/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## iOS "Add to Home Screen" considerations

iOS Safari has its own PWA handling:
- Doesn't fully respect `manifest.json`
- Uses `<meta name="apple-mobile-web-app-capable" content="yes">` and friends
- Splash screen requires per-device-size `<link rel="apple-touch-startup-image">` entries
- Needs `<link rel="apple-touch-icon" href="...">` separately from manifest icons
- Status bar style via `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`

## Per-area checklist

### Viewport
- `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`

### Touch controls
- D-pad on left, A/B on right (translucent)
- Hit areas ≥ 44×44px
- Multi-touch supported (move + jump simultaneously)
- Disable text selection on the canvas (`user-select: none`)

### Safe areas
- Use `env(safe-area-inset-*)` in CSS for buttons near edges
- Test on iPhone with notch

### Orientation
- Lock to landscape if your game is landscape only (manifest `orientation`)
- Or design for both — much more work

### Audio unlock
- First user gesture unlocks audio (see section 11)
- iOS mute switch silences Web Audio — communicate to users somehow

### Performance
- Test on 5-year-old iPhone (iPhone 8 / SE 2nd gen are common minimums)
- Target 60fps; accept 30fps fallback
- Profile in Safari Web Inspector (Settings → Safari → Advanced → Web Inspector)

### Image compression
- All PNGs through `pngquant` or similar
- Target total game size ≤ 10MB

### Offline / cache
- Service worker caches everything in `public/assets/`
- Version the cache name; bump on deploy to force refresh

### App icons
- 192×192, 512×512, 512×512 maskable
- `apple-touch-icon` (180×180) for iOS

### Splash screens
- iOS requires per-device sizes; generate with a tool like https://progressier.com or manually

### Service worker
- Caches assets on install
- Serves from cache when offline
- Updates cache on new version (cache-busting via filename hash or cache version bump)

### Safari limitations
- No background audio
- Strict autoplay
- Mute switch silences Web Audio
- WebGL stability issues on some older iOS versions

## What should be tested on actual iPhones
- Cold load from PWA icon (not Safari tab)
- Audio unlock on first tap
- Mute switch behavior
- Notch / safe-area positioning
- Performance during busy scenes (multiple enemies, particles)
- Offline (toggle airplane mode mid-game)
- Re-launch (close PWA, re-open — does save persist? does audio work?)

## Mobile shipping checklist

- [ ] Manifest present and valid (validate at https://manifest-validator.appspot.com)
- [ ] Service worker registered and caching working
- [ ] All icons present and correct sizes
- [ ] Viewport meta tag correct
- [ ] Touch controls visible and working
- [ ] Audio unlocks on first gesture
- [ ] Tested on real iPhone (not just simulator)
- [ ] Tested on real Android
- [ ] Total payload < 10MB
- [ ] Splash screen correct on iOS Add-to-Home-Screen
- [ ] Status bar style correct
- [ ] Game playable for 5 minutes without crash
- [ ] Save persists across sessions

## The difference between "works on desktop browser" and "feels good as a phone game"

Desktop browser: keyboard, big screen, good speakers, fast CPU, no autoplay constraints, no mute switch, you can resize the window, you can right-click.

Phone game: touch only, small screen, headphone-or-speaker, slower CPU, autoplay blocked, mute switch silences audio, fixed viewport, no right-click, every tap drags the page by default if you don't disable it.

**Build for phone first.** Test on desktop incidentally. Reverse, and you'll be retrofitting forever.

---
<a id="14"></a>
# 14 — AI-assisted development workflow

This I can write with conviction.

## What AI was good at (this project)

- **Brainstorming level mechanics.** The per-day signature concept (sunburst, dove-blessing, vine-grapple tied to biblical themes) came out of AI-assisted brainstorm sessions.
- **Code generation for entity classes.** Stampede mob (8×1 wildebeest herd) was AI-written from a one-paragraph design brief, then refined.
- **Refactoring procedural levels to declarative format.** Translating 12 procedural level files to flat declarative was AI-driven and mechanical.
- **Debugging in puppeteer.** Writing the pre-flight test rig was an AI task — fast and tedious.
- **Documentation.** This very file.
- **Sprite painters.** Procedural canvas sprites (paintWalker_lion, paintWildebeest, paintWalker_beetle) were AI-written with iteration.
- **Asset prompts.** Generating background prompts that worked for image AI.

## What AI was bad at

- **Remembering details across sessions.** The exact reason for this handoff. Without a status file, every new session relearns the project.
- **Maintaining visual consistency without a style bible.** Every theme drifted slightly each redraw. A central STYLE_BIBLE.md would have helped.
- **Production-ready sprites without cleanup.** Every PixelLab output needed manual review for frame alignment, palette, transparency.
- **Knowing what file something lives in after the codebase grew past ~10 files.** Manifested as wasted grep tool calls. A file-tree-comment in CLAUDE.md helped.
- **Continuing through session-context glitches.** Literally happened in this session.
- **Aesthetic judgment.** AI can make something that follows the rules; it can't always tell when something is "ugly but technically correct." Designer eyes still required.

## Better prompting patterns (these worked)

### Force recon before code
> "Before changing anything, check files X, Y, Z and tell me what you find. Don't make changes."

This caught half-a-dozen "actually we already have this" moments.

### Show me the diff before you commit
> "After implementing, summarize what changed in a table before committing."

Caught hallucinated edits (changes I described that weren't actually in the diff).

### Test-driven loop
> "Add a pre-flight test that asserts X. Then implement. Then run the test."

The discipline forced clarity about success criteria.

### Scoped edits
> "Do not change Y in this batch. Only X."

Prevented scope creep mid-pass.

### Plan first
> "Don't write code yet. Write a plan. I'll approve before you implement."

Especially important for big changes (the 6-2 bug world redesign, the editor STAGE tab).

## AI as senior assistant, not magic button

Treat the AI like a remote contractor:
- Give it file paths, not vague references.
- Give it acceptance criteria.
- Review the output before merging.
- Don't hand it the steering wheel for creative direction; ask for options, then choose.
- Document decisions outside the chat (this handoff is exactly that).

## Recommended AI workflow loop

```
1. State the goal in ONE sentence.
2. Ask AI for a plan, not code.
3. Approve or redirect the plan.
4. AI implements file-by-file.
5. Run pre-flight (or equivalent) — AI does it.
6. Screenshot if it's a visual change — AI does it.
7. Review the diff before commit.
8. Commit with a descriptive message future-you can grep.
9. Move to next item.
```

## How to recover when a session fills up, glitches, or loses context

(This is the meta-lesson of this handoff.)

1. **Save a status file BEFORE you need to.** Mid-project, paste the current state of work into `docs/CURRENT_STATUS.md`. Update it daily.
2. **Use a handoff template.** (See templates section.)
3. **Tell the new session where to start.** Point at file paths, not concepts.
4. **Don't assume the new session remembers anything.** Re-state goals.
5. **If a session glitches mid-task, copy the last good message into a new session with full context.**

---
<a id="15"></a>
# 15 — Session handoff and context recovery

This file is the meta-point of this whole document.

## Why long projects need handoff files

- AI sessions have finite context windows. Eventually they fill, summarize, or glitch.
- Real life interrupts. You take a break for a week; the session times out.
- You switch tools (one model, then another, then back).
- Bugs in the AI provider cause sessions to die mid-task.
- Without a handoff, every new session re-discovers what the previous one already knew.

Estimate: in this project, perhaps 20% of total session time was spent re-orienting new sessions to the project state. A handoff file would have cut that to 5%.

## What must always be preserved

### Repo state
- Current branch
- Last commit SHA + message
- Working tree clean? Uncommitted changes?
- Open PRs (if any)

### Tech stack
- Engine / framework
- Language / version
- Build tool / dev server
- Test runner
- Deployment target

### Project state
- Shipped features (complete + tested)
- In-flight features (partial)
- Blocked / waiting items
- Known bugs

### Design state
- Art style decisions made
- Asset conventions (dimensions, file naming, palettes)
- Level conventions (tile size, codes, spawn types)
- Audio conventions (formats, naming, loading)

### Open questions
- Pending design calls
- Unresolved technical decisions
- Things the user said "we'll revisit"

## What to capture in a `docs/CURRENT_STATUS.md`

(See templates section for the actual template.)

A single page, updated frequently, that any new session can read in 2 minutes and be productive.

## Templates

(All in the templates section below.)

---
<a id="16"></a>
# 16 — Pixel art tools and MCP notes

## PixelLab in this repo

`js/sprites.js` line ~2769:
```js
var pixelLab = { ready: false, frames: {}, bboxes: PL_BBOX, pending: 0, total: 0, failed: 0 };
```

The system:
1. Loads per-size, per-anim, per-direction sprite frames from `assets/Super Dude Danny [Big|Small] Sprites/` directories.
2. Each frame is loaded as a separate `Image()`.
3. On all loads complete (or failed): `pixelLab.ready = true`.
4. `Player.draw` checks `pixelLab.ready && pixelLab.failed === 0` and uses pixelLab assets if available, else procedural painters.

This is a working pattern. **Keep it.** But:
- The directory names have spaces — never again.
- The fallback to procedural is robust; if PixelLab assets fail to load, the game still runs.

## Where PixelLab helped
- Rapid variant exploration (different walker animals)
- Sprite sheet-style consistent output

## Where PixelLab struggled
- Exact frame alignment across an anim set
- Silhouette match to a reference (every regen drifts slightly)
- Palette consistency without explicit constraint

## Aseprite recommendation
Recommended as the canonical pixel art tool for the next project. Even if AI generates the initial sprites, Aseprite is the cleanup environment.

- Layered files (one layer per body part)
- Frame tags for animations (walk, run, jump, etc.)
- Sprite-sheet export with consistent spacing
- Onion skin for animation alignment
- Color picker from existing in-game art

## MCP / tool-connected workflows [partial GAP]

The MCP (Model Context Protocol) ecosystem can plug AI directly into tools:
- File system access
- Database queries
- API integrations
- Custom tool exposure

For a game project:
- **Sprite generation** could use an MCP server that calls PixelLab/Stable Diffusion and returns spritesheets directly.
- **Asset compression** could use an MCP server wrapping `pngquant`, `oxipng`, `ffmpeg`.
- **Audio batch-processing** similarly.
- **Deploy pipeline** could use an MCP server wrapping `gh`, `vercel`, etc.

We did not explore MCP servers in depth in this session. Mention here as a direction for the next project's pipeline.

## Generating art vs implementing art

AI can make a sprite in 10 seconds. Getting it into the engine with:
- Correct frame size
- Correct transparency
- Correct palette
- Correct naming
- Registered in the asset manifest
- Tested in-engine

…takes the other 50 minutes.

Budget accordingly. AI art is concept acceleration, not implementation.

## Recommendations for the next project's art pipeline

1. **Aseprite as canonical tool.** Every shipped sprite has an `.aseprite` source in `art-source/`.
2. **AI for exploration.** Use AI to generate variants, then port to Aseprite for cleanup.
3. **One master sheet per character** before any animation.
4. **Asset manifest** lists every sprite with its source file + export path.
5. **Cleanup pipeline documented** (resize, palette, transparency, frame alignment, in-engine test).
6. **No raw AI output in `public/`.** Cleanup or don't ship.

## Warning

**AI art should be treated as concept acceleration unless cleaned and standardized.** Shipping raw AI output looks unprofessional and creates consistency drift across the game.

---
<a id="17"></a>
# 17 — Testing, debugging, visual QA

## Pre-flight pattern (build this week 1)

`tests/test_preflight_stages.js` in our repo. Pattern:
1. Launch headless Chrome via puppeteer.
2. Load `index.html` from `file://`.
3. Wait for `SDD.sprites.pixelLab.ready` (or the equivalent boot signal).
4. For every stage:
   - Set scene to `('level', { day, stage })`.
   - Assert no JS errors fired (`page.on('pageerror')` listener).
   - Assert player exists with reasonable position.
   - Assert timepart entity exists in `scene.items`.
   - Wait briefly (~400ms) for any spawn-time issues to surface.
   - Verify player is not dead, has not fallen out of the world.
5. Report pass/fail per stage.

Run before every commit that touches levels or core engine. Caught 5 real bugs.

## Screenshot pattern

`tests/screenshot_stages.js`. Pattern:
1. Same boot as pre-flight.
2. For every stage, teleport the player to 0%, 25%, 75%, 100% of level width.
3. Screenshot each.
4. Save to `/tmp/preflight_<day>_<stage>_<position>.png`.
5. Mark reviewed by eye and gave design feedback.

## Manual QA checklist

- [ ] Run pre-flight; expect 12/12 OK (or equivalent stage count)
- [ ] Open editor, switch between every stage; no console errors
- [ ] Test signature pickup on the stage where it's placed
- [ ] Test death and checkpoint return
- [ ] Test win → next stage transition
- [ ] Test save/continue
- [ ] Test difficulty toggle
- [ ] Test mute toggle
- [ ] Run on phone (mobile QA)

## Common bugs we watched for (every one from real commits)

### Sprite frame mismatch
A sprite variant is missing (e.g., `walker_0_l_porcupine` not registered). Renderer falls back to default. Visually wrong.

**Catch:** load every variant in pre-flight; assert no fallback.

### Wrong bounding boxes
The flappy hitbox bug. Brushing past obstacles registered as hits.

**Catch:** test with player at known positions; verify expected behavior.

### Collision phase-through
Mover platform spawns inside a wall; player can pass through.

**Catch:** asserts on mover endpoints in pre-flight.

### Unreachable platforms
A jump requires more than 5 tiles unaided; player can't proceed.

**Catch:** static analysis of level data (max gap, max height) before commit.

### Audio not playing
Browser autoplay blocks; user gesture not yet received.

**Catch:** integration test that triggers the gesture, then asserts audio context state.

### Background layer problems
Layer drawn out of order; player invisible against background.

**Catch:** screenshot test + visual review.

### Mobile layout issues
Buttons obscured by safe area; D-pad too small.

**Catch:** real-device testing. Browser DevTools mobile mode doesn't catch everything.

### Asset path errors
Filename has a space; works on dev (case-insensitive FS) but fails on prod (case-sensitive).

**Catch:** asset loader manifest with explicit paths; pre-flight asserts all assets load.

---
<a id="18"></a>
# 18 — Next-game recommendations

## Recommended engine / framework
**Phaser 3 + TypeScript + Tiled + Vite + PWA manifest from day 1.**

Reasons:
- Tilemap loader (Tiled integration) replaces our editor's 1700 lines.
- Audio manager handles iOS unlock automatically.
- Scene manager with proper transitions.
- Input system with virtual joystick plugin for mobile.
- Active community; AI assistants are strong on Phaser.

Alternative: **Godot 4** if native iOS/Android/Steam is a primary goal.

## Recommended folder structure
See section 04. Replicate the `public/assets/` + `src/` + `tools/` + `tests/` + `docs/` + `art-source/` tree.

## Recommended first prototype
**By end of week 1:**
- One player sprite with idle + walk
- One enemy
- One Tiled-loaded tilemap
- One sound effect
- Camera follow
- **Deployed to a real phone via static host**

That's the bar. If you can't hit it in 7 days, you've picked the wrong engine.

## Recommended level editor approach
**Use Tiled** (https://www.mapeditor.org/). External tool, free, mature, exports JSON, integrates directly with Phaser.

Do not build your own unless Tiled genuinely can't do what you need. Even then, build the minimum.

## Recommended art pipeline
1. AI (Midjourney/Imagen/PixelLab) for exploration
2. Aseprite for cleanup and master sheets
3. Export to `public/assets/sprites/`
4. Asset manifest tracks every file
5. Pre-flight verifies all assets load

## Recommended audio pipeline
1. OGG + MP3 fallback
2. Per-scene lazy load
3. Web Audio API with first-gesture unlock
4. Volume controls in settings
5. Test on real device, including with iOS mute switch

## Recommended deployment path
1. Git push to main → static host (Netlify/Vercel/Cloudflare Pages) auto-deploys
2. PWA manifest + service worker from week 1
3. Test on real device every week
4. Cache-bust on deploy via filename hashing or service worker version

## What to do differently from day one
1. Pick Phaser or Godot, not vanilla
2. Use Tiled for levels
3. Use Aseprite for sprites
4. Write a `docs/HANDOFF.md` skeleton week 1; update it weekly
5. Deploy to a phone week 1
6. Constants in one file
7. Asset manifest
8. Pre-flight test rig
9. Style bible BEFORE any production art
10. Theme system defined as a triple (tile family + sky + variant map) before any theme ships

## What should be reused from this project
- **The theme system architecture** (family + sky painter + variant map). Document and replicate.
- **The pre-flight + screenshot test pattern.**
- **The signature-power concept** (per-stage themed temporary power-ups).
- **The editor's COPY MAINS / EXPORT pattern** (round-trip between in-browser editing and committed files).
- **The flat declarative level format** (tiles as strings, spawns/movers as arrays).
- **The teach-test-twist level design discipline.**

## What should not be reused
- **Procedural JS level files.**
- **The flat `window.SDD` global.**
- **Asset paths with spaces.**
- **Absence of a style bible.**
- **Audio system unspecified at start.**
- **Mobile deferred to "later."**

## First 30 days roadmap for the next game

### Week 1: Foundation
- [ ] Engine chosen (Phaser 3 recommended)
- [ ] Repo initialized with structure from section 04
- [ ] Constants file
- [ ] Asset manifest skeleton
- [ ] One playable level loaded from Tiled
- [ ] Player with idle + walk
- [ ] One enemy
- [ ] One sound effect (with iOS unlock)
- [ ] Deployed to phone
- [ ] `docs/HANDOFF.md` skeleton

### Week 2: Style lock
- [ ] Style bible written
- [ ] Master sprite sheet for player
- [ ] One theme fully built (tile family + sky + variants)
- [ ] One signature/power-up mechanic
- [ ] Pre-flight test rig
- [ ] Screenshot test rig

### Week 3: Content tooling
- [ ] Tiled set up with custom tile properties for spawns
- [ ] Level export pipeline (Tiled → game)
- [ ] Five test levels built in Tiled by designer
- [ ] All levels pass pre-flight

### Week 4: Polish + ship
- [ ] Menu polish
- [ ] Mobile controls overlay
- [ ] PWA manifest verified
- [ ] Real-device QA round
- [ ] Audio pipeline locked
- [ ] First playable build shared externally

---
<a id="19"></a>
# 19 — Prompt library for future AI

Copy-paste prompts. Each is written so the AI has file paths and acceptance criteria up front.

## Analyze the repo
```
Read docs/HANDOFF.md sections 00, 04, 09. Then read docs/CURRENT_STATUS.md
if it exists. Tell me:
- Current branch + last 5 commits
- List of levels with their status
- List of known issues
- Anything that looks broken
Don't make changes. Just report.
```

## Create a style bible
```
Read docs/HANDOFF.md section 05. Then read existing background painters in
[file path] or existing assets in [path]. Generate a one-page palette +
composition card for the new theme: [theme name].
Include:
- Color palette (6-10 named hex values)
- Sky painter outline (gradient endpoints, sun pool position)
- Tile family choice or paint description for ground/dirt/brick
- Walker / wisp / thrower variant assignments
- Mood phrase (one sentence)
Output as Markdown.
```

## Generate a parallax background
```
Generate a 16-bit pixel art parallax background:
- Theme: [theme]
- Mood: [phrase]
- Aspect ratio: [W]:[H] matching canvas
- Three layers: far (bokeh blur), mid (silhouette), near (sharp)
- No characters, no UI, no text
- Palette: [hex list]
- Sun direction: [upper-left / upper-right / overhead]
- Foreground elements: [list]
Reference style: [URL or existing in-game frame]
```

## Generate next background panel
```
Reference: [URL to right edge of prior panel]
Generate the next panel continuing right:
- Horizon at y=[Y]
- Carry over from prior panel's right edge: [silhouettes A, B, C]
- Same palette and sun direction
- Aspect ratio: same as prior
- Introduce: [new elements]
- No seam at left edge
- Pixel art, 16-bit, no characters, no UI, no text
```

## Create a sprite sheet
```
Pixel art character sprite sheet:
- Canvas: [W]×[H] per frame, [N] frames in a row
- Character: [description, proportions, outfit]
- Animations: idle (2 frames), walk (4 frames), jump (1), fall (1), hurt (1)
- Palette: [hex list] - 6 colors max
- Hard-edged pixels, no antialiasing
- White (or transparent) background
- Feet aligned to bottom of each frame
- Inspired by: [Mega Man X / Shovel Knight / other]
```

## Clean up sprite implementation
```
For sprite at [path]:
1. Verify frame alignment across all frames (feet on same baseline)
2. Verify transparency (no 1px anti-alias halos)
3. Verify palette matches the locked palette
4. Verify registered in [sprite-loader file] with the correct name
5. Verify dropdown entry in [editor file] if it's a variant
Report each as PASS/FAIL with specifics.
```

## Make a tileset
```
Generate a tileset PNG for theme [X]:
- 16×16 tiles, arranged in a [N]×[M] grid
- Include: ground (top with light catching, dirt interior, brick variant, platform variant)
- 1-pixel safety margin around each tile (so they don't bleed in atlases)
- Palette: [hex list]
- Style: [description]
- Each tile reads at small viewport (test by scaling down)
```

## Design a level
```
Design level [day]-[stage], theme [X], introducing mechanic [Y].
Constraints:
- Width 240-300 tiles
- Player spawns at row 10, col 3
- Timepart visible from final stretch
- Checkpoint between 40-60% mark
- One signature pickup (kind: [signature])
- Teach-test-twist for the new mechanic
- No required jump > 5 tiles unaided
- Cores spaced ~every 3 tiles on main path
- Theme variants for walker/wisp/thrower

Output: declarative level data in our flat format (tiles as strings,
spawns as array, movers as array) or Tiled-compatible JSON.

Verify with pre-flight test before returning.
```

## Build a level editor
```
Read docs/HANDOFF.md section 10.
Build a minimum viable editor with these features:
- Tile painting with brush size selector
- Spawn placement with type/variant dropdown
- TEST button: enter the level scene with current edits, exit returns here
- Export button: serialize to declarative format and download
The editor mutates the same data object the engine reads on level enter
(no parallel data structure).
File: [editor file path].
```

## Debug audio
```
Read docs/HANDOFF.md section 11.
Audio is not playing on iOS Safari for [scenario].
Check:
- First user gesture occurred? (audio context state)
- Audio asset loaded? (network tab)
- Web Audio API or HTML5 Audio?
- iOS mute switch state?
- Volume not zero?
Report findings, then propose fix.
```

## Prepare iOS/PWA shipping
```
Read docs/HANDOFF.md section 13.
Audit this repo for PWA / iOS readiness:
- manifest.json present + valid?
- Service worker registered?
- Apple-touch-icon present?
- Apple meta tags present?
- Viewport meta correct?
- Touch controls present?
- Audio unlock pattern present?
Report each as PASS/FAIL/MISSING. Don't fix anything yet.
```

## Create a session handoff
```
Update docs/HANDOFF.md sections 00 (top 10 lessons) and 15 (known bugs).
Update docs/CURRENT_STATUS.md with:
- Current branch + last commit SHA
- Last 5 commits with one-line descriptions
- In-flight work (what's started but not committed)
- Blockers (what's waiting on a decision)
- Next 3 tasks queued
Don't change code. Just write the docs.
```

---
<a id="20"></a>
# 20 — Final senior-designer advice

To the junior developer / next AI session picking this up:

You're inheriting a real project, not a tutorial. It has battle scars and rough edges. Some of those scars are mine; you'll add yours. That's how it works.

## Biggest production lessons

**Tools first, content second.** Every hour spent on the editor saved many hours of content drudgery. Every hour spent on the pre-flight test caught bugs that would have shipped. Every hour spent on the style bible would have prevented theme drift. We learned this halfway through. You can know it from day one.

**Decide early, refactor never.** The decisions you defer to "we'll figure it out later" become the bugs you can never untangle. Engine choice, asset structure, tile size, sprite anchor convention — pick them in week 1 even if you change your mind in week 2. The cost of changing in week 2 is small. The cost of "no convention" is enormous.

**Test before commit.** The pre-flight rig caught real bugs. Even a 50-line test that loads every scene and asserts no JS errors is worth its weight.

## Biggest creative lessons

**Kids notice consistency.** Themes that have a coherent sky, tiles, and enemy variants feel like worlds. Themes that have only one of those feel borrowed. The "borrowed from the savanna level" complaint on 6-2 was the lesson — every theme needs all three legs (tile family + sky painter + variant map) before it ships.

**Readability beats prettiness.** A background that's gorgeous but obscures the player loses kids in 30 seconds. A background that's modest but clearly separates "you can stand here" from "this is decoration" keeps them for hours.

**Less mechanic per stage, more depth per mechanic.** Stages with one new mechanic explored thoroughly (teach-test-twist) are remembered. Stages with five new mechanics dropped at once are forgotten.

**Signatures (per-stage powers) are the secret sauce.** They give each stage an identity — "the cloud-glide stage," "the vine stage," "the star-jump stage" — instead of "Day 4 Stage 2." Worth the implementation cost.

## Biggest technical lessons

**Separate data from code.** Levels are data, themes are data, signature catalogs are data. The moment any of those becomes a function with side effects, you've made it impossible to edit live. This is the single biggest architecture lesson from this project.

**Mode-specific behavior lives in data.** The flappy hitbox bug existed because hitbox config was hard-coded in `scenes.js`. Once it moved to level data, the bug class disappeared. Same principle: gravity scale, jump scale, theme zones, hitbox per-size — all data.

**Per-entity anchor convention.** Pick one — we use feet at y+h, x is left edge — and stick to it across every entity. Mixing anchor conventions is how you get walkers that float and players that clip.

**Defensive rendering.** Every sprite lookup should fall back gracefully (`walker_0_l_porcupine` → `walker_0_l`). The game shouldn't crash on a missing asset; it should fall back and log.

**Browser globals are technical debt.** Every `window.SDD.foo` is a coupling you can't refactor cheaply. Use modules from day 1.

## How to protect the project from chaos

Four artifacts. Every project needs all four by week 1:

1. **`src/config/constants.ts`** — TILE, CANVAS_W, CANVAS_H, sprite dimensions, color palettes per theme. One file. Referenced everywhere.

2. **`docs/HANDOFF.md`** (this file) — updated weekly. Future-you depends on it.

3. **`docs/STYLE_BIBLE.md`** — palette per theme, sprite proportions, layout conventions. Written before any production art.

4. **`tests/preflight.spec.ts`** — loads every scene, asserts no errors. Run before every commit. Add new assertions as you find bugs.

Skip any of these and you'll write them under duress later. With more pain.

## How to make the next game feel more polished earlier

**Ship one beautiful level in week 2** before any other level exists. Use it as the standard. Every later level has to clear that bar.

**Deploy to a phone in week 1.** Even ugly. The discovery of iOS pain happens once, early, and you adapt to it. Defer it and you'll be retrofitting for months.

**Don't add the second mechanic until the first one is taught.** Each mechanic gets its own stage. Two-mechanic combos come later.

**The HUD is the last 5% that's worth 30% of the polish.** A clean lives counter, a satisfying core-collect animation, a smooth pause transition — these are what make the game feel professional. Allocate time for them, don't treat as afterthought.

**Test on real hands.** Not just yours. A 9-year-old will tell you in 30 seconds what's broken about your level design. Listen.

---

## Closing

This was a real project with real problems and a real journey. The next one will be smarter for it.

Tools first. Data not code. Themes are triples. Test before commit. Deploy to a phone early. Style bible before art. Handoff before you need one.

Build the thing. Show it to kids. Listen. Iterate. Ship.

Good luck.

— First-half session, signing off

---

<a id="ref-repo"></a>
# Reference: Repo snapshot (end of first half)

**Branch:** `claude/super-dude-danny-platformer-Jftc7`

**Last commits (chronological in first-half session):**
- `db466a6` — Stages 1-1, 2-1, 2-2, 3-1, 3-2: import editor-exported level data
- `6f8818b` — Stages 4-1..6-1: import editor-exported level data (Mark's tuning pass)
- `38094e9` — Stages 6-2, 7-1: import editor-exported level data (Mark's tuning pass) — final import batch
- `52dc85d` — Batch 1 of design pass: 4-2 gravity + kid-friendly signature hints
- `e331bf8` — Editor: STAGE tab with per-size flappy hitbox sliders
- `8058c5b` — Batch B — 6-1 enemies: lion redraw, unkillable predators, porcupine spike animation, new Stampede mob
- `9d01ba7` — Batch C — 6-2 BUG WORLD: scrap MANKIND, build bug-scale canopy stage
- `15a34d6` — 6-2 BUG WORLD: bark floor, branch-parallax sky, goliath beetle walker
- `a825a96` — 6-2 sky: blur far/mid layers for bokeh depth
- `754e600` — 6-2 sky: cohesive canopy scene, branches anchored to foliage *(final commit before handoff)*

**Working tree:** clean (per the last git status I ran).

**Files at risk of confusion:**
- `assets/Super Dude Danny Big Sprites/` (spaces in path)
- `assets/Super Dude Danny Small Sprites - /` (spaces + trailing dash)

**Open redesigns queued but not done:**
- Pearl → shell mechanic
- Cooling water lava-walk visual
- Vine grapple → shoots leaves
- Wing burst → remove
- Air bubble — clarify what it does
- Calling horn — clarify what it does
- Friendship token — replace
- Per-signature unique floating-indicator particles
- 7-1 adam/eve dialogue (psalms / kid lines + final "Safe Travels!" / "God Bless!")
- 6-2 bug-world background possibly replaced with a real PNG asset (image upload pending in last conversation turn)

---
<a id="ref-level"></a>
# Reference: Level file format (the editor's flat declarative format)

```js
// Auto-generated by editor.js - safe to overwrite by saving from the editor.
window.SDD = window.SDD || {};
SDD.levels = SDD.levels || {};
SDD.levels['1-1'] = {
  width: 380, height: 14, ground: 11,
  tiles: [
    "                                                ...",  // row 0 (top)
    "                                                ...",  // row 1
    // ... 14 rows total
  ],
  spawns: [
    { type: "player", tx: 3, ty: 10 },
    { type: "core", tx: 6, ty: 9 },
    { type: "walker", tx: 18, ty: 10, variant: "lion" },
    { type: "timepart", tx: 372, ty: 7 },
    { type: "signature", tx: 50, ty: 10, kind: "sunburst" },
    { type: "checkpoint", tx: 190, ty: 10 },
    // ...
  ],
  movers: [
    { tx: 71, ty: 9, tx1: 75, ty1: 9, spd: 0.022, phase: 0 },
    // ...
  ],
  name: "LIGHT AND DARKNESS",
  theme: "galactic",
  // Optional fields:
  gravityScale: 0.48,           // override world gravity (e.g. 4-2)
  jumpScale: 0.75,              // override jump impulse
  underwater: true,             // 5-2
  flappy: true,                 // 5-1
  flappySpeed: 1.4,
  flappyFlap: 3.6,
  flappyGravity: 0.85,
  flappyMaxFall: 4.5,
  flappySmallHitbox: { dx: 2, w: 9, h: 19 },
  flappyBigHitbox:   { dx: 0, w: 11, h: 26 },
  themeZones: [
    { startCol: 0, theme: "savanna" },
    { startCol: 84, theme: "forest" },
    { startCol: 162, theme: "bugscale" }
  ]
};
SDD.level1 = SDD.levels['1-1'];  // legacy alias only for 1-1
```

**Tile string convention:**
- Each row is a string of single-character codes.
- String length = `width`.
- Spaces are air.
- All other characters per the tile code table in section 09.

**Spawn types** (see editor SPAWN_GROUPS in `js/editor.js` line 76):
- `player`, `checkpoint`
- `core`, `timepart`
- `walker`, `thrower`, `crab`, `stampede`
- `wisp`, `octopus`, `eel`
- `skyhazard`, `twister`, `bubble`
- `npc`, `signature`

**Variants** (theme-skinning):
- `walker.variant`: `lion`, `porcupine`, `beetle`, `leaf`, `rock`, `clam`, `flame`, `cloud`, `fruit`
- `wisp.variant`: `bird`, `star`, `jellyfish`, `leaf`, `bat`, `smoke`, `stormcloud`, `bee`
- `thrower.variant`: `rain`, `rock`, `seed`, `sun`, `fruit`

**Signature kinds** (12 total):
`sunburst`, `cloudglide`, `pearl`, `coolingwater`, `vinegrapple`, `sunshield`, `starjump`, `wingburst`, `airbubble`, `callinghorn`, `friendshiptoken`, `doveblessing`

**NPC kinds:**
`adam`, `eve`, `lion`, `deer`, `dove`

**Skyhazard kinds:**
`flare`, `meteor`, `meteorH`, `lavaPlume`

---
<a id="ref-editor"></a>
# Reference: Editor anatomy (`js/editor.js`)

**File length at handoff:** ~1700 lines.

**Top-level structure:**
- IIFE wrapping
- Constants: `STAGE_NAMES`, `TILE_DEFS`, `SPAWN_GROUPS`, `SPAWN_FIELDS`, `FIELD_ENUMS`, `TOOL_DEFS`, `TILE_GROUPS`
- `buildUI(scene)` — constructs the DOM overlay
- `SDD.scenes.editor` — the scene object (enter/exit/update/render)
- Helpers: `refreshStatus`, `refreshVariantList`, `refreshUsageBadges`, `refreshTileHighlight`, `refreshSpawnHighlight`, `refreshProps`, etc.
- Serializer: `levelToJs(key, lvl)` — emits the flat declarative format
- Variant library functions

**DOM layout (built in `buildUI`):**
- Top bar: stage picker + zoom controls + TEST/SAVE/EXPORT buttons
- Tool descriptor bar
- Left panel: tile palette + spawn palette + mover tools
- Center: scaled canvas mirror
- Right panel: tabbed (PROPERTIES / STAGE / VARIANTS)
- Bottom: status bar (coords, counts, dirty indicator, toast)

**Key entry points:**
- `enter(d)` — initialize scene, build UI, load stage
- `loadStage()` — fetch `SDD.levels[key]`, normalize tile rows to char arrays
- `switchStage(day, stage)` — discard prompt if dirty, then load
- `test()` — `SDD.setScene('level', { day, stage })` with in-memory edits
- `save(saveAs)` — File System Access API + download fallback
- `copyMainsToClipboard()` — emit all MAIN-flagged stages as JSON

**STAGE tab (added in batch A):**
- Inputs for flappy small/big hitbox (dx, w, h)
- Hidden warning when not a flappy stage
- Live-updates running player via `SDD.applyFlappyHitboxNow`

**Removal instructions** (top of file, lines 13–14):
> "Delete the `<script src="js/editor.js"></script>` in index.html. Delete the LEVEL EDITOR menu item + handler in scenes.js."

---
<a id="ref-sig"></a>
# Reference: Signature powers catalog

Status at end of first half:

| Kind | Label | Tip (current) | Behavior | Mark's verdict | Redesign queued |
|---|---|---|---|---|---|
| `sunburst` | SUNBURST! | RUN INTO BAD GUYS TO ZAP THEM! | Player invincible (hurt returns false) | Good — do not change | Tip is misleading; says zap, actually invincibility |
| `cloudglide` | CLOUD GLIDE! | JUMP, THEN HOLD A TO FLOAT DOWN! | Float fall (engine impl) | Good — do not change | None |
| `pearl` | PEARL POWER! | SWIM SUPER FAST UNDER WATER! | Swim speed boost underwater | Bad | YES — Mark wants protective shell mechanic, takes 1–2 extra hits |
| `coolingwater` | COOL WATER! | WALK RIGHT OVER LAVA - IT WON'T BURN! | Lava becomes walkable | Bad | YES — needs distinctive visual (currently no visual change) |
| `vinegrapple` | VINE GRAPPLE! | PRESS B BY A VINE TO SWING ACROSS! | Vine grapple swing | Meh | YES — Mark wants leaf-shooter instead |
| `sunshield` | SUN SHIELD! | SUN FLARES BOUNCE RIGHT OFF YOU! | Sun-flare immunity | Fine — do not change | None |
| `starjump` | STAR JUMP! | JUMP, THEN A AGAIN AND AGAIN IN THE AIR! | Multi-jump | Great — do not change | None |
| `wingburst` | WING BURST! | HOLD A TO FLY STRAIGHT UP! | Upward soar | Not necessary | YES — REMOVE entirely |
| `airbubble` | AIR BUBBLE! | SEA CREATURES CAN'T TOUCH YOU! | Wisps phase through player underwater | Unclear behavior | YES — clarify or replace |
| `callinghorn` | CALLING HORN! | ALL ENEMIES FREEZE WHERE THEY STAND! | All enemies freeze | Unclear behavior | YES — clarify |
| `friendshiptoken` | FRIENDSHIP! | FRIENDS GIVE YOU EXTRA POWER CORES! | NPCs give 5 cores instead of 3 | Probably replace | YES — replacement mechanic TBD |
| `doveblessing` | DOVE BLESSING! | POWER CORES RAIN DOWN FROM THE SKY! | Cores rain | Perfect — do not change | None |

**Implementation locations:**
- Labels + tips: `SIG_LABELS` and `SIG_HINTS` in `js/scenes.js` ~line 2060
- Mechanics: scattered in `entities.js` (`Player.giveSignature`, `Player.hurt`) and `scenes.js` (collision loop, lava check, etc.)
- Durations: `Player.prototype.giveSignature` in `entities.js`, `DURATIONS` constant
- Pickup placement: per-stage `spawns` array, `{ type: "signature", tx, ty, kind: "..." }`

---
<a id="ref-theme"></a>
# Reference: Theme family map

| Theme | Tile family | Sky painter | Walker variant | Wisp variant | Thrower variant | Mover platform variant |
|---|---|---|---|---|---|---|
| `galactic` | cosmic | `drawSkyGalactic` | (default) | (default) | (default) | galactic |
| `sky` | bright-sky | `drawSky_sky` | cloud | bird | rain | cloud |
| `sea-surface` | sea | `drawSky_sea_surface` | clam | bird | rain | raft |
| `rocky` | rocky | `drawSky_rocky` | rock | smoke | rock | stone |
| `forest` | lush | `drawSky_forest` | leaf | leaf | seed | (none placed) |
| `sunlit` | sunlit | `drawSky_sunlit` | flame | star | sun | sunbeam |
| `cosmic-night` | cosmic | `drawSky_cosmic_night` | (default) | star | (default) | cosmic |
| `bird-sky` | bright-sky | `drawSky_bird_sky` | cloud | bird | rain | cloud |
| `seaside` | sea | `drawSky_seaside` | clam | jellyfish | rain | raft |
| `savanna` | rocky | `drawSky_savanna` | lion | bird | rock | bone |
| `village-dusk` | lush | `drawSky_village_dusk` | leaf | bat | fruit | cart |
| `eden` | lush | `drawSky_eden` | leaf | leaf | fruit | eden |
| `bugscale` | wood | `drawSky_bugscale` | beetle | bee | seed | (none placed) |

**Locations in code:**
- `THEME_VARIANTS` map (walker/wisp/thrower): `js/scenes.js` line ~2136
- `THEMES` map (sky painters): `js/scenes.js` line ~1975
- `THEME_FAMILY` map (tile family): `js/sprites.js` line ~2490
- `PLAT_VARS` map (mover platform variant): `js/scenes.js` line ~2280

**Rule learned the hard way:** to add a new theme, you must touch ALL FOUR maps. Missing any one of them produces "borrowed from another level" visual bugs.

---
<a id="ref-enemy"></a>
# Reference: Enemy catalog

## Walkers (ground patrol)
| Variant | Used on theme | Stompable | Notes |
|---|---|---|---|
| (default shadow) | galactic | yes | |
| cloud | sky, bird-sky | yes | |
| clam | sea-surface, seaside | yes | |
| rock | rocky | yes | |
| leaf | forest, eden, village-dusk | yes | |
| flame | sunlit | yes | |
| lion | savanna (6-1) | **no — unkillable** | Batch B |
| porcupine | savanna (6-1) | **no — unkillable**, animated spines | Batch B |
| beetle | bugscale (6-2) | yes | Goliath, Batch C |
| fruit | (placeholder) | yes | |

## Wisps (flying)
| Variant | Used on theme | Notes |
|---|---|---|
| (default shadow) | galactic | |
| bird | sky, bird-sky, savanna | |
| star | cosmic-night, sunlit | |
| jellyfish | seaside | |
| leaf | forest, eden | |
| bat | village-dusk | |
| smoke | rocky | |
| stormcloud | (shoot variant override) | When `shoots: true`, renders as stormcloud regardless of theme |
| bee | bugscale (6-2) | Batch C |

## Throwers (stationary)
- Variants: rain, rock, seed, sun, fruit
- Stompable: yes

## Special enemies (no walker base class)
- **Crab** (16×16) — sideways scuttle, stompable, used 2-2 + 5-2
- **Octopus** (8 arms) — underwater, **not stompable**
- **ElectricEel** — sits in socket on sea floor, rises periodically, used 5-2, **not stompable**
- **HazardSpawner** (skyhazard) — periodic projectile emitter (flares, meteors, lava plumes)
- **BubbleUp** — vertical hazard for water levels
- **Twister** — sweeping tornado hazard
- **Stampede** (Batch B, new) — 8 tile × 1 tile wildebeest herd, patrols, hurts on touch, **not stompable**

---
<a id="templates"></a>
# Templates

Save these as separate files in `templates/` in the next project.

## Templates — Session restart prompt

```markdown
# Session restart context for [PROJECT NAME]

I'm continuing development of [PROJECT NAME].
Branch: [branch]
Last commit SHA: [sha] ([one-line message])

Before changing anything, read these files in order:
1. docs/HANDOFF.md sections 00, 04, 09, 10, 15
2. docs/CURRENT_STATUS.md (most recent state)
3. docs/KNOWN_BUGS.md

Then:
- Run `npm test` (or `node tests/preflight.spec.js`) — expect [N]/[N] OK
- Run `git status` — expect clean working tree (or report deviation)

I'll then tell you what to work on. Do not make changes yet.
```

## Templates — Current project status

```markdown
# Current Status — [PROJECT NAME]

Last updated: [date]

## Stack
- Engine: [Phaser 3 / Godot / Vanilla / etc.]
- Language: [TS / JS / etc.]
- Build: [Vite / none / etc.]
- Deploy: [Netlify URL / etc.]

## Branch state
- Branch: [branch]
- Last commit: [sha] — [one-line message]
- Working tree: [clean / dirty]
- Open PRs: [list or none]

## Shipped features (tested, in main)
- [feature 1]
- [feature 2]
- ...

## In-flight (started, not committed)
- [feature 3] — [status]
- [feature 4] — [status]

## Blocked / waiting
- [item] — waiting on [decision]

## Next 3 tasks queued
1. [task] — [description]
2. [task]
3. [task]
```

## Templates — Known bugs and next tasks

```markdown
# Known bugs

## Critical (blocks shipping)
- [ ] [bug] — [where it manifests] — [reproduction]

## High (visible to users, workaroundable)
- [ ] [bug]
- [ ] [bug]

## Low (cosmetic)
- [ ] [bug]

## Tech debt / cleanup
- [ ] [item]
- [ ] [item]

# Next tasks (priority order)

1. **[task name]** — [what / why / acceptance criteria]
2. **[task name]** — ...
3. **[task name]** — ...
```

## Templates — New level brief

```markdown
# Level brief: Day [N] Stage [M] — [NAME]

## Identity
- Theme: [theme key]
- Width: [tiles]
- Mood (one sentence): [...]

## New mechanic introduced (if any)
- [mechanic] — how it teaches, tests, twists

## Signature pickup
- Kind: [signature kind]
- Placement: ~col [X]

## Checkpoint
- ~col [X]

## Timepart
- Final col, on a pedestal

## Enemy mix
- [walker variant] × N, [wisp variant] × N, [hazard] × N

## Layout notes
- Section 1 (cols 0–[X]): [description]
- Section 2 ([X]–[Y]): [...]
- Section 3 ([Y]–end): [...]

## Acceptance criteria
- [ ] Pre-flight test passes
- [ ] Timepart visible from final stretch
- [ ] No required jump > 5 tiles unaided
- [ ] Screenshot review approved
```

## Templates — New background panel brief

```markdown
# Background panel brief: [theme] — [position]

## Theme
[theme key]

## Adjacent panels
- Left panel reference: [URL or path]
- Right panel reference: [URL or path]

## Layer count
[3 / 4]

## Carry-over silhouettes
- From left panel right edge: [A, B, C]
- To right panel left edge: [A, B, C]

## New elements in this panel
- [element 1]
- [element 2]

## Palette
[hex list]

## Sun direction
[upper-left / upper-right / overhead]

## Aspect ratio
[W × H px]

## Acceptance criteria
- [ ] Horizontally seamless if tiling
- [ ] Sun direction matches adjacent panels
- [ ] No interactive-looking shapes in background
- [ ] Player sprite tested against every layer combo
```

## Templates — New sprite brief

```markdown
# Sprite brief: [character/entity name]

## Master sheet reference
[path or URL]

## Frame canvas size
[W × H]

## Anchor convention
[e.g. feet at y+h, x is left edge]

## Animations needed
- idle: [N frames]
- walk: [N frames]
- jump: [1 frame]
- fall: [1 frame]
- hurt: [1 frame]
- [other]: [N frames]

## Palette
[hex list, 6–8 colors]

## Proportions
[action hero / chibi / etc.]

## Variants (if any)
- [variant 1]
- [variant 2]

## Acceptance criteria
- [ ] Feet aligned across all frames
- [ ] Palette quantized to locked colors
- [ ] Transparency clean (no 1px halos)
- [ ] Tested in-engine at game scale
- [ ] Registered in asset manifest
- [ ] Editor dropdown updated (if variant)
```

---

# End of handoff

This file represents the first-half session's complete view of the project. The second-half session has the rest. Together they're the whole truth.

If you're the next AI session reading this: welcome. Run the pre-flight. Read sections 00, 04, 09, 10, 15. Then ask what to do.

Good luck.
