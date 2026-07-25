# PORTION CONTROL — Session Handover

> **New session? Read this file first, then `COMPENDIUM.md` (the full
> design doc — §1 Pillars, §2 Art, §3 Performance Bible are law).
> Before generating ANY art, read `PIXELLAB.md` — the complete
> verified reference for the PixelLab API connection.**
> This file is the living state: what is LOCKED, what is built, what
> is next. Update it every session (same ritual as the platformer's
> CLAUDE.md). The remote env is ephemeral — only pushes survive.

---

## WHERE WE ARE (latest first)

- **2026-07-25 — v0.7.1: WP-AUDIO SHIPPED.** audio.js upgraded in
  place (PHASE2 premise was stale — buses/caps already existed):
  persisted mix (localStorage `portioncontrol.audio`, default music
  .35 / sfx .85, `setMusicVol/setSfxVol/getVols`), music DUCKING
  (~38% dip, ~250ms recovery) on level-up/chest/roar/boss-die/
  fanfare/revive, shared feedback-delay "air" send for chime SFX,
  detuned layering. NEW SFX (musical language: major = good, low
  minor = danger): `cardSelect` (E->B fifth), `telegraph` (low growl
  + minor-2nd rub; Kevin strike + boss charge), `roar` (boss
  entrance/charge), `splat` (condiment), `bossHit` (throttled thunk
  in hitBoss), `bossDie` (descend + resolve arpeggio), `fanfare`
  (rescue/victory triad + held C+G), `revive` + `evolve` (reserved
  for WP-SCRIPTURE / WP-EVOLUTIONS). Call sites remapped (boss no
  longer reuses hurt() for everything). Select screen gains
  [ AUDIO ] gear -> panel with draggable MUSIC/SOUND FX sliders
  (audible tick while dragging SFX). Verified: all 18 SFX methods
  clean, sliders persist, combat 60fps. NEXT: WP-JUICE (damage
  numbers, trails, enemy squish, gem art), then METASHOP +
  COLLECTIONS title hub, SCRIPTURE (Claude authors, Mark reviews).

- **2026-07-25 — v0.7.0: PHASE 2.0 TRACK 0 SHIPPED — HERO KITS LIVE.**
  Mark delegated the open decisions (2026-07-25): camera stays (no
  further zoom-out; "4K feel" comes via fidelity/juice), Claude may
  author scripture/faith content (overrides PHASE2 §2.8), difficulty
  pillar proceeds as specced. DECISIONS MADE: kits = Danny A /
  Victoria B / Nayah A / Kevin A / Carlos C / Josh B (each VS
  archetype once); D1 captive = VICTORIA; unlock flow = Danny start,
  rescues unlock, `PC.DEV_ALL_UNLOCKED=true` for now. NEW
  `systems/kits.js`: SentryWeapon (Vic turrets), SeedWeapon (Nayah
  thorn patches), StrikeWeapon (Kevin marked strafe), BeamWeapon
  (Carlos farthest-enemy pierce + only crit source), LassoWeapon
  (Josh breathing rope ring), Danny keeps Resizer + Eureka level-up
  pulse; per-hero passives via stats.heroDmg/heroCd/heroSpd (PASSIVES
  now COMPOSE on hero base — never overwrite), scene.xpMult/
  dmgTakenMult/kbMult, PC.rollDmg crit helper. Item glow = pulsing
  additive spark at per-hero offset while walking (code-side,
  VS-law). Select screen: locked heroes = silhouette + ??? +
  "RESCUE TO UNLOCK" (honors DEV_ALL_UNLOCKED); kit name shown under
  role. D1 win calls PC.unlockHero('victoria'); rescue cage now pops
  Victoria. REAL BUG FIXED in ground.js (locked file, zero-regression
  fix per guardrail 1): chunk canvas textures are game-global, so
  scene restarts left images bound to stale canvases -> "floating
  building block" artifact; now remove-before-addCanvas. VERIFIED:
  all 6 heroes fight with their signature weapon at 60fps, 0 errors,
  5-restart artifact sweep clean. NEXT: WP-AUDIO (extend existing
  audio.js - it already HAS buses/caps, PHASE2 premise stale there),
  then JUICE, METASHOP+COLLECTIONS, SCRIPTURE (Claude authors, Mark
  reviews), EVOLUTIONS/LOOT, ENVFIDELITY, DISTRICT2.

