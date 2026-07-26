// weapons.js - pooled player bullets + the M4 arsenal (COMPENDIUM 7).
// Weapons auto-fire on their own cooldowns; passives modify damage,
// cooldowns and speed through scene.stats. Numbers are COMPENDIUM law.
window.PC = window.PC || {};

PC.BulletSystem = function (scene) {
  this.scene = scene;
  this.pool = [];
  for (var i = 0; i < PC.CAPS.PLAYER_BULLETS; i++) {
    this.pool.push({
      active: false, x: 0, y: 0, dx: 0, dy: 0, spd: 0, dmg: 0, pierce: 0, life: 0,
      sprite: scene.add.image(0, 0, 'atlas', 'proj_resizer').setDepth(8)
        .setBlendMode(Phaser.BlendModes.ADD).setScale(1.4).setVisible(false),
    });
  }
};

PC.BulletSystem.prototype.fire = function (x, y, tx, ty, spec) {
  var b = null;
  for (var i = 0; i < this.pool.length; i++) {
    if (!this.pool[i].active) { b = this.pool[i]; break; }
  }
  if (!b) return;
  var dx = tx - x, dy = ty - y;
  var d = Math.sqrt(dx * dx + dy * dy) || 1;
  b.active = true;
  b.x = x; b.y = y;
  b.dx = dx / d; b.dy = dy / d;
  b.spd = spec.speed * (this.scene.stats ? this.scene.stats.projMult : 1);
  b.dmg = spec.dmg; b.pierce = spec.pierce || 0;
  b.life = spec.life || 1.1;
  b.slowMs = spec.slowMs || 0;
  b.shrinkFx = spec.shrinkFx || 0;       // Danny: visually shrink victims
  b.retT = spec.boomerang || 0;          // boomerang: outbound time left
  b.homing = spec.homing || 0;           // homing: steer rad/s
  b.bounces = spec.bounces || 0;         // ricochet: redirects left
  b.scale0 = spec.scale || 0;
  var glow = spec.frame !== 'proj_pellet';   // fries = solid, beam = glow
  b.sprite.setFrame(spec.frame || 'proj_resizer')
    .setBlendMode(glow ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL)
    .setScale(glow ? 1.4 : 1.2)
    .setPosition(x, y).setRotation(Math.atan2(dy, dx)).setVisible(true);
  if (spec.scale) b.sprite.setScale(spec.scale);
  if (spec.tint) b.sprite.setTint(spec.tint); else b.sprite.clearTint();
};

