// title.js - PC_Title: the security-lab title sequence (Mark: "Megaman X
// kind of thing... metal doors open... really heavy duty security lab...
// lighting occlusion highlights details textures").
// Sequence: sealed bulkhead doors (ui_door_plate steel + ui_hazard seam +
// ui_emblem lock) -> clank, hiss, doors slide apart with shake -> the two
// logo plates FALL in and land with impact + sparks -> menu powers on.
// Any tap skips to the finished menu. All layers code-side + 3 PixelLab
// textures; PC.labPanel is the shared beveled-panel helper for every menu.
window.PC = window.PC || {};

// ---- shared beveled lab panel (used by shop/select/results too) ----
// Pseudo-occlusion: light top edge, dark bottom edge, inner shadow line,
// optional corner rivets. Draws into the graphics you pass.
PC.labPanel = function (g, x, y, w, h, opts) {
  opts = opts || {};
  var base = opts.base || 0x241f3d, r = opts.radius === undefined ? 5 : opts.radius;
  g.fillStyle(0x120e24, 0.55).fillRoundedRect(x + 1, y + 2, w, h, r);   // drop shadow
  g.fillStyle(base, 1).fillRoundedRect(x, y, w, h, r);
  g.fillStyle(0xffffff, 0.07).fillRoundedRect(x, y, w, Math.max(3, h * 0.16), r); // top light
  g.fillStyle(0x000000, 0.18).fillRoundedRect(x, y + h - Math.max(3, h * 0.12), w, Math.max(3, h * 0.12), r); // bottom occlusion
  g.lineStyle(1, opts.edge || 0x45356e, 1).strokeRoundedRect(x, y, w, h, r);
  g.lineStyle(1, 0x000000, 0.25).strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, Math.max(0, r - 1)); // inner shadow
  if (opts.rivets) {
    g.fillStyle(0x6d6a8e, 1);
    [[x + 4, y + 4], [x + w - 6, y + 4], [x + 4, y + h - 6], [x + w - 6, y + h - 6]].forEach(function (p) {
      g.fillRect(p[0], p[1], 2, 2);
    });
    g.fillStyle(0xffffff, 0.35);
    [[x + 4, y + 4], [x + w - 6, y + 4], [x + 4, y + h - 6], [x + w - 6, y + h - 6]].forEach(function (p) {
      g.fillRect(p[0], p[1], 1, 1);
    });
  }
};

// layered display-type logo text: dark extrude, main fill, top highlight
PC.logoText = function (scene, x, y, str, size, color) {
  var parts = [];
  var mk = function (dx, dy, col, alpha) {
    var t = scene.add.text(x + dx, y + dy, str, {
      fontFamily: 'monospace', fontSize: size + 'px', color: col, fontStyle: 'bold',
    }).setOrigin(0.5);
    if (alpha !== undefined) t.setAlpha(alpha);
    parts.push(t);
    return t;
  };
  mk(3, 4, '#0a0716');                 // deep extrude
  mk(2, 3, '#0a0716');
  mk(1, 2, '#120e24');
  mk(0, 0, color);                     // face
  var hi = scene.add.text(x, y - 1, str, {
    fontFamily: 'monospace', fontSize: size + 'px', color: '#ffffff', fontStyle: 'bold',
  }).setOrigin(0.5).setAlpha(0.22);
  parts.push(hi);
  var c = scene.add.container(0, 0, parts);
  return c;
};

PC.TitleScene = function () { Phaser.Scene.call(this, { key: 'PC_Title' }); };
PC.TitleScene.prototype = Object.create(Phaser.Scene.prototype);
PC.TitleScene.prototype.constructor = PC.TitleScene;

