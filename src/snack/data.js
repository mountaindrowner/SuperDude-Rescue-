// snack/data.js - SNACK ATTACK content (v0.80.0). The survivors-style
// mode built from Mark's "Vampire Survivors Game Template" (2026-11-10).
// Everything here is DATA: stages, waves, heroes, PowerUps, the item
// pools and the achievement catalogue. Code in snack/*.js reads it; new
// heroes / weapons / achievements are rows here, not new code paths.
//
// Mark's calls on top of the template:
//   * 15-minute runs (the template's 30:00 beat sheet, halved)
//   * a SEPARATE save from Story mode (portioncontrol.snack)
//   * the title button reads SNACK ATTACK
// Template tags used in comments: [VS] = a documented Vampire Survivors
// rule kept as-is; [TUNABLE] = our number, measured by the balance bot,
// not a claim about the original game.
window.PC = window.PC || {};

PC.SNACK = {
  RUN_SEC: 900,               // 15:00 stage clear (Mark; template is 30:00)
  WEAPON_SLOTS: 6,            // [VS] six weapons
  PASSIVE_SLOTS: 6,           // [VS] six passives
  WEAPON_MAX: 8,              // [VS] base weapons have eight ranks
  EVO_CHEST_FROM_SEC: 300,    // [TUNABLE] evolution chests from 5:00 (VS 10:00, halved)
  GEM_VALUE: 4.0,             // [TUNABLE] XP per gem point, set by the balance bot (tools/snack_bot.js)
  COIN_ODDS: 0.05,            // [TUNABLE] a regular pop rarely drops a coin (gold is not a kill salary)
  CRATE_EVERY: 16,            // [TUNABLE] seconds between breakables (template 20-45s; kids get more)
  FOURTH_CARD_PER_LUCK: 0.5,  // [TUNABLE] chance of a 4th draft card per +100% luck
  HERO_PRICE_STEP: 0.10,      // [VS] +10% of base per hero already bought (additive)
  HERO_PRICE_CAP: 2.0,        // [TUNABLE] price never above 2x base
};

// ---- XP curve [VS]: 5 XP for level 2, then +10 per level to 20, +13 to
// 40, +16 after, with the two big walls at 20 and 40. Spike sizes are
// [TUNABLE] (scaled to our 15-minute clock by the bot).
PC.SNACK.XP_SPIKES = { 20: 300, 40: 1200 };
PC.SNACK.xpToNext = function (level) {
  var need = 5, L;
  for (L = 2; L <= level; L++) need += (L <= 20 ? 10 : L <= 40 ? 13 : 16);
  return need + (PC.SNACK.XP_SPIKES[level] || 0);
};

