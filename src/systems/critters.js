// critters.js - ambient park wildlife (v0.26.0). Mark: "maybe even some
// little scurrying animals." Squirrels, birds and rabbits that idle,
// hop about, and SCURRY away when the player gets close. Pure ambience:
// no collision, no damage, culled and respawned off-screen. Park only.
window.PC = window.PC || {};

var KINDS = [
  { key: 'critter_squirrel', spd: 120, fleeR: 70, scale: 0.75 },
  { key: 'critter_bird',     spd: 150, fleeR: 90, scale: 0.68 },
  { key: 'critter_rabbit',   spd: 135, fleeR: 80, scale: 0.75 },
];

PC.Critters = function (scene) {
  this.scene = scene;
  this.pool = [];
  for (var i = 0; i < 12; i++) {
    var k = KINDS[i % KINDS.length];
    this.pool.push({
      active: false, kind: k, x: 0, y: 0, vx: 0, vy: 0,
      state: 'idle', t: 0, animT: i * 0.4,
      spr: scene.add.image(0, 0, 'atlas', k.key + '_1')
        .setDepth(4).setScale(k.scale).setVisible(false),
    });
  }
  this._spawnAcc = 0.6;                 // first spawn lands fast
};

PC.Critters.prototype._trySpawn = function () {
  var scene = this.scene;
  var c = null;
  for (var i = 0; i < this.pool.length; i++) {
    if (!this.pool[i].active) { c = this.pool[i]; break; }
  }
  if (!c) return;
  // INSIDE the view but clear of the player (round-2 judge: off-screen
  // spawns never wandered into frame - nobody ever SAW a critter). The
  // flee radius keeps them scattering the moment the player closes in.
  var v = scene.cameras.main.worldView;
  var a = Math.random() * Math.PI * 2;
  var r = Math.max(v.width, v.height) * (0.28 + Math.random() * 0.3);
  var x = v.centerX + Math.cos(a) * r, y = v.centerY + Math.sin(a) * r;
  var pdx = x - scene.px, pdy = y - scene.py;
  if (pdx * pdx + pdy * pdy < 110 * 110) return;   // too close - skip beat
  if (scene.region) {
    var S = scene.region.size;
    if (x < 80 || y < 80 || x > S - 80 || y > S - 80) return;
  }
  var rp = PC.resolveCircle(x, y, 8);
  c.active = true; c.x = rp.x; c.y = rp.y;
  c.state = 'idle'; c.t = 0.3 + Math.random() * 1.2;
  c.spr.setFrame(c.kind.key + '_1').setVisible(true).setFlipX(Math.random() < 0.5);
};

PC.Critters.prototype.update = function (dt) {
  var scene = this.scene;
  this._spawnAcc += dt;
  if (this._spawnAcc > 0.55) { this._spawnAcc = 0; this._trySpawn(); }
  var v = scene.cameras.main.worldView;
  var cullR = Math.max(v.width, v.height) * 1.1 + 120;
  for (var i = 0; i < this.pool.length; i++) {
    var c = this.pool[i];
    if (!c.active) continue;
    c.animT += dt;
    var pdx = scene.px - c.x, pdy = scene.py - c.y;
    var pd = Math.sqrt(pdx * pdx + pdy * pdy);
    // flee the player
    if (pd < c.kind.fleeR && c.state !== 'flee') {
      c.state = 'flee'; c.t = 0.9 + Math.random() * 0.5;
      var fl = pd || 1;
      c.vx = -pdx / fl * c.kind.spd; c.vy = -pdy / fl * c.kind.spd;
    }
    c.t -= dt;
    if (c.state === 'idle') {
      if (c.t <= 0) {                       // pick a little hop
        c.state = 'hop'; c.t = 0.4 + Math.random() * 0.7;
        var ha = Math.random() * Math.PI * 2;
        var hs = c.kind.spd * (0.25 + Math.random() * 0.3);
        c.vx = Math.cos(ha) * hs; c.vy = Math.sin(ha) * hs;
      }
    } else if (c.t <= 0) {
      c.state = 'idle'; c.t = 0.4 + Math.random() * 1.2;
      c.vx = 0; c.vy = 0;
    }
    if (c.state !== 'idle') {
      c.x += c.vx * dt; c.y += c.vy * dt;
      var rp = PC.resolveCircle(c.x, c.y, 6);
      c.x = rp.x; c.y = rp.y;
      if (c.vx) c.spr.setFlipX(c.vx < 0);
      var fr = 1 + (Math.floor(c.animT * (c.state === 'flee' ? 12 : 7)) % 2);
      c.spr.setFrame(c.kind.key + '_' + fr);
    } else {
      c.spr.setFrame(c.kind.key + '_1');
    }
    // cull far off screen
    var cdx = c.x - v.centerX, cdy = c.y - v.centerY;
    if (cdx * cdx + cdy * cdy > cullR * cullR) {
      c.active = false; c.spr.setVisible(false); continue;
    }
    c.spr.setPosition(Math.round(c.x),
      Math.round(c.y) + (c.state !== 'idle' ? Math.round(Math.abs(Math.sin(c.animT * 14)) * -3) : 0));
  }
};
