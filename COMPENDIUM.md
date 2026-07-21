# SUPER DUDE DANNY: PORTION CONTROL
## The Complete Build Compendium (for Claude Code)

**This document is the single source of truth.** It supersedes the earlier GDD and asset
spreadsheet wherever they disagree (notably: animation is now WALK-ONLY, Vampire
Survivors-style — the old "idle/walk/attack/hurt" frame counts are obsolete).

**Read order for Claude Code:** §1 Pillars → §2 Assets → §3 Performance Bible → §4 Controls
→ then build by the Milestones in §12, referencing §5–§11 for numbers.

**Working title:** Portion Control. All names (characters, districts, bosses, weapons) are
final-until-Mark-says-otherwise; they are grep-friendly for later renames.

---

# §1 — VISION & PILLARS

The game: a kid-friendly roguelite survivor (Vampire Survivors genre). Danny the scientist
accidentally flooded Adventure City with living food; he shrinks it back, district by
district, rescuing his team along the way. Goofy + cute + a little menacing. No gore:
defeated food **pops** back into a normal, harmless food item.

**Pillars, in priority order (when in doubt, the higher pillar wins):**
1. **Smoothness.** 60 fps feel on a mid-range phone. Controls with zero perceptible lag.
   Frame-rate is a feature; drop content before dropping frames.
2. **Readability.** At 300 enemies, the player must still instantly parse: me, threats,
   projectiles, pickups. Palette and silhouettes do this work (§2.2).
3. **The dopamine loop.** Swarm → pop-pop-pop → gems fly in → level-up → pick 1 of 3 →
   visibly stronger within seconds.
4. **Simple assets, maximum charm.** Walk-only animation, flat top-down, chunky pixel art.
   Charm comes from faces, motion wobble, and effects — not frame count.

**Hard scope for v1.0:** 6 characters · 5 districts · 5 bosses · 10 weapons · 8 passives ·
27 enemy types. Evolutions, lab upgrades, and extra modes are flagged STRETCH.

---

# §2 — ART DIRECTION & ASSET CONSTRUCTION (build this first)

## 2.1 The animation law (this is the big cost-saver)
Vampire Survivors-level, exactly:
- **Enemies: 2-frame walk loop.** Frame A / frame B, ~6 fps flipbook. **Horizontal flip**
  in code for left/right. No idle, no attack, no death frames.
- **Player characters: 4-frame walk loop** (they're stared at all game; 4 frames reads
  smoother). Idle = walk frame 1, or a code-driven 2px bob. Flip for direction.
- **Bosses: 4-frame loop** (walk/hover). Attack **telegraphs are tints/flashes/shadows**
  drawn by code, not frames. Mother Batch gets a 4-frame phase-2 variant.
- **Hurt = white flash** (`setTintFill(0xffffff)` for 80 ms). Zero frames.
- **Death = shared Pop VFX** (one 4-frame puff, tinted per enemy color by code) + the enemy
  sprite swaps to its 1-frame "normal food" still for 0.4 s, then despawns. Zero per-enemy
  death animation.
- **Projectiles: 1 static frame, rotated by code.** Only auras/novas/puddles get small
  loops (2–4 frames).

## 2.2 Palette (all assets use ONLY these 16 colors)
| # | Name | Hex | Use |
|---|------|-----|-----|
| 1 | Ink | `#1b1530` | outlines, shadows, eyes |
| 2 | Grape | `#45356e` | dark accents, lab tech |
| 3 | Steel | `#6d6a8e` | gadgets, metal |
| 4 | Cloud | `#cfd4e8` | light metal, highlights |
| 5 | White | `#f7f4ef` | Danny's coat, teeth, flashes |
| 6 | Ketchup | `#d93a3a` | tomatoes, ketchup, danger |
| 7 | Cherry | `#ff6b6b` | HP bar, boss accents |
| 8 | Mustard | `#f2c33c` | fries, mustard, cheese lights |
| 9 | Cheese | `#ff9d3b` | UI accent, crackers, crusts |
| 10 | Crust | `#b5793f` | bread, pretzel, cookie |
| 11 | Cocoa | `#6e4a2f` | chocolate, dark crust |
| 12 | Mint | `#7dd97b` | produce, healthy food |
| 13 | Lime | `#a8e04a` | XP gems, "go" signals |
| 14 | Cyan | `#35d0ff` | Resizer energy, Danny's goggles, friendly shots |
| 15 | Berry | `#b45ce8` | glitch/lab corruption (District 5 identity) |
| 16 | Pink | `#ff9ecb` | frosting, desserts, ENEMY projectiles |

**Readability rules baked into the palette:** player shots are always Cyan; enemy shots are
always Pink; XP is always Lime; danger telegraphs are always Ketchup/Cherry. Never violate
these four.

