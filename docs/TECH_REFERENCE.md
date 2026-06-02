# Super Dude Danny — Technical Reference & Discoveries

> Companion to `CLAUDE.md`. CLAUDE.md is the narrative handover (what
> we did, current state); THIS file is the durable technical map +
> the hard-won "gotchas" so a new session doesn't re-learn them the
> painful way. Accurate as of **v1.0.2**.

---

## 1. Documentation inventory (read order for a new session)

| File | What it is |
|---|---|
| `CLAUDE.md` | **Read first.** Narrative handover + the ★ PROJECT STATE SNAPSHOT (consolidated current state) + full version-by-version changelog. |
| `docs/TECH_REFERENCE.md` | This file — architecture map, inventories, gotchas. |
| `ART_STYLE.md` | Authoritative guide to the Adventure City cyber-theme pixel-art (5-layer parallax, palette, per-building paint stack, shader pass, neon-sign formula). Read before touching `drawSky_cyber` / the `_cy*` painters. |
| `docs/SCRIPTURE_LESSONS_SPEC.md` | Design spec for the post-stage lesson scene (now implemented in v1.0). Locked decisions in §7. |
| `IOS_BUILD.md` | Step-by-step Capacitor → Xcode → App Store, plus ready-to-paste listing copy + privacy answers. |
| `PLAN.md` | Historical design record (Passes 1-11). Mostly shipped; read for *why* things look the way they do. |
| `README.md` | Public-facing description + controls. |
| `assets/README.txt` | Legacy note about art swap-in (mostly superseded). |

---

## 2. Module map — the `window.SDD` namespace

24 classic `<script>` tags in `index.html`, **strict dependency order**:
`save → input → audio → sprites → engine → entities → level1 →
level_2_1…7_1 → level_8_1 → cyber_decor_8_1 → quiz_data →
scripture_data → scenes → [editor, decor_editor — COMMENTED OUT] →
main`.

Each file is an IIFE attaching to `window.SDD`. Key exports:

| Export | Defined in | Purpose |
|---|---|---|
| `SDD.C` | engine.js | Constants: `TILE 16`, `VIEW_W/H 320/180`, `GRAVITY 0.36`, `MAX_FALL 5.8`, `JUMP_SMALL -6.5`, `JUMP_BIG -7.0`, etc. |
| `SDD.engine` | engine.js | `TileMap`, `Camera`, `overlap`, `clamp`, `randInt`. |
| `SDD.ent` | entities.js | All entity constructors (see §4). |
| `SDD.sprites` | sprites.js | `build()`, `get(name)`, `text/textShadow`, `pixDraw`, `pixFrame`, `pixBBox`, `drawDanny`, the `F` pixel font, PixelLab manifest. |
| `SDD.audio` | audio.js | `init/resume`, `sfx(name)`, `startMusic/stopMusic`, volume buses, MP3 pools + chiptune fallback. |
| `SDD.input` | input.js | keyboard + virtual joystick + touch buttons + gamepad; `pressed/held/confirm/back`, `onFirstGesture`, `endStep`. |
| `SDD.save` | save.js | v4 save (3 slots + global options); `data` proxy, `recordStage`, `isQuizPassed`, `curDifficulty`, `secretUnlocked` flag. |
| `SDD.levels` | level_*.js | `SDD.levels['d-s']` plain data objects. |
| `SDD.quiz` / `SDD.scripture` | quiz_data.js / scripture_data.js | per-day quiz Q&A / per-stage ICB lessons. `SDD.scriptureFor(day,stage)`. |
| `SDD.scenes` + `SDD.setScene` + `SDD.scene` | scenes.js + main.js | scene registry, switcher, current scene. |
| `SDD.themes` | scenes.js | `{ SKY: THEMES, FG: FOREGROUNDS }` — exposed so the editor can preview parallax. |
| `SDD._draw*` / `SDD._paintDecorPiece` / `SDD.cyberDecor` | scenes.js | cyber painters exposed for the editors. |
| `SDD.editor` / `SDD.editorLib` / `SDD.applyFlappyHitboxNow` | editor.js | dev tool (unloaded in public build). |
| `SDD.runLives` | main.js/scenes.js | lives carried across stages within a run. |

**Late-binding rule:** nothing reads `SDD.X.Y` at top-level IIFE
eval time except where the dependency loaded earlier. Cross-module
calls happen inside functions (scene enter/update/render), by which
point everything is loaded. Editor/decor_editor guard their
`SDD._draw*` / `SDD.themes` reads with `if (…)` so they don't crash
if loaded out of order.

---

## 3. Scenes (17 registered)

`logo` (title card) → `menu` → `newgame`/`difficulty` → `overworld` →
`stageintro` → `level` → `results` → (`quiz` | `lesson`) → back to
overworld; plus `intro` (new-game cinematic), `finale` (game-complete
cinematic + unlock alert), `cityIntro` + `cityArrival` (Adventure City
open/close cinematics), `howto`, `options`, `gameover`. Dev: `editor`,
`decorEdit`.

