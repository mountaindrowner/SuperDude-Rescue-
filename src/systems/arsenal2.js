// arsenal2.js - Arsenal Expansion slice 2 (Mark's three named weapons).
// Ketchup Artillery (lobbed shell + slowing puddle), Microwave Beam
// (rotating sweep), Fridge Wall (soft-blocking barrier). Same weapon
// contract as weapons.js/kits.js; everything pooled and capped.
window.PC = window.PC || {};

// ---------------------------------------------------------------
// KETCHUP ARTILLERY - lobbed shell arcs onto a far cluster, bursts,
// leaves a slowing puddle (player-red, distinct from boss ketchup)
// ---------------------------------------------------------------
PC.KetchupWeapon = function (scene) {
  this.key = 'ketchup'; this.name = 'KETCHUP ARTILLERY';
  this.level = 1; this.max = 5;
  this.cd = 3.2; this.cdT = 1; this.dmg = 16; this.burstR = 38;
  this.shells = 1; this.puddleLife = 2.5; this.puddleDmg = 3;
  this.puddles = [];
  for (var i = 0; i < 5; i++) {
    this.puddles.push({ active: false, x: 0, y: 0, t: 0, tick: 0,
      img: scene.add.image(0, 0, 'atlas', 'fx_puddle_1')
        .setTint(0xff6b6b).setAlpha(0.6).setDepth(3).setVisible(false) });
  }
};
PC.KetchupWeapon.prototype.desc = function () {
  return ['', 'Shells burst into slowing puddles', 'Damage up!', 'Bigger splats!',
          'Twin shells!', 'Extra sticky!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.KetchupWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 24;
  else if (this.level === 3) { this.burstR = 48; this.puddleLife = 3.2; }
  else if (this.level === 4) this.shells = 2;
  else if (this.level === 5) { this.dmg = 34; this.puddleDmg = 6; }
};
PC.KetchupWeapon.prototype._land = function (scene, x, y) {
  var r = this.burstR * scene.stats.areaMult;
  var dmg = PC.rollDmg(scene, this.dmg * (this.mastery || 1));
  // v0.23.0 IMPACT (Mark: "when the ketchup lands it should be landing
  // on like a splash, a big blobby splash, not just a cube or that
  // round shape"): the blobby splat frames, a white flash of impact,
  // and gobs of sauce thrown outward that land a beat later.
  scene.fx.burstRot(x, y, 'fx_splat', 4, 0.44, 0xff6b6b, 1.15 * scene.stats.areaMult);
  scene.fx.burst(x, y, 'fx_pop', 4, 0.15, 0xffd0c0, 0.9);   // impact flash
  // gobs of sauce thrown clear, landing a beat after the main hit. Small
  // rotated splats (not white sparks) so every piece reads as ketchup.
  var gobs = 11;
  for (var gi = 0; gi < gobs; gi++) {
    (function (i2) {
      var ga = (i2 / gobs) * Math.PI * 2 + Math.random() * 0.6;
      var gd = r * (0.62 + Math.random() * 0.8);
      scene.time.delayedCall(55 + i2 * 16, function () {
        scene.fx.burstRot(x + Math.cos(ga) * gd, y + Math.sin(ga) * gd * 0.7,
          'fx_splat', 4, 0.3, 0xff6b6b, 0.20 + Math.random() * 0.14);
      });
    })(gi);
  }
  if (scene.vfx) scene.vfx.shake(1.6, 90);
  scene.enemies.hash.eachNear(x, y, function (e) {
    var dx = e.x - x, dy = e.y - y;
    if (dx * dx + dy * dy > r * r) return;
    var dl = Math.sqrt(dx * dx + dy * dy) || 1;
    PC.damageEnemy(scene, e, dmg, dx / dl * 0.8, dy / dl * 0.8, scene._onKillCb);
  });
  if (scene.boss && !scene.boss.dead) {
    var bdx = scene.boss.x - x, bdy = scene.boss.y - y;
    if (bdx * bdx + bdy * bdy < (scene.boss.r + r) * (scene.boss.r + r)) {
      scene.hitBoss(scene.boss.x, scene.boss.y, dmg, 0, 0);
    }
  }
  // puddle
  var p = null, oldT = 1e9, old = null;
  for (var i = 0; i < this.puddles.length; i++) {
    var pu = this.puddles[i];
    if (!pu.active) { p = pu; break; }
    if (pu.t < oldT) { oldT = pu.t; old = pu; }
  }
  p = p || old;
  p.active = true; p.x = x; p.y = y;
  p.t = this.puddleLife * (scene.stats.durMult || 1); p.tick = 0;
  p.img.setPosition(x, y).setScale(1.05 * scene.stats.areaMult)
    .setAngle(Math.random() * 360)          // no two puddles look stamped
    .setAlpha(0.6).setVisible(true);
  if (PC.audio) PC.audio.splat();
};
PC.KetchupWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT <= 0) {
    // target: a random-ish enemy at range (artillery = far work)
    var pool = scene.enemies.pool, picks = [];
    for (var i = 0; i < pool.length; i++) {
      var e = pool[i];
      if (!e.active) continue;
      var dx = e.x - scene.px, dy = e.y - scene.py;
      var d = dx * dx + dy * dy;
      if (d > 80 * 80 && d < 320 * 320) { picks.push(e); if (picks.length > 10) break; }
    }
    if (picks.length) {
      this.cdT = this.cd * scene.stats.cdMult;
      var self = this;
      for (var n = 0; n < this.shells; n++) {
        var t = picks[(Math.random() * picks.length) | 0];
        if (PC.VFX_V2 && scene.vfx) {
          scene.vfx.telegraphRing(t.x, t.y,
            this.burstR * scene.stats.areaMult, 750 + n * 150);
        }
        (function (tx, ty, delay) {
          // lobbed shell: tween up-and-over, land -> burst
          var sh = scene.add.image(scene.px, scene.py - 10, 'atlas', 'sig_ketchup_shell')
            .setDepth(15);
          scene.tweens.add({ targets: sh, x: tx, duration: 700, delay: delay });
          scene.tweens.add({ targets: sh, y: ty - 70, duration: 350, delay: delay, ease: 'Quad.out',
            onComplete: function () {
              scene.tweens.add({ targets: sh, y: ty, duration: 350, ease: 'Quad.in',
                onComplete: function () { sh.destroy(); self._land(scene, tx, ty); } });
            } });
        })(t.x, t.y, n * 150);
      }
      if (PC.audio) PC.audio.weaponVoice('ketchup');
    } else { this.cdT = 0.4; }
  }
  // puddles: slow + light dmg tick
  for (var j = 0; j < this.puddles.length; j++) {
    var pt = this.puddles[j];
    if (!pt.active) continue;
    pt.t -= dt;
    if (pt.t <= 0) { pt.active = false; pt.img.setVisible(false); continue; }
    pt.img.setAlpha(0.6 * Math.min(1, pt.t));
    pt.tick -= dt;
    if (pt.tick > 0) continue;
    pt.tick = 0.5;
    var pr = 30 * scene.stats.areaMult, pd = this.puddleDmg, s2 = scene;
    (function (px2, py2) {
      s2.enemies.hash.eachNear(px2, py2, function (e) {
        var dx = e.x - px2, dy = e.y - py2;
        if (dx * dx + dy * dy > pr * pr) return;
        e.slowUntil = s2.now + 0.7;
        PC.damageEnemy(s2, e, pd, 0, 0, s2._onKillCb);
      });
    })(pt.x, pt.y);
  }
};

