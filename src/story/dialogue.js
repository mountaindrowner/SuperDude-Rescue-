// dialogue.js - the portrait dialogue box. Rebuilt v0.25.0 against the
// text standard (systems/ui.js) after Mark's screenshot: the box was a
// FIXED 74px tall whatever went in it, the text column started 6px
// INSIDE the portrait well, body copy was 9px, the ▼ sat in the very
// corner on top of the version stamp, and the whole panel was 8px off
// the bottom of the screen - under the home indicator on a phone.
// Now: the box MEASURES its line and grows, the text column clears the
// portrait, body copy is the `body` role, and everything respects
// PC.SAFE_BOTTOM. Used by the cutscene runner and in-mission radio.
window.PC = window.PC || {};

// per-speaker voice pitch + display names + portrait frames
PC.SPEAKERS = {
  danny:  { name: 'DANNY',       portrait: 'portrait_danny',    pitch: 1.0 },
  vic:    { name: 'VIC',         portrait: 'portrait_victoria', pitch: 1.15 },
  josh:   { name: 'JOSH',        portrait: 'portrait_josh',     pitch: 0.85 },
  kevin:  { name: 'KEVIN',       portrait: 'portrait_kevin',    pitch: 0.8 },
  carlos: { name: 'CARLOS',      portrait: 'portrait_carlos',   pitch: 0.95 },
  nayah:  { name: 'NAYAH',       portrait: 'portrait_nayah',    pitch: 1.2 },
  bloom:  { name: 'MAYOR BLOOM', portrait: 'portrait_bloom',    pitch: 1.3 },
  sal:    { name: 'SAL',         portrait: 'portrait_sal',      pitch: 0.72 },
  pip:    { name: 'PIP',         portrait: 'portrait_pip',      pitch: 1.5 },
  chomp:  { name: 'CHOMP',       portrait: 'portrait_chomp',    pitch: 1.1, wave: 'square' },
  anchor: { name: 'ACN NEWS',    portrait: 'portrait_anchor',   pitch: 1.05 },
};

// ---- layout constants, all derived from the text standard ----
// scaled by PC.uiK so the box keeps its physical size across zoom
// changes (v0.27.2 BASE 312 -> 400), same as the type roles
var PAD = PC.uiK(9);      // inner padding of the box
var PORT = PC.uiK(52);    // portrait art size
var WELL = PORT + PC.uiK(10);   // portrait well (frame around it)
var GAP = PC.uiK(10);     // gap between the well and the text column
var MIN_LINES = 2;        // never shorter than this, so 1-liners don't jitter

PC.DialogueBox = function (scene) {
  var W = PC.RENDER.W;
  this.scene = scene;
  this.side = PC.SAFE;                         // left/right box margin
  this.textX = this.side + PAD + WELL + GAP;   // clears the portrait well
  this.wrapW = W - this.textX - this.side - PAD;

  this.gfx = scene.add.graphics().setDepth(300);
  this.portrait = scene.add.image(0, 0, 'atlas', 'portrait_danny')
    .setScale(PORT / 128).setDepth(301).setVisible(false);
  this.nameTxt = PC.ui.text(scene, this.textX, 0, '', 'caption',
    { color: '#f2c33c' }).setDepth(301);
  this.bodyTxt = PC.ui.text(scene, this.textX, 0, '', 'body',
    { color: '#f7f4ef', wrap: this.wrapW }).setDepth(301);
  this.moreTxt = PC.ui.text(scene, 0, 0, '▼', 'caption',
    { color: '#a8e04a' }).setOrigin(0.5).setDepth(301).setVisible(false);
  scene.tweens.add({ targets: this.moreTxt, alpha: 0.3, duration: 420,
    yoyo: true, repeat: -1 });

  this.h = 0; this._y = 0;
  this.active = false;
  this._full = ''; this._shown = 0; this._acc = 0; this._pitch = 1;
  this._blipEvery = 2; this._blipCount = 0;
  this.hide();
};

