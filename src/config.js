// config.js - PORTION CONTROL. Every tunable number lives here (COMPENDIUM
// rule: tuning never means hunting through logic). Numbers arrive milestone
// by milestone; each block cites its COMPENDIUM section.
window.PC = window.PC || {};

// ---- render lock (HANDOVER L3) ----
PC.RENDER = {
  W: 480, H: 270,              // logical resolution, 16:9, camera zoom 1
  DPR_CAP: 2,                  // devicePixelRatio cap (Perf Bible 7)
  CAMERA_LERP: 0.12,
};

// ---- the 16-color palette (COMPENDIUM 2.2 - absolute law) ----
// Readability rules: player shots CYAN, enemy shots PINK, XP LIME,
// danger telegraphs KETCHUP/CHERRY. Never violated by anything.
PC.PAL = {
  INK:     0x1b1530,  GRAPE:  0x45356e,  STEEL: 0x6d6a8e,  CLOUD: 0xcfd4e8,
  WHITE:   0xf7f4ef,  KETCHUP:0xd93a3a,  CHERRY:0xff6b6b,  MUSTARD:0xf2c33c,
  CHEESE:  0xff9d3b,  CRUST:  0xb5793f,  COCOA: 0x6e4a2f,  MINT:  0x7dd97b,
  LIME:    0xa8e04a,  CYAN:   0x35d0ff,  BERRY: 0xb45ce8,  PINK:  0xff9ecb,
};

// ---- canvas sizes (COMPENDIUM 2.3) ----
PC.SIZE = {
  ENEMY_S: 24, ENEMY_M: 32, ENEMY_H: 48, PLAYER: 32,
  BOSS: 128, BOSS_FINAL: 160, TILE: 32, PROJ_MIN: 8, PROJ_MAX: 16,
  ICON: 24, PORTRAIT: 96, GEM_S: 12, GEM_M: 14, GEM_G: 16,
};

// ---- performance bible hard caps (COMPENDIUM 3.4) ----
PC.CAPS = {
  ENEMY_MOBILE: 300, ENEMY_DESKTOP: 400,
  PLAYER_BULLETS: 400, ENEMY_BULLETS: 240, GEMS: 600, FX: 260,
  SFX_VOICES: 8, POP_SFX_PER_S: 10,
};
PC.GRID_CELL = 72;             // spatial hash cell (Perf Bible 3)
PC.CULL_MARGIN = 40;           // off-camera cull margin px (Perf Bible 7)
PC.DT_CLAMP = 0.05;            // seconds (Perf Bible 6)

// ---- controls & feel (COMPENDIUM 4) ----
PC.JOY = { DEAD: 8, RADIUS: 62 };
PC.SHAKE = { MAX_PX: 3, MS: 120 };
PC.HURT_FLASH_MS = 80;

// ---- player baseline (COMPENDIUM 5.2) ----
PC.PLAYER = { HP: 100, SPEED: 190, PICKUP_R: 72, IFRAMES: 0.6 };

// ---- XP & leveling (COMPENDIUM 5.3) ----
PC.XP = {
  GEM_SMALL: 1, GEM_MED: 5, GEM_GOLD: 20,
  FIRST: 5, CURVE_MULT: 1.35, CURVE_ADD: 3,
  WEAPON_SLOTS: 4, PASSIVE_SLOTS: 4,
};

// ---- run structure (COMPENDIUM 5.1) ----
PC.RUN = { BOSS_AT_S: 600, BOSS_AMBIENT_MULT: 1.8 };

// ---- in-run enemy time scaling (COMPENDIUM 5.5) ----
PC.TIMESCALE = { HP_PER_MIN: 0.06, DMG_PER_MIN: 0.02 };

// ---- pickups (COMPENDIUM 5.6) ----
PC.DROPS = { HEALTH: 0.012, MAGNET: 0.004, BOMB: 0.0015, HEALTH_HEAL: 30 };

// ---- shared specials (COMPENDIUM 8.7) ----
PC.ELITE = { HP_MULT: 6, SCALE: 1.5 };
PC.GOLDEN = { HP: 40, FLEE_SPD: 260, LIFE_S: 6, GEMS: 3 };
