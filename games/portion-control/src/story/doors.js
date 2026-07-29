// doors.js - WALK-IN STOREFRONTS (v0.20.0). Mark's linear-flow note:
// "you're free roaming around the city... I don't know how that
// incorporates the shop." Answer: you walk into the buildings. Standing
// at Sal's Corner Store or the Super Dude Garage raises an ENTER prompt;
// pressing it PAUSES the run and launches the store as an overlay scene,
// so nothing about the mission is lost - close it and you're back on the
// same street, same objective, same HP.
window.PC = window.PC || {};

PC.Doors = function (scene) {
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  this.scene = scene;
  this.near = null;

  // door lots: landmark id -> what opens
  this.spots = [];
  [{ at: 'store', label: "ENTER SAL'S CORNER STORE", sub: 'SPEND COINS - TEAM UPGRADES',
     scene: 'PC_Shop', color: 0xa8e04a },
   { at: 'garage', label: 'ENTER THE SUPER DUDE GARAGE', sub: 'SPEND TECH - SIGNATURE GEAR',
     scene: 'PC_Garage', color: 0x35d0ff }].forEach(function (d) {
    var mk = scene.region && scene.region.landmark(d.at);
    if (!mk) return;
    // stand IN the door bay: region.chunkSolids carves a 72px notch in
    // the south face whose bottom 60px is open, so this point is always
    // reachable. (Parking outside the lot isn't - a fabric building can
    // sit right against the south wall, which is what hid Sal's door.)
    self.spots.push({ def: d, mk: mk,
      x: mk.cx, y: mk.open ? mk.cy : mk.y + mk.h - 30 });
  });

  this.pad = scene.add.graphics().setDepth(3);
  this.btnG = scene.add.graphics().setDepth(103).setVisible(false);
  this.btnTxt = scene.add.text(W / 2, H - 112, '', {
    fontFamily: 'monospace', fontSize: '9px', color: '#f7f4ef', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(104).setVisible(false);
  this.subTxt = scene.add.text(W / 2, H - 100, '', {
    fontFamily: 'monospace', fontSize: '7px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(104).setVisible(false);
  this.zone = scene.add.zone(W / 2, H - 106, 190, 30)
    .setInteractive({ useHandCursor: true });
  this.zone.on('pointerdown', function (p, lx, ly, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    self.enter();
  });
  scene.uiAttach(this.btnG); scene.uiAttach(this.btnTxt);
  scene.uiAttach(this.subTxt); scene.uiAttach(this.zone);
  this._key = function () { self.enter(); };
  scene.input.keyboard.on('keydown-E', this._key);
};

PC.Doors.prototype.enter = function () {
  var scene = this.scene;
  if (!this.near || scene.storyPause || scene.cardsOpen || scene.dead) return;
  if (PC.audio) { PC.audio.unlock(); PC.audio.ui(); }
  scene.scene.pause();
  scene.scene.launch(this.near.def.scene, { overlay: true, resume: 'PC_Game' });
  // a PAUSED scene still RENDERS, and the stores are registered before
  // PC_Game in the scene list - without this the storefront draws
  // underneath the frozen street and looks like nothing happened
  scene.scene.bringToTop(this.near.def.scene);
};

PC.Doors.prototype.destroy = function () {
  this.scene.input.keyboard.off('keydown-E', this._key);
  [this.pad, this.btnG, this.btnTxt, this.subTxt, this.zone]
    .forEach(function (o) { o.destroy(); });
};

PC.Doors.prototype.update = function () {
  var scene = this.scene, W = PC.RENDER.W, H = PC.RENDER.H, t = scene.now;
  var p = this.pad; p.clear();
  this.near = null;
  for (var i = 0; i < this.spots.length; i++) {
    var s = this.spots[i];
    var dx = s.x - scene.px, dy = s.y - scene.py;
    var d2 = dx * dx + dy * dy;
    // always-on doormat so the storefronts read as enterable from afar
    var pulse = 0.25 + 0.2 * Math.sin(t * 2.5 + i);
    p.fillStyle(s.def.color, pulse * 0.4);
    p.fillRect(s.x - 34, s.y - 12, 68, 24);
    p.lineStyle(1, s.def.color, 0.7);
    p.strokeRect(s.x - 34, s.y - 12, 68, 24);
    if (d2 < 64 * 64) this.near = s;
  }
  var on = !!this.near && !scene.storyPause && !scene.cardsOpen && !scene.dead;
  this.btnTxt.setVisible(on); this.subTxt.setVisible(on);
  this.btnG.setVisible(on).clear();
  if (!on) return;
  this.btnTxt.setText(this.near.def.label);
  this.subTxt.setText(this.near.def.sub);
  PC.labPanel(this.btnG, W / 2 - 95, H - 122, 190, 30,
    { rivets: true, base: 0x1c1733, edge: this.near.def.color });
  this.btnTxt.setAlpha(0.7 + 0.3 * Math.sin(t * 5));
};
