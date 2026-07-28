// cutscene.js - STORY-1: the beat-list runner (STORY_SPEC Part V).
// A cutscene = { script: [beat...], next, nextData }. Beat kinds:
//   { say: { speaker, text, portrait? } }        dialogue box beat
//   { scene: 'plaza_sunny'|'plaza_flooded'|'black' }  背景 painter
//   { action: 'flash'|'shake'|'smashcut'|'sodatip'|'floodburst'|
//             'portraits6'|'confetti'|'chant' , text? }
//   { music: 'hopeful'|'tense'|'lift'|'stop' }   (synth stubs for now)
//   { wait: ms }
// Tap advances say-beats (two-stage); [SKIP >] ends the whole scene.
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
  this.bg = this.add.graphics().setDepth(0);
  this.bgImgs = [];                       // atlas stamps for scenes
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
    // taps during waits/actions fast-forward to the next beat
    if (self._busy === 'wait') { self._busy = false; self._advance(); }
  });

  PC.stampVersion(this);
  this._advance();
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

// ---- scene backgrounds (code-painted; landmark art arrives STORY-2) ----
PC.CutsceneScene.prototype.paintScene = function (name) {
  var W = PC.RENDER.W, H = PC.RENDER.H, g = this.bg, self = this;
  g.clear();
  this.bgImgs.forEach(function (im) { im.destroy(); });
  this.bgImgs = [];
  if (name === 'black') { this.cameras.main.setBackgroundColor(0x000000); return; }
  var flooded = name === 'plaza_flooded';
  // sky
  var top = flooded ? 0x3a3050 : 0x35d0ff, bot = flooded ? 0x241f3d : 0xcfe9f2;
  g.fillStyle(top, 1).fillRect(0, 0, W, H * 0.35);
  g.fillStyle(bot, 1).fillRect(0, H * 0.35, W, H * 0.2);
  if (flooded) {
    // uneasy stars + a smog moon
    for (var st2 = 0; st2 < 22; st2++) {
      g.fillStyle(0xcfd4e8, 0.4 + PC.hash01(st2, 3, 9) * 0.4);
      g.fillRect(PC.hash01(st2, 1, 7) * W, PC.hash01(st2, 2, 8) * H * 0.3, 1, 1);
    }
    g.fillStyle(0xcfd4e8, 0.25).fillCircle(W * 0.82, H * 0.12, 14);
    g.fillStyle(0x3a3050, 1).fillCircle(W * 0.85, H * 0.11, 11);
  } else {
    // sun + drifting clouds
    g.fillStyle(0xfff6e0, 0.5).fillCircle(W * 0.8, H * 0.12, 22);
    g.fillStyle(0xf2c33c, 1).fillCircle(W * 0.8, H * 0.12, 15);
    g.fillStyle(0xffffff, 0.9);
    for (var cl = 0; cl < 4; cl++) {
      var cxx = PC.hash01(cl, 5, 11) * W, cyy = H * (0.06 + PC.hash01(cl, 6, 12) * 0.16);
      g.fillEllipse(cxx, cyy, 44, 12);
      g.fillEllipse(cxx + 16, cyy - 5, 28, 10);
    }
  }
  // skyline silhouettes
  g.fillStyle(flooded ? 0x1c1733 : 0x45356e, 1);
  var seed = 7;
  for (var x = 0; x < W; x += 34) {
    seed = (seed * 16807) % 2147483647;
    var bh = 40 + (seed % 70);
    g.fillRect(x, H * 0.55 - bh, 30, bh);
    // lit windows
    g.fillStyle(flooded ? 0x45356e : 0xf2c33c, flooded ? 0.5 : 0.8);
    for (var wy = H * 0.55 - bh + 6; wy < H * 0.53; wy += 10) {
      g.fillRect(x + 5, wy, 3, 3); g.fillRect(x + 15, wy, 3, 3);
    }
    g.fillStyle(flooded ? 0x1c1733 : 0x45356e, 1);
  }
  // plaza ground
  g.fillStyle(flooded ? 0x3a3652 : 0x6d6a8e, 1).fillRect(0, H * 0.55, W, H * 0.45);
  g.fillStyle(0x000000, 0.15);
  for (var sx = 0; sx < W; sx += 40) g.fillRect(sx, H * 0.55, 1, H * 0.45);
  // the Nourish-Ray demo stage (center)
  PC.labPanel(g, W / 2 - 60, H * 0.5, 120, 26, { rivets: true, base: 0x241f3d });
  g.fillStyle(0x35d0ff, flooded ? 0.25 : 0.9);
  g.fillCircle(W / 2, H * 0.47, 9);                      // the Ray emitter
  g.fillStyle(0xffffff, flooded ? 0.2 : 0.8).fillCircle(W / 2, H * 0.47, 4);
  if (flooded) {
    // food flood: mounds of real enemy stills piled along the ground
    var stills = ['still_d1_fry', 'still_d1_hotdog', 'still_d1_popcorn',
                  'still_d1_toast', 'still_d1_pretzel'];
    for (var f = 0; f < 26; f++) {
      var fx2 = PC.hash01(f, 13, 21) * W;
      var fy2 = H * 0.6 + PC.hash01(f, 14, 22) * H * 0.34;
      var im = this.add.image(fx2, fy2, 'atlas', stills[f % stills.length])
        .setDepth(1).setScale(0.9 + (f % 3) * 0.25).setAngle((f * 53) % 40 - 20);
      this.bgImgs.push(im);
    }
    g.fillStyle(0xff9d3b, 0.12).fillRect(0, H * 0.55, W, H * 0.45);   // grease haze
  } else {
    // crowd dots at the stage
    for (var c = 0; c < 18; c++) {
      var cx2 = W / 2 - 80 + (c * 29) % 160;
      var cy2 = H * 0.62 + (c * 17) % 40;
      g.fillStyle([0xcfd4e8, 0x7dd97b, 0xff9ecb, 0xf2c33c][c % 4], 1);
      g.fillCircle(cx2, cy2, 3);
      g.fillStyle(0xb5793f, 1).fillCircle(cx2, cy2 - 4, 2);
    }
  }
};

