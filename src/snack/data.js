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

PC.SNACK = {};   // every gameplay KNOB lives in snack/tuning.js (v0.80.7)

// ---- THE FIVE STAGES: the district ladder. Content only: each stage's
// difficulty, gold/XP bonus, overtime speed and unlock gate are KNOBS in
// snack/tuning.js (STAGE_TUNE), applied onto these rows at load.
PC.SNACK.STAGES = [
  { id: 'street', title: 'MAIN STREET', map: null, roster: ['fry', 'popcorn', 'hotdog', 'toast', 'pretzel'],
    boss: 'frank', shape: 'OPEN CITY', blurb: 'Endless downtown streets. The fries started it.', },
  { id: 'park', title: 'ADVENTURE PARK', map: 'park', roster: ['apple', 'peeler', 'tomato', 'banana', 'melon'],
    boss: 'broccolisk', shape: 'WINDING PATHS', blurb: 'Trees, ponds and very rude produce.',
    relic: { id: 'recipebook', landmark: 'carousel' } },
  { id: 'suburbs', title: 'SWEET SUBURBS', map: 'suburbs', roster: ['donut', 'chipbit', 'cupcake', 'frosting', 'golemite'],
    boss: 'cakeColossus', shape: 'CURVY STREETS', blurb: 'Cul-de-sacs buried in frosting.', },
  { id: 'labs', title: 'SUPER DUDE LABS', map: 'labs', roster: ['zipper', 'sodacan', 'chipbag', 'menace', 'burger'],
    boss: 'vendingBehemoth', shape: 'FACTORY MAZE', blurb: 'Pipes, yards and mutated junk.', },
  { id: 'underground', title: 'THE UNDERGROUND', map: 'sewers', roster: ['blob', 'drip', 'eggy', 'moldy', 'heap'],
    boss: 'gloopKing', shape: 'TUNNELS', blurb: 'Dark tunnels and the stickiest crowd yet.', },
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

// ---- RELICS [VS role]: one-time map finds that switch on a system
PC.SNACK.RELICS = {
  recipebook: { name: 'THE RECIPE BOOK', desc: 'Evolution recipes you have found now show in the PAUSE menu.' },
};
