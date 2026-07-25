// select.js - PC_Select: hero picker. Portrait-first 2-column grid of
// the 6 roster heroes (PC.ROSTER), idle sprites at select-screen scale
// with a slow bob, name + role labels, gold highlight ring on the
// current pick. Tap a hero -> persist to localStorage -> start the run.
// Kits are not implemented yet - every hero runs the default loadout,
// so selection is purely visual until the kit milestone lands.
window.PC = window.PC || {};

PC.SelectScene = function () { Phaser.Scene.call(this, { key: 'PC_Select' }); };
PC.SelectScene.prototype = Object.create(Phaser.Scene.prototype);
PC.SelectScene.prototype.constructor = PC.SelectScene;

PC.SelectScene.prototype.create = function () {
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  this.cameras.main.setBackgroundColor(0x1b1530);

  this.add.text(W / 2, H * 0.045, 'CHOOSE YOUR HERO', {
    fontFamily: 'monospace', fontSize: '16px', color: '#f2c33c',
    fontStyle: 'bold', stroke: '#120e24', strokeThickness: 4,
  }).setOrigin(0.5, 0);

  var cols = W >= H ? 3 : 2;
  var rows = Math.ceil(PC.ROSTER.length / cols);
  var top = H * 0.12, bottom = H * 0.94;
  var cellW = W / cols, cellH = (bottom - top) / rows;
  var picked = PC.selectedHero().id;
  this._cells = [];

  PC.ROSTER.forEach(function (hero, i) {
    var cx = ((i % cols) + 0.5) * cellW;
    var cy = top + (Math.floor(i / cols) + 0.55) * cellH;

    var ring = self.add.graphics();
    var img = self.add.image(cx, cy - 8, 'atlas', hero.art + '_idle')
      .setScale(hero.scale * 1.05);
    self.tweens.add({ targets: img, y: cy - 11, duration: 900 + i * 90,
      yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    self.add.text(cx, cy + cellH * 0.26, hero.name, {
      fontFamily: 'monospace', fontSize: '11px', color: '#f7f4ef', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    self.add.text(cx, cy + cellH * 0.26 + 13, hero.role, {
      fontFamily: 'monospace', fontSize: '8px', color: '#6d6a8e',
    }).setOrigin(0.5, 0);

    var zone = self.add.zone(cx, cy + cellH * 0.05, cellW * 0.92, cellH * 0.92)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', function () {
      if (picked === hero.id) { self.launch(hero); return; }
      picked = hero.id;
      try { localStorage.setItem('portioncontrol.hero', hero.id); } catch (e) {}
      if (PC.audio) PC.audio.ui();
      self.redraw(picked);
    });

    self._cells.push({ hero: hero, ring: ring, cx: cx, cy: cy, cellW: cellW, cellH: cellH });
  });

  var go = this.add.text(W / 2, H * 0.985, 'TAP YOUR HERO AGAIN TO START', {
    fontFamily: 'monospace', fontSize: '10px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5, 1);
  this.tweens.add({ targets: go, alpha: 0.35, duration: 550, yoyo: true, repeat: -1 });

  this.redraw(picked);
};

PC.SelectScene.prototype.redraw = function (picked) {
  this._cells.forEach(function (c) {
    c.ring.clear();
    var sel = c.hero.id === picked;
    c.ring.lineStyle(2, sel ? 0xf2c33c : 0x45356e, 1);
    var w = c.cellW * 0.86, h = c.cellH * 0.88;
    c.ring.strokeRoundedRect(c.cx - w / 2, c.cy - h * 0.52, w, h, 8);
    if (sel) {
      c.ring.lineStyle(1, 0xfff3c4, 0.5);
      c.ring.strokeRoundedRect(c.cx - w / 2 - 2, c.cy - h * 0.52 - 2, w + 4, h + 4, 9);
    }
  });
};

PC.SelectScene.prototype.launch = function (hero) {
  try { localStorage.setItem('portioncontrol.hero', hero.id); } catch (e) {}
  if (PC.audio) { PC.audio.ui(); PC.audio.startMusic(); }
  this.scene.start('PC_Game');
};
