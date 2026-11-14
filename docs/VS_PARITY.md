# Snack Attack vs Vampire Survivors: parity sheet

Goal (Mark, 2026-11-14): tune Snack Attack's abilities, gameplay, progression
and player development to feel very close to Vampire Survivors, with our own
heroes, snacks, art and story. Numbers and rules only; nothing copied.

- VS numbers: `docs/VS_REFERENCE.md` (wiki-derived; a researcher could not
  open the wiki directly, so cells marked [W] came via search summaries and
  UNVERIFIED cells are unknown. Spot-check before locking a value.)
- Our numbers: `src/snack/data.js`, `src/systems/weapons.js` (PC.PASSIVES),
  weapon classes, `src/config.js` (PC.PLAYER, PC.TIMESCALE).
- Fixed differences we KEEP (Mark's calls): 15-minute runs (VS 30), so VS
  timelines compress x0.5; separate save; kid-safe tuning where noted.

Legend: SAME = already matches, CLOSE = small gap, DIFF = changes the feel.

## Status (v0.81.2)

Phases 1-6 are DONE; every value below lives in `src/snack/tuning.js`:
1. tuning file (v0.80.7)  2. waves: on-screen minimum + capped trickle,
stepped toughness, no per-minute creep, 14 elites with HP x level (v0.80.8)
3. VS level walls +600/+2400 with the x2 growth bridge (v0.80.9)
4. items at VS values, 5 levels, LEFTOVERS = Hollow Heart, new WARM SOUP =
Pummarola (v0.81.0)  5. real per-weapon steps for levels 6-8, level-up
fires the weapon, evolutions x1.5 (v0.81.1)  6. hero growth every 10
levels (v0.81.2). Phase 7 (economy + overall retune) is being measured.
The tables below are the ORIGINAL gap analysis, kept for reference.

## 1. Run structure and enemies (biggest feel gap)

| System | VS | Snack Attack now | Verdict |
|---|---|---|---|
| Wave model | Per minute: an on-screen MINIMUM (refilled at once when below) + a spawn interval | Per minute: interval x per-tick count, up to a cap; no minimum refill | DIFF: VS screens never thin out; ours do after you clear them |
| Enemy toughness over time | NONE per minute; tougher TYPES arrive on schedule (Mudman at 5, Werewolf 12, Mummy 17) | +6% HP and +2.5% damage per minute on every enemy (PC.TIMESCALE) + tier weights | DIFF: ours inflates everything; VS swaps the cast |
| Minute bosses | ~13 per 30 min (1, 3, 5, 7, 9, 10, 15, 16, 18, 20, 22, 23, 25, 27, 29), HP = listed x player level, most drop a chest | 7 golden elites (1, 3, 5, 9, 10, 12, 12:02), fixed HP (tier x10), each drops a chest; 1 district boss at 7:30 (HP x level since v0.80.3) | CLOSE: count is right for 15 min; elite HP should scale with level like VS bosses |
| Density curve | Minimum 15 -> 50 in 3 min, 10-100 to min 10, then 300 at 0.1 s from min 11; calm minutes after spikes | Cap 40 -> 300 rising fairly steadily | DIFF: VS has spikes and breathers |
| End | Reaper at 30:00: unkillable, one hit kills, speed 1,200, +1 per minute | OVERTIME at 15:00: supersized boss, one touch, chase ramps from 0.7x your speed | KEEP (kid version, Mark's call) |
| Curse | Enemy HP, speed, spawn rate x totalCurse | HP x(1+curse), speed x(1+0.5 curse), density | CLOSE |

## 2. XP and level-ups

| System | VS | Snack Attack now | Verdict |
|---|---|---|---|
| XP to next level | 5, +10/level to 20, +13 to 40, +16 after | Same formula | SAME |
| Level walls | +600 XP at 20, +2,400 at 40, each with +100% Growth until the next level (a bridge) | +300 at 20, +1,200 at 40, NO Growth bridge | DIFF: VS walls feel like a pause, not a stall |
| Gem XP | Per-enemy value (bat 1, Mudman 2.5, Werewolf 2); Growth multiplies | Enemy xp (1-3) x GEM_VALUE 3 x stage xp mod x Growth | CLOSE: GEM_VALUE stands in for the 15-min compression |
| Choices | 3, 4th at P = 1 - 1/totalLuck | 3, 4th at 0.5 x bonus luck | CLOSE (ours ~half as likely) |
| Draft weights | Per-item rarity weights | Flat 1.0 / 1.3 / 1.4 | CLOSE |
| Level-up fires the weapon | Leveling a weapon resets its cooldown and fires it | Not done | CLOSE (feel detail) |

## 3. Passives (VS: most have 5 levels)

| Ours | VS twin | VS per level / max | Ours per rank / max | Verdict |
|---|---|---|---|---|
| BIGGER BATTERY | Spinach | +10% Might / 5 | +8% / 5 | CLOSE |
| COOLING FAN | Empty Tome | -8% cooldown / 5 | -6% / 5 | CLOSE |
| RUNNING SHOES | Wings | +10% move / 5 | +6% / 5 | CLOSE |
| SERVO MOTOR | Candelabrador | +10% area / 5 | +12% / 3 | DIFF (max 3 vs 5) |
| FOCUS LENS | Bracer | +10% proj speed / 5 | +15% / 3 | DIFF |
| SLOW COOKER | Spellbinder | +10% duration / 5 | +25% / 3 | DIFF |
| PADDED APRON | Armor | +1 armor / 5 | +1 / 3 | DIFF |
| SNACK MAGNET | Attractorb | compounding, ~4x at 5 | / 3 | DIFF |
| LEFTOVERS | Hollow Heart + Pummarola | +20% max HP x5 and +0.2 HP/s x5 (two items) | +15 HP and +0.5 HP/s / 3 (one item) | DIFF (one item doing two jobs) |
| DUPLICATOR TRAY | Duplicator | +1 amount / 2 | +1 / 2 | SAME |
| LUCKY PENNY | Clover | +10% luck / 5 | +10% / 5 | SAME |
| GOLD STAR | Crown | +8% growth / 5 | +8% / 5 | SAME |
| COIN JAR | Stone Mask | +10% greed / 5 | +10% / 5 | SAME |
| (none) | Skull O'Maniac (+10% curse) | | | missing (optional) |
| (none) | Tiragisu (+1 revival / 2) | | | missing (optional) |

## 4. Weapons

VS: every weapon has 8 levels, each level a specific step (+1 amount, +5 or
+10 damage, +10% area, -cooldown, +pierce), so damage output roughly triples
L1 -> L8 and the steps alternate between "more" and "harder". A level-up also
fires the weapon at once.

Ours: levels 1-5 are each weapon's own steps (similar in spirit), and 6-8
are a generic mastery x1.15 / 1.32 / 1.5 (+ one cooldown cut at 7). Measured
damage growth L1 -> L8 is in the same ballpark, but 6-8 don't change how the
weapon BEHAVES, which is most of VS's level-up excitement.

Archetype twins (for tuning targets, not copies):

| Ours | Archetype | VS twin |
|---|---|---|
| Resizer Ray (Danny) | auto-aim bolt at nearest | Magic Wand |
| Portion Blaster | forward spread | Knife (fan) |
| Whisk Cyclone | orbiting | King Bible |
| Salt Shaker | aura around you | Garlic |
| Microwave Beam | sweeping beam | (none exact; Lightning/Runetracer coverage) |
| Fridge Wall | blocker/zone | Santa Water (zone) |
| Ketchup Lobber | lobbed zones | Santa Water |
| Pizza Cutter | boomerang | Cross |
| Toaster Zap | chain/strike | Lightning Ring |

Evolutions: VS = max level weapon + its passive + a chest after the
evolution window. Ours: same rule (rank 8 + item + chest from 5:00). SAME.

## 5. Chests, gold and economy

| System | VS | Snack Attack now | Verdict |
|---|---|---|---|
| Chest tiers | 5-item first, then 3, else 1; typical boss row 3% / 10% / 100%, each x totalLuck | Elite: 5 = 2%, 3 = 10%; district boss: 5 = 30%, 3 = 70% | CLOSE |
| Chest gold | 1-item 100-200, 3-item 300-600, 5-item 500-1,000 (x Greed) | Elite 25-60, boss 120-200 | DIFF in scale (ours is kid-economy; see prices) |
| Coins | Coin 1, Bag 10, Rich Bag 100 (light sources weighted 50/10/1) | Kill coins (5% tapering) + crates every 16 s | CLOSE |
| Healing | Floor Chicken 30 HP (common light-source drop) | Medkit 35 | CLOSE |
| PowerUp prices | base x (owned+1) + floor(20 x 1.1^total) | Same formula x PRICE_SCALE 0.5 | CLOSE (scaled to our income) |
| Characters | 10 / 100 / 500 + achievement unlocks | 10 / 100 / 500 + achievement unlocks | SAME |
| Stage gates | Level 20 / 40 / 60 / 80 in 30-min runs | Level 20 / 30 / 40 / 50 in 15-min runs | CLOSE |

## 6. Heroes (player development)

VS characters: a starter weapon + a stat profile + a GROWTH bonus every N
levels (Antonio +10% Might per 10 levels to +50%; Arca -5% cooldown per 10).
Ours: starter weapon + one flat passive (Danny +10% XP, Vic -10% cooldown,
Kevin +8% damage, Carlos 10% crit, Nayah +15% XP, Josh -10% damage taken).
DIFF: no per-level growth, so heroes don't "come online" over a run.

## Plan (phased; each phase verified by the career bot against a VS-shaped
## target before the next)

1. Tuning surface: one file of knobs (`src/snack/tuning.js`) with each
   value next to its VS reference, so tuning never means editing logic.
2. Enemies: VS wave model (on-screen minimum + interval per minute), drop
   per-minute HP inflation, author a 15-minute cast timeline per stage that
   swaps tougher types in on schedule with spikes and breathers; golden
   elites' HP x player level like VS bosses.
3. XP: VS walls (+600 / +2,400) with the +100% Growth bridge; retarget
   GEM_VALUE so level-by-minute tracks a VS run compressed to 15 min.
4. Passives: VS levels and values (5 levels where VS has 5), split LEFTOVERS
   into a max-HP item and a recovery item.
5. Weapons: full 8-level tables per weapon in Snack (data, not mastery),
   level-up fires the weapon, Story untouched.
6. Heroes: VS-style growth bonus every N levels per hero.
7. Economy check: chest gold / coins / prices re-measured after 2-6.
