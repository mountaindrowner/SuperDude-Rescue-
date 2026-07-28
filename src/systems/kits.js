// kits.js - per-hero signature kits (Track 0, PHASE2 §6). Each hero:
// signature starting weapon + always-on passive + (Danny) a level-up
// special. Extends weapons.js conventions - every weapon: key, name,
// level/max, desc(), applyLevel(), update(dt, scene). All pooled, all
// capped. Kit picks (Mark delegated): Danny A, Victoria B, Nayah A,
// Kevin A, Carlos C, Josh B - each VS archetype used exactly once.
window.PC = window.PC || {};

// crit-aware damage roll (Carlos passive). critChance defaults 0 so
// every existing weapon is byte-identical for non-Carlos heroes.
PC.rollDmg = function (scene, base) {
  var d = base * scene.stats.dmgMult;
  if (scene.stats.critChance && Math.random() < scene.stats.critChance) {
    scene._lastCrit = true;
    return d * 2;
  }
  scene._lastCrit = false;
  return d;
};

// ---------------------------------------------------------------
// VICTORIA (kit B) - POCKET SENTRY: deployable turrets
// ---------------------------------------------------------------
PC.SentryWeapon = function (scene) {
  this.key = 'sentry'; this.name = 'POCKET SENTRY';
  this.level = 1; this.max = 5;
  this.cd = 7; this.cdT = 1.2; this.maxTurrets = 2;
  this.fireCd = 0.55; this.dmg = 8; this.range = 200; this.life = 14;
  this.turrets = [];
  for (var i = 0; i < 3; i++) {
    this.turrets.push({ active: false, x: 0, y: 0, t: 0, fireT: 0,
      sprite: scene.add.image(0, 0, 'atlas', 'pickup_crate')
        .setScale(0.7).setDepth(7).setTint(0x9adfff).setVisible(false) });
  }
};
PC.SentryWeapon.prototype.desc = function () {
  return ['', 'Deploys pellet turrets', 'Faster firing!', 'Damage up!',
          'Third turret!', 'Range + damage up!'][Math.min(this.level + 1, 5)] || 'Faster firing!';
};
PC.SentryWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.fireCd = 0.38;
  else if (this.level === 3) this.dmg = 12;
  else if (this.level === 4) this.maxTurrets = 3;
  else if (this.level === 5) { this.range = 260; this.dmg = 16; }
};
PC.SentryWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT <= 0) {
    this.cdT = this.cd * scene.stats.cdMult;
    var slot = null, oldest = null, oldestT = 1e9;
    for (var i = 0; i < this.turrets.length; i++) {
      if (i >= this.maxTurrets) break;
      var tr = this.turrets[i];
      if (!tr.active) { slot = tr; break; }
      if (tr.t < oldestT) { oldestT = tr.t; oldest = tr; }
    }
    var t = slot || oldest;
    t.active = true; t.x = scene.px; t.y = scene.py;
    t.t = this.life * (scene.stats.durMult || 1);
    t.fireT = 0.2;
    t.sprite.setPosition(t.x, t.y - 6).setVisible(true).setAlpha(1);
    if (PC.VFX_V2 && scene.vfx) scene.vfx.telegraphRing(t.x, t.y - 6, 16, 450, 0x35d0ff);
    scene.fx.burst(t.x, t.y - 6, 'fx_nova', 3, 0.2);
    if (PC.audio) PC.audio.ui();
  }
  for (var j = 0; j < this.turrets.length; j++) {
    var tu = this.turrets[j];
    if (!tu.active) continue;
    tu.t -= dt;
    if (tu.t <= 0) { tu.active = false; tu.sprite.setVisible(false); continue; }
    if (tu.t < 2) tu.sprite.setAlpha(0.4 + 0.3 * Math.sin(tu.t * 12));
    tu.fireT -= dt;
    if (tu.fireT > 0) continue;
    // nearest enemy in range
    var best = null, bestD = this.range * this.range;
    var pool = scene.enemies.pool;
    for (var k = 0; k < pool.length; k++) {
      var e = pool[k];
      if (!e.active) continue;
      var dx = e.x - tu.x, dy = e.y - tu.y;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) {
      tu.fireT = this.fireCd;
      if (PC.VFX_V2 && scene.vfx) scene.vfx.muzzleFlash(tu.x, tu.y - 8);
      scene.bullets.fire(tu.x, tu.y - 8, best.x, best.y,
        { speed: 460, dmg: PC.rollDmg(scene, this.dmg * (this.mastery || 1)), frame: 'proj_pellet', life: 0.6 });
      if (PC.audio) PC.audio.shoot();
    } else { tu.fireT = 0.2; }
  }
};

