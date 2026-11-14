# Vampire Survivors: Numeric Tuning Reference

For: *Portion Control: Snack Attack* (original homage: own heroes, art and story).
Scope: mechanics and numbers only, restated in our own words. No wiki prose or code.
Compiled 2026-11-14.

## 0. How to read this file

**Provenance tags in the Notes column**

| Tag | Meaning |
|---|---|
| [T] | Already in our design doc `docs/VS_TEMPLATE.md` as [VS VERIFIED] |
| [W] | vampire.survivors.wiki page content, read through web-search summaries (see caveat) |
| [W+T] | Both agree |
| [D] | Derived by arithmetic from [W] numbers (formula shown) |
| [K] | Background knowledge that matches the wiki's level-8 totals but could not be checked line by line |
| UNVERIFIED | Could not confirm. Treat as a placeholder, not a VS fact |

**Access caveat.** This session's network blocks `vampire.survivors.wiki` and
`vampire-survivors.fandom.com` for direct page fetches. All [W] values came
from a search tool that reads those wiki pages and returns summaries. They
usually quote the wiki's own infobox and table text, but a summary can drop or
garble a cell. Where two summaries disagreed, both values are shown. Before
locking a number, have someone open the page in a browser. Wiki data also
trails game patches. Several pages were 1 to 2 years old when read.

**Units.** In VS, "Area 100%", "Speed 100%" and so on are multipliers on a
weapon's own base values. Cooldown is in seconds. HP and damage are raw points.
Base player Max HP is 100.

Base URL: `https://vampire.survivors.wiki/w/` (shown below as `/w/Page`).

---

## 1. Player stats: base values, caps, and what moves them

| Stat | VS base | Cap / limit | Formula / notes | Source |
|---|---|---|---|---|
| Max Health | 100 HP | none listed | Character bonuses add flat HP (Antonio +20 gives 120). Hollow Heart and the PowerUp multiply. [W] | /w/Player_stats, /w/Max_Health |
| Recovery | 0 HP/s | none listed | Flat HP per second. Pummarola +0.2/level, PowerUp +0.1/rank. [W] | /w/Player_stats, /w/Recovery |
| Armor | 0 | 50 max | Each point takes 1 off every incoming hit. Antonio starts with 1. [W] | /w/Armor_(stat) |
| Move Speed | 100% | none listed | Wings +10%/level. PowerUp +5%/rank. [W] | /w/Player_stats |
| Might | 100% | 1000% | Multiplies all weapon damage. Spinach +10%/level. PowerUp +5%/rank. [W] | /w/Player_stats, /w/Might |
| Speed (projectile) | 100% | 500% | Projectile travel speed. Bracer +10%/level. [W] | /w/Player_stats |
| Duration | 100% | 500% | Lifetime of zones, orbits and effects. Spellbinder +10%/level. [W] | /w/Player_stats, /w/Duration |
| Area | 100% | 1000% | Size of hitboxes and effects. Candelabrador +10%/level. [W] | /w/Player_stats |
| Cooldown | 100% | floor 10% | Multiplies time between activations. Empty Tome -8%/level (additive). [W] | /w/Player_stats, /w/Empty_Tome |
| Amount | +0 | +10 | Extra projectiles on every weapon that uses Amount. Duplicator +1/level. [W] | /w/Player_stats |
| Magnet | 30 (radius units) | none listed | Pickup radius for gems and items. Attractorb compounds (see sec. 4). PowerUp +25%/rank. [W] | /w/Player_stats |
| Luck | 100% | none listed | totalLuck = 100 + bonus%. Effects are in the Luck rows below. [W] | /w/Luck |
| Growth | 100% | none listed | XP multiplier. Crown +8%/level. PowerUp +3%/rank. [W] | /w/Growth |
| Greed | 100% | none listed | Gold multiplier. Stone Mask +10%/level. PowerUp +10%/rank. Stage gold bonus multiplies on top. [W] | /w/Greed |
| Curse | 100% | none listed | Raises enemy HP, speed, wave quantity and spawn frequency (sec. 10). Bonuses stack additively. [W] | /w/Curse |
| Revival | 0 | none listed | Each charge revives the player once at 50% HP. [W] | /w/Revival |
| Reroll / Skip / Banish | 0 each | none listed | Charges per run. PowerUp gives +2 per rank. [W] | /w/PowerUps |

### Luck formulas

| Effect | VS rule | Notes | Source |
|---|---|---|---|
| 4th level-up choice | P(4 choices) = 1 - 1/totalLuck | At base Luck (1.00) this is 0%. At 130% Luck, about 23%. [W] | /w/Luck, /w/Level_up |
| Chest tier roll | each tier's base chance x totalLuck | Rolls the 5-item tier first, then 3-item, then 1-item. [W] | /w/Luck, /w/Treasure_Chest |
| Light-source drops | item weight x totalLuck | Applies to every drop except Gold Coin and Coin Bag. [W] | /w/Luck, /w/Pickups |
| Crit-capable weapons | crit chance scales with Luck | Bloody Tear, Heaven Sword. [W] | /w/Bloody_Tear |

---

## 2. Level-up and experience curve

| Item | VS value | Formula / notes | Source |
|---|---|---|---|
| XP for level 1 to 2 | 5 | Run starts at level 1. [W+T] | /w/Level_up |
| Levels 2 to 20 | +10 per level | XP to go from level L to L+1 = 5 + 10(L-1), so 15, 25, 35 and so on. [W+T] | /w/Level_up |
| Levels 21 to 40 | +13 per level | [W+T] | /w/Level_up |
| Level 41 and up | +16 per level | [W+T] | /w/Level_up |
| Level 20 spike | +600 extra XP | Comes with +100% Growth until the player reaches 21, then that bonus is removed. [W] | /w/Level_up |
| Level 40 spike | +2400 extra XP | Same +100% Growth bridge until level 41. [W] | /w/Level_up |
| Total XP to reach level 20 | 1,805 | Matches the wiki's chart. [W] | /w/Level_up, /w/Module:Experience |
| Total XP to reach level 21 | 2,600 | Matches the wiki's chart. [W] | /w/Level_up |
| Choices per level-up | 3, sometimes 4 | No duplicates. The 4th choice depends on Luck (sec. 1). [W+T] | /w/Level_up |
| Choice weighting | item rarity / total pool weight | Weapons and passives use rarity weights. With all DLC the wiki's total is 9,500 (8,130 weapons, 1,370 passives). [W] | /w/Level_up |
| Slots | 6 weapons, 6 passives | Once full, no new items are offered. Maxed items leave the pool. [W+T] | /w/Level_up |
| Pool exhausted | gold or Floor Chicken | Offered when nothing can level. With Limit Break on, maxed weapons get extra stat levels instead. [W] | /w/Level_up |

