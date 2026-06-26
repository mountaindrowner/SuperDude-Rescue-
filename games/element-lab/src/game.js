// game.js — DANNYLAB_Game. The core merge loop (Brief §2, §12). Tweezers
// drop tiers 1-3, twins fuse into the next tier at the contact point,
// cascades chain, overflow ends Endless, two Uraniums trigger Fission.
window.DANNYLAB = window.DANNYLAB || {};

// ---- beaker geometry (portrait 540 x 960) ----
DANNYLAB.GEO = {
  W: 540, H: 960,
  bx0: 96, bx1: 444,          // interior left/right
  wall: 24,
  yRim: 300, floorTop: 884,
  fillLineY: 336, dropY: 215,
};

DANNYLAB.GameScene = function () {
  Phaser.Scene.call(this, { key: 'DANNYLAB_Game' });
};
DANNYLAB.GameScene.prototype = Object.create(Phaser.Scene.prototype);
DANNYLAB.GameScene.prototype.constructor = DANNYLAB.GameScene;
var GP = DANNYLAB.GameScene.prototype;

GP.create = function (data) {
  var GEO = DANNYLAB.GEO, CONFIG = DANNYLAB.CONFIG;
  this.mode = (data && data.mode) || this.registry.get('mode') || 'endless';
  this.lang = this.registry.get('lang');
  this.audio = this.registry.get('audio');

  // run state
  this.elements = [];
  this.combo = 0;
  this.lastMergeAt = -9999;
  this.score = 0;
  this.best = DANNYLAB.store.getBest();
  this.runDiscovered = {};
  this.dropCooling = false;
  this.paused = false;
  this.gameOver = false;
  this.overflowAccum = 0;
  this.scorePool = [];

  this.lab = DANNYLAB.buildLab(this, { dust: 14 });
  this.buildBeaker();
  this.buildHUD();
  this.buildTweezers();

  // gentle gravity; the beaker walls contain everything
  this.matter.world.setGravity(0, 1.0);

  // ---- collision merge handler (double-merge guarded, Brief §12) ----
  // We only CLAIM pairs here (set consumed) and queue them; the actual
  // destroy/spawn happens in afterupdate so we never mutate the Matter
  // world mid-step (which corrupts the solver).
  var self = this;
  this.pending = [];
  this.matter.world.on('collisionstart', function (event) {
    if (self.paused || self.gameOver) return;
    for (var i = 0; i < event.pairs.length; i++) {
      var pair = event.pairs[i];
      var a = pair.bodyA.gameObject, b = pair.bodyB.gameObject;
      if (a && a.tier != null) self.squash(a);       // impact squash (visual only)
      if (b && b.tier != null) self.squash(b);
      if (!a || !b) continue;                         // wall
      if (a.tier == null || b.tier == null) continue;
      if (a.consumed || b.consumed) continue;         // already claimed
      if (a.tier !== b.tier) continue;                // twins only
      if (a.tier >= DANNYLAB.MAX_TIER) {              // both Uranium
        if (DANNYLAB.FISSION_ENABLED) { a.consumed = b.consumed = true; self.pending.push({ kind: 'fission', a: a, b: b }); }
        continue;
      }
      a.consumed = b.consumed = true;
      self.pending.push({ kind: 'merge', a: a, b: b });
    }
  });
  // resolve claimed pairs safely, after the physics step completes
  this.matter.world.on('afterupdate', function () {
    if (!self.pending.length) return;
    var jobs = self.pending; self.pending = [];
    for (var i = 0; i < jobs.length; i++) {
      var j = jobs[i];
      if (!j.a.active || !j.b.active) continue;
      if (j.kind === 'fission') { self.triggerFission(j.a, j.b); continue; }
      var mx = (j.a.x + j.b.x) / 2, my = (j.a.y + j.b.y) / 2, tier = j.a.tier;
      self.mergeBurst(mx, my, tier);
      self.destroyElement(j.a); self.destroyElement(j.b);
      var merged = self.spawnElement(tier + 1, mx, my, { fromMerge: true });
      self.onMerge(merged);
    }
  });

  // ---- input: tweezers follow pointer; tap drops ----
  this.input.on('pointermove', function (p) { self.pointerX = p.x; });
  this.input.on('pointerdown', function (p) {
    if (self.audio) self.audio.resume();
    if (self.paused || self.gameOver) return;
    if (p.y < GEO.dropY - 40) return;     // tap near top bar ignored (pause btn handles itself)
    self.tryDrop(p.x);
  });

  this.nextTier = DANNYLAB.pickDroppableTier();
  this.setTweezerPreview(this.nextTier);
  this.pointerX = GEO.W / 2;

  this.events.on('shutdown', function () {
    if (self.matter && self.matter.world) {
      self.matter.world.off('collisionstart');
      self.matter.world.off('afterupdate');
    }
  });
};