// ---------------------------------------------------------------
// MICROWAVE BEAM - a beam sweeps slowly around the player
// ---------------------------------------------------------------
PC.MicrowaveWeapon = function (scene) {
  this.key = 'microwave'; this.name = 'MICROWAVE BEAM';
  this.level = 1; this.max = 5;
  this.dmg = 7; this.length = 110; this.degS = 70; this.halfArc = 0.16;
  this.beams = 1; this.angle = 0; this.tickCd = 0.4;
  this.gfx = scene.add.graphics().setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
};
PC.MicrowaveWeapon.prototype.desc = function () {
  return ['', 'A beam sweeps around you', 'Damage up!', 'Longer beam!',
          'Sweeps faster!', 'Wider + hotter!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.MicrowaveWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 11;
  else if (this.level === 3) this.length = 150;
  else if (this.level === 4) this.degS = 110;
  else if (this.level === 5) { this.halfArc = 0.24; this.dmg = 15; }
};
PC.MicrowaveWeapon.prototype.update = function (dt, scene) {
  if (PC.audio) PC.audio.weaponVoice('microwave');   // sweep hum loop
  this.angle += this.degS * Math.PI / 180 * dt;
  var L = this.length * scene.stats.areaMult;
  var pxp = scene.px, pyp = scene.py - 4;
  var g = this.gfx;
  g.clear();
  var dmg = this.dmg, half = this.halfArc, tickCd = this.tickCd, self = this;
  for (var b = 0; b < this.beams; b++) {
    var a = this.angle + b * Math.PI;
    var ex = pxp + Math.cos(a) * L, ey = pyp + Math.sin(a) * L;
    g.lineStyle(6, 0xff9d3b, 0.25).lineBetween(pxp, pyp, ex, ey);
    g.lineStyle(2, 0xf7f4ef, 0.7).lineBetween(pxp, pyp, ex, ey);
    g.fillStyle(0xff9d3b, 0.5).fillCircle(ex, ey, 4);
    // corridor damage: enemies within length + angular window
    var pool = scene.enemies.pool;
    for (var i = 0; i < pool.length; i++) {
      var e = pool[i];
      if (!e.active) continue;
      var dx = e.x - pxp, dy = e.y - pyp;
      var d2 = dx * dx + dy * dy;
      if (d2 > L * L) continue;
      var diff = Math.atan2(dy, dx) - a;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > half) continue;
      if (scene.now < (e.mwCd || 0)) continue;
      e.mwCd = scene.now + tickCd;
      var dl = Math.sqrt(d2) || 1;
      PC.damageEnemy(scene, e, PC.rollDmg(scene, dmg * (self.mastery || 1)),
        dx / dl * 0.4, dy / dl * 0.4, scene._onKillCb);
    }
    if (scene.boss && !scene.boss.dead && scene.now >= (scene._mwBossCd || 0)) {
      var bdx = scene.boss.x - pxp, bdy = scene.boss.y - pyp;
      if (bdx * bdx + bdy * bdy < L * L) {
        var bdiff = Math.atan2(bdy, bdx) - a;
        while (bdiff > Math.PI) bdiff -= Math.PI * 2;
        while (bdiff < -Math.PI) bdiff += Math.PI * 2;
        if (Math.abs(bdiff) < half + 0.1) {
          scene._mwBossCd = scene.now + tickCd;
          scene.hitBoss(scene.boss.x, scene.boss.y, dmg * scene.stats.dmgMult, 0, 0);
        }
      }
    }
  }
};