- **2026-07-24 — v0.6.4: ROSTER FINAL — whole cast on the v3
  generation.** Final picks, all animated + live in-game: Danny =
  v3_1, Victoria = v3_5 (re-rolled from her pro pick for engine
  consistency), Nayah = v3_3, Kevin = v3_9, Carlos = v3_2, Josh =
  v3_3. Every hero: 92-96px canvas, figure ~46px, roster scale 1.1
  (Josh 1.15), east idle + 6-frame east template walk, west = flip.
  `final_roster_eastwest.png` in concepts/heroes/engines is the
  canonical lineup. Verified: all 6 select + launch with own art,
  0 errors. Character ids for every roll in engines_state.json (the
  PixelLab library keeps them; more directions/animations can be
  ordered later by id). NEXT: kit picks (CHARACTERS.md A/B/C per
  hero) + D1 rescue hero + item-glow walk polish (code-side).
  ~1400 generations remain.

- **2026-07-24 — ART-REVIEW LAW (Mark): judge EAST, not south.** The
  game renders only east + west-flip; south/north rotations are never
  used. ALL future option sheets must show the EAST rotation (and
  ideally the west flip) — a sprite that wins on the south view can
  lose on the side view (Danny v3 opt 2's forward-extended ray gun
  only reads from the east). Danny engine sheets redone east-first
  (`concepts/heroes/engines/danny_engines_east.png`) + a
  `roster_east_lineup.png` of all six current in-game east idles at
  relative scale. Danny pick still pending.

- **2026-07-24 — v0.6.0: ROSTER ART CLOSED + CHARACTER SELECT LIVE.**
  Kevin = v3 option 9 (leaner build; Mark picked it seeing the
  lighter-than-card skin + red tie). All 6 heroes now playable:
  boot -> PC_Select (new `scenes/select.js`, 2-col portrait grid /
  3-col landscape, bobbing idle sprites, gold ring, tap-twice to
  start, pick persisted at `portioncontrol.hero`); results loops
  back to select. `PC.ROSTER` in config.js (id/name/role/art/scale —
  scale normalizes figure heights to Danny's ~50px: Vic 1.25, Nayah/
  Kevin/Carlos 1.1, Josh 1.15). game.js player+ghosts are hero-
  agnostic via `this.hero`. GOTCHA fixed: the atlas packs ONLY
  PC.ASSETS registry entries — manifest alone is not enough; the
  fictional cook/tech/muscle/scout/medic + captured_* placeholder
  entries were replaced with the real roster at true canvas sizes
  (68/84/92/92/92/88). Verified headless: all 6 select cells launch
  with their own art + scale, zero page errors. KITS still pending
  (all heroes run Danny's default loadout — CHARACTERS.md picks
  needed) + D1 rescue hero still unnamed. 1433 generations remain.

- **2026-07-24 — FINAL HERO ART LOCKED (4/5) + Kevin re-rolls.**
  Mark's engine picks: Victoria = PRO, Nayah = v3 opt 3, Carlos =
  v3 opt 2, Josh = v3 opt 3; Kevin = none of round 1 (settled-for
  v3_3 rejected in favor of a re-roll). The four winners are
  template-walk animated and their frames REPLACED the standard-round
  art in `assets/art/` under the SAME keys (`char_<name>_idle` +
  `walk_1..6`; canvases now 84px Victoria-pro / 96px v3 vs Danny's
  68 — apply a per-hero display scale at wire-in time, sprites are
  NOT yet drawn by gameplay code). Kevin got 3 fresh v3 rolls
  (options 4/5/6, dark brown skin + broad commanding build written
  explicitly) in `concepts/heroes/engines/kevin_v3_[456]_south.png`
  + `kevin_v3_options2.png`. AWAITING MARK: Kevin 4/5/6, then kit
  A/B/C picks + D1 rescue hero. Style-prompt law confirmed to Mark:
  one shared scaffold, only the outfit/item clause varies. 1440
  generations remain.