// ---- WAVE TEMPLATE: one row per minute of the 15. [TUNABLE]
// Each row: interval seconds, spawns per tick, live cap, tier weights
// A (basic) / B (fast, weak) / C (sturdy) / D (odd one) / E (heavy), and
// a label for the beat it plays. Stages map tiers to their own roster and
// may override rows, so every district keeps its own wave identity.
PC.SNACK.WAVE_ROWS = [
  //  int   per cap   A  B  C  D  E   beat
  [  0.90, 1,  40, [1, 0, 0, 0, 0], 'learn' ],            // 0
  [  0.75, 1,  70, [7, 3, 0, 0, 0], 'first elite' ],      // 1
  [  0.80, 2, 100, [5, 3, 2, 0, 0], 'faster pressure' ],  // 2
  [  0.78, 2, 115, [4, 2, 3, 1, 0], 'mixed' ],            // 3
  [  0.66, 3, 130, [2, 6, 1, 1, 0], 'small swarm' ],      // 4
  [  0.80, 2, 125, [3, 1, 3, 2, 1], 'respite + elite' ],  // 5
  [  0.60, 2, 155, [2, 1, 3, 3, 1], 'variety' ],          // 6
  [  0.45, 3, 200, [3, 2, 2, 2, 1], 'the district boss' ],// 7
  [  0.36, 3, 230, [2, 6, 1, 1, 1], 'power-fantasy wave' ],// 8
  [  0.34, 3, 240, [2, 2, 3, 2, 2], 'threat mix' ],       // 9
  [  0.30, 3, 260, [2, 1, 2, 3, 2], 'elite threshold' ],  // 10
  [  0.28, 3, 270, [1, 4, 2, 2, 2], 'rush' ],             // 11
  [  0.26, 4, 280, [2, 2, 2, 2, 3], 'elite pack' ],       // 12
  [  0.24, 4, 290, [1, 2, 2, 3, 3], 'dense' ],            // 13
  [  0.22, 4, 300, [2, 2, 2, 3, 4], 'the last crowd' ],   // 14
];
// timed set pieces [TUNABLE]: elites drop chests, rings close in
PC.SNACK.EVENTS = [
  { at: 60,  type: 'elite', tier: 'C', chest: 'normal' },   // early, non-evolution
  { at: 150, type: 'ring',  tier: 'A', n: 18 },
  { at: 180, type: 'elite', tier: 'C', chest: 'normal' },
  { at: 255, type: 'ring',  tier: 'B', n: 24 },
  { at: 300, type: 'elite', tier: 'C', chest: 'normal' },   // first evolution window
  { at: 450, type: 'boss' },                                 // the district boss
  { at: 540, type: 'elite', tier: 'D', chest: 'normal' },
  { at: 600, type: 'elite', tier: 'E', chest: 'normal' },
  { at: 660, type: 'ring',  tier: 'C', n: 26 },
  { at: 720, type: 'elite', tier: 'C', chest: 'normal' },
  { at: 722, type: 'elite', tier: 'E', chest: 'normal' },
  { at: 840, type: 'ring',  tier: 'E', n: 20 },
];

// ---- THE FIVE STAGES: the district ladder. Gates are [TUNABLE] versions
// of the [VS] 20/40/60/80 rule for a 15-minute run: reach the level
// DURING a run of the previous stage and the next one opens on the spot,
// even if you lose a second later. Each stage is a different shape of
// map, so it plays differently, not just harder.
PC.SNACK.STAGES = [
  { id: 'street', title: 'MAIN STREET', map: null, roster: ['fry', 'popcorn', 'hotdog', 'toast', 'pretzel'],
    boss: 'frank', shape: 'OPEN CITY', blurb: 'Endless downtown streets. The fries started it.',
    mods: { enemyHp: 1.0, gold: 1.0, xp: 1.0 }, gate: null },
  { id: 'park', title: 'ADVENTURE PARK', map: 'park', roster: ['apple', 'peeler', 'tomato', 'banana', 'melon'],
    boss: 'broccolisk', shape: 'WINDING PATHS', blurb: 'Trees, ponds and very rude produce.',
    mods: { enemyHp: 1.1, gold: 1.15, xp: 1.1 }, gate: { stage: 'street', level: 20 },
    relic: { id: 'recipebook', landmark: 'carousel' } },
  { id: 'suburbs', title: 'SWEET SUBURBS', map: 'suburbs', roster: ['donut', 'chipbit', 'cupcake', 'frosting', 'golemite'],
    boss: 'cakeColossus', shape: 'CURVY STREETS', blurb: 'Cul-de-sacs buried in frosting.',
    mods: { enemyHp: 1.2, gold: 1.3, xp: 1.2 }, gate: { stage: 'park', level: 30 } },
  { id: 'labs', title: 'SUPER DUDE LABS', map: 'labs', roster: ['zipper', 'sodacan', 'chipbag', 'menace', 'burger'],
    boss: 'vendingBehemoth', shape: 'FACTORY MAZE', blurb: 'Pipes, yards and mutated junk.',
    mods: { enemyHp: 1.32, gold: 1.45, xp: 1.3 }, gate: { stage: 'suburbs', level: 40 } },
  { id: 'underground', title: 'THE UNDERGROUND', map: 'sewers', roster: ['blob', 'drip', 'eggy', 'moldy', 'heap'],
    boss: 'gloopKing', shape: 'TUNNELS', blurb: 'Dark tunnels and the stickiest crowd yet.',
    mods: { enemyHp: 1.45, gold: 1.6, xp: 1.4 }, gate: { stage: 'labs', level: 50 } },
];
PC.SNACK.stageById = function (id) {
  for (var i = 0; i < PC.SNACK.STAGES.length; i++) if (PC.SNACK.STAGES[i].id === id) return PC.SNACK.STAGES[i];
  return null;
};
PC.SNACK.TIERS = ['A', 'B', 'C', 'D', 'E'];