// R4: the panel is sized from the MEASURED text, then laid out bottom-up
PC.DialogueBox.prototype._layout = function (fullText) {
  var W = PC.RENDER.W, H = PC.RENDER.H;
  var m = PC.ui.measure(this.scene, fullText || 'M', 'body', this.wrapW);
  var lineH = PC.TYPE.body.size + PC.TYPE.body.line;
  var textH = Math.max(m.h, lineH * MIN_LINES);
  var nameH = PC.TYPE.caption.size + 4;
  // tall enough for the copy, and never shorter than the portrait well
  var contentH = nameH + textH;
  this.h = Math.max(WELL, contentH) + PAD * 2;
  // R5: sit above the bottom safe area, never under the home indicator
  this._y = H - this.h - PC.SAFE_BOTTOM;

  this.gfx.clear();
  PC.labPanel(this.gfx, this.side, this._y, W - this.side * 2, this.h,
    { rivets: true, base: 0x1c1733, edge: 0x6d6a8e });
  PC.labPanel(this.gfx, this.side + PAD, this._y + PAD, WELL, WELL,
    { base: 0x120e24, edge: 0x45356e, radius: 4 });

  this.portrait.setPosition(this.side + PAD + WELL / 2, this._y + PAD + WELL / 2);
  this.nameTxt.setPosition(this.textX, this._y + PAD);
  this.bodyTxt.setPosition(this.textX, this._y + PAD + nameH);
  // ▼ inside the box, clear of both edges
  this.moreTxt.setPosition(W - this.side - PAD - 4, this._y + this.h - PAD - 3);
};

PC.DialogueBox.prototype.show = function (beat, onDone) {
  var sp = PC.SPEAKERS[beat.speaker] ||
           { name: (beat.speaker || '???').toUpperCase(), portrait: null, pitch: 1 };
  this.active = true;
  this._onDone = onDone;
  this._full = beat.text;
  this._shown = 0; this._acc = 0; this._blipCount = 0;
  this._pitch = beat.pitch || sp.pitch || 1;
  this._wave = sp.wave || 'triangle';

  this._layout(this._full);
  this.gfx.setVisible(true);
  var frame = beat.portrait || sp.portrait;
  if (frame && this.scene.textures.get('atlas').has(frame)) {
    this.portrait.setFrame(frame).setVisible(true);
  } else {
    this.portrait.setVisible(false);
  }
  // R3: a speaker name is variable-length - shrink it rather than let it
  // run under the text column
  this.nameTxt.setText(sp.name).setFontSize(PC.TYPE.caption.size).setVisible(true);
  PC.ui.fit(this.nameTxt, this.wrapW, 7);
  this.bodyTxt.setText('').setVisible(true);
  this.moreTxt.setVisible(false);
};

PC.DialogueBox.prototype.hide = function () {
  this.active = false;
  this.gfx.clear().setVisible(false);
  this.portrait.setVisible(false);
  this.nameTxt.setVisible(false);
  this.bodyTxt.setVisible(false);
  this.moreTxt.setVisible(false);
};

// tap: reveal-all first, advance second
PC.DialogueBox.prototype.tap = function () {
  if (!this.active) return false;
  if (this._shown < this._full.length) {
    this._shown = this._full.length;
    this.bodyTxt.setText(this._full);
    this.moreTxt.setVisible(true);
    return true;
  }
  var cb = this._onDone;
  this.hide();
  if (cb) cb();
  return true;
};

PC.DialogueBox.prototype.update = function (dt) {
  if (!this.active || this._shown >= this._full.length) return;
  this._acc += dt * 40;                       // ~40 chars/s
  var want = Math.min(this._full.length, Math.floor(this._acc));
  if (want > this._shown) {
    // blip every few visible characters (skip spaces)
    for (var i = this._shown; i < want; i++) {
      var ch = this._full[i];
      if (ch !== ' ' && ++this._blipCount % 3 === 0 && PC.audio) {
        PC.audio.textBlip(this._pitch, this._wave);
      }
    }
    this._shown = want;
    this.bodyTxt.setText(this._full.slice(0, want));
    if (this._shown >= this._full.length) this.moreTxt.setVisible(true);
  }
};
