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

  // Internal render resolution. World coords are still 320x180 - we just
  // run every draw through ctx.scale(K, K) so the canvas backing-store
  // has 3x the pixels. Hand-drawn pixel art gets clean nearest-neighbour
  // upscaling; PixelLab PNGs get rendered with much more detail.
  var RENDER_SCALE = 3;
  SDD.RENDER_SCALE = RENDER_SCALE;

  // ---- responsive canvas scaling (keeps the 16:9 pixel buffer crisp) ----
  // Internal canvas is 960x540 (3x world). We fit it into the viewport at
  // any fractional scale - image-rendering: pixelated keeps nearest-
  // neighbour sampling, and the high internal res means small phones
  // still get more detail than the old 320x180 buffer ever could.
  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var sc = Math.min(vw / 960, vh / 540);
    if (sc <= 0) sc = 0.1;
    canvas.style.width = (960 * sc) + 'px';
    canvas.style.height = (540 * sc) + 'px';
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
    if (SDD.scene && SDD.scene.render) {
      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      SDD.scene.render(ctx);
      // god-mode toggle toast - drawn on top of everything
      if (SDD.godToast && SDD.godToast.t > 0) {
        var a = SDD.godToast.t > 60 ? 1 : SDD.godToast.t / 60;
        ctx.save();
        ctx.globalAlpha = 0.85 * a;
        ctx.fillStyle = '#000';
        ctx.fillRect(100, 70, 120, 22);
        ctx.globalAlpha = a;
        ctx.fillStyle = SDD.save.data.options.god ? '#ffd23a' : '#ff6f6f';
        ctx.fillRect(100, 70, 120, 2);
        ctx.fillRect(100, 90, 120, 2);
        if (SDD.sprites && SDD.sprites.textShadow) {
          SDD.sprites.textShadow(ctx, SDD.godToast.msg, 160, 78, '#ffffff', '#000', 1, 'center');
        } else if (SDD.sprites && SDD.sprites.text) {
          SDD.sprites.text(ctx, SDD.godToast.msg, 160, 78, '#ffffff', 1, 'center');
        }
        ctx.restore();
        SDD.godToast.t--;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
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

    // God mode hotkeys (work anywhere):
    //   G          - toggle god mode on/off
    //   N          - skip the current level (god + level scene only)
    //   1-7        - jump to a day            (god + any scene)
    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyG') {
        e.preventDefault();
        SDD.save.data.options.god = !SDD.save.data.options.god;
        SDD.save.save();
        SDD.godToast = { msg: 'GOD MODE: ' + (SDD.save.data.options.god ? 'ON' : 'OFF'), t: 90 };
        return;
      }
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
