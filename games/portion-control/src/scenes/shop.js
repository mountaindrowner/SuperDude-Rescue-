// shop.js - PC_Shop: the permanent Power-Ups store (WP-METASHOP).
// 2-column grid of PC.POWERUPS: icon, name, rank pips, next cost.
// Tap a cell to buy (instant, kid-friendly); purchases persist via
// PC.meta and apply at every run start.
window.PC = window.PC || {};

PC.ShopScene = function () { Phaser.Scene.call(this, { key: 'PC_Shop' }); };
PC.ShopScene.prototype = Object.create(Phaser.Scene.prototype);
PC.ShopScene.prototype.constructor = PC.ShopScene;

PC.ShopScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  this.cameras.main.setBackgroundColor(0x1b1530);

  this.add.text(W / 2, 8, 'POWER-UPS', {
    fontFamily: 'monospace', fontSize: '15px', color: '#f2c33c',
    fontStyle: 'bold', stroke: '#120e24', strokeThickness: 4,
  }).setOrigin(0.5, 0);
  this.goldText = this.add.text(W / 2, 26, '', {
    fontFamily: 'monospace', fontSize: '10px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5, 0);

  var back = this.add.text(6, 8, '< BACK', {
    fontFamily: 'monospace', fontSize: '10px', color: '#cfd4e8', fontStyle: 'bold',
  }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
  back.on('pointerdown', function () {
    if (PC.audio) PC.audio.ui();
    self.scene.start('PC_Title');
  });

  // grid
  var cols = 2, top = 42, bottom = H - 12;
  var rows = Math.ceil(PC.POWERUPS.length / cols);
  var cellW = W / cols, cellH = (bottom - top) / rows;
  this._cells = [];
  PC.POWERUPS.forEach(function (p, i) {
    var cx = ((i % cols) + 0.5) * cellW;
    var cy = top + (Math.floor(i / cols) + 0.5) * cellH;
    var panel = self.add.graphics();
    var icon = self.add.image(cx - cellW / 2 + 18, cy - 6, 'atlas', p.icon).setScale(0.5);
    var name = self.add.text(cx - cellW / 2 + 34, cy - cellH / 2 + 5, p.name, {
      fontFamily: 'monospace', fontSize: '8px', color: '#f7f4ef', fontStyle: 'bold',
    });
    var desc = self.add.text(cx - cellW / 2 + 34, cy - cellH / 2 + 16, p.desc, {
      fontFamily: 'monospace', fontSize: '6px', color: '#6d6a8e',
      wordWrap: { width: cellW - 40 },
    });
    var cost = self.add.text(cx - cellW / 2 + 34, cy + cellH / 2 - 14, '', {
      fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#f2c33c',
    });
    var zone = self.add.zone(cx, cy, cellW - 6, cellH - 4)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', function () {
      if (PC.audio) PC.audio.unlock();
      if (PC.meta.nextCost(p.id) === null) return;      // maxed
      if (PC.meta.buy(p.id)) {
        if (PC.audio) (PC.audio.chest ? PC.audio.chest() : PC.audio.ui());
        self.tweens.add({ targets: icon, scale: 0.7, duration: 110, yoyo: true });
      } else {
        if (PC.audio) PC.audio.hurt();
        self.tweens.add({ targets: cost, x: cost.x + 3, duration: 45, yoyo: true, repeat: 3 });
      }
      self.redraw();
    });
    self._cells.push({ p: p, panel: panel, cost: cost, cx: cx, cy: cy,
                       cellW: cellW, cellH: cellH });
  });
  this.redraw();
};

PC.ShopScene.prototype.redraw = function () {
  var gold = PC.meta.gold();
  this.goldText.setText('YOUR GOLD  $ ' + gold);
  this._cells.forEach(function (c) {
    var p = c.p;
    var rank = PC.meta.rank(p.id);
    var next = PC.meta.nextCost(p.id);
    var maxed = next === null;
    var afford = !maxed && gold >= next;
    c.panel.clear();
    c.panel.fillStyle(maxed ? 0x24331f : 0x241f3d, 1)
      .fillRoundedRect(c.cx - c.cellW / 2 + 3, c.cy - c.cellH / 2 + 2,
                       c.cellW - 6, c.cellH - 4, 5);
    c.panel.lineStyle(1, maxed ? 0x7dd97b : (afford ? 0xf2c33c : 0x45356e), 1)
      .strokeRoundedRect(c.cx - c.cellW / 2 + 3, c.cy - c.cellH / 2 + 2,
                         c.cellW - 6, c.cellH - 4, 5);
    // rank pips
    for (var r = 0; r < p.costs.length; r++) {
      var px = c.cx - c.cellW / 2 + 36 + r * 9;
      var py = c.cy + c.cellH / 2 - 22;
      if (r < rank) c.panel.fillStyle(0xa8e04a, 1).fillRect(px, py, 6, 3);
      else c.panel.fillStyle(0x45356e, 1).fillRect(px, py, 6, 3);
    }
    c.cost.setText(maxed ? 'MAXED!' : '$ ' + next)
      .setColor(maxed ? '#7dd97b' : (afford ? '#f2c33c' : '#6d6a8e'));
  });
};
