# PORTION CONTROL — Session Handover

> **New session? Read this file first, then `COMPENDIUM.md` (the full
> design doc — §1 Pillars, §2 Art, §3 Performance Bible are law).**
> This file is the living state: what is LOCKED, what is built, what
> is next. Update it every session (same ritual as the platformer's
> CLAUDE.md). The remote env is ephemeral — only pushes survive.

---

## WHERE WE ARE (latest first)

- **2026-07-21 — District 1 ENVIRONMENT art live (Mark: "make the
  levels highly cohesive").** PixelLab env batch (19 keys -> manifest
  now 43): asphalt ground (one 64x64 texture, 3x 32px crops), road
  decals (worn yellow paint, pothole), 6 food-litter flood decals,
  all 8 street props (lamppost/bench/hydrant/trashcan/newsbox/crate/
  car 64x64/sign). **Cohesion recipe (keep for districts 2-5):**
  ground graded dark - desaturate x0.55, brightness x0.62, 30% blend
  toward navy 0x2a2544 - so the swarm always pops (readability
  pillar); props muted cool + same chunky-outline style as sprites;
  litter decals stay warm (the outbreak reads on the street).
  gradeKeepAlpha() in the batch script preserves decal transparency.
  Verified in the portrait build: dressed street + 50-foe swarm,
  60fps, zero errors. Known polish knob: 32px tile seams show as a
  patchwork (VS-like, acceptable); if Mark wants it smoother, draw
  the full 64px texture per 2x2 tile block in ground.js.
- **2026-07-21 — PIXELLAB ART IS LIVE + portrait-first flip (Mark round 2).**
  (1) **PixelLab works**: the $0 USD balance was a red herring - the
  account bills by subscription GENERATIONS (usage returns
  `{type:'generations'}`); Mark confirmed plenty remain. Pipeline:
  `generate-image-pixflux` (API floor 32px, CEILING 64px - generate
  24px targets at 48 and 128px bosses at 64, integer nearest-scale to
  target) + `animate-with-text` (min 64px, reference image + action ->
  4 frames). Alpha cleaned at threshold 90. Batch scripts in
  scratchpad (`pl-batch-d1.py`).
  (2) **Full District 1 art set generated + wired** (24 keys in
  `assets/art/manifest.js`, atlas prefers them over placeholders):
  Danny 4-frame walk + 96px portrait, all 5 D1 enemies x2 walk frames,
  5 harmless-food stills, Big Frank boss x4. Chibi style matches the
  brief perfectly (goofy-cute-menacing, thick outlines).
  NOTE: PixelLab art keeps its native colors - the 16-color palette
  law now governs code-drawn FX/UI/readability channels (Cyan shots /
  Pink enemy shots / Lime XP / Red danger), not generated sprites.
  (3) **PORTRAIT-FIRST render (L3 rewritten)**: Mark scrapped
  widescreen - VS-mobile portrait is the target. Portrait locks
  logical WIDTH 270, height follows aspect (iPhone ~270x587,
  verified fills screen exactly); landscape/desktop locks height 270.
  (4) handart.js remains as the sub-manifest fallback layer.
  Verified: portrait fills iPhone viewport, real art renders in game +
  50-foe mixed swarm at 60fps, zero errors. **Next: M4 level-up
  cards** + remaining art (heroes 2-6, districts 2-5, FX/icons) in
  later batches.
