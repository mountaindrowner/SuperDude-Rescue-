# Super Dude Danny — Session Handover

> **If you're a new Claude Code session reading this for the first time:**
> read this whole file before touching anything. It is the durable
> handover between sessions. The remote execution env is ephemeral —
> only what's pushed to GitHub survives a crash. Update this file as
> major work lands.

---

## WHERE WE ARE RIGHT NOW (latest first — read this first)

- **Active branch**: `claude/super-dude-danny-platformer-Jftc7` (always work here)
- **Live build**: `v0.93` / `sdd-shell-v93`.

### v0.93 — Adventure City feel tuning (latest)

Four scoped numeric changes (verified via puppeteer):
- **Computer jump apex +15% (Day 8 ONLY).** New `compJump` multiplier
  (`level.day === 8 ? 1.0724 : 1.0`) folded into the ground-jump impulse
  at `entities.js:530`. Apex scales with v² so √1.15 ≈ 1.0724 gives a
  true +15% peak. Day-8 launch vy = -6.97 vs base -6.5; Danny on every
  other day is untouched (global `C.JUMP_*` constants unchanged).
- **Car + dump-truck hitbox −20%, visual unchanged.** `Car` now stores
  the full sprite size in `drawW/drawH` and sets the collision box
  `this.w/this.h` to 80% (car 33×15→26×12, dump 50×21→40×17), centered
  inside the sprite via `drawOX/drawOY` + an `x/y` shift at construct.
  `Car.prototype.draw` renders `drawW/drawH` at the offset so the look
  is identical; collision (`E.overlap` reads w/h) is more forgiving.
- **Dump truck speed −30%:** default spd 0.85 → 0.595 (dump branch only).
- **Dump truck path +25% each side:** the two seeded trucks in
  `level_8_1.js` go `range` 64→80 and 80→100.
- **Crumble tile 50% faster:** thresholds in `scenes.js` /1.5 — warning
  28→19, collapse 50→33, draw ratio divisor 50→33 (~0.55s grace).

### v0.92 — Portrait play + volcano on 3-1 + galaxy spiral on 1-1 (latest)

- **Portrait/landscape both playable.** Deleted the
  `@media (orientation: portrait)` block from `css/style.css` that
  was overlaying a "TURN YOUR PHONE SIDEWAYS" prompt on touch devices.
  Game now letterboxes the 16:9 canvas inside whatever the viewport is
  (portrait fits the canvas to width, leaves dead space above + below
  for the touch controls; landscape unchanged).
- **Day 3-1 "Forming Land" got the depth treatment.** Rewrote
  `drawSky_rocky`:
  - 5-stop atmospheric sky gradient (warm magma → smoky horizon).
  - New `_drawVolcano(g, cx, baseY, t)` painter draws a 92×58 cone in
    the FAR layer (parallax 0.05) with crater rim, glowing lava lake
    (pulsing), lava trickle on the left flank, erosion ridges,
    rising layered smoke plume (12 puffs that scale up + fade to
    dark as they rise), and arcing glowing lava flecks ejecting
    from the crater.
  - 3 jagged mountain ridges instead of 2 (far/mid/near at 0.08 /
    0.16 / 0.30 parallax) for proper layered depth.
  - Volumetric warm low-fog band above the horizon + drifting ash
    particles + heat-shimmer dust motes.
- **Day 1-1 "Light & Darkness" got a forming galaxy.** New
  `_drawGalaxySpiral(g, camx, t)` painter called from
  `drawSkyGalactic`. Slowly-rotating logarithmic-spiral (r = a·e^(b·θ))
  with two main arms of star particles colored warm→cool from core
  to rim, bright golden core with radial bloom, faint dust lane
  between arms, flattened elliptical disc rim, and 18 satellite
  stars orbiting the disc. Reads as a galaxy mid-formation - on-theme
  for Day 1 of creation.

### v0.91 — Cars become patrol mobs + new hazards (dump truck, hydrant, drone, crumble tile, cat) (latest)

