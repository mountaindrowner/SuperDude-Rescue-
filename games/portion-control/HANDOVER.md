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

- **2026-09-02 - v0.73.0 -> v0.78.0: MARK'S PLAYTHROUGH PATCH (the big
  list, stopped at the park mission).** Six ships, one per workstream.
  Every item on the list is in; the "apply to the rest of the game"
  half is mostly already true (park/suburbs/labs/sewers/tower all had
  layout-engine set pieces; Central was the odd one out).
  * **v0.73.0 quick fixes.** All 53 em dashes purged from dialogue
    (missions 1-7, scripts, quest chant lines). `PC.RENDER.BASE` 400 ->
    440 (10% zoom out). Danny's Resizer cd 0.55 -> 0.69 (25% slower;
    level-4 step 0.45 -> 0.56). Vic's Sentry Bot bursts 1.1 -> 1.5s
    (L2 0.85 -> 1.15), deployed turret 0.25 -> 0.42s. DEPLOY button
    sits a full MAP-button height above the MAP pad, radius 20 -> 25,
    positioned from PC.SAFE/uiK. **Corner start root cause**: the camera
    follow began while the player sprite was still at (0,0), so the
    lerp opened on the map corner and panned to the spawn; the sprite is
    now placed and the camera snapped BEFORE startFollow (game.js).
    Coins redrawn as minted coins (rim, inset ring, pixel $, highlight)
    and they spin while idle (pickups.js).
  * **v0.74.0 newscast.** CRT power-on is a centred graphics redraw
    (a tweened Rectangle grew from its corner - that was the "off
    screen" bug). The story-graphic inset is a real PiP (`_paintPip`:
    framed window + label strip; kinds 'ray' / 'anchor' / any
    portrait). The Ray is a FOUNTAIN: `floodburst` runs a looping
    emitter (capped at ~26 live stills, freed on landing) until the
    footage changes; `clearFootage` kills it; the emitter glow throbs
    in update(). **Day 2 returns to the desk** (`news_desk_danny`: Danny
    in the PiP) and then flips to `danny_live` (Danny big in the garage,
    anchor in the PiP) with a new line calling every teammate by name.
    Scripts.js beats rewritten accordingly.
  * **v0.75.0 Central District set pieces** (region.js id branches):
    City Hall = capitol (limestone wings, pink-granite dome on a
    columned drum, colonnade, grand stair with red carpet, flags);
    Bloom Tower = stepped high-rise (4 setback tiers with deep shadow,
    pink window bands, rooftop garden + helipad, spire beacon, B
    mark); Garage (corrugated roof, skylight strip, dish, cyan antenna
    masts, SD bolt, tyres/crates, wide roll-up door, oil stain); Sal's
    (rooftop marquee billboard, giant cup mascot, string lights,
    green scalloped awning, produce crates); Diner (chrome banded
    roof, neon EAT sign box, hot-dog pole sign, checkerboard band,
    booth windows, jukebox glow); Frostbite Bank (frost panels, huge
    vault dial, giant $ and snowflake, HVAC, colonnade, icicles, lit
    holding pad). **THE SUBSTATION is an OPEN fenced yard now**
    (`_substationLayout/_substationSolids/_paintSubstation`): 3 rows
    of transformer units with walking gaps and a clear centre aisle
    (the defend pad), lattice pylons with sagging wires, bus bars,
    control shed, chain-link fence with a south gate + DANGER sign.
    Its furniture is COLLISION via `region.extras` (new hook in
    chunkSolids). **Central Plaza has a RING ROAD** (kerbs, asphalt,
    dashed centre line following the organic outline, crosswalk stubs
    at the street mouths, inner sidewalk ring, raised terrace with a
    shadowed riser, lamp posts). **Vic's cage stands at the bank door
    from mission start** with her greyed inside (quest.js constructor);
    `rescueSequence` cracks that same cage.
  * **v0.76.0 THE LINEAR LOOP.** mission complete -> `PC_Cutscene`
    mode 'comms' (TEAM LINK: big facing portraits, speaker lights up
    and leans in, others dim; cast of 2-3, surprise speakers take the
    centre slot) -> `PC_Upgrade` (UPGRADE STATION, new scene: PASSIVES
    tab = PC.POWERUPS priced in TECH; GEAR tab = every hero's signature
    rank + gadgets priced in GOLD; payout strip; NEXT MISSION) ->
    `PC_Missions` with `autoBrief` opening the next brief. Debrief
    scripts live in `src/data/story/debriefs.js` (stage1..7); stage1
    carries Vic's worked TECH/GOLD example; stage6/7 plant WHY THE
    TOWER (every district feeds power up one line to the roof; the
    Ray is growing a body there; the only route past the flood is
    Nayah's tunnels into the lobby). **ECONOMY FLIPPED per Mark**:
    TECH -> passives (costs /5), GOLD -> gear (garage ranks 120/240/
    400, Hydro-Drill $300). Mission Board landmark removed from map1;
    freeroam.js dropped from the loader (file kept, unused). Old
    PC_Shop / PC_Garage scenes still exist but nothing routes to them.
    Tutorial pad page 5 + Vic's radio line teach the new split. Finale
    results card reads ADVENTURE CITY SAVED with the six portraits. XP
    curve eased (FIRST 5 -> 7, CURVE_MULT 1.30 -> 1.36) for "abilities
    too fast". Chain finale blurb rewritten.
  * **v0.77.0 MUSIC SETS.** 19 of Mark's platformer tracks copied into
    assets/music as sets: city(3) park suburb labs sewer tower boss
    chomp story title menu results gameover. `PC.audio.startMusic(set)`
    is idempotent per set and crossfades between sets; a refused
    pre-gesture play() no longer triggers the synth (unlock replays the
    wanted set). Hooks: game.js create picks the set from
    `region.def.fabric`; spawnBoss -> 'boss'; CHOMP (confront.js +
    retry) -> 'chomp'; title/missions/upgrade/results/gameover; cutscene
    `music` beats play the story track (synth pads only if the MP3 is
    missing). Verified: every set switches, every MP3 200s.
  * **v0.78.0 MISSION AUDIT.** Stage 1 fuses, stage 4 crates and stage
    5 kids are HOLD-to-take under guard swarms; stage 2 boosters became
    an ORDERED relay sequence (garage -> city hall -> tower); stage 3
    vents are an ordered sequence (greenhouse first, as Vic says).
    Nayah's "suicidal" line sanitized.
  * **Harness notes**: scratchpad probes (all fresh-page, WebGL denied,
    402x874): probe-start, probe-cutscene, probe-landmarks (teleport +
    zoom per lot), probe-flow (force `quest.complete()` -> debrief ->
    upgrade buys -> auto brief), probe-music, probe-missions. Git MUST
    run from the repo root (`games/portion-control` cwd breaks
    pathspecs).
  * **Open**: Mark to review all new copy (debriefs, relay/vent lines,
    Danny's team call-out); the economy numbers are a first cut; the
    old shop/garage scenes can be deleted once nothing else needs them.

- **2026-08-08 - v0.72.0: VIBRANT FROSTING, BIGGER BOSSES, GLOOP'S BAD
  FRAMES CUT.** Mark: "make sure the cake's frosting attack is vibrant
  multicolor; the vending machine should be much bigger; goop's attack
  frames are bad, don't use, and make him bigger; then update all our
  essential files."
  * **THE FROSTING BUG - AND THE GATE THAT HID IT.** The v0.65 "make it
    multicoloured" change set a per-blob TINT... on `fx_puddle` art that
    is painted KETCHUP RED, and Phaser tint MULTIPLIES. Cyan x red =
    muddy red. The frosting had never actually been multicoloured on
    screen, and **my gate passed it anyway because it asserted
    `img.tintTopLeft` - the tint NUMBER, not the rendered pixel.** Same
    class of mistake as the invisible Gloop King (asserting
    `sprite.visible`). Fixes:
    - 'slow' puddles are now DRAWN in the gfx layer (deep pool +
      full-opacity core + highlight) in their true colour; only Frank's
      damage puddles still use the red art, where red is correct. This
      also fixes the gloop slick, which had been muddy-red too.
    - Palette went pastel -> CANDY: hot pink / yellow / cyan / green /
      purple / orange. Sprinkles doubled to 14 per puddle, bigger, full
      opacity, white added.
    - Sprinkles are gated on `party` (an array tint = frosting), so the
      sewer slick never gets birthday sprinkles.
    - **The gate now samples REAL CANVAS PIXELS** in a ring around each
      puddle: >=80% must be vivid (channel spread >=60, brightness
      >=110) across >=2 distinct hue buckets. Verified live:
      15 samples, 14 vivid, 2 hues.
  * **VENDING BEHEMOTH baseS 1.75 -> 2.35** (much bigger; hitbox
    untouched).
  * **GLOOP KING baseS 1.45 -> 2.05**, and his `anims` map is GONE -
    the rejected v3 attack frames are DELETED from disk, the manifest
    and PC.ASSETS rather than left dead in the atlas. Every state now
    plays his good 6-frame walk cycle; his channel/erupt reads come
    from the code poses already in his script (vent sag, spiral lean,
    erupt stretch). Gate asserts the frames are absent AND that
    `PC.BOSSES.gloopKing.anims` is undefined.
  * **ESSENTIAL FILES UPDATED**: PIXELLAB.md gains a ★ PROVEN RECIPE
    section for the v3 boss pipeline (exact call sequence, the 6-frames
    -in-a-4-frame-request quirk, pad-never-scale, valid template ids,
    library persistence, the proxy-reset/double-bill trap, and what
    three failed approaches looked like). COMPENDIUM.md's boss art rule
    now reads 4- OR 6-frame with `walkFrames` declaring it.
  * All four suites GREEN: district-bosses (19 checks), arena, ending,
    roof-fight.


- **2026-08-08 - v0.71.0: BIGGER MACHINE, THE OLD CUPCAKE, AND IT
  HOPS.** Mark: "increase the size of the vending machine and let's go
  back to the previous cake and have the cake jump instead of walk."
  * Vending Behemoth baseS 1.45 -> 1.75 (hitbox unchanged).
  * Cake art REVERTED to the v0.69 frames (git checkout from 66f67a6 -
    the approved striped-wrapper cupcake identity, 4-frame set); the
    v3 cake render is retired but its character stays in the PixelLab
    library if ever wanted. assets/manifest/def all back to 4 frames
    for cake; vend + gloop keep their 6-frame v3 cycles.
  * **THE HOP** (Cake script, 'active'): locomotion in LEAPS - 0.38s
    grounded coil (squash builds), 0.42s airborne arc toward the
    player (b.hopY lifts the BODY 46px while the chassis shadow stays
    grounded - that split sells the height), landing thud (shake +
    dust + splat). Ground covered per cycle matches the old drift
    speed exactly (hv = spd * 1.9), so the fight's balance is
    untouched; after the 60% split the hops get faster for free.
  * Chassis: scripts may set `b.hopY`; sprite position adds it, shadow
    ignores it.
  * Gate: hop check (airborne phase seen, lift < -20px, grounded rests,
    net displacement) + frame-count table per boss (cake 4, vend/gloop
    6). district-bosses + arena GREEN.


- **2026-08-07 - v0.70.0: V3 CHARACTER PIPELINE - THE BOSSES REALLY
  WALK.** Mark (with screenshot proof at v0.69.0): "they stretch and
  waddle but they don't walk. Not like Big Frank. Make new assets
  using PixelLab v3 and create animations." He was right - the v0.69
  animate-with-text frames only shuffled a few pixels.
  * **THE V3 PIPELINE (first use in this project)**: `POST /v2/
    create-character-v3` with our reference sprite -> library-persisted
    character -> `POST /v2/animate-character {mode: 'template',
    template_animation_id, directions: ['south']}` -> professional
    skeleton-retargeted cycles -> `GET /characters/{id}/zip`.
    Templates used: `walking` (6 frames), `cross-punch` (-> lunge),
    `crouching` (-> rear/wind-up). REAL leg swings, identity locked.
  * Character IDs (in Mark's PixelLab web library as pc_boss_*):
    cake 7c2f6292, vend b3ffc166, gloop f617533c. A duplicate
    pc_boss_vend 5727c365 exists from a connection-reset retry -
    harmless, deletable from the library.
  * All three walk cycles + matched rear/lunge installed, padded to
    128 canvas (v3 outputs 116/124 - pad, never fractional-scale).
    New-look v3 renders (sanctioned: "make NEW assets") - the cupcake
    is the best it has ever looked.
  * Engine: per-def `walkFrames` (6) + assets.js per-entry frame count
    + manifest walk_5/6 lines + fps scaled so the cycle keeps its
    cadence. baseS 1.45 for vend/gloop compensates canvas padding.
  * LESSONS: v2 calls need retry wrappers (the egress proxy resets
    connections ~1 in 10 - and a reset AFTER create still billed and
    created the character: check /characters before re-creating).
    Template ids are per-template validated - 'attack' is not in the
    mannequin catalog; 'cross-punch' is.
  * Gates: distinct-frames check extended to all 6 frames; atlas guard
    knows the per-boss frame counts. district-bosses + arena GREEN.
  * Meter: ~830/2000 generations.


- **2026-08-07 - v0.69.0: REAL WALK CYCLES (the Frank pipeline).**
  Mark: "none of them walk - they squish and wobble. Is generating a
  walking animation not possible like you did with Big Frank?" It is -
  Frank's walk came from `/animate-with-text`, and the remade bosses
  had only gotten init-image pose variants (near-clones). THREE rounds
  to land it, all lessons recorded:
  * Round 1 (generic description, default guidance): identity
    mutation exactly as PIXELLAB.md warns - the cupcake grew human
    legs with shorts, the vending machine became a pink CRT robot,
    the gloop turned demon-frog. Unusable.
  * Round 2 (FULL character description + `image_guidance_scale` 3.0):
    CAKE landed perfectly (4 on-model waddle frames) and GLOOP landed
    (crown slime, matches the installed D5 identity); vending still
    reinvented itself every frame.
  * Round 3 (+ `init_images: [ref] x 4` pinning every frame): VENDING
    landed - four consistent frames of the red snack machine with its
    legs clearly striding. **NEW RECIPE for rigid/odd-shaped subjects:
    full character description + image_guidance_scale 3 + init_images
    per frame.**
  * Vend + gloop rear/lunge re-derived from the new walk frames
    (strength-300 variants) so the whole family matches; ALL their art
    moved to the clean 64-grid at 128px canvas (slots 144 -> 128 in
    assets.js), with per-def `baseS` support in PC.Boss (1.29 for
    both) holding the old on-screen size. Hitboxes unchanged.
  * The code waddle stays but drops to an ACCENT (squash 0.07 ->
    0.045, sway 5 -> 3.5 deg) - the walk lives in the frames now.
  * NOTE FOR MARK: the vending machine's exact pixel identity shifted
    slightly with the new consistent cycle (still a red glass-front
    walking machine); the gloop walk now matches the crowned-slime
    boss art properly. Veto either and the old frames are one command
    away (git).
  * Gate: new pairwise-distinct check hashes all 4 walk frames of
    cake/vend/gloop from the PACKED ATLAS - the clone-frames bug
    cannot ship again. district-bosses, arena, ending all GREEN.
  * PixelLab meter: ~845/2000 generations remain.


- **2026-08-07 - v0.68.0: THE GAUNTLET AND THE ENDING.** Mark: "flesh
  out the seventeen floors - constant wave of enemies, with healing,
  just a basic gauntlet. And the ending - explosions and all kinds of
  effects, a lot of details, so it feels special."
  * **THE GAUNTLET** (`src/story/gauntlet.js` + the `mixed` spawn set
    that map6 named but NEVER EXISTED - it was silently falling back
    to the d1 fry roster):
    - The spawn clock is driven by ALTITUDE, not time: every floor
      climbed is a permanent step up the heat curve (floor*12.5 into
      the phase table, monotonic - retreating never cools it off).
      Floor 1 opens gently; floor 17 runs at the roster ceiling.
    - The `mixed` set throws the whole campaign at you: fries and
      apples at the bottom, pretzels/golemites/burgers/heaps at the
      top.
    - FLOOR N/17 counter on every floor; a medkit drops at every
      third landing (SUPPLIES!) - the breather that keeps constant
      pressure fair for a kid.
    - Stepping onto the roof ends the gauntlet and clears the crowd -
      nothing follows Danny into the confrontation.
  * **THE ENDING** (`src/story/finale.js`, PC.ChompFinale). The old
    path had a LATENT CRASH - onChompDown handed to onBossDefeated,
    which tweens `b.sprite` and hides `b.tele`; CHOMP has neither.
    It had simply never been allowed to run to the end. Now the final
    blow starts a ~9s spectacle:
    - BOOMS 0-3.6s: an escalating explosion chain walks across the
      machine; the four arms blow out one by one; the five roof
      tethers SNAP one by one (chomp_arms `snapped` support - snapped
      pipes stop drawing, sparks at each socket).
    - THE BIG ONE at 3.6s: full white flash, the hardest shake in the
      game (0.022), ten simultaneous bursts, a steam gush from every
      vent (face emit forced).
    - QUIET: it sinks, the lenses go dark (the face overlay's rise
      guard does this for free), CHOMP STOPPED! gold card.
    - FIREWORKS 6.2-8.8s: nova/levelup bursts across the sky + a coin
      rain around Danny.
    - Then the dialogue that lands the theme: "...did I... not
      help?" / Danny's listening line + TWO new beats (CHOMP: "one
      plate at a time?", Vic: "snack duty - SMALL snacks") - reviewed,
      kid-safe.
    - CAMPAIGN COMPLETE! card (3s, bursts), `PC.meta.setFlag(
      'campaignComplete')`, then the mission closes through
      `quest.onBossDown()` - the same path every mission ends on
      (markCleared + results desk with the win).
    - Driven from the storyPause block like the phase cinematic (the
      twice-learned lesson), with boss.update + pickups.update kept
      alive under it so the sink, dead arms, steam and coin vacuum
      all play during the hold.
  * New gate `verify-ending.js` - a full end-to-end: boots the REAL
    finale mission, checks the mixed roster, the altitude clock
    (floor 10 spawnT 125 vs floor 1 at 13), the medkit landings, the
    roof clear, then fights through the confrontation, lands the
    final blow and follows the whole ending to the results desk. 10
    checks GREEN. roof-fight, phases, bossdoc, roles, arena re-run
    green.
  * Voice script: Mark will author later (his call this session).


- **2026-08-07 - v0.67.0: callout sanitation, final pass.** Mark:
  "completely sanitized as close as we can, no room left for
  questioning" on STICKY FROSTING and GOO SPIRAL. Replaced with
  FROSTING SPLASH! and AROUND WE GO! - plain nouns and playful
  phrasing with zero adjectives that could carry a second reading.
  The automated screen in verify-district-bosses was WIDENED to ban
  the whole word class outright (sticky/moist/wet/juicy/lick/suck +
  the existing violence list), so no future line can reintroduce the
  problem. Current set: KETCHUP RAIN, COMING THROUGH, FLORET FLURRY,
  DOWN I GO, SURPRISE, CUPCAKE SPLIT, FROSTING SPLASH, SNACK TIME,
  CANDY CORN AWAY, SOLD OUT, DOWN THE DRAIN, AROUND WE GO, RIPPLE
  TIME, SPLAT SPLAT. Gate green.


- **2026-08-07 - v0.66.0: callout wording pass.** Mark disliked SAUCE
  STORM / FROSTING TIME / GOO-NADO. Replaced with lines that plainly
  SAY what the attack is (the callout's job is removing mystery, not
  landing a pun): KETCHUP RAIN! / STICKY FROSTING! (names the slow
  effect) / GOO SPIRAL!. Full current set: KETCHUP RAIN, COMING
  THROUGH, FLORET FLURRY, DOWN I GO, SURPRISE, CUPCAKE SPLIT, STICKY
  FROSTING, SNACK TIME, CANDY CORN AWAY, SOLD OUT, DOWN THE DRAIN,
  GOO SPIRAL, RIPPLE TIME, SPLAT SPLAT. All still pass the automated
  appropriateness screen. district-bosses 17 checks green.


- **2026-08-07 - v0.65.0: WALKS THAT READ, THE 60% SPLIT, SPRINKLES,
  AND CALLOUTS.** Mark's batch: the vending machine and cake "do move
  but there's no walking animation"; the cake "doesn't split - maybe a
  large cake that splits into multiple cupcakes at sixty percent"; the
  red splotches "start looking like blood - make it multicoloured with
  sprinkles"; and "each boss announces what they're attacking with"
  plus "an inappropriate check".
  * **THE WADDLE**: the flipbook alone never read because the
    strength-300 walk frames were near-clones. Two fixes together:
    (1) the chassis now PERFORMS the walk - a movement-driven,
    step-timed squash-and-stretch with side sway and a hop, playing
    only while the boss actually moves (`b.moving` off real position
    delta); (2) the stride frames (walk 1 + 3) for cake and vending
    were regenerated at strength 200 with explicit big-step leaning
    poses, so the art genuinely alternates under the code motion.
  * **THE SPLIT**: Cake redesigned to ONE gate at 60% HP - the
    colossus bursts, FOUR live cupcakes scatter out of it, and what
    remains is smaller (1.32 -> 0.92) and faster (76 -> 124), stunned
    wide open through the moment. Idempotent (`b.split`), gated in
    the suite including a re-trigger probe at 20%.
  * **SPRINKLES, NOT BLOOD**: `splat()` accepts a tint ARRAY - each
    frosting blob picks its own pastel (pink/butter/sky/mint/
    lavender), and slow puddles draw seven coloured sprinkle dashes
    on top. The gate asserts >= 2 distinct puddle tints and no plain
    red. Frank keeps his red ketchup - it reads as condiment on a
    street-food boss and Mark's note was about the cake.
  * **CALLOUTS**: new `PC.Boss.say(text, tint)` - a bold shout above
    the boss's head when a move starts, one at a time. 12 wired
    across all five bosses (SAUCE STORM!, FLORET FLURRY!, CUPCAKE
    SPLIT!, CANDY CORN AWAY!, GOO-NADO!, ...). Every string was
    manually reviewed for the VBS audience - food puns only, zero
    violence words - AND the gate runs an automated screen: fetches
    boss_scripts.js, extracts every say() string, asserts uppercase
    food-safe charset and a banned-word list (blood/kill/die/...).
  * verify-district-bosses now 17 checks GREEN (split-once, pastel
    tints, overhead callout, appropriateness screen, live waddle
    sway/squash sampling); arena re-run green.


- **2026-08-07 - v0.64.0: THE GLOOP KING, VISIBLE AND DANMAKU.** Mark:
  "the gloop king is not visible. Have him more of a bullet hell but
  for kids."
  * **THE INVISIBILITY WAS THE CHOMP BUG REPEATED**: boss_d5_gloop_*
    PNGs existed on disk with manifest lines, but PC.ASSETS only had a
    slot for `boss_d5_mother` (a stale concept name) - so the atlas
    never packed him and the sprite rendered nothing. He has been
    invisible since D5 shipped. Registered walk x4 + rear/lunge x2 at
    144. The gate now has an INVISIBILITY GUARD: every boss frame set
    asserted present in the atlas (`tex.has`), because `sprite.
    visible === true` is a flag, not a pixel.
  * **KID BULLET HELL** - full script rewrite. He barely moves and
    fills the room with slow, fat, readable goo:
    - SPIRAL: two arms of blobs on a lazily turning emitter (105px/s,
      r13) - the safe lane rotates with it, wide enough to stroll.
    - RINGS: two expanding rings, offset, each with two WIDE gaps.
    - FANS: three aimed 5-shot fans with a step-aside beat between.
    - Every blob flies slower than the player walks (<=130 vs 190) -
      walking out always works (doc 2.3.4).
    - After EVERY pattern: 'vent' - he sags, bubbles, and takes double
      damage for 1.5s. The fight breathes: dodge-phase, punish-phase.
    - The puddle DIVE stays as his reposition every ~7th beat (guard
      0.25, never immune), erupting with slick + daze. Drip call kept.
  * He never fires from OFF SCREEN: beyond 340px he closes at full
    speed with patterns held - "bullets from nowhere" is the doc's
    fairness complaint.
  * anims: spiral/burst/ringTell play the rear (channel) set, erupt
    the lunge set.
  * verify-district-bosses updated: 13 checks GREEN (spiral slower
    than walk speed asserted blob-by-blob, vent window, gapped rings,
    guarded dive, atlas guard); arena re-run green.


- **2026-08-07 - v0.63.0: BOSS ART + REMAKES ROUND (Mark's critique
  batch).** Three notes: walking + special animations for the bosses;
  the Cake Colossus candles read devilish ("would have liked a massive
  cupcake, less fiendish"); the Vending Behemoth "looks badly made -
  remake as a walking vending machine who goes slowly but spawns tons
  of junk food and launches candy corn rockets"; and the Broccolisk
  dig "could disappear then appear under the player".
  * **CAKE COLOSSUS is now a GIANT CUPCAKE**: swirled pink frosting
    dome, a cherry on top (no candles anywhere - `negative_description`
    banned candles/fire/devil), pastel striped wrapper, stubby frosting
    feet, friendly face. Fight unchanged (still the Shedder).
  * **VENDING BEHEMOTH remade, art AND fight**: new walking-machine
    art (red snack machine on sturdy legs). New script: it never
    plants - it WALKS at you, slowly (spd 78 -> 46), always. RESTOCK
    flings the door open and pours 6 junk minions onto the floor;
    CANDY CORN ROCKETS - three per salvo, drawn in code as banded
    yellow/orange/white rockets arcing from the roof hatch onto
    magenta reticles that LOCK where you stood (step off = dodge, doc
    2.3.4); every third salvo = SOLD OUT overheat (2.5s window kept).
  * **BROCCOLISK dig rework**: no more mound chase - it vanishes
    entirely, a reticle shadows you for 1.5s, LOCKS for 0.7s (ring
    tightens + fills), and it erupts AT the lock point. Stepping off
    after the lock always dodges; guard 0.25 while under stays.
  * **ANIMATIONS**: 24 new frames via PixelLab (pixflux base + init-
    image variants at strength 300, recipe 4; cake 64->128 x2, vending
    48->144 x3, integer NEAREST only). Every boss's SPECIAL states now
    map to art sets in PC.BOSSES.anims (rear = wind-up, lunge =
    strike): broc fan/erupt, cake shed, vending restock/launch/
    overheat, gloop ringTell/erupt. Walk flipbook verified live in the
    gate (frame advances while walking; flipX covers left/right).
  * PixelLab meter after the batch: ~875/2000 generations remain.
  * Gate updates: verify-district-bosses now asserts the vanish-dig
    surfaces AT the lock, rocket marks stay locked when the player
    moves, the restock flood spawns, and the walk flipbook animates -
    12 checks GREEN; arena + roof-fight re-run green.


- **2026-08-07 - v0.62.0: THE BOSS ARENA.** Mark: "give me a menu item
  that allows me to test these bosses without having to select the
  levels. Just a quick boss arena, and I can select from each one to
  try them out the way that they would fight in the actual game."
  * The BOSS TEST pad on the missions map is now the **BOSS ARENA**:
    one chooser, every boss in the game one tap away. Two sections -
    the five district bosses, then the three CHOMP roof rows (FIGHT
    DRAWN / FIGHT CAULDRON / A/B; the two LOOK pose rows were dropped,
    A/B covers art review).
  * **"The way they would fight in the actual game" is the load-bearing
    phrase**, and both of the things it needs key off `scene.
    storyMission`, which an arena doesn't have. New `PC.ARENA_BOSS`
    flag (config.js, consumed by PC_Game on boot -> `this.arenaBoss`):
    - `PC.ease()` now serves **STORY numbers** for an arena scene too
      (bossHp 0.42, contact 0.75, charge 0.75) - otherwise Mark would
      duel full quick-run bosses and judge the wrong fight.
    - `gainXp` **banks** in the arena, so a duel is never interrupted
      by a quick-run card pick.
    - `SpawnDirector` takes `scene.arenaSet` when there's no region, so
      the ambient pressure is the boss's own district roster (broc ->
      park produce, cake -> desserts, vending -> junk, gloop -> goo).
  * The boss walks in through the real `spawnBoss` entrance (which now
    takes an id) after a 1.4s breath, with an `ARENA: <NAME>` banner.
  * **Both endings bounce straight back to the missions map** - no
    results desk, no run summary. Win or lose, the next attempt or the
    next boss is one tap away (doc 2.3.8, retry friction). Story state
    is never touched; the flag is consumed on boot so it cannot leak
    into a real mission.
  * New gate `verify-arena.js` (6 checks) GREEN - includes asserting
    the Gloop duel is the campaign fight (story HP 2352 = 5600*0.42,
    own script, goo roster) and that both exits land on PC_Missions.
    district-bosses, roof-fight and bossdoc re-run green.

- **2026-08-07 - v0.61.0: FIVE BOSSES, FIVE FIGHTS.** Mark: "make sure
  they're all different and related to their setting and their
  character itself and to our boss md file. I want every boss to feel
  different and fun."
  * **The audit finding was stark**: all five district bosses ran the
    IDENTICAL script - drift, red ketchup splat, telegraphed charge -
    with only the numbers and the sprite changed. The Broccolisk lobbed
    ketchup. The Gloop King fought exactly like a hot dog. That is the
    boss doc's sponge complaint verbatim (2.3.5: the sponge problem is
    a VARIETY problem).
  * **New `src/systems/boss_scripts.js`** - one fight per boss, keyed
    to character + district; `boss.js` is now a shared chassis (single
    damage path, bar, contact, art flipbook, pose amp, defeat flow)
    that dispatches to `PC.BossScripts[id]`:
    - **FRANK the CHARGER** (bank): keeps charge + condiment splat -
      they are HIS now, nobody else copies them. New: the charge ends
      in a SKID (a sausage at speed does not corner) - 1.2s punish.
    - **BROCCOLISK the BURROWER** (park): serpentine weave, GREEN
      floret fan, burrow -> dirt mound chases you at 130 (you walk
      190) -> erupts where it stops -> surfaces dazed 1.6s.
    - **CAKE the SHEDDER** (suburbs): its HP phases ARE its tiers - at
      2/3 and 1/3 a layer sheds into two live cupcakes and the boss
      gets SMALLER and FASTER (1.32/76 -> 1.08/108 -> 0.88/138), stun
      2s. Frosting mortar lays pink puddles that SLOW (0.55x), not
      damage - pressure without chip.
    - **VENDING the ARTILLERY** (labs): plants itself (only waddles if
      you leave 480px), aimed can volleys, a 3x3 falling snack grid
      with TWO safe cells (read the gap), minion restock (zipper +
      sodacan), then OVERHEAT: "SOLD OUT", sparks, 2.5s window - the
      longest before the Tower.
    - **GLOOP the TIDE** (sewers): expanding goo ring with two gaps,
      puddle DIVE that slides at you at 140 - shots into the puddle
      still land at 25% (`guard`), because invulnerable-until-X is the
      doc's named anti-trope - erupt + slow slick, drip call.
  * **Doc spine across all five**: every telegraph is now the reserved
    magenta (Frank's lane was red - also the ketchup colour, the exact
    collision the rule forbids); every big move ends in a punish
    window drawn with the same cyan ring CHOMP uses (vuln = double
    damage); mounds/pulls are all slower than the player, so nothing
    is guaranteed damage; each boss teaches ONE word in campaign order
    (charge -> ground marker -> phase shed -> bullet grid -> area
    wave), so by the Tower the player speaks CHOMP's whole language.
  * Chassis additions: `guard` (partial damage while under), `vuln`,
    `noContact`, `baseS` (Cake shrinks it), pooled hand-collided
    `shots`, `splat(n, tint, kind)` with 'slow' puddles feeding a new
    `scene.bossSlow` hook in game.js (recomputed every frame, same
    contract as armSlow). Dead-branch clears the gfx layer so a boss
    killed mid-tell doesn't leave its mound painted forever.
  * Quick-run mode still gets Frank by default - unchanged.
  * New gate `verify-district-bosses.js` (10 checks) GREEN; roof-fight,
    bossdoc, phases and roles all re-run green.

- **2026-08-07 - v0.60.0: PHASES THAT READ AS PHASES.** Mark: "we also
  didn't have phases in the fight with boss model changes? cinematic
  moments? difficulty spikes?"
  * **The honest answer was that all three half-existed.** There were
    already three phases with separate baked body art, a size escalation
    (0.91 / 1.07 / 1.24), tightening cadence and a line of dialogue -
    but a gate went past in a shake and a flash, the art delta was two
    small panels, and the only spike was slightly shorter gaps. So the
    machinery was there and none of it LANDED.
  * **THE CINEMATIC** - new `src/systems/chomp_phase.js`. A gate now
    takes the camera for ~3.3s: push in on CHOMP, it rears and SLAMS
    every boom into the deck (spark bursts at each tip, 0.020 shake,
    magenta flash), a letterboxed title card names the phase - PHASE 2
    SECOND HELPINGS / PHASE 3 EVERYTHING ON THE MENU with a CHOMP line -
    then the camera hands back. It runs on the same `storyPause` the
    dialogue uses, so every attack system already stops for it.
  * **THE MODEL CHANGES ARE REAL NOW.** Phase 2 BOLTS MORE MACHINE ON
    (a second hopper tier over the brow, fat food canisters clamped to
    both shoulders, hazard stripes down the plinth, a cracked cheek
    panel with wiring showing). Phase 3 is the same machine COMING
    APART while it keeps trying: scorch dithered out of every seam, a
    torn chest panel with the core glowing white-hot through it, food
    fused over the chassis in slabs, tines along the brow, extra
    conduits strapped down the neck - and the live face escalates with
    it, lenses going from amber to RED.
  * **THE DIFFICULTY SPIKE** is now in the ARMS, via `arms.overdrive(n)`
    and a `GEAR` table: cooldowns to 0.72x then 0.52x, blender radius
    +12%/+26%, server volleys 3 -> 5 pellets, saucer 3 -> 4 puddles,
    booms swinging 1.35x/1.75x harder. The attractor gets stronger too
    but is capped so it can NEVER outrun the player - gated.
  * The phase-2 dialogue box was removed: CHOMP says its piece on the
    card, and a second box for the same beat is just an interruption.
    Phase 3 keeps Vic, because another voice reacting is the one thing
    the card cannot do.
  * **TWO BUGS, BOTH THE SAME SHAPE AS THE v0.57.0 ONE** - a system
    that stops the world also stops whatever was supposed to un-stop
    it:
    1. The beat froze on its first frame. `storyPause` returns from
       game.js update BEFORE the boss updates, so nothing drove it and
       it never handed the camera back. The beat (and the boss's fig,
       arms and moves, so the slam plays) is now driven from INSIDE the
       storyPause block.
    2. The card rendered as a DOUBLE image when two gates overlapped.
       `enterPhase` now closes a running beat before starting a new one
       - allies fire right up to the freeze and a big hit can cross two
       thresholds at once, and the orphaned card would otherwise sit on
       screen for the rest of the fight.
  * The card is anchored to the live camera rect in world space rather
    than parented to `scene.ui`: that container is re-positioned from
    `worldView` at the TOP of update and this beat moves the camera
    afterwards, so a screen-space card lands a frame behind a camera
    travelling several hundred px. Verified by sampling canvas pixels,
    not by eye.
  * New gate `verify-phases.js` (7 checks) GREEN; roles, bossdoc,
    moves, arms, roof-fight, confront and portrait all re-run green.
    `verify-roof-fight` needed updating, not fixing - the crew now
    arrives when the phase-3 camera hands back rather than the instant
    HP crosses the line, which is better staging.

- **2026-08-07 - v0.59.0: FOUR ARMS, FOUR JOBS.** Mark: "let's make the
  arms longer by 75%, let's have those blades at the end spinning, and
  maybe have each arm have a different purpose?"
  * **+75% REACH** - the boom constant went 320 -> 560
    (`PC.CHOMP_ARM_REACH`, exposed so the gate can assert it).
  * **EACH ARM IS A DIFFERENT APPLIANCE**, with its own head, its own
    identity colour, its own clock and its own name in the kill message:
    - **SERVER** (gold): a food cannon. Aimed barrel + spinning intake
      fan; fires a 3-shot spread of portions on a magenta muzzle tell.
      The pellets ride the moveset's existing crumb list, so they are
      collided, drawn and amnestied by the same code as everything else
      CHOMP throws - no second projectile system.
    - **BLENDER** (red): a four-blade rotor on a real rotation with a
      blur disc behind it. No cooldown - it is dangerous simply by
      existing, which makes it the arm most players will take first.
    - **ATTRACTOR** (violet): a tractor dish that DRAGS you toward it at
      105px/s. Never damages you; it just ruins your positioning and
      feeds you to everything else. 105 < the player's 190, so it is
      always escapable (doc 2.3.4, no guaranteed damage).
    - **SAUCER** (green): sprays goop puddles that slow you to 0.60.
      Also harmless alone. 190*0.60 = 114 still beats the 105 pull, so
      goop + beam together can never trap you - the doc's "stacked AoE"
      complaint (2.3.6) taken seriously.
  * That turns "shoot the arms" into a real decision instead of four
    identical HP bags, which is the doc's "a good boss gives you
    options" (2.3.9) and its note that variety, not health, is what
    stops a long fight reading as a sponge (2.3.5).
  * Colour discipline held: only the two arms that can actually hurt you
    telegraph, and only the SERVER uses the reserved magenta. The
    attractor and the saucer deliberately do NOT get a danger colour.
  * The conveyor move now **prefers the blender** - swinging a spinning
    blade rotor through you is coherent; swinging the attractor dish is
    not. Falls back to the nearest live arm.
  * `scene.armSlow` is the new slow hook in game.js, recomputed from
    scratch every frame by the arms system so it can never stick after
    the fight. `arms.amnesty()` now runs on every phase gate and on the
    power-down alongside the moveset's.
  * **TWO THINGS THE 75% BROKE, both found by gating rather than by
    eye:**
    1. **Tips wandered off screen.** The arm tips are TARGETS - each
       carries the HP pip you shoot at. At fight zoom the camera is only
       251 world px half-wide, and the anti-camp shove from v0.57.0
       keeps the player ~245px off the core so the camera is never even
       centred on CHOMP. A 560px boom cannot fit sideways at all. The
       rest angles were re-aimed to within ~24 degrees of vertical
       (where the portrait screen has 546px of room) and the squash
       relaxed 0.62 -> 0.85. All four tips on screen at once is simply
       not deliverable at this length; the gate asserts the thing that
       IS true and matters - walk toward any arm and its head and pip
       come into view.
    2. **The down pair read as LEGS** - the exact note that killed the
       old generated CHOMP ("he's not enough of a stationary machine").
       Fixed by bolting each boom to its own hardpoint on the plinth
       (`mountOf`, lining up with the gold sockets the body texture
       already paints) instead of all four leaving one point, and by
       staggering the rest angles so the four are not a symmetric X.
  * New gate `verify-roles.js` (7 checks) GREEN; bossdoc, moves, arms,
    roof-fight and confront all re-run green.

- **2026-08-07 - v0.58.0: CHOMP'S PORTRAIT IS THE MACHINE HE ACTUALLY
  IS.** The shipped `portrait_chomp` PNG was generated back when CHOMP
  was the CAULDRON design. So on the roof the player talked to one
  machine and then fought a completely different one, seconds apart, in
  the most important scene in the game.
  * **The portrait is now PAINTED FROM `paint()`** - the same function
    that bakes the boss body, so it uses the same geometry, the same
    3-value ramps and the same top-left light. It cannot drift from the
    boss again, because it IS the boss.
    `PC.buildChompPortrait(scene)` in `chomp_drawn.js`, built lazily the
    first time he speaks and cached as texture `portrait_chomp_drawn`.
  * The baked body deliberately leaves the eye sockets and the mouth
    hollow for `PC.ChompFace` to fill live. A portrait has no live
    overlay, so `paintPortraitFace()` bakes a static one - lenses
    forward and slightly down (meeting the reader), iris rings lit,
    mouth about 70% open like he is mid-sentence.
  * **CROPPED TO THE HEAD.** The whole machine squeezed into the 52px
    dialogue well was a smudge. First attempt cropped 32 design units
    at 4x, which cut both eyes off and read as a grille - the face
    block is 42 units wide. Landed on **48 units at an exact 3x**
    (144px texture): brow, both tracking lenses, cheek hardware, mouth
    slats, neck collars and the shoulder line.
  * `DialogueBox.show` now **fits whatever texture it is handed** to the
    well (`PORT / frame.width`) instead of assuming every portrait is
    128px, and switched `setFrame` -> `setTexture` so a speaker can
    carry a standalone texture at all. Every other speaker is untouched
    and still reads its atlas frame - gated.
  * The stale `portrait_chomp` PNG stays in the manifest on purpose: it
    is one frame, and it keeps the fallback path alive.
  * New gate `verify-portrait.js` (4 checks) GREEN, plus confront,
    roof-fight and bossdoc re-run green.

- **2026-08-07 - v0.57.0: THE FIGHT, AUDITED AGAINST THE BOSS DOC.**
  Mark handed over `bossdesignreference.md` ("the fundamentals of good
  boss fight designs - implement the most that you can into this fight
  with what we currently have"). Every change below cites the rule it
  answers, so the next session can re-audit against the same document.
  * **1.4 RESERVED TELEGRAPH COLOUR.** The doc's rule is that one hue
    means "this will hurt you" and is never used for anything else.
    Ours was gold - which is also CHOMP's own trim, his arm lamps and
    the armour pips, i.e. the single worst possible choice. Every
    telegraph moved to `PC.CHOMP_TELL_COLOR = 0xff3ea5` (magenta),
    reserved and used nowhere else. The recovery ring got the opposite
    treatment: cyan, which now reliably means SAFE.
  * **1.2 + APPENDIX - THE PUNISH WINDOW IS THE BOSS'S OWN ANIMATION.**
    Every move now ends in a real recovery (`RECOVER`: serve 1.5s,
    conveyor 2.1s, buffet 1.4s, seconds 1.1s) during which a cyan ring
    pulses at the core and **all damage is doubled** (`VULN_MULT`). In
    a bullet-heaven the player doesn't choose when to swing, so the
    punish has to be positional - stand in it and your existing DPS is
    worth twice as much. Recovery stopped being a pause and became the
    reason to move toward him.
  * **2.3.3 REACT TO POSITION, NEVER TO A BUTTON.** Anti-camp shove:
    sit inside `r + 60` for 0.9s and he serves you personally - a
    telegraphed magenta ring, then 12 damage and a shove clear of the
    core. It reads your POSITION only; there is no input-reading
    anywhere in the fight.
  * **1.9 + 3.4 THE TRANSITION IS A SCRIPTED BEAT.** `enterPhase()`
    now does all four jobs at once: 1.6s invulnerability, projectile
    **amnesty** (everything in flight despawns - the doc's rule that a
    transition may never kill you), 1.5s of grace before anything new
    fires, and a shake + magenta flash so the new phase reads as new.
  * **APPENDIX - PHASE GATES ON HP *OR* TIME.** DPS in a bullet-heaven
    varies wildly by build, so an HP-only gate means a weak loadout
    never sees phase 3 and a strong one skips phase 2 in six seconds.
    `phaseOf()` returns `max(byHp, byTime)` with time gates at 50s and
    105s, and a `gates` map makes each threshold fire **exactly once**
    however the two curves cross.
  * **3.4 ANTI-FRUSTRATION.** Pity aggression (he eases off after he
    lands one on you), a death cancel (a move in flight cannot kill
    you during the power-down), and no guaranteed damage anywhere -
    every move has a dodge (2.3.4).
  * **2.3.7 OCCLUSION.** The doc maps the camera complaint straight
    onto 2D: your boss must never cover the player. Danny went to
    depth 22 and his ghosts to 21, above the boss body (18) and the
    live face (19). You can always see yourself.
  * **2.3.8 RETRY FRICTION.** Dying on the roof sets `PC.ROOF_RETRY`,
    consumed on the next create - you land back in the fight instead
    of re-walking the confrontation. Nobody re-watches a cutscene.
  * **THE ONE REAL BUG THIS FOUND**: the shove was a *delta* along the
    player-to-core vector, so standing on the exact centre (dx = dy =
    0) gave it no direction and camping the dead middle was free. It
    now shoves to a fixed RADIUS with a fallback direction.
  * New gate `verify-bossdoc.js` (7 checks) - GREEN, plus moves, arms,
    face, confront, roof-fight and tower all re-run green.

- **2026-08-06 - v0.56.0: THE MOVESET. CHOMP FIGHTS BACK.** Mark:
  "let's make him 30% bigger and let's have his arms more threatening.
  Now let's make his phases and attacks and such."
  * **+30% SIZE** (PHASE_SCALE 0.91/1.07/1.24) and the hitbox followed
    (r 96 -> 125). At the old scale he read as a set piece rather than
    something standing in your way.
  * **THE ARMS ARE WEAPONS NOW**: reach 250 -> 320, heavier booms, and
    the friendly green panel wing is gone - each head is a pair of
    hinged JAWS that open and close on their own clock and flare WIDE
    during a wind-up, with a red hazard lamp that strobes instead of a
    cheerful amber one.
  * **`src/systems/chomp_moves.js` - FOUR MOVES**, all of them acts of
    hospitality, because it cannot conceive that being fed is
    unwelcome:
    - PORTION SERVE: a dinner plate painted on the deck under you,
      filling over 1.35s, then the meal lands. Doubles from phase 2.
    - CONVEYOR: the arm NEAREST you winds up (jaws flare, the arc it
      will sweep is painted red on the deck) then swings a belt of food
      through it. Needs a living arm - which is what makes the arms
      worth killing rather than optional.
    - BUFFET: a radial spread from the chute with TWO opposite GAPS, so
      the answer is always "read the gap", never "tank it".
    - SECONDS!: a greatest-hits wave, one creature from every district
      at once. Phase 3 only.
  * **PHASE CADENCE**: p1 gap 3.4-4.6s and only serve/conveyor (it
    teaches the plate); p2 2.6-3.6s and adds the buffet; p3 1.9-2.8s
    with everything. Never the same move twice running.
  * Everything damaging is drawn in ONE graphics layer and collided by
    hand against the player, the way the boss puddles work - it never
    touches the bullet system, so nothing here can leak into normal
    play. It also holds fire entirely while `storyPause` is up, so a
    plate can never land mid-dialogue.
  Gates: new verify-moves 6/6 - it attacks unprompted, walking off the
  plate avoids it, standing in it costs you, the phases genuinely open
  up the pool, and it holds fire during dialogue. Face, arms, tower and
  confront all still green, zero errors.
  TEST LESSON: the first dodge check failed because the SCHEDULER kept
  firing during the 2.2s window and a second plate landed on the
  player - the mechanic was fine, the test was measuring noise. Freeze
  the scheduler when asserting on a single move.
  **NEXT, small but visible: `portrait_chomp` is still the generated
  cauldron** and the drawn design won, so the dialogue portrait no
  longer matches the thing on screen. Then the ending/credits.

- **2026-08-06 - v0.55.0: CHOMP IS ALIVE.** Mark: "make his eyes follow
  the player character wherever they go, make the mouth open and close
  a bit, maybe a bit of smoke or steam out the top, maybe make his base
  a bit wider too and a neck kind of segment?"
  ARCHITECTURE: the body stays a BAKED texture and only the parts that
  move are drawn per frame on top of it (`PC.ChompFace`, depth 19).
  Same split as the sewer water over cached terrain - the heavy shading
  work stays out of the frame loop, and about 30 draw ops a frame buy
  the whole performance. The baked body deliberately leaves the eye
  sockets and the mouth cavity HOLLOW; baking them would show a second,
  staring pair through the overlay.
  * **EYES TRACK THE PLAYER.** Two clamped lerps against the player's
    offset, smoothed so they glide rather than snap, with a lit cyan
    iris ring and a fixed specular. This is the single cheapest thing
    in the file and the one that makes it feel alive - a machine whose
    lenses follow you is watching you. Powered down, they roll down and
    go dark.
  * **THE MOUTH WORKS.** A slow idle chew on a sine, snapping WIDE
    whenever it serves; the grille slats compress as the aperture
    closes and an amber glow shows in the throat when it opens fully.
  * **STEAM** from three vent stacks, pooled, swelling as it rises,
    thinner and slower once powered down.
  * **GEOMETRY**: the plinth is now the FULL width of the frame, and a
    real ribbed NECK segment with gold collars sits between the face
    block and the shoulders.
  Gates: new verify-face - asserts the gaze actually crosses over when
  the player moves left vs right (-0.96 / +0.92), that the mouth's
  aperture varies over time, and that steam is live. 4/4, plus arms,
  tower and confront green, zero errors.
  **STILL TO BUILD: the moveset.** PORTION SERVE, CONVEYOR, BUFFET,
  SECONDS! The serve pose and mouth-wide state are already wired for it.

- **2026-08-06 - v0.54.0: THE DRAWN DESIGN WINS, AND THE ARMS ARE IN.**
  Mark: "our drawn version works great. More greeble and more extended
  tubes and wires leading to him would improve his design. And also add
  the arm segments as well to the fight. Now let's figure out his
  phases and increase his hp."
  * **DRAWN IS NOW DEFAULT** (`PC.CHOMP_ART`). `?chomp=art` still
    brings the generated cauldron back for comparison, and the BOSS
    TEST node still offers both.
  * **GREEBLE**: vent stacks along the shoulder, a gauge cluster on one
    cheek, hazard chevrons on the other, junction boxes on the plinth,
    a stencilled plate number. The rule that keeps greeble from
    becoming noise: every piece is a THING a machine would have, at
    three sizes, clustered near seams and edges rather than sprinkled.
  * **TETHERS** (`chomp_arms.js`): five feed pipes and slack cables
    running from roof plant and parapet INTO CHOMP - dark casing, lit
    core line, a sagging cable alongside, gold socket collars where
    they meet the roof, and an amber pulse travelling *inward* so they
    read as feeding it. This is what makes it look plumbed into the
    building instead of parked on it.
  * **THE FOUR BOOM ARMS**, drawn in code because a stamped arm is only
    correct at the angle it was drawn and these sweep through all of
    them. Three jointed segments with gold hinges, a green panel wing
    and a lamp at the tip, a health pip under each so a child can see
    it is a target, and a dead arm hangs drooped and dark and sparking
    for the rest of the fight.
  * **THE PHASE SHAPE**: while ANY arm lives the core is armoured to
    0.28; each kill peels a quarter of that back; all four down and the
    core takes full damage. Shots land on arms FIRST (hook in
    scene.hitBoss), so stripping them is the fight's first job rather
    than an optional distraction. Armour pips sit on the boss bar so
    the reason your shots bounce is on screen, not a hidden multiplier.
  * **HP 5200 -> 14000** (5880 after story ease) plus 4x900 arm HP.
    5200 was dying in under a minute once allies were landing.
  * GEOMETRY FIX: the stand-off was 640px, which framed the
    conversation but left CHOMP off the top of the screen once the
    camera went back to following Danny. 400 keeps the machine in frame
    at fight zoom and still reads as a stand-off in the wide shot.
  Gates: new verify-arms (5/5 - arms exist and armour, HP raised,
  armoured core soaks, arms die one at a time through the real damage
  door, stripped core takes full damage), plus tower/confront green.
  **STILL TO BUILD: the moveset.** PORTION SERVE, CONVEYOR, BUFFET,
  SECONDS! It has arms and armour now, but it still does not attack.

- **2026-08-06 - v0.53.0: THE BOSS TEST NODE.** Mark: "make that final
  fight area a separate node on the map, so I can easily just access it
  and try all the different versions of the boss fight."
  A red pad clipped to the side of Adventure Tower on the mission map,
  OFF the chain - it is not a story beat, it is a workbench, and it
  never touches save state. Tapping it opens a chooser with every
  version, one tap each:
  * FIGHT: CAULDRON   - warp to the stair head, play it for real
  * FIGHT: DRAWN      - same, with the drawn design
  * A/B: SIDE BY SIDE - both posed together
  * LOOK: CAULDRON / LOOK: DRAWN - one posed, closer in
  The rows just set the runtime flags the roof already reads
  (PC.CHOMP_ART / PC.CHOMP_TEST / PC.ROOF_WARP) and start the game, so
  the node and the URL params are the same one mechanism - no second
  code path to rot. The `?roof=` and `?chomptest=` links still work.
  Gate: verify-bosstest walks the node, opens the chooser and clicks
  every row, asserting each one lands on the tower roof in the mode it
  promised. 5/5, zero errors.

- **2026-08-06 - v0.52.0: ?roof=1 DEV WARP.** Mark: "how do I travel
  there fast?" There was no way - the only route to the finale fight
  was seventeen floors of switchback, which is fine for a player and
  useless for testing the beat you are actually working on.
  `?roof=1` jumps from the title straight to the head of the LAST
  stairwell, one step below the roof, with the climb objective already
  tapped through. Walk up and the confrontation fires exactly as it
  would after the full climb - it is the real beat, not a pose.
  That is the difference from `?chomptest=`: the tester POSES the art
  side by side; the warp PLAYS the fight.
  THE DEV LINKS, all one tap, all on this branch via GitHack:
  * `?roof=1`          play the confrontation + fight
  * `?chomptest=1`     both CHOMP designs side by side
  * `?chomptest=art`   the generated cauldron alone
  * `?chomptest=drawn` the drawn blocky face alone
  * `?unlock=1`        every built stage active on the mission map
  Gate: verify-roofwarp asserts it lands below the roof line and that
  walking up arms the confrontation on its own. Zero errors.

- **2026-08-06 - v0.51.0: the A/B tester becomes a one-tap dev LINK.**
  Mark: "give me the tester link so I can load each one and see what
  they look like separately."
  `?chomptest=` now takes a MODE and goes straight to the roof from the
  title - no climbing seventeen floors to look at a sprite:
  * `?chomptest=1`     both designs side by side (0.46 zoom)
  * `?chomptest=art`   the generated cauldron alone (0.74 zoom)
  * `?chomptest=drawn` the drawn blocky face alone (0.74 zoom)
  Danny stands in frame for SCALE - the entire reason to test in-engine
  rather than off a contact sheet. All four states cycle every 3.2s.
  THE RIG IS NOW UNKILLABLE. The first build let the director get its
  ticks in before the delayed arm fired; enemies chewed through Danny
  while he posed and the art comparison ended on OVERWHELMED at 0:06.
  It now clears the field every tick, noops enemies.spawn, empties
  scene.weapons (his auto-fire was shooting things mid-test) and pins
  hp/invUntil. A dev rig that can kill you is not a dev rig.
  LIVE LINK (GitHack, this branch):
  https://raw.githack.com/mountaindrowner/SuperDude-Rescue-/claude/portion-control-vslice/games/portion-control/index.html?chomptest=1
  Gates: all three modes verified one-tap, plus roof-fight and confront
  green, zero errors.

- **2026-08-06 - v0.50.0: THE CHOMP A/B TESTER + the drawn design gets
  its shading pass.** Mark: "let's do a dev level tester with both
  options. I only want more shadowing and detailing and texturing on
  your design."
  `?chomptest=1` on the finale drops you on the roof with the cutscene
  skipped and BOTH CHOMP designs standing side by side at REAL PLAY
  SCALE, labelled, with Danny between them for size, cycling phase 1 ->
  2 -> 3 -> powered down every 3.2s. The camera stops following and
  holds the pair at 0.46 zoom; the HUD hides. A sprite sheet lies about
  scale - this does not, it is the actual camera on the actual roof.
  `?chomp=drawn` makes the real fight use the drawn design instead.
  `src/systems/chomp_drawn.js` is the drawn CHOMP with the detail pass:
  every surface now has a 3-value ramp with HUE-SHIFTED lights and
  darks (never a flat lighten/darken), dithered transition bands so a
  limited palette reads as a gradient, rivets with their own highlight
  and shadow pixel, panel seams as a dark/light pair, ambient occlusion
  under every overhang, cast shadow from the brow onto the eyes,
  scanlines and a specular dot in the eye panels, and scuff wear placed
  by hand so it never reads as a pattern. Lit from the TOP-LEFT
  throughout - one light, obeyed everywhere. It renders ONCE into
  canvas textures at boot, so it costs exactly what a sprite costs.
  Both designs run through the same PC.ChompFigure, which now takes a
  style ('art' | 'drawn'), so whichever wins needs no other change.
  Gates: verify-chomptest (rig arms, all four states cycle), plus
  verify-roof-fight and verify-confront still green, zero errors.

- **2026-08-06 - v0.49.0: CHOMP IS THE CAULDRON.** Eleven design rounds
  with Mark, ending on his pick: "let's do f5, best so far" - a
  colossal riveted STEW CAULDRON with a heavy gold rim, mint enamel
  stew churning inside, ladle mounts around the edge, sensor lenses
  and a grille for a face. A machine SHAPED like food, bolted in
  place, and the ladle mounts are exactly where the four boom arms
  will bolt on.
  THE ROUNDS, because the failures are the useful part:
  1 cute robot with legs -> "not enough of a stationary machine"
  2 dark industrial box  -> "kind of scary"
  3 pastel smiling drum  -> "they all look like babies"
  4 serious faceless core-> "add a distorted, more neutral face"
  5 radial disc + face   -> FAILED STRUCTURALLY: a radially symmetric
    disc has NO TOP OR BOTTOM, so nothing in it can read as
    eyes-above-mouth. The generator resolved the contradiction by
    ignoring the face. Fix: give the body a definite top and bottom
    and describe WHERE PARTS SIT, never saying the word "face".
  6 pyramid              -> came back isometric, because a stepped
    pyramid and a flat overhead view are mutually exclusive
  7 face-first + blocky  -> view='side' pushed it into CHARACTER
    territory and four of six came back as mechs WITH LEGS. 'high
    top-down' has never once produced a limb; keep it.
  8 hand-DRAWN blocky face (draw-chomp.py, kept in scratchpad) - the
    fallback if generation had kept failing, and still the right tool
    if CHOMP ever needs to animate its face.
  RULES THAT NOW HOLD FOR ANY BOSS ART:
  * generate ANCHOR CANDIDATES first, pick one, derive everything else
    from that ONE image at init strength **150** (210 clones, 95
    drifts into a different machine)
  * `view: 'high top-down'` + `direction: 'south'` - the earlier
    diagonal problem was that neither was ever set
  * a frame needs a slot in **PC.ASSETS** or it ships INVISIBLE; a PNG
    on disk plus a manifest line is not enough
  SHIPPED: chomp_p1/p2/p3 x (walk_1, walk_2, serve_1) + chomp_down at
  256px, all derived from the anchor so they are provably the same
  machine; portrait_chomp REDONE to match (a portrait that disagrees
  with the thing on screen breaks the game's most important scene -
  this is the second time it has been redone for that reason).
  Escalation is carried in code (PHASE_SCALE 0.7/0.82/0.95) because
  the art holds its silhouette on purpose - a machine should not morph.
  Gates: verify-confront and verify-roof-fight green, zero errors.
  **STILL TO BUILD: the four boom arms (code, so they can rotate and
  die one at a time) and CHOMP'S MOVESET.** It stands there and takes
  it. PORTION SERVE (serve_1 art exists), CONVEYOR, BUFFET, SECONDS!

- **2026-08-06 - v0.48.0: CHOMP IS A MACHINE NOW.** Mark on the first
  art pass: "I don't like that CHOMP, he's not enough of a stationary
  machine." He was right - it came back as a cute little robot with
  legs and feet, and legs read as something that WALKS AT YOU. CHOMP
  never moves and never needed to: it brings the food to you. It is an
  APPLIANCE.
  Rebuilt as a wide bolted-down rooftop installation: a huge cafeteria
  serving counter, two round cyan gauge lamps in the front panel for
  eyes, a dark dial between them for a nose, a row of serving slots
  behind a gold rail reading as a grin, vents and a chimney on top, a
  side control unit, bolts at the base. 320x192 frames (5:3) instead
  of square - the shape itself has to say "cannot move".
  METHOD THAT FINALLY WORKED (worth repeating for any future boss):
  **generate ANCHOR CANDIDATES FIRST.** Three different base machines
  (`pl-chomp-cand.py`), pick the one that reads right, then derive
  every phase and pose from that ONE image at init strength **150**.
  Two earlier batches failed on the two ends of that dial: 210 cloned
  phase 1 into all three phases, 95 let each phase drift into a
  different machine. 150 holds the silhouette while the description
  still lands.
  Because the art deliberately does NOT morph (a machine shouldn't),
  the escalation is carried in CODE: PHASE_SCALE 0.65/0.75/0.86 so
  phase 3 fills the frame. And the idle is now a machine HUM - a 1.2px
  shiver at 9Hz - not the creature bob it had, which made it look like
  something that could take a step.
  PORTRAIT REDONE to match: the old round-robot head against a
  bolted-down machine broke the one scene the whole game is built
  toward. `portrait_chomp` is now the machine's front panel.
  Gates: verify-confront and verify-roof-fight both green, zero errors.
  **STILL TO BUILD: THE MOVESET.** It stands there and takes it.
  PORTION SERVE (the serve_1 pose art exists for it), THE CONVEYOR,
  BUFFET, SECONDS!. Then the ending and credits.

- **2026-08-06 - v0.47.0: CHOMP GETS A FACE + THE FIGHT CAMERA.**
  Mark: "let's work on the CHOMP asset - give it maybe three phases"
  and "for the CHOMP fight we should zoom the camera out a little bit,
  maybe ten percent, maybe even twenty, so they can see more of the
  fight and it feels more cinematic."
  **THE ART** (PixelLab batch `pl-batch-chomp.py`, 10 generations,
  1010 left): three phase forms + a SERVE telegraph pose each + the
  powered-down pose. The art brief was one line - **IT MUST NEVER LOOK
  EVIL** - because the ending only lands if a child feels sorry for it.
  So the same round friendly face and serving-chute grin survive all
  three phases; what escalates is how much FOOD is fused to it and how
  bright the stolen Ray burns in its crown. `chomp_down` has DARK BLANK
  EYES - that one frame is the emotional beat of the whole game.
  Phase scale escalates in code (1.0 / 1.18 / 1.42) on top of the art
  so phase 3 physically towers.
  LESSON (cost a debug round): a PNG on disk and a manifest line are
  NOT enough to get a frame in the game. **PC.ASSETS in assets.js is
  what the atlas packs** - without a reserved slot CHOMP shipped
  INVISIBLE, shadow only. Frames are declared there now.
  ART LESSON: the first batch came back with three near-identical
  phases because init_image strength 210 locked the silhouette to
  phase 1. Dropped to 95 and let the DESCRIPTION drive the shape,
  keeping continuity through the palette remap instead. Escalation is
  the whole point of phase art - anchor it loosely.
  **THE CAMERA**: `PC.FIGHT_ZOOM = 0.8` (a 20% wider view) in
  confront.js - one knob, one place. The brace wide-shot now eases
  STRAIGHT INTO the fight zoom instead of snapping back, and
  `scene.zoomTarget` lerps the camera anywhere on demand.
  The HUD lives in a world-space container pinned to the camera, so a
  zoom would shrink it - `game.js` now counter-scales `this.ui` by
  baseZoom/zoom every frame, so the interface holds its real on-screen
  size at ANY zoom. (That fix is general; it is why the fight can be
  played wide at all.)
  Gates: verify-roof-fight 6/6 and verify-confront still green with
  the real art in, zero page errors.
  **STILL TO BUILD: CHOMP'S MOVESET.** It currently stands there and
  takes it. PORTION SERVE (telegraphed plate ring - the serve_1 pose
  art is already generated for it), THE CONVEYOR (sweeping belt),
  BUFFET (radial with gaps), SECONDS! (a greatest-hits wave from all
  five districts). Then the ending/credits.

- **2026-08-06 - v0.46.0: THE LAST FIGHT, part 1 - CHOMP + THE CREW
  DROP-INS.** Mark's design call: "it's Super Dude Danny versus CHOMP,
  and then every now and then one of the crew steps in or flies in and
  they get to help - they're automatically just running around with
  their ability doing damage." He took all three recommendations:
  timed fixed-order drop-ins, CHOMP's full four-move "it serves you"
  moveset, and a hero picking Danny up once per phase.
  BUILT THIS PASS (deliberately the risky half first - the allies are
  the only genuinely new AI in the game; if they don't feel good
  nothing else matters):
  * `src/systems/chomp.js` - PC.Chomp. DUCK-TYPES as PC.Boss (x, y, r,
    dead, damage()) so it drops straight into scene.boss and every
    existing weapon, aim helper and hit path works unchanged. 5200 HP
    (x0.42 story ease = 2184), three phases at 66%/33% marked on the
    health bar so a kid can see the fight's shape. It reuses the
    CONFRONTATION'S OWN FIGURE - the thing you were just talking to
    becomes the thing you fight, no swap, no cut.
  * It does not die. `powerDown()` - it sinks, the lights go out, and
    the two written lines play ("...did I... not help?" / "You wanted
    to feed everyone..."). An explosion would fight the ending.
  * `src/systems/allies.js` - PC.AllySystem. Every 25s the next hero in
    RESCUE order (Victoria, Josh, Kevin, Carlos, Nayah) drops in:
    growing shadow, landing shake, their own shout, then ~15s running
    an autonomous patrol around the player and firing their ability at
    CHOMP through `scene.hitBoss` - the SAME damage door the player's
    guns use, so an ally can never do something the player couldn't.
    Phase 3 calls `allIn()` and all five arrive and stay.
  * THE PICK-UP: `scene.die()` on the roof asks the crew first. One
    hero hauls Danny up at half HP, once per phase. This is the
    story's own answer to "is the finale too hard for a seven-year-old".
  * Phase beats are LINES, not stat bumps: phase 2 = "Here is MORE!",
    phase 3 = the whole crew + Vic's only shout in the game.
  BUG THE GATE CAUGHT: the finale mission had ONE objective ('arrive'
  at the roof), so it COMPLETED the instant Danny stepped up and tore
  the scene down mid-cutscene (`cameras.main` undefined). mission8 now
  has a second 'boss' beat that spawns nothing - PC.Confront already
  set bossSpawned - and exists purely to hold the mission open until
  onBossDown() closes it.
  Gates: new `verify-roof-fight.js` 6/6 (handoff, ally lands on the
  timer, ally does real damage, knockdown gets picked up, phase 3
  brings all five, powers down instead of dying); verify-confront and
  the objectives suite still green; zero page errors.
  **NEXT: CHOMP's moveset** - PORTION SERVE (telegraphed plate ring),
  THE CONVEYOR (sweeping belt of food), BUFFET (radial with gaps),
  SECONDS! (a greatest-hits wave from all five districts). Then the
  real PixelLab art for CHOMP, then the ending/credits.

- **2026-08-06 - v0.45.0: THE ROOF + THE CONFRONTATION** (Mark: "the
  final floor to transition to the roof, and the roof is just a large
  map... one realistically sized roof area, and that's with the final
  boss... our character moves up on its own, but it's like the playable
  animation... a cinematic that uses the gameplay engine, so it's the
  sprite that we play with").
  **THE ROOF IS NO LONGER A BAND.** It sits above the 17-floor stack as
  its own 4608x3072 arena (map now 42 blocks / 21504px), wider than the
  shaft below it, open sky on all four sides. Painted as a ROOF and not
  a floor: tar membrane in welded panels, gravel ballast round the
  parapet, and the boss ring painted dead centre. AC banks, vents,
  plant and the ANTENNA MAST (what the Ray climbed) get their own paint
  pass, because they sit on solid cells and so fall outside the floor
  clip - otherwise the roof is a field of anonymous dark boxes.
  **THE FINAL STAIR IS CENTRED** on the roof, so the player climbs out
  looking straight down the deck at what is waiting.
  **THE CONFRONTATION** (`src/story/confront.js`): NOT PC_Cutscene. No
  scene switch, no second art style - the camera, the world and above
  all Danny's own walk cycle are the ones the player has had their
  thumb on all game; the stick is simply taken away. It arms the moment
  he steps onto the roof (the roof IS the trigger) and runs
  **walk -> reveal -> talk -> brace -> over**: he paces out to his mark,
  the camera drifts up to CHOMP who rises, the three written finale
  lines play shot/reverse-shot (the beats are stepped inside Confront,
  not quest.playScript, because only that loop knows who is speaking),
  then the camera pulls back into a wide two-shot and hands control
  back. Danny's weapons hold fire throughout - he does not shoot
  something that is still saying hello. CHOMP is drawn in-world as a
  PLACEHOLDER figure (hopper body, serving-chute grin, conveyor arms,
  far-too-cheerful eyes, the Ray still socketed in its crown); the real
  PixelLab batch is the next art job. Its dialogue portrait is already
  real art.
  Supporting: new quiet objective type **'arrive'** (reaching the place
  IS the beat - no ring, no surge, so a cutscene can own what happens
  next); quest logic holds while the confrontation is armed; the
  confront claims the frame BEFORE quest.update, or a beat arms its
  wave on the very frame Danny steps up (caught on a screenshot -
  "THE SURGE IS COMING!" mid-cutscene); the HUD hides for the wide
  shot, because it is a world-space container pinned to the camera and
  a zoom change shrank it into the corner.
  `src/data/story/mission8.js` is a SKELETON: one 'arrive' objective to
  the roof. Per-floor beats and the boss fight are deliberately unbuilt
  (Mark: "after that, we'll figure out the boss battle mechanics").
  Gates: verify-tower 14999/14999 cells + 92/92 checks; new
  verify-confront plays the whole sequence and asserts the beat order
  and that control comes back; objectives suite still 6/6. Zero errors.
  HARNESS LAW LEARNED: `scene.now` FREEZES during storyPause, so never
  gate a test's dialogue taps on it.

- **2026-08-06 - v0.44.0 (IN PROGRESS): ADVENTURE TOWER, the sixth
  fabric. NOW SEVENTEEN FLOORS + ROOF** (Mark, on seeing the first
  8-floor build: "Way more floors"). The map grew to 36 blocks
  (18432px) so every band stays a full 1024px tall, and interiors
  NARROWED 4608 -> 3584 because seventeen 9-screen halls would be a
  slog. Real building program bottom to top so the climb tells you
  your height without a number: LOBBY / SECURITY & MAIL / FOOD COURT
  / OFFICES / MECHANICAL / ARCHIVE / SKY DECK* / ATRIUM / ACN STUDIO
  / PLANT ROOM / GREENHOUSE* / SERVER FLOOR / EXECUTIVE /
  OBSERVATION* / ANTENNA PLANT / PENTHOUSE / SKY LOBBY / ROOFTOP
  (* = balcony out over the city). Same-kind floors are jittered and
  mirrored per index so F10 is never F5 and F12 is never F6.
  PERF: the grid build buckets obstacles per floor and finds the band
  by arithmetic, so a 4x-bigger map builds in **30ms** (the sewers
  take 36ms). Re-verified: 12554/12554 cells reachable, 92/92 PASS.
  LENGTH WATCH: 17 crossings of 3584px is ~5-6 min of pure walking
  before any fighting, so the finale now runs ~12-15 min rather than
  the 8-10 agreed. Most floors must therefore be TRANSIT with only
  ~7 objective beats, and the checkpoint heals matter more. Mark: "Now let's begin building the final map." Design
  decided with him: ONE mission, 8 floors + rooftop, ~8-10 min, mid
  checkpoint after Frank Mk-II; the rescued heroes escort ONE AT A
  TIME, handing off at each stairwell; the two exterior floors are
  OPEN BALCONY ARENAS (no new grapple mechanic - zero glitch risk),
  so Carlos's Grapnel-Sight stays as the Garage ENTRY gate for the
  finale node, same shape as the Hydro-Drill gate on stage7.
  **PERSPECTIVE RULING (the one thing the engine decided):** the game
  is top-down, so the Tower is NOT a side-on cutaway. Each floor is a
  floor PLAN seen from above and the nine plans stack as bands up the
  map - F1 at the bottom edge, ROOF at the top. Walking up the screen
  is walking up the building.
  LANDED THIS PASS: `src/systems/world_tower.js` (PC.TowerLayout) +
  `src/data/story/map6.js` + region dispatch + index wiring.
  Geometry: BAND 1024/floor, interior 4608x832, stairwells 448 wide
  through the 192px slab, ends ALTERNATING so every floor is crossed
  (a switchback climb); balconies jut 1408px into the sky off F5 SKY
  DECK (east) and F8 OBSERVATION (west); roof band is wider.
  Three surfaces and only three, so a kid always knows where they
  stand: FLOOR (lit, walkable), STRUCTURE (concrete guts, solid),
  SKY (night city far below, solid). Same GRID law as the Underground
  - quantize once at 64px, flood-seal anything unreachable from the
  lobby, and let paint/collision/wall-edges all read those cells.
  Per-floor furniture gives each floor a shape: lobby desk+planters,
  CUBICLE MAZE on F2, food-court kiosks, Frank's plant room, sky-deck
  planters, F6 ATRIUM light well (walk the ring), server rack rows,
  observation bar, rooftop AC units. Floor identity is a faint colour
  WASH + one honest marking each (no camouflage texture - that lesson
  came from the sewer rock). Stairwells paint as real steps with
  handrails and a green landing nose. Floor-number signs on every
  floor, STAIRS UP at every shaft, OPEN BALCONY on the juts.
  GATE: new `verify-tower.js` - BFS the real collision grid from the
  lobby spawn: **8168/8168 cells reachable**, every floor PASSes from
  BOTH ends, both balconies, all 8 stairwells top and bottom, and all
  9 quest targets. Atlas renders zero errors.
  **NEXT, in order:** (1) escort system - one hero follows and
  auto-fires their signature, handing off at each stairwell; (2)
  mission8 objectives + the 20 already-WRITTEN finale VO lines; (3)
  Frank Mk-II mid-boss on F4 + CHOMP 3-phase on the roof (needs a
  PixelLab batch: 3 phase forms + the powered-down/reboot pose);
  (4) ending, credits, endless/Patrol unlock; (5) mapview tower
  schematic + missions-node gate on Grapnel-Sight.

- **2026-08-06 - v0.43.0: THE WALKING SPACES (Mark: "The underground
  is a confusing place. I can walk on water? The catwalk isn't a
  catwalk? What's the point of the bridges?").** Three answers, all
  enforced by the grid so paint == collision:
  (1) **WATER IS SOLID in the Catwalk Maze.** v0.42.0's wading slow
  was a half-measure - if you can walk it, it isn't water. Now
  `_analyticCarved` opens the maze ONLY within 66px of a deck lane,
  so the planks are the floor. (The food still ignores terrain - it
  beelines through anything, engine-wide - so the maze is a PLAYER
  constraint: they ooze at you across the water while you're held to
  the walkways. That is the tension the zone is for.) The water is
  painted in a new step 1b
  UNDER-FLOOR pass (before the floor clip) - dark water, depth
  pooling, ripples - so what you can't walk on still LOOKS like the
  reason you can't.
  (2) **The catwalk is a real lattice.** Decks now run on every block
  line (512px lattice, a superset of the odd tunnel lines, so every
  tunnel mouth still lands on a deck) instead of three lonely planks
  in a lake: 6 vertical x 5 horizontal decks, 128px wide, weathered
  timber (new COL.deck family) with cross-boards, a center stringer
  beam, and HANDRAILS + posts down both edges. Wall edges over water
  render as deck curb + rail (and a water-shadow band instead of the
  black rock void - a black gap read as a hole you could fall
  through).
  (3) **The bridges have a point.** The gutter drains (44px channels
  down every non-ring corridor) now cost you: within 22px of the bent
  centerline you wade at 0.8x - EXCEPT on a bridge deck. `onBridge()`
  matches the painted planks exactly (every 256px, +/-15), and the
  live flow overlay skips them too, so dry-looking stone IS dry. The
  "WADING..." label fires once per run per kind (a per-entry label
  flickered every few steps down a corridor).
  Also: goo banned from the maze (biome identity), catwalk shimmer
  skips the planks, and quest targeting got `snapWalk()` - any
  objective point that lands off-floor is pulled to the nearest
  walkable cell (the surge-exit target sat in the rock band between
  corridors and could never have closed).
  Battery: connectivity 12300/12300 cells reachable + all 12
  objective points PASS, objectives suite 6/6, subway 4/4, unlock
  5/5, probes + atlas zero errors. NEW GATE `verify-catwalk.js` -
  BFS the collision grid, then DRIVE the player through it with the
  real MoveInput vector (no teleports): 65 cells / 23 waypoints from
  the north approach to the surge exit, arrived. "The grid says it's
  connected" is not proof; a body walking it is. Version pair 0.43.0.
  **WATCH:** stage7's SURVIVE THE SURGE is where the campaign bot
  walls (3/3 deaths, minHP 1-9) - it walled there BEFORE this change
  too (see bots7.log), so it is not a v0.43.0 regression, but the
  128px decks make the crossing tighter. If it plays too hard for
  kids, the levers in order are: the surge ring size/interval in
  quest.js (8 per 5s, already x EASE.ring 0.55), then EASE.STORY.ring,
  then widening the decks to 256px (4 grid cells - 128 and 256 are
  the only widths that land on cell lines).

- **2026-08-04 - v0.42.0: LIVING UNDERGROUND (Mark's map-review batch:
  animated water, fungal identity, reservoir story, catwalk vision,
  pump definition).** (1) LIVE WATER: src/systems/sewerflow.js - the
  terrain is cached, so a thin live overlay animates on top (same
  trick as the train): flow dashes drift along every sewer gutter
  toward the sump, shimmer glints cross the Catwalk water, spore
  motes drift down the Fungal Cavern. VFX-DNA rules (per-line phase
  seeds, two-clock sines, zero allocation). (2) FUNGAL CAVERN: whole-
  cavern green moss wash + mossy pools, hero mushrooms up to ~76px,
  and a ZONE EFFECT - thick spores slow the player to 0.78x inside
  ("THICK SPORES..." float on entry). (3) CATWALK VISION answered:
  planks are the fast path; stepping in the water WADES (0.6x slow,
  "WADING..."), enemies unaffected - the maze now means something
  without hard walls (zoneEffectAt in world_sewer.js, speed hook in
  game.js). STAY ON THE CATWALKS sign added. (4) COLLAPSED RESERVOIR
  rebuilt to tell its story: concrete tank ring, three tiered
  drained-basin stains stepping down to the last puddle, crack web
  from the pool rim, and a caved-in NE corner - rubble cone, stone
  boulders, two fallen I-beams, dust fan + STRUCTURE UNSAFE sign.
  (5) PUMP WORKS defined: industrial plate-floor zone, two riveted
  pressure tanks with feed pipes, a floor pipe run linking all three
  pumps, drain channel to the gutter. SPORE ZONE sign at the fungal
  approach. Battery: objectives + subway green, probes + atlas zero
  errors. Version pair 0.42.0.

- **2026-08-04 - v0.41.0: SIGNAGE + STATIONS (Mark: "obvious subway
  distinction and obvious sewer distinction... signs... obvious
  subway hubs... take a nice hard look").** The Underground learned
  to talk. ZONE IDENTITY: wall edges near the Loop Line ring render
  as pale SUBWAY TILE with a cyan accent lip vs warm sewer brick
  everywhere else (_nearRing in _wallEdges). STATIONS: 8 platforms
  (4 ring corners + 4 mid-ring incl. under the Main Grate) - tiled
  decking, yellow safety line, shadowed columns, bench, LOOP LINE -
  STATION board; corner stations SPLIT into two decks capped with
  safety strips so no deck ever runs under a rail, and every
  track-x-track crossing sits on an 80px dark diamond plate with
  steel border + X brace. SIGNAGE (canvas fillText, 10px caps,
  precomputed world-coord list): landmark arrow plates at every
  cavern approach (first walkable pad N/S/E/W), SEWER ACCESS +
  AUTHORIZED PERSONNEL ONLY at the grate, NO SWIMMING (sump), CITY
  VAULT - KEEP OUT (cistern), SURGE ZONE - DO NOT STOP (catwalk),
  MIND THE TRAIN / LOOP LINE plates along the ring. Z-ORDER LAW:
  signage is the map's FINAL paint layer - nothing can occlude a
  sign (a goo blob over the RESERVOIR plate taught us). Also: goo
  banned from ring corridors (the subway stays swept), pump manifold
  got seams + rivets (was a flat lavender slab), reservoir basin got
  the corridor seam grid + stone-toned rubble (no third surface
  value, no dark spots), catwalk ripples ~2x. Judge ran a hard-look
  round (ITERATE, 6 findings) + confirmation round: SHIP - "the
  crossing went from the worst artifact on the map to one of its
  best set pieces." Probes grew sw_sign + sw_station cameras.
  Version pair 0.41.0.

- **2026-08-04 - v0.40.0: THE GRID (Mark: "boundaries more strict...
  a nice straight line at the edge... tiling should not mix... black
  spots in the middle of paths don't make sense").** The sewer carve
  is now QUANTIZED once at region build onto the 64px collision grid
  and cleaned: (1) one smoothing pass joins lone nubs so stepped edges
  read as deliberate tiles; (2) rock components smaller than 12 cells
  (stray debris in walkways) become floor - NOTE THE LESSON: the first
  version removed rock "not connected to the map border", but the
  subway ring is a floor MOAT, so every interior rock mass counted as
  an island and the whole map melted into one plaza (caught on the
  atlas render); size is the correct test; (3) floor unreachable from
  the spawn becomes rock (kills sealed pockets, guarantees ONE
  region). From then on the grid IS the level: carvedAt is a grid
  lookup, solids/paint-clip/wall-edges all read the same cells, so
  every boundary is a hard axis-aligned line and paint === collision
  by construction. Paint clip switched from sampled polygons to
  merged floor-cell rects (_floorRects); pipes + goo now draw inside
  the same clip so decor can never bleed onto rock. The serpentine
  tunnels survive as stepped tile paths (deliberate, Zelda-like)
  instead of wobbly curves. Battery: connectivity 100% + all mission
  points, subway 4/4, objectives (hold + sequence) green, atlas
  clean. Version pair 0.40.0.

- **2026-08-04 - v0.39.0: SEWER READABILITY OVERHAUL (Mark on-device:
  "I don't know if I'm under or in or if there's a roof... anything
  not walkable should be rock, bordered by walls... reconsider").**
  Root cause: the rock's boulder texture put mid-tone shapes over the
  dark that read as a CEILING, and the wall treatment was decorative
  banding, not walls. The fix is the classic top-down dungeon grammar:
  (1) rock is FLAT near-black (#0c1110) with barely-visible mottle -
  no boulders, no cracks, no mid-tones; (2) floor lifted to a clearly
  lighter flagstone (#4a5a52 family) - hard two-value world;
  (3) REAL WALL EDGES: 16px cell scan off carvedAt draws a warm brick
  course (void gap -> #6b5844 brick w/ joint ticks -> pale lip) ONLY
  where floor truly meets rock - no phantom bands across open rooms
  (the old clipped-stroke approach drew corridor edges through
  chambers); (4) noise cut: wet glints, ambient puddles, rock cracks
  all removed; goo recolored to bright slime green MATCHING the d5
  mobs (was swamp-olive) and density reduced to near-sump only.
  Landmark painters remapped to the new palette. Probes + full atlas
  zero errors. Version pair 0.39.0.

- **2026-08-04 - v0.38.0: ?unlock=1 PREVIEW MODE (Mark: "a version
  with all the new levels unlocked so I can try them").** Same live
  build, opt-in by URL param: every BUILT stage shows ACTIVE on the
  mission map (finale stays SIGNAL SCRAMBLED), the stage-7 Hydro-Drill
  seal is bypassed, and story runs get a PREVIEW LOADOUT banner + two
  free upgrades at start (the boss-drop grant path) so late stages are
  testable on a fresh kit. Runtime-only by design: the story save and
  meta wallet are never written by the mode, so dropping the param
  resumes normal progression exactly where it was. The self-healing
  cache reload now PRESERVES query params (it used to strip ?unlock on
  the version-mismatch reload). verify-unlock: 5 checks green (flag,
  all-active, unsealed brief, loadout grant, and param-off = normal
  gating untouched). Version pair 0.38.0.

- **2026-08-04 - v0.37.0: SIGNATURE OBJECTIVES, KEPT SIMPLE (Mark:
  "create some variation... keep them simple so there's no possible
  errors").** Two new objective behaviors, both pure timer/distance
  logic on the proven quest engine. (1) VALVE HOLD (stage 7 B2, now
  CRANK THE VALVES): fetch grew an optional `hold: seconds` - standing
  within 44px fills a progress ring (green when close, gold when
  paused); walking away PAUSES, never resets; audio tick while
  cranking. (2) ORDERED SWITCHES (stage 6 B2, now REROUTE THE VAULT
  POWER, replacing the blueprint fetch): new 'sequence' type - three
  NUMBERED breakers around the Vault flipped 1-2-3; the right one
  chimes + turns green + spawns a guard ring; a wrong one buzzes,
  resets all, and locks out until the player steps 70px back (no
  re-trigger machine-gunning); compass points at the next pending
  switch; banner counts x/3. Carlos/Danny page quips folded into the
  switch lines. Cleanup: next() destroys leftover item/switch visuals
  + the hold gfx (scene-reuse safe). DEFERRED per Mark's caution: park
  herding (build only if provably unbreakable); REJECTED: suburbs
  river crossing; train-riding shelved (the risky one). Battery:
  verify-objectives 6/6 (no instant take, pause-not-reset,
  wrong-order lockout + recovery, completion) + mission/ease/subway
  regressions green, zero page errors. Version pair 0.37.0.

- **2026-08-04 - v0.36.0: THE UNDERGROUND TWISTS (Mark: "add twisting
  and turning spaces... a real subway hub connecting to sewers, not
  just straight lines").** The sewer fabric's third geometry pass:
  every NON-ring tunnel now serpentines (centerline offset +-104px by
  smooth noise, baked into carvedAt so collision still equals pixels),
  junction chambers went lumpy-organic (8 hashed spoke radii lerped by
  angle), and DIAGONAL interchange connectors cut between junction
  nodes (~10 hashed segments, 184px wide). THE SUBWAY RING STAYS
  ENGINEERING-STRAIGHT - the train needs it, and the contrast is the
  design: bored transit tunnels vs hand-dug winding sewers. Paint
  side: _shapesFor emits sampled POLYGONS for winding strips/lumpy
  chambers/diagonal quads; the wall treatment unified into clipped
  boundary strokes (lip under, masonry skirt, edge shadow - works for
  any shape); water gutters and wall pipes are stroked polylines that
  follow their tunnel's curve; ring rails/bridges unchanged. Map view
  schematic deliberately stays straight-line (subway-map style).
  verify-subway 4/4 green after the rework, probes + full atlas zero
  page errors. Version pair 0.36.0.

- **2026-08-04 - v0.35.0: THE LOOP LINE + GLOOP KING REGEN (Mark's
  round on the sewers).** (1) SEWER/SUBWAY COMBO (Mark: "the subway
  rotates around the whole map slowly and it's a constant threat"):
  the outer ring corridors (cols/rows 1 and 17) now carry subway
  RAILS instead of water gutters (world_sewer.js _railsV/_railsH -
  twin steel rails, ties, third-rail warning stripes; the ring passes
  through the Main Grate cavern, which now reads as the station).
  src/systems/subway.js: PC.Subway - a 3-car ghost train orbits the
  16.4k-px ring at 210px/s forever; headlight beam, rumble+shake
  telegraph within 620px, damages the player through the normal
  armor/i-frame math (14 contact), and FLATTENS any food monster on
  the rails (dodge = skill, wake-riding = reward). Sewers-only
  (game.js guards on region id, nulled per create); map view draws
  the ring in gold twin rails. verify-subway.js: 4 checks green,
  zero page errors. (2) GLOOP KING REGENERATED (Mark: the old art's
  center drip "looks strangely inappropriate"): new 8-frame set with
  an explicit flat-skirt prompt (wide melting dome, candle-drip
  skirt, NOTHING central), quantized as before + a crown-gilding
  pass (frames 2-8 came out pale-crowned; topmost-20px band of each
  frame remapped to frame 1's gold so the walk cycle can't flicker).
  (3) Stage 7 renamed DOWN THE DRAIN (v0.34.1, Mark: GOING DEEP
  sounds inappropriate) - chain, mission, VO script all updated.
  (4) Full-map atlas render (map-atlas-sewers.js in scratchpad)
  delivered to Mark. Version pair 0.35.0.

- **2026-08-04 - v0.34.0: MAP 5 - THE UNDERGROUND (the whole Sewers,
  Mark: "complete the entire sewers... same design intricacy and
  philosophy").** The fifth fabric and the first INVERTED one:
  world_sewer.js carves tunnels OUT of solid rock - corridors 256px
  wide on the odd block lines (walls 768 thick), junction chambers
  where lines cross, eight spec caverns; carvedAt() is the ONE
  deterministic source for painter + solids, corridor bounds sit
  exactly on the 64px solid grid so collision === pixels. THREE judge
  rounds to SHIP (verdict: "the most distinctive map of the five"):
  round 1 killed the grid-textured rock (a grid reads as FLOOR - rock
  is now near-black irregular boulder mass), round 2 split the three
  green grammars (moss = desaturated wall-hugging patches; sludge =
  dark-olive outlined puddles with bubbles, zone-gated so clean rooms
  stay clean; mushrooms = cap-on-stem with spots + glow pools, fungal
  only) and built the light logic (grate daylight beam, mushroom glow,
  cistern treasure pool = the only bright spots), round 3 densified
  the mushroom clusters + scaled the Gloop King's junk throne to a
  real centerpiece (stepped junk base, gold-trim tapering seat back +
  finial). Judge residuals (non-blocking, future polish): catwalk
  ripple dashes + pipe couplings, reservoir upper-strip rubble.
  MISSION 7 GOING DEEP (stage7, spec IV.5 lines verbatim): clear
  Junction Alpha -> 3 guarded VALVE WHEELs (pumps/fungal/reservoir)
  -> SURVIVE THE SURGE, the new 'reach' quest type (stepping onto the
  Catwalk Maze arms it; goo boils up around the player every 5s until
  they exit the far side - the timer is the crowd) -> THE GLOOP KING
  (5600 base HP, story-eased like all bosses) -> rescue NAYAH +
  chant. d5 roster blob/drip/moldy/eggy/heap + boss, 23 PixelLab
  pieces (24 generations, ~1035 left), follow-up frames quantized to
  frame-1 palettes. HYDRO-DRILL soft gate per spec I.2: Garage grew a
  GEAR strip (one-time TP gadgets, appears once the Labs are cleared;
  drill 150 TP) and the stage7 node shows SEALED + Vic's verbatim
  gate line + a button that walks you to the Garage. The Old Cistern
  pays a once-per-save coin+gem jackpot on first entry. Map view
  draws the tunnel schematic (dark rock, lit corridors, chambers).
  VO script regenerated: 133 lines, stage-7 spec lines SHIPPED, 11
  new connective lines DRAFT pending Mark. Battery green
  (ease/linear/map + probes, zero page errors). Version pair 0.34.0.
  NEXT: the FINALE - Adventure Tower vertical ascent + CHOMP.

- **2026-08-04 - v0.33.0: MARK'S POST-AUDIT BATCH.** Four asks from
  his review of the campaign audit. (1) RUSH MODE: QUICK RUN renamed
  on the title (only UI spot it's named). (2) EARNED CHESTS: the free
  supply chest at defend-ARM and boss-ARM is gone (Mark: "abilities
  need to be EARNED... unless you beat a boss or collect resources");
  the chest now drops as the REWARD for completing a hold, and bosses
  pay on the kill as before. (3) RECOVERY FROM THE TABLES: story
  kills roll medkits at 3% (rush stays 1.5%); crates + the checkpoint
  patch-up unchanged. (4) VIC'S PAD (src/story/tutorial.js, new
  file + index.html): the opening tutorial is a full-screen
  transmission TO THE PLAYER - scrim, cyan pad frame, INCOMING
  header with blinking signal bars, Vic portrait, five taps with one
  icon per idea (~40 words replacing six radio paragraphs); same
  once-per-save flag. BALANCE FALLOUT of earned chests: stage 1
  re-walled (bot lost the Frank duel 3 straight), root-caused the
  duel itself - the 320px/s lunge vs 190px/s player means RUNNING
  AWAY mathematically never escapes; only a sideways dodge in the
  0.7s telegraph survives. EASE knob grew bossCharge 0.75 (story
  lunge 240px/s - a head-start retreat now escapes a full lunge) +
  bossHp 0.42 (buys back the removed arm chest). ALSO FIXED, found
  by the gate runs: killing a story boss set scene.won which made
  die() A NO-OP for the whole rescue tail - the bot once finished a
  mission at -56 HP immortal; `won` now clears when the quest takes
  over, hp floors at 1 there, and contact/puddle damage stops
  applying once dead. GATE DATA (fresh-save bot, weak dueler): duel
  win rate ~1 in 3-4 at rank 0-1; every loss pays 40-60 TECH so
  rank 1-2 arrive within two retries. Humans read telegraphs far
  better than the bot - MARK SHOULD FEEL THE FRANK DUEL ON DEVICE
  and rule; softening levers if wanted: bossHp 0.35, bossContact
  0.6, or a first-boss-only mercy. verify-v33 (7 checks: rename,
  pad flow, earned chests, odds) + verify-mission (updated: pre-mark
  tutorialSeen - the pad has its own harness; and the v0.19 freeroam
  final-wait fix) + ease/linear/freeroam/garage/map + beam/comet/
  lasso ALL GREEN, zero page errors. Version pair 0.33.0.

- **2026-08-04 - v0.32.0: FULL-CAMPAIGN BOT AUDIT -> STORY BALANCE +
  THE BOSS-AIM BUG.** Mark: "Greatest system to play the game. Try it
  out... test the economy of tech and in cash... see what's too easy.
  Do the whole game as much as we have." Built a PLAYER BOT harness
  (scratchpad bot-play.js): drives the real MoveInput vector, dodges
  crowds, orbits clear rings, kites bosses, steps out of ketchup
  puddles, breaks crates when hurt, taps dialogue, and SHOPS between
  attempts (Garage TECH first, then Sal's priority list). 3 attempts
  per beat, 7-min cap, full economy sampling. BASELINE (v0.31.1):
  **1 win in 18 attempts, 5 of 6 stages hard walls.** Root causes:
  (1) wall-clock spawn phases + no story leveling - travel/fetch burn
  clock so late objectives met phase-5 pressure (129 live at a t=210s
  defend) on a base kit; (2) zero HP recovery between objectives -
  attrition compounded (bot entered stage1's boss at 2 HP); (3) defend
  spiral - pushed out pauses the timer but waves kept spawning, crowd
  only grew (two 400s+ uncompletable holds); (4) bosses quick-run-tuned
  (3000-5000 HP, 20-26 contact vs ~22 DPS kit); and (5) **a real bug:
  PC.aimAt only scanned enemies.pool - AUTO-AIM COULD NEVER TARGET THE
  BOSS** (scene.boss is separate), duel shots streamed along the walk
  direction and hit Frank by accident. FIXES (story tier only, quick
  run untouched): story spawn clock (game.js spawnT - full rate only
  while an objective is hot, 0.25x traveling, capped 210s; timeline
  rings ride it + theme per map roster); checkpoint patch-up (+1/3 max
  HP per objective complete, quest.js next()); defend wave guard (no
  new waves past 45 live); EASE bossHp 0.5 / bossContact 0.75
  (boss.js); boss beat arms with a supply chest like defends; and the
  aim fix (boss is a first-class aimAt target - benefits quick run
  too). VERIFIED: stages 1+2 now WIN FIRST TRY (stage1: full HP at
  every checkpoint, ~100s Frank duel dipping to 3 HP - a real climax;
  stage2 154s comfortable); stage3 attempt1 beat defend+boss and timed
  out only in the final rescue cutscene at the harness's 7-min cap.
  Remaining stage3 "failures" were bot-nav artifacts (minHP 69-100,
  lost in the park's organic geometry - kids can see). Battery green
  (ease/linear/freeroam/garage/map/mission + beam/comet/lasso);
  verify-mission's final wait updated for the v0.19 freeroam seam
  (was stale, expected PC_Results). ECONOMY (measured): guaranteed TP
  m1-m6 = 125/105/125/105/125/125 = 710 + ~10-30 kill TECH per
  mission; Garage max 380/hero -> campaign funds ~2 maxed heroes;
  coins ~0.26/kill + crate fans (15-30) + boss fan -> first Sal's rank
  after ~1-2 missions, deep ranks long-tail; LOSS payouts kept every
  retry meaningful (bot could always buy something after 2 losses).
  Defend zones centered on solid landmarks (park) are slightly awkward
  - flagged, not changed. FIXED-BUILD RESULTS: stage1 WIN 1st try
  (257s, Frank duel 100->36 dipping to 3 - a real climax), stage2 WIN
  1st try (154s, minHP 88), stage4 WIN 1st try (297s, minHP 21),
  stage3 attempt1 beat defend+boss and timed out only in the final
  rescue cutscene (harness 7-min cap); stage5 played FRESH-SAVE
  (conservative, ~half real player power) = 2 duel losses then WIN on
  attempt 3 with garage rank 1; stage6 fresh-save stalled on the
  Behemoth duel but a focused boss-diag PROVED mechanics sound (aim
  locked BOSS, ~23 DPS landing continuously -> ~40s kill at real
  stage-6 power). Remaining bot failures were its own nav/kiting
  ceilings, documented in the logs. LOW-PRIORITY EDGE to verify
  someday: one stage5 win sampled hp=-4 mid-final-beat - possible
  race between the mission-complete heal and the death check.

- **2026-08-02 - v0.31.1: CLARITY + FLAVOR BATCH (Mark's carry-forward
  list).** DESCRIPTION LAW: every passive, shop power-up and the
  jawbreaker's level lines rewritten dummy-proof - name the concrete
  effect AND what it applies to ("Blasts, rings & swings reach 12%
  wider", "ALL weapons hit 8% harder per rank", "Anything you SHOOT
  flies faster"), no stat jargon (Mark: "increased weapon area - what
  does that mean, for what weapons?"). SHARP EYES desc no longer says
  XP (gems are the currency word now). MUSTARD SEED honors its promise
  in story mode: with no level-ups it grants one upgrade outright at
  run start (boss-drop grant path) instead of banking 5 useless XP.
  JAWBREAKER: three REAL hard-candy sprites generated (pinwheel swirl,
  wrapped strawberry - the grandma candy - and a striped mint); each
  shot picks one at random, untinted and SOLID (the bullet system
  ADD-blends everything but pellets - candy frames are excluded or
  they'd glow like plasma), tumbling as it caroms. ADVENTURE TOWER on
  the mission map is a real skyline piece now: stepped silhouette,
  lit window grid with dark gaps, ledges, antenna, and the Ray as a
  layered purple glow with a pulsing pink core - compact enough to
  clear the header (first draft collided with it). Battery green.
  STILL OPEN: city building uniqueness + VOTE NAYAH poster; side
  quests; weapon-combo system (banked).

- **2026-08-02 - v0.31.0: ON-DEVICE FEEDBACK BATCH 2 (Mark, confirmed
  on-latest this time).** ECONOMY CLARITY: story mode shows NO XP
  anywhere - the counter reads `TECH +n` live as gems are collected
  (Mark: "are tech points the same as exp? that's all confusing").
  Two currencies on screen, ever: coins (Sal's) + TECH (Garage). The
  XP bar survives only in quick run, where levelling is the loop.
  TOP DECLUTTERED: MAP button moved to bottom-right above the home
  indicator; the objective banner centres in the space RIGHT of the
  HUD column (`scene.hudRight`) so it can never overlap the tray.
  FIRE ORIGIN: all shots now leave from CENTRE MASS - `PC.fireY(scene)`
  (py - FIRE_LIFT 16) replaced every hand-rolled `scene.py - 4/6`
  across weapons/kits/arsenals/heroes2 (they came from the feet).
  DEFENDS BEATABLE: arming a defend AIRDROPS a power chest at the zone
  (same walk-over grant as boss drops) - with fixed loadouts the hold
  was the wall (Mark: "defend substation is unbeatable"); waves also
  slowed 4.5s/8 -> 7s/6 and stage1's hold cut 60s -> 40s.
  START WHERE YOU STOOD: same-map missions launched from the free-roam
  board no longer teleport you back to the district entry
  (PC.STORY.pendingSpawn carries the position through the restart).
  MAP 1 REWORK: the Nourish-Ray Stage is now THE DEMO SITE - the
  wrecked demo stage where the story began (broken platform, torn
  "THE END OF HU-" banner, scorch blast, the first purple goo, hazard
  tape); Central Plaza got ring paving + fountain + planters/benches/
  flags; the Mission Board is an OPEN KIOSK that reads as what it does
  (signboard of pinned notices, MISSIONS header, gold GO! note,
  floodlight) - Mark asked twice what that building was, because it
  WAS just a building. Full battery green.
  STILL OPEN (carry-forward): dummy-proof ability descriptions;
  jawbreaker as real hard candies; city building uniqueness + VOTE
  NAYAH poster; finale tower node art; side quests; weapon-combo
  system (banked).

- **2026-08-01 - v0.30.2: ON-DEVICE FEEDBACK BATCH 1.** Mark played a
  long session and filed ~19 notes; this is the half that was breaking
  the session. **THE BIG ONE - STALE INDEX:** he had been playing
  v0.29.0 while believing it was v0.30.1, which invalidated four of his
  observations (no HP gauge, level-ups still firing, spawns still
  brutal). `?v=` busts every SCRIPT but index.html itself has no
  buster, so a CDN can serve an old index forever. FIX: `version.json`
  + a boot check in index.html that fetches it uncacheable and, if the
  build differs, reloads ONCE against a fresh URL (sessionStorage
  guard, no loop). **version.json is now part of the version-lockstep
  set with PC_BUILD.** THE REST: the "persistent cone on the character"
  was `itemGlow`, a muzzle-cone sprite pinned to the hero and pulsing
  forever - CUT, and `vfx.muzzleFlash` is now a no-op so every call
  site stays valid (Mark: "the muzzle flash effect is not good"). The
  objective banner's panel was hardcoded at y 27 h 15 while the TEXT
  moved with the type scale in v0.27.2, so the text hung below its own
  bar - the panel is MEASURED from the text now (the same R4 lesson as
  the dialogue box; watch for other hardcoded panels). The intro TV was
  sized in pixel constants tuned at BASE 312 and floated small and high
  after the zoom-out - the set is proportional to the viewport now and
  centred in the space ABOVE the dialogue box. Spawn pressure halved
  again (story 415 -> 268 spawns/min, cap 156 -> 109). NEW SCENE
  `danny_interview` replaces the brooding `danny_room` beat: Danny
  answers the press on camera ("I'm gonna find my team - and we're
  gonna put this city back together"), with two new PixelLab stamps
  (cs_reporter, cs_danny_mic) and press-flash pops. Battery green.
  **STILL OPEN from that session, in Mark's words** (next batches):
  ability descriptions must be dummy-proof ("increased weapon area -
  what does that mean, for what weapons?"); the bouncing candy weapon
  should look like real hard candies and vary between them; city
  buildings need per-building uniqueness; the VOTE NAYAH FOR MAYOR
  poster Easter egg is missing; the Nourish-Ray Stage and the Mission
  Board don't read as anything; buildings have openings you can't
  enter (walk-on-top confusion); side quests still unbuilt; the finale
  tower node on the mission map needs detail; and BANKED for later -
  combining weapons/abilities into OP combos.

- **2026-08-01 - v0.30.1: HP GAUGE + THE LOADOUT TRAY (Mark: "easier to
  read hp bar and a section under that, that shows which abilities and
  weapons have been chosen and filling out the boxes. Like vampire
  survivor does").** HP was a 70x8 sliver of flat colour; it's now a
  framed gauge - dark socket, lit top edge on the fill, segment ticks
  every 25 HP, the number printed on the bar, and the fill shifts
  CHERRY -> CHEESE -> KETCHUP as it drops, so "am I hurt" is readable
  without counting pixels. THE TRAY: two rows of slot boxes under the
  bars - 4 weapons (cyan) over 4 passives (lime) - each filled slot
  showing its icon on a slate bed with a rank pip on a dark chip, gold
  frame + ★ when maxed or evolved; empty slots stay near-black with a
  dash so a kid can SEE what's still open. The whole block is inset off
  the screen edge and the run stats moved below it. TWO PHASER GOTCHAS
  worth keeping: (1) a Container renders children in ADD order and
  IGNORES their depth, so the slot icons had to be attached AFTER the
  hud graphics or the opaque box beds painted over them - hence
  `attachLoadout()` called last; (2) icon frames are NOT a uniform
  source size, so a fixed setScale let some art spill out of its box -
  use setDisplaySize. Full battery green (ease/linear/map/labs/
  suburbs/park/freeroam/garage/beat4).

- **2026-08-01 - v0.30.0: THE PROGRESSION REWORK (Mark: "make the game
  a little easier, the enemy spawns are overwhelming... I don't think
  our players should level up in story mode, it should only be
  gathering exp and cash and then upgrading after completions or
  losses... give the bosses a power up drop... players only gain
  abilities by buying them or defeating bosses").** Four changes that
  only work TOGETHER, which is the thing to understand before tuning
  any of them: in a survivors-like the spawn ramp is balanced against
  an in-run power curve, so removing level-ups without flattening the
  ramp would have made minute 4 unwinnable - the exact overwhelm Mark
  reported, worse. THE EASE KNOB: `PC.EASE` in config.js, two tiers
  (QUICK / STORY), multiplied into the director's interval + live cap
  and into quest ring/clear counts - ONE place to tune pressure
  instead of four spawn tables. Story at 4:00 went 643 spawns/min @
  cap 260 -> 415 @ 156 (measured by verify-ease, not eyeballed).
  `PC.TIMESCALE` HP/DMG per minute softened 0.10/0.04 -> 0.06/0.025
  for the same reason. NO STORY LEVELLING: gainXp banks
  `scene.bankedXp` and returns - no card pick ever interrupts an
  objective, the HUD reads `XP nnn`, and the XP bar fills toward the
  next TECH chunk so banking still has a heartbeat. Quick run keeps
  the classic level-and-pick loop untouched (it's the arcade mode).
  THE PAYOUT: results converts banked XP -> TP at 10:1 on a WIN and on
  a LOSS - a defeat is now productive, which is what makes the
  "upgrade after completions or losses" loop honest. Coins already
  persisted on pickup. BOSS DROPS: `PC.Boss.die` calls
  `scene.dropBossPower()`, leaving a glowing chest where the boss
  fell; walking over it GRANTS one existing upgrade via PC.applyCard -
  new weapon > evolution > rank-up, never a heal - with a one-line
  reveal banner. No menu, no decision: in story mode this is the only
  power spike inside a mission and it should feel like a trophy.
  NET SHAPE: abilities now come from Sal's (coins), the Garage (TP,
  now fed by every run), and bosses. GOTCHA FIXED: fx.burst asked for
  5 frames of a 4-frame fx_levelup set. New harness verify-ease.js;
  full battery green (linear/park/labs/suburbs/freeroam/map/garage/
  beat4). OPEN QUESTION for Mark after he plays it: with a fixed
  loadout, a mission with no boss (e.g. beat 4) has no power spike at
  all - if that reads flat, the fix is a mid-mission supply crate that
  grants like the boss drop, NOT re-enabling level-ups.

- **2026-08-01 - v0.29.0: THE DISTRICT MAP (Mark: "put a map view when
  the player presses pause or goes to the menu for story mode - it'll
  help with navigation").** The districts are 7680px square and the
  camera shows ~400 of that, so the compass arrow alone never answered
  "where am I / what's around me." NEW `src/scenes/mapview.js`
  PC_MapView, an overlay scene on the shop/garage contract
  ({overlay, resume} pauses the run; {back, mapId, missionId} previews
  from the menu). It draws a SCHEMATIC from each layout engine's OWN
  geometry - park polylines + ponds, suburb streets + culs + frosting
  rivers, labs road bands with glowing seams, city street grid - so a
  district reads as itself at a glance. On it: numbered landmark lots
  (legend below), the live objective as a pulsing gold ring, walk-in
  storefronts wearing $ / G chips instead of an index (one chip per
  lot - stacked markers collided), YOU as a pinging green dot, the
  free-roam board as NEXT, plus an objective strip with distance +
  8-point compass and a MISSION checklist (done / now / coming).
  ENTRY: a [MAP] button top-right in story runs only (a quick run has
  no district), M or ESC on desktop; and a 4th MAP button on the
  mission map footer. THE BUG THIS SHOOK OUT (worth remembering):
  GameScene is ONE instance reused for every run, so conditionally-
  created HUD objects persist as DESTROYED objects into the next
  create - the quick run re-attached the story run's dead buttons and
  Phaser threw `undefined.sys` inside uiAttach. Null every optional
  HUD field at the top of create. New harness verify-map.js: MAP
  pauses + opens on top, nothing moves or takes damage while it's up,
  RESUME restores the same spot, the clock is frozen, and the menu
  preview runs with no game behind it - across all four districts.
  Full battery green (linear/freeroam/garage/park/suburbs/labs/text).

- **2026-07-31 - v0.28.0: SUPER DUDE LABS (Map 4 / beat 6) + THE
  REVEAL.** The fourth fabric: INDUSTRY (`src/systems/world_labs.js`
  PC.LabsLayout) - strict Manhattan service roads (hazard-stripe
  edges, glowing cyan lab seams, dashed junctions), warehouse/server-
  shed filler walked along the roads, chain-link YARDS (tank farms /
  crate stacks / cable spools, gate gaps), OVERHEAD PIPE RUNS that
  cross roads on stanchions (SE-displaced shadow sells the height),
  conveyor belts, floodlights/valves/forklifts, oil stains + grates -
  and the mutated-JUNK story layer (purple goo, glinting junk piles,
  sparking wires, can heaps) heaviest around Central Control, whose
  roof is cracked open and erupting. Landmarks: Front Gate (booth,
  barrier arms, SUPER DUDE LABS sign), Reactor Yard (dome NORTH of
  the yard so the defend ring is walkable - a solid dome centered on
  the quest spot made B3 unwinnable, caught by verify-labs), vault
  (bolted plating + giant hatch wheel), roofless Assembly Hall
  corridor, twin Cooling Towers, Antenna Array (glow ring + dishes +
  lattice mast), Central Control, Loading Docks. Mission 6 "SIGNAL
  LOST" (`mission6.js`, spec cast lines VERBATIM + new connective
  lines in VOICE_SCRIPT.md): clear gate -> 3 blueprint pages at the
  vault -> stabilize reactor 70s -> VENDING BEHEMOTH (hp 5000,
  rear/lunge) -> rescue CARLOS at the Antenna Array, where
  {action:'reveal'} plays THE REVEAL (quest.towerReveal: world dims,
  Adventure Tower silhouette rises, a cyan signal arc traces up to
  the Ray's glow, flash, release) before the chant. d4 roster is
  REAL PixelLab art from day one (pl-batch-d4.py, 22 gens: zipper/
  chipbag/soda/burger/microwave + boss walk x4 + poses; ~1068 gens
  remain). Critters gated to park/suburb fabrics (a squirrel wandered
  into the labs). Spawn set 'junk' + ringKinds row. verify-labs.js
  B1-B5 ALL GREEN incl. the reveal; full battery green.
  JUDGE LOOP (3 rounds): R1 kills - hall floor painted OVER its own
  belts (set-piece FLOORS now paint before belts), vault a flat mauve
  field (panel grid + giant south vault door), antenna a 2px mast
  (real lattice tower + kiosk at ring center), pipes read flat
  (stanchion LEGS + displaced shadow). R2 lesson - the fx contact-
  sheet tool screenshots THROUGH the game canvas and silently broke
  when BASE grew to 400; sheets are now composed from the PNGs with
  PIL (canvas sized from content, clipping impossible). R3 - boss
  frames from separate generations DRIFT (brown trim on rear_2/
  lunge_1, green moss on lunge_2); a shared-palette quantize can't
  fix mis-colored source REGIONS - the 3 bad frames were REGENERATED
  off clean pair-mates with explicit color anchoring + negative_
  description, then all 8 remapped to walk_1's 14-color palette
  (audit by the judge's own metric: drift px 3276-5220 -> 45-900 =
  legit snack-window content). Labs SHIP; park re-confirmed SHIP.

- **2026-07-31 - v0.27.0: SWEET SUBURBS (Map 3 / beat 5) + park detail
  layer (Mark: "add that layer of detailing, and let's build the next
  map... think about it logically, what the design philosophy should
  be").** THE PHILOSOPHY, now doctrine: each map gets its own GEOMETRY.
  Central = grid (order). Park = organic (no straight lines). Suburbs =
  CURVES WITH REPETITION - crescent streets ending in cul-de-sac
  circles, houses repeating with small variations; the dessert flood
  VIOLATES that domestic order and its gradient (heaviest at the
  Bakery, thinning to the Welcome Sign) silently points the player at
  the boss. NEW `src/systems/world_suburb.js` PC.SuburbLayout (drop-in
  sibling of ParkLayout - region.js just branches on fabric): gentler
  sine-curved street network w/ sidewalks + dashed centerlines + 4
  turnaround circles (manhole + chalk hopscotch), houses WALKED ALONG
  the streets (anti-overlap hash; pastel body + roof-plane/ridge +
  fenced backyard + yard prop pool/playset/grill + mailbox + bushes),
  driveways as ROTATED slabs connecting each house to its own street
  anchor (captured at build time) with the family car parked at the
  driveway's angle, frosting ROOF drifts + eave drips where flood>0.55,
  suburban shade-tree lattice (rim treeline; area-scaled), candy
  lattice (gumdrops solid/canes/cherries/drifts), 2 authored frosting
  RIVERS out of the Bakery, ice-cream trucks/lamps/hydrants along
  streets. Landmarks: Welcome Sign, frosting-lake Community Pool
  (loungers/umbrellas/floaties/towels), School (courtyard wings, roof
  court, "HELP!" banner + faces at windows = the trapped-kids story
  hook), Rec Center BALLFIELD (defend), Water Tower tank, THE BIG OAK
  (area-scaled canopy tufts + tire swing at the player approach),
  Block Party ruins (striped pop-up tents, tipped tables/grill,
  balloons), THE BAKERY (dark roof + frosting eruption + rivulets +
  scalloped awning + display windows w/ little cakes). ART: PixelLab
  balance hit $0 - the d3 dessert roster (donut/chip bit/cupcake/
  frosting sludge/cookie golemite; walk x2 + stills) and the LAYER
  CAKE COLOSSUS (walk x4 + rear/lunge poses) are procedural painters
  in NEW `src/handart_d3.js` (PC.HANDART layer: real art > handart >
  generic blobs, so future PixelLab PNGs replace them with zero code
  changes). Mission 5 "SUGAR RUSH" (`mission5.js`, spec cast lines
  VERBATIM; connective lines new - Mark to review in VOICE_SCRIPT.md):
  clear cul-de-sac -> free 3 kids at the School (fetch w/ NEW per-item
  dx/dy spread + icon override; Pip's line rides pickup 1) -> defend
  ballfield 60s -> LAYER CAKE COLOSSUS (hp 4200, rear/lunge anims) ->
  rescue KEVIN. quest.ringKinds is table-driven now (suburb ring bug:
  d1 street food spawned on the cul-de-sac clear).
  **v0.27.1 CORRECTION (Mark):** the "PixelLab balance $0" claim above
  was THE DOCUMENTED MISTAKE (PIXELLAB.md billing note, now promoted
  to the top of that file): /v1/balance always reads $0 - the real
  meter is /v2/balance (subscription generations; ~1092 remain). REAL
  PixelLab art for the whole d3 roster + LAYER CAKE COLOSSUS (walk x4
  + rear/lunge) generated via the proven pl-batch-d2 recipe (22 gens,
  pl-batch-d3.py) and manifest-registered - the handart_d3.js painters
  are now the offline fallback layer they were designed to be.
  Park detail layer
  same session: real CAROUSEL painter (the round-water branch was
  painting lily pads + ducks ON the carousel), terraced AMPHITHEATER
  with stage, softened pine, hedge contrast. JUDGE LOOP (2 rounds):
  R1 ITERATE - 4 of 8 landmarks failed at play scale (Big Oak flat
  green fields; Bakery front bare + sign truncated to "THE B" - a
  canvas textAlign STATE LEAK from id-keyed painters into the shared
  name plate, fix at the source; School slab w/o story hook; Block
  Party invisible) + driveways floating + pool south bare + 2 enemy
  retints. All applied; area-scaling reused (the zoo-pen lesson).
  R2 kills: driveway slab crossed a road (anchor = street CENTERLINE
  -> clamp at the curb), and TWO landmarks failed the LOT-FRACTION
  TRAP - a 1600px lot's props placed by fraction land outside the
  ~400px viewport centered on the door column; dressing must be
  DOOR/CENTER-ANCHORED (school banner, bakery windows/rivulets/vents).
  R3 verdict: SHIP; the same round re-judged the PARK and its last
  three notes shipped too (pier -> T-head destination w/ railing +
  lantern + varied planks + flanking reeds/pads + water dither; zoo
  walkway bunting/bench/popcorn cart; bakery drip taper + cherry
  shadow tint). VERIFIED: verify-suburbs.js B1-B5 end to end ALL
  GREEN + full battery (park/linear/freeroam/garage/beat4) green,
  zero errors.
  NEXT: Map 4 SUPER DUDE LABS (stage6, rescue Carlos, VENDING
  BEHEMOTH, the Tower reveal) - spec'd in STORY_SPEC Map 4; needs a
  'labs' fabric (industrial: conveyor yards, pipe banks - a THIRD
  geometry variant: rigid but diagonal/industrial?) + d4 junk roster
  (art: handart_d3 pattern until PixelLab top-up).

- **2026-07-30 - v0.26.0: THE ORGANIC PARK (Mark: "a natural feeling
  park, mostly no straight lines... same level of attention to detail
  that you gave the city. Then subject your design to an agent to judge
  your work and then loop that").** `src/systems/world_park.js` is now
  `PC.ParkLayout`, a full organic layout engine that replaces the city
  grid for `fabric:'park'`: a hand-authored node graph (entrance -> hub
  -> 3 loops + 2 dead-end spurs) rendered as sine-perturbed WINDING
  paths; a deterministic TREE LATTICE (88px cells, value-noise density
  with a treeline boost near the map edge) shared verbatim by the
  painter AND `solidsForChunk` so collision always matches pixels;
  grand oaks (r 42-62) / oaks / maples / pines / bushes / rocks /
  stumps / logs; soft-edged grass mottle + flower clusters from the
  same noise field; 5 organic ponds; lamps/benches/trail signs bucketed
  along the paths; a swingset+slide+seesaw playground on a sand blob;
  brick-pillar PARK GATES with an ADVENTURE PARK arch and a clipped
  HEDGE perimeter; and the deliberately RIGID zoo pocket - gravel
  grid, central walkway, 2x2 THEMED habitats (savanna/jungle/ice/
  waterhole) with plush-style painted animals, feed troughs, double-
  rail fences, bunting, ticket booth, CITY ZOO arch. NEW
  `src/systems/critters.js`: pooled ambient squirrels/birds/rabbits
  (PixelLab sprites) that idle, hop, and SCURRY from the player; they
  spawn INSIDE the viewport away from the player - the first draft
  spawned them off-screen and nobody ever saw one. region.js: Big Pond
  got daytime water (#38678a base, dithered band seams, sparkle), lily
  pad clusters, 10px ducks with V-wakes, and a plank PIER that is the
  mission dock (quest.spotOf water branch); greenhouse/aviary/ranger
  got roof painters. THE JUDGE LOOP (3 rounds, per Mark's instruction):
  an agent re-read Mark's verbatim brief against full renders each
  round. R1 kills: grass mottle on the 8px lattice read as BRICK
  (fix: unaligned soft fills); trees smaller than the player read as
  agave (fix: grand tier + sharper clustering); zoo was an empty tan
  floor. R2 kill, the important lesson: the zoo pens are ~626x396 EACH,
  so absolute dressing counts ("3 animals") vanished into flat colour
  fields - ALL habitat density now SCALES WITH PEN AREA (~14 animals/
  pen + props; rule: every screen-sized patch shows an animal + a
  prop). R3 verdict: SHIP. Verified: verify-park / beat4 / linear /
  freeroam / garage all green, zero page errors. DEBT (judge's queued
  polish list): amphitheater + carousel are the last two POIs that read
  as debug geometry at map scale; pine/rosette still the weakest tree
  shape; hedge lit-lobes could use one notch more contrast vs grass;
  small-pond ducks only on r>120 ponds.

- **2026-07-30 - v0.25.0: THE TEXT STANDARD (Mark's on-device shot:
  "inspect all text and text boxes for dialogs, they almost always spill
  out and are too small or not formatted well. Create some rules to
  standardize quality").** THE AUDIT: 98 text objects using FIFTEEN font
  sizes from 6px to 26px with no system, and only 7 declaring a wrap
  width - 91 could overflow. Level-up cards explained what they DID in
  7px. NEW `src/systems/ui.js` = the standard: six roles (micro 8 /
  caption 9 / body 11 / label 13 / title 18 / display 26), PC.SAFE 10 +
  PC.SAFE_BOTTOM 16, and helpers `PC.ui.text/fit/panelFor/measure/
  clampRect`. Rules R1-R7 written up in `docs/UI_TEXT_STANDARD.md`
  (pick a role not a px; sentences never below body; variable text MUST
  wrap or fit(); panels MEASURED from their text; safe area; stroke over
  gameplay; a dialogue box never exceeds 45% of screen height).
  DIALOGUE BOX REBUILT - it was the actual failure in the screenshot:
  fixed 74px tall regardless of content, text column starting 6px INSIDE
  the portrait well, 9px body copy, ▼ in the very corner, and the panel
  8px off the bottom (under the home indicator) with the version stamp
  printed inside it. Now it MEASURES the line and grows, the column
  clears the portrait, body is 11px, ▼ is inset, and it clears
  SAFE_BOTTOM. The in-game build stamp moved TOP-right, because
  bottom-right is dialogue territory. Cards: title 8->11, desc 7->9.
  fit() applied to mission titles, mission-map node labels and garage
  kit names. TWO BUGS THE SCREENSHOT EXPOSED: (1) "foes -31" - onKill
  decremented liveCount unconditionally, so overlapping damage (two
  bullets, an AoE tick) double-counted the same enemy and the counter
  drifted negative AND kills/gems were double-awarded; now guarded on
  e.active + clamped at 0. (2) the fps readout and dev SWARM button were
  visible in normal builds; both are DEV_MODE-only now. VERIFIED
  (verify-text.js) at THREE phone shapes (19.5:9, 16:9, landscape) with
  short / real / deliberately-overlong copy: text never crosses the box,
  box always fits name+text+padding and never shrinks as copy grows,
  clears the bottom safe area, column clears the portrait, body >= 11px,
  box under 45% of screen height. linear/freeroam/garage/park green.
  DEBT: the other ~90 text objects still use literal sizes - not broken
  (fixed strings, fixed boxes) but new work should use PC.ui.

- **2026-07-29 - v0.24.0: MAP LAYOUT PASS (Mark's whole-map critique via
  tools/map_atlas.js).** THE STRUCTURAL FIX - "it shouldn't cover
  streets": landmark rects were block-sized minus a 20px inset, so every
  lot bulldozed the fabric's road bands and left slivers. Landmarks are
  now placed in LAND PARCELS: the fabric puts a 128px road at 192..320
  of each 512 cell, so the land between streets is a 384px square
  straddling the cell boundary. `PC.PARCEL` + `PC.parcelRect(c0,r0,c1,r1)`
  in region.js; map data coords are PARCEL indices now, and 1 parcel =
  "1 square" in Mark's sizing language. MARK'S SIZES, applied: City Hall
  4, Bloom Tower 4 (squarely centred), Frostbite Bank 4, Central Plaza
  6, Substation 2, Sal's 1, Diner 1, Garage 1, Mission Board 1,
  Nourish-Ray Stage 1 (it was oversized AND unreadable - "I don't even
  know what that's supposed to be"; still needs its own painter).
  PARK SHAPES, per Mark: landmarks take `shape` and `fenced`. New
  `_organicPath()` traces a sine-perturbed ellipse keyed to the landmark
  id, so open lots get WAVY outlines instead of rectangles ("should be
  wavy, like an actual park"); `shape:'round'` gives the pond concentric
  water bands + ripples and the carousel a disc; `fenced:true` rings the
  Zoo Enclosures with a post fence and a south gate gap (Mark: "create a
  sectioned off space for the zoo"). ENGINE FIX the layout exposed:
  several quest beats hardcoded "+ h/2 + 80" to put the action on the
  apron OUTSIDE a building's south face - correct for solid lots, but it
  landed objectives outside OPEN ones entirely (the now-open Park Gates
  never triggered). New `PC.Quest.spotOf(mk, pad)` is the single source
  of truth: open lots use their centre, solid lots the apron. Used by
  targetXY, the clear ring, the defend zone + its waves, and the boss
  spawn. Harnesses now travel via `quest.targetXY()`/`spotOf()` rather
  than recomputing offsets, so future map shapes can't break them.
  (Test gotcha: with Vic's tutorial running, objective 0 is unarmed and
  targetXY is legitimately null - wait for idx>=0 first.) All green:
  park / beat4 / freeroam / linear / garage / region.
  STILL OPEN from the critique, in value order: the filler fabric is
  uniform wallpaper (wants block TYPES - dense/sparse/lot/plaza), the
  landmark plates are still flat colour slabs needing per-landmark
  interior painters, and ~40% of each map has no reason to be visited
  (side quests + loot).

- **2026-07-29 - v0.23.1: VFX DENSITY + PARTICLE BUMP (Mark on v0.23.0:
  "they're fantastic... increase the pixel density a little bit and
  particle effects maybe just a little bit").** THE METHOD, stated so it
  can be repeated: these effects are CODE-DRAWN into the atlas at a
  NATIVE frame size, then displayed at a scale. Density = raise the
  native size and lower the display scale by roughly the same factor -
  the on-screen footprint barely moves while the number of source pixels
  inside it goes up. (Do NOT push display scale below ~1.0: nearest-
  neighbour would start DROPPING source pixels and it shimmers.)
  Applied ~1.4x: bolt 22x10 -> 30x14 (display 1.4 -> 1.1), splat 44 ->
  60 (1.45 -> 1.15), flame 28 -> 40 (divisor 26 -> 38), puddle 48 -> 64
  (1.4 -> 1.05), muzzle 20x13 -> 28x18, pop 32 -> 40, spark 16 -> 22.
  PARTICLES up a notch: bullet trail interval 32ms -> 22ms w/ the ghost
  pool 46 -> 72, sparkle chance 0.45 -> 0.7, splat droplets 16 -> 22,
  ketchup gobs 7 -> 11, flame tongues 3 -> 4 per segment, embers 3.0 ->
  5.0/s, muzzle ejects 3 sparks. FX cap 260 has room; measured 57-60fps
  with 8 bolts + trails on screen. ALSO: `fx.update` now FADES the last
  third of every burst - nothing pops out of existence any more, which
  is the difference between "an animation ended" and "the smoke
  cleared". Muzzle re-tuned for the bigger canvas (core was swamping
  the cone at 28x18). All green: verify-vfx + park + freeroam.

- **2026-07-29 - v0.23.0: THE VFX QUALITY PASS (Mark: "let's make sure
  we sift through our animations and make sure they have that premium
  feeling quality... take your time, don't do a quick pass").**
  **THE SHARED LESSON**: every effect Mark disliked was a ROUND,
  UNDIRECTED primitive - a circle for a splash, a ring for fire, an orb
  for a bolt. The fix each time was SHAPE + DIRECTION. All new painters
  are scanline-drawn (fillRect per column) so edges stay crisp pixel art
  instead of the soft anti-aliased curves arc() gives.
  **1. DANNY'S BOLT** (assets.js `bolt` kind): `proj_resizer` was a real
  PNG of a round blob - REMOVED FROM THE MANIFEST so the new procedural
  art wins; re-registered NON-SQUARE (22x10) so rotation reads. Profile
  is deliberately asymmetric - long thin tail swelling to a blunt round
  nose at 78% - because a shape that tapers at BOTH ends reads as a lens
  and loses its heading. Layers: outer glow, body, front-loaded heat,
  white-hot core, tail wisp. `proj_drone_bolt` too.
  **2. BOLT BEHAVIOUR** (weapons.js): rotation is now recomputed EVERY
  FRAME from (dx,dy) - homing/boomerang shots used to keep their launch
  angle forever, which nobody noticed while the art was a circle. New
  46-strong GHOST pool: each after-image copies the bullet's own frame +
  rotation and fades/flattens, so the streak always matches the shot.
  Plus sparkle flecks.
  **3. THE ON-SCREEN LAW** (Mark: "it's firing too far off screen"):
  new `PC.onScreen(scene,x,y,inset)` + `PC.viewReach(scene)`. aimAt now
  refuses off-screen targets AND clamps any weapon's range to half the
  viewport; bullets fizzle (spark) 4px inside the view edge instead of
  sailing hundreds of px into the dark. Danny's nominal 420 range vs a
  ~156px half-screen was the whole complaint. Balance re-measured after:
  415 kills / 321s / no deaths - targeting got BETTER, not starved.
  **4. KETCHUP** (assets.js `splat` + `puddle`): the splash is 7
  irregular overlapping lobes (never a circle) with 16 STREAKED droplets
  flung outward; the lingering puddle is the same idea settled, plus wet
  gloss. Landing now = big rotated splat + impact flash + 7 small
  rotated sauce gobs that land a beat later + a shake. fx.burst gained
  `scale`, and `fx.burstRot` randomises the angle so repeated splashes
  never look stamped.
  **5. FLAMES** (assets.js `flame` + vfx heatBed + arsenal3): each
  burning segment is now THREE animated flame tongues (4-frame loop,
  per-lick phase/height/lean) standing on a HEAT BED - five stacked ADD
  bands red->orange->yellow that read as the gradient Mark asked for.
  Replaces one tinted ring. `PC.Vfx.heatBed(x,y,r,i)` is stateless:
  callers re-submit every frame, the renderer owns the look.
  **6. MUZZLE**: was a 12px blob on turrets only. Now a DIRECTIONAL
  20x13 cone (bright narrow at the barrel, widening + fading to nothing)
  with back-blast rays, aimed by an angle argument - and fired on EVERY
  energy shot from BulletSystem.fire, not just turrets.
  **7. ZOOM**: BASE 340 -> 312 (~8% closer) per "I would still zoom up
  again just a little bit"; it also pulls the firing boundary in.
  TOOLING: `scratchpad/fx-sheet.js` renders any set of atlas frames
  blown up (FX_ROWS env var) - the iteration loop for painters without
  playing the game. VERIFIED (verify-vfx.js ALL GREEN): heading
  orientation in 8 directions incl. after a homing turn, edge stop
  (travelled 158 vs half-width 156), off-screen targets refused,
  after-images present and fading, ketchup lands as a splat, grease
  burns as 3 flame tongues on a heat bed. park/freeroam/garage
  regressions green. GOTCHA: pi and -pi are the same heading - compare
  angles modulo 2pi or a correct implementation looks broken.

- **2026-07-29 - v0.22.0: BOSS ANIMATION STATES + BEAT 4 (Mark: "make
  sure the Broccolisk has multiple animations to make them look good...
  let's move on with the next step").** HALF THE CAMPAIGN IS NOW
  PLAYABLE (beats 1-4 of 8). **BOSS ANIMS**: PC.BOSSES entries take an
  optional `anims` map of STATE -> {set, frames, fps}; the boss already
  had a real state machine (intro/active/telegraph/charge) that was
  wearing the walk cycle throughout. Broccolisk now plays `rear` (2f)
  on the wind-up and `lunge` (2f) on the strike. Art: 4 new frames via
  pixflux + init_image off walk_1. **KEY LESSON**: init_image at
  strength 260 keeps identity so well that the generated poses were
  nearly indistinguishable at 128px - generated pose art ALONE does not
  read. Fixed with POSE AMPLIFICATION in code (the VS "code-side life"
  law): telegraph scales 1.18x/1.34x + tilts -9deg over 0.55s (rears
  up), charge scales 1.30x/0.84x + tilts into its heading with a
  vibration (stretched strike), and the sprite now flips to face the
  player. That combination reads instantly; the art gives the detail,
  the transform gives the silhouette. Missing frame sets fall back to
  the walk cycle via a texture check, so Big Frank is untouched and any
  future boss can ship with partial animation. **BEAT 4**: NEW
  `src/data/story/mission4.js` - "CRITTER PATROL", Josh's park
  spotlight (clear the amphitheater 18 / round up 3 CRITTER CRATEs at
  aviary+carousel+pens / settle the pens 45s, 105 TP, no boss, no
  rescue). DATA-ONLY - no engine work at all, which is the pipeline
  paying off. Its dialogue is NEW and in-voice (Josh: "Sleepin' like
  lambs. Well. The lambs are. The ostrich has opinions.") - MARK TO
  REVIEW. VERIFIED (verify-beat4.js ALL GREEN): each fight state uses
  its own frame set, Big Frank falls back to walking, beat 4 loads as
  Josh w/ ROPE CYCLONE on the park fabric, all three objectives play,
  105 TP banked, chain points at beat 5. park/freeroam regressions
  green. NEXT: Map 3 (Sweet Suburbs) for beat 5 + rescue Kevin, or
  side-quest encounters in free roam.

- **2026-07-29 - v0.21.0: MAP 2 - ADVENTURE PARK IS PLAYABLE (beat 3).**
  The campaign is now two maps deep and the data-driven map pipeline is
  PROVEN: a whole new district cost one painter + two data files.
  NEW `src/systems/world_park.js` (PC.paintChunkPark - same 512px block
  geometry as the city so COLLISION IS FREE AND IDENTICAL: road bands
  become gravel garden paths w/ stone edging, and the deterministic
  quadrant "buildings" are repainted as HEDGE BLOCKS straight from the
  same PC.defaultChunkSolids rects. Lawn gets world-aligned mow stripes,
  tufts, clover + tiny wildflowers; hedges get cast shadow, lit top
  face, canopy lumps and occasional topiary). NEW `src/data/story/
  map2.js` (8 landmarks: Park Gates / Greenhouse / Zoo Enclosures /
  Big Pond (open) / Carousel (open) / Aviary Tower / Amphitheater /
  Ranger Station; `fabric:'park'`, `spawnSet:'park'`) + `src/data/story/
  mission3.js` ("GONE WILD" B1-B5: clear the gates 20 / cap 3 VINE CAPS
  / hold the pond dock 50s / BROCCOLISK / rescue JOSH; spec IV.2 cast
  lines VERBATIM, connective lines new). PLUGGABLE SEAMS ADDED: region
  picks its ground painter from `def.fabric`; `PC.SPAWN_SETS` gives
  each map its own roster (director reads `region.def.spawnSet`);
  `PC.BOSSES` table + `new PC.Boss(scene,x,y,id)` so a boss beat names
  its boss (`boss:'broccolisk'`, 3400hp); `scene.bossBanner(name)`
  shared by patrol + story. ART (19 gens, ~1124 left): 5 feral produce
  (apple/tomato/melon/banana/peeler, walk x2 + inert still each, frame
  B via init_image per PIXELLAB recipe 4) + THE BROCCOLISK 4 frames
  (64 -> x2 NEAREST to 128). All registered in manifest.js - the d2
  slots were procedural placeholders before. TWO BUGS THE HARNESS
  CAUGHT (both invisible to a smoke test): boss.js line 132 animated
  the walk cycle off `PC.BOSS_D1.key` so the Broccolisk WORE BIG
  FRANK'S SPRITE while reporting the right name/hp - now `this.artKey`;
  and PC.Quest.ring() hardcoded ['fry','fry','popcorn','hotdog'] so
  park objective swarms were street food - now `this.ringKinds` off the
  region's spawnSet. VERIFIED (verify-park.js ALL GREEN): park loads w/
  park fabric + produce set + 8 landmarks, objective swarm is d2, boss
  is the Broccolisk w/ its own art, all 5 beats play, Josh unlocked,
  stage3 banked at 125 TP, and CENTRAL IS UNCHANGED (city fabric,
  street food, 2 doors). freeroam/garage/linear regressions green.
  NEXT: beat 4 (Josh's park spotlight mission) is a data-only file;
  then side-quest encounters in free roam, or Map 3 (Sweet Suburbs).

- **2026-07-28 - v0.20.1: INTRO GATING FIX (Mark on-device: "I'm
  playing .20 but where's the intro cinematic?").** ROOT CAUSE:
  `PC_Missions.create()` called `storyState.setIntroSeen()` just for
  BEING OPENED, so any save that had ever reached the mission map -
  including every save from v0.18/v0.19 - was permanently flagged and
  STORY jumped straight past the newscast. FIX: the flag is now set in
  title.js at the moment the cutscene is actually launched, and the
  mission map no longer touches it. ADDED a `[ REPLAY INTRO ]` link
  (top-right of the mission map) so the newscast can be rewatched any
  time without wiping progress - also covers a kid who taps SKIP.
  Verified (probe-replay.js): fresh save plays it, returning save
  skips to the map, REPLAY works and leaves cleared stages cleared;
  linear + newscast regressions green. NOTE for existing saves: the
  flag is already set, so use REPLAY INTRO (or dev [RESET STORY]).

- **2026-07-28 - v0.20.0: THE GARAGE (TP SINK) + WALK-IN STORES + VIC'S
  TUTORIAL.** Closes the economy loop and the onboarding gap.
  **ECONOMY, final shape** (Mark: "maybe they all share buffs, but each
  one only has their unique ability"): COINS -> Sal's Corner Store =
  shared team passives (unchanged); TECH POINTS -> the Garage = YOUR
  hero's own signature. NEW `src/data/garage.js` (PC.GARAGE: COSTS
  [60,120,200] TP for ranks 1-3, rank/nextCost/canBuy/buy, nextDesc()
  reads the weapon's OWN per-level desc so the store can't lie) + `src/
  scenes/garage.js` (PC_Garage: one row per hero w/ portrait, kit name,
  LV, next effect, cost, level pips; locked heroes dimmed to "??? /
  RESCUE THEM FIRST"). A rank PRE-LEVELS the signature: kits.js
  applyHeroKit runs w.level++/applyLevel() rank times after masterize,
  so a tuned hero STARTS at level 1+rank (capped at 3 of 5 so in-run
  level-ups still climb). Exclusive by construction - it only ever
  touches the hero being played, so Danny can never get Kevin's Air
  Support. **WALK-IN STORES**: NEW `src/story/doors.js` (PC.Doors -
  pulsing doormats at the store/garage lots, proximity ENTER prompt +
  E key; entering PAUSES PC_Game and LAUNCHES the store as an overlay,
  closing resumes the SAME run - HP, objective, everything). shop.js +
  garage.js share an `{overlay, resume}` init contract w/ a close()
  that stops+resumes instead of scene.start. Mission map footer is now
  SAL'S / GARAGE / TITLE. **TUTORIAL**: mission1 gained a `tutorial`
  beat list (6 Vic radio lines: drag to walk / gear auto-fires / pop
  the fries / follow the gold arrow / free roam + spend / go) that
  PC.Quest plays once ever (PC.storyState.tutorialSeen) before
  objective 0. THOSE 6 LINES ARE STILL MARK-REVIEW (also DRAFT in
  docs/VOICE_SCRIPT.md). TWO GOTCHAS BURNED: (1) a PAUSED Phaser scene
  still RENDERS, and the stores are registered before PC_Game, so an
  overlay needs `scene.bringToTop()` or it draws underneath the frozen
  street; (2) doors.update() must run ABOVE the storyPause gate or the
  doormats blink out every time anyone talks - and door lots must be
  anchored to the region's carved door BAY (mk.y+mk.h-30), not outside
  the lot, because a fabric building can sit flush against the south
  wall (that's what hid Sal's door). VERIFIED (verify-garage.js ALL
  GREEN): tutorial fires once + hands off + never replays; garage
  prompt -> pause -> overlay -> buy (TP 500->440, rank 1, Kevin
  untouched) -> close -> same run resumes at hp 42 on objective 0 ->
  next run Danny starts at signature LEVEL 2; Sal's overlay round trip.
  Full battery green (freeroam/linear/shop/newscast). NEXT: side-quest
  encounters in free roam, then Map 2 (Adventure Park) art + mission
  chain to make beat 3 playable.

- **2026-07-28 - v0.19.0: THE FREE-ROAM SEAM (Mark's linear-flow
  direction: "you're thrown into the gameplay... free roaming around
  the city, finishing objectives... a,b,c,d,e,f,g... there's just
  extra things you can do on the way").** Finishing a story mission NO
  LONGER bounces to a results screen - the city stays open. NEW
  `src/story/freeroam.js` (PC.FreeRoam: compact in-world MISSION
  COMPLETE reward card w/ TP+gold+pops, pulsing world marker + bobbing
  chevron at the MISSION BOARD, edge compass, "FREE ROAM - HEAD TO THE
  MISSION BOARD" banner, proximity-armed START button (tap zone +
  SPACE/ENTER) -> fade-out -> scene.restart into the next beat).
  quest.complete() now hands to `scene.enterFreeRoam(next, earned)`
  whenever the next chain beat is BUILT; results is now ONLY for
  death / campaign end / next-map-not-built. enterFreeRoam clears the
  swarm (new `EnemySystem.clearAll(fx)` w/ pop bursts, capped at 12)
  and the director drops to 0.25x. GameScene fades IN on story runs so
  beat->beat is a cut, never a menu. CHAIN RESTRUCTURED to Mark's 8
  linear beats w/ helper fns (chainIndex/nextInChain/beatBuilt): Danny
  runs the rescue missions on each new map; the freshly-rescued hero
  gets ONE spotlight mission on that same map (beats 2 and 4) so
  "new character, city you know" is taught while it's novel, then the
  back half drives to the Tower. NEW `src/data/story/mission2.js` -
  BEAT 2 "LOUD AND CLEAR", the first spotlight: play as VIC on Central,
  3 objectives (clear Bloom Tower approach 16 / fetch 2 SIGNAL BOOSTERS
  at cityhall+garage / defend the array 45s), no boss, no rescue,
  105 TP. Its dialogue is NEW (not spec'd) and in-voice - Vic dry, Danny
  on radio, Bloom cameo - MARK SHOULD REVIEW. VERIFIED
  (verify-freeroam.js ALL GREEN): full Stage 1 -> stays in PC_Game,
  results NOT started, 0 foes left, reward card + marker shown, next
  beat armed as stage2/victoria -> walk to board arms START -> beat 2
  loads as VIC on the SAME map with her own 3-objective quest, no menu
  in between -> death still routes results -> mission map with beat 2
  playable. verify-linear trimmed to the parts freeroam doesn't cover;
  newscast/region/shop regressions green. NEXT: walk-in shops (Sal's
  storefront opens PC_Shop, the GARAGE = the missing TP sink for hero
  signature levels) then Vic's radio tutorial at the top of Stage 1
  (6 DRAFT lines already in docs/VOICE_SCRIPT.md awaiting approval).

- **2026-07-28 - VOICE-OVER SCRIPT COMPILED (Mark: "compile all of the
  scripts... I'm gonna see if I can implement eleven labs").** NEW
  `docs/VOICE_SCRIPT.md` (readable master: totals, 11-character
  casting sheet w/ ElevenLabs Voice-Design prompts + per-character
  stability/similarity/style starting points, every line with a
  delivery note, hand-back instructions, v3 audio-tag guidance) +
  `docs/voice_lines.csv` (95 rows, batch-ready: file_id/status/
  scene/speaker/character/delivery_note/line/chars). BOTH are
  GENERATED by `tools/build_vo_script.py` from one data table so
  recorded text can never drift from shipped text - re-run it
  whenever lines are added. 95 lines / 5,568 chars total: 28
  SHIPPED (intro newscast + Stage 1 + chant = voicing the playable
  slice, ~1.9k chars), 61 WRITTEN (spec'd Stages 2-5 + finale +
  cast-addendum flavor - text locked, safe to record early), 6
  DRAFT (Vic tutorial lines Claude proposed for the new linear
  flow - MARK MUST APPROVE before recording). File-ID convention
  `vo_<scene>_<nnn>_<speaker>.mp3` -> drop in `assets/vo/`. NOT
  BUILT YET (the playback side, ~half a day once audio exists):
  PC.voice loader + lazy per-scene manifest, DialogueBox plays the
  clip + ducks music 60% + paces the typewriter to clip length,
  tap-advance stops the clip, MISSING FILE = silent fallback to the
  synth blips (so partial recordings ship fine), VOICE volume
  slider. Multi-take note: the chant's "For love—!" needs one take
  per rescuable hero.

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
