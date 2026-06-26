// game.js — DANNYLAB_Game. The core merge loop (Brief §2, §12). Tweezers
// drop tiers 1-3, twins fuse into the next tier at the contact point,
// cascades chain, overflow ends Endless, two Uraniums trigger Fission.
window.DANNYLAB = window.DANNYLAB || {};

// ---- beaker geometry (portrait 540 x 960) ----
// Beaker hugs the LEFT edge; the right strip (x > ~390) is the stats column,
// and the top band (above the rim) is reserved for the Lab Notes card.
DANNYLAB.GEO = {
  W: 540, H: 960,
  bx0: 32, bx1: 380,          // interior left/right (tube scooted to the left edge)
  wall: 24,
  yRim: 300, floorTop: 884,
  fillLineY: 336, dropY: 215,
};
// shared helper: horizontal centre of the beaker (for tweezers / toasts / notes)
DANNYLAB.beakerCx = function () { return (DANNYLAB.GEO.bx0 + DANNYLAB.GEO.bx1) / 2; };

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

  // ---- input: drag to aim along the top, lift to drop (precise on touch) ----
  // Touch can't hover, so we let the player place a finger anywhere in the
  // beaker, drag left/right to line up the column (tweezers + a drop guide
  // track the finger exactly), and lift to release. A simple tap = aim+lift
  // in the same spot, so it still drops right where you tapped.
  this.aiming = false;
  this.input.on('pointerdown', function (p) {
    if (self.audio) self.audio.resume();
    // tapping the Lab Notes ✕ closes the card (checked first — it sits up in
    // the top band that drops otherwise ignore)
    if (self._discoCard && Phaser.Math.Distance.Between(p.x, p.y, self._discoX, self._discoY) < 46) {
      self.dismissDiscovery(); return;
    }
    if (self.paused || self.gameOver || self.dropCooling) return;
    if (p.y < 176) return;                 // ignore the HUD / pause-button band up top
    self.beginAim(p.x);
  });
  this.input.on('pointermove', function (p) {
    self.pointerX = p.x;
    if (self.aiming) self.updateAim(p.x);
  });
  this.input.on('pointerup', function () { self.commitDrop(); });
  this.input.on('pointerupoutside', function () { self.commitDrop(); });

  this.nextTier = DANNYLAB.pickDroppableTier();
  this.setTweezerPreview(this.nextTier);
  this.pointerX = DANNYLAB.beakerCx();

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

