// spawn.js - the District 1 spawn director (COMPENDIUM 8.1, kid-tuned).
// Mark round 10: level too long (10min -> 5min), too many enemies too soon
// (sparse early, the real crowd comes late), and more than just fries.
window.PC = window.PC || {};

// ---- enemy stat defs: plain giant food objects, distinct feel ----
// hp/spd/dmg are the 0:00 values; the director time-scales them per 5.5.
PC.ENEMY_DEFS = {
  fry:     { key: 'enemy_d1_fry',     spd: 82,  hp: 10, dmg: 6,  xp: 1, size: 24, still: 'still_d1_fry',     kbMult: 1 },
  popcorn: { key: 'enemy_d1_popcorn', spd: 98,  hp: 8,  dmg: 5,  xp: 1, size: 24, still: 'still_d1_popcorn', kbMult: 1 },
  hotdog:  { key: 'enemy_d1_hotdog',  spd: 70,  hp: 30, dmg: 9,  xp: 2, size: 32, still: 'still_d1_hotdog',  kbMult: 0.8 },
  toast:   { key: 'enemy_d1_toast',   spd: 60,  hp: 24, dmg: 8,  xp: 2, size: 32, still: 'still_d1_toast',   kbMult: 0.8 },
  pretzel: { key: 'enemy_d1_pretzel', spd: 46,  hp: 90, dmg: 13, xp: 3, size: 48, still: 'still_d1_pretzel', kbMult: 0.35 },
  // d2 feral produce (MAP 2 - Adventure Park). Same four-tier shape as
  // d1 so the ramp feels identical; the flavour is what changes.
  apple:   { key: 'enemy_d2_apple',   spd: 86,  hp: 11, dmg: 6,  xp: 1, size: 24, still: 'still_d2_apple',   kbMult: 1 },
  peeler:  { key: 'enemy_d2_peeler',  spd: 104, hp: 8,  dmg: 5,  xp: 1, size: 28, still: 'still_d2_peeler',  kbMult: 1 },
  tomato:  { key: 'enemy_d2_tomato',  spd: 72,  hp: 30, dmg: 9,  xp: 2, size: 32, still: 'still_d2_tomato',  kbMult: 0.8 },
  banana:  { key: 'enemy_d2_banana',  spd: 62,  hp: 26, dmg: 8,  xp: 2, size: 40, still: 'still_d2_banana',  kbMult: 0.8 },
  melon:   { key: 'enemy_d2_melon',   spd: 44,  hp: 95, dmg: 13, xp: 3, size: 48, still: 'still_d2_melon',   kbMult: 0.35 },
  // d3 rogue desserts (MAP 3 - Sweet Suburbs). Same tier shape, stats a
  // shade hotter than the park - this is stage 5.
  donut:   { key: 'enemy_d3_donut',    spd: 92,  hp: 12,  dmg: 6,  xp: 1, size: 24, still: 'still_d3_donut',    kbMult: 1 },
  chipbit: { key: 'enemy_d3_chip_bit', spd: 112, hp: 8,   dmg: 5,  xp: 1, size: 16, still: 'still_d3_chip_bit', kbMult: 1 },
  cupcake: { key: 'enemy_d3_cupcake',  spd: 74,  hp: 34,  dmg: 9,  xp: 2, size: 32, still: 'still_d3_cupcake',  kbMult: 0.8 },
  frosting:{ key: 'enemy_d3_sludge',   spd: 56,  hp: 40,  dmg: 10, xp: 2, size: 48, still: 'still_d3_sludge',   kbMult: 0.6 },
  golemite:{ key: 'enemy_d3_golemite', spd: 46,  hp: 100, dmg: 14, xp: 3, size: 48, still: 'still_d3_golemite', kbMult: 0.35 },
  // d4 mutated junk food (MAP 4 - Super Dude Labs). Stage 6: the
  // hottest tier yet. (COMPENDIUM behaviors - zipper jitter, soda
  // spit, chipbag split - are future engine work; stats carry it.)
  zipper:  { key: 'enemy_d4_zipper',    spd: 108, hp: 14,  dmg: 7,  xp: 1, size: 24, still: 'still_d4_zipper',    kbMult: 1 },
  chipbag: { key: 'enemy_d4_chipbag',   spd: 60,  hp: 44,  dmg: 11, xp: 2, size: 32, still: 'still_d4_chipbag',   kbMult: 0.7 },
  sodacan: { key: 'enemy_d4_soda',      spd: 52,  hp: 36,  dmg: 9,  xp: 2, size: 32, still: 'still_d4_soda',      kbMult: 0.8 },
  burger:  { key: 'enemy_d4_burger',    spd: 42,  hp: 120, dmg: 15, xp: 3, size: 48, still: 'still_d4_burger',    kbMult: 0.3 },
  menace:  { key: 'enemy_d4_microwave', spd: 34,  hp: 70,  dmg: 11, xp: 3, size: 40, still: 'still_d4_microwave', kbMult: 0.5 },
  // d5 spoiled sludge (MAP 5 - The Underground). Stage 7: the last
  // roster before the Tower - a shade hotter than the labs junk, with
  // squishy high-knockback goo instead of armored heavies.
  blob:    { key: 'enemy_d5_blob',  spd: 90,  hp: 16,  dmg: 7,  xp: 1, size: 24, still: 'still_d5_blob',  kbMult: 1.1 },
  drip:    { key: 'enemy_d5_drip',  spd: 118, hp: 10,  dmg: 5,  xp: 1, size: 16, still: 'still_d5_drip',  kbMult: 1.2 },
  moldy:   { key: 'enemy_d5_moldy', spd: 62,  hp: 48,  dmg: 11, xp: 2, size: 32, still: 'still_d5_moldy', kbMult: 0.8 },
  eggy:    { key: 'enemy_d5_eggy',  spd: 76,  hp: 38,  dmg: 10, xp: 2, size: 32, still: 'still_d5_eggy',  kbMult: 0.9 },
  heap:    { key: 'enemy_d5_heap',  spd: 36,  hp: 130, dmg: 16, xp: 3, size: 48, still: 'still_d5_heap',  kbMult: 0.35 },
};

