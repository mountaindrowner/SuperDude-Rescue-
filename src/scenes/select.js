// select.js - PC_Select: hero picker. Portrait-first 2-column grid of
// the 6 roster heroes (PC.ROSTER), idle sprites with a slow bob, name +
// role + kit labels, gold ring on the pick, locked heroes as silhouettes
// (kits.js unlock meta). Tap to select, tap again to start. Also hosts
// the [ AUDIO ] mix panel.
window.PC = window.PC || {};

PC.SelectScene = function () { Phaser.Scene.call(this, { key: 'PC_Select' }); };
PC.SelectScene.prototype = Object.create(Phaser.Scene.prototype);
PC.SelectScene.prototype.constructor = PC.SelectScene;

PC.SelectScene.prototype.create = function () {
  PC.applyRenderScale(this);
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
    var unlocked = PC.heroUnlocked(hero.id);

    var ring = self.add.graphics();
    var img = self.add.image(cx, cy - 8, 'atlas', hero.art + '_idle')
      .setScale(hero.scale * 1.05);
    if (unlocked) {
      self.tweens.add({ targets: img, y: cy - 11, duration: 900 + i * 90,
        yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    } else {
      img.setTintFill(0x2a2544);          // locked silhouette
    }

    self.add.text(cx, cy + cellH * 0.26, unlocked ? hero.name : '???', {
      fontFamily: 'monospace', fontSize: '11px', color: unlocked ? '#f7f4ef' : '#45356e',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    self.add.text(cx, cy + cellH * 0.26 + 13,
      unlocked ? (PC.KITS && PC.KITS[hero.id] ? hero.role + ' - ' + PC.KITS[hero.id].kitName : hero.role)
               : 'RESCUE TO UNLOCK', {
      fontFamily: 'monospace', fontSize: '8px', color: '#6d6a8e',
    }).setOrigin(0.5, 0);

    if (unlocked) {
      var zone = self.add.zone(cx, cy + cellH * 0.05, cellW * 0.92, cellH * 0.92)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', function () {
        if (picked === hero.id) { self.launch(hero); return; }
        picked = hero.id;
        try { localStorage.setItem('portioncontrol.hero', hero.id); } catch (e) {}
        if (PC.audio) PC.audio.ui();
        self.redraw(picked);
      });
    }

    self._cells.push({ hero: hero, ring: ring, cx: cx, cy: cy, cellW: cellW,
                       cellH: cellH, locked: !unlocked });
  });
  if (!PC.heroUnlocked(picked)) picked = 'danny';

  var go = this.add.text(W / 2, H * 0.985, 'TAP YOUR HERO AGAIN TO START', {
    fontFamily: 'monospace', fontSize: '10px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5, 1);
  this.tweens.add({ targets: go, alpha: 0.35, duration: 550, yoyo: true, repeat: -1 });

  this.buildAudioPanel();
  this.redraw(picked);
  PC.stampVersion(this);
};

// small AUDIO settings: gear toggle -> two draggable mix sliders
// (music / SFX), persisted via PC.audio (WP-AUDIO).
PC.SelectScene.prototype.buildAudioPanel = function () {
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  var open = false, ui = [];
  var gear = this.add.text(6, H - 6, '[ SETTINGS ]', {
    fontFamily: 'monospace', fontSize: '9px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(0, 1).setDepth(20).setInteractive({ useHandCursor: true });

  function slider(y, label, get, set) {
    var bw = Math.min(200, W * 0.6), bx = W / 2 - bw / 2;
    var txt = self.add.text(bx, y - 14, label, {
      fontFamily: 'monospace', fontSize: '9px', color: '#cfd4e8', fontStyle: 'bold',
    }).setDepth(31);
    var bar = self.add.graphics().setDepth(31);
    function draw() {
      bar.clear();
      bar.fillStyle(0x45356e, 1).fillRoundedRect(bx, y, bw, 10, 5);
      bar.fillStyle(0xf2c33c, 1).fillRoundedRect(bx, y, Math.max(10, bw * get()), 10, 5);
    }
    draw();
    var zone = self.add.zone(bx + bw / 2, y + 5, bw + 24, 30).setDepth(31)
      .setInteractive({ useHandCursor: true });
    var drag = function (p) {
      var v = Math.max(0, Math.min(1, (p.x / PC.RENDER.SCALE - bx) / bw));
      set(v); draw();
    };
    zone.on('pointerdown', function (p) { drag(p); zone._held = true; });
    zone.on('pointermove', function (p) { if (zone._held && p.isDown) drag(p); });
    zone.on('pointerup', function () { zone._held = false; });
    zone.on('pointerout', function () { zone._held = false; });
    return [txt, bar, zone];
  }

  gear.on('pointerdown', function () {
    if (PC.audio) PC.audio.unlock();
    open = !open;
    if (open) {
      var panel = self.add.rectangle(W / 2, H * 0.5 + 6, Math.min(250, W * 0.8), 132, 0x120e24, 0.95)
        .setDepth(30).setStrokeStyle(2, 0xf2c33c);
      ui = [panel];
      var vols = PC.audio ? PC.audio.getVols() : { music: 0.35, sfx: 0.85 };
      ui = ui.concat(slider(H * 0.5 - 22, 'MUSIC',
        function () { return PC.audio ? PC.audio.getVols().music : vols.music; },
        function (v) { if (PC.audio) PC.audio.setMusicVol(v); }));
      ui = ui.concat(slider(H * 0.5 + 22, 'SOUND FX',
        function () { return PC.audio ? PC.audio.getVols().sfx : vols.sfx; },
        function (v) { if (PC.audio) PC.audio.setSfxVol(v); }));
      var dn = self.add.text(W / 2, H * 0.5 + 44,
        'DAMAGE NUMBERS: ' + (PC.settings.dmgNums ? 'ON' : 'OFF'), {
        fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold',
        color: PC.settings.dmgNums ? '#a8e04a' : '#6d6a8e',
      }).setOrigin(0.5, 0).setDepth(31).setInteractive({ useHandCursor: true });
      dn.on('pointerdown', function () {
        PC.setDmgNumbers(!PC.settings.dmgNums);
        dn.setText('DAMAGE NUMBERS: ' + (PC.settings.dmgNums ? 'ON' : 'OFF'))
          .setColor(PC.settings.dmgNums ? '#a8e04a' : '#6d6a8e');
        if (PC.audio) PC.audio.ui();
      });
      ui.push(dn);
    } else {
      ui.forEach(function (o) { o.destroy(); });
      ui = [];
    }
  });
};

PC.SelectScene.prototype.redraw = function (picked) {
  this._cells.forEach(function (c) {
    c.ring.clear();
    if (c.locked) {
      c.ring.lineStyle(2, 0x2a2544, 1);
      var lw = c.cellW * 0.86, lh = c.cellH * 0.88;
      c.ring.strokeRoundedRect(c.cx - lw / 2, c.cy - lh * 0.52, lw, lh, 8);
      return;
    }
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
