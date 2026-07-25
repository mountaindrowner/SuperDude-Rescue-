// boss.js - THE BIG FRANK, District 1 finale (COMPENDIUM 8.1 + M5).
// One boss instance with a telegraphed Charge, Condiment Splatter puddles,
// and an enrage. damageBoss() is the ONLY thing that changes boss HP and
// the ONLY caller of bossDefeated() (Perf Bible 10 - win can never miss).
window.PC = window.PC || {};

PC.BOSS_D1 = { key: 'boss_d1_frank', size: 128, hp: 3000, spd: 100, contact: 20, name: 'BIG FRANK' };

PC.Boss = function (scene, x, y) {
  this.scene = scene;
  var d = PC.BOSS_D1;
  this.x = x; this.y = y;
  this.hp = d.hp; this.maxHp = d.hp;
  this.spd = d.spd; this.contact = d.contact; this.r = d.size / 2 - 18;
  this.name = d.name;
  this.state = 'intro'; this.stateT = 0;
  this.chargeCd = 6; this.splatCd = 4; this.animT = 0;
  this.flashUntil = 0;
  this.dead = false; this.defeated = false;
  this.chargeVX = 0; this.chargeVY = 0;

  this.sprite = scene.add.image(x, y, 'atlas', d.key + '_walk_1').setDepth(11).setScale(1.15);
  this.shadow = scene.add.image(x, y + 26, 'atlas', 'fx_pop_1')
    .setTint(0x0a0812).setAlpha(0.35).setScale(3.2, 1.4).setDepth(4);
  this.tele = scene.add.graphics().setDepth(6).setVisible(false);   // charge telegraph

  // ketchup puddle hazards (pooled)
  this.puddles = [];
  for (var i = 0; i < 14; i++) {
    this.puddles.push({ active: false, x: 0, y: 0, r: 0, life: 0, tick: 0,
      img: scene.add.image(0, 0, 'atlas', 'fx_puddle_1').setTint(0xd93a3a).setAlpha(0.75).setDepth(3).setVisible(false) });
  }
};

PC.Boss.prototype.enraged = function () { return this.hp < this.maxHp * 0.25; };

// THE single HP path (Perf Bible 10)
PC.Boss.prototype.damage = function (amount, dirx, diry) {
  if (this.dead) return;
  this.hp -= amount;
  this.flashUntil = this.scene.now + 0.06;
  this.sprite.setTintFill(0xffffff);
  if (this.hp <= 0) { this.hp = 0; this.die(); }
};

PC.Boss.prototype._splat = function () {
  var scene = this.scene, self = this;
  // lob 5 blobs to land near the player: telegraph shadows, then puddles
  for (var i = 0; i < 5; i++) {
    var a = Math.random() * Math.PI * 2, r = Math.random() * 70;
    var tx = scene.px + Math.cos(a) * r, ty = scene.py + Math.sin(a) * r;
    (function (px2, py2) {
      // warning shadow
      var warn = scene.add.image(px2, py2, 'atlas', 'fx_pop_1').setTint(0xd93a3a).setAlpha(0.3).setScale(1.6, 0.9).setDepth(3);
      scene.tweens.add({ targets: warn, alpha: 0.55, scaleX: 2, scaleY: 1.1, duration: 500, yoyo: false,
        onComplete: function () {
          warn.destroy();
          self._puddle(px2, py2);
        } });
    })(tx, ty);
  }
  if (PC.audio) PC.audio.splat();
};

PC.Boss.prototype._puddle = function (x, y) {
  for (var i = 0; i < this.puddles.length; i++) {
    var p = this.puddles[i];
    if (p.active) continue;
    p.active = true; p.x = x; p.y = y; p.r = 30; p.life = 3; p.tick = 0;
    p.img.setPosition(x, y).setScale(1.8).setAlpha(0.75).setVisible(true);
    this.scene.fx.burst(x, y, 'fx_spark', 3, 0.2);
    return;
  }
};

