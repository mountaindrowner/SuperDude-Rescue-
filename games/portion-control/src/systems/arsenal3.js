// arsenal3.js - Arsenal Expansion slice 3: the nine archetype weapons.
// Boomerang, chain, trail, ricochet, homing, melee sweep, pull, charge,
// retaliate aura. Same weapon contract; everything pooled and capped.
window.PC = window.PC || {};

// ---------------------------------------------------------------
// PIZZA CUTTER - boomerang: flies out, spins back, hits both legs
// ---------------------------------------------------------------
PC.CutterWeapon = function () {
  this.key = 'cutter'; this.name = 'PIZZA CUTTER';
  this.level = 1; this.max = 5;
  this.cd = 1.9; this.cdT = 0.5; this.dmg = 11; this.out = 0.5; this.cutters = 1;
};
PC.CutterWeapon.prototype.desc = function () {
  return ['', 'A spinning cutter that returns', 'Damage up!', 'Flies farther!',
          'Sharper spin!', 'Second cutter!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.CutterWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 16;
  else if (this.level === 3) this.out = 0.72;
  else if (this.level === 4) this.dmg = 21;
  else if (this.level === 5) this.cutters = 2;
};
PC.CutterWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT > 0) return;
  var aim = PC.aimAt(scene, 300);
  this.cdT = this.cd * scene.stats.cdMult;
  for (var n = 0; n < this.cutters; n++) {
    var ang = Math.atan2(aim.target ? aim.target.y - scene.py : aim.ay,
                         aim.target ? aim.target.x - scene.px : aim.ax) + n * 0.5;
    scene.bullets.fire(scene.px, scene.py - 4,
      scene.px + Math.cos(ang) * 100, scene.py - 4 + Math.sin(ang) * 100,
      { speed: 340, dmg: PC.rollDmg(scene, this.dmg * (this.mastery || 1)),
        frame: 'proj_whisk', scale: 1.7, tint: 0xf2c33c,
        boomerang: this.out, pierce: 99, life: this.out + 0.2 });
  }
  if (PC.audio) PC.audio.weaponVoice('cutter');
};

// ---------------------------------------------------------------
// TOASTER ZAP - chain lightning that jumps between close enemies
// ---------------------------------------------------------------
PC.ZapWeapon = function (scene) {
  this.key = 'zap'; this.name = 'TOASTER ZAP';
  this.level = 1; this.max = 5;
  this.cd = 1.4; this.cdT = 0.6; this.dmg = 12; this.jumps = 2;
  this.gfx = scene.add.graphics().setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
  this.flashT = 0;
};
PC.ZapWeapon.prototype.desc = function () {
  return ['', 'Zaps arc between close foes', 'Damage up!', 'Extra jump!',
          'Faster zaps!', 'Storm surge!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.ZapWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 17;
  else if (this.level === 3) this.jumps = 3;
  else if (this.level === 4) this.cd = 1.0;
  else if (this.level === 5) { this.dmg = 23; this.jumps = 4; }
};
PC.ZapWeapon.prototype.update = function (dt, scene) {
  if (this.flashT > 0) {
    this.flashT -= dt;
    if (this.flashT <= 0) this.gfx.clear();
    else this.gfx.setAlpha(this.flashT / 0.16);
  }
  this.cdT -= dt;
  if (this.cdT > 0) return;
  // first target: nearest within 200
  var pool = scene.enemies.pool, cur = null, cd2 = 200 * 200;
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (!e.active) continue;
    var dx = e.x - scene.px, dy = e.y - scene.py;
    var d = dx * dx + dy * dy;
    if (d < cd2) { cd2 = d; cur = e; }
  }
  if (!cur) { this.cdT = 0.25; return; }
  this.cdT = this.cd * scene.stats.cdMult;
  var g = this.gfx;
  g.clear().setAlpha(1);
  var fx0 = scene.px, fy0 = scene.py - 6;
  var dmg = PC.rollDmg(scene, this.dmg * (this.mastery || 1));
  var hitList = [];
  for (var j = 0; j <= this.jumps && cur; j++) {
    // jagged bolt segment
    var mx = (fx0 + cur.x) / 2 + (Math.random() - 0.5) * 14;
    var my = (fy0 + cur.y) / 2 + (Math.random() - 0.5) * 14;
    g.lineStyle(3, 0xf7f4ef, 0.9).lineBetween(fx0, fy0, mx, my);
    g.lineBetween(mx, my, cur.x, cur.y);
    g.lineStyle(6, 0x35d0ff, 0.35).lineBetween(fx0, fy0, cur.x, cur.y);
    PC.damageEnemy(scene, cur, dmg * Math.pow(0.85, j), 0, 0, scene._onKillCb);
    hitList.push(cur);
    fx0 = cur.x; fy0 = cur.y;
    // next: nearest un-hit within 120 of the last link
    var nx = null, nd = 120 * 120;
    for (var k = 0; k < pool.length; k++) {
      var e2 = pool[k];
      if (!e2.active || hitList.indexOf(e2) >= 0) continue;
      var ddx = e2.x - fx0, ddy = e2.y - fy0;
      var dd = ddx * ddx + ddy * ddy;
      if (dd < nd) { nd = dd; nx = e2; }
    }
    cur = nx;
  }
  this.flashT = 0.16;
  if (PC.audio) PC.audio.weaponVoice('zap');
};

