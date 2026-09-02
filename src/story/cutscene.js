// cutscene.js - STORY-1 beat runner, v0.18.2 NEWSCAST presentation
// (Mark: "the intro is barely understandable... maybe it's a newscast.
// We're looking at an old style tube TV and on it is a newscast").
// The whole cinematic plays INSIDE a CRT: garage room -> tube TV powers
// on -> ACN (Adventure City News) chrome (BREAKING banner, ticker, LIVE
// bug) over close-up footage built from REAL sprites (Danny on the demo
// stage, Bloom/Sal/Pip, a crowd seen from behind) -> the soda tips, the
// flood erupts, SIGNAL LOST static -> day-2 flood report -> the TV dims
// and Danny himself steps forward for the wrist-pad call. Beat kinds:
//   { say: {speaker, text} }   { scene: 'off|news_desk|demo|flood|danny_room' }
//   { chrome: {banner, ticker, live} }   { music: tag }   { wait: ms }
//   { action: 'tvon|sodatip|floodburst|signallost|smashcut|portraits6|
//              flash|shake|confetti|chant' }
window.PC = window.PC || {};

PC.CutsceneScene = function () { Phaser.Scene.call(this, { key: 'PC_Cutscene' }); };
PC.CutsceneScene.prototype = Object.create(Phaser.Scene.prototype);
PC.CutsceneScene.prototype.constructor = PC.CutsceneScene;

PC.CutsceneScene.prototype.init = function (data) {
  this._script = (data && data.script) || [];
  this._next = (data && data.next) || 'PC_Title';
  this._nextData = (data && data.nextData) || undefined;
};