### Derived XP table [D]

Built from the rules above and checked against the wiki's 1,805 and 2,600
totals. The exact base requirement at levels 40 and 41 could be off by about
3 XP.

| Level | XP to next level | Total XP to reach this level |
|---:|---:|---:|
| 1 | 5 | 0 |
| 2 | 15 | 5 |
| 3 | 25 | 20 |
| 5 | 45 | 80 |
| 10 | 95 | 405 |
| 15 | 145 | 980 |
| 19 | 185 | 1,620 |
| 20 | 795 (195 + 600) | 1,805 |
| 21 | 208 | 2,600 |
| 25 | 260 | 3,510 |
| 30 | 325 | 4,940 |
| 40 | about 2,855 (455 + 2,400) | about 8,775 |
| 41 | about 471 | about 11,630 |
| 50 | about 615 | about 16,445 |
| 60 | about 775 | about 23,315 |
| 80 | about 1,095 | about 41,855 |
| 100 | about 1,415 | about 66,795 |

### Experience gems

| Item | VS value | Notes | Source |
|---|---|---|---|
| Blue gem | 2 XP or less | Gem color shows its value. [W] | /w/Experience_Gem |
| Green gem | 9 XP or less | [W] | /w/Experience_Gem |
| Red gem | more than 9 XP | [W] | /w/Experience_Gem |
| Gem cap | 400 gems on the ground | Past the cap, new XP is added to one existing gem, which turns red. Pages disagree on which gem absorbs it (one red gem, or the gem furthest from the player). [W] | /w/Experience_Gem, /w/The_Reaper/Other_Strategies |
| Growth | multiplies gem XP on pickup | [W] | /w/Growth |
| Enemy XP examples | Pipeestrello 1: 1. Mudman: 2.5. Mantichana: 3. Glowing Bat (Pipeestrello 4): 30. Giant Mantichana boss: 50. Big Mummy boss: 25 | XP comes from each enemy's own base value. [W] | /w/Pipeestrello, /w/Mudman, /w/Mantichana |

---

## 3. PowerUps (permanent shop)

| PowerUp | Base price | Max ranks | Per-rank effect | Notes | Source |
|---|---:|---:|---|---|---|
| Might | 200 | 5 | +5% damage | [W+T] | /w/PowerUps, /w/Might |
| Armor | 600 | 3 | +1 armor | [W+T] | /w/Armor_(stat) |
| Max Health | 200 | 3 | +10% max HP | Multiplicative per the wiki: 1.331x at rank 3. [W] | /w/Max_Health |
| Recovery | 200 | 5 | +0.1 HP/s | [W+T] | /w/Recovery |
| Cooldown | 900 | 2 | -2.5% | [W+T] | /w/PowerUps |
| Area | 300 | 2 | +5% | [T] | /w/PowerUps |
| Speed | 300 | 2 | +10% | [T] | /w/PowerUps |
| Duration | 300 | 2 | +15% | [T] | /w/PowerUps |
| Amount | 5,000 | 1 | +1 | [T] | /w/PowerUps |
| Move Speed | 600 | 2 | +5% | [T] | /w/PowerUps |
| Magnet | 300 | 2 | +25% | Max +50%. [W+T] | /w/PowerUps |
| Luck | 600 | 3 | +10% | [T] | /w/PowerUps |
| Growth | 900 | 5 | +3% | Max +15%. [W+T] | /w/Growth |
| Greed | 200 | 5 | +10% | Max +50%. [W+T] | /w/Greed |
| Curse | 1,666 | 5 | +10% | Max +50%. [W+T] | /w/Curse |
| Revival | 10,000 | 1 | +1 revive (at 50% HP) | [W+T] | /w/Revival |
| Omni | 1,000 | 5 | +2% Might, Speed, Duration and Area | [W+T] | /w/PowerUps |
| Reroll | 1,000 | 5 | +2 rerolls | [W+T] | /w/PowerUps |
| Skip | 100 | 5 | +2 skips | [W+T] | /w/PowerUps |
| Banish | 100 | 5 | +2 banishes | [W+T] | /w/PowerUps |
| Preserve (later addition) | UNVERIFIED | 5 | 10% chance to keep a used Reroll, Skip or Banish | [W] | /w/PowerUps |

### Price formula

| Item | VS rule | Notes | Source |
|---|---|---|---|
| Cost of the next rank | basePrice x (ranks already owned + 1) + fee | [W+T] | /w/PowerUps |
| fee | 0 before any purchase. After that, floor(20 x 1.1^(total ranks bought across the whole shop)) | This shared fee makes every purchase raise the price of all the others. [T] | /w/PowerUps |
| Refund | Full refund of all ranks is allowed | [T] | /w/PowerUps |
| Buying everything | about 42.97 million gold | Covers all 27 modern PowerUps. Shows how strongly the fee compounds. [W] | /w/PowerUps |

Worked example [D]: the first Might rank costs 200. If Might is bought again
right after, rank 2 costs 200 x 2 + floor(20 x 1.1^1) = 400 + 22 = 422.

---

## 4. Passive items

All have max level 5 unless noted. Effects add per level unless noted.