// ---------------------------------------------------------------
// GREASE TRAIL - a burning slick behind you as you move
// ---------------------------------------------------------------
PC.GreaseWeapon = function (scene) {
  this.key = 'grease'; this.name = 'GREASE TRAIL';
  this.level = 1; this.max = 5;
  this.dmg = 4; this.segR = 20; this.life = 1.6; this.slow = false;
  this.lastX = 0; this.lastY = 0; this.acc = 0;
  this.segs = [];
  for (var i = 0; i < 12; i++) {
    this.segs.push({ active: false, x: 0, y: 0, t: 0, tick: 0,
      img: scene.add.image(0, 0, 'atlas', 'fx_puddle_1')
        .setTint(0xff9d3b).setAlpha(0.5).setDepth(3).setVisible(false) });
  }
};
PC.GreaseWeapon.prototype.desc = function () {
  return ['', 'A burning slick trails behind you', 'Damage up!', 'Wider slick!',
          'Lingers longer!', 'Sticky burn!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.GreaseWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 6;
  else if (this.level === 3) this.segR = 27;
  else if (this.level === 4) this.life = 2.4;
  else if (this.level === 5) { this.dmg = 9; this.slow = true; }
};
PC.GreaseWeapon.prototype.update = function (dt, scene) {
  // drop a segment every ~34px of movement
  var mdx = scene.px - this.lastX, mdy = scene.py - this.lastY;
  if (mdx * mdx + mdy * mdy > 34 * 34) {
    this.lastX = scene.px; this.lastY = scene.py;
    var s0 = null, old = null, oldT = 1e9;
    for (var i = 0; i < this.segs.length; i++) {
      var sg = this.segs[i];
      if (!sg.active) { s0 = sg; break; }
      if (sg.t < oldT) { oldT = sg.t; old = sg; }
    }
    s0 = s0 || old;
    s0.active = true; s0.x = scene.px; s0.y = scene.py;
    s0.t = this.life * (scene.stats.durMult || 1); s0.tick = 0;
    s0.img.setPosition(s0.x, s0.y)
      .setScale(this.segR / 24 * scene.stats.areaMult).setAlpha(0.5).setVisible(true);
    if (PC.audio) PC.audio.weaponVoice('grease');   // fire fwoosh per segment
  }
  var r = this.segR * scene.stats.areaMult, dmg = this.dmg, slow = this.slow, self = this;
  for (var j = 0; j < this.segs.length; j++) {
    var sj = this.segs[j];
    if (!sj.active) continue;
    sj.t -= dt;
    if (sj.t <= 0) { sj.active = false; sj.img.setVisible(false); continue; }
    if (PC.VFX_V2) {
      // living fire: flicker + color ramp mustard->cheese->ketchup as it ages
      var age = 1 - sj.t / (this.life * (scene.stats.durMult || 1));
      sj.img.setTint(age < 0.35 ? 0xff9d3b : age < 0.7 ? 0xf2c33c : 0xd93a3a)
        .setAlpha((0.38 + 0.2 * Math.sin(scene.now * 13 + j * 2.1)) * Math.min(1, sj.t))
        .setScale((this.segR / 24 * scene.stats.areaMult) * (0.9 + 0.12 * Math.sin(scene.now * 9 + j)));
      if (Math.random() < dt * 2.2) {
        scene.fx.burst(sj.x + (Math.random() - 0.5) * 14, sj.y - 6 - Math.random() * 8,
          'fx_spark', 2, 0.28, 0xff9d3b);   // drifting embers
      }
    } else {
      sj.img.setAlpha(0.5 * Math.min(1, sj.t));
    }
    sj.tick -= dt;
    if (sj.tick > 0) continue;
    sj.tick = 0.5;
    (function (sx, sy) {
      scene.enemies.hash.eachNear(sx, sy, function (e) {
        var dx = e.x - sx, dy = e.y - sy;
        if (dx * dx + dy * dy > r * r) return;
        PC.damageEnemy(scene, e, PC.rollDmg(scene, dmg * (self.mastery || 1)), 0, 0, scene._onKillCb);
        if (slow) e.slowUntil = scene.now + 0.5;
      });
    })(sj.x, sj.y);
  }
};

// ---------------------------------------------------------------
// JAWBREAKER - hard candy that caroms from enemy to enemy
// ---------------------------------------------------------------
PC.JawWeapon = function () {
  this.key = 'jaw'; this.name = 'JAWBREAKER';
  this.level = 1; this.max = 5;
  this.cd = 2.6; this.cdT = 0.8; this.dmg = 14; this.bounces = 4;
  this.count = 1; this.scale = 2;
};
PC.JawWeapon.prototype.desc = function () {
  return ['', 'A candy that caroms off foes', 'Damage up!', 'Extra bounce!',
          'Fires two!', 'Giant gobstopper!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.JawWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 20;
  else if (this.level === 3) this.bounces = 6;
  else if (this.level === 4) this.count = 2;
  else if (this.level === 5) { this.dmg = 27; this.scale = 2.6; }
};
PC.JawWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT > 0) return;
  var aim = PC.aimAt(scene, 280);
  if (!aim.target) { this.cdT = 0.3; return; }
  this.cdT = this.cd * scene.stats.cdMult;
  for (var n = 0; n < this.count; n++) {
    scene.bullets.fire(scene.px, scene.py - 4, aim.target.x, aim.target.y,
      { speed: 300, dmg: PC.rollDmg(scene, this.dmg * (this.mastery || 1)),
        frame: 'proj_resizer', scale: this.scale * scene.stats.areaMult,
        tint: 0xf7f4ef, bounces: this.bounces, life: 3 });
  }
  if (PC.audio) PC.audio.weaponVoice('jaw');
};