// ---- music cues (synth stubs; Suno loops slot in later) ----
PC.CutsceneScene.prototype.musicCue = function (tag) {
  if (!PC.audio) return;
  if (tag === 'stop') { PC.audio.stopMusic(); return; }
  PC.audio.musicCue ? PC.audio.musicCue(tag) : PC.audio.startMusic();
};

// ---- scripted actions ----
PC.CutsceneScene.prototype.runAction = function (beat, done) {
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  var a = beat.action;
  if (a === 'flash') {
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
    // the fateful cup: slides, tips, fizzes onto the console
    var cup = this.add.container(W / 2 + 40, H * 0.46).setDepth(60);
    var cg = this.add.graphics();
    cg.fillStyle(0xd93a3a, 1).fillRect(-4, -10, 8, 12);
    cg.fillStyle(0xf7f4ef, 1).fillRect(-4, -12, 8, 3);
    cg.fillStyle(0x6d6a8e, 1).fillRect(-1, -18, 1, 7);   // straw
    cup.add(cg);
    if (PC.audio) PC.audio.hiss();
    this.tweens.add({ targets: cup, angle: 100, x: W / 2 + 26, y: H * 0.485,
      duration: 700, ease: 'Quad.in',
      onComplete: function () {
        for (var i = 0; i < 8; i++) {
          var s = self.add.rectangle(W / 2 + 22 + Math.random() * 10,
            H * 0.49, 2, 2, 0xcfd4e8).setDepth(61);
          self.tweens.add({ targets: s, y: H * 0.52, alpha: 0,
            duration: 380 + Math.random() * 220, onComplete: (function (r2) {
              return function () { r2.destroy(); }; })(s) });
        }
        self.time.delayedCall(600, done);
      } });
  } else if (a === 'floodburst') {
    // the Ray erupts: flash + shake + junk food raining
    this.cameras.main.shake(600, 0.012);
    if (PC.audio) PC.audio.clank();
    var r2 = this.add.rectangle(W / 2, H / 2, W, H, 0xf2c33c).setDepth(389).setAlpha(0.8);
    this.tweens.add({ targets: r2, alpha: 0, duration: 700,
      onComplete: function () { r2.destroy(); } });
    var stills = ['still_d1_fry', 'still_d1_hotdog', 'still_d1_popcorn', 'still_d1_toast'];
    for (var i = 0; i < 22; i++) {
      (function (i2) {
        self.time.delayedCall(i2 * 45, function () {
          var im = self.add.image(W / 2, H * 0.45, 'atlas', stills[i2 % stills.length])
            .setDepth(70).setScale(0.8);
          self.tweens.add({ targets: im,
            x: W / 2 + (Math.random() - 0.5) * W * 1.1,
            y: -20 - Math.random() * 40, angle: Math.random() * 360,
            duration: 500, ease: 'Quad.out',
            onComplete: function () {
              self.tweens.add({ targets: im, y: H + 30, duration: 600,
                ease: 'Quad.in', onComplete: function () { im.destroy(); } });
            } });
        });
      })(i);
    }
    this.time.delayedCall(1700, done);
  } else if (a === 'portraits6') {
    // six portraits light up on Danny's wrist-pad call
    var heroes = ['victoria', 'josh', 'kevin', 'carlos', 'nayah', 'danny'];
    var pw = 40, gap = 8;
    var x0 = W / 2 - (heroes.length * (pw + gap) - gap) / 2 + pw / 2;
    var imgs = [];
    heroes.forEach(function (h, i) {
      self.time.delayedCall(i * 180, function () {
        var im = self.add.image(x0 + i * (pw + gap), H * 0.3, 'atlas', 'portrait_' + h)
          .setDepth(80).setScale(0.01);
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
  this.box.update(dtMs / 1000);
};