| Passive | Per level | At max | Formula / notes | Evolves | Source |
|---|---|---|---|---|---|
| Spinach | +10% Might | +50% | [W] | Fire Wand to Hellfire | /w/Spinach |
| Armor (item) | +1 Armor, +10% retaliatory damage | +5 armor, +50% | [W] | Runetracer to NO FUTURE | /w/Armor_(item) |
| Hollow Heart | +20% Max HP | about 2.49x | Multiplicative: each level x1.2, so 1.2^5 = 2.488x. One summary instead read it as +20% additive. [W] | Whip to Bloody Tear | /w/Hollow_Heart |
| Pummarola | +0.2 HP/s Recovery | +1.0 HP/s | [W] | Garlic to Soul Eater | /w/Pummarola |
| Empty Tome | -8% Cooldown | -40% | Additive. Unlocked by holding 6 different weapons at once. [W] | Magic Wand to Holy Wand | /w/Empty_Tome |
| Candelabrador | +10% Area | +50% | Unlocked by getting Santa Water to level 4. [W] | Axe to Death Spiral | /w/Candelabrador |
| Bracer | +10% Speed | +50% | Unlocked by getting King Bible to level 4. [W] | Knife to Thousand Edge | /w/Bracer |
| Spellbinder | +10% Duration | +50% | [W] | King Bible to Unholy Vespers | /w/Spellbinder, /w/Duration |
| Duplicator | +1 Amount | +2 | Max level 2. [W+T] | Lightning Ring to Thunder Loop | /w/Duplicator |
| Wings | +10% Move Speed | +50% | [W] | none in the base set | /w/Wings |
| Attractorb | Magnet up by a different % each level | 3.98x Magnet | Each level adds a percent of the current total, so the gains compound. Per-level % UNVERIFIED. [W] | Santa Water to La Borra | /w/Attractorb |
| Clover | +10% Luck | +50% | [W] | Cross to Heaven Sword | /w/Clover |
| Crown | +8% Growth | +40% | [W] | Pentagram to Gorgeous Moon | /w/Crown |
| Stone Mask | +10% Greed | +50% | [W] | none in the base set | /w/Passive_items |
| Skull O'Maniac | +10% Curse | +50% | Raises enemy HP, speed, quantity and spawn frequency. Unlocked by surviving 30 min with Lama. [W] | later evolutions only | /w/Skull_O%27Maniac |
| Tirajisu ("Tiragisu") | +1 Revival | +2 | Max level 2. Each revival restores 50% HP. [W] | none | /w/Tirajis%C3%BA |

**Floor items.** Mad Forest places Spinach, Clover, Hollow Heart, Pummarola and
Skull O'Maniac on the map as pickups. Inlaid Library has Stone Mask and Empty
Tome. Dairy Plant has Attractorb, Candelabrador, Wings and Armor. Floor items
can push the player past the 6-passive draft cap. [W+T] Source: /w/Stages, /w/Passive_items.

---

## 5. Classic weapons: base stats and level tables

Every weapon below has 8 levels. A level-up also resets that weapon's cooldown
and fires it at once. [W] Source: /w/Fire_Wand.

### 5.1 Whip (Antonio's starter)

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 10, Cooldown 1.35 s, Amount 1 | Horizontal slash, alternating sides. [W] | /w/Whip |
| L2 | +1 Amount | [W] | /w/Whip |
| L3 | +5 damage | [W] | /w/Whip |
| L4 | +5 damage, +10% Area | [W] | /w/Whip |
| L5 | +5 damage | [W] | /w/Whip |
| L6 | +5 damage, +10% Area | [W] | /w/Whip |
| L7 | +5 damage | [W] | /w/Whip |
| L8 | +5 damage | Total gained: +30 damage, +20% Area, +1 Amount. No cooldown cuts. [W] | /w/Whip |
| Bloody Tear (+ Hollow Heart) | Damage 40, Area 130%, Cooldown 1.35 s, Amount 2, interval 0.1 s | 10% crit for 2x (scales with Luck). A crit heals 8 HP, at most once per second, and Recovery does not boost it. [W] | /w/Bloody_Tear |

### 5.2 Magic Wand (Imelda's starter)

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 10, Cooldown 1.2 s, Amount 1, Pierce 1 | Fires at the nearest enemy. [W] | /w/Magic_Wand |
| L2 | +1 Amount | [W] | /w/Magic_Wand |
| L3 | -0.2 s Cooldown | [W] | /w/Magic_Wand |
| L4 | +1 Amount | [W] | /w/Magic_Wand |
| L5 | +10 damage | [W] | /w/Magic_Wand |
| L6 | +1 Amount | [W] | /w/Magic_Wand |
| L7 | +1 Pierce | [W] | /w/Magic_Wand |
| L8 | +10 damage | Total gained: +20 damage, +3 Amount, +1 Pierce, -0.2 s. [W] | /w/Magic_Wand |
| Holy Wand (+ Empty Tome) | Damage 30, Speed 200%, Amount 4, Pierce 2, Cooldown 0.5 s | Roughly half the cooldown and double the projectile speed of the base wand. [W] | /w/Holy_Wand |

### 5.3 Knife (Gennaro's starter)

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 6.5, Cooldown 1.0 s, Amount 1, Pierce 1 | Fires in the direction the player faces. [W] | /w/Knife |
| L2 | +1 Amount | [W] | /w/Knife |
| L3 | +1 Amount, +5 damage | One summary listed only the damage. The +5 Amount total needs this extra projectile. [K] | /w/Knife |
| L4 | +1 Amount | [W] | /w/Knife |
| L5 | +1 Pierce | [W] | /w/Knife |
| L6 | +1 Amount | [W] | /w/Knife |
| L7 | +1 Amount, +5 damage | [W] | /w/Knife |
| L8 | +1 Pierce | Total gained: +10 damage, +5 Amount, +2 Pierce, -0.06 s between projectiles (the level for that is UNVERIFIED). [W] | /w/Knife |
| Thousand Edge (+ Bracer) | Damage 16.5, Amount 6, Pierce 3, Cooldown 0.35 s, interval 0.05 s | Lists a 30% crit for 3x. Fires with no delay. [W] | /w/Thousand_Edge |

### 5.4 Axe

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 20, Cooldown 4.0 s, Amount 1, Pierce 3 | Thrown upward, then falls in an arc. [W] | /w/Axe |
| L2 | +1 Amount | [W] | /w/Axe |
| L3 | +20 damage | [W] | /w/Axe |
| L4 | +2 Pierce | [W] | /w/Axe |
| L5 | +1 Amount | [W] | /w/Axe |
| L6 | +20 damage | [W] | /w/Axe |
| L7 | +2 Pierce | [W] | /w/Axe |
| L8 | +20 damage | Total gained: +60 damage, +2 Amount, +4 Pierce. [W] | /w/Axe |
| Death Spiral (+ Candelabrador) | Damage 60, Cooldown 4.0 s, Pierce about unlimited | Larger scythes spin outward. The wiki infobox notes damage was lowered by 20 at some point. [W] | /w/Death_Spiral |

