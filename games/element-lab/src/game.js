// game.js — DANNYLAB_Game. The core merge loop (Brief §2, §12). Tweezers
// drop tiers 1-3, twins fuse into the next tier at the contact point,
// cascades chain, overflow ends Endless, two Uraniums trigger Fission.
window.DANNYLAB = window.DANNYLAB || {};

// ---- beaker geometry (portrait 540 x 960) ----
// The beaker fills most of the width (extended right so the Lab Charge bar sits
// snug on the far edge), lifted up a little so the SCORE/BEST strip tucks in
// underneath it. The top band (above the rim) holds the Lab Notes card.
DANNYLAB.GEO = {
  W: 540, H: 960,
  bx0: 32, bx1: 466,          // interior left/right (wide; bar lives just past bx1)
  wall: 24,
  yRim: 280, floorTop: 808,   // lifted; the band below floorTop holds the stats
  fillLineY: 316, dropY: 215,
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
  DANNYLAB.applyRes(this);
  var GEO = DANNYLAB.GEO, CONFIG = DANNYLAB.CONFIG;
  this.mode = (data && data.mode) || this.registry.get('mode') || 'endless';
  this.lang = this.registry.get('lang');
  this.audio = this.registry.get('audio');
  DANNYLAB.store.addGamePlayed();   // lifetime counter (drives some card unlocks)
  // pick a fresh "elements" gameplay track for this run (swaps off the intro)
  if (this.audio) this.audio.startMusic(DANNYLAB.pickGameTrack());

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

  // Lab Charge / progression (Addendum §3)
  this.labLevel = 0;
  this.labBonus = 1.0;
  this.charge = 0;
  this.chargeThreshold = CONFIG.chargeBaseThreshold;
  this.bestLevel = DANNYLAB.store.getBestLevel();
  // Mystery Sample (Addendum §2)
  this.nextIsMystery = false;
  this.dropsUntilMystery = this._rollMystery();
  this.glowBoostMerges = 0;    // Neon mystery: temporary score boost on next merges
  this._noOverflowUntil = 0;   // mystery overflow-immunity window (scene-clock based)
  this._mysteryDescTxt = null;

  // per-run recap + card celebrations (the delayed check catches "play your
  // first game"-style unlocks shortly after the run starts)
  this.runMaxCombo = 0;
  this.runNewCards = [];
  this.time.delayedCall(1300, this._checkCardUnlocks, [], this);

  // Phaser reuses the scene instance across runs, so clear any slow-mo state
  // left over from a previous run and guarantee this one starts at real-time.
  this._slowmo = false;
  if (this._slowTimer) { this._slowTimer.remove(false); this._slowTimer = null; }
  if (this.matter.world.engine && this.matter.world.engine.timing) this.matter.world.engine.timing.timeScale = 1;

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
      // Mystery Sample (tier -1) touching a real element → keyed effect
      if ((a.tier === -1) !== (b.tier === -1)) {
        var myst = a.tier === -1 ? a : b, tgt = a.tier === -1 ? b : a;
        if (tgt.tier >= 1) { myst.consumed = true; self.pending.push({ kind: 'mystery', myst: myst, tgt: tgt }); }
        continue;
      }
      if (a.tier < 1 || b.tier < 1) continue;         // ignore non-element pieces otherwise
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
      if (j.kind === 'mystery') { if (j.myst.active && j.tgt.active) self.triggerMystery(j.myst, j.tgt); continue; }
      if (!j.a.active || !j.b.active) continue;
      if (j.kind === 'fission') { self.triggerFission(j.a, j.b); continue; }
      self.doMerge(j.a, j.b);
    }
  });

  // ---- input: drag to aim along the top, lift to drop (precise on touch) ----
  // Touch can't hover, so we let the player place a finger anywhere in the
  // beaker, drag left/right to line up the column (tweezers + a drop guide
  // track the finger exactly), and lift to release. A simple tap = aim+lift
  // in the same spot, so it still drops right where you tapped.
  this.aiming = false;
  // NB: the camera is zoomed (supersampling), so use world coordinates.
  this.input.on('pointerdown', function (p) {
    if (self.audio) self.audio.resume();
    // tapping the Lab Notes ✕ closes the card (checked first — it sits up in
    // the top band that drops otherwise ignore)
    if (self._discoCard && Phaser.Math.Distance.Between(p.worldX, p.worldY, self._discoX, self._discoY) < 46) {
      self.dismissDiscovery(); return;
    }
    if (self.paused || self.gameOver || self.dropCooling) return;
    if (p.worldY < 176) return;            // ignore the HUD / pause-button band up top
    self.beginAim(p.worldX);
  });
  this.input.on('pointermove', function (p) {
    self.pointerX = p.worldX;
    if (self.aiming) self.updateAim(p.worldX);
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

// ---------- HUD: stats panel + right-edge Lab Charge meter ----------
GP.buildHUD = function () {
  var GEO = DANNYLAB.GEO, UI = DANNYLAB.UI, lang = this.lang, self = this;
  // ---- stats strip UNDER the beaker: mode tag + score + best, side by side ----
  var sx = GEO.bx0, sw = GEO.bx1 - GEO.bx0, sy = GEO.floorTop + 18, sh = 112;
  var scx = DANNYLAB.beakerCx();

  var g = this.add.graphics().setDepth(40);
  g.fillStyle(0x4fd9ff, 0.10); g.fillRoundedRect(sx - 3, sy - 3, sw + 6, sh + 6, 16);
  g.fillStyle(0x46546f, 1);    g.fillRoundedRect(sx, sy, sw, sh, 14);
  g.fillStyle(0x586784, 1);    g.fillRoundedRect(sx, sy, sw, 28, { tl: 14, tr: 14, bl: 0, br: 0 });
  g.lineStyle(2.5, 0x4fd9ff, 0.8); g.strokeRoundedRect(sx, sy, sw, sh, 14);
  var wy = sy + 42, wh = 50, ww = sw * 0.40, w1x = sx + sw * 0.06, w2x = sx + sw * 0.94 - ww;
  g.fillStyle(0x0a1024, 1);
  g.fillRoundedRect(w1x, wy, ww, wh, 7);
  g.fillRoundedRect(w2x, wy, ww, wh, 7);
  g.lineStyle(1, 0x4fd9ff, 0.3);
  g.strokeRoundedRect(w1x, wy, ww, wh, 7);
  g.strokeRoundedRect(w2x, wy, ww, wh, 7);

  var mb = this.add.text(scx, sy + 14, DANNYLAB.t(this.mode, lang).toUpperCase(), {
    fontFamily: UI.DISPLAY, fontSize: '14px', color: '#7CFF6B', fontStyle: 'bold' }).setOrigin(0.5).setDepth(41);
  mb.setShadow(0, 0, '#7CFF6B', 10);
  var c1 = w1x + ww / 2, c2 = w2x + ww / 2;
  this.add.text(c1, wy - 8, DANNYLAB.t('score', lang).toUpperCase(), {
    fontFamily: UI.DISPLAY, fontSize: '11px', color: '#8fe6ff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(41);
  this.scoreText = this.add.text(c1, wy + 27, '0', {
    fontFamily: UI.DISPLAY, fontSize: '24px', color: '#eafffb', fontStyle: 'bold' }).setOrigin(0.5).setDepth(41);
  this.scoreText.setShadow(0, 0, '#4fd9ff', 8);
  this.add.text(c2, wy - 8, DANNYLAB.t('best', lang).toUpperCase(), {
    fontFamily: UI.DISPLAY, fontSize: '11px', color: '#8fe6ff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(41);
  this.bestText = this.add.text(c2, wy + 27, String(this.best), {
    fontFamily: UI.DISPLAY, fontSize: '22px', color: '#FBD38D', fontStyle: 'bold' }).setOrigin(0.5).setDepth(41);
  this.bestText.setShadow(0, 0, '#e0a020', 8);

  // ---- Lab Charge meter (vertical, far right edge, snug beside the glass) ----
  var mx = 500, mw = 28, mTop = 160, mBot = GEO.floorTop, mH = mBot - mTop;
  this.chargeGeom = { mx: mx, mw: mw, mTop: mTop, mH: mH };
  var mg = this.add.graphics().setDepth(40);
  mg.fillStyle(0x4fd9ff, 0.12); mg.fillRoundedRect(mx - 4, mTop - 4, mw + 8, mH + 8, 12);
  mg.fillStyle(0x0a1024, 1);    mg.fillRoundedRect(mx, mTop, mw, mH, 9);
  mg.lineStyle(2, 0x4fd9ff, 0.7); mg.strokeRoundedRect(mx, mTop, mw, mH, 9);
  // tick marks
  mg.lineStyle(1, 0x4fd9ff, 0.25);
  for (var ty = mTop + mH / 5; ty < mBot; ty += mH / 5) mg.lineBetween(mx + 3, ty, mx + mw - 3, ty);
  this.chargeFill = this.add.graphics().setDepth(41);

  this.levelText = this.add.text(mx + mw / 2, mTop - 18, 'LV 0', {
    fontFamily: UI.DISPLAY, fontSize: '13px', color: '#7CFF6B', fontStyle: 'bold' }).setOrigin(0.5).setDepth(42);
  this.levelText.setShadow(0, 0, '#7CFF6B', 8);
  this.bonusText = this.add.text(mx + mw / 2, mBot + 14, 'x1.0', {
    fontFamily: UI.DISPLAY, fontSize: '13px', color: '#FBD38D', fontStyle: 'bold' }).setOrigin(0.5).setDepth(42);
  this.bonusText.setShadow(0, 0, '#e0a020', 8);
  this._drawCharge();

  // pause button (top-right corner)
  var pb = UI.button(this, GEO.W - 32, 48, 52, 44, '||', function () { self.openPause(); }, { fill: 0x46506e, fontSize: 22 });
  pb.setDepth(45);
};

// redraw the charge meter fill to the current level
GP._drawCharge = function () {
  if (!this.chargeFill) return;
  var c = this.chargeGeom, g = this.chargeFill;
  var f = Math.max(0, Math.min(1, this.charge / this.chargeThreshold));
  g.clear();
  if (f <= 0) return;
  var fh = c.mH * f, ytop = c.mTop + c.mH - fh;
  g.fillStyle(0x46b85e, 1);  g.fillRoundedRect(c.mx + 3, ytop, c.mw - 6, fh, 6);
  g.fillStyle(0x7CFF6B, 0.85); g.fillRoundedRect(c.mx + 3, ytop, c.mw - 6, Math.min(fh, fh * 0.5 + 6), 6);
  g.fillStyle(0xeaffff, 0.9); g.fillRect(c.mx + 4, ytop, c.mw - 8, 3);   // bright cap
};

// pick the drop index for the next Mystery Sample (N ± jitter)
GP._rollMystery = function () {
  var C = DANNYLAB.CONFIG;
  if (!C.mysteryEnabled) return Infinity;
  return C.mysteryEveryNDrops + Math.round((Math.random() * 2 - 1) * C.mysteryJitter);
};

// Lab Charge level-up: bump bonus, grow threshold, celebrate (Addendum §3)
GP.levelUp = function () {
  var C = DANNYLAB.CONFIG;
  this.labLevel += 1;
  this.labBonus = 1.0 + this.labLevel * C.labBonusStep;
  // clamp to >=1 so the charge-drain while-loop in addScore can never spin forever
  this.chargeThreshold = Math.max(1, Math.round(C.chargeBaseThreshold * Math.pow(C.chargeGrowth, this.labLevel)));
  if (this.labLevel > this.bestLevel) { this.bestLevel = this.labLevel; DANNYLAB.store.setBestLevel(this.bestLevel); }
  this.levelText.setText('LV ' + this.labLevel);
  this.bonusText.setText('x' + (Math.round(this.labBonus * 100) / 100));
  this.tweens.add({ targets: [this.levelText, this.bonusText], scale: 1.5, duration: 160, yoyo: true });
  this.toast(DANNYLAB.t('toast_levelup', this.lang), 0x7CFF6B);
  this.cameras.main.flash(240, 124, 255, 107);
  this.cameras.main.shake(220, 0.006);
  if (this.audio) { this.audio.chargeUp(); this.audio.hapticBig(); }
  var c = this.chargeGeom;
  this.burst(c.mx + c.mw / 2, c.mTop + c.mH * 0.5, 0x7CFF6B, 26, { tex: 'p_spark', speed: 180, scale: 0.7, life: 850 });
  if (C.chargeDropsMysteryOnLevelUp) this.dropsUntilMystery = 0;   // next piece is a mystery
  this._checkCardUnlocks();
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
  this.gripPreview = this.add.image(0, GEO.dropY - 60, DANNYLAB.iconKey(this, 1)).setScale(0.5);
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
  var key = DANNYLAB.iconKey(this, tier);
  this.gripPreview.setTexture(key);
  // normalize so every previewed element reads the same size in the tongs
  var tex = this.textures.get(key).getSourceImage();
  var f = DANNYLAB.useJelly(this) ? 56 : (DANNYLAB.isPxBall(this, tier) ? 58 : 46);
  this.gripPreview.setScale(f / tex.width).clearTint();
};

// show the glowing rainbow "?" mystery sample in the tongs
GP.setTweezerPreviewMystery = function () {
  this.gripPreview.setTexture('mystery_body');
  var tex = this.textures.get('mystery_body').getSourceImage();
  this.gripPreview.setScale(52 / tex.width).setTint(0xff66ff);
};

// the effective radius of the next piece (mystery has its own)
GP.nextRadius = function () {
  return this.nextIsMystery ? DANNYLAB.CONFIG.mysteryRadius : DANNYLAB.tierCfg(this.nextTier).radius;
};

// ---------- aim + drop ----------
// clamp a desired x so the element stays fully inside the beaker walls
GP.clampDropX = function (x) {
  var GEO = DANNYLAB.GEO, r = this.nextRadius();
  return Phaser.Math.Clamp(x, GEO.bx0 + r + 2, GEO.bx1 - r - 2);
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
  var GEO = DANNYLAB.GEO, g = this.guide, x = this.tweezers.x, r = this.nextRadius();
  g.clear();
  g.lineStyle(2, 0x7CFF6B, 0.55);
  for (var y = GEO.dropY + 12; y < GEO.floorTop - 4; y += 14) {
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 7); g.strokePath();
  }
  // footprint disc so you can see the exact column width you're committing to
  var fy = GEO.floorTop - r - 2;
  g.fillStyle(0x7CFF6B, 0.10); g.fillCircle(x, fy, r);
  g.lineStyle(2, 0x7CFF6B, 0.5); g.strokeCircle(x, fy, r);
};

GP.doDrop = function (x) {
  var GEO = DANNYLAB.GEO, self = this;
  // plink the tongs open and release exactly at the aimed column
  this.drawTweezers(true);
  this.gripPreview.setVisible(false);
  if (this.audio) this.audio.drop();
  if (this.nextIsMystery) { this.spawnMystery(x, GEO.dropY); this.nextIsMystery = false; }
  else this.spawnElement(this.nextTier, x, GEO.dropY, { dropped: true });

  this.dropCooling = true;
  this.dropsUntilMystery--;     // this drop counts toward the next mystery
  this.time.delayedCall(120, function () { self.drawTweezers(false); });
  this.time.delayedCall(DANNYLAB.CONFIG.dropCooldownMs, function () {
    self.dropCooling = false;
    self.prepareNextPiece();
    self.gripPreview.setVisible(true);
  });
};

// choose the upcoming tweezers piece — a Mystery Sample when due, else a tier
GP.prepareNextPiece = function () {
  var C = DANNYLAB.CONFIG;
  if (C.mysteryEnabled && this.dropsUntilMystery <= 0) {
    this.nextIsMystery = true;
    this.dropsUntilMystery = this._rollMystery();   // schedule the one after
    this.setTweezerPreviewMystery();
    if (this.audio) this.audio.mystery();
    this.toast(DANNYLAB.t('toast_mystery', this.lang), 0xff7be0);
  } else {
    this.nextIsMystery = false;
    this.nextTier = DANNYLAB.pickDroppableTier();
    this.setTweezerPreview(this.nextTier);
  }
};

// ---------- spawn an element ----------
GP.spawnElement = function (tier, x, y, opts) {
  opts = opts || {};
  var cfg = DANNYLAB.tierCfg(tier);
  var UI = DANNYLAB.UI;

  var px = DANNYLAB.isPxBall(this, tier);
  var jelly = DANNYLAB.useJelly(this);
  var r = cfg.radius;

  var shadow = this.add.image(0, r * 0.82, 'el_shadow').setAlpha(0.5);
  shadow.setDisplaySize(r * 2.1, r * 1.2);
  var glow = this.add.image(0, 0, 'el_glow').setTint(cfg.color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
  glow.setDisplaySize(r * 3, r * 3);

  var kids = [shadow, glow];
  var ball = null, face = null, bubbles = null;

  if (jelly) {
    // translucent gradient body
    ball = this.add.image(0, 0, 'jelly_body_' + tier);
    ball.setDisplaySize(r * 2.16, r * 2.16);
    ball.setAlpha(DANNYLAB.JELLY_ALPHA[tier] || 0.9);
    kids.push(ball);
    // per-element internal effect (sparks / bubbles / glint / flicker /
    // sweep / motes) — built + pushed into the visual layer
    var fxState = this._buildFX(kids, tier, r);
    bubbles = fxState.items;
    // chibi face on its own layer (parallax-floats in update)
    face = this.add.image(0, -r * 0.06, 'jelly_face_' + tier + '_rest');
    face.setDisplaySize(r * 1.55, r * 1.55);
    kids.push(face);
  } else {
    ball = this.add.image(0, 0, DANNYLAB.ballKey(this, tier));
    if (px) ball.setDisplaySize(r * 2.55, r * 2.55);
    kids.push(ball);
  }

  // element symbol label (white with dark outline, pixel font) on every skin
  var sym = this.add.text(0, r * 0.64, cfg.sym, {
    fontFamily: UI.DISPLAY, fontSize: Math.max(12, Math.round(r * 0.4)) + 'px',
    color: '#ffffff', fontStyle: 'bold',
    stroke: '#10203a', strokeThickness: Math.max(2, Math.round(r * 0.07)),
  }).setOrigin(0.5).setAlpha(0.92);
  kids.push(sym);

  // Inner container holds the visuals; we scale THIS for squash/pop/idle.
  // The outer container carries the Matter body and is never scaled, so the
  // physics circle radius stays fixed (Brief §12).
  var inner = this.add.container(0, 0, kids);
  var c = this.add.container(x, y, [inner]);
  c.setDepth(0);
  this.matter.add.gameObject(c, {
    shape: { type: 'circle', radius: r },
    restitution: DANNYLAB.CONFIG.restitution,
    friction: DANNYLAB.CONFIG.friction,
    frictionStatic: DANNYLAB.CONFIG.frictionStatic,
  });
  c.tier = tier;
  c.consumed = false;
  c.visual = inner;
  c.glow = glow;
  c.ball = ball;
  c.radius = r;
  c.face = face;
  c.bubbles = bubbles;
  c.fx = jelly ? fxState : null;
  c.baseAlpha = jelly ? (DANNYLAB.JELLY_ALPHA[tier] || 0.9) : 1;
  // face animation state
  c._ph = Math.random() * 6.28;
  c.faceFrame = 'rest';
  c.blinkUntil = 0;
  c.nextBlink = this.time.now + 800 + Math.random() * 2600;
  c.nextGiggle = this.time.now + 5000 + Math.random() * 9000;
  c.exprUntil = 0; c.exprFrame = 'alt';
  if (jelly && opts.fromMerge) c.exprUntil = this.time.now + 750;  // "alt" face pops on birth
  this.elements.push(c);

  // pop-in overshoot (visual only, body radius fixed); once landed, elements
  // sit at scale 1 — no idle breathing (removed: it read as constant pulsing)
  if (opts.fromMerge) {
    inner.setScale(0);
    this.tweens.add({ targets: inner, scale: 1.18, duration: 130, ease: 'Back.out',
      onComplete: () => { this.tweens.add({ targets: inner, scale: 1, duration: 90 }); } });
  } else {
    inner.setScale(0.6);
    this.tweens.add({ targets: inner, scale: 1, duration: 120, ease: 'Back.out' });
  }

  this.handleDiscovery(tier, opts.fromMerge, c);
  this.signature(c, tier);
  return c;
};

// one internal bubble rising + fading on a self-restarting loop
GP._bubbleTween = function (bub, radius, i) {
  var self = this, botY = radius * 0.5, topY = -radius * 0.5;
  function run() {
    if (!bub.active) return;
    bub.y = botY; bub.x = bub._x0 + (Math.random() - 0.5) * radius * 0.18;
    self.tweens.add({
      targets: bub, y: topY, duration: (1500 + Math.random() * 1600) / (bub._spd || 1), ease: 'Sine.inOut',
      delay: (run._first ? i * 350 + Math.random() * 500 : 0),
      onUpdate: function (tw) { var p = tw.progress; bub.alpha = (p < 0.25 ? p / 0.25 : p > 0.7 ? (1 - p) / 0.3 : 1) * 0.5; },
      onComplete: run,
    });
    run._first = false;
  }
  run._first = true;
  run();
};

// build the per-element internal effect; pushes its sprites into `kids` and
// returns the fx state used by _animFX.
GP._buildFX = function (kids, tier, r) {
  var cfg = DANNYLAB.JELLY_FX[tier] || { type: 'bubbles', n: 2, speed: 1, size: 1, tint: 0xffffff };
  var fx = { type: cfg.type, cfg: cfg, items: [], phase: Math.random() * 4000, sway: cfg.sway };
  var i, it, u = r / 40;

  if (cfg.type === 'bubbles' || cfg.type === 'flicker') {
    var n = cfg.n || 2;
    for (i = 0; i < n; i++) {
      it = this.add.image((Math.random() - 0.5) * r * 0.6, r * 0.5, 'jelly_bub').setAlpha(0).setTint(cfg.tint);
      it.setScale((0.3 + Math.random() * 0.4) * u * (cfg.size || 1));
      it._x0 = it.x; it._spd = cfg.speed || 1;
      kids.push(it); fx.items.push(it); this._bubbleTween(it, r, i);
    }
  } else if (cfg.type === 'sparks') {
    for (i = 0; i < (cfg.n || 4); i++) {
      it = this.add.image(0, 0, 'jelly_bub').setTint(cfg.tint).setBlendMode('ADD').setScale(0.22 * u);
      it._tx = (Math.random() - 0.5) * r * 0.9; it._ty = (Math.random() - 0.5) * r * 0.9; it.setAlpha(0.6);
      kids.push(it); fx.items.push(it);
    }
  } else if (cfg.type === 'motes') {
    for (i = 0; i < (cfg.n || 3); i++) {
      it = this.add.image(0, 0, 'jelly_bub').setTint(cfg.tint).setBlendMode('ADD').setScale(0.24 * u).setAlpha(0.75);
      it._ang = Math.random() * 6.28; it._orb = r * (0.26 + i * 0.09);
      kids.push(it); fx.items.push(it);
    }
  } else if (cfg.type === 'glint' || cfg.type === 'sweep') {
    if (cfg.type === 'sweep') {
      fx.sweep = this.add.image(0, 0, 'jelly_bub').setTint(0xffffff).setBlendMode('ADD').setAlpha(0);
      fx.sweep.setScale(0.8 * u, 1.7 * u); fx.sweep.rotation = -0.7;
      kids.push(fx.sweep);
    }
    fx.star = this.add.image(0, 0, 'jelly_star').setTint(cfg.tint).setBlendMode('ADD').setAlpha(0).setScale(0.5 * u);
    kids.push(fx.star);
    fx.next = this.time.now + 500 + Math.random() * 1100;
    if (cfg.fleck) for (i = 0; i < 3; i++) kids.push(
      this.add.image((Math.random() - 0.5) * r * 0.8, (Math.random() - 0.3) * r * 0.7, 'jelly_bub')
        .setTint(0x8a5a3a).setAlpha(0.5).setScale(0.13 * u));
  }
  return fx;
};

// per-frame internal effect animation
GP._animFX = function (c, time) {
  var fx = c.fx, r = c.radius; if (!fx) return;
  var i, it;
  if (fx.type === 'sparks') {
    for (i = 0; i < fx.items.length; i++) {
      it = fx.items[i];
      it.x += (it._tx - it.x) * 0.18; it.y += (it._ty - it.y) * 0.18;
      if (Phaser.Math.Distance.Between(it.x, it.y, it._tx, it._ty) < 3) { it._tx = (Math.random() - 0.5) * r * 0.9; it._ty = (Math.random() - 0.5) * r * 0.9; }
      it.alpha = 0.575 + 0.225 * Math.abs(Math.sin(time * 0.018 + i * 1.7));
    }
  } else if (fx.type === 'motes') {
    for (i = 0; i < fx.items.length; i++) { it = fx.items[i]; it._ang += 0.022 + i * 0.004; it.x = Math.cos(it._ang) * it._orb; it.y = Math.sin(it._ang) * it._orb * 0.7; }
    if (c.ball) c.ball.alpha = c.baseAlpha * (0.975 + 0.025 * Math.sin(time * 0.004 + fx.phase));
  } else if (fx.type === 'flicker') {
    if (c.ball) c.ball.alpha = c.baseAlpha * (0.955 + 0.045 * Math.abs(Math.sin(time * 0.005 + fx.phase))) * (Math.random() < 0.008 ? 0.875 : 1);
    if (fx.sway === undefined && fx.items.length) for (i = 0; i < fx.items.length; i++) fx.items[i].x = fx.items[i]._x0 + Math.sin(time * 0.003 + i) * r * 0.04;
  } else if (fx.type === 'sweep' || fx.type === 'glint') {
    if (fx.sweep) { var p = ((time + fx.phase) % 2600) / 2600; fx.sweep.x = (-0.5 + p) * r * 1.05; fx.sweep.y = (0.5 - p) * r * 1.05; fx.sweep.alpha = (p < 0.5 ? p / 0.5 : (1 - p) / 0.5) * 0.5; }
    if (time > fx.next && fx.star) {
      var st = fx.star;
      st.setPosition((Math.random() - 0.5) * r * 0.8, (Math.random() - 0.5) * r * 0.7).setScale(0).setAlpha(1);
      this.tweens.add({ targets: st, scale: 0.6 * (r / 40), duration: 150, yoyo: true, onComplete: function () { if (st.active) st.setAlpha(0); } });
      fx.next = time + (fx.cfg.sparkle ? 650 : 1300) + Math.random() * 1100;
    }
  } else if (fx.type === 'bubbles' && fx.sway) {
    for (i = 0; i < fx.items.length; i++) fx.items[i].x = fx.items[i]._x0 + Math.sin(time * 0.002 + i) * r * 0.06;
  }
};

// per-frame jelly face: blink, expression, parallax float, and smooth motion
GP._animFace = function (e, time) {
  var f = e.face, r = e.radius;
  // occasional giggle (the element's "alt" face) so they feel alive at rest
  if (e.exprUntil <= time && time > e.nextGiggle) { e.exprUntil = time + 520; e.nextGiggle = time + 6000 + Math.random() * 9000; }
  var want = 'rest';
  if (e.exprUntil > time) want = e.exprFrame;        // 'alt'
  else if (e.blinkUntil > time) want = 'blink';
  else if (time > e.nextBlink) { e.blinkUntil = time + 130; e.nextBlink = time + 2400 + Math.random() * 3500; }
  if (want !== e.faceFrame) { f.setTexture('jelly_face_' + e.tier + '_' + want); e.faceFrame = want; }

  // steady at rest — NO constant breathing/pulsing. The only scale changes are
  // brief events: an eased eye-squash on blink and a quick expression pop.
  var sc = 1, scy = 1;
  if (e.blinkUntil > time) { var bp = Math.sin(Math.min(1, (e.blinkUntil - time) / 130) * Math.PI); scy *= (1 - 0.3 * bp); }
  if (e.exprUntil > time && (e.exprUntil - time) > 430) { sc *= 1.08; scy *= 1.08; }
  f.setDisplaySize(r * 1.55 * sc, r * 1.55 * scy);

  // float: lead the motion slightly so the face sits "in front of" the body;
  // perfectly still at rest (idle drift removed with the breathing)
  var vx = e.body ? e.body.velocity.x : 0, vy = e.body ? e.body.velocity.y : 0;
  f.x = Phaser.Math.Clamp(-vx * 0.8, -r * 0.16, r * 0.16);
  f.y = -r * 0.06 + Phaser.Math.Clamp(-vy * 0.5, -r * 0.16, r * 0.16);
};

// squash & stretch on a hard impact (visual scale only, Brief §12)
GP.squash = function (c) {
  if (!c.active || c.consumed || !c.visual) return;
  var sp = c.body ? c.body.speed : 0;
  if (sp < 1.8) return;
  if (c._squashing) return;
  c._squashing = true;
  var self = this, v = c.visual;
  var mag = Math.min(0.3, 0.14 + sp * 0.02);   // bigger squash the harder the hit
  this.tweens.add({
    targets: v, scaleX: 1 + mag, scaleY: 1 - mag, duration: 80, yoyo: true, ease: 'Quad.out',
    onComplete: function () {
      // rebound the other way (jelly wobble) then settle
      self.tweens.add({
        targets: v, scaleX: 1 - mag * 0.4, scaleY: 1 + mag * 0.4, duration: 95, yoyo: true, ease: 'Sine.inOut',
        onComplete: function () { c._squashing = false; }
      });
    }
  });
  // a little splash puff when something lands hard (cheap juice)
  if (sp > 5) this.burst(c.x, c.y + c.radius * 0.65, 0xbfe3ff, 3, { tex: 'jelly_bub', speed: 45, scale: 0.5, life: 360 });
};

GP.destroyElement = function (c) {
  if (!c || !c.active) return;
  var idx = this.elements.indexOf(c);
  if (idx !== -1) this.elements.splice(idx, 1);
  if (c.visual) this.tweens.killTweensOf(c.visual);
  this.tweens.killTweensOf(c.glow);
  if (c.bubbles) for (var bi = 0; bi < c.bubbles.length; bi++) this.tweens.killTweensOf(c.bubbles[bi]);
  if (c.fx) { if (c.fx.star) this.tweens.killTweensOf(c.fx.star); if (c.fx.sweep) this.tweens.killTweensOf(c.fx.sweep); }
  if (c.body) this.matter.world.remove(c.body);
  c.destroy();
};

// ---------- the merge "implode then pop" effect ----------
// Pull both twins into the contact point (with a tiny anticipation) and shrink
// them, then a beat later destroy them and pop the new element out — quick +
// dynamic. The bodies are frozen (static) so they hold their spot while their
// visuals slide together.
GP.doMerge = function (a, b) {
  var self = this, tier = a.tier;
  var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dur = 95;
  [a, b].forEach(function (e) {
    e._merging = true;
    if (e.visual) self.tweens.killTweensOf(e.visual);
    if (e.setStatic && e.body) e.setStatic(true);          // freeze the body in place
    if (e.visual) self.tweens.add({
      targets: e.visual, x: mx - e.x, y: my - e.y, scaleX: 0.45, scaleY: 0.45, alpha: 0.9,
      duration: dur, ease: 'Back.in',
    });
  });
  this.burst(mx, my, DANNYLAB.tierCfg(tier).color, 5, { speed: 26, scale: 0.3, life: 220 });
  this.time.delayedCall(dur, function () {
    self.mergeBurst(mx, my, tier);
    self.destroyElement(a); self.destroyElement(b);
    var merged = self.spawnElement(tier + 1, mx, my, { fromMerge: true });
    self.onMerge(merged);
  });
};

// ---------- merge scoring + the escalating cascade ramp (Addendum §1) ----------
GP.onMerge = function (merged) {
  var createdTier = merged.tier, x = merged.x, y = merged.y;
  this.combo += 1;
  var n = this.combo, CFG = DANNYLAB.CONFIG;
  var pts = (CFG.tierPoints[createdTier] || 0) * n;
  if (this.glowBoostMerges > 0) { pts = Math.round(pts * 1.5); this.glowBoostMerges--; }  // Neon mystery boost
  this.addScore(pts, x, y);   // tierPoints x combo (x labBonus in addScore)
  this.lastMergeAt = this.time.now;

  // lifetime stats + per-run recap (combo records can unlock cards)
  DANNYLAB.store.bumpStat('merges');
  if (n > this.runMaxCombo) {
    this.runMaxCombo = n;
    DANNYLAB.store.maxStat('bestCombo', n);
    this._checkCardUnlocks();
  }

  // ---- audio + haptics: pitch climbs per tier; cascade chime brightens each
  // step; the buzz grows with the chain ----
  if (this.audio) {
    this.audio.merge(createdTier);
    this.audio.haptic(n);                 // haptic at every merge, scaled by combo
    if (n >= 2) this.audio.cascade(n);
    if (n >= CFG.comboToast.overload) this.audio.stinger();
  }

  // ---- escalating audiovisual ramp (everything scales with the chain) ----
  if (n >= 2) {
    this.comboPopup(n, x, y);
    var col = DANNYLAB.tierCfg(createdTier).color;
    this.burst(x, y, col, Math.min(6 + n * 3, 28), {
      tex: n >= 3 ? 'p_spark' : 'p_dot', speed: 80 + n * 18, scale: 0.4 + n * 0.06, life: 400 + n * 40,
    });
    this.cameras.main.shake(90 + n * 14, Math.min(0.002 + n * 0.0018, 0.014));
    if (n >= 3) this.cameras.main.flash(70, 150, 210, 255);          // subtle wash
    if (n >= 5) this.screenSparkle();                                // screen-wide sparkle
    if (n >= 4 && CFG.cascadeSlowMoEnabled) this.cascadeSlowMo();    // micro slow-mo "land"
  }

  // ---- reaction toasts at thresholds ----
  var ct = CFG.comboToast;
  if (n === ct.chain) this.toast(DANNYLAB.t('toast_cascade', this.lang));
  else if (n === ct.overload) this.toast(DANNYLAB.t('toast_overload', this.lang), 0xff9b5b);
  if (createdTier === DANNYLAB.MAX_TIER) this.toast(DANNYLAB.t('toast_uranium', this.lang), 0x7CFF6B);
};

// "COMBO xN" popup that grows + warms as the chain climbs
GP.comboPopup = function (n, x, y) {
  var size = 18 + Math.min(n, 9) * 3;
  var col = n >= 5 ? '#ff9b5b' : n >= 3 ? '#FBD38D' : '#eafffb';
  var t = this.add.text(x, y - 28, 'COMBO x' + n, {
    fontFamily: DANNYLAB.UI.DISPLAY, fontSize: size + 'px', color: col, fontStyle: 'bold',
    stroke: '#0c1430', strokeThickness: 5,
  }).setOrigin(0.5).setDepth(47).setScale(0.4);
  this.tweens.add({ targets: t, scale: 1, duration: 150, ease: 'Back.out' });
  this.tweens.add({ targets: t, y: y - 72, alpha: 0, duration: 720, delay: 220, onComplete: function () { t.destroy(); } });
};

// a screen-wide sparkle wash on a big chain (n >= 5)
GP.screenSparkle = function () {
  var GEO = DANNYLAB.GEO;
  this.burst(DANNYLAB.beakerCx(), GEO.H * 0.5, 0xffffff, 36, { tex: 'p_spark', speed: 280, scale: 0.7, life: 900 });
};

// micro slow-mo so a big chain "lands" (dips the Matter sim briefly)
GP.cascadeSlowMo = function () {
  if (this._slowmo || !this.matter.world.engine) return;
  this._slowmo = true;
  var eng = this.matter.world.engine, self = this;
  eng.timing.timeScale = DANNYLAB.CONFIG.cascadeSlowMoScale;
  this.time.delayedCall(DANNYLAB.CONFIG.cascadeSlowMoMs, function () {
    if (eng.timing) eng.timing.timeScale = 1;
    self._slowmo = false;
  });
};

// ================= MYSTERY SAMPLE (Addendum §2) =================
GP.spawnMystery = function (x, y) {
  var r = DANNYLAB.CONFIG.mysteryRadius, UI = DANNYLAB.UI;
  var shadow = this.add.image(0, r * 0.82, 'el_shadow').setAlpha(0.5); shadow.setDisplaySize(r * 2.1, r * 1.2);
  var glow = this.add.image(0, 0, 'el_glow').setTint(0xff66ff).setBlendMode('ADD').setAlpha(0.7); glow.setDisplaySize(r * 3.2, r * 3.2);
  var bodyImg = this.add.image(0, 0, 'mystery_body'); bodyImg.setDisplaySize(r * 2.2, r * 2.2);
  var q = this.add.text(0, 0, '?', { fontFamily: UI.DISPLAY, fontSize: Math.round(r * 1.2) + 'px', color: '#3a2a6a', fontStyle: 'bold' }).setOrigin(0.5);
  var inner = this.add.container(0, 0, [shadow, glow, bodyImg, q]);
  var c = this.add.container(x, y, [inner]); c.setDepth(0);
  this.matter.add.gameObject(c, { shape: { type: 'circle', radius: r }, restitution: 0.2, friction: 0.4, frictionStatic: 0.5 });
  c.tier = -1; c.consumed = false; c.visual = inner; c.glow = glow; c.bodyImg = bodyImg; c.radius = r; c.isMystery = true; c._hue = 0;
  this.elements.push(c);
  inner.setScale(0.5);
  this.tweens.add({ targets: inner, scale: 1, duration: 150, ease: 'Back.out' });
  this.cameras.main.shake(110, 0.003);
  this.burst(x, y, 0xffffff, 12, { tex: 'p_spark', speed: 90, scale: 0.5, life: 500 });
  return c;
};

GP._shimmerMystery = function (e, time) {
  e._hue = (e._hue + 0.012) % 1;
  var col = Phaser.Display.Color.HSVToRGB(e._hue, 0.65, 1).color;
  if (e.bodyImg) { e.bodyImg.setTint(col); e.bodyImg.rotation += 0.05; }
  if (e.glow) { e.glow.setTint(col); e.glow.setAlpha(0.61 + 0.11 * Math.sin(time * 0.008)); }
};

// the mystery touched `tgt` first → a slow build-up, then the keyed effect.
GP.triggerMystery = function (myst, tgt) {
  var self = this, C = DANNYLAB.CONFIG;
  DANNYLAB.store.bumpStat('mysteries');
  this._checkCardUnlocks();
  var effect = (C.mysteryEffects && C.mysteryEffects[tgt.tier]) || C.mysteryFallbackEffect;
  var mx = myst.x, my = myst.y;
  // --- anticipation: freeze the orb, swell + spin it up, gather sparks ---
  if (myst.setStatic && myst.body) myst.setStatic(true);
  if (this.audio) this.audio.mystery();
  if (myst.visual) this.tweens.add({ targets: myst.visual, scale: 1.6, duration: 480, ease: 'Quad.in' });
  this.burst(mx, my, 0xffffff, 8, { speed: 22, scale: 0.3, life: 480 });
  this.cameras.main.shake(140, 0.003);
  // --- then it bursts and the effect plays out in a long, deep slow-mo so the
  //     board shift is plainly visible (the physics crawls; transforms ripple) ---
  this.time.delayedCall(520, function () {
    self.burst(mx, my, 0xffffff, 30, { tex: 'p_spark', speed: 220, scale: 0.85, life: 950 });
    self.cameras.main.flash(220, 220, 180, 255);
    self.cameras.main.shake(240, 0.007);
    self.mysterySlowMo(0.4, 2200);
    self.destroyElement(myst);
    self.applyMysteryEffect(effect, (tgt && tgt.active) ? tgt : null, mx, my);
  });
};

// brief slow motion so the mystery effect reads clearly (dips the Matter sim)
GP.mysterySlowMo = function (scale, ms) {
  if (!this.matter.world.engine) return;
  var eng = this.matter.world.engine, self = this;
  this._slowmo = true;
  eng.timing.timeScale = scale;
  if (this._slowTimer) this._slowTimer.remove(false);
  this._slowTimer = this.time.delayedCall(ms, function () { if (eng.timing) eng.timing.timeScale = 1; self._slowmo = false; });
};

GP._elementsNear = function (x, y, r) {
  var out = [];
  for (var i = 0; i < this.elements.length; i++) { var e = this.elements[i]; if (e.active && e.tier >= 1 && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= r) out.push(e); }
  return out;
};

// upgrade an element one tier in place (implode-pop look). Returns true if done.
GP._upgradeElement = function (e) {
  if (!e || !e.active || e.tier < 1 || e.tier >= DANNYLAB.MAX_TIER) return false;
  var t = e.tier, px = e.x, py = e.y;
  this.mergeBurst(px, py, t);
  this.destroyElement(e);
  this.spawnElement(t + 1, px, py, { fromMerge: true });
  return true;
};
// shove every element away from a blast point (shockwave) — always visible
GP._knockback = function (cx, cy, power, reach) {
  this.elements.forEach(function (e) {
    if (!e.setVelocity || e.tier < 1) return;
    var dx = e.x - cx, dy = e.y - cy, d = Math.max(12, Math.hypot(dx, dy));
    var f = Math.max(0, 1 - d / reach);
    if (f <= 0) return;
    e.setVelocity((dx / d) * power * f, (dy / d) * power * f - 3 * f);
  });
};

// run fn(item,i) for each item spaced `gap` ms apart — a visible ripple instead
// of an all-at-once flash. Returns the total time the ripple spans.
GP._ripple = function (items, gap, fn) {
  var self = this;
  for (var i = 0; i < items.length; i++) (function (it, i) {
    self.time.delayedCall(i * gap, function () {
      if (self.gameOver) return;     // don't touch score/board after a loss
      fn(it, i);
    });
  })(items[i], i);
  return items.length * gap;
};
// pop a list of elements one-by-one (each with its own burst + score)
GP._popList = function (list, color, gap) {
  var self = this;
  return this._ripple(list, gap || 95, function (e) {
    if (!e || !e.active) return;
    self.burst(e.x, e.y, color, 12, { tex: 'p_spark', speed: 130, scale: 0.6, life: 560 });
    self.addScore(25, e.x, e.y);
    self.destroyElement(e);
  });
};
// upgrade a list of elements one-by-one (visible chain of implode-pops)
GP._upgradeList = function (list, gap) {
  var self = this;
  return this._ripple(list, gap || 170, function (e) { self._upgradeElement(e); });
};
// a big, central, lingering banner naming the effect — the obvious headline
GP.mysteryBanner = function (text, color) {
  var GEO = DANNYLAB.GEO;
  var y = GEO.dropY + 96;
  var t = this.add.text(DANNYLAB.beakerCx(), y, text, {
    fontFamily: DANNYLAB.UI.DISPLAY, fontSize: '48px', color: '#ffffff', fontStyle: 'bold',
    stroke: '#0c1430', strokeThickness: 10, align: 'center',
  }).setOrigin(0.5).setDepth(60).setScale(0.3).setAlpha(0);
  if (color) t.setColor('#' + color.toString(16).padStart(6, '0'));
  this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 280, ease: 'Back.out' });
  this.tweens.add({ targets: t, alpha: 0, y: y - 44, scale: 1.18, delay: 1500, duration: 480,
    onComplete: function () { t.destroy(); } });
};

// a small one-line explanation under the banner, held ~3s so the player can
// read what the Mystery just did.
GP.mysteryDesc = function (text) {
  if (!text) return;
  var GEO = DANNYLAB.GEO;
  if (this._mysteryDescTxt && this._mysteryDescTxt.active) this._mysteryDescTxt.destroy();
  var y = GEO.dropY + 142;
  var t = this.add.text(DANNYLAB.beakerCx(), y, text, {
    fontFamily: DANNYLAB.UI.FONT, fontSize: '20px', color: '#eaf4ff', fontStyle: 'bold',
    stroke: '#0c1430', strokeThickness: 5, align: 'center',
    wordWrap: { width: GEO.bx1 - GEO.bx0 - 16 },
  }).setOrigin(0.5).setDepth(60).setAlpha(0);
  this._mysteryDescTxt = t;
  this.tweens.add({ targets: t, alpha: 1, duration: 250 });
  this.tweens.add({ targets: t, alpha: 0, delay: 3000, duration: 450,
    onComplete: function () { t.destroy(); } });
};

GP.applyMysteryEffect = function (effect, tgt, mx, my) {
  var self = this, R = 150, tier = tgt ? tgt.tier : 0, BASE = 75;
  var labels = {
    updraft: 'LIFT-OFF!', float: 'FLOAT!', crystallizeUpgrade: 'CRYSTALLIZE!', combustPop: 'KA-BOOM!',
    glowBoost: 'LIGHT SHOW!', fizzPop: 'FIZZ POP!', magnetMerge: 'MAGNET PULSE!', jackpot: 'JACKPOT!', miniFission: 'FISSION!',
  };
  // short, plain-language explanation keyed to the element that was touched
  var descs = {
    updraft: 'The whole batch floats up!',
    float: 'Nearby pieces balloon and lift!',
    crystallizeUpgrade: 'A cluster crystallizes up a tier!',
    combustPop: 'A blast scatters and clears the small ones!',
    glowBoost: 'The smallest pieces power up a tier!',
    fizzPop: 'Every small piece fizzes away!',
    magnetMerge: 'Everything snaps toward the middle!',
    jackpot: 'A big jackpot of points!',
    miniFission: 'A fission blast clears a wide area!',
  };
  if (labels[effect]) this.mysteryBanner(labels[effect], 0xff7be0);
  this.mysteryDesc(descs[effect]);
  // a Mystery shouldn't end the run: the effects briefly lift/scatter pieces,
  // so suspend the overflow check while they settle back down.
  this._noOverflowUntil = this.time.now + 3800;
  this.overflowAccum = 0;
  if (this.fillFlash) this.fillFlash.setAlpha(1);
  // every effect is guaranteed an obvious visual + a score bump; the themed
  // mechanic (clear/merge/upgrade nearby) is a bonus when targets are present.

  var els = this.elements;
  // sleeping bodies ignore setVelocity, so wake the whole board first — the
  // shove/lift/magnet effects must be able to move settled pieces.
  for (var wi = 0; wi < els.length; wi++) { if (els[wi].setAwake) els[wi].setAwake(); }
  switch (effect) {
    case 'updraft':   // LIFT-OFF: the WHOLE pile gets tossed upward (declutter)
      els.forEach(function (e) { if (e.tier >= 1 && e.setVelocity) e.setVelocity((Math.random() - 0.5) * 9, -12 - Math.random() * 6); });
      for (var u = 0; u < 5; u++) this.burst(DANNYLAB.beakerCx() + (Math.random() - 0.5) * 240, DANNYLAB.GEO.floorTop - 30, 0xBEE3F8, 10, { tex: 'p_bubble', speed: 100, scale: 0.7, life: 950, blend: 'NORMAL' });
      this.addScore(BASE, mx, my);
      break;

    case 'float':     // FLOAT: a cluster balloons huge and shoots up, opening space
      var near = this._elementsNear(mx, my, 190); if (tgt && near.indexOf(tgt) < 0) near.push(tgt);
      near.forEach(function (e) {
        if (e.setVelocity) e.setVelocity((Math.random() - 0.5) * 4, -11 - Math.random() * 4);
        if (e.visual) self.tweens.add({ targets: e.visual, scale: 1.45, duration: 300, yoyo: true, hold: 350, ease: 'Sine.inOut' });
      });
      this.burst(mx, my, 0xFBD38D, 22, { tex: 'p_bubble', speed: 90, scale: 0.9, life: 1100 });
      this.addScore(BASE, mx, my);
      break;

    case 'crystallizeUpgrade':  // CRYSTALLIZE: upgrade a small cluster a tier, one by one
      // keep it modest: upgrading replaces pieces with bigger ones, so too many
      // at once can shove the stack over the line. A few is plenty.
      var cluster = this._elementsNear(mx, my, 170).filter(function (e) { return e.tier < DANNYLAB.MAX_TIER; });
      if (tgt && tgt.active && cluster.indexOf(tgt) < 0 && tgt.tier < DANNYLAB.MAX_TIER) cluster.unshift(tgt);
      if (!cluster.length) { var lo = this._lowest(); if (lo) cluster.push(lo); }
      cluster = cluster.slice(0, 3);
      this.burst(mx, my, 0xffffff, 24, { tex: 'p_spark', speed: 160, scale: 0.8, life: 750 });
      this._upgradeList(cluster, 190);
      this.addScore(BASE, mx, my);
      break;

    case 'combustPop':  // KA-BOOM: a real shockwave — blasts everything outward + clears small
      this.cameras.main.shake(260, 0.009); this.cameras.main.flash(160, 255, 150, 70);
      this.burst(mx, my, 0xff7a3a, 34, { tex: 'p_spark', speed: 260, scale: 1.0, life: 700 });
      this.burst(mx, my, 0xffd27a, 22, { speed: 170, scale: 0.9, life: 600 });
      var ringK = this.add.image(mx, my, 'p_ring').setTint(0xff8a3a).setBlendMode('ADD').setScale(0.3).setDepth(26).setAlpha(0.95);
      this.tweens.add({ targets: ringK, scale: 6, alpha: 0, duration: 700, ease: 'Cubic.out', onComplete: function () { ringK.destroy(); } });
      this._knockback(mx, my, 16, 320);                 // shove the whole pile away from the blast (in slow-mo)
      var small = this._elementsNear(mx, my, R).filter(function (e) { return e.tier >= 1 && e.tier <= 2; });
      this._popList(small, 0xff9b5b, 90);                // vaporise the small ones nearby, one by one
      this.addScore(BASE, mx, my);
      break;

    case 'glowBoost':  // LIGHT SHOW: energise — grow the smallest pieces a tier + boost merges
      this.glowBoostMerges = 8;
      var lowT = this._lowestTier();
      var toGrow = [];
      if (lowT > 0) toGrow = els.filter(function (e) { return e.active && e.tier === lowT && e.tier < DANNYLAB.MAX_TIER; }).slice(0, 6);
      if (!toGrow.length && tgt && tgt.active) toGrow = [tgt];   // always advance at least one
      els.forEach(function (e) { if (e.glow) { e.glow.setAlpha(1); self.tweens.add({ targets: e.glow, alpha: e.tier === DANNYLAB.MAX_TIER ? 0.6 : 0, duration: 900 }); } });
      this.cameras.main.flash(320, 246, 135, 179);
      this.screenSparkle();
      this._upgradeList(toGrow, 175);                   // grow them in a visible chain
      this.addScore(BASE, mx, my);
      break;

    case 'fizzPop':    // FIZZ POP: pop EVERY small piece (tier 1-2) on the board
      var fz = this.add.particles(mx, my, 'jelly_bub', {
        speed: { min: 40, max: 160 }, angle: { min: 225, max: 315 }, scale: { start: 0.7, end: 0 },
        alpha: { start: 0.9, end: 0 }, lifespan: 850, quantity: 30, tint: 0xb98bff, blendMode: 'ADD', emitting: false,
      }).setDepth(25);
      fz.explode(34); this.time.delayedCall(950, function () { fz.destroy(); });
      var fizz = els.filter(function (e) { return e.active && e.tier >= 1 && e.tier <= 2; });
      this._popList(fizz, 0x9F7AEA, 70);                 // whole board, popping in a sweep
      this.addScore(BASE, mx, my);
      break;

    case 'magnetMerge':  // MAGNET PULSE: yank EVERYTHING hard to the spot (forces merges)
      els.forEach(function (e) {
        if (e.setVelocity && e.tier >= 1) { var dx = mx - e.x, dy = my - e.y, d = Math.max(1, Math.hypot(dx, dy)); e.setVelocity(dx / d * 14, dy / d * 14); }
      });
      var ring = this.add.image(mx, my, 'p_ring').setTint(0x9fd0ff).setBlendMode('ADD').setScale(0.3).setDepth(26).setAlpha(0.9);
      this.tweens.add({ targets: ring, scale: 4.5, alpha: 0, duration: 600, ease: 'Cubic.out', onComplete: function () { ring.destroy(); } });
      if (this.audio) this.audio.magnet();
      this.addScore(BASE, mx, my);
      break;

    case 'jackpot':    // JACKPOT: a big point haul (feeds the charge meter hard)
      this.addScore(500, mx, my);
      this.cameras.main.flash(220, 236, 201, 75);
      for (var i = 0; i < 9; i++) (function (i) {
        self.time.delayedCall(i * 65, function () {
          self.burst(mx + (Math.random() - 0.5) * 160, my - 24, 0xECC94B, 7, { tex: 'p_spark', speed: 140, scale: 0.7, life: 850 });
          if (self.audio) self.audio.coin();
        });
      })(i);
      break;

    case 'miniFission':  // FISSION: a real blast — clears a wide radius + knockback
      this.cameras.main.flash(240, 180, 255, 160); this.cameras.main.shake(320, 0.013);
      if (this.audio) this.audio.fission();
      this.burst(mx, my, 0x7CFF6B, 36, { tex: 'p_spark', speed: 260, scale: 1.0, life: 900 });
      var ringF = this.add.image(mx, my, 'p_ring').setTint(0x7CFF6B).setBlendMode('ADD').setScale(0.3).setDepth(26).setAlpha(0.95);
      this.tweens.add({ targets: ringF, scale: 7, alpha: 0, duration: 800, ease: 'Cubic.out', onComplete: function () { ringF.destroy(); } });
      this._knockback(mx, my, 14, 280);
      var blast = this._elementsNear(mx, my, DANNYLAB.CONFIG.fissionRadius).filter(function (e) { return e.tier >= 1 && e.tier <= 4; });
      this._popList(blast, 0x7CFF6B, 85);
      this.addScore(Math.round(BASE * 1.5), mx, my);
      break;

    default:
      this.burst(mx, my, 0xffffff, 18, { tex: 'p_spark', speed: 140, scale: 0.7, life: 700 });
      this.addScore(BASE, mx, my);
  }
};

// the lowest tier currently on the board (0 if none), and the actual element
GP._lowestTier = function () {
  var lo = 99;
  for (var i = 0; i < this.elements.length; i++) { var e = this.elements[i]; if (e.active && e.tier >= 1 && e.tier < lo) lo = e.tier; }
  return lo === 99 ? 0 : lo;
};
GP._lowest = function () {
  var lo = this._lowestTier(), best = null;
  for (var i = 0; i < this.elements.length; i++) { var e = this.elements[i]; if (e.active && e.tier === lo) { best = e; break; } }
  return best;
};

// rawPts is pre-bonus (e.g. tierPoints x combo); the Lab Bonus multiplier is
// applied here so it covers ALL scoring, and the points also feed the charge
// meter (Addendum §3).
GP.addScore = function (rawPts, x, y) {
  var pts = Math.round(rawPts * this.labBonus);
  this.score += pts;
  this.scoreText.setText(String(this.score));
  this.tweens.add({ targets: this.scoreText, scale: 1.25, duration: 80, yoyo: true });
  if (this.score > this.best) {
    this.best = this.score;
    this.bestText.setText(String(this.best));
  }
  if (DANNYLAB.CONFIG.chargeMeterEnabled && pts > 0) {
    this.charge += pts;
    while (this.charge >= this.chargeThreshold) { this.charge -= this.chargeThreshold; this.levelUp(); }
    this._drawCharge();
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

// ---------- card unlocks: celebrate the moment a milestone is hit ----------
GP._checkCardUnlocks = function () {
  if (!DANNYLAB.newCardUnlocks || this.gameOver) return;
  var self = this, fresh = DANNYLAB.newCardUnlocks();
  for (var i = 0; i < fresh.length; i++) (function (cItem, i2) {
    self.runNewCards.push(cItem);
    self.time.delayedCall(i2 * 1100, function () {
      if (self.gameOver) return;
      self.toast(DANNYLAB.t('toast_newcard', self.lang, { name: cItem.name }), 0xffd84d);
      if (self.audio) { self.audio.discovery(); self.audio.hapticBig(); }
    });
  })(fresh[i], i);
};

// ---------- discovery: first-ever (+50) and first-this-run (+25) ----------
GP.handleDiscovery = function (tier, fromMerge, c) {
  var sym = DANNYLAB.tierCfg(tier).sym;
  var firstEver = !DANNYLAB.store.isDiscovered(sym);
  var firstThisRun = !this.runDiscovered[sym];
  this.runDiscovered[sym] = true;
  var bonus = 0;
  if (firstEver) { DANNYLAB.store.addDiscovered(sym); bonus += DANNYLAB.CONFIG.discoverBonusFirstEver; this._checkCardUnlocks(); }
  if (firstThisRun) bonus += DANNYLAB.CONFIG.discoverBonusThisRun;
  if (bonus > 0) this.addScore(bonus, c ? c.x : null, c ? c.y - (c.radius || 20) : null);

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
  var cardW = Math.min(376, GEO.bx1 - GEO.bx0 + 44), cardH = 184, restY = 112;
  // Back layer (behind the tweezers and elements) so it never covers the
  // tongs — you can keep aiming and dropping right over it. It just slides in,
  // sits for a few seconds, and slides away.
  var card = this.add.container(cx, -cardH - 20).setDepth(-2).setAngle(-2.5);
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
  var fact = this.add.text(-cardW / 2 + 70, -cardH / 2 + 76, DANNYLAB.elementFact(sym, lang), {
    fontFamily: UI.FONT, fontSize: '15px', color: '#6a4a1a', lineSpacing: 7,
    wordWrap: { width: cardW - 100 } }).setOrigin(0, 0);
  var icon = this.add.image(-cardW / 2 + 32, 2, DANNYLAB.iconKey(this, tier)).setDisplaySize(52, 52);

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
  this._discoAuto = this.time.delayedCall(8000, function () { self.dismissDiscovery(); });
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
  // slow radioactive pulse on the glow — brightness only, never size
  c.glow.setAlpha(0.6);
  this.tweens.add({ targets: c.glow, alpha: 0.775, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
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
  DANNYLAB.store.bumpStat('fissions');
  this._checkCardUnlocks();
  if (this.audio) { this.audio.fission(); this.audio.duck(); this.audio.hapticBig(); }
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
// Concurrent toasts stack downward so they never overlay each other (e.g. a
// mystery reaction toast + a "LAB LEVEL UP!" it triggers).
GP.toast = function (text, color, baseY) {
  var GEO = DANNYLAB.GEO;
  this._toasts = (this._toasts || []).filter(function (o) { return o.active; });
  var y = (baseY != null ? baseY : GEO.dropY + 30) + this._toasts.length * 40;
  var t = this.add.text(DANNYLAB.beakerCx(), y, text, {
    fontFamily: DANNYLAB.UI.DISPLAY, fontSize: '28px', color: '#ffffff', fontStyle: 'bold',
    stroke: '#0c1430', strokeThickness: 6, align: 'center',
    wordWrap: { width: GEO.bx1 - GEO.bx0 + 40 },
  }).setOrigin(0.5).setDepth(48).setScale(0.4);
  if (color) t.setColor('#' + color.toString(16).padStart(6, '0'));
  this._toasts.push(t);
  var self = this;
  this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.out' });
  this.tweens.add({ targets: t, alpha: 0, y: y - 30, delay: 950, duration: 350,
    onComplete: function () { var i = self._toasts.indexOf(t); if (i >= 0) self._toasts.splice(i, 1); t.destroy(); } });
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
    if (e.isMystery) { this._shimmerMystery(e, time); continue; }   // rainbow swirl
    if (e._merging) continue;              // being pulled into a merge; leave it be
    if (e.face) this._animFace(e, time);   // jelly: blink / expression / float
    // skip the decorative internal effect for settled (sleeping) bodies: they
    // hold their last frame, dropping the per-item loop once the beaker fills.
    if (e.fx && !(e.body && e.body.isSleeping)) this._animFX(e, time);
    if (!e.glow || e.tier === DANNYLAB.MAX_TIER || !e.body) continue;
    var sp = e.body.speed;
    var target = sp > 0.7 ? Math.min(1.0, 0.35 + sp * 0.06) : 0.0;   // settled = no glow
    e.glow.alpha += (target - e.glow.alpha) * 0.2;
  }

  // combo reset when the beaker settles
  if (this.combo > 0 && (time - this.lastMergeAt) > DANNYLAB.CONFIG.comboResetMs) {
    this.combo = 0;
  }

  // overflow check (Endless only) — settled element breaching the fill line.
  // Suspended briefly after a Mystery so its lift/scatter can't end the run.
  if (this.mode === 'endless' && !(this._noOverflowUntil && time < this._noOverflowUntil)) {
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
      level: self.labLevel, combo: self.runMaxCombo,
      discovered: Object.keys(self.runDiscovered || {}),
      newCards: self.runNewCards,
    });
    self.scene.pause();
  });
};