// ---------------------------------------------------------------
// FRIDGE WALL - chilled barrier that damages + shoves (soft-block)
// ---------------------------------------------------------------
PC.FridgeWeapon = function (scene) {
  this.key = 'fridge'; this.name = 'FRIDGE WALL';
  this.level = 1; this.max = 5;
  this.cd = 6; this.cdT = 1.5; this.dmg = 8; this.length = 60; this.life = 5;
  this.kb = 1.6; this.orbit = false; this.orbitA = 0;
  this.walls = [];
  this.gfx = scene.add.graphics().setDepth(7);
  for (var i = 0; i < 4; i++) {
    this.walls.push({ active: false, x: 0, y: 0, ang: 0, t: 0 });
  }
};
PC.FridgeWeapon.prototype.desc = function () {
  return ['', 'Drops a chilling barrier wall', 'Damage up!', 'Lasts longer!',
          'Wider wall!', 'Icy shove!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.FridgeWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 12;
  else if (this.level === 3) this.life = 7;
  else if (this.level === 4) this.length = 84;
  else if (this.level === 5) { this.kb = 2.6; this.dmg = 16; }
};
PC.FridgeWeapon.prototype.update = function (dt, scene) {
  if (!this.orbit) {
    this.cdT -= dt;
    if (this.cdT <= 0) {
      this.cdT = this.cd * scene.stats.cdMult;
      var slot = null, old = null, oldT = 1e9;
      for (var i = 0; i < this.walls.length; i++) {
        if (i >= 3) break;                       // 3 placed walls max
        var w = this.walls[i];
        if (!w.active) { slot = w; break; }
        if (w.t < oldT) { oldT = w.t; old = w; }
      }
      var wl = slot || old;
      var aim = Math.atan2(scene.aimY, scene.aimX);
      wl.active = true;
      wl.x = scene.px + Math.cos(aim) * 44;
      wl.y = scene.py + Math.sin(aim) * 44;
      wl.ang = aim + Math.PI / 2;                // perpendicular to aim
      wl.t = this.life * (scene.stats.durMult || 1);
      scene.fx.burst(wl.x, wl.y, 'fx_freeze', 1, 0.3);
      if (PC.audio) PC.audio.weaponVoice('fridge');
    }
  } else {
    // BUNKER FRIDGE evolution: 4 walls orbit the player
    this.orbitA += 0.8 * dt;
    for (var o = 0; o < 4; o++) {
      var ow = this.walls[o];
      var oa = this.orbitA + o * Math.PI / 2;
      ow.active = true;
      ow.x = scene.px + Math.cos(oa) * 55;
      ow.y = scene.py - 4 + Math.sin(oa) * 55;
      ow.ang = oa + Math.PI / 2;
      ow.t = 1;
    }
  }
  var g = this.gfx;
  g.clear();
  var L = this.length * scene.stats.areaMult / 2;
  var dmg = this.dmg, kb = this.kb, self = this;
  for (var j = 0; j < this.walls.length; j++) {
    var wj = this.walls[j];
    if (!wj.active) continue;
    if (!this.orbit) {
      wj.t -= dt;
      if (wj.t <= 0) { wj.active = false; continue; }
    }
    var ca = Math.cos(wj.ang), sa = Math.sin(wj.ang);
    var x1 = wj.x - ca * L, y1 = wj.y - sa * L;
    var x2 = wj.x + ca * L, y2 = wj.y + sa * L;
    var fade = this.orbit ? 1 : Math.min(1, wj.t);
    g.lineStyle(7, 0x9adfff, 0.5 * fade).lineBetween(x1, y1, x2, y2);
    g.lineStyle(3, 0xf7f4ef, 0.8 * fade).lineBetween(x1, y1, x2, y2);
    // contact: distance from segment < threshold -> dmg tick + shove
    (function (wx, wy, wca, wsa) {
      scene.enemies.hash.eachNear(wx, wy, function (e) {
        var rx = e.x - wx, ry = e.y - wy;
        var along = rx * wca + ry * wsa;
        if (Math.abs(along) > L) return;
        var perp = rx * -wsa + ry * wca;         // signed distance from wall
        if (Math.abs(perp) > e.r + 7) return;
        if (scene.now < (e.wallCd || 0)) return;
        e.wallCd = scene.now + 0.4;
        var sgn = perp >= 0 ? 1 : -1;            // shove away from wall
        PC.damageEnemy(scene, e, PC.rollDmg(scene, dmg * (self.mastery || 1)),
          -wsa * sgn * kb, wca * sgn * kb, scene._onKillCb);
        e.slowUntil = scene.now + 0.4;           // chilled
      });
    })(wj.x, wj.y, ca, sa);
  }
};