// ---------------------------------------------------------------
// SPRINKLE SWARM - homing sprinkles that seek scattered foes
// ---------------------------------------------------------------
PC.SprinkleWeapon = function () {
  this.key = 'sprinkle'; this.name = 'SPRINKLE SWARM';
  this.level = 1; this.max = 5;
  this.cd = 2.2; this.cdT = 0.7; this.dmg = 7; this.count = 4; this.seek = 3;
};
PC.SprinkleWeapon.prototype.desc = function () {
  return ['', 'Homing sprinkles seek foes', 'Damage up!', 'More sprinkles!',
          'Seek faster!', 'A full cloud!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.SprinkleWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 10;
  else if (this.level === 3) this.count = 6;
  else if (this.level === 4) this.seek = 5;
  else if (this.level === 5) { this.dmg = 13; this.count = 8; }
};
PC.SprinkleWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT > 0) return;
  this.cdT = this.cd * scene.stats.cdMult;
  var count = this.count + (scene.stats.extraProj || 0) * 2;
  for (var n = 0; n < count; n++) {
    var a = (n / count) * Math.PI * 2 + Math.random() * 0.5;
    scene.bullets.fire(scene.px, scene.py - 6,
      scene.px + Math.cos(a) * 50, scene.py - 6 + Math.sin(a) * 50,
      { speed: 260, dmg: PC.rollDmg(scene, this.dmg * (this.mastery || 1)),
        frame: 'proj_pellet', tint: 0x35d0ff, homing: this.seek, life: 1.6 });   // cyan (color law)
  }
  if (PC.audio) PC.audio.weaponVoice('sprinkle');
};