- **2026-07-21 — M3 SHIPPED + Mark's round-1 notes all fixed.**
  (1) **True widescreen**: logical height stays 270, WIDTH now follows
  the device aspect (clamped 320-640; iPhone 17 ~19.5:9 -> 587 wide,
  canvas verified edge-to-edge, zero letterbox; re-fits live on
  rotation). L3 render lock revised accordingly. (2) **Music + SFX**:
  `systems/audio.js` - synthesized WebAudio (bouncy D1 loop ~136bpm +
  pop/shoot/gem/hurt/levelup/ui), voice-capped 8, pop rate-limited,
  gesture-unlocked, suspends when tab hidden. Mark can supply composed
  MP3 loops later. (3) **Danny is a real character**: hand-authored
  32px pixel maps in `src/handart.js` (white coat, grape tie, cyan
  goggle band, spiky hair, boots, Resizer arm ALWAYS extended) - 4
  walk frames + 96px portrait + fry enemy 2 frames + fry still.
  Handart layers UNDER the manifest override: PixelLab replaces
  file-by-file with zero code changes. (4) **M3 combat core**:
  `systems/weapons.js` (pooled bullets + Resizer auto-fire at nearest,
  Danny faces his target when idle), `systems/fx.js` (pooled pop puffs
  + harmless-food stills + muzzle), `systems/gems.js` (pooled gems,
  vacuum at 72px, VS merge at cap), game scene has HP + timestamp
  i-frames + 10Hz blink + camera shake, XP/level curve with LEVEL UP
  banner, kill counter, MM:SS timer, ambient spawner (interval tightens
  with time), death -> `scenes/results.js` (stats + tap to retry).
  (5) **Mobile dev button**: on-screen [SWARM] tap = the old T stress
  key. Verified headless: 7 auto-kills in 6s, gems drop, death ->
  results -> restart, 60fps, zero errors, iPhone-aspect fills window.
  **PIXELLAB: API key present but balance is $0.00 — Mark must top up
  at pixellab.ai, then batch-generate all art (Danny first; prompts in
  L5/COMPENDIUM 2.4).** Next: M4 level-up cards (3-card picks, Portion
  Blaster + Whisk Cyclone + 3 passives).
- **2026-07-21 — M1 + M2 SHIPPED: the feel + the framerate are proven.**
  M1: `systems/input.js` (WASD/arrows + floating touch joystick per
  COMPENDIUM 4, ghost ring, zero-latency read in update),
  `systems/ground.js` (endless district: 512px chunk RenderTextures
  pooled + rebaked from deterministic hashes - tiles/decals/flood/
  props), `scenes/game.js` (manual movement 190px/s instant
  accel/stop, 4-frame walk X-flip, idle frame 1, cam lerp 0.12).
  Verified: 189.7px per held second, flip + follow + touch vector all
  correct, 60fps, 0 errors. M2: `systems/spatialhash.js` (72px cells,
  reused buckets, zero-alloc rebuild) + `systems/enemies.js` (pooled
  swarm allocated at boot, no physics bodies, cull + shared 6fps
  flipbook, farthest-recycle at cap) + stress key T / ?stress=1.
  Verified at FULL 400 cap: canvas renderer 60fps, SwiftShader
  SOFTWARE-GPU WebGL 52fps (a real phone GPU is far faster - the
  55fps@300 mobile bar looks comfortable; final verdict on Mark's
  phone at M5). Swarm converges correctly, hash live (12 buckets),
  0 errors. **Next: M3 combat core** (Resizer Beam auto-fire, pooled
  bullets, hit flash, pop VFX + food still, gems + magnet + merge,
  HP, timestamp i-frames, death -> results).
- **2026-07-21 — M0 SHIPPED: asset pipeline + placeholders + atlas.**
  `src/config.js` (all locked numbers), `src/assets.js` (290-entry
  registry covering the whole 2.5 manifest + chunky placeholder
  painters with hash-varied faces + shelf-packed ONE-canvas runtime
  atlas, 1024x1024), `src/scenes/boot.js` (manifest-driven real-art
  override -> atlas -> M0 gallery with fps readout), `index.html`,
  vendored Phaser. Real art lands by dropping `assets/art/<key>.png`
  + one line in `assets/art/manifest.js` - zero code changes.
  Verified headless: boots clean, 290/290 frames packed, 0 page
  errors, gallery pages render at 60fps. **Next: M1 feel harness**
  (Danny walks: 4-frame flip anim, joystick + WASD, camera lerp,
  endless D1 ground). Then M2 perf harness before any gameplay.
- **2026-07-21 — Project opened. Spec locked (this file).**
  Branch cut from Jftc7 @ `73783a5`. v1 target: M0-M5 vertical slice,
  then STOP and evaluate with Mark before Districts 2-5.

## Branch truth

| Branch | Role |
|---|---|
| `claude/portion-control-vslice` | **THIS project. All Portion Control work here.** |
| `claude/super-dude-danny-platformer-Jftc7` | The live trilogy (platformer + Element Lab). Do not develop Portion Control there. Its CLAUDE.md map points here. |

Everything lives self-contained in `games/portion-control/` (own
vendored Phaser, own save keys, zero imports from the other games) —
the exact isolate-then-fold-in path THE ELEMENT LAB took for v2.0.