PC.BulletSystem.prototype.update = function (dt, enemies, onKill) {
  var hash = enemies.hash;
  var pool = this.pool;
  for (var i = 0; i < pool.length; i++) {
    var b = pool[i];
    if (!b.active) continue;
    b.life -= dt;
    if (b.life <= 0) { b.active = false; b.sprite.setVisible(false); continue; }
    // boomerang: after the outbound leg, steer hard back to the player
    if (b.retT > 0) {
      b.retT -= dt;
      if (b.retT <= 0) b.life = 2.5;     // returning leg gets fresh life
    } else if (b.retT < 0 || (b.retT === 0 && false)) { /* noop */ }
    if (b.retT !== 0 && b.retT <= 0) {
      var rdx = this.scene.px - b.x, rdy = this.scene.py - b.y;
      var rd = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
      if (rd < 18) { b.active = false; b.sprite.setVisible(false); continue; }
      b.dx = rdx / rd; b.dy = rdy / rd;
    }
    // homing: steer toward the nearest enemy
    if (b.homing) {
      var hb = null, hd = 160 * 160;
      var hp2 = this.scene.enemies.pool;
      for (var hj = 0; hj < hp2.length; hj++) {
        var he = hp2[hj];
        if (!he.active) continue;
        var hx = he.x - b.x, hy = he.y - b.y;
        var hdd = hx * hx + hy * hy;
        if (hdd < hd) { hd = hdd; hb = he; }
      }
      if (hb) {
        var want = Math.atan2(hb.y - b.y, hb.x - b.x);
        var cur = Math.atan2(b.dy, b.dx);
        var dl2 = want - cur;
        while (dl2 > Math.PI) dl2 -= Math.PI * 2;
        while (dl2 < -Math.PI) dl2 += Math.PI * 2;
        var mx = b.homing * dt;
        cur += Math.max(-mx, Math.min(mx, dl2));
        b.dx = Math.cos(cur); b.dy = Math.sin(cur);
      }
    }
    b.x += b.dx * b.spd * dt;
    b.y += b.dy * b.spd * dt;
    b.sprite.setPosition(b.x, b.y);
    if (b.retT || b.bounces) b.sprite.rotation += 12 * dt;   // spin
    b.trailT = (b.trailT || 0) + dt;
    if (b.trailT > 0.045 && this.scene.juice) {
      b.trailT = 0;
      this.scene.juice.trail(b.x, b.y);
    }
    if (this.scene.pickups && this.scene.pickups.hitAt(b.x, b.y)) {
      b.active = false; b.sprite.setVisible(false); continue;
    }
    if (this.scene.hitBoss && this.scene.hitBoss(b.x, b.y, b.dmg, b.dx, b.dy)) {
      if (b.pierce > 0) { b.pierce--; } else { b.active = false; b.sprite.setVisible(false); continue; }
    }
    var hit = null;
    hash.eachNear(b.x, b.y, function (e) {
      var dx = e.x - b.x, dy = e.y - b.y;
      if (dx * dx + dy * dy < (e.r + 5) * (e.r + 5)) { hit = e; return true; }
    });
    if (hit) {
      // piercing/returning bullets shouldn't grind the same enemy every
      // frame - short per-enemy re-hit throttle
      if ((b.pierce > 0 || b.retT !== 0 || b.bounces > 0) &&
          this.scene.now < (hit.pierceCd || 0)) continue;
      hit.pierceCd = this.scene.now + 0.25;
      PC.damageEnemy(this.scene, hit, b.dmg, b.dx, b.dy, onKill);
      if (b.slowMs) hit.slowUntil = this.scene.now + b.slowMs / 1000;
      if (b.shrinkFx) hit.shrinkUntil = this.scene.now + b.shrinkFx / 1000;
      this.scene.fx.burst(b.x, b.y, 'fx_spark', 3, 0.16);
      if (b.bounces > 0) {
        // ricochet: carom toward another nearby enemy (or a random angle)
        b.bounces--;
        var rb = null, rbd = 220 * 220;
        var rp2 = this.scene.enemies.pool;
        for (var rj = 0; rj < rp2.length; rj++) {
          var re = rp2[rj];
          if (!re.active || re === hit) continue;
          var rx2 = re.x - b.x, ry2 = re.y - b.y;
          var rdd = rx2 * rx2 + ry2 * ry2;
          if (rdd < rbd) { rbd = rdd; rb = re; }
        }
        var na = rb ? Math.atan2(rb.y - b.y, rb.x - b.x) : Math.random() * Math.PI * 2;
        b.dx = Math.cos(na); b.dy = Math.sin(na);
      } else if (b.pierce > 0 || b.retT !== 0) {
        if (b.pierce > 0) b.pierce--;
      } else { b.active = false; b.sprite.setVisible(false); }
    }
  }
};

// single damage path for every weapon: flash + knockback + kill routing.
// scene.kbMult = hero knockback bonus (Josh kit), default 1.
PC.damageEnemy = function (scene, e, dmg, dirx, diry, onKill) {
  // Seasoned (Salt aura rework): debuffed foes take amplified damage
  if (e.seasonedUntil && scene.now < e.seasonedUntil) {
    dmg *= 1 + (e.seasonPct || 0.25);
  }
  e.hp -= dmg;
  if (scene.juice) scene.juice.dmgNum(e.x, e.y - e.r - 2, dmg, scene._lastCrit);
  e.flashUntil = scene.now + PC.HURT_FLASH_MS / 1000;
  e.sprite.setTintFill(0xffffff);
  e.kbUntil = scene.now + 0.12;
  var kb = e.spd * 0.8 * e.kbMult * (scene.kbMult || 1);
  e.kbx = (dirx || 0) * kb;
  e.kby = (diry || 0) * kb;
  if (e.hp <= 0 && onKill) onKill(e);
};

// ---- aim helper: movement direction + ~35 degree cone assist ----
PC.aimAt = function (scene, range) {
  var ax = scene.aimX, ay = scene.aimY;
  var al = Math.sqrt(ax * ax + ay * ay) || 1;
  ax /= al; ay /= al;
  var best = null, bestD = range * range;
  var pool = scene.enemies.pool;
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (!e.active) continue;
    var dx = e.x - scene.px, dy = e.y - scene.py;
    var d = dx * dx + dy * dy;
    if (d >= bestD) continue;
    var dl = Math.sqrt(d) || 1;
    if ((dx * ax + dy * ay) / dl < 0.82) continue;
    bestD = d; best = e;
  }
  return { ax: ax, ay: ay, target: best };
};

// =====================================================================
// WEAPONS (each: key, name, desc per level, update, applyLevel)
// =====================================================================

