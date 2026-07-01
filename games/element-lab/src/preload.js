// preload.js — DANNYLAB_Preload. Generates all textures procedurally and
// waits for the display font, then → Menu. (No binary assets to load.)
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.PreloadScene = function () {
  Phaser.Scene.call(this, { key: 'DANNYLAB_Preload' });
};
DANNYLAB.PreloadScene.prototype = Object.create(Phaser.Scene.prototype);
DANNYLAB.PreloadScene.prototype.constructor = DANNYLAB.PreloadScene;

// Load the PixelLab art skin (atoms + lab background). If any file is missing
// the loader just skips it and the game falls back to procedural art, so the
// whole skin can be reverted by deleting assets/px/*.
DANNYLAB.PreloadScene.prototype.preload = function () {
  this.load.image('px_bg', 'assets/px/bg.png');
  for (var t = 1; t <= DANNYLAB.MAX_TIER; t++) {
    this.load.image('px_ball_' + t, 'assets/px/ball_' + t + '.png');
  }
  // collectible card art (fronts + shared back)
  if (DANNYLAB.CARDS) {
    for (var ci = 0; ci < DANNYLAB.CARDS.length; ci++) this.load.image('card_' + DANNYLAB.CARDS[ci].key, DANNYLAB.CARDS[ci].file);
    this.load.image('card_back', DANNYLAB.CARD_BACK);
  }
  this.load.on('loaderror', function () { /* ignore: fall back to procedural */ });
};

DANNYLAB.PreloadScene.prototype.create = function () {
  DANNYLAB.applyRes(this);
  var cam = this.cameras.main;
  cam.setBackgroundColor('#0c1430');

  // simple loading flask text while the font settles
  var t = this.add.text(DANNYLAB.GEO.W / 2, DANNYLAB.GEO.H / 2, 'ELEMENT LAB', {
    fontFamily: '"Baloo 2", system-ui, sans-serif', fontSize: '40px',
    color: '#7CFF6B', fontStyle: 'bold',
  }).setOrigin(0.5);
  this.tweens.add({ targets: t, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });

  // build textures now (one-time, synchronous)
  DANNYLAB.buildTextures(this);
  DANNYLAB.buildJellyTextures(this);

  // prefetch + decode the soundtrack: the intro theme for the menu and four
  // rotating "elements" tracks for gameplay. Each decodes in the background and
  // swaps in when ready; until then the synth arpeggio covers (Brief §11).
  var audio = this.registry.get('audio');
  if (audio) {
    audio.loadTrack('intro', 'assets/audio/intro.mp3');
    DANNYLAB.GAME_TRACKS.forEach(function (name) {
      audio.loadTrack(name, 'assets/audio/' + name + '.mp3');
    });
  }

  var self = this;
  var go = function () { self.scene.start('DANNYLAB_Menu'); };

  // wait for the web font so titles/score render in the right typeface,
  // with a hard timeout so we never hang on a flaky font load.
  var done = false;
  var finish = function () { if (done) return; done = true; go(); };
  if (document.fonts && document.fonts.ready) {
    Promise.all([
      document.fonts.load('bold 40px "Baloo 2"'),
      document.fonts.load('700 40px "Pixelify Sans"'),
    ]).then(function () {
      document.fonts.ready.then(function () { self.time.delayedCall(120, finish); });
    }).catch(function () { finish(); });
  }
  this.time.delayedCall(1500, finish); // safety net
};
