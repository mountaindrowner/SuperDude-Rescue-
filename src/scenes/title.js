// title.js - PC_Title: the meta hub (WP-METASHOP entry / WP-COLLECTIONS
// seed). Wordmark, START -> hero select, POWER-UPS -> shop, gold balance.
// Boot lands here; select's BACK returns here.
window.PC = window.PC || {};

PC.TitleScene = function () { Phaser.Scene.call(this, { key: 'PC_Title' }); };
PC.TitleScene.prototype = Object.create(Phaser.Scene.prototype);
PC.TitleScene.prototype.constructor = PC.TitleScene;

PC.TitleScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  this.cameras.main.setBackgroundColor(0x1b1530);

  // starfield-ish crumbs so the screen isn't dead
  var g = this.add.graphics();
  for (var i = 0; i < 40; i++) {
    g.fillStyle(i % 3 ? 0x45356e : 0x6d6a8e, 0.7)
      .fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  var title1 = this.add.text(W / 2, H * 0.16, 'PORTION', {
    fontFamily: 'monospace', fontSize: '34px', color: '#f2c33c',
    fontStyle: 'bold', stroke: '#120e24', strokeThickness: 6,
  }).setOrigin(0.5);
  var title2 = this.add.text(W / 2, H * 0.16 + 30, 'CONTROL', {
    fontFamily: 'monospace', fontSize: '34px', color: '#35d0ff',
    fontStyle: 'bold', stroke: '#120e24', strokeThickness: 6,
  }).setOrigin(0.5);
  this.add.text(W / 2, H * 0.16 + 52, 'A SUPER DUDE ADVENTURE', {
    fontFamily: 'monospace', fontSize: '8px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(0.5);
  this.tweens.add({ targets: [title1, title2], y: '-=3', duration: 1400,
    yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  // the crew, watching you from the marquee
  var heroes = ['danny', 'victoria', 'nayah', 'kevin', 'carlos', 'josh'];
  var pw = 34, gap = 8;
  var x0 = W / 2 - (heroes.length * (pw + gap) - gap) / 2 + pw / 2;
  heroes.forEach(function (h, i) {
    var img = self.add.image(x0 + i * (pw + gap), H * 0.42, 'atlas', 'portrait_' + h)
      .setScale(pw / 128);
    self.add.graphics().lineStyle(1, 0x45356e, 1)
      .strokeRect(img.x - pw / 2 - 1, img.y - pw / 2 - 1, pw + 2, pw + 2);
    self.tweens.add({ targets: img, y: img.y - 2, duration: 900 + i * 120,
      yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  });

  function button(y, label, color, fn) {
    var t = self.add.text(W / 2, y, label, {
      fontFamily: 'monospace', fontSize: '15px', color: color, fontStyle: 'bold',
      stroke: '#120e24', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerdown', function () {
      if (PC.audio) { PC.audio.unlock(); PC.audio.ui(); }
      fn();
    });
    return t;
  }
  var start = button(H * 0.60, '>> START <<', '#a8e04a', function () {
    self.scene.start('PC_Select');
  });
  this.tweens.add({ targets: start, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
  button(H * 0.71, '[ POWER-UPS ]', '#f2c33c', function () {
    self.scene.start('PC_Shop');
  });

  this.goldText = this.add.text(W / 2, H * 0.80, '$ ' + PC.meta.gold(), {
    fontFamily: 'monospace', fontSize: '11px', color: '#f2c33c', fontStyle: 'bold',
  }).setOrigin(0.5);
};
