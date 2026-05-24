// input.js - unified keyboard + on-screen touch input.
// Presses are "latched": a tap is never missed even if the key is released
// before the next frame, and is cleared once a frame has consumed it.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  var ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'blast', 'pause', 'confirm'];
  var down = {};    // currently held
  var latch = {};   // pressed since the last frame step
  ACTIONS.forEach(function (a) { down[a] = false; latch[a] = false; });

  // event.code -> action
  var KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    Space: 'jump', KeyZ: 'jump', KeyK: 'jump',
    KeyX: 'blast', KeyJ: 'blast', KeyL: 'blast',
    Enter: 'confirm',
    Escape: 'pause', KeyP: 'pause'
  };

  var firstGesture = [];
  function fireFirstGesture() {
    while (firstGesture.length) { try { firstGesture.shift()(); } catch (e) {} }
  }

  function setDown(act, isDown) {
    if (isDown) {
      if (!down[act]) latch[act] = true;   // latch only the initial press, not key-repeat
      down[act] = true;
    } else {
      down[act] = false;
    }
  }

  function onKey(isDown) {
    return function (e) {
      var act = KEYMAP[e.code];
      if (!act) return;
      e.preventDefault();
      if (isDown) fireFirstGesture();
      setDown(act, isDown);
    };
  }

  function bindButton(btn) {
    var act = btn.getAttribute('data-action');
    var press = function (e) {
      e.preventDefault();
      fireFirstGesture();
      setDown(act, true);
      btn.classList.add('pressed');
    };
    var release = function (e) {
      if (e) e.preventDefault();
      setDown(act, false);
      btn.classList.remove('pressed');
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function init() {
    window.addEventListener('keydown', onKey(true));
    window.addEventListener('keyup', onKey(false));

    var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (touch) document.body.classList.add('touch');

    var btns = document.querySelectorAll('.tc-btn');
    for (var i = 0; i < btns.length; i++) bindButton(btns[i]);

    // Mouse left-click anywhere on the canvas = blast (per Mark's
    // "I need to code the keyboard button better for blasting, for
    // like mouse 1 or something"). Right-click context menu is
    // suppressed in case it's bound to something else later.
    var cv = document.getElementById('game') || document.querySelector('canvas');
    if (cv) {
      cv.addEventListener('mousedown', function (e) {
        if (e.button === 0) { e.preventDefault(); fireFirstGesture(); setDown('blast', true); }
      });
      cv.addEventListener('mouseup', function (e) {
        if (e.button === 0) { setDown('blast', false); }
      });
      cv.addEventListener('mouseleave', function () { setDown('blast', false); });
      cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }

    window.addEventListener('pointerdown', fireFirstGesture);
    window.addEventListener('blur', function () {
      ACTIONS.forEach(function (a) { down[a] = false; });
    });
  }

  function pressed(a) { return !!latch[a]; }
  function held(a) { return !!down[a]; }
  function endStep() { for (var i = 0; i < ACTIONS.length; i++) latch[ACTIONS[i]] = false; }
  function confirm() { return pressed('jump') || pressed('confirm'); }

  SDD.input = {
    init: init,
    pressed: pressed,
    held: held,
    confirm: confirm,
    endStep: endStep,
    onFirstGesture: function (cb) { firstGesture.push(cb); }
  };
})();
