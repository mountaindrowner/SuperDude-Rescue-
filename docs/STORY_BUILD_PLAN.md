# STORY MODE — CONSTRUCTION & BUILD PLAN
## docs/STORY_SPEC.md + STORY_CAST_ADDENDUM.md mapped onto the real codebase
*(2026-07-27. The spec is locked; this plan decides only HOW it lands on
what exists. Where spec and code disagree, the reconciliation is stated
here once and followed everywhere.)*

---

## §0 — RECONCILIATIONS (spec ↔ current game)

| Topic | Spec says | Codebase has | Ruling |
|---|---|---|---|
| Game modes | Story IS the game | A 5-min quick-run with meta shop | **Story = the campaign; the current run survives as PATROL/QUICK RUN** (spec I.4 wants patrols anyway). Title gains STORY as the top entry. |
| Coins | Coins → Sal's Corner Store passives | `portioncontrol.gold` + PC_Shop (14 power-ups) | **Same currency, same data.** Sal's Corner Store IS the existing shop, walk-in storefront in the hub; PC_Shop screen stays reachable from title for patrol players. Zero migration. |
| Tech Points | TP → Garage hero abilities | doesn't exist | **NEW currency** `portioncontrol.tp` in PC.meta + Garage UI. Story-only earn (objectives 10 / mission 50 / first-clear 25 / side 15). |
| Garage abilities | levels signature weapons + actives + gate tools | signature levels are per-RUN card picks; mastery exists | **Garage buys PERMANENT starting levels** for each hero's signature (L1→L3 cap via TP) + the two GATE TOOLS (Hydro-Drill, Grapnel-Sight) as flags. In-run cards still level further (temporary layer per spec I.1). |
| Stage 1 | Big Frank at Frostbite Bank → rescue Vic | Quick-run: Big Frank at 5:00 → rescue Vic | Perfect alignment — Stage 1 reuses the boss + cage rescue + unlock wiring already shipped. |
| Roles | Kevin=captain, Nayah=nature expert | Already labeled exactly that | No change (addendum §0 already true in code). |
| Map size | 20×20 blocks ≈384px = 7680px | 8192px ceiling confirmed | ✓ fits. Block=384, map=7680×7680. |
| Bosses | Broccolisk / Layer Cake Colossus / Vending Behemoth / Gloop King / CHOMP (+Frank Mk-II) | registry planned melon/cake/vending/mother | **Spec names win.** cake→LAYER CAKE COLOSSUS and vending→VENDING BEHEMOTH map onto existing keys; BROCCOLISK + GLOOP KING + CHOMP get new keys. |
| District enemy sets | Park=feral produce, Suburbs=dessert, Labs=junk, Sewers=sludge | registry d2=produce, d3=dessert, d4=junk, d5=glitch | d2→Map2, d3→Map3, d4→Map4 as planned; **d5 re-themed sludge/spoiled** for the Sewers. |
| Hero select in story | Danny first; rescued heroes playable | unlock flow exists (win D1 → Vic etc.) | Story rescues BECOME the unlock path (replaces the v0.13 stat-based conditions in story; patrol keeps them as alternates). |
| Dialogue blip | per-letter tone at speakerPitch | SFX voice engine exists | add a `textBlip(pitch)` voice — trivial on tone(). |

**Save layout:** story state = `portioncontrol.story` { mission, beatsDone,
tp, garage:{heroId:{sigLevel, tools:[]}}, firstClears, patrolsUnlocked }.
Gold/meta/shop untouched.

---

## §1 — NEW SYSTEMS (files) & REUSE MAP

| New file | Purpose | Reuses |
|---|---|---|
| `src/story/dialogue.js` | portrait box + typewriter + textBlip + tap-advance | portraits atlas, labPanel, audio tone |
| `src/story/cutscene.js` | beat-list runner (`[SCENE]/[ACTION]/(MUSIC)` hooks) | dialogue.js, vfx (confetti/flash), tweens |
| `src/story/region.js` | region-JSON schema + loader; block-grid → chunk painter orders | ground.js chunk system, world.js painter (gains a "layout source" param) |
| `src/story/quest.js` | mission state machine: objective chain (clear/fetch/defend/escort/survive/boss/rescue), compass arrow, TP awards | uiAttach HUD, spawn director (zone-driven), vfx |
| `src/story/hub.js` | Central District hub mode: walk-in Garage/Store/Mission Board markers, idle banter pool | GameScene movement/painter, dialogue |
| `src/story/garage.js` | Garage UI (TP → sig start-levels + gate tools) | shop.js patterns, labPanel |
| `src/data/story/mission1.js` … | per-map region JSON + objective chain + loot spots | — |
| `src/data/story/scripts.js` | Part IV dialogue verbatim + addendum lines (dossiers, Bloom gag, hub banter) | — |