// -- Resizer Beam (COMPENDIUM 7.1): shot along aim; L2 dmg18 L3 amount2
// L4 cd.45 L5 dmg24 pierce1 --
PC.ResizerWeapon = function () {
  this.key = 'resizer'; this.name = 'RESIZER BEAM';
  this.level = 1; this.max = 5;
  this.cd = 0.55; this.dmg = 12; this.amount = 1; this.speed = 520; this.pierce = 0;
  this.range = 420; this.cdT = 0;
};
PC.ResizerWeapon.prototype.desc = function () {
  return ['', 'Danny\'s trusty shrink ray', 'Damage up!', 'Fires 2 bolts!',
          'Faster firing!', 'Bolts pierce through!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.ResizerWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 18;
  else if (this.level === 3) this.amount = 2;
  else if (this.level === 4) this.cd = 0.45;
  else if (this.level === 5) { this.dmg = 24; this.pierce = 1; }
};
PC.ResizerWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT > 0) return;
  var aim = PC.aimAt(scene, this.range);
  var tx, ty;
  if (aim.target) { tx = aim.target.x; ty = aim.target.y; }
  else { tx = scene.px + aim.ax * 200; ty = scene.py + aim.ay * 200; }
  this.cdT = this.cd * scene.stats.cdMult;
  var dmg = this.dmg * (this.mastery || 1) * scene.stats.dmgMult;
  var amount = this.amount + (scene.stats.extraProj || 0);
  for (var n = 0; n < amount; n++) {
    var spread = (n - (amount - 1) / 2) * 0.12;
    var dx = tx - scene.px, dy = ty - scene.py;
    var ang = Math.atan2(dy, dx) + spread;
    scene.bullets.fire(scene.px, scene.py - 4,
      scene.px + Math.cos(ang) * 100, scene.py - 4 + Math.sin(ang) * 100,
      { speed: this.speed, dmg: dmg, frame: 'proj_resizer', pierce: this.pierce,
        slowMs: this.shrinkMs || 0, shrinkFx: 450 });
  }
  if (PC.VFX_V2 && scene.vfx) {
    scene.vfx.shrinkRing(scene.px + aim.ax * 16, scene.py - 4 + aim.ay * 10, 12, 220);
  } else {
    scene.fx.burst(scene.px + aim.ax * 18, scene.py - 4 + aim.ay * 12, 'fx_muzzle', 2, 0.1);
  }
  if (PC.audio) PC.audio.shoot();
};

// -- Portion Blaster (COMPENDIUM 7.2): 40-degree cone burst, short range.
// L2 5 pellets L3 dmg12 L4 cd1.1 L5 7 pellets --
PC.BlasterWeapon = function () {
  this.key = 'blaster'; this.name = 'PORTION BLASTER';
  this.level = 1; this.max = 5;
  this.cd = 1.4; this.pellets = 3; this.dmg = 8; this.cdT = 0;
};
PC.BlasterWeapon.prototype.desc = function () {
  return ['', 'Short-range snack scatter', 'More pellets!', 'Damage up!',
          'Faster firing!', 'Even more pellets!'][Math.min(this.level + 1, 5)] || 'More pellets!';
};
PC.BlasterWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.pellets = 5;
  else if (this.level === 3) this.dmg = 12;
  else if (this.level === 4) this.cd = 1.1;
  else if (this.level === 5) this.pellets = 7;
};
PC.BlasterWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT > 0) return;
  var aim = PC.aimAt(scene, 260);
  this.cdT = this.cd * scene.stats.cdMult;
  var dmg = this.dmg * (this.mastery || 1) * scene.stats.dmgMult;
  var base = Math.atan2(aim.target ? aim.target.y - scene.py : aim.ay,
                        aim.target ? aim.target.x - scene.px : aim.ax);
  var arc = this.ring ? Math.PI * 2 : (40 * Math.PI / 180);
  var pellets = this.pellets + (scene.stats.extraProj || 0);
  for (var n = 0; n < pellets; n++) {
    var ang = base + (this.ring ? n / pellets * arc
                               : (n / (pellets - 1) - 0.5) * arc);
    scene.bullets.fire(scene.px, scene.py - 4,
      scene.px + Math.cos(ang) * 100, scene.py - 4 + Math.sin(ang) * 100,
      { speed: 420, dmg: dmg, frame: 'proj_pellet', life: 0.35 });
  }
  if (PC.audio) PC.audio.shoot();
};