// ---------------------------------------------------------------
// SKILLET SWING - a pan swing in your facing direction
// ---------------------------------------------------------------
PC.SkilletWeapon = function (scene) {
  this.key = 'skillet'; this.name = 'SKILLET SWING';
  this.level = 1; this.max = 5;
  this.cd = 1.1; this.cdT = 0.4; this.dmg = 15; this.reach = 55;
  this.halfArc = 1.05; this.both = false;
  this.gfx = scene.add.graphics().setDepth(9);
  this.flashT = 0; this.flashAng = 0;
};
PC.SkilletWeapon.prototype.desc = function () {
  return ['', 'A mighty pan swing forward', 'Damage up!', 'Wider arc!',
          'Faster swings!', 'Swings both sides!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.SkilletWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 22;
  else if (this.level === 3) this.halfArc = 1.45;
  else if (this.level === 4) this.cd = 0.8;
  else if (this.level === 5) { this.dmg = 30; this.both = true; }
};
PC.SkilletWeapon.prototype._swing = function (scene, ang) {
  var R = this.reach * scene.stats.areaMult, half = this.halfArc;
  var dmg = PC.rollDmg(scene, this.dmg * (this.mastery || 1));
  var pxp = scene.px, pyp = scene.py - 4;
  scene.enemies.hash.eachNear(pxp, pyp, function (e) {
    var dx = e.x - pxp, dy = e.y - pyp;
    var d2 = dx * dx + dy * dy;
    if (d2 > R * R) return;
    var diff = Math.atan2(dy, dx) - ang;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > half) return;
    var dl = Math.sqrt(d2) || 1;
    PC.damageEnemy(scene, e, dmg, dx / dl * 1.4, dy / dl * 1.4, scene._onKillCb);
  });
  if (scene.boss && !scene.boss.dead) {
    var bdx = scene.boss.x - pxp, bdy = scene.boss.y - pyp;
    if (bdx * bdx + bdy * bdy < (scene.boss.r + R) * (scene.boss.r + R)) {
      scene.hitBoss(scene.boss.x, scene.boss.y, dmg, 0, 0);
    }
  }
};
PC.SkilletWeapon.prototype.update = function (dt, scene) {
  if (this.flashT > 0) {
    this.flashT -= dt;
    var g = this.gfx;
    g.clear();
    if (this.flashT > 0) {
      var R = this.reach * scene.stats.areaMult;
      g.fillStyle(0xcfd4e8, 0.3 * (this.flashT / 0.14));
      g.slice(scene.px, scene.py - 4, R, this.flashAng - this.halfArc,
              this.flashAng + this.halfArc, false);
      g.fillPath();
    }
  }
  this.cdT -= dt;
  if (this.cdT > 0) return;
  this.cdT = this.cd * scene.stats.cdMult;
  var ang = Math.atan2(scene.aimY, scene.aimX);
  this._swing(scene, ang);
  if (this.both) this._swing(scene, ang + Math.PI);
  this.flashT = 0.14; this.flashAng = ang;
  if (PC.audio) PC.audio.weaponVoice('skillet');
};

