// snack/tuning.js - SNACK ATTACK TUNING (v0.80.7). EVERY gameplay knob for
// the survivors mode lives here, and only here. Each knob shows our value
// and, after "vs:", the Vampire Survivors reference it is tuned against
// (numbers and rules from docs/VS_REFERENCE.md; the side-by-side and the
// plan are in docs/VS_PARITY.md). Change a number here, run
//   node tests/snack_acceptance.js      (rules still hold)
//   node tools/snack_bot.js 3 street danny 6 1   (how it plays)
// and nothing else needs touching.
//
// Story mode never reads this file: Snack-only copies of shared numbers
// (enemy growth, passives, weapon levels, hero growth) are kept here so
// tuning Snack can't move the campaign.
//
// Fixed differences we KEEP (Mark's calls): 15-minute runs (VS 30:00, so VS
// timelines compress x0.5), a separate save, the kid-friendly OVERTIME
// ending instead of a one-hit Reaper.
window.PC = window.PC || {};
PC.SNACK = PC.SNACK || {};
(function (T) {

  // ================================================================== RUN
  T.RUN_SEC = 900;              // stage clear at 15:00          vs: 1800 (30:00)
  T.WEAPON_SLOTS = 6;           // weapon slots                  vs: 6
  T.PASSIVE_SLOTS = 6;          // item slots                    vs: 6
  T.WEAPON_MAX = 8;             // weapon levels                 vs: 8
  T.EVO_CHEST_FROM_SEC = 300;   // evolution chests from 5:00    vs: 10:00 (x0.5)

  // ============================================================ XP / LEVELS
  // XP to the next level: 5, then +10 per level to 20, +13 to 40, +16
  // after, plus a wall at 20 and 40.                 vs: same formula
  T.XP_SPIKES = { 20: 300, 40: 1200 };              // vs: +600 / +2400
  T.xpToNext = function (level) {
    var need = 5, L;
    for (L = 2; L <= level; L++) need += (L <= 20 ? 10 : L <= 40 ? 13 : 16);
    return need + (T.XP_SPIKES[level] || 0);
  };
  // XP per gem point. Stands in for the 30 -> 15 minute compression: VS
  // levels are reached in half the clock here.       vs: enemy XP x Growth
  // v0.80.6: 4.0 -> 3.0 (first runs hit LV 21-41 once gems stopped
  // orbiting uncollected; gates flew open).
  T.GEM_VALUE = 3.0;
  // chance of a 4th level-up card per +100% luck
  T.FOURTH_CARD_PER_LUCK = 0.5;                     // vs: P = 1 - 1/totalLuck

  // =============================================================== ENEMIES
  // Snack's own copy of enemy growth per minute (Story keeps PC.TIMESCALE).
  T.ENEMY_HP_PER_MIN = 0.06;                        // vs: 0 (VS swaps tougher TYPES in instead)
  T.ENEMY_DMG_PER_MIN = 0.025;                      // vs: 0

  // ---- WAVES: one row per minute of the 15. Each row: spawn interval s,
  // spawns per tick, live cap, tier weights A (basic) / B (fast, weak) /
  // C (sturdy) / D (odd one) / E (heavy), and a label for the beat.
  // vs: per minute an on-screen MINIMUM (refilled at once) + an interval;
  //     Mad Forest minimums 15 -> 50 in 3 min, 10-100 to min 10, then 300.
  T.WAVE_ROWS = [
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

  // ---- TIMED SET PIECES: golden elites carry chests, rings close in.
  // vs: Mad Forest minute bosses at 1, 3, 5, 7, 9, 10, 15, 16, 18, 20, 22,
  //     23, 25, 27, 29 (most drop a chest), Arcana holders at 11 and 21.
  T.EVENTS = [
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

  // ---- THE DISTRICT BOSS: survived first, beaten later (v0.80.3, Mark).
  // HP = its Story HP x PER_LEVEL x max(MIN_LEVEL, your level at spawn).
  // vs: boss HP = listed HP x player level at spawn
  T.BOSS_HP_PER_LEVEL = 0.8;
  T.BOSS_HP_MIN_LEVEL = 12;

  // ---- OVERTIME: the Reaper beat (v0.80.4, Mark's call). At 15:00 the
  // clear is banked, the district boss SUPERSIZES (or returns): it can't
  // be hurt, its touch knocks you out, and it chases faster and faster.
  // vs: Reaper at 30:00, 655,350 x level HP, one-hit kill, speed 1,200,
  //     +1 Reaper per minute. Ours is a kid version you can outrun a while.
  T.OVERTIME = {
    CELEBRATE_SEC: 2.6,   // the YOU SURVIVED moment before it starts
    SPEED0: 0.70,         // chase speed as a fraction of YOUR move speed...
    RAMP: 0.06,           // ...plus this much every RAMP_EVERY seconds
    RAMP_EVERY: 5,
    GOLD: 5,              // bonus gold every GOLD_EVERY seconds survived
    GOLD_EVERY: 5,
    CONTACT: 9999,        // one touch = down (AMAZING GRACE still saves once)
    SCALE: 1.45,          // how much bigger it gets
  };

  // ================================================================ STAGES
  // Per stage: enemy HP, gold and XP multipliers, overtime chase speed
  // (maze maps slower: it floats through walls, you can't), and the gate
  // that opens it (reach this level in a run of the previous stage).
  // enemyHp is tuned to the ROSTER (each district's snacks are already
  // tougher than Main Street's): effective HP ramps ~1.0/1.15/1.35/1.5/1.7x.
  // vs: gates level 20 / 40 / 60 / 80 in 30-min runs; later stages add
  //     move speed and gold (Dairy Plant +20% gold).
  T.STAGE_TUNE = {
    street:      { mods: { enemyHp: 1.0,  gold: 1.0,  xp: 1.0 }, otSpeed: 1.0,  gate: null },
    park:        { mods: { enemyHp: 1.1,  gold: 1.15, xp: 1.1 }, otSpeed: 0.92, gate: { stage: 'street',  level: 20 } },
    suburbs:     { mods: { enemyHp: 1.1,  gold: 1.3,  xp: 1.2 }, otSpeed: 0.95, gate: { stage: 'park',    level: 30 } },
    labs:        { mods: { enemyHp: 0.85, gold: 1.45, xp: 1.3 }, otSpeed: 0.85, gate: { stage: 'suburbs', level: 40 } },
    underground: { mods: { enemyHp: 1.15, gold: 1.6,  xp: 1.4 }, otSpeed: 0.85, gate: { stage: 'labs',    level: 50 } },
  };

  // ================================================== CHESTS, GOLD, SHOP
  // chest contents: 1 / 3 / 5 rewards (5 rolled first, then 3), each
  // chance x (1 + luck); gold paid on top.
  // vs: typical boss row 5-item 3% / 3-item 10% / 1-item 100%, x totalLuck;
  //     chest gold 100-200 / 300-600 / 500-1,000 (VS-sized economy).
  T.CHEST = {
    normal: { three: 0.10, five: 0.02, gold: [25, 60] },
    boss:   { three: 0.70, five: 0.30, gold: [120, 200] },
  };
  // a regular pop rarely drops a coin (gold is not a kill salary)
  T.COIN_ODDS = 0.05;           // vs: coins come from light sources, not kills
  // seconds between breakable crates (kids get more than the template's 20-45 s)
  T.CRATE_EVERY = 16;           // vs: light sources (braziers) on the map
  // what a crate drops (weights)
  // vs: light-source weights coin 50 / bag 10 / rich bag 1 / chicken 12 /
  //     clock 2 / rosary 1 / vacuum 2 (non-gold x luck)
  T.CRATE_TABLE = [
    { kind: 'coin',    w: 34 },
    { kind: 'coinbag', w: 10 },
    { kind: 'medkit',  w: 26 },
    { kind: 'vacuum',  w: 10 },
    { kind: 'bomb',    w: 8 },
    { kind: 'freeze',  w: 7 },
    { kind: 'penny',   w: 5 },
  ];
  // PowerUp price = (base x (owned + 1) + floor(20 x 1.1^all ranks)) x this.
  // vs: same formula at x1, but VS runs pay VS-sized gold; ours bank ~130.
  T.PRICE_SCALE = 0.5;
  T.HERO_PRICE_STEP = 0.10;     // +10% of base per hero already bought     vs: a surcharge (formula unverified)
  T.HERO_PRICE_CAP = 2.0;       // never above 2x base

})(PC.SNACK);

// apply the stage tuning onto the content rows (data.js loads first)
(function () {
  var S = PC.SNACK;
  if (!S.STAGES) return;
  S.STAGES.forEach(function (st) {
    var t = S.STAGE_TUNE[st.id];
    if (!t) return;
    st.mods = t.mods; st.otSpeed = t.otSpeed; st.gate = t.gate;
  });
})();