// -- Whisk Cyclone (COMPENDIUM 7.3): orbiting whisks, always on.
// r70 180deg/s dmg10; L2 2 whisks L3 dmg16 r80 L4 3 whisks L5 dmg22 220deg/s --
PC.WhiskWeapon = function (scene) {
  this.key = 'whisk'; this.name = 'WHISK CYCLONE';
  this.level = 1; this.max = 5;
  this.radius = 70; this.dmg = 10; this.count = 1; this.degS = 180;
  this.angle = 0;
  this.sprites = [];
  for (var i = 0; i < 3; i++) {
    this.sprites.push(scene.add.image(0, 0, 'atlas', 'proj_whisk')
      .setScale(1.3).setDepth(9).setVisible(false));
  }
};
PC.WhiskWeapon.prototype.desc = function () {
  return ['', 'Whisks orbit and batter foes', 'Second whisk!', 'Bigger + harder!',
          'Third whisk!', 'Faster + harder!'][Math.min(this.level + 1, 5)] || 'Second whisk!';
};
PC.WhiskWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.count = 2;
  else if (this.level === 3) { this.dmg = 16; this.radius = 80; }
  else if (this.level === 4) this.count = 3;
  else if (this.level === 5) { this.dmg = 22; this.degS = 220; }
};
PC.WhiskWeapon.prototype.update = function (dt, scene) {
  var radius = this.radius * scene.stats.areaMult;
  this.angle += (this.degS * Math.PI / 180) * dt;
  var dmg = this.dmg * (this.mastery || 1) * scene.stats.dmgMult;
  var self = this;
  for (var i = 0; i < this.sprites.length; i++) {
    var s = this.sprites[i];
    if (i >= this.count) { s.setVisible(false); continue; }
    var a = this.angle + i * (Math.PI * 2 / this.count);
    var wxp = scene.px + Math.cos(a) * radius;
    var wyp = scene.py + Math.sin(a) * radius;
    s.setPosition(wxp, wyp).setRotation(a + Math.PI / 2).setVisible(true);
    scene.enemies.hash.eachNear(wxp, wyp, function (e) {
      var dx = e.x - wxp, dy = e.y - wyp;
      if (dx * dx + dy * dy > (e.r + 8) * (e.r + 8)) return;
      if (scene.now < (e.whiskCd || 0)) return;
      e.whiskCd = scene.now + 0.5;              // per-enemy tick (COMPENDIUM 5.4)
      var dl = Math.sqrt(dx * dx + dy * dy) || 1;
      PC.damageEnemy(scene, e, dmg, dx / dl, dy / dl, scene._onKillCb);
      scene.fx.burst(e.x, e.y, 'fx_spark', 3, 0.14);
    });
    // whisk also grinds the boss (own 0.5s tick)
    if (scene.boss && !scene.boss.dead && scene.now >= (scene._whiskBossCd || 0)) {
      var bdx = scene.boss.x - wxp, bdy = scene.boss.y - wyp;
      if (bdx * bdx + bdy * bdy < (scene.boss.r + 8) * (scene.boss.r + 8)) {
        scene._whiskBossCd = scene.now + 0.5;
        scene.hitBoss(wxp, wyp, dmg, 0, 0);
      }
    }
  }
};

