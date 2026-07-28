// freeroam.js - STORY-5 (v0.19.0): the seam BETWEEN missions.
// Mark's linear-flow direction: "you're thrown into the gameplay...
// free roaming around the city, finishing objectives... and it's a
// pretty straightforward a,b,c,d... there's just extra things you can
// do on the way." So finishing a mission NO LONGER bounces the player
// to a results screen - the city stays open. We show a compact reward
// card, calm the streets, and drop a marker at the Mission Board; walk
// there and hit START to roll into the next story beat.
// Results is now only for DEATH, the end of the campaign, or a next
// beat whose map isn't built yet.
window.PC = window.PC || {};

PC.FreeRoam = function (scene, nextEntry, earned) {
  var W = PC.RENDER.W, self = this;
  this.scene = scene;
  this.next = nextEntry;                 // chain entry to launch, or null
  this.launched = false;
  this.ready = false;                    // player is standing on the marker

  // where to go next: the Mission Board is the story's "accept" spot
  // (STORY_SPEC L4). Fall back to the next mission's first landmark.
  var mk = scene.region.landmark('board');
  if (!mk && nextEntry) {
    var m = PC.STORY.missions[nextEntry.id];
    if (m && m.objectives[0] && m.objectives[0].at) mk = scene.region.landmark(m.objectives[0].at);
  }
  this.mk = mk;
  this.tx = mk ? mk.cx : scene.region.spawnX;
  this.ty = mk ? (mk.open ? mk.cy : mk.cy + mk.h / 2 + 60) : scene.region.spawnY;

  // world-space marker: a glowing pad with a bobbing chevron
  this.pad = scene.add.graphics().setDepth(3);
  this.chev = scene.add.graphics().setDepth(9);

  // screen-space bits
  this.hud = scene.add.graphics().setDepth(101);
  this.hudTxt = scene.add.text(W / 2, 30, '', {
    fontFamily: 'monospace', fontSize: '9px', color: '#f7f4ef', fontStyle: 'bold',
  }).setOrigin(0.5, 0).setDepth(102);
  scene.uiAttach(this.hud); scene.uiAttach(this.hudTxt);
  this.compass = scene.add.graphics().setDepth(102);
  scene.uiAttach(this.compass);

  // the START button (only visible on the pad) - explicit tap target so
  // it can't fight drag-to-walk
  this.btnG = scene.add.graphics().setDepth(103).setVisible(false);
  this.btnTxt = scene.add.text(W / 2, PC.RENDER.H - 74, 'START', {
    fontFamily: 'monospace', fontSize: '13px', color: '#a8e04a', fontStyle: 'bold',
    stroke: '#120e24', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(104).setVisible(false);
  this.btnZone = scene.add.zone(W / 2, PC.RENDER.H - 74, 130, 34)
    .setInteractive({ useHandCursor: true });
  this.btnZone.on('pointerdown', function (p, lx, ly, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    if (self.ready) self.launch();
  });
  scene.uiAttach(this.btnG); scene.uiAttach(this.btnTxt); scene.uiAttach(this.btnZone);
  this._keys = [];
  ['keydown-SPACE', 'keydown-ENTER'].forEach(function (k) {
    var fn = function () { if (self.ready) self.launch(); };
    scene.input.keyboard.on(k, fn);
    self._keys.push([k, fn]);
  });

  this.showRewardCard(earned || {});
};

// compact in-world reward card (replaces the results screen between
// missions): what you earned, then it fades and the city is yours
PC.FreeRoam.prototype.showRewardCard = function (earned) {
  var scene = this.scene, W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  var ui = [];
  var g = scene.add.graphics().setDepth(150);
  PC.labPanel(g, W / 2 - 82, H * 0.30, 164, 78,
    { rivets: true, base: 0x1c3320, edge: 0xa8e04a });
  var t1 = scene.add.text(W / 2, H * 0.30 + 10, 'MISSION COMPLETE', {
    fontFamily: 'monospace', fontSize: '11px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5, 0).setDepth(151);
  var t2 = scene.add.text(W / 2, H * 0.30 + 30,
    'TECH   + ' + (earned.tp || 0) + ' TP\nGOLD   $ ' + (earned.gold || 0) +
    '\nPOPS     ' + (earned.kills || 0), {
    fontFamily: 'monospace', fontSize: '10px', color: '#cfd4e8',
    align: 'center', lineSpacing: 3,
  }).setOrigin(0.5, 0).setDepth(151);
  ui = [g, t1, t2];
  ui.forEach(function (o) { scene.uiAttach(o); o.setAlpha(0); });
  scene.tweens.add({ targets: ui, alpha: 1, duration: 300 });
  if (PC.audio && PC.audio.levelup) PC.audio.levelup();
  scene.time.delayedCall(2600, function () {
    scene.tweens.add({ targets: ui, alpha: 0, duration: 400,
      onComplete: function () { ui.forEach(function (o) { o.destroy(); }); } });
  });
};

PC.FreeRoam.prototype.launch = function () {
  if (this.launched) return;
  this.launched = true;
  var scene = this.scene, self = this;
  if (PC.audio) PC.audio.ui();
  PC.STORY.pendingMission = this.next;
  // a fade, not a menu: the city dissolves straight into the next beat
  scene.cameras.main.fadeOut(500, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', function () {
    scene.scene.restart();
  });
};

PC.FreeRoam.prototype.destroy = function () {
  var scene = this.scene;
  this._keys.forEach(function (k) { scene.input.keyboard.off(k[0], k[1]); });
  [this.pad, this.chev, this.hud, this.hudTxt, this.compass,
   this.btnG, this.btnTxt, this.btnZone].forEach(function (o) { o.destroy(); });
};

PC.FreeRoam.prototype.update = function (dt) {
  var scene = this.scene, W = PC.RENDER.W, H = PC.RENDER.H;
  var t = scene.now;
  var dx = this.tx - scene.px, dy = this.ty - scene.py;
  var d2 = dx * dx + dy * dy;
  this.ready = d2 < 70 * 70 && !this.launched;

  // ---- world marker: pulsing pad + bobbing chevron ----
  var p = this.pad; p.clear();
  var pulse = 0.35 + 0.25 * Math.sin(t * 3);
  p.fillStyle(0xf2c33c, pulse * 0.35).fillCircle(this.tx, this.ty, 44);
  p.lineStyle(2, 0xf2c33c, 0.8).strokeCircle(this.tx, this.ty, 30);
  p.lineStyle(1, 0xfff6e0, pulse).strokeCircle(this.tx, this.ty, 30 + 10 * pulse);
  var c = this.chev; c.clear();
  var bob = Math.sin(t * 4) * 4;
  c.fillStyle(0xf2c33c, 0.95);
  c.fillTriangle(this.tx - 9, this.ty - 54 + bob, this.tx + 9, this.ty - 54 + bob,
    this.tx, this.ty - 40 + bob);
  c.fillStyle(0xfff6e0, 0.8);
  c.fillTriangle(this.tx - 5, this.ty - 52 + bob, this.tx + 5, this.ty - 52 + bob,
    this.tx, this.ty - 44 + bob);

  // ---- banner ----
  var g = this.hud; g.clear();
  var label = this.ready
    ? (this.next ? 'READY: ' + this.next.title : 'READY')
    : 'FREE ROAM - HEAD TO THE MISSION BOARD';
  this.hudTxt.setText(label);
  PC.labPanel(g, W / 2 - this.hudTxt.width / 2 - 10, 27,
    this.hudTxt.width + 20, 15, { base: 0x1c1733, edge: 0x45356e, radius: 3 });

  // ---- START button ----
  this.btnTxt.setVisible(this.ready);
  this.btnG.setVisible(this.ready).clear();
  if (this.ready) {
    PC.labPanel(this.btnG, W / 2 - 65, H - 88, 130, 28,
      { rivets: true, base: 0x1c3320, edge: 0xa8e04a });
    this.btnTxt.setAlpha(0.65 + 0.35 * Math.sin(t * 6));
  }

  // ---- compass to the marker when off-screen ----
  var cm = this.compass; cm.clear();
  if (this.ready) return;
  var wv = scene.cameras.main.worldView;
  var sx = this.tx - wv.x, sy = this.ty - wv.y;
  if (sx > 20 && sx < W - 20 && sy > 40 && sy < H - 40) return;
  var cx = W / 2, cy = H / 2;
  var ang = Math.atan2(sy - cy, sx - cx);
  var r = Math.min(W, H) / 2 - 34;
  var ax = cx + Math.cos(ang) * r, ay = cy + Math.sin(ang) * r;
  cm.fillStyle(0x120e24, 0.7).fillCircle(ax, ay, 13);
  cm.lineStyle(1, 0xf2c33c, 0.9).strokeCircle(ax, ay, 13);
  cm.fillStyle(0xf2c33c, 0.8 + 0.2 * Math.sin(t * 8));
  cm.fillTriangle(ax + Math.cos(ang) * 10, ay + Math.sin(ang) * 10,
    ax + Math.cos(ang + 2.6) * 6, ay + Math.sin(ang + 2.6) * 6,
    ax + Math.cos(ang - 2.6) * 6, ay + Math.sin(ang - 2.6) * 6);
};