PC.Boss.prototype.update = function (dt, px, py) {
  if (this.dead) { this._updatePuddles(dt, px, py); return; }
  this.animT += dt; this.stateT += dt;
  var scene = this.scene;

  // flash decay
  if (this.flashUntil && this.scene.now > this.flashUntil) { this.flashUntil = 0; this.sprite.clearTint(); }
  // enrage tint
  if (this.enraged() && !this.flashUntil) this.sprite.setTint(0xffb0b0);

  // ---- state machine ----
  if (this.state === 'intro') {
    if (this.stateT > 1.4) { this.state = 'active'; this.stateT = 0; }
  } else if (this.state === 'active') {
    // drift toward the player
    var dx = px - this.x, dy = py - this.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.x += (dx / len) * this.spd * dt;
    this.y += (dy / len) * this.spd * dt;
    this.sprite.flipX = dx < 0;
    // attack timers
    this.chargeCd -= dt; this.splatCd -= dt;
    var chargeEvery = this.enraged() ? 4 : 6;
    if (this.splatCd <= 0) { this.splatCd = 9; this._splat(); }
    if (this.chargeCd <= 0) {
      this.chargeCd = chargeEvery; this.state = 'telegraph'; this.stateT = 0;
      this._teleDx = dx / len; this._teleDy = dy / len;
      this.sprite.setTint(0xd93a3a);                        // Cherry warn tint
    }
  } else if (this.state === 'telegraph') {
    // 0.7s warning: draw the dash lane
    this.tele.setVisible(true).clear();
    this.tele.fillStyle(0xd93a3a, 0.18 + 0.12 * Math.sin(this.stateT * 20));
    var ex = this.x + this._teleDx * 360, ey = this.y + this._teleDy * 360;
    this.tele.lineStyle(10, 0xd93a3a, 0.35).lineBetween(this.x, this.y, ex, ey);
    if (this.stateT > 0.7) {
      this.state = 'charge'; this.stateT = 0; this.tele.setVisible(false);
      this.chargeVX = this._teleDx * 320; this.chargeVY = this._teleDy * 320;
      this.sprite.clearTint();
      if (PC.audio) PC.audio.roar();
    }
  } else if (this.state === 'charge') {
    this.x += this.chargeVX * dt; this.y += this.chargeVY * dt;
    if (this.stateT > 1.1) { this.state = 'active'; this.stateT = 0; }
  }

  // walk-frame flipbook + bob
  var fr = 1 + (Math.floor(this.animT * 6) % 4);
  this.sprite.setFrame(PC.BOSS_D1.key + '_walk_' + fr);
  this.sprite.setPosition(Math.round(this.x), Math.round(this.y) + Math.round(Math.sin(this.animT * 5) * 2));
  this.shadow.setPosition(this.x, this.y + 28);

  // ---- contact damage to the player (respects i-frames) ----
  var cdx = px - this.x, cdy = py - this.y;
  if (cdx * cdx + cdy * cdy < (this.r + 12) * (this.r + 12) && scene.now > scene.invUntil) {
    scene.hp -= Math.max(1, this.contact * scene.dmgTakenMult - scene.stats.armor);
    scene.invUntil = scene.now + PC.PLAYER.IFRAMES;
    scene.cameras.main.shake(140, 0.008);
    if (PC.audio) PC.audio.hurt();
    scene.drawHud();
    if (scene.hp <= 0) scene.die();
  }

  this._updatePuddles(dt, px, py);
  this._drawBar();
};

PC.Boss.prototype._updatePuddles = function (dt, px, py) {
  for (var i = 0; i < this.puddles.length; i++) {
    var p = this.puddles[i];
    if (!p.active) continue;
    p.life -= dt; p.tick -= dt;
    if (p.life <= 0) { p.active = false; p.img.setVisible(false); continue; }
    p.img.setAlpha(0.75 * Math.min(1, p.life));
    var dx = px - p.x, dy = py - p.y;
    if (dx * dx + dy * dy < (p.r) * (p.r) && p.tick <= 0 && this.scene.now > this.scene.invUntil - 0.4) {
      p.tick = 0.5;
      this.scene.hp -= 4;                                    // 8 dmg/s while inside
      this.scene.drawHud();
      if (this.scene.hp <= 0) this.scene.die();
    }
  }
};

PC.Boss.prototype._drawBar = function () {
  var g = this.scene.bossBar; if (!g) return;
  var W = PC.RENDER.W, y = PC.RENDER.H - 8;
  g.clear();
  g.fillStyle(0x1b1530, 0.85).fillRect(8, y, W - 16, 6);
  g.fillStyle(0xff6b6b, 1).fillRect(9, y + 1, Math.max(0, (W - 18) * this.hp / this.maxHp), 4);
};

PC.Boss.prototype.die = function () {
  this.dead = true;
  this.scene.onBossDefeated();     // single-path win trigger
};

PC.Boss.prototype.finalDestroy = function () {
  this.sprite.destroy(); this.shadow.destroy(); this.tele.destroy();
  for (var i = 0; i < this.puddles.length; i++) this.puddles[i].img.destroy();
};
