// menu.js — DANNYLAB_Menu. ELEMENT LAB logo + 4 chunky buttons (Brief §7).
// Lightweight + self-contained: visibly simpler than a full app shell.
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.MenuScene = function () {
  Phaser.Scene.call(this, { key: 'DANNYLAB_Menu' });
};
DANNYLAB.MenuScene.prototype = Object.create(Phaser.Scene.prototype);
DANNYLAB.MenuScene.prototype.constructor = DANNYLAB.MenuScene;

DANNYLAB.MenuScene.prototype.create = function () {
  var W = this.cameras.main.width, H = this.cameras.main.height;
  var lang = this.registry.get('lang');
  var UI = DANNYLAB.UI;
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
  this.tweens.add({ targets: topper, alpha: 1, y: H * 0.155, duration: 420, delay: 120, ease: 'Quad.out' });

  // ---- logo: "ELEMENT LAB" built letter-by-letter, each tinted with a real
  // element colour (so the title is literally made out of the elements), with
  // a per-letter glow + a gentle wave bob ----
  var palette = DANNYLAB.CONFIG.tiers.map(function (t) {
    var col = t.color;
    var lum = (col >> 16 & 255) * 0.299 + (col >> 8 & 255) * 0.587 + (col & 255) * 0.114;
    if (lum < 150) col = DANNYLAB.shade(col, 0.30);     // lift muted greys so every letter pops
    return '#' + col.toString(16).padStart(6, '0');
  });
  var word = DANNYLAB.t('title_logo', lang), fs = 54, baseY = H * 0.25;
  this.logoLetters = [];
  var cursorX = 0, ci = 0;
  for (var li = 0; li < word.length; li++) {
    var ch = word.charAt(li);
    if (ch === ' ') { cursorX += fs * 0.42; continue; }
    var col2 = palette[ci % palette.length]; ci++;
    var lt = this.add.text(0, 0, ch, {
      fontFamily: UI.DISPLAY, fontSize: fs + 'px', color: col2, fontStyle: 'bold',
      stroke: '#0c1430', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(5);
    lt.setShadow(0, 0, col2, 12);
    lt._left = cursorX; lt._w = lt.width;
    cursorX += lt._w + 2;
    this.logoLetters.push(lt);
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
    var a = self.registry.get('audio'); if (a) { a.resume(); a.startMusic(); }
    self.scene.start('DANNYLAB_Game', { mode: self.registry.get('mode') });
  }
  function entrance(btn, idx) {
    btn.setDepth(5).setAlpha(0); btn.y += 26;
    self.tweens.add({ targets: btn, alpha: 1, y: btn.y - 26, duration: 360, delay: 460 + idx * 90, ease: 'Quad.out' });
    return btn;
  }
  entrance(UI.button(this, bx, by, bw, bh, DANNYLAB.t('play', lang), startGame, { fill: 0x46b85e }), 0);
  entrance(UI.button(this, bx, by + gap, bw, bh, DANNYLAB.t('how_to', lang), function () {
    self.scene.pause(); self.scene.launch('DANNYLAB_HowTo', { parent: 'DANNYLAB_Menu' });
  }, { fill: 0x5b8def }), 1);
  entrance(UI.button(this, bx, by + gap * 2, bw, bh, DANNYLAB.t('options', lang), function () {
    self.scene.pause(); self.scene.launch('DANNYLAB_Options', { parent: 'DANNYLAB_Menu' });
  }, { fill: 0x5b8def }), 2);
  entrance(UI.button(this, bx, by + gap * 3, bw, bh, DANNYLAB.t('exit', lang), function () {
    DANNYLAB.exitSubgame(self);
  }, { fill: 0xc05b7a }), 3);

  // ---- small collection peek (periodic-shelf) bottom corner ----
  var disc = DANNYLAB.store.getDiscovered().length;
  var total = DANNYLAB.MAX_TIER;
  var collBtn = UI.button(this, W - 92, H - 56, 150, 48,
    DANNYLAB.t('collection', lang) + ' ' + disc + '/' + total, function () {
      self.scene.pause(); self.scene.launch('DANNYLAB_Collection', { parent: 'DANNYLAB_Menu' });
    }, { fill: 0x3aa6a0, fontSize: 18 });
  collBtn.setDepth(5);

  // resume audio on first interaction (browser gesture gate)
  this.input.once('pointerdown', function () {
    var a = self.registry.get('audio'); if (a) a.resume();
  });

  this.events.on('resume', function () {
    // re-read language-sensitive labels could go here if lang changed
  });
};

DANNYLAB.MenuScene.prototype.update = function (time, delta) {
  if (this.lab) this.lab.update(delta);
  // gentle wave bob across the logo letters
  if (this.logoLetters) {
    for (var i = 0; i < this.logoLetters.length; i++) {
      var L = this.logoLetters[i];
      L.y = L._baseY + Math.sin(time * 0.003 + i * 0.5) * 4;
    }
  }
};
