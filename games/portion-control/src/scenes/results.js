// results.js - PC_Results: run summary (COMPENDIUM 10). Lose flavor for
// M3 ("Overwhelmed!"); the win path arrives with the M5 boss.
window.PC = window.PC || {};

PC.ResultsScene = function () { Phaser.Scene.call(this, { key: 'PC_Results' }); };
PC.ResultsScene.prototype = Object.create(Phaser.Scene.prototype);
PC.ResultsScene.prototype.constructor = PC.ResultsScene;

PC.ResultsScene.prototype.init = function (data) { this.data2 = data || {}; };

PC.ResultsScene.prototype.create = function () {
  var W = PC.RENDER.W, H = PC.RENDER.H;
  this.cameras.main.setBackgroundColor(0x1b1530);
  var d = this.data2;
  var m = Math.floor((d.time || 0) / 60), s = Math.floor((d.time || 0) % 60);

  this.add.text(W / 2, H * 0.22, 'OVERWHELMED!', {
    fontFamily: 'monospace', fontSize: '22px', color: '#ff6b6b', fontStyle: 'bold',
  }).setOrigin(0.5);
  this.add.image(W / 2, H * 0.42, 'atlas', 'portrait_danny').setScale(0.6);
  this.add.text(W / 2, H * 0.62,
    'TIME  ' + m + ':' + (s < 10 ? '0' : '') + s +
    '\nPOPS  ' + (d.kills || 0) +
    '\nLEVEL ' + (d.level || 1), {
    fontFamily: 'monospace', fontSize: '12px', color: '#cfd4e8', align: 'center', lineSpacing: 4,
  }).setOrigin(0.5);
  var again = this.add.text(W / 2, H * 0.85, 'TAP TO TRY AGAIN', {
    fontFamily: 'monospace', fontSize: '12px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5);
  this.tweens.add({ targets: again, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

  var self = this;
  var go = function () {
    if (PC.audio) { PC.audio.ui(); PC.audio.startMusic(); }
    self.scene.start('PC_Game');
  };
  this.time.delayedCall(600, function () {
    self.input.once('pointerdown', go);
    self.input.keyboard.once('keydown', go);
  });
};
