// scenes.js - every screen of the game: logo card, intro, menu, options,
// how-to-play, overworld map, the Day 1 level, pause, results, game over.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var C = SDD.C;
  var S = SDD.sprites;
  var A = SDD.audio;
  var In = SDD.input;
  var E = SDD.engine;

  SDD.scenes = {};
  function go(name, data) { SDD.setScene(name, data); }
  function text(g, s, x, y, col, sc, al) { S.text(g, s, x, y, col, sc, al); }
  function tsh(g, s, x, y, col, sh, sc, al) { S.textShadow(g, s, x, y, col, sh, sc, al); }

  // ---- shared decoration ----
  var STARS = [];
  for (var i = 0; i < 70; i++) {
    STARS.push({ x: Math.random() * 320, y: Math.random() * 130, s: Math.random() < 0.25 ? 2 : 1 });
  }

  // Optional swap-in artwork. Each loader sets <name>Ok=true once the
  // PNG decodes; renderers fall back to procedural art when false so
  // the game keeps working if a file is missing.
  function loadArt(path) {
    var img = new Image(); var state = { img: img, ok: false };
    img.onload  = function () { state.ok = (img.width > 0); };
    img.onerror = function () { state.ok = false; };
    img.src = path;
    return state;
  }
  var ART_TITLE          = loadArt('assets/title.png');
  var ART_LAB            = loadArt('assets/lab.png');
  var ART_MACHINE        = loadArt('assets/timemachine.png');
  var ART_MACHINE_BROKEN = loadArt('assets/timemachine_broken.png');
  function lc(a, b, t) {
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' +
      Math.round(a[1] + (b[1] - a[1]) * t) + ',' +
      Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }
  function drawStarfield(g, t) {
    for (var i = 0; i < STARS.length; i++) {
      var s = STARS[i];
      var tw = 0.5 + 0.5 * Math.sin(t * 0.04 + i);
      g.fillStyle = 'rgba(255,255,255,' + (0.35 + tw * 0.5) + ')';
      g.fillRect(s.x | 0, s.y | 0, s.s, s.s);
    }
  }
  // jagged electric arcs radiating from a point - used for time-machine charging
  function electricArcs(g, cx, cy, t, count, len) {
    count = count || 4; len = len || 34;
    g.save();
    g.strokeStyle = '#bff0ff'; g.lineWidth = 1;
    for (var i = 0; i < count; i++) {
      var angle = (t * 0.18 + i * (6.283 / count)) % 6.283;
      g.beginPath();
      var x1 = cx, y1 = cy;
      g.moveTo(x1, y1);
      for (var j = 1; j <= 5; j++) {
        var f = j / 5;
        x1 = cx + Math.cos(angle) * len * f + (Math.random() - 0.5) * 6;
        y1 = cy + Math.sin(angle) * len * f + (Math.random() - 0.5) * 6;
        g.lineTo(x1, y1);
      }
      g.stroke();
    }
    g.restore();
  }

  function drawAtom(g, cx, cy, r, t) {
    g.save();
    g.translate(cx, cy);
    g.strokeStyle = '#bfe9ff'; g.lineWidth = 1.5;
    for (var k = 0; k < 3; k++) {
      g.save();
      g.rotate(t * 0.03 + k * Math.PI / 3);
      g.beginPath(); g.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    g.fillStyle = '#ffd23a';
    g.beginPath(); g.arc(0, 0, 3, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  // Soft, breathing dome-glow with radiating light rays. Replaces the
  // stark flat-alpha arc Mark called out in the intro/finale cinematics
  // ("shouldn't be such a stark circle, maybe instead a glowing or
  // rays"). Layers: a wide diffuse halo + a brighter near core + eight
  // tapered ray beams that gently sway over t so the corona reads as
  // alive. `radius` is the visual core size; the halo extends about 2.4x
  // beyond it. `strength` scales every alpha (1.0 normal, ~1.4 for the
  // charging-up beats).
  function domeGlow(g, cx, cy, radius, t, strength) {
    strength = (strength != null) ? strength : 1;
    t = t || 0;
    var pulse = 0.92 + 0.08 * Math.sin(t * 0.07);
    g.save();

    var farR = radius * 2.4;
    var far = g.createRadialGradient(cx, cy, 0, cx, cy, farR);
    far.addColorStop(0,   'rgba(255,232,147,' + (0.22 * strength * pulse).toFixed(3) + ')');
    far.addColorStop(0.5, 'rgba(255,232,147,' + (0.09 * strength * pulse).toFixed(3) + ')');
    far.addColorStop(1,   'rgba(255,232,147,0)');
    g.fillStyle = far;
    g.fillRect(cx - farR, cy - farR, farR * 2, farR * 2);

    var near = g.createRadialGradient(cx, cy, 0, cx, cy, radius);
    near.addColorStop(0,   'rgba(255,244,200,' + (0.62 * strength * pulse).toFixed(3) + ')');
    near.addColorStop(0.5, 'rgba(255,232,147,' + (0.32 * strength * pulse).toFixed(3) + ')');
    near.addColorStop(1,   'rgba(255,210,80,0)');
    g.fillStyle = near;
    g.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    var rayCount = 8;
    var rayLen = radius * 2.2;
    var rayBase = 5;
    g.globalAlpha = 0.42 * strength * pulse;
    g.fillStyle = '#ffe893';
    for (var i = 0; i < rayCount; i++) {
      var a = (i / rayCount) * Math.PI * 2 + t * 0.005;
      var rl = rayLen * (0.82 + 0.18 * Math.sin(t * 0.04 + i * 1.7));
      var c = Math.cos(a), s = Math.sin(a);
      var px = -s * rayBase, py = c * rayBase;
      g.beginPath();
      g.moveTo(cx + px, cy + py);
      g.lineTo(cx - px, cy - py);
      g.lineTo(cx + c * rl, cy + s * rl);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  // simple vertical-list menu helper
  function listNav(state, count) {
    if (In.pressed('up')) { state.idx = (state.idx - 1 + count) % count; A.sfx('select'); }
    if (In.pressed('down')) { state.idx = (state.idx + 1) % count; A.sfx('select'); }
  }

  // In-place array compaction. Walks the array once with a write-pointer
  // and only shifts elements that pass the predicate. Avoids the
  // allocation + closure cost of Array.prototype.filter inside the
  // 60 fps stepWorld cull. Shared predicates below are reused so we
  // don't allocate them either.
  function compactInPlace(arr, keep) {
    var w = 0;
    for (var i = 0; i < arr.length; i++) {
      if (keep(arr[i])) {
        if (w !== i) arr[w] = arr[i];
        w++;
      }
    }
    if (w !== arr.length) arr.length = w;
  }
  function keepNotRemoved(e) { return !e.remove; }
  function keepAlive(e) { return e.life > 0; }

  // =====================================================================
  // LOGO - Church of the Crossroads intro card (fade in, chirp, fade out)
  // =====================================================================
  // 5-second painted-title card (assets/title.png). 60 frames fade-in
  // -> 180 frames hold -> 60 frames fade-out, skippable with A. If the
  // painted PNG isn't loaded yet we skip straight to the menu instead
  // of showing the old placeholder card - Mark wanted that placeholder
  // gone.
  SDD.scenes.logo = {
    enter: function () {
      this.t = 0; this.phase = 'in'; this.alpha = 0; this.chirped = false;
      this.waited = 0;
      this.pressT = 0;                            // pulses the "PRESS A" hint
      // Music is NOT started here; it starts on the first user gesture
      // (Mark Pass 9: "The title card should stay up until you press a
      // button, and then the music starts.") We hook it onto
      // onFirstGesture so the play() call runs INSIDE the gesture's
      // event-handler tick - this saves ~16ms vs waiting for the next
      // animation frame and keeps us firmly inside the autoplay
      // gesture window, which avoids the "music starts really late"
      // delay Mark reported. The audio.init callback was registered
      // first in main.js, so ctx is ready by the time startMusic runs.
      In.onFirstGesture(function () { A.startMusic('title'); });
    },
    update: function () {
      // If the title PNG isn't loaded yet, give it ~0.5 sec and then
      // skip straight to the menu (the painted card is mandatory; no
      // placeholder card to show).
      if (!ART_TITLE.ok) {
        this.waited++;
        if (this.waited > 30) {
          A.startMusic('title');
          go('menu');
          return;
        }
        return;
      }
      this.t++;
      this.pressT++;
      if (!this.chirped && this.t > 6) { A.sfx('chirp'); this.chirped = true; }
      if (this.phase === 'in') {
        this.alpha += 1 / 60;                     // 1 sec to full alpha
        if (this.alpha >= 1) { this.alpha = 1; this.phase = 'hold'; this.t = 0; }
      } else if (this.phase === 'hold') {
        // Auto-advance after ~4 sec so a kid who doesn't know to tap
        // still gets to the menu without sitting on the logo (Mark:
        // "music should play automatically, no button touch"). The
        // first tap on the menu still does the browser audio-unlock
        // for us; this just removes the extra "tap to dismiss the
        // logo" step in the middle.
        if (this.t > 240) this.phase = 'out';
      } else {
        this.alpha -= 1 / 60;                     // 1 sec fade-out
        if (this.alpha <= 0) { this.alpha = 0; go('menu'); return; }
      }
      // Any "go" press (jump/confirm/blast/pause) starts the music
      // Music already started via the onFirstGesture hook in enter().
      // This block just begins the fade-out on any press (the
      // startMusic call here is harmless thanks to the in-flight guard).
      var advance = In.pressed('jump') || In.pressed('confirm') ||
                    In.pressed('blast') || In.pressed('pause');
      if (advance && this.phase !== 'out') {
        A.startMusic('title');
        this.phase = 'out';
      }
    },
    render: function (g) {
      g.fillStyle = '#05050d'; g.fillRect(0, 0, 320, 180);
      if (!ART_TITLE.ok) return;
      g.save();
      g.globalAlpha = this.alpha;
      g.imageSmoothingEnabled = false;
      g.drawImage(ART_TITLE.img, 0, 0, 320, 180);
      g.restore();
      g.globalAlpha = 1;
      // Pulsing "PRESS ANY KEY" hint, only after the fade-in is done
      // and before the user starts the fade-out.
      if (this.phase === 'hold' && this.pressT % 50 < 32) {
        tsh(g, 'PRESS ANY KEY', 160, 162, '#ffffff', '#000000', 1, 'center');
      }
    }
  };

  // =====================================================================
  // INTRO - short animated cinematic
  // =====================================================================
  var INTRO_BEATS = [
    { lines: ['SUPER DUDE DANNY BUILT', 'A TIME MACHINE...'] },
    { lines: ['...TO TRAVEL BACK AND WITNESS', "GOD'S SEVEN DAYS OF CREATION."] },
    { lines: ['BUT THE JUMP WENT WRONG', 'AND THE MACHINE BROKE APART!'] },
    { lines: ['STRANDED IN TIME, SUPER DUDE DANNY',
              'MUST FIND CORES AND MACHINE PARTS',
              'TO REBUILD IT AND GET HOME!'] }
  ];
  // Helper for drawing Danny at an arbitrary scale (he's fixed-size in
  // the sprite renderer; the canvas transform handles scaling without
  // smoothing so the pixel-art look survives).
  // (fx, fy) = the position of his FEET centre on screen.
  function drawDannyScaled(g, sz, anim, dir, frame, fx, fy, scale) {
    var w = sz === 'big' ? 28 : 22;
    var h = sz === 'big' ? 38 : 24;
    g.save();
    g.imageSmoothingEnabled = false;
    g.translate(fx - (w * scale) / 2, fy - h * scale);
    g.scale(scale, scale);
    S.drawDanny(g, sz, anim, dir, frame, 0, 0);
    g.restore();
  }
  SDD.scenes.intro = {
    enter: function () { this.beat = 0; this.t = 0; A.startMusic('intro'); },
    update: function () {
      this.t++;
      if (In.confirm() || this.t > 320) {
        this.beat++; this.t = 0;
        A.sfx('select');
        if (this.beat >= INTRO_BEATS.length) { go('overworld'); }
      }
    },
    render: function (g) {
      var b = this.beat, t = this.t;
      // Beats 0-2: in the lab. Beat 3: stranded in the dawn of creation.
      if (b < 3 && ART_LAB.ok) {
        g.imageSmoothingEnabled = false;
        g.drawImage(ART_LAB.img, 0, 0, 320, 180);
      } else if (b < 2) {
        g.fillStyle = '#14121f'; g.fillRect(0, 0, 320, 180);
      } else if (b < 3) {
        // (fallback for beat 2 when no lab art)
        g.fillStyle = '#14121f'; g.fillRect(0, 0, 320, 180);
      } else {
        // Stranded-in-time backdrop: deep cosmic gradient + starfield +
        // a couple of soft nebula blobs so it reads "out among the
        // stars" rather than "peaceful dawn on a field of grass".
        var grd = g.createLinearGradient(0, 0, 0, 180);
        grd.addColorStop(0, '#0a0a1f'); grd.addColorStop(0.6, '#1a1638');
        grd.addColorStop(1, '#2a1a44');
        g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
        drawStarfield(g, t);
        // Two large diffuse nebulae - low-alpha radial gradients.
        var neb1 = g.createRadialGradient(60, 50, 4, 60, 50, 70);
        neb1.addColorStop(0, 'rgba(180, 120, 220, 0.35)');
        neb1.addColorStop(1, 'rgba(180, 120, 220, 0)');
        g.fillStyle = neb1; g.fillRect(0, 0, 320, 180);
        var neb2 = g.createRadialGradient(240, 80, 4, 240, 80, 80);
        neb2.addColorStop(0, 'rgba(110, 180, 220, 0.30)');
        neb2.addColorStop(1, 'rgba(110, 180, 220, 0)');
        g.fillStyle = neb2; g.fillRect(0, 0, 320, 180);
      }

      // Time-machine drawer. Uses the painted PNGs when available
      // (intact for beats 0-2, busted variant for beat 3); falls
      // back to the procedural sprite when neither is loaded. The
      // dome + cyan glow are layered on top of the painted variant.
      function machine(g, cx, cy, glow, broken) {
        // Painted PNGs (intact + busted variants). PNGs are 1024x1536
        // (2:3 portrait) - rendered at 150 px tall so the machine
        // reads as the focal object. cy is the machine's vertical
        // centre.
        var artImg = broken ? (ART_MACHINE_BROKEN.ok ? ART_MACHINE_BROKEN.img : null)
                            : (ART_MACHINE.ok        ? ART_MACHINE.img        : null);
        if (artImg) {
          var mh = 150, mw = Math.round(mh * (1024 / 1536));  // ~100w
          var mx = cx - mw / 2, my = cy - mh / 2;
          g.imageSmoothingEnabled = false;
          g.drawImage(artImg, mx, my, mw, mh);
          if (glow) {
            domeGlow(g, cx, my + 12, mw * 0.45, t, 1);
          }
          return;
        }
        // Procedural fallback - cx/cy is now CENTER, not top-left, so
        // shift back to the old top-left anchor here.
        var x = cx - 23, y = cy - 23;
        g.fillStyle = '#3b4a6a'; g.fillRect(x, y, 46, 40);
        g.fillStyle = '#586a92'; g.fillRect(x + 3, y + 3, 40, 22);
        g.fillStyle = glow ? '#bff0ff' : '#23304a'; g.fillRect(x + 7, y + 7, 32, 14);
        g.fillStyle = '#2a3550'; g.fillRect(x, y + 40, 46, 6);
        g.fillStyle = glow ? '#ffe893' : '#7a8bb0';
        g.beginPath(); g.arc(x + 23, y + 3, 13, Math.PI, 0); g.fill();
        if (broken) {
          g.fillStyle = '#caa6c0';
          g.fillRect(x + 18, y - 4, 5, 30); g.fillRect(x + 8, y + 14, 30, 4);
        }
        if (glow) {
          g.fillStyle = 'rgba(190,240,255,0.5)';
          g.fillRect(x - 6, y - 8, 58, 4);
        }
      }
      // Big Danny drawn at 2x scale in the intro so he reads at the
      // right weight next to the larger painted machine. drawDannyScaled
      // takes feet-centre coordinates.
      var idleIdx = Math.floor(t / 18) % 4;
      if (b === 0) {
        machine(g, 160, 97, false, false);
        drawDannyScaled(g, 'big', 'idle', 'east', idleIdx, 70, 156, 2);
        text(g, 'THE LAB - PRESENT DAY', 160, 26, '#9aa6c8', 1, 'center');
      } else if (b === 1) {
        machine(g, 160, 97, (t % 16 < 8), false);
        drawDannyScaled(g, 'big', 'jump', 'east', 3, 70, 156, 2);
      } else if (b === 2) {
        machine(g, 160, 97, true, false);
        // Three rings of arcs at varying lengths layered around the
        // machine's centre, each at a different phase so the surge
        // looks chaotic instead of mechanical.
        electricArcs(g, 160,  97, t,        6, 78);
        electricArcs(g, 160,  97, t + 5,    9, 48);
        electricArcs(g, 160,  97, t + 11,  12, 26);
        drawDannyScaled(g, 'big', 'hurt', 'west',
          Math.min(5, Math.floor(t / 4) % 6),
          230, 140 + Math.sin(t * 0.2) * 10, 2);
      } else {
        // Stranded scene: subtle cratered cosmic surface (no green
        // dawn field, no yellow sun) so the focus stays on the
        // broken machine + Super Dude Danny.
        g.fillStyle = '#0e0a1e'; g.fillRect(0, 150, 320, 30);
        g.fillStyle = '#1a1430';
        g.fillRect(0, 148, 320, 2);
        for (var cr = 0; cr < 6; cr++) {
          var crx = (cr * 53 + 18) % 320;
          var crr = 4 + (cr % 3) * 2;
          g.fillStyle = '#221830';
          g.beginPath(); g.ellipse(crx, 162, crr, crr * 0.45, 0, 0, 6.28); g.fill();
        }
        // Smoke puffs rising off the broken machine. Five staggered
        // puffs, each on its own ascending + fading cycle so the
        // column reads as a continuous billow rather than a single
        // pulse.
        for (var sm = 0; sm < 5; sm++) {
          var smPhase = ((t + sm * 36) % 180);
          var smY = 100 - Math.round(smPhase * 0.35);
          var smX = 160 + Math.round(Math.sin((t + sm * 24) * 0.05) * 8)
                   + (sm % 2 ? 6 : -8);
          var smR = 5 + Math.round(smPhase * 0.04);
          var smAlpha = 0.5 - smPhase / 360;
          if (smAlpha > 0) {
            g.fillStyle = 'rgba(70, 60, 80, ' + smAlpha.toFixed(2) + ')';
            g.beginPath(); g.arc(smX, smY, smR, 0, 6.28); g.fill();
            g.fillStyle = 'rgba(110, 100, 130, ' + (smAlpha * 0.6).toFixed(2) + ')';
            g.beginPath(); g.arc(smX - 2, smY - 1, smR * 0.55, 0, 6.28); g.fill();
          }
        }
        machine(g, 160, 103, false, true);
        drawDannyScaled(g, 'big', 'idle', 'east', idleIdx, 70, 150, 2);
      }

      // caption box - pinned to the bottom edge so it stays out of the action above
      var lines = INTRO_BEATS[b] ? INTRO_BEATS[b].lines : [];
      var bh = 16 + lines.length * 11;
      var by_ = 180 - bh;
      g.fillStyle = 'rgba(8,8,20,0.92)'; g.fillRect(8, by_, 304, bh);
      g.strokeStyle = '#ffd23a'; g.strokeRect(8.5, by_ + 0.5, 303, bh - 1);
      for (var i = 0; i < lines.length; i++) {
        text(g, lines[i], 160, by_ + 6 + i * 11, '#ffffff', 1, 'center');
      }
      // bigger, shadowed PRESS A
      if (t % 40 < 26) tsh(g, 'PRESS A', 312, by_ - 12, '#ffd23a', '#000000', 1, 'right');
    }
  };

  // =====================================================================
  // MENU - title screen
  // =====================================================================
  SDD.scenes.menu = {
    enter: function () {
      this.t = 0;
      // Continue the title song that started on the logo card. The
      // startMusic guard skips a re-start if 'title' is already
      // playing - the music flows seamlessly through the scene change.
      A.startMusic('title');
      this.items = [{ label: 'NEW GAME', act: 'new' }];
      if (SDD.save.hasSave()) this.items.splice(1, 0, { label: 'CONTINUE', act: 'continue' });
      this.items.push({ label: 'OPTIONS', act: 'options' });
      this.items.push({ label: 'HOW TO PLAY', act: 'howto' });
      // v0.55 secret stage: once the active slot's firstClear flag is
      // true (set when the kid finishes the finale), the Computer
      // character offers the Adventure City stage. Hidden until earned.
      if (SDD.save.data.firstClear) {
        this.items.push({ label: 'ADVENTURE CITY', act: 'adventurecity' });
      }
      // Dev: in-game level editor. Remove this line + js/editor.js
      // load + the 'editor' branch below to ship without the editor.
      if (SDD.scenes.editor) this.items.push({ label: 'LEVEL EDITOR', act: 'editor' });
      this.idx = SDD.save.hasSave() ? 1 : 0;
    },
    update: function () {
      this.t++;
      listNav(this, this.items.length);
      if (In.confirm()) {
        var act = this.items[this.idx].act;
        A.sfx('confirm');
        if (act === 'new') { go('newgame'); }
        else if (act === 'continue') { go('overworld'); }
        else if (act === 'options') { go('options', { from: 'menu' }); }
        else if (act === 'howto') { go('howto', { from: 'menu' }); }
        else if (act === 'adventurecity') { go('level', { day: 8, stage: 1 }); }
        else if (act === 'editor') { go('editor'); }
      }
    },
    render: function (g) {
      var grd = g.createLinearGradient(0, 0, 0, 180);
      grd.addColorStop(0, '#1a1640'); grd.addColorStop(1, '#4a3a78');
      g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
      drawStarfield(g, this.t);
      drawAtom(g, 268, 44, 30, this.t);

      var bob = Math.sin(this.t * 0.05) * 2;
      tsh(g, 'SUPER DUDE', 160, 30 + bob, '#ffd23a', '#a8631a', 3, 'center');
      tsh(g, 'DANNY', 160, 56 + bob, '#ff5d4a', '#7a1f16', 5, 'center');
      // Menu Danny: ~50% bigger, static idle facing right. Mark found
      // the rotating-pose version too chaotic - "just have him standing
      // idle looking right."
      var mpFrame = Math.floor(this.t / 18) % 4;
      drawDannyScaled(g, 'big', 'idle', 'east', mpFrame, 54, 138, 1.5);

      for (var i = 0; i < this.items.length; i++) {
        var y = 104 + i * 14;
        var sel = i === this.idx;
        if (sel) text(g, '>', 108, y, '#ffd23a', 1, 'left');
        // Mark's request: selection should be brighter but not 2x bigger.
        // Keep size:1 for both; brighter colour + arrow signals selection.
        text(g, this.items[i].label, 160, y, sel ? '#ffffff' : '#9aa0c4', 1, 'center');
      }
      // Tagline reads "CROSSROADS FOUNDATION ADVENTURE" per Mark.
      // Bumped down to y=164 and the menu items pushed up to y=104 so
      // they don't collide with the tagline.
      if (this.t % 50 < 34) text(g, 'CROSSROADS FOUNDATION ADVENTURE', 160, 164, '#aab0d4', 1, 'center');
      // Build version (DEV-KIT) - bottom-right, subtle. Lets us tell at
      // a glance which build is live. Remove before public release.
      text(g, SDD.VERSION || '', 316, 173, '#6d7398', 1, 'right');
    }
  };

  // =====================================================================
  // NEW GAME - difficulty / save-slot picker. Tapping a slot loads that
  // save: empty slots start a fresh intro, populated slots resume from
  // the overworld with the previously-unlocked progress intact. ERASE
  // sends to a sub-confirm so kids can wipe a save without dropping
  // the others.
  // =====================================================================
  function slotStatusText(d) {
    var sum = SDD.save.slotSummary(d);
    if (!sum || sum.empty) return 'EMPTY';
    var stagesDone = sum.completedStages.length;
    var lbl = 'DAY ' + sum.unlockedDay;
    if (SDD.save.stagesForDay(sum.unlockedDay) > 1) lbl += '-' + sum.unlockedStage;
    return lbl + '   STAGES ' + stagesDone;
  }

  var DIFFICULTY_META = {
    easy:   { label: 'EASY',   color: '#9bf0a0', desc: 'UNLIMITED LIVES + CHECKPOINTS' },
    medium: { label: 'MEDIUM', color: '#ffd23a', desc: 'CLASSIC LIVES + CHECKPOINTS'   },
    hard:   { label: 'HARD',   color: '#ff8a6a', desc: 'NO CHECKPOINTS - ONE LIFE LOST = STAGE START' }
  };

  SDD.scenes.newgame = {
    enter: function () {
      this.t = 0;
      this.idx = 0;
      this.confirmErase = null;          // when set: holds 'easy'/'medium'/'hard'
      SDD.runLives = 3;                  // fresh 3-life budget on new run
      // Active difficulty starts highlighted so opening the picker keeps
      // the cursor on the player's most recent slot.
      var cur = SDD.save.curDifficulty();
      var diffs = ['easy', 'medium', 'hard'];
      var ci = diffs.indexOf(cur);
      if (ci >= 0) this.idx = ci;
    },
    update: function () {
      this.t++;
      // Sub-confirm dialog handles its own input
      if (this.confirmErase) {
        if (In.pressed('left'))  { this.confirmYes = false; A.sfx('select'); }
        if (In.pressed('right')) { this.confirmYes = true; A.sfx('select'); }
        if (In.confirm()) {
          A.sfx('confirm');
          if (this.confirmYes) {
            SDD.save.resetSlot(this.confirmErase);
          }
          this.confirmErase = null;
          this.confirmYes = false;
        }
        if (In.pressed('pause')) { A.sfx('confirm'); this.confirmErase = null; this.confirmYes = false; }
        return;
      }
      // 5 items: easy, medium, hard, ERASE A SAVE (only if any slot has progress), BACK
      var items = this.buildItems();
      listNav(this, items.length);
      if (In.back()) { A.sfx('confirm'); go('menu'); return; }
      if (In.confirm()) {
        var it = items[this.idx];
        A.sfx('confirm');
        if (it.act === 'play') {
          var d = it.diff;
          SDD.save.setDifficulty(d);
          var sum = SDD.save.slotSummary(d);
          if (sum.empty) {
            SDD.save.resetSlot(d);                  // defensive - keep slot clean
            go('intro');
          } else {
            go('overworld');
          }
        } else if (it.act === 'erase') {
          // Open the erase sub-picker - pick which slot to wipe
          this.eraseChoose = true;
          this.idx = 0;
        } else if (it.act === 'eraseChoose') {
          if (it.disabled) return;
          this.confirmErase = it.diff;
          this.confirmYes = false;
        } else if (it.act === 'back') {
          if (this.eraseChoose) { this.eraseChoose = false; this.idx = 0; }
          else { go('menu'); }
        }
      }
    },
    buildItems: function () {
      var items = [];
      if (this.eraseChoose) {
        var diffs = ['easy', 'medium', 'hard'];
        for (var i = 0; i < diffs.length; i++) {
          var d = diffs[i];
          var sum = SDD.save.slotSummary(d);
          items.push({
            act: 'eraseChoose', diff: d,
            label: 'ERASE ' + DIFFICULTY_META[d].label,
            sub: sum.empty ? '(EMPTY)' : slotStatusText(d),
            disabled: sum.empty
          });
        }
        items.push({ act: 'back', label: 'BACK' });
        return items;
      }
      ['easy', 'medium', 'hard'].forEach(function (d) {
        items.push({ act: 'play', diff: d, label: DIFFICULTY_META[d].label, sub: slotStatusText(d) });
      });
      var anyProgress = SDD.save.hasSave();
      if (anyProgress) items.push({ act: 'erase', label: 'ERASE A SAVE' });
      items.push({ act: 'back', label: 'BACK' });
      return items;
    },
    render: function (g) {
      var grd = g.createLinearGradient(0, 0, 0, 180);
      grd.addColorStop(0, '#1a1640'); grd.addColorStop(1, '#4a3a78');
      g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
      drawStarfield(g, this.t);
      tsh(g, this.eraseChoose ? 'ERASE A SAVE' : 'SELECT DIFFICULTY',
          160, 22, '#ffd23a', '#a8631a', 2, 'center');

      var items = this.buildItems();
      // Body list rendered from y=52, 22px per row to fit 5 items in the
      // available 180px viewport with breathing room.
      var rowH = 22;
      for (var i = 0; i < items.length; i++) {
        var y = 52 + i * rowH;
        var sel = i === this.idx;
        var it = items[i];
        var meta = it.diff ? DIFFICULTY_META[it.diff] : null;
        var color = sel ? '#ffffff' : (meta ? meta.color : '#9aa0c4');
        if (sel) text(g, '>', 38, y, '#ffd23a', 1, 'left');
        text(g, it.label, 56, y, color, 1, 'left');
        if (it.sub) {
          text(g, it.sub, 200, y, sel ? '#dfe6ff' : '#7a80a4', 1, 'left');
        }
        if (meta && sel) {
          // One-line description hint for the focused difficulty
          text(g, meta.desc, 160, 156, '#aab0d4', 1, 'center');
        }
      }
      // Confirm dialog overlay
      if (this.confirmErase) {
        g.fillStyle = 'rgba(0,0,0,0.7)';
        g.fillRect(0, 0, 320, 180);
        g.fillStyle = '#1a1640';
        g.fillRect(50, 60, 220, 60);
        g.strokeStyle = '#ff8a6a';
        g.lineWidth = 1;
        g.strokeRect(50.5, 60.5, 220, 60);
        tsh(g, 'ERASE ' + DIFFICULTY_META[this.confirmErase].label + '?',
            160, 76, '#ff8a6a', '#5a1810', 1, 'center');
        text(g, 'THIS CANT BE UNDONE.', 160, 90, '#dfe6ff', 1, 'center');
        var noSel = !this.confirmYes;
        text(g, (noSel ? '>' : ' ') + 'CANCEL', 90, 108, noSel ? '#ffffff' : '#9aa0c4', 1, 'left');
        text(g, (!noSel ? '>' : ' ') + 'ERASE', 190, 108, !noSel ? '#ff8a6a' : '#9aa0c4', 1, 'left');
      }
    }
  };

  // =====================================================================
  // OPTIONS
  // =====================================================================
  SDD.scenes.options = {
    enter: function (d) { this.from = (d && d.from) || 'menu'; this.idx = 0; this.t = 0; },
    update: function () {
      this.t++;
      listNav(this, 5);
      var o = SDD.save.data.options;
      if (typeof o.musicVolume !== 'number') o.musicVolume = 0.5;
      if (typeof o.sfxVolume !== 'number') o.sfxVolume = 0.85;
      if (this.idx === 0 && In.confirm()) {
        o.muted = !o.muted; A.setMuted(o.muted); SDD.save.save();
        if (!o.muted) A.sfx('confirm');
      }
      if (this.idx === 1) {
        // MUSIC volume - 0.1 steps.
        if (In.pressed('left'))  { o.musicVolume = Math.max(0, Math.round((o.musicVolume - 0.1) * 10) / 10); A.setMusicVolume(o.musicVolume); A.sfx('select'); SDD.save.save(); }
        if (In.pressed('right')) { o.musicVolume = Math.min(1, Math.round((o.musicVolume + 0.1) * 10) / 10); A.setMusicVolume(o.musicVolume); A.sfx('select'); SDD.save.save(); }
      }
      if (this.idx === 2) {
        // SFX volume - 0.1 steps; play a tick so the change is audible.
        if (In.pressed('left'))  { o.sfxVolume = Math.max(0, Math.round((o.sfxVolume - 0.1) * 10) / 10); A.setSfxVolume(o.sfxVolume); A.sfx('select'); SDD.save.save(); }
        if (In.pressed('right')) { o.sfxVolume = Math.min(1, Math.round((o.sfxVolume + 0.1) * 10) / 10); A.setSfxVolume(o.sfxVolume); A.sfx('select'); SDD.save.save(); }
      }
      if (this.idx === 3 && In.confirm()) {
        o.god = !o.god; SDD.save.save(); A.sfx('confirm');
      }
      if (this.idx === 4 && In.confirm()) { A.sfx('confirm'); this.exitTo(); }
      if (In.back()) { A.sfx('confirm'); this.exitTo(); }
    },
    exitTo: function () {
      // From the in-game pause menu: don't re-enter the level (that
      // would reset lives/progress); just put it back in its paused
      // state and switch the scene reference directly.
      if (this.from === 'pause') {
        SDD.scene = SDD.scenes.level;
        SDD.scenes.level.state = 'paused';
        SDD.scenes.level.pauseIdx = 0;
        return;
      }
      go(this.from);
    },
    render: function (g) {
      g.fillStyle = '#1a1640'; g.fillRect(0, 0, 320, 180);
      drawStarfield(g, this.t);
      tsh(g, 'OPTIONS', 160, 22, '#ffd23a', '#a8631a', 3, 'center');
      var o = SDD.save.data.options;
      var mv = (typeof o.musicVolume === 'number') ? o.musicVolume : 0.5;
      var sv = (typeof o.sfxVolume === 'number') ? o.sfxVolume : 0.85;
      // The pixel font has no '['/'='/']' glyphs, so show a percentage
      // (digits + '%' both exist) instead of an ASCII bar.
      function bar(v) { return Math.round(v * 100) + '%'; }
      var rows = [
        'SOUND:  ' + (o.muted ? 'OFF' : 'ON'),
        'MUSIC:  ' + bar(mv),
        'SFX:    ' + bar(sv),
        'GOD MODE: ' + (o.god ? 'ON' : 'OFF'),
        'BACK'
      ];
      for (var i = 0; i < rows.length; i++) {
        var y = 64 + i * 20, sel = i === this.idx;
        if (sel) text(g, '>', 60, y, '#ffd23a', 1, 'left');
        text(g, rows[i], 76, y, sel ? '#ffffff' : '#9aa0c4', 1, 'left');
      }
      text(g, 'ARROWS TO CHANGE   A TO CONFIRM', 160, 158, '#8a90b4', 1, 'center');
      text(g, 'TIP: PRESS G ANYWHERE TO TOGGLE GOD MODE', 160, 168, '#6d7398', 1, 'center');
    }
  };
  function repeat(ch, n) { var s = ''; for (var i = 0; i < n; i++) s += ch; return s; }

  // =====================================================================
  // HOW TO PLAY
  // =====================================================================
  SDD.scenes.howto = {
    enter: function (d) { this.from = (d && d.from) || 'menu'; this.t = 0; },
    update: function () {
      this.t++;
      if (In.confirm() || In.back()) { A.sfx('confirm'); go(this.from); }
    },
    render: function (g) {
      g.fillStyle = '#142036'; g.fillRect(0, 0, 320, 180);
      tsh(g, 'HOW TO PLAY', 160, 16, '#ffd23a', '#a8631a', 2, 'center');
      var lines = [
        'MOVE      ARROW KEYS  /  D-PAD',
        'JUMP      A   ( SPACE OR Z )',
        'POWER     B   ( X OR J )',
        '',
        'STOMP ENEMIES OR ZAP THEM WITH',
        'THE LIGHT BLAST POWER-UP.',
        '',
        'GRAB POWER CORES ALONG THE WAY,',
        'THEN REACH THE TIME-MACHINE PART',
        'TO COMPLETE THE DAY!'
      ];
      for (var i = 0; i < lines.length; i++) text(g, lines[i], 24, 40 + i * 12, '#dfe6ff', 1, 'left');
      if (this.t % 44 < 30) text(g, 'PRESS A TO GO BACK', 160, 168, '#ffd23a', 1, 'center');
    }
  };

  // =====================================================================
  // OVERWORLD - 12 named stage nodes (each level is its own "world").
  // The dotted path winds across the map; nodes light up as Danny clears
  // them. The optional background art is a swap-in image at
  // assets/overworld.png that gets composited under the path + nodes.
  // =====================================================================
  // Coordinates target the painted serpentine island map at
  // assets/overworld.png. Top row 1-6 left->right, right-edge drop to
  // 7, bottom row 8-11 right->left, bottom drop to Eden #12.
  // (x, dy) is Danny's standing position on the painted island's
  // walkable top surface. Coordinates measured against the painted
  // overworld at game-native 320x180 resolution, then verified by
  // /tmp/test_overworld.js (which holds the ground-truth bboxes and
  // walkable-y bands for each island). nextDir is the direction the
  // painted path leads to the FOLLOWING island; the previous direction
  // is the opposite of the previous stage's nextDir.
  var STAGES = [
    { d: 1, s: 1, x:  32, dy:  52, name: 'COSMIC VOID', nextDir: 'right' },
    { d: 2, s: 1, x:  82, dy:  56, name: 'DAWN SKY',    nextDir: 'right' },
    { d: 2, s: 2, x: 131, dy:  58, name: 'OCEAN',       nextDir: 'right' },
    { d: 3, s: 1, x: 185, dy:  56, name: 'MOUNTAINS',   nextDir: 'right' },
    { d: 3, s: 2, x: 238, dy:  57, name: 'FOREST',      nextDir: 'right' },
    { d: 4, s: 1, x: 289, dy:  58, name: 'DESERT',      nextDir: 'down'  },
    { d: 4, s: 2, x: 282, dy: 110, name: 'NIGHT SKY',   nextDir: 'left'  },
    { d: 5, s: 1, x: 211, dy: 117, name: 'CLOUDS',      nextDir: 'left'  },
    { d: 5, s: 2, x: 151, dy: 118, name: 'UNDERWATER',  nextDir: 'left'  },
    { d: 6, s: 1, x:  96, dy: 119, name: 'SAVANNA',     nextDir: 'left'  },
    { d: 6, s: 2, x:  40, dy: 120, name: 'CREEPING THINGS', nextDir: 'down'  },
    { d: 7, s: 1, x: 240, dy: 160, name: 'EDEN GARDEN', nextDir: null    }
  ];
  var OPPOSITE = { right: 'left', left: 'right', up: 'down', down: 'up' };
  // Optional swap-in art (assets/overworld.png). Drawn under the path
  // when present; otherwise we draw the gradient + starfield fallback.
  var overworldImg = new Image();
  var overworldImgOk = false;
  overworldImg.onload  = function () { overworldImgOk = (overworldImg.width > 0); };
  overworldImg.onerror = function () { overworldImgOk = false; };
  // 2nd art drop (Mark): repainted creation map. Same 1672x941 canvas
  // + identical island positions as the old overworld.png, so the
  // navigation nodes and the animated overlays (sparkles / fish /
  // waves) all still line up; the 11th island is now themed for
  // Creeping Things instead of the old village.
  overworldImg.src = 'assets/New%20Assets/New%20Overworld.png';

  function stageOpen(idx) {
    if (idx === 0) return true;
    var prev = STAGES[idx - 1];
    return SDD.save.data.completedStages.indexOf(prev.d + '-' + prev.s) >= 0;
  }
  function stageDone(st) {
    return SDD.save.data.completedStages.indexOf(st.d + '-' + st.s) >= 0;
  }
  function firstUnclearedIdx() {
    for (var i = 0; i < STAGES.length; i++) if (!stageDone(STAGES[i])) return i;
    return STAGES.length - 1;
  }

  SDD.scenes.overworld = {
    enter: function () {
      this.t = 0;
      this.idx = firstUnclearedIdx();
      this.msg = ''; this.msgT = 0;
      this.dannyX = STAGES[this.idx].x;
      this.dannyY = STAGES[this.idx].dy;
      A.startMusic('overworld');
    },
    update: function () {
      this.t++;
      if (this.msgT > 0) this.msgT--;
      // Direction-aware navigation: pressing a direction only moves if
      // the painted path actually goes that way from the current node,
      // AND the destination is unlocked. No padlocks - the gate IS
      // the navigation block.
      var dirs = ['left', 'right', 'up', 'down'];
      for (var di = 0; di < dirs.length; di++) {
        var d = dirs[di];
        if (!In.pressed(d)) continue;
        var cur = STAGES[this.idx];
        // Forward along the painted path
        if (cur.nextDir === d && this.idx < STAGES.length - 1) {
          if (stageOpen(this.idx + 1)) { this.idx++; A.sfx('select'); }
          else { A.sfx('bump'); }
          break;
        }
        // Backward along the painted path (opposite of prev's nextDir)
        if (this.idx > 0 &&
            OPPOSITE[STAGES[this.idx - 1].nextDir] === d) {
          this.idx--; A.sfx('select');
          break;
        }
      }
      // Danny glides toward the selected island. Rate was 0.25 (too
      // fast to see his run animation) - dropped to 0.10 per Mark.
      this.dannyX += (STAGES[this.idx].x  - this.dannyX) * 0.10;
      this.dannyY += (STAGES[this.idx].dy - this.dannyY) * 0.10;
      if (In.confirm()) {
        var st = STAGES[this.idx];
        if (!SDD.levels || !SDD.levels[st.d + '-' + st.s]) {
          this.msg = st.name + ' - COMING SOON!'; this.msgT = 130; A.sfx('bump');
        } else {
          A.sfx('enter'); go('stageintro', { day: st.d, stage: st.s });
        }
      }
      if (In.pressed('pause')) { A.sfx('confirm'); go('menu'); }
    },
    render: function (g) {
      // Background: painted island map if assets/overworld.png is present,
      // otherwise the procedural gradient + starfield fallback so the
      // scene still reads when the art file hasn't been added yet.
      if (overworldImgOk) {
        g.drawImage(overworldImg, 0, 0, 320, 180);
        // Subtle animated overlays on a few painted islands so the
        // map feels alive without redrawing it. Each effect is tight
        // to its island's tile so the painted art still reads first.
        var ovT = this.t;
        // 1) COSMIC VOID - 6 twinkling stars sprinkled around the island.
        var cv = STAGES[0];
        for (var cvI = 0; cvI < 6; cvI++) {
          var cvAng = cvI * 1.05;
          var cvR = 8 + (cvI % 3) * 3;
          var cvX = Math.round(cv.x + Math.cos(cvAng) * cvR);
          var cvY = Math.round(cv.dy + Math.sin(cvAng) * cvR * 0.7) - 4;
          var cvA = 0.45 + 0.45 * Math.sin(ovT * 0.07 + cvI * 1.7);
          if (cvA > 0.15) {
            g.fillStyle = 'rgba(255,255,255,' + cvA.toFixed(2) + ')';
            g.fillRect(cvX, cvY, 1, 1);
          }
        }
        // 2) DAWN SKY - 3 small drifting clouds gliding right.
        var ds = STAGES[1];
        for (var dsI = 0; dsI < 3; dsI++) {
          var dsPhase = ((ovT + dsI * 80) % 200) / 200;     // 0..1
          var dsX = Math.round(ds.x - 12 + dsPhase * 24);
          var dsY = ds.dy - 6 + (dsI - 1) * 3;
          var dsA = (dsPhase < 0.1) ? dsPhase * 10
                  : (dsPhase > 0.9) ? (1 - dsPhase) * 10
                  : 1;
          g.fillStyle = 'rgba(255,255,255,' + (dsA * 0.7).toFixed(2) + ')';
          g.fillRect(dsX, dsY, 4, 1);
          g.fillRect(dsX + 1, dsY - 1, 2, 1);
          g.fillRect(dsX + 1, dsY + 1, 3, 1);
        }
        // 3) OCEAN - 4 cyan shimmer sparkles in the water around the island.
        var oc = STAGES[2];
        for (var ocI = 0; ocI < 4; ocI++) {
          var ocPhase = (ovT + ocI * 18) % 60;
          var ocAng = ocI * 1.57 + ocI * 0.4;
          var ocR = 9 + (ocI % 2) * 3;
          // Nudged up 20 + left 5 to sit on the painted water (Mark).
          var ocX = Math.round(oc.x - 5 + Math.cos(ocAng) * ocR);
          var ocY = Math.round(oc.dy + Math.sin(ocAng) * ocR * 0.5) - 15;
          var ocA = Math.sin(ocPhase / 60 * Math.PI);
          if (ocA > 0) {
            g.fillStyle = 'rgba(180,240,255,' + (ocA * 0.85).toFixed(2) + ')';
            g.fillRect(ocX, ocY, 1, 1);
            g.fillStyle = 'rgba(255,255,255,' + (ocA * 0.6).toFixed(2) + ')';
            g.fillRect(ocX, ocY - 1, 1, 1);
          }
        }
        // 3b) OCEAN - thin horizontal wave crests rolling across the
        // water around the island (Mark: "a little bit more on the
        // 3rd, make it look like there's waves"). Two crests phased
        // half a cycle apart, each a 1-px-tall white dash that slides
        // left across a ~20 px band.
        for (var owI = 0; owI < 2; owI++) {
          var owPhase = ((ovT + owI * 60) % 120) / 120;       // 0..1
          var owX = Math.round(oc.x + 14 - owPhase * 30);
          var owY = oc.dy - 13 + owI * 2;        // raised 20 px onto the water
          var owA = (owPhase < 0.15) ? owPhase / 0.15
                  : (owPhase > 0.85) ? (1 - owPhase) / 0.15
                  : 1;
          g.fillStyle = 'rgba(220,240,255,' + (owA * 0.55).toFixed(2) + ')';
          g.fillRect(owX, owY, 5, 1);
          g.fillRect(owX + 6, owY, 2, 1);
        }
        // 9th tile - DEEP CURRENTS (Day 5-2, STAGES[8]): waves above
        // + tiny darting fish silhouettes around the island.
        var uw = STAGES[8];
        // Wave crests (two phased)
        for (var uwI = 0; uwI < 2; uwI++) {
          var uwPhase = ((ovT + uwI * 65) % 130) / 130;
          var uwX = Math.round(uw.x - 14 + uwPhase * 30);
          var uwY = uw.dy + 6 + uwI * 2;
          var uwA = (uwPhase < 0.15) ? uwPhase / 0.15
                  : (uwPhase > 0.85) ? (1 - uwPhase) / 0.15
                  : 1;
          g.fillStyle = 'rgba(220,240,255,' + (uwA * 0.55).toFixed(2) + ')';
          g.fillRect(uwX, uwY, 5, 1);
          g.fillRect(uwX + 6, uwY, 2, 1);
        }
        // Fish: 3 tiny silhouettes circling the island at varying
        // radii. Each rendered as a 3x1 body with a 1x1 tail flick.
        for (var fI = 0; fI < 3; fI++) {
          var fAng = (ovT * 0.012 + fI * 2.09) % 6.28;
          var fR = 11 + (fI % 2) * 3;
          var fX = Math.round(uw.x + Math.cos(fAng) * fR);
          var fY = Math.round(uw.dy + Math.sin(fAng) * fR * 0.55) + 4;
          var faceR = Math.cos(fAng) > 0;
          g.fillStyle = '#102b3a';
          g.fillRect(fX - 1, fY, 3, 1);
          // Tail flick on the trailing edge
          g.fillRect(faceR ? fX - 2 : fX + 2, fY, 1, 1);
        }
        // 6th tile - DESERT (Day 4-1, STAGES[5]): a few little bugs
        // scuttling short hops near the island base.
        var ds2 = STAGES[5];
        for (var bgI = 0; bgI < 3; bgI++) {
          var bgCycle = (ovT + bgI * 40) % 120;
          var bgProg = bgCycle / 120;                         // 0..1 crawl across
          var bgDir = (bgI % 2) ? 1 : -1;
          var bgX = Math.round(ds2.x + bgDir * (-8 + bgProg * 16));
          var bgY = ds2.dy + 8 + bgI * 2;
          // little scuttle bob every few frames
          var bgBob = (Math.floor(ovT / 6) % 2) ? 0 : 1;
          g.fillStyle = '#3a2410';
          g.fillRect(bgX, bgY - bgBob, 2, 1);
          g.fillRect(bgX + (bgDir > 0 ? -1 : 2), bgY - bgBob, 1, 1); // head
        }
        // 7th tile - NIGHT SKY (Day 4-2, STAGES[6]): twinkling stars +
        // a soft moon shimmer over the island.
        var ns = STAGES[6];
        for (var nsI = 0; nsI < 6; nsI++) {
          var nsAng = nsI * 1.05 + 0.6;
          var nsR = 8 + (nsI % 3) * 3;
          var nsX = Math.round(ns.x + Math.cos(nsAng) * nsR);
          var nsY = Math.round(ns.dy + Math.sin(nsAng) * nsR * 0.7) - 4;
          var nsA = 0.4 + 0.5 * Math.sin(ovT * 0.08 + nsI * 1.9);
          if (nsA > 0.15) {
            g.fillStyle = 'rgba(200,220,255,' + nsA.toFixed(2) + ')';
            g.fillRect(nsX, nsY, 1, 1);
            if (nsA > 0.8) { g.fillStyle = 'rgba(255,255,255,' + ((nsA - 0.8) * 3).toFixed(2) + ')';
              g.fillRect(nsX, nsY, 1, 1); g.fillRect(nsX, nsY - 1, 1, 1); g.fillRect(nsX - 1, nsY, 1, 1); }
          }
        }
        // 8th tile - CLOUDS (Day 5-1, STAGES[7]): bird chevrons drifting
        // across + a couple of slowly gliding cloud puffs.
        var cl = STAGES[7];
        for (var clB = 0; clB < 3; clB++) {
          var clPh = ((ovT + clB * 45) % 150) / 150;
          var clBX = Math.round(cl.x - 13 + clPh * 26);
          var clBY = cl.dy - 8 + clB * 3 + Math.round(Math.sin(ovT * 0.05 + clB) * 1.5);
          var clBA = (clPh < 0.12) ? clPh / 0.12 : (clPh > 0.88) ? (1 - clPh) / 0.12 : 1;
          g.strokeStyle = 'rgba(60,80,110,' + (clBA * 0.7).toFixed(2) + ')';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(clBX - 2, clBY + 1); g.lineTo(clBX, clBY); g.lineTo(clBX + 2, clBY + 1);
          g.stroke();
        }
        for (var clC = 0; clC < 2; clC++) {
          var clcPh = ((ovT + clC * 90) % 180) / 180;
          var clcX = Math.round(cl.x - 12 + clcPh * 24);
          var clcY = cl.dy + 5 + clC * 4;
          var clcA = (clcPh < 0.12) ? clcPh / 0.12 : (clcPh > 0.88) ? (1 - clcPh) / 0.12 : 1;
          g.fillStyle = 'rgba(255,255,255,' + (clcA * 0.6).toFixed(2) + ')';
          g.fillRect(clcX, clcY, 5, 1);
          g.fillRect(clcX + 1, clcY - 1, 3, 1);
        }
        // 12th tile - EDEN GARDEN (Day 7, STAGES[11]): 6 warm gold
        // twinkles sprinkled around the garden island.
        var ed = STAGES[11];
        for (var edI = 0; edI < 6; edI++) {
          var edAng = edI * 1.05 + 0.4;
          var edR = 9 + (edI % 3) * 3;
          var edX = Math.round(ed.x + Math.cos(edAng) * edR);
          var edY = Math.round(ed.dy + Math.sin(edAng) * edR * 0.7) - 2;
          var edA = 0.4 + 0.5 * Math.sin(ovT * 0.06 + edI * 1.4);
          if (edA > 0.15) {
            g.fillStyle = 'rgba(255,232,140,' + edA.toFixed(2) + ')';
            g.fillRect(edX, edY, 1, 1);
            // Brighter core on the strongest twinkle frames
            if (edA > 0.7) {
              g.fillStyle = 'rgba(255,255,210,' + ((edA - 0.7) * 2).toFixed(2) + ')';
              g.fillRect(edX, edY, 1, 1);
            }
          }
        }
      } else {
        var grd = g.createLinearGradient(0, 0, 0, 180);
        grd.addColorStop(0, '#243a6e'); grd.addColorStop(1, '#6fae8a');
        g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
        drawStarfield(g, this.t);
        // Without the painted image, draw a thin path so nodes feel linked.
        g.strokeStyle = 'rgba(255,230,150,0.5)'; g.lineWidth = 1;
        g.setLineDash([3, 3]);
        g.beginPath();
        g.moveTo(STAGES[0].x, STAGES[0].dy);
        for (var p = 1; p < STAGES.length; p++) g.lineTo(STAGES[p].x, STAGES[p].dy);
        g.stroke();
        g.setLineDash([]);
      }
      // Painted art is the entire state UI - no overlays per island.
      // Fallback mode (no painted image yet) still draws node disks
      // so the gradient backdrop is usable.
      if (!overworldImgOk) {
        for (var i = 0; i < STAGES.length; i++) {
          var st = STAGES[i];
          var open = stageOpen(i), done = stageDone(st);
          g.fillStyle = open ? (done ? '#7dff9a' : '#ffd23a') : '#5a5f78';
          g.beginPath(); g.arc(st.x, st.dy, 7, 0, Math.PI * 2); g.fill();
          text(g, '' + (i + 1), st.x, st.dy - 3,
            open ? '#1a1640' : '#9498ac', 1, 'center');
        }
      }
      // Danny walking between islands
      var dGap = STAGES[this.idx].x - this.dannyX;
      var dY = this.dannyY - 26 + Math.sin(this.t * 0.1) * 1.5;
      if (Math.abs(dGap) > 1) {
        S.drawDanny(g, 'small', 'run', dGap < 0 ? 'west' : 'east',
          Math.floor(this.t / 4) % 4, this.dannyX - 11, dY);
      } else {
        S.drawDanny(g, 'small', 'idle', 'east',
          Math.floor(this.t / 18) % 4, this.dannyX - 11, dY);
      }
      // Selection indicator: a small yellow bobbing arrow pointing
      // down at Danny's head. Always follows Danny so it can never
      // land off-island. Replaces the old white frame.
      var ax = Math.round(this.dannyX);
      var ay = Math.round(dY - 8 + Math.sin(this.t * 0.15) * 1.5);
      // Black outline so the arrow stays readable on any biome color
      g.fillStyle = '#1a1640';
      g.fillRect(ax - 4, ay,     9, 1);
      g.fillRect(ax - 3, ay + 1, 7, 1);
      g.fillRect(ax - 2, ay + 2, 5, 1);
      g.fillRect(ax - 1, ay + 3, 3, 1);
      g.fillRect(ax,     ay + 4, 1, 1);
      // Yellow fill on top of the outline
      g.fillStyle = '#ffd23a';
      g.fillRect(ax - 3, ay,     7, 1);
      g.fillRect(ax - 2, ay + 1, 5, 1);
      g.fillRect(ax - 1, ay + 2, 3, 1);
      g.fillRect(ax,     ay + 3, 1, 1);
      // Header (top strip, 18px) - title + selected biome name
      g.fillStyle = 'rgba(8,8,20,0.78)'; g.fillRect(0, 0, 320, 18);
      text(g, 'CREATION MAP', 6, 6, '#ffd23a', 1, 'left');
      var sel = STAGES[this.idx], openSel = stageOpen(this.idx);
      text(g, (this.idx + 1) + '. ' + sel.name, 314, 6,
        openSel ? '#ffffff' : '#8a90b4', 1, 'right');
      // Footer (thin 12px strip so Eden island isn't clipped)
      g.fillStyle = 'rgba(8,8,20,0.78)'; g.fillRect(0, 168, 320, 12);
      if (this.msgT > 0) text(g, this.msg, 160, 172, '#ff8a6a', 1, 'center');
      else text(g, 'ARROWS: PICK   A: ENTER', 160, 172, '#dfe6ff', 1, 'center');
    }
  };

  // =====================================================================
  // LEVEL - Day 1 gameplay
  // =====================================================================
  // ---- scenic background: sky, sun, drifting clouds, parallax hills ----
  var CLOUDS = [];
  for (var _c = 0; _c < 9; _c++) {
    CLOUDS.push({ x: _c * 165 + (_c * 71 % 120), y: 14 + (_c * 43 % 54), s: 0.62 + (_c % 3) * 0.33 });
  }
  // Three cloud shape variants - puffy (default), wispy (long + low),
  // layered (stacked rounded). Picked per-cloud via the cloud's seed
  // so each cloud always looks the same but the sky has variety.
  function puff(g, x, y, s, variant) {
    g.beginPath();
    if (variant === 1) {
      // Wispy: long and low
      g.arc(x,           y,         5.5 * s, 0, 6.29);
      g.arc(x + 7 * s,   y + 1 * s, 6.5 * s, 0, 6.29);
      g.arc(x + 14 * s,  y,         5 * s,   0, 6.29);
      g.arc(x + 20 * s,  y + 1 * s, 6 * s,   0, 6.29);
      g.arc(x + 26 * s,  y,         5 * s,   0, 6.29);
    } else if (variant === 2) {
      // Layered: stacked round puffs
      g.arc(x,           y,          6 * s,   0, 6.29);
      g.arc(x + 7 * s,   y - 3 * s,  7 * s,   0, 6.29);
      g.arc(x + 15 * s,  y - 1 * s,  6.5 * s, 0, 6.29);
      g.arc(x + 8 * s,   y - 8 * s,  5 * s,   0, 6.29);
      g.arc(x + 13 * s,  y + 3 * s,  5 * s,   0, 6.29);
      g.arc(x + 2 * s,   y + 3 * s,  4.5 * s, 0, 6.29);
    } else {
      // Default puffy
      g.arc(x,           y,         7 * s,   0, 6.29);
      g.arc(x + 9 * s,   y + 2 * s, 9 * s,   0, 6.29);
      g.arc(x + 20 * s,  y,         6.5 * s, 0, 6.29);
      g.arc(x + 11 * s,  y - 5 * s, 7 * s,   0, 6.29);
      g.arc(x + 4 * s,   y + 4 * s, 5 * s,   0, 6.29);
    }
    g.fill();
  }
  function drawCloud(g, x, y, s, alpha, variant) {
    g.save();
    g.globalAlpha = alpha * 0.8;
    g.fillStyle = '#c6d2ea'; puff(g, x, y + 2.5 * s, s, variant);
    g.globalAlpha = alpha;
    g.fillStyle = '#ffffff'; puff(g, x, y, s, variant);
    g.restore();
  }
  function drawSun(g, x, y, prog) {
    g.save();
    var grd = g.createRadialGradient(x, y, 2, x, y, 54);
    grd.addColorStop(0, 'rgba(255,238,176,' + (0.5 + prog * 0.34) + ')');
    grd.addColorStop(1, 'rgba(255,238,176,0)');
    g.fillStyle = grd; g.fillRect(x - 54, y - 54, 108, 108);
    g.fillStyle = lc([255, 206, 138], [255, 246, 206], prog);
    g.beginPath(); g.arc(x, y, 13, 0, 6.29); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.beginPath(); g.arc(x - 3.5, y - 3.5, 5, 0, 6.29); g.fill();
    g.restore();
  }
  function hillLayer(g, camx, factor, baseY, color, r, rim) {
    var span = r * 1.4;
    var off = -((((camx * factor) % span) + span) % span);
    var x;
    g.fillStyle = color;
    for (x = off - span; x < 340; x += span) {
      g.beginPath(); g.arc(x + r * 0.7, baseY, r, Math.PI, 0); g.fill();
    }
    g.fillRect(0, baseY - 1, 320, 200);
    if (rim) {
      g.strokeStyle = rim; g.lineWidth = 2;
      for (x = off - span; x < 340; x += span) {
        g.beginPath(); g.arc(x + r * 0.7, baseY, r, Math.PI, 0); g.stroke();
      }
    }
  }
  // Day 1 'galactic' backdrop: deep space, nebulae, lots of stars. No
  // planet anymore - Mark's note: "love the parallax, get rid of that
  // planet". The "let there be light" radial burst stays central.
  function drawSkyGalactic(g, camx, camy, t) {
    var grd = g.createLinearGradient(0, 0, 0, 180);
    grd.addColorStop(0, '#02020c'); grd.addColorStop(1, '#0a0820');
    g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
    // two nebula clouds (parallax)
    function nebula(cx, cy, r, col) {
      var rg = g.createRadialGradient(cx, cy, 4, cx, cy, r);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    nebula(80 - camx * 0.07, 50, 70, 'rgba(180,80,200,0.35)');
    nebula(240 - camx * 0.04, 95, 80, 'rgba(80,150,220,0.30)');
    nebula(150 - camx * 0.05, 130, 60, 'rgba(220,90,180,0.22)');
    // base starfield
    drawStarfield(g, t);
    // brighter stars with twinkle + slow parallax
    for (var i = 0; i < 45; i++) {
      var sx = ((((i * 73) % 320) - camx * 0.45) % 320 + 320) % 320;
      var sy = ((i * 41) % 150);
      var tw = 0.5 + 0.5 * Math.sin(t * 0.04 + i * 1.7);
      g.fillStyle = 'rgba(255,255,255,' + (0.55 + tw * 0.45) + ')';
      var sz = i % 6 === 0 ? 2 : 1;
      g.fillRect(sx | 0, sy | 0, sz, sz);
    }
    // periodic shooting star
    var stT = (t * 0.6) % 320;
    if (stT < 50) {
      var ssx = -30 + stT * 6, ssy = 24 + stT * 1.4;
      g.strokeStyle = 'rgba(255,250,210,0.85)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(ssx, ssy); g.lineTo(ssx - 22, ssy - 6); g.stroke();
    }
    // "let there be light" back-wall burst - large soft radial pulsing white core
    var pulse = 0.7 + Math.sin(t * 0.03) * 0.3;
    var bX = 160, bY = 100;
    var burst = g.createRadialGradient(bX, bY, 4, bX, bY, 130);
    burst.addColorStop(0, 'rgba(255,255,255,' + (0.55 * pulse) + ')');
    burst.addColorStop(0.18, 'rgba(190,240,255,' + (0.35 * pulse) + ')');
    burst.addColorStop(0.5, 'rgba(110,170,230,' + (0.18 * pulse) + ')');
    burst.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = burst;
    g.fillRect(bX - 130, bY - 130, 260, 260);
  }

  function drawSky(g, camx, camy, prog, t) {
    var grd = g.createLinearGradient(0, 0, 0, 180);
    grd.addColorStop(0, lc([38, 30, 80], [92, 166, 248], prog));
    grd.addColorStop(0.5, lc([88, 62, 122], [146, 204, 250], prog));
    grd.addColorStop(1, lc([196, 142, 156], [226, 244, 255], prog));
    g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
    if (prog < 0.6) { g.globalAlpha = (0.6 - prog) * 1.7; drawStarfield(g, t); g.globalAlpha = 1; }
    drawSun(g, 46 + prog * 212, 150 - prog * 112, prog);
    var span = 1480, i, c, cx;
    for (i = 0; i < CLOUDS.length; i++) {
      c = CLOUDS[i];
      cx = (((c.x - camx * 0.14 - t * 0.05) % span) + span) % span - 80;
      drawCloud(g, cx, c.y + camy * 0.04, c.s, 0.42 + prog * 0.46);
    }
    hillLayer(g, camx, 0.12, 152 - camy * 0.1, lc([56, 54, 100], [110, 142, 172], prog), 62, null);
    hillLayer(g, camx, 0.27, 176 - camy * 0.15, lc([64, 62, 110], [96, 154, 96], prog), 56,
      lc([88, 86, 138], [142, 202, 122], prog));
    hillLayer(g, camx, 0.48, 197 - camy * 0.22, lc([52, 50, 90], [74, 134, 70], prog), 66,
      lc([78, 76, 122], [120, 184, 98], prog));
  }

  // ---- per-day signature sky drawers ----
  function vGradient(g, c1, c2, c3) {
    var grd = g.createLinearGradient(0, 0, 0, 180);
    grd.addColorStop(0, c1);
    if (c3) { grd.addColorStop(0.55, c2); grd.addColorStop(1, c3); }
    else { grd.addColorStop(1, c2); }
    g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
  }
  function simpleSun(g, x, y, r, color, rays) {
    g.save();
    var grd = g.createRadialGradient(x, y, 2, x, y, r * 3);
    grd.addColorStop(0, 'rgba(255,235,160,0.55)'); grd.addColorStop(1, 'rgba(255,235,160,0)');
    g.fillStyle = grd; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, 6.28); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, 6.28); g.fill();
    if (rays) {
      g.strokeStyle = 'rgba(255,235,160,0.55)'; g.lineWidth = 1.5;
      for (var k = 0; k < 8; k++) {
        var a = k * 0.785;
        g.beginPath();
        g.moveTo(x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * 1.4);
        g.lineTo(x + Math.cos(a) * r * 2.2, y + Math.sin(a) * r * 2.2);
        g.stroke();
      }
    }
    g.restore();
  }
  function driftClouds(g, camx, camy, alpha) {
    var span = 1480;
    for (var i = 0; i < CLOUDS.length; i++) {
      var c = CLOUDS[i];
      var cx = (((c.x - camx * 0.14) % span) + span) % span - 80;
      // Pick a variant from the cloud's index so each cloud has a
      // stable shape but the sky shows all three (puffy/wispy/layered).
      drawCloud(g, cx, c.y + camy * 0.04, c.s, alpha, i % 3);
    }
  }
  function jaggedRow(g, camx, factor, baseY, color, peakH) {
    g.fillStyle = color;
    var span = 140;
    var off = -(((camx * factor) % span) + span) % span;
    for (var x = off - span; x < 340; x += span) {
      g.beginPath();
      g.moveTo(x, baseY);
      for (var i = 0; i <= 6; i++) {
        var pX = x + (i / 6) * span;
        var pY = baseY - (Math.sin(i * 1.7) + 1) * peakH * 0.4 - peakH * 0.3;
        g.lineTo(pX, pY);
      }
      g.lineTo(x + span, baseY);
      g.fill();
    }
  }
  function treeRow(g, camx, factor, baseY, color) {
    g.fillStyle = color;
    var span = 50;
    var off = -(((camx * factor) % span) + span) % span;
    for (var x = off - span; x < 340; x += span) {
      g.fillRect(x + 22, baseY - 18, 4, 18);
      g.beginPath(); g.arc(x + 24, baseY - 26, 14, 0, 6.28); g.fill();
      g.beginPath(); g.arc(x + 16, baseY - 22, 10, 0, 6.28); g.fill();
      g.beginPath(); g.arc(x + 32, baseY - 22, 10, 0, 6.28); g.fill();
    }
  }

  function drawSky_sky(g, camx, camy, prog, t) {
    vGradient(g, '#7fc4ff', '#e0f0ff');
    simpleSun(g, 260, 40, 16, '#ffefa0', false);
    driftClouds(g, camx, camy, 0.85);
    hillLayer(g, camx, 0.2, 170 - camy * 0.1, '#9fd0ff', 50, '#c8e4ff');
  }
  function drawSky_sea_surface(g, camx, camy, prog, t) {
    // 4-layer parallax ocean per Mark's Day 2-2 request: sky gradient
    // -> distant island chain -> mid island silhouettes -> far waves
    // -> near foam line. Matches the 1-1 background's depth feel.
    vGradient(g, '#7ec0f0', '#3a86d6', '#d8c490');
    driftClouds(g, camx, camy, 0.6);
    // Far island chain (low parallax)
    g.fillStyle = '#6a8a9e';
    var span1 = 100;
    var off1 = -(((camx * 0.10) % span1) + span1) % span1;
    for (var x = off1 - span1; x < 360; x += span1) {
      g.beginPath();
      g.moveTo(x + 10, 112); g.quadraticCurveTo(x + 25, 100, x + 40, 112);
      g.lineTo(x + 60, 112); g.quadraticCurveTo(x + 75, 104, x + 90, 112);
      g.closePath(); g.fill();
    }
    // Mid island silhouettes (more contrast, slightly lower + closer)
    g.fillStyle = '#3e5e74';
    var span2 = 80;
    var off2 = -(((camx * 0.22) % span2) + span2) % span2;
    for (var x2 = off2 - span2; x2 < 360; x2 += span2) {
      g.beginPath();
      g.moveTo(x2 + 18, 122); g.quadraticCurveTo(x2 + 30, 110, x2 + 44, 118);
      g.quadraticCurveTo(x2 + 56, 112, x2 + 68, 122);
      g.closePath(); g.fill();
    }
    // Far wave streaks (the old dotted lines done as cleaner foam)
    g.fillStyle = 'rgba(255,255,255,0.30)';
    for (var i = 0; i < 320; i += 18) {
      var wx = ((i + (t * 0.4) % 18) | 0);
      g.fillRect(wx, 128, 4, 1);
      g.fillRect(wx + 9, 134, 3, 1);
    }
    // Near foam line just below the horizon
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (var k = 0; k < 320; k += 6) {
      var fy2 = 142 + Math.sin(t * 0.08 + k * 0.07) * 0.8;
      g.fillRect(k, fy2 | 0, 3, 1);
    }
    // Sparse fish silhouettes near the horizon
    for (var f = 0; f < 4; f++) {
      var fx = ((f * 80 + t * 0.3) % 320);
      var fy = 132 + Math.sin(t * 0.1 + f) * 2;
      g.fillStyle = '#1a5080';
      g.fillRect(fx | 0, fy | 0, 3, 2);
    }
  }
  function drawSky_rocky(g, camx, camy, prog, t) {
    vGradient(g, '#d68a55', '#f5cd92');
    simpleSun(g, 220, 40, 18, '#ffe0a8', false);
    jaggedRow(g, camx, 0.12, 138, '#7a3e20', 70);
    jaggedRow(g, camx, 0.22, 165, '#4a2a16', 50);
    for (var i = 0; i < 18; i++) {
      var dx = (((i * 47) - camx * 0.3 + t * 0.5) % 320 + 320) % 320;
      var dy = 100 + ((i * 17) % 70);
      g.fillStyle = 'rgba(255,200,140,0.35)';
      g.fillRect(dx | 0, dy | 0, 1, 1);
    }
  }
  // Pine-tree row (taller, pointy silhouettes - for layered forest depth).
  function pineRow(g, camx, factor, baseY, color, scale) {
    scale = scale || 1;
    g.fillStyle = color;
    var span = Math.floor(38 * scale);
    var off = -(((camx * factor) % span) + span) % span;
    var trunkH = Math.floor(20 * scale), coneH = Math.floor(28 * scale), coneW = Math.floor(18 * scale);
    for (var x = off - span; x < 340; x += span) {
      var cx = x + Math.floor(span / 2);
      // trunk
      g.fillRect(cx - 2, baseY - trunkH, 4, trunkH);
      // three-layer pine cone
      g.beginPath();
      g.moveTo(cx - coneW / 2, baseY - trunkH);
      g.lineTo(cx + coneW / 2, baseY - trunkH);
      g.lineTo(cx, baseY - trunkH - coneH);
      g.fill();
      g.beginPath();
      g.moveTo(cx - coneW * 0.35, baseY - trunkH - coneH * 0.4);
      g.lineTo(cx + coneW * 0.35, baseY - trunkH - coneH * 0.4);
      g.lineTo(cx, baseY - trunkH - coneH * 1.3);
      g.fill();
      g.beginPath();
      g.moveTo(cx - coneW * 0.22, baseY - trunkH - coneH * 0.8);
      g.lineTo(cx + coneW * 0.22, baseY - trunkH - coneH * 0.8);
      g.lineTo(cx, baseY - trunkH - coneH * 1.55);
      g.fill();
    }
  }
  // Soft mountain ridge silhouette - rounded triangles.
  function mountainRidge(g, camx, factor, baseY, color, peakH) {
    g.fillStyle = color;
    var span = 110;
    var off = -(((camx * factor) % span) + span) % span;
    for (var x = off - span * 2; x < 340 + span; x += span) {
      g.beginPath();
      g.moveTo(x, baseY);
      g.bezierCurveTo(x + span * 0.25, baseY - peakH * 0.7,
                      x + span * 0.5, baseY - peakH,
                      x + span * 0.75, baseY - peakH * 0.65);
      g.lineTo(x + span, baseY);
      g.fill();
    }
  }
  // Palm-tree row - curved trunk, splayed fronds at top.
  function palmRow(g, camx, factor, baseY, trunkColor, frondColor, scale, span) {
    scale = scale || 1; span = span || 56;
    var off = -(((camx * factor) % span) + span) % span;
    var trunkH = Math.floor(46 * scale);
    for (var x = off - span; x < 340 + span; x += span) {
      var cx = x + Math.floor(span / 2);
      // Curved trunk - 3 segments leaning slightly
      g.fillStyle = trunkColor;
      for (var s = 0; s < trunkH; s += 2) {
        var bend = Math.sin(s * 0.07) * 2;
        g.fillRect(cx + Math.round(bend) - 1, baseY - trunkH + s, 2, 2);
      }
      var topX = cx + Math.round(Math.sin((trunkH) * 0.07) * 2);
      var topY = baseY - trunkH;
      // Fronds: 7 curved strokes splayed around the trunk top
      g.fillStyle = frondColor;
      var fronds = [
        [-14, 4], [-10, -6], [-4, -10], [4, -10], [10, -6], [14, 4], [0, -12]
      ];
      for (var f = 0; f < fronds.length; f++) {
        var dx = fronds[f][0], dy = fronds[f][1];
        // draw fan-shaped frond using a few short lines
        for (var step = 0; step <= 8; step++) {
          var fx = topX + Math.round(dx * step / 8);
          var fy = topY + Math.round(dy * step / 8 + step * 0.6);
          g.fillRect(fx - 1, fy, 2, 1);
        }
      }
      // Coconut cluster (small dark dots near trunk top)
      g.fillStyle = '#3a2810';
      g.fillRect(topX - 2, topY + 2, 1, 1);
      g.fillRect(topX + 1, topY + 2, 1, 1);
    }
  }

  // Tropical birds - small parrot silhouettes that flap and drift.
  function tropicalBirds(g, camx, t) {
    // 4 birds at staggered heights, flapping with sin wave
    var positions = [
      { x: 40, y: 38, c: '#e84a30' },     // red
      { x: 140, y: 60, c: '#f0c020' },    // yellow
      { x: 200, y: 28, c: '#30b0e8' },    // blue
      { x: 270, y: 72, c: '#e84a30' }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      // Slow horizontal drift (loop wraparound)
      var bx = ((p.x + Math.floor(t * (0.4 + i * 0.1))) % 380 + 380) % 380 - 30;
      var bob = Math.sin(t * 0.08 + i) * 3;
      var by = p.y + bob;
      var flap = Math.floor(t / 6 + i) % 2;
      // Body
      g.fillStyle = p.c;
      g.fillRect(bx | 0, by | 0, 4, 2);
      // Wings (flap up/down)
      if (flap) {
        g.fillRect((bx | 0) + 1, (by | 0) - 1, 2, 1);
        g.fillRect((bx | 0) + 1, (by | 0) + 2, 2, 1);
      } else {
        g.fillRect((bx | 0) + 1, (by | 0) - 2, 2, 1);
        g.fillRect((bx | 0) + 1, (by | 0) + 3, 2, 1);
      }
      // Beak hint
      g.fillStyle = '#202020';
      g.fillRect((bx | 0) + 4, (by | 0), 1, 1);
    }
  }

  function drawSky_forest(g, camx, camy, prog, t) {
    // Deep tropical jungle (Pass 9 re-skin per Mark: "more jungle-esque,
    // palms and tall canopy and tropical birds"). Hazy turquoise sky,
    // distant blue-green mountains, sun shafts through humid air, two
    // rows of palms at different parallax depths, dangling vines, and
    // tropical birds drifting across.
    vGradient(g, '#5a9888', '#b6dcc0');                  // hazy turquoise-green
    // Far mountains (jungle-shrouded blue)
    mountainRidge(g, camx, 0.06, 168, '#4a6c66', 90);
    mountainRidge(g, camx, 0.11, 172, '#365048', 70);
    // Atmospheric mist band
    g.fillStyle = 'rgba(220,255,220,0.20)';
    g.fillRect(0, 86, 320, 28);
    // Diagonal sun shafts (humid, warm)
    for (var s = 0; s < 5; s++) {
      var sx = 40 + s * 70 + Math.sin(t * 0.012 + s) * 8 - (camx * 0.3) % 320;
      sx = ((sx % 380) + 380) % 380 - 30;
      g.fillStyle = 'rgba(255,250,200,0.10)';
      g.beginPath();
      g.moveTo(sx, 0); g.lineTo(sx + 26, 0);
      g.lineTo(sx + 40, 180); g.lineTo(sx - 14, 180);
      g.closePath(); g.fill();
    }
    // Mid palms (slim, distant)
    palmRow(g, camx, 0.22, 168, '#3a6448', '#2f7e3a', 0.85, 64);
    // Tropical birds drift between mid and near palm layers
    tropicalBirds(g, camx, t);
    // Near palms (chunky, dark)
    palmRow(g, camx, 0.46, 178, '#1f3220', '#143818', 1.1, 50);
    // Hanging-vine strands drifting in the near canopy
    for (var v = 0; v < 9; v++) {
      var vx = ((30 + v * 42 - (camx * 0.5)) % 380 + 380) % 380 - 20;
      g.fillStyle = 'rgba(15,52,18,0.55)';
      g.fillRect(vx | 0, 0, 1, 50 + (v % 3) * 16);
      // small leaves on some
      if (v % 2 === 0) {
        g.fillStyle = 'rgba(20,72,28,0.6)';
        g.fillRect((vx | 0) - 1, 18, 3, 2);
        g.fillRect((vx | 0) - 1, 38, 3, 2);
      }
    }
    // Dark undergrowth at the bottom
    g.fillStyle = '#0e2810';
    g.fillRect(0, 175, 320, 5);

    // Green leaf canopy hanging from the TOP of the canvas (Mark
    // Pass 9: "3-2 should have a green leaf canopy up top"). Reads
    // as the jungle ceiling visible above where the player is. Two
    // depth layers so it feels solid + has parallax movement.
    // Back-layer canopy (lighter green, slower parallax)
    g.fillStyle = '#2a5a28';
    var bSpan = 26;
    var bOff = -(((camx * 0.12) % bSpan) + bSpan) % bSpan;
    for (var bk = bOff - bSpan; bk < 360 + bSpan; bk += bSpan) {
      // scalloped lobes hanging down
      g.beginPath();
      g.ellipse(bk + 13, 0, 14, 11, 0, 0, 6.28);
      g.fill();
    }
    // Front-layer canopy (darker, denser, faster parallax)
    g.fillStyle = '#143818';
    var fSpan = 22;
    var fOff = -(((camx * 0.32) % fSpan) + fSpan) % fSpan;
    for (var fr = fOff - fSpan; fr < 360 + fSpan; fr += fSpan) {
      g.beginPath();
      g.ellipse(fr + 11, 0, 12, 9, 0, 0, 6.28);
      g.fill();
      // Tiny leaf accents dangling
      g.fillStyle = '#2f6e35';
      g.fillRect(fr + 6, 9 + (fr % 3), 2, 2);
      g.fillRect(fr + 16, 11 + (fr % 4), 2, 2);
      g.fillStyle = '#143818';
    }
    // Flat band at the very top so the canopy reads as ceiling
    g.fillStyle = '#143818';
    g.fillRect(0, 0, 320, 4);
  }
  function drawSky_sunlit(g, camx, camy, prog, t) {
    vGradient(g, '#ffcc60', '#fff0a0');
    simpleSun(g, 160 - camx * 0.05, 60, 28, '#fff8c8', true);
    driftClouds(g, camx, camy, 0.5);
  }
  function drawSky_cosmic_night(g, camx, camy, prog, t) {
    vGradient(g, '#080620', '#1a1840');
    drawStarfield(g, t);
    var mX = 240 - camx * 0.06, mY = 50;
    var ph = g.createRadialGradient(mX, mY, 3, mX, mY, 38);
    ph.addColorStop(0, 'rgba(220,230,255,0.45)'); ph.addColorStop(1, 'rgba(220,230,255,0)');
    g.fillStyle = ph; g.fillRect(mX - 38, mY - 38, 76, 76);
    g.fillStyle = '#dde2f0'; g.beginPath(); g.arc(mX, mY, 16, 0, 6.28); g.fill();
    g.fillStyle = '#b9c0d6'; g.beginPath(); g.arc(mX + 3, mY + 3, 13, 0, 6.28); g.fill();
    g.strokeStyle = 'rgba(220,230,255,0.45)'; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(50, 30); g.lineTo(80, 50); g.lineTo(110, 35); g.lineTo(130, 60);
    g.stroke();
  }
  // Open skies (Day 5-1 Flappy). Multi-layer cloud parallax (the
  // existing puff variants give 3 cloud shapes) + distant twister
  // silhouettes drifting left-to-right in the back. Background-only
  // twisters here; the actual Twister enemy entity lives in
  // entities.js + level_5_1.js.
  function drawSky_bird_sky(g, camx, camy, prog, t) {
    // Mark Pass 5-1 overhaul: "give the jungle treatment to the day
    // 5-1 background, it's just so stale." More layers, more
    // motion, a sun, beefier birds + tornadoes.
    vGradient(g, '#5fa8d8', '#a8d8f0', '#dcefff');

    // ---- SUN: warm glowing disc upper-right, fixed in sky (very
    // slight parallax so it tracks the world without being glued
    // to the camera). Two-pass: outer halo + bright disc.
    var sx = 250 - camx * 0.02;
    sx = ((sx % 360) + 360) % 360 - 30;
    var sy = 30;
    var sunGrd = g.createRadialGradient(sx, sy, 4, sx, sy, 38);
    sunGrd.addColorStop(0,   'rgba(255,250,210,0.75)');
    sunGrd.addColorStop(0.4, 'rgba(255,232,140,0.30)');
    sunGrd.addColorStop(1,   'rgba(255,232,140,0)');
    g.fillStyle = sunGrd;
    g.fillRect(sx - 38, sy - 38, 76, 76);
    g.fillStyle = '#fff4c8';
    g.beginPath(); g.arc(sx, sy, 12, 0, 6.28); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(sx, sy, 7, 0, 6.28); g.fill();

    // ---- BACK LAYER: very slow huge cumulus, low alpha so they
    // read as deep background. 4 big puffballs spaced wide.
    g.save();
    g.globalAlpha = 0.55;
    for (var bc = 0; bc < 4; bc++) {
      var bcx = ((bc * 130 - camx * 0.04) % 480 + 480) % 480 - 60;
      var bcy = 28 + (bc * 13) % 30;
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(bcx,      bcy,        13, 0, 6.28);
      g.arc(bcx + 14, bcy - 4,    16, 0, 6.28);
      g.arc(bcx + 28, bcy,        13, 0, 6.28);
      g.arc(bcx + 18, bcy + 6,    11, 0, 6.28);
      g.fill();
    }
    g.restore();

    // ---- HIGH WISPY CIRRUS: thin streaks scrolling slowly.
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (var w = 0; w < 6; w++) {
      var wx = ((w * 70 - camx * 0.04) % 380 + 380) % 380 - 30;
      var wy = 22 + (w * 11) % 32;
      g.fillRect(wx | 0, wy | 0, 20, 1);
      g.fillRect((wx | 0) + 4, wy + 1, 14, 1);
    }

    // ---- MID-FAR puffy clouds (existing layer, slightly denser).
    g.save();
    g.globalAlpha = 0.7;
    for (var fc = 0; fc < 8; fc++) {
      var fcx = ((fc * 90 - camx * 0.08) % 420 + 420) % 420 - 50;
      var fcy = 36 + (fc * 19) % 50;
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(fcx,      fcy,        6, 0, 6.28);
      g.arc(fcx + 7,  fcy - 2,    7, 0, 6.28);
      g.arc(fcx + 14, fcy,        6, 0, 6.28);
      g.arc(fcx + 8,  fcy + 3,    5, 0, 6.28);
      g.fill();
    }
    g.restore();

    // ---- MID layer (existing variety - puffy / wispy / layered)
    driftClouds(g, camx, camy, 0.85);

    // ---- DISTANT BIRDS: V-formation flocks (lead bird + two pairs
    // trailing) plus a couple of solo wanderers. Each flock at a
    // different parallax depth so the sky reads in three planes.
    g.strokeStyle = 'rgba(38,72,106,0.6)'; g.lineWidth = 1;
    function chev(bx, by, sz) {
      g.beginPath();
      g.moveTo(bx - sz, by + sz * 0.7);
      g.lineTo(bx, by);
      g.lineTo(bx + sz, by + sz * 0.7);
      g.stroke();
    }
    // Three V-formations at different speeds + sizes
    var flocks = [
      { sp: 0.22, par: 0.14, base: 0,  by: 36, sz: 3 },
      { sp: 0.16, par: 0.10, base: 90, by: 48, sz: 4 },
      { sp: 0.30, par: 0.20, base: 30, by: 28, sz: 2 }
    ];
    for (var fl = 0; fl < flocks.length; fl++) {
      var f0 = flocks[fl];
      var lx = ((f0.base + t * f0.sp - camx * f0.par) % 360 + 360) % 360 - 20;
      var ly = f0.by + Math.sin(t * 0.02 + fl) * 1.5;
      chev(lx, ly, f0.sz);
      chev(lx - 6, ly + 2, f0.sz);
      chev(lx + 6, ly + 2, f0.sz);
      chev(lx - 12, ly + 4, f0.sz);
      chev(lx + 12, ly + 4, f0.sz);
    }
    // Two solo birds wandering
    for (var bi = 0; bi < 2; bi++) {
      var bx = ((bi * 153 + t * 0.18 - camx * 0.12) % 360 + 360) % 360 - 20;
      var by = 60 + bi * 20 + Math.sin(t * 0.03 + bi * 2) * 2;
      chev(bx, by, 3);
    }

    // ---- TORNADOES (decorative back-sky) - polished: spiral arc
    // strokes, swirling debris specks, slightly darker hue.
    for (var ti = 0; ti < 3; ti++) {
      var twX = ((ti * 130 + t * 0.15 - camx * 0.18) % 420 + 420) % 420 - 60;
      var twY = 65 + ti * 14;
      var sway = Math.sin(t * 0.04 + ti) * 2;
      // Body cone
      g.fillStyle = 'rgba(60,80,110,0.62)';
      g.beginPath();
      g.moveTo(twX - 9 + sway,     twY);
      g.lineTo(twX + 9 + sway,     twY);
      g.lineTo(twX + 4 + sway/2,   twY + 16);
      g.lineTo(twX + 2,            twY + 24);
      g.lineTo(twX + 1,            twY + 24);
      g.lineTo(twX - 2 + sway/2,   twY + 16);
      g.closePath(); g.fill();
      // Spiral arc strokes - three curving bands wrapping the cone
      g.strokeStyle = 'rgba(38,52,80,0.78)';
      g.lineWidth = 1;
      for (var sp = 0; sp < 3; sp++) {
        var spY = twY + 3 + sp * 5;
        var spW = 7 - sp * 2;
        var spOff = Math.sin(t * 0.12 + ti + sp * 1.3) * 1.5;
        g.beginPath();
        g.moveTo(twX - spW + sway + spOff, spY);
        g.quadraticCurveTo(twX + sway + spOff, spY + 2, twX + spW + sway + spOff, spY);
        g.stroke();
      }
      // Debris specks orbiting (small dark pixels at varying radii)
      g.fillStyle = 'rgba(40,28,18,0.7)';
      for (var dp = 0; dp < 5; dp++) {
        var dpAng = (t * 0.18 + dp * 1.25 + ti * 0.7);
        var dpR = 6 + (dp % 2) * 3;
        var dpx = twX + sway + Math.cos(dpAng) * dpR;
        var dpy = twY + 8 + dp * 2 + Math.sin(dpAng) * 1.5;
        g.fillRect(dpx | 0, dpy | 0, 1, 1);
      }
      // Bright top crest (rip in the sky where the funnel meets the cloud)
      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.fillRect((twX - 8 + sway) | 0, twY - 1, 16, 1);
    }

    // ---- STORM SECTION (Mark optional): dims the sky between
    // prog 0.42 - 0.62 so the kid flies into a brief overcast band
    // before breaking back into clear weather. Storm strength
    // ramps in/out so it doesn't pop. Five large dark cloud
    // silhouettes layer over the existing sky during the band,
    // and occasional lightning flashes pulse the whole screen
    // brighter for ~3 frames.
    if (prog > 0.42 && prog < 0.62) {
      var stormBand = (prog - 0.42) / 0.20;            // 0..1 through band
      var stormStrength = Math.sin(stormBand * Math.PI);  // 0 -> 1 -> 0
      g.save();
      // Dim overlay (cool blue-gray)
      g.fillStyle = 'rgba(28, 38, 70, ' + (stormStrength * 0.45).toFixed(2) + ')';
      g.fillRect(0, 0, 320, 180);
      // Dark storm clouds rolling across mid-sky
      g.globalAlpha = stormStrength * 0.85;
      for (var sc = 0; sc < 5; sc++) {
        var scX = ((sc * 80 - camx * 0.18 + t * 0.25) % 420 + 420) % 420 - 60;
        var scY = 24 + (sc * 13) % 36;
        g.fillStyle = '#3a4660';
        g.beginPath();
        g.arc(scX,       scY,      11, 0, 6.28);
        g.arc(scX + 13,  scY - 3,  14, 0, 6.28);
        g.arc(scX + 26,  scY,      11, 0, 6.28);
        g.arc(scX + 16,  scY + 5,  10, 0, 6.28);
        g.fill();
        // Darker shadow under each cloud
        g.fillStyle = '#1f2840';
        g.fillRect(scX | 0, (scY + 6) | 0, 28, 1);
      }
      // Lightning: at peak storm intensity, fire a 3-frame flash
      // every ~95 frames. Bright white wash; brief enough that the
      // kid notices but doesn't get blinded.
      if (stormStrength > 0.4 && (t % 95) < 3) {
        g.globalAlpha = 0.7;
        g.fillStyle = '#fff8d0';
        g.fillRect(0, 0, 320, 180);
        // Jagged bolt streaking down from the cloud band
        g.globalAlpha = 0.95;
        g.fillStyle = '#fffbe0';
        var blx = 80 + (t * 13) % 180;
        var bly = 30;
        for (var bs = 0; bs < 7; bs++) {
          var bjit = ((t + bs * 7) % 5) - 2;
          g.fillRect(blx + bjit, bly + bs * 6, 2, 5);
        }
      }
      g.restore();
    }
  }
  // Underwater (Day 5-2). Multi-layer reef parallax per Mark's pass-9
  // brief: distant coral mountain silhouettes -> mid coral spires ->
  // drifting big-fish silhouettes -> near coral fronds + bubbles
  // streaming up -> light shafts from the surface. Sand seabed at the
  // bottom. Tinted slightly green so it reads as deep ocean.
  function drawSky_seaside(g, camx, camy, prog, t) {
    // Depth gradient - lighter top (sunlit surface) to deep navy
    vGradient(g, '#48b6dc', '#0a2a4e');
    // Sunbeams from surface - stronger than before (was barely visible
    // at alpha 0.07). Mix wider + narrower beams for variety.
    var beams = [
      { x:  20, w: 22, a: 0.18 },
      { x:  60, w: 14, a: 0.13 },
      { x: 105, w: 28, a: 0.22 },
      { x: 150, w: 16, a: 0.14 },
      { x: 190, w: 24, a: 0.20 },
      { x: 230, w: 14, a: 0.13 },
      { x: 270, w: 22, a: 0.18 }
    ];
    for (var s = 0; s < beams.length; s++) {
      var bm = beams[s];
      var sx = bm.x + Math.sin(t * 0.012 + s * 0.6) * 6;
      sx = (((sx - camx * 0.25) % 380) + 380) % 380 - 30;
      g.fillStyle = 'rgba(190,235,255,' + bm.a + ')';
      g.beginPath();
      g.moveTo(sx, 0); g.lineTo(sx + bm.w, 0);
      g.lineTo(sx + bm.w + 12, 180); g.lineTo(sx - 10, 180);
      g.closePath(); g.fill();
    }
    // ----- DEEP BACK: drifting manta ray silhouette -----
    // One huge silhouette slowly drifting through the deep parallax.
    var mantaX = ((t * 0.18 - camx * 0.04) % 480 + 480) % 480 - 80;
    var mantaY = 70 + Math.sin(t * 0.02) * 6;
    g.fillStyle = '#0c2848';
    // Triangular body
    g.beginPath();
    g.moveTo(mantaX,        mantaY);
    g.lineTo(mantaX + 40,   mantaY - 8);
    g.lineTo(mantaX + 60,   mantaY);
    g.lineTo(mantaX + 40,   mantaY + 8);
    g.closePath(); g.fill();
    // Long thin tail
    g.fillRect(mantaX + 60 | 0, mantaY | 0, 20, 1);
    // Wing tip highlights
    g.fillStyle = '#163660';
    g.fillRect(mantaX + 8 | 0,  mantaY - 4, 24, 2);
    g.fillRect(mantaX + 32 | 0, mantaY + 3, 18, 1);

    // Far coral mountain ridge silhouette
    mountainRidge(g, camx, 0.06, 160, '#1a4a6e', 70);
    // Mid coral mountain (taller, more saturated)
    mountainRidge(g, camx, 0.12, 168, '#2a6088', 50);

    // ----- FISH SCHOOLS in mid-parallax -----
    // Two small schools of ~7 fish drifting in unison, with subtle
    // body-bob within the school for life. The school as a whole
    // follows a slow horizontal drift.
    function drawSchool(baseX, baseY, dir, phase, color) {
      g.fillStyle = color;
      var schoolX = ((baseX + t * 0.5 * dir - camx * 0.16) % 420 + 420) % 420 - 60;
      var schoolY = baseY + Math.sin(t * 0.04 + phase) * 3;
      // Lay out fish in a loose diamond
      var offsets = [
        [0, 0], [9, -2], [9, 2], [18, 0], [18, -4], [18, 4], [27, 0]
      ];
      for (var fi = 0; fi < offsets.length; fi++) {
        var fx = schoolX + offsets[fi][0] + Math.sin(t * 0.1 + fi) * 0.8;
        var fy = schoolY + offsets[fi][1];
        // Tiny fish - body 4x2 + tail wedge
        g.fillRect(fx | 0, fy | 0, 4, 2);
        var tailX = dir > 0 ? (fx | 0) - 2 : (fx | 0) + 4;
        g.fillRect(tailX, fy | 0, 2, 1);
        g.fillRect(tailX, (fy | 0) + 1, 2, 1);
      }
    }
    drawSchool(80,  100, 1,  0,   '#7accee');
    drawSchool(220,  60, -1, 1.5, '#88ddef');

    // ----- 4 large lone fish silhouettes (kept from before) -----
    g.fillStyle = '#1a4070';
    var fish = [[60, 130, 1], [180, 145, -1], [240, 125, 1]];
    for (var fi = 0; fi < fish.length; fi++) {
      var fx = ((fish[fi][0] + t * 0.3 * fish[fi][2] - camx * 0.08) % 380 + 380) % 380 - 30;
      var fy = fish[fi][1] + Math.sin(t * 0.04 + fi) * 2;
      g.beginPath();
      g.ellipse(fx, fy, 7, 3, 0, 0, 6.28); g.fill();
      g.beginPath();
      var tailX = fish[fi][2] > 0 ? fx - 7 : fx + 7;
      var tailSign = fish[fi][2] > 0 ? -1 : 1;
      g.moveTo(tailX, fy);
      g.lineTo(tailX + tailSign * 5, fy - 3);
      g.lineTo(tailX + tailSign * 5, fy + 3);
      g.closePath(); g.fill();
    }

    // Mid coral spires - tall, slightly pink
    var midSpan = 80;
    var midOff = -(((camx * 0.22) % midSpan) + midSpan) % midSpan;
    for (var x = midOff - midSpan; x < 360; x += midSpan) {
      g.fillStyle = '#8a4068';
      g.beginPath();
      g.moveTo(x + 10, 178);
      g.lineTo(x + 14, 145); g.lineTo(x + 20, 158); g.lineTo(x + 26, 138);
      g.lineTo(x + 32, 152); g.lineTo(x + 38, 178);
      g.fill();
      g.fillStyle = '#c068a0';
      g.fillRect(x + 13, 148, 2, 6);
      g.fillRect(x + 25, 142, 2, 4);
    }

    // Near coral fronds - vibrant orange/yellow, larger parallax
    var nearSpan = 60;
    var nearOff = -(((camx * 0.45) % nearSpan) + nearSpan) % nearSpan;
    for (var nx = nearOff - nearSpan; nx < 360; nx += nearSpan) {
      g.fillStyle = '#ff8030';
      for (var b = 0; b < 4; b++) {
        var bx = nx + 6 + b * 11 + Math.sin(t * 0.05 + b) * 1;
        var bh = 14 + (b * 5) % 12;
        g.fillRect(bx | 0, 178 - bh, 3, bh);
        g.fillRect((bx | 0) + 1, 178 - bh - 2, 1, 2);
      }
      g.fillStyle = '#ffd048';
      g.fillRect(nx + 6, 174, 1, 1); g.fillRect(nx + 28, 172, 1, 1);
    }

    // ----- FOREGROUND swaying seaweed (closest parallax) -----
    // Tall thin strands that sway side-to-side with sin(t). They sit
    // semi-transparent so the player isn't visually blocked.
    var swSpan = 38;
    var swOff = -(((camx * 0.7) % swSpan) + swSpan) % swSpan;
    for (var swX = swOff - swSpan; swX < 360; swX += swSpan) {
      var swH = 50 + (((swX | 0) * 7) % 24);
      var baseX = swX + 4;
      g.fillStyle = 'rgba(40,120,72,0.55)';
      // Build the strand as segments that sway more the higher up they are
      for (var k = 0; k < swH; k += 3) {
        var bend = Math.sin(t * 0.06 + swX * 0.05 + k * 0.04) * (k * 0.06);
        g.fillRect((baseX + bend) | 0, 178 - k, 2, 3);
      }
      // Lighter accent strand alongside
      g.fillStyle = 'rgba(80,170,110,0.45)';
      for (var k2 = 0; k2 < swH - 6; k2 += 3) {
        var bend2 = Math.sin(t * 0.06 + swX * 0.05 + k2 * 0.04 + 0.5) * (k2 * 0.05);
        g.fillRect((baseX + 5 + bend2) | 0, 178 - k2, 1, 3);
      }
    }

    // Sand seabed strip
    g.fillStyle = '#c4a070'; g.fillRect(0, 176, 320, 4);
    g.fillStyle = '#8a6840'; g.fillRect(0, 178, 320, 2);

    // Bubble streams from the seabed drifting up
    for (var b2 = 0; b2 < 10; b2++) {
      var bx2 = ((b2 * 32 - camx * 0.5) % 320 + 320) % 320;
      var bphase = ((t * 0.6 + b2 * 30) % 220);
      var by2 = 178 - bphase * 0.8;
      if (by2 > 30) {
        g.fillStyle = 'rgba(255,255,255,0.32)';
        g.beginPath(); g.arc(bx2 + Math.sin(bphase * 0.05) * 3, by2 | 0, 2, 0, 6.28); g.fill();
      }
    }
  }
  // African savanna (Day 6-1). Sunset gradient, big setting sun, Mount
  // Kilimanjaro silhouette with snow cap in the mid-distance, layered
  // acacia trees + animal silhouettes (giraffe / elephant) wandering
  // in the back, dry grass at the horizon. Per Mark's pass-9 ask for
  // "African savanna flair."
  function drawSky_savanna(g, camx, camy, prog, t) {
    // Golden-hour gradient
    vGradient(g, '#f08040', '#ffb060', '#ffd890');
    // ----- DRAMATIC SUN -----
    // Big setting sun (lower-right). Now larger + with radiating rays
    // + outer corona so it dominates the sky like a true golden hour.
    var sunX = 250 - camx * 0.04;
    var sunY = 78;
    // Outermost soft halo (very large, very faint)
    g.fillStyle = 'rgba(255,210,140,0.16)';
    g.beginPath(); g.arc(sunX, sunY, 70, 0, 6.28); g.fill();
    // Mid corona
    g.fillStyle = 'rgba(255,200,120,0.32)';
    g.beginPath(); g.arc(sunX, sunY, 48, 0, 6.28); g.fill();
    // Inner glow
    g.fillStyle = 'rgba(255,220,150,0.55)';
    g.beginPath(); g.arc(sunX, sunY, 38, 0, 6.28); g.fill();
    // Subtle rotating rays (8 thin lines that drift slowly)
    g.strokeStyle = 'rgba(255,235,170,0.32)';
    g.lineWidth = 1;
    var rayRot = t * 0.003;
    for (var rr = 0; rr < 8; rr++) {
      var ang = rayRot + rr * (Math.PI / 4);
      g.beginPath();
      g.moveTo(sunX + Math.cos(ang) * 36, sunY + Math.sin(ang) * 36);
      g.lineTo(sunX + Math.cos(ang) * 64, sunY + Math.sin(ang) * 64);
      g.stroke();
    }
    // Solid sun disc (a touch larger - 30 px instead of 24)
    g.fillStyle = '#fff0a0';
    g.beginPath(); g.arc(sunX, sunY, 30, 0, 6.28); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(sunX - 4, sunY - 6, 8, 0, 6.28); g.fill();   // hot core highlight
    // Distant haze band on the horizon
    g.fillStyle = 'rgba(255,200,140,0.35)';
    g.fillRect(0, 118, 320, 14);
    // Heat-shimmer band: thin alternating rows of warm tint just above
    // the horizon, intensity rippling on t. Sells "African heat."
    for (var hs = 0; hs < 6; hs++) {
      var hsY = 132 + hs;
      var alpha = 0.06 + 0.04 * Math.sin(t * 0.04 + hs * 0.7);
      g.fillStyle = 'rgba(255,220,170,' + alpha.toFixed(3) + ')';
      g.fillRect(0, hsY, 320, 1);
    }
    // Kilimanjaro silhouette (far parallax, dominant centre-left)
    var kx = 70 - camx * 0.06;
    g.fillStyle = '#7a4a40';
    g.beginPath();
    g.moveTo(kx,        140);
    g.lineTo(kx + 28,   90);
    g.lineTo(kx + 38,   78);                          // peak
    g.lineTo(kx + 52,   92);
    g.lineTo(kx + 82,   140);
    g.closePath(); g.fill();
    // Snow cap
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(kx + 32,   88);
    g.lineTo(kx + 38,   78);
    g.lineTo(kx + 46,   90);
    g.lineTo(kx + 42,   94); g.lineTo(kx + 36,   92);
    g.closePath(); g.fill();
    // Far rolling hills
    mountainRidge(g, camx, 0.10, 138, '#a06640', 22);
    // Distant animal silhouettes wandering (giraffes + elephants)
    g.fillStyle = '#5a3a28';
    // Giraffe shape (long neck) at varied positions
    for (var ai = 0; ai < 3; ai++) {
      var ax = ((ai * 120 + t * 0.05 - camx * 0.18) % 380 + 380) % 380 - 30;
      var ay = 130;
      // Body
      g.fillRect(ax, ay + 4, 9, 4);
      // Legs
      g.fillRect(ax + 1, ay + 8, 1, 4);
      g.fillRect(ax + 4, ay + 8, 1, 4);
      g.fillRect(ax + 7, ay + 8, 1, 4);
      // Long neck
      g.fillRect(ax + 7, ay - 6, 1, 10);
      // Head
      g.fillRect(ax + 7, ay - 8, 3, 2);
    }
    // Elephant shape
    for (var ei = 0; ei < 2; ei++) {
      var ex = ((140 + ei * 160 + t * 0.04 - camx * 0.22) % 380 + 380) % 380 - 30;
      var ey = 132;
      g.fillStyle = '#3a2818';
      g.fillRect(ex, ey, 14, 6);                      // body
      g.fillRect(ex + 1, ey + 6, 2, 4);               // leg 1
      g.fillRect(ex + 5, ey + 6, 2, 4);               // leg 2
      g.fillRect(ex + 8, ey + 6, 2, 4);               // leg 3
      g.fillRect(ex + 11, ey + 6, 2, 4);              // leg 4
      g.fillRect(ex + 13, ey + 1, 3, 3);              // head
      g.fillRect(ex + 16, ey + 2, 1, 5);              // trunk
    }
    // Mid-distance acacia trees (umbrella canopy)
    for (var ti = 0; ti < 5; ti++) {
      var tx = ((ti * 70 - camx * 0.28) % 380 + 380) % 380 - 30;
      g.fillStyle = '#2a1c10';
      g.fillRect(tx + 12, 124, 2, 18);                // trunk
      // umbrella canopy
      g.fillStyle = '#1a4a2a';
      g.beginPath();
      g.ellipse(tx + 13, 122, 16, 5, 0, 0, 6.28); g.fill();
      g.fillStyle = '#2a6038';
      g.beginPath();
      g.ellipse(tx + 13, 121, 12, 3, 0, 0, 6.28); g.fill();
    }
    // Distant herd of small zebra/wildebeest silhouettes - a tight
    // cluster wandering in a line. Reads as a herd grazing at the
    // far horizon line.
    g.fillStyle = '#4a2e1a';
    var herdAnchorX = ((20 + t * 0.04 - camx * 0.16) % 380 + 380) % 380 - 30;
    var herdY = 138;
    var herdPositions = [0, 7, 13, 21, 26, 34, 39, 47, 52];
    for (var hi = 0; hi < herdPositions.length; hi++) {
      var hX = herdAnchorX + herdPositions[hi];
      // Tiny 4-legged body (body 4x2 + 2 legs)
      g.fillRect(hX | 0,        herdY,     4, 2);
      g.fillRect(hX | 0,        herdY + 2, 1, 2);
      g.fillRect((hX + 3) | 0,  herdY + 2, 1, 2);
      // Head (one pixel ahead)
      g.fillRect((hX + 4) | 0,  herdY,     1, 1);
    }

    // ----- CLOSE FOREGROUND ACACIA -----
    // Two near-foreground acacias at the highest parallax tier so
    // they actually frame the playfield instead of all trees being
    // mid-distance.
    var nearAcaciaSpan = 200;
    var naOff = -(((camx * 0.65) % nearAcaciaSpan) + nearAcaciaSpan) % nearAcaciaSpan;
    for (var na = naOff - nearAcaciaSpan; na < 360 + nearAcaciaSpan; na += nearAcaciaSpan) {
      var naX = na + 30;
      // Tall trunk
      g.fillStyle = '#1a1008';
      g.fillRect(naX, 116, 3, 28);
      // Big umbrella canopy (chunkier)
      g.fillStyle = '#0e2a14';
      g.beginPath();
      g.ellipse(naX + 1, 113, 26, 8, 0, 0, 6.28); g.fill();
      g.fillStyle = '#1a4a2a';
      g.beginPath();
      g.ellipse(naX + 1, 111, 22, 5, 0, 0, 6.28); g.fill();
      // Branch detail under canopy
      g.fillStyle = '#0a0804';
      g.fillRect(naX - 6, 116, 14, 1);
    }

    // ----- ANIMATED FOREGROUND GRASS -----
    // Tall tufts that sway with t. Two depth layers - mid (alpha 0.5)
    // and very-near (full alpha) - so the grass reads as motion-rich
    // foreground that the player walks behind.
    function drawTuftRow(baseY, parallax, density, alpha) {
      var span = 320 / density;
      var off = -(((camx * parallax) % span) + span) % span;
      g.fillStyle = 'rgba(58,90,30,' + alpha + ')';
      for (var ti = 0; ti < density + 2; ti++) {
        var tx = off + ti * span + ((ti * 7) % 5);
        var sway = Math.sin(t * 0.05 + ti * 0.5) * 1;
        var tuftH = 4 + (ti % 3);
        g.fillRect((tx + sway) | 0, baseY - tuftH, 1, tuftH);
        g.fillRect((tx + 1 + sway) | 0, baseY - tuftH + 1, 1, tuftH - 1);
        g.fillRect((tx + 2 + sway) | 0, baseY - tuftH, 1, tuftH);
      }
    }
    drawTuftRow(146, 0.5, 30, '0.55');                  // mid horizon tufts
    drawTuftRow(154, 0.85, 26, '0.85');                 // near foreground tufts

    // Vulture silhouettes circling slowly in the sky
    g.strokeStyle = '#3a2010'; g.lineWidth = 1;
    for (var vi = 0; vi < 3; vi++) {
      var vx = ((40 + vi * 100 + Math.sin(t * 0.015 + vi) * 30 - camx * 0.04) % 320 + 320) % 320;
      var vy = 30 + vi * 12 + Math.sin(t * 0.04 + vi) * 4;
      g.beginPath();
      g.moveTo(vx - 4, vy + 2);
      g.lineTo(vx - 1, vy);
      g.lineTo(vx,     vy + 1);
      g.lineTo(vx + 1, vy);
      g.lineTo(vx + 4, vy + 2);
      g.stroke();
    }

    // Dust motes drifting slowly across the lower third of the sky -
    // "dry air, things in motion" feel.
    for (var dm = 0; dm < 6; dm++) {
      var dx = ((dm * 53 + t * 0.5 - camx * 0.3) % 340 + 340) % 340 - 10;
      var dy = 90 + (dm * 11) % 40 + Math.sin(t * 0.06 + dm) * 2;
      g.fillStyle = 'rgba(255,230,180,0.45)';
      g.fillRect(dx | 0, dy | 0, 1, 1);
    }
  }
  function drawSky_village_dusk(g, camx, camy, prog, t) {
    vGradient(g, '#3e2860', '#f5a05a', '#ffd28a');
    simpleSun(g, 100, 130, 14, '#ff8060', false);
    for (var i = 0; i < 12; i++) {
      var rx = ((i * 32 - camx * 0.18) % 320 + 320) % 320;
      var rh = 8 + (i * 7) % 16;
      g.fillStyle = '#2a1c30';
      g.fillRect(rx | 0, 150 - rh, 28, rh);
      g.beginPath();
      g.moveTo(rx - 2, 150 - rh); g.lineTo(rx + 14, 150 - rh - 8); g.lineTo(rx + 30, 150 - rh);
      g.fill();
    }
  }
  function drawSky_eden(g, camx, camy, prog, t) {
    // Lush garden paradise: golden-hour sky -> distant mountains ->
    // mist band -> rolling hills -> distant flowering trees -> river
    // reflecting the sky -> foreground flower meadow + drifting
    // petals. Mark Pass 9: "really beautiful and lush background
    // group of layers - garden and paradise esque."

    // 1) SKY - golden-hour gradient with a high warm band
    vGradient(g, '#ffd28a', '#ffe6b8', '#c8ecb4');
    // Soft warm halo overhead
    var warmHalo = g.createRadialGradient(160, 30, 10, 160, 30, 130);
    warmHalo.addColorStop(0, 'rgba(255, 240, 200, 0.45)');
    warmHalo.addColorStop(1, 'rgba(255, 240, 200, 0)');
    g.fillStyle = warmHalo; g.fillRect(0, 0, 320, 110);

    // 2) BIG SUN with radiating rays (centre-right)
    var sunX = 240 - camx * 0.03, sunY = 52;
    // Outermost halo
    g.fillStyle = 'rgba(255, 240, 180, 0.22)';
    g.beginPath(); g.arc(sunX, sunY, 56, 0, 6.28); g.fill();
    g.fillStyle = 'rgba(255, 235, 160, 0.40)';
    g.beginPath(); g.arc(sunX, sunY, 36, 0, 6.28); g.fill();
    // Subtle rotating rays
    g.strokeStyle = 'rgba(255, 240, 180, 0.30)';
    g.lineWidth = 1;
    var rot = t * 0.002;
    for (var rr = 0; rr < 10; rr++) {
      var ang = rot + rr * (Math.PI / 5);
      g.beginPath();
      g.moveTo(sunX + Math.cos(ang) * 26, sunY + Math.sin(ang) * 26);
      g.lineTo(sunX + Math.cos(ang) * 48, sunY + Math.sin(ang) * 48);
      g.stroke();
    }
    // Sun disc
    g.fillStyle = '#fff8d0';
    g.beginPath(); g.arc(sunX, sunY, 22, 0, 6.28); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(sunX - 3, sunY - 5, 7, 0, 6.28); g.fill();

    // 3) DISTANT MOUNTAINS - layered, soft blue-green
    mountainRidge(g, camx, 0.05, 122, '#7898a8', 50);
    mountainRidge(g, camx, 0.09, 128, '#5a8088', 38);
    // Mist band hiding the mountain base
    g.fillStyle = 'rgba(240, 245, 220, 0.45)';
    g.fillRect(0, 118, 320, 12);

    // 4) FAR FLOWERING TREES - silhouettes with pink/white blossom dots
    var farSpan = 60;
    var farOff = -(((camx * 0.18) % farSpan) + farSpan) % farSpan;
    for (var ft = farOff - farSpan; ft < 360 + farSpan; ft += farSpan) {
      // trunk
      g.fillStyle = '#5a3a1c';
      g.fillRect(ft + 14, 124, 2, 16);
      // canopy
      g.fillStyle = '#3a7a40';
      g.beginPath(); g.ellipse(ft + 15, 122, 18, 9, 0, 0, 6.28); g.fill();
      g.fillStyle = '#5aa05c';
      g.beginPath(); g.ellipse(ft + 15, 119, 14, 6, 0, 0, 6.28); g.fill();
      // pink blossom dots
      g.fillStyle = '#ffc0d8';
      g.fillRect(ft + 10, 116, 1, 1); g.fillRect(ft + 18, 118, 1, 1);
      g.fillRect(ft + 14, 113, 1, 1); g.fillRect(ft + 22, 122, 1, 1);
      g.fillStyle = '#ffffff';
      g.fillRect(ft + 12, 120, 1, 1);
    }

    // 5) ROLLING HILLS - lush green, two depths
    mountainRidge(g, camx, 0.22, 152, '#5a9248', 28);
    mountainRidge(g, camx, 0.32, 158, '#3a7a32', 22);

    // 6) REFLECTIVE WATER STRIP - thin ribbon of sky-reflecting water
    //    along the horizon, with sparkles. Sells the paradise vibe.
    g.fillStyle = 'rgba(150, 220, 240, 0.55)';
    g.fillRect(0, 156, 320, 4);
    g.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (var sp_ = 0; sp_ < 6; sp_++) {
      var spx = ((sp_ * 56 + Math.sin(t * 0.04 + sp_) * 6 - camx * 0.45) % 340 + 340) % 340;
      g.fillRect(spx | 0, 157, 2, 1);
    }

    // 7) GREAT BACKGROUND TREE - the iconic Eden centerpiece, slow
    //    parallax so it dominates as Danny walks.
    var tX = 160 - camx * 0.10, tY = 172;
    // Trunk
    g.fillStyle = '#3a2010';
    g.fillRect(tX - 4, tY - 64, 8, 64);
    // Trunk highlight
    g.fillStyle = '#5a3018';
    g.fillRect(tX - 4, tY - 64, 2, 64);
    // Canopy - layered ellipses for a lush, full crown
    g.fillStyle = '#1a4818';                         // deepest shadow
    g.beginPath(); g.arc(tX, tY - 74, 46, 0, 6.28); g.fill();
    g.fillStyle = '#2c5a24';                         // mid layer
    g.beginPath(); g.arc(tX - 12, tY - 80, 28, 0, 6.28); g.fill();
    g.beginPath(); g.arc(tX + 14, tY - 78, 26, 0, 6.28); g.fill();
    g.beginPath(); g.arc(tX - 4, tY - 92, 22, 0, 6.28); g.fill();
    g.fillStyle = '#4a8c38';                         // bright highlights
    g.beginPath(); g.arc(tX - 8, tY - 86, 14, 0, 6.28); g.fill();
    g.beginPath(); g.arc(tX + 12, tY - 84, 13, 0, 6.28); g.fill();
    g.beginPath(); g.arc(tX + 2, tY - 100, 10, 0, 6.28); g.fill();
    // Fruit dots (warm orange / red glimmers)
    g.fillStyle = '#ff8a5a';
    for (var k = 0; k < 8; k++) {
      var fdx = (k * 11) % 60 - 30;
      var fdy = ((k * 7) % 30) - 15;
      g.fillRect(tX + fdx, tY - 74 + fdy, 2, 2);
    }
    g.fillStyle = '#ffd040';
    g.fillRect(tX - 6, tY - 86, 1, 1);
    g.fillRect(tX + 10, tY - 76, 1, 1);
    g.fillRect(tX - 18, tY - 80, 1, 1);

    // 8) DRIFTING WHITE DOVES in the back
    for (var di = 0; di < 3; di++) {
      var dvx = ((40 + di * 100 + t * 0.4 - camx * 0.10) % 360 + 360) % 360 - 30;
      var dvy = 70 + di * 14 + Math.sin(t * 0.05 + di) * 4;
      g.fillStyle = '#ffffff';
      // body
      g.fillRect(dvx | 0, dvy | 0, 3, 2);
      // wings flap on t
      var wf = (Math.floor(t / 8) + di) % 2;
      if (wf) {
        g.fillRect((dvx | 0) - 2, (dvy | 0) - 1, 2, 1);
        g.fillRect((dvx | 0) + 3, (dvy | 0) - 1, 2, 1);
      } else {
        g.fillRect((dvx | 0) - 2, (dvy | 0) + 1, 2, 1);
        g.fillRect((dvx | 0) + 3, (dvy | 0) + 1, 2, 1);
      }
    }

    // 9) FOREGROUND FLOWER MEADOW + tufts at the play area horizon
    //    Lush rolling grass with bright flowers (red, yellow, white).
    var mSpan = 18;
    var mOff = -(((camx * 0.55) % mSpan) + mSpan) % mSpan;
    for (var mt = mOff - mSpan; mt < 360 + mSpan; mt += mSpan) {
      var tuftH = 4 + (mt % 5);
      g.fillStyle = '#3a7a32';
      g.fillRect(mt | 0,     176 - tuftH, 1, tuftH);
      g.fillRect((mt | 0) + 1, 175 - tuftH, 1, tuftH + 1);
      g.fillRect((mt | 0) + 2, 176 - tuftH, 1, tuftH);
      // flower head colours cycle
      var flowerSeed = (mt | 0) % 7;
      var flowerColor = ['#ff5050', '#ffd040', '#ffffff', '#ff90c0', '#a850ff'][flowerSeed % 5];
      if (flowerSeed < 4) {
        g.fillStyle = flowerColor;
        g.fillRect((mt | 0) + 1, 175 - tuftH - 1, 1, 1);
      }
    }

    // 10) DRIFTING PETALS / pollen across the playing field
    for (var pt = 0; pt < 10; pt++) {
      var ptx = ((pt * 33 + t * 0.5 - camx * 0.25) % 340 + 340) % 340 - 10;
      var pty = 80 + (pt * 11) + Math.sin(t * 0.06 + pt) * 6;
      pty = pty % 100 + 40;
      var col = ['#ffc0d8', '#ffe070', '#ffffff'][pt % 3];
      g.fillStyle = col;
      g.fillRect(ptx | 0, pty | 0, 1, 1);
    }
  }

  // Bug-scale parallax (Day 6-1 final zone). Danny has shrunk to ant
  // size; everything in the background is now MASSIVE. Giant grass
  // blades sweeping across the foreground, huge dew drops twinkling
  // in the back, a single enormous dandelion / pollen mote drifting,
  // warm under-canopy lighting (the world is "down in the weeds").
  function drawSky_bugscale(g, camx, camy, prog, t) {
    // Painted canopy from assets/level 6 bugs background.png, pre-blurred
    // into a 320x180 offscreen canvas by sprites.js. Drawn tiled with slow
    // parallax as the cohesive backdrop. The image already includes
    // foreground branches at the corners and mid-canopy trees fading
    // into mist, so no procedural foliage on top. Sun pool, drifting
    // pollen, and the hanging cocoon remain as dynamic overlays.
    var bg = SDD.sprites && SDD.sprites.bugscaleBg && SDD.sprites.bugscaleBg();
    if (bg) {
      var bgSpan = bg.width, bgPx = 0.3;
      var bgOff = -(((camx * bgPx) % bgSpan) + bgSpan) % bgSpan;
      for (var b = bgOff - bgSpan; b < 320 + bgSpan; b += bgSpan) {
        g.drawImage(bg, b, 0);
      }
    } else {
      vGradient(g, '#b8c258', '#74953e', '#1e3a18');
    }

    // Sun-pierced light pool - warm glow over the canopy centre-top.
    var sunPool = g.createRadialGradient(140 - camx * 0.03, 22, 14, 140 - camx * 0.03, 22, 140);
    sunPool.addColorStop(0, 'rgba(255, 245, 180, 0.55)');
    sunPool.addColorStop(0.6, 'rgba(255, 245, 180, 0.12)');
    sunPool.addColorStop(1, 'rgba(255, 245, 180, 0)');
    g.fillStyle = sunPool;
    g.fillRect(0, 0, 320, 140);

    // Drifting pollen motes tie the depth layers together.
    for (var pm = 0; pm < 22; pm++) {
      var pmx = ((pm * 18 + t * 0.4 - camx * 0.25) % 340 + 340) % 340 - 10;
      var pmy = (60 + pm * 6 - (t * 0.3 + pm * 18) % 130) % 130 + 20;
      var alpha = 0.5 + Math.sin(t * 0.06 + pm) * 0.2;
      g.fillStyle = 'rgba(255, 250, 200, ' + alpha.toFixed(2) + ')';
      g.fillRect(pmx | 0, pmy | 0, 1, 1);
      g.fillRect((pmx | 0) + 1, pmy | 0, 1, 1);
    }

    // Hanging vine + bagworm cocoon kept from the previous canopy pass.
    var vineSpan = 360;
    var vineOff = -(((camx * 0.5) % vineSpan) + vineSpan) % vineSpan;
    for (var vn = vineOff - vineSpan; vn < 360 + vineSpan; vn += vineSpan) {
      var vx = vn + 220 + Math.sin(t * 0.02) * 3;
      g.strokeStyle = '#3a2a14';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(vx, 14);
      g.bezierCurveTo(vx - 2, 30, vx + 2, 50, vx, 64);
      g.stroke();
      g.fillStyle = '#3a2814';
      g.beginPath(); g.ellipse(vx, 70, 4, 7, 0, 0, 6.28); g.fill();
      g.fillStyle = '#241808';
      g.fillRect(vx - 2, 68, 1, 4);
      g.fillRect(vx + 1, 70, 1, 3);
    }
  }

  // ===== ADVENTURE CITY: PROCEDURAL CYBERPUNK SKYLINE (v0.55) =====
  // Painted-quality city built procedurally so the secret stage looks
  // rich BEFORE Mark drops in real PNGs. Each parallax layer is
  // rendered ONCE into a 960x180 offscreen canvas at boot, then
  // tile-blitted per frame at its own scroll factor - per-frame cost
  // is one drawImage per layer, not hundreds of fillRects. Animated
  // overlays (blinking neon, drifting airships, lamp halos, traffic
  // tail-lights) are drawn on top per-frame for life.
  //
  // The PNG getters from sprites.js (cyberFar/Mid/Bridge/Fg) still
  // override these procedurals when Mark drops painted layers into
  // assets/city/.
  // -----------------------------------------------------------------------

  // Deterministic PRNG so the same layer paint reproduces frame-to-frame
  // (and crucially across renders that recompute the cached canvas).
  function _cyRng(seed) {
    var s = (seed | 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) | 0;
      return ((s >>> 8) & 0xffffff) / 0x1000000;
    };
  }
  function _cyMix(a, b, t) { return a + (b - a) * t; }
  function _cyHex(r, g, b) {
    var to = function (n) { var s = (n & 255).toString(16); return s.length < 2 ? '0' + s : s; };
    return '#' + to(r | 0) + to(g | 0) + to(b | 0);
  }
  function _cyFog(c1, c2, k, alpha, ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(' + c1 + ',' + alpha + ')';
    ctx.fillRect(x, y, w, h);
  }

  // ---- Shared building paint helpers ------------------------------------
  // Pixel-art "rounded corners": chip one pixel out of each corner +
  // round it with the sky-side anti-alias (corner pixels recoloured to
  // a mid tone so the silhouette reads as bevelled instead of perfectly
  // square. Cheap visual upgrade across every building.
  function _cyRoundCorners(g, x, y, w, h, shade) {
    // Clip out the four absolute corners (turn into background).
    g.clearRect(x,           y,           1, 1);
    g.clearRect(x + w - 1,   y,           1, 1);
    g.clearRect(x,           y + h - 1,   1, 1);
    g.clearRect(x + w - 1,   y + h - 1,   1, 1);
    // Soften with diagonal AA pixels in the building's shade tone.
    g.fillStyle = shade;
    g.fillRect(x + 1,         y,             1, 1);
    g.fillRect(x,             y + 1,         1, 1);
    g.fillRect(x + w - 2,     y,             1, 1);
    g.fillRect(x + w - 1,     y + 1,         1, 1);
    g.fillRect(x + 1,         y + h - 1,     1, 1);
    g.fillRect(x,             y + h - 2,     1, 1);
    g.fillRect(x + w - 2,     y + h - 1,     1, 1);
    g.fillRect(x + w - 1,     y + h - 2,     1, 1);
  }
  // Modular sci-fi panel divisions: thin shade lines across the face
  // every N rows/cols, plus a few brighter "rivet" pixels at panel
  // intersections. Reads as prefab cladding on the building.
  function _cyPanelDetail(g, x, y, w, h, shade, hi) {
    // Horizontal panel divisions every ~12 px.
    g.fillStyle = shade;
    for (var py = y + 8; py < y + h - 4; py += 12) {
      g.fillRect(x + 1, py, w - 2, 1);
    }
    // Vertical panel divisions every ~14 px.
    for (var pxv = x + 7; pxv < x + w - 4; pxv += 14) {
      g.fillRect(pxv, y + 2, 1, h - 4);
    }
    // Rivet highlights at panel intersections (1-px dots).
    g.fillStyle = hi;
    for (var ry = y + 8; ry < y + h - 4; ry += 12) {
      for (var rx = x + 7; rx < x + w - 4; rx += 14) {
        g.fillRect(rx,     ry,     1, 1);
        g.fillRect(rx - 1, ry,     1, 1);
      }
    }
  }

  // ---- Far skyline painter ----------------------------------------------
  // Distant towers fading into atmospheric haze. Low saturation, lots
  // of variation in height + roof type so the silhouette feels organic.
  function _cyPaintFar(g) {
    var rng = _cyRng(0xC1FA);
    var W = 960, H = 180;
    // Background haze gradient layer (warm dawn behind the towers).
    var hz = g.createLinearGradient(0, 60, 0, 145);
    hz.addColorStop(0,    'rgba(255,180,160,0.18)');
    hz.addColorStop(0.5,  'rgba(220,160,180,0.10)');
    hz.addColorStop(1,    'rgba(170,180,220,0.06)');
    g.fillStyle = hz; g.fillRect(0, 60, W, 90);

    // Draw 64 tower silhouettes. The seed-based RNG keeps positions
    // varied while still 100% deterministic.
    var towers = [];
    for (var i = 0; i < 64; i++) {
      var tw = 8 + Math.floor(rng() * 14);
      var th = 22 + Math.floor(rng() * 48);
      // Spread non-uniformly to avoid grid feel.
      var tx = Math.floor(rng() * (W + 40)) - 20;
      towers.push({ x: tx, w: tw, h: th, r: rng() });
    }
    // Sort by height ascending so taller towers paint LAST (foreground).
    towers.sort(function (a, b) { return a.h - b.h; });

    for (var k = 0; k < towers.length; k++) {
      var T = towers[k];
      var baseY = 135 - T.h;
      // Depth tint: shorter (more distant) towers fade toward sky color.
      var depth = Math.max(0, Math.min(1, (T.h - 22) / 48));
      var tone = Math.floor(_cyMix(140, 80, depth));
      var rT = Math.floor(_cyMix(170, 95, depth));
      var gT = Math.floor(_cyMix(175, 105, depth));
      var bT = Math.floor(_cyMix(200, 145, depth));
      var col = _cyHex(rT, gT, bT);
      var shade = _cyHex(rT - 28, gT - 28, bT - 28);
      var hi = _cyHex(rT + 22, gT + 22, bT + 22);
      g.fillStyle = col; g.fillRect(T.x, baseY, T.w, T.h);
      // Vertical shading on the left edge.
      g.fillStyle = shade; g.fillRect(T.x, baseY, 1, T.h);
      // Highlight on the right edge.
      g.fillStyle = hi;    g.fillRect(T.x + T.w - 1, baseY, 1, T.h);
      // Roof variant: 0=flat slab, 1=pyramid, 2=spire, 3=dome, 4=billboard
      var roof = Math.floor(T.r * 5);
      if (roof === 0) {
        g.fillStyle = shade; g.fillRect(T.x - 1, baseY - 2, T.w + 2, 2);
      } else if (roof === 1) {
        // Pyramid.
        var px2 = T.x + T.w / 2;
        for (var pry = 0; pry < 5; pry++) {
          var pw = Math.max(1, T.w - pry * 2);
          g.fillStyle = (pry < 2) ? hi : col;
          g.fillRect(Math.round(px2 - pw / 2), baseY - 5 + pry, pw, 1);
        }
      } else if (roof === 2) {
        // Spire / antenna.
        g.fillStyle = col;
        g.fillRect(T.x + T.w / 2 - 1, baseY - 8, 2, 8);
        g.fillStyle = '#ff5a5a';
        if ((T.x | 0) % 7 === 0) g.fillRect(T.x + T.w / 2 - 1, baseY - 8, 2, 1);
      } else if (roof === 3) {
        // Dome.
        var dr = Math.max(2, Math.floor(T.w / 3));
        g.fillStyle = col;
        g.beginPath(); g.arc(T.x + T.w / 2, baseY, dr, Math.PI, 0); g.fill();
        g.fillStyle = hi;
        g.fillRect(T.x + T.w / 2 - 1, baseY - dr + 1, 1, dr - 1);
      } else {
        // Billboard / panel top.
        g.fillStyle = shade; g.fillRect(T.x - 1, baseY - 6, T.w + 2, 6);
        g.fillStyle = (rng() > 0.5) ? '#ff5a8c' : '#5af0c8';
        g.fillRect(T.x + 1, baseY - 5, T.w - 2, 1);
      }
      // Lit windows: random pattern, low saturation for distance.
      var wc = (rng() > 0.5) ? '#ffeab0' : '#cbe6ff';
      for (var wy = baseY + 4; wy < baseY + T.h - 4; wy += 5) {
        for (var wx = T.x + 2; wx < T.x + T.w - 2; wx += 4) {
          // Sparse: only ~35% lit at distance.
          if (((wx * 13 + wy * 7 + k) & 7) < 3) {
            g.fillStyle = wc;
            g.fillRect(wx, wy, 2, 2);
          }
        }
      }
    }

    // Cool blue depth-fog overlay across the whole far layer to push
    // it back into the sky.
    g.fillStyle = 'rgba(160,180,220,0.22)';
    g.fillRect(0, 60, W, 90);
  }

  // ---- Mid city painter -------------------------------------------------
  // Bigger, sharper buildings with detailed window grids + rooftop
  // furniture + neon sign bars + occasional cranes.
  function _cyPaintMid(g) {
    var rng = _cyRng(0x32FF);
    var W = 960, H = 180;
    // Walk from left to right placing buildings, varying x stride to
    // avoid a uniform grid.
    var x = -10;
    var k = 0;
    while (x < W + 20) {
      var w = 24 + Math.floor(rng() * 22);
      var h = 50 + Math.floor(rng() * 60);
      var baseY = 145 - h;
      k++;
      // Building body with a vertical 3-tone shade for depth.
      var hueShift = Math.floor(rng() * 30);
      var body  = _cyHex(72 + hueShift, 86, 138);
      var shade = _cyHex(46, 56,  95);
      var hi    = _cyHex(108, 122, 170);
      g.fillStyle = body;  g.fillRect(x, baseY, w, h);
      g.fillStyle = shade; g.fillRect(x, baseY, 2, h);
      g.fillStyle = shade; g.fillRect(x, baseY + h - 2, w, 2);
      g.fillStyle = hi;    g.fillRect(x + w - 1, baseY, 1, h);
      g.fillStyle = hi;    g.fillRect(x, baseY, w, 1);
      // Modular panel cladding on the body.
      _cyPanelDetail(g, x, baseY, w, h, shade, hi);
      // Setback at ~60% height for some buildings (architectural step).
      var hasSetback = rng() > 0.55;
      if (hasSetback) {
        var stepH = Math.floor(h * 0.4);
        var stepW = Math.floor(w * 0.65);
        var sx = x + Math.floor((w - stepW) / 2);
        var sy = baseY - stepH;
        g.fillStyle = body; g.fillRect(sx, sy, stepW, stepH);
        g.fillStyle = shade; g.fillRect(sx, sy, 1, stepH);
        g.fillStyle = hi;    g.fillRect(sx + stepW - 1, sy, 1, stepH);
        _cyPanelDetail(g, sx, sy, stepW, stepH, shade, hi);
        _cyRoundCorners(g, sx, sy, stepW, stepH, shade);
        // Recurse window grid onto the setback too.
        _cyDrawWindowGrid(g, sx, sy, stepW, stepH, rng);
      }
      // Window grid on the main body.
      _cyDrawWindowGrid(g, x, baseY, w, h, rng);
      // Top + visible side corners get the rounded chip.
      _cyRoundCorners(g, x, baseY, w, h, shade);
      // Rooftop ornaments.
      _cyDrawRooftop(g, x, baseY, w, hasSetback ? null : k, rng);
      // Vertical neon sign on ~15% of buildings.
      if (rng() < 0.18 && w > 28) {
        var nsx = x + w - 5;
        var nsh = Math.min(h - 8, 28 + Math.floor(rng() * 14));
        var nsy = baseY + 4 + Math.floor(rng() * 6);
        var col = (rng() > 0.5) ? '#ff5af0' : '#5af0ff';
        g.fillStyle = '#1a1a3a';
        g.fillRect(nsx, nsy, 3, nsh);
        for (var ny = nsy + 1; ny < nsy + nsh - 1; ny += 3) {
          g.fillStyle = col;
          g.fillRect(nsx + 1, ny, 1, 2);
        }
      }
      // Horizontal billboard sign on ~10% of buildings (above roofline).
      if (rng() < 0.10 && w > 30) {
        var bbw = w - 4;
        var bbh = 7;
        var bbx = x + 2, bby = baseY - bbh - 1;
        g.fillStyle = '#1a1a3a';
        g.fillRect(bbx, bby, bbw, bbh);
        g.fillStyle = '#3a3a5a';
        g.fillRect(bbx, bby + bbh - 1, bbw, 1);
        // Faux text bars.
        var sc = (rng() > 0.5) ? '#ffd23a' : '#5af0a8';
        g.fillStyle = sc;
        for (var bi = bbx + 2; bi < bbx + bbw - 2; bi += 4) {
          g.fillRect(bi, bby + 2, 2, 3);
        }
        // Support struts down to the roof.
        g.fillStyle = '#2a2a4a';
        g.fillRect(bbx + 3, bby + bbh, 1, 2);
        g.fillRect(bbx + bbw - 4, bby + bbh, 1, 2);
      }
      // Move on with a small overlap so silhouettes interlock.
      x += w - 2 - Math.floor(rng() * 4);
    }

    // 2-3 construction cranes scattered across the layer for skyline drama.
    var craneCount = 2 + Math.floor(rng() * 2);
    for (var c = 0; c < craneCount; c++) {
      var cx = Math.floor(rng() * (W - 100)) + 50;
      var cy = 60 + Math.floor(rng() * 14);
      _cyDrawCrane(g, cx, cy);
    }
  }

  function _cyDrawWindowGrid(g, x, y, w, h, rng) {
    // Window cells: 2x2 pixels, 4-px spacing → ~6-10 columns wide,
    // ~10-25 rows tall. Random lit pattern with multiple colors.
    var palette = ['#ffeab0', '#ffd870', '#cbe6ff', '#5af0ff', '#a0aacc', '#a0aacc'];
    var seed = (x * 13 + y * 7) & 0xff;
    for (var wy = y + 3; wy < y + h - 3; wy += 4) {
      for (var wx = x + 2; wx < x + w - 2; wx += 3) {
        // Skip windows pseudorandomly so the grid doesn't feel mechanical.
        var lit = ((wx * 17 + wy * 23 + seed) & 7);
        if (lit < 5) {
          g.fillStyle = palette[(wx + wy + seed) % palette.length];
          g.fillRect(wx, wy, 2, 2);
        } else {
          g.fillStyle = '#202850';
          g.fillRect(wx, wy, 2, 2);
        }
      }
    }
  }

  function _cyDrawRooftop(g, x, baseY, w, k, rng) {
    // Roof type variants chosen by building width.
    if (w < 28) {
      // Small: just an antenna.
      g.fillStyle = '#1a2240';
      g.fillRect(x + w / 2, baseY - 6, 1, 6);
      g.fillStyle = '#ff5a5a';
      g.fillRect(x + w / 2, baseY - 6, 1, 1);
      return;
    }
    // Water tower (cylindrical pixel shape).
    var wtx = x + 4;
    g.fillStyle = '#3a4264';
    g.fillRect(wtx, baseY - 6, 6, 4);
    g.fillStyle = '#5a6294';
    g.fillRect(wtx, baseY - 6, 6, 1);
    g.fillStyle = '#1a2240';
    g.fillRect(wtx + 1, baseY - 2, 1, 2);
    g.fillRect(wtx + 4, baseY - 2, 1, 2);
    // AC unit row.
    var acx = x + 12;
    g.fillStyle = '#2a3050';
    g.fillRect(acx, baseY - 3, w - 18, 3);
    g.fillStyle = '#3a4060';
    for (var ac = acx + 1; ac < acx + w - 18; ac += 4) {
      g.fillRect(ac, baseY - 3, 2, 1);
    }
    // Tall antenna on ~50% of buildings.
    if ((w + (k || 0)) & 1) {
      var ax = x + w - 6;
      g.fillStyle = '#1a2240';
      g.fillRect(ax, baseY - 12, 1, 12);
      // Cross arms.
      g.fillRect(ax - 2, baseY - 10, 5, 1);
      g.fillRect(ax - 1, baseY - 7, 3, 1);
      // Red blinking aviation light goes here per-frame (in the
      // animated overlay), not pre-rendered.
    }
  }

  function _cyDrawCrane(g, x, y) {
    // Vertical mast.
    g.fillStyle = '#2a3454';
    g.fillRect(x, y, 2, 60);
    g.fillStyle = '#3a4470';
    g.fillRect(x + 1, y, 1, 60);
    // Horizontal jib.
    g.fillStyle = '#2a3454';
    g.fillRect(x - 18, y + 4, 38, 2);
    g.fillStyle = '#3a4470';
    g.fillRect(x - 18, y + 4, 38, 1);
    // Tie bars to the jib (triangular truss).
    g.fillStyle = '#1a2240';
    for (var ti = 0; ti < 9; ti++) {
      var tx = x - 16 + ti * 4;
      g.fillRect(tx, y + 6, 1, 4);
    }
    // Counter-jib.
    g.fillStyle = '#2a3454';
    g.fillRect(x - 8, y, 10, 4);
    // Hook + cable.
    g.fillStyle = '#1a2240';
    g.fillRect(x + 12, y + 6, 1, 18);
    g.fillStyle = '#3a4470';
    g.fillRect(x + 11, y + 23, 3, 2);
    // Red strobe at the tip (drawn static; animation handled per-frame).
    g.fillStyle = '#ff5a5a';
    g.fillRect(x + 19, y + 4, 1, 1);
  }

  // ---- Bridge / street-level shopfront layer painter -------------------
  // The third parallax layer. NOT a road (the tile ground IS the road);
  // instead a band of street-level shopfronts + awnings + storefront
  // signs that sit BEHIND the player at roughly y=100-150, giving the
  // mid-city skyline an inhabited base. Drawn full-width with sparse
  // gaps for visibility.
  function _cyPaintBridge(g) {
    var rng = _cyRng(0xB12D);
    var W = 960;
    g.clearRect(0, 0, W, 180);
    // Walk left-to-right placing shopfronts. Each is 30-60 px wide.
    var x = -10;
    var k = 0;
    while (x < W + 20) {
      var w = 30 + Math.floor(rng() * 30);
      var h = 26 + Math.floor(rng() * 14);
      var baseY = 150 - h;
      k++;
      // Shopfront body in mid-blue.
      var body  = _cyHex(54 + Math.floor(rng() * 18), 62, 100);
      var shade = _cyHex(28, 34,  60);
      var hi    = _cyHex(92, 102, 150);
      g.fillStyle = body;  g.fillRect(x, baseY, w, h);
      g.fillStyle = shade; g.fillRect(x, baseY, 1, h);
      g.fillStyle = hi;    g.fillRect(x + w - 1, baseY, 1, h);
      g.fillStyle = shade; g.fillRect(x, baseY + h - 1, w, 1);
      g.fillStyle = hi;    g.fillRect(x, baseY, w, 1);
      _cyRoundCorners(g, x, baseY, w, h, shade);
      // Big shop window (lit interior).
      var ww = w - 8, wh = h - 14;
      var wx = x + 4, wy = baseY + 8;
      g.fillStyle = '#0a0e1a';
      g.fillRect(wx, wy, ww, wh);
      // Lit interior color rotates so adjacent shops differ.
      var interiors = ['#ffd270', '#9af0ff', '#ff8acc', '#a0f0a0', '#ffea88'];
      g.fillStyle = interiors[k % interiors.length];
      g.fillRect(wx + 1, wy + 1, ww - 2, wh - 2);
      // Silhouettes of merchandise / patrons inside the window.
      g.fillStyle = '#1a1a3a';
      var slots = Math.max(2, Math.floor(ww / 8));
      for (var si = 0; si < slots; si++) {
        var stx = wx + 2 + si * 7;
        var sth = 3 + ((si + k) % 3) * 2;
        g.fillRect(stx, wy + wh - 2 - sth, 3, sth);
      }
      // Awning above the window (folded fabric).
      var aw = w - 6, ax = x + 3;
      var aCol = (k % 2) ? '#ff4060' : '#ffd23a';
      var aColD = (k % 2) ? '#a02040' : '#a87020';
      g.fillStyle = aColD;
      g.fillRect(ax, baseY + 5, aw, 3);
      g.fillStyle = aCol;
      g.fillRect(ax, baseY + 4, aw, 2);
      // Awning scallops (dripping triangles).
      g.fillStyle = aColD;
      for (var sc = ax; sc < ax + aw - 2; sc += 4) {
        g.fillRect(sc, baseY + 8, 2, 1);
      }
      // Shop sign above the awning.
      var sgW = w - 12, sgX = x + 6;
      g.fillStyle = '#0a0a1a';
      g.fillRect(sgX, baseY + 1, sgW, 3);
      g.fillStyle = (k % 3 === 0) ? '#5af0ff' : (k % 3 === 1) ? '#ff5af0' : '#ffd23a';
      // Faux text - bars filling the sign.
      for (var ti = sgX + 2; ti < sgX + sgW - 1; ti += 3) {
        g.fillRect(ti, baseY + 2, 2, 1);
      }
      // Door slot (always on the left or right).
      var dx = (k & 1) ? x + 2 : x + w - 7;
      var dy = baseY + h - 10;
      g.fillStyle = '#0a0e1a';
      g.fillRect(dx, dy, 5, 10);
      g.fillStyle = '#3a3a5a';
      g.fillRect(dx, dy, 5, 1);
      g.fillStyle = '#ffd270';
      g.fillRect(dx + (k & 1 ? 4 : 0), dy + 4, 1, 1);    // doorknob
      // Sidewalk strip below.
      g.fillStyle = '#3a4470';
      g.fillRect(x, baseY + h, w, 2);
      g.fillStyle = '#5a6494';
      g.fillRect(x, baseY + h, w, 1);
      // Move to next shop (slight overlap).
      x += w - 2 - Math.floor(rng() * 4);
    }
    // Telephone poles + cables running along the back of the
    // shopfront row.
    for (var tp = 30; tp < W; tp += 110) {
      g.fillStyle = '#1a1e3a';
      g.fillRect(tp, 80, 1, 38);
      g.fillRect(tp - 4, 84, 10, 1);
      g.fillRect(tp - 3, 88, 8, 1);
    }
  }

  // ---- Foreground building painter --------------------------------------
  // Dark dramatic silhouettes placed ONLY at extreme screen edges so the
  // playable area stays visible. No middle clusters. Heavy detail on
  // the two edge anchors (balconies, fire escapes, neon).
  function _cyPaintForeground(g) {
    var rng = _cyRng(0xF6E8);
    var W = 960;
    g.clearRect(0, 0, W, 180);

    // Edge towers: 4 across the 960-wide span, each pinned to either
    // the LEFT or RIGHT side of a 320-wide "screen slot" so as the
    // camera scrolls the player always has tower-on-one-side, gap-in-
    // the-middle visibility.
    var slots = 3;     // 960 / 320 = 3 screen-widths in the cached canvas
    for (var s = 0; s < slots; s++) {
      var screenLeft = s * 320;
      // LEFT-side tower.
      var lw = 36 + Math.floor(rng() * 12);
      var lh = 110 + Math.floor(rng() * 40);
      _cyPaintFgTower(g, screenLeft - 4, lw, lh, rng);
      // RIGHT-side tower.
      var rw = 32 + Math.floor(rng() * 14);
      var rh = 100 + Math.floor(rng() * 50);
      _cyPaintFgTower(g, screenLeft + 320 - rw - 2, rw, rh, rng);
    }

    // Hanging signs across the top of the screen.
    for (var hs = 0; hs < 14; hs++) {
      var hx = 30 + Math.floor(rng() * (W - 60));
      var hy = 6 + Math.floor(rng() * 26);
      _cyPaintHangingSign(g, hx, hy, rng);
    }

    // A few cables crossing high (telephone / power lines).
    g.strokeStyle = '#0a0a18';
    g.lineWidth = 1;
    for (var cb = 0; cb < 6; cb++) {
      var cbx = Math.floor(rng() * W);
      g.beginPath();
      g.moveTo(cbx, 14 + cb * 3);
      g.bezierCurveTo(cbx + 80, 28 + cb * 3, cbx + 160, 18 + cb * 3, cbx + 240, 16 + cb * 3);
      g.stroke();
    }
  }

  function _cyPaintFgTower(g, x, w, h, rng) {
    var baseY = 180 - h;
    // Body: very dark with subtle blue highlight to read as "in shadow".
    g.fillStyle = '#0a0e1a';
    g.fillRect(x, baseY, w, h);
    g.fillStyle = '#1a2240';
    g.fillRect(x, baseY, 1, h);
    g.fillRect(x + w - 1, baseY, 1, h);
    g.fillRect(x, baseY, w, 1);
    // Modular panel cladding (very faint on the dark body) + chip
    // the corners so the tower silhouette reads as a real structure.
    _cyPanelDetail(g, x, baseY, w, h, '#0a0e1a', '#3a4470');
    _cyRoundCorners(g, x, baseY, w, h, '#1a2240');
    // Lit window grid: every other window is on, varied warm/cool.
    for (var wy = baseY + 6; wy < 180 - 8; wy += 9) {
      for (var wx = x + 3; wx < x + w - 3; wx += 6) {
        if (((wx * 11 + wy * 7) & 3) === 0) continue;     // some unlit
        var warm = ((wx + wy) % 3 === 0);
        // Window frame.
        g.fillStyle = '#0a0a1a';
        g.fillRect(wx, wy, 4, 5);
        g.fillStyle = warm ? '#ffd270' : '#9af0ff';
        g.fillRect(wx + 1, wy + 1, 2, 3);
        // Sill highlight.
        g.fillStyle = '#1a2240';
        g.fillRect(wx, wy + 5, 4, 1);
      }
    }
    // Balconies (every ~30 vertical px on the front).
    for (var by = baseY + 18; by < 180 - 18; by += 24) {
      // Railing rail.
      g.fillStyle = '#2a2e48';
      g.fillRect(x + 2, by, w - 4, 1);
      g.fillStyle = '#3a3e58';
      g.fillRect(x + 2, by - 1, w - 4, 1);
      // Vertical bars.
      for (var bi = x + 3; bi < x + w - 3; bi += 3) {
        g.fillStyle = '#1a1e3a';
        g.fillRect(bi, by - 4, 1, 4);
      }
    }
    // Vertical neon sign on the right side of the tower.
    if (rng() > 0.4) {
      var nsx = x + w - 4;
      var nsy = baseY + 8;
      var nsh = Math.min(h - 16, 50);
      var col = (rng() > 0.5) ? '#ff5af0' : '#5af0ff';
      g.fillStyle = '#0a0a1a';
      g.fillRect(nsx, nsy, 3, nsh);
      for (var ny = nsy + 2; ny < nsy + nsh - 2; ny += 4) {
        g.fillStyle = col;
        g.fillRect(nsx + 1, ny, 1, 3);
      }
      // Glow halo around the sign.
      g.fillStyle = (col === '#ff5af0') ? 'rgba(255,90,240,0.18)' : 'rgba(90,240,255,0.18)';
      g.fillRect(nsx - 3, nsy, 8, nsh);
    }
    // Fire escape on the LEFT side of some towers.
    if (rng() > 0.55) {
      var fex = x - 3;
      g.fillStyle = '#1a1e3a';
      // Vertical rails.
      g.fillRect(fex,     baseY + 12, 1, h - 20);
      g.fillRect(fex + 3, baseY + 12, 1, h - 20);
      // Horizontal landings every 20 px.
      for (var fy = baseY + 24; fy < 180 - 14; fy += 22) {
        g.fillRect(fex, fy, 4, 1);
        // Diagonal stair (4 steps).
        for (var st = 0; st < 4; st++) {
          g.fillRect(fex + st, fy - st, 1, 1);
        }
      }
    }
  }

  function _cyPaintHangingSign(g, x, y, rng) {
    var w = 12 + Math.floor(rng() * 14);
    var h = 8 + Math.floor(rng() * 6);
    var col = (rng() > 0.5) ? '#ff5af0' : ((rng() > 0.5) ? '#5af0ff' : '#ffd23a');
    var bg  = '#0a0a1a';
    // Hanger cable from ceiling.
    g.fillStyle = '#1a1e3a';
    g.fillRect(x + w / 2, 0, 1, y);
    g.fillRect(x + 2,     0, 1, y);
    g.fillRect(x + w - 3, 0, 1, y);
    // Sign panel.
    g.fillStyle = bg;
    g.fillRect(x, y, w, h);
    g.fillStyle = col;
    g.fillRect(x + 1, y + 1, w - 2, 1);
    g.fillRect(x + 1, y + h - 2, w - 2, 1);
    g.fillRect(x + 1, y + 1, 1, h - 2);
    g.fillRect(x + w - 2, y + 1, 1, h - 2);
    // Text bars inside.
    for (var ti = x + 3; ti < x + w - 3; ti += 3) {
      g.fillStyle = col;
      g.fillRect(ti, y + 4, 2, h - 8);
    }
    // Glow halo.
    var glow = (col === '#ff5af0') ? 'rgba(255,90,240,0.22)'
             : (col === '#5af0ff') ? 'rgba(90,240,255,0.22)'
                                    : 'rgba(255,210,80,0.22)';
    g.fillStyle = glow;
    g.fillRect(x - 2, y - 2, w + 4, h + 4);
  }

  // ---- Layer cache + accessors ------------------------------------------
  var _cyCache = null;
  function _cyBuild() {
    if (_cyCache) return _cyCache;
    function mk(w, h, painter) {
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var g = c.getContext('2d');
      painter(g);
      return c;
    }
    _cyCache = {
      far:    mk(960, 180, _cyPaintFar),
      mid:    mk(960, 180, _cyPaintMid),
      bridge: mk(960, 180, _cyPaintBridge),
      fg:     mk(960, 180, _cyPaintForeground)
    };
    return _cyCache;
  }

  // ---- Per-frame painters ----------------------------------------------
  function drawSky_cyber(g, camx, camy, prog, t) {
    var S = SDD.sprites || {};
    var cache = _cyBuild();

    // 1. Sky gradient: deep cosmic dusk - magenta + violet + warm horizon.
    var sky = g.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0,    '#1a1240');
    sky.addColorStop(0.3,  '#3a1a5e');
    sky.addColorStop(0.55, '#7a2c70');
    sky.addColorStop(0.78, '#c25a5e');
    sky.addColorStop(0.92, '#ff9a4a');
    sky.addColorStop(1,    '#ffd070');
    g.fillStyle = sky; g.fillRect(0, 0, 320, 180);

    // 2. Distant stars (denser at the top, none near the horizon).
    for (var s = 0; s < 50; s++) {
      var sx = ((s * 53 + 17) % 320);
      var sy = (s * 19 + 7) % 70;
      var twinkle = ((Math.sin(t * 0.04 + s) + 1) * 0.5);
      if (twinkle > 0.55) {
        var alpha = 0.4 + twinkle * 0.5;
        g.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(2) + ')';
        g.fillRect(sx, sy, 1, 1);
      }
    }

    // 3. Distant moon (high up, soft).
    var moonX = 240 - camx * 0.03, moonY = 32;
    g.fillStyle = 'rgba(255,240,200,0.15)';
    g.beginPath(); g.arc(moonX, moonY, 18, 0, 6.28); g.fill();
    g.fillStyle = 'rgba(255,240,200,0.45)';
    g.beginPath(); g.arc(moonX, moonY, 10, 0, 6.28); g.fill();
    g.fillStyle = '#fff6c8';
    g.beginPath(); g.arc(moonX, moonY, 7, 0, 6.28); g.fill();
    g.fillStyle = '#e8d2a8';
    g.fillRect(moonX - 3, moonY - 1, 2, 1);
    g.fillRect(moonX + 1, moonY + 2, 2, 1);

    // 4. Long horizontal cloud strips drifting at a sub-far-parallax.
    for (var ci = 0; ci < 7; ci++) {
      var cx = ((ci * 90 - camx * 0.06 + t * 0.08) % 400 + 400) % 400 - 60;
      var cy = 38 + (ci % 3) * 11;
      var cw = 50 + (ci * 13) % 30;
      g.fillStyle = 'rgba(70,40,90,0.55)';
      g.fillRect(cx, cy, cw, 4);
      g.fillStyle = 'rgba(180,110,150,0.45)';
      g.fillRect(cx + 5, cy - 1, cw - 10, 2);
      g.fillStyle = 'rgba(255,200,180,0.30)';
      g.fillRect(cx + 12, cy - 2, cw - 24, 1);
    }

    // 5. Drifting airships (silhouettes with red/green nav lights).
    var ash = ((t * 0.18 - camx * 0.05) % 480 + 480) % 480 - 80;
    g.fillStyle = '#1a1240';
    g.fillRect(ash, 24, 32, 6);
    g.fillRect(ash + 4, 22, 24, 2);
    g.fillRect(ash + 4, 30, 24, 2);
    g.fillStyle = '#2a1a50';
    g.fillRect(ash + 12, 30, 8, 3);
    // Nav lights blink.
    if ((t / 18 | 0) & 1) {
      g.fillStyle = '#ff4040'; g.fillRect(ash + 1,  26, 2, 2);
      g.fillStyle = '#40ff60'; g.fillRect(ash + 29, 26, 2, 2);
    }

    function tileLayer(img, factor) {
      if (!img) return;
      var span = img.width || 320;
      var off = -(((camx * factor) % span) + span) % span;
      for (var b = off - span; b < 320 + span; b += span) {
        g.drawImage(img, b, 0);
      }
    }

    // 6. Far skyline (use Mark's PNG when available, else procedural).
    var farImg = S.cyberFar && S.cyberFar();
    tileLayer(farImg || cache.far, 0.10);

    // 7. Mid city.
    var midImg = S.cyberMid && S.cyberMid();
    tileLayer(midImg || cache.mid, 0.25);

    // 8. Mid-city animated overlays: blinking aviation lights on
    //    antennae, traffic dots zipping along a distant flyover.
    var blink = (t % 60) < 8;
    if (blink) {
      // Red strobes on top of mid-city antennae - positions matched
      // to where the painter put antennae.
      for (var ai = 0; ai < 20; ai++) {
        var aix = ((ai * 47 - camx * 0.25) % 960 + 960) % 960;
        // Re-derive antenna y from the painter's heuristic - close
        // enough for the eye since the strobe is a 1-px dot.
        g.fillStyle = '#ff5a5a';
        g.fillRect(aix % 320, 38 + (ai % 5) * 4, 1, 1);
      }
    }
    // Distant flyover traffic (tiny moving dots at a high parallax).
    for (var tv = 0; tv < 8; tv++) {
      var tvx = ((tv * 67 + t * 0.7 - camx * 0.30) % 380 + 380) % 380 - 30;
      var tvy = 102 + (tv % 2) * 3;
      g.fillStyle = (tv & 1) ? '#ff8080' : '#ffd070';
      g.fillRect(tvx, tvy, 2, 1);
      g.fillStyle = 'rgba(255,160,80,0.5)';
      g.fillRect(tvx - 2, tvy, 2, 1);
    }

    // 9. Bridge / street.
    var brImg = S.cyberBridge && S.cyberBridge();
    tileLayer(brImg || cache.bridge, 0.50);

    // 10. Lamp post halos (warm pools of light under each lamp).
    var lampSpacing = 80;
    var lampFactor = 0.50;
    var lampStart  = -(((camx * lampFactor) % lampSpacing) + lampSpacing) % lampSpacing;
    for (var lp = lampStart - lampSpacing; lp < 320 + lampSpacing; lp += lampSpacing) {
      var lpx = lp + 40;
      var halo = g.createRadialGradient(lpx, 96, 2, lpx, 96, 22);
      halo.addColorStop(0,   'rgba(255,220,140,0.55)');
      halo.addColorStop(0.5, 'rgba(255,180,90,0.20)');
      halo.addColorStop(1,   'rgba(255,180,90,0)');
      g.fillStyle = halo;
      g.fillRect(lpx - 24, 92, 48, 32);
      // Bright lamp bulb.
      g.fillStyle = '#fff4c0';
      g.fillRect(lpx - 1, 93, 2, 2);
    }

    // 11. Steam plumes rising from the road grates (animated).
    for (var sm = 0; sm < 4; sm++) {
      var smx = ((sm * 90 + 30 - camx * 0.50) % 320 + 320) % 320;
      var smPhase = (t * 0.6 + sm * 30) % 60;
      for (var sk = 0; sk < 5; sk++) {
        var sy = 132 - sk * 4 - smPhase * 0.4;
        var swth = 4 + sk * 1;
        var alpha = 0.32 - sk * 0.05 - smPhase * 0.004;
        if (alpha < 0.04) continue;
        g.fillStyle = 'rgba(200,210,230,' + alpha.toFixed(2) + ')';
        g.fillRect(smx - swth / 2 + Math.sin(sy * 0.2) * 2, sy, swth, 2);
      }
    }

    // 12. Magenta + cyan neon haze sweep across the mid-frame for that
    //    Tokyo dawn vibe. Drawn LAST in the sky pass so it tints
    //    everything beneath.
    var hazeM = g.createLinearGradient(0, 70, 0, 130);
    hazeM.addColorStop(0,   'rgba(255,90,200,0.00)');
    hazeM.addColorStop(0.5, 'rgba(255,90,200,0.10)');
    hazeM.addColorStop(1,   'rgba(255,90,200,0.00)');
    g.fillStyle = hazeM; g.fillRect(0, 70, 320, 60);
    var hazeC = g.createLinearGradient(0, 100, 0, 150);
    hazeC.addColorStop(0,   'rgba(90,220,255,0.00)');
    hazeC.addColorStop(0.5, 'rgba(90,220,255,0.12)');
    hazeC.addColorStop(1,   'rgba(90,220,255,0.00)');
    g.fillStyle = hazeC; g.fillRect(0, 100, 320, 50);
  }

  function drawForeground_cyber(g, camx, camy, prog, t) {
    var S = SDD.sprites || {};
    var fgImg = S.cyberFg && S.cyberFg();
    var src = fgImg || _cyBuild().fg;
    var span = src.width || 320, off = -(((camx * 0.70) % span) + span) % span;
    for (var b = off - span; b < 320 + span; b += span) {
      g.drawImage(src, b, 0);
    }
    // Animated overlays: blinking neon signs (a few of them flicker),
    // raindrops dripping past the screen edges, occasional bird/heli
    // silhouette flying across.
    // Flicker: re-paint a small white pulse over ~3 randomized sign
    // positions every few frames.
    for (var f = 0; f < 3; f++) {
      var fseed = (t / 20 | 0 + f * 13) & 7;
      if (fseed > 4) continue;
      var fxx = ((f * 233 - camx * 0.70 + 60) % 320 + 320) % 320;
      var fyy = 18 + (f * 7) % 20;
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(fxx, fyy, 14, 1);
    }
    // Helicopter silhouette occasionally crossing the top.
    var hi = ((t * 0.5) % 600);
    if (hi < 320 + 40) {
      var hx = hi - 40;
      g.fillStyle = '#0a0a18';
      g.fillRect(hx, 12, 14, 4);
      g.fillRect(hx + 4, 11, 6, 2);
      g.fillRect(hx + 14, 13, 4, 1);              // tail
      // Spinning rotor (alternating frame).
      g.fillStyle = '#1a1a28';
      if ((t / 2 | 0) & 1) g.fillRect(hx - 2, 10, 18, 1);
      else                 g.fillRect(hx + 7, 9, 1, 4);
      // Tail rotor blink.
      g.fillStyle = '#ff4040';
      if ((t / 8 | 0) & 1) g.fillRect(hx + 17, 13, 1, 1);
    }
    // Soft edge vignette for cinematic frame.
    var vg = g.createLinearGradient(0, 0, 30, 0);
    vg.addColorStop(0, 'rgba(8,8,20,0.55)');
    vg.addColorStop(1, 'rgba(8,8,20,0)');
    g.fillStyle = vg; g.fillRect(0, 0, 30, 180);
    var vg2 = g.createLinearGradient(290, 0, 320, 0);
    vg2.addColorStop(0, 'rgba(8,8,20,0)');
    vg2.addColorStop(1, 'rgba(8,8,20,0.55)');
    g.fillStyle = vg2; g.fillRect(290, 0, 30, 180);
  }

  var THEMES = {
    'galactic': function (g, x, y, p, t) { drawSkyGalactic(g, x, y, t); },
    'sky': drawSky_sky,
    'sea-surface': drawSky_sea_surface,
    'rocky': drawSky_rocky,
    'forest': drawSky_forest,
    'sunlit': drawSky_sunlit,
    'cosmic-night': drawSky_cosmic_night,
    'bird-sky': drawSky_bird_sky,
    'seaside': drawSky_seaside,
    'savanna': drawSky_savanna,
    'village-dusk': drawSky_village_dusk,
    'eden': drawSky_eden,
    'bugscale': drawSky_bugscale,
    'cyber': drawSky_cyber
  };

  // Per-theme foreground layer (drawn AFTER entities, BEFORE HUD). Only
  // themes that need an overlapping layer for parallax depth register
  // here; missing entries are no-ops. Mirror of THEMES dispatch.
  var FOREGROUNDS = {
    'cyber': drawForeground_cyber
  };

  // Comedian loading-screen quips - random pick per stageintro card.
  // Mark-approved set of 22: gameplay advice + Christian encouragement +
  // corny humor. Each entry is an array of 1 to 3 lines (~32 chars max
  // per line so they fit inside the cyan-bordered box without wrapping).
  // Easy to swap any line in place - the random pick reads from this
  // array verbatim.
  var QUIPS = [
    // Gameplay advice
    'Collect 20 power cores for an extra life!',
    'Patience helps a lot.',
    'Sometimes the safest jump is the one you wait for.',
    "Take your time. The level isn't going anywhere.",
    'Even Super Dude Danny misses jumps.',
    'Down + A drops you through one-way platforms.',
    'Touch the flag - every checkpoint saves your spot.',
    "Some enemies can't be stomped. Use the blast.",
    'Bonk yellow blocks with your head for power-ups.',
    'Star Jump gives you extra hops mid-air.',
    'Pearl Shell soaks one hit. Wear it through the tough part.',
    'If a level feels impossible, try Easy mode - no shame.',
    // Christian encouragement
    'God created the world one day at a time.',
    "You don't have to be perfect - God already is.",
    'Be still and know. - Psalm 46:10',
    'His mercies are new every morning.',
    'God made you on purpose.',
    'Even the bees are part of His plan.',
    'I can do all things through Christ who strengthens me.',
    // Light humor
    'Why was Adam great at sports? He was first in the human race.',
    'Noah took stocks out of a sinking ship and floated them.',
    "Super Dude Danny tried to walk on water. He's working on it.",
    "Why don't time machines run on Sundays? Even they need a rest day."
  ];
  function pickQuip() { return QUIPS[Math.floor(Math.random() * QUIPS.length)]; }

  // Lower-thirds tooltip bar - thin dark band pinned near the bottom of
  // the 180-tall world canvas, with a cyan accent strip on the left and
  // the quip centered in italic vector text. Always one line tall - all
  // 22 quips are flat single-line strings so the bar's visual height is
  // consistent across picks. `offX` lets the caller slide the bar in/out
  // alongside other UI (stageintro's card swipe).
  //
  // The quip uses ctx.fillText (italic 8px sans-serif) rather than the
  // 5x7 pixel font because that font can't render true italic, and Mark
  // asked for smaller + italic + centered. Text rasterizes crisply under
  // the 3x world-canvas transform because imageSmoothingEnabled=false
  // only affects image scaling, not glyph rasterization.
  function drawQuipBar(g, quip, offX) {
    if (!quip) return;
    offX = offX || 0;
    var h = 16;
    var y = 178 - h - 8;        // raised ~6px off the bottom edge (Mark)
    var x = 6 + offX, w = 308;
    g.fillStyle = 'rgba(8,8,20,0.82)';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#46f0ff';
    g.fillRect(x, y, 3, h);
    g.fillStyle = 'rgba(70,240,255,0.40)';
    g.fillRect(x + 3, y, w - 3, 1);
    g.fillRect(x + 3, y + h - 1, w - 3, 1);
    g.save();
    g.fillStyle = '#dfe6ff';
    g.font = 'italic 8px sans-serif';
    g.textBaseline = 'middle';
    g.textAlign = 'center';
    g.fillText(quip, x + w / 2, y + h / 2 + 1);
    g.restore();
  }

  // =====================================================================
  // STAGE INTRO - swipe-in card shown briefly between overworld + level.
  // Pass 10 round 2 (Mark): "whenever a stage is selected, maybe there
  // should be a small little transition between the overworld and the
  // stage, maybe a transition card or something that swipes."
  // =====================================================================
  SDD.scenes.stageintro = {
    enter: function (d) {
      d = d || {};
      this.day = d.day || 1;
      this.stage = d.stage || 1;
      this.t = 0;
      var lvl = SDD.levels[this.day + '-' + this.stage];
      this.title = (SDD.save.stagesForDay(this.day) > 1)
        ? ('DAY ' + this.day + '-' + this.stage)
        : ('DAY ' + this.day);
      this.subtitle = (lvl && lvl.name) || '';
      this.quip = pickQuip();
    },
    update: function () {
      this.t++;
      // 30f slide-in + 180f hold + 30f slide-out, then jump into level.
      // Hold bumped to 180 frames (~3 sec) so the comedian quip has
      // plenty of time to land before the card swipes off (Mark:
      // "leave the title card up for one more second"). Confirm still
      // skips instantly.
      if (this.t >= 240 || In.confirm()) {
        go('level', { day: this.day, stage: this.stage });
      }
    },
    render: function (g) {
      // Black background with a soft starfield so the transition reads
      // as "leaving the overworld for somewhere new."
      g.fillStyle = '#0a0a18';
      g.fillRect(0, 0, 320, 180);
      drawStarfield(g, this.t * 2);

      // Card slide animation: x offset goes from +320 (off-screen right)
      // to 0 (centered) over t=0..30, holds at 0 for 30-210, then to -320
      // for 210-240.
      var offX = 0;
      if (this.t < 30) {
        // ease-out cubic from 320 to 0
        var u = this.t / 30;
        offX = Math.round(320 * Math.pow(1 - u, 3));
      } else if (this.t > 210) {
        var u2 = (this.t - 210) / 30;
        offX = -Math.round(320 * Math.pow(u2, 3));
      }

      // Banner ribbon
      var ribbonY = 70;
      g.fillStyle = 'rgba(8,8,20,0.7)';
      g.fillRect(0 + offX, ribbonY, 320, 36);
      g.fillStyle = '#ffd23a';
      g.fillRect(0 + offX, ribbonY,      320, 1);
      g.fillRect(0 + offX, ribbonY + 35, 320, 1);

      tsh(g, this.title, 160 + offX, ribbonY + 6, '#ffd23a', '#a8631a', 2, 'center');
      if (this.subtitle) {
        text(g, this.subtitle, 160 + offX, ribbonY + 24, '#dfe6ff', 1, 'center');
      }

      // Lower-thirds quip bar - slides with the card so it tracks the
      // ribbon's swipe-in / swipe-out.
      drawQuipBar(g, this.quip, offX);

      // Streaks behind the card during slide-in for motion sense
      if (this.t < 30 && (this.t % 2) === 0) {
        g.fillStyle = '#46f0ff';
        for (var s = 0; s < 6; s++) {
          var sx = (offX + 80 + s * 50) % 320;
          g.fillRect(sx, 90 + s * 2, 16, 1);
        }
      }
    }
  };

  // Friendly display names for active signatures (HUD).
  var SIG_LABELS = {
    sunburst: 'SUN', cloudglide: 'GLIDE', pearl: 'PEARL',
    flamedash: 'FLAME', leafshot: 'LEAF', sunshield: 'SHIELD',
    starjump: 'STAR', airbubble: 'BUBBLE',
    callinghorn: 'HORN', friendlybugs: 'FRIENDS',
    pollentrail: 'POLLEN',
    doveblessing: 'DOVE'
  };
  // Pass 12 (Mark): each signature shows a 4-second hint banner on
  // pickup with its name and a one-line tip on how to use it. Without
  // this, kids don't know what they just grabbed or how to trigger it.
  var SIG_HINTS = {
    sunburst:        { name: 'SUNBURST!',     tip: 'RUN INTO BAD GUYS TO ZAP THEM!' },
    cloudglide:      { name: 'CLOUD GLIDE!',  tip: 'JUMP, THEN HOLD A TO FLOAT DOWN!' },
    pearl:           { name: 'PEARL SHELL!',  tip: 'BAD GUYS HIT THE SHELL, NOT YOU!' },
    flamedash:       { name: 'FLAME DASH!',    tip: 'RUN SUPER FAST - MIND THE GAPS!' },
    leafshot:        { name: 'LEAF SHOT!',    tip: 'PRESS B TO THROW LEAVES!' },
    sunshield:       { name: 'SUN SHIELD!',   tip: 'SUN FLARES BOUNCE RIGHT OFF YOU!' },
    starjump:        { name: 'STAR JUMP!',    tip: 'JUMP, THEN A AGAIN AND AGAIN IN THE AIR!' },
    airbubble:       { name: 'AIR BUBBLE!',   tip: 'SMALL SEA CRITTERS CAN\'T TOUCH YOU!' },
    callinghorn:     { name: 'CALLING HORN!', tip: 'ALL ENEMIES FREEZE WHERE THEY STAND!' },
    friendlybugs:    { name: 'FRIENDLY BUGS!',tip: 'BEES AND BEETLES WALK RIGHT PAST YOU!' },
    pollentrail:     { name: 'POLLEN TRAIL!', tip: 'POWER CORES FLY TOWARDS YOU!' },
    doveblessing:    { name: 'DOVE BLESSING!',tip: 'POWER CORES RAIN DOWN FROM THE SKY!' }
  };

  SDD.scenes.level = {
    enter: function (d) {
      this.day = (d && d.day) || 1;
      this.stage = (d && d.stage) || 1;
      this.difficulty = SDD.save.curDifficulty();
      // Easy mode runs with unlimited lives. Med + Hard carry lives
      // ACROSS stages within a run (Mark feedback: "lives don't carry
      // over"). SDD.runLives is set to 3 at game start / after a
      // game-over and decremented on death; level.enter reads it here.
      if (this.difficulty === 'easy') {
        this.lives = Infinity;
      } else {
        if (typeof SDD.runLives !== 'number' || SDD.runLives <= 0) SDD.runLives = 3;
        this.lives = SDD.runLives;
      }
      // Cleared on fresh entry into the stage; preserved across
      // death respawns inside the same attempt. Both the recall
      // position AND the per-checkpoint triggered-key set have to
      // reset on re-entry - otherwise a game-over + return + re-enter
      // leaves triggeredCheckpoints populated (so the flag renders
      // as already-raised) while lastCheckpoint is null (so death
      // does NOT actually recall the player). That mismatch is the
      // "flag stays active but doesn't recall" bug.
      this.lastCheckpoint = null;
      this.triggeredCheckpoints = [];
      this.loadLevel();
      // Per-level music key (e.g. 'level_3_2'). Audio loader picks a
      // variant (a/b/c) at random if multiple exist. Falls back to the
      // generic 'level' chiptune for biomes without a track yet.
      A.startMusic('level_' + this.day + '_' + this.stage);
    },

    loadLevel: function () {
      var L = SDD.levels[this.day + '-' + this.stage] || SDD.level1, T = C.TILE;
      // Tile rows can be either arrays of chars (hand-authored levels)
      // or strings (editor-serialised levels). Normalise to arrays so
      // TileMap.set mutations (e.g. ? -> U on hit) actually persist.
      var grid = L.tiles.map(function (r) { return typeof r === 'string' ? r.split('') : r.slice(); });
      this.map = new E.TileMap(grid);
      this.gravityScale = L.gravityScale || 1;
      this.skyTheme = L.skyTheme || null;
      this.theme = L.theme || null;
      // Optional control hint shown briefly on level entry (e.g. vines,
      // flappy). Cleared after ~4s of play so it doesn't linger.
      this.hint = L.hint || null;
      // Mode flags - Player.update reads these via the level reference
      // it gets each frame.
      this.flappy = !!L.flappy;
      this.flappySpeed = L.flappySpeed;
      this.flappyFlap = L.flappyFlap;
      this.flappyGravity = L.flappyGravity;
      this.flappyMaxFall = L.flappyMaxFall;
      this.underwater = !!L.underwater;
      this.topDeath = !!L.topDeath;
      this.themeZones = L.themeZones || null;
      this.enemies = []; this.platforms = []; this.items = [];
      this.projectiles = []; this.particles = [];
      this.cores = 0; this.score = 0; this.timeSteps = 0;
      this.livesPulseT = 0;
      this.state = 'play'; this.deathHandled = false;
      this.winTimer = 0; this.goTimer = 0;
      // Pass 12 (Mark): hint banner shown for ~4s when a signature
      // activates, explaining what the power does + how to use it.
      this.sigHintT = 0; this.sigHintKind = null; this.lastSigKind = null;
      this.pauseIdx = 0;

      // Theme -> per-enemy-type visual variant. Lets each biome have
      // its own consistent enemy archetypes that match the background.
      var THEME_VARIANTS = {
        'galactic':     { walker: null,    wisp: null,   thrower: null   }, // current shadow set
        'sky':          { walker: 'cloud', wisp: 'bird', thrower: 'rain' },
        'sea-surface':  { walker: 'clam',  wisp: 'bird', thrower: 'rain' },
        'rocky':        { walker: 'rock',  wisp: 'smoke', thrower: 'rock' },
        'forest':       { walker: 'leaf',  wisp: 'leaf', thrower: 'seed' },
        'sunlit':       { walker: 'flame', wisp: 'star', thrower: 'sun'  },
        'cosmic-night': { walker: null,    wisp: 'star', thrower: null   },
        'bird-sky':     { walker: 'cloud', wisp: 'bird', thrower: 'rain' },
        'seaside':      { walker: 'clam',  wisp: 'jellyfish', thrower: 'rain' },
        'savanna':      { walker: 'lion',  wisp: 'bird', thrower: 'rock' },
        'village-dusk': { walker: 'leaf',  wisp: 'bat',  thrower: 'fruit'},
        'eden':         { walker: 'leaf',  wisp: 'leaf', thrower: 'fruit'},
        'bugscale':     { walker: 'beetle', wisp: 'bee', thrower: 'seed' }
      };
      var variants = THEME_VARIANTS[this.theme] || {};
      for (var i = 0; i < L.spawns.length; i++) {
        var s = L.spawns[i], e;
        if (s.type === 'player') {
          e = new SDD.ent.Player(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          // Flappy stages override the collision box (sprite unchanged)
          // so brushes-past don't register as wall hits. Per-size values
          // live in the level data; editor.js exposes sliders for tuning.
          if (this.flappy) {
            var hb = L.flappySmallHitbox || { dx: 2, w: 9, h: 19 };
            e.x += (hb.dx || 0); e.w = hb.w; e.h = hb.h;
          }
          this.player = e;
        } else if (s.type === 'walker') {
          e = new SDD.ent.Walker(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          // Per-spawn variant override (Mark: lions + porcupines side
          // by side in savanna), else default to the theme variant.
          e.variant = s.variant || variants.walker;
          // Savanna predators: too tough to stomp or zap. The player
          // has to avoid them instead.
          if (e.variant === 'lion' || e.variant === 'porcupine') {
            e.stompable = false; e.unkillable = true;
          }
          this.enemies.push(e);
        } else if (s.type === 'thrower') {
          e = new SDD.ent.Thrower(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          e.variant = variants.thrower;
          this.enemies.push(e);
        } else if (s.type === 'wisp') {
          e = new SDD.ent.Wisp(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = s.ty * T + 8 - e.h / 2;
          // Per-spawn `kind` override beats the theme default so a
          // level can drop a specific creature (e.g. piranha in 2-2)
          // without changing the biome's theme roster.
          e.variant = s.kind || s.variant || variants.wisp;
          // Patrol range: piranhas need a wider beat so they cover a
          // meaningful stretch of their water section; default for
          // other wisps stays ±26 px.
          var wR = s.range || (e.variant === 'piranha' ? 56 : 26);
          e.homeY = e.y; e.minX = e.x - wR; e.maxX = e.x + wR;
          // Shooter wisps always render as storm clouds so the player
          // can tell at a glance which wisps are dangerous (vs the
          // harmless theme-coloured flyers).
          if (s.shoots) { e.shoots = true; e.variant = 'stormcloud'; }
          this.enemies.push(e);
        } else if (s.type === 'crab') {
          e = new SDD.ent.Crab(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          this.enemies.push(e);
        } else if (s.type === 'core') {
          e = new SDD.ent.Core(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = s.ty * T + 8 - e.h / 2; e.baseY = e.y;
          this.items.push(e);
        } else if (s.type === 'item') {
          // Level-placed hovering pickup (e.g. a grow "globe" near the
          // start of a flappy/underwater stage so a small Danny can
          // grow). kind defaults to 'grow'.
          e = new SDD.ent.ItemDrop(s.tx * T + 1, s.ty * T, s.kind || 'grow', true);
          e.emerge = 0;
          this.items.push(e);
        } else if (s.type === 'timepart') {
          // Each stage drops a different piece of the time machine.
          // Variant key = day-stage so each part can render with a
          // unique palette/shape.
          e = new SDD.ent.TimePart(0, 0, this.day + '-' + this.stage);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h; e.baseY = e.y;
          this.items.push(e);
        } else if (s.type === 'npc') {
          e = new SDD.ent.NPC(0, 0, s.kind || 'adam', s.line);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          // Sync baseY with the post-spawn y so decorative animals (deer
          // / lion / dove) don't snap back to baseY=0 on every update()
          // tick - the constructor receives (0,0) and locks baseY there.
          e.baseY = e.y;
          this.items.push(e);
        } else if (s.type === 'skyhazard') {
          // periodic projectile spawner placed in the level data
          e = new SDD.ent.HazardSpawner(
            s.tx * T + 8, s.ty * T + 8,
            s.kind || 'flare', s.period || 90, s.dir || 1,
            s.scale || 1);
          e.tx = s.tx; e.ty = s.ty;                        // for nozzle decoration
          this.enemies.push(e);
        } else if (s.type === 'leafstream') {
          // Day 6-2: invisible spawner that streams falling-leaf
          // platforms downward through a vertical gap.
          e = new SDD.ent.LeafSpawner(
            s.tx * T + 8, s.ty * T + 8,
            s.period || 70, s.fallSpeed || 1.0,
            (s.swayAmp != null) ? s.swayAmp : 2);
          this.enemies.push(e);
        } else if (s.type === 'bubble') {
          e = new SDD.ent.BubbleUp(s.tx * T + 1, (s.ty || 1) * T, s.scale || 1);
          this.enemies.push(e);
        } else if (s.type === 'octopus') {
          e = new SDD.ent.Octopus(s.tx * T, s.ty * T);
          this.enemies.push(e);
        } else if (s.type === 'twister') {
          e = new SDD.ent.Twister(s.tx * T, (s.ty || 4) * T, s.scale || 1);
          if (s.spd) e.vx = s.spd;
          this.enemies.push(e);
        } else if (s.type === 'eel') {
          // Day 5-2 electric eel - sits in a socket on the sea floor
          // and rises periodically. s.ty = floor row (its socket top).
          e = new SDD.ent.ElectricEel(s.tx * T, s.ty * T, {
            maxH:   s.maxH,
            period: s.period,
            phase:  s.phase
          });
          this.enemies.push(e);
        } else if (s.type === 'stampede') {
          // Day 6-1 wildebeest stampede - 8 tile wide x 1 tile tall
          // moving wall. Unkillable, hurts on touch. range = patrol
          // radius in tiles around the spawn column.
          var range = (s.range != null ? s.range : 24);
          e = new SDD.ent.Stampede(s.tx * T, s.ty * T, {
            dir: s.dir || -1,
            spd: s.spd || 2.0,
            minX: (s.tx - range) * T,
            maxX: (s.tx + range) * T + 8 * T
          });
          this.enemies.push(e);
        } else if (s.type === 'checkpoint') {
          // Designer-placed flag near each stage's midpoint. Easy +
          // medium difficulty respawn here on death; hard ignores it.
          e = new SDD.ent.Checkpoint(s.tx * T + 2, (s.ty + 1) * T - 24, s.tx, s.ty);
          // Restore triggered state across death-respawn so the kid
          // doesn't have to re-walk past the checkpoint after dying.
          var ckey = s.tx + ',' + s.ty;
          if (this.triggeredCheckpoints && this.triggeredCheckpoints.indexOf(ckey) >= 0) {
            e.triggered = true; e.raiseT = 20;
          }
          this.items.push(e);
        } else if (s.type === 'signature') {
          // Per-stage themed power-up. `kind` selects the effect logic
          // (e.g. 'sunburst' for Day 1). Stage key tints the pickup with
          // the same palette as that stage's time-machine part.
          e = new SDD.ent.Signature(s.tx * T + 1, s.ty * T, s.kind, this.day + '-' + this.stage);
          this.items.push(e);
        } else if (s.type === 'car') {
          // Adventure City (Day 8-1) single-shot car. Mostly used for
          // editor placement / debugging; production runs use carspawner.
          e = new SDD.ent.Car(s.tx * T, s.ty * T, {
            dir: s.dir || -1,
            spd: s.spd,
            color: s.color,
            warnT: (s.warnT != null) ? s.warnT : 30
          });
          this.enemies.push(e);
        } else if (s.type === 'carspawner') {
          // Adventure City: invisible periodic car emitter. Each tick
          // pushes a fresh Car into level.enemies. Lane Y is the spawn
          // tile row (8/10/13 for high-sky / low-sky / ground).
          e = new SDD.ent.CarSpawner(s.tx * T, s.ty * T, {
            dir: s.dir || -1,
            spd: s.spd,
            color: s.color,
            period: s.period || 180,
            phase: s.phase || 0
          });
          this.enemies.push(e);
        }
        // Optional pixel-level nudge from the editor (offsetX/offsetY).
        // Lets a designer slide a lava plume or any spawn off-grid by
        // individual pixels without changing its tile column/row.
        if (e && (s.offsetX || s.offsetY)) {
          e.x += s.offsetX || 0;
          e.y += s.offsetY || 0;
        }
        // Pass 12 (Mark): per-spawn `scale` flows through to the
        // entity for type-specific draw scaling. Implemented for
        // skyhazard (lava plume / crater) so far; other types are
        // pass-through until each entity's draw supports it.
        if (e && s.scale && s.scale !== 1) e.scale = s.scale;
      }
      // Per-theme platform skin so movers don't all look like the
      // same brass plank everywhere (Mark: "all the platforms looking
      // the same on every level is a little strange"). Unknown
      // themes (or themes with no variant) fall back to the default.
      var PLAT_VARS = {
        // Pass 10 round 2 (Mark): Day 1 wooden planks felt out-of-world.
        // Switch to the cosmic constellation-band plate variant that
        // already exists for the 'cosmic-night' theme.
        'galactic':     'cosmic',
        'sky':          'cloud',
        'sea-surface':  'raft',
        'rocky':        'stone',
        'forest':       null,            // 3-2 has no movers; safe fallback
        'sunlit':       'sunbeam',
        'cosmic-night': 'cosmic',
        'bird-sky':     'cloud',
        'seaside':      'raft',
        'savanna':      'bone',
        'village-dusk': 'cart',
        'eden':         'eden'
      };
      var platVariant = PLAT_VARS[this.theme] || null;
      for (var m = 0; m < L.movers.length; m++) {
        var mv = L.movers[m];
        var plat = new SDD.ent.MovPlat(mv.tx * T, mv.ty * T,
          { x1: mv.tx1 * T, y1: mv.ty1 * T, spd: mv.spd, phase: mv.phase });
        if (platVariant) plat.variant = platVariant;
        this.platforms.push(plat);
      }
      // Easy mode tuning: slow every moving platform to 60% speed and
      // widen them by 50% (Pass 10 r2 follow-up - Mark: "in easy mode
      // increase the size of moving platforms by 1.5"). Wider sprite
      // stretches via 5-arg drawImage; collisions follow the new plat.w.
      // Med + Hard keep the authored values.
      if (this.difficulty === 'easy') {
        for (var ep = 0; ep < this.platforms.length; ep++) {
          var pe = this.platforms[ep];
          pe.spd *= 0.6;
          var extra = Math.round(pe.w * 0.5);
          pe.w += extra;
          // Recenter horizontally so the new width grows symmetrically
          // and the platform's mid-line stays where the kid expects.
          var shift = Math.round(extra / 2);
          pe.x -= shift; pe.x0 -= shift; pe.x1 -= shift;
        }
      }
      this.camera = new E.Camera();
      // If we're respawning into this level from a death AND we have
      // a checkpoint AND the difficulty respects checkpoints, teleport
      // the freshly-spawned player onto the flag before snapping the
      // camera. Hard mode ignores checkpoints by design.
      if (this.lastCheckpoint && this.difficulty !== 'hard' && this.player) {
        this.player.x = this.lastCheckpoint.x;
        this.player.y = this.lastCheckpoint.y;
        this.player.vx = 0; this.player.vy = 0;
      }
      this.camera.snap(this.player, this.map);
      // god mode: start powered up
      if (SDD.save.data.options.god && this.player) {
        this.player.grow();
        this.player.giveBlast();
      }
    },

    // ---- level callbacks used by entities ----
    spawnBlast: function (x, y, dir, kind) { this.projectiles.push(new SDD.ent.Blast(x, y, dir, kind)); },
    spawnOrb: function (x, y, dir) { this.projectiles.push(new SDD.ent.Orb(x, y, dir)); },
    hitBlock: function (tx, ty, code) {
      if (code === '?') {
        this.map.set(tx, ty, 'U'); this.gainCores(1); this.score += 50;
        this.burst(tx * 16 + 8, ty * 16 + 4, '#46f0ff', 6); A.sfx('core');
      } else if (code === 'G') {
        this.map.set(tx, ty, 'U');
        this.items.push(new SDD.ent.ItemDrop(tx * 16 + 1, ty * 16 - 2, 'grow'));
        A.sfx('block');
      } else if (code === 'B') {
        this.map.set(tx, ty, 'U');
        this.items.push(new SDD.ent.ItemDrop(tx * 16 + 1, ty * 16 - 2, 'blast'));
        A.sfx('block');
      }
    },
    // Add cores AND award 1up for every 20-core boundary crossed.
    // Player keeps the cores - the bonus is purely for efficiency.
    gainCores: function (n) {
      var before = this.cores;
      this.cores += n;
      var bonuses = Math.floor(this.cores / 20) - Math.floor(before / 20);
      if (bonuses > 0) {
        this.lives += bonuses;
        A.sfx('1up');
        // Small inline animation at the lives counter (Mark Pass 9:
        // "no need to have such a giant 1up sign - just a little
        // animation at the life counter"). drawHUD reads livesPulseT
        // and draws a floating '+1' next to the LIVES number.
        this.livesPulseT = 70;
      }
    },
    burst: function (x, y, color, n) {
      for (var i = 0; i < n; i++) {
        this.particles.push({
          x: x, y: y, vx: E.randRange(-1.6, 1.6), vy: E.randRange(-2.4, -0.4),
          life: E.randInt(16, 30), max: 30, color: color, size: E.randInt(1, 2)
        });
      }
    },

    completeLevel: function () {
      if (this.state !== 'play') return;
      this.state = 'won'; this.winTimer = 0;
      this.player.victory();
      // Persist lives so they carry into the next stage (Mark).
      if (this.difficulty !== 'easy') SDD.runLives = this.lives;
      A.stopMusic(); A.sfx('win');
      this.burst(this.player.x + 5, this.player.y, '#ffd23a', 14);
    },

    finish: function () {
      var timeSec = Math.floor(this.timeSteps / 60);
      // Day 8 (Adventure City secret stage) sits OUTSIDE the linear
      // overworld progression - reaching the Towers fires its own
      // cityArrival cutscene instead of recordStage + results. The
      // secretCleared flag is set inside cityArrival's exit.
      if (this.day === 8) {
        A.stopMusic();
        go('cityArrival', { timeSec: timeSec, cores: this.cores, lives: this.lives });
        return;
      }
      SDD.save.recordStage(this.day, this.stage, timeSec, this.cores);
      if (this.day === 7) {
        A.stopMusic();
        go('finale', { timeSec: timeSec, cores: this.cores, lives: this.lives });
      } else {
        go('results', {
          day: this.day, stage: this.stage,
          timeSec: timeSec, cores: this.cores, lives: this.lives
        });
      }
    },

    stepWorld: function () {
      var i;
      if (this.state === 'play' && !this.player.dead) this.timeSteps++;
      if (this.livesPulseT > 0) this.livesPulseT--;
      // Flappy auto-win: in flappy mode the player can't backtrack, so
      // missing the timepart icon would soft-lock them at the wall.
      // Reaching the right edge of the map counts as a win (Mark
      // playtest: "you should be able to win by getting to the end of
      // the map, not touching the icon").
      if (this.flappy && this.state === 'play' && this.player &&
          this.player.x > this.map.pxW - 24) {
        this.completeLevel();
      }
      // Day 5-1 (Wings of Day): ramp gravity from light at the start
      // toward normal over the first ~30 seconds so the kid eases
      // into the flappy controls (Mark: "the character falls too
      // fast at the beginning, gravity should increase").
      if (this.day === 5 && this.stage === 1) {
        var rampP = Math.min(1, this.timeSteps / 1800);
        this.gravityScale = 0.55 + rampP * 0.45;
      }
      for (i = 0; i < this.platforms.length; i++) this.platforms[i].update();
      this.player.update(this);
      // Calling-horn signature (Day 6-1): freezes every enemy in their
      // tracks for the duration. Projectiles + items still tick.
      var horned = this.player && this.player.signatureKind === 'callinghorn';
      if (!horned) {
        for (i = 0; i < this.enemies.length; i++) this.enemies[i].update(this);
      }
      // Dove-blessing signature (Day 7-1): power cores rain down from
      // the canopy as Danny walks - a celebratory final-day reward.
      if (this.player && this.player.signatureKind === 'doveblessing' &&
          (this.player.signatureT % 22) === 0) {
        var px = this.player.x + (this.player.facing > 0 ? 18 : -8) + Math.round((Math.random() - 0.5) * 32);
        var py = this.player.y - 32 + Math.round((Math.random() - 0.5) * 8);
        var newCore = new SDD.ent.Core(0, 0);
        newCore.x = px; newCore.y = py; newCore.baseY = py;
        this.items.push(newCore);
      }
      for (i = 0; i < this.items.length; i++) this.items[i].update(this);
      for (i = 0; i < this.projectiles.length; i++) this.projectiles[i].update(this);
      for (i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        p.vy += 0.13; p.x += p.vx; p.y += p.vy; p.life--;
      }
      this.collisions();
      // Detect a freshly-activated signature so we can show a hint
      // banner for the first few seconds (what + how-to-use).
      var curSig = this.player && this.player.signatureKind;
      if (curSig && curSig !== this.lastSigKind) {
        this.sigHintKind = curSig;
        this.sigHintT = 240;                          // 4 seconds
      }
      this.lastSigKind = curSig;
      if (this.sigHintT > 0) this.sigHintT--;
      // cull - in-place two-pointer compaction so we don't allocate a
      // fresh array (+ closure) every frame for each list. The
      // entity/projectile/particle lists run at 60 fps each.
      compactInPlace(this.enemies,     keepNotRemoved);
      compactInPlace(this.items,       keepNotRemoved);
      compactInPlace(this.projectiles, keepNotRemoved);
      compactInPlace(this.particles,   keepAlive);
      // Transient platforms (LeafFall etc.) set remove=true once
      // they fall off the bottom of the level. Static MovPlats never
      // set remove, so this only culls the streaming ones.
      compactInPlace(this.platforms,   keepNotRemoved);
      this.camera.follow(this.player, this.map);
    },

    collisions: function () {
      var pl = this.player, i, e;
      // player vs enemies
      if (!pl.dead && !pl.win) {
        for (i = 0; i < this.enemies.length; i++) {
          e = this.enemies[i];
          if (e.dead || e.harmless || !E.overlap(pl, e)) continue;
          // Air-bubble signature (Day 5-2): jellyfish + sea creatures
          // (Wisp) skip the player while the bubble is active.
          if (pl.signatureKind === 'airbubble' && e instanceof SDD.ent.Wisp) continue;
          // Friendly-bugs signature (Day 6-2): bees + beetles (the
          // day's enemy roster) phase through harmlessly.
          if (pl.signatureKind === 'friendlybugs' &&
              (e instanceof SDD.ent.Wisp || e instanceof SDD.ent.Walker)) continue;
          // Sun-burst signature (Day 1): tip says "RUN INTO BAD GUYS
          // TO ZAP THEM" - so on contact, kill the enemy if it's
          // stoppable (zap-immune things like the lion still no-op).
          if (pl.signatureKind === 'sunburst' && !e.unkillable) {
            if (e.zap) e.zap(); else if (e.stomped) e.stomped();
            this.score += 120; A.sfx('blast');
            this.burst(e.x + e.w / 2, e.y + e.h / 2, '#ffd84a', 8);
            continue;
          }
          // Cloud-glide signature (Day 2-1): stomp threshold is gentler
          // so you can bounce on enemies while floating down (Mark
          // feedback: "hovering doesn't let me bounce on enemies").
          var stompVy = (pl.signatureKind === 'cloudglide') ? 0.2 : 1;
          var stomp = e.stompable && pl.vy > stompVy && (pl.y + pl.h - e.y) < 13;
          if (stomp) {
            e.stomped();
            pl.vy = C.STOMP_BOUNCE * (In.held('jump') ? 1.18 : 1);
            this.score += 120; A.sfx('stomp');
            this.burst(e.x + e.w / 2, e.y + e.h / 2, '#b79ce8', 6);
          } else if (pl.invuln <= 0) {
            if (pl.hurt()) {
              pl.vx = (pl.x < e.x ? -1 : 1) * 1.6;
              this.burst(pl.x + pl.w / 2, pl.y + pl.h / 2, '#ff8a6a', 6);
            }
          }
        }
      }
      // player vs items
      for (i = 0; i < this.items.length; i++) {
        e = this.items[i];
        if (e.remove) continue;
        var Ent = SDD.ent;
        if (e instanceof Ent.Core) {
          if (E.overlap(pl, e) && !pl.dead) {
            e.remove = true; this.gainCores(1); this.score += 50;
            A.sfx('core'); this.burst(e.x + e.w / 2, e.y + e.h / 2, '#46f0ff', 5);
          }
        } else if (e instanceof Ent.ItemDrop) {
          if (e.emerge <= 0 && E.overlap(pl, e) && !pl.dead && !pl.win) {
            e.remove = true;
            if (e.kind === 'grow') pl.grow(); else pl.giveBlast();
            this.score += 200;
            this.burst(e.x + e.w / 2, e.y + e.h / 2, '#fff09a', 8);
          }
        } else if (e instanceof Ent.TimePart) {
          if (E.overlap(pl, e) && !pl.dead) this.completeLevel();
        } else if (e instanceof Ent.Signature) {
          if (E.overlap(pl, e) && !pl.dead && !pl.win) {
            e.remove = true;
            pl.giveSignature(e.kind);
            this.score += 200;
            this.burst(e.x + e.w / 2, e.y + e.h / 2, '#ffe890', 10);
          }
        } else if (e instanceof Ent.NPC) {
          if (E.overlap(pl, e) && !pl.dead && !e.gave) {
            e.gave = true; e.bubbleT = 140;
            this.gainCores(3); this.score += 150;
            A.sfx('core');
            this.burst(e.x + e.w / 2, e.y + 4, '#9bf0ff', 6);
          }
        }
      }
      // player blasts vs enemies and orbs
      for (i = 0; i < this.projectiles.length; i++) {
        var pr = this.projectiles[i];
        if (pr instanceof SDD.ent.Blast) {
          for (var j = 0; j < this.enemies.length; j++) {
            e = this.enemies[j];
            if (!e.dead && E.overlap(pr, e)) {
              e.zap(); pr.remove = true; this.score += 120;
              A.sfx('stomp'); this.burst(e.x + e.w / 2, e.y + e.h / 2, '#fff09a', 7);
              break;
            }
          }
          for (var k = 0; k < this.projectiles.length; k++) {
            var o = this.projectiles[k];
            if (o instanceof SDD.ent.Orb && !o.remove && E.overlap(pr, o)) {
              o.remove = true; pr.remove = true;
              this.burst(o.x + 4, o.y + 4, '#fff09a', 5);
            }
          }
        } else if (pr instanceof SDD.ent.Orb ||
                   pr instanceof SDD.ent.SolarFlare ||
                   pr instanceof SDD.ent.Meteor ||
                   pr instanceof SDD.ent.WaterJet ||
                   pr instanceof SDD.ent.LavaPlume) {
          // Signature immunities: flame-dash blocks lava plumes (3-1)
          // - you're wreathed in fire - sun-shield blocks solar flares
          // + meteors (4-1).
          var isLava = pr instanceof SDD.ent.LavaPlume;
          var isFlareLike = pr instanceof SDD.ent.SolarFlare || pr instanceof SDD.ent.Meteor;
          if (pl.signatureKind === 'flamedash' && isLava) continue;
          if (pl.signatureKind === 'sunshield' && isFlareLike) continue;
          if (!pl.dead && !pl.win && pl.invuln <= 0 && E.overlap(pl, pr)) {
            // LavaPlume persists (it's a vertical column, not a single hit)
            if (!isLava) pr.remove = true;
            if (pl.hurt()) this.burst(pl.x + pl.w / 2, pl.y + pl.h / 2, '#ff8a6a', 6);
          }
        }
      }
    },

    update: function () {
      if (this.state === 'paused') { this.updatePaused(); return; }
      if (this.state === 'won') {
        this.winTimer++; this.stepWorld();
        if (this.winTimer > 168) this.finish();
        return;
      }
      if (this.state === 'gameover') {
        this.goTimer++; this.stepWorld();
        if (this.goTimer > 150) go('gameover', { day: this.day });
        return;
      }
      if (In.pressed('pause')) { this.state = 'paused'; this.pauseIdx = 0; A.sfx('pause'); return; }
      this.stepWorld();
      if (this.player.deadDone && !this.deathHandled) {
        this.deathHandled = true;
        // Easy = unlimited lives (Infinity stays Infinity through --).
        if (this.difficulty !== 'easy') { this.lives--; SDD.runLives = this.lives; }
        if (this.lives > 0) { this.loadLevel(); }
        else { this.state = 'gameover'; this.goTimer = 0; A.stopMusic(); A.sfx('gameover'); }
      }
    },

    updatePaused: function () {
      // listNav() writes to state.idx, but the pause scene keys off
      // pauseIdx (to avoid clobbering the level scene's own .idx).
      // Inline the nav so up/down actually moves the cursor.
      var N = 4;                                       // RESUME / RESTART / OPTIONS / QUIT
      if (In.pressed('up'))   { this.pauseIdx = (this.pauseIdx + N - 1) % N; A.sfx('select'); }
      if (In.pressed('down')) { this.pauseIdx = (this.pauseIdx + 1) % N; A.sfx('select'); }
      if (In.pressed('pause')) { this.state = 'play'; A.sfx('pause'); return; }
      if (In.confirm()) {
        A.sfx('confirm');
        if (this.pauseIdx === 0) { this.state = 'play'; }
        else if (this.pauseIdx === 1) {
          // RESTART = the kid wants to redo this stage from scratch:
          // wipe checkpoints + reset lives so it's a true fresh attempt.
          this.lastCheckpoint = null;
          this.triggeredCheckpoints = [];
          this.lives = (this.difficulty === 'easy') ? Infinity : 3;
          this.loadLevel();
        }
        else if (this.pauseIdx === 2) {
          // OPTIONS - jump to the options scene with from='pause' so
          // it returns to this paused state (not re-entering the level
          // which would reset progress/lives).
          go('options', { from: 'pause' });
        }
        else { A.stopMusic(); go('overworld'); }
      }
    },

    // Reused per render so we don't allocate a fresh {x,y} every frame.
    _camView: { x: 0, y: 0 },
    render: function (g) {
      var cam = this._camView;
      cam.x = Math.round(this.camera.x);
      cam.y = Math.round(this.camera.y);
      var prog = E.clamp(this.camera.x / Math.max(1, this.map.pxW - C.VIEW_W), 0, 1);

      // Multi-zone parallax: levels can declare themeZones (Day 6-1
      // does the plains->forest->bug-scale arc). Each zone has a
      // startCol; the active zone is the last one whose startCol is
      // <= the camera position. A 32-px crossfade band between zones
      // smoothly blends the two parallax drawers so the transition
      // doesn't snap. Falls back to the level's single theme if no
      // zones declared.
      if (this.themeZones && this.themeZones.length) {
        var camCol = cam.x / 16;
        var activeIdx = 0;
        for (var zi = 0; zi < this.themeZones.length; zi++) {
          if (camCol + 10 >= this.themeZones[zi].startCol) activeIdx = zi;
        }
        var zone = this.themeZones[activeIdx];
        var nextZone = this.themeZones[activeIdx + 1];
        var activeFn = THEMES[zone.theme] || drawSky;
        activeFn(g, cam.x, cam.y, prog, this.timeSteps);
        // Crossfade INTO the next zone over the last 24 columns
        // before its startCol (the camera approaching the transition).
        if (nextZone) {
          var distToNext = nextZone.startCol - (camCol + 10);
          if (distToNext > 0 && distToNext < 24) {
            var alpha = 1 - (distToNext / 24);    // 0 -> 1 as we approach
            var nextFn = THEMES[nextZone.theme] || drawSky;
            g.save();
            g.globalAlpha = alpha;
            nextFn(g, cam.x, cam.y, prog, this.timeSteps);
            g.restore();
          }
        }
      } else {
        var skyFn = THEMES[this.theme];
        if (skyFn) skyFn(g, cam.x, cam.y, prog, this.timeSteps);
        else drawSky(g, cam.x, cam.y, prog, this.timeSteps);
      }

      // Visible-lava pit layer (Day 3-1 / rocky): bright red still
      // liquid across the bottom of the playable area BEFORE tiles
      // draw. Solid X tiles cover it where ground exists; pits leave
      // the red showing. Mark: "doesn't need to be flowy, it just
      // needs to be like, almost like water, but down."
      if (this.theme === 'rocky') {
        var groundPx = (this.map.h - 3) * 16;             // top of solid ground row
        var lavaY = groundPx + 4 - cam.y;
        var ph = (this.timeSteps * 0.06);
        // Solid red body
        g.fillStyle = '#7a1a08';
        g.fillRect(0, Math.round(lavaY + 6), 320, 24);
        g.fillStyle = '#c83214';
        g.fillRect(0, Math.round(lavaY + 2), 320, 6);
        g.fillStyle = '#ff4020';
        g.fillRect(0, Math.round(lavaY), 320, 3);
        // Sparse calm shimmer dots that pulse slowly instead of waving
        for (var lx = 0; lx < 320; lx += 16) {
          var pulse = (Math.sin(lx * 0.08 + ph) + 1) * 0.5;
          if (pulse > 0.7) {
            g.fillStyle = '#ffc060';
            g.fillRect(lx + 4, Math.round(lavaY + 1), 2, 1);
          }
        }
      }

      // tiles
      var T = C.TILE;
      var t0x = Math.max(0, Math.floor(cam.x / T)), t1x = Math.min(this.map.w - 1, Math.ceil((cam.x + 320) / T));
      var t0y = Math.max(0, Math.floor(cam.y / T)), t1y = Math.min(this.map.h - 1, Math.ceil((cam.y + 180) / T));
      for (var ty = t0y; ty <= t1y; ty++) {
        for (var tx = t0x; tx <= t1x; tx++) {
          var code = this.map.get(tx, ty), name = null;
          if (code === 'X') {
            var base = this.map.isSolid(tx, ty - 1) ? 'tile_dirt' : 'tile_ground';
            name = (this.theme && S.get(base + '_' + this.theme)) ? base + '_' + this.theme : base;
          }
          else if (code === '#') {
            name = (this.theme && S.get('tile_brick_' + this.theme)) ? 'tile_brick_' + this.theme : 'tile_brick';
          }
          else if (code === '=') {
            name = (this.theme && S.get('tile_platform_' + this.theme)) ? 'tile_platform_' + this.theme : 'tile_platform';
          }
          else if (code === 'V') name = 'tile_vine';
          else if (code === 'W') name = 'tile_water';
          else if (code === '~') name = 'tile_water_top';
          else if (code === 'L') {
            // Auto-pick lava surface vs base based on what's above:
            // open space = top (animated ripple); lava / solid = base.
            var aboveL = ty > 0 ? this.map.get(tx, ty - 1) : ' ';
            if (aboveL === 'L' || aboveL === 'X' || aboveL === '#') {
              name = 'tile_lava_base';
            } else {
              // 4-frame ripple, ~9 fps cycle
              name = 'tile_lava_top_' + (Math.floor(this.timeSteps / 7) % 4);
            }
          }
          else if (code === '?') name = 'tile_qcore';
          else if (code === 'G') name = 'tile_qgrow';
          else if (code === 'B') name = 'tile_qblast';
          else if (code === 'U') name = 'tile_qused';
          if (name) g.drawImage(S.get(name), tx * T - cam.x, ty * T - cam.y);
        }
      }
      // entities
      var i;
      for (i = 0; i < this.platforms.length; i++) this.platforms[i].draw(g, cam);
      for (i = 0; i < this.items.length; i++) this.items[i].draw(g, cam);
      // Calling-horn signature (Day 6-1): every enemy is frozen, so
      // render them desaturated + slightly translucent so the player
      // can SEE they're inert. Wrapped around the enemy draw loop so
      // every enemy variant gets the tint automatically.
      var hornFreeze = this.player && this.player.signatureKind === 'callinghorn'
        && this.player.signatureT > 0;
      if (hornFreeze) {
        g.save();
        g.globalAlpha = 0.65;
        g.filter = 'saturate(20%)';
      }
      for (i = 0; i < this.enemies.length; i++) this.enemies[i].draw(g, cam);
      if (hornFreeze) {
        g.restore();
      }
      this.player.draw(g, cam);
      // Sunlit-level cosmetic: sweat drop animating above Danny's head
      // so the player feels the heat (Day 4-1 The Sun).
      if (this.theme === 'sunlit' && !this.player.dead) {
        var pl = this.player;
        var sx = Math.round(pl.x + pl.w / 2 - 2 - cam.x);
        var sy = Math.round(pl.y - 4 - cam.y);
        var dropPhase = (this.timeSteps % 90);
        if (dropPhase < 60) {
          var dripY = sy + Math.floor(dropPhase / 4);
          g.fillStyle = '#6cd0ff'; g.fillRect(sx, dripY, 2, 3);
          g.fillStyle = '#bce8ff'; g.fillRect(sx, dripY, 2, 1);
        }
      }
      for (i = 0; i < this.projectiles.length; i++) this.projectiles[i].draw(g, cam);
      for (i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        g.globalAlpha = Math.max(0, p.life / p.max);
        g.fillStyle = p.color;
        g.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), p.size, p.size);
      }
      g.globalAlpha = 1;

      // Per-theme foreground overlay (currently only 'cyber' uses this).
      // Drawn after entities + projectiles so the painted layer can
      // visually OVERLAP the player + obstacles for parallax depth.
      var fgFn = FOREGROUNDS[this.theme];
      if (fgFn) fgFn(g, cam.x, cam.y, prog, this.timeSteps);

      this.drawHUD(g);
      this.drawSignatureHint(g);

      if (this.state === 'won') {
        var sf = SDD.save.stagesForDay(this.day);
        var msg = sf > 1 ? ('DAY ' + this.day + '-' + this.stage + ' COMPLETE!') : ('DAY ' + this.day + ' COMPLETE!');
        this.drawBanner(g, msg, '#ffd23a');
      }
      if (this.state === 'gameover') this.drawBanner(g, 'GAME OVER', '#ff5d4a');
      if (this.state === 'paused') this.drawPause(g);
    },

    drawHUD: function (g) {
      // No background strip - the HUD text floats directly over the
      // level art (Mark: "transparent border banner... obscures the
      // screen, makes the screen feel smaller"). All HUD glyphs use
      // either bright yellow or coloured text so they read against
      // any backdrop without needing a dark band underneath.
      // Lives counter pulses yellow on the first ~16 frames of a 1up
      // award, then back to white. A small "+1" floats up from the
      // number and fades over the full 70-frame pulse.
      var livesColor = '#ffffff';
      if (this.livesPulseT > 54) {
        // bright flash on the digit during the first 16 frames
        livesColor = (this.livesPulseT % 4 < 2) ? '#ffe070' : '#ffffff';
      }
      // Easy = unlimited lives, so the LIVES counter is meaningless.
      // Replace it with an EASY badge so the kid (and Mark watching them
      // play) always knows what mode is active.
      if (this.difficulty === 'easy') {
        text(g, 'EASY', 6, 4, '#9bf0a0', 1, 'left');
      } else {
        text(g, 'LIVES ' + this.lives, 6, 4, livesColor, 1, 'left');
      }
      if (this.livesPulseT > 0 && this.difficulty !== 'easy') {
        // "+1" rises 12 px above the LIVES label as it fades out.
        var t1 = (70 - this.livesPulseT) / 70;       // 0 -> 1
        var rise = Math.round(t1 * 12);
        var alpha = 1 - t1;
        g.save();
        g.globalAlpha = alpha;
        tsh(g, '+1', 60, 4 - rise, '#ffe070', '#7a4a10', 1, 'left');
        g.restore();
      }
      text(g, 'CORES ' + this.cores, 6, 14, '#46f0ff', 1, 'left');
      // Signature power-up indicator: lit when a per-stage pickup is
      // active. Shows seconds remaining (capped at 99). The
      // friendship-token has a 999s timer = "lasts whole stage" - we
      // render the badge without a countdown for it.
      var sv = SDD.save;
      // Adventure City (Day 8) is set in a futuristic city after Danny's
      // time machine finally takes him forward instead of back. The HUD
      // date reflects that - "JULY 2026 AD" instead of "DAY 8".
      var dlabel = (this.day === 8)
        ? 'JULY 2026 AD'
        : ('DAY ' + this.day + (sv.stagesForDay(this.day) > 1 ? '-' + this.stage : ''));
      text(g, dlabel, 160, 4, '#ffd23a', 1, 'center');
      // Theme name (level.name) as a small subtitle under DAY. Pass 12
      // (Mark): the subtitle used to share row Y=14 with the POWER
      // timer and they overlapped on long stage names. Auto-fade the
      // subtitle out over the first ~6 seconds so the row is clear
      // once the player is into the level.
      var L = SDD.levels[this.day + '-' + this.stage];
      if (L && L.name) {
        var subAlpha = this.timeSteps < 240 ? 1 :
          (this.timeSteps < 360 ? (360 - this.timeSteps) / 120 : 0);
        if (subAlpha > 0) {
          g.save(); g.globalAlpha = subAlpha;
          text(g, L.name, 160, 14, '#dfe6ff', 1, 'center');
          g.restore();
        }
      }
      // Level-entry control hint (e.g. climb vines / flap) - a small
      // banner for the first ~4s, then fades out.
      if (this.hint) {
        var hintAlpha = this.timeSteps < 240 ? 1 :
          (this.timeSteps < 360 ? (360 - this.timeSteps) / 120 : 0);
        if (hintAlpha > 0) {
          g.save(); g.globalAlpha = hintAlpha;
          var hw = Math.max(120, this.hint.length * 6 + 16);
          g.fillStyle = 'rgba(8,8,20,0.80)';
          g.fillRect(160 - hw / 2, 28, hw, 14);
          g.fillStyle = '#46f0ff';
          g.fillRect(160 - hw / 2, 28, hw, 1);
          g.fillRect(160 - hw / 2, 41, hw, 1);
          text(g, this.hint, 160, 32, '#ffe890', 1, 'center');
          g.restore();
        }
      }
      var sec = Math.floor(this.timeSteps / 60);
      text(g, 'TIME ' + sec, 314, 4, '#ffffff', 1, 'right');
      // Signature power-up indicator: lives on the right column, just
      // below TIME, so it never collides with the stage subtitle.
      if (this.player && this.player.signatureKind && this.player.signatureT > 0) {
        var secLeft = Math.ceil(this.player.signatureT / 60);
        var sigName = SIG_LABELS[this.player.signatureKind] || 'POWER';
        var sigLine = secLeft > 99 ? sigName : (sigName + ' ' + secLeft + 's');
        text(g, sigLine, 314, 14, '#ffe890', 1, 'right');
      }
      if (sv.data.options.god) {
        g.fillStyle = 'rgba(255,210,80,0.85)'; g.fillRect(284, 14, 32, 8);
        text(g, 'GOD', 300, 15, '#1a1630', 1, 'center');
      }
    },

    drawBanner: function (g, msg, col) {
      g.fillStyle = 'rgba(8,8,20,0.55)'; g.fillRect(0, 70, 320, 40);
      tsh(g, msg, 160, 80, col, '#000000', 3, 'center');
    },

    // Two-line tooltip for a freshly-activated signature: the big
    // name (e.g. "SUNBURST!") + a short tip on how to use it.
    // Fades over the last second so it doesn't snap off.
    drawSignatureHint: function (g) {
      if (this.sigHintT <= 0 || !this.sigHintKind) return;
      var info = SIG_HINTS[this.sigHintKind];
      if (!info) return;
      var alpha = this.sigHintT > 60 ? 1 : this.sigHintT / 60;
      g.save(); g.globalAlpha = alpha;
      g.fillStyle = 'rgba(8,10,22,0.85)';
      g.fillRect(40, 30, 240, 26);
      g.fillStyle = '#46f0ff';
      g.fillRect(40, 30, 240, 1); g.fillRect(40, 55, 240, 1);
      tsh(g, info.name, 160, 33, '#ffe890', '#000', 1, 'center');
      tsh(g, info.tip,  160, 45, '#dfe6ff', '#000', 1, 'center');
      g.restore();
    },

    drawPause: function (g) {
      g.fillStyle = 'rgba(6,6,16,0.78)'; g.fillRect(0, 0, 320, 180);
      tsh(g, 'PAUSED', 160, 32, '#ffd23a', '#a8631a', 3, 'center');
      var opts = ['RESUME', 'RESTART LEVEL', 'OPTIONS', 'QUIT TO MAP'];
      for (var i = 0; i < opts.length; i++) {
        var y = 78 + i * 16, sel = i === this.pauseIdx;
        // Keep both at size:1 (size 2 was too big per Mark). Selected
        // pops via the yellow arrow + a yellow tinted text-shadow that
        // gives it weight without enlarging.
        if (sel) {
          text(g, '>', 110, y, '#ffd23a', 1, 'left');
          tsh(g, opts[i], 160, y, '#ffffff', '#806020', 1, 'center');
        } else {
          text(g, opts[i], 160, y, '#9aa0c4', 1, 'center');
        }
      }
    }
  };

  // =====================================================================
  // RESULTS
  // =====================================================================
  SDD.scenes.results = {
    enter: function (d) {
      this.d = d || {}; this.t = 0;
      // Celebration stinger first; when it finishes the overworld
      // music takes over in scenes.overworld.enter().
      A.startMusic('results');
    },
    update: function () {
      this.t++;
      if (this.t > 30 && In.confirm()) {
        A.sfx('confirm');
        // After the final stage of a day, route into the Bible quiz
        // if one exists for that day and the kid hasn't already passed
        // it. Day 1 has no quiz; passed quizzes skip straight back to
        // the map.
        var day = this.d.day || 1, stage = this.d.stage || 1;
        var lastStage = stage >= SDD.save.stagesForDay(day);
        var hasQuiz = !!(SDD.quiz && SDD.quiz['day' + day]);
        if (lastStage && hasQuiz && !SDD.save.isQuizPassed(day)) {
          go('quiz', { day: day });
        } else {
          go('overworld');
        }
      }
    },
    render: function (g) {
      var grd = g.createLinearGradient(0, 0, 0, 180);
      grd.addColorStop(0, '#1a3a5e'); grd.addColorStop(1, '#e8c878');
      g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
      drawStarfield(g, this.t);
      var day = this.d.day || 1, stage = this.d.stage || 1;
      var sf = SDD.save.stagesForDay(day);
      var title = sf > 1 ? ('DAY ' + day + '-' + stage + ' COMPLETE!') : ('DAY ' + day + ' COMPLETE!');
      tsh(g, title, 160, 18, '#ffffff', '#a8631a', 3, 'center');

      var sv = SDD.save.data, key = day + '-' + stage;
      var bestT = sv.bestTimes && sv.bestTimes[key];
      var bestC = (sv.bestCores && sv.bestCores[key]) || 0;
      // Stats block on the LEFT, Big Danny celebrating on the RIGHT
      // (per Mark: "put Danny on the right side of that. There's an
      // empty space"). Stats are tightened to four contiguous rows.
      var rows = [
        'TIME           ' + this.d.timeSec + ' SEC',
        'POWER CORES    ' + this.d.cores,
        'BEST TIME      ' + (bestT != null ? bestT + ' SEC' : '-'),
        'BEST CORES     ' + bestC
      ];
      for (var i = 0; i < rows.length; i++) text(g, rows[i], 24, 92 + i * 11, '#1a1630', 1, 'left');
      S.drawDanny(g, 'big', 'celebrate', 'south',
        Math.floor(this.t / 5) % 9,
        240, 100 + Math.sin(this.t * 0.1) * 3);
      if (this.t % 44 < 30) text(g, 'PRESS A TO RETURN TO THE MAP', 160, 168, '#1a1630', 1, 'center');
    }
  };

  // =====================================================================
  // QUIZ - end-of-day Bible verse fill-in-the-blank.
  //
  // Verse from SDD.quiz.forDay(day) at the active difficulty. Kid types
  // the missing word with the on-screen keyboard (or a real keyboard).
  // Graduated hints on wrong answers: nothing -> verse reference -> first
  // letter -> reveal answer with "ask a parent" message. Always retryable
  // until correct; passing records via SDD.save.recordQuizPassed(day) and
  // returns to the overworld.
  // =====================================================================
  var QUIZ_KEYBOARD_ROWS = [
    'QWERTYUIOP'.split(''),
    'ASDFGHJKL'.split(''),
    'ZXCVBNM'.split(''),
    ['BACK', 'ENTER']
  ];

  function quizWrap(textStr, maxWidth, scale) {
    // Greedy word-wrap on a string into an array of lines that each
    // fit within maxWidth pixels at the given font scale. The blank
    // token '___' is treated as ONE word.
    scale = scale || 1;
    var charW = 6 * scale;
    var words = textStr.split(' ');
    var lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var trial = cur.length ? cur + ' ' + w : w;
      if (trial.length * charW <= maxWidth) {
        cur = trial;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  SDD.scenes.quiz = {
    enter: function (d) {
      d = d || {};
      this.day = d.day || 2;
      this.verse = SDD.quiz.forDay(this.day);
      if (!this.verse) {
        // Defensive: if data is missing for some reason, mark as
        // passed (so the kid isn't blocked) and bounce out.
        SDD.save.recordQuizPassed(this.day);
        go('overworld');
        return;
      }
      this.answer = this.verse.answer.toUpperCase();
      this.input = '';
      this.hintLevel = 0;     // 0 ... 3
      this.attempts = 0;
      this.shakeT = 0;
      this.passT = 0;         // >0 = playing the pass animation
      // Pick ONE teaching pose for this instance (Mark: don't interchange
      // clipboard/lecture mid-question). Alternates by day so it varies.
      this.teachAnim = (this.day % 2 === 0) ? 'clipboard' : 'teach';
      this.kbRow = 0;
      this.kbCol = 0;
      this.t = 0;
      A.startMusic('intro');
      this.handleKey = this.handleKey.bind(this);
      window.addEventListener('keydown', this.handleKey);
    },
    exit: function () {
      window.removeEventListener('keydown', this.handleKey);
    },
    handleKey: function (e) {
      if (this.passT > 0) return;
      // Direct typing on a hardware keyboard
      if (/^Key[A-Z]$/.test(e.code)) {
        var ch = e.code.charAt(3);
        this.typeLetter(ch);
        e.preventDefault();
        return;
      }
      if (e.code === 'Backspace') { this.typeBack(); e.preventDefault(); return; }
      if (e.code === 'Enter') { this.trySubmit(); e.preventDefault(); return; }
    },
    typeLetter: function (ch) {
      if (this.input.length >= this.answer.length) return;
      this.input += ch;
      A.sfx('select');
    },
    typeBack: function () {
      if (this.input.length === 0) return;
      this.input = this.input.slice(0, -1);
      A.sfx('select');
    },
    trySubmit: function () {
      if (this.input.length === 0) return;
      if (this.input === this.answer) {
        // Correct!
        this.passT = 1;
        A.sfx('1up');
        SDD.save.recordQuizPassed(this.day);
      } else {
        // Wrong - bump hint level, shake, clear input for retry
        this.attempts++;
        this.hintLevel = Math.min(3, this.hintLevel + 1);
        this.shakeT = 24;
        this.input = '';
        A.sfx('die');
      }
    },
    update: function () {
      this.t++;
      if (this.shakeT > 0) this.shakeT--;
      if (this.passT > 0) {
        this.passT++;
        if (this.passT > 110 && In.confirm()) {
          this.exit();
          go('overworld');
        } else if (this.passT > 180) {
          this.exit();
          go('overworld');
        }
        return;
      }
      // On-screen keyboard navigation
      var rows = QUIZ_KEYBOARD_ROWS;
      var curRow = rows[this.kbRow];
      var len = curRow.length;
      if (In.pressed('up'))    { this.kbRow = (this.kbRow + rows.length - 1) % rows.length;
                                 this.kbCol = Math.min(this.kbCol, rows[this.kbRow].length - 1); A.sfx('select'); }
      if (In.pressed('down'))  { this.kbRow = (this.kbRow + 1) % rows.length;
                                 this.kbCol = Math.min(this.kbCol, rows[this.kbRow].length - 1); A.sfx('select'); }
      if (In.pressed('left'))  { this.kbCol = (this.kbCol + len - 1) % len; A.sfx('select'); }
      if (In.pressed('right')) { this.kbCol = (this.kbCol + 1) % len; A.sfx('select'); }
      if (In.confirm()) {
        var key = curRow[this.kbCol];
        if (key === 'BACK')      this.typeBack();
        else if (key === 'ENTER') this.trySubmit();
        else this.typeLetter(key);
      }
      // B button = quick backspace as a touch-controls shortcut
      if (In.pressed('blast')) this.typeBack();
    },
    render: function (g) {
      // Soft Eden-y backdrop
      var grd = g.createLinearGradient(0, 0, 0, 180);
      grd.addColorStop(0, '#3a6a4a'); grd.addColorStop(1, '#a8d68a');
      g.fillStyle = grd; g.fillRect(0, 0, 320, 180);

      // Title bar
      tsh(g, 'DAY ' + this.day + ' BIBLE CHALLENGE', 160, 12, '#ffd23a', '#5a4a18', 1, 'center');

      // Verse text - with the blank rendered as an inline box that
      // shows the kid's typed letters + remaining underscores.
      // Concatenate the kid's progress into the verse so word-wrap
      // sees the blank as a fixed-length placeholder, then split into
      // lines and overlay the input box on top of the placeholder.
      var blankPlaceholder = ''; var i;
      for (i = 0; i < this.answer.length; i++) {
        blankPlaceholder += (i < this.input.length) ? this.input.charAt(i) : '_';
      }
      // Use a unique sentinel so we can identify which line/x contains
      // the blank for overlay highlighting.
      var rendered = this.verse.text.replace('___', blankPlaceholder);
      var lines = quizWrap(rendered, 280, 1);

      // shake offset
      var shakeX = this.shakeT > 0 ? Math.round(Math.sin(this.shakeT * 0.9) * 3) : 0;

      var top = 32;
      for (i = 0; i < lines.length; i++) {
        text(g, lines[i], 160 + shakeX, top + i * 12, '#1a2810', 1, 'center');
      }
      // Underline the blank placeholder by drawing a faint line below
      // each underscore character region. The verse renderer above
      // already showed letters where the kid had typed; below we draw
      // bottom-of-cell dashes to emphasise the blank.
      // (Skipped - the verse text itself reads clearly enough.)

      // Hint line
      var hintY = top + lines.length * 12 + 6;
      if (this.passT === 0) {
        if (this.hintLevel >= 1) {
          text(g, 'LOOK IT UP: ' + this.verse.ref, 160, hintY, '#5a4a18', 1, 'center');
        } else {
          text(g, 'FILL IN THE MISSING WORD', 160, hintY, '#5a4a18', 1, 'center');
        }
        if (this.hintLevel >= 2) {
          text(g, 'STARTS WITH: ' + this.answer.charAt(0), 160, hintY + 10, '#5a4a18', 1, 'center');
        }
        if (this.hintLevel >= 3) {
          text(g, 'ANSWER: ' + this.answer + '   ASK A PARENT TO READ IT!', 160, hintY + 20, '#a83a18', 1, 'center');
        }
      } else {
        // Pass animation - confetti-ish + "WELL DONE"
        tsh(g, 'WELL DONE!', 160, hintY + 4, '#ffd23a', '#5a4a18', 2, 'center');
        text(g, 'VERSE LEARNED.', 160, hintY + 24, '#1a2810', 1, 'center');
        // Falling confetti dots
        for (var c = 0; c < 18; c++) {
          var cx = (c * 17 + this.passT * 1.3) % 320;
          var cy = (this.passT * 1.6 + c * 11) % 180;
          g.fillStyle = ['#ffd23a', '#9bf0a0', '#a8e6ff', '#ff8a6a'][c % 4];
          g.fillRect(cx | 0, cy | 0, 2, 2);
        }
      }

      // On-screen keyboard. kbTop bumped from 110 -> 100 so row 3 (BACK
      // + ENTER) bottom edge lands at y=178 instead of y=188 - the
      // canvas is only 180 tall and the previous value clipped the
      // bottom 8 px of those wider keys.
      var kbTop = 100;
      var keySize = 18;
      var keyGap = 2;
      for (var r = 0; r < QUIZ_KEYBOARD_ROWS.length; r++) {
        var row = QUIZ_KEYBOARD_ROWS[r];
        var rowW;
        if (r === 3) {
          // BACK + ENTER row uses wider keys
          rowW = 60 + keyGap + 60;
        } else {
          rowW = row.length * keySize + (row.length - 1) * keyGap;
        }
        var x0 = Math.round((320 - rowW) / 2);
        var y = kbTop + r * (keySize + keyGap);
        for (var k = 0; k < row.length; k++) {
          var key = row[k];
          var kw, kx;
          if (r === 3) {
            kw = 60;
            kx = x0 + k * (60 + keyGap);
          } else {
            kw = keySize;
            kx = x0 + k * (keySize + keyGap);
          }
          var sel = r === this.kbRow && k === this.kbCol;
          // Special button colour for BACK/ENTER
          var base = (r === 3) ? '#5a4a30' : '#1a2810';
          var bg = sel ? '#ffd23a' : '#dfe6ce';
          g.fillStyle = bg;
          g.fillRect(kx, y, kw, keySize);
          g.fillStyle = sel ? '#a8631a' : base;
          g.fillRect(kx, y + keySize - 1, kw, 1);   // bottom shadow
          var label = key;
          var lblCol = sel ? '#5a4a18' : '#1a2810';
          text(g, label, kx + kw / 2, y + 6, lblCol, 1, 'center');
        }
      }

      // Teacher Danny in the lower-left margin (clear of the keyboard).
      // He presents the lesson with the clipboard / actively-teaching
      // poses, breaks into a dance when the kid passes, and switches to
      // the funny-teaching pose once they've missed it a couple times
      // (Mark: "during the question portion with the kids... if the
      // kids get the questions too wrong, swap off to [funny teaching]").
      // One pose per instance (this.teachAnim), funny-teaching after a
      // couple of wrong tries, and CELEBRATE (not dance) on a pass.
      var qAnim, qN, qDiv;
      if (this.passT > 0)          { qAnim = 'celebrate';  qN = 9;  qDiv = 5; }
      else if (this.attempts >= 2) { qAnim = 'funnyteach'; qN = 16; qDiv = 6; }
      else if (this.teachAnim === 'clipboard') { qAnim = 'clipboard'; qN = 16; qDiv = 7; }
      else                         { qAnim = 'teach';      qN = 17; qDiv = 6; }
      var qFrame = Math.floor(this.t / qDiv) % qN;
      drawDannyScaled(g, 'big', qAnim, 'south', qFrame, 34, 176, 1.1);
    }
  };

  // =====================================================================
  // GAME OVER
  // =====================================================================
  SDD.scenes.gameover = {
    enter: function (d) {
      this.d = d || {}; this.t = 0;
      this.quip = pickQuip();
      SDD.runLives = 3;                    // fresh 3-life budget on retry
      A.startMusic('gameover');
    },
    update: function () {
      this.t++;
      if (this.t > 30 && In.confirm()) { A.sfx('confirm'); go('overworld'); }
    },
    render: function (g) {
      g.fillStyle = '#14101e'; g.fillRect(0, 0, 320, 180);
      drawStarfield(g, this.t);
      // Stack shifted up so the lower-thirds quip bar (y >= 146) owns
      // the bottom band without colliding with the PRESS A hint.
      tsh(g, 'GAME OVER', 160, 36, '#ff5d4a', '#5a1810', 3, 'center');
      S.drawDanny(g, 'small', 'die', 'east', 6, 152, 78);
      text(g, "SUPER DUDE DANNY WILL TRY AGAIN!", 160, 110, '#dfe6ff', 1, 'center');
      if (this.t % 44 < 30) text(g, 'PRESS A TO RETURN TO THE MAP', 160, 126, '#ffd23a', 1, 'center');
      drawQuipBar(g, this.quip);
    }
  };

  // =====================================================================
  // FINALE - grand ending cinematic played after Day 7 is completed
  // =====================================================================
  var FINALE_BEATS = [
    { lines: ['SUPER DUDE DANNY INSTALLS', 'THE LAST TIME-MACHINE PART...'] },
    { lines: ["...HE HAS WITNESSED ALL SEVEN", "DAYS OF GOD'S CREATION."] },
    { lines: ['THE TIME MACHINE ROARS TO LIFE!'] },
    { lines: ['SUPER DUDE DANNY HURTLES', 'THROUGH TIME...'] },
    { lines: ['...AND ARRIVES SAFELY HOME', 'IN HIS LAB!'] },
    { lines: ['THE END.', 'THANK YOU FOR PLAYING!'] }
  ];
  SDD.scenes.finale = {
    enter: function (d) {
      this.d = d || {}; this.beat = 0; this.t = 0;
      A.startMusic('finale');
    },
    update: function () {
      this.t++;
      if (this.beat === 2 && this.t % 18 === 0) A.sfx('power');
      if (this.beat === 3 && this.t % 12 === 0) A.sfx('chirp');
      if (this.beat === 4 && this.t === 1) A.sfx('win');
      if (this.beat === 5 && this.t === 1) A.sfx('1up');
      if (In.confirm() || this.t > 360) {
        this.beat++; this.t = 0; A.sfx('select');
        if (this.beat >= FINALE_BEATS.length) {
          A.stopMusic();
          // First time the kid finishes the finale, unlock the secret
          // Adventure City stage. firstClear is per-slot so each
          // difficulty earns the unlock independently.
          if (!SDD.save.data.firstClear) {
            SDD.save.data.firstClear = true;
            SDD.save.save();
          }
          go('menu');
        }
      }
    },
    render: function (g) {
      var b = this.beat, t = this.t;
      // Backdrop varies per beat:
      //   0, 1, 2 = Garden of Eden (where Day 7 ends - he installs the
      //             last part, witnesses creation, machine roars to life)
      //   3       = time-travel swirl (no backdrop)
      //   4       = Super Dude Danny's lab (painted ART_LAB - he arrives)
      //   5       = End card warm fade
      var inEden = (b <= 2);
      var inLab  = (b === 4);
      if (inEden) {
        drawSky_eden(g, 0, 0, 0, t);
        // Eden ground band so the machine + Danny aren't floating.
        // Matches the lush-family palette used by 7-1's tiles.
        g.fillStyle = '#3a7a32'; g.fillRect(0, 160, 320, 20);
        g.fillStyle = '#2a5e22'; g.fillRect(0, 160, 320, 2);
        // Sparse flower dots in the grass for life.
        for (var fl = 0; fl < 18; fl++) {
          var flx = (fl * 19 + 8) % 320;
          var fly = 166 + (fl % 3) * 4;
          var col = (fl % 4 === 0) ? '#ffd6f0'
                  : (fl % 4 === 1) ? '#ffea88'
                  : (fl % 4 === 2) ? '#ffffff' : '#ff7e7e';
          g.fillStyle = col; g.fillRect(flx, fly, 1, 1);
        }
        if (b === 2) {
          // Dim Eden slightly during the charging beat so the arcs
          // read against the busy background.
          g.fillStyle = 'rgba(40, 30, 80, 0.22)'; g.fillRect(0, 0, 320, 180);
        }
      } else if (inLab && ART_LAB.ok) {
        g.imageSmoothingEnabled = false;
        g.drawImage(ART_LAB.img, 0, 0, 320, 180);
      } else {
        var grd = g.createLinearGradient(0, 0, 0, 180);
        if (b === 3) {
          grd.addColorStop(0, 'hsl(' + Math.floor(t * 6) + ',70%,40%)');
          grd.addColorStop(1, 'hsl(' + Math.floor(t * 6 + 120) + ',70%,60%)');
        } else {
          // End-card warm fade.
          grd.addColorStop(0, '#142b40'); grd.addColorStop(1, '#e8c878');
        }
        g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
        if (b === 5) drawStarfield(g, this.t);
      }

      // Painted time-machine helper. cx/cy = machine centre. Mirrors
      // the intro's painted-machine drawer so the cinematics feel
      // consistent. Falls back to a small procedural box if the PNG
      // hasn't loaded.
      function paintedMachine(g, cx, cy, glow, glowStrong) {
        if (ART_MACHINE.ok) {
          var mh = 150, mw = Math.round(mh * (1024 / 1536));   // ~100w
          var mx = cx - mw / 2, my = cy - mh / 2;
          g.imageSmoothingEnabled = false;
          g.drawImage(ART_MACHINE.img, mx, my, mw, mh);
          if (glow || glowStrong) {
            domeGlow(g, cx, my + 12, mw * 0.45, t, glowStrong ? 1.5 : 1);
          }
          return;
        }
        // Procedural fallback (centre coords).
        var x = cx - 28, y = cy - 22;
        g.fillStyle = '#3b4a6a'; g.fillRect(x, y, 56, 44);
        g.fillStyle = '#586a92'; g.fillRect(x + 3, y + 3, 50, 24);
        g.fillStyle = glow ? '#bff0ff' : '#23304a'; g.fillRect(x + 7, y + 7, 42, 16);
        g.fillStyle = '#2a3550'; g.fillRect(x, y + 44, 56, 6);
        g.fillStyle = glow ? '#ffe893' : '#7a8bb0';
        g.beginPath(); g.arc(x + 28, y + 3, 14, Math.PI, 0); g.fill();
      }

      var idleIdx = Math.floor(t / 18) % 4;
      if (b === 0) {
        // Garden of Eden - the machine has come with him; he installs
        // the last part beside the great Eden tree.
        paintedMachine(g, 230, 102, false, false);
        drawDannyScaled(g, 'big', 'idle', 'east', idleIdx, 120, 156, 2);
        text(g, "GARDEN OF EDEN", 160, 24, '#3a2010', 1, 'center');
      } else if (b === 1) {
        // Still in Eden - he reflects on having witnessed all 7 days.
        // Gentle glow on the dome to hint that the machine's awake.
        paintedMachine(g, 230, 102, (t % 24 < 12), false);
        drawDannyScaled(g, 'big', 'idle', 'east', idleIdx, 120, 156, 2);
      } else if (b === 2) {
        // Machine charging in Eden - intense glow + electric arcs.
        paintedMachine(g, 230, 102, true, true);
        electricArcs(g, 230, 102, t,        6, 78);
        electricArcs(g, 230, 102, t + 5,    9, 48);
        electricArcs(g, 230, 102, t + 11,  12, 26);
        if (t % 22 < 10) { g.fillStyle = 'rgba(190,240,255,0.14)'; g.fillRect(0, 0, 320, 180); }
        drawDannyScaled(g, 'big', 'celebrate', 'south', Math.floor(t / 5) % 9, 120, 156, 2);
      } else if (b === 3) {
        // Time-travel swirl - rotating particle field.
        for (var i = 0; i < 28; i++) {
          var a = (t * 0.04 + i * 0.224) % 6.28;
          var r = 8 + (i * 4 + t * 1.2) % 160;
          var cx = 160 + Math.cos(a) * r, cy = 90 + Math.sin(a) * r * 0.7;
          g.fillStyle = 'hsl(' + Math.floor(a * 80 + t * 4) + ',80%,75%)';
          g.fillRect(cx, cy, 3, 3);
        }
        drawDannyScaled(g, 'big', 'jump', 'east', 3,
          160, 100 + Math.sin(t * 0.2) * 10, 2);
      } else if (b === 4) {
        // Arrived home in the lab.
        paintedMachine(g, 200, 102, false, false);
        drawDannyScaled(g, 'big', 'celebrate', 'south',
          Math.floor(t / 5) % 9, 110, 156, 2);
        text(g, "SUPER DUDE DANNY'S LAB", 160, 24, '#cdd6e6', 1, 'center');
      } else {
        // The End card.
        tsh(g, 'THE END', 160, 60, '#ffd23a', '#a8631a', 5, 'center');
        text(g, "SUPER DUDE DANNY'S CREATION", 160, 110, '#1a1630', 1, 'center');
        text(g, "ADVENTURE IS COMPLETE!", 160, 122, '#1a1630', 1, 'center');
      }

      // caption box - pinned to bottom edge so it doesn't cover the cinematic art
      var lines = FINALE_BEATS[b] ? FINALE_BEATS[b].lines : [];
      var bh = 16 + lines.length * 11;
      var by_ = 180 - bh;
      g.fillStyle = 'rgba(8,8,20,0.92)'; g.fillRect(8, by_, 304, bh);
      g.strokeStyle = '#ffd23a'; g.strokeRect(8.5, by_ + 0.5, 303, bh - 1);
      for (var li = 0; li < lines.length; li++) {
        text(g, lines[li], 160, by_ + 6 + li * 11, '#ffffff', 1, 'center');
      }
      if (t % 40 < 26) tsh(g, 'PRESS A', 312, by_ - 12, '#ffd23a', '#000000', 1, 'right');
    }
  };

  // =====================================================================
  // CITY ARRIVAL - Adventure City secret stage end-of-stage cutscene.
  // Modelled after the finale: short beats array, confirm-to-advance,
  // returns to menu on the last beat and sets secretCleared = true.
  // Backdrop reuses drawSky_cyber + drawForeground_cyber so the painted
  // city is the canvas; the rescue team are drawn in the foreground.
  // =====================================================================
  var CITY_BEATS = [
    { lines: ['SUPER DUDE DANNY ARRIVES AT', 'ADVENTURE CITY TOWERS!'] },
    { lines: ['THE RESCUE TEAM WAS WAITING.', 'WELCOME HOME, HERO!'] },
    { lines: ['YOUR ADVENTURE NEVER ENDS.', 'KEEP EXPLORING!'] }
  ];
  SDD.scenes.cityArrival = {
    enter: function (d) {
      this.d = d || {}; this.beat = 0; this.t = 0;
      // Reuse the finale track for now - Mark may compose a dedicated
      // Adventure City arrival cue later.
      A.startMusic('finale');
    },
    update: function () {
      this.t++;
      if (this.beat === 1 && this.t === 1) A.sfx('win');
      if (this.beat === 2 && this.t === 1) A.sfx('1up');
      if (In.confirm() || this.t > 360) {
        this.beat++; this.t = 0; A.sfx('select');
        if (this.beat >= CITY_BEATS.length) {
          A.stopMusic();
          if (!SDD.save.data.secretCleared) {
            SDD.save.data.secretCleared = true;
            SDD.save.save();
          }
          go('menu');
        }
      }
    },
    render: function (g) {
      var b = this.beat, t = this.t;
      // Painted city as the backdrop on every beat (the sky + fg
      // hooks already tile + parallax).
      drawSky_cyber(g, t * 0.4, 0, 0, t);
      // A solid road band so the rescue team have a floor to stand on.
      g.fillStyle = '#1a1f30'; g.fillRect(0, 156, 320, 24);
      g.fillStyle = '#2a3450'; g.fillRect(0, 156, 320, 1);

      var idleIdx = Math.floor(t / 18) % 4;
      var bob = Math.sin(t * 0.08) * 1;

      if (b === 0) {
        // Danny strides toward the Towers (right edge), rescue team
        // peeking from the right.
        drawDannyScaled(g, 'big', 'walk', 'east', Math.floor(t / 7) % 4,
          80, 152, 1.5);
        // Tower silhouette on the right.
        g.fillStyle = '#3a4a78';
        g.fillRect(220, 60, 50, 96);
        g.fillStyle = '#5af0ff';
        g.fillRect(232, 68, 6, 6);
        g.fillRect(246, 78, 6, 6);
        g.fillRect(232, 92, 6, 6);
        g.fillRect(246, 102, 6, 6);
        tsh(g, 'ADVENTURE CITY TOWERS', 160, 28, '#ffd23a', '#1a1630', 1, 'center');
      } else if (b === 1) {
        // Rescue team greeting line - draw the placeholder NPC
        // silhouettes side by side beside a celebrating Danny.
        var npcSprites = ['npc_rescue_leader', 'npc_rescue_scientist',
                          'npc_rescue_engineer', 'npc_rescue_pilot'];
        for (var ri = 0; ri < npcSprites.length; ri++) {
          var spr = S.get(npcSprites[ri]);
          if (spr) g.drawImage(spr, 180 + ri * 22, 130 + Math.round(bob));
        }
        drawDannyScaled(g, 'big', 'celebrate', 'east', Math.floor(t / 5) % 9,
          110, 152, 1.5);
        tsh(g, 'THE RESCUE TEAM', 160, 28, '#ffd23a', '#1a1630', 1, 'center');
      } else {
        // Hero send-off: Danny lifted by the team, end-card text.
        tsh(g, 'SUPER DUDE DANNY', 160, 60, '#ffd23a', '#a8631a', 2, 'center');
        tsh(g, 'IS HOME!', 160, 90, '#ff5d4a', '#7a1f16', 3, 'center');
        drawDannyScaled(g, 'big', 'celebrate', 'south',
          Math.floor(t / 5) % 9, 130, 124, 2);
        // Confetti.
        for (var p = 0; p < 24; p++) {
          var px = ((p * 37 + t * 1.2) % 320);
          var py = ((p * 23 + t * 1.8) % 180);
          var col = (p % 3 === 0) ? '#ffd23a' : (p % 3 === 1) ? '#5af0ff' : '#ff5a3a';
          g.fillStyle = col;
          g.fillRect(px | 0, py | 0, 2, 2);
        }
      }

      // Caption box - same shape as the finale's.
      var lines = CITY_BEATS[b] ? CITY_BEATS[b].lines : [];
      var bh = 16 + lines.length * 11;
      var by_ = 180 - bh;
      g.fillStyle = 'rgba(8,8,20,0.92)'; g.fillRect(8, by_, 304, bh);
      g.strokeStyle = '#ffd23a'; g.strokeRect(8.5, by_ + 0.5, 303, bh - 1);
      for (var li = 0; li < lines.length; li++) {
        text(g, lines[li], 160, by_ + 6 + li * 11, '#ffffff', 1, 'center');
      }
      if (t % 40 < 26) tsh(g, 'PRESS A', 312, by_ - 12, '#ffd23a', '#000000', 1, 'right');
    }
  };
})();