- **Cars are now persistent patrol mobs.** Mark: "lets instead make
  them like normal mobs, that go back and forth on a path." `Car`
  class gains `patrol: true` + `range` (default 96 world-px each side).
  Bounces between `minX` and `maxX`. The legacy `carspawner` spawn
  entries are converted at level-load into single patrol cars at
  their marker (keeps Mark's editor-saved layout working without
  re-editing). New `car` spawn type also uses patrol mode.
- **Dump truck.** `Car kind: 'dump'` → 50×21 box, slower (0.85 spd),
  amber color, boxy cab with windshield + headlights + warning
  stripes, tilted load bed with cargo pile, dual rear wheels. New
  spawn type `dumptruck`. Same patrol behaviour as the car.
- **Fire hydrant.** New `HydrantJet` projectile (blue-cyan column,
  mirrors `LavaPlume` rise/hold/fall timing) + a new
  `HazardSpawner.kind = 'hydrantJet'` branch that paints the red
  hydrant base on the road + periodically launches the jet. New
  spawn type `hydrant` with `period` field. Hydrant jet is a
  persistent damaging column - touching it hurts (added to the
  projectile-collision branch alongside LavaPlume).
- **Sky drones.** New `Wisp variant: 'drone'` with a procedural
  14×14 hover-pod sprite (cyan canopy, twin underside thrusters,
  side fins, top strobe LED, tiny antenna). Reuses the Wisp float +
  stomp logic so they behave like cyber birds. New spawn type
  `drone`.
- **Crumbling road tile.** New tile code `'C'`. Added to engine
  `SOLID` map so the player can stand on it. Crumble logic lives in
  `level.stepWorld`: when the grounded player overlaps a 'C' tile
  at their feet column, that tile's timer in `level.crumblers`
  advances; at t=28 plays a `block` warning sfx + shake; at t≥50
  the tile becomes empty + emits a debris burst. Painted directly
  in the tile loop with progressive shake + warning glow.
- **Cat sprite at the start.** Procedural orange tabby pixel cat
  sitting at world col 13 (just right of the TOWER > sign) on the
  sidewalk. Idle breathing + tail swish + occasional blink. Painted
  via `_cyDrawCityCat` called from the level render whenever
  `this.theme === 'cyber'`. Cosmetic only - not an entity, no
  collision.
- **Editor palette updated:** crumble tile in the HAZARDS tile
  group; `car / dumptruck / hydrant / drone / carspawner` in the
  Adventure City spawn group with friendly defaults +
  `wisp.variant: 'drone'` enum entry.
- Seed placements in `level_8_1.js` (Mark can move/delete via
  editor): 2 dump trucks, 3 hydrants, 5 drones, and 15 'C' road
  tiles in three short spans (col 200, 400, 620).

### v0.90 — Mark's editor level + car spawn fix + ending floor/music (latest)

- **Day 8-1 replaced with Mark's editor-saved layout.** New tile
  layout / spawn placement / 20 car spawners / 3 checkpoints, saved
  from the in-game editor. NOTE: the editor serializer only emits
  `width/height/ground/tiles/spawns/movers/name/theme/themeZones`,
  so the three render-only custom fields (`hint`, `startSign`,
  `towerEntrance`) were re-attached by hand at the bottom of
  `level_8_1.js` after the paste — without them the tower walk-in
  goal + start signpost + hint banner don't render. If you re-save
  from the editor again, re-add those three fields.