### 5.5 Cross

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 5, Cooldown 2.0 s, Amount 1 | Boomerang that aims at the nearest enemy. Base damage is [K]. Cooldown is [W]. | /w/Cross |
| L2 | +10 damage | [W] | /w/Cross |
| L3 | +10% Area, +25% Speed | [W] pattern, [K] values | /w/Cross |
| L4 | +1 Amount | [W] | /w/Cross |
| L5 | +10 damage | [W] | /w/Cross |
| L6 | +10% Area, +25% Speed | [W] pattern, [K] values | /w/Cross |
| L7 | +1 Amount | [W] | /w/Cross |
| L8 | +10 damage | Total gained: +30 damage, +20% Area, +50% Speed, +2 Amount. [W] | /w/Cross |
| Heaven Sword (+ Clover) | Damage 77, Area 120%, Speed 200%, Amount 1, Cooldown 3.3 s | 10% crit for 2.5x, plus strong knockback. The 77 damage reading is UNVERIFIED; it seems high. [W] | /w/Heaven_Sword |

### 5.6 King Bible

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 10, Cooldown 3.0 s, Duration 3.0 s, Amount 1 | Orbits the player. The cooldown only starts after the orbit ends, so the full cycle is 6 s. [W] | /w/King_Bible |
| L2 | +1 Amount | [W] | /w/King_Bible |
| L3 | +25% Area, +30% Speed | [W] pattern, [K] values | /w/King_Bible |
| L4 | +0.5 s Duration, +10 damage | [W] | /w/King_Bible |
| L5 | +1 Amount | [W] | /w/King_Bible |
| L6 | +25% Area, +30% Speed | [W] pattern, [K] values | /w/King_Bible |
| L7 | +0.5 s Duration, +10 damage | [W] | /w/King_Bible |
| L8 | +1 Amount | Total gained: +20 damage, +50% Area, +60% Speed, +3 Amount, +1 s Duration. [W] | /w/King_Bible |
| Unholy Vespers (+ Spellbinder) | Damage 30, Cooldown 3.0 s | Cooldown no longer waits for Duration to end, so it can stay up permanently. [W] | /w/Unholy_Vespers |

### 5.7 Fire Wand (Arca's starter)

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 20, Cooldown 3.0 s, Amount 3 | Fires toward a random enemy. Amount 3 comes from Hellfire's listed "2 (-1)". [W] | /w/Fire_Wand |
| L2 | +10 damage | [W] | /w/Fire_Wand |
| L3 | +10 damage, +20% Speed | [W] | /w/Fire_Wand |
| L4 | +10 damage | [W] | /w/Fire_Wand |
| L5 | +10 damage, +20% Speed | [W] | /w/Fire_Wand |
| L6 | +10 damage | [W] | /w/Fire_Wand |
| L7 | +10 damage, +20% Speed | [W] | /w/Fire_Wand |
| L8 | +10 damage | Total gained: +70 damage, +60% Speed. No cooldown cuts. [W] | /w/Fire_Wand |
| Hellfire (+ Spinach) | Damage 100, Cooldown 3.0 s, Amount 2 | Projectiles pass through enemies. Pool limit 20. [W] | /w/Hellfire |

### 5.8 Garlic (Poe's starter)

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 5, Cooldown 1.3 s, Knockback 0 | Damage aura around the player. Cooldown works as the per-enemy re-hit delay. [W] | /w/Garlic |
| L2 | +40% Area, +2 damage | [W] | /w/Garlic |
| L3 | -0.1 s, +1 damage | [W] | /w/Garlic |
| L4 | +20% Area, +1 damage | [W] | /w/Garlic |
| L5 | -0.1 s, +2 damage | [W] | /w/Garlic |
| L6 | +20% Area, +1 damage | [W] | /w/Garlic |
| L7 | -0.1 s, +1 damage | [W] | /w/Garlic |
| L8 | +20% Area, +2 damage | Total gained: +10 damage, +100% Area, -0.3 s, so 15 damage, 200% Area, 1.0 s at max. [W] | /w/Garlic |
| Soul Eater (+ Pummarola) | Damage 20, Area 300%, Cooldown 1.3 s | An enemy entering the aura for the first time takes damage at once. [W] | /w/Soul_Eater |

### 5.9 Santa Water (Clerici's starter)

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 10, Cooldown 4.5 s, Duration 2.0 s, Amount 1, interval 0.3 s | Drops damaging pools on the ground. [W] | /w/Santa_Water |
| L2 | +1 Amount, +20% Area | [W] | /w/Santa_Water |
| L3 | +0.5 s Duration, +10 damage | [W] | /w/Santa_Water |
| L4 | +1 Amount, +20% Area | [W] | /w/Santa_Water |
| L5 | +0.3 s Duration, +10 damage | [W] | /w/Santa_Water |
| L6 | +1 Amount, +20% Area | [W] | /w/Santa_Water |
| L7 | +0.3 s Duration, +5 damage | [W] | /w/Santa_Water |
| L8 | +20% Area, +5 damage | Total gained: +30 damage, +80% Area, +3 Amount. Duration steps add up to 1.1 s but the page total says 1.0 s, so one cell is off. [W] | /w/Santa_Water |
| La Borra (+ Attractorb) | Damage 40, Area 200%, Amount 4, Duration 4.0 s, Cooldown 4.0 s | Pools grow and move toward the player. [W] | /w/La_Borra |

### 5.10 Runetracer (Pasqualina's starter)

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 10, Cooldown 3.0 s, Duration 2.25 s, Amount 1 | Bounces off the screen edges. [W] | /w/Runetracer |
| L2 | +5 damage, +20% Speed | [W] pattern, [K] values | /w/Runetracer |
| L3 | +Duration, +5 damage | [W] pattern | /w/Runetracer |
| L4 | +1 Amount | [W] | /w/Runetracer |
| L5 | +5 damage, +20% Speed | [W] pattern, [K] values | /w/Runetracer |
| L6 | +Duration, +5 damage | [W] pattern | /w/Runetracer |
| L7 | +1 Amount | [W] | /w/Runetracer |
| L8 | +Duration | Total gained: +20 damage, +40% Speed, +2 Amount, +1 s Duration (3.25 s at max). Size of each Duration step is UNVERIFIED. [W] | /w/Runetracer |
| NO FUTURE (+ Armor) | Damage 30, Cooldown 1.0 s, Duration 3.0 s | Cooldown only starts after Duration, so about 4 s per cycle. Explodes on each bounce and when the player is hit. [W] | /w/NO_FUTURE |

