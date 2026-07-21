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
  SDD.VERSION = 'v2.0.1';

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
    // v1.0.16: removed the container padding entirely - read the actual
    // safe-area-inset env() values via a hidden probe element and convert
    // them to GAME PIXELS so drawHUD + touch buttons can inset themselves
    // away from the notch / home indicator while the playfield extends
    // edge-to-edge. (Probe is created lazily once and reused.)
    if (!resize._probe) {
      var pr = document.createElement('div');
      pr.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;left:0;top:0;'
        + 'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
      document.body.appendChild(pr);
      resize._probe = pr;
    }
    var ps = getComputedStyle(resize._probe);
    var saiT = parseFloat(ps.paddingTop)    || 0;
    var saiR = parseFloat(ps.paddingRight)  || 0;
    var saiB = parseFloat(ps.paddingBottom) || 0;
    var saiL = parseFloat(ps.paddingLeft)   || 0;
    // Letterbox-to-fit: keep the 16:9 canvas fully inside the viewport.
    //
    // We tried a "fill width on touch landscape" mode (v0.46) but on
    // iPhone Safari the URL bar + bottom toolbar eat ~100 px of
    // vertical space, so filling width pushed the canvas TALLER than
    // the visible viewport and overflow:hidden clipped the HUD ribbon
    // + dialog box (Mark's screenshots, v0.50). Reverted: accept the
    // small black side bars in the browser; an installed PWA has no
    // chrome and gets a tighter fit naturally.
    // v1.0.17: canvas CSS size is now set by CSS (position: fixed; inset:0;
    // 100vw/100dvh) - on iOS WKWebView, window.innerWidth/Height return
    // the safe-area-CROPPED viewport even with viewport-fit=cover, but
    // 100vw/100dvh report the FULL viewport including the area under
    // the notch + home indicator. Read the actual rendered canvas rect
    // back to derive the dynamic VIEW_W.
    // v2.0 orientation unlock (iOS now allows portrait): reset to the
    // stylesheet's edge-to-edge sizing, measure the full viewport, then
    // decide the mode. Landscape keeps the v1.0.17 fill-viewport
    // behavior. Portrait CANNOT fill (a 16:9 world stretched into a
    // tall screen distorts ~2.6x), so letterbox instead: full width,
    // 16:9 height, anchored upper-middle — the open band below is
    // where the touch controls live (restores v0.92 portrait play).
    canvas.style.width = '';
    canvas.style.height = '';
    canvas.style.top = '';
    var full = canvas.getBoundingClientRect();
    var portraitMode = full.height > full.width * 1.05;
    if (portraitMode) {
      var lbH = Math.round(full.width * 180 / 320);
      canvas.style.height = lbH + 'px';
      canvas.style.top = Math.round(Math.max(0, (full.height - lbH) * 0.30)) + 'px';
    }
    resize._portrait = portraitMode;
    var actual = canvas.getBoundingClientRect();
    var dispW = actual.width || vw;
    var dispH = actual.height || vh;

    var WORLD_H = 180;
    var VIEW_W;
    if (SDD.C.WIDE_VIEW && dispW > 0 && dispH > 0) {
      VIEW_W = Math.round(WORLD_H * dispW / dispH);
      VIEW_W = Math.max(VIEW_W, 320);    // never narrower than the 16:9 original
      VIEW_W = Math.min(VIEW_W, 420);    // safety cap on ultra-wide
    } else {
      VIEW_W = 320;
    }
    SDD.C.VIEW_W = VIEW_W;

    var SCALE = RENDER_SCALE;
    var canvasInternalW = VIEW_W * SCALE;
    var canvasInternalH = WORLD_H * SCALE;
    if (canvas.width !== canvasInternalW || canvas.height !== canvasInternalH) {
      canvas.width  = canvasInternalW;
      canvas.height = canvasInternalH;
      ctx.imageSmoothingEnabled = false;       // gets reset by canvas resize
    }

    // Convert safe-area insets from CSS px to GAME px (the units drawHUD
    // and the level scene's HUD use) so HUD elements + touch buttons can
    // stay clear of the notch and home indicator even though the canvas
    // extends behind them.
    var cssToGameX = VIEW_W / (dispW || 1);
    var cssToGameY = WORLD_H / (dispH || 1);
    SDD.C.SAFE_LEFT   = Math.ceil(saiL * cssToGameX);
    SDD.C.SAFE_RIGHT  = Math.ceil(saiR * cssToGameX);
    SDD.C.SAFE_TOP    = Math.ceil(saiT * cssToGameY);
    SDD.C.SAFE_BOTTOM = Math.ceil(saiB * cssToGameY);

    // v1.0.10/12: anchor the touch buttons (pause + A/B) to the CANVAS
    // rect, not the viewport edges. Without this the buttons floated in
    // the dark letterbox gap (Mark: "buttons should be right at the end
    // of the game screen"). Everything below uses canvas.right /
    // canvas.bottom as the anchor.
    var c = canvas.getBoundingClientRect();
    var iw = window.innerWidth, ih = window.innerHeight;
    // v1.0.13: move the lab-tech bezels (body::before / body::after)
    // to FLANK the canvas instead of the viewport edges. The CSS uses
    // CSS custom properties with fallbacks, so this just overrides
    // those properties with positions tied to the live canvas rect.
    // Bezel width is fixed 38px in the CSS.
    var bodyStyle = document.body.style;
    bodyStyle.setProperty('--bezel-left-x',  Math.round(c.left - 38) + 'px');
    bodyStyle.setProperty('--bezel-right-x', Math.round(c.right)      + 'px');
    bodyStyle.setProperty('--bezel-top',     Math.round(c.top)        + 'px');
    bodyStyle.setProperty('--bezel-height',  Math.round(c.height)     + 'px');
    // v1.0.16: now that the canvas extends edge-to-edge, add the actual
    // safe-area inset on top of the small inboard offset so the buttons
    // stay clear of the notch / home indicator on real devices.
    var pb = document.querySelector('.tc-pause');
    if (pb) {
      pb.style.top   = Math.round(c.top + c.height * 0.16 + saiT) + 'px';
      pb.style.right = Math.round(iw - c.right + saiR + Math.max(4, c.width * 0.012)) + 'px';
    }
    var ap = document.getElementById('action-pad');
    if (ap) {
      if (resize._portrait) {
        // portrait: the canvas sits upper-middle, so anchor A/B to the
        // screen corner in the open band below — natural thumb position
        ap.style.right  = Math.round(saiR + 14) + 'px';
        ap.style.bottom = Math.round(saiB + 24) + 'px';
      } else {
        ap.style.right  = Math.round(iw - c.right + saiR + 8) + 'px';
        ap.style.bottom = Math.round(ih - c.bottom + saiB + 8) + 'px';
      }
    }
  }

  // ---- main loop ----
  // The whole body is wrapped so a single unexpected throw in any scene's
  // update()/render() can't escape and stop requestAnimationFrame - that
  // would freeze the game to a dead screen with no recovery (the "real
  // players break it in a way you never saw" failure). Instead we log it,
  // drop the bad frame, and keep looping. No data leaves the device. If a
  // scene errors every frame, `_loopErrs` throttles the console spam.
  var _loopErrs = 0;
  function frame(now) {
    try {
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
        // v1.0.15: clear the wider canvas first (dark slate). Scenes that
        // don't fill the full VIEW_W (menus, cinematics, lessons, etc.)
        // get an X-translate to keep their 320-wide content centered in
        // the wider canvas. The `level` scene opts in to wide rendering
        // via `wideView: true` and draws across the full VIEW_W.
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#05060d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var viewW = SDD.C.VIEW_W;
        var useWide = !!SDD.scene.wideView;
        var dx = useWide ? 0 : Math.round((viewW - 320) / 2);
        ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, dx * RENDER_SCALE, 0);
        SDD.scene.render(ctx);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    } catch (e) {
      acc = 0;                                   // don't spiral on a stuck step
      try { ctx.setTransform(1, 0, 0, 1, 0, 0); } catch (e2) {}   // reset canvas state
      if (_loopErrs++ < 20 && typeof console !== 'undefined' && console.error) {
        console.error('SDD loop error (frame skipped, game continues):', e);
      }
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
