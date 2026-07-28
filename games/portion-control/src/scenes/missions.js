// missions.js - PC_Missions: the STORY mission map (STORY-4, v0.18).
// Mark: "I really don't want a hero select... you're given the character
// and then given the mission... you unlock more and more of a mission
// map. As you play it reveals and unlocks the next mission for you to
// select if you lose or leave the game."
// A snaking path of 6 mission nodes climbing to Adventure Tower. Node
// states from PC.storyState: cleared (replayable) / active (playable
// frontier, pulsing) / soon (revealed, map unbuilt = SIGNAL SCRAMBLED) /
// tease (fogged ???) / hidden. Tapping a playable node opens a mission
// brief with the ASSIGNED hero + GO - no picking. First visit after a
// clear plays a NEW MISSION reveal fanfare on the fresh node.
window.PC = window.PC || {};

PC.MissionsScene = function () { Phaser.Scene.call(this, { key: 'PC_Missions' }); };
PC.MissionsScene.prototype = Object.create(Phaser.Scene.prototype);
PC.MissionsScene.prototype.constructor = PC.MissionsScene;

PC.MissionsScene.prototype.create = function () {
  PC.applyRenderScale(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  this.cameras.main.setBackgroundColor(0x0d0a1c);
  PC.storyState.setIntroSeen();          // reaching the map = intro done
  this._briefUi = [];

  // ---- backdrop: night-city map feel (stars + skyline + grid) ----
  var bg = this.add.graphics().setDepth(0);
  for (var st = 0; st < 40; st++) {
    bg.fillStyle(0xcfd4e8, 0.25 + PC.hash01(st, 3, 9) * 0.5);
    bg.fillRect(PC.hash01(st, 1, 7) * W, PC.hash01(st, 2, 8) * H * 0.5, 1, 1);
  }
  bg.fillStyle(0x1c1733, 1);
  for (var bx = 0; bx < W; bx += 26) {
    var bh = 16 + (((bx * 2654435761) >>> 8) % 30);
    bg.fillRect(bx, H - bh, 22, bh);
    bg.fillStyle(0x45356e, 0.5);
    bg.fillRect(bx + 4, H - bh + 4, 3, 3); bg.fillRect(bx + 12, H - bh + 9, 3, 3);
    bg.fillStyle(0x1c1733, 1);
  }

  // ---- header ----
  var hdrG = this.add.graphics().setDepth(1);
  PC.labPanel(hdrG, 4, 6, W - 8, 34, { rivets: true, base: 0x1c1733, edge: 0x6d6a8e });
  this.add.text(W / 2, 13, 'ADVENTURE CITY', {
    fontFamily: 'monospace', fontSize: '15px', color: '#f2c33c', fontStyle: 'bold',
    stroke: '#120e24', strokeThickness: 4,
  }).setOrigin(0.5, 0).setDepth(2);
  this.add.text(W / 2, 30, 'MISSION MAP', {
    fontFamily: 'monospace', fontSize: '8px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(0.5, 0).setDepth(2);

  // wallet: TP + coins (the two campaign currencies, STORY_SPEC I.2)
  this.add.text(6, 12, 'TP ' + (PC.meta ? PC.meta.stat('tp') : 0), {
    fontFamily: 'monospace', fontSize: '9px', color: '#35d0ff', fontStyle: 'bold',
  }).setDepth(2);
  this.add.text(6, 24, '$ ' + (PC.meta ? PC.meta.gold() : 0), {
    fontFamily: 'monospace', fontSize: '9px', color: '#f2c33c', fontStyle: 'bold',
  }).setDepth(2);

  // ---- the path board ----
  var boardG = this.add.graphics().setDepth(1);
  var top = 52, bottom = H - 34;
  PC.labPanel(boardG, 6, top - 6, W - 12, bottom - top + 12,
    { base: 0x171330, edge: 0x45356e, radius: 8 });
  // board interior texture (no-flat law): faint street grid + city specks
  boardG.lineStyle(1, 0x241f3d, 0.6);
  for (var gx2 = 22; gx2 < W - 12; gx2 += 30) {
    boardG.lineBetween(gx2, top, gx2, bottom - 2);
  }
  for (var gy2 = top + 12; gy2 < bottom - 4; gy2 += 30) {
    boardG.lineBetween(10, gy2, W - 10, gy2);
  }
  for (var sp2 = 0; sp2 < 70; sp2++) {
    boardG.fillStyle(sp2 % 5 ? 0x45356e : 0x35d0ff, 0.16 + PC.hash01(sp2, 4, 6) * 0.2);
    boardG.fillRect(10 + PC.hash01(sp2, 1, 7) * (W - 22),
      top + PC.hash01(sp2, 2, 8) * (bottom - top - 10), 2, 2);
  }

  var chain = PC.STORY.CHAIN, n = chain.length;
  this._nodes = [];
  var pts = [];
  for (var i = 0; i < n; i++) {
    var k = n <= 1 ? 0 : i / (n - 1);
    pts.push({
      x: W * (i % 2 === 0 ? 0.30 : 0.70),
      y: bottom - 26 - k * (bottom - top - 96),   // 96 = tower headroom up top
    });
  }
  // dotted route between nodes (revealed segments glow)
  var route = this.add.graphics().setDepth(2);
  for (var s = 0; s < n - 1; s++) {
    var a = pts[s], b = pts[s + 1];
    var lit = PC.storyState.status(s) === 'cleared';
    var steps = 9;
    for (var d = 1; d < steps; d++) {
      var t2 = d / steps;
      route.fillStyle(lit ? 0xa8e04a : 0x45356e, lit ? 0.9 : 0.45);
      route.fillCircle(a.x + (b.x - a.x) * t2, a.y + (b.y - a.y) * t2, 1.4);
    }
  }
  // tower glyph crowning the final node
  var tw = pts[n - 1];
  var towG = this.add.graphics().setDepth(2);
  towG.fillStyle(0x241f3d, 1).fillRect(tw.x - 7, tw.y - 46, 14, 26);
  towG.fillStyle(0x45356e, 1).fillRect(tw.x - 4, tw.y - 54, 8, 10);
  towG.fillStyle(0x35d0ff, 0.9).fillRect(tw.x - 1, tw.y - 60, 2, 7);
  towG.fillStyle(0xf2c33c, 0.8);
  towG.fillRect(tw.x - 5, tw.y - 42, 3, 3); towG.fillRect(tw.x + 2, tw.y - 36, 3, 3);

  chain.forEach(function (entry, i2) { self.buildNode(entry, i2, pts[i2]); });

  // ---- footer buttons ----
  var mkBtn = function (x, w2, label, color, fn) {
    var g2 = self.add.graphics().setDepth(3);
    PC.labPanel(g2, x, H - 28, w2, 20, { rivets: true });
    var t = self.add.text(x + w2 / 2, H - 18, label, {
      fontFamily: 'monospace', fontSize: '9px', color: color, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4);
    var z = self.add.zone(x + w2 / 2, H - 18, w2 + 6, 26)
      .setInteractive({ useHandCursor: true });
    z.on('pointerdown', function () { if (PC.audio) { PC.audio.unlock(); PC.audio.ui(); } fn(); });
    return t;
  };
  mkBtn(8, W * 0.44, "SAL'S STORE", '#a8e04a', function () {
    self.scene.start('PC_Shop', { back: 'PC_Missions' });
  });
  mkBtn(W * 0.44 + 16, W - (W * 0.44 + 16) - 8, 'TITLE', '#6d6a8e', function () {
    self.scene.start('PC_Title');
  });
  if (PC.DEV_MODE) {
    var rs = this.add.text(6, 44, '[ RESET STORY ]', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ff6b6b', fontStyle: 'bold',
    }).setDepth(5).setInteractive({ useHandCursor: true });
    rs.on('pointerdown', function () { PC.storyState.reset(); self.scene.restart(); });
  }
  PC.stampVersion(this);

  // ---- one-time NEW MISSION reveal on the frontier node ----
  var cur = PC.storyState.currentIndex();
  if (cur > 0 && cur < n && !PC.storyState.revealSeen(chain[cur].id)) {
    this.revealFanfare(this._nodes[cur], chain[cur]);
  }
};

// one mission node: ring + state icon + label (+ hero chip when playable)
PC.MissionsScene.prototype.buildNode = function (entry, i, pt) {
  var self = this;
  var st = PC.storyState.status(i);
  var g = this.add.graphics().setDepth(3);
  var node = { entry: entry, g: g, x: pt.x, y: pt.y, status: st, ui: [] };
  this._nodes.push(node);
  if (st === 'hidden') {
    // fogged waypoint: visible enough to promise "more map to reveal"
    g.fillStyle(0x1c1733, 1).fillCircle(pt.x, pt.y, 7);
    g.lineStyle(1, 0x45356e, 0.7).strokeCircle(pt.x, pt.y, 7);
    g.fillStyle(0x45356e, 0.8).fillCircle(pt.x, pt.y, 1.5);
    return;
  }
  if (st === 'tease') {
    g.fillStyle(0x1c1733, 1).fillCircle(pt.x, pt.y, 12);
    g.lineStyle(1, 0x45356e, 0.8).strokeCircle(pt.x, pt.y, 12);
    var q = this.add.text(pt.x, pt.y, '?', {
      fontFamily: 'monospace', fontSize: '11px', color: '#45356e', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4);
    node.ui.push(q);
    // drifting fog wisps
    for (var f = 0; f < 3; f++) {
      var w = this.add.ellipse(pt.x - 8 + f * 8, pt.y + (f % 2 ? 5 : -4), 18, 7,
        0x241f3d, 0.55).setDepth(5);
      this.tweens.add({ targets: w, x: w.x + 6, duration: 1600 + f * 500,
        yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      node.ui.push(w);
    }
    return;
  }

  var ringCol = st === 'cleared' ? 0xa8e04a : st === 'active' ? 0xf2c33c : 0xff9d3b;
  g.fillStyle(0x120e24, 0.8).fillCircle(pt.x + 1, pt.y + 2, 14);   // drop shadow
  g.fillStyle(0x241f3d, 1).fillCircle(pt.x, pt.y, 14);
  g.fillStyle(0xffffff, 0.08).fillCircle(pt.x - 3, pt.y - 4, 8);   // top light
  g.lineStyle(2, ringCol, 1).strokeCircle(pt.x, pt.y, 14);

  if (st === 'cleared') {
    g.lineStyle(3, 0xa8e04a, 1);
    g.beginPath();
    g.moveTo(pt.x - 6, pt.y); g.lineTo(pt.x - 2, pt.y + 5); g.lineTo(pt.x + 6, pt.y - 5);
    g.strokePath();
  } else if (st === 'active') {
    var star = this.add.text(pt.x, pt.y, '!', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f2c33c', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4);
    node.ui.push(star);
    var pulse = this.add.graphics().setDepth(2);
    pulse.lineStyle(1, 0xf2c33c, 0.5).strokeCircle(pt.x, pt.y, 18);
    this.tweens.add({ targets: pulse, alpha: 0.1, duration: 600, yoyo: true, repeat: -1 });
    node.ui.push(pulse);
  } else {   // soon
    var zz = this.add.text(pt.x, pt.y, 'X', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff9d3b', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4).setAlpha(0.9);
    this.tweens.add({ targets: zz, alpha: 0.3, duration: 260, yoyo: true, repeat: -1 });
    node.ui.push(zz);
  }

  // label beside the node (opposite side of the screen edge)
  var lx = pt.x < PC.RENDER.W / 2 ? pt.x + 22 : pt.x - 22;
  var align = pt.x < PC.RENDER.W / 2 ? 0 : 1;
  var name = this.add.text(lx, pt.y - 8, entry.title, {
    fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold',
    color: st === 'cleared' ? '#a8e04a' : st === 'active' ? '#f7f4ef' : '#c9a06a',
  }).setOrigin(align, 0).setDepth(4);
  var sub = st === 'soon' ? 'SIGNAL SCRAMBLED - COMING SOON'
          : st === 'cleared' ? entry.place + ' - CLEARED'
          : entry.place;
  var subT = this.add.text(lx, pt.y + 2, sub, {
    fontFamily: 'monospace', fontSize: '7px',
    color: st === 'soon' ? '#ff9d3b' : '#6d6a8e',
  }).setOrigin(align, 0).setDepth(4);
  node.ui.push(name, subT);
  // assigned-hero chip on playable nodes: the story GIVES you the hero
  if (st === 'cleared' || st === 'active') {
    var chip = this.add.image(align ? lx - 8 : lx + 8, pt.y + 18,
      'atlas', 'portrait_' + entry.hero).setScale(14 / 128).setDepth(4);
    var chg = this.add.graphics().setDepth(3);
    chg.lineStyle(1, 0x45356e, 1).strokeRect(chip.x - 8, pt.y + 10, 16, 16);
    node.ui.push(chip, chg);
  }

  if (st === 'cleared' || st === 'active') {
    var z = this.add.zone(pt.x, pt.y, 64, 40).setInteractive({ useHandCursor: true });
    z.on('pointerdown', function () {
      if (PC.audio) { PC.audio.unlock(); PC.audio.ui(); }
      self.openBrief(entry, st);
    });
    node.ui.push(z);
  }
};

// mission brief sheet: title / blurb / the ASSIGNED hero / GO
PC.MissionsScene.prototype.openBrief = function (entry, status) {
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  this.closeBrief();
  var ui = this._briefUi;
  var ph = 132, py = H - ph - 34;
  var dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45)
    .setDepth(30).setInteractive();
  dim.on('pointerdown', function () { self.closeBrief(); });
  var g = this.add.graphics().setDepth(31);
  PC.labPanel(g, 8, py, W - 16, ph, { rivets: true, base: 0x1c1733, edge: 0xf2c33c });
  ui.push(dim, g);
  ui.push(this.add.text(W / 2, py + 10, entry.title, {
    fontFamily: 'monospace', fontSize: '11px', color: '#f2c33c', fontStyle: 'bold',
  }).setOrigin(0.5, 0).setDepth(32));
  ui.push(this.add.text(W / 2, py + 24, entry.place +
    (status === 'cleared' ? '  [ CLEARED - PATROL AGAIN ]' : ''), {
    fontFamily: 'monospace', fontSize: '7px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(0.5, 0).setDepth(32));
  ui.push(this.add.text(16, py + 38, entry.blurb, {
    fontFamily: 'monospace', fontSize: '8px', color: '#cfd4e8',
    wordWrap: { width: W - 92 }, lineSpacing: 3,
  }).setDepth(32));
  // the assigned hero (portrait + name; no choosing)
  var hero = PC.heroById(entry.hero);
  var hx = W - 40, hy = py + 58;
  var hg = this.add.graphics().setDepth(32);
  PC.labPanel(hg, hx - 22, hy - 24, 44, 60, { base: 0x241f3d, edge: 0x45356e, radius: 4 });
  ui.push(hg);
  ui.push(this.add.image(hx, hy - 2, 'atlas', 'portrait_' + entry.hero)
    .setScale(36 / 128).setDepth(33));
  ui.push(this.add.text(hx, hy + 20, hero.name, {
    fontFamily: 'monospace', fontSize: '7px', color: '#f7f4ef', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(33));
  ui.push(this.add.text(hx, py + 26, 'YOU PLAY AS', {
    fontFamily: 'monospace', fontSize: '6px', color: '#35d0ff', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(33));
  // GO
  var gg = this.add.graphics().setDepth(32);
  PC.labPanel(gg, 16, py + ph - 30, 96, 22, { rivets: true, base: 0x1c3320, edge: 0xa8e04a });
  var goT = this.add.text(64, py + ph - 19, '>> GO! <<', {
    fontFamily: 'monospace', fontSize: '11px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(33);
  this.tweens.add({ targets: goT, alpha: 0.45, duration: 500, yoyo: true, repeat: -1 });
  var gz = this.add.zone(64, py + ph - 19, 104, 28).setDepth(40)
    .setInteractive({ useHandCursor: true });
  gz.on('pointerdown', function () {
    PC.STORY.pendingMission = entry;
    if (PC.audio) { PC.audio.ui(); PC.audio.startMusic(); }
    self.scene.start('PC_Game');
  });
  ui.push(gg, goT, gz);
  var x = this.add.text(W - 18, py + 6, '[X]', {
    fontFamily: 'monospace', fontSize: '9px', color: '#ff6b6b', fontStyle: 'bold',
  }).setOrigin(1, 0).setDepth(40).setInteractive({ useHandCursor: true });
  x.on('pointerdown', function () { self.closeBrief(); });
  ui.push(x);
};

PC.MissionsScene.prototype.closeBrief = function () {
  this._briefUi.forEach(function (o) { o.destroy(); });
  this._briefUi = [];
};

// NEW MISSION UNLOCKED: flash the fresh node + banner + fanfare (once)
PC.MissionsScene.prototype.revealFanfare = function (node, entry) {
  var W = PC.RENDER.W, self = this;
  PC.storyState.markRevealSeen(entry.id);
  var flash = this.add.circle(node.x, node.y, 4, 0xfff6e0, 0.9).setDepth(20);
  this.tweens.add({ targets: flash, radius: 30, alpha: 0, duration: 700,
    onComplete: function () { flash.destroy(); } });
  var bg = this.add.graphics().setDepth(21);
  PC.labPanel(bg, W / 2 - 86, node.y - 44, 172, 22,
    { rivets: true, base: 0x1c3320, edge: 0xa8e04a });
  var t = this.add.text(W / 2, node.y - 33, 'NEW MISSION UNLOCKED!', {
    fontFamily: 'monospace', fontSize: '9px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(22).setScale(0.2);
  this.tweens.add({ targets: t, scale: 1, duration: 320, ease: 'Back.out' });
  this.time.delayedCall(150, function () {
    if (PC.audio && PC.audio.fanfare) PC.audio.fanfare();
  });
  this.time.delayedCall(2600, function () {
    self.tweens.add({ targets: [bg, t], alpha: 0, duration: 400,
      onComplete: function () { bg.destroy(); t.destroy(); } });
  });
};
