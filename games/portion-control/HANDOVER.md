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

- **2026-07-28 - v0.18.2: NEWSCAST INTRO CINEMATIC (Mark: "the intro
  is barely understandable... maybe it's a newscast. We're looking
  at an old style tube TV and on it is a newscast").** cutscene.js
  rebuilt around a CRT presentation: Danny's garage room (shelf,
  tools, floor, glow spill) -> tube TV (bezel/speaker grille/dials/
  rabbit ears/brand plate; body+tube-glass render BELOW the footage,
  details above) -> footage plays inside a GeometryMask'd container
  with scanlines/vignette/glare + real CRT static + power-on line.
  ACN news chrome: BREAKING banner, scrolling ticker, blinking LIVE
  bug, ACN corner bug. Footage scenes: news_desk (NEW anchor
  portrait behind an ACN desk, window skyline w/ ADVENTURE TOWER +
  the Ray glinting on top, story-graphic inset), demo (close-up
  stage w/ bunting + the Nourish-Ray device + REAL sprites:
  char_danny_idle presenting, NEW cs_bloom/cs_sal(cart)/cs_pip minis
  + a 7-person crowd from NEW cs_civ_a/b/c back-view sprites),
  flood (night, stage buried in food stills), danny_room (TV drops
  to idle static, Danny steps IN FRONT of the set for "I did this."
  + wrist-pad portraits6 + GO). scripts.js: spec IV.0 cast lines
  VERBATIM; two new ACN anchor linking lines + chrome/scene beats.
  New beat type { chrome: {banner,ticker,live} }. ASSETS (7 gens,
  ~1143 left): portrait_anchor (npc-portrait recipe) + 6 48px
  cutscene figures (crowd prompts "seen from behind" direction:
  north). SPEAKERS += anchor ("ACN NEWS", pitch 1.05). GOTCHAS
  BURNED: (1) anything that fills the screen rect at bezel/detail
  depth blacks out the whole masked footage layer - tube glass and
  bezel BODY must be depth-below-footage, only out-of-window details
  on top (cost two debug rounds); (2) text meant to sit over chrome
  graphics must be a top-level depth-21 object, not a container
  child (container depth < chromeG). Verified headless
  (verify-newscast.js): all 7 phases screenshotted, lands on
  PC_Missions, zero errors/frame warnings; verify-intro +
  verify-linear regressions green.

