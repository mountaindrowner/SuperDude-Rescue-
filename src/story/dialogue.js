// dialogue.js - STORY-1 (docs/STORY_BUILD_PLAN.md): the portrait
// dialogue box. Bottom lab-panel, portrait left, speaker tag,
// typewriter reveal ~40 chars/s with a per-speaker-pitch text blip.
// Tap once = reveal all; tap again = advance. Used by the cutscene
// runner and (later) in-mission radio beats.
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
};

PC.DialogueBox = function (scene) {
  var W = PC.RENDER.W, H = PC.RENDER.H;
  this.scene = scene;
  this.h = 74;
  var y = H - this.h - 8;
  this.gfx = scene.add.graphics().setDepth(300);
  this.portrait = scene.add.image(8 + 27, y + this.h / 2, 'atlas', 'portrait_danny')
    .setScale(54 / 128).setDepth(301).setVisible(false);
  this.nameTxt = scene.add.text(8 + 58, y + 7, '', {
    fontFamily: 'monospace', fontSize: '9px', color: '#f2c33c', fontStyle: 'bold',
  }).setDepth(301);
  this.bodyTxt = scene.add.text(8 + 58, y + 20, '', {
    fontFamily: 'monospace', fontSize: '9px', color: '#f7f4ef', lineSpacing: 3,
    wordWrap: { width: W - 58 - 22 },
  }).setDepth(301);
  this.moreTxt = scene.add.text(W - 14, y + this.h - 10, '▼', {
    fontFamily: 'monospace', fontSize: '9px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(301).setVisible(false);
  scene.tweens.add({ targets: this.moreTxt, alpha: 0.3, duration: 420,
    yoyo: true, repeat: -1 });
  this._y = y;
  this.active = false;
  this._full = ''; this._shown = 0; this._acc = 0; this._pitch = 1;
  this._blipEvery = 2; this._blipCount = 0;
  this.hide();
};

PC.DialogueBox.prototype._drawPanel = function () {
  var W = PC.RENDER.W;
  this.gfx.clear();
  PC.labPanel(this.gfx, 6, this._y, W - 12, this.h,
    { rivets: true, base: 0x1c1733, edge: 0x6d6a8e });
  // portrait frame well
  PC.labPanel(this.gfx, 10, this._y + 6, 62, 62,
    { base: 0x120e24, edge: 0x45356e, radius: 4 });
};

PC.DialogueBox.prototype.show = function (beat, onDone) {
  var sp = PC.SPEAKERS[beat.speaker] || { name: (beat.speaker || '???').toUpperCase(), portrait: null, pitch: 1 };
  this.active = true;
  this._onDone = onDone;
  this._full = beat.text;
  this._shown = 0; this._acc = 0; this._blipCount = 0;
  this._pitch = beat.pitch || sp.pitch || 1;
  this._wave = sp.wave || 'triangle';
  this._drawPanel();
  this.gfx.setVisible(true);
  var frame = beat.portrait || sp.portrait;
  if (frame && this.scene.textures.get('atlas').has(frame)) {
    this.portrait.setFrame(frame).setVisible(true);
  } else {
    this.portrait.setVisible(false);
  }
  this.nameTxt.setText(sp.name).setVisible(true);
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