**Mission gameplay = GameScene variant** (`mode:'mission'`): no 5-min boss
timer; spawn director runs zone budgets; objectives drive spawns/bosses;
死 → retry-from-mission-start (keep coins found, spec-fair).

---

## §2 — ART BUDGET (PixelLab, ~1160 gens available)

| Batch | Items | Est. gens |
|---|---|---|
| NPC portraits | Bloom, Sal, Pip, CHOMP lens-face | ~8 (card-crop pipeline where art exists; generate otherwise) |
| Map 1 landmarks | City Hall, Garage, Corner Store, Mission Board, Fountain, Substation, Demo Stage, Bloom Tower, Diner, Frostbite Bank | ~12 (64px kit pieces + 128px set pieces, ENV pipeline) |
| Maps 2–5 tiles/props/landmarks | per ENV doc §8 (~30/district) | ~120 (staged per map, not up front) |
| New bosses | Broccolisk, Gloop King, CHOMP (+Frank Mk-II tint = free) | ~12 (multi-frame) |
| **Vertical slice needs only rows 1–2** | | **~20 gens** |

---

## §3 — BUILD ORDER (spec Part VI mapped to shippable versions)

Each step ships pushed + headless-verified before the next.

- **v0.17.0 — STORY-1: Dialogue + cutscene runner.** dialogue.js +
  cutscene.js + textBlip; INTRO CINEMATIC (IV.0) playable from a new
  STORY title entry (temp: intro → existing run). Verifies: script
  format end-to-end, portraits, chant staging, music-cue hooks.
- **v0.17.x — STORY-2: Region maps.** region.js schema/loader; world.js
  painter accepts ordered layouts (roads on spec avenues, landmark rects
  reserved w/ placeholder plates, filler lots = existing procedural).
  Map 1 (7680²) walkable, hub landmarks placed. Verify: pan harness at
  true zoom, collision, memory flat.
- **v0.17.x — STORY-3: Quest/compass.** quest.js beat types + compass
  arrow + TP awards + mission HUD (objective banner). Stage-1 chain
  B1–B5 running with script beats wired (IV.1), Big Frank at the Bank,
  cage rescue, CHANT, first TP payout.
- **v0.18.0 — STORY-4: Hub + Garage + Store loop.** hub mode with
  pulsing markers, Garage UI (TP), Sal's store front (opens PC_Shop),
  Mission Board w/ Map-2 gate (locked "coming soon" beyond slice).
  **= THE VERTICAL SLICE Mark playtests** (intro → Stage 1 → rescue Vic
  → hub → spend → patrol unlock).
- **v0.19.x — STORY-5..8:** Maps 2–5 (art batch per map, region JSON,
  chains + scripts IV.2–IV.5, soft gates Hydro-Drill/Grapnel-Sight,
  Bloom radio gag from Stage 5), each shippable alone.
- **v0.20.0 — FINALE:** Tower floors (8 arena rooms + roof, vertical
  ascent = 8 small region rooms chained), Frank Mk-II, CHOMP 3-phase,
  ending, credits, Patrols + endless unlock.

**WP-SCRIPTURE slots in parallel** (unchanged queue) — it hooks the
death flow in both patrol and story.

---

## §4 — RISKS / WATCH LIST

1. **Painter refactor** is the one surgical change (layout-source param
   into `paintChunkD1`). Feature-flag `PC.STORY_MODE`; patrol path
   byte-identical when off.
2. **Escort/survive beats** are new mechanics — keep them simple (cart =
   slow-moving ally sprite w/ HP bar; survive = timer + spawn budget).
3. **7680² map + 20 landmarks**: landmark art staged in — placeholder
   plates (labPanel-styled, named) are acceptable in STORY-2/3 so the
   slice isn't art-blocked (per M0 philosophy).
4. **Scope honesty:** the slice (v0.18.0) is ~4 build steps; Maps 2–6
   are content-stamping on those rails.
