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
  SDD.VERSION = 'v1.0.12';

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
    // Expose the active scene name on <body> so CSS can show/hide
    // scene-specific touch UI (e.g. the pause button only matters in the
    // 'level' scene; elsewhere "back" is the B button, so the hamburger
    // would be a dead button in the corner).
    try { document.body.setAttribute('data-scene', name); } catch (e) {}
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
    // v1.0.8: subtract the #game-container safe-area padding (notch
    // insets + the 14px top/bottom HUD breathing room) so the canvas
    // actually fits INSIDE the padded area instead of overflowing past
    // it. Without this, the JS-set canvas size ignored the CSS padding
    // and the HUD ("LIVES") rendered at the rounded-corner edge.
    var gc = document.getElementById('game-container');
    if (gc) {
      var cs = getComputedStyle(gc);
      var padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      var padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      vw = Math.max(0, vw - padX);
      vh = Math.max(0, vh - padY);
    }
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

    // v1.0.10/12: anchor the touch buttons (pause + A/B) to the CANVAS
    // rect, not the viewport edges. Without this the buttons floated in
    // the dark letterbox gap (Mark: "buttons should be right at the end
    // of the game screen"). Everything below uses canvas.right /
    // canvas.bottom as the anchor.
    var c = canvas.getBoundingClientRect();
    var iw = window.innerWidth, ih = window.innerHeight;
    // Pause: small icon sitting just below the right-column HUD
    // (TIME at game y=4, power timer at game y=14 -> bottom of HUD
    // ~14% down the canvas), hugging the canvas right edge.
    var pb = document.querySelector('.tc-pause');
    if (pb) {
      pb.style.top   = Math.round(c.top + c.height * 0.16) + 'px';
      pb.style.right = Math.round(iw - c.right + Math.max(4, c.width * 0.012)) + 'px';
    }
    // A / B pad: anchor its right + bottom edges ~8px inside the
    // canvas bottom-right corner so A's right edge sits clearly inside
    // the gameplay rectangle.
    var ap = document.getElementById('action-pad');
    if (ap) {
      ap.style.right  = Math.round(iw - c.right + 8) + 'px';
      ap.style.bottom = Math.round(ih - c.bottom + 8) + 'px';
    }
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
