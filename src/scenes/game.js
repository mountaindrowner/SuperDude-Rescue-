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
  // origin at the feet (0.82 down) so his world position IS where he stands -
  // collision stops his FEET at buildings, not his center (Mark round 10:
  // "some buildings are walk-throughable / strange collisions")
  this.player = this.add.image(0, 0, 'atlas', 'char_danny_walk_1')
    .setOrigin(0.5, 0.82).setDepth(10);

  // ghost trail (VS after-image, code-side): 6 pooled ghosts, Danny only
  this.ghosts = [];
  for (var gi = 0; gi < 6; gi++) {
    this.ghosts.push({ t: 0, life: 0,
      img: this.add.image(0, 0, 'atlas', 'char_danny_walk_1').setOrigin(0.5, 0.82).setDepth(9).setVisible(false) });
  }
  this._ghostAcc = 0;

  this.enemies = new PC.EnemySystem(this);
  this.bullets = new PC.BulletSystem(this);
  this.fx = new PC.FxSystem(this);
  var self = this;
  this.gems = new PC.GemSystem(this, function (v) { self.gainXp(v); });
  this.stats = { dmgMult: 1, cdMult: 1, spdMult: 1 };
  this.weapons = [new PC.ResizerWeapon()];
  this.passives = {};
  this._onKillCb = function (e) { self.onKill(e); };
  this.pendingLevels = 0;
  this.cardsOpen = false;
  this.cardUi = [];

  // run state
  this.hp = PC.PLAYER.HP;
  this.invUntil = 0;
  this.xp = 0; this.level = 1; this.xpNext = PC.XP.FIRST;
  this.kills = 0;
  this.runT = 0;
  this.dead = false;
  this.director = new PC.SpawnDirector(this);
  this._rings = {};
  this.pickups = new PC.PickupSystem(this);
  this.boss = null; this.bossSpawned = false; this.won = false;
  this.bossBar = this.add.graphics().setScrollFactor(0).setDepth(103);

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
  this.goldText = this.add.text(4, 27, '', {
    fontFamily: 'monospace', fontSize: '9px', color: '#f2c33c',
  }).setScrollFactor(0).setDepth(101);
  this.debugText = this.add.text(2, PC.RENDER.H - 12, '', {
    fontFamily: 'monospace', fontSize: '8px', color: '#a8e04a',
  }).setScrollFactor(0).setDepth(101);
  this.add.text(PC.RENDER.W - 3, PC.RENDER.H - 11, PC.VERSION, {
    fontFamily: 'monospace', fontSize: '8px', color: '#6d6a8e',
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
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
    this.pendingLevels++;
  }
  if (this.pendingLevels > 0 && !this.cardsOpen) this.showCards();
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
  var roll = Math.random();
  if (roll < 0.015) this.pickups.drop(e.x, e.y, 'medkit', PC.PLAYER.MEDKIT_HEAL);
  else if (roll < 0.10) this.pickups.drop(e.x, e.y, 'coin', 1);
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
  if (this.goldText && this.pickups) this.goldText.setText('$ ' + this.pickups.gold);
};

