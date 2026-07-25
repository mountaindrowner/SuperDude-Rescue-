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
};

// ---- phases: [tStart, tEnd, intervalStart, intervalEnd, roster, perTick, liveCap] ----
// roster = [ [key, weight], ... ]. interval lerps within the phase.
PC.SPAWN_PHASES = [
  [0,   60,  1.7, 1.35, [['fry', 1]], 1, 40],
  [60,  120, 1.35, 1.05, [['fry', 7], ['popcorn', 3]], 1, 70],
  [120, 180, 1.05, 0.8,  [['fry', 5], ['popcorn', 2], ['hotdog', 3]], 1, 110],
  [180, 240, 0.8, 0.55,  [['fry', 4], ['popcorn', 2], ['hotdog', 3], ['toast', 2]], 2, 170],
  [240, 300, 0.55, 0.32, [['fry', 3], ['popcorn', 2], ['hotdog', 3], ['toast', 2], ['pretzel', 2]], 2, 240],
  [300, 1e9, 0.30, 0.22, [['fry', 3], ['popcorn', 2], ['hotdog', 3], ['toast', 3], ['pretzel', 3]], 3, 300],
];

PC.SpawnDirector = function (scene) {
  this.scene = scene;
  this.acc = 0;
  this.ringDone = {};        // one-shot events keyed by phase index
};

PC.SpawnDirector.prototype._phase = function (t) {
  var P = PC.SPAWN_PHASES;
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
  var cx = cam.worldView.centerX, cy = cam.worldView.centerY;
  var rr = Math.max(PC.RENDER.W, PC.RENDER.H) * 0.7 + 40;
  var def = this._pick([[key, 1]], minutes);
  for (var i = 0; i < nn; i++) {
    var a = (i / nn) * Math.PI * 2;
    scene.enemies.spawn(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, def);
  }
};
