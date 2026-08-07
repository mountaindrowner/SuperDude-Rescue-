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
// ---- ?unlock=1 preview mode (v0.38.0, Mark: "a version with all the
// new levels unlocked so I can try them") ----------------------------
// Same live build, opt-in by URL. Opens every BUILT stage on the
// mission map, bypasses the Hydro-Drill seal, and hands story runs two
// free upgrades at start so late stages are testable on a fresh kit.
// Runtime-only: the story save and meta wallet are never written by
// the mode itself, so dropping the param resumes normal progression.
PC.UNLOCK_ALL = false;

// CHOMP ART A/B (v0.50.0, Mark: "let's do a dev level tester with both
// options"). ?chomptest=1 puts BOTH designs on the roof side by side at
// play scale with labels; ?chomp=drawn|art picks which one the real
// fight uses. Runtime only - nothing is saved.
PC.CHOMP_TEST = /[?&]chomptest=1/.test(location.search);
PC.CHOMP_ART = (/[?&]chomp=drawn/.test(location.search)) ? 'drawn' : 'art';
try { PC.UNLOCK_ALL = /[?&]unlock/.test(window.location.search); } catch (e) {}

PC.RENDER = {
  W: 480, H: 270,              // set live by main.js from BASE + device aspect
  BASE: 400,                   // portrait width / landscape height (the zoom)
  // 270 -> 340 (round 10 "zoom out so I can see more of the map")
  // 340 -> 312 (v0.23.0, Mark: "I would still zoom up again just a
  // little bit") - ~8% closer, which also pulls the on-screen firing
  // boundary in and makes the shaped bolts read at their real size.
  // 312 -> 400 (v0.27.2, Mark: "still too close to the character...
  // zoom out the camera or the frame more, maybe another 25-30%").
  // +28% view. The TEXT STANDARD was calibrated at 312, so ui.js
  // scales PC.TYPE/SAFE by BASE/312 - UI text keeps its physical
  // size while the world gets smaller.
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
// logical px; 62 was tuned at BASE 312 - scaled with the zoom so the
// physical thumb travel stays identical (v0.27.2)
PC.JOY = { DEAD: 10, RADIUS: 79 };
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
  PER_TP: 10,        // story mode: banked XP -> TECH at the results desk
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
// 5-min run): in-run scaling doubled-ish so minute 3+ has teeth.
// v0.30.0 softened: STORY runs no longer level up mid-mission (Mark's
// call), so enemies can't keep outgrowing a power curve that stopped
// climbing. Quick run keeps its own harder tier below.
PC.TIMESCALE = { HP_PER_MIN: 0.06, DMG_PER_MIN: 0.025 };

// ---- THE EASE KNOB (v0.30.0) ----------------------------------------
// Mark: "let's make the game a little easier, the enemy spawns are
// overwhelming." ONE place to tune pressure instead of hand-editing
// four spawn tables: the director multiplies its interval / live cap
// through these, and quest swarms scale their counts. Story missions
// get the calmer tier because they're OBJECTIVE runs with a fixed
// loadout - a survival ramp there just walls the player.
//   interval > 1 = longer gaps between spawns   (fewer enemies)
//   cap      < 1 = smaller live crowd            (less overwhelm)
// v0.30.2 (Mark on-device: "the enemy spawn rate is crazy... maybe cut
// it in half"): story interval 1.55 -> 2.4 and cap 0.60 -> 0.42, i.e.
// roughly half the spawns per minute AND half the crowd of v0.30.0.
// v0.32.0 (full-campaign bot audit): bossHp/bossContact joined the
// knob. Bosses were tuned for quick run, where a 5-weapon leveled
// build exists by boss time - a story hero meets them with a near-base
// kit, so 3000-5000 HP meant 2-3 minute kite fights where every touch
// took 20-26 HP (the bot lost stage 5 three times TO the boss, twice
// from full health). Story bosses keep the same moves at survivable
// numbers; quick run is unchanged.
PC.EASE = {
  QUICK: { interval: 1.45, cap: 0.70, ring: 0.80, clear: 0.80, bossHp: 1, bossContact: 1, bossCharge: 1 },
  // bossHp 0.5 -> 0.42 (v0.33.0): chests became EARNED (defend reward /
  // boss kill, no arm gifts) which re-walled stage 1 - the bot lost the
  // Frank duel three straight at 0.5. The shorter bar buys back what
  // the free chest used to cover; the 3000->5000 base staircase keeps
  // later bosses relatively meaner.
  // bossCharge 0.75 (v0.33.0): the lunge is 320px/s vs player 190 -
  // running AWAY (every kid's instinct) mathematically cannot escape
  // it; only a sideways dodge in the 0.7s telegraph survives. At 240
  // px/s a head-start retreat escapes a full-length lunge, so the
  // natural response works and the duel stops being a touch-race.
  STORY: { interval: 2.40, cap: 0.42, ring: 0.55, clear: 0.60, bossHp: 0.42, bossContact: 0.75, bossCharge: 0.75 },
};
PC.ease = function (scene) {
  return (scene && scene.storyMission) ? PC.EASE.STORY : PC.EASE.QUICK;
};

// where player shots ORIGINATE (v0.31.0, Mark: "all shots should come
// from the center of the characters, right now they're coming from
// their feet"). px/py is the sprite's feet anchor; centre mass sits
// roughly 16 logical px up on every hero at their normalized scale.
PC.FIRE_LIFT = 16;
PC.fireY = function (scene) { return scene.py - PC.FIRE_LIFT; };

// ---- pickups (COMPENDIUM 5.6) ----
PC.DROPS = { HEALTH: 0.012, MAGNET: 0.004, BOMB: 0.0015, HEALTH_HEAL: 30 };

// ---- shared specials (COMPENDIUM 8.7) ----
PC.ELITE = { HP_MULT: 6, SCALE: 1.5 };
PC.GOLDEN = { HP: 40, FLEE_SPD: 260, LIFE_S: 6, GEMS: 3 };
