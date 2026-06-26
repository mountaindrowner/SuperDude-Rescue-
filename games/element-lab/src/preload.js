// preload.js — DANNYLAB_Preload. Generates all textures procedurally and
// waits for the display font, then → Menu. (No binary assets to load.)
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.PreloadScene = function () {
  Phaser.Scene.call(this, { key: 'DANNYLAB_Preload' });
};
DANNYLAB.PreloadScene.prototype = Object.create(Phaser.Scene.prototype);
DANNYLAB.PreloadScene.prototype.constructor = DANNYLAB.PreloadScene;

DANNYLAB.PreloadScene.prototype.create = function () {
  var cam = this.cameras.main;
  cam.setBackgroundColor('#0c1430');

  // simple loading flask text while the font settles
  var t = this.add.text(cam.width / 2, cam.height / 2, 'ELEMENT LAB', {
    fontFamily: '"Baloo 2", system-ui, sans-serif', fontSize: '40px',
    color: '#7CFF6B', fontStyle: 'bold',
  }).setOrigin(0.5);
  this.tweens.add({ targets: t, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });

  // build textures now (one-time, synchronous)
  DANNYLAB.buildTextures(this);

  var self = this;
  var go = function () { self.scene.start('DANNYLAB_Menu'); };

  // wait for the web font so titles/score render in the right typeface,
  // with a hard timeout so we never hang on a flaky font load.
  var done = false;
  var finish = function () { if (done) return; done = true; go(); };
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('bold 40px "Baloo 2"').then(function () {
      document.fonts.ready.then(function () { self.time.delayedCall(120, finish); });
    }).catch(function () { finish(); });
  }
  this.time.delayedCall(1500, finish); // safety net
};