// -- Salt Shaker: garlic-archetype nova ring around the player --
PC.SaltWeapon = function (scene) {
  this.key = 'salt'; this.name = 'SALT SHAKER';
  this.level = 1; this.max = 5;
  this.cd = 2.4; this.cdT = 0.8; this.dmg = 8; this.radius = 55;
  this.pulseT = 0;
  this.gfx = scene.add.graphics().setDepth(8);
};
PC.SaltWeapon.prototype.desc = function () {
  return ['', 'A stinging ring of seasoning', 'Damage up!', 'Wider ring!',
          'Faster shakes!', 'Extra spicy!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.SaltWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 12;
  else if (this.level === 3) this.radius = 70;
  else if (this.level === 4) this.cd = 1.8;
  else if (this.level === 5) this.dmg = 17;
};
PC.SaltWeapon.prototype.update = function (dt, scene) {
  var R = this.radius * scene.stats.areaMult;
  if (PC.SALT_AURA) {
    // Task 9 rework: constant fast-ticking aura that SEASONS foes -
    // they take +25% damage from ALL sources for 2s (build amplifier)
    this.cdT -= dt;
    if (this.cdT <= 0) {
      this.cdT = 0.4 * scene.stats.cdMult;
      var adx = PC.rollDmg(scene, this.dmg * 0.45 * (this.mastery || 1));
      var pxa = scene.px, pya = scene.py - 4;
      var pct = this.seasonPct || 0.25;
      scene.enemies.hash.eachNear(pxa, pya, function (e) {
        var dx = e.x - pxa, dy = e.y - pya;
        if (dx * dx + dy * dy > R * R) return;
        e.seasonedUntil = scene.now + 2;
        e.seasonPct = pct;
        PC.damageEnemy(scene, e, adx, 0, 0, scene._onKillCb);
      });
    }
    var g0 = this.gfx;
    g0.clear();
    g0.lineStyle(2, 0xf7f4ef, 0.22 + 0.1 * Math.sin(scene.now * 7));
    g0.strokeCircle(scene.px, scene.py - 4, R);
    g0.lineStyle(1, 0xf2c33c, 0.18 + 0.1 * Math.sin(scene.now * 9 + 2));
    g0.strokeCircle(scene.px, scene.py - 4, R * 0.85);
    return;
  }
  this.cdT -= dt;
  if (this.cdT <= 0) {
    this.cdT = this.cd * scene.stats.cdMult;
    this.pulseT = 0.25;
    var dmg = PC.rollDmg(scene, this.dmg * (this.mastery || 1)), pxp = scene.px, pyp = scene.py - 4;
    scene.enemies.hash.eachNear(pxp, pyp, function (e) {
      var dx = e.x - pxp, dy = e.y - pyp;
      var d2 = dx * dx + dy * dy;
      if (d2 > R * R) return;
      var dl = Math.sqrt(d2) || 1;
      PC.damageEnemy(scene, e, dmg, dx / dl * 0.9, dy / dl * 0.9, scene._onKillCb);
    });
    if (scene.boss && !scene.boss.dead) {
      var bdx = scene.boss.x - pxp, bdy = scene.boss.y - pyp;
      if (bdx * bdx + bdy * bdy < (scene.boss.r + R) * (scene.boss.r + R)) {
        scene.hitBoss(scene.boss.x, scene.boss.y, dmg, 0, 0);
      }
    }
    if (PC.audio) PC.audio.pop();
  }
  var g = this.gfx;
  g.clear();
  if (this.pulseT > 0) {
    this.pulseT -= dt;
    var k = 1 - Math.max(0, this.pulseT) / 0.25;
    g.lineStyle(3, 0xf7f4ef, 0.6 * (1 - k));
    g.strokeCircle(scene.px, scene.py - 4, R * (0.4 + 0.6 * k));
  }
};

// -- Snack Drone: an orbiting pet that pelts the nearest foe --
PC.DroneWeapon = function (scene) {
  this.key = 'drone'; this.name = 'THE GIZMOTRON';   // renamed by Mark
  this.level = 1; this.max = 5;
  this.count = 1; this.fireCd = 0.85; this.dmg = 8; this.range = 240;
  this.t = 0;
  this.drones = [];
  for (var i = 0; i < 2; i++) {
    this.drones.push({ fireT: 0.3 + i * 0.4,
      sprite: scene.add.image(0, 0, 'atlas', 'proj_resizer')
        .setScale(1.8).setTint(0x7dd97b).setDepth(11)
        .setBlendMode(Phaser.BlendModes.ADD).setVisible(false) });
  }
};
PC.DroneWeapon.prototype.desc = function () {
  return ['', 'A loyal whirring gizmo pal', 'Faster pecks!', 'Damage up!',
          'Second drone!', 'Full patrol mode!'][Math.min(this.level + 1, 5)] || 'Faster pecks!';
};
PC.DroneWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.fireCd = 0.62;
  else if (this.level === 3) this.dmg = 12;
  else if (this.level === 4) this.count = 2;
  else if (this.level === 5) { this.fireCd = 0.48; this.dmg = 15; }
};
PC.DroneWeapon.prototype.update = function (dt, scene) {
  this.t += dt;
  for (var i = 0; i < this.drones.length; i++) {
    var d = this.drones[i];
    if (i >= this.count) { d.sprite.setVisible(false); continue; }
    var a = this.t * 1.6 + i * Math.PI;
    var dxp = scene.px + Math.cos(a) * 42;
    var dyp = scene.py - 18 + Math.sin(a) * 16;
    d.sprite.setPosition(dxp, dyp).setVisible(true)
      .setRotation(Math.sin(this.t * 3 + i) * 0.2);
    d.fireT -= dt;
    if (d.fireT > 0) continue;
    var best = null, bestD = this.range * this.range;
    var pool = scene.enemies.pool;
    for (var k = 0; k < pool.length; k++) {
      var e = pool[k];
      if (!e.active) continue;
      var ex = e.x - dxp, ey = e.y - dyp;
      var dd = ex * ex + ey * ey;
      if (dd < bestD) { bestD = dd; best = e; }
    }
    if (best) {
      d.fireT = this.fireCd * scene.stats.cdMult;
      scene.bullets.fire(dxp, dyp, best.x, best.y,
        { speed: 480, dmg: PC.rollDmg(scene, this.dmg * (this.mastery || 1)), frame: 'proj_pellet',
          tint: 0x7dd97b, life: 0.7 });
      if (PC.audio) PC.audio.shoot();
    } else { d.fireT = 0.25; }
  }
};