### 5.11 Lightning Ring (Porta's starter)

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Damage 15, Cooldown 4.5 s, Amount 2 | Lightning strikes random enemies. [W] | /w/Lightning_Ring |
| L2 | +1 Amount | [W] | /w/Lightning_Ring |
| L3 | +10 damage, +100% Area | [W] | /w/Lightning_Ring |
| L4 | +1 Amount | [W] | /w/Lightning_Ring |
| L5 | +20 damage, +100% Area | [W] | /w/Lightning_Ring |
| L6 | +1 Amount | [W] | /w/Lightning_Ring |
| L7 | +20 damage, +100% Area | [W] | /w/Lightning_Ring |
| L8 | +1 Amount | Total gained: +50 damage, +300% Area, +4 Amount. No cooldown cuts. [W] | /w/Lightning_Ring |
| Thunder Loop (+ Duplicator) | Damage 65, Area 400%, Amount 6, Cooldown 4.5 s | Each strike hits twice. [W] | /w/Thunder_Loop |

### 5.12 Peachone / Ebony Wings (the pair that forms one union)

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base (each) | Damage 10, Area 100%, Amount 4, Cooldown 1.0 s | Peachone circles clockwise, Ebony Wings counterclockwise. [W] | /w/Peachone, /w/Ebony_Wings |
| L2 to L8 pattern | +Amount every level. Area at L2, L5, L8. Damage at L3, L6. Cooldown cuts at L4, L7 | Total gained: +20 damage, +120% Area, +7 Amount, -0.5 s. [W] | /w/Peachone |
| Unlocks | Peachone: survive 10 min. Ebony Wings: Peachone to level 7 | [W] | /w/Peachone |
| Vandalier (both maxed) | Damage 28, Area 220%, Amount 20, Cooldown 1.0 s | Frees one weapon slot. Has its own levels: +20% Area at L2, L4, L6, L8 and -0.3 s at L3, L5, L7, reaching 0.25 s at max. [W] | /w/Vandalier |

### 5.13 Pentagram (screen clear, pairs with Crown)

| Field | VS value | Notes | Source |
|---|---|---|---|
| Base | Cooldown 90 s | Wipes the screen. Also erases pickups unless a save roll succeeds. [W] | /w/Pentagram |
| Levels | -10 s at L2 and L4, -5 s at L6 and L8. Pickup-save chance 25% / 45% / 65% at L3 / L5 / L7 | 60 s at max. [W] | /w/Pentagram, /w/Calculators/Pentagram_XP |
| Gorgeous Moon (+ Crown) | Cooldown 60 s | No longer erases pickups. [W] | /w/Gorgeous_Moon |

### 5.14 Evolution rules

| Rule | VS value | Notes | Source |
|---|---|---|---|
| Requirement | Weapon at max level, plus its paired passive at any level, then open an eligible chest | Most classic pairs do not need the passive maxed. [W+T] | /w/Evolution |
| Eligible chests | Usually only from bosses at or after 10:00 | Mad Forest's 1:00 Glowing Bat chest is an exception. Dairy Plant and Cappella Magna chests can evolve at any time. [W+T] | /w/Evolution |
| Evolutions per chest | Usually 1 | Higher-tier chests can evolve up to 3 in some cases. [W] | /w/Evolution, /w/Treasure_Chest |
| After evolving | The evolved weapon's cooldown restarts from zero | [W] | /w/Santa_Water |

---

## 6. Characters (starting stats)

| Character | Starter | Starting stats | Growth bonus | Unlock / price | Source |
|---|---|---|---|---|---|
| Antonio (baseline) | Whip | 120 HP (100 + 20), Armor 1 | +10% Might every 10 levels, up to +50% at level 50 | Free [W+T] | /w/Antonio_Belpaese |
| Imelda | Magic Wand | 100 HP, no other bonuses | More XP every 5 levels. Exact values UNVERIFIED (often quoted as +10% per 5 levels, up to +30%) | 10 gold [T] | /w/Imelda_Belpaese |
| Pasqualina | Runetracer | 100 HP, +10% Speed | Projectile speed rises with level. Exact values UNVERIFIED | 100 gold [T] | /w/Characters/Search |
| Gennaro | Knife | 120 HP, +1 Amount | none | 500 gold [W+T] | /w/Characters/Search |
| Poe | Garlic | 70 HP (100 - 30), +25% Magnet | Defensive aura at low HP [T] | Garlic to level 7, then 500 gold [W+T] | /w/Poe_Ratcho |
| Arca | Fire Wand | UNVERIFIED | -5% Cooldown every 10 levels, up to -15% | Fire Wand to level 4, then 500 gold [W+T] | /w/Arca_Ladonna |
| Porta | Lightning Ring | UNVERIFIED (starts with a large cooldown bonus that shrinks as she levels) | as noted | Lightning Ring to level 4, then 500 gold [T] | /w/Characters/Search |
| Lama | Axe | UNVERIFIED | UNVERIFIED | Survive 20 min with Curse above base [W+T] | /w/Lama_Ladonna |
| Clerici | Santa Water | UNVERIFIED | Area and Recovery focus [T] | Heal 1,000 HP in total across runs [T] | /w/Suor_Clerici |
| Dommario | King Bible | UNVERIFIED | Duration and Speed focus, slower movement [T] | Earn 5,000 gold in one run [T] | /w/Characters/Search |
| Mortaccio | Bone | UNVERIFIED | +1 Amount every 20 levels [T] | Defeat 3,000 skeletons in total [T] | /w/Characters/Search |

Prices are base prices. VS also adds a surcharge that grows with every
character already bought. That formula is UNVERIFIED (it was not in any summary).

---

## 7. Treasure chests

