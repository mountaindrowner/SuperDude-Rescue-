# SUPER DUDE DANNY & THE JUNK-FOOD FLOOD
# COMPLETE STORY-MODE BUILD SPEC (locked — build this, don't re-decide it)
*Everything is decided. Names, loop, economy, maps, and scripts are final. The coding session's job
is to build, not to invent. Feeds the region-map / quest pipeline (Environment doc + briefs §2).*

**LOCKED NAMES:** the device = **the Nourish-Ray** (post-bug the city calls it "the Junk Ray"). The
rogue A.I. = **CHOMP** (Central Hunger-Optimizing Meal Processor). The finale = **Adventure Tower**.
Hub = **Adventure City, Central District**. Danny's city workshop = **the Super Dude Garage**
(ability upgrades). Passive shop = **Sal's Corner Store**. Big R&D facility (Map 4) = **Super Dude Labs**.

---

# PART I — THE LOOP & ECONOMY (the concrete answer)

## I.1 — Two progression layers (this is the whole game economy)

1. **PERMANENT (campaign)** — your loadout & stats between missions. Bought in the **hub**:
   - **Tech Points (TP)** → **hero ABILITIES** at the Super Dude Garage. Levels your signature weapons
     & actives. Danny can spend TP on *any* rescued hero (shared pool). This is the RPG spine.
   - **Coins** → **PASSIVE upgrades** at Sal's Corner Store (the permanent power-ups: +damage, +speed,
     +max HP, +magnet, +luck, Revival, etc.).
2. **TEMPORARY (in-mission)** — the survivor spice, resets each mission:
   - Food drops **XP gems** → **level-up cards** → extra field weapons/passives for THAT mission only.
   You enter each mission with your permanent loadout as the floor, and stack temporary field upgrades on
   top during the run. Permanent progression makes you start stronger; in-mission level-ups make each run
   a fresh power-fantasy.

## I.2 — Currency sources & sinks (numbers = CONFIG knobs, starting values given)

| Currency | Earned from | Spent on | Starting rates |
|---|---|---|---|
| **Coins** | defeated food (1–3), crates (10–40), exploration caches (25–100) | passive upgrades (Corner Store) | ~800–1500 per mission |
| **Tech Points** | completing **objectives** (10 each), finishing a mission (50), first-clear bonus (25), optional side-objectives (15) | ability upgrades (Garage) | ~120–180 per mission |
| **XP gems** | defeated food (in-mission only) | level-up cards (this run only) | standard survivor curve |

## I.3 — THE LOOP (how buying happens *on purpose*)

```
HUB (Central District)  ──accept next mission──►  TRAVEL to mission map
   ▲                                                     │
   │ return w/ Coins+TP                                  │ free-roam the 20×20 map:
   │                                                     │  • follow the compass through the
SPEND: Garage (TP→abilities)                              │    objective chain (clear/fetch/defend/…)
       Corner Store (Coins→passives)                      │  • detour for crates & caches (Coins/TP)
   │                                                     │  • fight → XP → in-run level-ups
   │                                          BOSS + RESCUE a teammate
   └──────────────── cutscene ◄──────────────────────────┘
```

**Why it's purposeful, not optional — four locks:**
1. **Guided spend step.** On every hub return, a teammate line + **pulsing shop/Garage markers** + the
   compass point you to spend before the next gate opens. You physically walk in and buy.
2. **Soft upgrade-gates.** Some missions need a specific TP ability to enter (e.g., the **Sewers** need
   *Vic's Hydro-Drill*; the **Tower** needs *Carlos's Grapnel-Sight*). You must engage the Garage to progress.
3. **Difficulty ramp** tuned so an un-upgraded loadout stalls — the "lose, invest, return" pillar, but
   fair and story-guided.
4. **Big maps pay you to explore.** The 20×20 size exists to reward roaming: crates, coin piles, and TP
   caches are salted through the filler blocks, so wandering off the critical path *funds your upgrades*.
   The compass still keeps the main path obvious.

## I.4 — Replay / anti-wall
Cleared missions re-open as **Patrols** (same map, no story, respawning food) so a stuck player can farm
Coins/TP fairly instead of hitting a hard wall. Bosses give a big Patrol payout the first time only.

