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
  // v0.80.9 (VS parity phase 3): VS's own walls, with VS's bridge - while
  // you're ON a wall level every gem counts x(1 + WALL_GROWTH), so the big
  // bar fills fast instead of stalling (time on a wall ~ the old 300/1200)
  T.XP_SPIKES = { 20: 600, 40: 2400 };              // vs: +600 / +2400
  T.WALL_GROWTH = 1.0;                              // vs: +100% Growth until the next level
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
  // v0.80.8 (VS parity phase 2): NO per-minute HP/damage creep. VS keeps
  // every enemy's stats fixed and gets harder by swapping tougher TYPES in
  // on schedule; ours does the same with each minute's `hp`/`dmg` step
  // below (the tougher versions are drawn bigger so you SEE them arrive).
  T.ENEMY_HP_PER_MIN = 0;                           // vs: 0 (was 0.06 until v0.80.7)
  T.ENEMY_DMG_PER_MIN = 0;                          // vs: 0 (was 0.025)

  // ---- WAVES: one row per minute of the 15 (VS's 30 compressed x0.5).
  //   min  : on-screen MINIMUM. Below it the stage refills at once (a few
  //          per frame, so nothing pops in a heap).    vs: same rule
  //   int  : with the minimum met, `per` more every `int` seconds...
  //   max  : ...but only up to `max` on screen, so quiet minutes really are
  //          quiet (without it every minute filled to the 300 cap).
  //   hp / dmg : the toughness step for this minute's cast (stepped, not
  //          creeping: tougher versions ARRIVE).       vs: new types at 5 / 12 / 17
  //   w    : cast weights over the stage roster's tiers A (basic) / B (fast,
  //          weak) / C (sturdy) / D (odd one) / E (heavy).
  // vs Mad Forest minimums: 15, 30, 50, 40, 30, 10, 20, 80, 100, 30, 10,
  //   300 (11:00), 20, 150, 20, 100, 100, 20, 60, 100, 100, 300, 200, 300,
  //   300, 100, 150, 300, -, 300: spikes with breathers after them.
  T.WAVES = [
    { max:  40, min:  20, int: 1.00, per: 1, hp: 1.00, dmg: 1.00, w: [1, 0, 0, 0, 0], beat: 'learn' },               // 0  vs 0-1
    { max:  70, min:  45, int: 0.60, per: 1, hp: 1.00, dmg: 1.00, w: [6, 4, 0, 0, 0], beat: 'first swarm' },         // 1  vs 2-3
    { max:  60, min:  25, int: 0.80, per: 2, hp: 1.00, dmg: 1.00, w: [4, 3, 3, 0, 0], beat: 'breather' },            // 2  vs 4-5
    { max: 100, min:  60, int: 0.50, per: 2, hp: 1.15, dmg: 1.05, w: [3, 3, 3, 1, 0], beat: 'sturdy ones arrive' },  // 3  vs 6-7
    { max: 130, min:  80, int: 0.50, per: 2, hp: 1.15, dmg: 1.05, w: [2, 5, 2, 1, 0], beat: 'fast swarm' },          // 4  vs 8-9
    { max: 160, min: 110, int: 0.20, per: 2, hp: 1.25, dmg: 1.08, w: [3, 4, 2, 1, 0], beat: 'THE BIG SWARM' },       // 5  vs 10-11
    { max:  90, min:  40, int: 0.40, per: 2, hp: 1.25, dmg: 1.08, w: [2, 1, 3, 3, 1], beat: 'breather, heavies' },   // 6  vs 12
    { max: 160, min: 110, int: 0.30, per: 3, hp: 1.55, dmg: 1.15, w: [3, 2, 2, 2, 1], beat: 'the district boss' },   // 7  vs 13-14
    { max: 130, min:  70, int: 0.25, per: 3, hp: 1.55, dmg: 1.15, w: [2, 4, 2, 1, 1], beat: 'power fantasy' },       // 8  vs 15-16
    { max: 180, min: 110, int: 0.25, per: 3, hp: 1.80, dmg: 1.25, w: [2, 2, 3, 2, 2], beat: 'threat mix' },          // 9  vs 17-18
    { max: 160, min:  90, int: 0.30, per: 3, hp: 1.80, dmg: 1.25, w: [1, 2, 2, 3, 2], beat: 'heavies' },             // 10 vs 19-20
    { max: 270, min: 220, int: 0.10, per: 3, hp: 2.10, dmg: 1.35, w: [2, 3, 2, 2, 2], beat: 'THE FLOOD' },           // 11 vs 21-22
    { max: 290, min: 240, int: 0.10, per: 4, hp: 2.10, dmg: 1.35, w: [1, 2, 2, 3, 3], beat: 'the flood, heavier' },  // 12 vs 23-24
    { max: 230, min: 160, int: 0.12, per: 4, hp: 2.40, dmg: 1.45, w: [1, 1, 2, 3, 4], beat: 'the test' },            // 13 vs 25-26
    { max: 300, min: 280, int: 0.10, per: 4, hp: 2.40, dmg: 1.45, w: [2, 2, 2, 3, 4], beat: 'the last crowd' },      // 14 vs 27-29
  ];
  T.REFILL_PER_FRAME = 6;       // spawns per frame while below the minimum
  T.BOSS_BREATHER = 0.6;        // minimum x this while the district boss is up (let the fight breathe)

  // ---- TIMED SET PIECES: golden elites carry chests (from EVO_CHEST_FROM_SEC
  // they can evolve), rings are VS's bat swarms and flower walls.
  // vs: minute bosses at 1, 3, 5, 7, 9, 10, 15, 16, 18, 20, 22, 23, 25, 27,
  //     29 (~13 chests a run); bat swarms 2-4; flower walls 5, 15, 21.
  T.EVENTS = [
    { at: 60,  type: 'elite', tier: 'C' },                    // vs 1:00-3:00
    { at: 75,  type: 'ring',  tier: 'B', n: 16 },             // bat swarm
    { at: 105, type: 'ring',  tier: 'B', n: 16 },             // bat swarm
    { at: 150, type: 'elite', tier: 'C' },                    // vs 5:00
    { at: 165, type: 'ring',  tier: 'A', n: 18 },             // flower wall
    { at: 225, type: 'elite', tier: 'D' },                    // vs 7-9
    { at: 300, type: 'elite', tier: 'C' },                    // vs 10:00: first evolution chest
    { at: 330, type: 'elite', tier: 'B' },                    // vs 11:00
    { at: 390, type: 'elite', tier: 'D' },                    // vs 13
    { at: 450, type: 'boss' },                                // the district boss (vs 15:00 Giant Werewolf)
    { at: 480, type: 'elite', tier: 'E' },                    // vs 16
    { at: 540, type: 'elite', tier: 'D' },                    // vs 18
    { at: 600, type: 'elite', tier: 'E' },                    // vs 20
    { at: 630, type: 'ring',  tier: 'C', n: 26 },             // flower wall (vs 21)
    { at: 660, type: 'elite', tier: 'C' },                    // vs 22
    { at: 690, type: 'elite', tier: 'D' },                    // vs 23
    { at: 750, type: 'elite', tier: 'E' },                    // vs 25: the big test
    { at: 780, type: 'ring',  tier: 'E', n: 20 },
    { at: 810, type: 'elite', tier: 'C' },                    // vs 27
    { at: 840, type: 'ring',  tier: 'B', n: 30 },             // vs 29 bat swarm
    { at: 870, type: 'elite', tier: 'E' },                    // vs 29
  ];
  // golden elite HP = its tier's base HP x the stage x this x max(MIN, your
  // level) - a snowballing build meets tougher elites.
  // vs: minute boss HP = listed HP x player level at spawn
  T.ELITE_HP_PER_LEVEL = 1.0;
  T.ELITE_HP_MIN_LEVEL = 8;

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