| Item | VS value | Formula / notes | Source |
|---|---|---|---|
| Item counts | 1, 3, or 5 | Rolls the 5-item tier first, then 3, then falls back to 1. [W+T] | /w/Treasure_Chest |
| Tier odds | Set per boss | A typical Mad Forest boss row reads 3% / 10% / 100% (5-item / 3-item / 1-item). Each check is multiplied by totalLuck. [W] | /w/Mad_Forest, /w/Luck |
| Gold in a chest | 1-item: 100 to 200. 3-item: 300 to 600. 5-item: 500 to 1,000 | Random within the range, then multiplied by Greed. [W] | /w/Treasure_Chest |
| Contents | Level-ups for items you own, or new items if slots are free, or an evolution | Item picks use the same rarity weights as level-ups. [W] | /w/Level_up |
| Who drops them | Bosses (elite versions of enemies) | Chance set per boss. [W] | /w/Enemies |
| Arcana chest | 11:00 and 21:00 Arcana-holder bosses | Gives an Arcana instead of items. Once the player holds 3 Arcanas, these bosses drop normal chests. [W] | /w/Arcanas |
| Stage exceptions | Il Molise lists 1% and 2% base odds for 3- and 5-item chests | Stage specific. Do not use as the default. [W] | /w/Il_Molise |

---

## 8. Pickups, gold and light sources

| Pickup | VS value | Light-source weight / unlock | Notes | Source |
|---|---|---|---|---|
| Gold Coin | 1 gold x Greed | weight 50, from player level 0 | Most common light-source drop. [W] | /w/Gold_Coin_(pickup) |
| Coin Bag | 10 gold x Greed | weight 10, from level 0 | [W] | /w/Coin_Bag |
| Rich Coin Bag | 100 gold x Greed | weight 1, from player level 5 | Drop chance scales with Luck. [W] | /w/Rich_Coin_Bag |
| Floor Chicken | heals 30 HP | weight 12, from level 0 | The most common non-gold drop. [W] | /w/Floor_Chicken |
| Little Heart | heals 1 HP | weight 0 (never from light sources) | [W] | /w/Pickups |
| Orologion | freezes all enemies 10 s | weight 2, from player level 4 | [W] | /w/Orologion |
| Rosary | kills all on-screen enemies except immune ones | weight 1, from player level 8 | [W] | /w/Rosary |
| Vacuum | pulls in every XP gem on the map | weight 2, from player level 12 | [W] | /w/Vacuum |
| Luck effect | non-gold weights x totalLuck | | [W] | /w/Luck |
| Little Clover, Nduja Fritta, Clock Lancet and others | UNVERIFIED | UNVERIFIED | Not in any summary. | /w/Light_source |

Approximate light-source odds at base Luck, level 12 or higher, ignoring the
rare items [D]: total weight about 50 + 10 + 1 + 12 + 2 + 1 + 2 = 78. Gold Coin
about 64%, Coin Bag 13%, Chicken 15%, Rich Bag 1.3%, Orologion and Vacuum 2.6%
each, Rosary 1.3%.

**Gold sources.** Gold is never paid per minute survived. It comes only from
pickups, chests, and some character or weapon effects. Greed and the stage's
gold bonus multiply it. Gold collected is kept even when the player dies.
[T] Source: /w/Pickups.

---

## 9. Mad Forest (stage 1)

### 9.1 Stage facts

| Item | VS value | Notes | Source |
|---|---|---|---|
| Length | 30:00, then the Reaper | [W+T] | /w/Mad_Forest |
| Spawn pattern | "Standard": enemies come from all four sides, map scrolls without end | [W] | /w/Mad_Forest |
| Wave rule | Each minute sets an enemy minimum and a spawn interval | When the count on screen is below the minimum, the game spawns enemies until it is met. Otherwise it adds a batch every interval. [W] | /w/Mad_Forest, /w/Enemies |
| Stage modifier (normal) | +10% "move speed" | Whether this applies to the player or the enemies is UNVERIFIED. [W] | /w/Stages |
| Hyper mode | +100% move speed, +50% gold | Unlocked by killing the 25:00 Giant Blue Venus. [W] | /w/Stages, /w/Mad_Forest |
| Floor items | Spinach, Clover, Hollow Heart, Pummarola, Skull O'Maniac | [W] | /w/Stages |
| Stage gold multiplier (normal) | UNVERIFIED (assume x1) | [W] lists x1 for Inlaid Library | /w/Inlaid_Library |

### 9.2 Mad Forest enemies

| Enemy | HP | Power (damage) | Move speed | XP | Source |
|---|---:|---:|---:|---:|---|
| Pipeestrello 1 (small bat) | 1 | 5 | 140 | 1 | /w/Pipeestrello |
| Pipeestrello 2 | 5 | 4 to 6 | 100 to 140 | UNVERIFIED | /w/Pipeestrello |
| Zombie | 10 | 10 | 100 | UNVERIFIED | /w/Zombie |
| Skeleton | UNVERIFIED (about 15) | UNVERIFIED | UNVERIFIED | UNVERIFIED | /w/Skeleton |
| Ghost | 10 | 5 | 200 | UNVERIFIED | /w/Ghost |
| Ghost Swarm (fixed path) | UNVERIFIED | UNVERIFIED | 700 | 1.5 | /w/Ghost |
| Mudman | 70 or 150 (two variants) | 10 | 100 | 2.5 | /w/Mudman |
| Werewolf | 180 | 14 | 130 | 2 (boss form) | /w/Werewolf |
| Mantichana | 500 | 20 | 80 | 3 | /w/Mantichana |
| Big Mummy | 500 | 20 | 80 | UNVERIFIED | /w/Big_Mummy |
| Venus | 500 | 20 | 80 | UNVERIFIED | /w/Venus |
| Giant Bat | UNVERIFIED | UNVERIFIED | UNVERIFIED | UNVERIFIED | /w/Giant_Bat |

### 9.3 Mad Forest bosses (HP scales with player level)

Boss HP = listed HP x the player's level at the moment the boss spawns.
Later level-ups do not change it. [W] Source: /w/Enemies.

| Boss | Listed HP (x player level) | Power | Speed | XP | Example: HP if the player is level 30 [D] | Source |
|---|---:|---:|---:|---:|---:|---|
| Glowing Bat (Pipeestrello 4) | 50 | 10 | 140 | 30 | 1,500 | /w/Pipeestrello |
| Giant Mantichana | 150 | UNVERIFIED | UNVERIFIED | 50 | 4,500 | /w/Mantichana |
| Giant Werewolf | 200 | 20 | 130 | UNVERIFIED | 6,000 | /w/Werewolf |
| Giant Mummy (Big Mummy boss) | 250 | UNVERIFIED | 80 | 25 | 7,500 | /w/Big_Mummy |
| Giant Blue Venus | 150 | 30 | 160 | UNVERIFIED | 4,500 | /w/Blue_Venus |
| Silver Bat | UNVERIFIED | UNVERIFIED | UNVERIFIED | 30 | | /w/Pipeestrello |