// ---------------------------------------------------------------
// NAYAH (kit A) - THORN SEEDS: lobbed seeds bloom into DoT patches
// ---------------------------------------------------------------
PC.SeedWeapon = function (scene) {
  this.key = 'seeds'; this.name = 'THORN SEEDS';
  this.level = 1; this.max = 5;
  this.cd = 2.2; this.cdT = 0.8; this.dmg = 6; this.radius = 34;
  this.life = 4; this.maxPatches = 6;
  this.patches = [];
  for (var i = 0; i < 8; i++) {
    this.patches.push({ active: false, x: 0, y: 0, t: 0, tick: 0,
      sprite: scene.add.image(0, 0, 'atlas', 'fx_aura_1')
        .setDepth(3).setTint(0x7dd97b).setAlpha(0.55)
        .setBlendMode(Phaser.BlendModes.ADD).setVisible(false) });
  }
};
PC.SeedWeapon.prototype.desc = function () {
  return ['', 'Seeds bloom into thorn patches', 'Damage up!', 'Bigger + longer!',
          'Faster seeding!', 'Sharper thorns!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.SeedWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 9;
  else if (this.level === 3) { this.radius = 44; this.life = 5; }
  else if (this.level === 4) this.cd = 1.6;
  else if (this.level === 5) { this.dmg = 13; this.maxPatches = 8; }
};
PC.SeedWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT <= 0) {
    this.cdT = this.cd * scene.stats.cdMult;
    var aim = PC.aimAt(scene, 300);
    var tx, ty;
    if (aim.target) { tx = aim.target.x; ty = aim.target.y; }
    else {
      tx = scene.px + aim.ax * (90 + Math.random() * 90);
      ty = scene.py + aim.ay * (90 + Math.random() * 90);
    }
    var p = null, oldest = null, oldestT = 1e9, live = 0;
    for (var i = 0; i < this.patches.length; i++) {
      var pa = this.patches[i];
      if (pa.active) { live++; if (pa.t < oldestT) { oldestT = pa.t; oldest = pa; } }
      else if (!p) p = pa;
    }
    if (live >= this.maxPatches || !p) p = oldest;
    p.active = true; p.x = tx; p.y = ty;
    p.t = this.life * (scene.stats.durMult || 1); p.tick = 0;
    p.sprite.setPosition(tx, ty).setScale(this.radius / 28)
      .setAlpha(0).setVisible(true);
    scene.tweens.add({ targets: p.sprite, alpha: 0.55, duration: 180 });
    scene.fx.burst(tx, ty, 'fx_spark', 3, 0.2);
    if (PC.audio) PC.audio.shoot();
  }
  var dmg = this.dmg, r = this.radius * scene.stats.areaMult, self = this;
  for (var j = 0; j < this.patches.length; j++) {
    var pt = this.patches[j];
    if (!pt.active) continue;
    pt.t -= dt;
    if (pt.t <= 0) { pt.active = false; pt.sprite.setVisible(false); continue; }
    pt.sprite.setAlpha(0.4 + 0.15 * Math.sin(scene.now * 6 + j));
    pt.tick -= dt;
    if (pt.tick > 0) continue;
    pt.tick = 0.5;
    (function (px2, py2) {
      scene.enemies.hash.eachNear(px2, py2, function (e) {
        var dx = e.x - px2, dy = e.y - py2;
        if (dx * dx + dy * dy > r * r) return;
        var dl = Math.sqrt(dx * dx + dy * dy) || 1;
        PC.damageEnemy(scene, e, PC.rollDmg(scene, dmg), dx / dl * 0.3, dy / dl * 0.3, scene._onKillCb);
        if (self.root) e.slowUntil = scene.now + 0.7;   // Nayah flavor: patches root
      });
    })(pt.x, pt.y);
  }
};