// ---------- HUD: stats column on the RIGHT, beside the beaker ----------
GP.buildHUD = function () {
  var GEO = DANNYLAB.GEO, UI = DANNYLAB.UI, lang = this.lang, self = this;
  var px = 400, pw = 132, py = 112, ph = 188, cx = px + pw / 2;

  var g = this.add.graphics().setDepth(40);
  g.fillStyle(0x4fd9ff, 0.10); g.fillRoundedRect(px - 3, py - 3, pw + 6, ph + 6, 16);     // neon halo
  g.fillStyle(0x46546f, 1);    g.fillRoundedRect(px, py, pw, ph, 14);                     // metal plate
  g.fillStyle(0x586784, 1);    g.fillRoundedRect(px, py, pw, 34, { tl: 14, tr: 14, bl: 0, br: 0 });
  g.lineStyle(2.5, 0x4fd9ff, 0.8); g.strokeRoundedRect(px, py, pw, ph, 14);               // neon edge
  g.fillStyle(0x0a1024, 1);    g.fillRoundedRect(px + 12, py + 64, pw - 24, 38, 8);       // score well
  g.fillStyle(0x0a1024, 1);    g.fillRoundedRect(px + 12, py + 132, pw - 24, 38, 8);      // best well
  g.lineStyle(1, 0x4fd9ff, 0.3);
  g.strokeRoundedRect(px + 12, py + 64, pw - 24, 38, 8);
  g.strokeRoundedRect(px + 12, py + 132, pw - 24, 38, 8);

  var mb = this.add.text(cx, py + 17, DANNYLAB.t(this.mode, lang).toUpperCase(), {
    fontFamily: UI.DISPLAY, fontSize: '15px', color: '#7CFF6B', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(41);
  mb.setShadow(0, 0, '#7CFF6B', 10);

  this.add.text(cx, py + 50, DANNYLAB.t('score', lang).toUpperCase(), {
    fontFamily: UI.DISPLAY, fontSize: '12px', color: '#8fe6ff', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(41);
  this.scoreText = this.add.text(cx, py + 82, '0', {
    fontFamily: UI.DISPLAY, fontSize: '26px', color: '#eafffb', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(41);
  this.scoreText.setShadow(0, 0, '#4fd9ff', 8);

  this.add.text(cx, py + 118, DANNYLAB.t('best', lang).toUpperCase(), {
    fontFamily: UI.DISPLAY, fontSize: '12px', color: '#8fe6ff', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(41);
  this.bestText = this.add.text(cx, py + 150, String(this.best), {
    fontFamily: UI.DISPLAY, fontSize: '26px', color: '#FBD38D', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(41);
  this.bestText.setShadow(0, 0, '#e0a020', 8);

  // pause button (top-right corner, above the stats column)
  var pb = UI.button(this, GEO.W - 44, 58, 64, 52, '||', function () {
    self.openPause();
  }, { fill: 0x46506e, fontSize: 24 });
  pb.setDepth(45);
};

// ---------- tweezers (Brief §10.5) ----------
GP.buildTweezers = function () {
  var GEO = DANNYLAB.GEO;
  var c = this.add.container(DANNYLAB.beakerCx(), 60).setDepth(30);
  var g = this.add.graphics();
  // draw tongs hanging down to dropY
  this.tweezerG = g;
  c.add(g);
  // gripped preview element
  this.gripPreview = this.add.image(0, GEO.dropY - 60, DANNYLAB.ballKey(this, 1)).setScale(0.5);
  c.add(this.gripPreview);
  this.tweezers = c;
  this.drawTweezers(false);

  // drop guide: a neon dashed line down the aimed column (shown while aiming)
  this.guide = this.add.graphics().setDepth(18).setVisible(false);
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
  var key = DANNYLAB.ballKey(this, tier);
  this.gripPreview.setTexture(key);
  // normalize so every previewed element reads the same size in the tongs
  // (px atoms only fill ~80% of their frame, so target a bit larger)
  var tex = this.textures.get(key).getSourceImage();
  this.gripPreview.setScale((DANNYLAB.isPxBall(this, tier) ? 58 : 46) / tex.width);
};

// ---------- aim + drop ----------
// clamp a desired x so the element stays fully inside the beaker walls
GP.clampDropX = function (x) {
  var GEO = DANNYLAB.GEO, cfg = DANNYLAB.tierCfg(this.nextTier);
  return Phaser.Math.Clamp(x, GEO.bx0 + cfg.radius + 2, GEO.bx1 - cfg.radius - 2);
};

GP.beginAim = function (x) {
  this.aiming = true;
  this.aimX = this.clampDropX(x);
  this.tweezers.x = this.aimX;        // snap the tongs straight under the finger
  this.drawTweezers(false);
  this.guide.setVisible(true);
  this.drawGuide();
};

GP.updateAim = function (x) {
  this.aimX = this.clampDropX(x);
  this.tweezers.x = this.aimX;        // track the finger exactly — no lag
  this.drawGuide();
};

GP.commitDrop = function () {
  if (!this.aiming) return;
  this.aiming = false;
  this.guide.setVisible(false);
  if (this.paused || this.gameOver) return;   // released during pause → cancel, don't drop
  this.doDrop(this.aimX);
};

// draw the neon dashed guide + landing marker down the aimed column
GP.drawGuide = function () {
  var GEO = DANNYLAB.GEO, g = this.guide, x = this.tweezers.x;
  var cfg = DANNYLAB.tierCfg(this.nextTier);
  g.clear();
  g.lineStyle(2, 0x7CFF6B, 0.55);
  for (var y = GEO.dropY + 12; y < GEO.floorTop - 4; y += 14) {
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 7); g.strokePath();
  }
  // footprint disc so you can see the exact column width you're committing to
  var fy = GEO.floorTop - cfg.radius - 2;
  g.fillStyle(0x7CFF6B, 0.10); g.fillCircle(x, fy, cfg.radius);
  g.lineStyle(2, 0x7CFF6B, 0.5); g.strokeCircle(x, fy, cfg.radius);
};

GP.doDrop = function (x) {
  var GEO = DANNYLAB.GEO, self = this;
  // plink the tongs open and release exactly at the aimed column
  this.drawTweezers(true);
  this.gripPreview.setVisible(false);
  if (this.audio) this.audio.drop();
  this.spawnElement(this.nextTier, x, GEO.dropY, { dropped: true });

  this.dropCooling = true;
  this.time.delayedCall(120, function () { self.drawTweezers(false); });
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

  var px = DANNYLAB.isPxBall(this, tier);

  var shadow = this.add.image(0, cfg.radius * 0.82, 'el_shadow').setAlpha(0.5);
  shadow.setDisplaySize(cfg.radius * 2.1, cfg.radius * 1.2);
  var glow = this.add.image(0, 0, 'el_glow').setTint(cfg.color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
  glow.setDisplaySize(cfg.radius * 3, cfg.radius * 3);
  var ball = this.add.image(0, 0, DANNYLAB.ballKey(this, tier));
  // PixelLab orbs fill ~80% of their frame; size so the orb matches the body.
  if (px) ball.setDisplaySize(cfg.radius * 2.55, cfg.radius * 2.55);

  var kids = [shadow, glow, ball];
  // element symbol as a little label near the bottom of the atom. White with
  // a dark outline so it reads on any colour (light orbs or dark), in the
  // pixel display font to match the art.
  var sym = this.add.text(0, cfg.radius * 0.58, cfg.sym, {
    fontFamily: UI.DISPLAY, fontSize: Math.max(12, Math.round(cfg.radius * 0.42)) + 'px',
    color: '#ffffff', fontStyle: 'bold',
    stroke: '#10203a', strokeThickness: Math.max(2, Math.round(cfg.radius * 0.07)),
  }).setOrigin(0.5).setAlpha(0.95);
  kids.push(sym);

  // Inner container holds the visuals; we scale THIS for squash/pop/idle.
  // The outer container carries the Matter body and is never scaled, so the
  // physics circle radius stays fixed (Brief §12).
  var inner = this.add.container(0, 0, kids);
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
  // a little dust puff when something lands hard (cheap juice)
  if (sp > 5) this.burst(c.x, c.y + c.radius * 0.65, 0xbfe3ff, 3, { tex: 'p_bubble', speed: 45, scale: 0.4, life: 360 });
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
  this.buildDiscoveryCard(this._discoQ.shift());
};

// Tear down any visible Lab Notes card + its timer, and reset the queue flag.
GP.clearDiscoveryCard = function () {
  if (this._discoAuto) { this._discoAuto.remove(false); this._discoAuto = null; }
  if (this._discoCard) { this.tweens.killTweensOf(this._discoCard); this._discoCard.destroy(); this._discoCard = null; }
  this._discoX = -999;
  this._discoActive = false;
};

// The "Danny's Lab Notes" card, rendered INSIDE the game scene (not a separate
// scene) so its ✕ shares the game's working input context. Yellow legal-pad
// note that slides in at the top, closable by ✕ or auto-dismiss.
GP.buildDiscoveryCard = function (sym) {
  var GEO = DANNYLAB.GEO, UI = DANNYLAB.UI, lang = this.lang, self = this;
  var tier = 1; DANNYLAB.CONFIG.tiers.forEach(function (c) { if (c.sym === sym) tier = c.t; });
  var name = DANNYLAB.elementName(sym, lang);

  var cx = DANNYLAB.beakerCx();
  var cardW = Math.min(376, GEO.bx1 - GEO.bx0 + 44), cardH = 168, restY = 116;
  var card = this.add.container(cx, -cardH - 20).setDepth(70).setAngle(-2.5);
  this._discoCard = card;

  var g = this.add.graphics();
  g.fillStyle(0x000000, 0.28); g.fillRoundedRect(-cardW / 2 + 6, -cardH / 2 + 10, cardW, cardH, 14);
  g.fillStyle(0xfde85a, 1);    g.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
  g.fillStyle(0xfbdf3e, 1);    g.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, 30, { tl: 14, tr: 14, bl: 0, br: 0 });
  g.lineStyle(1.5, 0x7fa8d8, 0.55);
  for (var ly = -cardH / 2 + 56; ly < cardH / 2 - 12; ly += 24) {
    g.beginPath(); g.moveTo(-cardW / 2 + 70, ly); g.lineTo(cardW / 2 - 18, ly); g.strokePath();
  }
  g.lineStyle(2, 0xe8506a, 0.8);
  g.beginPath(); g.moveTo(-cardW / 2 + 60, -cardH / 2 + 6); g.lineTo(-cardW / 2 + 60, cardH / 2 - 6); g.strokePath();
  g.fillStyle(0xcdb52e, 1);
  for (var hx = -cardW / 2 + 36; hx < cardW / 2 - 20; hx += 56) g.fillCircle(hx, -cardH / 2 + 15, 4);

  var header = this.add.text(-cardW / 2 + 70, -cardH / 2 + 15, DANNYLAB.t('notes_title', lang), {
    fontFamily: UI.FONT, fontSize: '17px', color: '#8a5a12', fontStyle: 'bold' }).setOrigin(0, 0.5);
  var intro = this.add.text(-cardW / 2 + 70, -cardH / 2 + 44, DANNYLAB.t('discovery_intro', lang, { element: name }), {
    fontFamily: UI.FONT, fontSize: '19px', color: '#5a3a08', fontStyle: 'bold', wordWrap: { width: cardW - 92 } }).setOrigin(0, 0);
  var fact = this.add.text(-cardW / 2 + 70, -cardH / 2 + 78, DANNYLAB.elementFact(sym, lang), {
    fontFamily: UI.FONT, fontSize: '15px', color: '#6a4a1a', wordWrap: { width: cardW - 92 } }).setOrigin(0, 0);
  var icon = this.add.image(-cardW / 2 + 32, 2, DANNYLAB.ballKey(this, tier)).setDisplaySize(52, 52);

  var cxp = cardW / 2 - 20, cyp = -cardH / 2 + 18;
  var closeBg = this.add.graphics();
  closeBg.fillStyle(0xe8506a, 1); closeBg.fillCircle(cxp, cyp, 15);
  closeBg.lineStyle(2, 0xffffff, 0.9); closeBg.strokeCircle(cxp, cyp, 15);
  var closeX = this.add.text(cxp, cyp, '✕', {
    fontFamily: UI.FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
  card.add([g, icon, header, intro, fact, closeBg, closeX]);

  // Remember the ✕'s real (rotated) world position. Rather than a Phaser
  // interactive object (which hit-tests unreliably inside a tilted container),
  // the game's own pointerdown handler checks taps against this point — that
  // input path is proven to work for dropping.
  var ang = Phaser.Math.DegToRad(-2.5);
  this._discoX = cx + (cxp * Math.cos(ang) - cyp * Math.sin(ang));
  this._discoY = restY + (cxp * Math.sin(ang) + cyp * Math.cos(ang));

  this.tweens.add({ targets: card, y: restY, duration: 420, ease: 'Back.out' });
  this._discoAuto = this.time.delayedCall(4200, function () { self.dismissDiscovery(); });
};

// close the current Lab Notes card (tapped ✕ or auto), then show any queued one
GP.dismissDiscovery = function () {
  if (!this._discoCard) return;
  var card = this._discoCard, self = this;
  this._discoCard = null; this._discoX = -999;
  if (this._discoAuto) { this._discoAuto.remove(false); this._discoAuto = null; }
  this.tweens.add({
    targets: card, y: -220, angle: -8, alpha: 0, duration: 240, ease: 'Quad.in',
    onComplete: function () { card.destroy(); self.showNextDiscovery(); }
  });
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
  var t = this.add.text(DANNYLAB.beakerCx(), y, text, {
    fontFamily: DANNYLAB.UI.DISPLAY, fontSize: '28px', color: '#ffffff', fontStyle: 'bold',
    stroke: '#0c1430', strokeThickness: 6, align: 'center',
    wordWrap: { width: GEO.bx1 - GEO.bx0 + 40 },
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
  this.clearDiscoveryCard();
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

  // desktop hover: ease the tongs toward the cursor between drops. While
  // aiming (finger down) the move handler positions them exactly, so skip.
  if (!this.dropCooling && !this.aiming && this.pointerX != null && this.input.activePointer.isDown === false) {
    var tx = this.clampDropX(this.pointerX);
    this.tweezers.x += (tx - this.tweezers.x) * 0.25;
  }

  // JUICE: elements glow only while moving, so they blaze as they drop and
  // while jostling, then fade the glow right out once they settle inside.
  // (Cheap per-frame alpha lerp; Uranium keeps its own radioactive pulse.)
  for (var gi = 0; gi < this.elements.length; gi++) {
    var e = this.elements[gi];
    if (!e.glow || e.tier === DANNYLAB.MAX_TIER || !e.body) continue;
    var sp = e.body.speed;
    var target = sp > 0.7 ? Math.min(1.0, 0.35 + sp * 0.06) : 0.0;   // settled = no glow
    e.glow.alpha += (target - e.glow.alpha) * 0.2;
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
  this.clearDiscoveryCard();
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