PC.CutsceneScene.prototype.create = function () {
  PC.applyRenderScale(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  this.cameras.main.setBackgroundColor(0x0d0a1c);

  // ---- the TV screen rect (4:3.2-ish tube, centered above the box) ----
  // v0.30.2: these were pixel constants tuned at BASE 312. After the
  // v0.27.2 zoom-out (BASE 400) the set stopped filling the frame and
  // floated high - Mark: "the TV... it's off center". Everything is
  // proportional to the viewport now, and the set is centred in the
  // space ABOVE the dialogue box rather than in the whole screen.
  var boxTop = H - PC.uiK(96);               // where the dialogue box starts
  var topPad = PC.uiK(30);                   // room for the antenna
  var sw = Math.round(Math.min(W - PC.uiK(34), (boxTop - topPad) / 0.82));
  var sh = Math.round(sw * 0.82);
  var sx = Math.round((W - sw) / 2);
  var sy = Math.round(topPad + (boxTop - topPad - sh) / 2);
  this.scr = { x: sx, y: sy, w: sw, h: sh };

  this.paintRoom();
  this.paintBezel();

  // footage: graphics + stamped sprites inside a masked container
  this.bg = this.add.graphics();
  this.tv = this.add.container(0, 0, [this.bg]).setDepth(10);
  this.bgImgs = [];
  var maskG = this.make.graphics({ add: false });
  maskG.fillStyle(0xffffff).fillRect(sx, sy, sw, sh);
  var mask = maskG.createGeometryMask();
  this.tv.setMask(mask);

  // news chrome (banner / ticker / LIVE bug) above footage
  this.chromeG = this.add.graphics().setDepth(20).setMask(mask);
  this.bannerTxt = this.add.text(sx + 26, sy + sh - 34, '', {
    fontFamily: 'monospace', fontSize: '9px', color: '#f7f4ef', fontStyle: 'bold',
  }).setOrigin(0, 0.5).setDepth(21).setMask(mask).setVisible(false);
  this.tickerTxt = this.add.text(sx + sw, sy + sh - 10, '', {
    fontFamily: 'monospace', fontSize: '7px', color: '#f2c33c', fontStyle: 'bold',
  }).setOrigin(0, 0.5).setDepth(21).setMask(mask).setVisible(false);
  this.liveTxt = this.add.text(sx + sw - 8, sy + 6, 'LIVE', {
    fontFamily: 'monospace', fontSize: '8px', color: '#f7f4ef', fontStyle: 'bold',
  }).setOrigin(1, 0).setDepth(21).setMask(mask).setVisible(false);
  this.acnTxt = this.add.text(sx + 8, sy + 10, 'ACN', {
    fontFamily: 'monospace', fontSize: '8px', color: '#f2c33c', fontStyle: 'bold',
  }).setOrigin(0, 0.5).setDepth(21).setMask(mask).setVisible(false);
  this.liveDot = this.add.circle(sx + sw - 36, sy + 11, 3, 0xd93a3a).setDepth(21)
    .setMask(mask).setVisible(false);
  this.tweens.add({ targets: this.liveDot, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

  // CRT glass pass: scanlines + vignette + glare (over chrome)
  this.paintGlass();

  // static / signal-lost layer
  this.staticG = this.add.graphics().setDepth(32).setMask(mask);
  this._staticT = 0; this._staticAlpha = 1;
  this.lostTxt = this.add.text(sx + sw / 2, sy + sh / 2, 'SIGNAL LOST', {
    fontFamily: 'monospace', fontSize: '13px', color: '#f7f4ef', fontStyle: 'bold',
    stroke: '#120e24', strokeThickness: 4,
  }).setOrigin(0.5).setDepth(33).setVisible(false);

  this.roomSprites = [];                     // danny_room actors (outside TV)
  this.fxLayer = this.add.graphics().setDepth(50);
  this.box = new PC.DialogueBox(this);
  this._i = 0; this._busy = false; this._ended = false;

  var skip = this.add.text(W - 6, 6, '[ SKIP > ]', {
    fontFamily: 'monospace', fontSize: '8px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(1, 0).setDepth(400).setInteractive({ useHandCursor: true });
  skip.on('pointerdown', function (p, lx, ly, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    self.finish();
  });

  this.input.on('pointerdown', function () {
    if (PC.audio) PC.audio.unlock();
    if (self.box.active) { self.box.tap(); return; }
    if (self._busy === 'wait') { self._busy = false; self._advance(); }
  });

  PC.stampVersion(this);
  this._advance();
};

// ---- the room around the TV (Danny's garage, night) ----
PC.CutsceneScene.prototype.paintRoom = function () {
  var W = PC.RENDER.W, H = PC.RENDER.H, R = this.scr;
  var g = this.add.graphics().setDepth(0);
  // wall falloff darker toward edges
  g.fillStyle(0x171330, 1).fillRect(0, 0, W, H);
  g.fillStyle(0x1c1733, 1).fillRect(W * 0.08, 0, W * 0.84, H);
  // shelf above the TV with tool silhouettes
  var shy = R.y - 26;
  if (shy > 26) {
    g.fillStyle(0x241f3d, 1).fillRect(W * 0.12, shy, W * 0.76, 4);
    g.fillStyle(0x120e24, 1);
    g.fillRect(W * 0.16, shy - 10, 8, 10);          // jar
    g.fillRect(W * 0.24, shy - 14, 4, 14);          // wrench upright
    g.fillRect(W * 0.30, shy - 8, 14, 8);           // toolbox
    g.fillRect(W * 0.70, shy - 12, 10, 12);         // canister
    g.fillStyle(0x35d0ff, 0.5).fillRect(W * 0.31, shy - 6, 3, 2);
  }
  // floor + TV stand
  var fy = R.y + R.h + 34;
  g.fillStyle(0x120e24, 1).fillRect(0, fy, W, H - fy);
  g.fillStyle(0x241f3d, 1).fillRect(R.x + 18, R.y + R.h + 22, R.w - 36, 14);
  g.fillStyle(0x0a0716, 0.8).fillRect(R.x + 22, fy, R.w - 44, 3);
  // TV glow spilling onto the room
  g.fillStyle(0x35d0ff, 0.05).fillRect(R.x - 16, R.y - 12, R.w + 32, R.h + 30);
};

// ---- the tube-TV shell: bezel, grille, dials, antenna ----
PC.CutsceneScene.prototype.paintBezel = function () {
  var R = this.scr;
  var bx = R.x - 12, by = R.y - 12, bw = R.w + 24, bh = R.h + 24 + 16;
  // BODY renders BELOW the footage (the screen is a window in it) -
  // filling it at detail depth was v0.18.2's black-screen bug: the one
  // big rounded rect covered the whole masked footage layer.
  var body = this.add.graphics().setDepth(4);
  body.fillStyle(0x0a0716, 0.6).fillRoundedRect(bx + 3, by + 4, bw, bh, 10);
  body.fillStyle(0x2b2338, 1).fillRoundedRect(bx, by, bw, bh, 10);
  body.fillStyle(0xffffff, 0.07).fillRoundedRect(bx, by, bw, 8, 10);      // top sheen
  body.fillStyle(0x000000, 0.25).fillRoundedRect(bx, by + bh - 10, bw, 10, 10);
  body.lineStyle(1, 0x45356e, 1).strokeRoundedRect(bx, by, bw, bh, 10);
  // dark tube glass behind the picture
  body.fillStyle(0x120e24, 1).fillRoundedRect(R.x - 5, R.y - 5, R.w + 10, R.h + 10, 6);
  // details OUTSIDE the screen window stay on top
  var g = this.add.graphics().setDepth(40);
  g.lineStyle(2, 0x0a0716, 1).strokeRoundedRect(R.x - 3, R.y - 3, R.w + 6, R.h + 6, 5);
  // speaker grille + dials strip under the screen
  var gy = R.y + R.h + 9;
  g.fillStyle(0x241f3d, 1).fillRoundedRect(R.x + 6, gy, R.w * 0.5, 10, 3);
  g.fillStyle(0x120e24, 1);
  for (var i = 0; i < 8; i++) g.fillRect(R.x + 12 + i * (R.w * 0.5 - 14) / 8, gy + 2, 2, 6);
  g.fillStyle(0x6d6a8e, 1).fillCircle(R.x + R.w - 20, gy + 5, 4);          // dial A
  g.fillStyle(0xf2c33c, 1).fillRect(R.x + R.w - 21, gy + 2, 2, 3);
  g.fillStyle(0x6d6a8e, 1).fillCircle(R.x + R.w - 38, gy + 5, 4);          // dial B
  g.fillStyle(0x120e24, 1).fillRect(R.x + R.w - 39, gy + 4, 2, 3);
  // brand plate
  var brand = this.add.text(R.x + R.w * 0.5 + 14, gy + 5, 'ACN-VISION', {
    fontFamily: 'monospace', fontSize: '6px', color: '#6d6a8e', fontStyle: 'bold',
  }).setOrigin(0, 0.5).setDepth(41);
  // rabbit-ear antenna
  var ax = R.x + R.w / 2;
  g.lineStyle(2, 0x45356e, 1);
  g.lineBetween(ax, R.y - 12, ax - 26, R.y - 34);
  g.lineBetween(ax, R.y - 12, ax + 20, R.y - 38);
  g.fillStyle(0x6d6a8e, 1).fillCircle(ax - 26, R.y - 34, 2);
  g.fillCircle(ax + 20, R.y - 38, 2);
  g.fillStyle(0x241f3d, 1).fillRoundedRect(ax - 8, R.y - 16, 16, 8, 3);
};

// ---- CRT glass: scanlines + edge vignette + glare streak ----
PC.CutsceneScene.prototype.paintGlass = function () {
  var R = this.scr;
  var g = this.add.graphics().setDepth(30);
  g.fillStyle(0x000000, 0.10);
  for (var y = R.y; y < R.y + R.h; y += 3) g.fillRect(R.x, y, R.w, 1);
  g.fillStyle(0x000000, 0.22);                       // corner vignette
  g.fillRect(R.x, R.y, R.w, 3); g.fillRect(R.x, R.y + R.h - 3, R.w, 3);
  g.fillRect(R.x, R.y, 3, R.h); g.fillRect(R.x + R.w - 3, R.y, 3, R.h);
  g.fillStyle(0xffffff, 0.05);                       // curved glare
  g.beginPath();
  g.moveTo(R.x + R.w * 0.12, R.y);
  g.lineTo(R.x + R.w * 0.34, R.y);
  g.lineTo(R.x + R.w * 0.10, R.y + R.h * 0.5);
  g.lineTo(R.x + R.w * 0.02, R.y + R.h * 0.5);
  g.closePath(); g.fill();
};

PC.CutsceneScene.prototype.finish = function () {
  if (this._ended) return;
  this._ended = true;
  if (PC.audio) PC.audio.stopMusic();
  this.scene.start(this._next, this._nextData);
};

PC.CutsceneScene.prototype._advance = function () {
  if (this._ended) return;
  if (this._i >= this._script.length) { this.finish(); return; }
  var beat = this._script[this._i++];
  var self = this;
  if (beat.say) {
    this.box.show(beat.say, function () { self._advance(); });
  } else if (beat.scene) {
    this.paintScene(beat.scene);
    this._advance();
  } else if (beat.chrome) {
    this.setChrome(beat.chrome);
    this._advance();
  } else if (beat.music) {
    this.musicCue(beat.music);
    this._advance();
  } else if (beat.wait) {
    this._busy = 'wait';
    this.time.delayedCall(beat.wait, function () {
      if (self._busy === 'wait') { self._busy = false; self._advance(); }
    });
  } else if (beat.action) {
    this.runAction(beat, function () { self._advance(); });
  } else {
    this._advance();
  }
};

// stamp a sprite into the footage (auto-cleaned on scene change)
PC.CutsceneScene.prototype.stamp = function (frame, x, y, scale, flip) {
  var im = this.add.image(x, y, 'atlas', frame).setScale(scale || 1);
  if (flip) im.setFlipX(true);
  this.tv.add(im);
  this.bgImgs.push(im);
  return im;
};

PC.CutsceneScene.prototype.clearFootage = function () {
  this.bg.clear();
  if (this._floodEv) { this._floodEv.remove(false); this._floodEv = null; }
  this._floodPulse = null;
  this.bgImgs.forEach(function (im) { im.destroy(); });
  this.bgImgs = [];
};

// ---- picture-in-picture inset (v0.73.0) ----
// A framed satellite window with a label strip, used for the news desk
// story graphic and for the Day-2 Danny link-up. kind: 'ray' paints the
// Nourish-Ray on the tower; 'portrait_*' stamps that portrait; 'anchor'
// stamps the anchor bust. Returns nothing; everything is footage.
PC.CutsceneScene.prototype._paintPip = function (x, y, w, h, kind, label) {
  var g = this.bg;
  g.fillStyle(0x0a0716, 0.6).fillRect(x + 3, y + 3, w, h);          // drop shadow
  g.fillStyle(0x120e24, 1).fillRect(x, y, w, h);
  var ih = h - 12;                                                   // image area above label
  if (kind === 'ray') {
    g.fillStyle(0x35d0ff, 1).fillRect(x + 2, y + 2, w - 4, ih - 2);
    g.fillStyle(0x7fb8d9, 0.6);
    g.fillEllipse(x + w * 0.3, y + 8, 16, 5); g.fillEllipse(x + w * 0.72, y + 13, 20, 6);
    g.fillStyle(0x1f4a66, 1);
    for (var b = 0; b < 5; b++) {
      var bh = ih * (0.22 + PC.hash01(b, 71, 3) * 0.3);
      g.fillRect(x + 3 + b * (w - 6) / 5, y + ih - bh, (w - 6) / 5 - 2, bh);
    }
    var tx = x + w * 0.5, tw = w * 0.16;
    g.fillStyle(0x2e2850, 1).fillRect(tx - tw / 2, y + ih * 0.28, tw, ih * 0.72);
    g.fillStyle(0x45356e, 1).fillRect(tx - tw / 2 - 2, y + ih * 0.28, tw + 4, 3);
    g.fillStyle(0xf2c33c, 0.7);
    for (var wn = 0; wn < 6; wn++) g.fillRect(tx - tw / 2 + 2 + (wn % 2) * (tw / 2), y + ih * 0.36 + Math.floor(wn / 2) * 6, 2, 3);
    g.fillStyle(0x6d6a8e, 1).fillRect(tx - 4, y + ih * 0.18, 8, ih * 0.10); // dish stem
    g.fillStyle(0x35d0ff, 1).fillCircle(tx, y + ih * 0.16, 4);
    g.fillStyle(0xffffff, 0.9).fillCircle(tx - 1, y + ih * 0.14, 1.5);
    g.fillStyle(0xfff6e0, 0.25).fillTriangle(tx, y + ih * 0.16, tx - w * 0.3, y + 2, tx + w * 0.3, y + 2);
    g.lineStyle(1, 0xfff6e0, 0.5).strokeCircle(tx, y + ih * 0.16, 7);
  } else if (kind === 'anchor') {
    g.fillStyle(0x1c3a52, 1).fillRect(x + 2, y + 2, w - 4, ih - 2);
    g.fillStyle(0x35d0ff, 0.5).fillRect(x + 4, y + 4, w - 8, ih * 0.45);
    this.stamp('portrait_anchor', x + w / 2, y + 2 + ih * 0.55, (ih * 0.95) / 128);
  } else {
    g.fillStyle(0x1a1630, 1).fillRect(x + 2, y + 2, w - 4, ih - 2);
    g.fillStyle(0x35d0ff, 0.10).fillRect(x + 2, y + 2, w - 4, ih - 2);
    this.stamp(kind, x + w / 2, y + 2 + ih * 0.5, (ih - 6) / 128);
  }
  // corner brackets + label strip
  g.lineStyle(2, 0xf2c33c, 1).strokeRect(x, y, w, h);
  g.fillStyle(0xf2c33c, 1).fillRect(x, y + h - 12, w, 12);
  var t = this.add.text(x + w / 2, y + h - 6, label || '', {
    fontFamily: 'monospace', fontSize: '6px', color: '#120e24', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(11);
  this.tv.add(t); this.bgImgs.push(t);
};

// ---- news chrome ----
PC.CutsceneScene.prototype.setChrome = function (c) {
  var R = this.scr, g = this.chromeG;
  g.clear();
  this._tickerText = c && c.ticker ? '  +++  ' + c.ticker : null;
  if (!c) {
    this.bannerTxt.setVisible(false); this.tickerTxt.setVisible(false);
    this.liveTxt.setVisible(false); this.liveDot.setVisible(false);
    this.acnTxt.setVisible(false);
    return;
  }
  this.acnTxt.setVisible(true);
  // ACN bug (top-left)
  g.fillStyle(0x120e24, 0.85).fillRect(R.x + 4, R.y + 4, 30, 13);
  g.fillStyle(0xf2c33c, 1).fillRect(R.x + 4, R.y + 15, 30, 2);
  // LIVE bug (top-right)
  if (c.live) {
    g.fillStyle(0x120e24, 0.85).fillRect(R.x + R.w - 44, R.y + 4, 40, 13);
    this.liveTxt.setVisible(true); this.liveDot.setVisible(true);
  } else {
    this.liveTxt.setVisible(false); this.liveDot.setVisible(false);
  }
  // banner bar
  if (c.banner) {
    g.fillStyle(0xd93a3a, 1).fillRect(R.x, R.y + R.h - 42, R.w, 16);
    g.fillStyle(0xfff6e0, 1).fillRect(R.x, R.y + R.h - 42, 4, 16);
    g.fillStyle(0x8f1f1f, 1).fillRect(R.x, R.y + R.h - 26, R.w, 2);
    this.bannerTxt.setText(c.banner).setVisible(true);
  } else {
    this.bannerTxt.setVisible(false);
  }
  // ticker strip
  if (c.ticker) {
    g.fillStyle(0x120e24, 0.92).fillRect(R.x, R.y + R.h - 18, R.w, 18);
    this.tickerTxt.setText(this._tickerText).setVisible(true);
    this.tickerTxt.x = R.x + R.w;
  } else {
    this.tickerTxt.setVisible(false);
  }
};

// ---- scene painters (all inside the TV rect) ----
PC.CutsceneScene.prototype.paintScene = function (name) {
  var R = this.scr, g = this.bg, self = this;
  this.clearFootage();
  this.setChrome(null);
  this.lostTxt.setVisible(false);
  this._staticT = 0; this.staticG.clear();
  this.roomSprites.forEach(function (o) { o.destroy(); });
  this.roomSprites = [];

  if (name === 'off' || name === 'black') {
    g.fillStyle(0x08060f, 1).fillRect(R.x, R.y, R.w, R.h);
    return;
  }

  if (name === 'news_desk' || name === 'news_desk_danny') {
    // newsroom: window band w/ skyline, desk, the anchor, story graphic.
    // v0.73.0: the inset is a real picture-in-picture (_paintPip); the
    // 'news_desk_danny' variant puts DANNY in the window, live from his
    // garage, so Day 2 comes back to the desk instead of a street stand-up.
    var withDanny = name === 'news_desk_danny';
    g.fillStyle(0x1c3a52, 1).fillRect(R.x, R.y, R.w, R.h);
    g.fillStyle(0x35d0ff, 0.9).fillRect(R.x + 8, R.y + 10, R.w - 16, R.h * 0.42);
    g.fillStyle(0xcfe9f2, 0.8);
    g.fillEllipse(R.x + R.w * 0.3, R.y + 24, 30, 8);
    g.fillEllipse(R.x + R.w * 0.7, R.y + 34, 38, 9);
    g.fillStyle(0x2a5a7a, 1);                        // skyline in the window
    for (var b = 0; b < 7; b++) {
      var bh2 = 18 + PC.hash01(b, 3, 5) * 34;
      g.fillRect(R.x + 10 + b * (R.w - 20) / 7, R.y + 10 + R.h * 0.42 - bh2,
        (R.w - 20) / 7 - 4, bh2);
    }
    // ADVENTURE TOWER stands tallest, the Ray glinting on top
    var tx = R.x + R.w * 0.72;
    g.fillStyle(0x1f4a66, 1).fillRect(tx, R.y + 14, 16, R.h * 0.42 - 4);
    g.fillStyle(0x35d0ff, 1).fillRect(tx + 6, R.y + 8, 4, 8);
    g.fillStyle(0xfff6e0, 0.9).fillRect(tx + 7, R.y + 6, 2, 2);
    g.lineStyle(2, 0x0f2a3d, 1).strokeRect(R.x + 8, R.y + 10, R.w - 16, R.h * 0.42);
    // window mullions
    g.lineBetween(R.x + R.w / 2, R.y + 10, R.x + R.w / 2, R.y + 10 + R.h * 0.42);
    // desk
    g.fillStyle(0x241f3d, 1).fillRect(R.x, R.y + R.h * 0.66, R.w, R.h * 0.34);
    g.fillStyle(0x2e2850, 1).fillRect(R.x, R.y + R.h * 0.66, R.w, 6);
    g.fillStyle(0xf2c33c, 1).fillRect(R.x + R.w * 0.30, R.y + R.h * 0.74, R.w * 0.4, 10);
    var plate = this.add.text(R.x + R.w / 2, R.y + R.h * 0.74 + 5, 'ACN NEWS', {
      fontFamily: 'monospace', fontSize: '8px', color: '#120e24', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    this.tv.add(plate); this.bgImgs.push(plate);
    // the anchor bust behind the desk
    this.stamp('portrait_anchor', R.x + R.w * 0.30, R.y + R.h * 0.47, (R.h * 0.52) / 128);
    // picture-in-picture window, upper right, clear of the anchor
    var pw = R.w * 0.36, ph = R.h * 0.38;
    var px0 = R.x + R.w * 0.58, py0 = R.y + R.h * 0.22;
    if (withDanny) {
      this._paintPip(px0, py0, pw, ph, 'portrait_danny', 'DANNY - LIVE');
      // link-up icon between desk and window
      g.fillStyle(0x35d0ff, 0.9).fillCircle(px0 - 8, py0 + ph * 0.5, 2);
      g.lineStyle(1, 0x35d0ff, 0.6).strokeCircle(px0 - 8, py0 + ph * 0.5, 5);
      g.lineStyle(1, 0x35d0ff, 0.3).strokeCircle(px0 - 8, py0 + ph * 0.5, 8);
    } else {
      this._paintPip(px0, py0, pw, ph, 'ray', 'THE NOURISH-RAY');
    }
    return;
  }

  if (name === 'demo' || name === 'flood') {
    var flooded = name === 'flood';
    // sky
    g.fillStyle(flooded ? 0x241f3d : 0x35d0ff, 1).fillRect(R.x, R.y, R.w, R.h);
    if (flooded) {
      g.fillStyle(0xcfd4e8, 0.5);
      for (var st = 0; st < 14; st++) {
        g.fillRect(R.x + PC.hash01(st, 1, 7) * R.w, R.y + PC.hash01(st, 2, 8) * R.h * 0.3, 1, 1);
      }
      g.fillStyle(0xcfd4e8, 0.3).fillCircle(R.x + R.w * 0.85, R.y + 18, 9);
    } else {
      g.fillStyle(0xf2c33c, 1).fillCircle(R.x + R.w * 0.85, R.y + 18, 10);
      g.fillStyle(0xfff6e0, 0.5).fillCircle(R.x + R.w * 0.85, R.y + 18, 14);
      g.fillStyle(0xffffff, 0.9);
      g.fillEllipse(R.x + R.w * 0.25, R.y + 16, 34, 9);
      g.fillEllipse(R.x + R.w * 0.55, R.y + 26, 26, 8);
    }
    // faded far city (we're up on the mega-tower's plaza deck)
    g.fillStyle(flooded ? 0x1c1733 : 0x7fb8d9, flooded ? 1 : 0.55);
    for (var b2 = 0; b2 < 8; b2++) {
      var bh3 = 12 + PC.hash01(b2, 5, 9) * 26;
      g.fillRect(R.x + b2 * R.w / 8, R.y + R.h * 0.40 - bh3, R.w / 8 - 3, bh3);
    }
    // deck ground
    g.fillStyle(flooded ? 0x3a3652 : 0x6d6a8e, 1).fillRect(R.x, R.y + R.h * 0.40, R.w, R.h * 0.60);
    g.fillStyle(0x000000, 0.12);
    for (var s2 = 0; s2 < R.w; s2 += 26) g.fillRect(R.x + s2, R.y + R.h * 0.40, 1, R.h * 0.60);
    g.fillRect(R.x, R.y + R.h * 0.40, R.w, 2);
    // the demo stage (center)
    var stX = R.x + R.w * 0.5, stY = R.y + R.h * 0.46, stW = R.w * 0.62, stH = 12;
    g.fillStyle(0x0a0716, 0.4).fillRect(stX - stW / 2 + 3, stY + stH, stW, 5);
    g.fillStyle(0x8a5a30, 1).fillRect(stX - stW / 2, stY, stW, stH);
    g.fillStyle(0xa8713f, 1).fillRect(stX - stW / 2, stY, stW, 3);
    g.fillStyle(0x120e24, 0.5);
    for (var pk = 1; pk < 6; pk++) g.fillRect(stX - stW / 2 + pk * stW / 6, stY, 1, stH);
    if (!flooded) {
      // bunting + the Nourish-Ray machine on stage
      for (var bt = 0; bt < 7; bt++) {
        g.fillStyle([0xd93a3a, 0xf2c33c, 0x35d0ff][bt % 3], 1);
        g.fillTriangle(stX - stW / 2 + bt * stW / 7 + 4, stY - 1,
          stX - stW / 2 + bt * stW / 7 + 12, stY - 1,
          stX - stW / 2 + bt * stW / 7 + 8, stY + 6);
      }
      var rx = stX + stW * 0.27, ry = stY - 2;
      g.fillStyle(0x45356e, 1).fillRect(rx - 5, ry - 20, 10, 20);       // pedestal
      g.fillStyle(0x6d6a8e, 1).fillRect(rx - 8, ry - 24, 16, 6);        // console
      g.fillStyle(0x35d0ff, 1).fillCircle(rx, ry - 32, 6);              // emitter orb
      g.fillStyle(0xffffff, 0.85).fillCircle(rx - 2, ry - 34, 2);
      g.lineStyle(2, 0x35d0ff, 0.5).strokeCircle(rx, ry - 32, 9);
      this._rayAnchor = { x: rx, y: ry - 24 };                          // sodatip target
      // Danny presenting on stage + Bloom beside him
      this.stamp('char_danny_idle', stX - stW * 0.16, stY + 2, 0.85);
      this.stamp('cs_bloom', stX + stW * 0.05, stY + 3, 0.8);
      // Sal's cart at the edge, Pip pointing up front-row
      this.stamp('cs_sal', R.x + R.w * 0.86, R.y + R.h * 0.62, 0.9);
      this.stamp('cs_pip', R.x + R.w * 0.18, R.y + R.h * 0.66, 0.9);
      // the crowd, seen from behind, facing the stage
      var civs = ['cs_civ_a', 'cs_civ_b', 'cs_civ_c'];
      for (var cv = 0; cv < 7; cv++) {
        this.stamp(civs[cv % 3], R.x + R.w * (0.10 + (cv * 0.13) % 0.82),
          R.y + R.h * (0.76 + PC.hash01(cv, 4, 6) * 0.14),
          0.85 + PC.hash01(cv, 2, 3) * 0.3, cv % 2 === 1);
      }
    } else {
      // the flood: stage half-buried under piled food stills
      var stills = ['still_d1_fry', 'still_d1_hotdog', 'still_d1_popcorn',
                    'still_d1_toast', 'still_d1_pretzel'];
      for (var f = 0; f < 24; f++) {
        this.stamp(stills[f % stills.length],
          R.x + PC.hash01(f, 13, 21) * R.w,
          R.y + R.h * 0.48 + PC.hash01(f, 14, 22) * R.h * 0.48,
          0.8 + (f % 3) * 0.25).setAngle((f * 53) % 40 - 20);
      }
      g.fillStyle(0xff9d3b, 0.12).fillRect(R.x, R.y + R.h * 0.40, R.w, R.h * 0.60);
      var hint = this.add.text(stX, stY - 6, '', { fontSize: '1px' });   // keep z-order stable
      this.tv.add(hint); this.bgImgs.push(hint);
    }
    return;
  }

  if (name === 'danny_interview') {
    // v0.30.2 (Mark: "whenever Super Dude Danny is alone and he's like
    // thinking, it should really be another interview... he's saying,
    // what are you gonna do? I'm gonna find the team"). Danny answers
    // the press ON CAMERA instead of brooding alone - it keeps the whole
    // intro inside the newscast framing and gives him a public promise.
    var W3 = R.w, dep = 12;
    g.fillStyle(0x1a1630, 1).fillRect(R.x, R.y, R.w, R.h);          // night plaza
    g.fillStyle(0x241f3d, 1).fillRect(R.x, R.y + R.h * 0.62, R.w, R.h * 0.38);
    g.fillStyle(0x120e24, 1);                                        // skyline
    for (var s3 = 0; s3 < 7; s3++) {
      var bw3 = R.w * (0.07 + PC.hash01(s3, 61, 3) * 0.07);
      var bh3 = R.h * (0.16 + PC.hash01(s3, 62, 4) * 0.24);
      g.fillRect(R.x + s3 * (R.w / 7) + 4, R.y + R.h * 0.62 - bh3, bw3, bh3);
    }
    g.fillStyle(0xf2c33c, 0.5);                                      // lit windows
    for (s3 = 0; s3 < 22; s3++) {
      g.fillRect(R.x + 8 + PC.hash01(s3, 63, 5) * (R.w - 16),
                 R.y + R.h * 0.34 + PC.hash01(s3, 64, 6) * R.h * 0.26, 2, 3);
    }
    // camera-light bloom on the pavement
    g.fillStyle(0xffffff, 0.06);
    g.fillEllipse ? g.fillEllipse(R.x + R.w * 0.5, R.y + R.h * 0.82, R.w * 0.7, R.h * 0.2)
                  : g.fillRect(R.x + R.w * 0.2, R.y + R.h * 0.74, R.w * 0.6, R.h * 0.16);
    // stamp() centres its image, and the news banner eats the bottom
    // ~14% of the screen - stand them ON a ground line at 0.70h so both
    // figures sit clear of the chrome
    var ground = R.y + R.h * 0.70;
    var sc3 = R.h / 150;                       // figures scale with the set
    this.stamp('cs_reporter', R.x + R.w * 0.26, ground - 48 * sc3 * 0.42, sc3 * 0.92);
    this.stamp('cs_danny_mic', R.x + R.w * 0.66, ground - 48 * sc3 * 0.5, sc3 * 1.1);
    g.fillStyle(0x0a0716, 0.35);               // contact shadows
    g.fillEllipse(R.x + R.w * 0.26, ground + 2, 46 * sc3 * 0.5, 10 * sc3 * 0.5);
    g.fillEllipse(R.x + R.w * 0.66, ground + 2, 52 * sc3 * 0.5, 11 * sc3 * 0.5);
    // press flashes popping in the dark
    var self3 = this;
    [0.08, 0.4, 0.86].forEach(function (fx3, i3) {
      var fl = self3.add.rectangle(R.x + R.w * fx3, R.y + R.h * 0.5,
        R.w * 0.3, R.h * 0.5, 0xffffff, 0).setDepth(24);
      self3.tv.add(fl);
      self3.tweens.add({ targets: fl, fillAlpha: 0.22, duration: 90,
        yoyo: true, repeat: -1, delay: 400 + i3 * 900, repeatDelay: 1500 + i3 * 700 });
    });
    return;
  }
  if (name === 'danny_live') {
    // v0.73.0 (Mark: "it should return to the newscaster with Danny in a
    // picture-in-picture replying, and maybe he calls out to the team
    // through that newscast"): the feed flips - Danny fills the screen,
    // live from the Super Dude Garage, and the anchor shrinks to the PiP.
    g.fillStyle(0x1a1630, 1).fillRect(R.x, R.y, R.w, R.h);
    // garage back wall: pegboard, tool shadows, a workbench, the big
    // roll-up door with its stripe, monitors glowing
    g.fillStyle(0x241f3d, 1).fillRect(R.x, R.y, R.w, R.h * 0.62);
    g.fillStyle(0x2e2850, 1).fillRect(R.x + R.w * 0.04, R.y + R.h * 0.08, R.w * 0.34, R.h * 0.36);
    g.fillStyle(0x120e24, 0.7);
    for (var pgx = 0; pgx < 6; pgx++) for (var pgy = 0; pgy < 5; pgy++) {
      g.fillRect(R.x + R.w * 0.06 + pgx * R.w * 0.05, R.y + R.h * 0.10 + pgy * R.h * 0.065, 2, 2);
    }
    g.fillStyle(0x6d6a8e, 1);                                          // hung tools
    g.fillRect(R.x + R.w * 0.08, R.y + R.h * 0.13, 3, R.h * 0.14);
    g.fillRect(R.x + R.w * 0.16, R.y + R.h * 0.13, 8, 4); g.fillRect(R.x + R.w * 0.18, R.y + R.h * 0.13, 3, R.h * 0.12);
    g.fillRect(R.x + R.w * 0.28, R.y + R.h * 0.15, 5, R.h * 0.10);
    g.fillStyle(0x3a3652, 1).fillRect(R.x + R.w * 0.62, R.y + R.h * 0.06, R.w * 0.34, R.h * 0.50); // roll-up door
    g.fillStyle(0x120e24, 0.35);
    for (var sl = 0; sl < 7; sl++) g.fillRect(R.x + R.w * 0.62, R.y + R.h * 0.06 + sl * R.h * 0.07, R.w * 0.34, 2);
    g.fillStyle(0xf2c33c, 0.9).fillRect(R.x + R.w * 0.62, R.y + R.h * 0.30, R.w * 0.34, 5);
    g.fillStyle(0x120e24, 0.9);
    for (var hz = 0; hz < 6; hz++) g.fillRect(R.x + R.w * 0.62 + hz * R.w * 0.06, R.y + R.h * 0.30, R.w * 0.03, 5);
    // floor + workbench
    g.fillStyle(0x2a2542, 1).fillRect(R.x, R.y + R.h * 0.62, R.w, R.h * 0.38);
    g.fillStyle(0x000000, 0.12);
    for (var fl = 0; fl < R.w; fl += 22) g.fillRect(R.x + fl, R.y + R.h * 0.62, 1, R.h * 0.38);
    g.fillStyle(0x8a5a30, 1).fillRect(R.x + R.w * 0.04, R.y + R.h * 0.56, R.w * 0.40, 8);
    g.fillStyle(0xa8713f, 1).fillRect(R.x + R.w * 0.04, R.y + R.h * 0.56, R.w * 0.40, 2);
    g.fillStyle(0x6d6a8e, 1).fillRect(R.x + R.w * 0.06, R.y + R.h * 0.64, 6, R.h * 0.12);
    g.fillRect(R.x + R.w * 0.40, R.y + R.h * 0.64, 6, R.h * 0.12);
    // bench monitors, glowing cyan (the wrist-pad grid)
    g.fillStyle(0x120e24, 1).fillRect(R.x + R.w * 0.10, R.y + R.h * 0.40, R.w * 0.13, R.h * 0.15);
    g.fillStyle(0x35d0ff, 0.85).fillRect(R.x + R.w * 0.11, R.y + R.h * 0.41, R.w * 0.11, R.h * 0.12);
    g.fillStyle(0x120e24, 0.6);
    for (var gr = 0; gr < 4; gr++) g.fillRect(R.x + R.w * 0.11, R.y + R.h * 0.41 + gr * R.h * 0.03, R.w * 0.11, 1);
    g.fillStyle(0x35d0ff, 0.10).fillEllipse(R.x + R.w * 0.5, R.y + R.h * 0.72, R.w * 0.6, R.h * 0.22);
    // Danny at the mic, big, facing the camera; camera-light halo
    var scl = R.h / 150;
    g.fillStyle(0xffffff, 0.05).fillCircle(R.x + R.w * 0.5, R.y + R.h * 0.45, R.h * 0.34);
    this.stamp('cs_danny_mic', R.x + R.w * 0.5, R.y + R.h * 0.70 - 48 * scl * 0.62, scl * 1.35);
    g.fillStyle(0x0a0716, 0.35).fillEllipse(R.x + R.w * 0.5, R.y + R.h * 0.72, 52 * scl * 0.62, 11 * scl * 0.62);
    // the anchor, now the small window
    this._paintPip(R.x + R.w * 0.66, R.y + R.h * 0.20, R.w * 0.28, R.h * 0.30, 'anchor', 'ACN DESK');
    return;
  }
  if (name === 'danny_room') {
    // the TV drops to idle static; Danny himself steps into the room
    g.fillStyle(0x08060f, 1).fillRect(R.x, R.y, R.w, R.h);
    this._staticT = 9999; this._staticAlpha = 0.25;
    // Danny stands IN FRONT of the set (above bezel depth 40-41), feet
    // on the room floor, lit by the static's glow
    var W2 = PC.RENDER.W;
    // char canvases pad below the figure, so the puddle sits ~14px up
    var dx = W2 / 2, dy = this.scr.y + this.scr.h + 56;
    var glow = this.add.ellipse(dx, dy - 12, 96, 20, 0x35d0ff, 0.14).setDepth(44);
    var danny = this.add.image(dx, dy, 'atlas', 'char_danny_idle')
      .setOrigin(0.5, 0.9).setScale(1.3).setDepth(45);
    this.tweens.add({ targets: danny, y: dy - 2, duration: 900, yoyo: true,
      repeat: -1, ease: 'Sine.inOut' });
    this.roomSprites.push(glow, danny);
    return;
  }
};

// ---- music cues ----
PC.CutsceneScene.prototype.musicCue = function (tag) {
  if (!PC.audio) return;
  if (tag === 'stop') { PC.audio.stopMusic(); return; }
  PC.audio.musicCue ? PC.audio.musicCue(tag) : PC.audio.startMusic();
};

// ---- scripted actions ----
PC.CutsceneScene.prototype.runAction = function (beat, done) {
  var W = PC.RENDER.W, H = PC.RENDER.H, R = this.scr, self = this;
  var a = beat.action;
  if (a === 'tvon') {
    // CRT power-on: dot -> horizontal line -> full picture.
    // v0.73.0 (Mark: "the TV turning on effect is off centered / not on
    // screen"): tweening a Rectangle's width grew it from its top-left
    // corner, so the line shot off to the right of the set. It is now a
    // graphics redraw centred on the tube every frame, masked to the
    // glass, with a warm phosphor glow that blooms then settles.
    if (PC.audio) PC.audio.hiss();
    var cx = R.x + R.w / 2, cy = R.y + R.h / 2;
    var pg = this.add.graphics().setDepth(34).setMask(this.tv.mask);
    var st = { w: 3, h: 2, a: 1, glow: 0 };
    var draw = function () {
      pg.clear();
      pg.fillStyle(0xfff6e0, st.glow * 0.35).fillEllipse(cx, cy, st.w + 30, st.h + 30);
      pg.fillStyle(0xffffff, st.a).fillRect(cx - st.w / 2, cy - st.h / 2, st.w, st.h);
      pg.fillStyle(0x35d0ff, st.a * 0.6).fillRect(cx - st.w / 2, cy - st.h / 2 - 1, st.w, 1);
    };
    draw();
    this.tweens.add({ targets: st, glow: 1, duration: 200, yoyo: true });
    this.tweens.add({ targets: st, w: R.w, duration: 280, ease: 'Quad.out', onUpdate: draw,
      onComplete: function () {
        self.tweens.add({ targets: st, h: R.h, a: 0.75, duration: 220, ease: 'Quad.in',
          onUpdate: draw,
          onComplete: function () {
            self.tweens.add({ targets: st, a: 0, duration: 260, onUpdate: draw,
              onComplete: function () { pg.destroy(); done(); } });
          } });
      } });
    this._staticT = 0.7; this._staticAlpha = 0.5;
  } else if (a === 'signallost') {
    if (PC.audio) PC.audio.hiss();
    this.setChrome(null);
    this.clearFootage();
    this.bg.fillStyle(0x08060f, 1).fillRect(R.x, R.y, R.w, R.h);
    this._staticT = 1.6; this._staticAlpha = 1;
    this.lostTxt.setVisible(true);
    this.time.delayedCall(1500, function () {
      self.lostTxt.setVisible(false);
      done();
    });
  } else if (a === 'flash') {
    var r = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff).setDepth(390);
    this.tweens.add({ targets: r, alpha: 0, duration: 500,
      onComplete: function () { r.destroy(); done(); } });
  } else if (a === 'shake') {
    this.cameras.main.shake(300, 0.01);
    this.time.delayedCall(340, done);
  } else if (a === 'smashcut') {
    var card = this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(390);
    var t = this.add.text(W / 2, H / 2, beat.text || 'ONE DAY LATER', {
      fontFamily: 'monospace', fontSize: '16px', color: '#f7f4ef', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(391).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 300 });
    this.time.delayedCall(1400, function () {
      self.tweens.add({ targets: [card, t], alpha: 0, duration: 350,
        onComplete: function () { card.destroy(); t.destroy(); done(); } });
    });
  } else if (a === 'sodatip') {
    // the fateful cup on the Ray console (in the footage)
    var an = this._rayAnchor || { x: R.x + R.w / 2, y: R.y + R.h / 2 };
    var cup = this.add.container(an.x + 16, an.y - 6).setDepth(11);
    var cg = this.add.graphics();
    cg.fillStyle(0xd93a3a, 1).fillRect(-4, -10, 8, 12);
    cg.fillStyle(0xf7f4ef, 1).fillRect(-4, -12, 8, 3);
    cg.fillStyle(0x6d6a8e, 1).fillRect(-1, -18, 1, 7);
    cup.add(cg);
    this.tv.add(cup); this.bgImgs.push(cup);
    if (PC.audio) PC.audio.hiss();
    this.tweens.add({ targets: cup, angle: 100, x: an.x + 6, y: an.y - 2,
      duration: 700, ease: 'Quad.in',
      onComplete: function () {
        for (var i = 0; i < 8; i++) {
          var s = self.add.rectangle(an.x + 2 + Math.random() * 8, an.y,
            2, 2, 0xcfd4e8).setDepth(11);
          self.tv.add(s); self.bgImgs.push(s);
          self.tweens.add({ targets: s, y: an.y + 8, alpha: 0,
            duration: 380 + Math.random() * 220 });
        }
        self.time.delayedCall(600, done);
      } });
  } else if (a === 'floodburst') {
    // the Ray erupts INSIDE the footage; camera crew loses it
    this.cameras.main.shake(600, 0.012);
    if (PC.audio) PC.audio.clank();
    var src = this._rayAnchor || { x: R.x + R.w / 2, y: R.y + R.h / 2 };
    var r2 = this.add.rectangle(R.x + R.w / 2, R.y + R.h / 2, R.w, R.h, 0xf2c33c)
      .setDepth(12).setAlpha(0.8);
    this.tv.add(r2); this.bgImgs.push(r2);
    this.tweens.add({ targets: r2, alpha: 0, duration: 700 });
    // v0.73.0 (Mark: "the food flying out effect should NOT stop, it
    // should keep going, keeps producing"): the Ray is a fountain now.
    // A looping emitter keeps spitting snacks until the footage changes
    // (clearFootage kills it); each snack arcs up, falls, and is freed.
    var stills = ['still_d1_fry', 'still_d1_hotdog', 'still_d1_popcorn', 'still_d1_toast',
                  'still_d1_pretzel'];
    var n = 0, live = 0;
    var spit = function () {
      if (live > 26) return;
      var i2 = n++;
      var im = self.stamp(stills[i2 % stills.length], src.x, src.y - 12,
        0.55 + PC.hash01(i2, 3, 9) * 0.35);
      im.setDepth(12); live++;
      var side = (i2 % 2 === 0 ? -1 : 1) * (0.2 + Math.random() * 0.8);
      self.tweens.add({ targets: im,
        x: src.x + side * R.w * 0.5,
        y: R.y + 4 + Math.random() * 24, angle: Math.random() * 360,
        duration: 420 + Math.random() * 160, ease: 'Quad.out',
        onComplete: function () {
          self.tweens.add({ targets: im, y: R.y + R.h + 24, angle: im.angle + 120,
            duration: 520 + Math.random() * 200, ease: 'Quad.in',
            onComplete: function () {
              live--;
              var k = self.bgImgs.indexOf(im);
              if (k >= 0) self.bgImgs.splice(k, 1);
              im.destroy();
            } });
        } });
    };
    if (this._floodEv) this._floodEv.remove(false);
    this._floodEv = this.time.addEvent({ delay: 55, loop: true, callback: spit });
    // the glow on the emitter never dies down either
    var pulse = this.add.graphics().setDepth(11);
    this.tv.add(pulse); this.bgImgs.push(pulse);
    this._floodPulse = pulse;
    this._staticT = 2.2; this._staticAlpha = 0.18;   // transmission wobble
    this.time.delayedCall(1700, done);
  } else if (a === 'portraits6') {
    var heroes = ['victoria', 'josh', 'kevin', 'carlos', 'nayah', 'danny'];
    var pw = 40, gap = 8;
    var x0 = W / 2 - (heroes.length * (pw + gap) - gap) / 2 + pw / 2;
    var imgs = [];
    heroes.forEach(function (h, i) {
      self.time.delayedCall(i * 180, function () {
        var im = self.add.image(x0 + i * (pw + gap), R.y + R.h * 0.35, 'atlas',
          'portrait_' + h).setDepth(80).setScale(0.01);
        imgs.push(im);
        self.tweens.add({ targets: im, scale: pw / 128, duration: 220, ease: 'Back.out' });
        if (PC.audio) PC.audio.gem();
      });
    });
    this.time.delayedCall(heroes.length * 180 + 700, function () {
      imgs.forEach(function (im) {
        self.tweens.add({ targets: im, alpha: 0, duration: 400,
          onComplete: function () { im.destroy(); } });
      });
      done();
    });
  } else if (a === 'confetti' || a === 'chant') {
    var COLORS = [0xa8e04a, 0xf2c33c, 0x35d0ff, 0xff6b6b, 0xff9ecb];
    for (var ci = 0; ci < 40; ci++) {
      var cf = this.add.rectangle(Math.random() * W, -8 - Math.random() * 60,
        4, 6, COLORS[ci % COLORS.length]).setDepth(380);
      this.tweens.add({ targets: cf, y: H + 12,
        x: cf.x + (Math.random() - 0.5) * 50, angle: 360,
        duration: 1400 + Math.random() * 900, onComplete: (function (r3) {
          return function () { r3.destroy(); }; })(cf) });
    }
    if (PC.audio && PC.audio.fanfare) PC.audio.fanfare();
    this.time.delayedCall(1200, done);
  } else {
    done();
  }
};

PC.CutsceneScene.prototype.update = function (t, dtMs) {
  var dt = dtMs / 1000, R = this.scr;
  this.box.update(dt);
  // scrolling ticker
  if (this.tickerTxt.visible && this._tickerText) {
    this.tickerTxt.x -= dt * 34;
    if (this.tickerTxt.x < R.x - this.tickerTxt.width) this.tickerTxt.x = R.x + R.w;
  }
  // the erupting Ray's glow (floodburst) keeps throbbing with the fountain
  if (this._floodPulse && this._rayAnchor) {
    var fp = this._floodPulse, an = this._rayAnchor;
    fp.clear();
    var k = 0.5 + 0.5 * Math.sin(t / 90);
    fp.fillStyle(0xf2c33c, 0.25 + 0.25 * k).fillCircle(an.x, an.y - 10, 10 + 8 * k);
    fp.fillStyle(0xfff6e0, 0.5 + 0.4 * k).fillCircle(an.x, an.y - 10, 4 + 3 * k);
  }
  // CRT static (also the danny_room idle fuzz)
  if (this._staticT > 0) {
    this._staticT -= dt;
    var g = this.staticG;
    g.clear();
    for (var i = 0; i < 90; i++) {
      var sx = R.x + Math.random() * R.w, sy2 = R.y + Math.random() * R.h;
      var shade = [0x6d6a8e, 0xcfd4e8, 0x241f3d, 0xf7f4ef][i % 4];
      g.fillStyle(shade, (0.25 + Math.random() * 0.5) * this._staticAlpha);
      g.fillRect(sx, sy2, 2 + Math.random() * 5, 1 + Math.random() * 2);
    }
    // rolling band
    var band = R.y + ((t / 12) % R.h);
    g.fillStyle(0xffffff, 0.06 * this._staticAlpha).fillRect(R.x, band, R.w, 6);
    if (this._staticT <= 0) g.clear();
  }
};
