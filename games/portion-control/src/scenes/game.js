// game.js - PC_Game. M3 combat core on the M1/M2 foundation: Danny always
// auto-firing the Resizer at the nearest food, pops -> harmless stills ->
// gems -> XP/levels, HP + timestamp i-frames, ambient spawner, results on
// death. HUD: HP bar, XP bar, timer, kills, fps-foes readout.
window.PC = window.PC || {};

PC.GameScene = function () { Phaser.Scene.call(this, { key: 'PC_Game' }); };
PC.GameScene.prototype = Object.create(Phaser.Scene.prototype);
PC.GameScene.prototype.constructor = PC.GameScene;

var FRY_DEF = { key: 'enemy_d1_fry', spd: 80, hp: 10, dmg: 6, xp: 1, size: 24, still: 'still_d1_fry' };

PC.GameScene.prototype.create = function () {
  this.cameras.main.setBackgroundColor(0x2a2544);

  this.ground = new PC.Ground(this, 1);
  this.moveInput = new PC.MoveInput(this);

  this.px = 0; this.py = 0;
  this.facing = 1;
  this.aimX = 1; this.aimY = 0;      // last movement direction = fire direction
  this.moving = false;
  this.walkT = 0;
  this.now = 0;
  this.player = this.add.image(0, 0, 'atlas', 'char_danny_walk_1').setDepth(10);

  this.enemies = new PC.EnemySystem(this);
  this.bullets = new PC.BulletSystem(this);
  this.fx = new PC.FxSystem(this);
  var self = this;
  this.gems = new PC.GemSystem(this, function (v) { self.gainXp(v); });
  this.weapon = new PC.ResizerWeapon();

  // run state
  this.hp = PC.PLAYER.HP;
  this.invUntil = 0;
  this.xp = 0; this.level = 1; this.xpNext = PC.XP.FIRST;
  this.kills = 0;
  this.runT = 0;
  this.dead = false;
  this.spawnAcc = 0;

  var cam = this.cameras.main;
  cam.startFollow(this.player, true, PC.RENDER.CAMERA_LERP, PC.RENDER.CAMERA_LERP);
  this.ground.update(cam);

  // ---- HUD (screen-space) ----
  this.hud = this.add.graphics().setScrollFactor(0).setDepth(100);
  this.timerText = this.add.text(PC.RENDER.W / 2, 4, '0:00', {
    fontFamily: 'monospace', fontSize: '12px', color: '#f7f4ef',
  }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);
  this.killText = this.add.text(PC.RENDER.W - 4, 4, 'POPS 0', {
    fontFamily: 'monospace', fontSize: '9px', color: '#f2c33c',
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
  this.levelText = this.add.text(4, 16, 'LV 1', {
    fontFamily: 'monospace', fontSize: '9px', color: '#a8e04a',
  }).setScrollFactor(0).setDepth(101);
  this.debugText = this.add.text(2, PC.RENDER.H - 12, '', {
    fontFamily: 'monospace', fontSize: '8px', color: '#a8e04a',
  }).setScrollFactor(0).setDepth(101);
  this._dbgAcc = 0;
  this.drawHud();

  // dev swarm button (works on touch - Mark can't press T on a phone)
  this.swarmBtn = this.add.text(PC.RENDER.W - 4, 18, '[SWARM]', {
    fontFamily: 'monospace', fontSize: '9px', color: '#6d6a8e',
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(101)
    .setInteractive({ useHandCursor: true });
  this.swarmBtn.on('pointerdown', function (p, lx, ly, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    this.stress();
  }, this);

  this.input.keyboard.on('keydown-G', function () { this.scene.start('PC_Gallery'); }, this);
  this.input.keyboard.on('keydown-T', function () { this.stress(); }, this);
  if (/[?&]stress=1/.test(window.location.search)) {
    this.time.delayedCall(400, this.stress, [], this);
  }

  // audio: unlock on first gesture, pause when tab hidden
  var unlock = function () { PC.audio.unlock(); };
  this.input.once('pointerdown', unlock);
  this.input.keyboard.once('keydown', unlock);
  if (!this._visHooked) {
    this._visHooked = true;
    document.addEventListener('visibilitychange', function () {
      PC.audio.setHidden(document.hidden);
    });
  }
};

PC.GameScene.prototype.stress = function () {
  var left = this.enemies.cap - this.enemies.liveCount;
  while (left > 0) {
    this.enemies.spawnRing(Math.min(60, left), FRY_DEF);
    left -= 60;
  }
};

PC.GameScene.prototype.gainXp = function (v) {
  if (PC.audio) PC.audio.gem();
  this.xp += v;
  while (this.xp >= this.xpNext) {
    this.xp -= this.xpNext;
    this.level++;
    this.xpNext = Math.round(this.xpNext * PC.XP.CURVE_MULT + PC.XP.CURVE_ADD);
    this.levelText.setText('LV ' + this.level);
    if (PC.audio) PC.audio.levelup();
    var t = this.add.text(PC.RENDER.W / 2, PC.RENDER.H / 2 - 40, 'LEVEL UP!', {
      fontFamily: 'monospace', fontSize: '18px', color: '#a8e04a', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 20, duration: 900, onComplete: function () { t.destroy(); } });
  }
  this.drawHud();
};

PC.GameScene.prototype.onKill = function (e) {
  e.active = false;
  e.sprite.setVisible(false);
  e.sprite.clearTint();
  this.enemies.liveCount--;
  this.kills++;
  this.killText.setText('POPS ' + this.kills);
  this.fx.burst(e.x, e.y, 'fx_pop', 4, 0.3);
  if (e.still) this.fx.still(e.x, e.y, e.still, 0.4);
  this.gems.spawn(e.x, e.y, e.xp);
  if (PC.audio) PC.audio.pop();
};

PC.GameScene.prototype.drawHud = function () {
  var g = this.hud;
  g.clear();
  // HP bar (Cherry) top-left
  var hpw = 70;
  g.fillStyle(PC.PAL.INK, 0.8).fillRect(3, 3, hpw + 2, 8);
  g.fillStyle(PC.PAL.CHERRY, 1).fillRect(4, 4, Math.max(0, hpw * this.hp / PC.PLAYER.HP), 6);
  // XP bar (Lime) under it
  g.fillStyle(PC.PAL.INK, 0.8).fillRect(3, 12, hpw + 2, 4);
  g.fillStyle(PC.PAL.LIME, 1).fillRect(4, 13, Math.max(0, hpw * Math.min(1, this.xp / this.xpNext)), 2);
};

PC.GameScene.prototype.update = function (time, delta) {
  if (this.dead) return;
  var dt = Math.min(PC.DT_CLAMP, delta / 1000);
  this.now += dt;
  this.runT += dt;

  // input -> motion, same frame
  this.moveInput.update();
  var v = this.moveInput.vec;
  this.moving = (v.x !== 0 || v.y !== 0);
  if (this.moving) {
    this.px += v.x * PC.PLAYER.SPEED * dt;
    this.py += v.y * PC.PLAYER.SPEED * dt;
    if (v.x > 0.01) this.facing = 1;
    else if (v.x < -0.01) this.facing = -1;
    this.aimX = v.x; this.aimY = v.y;
    this.walkT += dt;
    this.player.setFrame('char_danny_walk_' + (1 + (Math.floor(this.walkT * 9) % 4)));
  } else {
    this.walkT = 0;
    this.player.setFrame('char_danny_idle');
  }
  // buildings are solid (Mark round 6)
  var rp = PC.resolveCircle(this.px, this.py, 10);
  this.px = rp.x; this.py = rp.y;
  // walk juice (ARTDNA): 1px step bob + a whisper of lean
  var bob = this.moving ? Math.round(Math.sin(this.walkT * 11)) : 0;
  this.player.setPosition(Math.round(this.px), Math.round(this.py) + bob);
  this.player.rotation = this.moving ? this.facing * 0.03 : 0;

  // systems
  this.enemies.update(dt, this.px, this.py);
  this.weapon.update(dt, this);
  var self = this;
  this.bullets.update(dt, this.enemies, function (e) { self.onKill(e); });
  this.gems.update(dt, this.px, this.py, PC.PLAYER.PICKUP_R);
  this.fx.update(dt);
  this.player.setFlipX(this.facing < 0);

  // enemy hit-flash decay (timestamp, never a stuck boolean)
  var pool = this.enemies.pool;
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (e.active && e.flashUntil && this.now > e.flashUntil) {
      e.flashUntil = 0;
      e.sprite.clearTint();
    }
  }

  // contact damage via 3x3 hash query + timestamp i-frames
  if (this.now > this.invUntil) {
    var hitDmg = 0;
    this.enemies.hash.eachNear(this.px, this.py, function (e) {
      var dx = e.x - self.px, dy = e.y - self.py;
      if (dx * dx + dy * dy < (e.r + 8) * (e.r + 8)) { hitDmg = e.dmg; return true; }
    });
    if (hitDmg > 0) {
      this.hp -= hitDmg;
      this.invUntil = this.now + PC.PLAYER.IFRAMES;
      this.cameras.main.shake(PC.SHAKE.MS, 0.004);
      if (PC.audio) PC.audio.hurt();
      this.drawHud();
      if (this.hp <= 0) { this.die(); return; }
    }
  }
  // i-frame blink at 10Hz
  this.player.setAlpha(this.now < this.invUntil && Math.floor(this.now * 10) % 2 ? 0.35 : 1);

  // ambient spawner (M3 stand-in for the M5 spawn director): pressure
  // rises gently with time so Danny always has something to pop
  this.spawnAcc += dt;
  var interval = Math.max(0.45, 1.1 - this.runT * 0.01);
  if (this.spawnAcc >= interval && this.enemies.liveCount < 150) {
    this.spawnAcc = 0;
    var cam = this.cameras.main;
    var cx = cam.scrollX + PC.RENDER.W / 2, cy = cam.scrollY + PC.RENDER.H / 2;
    var n = 1 + (Math.random() < 0.4 ? 1 : 0) + (this.runT > 60 ? 1 : 0);
    for (var s = 0; s < n; s++) {
      var a = Math.random() * Math.PI * 2;
      var R = 300 + Math.random() * 60;
      this.enemies.spawn(cx + Math.cos(a) * R, cy + Math.sin(a) * R, FRY_DEF);
    }
  }

  this.ground.update(this.cameras.main);

  // timer + debug
  this._dbgAcc += dt;
  if (this._dbgAcc > 0.25) {
    this._dbgAcc = 0;
    var m = Math.floor(this.runT / 60), sec = Math.floor(this.runT % 60);
    this.timerText.setText(m + ':' + (sec < 10 ? '0' : '') + sec);
    this.debugText.setText('fps ' + Math.round(this.game.loop.actualFps) +
      ' - foes ' + this.enemies.liveCount);
  }
};

PC.GameScene.prototype.die = function () {
  this.dead = true;
  if (PC.audio) { PC.audio.stopMusic(); PC.audio.hurt(); }
  this.fx.burst(this.px, this.py, 'fx_pop', 4, 0.4);
  this.player.setVisible(false);
  var self = this;
  this.time.delayedCall(700, function () {
    self.scene.start('PC_Results', { time: self.runT, kills: self.kills, level: self.level });
  });
};