// ---- HEROES: [VS] one owned, three for sale from the start, the rest
// earned by an achievement and then bought. Every hero keeps their Story
// kit (signature weapon + kit passive) as their identity.
PC.SNACK.HEROES = [
  { id: 'danny',    price: 0,   owned: true },
  { id: 'victoria', price: 10,  forSale: true },
  { id: 'josh',     price: 100, forSale: true },
  { id: 'kevin',    price: 500, forSale: true },
  { id: 'carlos',   price: 500, unlockBy: 'carlos' },
  { id: 'nayah',    price: 500, unlockBy: 'nayah' },
];
PC.SNACK.heroDef = function (id) {
  for (var i = 0; i < PC.SNACK.HEROES.length; i++) if (PC.SNACK.HEROES[i].id === id) return PC.SNACK.HEROES[i];
  return null;
};

// ---- POWERUPS: the gold shop. [VS] base prices, rank caps and per-rank
// roles from the template's table; kid-friendly names; the cost of a
// rank uses the [VS] fee formula in snack/profile.js.
PC.SNACK.POWERUPS = [
  { id: 'might',    name: 'BIGGER MUSCLES', icon: 'icon_passive_battery', price: 200,  max: 5, desc: 'Everything hits 5% harder per rank',
    apply: function (s, r) { s.stats.heroDmg *= 1 + 0.05 * r; } },
  { id: 'armor',    name: 'ARMOR OF GOD',   icon: 'icon_passive_coat',    price: 600,  max: 3, desc: 'Every hit hurts you 1 less per rank',
    apply: function (s, r) { s.stats.metaArmor += r; } },
  { id: 'maxhp',    name: 'BIG APPETITE',   icon: 'icon_passive_leftovers', price: 200, max: 3, desc: '+10 max health per rank',
    apply: function (s, r) { s.stats.metaHp += 10 * r; } },
  { id: 'recovery', name: 'DAILY BREAD',    icon: 'still_d1_toast',       price: 200,  max: 5, desc: 'Heal 0.1 health every second per rank',
    apply: function (s, r) { s.stats.metaRegen += 0.1 * r; } },
  { id: 'cooldown', name: 'QUICK HANDS',    icon: 'icon_passive_fan',     price: 900,  max: 2, desc: 'All weapons fire 2.5% sooner per rank',
    apply: function (s, r) { s.stats.heroCd *= 1 - 0.025 * r; } },
  { id: 'area',     name: 'LONG ARMS',      icon: 'icon_passive_servo',   price: 300,  max: 2, desc: 'Blasts, rings and swings 5% wider per rank',
    apply: function (s, r) { s.stats.metaArea *= 1 + 0.05 * r; } },
  { id: 'speed',    name: 'FAST FOOD',      icon: 'icon_passive_lens',    price: 300,  max: 2, desc: 'Anything you shoot flies 10% faster per rank',
    apply: function (s, r) { s.stats.metaProj *= 1 + 0.10 * r; } },
  { id: 'duration', name: 'SLOW SIMMER',    icon: 'icon_passive_slowcooker', price: 300, max: 2, desc: 'Slows, freezes and burns last 15% longer per rank',
    apply: function (s, r) { s.stats.metaDur *= 1 + 0.15 * r; } },
  { id: 'amount',   name: 'SECOND HELPING', icon: 'icon_passive_duplicator', price: 5000, max: 1, desc: 'Shooting weapons fire +1 extra shot',
    apply: function (s, r) { s.stats.metaExtraProj += r; } },
  { id: 'move',     name: 'RUNNING START',  icon: 'icon_passive_shoes',   price: 600,  max: 2, desc: 'You run 5% faster per rank',
    apply: function (s, r) { s.stats.heroSpd *= 1 + 0.05 * r; } },
  { id: 'magnet',   name: 'SNACK RADAR',    icon: 'icon_passive_magnet',  price: 300,  max: 2, desc: 'Gems and coins fly to you from 25% farther per rank',
    apply: function (s, r) { s.stats.metaPickup *= 1 + 0.25 * r; } },
  { id: 'luck',     name: 'LUCKY SPOON',    icon: 'pickup_coin',          price: 600,  max: 3, desc: 'Better chests and more 4-card level-ups (+10% luck per rank)',
    apply: function (s, r) { s.stats.metaLuck += 0.10 * r; } },
  { id: 'growth',   name: 'GOLD STAR',      icon: 'gem_gold',             price: 900,  max: 5, desc: 'Gems give 3% more experience per rank',
    apply: function (s, r) { s.stats.metaGrowth *= 1 + 0.03 * r; } },
  { id: 'greed',    name: 'PIGGY BANK',     icon: 'pickup_chest_1',       price: 200,  max: 5, desc: 'Coins are worth 10% more per rank',
    apply: function (s, r) { s.stats.metaGreed *= 1 + 0.10 * r; } },
  { id: 'curse',    name: 'TOUGH CROWD',    icon: 'enemy_golden_snack_walk_1', price: 1666, max: 5, desc: 'MORE snacks, faster and tougher (+10% per rank). For experts!',
    apply: function (s, r) { s.stats.curse += 0.10 * r; } },
  { id: 'revival',  name: 'AMAZING GRACE',  icon: 'pickup_medkit',        price: 10000, max: 1, desc: 'Get back up once per run at half health',
    apply: function (s, r) { s.reviveCharges = (s.reviveCharges || 0) + r; } },
  { id: 'reroll',   name: 'DO-OVER',        icon: 'icon_passive_fan',     price: 1000, max: 5, desc: '+2 level-up rerolls per run per rank',
    apply: function (s, r) { s.snack.rerolls += 2 * r; } },
  { id: 'skip',     name: 'NO THANKS',      icon: 'icon_passive_shoes',   price: 100,  max: 5, desc: '+2 level-up skips per run per rank',
    apply: function (s, r) { s.snack.skips += 2 * r; } },
  { id: 'banish',   name: 'NEVER AGAIN',    icon: 'icon_passive_coat',    price: 100,  max: 5, desc: '+2 banishes per run per rank (remove a card for the run)',
    apply: function (s, r) { s.snack.banishes += 2 * r; } },
];
PC.SNACK.powerupById = function (id) {
  for (var i = 0; i < PC.SNACK.POWERUPS.length; i++) if (PC.SNACK.POWERUPS[i].id === id) return PC.SNACK.POWERUPS[i];
  return null;
};