## 2.3 Canvas sizes & naming
Grid sizes (px): small enemy **24**, medium **32**, heavy/gadget **48**, player **32**,
boss **128** (Mother Batch **160**), tiles **32**, props **32–96**, projectiles **8–16**,
icons **24**, portraits **96**, gems **12/14/16**.

Naming: `category_district_name_anim_frame.png`, e.g. `enemy_d1_fry_walk_1.png`,
`char_danny_walk_3.png`, `boss_d4_vending_walk_2.png`, `proj_resizer.png`,
`tile_d3_grass_a.png`, `icon_weapon_freezeray.png`. All transparent-background PNG.

## 2.4 PixelLab prompt template
Every prompt = the subject line + this **style suffix**, verbatim:
> "…, flat top-down pixel art, chunky simple shapes, thick dark outline, 16-color limited
> palette, goofy cute slightly menacing cartoon face, kid-friendly, transparent background"

For walk frame B: "same character, second walk frame, legs/body in alternate pose, small
squash-and-stretch wobble". Generate A and B together where the tool allows.

## 2.5 Full asset manifest (walk-only budget)
| Category | Items | Frames each | Frames total |
|---|---|---|---|
| Player characters (6) walk | 6 | 4 | 24 |
| Character portraits | 6 | 1 | 6 |
| Captured poses (rescued 5) | 5 | 1 | 5 |
| Enemies (27: 25 district + Elite aura overlay + Golden Snack) | 27 | 2 | 54 |
| Enemy "normal food" pop stills | 25 | 1 | 25 |
| Bosses (5) + Mother Batch P2 | 6 | 4 | 24 |
| Projectiles (player 8 + enemy 6) | 14 | 1 | 14 |
| FX loops (pop 4, hit spark 3, level-up 4, nova 3, aura 2, cyclone 2, puddle 2, freeze 1, muzzle 2) | 9 | — | 23 |
| Weapon icons 10 + passive icons 8 (+4 evo STRETCH) | 18–22 | 1 | 18–22 |
| Pickups (gems 3, health, magnet, bomb, chest 4-frame, cage 3-frame) | 9 | — | 14 |
| Tiles (5 districts × [1 base + 2 variants + 2 decals]) | 25 | 1 | 25 |
| Props (5 × 8) + flood decals 6 + shared rubble 4 | 50 | 1 | 50 |
| UI (bars, cards, buttons, map, banners, logo…) | ~28 | 1 | ~28 |
| **TOTAL** | | | **≈ 310** |

Order of production = milestone order: Danny + D1 set first (see §12 M0/M5).

## 2.6 Maps are cheap by design
Each district is an **endless plane** (VS-style): one 32px base tile + 2 variants tiled
with a deterministic hash, 2 small decal tiles sprinkled, and 8 props scattered per
512px chunk (density per district). **Props are non-colliding decor in v1** — exactly like
Vampire Survivors, which has no obstacles. This is a feature: zero collision cost, zero
pathfinding, pure swarm math. Food-flood decals increase in density: D1 light → D5 buried.

---

# §3 — PERFORMANCE BIBLE (non-negotiable engineering rules)

Target: **≥ 55 fps with 300 live enemies on a mid-range phone** (e.g., a 3-year-old
Android). Verified by the stress harness in M2 *before* gameplay is built.

1. **Pool everything.** Enemies, bullets, enemy bullets, gems, FX. Allocate at boot,
   recycle forever. Zero `new`/destroy during a run. No per-frame allocations in hot loops
   (no array literals, closures, or string concat inside update).
2. **No physics bodies on the swarm.** Do NOT give enemies/bullets Arcade Physics bodies.
   Plain pooled sprites moved manually by delta time. Only the player may have a body
   (or move it manually too).
3. **Spatial hash grid** (cell = 72 px) rebuilt each frame from live enemies. Bullets test
   only their 3×3 neighborhood. Player contact tests only its 3×3 neighborhood. Never
   all-vs-all.
4. **Hard caps:** enemies 300 (mobile) / 400 (desktop); player bullets 400; enemy bullets
   240; gems 600; FX 260. At the enemy cap, recycle the farthest off-screen enemy as the
   new spawn. At the gem cap, **merge**: combine the farthest gems into one higher-value
   gem preserving total XP (VS does this).
5. **One texture atlas** (two max). All sprites packed so the GPU batches in one draw
   pass. Never load loose per-enemy images.
6. **Delta-time movement everywhere**, `dt` clamped to 50 ms. Game reads identically at
   30 and 60 fps.
7. **Render discipline:** `pixelArt: true`, `roundPixels: true`, cap
   `devicePixelRatio` at 2. Cull: any pooled sprite off-camera (+40px margin) gets
   `visible = false`.
8. **Cheap effects only.** Damage = white tint flash. Pop = one pooled 4-frame puff. No
   particle emitters with hundreds of particles; no floating damage numbers in v1. Auras
   tick 4×/s, not per frame.