Each scene = `{ enter(d), update(dt), render(ctx) }`. Main loop
(main.js) runs a 60 Hz fixed-step accumulator, `ctx.setTransform(3…)`
before render.

**After-stage routing (in `scenes.results` + `level.finish`):**
`finish()` → day 8 = cityArrival; day 7 = finale; else results.
`results` → last-stage-of-day + quiz exists + not passed = quiz;
else `scriptureFor(day,stage)` exists = lesson; else overworld.
`cityArrival` end → lesson (8-1) → menu.

---

## 4. Entity inventory (`SDD.ent`)

`Player, Walker, Wisp, Thrower, Orb, Blast, MovPlat, Core, ItemDrop,
TimePart, NPC, Checkpoint, Signature, SolarFlare, Meteor,
HazardSpawner, Crab, WaterJet, LavaPlume, HydrantJet, BubbleUp,
Octopus, Twister, ElectricEel, Stampede, LeafFall, LeafSpawner, Car,
CarSpawner`.

- **Player** keys most behaviour off `scene.day` (e.g. `day===8` →
  Computer sprite `compMode`, comp jump boost). Costumes (spacesuit/
  jetpack/swim/climb) swap per theme/level.
- **Car** (v0.91+): persistent **patrol** mob (`patrol:true`, `range`),
  `kind:'car'|'dump'`. Real-car physics: cruise→brake (sqrt decel)→
  stop→flip→accelerate. Visual decoupled from hitbox (`drawW/drawH`
  full sprite, `w/h` = 80% collision box, centered via `drawOX/OY`).
  Soft radial headlight beam.
- **HydrantJet** = blue LavaPlume clone (rise/hold/fall column).
- **Wisp `variant:'drone'`** = Adventure City sky drone (whizz-by beeps).
- **HazardSpawner kinds:** `flare, meteor, meteorH, lavaPlume,
  hydrantJet`.

Enemy theme→variant map lives in `level.loadLevel` (THEME_VARIANTS).

---

## 5. Spawn types (level data + editor palette)

`player, core, timepart, checkpoint, signature, walker, thrower,
crab, stampede, wisp, octopus, eel, skyhazard, twister, bubble,
leafstream, npc, item, car, dumptruck, hydrant, drone, carspawner`.

Each handled in `level.loadLevel`'s `if (s.type === …)` chain. The
editor's `SPAWN_GROUPS` + `spawnDefaults` + `SPAWN_FIELDS` mirror this.

---

## 6. Tile codes

Solid: `X` ground/dirt, `#` brick, `U` used-Q, `?`/`G`/`B` Q-blocks,
`C` **crumble** (v0.91 — breaks ~33 frames after the grounded player
stands on it; logic in `level.stepWorld`, painted inline in the tile
loop). One-way: `=`. Other render-only: `V` vine, `W` water, `~`
water-surface, `L` lava. Level data also carries `themeZones`
(multi-biome crossfade; `hard:true` = instant swap), `movers`,
`hint`, `startSign`, `towerEntrance`, `flappy*`, `underwater`.

---

## 7. Sprite system (PixelLab)

- `PL_MANIFEST` (sprites.js) maps **size** → anim → `{base, folder,
  frames, south/north/flat}`. Sizes: `big` (Danny), `small` (Danny),
  `rescue` (5 heroes, south idle), `comp2` (expressive Computer
  cutscene). Computer gameplay anims (`comp_idle/run/jump/die/warp`)
  live under `big`+`small`.
- `PL_BBOX` = measured non-transparent bbox per anim/dir; `PL_DISPLAY_H
  = { big:36, small:26, rescue:34, comp2:52 }` target render heights.
- `pixDraw(ctx, size, anim, dir, idx, cx, baselineY)` crops the bbox
  and scales to display height. `pixFrame`/`pixBBox` expose internals.
- **Pixel font** = `F` table in sprites.js (5×7 glyphs). Has digits,
  A-Z, and punctuation incl. `'` and (v1.0) `"`. Missing glyphs render
  as `?` — that's how we found the missing `"`.

---

## 8. Themes / parallax

`THEMES` registry (sky painters) + `FOREGROUNDS` (overlap layer, only
`cyber` registers one now). Biomes: `sky, sea-surface, rocky, forest,
sunlit, cosmic-night, bird-sky, seaside, savanna, village-dusk, eden,
bugscale, galactic, cyber, cyber-dawn, cyber-tunnel(-pass)`. The cyber
theme is the gold standard — see `ART_STYLE.md`. Notable per-biome
extras: Day 1-1 forming-galaxy spiral, Day 3-1 erupting volcano (far
layer 0.05 parallax).

---

## 9. Audio