// ---------------------------------------------------------------
// KEVIN (kit A) - RESCUE STRIKE: marked chopper strafe on the crowd
// ---------------------------------------------------------------
PC.StrikeWeapon = function (scene) {
  this.key = 'strike'; this.name = 'RESCUE STRIKE';
  this.level = 1; this.max = 5;
  this.cd = 6; this.cdT = 2; this.dmg = 20; this.count = 4; this.radius = 34;
  this.marker = scene.add.image(0, 0, 'atlas', 'fx_nova_1')
    .setDepth(6).setTint(0xf2c33c).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
  this.pending = null;   // {x,y,ang,at,fired}
};
PC.StrikeWeapon.prototype.desc = function () {
  return ['', 'Calls a rescue strafe on the crowd', 'Bigger booms!', 'Longer strafe!',
          'Faster support!', 'Full barrage!'][Math.min(this.level + 1, 5)] || 'Bigger booms!';
};
PC.StrikeWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 28;
  else if (this.level === 3) this.count = 6;
  else if (this.level === 4) this.cd = 4.5;
  else if (this.level === 5) { this.dmg = 40; this.radius = 42; }
};
PC.StrikeWeapon.prototype.update = function (dt, scene) {
  if (!this.pending) {
    this.cdT -= dt;
    if (this.cdT <= 0) {
      // densest cluster: sample active enemies, count neighbors within 60
      var pool = scene.enemies.pool, best = null, bestN = -1, checked = 0;
      for (var i = 0; i < pool.length && checked < 14; i++) {
        var e = pool[i];
        if (!e.active) continue;
        checked++;
        var n = 0;
        scene.enemies.hash.eachNear(e.x, e.y, function (o) {
          var dx = o.x - e.x, dy = o.y - e.y;
          if (dx * dx + dy * dy < 60 * 60) n++;
        });
        if (n > bestN) { bestN = n; best = e; }
      }
      if (best) {
        this.cdT = this.cd * scene.stats.cdMult;
        this.pending = { x: best.x, y: best.y, ang: Math.random() * Math.PI,
                         at: scene.now + 0.8, fired: 0, nextAt: 0 };
        if (PC.VFX_V2 && scene.vfx) {
          // proper pulsing reticle over the strike zone (color law: danger red)
          scene.vfx.telegraphRing(best.x, best.y,
            (this.radius + 22) * scene.stats.areaMult, 820);
          this.marker.setVisible(false);
        } else {
          this.marker.setPosition(best.x, best.y).setScale(0.8).setAlpha(0.9).setVisible(true);
        }
        if (PC.audio) PC.audio.telegraph();
      } else { this.cdT = 0.4; }
    }
  }
  if (this.pending) {
    var p = this.pending;
    if (scene.now < p.at) {
      if (!(PC.VFX_V2 && scene.vfx)) {
        this.marker.setScale(0.7 + 0.25 * Math.sin(scene.now * 14))
          .setAlpha(0.55 + 0.35 * Math.sin(scene.now * 14));
      }
      return;
    }
    this.marker.setVisible(false);
    if (scene.now >= p.nextAt) {
      p.nextAt = scene.now + 0.08;
      var total = this.count + (this.bonusPass || 0);
      var idx = p.fired - (total - 1) / 2;
      var bx = p.x + Math.cos(p.ang) * idx * 40;
      var by = p.y + Math.sin(p.ang) * idx * 40;
      var r = this.radius * scene.stats.areaMult, dmg = PC.rollDmg(scene, this.dmg * (this.mastery || 1));
      var boom = function () {
        scene.fx.burst(bx, by, 'fx_pop', 4, 0.28);
        scene.fx.burst(bx, by, 'fx_nova', 2, 0.2);
        if (scene.vfx) scene.vfx.shake(2, 70);
        else scene.cameras.main.shake(60, 0.002);
        scene.enemies.hash.eachNear(bx, by, function (e) {
          var dx = e.x - bx, dy = e.y - by;
          if (dx * dx + dy * dy > r * r) return;
          var dl = Math.sqrt(dx * dx + dy * dy) || 1;
          PC.damageEnemy(scene, e, dmg, dx / dl, dy / dl, scene._onKillCb);
        });
        if (scene.boss && !scene.boss.dead) {
          var bdx = scene.boss.x - bx, bdy = scene.boss.y - by;
          if (bdx * bdx + bdy * bdy < (scene.boss.r + r) * (scene.boss.r + r)) {
            scene.hitBoss(bx, by, dmg, 0, 0);
          }
        }
        if (PC.audio) PC.audio.pop();
      };
      if (PC.VFX_V2 && scene.vfx) {
        // Task 4: a visible bomb FALLS onto the point, then detonates
        var bomb = scene.add.image(bx, by - 85, 'atlas', 'sig_bomb')
          .setDepth(15);
        scene.tweens.add({ targets: bomb, y: by, duration: 160, ease: 'Quad.in',
          onComplete: function () { bomb.destroy(); boom(); } });
      } else {
        boom();
      }
      p.fired++;
      if (p.fired >= this.count + (this.bonusPass || 0)) this.pending = null;
    }
  }
};