// ---------- beaker (Brief §12: 3 static bodies + layered glass art) ----------
GP.buildBeaker = function () {
  var GEO = DANNYLAB.GEO;
  var wallH = GEO.floorTop - GEO.yRim;
  // static bodies (invisible)
  this.matter.add.rectangle(GEO.bx0 - GEO.wall / 2, GEO.yRim + wallH / 2, GEO.wall, wallH, { isStatic: true, friction: 0.4 });
  this.matter.add.rectangle(GEO.bx1 + GEO.wall / 2, GEO.yRim + wallH / 2, GEO.wall, wallH, { isStatic: true, friction: 0.4 });
  this.matter.add.rectangle((GEO.bx0 + GEO.bx1) / 2, GEO.floorTop + GEO.wall / 2,
    (GEO.bx1 - GEO.bx0) + GEO.wall * 2, GEO.wall, { isStatic: true, friction: 0.5 });

  // back glass (behind elements)
  var back = this.add.graphics().setDepth(-5);
  back.fillStyle(0x9fd8ff, 0.06);
  back.fillRoundedRect(GEO.bx0, GEO.yRim, GEO.bx1 - GEO.bx0, GEO.floorTop - GEO.yRim, { tl: 6, tr: 6, bl: 26, br: 26 });

  // front glass overlay (rim highlight, sheen, ticks) — translucent
  var f = this.add.graphics().setDepth(20);
  // neon glass edge (wide soft pass under a crisp line)
  f.lineStyle(9, 0x4fd9ff, 0.16);
  f.beginPath();
  f.moveTo(GEO.bx0, GEO.yRim); f.lineTo(GEO.bx0, GEO.floorTop);
  f.lineTo(GEO.bx1, GEO.floorTop); f.lineTo(GEO.bx1, GEO.yRim);
  f.strokePath();
  f.lineStyle(4, 0xbfefff, 0.6);
  f.beginPath();
  f.moveTo(GEO.bx0, GEO.yRim); f.lineTo(GEO.bx0, GEO.floorTop);
  f.lineTo(GEO.bx1, GEO.floorTop); f.lineTo(GEO.bx1, GEO.yRim);
  f.strokePath();
  // rim ellipse highlight + neon halo
  f.lineStyle(8, 0x4fd9ff, 0.18); f.strokeEllipse((GEO.bx0 + GEO.bx1) / 2, GEO.yRim, (GEO.bx1 - GEO.bx0), 26);
  f.lineStyle(4, 0xeaffff, 0.75); f.strokeEllipse((GEO.bx0 + GEO.bx1) / 2, GEO.yRim, (GEO.bx1 - GEO.bx0), 26);
  // vertical sheen stripe
  f.fillStyle(0xffffff, 0.08);
  f.fillRoundedRect(GEO.bx0 + 14, GEO.yRim + 18, 16, GEO.floorTop - GEO.yRim - 40, 8);
  // measurement ticks
  f.lineStyle(3, 0xcdeeff, 0.3);
  for (var ty = GEO.yRim + 70; ty < GEO.floorTop - 20; ty += 70) {
    f.beginPath(); f.moveTo(GEO.bx1 - 28, ty); f.lineTo(GEO.bx1 - 8, ty); f.strokePath();
  }

  // fill line marker (Endless only)
  if (this.mode === 'endless') {
    var fl = this.add.graphics().setDepth(19);
    fl.lineStyle(2, 0xff6b8b, 0.5);
    fl.beginPath();
    for (var x = GEO.bx0; x < GEO.bx1; x += 16) { fl.moveTo(x, GEO.fillLineY); fl.lineTo(x + 8, GEO.fillLineY); }
    fl.strokePath();
    this.fillFlash = fl;
  }
};