Two paths, MP3 preferred: `loadFileTrack(id,path)` + `regPool(key,[ids])`.
38 MP3s in `assets/music/` (framing + per-level `_a/_b/_c` variants,
picked at random) + 3 Adventure City tracks under `assets/New Assets/
Adventure city Music/` (spaces → `encodeURI`). Chiptune `SONGS` is the
fallback **only when no file is registered or every variant 404s**
(v1.0.2 — never substitutes for a slow load). Independent music + sfx
gain buses; MP3 volume via `element.volume`. SFX are synthesized in
the `sfx(name)` switch (~46 cases incl. `typewriter_tick`,
`lesson_open/close`, `honk`, `drone_beep`, surface-aware steps).

---

## 10. Save (v4)

`localStorage['superDudeDanny.save.v3']` (key kept at v3; payload
versioned to 4). 3 slots (easy/medium/hard) each with progress +
`firstClear`/`secretCleared`. **Global** `options` (shared across
slots): `muted, musicVolume, sfxVolume, god(forced false),
secretUnlocked`. `data` is a live proxy onto the active slot. Forward
migration v1→v2→v3→v4 preserved.

---

## 11. GOTCHAS / discoveries (the painful ones — don't relearn)

1. **Editor drops custom level fields.** Saving `level_8_1.js` from the
   in-game editor only serializes `width/height/ground/tiles/spawns/
   movers/name/theme/themeZones`. It **silently drops** `hint`,
   `startSign`, `towerEntrance` — which drive the tower walk-in goal,
   start signpost, and hint banner. ALWAYS re-attach those 3 at the
   bottom of the file after an editor re-save. (Bit us twice.)
2. **Service-worker cache trap.** Once cached, the SW serves stale JS
   even after a push. Bump `SDD.VERSION` (main.js) + `CACHE_NAME`
   (service-worker.js) in lockstep every ship. Force-update a browser:
   DevTools → Application → Unregister SW + Clear site data.
3. **MP3 cold-load vs chiptune (v1.0.2 fix).** A too-eager timeout
   substituted the old synth music when MP3s were slow on the deployed
   site. Never gate MP3 playback on a wall-clock timeout; wait for
   `canplay`.
4. **title.png cold-load (v0.99 fix).** The logo scene used to bail to
   the menu if the PNG wasn't loaded in 0.5s → on Netlify it skipped
   the title + music. Wait for the image's real load/error, not a timer.
5. **Verification harness quirk.** Puppeteer tests must (a) cache-bust
   + unregister SW + clear caches, (b) freeze the RAF loop by setting
   `SDD.scene.stepWorld = SDD.scene.update = function(){}` before
   forcing a camera position — otherwise the loop re-follows the player
   and resets your screenshot framing. canvas + puppeteer live in
   `/tmp/node_modules`.
6. **Capacitor webDir.** Can't point at the repo root (would bundle
   `.git`, `node_modules`, `ios/`). `scripts/build-web.mjs` assembles a
   clean `www/` (the SAME bundle Netlify publishes). `www/` is
   gitignored + regenerated.
7. **PWA features die in an iframe.** Service worker + install + offline
   only work at a top-level URL. So Subsplash should **link to** the
   Netlify URL, not iframe-embed it, to keep "Add to Home Screen".
8. **iOS submission needs Xcode 15+ → macOS 13+.** Mark's macOS 12 caps
   at Xcode 14.2 which Apple no longer accepts. Build/test locally OK;
   submission blocked until macOS upgrade (or cloud build).
9. **`level_8_1.js` needs `movers: []`.** An early crash was a missing
   `movers` array (loadLevel reads `.length`). Editor output includes
   it; hand-written data must too.
10. **No-build invariant.** Plain `<script>` tags, ES5-ish `var`/
    `function`, runs from `file://` or any static host. Don't introduce
    `import`/`export` or a bundler — it would break the whole
    distribution model.

---

## 12. Directory structure (current, v1.0.2)

```
index.html  manifest.webmanifest  service-worker.js  privacy.html
netlify.toml  package.json  capacitor.config.json  .gitignore
CLAUDE.md  ART_STYLE.md  PLAN.md  README.md  IOS_BUILD.md
css/style.css
docs/        SCRIPTURE_LESSONS_SPEC.md  TECH_REFERENCE.md
js/          save, input, audio, sprites, engine, entities,
             level1 + level_2_1…8_1, cyber_decor_8_1, quiz_data,
             scripture_data, scenes, editor, decor_editor, main  (24)
scripts/     build-web.mjs            (web bundle assembler)
resources/   icon.png (1024) splash.png (2732)   (Capacitor source art)
tools/       make_icon.js  swim-bbox.html         (dev)
tests/       *.js  (puppeteer/static checks, dev-only)
test/        sprites.html  (standalone sprite preview)
assets/      ~809 files: music/ (38 mp3), New Assets/ (PixelLab sprite
             folders: Big/Small Danny + spacesuits, Computer Character
             + cutscene, Adventure Rescue Team, Adventure city Music,
             New Overworld.png), painted PNGs (title, lab, timemachine,
             level-6 bug bg), PWA icons.
```

Generated/ignored (not in git): `node_modules/`, `www/`, `ios/`,
`.claude/`.