// ---- phases: [tStart, tEnd, intervalStart, intervalEnd, roster, perTick, liveCap] ----
// roster = [ [key, weight], ... ]. interval lerps within the phase.
// v0.16.1 compressed ~1min earlier (Mark: "ramp up a little sooner,
// especially if five minutes is the cutoff")
PC.SPAWN_PHASES = [
  [0,   45,  1.6, 1.2,  [['fry', 1]], 1, 45],
  [45,  100, 1.2, 0.9,  [['fry', 7], ['popcorn', 3]], 1, 85],
  [100, 150, 0.9, 0.65, [['fry', 5], ['popcorn', 2], ['hotdog', 3]], 2, 130],
  [150, 210, 0.65, 0.45,[['fry', 4], ['popcorn', 2], ['hotdog', 3], ['toast', 2]], 2, 190],
  [210, 300, 0.45, 0.28,[['fry', 3], ['popcorn', 2], ['hotdog', 3], ['toast', 2], ['pretzel', 2]], 3, 260],
  [300, 1e9, 0.26, 0.20,[['fry', 3], ['popcorn', 2], ['hotdog', 3], ['toast', 3], ['pretzel', 3]], 3, 300],
];

// per-map rosters: same phase timings, different creatures. A region
// picks one with `spawnSet` in its map data (default = the d1 street food).
PC.SPAWN_SETS = {
  d1: PC.SPAWN_PHASES,
  park: [
    [0,   45,  1.6, 1.2,  [['apple', 1]], 1, 45],
    [45,  100, 1.2, 0.9,  [['apple', 7], ['peeler', 3]], 1, 85],
    [100, 150, 0.9, 0.65, [['apple', 5], ['peeler', 2], ['tomato', 3]], 2, 130],
    [150, 210, 0.65, 0.45,[['apple', 4], ['peeler', 2], ['tomato', 3], ['banana', 2]], 2, 190],
    [210, 300, 0.45, 0.28,[['apple', 3], ['peeler', 2], ['tomato', 3], ['banana', 2], ['melon', 2]], 3, 260],
    [300, 1e9, 0.26, 0.20,[['apple', 3], ['peeler', 2], ['tomato', 3], ['banana', 3], ['melon', 3]], 3, 300],
  ],
  suburb: [
    [0,   45,  1.6, 1.2,  [['donut', 1]], 1, 45],
    [45,  100, 1.2, 0.9,  [['donut', 7], ['chipbit', 3]], 1, 85],
    [100, 150, 0.9, 0.65, [['donut', 5], ['chipbit', 2], ['cupcake', 3]], 2, 130],
    [150, 210, 0.65, 0.45,[['donut', 4], ['chipbit', 2], ['cupcake', 3], ['frosting', 2]], 2, 190],
    [210, 300, 0.45, 0.28,[['donut', 3], ['chipbit', 2], ['cupcake', 3], ['frosting', 2], ['golemite', 2]], 3, 260],
    [300, 1e9, 0.26, 0.20,[['donut', 3], ['chipbit', 2], ['cupcake', 3], ['frosting', 3], ['golemite', 3]], 3, 300],
  ],
  junk: [
    [0,   45,  1.5, 1.1,  [['zipper', 1]], 1, 50],
    [45,  100, 1.1, 0.85, [['zipper', 7], ['sodacan', 3]], 1, 90],
    [100, 150, 0.85, 0.6, [['zipper', 5], ['sodacan', 2], ['chipbag', 3]], 2, 140],
    [150, 210, 0.6, 0.42, [['zipper', 4], ['sodacan', 2], ['chipbag', 3], ['menace', 2]], 2, 200],
    [210, 300, 0.42, 0.26,[['zipper', 3], ['sodacan', 2], ['chipbag', 3], ['menace', 2], ['burger', 2]], 3, 270],
    [300, 1e9, 0.24, 0.19,[['zipper', 3], ['sodacan', 2], ['chipbag', 3], ['menace', 3], ['burger', 3]], 3, 300],
  ],
  goo: [
    [0,   45,  1.5, 1.1,  [['blob', 1]], 1, 50],
    [45,  100, 1.1, 0.85, [['blob', 7], ['drip', 3]], 1, 90],
    [100, 150, 0.85, 0.6, [['blob', 5], ['drip', 2], ['eggy', 3]], 2, 140],
    [150, 210, 0.6, 0.42, [['blob', 4], ['drip', 2], ['eggy', 3], ['moldy', 2]], 2, 200],
    [210, 300, 0.42, 0.26,[['blob', 3], ['drip', 2], ['eggy', 3], ['moldy', 2], ['heap', 2]], 3, 270],
    [300, 1e9, 0.24, 0.19,[['blob', 3], ['drip', 2], ['eggy', 3], ['moldy', 3], ['heap', 3]], 3, 300],
  ],
};

