// garage.js - PC_Garage: the SUPER DUDE GARAGE storefront (v0.20.0).
// Spends TECH POINTS on hero signature levels (data/garage.js). Opens
// two ways: from the mission map, or by walking into the Garage
// landmark in-world (overlay mode - the run pauses behind it, nothing
// is lost). Layout mirrors PC_Shop so the two stores feel like a pair.
window.PC = window.PC || {};

PC.GarageScene = function () { Phaser.Scene.call(this, { key: 'PC_Garage' }); };
PC.GarageScene.prototype = Object.create(Phaser.Scene.prototype);
PC.GarageScene.prototype.constructor = PC.GarageScene;

PC.GarageScene.prototype.init = function (data) {
  data = data || {};
  this._back = data.back || 'PC_Missions';
  this._overlay = !!data.overlay;          // launched over a paused run
  this._resume = data.resume || 'PC_Game';
};

PC.GarageScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  this.cameras.main.setBackgroundColor(0x161226);

  // header
  var hdrG = this.add.graphics();
  PC.labPanel(hdrG, 4, 4, W - 8, 36, { rivets: true, base: 0x1c1733, edge: 0x6d6a8e });
  this.add.text(W / 2, 7, 'SUPER DUDE GARAGE', {
    fontFamily: 'monospace', fontSize: '13px', color: '#35d0ff',
    fontStyle: 'bold', stroke: '#120e24', strokeThickness: 4,
  }).setOrigin(0.5, 0);
  this.tpText = this.add.text(W / 2, 25, '', {
    fontFamily: 'monospace', fontSize: '10px', color: '#f2c33c', fontStyle: 'bold',
  }).setOrigin(0.5, 0);

  var back = this.add.text(6, 8, '< BACK', {
    fontFamily: 'monospace', fontSize: '10px', color: '#cfd4e8', fontStyle: 'bold',
  }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
  back.on('pointerdown', function () {
    if (PC.audio) PC.audio.ui();
    self.close();
  });

  this.add.text(W / 2, 44, 'TECH POINTS LEVEL YOUR OWN SIGNATURE GEAR', {
    fontFamily: 'monospace', fontSize: '7px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(0.5, 0);

  // one row per hero
  var listTop = 56, bottom = H - 10;
  var rowH = Math.min(72, (bottom - listTop) / PC.ROSTER.length);
  // centre the block so tall phones don't leave a dead half-screen
  var top = listTop + Math.max(0, (bottom - listTop - rowH * PC.ROSTER.length) / 2);
  this._rows = [];
  PC.ROSTER.forEach(function (hero, i) {
    var y = top + i * rowH;
    var unlocked = PC.heroUnlocked(hero.id);
    var panel = self.add.graphics();
    var portrait = self.add.image(24, y + rowH / 2 - 2, 'atlas', 'portrait_' + hero.id)
      .setScale(34 / 128);
    if (!unlocked) portrait.setTint(0x241f3d).setAlpha(0.35);   // no face spoilers
    var name = self.add.text(46, y + 5, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#f7f4ef', fontStyle: 'bold',
    });
    var kit = self.add.text(46, y + 17, '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#35d0ff',
    });
    var eff = self.add.text(46, y + 28, '', {
      fontFamily: 'monospace', fontSize: '7px', color: '#6d6a8e',
      wordWrap: { width: W - 56 },
    });
    var pips = self.add.graphics();
    var cost = self.add.text(W - 8, y + 5, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#f2c33c', fontStyle: 'bold',
    }).setOrigin(1, 0);
    var zone = self.add.zone(W / 2, y + rowH / 2, W - 8, rowH - 4)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', function () {
      if (!PC.heroUnlocked(hero.id)) { if (PC.audio) PC.audio.hurt(); return; }
      if (PC.audio) PC.audio.unlock();
      if (PC.GARAGE.buy(hero.id)) {
        if (PC.audio) { PC.audio.levelup(); }
        self.refresh();
      } else if (PC.audio) { PC.audio.hurt(); }
    });
    self._rows.push({ hero: hero, panel: panel, name: name, kit: kit, eff: eff,
                      pips: pips, cost: cost, y: y, rowH: rowH });
  });

  this.refresh();
};

PC.GarageScene.prototype.refresh = function () {
  var W = PC.RENDER.W;
  this.tpText.setText('TECH POINTS:  ' + PC.GARAGE.tp() + ' TP');
  this._rows.forEach(function (r) {
    var id = r.hero.id;
    var unlocked = PC.heroUnlocked(id);
    var rank = PC.GARAGE.rank(id);
    var next = PC.GARAGE.nextCost(id);
    var afford = unlocked && next !== null && PC.GARAGE.tp() >= next;
    r.panel.clear();
    PC.labPanel(r.panel, 4, r.y, W - 8, r.rowH - 4, {
      base: unlocked ? (afford ? 0x24243f : 0x1f1b35) : 0x171330,
      edge: afford ? 0x35d0ff : 0x45356e, radius: 5,
    });
    r.name.setText(unlocked ? r.hero.name : '???')
      .setColor(unlocked ? '#f7f4ef' : '#45356e');
    var kitName = (PC.KITS && PC.KITS[id]) ? PC.KITS[id].kitName : '';
    r.kit.setText(unlocked ? kitName : 'RESCUE THEM FIRST')
      .setColor(unlocked ? '#35d0ff' : '#45356e');
    r.eff.setText(unlocked ? PC.GARAGE.nextDesc(id) : '');
    r.cost.setText(!unlocked ? '' : next === null ? 'MAX' : next + ' TP')
      .setColor(next === null ? '#a8e04a' : afford ? '#f2c33c' : '#6d6a8e');
    // level pips: filled = ranks bought, hollow = buyable
    var g = r.pips; g.clear();
    if (!unlocked) return;
    for (var p = 0; p < PC.GARAGE.maxRank(); p++) {
      var px = W - 12 - (PC.GARAGE.maxRank() - p) * 12;
      var py = r.y + r.rowH - 20;
      if (p < rank) g.fillStyle(0x35d0ff, 1).fillRect(px, py, 9, 7);
      else g.fillStyle(0x120e24, 1).fillRect(px, py, 9, 7);
      g.lineStyle(1, 0x45356e, 1).strokeRect(px, py, 9, 7);
    }
    var lvl = 1 + rank;
    g.fillStyle(0xffffff, 0.001).fillRect(0, 0, 1, 1);   // keep the object alive
    r.name.setText((unlocked ? r.hero.name : '???') + '   LV ' + lvl);
  });
};

PC.GarageScene.prototype.close = function () {
  if (this._overlay) {
    this.scene.stop();
    this.scene.resume(this._resume);
    return;
  }
  this.scene.start(this._back);
};
