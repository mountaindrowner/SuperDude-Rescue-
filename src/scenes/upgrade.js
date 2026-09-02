// upgrade.js - PC_Upgrade: THE UPGRADE STATION (v0.76.0). Mark's linear
// loop: "finish the mission... you have a chance to upgrade your stuff...
// spend your tech points on passives and your money on abilities and
// weapons... every character gets their own space... then the next
// mission." One screen, two tabs, one CONTINUE:
//   PASSIVES  - PC.POWERUPS, priced in TECH (whole-team boosts)
//   GEAR      - every hero's signature weapon rank + gadgets, in GOLD
// Opens after every debrief (next = the mission map with the next brief
// auto-opened), and from the title / mission map as a plain shop.
window.PC = window.PC || {};

PC.UpgradeScene = function () { Phaser.Scene.call(this, { key: 'PC_Upgrade' }); };
PC.UpgradeScene.prototype = Object.create(Phaser.Scene.prototype);
PC.UpgradeScene.prototype.constructor = PC.UpgradeScene;

PC.UpgradeScene.prototype.init = function (data) {
  data = data || {};
  this._next = data.next || 'PC_Missions';
  this._nextData = data.nextData || undefined;
  this._earned = data.earned || null;      // { tp, gold, kills } from the mission
  this._tab = data.tab || 'passives';
  this._fromMission = !!data.earned;
};

