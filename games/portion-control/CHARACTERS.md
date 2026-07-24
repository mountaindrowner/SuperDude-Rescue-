# PORTION CONTROL — Playable Character Roster (design)

> The six Super Dude Danny heroes as unlockable playable characters.
> Source of truth for identity: the Element Lab trading cards
> (`games/element-lab/assets/cards/`). Each hero gets THREE candidate
> kits (A/B/C) — Mark picks one per hero (or mixes pieces). A kit =
> **signature starting weapon** + **special** (unique mechanic) +
> **passive** (always-on stat identity). Rules that keep the roster
> honest:
>
> - Every kit must be viable solo for a full District run.
> - No two heroes share a weapon archetype (VS law: the character IS
>   the starting weapon).
> - Passives are simple enough for a 7-year-old to feel ("Josh is
>   tougher", "Nayah finds more stuff").
> - All numbers here are STARTING tuning — real values live in
>   config.js once a kit is implemented.

Unlock flow (proposal): Danny is the starter. Each District's boss
rescue unlocks that district's hero as playable — District 1 rescues
one of the five (Mark picks who), and the roster fills out across
Districts 2–5. Gold can later buy early unlocks (meta shop, M6).

---

## DANNY — "Super Dude Danny" (starter, all-rounder)
Card identity: scientist-adventurer, FAITH OVER FEAR, time device.

**Kit A — Lab Whisk (current build)**
- Weapon: Whirling Whisk — boomerang whisk toward nearest enemy,
  pierces, returns. Balanced damage/rate.
- Special: Eureka! — every level-up emits a free 360° knockback pulse.
- Passive: Quick Study — +10% XP from all gems.

**Kit B — Faith Over Fear**
- Weapon: Fear-Not Pulse — a steady heartbeat AoE ring around Danny
  (short range, constant). Crowds melt if you stand your ground.
- Special: Second Wind — first death instead revives at 50% HP with a
  screen-clearing burst (once per run).
- Passive: Unshaken — immune to slow/knockback effects.

**Kit C — Time Spark**
- Weapon: Chrono Zap — bolt that chains between up to 3 close enemies.
- Special: Rewind — every 25s, damage taken in the last 3s is refunded.
- Passive: Overclock — +8% weapon cooldown speed.

---

## VICTORIA — "Time Tech" (the fixer; burst + utility)
Card identity: jumpsuit mechanic, tool belt, wrench, keeps the time
machine running. Fantasy: gadgets fight FOR you.

**Kit A — Wrench Toss**
- Weapon: Heavy Wrench — slow, huge boomerang wrench; high damage,
  big knockback, pierces everything on the way out AND back.
- Special: Percussive Maintenance — every 8th throw is a giant wrench
  (×2 size/damage).
- Passive: Field Repairs — med-kits and health drops heal +50%.

**Kit B — Turret Tinker**
- Weapon: Pocket Sentry — deploys a mini turret where she stands
  (max 2 alive) that pelts the nearest enemy; redeploys on cooldown.
- Special: Overdrive — picking up any item makes turrets fire ×2
  speed for 4s.
- Passive: Well-Oiled — all weapon cooldowns -10%.

**Kit C — Time Bubble**
- Weapon: Chrono Field — drops a slow-bubble on the densest nearby
  crowd; enemies inside move 40% slower and take DoT.
- Special: Borrowed Time — when hit, 25% chance the hit rewinds
  (damage undone, brief sparkle).
- Passive: Ahead of Schedule — +10% move speed.

---

## NAYAH — "Nature Expert" (area denial + economy)
Card identity: leafy bun, Creation Caretaker tee, magnifying glass,
"creation is full of clues". Fantasy: the garden fights with you.

**Kit A — Seed Slinger**
- Weapon: Thorn Seeds — lobs seeds that bloom into thorn patches
  (area DoT that lingers ~4s). Zone control queen.
- Special: Full Bloom — every 30s all live patches burst for burst
  damage + drop 1 XP gem each.
- Passive: Sharp Eyes — XP gems worth +15% (she finds the clues).

**Kit B — Vine Whip**
- Weapon: Vine Lash — wide melee arc in the facing direction, fast,
  satisfying crowd-swatter with mild knockback.
- Special: Tangle — every 5th lash roots hit enemies for 1.5s.
- Passive: Long Reach — pickup radius +30%.

**Kit C — Butterfly Swarm**
- Weapon: Guardian Butterflies — 3 butterflies orbit her, damaging on
  contact (orbital archetype). Levels add butterflies + radius.
- Special: Pollinate — butterflies occasionally drop a healing petal
  (+5 HP) where they fly.
- Passive: Caretaker — health drops appear 50% more often.

---

## KEVIN — "Captain" (leadership; buffs + big calls)
Card identity: navy rescue jacket, gold compass-wings badge, mission
control. Fantasy: command the battlefield.

**Kit A — Air Support**
- Weapon: Rescue Strike — marks the densest crowd, 1s telegraph, then
  a chopper strafe hits the line for heavy AoE.
- Special: Danger Close — strikes leave a 3s smoke zone that slows.
- Passive: Chain of Command — ALL weapons +8% damage (leader aura).

**Kit B — Compass Dash**
- Weapon: Spearhead — Kevin periodically dash-charges through the
  nearest crowd, damaging everything he passes (the character is the
  bullet). Auto-triggered, i-frames during the dash.
- Special: Follow Me! — enemies hit by the dash are knocked into
  each other (collision damage).
- Passive: Double Time — +12% move speed.

**Kit C — Rally Shield**
- Weapon: Bulwark — a glowing shield arc floats in front of him,
  blocking enemy contact from that side and damaging on touch.
- Special: Shield Slam — every 6s the shield thrusts out in a
  knockback wave.
- Passive: Hold the Line — -15% damage taken.

---

## CARLOS — "Galaxy Guide" (RNG spectacle + crits)
Card identity: aviator goggles, telescope, cosmos, "look up".
Fantasy: the sky fights for you.

**Kit A — Star Fall**
- Weapon: Shooting Stars — meteors rain at random points near Carlos,
  small AoE each. Chaotic, screen-filling, very VS.
- Special: Constellation — every 20th star is a comet (×3 AoE).
- Passive: Lucky Stars — +10% chance drops upgrade one tier
  (coin→med-kit, gem→gold gem).

**Kit B — Orbit Guard**
- Weapon: Twin Satellites — two stars orbit at mid radius (distinct
  from Nayah C: fewer, bigger, faster, heavy knockback).
- Special: Gravity Well — every 15s orbits spiral outward, dragging
  hit enemies with them.
- Passive: Momentum — orbit speed +2% per level gained this run.

**Kit C — Comet Beam**
- Weapon: Telescope Beam — piercing beam snipes the FARTHEST enemy
  (unique targeting — cleans spawners at screen edge).
- Special: Supernova — beam kills have 15% chance to explode.
- Passive: Written in the Stars — 10% crit chance (×2 damage), the
  only crit in the game.

---

## JOSH — "Zookeeper" (tank + companions)
Card identity: safari hat, beard, Wildlife Care shirt, rope,
binoculars, giraffe. Fantasy: gentle giant + animal friends.

**Kit A — Animal Pal**
- Weapon: Rescue Pup — a dog companion chases and pops enemies;
  levels raise pup damage/speed, max level adds a second pup.
- Special: Fetch! — the pup carries distant pickups back to Josh.
- Passive: Big Heart — +25 max HP.

**Kit B — Lasso Spin**
- Weapon: Rope Cyclone — the lasso spins around Josh in a full
  circle (melee ring), heavy knockback. Walking tornado.
- Special: Round-Up — every 8s the spin widens and PULLS enemies in
  first, then flings them (combo with the ring damage).
- Passive: Sturdy — knockback dealt +50%, damage taken -10%.

**Kit C — Stampede Call**
- Weapon: Stampede — periodic wave of friendly critters charges
  across the screen in Josh's facing direction, trampling everything
  in the lane.
- Special: Menagerie — stampede species rotates (rhinos knock back,
  gazelles are fast+wide, elephants are slow+huge).
- Passive: Every Creature Has a Purpose — +1 random critter joins
  each stampede per 2 levels.

---

## Roster balance grid (why each hero feels different)

| Hero | Archetype | Range | Identity stat |
|---|---|---|---|
| Danny | Balanced projectile | mid | XP / survival |
| Victoria | Gadgets / burst | mid | cooldown, healing |
| Nayah | Area denial / orbital | close-mid | economy, pickups |
| Kevin | Big calls / buffs | screen | damage aura, mobility |
| Carlos | RNG spectacle / crit | far | luck, crits |
| Josh | Tank / companions | melee | HP, knockback |

Every VS-style niche is covered exactly once: projectile, deployable,
zone DoT, orbital, artillery, dash, shield, beam, pet, melee ring.