// ---------------------------------------------------------------
// VORTEX MIXER - a vortex that pulls enemies together
// ---------------------------------------------------------------
PC.VortexWeapon = function (scene) {
  this.key = 'vortex'; this.name = 'VORTEX MIXER';
  this.level = 1; this.max = 5;
  this.cd = 5.5; this.cdT = 2; this.dmg = 4; this.radius = 90;
  this.pull = 180; this.dur = 1.3; this.grind = false;
  this.active = null;   // {x,y,t}
  this.img = scene.add.image(0, 0, 'atlas', 'fx_cyclone_1')
    .setDepth(6).setBlendMode(Phaser.BlendModes.ADD)
    .setTint(0xb45ce8).setVisible(false);
};
PC.VortexWeapon.prototype.desc = function () {
  return ['', 'Pulls foes into a tight pile', 'Bigger pull!', 'Pulls harder!',
          'Faster mixing!', 'Grinds the center!'][Math.min(this.level + 1, 5)] || 'Bigger pull!';
};
PC.VortexWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.radius = 115;
  else if (this.level === 3) { this.pull = 260; this.dur = 1.7; }
  else if (this.level === 4) this.cd = 4.2;
  else if (this.level === 5) { this.grind = true; this.dmg = 9; }
};
PC.VortexWeapon.prototype.update = function (dt, scene) {
  if (!this.active) {
    this.cdT -= dt;
    if (this.cdT <= 0) {
      // drop on a mid-range enemy
      var pool = scene.enemies.pool, pick = null;
      for (var i = 0; i < pool.length; i++) {
        var e = pool[i];
        if (!e.active) continue;
        var dx = e.x - scene.px, dy = e.y - scene.py;
        var d = dx * dx + dy * dy;
        if (d > 60 * 60 && d < 260 * 260) { pick = e; break; }
      }
      if (pick) {
        this.cdT = this.cd * scene.stats.cdMult;
        this.active = { x: pick.x, y: pick.y, t: this.dur, tick: 0 };
        this.img.setPosition(pick.x, pick.y).setScale(1).setAlpha(0.9).setVisible(true);
        if (PC.audio) PC.audio.weaponVoice('vortex');
      } else { this.cdT = 0.4; }
    }
    return;
  }
  var v = this.active;
  v.t -= dt;
  if (v.t <= 0) { this.active = null; this.img.setVisible(false); return; }
  this.img.setRotation(this.img.rotation + 9 * dt)
    .setScale((this.radius / 64) * scene.stats.areaMult * (0.8 + 0.2 * Math.sin(scene.now * 10)));
  var R = this.radius * scene.stats.areaMult, pull = this.pull;
  var dmg = this.dmg, grind = this.grind, self = this;
  v.tick -= dt;
  var doTick = v.tick <= 0;
  if (doTick) v.tick = 0.5;
  scene.enemies.hash.eachNear(v.x, v.y, function (e) {
    var dx = v.x - e.x, dy = v.y - e.y;
    var d2 = dx * dx + dy * dy;
    if (d2 > R * R) return;
    var d = Math.sqrt(d2) || 1;
    e.x += dx / d * pull * dt;
    e.y += dy / d * pull * dt;
    if (doTick && (grind || d < 30)) {
      PC.damageEnemy(scene, e, PC.rollDmg(scene, dmg * (self.mastery || 1)), 0, 0, scene._onKillCb);
    }
  });
};