PC.UpgradeScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this, K = PC.uiK;
  this.cameras.main.setBackgroundColor(0x161226);
  this._tabUi = [];

  // header + wallet
  var hdrG = this.add.graphics();
  PC.labPanel(hdrG, 4, 4, W - 8, K(40), { rivets: true, base: 0x1c1733, edge: 0x6d6a8e });
  this.add.text(W / 2, K(8), 'UPGRADE STATION', {
    fontFamily: 'monospace', fontSize: K(13) + 'px', color: '#f2c33c',
    fontStyle: 'bold', stroke: '#120e24', strokeThickness: 4,
  }).setOrigin(0.5, 0);
  this.tpText = this.add.text(W / 2 - K(6), K(27), '', {
    fontFamily: 'monospace', fontSize: K(9) + 'px', color: '#35d0ff', fontStyle: 'bold',
  }).setOrigin(1, 0);
  this.goldText = this.add.text(W / 2 + K(6), K(27), '', {
    fontFamily: 'monospace', fontSize: K(9) + 'px', color: '#f2c33c', fontStyle: 'bold',
  }).setOrigin(0, 0);

  // the mission payout strip (only when we came here from a mission)
  var top = K(50);
  if (this._earned) {
    var eg = this.add.graphics();
    PC.labPanel(eg, 4, top, W - 8, K(24), { base: 0x1c3320, edge: 0xa8e04a, radius: 4 });
    this.add.text(W / 2, top + K(12),
      'MISSION COMPLETE   TECH +' + (this._earned.tp || 0) + '   GOLD +$' + (this._earned.gold || 0), {
      fontFamily: 'monospace', fontSize: K(8) + 'px', color: '#a8e04a', fontStyle: 'bold',
    }).setOrigin(0.5);
    top += K(30);
  }

  // tabs
  this._tabTop = top;
  var tabH = K(20), tw = (W - 12) / 2;
  this._tabG = this.add.graphics();
  this._tabTxt = [];
  [['passives', 'PASSIVES  (TECH)', '#35d0ff'], ['gear', 'GEAR  (GOLD)', '#f2c33c']].forEach(function (t, i) {
    var x = 4 + i * (tw + 4);
    var txt = self.add.text(x + tw / 2, top + tabH / 2, t[1], {
      fontFamily: 'monospace', fontSize: K(8) + 'px', color: t[2], fontStyle: 'bold',
    }).setOrigin(0.5);
    self._tabTxt.push({ id: t[0], txt: txt, x: x, w: tw });
    var z = self.add.zone(x + tw / 2, top + tabH / 2, tw, tabH).setInteractive({ useHandCursor: true });
    z.on('pointerdown', function () {
      if (PC.audio) { PC.audio.unlock(); PC.audio.ui(); }
      self._tab = t[0]; self.buildTab();
    });
  });
  this._tabH = tabH;
  this._listTop = top + tabH + K(6);
  this._listBottom = H - K(40);

  // CONTINUE (or BACK when opened as a plain shop)
  var cg = this.add.graphics().setDepth(5);
  PC.labPanel(cg, W / 2 - K(70), H - K(34), K(140), K(26), { rivets: true, base: 0x1c3320, edge: 0xa8e04a });
  var goT = this.add.text(W / 2, H - K(21), this._fromMission ? '>> NEXT MISSION <<' : '< BACK', {
    fontFamily: 'monospace', fontSize: K(11) + 'px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(6);
  this.tweens.add({ targets: goT, alpha: 0.5, duration: 520, yoyo: true, repeat: -1 });
  var gz = this.add.zone(W / 2, H - K(21), K(150), K(32)).setDepth(7).setInteractive({ useHandCursor: true });
  gz.on('pointerdown', function () {
    if (PC.audio) { PC.audio.unlock(); PC.audio.ui(); }
    self.scene.start(self._next, self._nextData);
  });

  this.buildTab();
};

PC.UpgradeScene.prototype._clearTab = function () {
  this._tabUi.forEach(function (o) { o.destroy(); });
  this._tabUi = [];
};

PC.UpgradeScene.prototype.buildTab = function () {
  var self = this, K = PC.uiK, W = PC.RENDER.W;
  this._clearTab();
  // tab chrome
  var g = this._tabG; g.clear();
  this._tabTxt.forEach(function (t) {
    var on = t.id === self._tab;
    PC.labPanel(g, t.x, self._tabTop, t.w, self._tabH,
      { base: on ? 0x24243f : 0x171330, edge: on ? (t.id === 'gear' ? 0xf2c33c : 0x35d0ff) : 0x45356e, radius: 4 });
    t.txt.setAlpha(on ? 1 : 0.5);
  });
  if (this._tab === 'gear') this.buildGear(); else this.buildPassives();
  this.refreshWallet();
};

PC.UpgradeScene.prototype.refreshWallet = function () {
  this.tpText.setText('TECH ' + (PC.meta ? PC.meta.stat('tp') : 0));
  this.goldText.setText('$ ' + (PC.meta ? PC.meta.gold() : 0));
};

// ---- PASSIVES: the power-up grid, priced in TECH ----
PC.UpgradeScene.prototype.buildPassives = function () {
  var self = this, K = PC.uiK, W = PC.RENDER.W;
  var keep = function (o) { self._tabUi.push(o); return o; };
  keep(this.add.text(W / 2, this._listTop, 'TECH MAKES THE WHOLE TEAM TOUGHER', {
    fontFamily: 'monospace', fontSize: K(7) + 'px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(0.5, 0));
  var cols = 2, top = this._listTop + K(12), bottom = this._listBottom;
  var rows = Math.ceil(PC.POWERUPS.length / cols);
  var cellW = W / cols, cellH = (bottom - top) / rows;
  var cells = [];
  PC.POWERUPS.forEach(function (p, i) {
    var cx = ((i % cols) + 0.5) * cellW;
    var cy = top + (Math.floor(i / cols) + 0.5) * cellH;
    var panel = keep(self.add.graphics());
    var icon = keep(self.add.image(cx - cellW / 2 + K(16), cy - K(4), 'atlas', p.icon).setDisplaySize(K(22), K(22)));
    keep(self.add.text(cx - cellW / 2 + K(30), cy - cellH / 2 + K(4), p.name, {
      fontFamily: 'monospace', fontSize: K(7) + 'px', color: '#f7f4ef', fontStyle: 'bold',
    }));
    keep(self.add.text(cx - cellW / 2 + K(30), cy - cellH / 2 + K(14), p.desc, {
      fontFamily: 'monospace', fontSize: K(5.5) + 'px', color: '#8d8aa8',
      wordWrap: { width: cellW - K(36) },
    }));
    var cost = keep(self.add.text(cx - cellW / 2 + K(30), cy + cellH / 2 - K(12), '', {
      fontFamily: 'monospace', fontSize: K(7) + 'px', fontStyle: 'bold', color: '#35d0ff',
    }));
    var zone = keep(self.add.zone(cx, cy, cellW - 6, cellH - 4).setInteractive({ useHandCursor: true }));
    zone.on('pointerdown', function () {
      if (PC.audio) PC.audio.unlock();
      if (PC.meta.nextCost(p.id) === null) return;
      if (PC.meta.buy(p.id)) {
        if (PC.audio) PC.audio.levelup();
        self.tweens.add({ targets: icon, scale: icon.scale * 1.3, duration: 110, yoyo: true });
      } else {
        if (PC.audio) PC.audio.hurt();
        self.tweens.add({ targets: cost, x: cost.x + 3, duration: 45, yoyo: true, repeat: 3 });
      }
      redraw();
    });
    cells.push({ p: p, panel: panel, cost: cost, cx: cx, cy: cy, cellW: cellW, cellH: cellH });
  });
  var redraw = function () {
    var tp = PC.meta.stat('tp');
    cells.forEach(function (c) {
      var rank = PC.meta.rank(c.p.id), next = PC.meta.nextCost(c.p.id);
      var maxed = next === null, afford = !maxed && tp >= next;
      c.panel.clear();
      PC.labPanel(c.panel, c.cx - c.cellW / 2 + 3, c.cy - c.cellH / 2 + 2, c.cellW - 6, c.cellH - 4,
        { base: maxed ? 0x1c3320 : 0x241f3d, rivets: true,
          edge: maxed ? 0x7dd97b : (afford ? 0x35d0ff : 0x45356e) });
      for (var r = 0; r < c.p.costs.length; r++) {
        c.panel.fillStyle(r < rank ? 0xa8e04a : 0x45356e, 1)
          .fillRect(c.cx - c.cellW / 2 + K(32) + r * K(8), c.cy + c.cellH / 2 - K(19), K(6), K(3));
      }
      c.cost.setText(maxed ? 'MAXED!' : next + ' TECH')
        .setColor(maxed ? '#7dd97b' : (afford ? '#35d0ff' : '#6d6a8e'));
    });
    self.refreshWallet();
  };
  redraw();
};

// ---- GEAR: every hero's own signature rank + gadgets, priced in GOLD ----
PC.UpgradeScene.prototype.buildGear = function () {
  var self = this, K = PC.uiK, W = PC.RENDER.W;
  var keep = function (o) { self._tabUi.push(o); return o; };
  keep(this.add.text(W / 2, this._listTop, 'GOLD LEVELS EACH HERO\'S OWN SIGNATURE WEAPON', {
    fontFamily: 'monospace', fontSize: K(7) + 'px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(0.5, 0));
  var listTop = this._listTop + K(12), bottom = this._listBottom;
  var rowsUi = [];
  // gadget strip (the Hydro-Drill, once the Labs are cleared)
  var showGear = PC.meta && PC.meta.stat('clear_stage6');
  var gearUi = null;
  if (showGear) {
    var gearH = K(30), gy = listTop;
    var gg = keep(this.add.graphics());
    keep(this.add.image(K(20), gy + gearH / 2, 'atlas', 'icon_weapon_cutter').setDisplaySize(K(18), K(18)));
    var gn = keep(this.add.text(K(34), gy + K(4), '', { fontFamily: 'monospace', fontSize: K(8) + 'px', color: '#f7f4ef', fontStyle: 'bold' }));
    var gd = keep(this.add.text(K(34), gy + K(15), '', { fontFamily: 'monospace', fontSize: K(6) + 'px', color: '#8d8aa8', wordWrap: { width: W - K(110) } }));
    var gc = keep(this.add.text(W - K(8), gy + K(4), '', { fontFamily: 'monospace', fontSize: K(8) + 'px', color: '#f2c33c', fontStyle: 'bold' }).setOrigin(1, 0));
    var gzn = keep(this.add.zone(W / 2, gy + gearH / 2, W - 8, gearH).setInteractive({ useHandCursor: true }));
    gzn.on('pointerdown', function () {
      if (PC.audio) PC.audio.unlock();
      if (PC.GARAGE.buyGear('hydrodrill')) { if (PC.audio) PC.audio.levelup(); redraw(); }
      else if (PC.audio) PC.audio.hurt();
    });
    gearUi = { g: gg, name: gn, desc: gd, cost: gc, y: gy, h: gearH };
    listTop = gy + gearH + K(4);
  }
  var rowH = Math.min(K(56), (bottom - listTop) / PC.ROSTER.length);
  var top = listTop + Math.max(0, (bottom - listTop - rowH * PC.ROSTER.length) / 2);
  PC.ROSTER.forEach(function (hero, i) {
    var y = top + i * rowH;
    var unlocked = PC.heroUnlocked(hero.id);
    var panel = keep(self.add.graphics());
    var portrait = keep(self.add.image(K(22), y + rowH / 2 - 2, 'atlas', 'portrait_' + hero.id).setDisplaySize(K(30), K(30)));
    if (!unlocked) portrait.setTint(0x241f3d).setAlpha(0.35);
    var name = keep(self.add.text(K(42), y + K(4), '', { fontFamily: 'monospace', fontSize: K(8) + 'px', color: '#f7f4ef', fontStyle: 'bold' }));
    var kit = keep(self.add.text(K(42), y + K(14), '', { fontFamily: 'monospace', fontSize: K(6.5) + 'px', color: '#35d0ff' }));
    var eff = keep(self.add.text(K(42), y + K(23), '', { fontFamily: 'monospace', fontSize: K(6) + 'px', color: '#8d8aa8', wordWrap: { width: W - K(120) } }));
    var pips = keep(self.add.graphics());
    var cost = keep(self.add.text(W - K(8), y + K(4), '', { fontFamily: 'monospace', fontSize: K(8) + 'px', color: '#f2c33c', fontStyle: 'bold' }).setOrigin(1, 0));
    var zone = keep(self.add.zone(W / 2, y + rowH / 2, W - 8, rowH - 4).setInteractive({ useHandCursor: true }));
    zone.on('pointerdown', function () {
      if (!PC.heroUnlocked(hero.id)) { if (PC.audio) PC.audio.hurt(); return; }
      if (PC.audio) PC.audio.unlock();
      if (PC.GARAGE.buy(hero.id)) { if (PC.audio) PC.audio.levelup(); redraw(); }
      else if (PC.audio) PC.audio.hurt();
    });
    rowsUi.push({ hero: hero, panel: panel, name: name, kit: kit, eff: eff, pips: pips, cost: cost, y: y, rowH: rowH });
  });
  var redraw = function () {
    var gold = PC.meta.gold();
    if (gearUi) {
      var gear = PC.GARAGE.gearById('hydrodrill'), owned = PC.GARAGE.hasGear('hydrodrill');
      var affordG = !owned && gold >= gear.cost;
      gearUi.g.clear();
      PC.labPanel(gearUi.g, 4, gearUi.y, W - 8, gearUi.h,
        { base: owned ? 0x1c3320 : (affordG ? 0x33240f : 0x1f1b35), edge: owned ? 0xa8e04a : (affordG ? 0xf2c33c : 0x45356e), radius: 5 });
      gearUi.name.setText(gear.name + (owned ? '  - OWNED' : '')).setColor(owned ? '#a8e04a' : '#f7f4ef');
      gearUi.desc.setText(gear.desc);
      gearUi.cost.setText(owned ? 'OK' : '$ ' + gear.cost).setColor(owned ? '#a8e04a' : affordG ? '#f2c33c' : '#6d6a8e');
    }
    rowsUi.forEach(function (r) {
      var id = r.hero.id, unlocked = PC.heroUnlocked(id);
      var rank = PC.GARAGE.rank(id), next = PC.GARAGE.nextCost(id);
      var afford = unlocked && next !== null && gold >= next;
      r.panel.clear();
      PC.labPanel(r.panel, 4, r.y, W - 8, r.rowH - 4,
        { base: unlocked ? (afford ? 0x2a2438 : 0x1f1b35) : 0x171330, edge: afford ? 0xf2c33c : 0x45356e, radius: 5 });
      r.name.setText(unlocked ? r.hero.name : '???').setColor(unlocked ? '#f7f4ef' : '#45356e');
      var kitName = (PC.KITS && PC.KITS[id]) ? PC.KITS[id].kitName : '';
      r.kit.setText(unlocked ? kitName : 'RESCUE THEM FIRST').setColor(unlocked ? '#35d0ff' : '#45356e');
      r.eff.setText(unlocked ? PC.GARAGE.nextDesc(id) : '');
      r.cost.setText(!unlocked ? '' : next === null ? 'MAX' : '$ ' + next)
        .setColor(next === null ? '#a8e04a' : afford ? '#f2c33c' : '#6d6a8e');
      r.pips.clear();
      for (var p = 0; p < PC.GARAGE.maxRank(); p++) {
        r.pips.fillStyle(p < rank ? 0xf2c33c : 0x45356e, 1)
          .fillRect(W - K(8) - (PC.GARAGE.maxRank() - p) * K(9), r.y + K(17), K(7), K(3));
      }
    });
    self.refreshWallet();
  };
  redraw();
};