// ---------- HUD: side-mounted lab readout (Brief §7) ----------
GP.buildHUD = function () {
  var GEO = DANNYLAB.GEO, UI = DANNYLAB.UI, lang = this.lang;
  // metallic lab readout gauge top-left, kept clear of the beaker mouth
  var g = this.add.graphics().setDepth(40);
  g.fillStyle(0x4fd9ff, 0.10); g.fillRoundedRect(11, 67, 186, 102, 16);          // neon halo
  g.fillStyle(0x46546f, 1);    g.fillRoundedRect(14, 70, 180, 96, 14);            // metal plate
  g.fillStyle(0x586784, 1);    g.fillRoundedRect(14, 70, 180, 30, { tl: 14, tr: 14, bl: 0, br: 0 });
  g.lineStyle(2.5, 0x4fd9ff, 0.8); g.strokeRoundedRect(14, 70, 180, 96, 14);      // neon edge
  g.fillStyle(0x0a1024, 1);    g.fillRoundedRect(24, 80, 160, 34, 8);             // digit wells
  g.fillStyle(0x0a1024, 1);    g.fillRoundedRect(24, 122, 160, 34, 8);
  g.lineStyle(1, 0x4fd9ff, 0.3); g.strokeRoundedRect(24, 80, 160, 34, 8); g.strokeRoundedRect(24, 122, 160, 34, 8);

  this.add.text(30, 80, DANNYLAB.t('score', lang).toUpperCase(), {
    fontFamily: UI.FONT, fontSize: '12px', color: '#8fe6ff', fontStyle: 'bold',
  }).setDepth(41);
  this.scoreText = this.add.text(176, 86, '0', {
    fontFamily: UI.FONT, fontSize: '26px', color: '#eafffb', fontStyle: 'bold',
  }).setOrigin(1, 0).setDepth(41);
  this.scoreText.setShadow(0, 0, '#4fd9ff', 8);
  this.add.text(30, 122, DANNYLAB.t('best', lang).toUpperCase(), {
    fontFamily: UI.FONT, fontSize: '12px', color: '#8fe6ff', fontStyle: 'bold',
  }).setDepth(41);
  this.bestText = this.add.text(176, 128, String(this.best), {
    fontFamily: UI.FONT, fontSize: '26px', color: '#FBD38D', fontStyle: 'bold',
  }).setOrigin(1, 0).setDepth(41);
  this.bestText.setShadow(0, 0, '#e0a020', 8);

  // mode badge (neon)
  var mb = this.add.text(GEO.W / 2, 96, DANNYLAB.t(this.mode, lang).toUpperCase(), {
    fontFamily: UI.FONT, fontSize: '16px', color: '#7CFF6B', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(41);
  mb.setShadow(0, 0, '#7CFF6B', 10);

  // pause button (top-right corner)
  var self = this;
  var pb = UI.button(this, GEO.W - 52, 96, 64, 56, '⏸', function () {
    self.openPause();
  }, { fill: 0x46506e, fontSize: 26 });
  pb.setDepth(45);
};

// ---------- tweezers (Brief §10.5) ----------
GP.buildTweezers = function () {
  var GEO = DANNYLAB.GEO;
  var c = this.add.container(GEO.W / 2, 60).setDepth(30);
  var g = this.add.graphics();
  // draw tongs hanging down to dropY
  this.tweezerG = g;
  c.add(g);
  // gripped preview element
  this.gripPreview = this.add.image(0, GEO.dropY - 60, 'el_ball_1').setScale(0.5);
  c.add(this.gripPreview);
  this.tweezers = c;
  this.drawTweezers(false);
};

GP.drawTweezers = function (open) {
  var GEO = DANNYLAB.GEO, g = this.tweezerG;
  g.clear();
  var spread = open ? 26 : 14;
  var topY = -50, tipY = GEO.dropY - 60;
  g.lineStyle(7, 0x9aa6bf, 1);
  // left arm
  g.beginPath(); g.moveTo(-6, topY); g.lineTo(-spread, tipY); g.strokePath();
  // right arm
  g.beginPath(); g.moveTo(6, topY); g.lineTo(spread, tipY); g.strokePath();
  // tips
  g.fillStyle(0xcfd8ea, 1);
  g.fillCircle(-spread, tipY, 4); g.fillCircle(spread, tipY, 4);
  // hinge
  g.fillStyle(0x6b768f, 1); g.fillCircle(0, topY, 9);
  g.fillStyle(0xcfd8ea, 1); g.fillCircle(0, topY, 4);
};

GP.setTweezerPreview = function (tier) {
  this.gripPreview.setTexture('el_ball_' + tier);
  // normalize so every previewed element reads the same size in the tongs
  var tex = this.textures.get('el_ball_' + tier).getSourceImage();
  this.gripPreview.setScale(46 / tex.width);
};

// ---------- drop ----------
GP.tryDrop = function (px) {
  if (this.dropCooling) return;
  var GEO = DANNYLAB.GEO;
  var cfg = DANNYLAB.tierCfg(this.nextTier);
  var x = Phaser.Math.Clamp(px, GEO.bx0 + cfg.radius + 2, GEO.bx1 - cfg.radius - 2);
  var self = this;

  // anticipation: quiver, then plink open + release
  this.drawTweezers(false);
  this.tweens.add({
    targets: this.tweezers, x: x, duration: 90, ease: 'Quad.out',
    onComplete: function () {
      self.tweens.add({
        targets: self.gripPreview, scaleX: self.gripPreview.scaleX * 0.85, scaleY: self.gripPreview.scaleY * 1.1,
        duration: 60, yoyo: true,
        onYoyo: function () {
          self.drawTweezers(true);
          self.gripPreview.setVisible(false);
          if (self.audio) self.audio.drop();
          self.spawnElement(self.nextTier, x, GEO.dropY, { dropped: true });
        },
        onComplete: function () { self.drawTweezers(false); }
      });
    }
  });

  this.dropCooling = true;
  this.time.delayedCall(DANNYLAB.CONFIG.dropCooldownMs, function () {
    self.dropCooling = false;
    self.nextTier = DANNYLAB.pickDroppableTier();
    self.setTweezerPreview(self.nextTier);
    self.gripPreview.setVisible(true);
  });
};

// ---------- spawn an element ----------
GP.spawnElement = function (tier, x, y, opts) {
  opts = opts || {};
  var cfg = DANNYLAB.tierCfg(tier);
  var UI = DANNYLAB.UI;

  var shadow = this.add.image(0, cfg.radius * 0.78, 'el_shadow').setAlpha(0.5);
  shadow.setDisplaySize(cfg.radius * 2.1, cfg.radius * 1.2);
  var glow = this.add.image(0, 0, 'el_glow').setTint(cfg.color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
  glow.setDisplaySize(cfg.radius * 3, cfg.radius * 3);
  var ball = this.add.image(0, 0, 'el_ball_' + tier);
  var sym = this.add.text(0, cfg.radius * 0.62, cfg.sym, {
    fontFamily: UI.FONT, fontSize: Math.max(11, Math.round(cfg.radius * 0.42)) + 'px',
    color: '#10203a', fontStyle: 'bold',
  }).setOrigin(0.5).setAlpha(0.85);

  // Inner container holds the visuals; we scale THIS for squash/pop/idle.
  // The outer container carries the Matter body and is never scaled, so the
  // physics circle radius stays fixed (Brief §12).
  var inner = this.add.container(0, 0, [shadow, glow, ball, sym]);
  var c = this.add.container(x, y, [inner]);
  c.setDepth(0);
  this.matter.add.gameObject(c, {
    shape: { type: 'circle', radius: cfg.radius },
    restitution: DANNYLAB.CONFIG.restitution,
    friction: DANNYLAB.CONFIG.friction,
    frictionStatic: DANNYLAB.CONFIG.frictionStatic,
  });
  c.tier = tier;
  c.consumed = false;
  c.visual = inner;
  c.glow = glow;
  c.ball = ball;
  c.radius = cfg.radius;
  this.elements.push(c);

  // pop-in overshoot (visual only, body radius fixed)
  if (opts.fromMerge) {
    inner.setScale(0);
    this.tweens.add({ targets: inner, scale: 1.18, duration: 130, ease: 'Back.out',
      onComplete: () => { this.tweens.add({ targets: inner, scale: 1, duration: 90 }); this.startIdle(c); } });
  } else {
    inner.setScale(0.6);
    this.tweens.add({ targets: inner, scale: 1, duration: 120, ease: 'Back.out',
      onComplete: () => this.startIdle(c) });
  }

  this.handleDiscovery(tier, opts.fromMerge);
  this.signature(c, tier);
  return c;
};

// idle breathing jiggle once an element settles (Brief §10.2)
GP.startIdle = function (c) {
  if (!c.active || !c.visual) return;
  c.idleTween = this.tweens.add({
    targets: c.visual, scaleX: 1.03, scaleY: 0.97, duration: 1100 + Math.random() * 600,
    yoyo: true, repeat: -1, ease: 'Sine.inOut',
  });
};

// squash & stretch on a hard impact (visual scale only, Brief §12)
GP.squash = function (c) {
  if (!c.active || c.consumed || !c.visual) return;
  var sp = c.body ? c.body.speed : 0;
  if (sp < 2.2) return;
  if (c._squashing) return;
  c._squashing = true;
  if (c.idleTween) c.idleTween.pause();
  this.tweens.add({
    targets: c.visual, scaleX: 1.18, scaleY: 0.84, duration: 70, yoyo: true, ease: 'Quad.out',
    onComplete: function () {
      c._squashing = false;
      if (c.active && c.idleTween) c.idleTween.resume();
    }
  });
};

GP.destroyElement = function (c) {
  if (!c || !c.active) return;
  var idx = this.elements.indexOf(c);
  if (idx !== -1) this.elements.splice(idx, 1);
  if (c.idleTween) { c.idleTween.stop(); c.idleTween = null; }
  if (c.visual) this.tweens.killTweensOf(c.visual);
  this.tweens.killTweensOf(c.glow);
  if (c.body) this.matter.world.remove(c.body);
  c.destroy();
};

// ---------- merge scoring + combo (Brief §4) ----------
GP.onMerge = function (merged) {
  var createdTier = merged.tier;
  this.combo += 1;                                   // n-th merge in this chain
  var base = DANNYLAB.CONFIG.tierPoints[createdTier] || 0;
  var pts = base * this.combo;
  this.addScore(pts, merged.x, merged.y);
  this.lastMergeAt = this.time.now;

  // audio: pop pitched by tier, plus cascade sparkle on 2nd+ merge
  if (this.audio) {
    this.audio.merge(createdTier);
    if (this.combo >= 2) this.audio.cascade(this.combo);
  }

  // reaction toasts (kept un-noisy)
  if (this.combo === 3) this.toast(DANNYLAB.t('toast_cascade', this.lang));
  else if (this.combo === 6) this.toast(DANNYLAB.t('toast_bigcascade', this.lang));
  if (createdTier === DANNYLAB.MAX_TIER) this.toast(DANNYLAB.t('toast_uranium', this.lang), 0x7CFF6B);
};

GP.addScore = function (pts, x, y) {
  this.score += pts;
  this.scoreText.setText(String(this.score));
  this.tweens.add({ targets: this.scoreText, scale: 1.25, duration: 80, yoyo: true });
  if (this.score > this.best) {
    this.best = this.score;
    this.bestText.setText(String(this.best));
  }
  if (pts > 0 && x != null) this.scorePop(x, y, '+' + pts);
};

// pooled "+N" pop (Brief §12 perf)
GP.scorePop = function (x, y, label) {
  var t = this.scorePool.pop();
  if (!t) {
    t = this.add.text(0, 0, '', { fontFamily: DANNYLAB.UI.FONT, fontSize: '24px', color: '#fff5c2', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(35);
    t.setShadow(0, 2, 'rgba(0,0,0,0.4)', 3);
  }
  t.setText(label).setPosition(x, y).setAlpha(1).setScale(1).setActive(true).setVisible(true);
  var self = this;
  this.tweens.add({
    targets: t, y: y - 56, alpha: 0, scale: 1.2, duration: 700, ease: 'Quad.out',
    onComplete: function () { t.setVisible(false).setActive(false); self.scorePool.push(t); }
  });
};

// ---------- discovery: first-ever (+50) and first-this-run (+25) ----------
GP.handleDiscovery = function (tier, fromMerge) {
  var sym = DANNYLAB.tierCfg(tier).sym;
  var firstEver = !DANNYLAB.store.isDiscovered(sym);
  var firstThisRun = !this.runDiscovered[sym];
  this.runDiscovered[sym] = true;
  var bonus = 0;
  if (firstEver) { DANNYLAB.store.addDiscovered(sym); bonus += DANNYLAB.CONFIG.discoverBonusFirstEver; }
  if (firstThisRun) bonus += DANNYLAB.CONFIG.discoverBonusThisRun;
  if (bonus > 0) this.score += bonus, this.scoreText.setText(String(this.score));
  if (this.score > this.best) { this.best = this.score; this.bestText.setText(String(this.best)); }

  // "Danny's Lab Notes" card only on the very first ever creation
  if (firstEver) {
    if (this.audio) this.audio.discovery();
    this.queueDiscovery(sym);
  }
};

// queue discovery cards so a cascade making several new elements doesn't
// try to launch two Discovery scenes at once.
GP.queueDiscovery = function (sym) {
  this._discoQ = this._discoQ || [];
  this._discoQ.push(sym);
  if (!this._discoActive) this.showNextDiscovery();
};
GP.showNextDiscovery = function () {
  if (!this._discoQ || !this._discoQ.length) { this._discoActive = false; return; }
  this._discoActive = true;
  var sym = this._discoQ.shift();
  this.scene.launch('DANNYLAB_Discovery', { parent: 'DANNYLAB_Game', sym: sym, lang: this.lang });
};

// ---------- signature birth effects (Brief §3 / §10.4) ----------
GP.signature = function (c, tier) {
  var cfg = DANNYLAB.tierCfg(tier), x = c.x, y = c.y, A = this.audio;
  switch (tier) {
    case 1: this.burst(x, y, 0xffffff, 4, { speed: 40, scale: 0.3, life: 300 }); break;
    case 2: this.burst(x, y, 0xFBD38D, 6, { speed: 50, scale: 0.4, life: 400 }); break;
    case 3: this.burst(x, y, 0xffffff, 8, { tex: 'p_spark', speed: 70, scale: 0.5, life: 450 }); break;
    case 4: this.burst(x, y, 0x4FD1C5, 8, { speed: 80, scale: 0.5, life: 450 }); break;
    case 5: this.neonBuzz(c); break;
    case 6: this.burst(x, y, 0xffffff, 14, { tex: 'p_bubble', speed: 90, scale: 0.6, life: 600 }); if (A) A.fizz(); break;
    case 7: this.burst(x, y, 0x8a6a4a, 10, { speed: 60, scale: 0.4, life: 600 }); if (A) A.magnet(); break;
    case 8: this.burst(x, y, 0xFFE680, 16, { tex: 'p_spark', speed: 110, scale: 0.6, life: 650 }); if (A) A.coin(); break;
    case 9: this.uraniumBirth(c); break;
  }
  if (tier >= 6) this.cameras.main.shake(160, 0.004 + tier * 0.0006);
};

GP.neonBuzz = function (c) {
  var self = this;
  var n = 0;
  var iv = this.time.addEvent({ delay: 70, repeat: 4, callback: function () {
    if (!c.active) return;
    c.glow.setAlpha(n % 2 ? 0.9 : 0.3); n++;
  }});
  this.burst(c.x, c.y, 0xF687B3, 8, { speed: 70, scale: 0.5, life: 450 });
};

GP.uraniumBirth = function (c) {
  if (this.audio) this.audio.geiger();
  this.burst(c.x, c.y, 0x7CFF6B, 20, { tex: 'p_spark', speed: 130, scale: 0.7, life: 800 });
  // slow radioactive pulse on the glow
  c.glow.setAlpha(0.6);
  this.tweens.add({ targets: c.glow, alpha: 0.95, scaleX: c.glow.scaleX * 1.18, scaleY: c.glow.scaleY * 1.18,
    duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  this.cameras.main.shake(260, 0.006);
};

// generic particle burst (short-lived emitter, auto-cleans)
GP.burst = function (x, y, tint, count, opts) {
  opts = opts || {};
  var em = this.add.particles(x, y, opts.tex || 'p_dot', {
    speed: { min: (opts.speed || 60) * 0.4, max: opts.speed || 60 },
    angle: { min: 0, max: 360 },
    scale: { start: opts.scale || 0.5, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: opts.life || 450,
    quantity: count,
    tint: tint,
    blendMode: opts.blend || 'ADD',
    emitting: false,
  });
  em.setDepth(25);
  em.explode(count);
  this.time.delayedCall((opts.life || 450) + 120, function () { em.destroy(); });
};

// twin-implosion flash at the merge contact point (Brief §10.4)
GP.mergeBurst = function (x, y, fromTier) {
  var col = DANNYLAB.tierCfg(fromTier + 1).color;
  this.burst(x, y, col, 10, { speed: 90, scale: 0.5, life: 380 });
  var flash = this.add.image(x, y, 'el_glow').setTint(0xffffff).setBlendMode('ADD').setDepth(26).setScale(0.4);
  this.tweens.add({ targets: flash, scale: 1.4, alpha: 0, duration: 240, onComplete: function () { flash.destroy(); } });
  // expanding neon ring
  var ring = this.add.image(x, y, 'p_ring').setTint(col).setBlendMode('ADD').setDepth(26).setScale(0.3).setAlpha(0.9);
  this.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 320, ease: 'Cubic.out',
    onComplete: function () { ring.destroy(); } });
};

// ---------- Fission (Brief §6) ----------
GP.triggerFission = function (a, b) {
  var GEO = DANNYLAB.GEO, CONFIG = DANNYLAB.CONFIG;
  var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
  if (this.audio) { this.audio.fission(); this.audio.duck(); }
  this.cameras.main.shake(420, 0.012);
  this.cameras.main.flash(180, 180, 255, 160);

  // clear both uraniums + small elements (tiers ≤ cap) within radius
  var cleared = 0;
  var victims = [a, b];
  for (var i = this.elements.length - 1; i >= 0; i--) {
    var e = this.elements[i];
    if (e === a || e === b) continue;
    if (e.tier > CONFIG.fissionClearsTiersUpTo) continue;
    var d = Phaser.Math.Distance.Between(cx, cy, e.x, e.y);
    if (d <= CONFIG.fissionRadius) victims.push(e);
  }
  for (var k = 0; k < victims.length; k++) {
    var v = victims[k];
    this.burst(v.x, v.y, 0x7CFF6B, 8, { tex: 'p_spark', speed: 120, scale: 0.6, life: 600 });
    if (v !== a && v !== b) cleared++;
    this.destroyElement(v);
  }
  // big central sparkle shower
  this.burst(cx, cy, 0xeaffea, 30, { tex: 'p_spark', speed: 180, scale: 0.8, life: 800 });

  var pts = CONFIG.fissionBonus + cleared * CONFIG.fissionPerAtom;
  this.addScore(pts, cx, cy);
  this.toast(DANNYLAB.t('toast_fission', this.lang), 0xff9b5b);
};

// ---------- reaction toasts (brief, auto-dismiss ~1s) ----------
GP.toast = function (text, color) {
  var GEO = DANNYLAB.GEO;
  var y = GEO.dropY + 30;
  var t = this.add.text(GEO.W / 2, y, text, {
    fontFamily: DANNYLAB.UI.FONT, fontSize: '30px', color: '#ffffff', fontStyle: 'bold',
    stroke: '#0c1430', strokeThickness: 6, align: 'center',
  }).setOrigin(0.5).setDepth(48).setScale(0.4);
  if (color) t.setColor('#' + color.toString(16).padStart(6, '0'));
  this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.out' });
  this.tweens.add({ targets: t, alpha: 0, y: y - 30, delay: 850, duration: 350,
    onComplete: function () { t.destroy(); } });
};

// ---------- pause ----------
GP.openPause = function () {
  if (this.gameOver) return;
  this.paused = true;
  this.matter.world.enabled = false;
  // clear any in-flight Lab Notes card so it doesn't sit frozen over Pause
  this._discoQ = [];
  if (this.scene.isActive('DANNYLAB_Discovery')) this.scene.stop('DANNYLAB_Discovery');
  this.scene.launch('DANNYLAB_Pause', { parent: 'DANNYLAB_Game' });
  this.scene.pause();
};
GP.resumeFromOverlay = function () {
  this.paused = false;
  this.matter.world.enabled = true;
};

// ---------- update loop ----------
GP.update = function (time, delta) {
  if (this.lab) this.lab.update(delta);
  if (this.paused || this.gameOver) return;

  // tweezers follow pointer along the top (between drops)
  if (!this.dropCooling && this.pointerX != null) {
    var GEO = DANNYLAB.GEO;
    var cfg = DANNYLAB.tierCfg(this.nextTier);
    var tx = Phaser.Math.Clamp(this.pointerX, GEO.bx0 + cfg.radius, GEO.bx1 - cfg.radius);
    this.tweezers.x += (tx - this.tweezers.x) * 0.25;
  }

  // combo reset when the beaker settles
  if (this.combo > 0 && (time - this.lastMergeAt) > DANNYLAB.CONFIG.comboResetMs) {
    this.combo = 0;
  }

  // overflow check (Endless only) — settled element breaching the fill line
  if (this.mode === 'endless') {
    var breach = false;
    for (var i = 0; i < this.elements.length; i++) {
      var e = this.elements[i];
      if (e.consumed || !e.body) continue;
      if (e.body.speed < 0.6 && (e.y - e.radius) < DANNYLAB.GEO.fillLineY) { breach = true; break; }
    }
    if (breach) {
      this.overflowAccum += delta;
      if (this.fillFlash) this.fillFlash.setAlpha(0.4 + 0.5 * Math.abs(Math.sin(time / 120)));
      if (this.overflowAccum >= DANNYLAB.CONFIG.overflowGraceMs) this.endGame();
    } else {
      this.overflowAccum = 0;
      if (this.fillFlash) this.fillFlash.setAlpha(1);
    }
  }
};

// ---------- game over ----------
GP.endGame = function () {
  if (this.gameOver) return;
  this.gameOver = true;
  this.paused = true;
  // dismiss any in-flight discovery cards so they don't sit over Game Over
  this._discoQ = [];
  if (this.scene.isActive('DANNYLAB_Discovery')) this.scene.stop('DANNYLAB_Discovery');
  if (this.audio) this.audio.aww();
  var newBest = this.score >= this.best ? this.score : this.best;
  DANNYLAB.store.setBest(newBest);
  // gentle fizzle on the top elements
  for (var i = 0; i < this.elements.length; i++) {
    var e = this.elements[i];
    if ((e.y - e.radius) < DANNYLAB.GEO.fillLineY + 30)
      this.burst(e.x, e.y, 0x9fd8ff, 6, { tex: 'p_bubble', speed: 60, scale: 0.5, life: 700 });
  }
  this.matter.world.enabled = false;
  var self = this;
  this.time.delayedCall(500, function () {
    self.scene.launch('DANNYLAB_GameOver', {
      parent: 'DANNYLAB_Game', score: self.score, best: newBest, lang: self.lang,
    });
    self.scene.pause();
  });
};