### 9.4 Minute-by-minute timeline

"Min" is the enemy minimum and "Int" is the spawn interval in seconds. "Chest"
means the boss drops one. Everything here is [W] from /w/Mad_Forest, pieced
together from several search summaries. Blank cells were missing from every
summary.

| Time | Regular enemies | Min | Int (s) | Boss / event | Chest / notes |
|---|---|---:|---:|---|---|
| 0:00 | Red-Eyed Pipeestrello (bats) | 15 | 1.0 | | |
| 1:00 | Zombie, Little Pipeestrello | 30 | 1.0 | Glowing Bat | Chest. This one can evolve a weapon. |
| 2:00 | Little and Red-Eyed Pipeestrello | 50 | 0.5 | Bat Swarm event at 2:05 | Bat Swarms also at 3:05 and 4:05 |
| 3:00 | Skeleton | 40 | 0.25 | Glowing Bat | Chest |
| 4:00 | Skeleton (variant 2), Ghost | 30 | 1.0 | none | |
| 5:00 | Green Mudman | 10 | 1.0 | Mantichana (boss level 1, cannot evolve) | Flower Wall event |
| 6:00 | Zombie, Green Mudman | 20 | 0.5 | none | 10% chance of a Bat Swarm |
| 7:00 | Pipeestrello variants, Gray Mudman | 80 | 0.5 | Glowing Bat (level 2, cannot evolve) | Chest. 80% chance of Bat Swarm, up to 5 times |
| 8:00 | Zombie | 100 | 1.5 | Giant Bat | 80% chance of Bat Swarm, up to 2 times, 15 s apart |
| 9:00 | Giant Bat, Zombie | 30 | 0.5 | Silver Bat (level 1, cannot evolve) | Chest. 70% chance of Bat Swarm |
| 10:00 | Gray and Green Mudman | 10 | 0.5 | Giant Mantichana | Chest that can evolve. 1-item tier at 100% |
| 11:00 | Skeleton (variant 3) | 300 | 0.1 | Glowing Bat Arcana holder (only when Arcanas are unlocked) | Arcana chest |
| 12:00 | Werewolf, Ghost, Skeleton | 20 | 0.25 | none | |
| 13:00 | Werewolf, Ghost | 150 | 0.5 | Ghost Swarm (time UNVERIFIED) | |
| 14:00 | Giant Bat, Werewolf | 20 | 0.1 | | |
| 15:00 | | 100 | 0.1 | Giant Werewolf | Chest. Flower Wall event |
| 16:00 | Mantichana, Gray and Green Mudman | 100 | | Glowing Bat | Chest |
| 17:00 | Big Mummy | 20 | 1.0 | none | |
| 18:00 | Big Mummy, Gray Mudman | 60 | 0.5 | Silver Bat | Chest at 3% / 10% / 100% |
| 19:00 | Big Mummy, Gray Mudman | 100 | 0.5 | none | |
| 20:00 | Big Mummy, Green Mudman, Giant Bat | 100 | 0.1 | Giant Mummy | Chest. Two Bat Swarms early in the minute |
| 21:00 | Flower Wall | 300 | 0.1 | Venus, plus Glowing Bat Arcana holder | Arcana chest |
| 22:00 | Flower Wall, Big Mummy | 200 | 0.1 | Glowing Bat | Chest |
| 23:00 | Flower Wall, Big Mummy | 300 | 0.1 | Silver Bat | Chest |
| 24:00 | Flower Wall, Big Mummy | 300 | 0.1 | Venus | |
| 25:00 | Venus | 100 | 0.1 | Giant Blue Venus | Killing it unlocks Hyper mode |
| 26:00 | Venus, Flower Wall | 150 | 0.1 | none | |
| 27:00 | Big Mummy, Gray and Green Mudman | 300 | 0.1 | Glowing Bat | Ghost Swarm at the start of the minute (always) |
| 28:00 | (no row in the table; other pages list bats and Giant Bat) | | | | UNVERIFIED |
| 29:00 | Glowing Bat, Silver Bat | 300 | 0.1 | one Glowing Bat is a boss | Bat Swarm at the start of the minute (always) |
| 30:00 | (waves stop) | | | The Reaper | sec. 11 |

**Pacing pattern to copy:** enemy minimums climb from 15 to 50 in the first
3 minutes, sit in the 10 to 100 range through minute 10, then jump to 300 with
a 0.1 s interval from minute 11. Pressure peaks at 11, 21, 23 to 24, 27 and 29.
Calm minutes (17:00 at min 20, 12:00 at min 20) come right after spikes.
Durable enemies arrive at 5 (Mudman 70 to 150 HP), 12 (Werewolf 180 HP) and
17 (Big Mummy 500 HP). Some summaries placed the Venus boss at 21:00 and others
at 24:00 or 25:00. The table above follows the per-row summaries.

---

## 10. Enemy scaling over time and with Curse

| Item | VS rule | Notes | Source |
|---|---|---|---|
| Time scaling (normal stages) | None. Enemies do not gain HP per minute | Difficulty rises only because the wave table swaps in tougher enemies and higher minimums. [W] | /w/Enemies, /w/Stages |
| Boss HP | listed HP x player level at spawn | The "HP x Level" skill. A higher-level player meets tankier bosses. [W] | /w/Enemies |
| Curse and HP | enemy HP x totalCurse | Applies at once to newly spawned enemies. [W] | /w/Curse |
| Curse and speed | enemy speed x totalCurse | Takes effect from the next wave minute. [W] | /w/Curse |
| Curse and spawn rate | spawn interval / totalCurse | Takes effect from the next wave minute. [W] | /w/Enemies |
| Curse and quantity | wave quantity goes up with Curse | Exact multiplier UNVERIFIED. Assume minimum x totalCurse. [W] | /w/Curse |
| Endless cycles | +100% of base Max HP per loop | Endless mode only. [W] | /w/Enemies |
| Special stages | e.g. The Bone Zone: +0.3 HP and +0.05 speed scaling per minute, no cap | Shows the knob exists. Normal stages do not use it. [W] | /w/Stages |
| Bosses | Many resist knockback, some partly resist freeze | [W] | /w/Enemies |

