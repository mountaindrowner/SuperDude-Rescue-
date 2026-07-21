// fx.js - pooled one-shot effects (Perf Bible 1/8): the shared pop puff
// (tinted per enemy), the harmless-food still that lingers 0.4s, muzzle
// flashes. All from one pool of pooled images; zero allocation at runtime.
window.PC = window.PC || {};

PC.FxSystem = function (scene) {
  this.scene = scene;
  this.pool = [];
  for (var i = 0; i < PC.CAPS.FX; i++) {
    this.pool.push({
      active: false, t: 0, dur: 0, prefix: null, frames: 1, fade: false,
      sprite: scene.add.image(0, 0, 'atlas', 'fx_pop_1').setDepth(20).setVisible(false),
    });
  }
};

PC.FxSystem.prototype._get = function () {
  for (var i = 0; i < this.pool.length; i++) {
    if (!this.pool[i].active) return this.pool[i];
  }
  return null;   // FX cap hit: drop the effect, never allocate
};

// animated burst: frames named prefix_1..n over dur seconds
PC.FxSystem.prototype.burst = function (x, y, prefix, frames, dur, tint) {
  var f = this._get(); if (!f) return;
  f.active = true; f.t = 0; f.dur = dur; f.prefix = prefix; f.frames = frames; f.fade = false;
  var s = f.sprite;
  s.setPosition(x, y).setFrame(prefix + '_1').setAlpha(1).setVisible(true);
  if (tint) s.setTint(tint); else s.clearTint();
};

// static frame that fades out (the "pops back to normal food" still)
PC.FxSystem.prototype.still = function (x, y, frame, dur) {
  var f = this._get(); if (!f) return;
  f.active = true; f.t = 0; f.dur = dur; f.prefix = null; f.fade = true;
  f.sprite.setPosition(x, y).setFrame(frame).setAlpha(1).clearTint().setVisible(true);
};

PC.FxSystem.prototype.update = function (dt) {
  var pool = this.pool;
  for (var i = 0; i < pool.length; i++) {
    var f = pool[i];
    if (!f.active) continue;
    f.t += dt;
    if (f.t >= f.dur) { f.active = false; f.sprite.setVisible(false); continue; }
    if (f.prefix) {
      var idx = 1 + Math.min(f.frames - 1, Math.floor((f.t / f.dur) * f.frames));
      f.sprite.setFrame(f.prefix + '_' + idx);
    } else if (f.fade) {
      f.sprite.setAlpha(1 - f.t / f.dur);
    }
  }
};