---

## LOCKED DECISIONS (Mark, 2026-07-21 — change only if he says so)

### L1. Product shape
- Kid-friendly **Vampire Survivors-style roguelite** per COMPENDIUM.
- **v1 target = the vertical slice, M0–M5**: fully playable District 1
  (City Center), Big Frank boss, rescue of hero #2. Evaluate before M6+.
- **Action + rescue story only — NO scripture/lesson layer** (unlike
  the platformer). Kid-safe tone rules still apply: no gore, enemies
  POP back into normal harmless food.
- Distribution destination: TBD (candidate: third menu door in Super
  Dude Adventures as update 3.0, like the Lab was for 2.0). Build
  self-contained so any path stays open.

### L2. Engine & files
- **Phaser 3.80.1**, vendored copy in `vendor/` (copied from the
  Element Lab's — same version, separate file, so this folder stays
  portable on its own).
- Plain script tags, no bundler (house style). One system per file:
  `src/scenes/*`, `src/systems/*`, `src/entities/*`, `src/data/*`.
- **`src/config.js` holds every number** from COMPENDIUM §5–§8 and
  §13 as named constants. Tuning never means hunting through logic.
- localStorage prefix: **`portioncontrol.*`** (platformer owns
  `superDudeDanny.*`, Lab owns `dannylab.*` — never collide).

### L3. Render lock (the Vampire Survivors feel)
- **Logical HEIGHT locked at 270; width follows device aspect**
  (clamp 320-640) so phones get edge-to-edge widescreen with no
  letterbox (Mark, round 1: "full widescreen on an iPhone 17" - that
  lands at ~587x270). `Scale.FIT` + live re-fit on rotation.
- `pixelArt: true`, `roundPixels: true`, devicePixelRatio capped at 2.
- **All art drawn at native pixel size, camera zoom 1.** A 32px Danny
  on a 270px-tall view ≈ VS's on-screen character scale; the view
  shows ~15×8.4 tiles of world — swarm-density readability like VS.
- Camera follows player with **lerp 0.12**. Instant accel/stop, no
  inertia. Sprite flips on X only. Input→motion visible next frame.
- Endless plane world (no walls, no obstacles, no collision geometry)
  — tiles + props are pure decor, per COMPENDIUM §2.6.
- Knob: if playtest feels cramped, widen logical view (e.g. 540×304)
  — sprite art does NOT change, only the camera sees more.

### L4. Art direction lock
- **The 16-color palette in COMPENDIUM §2.2 is absolute.** Every
  asset, placeholder, FX tint, and UI color comes from those 16 hex
  values (constant file in M0). The four readability laws: player
  shots Cyan, enemy shots Pink, XP Lime, danger Ketchup/Cherry —
  never violated by anything, ever.
- **Animation law (§2.1)**: enemies 2-frame walk @ ~6fps, players
  4-frame walk, bosses 4-frame; hurt = white tint flash 80ms; death =
  shared pop puff + 1-frame normal-food still; projectiles 1 frame
  rotated in code. No idle/attack/death frames for anyone.
- Canvas sizes + `category_district_name_anim_frame.png` naming per
  §2.3. One texture atlas for everything (§3.5).
- Look: flat top-down, chunky simple shapes, thick Ink outline, big
  goofy-cute-slightly-menacing faces, squash-and-stretch wobble.
  Charm from faces + motion + FX, never frame count.
- **Placeholder-first pipeline (M0)**: every asset exists on day one
  as a code-drawn colored shape with a face, at final size and final
  file name. Real PixelLab art replaces files one by one with zero
  code changes. The game is never blocked on art.

### L5. Character #1 — DANNY (locked; heroes 2–6 named later)
The star is **Super Dude Danny** himself — same scientist hero as the
platformer, translated to chunky top-down chibi:

- **Canvas 32×32**, body ~26px tall, chibi proportions ≈ 55% head /
  45% body. Thick Ink outline.
- **White lab coat** (`#f7f4ef` White) — his signature — over a
  **Grape** (`#45356e`) undershirt; **Steel** boots; **Cocoa** messy
  brown hair tuft.
- **Cyan goggles** (`#35d0ff`) — big round lenses with a Cloud glint,
  strapped up on his forehead (face stays readable). Palette §2.2
  literally reserves Cyan for "Resizer energy, Danny's goggles".
