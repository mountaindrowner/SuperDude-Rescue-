// config.js — Super Dude Danny's Element Lab
// Everything tweakable lives here (Brief §17). Edit numbers, never logic.
window.DANNYLAB = window.DANNYLAB || {};

// Render resolution multiplier — supersample to the device's pixel density so
// the 540x960 coordinate space renders crisp on high-DPI phones (capped at 2x
// to keep the per-frame animation cheap). Game coordinates are unchanged.
DANNYLAB.RES = (function () {
  var d = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  return Math.max(1, Math.min(2, d));
})();

DANNYLAB.CONFIG = {
  // ---- gameplay ----
  maxDroppableTier: 3,
  dropCooldownMs: 450,
  comboResetMs: 250,
  overflowGraceMs: 1500,
  fissionEnabled: true,
  fissionRadius: 160,
  fissionClearsTiersUpTo: 3,

  // drop weighting for tiers 1..maxDroppableTier (should sum ~1)
  dropWeights: { 1: 0.6, 2: 0.3, 3: 0.1 },

  // ---- scoring ----
  tierPoints: { 2: 2, 3: 4, 4: 8, 5: 16, 6: 32, 7: 64, 8: 128, 9: 300 },
  discoverBonusFirstEver: 50,
  discoverBonusThisRun: 25,
  fissionBonus: 500,
  fissionPerAtom: 100,

  // ---- physics ----
  restitution: 0.15,
  friction: 0.4,
  frictionStatic: 0.5,
  bodySoftCap: 70,

  // ---- cascade feel (Addendum §1) ----
  cascadeSlowMoEnabled: true,
  cascadeSlowMoScale: 0.85,
  cascadeSlowMoMs: 150,
  comboToast: { chain: 3, overload: 5 },

  // ---- mystery sample (Addendum §2) ----
  mysteryEnabled: true,
  mysteryEveryNDrops: 35,
  mysteryJitter: 5,                            // spawns at N ± this
  mysteryEffects: {                            // keyed by FIRST element's tier; all beneficial
    1: 'updraft',    2: 'float',     3: 'crystallizeUpgrade',
    4: 'combustPop', 5: 'glowBoost', 6: 'fizzPop',
    7: 'magnetMerge', 8: 'jackpot',  9: 'miniFission',
  },
  mysteryFallbackEffect: 'crystallizeUpgrade', // v1 universal effect if needed
  mysteryRadius: 30,                           // physics radius of the sample piece

  // ---- lab charge meter / progression (Addendum §3) ----
  chargeMeterEnabled: true,
  chargeBaseThreshold: 150,
  chargeGrowth: 1.6,                           // threshold(L) = base x growth^(L-1)
  labBonusStep: 0.25,                          // Lab Bonus x: 1.0, 1.25, 1.5, ...
  chargeDropsMysteryOnLevelUp: false,

  // ---- the element chain — radius/color/symbol drive everything ----
  // glowAlpha + faceMood let us reskin tone per element without code edits.
  tiers: [
    { t: 1, sym: 'H',  radius: 22,  color: 0xBEE3F8, mood: 'spark'  },
    { t: 2, sym: 'He', radius: 30,  color: 0xFBD38D, mood: 'happy'  },
    { t: 3, sym: 'C',  radius: 40,  color: 0x7B8A9B, mood: 'cool'   },
    { t: 4, sym: 'O',  radius: 52,  color: 0x4FD1C5, mood: 'happy'  },
    { t: 5, sym: 'Ne', radius: 66,  color: 0xF687B3, mood: 'wow'    },
    { t: 6, sym: 'Na', radius: 74,  color: 0x9F7AEA, mood: 'happy'  },
    { t: 7, sym: 'Fe', radius: 90,  color: 0x8696A7, mood: 'cool'   },
    { t: 8, sym: 'Au', radius: 100, color: 0xECC94B, mood: 'wow'    },
    { t: 9, sym: 'U',  radius: 118, color: 0x7CFF6B, mood: 'glow'   },
  ],
};

