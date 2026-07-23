// pickups.js - health, supply crates and gold coins (Mark round 10:
// "no way to heal... VS-style crates you break... med kits... gold to
// level up characters"). Two pools: CRATES (ambient, break on contact or
// bullet -> spill a reward) and FLOATERS (medkit/coin, vacuum to player).
window.PC = window.PC || {};

PC.PickupSystem = function (scene) {
  this.scene = scene;
  this.crates = [];
  for (var i = 0; i < 10; i++) {
    this.crates.push({ active: false, x: 0, y: 0, hp: 0,
      sprite: scene.add.image(0, 0, 'atlas', 'pickup_crate').setDepth(4).setVisible(false) });
  }
  this.floats = [];
  for (var j = 0; j < 80; j++) {
    this.floats.push({ active: false, x: 0, y: 0, kind: '', val: 0, fly: false, spd: 0, t: 0,
      sprite: scene.add.image(0, 0, 'atlas', 'pickup_coin').setDepth(4).setVisible(false) });
  }
  this.crateAcc = 0;
  // gold persists across runs (roguelite meta-currency)
  this.gold = parseInt((typeof localStorage !== 'undefined' && localStorage.getItem('portioncontrol.gold')) || '0', 10) || 0;
  this.runGold = 0;
};

PC.PickupSystem.prototype._crate = function () {
  for (var i = 0; i < this.crates.length; i++) if (!this.crates[i].active) return this.crates[i];
  return null;
};
PC.PickupSystem.prototype._float = function () {
  for (var i = 0; i < this.floats.length; i++) if (!this.floats[i].active) return this.floats[i];
  return null;
};

// spawn a floating pickup (kind: 'medkit' | 'coin')
PC.PickupSystem.prototype.drop = function (x, y, kind, val) {
  var f = this._float(); if (!f) return;
  f.active = true; f.x = x; f.y = y; f.kind = kind; f.val = val || 0;
  f.fly = false; f.spd = 0; f.t = 0;
  f.sprite.setTexture('atlas', 'pickup_' + kind).setPosition(x, y)
    .setScale(kind === 'coin' ? 1 : 1).setAlpha(1).setVisible(true);
};

// break a crate -> spill 1 med-kit OR a fan of coins (weighted)
PC.PickupSystem.prototype.breakCrate = function (c) {
  c.active = false; c.sprite.setVisible(false);
  this.scene.fx.burst(c.x, c.y, 'fx_spark', 3, 0.2);
  if (PC.audio) PC.audio.chest ? PC.audio.chest() : PC.audio.ui();
  var roll = Math.random();
  if (roll < 0.4) {
    this.drop(c.x, c.y, 'medkit', PC.PLAYER.MEDKIT_HEAL || 35);
  } else {
    var n = 3 + ((Math.random() * 4) | 0);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 10;
      this.drop(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 'coin', 5);
    }
  }
};

PC.PickupSystem.prototype.update = function (dt, px, py, pickupR) {
  var scene = this.scene, cam = scene.cameras.main;

  // ---- ambient crate spawns: a few scattered ahead, capped ----
  this.crateAcc += dt;
  var liveCrates = 0, i;
  for (i = 0; i < this.crates.length; i++) if (this.crates[i].active) liveCrates++;
  if (this.crateAcc > 6 && liveCrates < 4) {
    this.crateAcc = 0;
    var c = this._crate();
    if (c) {
      var ang = Math.random() * Math.PI * 2;
      var dist = 120 + Math.random() * 90;
      var cxp = px + Math.cos(ang) * dist, cyp = py + Math.sin(ang) * dist;
      var res = PC.resolveCircle(cxp, cyp, 16);   // don't spawn inside a building
      c.active = true; c.x = res.x; c.y = res.y; c.hp = 1;
      c.sprite.setPosition(c.x, c.y).setVisible(true);
    }
  }

  // ---- crate: break when the player walks into it ----
  for (i = 0; i < this.crates.length; i++) {
    var cr = this.crates[i];
    if (!cr.active) continue;
    var ddx = cr.x - px, ddy = cr.y - py;
    if (ddx * ddx + ddy * ddy < 20 * 20) this.breakCrate(cr);
  }

  // ---- floaters: idle until pickup radius, then vacuum in ----
  var r2 = pickupR * pickupR;
  for (i = 0; i < this.floats.length; i++) {
    var f = this.floats[i];
    if (!f.active) continue;
    f.t += dt;
    if (f.t > 12) { f.active = false; f.sprite.setVisible(false); continue; }   // despawn stragglers
    var dx = px - f.x, dy = py - f.y, d2 = dx * dx + dy * dy;
    // gentle bob while idle
    if (!f.fly) {
      f.sprite.y = f.y + Math.sin(f.t * 4) * 1.5;
      if (d2 < r2) { f.fly = true; f.spd = 120; }
    }
    if (f.fly) {
      var d = Math.sqrt(d2) || 1;
      f.spd += 900 * dt;
      f.x += (dx / d) * f.spd * dt; f.y += (dy / d) * f.spd * dt;
      f.sprite.setPosition(f.x, f.y);
      if (d < 12) {
        f.active = false; f.sprite.setVisible(false);
        this.collect(f);
      }
    }
  }
};

PC.PickupSystem.prototype.collect = function (f) {
  var scene = this.scene;
  if (f.kind === 'medkit') {
    scene.hp = Math.min(PC.PLAYER.HP, scene.hp + f.val);
    scene.drawHud();
    if (PC.audio) PC.audio.heal();
    scene.floatText && scene.floatText('+' + f.val, 0xff6b6b);
  } else if (f.kind === 'coin') {
    this.gold += f.val; this.runGold += f.val;
    try { localStorage.setItem('portioncontrol.gold', String(this.gold)); } catch (e) {}
    if (PC.audio) PC.audio.coin ? PC.audio.coin() : PC.audio.gem();
    scene.drawHud();
  }
};

// a bullet can also break a crate (checked from the bullet system helper)
PC.PickupSystem.prototype.hitAt = function (x, y) {
  for (var i = 0; i < this.crates.length; i++) {
    var c = this.crates[i];
    if (!c.active) continue;
    var dx = c.x - x, dy = c.y - y;
    if (dx * dx + dy * dy < 18 * 18) { this.breakCrate(c); return true; }
  }
  return false;
};