// ---------------------------------------------------------------
// CARLOS (kit C) - COMET BEAM: pierces to the FARTHEST enemy
// ---------------------------------------------------------------
PC.BeamWeapon = function () {
  this.key = 'beam'; this.name = 'COMET BEAM';
  this.level = 1; this.max = 5;
  this.cd = 1.5; this.cdT = 0.5; this.dmg = 14; this.beams = 1;
};
PC.BeamWeapon.prototype.desc = function () {
  return ['', 'Snipes the farthest foe, pierces all', 'Damage up!', 'Twin comets!',
          'Faster comets!', 'Comet storm!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.BeamWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 20;
  else if (this.level === 3) this.beams = 2;
  else if (this.level === 4) this.cd = 1.1;
  else if (this.level === 5) this.dmg = 28;
};
PC.BeamWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT > 0) return;
  var pool = scene.enemies.pool, best = null, bestD = -1;
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (!e.active) continue;
    var dx = e.x - scene.px, dy = e.y - scene.py;
    var d = dx * dx + dy * dy;
    if (d > bestD) { bestD = d; best = e; }
  }
  if (!best) { this.cdT = 0.3; return; }
  this.cdT = this.cd * scene.stats.cdMult;
  var beams = this.beams + (scene.stats.extraProj || 0);
  for (var n = 0; n < beams; n++) {
    var ox = (n - (beams - 1) / 2) * 10;
    var bd = PC.rollDmg(scene, this.dmg * (this.mastery || 1));
    if (this.critBoost && !scene._lastCrit && Math.random() < this.critBoost) {
      bd *= 2; scene._lastCrit = true;   // Carlos flavor: comets crit extra
    }
    scene.bullets.fire(scene.px + ox, scene.py - 6, best.x, best.y,
      { speed: 700, dmg: bd, frame: 'proj_resizer',
        pierce: 99, life: 1.5 });
  }
  scene.fx.burst(scene.px, scene.py - 6, 'fx_muzzle', 2, 0.1);
  if (PC.audio) PC.audio.shoot();
};