PC.TitleScene.prototype.create = function () {
  PC.applyRenderScale(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  this.cameras.main.setBackgroundColor(0x0d0a1c);
  this._done = false;

  // ---------- lab interior (revealed behind the doors) ----------
  var bg = this.add.graphics().setDepth(0);
  // vertical light falloff
  for (var i = 0; i < 12; i++) {
    var k = i / 12;
    bg.fillStyle(0x1b1530, 1 - k * 0.55).fillRect(0, H * k / 1.6, W, H / 12 + 2);
  }
  // floor grid receding (perspective-ish occlusion: dimmer further up)
  bg.lineStyle(1, 0x45356e, 0.35);
  for (var gx = 0; gx <= W; gx += 24) bg.lineBetween(gx, H * 0.34, gx, H);
  for (var gy = H * 0.34; gy <= H; gy += 20) {
    bg.lineStyle(1, 0x45356e, 0.14 + 0.3 * ((gy - H * 0.34) / (H * 0.66)));
    bg.lineBetween(0, gy, W, gy);
  }
  // ceiling glow strips
  bg.fillStyle(0x35d0ff, 0.10).fillRect(W * 0.1, 6, W * 0.8, 3);
  bg.fillStyle(0x35d0ff, 0.05).fillRect(W * 0.1, 9, W * 0.8, 6);
  // dust motes
  this._motes = [];
  for (var m = 0; m < 14; m++) {
    var mote = this.add.rectangle(Math.random() * W, Math.random() * H, 1, 1,
      m % 3 ? 0x6d6a8e : 0x35d0ff, 0.5).setDepth(1);
    this.tweens.add({ targets: mote, y: mote.y - 30 - Math.random() * 40,
      alpha: 0, duration: 4000 + Math.random() * 3000, repeat: -1,
      onRepeat: function (tw, t) { t.y = H + 4; t.x = Math.random() * W; t.alpha = 0.5; } });
  }

  // ---------- menu content (hidden until doors open) ----------
  this.menu = this.add.container(0, 0).setDepth(4).setVisible(false);

  var subT = this.add.text(W / 2, H * 0.135 + 62, 'A  SUPER  DUDE  ADVENTURE', {
    fontFamily: 'monospace', fontSize: '8px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(0.5);
  this.menu.add(subT);

  // portrait marquee on a steel shelf
  var shelfG = this.add.graphics();
  var heroes = ['danny', 'victoria', 'nayah', 'kevin', 'carlos', 'josh'];
  var pw = 34, gap = 8;
  var x0 = W / 2 - (heroes.length * (pw + gap) - gap) / 2 + pw / 2;
  PC.labPanel(shelfG, x0 - pw / 2 - 8, H * 0.40 - pw / 2 - 6,
    heroes.length * (pw + gap) - gap + 16, pw + 12, { rivets: true, base: 0x1c1733 });
  this.menu.add(shelfG);
  heroes.forEach(function (h, i) {
    var px = x0 + i * (pw + gap);
    var img = self.add.image(px, H * 0.40, 'atlas', 'portrait_' + h).setScale(pw / 128);
    var fr = self.add.graphics().lineStyle(1, 0x45356e, 1)
      .strokeRect(px - pw / 2 - 1, H * 0.40 - pw / 2 - 1, pw + 2, pw + 2);
    self.menu.add(img); self.menu.add(fr);
    self.tweens.add({ targets: img, y: img.y - 2, duration: 900 + i * 120,
      yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  });

  function button(y, label, color, glowCol, fn) {
    var bg2 = self.add.graphics();
    PC.labPanel(bg2, W / 2 - 78, y - 13, 156, 26, { rivets: true });
    var t = self.add.text(W / 2, y, label, {
      fontFamily: 'monospace', fontSize: '13px', color: color, fontStyle: 'bold',
      stroke: '#120e24', strokeThickness: 3,
    }).setOrigin(0.5);
    var zone = self.add.zone(W / 2, y, 168, 30).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', function () {
      if (PC.audio) { PC.audio.unlock(); PC.audio.ui(); }
      fn();
    });
    self.menu.add(bg2); self.menu.add(t); self.menu.add(zone);
    return t;
  }
  // linear story (v0.18): intro cinematic once, then the MISSION MAP -
  // the story assigns hero + mission, so PC_Select never appears here
  var start = button(H * 0.565, '>> STORY <<', '#a8e04a', 0xa8e04a, function () {
    if (PC.storyState.introSeen()) { self.scene.start('PC_Missions'); return; }
    // mark it HERE, at the moment we actually show it - the mission map
    // used to set the flag just by being opened, so anyone whose save
    // had ever reached the map could never see the intro again
    PC.storyState.setIntroSeen();
    self.scene.start('PC_Cutscene', { script: PC.STORY.scripts.intro,
      next: 'PC_Missions' });
  });
  this.tweens.add({ targets: start, alpha: 0.45, duration: 620, yoyo: true, repeat: -1 });
  button(H * 0.565 + 38, 'QUICK RUN', '#35d0ff', 0x35d0ff, function () {
    if (PC.STORY) PC.STORY.pendingMission = null;
    self.scene.start('PC_Select');
  });
  button(H * 0.565 + 76, 'POWER-UPS', '#f2c33c', 0xf2c33c, function () {
    self.scene.start('PC_Shop');
  });

  if (PC.DEV_MODE) {
    var sfxT = this.add.text(6, 6, '[ SFX TEST ]', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ff6b6b', fontStyle: 'bold',
    }).setInteractive({ useHandCursor: true });
    sfxT.on('pointerdown', function () {
      if (PC.audio) { PC.audio.unlock(); PC.audio.stopMusic(); PC.audio.earconTest(); }
    });
    this.menu.add(sfxT);
  }

  var goldT = this.add.text(W / 2, H * 0.565 + 108, '$ ' + PC.meta.gold(), {
    fontFamily: 'monospace', fontSize: '11px', color: '#f2c33c', fontStyle: 'bold',
  }).setOrigin(0.5);
  this.menu.add(goldT);
  this.menu.add(PC.stampVersion(this));

  // ---------- the logo plates (fall in during the sequence) ----------
  var plate1 = this.buildLogoPlate('PORTION', '#f2c33c', 0xf2c33c);
  var plate2 = this.buildLogoPlate('CONTROL', '#35d0ff', 0x35d0ff);
  plate1.setPosition(W / 2, -60).setDepth(5);
  plate2.setPosition(W / 2, -60).setDepth(5);
  this._plates = [plate1, plate2];
  this._plateY = [H * 0.135, H * 0.135 + 37];

  // ---------- the sealed bulkhead (topmost) ----------
  var doorW = Math.ceil(W / 2) + 2, doorH = H;
  var mkDoor = function (x) {
    var c = self.add.container(x, 0).setDepth(10);
    var plate = self.add.tileSprite(0, 0, doorW, doorH, 'atlas', 'ui_door_plate')
      .setOrigin(0, 0);
    c.add(plate);
    var og = self.add.graphics();
    og.fillStyle(0x000000, 0.34).fillRect(0, 0, doorW, 10);           // top occlusion
    og.fillStyle(0x000000, 0.42).fillRect(0, doorH - 14, doorW, 14);  // bottom occlusion
    og.fillStyle(0xffffff, 0.05).fillRect(0, 10, doorW, 3);           // top sheen
    c.add(og);
    return c;
  };
  this.doorL = mkDoor(0);
  this.doorR = mkDoor(W - doorW);
  // hazard stripes along the meeting seam + edge shadow
  var seamL = this.add.tileSprite(W / 2 - 7, H / 2, 8, H, 'atlas', 'ui_hazard').setDepth(11);
  var seamR = this.add.tileSprite(W / 2 + 7, H / 2, 8, H, 'atlas', 'ui_hazard').setDepth(11);
  var seamShadowL = this.add.rectangle(W / 2 - 13, H / 2, 4, H, 0x000000, 0.45).setDepth(11);
  var seamShadowR = this.add.rectangle(W / 2 + 13, H / 2, 4, H, 0x000000, 0.45).setDepth(11);
  // emblem lock over the seam + warning lamps
  var emblem = this.add.image(W / 2, H * 0.34, 'atlas', 'ui_emblem').setScale(1.4).setDepth(12);
  var lockTxt = this.add.text(W / 2, H * 0.34 + 52, 'SECURITY LAB - SEALED', {
    fontFamily: 'monospace', fontSize: '9px', color: '#ff6b6b', fontStyle: 'bold',
    stroke: '#120e24', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(12);
  var lampL = this.add.rectangle(W * 0.14, H * 0.12, 10, 4, 0xd93a3a).setDepth(12);
  var lampR = this.add.rectangle(W * 0.86, H * 0.12, 10, 4, 0xd93a3a).setDepth(12);
  this.tweens.add({ targets: [lampL, lampR, lockTxt], alpha: 0.25, duration: 420,
    yoyo: true, repeat: -1 });
  this._doorBits = [seamL, seamR, seamShadowL, seamShadowR, emblem, lockTxt, lampL, lampR];

  // ---------- run the sequence (tap anywhere to skip) ----------
  this._seq = [];
  var seq = function (delay, fn) { self._seq.push(self.time.delayedCall(delay, fn)); };
  seq(900, function () { self.openDoors(); });
  this.input.once('pointerdown', function () {
    if (PC.audio) PC.audio.unlock();
    if (!self._done) self.finishNow();
  });
};

// a logo word on a beveled steel plate with scanlines + glow
PC.TitleScene.prototype.buildLogoPlate = function (word, colorCss, colorHex) {
  var w = 172, h = 34;
  var g = this.add.graphics();
  PC.labPanel(g, -w / 2, -h / 2, w, h, { rivets: true, base: 0x1c1733, edge: 0x6d6a8e });
  g.fillStyle(colorHex, 0.10).fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 4); // color wash
  // scanlines
  for (var y = -h / 2 + 3; y < h / 2 - 2; y += 3) {
    g.fillStyle(0x000000, 0.10).fillRect(-w / 2 + 2, y, w - 4, 1);
  }
  var c = this.add.container(0, 0, [g]);
  var logo = PC.logoText(this, 0, 0, word, 26, colorCss);
  c.add(logo);
  // under-glow strip
  var glow = this.add.rectangle(0, h / 2 + 2, w - 20, 2, colorHex, 0.5);
  c.add(glow);
  this.tweens.add({ targets: glow, alpha: 0.15, duration: 800, yoyo: true, repeat: -1 });
  return c;
};

PC.TitleScene.prototype.openDoors = function () {
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  if (this._opened) return; this._opened = true;
  if (PC.audio) { PC.audio.clank(); }
  this.cameras.main.shake(140, 0.006);
  this.time.delayedCall(220, function () {
    if (PC.audio) PC.audio.hiss();
    var dur = 850;
    self.tweens.add({ targets: self.doorL, x: -W / 2 - 20, duration: dur, ease: 'Quad.in' });
    self.tweens.add({ targets: self.doorR, x: W + 20, duration: dur, ease: 'Quad.in' });
    self._doorBits.forEach(function (b) {
      self.tweens.add({ targets: b, x: b.x + (b.x < W / 2 ? -W / 2 - 30 : W / 2 + 30),
        alpha: 0, duration: dur, ease: 'Quad.in',
        onComplete: function () { b.setVisible(false); } });
    });
    self.time.delayedCall(dur - 80, function () { self.dropLogo(); });
  });
};

PC.TitleScene.prototype.dropLogo = function () {
  var self = this;
  if (this._logoDropped) return; this._logoDropped = true;
  this._plates.forEach(function (p, i) {
    self.time.delayedCall(i * 260, function () {
      self.tweens.add({ targets: p, y: self._plateY[i], duration: 300, ease: 'Quad.in',
        onComplete: function () {
          if (PC.audio) PC.audio.clank();
          self.cameras.main.shake(120, 0.008);
          self.fxSparks(p.x, self._plateY[i] + 14);
          self.tweens.add({ targets: p, y: self._plateY[i] - 5, duration: 90,
            yoyo: true, ease: 'Quad.out' });
          if (i === self._plates.length - 1) {
            self.time.delayedCall(260, function () { self.powerOnMenu(); });
          }
        } });
    });
  });
};

PC.TitleScene.prototype.fxSparks = function (x, y) {
  var self = this;
  for (var i = 0; i < 8; i++) {
    var s = this.add.rectangle(x + (Math.random() - 0.5) * 120, y, 2, 2,
      i % 2 ? 0xf2c33c : 0xf7f4ef).setDepth(6);
    this.tweens.add({ targets: s, y: y + 14 + Math.random() * 18,
      x: s.x + (Math.random() - 0.5) * 24, alpha: 0,
      duration: 300 + Math.random() * 200, onComplete: (function (r) {
        return function () { r.destroy(); };
      })(s) });
  }
};

PC.TitleScene.prototype.powerOnMenu = function () {
  var self = this;
  if (this._done) return; this._done = true;
  this.menu.setVisible(true).setAlpha(0);
  this.tweens.add({ targets: this.menu, alpha: 1, duration: 320 });
  if (PC.audio && PC.audio.fanfare) PC.audio.fanfare();
};

// skip: jump every actor to its final state (leave ambient tweens alive)
PC.TitleScene.prototype.finishNow = function () {
  var W = PC.RENDER.W, self = this;
  this._opened = true; this._logoDropped = true;
  (this._seq || []).forEach(function (t) { t.remove(false); });
  this.tweens.killTweensOf([this.doorL, this.doorR].concat(this._doorBits, this._plates));
  this.doorL.x = -W; this.doorR.x = W + W;
  this._doorBits.forEach(function (b) { b.setVisible(false); });
  this._plates.forEach(function (p, i) { p.setPosition(W / 2, self._plateY[i]); });
  this.powerOnMenu();
};