// ---- WEAPON POOL: what level-up drafts may offer. `start: true` = in
// the pool on a fresh save; everything else is an achievement reward.
// Hero kits (Sentry Bot, Comet Call, Haymaker) are starting gear only.
PC.SNACK.WEAPONS = {
  blaster:   { title: 'PORTION BLASTER',   desc: 'Short-range snack scatter',       start: true, make: function (s) { return new PC.BlasterWeapon(); } },
  whisk:     { title: 'WHISK CYCLONE',     desc: 'Whisks orbit and batter foes',     start: true, make: function (s) { return new PC.WhiskWeapon(s); } },
  salt:      { title: 'SALT SHAKER',       desc: 'A stinging ring of seasoning',     start: true, make: function (s) { return new PC.SaltWeapon(s); } },
  microwave: { title: 'MICROWAVE BEAM',    desc: 'A beam sweeps around you',         start: true, make: function (s) { return new PC.MicrowaveWeapon(s); } },
  fridge:    { title: 'FRIDGE WALL',       desc: 'Drops a chilling barrier wall',    start: true, make: function (s) { return new PC.FridgeWeapon(s); } },
  drone:     { title: 'THE GIZMOTRON',     desc: 'A loyal whirring gizmo pal',       make: function (s) { return new PC.DroneWeapon(s); } },
  freeze:    { title: 'FREEZE RAY',        desc: 'Chills foes to a crawl',           make: function (s) { return new PC.FreezeWeapon(); } },
  ketchup:   { title: 'KETCHUP ARTILLERY', desc: 'Shells burst into slowing puddles', make: function (s) { return new PC.KetchupWeapon(s); } },
  cutter:    { title: 'PIZZA CUTTER',      desc: 'A spinning cutter that returns',   make: function (s) { return new PC.CutterWeapon(); } },
  zap:       { title: 'TOASTER ZAP',       desc: 'Zaps arc between close foes',      make: function (s) { return new PC.ZapWeapon(s); } },
  grease:    { title: 'GREASE TRAIL',      desc: 'A burning slick trails behind you', make: function (s) { return new PC.GreaseWeapon(s); } },
  jaw:       { title: 'JAWBREAKER',        desc: 'A candy that caroms off foes',     make: function (s) { return new PC.JawWeapon(); } },
  sprinkle:  { title: 'SPRINKLE SWARM',    desc: 'Homing sprinkles seek foes',       make: function (s) { return new PC.SprinkleWeapon(); } },
  skillet:   { title: 'SKILLET SWING',     desc: 'A mighty pan swing forward',       make: function (s) { return new PC.SkilletWeapon(s); } },
  vortex:    { title: 'VORTEX MIXER',      desc: 'Pulls foes into a tight pile',     make: function (s) { return new PC.VortexWeapon(s); } },
  espresso:  { title: 'ESPRESSO CANNON',   desc: 'Charges while you stand still',    make: function (s) { return new PC.EspressoWeapon(s); } },
  pineapple: { title: 'PINEAPPLE GUARD',   desc: 'Spiky aura that bites back',       make: function (s) { return new PC.PineappleWeapon(s); } },
  resizer:   { title: 'RESIZER RAY',       desc: "Danny's trusty shrink ray",        make: function (s) { return new PC.ResizerWeapon(); } },
  sentry:    { title: 'POCKET SENTRY',     desc: "Vic's pellet turrets",             make: function (s) { return new PC.SentryWeapon(s); } },
  lasso:     { title: 'ROPE CYCLONE',      desc: "Josh's spinning rope ring",        make: function (s) { return new PC.LassoWeapon(s); } },
  strike:    { title: 'RESCUE STRIKE',     desc: "Kevin's marked air strafe",        make: function (s) { return new PC.StrikeWeapon(s); } },
  beam:      { title: 'COMET BEAM',        desc: "Carlos' far-piercing comet",       make: function (s) { return new PC.BeamWeapon(s); } },
  seeds:     { title: 'THORN SEEDS',       desc: "Nayah's blooming thorn patches",   make: function (s) { return new PC.SeedWeapon(s); } },
};
// passives offered at the start [VS: damage + armor]; the rest are earned
PC.SNACK.PASSIVES_START = ['battery', 'coat'];

// ---- PICKUPS from breakables [VS roles]: coin, coin bag, heal, vacuum,
// screen-clear, freeze. Weights [TUNABLE].
PC.SNACK.CRATE_TABLE = [
  { kind: 'coin',    w: 34 },
  { kind: 'coinbag', w: 10 },
  { kind: 'medkit',  w: 26 },
  { kind: 'vacuum',  w: 10 },
  { kind: 'bomb',    w: 8 },
  { kind: 'freeze',  w: 7 },
  { kind: 'penny',   w: 5 },
];

// ---- CHESTS [VS]: 1 / 3 / 5 rewards, odds nudged by luck [TUNABLE]
PC.SNACK.CHEST = {
  normal: { three: 0.10, five: 0.02, gold: [25, 60] },
  boss:   { three: 0.70, five: 0.30, gold: [120, 200] },
};

// ---- RELICS [VS role]: one-time map finds that switch on a system
PC.SNACK.RELICS = {
  recipebook: { name: 'THE RECIPE BOOK', desc: 'Evolution recipes you have found now show in the PAUSE menu.' },
};