// ---------------------------------------------------------------
// JOSH (kit B) - ROPE CYCLONE: breathing whip ring, heavy knockback
// ---------------------------------------------------------------
PC.LassoWeapon = function (scene) {
  this.key = 'lasso'; this.name = 'ROPE CYCLONE';
  this.level = 1; this.max = 5;
  this.rMin = 36; this.rMax = 64; this.dmg = 10; this.tickCd = 0.5;
  this.gfx = scene.add.graphics().setDepth(9);
};
PC.LassoWeapon.prototype.desc = function () {
  return ['', 'A spinning rope ring flings foes', 'Damage up!', 'Wider swing!',
          'Faster whipping!', 'Rope of legend!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.LassoWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 12;
  else if (this.level === 3) { this.rMin = 44; this.rMax = 78; }
  else if (this.level === 4) this.tickCd = 0.35;
  else if (this.level === 5) this.dmg = 18;
};
PC.LassoWeapon.prototype.update = function (dt, scene) {
  // Task 9 (approved): every ~5s the rope PULLS the crowd in for
  // 0.5s, then SLAMS them away - Josh is THE crowd-control hero
  if (PC.JOSH_PULLSLAM) {
    this._slamT = (this._slamT === undefined ? 3 : this._slamT) - dt;
    if (this._slamT <= 0 && !this._pulling) {
      this._pulling = 0.5;
      if (scene.vfx) scene.vfx.telegraphRing(scene.px, scene.py - 4,
        (this.rMax + 26) * scene.stats.areaMult, 500, 0xb5793f);
      if (PC.audio) PC.audio.telegraph();
    }
    if (this._pulling) {
      this._pulling -= dt;
      var pR = (this.rMax + 26) * scene.stats.areaMult;
      var ppx = scene.px, ppy = scene.py - 4;
      scene.enemies.hash.eachNear(ppx, ppy, function (e) {
        var dx = ppx - e.x, dy = ppy - e.y;
        var d2 = dx * dx + dy * dy;
        if (d2 > pR * pR) return;
        var d = Math.sqrt(d2) || 1;
        e.x += dx / d * 240 * dt;
        e.y += dy / d * 240 * dt;
      });
      if (this._pulling <= 0) {
        this._pulling = 0; this._slamT = 5;
        this._spinup = 0.25;          // the lasso must spin back up after a slam
        var sR = (this.rMax + 20) * scene.stats.areaMult;
        var sdmg = PC.rollDmg(scene, this.dmg * 2 * (this.mastery || 1));
        var stun = this.stun;
        scene.fx.burst(ppx, ppy, 'fx_nova', 3, 0.3);
        if (scene.vfx) scene.vfx.shake(2.5, 100);
        scene.enemies.hash.eachNear(ppx, ppy, function (e) {
          var dx = e.x - ppx, dy = e.y - ppy;
          var d2 = dx * dx + dy * dy;
          if (d2 > sR * sR) return;
          var d = Math.sqrt(d2) || 1;
          PC.damageEnemy(scene, e, sdmg, dx / d * 2.4, dy / d * 2.4, scene._onKillCb);
          if (stun) e.slowUntil = scene.now + 0.8;
        });
        if (PC.audio) PC.audio.pop();
      }
    }
  }
  // v0.14.2 lasso morph (Mark: "begins as a small rotating circle at
  // the end of the lasso which gradually ends at the full loop
  // around"): the rope from Josh's hand ends in a CLOSED loop that
  // starts small, twirling fast at the rope tip, and GROWS as it
  // spins up until the loop is the full circle around him. Damage is
  // whatever the drawn loop touches, so the post-slam wind-up (small
  // loop) is a real vulnerability window.
  if (this._spinup === undefined) this._spinup = 1;
  this._spinup = Math.min(1, this._spinup + dt / 1.4);
  var spin = this._spinup;
  this._spinA = (this._spinA || 0) + dt * (9 - 4 * spin);   // small = fast twirl
  var am = scene.stats.areaMult;
  var r = (this.rMin + (this.rMax - this.rMin) * (0.5 + 0.5 * Math.sin(scene.now * 5.2))) * am;
  var lead = this._spinA;
  var pxp = scene.px, pyp = scene.py - 4;
  // cowboy swing, LEVEL-driven (Mark v0.14.4): at L1 a small loop
  // swings WIDE at the end of the rope; each level grows the loop and
  // reels the swing inward, until max level is the complete circle
  // around him. The post-slam spin-up briefly TIGHTENS the loop (the
  // vulnerability window) without changing where it swings.
  var k = (this.level - 1) / (this.max - 1);      // 0 at L1 -> 1 at max
  var loopR = (16 + (r - 16) * k) * (0.35 + 0.65 * spin);
  var orbit = (r - loopR) * (1 - k);              // wide swing -> centered
  var cx2 = pxp + Math.cos(lead) * orbit;
  var cy2 = pyp + Math.sin(lead) * orbit;
  var g = this.gfx;
  g.clear();
  // the loop (always closed - it IS the lasso)
  g.lineStyle(3, 0xb5793f, 0.85);
  g.strokeCircle(cx2, cy2, loopR);
  g.lineStyle(1, 0xf2c33c, 0.35 + 0.25 * spin);
  g.strokeCircle(cx2, cy2, loopR + 2);
  // rope from Josh's hand to the loop's near edge, with a little sag
  var hx = pxp + 5 * scene.facing, hy = pyp - 4;
  var ha = Math.atan2(hy - cy2, hx - cx2);
  var kx = cx2 + Math.cos(ha) * loopR, ky = cy2 + Math.sin(ha) * loopR;
  var mx = (hx + kx) / 2 + Math.cos(lead + 1.7) * 5;
  var my = (hy + ky) / 2 + Math.sin(lead + 1.7) * 5;
  g.lineStyle(2, 0xb5793f, 0.9);
  g.beginPath(); g.moveTo(hx, hy); g.lineTo(mx, my); g.lineTo(kx, ky); g.strokePath();
  g.fillStyle(0xf2c33c, 0.9).fillCircle(kx, ky, 2.5);  // the knot
  // damage: whatever the drawn loop touches
  var dmg = this.dmg, tickCd = this.tickCd, self = this;
  scene.enemies.hash.eachNear(cx2, cy2, function (e) {
    var dx = e.x - cx2, dy = e.y - cy2;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (Math.abs(d - loopR) > e.r + 7) return;
    if (scene.now < (e.lassoCd || 0)) return;
    e.lassoCd = scene.now + tickCd;
    if (self.stun) e.slowUntil = scene.now + 0.5;   // Josh flavor: dizzying spin
    var fdx = e.x - pxp, fdy = e.y - pyp;
    var fl = Math.sqrt(fdx * fdx + fdy * fdy) || 1;
    PC.damageEnemy(scene, e, PC.rollDmg(scene, dmg), fdx / fl * 1.6, fdy / fl * 1.6, scene._onKillCb);
    scene.fx.burst(e.x, e.y, 'fx_spark', 3, 0.14);
  });
  if (scene.boss && !scene.boss.dead && scene.now >= (scene._lassoBossCd || 0)) {
    var bdx = scene.boss.x - cx2, bdy = scene.boss.y - cy2;
    var bd = Math.sqrt(bdx * bdx + bdy * bdy);
    if (Math.abs(bd - loopR) < scene.boss.r + 7) {
      scene._lassoBossCd = scene.now + 0.5;
      scene.hitBoss(scene.boss.x, scene.boss.y, this.dmg * (this.mastery || 1) * scene.stats.dmgMult, 0, 0);
    }
  }
};

// ---------------------------------------------------------------
// Kit registry: signature weapon factory + passive + specials.
// Item glow: east-facing offset from the FEET position (world px,
// pre-hero-scale), color = the item's signature light.
// ---------------------------------------------------------------
PC.KITS = {
  danny: {
    kitName: 'RESIZER RAY',
    weapon: function (scene) { return new PC.ResizerWeapon(); },
    masterize: function (w) { w.shrinkMs = 900; },   // bolts briefly shrink (slow)
    passive: function (scene) { scene.xpMult = 1.10; },
    passiveDesc: '+10% XP',
    onLevelUp: function (scene) {           // Eureka! knockback pulse
      var pxp = scene.px, pyp = scene.py;
      scene.fx.burst(pxp, pyp - 6, 'fx_nova', 3, 0.3);
      scene.enemies.hash.eachNear(pxp, pyp, function (e) {
        var dx = e.x - pxp, dy = e.y - pyp;
        var d = dx * dx + dy * dy;
        if (d > 90 * 90) return;
        var dl = Math.sqrt(d) || 1;
        PC.damageEnemy(scene, e, 5, dx / dl * 2.2, dy / dl * 2.2, scene._onKillCb);
      });
    },
    glow: { x: 9, y: -34, color: 0x35d0ff },
  },
  victoria: {
    kitName: 'TURRET TINKER',
    weapon: function (scene) { return new PC.SentryWeapon(scene); },
    masterize: function (w) { w.cd *= 0.8; w.life *= 1.5; },
    passive: function (scene) { scene.stats.heroCd = 0.90; },
    passiveDesc: '-10% cooldowns',
    glow: { x: 8, y: -16, color: 0xcfd4e8 },
  },
  nayah: {
    kitName: 'SEED SLINGER',
    weapon: function (scene) { return new PC.SeedWeapon(scene); },
    masterize: function (w) { w.root = true; },      // patches root enemies
    passive: function (scene) { scene.xpMult = 1.15; },
    passiveDesc: '+15% XP',
    glow: { x: 8, y: -18, color: 0x7dd97b },
  },
  kevin: {
    kitName: 'AIR SUPPORT',
    weapon: function (scene) { return new PC.StrikeWeapon(scene); },
    masterize: function (w) { w.bonusPass = 2; },    // captain's extra passes
    passive: function (scene) { scene.stats.heroDmg = 1.08; },
    passiveDesc: '+8% all damage',
    glow: null,                              // Kevin carries nothing - presence only
  },
  carlos: {
    kitName: 'COMET BEAM',
    weapon: function (scene) { return new PC.BeamWeapon(); },
    masterize: function (w) { w.critBoost = 0.10; }, // comets crit twice as often
    passive: function (scene) { scene.stats.critChance = 0.10; },
    passiveDesc: '10% critical hits',
    glow: { x: -6, y: -30, color: 0xf2c33c },
  },
  josh: {
    kitName: 'ROPE CYCLONE',
    weapon: function (scene) { return new PC.LassoWeapon(scene); },
    masterize: function (w) { w.stun = true; },      // ring dizzies on hit
    passive: function (scene) { scene.dmgTakenMult = 0.90; scene.kbMult = 1.5; },
    passiveDesc: 'Tougher + big knockback',
    glow: { x: 8, y: -14, color: 0xb5793f },
  },
};

PC.applyHeroKit = function (scene) {
  var kit = PC.KITS[scene.hero.id] || PC.KITS.danny;
  scene.kit = kit;
  kit.passive(scene);
  scene.stats.dmgMult = scene.stats.heroDmg || 1;
  scene.stats.cdMult = scene.stats.heroCd || 1;
  scene.stats.spdMult = scene.stats.heroSpd || 1;
  // SIGNATURE MASTERY (Mark 2026-07-25): every signature weapon is
  // inheritable by other heroes via the card pool, but the OWNER's
  // copy is inherently stronger - +25% power at every level, plus a
  // per-kit flavor edge where fields are never overwritten by levels.
  var w = kit.weapon(scene);
  w.mastery = 1.25;
  if (kit.masterize) kit.masterize(w);
  scene.weapons = [w];
};

// ---------------------------------------------------------------
// Hero unlock meta (PHASE2 §3 default: DEV_ALL_UNLOCKED honored)
// ---------------------------------------------------------------
PC.unlockedHeroes = function () {
  var out = { danny: true };
  try {
    var raw = localStorage.getItem('portioncontrol.heroesUnlocked');
    if (raw) JSON.parse(raw).forEach(function (id) { out[id] = true; });
  } catch (e) {}
  return out;
};
PC.unlockHero = function (id) {
  var u = PC.unlockedHeroes();
  if (u[id]) return false;
  u[id] = true;
  try {
    localStorage.setItem('portioncontrol.heroesUnlocked',
      JSON.stringify(Object.keys(u)));
  } catch (e) {}
  return true;
};
PC.heroUnlocked = function (id) {
  if (PC.DEV_ALL_UNLOCKED) return true;
  return !!PC.unlockedHeroes()[id];
};

// Each hero has a UNIQUE way in (Mark v0.13.0): Victoria is the D1
// rescue (canon), the rest are earned different ways. `how` shows on
// the locked select cell; `progress` renders a live counter.
PC.HERO_UNLOCKS = {
  victoria: { how: 'RESCUE HER: WIN DISTRICT 1',
              check: function (m) { return m.stat('wonD1') > 0; } },
  kevin:    { how: 'SURVIVE TO THE BOSS',
              check: function (m) { return m.stat('reachedBoss') > 0; } },
  nayah:    { how: 'POP 750 SNACKS (TOTAL)',
              progress: function (m) { return Math.min(750, m.stat('totalPops')) + '/750'; },
              check: function (m) { return m.stat('totalPops') >= 750; } },
  carlos:   { how: 'REACH LEVEL 8 IN ONE RUN',
              check: function (m) { return m.stat('bestLevel') >= 8; } },
  josh:     { how: 'HIRE HIM: $3000', gold: 3000 },
};

// run after stats update (results screen): unlock every satisfied hero,
// return the newly unlocked ids for the celebration banner
PC.checkHeroUnlocks = function () {
  var fresh = [];
  Object.keys(PC.HERO_UNLOCKS).forEach(function (id) {
    var def = PC.HERO_UNLOCKS[id];
    if (def.check && !PC.unlockedHeroes()[id] && def.check(PC.meta)) {
      if (PC.unlockHero(id)) fresh.push(id);
    }
  });
  return fresh;
};