- **Car spawners now emit AT the marker, only while on-screen**
  (Mark: "cars spawn on the player screen not where I placed the
  spawner... too many near the end, they all spawn really fast").
  `CarSpawner.update` rewritten: a spawner only ticks its period
  while its world x is within ~the viewport (camx-40 .. camx+360);
  off-screen it resets `t=0`. The car is created at the spawner's
  own `(this.x, this.y)` instead of the camera-relative screen edge.
  Fixes the end-of-map barrage (previously every spawner that
  scrolled into a wide +720px forward band instantly dumped a car)
  and makes editor placement meaningful. Telegraph (warnT honk +
  flash) still warns before the sweep.
- **Closing cinematic uses the opening theme.** `cityArrival.enter`
  now `startMusic('intro')` (was 'finale') so the ending bookends
  with Super Dude Danny's new-game opening track.
- **Rescue HQ floor.** `_floor` rewritten from a 1px line into a
  SOLID floor plane from CY_FLOOR(120) down with a lit wall/floor
  seam + receding seams (Mark: "they seem like they're floating").
  Added fixed contact-shadow ellipses under each hero + the Computer
  so they're grounded even while the sprites bob.

### v0.89 — Dialog polish + Computer audio (latest)

- **Name tags no longer crop the glyphs.** Tag height bumped 9→11 px
  (inner panel 7→9 px) so all 7 rows of pixel-font glyphs sit cleanly
  inside without the bottom row being eaten by the accent border
  (Mark: "names are too big and don't fit, they end up cropped").
  Applied to both cityArrival hero dialogue + cityIntro Computer
  dialogue.
- **Mobile dialog box shrinks to avoid the touch buttons.** When
  `body.touch` class is on, `boxW` drops from 308 → 218 so the box
  ends well before the A/B touch buttons on the right side of the
  viewport. Dialogue text re-wraps to the narrower width via
  `_cyWrap(line.text, maxChars)` computed from the live boxW. Desktop
  view unchanged.
- **Computer teleport-in sound.** New `warpin` SFX in audio.js -
  layered ~0.9s sound: rising sawtooth/triangle hum (220/110 Hz with
  glide), high sine shimmer arpeggio at 1320/1760/2080/2640/2200 Hz,
  three noise crackle bursts at 0.00/0.18/0.42s, settling triangle
  tone at 880/660 Hz. Replaces the old single `power` call on warpT=1.
- **Computer walking sounds.** New `step_computer` SFX (square click
  at 620 Hz + 380 Hz glide + brief noise + low-triangle thunk at 180 Hz)
  and matching `land_computer`. Added `'cyber': 'computer'` to the
  `THEME_SURFACE` map in entities.js so Adventure City auto-uses them
  during normal Player.update. Also tick a `step_computer` every 14
  prologue frames while the Computer walks in during the cityIntro
  cold-open.

### v0.88 — Tower walk-in (Layer-1+3 combo) + solid tunnel interior

- **Tower entrance is now walk-in-able.** Mark: "transition into the
  adventure tower should be a combo of layer 1 and 3 so I walk in.
  But right now I hit a wall walking straight." Two fixes together:
  1. **Level data**: the solid-tile plinth at cols 706-717 (row 10
     `placeSolid` + the dirt extensions on rows 12-13) is removed in
     `level_8_1.js`, so the player walks flat all the way into the
     door without bumping into a raised step.
  2. **Painter split**: `_cyDrawTowerEntrance` is split into a
     `_Bg` pass (Layer-3 depth: facade body + windows + signage +
     spire + recessed door **cavity** with warm lobby glow + tiled
     foyer floor) painted BEFORE entities, and a `_Fg` pass (Layer-1
     depth: door pillars/jambs + lintel with rivets + keystone +
     threshold step + overhead awning lamps) painted AFTER the
     foreground silhouettes. Net result: the player walks toward the
     door, sees the lit lobby behind them, gets framed by the
     foreground pillars, touches the timepart inside the cavity,
     fade-to-black, cityArrival cutscene. Editor mirrors the same
     split via `SDD._drawTowerEntranceBg/Fg`.
- **Tunnel interior is no longer transparent.** Mark: "tunnel
  background is transparent, let's make it solid color and not see
  through." Swapped the multiply-darken pass for an OPAQUE dark
  navy gradient fill across the tunnel range. The cyber-city
  parallax behind is now fully hidden — the tunnel reads as a
  sealed concrete interior, with structural detail (pillars, deck
  skirt, lamps, signs, ceiling girders) popping cleanly against the
  solid background. Pre/post-tunnel zones unchanged.

### v0.87 — Post-tunnel foreground stripped + time machine vanishes

- **Layer-1 (foreground) removed after the tunnel** (Mark: "remove
  first layer pieces after the tunnel"). Dropped the `cyber-dawn`
  entry from the FOREGROUNDS dispatch in scenes.js so the dawn city
  range (cols 440-720) renders only its parallax bg + bridge layer
  — no Layer-1 anchor towers overlapping the player. Pre-tunnel
  cyber section keeps its full foreground. The cityArrival cutscene
  paints its own backdrop so it isn't affected.
- **Broken time machine no longer stays behind in the cinematic**
  (Mark: "it's not supposed to stay behind"). The machine took
  Danny with it — both gone. Replaced the `ART_MACHINE_BROKEN`
  draw (in BOTH the cityIntro prologue's post-flash render and the
  dialogue scene's lab backdrop) with a residual scorch mark on the
  floor + a handful of charred bolts + lingering smoke + low
  electric sparks at the empty spot. Reads as "the machine was
  HERE and zapped away with Danny".

### v0.86 — Layered editor preview + new SD app icon

- **Editor now renders the full layer stack** (Mark: "all 5 layers
  visible, especially for 8-1"). New `_paintLayersBg` paints the
  parallax sky + tunnel overlay BEFORE the editor's zoom transform;
  `_paintLayersFg` paints the foreground silhouettes + tower entrance
  + start sign AFTER tiles + spawn markers, so the z-order in the
  editor matches the in-game render. Multi-zone levels (Day 6-1 plains
  → forest → bugscale; Day 8-1 cyber → tunnel → cyber-dawn) honor
  `themeZones` exactly like the level scene does, including the
  hard-swap flag. Adds a `showLayers` flag default-on with **L key**
  to toggle. New exports: `SDD.themes = { SKY: THEMES, FG: FOREGROUNDS }`,
  `SDD._drawTowerEntrance`, `SDD._drawStartSign`. Verified across
  Adventure City (start / city / pre-tunnel / 3× tunnel cams / dawn /
  tower) and Day 3-2 Jungle Path (forest backdrop now visible in
  editor). Note: bg paints at native 320×180 — perfect alignment at
  zoom=1, informative-only at other zoom levels.
- **New app icon.** Replaced the Crossroads/Adventure-Week branded
  icon with a Super Dude Danny badge: deep-navy circle with subtle
  starfield, 12 golden sunburst rays, big beveled italic **SD**
  monogram (same hero-font style as the AW emblem), cyan ring border,
  warm orange aura behind the letters, "SUPER DUDE DANNY" wordmark
  strip at the bottom. 4 PNGs generated procedurally via
  `tools/make_icon.js` (canvas module): `icon-192`, `icon-512`,
  `apple-touch-icon` (180×180), `icon-512-maskable` (no wordmark,
  generous safe-zone for OS masking).

### v0.85 — Adventure City: 2x length, immersive tunnel, futuristic cars, tower entrance

Big polish + scope pass on Day 8-1 driven by Mark's feedback:

- **Stage doubled to 720 cols** (was 360). `level_8_1.js` rewritten
  around three acts: cyber city 0-250, big tunnel 250-440, cyber-dawn
  city + tower approach 440-720. `mapW = 11520` (was 5760). New
  checkpoint at col 460 (post-tunnel) in addition to the mid-stage
  one. Car spawners scaled out across the whole length.
- **EXPANDED TUNNEL with above + below platforming.** Tunnel range
  cols 250-440 (190 wide vs. the old 50). Multi-deck design:
  - Lower street (row 11) with pits and ground cars
  - Walkable UPPER DECK on row 6 (one-way `=` tiles) with strategic
    gaps so jumping between deck islands is required
  - Mid parkour platforms (row 8) bridging street → deck
  - Two upper-deck car lanes inside the tunnel (cars driving ON
    the overpass)
  - Bonus core line along the upper deck
  - Second signature pickup (`sunshield`) on the dawn-side deck
  - `_cyDrawTunnelOverlay` rewritten: heavy interior multiply-darken
    (deep navy across the visible tunnel range), warm lamp halos
    every 64 world-px, hanging directional signs every 128 px,
    ceiling girders + ceiling lamps every 96 px, portal walls at
    entrance + exit, pillars every 64 px from skirt → street.
    Result: the tunnel feels like an enclosed *room* you traverse
    instead of an outdoor passing overpass. Skirt at world y 112-128
    so the painted under-deck reads beneath the row-6 `=` tiles.
  - Hard background swap to cyber-dawn at the midpoint (T_DAWN
    = col 345) preserved.
- **Cars: 50% bigger, 25% slower, more futuristic.** `Car` defaults
  in entities.js: `w 22→33, h 10→15, spd 1.65 base`; spawner base
  `1.125` per laneRow. Hover drone reskinned with twin underside
  thrusters + side fins + antenna. Ground/sky coupe re-detailed:
  neon underglow strip, aerodynamic canopy with directional glare
  streak, LED headlight bar + red taillight strip, side vent slats,
  dual rear thruster ports with warm glow, wider wheel arches with
  rim highlights, occasional motion-line speed lines at full speed.
- **Tower entrance instead of rescue NPCs at the goal.** New
  `_cyDrawTowerEntrance` painter renders a tall facade at world cols
  706-722: pinstripe pillars, lit-window grid (warm yellow + cyan
  mix), arched double doors with pulsing warm-glow halo, ADVENTURE
  TOWER signage panel above the doors, parapet spire + crown ledge.
  Drawn AFTER the foreground layer so it isn't occluded. Level data:
  new `towerEntrance: { col: 706, width: 16 }` field; old rescue
  NPC spawns deleted; only the `timepart` at col 712 remains.
- **Win = fade to black for day 8.** Adventure City's `state === 'won'`
  branch now ramps a black overlay (winTimer/110) instead of the
  yellow "DAY 8-1 COMPLETE!" banner, so the walk-into-the-tower
  reads as a cinematic cut into the cityArrival cutscene. Other
  levels keep the celebratory banner.
- **Computer sprite scaled 1.25x in cinematics + warp-in.** In
  the `cityIntro` prologue (run-in + arrived poses) and the level
  warp-in, the pixDraw call is wrapped in a scale-around-baseline
  context transform so the Computer reads larger against the lab /
  city backdrops.
- Verified via puppeteer with cache-bust + frozen world (set
  `stepWorld = update = noop` so the RAF loop doesn't reset the
  forced camera position before screenshot). Captured prologue beats,
  warp-in stages, all stage cams (start → pretun → 4× tunnel views
  → post → tower entrance close-up), car showcase inside the tunnel,
  and the fade-to-black on win. Zero page errors.

### v0.84 — Adventure City intro teleport + level warp-in

Mark's note: the opening cinematic should begin *as Super Dude Danny
teleports away with the time machine*, then the Computer walks in; and
when the level starts, the Computer should *warp in* with his warp
animation before play begins. Both done:

- **`cityIntro` prologue** (new `phase: 'prologue'` before the dialogue
  beats, in scenes.js): silent auto-advancing cold-open. Danny stands at
  the **intact** time machine (`ART_MACHINE`) in the lab; the machine's
  dome glow + electric arcs build (`charge` ramp), a white teleport
  flash peaks at `PRO_FLASH` (118) — Danny + intact machine vanish, the
  machine swaps to `ART_MACHINE_BROKEN` + smoke. Then the Computer walks
  in from the left edge (`comp_run`) at `PRO_WALK` (150) and settles
  centre-stage in `comp2 'concerned'` with a startled "!" at
  `PRO_WALKEND` (244). Auto-advances into the existing 6-beat dialogue at
  `PRO_END` (268); **A skips** the prologue. New `_renderProlog(g)` on
  the scene; timeline consts `PRO_FLASH/PRO_WALK/PRO_WALKEND/PRO_END`.
- **Level warp-in** (Day 8 only, in `scenes.level`): new
  `state: 'warpin'` set at the end of `loadLevel()` when `day === 8 &&
  !lastCheckpoint` (so death-respawns onto a checkpoint don't replay
  it). World is frozen — `update()` returns before `stepWorld()` so the
  clock + enemies wait. The render draws the 16-frame `comp_warp` sprite
  (size `big`, south, already in PL_MANIFEST/PL_BBOX) over a fading
  cyan energy pool at the spawn point instead of the normal player.
  `power` SFX on entry; `warpTotal = 16*5 = 80` steps; A skips after 8
  steps. On finish → `state = 'play'` and the normal player draw resumes
  (compMode → comp_idle).
- Verified via puppeteer: prologue beats (danny→charge→flash→wreck→
  walk→arrived) + warp-in (start→mid→end) all render, 0 page errors.

### Adventure City (Day 8-1) — current state as of v0.83 (read this)

Massive iteration arc on the secret stage. Key facts for the next session:

- **Menu access**: `ADVENTURE CITY (TEST)` is shown unconditionally
  (TEMP — the `firstClear` gate is removed in scenes.js menu; restore
  before ship). It routes to `cityIntro` (opening cinematic) →
  `level 8-1` → reach the Tower → `cityArrival` (ending cinematic) →
  menu. `DECOR EDITOR (TEST)` also on the menu.
- **Player character on 8-1**: the **Computer** (CRT-headed robot)
  replaces Danny — `compMode` in `entities.js` Player.draw keys on
  `scene.day === 8`, mapping every state to `comp_idle/run/jump/die`
  (registered in `sprites.js` PL_MANIFEST under size `big`). Danny is
  untouched elsewhere.
- **Cyber theme art** (`scenes.js`): fully procedural 5-layer parallax
  (`_cyPaint*` painters cached in `_cyBuild`), atmospheric DOF blur on
  far/mid/bridge, per-layer saturation, `_cyDrawShaders` lighting pass.
  Tunnel = Layer-3 concrete overpass (`_cyDrawTunnelOverlay`) at cols
  150-200 with a HARD theme swap cyber→cyber-dawn at the midpoint
  (themeZones `hard:true`). Road tiles are asphalt (`paintRoad*_cyber`).
  Sky stops + the whole look were tuned heavily to Mark's feedback —
  see ART_STYLE.md.
- **Decor system**: `SDD.cyberDecor['8-1']` (data file
  `js/cyber_decor_8_1.js`) drawn by `_cyDrawDecor` on Layer 1; edited
  in-game via `js/decor_editor.js` (scene `decorEdit`) which has a
  thumbnail CATALOG side panel. `_CY_DECOR=false` flag hides the old
  procedural Layer-1 clutter (Mark wanted buildings-only).
- **Music**: 3 tracks wired as the `level_8_1` pool in `audio.js`
  (`assets/New Assets/Adventure city Music/*.mp3`).
- **Two cinematics** (both in scenes.js, visual-novel style: top
  banner + speaker portrait + typewriter dialogue + name tag):
  - `cityIntro` (OPENING): Computer alone in the wrecked lab, panics,
    decides to find the rescue team. Uses expressive **comp2** sprites
    (`assets/New Assets/Computer cutscene sprites/.../animations`:
    talk/concerned/alert/scared, registered as size `comp2`). Backdrop
    = ART_LAB + ART_MACHINE_BROKEN + smoke/sparks.
  - `cityArrival` (ENDING): Computer runs into the Tower, then briefs
    the **5 rescue heroes** (Victoria, Nayah, Kevin [lead], Carlos,
    Josh — real sprites, size `rescue` in sprites.js, idle-only,
    south-facing) standing on the RIGHT; Computer on the LEFT. The
    `AW` crest emblem (`_cyDrawAWEmblem`, stylized italic hero font;
    "Adventure Awaits") sits on the HQ wall. Ends → menu.
- **OPEN for Mark**: he may refine the dialogue lines (current copy is
  a lighthearted first pass), add per-hero animations (heroes are
  idle-only now), and provide more cutscene art. The scripts live in
  `INTRO_DIALOG` + `CITY_DIALOG` in scenes.js — easy to rewrite.
- **Banked idea** (roadmap item 7): post-stage scripture mini-lessons.

- **Latest landed (v0.55) — Day 8-1 Adventure City secret stage:**
  - **New theme `cyber`** with 4-layer parallax (`drawSky_cyber` for
    far/mid/bridge + new `drawForeground_cyber` hook that draws AFTER
    entities for the overlapping-foreground layer). Procedural
    placeholders for all 4 layers render until Mark drops the painted
    PNGs into `assets/city/` (`far_skyline.png`, `mid_city.png`,
    `bridge.png`, `foreground.png`). New `FOREGROUNDS` registry in
    scenes.js mirrors the THEMES dispatch.
  - **New `Car` + `CarSpawner` entities** in entities.js: 30-frame
    telegraph (honk + flashing yellow outline), then deadly
    contact-kill sweep at ~2.2 px/frame. Unkillable + non-stompable
    (Stampede pattern). Spawner only emits when its anchor is within
    400 px of camera; cars self-cull when they sweep past the camera
    edge so the active count stays bounded on a long stage.
  - **Save v4**: per-slot `firstClear` + `secretCleared` flags.
    Storage key kept at v3 (additive change, `reconstruct()` defaults
    the new fields to false for older payloads). `firstClear` flips
    when the finale exits; `secretCleared` flips when cityArrival
    exits.
  - **Menu**: `ADVENTURE CITY` entry appears between HOW TO PLAY and
    LEVEL EDITOR once `firstClear` is true on the active slot.
    Selecting it dispatches `setScene('level', { day: 8, stage: 1 })`
    — bypasses the overworld so the 7-days-of-creation arc stays
    clean.
  - **`level_8_1.js`**: 360-tile street + sparse parkour platforms +
    3 lanes of cars (ground / low-sky flyover / high-sky drones) +
    midstage signature pickup + rescue-team NPCs near the goal +
    Towers `timepart` at column 357 + checkpoint at midpoint.
  - **New `cityArrival` scene**: 3-beat finale-style cutscene at the
    end of 8-1 (arrival / rescue greet / hero send-off). Reuses
    `drawSky_cyber` as backdrop; rescue-team placeholder NPCs +
    Danny celebrate animation.
  - **New `NPC_META` entries**: `computer`, `rescue_leader`,
    `rescue_scientist`, `rescue_engineer`, `rescue_pilot`. Procedural
    placeholder sprites (`paintNPC_computer`, `paintRescuer`) keep
    them visible until Mark provides real PNG frames.
  - **Service worker**: precache adds `level_8_1.js`, the 4 city PNG
    paths (will 404 + skip until Mark adds the files), and the
    previously-missing `level 6 bugs background.png`.
- **Latest work — Final-round playthrough polish (6 waves, all shipped):**
  - **W1 sprites**: fixed the old-procedural-sprite-on-victory bug
    (small Danny had no `dance` anim → pixDraw miss → legacy sprite;
    now small always celebrates + the fallback is idle frames, never
    the old art). Menu Danny reverted to static idle (rotation was
    "too chaotic"). Re-measured spacesuit/jetpack bboxes from the real
    PNGs (backpack/helmet were clipped). Added `PL_ANCHOR_DX` to align
    big run/jump with idle.
  - **W2 signatures/enemies**: cooling-water → **FLAME DASH** (+40%
    run speed + flame trail; kept lava-plume immunity; dropped the
    broken lava-walk). Air-bubble tip reworded. Eel head rounded (no
    square tip). Clam lowered 2px. 4-2 got a 2nd starjump above the
    checkpoint. Grow "globe" at start of 5-1 + 5-2 (new hovering
    `item` spawn type). 6-1 water-pits: stronger paddle so spamming
    jump climbs out (5-2 untouched).
  - **W3 audio**: separate **MUSIC + SFX** volume buses + OPTIONS
    sliders (defaults music 0.5 / sfx 0.85); de-click the music stop
    (fade before pause) to kill the pop on level finish.
  - **W4 overworld**: 3rd-tile waves/water nudged up; added birds on
    the clouds tile, bugs on desert, twinkles on night-sky.
  - **W5 UI**: quip bar + sig icon raised ~6px; F-key blast; level
    hint banners (3-2 vines, 5-1 fly); 20-cores quip; 3-2 renamed
    **JUNGLE PATH**; 7-1 Adam line → "I NAMED THAT DEER STEVE!"; quiz
    question bank expanded to random pools (+~11 ESV Genesis Qs, *Mark
    to review wording* in `quiz_data.js`); quiz teacher uses one pose
    + celebrate on pass.
  - **W6**: 7-1 deer walk / doves float (bounded wander).
- **Open (Mark's tasks, NOT done here)**: compose music for 6-1 +
  a new 6-2 track (he dislikes the current 6-2 song); decide on
  hi-res stage backgrounds (deferred — costs the parallax). Deferred
  by us: a perf/smoothness code pass; spacesuit blast/celebrate
  frames (no assets).
- **Prior batch progression**: A ✅ B ✅ C ✅ D ✅ E ✅ F ✅ + falling-leaf
  streams + 2nd sprite drop (new jump / spacesuit-on-sun / teaching
  poses / new overworld) all shipped.

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
7. **Post-stage scripture teaching beat / mini-lessons between
   non-quiz levels** (idea banked 2026-05-30, refined 2026-05-31
   per Mark, not yet designed/built). Stages that are NOT followed
   by a between-days quiz (the first stage of any 2-stage day, and
   the Adventure City secret stage) feel a little abrupt at the
   end. Mark wants a brief "Super Dude Danny teaches from
   scripture" mini-lesson inserted between the results screen and
   the overworld — DOES NOT REPLACE the existing between-day quiz
   scene, just fills the gap on no-quiz stages.

   Concept refined 2026-05-31:
   - Danny in his lab (probably reusing the painted ART_LAB
     backdrop the finale uses) in his **teaching / lecturing
     animation** (`assets/New Assets/Big Danny/Actively_teaching_
     and_lecturing_talking_and_waving-dfb619f4` or the
     `Funny_teaching_and_lecturing_...` variant).
   - Short scripture verse for the stage's biblical day, in the
     **ICB (International Children's Bible) version**.
   - Text **types out slowly** character-by-character with **little
     fun typing noises** as each character lands (small click /
     pop sound, maybe pitched per letter). Similar feel to a
     Pokémon dialog box.
   - Confirm-to-advance once the text finishes typing.
   - Per-stage verse lookup, probably a new file
     `js/scripture_data.js` keyed by `'d-s'` and storing the verse
     text + reference (book, chapter, verse). Stays separate from
     `js/quiz_data.js` so the quiz between-days remains untouched.

   Implementation rough plan when it's time:
   - New scene `SDD.scenes.lesson` with painted lab backdrop +
     Danny in the lecturing pose (sprite cycles 2-3 frames at low
     fps for talking).
   - Inserted before `go('results', ...)` in the level scene's
     `finish()` only when the day's stage count is > 1 AND this
     is NOT the last stage of the day (so the between-day quiz
     handles the last-stage case). Also for Adventure City (Day
     8-1) which is outside the quiz progression entirely.
   - Typing animation: reveal one char per ~3 frames, play a small
     synthesised tick (existing `A.sfx('select')` at very low
     volume + slight pitch variation, OR a new dedicated
     `SDD.audio.SFX.typewriter` tone).
   - SKIP button (or hold-confirm) reveals all text instantly for
     replays.

   NOT YET implemented; revisit after the Adventure City art
   passes are done and Mark gives the go.

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
  and the cache generation always match. Current: `v0.40` / `sdd-shell-v40`.

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
