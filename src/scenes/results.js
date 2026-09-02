// results.js - PC_Results: run summary (COMPENDIUM 10). Win = "District
// Cleared!" with the rescued hero + confetti; lose = "Overwhelmed!".
window.PC = window.PC || {};

PC.ResultsScene = function () { Phaser.Scene.call(this, { key: 'PC_Results' }); };
PC.ResultsScene.prototype = Object.create(Phaser.Scene.prototype);
PC.ResultsScene.prototype.constructor = PC.ResultsScene;

PC.ResultsScene.prototype.init = function (data) { this.data2 = data || {}; };

PC.ResultsScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  var d = this.data2, win = !!d.win;
  // hero unlocks earned this run (stats were recorded by the game scene).
  // Story missions celebrate the RESCUE instead - patrol-style stat
  // unlocks still register, but silently (no competing banner).
  var freshHeroes = PC.checkHeroUnlocks ? PC.checkHeroUnlocks() : [];
  if (d.story) freshHeroes = [];
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
    // v0.76.0: the finale is not a district clear - it's the whole city
    this.add.text(W / 2, H * 0.16, d.finale ? 'ADVENTURE CITY\nSAVED!' : 'DISTRICT\nCLEARED!', {
      fontFamily: 'monospace', fontSize: '26px', color: '#a8e04a', fontStyle: 'bold',
      align: 'center', stroke: '#0a1a0a', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(2);
    if (d.finale) {
      var ids = ['victoria', 'josh', 'kevin', 'carlos', 'nayah', 'danny'];
      for (var fi = 0; fi < ids.length; fi++) {
        this.add.image(W / 2 + (fi - 2.5) * 30, H * 0.42, 'atlas', 'portrait_' + ids[fi])
          .setDisplaySize(28, 28).setDepth(2);
      }
      this.add.text(W / 2, H * 0.56, 'THE WHOLE TEAM IS HOME!\nCHOMP IS SWITCHED OFF.', {
        fontFamily: 'monospace', fontSize: '11px', color: '#f2c33c', fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5).setDepth(2);
    } else {
      // the rescued hero, framed
      this.add.image(W / 2, H * 0.42, 'atlas', d.rescuedArt || PC.D1_RESCUE.art)
        .setScale(1.2).setDepth(2);
      this.add.text(W / 2, H * 0.56, (d.rescued || 'A TEAMMATE') + '\nJOINED THE TEAM!', {
        fontFamily: 'monospace', fontSize: '11px', color: '#f2c33c', fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5).setDepth(2);
    }
  } else {
    this.add.text(W / 2, H * 0.2, 'OVERWHELMED!', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ff6b6b', fontStyle: 'bold',
    }).setOrigin(0.5);
    var pw = 128 * 0.6;
    // defeat-expression portrait (v0.18.1) - the KO variant of the hero
    this.add.image(W / 2, H * 0.4, 'atlas',
      'portrait_' + (d.hero || PC.selectedHero().id) + '_ko').setScale(0.6);
    this.add.graphics().lineStyle(2, 0xf2c33c, 1)
      .strokeRect(W / 2 - pw / 2 - 2, H * 0.4 - pw / 2 - 2, pw + 4, pw + 4);
  }

  var statG = this.add.graphics();
  // THE PAYOUT (v0.30.0). Story runs bank XP instead of levelling, so
  // the desk converts it to TECH here - on a WIN and on a LOSS alike
  // (Mark: "upgrading after completions or losses"). Coins already
  // persist the moment they're picked up.
  var xpTp = d.xpTp || 0;
  if (xpTp > 0 && PC.meta) PC.meta.bump('tp', xpTp);
  var story = !!d.story || d.xp !== undefined;
  var rows = 'TIME  ' + m + ':' + (s < 10 ? '0' : '') + s +
    '\nPOPS  ' + (d.kills || 0) +
    (story ? '\nXP    ' + (d.xp || 0) : '\nLEVEL ' + (d.level || 1)) +
    '\nGOLD  $ ' + (d.gold || 0) +
    ((d.tp || xpTp) ? '\nTECH  +' + ((d.tp || 0) + xpTp) + ' TP' : '');
  var rowN = rows.split('\n').length;
  PC.labPanel(statG, W / 2 - 70, H * 0.68 - 38, 140, 18 + rowN * 16, { rivets: true });
  this.add.text(W / 2, H * 0.68, rows, {
    fontFamily: 'monospace', fontSize: '12px', color: '#cfd4e8', align: 'center', lineSpacing: 4,
  }).setOrigin(0.5).setDepth(2);
  if (xpTp > 0) {
    this.add.text(W / 2, H * 0.68 + 8 + rowN * 8, '(' + (d.xp || 0) + ' XP BANKED)', {
      fontFamily: 'monospace', fontSize: '8px', color: '#6d6a8e',
    }).setOrigin(0.5, 0).setDepth(2);
  }

  if (freshHeroes.length) {
    var bnG = this.add.graphics().setDepth(10);
    PC.labPanel(bnG, W / 2 - 92, H * 0.81 - 24, 184, 48,
      { rivets: true, base: 0x1c3320, edge: 0xa8e04a });
    var who = freshHeroes.map(function (id) { return id.toUpperCase(); }).join(' + ');
    this.add.text(W / 2, H * 0.81 - 12, 'NEW HERO UNLOCKED!', {
      fontFamily: 'monospace', fontSize: '10px', color: '#a8e04a', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    var whoT = this.add.text(W / 2 + 14, H * 0.81 + 6, who, {
      fontFamily: 'monospace', fontSize: '11px', color: '#f7f4ef', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    var up = this.add.image(W / 2 - 62, H * 0.81 + 4, 'atlas',
      'portrait_' + freshHeroes[0]).setScale(0.22).setDepth(11);
    this.tweens.add({ targets: [up, whoT], scale: '*=1.06', duration: 420,
      yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    if (PC.audio && PC.audio.fanfare) this.time.delayedCall(300, function () { PC.audio.fanfare(); });
  }

  // story runs return to the MISSION MAP (the linear spine's only menu -
  // win reveals the next mission there; lose = pick the mission again);
  // quick runs keep the hero-select loop
  var again = this.add.text(W / 2, H * 0.92,
    d.story ? (win ? 'TAP - BACK TO THE MISSION MAP' : 'TAP TO TRY AGAIN')
            : (win ? 'TAP TO PLAY AGAIN' : 'TAP TO TRY AGAIN'), {
    fontFamily: 'monospace', fontSize: '12px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(2);
  this.tweens.add({ targets: again, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

  if (win && PC.audio) PC.audio.levelup();

  var go = function () {
    if (PC.audio) PC.audio.ui();
    if (d.story) { PC.STORY.pendingMission = null; self.scene.start('PC_Missions'); return; }
    self.scene.start('PC_Select');
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
