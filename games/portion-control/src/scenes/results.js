// results.js - PC_Results: run summary (COMPENDIUM 10). Win = "District
// Cleared!" with the rescued hero + confetti; lose = "Overwhelmed!".
window.PC = window.PC || {};

PC.ResultsScene = function () { Phaser.Scene.call(this, { key: 'PC_Results' }); };
PC.ResultsScene.prototype = Object.create(Phaser.Scene.prototype);
PC.ResultsScene.prototype.constructor = PC.ResultsScene;

PC.ResultsScene.prototype.init = function (data) { this.data2 = data || {}; };

PC.ResultsScene.prototype.create = function () {
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  var d = this.data2, win = !!d.win;
  this.cameras.main.setBackgroundColor(win ? 0x142a1a : 0x1b1530);
  var m = Math.floor((d.time || 0) / 60), s = Math.floor((d.time || 0) % 60);

  if (win) {
    // confetti rain
    this._confetti = [];
    var COLORS = [0xa8e04a, 0xf2c33c, 0x35d0ff, 0xff6b6b, 0xff9ecb];
    for (var i = 0; i < 60; i++) {
      var c = this.add.rectangle(Math.random() * W, Math.random() * -H, 4, 6,
        COLORS[(Math.random() * COLORS.length) | 0]).setDepth(1);
      c._vy = 40 + Math.random() * 80; c._vx = (Math.random() - 0.5) * 30;
      this._confetti.push(c);
    }
    this.add.text(W / 2, H * 0.16, 'DISTRICT\nCLEARED!', {
      fontFamily: 'monospace', fontSize: '26px', color: '#a8e04a', fontStyle: 'bold',
      align: 'center', stroke: '#0a1a0a', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2);
    // the rescued hero, framed
    this.add.image(W / 2, H * 0.42, 'atlas', PC.D1_RESCUE.art).setScale(1.2).setDepth(2);
    this.add.text(W / 2, H * 0.56, (d.rescued || 'A TEAMMATE') + '\nJOINED THE TEAM!', {
      fontFamily: 'monospace', fontSize: '11px', color: '#f2c33c', fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(2);
  } else {
    this.add.text(W / 2, H * 0.2, 'OVERWHELMED!', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ff6b6b', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.image(W / 2, H * 0.4, 'atlas', 'portrait_danny').setScale(0.6);
  }

  this.add.text(W / 2, H * 0.68,
    'TIME  ' + m + ':' + (s < 10 ? '0' : '') + s +
    '\nPOPS  ' + (d.kills || 0) +
    '\nLEVEL ' + (d.level || 1) +
    '\nGOLD  $ ' + (d.gold || 0), {
    fontFamily: 'monospace', fontSize: '12px', color: '#cfd4e8', align: 'center', lineSpacing: 4,
  }).setOrigin(0.5).setDepth(2);

  var again = this.add.text(W / 2, H * 0.88, win ? 'TAP TO PLAY AGAIN' : 'TAP TO TRY AGAIN', {
    fontFamily: 'monospace', fontSize: '12px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(2);
  this.tweens.add({ targets: again, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

  if (win && PC.audio) PC.audio.levelup();

  var go = function () {
    if (PC.audio) { PC.audio.ui(); PC.audio.startMusic(); }
    self.scene.start('PC_Game');
  };
  this.time.delayedCall(700, function () {
    self.input.once('pointerdown', go);
    self.input.keyboard.once('keydown', go);
  });
};

PC.ResultsScene.prototype.update = function (time, delta) {
  if (!this._confetti) return;
  var dt = delta / 1000, H = PC.RENDER.H;
  for (var i = 0; i < this._confetti.length; i++) {
    var c = this._confetti[i];
    c.y += c._vy * dt; c.x += c._vx * dt; c.angle += 180 * dt;
    if (c.y > H + 10) { c.y = -10; c.x = Math.random() * PC.RENDER.W; }
  }
};