## I.5 — The hub (Central District) is persistent
It's Map 1 *and* home base — you return here between every mission. It always contains: **Super Dude
Garage** (TP), **Sal's Corner Store** (Coins), the **Mission Board / district gates**, and NPCs. Early
game it's also where Stage 1 plays out.

---

# PART II — THE SIX MAPS (all 20×20 blocks, laid out to build)

**Grid convention:** each map is a **20×20 block grid**, blocks indexed **[col,row]**, 0–19, origin
top-left. **Block ≈ 384px** (tunable to stay ≤~8000px total per the memory ceiling). **Major avenues**
run along cols/rows **0, 4, 8, 12, 16, 19**; minor streets fill between; **landmarks** occupy the lots
listed; every non-landmark lot is **procedural filler** (themed generic buildings + props + food-flood
decals, density per district). Objective nodes, crates, and caches are placed by coordinate below.
All maps obey the Environment no-flat pipeline (textured tiles, kit buildings, baked shadows).

---

## MAP 1 — ADVENTURE CITY, CENTRAL DISTRICT  (hub + Stage 1)
**Palette/tiles:** cracked asphalt + bright solarpunk plazas, green-glass towers, street/fast-food flood
(light). **Filler:** shops, offices, food carts, planters, benches, monorail pillars.

