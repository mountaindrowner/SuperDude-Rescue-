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
    var s = this.add.image(W * sp.x, H * sp.y, DANNYLAB.ballKey(this, sp.t))
      .setDepth(-10).setAlpha(0.85);
    s.setDisplaySize(56, 56);
    this.tweens.add({ targets: s, y: s.y - 12, duration: 1500 + i * 170, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: s, x: s.x + (sp.x < 0.5 ? 9 : -9), duration: 2300 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  // ---- logo ----
  var topper = this.add.text(W / 2, H * 0.16, DANNYLAB.t('title_topper', lang), {
    fontFamily: UI.DISPLAY, fontSize: '26px', color: '#FBD38D', fontStyle: 'bold',
  }).setOrigin(0.5);
  var logo = this.add.text(W / 2, H * 0.24, DANNYLAB.t('title_logo', lang), {
    fontFamily: UI.DISPLAY, fontSize: '62px', color: '#7CFF6B', fontStyle: 'bold',
  }).setOrigin(0.5);
  logo.setShadow(0, 4, 'rgba(124,255,107,0.45)', 12);
  this.tweens.add({ targets: logo, scaleX: 1.04, scaleY: 1.04, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  topper.setDepth(5); logo.setDepth(5);

  // ---- 4 chunky buttons ----
  var self = this;
  var bx = W / 2, by = H * 0.45, bw = Math.min(360, W * 0.74), bh = 72, gap = 88;
  function startGame() {
    var a = self.registry.get('audio'); if (a) { a.resume(); a.startMusic(); }
    self.scene.start('DANNYLAB_Game', { mode: self.registry.get('mode') });
  }
  UI.button(this, bx, by, bw, bh, DANNYLAB.t('play', lang), startGame, { fill: 0x46b85e }).setDepth(5);
  UI.button(this, bx, by + gap, bw, bh, DANNYLAB.t('how_to', lang), function () {
    self.scene.pause(); self.scene.launch('DANNYLAB_HowTo', { parent: 'DANNYLAB_Menu' });
  }, { fill: 0x5b8def }).setDepth(5);
  UI.button(this, bx, by + gap * 2, bw, bh, DANNYLAB.t('options', lang), function () {
    self.scene.pause(); self.scene.launch('DANNYLAB_Options', { parent: 'DANNYLAB_Menu' });
  }, { fill: 0x5b8def }).setDepth(5);
  UI.button(this, bx, by + gap * 3, bw, bh, DANNYLAB.t('exit', lang), function () {
    DANNYLAB.exitSubgame(self);
  }, { fill: 0xc05b7a }).setDepth(5);

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
};