// -- Freeze Ray: low damage, SLOWS what it hits (control archetype) --
PC.FreezeWeapon = function () {
  this.key = 'freeze'; this.name = 'FREEZE RAY';
  this.level = 1; this.max = 5;
  this.cd = 1.6; this.cdT = 0.5; this.dmg = 5; this.slowMs = 2000; this.bolts = 1;
};
PC.FreezeWeapon.prototype.desc = function () {
  return ['', 'Chills foes to a crawl', 'Longer chill!', 'Colder + faster!',
          'Twin bolts!', 'Deep freeze!'][Math.min(this.level + 1, 5)] || 'Longer chill!';
};
PC.FreezeWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.slowMs = 2600;
  else if (this.level === 3) { this.dmg = 9; this.cd = 1.3; }
  else if (this.level === 4) this.bolts = 2;
  else if (this.level === 5) { this.dmg = 13; this.slowMs = 3200; }
};
PC.FreezeWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT > 0) return;
  var pool = scene.enemies.pool, targets = [];
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (!e.active) continue;
    var dx = e.x - scene.px, dy = e.y - scene.py;
    var d = dx * dx + dy * dy;
    if (d < 340 * 340) targets.push({ e: e, d: d });
  }
  if (!targets.length) { this.cdT = 0.25; return; }
  targets.sort(function (a, b) { return a.d - b.d; });
  this.cdT = this.cd * scene.stats.cdMult;
  var bolts = this.bolts + (scene.stats.extraProj || 0);
  for (var n = 0; n < Math.min(bolts, targets.length); n++) {
    scene.bullets.fire(scene.px, scene.py - 6, targets[n].e.x, targets[n].e.y,
      { speed: 500, dmg: PC.rollDmg(scene, this.dmg * (this.mastery || 1)), frame: 'proj_pellet',
        tint: 0x9adfff, slowMs: this.slowMs, life: 0.9 });
  }
  if (PC.audio) PC.audio.shoot();
};

// =====================================================================
// PASSIVES (COMPENDIUM 7 table) + the card pool
// =====================================================================
// passives compose on the hero-kit base (st.heroDmg/heroCd/heroSpd,
// default 1) so a hero bonus is never wiped by a card level.
PC.PASSIVES = {
  battery: { name: 'BIGGER BATTERY', icon: 'icon_passive_battery', max: 5,
             desc: '+8% damage', apply: function (st, lv) { st.dmgMult = (st.heroDmg || 1) * (1 + 0.08 * lv); } },
  fan:     { name: 'COOLING FAN', icon: 'icon_passive_fan', max: 5,
             desc: '-6% cooldowns', apply: function (st, lv) { st.cdMult = (st.heroCd || 1) * (1 - 0.06 * lv); } },
  shoes:   { name: 'RUNNING SHOES', icon: 'icon_passive_shoes', max: 5,
             desc: '+6% move speed', apply: function (st, lv) { st.spdMult = (st.heroSpd || 1) * (1 + 0.06 * lv); } },
  magnet:  { name: 'SNACK MAGNET', icon: 'icon_passive_magnet', max: 3,
             desc: '+20% pickup range', apply: function (st, lv) { st.pickupMult = 1 + 0.2 * lv; } },
  lens:    { name: 'FOCUS LENS', icon: 'icon_passive_lens', max: 3,
             desc: '+15% shot speed', apply: function (st, lv) { st.projMult = 1 + 0.15 * lv; } },
  servo:   { name: 'SERVO MOTOR', icon: 'icon_passive_servo', max: 3,
             desc: '+12% weapon area', apply: function (st, lv) { st.areaMult = 1 + 0.12 * lv; } },
  coat:    { name: 'PADDED APRON', icon: 'icon_passive_coat', max: 3,
             desc: 'Block 1 damage per hit', apply: function (st, lv) { st.armor = lv; } },
  duplicator: { name: 'DUPLICATOR TRAY', icon: 'icon_passive_duplicator', max: 2,
             desc: '+1 projectile per rank', apply: function (st, lv) { st.extraProj = lv; } },
  slowcooker: { name: 'SLOW COOKER', icon: 'icon_passive_slowcooker', max: 3,
             desc: '+25% effect duration', apply: function (st, lv) { st.durMult = 1 + 0.25 * lv; } },
  leftovers: { name: 'LEFTOVERS', icon: 'icon_passive_leftovers', max: 3,
             desc: '+15 max HP and slow regen',
             apply: function (st, lv) { st.bonusHp = 15 * lv; st.regen = 0.5 * lv; } },
};
// every weapon key owns its icon frame: icon_weapon_<key>
PC.WEAPON_ICONS = {};
['resizer', 'blaster', 'whisk', 'sentry', 'seeds', 'strike', 'beam',
 'lasso', 'salt', 'drone', 'freeze', 'ketchup', 'microwave', 'fridge',
 'cutter', 'zap', 'grease', 'jaw', 'sprinkle', 'skillet', 'vortex',
 'espresso', 'pineapple', 'sentrybot', 'comet', 'haymaker'].forEach(function (k) {
  PC.WEAPON_ICONS[k] = 'icon_weapon_' + k;
});