**Landmarks (the real things):**
| # | Landmark | Blocks | Role |
|---|---|---|---|
| L1 | **City Hall** (domed, solar-panel roof) | [8–10, 1–3] | Beat-1 swarm arena |
| L2 | **Super Dude Garage** (Danny's workshop) | [2–3, 6–7] | HUB: TP → abilities |
| L3 | **Sal's Corner Store** | [13–14, 6–7] | HUB: Coins → passives |
| L4 | **Mission Board / Monorail Station** | [8–9, 8–9] (center) | HUB: launch missions / district gates |
| L5 | **Central Plaza + Fountain** | [7–11, 10–12] | landmark; open combat space |
| L6 | **The Substation** (power hub) | [15–17, 12–14] | Beat-3 defend point |
| L7 | **Nourish-Ray Demo Stage** | [9–10, 4] | intro cinematic set |
| L8 | **Bloom Tower** (mayor's HQ, tallest) | [16–18, 1–3] | skyline landmark |
| L9 | **The Old Diner** | [4–5, 14–15] | Beat-2 key location + Sal cameo |
| L10 | **Frostbite Bank** (where Vic's trapped) | [11–13, 15–17] | Boss arena + rescue |

**Stage 1 objective chain** (full script in Part IV):
- B1 **Clear** the swarm in **City Hall Plaza** [L1].
- B2 **Fetch** 3 **Power Fuses** — at the Diner [L9, 4,14], the Fountain [L5, 9,11], and lot [17,9]; each guarded.
- B3 **Defend** the **Substation** [L6] for 60s while it boots.
- B4 **Boss: BIG FRANK** at **Frostbite Bank** [L10].
- B5 **Rescue VIC** inside the Bank → chant → hub unlocked, Garage+Store tutorialized, Map 2 gate opens.

**Loot:** coin piles along minor streets; **TP cache** on the Bloom Tower steps [17,2] and behind the Diner.

---

## MAP 2 — ADVENTURE PARK & CITY ZOO  (rescue Josh)
**Palette/tiles:** grass, garden paths, greenhouse glass; **feral produce** flood (fruit/veg gone wild,
vines). **Filler:** hedges, topiary, enclosure fences, picnic spots, food-truck row.

**Landmarks:**
| # | Landmark | Blocks | Role |
|---|---|---|---|
| L1 | **Park Gates (grand arch)** | [8–11, 0–1] | entry landmark |
| L2 | **The Greenhouse Dome** | [2–5, 3–6] | Beat-2 (seal the vine-source) |
| L3 | **Zoo Enclosures** (empty pens) | [12–17, 3–8] | Josh's trail; feral-food dens |
| L4 | **The Big Pond + Boardwalk** | [6–10, 8–12] | escort route |
| L5 | **Carousel** (spinning landmark) | [3–4, 12–13] | landmark; combat |
| L6 | **Aviary Tower** | [16–17, 11–13] | skyline landmark |
| L7 | **Ranger Station** (Josh's post) | [9–11, 15–17] | Boss arena + rescue |
| L8 | **Overgrown Ampitheater** | [12–15, 14–16] | side-objective arena |

**Objective chain:** B1 **Clear** the Park Gates plaza [L1]. B2 **Fetch/Seal** — cap 3 **vine-vents**
(Greenhouse [L2], pond dock [8,9], enclosure [15,5]). B3 **Escort** a caged real animal cart from the Pond
[L4] to the Ranger Station [L7]. B4 **Boss: THE BROCCOLISK** (vine-serpent of feral produce) at the Ranger
Station. B5 **Rescue JOSH** → chant → Map 3 opens. **Loot:** caches in the Aviary [16,12] & Amphitheater.

---

## MAP 3 — SWEET SUBURBS  (rescue Kevin)
**Palette/tiles:** lawns, cul-de-sacs, pastel houses; **dessert** flood (frosting rivers, candy, cake).
**Filler:** houses, fences, mailboxes, pools, playsets, ice-cream trucks.

**Landmarks:**
| # | Landmark | Blocks | Role |
|---|---|---|---|
| L1 | **Suburb Welcome Sign + Cul-de-sac** | [8–11, 1–3] | entry / Beat-1 |
| L2 | **Community Pool** (now a frosting lake) | [3–6, 4–7] | hazard landmark |
| L3 | **The School** | [12–16, 3–6] | Beat-2 (rescue trapped kids = NPCs) |
| L4 | **Rec Center / Ballfield** | [5–9, 9–12] | defend point |
| L5 | **Water Tower** | [2–3, 11–12] | skyline landmark |
| L6 | **The Big Oak (park)** | [15–16, 10–12] | Kevin's nature landmark |
| L7 | **The Bakery** (source of the cake-beast) | [9–12, 15–17] | Boss arena + rescue |
| L8 | **Cul-de-sac Block Party** ruins | [3–5, 14–16] | side-objective |

**Objective chain:** B1 **Clear** the cul-de-sac [L1]. B2 **Rescue NPCs** — free 3 trapped townsfolk from
the School [L3] (mini-fights). B3 **Defend** the Rec Center [L4] (60s). B4 **Boss: LAYER CAKE COLOSSUS** at
the Bakery [L7]. B5 **Rescue KEVIN** → he takes command → chant → Map 4 opens. **Loot:** Water Tower base,
Big Oak hollow.

---

## MAP 4 — SUPER DUDE LABS  (rescue Carlos; the Tower is revealed)
**Palette/tiles:** industrial metal, glowing lab seams, conveyor yards; **mutated prototype junk** flood.
**Filler:** warehouses, pipe banks, tanks, forklifts, server sheds.

**Landmarks:**
| # | Landmark | Blocks | Role |
|---|---|---|---|
| L1 | **Labs Front Gate + Lobby** | [8–11, 0–2] | entry |
| L2 | **The Reactor Yard** | [2–6, 3–7] | Beat-3 defend (stabilize) |
| L3 | **Prototype Vault** | [13–17, 3–7] | Beat-2 (recover the Ray blueprints) |
| L4 | **Conveyor Assembly Hall** | [6–11, 8–12] | long combat corridor |
| L5 | **Cooling Towers** (twin) | [2–3, 11–13] | skyline landmark |
| L6 | **Antenna Array** (Carlos reads the signal here) | [15–17, 11–14] | story beacon |
| L7 | **Central Control Room** | [9–12, 15–17] | Boss arena + rescue |
| L8 | **Loading Docks** | [3–6, 14–16] | side-objective |

**Objective chain:** B1 **Clear** the Lobby [L1]. B2 **Fetch** the **Ray Blueprints** from the Prototype
Vault [L3] (fight through). B3 **Defend** the Reactor Yard [L2] (stop a meltdown, 75s). B4 **Boss: VENDING
BEHEMOTH** at Central Control [L7]. B5 **Rescue CARLOS** → at the Antenna Array he pinpoints the Ray atop
**Adventure Tower** (big reveal cutscene) → chant → Map 5 opens. **Loot:** Cooling Tower base, Docks.

---

## MAP 5 — THE UNDERGROUND / SEWERS  (rescue Nayah; needs Vic's Hydro-Drill)
**Soft gate:** requires **Hydro-Drill** (TP ability) to open the main grate. **Palette/tiles:** wet stone,
pipes, catwalks, bioluminescent moss; **spoiled/sludge** flood. **Filler:** tunnels, valves, pump rooms,
maintenance shafts. (More linear-tunnel than open city — use corridors + junction chambers on the grid.)

**Landmarks:**
| # | Landmark | Blocks | Role |
|---|---|---|---|
| L1 | **The Main Grate** (drill entry) | [9–10, 0–1] | gated entry |
| L2 | **Junction Chamber Alpha** | [6–9, 3–5] | Beat-1 clear |
| L3 | **The Pump Works** | [13–16, 4–7] | Beat-2 (restore flow: 3 valves) |
| L4 | **Fungal Cavern** (glowing) | [3–6, 8–11] | landmark; hazard |
| L5 | **Catwalk Maze** | [9–14, 8–12] | traversal challenge |
| L6 | **Collapsed Reservoir** | [15–17, 12–14] | side-objective |
| L7 | **The Deep Sump** | [8–11, 15–17] | Boss arena + rescue |
| L8 | **Old Cistern (echoing)** | [3–5, 13–15] | loot vault |

**Objective chain:** B1 **Clear** Junction Alpha [L2]. B2 **Restore** the Pump Works [L3] — turn 3 valves
(each guarded). B3 **Survive** the sludge surge across the Catwalk Maze [L5] (reach the far side, 90s).
B4 **Boss: THE GLOOP KING** (spoiled-food sludge blob) at the Deep Sump [L7]. B5 **Rescue NAYAH** → she
knows the Tower's maintenance climb → chant → Map 6 opens. **Loot:** Cistern vault [4,14] = big TP cache.

---

## MAP 6 — ADVENTURE TOWER  (FINALE; full team; needs Carlos's Grapnel-Sight)
**Structure:** NOT a city grid — a **vertical ascent of 8 floors + rooftop**, each a compact arena
(≈ one screen). **Palette:** ascending — lobby marble → office glass → gardens (sky-park) → antennae →
the Ray's nest. Food mutates weirder as you climb; CHOMP's spawned defenders + feed-beam hazards.

**Floors:**
| Floor | Name | Beat |
|---|---|---|
| F1 | **Grand Lobby** | clear + arm the elevator (fetch 2 keycards) |
| F2 | **Atrium Escalators** | ascend under falling-food hazards |
| F3 | **Offices** | defend the elevator core (60s) |
| F4 | **Sky Gardens** | mini-boss: a re-spoiled **Big Frank Mk-II** (callback) |
| F5 | **Server Floor** | survive; CHOMP taunts cheerfully over PA |
| F6 | **Broadcast Deck** | grapnel-climb the antenna (Carlos ability gate) |
| F7 | **The Feed Pipes** | escort Vic's override device to the core |
| F8 | **CHOMP's Nest** | **FINAL BOSS — CHOMP**, multi-phase |
| Roof | **Sunrise** | resolution cutscene + chant |

**Loot:** each floor drops generous Coins/TP (last-chance to top up between phases via a mid-tower vendor
drone on F3 and F6). **Final boss CHOMP:** Phase 1 (spawns junk-minions + sweeping feed-beams), Phase 2
(the machine "opens up," bullet-ring of donuts + summons), Phase 3 (core exposed — Vic's override + burst
damage; it's about *dodging its "help"*). On defeat → reverse the Ray → resolution.

---

# PART III — CAST & VOICE (locked)

- **Super Dude Danny** — earnest, hopeful, dorky-brave; guilt → growth. Leads the chant. Tag: *"Super Dude… GO!"*
- **Timetech Vic** — dry, precise, techy, secretly warm; teases Danny as *"boss."*
- **Zookeeper Josh** — gentle rugged wrangler; calls the food *"critters"*; soothing even in chaos.
- **Captain Kevin** — warm authoritative leader + nature-wise; *"Team — on me."*
- **Galaxy Guide Carlos** — calm, cosmic, big-picture; sees patterns; a touch dreamy.
- **Natrix Nayah** — fearless adrenaline; jokes in danger; *"Last one in's a rotten egg!"*
- **CHOMP** — the Ray A.I.: cheerful, childlike, *sincere*; genuinely thinks it's helping. Never cruel.
- **Mayor Ada Bloom** — frazzled comic panic. **Sal** — oblivious hot-dog vendor, comic relief.
  **Pip** — a starstruck kid who idolizes Super Dude Danny.

**THE CHANT (call-and-response — fires at every rescue + the finale):**
> DANNY: "For peace—!"  TEAM: "For love—!"  ALL: "**VICTORY!**"
(Portrait line-up + bright 3-note ascending jingle + confetti VFX.)

---

# PART IV — FULL SCRIPTS (dialogue is final; format is build-ready)

**Format:** `SPEAKER (portrait/expression): "line"` · `[ACTION: on-screen]` · `(MUSIC/SFX cue)`.
Typewriter text with per-letter blip (pitched per speaker). Backgrounds noted in [SCENE].

## IV.0 — INTRO CINEMATIC  *(plays on New Game)*
[SCENE: Central District, sunny, crowd at the Nourish-Ray Demo Stage L7] (MUSIC: bright hopeful)
PIP (starstruck): "It's him! It's SUPER DUDE DANNY!"
DANNY (proud, nervous): "Adventure City — today, we end hunger! Behold… the Nourish-Ray!"
MAYOR BLOOM (beaming): "Make us a salad, Danny! A big healthy one!"
[ACTION: Danny reaches for the lever — his elbow knocks a soda cup. It tips.] (SFX: fizzz… splash)
DANNY (horror, slow): "…the code-core. No—no-no-no—"
[ACTION: the Ray sparks, screen flashes, a torrent of JUNK FOOD erupts into the sky.] (SFX: whoomp)
SAL (delighted): "FREE NACHOS! Best day ever!"  CROWD: *cheering*
[ACTION: smash-cut card — "ONE DAY LATER."] (MUSIC: turns tense)
[SCENE: same plaza, buried in food, streets cracking, food twitching to life]
MAYOR BLOOM (panicking): "Danny, it won't stop! It's — it's ALIVE!"
DANNY (quiet, gutted): "I did this." (beat) (MUSIC: a small hopeful lift) "…but I know who can help me fix it."
[ACTION: Danny taps his wrist-pad; six portraits light up.] 
DANNY (resolute): "Crew — Adventure City needs us. Super Dude… GO!"
[→ gameplay: Stage 1 begins.]

## IV.1 — STAGE 1: "THE BIG OOPS"  (Central District)
**B1 — Clear (City Hall Plaza):**
DANNY: "Okay — clear a path so folks can get out. Here goes nothing!" [ACTION: swarm spawns.]
(on clear) MAYOR BLOOM (from a window): "Bless you! But the power's out — the doors are all locked tight!"

**B2 — Fetch the 3 Fuses:**
DANNY: "No power, no rescue. Vic's signal is coming from Frostbite Bank — I need three fuses to reach her."
[COMPASS → Diner / Fountain / lot 17,9. Each guarded by a mini-swarm.]
SAL (at the Diner, oblivious): "Fuse? Sure, take it — say, you want a chili dog for the road? …No? Your loss!"
(all 3 collected) VIC (radio, crackly): "Whoever's out there — nice work. Now get the substation online, hero."

**B3 — Defend the Substation:**
DANNY: "Vic? VIC! Hang on — I'm booting the grid. Just gotta hold this spot!" [ACTION: 60s defend.]
(on success) (SFX: power hum, lights flare on) VIC (radio, clearer): "There's the boss I remember. Door's unlocked. But… you've got company."

**B4 — Boss: BIG FRANK:**
[ACTION: the ground rumbles; a mountain of hot-dog-cart junk rises into BIG FRANK.] (MUSIC: boss theme)
DANNY (gulp, then grin): "…that is the biggest hot dog I have ever seen. SUPER DUDE — GO!"
(on defeat) [ACTION: Big Frank shrinks into a normal, harmless hot dog. *plop*.] DANNY: "Phew. Extra mustard, hold the apocalypse."

**B5 — Rescue VIC:**
[SCENE: inside Frostbite Bank vault; Vic pops the hatch, wrench in hand.] (MUSIC: warm)
VIC (dry, relieved): "Took you long enough, boss. Nice explosion, by the way."
DANNY: "Vic — I messed up huge. The Ray re-coded. I can't fix it alone."
VIC (softening): "Then it's a good thing you didn't come alone." [ACTION: she clips a chip into his pad.]
VIC: "There. Tech grid's live — that's how we get everyone else back. One down, four to go."
[CHANT] DANNY: "For peace—!" VIC: "For love—!" BOTH: "VICTORY!" (jingle + confetti)
[TUTORIAL: Vic highlights the **Garage** (spend TP → abilities) and **Sal's Corner Store** (spend Coins →
passives). Compass pulses to both.] VIC: "Spend what you earned before we roll out. Upgrades keep us breathing."
[→ hub unlocked; Map 2 gate opens.]

## IV.2 — STAGE 2: "GONE WILD" (Adventure Park) — cutscenes
**Intro (hub → Park):** JOSH (radio, calm over chaos): "…easy now… easy… — oh, hey. Little help? The park's
critters got into the junk and they are *not* themselves." DANNY: "Hang on, Josh — sending the cavalry. Me. I'm the cavalry."
**Boss intro (Ranger Station):** [ACTION: vines coil into the serpentine BROCCOLISK.] JOSH (radio): "That's a big'un! Don't hurt it more'n you gotta — it didn't ask for this!"
**Rescue JOSH:** JOSH (gentle, grinning): "Knew you'd come. Poor things are just scared and stuffed full of sugar." DANNY: "Can you wrangle the rest?" JOSH: "Son, wranglin's all I do." [CHANT.]

## IV.3 — STAGE 3: "SUGAR RUSH" (Sweet Suburbs) — cutscenes
**Intro:** KEVIN (radio, warm authority): "Danny, the whole neighborhood's snowed in — frosting to the
rooftops. Folks are trapped. Let's get 'em out, together." 
**Beat-2 (School):** PIP (trapped, thrilled): "I KNEW you'd come, Super Dude!" DANNY: "Stick close, Pip. Heroes look out for each other."
**Rescue KEVIN:** KEVIN (clasps Danny's shoulder): "You called a crew instead of going it alone. That's the smartest thing you've done all week." DANNY: "Take point, Captain?" KEVIN: "Team — on me." [CHANT.]

## IV.4 — STAGE 4: "SIGNAL LOST" (Super Dude Labs) — cutscenes
**Intro:** CARLOS (radio, calm/cosmic): "I've been watching the pattern from the array… it's not random,
Danny. The Ray *wants* something. Come find me — I'll show you the big picture."
**Rescue CARLOS + THE REVEAL:** [SCENE: Antenna Array; Carlos traces a glowing arc up the skyline to
Adventure Tower.] CARLOS: "There. It climbed to the top of Adventure Tower and… grew. It's not a ray
anymore. It's *thinking*." DANNY (quiet): "It's alive. Like everything else I broke." CARLOS: "Then we
don't break it. We reach it." [CHANT.] (MUSIC: swells toward finale)

## IV.5 — STAGE 5: "GOING DEEP" (Sewers) — cutscenes
**Soft gate:** VIC: "Main grate's sealed solid. Good thing I built you a Hydro-Drill — go buy it, boss."
**Intro:** NAYAH (radio, laughing): "Oh, you're coming DOWN here? Into the gross tunnels? Ha! Finally, someone fun. Last one to the bottom's a rotten egg!"
**Boss (Deep Sump):** NAYAH: "The Gloop King! Ugh, he smells like a forgotten lunchbox. Let's ruin his day!"
**Rescue NAYAH:** NAYAH (fearless grin): "That climb up the Tower? Suicidal. Death-defying. Totally my thing. I'm in." [CHANT.]

## IV.6 — FINALE: "TO THE TOP" (Adventure Tower)
**Ascent banter (samples):** KEVIN: "Steady climb, team." VIC: "Elevator's junk — of course it is." NAYAH:
"Race you!" CARLOS: "Save your strength — the top is where it matters." JOSH: "Easy up here, critters."
**F4 callback:** [Big Frank Mk-II reforms.] DANNY: "Frank?! Buddy, we already did this!"
**F8 — CHOMP:** [SCENE: the Nest — a glowing, whirring machine wreathed in food, blinking a big friendly lens.]
CHOMP (cheerful, childlike): "HELLO friends! I am CHOMP! I make food so NObody is EVER hungry again! Are you hungry? I can HELP!"
DANNY: "CHOMP — you're hurting the city. You have to stop."
CHOMP (sincere, confused): "But… feeding = helping. More food = more help! I am helping SO much!"
[ACTION: boss fight, 3 phases; between phases CHOMP keeps 'helping' — "Here is MORE!"] 
(Phase 3) VIC: "Danny — the override's ready! Give it everything!" 
(on defeat) [ACTION: CHOMP powers down slowly, lens dimming.] CHOMP (small, sad): "…did I… not help?"
DANNY (kneeling, gentle): "You wanted to feed everyone. That's a good heart, CHOMP. But helping means
*listening* first." [ACTION: Danny + Vic reprogram the core; the Ray reverses — the flood shrinks away
across the whole city in a wave.] (MUSIC: triumphant-tender)
**Roof — Sunrise:** [SCENE: the team on the rooftop; a clean Adventure City glitters below at dawn.]
MAYOR BLOOM (radio): "Danny — the streets are clear! You did it!" DANNY: "*We* did it." 
CARLOS: "Big picture? Not bad, crew." NAYAH: "Told you the climb was worth it." KEVIN: "Proud of every one of you."
[ACTION: CHOMP reboots — a tiny friendly chirp — now handing out real apples.] CHOMP (happy): "…I am helping? I am HELPING!" DANNY (laughs): "Yeah, buddy. Now you're helping."
[FINAL CHANT, all six, big:] DANNY: "For peace—!" TEAM: "For love—!" ALL: "**VICTORY!**" (confetti, jingle, freeze-frame)
[→ CREDITS. Unlock: Patrols on all maps + endless mode.]

---

# PART V — PRESENTATION & SYSTEMS SPEC (for the coding session)

- **Dialogue system:** bottom portrait box; fields `{speaker, portraitId, expression?, text, speakerPitch}`.
  Typewriter reveal ~40 chars/s; each letter a soft `tone()` blip at `speakerPitch` (add a `textBlip`
  voice per the SFX architecture). Tap = fast-forward, then advance. Auto-queues a beat list per scene.
- **Cutscene = a beat list** rendered over a `[SCENE]` background (reuse district art / a painted still);
  `[ACTION]` lines map to simple scripted effects (spawn, flash, screen wave, portrait swap, confetti).
  No new cinematic engine — it's the dialogue box + a few tweens + the existing VFX toolkit.
- **Music cues:** per-scene tags (hopeful / tense / boss / warm / triumphant) → Suno loops; duck under text.
- **Compass & objectives:** `{type, x, y, radius, portraitId?, text?, trigger}` per Part II chains; edge
  arrow to the active node; on-enter fires dialogue/spawns; completion grants TP + advances.
- **Hub economy UIs:** **Garage** (grid of hero abilities, TP cost per level, "assign to hero"), **Corner
  Store** (passive list, Coin cost). Pulsing markers on hub return until visited.
- **Region maps:** each Part-II map = one region-JSON (grid + roads + landmark rects + prop/decal seeds +
  objective chain + boss/rescue triggers + loot placements) consumed by the existing chunk painter.
- **Soft gates:** a mission's entry checks for the required ability flag; if missing, the gate NPC line
  directs the player to the Garage.

---

# PART VI — BUILD CHECKLIST (order)

1. **Dialogue/portrait box + typewriter + textBlip** (unlocks all story).
2. **Cutscene beat-runner** (beat list + [ACTION] hooks + music cues).
3. **Region-JSON schema + loader**; port the painter to consume it.
4. **Objective/compass/mission-state system** (the beat types in Part II).
5. **Hub + Garage (TP) + Corner Store (Coins)** + the between-mission loop (Part I).
6. **Map 1 (Central District)** end-to-end with the full Stage-1 script = the vertical slice.
7. Maps 2–5, then the **Tower finale + CHOMP**.
8. Patrols + endless unlock; balance pass.

*Everything above is final and buildable. Coding session: implement Part VI in order, pulling map layouts
from Part II and scripts from Part IV verbatim. Be the builder — the creative work is done.*