// ---------------------------------------------------------------
// ESPRESSO CANNON - charges while you stand still, blasts on move
// ---------------------------------------------------------------
PC.EspressoWeapon = function (scene) {
  this.key = 'espresso'; this.name = 'ESPRESSO CANNON';
  this.level = 1; this.max = 5;
  this.chargeTime = 1.4; this.baseDmg = 14; this.maxBonus = 40;
  this.charge = 0; this.splash = false; this.instant = false;
  this.gfx = scene.add.graphics().setDepth(9).setBlendMode(Phaser.BlendModes.ADD);
};
PC.EspressoWeapon.prototype.desc = function () {
  return ['', 'Charges while you stand still', 'Damage up!', 'Charges faster!',
          'Bigger bolt!', 'Splash blast!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.EspressoWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.maxBonus = 60;
  else if (this.level === 3) this.chargeTime = 1.0;
  else if (this.level === 4) this.baseDmg = 22;
  else if (this.level === 5) { this.splash = true; this.maxBonus = 85; }
};
PC.EspressoWeapon.prototype.update = function (dt, scene) {
  var g = this.gfx;
  g.clear();
  if (this.instant) this.charge = 1;   // RISTRETTO RAILGUN: always hot
  if (!scene.moving && !this.instant) {
    this.charge = Math.min(1, this.charge + dt / this.chargeTime);
  }
  if (this.charge > 0.05) {
    // charge ring on the hero
    g.lineStyle(2, 0xb5793f, 0.4 + 0.4 * this.charge);
    g.strokeCircle(scene.px, scene.py - 14, 10 + 6 * this.charge);
  }
  // release: on movement with any charge, or at full charge while still
  var release = (scene.moving && this.charge > 0.25) || this.charge >= 1;
  if (!release) return;
  var aim = PC.aimAt(scene, 500);
  if (!aim.target && !scene.moving) return;   // hold full charge until a target
  var dmg = PC.rollDmg(scene, (this.baseDmg + this.maxBonus * this.charge) * (this.mastery || 1));
  var tx = aim.target ? aim.target.x : scene.px + aim.ax * 300;
  var ty = aim.target ? aim.target.y : scene.py + aim.ay * 300;
  scene.bullets.fire(scene.px, scene.py - 6, tx, ty,
    { speed: 660, dmg: dmg, frame: 'proj_resizer',
      scale: 1.6 + this.charge, tint: 0xb5793f, pierce: 99, life: 1.1 });
  if (this.splash) {
    var pxp = scene.px, pyp = scene.py;
    scene.fx.burst(pxp, pyp - 6, 'fx_nova', 2, 0.25);
  }
  this.charge = 0;
  if (PC.audio) PC.audio.weaponVoice('espresso');
};

// ---------------------------------------------------------------
// PINEAPPLE GUARD - spiky aura + retaliation when you get hit
// ---------------------------------------------------------------
PC.PineappleWeapon = function (scene) {
  this.key = 'pineapple'; this.name = 'PINEAPPLE GUARD';
  this.level = 1; this.max = 5;
  // v0.14.9 rework (Mark approved the archetype-audit fix, spec'd the
  // look): PURE RETALIATION - completely dormant until the player
  // takes a hit, then spikes LAUNCH radially and fly to the screen
  // edge. No ring, no aura - "it fights back" is the whole read.
  this.spikes = 8; this.dmg = 14; this.heal = 0;
  this.lastHurtSeen = 0;
};
PC.PineappleWeapon.prototype.desc = function () {
  return ['', 'Spikes fly out when you get hit', 'Sharper spikes!', 'More spikes!',
          'Heavy spikes!', 'Spike storm!'][Math.min(this.level + 1, 5)] || 'Sharper spikes!';
};
PC.PineappleWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 20;
  else if (this.level === 3) this.spikes = 10;
  else if (this.level === 4) this.dmg = 26;
  else if (this.level === 5) { this.spikes = 12; this.dmg = 34; }
};
PC.PineappleWeapon.prototype.update = function (dt, scene) {
  if (!scene.lastHurtT || scene.lastHurtT === this.lastHurtSeen) return;
  this.lastHurtSeen = scene.lastHurtT;
  var n = this.spikes + (scene.stats.extraProj || 0);
  var dmg = PC.rollDmg(scene, this.dmg * (this.mastery || 1));
  var pxp = scene.px, pyp = scene.py - 4;
  for (var i = 0; i < n; i++) {
    var a = (i / n) * Math.PI * 2 + Math.random() * 0.15;
    scene.bullets.fire(pxp, pyp, pxp + Math.cos(a) * 100, pyp + Math.sin(a) * 100,
      { speed: 430, dmg: dmg, frame: 'proj_pellet', tint: 0xa8e04a,
        scale: 1.5, pierce: 3, life: 1.3 });
  }
  scene.fx.burst(pxp, pyp, 'fx_nova', 3, 0.25, 0xa8e04a);
  if (scene.vfx) scene.vfx.shake(1.5, 70);
  if (this.heal > 0) {
    scene.hp = Math.min(PC.PLAYER.HP + (scene.stats.bonusHp || 0), scene.hp + this.heal);
    scene.drawHud();
  }
  if (PC.audio) PC.audio.weaponVoice('pineapple');
};