- Right hand: **the Resizer** — a small Steel/Grape ray-gun with a
  glowing Cyan energy bulb (his starting weapon in-fiction and
  in-game: Resizer Beam).
- Expression: goofy determined grin, Ink dot eyes — the scientist
  cheerfully cleaning up his own mess, sleeves rolled up.
- Anim: 4-frame walk (contact / down / pass / up), code 2px idle bob,
  X-flip for direction. Plus one 96px portrait (head + shoulders,
  same look, bigger grin).
- Stats per COMPENDIUM §6 row 1: 100 HP · 190 spd · Resizer Beam ·
  +10% XP gain.
- PixelLab prompt (subject + mandatory §2.4 style suffix):
  *"small chibi scientist hero, white lab coat over dark purple
  shirt, spiky brown hair, cyan goggles on forehead, holding a small
  ray-gun gadget with glowing cyan bulb, walking, flat top-down pixel
  art, chunky simple shapes, thick dark outline, 16-color limited
  palette, goofy cute slightly menacing cartoon face, kid-friendly,
  transparent background"*

Heroes 2–6: archetypes/stats/unlocks per COMPENDIUM §6 stand as-is
(Cook/Tech/Muscle/Scout/Medic); Mark supplies names + looks later.
Grep-friendly placeholder names stay until then.

### L6. Performance Bible = law
COMPENDIUM §3 in full: pool everything, no physics bodies on the
swarm, spatial hash 72px, hard caps (300 enemies mobile / 400 desktop,
400 player bullets, 240 enemy bullets, 600 gems w/ merge, 260 FX),
one atlas, dt-clamped movement, cull off-camera, cheap FX only, audio
pool ~8 voices, `damageBoss()` single path, timestamp i-frames.
Target: **≥55 fps at 300 enemies on a mid-range phone**, proven by
the M2 stress harness BEFORE gameplay is built. `fps · foes` readout
stays on through all of development.

---

## Milestone board

| M | What | Status |
|---|---|---|
| M0 | Palette consts + placeholder generator + atlas; boots 100% placeholder | **DONE** |
| M1 | Feel harness: Danny walk, joystick+WASD, camera, endless D1 ground | **DONE** |
| M2 | Perf harness: 300 pooled chasers + spatial hash + culling @ 55fps | **DONE** (headless; phone check at M5) |
| M3 | Combat core: Resizer Beam, pops, gems, HP, i-frames, results | **DONE** |
| M4 | Level-ups: XP curve, 3-card picks, +2 weapons +3 passives | **NEXT** |
| M5 | District 1 slice: full roster/timeline, Big Frank, Cook rescue | — |
| — | **EVALUATE WITH MARK** | — |
| M6–M9 | Meta shell → arsenal → districts 2–5 → polish | held |

## How to run / verify

- Static server from repo root (same as the trilogy):
  `python3 -m http.server 8000` → `localhost:8000/games/portion-control/`
  (index.html arrives with M0).
- Headless verification: playwright-core + the sandbox Chromium at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. **Inherited
  trilogy lesson: deny WebGL via an init script** (override
  `getContext` to return null for webgl) so Phaser uses Canvas —
  headless SwiftShader runs ~15fps and Phaser's smoothed clock crawls
  ~¼ speed, which makes timers look broken when they aren't. FPS
  numbers from headless runs are NOT the perf verdict; the M2 bar is
  judged on real hardware (Mark's phone) + relative headless deltas.

## Open questions for Mark

1. Names + looks for heroes 2–6 (Cook/Tech/Muscle/Scout/Medic).
   Candidate: the Adventure City rescue team (Victoria, Nayah, Kevin,
   Carlos, Josh) — his call.
2. Distribution destination (3.0 door in Super Dude Adventures vs
   standalone app vs PWA-only).
3. Who drives final art — Claude via PixelLab (like the Lab's atoms)
   or Mark supplying sprites. Placeholders make this deferrable.
4. Is "Portion Control" the final title?

## End-of-session ritual (same as the trilogy)

1. Refresh WHERE WE ARE + the milestone board.
2. Log any knob changes / decisions in LOCKED DECISIONS.
3. Commit `Handover: <one line>` and push
   `git push -u origin claude/portion-control-vslice`.