// Derived constants referenced by the merge logic (Brief §17).
DANNYLAB.MAX_TIER = DANNYLAB.CONFIG.tiers.length;          // 9
DANNYLAB.MAX_DROPPABLE_TIER = DANNYLAB.CONFIG.maxDroppableTier;
DANNYLAB.FISSION_ENABLED = DANNYLAB.CONFIG.fissionEnabled;

// Convenience lookup: tier number -> tier config object (1-indexed).
DANNYLAB.tierCfg = function (t) {
  return DANNYLAB.CONFIG.tiers[t - 1];
};

// Soundtrack: 'intro' plays on the menu; one of these "elements" tracks is
// picked at random for each gameplay run (see DANNYLAB.pickGameTrack).
DANNYLAB.GAME_TRACKS = ['game-a', 'game-b', 'game-c', 'game-d'];
DANNYLAB.pickGameTrack = function () {
  var g = DANNYLAB.GAME_TRACKS;
  return g[Math.floor(Math.random() * g.length)];
};

// Element art skin: 'jelly' (procedural animated drops, default), 'px'
// (PixelLab atoms), or 'proc' (flat procedural balls). Change here to switch.
DANNYLAB.SKIN = 'jelly';

// Main-menu look: 'sharp' (angular sci-fi chamfered buttons + HUD trim,
// matching the card frames) or 'classic' (the original soft rounded look).
// One-line revert: set this to 'classic' to go back.
DANNYLAB.MENU_STYLE = 'sharp';

// For the px/proc skins: prefer the PixelLab art when it loaded, else the
// procedural texture. (The jelly skin builds its own layered visual.)
DANNYLAB.ballKey = function (scene, tier) {
  return scene.textures.exists('px_ball_' + tier) ? ('px_ball_' + tier) : ('el_ball_' + tier);
};
DANNYLAB.isPxBall = function (scene, tier) {
  return scene.textures.exists('px_ball_' + tier);
};
// texture for previews / menu / collection icons (jelly body when in jelly skin)
DANNYLAB.iconKey = function (scene, tier) {
  return DANNYLAB.useJelly(scene) ? ('jelly_body_' + tier) : DANNYLAB.ballKey(scene, tier);
};

// Weighted random pick of a droppable tier (1..maxDroppableTier).
// Optional rng (seeded, for the Daily Experiment) and weight override.
DANNYLAB.pickDroppableTier = function (rng, weights) {
  var w = weights || DANNYLAB.CONFIG.dropWeights;
  var total = 0, k;
  for (k in w) total += w[k];
  var r = (rng ? rng() : Math.random()) * total;
  for (k = 1; k <= DANNYLAB.MAX_DROPPABLE_TIER; k++) {
    r -= (w[k] || 0);
    if (r <= 0) return k;
  }
  return 1;
};

// ---- Daily Experiment: one seeded modifier run per calendar day ----
// Same date = same modifier + same piece sequence for everyone. No streaks,
// no timers - just a fresh twist on the lab each day.
DANNYLAB.DAILY_MODS = [
  { key: 'lowgrav', name: 'LOW GRAVITY DAY',  gravity: 0.55 },
  { key: 'heavy',   name: 'HEAVY MATTER DAY', gravity: 1.5 },
  { key: 'bouncy',  name: 'BOUNCY DAY',       restitution: 0.55 },
  { key: 'mystery', name: 'MYSTERY MANIA',    cadence: 15 },
  { key: 'tiny',    name: 'TINY LAB DAY',     fill: 70 },
  { key: 'jumbo',   name: 'JUMBO DROPS',      weights: { 1: 0.2, 2: 0.4, 3: 0.4 } },
];
DANNYLAB.mulberry32 = function (a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
DANNYLAB.dailyInfo = function () {
  var d = new Date();
  var ymd = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return { seed: ymd, date: '' + ymd, mod: DANNYLAB.DAILY_MODS[ymd % DANNYLAB.DAILY_MODS.length] };
};
