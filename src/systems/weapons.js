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
  b.spd = spec.speed; b.dmg = spec.dmg; b.pierce = spec.pierce || 0;
  b.life = spec.life || 1.1;
  var glow = spec.frame !== 'proj_pellet';   // fries = solid, beam = glow
  b.sprite.setFrame(spec.frame || 'proj_resizer')
    .setBlendMode(glow ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL)
    .setScale(glow ? 1.4 : 1.2)
    .setPosition(x, y).setRotation(Math.atan2(dy, dx)).setVisible(true);
};

PC.BulletSystem.prototype.update = function (dt, enemies, onKill) {
  var hash = enemies.hash;
  var pool = this.pool;
  for (var i = 0; i < pool.length; i++) {
    var b = pool[i];
    if (!b.active) continue;
    b.life -= dt;
    if (b.life <= 0) { b.active = false; b.sprite.setVisible(false); continue; }
    b.x += b.dx * b.spd * dt;
    b.y += b.dy * b.spd * dt;
    b.sprite.setPosition(b.x, b.y);
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
      PC.damageEnemy(this.scene, hit, b.dmg, b.dx, b.dy, onKill);
      this.scene.fx.burst(b.x, b.y, 'fx_spark', 3, 0.16);
      if (b.pierce > 0) { b.pierce--; }
      else { b.active = false; b.sprite.setVisible(false); }
    }
  }
};

// single damage path for every weapon: flash + knockback + kill routing.
// scene.kbMult = hero knockback bonus (Josh kit), default 1.
PC.damageEnemy = function (scene, e, dmg, dirx, diry, onKill) {
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
  var dmg = this.dmg * scene.stats.dmgMult;
  for (var n = 0; n < this.amount; n++) {
    var spread = (n - (this.amount - 1) / 2) * 0.12;
    var dx = tx - scene.px, dy = ty - scene.py;
    var ang = Math.atan2(dy, dx) + spread;
    scene.bullets.fire(scene.px, scene.py - 4,
      scene.px + Math.cos(ang) * 100, scene.py - 4 + Math.sin(ang) * 100,
      { speed: this.speed, dmg: dmg, frame: 'proj_resizer', pierce: this.pierce });
  }
  scene.fx.burst(scene.px + aim.ax * 18, scene.py - 4 + aim.ay * 12, 'fx_muzzle', 2, 0.1);
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
  var dmg = this.dmg * scene.stats.dmgMult;
  var base = Math.atan2(aim.target ? aim.target.y - scene.py : aim.ay,
                        aim.target ? aim.target.x - scene.px : aim.ax);
  for (var n = 0; n < this.pellets; n++) {
    var ang = base + (n / (this.pellets - 1) - 0.5) * (40 * Math.PI / 180);
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
  this.angle += (this.degS * Math.PI / 180) * dt;
  var dmg = this.dmg * scene.stats.dmgMult;
  var self = this;
  for (var i = 0; i < this.sprites.length; i++) {
    var s = this.sprites[i];
    if (i >= this.count) { s.setVisible(false); continue; }
    var a = this.angle + i * (Math.PI * 2 / this.count);
    var wxp = scene.px + Math.cos(a) * this.radius;
    var wyp = scene.py + Math.sin(a) * this.radius;
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
};
PC.WEAPON_ICONS = { resizer: 'icon_weapon_resizer', blaster: 'icon_weapon_blaster',
  whisk: 'icon_weapon_whisk', sentry: 'icon_weapon_drone', seeds: 'icon_weapon_salt',
  strike: 'icon_weapon_microwave', beam: 'icon_weapon_freeze', lasso: 'icon_weapon_ketchup' };

// build 3 distinct card choices from the current run state
PC.drawCards = function (scene) {
  var pool = [];
  var i, w;
  for (i = 0; i < scene.weapons.length; i++) {
    w = scene.weapons[i];
    if (w.level < w.max) {
      pool.push({ kind: 'weapon-up', w: w, title: w.name,
                  sub: 'LV ' + (w.level + 1), desc: w.desc(), icon: PC.WEAPON_ICONS[w.key] });
    }
  }
  if (scene.weapons.length < 4) {
    var owned = {};
    for (i = 0; i < scene.weapons.length; i++) owned[scene.weapons[i].key] = true;
    if (!owned.blaster) pool.push({ kind: 'weapon-new', make: function (sc) { return new PC.BlasterWeapon(); },
      title: 'PORTION BLASTER', sub: 'NEW!', desc: 'Short-range snack scatter', icon: PC.WEAPON_ICONS.blaster });
    if (!owned.whisk) pool.push({ kind: 'weapon-new', make: function (sc) { return new PC.WhiskWeapon(sc); },
      title: 'WHISK CYCLONE', sub: 'NEW!', desc: 'Whisks orbit and batter foes', icon: PC.WEAPON_ICONS.whisk });
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
  // shuffle-draw 3 distinct
  var out = [];
  while (out.length < 3 && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
};

PC.applyCard = function (scene, card) {
  if (card.kind === 'weapon-up') {
    card.w.level++;
    card.w.applyLevel();
  } else if (card.kind === 'weapon-new') {
    scene.weapons.push(card.make(scene));
  } else if (card.kind === 'passive') {
    scene.passives[card.pk] = (scene.passives[card.pk] || 0) + 1;
    PC.PASSIVES[card.pk].apply(scene.stats, scene.passives[card.pk]);
  } else if (card.kind === 'heal') {
    scene.hp = Math.min(PC.PLAYER.HP, scene.hp + 25);
  }
};
