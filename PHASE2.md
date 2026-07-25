# PORTION CONTROL — PHASE 2.0 COMPENDIUM
## The "2.0 Track": building ON TOP of the completed vertical slice
*For Claude Code. Companion to the repo's COMPENDIUM.md (law), HANDOVER.md (living state),
CHARACTERS.md, and PIXELLAB.md. Status baseline: v0.6.6, District 1 vertical slice + full
six-hero roster COMPLETE.*

---

# §0 — HOW TO READ THIS (authority & scope)

- **This document is a forward plan, not a description of current state.** COMPENDIUM.md and
  HANDOVER.md remain the source of truth for what already exists and how it works. Where this
  doc and the repo disagree about *what is already built*, **the repo wins** — treat this as
  the to-do, not the record.
- **Every item here is ADDITIVE.** The vertical slice and roster are finished and shipped-quality.
  The job of Phase 2.0 is to *extend* them, never to rebuild or "clean up" working code.
- Work the packages roughly in the order given (§7), but **the in-flight kit/unlock/portrait
  work in HANDOVER.md continues first and uninterrupted** (see §6). Do not let 2.0 work stall
  or overwrite it.

---

# §1 — 🔒 LOCKED REGISTRY (DO NOT MODIFY unless a work package explicitly says so)

These are complete and working. Extend via new modules/flags; do not refactor, "improve," or
re-architect them:

1. **Movement & controls** — virtual joystick, portrait-first input.
2. **Combat core** — auto-fire, pooled projectiles, hit detection.
3. **Performance architecture** — object pooling, spatial-hash collision, hard caps, single
   texture atlas, delta-time movement. **This is untouchable infrastructure.**
4. **Spawn director** — District 1's 5-minute timeline and event logic.
5. **Big Frank boss** — telegraphed charges, condiment puddles, enrage, single-path win wiring.
6. **XP → level-up card system** — weapon/passive choices.
7. **Meta-currency plumbing** — gold, med-kits, supply crates, localStorage persistence.
8. **Win / lose / results / play-again loop**, caged-teammate rescue.
9. **The six-hero roster** — all PixelLab v3 character art, the CHOOSE YOUR HERO select screen,
   east-idle + 6-frame walk, world-scale normalization, persistence-by-ID in the PixelLab library.
10. **The code-painted District 1 city** and its building collision.

If a 2.0 feature seems to need one of these changed, see the Guardrail Protocol rule 3 (§2).

---

# §2 — 🛡️ GUARDRAIL PROTOCOL (applies to EVERY work package)

1. **Extend, don't rewrite.** New systems ship as new modules and/or behind a feature flag in
   CONFIG. Do not modify locked systems (§1) except where a WP explicitly authorizes it and its
   acceptance test proves zero regression.
2. **Working-and-shipped beats spec.** If any instruction in this doc conflicts with current
   working behavior, with COMPENDIUM.md, or with HANDOVER.md, **STOP, keep the working behavior,
   and record the conflict in HANDOVER.md for Mark.** Do not "resolve" it by changing what works.
3. **Performance is a gate, not a goal.** 55–60 fps on a mid-range phone must hold after every
   WP. Pooling / spatial-hash / caps / atlas stay. Any new VFX, entity, or system must be pooled
   and capped; if a WP drops fps below the gate, the WP is *not done* — scale it back.
4. **VS-law stays.** Walk-only animation, identity = held item, flip-only facing. New "animation"
   must be **code-side** (wobble, squish, glow, trails, tweens), NOT new per-frame sprite sheets,
   unless a WP explicitly authorizes new art.
5. **Data-driven, following existing conventions.** New content (power-ups, evolutions, loot,
   questions, unlocks) goes in `data/` files matching the existing style (enemies.js, weapons.js,
   districts.js). Numbers live in CONFIG. No hard-coded magic values in logic.
6. **Feature-flag risky changes.** Anything that alters the *feel* of the shipped slice (camera
   zoom, damage numbers, audio) ships behind a flag defaulting to the safe/known state until Mark
   approves the new default. Keep the old path available as fallback.