- **2026-07-24 — ENGINE COMPARISON ROUND (v3 + pro) + VS-style item
  law.** Mark's art direction locked: heroes are IDENTIFIED BY THEIR
  HELD ITEM, Vampire-Survivors-style — Victoria holds the wrench,
  Nayah bare fists with work gloves (no item), Kevin nothing (strong
  commanding gait), Carlos telescope, Josh WHIP (rope is out),
  Danny ray gun (existing). ANIMATION POLICY: walk-only + static
  idle holding the item; NO attack-animation catalog; the item may
  subtly animate during walk (Danny's gun glow) — do that via code
  overlay or a tiny state variant, not new anims. Ran the same
  descriptions through create-character-v3 (3 rolls each, ~2 gens
  ea, 96px canvas, 8 rotations, richer painterly shading) and
  create-character-pro (1 each, ~16 gens, 84px, crunchier classic
  pixel clusters). All 20 in `concepts/heroes/engines/`
  (`<hero>_<v3_N|pro>_south.png`, `*_engines.png` sheets,
  `engines_overview.png`, `engines_state.json` char ids). Honest
  caveats logged for Mark: Nayah's skin renders lighter in all 3 v3
  rolls (her PRO roll matches the card best); Kevin's v3 rolls also
  lighter than his standard pick. AWAITING MARK: engine + roll per
  hero (mixing engines is fine; a winner gets template-walk + game
  wiring; 96px v3 sprites will be integer-scaled to fit). 1470
  generations remain.

- **2026-07-24 — ROSTER ART COMPLETE.** Mark chose Victoria 3,
  Kevin 3, Carlos 1, Nayah 1, Josh 1 — all five animated and in the
  atlas (`char_<name>_idle` + `walk_1..6`). Boot verified clean.
  STILL PENDING from Mark: kit A/B/C pick per hero (CHARACTERS.md)
  + which hero is the District 1 rescue. NEXT BUILD STEP: character
  select + kit implementation.
- **2026-07-24 — (superseded detail) winners round.** Mark
  chose Victoria 3, Kevin 3, Carlos 1, Nayah 1. Each winner ran
  through v2 `animate-character` (template
  walk, east) — 4 generations total — and shipped-Danny-convention
  frames landed in `assets/art/`: `char_<name>_idle` (east rotation)
  + `char_<name>_walk_1..6`, all in the manifest/atlas (verified:
  headless boot 0 errors, only the perennial favicon 404). NOT yet
  playable — no character-select system exists; assets are staged
  for it. Kit A/B/C picks per hero also still pending (CHARACTERS.
  md). PixelLab character_ids in `concepts/heroes/heroes_v2_state.
  json` (also in the account library) if more directions/animations
  are needed. ~1582 generations remain. NEXT: Josh pick -> kit picks
  -> character select + kit implementation; D1_RESCUE still the
  placeholder until Mark names the District 1 rescue hero.

- **2026-07-24 — HERO AVATARS ROUND 2 (v2 pipeline).** Round 1 (v1
  pixflux 64px chibi concepts) REJECTED by Mark: "all of them are
  bad" — not the style of shipped Danny, too childish, not
  card-accurate. LESSON (now law): ALL playable-character art goes
  through the v2 `create-character-with-4-directions` pipeline at
  shipped-Danny settings (48x48 request -> 68px template canvas, low
  detail, basic shading, low top-down) — never v1 one-shots, and no
  "kid-friendly big eyes" prompt language ("adult hero ... normal
  human proportions ... 90s SNES Konami style" is the formula).
  Mark's outfit specs (verbatim, used in the prompts): Victoria =
  denim onesie/overalls with straps + techie devices; Nayah = jean
  jacket, jeans, boots, white shirt, backpack; Kevin = navy bomber
  jacket with patches, tactical pants, boots; Carlos = jean jacket
  over mustard hoodie, telescope + backpack; Josh = khaki shirt over
  blue undershirt, khakis, boots, cowboy hat. 5 heroes x 3 rolls
  created (15 gens; parallel job submission caused "heavy load"
  failures — serialized one-at-a-time submission is the reliable
  pattern). `concepts/heroes/`: `<hero>_<n>_south.png` rolls,
  `*_v2_options.png` sheets (shipped Danny as in-row style ref),
  `v2_overview.png`, `heroes_v2_state.json` (PixelLab character_ids —
  the winners' ids get template-walk animated later). `CHARACTERS.md`
  kits (3 per hero) still stand. AWAITING MARK: pick roll 1/2/3 per
  hero + kit A/B/C per hero. ~1586 generations remain.
- **2026-07-23 — Rescued teammate is a REAL SDD character, not "The
  Cook" (Mark).** Mark: the rescue must be a Super Dude Danny roster
  character (Adventure City team: Victoria/Nayah/Kevin/Carlos/Josh) -
  he'll supply art + name later. Removed the invented Cook: `hero_cook`
  art/manifest deleted; rescue + results now use a clean
  stasis-pod PLACEHOLDER (`hero_placeholder`, code-drawn silhouette +
  "?") and generic wording ("TEAMMATE RESCUED" / "YOUR HERO JOINED THE
  TEAM"). Data hook `PC.D1_RESCUE = { name, art }` in config.js - to
  wire the real hero later: drop art, add manifest key, set name+art.
  Verified: win flow shows placeholder, 0 errors.
- **2026-07-23 — M5 SHIPPED: Big Frank finale + hero rescue (VERTICAL
  SLICE COMPLETE).** `systems/boss.js` - THE BIG FRANK (128px, hp3000,
  spd100, contact20): drifts at the player, **Charge** every 6s (0.7s
  Cherry-tint telegraph draws the dash lane -> dash 320 for 1.1s),
  **Condiment Splatter** every 9s (5 warning shadows -> ketchup puddles
  r30, 3s, 8dmg/s), **enrage <25%** (red tint, charge every 4s).
  `damage()` is the ONLY HP path and sole caller of die()->
  onBossDefeated() (Perf Bible 10 - win can't miss). Full-width boss HP
  bar. Bullets + Whisk route hits through `scene.hitBoss`. **Dopamine
  chain**: entrance = white flash + shake + double-roar + BIG FRANK
  APPEARS banner (Back.out pop); ambient spawns thin to 0.55x while he
  lives; defeat = slowmo (timeScale 0.4) + Frank shrinks+spins to 35%
  and pops + 24-coin confetti rain -> DISTRICT CLEARED banner -> cage
  cracks (3 frames) -> **The Cook** springs out (hero_cook, v1 pixflux
  chef) with level-up burst + sparkle ring + THE COOK RESCUED ->
  win results. `scenes/results.js` reworked: win path = green bg +
  confetti rain + rescued-hero portrait + JOINED THE TEAM + TIME/POPS/
  LEVEL/GOLD; lose path = Overwhelmed. Verified headless: boss spawns
  at 5:00, single-path defeat sets won=true, results win=true, 0
  errors. **M0-M5 VERTICAL SLICE DONE** - District 1 is playable start
  to finish. Next: evaluate with Mark, then M6+ (meta shell, full
  arsenal, districts 2-5) if greenlit.
- **2026-07-23 — PLAYTEST ROUND 10: 8 fixes from Mark's recorded run.**
  (1) **Zoom out**: `PC.RENDER.BASE` 270->340, main.js derives logical
  size from it - ~26% more map visible (Danny size kept). (2)
  **Building collisions fixed**: collision math was already 100%
  correct (headless-verified all 1152 rects eject) - real issues were
  perception: player now anchored at FEET (origin 0.5,0.82) so he stops
  at buildings instead of sinking in (r 10->13); buildings read clearly
  RAISED (brighter roofs, top rim highlight, strong contact + cast
  shadow) so none feel invisible. (3) **Spawn director** (new
  `systems/spawn.js`): 10min->5min (RUN.BOSS_AT_S 300), gentle early /
  intense late 6-phase timeline, all 5 D1 foods introduced over time
  with distinct stats + time-scaling, Ring events at phase turns. (4)
  **Separation strengthened** (round-10 stacking): all-pairs per cell
  (cap 12), 2 passes, 0.95x full-radius target. (5) **Health + crates
  + gold** (new `systems/pickups.js`): ambient shiny lab supply crates
  (break on touch/bullet -> med-kit heal35 or coin fan), med-kit + coin
  drops from popped food (1.5% / ~8.5%), coins = gold meta-currency
  (HUD `$`, localStorage `portioncontrol.gold`), floatText. (6)
  **Shot graphics**: PixelLab whisk sprite (metal wire loops) on the
  Whisk Cyclone + flying-fries pellet on the Portion Blaster (solid
  blend, not the beam's glow). (7) **Adventure City music**: 3 tracks
  copied to `assets/music/city_{a,b,c}.mp3`, random per run via
  HTMLAudioElement (synth fallback). Verified headless: zoom 340,
  late-game 4-food mix, coin->gold + medkit->heal, 59fps, 0 errors.
  **Next per COMPENDIUM: M5 District 1 slice** (Big Frank boss +
  rescue + win/lose) - the remaining vertical-slice milestone.
- **2026-07-23 — BUILDING CHARACTER PASS + M4 SHIPPED (round 9).**
  Mark approved the art direction ("right on the money") - world and
  code-painting confirmed as the way. (1) **Buildings got character**:
  4 archetypes by hash (shop: striped awning + glow sign / apartment:
  roof garden + clothesline / office: skylight grid / diner: checker
  awning + glowing burger sign), lit south faces (warm windows, some
  dark, door + light spill), water towers on stilts, AC units,
  antennas, roof hatches. Empty plaza quadrants now hold mini-parks
  (grass, trees, path cross) or fountains (stone ring, shimmer) or
  stay open. (2) **M4 level-up cards COMPLETE** (COMPENDIUM M4):
  weapons.js rebuilt as a framework - Resizer L1-5 (dmg/amount/cd/
  pierce per 7.1), Portion Blaster (40-degree cone, life 0.35s, 7.2),
  Whisk Cyclone (orbiting sprites, per-enemy 0.5s tick via e.whiskCd,
  7.3); passives battery/fan/shoes apply through scene.stats
  (dmgMult/cdMult/spdMult); PC.damageEnemy is the single damage path
  (flash+knockback+kill). Card flow: level-ups queue pendingLevels ->
  showCards pauses the WORLD (update early-returns; runT verified
  frozen), 3 distinct draws (weapon-up / weapon-new while <4 slots /
  passives / Snack Break heal when maxed), tap or keys 1-3, stacked
  level-ups chain card sets. Verified headless end-to-end: 2 stacked
  picks, fan lv2 applied, resume at 58fps, zero errors.
  **Next per COMPENDIUM: M5 - District 1 vertical slice** (full 8.1
  spawn timeline + Ring/Elite/Golden events, Big Frank with Charge +
  Condiment Splatter + enrage, single-path damageBoss, cage rescue of
  hero 2, win/lose screens).
- **2026-07-23 — KID-SAFE ENEMY PIVOT COMPLETE + Danny A wired (round 8).**
  Mark's ruling: enemies must NOT be monsters/mascots - they are PLAIN
  OVERSIZED FOOD OBJECTS (no faces, no legs; a kids' game). L4's
  "menacing face" grammar now applies to BOSSES ONLY; the swarm is
  cheerful giant food. Art: 5 plain foods via v1 pixflux (bright
  cheerful, negative: face/eyes/legs/monster) at game-grid sizes;
  installed as walk_1=walk_2=still (single frame). Motion is ALL code:
  squash-stretch waddle (scaleY 1+sin*0.07 / scaleX inverse) + the
  rotation wobble + knockback + separation. Pop fiction upgraded: the
  still renders at 55% scale - the Resizer visibly SHRINKS food back
  to normal. **Danny = v2 option A (low detail)**: 68px canvas, idle =
  standing east rotation, 6-frame template walk (cycle *10 %6), E/W
  flip only per Mark's VS reference; ghost-trail after-image live.
  V2 NOTES: create-1-direction-object works and persists to the
  library BUT its images are only served from backblaze.pixellab.ai,
  which this environment's egress policy BLOCKS (characters are
  fetchable via /characters/{id}/zip on the api host; objects have no
  zip endpoint - flag the host to Mark if object downloads are ever
  needed). The 13 option-characters from this round remain in Mark's
  library. Verified: friendly food swarm + Danny A + waddle at 59fps,
  zero errors. **Next: M4 level-up cards** (still the milestone).
- **2026-07-22 — WALK SOLVED: skeleton animation pipeline (round 7).**
  Mark rejected 5 animate-with-text walk options ("all terrible" -
  correct: that endpoint animates well but MUTATES identity: fedoras,
  red visors, aging). THE fix: **animate-with-skeleton**:
  estimate-skeleton on Mark's Danny #1 (0.1 gen) -> hand-authored
  walk poses at the bone level (18 keypoints, normalized; gun arm
  steady, far arm swings, legs stride +/-0.11x, pass frames drop
  0.02y) -> animate-with-skeleton with reference_image = HIS EXACT
  SPRITE. Identity CANNOT drift. API rules learned (-> PIXELLAB.md):
  canvas must be exactly 256/128/64/32/16 square (pad 48 art into 64,
  no scaling, crop back); model is a 3-FRAME WINDOW (stride/pass/
  stride; 4-frame cycle reuses the pass frame); estimate costs 0.1
  gen, animate 1 gen. Frames installed as char_danny_walk_1..4.
  **This is now the standard pipeline for ALL character animation**
  (heroes 2-6, bosses if needed). Verified in-game, zero errors.
- **2026-07-22 — ROUND 6: buildings, crowd physics, directional fire,
  simple walk, all map art hand-painted.** Mark (after clearing a
  stale cached load): painted map WORKS, but PixelLab map assets
  still bad -> ALL props/litter now painted in code inside world.js
  (lamppost+glow, hydrant, trashcan, bench, planter, fries/wrapper/
  cup litter) - zero atlas blits on the ground. **BUILDINGS added as
  real obstacles** (overrides COMPENDIUM 2.6 no-obstacles):
  deterministic footprints per plaza quadrant (PC.chunkSolids, cached,
  computable without painting so off-screen enemies collide too),
  painted as rooftop slabs (parapet, world-keyed speckle, AC units w/
  fans, hatch, pipe, drop shadow, optional shopfront awning stripe).
  Collision: PC.resolveCircle (circle vs rects, least-penetration
  exit) applied to player (r10) and every enemy. **Anti-stacking**:
  ARTDNA soft-separation - same-cell neighbor pairs shove apart
  (0.8x combined radii target, capped push) - crowds now CROWD.
  **Fire direction**: consulted COMPENDIUM 4 (auto at nearest, no aim
  input) vs Mark's instinct (fire where moving, like the VS knife) -
  implemented the knife model: Resizer fires along last movement
  direction with a ~35-degree cone-assist snap to the nearest enemy
  in front; no aim input added. Danny no longer snaps to face
  targets. **Walk fixed**: perpetual-flying-coat run scrapped; new
  calm 4-frame walk (coat hangs naturally, negative: coat flying/
  running) from Mark's #1 base at strength 300; lean reduced to a
  whisper. Verified: buildings block + swarm splits around them, no
  stacking, directional bolts, 59fps @ 52 foes, zero errors.
- **2026-07-22 — WORLD REBUILT IN CODE (Mark round 5: "map is ugly,
  character slides, shooting lackluster - make it like Adventure
  City").** Mark's screenshots vs real VS proved it: VS ground is ONE
  continuous quiet surface, ours was hash-tile checkerboard. Fix:
  **`systems/world.js` - procedural street painter, the Adventure
  City approach**: every detail keyed to WORLD coordinates (borders
  invisible), structured city grid per 512px block - plaza concrete
  with world-aligned slab seams + stains, road bands with sidewalks
  (slab seams), light curbs, asphalt with 2-tone world-keyed speckle
  + wheel-wear lanes, yellow center dashes (skip intersections),
  crosswalk zebras, manholes, seeded cracks, lamp glow pools at
  intersection corners, props BLITTED FROM THE ATLAS at logical spots
  (furniture on sidewalks, parked car on road edge, litter sparse).
  `ground.js` rewritten: 12-slot pool of 512px canvas textures
  (addCanvas + refresh), zero churn. PixelLab tiles retired from the
  ground (props/litter PNGs still used - they read well).
  **Anim fix**: Danny "slides" because init-chain frames were too
  similar. New: `char_danny_idle` (Mark's aim pose) + 3 RUNNING
  stride frames (strength 200, explicit full-stride leg prompts,
  side profile) + code juice (1px step bob, lean into movement,
  rotation wobble). **Shooting juice**: bullets ADD-blend at 1.4x,
  impact sparks on every hit, layered shoot SFX.
  GOTCHA logged: world.js loads before ground.js -> PC.hash01 must be
  lazy-bound, not captured at IIFE time ("H is not a function").
  Verified: painted streets + 49-foe swarm at 59fps, zero errors.
- **2026-07-22 — KONAMI CAST COMPLETE: Mark picked Danny #1.**
  From a 6-candidate lineup (all in the rev-2 outfit) Mark chose #1
  (crouched firing pose, coat flare). Walk cycle (3 pose gens via
  init chain, stride/together/stride/together) + 96px portrait built
  from that exact sprite, native 48. Full D1 cast re-rolled in ARTDNA
  Konami style (style suffix v2, selective outline, shading tier by
  size, anti-chibi negatives): all 5 enemies x2 frames, 5 stills,
  Big Frank x4 (64 -> x2 to 128). Verified in-game: complete new-
  style swarm at 59fps, wobble + knockback live, zero errors.
  **Next: M4 level-up cards** (unchanged).
- **2026-07-22 — ART DIRECTION SHIFT: chibi -> 90s-Konami shaded
  (Mark round 4 + his VS Art DNA guide, now `ARTDNA.md` - art law,
  wins over COMPENDIUM on art).** Size stays 48px (option B locked).
  Implemented ARTDNA's REQUIRED juice: (1) per-enemy sin-rotation
  walk wobble (rotation = sin(animT*6+phase)*0.06 - "the single
  highest-value trick"), (2) 120ms reversed-velocity knockback on
  bullet hits along bullet direction (per-def kbMult: heavies 0.3,
  bosses 0), stack-free timestamp. Also fixed a real bug found in
  passing: spawn() never copied def.still, so pop-to-harmless-food
  stills NEVER showed in-game - now copied. Style suffix v2 (90s SNES
  Konami, selective outline, 3-tone shading, negative: chibi/big
  head) produced samples: 2 Danny candidates (A medium / B detailed
  shading) + Konami fry + hotdog - sheet sent to Mark for style
  approval BEFORE re-rolling the whole cast. Fry upgrade is dramatic.
  Verified: game clean with wobble+knockback, zero errors.
- **2026-07-21 — Danny upgraded to 48px native (Mark round 3: quality).**
  Mark flagged the in-game Danny as low quality vs the raw art - root
  cause: 64px anim frames crushed to 32. Produced a true-scale options
  sheet (A 32 / B 48 / C 64 on the real street, fry for reference) -
  implemented **B: 48px native** as the working choice (reversible:
  regenerate at another size + registry size field if Mark picks
  differently after seeing the sheet). New native-48 walk set: base +
  3 pose gens via init_image chain (strength 320), loop order
  stride-L/together/stride-R/together, NO scaling anywhere. Registry
  now supports per-char size (danny 48, others 32 until their art
  lands). Muzzle flash offset widened for the bigger sprite. Verified
  in-game: face/coat/goggles/gun all read at speed, 59fps @ 50 foes,
  zero errors. **Next: M4 level-up cards.**
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

### L5. Character #1 — DANNY (locked rev 2, Mark 2026-07-22; heroes 2–6 named later)
The star is **Super Dude Danny** himself, in the ARTDNA.md Konami
style ("Option B" = detailed shading, NOT chibi, normal human
proportions, 48px canvas). **Outfit locked by Mark:** long white lab
coat OPEN over a **black t-shirt and blue jeans**, **dark blue
backwards baseball cap**, **glasses** (not goggles), brown hair,
small energy pistol with glowing cyan tip, firing pose facing right.
Confident grin. (The earlier chibi spec below is HISTORICAL - kept
only for the fallback pixel maps in handart.js:)

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
