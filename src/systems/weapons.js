// weapons.js - pooled player bullets + the Resizer Beam (COMPENDIUM 7.1).
// Bullets are plain pooled sprites moved by dt; hits query the enemy
// spatial hash 3x3 only. Kills route pop FX + food still + gem drop.
window.PC = window.PC || {};

PC.BulletSystem = function (scene) {
  this.scene = scene;
  this.pool = [];
  for (var i = 0; i < PC.CAPS.PLAYER_BULLETS; i++) {
    this.pool.push({
      active: false, x: 0, y: 0, dx: 0, dy: 0, spd: 0, dmg: 0, pierce: 0, life: 0,
      sprite: scene.add.image(0, 0, 'atlas', 'proj_resizer').setDepth(8).setVisible(false),
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
  b.life = 1.1;
  b.sprite.setFrame(spec.frame || 'proj_resizer')
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
    var hit = null;
    hash.eachNear(b.x, b.y, function (e) {
      var dx = e.x - b.x, dy = e.y - b.y;
      if (dx * dx + dy * dy < (e.r + 5) * (e.r + 5)) { hit = e; return true; }
    });
    if (hit) {
      hit.hp -= b.dmg;
      hit.flashUntil = this.scene.now + PC.HURT_FLASH_MS / 1000;
      hit.sprite.setTintFill(0xffffff);
      if (hit.hp <= 0) onKill(hit);
      if (b.pierce > 0) { b.pierce--; }
      else { b.active = false; b.sprite.setVisible(false); }
    }
  }
};

// ---- Resizer Beam: auto-fire at the nearest enemy (COMPENDIUM 7.1) ----
PC.ResizerWeapon = function () {
  this.cd = 0.55; this.dmg = 12; this.amount = 1; this.speed = 520;
  this.range = 420;
  this.cdT = 0;
};

PC.ResizerWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT > 0) return;
  // nearest live enemy within range (plain scan; runs at most ~2x/s)
  var best = null, bestD = this.range * this.range;
  var pool = scene.enemies.pool;
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (!e.active) continue;
    var dx = e.x - scene.px, dy = e.y - scene.py;
    var d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = e; }
  }
  if (!best) return;
  this.cdT = this.cd;
  scene.bullets.fire(scene.px, scene.py - 4, best.x, best.y, {
    speed: this.speed, dmg: this.dmg, frame: 'proj_resizer',
  });
  scene.fx.burst(scene.px + (best.x > scene.px ? 12 : -12), scene.py - 4, 'fx_muzzle', 2, 0.1);
  scene.facing = best.x >= scene.px ? 1 : -1;   // Danny faces his target
  if (PC.audio) PC.audio.shoot();
};