7. **PixelLab spend is metered.** Before generating art, call `get_balance`, report headroom, and
   respect the monthly pool (~1378 of 2000 remaining at baseline). Never batch-generate without
   reporting estimated spend. Reuse existing library assets by ID before making new ones.
8. **Do NOT author ministry/scripture content.** Build the *systems and schemas* only. Mark writes
   and approves all scripture questions/answers and any faith-facing copy (§ WP-SCRIPTURE).
9. **Update HANDOVER.md after each WP** — what changed, flags added, knobs exposed, any conflict
   deferred to Mark.

---

# §3 — OPEN DECISIONS TO UNBLOCK (Mark's calls — do not invent these)

Carried from the status brief; several 2.0 packages depend on them. Claude Code should surface
these and wait for Mark rather than guessing:

1. **Per-hero kit pick** (A/B/C from CHARACTERS.md) — everyone currently plays Danny's default.
2. **Which hero is Big Frank's District-1 captive** (select screen currently shows all six
   unlocked for testing).
3. **Unlock / meta flow** — working proposal: Danny starts unlocked; district bosses rescue the
   next hero; gold can buy early unlocks. Confirm before WP-COLLECTIONS and the shop lock states.

Default assumption if Mark is silent: **keep the current test state (all unlocked)** behind a
`DEV_ALL_UNLOCKED` flag, and build lock/unlock logic so flipping the flag activates it — never
hard-remove access during development.

---

# §4 — RECONCILED INCONSISTENCIES (flagged per standing instruction)

**A. Damage numbers.** COMPENDIUM.md said "no floating damage numbers in v1 (perf)." Mark now
wants them. **Resolution:** ADD them in 2.0, but (a) **pooled** from a fixed pool with a hard cap,
(b) **toggleable** in settings (VS itself makes them optional), (c) rendered cheaply (bitmap/atlas
glyphs or a lightweight text pool, no per-number allocation), (d) very short-lived pop-in→fade.
This honors both Mark's request and the perf law. Not a contradiction to fix in the old doc — a
deliberate, guarded 2.0 addition.

**B. "4K" canvas.** The Performance Bible caps DPR at 2 and renders at a sensible resolution;
a literal 4K framebuffer on a phone would break the shipped 60 fps. **Resolution:** deliver the
*look* Mark wants — crisp, high-fidelity, zoomed-out, tiny-character — via (1) authoring assets at
**higher source resolution**, (2) a **zoomed-out camera** so the character is small and the play
space is large, and (3) a **validated internal render scale**, NOT a blind 4K backing store.
Profile on a real mid-range phone; if a higher render scale holds the fps gate, keep it; if it
drops frames, back it off. **The 60 fps gate wins over the resolution number.** (Bonus: higher
source-res assets play to PixelLab's strength at larger sizes and away from its ≤16px weakness —
this direction is synergistic with the art pipeline, not just aesthetic.)

---

# §5 — THE 2.0 DESIGN PILLAR (the thread tying the transcripts together)