// small rising label (heals, pickups)
PC.GameScene.prototype.floatText = function (str, color) {
  var t = this.add.text(this.player.x, this.player.y - 30, str, {
    fontFamily: 'monospace', fontSize: '10px',
    color: '#' + ('00000' + (color || 0xffffff).toString(16)).slice(-6), fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(102);
  this.tweens.add({ targets: t, y: t.y - 16, alpha: 0, duration: 700,
    onComplete: function () { t.destroy(); } });
};

// ---- M4: the 3-card pick (pause world, choose, resume) ----
PC.GameScene.prototype.showCards = function () {
  this.cardsOpen = true;
  var W = PC.RENDER.W, H = PC.RENDER.H;
  var self = this;
  var ui = this.cardUi;
  var scrim = this.add.rectangle(W / 2, H / 2, W, H, 0x0b0818, 0.72)
    .setScrollFactor(0).setDepth(200);
  ui.push(scrim);
  ui.push(this.add.text(W / 2, H / 2 - 96, 'LEVEL UP! PICK ONE', {
    fontFamily: 'monospace', fontSize: '13px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(201));
  var cards = PC.drawCards(this);
  var cw = 78, ch = 120, gap = 8;
  var x0 = W / 2 - (cards.length * (cw + gap) - gap) / 2 + cw / 2;
  cards.forEach(function (card, i) {
    var cx = x0 + i * (cw + gap), cy = H / 2;
    var panel = self.add.rectangle(cx, cy, cw, ch, 0x2a2544, 1)
      .setStrokeStyle(2, card.sub === 'NEW!' ? 0xf2c33c : 0x35d0ff)
      .setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });
    var icon = self.add.image(cx, cy - 32, 'atlas', card.icon)
      .setScale(1.6).setScrollFactor(0).setDepth(202);
    var title = self.add.text(cx, cy + 2, card.title, {
      fontFamily: 'monospace', fontSize: '8px', color: '#f7f4ef', fontStyle: 'bold',
      align: 'center', wordWrap: { width: cw - 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    var sub = self.add.text(cx, cy + 22, card.sub, {
      fontFamily: 'monospace', fontSize: '9px', color: '#f2c33c', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    var desc = self.add.text(cx, cy + 42, card.desc, {
      fontFamily: 'monospace', fontSize: '7px', color: '#cfd4e8',
      align: 'center', wordWrap: { width: cw - 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    ui.push(panel, icon, title, sub, desc);
    panel.on('pointerdown', function () { self.pickCard(card); });
  });
  this._cardKeys = [];
  cards.forEach(function (card, i) {
    var h = function () { self.pickCard(card); };
    self.input.keyboard.on('keydown-' + ['ONE', 'TWO', 'THREE'][i], h);
    self._cardKeys.push(['keydown-' + ['ONE', 'TWO', 'THREE'][i], h]);
  });
};

PC.GameScene.prototype.pickCard = function (card) {
  if (!this.cardsOpen) return;
  PC.applyCard(this, card);
  if (PC.audio) PC.audio.ui();
  var self = this;
  this.cardUi.forEach(function (o) { o.destroy(); });
  this.cardUi = [];
  this._cardKeys.forEach(function (k) { self.input.keyboard.off(k[0], k[1]); });
  this._cardKeys = [];
  this.cardsOpen = false;
  this.pendingLevels--;
  this.drawHud();
  if (this.pendingLevels > 0) this.showCards();
};

PC.GameScene.prototype.update = function (time, delta) {
  if (this.dead) return;
  if (this.cardsOpen) return;                 // world paused during the pick
  var dt = Math.min(PC.DT_CLAMP, delta / 1000);
  this.now += dt;
  this.runT += dt;

  // input -> motion, same frame
  this.moveInput.update();
  var v = this.moveInput.vec;
  this.moving = (v.x !== 0 || v.y !== 0);
  var spd = PC.PLAYER.SPEED * this.stats.spdMult;
  if (this.moving) {
    this.px += v.x * spd * dt;
    this.py += v.y * spd * dt;
    if (v.x > 0.01) this.facing = 1;
    else if (v.x < -0.01) this.facing = -1;
    this.aimX = v.x; this.aimY = v.y;
    this.walkT += dt;
    this.player.setFrame('char_danny_walk_' + (1 + (Math.floor(this.walkT * 10) % 6)));
  } else {
    this.walkT = 0;
    this.player.setFrame('char_danny_idle');
  }
  // buildings are solid (Mark round 6)
  var rp = PC.resolveCircle(this.px, this.py, 13);
  this.px = rp.x; this.py = rp.y;
  // walk juice (ARTDNA): 1px step bob + a whisper of lean
  var bob = this.moving ? Math.round(Math.sin(this.walkT * 11)) : 0;
  this.player.setPosition(Math.round(this.px), Math.round(this.py) + bob);
  this.player.rotation = this.moving ? this.facing * 0.03 : 0;

  // ghost trail: drop a faint after-image every 70ms of movement; it stays
  // put as Danny moves on, so the trail streams opposite his heading
  this._ghostAcc += dt;
  if (this.moving && this._ghostAcc > 0.07) {
    this._ghostAcc = 0;
    var gh = null;
    for (var g1 = 0; g1 < this.ghosts.length; g1++) {
      if (this.ghosts[g1].life <= 0) { gh = this.ghosts[g1]; break; }
    }
    if (gh) {
      gh.life = 0.22; gh.t = 0.22;
      gh.img.setFrame(this.player.frame.name)
        .setFlipX(this.player.flipX)
        .setPosition(this.player.x, this.player.y)
        .setAlpha(0.16).setVisible(true);
    }
  }
  for (var g2 = 0; g2 < this.ghosts.length; g2++) {
    var gg = this.ghosts[g2];
    if (gg.life <= 0) continue;
    gg.life -= dt;
    if (gg.life <= 0) { gg.img.setVisible(false); continue; }
    gg.img.setAlpha(0.16 * (gg.life / gg.t));
  }

  // systems
  this.enemies.update(dt, this.px, this.py);
  for (var wi = 0; wi < this.weapons.length; wi++) this.weapons[wi].update(dt, this);
  var self = this;
  this.bullets.update(dt, this.enemies, this._onKillCb);
  this.gems.update(dt, this.px, this.py, PC.PLAYER.PICKUP_R * (1 + 0));
  this.pickups.update(dt, this.px, this.py, PC.PLAYER.PICKUP_R);
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

  // spawn director (COMPENDIUM 8.1, kid-tuned): sparse early, intense late,
  // 5 food types introduced on a timeline. Ambient spawns thin out while
  // the boss lives (COMPENDIUM 5.1 x1.8 interval) so the fight can breathe.
  if (!this.boss || this.boss.dead) {
    this.director.update(dt, this.runT);
  } else {
    this.director.update(dt * 0.55, this.runT);
  }
  var rings = [[60, 14, 'fry'], [150, 18, 'popcorn'], [240, 22, 'hotdog']];
  for (var ri = 0; ri < rings.length; ri++) {
    if (this.runT >= rings[ri][0] && !this._rings[ri]) {
      this._rings[ri] = true;
      this.director.ring(rings[ri][1], rings[ri][2], this.runT / 60);
    }
  }

  // ---- BOSS (M5): Big Frank at the timer, then run his fight ----
  if (!this.bossSpawned && this.runT >= PC.RUN.BOSS_AT_S) this.spawnBoss();
  if (this.boss) this.boss.update(dt, this.px, this.py);

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
  if (this.dead || this.won) return;
  this.dead = true;
  if (PC.audio) { PC.audio.stopMusic(); PC.audio.hurt(); }
  this.fx.burst(this.px, this.py, 'fx_pop', 4, 0.4);
  this.player.setVisible(false);
  var self = this;
  this.time.delayedCall(700, function () {
    self.scene.start('PC_Results', { time: self.runT, kills: self.kills, level: self.level,
      gold: self.pickups.gold, win: false });
  });
};

// ---- BOSS spawn: big cinematic entrance (dopamine) ----
PC.GameScene.prototype.spawnBoss = function () {
  this.bossSpawned = true;
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  // spawn off the top edge, drifting toward the player
  this.boss = new PC.Boss(this, this.px, this.py - Math.max(W, H) * 0.55);
  // white flash + shake + roar
  var flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.7).setScrollFactor(0).setDepth(150);
  this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: function () { flash.destroy(); } });
  this.cameras.main.shake(400, 0.01);
  if (PC.audio) { PC.audio.hurt(); PC.audio.levelup(); }
  // banner
  var banner = this.add.text(W / 2, H * 0.32, 'BIG FRANK\nAPPEARS!', {
    fontFamily: 'monospace', fontSize: '20px', color: '#ff6b6b', fontStyle: 'bold',
    align: 'center', stroke: '#1b1530', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(151).setScale(0.5);
  this.tweens.add({ targets: banner, scale: 1, duration: 300, ease: 'Back.out' });
  this.tweens.add({ targets: banner, alpha: 0, delay: 1600, duration: 500,
    onComplete: function () { banner.destroy(); } });
};

// weapons/bullets route boss hits here (single damage path stays in Boss)
PC.GameScene.prototype.hitBoss = function (x, y, dmg, dx, dy) {
  var b = this.boss;
  if (!b || b.dead) return false;
  var ddx = b.x - x, ddy = b.y - y;
  if (ddx * ddx + ddy * ddy > (b.r + 8) * (b.r + 8)) return false;
  b.damage(dmg, dx, dy);
  this.fx.burst(x, y, 'fx_spark', 3, 0.16);
  return true;
};

// ---- VICTORY: shrink + confetti + slowmo + DISTRICT CLEARED + rescue ----
PC.GameScene.prototype.onBossDefeated = function () {
  if (this.won) return;
  this.won = true;
  var self = this, W = PC.RENDER.W, H = PC.RENDER.H, b = this.boss;
  if (PC.audio) { PC.audio.stopMusic(); PC.audio.levelup(); }
  this.cameras.main.shake(500, 0.012);
  // slowmo
  this.time.timeScale = 0.4;

  // Frank shrinks back to a normal hot dog then pops into gold
  b.tele.setVisible(false); b.shadow.setVisible(false);
  this.tweens.add({ targets: b.sprite, scale: 0.35, angle: 360, duration: 900, ease: 'Cubic.in',
    onComplete: function () {
      b.sprite.setVisible(false);
      self.fx.burst(b.x, b.y, 'fx_pop', 4, 0.5);
      // confetti of coins raining toward Danny
      for (var i = 0; i < 24; i++) {
        var a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 60;
        self.pickups.drop(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, 'coin', 5);
      }
    } });

  // banner + cage rescue after a beat
  this.time.delayedCall(1100, function () {
    self.time.timeScale = 1;
    self._rescueSequence(b.x, b.y);
  }, [], this);
};

PC.GameScene.prototype._rescueSequence = function (bx, by) {
  var self = this, W = PC.RENDER.W, H = PC.RENDER.H;
  // DISTRICT CLEARED banner
  var t1 = this.add.text(W / 2, H * 0.3, 'DISTRICT CLEARED!', {
    fontFamily: 'monospace', fontSize: '20px', color: '#a8e04a', fontStyle: 'bold',
    stroke: '#1b1530', strokeThickness: 3,
  }).setOrigin(0.5).setScrollFactor(0).setDepth(151).setScale(0.4);
  this.tweens.add({ targets: t1, scale: 1, duration: 350, ease: 'Back.out' });

  // a cage where Frank was; it cracks, The Cook pops out
  var cage = this.add.image(bx, by, 'atlas', 'pickup_cage_1').setScale(1.6).setDepth(11);
  var cook = this.add.image(bx, by - 4, 'atlas', PC.D1_RESCUE.art).setScale(0.8).setDepth(12).setVisible(false);
  if (PC.audio) PC.audio.chest();
  this.time.delayedCall(500, function () {
    cage.setFrame('pickup_cage_2'); self.cameras.main.shake(120, 0.006);
  });
  this.time.delayedCall(900, function () {
    cage.setFrame('pickup_cage_3');
    cook.setVisible(true).setScale(0.4);
    self.tweens.add({ targets: cook, scale: 0.9, y: cook.y - 10, duration: 400, ease: 'Back.out' });
    self.fx.burst(bx, by - 8, 'fx_levelup', 4, 0.5);
    if (PC.audio) PC.audio.levelup();
    self.time.delayedCall(200, function () { cage.destroy(); });
    // sparkle ring of coins/gems joy
    for (var i = 0; i < 10; i++) self.fx.burst(bx + (Math.random() - 0.5) * 40, by - 8 + (Math.random() - 0.5) * 30, 'fx_spark', 3, 0.4);
    var t2 = self.add.text(W / 2, H * 0.4, 'TEAMMATE RESCUED!', {
      fontFamily: 'monospace', fontSize: '15px', color: '#f2c33c', fontStyle: 'bold',
      stroke: '#1b1530', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);
  });
  // to results
  this.time.delayedCall(2800, function () {
    self.scene.start('PC_Results', { time: self.runT, kills: self.kills, level: self.level,
      gold: self.pickups.gold, win: true, rescued: PC.D1_RESCUE.name });
  });
};
