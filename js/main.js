// main.js - boot, canvas setup, the scene manager and the fixed-timestep loop.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var canvas, ctx;
  var STEP = 1 / 60;
  var acc = 0, last = 0;

  // ---- scene manager ----
  SDD.setScene = function (name, data) {
    var s = SDD.scenes[name];
    if (!s) { console.error('Unknown scene: ' + name); return; }
    if (SDD.scene && SDD.scene.exit) SDD.scene.exit();
    SDD.scene = s;
    s._name = name;
    if (s.enter) s.enter(data || {});
  };

  // ---- responsive canvas scaling (keeps the 16:9 pixel buffer crisp) ----
  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var sc = Math.min(vw / 320, vh / 180);
    if (sc >= 1) sc = Math.floor(sc);
    else sc = Math.max(0.1, sc);
    canvas.style.width = (320 * sc) + 'px';
    canvas.style.height = (180 * sc) + 'px';
  }

  // ---- main loop ----
  function frame(now) {
    if (!last) last = now;
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    var guard = 0;
    while (acc >= STEP && guard < 5) {
      if (SDD.scene && SDD.scene.update) SDD.scene.update(STEP);
      SDD.input.endStep();
      acc -= STEP;
      guard++;
    }
    if (guard >= 5) acc = 0;
    if (SDD.scene && SDD.scene.render) SDD.scene.render(ctx);
    requestAnimationFrame(frame);
  }

  function boot() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    SDD.canvas = canvas;
    SDD.ctx = ctx;

    SDD.save.load();
    SDD.sprites.build();
    SDD.input.init();

    // Audio can only start after a user gesture (browser autoplay policy).
    SDD.input.onFirstGesture(function () {
      SDD.audio.init();
      SDD.audio.syncFromSave();
      SDD.audio.resume();
    });

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    SDD.setScene('logo');
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
