# 22 — Reference: Project Specifics (Super Dude Adventures)

## What this file is

A consolidated dump of **project-specific reference material** preserved from the first-half session's handoff: data shapes, theme map, signature catalog, enemy catalog, editor anatomy, level file format, repo snapshot.

Most of the other files in this folder are *general advice*. This file is *the actual project's data shapes*. Use it as:
- A worked example of how to organize a 2D platformer's data
- A reference if you're working on Super Dude Adventures specifically and need to know "what tile codes does this game use?"
- A template for similar games — copy the structure, replace the values

If you're starting a different game, **don't blindly copy these specifics.** Use them as inspiration. The patterns are what generalize; the values are project-specific.

---

## 1. Repo snapshot at first-half handoff (for historical accuracy)

**Branch:** `claude/super-dude-danny-platformer-Jftc7`

**Last commits at first-half handoff:**
- `db466a6` — Stages 1-1, 2-1, 2-2, 3-1, 3-2: import editor-exported level data
- `6f8818b` — Stages 4-1..6-1: import editor-exported level data (Mark's tuning pass)
- `38094e9` — Stages 6-2, 7-1: import editor-exported level data — final import batch
- `52dc85d` — Batch 1 of design pass: 4-2 gravity + kid-friendly signature hints
- `e331bf8` — Editor: STAGE tab with per-size flappy hitbox sliders
- `8058c5b` — Batch B — 6-1 enemies: lion redraw, unkillable predators, porcupine spike animation, new Stampede mob
- `9d01ba7` — Batch C — 6-2 BUG WORLD: scrap MANKIND, build bug-scale canopy stage
- `15a34d6` — 6-2: bark floor, branch-parallax sky, goliath beetle walker
- `a825a96` — 6-2: blur far/mid layers for bokeh depth
- `754e600` — 6-2: cohesive canopy scene, branches anchored to foliage

**Project state at end of second-half (now):**
- Current version: v1.0.23
- App name: "Super Dude Adventures" (was "Super Dude Danny")
- Bundle ID: `org.thecrossroads.superdudeadventures`
- 12 main stages + 1 secret level (Adventure City) all shipped
- App Store submission in progress (v1.0.20 submitted, v1.0.23 ready as next update)

**Files with bad naming you should avoid replicating:**
- `assets/Super Dude Danny Big Sprites/` (spaces)
- `assets/Super Dude Danny Small Sprites - /` (spaces + trailing dash)

---

## 2. The 12 stages — names, themes, and intended mood

| Day-Stage | Name | Theme key | Mood |
|---|---|---|---|
| 1-1 | LIGHT AND DARKNESS | galactic | Cosmic void, glassy obsidian platforms, starry parallax. Tutorial. |
| 2-1 | THE FIRMAMENT | sky | Bright cloud realm, soft pinks/blues, fluffy cloud platforms |
| 2-2 | THE WATERS BELOW | sea-surface | Surface of the ocean, blue gradients, crabs |
| 3-1 | FORMING LAND | rocky | Mountains rising from sea. Earth tones, lava plumes appear. |
| 3-2 | GARDEN PATH | forest | First plants. Vines + grapple mechanic. Greens dominate. |
| 4-1 | THE SUN | sunlit | Bright sky with sun flares. Sun-shield signature. |
| 4-2 | MOON & STARS | cosmic-night | Low gravity, deep navy with stars. Star-jump signature. |
| 5-1 | THE SKIES | bird-sky | Flappy-bird mode. Wings of Day. Cloud-glide signature. |
| 5-2 | THE SEAS | seaside | Underwater swim. Eels, octopus, crabs. Air-bubble signature. |
| 6-1 | WILD ANIMALS | savanna → forest → bugscale | Tri-zone stage. Lions + porcupines unkillable. Stampede mob. |
| 6-2 | BUG WORLD (was MANKIND) | bugscale | Bug-scale tree canopy. Goliath beetle walkers. Bees. |
| 7-1 | DAY OF REST | eden | Adam, Eve, deer, lion, dove. Cores rain on dove-blessing. |
| 8-1 | ADVENTURE CITY | cyber → cyber-tunnel → cyber-dawn | Secret bonus stage. Computer as player. Rescue team finale. |

---

## 3. Theme family map (the triple)

**Every theme needs all THREE legs.** Missing any one produces the "borrowed from another level" bug.

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
| `cyber` | (procedural) | `drawSky_cyber` | (special) | drone | (none placed) | (special) |
| `cyber-tunnel` | (procedural) | `drawSky_cyberTunnel` | (special) | (none placed) | (none placed) | (none placed) |
| `cyber-dawn` | (procedural) | `drawSky_cyberDawn` | (special) | drone | (none placed) | (special) |

**Code locations:**
- `THEME_VARIANTS` map (walker/wisp/thrower): `js/scenes.js` line ~2136
- `THEMES` map (sky painters): `js/scenes.js` line ~1975
- `THEME_FAMILY` map (tile family): `js/sprites.js` line ~2490
- `PLAT_VARS` map (mover platform variant): `js/scenes.js` line ~2280

**Adding a new theme:** must update ALL FOUR maps. Missing any one produces visual drift.

---

## 4. Signature catalog (per-stage power-ups)

Status reflects first-half's queued redesigns + what shipped in the second-half. Italic = redesign was queued at first-half; shipped behavior may differ.

| Kind | Label | Tip (shipped) | Behavior | First-half status | Final shipped state |
|---|---|---|---|---|---|
| `sunburst` | SUNBURST! | RUN INTO BAD GUYS TO ZAP THEM! | Player invincible (hurt returns false) | Good | Shipped as-is. Tip is technically misleading (says zap, actually invincibility) but kept for kid clarity |
| `cloudglide` | CLOUD GLIDE! | JUMP, THEN HOLD A TO FLOAT DOWN! | Float fall | Good | Shipped as-is |
| `pearl` | PEARL SHELL! | TAKES 1-2 EXTRA HITS! | Protective shell (1-hit protection) | *Queued: shell mechanic* | Shipped as shell (the queued redesign happened) |
| `coolingwater` | COOL WATER! | WALK RIGHT OVER LAVA — IT WON'T BURN! | Lava becomes walkable | *Queued: needs visual* | Shipped with particle effects |
| `vinegrapple` (renamed `leafshot`) | LEAF SHOT! | PRESS B BY A VINE TO SHOOT LEAVES! | Leaf projectile | *Queued: leaf-shooter* | Shipped as leaf-shooter (renamed) |
| `sunshield` | SUN SHIELD! | SUN FLARES BOUNCE RIGHT OFF YOU! | Sun-flare immunity | Good | Shipped as-is |
| `starjump` | STAR JUMP! | JUMP, THEN A AGAIN AND AGAIN IN THE AIR! | Multi-jump | Great | Shipped as-is |
| `wingburst` | (removed) | — | (removed) | *Queued: REMOVE* | REMOVED entirely |
| `airbubble` | AIR BUBBLE! | (visual bubble around Danny) | Sea creatures phase through underwater + visible bubble | *Queued: clarify* | Shipped with visible bubble around player |
| `callinghorn` | CALLING HORN! | ENEMIES FREEZE WHERE THEY STAND! | All enemies freeze (with desaturated visual tint) | *Queued: clarify* | Shipped with freeze + visual tint + 12s duration |
| `friendshiptoken` | (replaced) | — | (replaced by other Bug-World signatures) | *Queued: replace* | Replaced — Bug-World has friendly-bugs, pollen-trail, beetle-ride instead |
| `doveblessing` | DOVE BLESSING! | POWER CORES RAIN DOWN FROM THE SKY! | Cores rain | Perfect | Shipped as-is |

**New signatures added in second-half** (Bug-World era, replacing friendshiptoken):
- `friendlybugs` — bees + beetles phase through player
- `pollentrail` — cores magnet within 48 px
- `beetleride` — visible goliath beetle mount auto-stomps walkers

**Code locations:**
- Labels + tips: `SIG_LABELS` and `SIG_HINTS` in `js/scenes.js` ~line 2060
- Mechanics: `entities.js` (`Player.giveSignature`, `Player.hurt`) + `scenes.js` (collision loop, lava check)
- Durations: `Player.prototype.giveSignature` in `entities.js`, `DURATIONS` constant
- Pickup placement: per-stage `spawns` array, `{ type: "signature", tx, ty, kind: "..." }`

---

## 5. Enemy catalog

### Walkers (ground patrol)

| Variant | Used on theme | Stompable | Notes |
|---|---|---|---|
| (default shadow) | galactic | yes | |
| cloud | sky, bird-sky | yes | |
| clam | sea-surface, seaside | yes | |
| rock | rocky | yes | |
| leaf | forest, eden, village-dusk | yes | |
| flame | sunlit | yes | |
| lion | savanna (6-1) | **NO — unkillable** | |
| porcupine | savanna (6-1) | **NO — unkillable**, animated spines | |
| beetle | bugscale (6-2) | yes | Goliath |
| fruit | (placeholder) | yes | |

### Wisps (flying)

| Variant | Used on theme | Notes |
|---|---|---|
| (default shadow) | galactic | |
| bird | sky, bird-sky, savanna | |
| star | cosmic-night, sunlit | |
| jellyfish | seaside | |
| leaf | forest, eden | |
| bat | village-dusk | |
| smoke | rocky | |
| stormcloud | (shoot variant override) | When `shoots: true`, renders as stormcloud |
| bee | bugscale (6-2) | |
| drone | cyber (8-1) | Adventure City |

### Throwers (stationary)

- Variants: rain, rock, seed, sun, fruit
- Stompable: yes

### Special enemies (no walker base class)

- **Crab** (16×16) — sideways scuttle, stompable, used 2-2 + 5-2
- **Octopus** (8 arms) — underwater, **NOT stompable**
- **ElectricEel** — sits in socket on sea floor, rises periodically, used 5-2, **NOT stompable**
- **HazardSpawner** (skyhazard) — periodic projectile emitter (flares, meteors, lava plumes, hydrant jets)
- **BubbleUp** — vertical hazard for water levels
- **Twister** — sweeping tornado hazard
- **Stampede** — 8 tile × 1 tile wildebeest herd, patrols, hurts on touch, **NOT stompable**
- **Car** (Adventure City) — persistent patrol mob (kind: 'car' or 'dump'), hurts on touch, **NOT stompable**
- **HydrantJet** (Adventure City) — periodic vertical water column

---

## 6. Level file format (flat declarative)

```js
// Auto-generated by editor.js — safe to overwrite by saving from the editor.
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
    { type: "player",     tx: 3,   ty: 10 },
    { type: "core",       tx: 6,   ty: 9 },
    { type: "walker",     tx: 18,  ty: 10, variant: "lion" },
    { type: "timepart",   tx: 372, ty: 7 },
    { type: "signature",  tx: 50,  ty: 10, kind: "sunburst" },
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
  flappySmallHitbox: { dx: 2, w: 9,  h: 19 },
  flappyBigHitbox:   { dx: 0, w: 11, h: 26 },
  themeZones: [
    { startCol: 0,   theme: "savanna" },
    { startCol: 84,  theme: "forest" },
    { startCol: 162, theme: "bugscale" }
  ],
  // Render-only fields for Adventure City (re-attach manually if editor re-saves; editor drops them):
  hint: "AVOID THE CARS! REACH ADVENTURE TOWER >",
  startSign: { col: 9, label: "TOWER >" },
  towerEntrance: { col: 706, width: 16 }
};
SDD.level1 = SDD.levels['1-1'];  // legacy alias only for 1-1
```

**Tile string convention:**
- Each row is a string of single-character codes
- String length = `width`
- Spaces are air
- All other characters per the tile code table below

**Tile codes:**

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
| `G` | signature pickup spawn anchor | passable | (spawn comes from spawns array) |
| `B` | blast pickup brick | breakable | brick variant |
| `?` | grow brick | breakable | brick variant |
| `U` | used Q-block | solid | brick variant |
| `C` | crumbling road (Adventure City) | solid until stood on, then breaks | varies |

**Spawn types:**
- Player: `player`, `checkpoint`
- Pickups: `core`, `timepart`, `signature`, `item`
- Walking enemies: `walker`, `thrower`, `crab`, `stampede`
- Flying enemies: `wisp`, `octopus`, `eel`, `drone`
- Hazards: `skyhazard`, `twister`, `bubble`, `hydrant`, `car`, `dumptruck`, `carspawner`
- NPCs: `npc`
- Special: `leafstream` (Bug-World), `leafspawner`

**Variants** (theme-skinning):
- `walker.variant`: `lion`, `porcupine`, `beetle`, `leaf`, `rock`, `clam`, `flame`, `cloud`, `fruit`
- `wisp.variant`: `bird`, `star`, `jellyfish`, `leaf`, `bat`, `smoke`, `stormcloud`, `bee`, `drone`
- `thrower.variant`: `rain`, `rock`, `seed`, `sun`, `fruit`

**Signature kinds** (final shipped list):
`sunburst`, `cloudglide`, `pearl`, `coolingwater`, `leafshot` (was vinegrapple), `sunshield`, `starjump`, `airbubble`, `callinghorn`, `doveblessing`, `friendlybugs`, `pollentrail`, `beetleride`

**NPC kinds:**
`adam`, `eve`, `lion`, `deer`, `dove`, `computer`, `rescue_leader`, `rescue_scientist`, `rescue_engineer`, `rescue_pilot`

**Skyhazard kinds:**
`flare`, `meteor`, `meteorH`, `lavaPlume`, `hydrantJet`

---

## 7. Sprite frame size table

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
| Car | 33×15 (visual) | 26×12 (collision, 80% size) | feet at y+h |
| Dump truck | 50×21 (visual) | 40×17 (collision, 80% size) | feet at y+h |

**For the next project: put these in `src/config/sprite-dims.ts` as a single constants object.** Don't duplicate across `entities.js` and `sprites.js` as we did here.

---

## 8. Editor anatomy (`js/editor.js`)

**File length:** ~1700 lines at first-half handoff.

**Top-level structure:**
- IIFE wrapping
- Constants: `STAGE_NAMES`, `TILE_DEFS`, `SPAWN_GROUPS`, `SPAWN_FIELDS`, `FIELD_ENUMS`, `TOOL_DEFS`, `TILE_GROUPS`
- `buildUI(scene)` — constructs the DOM overlay
- `SDD.scenes.editor` — the scene object (enter/exit/update/render)
- Helpers: `refreshStatus`, `refreshVariantList`, `refreshUsageBadges`, `refreshTileHighlight`, `refreshSpawnHighlight`, `refreshProps`, etc.
- Serializer: `levelToJs(key, lvl)` — emits the flat declarative format
- Variant library functions

**DOM layout:**
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

**STAGE tab features:**
- Inputs for flappy small/big hitbox (dx, w, h)
- Hidden warning when not a flappy stage
- Live-updates running player via `SDD.applyFlappyHitboxNow`

**Removal for production builds (currently in place):**
- `<script src="js/editor.js"></script>` is commented out of `index.html`
- LEVEL EDITOR menu item is gated by `if (SDD.scenes.editor)`
- Source file still ships in the bundle (could be excluded from `scripts/build-web.mjs` INCLUDE list to slim the .ipa)

**Known editor bugs:**
1. **Save serializer drops custom level fields.** Only emits `width/height/ground/tiles/spawns/movers/name/theme/themeZones`. Drops `hint`, `startSign`, `towerEntrance` on Adventure City. **Manually re-attach these at the bottom of `level_8_1.js` after every editor re-save.**

---

## 9. The signature mechanics that changed between first-half and shipping

This is the historical record. The first-half session left these as "queued redesigns." The second-half shipped them.

| Signature | First-half status | Second-half shipped |
|---|---|---|
| `wingburst` | "REMOVE" | Removed entirely. Replaced with no signature on the stages that used it. |
| `pearl` | "→ protective shell" | Pearl Shell — takes 1-hit damage absorption |
| `coolingwater` | "needs visual" | Particle effects added, lava-walk works |
| `vinegrapple` | "→ leaf-shooter" | Renamed `leafshot`, fires leaf projectile via B button |
| `airbubble` | "clarify" | Visible bubble around player + sea-creature phase-through |
| `callinghorn` | "clarify" | All enemies freeze + desaturated visual + 12s duration |
| `friendshiptoken` | "replace" | Replaced with `friendlybugs`, `pollentrail`, `beetleride` for Bug-World |

---

## 10. Key code locations (so a new session can find things)

| What | Where |
|---|---|
| Engine constants (TILE, VIEW_W, gravity, etc.) | `js/engine.js` lines 7-16 (`SDD.C`) |
| Scene manager | `js/main.js` `SDD.setScene` |
| Player class | `js/entities.js` ~line 200 (`Player`) |
| Player signature handler | `js/entities.js` `Player.prototype.giveSignature` |
| Player hurt / collision response | `js/entities.js` `Player.prototype.hurt` |
| Level scene render | `js/scenes.js` ~line 6881 (`SDD.scenes.level`) |
| Level scene drawHUD | `js/scenes.js` ~line 7885 |
| Level scene drawPause | `js/scenes.js` ~line 8003 |
| Menu scene | `js/scenes.js` ~line 432 |
| AW badge (Adventure Week) | `js/scenes.js` ~line 140 (`drawAWBadge`) |
| Sky painters | `js/scenes.js` ~line 1180-6500 |
| THEMES dispatch table | `js/scenes.js` ~line 6679 |
| FOREGROUNDS dispatch table | `js/scenes.js` ~line 6696 |
| Sprite system | `js/sprites.js` |
| PixelLab integration | `js/sprites.js` ~line 2769 |
| Audio system | `js/audio.js` |
| Audio lazy loading + Range support | `js/audio.js` + `service-worker.js:rangeResponse()` |
| Save system | `js/save.js` |
| Input system | `js/input.js` |
| Editor | `js/editor.js` (commented out of index.html for production) |

---

## 11. What's in the `assets/` folder

```
assets/
├── README.txt
├── apple-touch-icon.png         (180×180, for iOS PWA)
├── icon-{192,512,512-maskable}.png  (PWA icons)
├── lab.png                      (painted lab backdrop for cinematics)
├── overworld.png                (legacy — replaced by New Assets/New Overworld.png)
├── timemachine.png              (intact time-machine sprite for cinematics)
├── timemachine_broken.png       (broken time-machine sprite for cinematics)
├── title.png                    (1672×941 painted title card)
├── level 6 bugs background.png  (painted canopy backdrop for Day 6-2)
├── music/                       (38 MP3 tracks: framing + per-level)
├── New Assets/
│   ├── Adventure city Music/    (3 MP3 tracks for Adventure City)
│   ├── Adventure Rescue Team/   (5 PixelLab sprite folders: Victoria, Nayah, Kevin, Carlos, Josh)
│   ├── Big Danny/               (PixelLab teaching/lecturing anims)
│   ├── Computer cutscene sprites/  (expressive Computer for cinematics)
│   ├── New Overworld.png        (overworld map)
│   └── ... (more PixelLab outputs)
├── Super Dude Danny Big Sprites/    ← (spaces in name — don't replicate)
└── Super Dude Danny Small Sprites - /  ← (spaces + trailing dash — definitely don't replicate)
```

**Sizes:**
- Pre-encode: ~130 MB total (38 stereo 192kbps MP3s)
- Post-encode (mono VBR ~96kbps): ~47 MB total

---

## How to use this reference

When you're working on Super Dude Adventures (or a similar project):
- Need to know what tile codes exist? → Section 6
- Need to add a new theme? → Section 3 (touch all four maps)
- Need to know what signature does what? → Section 4
- Need a sprite frame size? → Section 7
- Need to know what the editor can do? → Section 8
- Need to know where a function lives? → Section 10

When you're starting a new project:
- Use as a worked example of how to organize data
- Adapt the patterns; don't copy the specifics
- The "themes are a triple" lesson in Section 3 is the most generalizable

---

This file preserves the project specifics so they're not lost. The general advice lives in the other files in this folder.
