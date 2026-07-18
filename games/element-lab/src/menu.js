// menu.js — DANNYLAB_Menu. ELEMENT LAB logo + 4 chunky buttons (Brief §7).
// Lightweight + self-contained: visibly simpler than a full app shell.
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.MenuScene = function () {
  Phaser.Scene.call(this, { key: 'DANNYLAB_Menu' });
};
DANNYLAB.MenuScene.prototype = Object.create(Phaser.Scene.prototype);
DANNYLAB.MenuScene.prototype.constructor = DANNYLAB.MenuScene;

DANNYLAB.MenuScene.prototype.create = function () {
  DANNYLAB.applyRes(this);
  var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H;
  var lang = this.registry.get('lang');
  var UI = DANNYLAB.UI;
  // 'sharp' = angular sci-fi look; DANNYLAB.MENU_STYLE='classic' reverts it all
  var sharp = this._sharp = DANNYLAB.MENU_STYLE !== 'classic';
  function label(s) { return sharp ? s.toUpperCase() : s; }
  this.lab = DANNYLAB.buildLab(this, { dust: 16 });

  // ---- floating sample elements: drift in the corners + side margins,
  // clear of the title and the buttons (never behind/on the title) ----
  var spots = [
    { x: 0.09, y: 0.075, t: 1 }, { x: 0.91, y: 0.095, t: 2 },
    { x: 0.06, y: 0.50,  t: 4 }, { x: 0.94, y: 0.53,  t: 6 },
    { x: 0.07, y: 0.74,  t: 8 }, { x: 0.93, y: 0.77,  t: 9 },
  ];
  for (var i = 0; i < spots.length; i++) {
    var sp = spots[i];
    var s = this.add.image(W * sp.x, H * sp.y, DANNYLAB.iconKey(this, sp.t))
      .setDepth(-10).setAlpha(0.85);
    s.setDisplaySize(56, 56);
    this.tweens.add({ targets: s, y: s.y - 12, duration: 1500 + i * 170, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: s, x: s.x + (sp.x < 0.5 ? 9 : -9), duration: 2300 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  // ---- topper ----
  var topper = this.add.text(W / 2, H * 0.15, DANNYLAB.t('title_topper', lang), {
    fontFamily: UI.DISPLAY, fontSize: '26px', color: '#FBD38D', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(5).setAlpha(0);
  topper.setShadow(0, 0, '#e0a020', 10);
  if (sharp && topper.setLetterSpacing) topper.setLetterSpacing(3);
  this.tweens.add({ targets: topper, alpha: 1, y: H * 0.155, duration: 420, delay: 120, ease: 'Quad.out' });

  // ---- logo: "ELEMENT LAB" built letter-by-letter as glowing GLASS — each
  // letter is a translucent glass vessel lit with a real element colour (a
  // white-hot top fading into the element below, like an Edison bulb), with a
  // soft energy glow behind it and a gentle wave bob ----
  function hex(c) { return '#' + c.toString(16).padStart(6, '0'); }
  var paletteInt = DANNYLAB.CONFIG.tiers.map(function (t) {
    var col = t.color;
    var lum = (col >> 16 & 255) * 0.299 + (col >> 8 & 255) * 0.587 + (col & 255) * 0.114;
    if (lum < 150) col = DANNYLAB.shade(col, 0.34);     // lift muted greys so every letter pops
    return col;
  });
  var word = DANNYLAB.t('title_logo', lang);
  // shrink the font for longer titles so the row still fits the 540px stage
  var glyphs = word.replace(/ /g, '').length;
  var fs = glyphs > 11 ? 42 : (glyphs > 9 ? 48 : 54), baseY = H * 0.25;
  this.logoLetters = [];
  var cursorX = 0, ci = 0;
  for (var li = 0; li < word.length; li++) {
    var ch = word.charAt(li);
    if (ch === ' ') { cursorX += fs * 0.42; continue; }
    var colInt = paletteInt[ci % paletteInt.length]; ci++;
    var txt = this.add.text(0, 0, ch, {
      fontFamily: UI.DISPLAY, fontSize: fs + 'px', color: hex(colInt), fontStyle: 'bold',
      stroke: '#0a1226', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0.95);
    // glassy vertical gradient: white-hot top -> light -> element colour
    try {
      var grd = txt.context.createLinearGradient(0, 0, 0, txt.height);
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.4, hex(DANNYLAB.shade(colInt, 0.55)));
      grd.addColorStop(1, hex(colInt));
      txt.setColor(grd);
    } catch (e) { /* fall back to the solid colour already set */ }
    var w = txt.width;
    var glow = this.add.image(0, 0, 'el_glow').setTint(colInt).setBlendMode('ADD').setAlpha(0.5);
    glow.setDisplaySize(w * 1.4 + 22, fs * 1.7);
    var lc = this.add.container(0, baseY, [glow, txt]).setDepth(5);
    lc._left = cursorX; lc._w = w;
    cursorX += w + 2;
    this.logoLetters.push(lc);
  }
  // centre the row + stage the entrance (each letter pops in, staggered)
  var totalW = cursorX - 2, startX = W / 2 - totalW / 2;
  for (var p = 0; p < this.logoLetters.length; p++) {
    var L = this.logoLetters[p];
    L.x = startX + L._left + L._w / 2; L._baseY = baseY; L.y = baseY;
    L.setScale(0);
    this.tweens.add({ targets: L, scale: 1, duration: 320, delay: 200 + p * 45, ease: 'Back.out' });
  }

  // ---- 4 chunky buttons (slide + fade up, staggered) ----
  var self = this;
  var bx = W / 2, by = H * 0.45, bw = Math.min(360, W * 0.74), bh = 72, gap = 88;
  function startGame() {
    // resume the audio context on this gesture; the Game scene picks its own
    // gameplay track on create.
    var a = self.registry.get('audio'); if (a) a.resume();
    self.scene.start('DANNYLAB_Game', { mode: self.registry.get('mode') });
  }
  function entrance(btn, idx) {
    btn.setDepth(5).setAlpha(0); btn.y += 26;
    self.tweens.add({ targets: btn, alpha: 1, y: btn.y - 26, duration: 360, delay: 460 + idx * 90, ease: 'Quad.out' });
    return btn;
  }
  var shape = sharp ? 'sharp' : undefined;
  entrance(UI.button(this, bx, by, bw, bh, label(DANNYLAB.t('play', lang)), startGame, { fill: 0x46b85e, shape: shape }), 0);
  entrance(UI.button(this, bx, by + gap, bw, bh, label(DANNYLAB.t('how_to', lang)), function () {
    self.scene.pause(); self.scene.launch('DANNYLAB_HowTo', { parent: 'DANNYLAB_Menu' });
  }, { fill: 0x5b8def, shape: shape }), 1);
  entrance(UI.button(this, bx, by + gap * 2, bw, bh, label(DANNYLAB.t('options', lang)), function () {
    self.scene.pause(); self.scene.launch('DANNYLAB_Options', { parent: 'DANNYLAB_Menu' });
  }, { fill: 0x5b8def, shape: shape }), 2);
  entrance(UI.button(this, bx, by + gap * 3, bw, bh, label(DANNYLAB.t('exit', lang)), function () {
    DANNYLAB.exitSubgame(self);
  }, { fill: 0xc05b7a, shape: shape }), 3);

  // ---- sharp mode: HUD trim — corner brackets + a divider under the logo ----
  if (sharp) {
    var trim = this.add.graphics().setDepth(4).setAlpha(0);
    var m = 14, bl = 26;
    trim.lineStyle(1.5, 0x4fd9ff, 0.55);
    trim.lineBetween(m, m + bl, m, m); trim.lineBetween(m, m, m + bl, m);                             // TL
    trim.lineBetween(W - m - bl, m, W - m, m); trim.lineBetween(W - m, m, W - m, m + bl);             // TR
    trim.lineBetween(m, H - m - bl, m, H - m); trim.lineBetween(m, H - m, m + bl, H - m);             // BL
    trim.lineBetween(W - m - bl, H - m, W - m, H - m); trim.lineBetween(W - m, H - m, W - m, H - m - bl); // BR
    // divider between logo and buttons, with a centre diamond + end ticks
    var dy = 330;
    trim.lineStyle(1.5, 0x4fd9ff, 0.4);
    trim.lineBetween(W * 0.16, dy, W / 2 - 14, dy);
    trim.lineBetween(W / 2 + 14, dy, W * 0.84, dy);
    trim.fillStyle(0x4fd9ff, 0.9);
    trim.fillPoints([{ x: W / 2, y: dy - 5 }, { x: W / 2 + 5, y: dy }, { x: W / 2, y: dy + 5 }, { x: W / 2 - 5, y: dy }], true);
    trim.fillRect(W * 0.16 - 2, dy - 3, 2, 6); trim.fillRect(W * 0.84, dy - 3, 2, 6);
    this.tweens.add({ targets: trim, alpha: 1, duration: 500, delay: 400 });
  }

  // ---- Cards (binder) peek, bottom corner: owned/total + a NEW badge ----
  var counts = DANNYLAB.ownedCardCount ? DANNYLAB.ownedCardCount() : { owned: 0, total: 0 };
  var collBtn = UI.button(this, W - 92, H - 56, 150, 48,
    label(DANNYLAB.t('collection', lang)) + ' ' + counts.owned + '/' + counts.total, function () {
      self.scene.pause(); self.scene.launch('DANNYLAB_Collection', { parent: 'DANNYLAB_Menu' });
    }, { fill: 0x3aa6a0, fontSize: 18, shape: shape });
  collBtn.setDepth(5);

  // ---- Daily Experiment: one seeded modifier run per day, bottom-left ----
  if (DANNYLAB.dailyInfo) {
    var dInfo = DANNYLAB.dailyInfo();
    var dailyBtn = UI.button(this, 92, H - 56, 150, 48, label(DANNYLAB.t('daily', lang)), function () {
      var a = self.registry.get('audio'); if (a) a.resume();
      self.scene.start('DANNYLAB_Game', { mode: 'endless', daily: dInfo });
    }, { fill: 0x8a5fd6, fontSize: 18, shape: shape });
    dailyBtn.setDepth(5);
    // today's modifier, right under the button — a kid should know what
    // they're tapping into before they tap (Mark, TestFlight round 1)
    this.add.text(92, H - 25, dInfo.mod.name, {
      fontFamily: UI.DISPLAY, fontSize: '11px', color: '#ffd84d', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
    var dBest = DANNYLAB.store.getDailyBest(dInfo.date);
    if (dBest > 0) this.add.text(92, H - 88, '★ ' + dBest, {
      fontFamily: UI.DISPLAY, fontSize: '12px', color: '#ffd84d', fontStyle: 'bold' }).setOrigin(0.5).setDepth(5);
  }

  if (DANNYLAB.unseenCardCount && DANNYLAB.unseenCardCount() > 0) {
    var badge = this.add.container(W - 92 + 68, H - 56 - 20).setDepth(6);
    var bg = this.add.graphics();
    bg.fillStyle(0xffd84d, 1); bg.fillCircle(0, 0, 13);
    bg.lineStyle(2, 0x0c1430, 1); bg.strokeCircle(0, 0, 13);
    badge.add([bg, this.add.text(0, 0, '!', {
      fontFamily: UI.FONT, fontSize: '18px', color: '#0c1430', fontStyle: 'bold' }).setOrigin(0.5)]);
    this.tweens.add({ targets: badge, scale: 1.18, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  // the menu plays the intro theme. Returning from a run, audio is already
  // unlocked so this starts immediately; on the very first load it's gated
  // behind the first tap below.
  var menuAudio = this.registry.get('audio');
  if (menuAudio) menuAudio.startMusic('intro');

  // resume audio + kick off the intro theme on first interaction (gesture gate)
  this.input.once('pointerdown', function () {
    var a = self.registry.get('audio'); if (a) { a.resume(); a.startMusic('intro'); }
  });
};

DANNYLAB.MenuScene.prototype.update = function (time, delta) {
  if (this.lab) this.lab.update(delta);
  // gentle wave bob across the logo letters (+ a shimmer wave in sharp mode:
  // each letter's glow flares in sequence, like light sweeping the sign)
  if (this.logoLetters) {
    for (var i = 0; i < this.logoLetters.length; i++) {
      var L = this.logoLetters[i];
      L.y = L._baseY + Math.sin(time * 0.003 + i * 0.5) * 4;
      if (this._sharp && L.list && L.list[0]) {
        L.list[0].alpha = 0.42 + 0.24 * Math.max(0, Math.sin(time * 0.0022 - i * 0.55));
      }
    }
  }
};
