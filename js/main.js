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

    // God-mode shortcuts: N to skip the current level, 1-7 to jump to a day.
    window.addEventListener('keydown', function (e) {
      if (!SDD.save.data.options.god) return;
      if (e.code === 'KeyN' && SDD.scene && SDD.scene._name === 'level' &&
          SDD.scene.completeLevel && SDD.scene.state === 'play') {
        e.preventDefault();
        SDD.scene.completeLevel();
        return;
      }
      var m = e.code.match(/^Digit([1-7])$/);
      if (m) {
        e.preventDefault();
        var day = parseInt(m[1], 10);
        if (SDD.levels[day + '-1']) {
          SDD.save.data.unlockedDay = Math.max(SDD.save.data.unlockedDay, day);
          SDD.setScene('level', { day: day, stage: 1 });
        }
      }
    });

    SDD.setScene('logo');
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