- **2026-07-28 - v0.18.1: DEFEAT PORTRAITS (Mark: "Generate defeat
  portraits too").** All 6 heroes now have a KO/defeat expression
  variant (portrait_<hero>_ko.png, 128px) shown framed on the
  results LOSE screen ("OVERWHELMED!") - story deaths show the
  ASSIGNED hero's KO face. PIPELINE (new, document-worthy): v2
  `/edit-image` on the SHIPPED portrait = identity/colors/framing
  preserved, expression re-authored by text. 11 gens total incl.
  re-rolls (balance ~1150 left). LESSONS: (1) the endpoint returns
  RAW RGBA bytes (128*128*4), NOT a PNG - detect the PNG magic and
  wrap with PIL Image.frombytes otherwise; (2) gentle prompts
  ("sad, downcast") barely move smiling faces - the reliable
  recipe is text_guidance_scale 10 + explicit anatomy ("eyes
  squeezed SHUT with big cartoon tears, mouth wide open in a
  wobbly upside-down U wail, absolutely no smile") which landed
  kevin/josh/nayah after softer passes failed. Registered in
  manifest.js + assets.js (procedural portrait painter remains the
  missing-file fallback). Verified headless: quick-run kevin death
  + story danny death both render the KO portrait, zero frame
  warnings, zero errors (scratchpad verify-ko.js; sheets
  ko_sheet4.png).

- **2026-07-28 - v0.18.0: THE LINEAR STORY SPINE (Mark: "I really
  don't want a hero select... you're given the character and then
  given the mission... you unlock more and more of a mission map -
  as you play it reveals and unlocks the next mission for you to
  select if you lose or leave the game").** Story mode NEVER shows
  PC_Select anymore. NEW: src/data/story/chain.js (the 6-stage
  linear campaign table verbatim from STORY_SPEC Part II/IV: stage1
  THE BIG OOPS/central -> stage2 GONE WILD/park -> stage3 SUGAR
  RUSH/suburbs -> stage4 SIGNAL LOST/labs -> stage5 GOING DEEP/
  sewers -> finale TO THE TOP/tower; each entry ASSIGNS the hero -
  rescue rotation: you play each stage as the hero rescued in the
  previous one, danny->vic->josh->kevin->carlos->nayah. MARK TO
  REVIEW that assignment - trivially editable per-entry in
  chain.js), src/story/state.js (PC.storyState: localStorage
  'portioncontrol.story' {introSeen, cleared, revealSeen}; status(i)
  = cleared | active | soon (unlocked but map unbuilt = SIGNAL
  SCRAMBLED) | tease (fogged ??? one past the frontier) | hidden;
  DEV mode reveals all + [RESET STORY] button), src/scenes/
  missions.js (PC_Missions: the MISSION MAP - snaking node path
  climbing to a tower glyph over a textured board, lit route dots on
  cleared segments, per-state node art, assigned-hero portrait
  chips, tap node -> mission BRIEF sheet w/ blurb + "YOU PLAY AS"
  hero + GO, NEW MISSION UNLOCKED reveal fanfare once per fresh
  node, Sal's Store + Title footer, TP + coin wallet). FLOW: title
  STORY -> intro cutscene ONCE (introSeen) -> mission map forever
  after; GO sets PC.STORY.pendingMission {id,map,hero} -> GameScene
  forces this.hero from the chain (localStorage hero ignored) +
  region from entry.map + quest from missions[entry.id] (mission1
  now registered by MISSION id 'stage1', 'central' kept as alias);
  quest.complete() generalized (rescue hero read from the rescue
  beat, rescued name/art from the chain) + marks storyState cleared
  -> results (win OR lose) routes story back to PC_Missions, where
  the next node reveals; lose = pick the mission again (Mark's
  resume-on-loss). Quick run untouched: QUICK RUN/select clear
  pendingMission, free hero pick, no region/quest. Shop takes a
  {back} param so the mission map returns to itself. VERIFIED
  (scratchpad verify-linear.js, ALL GREEN): fresh save -> STORY ->
  cutscene -> map (stage1 active/stage2 tease/rest hidden as fogged
  waypoints) -> real UI taps node+GO -> hero forced danny w/
  localStorage=josh -> full B1-B5 bot run -> TP 125 + vic unlocked
  + stage1 cleared -> map shows cleared check + stage2 SIGNAL
  SCRAMBLED + reveal fanfare -> replay -> forced death -> results
  lose (danny portrait) -> map -> quick-run regression (victoria
  free-pick, no quest). Full battery re-run green (mission/region/
  intro/title-seq/dev/shop; verify-dev's localStorage error is its
  own about:blank init-script artifact, not game code). GOTCHA
  LEARNED: interactive zones under an overlay must setDepth ABOVE
  it - Phaser input sorts by depth, and the brief's dim rectangle
  (depth 30) ate the GO zone's taps until the zone went to 40.
  KNOWN STAGE-2+ WORK: quest chant + fetch-item icon + defend waves
  are stage1-flavored; generalize when park map lands. NEXT per
  STORY_BUILD_PLAN: hub landmarks in-world (Garage TP UI, Sal's
  storefront, Mission Board as in-world map trigger) OR straight to
  Map 2 art batch + mission chain - Mark's call.

- **2026-07-27 - v0.17.2: STORY-3 SHIPPED - THE MISSION ENGINE +
  FULL STAGE 1 (Mark: "Fire away... test everything").** NEW:
  src/story/quest.js (PC.Quest rides inside GameScene: objective
  chain state machine, edge-of-screen compass w/ on-target hover
  marker, objective banner w/ live progress + defend bar, in-game
  dialogue via PC.DialogueBox uiAttached w/ scene.storyPause world
  gate, TP awards via PC.meta.bump('tp'), THE CHANT + confetti,
  cage-crack rescue sequence) + src/data/story/mission1.js (Stage 1
  "THE BIG OOPS" B1-B5, dialogue VERBATIM from spec IV.1). Beat
  types: clear (ring-spawn tracked swarm at landmark, kill-count),
  fetch (3 fuse items = pulsing battery icons, guard swarms on
  approach, walk-over collect, Sal's chili-dog line at the diner),
  defend (in-zone cumulative timer + wave spawns + progress bar),
  boss (Big Frank spawned at the Bank on approach; onBossDefeated
  rerouted to quest), rescue (cage crack -> Vic reveal -> script ->
  CHANT -> mission complete). GameScene wiring: quest tick +
  storyPause gate, notifyKill, timer-boss disabled in story,
  ambient director x0.5 in story, results shows TECH +N TP; story
  results suppress the patrol unlock banner (Vic's rescue is the
  moment; stat unlocks still register silently). VERIFIED: scripted
  bot played the ENTIRE mission B1->B5: TP exactly 125 (5x10 + 50 +
  25 first-clear), Victoria unlocked, clear_stage1 flagged, zero
  errors/warnings; design shots: banner+marker over City Hall
  swarm, Big Frank at the Bank, Vic-in-cage rescue w/ typed
  dialogue, DISTRICT CLEARED w/ TECH +125. FULL REGRESSION BATTERY (Mark: "test
  everything") ALL GREEN: intro cinematic plays + hands off; region
  collision/door/OOB + quick-run reverts to default solids; title
  door sequence + SCALE 3 on dpr-3 devices; dev modes (?dev=1 /
  sticky / 5-tap off / #dev); all-26-weapons audit zero missing
  frames + zero errors; meta shop buy/persist/apply + Amazing Grace
  revive-once-then-die; balance smoke danny 99 kills / carlos 61 -
  in band. NEXT: STORY-4 hub + Garage = vertical slice.

- **2026-07-27 - v0.17.1: STORY-2 SHIPPED - the authored CENTRAL
  DISTRICT region map.** KEY DECISION (guardrail-driven): ONE
  rendering path - block = 512px = one native fabric street cell,
  map = 15x15 blocks = EXACTLY 7680px; the existing paintChunkD1
  paints every in-bounds chunk untouched and the region OVERLAYS
  landmarks/border/void (spec's 20x20@384 rescaled, topology
  preserved). NEW: src/data/story/map1.js (10 landmarks in block
  coords w/ per-landmark color+accent; spawn at the Mission
  Board), src/story/region.js (PC.Region: world-px landmark rects
  lot-inset 20px; chunkSolids = fabric solids minus landmark lots
  plus slab-with-south-door-bay collision (72px door, walk-in
  60px); paintChunk = fabric -> hazard-stripe map rim -> void grid
  beyond -> landmark plates; plates are LAYER-LAW placeholders:
  cast shadow + roof light/occlusion/rim + lit south face + door
  glow + windows + seeded roof vents + name signage; open
  landmarks (plaza/demo stage) = textured ground feature, no
  solid). PLUGGABLE SEAMS: PC.chunkSolids now = PC.
  defaultChunkSolids unless PC.installRegion(region) overrides;
  PC.Ground takes an optional painter. GameScene: reads PC.STORY.
  pendingMap (set by title STORY, cleared by QUICK RUN), spawns at
  region spawn, clamps movement to bounds. VERIFIED: spawn 4089/
  3936 on 7680 map, slab collision pushes out, door bay walkable,
  OOB pushes in, quick-run regression = default solids + no
  region, zero errors; screenshot tour (board/cityhall/bank/plaza/
  corner) - bank door bay + hazard corner look right. NEXT:
  STORY-3 quest/compass + Stage-1 chain (B1-B5).

- **2026-07-27 - v0.17.0: STORY-1 SHIPPED (Mark: "Build.") - the
  dialogue engine + cutscene runner + THE INTRO CINEMATIC.** New:
  `src/story/dialogue.js` (PC.DialogueBox: bottom lab-panel,
  portrait well, speaker tag, typewriter ~40ch/s, per-speaker
  textBlip pitch via PC.SPEAKERS table incl. NPCs; tap = reveal,
  tap = advance), `src/story/cutscene.js` (PC_Cutscene scene: beat
  list {say|scene|action|music|wait}, [SKIP >], scene painters
  plaza_sunny/plaza_flooded - sun+clouds vs stars+moon, skyline,
  demo stage w/ Ray emitter, crowd dots vs hash-scattered food-
  still flood piles; actions: flash/shake/smashcut/sodatip (the
  fateful cup tips + fizz)/floodburst (eruption of atlas food +
  gold flash)/portraits6 (wrist-pad call-up)/confetti+chant),
  `src/data/story/scripts.js` (IV.0 intro VERBATIM). audio.js:
  textBlip(pitch, wave) + musicCue(tag) synth pad stubs (hopeful/
  tense/lift/warm/boss/triumphant - Suno slots in later). NPC
  PORTRAITS generated (4 gens): bloom/sal/pip/chomp at 128 (64
  native x2). TITLE: >> STORY << is now the primary entry (temp
  next: PC_Select until Stage 1), QUICK RUN keeps the survivor
  mode, POWER-UPS third. Verified headless: full intro playthrough
  tap-by-tap, all beats fire, lands on select, zero errors/frame
  warnings; screenshots at Pip line / floodburst / aftermath /
  portraits6. NEXT: STORY-2 region-JSON loader + Central District
  7680px map (per docs/STORY_BUILD_PLAN.md).

- **2026-07-27 - STORY MODE PLANNED (docs/STORY_BUILD_PLAN.md).**
  Mark delivered the locked mother-session spec (docs/STORY_SPEC.md
  "Junk-Food Flood" + STORY_CAST_ADDENDUM.md) and asked for a
  construction plan. Plan written: reconciliations table (Coins ==
  existing gold/shop = Sal's Corner Store; TP = new currency ->
  Garage permanent sig start-levels + gate tools; current quick-run
  survives as PATROL; Stage 1 == existing Big Frank/Vic rescue;
  spec boss names win over registry placeholders; d5 re-themed
  sludge for Sewers), new-systems file map (story/dialogue,
  cutscene, region, quest, hub, garage + data/story/*), art budget
  (~20 gens for the vertical slice, ~150 total staged), and the
  build order: v0.17.0 dialogue+intro cinematic -> region maps ->
  quest/compass Stage-1 chain -> v0.18.0 hub+Garage = THE VERTICAL
  SLICE, then Maps 2-5 and the Tower finale. Feature-flag
  PC.STORY_MODE; patrol path untouched when off. AWAITING Mark's
  go on the plan (or he just says build).

- **2026-07-27 - v0.16.1: CHARGED COMET BEAM + DIFFICULTY RAMP +
  ECONOMY (Mark's verdicts).** (1) COMET BEAM total rework ("too
  much like Danny's laser... a charged beam that slowly coalesces,
  then shoots on a BIG beam, then stops, once every ~10s"): now a
  state machine idle(cd 10) -> charge 0.9s (converging motes + a
  growing white-hot orb, shrinkRing, windup SFX layer) -> FIRE
  0.55s (thick 3-layer lance: gold glow / orange body / white core,
  width 26->40 by level, range 430, anchored to the player,
  direction locked at charge, corridor ticks every 0.22s + boss
  line-hit) -> stop. Levels: dmg 50/70/-/-/95, L3 wider+cd8.5, L4
  twin beams, L5 cosmic lance; duplicator adds beams; COMET
  BARRAGE evo = 3 lances cd 5.5 dmg 110. New layered beam voice
  (rise 0.85s -> blast). BeamWeapon now takes scene (both ctor
  call sites updated). (2) DIFFICULTY ("still a little too easy...
  ramp sooner"): spawn phases compressed ~1min earlier (hotdogs at
  1:40, pretzels at 3:30, caps 45/85/130/190/260/300, perTick 3 in
  the last 90s), ring events earlier+bigger (45s/16, 120s/22,
  200s/28), TIMESCALE HP 0.06->0.10 DMG 0.02->0.04 per min. (3)
  ECONOMY (delegated): kill-coin drop 10%->13% at value 2 (gold
  now scales with performance = varies run to run). VALIDATED:
  full 320s bot run = 570 kills, minHp 26, 112 dmg absorbed,
  survived to the boss - danger arc restored; first-100s kills
  85->98. Beam freeze-frames verified (charge orb + lance).

- **2026-07-27 - v0.16.0: ASSET QUALITY PIPELINE + PUNCH LIST (Mark:
  "pipeline and asset quality first"; mother-session docs archived
  as docs/ASSET_QUALITY.md + docs/ENV_PIPELINE.md).** THE BIG MOVE:
  the FX frames are BAKED from code painters in assets.js, so
  rewriting 4 painters to the 3-layer recipes upgraded every
  burst/ring/projectile at once, free at runtime: `proj` = layered
  orb (rim -> base -> bottom-right occlusion -> up-left highlight ->
  hot core; covers all remaining placeholder projectiles incl. every
  eproj), `burst` = flash core + radial spark quads + debris (fx_pop
  /spark/muzzle/freeze), `ring` = darker outer rim + bright edge +
  falloff bands + glints (fx_nova/levelup/aura/cyclone + elite
  aura), `puddle` = rim/base/inner-shade/glint. New lite()/shade()
  hue-shifted ramps (yellow-white highlights, violet shadows).
  vfx.js telegraph rings gained a soft interior falloff (dark rim
  impossible on the ADD layer - documented). PATH-A BATCH (8 gens):
  real art for pickup_health (glossy heart), pickup_magnet,
  pickup_bomb, CHEST closed+open -> pickup_chest_1..4 (brightness
  shimmer frames), CAGE 48px -> pickup_cage_1..3 (PIL crack overlays
  + shattered gap - Victoria's rescue cage is now real), and
  characterful eproj_tomato/eproj_soda. COMPENDIUM Appendix A added:
  the 8 style-law amendments (no-flat-fill, color roles canon,
  top-left light, hue ramps, additive=energy-only, small-object
  rule, screenshot gate, environment painter contract). ENV doc
  audit: the D1 chunk painter ALREADY complies (cast shadows,
  contact halos, roof rims, textured surfaces since round 10);
  the contract now binds D2-D5 set construction. Verified:
  9-asset contact sheet, all-26-weapons audit zero errors, in-run
  screenshot shows layered rings/bursts live. Balance ~1160/2000
  gens. NEXT: WP-SCRIPTURE (Mark-approved queue).

- **2026-07-27 - v0.15.0: PER-ABILITY SFX VOICES (mother-session
  deliverable docs/SFX_VOICES.md, built to spec).** audio.js gains
  VOICE_FAM (12 family timbre defaults) + VOICES (26 weapon rows:
  wave/base Hz/glide/dur/noise/reps/gap; espresso, ketchup, and
  comet are 2-layer sequences - windup->pop, thwup->splat,
  sky-whistle->crash) + one combinator playVoice(key): per-key
  throttle gap (anti-cacophony rule 2), +-cents pitch jitter per
  trigger (rule 3), burst reps, family air/wave/gain fallbacks.
  Public API: PC.audio.weaponVoice(key) - safe to call every frame
  (continuous weapons DO: whisk/lasso/microwave call it per-frame
  and the gap becomes their tick loop, rule 1; grease per-segment,
  salt per-aura-tick). ALL 26 activation sites rewired off the
  shared shoot()/pop() onto their own voice; impacts still use the
  shared rate-limited pop/splat (rule 6); the 18 existing event SFX
  untouched (additive, flag PC.SFX_VOICES). Earcon test (spec 6.4):
  dev-mode [SFX TEST] button top-left of the title plays all 26 in
  sequence at 0.5s spacing. Verified headless: 26 scheduled, full
  playthrough zero errors; all-weapons audit zero errors/warnings.
  Register spacing per spec keeps the live mix legible (minions
  HIGH / shots MID / strikes+fire LOW). Mark should ear-test on
  device via ?dev=1 -> [ SFX TEST ], then a live run.

- **2026-07-27 - v0.14.9: PINEAPPLE RETALIATION + KEVIN'S AIMED
  STRIKE BUTTON (both Mark-approved this session).** (1) PINEAPPLE
  GUARD rework per Mark's spec: completely DORMANT until the player
  takes a hit, then 8 lime spike bullets (L3 10, L5 12, +extraProj)
  launch radially at 430px/s with pierce 3 and fly to the screen
  edge; no ring, no aura (kills the third player-circle the
  archetype audit flagged). FORTRESS FRUIT evo = 16 spikes dmg 48 +
  heal 6 on retaliation. (2) KEVIN manual strike: masterize sets
  w.manual (OWNER-ONLY; inheritors keep auto densest-cluster) ->
  STRIKE cooldown button bottom-right (Vic Deploy pattern: red
  ready ring, gold cd sweep, 'TAP!' armed state, tap-again
  cancels); when armed the next map tap converts screen->world
  (worldView + p/SCALE) and drops the telegraph + bombing run
  there. Verified headless: arm->tap world coords EXACT, cd
  engages, bombs land on point; pineapple 0->8 live spikes on
  hurt; zero errors. "Ability buttons" is now an approved pattern
  (Vic + Kevin). DOCS refreshed for the mother-session handoff:
  briefs 2 confirms Mark's chunk-order framing (fixed city =
  ordered 512px chunks, ring-streamed, flat memory); archetypes
  doc marks both reworks shipped. Mark is handing the two docs to
  the mother session now (SFX voice table + story/map briefs
  expected back).

- **2026-07-27 - v0.14.8: PULL-SLAM FULLY CUT (Mark: "I don't like
  the telegraph and slam shockwave for Josh, it doesn't make
  sense").** The whole Task-9 pull/slam block is gone from
  LassoWeapon (JOSH_PULLSLAM flag retired=false); the lasso is now
  PURE spinning-loop damage - it winds up once at run start
  (spinup 0.25 -> 1 over ~1s) and then just swings. Josh's kit
  masterize (dizzy on loop touch) unchanged. Bot rolls 66/4 - his
  variance is engagement-dependent (fleeing bot sometimes outruns
  the swarm entirely); constant loop uptime replaces slam burst,
  net similar. His identity is now entirely the level-growing
  cowboy loop.

- **2026-07-27 - v0.14.7: MARK'S FIRST REAL PLAYTEST SWEEP (died
  ~3:30 twice; long voice-note feedback).** SHIPPED FIXES: (1)
  classic Pocket Sentry turrets = real sig_turret art (were tinted
  crates - "still look like little boxes"). (2) Lasso pull REMOVED
  (Mark: "some function that sucks enemies in... I don't know what
  that's about") - telegraph + slam cycle stays, no suction. (3)
  Comet Call: NEVER fires off-screen (waits, retries 0.3s until a
  foe is visible - no fallback), falls STRAIGHT DOWN (spawn directly
  above, rotation -PI/4 verticalizes the diagonal art), slowed 200
  ->330ms. (4) Supply crates spawn only OFF-SCREEN (worldView edge
  + 40-100px). (5) XP curve softened 1.35/3 -> 1.30/2 ("3 minutes
  and I'm level 6 barely"). (6) COMET BEAM (classic, inheritable)
  golden pierce-bolt identity (tint+scale) - "just a copy of
  Danny's laser". (7) FIDELITY: real PixelLab art for gem_small/
  med/gold (faceted crystals) + proj_resizer (glowing cyan bolt) -
  pipeline: gen 48 -> alpha-threshold -> content-crop -> NEAREST to
  registry size. NEW DOCS for the mother session (Mark requested):
  docs/MOTHER_SESSION_BRIEFS.md (SFX synth architecture breakdown +
  data-driven voice-table proposal; map/chunk system context + max
  quest-map size answer = 8192px ceiling / 4096px recommended slice;
  asset quality pipeline rule) and docs/ABILITY_ARCHETYPES.md (full
  taxonomy, doubling-up audit - headline: Pineapple should become
  pure RETALIATION, dropping the third player-ring; Beam may need
  held-line laser if gold pass insufficient). ROADMAP ADDED: STORY
  MODE / QUEST MAP (per-hero missions on a large unique map,
  portrait-driven objectives, compass; vertical slice = Danny,
  flooded city, 4096x4096). NOT yet done: per-ability SFX voices
  (awaiting mother-session architecture), Pineapple rework (awaiting
  Mark approval), Josh loop epicycle polish (Mark: "first stage
  works well" - parked). Deaths at ~3:30 on two heroes noted:
  difficulty is per design (meta-shop investment is the loop), but
  watch after XP softening.

- **2026-07-27 - v0.14.6: DEV MODE MADE BULLETPROOF (Mark: "the dev
  mode isn't working").** v0.14.5's ?dev=1 likely failed on-device
  via CDN cache or a dropped query string (mobile browsers/home-
  screen links eat queries). Now THREE ways in: `?dev=1`, `#dev`,
  or the SECRET TOGGLE - tap the version stamp 5x fast on any menu
  (generous hit area) -> flips `portioncontrol.dev` in localStorage
  + reloads. Dev is STICKY once activated (persists on the plain
  URL until toggled off the same way). Verified headless: query on,
  sticky on plain URL, 5-tap-equivalent off, hash on. HARNESS TRAP
  (twice now): addInitScript localStorage.clear() runs on EVERY
  navigation - seed-once guard required; and same-page #hash
  navigation doesn't re-run scripts (go via about:blank).

- **2026-07-27 - v0.14.5: DEVELOPER MODE via ?dev=1 (Mark: "give me
  an admin version... everything unlocked so I could test").**
  config.js: `PC.DEV_MODE` from the URL query -> DEV_ALL_UNLOCKED
  true + gold topped up to $50k (only if below); version stamp
  shows red bold "vX.Y.Z DEV". The PLAIN URL stays the real player
  experience (verified: same browser, dev URL = 6/6 heroes + $50k,
  plain URL = danny only). Session-scoped by URL, nothing dev
  persists except the test gold.

- **2026-07-27 - v0.14.4: LASSO FINAL FORM - LEVEL-DRIVEN COWBOY
  SWING (Mark: "tiny loop swings WIDE around him... every time he
  levels it up, it increases the size of the loop and brings it in
  ...the bigger it gets, the closer it comes").** Geometry now keyed
  to WEAPON LEVEL, not spin-up: `k=(level-1)/(max-1); loopR=(16+
  (r-16)*k)*(0.35+0.65*spin); orbit=(r-loopR)*(1-k)`. L1 = small
  loop swinging WIDE at rope's end (threat range ~r but thin
  coverage); each level grows the loop and reels the swing inward;
  L5 = the complete circle centered on him. Post-slam spin-up now
  only TIGHTENS the loop briefly (vulnerability window preserved).
  Rope+knot attached at every stage; damage = the drawn loop.
  Tuning: base dmg 9->10 to keep L1 viable (bot rolls 23/40, mean
  ~32 = mid-pack; 13 at dmg 9 too thin, 72 at dmg 11 too hot).
  Verified L1/L3/L5 freeze-frames. This is the FOURTH lasso
  iteration and Mark's spec is now fully expressed - don't rework
  the geometry again without new direction.

- **2026-07-27 - v0.14.3: LASSO COWBOY SWING (Mark's final read:
  "small rotating circle at the end of a rope... revolves around
  him like a cowboy... gradually the circle gets bigger and the
  arc centers more around the player until it's a complete circle
  round").** One geometry change over v0.14.2: the loop's orbit is
  now `orbit = (1-spin) * (loopR + 12)` - at wind-up the tiny loop
  swings CLOSE around his body on a short rope; as spin grows the
  loop expands while the swing center converges onto the player,
  ending as the full circle around him (rope + knot attached
  throughout; damage = the drawn loop, unchanged). Verified
  freeze-frames both states; probe 160 hits/5s on the dummy
  annulus; bot band ~25-53 kills across re-rolls (one 4-kill
  outlier = bot wandered into empty streets, not a regression -
  re-roll 29). Balance holds mid-pack.

- **2026-07-27 - v0.14.2: LASSO MORPH (Mark: "begins as a small
  rotating circle at the end of the lasso which gradually ends at
  the full loop around").** Replaced the partial-arc rework with
  the real-lasso morph: the rope from Josh's hand ends in a CLOSED
  loop that starts tiny (7px) twirling FAST at the rope tip, and
  grows as it spins up until loop center converges on Josh and
  loopR = full radius (the geometry: center = player +
  dir(lead)*(r-loopR), so the morph is one continuous expression).
  Damage = whatever the drawn loop touches (no more angle gating -
  the small-loop wind-up after each slam IS the vulnerability
  window). Boss check follows the loop too. Balance re-run: josh
  53 kills/11 dmg (was 72 OP; bot variance 31-53 across runs) -
  mid-pack beside kevin 51/carlos 60, CC identity intact.
  Verified freeze-frames: small loop at hand + grown full loop.

- **2026-07-27 - v0.14.1: THE BALANCE LAB (Mark: "create agents to
  try each character... break down the math... Carlos comets
  off-screen... Josh too OP + lasso visual... Nayah too short
  range").** NEW scratchpad harness `balance-bots.js`: every hero
  plays the SAME 100s with the SAME kiting bot (flees weighted
  enemy centroid, auto-picks first card, taps Vic's deploy),
  measuring kills/dmgTaken/minHp/level. BASELINE FINDINGS:
  victoria 84 kills/0 dmg (top, untouched), josh 72/11 (confirmed
  OP), carlos 60/23, kevin 51/12, nayah 22/0 (confirmed weak),
  danny 15(!)/6 - ROOT CAUSE: aimAt's cone tracks MOVEMENT
  direction, so the kiting playstyle fired AWAY from chasers.
  CHANGES SHIPPED: (1) aimAt over-the-shoulder fallback (cone miss
  -> nearest foe any direction): danny 15 -> 85. (2) CARLOS:
  comets target the farthest foe INSIDE cam.worldView (pad 14/44),
  off-screen only when nothing visible - the comet always lands
  on-screen. (3) NAYAH buff: reach 58->78, TWO fists from L1
  (L5 = 3), dmg 9/13/18: 22 -> 65 kills, still 0 dmg taken
  (lifesteal identity works). (4) JOSH rework + nerf: lasso now
  drawn as a rope from his hand to a SPINNING PARTIAL ARC that
  closes into a full loop as it spins up (Mark's spec); damage only
  along the DRAWN arc; every slam resets spin-up to 25% (1.4s
  vulnerability window); pull radius rMax+34 -> +26. TUNING
  LESSON: slam 2x->1.7x collapsed him to 8 kills - a THRESHOLD
  effect (slam stopped one-shotting scaled fries, flinging 1hp
  survivors out of reach); restored 2x, kept the other nerfs ->
  31 kills / 5 dmg = mid-low with heavy CC utility. FINAL LEAGUE
  (100s kiting bot): danny 85/0, vic 84/0, nayah 65/0, carlos
  60/23, kevin 51/12, josh ~31. OBSERVATION (not a bug): ranged
  killers (vic/kevin/carlos) stayed LEVEL 1 - their kills drop
  gems far away and the kiting bot never walks back; melee-ish
  heroes leveled. Real players collect better; watch it on-device.
  Lasso probe harness `probe-lasso.js` (16-dummy annulus ring, 144
  hits/5s verified).

- **2026-07-27 — v0.13.0: TITLE SEQUENCE + SHARPNESS + LAB UI +
  HERO UNLOCKS (Mark: "high quality... Megaman X... metal doors...
  heavy duty security lab... text still blurry... characters
  unlockable all except the first").** (1) SHARPNESS ROOT CAUSE:
  SCALE was locked 2 but iPhones are DPR 3 -> final 1.5x CSS
  upscale = the blur. SCALE now = clamp(round(devicePixelRatio),
  2, 3) (DPR_CAP 3); a 3x phone renders 1:1 device pixels. (2)
  TITLE SEQUENCE (title.js rewrite): sealed riveted bulkhead
  (3 new PixelLab textures: ui_door_plate steel / ui_hazard
  stripes / ui_emblem = glowing cyan FORK security badge) with
  pulsing red lamps + "SECURITY LAB - SEALED" -> clank + shake ->
  hiss, doors slide apart revealing the lab interior (light
  falloff, receding grid, ceiling glow, dust motes) -> PORTION /
  CONTROL steel plates FALL in with impact shake + sparks (layered
  extrude/face/highlight text on beveled scanlined plates + pulsing
  underglow) -> menu powers on (portrait marquee on a steel shelf,
  riveted panel buttons). Any tap skips. New audio: clank + hiss.
  (3) PC.labPanel(g,x,y,w,h,opts) shared beveled-steel panel
  (drop shadow, top light, bottom occlusion, inner shadow, rivets)
  applied across title/select/shop/results. (4) UNLOCKS LIVE:
  DEV_ALL_UNLOCKED=false. PC.HERO_UNLOCKS unique conditions -
  victoria RESCUE (win D1, existing hook), kevin SURVIVE TO THE
  BOSS, nayah POP 750 SNACKS lifetime (live progress on her locked
  cell), carlos REACH LEVEL 8 IN ONE RUN, josh HIRE FOR $3000 (tap
  his locked cell). Lifetime stats in PC.meta (totalPops/bestLevel/
  reachedBoss/wonD1, recorded at die/win via recordRunStats);
  results runs PC.checkHeroUnlocks -> green NEW HERO UNLOCKED
  banner w/ portrait + fanfare. GOTCHA FIXED: setTintFill is a no-op
  on the canvas renderer - locked silhouettes now use setTint.
  HARNESS NOTES: WebGL-denial init script REQUIRED for timing-true
  headless runs (SwiftShader crawls Phaser timers ~1/4 speed -
  same documented gotcha as the platformer); harnesses updated for
  the PC_Title entry flow. Verified: full door sequence staged
  screenshots, fresh-save locks (danny only), nayah+carlos unlock
  via simulated lifetime stats + banner, shop/select panel
  restyle, all-26-weapons audit zero warnings. Heroes' unique
  ADVANTAGES remain their kits + owner mastery (heroes2/kits);
  unique unlock PATHS are new.

- **2026-07-27 — v0.12.0: WP-METASHOP + TITLE HUB (the "invest
  between runs" loop, PHASE2 7).** NEW: `src/data/powerups.js` —
  14 ranked permanent power-ups + `PC.meta` (ranks persist in
  `portioncontrol.meta`; gold stays in pickups' existing
  `portioncontrol.gold` key — extended, not forked). 10 food-flavored
  stat lines (BIGGER MUSCLES +4%dmg, QUICK HANDS -3%cd, RUNNING
  START, BIG APPETITE +10HP, LONG ARMS area, SNACK RADAR pickup,
  FAST FOOD shot speed, SHARP EYES +XP, LUCKY SPOON +gold, SECOND
  HELPING +1 proj flagship $4k) + 4 faith-themed authored per Mark's
  delegation (ARMOR OF GOD block, DAILY BREAD regen, MUSTARD SEED
  start-with-a-level-up $1.5k, AMAZING GRACE one revive/run at half
  HP — $8k flagship). COMPOSE-SAFE: meta multiplies hero* bases and
  adds meta* bases; the 6 overwriting PASSIVE formulas in weapons.js
  now fold meta* in, so an in-run card never wipes a purchase.
  NEW SCENES: PC_Title (wordmark, portrait marquee, START /
  POWER-UPS, gold) and PC_Shop (2-col grid, rank pips, affordability
  coloring, instant buy). Boot -> Title; select gains TITLE > back
  link. game.js: meta.applyAll after applyHeroKit, hp init includes
  bonusHp, die() consumes reviveCharges (half HP + crowd fling +
  nova + revive sting + AMAZING GRACE! float) before dead, mustard
  seed pops its free card at t+0.8s. goldMult applied in pickups
  (min 1/coin). VERIFIED headless: 6 buys deduct exactly, ranks +
  gold persist across reload, in-run heroDmg 1.08/hp 110/goldMult
  1.1, seed card opens at run start, revive at 55/110 then charge
  exhausts, zero frame warnings/errors. ECONOMY IS A KNOB: costs
  assume ~$300-800/run income; retune when Mark reports real run
  yields (spec target was 1-2k/run — may need coin value bump).
  NEXT: WP-SCRIPTURE (Mark delegated question authoring to Claude),
  WP-COLLECTIONS/unlocks, WP-LOOT.

- **2026-07-26 — v0.11.4: CACHE-SKEW ARMOR (Mark on-device: "Nope
  still there" — purple squares SURVIVED the v0.11.3 fix on his
  phone).** Diagnosis: my v0.11.3 fix was correct for the code, but
  the game is ~29 separate un-versioned JS files — Mark's device had
  a MIXED CACHE (new kits.js asking for `sig_bomb` + a stale cached
  assets.js registry without it -> missing frame -> giant purple
  first-frame fallback, persistent on his device only; unreproducible
  here because our fetches are always fresh). THREE-PART FIX:
  (1) index.html now defines `window.PC_BUILD` (THE single version
  bump point) and document.writes every script tag with
  `?v=PC_BUILD` — files can never skew across builds once index.html
  refreshes; (2) boot.js busts art PNG URLs the same way (portraits
  changed content under stable names — same trap); (3) buildAtlas
  reserves a guaranteed-transparent 4px `px_missing` frame
  (clearRect'd corner) and patches the atlas texture's `get` so ANY
  unknown frame renders INVISIBLE + logs `PC missing frame ->
  blank:` instead of the 160px purple D5 boss. config.js now derives
  `PC.VERSION` from PC_BUILD (bump ritual = edit ONE line in
  index.html). Verified: full 26-weapon audit clean, negative
  control shows blank+warning (not purple), stamp reads v0.11.4.
  NOTE for Mark's device: ONE more hard-refresh may be needed to
  pick up the new index.html; after that, staleness self-heals.

- **2026-07-26 — v0.11.3: THE PINK SQUARES BUG (Mark, on-device:
  "Kevin's ability has the pink squares still... thoroughly check
  all of them").** ROOT CAUSE: `fx.burst(x, y, prefix, frames, ...)`
  animates frames `<prefix>_1..n` — TEN call sites passed either a
  full frame name as prefix (`'fx_nova_1'` -> nonexistent
  `fx_nova_1_1`) or more frames than registered (`'fx_pop', 5` when
  fx_pop has 4). A missing atlas frame silently falls back to the
  atlas's first frame = the 160px BERRY-purple D5 boss -> giant
  pink squares flashing inside explosions. Kevin's strike boom had
  BOTH bugs, so every bomb flashed pink (my freeze-frame
  verification caught the bomb sprite but not the boom frames).
  Fixed all 10 sites (kits 63/143/240/241, heroes2 62/202/203,
  arsenal2 36/230, arsenal3 431). WHY EVERY EARLIER VERIFY MISSED
  IT: Phaser logs missing frames as console WARNINGS and the
  harnesses only captured errors. HARNESS LAW FROM NOW ON: capture
  console 'warning' + 'error'; scratchpad `audit-frames.js` grants
  ALL 26 weapons maxed at once, runs the swarm 20s, sweeps every
  registry key against the atlas, and was negative-controlled (a
  deliberately bogus frame DOES surface as `Texture "atlas" has no
  frame ...`). Current state: zero frame warnings, zero missing
  registry keys, zero page errors with all 26 weapons live.

- **2026-07-26 — v0.11.2: version stamp on EVERY screen + Kevin
  audit (Mark: "sure Kevin doesn't have placeholder on his ability?
  add the version number to all screens so I can tell").** New
  `PC.stampVersion(scene)` helper (main.js, next to
  applyRenderScale) — 8px steel text bottom-right, depth 999; called
  in select/results/gallery create (game scene already had its own
  verText; boot is a zero-frame pass-through). KEVIN AUDIT RESULT:
  clean on current build — falling bomb = real `sig_bomb` art
  (since v0.10.1), telegraph = intended danger-red vector ring,
  explosions = shared fx_pop/fx_nova bursts (all-weapon FX
  language, not Kevin-specific), icon = real crosshair
  (v0.11.0). If Mark sees a yellow streak bomb he's on a PRE-0.10.1
  CACHED build — the stamps exist precisely to diagnose that.
  Verified: bomb freeze-framed mid-fall in a Kevin run, stamps
  visible on select + results screenshots, zero errors.

- **2026-07-26 — v0.11.1: PORTRAITS REDONE FROM THE ELEMENT LAB
  CARDS (Mark: "the portraits kinda suck... base them on the cards,
  get the ethnicities right").** The v0.11.0 portrait-character-pro
  portraits re-synthesized identity from the tiny idle sprites and
  whitewashed the whole cast. THE FIX: the repo already carries the
  true likenesses — `games/element-lab/assets/cards/<hero>.jpg`
  (900x1250 card art). Pipeline: hand-tuned bust crop per card
  (frac coords in scratchpad pl script) -> 512x512 -> v2
  `/image-to-pixelart` (sync, output 128, **1 gen each** vs 25 for
  portrait-pro!) -> portrait_<hero>.png. Style CONVERSION not
  re-synthesis, so faces/skin/hair carry exactly; card backgrounds
  come along and read as mini trading-card portraits (on-brand:
  the cards ARE canon likenesses). Results screen: portrait scale
  0.6 + gold frame stroke. LESSON: for likeness-critical art,
  image-to-pixelart on real reference art beats every generative
  path - cheaper AND right. Balance ~1182/2000. All 6 verified
  in-game, zero errors.

- **2026-07-26 — v0.11.0: ICON + PORTRAIT ART WAVE (Mark: "do number
  one and two").** (1) CARD ICONS: every weapon key (26) and passive
  key (10) now owns a real icon frame `icon_weapon_<key>` /
  `icon_passive_<key>` — 36 pixflux one-shots at 48px NATIVE (no
  rescale; registry cells moved 24->48, card draw scale 1.6->0.8 =
  same footprint, 4x detail). PC.WEAPON_ICONS rewritten to a
  loop (was many-to-few reuse: lasso/cutter shared whisk, zap shared
  microwave, etc.); PASSIVES duplicator/slowcooker/leftovers got own
  icons (old icon_passive_capacitor + icon_weapon_soothe registry
  keys removed, grep-verified unreferenced). (2) PORTRAITS: all 6
  heroes via v2 `portrait-character-pro` (character_to_portrait,
  input = shipped idle sprite so identity is exact, result_size 128
  2K). COST WARNING: 25 gens EACH at 128 (150 total; submit returns
  HTTP 202 not 200, and a treat-202-as-failure bug cost one dup
  danny submit). PC.SIZE.PORTRAIT 96->128; old 96px portrait_danny
  deleted/regenerated; results.js lose screen now shows the SELECTED
  hero's portrait (scale 0.45). Manifest +41 keys. Verified
  headless: zero missing atlas frames, cards screenshot real icons
  (sprinkle jar / skillet / strike reticle), results shows Danny
  portrait, zero errors. Balance: ~1188/2000 generations remain.
  Remaining placeholder fronts: D2-D5 enemies/bosses/tiles/props +
  future title-hub art. NEXT: WP-METASHOP + title hub.

- **2026-07-26 — v0.10.1: SIGNATURE-WEAPON ART BATCH (doc §4 TODO
  cleared).** 5 PixelLab pixflux one-shots (1 gen each; balance
  1378.85 -> ~1373.85): `sig_sentrybot` 32 (Vic's hovering bot pal,
  cyan eye, faces east — code setFlipX handles west), `sig_turret`
  40 (tripod heavy turret, mustard warning stripes), `sig_comet` 48
  (golden fireball, head bottom-left / tail up-right — matches the
  (+24,-170)->target travel line so the streak needs NO rotation),
  `sig_bomb` 32 (Kevin's falling supply bomb), `sig_ketchup_shell`
  32 (glossy lobbed glob). All alpha-thresholded (a>=90). Wired:
  assets.js registry block ("signature-weapon props") + manifest 5
  keys; heroes2.js bot/turret/comet swapped off tinted
  pickup_crate/proj_resizer (tints+ADD blend+rotation removed - the
  art carries the look now); kits.js Kevin bomb + arsenal2.js
  ketchup shell likewise. Verified headless: both runs zero errors,
  atlas has all 5 frames, Vic's bot rides at frame sig_sentrybot +
  deploy spawns the real turret, comet freeze-framed mid-fall
  in-world (looks right at native scale 1). Remaining placeholders
  after this batch: weapon/passive ICONS (letter badges), hero
  PORTRAITS (portrait-character-pro is the tool), D2-D5
  enemies/bosses/tiles/props, results/gallery art. D1 in-run is now
  placeholder-free.

- **2026-07-26 — v0.10.0: HERO REWORK WAVE (Tasks 6-8 + Task 9, ALL
  flags approved by Mark).** NOTE: container recycled mid-session -
  repo re-cloned at default branch; recovered via checkout -B from
  origin (nothing pushed was lost; scratchpad node_modules needed
  reinstall). New `systems/heroes2.js` + flags in config
  (VIC_SENTRY_BOT / CARLOS_COMET_CALL / NAYAH_HAYMAKER / SALT_AURA /
  JOSH_PULLSLAM, all default true; legacy classes remain for
  flag-off AND for inheritance - other heroes drafting POCKET
  SENTRY/COMET BEAM/THORN SEEDS get the classics). VIC = SENTRY BOT:
  robot pal walks beside her firing aimed 3-round bursts (distinct
  from Gizmotron's orbit pecks) + THE GAME'S ONLY ACTIVE INPUT: a
  Vic-exclusive DEPLOY button (bottom-right, cooldown ring,
  stopPropagation so it doesn't grab the joystick) dropping a heavy
  turret; her masterize (cd*0.8/life*1.5) applies to deploy cd +
  turret life (verified 8.6s cd). CARLOS = COMET CALL: marker on the
  FARTHEST foe -> comet streaks down -> big impact (critBoost
  applies) + the column above takes 50%; evo METEOR SHOWER now
  literal (old beam evo renamed COMET BARRAGE). NAYAH = HAYMAKER
  FLURRY: rapid punches at nearest w/ LIFESTEAL + alternating
  punch-arc flashes; masterize +1 lifesteal; evo KNOCKOUT QUEEN
  (haymaker+fan). Also SWARM PROTOCOL (sentrybot+duplicator). SALT
  AURA rework: constant 0.4s tick, applies SEASONED (take +25% dmg
  from ALL sources 2s, amp applied in damageEnemy) - verified 117
  concurrently seasoned. JOSH PULL-SLAM: every ~5s rope telegraphs,
  PULLS crowd in 0.5s, then SLAMS x2 dmg + big fling (+0.8s dizzy w/
  stun mastery). Kit names updated on select screen. FPS: recycled
  container is ~10% slower baseline (control: plain Danny 54fps at
  389 foes canvas renderer); reworks cost ~3fps worst-case. TODO
  NEXT: PixelLab art for Vic's bot/turret + Carlos comet (doc §4),
  weapon list/HANDOVER arsenal doc refresh, then WP-METASHOP.

- **2026-07-26 — v0.9.4: VFX Tasks 3-5 (Danny shrink-ray, Kevin
  falling bombs, living fire).** All behind PC.VFX_V2. TASK 3: vfx
  gains `shrinkRing` (contracting muzzle ring); Resizer fires with
  it + every resizer bolt carries `shrinkFx:450` -> victims visually
  SHRINK to 0.82x for 0.45s (enemies.js waddle multiplies by shf;
  bullet hit sets e.shrinkUntil). Note: fries die in one resizer hit
  so shrink shows on tankier foes - verified 2 concurrent shrunk on
  a 500hp test swarm. TASK 4: Kevin's strafe booms are now BOMBS
  that visibly fall (160ms tween from y-85) then detonate; damage
  moved into the boom closure (timing +0.16s, mechanic unchanged);
  legacy instant path behind flag. TASK 5: Grease Trail is living
  fire - per-segment flicker (alpha+scale sin), color ramp by age
  mustard->cheese->ketchup, drifting ember bursts (rate-limited by
  fx pool). VERIFIED: 59fps at 370 foes, 0 errors. STILL AWAITING
  MARK: Task 6-8 flag rulings (Vic deploy button, bot-vs-Gizmotron,
  Nayah Haymaker, Carlos comets) + Task 9 leftovers (Salt aura
  debuff, Josh pull-slam, evolution-transform audit).

- **2026-07-26 — v0.9.3: VFX TOOLKIT (Weapons&VFX doc Tasks 1-2).**
  Doc reviewed with Mark; 4 design flags surfaced (Vic deploy button
  = first active input, Vic bot vs Gizmotron overlap, Nayah
  Haymaker signature swap, Carlos comet delivery) - AWAITING his
  rulings before Tasks 6-8. Tasks 1-2 executed: NEW `systems/vfx.js`
  (`PC.Vfx`, flag `PC.VFX_V2` default true): pooled telegraphRing
  (12, pulsing danger-red AoE preview), lingeringField (8,
  flickering translucent area - never solid), muzzleFlash /
  impactBurst (via fx.js tinted bursts), clamped shake(px<=3);
  one shared additive Graphics redrawn per frame; scene.vfx created
  + updated in game.js. ROUTING: Kevin's Rescue Strike telegraph is
  now a proper pulsing red reticle (nova-marker legacy path kept
  behind flag), Vic's turrets get a cyan deploy ring + muzzle
  flashes, Ketchup Artillery shows landing telegraph rings before
  shells hit, SPRINKLE SWARM recolored pink->CYAN (color-law
  violation: pink is enemy-only; Ketchup's red kept as thematic
  exception). Audited all 23 weapons: no raw rectangles remain (Vic
  turret crate sprite is real art, replaced in Task 6). VERIFIED:
  60fps at 347 foes with rings live; VFX_V2=false restores legacy
  marker at 60fps. NEXT (awaiting Mark): Tasks 3-5 (Danny shrink-ray
  look, Kevin bomb sequence, flame trail) can proceed anytime;
  Tasks 6-8 need flag rulings.

- **2026-07-26 — v0.9.2: ARSENAL COMPLETE — slice 3 (9 archetypes) +
  THE GIZMOTRON rename.** SNACK DRONE renamed THE GIZMOTRON (Mark);
  evo now GIZMOTRON ARMADA. BulletSystem gained additive behaviors:
  `boomerang` (outbound timer -> steer back to player, despawn at
  hand), `homing` (steer rad/s to nearest), `bounces` (ricochet:
  carom to another nearby enemy), `scale`, plus a 0.25s per-enemy
  re-hit throttle for piercing/returning/bouncing bullets
  (e.pierceCd). New `systems/arsenal3.js`: PIZZA CUTTER (boomerang),
  TOASTER ZAP (chain lightning w/ jagged gfx, dmg falloff 0.85^j),
  GREASE TRAIL (move-drop slick segments), JAWBREAKER (ricochet),
  SPRINKLE SWARM (radial homing burst), SKILLET SWING (directional
  melee arc + gfx wedge flash), VORTEX MIXER (pull-together
  enabler), ESPRESSO CANNON (charge-while-still, release on move),
  PINEAPPLE GUARD (aura + retaliate on scene.lastHurtT, set at both
  player-hurt sites). 9 evolutions: PIZZA STORM, TESLA TOASTER,
  INFERNO TRAIL, WRECKING JAWBREAKER, SPRINKLE STORM, FRYING FURY
  (360 pan), SINGULARITY BLENDER, RISTRETTO RAILGUN (instant
  charge), FORTRESS FRUIT (heals on payback). TOTALS: 23 weapons /
  10 passives / 23 evolutions - ArsenalExpansion doc fully
  implemented except Lucky Ladle (waits for WP-LOOT rarity/reroll).
  VERIFIED: two full loadout batches at 59-60fps under 340+ swarms,
  SPRINKLE STORM + RISTRETTO RAILGUN evolve correctly, 0 errors.
  NEXT: WP-METASHOP + WP-COLLECTIONS title hub, then WP-SCRIPTURE.

- **2026-07-25 — v0.9.1: ARSENAL SLICE 2 — Mark's three named
  weapons + evolutions.** New `systems/arsenal2.js`: KETCHUP
  ARTILLERY (tween-lobbed shells onto a ranged cluster -> AoE burst
  + pooled slowing puddle, player-cherry tint to stay distinct from
  boss ketchup), MICROWAVE BEAM (rotating sweep corridor, per-enemy
  0.4s tick via e.mwCd, graphics beam + end blob, boss corridor
  check), FRIDGE WALL (perpendicular-to-aim chilled segment,
  soft-block = 0.4s dmg tick + strong perpendicular shove + chill
  slow; 3 placed walls max). Evolutions: CONDIMENT STORM
  (ketchup+servo), PLASMA CAROUSEL (microwave+lens, twin beams),
  BUNKER FRIDGE (fridge+coat -> orbit:true, 4 walls circle the
  player - finally gives Padded Apron an evolution). All in the
  shared card pool. Pool now 14 weapons / 10 passives / 14
  evolutions. VERIFIED: 107 kills in 7s with the loadout, 61fps at
  293-foe swarm (canvas renderer), BUNKER FRIDGE offer+apply+orbit,
  0 errors. REMAINING from the ArsenalExpansion doc: slice 3 = 9
  archetypes (Pizza Cutter boomerang, Toaster Zap chain, Grease
  Trail, Jawbreaker ricochet-off-enemies, Sprinkle Swarm homing,
  Skillet Swing melee, Vortex Mixer pull, Espresso Cannon charge,
  Pineapple Guard retaliate) + their evos + Lucky Ladle (with
  WP-LOOT).

- **2026-07-25 — v0.9.0: ARSENAL EXPANSION SLICE 1 (from Mark's
  ArsenalExpansion doc, saved decisions).** Doc reviewed vs code: no
  conflicts; 4 adaptations agreed - Lucky Ladle DEFERRED (needs
  rarity/reroll machinery from WP-LOOT), Carlos §B reworded (his
  global crit already covers everything; flavor = beam critBoost
  +10% extra), Fridge Wall will soft-block (knockback) not
  hard-block, Jawbreaker ricochets off enemies not "edges".
  SHIPPED: 3 new passives (DUPLICATOR TRAY +1 proj/rank max2 ->
  stats.extraProj consumed by resizer/blaster/beam/freeze; SLOW
  COOKER +25% duration/rank -> stats.durMult on turret life + patch
  life; LEFTOVERS +15maxHP +0.5regen/rank -> stats.bonusHp/regen,
  maxHp clamps updated in heal card/medkit/HUD, regen tick in
  update). 6 FLAVOR MASTERIES via kit.masterize (owner-only, on top
  of +25%): Danny bolts shrink/slow 900ms, Vic (existing), Nayah
  patches root 0.7s, Kevin +2 strafe passes (bonusPass, safe vs
  applyLevel overwrites), Carlos beam critBoost, Josh ring dizzies
  0.5s. 5 SIGNATURE EVOLUTIONS in data/evolutions.js: SENTRY SWARM
  (sentry+duplicator), JUNGLE BLOOM (seeds+slowcooker), CARPET
  RESCUE (strike+battery), METEOR SHOWER (beam+duplicator), CYCLONE
  TITAN (lasso+servo). Passive count 7->10, evolutions 6->11.
  VERIFIED: all masteries land, passives measurably applied, CYCLONE
  TITAN offered as golden card, regen works, 53fps at 392 foes on
  worst-case canvas renderer. NEXT SLICES from the doc: (2) Ketchup
  Artillery + Microwave Beam + Fridge Wall + their evos, (3) the
  remaining 9 archetype weapons (boomerang/chain/trail/ricochet/
  homing/melee/pull/charge/aura) + Lucky Ladle with WP-LOOT.

- **2026-07-25 — v0.8.1: SIGNATURE INHERITANCE + OWNER MASTERY (new
  Mark design, NOT in PHASE2 - confirmed to him).** All six hero
  signature weapons now appear in the shared level-up card pool
  (SIGS list in drawCards, own signature excluded since you start
  with it) - any hero can inherit a teammate's weapon mid-run. The
  OWNER's copy carries SIGNATURE MASTERY: `w.mastery = 1.25` (+25%
  power at every level, applied at every damage-calc site via
  `this.dmg * (this.mastery || 1)`); per-kit flavor mastery via
  `kit.masterize(w)` where fields are never overwritten by
  applyLevel (Victoria: deploy cd x0.8, turret life x1.5 - other
  kits' extra flavors TODO, dmg-only for now since their level-ups
  set cd/count/radius absolutely). Emergent bonus: inherited
  Resizer + Focus Lens still evolves to MEGA RESIZER for ANY hero.
  Card pool now ~18 distinct candidates (6 signatures + 5 generic
  weapons + 7 passives) for 4+4 slots. VERIFIED: Josh lasso mastery
  1.25 + full foreign-sig pool; Victoria sentry cd 5.6/life 21.
  TODO next in this thread: signature evolutions for the other 5
  heroes, flavor masteries for Nayah/Kevin/Carlos/Josh, "a bunch
  more" weapons (Mark) - candidates: ketchup lob artillery,
  microwave sweep beam, fridge wall.

- **2026-07-25 — v0.8.0: BUILD-CRAFTING UPDATE (WP-EVOLUTIONS pulled
  forward per Mark: "the fun is choices + combos").** Card pool grew
  from 3 weapons + 3 %-passives to: WEAPONS x6 pickup (Resizer,
  Blaster, Whisk + NEW Salt Shaker garlic-nova w/ expanding ring
  visual, Snack Drone orbiting pet that pelts nearest, Freeze Ray
  that SLOWS 45% w/ cyan tint - enemies.js slow + bullet slowMs/tint
  support) + hero signatures; PASSIVES x7 (battery/fan/shoes + NEW
  Snack Magnet +20% pickup, Focus Lens +15% shot speed, Servo Motor
  +12% area, Padded Apron flat armor). New stats plumbing: projMult
  (BulletSystem), areaMult (whisk/salt/seeds/lasso/strike),
  pickupMult (gems call), armor (contact + boss contact - boss now
  also respects Josh's dmgTakenMult, was a gap). EVOLUTIONS
  (`src/data/evolutions.js`, data-driven): maxed weapon + partner
  passive GUARANTEES a golden pulsing EVOLVE card in slot 1 -
  MEGA RESIZER (resizer+lens), TORNADO WHISK (whisk+servo), BUFFET
  BLASTER 360-ring (blaster+battery), SEASON STORM (salt+magnet),
  BLIZZARD RAY (freeze+fan), WINGMAN SQUAD (drone+shoes). applyCard
  'evolve' plays PC.audio.evolve + burst + shake. VERIFIED: full
  4-weapon build, passives measurably applied, evolve card offered +
  applied (MEGA RESIZER dmg40/x3/pierce3), 60fps at 400 foes.
  Signature-weapon evolutions for the other 5 heroes = future round.

- **2026-07-25 — v0.7.4: WP-JUICE SHIPPED.** New `systems/juice.js`:
  pooled DAMAGE NUMBERS (24 texts, ~14/s rate limit, rise+fade 0.45s,
  crits bigger + cherry, fed from the single PC.damageEnemy path +
  hitBoss; toggleable + persisted `portioncontrol.settings`),
  pooled PROJECTILE TRAILS (70 additive sparks, 45ms cadence per
  bullet, cap-drop never grow), GEM SHIMMER (sin scale pulse in
  gems.update). Select-screen panel renamed [ SETTINGS ] and gains a
  DAMAGE NUMBERS ON/OFF row. Enemy squish/waddle already existed
  (ARTDNA) - not duplicated. Verified: 60fps at 384 foes with juice
  on (canvas renderer), toggle persists, 0 errors. NEXT:
  WP-METASHOP + WP-COLLECTIONS (title hub, permanent gold power-ups),
  then WP-SCRIPTURE (Claude authors ~150 questions, Mark reviews),
  EVOLUTIONS/LOOT, ENVFIDELITY, DISTRICT2.

- **2026-07-25 — v0.7.3: on-device UI misposition FIXED + music
  default 10% (Mark).** Mark's phone screenshot showed level-up
  cards/HUD/version tag drifting off toward the top-left mid-run —
  scrollFactor(0) UI under a ZOOMED camera mispositions once the
  camera scrolls (menus were fine; my headless checks never eyeballed
  the in-run HUD - lesson: screenshot the GAME scene after movement).
  FIX: all in-run screen-space UI now lives in `scene.ui`, a
  world-space container pinned to `camera.worldView.x/y` every
  update; children keep plain logical coords; `scene.uiAttach(obj)`
  is the API (joystick gfx, HUD set, cards, banners, boss bar all
  attached; setScrollFactor(0) removed from game.js/input.js).
  Verified: player at (678,-493) with cards open — everything
  centered/cornered correctly. AUDIO: default music volume 0.35 ->
  0.10 (Mark), with a v:2 save migration that preserves a user's
  custom SFX but resets music to the new default once.

- **2026-07-25 — v0.7.2: SHARPNESS FIX (Mark: "text fuzzy, edges
  soft").** Root cause: the canvas backing store was the LOGICAL size
  (340xH) CSS-stretched ~3x to the phone — text/vector could never be
  sharp. Fix = PHASE2 4-B internal render scale: `PC.RENDER.SCALE=2`;
  canvas = logical*2; every scene calls `PC.applyRenderScale(this)`
  (camera setZoom(2) + centerOn) so ALL layout stays in logical
  coords; global Text factory patch defaults `style.resolution=2`
  (dense glyph canvases under the zoom = crisp text); vector Graphics
  (HUD, rings, telegraphs) render at 2x automatically; sprites get a
  clean integer 2x. GOTCHAS BAKED IN: (1) with camera zoom, scrollX
  is NOT the visible left edge — every visibility window
  (ground chunks, enemy cull + spawn ring centers in enemies.js /
  spawn.js) now uses `cam.worldView`; (2) raw pointer coords are in
  canvas px — joystick (input.js), audio sliders, gallery paging
  divide by SCALE; interactive-zone hit-tests need nothing (camera
  transforms them). Danny kit renamed RESIZER RAY (fits cell +
  matches his actual signature). VERIFIED (canvas renderer, worst
  case): 59fps at 388 live enemies, joystick drag moves player,
  select/game screenshots visibly crisp. NOTE: headless WebGL
  (SwiftShader) reads ~31fps — that is a harness artifact, not real
  device perf; always force-canvas for fps comparisons.

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