9. **Audio pooling**, max ~8 concurrent SFX, pop sound rate-limited to ~10/s.
10. **The two inherited bug-fixes (from the reference-game teardown):**
    - `damageBoss(amount)` is the ONLY way boss HP changes; when `hp <= 0` it alone calls
      `bossDefeated()`. Win can never miss, regardless of damage source.
    - Invincibility is a timestamp: `player.invUntil = now + 0.6`. Checked as
      `now > invUntil`. Never a boolean a broken timer can leave stuck.

An `fps · foes` debug readout stays in the corner through all of development.

---

# §4 — CONTROLS & GAME FEEL

- **Move:** WASD/arrows (desktop) + floating virtual joystick (touch: appears where the
  thumb lands; dead zone 8 px; max radius 62 px; normalized).
- **Fire:** ALWAYS automatic, at the nearest valid target. No aim input in v1 (this is
  the VS model and the #1 smoothness win; one-handed on phone). Mouse-aim mode = STRETCH
  settings toggle.
- **Feel rules:** instant acceleration/stop (no inertia). Sprite flips on X only. Camera
  follows with lerp 0.12. Player i-frame flash 10 Hz. Tiny 2-frame hit-stop when a boss is
  struck (STRETCH). Screen shake ≤ 3 px, 120 ms, only on player-hurt and boss-slam —
  with a settings toggle. Optional haptic tick on level-up (mobile).
- **Latency budget:** input → movement visible next frame. Nothing may sit between the
  joystick vector and the position update.

---

# §5 — CORE SYSTEMS & NUMBERS

## 5.1 The run
Drop in → survive to **10:00** → boss spawns (ambient spawn interval ×1.8 while boss
lives) → kill boss → cage cracks, teammate rescued, district cleared → results screen.
Death at any point → results screen, keep nothing but meta unlocks.

## 5.2 Player baseline
100 HP · speed 190 px/s · pickup radius 72 px · i-frames 0.6 s ·
contact damage taken = `max(1, enemyDmg − armor)`.

## 5.3 XP & leveling
Gems: **Lime = 1 XP (small), Cyan-blue = 5 (medium), Gold = 20 (rare/elite)**.
Level cost: `next = round(prev × 1.35 + 3)`, starting 5:
`5, 10, 17, 26, 38, 54, 76, 106, 146, 200, 273, 372…`
On level-up: pause world, show **3 cards** drawn from: upgrades to owned items, plus new
items while slots are open (**4 weapon slots, 4 passive slots**). If everything is maxed:
offer "Snack Break" (heal 25) / "Spare Parts" (+20 currency, STRETCH).

## 5.4 Damage model
`damage = base × (1 + BiggerBattery%)`; cooldowns × `(1 − CoolingFan%)`;
area radii × `(1 + AreaLens%)`; projectile count + ExtraCapacitor; projectile speed ×
`(1 + ServoMotor%)`. No crits in v1. Per-enemy hit cooldown 0.5 s for persistent hitboxes
(cyclone, aura, puddles) so they tick, not shred.

## 5.5 In-run enemy time-scaling
Enemy HP × `(1 + 0.06 × minutesElapsed)`; damage × `(1 + 0.02 × minutesElapsed)`.
(Stats in §8 are the 0:00 values for that district.)

## 5.6 Pickups (enemy drop rolls, after the guaranteed gem)
Health snack (heal 30): 1.2% · Magnet (vacuum all gems): 0.4% · Screen-Clear Bomb (pop all
non-boss on screen): 0.15% · Chest (from Elites only, always): grants 1 free upgrade.

---

# §6 — CHARACTERS (6)

| # | Name | Unlock | HP | Speed | Starting weapon | Perk |
|---|------|--------|----|-------|-----------------|------|
| 1 | **Danny** | start | 100 | 190 | Resizer Beam | +10% XP gain |
| 2 | **The Cook** | rescue, District 1 | 120 | 180 | Whisk Cyclone | +15% area |
| 3 | **The Tech** (walking-PC buddy) | rescue, D2 | 90 | 190 | Drone Swarm | −10% cooldowns |
| 4 | **The Muscle** | rescue, D3 | 140 | 170 | Fridge Slam | +1 armor |
| 5 | **The Scout** | rescue, D4 | 80 | 215 | Salt Spray | +15% projectile speed |
| 6 | **The Medic** | rescue, D5 | 100 | 185 | Soothe Aura | regen 1 HP / 2 s |

Art per character: 4-frame walk + 96px portrait + (for 2–6) a 1-frame captured-in-goo pose.
Names are placeholders for Mark's real VBS roster — grep-and-replace ready.

---

# §7 — WEAPONS & PASSIVES (every level spelled out)

All weapons auto-fire on their own cooldown. "Amount" = simultaneous projectiles.

**1. Resizer Beam** — shot at nearest. Base: CD 0.55 s · dmg 12 · amount 1 · speed 520.
L2 dmg 18 · L3 amount 2 · L4 CD 0.45 · L5 dmg 24, pierce 1.
STRETCH Evo (**Mega Resizer**, needs L5 + Extra Capacitor maxed): amount 4, pierce 3, dmg 30.

**2. Portion Blaster** — 40° cone burst, short range (life 0.35 s). Base: CD 1.4 · 3
pellets · 8 dmg each. L2 5 pellets · L3 dmg 12 · L4 CD 1.1 · L5 7 pellets + 60 knockback.

**3. Whisk Cyclone** — whisks orbit at r 70, always on, 180°/s, 10 dmg per hit (0.5 s
per-enemy cooldown). L2 2 whisks · L3 dmg 16, r 80 · L4 3 whisks · L5 dmg 22, 220°/s.
STRETCH Evo (**Cyclone Storm**, + Area Lens): 4 whisks, r 110, dmg 28.

**4. Drone Swarm** — drone hovers by player, fires a bolt (dmg 10, speed 460) at a random
enemy within 420 px every 0.9 s. L2 2 drones · L3 dmg 15 · L4 fire every 0.7 s · L5 3
drones, dmg 18. STRETCH Evo (**Drone Legion**, + Cooling Fan): 5 drones, 0.5 s.

**5. Fridge Slam** — shockwave ring around player. Base: CD 3.2 · radius 120 · dmg 20 ·
knockback 140. L2 r 150 · L3 dmg 30 · L4 CD 2.6 · L5 r 190, dmg 40, 0.4 s stun.

**6. Salt Spray** — piercing granules in the movement direction (nearest-enemy direction
when standing still). Base: CD 1.0 · 3 granules · dmg 9 · pierce 2 · speed 600.
L2 dmg 13 · L3 5 granules · L4 pierce 4 · L5 CD 0.75, dmg 17.

**7. Soothe Aura** — calming field. Base: r 90 · 3 dmg per tick, 4 ticks/s · slows 15%.
L2 r 110 · L3 5 dmg · L4 slow 30% · L5 r 140, 7 dmg.

**8. Microwave Pulse** — nova expanding to full radius over 0.8 s, hits each enemy once.
Base: CD 5 · radius 260 · dmg 26. L2 dmg 36 · L3 CD 4 · L4 radius 320 · L5 two novas
back-to-back.

**9. Freeze Ray** — shot at nearest; chills. Base: CD 1.2 · dmg 6 · slow 40% for 1.5 s.
L2 slow 55% · L3 dmg 12, CD 1.0 · L4 chains to 1 extra target · L5 freezes solid 0.6 s.
STRETCH Evo (**Blizzard Ray**, + Servo Motor): chains 3, freeze 1 s.

**10. Ketchup Sprayer** — lobs a splat at the densest nearby cluster. Base: CD 2.8 ·
puddle r 70 · lasts 3 s · 6 dmg per 0.5 s tick. L2 r 90 · L3 9 dmg · L4 two lobs ·
L5 lasts 4 s + 20% slow inside.

**Passives (5 levels each unless noted):**
Bigger Battery +8% damage/lv · Cooling Fan −6% cooldown/lv · Extra Capacitor +1 amount/lv
(2 levels only) · Area Lens +10% area/lv · Servo Motor +12% projectile speed/lv ·
Lab Coat +1 armor/lv · Running Shoes +6% move speed/lv · Magnet Coil +20% pickup radius/lv.

---

# §8 — THE DISTRICTS (full level design)

Format per district: identity & environment set → enemy stat blocks (values at 0:00, see
§5.5 scaling) → minute-by-minute spawn director → boss → rescue.
Spawn director mechanics: ambient spawns just off-screen in a ring; interval lerps within
each phase; **Ring event** = N enemies in a circle at 420 px closing in; **Elite** = one
heavy at ×6 HP, ×1.5 size, gold aura overlay, always drops a Chest; **Golden Snack** =
flees at 260 px/s for 6 s, 40 HP, drops 3 gold gems.

---

## DISTRICT 1 — CITY CENTER  ·  "First Outbreak"  ·  street food
**Environment:** cracked asphalt + sidewalk tiles (Ink/Steel/Cloud); props: lamppost,
bench, hydrant, trash can, newspaper box, crate, parked car (64×96), rubble; light
food-flood decals (scattered fries/wrappers). Mood: bright chaos, day.

**Enemies**
| Enemy | Role | Size | HP | Spd | Dmg | XP | Behavior |
|---|---|---|---|---|---|---|---|
| Fry Trooper | swarm | 24 | 10 | 80 | 6 | 1 | spawns in squads of 3–5 |
| Popcorn Popper | swarm | 24 | 8 | (hops) | 5 | 1 | hop: 0.4 s burst @140, 0.3 s pause |
| Hot Dog Dasher | bruiser | 32 | 30 | 70 | 10 | 2 | every 4 s: 0.5 s telegraph → dash 240 for 0.6 s |
| Pretzel Brute | heavy | 48 | 90 | 42 | 14 | 3 | knockback-resistant |
| Toast Turret *(gadget)* | ranged | 32 | 24 | 0 | — | 2 | spawns at mid-range; lobs toast every 2.5 s (8 dmg, arc, speed 200) |

**Spawn timeline**
| Time | Interval (s) | Roster (weights) | Events |
|---|---|---|---|
| 0:00–1:30 | 1.3 → 1.0 | Fry 100% | — |
| 1:30–3:00 | 1.0 → 0.8 | Fry 70 / Popcorn 30 | 2:00 Ring: 20 Fries |
| 3:00–5:00 | 0.8 → 0.6 | Fry 50 / Pop 25 / Dasher 25 | 4:00 Elite Pretzel |
| 5:00–7:00 | 0.6 → 0.45 | Fry 35 / Pop 20 / Dasher 30 / Brute 10 / Toast 5 | 6:00 Golden Snack |
| 7:00–9:00 | 0.45 → 0.32 | Fry 30 / Pop 15 / Dasher 30 / Brute 15 / Toast 10 | 8:00 Ring: 26 mixed; 8:30 Elite |
| 9:00–10:00 | 0.32 → 0.25 | all, Brute 20 | frenzy |
| 10:00 | ambient ×1.8 | — | **BOSS** |

**BOSS — THE BIG FRANK** (giant hot dog) · 128 px · HP 3,000 · spd 100 · contact 20
- **Charge** every 6 s: Cherry tint 0.7 s → dash at 320 for 1.1 s.
- **Condiment Splatter** every 9 s: lobs 5 blobs → Ketchup puddles r 60, 3 s, 8 dmg/s.
- Enrage < 25% HP: Charge every 4 s.
**Rescue:** The Cook (cage cracks at boss death; walk over to free — unlock fanfare).

---

## DISTRICT 2 — MARKET & DOCKS  ·  "Fresh Off the Boat"  ·  fruit & produce
**Environment:** dock planks + market cobbles (Crust/Cocoa/Steel); props: market stall
(96), produce crates, barrels, dock post, net, awning, hanging scale, spilled-fruit decals.
Moderate flood decals. Mood: cluttered, salty air.

**Enemies**
| Enemy | Role | Size | HP | Spd | Dmg | XP | Behavior |
|---|---|---|---|---|---|---|---|
| Angry Apple | swarm | 24 | 16 | 85 | 7 | 1 | straight chaser |
| Banana Bunch | bruiser | 40 | 48 | 60 | 10 | 2 | on death splits into 3 Banana Singles (16 px, HP 6, spd 110, dmg 4, XP 1) |
| Tomato Lobber | ranged | 32 | 28 | 45 | — | 2 | keeps 300 px distance; lob every 2.2 s (8 dmg) |
| Melon Roller | heavy | 48 | 130 | 38 | 16 | 3 | every 5 s: roll-charge 260 for 1 s |
| Peeler Prowler *(gadget)* | fast flex | 28 | 22 | 130 | 9 | 2 | zig-zag approach (re-aims every 0.5 s ±35°) |

**Spawn timeline**
| Time | Interval | Roster | Events |
|---|---|---|---|
| 0:00–1:30 | 1.2 → 0.95 | Apple 100 | — |
| 1:30–3:30 | 0.95 → 0.7 | Apple 60 / Banana 25 / Peeler 15 | 2:30 Ring: 22 Apples |
| 3:30–5:30 | 0.7 → 0.55 | Apple 40 / Banana 25 / Lobber 20 / Peeler 15 | 4:00 Elite Melon; 5:00 Golden |
| 5:30–8:00 | 0.55 → 0.4 | Apple 30 / Banana 20 / Lobber 20 / Melon 15 / Peeler 15 | 6:30 Ring: 24 mixed |
| 8:00–10:00 | 0.4 → 0.28 | all, Melon 20 | 8:30 Elite; 9:30 Golden |
| 10:00 | ×1.8 | — | **BOSS** |

**BOSS — SIR MELON** (watermelon kraken) · 128 px · HP 5,200 · spd 85 · contact 22
- **Vine Sweep** every 7 s: 0.8 s telegraph → 140 px melee arc, 18 dmg.
- **Seed Spit** every 5 s: 7-shot fan (10 dmg, speed 220). Phase < 50%: 9 shots.
- **Roll** every 10 s: charge at 340 for 1.4 s.
- Phase < 50%: also summons 4 Angry Apples every 8 s.
**Rescue:** The Tech.

---

## DISTRICT 3 — SUBURBS  ·  "Dessert Storm"  ·  sweets & comfort food
**Environment:** lawn grass + pavement (Mint/Steel/Cloud); props: picket fence, mailbox,
garden gnome, hedge, lawn chair, kiddie pool, BBQ grill, tricycle; frosting-drip flood
decals (Pink). Mood: pastel suburbia gone sticky.

**Enemies**
| Enemy | Role | Size | HP | Spd | Dmg | XP | Behavior |
|---|---|---|---|---|---|---|---|
| Sugar-Rush Donut | swarm | 24 | 20 | 115 | 8 | 1 | fastest swarm in the game |
| Cupcake Creeper | bruiser | 32 | 70 | 55 | 12 | 2 | steady chaser |
| Ice Cream Sludge | heavy | 48 | 160 | 34 | 14 | 3 | leaves slow-trail blobs (player −20% spd, 1 s) |
| Cookie Golemite | heavy | 48 | 190 | 40 | 18 | 3 | on death splits into 2 Chip Bits (16 px, HP 8, spd 100, dmg 5, XP 1) |
| Blender Bandit *(gadget)* | special | 32 | 60 | 50 | 12 | 2 | every 4 s: 1 s spin-up (Cherry tint) → whirl-dash 200 for 0.8 s |

**Spawn timeline**
| Time | Interval | Roster | Events |
|---|---|---|---|
| 0:00–1:30 | 1.1 → 0.85 | Donut 100 | — |
| 1:30–3:30 | 0.85 → 0.65 | Donut 65 / Cupcake 35 | 2:30 Ring: 24 Donuts |
| 3:30–6:00 | 0.65 → 0.5 | Donut 45 / Cupcake 25 / Sludge 15 / Blender 15 | 4:00 Elite Golemite; 5:30 Golden |
| 6:00–8:30 | 0.5 → 0.36 | Donut 30 / Cupcake 20 / Sludge 18 / Golemite 17 / Blender 15 | 7:00 Ring: 28 mixed |
| 8:30–10:00 | 0.36 → 0.26 | all | 9:00 Elite; 9:30 Golden |
| 10:00 | ×1.8 | — | **BOSS** |

**BOSS — LAYER CAKE COLOSSUS** · 128 px · HP 8,000 · spd 70 · contact 24
- **Tier Slam** every 6 s: shadow telegraph 0.9 s → leaps to player, landing shockwave
  r 150, 22 dmg.
- **Frosting Puddles** every 8 s: 4 Pink puddles r 70, 4 s, slow 35% + 6 dmg/s.
- **Candle Volley** every 7 s: 3 gently-homing fireballs (speed 160, 12 dmg, 3 s life).
- **Phases:** at 66% and 33% HP the cake loses a tier: +15% speed, Slam cooldown −1 s each.
**Rescue:** The Muscle.

---

## DISTRICT 4 — FOOD FACTORY  ·  "The Assembly Swarm"  ·  junk food
**Environment:** metal floor + grates (Steel/Ink/Cloud); props: conveyor belt (96),
mixing vat, pipes, control panel, forklift, pallet, warning sign, steam-vent decal;
heavy flood decals (candy/wrappers). Mood: industrial neon hazard.

**Enemies**
| Enemy | Role | Size | HP | Spd | Dmg | XP | Behavior |
|---|---|---|---|---|---|---|---|
| Candy Zipper | swarm | 24 | 26 | 125 | 9 | 1 | erratic: re-aims with ±20° jitter |
| Chip-Bag Swarmer | bruiser | 32 | 95 | 58 | 13 | 2 | drops 2 Chip Bits on death |
| Soda-Can Spitter | ranged | 32 | 55 | 48 | — | 2 | keep-away 320 px; 3-shot spray every 2.6 s (9 dmg, speed 240) |
| Burger Bruiser | heavy | 48 | 260 | 44 | 20 | 3 | knockback-resistant |
| Microwave Menace *(gadget)* | heavy-special | 40 | 120 | 30 | 10 | 3 | every 5 s emits expanding ring to r 140 (10 dmg, once per enemy… er, per player) |

**Spawn timeline**
| Time | Interval | Roster | Events |
|---|---|---|---|
| 0:00–1:30 | 1.0 → 0.8 | Zipper 100 | — |
| 1:30–3:30 | 0.8 → 0.6 | Zipper 60 / ChipBag 40 | 2:30 Ring: 26 Zippers |
| 3:30–6:00 | 0.6 → 0.45 | Zipper 40 / ChipBag 25 / Spitter 20 / Menace 15 | 4:00 Elite Burger; 5:30 Golden |
| 6:00–8:30 | 0.45 → 0.33 | Zipper 30 / ChipBag 20 / Spitter 20 / Burger 15 / Menace 15 | 7:00 Ring: 30 mixed |
| 8:30–10:00 | 0.33 → 0.24 | all | 9:00 Elite; 9:30 Golden |
| 10:00 | ×1.8 | — | **BOSS** |

**BOSS — VENDING BEHEMOTH** · 144 px · HP 12,000 · spd 60 · contact 26
- **Can Barrage** every 5 s: 12-shot radial ring (12 dmg, speed 180). Enrage < 30%: 18.
- **Soda Flood** every 11 s: 0.9 s lane telegraph → horizontal wave (band 120 px tall)
  sweeps the screen, 18 dmg; dodge vertically.
- **Dispense** every 9 s: ejects 3 Candy Zippers + 1 Chip-Bag.
**Rescue:** The Scout.

---

## DISTRICT 5 — CENTRAL LAB  ·  "The Source"  ·  mutated / glitch food
**Environment:** lab tile with glowing Berry seams; props: server rack, containment tube,
cable bundles, monitor bank, console, warning strobe, wreckage, the dormant Resizer
machine (128, set piece); maximum flood decals, Berry-tinted. Mood: emergency lighting,
the place it all began.

**Enemies**
| Enemy | Role | Size | HP | Spd | Dmg | XP | Behavior |
|---|---|---|---|---|---|---|---|
| Glitch Nugget | swarm | 24 | 34 | 100 | 10 | 1 | every 3 s: 0.3 s blink telegraph → teleports 120 px toward player |
| Overcooked Blob | bruiser | 32 | 130 | 55 | 15 | 2 | leaves scorch puddle on death (2 s, 8 dmg/s) |
| Frankenfood Hybrid | heavy | 48 | 340 | 46 | 22 | 3 | knockback-resistant |
| Batch Spawnling | swarm | 20 | 12 | 120 | 6 | 1 | boss-summoned; ambient after 7:00 |
| Rogue Fridge *(gadget)* | heavy-ranged | 48 | 220 | 35 | 16 | 3 | every 4 s fires 2 ice shards (11 dmg, slow 25% 1 s) |

**Spawn timeline**
| Time | Interval | Roster | Events |
|---|---|---|---|
| 0:00–1:30 | 0.95 → 0.75 | Nugget 100 | — |
| 1:30–3:30 | 0.75 → 0.55 | Nugget 60 / Blob 40 | 2:30 Ring: 26 Nuggets |
| 3:30–6:00 | 0.55 → 0.42 | Nugget 40 / Blob 25 / Fridge 15 / Hybrid 20 | 4:00 Elite Hybrid; 5:30 Golden |
| 6:00–8:30 | 0.42 → 0.3 | Nugget 30 / Blob 20 / Hybrid 20 / Fridge 15 / Spawnling 15 | 7:00 Ring: 32 mixed |
| 8:30–10:00 | 0.3 → 0.22 | all | 9:00 Elite ×2 |
| 10:00 | ×1.8 | — | **FINAL BOSS** |

**FINAL BOSS — THE MOTHER BATCH** (the corrupted Resizer machine fused with a food
amalgam) · 160 px · HP 20,000 total · two phases:
- **Phase 1 — The Machine** (20,000 → 8,000): drifts slowly (40), stays center-weighted.
  **Beam Sweep** every 8 s: 1 s line telegraph → beam rotates a 90° arc over 2 s
  (20 dmg per 0.5 s while touching). **Spawn Batch** every 6 s: 4 Spawnlings.
  **Shot Ring** every 7 s: 16 shots (12 dmg, speed 160).
- **Phase 2 — Meltdown** (≤ 8,000): the core tears free (4-frame P2 sprite), chases at
  90, contact 30. **Double Ring** every 5 s: 2 offset 20-shot rings. **Overload Novas**
  every 9 s: 3 expanding rings. Still spawns 3 Spawnlings / 6 s.
- Defeat → `bossDefeated()` → the flood visibly shrinks (flood decals fade), **The Medic**
  rescued, city-saved sequence, credits.

## §8.7 Shared specials (all districts)
**Elite** (event-spawned): district heavy at ×6 HP, ×1.5 scale, gold-aura overlay frame,
immune to freeze-solid, always drops a Chest. **Golden Snack**: 40 HP, flees at 260 for
6 s then despawns; drops 3 gold gems (60 XP).

---

# §9 — META PROGRESSION

**City Map screen:** 5 nodes on a stylized Adventure City map, path left→right ending at
the Lab. States: locked / unlocked / cleared (+ current). Clearing district N unlocks N+1.
**Character select:** portraits; un-rescued slots show the "???" goo-silhouette with
"Trapped in <district>". **Save** (localStorage — fine for Claude Code local/hosted
builds): `sdd_save_v1 = { cleared:[], unlockedChars:[], settings:{shake,autoAim,sfx,music},
currency, labUpgrades:{} }`. Corrupt/missing save → fresh defaults, never a crash.
**Lab Upgrades (STRETCH, v1.1):** spend run-currency on permanent +HP / +dmg / +magnet /
1 revive.

# §10 — UI INVENTORY
Title (logo, Start, Settings) · Character Select · City Map · **In-run HUD:** HP bar,
XP bar, timer (MM:SS), level badge, kill counter, owned-item icon strip, boss HP bar
(top, full width, name label), `fps · foes` debug (dev builds) · Level-Up: 3 cards
(icon, name, "NEW"/"LV n", one-line effect) · Pause (resume/settings/quit) · Results
(win: "District Cleared!" + rescue moment / lose: "Overwhelmed!") with time, pops, level
· Settings (SFX, music, screen shake, haptics). Buttons: 3-state. Font: chunky pixel
display for headers, clean sans for body.

# §11 — AUDIO (lightweight)
SFX set (~12): pop (3 pitch variants), player-hit, shoot (soft, rate-limited), gem ×2,
level-up, chest, boss-roar, boss-death, UI tap, heal. Music: one loop per district (5) +
title + boss layer (STRETCH: boss = same loop + intensity layer). All pooled, ~8 voices.

---

# §12 — MILESTONE PLAN (build in this order; each has acceptance criteria)

**M0 — Asset pipeline & placeholders.** Palette constants file; atlas packing script;
a placeholder generator that draws every §2.5 asset as colored shapes with faces at the
correct sizes/names so the game is NEVER blocked on art. PixelLab art replaces
placeholders file-by-file with zero code changes. ✅ Atlas builds; game boots with 100%
placeholders.

**M1 — Feel harness.** Danny walks (4-frame, flip) with joystick + WASD, camera lerp,
endless D1 ground rendering. ✅ 60 fps; input-to-motion next frame; feels crisp on a real
phone.

**M2 — Perf harness (before any gameplay).** 300 pooled chasers + spatial hash + culling
+ the debug readout; a "stress" debug key spawns to cap. ✅ ≥ 55 fps at 300 foes on a
mid-range phone; zero allocations in the update loop (verified via DevTools).

**M3 — Combat core.** Resizer Beam auto-fire, pooled bullets, hit-flash, pop VFX +
normal-food still, gems + magnet + merge, HP, timestamp i-frames, death → results.
✅ The dopamine loop is felt; fps holds.

**M4 — Level-ups.** XP curve, pause, 3-card picks, slots; Portion Blaster + Whisk
Cyclone + 3 passives online. ✅ Choices change the run within seconds.

**M5 — District 1 vertical slice.** Full D1 roster + §8.1 timeline + events; Big Frank
with both attacks + enrage; single-path `damageBoss`; cage rescue of The Cook; win/lose
screens. ✅ A stranger can play City Center start-to-finish and it holds 55+ fps.

**M6 — Meta shell.** Title, character select (Danny + Cook), city map, save/load,
settings. ✅ Unlocks persist across reload.

**M7 — Full arsenal.** All 10 weapons, 8 passives, Elites + chests, Golden Snack,
pickups. (Evolutions STRETCH.) ✅ Any 4+4 build is playable.

**M8 — Districts 2–5.** Environments, rosters, timelines, bosses, rescues per §8. Ship
one district at a time, playtesting each. ✅ Full campaign clearable.

**M9 — Polish.** Audio, screen-shake toggle, haptics, results juice, difficulty tuning
pass, real-device perf pass, remove debug HUD from release builds.

**Process:** keep `HANDOVER.md` current after every milestone (done / next / knobs
changed). One system per file. `CONFIG.js` holds every number in this document as a named
constant — tuning never means hunting through logic.

**Suggested structure:**
`/src: main, config, /scenes(Boot,Title,Select,Map,Game,LevelUp,Results,Pause),
/systems(Pool,SpatialHash,SpawnDirector,Weapons,Passives,Pickups,Save,Audio),
/entities(Player,Enemy,Boss,Projectile,Gem,FX), /data(enemies.js, weapons.js,
districts.js — the §7/§8 tables as data), /assets(atlas, audio)`.

---

# §13 — TUNING KNOB INDEX (the numbers most likely to move in playtests)
Player speed 190 · i-frames 0.6 · XP curve (×1.35 + 3) · boss timer 10:00 · caps
(300/400/240/600) · spawn intervals per §8 · boss HP (3k / 5.2k / 8k / 12k / 20k) ·
time-scaling (0.06 HP, 0.02 dmg per min) · drop rates (§5.6) · gem merge threshold 85%.
Every one lives in `CONFIG.js`.

*End of compendium. If a detail is missing, decide in the spirit of §1's pillars —
smoothness first — and log the decision in HANDOVER.md.*
