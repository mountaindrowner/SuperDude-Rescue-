// config.js - PORTION CONTROL. Every tunable number lives here (COMPENDIUM
// rule: tuning never means hunting through logic). Numbers arrive milestone
// by milestone; each block cites its COMPENDIUM section.
window.PC = window.PC || {};

// on-screen build tag (Mark: track builds while playing). The single
// bump point is PC_BUILD in index.html - it also cache-busts every
// script/art URL so devices can never mix files from two builds.
PC.VERSION = 'v' + (window.PC_BUILD || 'dev');

// ---- render lock (HANDOVER L3) ----
// BASE = the portrait short-edge logical size = the zoom level. Bigger =
// more of the map on screen, sprites appear smaller (Mark round 10: "zoom
// the game out a little so I can see more of the map"). 270 -> 340.
PC.RENDER = {
  W: 480, H: 270,              // set live by main.js from BASE + device aspect
  BASE: 340,                   // portrait width / landscape height (the zoom)
  // internal render scale (PHASE2 4-B "4K feel"): the canvas backing store
  // is logical*SCALE with camera zoom SCALE - same framing, denser pixels.
  // v0.13.0 (Mark: "text still looks a little blurry"): SCALE now matches
  // the DEVICE pixel ratio (main.js resolves clamp(round(dpr), 2, 3)) so
  // a 3x iPhone gets a true 1:1 backing store - no final CSS upscale.
  SCALE: 2,                    // resolved live in main.js; 2 = min/desktop
  DPR_CAP: 3,                  // devicePixelRatio cap (was 2; modern phones hold 3)
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
  ICON: 24, PORTRAIT: 128, GEM_S: 12, GEM_M: 14, GEM_G: 16,
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
PC.PLAYER = { HP: 100, SPEED: 190, PICKUP_R: 72, IFRAMES: 0.6, MEDKIT_HEAL: 35 };

// ---- XP & leveling (COMPENDIUM 5.3) ----
PC.XP = {
  GEM_SMALL: 1, GEM_MED: 5, GEM_GOLD: 20,
  // Mark playtest 2026-07-27: "3 minutes and I'm level six barely...
  // ramp up a little faster" - curve softened 1.35/3 -> 1.30/2
  FIRST: 5, CURVE_MULT: 1.30, CURVE_ADD: 2,
  WEAPON_SLOTS: 4, PASSIVE_SLOTS: 4,
};

// ---- run structure (COMPENDIUM 5.1) ----
// Mark round 10: 10min is too long for kids - District 1 is a 5min run.
PC.RUN = { BOSS_AT_S: 300, BOSS_AMBIENT_MULT: 1.8 };

// District 1 rescue: Victoria is Big Frank's captive (call delegated to
// Claude by Mark 2026-07-25). Winning D1 unlocks her as playable.
PC.D1_RESCUE = { name: 'VICTORIA', art: 'char_victoria_idle', hero: 'victoria' };

// VFX toolkit v2 (Weapons&VFX doc Task 1-2): rings/fields/muzzles route
// through systems/vfx.js. Toggle off to fall back to legacy visuals.
PC.VFX_V2 = true;
// Hero rework flags (Weapons&VFX Tasks 6-8 + Task 9, ALL approved by
// Mark 2026-07-26). Off = legacy signature behavior.
PC.VIC_SENTRY_BOT = true;      // bot pal + Vic-only Deploy button
PC.CARLOS_COMET_CALL = true;   // falling comets on the farthest foe
PC.NAYAH_HAYMAKER = true;      // lifesteal brawler (seeds -> shared pool)
PC.SALT_AURA = true;           // Salt Shaker = Seasoned debuff aura
PC.JOSH_PULLSLAM = false;      // RETIRED v0.14.8 (Mark cut pull+slam; lasso = pure loop)
PC.SFX_VOICES = true;          // per-weapon voice table (docs/SFX_VOICES.md, v0.15.0)

// Dev flag (PHASE2 §3): true = every hero selectable. FLIPPED FALSE
// v0.13.0 (Mark: "make some more characters unlockable, all except the
// first one") - each hero has a unique condition in PC.HERO_UNLOCKS.
// v0.14.5: ?dev=1 in the URL = DEVELOPER MODE (Mark: "give me an
// admin version... everything unlocked so I could test") - all
// heroes selectable + test-wallet gold top-up + red DEV badge on the
// version stamp. The plain URL stays the real player experience.
// three ways in, because mobile browsers/CDNs love dropping query
// strings: ?dev=1, #dev, or the persisted toggle (tap the version
// stamp 5x fast on any menu; persists until toggled off the same way)
PC.DEV_MODE = false;
try {
  var _q = (window.location.search || '') + (window.location.hash || '');
  if (/[?&#]dev(=1)?\b/.test(_q)) {
    PC.DEV_MODE = true;
    localStorage.setItem('portioncontrol.dev', '1');   // sticky once visited
  } else {
    PC.DEV_MODE = localStorage.getItem('portioncontrol.dev') === '1';
  }
} catch (e) {}
PC.setDevMode = function (on) {
  try { localStorage.setItem('portioncontrol.dev', on ? '1' : '0'); } catch (e) {}
  PC.DEV_MODE = !!on;
  PC.DEV_ALL_UNLOCKED = !!on;
};
PC.DEV_ALL_UNLOCKED = PC.DEV_MODE;
if (PC.DEV_MODE) {
  try {
    var _g = parseInt(localStorage.getItem('portioncontrol.gold') || '0', 10) || 0;
    if (_g < 50000) localStorage.setItem('portioncontrol.gold', '50000');
  } catch (e) {}
}

// ---- playable roster ----
// scale normalizes figure height to Danny's (~50px) - measured from the
// idle frames' content bboxes, rounded to 0.05. Kits come later
// (CHARACTERS.md); until then everyone runs Danny's default loadout.
PC.ROSTER = [
  { id: 'danny',    name: 'DANNY',    role: 'SUPER DUDE',     art: 'char_danny',    scale: 1.1  },
  { id: 'victoria', name: 'VICTORIA', role: 'TIME TECH',      art: 'char_victoria', scale: 1.1  },
  { id: 'nayah',    name: 'NAYAH',    role: 'NATURE EXPERT',  art: 'char_nayah',    scale: 1.1  },
  { id: 'kevin',    name: 'KEVIN',    role: 'CAPTAIN',        art: 'char_kevin',    scale: 1.15 },
  { id: 'carlos',   name: 'CARLOS',   role: 'GALAXY GUIDE',   art: 'char_carlos',   scale: 1.1  },
  { id: 'josh',     name: 'JOSH',     role: 'ZOOKEEPER',      art: 'char_josh',     scale: 1.15 },
];
PC.heroById = function (id) {
  for (var i = 0; i < PC.ROSTER.length; i++)
    if (PC.ROSTER[i].id === id) return PC.ROSTER[i];
  return PC.ROSTER[0];
};
PC.selectedHero = function () {
  var id = null;
  try { id = localStorage.getItem('portioncontrol.hero'); } catch (e) {}
  return PC.heroById(id);
};

// ---- in-run enemy time scaling (COMPENDIUM 5.5) ----
// v0.16.1 (Mark: "feels a little too easy... ramp up sooner" on the
// 5-min run): in-run scaling doubled-ish so minute 3+ has teeth
PC.TIMESCALE = { HP_PER_MIN: 0.10, DMG_PER_MIN: 0.04 };

// ---- pickups (COMPENDIUM 5.6) ----
PC.DROPS = { HEALTH: 0.012, MAGNET: 0.004, BOMB: 0.0015, HEALTH_HEAL: 30 };

// ---- shared specials (COMPENDIUM 8.7) ----
PC.ELITE = { HP_MULT: 6, SCALE: 1.5 };
PC.GOLDEN = { HP: 40, FLEE_SPD: 260, LIFE_S: 6, GEMS: 3 };
