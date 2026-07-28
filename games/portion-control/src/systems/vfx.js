// vfx.js - shared VFX toolkit (Weapons&VFX doc, Task 1). One pooled
// module every weapon draws from so no effect is ever a raw box.
// Flag: PC.VFX_V2 (config.js). All code-drawn: one shared additive
// Graphics redrawn per frame for rings/fields, fx.js pools for bursts.
// COLOR LAW: player cyan 0x35d0ff, enemy pink, XP lime, danger
// telegraphs ketchup/cherry, fire mustard->cheese->ketchup.
window.PC = window.PC || {};

PC.Vfx = function (scene) {
  this.scene = scene;
  this.gfx = scene.add.graphics().setDepth(6)
    .setBlendMode(Phaser.BlendModes.ADD);
  this.rings = [];               // telegraph rings (danger red pulse)
  for (var i = 0; i < 12; i++) {
    this.rings.push({ active: false, x: 0, y: 0, r: 0, t: 0, dur: 0, color: 0 });
  }
  this.fields = [];              // lingering flickering areas
  for (var j = 0; j < 8; j++) {
    this.fields.push({ active: false, x: 0, y: 0, r: 0, t: 0, dur: 0,
                       c1: 0, c2: 0, seed: j * 1.7 });
  }
};

// pulsing danger-red ring that previews where an AoE lands
PC.Vfx.prototype.telegraphRing = function (x, y, radius, ms, color) {
  var s = null, old = null, oldT = 1e9;
  for (var i = 0; i < this.rings.length; i++) {
    var r = this.rings[i];
    if (!r.active) { s = r; break; }
    if (r.t < oldT) { oldT = r.t; old = r; }
  }
  s = s || old;
  s.active = true; s.x = x; s.y = y; s.r = radius;
  s.dur = (ms || 700) / 1000; s.t = s.dur;
  s.color = color || 0xd93a3a;
  s.shrink = false;
  return s;
};

// contracting ring (Danny's shrink-ray muzzle: big -> small)
PC.Vfx.prototype.shrinkRing = function (x, y, radius, ms, color) {
  var s = this.telegraphRing(x, y, radius, ms, color || 0x35d0ff);
  s.shrink = true;
  return s;
};

// semi-transparent animated area - NEVER a solid fill
PC.Vfx.prototype.lingeringField = function (x, y, radius, ms, c1, c2) {
  var s = null, old = null, oldT = 1e9;
  for (var i = 0; i < this.fields.length; i++) {
    var f = this.fields[i];
    if (!f.active) { s = f; break; }
    if (f.t < oldT) { oldT = f.t; old = f; }
  }
  s = s || old;
  s.active = true; s.x = x; s.y = y; s.r = radius;
  s.dur = (ms || 1000) / 1000; s.t = s.dur;
  s.c1 = c1 || 0xf2c33c; s.c2 = c2 || 0xd93a3a;
  return s;
};

// small bright burst at a spawn point (pooled via fx.js)
PC.Vfx.prototype.muzzleFlash = function (x, y, color) {
  this.scene.fx.burst(x, y, 'fx_muzzle', 2, 0.12, color || 0x35d0ff);
};

// radial spark on hit (enemy white-flash already lives in damageEnemy)
PC.Vfx.prototype.impactBurst = function (x, y, color) {
  this.scene.fx.burst(x, y, 'fx_spark', 3, 0.16, color || 0x35d0ff);
};

// clamped camera shake: px <= 3 logical px (COMPENDIUM shake law)
PC.Vfx.prototype.shake = function (px, ms) {
  var frac = Math.min(px || 2, PC.SHAKE.MAX_PX) /
             (PC.RENDER.W * PC.RENDER.SCALE);
  this.scene.cameras.main.shake(ms || 90, frac);
};

PC.Vfx.prototype.update = function (dt) {
  var g = this.gfx, now = this.scene.now;
  g.clear();
  var i;
  for (i = 0; i < this.rings.length; i++) {
    var r = this.rings[i];
    if (!r.active) continue;
    r.t -= dt;
    if (r.t <= 0) { r.active = false; continue; }
    var k = r.t / r.dur;                        // 1 -> 0
    if (r.shrink) {
      // contracting ring: radius collapses toward the point
      g.lineStyle(2, r.color, 0.6 * k + 0.2);
      g.strokeCircle(r.x, r.y, r.r * (0.15 + 0.85 * k));
      continue;
    }
    var pulse = 0.75 + 0.25 * Math.sin(now * 16);
    // layer law (ASSET_QUALITY P1): bright edge + soft interior falloff
    // (a dark rim is impossible on this ADD-blend layer; the falloff
    // body keeps it from reading as a bare outline)
    g.fillStyle(r.color, 0.06 * k * pulse);
    g.fillCircle(r.x, r.y, r.r * 0.92);
    g.lineStyle(2, r.color, (0.35 + 0.45 * k) * pulse);
    g.strokeCircle(r.x, r.y, r.r * (0.85 + 0.15 * pulse));
    g.lineStyle(1, 0xff6b6b, 0.5 * k);
    g.strokeCircle(r.x, r.y, r.r * 0.55 * pulse);
  }
  for (i = 0; i < this.fields.length; i++) {
    var f = this.fields[i];
    if (!f.active) continue;
    f.t -= dt;
    if (f.t <= 0) { f.active = false; continue; }
    var fade = Math.min(1, f.t / 0.4);
    var fl = 0.6 + 0.4 * Math.sin(now * 13 + f.seed);
    g.fillStyle(f.c1, 0.10 * fade * fl);
    g.fillCircle(f.x, f.y, f.r);
    g.fillStyle(f.c2, 0.12 * fade * (1 - fl * 0.5));
    g.fillCircle(f.x + Math.sin(now * 7 + f.seed) * f.r * 0.15, f.y, f.r * 0.66);
    g.lineStyle(1, f.c1, 0.28 * fade * fl);
    g.strokeCircle(f.x, f.y, f.r);
  }
};