**"Lose, invest, return stronger."** Like Vampire Survivors — where a fresh player *cannot* beat
the 30-minute Reaper and is meant to die, bank currency, buy permanent upgrades, and come back —
Portion Control 2.0 is tuned so a first-timer is *expected* to lose early runs, spend gold on
permanent power-ups between runs, and gradually build toward victory. This single pillar is the
backbone of WP-METASHOP (permanent power-ups), WP-SCRIPTURE (the revive gate), the loot economy,
and difficulty tuning. **Design stance:** a brand-new save should struggle to clear even District
1's later minutes; meta-investment is what makes the campaign winnable. Exact numbers are
playtest knobs (per COMPENDIUM.md's "numbers are knobs" rule) — do not hard-balance blind.

---

# §6 — TRACK 0: CONTINUE THE IN-FLIGHT WORK (do this first, don't re-spec it)

The status brief's next steps — **per-hero kit implementation, select-screen lock/unlock states,
item-glow walk polish, and hero portraits (PixelLab portrait converter)** — are already the active
roadmap and partly specified in CHARACTERS.md/HANDOVER.md. **Claude Code: continue this per the
existing docs.** Do NOT let the 2.0 packages below disrupt or duplicate it. This compendium only
adds guardrails:

- Kits come from CHARACTERS.md (each VS archetype used exactly once). Implement the picks **Mark
  selects** (§3.1); until then, everyone keeps Danny's default loadout — don't guess kits.
- Select-screen lock/unlock is gated on the §3 decisions.
- **Item-glow** and any idle life must be **code-side** (VS-law, §2.4).
- **Portraits** via PixelLab's portrait converter, reusing the existing v3 character IDs — check
  `get_balance` first (§2.7).

Everything in §7 is sequenced to begin as Track 0 items complete, and to layer around them.

---

# §7 — WORK PACKAGES

Grouped into three tracks. Suggested order is A → B → C, but audio (WP-AUDIO) can run in parallel
any time since it's isolated. Each WP: **Goal · Depends · Steps · Guardrails · Done-when.**

## TRACK A — FEEL & FIDELITY (mostly additive polish)

### WP-AUDIO — Sound design & mix (Mark flagged this first)
**Goal:** Detailed, layered, pleasant SFX and a proper music/SFX balance. Currently music
drowns everything and there are effectively no SFX.
**Depends:** nothing (isolated system). Can start immediately.
**Steps:**
1. Add an audio manager module: separate **music bus** and **SFX bus** with independent volumes.
   Default mix ~**music 35% / SFX 85%**; expose both as settings sliders.
2. **Duck** music briefly on big events (level-up, boss hit) — drop music bus ~30% for ~200 ms.
3. **SFX, layered & musical.** Prefer lightweight **WebAudio-synthesized** chimes (no asset files)
   so there's zero art-pipeline cost; optional short samples where synthesis falls short. Use
   basic music theory: **consonant intervals for good events** (level-up = ascending major triad
   or perfect-fifth chime; pickup = short bright ping; evolution = shimmering arpeggio with a
   touch of reverb), **lower/darker tones for damage/death** (short descending minor). Add gentle
   **reverb** (convolver or a small feedback-delay) and slight detune/layering for richness — but
   keep tails short.
4. **Respect the perf/audio caps:** pool audio nodes, ~8 concurrent voices max, and **rate-limit
   the pop/hit SFX to ~10/s** (per COMPENDIUM.md) so a 300-enemy screen doesn't machine-gun audio.
5. **Music tracks:** one loop per district. These can come from **Suno** (Mark's tool) as exported
   loops — wire the manager to swap loops per district; District 1 first.
6. Minimum SFX set to cover: shoot, enemy pop, player hurt, gem pickup, coin pickup, level-up,
   card select, crate open, boss telegraph, boss hit, boss death, rescue fanfare, UI tap, revive.
**Guardrails:** additive module; don't touch combat/spawn code to hook sounds — emit from existing
event points or a light event bus. Ship behind an `AUDIO_V2` flag if it risks the current build.
**Done-when:** SFX are clearly audible over music on a phone, events feel juicy, fps unaffected,
volumes adjustable in settings.

### WP-CAMERA — Zoom-out & fidelity model (guarded; touches feel)
**Goal:** Adopt the VS "high-quality assets, zoomed out, small character, big awareness space"
look, giving the player room to read incoming threats and plan.
**Depends:** none, but **high-risk to the shipped slice** — feature-flag mandatory.
**Steps:**
1. Behind a `CAMERA_V2` flag: reduce the character-to-screen ratio (zoom the camera out) so the
   hero is small and more of the field is visible. Tune the zoom on a phone in portrait.
2. Set the **render/fidelity strategy** per §4-B: raise source-asset resolution and internal render
   scale to keep everything crisp when zoomed out; **profile fps on a real mid-range phone** and
   back off render scale before dropping below the gate. Keep DPR sane (do not chase a literal 4K
   framebuffer).
3. **Re-validate the shipped slice at the new zoom:** city building collision, boss arena spacing,
   spawn-ring distance (enemies must still appear just off-screen, not pop in visibly), joystick
   feel, and UI legibility at small character size. Adjust spawn-ring radius to the new viewport.
**Guardrails:** the old camera framing is the fallback and stays until Mark approves the new one.
Do NOT alter spawn-director *timeline* logic — only the spawn *radius* if the wider view requires
it, and only if it doesn't change difficulty (log the change for Mark). If zoom hurts readability
or fps on device, keep the current camera.
**Done-when:** zoomed-out view reads clearly on a phone, all shipped systems still work, fps holds,
Mark approves flipping `CAMERA_V2` on by default.

### WP-JUICE — Combat & pickup VFX (additive, pooled)
**Goal:** The small high-detail touches: damage numbers, projectile trails, walk afterimage,
enemy wobble/squish, high-fidelity XP gems.
**Depends:** WP-CAMERA decision affects gem/number scale; can start in parallel and re-tune after.
**Steps:**
1. **Damage numbers** (per §4-A): pooled, capped, toggleable (`DAMAGE_NUMBERS` setting, default
   on). Pop in at the hit point, small, rise a few px, fade fast (~0.4 s). Cheap glyphs; no
   per-number allocation. Rate-limit/aggregate if a WP-scale swarm would spawn too many at once.
2. **Projectile trails** — pooled sparkle/particle trail behind shots (esp. magic-type). Cap
   particle count hard; reuse from a pool; keep it a handful of quads per shot.
3. **Walk afterimage** — the ghost/echo trail behind the hero while moving in a direction
   (Mark referenced this as already discussed). **If already implemented, tune don't rebuild.**
   Code-side: a few fading copies of the current frame; pooled; only while moving.
4. **Enemy motion** — simple **code-side** bounce / squish / wobble per enemy type (e.g., blobs
   squish, round foods bounce), layered on the existing 2-frame walk. No new sprite frames (§2.4).
5. **Idle life** — optional subtle 2px bob on the hero when standing still, so it's not fully
   frozen. Code tween only; keep it tiny; behind a flag if it risks the walk-only look.
6. **High-def XP gems / energy cores** — nicer gem art with shading/fidelity that stays crisp
   when zoomed out (authored larger per §4-B; **gems that end up ≤16px on screen should be
   hand-authored**, per the PixelLab playbook's small-sprite rule). Optional subtle shimmer tween.
**Guardrails:** everything pooled and capped (§2.3). Do not touch damage/collision math — VFX
only. Each effect independently flag-able so any single one can be disabled if it costs fps.
**Done-when:** hits, shots, movement, and pickups feel juicy; every effect is pooled; fps holds;
damage numbers toggle works.

## TRACK B — DEPTH SYSTEMS (the roguelike meta)

### WP-METASHOP — Permanent power-up shop (the core 2.0 loop)
**Goal:** A large selection of **permanent, gold-bought** power-ups with ranks, accessed from the
title screen — the "invest between runs" half of §5.
**Depends:** gold plumbing (exists, §1.7); title-screen entry (WP-COLLECTIONS builds the menu).
**Steps:**
1. Data-drive a power-up list in `data/powerups.js` (schema in §9). Model on VS's ~17 ranked
   upgrades, e.g.: **+1 projectile to all weapons** (single expensive rank), **Might** (+5% damage
   /rank, max 25%), move speed, fire rate, area, magnet, luck, max HP, cooldown, **Revival**
   (revive once at 50% HP — flagship expensive tier). Include **Bible-/faith-themed** entries
   **whose names/flavor Mark provides** (leave clearly-labeled placeholders; don't author faith
   copy — §2.8).
2. Each power-up: id, name, description, ranks[], per-rank effect, per-rank gold cost. Effects
   apply as global run modifiers at run start (reuse the existing passive-modifier system where
   possible — extend, don't fork it).
3. Persist purchased ranks in localStorage alongside the existing meta save. Purchases are
   permanent and apply to every future run.
4. **Economy stance (§5):** a run yields ~1–2k gold; flagship upgrades (e.g., Revival) cost on the
   order of 10k — a multi-run investment. Numbers to CONFIG; tune in playtest.
5. Build the **Power-Ups screen** (grid of upgrades, ranks, costs, buy button, gold balance).
**Guardrails:** extend the existing modifier pipeline; don't rewrite it. Don't change in-run
level-up card logic here (that's separate). All costs/effects in data + CONFIG.
**Done-when:** upgrades buyable with gold, persist across runs, measurably change a run, and the
economy supports the "lose→invest→return" curve.

### WP-SCRIPTURE — Scripture-question system (revive gate + bonus gold) 🕊️
**Goal:** The VBS teaching hook. On death, the player may attempt a **one-shot** scripture question
to revive once; a separate question can grant **bonus gold**. Educational, low-friction.
**Depends:** revive concept (from WP-METASHOP's Revival or standalone); results/lose screen (exists).
**Steps:**
1. Build the **question system + data schema only** (§9). Two banks: **~50 revive questions**,
   **~100 bonus-gold questions**, each rotating so repeats are rare.
2. Question format: a short scripture-based prompt (fill-in-the-missing-word or reading-comp, e.g.
   "who/what is Jesus talking about"), **multiple choice, ONE attempt.** Correct → revive (at the
   Revival HP, e.g. 50%) or award bonus gold. Wrong → no revive / no bonus, **then always show the
   correct answer** (the teaching moment).
3. Wire the revive question into the **lose/game-over flow** as an optional offer (VS-style
   revive), and the bonus-gold question as an optional prompt (e.g., offered on the results screen
   or at a crate). Keep it skippable and never punishing beyond "no bonus."
4. Age-appropriate, encouraging tone throughout. Never shame a wrong answer.
**Guardrails — CRITICAL:** **Claude Code does NOT write scripture questions, answers, or any
faith-facing copy.** Ship an empty, well-structured data file with the schema and **one clearly
labeled FORMAT-ONLY example**, plus a `// TODO: Mark authors/reviews all questions (translation of
record)` marker. Mark populates and approves all content. Keep the system content-agnostic so the
bank can be swapped freely.
**Done-when:** the system loads a question bank, offers a one-shot revive on death, grants bonus
gold on a correct bonus question, always reveals the answer, and is fully driven by Mark's data
file (not by any built-in questions).

### WP-EVOLUTIONS — Weapon evolutions & combos
**Goal:** VS-style evolutions: a maxed weapon + a specific passive/item fuses into a stronger
"evolved" version (Bloody Tear, Holy Wand, Death Spiral, evolved King Bible as *references*, not
copies — ours are food-themed).
**Depends:** weapon/passive system (exists), level-up card system (exists), kits (Track 0).
**Steps:**
1. Data-drive **evolution recipes** in `data/evolutions.js` (schema §9): base weapon (at max level)
   + required passive → evolved weapon id, with the evolved behavior.
2. Design our food-themed evolved effects analogous to VS archetypes (crit + lifesteal; no-delay
   fire; piercing spiral/scythe; orbiting library). Map onto our existing weapons (Resizer, Whisk
   Cyclone, etc.) — **names/effects follow CHARACTERS.md kit design; don't invent kit identity.**
3. Trigger: when the recipe's conditions are met, offer the evolution as a special level-up card
   (or via a chest, per VS). Swap the base weapon's behavior for the evolved one.
**Guardrails:** extend the weapon system; keep base weapons intact for players who don't evolve.
All recipes in data. Don't rebalance base weapons here.
**Done-when:** a qualifying build can evolve a weapon into a clearly stronger version, driven by
the recipe data, without breaking non-evolved play.

### WP-LOOT — Crate / drop loot table (consumable power-ups)
**Goal:** Expand crate/pickup drops into a VS-style loot table of one-off consumables, on top of
the existing gold/med-kit/crate pickups.
**Depends:** pickup system (exists, §1.7).
**Steps:**
1. Data-drive a **loot table** in `data/loot.js` (schema §9): weighted drop of XP gem, gold coin,
   coin bag, big coin bag, treasure chest (coins + a power-up), and consumables:
   - **Screen-clear** (destroys all on-screen non-boss enemies) — themed (e.g., a "portion reset").
   - **Freeze-time** (stop enemies ~10 s).
   - **Vacuum** (collect all XP gems).
   - **Heal** (the "floor chicken" — a healthy-meal pickup; we may already have med-kits, so make
     this the same or a bigger heal — **don't duplicate an existing pickup, extend it**).
   - **Gold sweep / "gold fever"** (gather all ground gold + brief gold-bonus window).
   - **Luck +10%**, **+1 Reroll** for level-up cards.
   - *(Skip the multiplayer friendship amulet — not applicable.)*
2. Reuse the existing crate open flow; where a pickup already exists (screen-clear bomb, magnet),
   **reuse it, don't re-implement.** Add the new consumables as pooled entities.
**Guardrails:** extend the pickup/crate system; weights and effects in data + CONFIG. Consumables
must obey the perf caps.
**Done-when:** crates/drops roll from the weighted table, each consumable works, and it layers
cleanly on the existing pickups without duplicating them.

## TRACK C — META UI & CONTENT

### WP-COLLECTIONS — Title screen, Collections & Unlocks
**Goal:** The title-screen hub and the "look what I've unlocked" meta screens.
**Depends:** §3 unlock-flow decision; unlock-tracking (build here); WP-METASHOP (Power-Ups entry).
**Steps:**
1. **Title screen** with entries: **Start · Power-Ups · Unlocks · Collections** (+ Settings).
2. **Unlock tracking:** a stat/counter system (e.g., total enemies defeated per type, bosses
   beaten, districts cleared) persisted in the meta save, plus **unlock definitions** in
   `data/unlocks.js` (schema §9): id, condition (e.g., "defeat 3,000 <enemy>", "beat <boss> in
   <district>"), and the reward it grants.
3. **Unlocks screen:** grid of unlockables; **locked entries show a ??? / silhouette + the hint**
   ("Defeat the sword guardian in the dairy plant"), unlocked ones show the real thumbnail.
   *(District/enemy names in hints are placeholders — Mark's naming, §3.)*
4. **Collections screen:** thumbnails of every ability/weapon/item/hero, selectable to view detail;
   locked ones masked. Reuse existing icon assets.
**Guardrails:** unlock **conditions and rewards live in data**; the tracker only counts. Until the
unlock flow is confirmed (§3), keep `DEV_ALL_UNLOCKED` honored so nothing is hard-gated during dev.
**Done-when:** title hub navigates to all screens; unlocks track and display with hints/masking;
collection browses; all persisted.

### WP-ENVFIDELITY — Environment fidelity pass
**Goal:** Raise environment detail/definition and prop density (Mark's "increase the definition
even more, more detail/props"), leveraging the zoom-out model (§4-B) — high-detail tiles that
tile convincingly with occasional break-up, à la VS.
**Depends:** WP-CAMERA (scale strategy); PixelLab budget (§2.7).
**Steps:**
1. Regenerate/upgrade District 1 ground tiles at higher source resolution with more internal
   detail (so copy-paste tiling "gets away with it"), plus 1–2 break-up variant tiles and scatter
   decals. Use PixelLab's **Wang-tileset generator** for seamless terrain and the **building-kit
   generator** for structures (PIXELLAB.md + the playbook cover the how) — **check `get_balance`
   first**, reuse where possible.
2. Add more scattered props / detail to the code-painted city for visual richness (still
   non-colliding decor unless COMPENDIUM.md says otherwise — don't add collision that changes
   the shipped movement feel).
**Guardrails:** **do not regress the working District 1 collision or layout.** New art is drop-in
replacement at the same footprints; keep the old atlas entries until the new ones are approved.
Meter PixelLab spend.
**Done-when:** District 1 reads as higher-fidelity when zoomed out, tiling looks intentional,
collision/layout unchanged, fps holds, spend reported.

### WP-DISTRICT2 — District 2 (the big content package; do last)
**Goal:** A second playable district — new tileset, new enemy set, new boss — reusing all the
systems above.
**Depends:** effectively everything above stable; the unlock flow (District 1 → 2).
**Steps:** follow the District template in COMPENDIUM.md §8 (environment set, ~5-enemy roster with
role coverage, minute-by-minute spawn timeline, boss with telegraphed patterns + phases, rescue).
Generate the tileset via the Wang/building-kit generators and the enemy roster via PixelLab's
**batch object tool** (the playbook's primary enemy-production method) with the locked style
reference — **`get_balance` first, report spend, review as a set** (the contact-sheet discipline).
**Guardrails:** build District 2 as **new data + new scene state**, not by mutating District 1.
District 1 must remain independently playable and unchanged. Reuse every system (spawn director,
boss framework, loot, etc.) rather than forking it.
**Done-when:** District 2 is playable start-to-finish with its own identity, District 1 is
untouched, and the district-to-district unlock works.

---

# §8 — SUGGESTED SEQUENCE & DEPENDENCY MAP

1. **Track 0** (kits / unlock states / portraits) — continue first, per HANDOVER.md (§6).
2. **WP-AUDIO** — parallel, anytime (isolated, high impact).
3. **WP-CAMERA** — establishes the fidelity/zoom model many later WPs assume (flagged).
4. **WP-JUICE** — after camera scale is roughly set (re-tune gems/numbers to final zoom).
5. **WP-METASHOP** — the core loop; needs a title entry (build alongside WP-COLLECTIONS).
6. **WP-COLLECTIONS** — title hub + unlock tracking (pairs with WP-METASHOP; needs §3.3).
7. **WP-SCRIPTURE** — after revive exists (Mark authors content).
8. **WP-EVOLUTIONS** and **WP-LOOT** — extend combat/pickups; after kits.
9. **WP-ENVFIDELITY** — after camera; before District 2 so the pipeline is proven.
10. **WP-DISTRICT2** — last; consumes everything.

Gate between tracks: **fps holds + shipped slice still passes its playthrough** before moving on.

---

# §9 — DATA SCHEMAS (concrete shapes for the data-driven systems)

Follow existing `data/` conventions; these are the shapes, not final content.

```js
// data/powerups.js
{ id:'might', name:'Might', desc:'+X% inflicted damage per rank',
  ranks:[ {effect:{dmgPct:5},  cost:200},
          {effect:{dmgPct:10}, cost:400}, /* ... max 25% */ ],
  category:'passive' }
// Revival example: { id:'revival', ranks:[{effect:{reviveHpPct:50}, cost:10000}] }
// Faith-themed entries: names/flavor = Mark. Leave: { id:'faith_TODO', name:'TODO(Mark)', ... }

// data/evolutions.js
{ id:'resizer_evo', base:'resizer', baseAtMaxLevel:true,
  requires:'extra_capacitor', evolvedWeapon:'mega_resizer',
  evolved:{ /* behavior overrides: amount, pierce, dmg, fireCd ... */ } }

// data/loot.js  (weighted crate/drop table)
[ { id:'xp_gem',      weight:40, effect:{xp:1} },
  { id:'coin_bag',    weight:15, effect:{gold:'bag'} },
  { id:'freeze_time', weight:3,  effect:{stopEnemiesMs:10000} },
  { id:'vacuum',      weight:3,  effect:{collectAllGems:true} },
  { id:'heal',        weight:6,  effect:{healFlat:30} },
  { id:'gold_fever',  weight:2,  effect:{sweepGold:true, goldBonusMs:8000} },
  { id:'luck',        weight:4,  effect:{luckPct:10} },
  { id:'reroll',      weight:4,  effect:{rerolls:1} },
  { id:'chest',       weight:2,  effect:{coins:true, powerup:true} } ]

// data/unlocks.js
{ id:'unlock_x', condition:{ type:'defeatCount', enemy:'fry_trooper', amount:3000 },
  reward:{ type:'weapon', id:'some_weapon' }, hint:'Defeat 3,000 Fry Troopers',
  thumb:'icon_some_weapon' }
// boss condition: { type:'defeatBoss', boss:'big_frank', district:'d1' }

// data/scripture.js   ⚠️ SCHEMA ONLY — Mark authors ALL questions/answers.
{ reviveQuestions:[
    // FORMAT-ONLY example (NOT for use — replace with Mark's approved content):
    { id:'ex1', prompt:'"For God so loved the ___" (John 3:16)',
      choices:['world','people','children','nation'], answerIndex:0 }
  ],
  goldQuestions:[ /* ~100, same shape, authored by Mark */ ] }
// TODO(Mark): populate both banks (translation of record); ~50 revive, ~100 gold, rotating.
```

---

*End of Phase 2.0 Compendium. Prime directive: the shipped vertical slice and roster are sacred —
every package here adds to them and none rewrites them. When in doubt, keep what works and ask
Mark (Guardrail Protocol §2, rule 2).*