// build 3 distinct card choices from the current run state.
// EVOLUTIONS (data/evolutions.js): a maxed weapon + its partner passive
// GUARANTEES a golden EVOLVE card - the build-crafting payoff.
PC.drawCards = function (scene) {
  var pool = [];
  var i, w;
  var evolveCard = null;
  if (PC.EVOLUTIONS) {
    for (i = 0; i < scene.weapons.length && !evolveCard; i++) {
      w = scene.weapons[i];
      if (w.evolved || w.level < w.max) continue;
      for (var ev = 0; ev < PC.EVOLUTIONS.length; ev++) {
        var rec = PC.EVOLUTIONS[ev];
        if (rec.base === w.key && (scene.passives[rec.requires] || 0) > 0) {
          evolveCard = { kind: 'evolve', w: w, rec: rec, title: rec.name,
                         sub: 'EVOLVE!', desc: rec.desc, icon: PC.WEAPON_ICONS[w.key] };
          break;
        }
      }
    }
  }
  for (i = 0; i < scene.weapons.length; i++) {
    w = scene.weapons[i];
    if (w.level < w.max) {
      pool.push({ kind: 'weapon-up', w: w, title: w.name,
                  sub: 'LV ' + (w.level + 1), desc: w.desc(), icon: PC.WEAPON_ICONS[w.key] });
    }
  }
  if (scene.weapons.length < PC.XP.WEAPON_SLOTS) {
    var owned = {};
    for (i = 0; i < scene.weapons.length; i++) owned[scene.weapons[i].key] = true;
    if (!owned.blaster) pool.push({ kind: 'weapon-new', make: function (sc) { return new PC.BlasterWeapon(); },
      title: 'PORTION BLASTER', sub: 'NEW!', desc: 'Short-range snack scatter', icon: PC.WEAPON_ICONS.blaster });
    if (!owned.whisk) pool.push({ kind: 'weapon-new', make: function (sc) { return new PC.WhiskWeapon(sc); },
      title: 'WHISK CYCLONE', sub: 'NEW!', desc: 'Whisks orbit and batter foes', icon: PC.WEAPON_ICONS.whisk });
    if (!owned.salt) pool.push({ kind: 'weapon-new', make: function (sc) { return new PC.SaltWeapon(sc); },
      title: 'SALT SHAKER', sub: 'NEW!', desc: 'A stinging ring of seasoning', icon: PC.WEAPON_ICONS.salt });
    if (!owned.drone) pool.push({ kind: 'weapon-new', make: function (sc) { return new PC.DroneWeapon(sc); },
      title: 'THE GIZMOTRON', sub: 'NEW!', desc: 'A loyal whirring gizmo pal', icon: PC.WEAPON_ICONS.drone });
    if (!owned.freeze) pool.push({ kind: 'weapon-new', make: function (sc) { return new PC.FreezeWeapon(); },
      title: 'FREEZE RAY', sub: 'NEW!', desc: 'Chills foes to a crawl', icon: PC.WEAPON_ICONS.freeze });
    if (!owned.ketchup) pool.push({ kind: 'weapon-new', make: function (sc) { return new PC.KetchupWeapon(sc); },
      title: 'KETCHUP ARTILLERY', sub: 'NEW!', desc: 'Shells burst into slowing puddles', icon: PC.WEAPON_ICONS.ketchup });
    if (!owned.microwave) pool.push({ kind: 'weapon-new', make: function (sc) { return new PC.MicrowaveWeapon(sc); },
      title: 'MICROWAVE BEAM', sub: 'NEW!', desc: 'A beam sweeps around you', icon: PC.WEAPON_ICONS.microwave });
    if (!owned.fridge) pool.push({ kind: 'weapon-new', make: function (sc) { return new PC.FridgeWeapon(sc); },
      title: 'FRIDGE WALL', sub: 'NEW!', desc: 'Drops a chilling barrier wall', icon: PC.WEAPON_ICONS.fridge });
    var A3 = [
      ['cutter', 'PIZZA CUTTER', 'A spinning cutter that returns', function (sc) { return new PC.CutterWeapon(); }],
      ['zap', 'TOASTER ZAP', 'Zaps arc between close foes', function (sc) { return new PC.ZapWeapon(sc); }],
      ['grease', 'GREASE TRAIL', 'A burning slick trails behind you', function (sc) { return new PC.GreaseWeapon(sc); }],
      ['jaw', 'JAWBREAKER', 'A candy that caroms off foes', function (sc) { return new PC.JawWeapon(); }],
      ['sprinkle', 'SPRINKLE SWARM', 'Homing sprinkles seek foes', function (sc) { return new PC.SprinkleWeapon(); }],
      ['skillet', 'SKILLET SWING', 'A mighty pan swing forward', function (sc) { return new PC.SkilletWeapon(sc); }],
      ['vortex', 'VORTEX MIXER', 'Pulls foes into a tight pile', function (sc) { return new PC.VortexWeapon(sc); }],
      ['espresso', 'ESPRESSO CANNON', 'Charges while you stand still', function (sc) { return new PC.EspressoWeapon(sc); }],
      ['pineapple', 'PINEAPPLE GUARD', 'Spiky aura; bites back when hit', function (sc) { return new PC.PineappleWeapon(sc); }],
    ];
    A3.forEach(function (w3) {
      if (owned[w3[0]]) return;
      pool.push({ kind: 'weapon-new', make: w3[3], title: w3[1],
                  sub: 'NEW!', desc: w3[2], icon: PC.WEAPON_ICONS[w3[0]] });
    });
    // hero SIGNATURES are inheritable (Mark): any hero can learn a
    // teammate's weapon - just without the owner's mastery bonus
    var SIGS = [
      { key: 'resizer', title: 'RESIZER RAY', desc: "Danny's trusty shrink ray",
        make: function (sc) { return new PC.ResizerWeapon(); } },
      { key: 'sentry', title: 'POCKET SENTRY', desc: "Victoria's pellet turrets",
        make: function (sc) { return new PC.SentryWeapon(sc); } },
      { key: 'seeds', title: 'THORN SEEDS', desc: "Nayah's blooming thorn patches",
        make: function (sc) { return new PC.SeedWeapon(sc); } },
      { key: 'strike', title: 'RESCUE STRIKE', desc: "Kevin's marked air strafe",
        make: function (sc) { return new PC.StrikeWeapon(sc); } },
      { key: 'beam', title: 'COMET BEAM', desc: "Carlos' far-piercing comet",
        make: function (sc) { return new PC.BeamWeapon(); } },
      { key: 'lasso', title: 'ROPE CYCLONE', desc: "Josh's spinning rope ring",
        make: function (sc) { return new PC.LassoWeapon(sc); } },
    ];
    SIGS.forEach(function (sig) {
      if (owned[sig.key]) return;
      pool.push({ kind: 'weapon-new', make: sig.make, title: sig.title,
                  sub: 'NEW!', desc: sig.desc, icon: PC.WEAPON_ICONS[sig.key] });
    });
  }
  for (var k in PC.PASSIVES) {
    var p = PC.PASSIVES[k];
    var lv = scene.passives[k] || 0;
    if (lv < p.max) {
      pool.push({ kind: 'passive', pk: k, title: p.name,
                  sub: lv ? 'LV ' + (lv + 1) : 'NEW!', desc: p.desc, icon: p.icon });
    }
  }
  if (!pool.length) {
    pool.push({ kind: 'heal', title: 'SNACK BREAK', sub: '', desc: 'Heal 25 HP', icon: 'pickup_health' });
  }
  // shuffle-draw 3 distinct; a pending evolution ALWAYS takes slot 1
  var out = [];
  if (evolveCard) out.push(evolveCard);
  while (out.length < 3 && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
};

PC.applyCard = function (scene, card) {
  if (card.kind === 'evolve') {
    card.rec.apply(card.w);
    card.w.evolved = true;
    if (PC.audio) PC.audio.evolve();
    scene.fx.burst(scene.px, scene.py - 8, 'fx_levelup', 4, 0.6);
    scene.cameras.main.shake(200, 0.004);
  } else if (card.kind === 'weapon-up') {
    card.w.level++;
    card.w.applyLevel();
  } else if (card.kind === 'weapon-new') {
    scene.weapons.push(card.make(scene));
  } else if (card.kind === 'passive') {
    scene.passives[card.pk] = (scene.passives[card.pk] || 0) + 1;
    PC.PASSIVES[card.pk].apply(scene.stats, scene.passives[card.pk]);
  } else if (card.kind === 'heal') {
    scene.hp = Math.min(PC.PLAYER.HP + (scene.stats.bonusHp || 0), scene.hp + 25);
  }
};
