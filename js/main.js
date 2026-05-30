// main.js - boot, canvas setup, the scene manager and the fixed-timestep loop.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  // ---- BUILD VERSION (DEV-KIT) -------------------------------------
  // Shown on the menu / front page so we can tell at a glance which
  // build is loaded. BUMP THIS on every ship, in lockstep with the
  // service-worker CACHE_NAME (vNN). One of the three dev-kit items to
  // strip before public release (god mode + level editor + this
  // version display) - see CLAUDE.md "Dev-kit removal list".
  SDD.VERSION = 'v0.53';

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
    // Letterbox-to-fit: keep the 16:9 canvas fully inside the viewport.
    //
    // We tried a "fill width on touch landscape" mode (v0.46) but on
    // iPhone Safari the URL bar + bottom toolbar eat ~100 px of
    // vertical space, so filling width pushed the canvas TALLER than
    // the visible viewport and overflow:hidden clipped the HUD ribbon
    // + dialog box (Mark's screenshots, v0.50). Reverted: accept the
    // small black side bars in the browser; an installed PWA has no
    // chrome and gets a tighter fit naturally.
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
    // Dev: replace any stage flagged "MAIN" in the editor's variant
    // library with that variant before any scene reads SDD.levels.
    // No-op if editor.js isn't loaded.
    if (SDD.editorLib && SDD.editorLib.applyMainVariants) {
      SDD.editorLib.applyMainVariants(SDD.levels);
    }

    // Audio can only start after a user gesture (browser autoplay policy).
    SDD.input.onFirstGesture(function () {
      SDD.audio.init();
      SDD.audio.syncFromSave();
      SDD.audio.resume();
    });

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    // (God-mode keyboard shortcuts removed in Pass 11. God mode is
    // still toggleable in the in-game OPTIONS menu; the dev shortcuts
    // were public-release noise that the editor now replaces.)

    SDD.setScene('logo');
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