Example [D]: with +50% Curse (Skull O'Maniac at max), totalCurse = 1.5. At
11:00 the 0.1 s interval becomes about 0.067 s, a Mudman's 150 HP becomes 225,
and a Werewolf's speed of 130 becomes 195.

---

## 11. The Reaper (end of stage)

| Item | VS value | Notes | Source |
|---|---|---|---|
| First spawn | 30:00 on 30-minute stages | [W+T] | /w/The_Reaper |
| More Reapers | +1 every minute after 30:00 | Endless mode replaces this with looping waves. [W] | /w/The_Reaper |
| HP | 655,350 x player level at spawn | [W] | /w/The_Reaper |
| Power (damage) | 65,535 | Kills in one hit. [W] | /w/The_Reaper |
| Move speed | 1,200 | About 8 to 12 times a normal enemy (100 to 140). [W] | /w/The_Reaper |
| Outcome | The stage still counts as cleared even though the Reaper kills the player | Survived and died are not exclusive. [T] | /w/Stages |
| Killing it | Possible only with extreme builds or very low-level characters | [W] | /w/The_Reaper/Other_Strategies |

---

## 12. Stage unlocks and Arcana

| Item | VS value | Notes | Source |
|---|---|---|---|
| Inlaid Library | Reach level 20 in Mad Forest (one run) | Counts the moment level 20 is hit, even if the player dies soon after. [W+T] | /w/Inlaid_Library, /w/Achievements |
| Dairy Plant | Reach level 40 in Inlaid Library | [W+T] | /w/Achievements |
| Gallo Tower | Reach level 60 in Dairy Plant | [T] | /w/Gallo_Tower |
| Cappella Magna | Reach level 80 in Gallo Tower | [T] | /w/Cappella_Magna |
| Inlaid Library modifiers | Normal: +25% move speed, gold x1, enemy HP x1. Hyper: +90% move speed, +50% gold, +10% Luck | [W] | /w/Inlaid_Library |
| Dairy Plant modifiers | Normal: +25% move speed, +20% gold. Hyper: +90% move speed, +70% gold, +10% Luck | [W] | /w/Stages |
| Arcana unlock | Pick up the Randomazzo relic in Gallo Tower | First Arcana given: Sarabande of Healing. [W] | /w/Randomazzo |
| Arcana in a run | 1 chosen at the start, +1 at 11:00, +1 at 21:00 (from Arcana-holder bosses) | 3 total in a normal run. [W+T] | /w/Arcanas |
| Hurry mode | Game clock runs at 2x | [T] | /w/Stages |

---

## 13. Pacing facts (community knowledge)

| Item | Value found | Status | Source |
|---|---|---|---|
| Player level by minute in a normal Mad Forest run | No sourced numbers found | UNVERIFIED. The XP table (sec. 2) plus wave minimums are the only basis for a model | none |
| Time to reach level 20 (Library unlock) on a first run | Not quantified. No survival time is required, only the level | UNVERIFIED | /w/Inlaid_Library, trueachievements.com/a374142 |
| Early deaths | New players usually die around 10:00 until they buy a few PowerUps and unlock a few items | Anecdote (Steam forum) | steamcommunity.com/app/1794680/discussions/0/3717188244459521749 |
| First evolution timing | Guides say to have one evolution by about 10:00, when Werewolves and the 10:00 to 11:00 density spike arrive. The 10:00 Giant Mantichana chest is the first reliable evolution chest (1:00 is the early exception) | Partly sourced (wave table) plus an old guide | /w/Mad_Forest, gameplay.tips guide |
| 25:00 as the real test | Giant Blue Venus at 25:00 is the hardest scripted fight. Killing it unlocks Hyper | [W] | /w/Mad_Forest |
| Gold per early run | No number found. Only endgame farm figures (millions per run) | UNVERIFIED | Steam guides 2942086449, 2963344156 |
| Runs needed to unlock stage 2 or 3 | No number found | UNVERIFIED | none |

### Rough gold budget from known rules [D, not a VS measurement]

About 12 chest bosses in a full 30-minute Mad Forest run (1, 3, 7, 9, 10, 15,
16, 18, 20, 22, 23, 27, 29) x about 150 gold per 1-item chest gives roughly
1,800 to 2,000 gold, plus light-source coins (mostly 1-gold coins, about 13%
10-gold bags). A full clear with no Greed therefore lands in the low thousands.
A death at 8 to 10 minutes yields a few hundred. Compare: the cheapest
characters cost 10 and 100, and the first PowerUp ranks cost 100 to 200. Use
this to sanity-check Snack Attack's economy, not as a VS fact.

---

## 14. Gaps

1. **Direct wiki access was blocked.** Every [W] value came through search
   summaries. Spot-check the weapon tables and the Mad Forest wave table in a browser.
2. **Missing or uncertain cells:**
   - Knife: which level gives the third Amount, and which level cuts the interval.
   - Cross: base damage and per-level Area and Speed sizes.
   - Runetracer: size of each Duration step.
   - Heaven Sword: base damage (77 looks high).
   - Santa Water: duration total (steps add to 1.1 s, page says 1.0 s).
   - Attractorb: per-level %.
3. **Enemy stats** for Skeleton, Giant Bat, Silver Bat and Giant Mantichana's
   power and speed. XP values for most enemies.
4. **Mad Forest timeline:** 28:00 row, 13:00 to 15:00 enemy lists, and an
   exact Venus boss minute (21:00 vs 24:00 vs 25:00 across summaries).
5. **Curse:** exact quantity multiplier.
6. **Prices:** character price surcharge formula.
7. **Characters:** Imelda, Pasqualina and Porta level-bonus numbers, and the
   starting stats of Arca, Porta, Lama, Clerici, Dommario and Mortaccio.
8. **Light sources:** rarer drops (Little Clover, Nduja, Clock Lancet and others).
9. **Pacing:** no sourced player-level-per-minute curve, gold-per-run figure, or
   runs-to-unlock figure exists in what was reachable. Section 13 gives derived
   estimates only. Measure our own with `tools/snack_bot.js` instead.
