// input.js - unified keyboard + touch + gamepad input.
//
// Each input source (kb / touch / gamepad) maintains its own per-action
// down map; the public `down[act]` is the OR across sources, and `latch`
// fires on the rising edge of that merged state. This way a keyboard
// release doesn't clobber a gamepad hold (or vice versa), and a chord
// across two sources (e.g. holding Right on the dpad while pressing
// Jump on the keyboard) still works.
//
// Gamepad polling runs once per fixed-step, tucked into endStep() so it
// doesn't require changes to the game loop. There's a 1-frame (~16 ms)
// latency on gamepad input as a result - imperceptible in practice.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  var ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'blast', 'pause', 'confirm'];
  var down = {};       // merged - what consumers read
  var latch = {};      // rising-edge of merged - what pressed() returns
  var kbDown = {};     // keyboard source
  var touchDown = {};  // touch + mouse source
  var gpDown = {};     // gamepad source
  ACTIONS.forEach(function (a) {
    down[a] = false; latch[a] = false;
    kbDown[a] = false; touchDown[a] = false; gpDown[a] = false;
  });

  function recompute(act) {
    var merged = kbDown[act] || touchDown[act] || gpDown[act];
    if (merged && !down[act]) latch[act] = true;
    down[act] = merged;
  }
  function setKb(act, isDown)    { kbDown[act] = isDown; recompute(act); }
  function setTouch(act, isDown) { touchDown[act] = isDown; recompute(act); }

  // event.code -> action
  var KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'jump', KeyZ: 'jump', KeyK: 'jump',
    KeyX: 'blast', KeyJ: 'blast', KeyL: 'blast', KeyF: 'blast',
    Enter: 'confirm',
    Escape: 'pause', KeyP: 'pause'
  };

  var firstGesture = [];
  function fireFirstGesture() {
    while (firstGesture.length) { try { firstGesture.shift()(); } catch (e) {} }
  }

  function onKey(isDown) {
    return function (e) {
      var act = KEYMAP[e.code];
      if (!act) return;
      e.preventDefault();
      if (isDown) fireFirstGesture();
      setKb(act, isDown);
    };
  }

  function bindButton(btn) {
    var act = btn.getAttribute('data-action');
    var press = function (e) {
      e.preventDefault();
      fireFirstGesture();
      setTouch(act, true);
      btn.classList.add('pressed');
    };
    var release = function (e) {
      if (e) e.preventDefault();
      setTouch(act, false);
      btn.classList.remove('pressed');
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  // ---- Gamepad API polling ------------------------------------------
  //
  // Standard mapping (https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/mapping):
  //   axes[0/1] = left stick X/Y
  //   buttons[0] = A (bottom face)   - JUMP + CONFIRM
  //   buttons[1] = B (right face)    - BLAST
  //   buttons[2] = X (left face)     - BLAST (alt - so kids can use either thumb)
  //   buttons[3] = Y (top face)      - CONFIRM (alt)
  //   buttons[8] = Back / Select     - PAUSE
  //   buttons[9] = Start             - PAUSE
  //   buttons[12-15] = D-pad U/D/L/R
  var GP_DEADZONE = 0.40;
  var prevGpHadInput = false;     // for first-gesture firing on first gamepad press

  function pollGamepad() {
    if (!navigator.getGamepads) return;
    var pads;
    try { pads = navigator.getGamepads(); }
    catch (e) { return; }
    if (!pads || pads.length === 0) return;

    // Combine input across every connected pad (any pad can play).
    var st = {};
    ACTIONS.forEach(function (a) { st[a] = false; });

    var anyDown = false;
    for (var gi = 0; gi < pads.length; gi++) {
      var pad = pads[gi];
      if (!pad) continue;
      var btn = pad.buttons || [];
      var ax  = pad.axes    || [];
      function pressed(i) { return btn[i] && btn[i].pressed; }

      // Face buttons
      if (pressed(0)) { st.jump = true; st.confirm = true; anyDown = true; }
      if (pressed(1)) { st.blast = true;                   anyDown = true; }
      if (pressed(2)) { st.blast = true;                   anyDown = true; }
      if (pressed(3)) { st.confirm = true;                 anyDown = true; }
      // Pause (Start + Back/Select)
      if (pressed(8) || pressed(9)) { st.pause = true;     anyDown = true; }
      // D-pad
      if (pressed(12)) { st.up    = true; anyDown = true; }
      if (pressed(13)) { st.down  = true; anyDown = true; }
      if (pressed(14)) { st.left  = true; anyDown = true; }
      if (pressed(15)) { st.right = true; anyDown = true; }
      // Left stick (with deadzone)
      var lx = ax[0] || 0, ly = ax[1] || 0;
      if (lx < -GP_DEADZONE) { st.left  = true; anyDown = true; }
      if (lx >  GP_DEADZONE) { st.right = true; anyDown = true; }
      if (ly < -GP_DEADZONE) { st.up    = true; anyDown = true; }
      if (ly >  GP_DEADZONE) { st.down  = true; anyDown = true; }
    }

    // First gamepad input should also kick the WebAudio context awake -
    // browsers gate AudioContext.resume() behind a user gesture, and
    // gamepad activity counts on most browsers.
    if (anyDown && !prevGpHadInput) fireFirstGesture();
    prevGpHadInput = anyDown;

    // Push diffs into gpDown[] so the merged state recomputes correctly.
    ACTIONS.forEach(function (act) {
      if (st[act] !== gpDown[act]) {
        gpDown[act] = st[act];
        recompute(act);
      }
    });
  }

  // Log connect/disconnect for debugging - silent on production browsers
  // but useful when a controller doesn't show up.
  function onGpConnect(e)    { if (typeof console !== 'undefined') console.log('gamepad connected:',    e.gamepad && e.gamepad.id); }
  function onGpDisconnect(e) { if (typeof console !== 'undefined') console.log('gamepad disconnected:', e.gamepad && e.gamepad.id); }

  // ---- Virtual joystick (v0.63) -------------------------------------
  //
  // Replaces the fixed 4-button DPad. The #vstick-zone div covers the
  // left half of the viewport - touch down anywhere inside it and the
  // joystick base + knob render at the touch point. Drag the knob in
  // any direction; deflection past the deadzone fires left/right/up/
  // down actions. Release returns to neutral.
  //
  // Implementation notes:
  //   - Tracks ONE active pointer (multi-touch is reserved for the A/B
  //     buttons on the right side).
  //   - Pointer is captured on the zone element so movement OUTSIDE
  //     the zone still drives the joystick (kid drags too far).
  //   - Base radius is in vmin so the deadzone scales with screen size.
  function bindVStick() {
    var zone = document.getElementById('vstick-zone');
    var vs   = document.getElementById('vstick');
    var base = document.getElementById('vstick-base');
    var knob = document.getElementById('vstick-knob');
    if (!zone || !vs || !base || !knob) return;
    var activePtr = null;
    var baseX = 0, baseY = 0;
    var BASE_R_VMIN  = 15;       // base half-size (matches #vstick-base 30vmin)
    var DEADZONE     = 0.30;     // 30% deflection = direction action fires
    var lastL = false, lastR = false, lastU = false, lastD = false;

    function vminPx() {
      return Math.min(window.innerWidth, window.innerHeight) / 100;
    }
    function setVsXY(x, y, kx, ky) {
      vs.style.left = '0';
      vs.style.top  = '0';
      base.style.left = x + 'px';
      base.style.top  = y + 'px';
      knob.style.left = kx + 'px';
      knob.style.top  = ky + 'px';
    }
    function clearDirs() {
      if (lastL) { setTouch('left',  false); lastL = false; }
      if (lastR) { setTouch('right', false); lastR = false; }
      if (lastU) { setTouch('up',    false); lastU = false; }
      if (lastD) { setTouch('down',  false); lastD = false; }
    }
    function applyDelta(dx, dy) {
      var r = BASE_R_VMIN * vminPx();
      // Normalised deflection (clamped to circle).
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) { dx = dx * r / dist; dy = dy * r / dist; }
      var nx = dx / r, ny = dy / r;
      // Update knob visual position.
      knob.style.left = (baseX + dx) + 'px';
      knob.style.top  = (baseY + dy) + 'px';
      // Map to discrete direction actions with hysteresis (deadzone).
      var L = nx < -DEADZONE;
      var R = nx >  DEADZONE;
      var U = ny < -DEADZONE;
      var D = ny >  DEADZONE;
      if (L !== lastL) { setTouch('left',  L); lastL = L; }
      if (R !== lastR) { setTouch('right', R); lastR = R; }
      if (U !== lastU) { setTouch('up',    U); lastU = U; }
      if (D !== lastD) { setTouch('down',  D); lastD = D; }
    }

    function start(e) {
      if (activePtr !== null) return;     // already tracking a touch
      e.preventDefault();
      fireFirstGesture();
      activePtr = e.pointerId;
      baseX = e.clientX;
      baseY = e.clientY;
      setVsXY(baseX, baseY, baseX, baseY);
      vs.classList.remove('vstick-hidden');
      try { zone.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function move(e) {
      if (e.pointerId !== activePtr) return;
      var dx = e.clientX - baseX;
      var dy = e.clientY - baseY;
      applyDelta(dx, dy);
    }
    function end(e) {
      if (e.pointerId !== activePtr) return;
      activePtr = null;
      vs.classList.add('vstick-hidden');
      clearDirs();
      try { zone.releasePointerCapture(e.pointerId); } catch (err) {}
    }

    zone.addEventListener('pointerdown',   start);
    zone.addEventListener('pointermove',   move);
    zone.addEventListener('pointerup',     end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('pointerleave',  end);
    zone.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function init() {
    window.addEventListener('keydown', onKey(true));
    window.addEventListener('keyup', onKey(false));

    var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (touch) document.body.classList.add('touch');

    var btns = document.querySelectorAll('.tc-btn');
    for (var i = 0; i < btns.length; i++) bindButton(btns[i]);
    bindVStick();

    // Mouse left-click anywhere on the canvas = blast.
    var cv = document.getElementById('game') || document.querySelector('canvas');
    if (cv) {
      cv.addEventListener('mousedown', function (e) {
        if (e.button === 0) { e.preventDefault(); fireFirstGesture(); setTouch('blast', true); }
      });
      cv.addEventListener('mouseup', function (e) {
        if (e.button === 0) { setTouch('blast', false); }
      });
      cv.addEventListener('mouseleave', function () { setTouch('blast', false); });
      cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }

    window.addEventListener('pointerdown', fireFirstGesture);
    // On blur, drop every input across all sources so a held key/button
    // doesn't get stuck when the window loses focus.
    window.addEventListener('blur', function () {
      ACTIONS.forEach(function (a) {
        kbDown[a] = false; touchDown[a] = false; gpDown[a] = false;
        down[a] = false;
      });
    });

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('gamepadconnected',    onGpConnect);
      window.addEventListener('gamepaddisconnected', onGpDisconnect);
    }
  }

  function pressed(a) { return !!latch[a]; }
  function held(a) { return !!down[a]; }
  function endStep() {
    for (var i = 0; i < ACTIONS.length; i++) latch[ACTIONS[i]] = false;
    // Poll the gamepad AFTER clearing latches so a rising-edge press
    // shows up as a fresh latch for the next update step. Latency = 1
    // step (~16 ms).
    pollGamepad();
  }
  function confirm() { return pressed('jump') || pressed('confirm'); }
  // "Back / cancel" in menus = Escape/P OR the B (blast) button. In
  // gameplay scenes blast still means fire; those scenes simply don't
  // call back(). Mark: "B button should go back in menus, anywhere
  // except gameplay."
  function back() { return pressed('pause') || pressed('blast'); }

  SDD.input = {
    init: init,
    pressed: pressed,
    held: held,
    confirm: confirm,
    back: back,
    endStep: endStep,
    onFirstGesture: function (cb) { firstGesture.push(cb); }
  };
})();