PC.SpawnDirector = function (scene) {
  this.scene = scene;
  this.acc = 0;
  this.ringDone = {};        // one-shot events keyed by phase index
  var set = scene.region && scene.region.def.spawnSet;
  this.phases = PC.SPAWN_SETS[set] || PC.SPAWN_PHASES;
};

PC.SpawnDirector.prototype._phase = function (t) {
  var P = this.phases || PC.SPAWN_PHASES;
  for (var i = 0; i < P.length; i++) if (t >= P[i][0] && t < P[i][1]) return P[i];
  return P[P.length - 1];
};

// weighted pick with time-scaled stats applied to a fresh def copy
PC.SpawnDirector.prototype._pick = function (roster, minutes) {
  var total = 0, i;
  for (i = 0; i < roster.length; i++) total += roster[i][1];
  var r = Math.random() * total, key = roster[0][0];
  for (i = 0; i < roster.length; i++) { r -= roster[i][1]; if (r <= 0) { key = roster[i][0]; break; } }
  var d = PC.ENEMY_DEFS[key];
  return {
    key: d.key, still: d.still, size: d.size, xp: d.xp, kbMult: d.kbMult,
    spd: d.spd,
    hp: Math.round(d.hp * (1 + PC.TIMESCALE.HP_PER_MIN * minutes)),
    dmg: Math.round(d.dmg * (1 + PC.TIMESCALE.DMG_PER_MIN * minutes)),
  };
};

PC.SpawnDirector.prototype.update = function (dt, runT) {
  var ph = this._phase(runT);
  var minutes = runT / 60;
  var lerp = (runT - ph[0]) / (ph[1] - ph[0]);
  var interval = ph[2] + (ph[3] - ph[2]) * Math.min(1, lerp);
  var liveCap = ph[6];
  var scene = this.scene, enemies = scene.enemies;
  // v0.30.0: the single ease knob (PC.EASE) - longer gaps, smaller crowd
  var ez = PC.ease ? PC.ease(scene) : null;
  if (ez) { interval *= ez.interval; liveCap = Math.round(liveCap * ez.cap); }

  this.acc += dt;
  if (this.acc >= interval && enemies.liveCount < liveCap) {
    this.acc = 0;
    var perTick = ph[5];
    var cam = scene.cameras.main;
    var cx = cam.worldView.centerX, cy = cam.worldView.centerY;
    var ringR = Math.max(PC.RENDER.W, PC.RENDER.H) * 0.62 + 40;   // just off-screen
    for (var n = 0; n < perTick; n++) {
      var a = Math.random() * Math.PI * 2;
      var rr = ringR + Math.random() * 40;
      enemies.spawn(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, this._pick(ph[4], minutes));
    }
  }
};

// off-screen ring EVENT: N enemies in a circle closing in (COMPENDIUM 8)
PC.SpawnDirector.prototype.ring = function (nn, key, minutes) {
  var scene = this.scene, cam = scene.cameras.main;
  var ez = PC.ease ? PC.ease(scene) : null;
  if (ez) nn = Math.max(4, Math.round(nn * ez.ring));
  var cx = cam.worldView.centerX, cy = cam.worldView.centerY;
  var rr = Math.max(PC.RENDER.W, PC.RENDER.H) * 0.7 + 40;
  var def = this._pick([[key, 1]], minutes);
  for (var i = 0; i < nn; i++) {
    var a = (i / nn) * Math.PI * 2;
    scene.enemies.spawn(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, def);
  }
};
