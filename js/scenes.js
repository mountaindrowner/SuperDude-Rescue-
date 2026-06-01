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
      // TEMP (v0.56): unlock unconditionally + label as TEST so Mark
      // can jump straight into the secret stage for art iteration.
      // Restore the `if (SDD.save.data.firstClear)` gate before ship.
      this.items.push({ label: 'ADVENTURE CITY (TEST)', act: 'adventurecity' });
      // TEMP (v0.68): decoration editor for Layer 1 of Adventure
      // City. Dev-only, strip with the rest of the editor before
      // public release.
      if (SDD.scenes.decorEdit) {
        this.items.push({ label: 'DECOR EDITOR (TEST)', act: 'decoredit' });
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
        else if (act === 'adventurecity') { go('cityIntro'); }
        else if (act === 'decoredit') { go('decorEdit', { day: 8, stage: 1 }); }
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
    // v0.92 (Mark): forming-galaxy spiral - slowly-rotating logarithmic
    // spiral arms of star particles painted behind the foreground
    // starfield + central light burst. Reads as a young galaxy being
    // shaped (Day 1 of creation).
    _drawGalaxySpiral(g, camx, t);
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

  // v0.92: forming-galaxy spiral for Day 1-1. Two logarithmic arms +
  // an inner core dust disc + scattered satellite stars, all slowly
  // rotating around (cx, cy). Designed to read as a young spiral
  // galaxy in the middle of being formed.
  function _drawGalaxySpiral(g, camx, t) {
    var cx = 160 - camx * 0.03;            // slight parallax with the world
    var cy = 88;
    var rot = t * 0.0035;                  // very slow rotation
    var ARMS = 2;                          // 2 main arms + a faint 3rd
    // ---- inner disc haze (warm core glow) ----
    var disc = g.createRadialGradient(cx, cy, 1, cx, cy, 56);
    disc.addColorStop(0,   'rgba(255,210,140,0.42)');
    disc.addColorStop(0.4, 'rgba(180,130,220,0.18)');
    disc.addColorStop(1,   'rgba(40,20,80,0)');
    g.fillStyle = disc;
    g.fillRect(cx - 56, cy - 56, 112, 112);
    // ---- elliptical disc rim (very subtle, gives the disc shape) ----
    g.save();
    g.translate(cx, cy);
    g.rotate(rot * 1.8);
    g.scale(1, 0.42);                      // flatten into a disc
    var rim = g.createRadialGradient(0, 0, 18, 0, 0, 64);
    rim.addColorStop(0,    'rgba(120,160,255,0)');
    rim.addColorStop(0.65, 'rgba(140,180,255,0.10)');
    rim.addColorStop(1,    'rgba(120,160,255,0)');
    g.fillStyle = rim;
    g.fillRect(-64, -64, 128, 128);
    g.restore();
    // ---- spiral arms - star particles along log-spiral paths ----
    // r = a * exp(b * theta). Each arm is offset by 2pi/ARMS.
    var a = 1.6, b = 0.21;
    for (var arm = 0; arm < ARMS; arm++) {
      var armOff = (arm / ARMS) * Math.PI * 2;
      for (var step = 0; step < 90; step++) {
        var theta = step * 0.18 + armOff + rot;
        var r = a * Math.exp(b * (step * 0.18));
        if (r > 78) break;                   // clip past disc radius
        // Pseudo-random scatter perpendicular to the arm.
        var jx = ((step * 31 + arm * 11) % 7) - 3;
        var jy = ((step * 17 + arm * 23) % 7) - 3;
        var x = cx + Math.cos(theta) * r + jx * 0.5;
        var y = cy + Math.sin(theta) * r * 0.42 + jy * 0.3;   // flatten
        // Color + size: inner = warm yellow/white, outer = cool blue/violet.
        var f = step / 90;
        var col;
        if (f < 0.25)      col = 'rgba(255,240,180,';
        else if (f < 0.55) col = 'rgba(255,210,230,';
        else if (f < 0.8)  col = 'rgba(180,170,255,';
        else               col = 'rgba(120,140,220,';
        // Twinkle.
        var tw = 0.55 + 0.45 * Math.sin(t * 0.05 + step * 0.7 + arm * 2.3);
        var alpha = (0.55 + (1 - f) * 0.35) * tw;
        g.fillStyle = col + alpha.toFixed(2) + ')';
        var sz = (step % 9 === 0 && f < 0.6) ? 2 : 1;
        g.fillRect(x | 0, y | 0, sz, sz);
      }
    }
    // ---- faint dust lane between the arms (single thin curve) ----
    g.fillStyle = 'rgba(40,20,60,0.42)';
    for (var d = 0; d < 60; d++) {
      var dt = d * 0.22 + rot;
      var dr = a * Math.exp(b * (d * 0.22)) + 4;
      if (dr > 70) break;
      var dxd = cx + Math.cos(dt + Math.PI * 0.5) * dr;
      var dyd = cy + Math.sin(dt + Math.PI * 0.5) * dr * 0.42;
      g.fillRect(dxd | 0, dyd | 0, 1, 1);
    }
    // ---- bright dense core (inner concentration) ----
    var core = g.createRadialGradient(cx, cy, 0, cx, cy, 14);
    core.addColorStop(0,   'rgba(255,250,220,0.95)');
    core.addColorStop(0.4, 'rgba(255,210,160,0.55)');
    core.addColorStop(1,   'rgba(255,180,120,0)');
    g.fillStyle = core;
    g.fillRect(cx - 14, cy - 14, 28, 28);
    // ---- satellite stars sparsely scattered around the disc ----
    for (var s = 0; s < 18; s++) {
      var sa = (s * 0.7 + rot * 0.6) % (Math.PI * 2);
      var sr = 60 + ((s * 31) % 28);
      var sx = cx + Math.cos(sa) * sr;
      var sy = cy + Math.sin(sa) * sr * 0.55;
      var stw = 0.6 + 0.4 * Math.sin(t * 0.06 + s * 1.9);
      g.fillStyle = 'rgba(220,230,255,' + (0.50 * stw).toFixed(2) + ')';
      g.fillRect(sx | 0, sy | 0, 1, 1);
    }
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
    // v0.92 (Mark): "Forming Land" gets the Adventure-City depth
    // treatment - layered atmospheric perspective with an erupting
    // volcano in the far background, smoky horizon haze, and drifting
    // ash. Brightness inversion: far = pale + warm, near = dark +
    // saturated.
    // ----- multi-stop sky -----
    var sky = g.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0,    '#b85a30');           // upper warm magma
    sky.addColorStop(0.30, '#e08850');
    sky.addColorStop(0.60, '#f5cd92');
    sky.addColorStop(0.85, '#f6b878');           // smoky horizon
    sky.addColorStop(1,    '#d68a55');
    g.fillStyle = sky; g.fillRect(0, 0, 320, 180);

    // Volumetric haze band right above the volcano range (warm low-fog).
    var haze = g.createLinearGradient(0, 110, 0, 160);
    haze.addColorStop(0, 'rgba(255,180,110,0)');
    haze.addColorStop(0.5, 'rgba(255,180,110,0.18)');
    haze.addColorStop(1, 'rgba(255,180,110,0)');
    g.fillStyle = haze; g.fillRect(0, 110, 320, 50);

    // Sun (slightly larger + warmer than the legacy version).
    simpleSun(g, 240, 36, 20, '#ffd896', false);

    // ----- ERUPTING VOLCANO (very far layer) -----
    // Parallax 0.05 - reads as a distant landmark anchored to the
    // horizon. World seed (camx) keeps the cone in the same spot.
    var volX = Math.round(150 - camx * 0.05);
    while (volX < -80) volX += 640;
    while (volX > 320) volX -= 640;
    _drawVolcano(g, volX, 152, t);

    // Distant ridge (palest, far).
    jaggedRow(g, camx, 0.08, 144, '#a86040', 36);
    // Mid ridge - middle band.
    jaggedRow(g, camx, 0.16, 156, '#7a3e20', 58);
    // Near ridge - darkest, closest.
    jaggedRow(g, camx, 0.30, 170, '#3a2210', 46);

    // Drifting ash particles + heat-shimmer specks.
    for (var i = 0; i < 26; i++) {
      var dx = (((i * 47) - camx * 0.3 + t * 0.5) % 320 + 320) % 320;
      var dy = 90 + ((i * 17) % 80);
      // Larger drift up + horizontal scroll for the ash flakes.
      var ax = ((i * 31) - camx * 0.18 - t * 0.45) % 320;
      ax = (ax + 320) % 320;
      var ay = ((i * 13) % 70) + Math.sin(t * 0.04 + i) * 4;
      g.fillStyle = 'rgba(60,40,30,0.35)';
      g.fillRect(ax | 0, ay | 0, (i % 5 === 0) ? 2 : 1, 1);
      // Heat shimmer dust.
      g.fillStyle = 'rgba(255,200,140,0.32)';
      g.fillRect(dx | 0, dy | 0, 1, 1);
    }
  }

  // Far-background volcano with crater glow, lava trickle on the flank,
  // and a rising plume of warm smoke + flecks. (cx, baseY) is the
  // base center on the screen.
  function _drawVolcano(g, cx, baseY, t) {
    // Cone silhouette - asymmetric trapezoid for character.
    var coneW = 92;            // base width
    var coneTopW = 28;         // truncated peak width
    var coneH = 58;            // height
    var l = cx - coneW / 2,    r = cx + coneW / 2;
    var lt = cx - coneTopW / 2, rt = cx + coneTopW / 2;
    var topY = baseY - coneH;
    // Body (dark warm brown - reads as distant rocky mass).
    g.fillStyle = '#5a3018';
    g.beginPath();
    g.moveTo(l, baseY);
    g.lineTo(lt, topY);
    g.lineTo(rt, topY);
    g.lineTo(r, baseY);
    g.closePath();
    g.fill();
    // Left-side warm rim (sunlit edge).
    g.fillStyle = '#8a4824';
    g.beginPath();
    g.moveTo(l, baseY);
    g.lineTo(lt, topY);
    g.lineTo(lt + 3, topY + 1);
    g.lineTo(l + 6, baseY);
    g.closePath();
    g.fill();
    // Right-side shadow.
    g.fillStyle = '#3a1c0e';
    g.beginPath();
    g.moveTo(r, baseY);
    g.lineTo(rt, topY);
    g.lineTo(rt - 3, topY + 1);
    g.lineTo(r - 6, baseY);
    g.closePath();
    g.fill();
    // Erosion ridges (a few diagonal dark streaks down the cone).
    g.fillStyle = '#3a1c0e';
    g.fillRect(cx - 18, topY + 14, 1, 38);
    g.fillRect(cx - 6,  topY + 10, 1, 44);
    g.fillRect(cx + 8,  topY + 16, 1, 36);
    g.fillRect(cx + 20, topY + 12, 1, 40);
    // Crater rim (lighter ash deposits).
    g.fillStyle = '#a06840';
    g.fillRect(lt, topY,     coneTopW, 2);
    g.fillStyle = '#7a4828';
    g.fillRect(lt + 2, topY + 2, coneTopW - 4, 1);
    // Lava lake glowing in the crater (animated pulse).
    var pulse = 0.7 + Math.sin(t * 0.05) * 0.3;
    g.fillStyle = '#ff5418';
    g.fillRect(lt + 4, topY + 1, coneTopW - 8, 2);
    g.fillStyle = '#ffd048';
    g.fillRect(lt + 6 + Math.floor((t * 0.2) % 3), topY + 1, coneTopW - 14, 1);
    // Soft heat glow around the crater.
    var ch = g.createRadialGradient(cx, topY + 1, 2, cx, topY + 1, 22);
    ch.addColorStop(0, 'rgba(255,180,80,' + (0.55 * pulse).toFixed(2) + ')');
    ch.addColorStop(1, 'rgba(255,180,80,0)');
    g.fillStyle = ch; g.fillRect(cx - 24, topY - 20, 48, 36);
    // Lava trickle running down the left flank.
    g.fillStyle = '#ff5418';
    g.fillRect(cx - 10, topY + 4, 1, 18);
    g.fillRect(cx - 9,  topY + 20, 1, 14);
    g.fillRect(cx - 8,  topY + 32, 1, 12);
    g.fillStyle = '#ffd048';
    g.fillRect(cx - 10, topY + 4,  1, 4);
    g.fillRect(cx - 9,  topY + 20, 1, 4);
    // ----- Rising eruption plume -----
    // Layered smoke puffs that scale up as they ascend; warmer tones
    // near the crater, cooler / darker as they rise + drift.
    var pCount = 12;
    for (var p = 0; p < pCount; p++) {
      var ph = ((t * 0.6 + p * 18) % 200);    // 0..200 cycle
      var lift = ph * 0.6;                     // rise rate
      var px = cx + Math.sin(ph * 0.05 + p) * (4 + ph * 0.04);
      var py = topY - lift;
      if (py < -10) continue;
      var rad = 5 + ph * 0.08;
      // Hue fades from warm orange near the crater to dark smoke up high.
      var k = Math.min(1, ph / 180);
      var rcol = Math.round(180 - k * 100);
      var gcol = Math.round(110 - k * 70);
      var bcol = Math.round(70 - k * 50);
      var alpha = (1 - k) * 0.55 + 0.15;
      var puff = g.createRadialGradient(px, py, 1, px, py, rad);
      puff.addColorStop(0, 'rgba(' + rcol + ',' + gcol + ',' + bcol + ',' + alpha.toFixed(2) + ')');
      puff.addColorStop(1, 'rgba(' + rcol + ',' + gcol + ',' + bcol + ',0)');
      g.fillStyle = puff;
      g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
    // Glowing lava flecks ejecting from the crater (small bright dots
    // that arc up + sideways, then fade).
    for (var f = 0; f < 8; f++) {
      var fh = ((t * 0.8 + f * 22) % 140);
      var arc = (fh - 70) / 70;                // -1..1 across the arc
      var fx = cx + arc * 24 + (f - 4) * 1.2;
      var fy = topY - (1 - arc * arc) * 32 - 4;
      var fa = Math.max(0, 1 - fh / 140);
      g.fillStyle = (fh < 60)
        ? 'rgba(255,232,140,' + fa.toFixed(2) + ')'
        : 'rgba(255,90,40,' + fa.toFixed(2) + ')';
      g.fillRect(fx | 0, fy | 0, 1, 1);
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

  // ===== ADVENTURE CITY: SOLARPUNK PIXEL-ART PARALLAX (v0.55) =====
  // Bright daytime solarpunk neighborhood - tech and nature integrated.
  // Hopeful, cozy, Mega Man X-readable side-scroller environment.
  //
  // 4 parallax layers, each rendered ONCE into a 960x180 offscreen
  // canvas at boot then tile-blitted per frame:
  //   far    (0.10x): pale haze-blurred distant towers + faint
  //                   rooftop greenery, atmospheric color shift
  //   mid    (0.25x): cream/tan mid-distance buildings with rich
  //                   rooftop gardens, skybridges, solar canopies
  //   bridge (0.50x): cozy storefront walkway behind the player -
  //                   cafe awnings, warm windows, planters, vines
  //   fg     (0.70x): light foreground anchors - hanging vines,
  //                   flowering branches, lampposts at the edges
  //
  // The PNG getters from sprites.js (cyberFar/Mid/Bridge/Fg) override
  // these procedurals when Mark drops painted layers into assets/city/.
  // -----------------------------------------------------------------------

  // Deterministic PRNG so the cached canvases reproduce identically.
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

  // Solarpunk palette (anchored to Mark's brief).
  var _CYP = {
    // v0.62 was #5CA5DE/#87C9EF/#C2E8F6; v0.71 pushes deeper than the
    // previous saturated v0.60 baseline (#3B92D8/#6EBEEC/#B5E2F3) per
    // Mark "the sky should be a deeper blue still."
    skyTop:    '#2A82CC', skyMid:   '#4FA8DE', skyHoriz: '#9ED4EC',
    cloudBase: '#F4FFF8', cloudHi:  '#FFFFFF', cloudShadow: '#CDEEF2',
    sunDisc:   '#FFF6C8', sunHalo:  '#FFE890',
    farHaze:   '#A8C9D8', farMid:   '#B5C4D4', farDark: '#8FA3BD', farGreen: '#9CC4A0',
    creamBody: '#E8D6B8', creamShade:'#C9A982', creamHi:'#F4E6CC',
    teal:      '#8FA7A8', tealD:    '#5F7D8B',  tealH:  '#B5CECC',
    slate:     '#5F7D8B', slateD:   '#3E5C70',
    leafLt:    '#A6E86F', leafMid:  '#65B95F',  leafDk: '#2F7D4F', leafDkr:'#1F5639',
    bark:      '#5A3E26', barkH:    '#7A5E36',
    blossom:   '#F8B0E0', blossomDk:'#D87AB0',
    warmWin:   '#FFD080', warmWinH: '#FFE8A0',  warmWinL: '#C09040',
    coolWin:   '#A0DCFF', coolWinH: '#D0F0FF',  coolWinL: '#5090C0',
    awningR:   '#F06AB4', awningRD: '#A0407A',  awningRH: '#FF9AD0',
    awningO:   '#FFB25B', awningOD: '#A06A20',  awningOH: '#FFD080',
    awningC:   '#5DE2E7', awningCD: '#2A8A8E',  awningCH: '#A0F0F0',
    accent:    '#FFE46B', accent2:  '#5DE2E7',
    outline:   '#3A4664', outlineD: '#23324D',
    pathWarm:  '#E8D6B8', pathShade:'#C9A982',  pathSeam:'#A08858',
    sunBeam:   'rgba(255,236,140,0.18)'
  };

  // Soften building corners - 1-px chip diagonal so silhouettes don't
  // read as flat rectangles.
  function _cyRoundCorners(g, x, y, w, h, shade) {
    g.clearRect(x,           y,           1, 1);
    g.clearRect(x + w - 1,   y,           1, 1);
    g.clearRect(x,           y + h - 1,   1, 1);
    g.clearRect(x + w - 1,   y + h - 1,   1, 1);
    g.fillStyle = shade;
    g.fillRect(x + 1,        y,           1, 1);
    g.fillRect(x,            y + 1,       1, 1);
    g.fillRect(x + w - 2,    y,           1, 1);
    g.fillRect(x + w - 1,    y + 1,       1, 1);
  }

  // Subtle solarpunk modular panel seams - one horizontal mid-line
  // + two structural verticals at thirds. Reads as prefab cladding
  // without the barcode density of dense-grid panels.
  function _cyPanelSeams(g, x, y, w, h, shade, hi) {
    g.fillStyle = shade;
    var midY = y + Math.floor(h * 0.55);
    g.fillRect(x + 2, midY, w - 4, 1);
    var t1 = x + Math.floor(w / 3),  t2 = x + Math.floor(w * 2 / 3);
    g.fillRect(t1, y + 8, 1, h - 12);
    g.fillRect(t2, y + 8, 1, h - 12);
    g.fillStyle = hi;
    g.fillRect(x + 2, midY - 1, w - 4, 1);
  }

  // ---- Window grid (warm orange / soft cyan, sparse) -----------------
  function _cyDrawWindowGrid(g, x, y, w, h, palette, density) {
    palette = palette || [_CYP.warmWin, _CYP.warmWinH, _CYP.coolWin];
    density = (density == null) ? 0.55 : density;
    var seed = (x * 13 + y * 7) & 0xff;
    // Per-building style picker: ~25% glass curtain wall (continuous
    // bright glass bands), ~22% feature window (a few wide bright
    // floors), ~25% mostly dark silhouette for contrast, ~28%
    // standard grid. This is the big anti-monotony lever.
    var styleSel = (seed >> 1) & 0xf;
    var curtain = styleSel < 4;
    var dark    = !curtain && styleSel < 8;
    var feature = !curtain && !dark && styleSel < 12;
    if (curtain) {
      // GLASS CURTAIN WALL: vertical glass strips bright with horizontal
      // floor slabs cutting across. Reads as a modern glass tower.
      var stripeW = 4;
      var floorH  = 9;
      // Bright glass background.
      g.fillStyle = '#A0DCFF';
      g.fillRect(x + 3, y + 4, w - 6, h - 8);
      g.fillStyle = '#D0F0FF';
      g.fillRect(x + 3, y + 4, w - 6, 1);
      // Vertical mullions.
      g.fillStyle = _CYP.outlineD;
      for (var cmx = x + 3; cmx < x + w - 3; cmx += stripeW) {
        g.fillRect(cmx, y + 4, 1, h - 8);
      }
      // Horizontal floor slabs (cream).
      g.fillStyle = _CYP.creamShade;
      for (var cmy = y + 4 + floorH; cmy < y + h - 4; cmy += floorH) {
        g.fillRect(x + 3, cmy, w - 6, 2);
        g.fillStyle = _CYP.creamHi;
        g.fillRect(x + 3, cmy, w - 6, 1);
        g.fillStyle = _CYP.creamShade;
      }
      // A few brighter floors with warm windows interspersed.
      for (var lit = y + 8; lit < y + h - 6; lit += floorH * 2) {
        g.fillStyle = _CYP.warmWinH;
        g.fillRect(x + 4, lit, w - 8, 3);
        g.fillStyle = _CYP.outlineD;
        for (var lmx = x + 4; lmx < x + w - 4; lmx += stripeW) {
          g.fillRect(lmx, lit, 1, 3);
        }
      }
      return;
    }
    if (dark) {
      // Mostly-dark silhouette: a tiny scatter of warm windows.
      for (var dy = y + 8; dy < y + h - 6; dy += 9) {
        for (var dx = x + 4; dx < x + w - 4; dx += 7) {
          if (((dx * 17 + dy * 23 + seed) & 0x1f) < 4) {
            g.fillStyle = (((dx + dy) & 1) ? _CYP.warmWin : _CYP.warmWinH);
            g.fillRect(dx, dy, 2, 3);
            g.fillStyle = _CYP.outlineD;
            g.fillRect(dx, dy + 3, 2, 1);
          }
        }
      }
      return;
    }
    if (feature) {
      // FEATURE FLOORS: 2-3 rows of wide bright bars - penthouse /
      // lobby vibes. Mix warm + cool floors so the palette varies.
      var rows = 2 + (seed & 1);
      for (var fr = 0; fr < rows; fr++) {
        var fy = y + 10 + fr * Math.max(10, Math.floor(h / (rows + 2)));
        if (fy > y + h - 6) break;
        var col = (fr & 1) ? _CYP.warmWinH : _CYP.coolWinH;
        // Frame.
        g.fillStyle = _CYP.outlineD;
        g.fillRect(x + 3, fy - 1, w - 6, 6);
        // Lit pane.
        g.fillStyle = col;
        g.fillRect(x + 4, fy, w - 8, 4);
        // Center divider.
        g.fillStyle = _CYP.outlineD;
        g.fillRect(x + Math.floor(w / 2), fy, 1, 4);
        g.fillRect(x + Math.floor(w / 3), fy, 1, 4);
        g.fillRect(x + Math.floor(w * 2 / 3), fy, 1, 4);
        // Bright accent at the top.
        g.fillStyle = '#FFFFFF';
        g.fillRect(x + 4, fy, w - 8, 1);
      }
      // Sparse dim windows above + below the feature bars.
      for (var ly = y + 4; ly < y + h - 3; ly += 6) {
        for (var lx = x + 3; lx < x + w - 3; lx += 5) {
          if (((lx * 11 + ly * 17 + seed) & 0x1f) === 0) {
            g.fillStyle = _CYP.coolWin;
            g.fillRect(lx, ly, 2, 2);
          }
        }
      }
      return;
    }
    // STANDARD GRID (default): larger paned windows with frames + sashes.
    for (var wy = y + 6; wy < y + h - 6; wy += 6) {
      for (var wx = x + 3; wx < x + w - 3; wx += 5) {
        var pick = ((wx * 17 + wy * 23 + seed) & 0xff) / 256;
        if (pick > density) continue;
        var col = palette[(wx + wy + seed) % palette.length];
        g.fillStyle = _CYP.outlineD;
        g.fillRect(wx, wy, 3, 4);
        g.fillStyle = col;
        g.fillRect(wx + 1, wy + 1, 1, 2);
        g.fillStyle = _CYP.outlineD;
        g.fillRect(wx + 2, wy + 1, 1, 2);
        g.fillStyle = _CYP.creamHi;
        g.fillRect(wx, wy, 3, 1);
      }
    }
  }

  // ---- Cherry blossom rooftop tree - dramatic pink canopy --------
  function _cyDrawCherryRoof(g, x, baseY, w, rng) {
    // Planter band.
    g.fillStyle = _CYP.creamShade;
    g.fillRect(x + 2, baseY - 4, w - 4, 4);
    g.fillStyle = _CYP.creamHi;
    g.fillRect(x + 2, baseY - 4, w - 4, 1);
    g.fillStyle = _CYP.bark;
    g.fillRect(x + 3, baseY - 3, w - 6, 1);
    // Single large cherry tree centered.
    var cx = x + Math.floor(w / 2);
    var cy = baseY - 10;
    // Trunk.
    g.fillStyle = _CYP.bark;
    g.fillRect(cx - 1, cy + 6, 2, 4);
    // Layered pink canopy (4 tones for richness).
    g.fillStyle = _CYP.blossomDk;
    g.fillRect(cx - 6, cy + 2, 13, 4);
    g.fillRect(cx - 5, cy + 6, 11, 1);
    g.fillStyle = _CYP.blossom;
    g.fillRect(cx - 5, cy + 1, 11, 4);
    g.fillRect(cx - 4, cy,     9,  1);
    g.fillStyle = '#FFD0E8';
    g.fillRect(cx - 4, cy + 1, 9,  3);
    g.fillRect(cx - 3, cy,     7,  1);
    g.fillStyle = '#FFFFFF';
    g.fillRect(cx - 3, cy + 1, 2,  1);
    g.fillRect(cx + 2, cy + 2, 2,  1);
    // Scattered bright pink dots for individual blossoms.
    g.fillStyle = '#FF80C0';
    g.fillRect(cx - 6, cy + 4, 1,  1);
    g.fillRect(cx + 6, cy + 3, 1,  1);
    g.fillRect(cx,     cy - 1, 1,  1);
    // Falling petals (3 single pixels below canopy for life).
    g.fillStyle = _CYP.blossom;
    g.fillRect(cx - 4, cy + 8, 1, 1);
    g.fillRect(cx + 4, cy + 9, 1, 1);
  }

  // ---- Rooftop greenery cluster (a cube planter + 2-3 trees) ---------
  function _cyDrawRoofGarden(g, x, baseY, w, rng) {
    // Planter band.
    g.fillStyle = _CYP.creamShade;
    g.fillRect(x + 2, baseY - 4, w - 4, 4);
    g.fillStyle = _CYP.creamHi;
    g.fillRect(x + 2, baseY - 4, w - 4, 1);
    g.fillStyle = _CYP.bark;
    g.fillRect(x + 3, baseY - 3, w - 6, 1);                 // soil strip
    // Railing / glass edge.
    g.fillStyle = _CYP.tealH;
    g.fillRect(x + 2, baseY, w - 4, 1);
    // Trees: 2-3 per planter depending on width.
    var tn = Math.max(2, Math.floor((w - 6) / 7));
    for (var ti = 0; ti < tn; ti++) {
      var tx = x + 4 + ti * Math.floor((w - 8) / tn);
      var blossom = rng() > 0.55;
      // Canopy.
      g.fillStyle = _CYP.leafDk;
      g.fillRect(tx,     baseY - 10, 5, 6);
      g.fillRect(tx - 1, baseY - 9,  7, 4);
      g.fillStyle = _CYP.leafMid;
      g.fillRect(tx + 1, baseY - 10, 3, 1);
      g.fillRect(tx + 1, baseY - 9,  1, 2);
      g.fillStyle = _CYP.leafLt;
      g.fillRect(tx + 2, baseY - 10, 2, 1);
      // Flowering accents on some.
      if (blossom) {
        g.fillStyle = _CYP.blossom;
        g.fillRect(tx - 1, baseY - 8, 1, 1);
        g.fillRect(tx + 5, baseY - 7, 1, 1);
        g.fillRect(tx + 2, baseY - 6, 1, 1);
        g.fillStyle = _CYP.blossomDk;
        g.fillRect(tx + 4, baseY - 8, 1, 1);
      }
      // Trunk.
      g.fillStyle = _CYP.bark;
      g.fillRect(tx + 2, baseY - 4, 1, 1);
    }
    // Vines spilling over the planter edge.
    if (rng() > 0.4) {
      g.fillStyle = _CYP.leafMid;
      g.fillRect(x + 4,      baseY,     1, 4);
      g.fillRect(x + w - 5,  baseY,     1, 3);
      g.fillStyle = _CYP.leafDk;
      g.fillRect(x + 4,      baseY + 3, 1, 1);
      g.fillRect(x + w - 5,  baseY + 2, 1, 1);
    }
  }

  // ---- Solar canopy on top of a roof (slanted cyan/teal panel)
  function _cyDrawSolarCanopy(g, x, baseY, w) {
    // Two-tier solar panel.
    g.fillStyle = _CYP.slateD;
    g.fillRect(x + 2, baseY - 7, w - 4, 4);                 // frame
    g.fillStyle = _CYP.teal;
    g.fillRect(x + 3, baseY - 6, w - 6, 2);                 // panel body
    // Cell divisions.
    g.fillStyle = _CYP.tealD;
    for (var c = x + 4; c < x + w - 4; c += 3) {
      g.fillRect(c, baseY - 6, 1, 2);
    }
    // Bright reflective top edge.
    g.fillStyle = _CYP.tealH;
    g.fillRect(x + 3, baseY - 6, w - 6, 1);
    // Support legs.
    g.fillStyle = _CYP.slateD;
    g.fillRect(x + 4,     baseY - 3, 1, 3);
    g.fillRect(x + w - 5, baseY - 3, 1, 3);
  }

  // ---- Rooftop dispatcher -------------------------------------------
  // Picks one of 5 rooftop variants: garden, solar canopy, dome,
  // cherry blossom, planter + shrubs. Cherry blossom rarer (~15%)
  // so it reads as a focal feature on the skyline.
  function _cyDrawRooftop(g, x, baseY, w, idx, rng) {
    var v = idx % 7;
    if (v === 0 || v === 5) {
      _cyDrawRoofGarden(g, x, baseY, w, rng);
    } else if (v === 1) {
      _cyDrawSolarCanopy(g, x, baseY, w);
    } else if (v === 2) {
      // Domed observatory roof.
      var dr = Math.max(3, Math.floor(w / 3));
      var cx = x + Math.floor(w / 2);
      g.fillStyle = _CYP.creamShade;
      g.beginPath(); g.arc(cx, baseY, dr, Math.PI, 0); g.fill();
      g.fillStyle = _CYP.creamHi;
      g.fillRect(cx - dr + 2, baseY - dr + 1, 2, 2);
      g.fillStyle = _CYP.outline;
      g.fillRect(cx, baseY - dr - 4, 1, 4);
      g.fillStyle = _CYP.accent;
      g.fillRect(cx, baseY - dr - 4, 1, 1);
    } else if (v === 3) {
      // Cherry blossom rooftop tree - signature pink accent.
      _cyDrawCherryRoof(g, x, baseY, w, rng);
    } else if (v === 6) {
      _cyDrawSolarCanopy(g, x, baseY, w);
    } else {
      // Tiered planter step + sky-bridge anchor.
      g.fillStyle = _CYP.creamShade;
      g.fillRect(x + 4, baseY - 3, w - 8, 3);
      g.fillStyle = _CYP.creamHi;
      g.fillRect(x + 4, baseY - 3, w - 8, 1);
      g.fillStyle = _CYP.leafMid;
      g.fillRect(x + 5,      baseY - 5, 2, 2);
      g.fillRect(x + w - 7,  baseY - 5, 2, 2);
      g.fillStyle = _CYP.leafLt;
      g.fillRect(x + 5,      baseY - 5, 1, 1);
      g.fillRect(x + w - 7,  baseY - 5, 1, 1);
    }
  }

  // =================================================================
  // FAR SKYLINE PAINTER - pale, blurred, atmospheric-perspective.
  // =================================================================
  function _cyPaintFar(g) {
    var rng = _cyRng(0xC1FA);
    var W = 960;
    // v0.57: removed the white haze background per Mark - the towers
    // already carry the right hue, and the white wash was creating a
    // stark light band under the blue sky. The global multiply-darken
    // in the shader pass provides the atmospheric recession.

    // 90 towers (up from 60) for a denser skyline. Mix tall + short
    // so the silhouette has rhythm. Each tower has a 3-tone body
    // shade (left dark, mid body, right highlight) so it reads as
    // solid even at low contrast.
    var towers = [];
    for (var i = 0; i < 90; i++) {
      towers.push({
        x: Math.floor(rng() * (W + 60)) - 40,
        w: 7 + Math.floor(rng() * 18),
        h: 30 + Math.floor(rng() * 90),
        r: rng(),
        roof: Math.floor(rng() * 6),
        billboard: rng() > 0.85,        // 15% have a colored billboard
        billboardCol: ['#FF4FA8', '#5AE8FF', '#FFD23A', '#FF8A40'][Math.floor(rng() * 4)]
      });
    }
    towers.sort(function (a, b) { return b.h - a.h; });
    for (var k = 0; k < towers.length; k++) {
      var T = towers[k];
      var baseY = 140 - T.h;
      // Depth tint: tallest = palest, shorter = slightly more saturated.
      var depth = 1 - Math.max(0, Math.min(1, (T.h - 30) / 90));
      // v0.57: shifted bluer per Mark - "blue shift the background
      // buildings a little." Far towers pull toward sky color.
      var rT = Math.floor(_cyMix(200, 148, depth));
      var gT = Math.floor(_cyMix(220, 178, depth));
      var bT = Math.floor(_cyMix(244, 210, depth));
      var col = _cyHex(rT, gT, bT);
      var shade = _cyHex(rT - 22, gT - 18, bT - 12);
      var hi = _cyHex(Math.min(255, rT + 18), Math.min(255, gT + 14), Math.min(255, bT + 8));
      g.fillStyle = col; g.fillRect(T.x, baseY, T.w, T.h);
      g.fillStyle = shade; g.fillRect(T.x, baseY, 2, T.h);
      g.fillStyle = hi;    g.fillRect(T.x + T.w - 1, baseY, 1, T.h);
      g.fillStyle = hi;    g.fillRect(T.x, baseY, T.w, 1);
      // Subtle panel division at ~60% height (mid-tier setback hint).
      if ((k & 3) === 0 && T.h > 60) {
        var setY = baseY + Math.floor(T.h * 0.4);
        g.fillStyle = shade;
        g.fillRect(T.x, setY, T.w, 1);
        g.fillStyle = hi;
        g.fillRect(T.x, setY + 1, T.w, 1);
      }
      // Roof variants (6 options for skyline silhouette variety).
      if (T.roof === 0) {
        g.fillStyle = shade;
        g.fillRect(T.x + 1, baseY - 2, T.w - 2, 2);
        g.fillStyle = hi;
        g.fillRect(T.x + 1, baseY - 2, T.w - 2, 1);
      } else if (T.roof === 1) {
        // Soft dome.
        var dr = Math.max(2, Math.floor(T.w / 3));
        g.fillStyle = col;
        g.beginPath(); g.arc(T.x + T.w / 2, baseY, dr, Math.PI, 0); g.fill();
        g.fillStyle = hi;
        g.fillRect(T.x + T.w / 2 - 1, baseY - dr + 1, 1, 1);
      } else if (T.roof === 2) {
        // Tall thin spire.
        g.fillStyle = shade;
        g.fillRect(T.x + Math.floor(T.w / 2), baseY - 12, 1, 12);
        g.fillStyle = col;
        g.fillRect(T.x + Math.floor(T.w / 2) - 1, baseY - 5, 3, 2);
      } else if (T.roof === 3) {
        // Tapered crown.
        g.fillStyle = col;
        g.fillRect(T.x + 1,         baseY - 2, T.w - 2, 2);
        g.fillRect(T.x + 2,         baseY - 4, T.w - 4, 2);
        g.fillRect(T.x + 3,         baseY - 6, T.w - 6, 2);
        g.fillStyle = shade;
        g.fillRect(T.x + Math.floor(T.w / 2), baseY - 10, 1, 4);
      } else if (T.roof === 4) {
        // Twin-spire crown.
        g.fillStyle = shade;
        g.fillRect(T.x + 1,        baseY - 6, 1, 6);
        g.fillRect(T.x + T.w - 2,  baseY - 6, 1, 6);
        g.fillStyle = col;
        g.fillRect(T.x + 1,        baseY - 2, T.w - 2, 2);
      } else {
        // Slanted asymmetric roof.
        g.fillStyle = shade;
        for (var sl = 0; sl < Math.min(5, Math.floor(T.w / 2)); sl++) {
          g.fillRect(T.x + sl, baseY - 1 - sl, T.w - sl, 1);
        }
      }
      // Distant neon billboard — a colored block on the upper third
      // of select towers. Visible at distance as a glowing rectangle.
      if (T.billboard && T.h > 50) {
        var bbW = Math.max(4, T.w - 4);
        var bbH = 6;
        var bbX = T.x + Math.floor((T.w - bbW) / 2);
        var bbY = baseY + 8;
        g.fillStyle = '#0E1422';
        g.fillRect(bbX, bbY, bbW, bbH);
        // Faded billboard color (atmospheric perspective dims neon too).
        var bbAlpha = 1 - depth * 0.4;
        g.fillStyle = T.billboardCol;
        g.globalAlpha = bbAlpha;
        g.fillRect(bbX + 1, bbY + 1, bbW - 2, bbH - 2);
        g.globalAlpha = 1;
        // Bright pixel highlight.
        g.fillStyle = '#FFFFFF';
        g.fillRect(bbX + 1, bbY + 1, 1, 1);
      }
      // Sparse window hints on the closer towers (more visible than
      // before because Mark wants more skyline detail visible).
      if (depth < 0.6) {
        var winCol = _cyHex(rT - 28, gT - 22, bT - 10);
        for (var wy = baseY + 8; wy < baseY + T.h - 4; wy += 6) {
          for (var wx = T.x + 2; wx < T.x + T.w - 2; wx += 4) {
            var lit = ((wx * 13 + wy * 7 + k) & 0xf);
            if (lit < 4) {
              g.fillStyle = winCol;
              g.fillRect(wx, wy, 1, 1);
            } else if (lit < 6 && depth < 0.3) {
              // Faint warm window glow on closer towers.
              g.fillStyle = 'rgba(255,210,160,' + (0.4 * (1 - depth)).toFixed(2) + ')';
              g.fillRect(wx, wy, 1, 1);
            }
          }
        }
      }
      // Rare aviation strobe on spire roofs.
      if (T.roof === 2 && (k % 9) === 3) {
        g.fillStyle = '#FF6464';
        g.fillRect(T.x + Math.floor(T.w / 2), baseY - 12, 1, 1);
      }
    }

    // v0.57: replaced the white haze passes with a single SUBTLE
    // BLUE TINT per Mark - "the background buildings already have the
    // right hue, they need to be just blue-shifted a little." No
    // white anywhere; the global multiply darken in the shader pass
    // provides the depth.
    g.fillStyle = 'rgba(140,170,220,0.18)';
    g.fillRect(0, 50, W, 95);
  }

  // =================================================================
  // MID CITY PAINTER - cream/tan buildings with rich rooftop gardens.
  // =================================================================
  function _cyPaintMid(g) {
    var rng = _cyRng(0x32FF);
    var W = 960, H = 180;
    var x = -10;
    var k = 0;
    var prevTop = null;     // for sky-bridges between adjacent towers
    while (x < W + 20) {
      var w = 28 + Math.floor(rng() * 22);
      var h = 46 + Math.floor(rng() * 58);
      var baseY = 148 - h;
      k++;
      // DEEPENED body palette per Mark's brief - less pastel, more
      // saturated solarpunk accent colors. Cream + warm-brown still
      // dominate but each accent tone is now richer than the previous
      // wash of pale pastels.
      var tone = Math.floor(rng() * 10);
      var body, shade, hi;
      if (tone < 2) {
        // Warm cream (mid-saturation).
        body = '#D6BD8E';  shade = '#8A6D40';  hi = '#F0DEB0';
      } else if (tone < 4) {
        // Warm ochre / muted brown.
        body = '#B89066';  shade = '#7A5A38';  hi = '#D8B080';
      } else if (tone === 4) {
        // Deep teal glass tower.
        body = '#5A8590';  shade = '#2C4858';  hi = '#88B0B8';
      } else if (tone === 5) {
        // Saturated coral.
        body = '#D87060';  shade = '#8A3838';  hi = '#F4A088';
      } else if (tone === 6) {
        // Rich peach / warm orange.
        body = '#E89860';  shade = '#A05828';  hi = '#FFC088';
      } else if (tone === 7) {
        // Deep lavender / plum.
        body = '#806CA0';  shade = '#4A3868';  hi = '#A892C0';
      } else if (tone === 8) {
        // Forest mint green.
        body = '#6A9878';  shade = '#365844';  hi = '#90C098';
      } else {
        // Saturated rose pink.
        body = '#D078A0';  shade = '#883858';  hi = '#F0A0C8';
      }
      // Body.
      g.fillStyle = body;  g.fillRect(x, baseY, w, h);
      // Silhouette variant.
      var silh = Math.floor(rng() * 4);
      if (silh === 1) {
        // Rounded top corners.
        g.clearRect(x,           baseY,     2, 1);
        g.clearRect(x + 1,       baseY,     1, 1);
        g.clearRect(x + w - 2,   baseY,     2, 1);
        g.clearRect(x + w - 1,   baseY + 1, 1, 1);
        g.clearRect(x,           baseY + 1, 1, 1);
      } else if (silh === 2) {
        // Tapered top.
        for (var tp = 0; tp < 4; tp++) {
          g.clearRect(x, baseY + tp, 2 - Math.floor(tp / 2), 1);
          g.clearRect(x + w - (2 - Math.floor(tp / 2)), baseY + tp, 2 - Math.floor(tp / 2), 1);
        }
      } else if (silh === 3) {
        // Stepped setback.
        var sw = Math.floor(w * 0.75), sh = Math.floor(h * 0.25);
        var sx = x + Math.floor((w - sw) / 2);
        g.fillStyle = body;
        g.fillRect(sx, baseY - sh, sw, sh);
        g.fillStyle = shade;
        g.fillRect(sx, baseY - sh, 1, sh);
        g.fillStyle = hi;
        g.fillRect(sx + sw - 1, baseY - sh, 1, sh);
        // Window grid on the setback.
        _cyDrawWindowGrid(g, sx, baseY - sh, sw, sh, null, 0.5);
        _cyRoundCorners(g, sx, baseY - sh, sw, sh, shade);
      }
      // Edges + base shadow.
      g.fillStyle = shade; g.fillRect(x, baseY + 2, 1, h - 2);
      g.fillStyle = shade; g.fillRect(x, baseY + h - 2, w, 2);
      g.fillStyle = hi;    g.fillRect(x + w - 1, baseY + 2, 1, h - 2);
      g.fillStyle = hi;    g.fillRect(x + 2, baseY, w - 4, 1);
      // Panel seams (sparse).
      _cyPanelSeams(g, x, baseY + 4, w, h - 4, shade, hi);
      // Window grid.
      _cyDrawWindowGrid(g, x, baseY, w, h, null, 0.55);
      // Rounded corners on the body.
      _cyRoundCorners(g, x, baseY, w, h, shade);
      // Vertical garden building: ~12% of towers get their entire
      // facade covered in cascading greenery (a living-wall feature).
      // Reads strongly as solarpunk.
      var verticalGarden = rng() > 0.88;
      if (verticalGarden) {
        // Paint a leaf-textured overlay across the whole face.
        for (var vgy = baseY + 4; vgy < baseY + h - 4; vgy += 1) {
          for (var vgx = x + 2; vgx < x + w - 2; vgx += 1) {
            var n = ((vgx * 31 + vgy * 17) & 0xf);
            if (n < 11) {
              g.fillStyle = (n < 3) ? _CYP.leafDkr
                          : (n < 6) ? _CYP.leafDk
                          : (n < 9) ? _CYP.leafMid
                                     : _CYP.leafLt;
              g.fillRect(vgx, vgy, 1, 1);
            }
          }
        }
        // Scattered cherry blossoms across the wall.
        for (var bsl = 0; bsl < 6; bsl++) {
          var bsx = x + 4 + Math.floor(rng() * (w - 8));
          var bsy = baseY + 6 + Math.floor(rng() * (h - 12));
          g.fillStyle = _CYP.blossom;
          g.fillRect(bsx, bsy, 1, 1);
          if (rng() > 0.5) {
            g.fillStyle = _CYP.blossomDk;
            g.fillRect(bsx + 1, bsy, 1, 1);
          }
        }
        // A few warm windows poking through the foliage.
        for (var vwn = 0; vwn < 3; vwn++) {
          var vwy = baseY + 12 + vwn * 18;
          if (vwy > baseY + h - 6) break;
          var vwx = x + Math.floor(w / 2) - 2;
          g.fillStyle = _CYP.outlineD;
          g.fillRect(vwx, vwy, 4, 5);
          g.fillStyle = _CYP.warmWin;
          g.fillRect(vwx + 1, vwy + 1, 2, 3);
          g.fillStyle = _CYP.warmWinH;
          g.fillRect(vwx + 1, vwy + 1, 2, 1);
        }
      } else if (rng() > 0.65) {
        // Standard cascading vine on a regular building.
        var vx = x + 3 + Math.floor(rng() * (w - 8));
        var vh = 8 + Math.floor(rng() * 14);
        g.fillStyle = _CYP.leafDk;
        for (var vy = 0; vy < vh; vy++) {
          var jitter = Math.sin(vy * 0.7) | 0;
          g.fillRect(vx + jitter, baseY + vy + 4, 1, 1);
          if (vy % 3 === 0) {
            g.fillStyle = _CYP.leafMid;
            g.fillRect(vx + jitter - 1, baseY + vy + 4, 1, 1);
            g.fillStyle = _CYP.leafDk;
          }
        }
      } else if (rng() > 0.55) {
        // Side-mounted solar array on the facade (5-cell vertical strip).
        var saSide = (rng() > 0.5);
        var sax = saSide ? (x + 3) : (x + w - 7);
        var say = baseY + 16 + Math.floor(rng() * (h - 40));
        g.fillStyle = _CYP.outlineD;
        g.fillRect(sax - 1, say - 1, 6, 16);
        g.fillStyle = _CYP.teal;
        g.fillRect(sax, say, 4, 14);
        g.fillStyle = _CYP.tealH;
        g.fillRect(sax, say, 4, 1);
        g.fillStyle = _CYP.tealD;
        for (var cell = 0; cell < 4; cell++) {
          g.fillRect(sax, say + 3 + cell * 3, 4, 1);
        }
      }
      // ========== ANCHOR TREATMENT for mid-city buildings ==========
      // Each building gets a chance at: vertical neon sign, balcony
      // shelves with cascading planter foliage, warm window pairs,
      // side pipes, glow halos around windows. Mark loved this look
      // on the foreground anchors and wants it spread across the city.

      // 1. VERTICAL NEON SIGN — ~38% of mid buildings get one running
      //    down one side. Smaller + a touch dimmer than the foreground
      //    anchors so the layer reads as receding.
      if (rng() < 0.24 && w > 26 && h > 50) {   // v0.76: 0.38 -> 0.24 declutter
        var neonOnRight = rng() > 0.5;
        var neonCols = ['#FF4FA8', '#5AE8FF', '#FFD23A', '#FF8A40', '#A0F060'];
        var neonCol = neonCols[Math.floor(rng() * 5)];
        var neonGlow = neonCol === '#FF4FA8' ? 'rgba(255,79,168,0.22)'
                     : neonCol === '#5AE8FF' ? 'rgba(90,232,255,0.22)'
                     : neonCol === '#FFD23A' ? 'rgba(255,210,58,0.20)'
                     : neonCol === '#FF8A40' ? 'rgba(255,138,64,0.22)'
                                              : 'rgba(160,240,96,0.20)';
        var nx = neonOnRight ? x + w - 6 : x + 2;
        var nh = Math.min(h - 20, 48);
        var ny = baseY + 6;
        // Dark panel.
        g.fillStyle = '#0A0E18';
        g.fillRect(nx, ny, 4, nh);
        // Glow halo around the sign.
        g.fillStyle = neonGlow;
        g.fillRect(nx - 3, ny - 1, 10, nh + 2);
        // Re-paint dark panel on top of halo.
        g.fillStyle = '#0A0E18';
        g.fillRect(nx + 1, ny + 1, 2, nh - 2);
        // Glyph stack - smaller than foreground (4x6 cells vs 4x8).
        var glyphsMid = [
          [[0,0,3,1],[0,1,1,2],[2,1,1,1],[0,3,3,1]],
          [[0,0,3,1],[1,1,1,2],[0,3,3,1]],
          [[0,0,1,3],[2,0,1,3],[0,2,3,1]],
          [[0,1,3,1],[1,0,1,3],[0,2,3,1]],
          [[0,0,3,3]]
        ];
        var charHMid = 6;
        for (var gc = 0; gc < Math.floor(nh / charHMid); gc++) {
          var gly = glyphsMid[Math.floor(rng() * 5)];
          g.fillStyle = neonCol;
          for (var gp = 0; gp < gly.length; gp++) {
            g.fillRect(nx + 1 + gly[gp][0], ny + 1 + gc * charHMid + gly[gp][1],
                       gly[gp][2], gly[gp][3]);
          }
          g.fillStyle = '#FFFFFF';
          g.fillRect(nx + 1, ny + 1 + gc * charHMid, 1, 1);
        }
      }

      // 2. BALCONY SHELVES with cascading planter foliage on ~55% of
      //    buildings (skipping vertical gardens which already have
      //    leaves everywhere).
      if (!verticalGarden && rng() < 0.38 && w > 22 && h > 50) {  // v0.76: 0.55 -> 0.38
        // 2-4 balcony shelves spaced down the facade.
        var balconies = 2 + Math.floor(rng() * 3);
        var spacing = Math.floor(h / (balconies + 1));
        for (var bc = 0; bc < balconies; bc++) {
          var balY = baseY + spacing * (bc + 1);
          if (balY > baseY + h - 12) break;
          // Shelf.
          g.fillStyle = shade;
          g.fillRect(x + 2, balY, w - 4, 2);
          g.fillStyle = hi;
          g.fillRect(x + 2, balY, w - 4, 1);
          // Railing bars.
          g.fillStyle = _CYP.outlineD;
          g.fillRect(x + 3, balY + 2, w - 6, 1);
          for (var rb = x + 4; rb < x + w - 4; rb += 3) {
            g.fillRect(rb, balY + 3, 1, 2);
          }
          // Cascading foliage spilling over the rail.
          g.fillStyle = _CYP.leafDk;
          for (var pf = x + 3; pf < x + w - 3; pf += 3) {
            var trailLen = 3 + ((pf * 13 + balY * 7) & 3);
            g.fillRect(pf, balY + 5, 1, trailLen);
          }
          g.fillStyle = _CYP.leafMid;
          for (var pf2 = x + 4; pf2 < x + w - 3; pf2 += 4) {
            g.fillRect(pf2, balY + 5, 1, 2);
          }
          g.fillStyle = _CYP.leafLt;
          g.fillRect(x + Math.floor(w / 2), balY + 5, 1, 1);
          // Occasional blossom dots on the foliage.
          if ((bc + k) & 1) {
            g.fillStyle = _CYP.blossom;
            g.fillRect(x + 5,         balY + 6, 1, 1);
            g.fillRect(x + w - 6,     balY + 7, 1, 1);
          }
        }
      }

      // 3. WARM WINDOW GLOW HALOS — on ~30% of buildings add soft
      //    halos around random window positions so the city feels lit.
      if (!verticalGarden && rng() < 0.18 && h > 40) {  // v0.76: 0.30 -> 0.18
        for (var gh = 0; gh < 2; gh++) {
          var ghx = x + 3 + Math.floor(rng() * (w - 8));
          var ghy = baseY + 8 + Math.floor(rng() * (h - 16));
          g.fillStyle = 'rgba(255,210,140,0.18)';
          g.fillRect(ghx - 2, ghy - 2, 6, 6);
          // Bright lit center.
          g.fillStyle = '#FFE8A0';
          g.fillRect(ghx, ghy, 2, 2);
        }
      }

      // 4. SIDE PIPE — vertical pipe with joints on ~35% of buildings.
      if (rng() < 0.22 && h > 50) {   // v0.76: 0.35 -> 0.22 declutter
        var pipeSide = rng() > 0.5;
        var ppx = pipeSide ? x + w - 2 : x + 1;
        g.fillStyle = shade;
        g.fillRect(ppx,     baseY + 4, 1, h - 8);
        g.fillStyle = '#5A4830';
        g.fillRect(ppx + (pipeSide ? -1 : 1), baseY + 4, 1, h - 8);
        // Joint bands every 12 px.
        for (var pj = baseY + 14; pj < baseY + h - 8; pj += 14) {
          g.fillStyle = _CYP.outlineD;
          g.fillRect(ppx - 1, pj, 3, 2);
        }
      }

      // Rooftop ornament.
      _cyDrawRooftop(g, x, baseY, w, k, rng);

      // 5. BILLBOARD AD PANEL — ~12% of buildings get a square ad
      //    billboard on the upper facade. Mark's references show
      //    anime-style portrait ads + product photos. Procedural here
      //    so each looks distinct.
      if (rng() < 0.08 && w > 30 && h > 70) {   // v0.76: 0.12 -> 0.08 declutter
        var adW = Math.min(w - 8, 18);
        var adH = Math.min(20, Math.floor(h * 0.3));
        var adX = x + Math.floor((w - adW) / 2);
        var adY = baseY + 8;
        // Outer frame.
        g.fillStyle = '#0E1422';
        g.fillRect(adX - 1, adY - 1, adW + 2, adH + 2);
        // Inner background (pale teal / pink / yellow depending on ad).
        var adKind = Math.floor(rng() * 3);
        if (adKind === 0) {
          // Portrait ad - peach skin, dark hair, pink BG (anime).
          g.fillStyle = '#F0B0C0';
          g.fillRect(adX, adY, adW, adH);
          // Hair (dark).
          g.fillStyle = '#3A2840';
          g.fillRect(adX + 2, adY + 1, adW - 4, 5);
          g.fillRect(adX + 1, adY + 3, 2, 4);
          g.fillRect(adX + adW - 3, adY + 3, 2, 4);
          // Face.
          g.fillStyle = '#FFE0C8';
          g.fillRect(adX + 4, adY + 5, adW - 8, 5);
          // Eyes.
          g.fillStyle = '#3A2840';
          g.fillRect(adX + 5, adY + 7, 1, 1);
          g.fillRect(adX + adW - 6, adY + 7, 1, 1);
          // Cheek blush.
          g.fillStyle = '#F08AB0';
          g.fillRect(adX + 4, adY + 9, 1, 1);
          g.fillRect(adX + adW - 5, adY + 9, 1, 1);
          // Shoulders / outfit.
          g.fillStyle = '#5AB8E8';
          g.fillRect(adX + 2, adY + 11, adW - 4, adH - 13);
          // Text bar at bottom.
          g.fillStyle = '#FFFFFF';
          g.fillRect(adX + 2, adY + adH - 3, adW - 4, 2);
          g.fillStyle = '#FF4FA8';
          g.fillRect(adX + 3, adY + adH - 2, 4, 1);
          g.fillRect(adX + 8, adY + adH - 2, 2, 1);
        } else if (adKind === 1) {
          // Product/logo ad - bright color block + logo glyph.
          var adBG = ['#FFD23A', '#5AE8FF', '#FF4FA8'][Math.floor(rng() * 3)];
          g.fillStyle = adBG;
          g.fillRect(adX, adY, adW, adH);
          // Logo glyph (centered circle + accent).
          g.fillStyle = '#FFFFFF';
          g.beginPath();
          g.arc(adX + adW / 2, adY + adH / 2, Math.min(4, adW / 4), 0, 6.28);
          g.fill();
          g.fillStyle = '#0E1422';
          g.fillRect(adX + adW / 2 - 1, adY + adH / 2 - 1, 2, 2);
          // Text bars.
          g.fillStyle = '#0E1422';
          g.fillRect(adX + 2, adY + adH - 4, adW - 4, 1);
          g.fillRect(adX + 3, adY + adH - 2, adW - 6, 1);
        } else {
          // Scrolling text-style ad - dark bg with bright kanji-style glyphs.
          g.fillStyle = '#0E1422';
          g.fillRect(adX, adY, adW, adH);
          var txCol = ['#5AE8FF', '#FFD23A', '#A0F060'][Math.floor(rng() * 3)];
          g.fillStyle = txCol;
          for (var trow = 0; trow < 3; trow++) {
            var ty2 = adY + 3 + trow * 6;
            if (ty2 > adY + adH - 4) break;
            for (var tcol = 0; tcol < 3; tcol++) {
              var tx2 = adX + 2 + tcol * 5;
              if (tx2 > adX + adW - 3) break;
              g.fillRect(tx2, ty2, 3, 1);
              g.fillRect(tx2, ty2 + 2, 3, 1);
              g.fillRect(tx2 + 1, ty2 + 1, 1, 1);
            }
          }
        }
        // Support struts down from the billboard to the rooftop edge.
        g.fillStyle = '#0E1422';
        g.fillRect(adX + 2,         adY + adH, 1, 2);
        g.fillRect(adX + adW - 3,   adY + adH, 1, 2);
        // Soft glow halo around the ad.
        g.fillStyle = 'rgba(255,255,255,0.10)';
        g.fillRect(adX - 3, adY - 3, adW + 6, adH + 6);
      }

      // Sky-bridge from prev tower's top: relaxed to allow bridges
      // up to 40 px wide and heights within 20 px (almost any near
      // neighbour). Two visual variants: short cream walkway or
      // longer teal-glass tube depending on gap.
      if (prevTop && (x - prevTop.right) < 40 && Math.abs(prevTop.y - baseY) < 20) {
        var bridgeY = Math.min(prevTop.y, baseY) + 10;
        var gap = x - prevTop.right;
        if (gap > 18) {
          // Long teal-glass tube bridge with vine drape underneath.
          g.fillStyle = _CYP.tealD;
          g.fillRect(prevTop.right, bridgeY - 1, gap, 1);
          g.fillRect(prevTop.right, bridgeY + 5, gap, 1);
          g.fillStyle = _CYP.tealH;
          g.fillRect(prevTop.right, bridgeY,     gap, 5);
          g.fillStyle = '#D8F0F2';
          g.fillRect(prevTop.right, bridgeY,     gap, 1);
          g.fillStyle = _CYP.tealD;
          for (var bm = prevTop.right + 4; bm < x; bm += 4) {
            g.fillRect(bm, bridgeY, 1, 5);
          }
          // Vines draping under.
          g.fillStyle = _CYP.leafDk;
          for (var bv = prevTop.right + 2; bv < x; bv += 5) {
            var bvl = 2 + ((bv * 7) & 3);
            g.fillRect(bv, bridgeY + 6, 1, bvl);
          }
          g.fillStyle = _CYP.leafMid;
          for (var bv2 = prevTop.right + 4; bv2 < x; bv2 += 5) {
            g.fillRect(bv2, bridgeY + 6, 1, 1);
          }
        } else {
          // Short cream walkway bridge.
          g.fillStyle = _CYP.creamShade;
          g.fillRect(prevTop.right, bridgeY, gap, 4);
          g.fillStyle = _CYP.creamHi;
          g.fillRect(prevTop.right, bridgeY, gap, 1);
          g.fillStyle = _CYP.tealH;
          g.fillRect(prevTop.right + 1, bridgeY + 1, gap - 2, 2);
          g.fillStyle = _CYP.outlineD;
          g.fillRect(prevTop.right + 0, bridgeY + 4, 1, 4);
          g.fillRect(x - 1,             bridgeY + 4, 1, 4);
        }
      }
      prevTop = { right: x + w, y: baseY };
      // Advance to next building with small overlap.
      x += w - 2 - Math.floor(rng() * 4);
    }
    // SIGNATURE FEATURE - giant botanical greenhouse domes in the
    // mid distance. Read as the district's central arboretum.
    // Mark's brief listed "greenhouse dome in the distance" as a
    // memorable feature. 3 across the cached canvas so at least one
    // is on-screen at most camera positions.
    _cyDrawGreenhouseDome(g, 160, 100);
    _cyDrawGreenhouseDome(g, 480, 106);
    _cyDrawGreenhouseDome(g, 800, 98);
  }

  // ---- Greenhouse / botanical dome ---------------------------------
  function _cyDrawGreenhouseDome(g, cx, cy) {
    var dr = 28;
    // Base platform.
    g.fillStyle = _CYP.creamShade;
    g.fillRect(cx - 30, cy + 4, 60, 6);
    g.fillStyle = _CYP.creamHi;
    g.fillRect(cx - 30, cy + 4, 60, 1);
    g.fillStyle = '#8C7448';
    g.fillRect(cx - 30, cy + 9, 60, 1);
    // Stepped platform descent.
    g.fillStyle = _CYP.creamShade;
    g.fillRect(cx - 22, cy + 10, 44, 2);
    g.fillRect(cx - 16, cy + 12, 32, 2);
    // Main dome (half-circle).
    g.fillStyle = _CYP.teal;
    g.beginPath(); g.arc(cx, cy + 4, dr, Math.PI, 0); g.fill();
    g.fillStyle = _CYP.tealH;
    g.beginPath(); g.arc(cx, cy + 4, dr - 2, Math.PI, 0); g.fill();
    g.fillStyle = _CYP.teal;
    g.beginPath(); g.arc(cx, cy + 4, dr - 4, Math.PI, 0); g.fill();
    // Glass panel framework - radial lines from apex.
    g.strokeStyle = _CYP.tealD;
    g.lineWidth = 1;
    g.beginPath();
    for (var ra = 0; ra < 7; ra++) {
      var ang = Math.PI + (ra / 6) * Math.PI;
      g.moveTo(cx, cy + 4);
      g.lineTo(cx + Math.cos(ang) * dr, cy + 4 + Math.sin(ang) * dr);
    }
    g.stroke();
    // Horizontal arcs (latitude bands).
    g.beginPath();
    for (var hb = 0; hb < 3; hb++) {
      var hr = (dr - 4) * (1 - (hb + 1) / 4);
      g.arc(cx, cy + 4, hr, Math.PI, 0);
    }
    g.stroke();
    // Bright sun-catch reflection.
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.fillRect(cx - 10, cy - 14, 4, 2);
    g.fillRect(cx - 12, cy - 10, 2, 4);
    // Apex spire with weathervane.
    g.fillStyle = _CYP.outlineD;
    g.fillRect(cx, cy - 26, 1, 6);
    g.fillRect(cx - 1, cy - 26, 3, 1);
    g.fillStyle = _CYP.accent;
    g.fillRect(cx, cy - 28, 1, 2);
    // Hint of greenery inside (faint dark green smudges visible
    // through the glass).
    g.fillStyle = 'rgba(31,86,57,0.55)';
    g.fillRect(cx - 18, cy - 4, 6, 4);
    g.fillRect(cx - 8,  cy - 8, 6, 6);
    g.fillRect(cx + 4,  cy - 6, 6, 5);
    g.fillRect(cx + 14, cy - 2, 4, 3);
    g.fillStyle = 'rgba(101,185,95,0.65)';
    g.fillRect(cx - 6,  cy - 7, 3, 2);
    g.fillRect(cx + 6,  cy - 5, 3, 2);
    // Door at the base.
    g.fillStyle = _CYP.outlineD;
    g.fillRect(cx - 4, cy + 1, 8, 5);
    g.fillStyle = _CYP.warmWin;
    g.fillRect(cx - 3, cy + 2, 6, 4);
    g.fillStyle = _CYP.warmWinH;
    g.fillRect(cx - 3, cy + 2, 6, 1);
    g.fillStyle = _CYP.outlineD;
    g.fillRect(cx,     cy + 2, 1, 4);
    // Side accent towers framing the dome.
    g.fillStyle = _CYP.creamShade;
    g.fillRect(cx - 28, cy - 8, 4, 14);
    g.fillRect(cx + 24, cy - 8, 4, 14);
    g.fillStyle = _CYP.creamHi;
    g.fillRect(cx - 28, cy - 8, 4, 1);
    g.fillRect(cx + 24, cy - 8, 4, 1);
    g.fillStyle = _CYP.teal;
    g.fillRect(cx - 27, cy - 5, 2, 8);
    g.fillRect(cx + 25, cy - 5, 2, 8);
    // Top accent lantern on the side towers.
    g.fillStyle = _CYP.accent;
    g.fillRect(cx - 27, cy - 9, 2, 1);
    g.fillRect(cx + 25, cy - 9, 2, 1);
  }

  // =================================================================
  // BRIDGE / STREET-LEVEL SHOPFRONT PAINTER - cozy walkway behind player.
  // =================================================================
  function _cyPaintBridge(g) {
    var rng = _cyRng(0xB12D);
    var W = 960;
    g.clearRect(0, 0, W, 180);
    // Walk left-to-right placing storefronts.
    var x = -10;
    var k = 0;
    while (x < W + 20) {
      // v0.57 - 1-in-3 iterations pick a SPECIALTY building (clock
      // tower, bath house, transit kiosk, library, greenhouse stall,
      // food cart) instead of the standard shopfront so the layer
      // reads as varied per Mark's "more variety, more distinct
      // buildings like layer 4" brief. Each specialty advances x
      // and continues the loop.
      if (rng() < 0.36) {
        var specW = _cyPaintBridgeSpecialty(g, x, rng, k);
        x += specW;
        k++;
        continue;
      }
      var w = 36 + Math.floor(rng() * 28);
      var h = 30 + Math.floor(rng() * 14);
      var baseY = 152 - h;
      k++;
      // Shopfront body palette - rotate through cream / tan / teal.
      var palette = [
        ['#F0E0C0', '#C0A878', '#FFEFD0'],
        ['#E8C8A0', '#A88858', '#FFE4C0'],
        ['#C8DAD0', '#8FA7A8', '#E8F0E8'],
        ['#E8CCD8', '#A88898', '#FFE8F0']
      ];
      var pal = palette[k % palette.length];
      var body = pal[0], shade = pal[1], hi = pal[2];
      g.fillStyle = body;  g.fillRect(x, baseY, w, h);
      g.fillStyle = shade; g.fillRect(x, baseY, 1, h);
      g.fillStyle = hi;    g.fillRect(x + w - 1, baseY, 1, h);
      g.fillStyle = hi;    g.fillRect(x, baseY, w, 1);
      g.fillStyle = shade; g.fillRect(x, baseY + h - 1, w, 1);
      _cyRoundCorners(g, x, baseY, w, h, shade);
      // Big shop window (warm interior).
      var ww = w - 10, wh = h - 16;
      var wx = x + 5, wy = baseY + 10;
      g.fillStyle = _CYP.outlineD;
      g.fillRect(wx - 1, wy - 1, ww + 2, wh + 2);
      // Warm interior.
      var interior = (k % 2) ? _CYP.warmWin : _CYP.warmWinH;
      g.fillStyle = interior;
      g.fillRect(wx, wy, ww, wh);
      // Window grid (3 panes).
      g.fillStyle = _CYP.outlineD;
      for (var pn = wx + Math.floor(ww / 3); pn < wx + ww; pn += Math.floor(ww / 3)) {
        g.fillRect(pn, wy, 1, wh);
      }
      g.fillRect(wx, wy + Math.floor(wh / 2), ww, 1);
      // Merchandise / patron silhouettes inside.
      g.fillStyle = _CYP.outline;
      var slots = Math.max(2, Math.floor(ww / 7));
      for (var si = 0; si < slots; si++) {
        var stx = wx + 2 + si * Math.floor(ww / slots);
        var sth = 3 + ((si + k) % 3) * 2;
        g.fillRect(stx, wy + wh - 1 - sth, 2, sth);
      }
      // Striped awning above the window.
      var aw = w - 6, ax = x + 3;
      var awningTypes = ['R', 'O', 'C'];
      var atype = awningTypes[k % awningTypes.length];
      var aCol  = _CYP['awning' + atype];
      var aColD = _CYP['awning' + atype + 'D'];
      var aColH = _CYP['awning' + atype + 'H'];
      g.fillStyle = aColD;
      g.fillRect(ax, baseY + 6, aw, 4);
      g.fillStyle = aCol;
      g.fillRect(ax, baseY + 5, aw, 2);
      g.fillStyle = aColH;
      g.fillRect(ax, baseY + 5, aw, 1);
      // Awning stripes (5 alternating bands).
      g.fillStyle = aColD;
      for (var sb = 0; sb < aw; sb += 5) {
        g.fillRect(ax + sb, baseY + 5, 2, 2);
      }
      // Awning scalloped edge.
      g.fillStyle = aColD;
      for (var sc = ax; sc < ax + aw - 1; sc += 5) {
        g.fillRect(sc + 1, baseY + 10, 3, 1);
        g.fillRect(sc + 2, baseY + 11, 1, 1);
      }
      // Shop sign band above the awning.
      var sgW = w - 12, sgX = x + 6;
      g.fillStyle = _CYP.outlineD;
      g.fillRect(sgX, baseY + 1, sgW, 5);
      g.fillStyle = aCol;
      g.fillRect(sgX + 1, baseY + 2, sgW - 2, 3);
      g.fillStyle = aColH;
      g.fillRect(sgX + 1, baseY + 2, sgW - 2, 1);
      // Shop icon on the left of the sign (recognizable symbol so it
      // reads as a real storefront, not a placeholder).
      var iconX = sgX + 2;
      var iconY = baseY + 2;
      var iconColor = '#fff8d8';
      g.fillStyle = iconColor;
      var shopType = (k % 5);
      if (shopType === 0) {
        // CAFE: coffee cup + handle + steam wisp.
        g.fillRect(iconX, iconY + 1, 3, 2);
        g.fillRect(iconX + 3, iconY + 1, 1, 1);             // handle
        g.fillRect(iconX + 1, iconY,     1, 1);             // steam
      } else if (shopType === 1) {
        // PARK / GARDEN: tree (canopy + trunk).
        g.fillRect(iconX, iconY,     3, 2);
        g.fillRect(iconX + 1, iconY + 2, 1, 1);             // trunk
      } else if (shopType === 2) {
        // MARKET: shopping bag (square + handle).
        g.fillRect(iconX, iconY + 1, 3, 2);
        g.fillRect(iconX + 1, iconY,     1, 1);             // handle
      } else if (shopType === 3) {
        // BAKERY: croissant / loaf curve.
        g.fillRect(iconX,     iconY + 1, 4, 1);
        g.fillRect(iconX + 1, iconY,     2, 1);
        g.fillRect(iconX,     iconY + 2, 1, 1);
        g.fillRect(iconX + 3, iconY + 2, 1, 1);
      } else {
        // FLORIST: flower (4 petals + center).
        g.fillRect(iconX + 1, iconY,     1, 1);             // top
        g.fillRect(iconX,     iconY + 1, 3, 1);             // mid
        g.fillRect(iconX + 1, iconY + 2, 1, 1);             // bottom
        g.fillStyle = _CYP.accent;
        g.fillRect(iconX + 1, iconY + 1, 1, 1);             // center
      }
      // "Faux text" name to the right of the icon.
      g.fillStyle = '#fff8d8';
      for (var ti = sgX + 8; ti < sgX + sgW - 3; ti += 4) {
        g.fillRect(ti,     baseY + 3, 1, 1);
        g.fillRect(ti + 1, baseY + 3, 1, 1);
        if ((ti + k) & 1) g.fillRect(ti, baseY + 2, 1, 1);
      }
      // Door (warm-lit interior on one side).
      var doorLeft = (k & 1) === 0;
      var dx = doorLeft ? x + 2 : x + w - 7;
      var dy = baseY + h - 12;
      g.fillStyle = _CYP.outlineD;
      g.fillRect(dx, dy, 5, 12);
      g.fillStyle = _CYP.warmWinH;
      g.fillRect(dx + 1, dy + 2, 3, 8);
      g.fillStyle = _CYP.accent;
      g.fillRect(dx + (doorLeft ? 3 : 1), dy + 6, 1, 1);   // doorknob
      // Door step / mat.
      g.fillStyle = _CYP.bark;
      g.fillRect(dx - 1, dy + 12, 7, 1);
      // Planter beside the door.
      var pxr = doorLeft ? x + 8 : x + w - 14;
      g.fillStyle = _CYP.bark;
      g.fillRect(pxr, baseY + h - 5, 5, 4);
      g.fillStyle = _CYP.barkH;
      g.fillRect(pxr, baseY + h - 5, 5, 1);
      // Plant in the planter.
      g.fillStyle = _CYP.leafDk;
      g.fillRect(pxr + 1, baseY + h - 8, 3, 3);
      g.fillStyle = _CYP.leafMid;
      g.fillRect(pxr + 2, baseY + h - 8, 1, 1);
      g.fillStyle = _CYP.leafLt;
      g.fillRect(pxr + 2, baseY + h - 8, 1, 1);
      if (rng() > 0.5) {
        g.fillStyle = _CYP.blossom;
        g.fillRect(pxr + 3, baseY + h - 9, 1, 1);
      }
      // Lamp on the corner.
      if ((k % 3) === 0) {
        var lpx = x + w - 4;
        g.fillStyle = _CYP.outlineD;
        g.fillRect(lpx, baseY + h - 18, 1, 14);
        g.fillRect(lpx - 2, baseY + h - 18, 4, 2);
        g.fillStyle = _CYP.warmWinH;
        g.fillRect(lpx - 1, baseY + h - 17, 2, 1);
      }
      // Sidewalk strip below.
      g.fillStyle = _CYP.pathShade;
      g.fillRect(x, baseY + h, w, 4);
      g.fillStyle = _CYP.pathWarm;
      g.fillRect(x, baseY + h, w, 1);
      g.fillStyle = _CYP.pathSeam;
      g.fillRect(x + 4, baseY + h + 2, 2, 1);
      g.fillRect(x + 14, baseY + h + 2, 2, 1);

      // STREET-LEVEL LIFE - one decoration in front of every OTHER
      // shop so individual pieces read as focal points instead of
      // visual clutter. Picks from cafe table, bench, transit sign,
      // vending machine, hanging lantern. Quiet shops just get an
      // extra planter beside the door so the row still feels lived in.
      var streetX = x + Math.floor(w / 2) - 4;
      var streetY = baseY + h - 1;
      if ((k % 2) === 0) {
        // Quiet block - just an extra planter beside the door.
        var pX = (doorLeft ? x + w - 7 : x + 2);
        g.fillStyle = _CYP.bark;
        g.fillRect(pX, streetY - 3, 4, 4);
        g.fillStyle = _CYP.barkH;
        g.fillRect(pX, streetY - 3, 4, 1);
        g.fillStyle = _CYP.leafDk;
        g.fillRect(pX,     streetY - 6, 4, 3);
        g.fillStyle = _CYP.leafMid;
        g.fillRect(pX + 1, streetY - 6, 2, 1);
        if ((k & 3) === 0) {
          g.fillStyle = _CYP.blossom;
          g.fillRect(pX + 1, streetY - 7, 1, 1);
        }
      } else if (shopType === 0) {
        // CAFE: bigger bistro table + chair pair with steam from cup.
        // Table top (round, 9 px wide for visibility).
        g.fillStyle = _CYP.barkH;
        g.fillRect(streetX - 2, streetY - 4, 9, 1);
        g.fillRect(streetX - 3, streetY - 3, 11, 1);
        g.fillStyle = _CYP.bark;
        g.fillRect(streetX - 2, streetY - 2, 9, 1);
        // Pedestal + base.
        g.fillRect(streetX + 1, streetY - 1, 2, 4);
        g.fillStyle = _CYP.barkH;
        g.fillRect(streetX - 2, streetY + 3, 9, 1);
        // Chair (round-backed silhouette beside table).
        g.fillStyle = _CYP.bark;
        g.fillRect(streetX + 8,  streetY - 6, 3, 5);        // back
        g.fillStyle = _CYP.barkH;
        g.fillRect(streetX + 8,  streetY - 6, 3, 1);
        g.fillStyle = _CYP.bark;
        g.fillRect(streetX + 7,  streetY - 1, 5, 1);        // seat
        g.fillRect(streetX + 7,  streetY,     1, 4);
        g.fillRect(streetX + 11, streetY,     1, 4);
        // Steaming coffee cup on the table.
        g.fillStyle = '#fff5d8';
        g.fillRect(streetX + 1, streetY - 6, 3, 2);
        g.fillStyle = _CYP.outlineD;
        g.fillRect(streetX + 4, streetY - 5, 1, 1);          // handle
        // Steam wisps.
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.fillRect(streetX + 1, streetY - 8, 1, 1);
        g.fillRect(streetX + 3, streetY - 9, 1, 1);
      } else if (shopType === 1) {
        // PARK: wooden bench with backrest + cushion.
        g.fillStyle = _CYP.bark;
        g.fillRect(streetX - 4, streetY - 7, 16, 2);        // backrest top
        g.fillStyle = _CYP.barkH;
        g.fillRect(streetX - 4, streetY - 7, 16, 1);
        // Vertical back slats.
        g.fillStyle = _CYP.bark;
        for (var bsl = 0; bsl < 5; bsl++) {
          g.fillRect(streetX - 3 + bsl * 4, streetY - 5, 1, 4);
        }
        g.fillStyle = _CYP.bark;
        g.fillRect(streetX - 4, streetY - 1, 16, 3);        // seat slab
        g.fillStyle = _CYP.barkH;
        g.fillRect(streetX - 4, streetY - 1, 16, 1);
        // Cushion on the seat.
        g.fillStyle = _CYP.awningC;
        g.fillRect(streetX - 3, streetY - 2, 14, 1);
        // Legs.
        g.fillStyle = _CYP.outlineD;
        g.fillRect(streetX - 3, streetY + 2, 2, 3);
        g.fillRect(streetX + 9, streetY + 2, 2, 3);
      } else if (shopType === 2) {
        // MARKET: vending machine kiosk with bright warm display.
        g.fillStyle = _CYP.tealD;
        g.fillRect(streetX - 1, streetY - 12, 9, 14);       // body
        g.fillStyle = _CYP.tealH;
        g.fillRect(streetX - 1, streetY - 12, 9, 2);
        g.fillStyle = _CYP.outlineD;
        g.fillRect(streetX,     streetY - 11, 7, 8);
        g.fillStyle = _CYP.warmWinH;
        g.fillRect(streetX,     streetY - 11, 7, 8);        // bright window
        g.fillStyle = _CYP.warmWin;
        g.fillRect(streetX,     streetY - 4,  7, 1);        // shelf line
        // Bright items inside (red, yellow, cyan).
        g.fillStyle = _CYP.awningR;
        g.fillRect(streetX + 1, streetY - 10, 1, 2);
        g.fillStyle = _CYP.accent;
        g.fillRect(streetX + 3, streetY - 10, 1, 2);
        g.fillStyle = _CYP.awningC;
        g.fillRect(streetX + 5, streetY - 10, 1, 2);
        g.fillStyle = _CYP.awningR;
        g.fillRect(streetX + 2, streetY - 7,  1, 2);
        g.fillStyle = _CYP.accent;
        g.fillRect(streetX + 4, streetY - 7,  1, 2);
        // Slot + button.
        g.fillStyle = _CYP.outlineD;
        g.fillRect(streetX + 1, streetY - 1,  5, 1);
        g.fillStyle = _CYP.accent;
        g.fillRect(streetX + 6, streetY - 2,  1, 1);
      } else if (shopType === 3) {
        // BAKERY: transit sign post with route badge.
        g.fillStyle = _CYP.outlineD;
        g.fillRect(streetX + 3, streetY - 10, 2, 12);        // post
        g.fillStyle = _CYP.awningO;
        g.fillRect(streetX - 1, streetY - 10, 10, 5);        // sign panel
        g.fillStyle = _CYP.awningOH;
        g.fillRect(streetX - 1, streetY - 10, 10, 1);
        // T-shape route letter.
        g.fillStyle = '#fff5d8';
        g.fillRect(streetX + 1, streetY - 8, 6, 1);
        g.fillRect(streetX + 3, streetY - 7, 2, 2);
        // Stop spot at the base of the post.
        g.fillStyle = _CYP.accent;
        g.fillRect(streetX + 2, streetY + 1, 4, 1);
      } else {
        // FLORIST: hanging plant lantern from a tall pole.
        g.fillStyle = _CYP.outlineD;
        g.fillRect(streetX + 3, streetY - 12, 2, 8);         // pole
        g.fillRect(streetX,     streetY - 12, 8, 1);         // arm
        g.fillStyle = _CYP.bark;
        g.fillRect(streetX - 1, streetY - 7,  10, 4);        // planter
        g.fillStyle = _CYP.barkH;
        g.fillRect(streetX - 1, streetY - 7,  10, 1);
        // Plants cascading down.
        g.fillStyle = _CYP.leafDk;
        g.fillRect(streetX,     streetY - 11, 8, 4);
        g.fillStyle = _CYP.leafMid;
        g.fillRect(streetX + 1, streetY - 11, 6, 2);
        g.fillStyle = _CYP.leafLt;
        g.fillRect(streetX + 2, streetY - 11, 4, 1);
        // Flowers.
        g.fillStyle = _CYP.blossom;
        g.fillRect(streetX + 1, streetY - 12, 1, 1);
        g.fillRect(streetX + 6, streetY - 10, 1, 1);
        g.fillRect(streetX + 3, streetY - 11, 1, 1);
        g.fillStyle = _CYP.blossomDk;
        g.fillRect(streetX + 4, streetY - 9,  1, 1);
        // Standing on the sidewalk - base detail.
        g.fillStyle = _CYP.outlineD;
        g.fillRect(streetX + 2, streetY + 1, 4, 1);
      }
      // Move to next shop.
      x += w - 2 - Math.floor(rng() * 4);
    }
    // Vines hanging from the bottom edge of mid-distance buildings
    // into the shopfront row.
    for (var vk = 30; vk < W; vk += 50) {
      var vy = 105 + (vk % 13);
      g.fillStyle = _CYP.leafDk;
      g.fillRect(vk,     vy,     1, 6);
      g.fillRect(vk + 1, vy + 2, 1, 4);
      g.fillRect(vk - 1, vy + 4, 1, 3);
      g.fillStyle = _CYP.leafMid;
      g.fillRect(vk + 1, vy + 1, 1, 1);
      g.fillRect(vk - 1, vy + 3, 1, 1);
    }

    // ===== SUB-LEVEL STRUCTURAL PASS (v0.57) =====
    // Fills the bottom 88 px of the bridge canvas (y=152-240) with
    // foundation arches + support pillars so when the camera scrolls
    // up the layer keeps covering the bottom of the screen instead
    // of revealing blank space. Reads as a viaduct's understructure
    // below the shopfront row.
    _cyPaintBridgeSubLevel(g, W);
  }

  // Sub-level paint pass for the bridge layer. Foundation slab +
  // repeating arched cellar openings (lit) + support pillars.
  function _cyPaintBridgeSubLevel(g, W) {
    var rng = _cyRng(0xB17E);
    // Foundation slab y=152-162 - dark cream band on top, deep
    // shade below for a strong horizontal line.
    g.fillStyle = '#8C7448';
    g.fillRect(0, 152, W, 2);
    g.fillStyle = '#C0A878';
    g.fillRect(0, 154, W, 4);
    g.fillStyle = '#A88858';
    g.fillRect(0, 158, W, 2);
    g.fillStyle = '#5A4830';
    g.fillRect(0, 160, W, 2);

    // Arched cellar opening row y=162-186 - rounded arches every
    // 32px with warm lit interior (small windows under the shops).
    var archSpacing = 32;
    for (var ax = 0; ax < W; ax += archSpacing) {
      // Pillar between arches (cream stone).
      g.fillStyle = '#E0CDA8';
      g.fillRect(ax,     162, 6, 24);
      g.fillStyle = '#F0DFC0';
      g.fillRect(ax,     162, 6, 1);
      g.fillStyle = '#A88858';
      g.fillRect(ax + 5, 162, 1, 24);
      g.fillStyle = '#8C7448';
      g.fillRect(ax,     185, 6, 1);
      // Arched opening (top semicircle of dark interior).
      var aw = archSpacing - 6;
      g.fillStyle = '#0E1422';
      g.fillRect(ax + 6,     166, aw, 20);
      // Arch curve at the top (3-px tall step pattern).
      g.fillStyle = '#E0CDA8';
      g.fillRect(ax + 6,     162, aw, 1);
      g.fillStyle = '#F0DFC0';
      g.fillRect(ax + 6,     162, aw, 1);
      g.fillStyle = '#0E1422';
      g.fillRect(ax + 6,     163, 1, 3);
      g.fillRect(ax + 6 + aw - 1, 163, 1, 3);
      g.fillRect(ax + 7,     164, 1, 2);
      g.fillRect(ax + 6 + aw - 2, 164, 1, 2);
      g.fillRect(ax + 8,     165, aw - 4, 1);
      // Warm lit interior at the back of the arch.
      g.fillStyle = '#5A3818';
      g.fillRect(ax + 8,     170, aw - 4, 14);
      g.fillStyle = '#FFB860';
      g.fillRect(ax + 10,    172, aw - 8, 4);
      g.fillStyle = '#FFE4A0';
      g.fillRect(ax + 11,    173, aw - 10, 2);
      // Glow halo from the lit interior.
      g.fillStyle = 'rgba(255,180,96,0.25)';
      g.fillRect(ax + 6,     168, aw, 12);
      // Faint shadow figure (silhouette of a barrel / crate).
      g.fillStyle = '#1A1E2A';
      g.fillRect(ax + 8 + ((ax * 7) % 6),  180, 4, 5);
      // Vine drape over the arch.
      if ((ax + (rng() * 100)) % 64 < 32) {
        g.fillStyle = _CYP.leafDk;
        g.fillRect(ax + 6, 162, 1, 4);
        g.fillRect(ax + 6 + aw - 1, 162, 1, 6);
        g.fillStyle = _CYP.leafMid;
        g.fillRect(ax + 6 + aw - 1, 163, 1, 2);
      }
    }

    // Support pillar band y=186-220 - dark brick texture with regular
    // mortar lines + 6-px-wide pillars every 32 px (lined up with the
    // arch pillars above).
    g.fillStyle = '#4A3826';
    g.fillRect(0, 186, W, 34);
    // Brick mortar lines.
    g.fillStyle = '#5A4830';
    for (var by = 188; by < 220; by += 4) {
      g.fillRect(0, by, W, 1);
    }
    // Vertical mortar offsets so the bricks stagger.
    g.fillStyle = '#22120C';
    for (var bx2 = 0; bx2 < W; bx2 += 8) {
      for (var bby = 188; bby < 220; bby += 4) {
        var off2 = ((bby / 4) | 0) % 2 ? 0 : 4;
        g.fillRect(bx2 + off2, bby, 1, 4);
      }
    }
    // Tall structural pillars at the arch positions.
    for (var pl = 0; pl < W; pl += 32) {
      g.fillStyle = '#5A4830';
      g.fillRect(pl,     186, 6, 34);
      g.fillStyle = '#7A6440';
      g.fillRect(pl,     186, 1, 34);
      g.fillStyle = '#3A2818';
      g.fillRect(pl + 5, 186, 1, 34);
      // Pillar cap.
      g.fillStyle = '#8C7448';
      g.fillRect(pl - 1, 186, 8, 2);
    }

    // Continuous base shadow band y=220-240 - deep darkness so when
    // the camera scrolls up to the max position, the visible bottom
    // of the layer reads as solid ground / off-screen depth.
    g.fillStyle = '#1A1208';
    g.fillRect(0, 220, W, 20);
    g.fillStyle = '#3A2818';
    g.fillRect(0, 220, W, 2);
  }

  // Specialty bridge-layer building. Picks one of 6 variants and
  // paints it at world-x = x. Returns width consumed so the bridge
  // walker can advance x. All variants paint at the y=100-152 shop
  // row baseline but with distinct silhouettes for skyline variety.
  function _cyPaintBridgeSpecialty(g, x, rng, k) {
    var variant = Math.floor(rng() * 6);
    var bot = 152;
    if (variant === 0) {
      // CLOCK TOWER - slim 22-wide tower with round clock face + bell.
      var w = 22, h = 56, baseY = bot - h;
      g.fillStyle = '#7A5D44';
      g.fillRect(x, baseY, w, h);
      g.fillStyle = '#4A3826';
      g.fillRect(x, baseY, 1, h);
      g.fillRect(x, bot - 2, w, 2);
      g.fillStyle = '#A0825E';
      g.fillRect(x + w - 1, baseY, 1, h);
      g.fillStyle = '#A0825E';
      g.fillRect(x, baseY, w, 1);
      _cyRoundCorners(g, x, baseY, w, h, '#4A3826');
      // Clock face (cream circle).
      var cx = x + w / 2, cy = baseY + 12;
      g.fillStyle = '#0E1422';
      g.beginPath(); g.arc(cx, cy, 7, 0, 6.28); g.fill();
      g.fillStyle = '#F0DEB0';
      g.beginPath(); g.arc(cx, cy, 6, 0, 6.28); g.fill();
      // Hour ticks (4).
      g.fillStyle = '#22232C';
      g.fillRect(cx,         cy - 5, 1, 2);
      g.fillRect(cx,         cy + 4, 1, 2);
      g.fillRect(cx - 5,     cy,     2, 1);
      g.fillRect(cx + 4,     cy,     2, 1);
      // Hands (one short pointing up, one longer pointing right).
      g.fillRect(cx,         cy - 4, 1, 4);
      g.fillRect(cx,         cy,     5, 1);
      g.fillStyle = '#FF4FA8';
      g.fillRect(cx,         cy,     1, 1);
      // Belfry on top (open arches with bell inside).
      g.fillStyle = '#4A3826';
      g.fillRect(x + 1,      baseY - 8, w - 2, 8);
      g.fillStyle = '#7A5D44';
      g.fillRect(x + 2,      baseY - 7, w - 4, 6);
      g.fillStyle = '#0E1422';
      g.fillRect(x + 4,      baseY - 5, w - 8, 4);
      // Bell silhouette inside.
      g.fillStyle = '#E8A848';
      g.fillRect(x + w / 2 - 2, baseY - 4, 4, 3);
      g.fillRect(x + w / 2 - 1, baseY - 5, 2, 1);
      // Peaked roof on top of belfry.
      g.fillStyle = '#883030';
      for (var pr = 0; pr < 6; pr++) {
        var pw = Math.max(1, w - pr * 4);
        g.fillRect(x + Math.floor((w - pw) / 2), baseY - 8 - pr, pw, 1);
      }
      g.fillStyle = '#22232C';
      g.fillRect(x + w / 2,  baseY - 18, 1, 4);
      g.fillStyle = '#FF6464';
      g.fillRect(x + w / 2,  baseY - 18, 1, 1);
      // Lit windows below the clock.
      g.fillStyle = '#0E1422';
      g.fillRect(x + 5,      baseY + 30, 4, 6);
      g.fillRect(x + 13,     baseY + 30, 4, 6);
      g.fillStyle = '#FFB860';
      g.fillRect(x + 6,      baseY + 31, 2, 4);
      g.fillRect(x + 14,     baseY + 31, 2, 4);
      g.fillStyle = '#FFE4A0';
      g.fillRect(x + 6,      baseY + 31, 2, 1);
      g.fillRect(x + 14,     baseY + 31, 2, 1);
      // Sidewalk.
      g.fillStyle = _CYP.pathShade;
      g.fillRect(x, bot, w, 4);
      g.fillStyle = _CYP.pathWarm;
      g.fillRect(x, bot, w, 1);
      return w + 2;
    } else if (variant === 1) {
      // BATH HOUSE - wider 56-px structure, stepped tile roof, chimney
      // with rising steam, warm orange window glow.
      var w = 56, h = 44, baseY = bot - h;
      g.fillStyle = '#D6BD8E';
      g.fillRect(x, baseY + 8, w, h - 8);
      g.fillStyle = '#8A6D40';
      g.fillRect(x, baseY + 8, 1, h - 8);
      g.fillRect(x + w - 1, baseY + 8, 1, h - 8);
      g.fillStyle = '#F0DEB0';
      g.fillRect(x, baseY + 8, w, 1);
      g.fillStyle = '#8A6D40';
      g.fillRect(x, bot - 2, w, 2);
      // Stepped tile roof - 3 tiers.
      g.fillStyle = '#5A3018';
      g.fillRect(x - 2, baseY + 8, w + 4, 2);
      g.fillStyle = '#883030';
      g.fillRect(x,     baseY + 4, w,     4);
      g.fillStyle = '#A85040';
      g.fillRect(x,     baseY + 4, w,     1);
      // Tile pattern on the roof.
      g.fillStyle = '#5A3018';
      for (var tl = x + 4; tl < x + w; tl += 4) {
        g.fillRect(tl, baseY + 4, 1, 4);
      }
      // Upper crown.
      g.fillStyle = '#883030';
      g.fillRect(x + 8, baseY,     w - 16, 4);
      g.fillStyle = '#A85040';
      g.fillRect(x + 8, baseY,     w - 16, 1);
      // Chimney with steam.
      g.fillStyle = '#5A3018';
      g.fillRect(x + w - 14, baseY - 8, 6, 8);
      g.fillStyle = '#3A1A08';
      g.fillRect(x + w - 14, baseY - 8, 1, 8);
      g.fillRect(x + w - 14, baseY - 8, 6, 1);
      // Steam puffs above.
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(x + w - 12, baseY - 14, 4, 3);
      g.fillStyle = 'rgba(255,255,255,0.40)';
      g.fillRect(x + w - 14, baseY - 18, 6, 4);
      g.fillStyle = 'rgba(255,255,255,0.28)';
      g.fillRect(x + w - 18, baseY - 22, 8, 4);
      // Big warm glowing window pair (the bath room).
      var bw = 18, bh = 14;
      g.fillStyle = '#0E1422';
      g.fillRect(x + 6,      baseY + 16, bw, bh);
      g.fillRect(x + 32,     baseY + 16, bw, bh);
      g.fillStyle = '#FFB860';
      g.fillRect(x + 7,      baseY + 17, bw - 2, bh - 2);
      g.fillRect(x + 33,     baseY + 17, bw - 2, bh - 2);
      g.fillStyle = '#FFE4A0';
      g.fillRect(x + 7,      baseY + 17, bw - 2, 2);
      g.fillRect(x + 33,     baseY + 17, bw - 2, 2);
      g.fillStyle = 'rgba(255,180,96,0.30)';
      g.fillRect(x + 4,      baseY + 14, bw + 4, bh + 4);
      g.fillRect(x + 30,     baseY + 14, bw + 4, bh + 4);
      // Steam vent slits between windows.
      g.fillStyle = 'rgba(255,255,255,0.32)';
      g.fillRect(x + 26,     baseY + 12, 4, 1);
      g.fillRect(x + 26,     baseY + 14, 4, 1);
      // Sign panel (cream, kanji-style faux text).
      g.fillStyle = '#0E1422';
      g.fillRect(x + 6,      baseY + 10, w - 12, 4);
      g.fillStyle = '#F0E0C0';
      for (var tb = x + 8; tb < x + w - 8; tb += 3) {
        g.fillRect(tb, baseY + 11, 2, 2);
      }
      // Sidewalk.
      g.fillStyle = _CYP.pathShade;
      g.fillRect(x, bot, w, 4);
      g.fillStyle = _CYP.pathWarm;
      g.fillRect(x, bot, w, 1);
      return w + 2;
    } else if (variant === 2) {
      // TRANSIT KIOSK - small 24px booth with scrolling cyan display
      // and a bench in front.
      var w = 24, h = 36, baseY = bot - h;
      g.fillStyle = '#3F5670';
      g.fillRect(x, baseY, w, h);
      g.fillStyle = '#243648';
      g.fillRect(x, baseY, 1, h);
      g.fillRect(x, bot - 2, w, 2);
      g.fillStyle = '#5F7894';
      g.fillRect(x + w - 1, baseY, 1, h);
      g.fillStyle = '#5F7894';
      g.fillRect(x, baseY, w, 1);
      // Slanted roof.
      g.fillStyle = '#243648';
      g.fillRect(x - 2, baseY - 3, w + 4, 3);
      g.fillStyle = '#5F7894';
      g.fillRect(x - 2, baseY - 3, w + 4, 1);
      // Big cyan information display.
      g.fillStyle = '#0E1422';
      g.fillRect(x + 2, baseY + 4, w - 4, 14);
      g.fillStyle = '#5AE8FF';
      g.fillRect(x + 3, baseY + 5, w - 6, 12);
      g.fillStyle = '#0E1422';
      // Scrolling text bars.
      for (var sd = 0; sd < 4; sd++) {
        g.fillRect(x + 4, baseY + 7 + sd * 3, w - 8, 1);
      }
      g.fillStyle = 'rgba(90,232,255,0.30)';
      g.fillRect(x + 0, baseY + 2, w, 18);
      // Map / route diagram dots below.
      g.fillStyle = '#FF4FA8';
      g.fillRect(x + 4,  baseY + 22, 2, 2);
      g.fillRect(x + 10, baseY + 22, 2, 2);
      g.fillRect(x + 16, baseY + 22, 2, 2);
      g.fillStyle = '#0E1422';
      g.fillRect(x + 6, baseY + 23, 4, 1);
      g.fillRect(x + 12, baseY + 23, 4, 1);
      // Coin / payment slot.
      g.fillStyle = '#0E1422';
      g.fillRect(x + 8, baseY + 28, 8, 4);
      g.fillStyle = '#FFD23A';
      g.fillRect(x + 10, baseY + 30, 4, 1);
      // Bench in front.
      var bx = x + w + 2;
      g.fillStyle = '#8C5A3A';
      g.fillRect(bx, bot - 6, 12, 2);
      g.fillStyle = '#3D3F4A';
      g.fillRect(bx + 1, bot - 4, 2, 4);
      g.fillRect(bx + 9, bot - 4, 2, 4);
      g.fillStyle = '#8C5A3A';
      g.fillRect(bx, bot - 12, 12, 1);
      // Sidewalk under both.
      g.fillStyle = _CYP.pathShade;
      g.fillRect(x, bot, w + 16, 4);
      g.fillStyle = _CYP.pathWarm;
      g.fillRect(x, bot, w + 16, 1);
      return w + 16;
    } else if (variant === 3) {
      // LIBRARY - wider 44px, gabled roof, arched main window, book
      // pile silhouettes inside the window.
      var w = 44, h = 46, baseY = bot - h;
      g.fillStyle = '#806CA0';
      g.fillRect(x, baseY + 6, w, h - 6);
      g.fillStyle = '#4A3868';
      g.fillRect(x, baseY + 6, 1, h - 6);
      g.fillRect(x, bot - 2, w, 2);
      g.fillStyle = '#A892C0';
      g.fillRect(x + w - 1, baseY + 6, 1, h - 6);
      g.fillStyle = '#A892C0';
      g.fillRect(x, baseY + 6, w, 1);
      // Gabled roof - triangular peak.
      g.fillStyle = '#4A3868';
      for (var gr = 0; gr < 6; gr++) {
        var grw = w - gr * 4;
        g.fillRect(x + Math.floor((w - grw) / 2), baseY + 6 - gr * 1 - 1, grw, 1);
      }
      g.fillStyle = '#806CA0';
      for (var gr2 = 0; gr2 < 5; gr2++) {
        var gw2 = w - 2 - gr2 * 4;
        g.fillRect(x + Math.floor((w - gw2) / 2), baseY + 5 - gr2 * 1, gw2, 1);
      }
      // Arched main window in the front.
      var aw2 = 18, ah2 = 18;
      var awx = x + Math.floor((w - aw2) / 2);
      var awy = baseY + 14;
      g.fillStyle = '#0E1422';
      g.fillRect(awx, awy, aw2, ah2);
      // Arch curve.
      g.fillStyle = '#806CA0';
      g.fillRect(awx, awy, 1, 3);
      g.fillRect(awx + aw2 - 1, awy, 1, 3);
      g.fillRect(awx + 1, awy, 1, 2);
      g.fillRect(awx + aw2 - 2, awy, 1, 2);
      // Warm interior.
      g.fillStyle = '#FFB860';
      g.fillRect(awx + 1, awy + 3, aw2 - 2, ah2 - 4);
      g.fillStyle = '#FFE4A0';
      g.fillRect(awx + 1, awy + 3, aw2 - 2, 2);
      // Book pile silhouettes inside.
      g.fillStyle = '#4A3868';
      g.fillRect(awx + 3, awy + 10, 4, 5);
      g.fillRect(awx + 8, awy + 8,  3, 7);
      g.fillRect(awx + 12, awy + 11, 4, 4);
      g.fillStyle = '#883858';
      g.fillRect(awx + 3, awy + 10, 4, 1);
      g.fillRect(awx + 12, awy + 11, 4, 1);
      // Window mullions.
      g.fillStyle = '#0E1422';
      g.fillRect(awx + Math.floor(aw2 / 2), awy + 2, 1, ah2 - 2);
      g.fillRect(awx + 1, awy + Math.floor(ah2 / 2), aw2 - 2, 1);
      // Glow halo.
      g.fillStyle = 'rgba(255,180,96,0.30)';
      g.fillRect(awx - 2, awy - 2, aw2 + 4, ah2 + 4);
      // Sign band above.
      g.fillStyle = '#0E1422';
      g.fillRect(x + 4, baseY + 8, w - 8, 4);
      g.fillStyle = '#FFD23A';
      for (var lt = x + 6; lt < x + w - 6; lt += 3) {
        g.fillRect(lt, baseY + 9, 2, 2);
      }
      // Sidewalk.
      g.fillStyle = _CYP.pathShade;
      g.fillRect(x, bot, w, 4);
      g.fillStyle = _CYP.pathWarm;
      g.fillRect(x, bot, w, 1);
      return w + 2;
    } else if (variant === 4) {
      // GREENHOUSE STALL - 38-px wide glass dome on a cream base,
      // plants visible inside, planter shelves on the sides.
      var w = 38, h = 42, baseY = bot - h;
      // Base / planter (cream brick).
      g.fillStyle = '#D6BD8E';
      g.fillRect(x, baseY + 16, w, h - 16);
      g.fillStyle = '#8A6D40';
      g.fillRect(x, baseY + 16, 1, h - 16);
      g.fillRect(x, bot - 2, w, 2);
      g.fillStyle = '#F0DEB0';
      g.fillRect(x + w - 1, baseY + 16, 1, h - 16);
      g.fillStyle = '#F0DEB0';
      g.fillRect(x, baseY + 16, w, 1);
      // Glass dome.
      var cx = x + w / 2;
      var dr = Math.floor(w / 2);
      g.fillStyle = '#243648';
      g.beginPath(); g.arc(cx, baseY + 16, dr, Math.PI, 0); g.fill();
      g.fillStyle = '#5A8590';
      g.beginPath(); g.arc(cx, baseY + 16, dr - 1, Math.PI, 0); g.fill();
      g.fillStyle = '#88B0B8';
      g.beginPath(); g.arc(cx, baseY + 16, dr - 3, Math.PI, 0); g.fill();
      // Glass panes (radial lines).
      g.fillStyle = '#243648';
      for (var rl = 0; rl < 7; rl++) {
        var ang = Math.PI + rl * Math.PI / 6;
        var px2 = Math.round(cx + Math.cos(ang) * (dr - 1));
        var py2 = Math.round(baseY + 16 + Math.sin(ang) * (dr - 1));
        g.fillRect(px2, py2, 1, 1);
      }
      // Plants visible through the dome.
      g.fillStyle = _CYP.leafDk;
      g.fillRect(x + 6,      baseY + 8, 5, 8);
      g.fillRect(x + w - 11, baseY + 8, 5, 8);
      g.fillRect(x + 14,     baseY + 4, 10, 12);
      g.fillStyle = _CYP.leafMid;
      g.fillRect(x + 7,      baseY + 8, 3, 4);
      g.fillRect(x + 15,     baseY + 5, 4, 6);
      g.fillStyle = _CYP.blossom;
      g.fillRect(x + 8,      baseY + 7, 1, 1);
      g.fillRect(x + 16,     baseY + 3, 1, 1);
      g.fillRect(x + 22,     baseY + 4, 1, 1);
      // Door + warm window glow.
      g.fillStyle = '#0E1422';
      g.fillRect(x + Math.floor(w / 2) - 3, baseY + 24, 6, 18);
      g.fillStyle = '#FFB860';
      g.fillRect(x + Math.floor(w / 2) - 2, baseY + 26, 4, 14);
      g.fillStyle = '#FFE4A0';
      g.fillRect(x + Math.floor(w / 2) - 2, baseY + 26, 4, 1);
      // Side planter shelves.
      g.fillStyle = '#8A6D40';
      g.fillRect(x + 2,      baseY + 30, 8, 2);
      g.fillRect(x + w - 10, baseY + 30, 8, 2);
      g.fillStyle = _CYP.leafDk;
      g.fillRect(x + 3,      baseY + 26, 6, 4);
      g.fillRect(x + w - 9,  baseY + 26, 6, 4);
      g.fillStyle = _CYP.leafMid;
      g.fillRect(x + 4,      baseY + 27, 4, 2);
      g.fillRect(x + w - 8,  baseY + 27, 4, 2);
      g.fillStyle = _CYP.blossom;
      g.fillRect(x + 5,      baseY + 26, 1, 1);
      g.fillRect(x + w - 7,  baseY + 26, 1, 1);
      // Sidewalk.
      g.fillStyle = _CYP.pathShade;
      g.fillRect(x, bot, w, 4);
      g.fillStyle = _CYP.pathWarm;
      g.fillRect(x, bot, w, 1);
      return w + 2;
    } else {
      // FOOD CART - small mobile cart with red+white umbrella, wheels,
      // steaming pot. Sits on the sidewalk, no big building behind it.
      var w = 20, baseY = bot - 22;
      // Cart body.
      g.fillStyle = '#883030';
      g.fillRect(x,     baseY + 8, w, 10);
      g.fillStyle = '#A85040';
      g.fillRect(x,     baseY + 8, w, 1);
      g.fillStyle = '#5A1818';
      g.fillRect(x,     baseY + 17, w, 1);
      // Front warm-lit serving window.
      g.fillStyle = '#0E1422';
      g.fillRect(x + 2, baseY + 11, w - 4, 5);
      g.fillStyle = '#FFB860';
      g.fillRect(x + 3, baseY + 12, w - 6, 3);
      g.fillStyle = '#FFE4A0';
      g.fillRect(x + 3, baseY + 12, w - 6, 1);
      // Wheels.
      g.fillStyle = '#22232C';
      g.beginPath(); g.arc(x + 4,     baseY + 20, 3, 0, 6.28); g.fill();
      g.beginPath(); g.arc(x + w - 4, baseY + 20, 3, 0, 6.28); g.fill();
      g.fillStyle = '#5E6173';
      g.fillRect(x + 4 - 1, baseY + 20, 2, 1);
      g.fillRect(x + w - 5, baseY + 20, 2, 1);
      // Pole supporting umbrella.
      g.fillStyle = '#22232C';
      g.fillRect(x + w / 2, baseY - 2, 1, 10);
      // Striped umbrella (red/cream alternating).
      var uw = w + 8;
      for (var uo = 0; uo < uw; uo++) {
        g.fillStyle = (uo & 2) ? '#D04848' : '#F0E0C0';
        g.fillRect(x - 4 + uo, baseY,     1, 2);
      }
      // Umbrella scallops.
      g.fillStyle = '#883030';
      for (var us = x - 4; us < x + w + 4; us += 4) {
        g.fillRect(us + 1, baseY + 2, 2, 1);
      }
      // Steam from the pot.
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(x + 8, baseY - 5, 4, 2);
      g.fillStyle = 'rgba(255,255,255,0.32)';
      g.fillRect(x + 6, baseY - 9, 8, 3);
      // Sign hanging from the umbrella pole.
      g.fillStyle = '#0E1422';
      g.fillRect(x + w / 2 + 2, baseY + 2, 8, 4);
      g.fillStyle = '#FFD23A';
      g.fillRect(x + w / 2 + 3, baseY + 3, 2, 2);
      g.fillRect(x + w / 2 + 6, baseY + 3, 2, 2);
      // Sidewalk.
      g.fillStyle = _CYP.pathShade;
      g.fillRect(x, bot, w, 4);
      g.fillStyle = _CYP.pathWarm;
      g.fillRect(x, bot, w, 1);
      return w + 4;
    }
  }

  // =================================================================
  // FOREGROUND PAINTER - light anchors + hanging vines + flowering tree
  // =================================================================
  // v0.67 (Mark): "remove all decorations on layer 1 except for
  // buildings... light poles, benches, signs and everything else."
  // Flag short-circuits the decorative passes here + in
  // drawForeground_cyber so the foreground reads as buildings-only.
  // Flip to false to bring vines/branches/girder/café/street
  // furniture/petals/helicopter back.
  var _CY_DECOR = false;

  function _cyPaintForeground(g) {
    var rng = _cyRng(0xF6E8);
    var W = 960;
    g.clearRect(0, 0, W, 180);

    if (_CY_DECOR) {

    // ===== HEADER GIRDER (v0.62 audit fix) =====
    // Continuous steel cross-beam at the top of the foreground frame
    // so vines + hanging signs attach to something visible instead of
    // floating from off-canvas. When the camera scrolls up during a
    // jump (Layer 1 is world-space, -camy parallax), this girder is
    // what the eye reads as the structural anchor for everything
    // hanging below it.
    g.fillStyle = '#22232C';
    g.fillRect(0, 0, W, 5);
    g.fillStyle = '#3D3F4A';
    g.fillRect(0, 0, W, 1);
    g.fillStyle = '#5E6173';
    g.fillRect(0, 4, W, 1);
    // Rivets every 16 px so it reads as bolted steel.
    g.fillStyle = '#5E6173';
    for (var rv = 6; rv < W; rv += 16) {
      g.fillRect(rv,     1, 2, 1);
      g.fillRect(rv + 7, 3, 1, 1);
    }
    // Vertical hanger studs every 80 px going up off-canvas - reads
    // as "girder suspended from buildings above the frame."
    g.fillStyle = '#22232C';
    for (var pyS = 32; pyS < W; pyS += 80) {
      g.fillRect(pyS,     0, 2, 5);
      g.fillStyle = '#3D3F4A';
      g.fillRect(pyS - 2, 0, 6, 1);
      g.fillStyle = '#22232C';
    }
    // Hangers / hooks sticking DOWN from the girder where vines + signs
    // will attach. Spacing matches the hanging-vine RNG so most vines
    // land on a hook.
    g.fillStyle = '#3D3F4A';
    for (var hk = 8; hk < W; hk += 24) {
      g.fillRect(hk, 5, 1, 1);
    }

    // Trolley wire / power cable strung along the underside of the
    // girder - thin highlight so the eye reads it as taut.
    g.fillStyle = 'rgba(206,224,236,0.30)';
    g.fillRect(0, 6, W, 1);

    // Hanging vines from the girder (now anchored to a visible
    // structural element, not floating from nothing).
    // v0.66: 9 -> 4 (Mark wanted Layer 1 further reduced).
    for (var vi = 0; vi < 4; vi++) {
      var vx = Math.floor(rng() * W);
      var vlen = 14 + Math.floor(rng() * 22);
      var blossom = rng() > 0.6;
      // Tiny attachment fixture so the vine clearly grips the girder.
      g.fillStyle = '#3D3F4A';
      g.fillRect(vx - 1, 5, 3, 1);
      g.fillStyle = _CYP.leafDk;
      for (var vy = 5; vy < 5 + vlen; vy++) {
        var jitter = (Math.sin(vy * 0.6 + vi) | 0);
        g.fillRect(vx + jitter, vy, 1, 1);
        if (vy % 3 === 1) {
          g.fillStyle = _CYP.leafMid;
          g.fillRect(vx + jitter - 1, vy, 1, 1);
          g.fillRect(vx + jitter + 1, vy, 1, 1);
          g.fillStyle = _CYP.leafDk;
        }
      }
      // Optional blossom cluster at the bottom.
      if (blossom && vlen > 18) {
        g.fillStyle = _CYP.blossom;
        g.fillRect(vx,     5 + vlen - 2, 2, 2);
        g.fillRect(vx - 1, 5 + vlen - 1, 1, 1);
        g.fillStyle = _CYP.blossomDk;
        g.fillRect(vx + 2, 5 + vlen - 1, 1, 1);
      }
    }

    // Flowering tree branches reaching in from screen corners.
    // v0.66: 3 -> 1 (further reduction per Mark).
    for (var brc = 0; brc < 1; brc++) {
      var bx = (brc & 1) ? Math.floor(rng() * 100) : W - Math.floor(rng() * 100);
      var by = 4 + Math.floor(rng() * 28);
      _cyPaintFgBranch(g, bx, by, (brc & 1) ? 1 : -1, rng);
    }

    }   // end if (_CY_DECOR) for vines + girder + branches

    // ===== BUILDINGS (always painted - the only Layer-1 elements
    // Mark wants in v0.67) =====
    // Anchor towers at extreme edges (one per slot, alternating L/R).
    var slots = 3;
    for (var s = 0; s < slots; s++) {
      var screenLeft = s * 320;
      var which = (s & 1) ? 'L' : 'R';
      _cyPaintFgAnchor(g, which === 'L' ? screenLeft - 4 : screenLeft + 320 - 28, rng);
    }

    if (_CY_DECOR) {
      // Café patio counts as decoration (parasol + tables, not a
      // building). Hidden in v0.67.
      _cyPaintFgCafePatio(g, 320 + 100, rng);
    }

    // Kiosks (small storefronts / utility cabinets) - count as
    // buildings, painted unconditionally.
    _cyPaintFgKiosk(g, 110, rng);
  }

  // Short overlapping foreground piece (50-72px tall). One of 3
  // variants: vending kiosk + bench, small storefront with awning,
  // partial-height utility cabinet with sign. Sits on the foreground
  // sidewalk (~y=144 baseline) like the anchors but doesn't reach the
  // top of the frame.
  function _cyPaintFgKiosk(g, x, rng) {
    var variant = Math.floor(rng() * 3);
    var baseY = 110 + Math.floor(rng() * 20);   // 110-130 top
    var w = 22 + Math.floor(rng() * 14);
    // v0.66: bot extended 180 -> 240 so the kiosk's base + side
    // ladder + sidewalk shadow reach the screen bottom or go off.
    var bot = 240;
    var h = bot - baseY;
    if (variant === 0) {
      // VENDING KIOSK + BENCH. Tall narrow kiosk with bright lit
      // panel + a wooden bench beside it.
      var kCol = '#3F5670', kShade = '#243648', kHi = '#5F7894';
      // Kiosk body.
      g.fillStyle = kCol;
      g.fillRect(x, baseY, 14, h);
      g.fillStyle = kShade;
      g.fillRect(x, baseY, 1, h);
      g.fillRect(x, bot - 2, 14, 2);
      g.fillStyle = kHi;
      g.fillRect(x + 13, baseY, 1, h);
      g.fillRect(x, baseY, 14, 1);
      // Pitched roof.
      g.fillStyle = kShade;
      g.fillRect(x - 1, baseY - 2, 16, 2);
      g.fillStyle = kHi;
      g.fillRect(x - 1, baseY - 2, 16, 1);
      // Bright lit product panel.
      g.fillStyle = '#0E1422';
      g.fillRect(x + 2, baseY + 4, 10, 14);
      g.fillStyle = '#FFE4A0';
      g.fillRect(x + 3, baseY + 5, 8, 12);
      // Product silhouettes inside.
      g.fillStyle = '#3F5670';
      g.fillRect(x + 3, baseY + 7,  2, 5);
      g.fillRect(x + 6, baseY + 7,  2, 5);
      g.fillRect(x + 9, baseY + 7,  2, 5);
      g.fillRect(x + 3, baseY + 13, 8, 1);
      // Glow halo around the panel.
      g.fillStyle = 'rgba(255,228,160,0.22)';
      g.fillRect(x + 0, baseY + 2, 14, 18);
      // Coin slot + payment pad.
      g.fillStyle = '#0E1422';
      g.fillRect(x + 3, baseY + 22, 8, 4);
      g.fillStyle = '#5AE8FF';
      g.fillRect(x + 5, baseY + 23, 4, 2);
      // Brand strip across the top.
      g.fillStyle = '#FF4FA8';
      g.fillRect(x + 1, baseY + 1, 12, 2);
      // Bench beside the kiosk.
      var bx = x + 16;
      g.fillStyle = '#8C5A3A';
      g.fillRect(bx, bot - 8, 12, 2);                // seat
      g.fillStyle = '#5A3818';
      g.fillRect(bx, bot - 6, 12, 1);
      g.fillStyle = '#8C5A3A';
      g.fillRect(bx + 1, bot - 5, 2, 5);             // legs
      g.fillRect(bx + 9, bot - 5, 2, 5);
      // Backrest.
      g.fillStyle = '#8C5A3A';
      g.fillRect(bx, bot - 14, 12, 1);
      g.fillStyle = '#5A3818';
      g.fillRect(bx + 1, bot - 13, 1, 5);
      g.fillRect(bx + 10, bot - 13, 1, 5);
      // Sidewalk shadow.
      g.fillStyle = 'rgba(20,30,50,0.30)';
      g.fillRect(x - 2, bot - 1, w + 18, 1);
    } else if (variant === 1) {
      // SMALL STOREFRONT with red-and-white striped awning.
      var sCol = '#7A5D44', sShade = '#4A3826', sHi = '#A0825E';
      // Body.
      g.fillStyle = sCol;
      g.fillRect(x, baseY, w, h);
      g.fillStyle = sShade;
      g.fillRect(x, baseY, 1, h);
      g.fillRect(x, bot - 2, w, 2);
      g.fillStyle = sHi;
      g.fillRect(x + w - 1, baseY, 1, h);
      g.fillStyle = sHi;
      g.fillRect(x, baseY, w, 1);
      // Awning (alternating red/cream stripes).
      var awY = baseY + 6;
      for (var sw = 0; sw < w; sw++) {
        g.fillStyle = (sw & 2) ? '#D04848' : '#F0E0C0';
        g.fillRect(x + sw, awY,     1, 3);
      }
      g.fillStyle = '#883030';
      g.fillRect(x, awY + 3, w, 1);
      // Big shop window below the awning.
      g.fillStyle = '#0E1422';
      g.fillRect(x + 2, awY + 5, w - 4, 16);
      g.fillStyle = '#FFE4A0';
      g.fillRect(x + 3, awY + 6, w - 6, 14);
      // Mullions.
      g.fillStyle = '#0E1422';
      g.fillRect(x + Math.floor(w / 2), awY + 5, 1, 16);
      g.fillRect(x + 2, awY + 12, w - 4, 1);
      // Glow halo.
      g.fillStyle = 'rgba(255,228,160,0.20)';
      g.fillRect(x + 0, awY + 4, w, 18);
      // Door + step.
      g.fillStyle = '#0E1422';
      g.fillRect(x + Math.floor(w / 2) - 3, bot - 14, 6, 12);
      g.fillStyle = '#FFE4A0';
      g.fillRect(x + Math.floor(w / 2) - 1, bot - 8, 1, 1);
      // Sign above the awning.
      g.fillStyle = '#0E1422';
      g.fillRect(x + 2, baseY + 1, w - 4, 4);
      g.fillStyle = '#5AE8FF';
      for (var tt = x + 3; tt < x + w - 3; tt += 3) {
        g.fillRect(tt, baseY + 2, 2, 2);
      }
    } else {
      // UTILITY CABINET with antenna + side sign. Tall narrow, like
      // a transit relay box.
      var uCol = '#3D3F4A', uShade = '#22232C', uHi = '#5E6173';
      g.fillStyle = uCol;
      g.fillRect(x, baseY, 12, h);
      g.fillStyle = uShade;
      g.fillRect(x, baseY, 1, h);
      g.fillStyle = uHi;
      g.fillRect(x + 11, baseY, 1, h);
      g.fillRect(x, baseY, 12, 1);
      g.fillStyle = uShade;
      g.fillRect(x, bot - 2, 12, 2);
      // Panel grille slots.
      g.fillStyle = uShade;
      g.fillRect(x + 2, baseY + 4, 8, 1);
      g.fillRect(x + 2, baseY + 7, 8, 1);
      g.fillRect(x + 2, baseY + 10, 8, 1);
      g.fillRect(x + 2, baseY + 13, 8, 1);
      // Status LEDs.
      g.fillStyle = '#FF6464';
      g.fillRect(x + 3, baseY + 16, 1, 1);
      g.fillStyle = '#5AE8FF';
      g.fillRect(x + 5, baseY + 16, 1, 1);
      g.fillStyle = '#A0F060';
      g.fillRect(x + 7, baseY + 16, 1, 1);
      // Vertical neon sign panel (lime).
      g.fillStyle = '#0A0E18';
      g.fillRect(x + 14, baseY + 6, 4, 36);
      g.fillStyle = 'rgba(160,240,96,0.30)';
      g.fillRect(x + 13, baseY + 5, 6, 38);
      g.fillStyle = '#0A0E18';
      g.fillRect(x + 15, baseY + 7, 2, 34);
      var lh = 7;
      for (var lg = 0; lg < Math.floor(34 / lh); lg++) {
        g.fillStyle = '#A0F060';
        g.fillRect(x + 15, baseY + 7 + lg * lh,     2, 1);
        g.fillRect(x + 15, baseY + 9 + lg * lh,     2, 2);
        g.fillRect(x + 15, baseY + 12 + lg * lh,    2, 1);
        g.fillStyle = '#FFFFFF';
        g.fillRect(x + 15, baseY + 7 + lg * lh,     1, 1);
      }
      // Antenna on top.
      g.fillStyle = uShade;
      g.fillRect(x + 5, baseY - 8, 1, 8);
      g.fillStyle = '#FF6464';
      g.fillRect(x + 5, baseY - 8, 1, 1);
      // Side ladder.
      g.fillStyle = uShade;
      g.fillRect(x - 2, baseY + 6, 1, h - 8);
      g.fillStyle = uShade;
      for (var ld = baseY + 8; ld < bot - 4; ld += 4) {
        g.fillRect(x - 3, ld, 3, 1);
      }
      // Sidewalk shadow.
      g.fillStyle = 'rgba(20,30,50,0.30)';
      g.fillRect(x - 4, bot - 1, 24, 1);
    }
  }

  // Foreground café-patio cluster: 1 parasol over 2 tables + chairs,
  // sitting on a curved planter / wooden deck rim. Mark's brief asked
  // for "rooftop café with orange awning" as a memorable feature.
  function _cyPaintFgCafePatio(g, x, rng) {
    var y = 144;     // sits on the foreground sidewalk plane
    // Parasol pole.
    g.fillStyle = _CYP.bark;
    g.fillRect(x + 7, y - 16, 1, 22);
    // Parasol canopy (warm-orange striped).
    g.fillStyle = _CYP.awningOD;
    g.fillRect(x,     y - 18, 16, 3);
    g.fillRect(x + 1, y - 19, 14, 1);
    g.fillRect(x + 3, y - 20, 10, 1);
    g.fillStyle = _CYP.awningO;
    g.fillRect(x,     y - 17, 16, 2);
    g.fillRect(x + 1, y - 18, 14, 1);
    g.fillRect(x + 3, y - 19, 10, 1);
    g.fillStyle = _CYP.awningOH;
    g.fillRect(x + 4, y - 20, 8, 1);
    g.fillRect(x + 5, y - 19, 6, 1);
    // Stripe bands.
    g.fillStyle = _CYP.awningOD;
    g.fillRect(x + 2, y - 18, 1, 4);
    g.fillRect(x + 6, y - 19, 1, 5);
    g.fillRect(x + 10, y - 19, 1, 5);
    g.fillRect(x + 14, y - 18, 1, 4);
    // Drop tassels at the edges.
    g.fillStyle = _CYP.awningOD;
    g.fillRect(x,         y - 14, 1, 2);
    g.fillRect(x + 15,    y - 14, 1, 2);
    // Bistro table (front).
    g.fillStyle = _CYP.bark;
    g.fillRect(x + 1, y - 4, 7, 1);
    g.fillStyle = _CYP.barkH;
    g.fillRect(x + 1, y - 5, 7, 1);
    g.fillRect(x,     y - 4, 9, 1);
    g.fillStyle = _CYP.bark;
    g.fillRect(x + 4, y - 3, 1, 5);
    g.fillRect(x + 2, y + 2, 5, 1);                         // base
    // Coffee cup + saucer on the table.
    g.fillStyle = '#FFF5D8';
    g.fillRect(x + 3, y - 7, 3, 2);
    g.fillStyle = _CYP.outlineD;
    g.fillRect(x + 6, y - 6, 1, 1);                         // handle
    // Steam.
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.fillRect(x + 3, y - 9, 1, 1);
    g.fillRect(x + 5, y - 10, 1, 1);
    // Chair 1 (left).
    g.fillStyle = _CYP.bark;
    g.fillRect(x + 9,  y - 7, 3, 4);
    g.fillStyle = _CYP.barkH;
    g.fillRect(x + 9,  y - 7, 3, 1);
    g.fillStyle = _CYP.bark;
    g.fillRect(x + 8,  y - 3, 5, 1);
    g.fillRect(x + 8,  y - 2, 1, 3);
    g.fillRect(x + 12, y - 2, 1, 3);
    // Chair 2 (right).
    g.fillStyle = _CYP.bark;
    g.fillRect(x + 13, y - 6, 3, 3);
    g.fillStyle = _CYP.barkH;
    g.fillRect(x + 13, y - 6, 3, 1);
    g.fillStyle = _CYP.bark;
    g.fillRect(x + 13, y - 3, 4, 1);
    g.fillRect(x + 13, y - 2, 1, 3);
    g.fillRect(x + 16, y - 2, 1, 3);
    // Deck planter band beneath the patio.
    g.fillStyle = _CYP.creamShade;
    g.fillRect(x - 2, y + 3, 22, 3);
    g.fillStyle = _CYP.creamHi;
    g.fillRect(x - 2, y + 3, 22, 1);
    g.fillStyle = _CYP.leafDk;
    g.fillRect(x - 1, y + 2, 4, 1);
    g.fillRect(x + 18, y + 2, 3, 1);
    g.fillStyle = _CYP.leafMid;
    g.fillRect(x,      y + 2, 2, 1);
    g.fillRect(x + 18, y + 2, 2, 1);
    g.fillStyle = _CYP.blossom;
    g.fillRect(x + 1,  y + 1, 1, 1);
    g.fillRect(x + 19, y + 1, 1, 1);
  }

  // Light foreground anchor - a slim cream tower edge with a few warm
  // windows, balcony, planter. NOT a black wall.
  function _cyPaintFgAnchor(g, x, rng) {
    var w = 28 + Math.floor(rng() * 10);
    var h = 120 + Math.floor(rng() * 40);
    // v0.66: anchor extends to y=240 (canvas bottom) instead of
    // stopping at y=180, so its base reaches the road or goes
    // off-screen below per Mark "reach all the way down to the
    // ground or lower out of view."
    var baseY = 180 - h;
    var bottomY = 240;
    h = bottomY - baseY;
    // DARK foreground building palette - deep teal-slate / dark
    // warm-brown. Mark's brief: "buildings closer darker." These
    // contrast hard against the pale far skyline.
    var darkPick = Math.floor(rng() * 3);
    var body, shade, hi;
    if (darkPick === 0) {
      // Deep teal-slate.
      body  = '#3F5670';
      shade = '#243648';
      hi    = '#5F7894';
    } else if (darkPick === 1) {
      // Warm dark brown (Mark's reference building tone).
      body  = '#7A5D44';
      shade = '#4A3826';
      hi    = '#A0825E';
    } else {
      // Charcoal grey.
      body  = '#3D3F4A';
      shade = '#22232C';
      hi    = '#5E6173';
    }
    g.fillStyle = body;
    g.fillRect(x, baseY, w, h);
    g.fillStyle = shade;
    g.fillRect(x, baseY, 1, h);
    g.fillRect(x + w - 1, baseY, 1, h);
    g.fillRect(x, baseY, w, 1);
    _cyRoundCorners(g, x, baseY, w, h, shade);
    _cyPanelSeams(g, x, baseY + 4, w, h - 4, shade, hi);

    // BIG VERTICAL NEON SIGN running down the side - kanji-style
    // bar pattern with bright glow. Centerpiece feature per Mark's
    // references (HOTEL / BOTS / CAFE signs).
    var neonOnRight = rng() > 0.5;
    var neonCol = ['#FF4FA8', '#5AE8FF', '#FFD23A', '#FF8A40'][Math.floor(rng() * 4)];
    var neonGlow = neonCol === '#FF4FA8' ? 'rgba(255,79,168,0.30)'
                 : neonCol === '#5AE8FF' ? 'rgba(90,232,255,0.30)'
                 : neonCol === '#FFD23A' ? 'rgba(255,210,58,0.28)'
                                          : 'rgba(255,138,64,0.30)';
    var nx = neonOnRight ? x + w - 8 : x + 2;
    var nh = Math.min(h - 50, 70);
    var ny = baseY + 8;
    // Sign panel (dark).
    g.fillStyle = '#0A0E18';
    g.fillRect(nx, ny, 6, nh);
    // Glow halo (large, soft).
    g.fillStyle = neonGlow;
    g.fillRect(nx - 4, ny - 2, 14, nh + 4);
    // Re-paint the dark panel on top of the halo.
    g.fillStyle = '#0A0E18';
    g.fillRect(nx + 1, ny + 1, 4, nh - 2);
    // "Character" bars - simulating vertical kanji glyphs. Each "char"
    // is a 6x6 block with 3-4 fillRect chunks giving a glyph silhouette.
    var charH = 8;
    var glyphs = [
      [[0,0,4,1],[0,1,1,3],[2,1,2,1],[0,3,4,1]],     // gear-ish
      [[0,0,4,1],[1,1,2,3],[0,4,4,1]],                // block-ish
      [[0,0,1,4],[3,0,1,4],[0,2,4,1]],                // dual-vert
      [[0,1,4,1],[1,0,2,4],[0,3,4,1]],                // cross
      [[0,0,4,4]],                                     // solid block
      [[0,0,4,1],[0,3,4,1],[1,1,2,2]]                  // O-shape
    ];
    for (var gc = 0; gc < Math.floor(nh / charH); gc++) {
      var gly = glyphs[(Math.floor(rng() * 6))];
      g.fillStyle = neonCol;
      for (var gp = 0; gp < gly.length; gp++) {
        g.fillRect(nx + 1 + gly[gp][0], ny + 2 + gc * charH + gly[gp][1],
                   gly[gp][2], gly[gp][3]);
      }
      // Bright highlight pixel.
      g.fillStyle = '#FFFFFF';
      g.fillRect(nx + 2, ny + 3 + gc * charH, 1, 1);
    }

    // Warm windows + balconies - shifted to OPPOSITE side from the
    // neon sign so they don't compete visually.
    var winSideX = neonOnRight ? x + 4 : x + w - 10;
    // v0.66: windows continue down to bottomY-28 (was 180-28) since
    // the anchor now extends to y=240.
    for (var wy = baseY + 18; wy < bottomY - 28; wy += 18) {
      // Window frame (single bigger window not two).
      g.fillStyle = '#0E1422';
      g.fillRect(winSideX - 1, wy - 1, 6, 8);
      g.fillStyle = _CYP.warmWin;
      g.fillRect(winSideX,     wy,     4, 6);
      g.fillStyle = _CYP.warmWinH;
      g.fillRect(winSideX,     wy,     4, 1);
      // Mullions.
      g.fillStyle = '#0E1422';
      g.fillRect(winSideX + 1, wy,     1, 6);
      g.fillRect(winSideX + 3, wy,     1, 6);
      g.fillRect(winSideX,     wy + 3, 4, 1);
      // Glow halo around the window.
      g.fillStyle = 'rgba(255,210,140,0.18)';
      g.fillRect(winSideX - 3, wy - 2, 10, 10);
      // Balcony with planter directly below.
      g.fillStyle = shade;
      g.fillRect(x + 2,         wy + 8, w - 4, 2);
      g.fillStyle = hi;
      g.fillRect(x + 2,         wy + 8, w - 4, 1);
      // Railing.
      g.fillStyle = '#0E1422';
      g.fillRect(x + 3,         wy + 10, w - 6, 1);
      for (var rb = x + 4; rb < x + w - 4; rb += 3) {
        g.fillRect(rb,          wy + 11, 1, 2);
      }
      // Cascading planter foliage that spills over the balcony rail.
      g.fillStyle = _CYP.leafDk;
      for (var pf = x + 3; pf < x + w - 3; pf += 4) {
        var trail = 3 + ((pf * 13) & 3);
        g.fillRect(pf, wy + 13, 1, trail);
      }
      g.fillStyle = _CYP.leafMid;
      for (var pf2 = x + 4; pf2 < x + w - 3; pf2 += 5) {
        g.fillRect(pf2, wy + 13, 1, 2);
      }
      // Occasional blossom dot.
      if ((wy + x) & 4) {
        g.fillStyle = _CYP.blossom;
        g.fillRect(x + 6, wy + 14, 1, 1);
        g.fillRect(x + w - 7, wy + 16, 1, 1);
      }
    }
    // Rooftop garden cap with dense greenery.
    _cyDrawRoofGarden(g, x, baseY, w, rng);
    // Antenna + tall AC vent stack.
    g.fillStyle = shade;
    g.fillRect(x + Math.floor(w / 2) - 1, baseY - 13, 3, 5);
    g.fillStyle = hi;
    g.fillRect(x + Math.floor(w / 2) - 1, baseY - 13, 3, 1);
    g.fillStyle = '#0E1422';
    g.fillRect(x + Math.floor(w / 2),     baseY - 18, 1, 5);
    g.fillStyle = '#FF6464';
    g.fillRect(x + Math.floor(w / 2),     baseY - 18, 1, 1);
    // Pipes running down the side.
    g.fillStyle = shade;
    var pipeX = neonOnRight ? x + 1 : x + w - 2;
    g.fillRect(pipeX, baseY + 6, 1, h - 10);
    g.fillStyle = hi;
    g.fillRect(pipeX + (neonOnRight ? 1 : -1), baseY + 6, 1, h - 10);
    // Pipe joints every 14 px.
    for (var pj = baseY + 16; pj < bottomY - 12; pj += 14) {
      g.fillStyle = '#0E1422';
      g.fillRect(pipeX - 1, pj, 3, 2);
    }
  }

  // Flowering tree branch sweeping in from a corner.
  function _cyPaintFgBranch(g, x, y, dir, rng) {
    // Main branch as a series of bark pixels following a curve.
    var len = 60 + Math.floor(rng() * 30);
    g.fillStyle = _CYP.bark;
    for (var bi = 0; bi < len; bi++) {
      var bx = x + dir * bi;
      var by = y + Math.floor(Math.sin(bi * 0.06) * 8);
      if (bx < -2 || bx > 962) continue;
      g.fillRect(bx, by, 2, 2);
      // Side twig every 8 px.
      if (bi % 12 === 0 && bi > 0) {
        for (var tw = 0; tw < 6; tw++) {
          g.fillRect(bx - dir * tw, by + tw + 2, 1, 1);
        }
      }
    }
    // Leaf + blossom clusters along the branch.
    for (var lc = 1; lc < 10; lc++) {
      var lcx = x + dir * (lc * 8);
      var lcy = y + Math.floor(Math.sin(lc * 0.5) * 8);
      if (lcx < -8 || lcx > 968) continue;
      g.fillStyle = _CYP.leafDk;
      g.fillRect(lcx,     lcy,     4, 4);
      g.fillRect(lcx - 1, lcy + 1, 6, 2);
      g.fillStyle = _CYP.leafMid;
      g.fillRect(lcx + 1, lcy + 1, 2, 2);
      g.fillRect(lcx + 1, lcy + 2, 1, 1);
      g.fillStyle = _CYP.leafLt;
      g.fillRect(lcx + 1, lcy + 1, 1, 1);
      // Cherry blossoms on some clusters.
      if (lc % 2 === 0) {
        g.fillStyle = _CYP.blossom;
        g.fillRect(lcx,     lcy - 1, 1, 1);
        g.fillRect(lcx + 4, lcy + 1, 1, 1);
        g.fillRect(lcx + 2, lcy + 3, 1, 1);
        g.fillStyle = _CYP.blossomDk;
        g.fillRect(lcx + 3, lcy + 0, 1, 1);
      }
    }
  }

  // ---- Cache + accessor -----------------------------------------------
  var _cyCache = null;
  function _cyBuild() {
    if (_cyCache) return _cyCache;
    function mk(w, h, painter, blurPx) {
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var g = c.getContext('2d');
      if (blurPx) g.filter = 'blur(' + blurPx + 'px)';
      painter(g);
      g.filter = 'none';
      return c;
    }
    _cyCache = {
      // Atmospheric blur on the far layer - distant towers as soft
      // silhouettes. v0.62: 2.4 -> 1.68px. v0.66: 1.68 -> 1.26px
      // (another 25% off) per Mark "lower blur on the farthest
      // background by 25%."
      far:    mk(960, 180, _cyPaintFar,        1.26),
      // v0.76: small depth-of-field blur on mid (layer 4) + bridge
      // (layer 3) so the sharp road / play plane (layer 2) stands
      // out. Mark: "add a small amount of blur, just a little bit...
      // not too much." Bridge is closer to the focal plane so it
      // gets less blur than mid.
      mid:    mk(960, 180, _cyPaintMid,        0.9),
      // v0.57: bridge canvas grew 180→240 so the layer covers the
      // bottom of the screen when the camera scrolls up during a
      // jump (Mark: "when I jump, I can see under the layers").
      // Sub-level structural content (foundation arches + support
      // pillars) paints at y=152-240.
      bridge: mk(960, 240, _cyPaintBridge,     0.5),
      // v0.66: foreground canvas grown 180 -> 240 so the anchor
      // towers + kiosks + cafés reach all the way down to the
      // bottom of the screen (or below it, out of view). Mark:
      // "buildings from layer one should reach all the way down
      // to the ground or lower out of view."
      fg:     mk(960, 240, _cyPaintForeground, 0)
    };
    return _cyCache;
  }

  // =================================================================
  // PER-FRAME PAINTERS
  // =================================================================
  function drawSky_cyber(g, camx, camy, prog, t) {
    var S = SDD.sprites || {};
    var cache = _cyBuild();

    // 1. Bright daytime sky gradient.
    var sky = g.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0,    _CYP.skyTop);
    sky.addColorStop(0.45, _CYP.skyMid);
    sky.addColorStop(0.85, _CYP.skyHoriz);
    sky.addColorStop(1,    '#F8F2E0');
    g.fillStyle = sky; g.fillRect(0, 0, 320, 180);

    // 2. Subtle sun glow upper-right. v0.57 — Mark "sun is way too
    // bright" → halo + disc alphas + colors lowered to match
    // foreground tonal weight.
    var sunX = 248 - camx * 0.02, sunY = 30;
    var sunHalo = g.createRadialGradient(sunX, sunY, 4, sunX, sunY, 44);
    sunHalo.addColorStop(0,   'rgba(244,208,104,0.28)');
    sunHalo.addColorStop(0.5, 'rgba(232,168,72,0.10)');
    sunHalo.addColorStop(1,   'rgba(232,168,72,0)');
    g.fillStyle = sunHalo; g.fillRect(sunX - 44, 0, 88, 80);
    // Sun disc — warm yellow, not white.
    g.fillStyle = '#F4D068';
    g.beginPath(); g.arc(sunX, sunY, 7, 0, 6.28); g.fill();
    g.fillStyle = '#E8A848';
    g.beginPath(); g.arc(sunX, sunY, 4, 0, 6.28); g.fill();

    // 3. Big fluffy cumulus clouds at two parallax tiers. Each cloud
    //    is built from overlapping circular lobes with 4-tone shading
    //    (white highlight, cream body, cream-blue mid, blue-grey base
    //    shadow) so it reads as a proper 16-bit cumulus instead of a
    //    flat rectangle.
    function paintCumulus(g, x, y, scale, alpha) {
      // Lobes (cx, cy, r). Larger lobes near the bottom, smaller
      // bulbs piled on top so the cloud reads as cumulus.
      var lobes = [
        // base row.
        [0,           4,  6],
        [10,          5,  7],
        [21,          5,  6],
        [30,          4,  5],
        // upper bumps.
        [6,           -1, 6],
        [16,          -2, 7],
        [25,          -1, 5],
        // crown bulb.
        [12,          -6, 5]
      ];
      function lobe(cx, cy, r, color) {
        g.fillStyle = color;
        g.beginPath();
        g.arc(x + cx * scale, y + cy * scale, r * scale, 0, 6.28);
        g.fill();
      }
      // Pass 1: BASE SHADOW (cool blue-grey under the cloud).
      var shadowA = 'rgba(160,190,215,' + (alpha * 0.65) + ')';
      for (var i = 0; i < 4; i++) {
        lobe(lobes[i][0], lobes[i][1] + 2, lobes[i][2], shadowA);
      }
      // Pass 2: MID TONE (cream-blue body).
      var midA = 'rgba(228,238,246,' + alpha + ')';
      for (var i2 = 0; i2 < lobes.length; i2++) {
        lobe(lobes[i2][0], lobes[i2][1], lobes[i2][2], midA);
      }
      // Pass 3: CREAM BODY (warmer fill).
      var creamA = 'rgba(248,250,250,' + alpha + ')';
      for (var i3 = 0; i3 < lobes.length; i3++) {
        lobe(lobes[i3][0], lobes[i3][1] - 1, Math.max(1, lobes[i3][2] - 1), creamA);
      }
      // Pass 4: BRIGHT HIGHLIGHT (top-facing pure white edges).
      var hiA = 'rgba(255,255,255,' + Math.min(1, alpha + 0.05) + ')';
      lobe(lobes[5][0], lobes[5][1] - 2, lobes[5][2] - 2, hiA);
      lobe(lobes[7][0], lobes[7][1] - 1, lobes[7][2] - 1, hiA);
      lobe(lobes[1][0], lobes[1][1] - 2, lobes[1][2] - 2, hiA);
      // Faint streamer at the right edge.
      g.fillStyle = midA;
      g.fillRect(x + 32 * scale, y + 3 * scale, 6 * scale, 2);
      g.fillRect(x + 36 * scale, y + 4 * scale, 4 * scale, 1);
    }
    // High cumulus (slow parallax, BIG). Larger scale than before so
    // they read as proper fluffy cumulus per Mark's reference.
    for (var hc = 0; hc < 4; hc++) {
      var hcx = ((hc * 150 - camx * 0.05 + t * 0.05) % 500 + 500) % 500 - 90;
      var hcy = 18 + (hc % 3) * 14;
      paintCumulus(g, hcx, hcy, 1.4, 0.94);
    }
    // Mid cumulus (faster parallax, medium scale).
    for (var mc = 0; mc < 4; mc++) {
      var mcx = ((mc * 180 - camx * 0.10 + t * 0.07 + 90) % 500 + 500) % 500 - 90;
      var mcy = 55 + (mc % 2) * 10;
      paintCumulus(g, mcx, mcy, 1.0, 0.82);
    }
    // Lower wispy cumulus near horizon.
    for (var lc = 0; lc < 3; lc++) {
      var lcx = ((lc * 220 - camx * 0.14 + t * 0.09 + 40) % 520 + 520) % 520 - 100;
      var lcy = 88 + (lc % 2) * 6;
      paintCumulus(g, lcx, lcy, 0.85, 0.65);
    }
    // Distant tiny airship - small, hopeful, NOT dominant.
    var ash = ((t * 0.10 - camx * 0.04) % 540 + 540) % 540 - 80;
    g.fillStyle = '#E0EAF0';
    g.fillRect(ash, 38, 18, 3);
    g.fillRect(ash + 2, 37, 14, 1);
    g.fillRect(ash + 2, 41, 14, 1);
    g.fillStyle = '#A8B8C8';
    g.fillRect(ash + 7, 41, 4, 2);
    g.fillStyle = _CYP.accent;
    g.fillRect(ash + 16, 39, 1, 1);

    // Small flock of birds drifting across the sky - flapping
    // animation via 2-frame swap. Strong parallax so they pass
    // briskly through the frame.
    var flockX = ((t * 0.5 - camx * 0.18) % 460 + 460) % 460 - 60;
    var frame = (Math.floor(t / 12) & 1);
    var birdCols = ['#3a4664', '#23324d'];
    for (var bdi = 0; bdi < 5; bdi++) {
      var bx = flockX + bdi * 14 + (bdi & 1 ? 4 : 0);
      var by = 56 + (bdi % 3) * 4 + (bdi & 1 ? -2 : 0);
      g.fillStyle = birdCols[bdi % 2];
      if (frame === 0) {
        // Wings up.
        g.fillRect(bx,     by,     1, 1);
        g.fillRect(bx + 1, by - 1, 1, 1);
        g.fillRect(bx + 2, by,     1, 1);
        g.fillRect(bx + 3, by - 1, 1, 1);
        g.fillRect(bx + 4, by,     1, 1);
      } else {
        // Wings level (flap mid).
        g.fillRect(bx,     by,     5, 1);
        g.fillRect(bx + 2, by + 1, 1, 1);
      }
    }

    // v0.57: tileLayer now also applies vertical parallax. Y-factor
    // matches X-factor by default so the layer treats vertical camera
    // movement (player jumps) like world geometry. Mark: "when I
    // jump, layers should be in sync."
    // v0.58: optional `sat` filter applied per draw so each layer can
    // tune its own saturation. Far stays low (atmospheric perspective);
    // mid + bridge get a strong boost so the colors pop after the
    // global multiply darken pulls overall brightness down.
    function tileLayer(img, factor, yFactor, sat) {
      if (!img) return;
      var span = img.width || 320;
      var off = -(((camx * factor) % span) + span) % span;
      var yOff = -camy * (yFactor != null ? yFactor : factor);
      if (sat) g.filter = sat;
      for (var b = off - span; b < 320 + span; b += span) {
        g.drawImage(img, b, yOff);
      }
      if (sat) g.filter = 'none';
    }

    // 4. Far skyline (cached, atmospheric-blurred). Mild saturation
    //    boost only - distance shouldn't pop. v0.65: nudged up.
    //    v0.69: Y-parallax decoupled to 0.04 (was = X factor 0.10) so
    //    the layer barely shifts vertically when the camera follows
    //    the player up - keeps the colorful lower portions visible
    //    in-game, matching the cutscene look Mark preferred.
    var farImg = S.cyberFar && S.cyberFar();
    tileLayer(farImg || cache.far, 0.10, 0.04, 'saturate(150%)');

    // 5. Mid city - the gold-standard layer Mark wants colorful.
    //    v0.69: Y-parallax decoupled to 0.10 (was 0.25).
    var midImg = S.cyberMid && S.cyberMid();
    tileLayer(midImg || cache.mid, 0.25, 0.10, 'saturate(215%) contrast(116%)');

    // 5b. MONORAIL TRACK + train (animated, drawn between mid and
    //     bridge so it sits behind the shopfront row). Track scrolls
    //     at the mid-city parallax factor; train rides along it.
    _cyDrawMonorail(g, camx, camy, t);

    // 6. Bridge / shopfront walkway (canvas is 240 tall so the bottom
    //    sub-level structural pass covers when camera scrolls up).
    //    Strongest saturation boost since the shops carry the warmest
    //    accent palette. v0.65: pushed further again. v0.69:
    //    Y-parallax decoupled to 0.20 (was 0.50) so the bridge's
    //    rich shopfront row stays visible at the default camera
    //    position instead of shifting half-up off-screen.
    var brImg = S.cyberBridge && S.cyberBridge();
    tileLayer(brImg || cache.bridge, 0.50, 0.20, 'saturate(235%) contrast(120%)');

    // 7. SHADER PASS - applied to background layers. Compositing
    //    blends inject dynamic light + grading on top of the cached
    //    layer blits. Adds drama without modifying the base art.
    _cyDrawShaders(g, camx, camy, t);
    // v0.74: tunnel overpass overlay - world-space at parallax 1.0
    // so it sits in Layer 3 over the bridge / shopfront row. Painted
    // in both cyber + cyber-dawn so it persists across the hard
    // background swap that happens at the overpass midpoint.
    _cyDrawTunnelOverlay(g, camx, camy, t);
  }

  // =================================================================
  // MONORAIL TRACK - elevated transit line + animated train
  // =================================================================
  // Continuous horizontal rail at y=95 with concrete pylons every 96
  // px. One sleek train silhouette rides along, looping every 8s.
  // Parallax factor matches the mid-city layer (0.25) so the rail
  // sits visually with the mid-distance buildings.
  function _cyDrawMonorail(g, camx, camy, t) {
    // v0.57: vertical parallax matches the mid-city layer (0.25) so
    // the monorail moves with the buildings around it when the camera
    // scrolls vertically (player jump).
    var railY = 95 - camy * 0.25;
    var pf = 0.25;
    // Concrete pylons every 96 px (in world coords, scrolled).
    var spacing = 96;
    var pylonOff = -(((camx * pf) % spacing) + spacing) % spacing;
    for (var p = pylonOff - spacing; p < 320 + spacing; p += spacing) {
      // Pylon shaft (concrete).
      g.fillStyle = '#9CB0BE';
      g.fillRect(p,      railY + 4, 5, 60);
      g.fillStyle = '#BCD0DE';
      g.fillRect(p + 4,  railY + 4, 1, 60);
      g.fillStyle = '#5A6E7C';
      g.fillRect(p,      railY + 4, 1, 60);
      // Pylon cap (where the rail rests).
      g.fillStyle = '#5A6E7C';
      g.fillRect(p - 2,  railY + 2, 9, 3);
      g.fillStyle = '#BCD0DE';
      g.fillRect(p - 2,  railY + 2, 9, 1);
    }
    // Continuous rail beam - dark slate top, lighter underside.
    g.fillStyle = '#28384C';
    g.fillRect(0, railY,     320, 2);
    g.fillStyle = '#5A6E7C';
    g.fillRect(0, railY + 2, 320, 1);
    g.fillStyle = '#1A2230';
    g.fillRect(0, railY - 1, 320, 1);
    // Subtle inner light (running powerline).
    g.fillStyle = 'rgba(140,220,255,0.55)';
    g.fillRect(0, railY, 320, 1);

    // Train: rides the rail and loops every 8s. Position is in
    // SCREEN coords so it's always visible (independent of camera).
    var trainPeriod = 480;       // 8 seconds at 60 Hz
    var trainPhase = (t % trainPeriod) / trainPeriod;
    var trainDir = 1;            // could alternate
    var trainX = -80 + trainPhase * 480;
    var ty = railY - 12;
    // Front cab + 2 cars.
    var carCol = '#D55090';
    var carShade = '#8A2A5C';
    var carHi = '#FF8AC8';
    var winCol = '#9AE6FF';
    var winShade = '#3A86AC';
    // Cab (front, slightly tapered).
    g.fillStyle = carShade;
    g.fillRect(trainX,       ty,     2, 9);
    g.fillRect(trainX + 2,   ty - 1, 22, 11);
    g.fillStyle = carCol;
    g.fillRect(trainX + 2,   ty,     22, 9);
    g.fillStyle = carHi;
    g.fillRect(trainX + 2,   ty,     22, 1);
    // Cab windscreen.
    g.fillStyle = winCol;
    g.fillRect(trainX + 3,   ty + 2, 5, 3);
    g.fillStyle = winShade;
    g.fillRect(trainX + 3,   ty + 4, 5, 1);
    // Cabin windows (row of 3).
    g.fillStyle = winCol;
    g.fillRect(trainX + 10,  ty + 2, 3, 3);
    g.fillRect(trainX + 15,  ty + 2, 3, 3);
    g.fillRect(trainX + 20,  ty + 2, 3, 3);
    g.fillStyle = winShade;
    g.fillRect(trainX + 10,  ty + 4, 3, 1);
    g.fillRect(trainX + 15,  ty + 4, 3, 1);
    g.fillRect(trainX + 20,  ty + 4, 3, 1);
    // Cab body shadow.
    g.fillStyle = carShade;
    g.fillRect(trainX + 2,   ty + 8, 22, 1);
    // Headlight (depending on direction).
    g.fillStyle = '#FFF6C0';
    g.fillRect(trainX + 22,  ty + 6, 2, 2);
    // Trailing car (separate block).
    g.fillStyle = carCol;
    g.fillRect(trainX - 18,  ty,     16, 9);
    g.fillStyle = carHi;
    g.fillRect(trainX - 18,  ty,     16, 1);
    g.fillStyle = carShade;
    g.fillRect(trainX - 18,  ty + 8, 16, 1);
    // Trailing car windows.
    g.fillStyle = winCol;
    g.fillRect(trainX - 16,  ty + 2, 3, 3);
    g.fillRect(trainX - 11,  ty + 2, 3, 3);
    g.fillRect(trainX - 6,   ty + 2, 3, 3);
    g.fillStyle = winShade;
    g.fillRect(trainX - 16,  ty + 4, 3, 1);
    g.fillRect(trainX - 11,  ty + 4, 3, 1);
    g.fillRect(trainX - 6,   ty + 4, 3, 1);
    // Coupling between cars.
    g.fillStyle = carShade;
    g.fillRect(trainX - 2,   ty + 4, 2, 2);
    // Train shadow on the rail.
    g.fillStyle = 'rgba(20,30,50,0.40)';
    g.fillRect(trainX - 20, ty + 9, 44, 1);
  }

  // =================================================================
  // STREET FURNITURE (v0.57) - lamp posts, crosswalks, street signs,
  // benches. World-coord positioned so they stay glued to the tile
  // layer as the camera scrolls. Drawn from drawForeground_cyber,
  // AFTER tiles + entities + foreground silhouettes, so they sit at
  // the road plane and read as part of Layer 2.
  // =================================================================
  function _cyDrawStreetFurniture(g, camx, camy, t) {
    // The road surface in world coords sits around y=176 (the top of
    // row 11). Street furniture mounts to the SIDEWALK at y=176 and
    // extends upward.
    var roadY = 176 - camy;
    var sideY = roadY - 4;     // sidewalk top
    // World X range visible: camx to camx + 320. Compute world-x
    // start offset so anything we paint at integer world coords gets
    // translated correctly.
    var wx0 = camx - 32;
    var wx1 = camx + 320 + 32;

    // CROSSWALK STRIPES every 320 world-px (was 200; v0.66 thinning).
    var crossSpacing = 320;
    var crossStart = Math.floor(wx0 / crossSpacing) * crossSpacing;
    for (var cw = crossStart; cw < wx1; cw += crossSpacing) {
      var cx = cw - camx;
      for (var st = 0; st < 5; st++) {
        g.fillStyle = '#E8DFC8';
        g.fillRect(cx + st * 6, roadY + 4, 4, 1);
        g.fillStyle = '#8C7448';
        g.fillRect(cx + st * 6, roadY + 5, 4, 1);
      }
    }

    // LAMP POSTS every 160 world-px (was 96; v0.66 thinning).
    var lampSpacing = 160;
    var lampStart = Math.floor(wx0 / lampSpacing) * lampSpacing;
    for (var lp = lampStart; lp < wx1; lp += lampSpacing) {
      var lx = lp - camx;
      // Glow halo behind the lamp first so post + arm paint on top.
      var halo = g.createRadialGradient(lx + 6, sideY - 18, 2, lx + 6, sideY - 18, 28);
      halo.addColorStop(0,   'rgba(255,228,160,0.45)');
      halo.addColorStop(0.5, 'rgba(255,200,120,0.18)');
      halo.addColorStop(1,   'rgba(255,200,120,0)');
      g.fillStyle = halo;
      g.fillRect(lx - 22, sideY - 40, 56, 44);
      // Iron post (dark).
      g.fillStyle = '#22232C';
      g.fillRect(lx,     sideY - 28, 2, 28);
      g.fillStyle = '#3D3F4A';
      g.fillRect(lx + 1, sideY - 28, 1, 28);
      // Base flare.
      g.fillStyle = '#22232C';
      g.fillRect(lx - 2, sideY - 2,  6, 2);
      g.fillStyle = '#5E6173';
      g.fillRect(lx - 2, sideY - 2,  6, 1);
      // Curved arm reaching toward the road.
      g.fillStyle = '#22232C';
      g.fillRect(lx + 2, sideY - 28, 4, 1);
      g.fillRect(lx + 5, sideY - 27, 2, 1);
      g.fillRect(lx + 6, sideY - 26, 1, 2);
      // Lamp housing.
      g.fillStyle = '#22232C';
      g.fillRect(lx + 4, sideY - 24, 4, 3);
      g.fillStyle = '#5E6173';
      g.fillRect(lx + 4, sideY - 24, 4, 1);
      // Bright bulb.
      g.fillStyle = '#FFE4A0';
      g.fillRect(lx + 5, sideY - 22, 2, 1);
      g.fillStyle = '#FFFFFF';
      g.fillRect(lx + 5, sideY - 22, 1, 1);
    }

    // STREET SIGNS every 240 world-px (was 140; v0.66 thinning).
    var signSpacing = 240;
    var signStart = Math.floor(wx0 / signSpacing) * signSpacing;
    for (var sg = signStart; sg < wx1; sg += signSpacing) {
      var sx = sg - camx;
      var signKind = (sg / signSpacing) % 4;
      if (signKind < 0) signKind += 4;
      _cyDrawStreetSign(g, sx, sideY, signKind | 0);
    }

    // BENCHES every 360 world-px (was 220; v0.66 thinning).
    var benchSpacing = 360;
    var benchStart = Math.floor(wx0 / benchSpacing) * benchSpacing + 60;
    for (var bn = benchStart; bn < wx1; bn += benchSpacing) {
      var bxw = bn - camx;
      g.fillStyle = '#8C5A3A';
      g.fillRect(bxw,     sideY - 6, 16, 2);
      g.fillStyle = '#5A3818';
      g.fillRect(bxw,     sideY - 4, 16, 1);
      // Legs.
      g.fillStyle = '#3D3F4A';
      g.fillRect(bxw + 1, sideY - 3, 2, 3);
      g.fillRect(bxw + 13, sideY - 3, 2, 3);
      // Backrest.
      g.fillStyle = '#8C5A3A';
      g.fillRect(bxw,     sideY - 12, 16, 1);
      g.fillStyle = '#3D3F4A';
      g.fillRect(bxw + 1, sideY - 11, 1, 5);
      g.fillRect(bxw + 14, sideY - 11, 1, 5);
    }
  }

  // One street sign per call. kind picks the variant.
  function _cyDrawStreetSign(g, sx, sideY, kind) {
    // Post (always the same).
    g.fillStyle = '#22232C';
    g.fillRect(sx,     sideY - 22, 2, 22);
    g.fillStyle = '#3D3F4A';
    g.fillRect(sx + 1, sideY - 22, 1, 22);
    // Base.
    g.fillStyle = '#22232C';
    g.fillRect(sx - 1, sideY - 2,  4, 2);
    // Sign panel varies.
    if (kind === 0) {
      // GREEN DIRECTIONAL: "3RD ST →"
      g.fillStyle = '#1A1E2A';
      g.fillRect(sx + 2, sideY - 22, 24, 8);
      g.fillStyle = '#3A8060';
      g.fillRect(sx + 3, sideY - 21, 22, 6);
      g.fillStyle = '#5AAA80';
      g.fillRect(sx + 3, sideY - 21, 22, 1);
      // Faux text glyphs (white bars).
      g.fillStyle = '#E8E8E8';
      g.fillRect(sx + 5,  sideY - 19, 3, 1);
      g.fillRect(sx + 5,  sideY - 17, 3, 1);
      g.fillRect(sx + 10, sideY - 19, 2, 3);
      g.fillRect(sx + 15, sideY - 19, 4, 1);
      g.fillRect(sx + 15, sideY - 17, 4, 1);
      // Arrow.
      g.fillRect(sx + 21, sideY - 18, 3, 1);
      g.fillRect(sx + 22, sideY - 19, 1, 1);
      g.fillRect(sx + 22, sideY - 17, 1, 1);
    } else if (kind === 1) {
      // CYAN TRANSIT STOP - circular sign with a tiny train.
      g.fillStyle = '#1A1E2A';
      g.beginPath(); g.arc(sx + 6, sideY - 18, 6, 0, 6.28); g.fill();
      g.fillStyle = '#5AE8FF';
      g.beginPath(); g.arc(sx + 6, sideY - 18, 5, 0, 6.28); g.fill();
      g.fillStyle = '#9AF0FF';
      g.beginPath(); g.arc(sx + 6, sideY - 18, 4, 0, 6.28); g.fill();
      // Tiny train icon.
      g.fillStyle = '#1A1E2A';
      g.fillRect(sx + 3, sideY - 19, 6, 3);
      g.fillRect(sx + 4, sideY - 17, 4, 1);
      g.fillStyle = '#FFE4A0';
      g.fillRect(sx + 5, sideY - 18, 1, 1);
      g.fillRect(sx + 7, sideY - 18, 1, 1);
    } else if (kind === 2) {
      // PEDESTRIAN sign - yellow diamond + walking figure.
      g.fillStyle = '#1A1E2A';
      // Diamond outline.
      for (var dy = 0; dy < 8; dy++) {
        var dw = 8 - Math.abs(dy - 4);
        g.fillRect(sx + 6 - dw, sideY - 22 + dy, dw * 2 + 1, 1);
      }
      g.fillStyle = '#FFD23A';
      for (var dy2 = 1; dy2 < 7; dy2++) {
        var dw2 = 7 - Math.abs(dy2 - 4);
        g.fillRect(sx + 6 - dw2, sideY - 22 + dy2, dw2 * 2 + 1, 1);
      }
      // Walking figure silhouette.
      g.fillStyle = '#1A1E2A';
      g.fillRect(sx + 5, sideY - 20, 2, 1);  // head
      g.fillRect(sx + 5, sideY - 18, 2, 2);  // body
      g.fillRect(sx + 4, sideY - 17, 1, 2);  // leg back
      g.fillRect(sx + 7, sideY - 16, 1, 1);  // leg fwd
    } else {
      // ARROW directional sign (orange).
      g.fillStyle = '#1A1E2A';
      g.fillRect(sx + 2, sideY - 20, 16, 6);
      g.fillStyle = '#FF8A40';
      g.fillRect(sx + 3, sideY - 19, 14, 4);
      g.fillStyle = '#FFB070';
      g.fillRect(sx + 3, sideY - 19, 14, 1);
      // Arrow.
      g.fillStyle = '#1A1E2A';
      g.fillRect(sx + 5, sideY - 17, 8, 1);
      g.fillRect(sx + 12, sideY - 18, 1, 1);
      g.fillRect(sx + 12, sideY - 16, 1, 1);
      g.fillRect(sx + 13, sideY - 19, 1, 1);
      g.fillRect(sx + 13, sideY - 15, 1, 1);
    }
  }

  // =================================================================
  // DECOR EDITOR RENDERER + KINDS (v0.67)
  // =================================================================
  // Reads SDD.cyberDecor['8-1'] (array of { kind, x, y, variant })
  // and paints each piece on Layer 1 in world-space. Drawn from
  // drawForeground_cyber AFTER the building canvas blits so decor
  // sits in front of buildings.
  //
  // All kind painters take SCREEN coords (sx, sy). The dispatcher
  // converts world coords (x, y) -> (x - camx, y - camy).
  //
  // Adding a new kind: extend DECOR_KINDS + add a case in
  // _cyPaintDecorPiece + (optional) expose a thumbnail painter for
  // the editor toolbar.
  var DECOR_KINDS = ['lamp', 'bench', 'sign', 'crosswalk', 'vine',
                     'cafe', 'hangingSign', 'branch'];
  function _cyDrawDecor(g, camx, camy, t) {
    if (!SDD.cyberDecor) return;
    var sc = SDD.scene;
    var key = (sc && sc.day != null && sc.stage != null)
      ? sc.day + '-' + sc.stage : null;
    if (!key) return;
    var decor = SDD.cyberDecor[key];
    if (!decor || !decor.length) return;
    for (var i = 0; i < decor.length; i++) {
      var d = decor[i];
      var sx = (d.x | 0) - camx;
      var sy = (d.y | 0) - camy;
      if (sx < -80 || sx > 400) continue;
      _cyPaintDecorPiece(g, d.kind || 'lamp', sx, sy, d.variant || 0, t, d);
    }
  }
  function _cyPaintDecorPiece(g, kind, sx, sy, variant, t, d) {
    switch (kind) {
      case 'lamp':       _cyPaintLampAt(g, sx, sy); return;
      case 'bench':      _cyPaintBenchAt(g, sx, sy); return;
      case 'sign':       _cyDrawStreetSign(g, sx, sy, variant | 0); return;
      case 'crosswalk':  _cyPaintCrosswalkAt(g, sx, sy); return;
      case 'vine':       _cyPaintSingleVine(g, sx, sy, (d && d.len) || 18, variant | 0); return;
      case 'cafe':       _cyPaintFgCafePatio(g, sx, _cyRng((d && d.seed) || 0x1234)); return;
      case 'hangingSign': _cyPaintHangingSignAt(g, sx, sy, variant | 0); return;
      case 'branch':     _cyPaintFgBranch(g, sx, sy, variant >= 2 ? -1 : 1, _cyRng((d && d.seed) || 0x5678)); return;
    }
  }
  // Single lamp post. sx = base center x, sy = sidewalk top y.
  // Iron post + curved arm + lamp housing + warm bulb + radial halo.
  function _cyPaintLampAt(g, sx, sy) {
    var halo = g.createRadialGradient(sx + 6, sy - 18, 2, sx + 6, sy - 18, 28);
    halo.addColorStop(0,   'rgba(255,228,160,0.55)');
    halo.addColorStop(0.5, 'rgba(255,200,120,0.22)');
    halo.addColorStop(1,   'rgba(255,200,120,0)');
    g.fillStyle = halo;
    g.fillRect(sx - 22, sy - 40, 56, 44);
    g.fillStyle = '#22232C';
    g.fillRect(sx,     sy - 28, 2, 28);
    g.fillStyle = '#3D3F4A';
    g.fillRect(sx + 1, sy - 28, 1, 28);
    g.fillStyle = '#22232C';
    g.fillRect(sx - 2, sy - 2,  6, 2);
    g.fillStyle = '#5E6173';
    g.fillRect(sx - 2, sy - 2,  6, 1);
    g.fillStyle = '#22232C';
    g.fillRect(sx + 2, sy - 28, 4, 1);
    g.fillRect(sx + 5, sy - 27, 2, 1);
    g.fillRect(sx + 6, sy - 26, 1, 2);
    g.fillStyle = '#22232C';
    g.fillRect(sx + 4, sy - 24, 4, 3);
    g.fillStyle = '#5E6173';
    g.fillRect(sx + 4, sy - 24, 4, 1);
    g.fillStyle = '#FFE4A0';
    g.fillRect(sx + 5, sy - 22, 2, 1);
    g.fillStyle = '#FFFFFF';
    g.fillRect(sx + 5, sy - 22, 1, 1);
  }
  // Single bench. sx = left edge, sy = sidewalk top.
  function _cyPaintBenchAt(g, sx, sy) {
    g.fillStyle = '#8C5A3A';
    g.fillRect(sx,     sy - 6, 16, 2);
    g.fillStyle = '#5A3818';
    g.fillRect(sx,     sy - 4, 16, 1);
    g.fillStyle = '#3D3F4A';
    g.fillRect(sx + 1, sy - 3, 2, 3);
    g.fillRect(sx + 13, sy - 3, 2, 3);
    g.fillStyle = '#8C5A3A';
    g.fillRect(sx,     sy - 12, 16, 1);
    g.fillStyle = '#3D3F4A';
    g.fillRect(sx + 1, sy - 11, 1, 5);
    g.fillRect(sx + 14, sy - 11, 1, 5);
  }
  // Crosswalk - 5 white bars on the road. sx = left edge, sy = road top.
  function _cyPaintCrosswalkAt(g, sx, sy) {
    for (var st = 0; st < 5; st++) {
      g.fillStyle = '#E8DFC8';
      g.fillRect(sx + st * 6, sy + 4, 4, 1);
      g.fillStyle = '#8C7448';
      g.fillRect(sx + st * 6, sy + 5, 4, 1);
    }
  }
  // Single hanging vine. sx = attachment x, sy = attachment y.
  // len = pixel length downward. variant 0 = green vine, 1 = with
  // pink blossom cluster at the bottom.
  function _cyPaintSingleVine(g, sx, sy, len, variant) {
    // Attachment fixture (small dark bracket).
    g.fillStyle = '#3D3F4A';
    g.fillRect(sx - 1, sy, 3, 1);
    g.fillStyle = _CYP.leafDk;
    for (var vy = 1; vy <= len; vy++) {
      var jit = (Math.sin(vy * 0.55) | 0);
      g.fillRect(sx + jit, sy + vy, 1, 1);
      if (vy % 3 === 1) {
        g.fillStyle = _CYP.leafMid;
        g.fillRect(sx + jit - 1, sy + vy, 1, 1);
        g.fillRect(sx + jit + 1, sy + vy, 1, 1);
        g.fillStyle = _CYP.leafDk;
      }
    }
    if (variant === 1 && len > 12) {
      g.fillStyle = _CYP.blossom;
      g.fillRect(sx,     sy + len - 2, 2, 2);
      g.fillRect(sx - 1, sy + len - 1, 1, 1);
      g.fillStyle = _CYP.blossomDk;
      g.fillRect(sx + 2, sy + len - 1, 1, 1);
    }
  }
  // Single hanging sign panel with neon glow + glyph stack.
  // sx = horizontal center, sy = top attachment (cable from above).
  function _cyPaintHangingSignAt(g, sx, sy, variant) {
    var w = 14, h = 12;
    // Cable from above (suspends the sign).
    g.fillStyle = '#1A1E2A';
    g.fillRect(sx,     sy - 6, 1, 6);
    g.fillStyle = '#3D3F4A';
    g.fillRect(sx - 4, sy - 1, 9, 1);
    // Sign panel.
    g.fillStyle = '#0A0E18';
    g.fillRect(sx - w / 2, sy, w, h);
    var cols = ['#FF4FA8', '#5AE8FF', '#FFD23A', '#FF8A40', '#A0F060'];
    var nc = cols[(variant | 0) % 5];
    var glow = nc === '#FF4FA8' ? 'rgba(255,79,168,0.30)'
             : nc === '#5AE8FF' ? 'rgba(90,232,255,0.30)'
             : nc === '#FFD23A' ? 'rgba(255,210,58,0.28)'
             : nc === '#FF8A40' ? 'rgba(255,138,64,0.30)'
                                  : 'rgba(160,240,96,0.28)';
    g.fillStyle = glow;
    g.fillRect(sx - w / 2 - 2, sy - 1, w + 4, h + 2);
    g.fillStyle = '#0A0E18';
    g.fillRect(sx - w / 2, sy, w, h);
    // 3 glyph cells.
    g.fillStyle = nc;
    g.fillRect(sx - w / 2 + 2, sy + 2, 4, 1);
    g.fillRect(sx - w / 2 + 3, sy + 3, 2, 1);
    g.fillRect(sx - w / 2 + 2, sy + 5, 4, 1);
    g.fillRect(sx - w / 2 + 8, sy + 2, 4, 1);
    g.fillRect(sx - w / 2 + 9, sy + 4, 2, 1);
    g.fillRect(sx - w / 2 + 8, sy + 6, 4, 1);
    g.fillRect(sx - w / 2 + 2, sy + 8, 10, 2);
    g.fillStyle = '#FFFFFF';
    g.fillRect(sx - w / 2 + 2, sy + 2, 1, 1);
    g.fillRect(sx - w / 2 + 8, sy + 2, 1, 1);
  }

  // =================================================================
  // SHADER PASS - dynamic lighting + contrast grading on the bg
  // =================================================================
  function _cyDrawShaders(g, camx, camy, t) {
    var sunX = 248 - camx * 0.02, sunY = 30;
    // 1. WARM SUN-SIDE GRADE (screen) - brightens the right side
    //    around the sun for golden-hour glow. v0.57: alpha + radius
    //    reduced per Mark's "way too bright" feedback.
    var pulse = 0.94 + Math.sin(t * 0.018) * 0.08;
    g.save();
    g.globalCompositeOperation = 'screen';
    var sunSide = g.createRadialGradient(sunX, sunY, 8, sunX, sunY, 180);
    sunSide.addColorStop(0,    'rgba(255,236,170,' + (0.18 * pulse).toFixed(3) + ')');
    sunSide.addColorStop(0.45, 'rgba(255,220,140,' + (0.08 * pulse).toFixed(3) + ')');
    sunSide.addColorStop(1,    'rgba(255,180,120,0)');
    g.fillStyle = sunSide;
    g.fillRect(0, 0, 320, 180);
    g.restore();

    // 2. COOL SHADOW GRADE (multiply) - subtle teal tint on the
    //    left/lower side so the split-tone reads as a sunny day with
    //    cooler shadow.
    g.save();
    g.globalCompositeOperation = 'multiply';
    var coolSide = g.createLinearGradient(0, 180, 320, 0);
    coolSide.addColorStop(0,    'rgba(205,222,236,1)');
    coolSide.addColorStop(0.45, 'rgba(232,238,246,1)');
    coolSide.addColorStop(1,    'rgba(255,255,255,1)');
    g.fillStyle = coolSide;
    g.fillRect(0, 0, 320, 180);
    g.restore();

    // 3. GOD RAYS - 5 soft diagonal beams from the sun. Slow drift
    //    via t so the rays read as animated atmospheric volumetrics.
    g.save();
    g.globalCompositeOperation = 'screen';
    for (var r = 0; r < 5; r++) {
      var angle = 1.95 + r * 0.10 + Math.sin(t * 0.012 + r * 1.3) * 0.06;
      var rayLen = 220 + Math.sin(t * 0.02 + r) * 12;
      g.save();
      g.translate(sunX, sunY);
      g.rotate(angle);
      var ray = g.createLinearGradient(0, 0, 0, rayLen);
      var rayA = (0.10 + Math.sin(t * 0.04 + r * 2.1) * 0.04).toFixed(3);
      ray.addColorStop(0,   'rgba(255,238,160,' + rayA + ')');
      ray.addColorStop(0.4, 'rgba(255,220,130,' + (rayA * 0.6).toFixed(3) + ')');
      ray.addColorStop(1,   'rgba(255,180,100,0)');
      g.fillStyle = ray;
      g.fillRect(-4, 0, 8, rayLen);
      g.restore();
    }
    g.restore();

    // 4. SUN FLARE / DISC HALO - bright additive bloom directly on
    //    the sun position with a 4-point starburst. v0.57: alphas +
    //    burst length pulled down so the sun reads as a warm disc,
    //    not a blown-out white blob.
    g.save();
    g.globalCompositeOperation = 'screen';
    var halo = g.createRadialGradient(sunX, sunY, 2, sunX, sunY, 22);
    halo.addColorStop(0,    'rgba(248,228,160,0.50)');
    halo.addColorStop(0.4,  'rgba(244,208,128,0.22)');
    halo.addColorStop(1,    'rgba(240,184,108,0)');
    g.fillStyle = halo;
    g.fillRect(sunX - 22, sunY - 22, 44, 44);
    // Starburst arms (4-point).
    var burstLen = 22 + Math.sin(t * 0.04) * 3;
    g.fillStyle = 'rgba(248,228,168,0.30)';
    g.fillRect(sunX - 1,        sunY - burstLen, 2, burstLen * 2);
    g.fillRect(sunX - burstLen, sunY - 1,        burstLen * 2, 2);
    // Diagonal arms (shorter).
    g.save();
    g.translate(sunX, sunY);
    g.rotate(Math.PI / 4);
    g.fillRect(-1, -burstLen * 0.55, 2, burstLen * 1.1);
    g.fillRect(-burstLen * 0.55, -1, burstLen * 1.1, 2);
    g.restore();
    g.restore();

    // 5. VOLUMETRIC MIST DRIFT - slow-moving translucent horizontal
    //    bands across the mid-city band. Gives a layered fog feel.
    g.save();
    for (var mi = 0; mi < 4; mi++) {
      var mx = ((mi * 200 + t * 0.5) % 500 + 500) % 500 - 90;
      var my = 76 + mi * 16;
      var mw = 280;
      var mgrad = g.createLinearGradient(mx, my, mx + mw, my);
      mgrad.addColorStop(0,    'rgba(255,255,255,0)');
      mgrad.addColorStop(0.3,  'rgba(255,255,255,0.16)');
      mgrad.addColorStop(0.7,  'rgba(232,244,252,0.16)');
      mgrad.addColorStop(1,    'rgba(255,255,255,0)');
      g.fillStyle = mgrad;
      g.fillRect(mx, my, mw, 5);
    }
    g.restore();

    // 6. WINDOW LIGHT BREATHE - subtle warm pulse on the mid-city
    //    band where lit windows are concentrated. v0.57: base pulse
    //    halved per brightness brief.
    var winPulse = 0.02 + Math.sin(t * 0.035) * 0.012;
    g.save();
    g.globalCompositeOperation = 'screen';
    g.fillStyle = 'rgba(255,210,140,' + winPulse.toFixed(3) + ')';
    g.fillRect(0, 102, 320, 46);
    g.restore();

    // 7. SOFT VIGNETTE (multiply) - corners slightly cooler so the
    //    focus stays on the city center. Very gentle.
    g.save();
    g.globalCompositeOperation = 'multiply';
    var vig = g.createRadialGradient(160, 90, 120, 160, 90, 220);
    vig.addColorStop(0,    'rgba(255,255,255,1)');
    vig.addColorStop(0.6,  'rgba(245,248,252,1)');
    vig.addColorStop(1,    'rgba(208,220,236,1)');
    g.fillStyle = vig;
    g.fillRect(0, 0, 320, 180);
    g.restore();

    // 8. GLOBAL MULTIPLY DARKEN (v0.66 - Mark "lower brightness to
    //    fourteen") - stops pulled down ~14 RGB units so the scene
    //    dims another notch on top of v0.65. Layer 1 (foreground)
    //    draws AFTER and is unaffected, keeping the contrast
    //    inversion intact.
    g.save();
    g.globalCompositeOperation = 'multiply';
    var darken = g.createLinearGradient(0, 0, 0, 180);
    darken.addColorStop(0,    'rgba(214,214,218,1)');
    darken.addColorStop(0.5,  'rgba(202,204,210,1)');
    darken.addColorStop(1,    'rgba(182,188,200,1)');
    g.fillStyle = darken;
    g.fillRect(0, 0, 320, 180);
    g.restore();
  }

  // v0.76: in-world directional signpost (Adventure City start).
  // sign = { col, label }. Painted on the sidewalk at the given
  // world column with a pole, a green sign panel + label, and a
  // bobbing yellow arrow pointing right.
  function _cyDrawStartSign(g, camx, camy, t, sign) {
    var T = C.TILE;
    var wx = (sign.col || 8) * T;
    var sx = Math.round(wx - camx);
    if (sx < -120 || sx > 340) return;
    // Ground row is 11; sidewalk top ~ row 11 * 16 = 176.
    var groundY = 176 - camy;
    var poleTop = groundY - 40;
    // Pole.
    g.fillStyle = '#2a2e3a';
    g.fillRect(sx, poleTop, 2, 40);
    g.fillStyle = '#3d4150';
    g.fillRect(sx, poleTop, 1, 40);
    // Sign panel (green directional).
    var pw = 56, ph = 14;
    var px = sx - 4, py = poleTop - 2;
    g.fillStyle = '#1a3a28';
    g.fillRect(px, py, pw, ph);
    g.fillStyle = '#2e7d4f';
    g.fillRect(px + 1, py + 1, pw - 2, ph - 2);
    g.fillStyle = '#46c878';
    g.fillRect(px + 1, py + 1, pw - 2, 1);
    g.fillStyle = '#0e2418';
    g.fillRect(px, py + ph - 1, pw, 1);
    SDD.sprites.text(g, sign.label || 'TOWER', px + pw / 2 - 1, py + 4, '#eafff0', 1, 'center');
    // Bobbing yellow arrow pointing right, just below the sign.
    var bob = Math.round(Math.sin(t * 0.12) * 2);
    var ay = py + ph + 4 + bob;
    var ax = sx + 6;
    g.fillStyle = '#ffd23a';
    g.fillRect(ax, ay + 2, 10, 2);          // shaft
    g.fillRect(ax + 8, ay, 2, 6);           // arrowhead verticals
    g.fillRect(ax + 10, ay + 1, 2, 4);
    g.fillRect(ax + 12, ay + 2, 2, 2);
    g.fillStyle = '#fff0a0';
    g.fillRect(ax, ay + 2, 8, 1);
  }

  // v0.91: little cat sprite that hangs out near the start of
  // Adventure City (Mark: "add a little cat sprite to just hang out on
  // the first panel"). Procedural pixel cat - orange tabby silhouette
  // that breathes + occasionally swishes its tail. Always rendered at
  // world col 13 (just right of the TOWER > sign), on the sidewalk.
  function _cyDrawCityCat(g, camx, camy, t) {
    var wx = 13 * 16;
    var sx = Math.round(wx - camx);
    if (sx < -32 || sx > 340) return;
    var groundY = 176 - camy;
    var by = groundY - 12;                       // cat body bottom
    var breathe = Math.round(Math.sin(t * 0.05) * 1);
    var ty = by - breathe;
    // Soft contact shadow.
    g.fillStyle = 'rgba(0,0,0,0.30)';
    g.fillRect(sx - 8, groundY - 1, 16, 1);
    // Tail (swishes occasionally).
    var swish = Math.round(Math.sin(t * 0.13) * 2);
    g.fillStyle = '#c2741a';
    g.fillRect(sx - 11, ty + 3, 1, 1);
    g.fillRect(sx - 12 + swish, ty + 2, 1, 1);
    g.fillRect(sx - 13 + swish, ty + 1, 1, 1);
    g.fillStyle = '#7a4010';
    g.fillRect(sx - 11, ty + 4, 1, 1);
    // Body (curled / sitting).
    g.fillStyle = '#e89030';
    g.fillRect(sx - 10, ty + 4, 11, 6);
    g.fillRect(sx - 9,  ty + 3, 9, 1);
    // Stripes.
    g.fillStyle = '#a05818';
    g.fillRect(sx - 8, ty + 5, 1, 4);
    g.fillRect(sx - 5, ty + 5, 1, 4);
    g.fillRect(sx - 2, ty + 5, 1, 4);
    // Belly highlight.
    g.fillStyle = '#ffc070';
    g.fillRect(sx - 9, ty + 8, 9, 1);
    // Head.
    g.fillStyle = '#e89030';
    g.fillRect(sx - 4, ty + 1, 6, 4);
    g.fillRect(sx - 3, ty,     4, 1);
    // Ears.
    g.fillStyle = '#7a4010';
    g.fillRect(sx - 4, ty - 1, 1, 2);
    g.fillRect(sx + 1, ty - 1, 1, 2);
    g.fillStyle = '#ffc070';
    g.fillRect(sx - 3, ty,     1, 1);
    g.fillRect(sx,     ty,     1, 1);
    // Eyes (blink occasionally).
    var blink = (t % 220 < 8);
    g.fillStyle = blink ? '#7a4010' : '#1a1a1a';
    g.fillRect(sx - 3, ty + 2, 1, 1);
    g.fillRect(sx,     ty + 2, 1, 1);
    if (!blink) {
      g.fillStyle = '#ffe890';
      g.fillRect(sx - 3, ty + 2, 1, 1);                  // catchlight tweak
      g.fillStyle = '#1a1a1a';
      g.fillRect(sx - 3, ty + 2, 1, 1);
    }
    // Nose.
    g.fillStyle = '#ff7a8a';
    g.fillRect(sx - 1, ty + 3, 1, 1);
    // Front paws.
    g.fillStyle = '#c2741a';
    g.fillRect(sx - 7, ty + 9, 2, 1);
    g.fillRect(sx - 3, ty + 9, 2, 1);
    g.fillStyle = '#ffc070';
    g.fillRect(sx - 7, ty + 9, 1, 1);
    g.fillRect(sx - 3, ty + 9, 1, 1);
  }

  // v0.85: ADVENTURE TOWER entrance painted at the end of Day 8-1.
  // v0.88: SPLIT into _Bg (back wall + door cavity, drawn behind the
  // player) and _Fg (door pillars + lintel + threshold, drawn in
  // front of the player). Mark: "transition should be a combo of
  // layer 1 and 3 so I walk in." The player walks flat into the door,
  // gets framed by the foreground pillars, touches the timepart
  // inside the cavity, and the cityArrival cutscene takes over.
  function _cyDrawTowerEntranceShared(ent, camx, camy) {
    var T = C.TILE;
    var wx0 = ent.col * T;
    var ww  = (ent.width || 16) * T;
    var sx0 = Math.round(wx0 - camx);
    if (sx0 + ww < -8 || sx0 > 328) return null;
    var groundY = 176 - camy;
    var topY    = 0 - camy;
    var doorW = 38, doorH = 56;
    var doorX = sx0 + Math.floor((ww - doorW) / 2);
    var doorY = groundY - doorH;
    return {
      sx0: sx0, ww: ww, groundY: groundY, topY: topY,
      doorW: doorW, doorH: doorH, doorX: doorX, doorY: doorY
    };
  }

  function _cyDrawTowerEntranceBg(g, camx, camy, t, ent) {
    var d = _cyDrawTowerEntranceShared(ent, camx, camy);
    if (!d) return;
    var sx0 = d.sx0, ww = d.ww, groundY = d.groundY, topY = d.topY;
    var doorW = d.doorW, doorH = d.doorH, doorX = d.doorX, doorY = d.doorY;

    // Facade body (dark teal-grey block).
    g.fillStyle = '#1a2a44';
    g.fillRect(sx0, topY, ww, groundY - topY);
    g.fillStyle = '#2a4a78';
    g.fillRect(sx0, topY, 2, groundY - topY);
    g.fillStyle = '#0c1424';
    g.fillRect(sx0 + ww - 2, topY, 2, groundY - topY);
    // Vertical pinstripes.
    g.fillStyle = '#22365a';
    for (var s = sx0 + 12; s < sx0 + ww - 12; s += 14) {
      g.fillRect(s, topY + 8, 1, groundY - topY - 12);
    }
    // Horizontal floor seams.
    g.fillStyle = '#0c1424';
    for (var fy = topY + 24; fy < groundY - 20; fy += 18) {
      g.fillRect(sx0 + 4, fy, ww - 8, 1);
    }
    // Lit windows (warm yellows + a few cyan), skipping the cavity
    // band so the doorway opening reads clean.
    var winCols = 5, winRows = 6, winW = 8, winH = 6;
    var startX = sx0 + Math.floor((ww - (winCols * winW + (winCols - 1) * 4)) / 2);
    for (var rr = 0; rr < winRows; rr++) {
      for (var cc = 0; cc < winCols; cc++) {
        var wxw = startX + cc * (winW + 4);
        var wyw = topY + 30 + rr * 14;
        if (wyw + winH > doorY - 22) continue;        // leave room for signage
        var hash = (rr * 31 + cc * 17 + ent.col) % 7;
        var col;
        if (hash < 4)      col = '#ffd070';
        else if (hash < 6) col = '#ffe9a0';
        else               col = '#7be0ff';
        g.fillStyle = '#000000';
        g.fillRect(wxw - 1, wyw - 1, winW + 2, winH + 2);
        g.fillStyle = col;
        g.fillRect(wxw, wyw, winW, winH);
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.fillRect(wxw, wyw, 1, 1);
      }
    }
    // ADVENTURE TOWER signage above the door (lit panel + text).
    var sigW = Math.min(ww - 16, 102);
    var sigH = 16;
    var sigX = sx0 + Math.floor((ww - sigW) / 2);
    var sigY = doorY - sigH - 10;
    g.fillStyle = '#0c1424';
    g.fillRect(sigX - 2, sigY - 2, sigW + 4, sigH + 4);
    g.fillStyle = '#1a3a78';
    g.fillRect(sigX, sigY, sigW, sigH);
    g.fillStyle = '#3a6cb0';
    g.fillRect(sigX, sigY, sigW, 2);
    g.fillStyle = '#0c1424';
    g.fillRect(sigX, sigY + sigH - 2, sigW, 2);
    var sg = g.createLinearGradient(sigX, sigY - 6, sigX, sigY + sigH + 6);
    sg.addColorStop(0,   'rgba(120,200,255,0)');
    sg.addColorStop(0.5, 'rgba(120,200,255,0.22)');
    sg.addColorStop(1,   'rgba(120,200,255,0)');
    g.fillStyle = sg;
    g.fillRect(sigX - 8, sigY - 6, sigW + 16, sigH + 12);
    SDD.sprites.text(g, 'ADVENTURE TOWER', sigX + sigW / 2 - 1, sigY + 5, '#ffffff', 1, 'center');

    // DOOR CAVITY (open recessed interior, no slab in the way).
    // Dark back wall.
    g.fillStyle = '#070b14';
    g.fillRect(doorX, doorY, doorW, doorH);
    // Interior wall side-shading so the cavity reads as RECESSED.
    g.fillStyle = '#11192e';
    g.fillRect(doorX, doorY, 3, doorH);
    g.fillRect(doorX + doorW - 3, doorY, 3, doorH);
    g.fillStyle = '#1a2444';
    g.fillRect(doorX, doorY, doorW, 4);              // back wall top edge
    // Tiled foyer floor inside the cavity.
    g.fillStyle = '#22365a';
    g.fillRect(doorX, doorY + doorH - 6, doorW, 6);
    g.fillStyle = '#3a5a8a';
    g.fillRect(doorX, doorY + doorH - 6, doorW, 1);
    for (var fx = doorX + 4; fx < doorX + doorW; fx += 8) {
      g.fillStyle = '#0c1424';
      g.fillRect(fx, doorY + doorH - 4, 1, 4);
    }
    // Warm lobby glow pouring out of the opening.
    var pulse = 0.65 + Math.sin(t * 0.04) * 0.10;
    var dg = g.createRadialGradient(doorX + doorW / 2, doorY + doorH - 10, 2,
                                    doorX + doorW / 2, doorY + doorH - 10, 56);
    dg.addColorStop(0,   'rgba(255,220,140,' + pulse.toFixed(2) + ')');
    dg.addColorStop(0.5, 'rgba(255,200,110,0.40)');
    dg.addColorStop(1,   'rgba(255,200,80,0)');
    g.fillStyle = dg;
    g.fillRect(doorX - 16, doorY + doorH / 2 - 18, doorW + 32, doorH);
    // A subtle inner-bottom highlight where the lobby floor reflects.
    g.fillStyle = 'rgba(255,220,140,0.45)';
    g.fillRect(doorX + 4, doorY + doorH - 7, doorW - 8, 1);

    // Apex spire on the parapet.
    var spireX = sx0 + Math.floor(ww / 2);
    g.fillStyle = '#0c1424';
    g.fillRect(spireX - 1, topY - 6, 2, 8);
    g.fillStyle = '#ff5a3a';
    g.fillRect(spireX - 1, topY - 8, 2, 2);
    if ((t >> 4) & 1) {
      g.fillStyle = '#ffe89a';
      g.fillRect(spireX, topY - 8, 1, 1);
    }
    // Crown ledge at the top.
    g.fillStyle = '#22365a';
    g.fillRect(sx0 - 2, topY - 2, ww + 4, 4);
    g.fillStyle = '#3a6cb0';
    g.fillRect(sx0 - 2, topY - 2, ww + 4, 1);
  }

  function _cyDrawTowerEntranceFg(g, camx, camy, t, ent) {
    var d = _cyDrawTowerEntranceShared(ent, camx, camy);
    if (!d) return;
    var groundY = d.groundY, doorW = d.doorW, doorH = d.doorH;
    var doorX = d.doorX, doorY = d.doorY;

    // LINTEL - thick beam above the doorway opening.
    var lintelH = 8;
    var lintelX = doorX - 8;
    var lintelW = doorW + 16;
    var lintelY = doorY - lintelH - 2;
    g.fillStyle = '#0c1424';
    g.fillRect(lintelX, lintelY, lintelW, lintelH);
    g.fillStyle = '#3a5a8a';
    g.fillRect(lintelX + 1, lintelY + 1, lintelW - 2, lintelH - 3);
    g.fillStyle = '#6a8ab0';
    g.fillRect(lintelX + 1, lintelY + 1, lintelW - 2, 1);
    g.fillStyle = '#22365a';
    g.fillRect(lintelX + 1, lintelY + lintelH - 3, lintelW - 2, 1);
    // Lintel rivets.
    g.fillStyle = '#9bb0d0';
    for (var rx = lintelX + 6; rx < lintelX + lintelW - 4; rx += 10) {
      g.fillRect(rx, lintelY + 3, 1, 1);
    }
    // Small ornament keystone at the center.
    var kx = doorX + Math.floor(doorW / 2);
    g.fillStyle = '#ffd070';
    g.fillRect(kx - 2, lintelY - 2, 4, 4);
    g.fillStyle = '#fff2b0';
    g.fillRect(kx - 1, lintelY - 2, 2, 1);

    // LEFT + RIGHT door pillars/jambs (frame the opening).
    function pillar(px) {
      var pw = 5, pyTop = lintelY, pyBot = groundY;
      g.fillStyle = '#0c1424';
      g.fillRect(px, pyTop, pw, pyBot - pyTop);
      g.fillStyle = '#3a5a8a';
      g.fillRect(px + 1, pyTop, pw - 2, pyBot - pyTop);
      // Highlight strip on the inward-facing edge.
      g.fillStyle = '#6a8ab0';
      g.fillRect(px + 1, pyTop, 1, pyBot - pyTop);
      // Dark shadow on the outward edge.
      g.fillStyle = '#22365a';
      g.fillRect(px + pw - 2, pyTop, 1, pyBot - pyTop);
      // Decorative band near the top + base.
      g.fillStyle = '#0c1424';
      g.fillRect(px, pyTop + 8, pw, 2);
      g.fillRect(px, pyBot - 12, pw, 2);
      g.fillStyle = '#9bb0d0';
      g.fillRect(px + 1, pyTop + 9, pw - 2, 1);
      g.fillRect(px + 1, pyBot - 11, pw - 2, 1);
    }
    pillar(doorX - 6);                                // left jamb
    pillar(doorX + doorW + 1);                        // right jamb

    // THRESHOLD step in front of the cavity (on top of the ground row).
    var thW = doorW + 22;
    var thX = doorX - 11;
    g.fillStyle = '#0c1424';
    g.fillRect(thX, groundY - 2, thW, 4);
    g.fillStyle = '#3a5a8a';
    g.fillRect(thX, groundY - 2, thW, 1);
    g.fillStyle = '#6a8ab0';
    g.fillRect(thX + 1, groundY - 2, thW - 2, 1);
    // Threshold gleam (warm reflection from the lobby glow).
    g.fillStyle = 'rgba(255,220,140,0.55)';
    g.fillRect(thX + 4, groundY - 2, thW - 8, 1);

    // Small overhead awning lamp on each side of the lintel.
    function lamp(lx) {
      g.fillStyle = '#0c1424';
      g.fillRect(lx, lintelY + lintelH, 3, 2);
      g.fillStyle = '#ffe89a';
      g.fillRect(lx, lintelY + lintelH + 2, 3, 2);
      g.fillStyle = '#ffffff';
      g.fillRect(lx + 1, lintelY + lintelH + 2, 1, 1);
      // Halo.
      var lh = g.createRadialGradient(lx + 1, lintelY + lintelH + 4, 1,
                                      lx + 1, lintelY + lintelH + 4, 16);
      lh.addColorStop(0, 'rgba(255,220,140,0.50)');
      lh.addColorStop(1, 'rgba(255,180,80,0)');
      g.fillStyle = lh;
      g.fillRect(lx - 14, lintelY + lintelH, 32, 22);
    }
    lamp(doorX - 14);
    lamp(doorX + doorW + 12);
  }

  // Back-compat shim: code that hasn't been split yet still calls the
  // single name; this paints both layers together (legacy fallback).
  function _cyDrawTowerEntrance(g, camx, camy, t, ent) {
    _cyDrawTowerEntranceBg(g, camx, camy, t, ent);
    _cyDrawTowerEntranceFg(g, camx, camy, t, ent);
  }

  function drawForeground_cyber(g, camx, camy, prog, t) {
    var S = SDD.sprites || {};
    var fgImg = S.cyberFg && S.cyberFg();
    var src = fgImg || _cyBuild().fg;
    // v0.57: vertical camera sync per Mark - "when I jump, the first
    // layer should be in sync with the second layer." Foreground now
    // renders in world-space (y = -camy) so silhouettes shift down on
    // screen when the camera scrolls up, matching the player + tiles.
    var span = src.width || 320, off = -(((camx * 0.70) % span) + span) % span;
    // v0.58: saturation boost on Layer 1 so the dark anchor towers +
    // vivid neon punch even harder against the darkened backdrop.
    // v0.65: cranked to match the new bridge / mid intensity.
    g.filter = 'saturate(210%) contrast(115%)';
    for (var b = off - span; b < 320 + span; b += span) {
      g.drawImage(src, b, -camy);
    }
    g.filter = 'none';
    // v0.68: editor-placed decorations from SDD.cyberDecor[key] paint
    // here on Layer 1 in world-space. Replaces the procedural street
    // furniture that v0.67 removed.
    _cyDrawDecor(g, camx, camy, t);
    // v0.69: stripped the foreground-only shader passes (warm light
    // shaft, glass curtain glint, cinematic contrast crush) that
    // weren't running in cityArrival. Mark preferred the cutscene's
    // saturated coloring and those passes were desaturating the
    // bottom of the screen via a cool-blue soft-light tint plus
    // washing the upper-left with a warm beam.
    if (_CY_DECOR) {
      _cyDrawStreetFurniture(g, camx, camy, t);
      for (var pp = 0; pp < 10; pp++) {
        var ppx = ((pp * 41 + (t * 0.7) - camx * 0.75) % 360 + 360) % 360 - 20;
        var ppy = ((pp * 27 + (t * 0.5)) % 200) - 10 - camy;
        var ppSw = Math.sin((t + pp * 30) * 0.06) * 2;
        var col = (pp % 3 === 0) ? _CYP.blossom
                : (pp % 3 === 1) ? _CYP.leafLt
                                  : _CYP.leafMid;
        g.fillStyle = col;
        g.fillRect(ppx + ppSw, ppy, 1, 1);
        if (pp % 2 === 0) g.fillRect(ppx + ppSw + 1, ppy, 1, 1);
      }
    }
  }

  // =================================================================
  // v0.70 — Adventure City tunnel + dawn district painters
  // =================================================================
  // Tunnel theme: the player enters a covered brick passage. Dark
  // background, scrolling brick wall texture at high parallax, warm
  // wall lamps casting halos. No sky visible. The level's brick
  // ceiling tiles take care of the upper boundary; this painter
  // handles the BACK wall of the tunnel that scrolls behind the
  // player.
  function drawSky_cyberTunnel(g, camx, camy, prog, t) {
    // Deep brown/black sky - feels enclosed.
    var bg = g.createLinearGradient(0, 0, 0, 180);
    bg.addColorStop(0,    '#0E0A06');
    bg.addColorStop(0.6,  '#1A1208');
    bg.addColorStop(1,    '#241608');
    g.fillStyle = bg; g.fillRect(0, 0, 320, 180);

    // Brick wall texture - scrolls fast (parallax 0.85, close to camera).
    var brickW = 24, brickH = 8;
    var brickPF = 0.85;
    var bx0 = -(((camx * brickPF) % brickW) + brickW) % brickW;
    var by0 = 0;
    for (var by = by0; by < 180; by += brickH) {
      var rowOff = ((by / brickH) | 0) % 2 ? brickW / 2 : 0;
      for (var bx = bx0 - brickW; bx < 320 + brickW; bx += brickW) {
        var x0 = bx + rowOff;
        // Brick body.
        g.fillStyle = '#3A1E10';
        g.fillRect(x0, by, brickW - 1, brickH - 1);
        g.fillStyle = '#4A2A18';
        g.fillRect(x0, by, brickW - 1, 1);
        g.fillStyle = '#1A0E08';
        g.fillRect(x0, by + brickH - 2, brickW - 1, 1);
        // Subtle highlight pixel.
        g.fillStyle = '#5A3820';
        g.fillRect(x0 + 1, by + 1, 2, 1);
      }
    }
    // Mortar lines on top (sparse light grey).
    g.fillStyle = 'rgba(60,40,30,0.55)';
    for (var my = by0; my < 180; my += brickH) {
      g.fillRect(0, my + brickH - 1, 320, 1);
    }

    // Warm wall lamps at intervals - small bracket + bright bulb + halo.
    var lampSpacing = 64;
    var lpx0 = -(((camx * brickPF) % lampSpacing) + lampSpacing) % lampSpacing;
    for (var lp = lpx0 - lampSpacing; lp < 320 + lampSpacing; lp += lampSpacing) {
      var lpY = 56 + (((lp | 0) + 100) % 40);
      // Halo.
      var halo = g.createRadialGradient(lp + 6, lpY, 2, lp + 6, lpY, 32);
      halo.addColorStop(0,   'rgba(255,180,100,0.55)');
      halo.addColorStop(0.5, 'rgba(255,140,70,0.20)');
      halo.addColorStop(1,   'rgba(255,140,70,0)');
      g.fillStyle = halo;
      g.fillRect(lp - 26, lpY - 22, 64, 44);
      // Bracket.
      g.fillStyle = '#0A0608';
      g.fillRect(lp + 4, lpY - 2, 4, 4);
      g.fillRect(lp + 5, lpY - 4, 2, 2);
      // Bulb.
      g.fillStyle = '#FFE0A0';
      g.fillRect(lp + 6, lpY - 1, 2, 2);
      g.fillStyle = '#FFFFFF';
      g.fillRect(lp + 6, lpY - 1, 1, 1);
    }

    // Subtle smoke / dust drift across the lower band so the tunnel
    // feels lived-in.
    g.fillStyle = 'rgba(120,90,60,0.10)';
    for (var dr = 0; dr < 5; dr++) {
      var drx = ((dr * 80 - camx * 0.4 + t * 0.5) % 400 + 400) % 400 - 40;
      g.fillRect(drx, 140 + dr * 4, 60, 1);
    }
  }

  // Dawn district theme: same cyber painters underneath, then a warm
  // peach/coral overlay tinted across the frame. Reads as "emerged
  // into a new district at sunrise."
  function drawSky_cyberDawn(g, camx, camy, prog, t) {
    // Layer 1: full cyber paint (sky + far + mid + bridge + shaders).
    drawSky_cyber(g, camx, camy, prog, t);
    // Layer 2: warm dawn overlay. Screen blend so the colors lift
    // instead of darkening; a vertical gradient with peach at top,
    // golden in middle, soft pink at horizon.
    g.save();
    g.globalCompositeOperation = 'screen';
    var dawn = g.createLinearGradient(0, 0, 0, 180);
    dawn.addColorStop(0,    'rgba(255,178,128,0.34)');
    dawn.addColorStop(0.4,  'rgba(255,196,120,0.28)');
    dawn.addColorStop(0.75, 'rgba(255,170,170,0.20)');
    dawn.addColorStop(1,    'rgba(255,210,170,0.10)');
    g.fillStyle = dawn;
    g.fillRect(0, 0, 320, 180);
    g.restore();
    // Pink/orange horizon glow concentrated near the bottom 2/3 to
    // simulate the rising sun band.
    g.save();
    g.globalCompositeOperation = 'screen';
    var glow = g.createLinearGradient(0, 60, 0, 150);
    glow.addColorStop(0,   'rgba(255,140,180,0)');
    glow.addColorStop(0.5, 'rgba(255,130,170,0.18)');
    glow.addColorStop(1,   'rgba(255,180,140,0)');
    g.fillStyle = glow;
    g.fillRect(0, 60, 320, 90);
    g.restore();
    // v0.74: tunnel overpass painted on dawn side too so it spans
    // the hard background swap that lands at the overpass midpoint.
    _cyDrawTunnelOverlay(g, camx, camy, t);
  }

  // =================================================================
  // TUNNEL OVERPASS (v0.74) - Mark wanted a hard-transition tunnel:
  // a Layer-3 architectural element that the player walks through
  // while the cyber background remains visible behind it. The
  // background then HARD-SWITCHES to cyber-dawn at the overpass
  // midpoint (level themeZones flag `hard: true`), so when the
  // player exits the other side everything is already dawn.
  //
  // Drawn in world space (parallax 1.0). Hooked from both
  // drawSky_cyber + drawSky_cyberDawn AFTER the shader pass so the
  // beam paints over the bridge cache + sun haze but still under
  // the world tiles + entities + foreground.
  // =================================================================
  function _cyDrawTunnelOverlay(g, camx, camy, t) {
    // v0.85: EXTENDED multi-deck overpass. World cols 250-440 =
    // x 4000-7040 (190 cols wide). The painted layer draws:
    //   - a heavy interior darkening that makes the tunnel feel
    //     enclosed (sky/city behind goes dim, structural detail pops)
    //   - the underside skirt of the upper deck (world y 112-128)
    //   - pillars dropping from the deck to the street every 64 px
    //   - portal walls at the entrance + exit
    //   - hanging lamps + ceiling girders + signs
    // The walkable deck surface itself is the row 6 '=' tiles in
    // the level data, so gaps in the deck stay visually consistent.
    var X0 = 4000, X1 = 7040;
    var sx0 = X0 - camx;
    var sx1 = X1 - camx;
    if (sx1 < -8 || sx0 > 328) return;

    // INTERIOR FILL. v0.88: SOLID dark fill (was a multiply pass that
    // left the bright city showing through, per Mark "the tunnel
    // background is transparent, let's make it solid color"). Opaque
    // gradient covers the whole tunnel range so far/mid/bridge sky
    // layers behind are completely hidden, and the structural detail
    // (pillars, deck skirt, lamps) reads as a sealed concrete interior.
    var darkLo = Math.max(0, sx0);
    var darkHi = Math.min(320, sx1);
    if (darkLo < darkHi) {
      var solid = g.createLinearGradient(0, 0, 0, 180);
      solid.addColorStop(0,    '#0a1018');
      solid.addColorStop(0.45, '#0e1c30');
      solid.addColorStop(1,    '#070b12');
      g.fillStyle = solid;
      g.fillRect(darkLo, 0, darkHi - darkLo, 180);
    }

    // Underside skirt of the deck (visible from street level).
    var skirtY = 112 - camy;
    var skirtH = 16;
    // Top-of-deck railing strip (thin, hugs the deck top).
    var railY = 94 - camy;
    var railH = 2;
    // Pillar span from skirt to street.
    var streetY = 176 - camy;

    var lo = Math.max(-2, sx0);
    var hi = Math.min(322, sx1);
    if (lo < hi) {
      // Underside skirt body.
      g.fillStyle = '#3D3F4A';
      g.fillRect(lo, skirtY, hi - lo, skirtH);
      // Top sunlit edge.
      g.fillStyle = '#7A7E8E';
      g.fillRect(lo, skirtY, hi - lo, 1);
      g.fillStyle = '#5E6173';
      g.fillRect(lo, skirtY + 1, hi - lo, 1);
      // Bottom drip lines.
      g.fillStyle = '#22232C';
      g.fillRect(lo, skirtY + skirtH - 2, hi - lo, 1);
      g.fillStyle = '#0E0C14';
      g.fillRect(lo, skirtY + skirtH - 1, hi - lo, 1);
      // Horizontal panel seam mid-skirt.
      g.fillStyle = '#2A2A33';
      g.fillRect(lo, skirtY + 7, hi - lo, 1);
      // Rivet beads spaced every 16 world-px.
      g.fillStyle = '#7A7E8E';
      for (var rv = Math.ceil((camx + lo) / 16) * 16 - camx; rv < hi; rv += 16) {
        if (rv >= lo - 2 && rv <= hi + 2) {
          g.fillRect(rv, skirtY + 4, 1, 1);
          g.fillRect(rv, skirtY + 10, 1, 1);
        }
      }
      // Top-deck low railing (thin dark strip just above the deck
      // line so the deck reads as edged).
      g.fillStyle = '#1A1B22';
      g.fillRect(lo, railY, hi - lo, railH);
      g.fillStyle = '#3D3F4A';
      g.fillRect(lo, railY + 1, hi - lo, 1);
    }

    // PILLARS every 64 world-px, dropping from skirt bottom to street.
    var pillarSpacing = 64;
    var colW = 8;
    for (var pwx = X0 + 16; pwx < X1; pwx += pillarSpacing) {
      var psx = pwx - camx;
      if (psx < -12 || psx > 332) continue;
      var pcolY = skirtY + skirtH;
      var pcolH = streetY - pcolY;
      // Pillar body.
      g.fillStyle = '#22232C';
      g.fillRect(psx, pcolY, colW, pcolH);
      // Right edge highlight.
      g.fillStyle = '#3D3F4A';
      g.fillRect(psx + colW - 1, pcolY, 1, pcolH);
      // Left edge sunlit.
      g.fillStyle = '#5E6173';
      g.fillRect(psx, pcolY, 1, pcolH);
      // Capital flare at the top.
      g.fillStyle = '#22232C';
      g.fillRect(psx - 2, pcolY, colW + 4, 3);
      g.fillStyle = '#3D3F4A';
      g.fillRect(psx - 2, pcolY, colW + 4, 1);
      // Base flare at the bottom.
      g.fillStyle = '#22232C';
      g.fillRect(psx - 2, pcolY + pcolH - 3, colW + 4, 3);
    }

    // PORTAL WALL pieces at the entrance + exit (full-height frames
    // so the tunnel reads as a "room").
    function portalWall(cx) {
      if (cx < -16 || cx > 336) return;
      var pwTop = 0 - camy;
      var pwBot = streetY;
      // Wall body.
      g.fillStyle = '#22232C';
      g.fillRect(cx - 6, pwTop, 12, pwBot - pwTop);
      // Lit edge facing into the tunnel.
      g.fillStyle = '#3D3F4A';
      g.fillRect(cx, pwTop, 1, pwBot - pwTop);
      g.fillStyle = '#5E6173';
      g.fillRect(cx - 6, pwTop, 1, pwBot - pwTop);
      // Mid panel seam.
      g.fillStyle = '#0E0C14';
      g.fillRect(cx - 6, pwTop + 40, 12, 1);
      g.fillRect(cx - 6, pwTop + 100, 12, 1);
    }
    portalWall(sx0);
    portalWall(sx1);

    // Warm wall lamps mounted on the deck underside, every 64 px.
    var lampSpacing = 64;
    for (var lwx = X0 + 32; lwx < X1; lwx += lampSpacing) {
      var lsx = lwx - camx;
      if (lsx < -10 || lsx > 330) continue;
      var lsy = skirtY + skirtH - 3;
      var halo = g.createRadialGradient(lsx, lsy + 6, 2, lsx, lsy + 6, 32);
      halo.addColorStop(0,   'rgba(255,200,120,0.60)');
      halo.addColorStop(0.5, 'rgba(255,160,80,0.22)');
      halo.addColorStop(1,   'rgba(255,160,80,0)');
      g.fillStyle = halo;
      g.fillRect(lsx - 24, lsy - 4, 48, 40);
      g.fillStyle = '#0A0608';
      g.fillRect(lsx - 1, lsy, 3, 4);
      g.fillStyle = '#FFE0A0';
      g.fillRect(lsx - 1, lsy + 2, 2, 2);
      g.fillStyle = '#FFFFFF';
      g.fillRect(lsx,     lsy + 2, 1, 1);
    }

    // Periodic directional signs hung from the underside (every
    // 128 world-px).
    var signSpacing = 128;
    for (var swx = X0 + 80; swx < X1 - 30; swx += signSpacing) {
      var ssx = swx - camx;
      if (ssx < -30 || ssx > 340) continue;
      var ssy = skirtY + skirtH + 2;
      g.fillStyle = '#1A1E2A';
      g.fillRect(ssx, ssy, 22, 8);
      g.fillStyle = '#3A8060';
      g.fillRect(ssx + 1, ssy + 1, 20, 6);
      g.fillStyle = '#5AAA80';
      g.fillRect(ssx + 1, ssy + 1, 20, 1);
      g.fillStyle = '#E8E8E8';
      g.fillRect(ssx + 3, ssy + 3, 3, 1);
      g.fillRect(ssx + 3, ssy + 5, 3, 1);
      g.fillRect(ssx + 8, ssy + 3, 2, 3);
      g.fillRect(ssx + 13, ssy + 3, 4, 1);
      g.fillRect(ssx + 13, ssy + 5, 4, 1);
      g.fillStyle = '#22232C';
      g.fillRect(ssx + 2,  ssy - 2, 1, 2);
      g.fillRect(ssx + 19, ssy - 2, 1, 2);
    }

    // Ceiling girders (cross beams above the deck) every 96 world-px
    // - thin shadow trusses high up so the tunnel has depth above
    // the player. Visible at world y 30-44.
    var girderSpacing = 96;
    for (var gwx = X0 + 48; gwx < X1; gwx += girderSpacing) {
      var gsx = gwx - camx;
      if (gsx < -16 || gsx > 336) continue;
      var gy = 30 - camy;
      g.fillStyle = '#1A1B22';
      g.fillRect(gsx - 14, gy, 28, 3);
      g.fillStyle = '#3D3F4A';
      g.fillRect(gsx - 14, gy, 28, 1);
      g.fillStyle = '#0E0C14';
      g.fillRect(gsx - 14, gy + 3, 28, 1);
      // Hanging chain to a small ceiling lamp.
      g.fillStyle = '#22232C';
      g.fillRect(gsx, gy + 4, 1, 5);
      g.fillStyle = '#FFE0A0';
      g.fillRect(gsx - 1, gy + 9, 3, 2);
      g.fillStyle = '#FFFFFF';
      g.fillRect(gsx, gy + 9, 1, 1);
      // Halo on the ceiling lamp.
      var ch = g.createRadialGradient(gsx, gy + 10, 1, gsx, gy + 10, 18);
      ch.addColorStop(0, 'rgba(255,200,120,0.45)');
      ch.addColorStop(1, 'rgba(255,160,80,0)');
      g.fillStyle = ch;
      g.fillRect(gsx - 16, gy + 4, 32, 20);
    }
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
    'cyber': drawSky_cyber,
    // v0.70: tunnel + dawn district for Adventure City. Mark's
    // request: "tunnel and change of background when coming out."
    'cyber-tunnel': drawSky_cyberTunnel,
    'cyber-dawn':   drawSky_cyberDawn,
    // v0.74: same-sky-no-foreground aliases. The level uses these
    // for the tunnel-pass cols 150-200 so the cyber / cyber-dawn
    // background still paints but the Layer-1 foreground anchors +
    // kiosk are suppressed inside the tunnel range.
    'cyber-tunnel-pass':       drawSky_cyber,
    'cyber-dawn-tunnel-pass':  drawSky_cyberDawn
  };

  // Per-theme foreground layer (drawn AFTER entities, BEFORE HUD). Only
  // themes that need an overlapping layer for parallax depth register
  // here; missing entries are no-ops. Mirror of THEMES dispatch.
  var FOREGROUNDS = {
    'cyber':       drawForeground_cyber
    // v0.87: cyber-dawn DROPPED from the foreground dispatch (Mark:
    // "remove first layer pieces after the tunnel"). The dawn city
    // after the tunnel now reads as open / clear with just the
    // parallax sky behind, no Layer-1 anchor silhouettes overlapping
    // the player. The cityArrival cutscene draws its own backdrop
    // directly so it isn't affected.
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
      // v0.76: optional persistent directional signpost near the
      // stage start (Adventure City). { col, label } in world tiles.
      this.startSign = L.startSign || null;
      // v0.85: Adventure City tower entrance painter target.
      this.towerEntrance = L.towerEntrance || null;
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
      // v0.91: per-tile crumble state for 'C' tiles. Keyed by 'tx,ty'.
      this.crumblers = {};
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
        } else if (s.type === 'car' || s.type === 'dumptruck') {
          // v0.91: cars / dump trucks are persistent PATROL mobs (Mark
          // switched the design - no more spawn waves). Each one
          // exists at level load and bounces left/right on a fixed
          // range around its placement.
          e = new SDD.ent.Car(s.tx * T, s.ty * T, {
            dir: s.dir || -1,
            spd: s.spd,
            color: s.color,
            kind: s.type === 'dumptruck' ? 'dump' : (s.kind || 'car'),
            patrol: true,
            range: (s.range != null) ? s.range : 96,
            warnT: 0
          });
          this.enemies.push(e);
        } else if (s.type === 'carspawner') {
          // v0.91: legacy carspawner data now creates ONE patrol car
          // at the marker (was a periodic emitter). Lets Mark's saved
          // editor layouts keep working with the new persistent-mob
          // design without re-editing.
          e = new SDD.ent.Car(s.tx * T, s.ty * T, {
            dir: s.dir || -1,
            spd: s.spd,
            color: s.color,
            patrol: true,
            range: (s.range != null) ? s.range : 96,
            warnT: 0
          });
          this.enemies.push(e);
        } else if (s.type === 'hydrant') {
          // Adventure City fire hydrant - hazard spawner that fires
          // an upward water column on a period (LavaPlume-style).
          e = new SDD.ent.HazardSpawner(
            s.tx * T + 8, s.ty * T + 8,
            'hydrantJet', s.period || 130, 1, s.scale || 1);
          e.tx = s.tx; e.ty = s.ty;
          this.enemies.push(e);
        } else if (s.type === 'drone') {
          // Adventure City sky drone - reuses Wisp with variant='drone'
          // so the float / patrol / stomp logic is identical to birds.
          e = new SDD.ent.Wisp(s.tx * T + 8, s.ty * T + 4);
          e.variant = 'drone';
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
      // Adventure City (Day 8): the Computer doesn't just appear - he
      // WARPS into the stage in a burst of light + energy before
      // control hands over (continues the opening cinematic's "I have
      // to cross the city" beat). 16-frame comp_warp anim. Skipped on a
      // checkpoint respawn so deaths don't replay the entrance.
      this.warpT = 0;
      if (this.day === 8 && !this.lastCheckpoint) {
        this.state = 'warpin';
        this.warpTotal = 16 * 5;                       // 16 frames x 5 steps
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
      // v0.91: crumbling road tiles. When the player is grounded on a
      // 'C' tile, advance that tile's crumble timer. Once it passes
      // 50 frames the tile becomes empty (and the player falls
      // through). The timer also advances slowly for tiles already
      // crumbling (so a quick step still sets them on the path to
      // collapse - touch + run isn't a safe dodge).
      var pl = this.player;
      if (pl && pl.onGround && !pl.dead) {
        var feetTy = Math.floor((pl.y + pl.h) / C.TILE);
        var leftTx  = Math.floor(pl.x / C.TILE);
        var rightTx = Math.floor((pl.x + pl.w - 1) / C.TILE);
        for (var ftx = leftTx; ftx <= rightTx; ftx++) {
          if (this.map.get(ftx, feetTy) === 'C') {
            var key = ftx + ',' + feetTy;
            var st = this.crumblers[key] || (this.crumblers[key] = { tx: ftx, ty: feetTy, t: 0 });
            st.t++;
            // v0.93 (Mark): crumble 50% faster - thresholds /1.5
            // (warning 28->19, collapse 50->33). ~0.55s grace.
            if (st.t === 19 && SDD.audio && SDD.audio.sfx) SDD.audio.sfx('block');
            if (st.t >= 33) {
              this.map.set(ftx, feetTy, ' ');
              delete this.crumblers[key];
              this.burst(ftx * C.TILE + 8, feetTy * C.TILE + 12, '#7a6a5a', 8);
              if (SDD.audio && SDD.audio.sfx) SDD.audio.sfx('bump');
            }
          }
        }
      }
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
                   pr instanceof SDD.ent.LavaPlume ||
                   pr instanceof SDD.ent.HydrantJet) {
          var isLava = pr instanceof SDD.ent.LavaPlume;
          var isJet  = pr instanceof SDD.ent.HydrantJet;
          var isFlareLike = pr instanceof SDD.ent.SolarFlare || pr instanceof SDD.ent.Meteor;
          if (pl.signatureKind === 'flamedash' && isLava) continue;
          if (pl.signatureKind === 'sunshield' && isFlareLike) continue;
          if (!pl.dead && !pl.win && pl.invuln <= 0 && E.overlap(pl, pr)) {
            // Persistent columns (lava plume + hydrant jet) don't pop
            // on contact - they're constant hazards while erupting.
            if (!isLava && !isJet) pr.remove = true;
            if (pl.hurt()) this.burst(pl.x + pl.w / 2, pl.y + pl.h / 2, '#ff8a6a', 6);
          }
        }
      }
    },

    update: function () {
      if (this.state === 'paused') { this.updatePaused(); return; }
      // Adventure City warp-in: hold control while the Computer
      // materialises. World is frozen (no stepWorld) so enemies + the
      // clock don't start until the burst finishes. Skippable with A.
      if (this.state === 'warpin') {
        this.warpT++;
        // v0.89: dedicated teleport-in sound (Mark: "give the
        // teleport in a noise for computer"). Layered shimmer +
        // electric crackle + settling hum across ~0.9s.
        if (this.warpT === 1) A.sfx('warpin');
        if (In.confirm() && this.warpT > 8) this.warpT = this.warpTotal;
        if (this.warpT >= this.warpTotal) this.state = 'play';
        return;
      }
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
        // v0.74: skip the crossfade entirely when the next zone has
        // a `hard: true` flag (Mark's "hard transition" tunnel
        // request - the swap should snap, not fade).
        if (nextZone && !nextZone.hard) {
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
          else if (code === 'C') {
            // v0.91: Crumbling road tile (Adventure City). Painted
            // directly here so the cracks + shake increase as the
            // player stands on it. Stored crumble state lives on the
            // level scene in this.crumblers.
            var crum = this.crumblers && this.crumblers[tx + ',' + ty];
            var ratio = crum ? Math.min(1, crum.t / 33) : 0;
            var jit = ratio > 0.4 ? Math.round((Math.random() - 0.5) * 2 * ratio) : 0;
            var dx0 = tx * T - cam.x + jit;
            var dy0 = ty * T - cam.y;
            // Asphalt base.
            g.fillStyle = '#2a2e36';
            g.fillRect(dx0, dy0, T, T);
            // Top lit edge.
            g.fillStyle = '#4a4f5a';
            g.fillRect(dx0, dy0, T, 2);
            // Yellow lane mark (so it reads as road).
            g.fillStyle = '#ffd23a';
            g.fillRect(dx0 + 4, dy0 + 7, 8, 1);
            // Crack pattern (deepens with ratio).
            g.fillStyle = '#06080e';
            g.fillRect(dx0 + 3, dy0 + 4, 1, 8);
            g.fillRect(dx0 + 4, dy0 + 5, 1, 2);
            g.fillRect(dx0 + 9, dy0 + 3, 1, 9);
            g.fillRect(dx0 + 10, dy0 + 8, 1, 3);
            g.fillRect(dx0 + 6, dy0 + 11, 4, 1);
            if (ratio > 0.4) {
              g.fillStyle = 'rgba(255,140,40,0.50)';
              g.fillRect(dx0 + 2, dy0 + 6, T - 4, 1);
              g.fillRect(dx0 + 6, dy0 + 2, 1, T - 4);
            }
            if (ratio > 0.7) {
              // Bits of debris falling.
              g.fillStyle = '#3a3a3a';
              g.fillRect(dx0 + 2, dy0 + T - 2, 2, 1);
              g.fillStyle = '#1a1a1a';
              g.fillRect(dx0 + T - 3, dy0 + T - 2, 2, 1);
            }
            continue;        // fully drawn - skip the generic sprite path
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
      // v0.76: persistent in-world directional signpost near the start
      // of Adventure City (Mark: "arrow pointing right... get to
      // Adventure Tower"). Drawn at world col 8, on the sidewalk, so
      // it scrolls away as the player advances. Bobbing arrow + label.
      if (this.startSign) {
        _cyDrawStartSign(g, cam.x, cam.y, this.timeSteps, this.startSign);
      }
      // v0.91: little tabby cat sprite hanging out at the level start
      // (Adventure City only). Cosmetic only.
      if (this.theme === 'cyber') {
        _cyDrawCityCat(g, cam.x, cam.y, this.timeSteps);
      }
      // v0.88: tower entrance BACKGROUND pass (facade + door cavity
      // + warm lobby glow) paints BEFORE entities so the player draws
      // IN FRONT of it as they walk into the door. The FG pillars +
      // lintel paint later, after the foreground silhouette layer.
      if (this.towerEntrance) {
        _cyDrawTowerEntranceBg(g, cam.x, cam.y, this.timeSteps, this.towerEntrance);
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
      if (this.state === 'warpin') {
        // Computer materialising: bright energy pool behind the
        // 16-frame burst-in sprite, fading as he solidifies.
        var wp = this.player, wn = 16, wf = Math.min(wn - 1, Math.floor(this.warpT / 5));
        var wcx = Math.round(wp.x + wp.w / 2 - cam.x);
        var wbase = Math.round(wp.y + wp.h - cam.y);
        var glowA = 0.55 * (1 - wf / wn);
        var wg = g.createRadialGradient(wcx, wbase - 18, 2, wcx, wbase - 16, 34);
        wg.addColorStop(0, 'rgba(170,238,255,' + glowA.toFixed(2) + ')');
        wg.addColorStop(0.5, 'rgba(110,180,255,' + (glowA * 0.6).toFixed(2) + ')');
        wg.addColorStop(1, 'rgba(110,180,255,0)');
        g.fillStyle = wg; g.fillRect(wcx - 36, wbase - 52, 72, 64);
        if (SDD.sprites.pixDraw) {
          // v0.85: warp-in sprite scaled 1.25x to match the prologue
          // Computer (Mark: same as the cinematic, increase 25%).
          g.save();
          g.translate(wcx, wbase);
          g.scale(1.25, 1.25);
          g.translate(-wcx, -wbase);
          SDD.sprites.pixDraw(g, 'big', 'comp_warp', 'south', wf, wcx, wbase);
          g.restore();
        }
      } else {
        this.player.draw(g, cam);
      }
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
      // v0.70: themeZone-aware. The active zone's theme overrides the
      // level's primary theme for the foreground lookup, so a tunnel
      // section can suppress the foreground (no city silhouettes
      // inside the brick walls) and the dawn district can use a
      // different foreground painter.
      var fgTheme = this.theme;
      if (this.themeZones && this.themeZones.length) {
        var fgCamCol = Math.floor(cam.x / C.TILE);
        for (var fzi = 0; fzi < this.themeZones.length; fzi++) {
          if (fgCamCol + 10 >= this.themeZones[fzi].startCol) fgTheme = this.themeZones[fzi].theme;
        }
      }
      var fgFn = FOREGROUNDS[fgTheme];
      if (fgFn) fgFn(g, cam.x, cam.y, prog, this.timeSteps);

      // v0.88: tower entrance FOREGROUND pass (door pillars, lintel,
      // threshold) draws AFTER the foreground silhouettes so it sits
      // in front of the player as they walk into the door. The BG
      // pass (facade body + door cavity + warm lobby glow) is drawn
      // earlier - see the sky/tile pass above.
      if (this.towerEntrance) {
        _cyDrawTowerEntranceFg(g, cam.x, cam.y, this.timeSteps, this.towerEntrance);
      }

      this.drawHUD(g);
      this.drawSignatureHint(g);

      if (this.state === 'won') {
        // v0.85: Adventure City fades to black so the tower-entrance
        // walk-through reads as "we go inside, cut to cutscene". The
        // other levels keep the celebratory COMPLETE banner.
        if (this.day === 8) {
          var fa = Math.min(1, this.winTimer / 110);
          g.fillStyle = 'rgba(0,0,0,' + fa.toFixed(2) + ')';
          g.fillRect(0, 0, 320, 180);
        } else {
          var sf = SDD.save.stagesForDay(this.day);
          var msg = sf > 1 ? ('DAY ' + this.day + '-' + this.stage + ' COMPLETE!') : ('DAY ' + this.day + ' COMPLETE!');
          this.drawBanner(g, msg, '#ffd23a');
        }
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
      // Day 8 (Adventure City secret stage) sits outside the linear
      // 7-days arc so the "DAY 8" tag would be misleading. Hide the
      // day label; the stage subtitle ("ADVENTURE CITY") still
      // renders on the next row and carries the location identity.
      if (this.day !== 8) {
        var dlabel = 'DAY ' + this.day + (sv.stagesForDay(this.day) > 1 ? '-' + this.stage : '');
        text(g, dlabel, 160, 4, '#ffd23a', 1, 'center');
      }
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
  // CITY ARRIVAL - Adventure City end cinematic (v0.77 rewrite).
  // The Computer briefs the rescue heroes at HQ: Super Dude Danny is
  // lost in time and they have to bring him back. The lead hero steps
  // up and accepts the mission ("WE'VE GOT THIS"). Ends → title.
  // Built with the placeholder rescue NPCs + computer sprite; real
  // hero art slots in via the same npc_* sprite keys when Mark
  // provides it.
  // beat.speaker: 'computer' lights the wall screen + ticks;
  //               'leader' spotlights the centre hero stepping fwd.
  // =====================================================================
  var CITY_BEATS = [
    { lines: ['MEANWHILE - AT RESCUE HQ...'],            speaker: null },
    { lines: ['SUPER DUDE DANNY IS', 'LOST IN TIME!'],   speaker: 'computer' },
    { lines: ['HEROES - WE HAVE TO', 'BRING HIM HOME.'], speaker: 'computer' },
    { lines: ["WE'VE GOT THIS.", "LET'S GO GET HIM!"],   speaker: 'leader' },
    { lines: ['THE RESCUE BEGINS...', 'TO BE CONTINUED!'], speaker: null }
  ];

  // v0.82: Adventure Rescue Team line-up (Mark's 5 named heroes), in
  // order 1-5, standing on the RIGHT side waiting while the Computer
  // (the player character) explains from the LEFT. anim = the pixDraw
  // 'rescue' animation key. x = world centre on the floor.
  var RESCUE_LINEUP = [
    { id: 'victoria', anim: 'victoria', x: 160 },
    { id: 'nayah',    anim: 'nayah',    x: 188 },
    { id: 'kevin',    anim: 'kevin',    x: 216, lead: true },
    { id: 'carlos',   anim: 'carlos',   x: 244 },
    { id: 'josh',     anim: 'josh',     x: 272 }
  ];

  // Ending dialogue: the Computer (player) ran into the Tower and is
  // now briefing the rescue team. who 'computer' = the player on the
  // left; the rest are the heroes on the right. Each gets a line that
  // moves the conversation forward. Kevin is the team lead.
  var CITY_DIALOG = [
    { who: 'computer', name: 'COMPUTER', text: "MADE IT! OKAY, TEAM - BIG PROBLEM. SUPER DUDE DANNY IS LOST IN TIME." },
    { who: 'computer', name: 'COMPUTER', text: "I'D GO MYSELF, BUT I HAVE THE UPPER-BODY STRENGTH OF A DESK LAMP." },
    { who: 'victoria', name: 'VICTORIA', text: "LOST IN TIME? PFFT. WE'VE PULLED PEOPLE OUT OF WORSE. PROBABLY." },
    { who: 'nayah',    name: 'NAYAH',    text: "IF HE'S OUT THERE, WE'LL FIND HIM - PAST, FUTURE, OR FRIDAY." },
    { who: 'kevin',    name: 'KEVIN',    text: "ALRIGHT, TEAM. GEAR UP. WE BRING OUR HERO HOME - TOGETHER." },
    { who: 'carlos',   name: 'CARLOS',   text: "TIME TRAVEL?! THAT'S THE COOLEST MISSION EVER - LET'S GOOO!" },
    { who: 'josh',     name: 'JOSH',     text: "EASY, CARLOS. DEEP BREATHS. ...OKAY, I'M PRETTY HYPED TOO." },
    { who: 'computer', name: 'COMPUTER', text: "THEN IT'S SETTLED. HANG ON, DANNY - ADVENTURE AWAITS!" },
    { who: null,       name: null,       text: 'THE RESCUE BEGINS... TO BE CONTINUED!' }
  ];

  // Per-speaker accent + portrait source. Heroes use the pixDraw
  // 'rescue' frames; the Computer uses the expressive comp2 'talk'.
  var DIALOG_ACTOR = {
    computer: { accent: '#5af0ff', psize: 'comp2',  panim: 'talk',     pdir: 'south' },
    victoria: { accent: '#ff7ac0', psize: 'rescue', panim: 'victoria', pdir: 'south' },
    nayah:    { accent: '#c89bf0', psize: 'rescue', panim: 'nayah',    pdir: 'south' },
    kevin:    { accent: '#ffd23a', psize: 'rescue', panim: 'kevin',    pdir: 'south' },
    carlos:   { accent: '#5ae89a', psize: 'rescue', panim: 'carlos',   pdir: 'south' },
    josh:     { accent: '#ff8a40', psize: 'rescue', panim: 'josh',     pdir: 'south' }
  };

  // Square close-up portrait from a pixelLab frame (crops the head +
  // shoulders region of the character's bbox + cover-fits the square).
  function _cyDrawPixPortrait(g, size, anim, dir, frameIdx, x, y, sz, accent) {
    // Frame.
    g.fillStyle = '#0a0e18'; g.fillRect(x - 2, y - 2, sz + 4, sz + 4);
    g.fillStyle = accent;
    g.fillRect(x - 2, y - 2, sz + 4, 2); g.fillRect(x - 2, y + sz, sz + 4, 2);
    g.fillRect(x - 2, y - 2, 2, sz + 4); g.fillRect(x + sz, y - 2, 2, sz + 4);
    var bg = g.createLinearGradient(0, y, 0, y + sz);
    bg.addColorStop(0, '#1a2438'); bg.addColorStop(1, '#0e1422');
    g.fillStyle = bg; g.fillRect(x, y, sz, sz);
    var SP = SDD.sprites;
    var img = SP.pixFrame && SP.pixFrame(size, anim, dir, frameIdx || 0);
    var bb  = SP.pixBBox && SP.pixBBox(size, anim, dir);
    if (!img || !bb || !img.complete || !img.naturalWidth) return;
    // Head crop = top ~56% of the bbox, slightly inset from the top.
    var srcX = bb.x, srcY = bb.y, srcW = bb.w, srcH = Math.round(bb.h * 0.56);
    var scale = Math.max(sz / srcW, sz / srcH);   // cover-fit
    var dw = Math.round(srcW * scale), dh = Math.round(srcH * scale);
    var dx = x + Math.round((sz - dw) / 2), dy = y + 1;   // top-align the face
    g.save();
    g.beginPath(); g.rect(x, y, sz, sz); g.clip();
    g.imageSmoothingEnabled = false;
    g.drawImage(img, srcX, srcY, srcW, srcH, dx, dy, dw, dh);
    g.restore();
  }

  // Word-wrap a string into lines of at most `maxChars` characters.
  function _cyWrap(str, maxChars) {
    var words = str.split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? (cur + ' ' + words[i]) : words[i];
      if (test.length > maxChars && cur) { lines.push(cur); cur = words[i]; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // "A W" crest - the letters A (left) and W (right) side by side
  // inside a circle. Mark: "AW like the letters next to each other,
  // left then right, in a circle."
  function _cyDrawAWEmblem(g, cx, cy, r, t, lit) {
    var gold  = lit ? '#ffe27a' : '#e8b24a';
    var goldD = '#8a5e18';
    // Soft glow behind.
    var glow = g.createRadialGradient(cx, cy, 2, cx, cy, r + 8);
    glow.addColorStop(0, lit ? 'rgba(255,220,120,0.30)' : 'rgba(255,210,90,0.16)');
    glow.addColorStop(1, 'rgba(255,210,90,0)');
    g.fillStyle = glow; g.fillRect(cx - r - 8, cy - r - 8, (r + 8) * 2, (r + 8) * 2);
    // Full ring.
    g.strokeStyle = goldD; g.lineWidth = 3.2;
    g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.stroke();
    g.strokeStyle = gold;  g.lineWidth = 2.0;
    g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.stroke();

    // v0.83: bolder, italic "hero font" letters. Forward slant +
    // beveled double-stroke (dark under-stroke, bright over-stroke)
    // so the A + W read like a comic-book team crest.
    g.lineCap = 'round'; g.lineJoin = 'miter'; g.miterLimit = 3;
    var hh = r * 0.52;          // half letter height
    var hw = r * 0.27;          // half letter width
    var slant = r * 0.16;       // top vertices lean right (italic)
    var ax = cx - r * 0.42;     // letter A centre x (left)
    var wx = cx + r * 0.42;     // letter W centre x (right)
    var topY = cy - hh, botY = cy + hh;

    // Draw the A + W strokes through a shared path builder so we can
    // stroke twice (dark bevel under, bright on top).
    function letterPaths() {
      // A: feet at the bottom, apex slanted right at the top.
      g.beginPath();
      g.moveTo(ax - hw,         botY);
      g.lineTo(ax + slant,      topY);
      g.lineTo(ax + hw,         botY);
      // A crossbar.
      g.moveTo(ax - hw * 0.52 + slant * 0.5, cy + hh * 0.28);
      g.lineTo(ax + hw * 0.52 + slant * 0.5, cy + hh * 0.28);
      // W: down, up, down, up - top vertices slanted right.
      g.moveTo(wx - hw + slant,        topY);
      g.lineTo(wx - hw * 0.5,          botY);
      g.lineTo(wx + slant * 0.5,       cy - hh * 0.18);
      g.lineTo(wx + hw * 0.5,          botY);
      g.lineTo(wx + hw + slant,        topY);
    }
    // Dark bevel under-stroke.
    g.strokeStyle = goldD; g.lineWidth = 4.2; letterPaths(); g.stroke();
    // Bright top stroke.
    g.strokeStyle = lit ? '#fff0b0' : gold; g.lineWidth = 2.2; letterPaths(); g.stroke();
    // Tiny spark accents at the apexes for extra "hero" pop.
    g.fillStyle = lit ? '#ffffff' : '#fff0c0';
    g.fillRect(Math.round(ax + slant) - 1, Math.round(topY) - 1, 2, 2);
    g.fillRect(Math.round(wx + hw + slant) - 1, Math.round(topY) - 1, 2, 2);
    g.lineCap = 'butt'; g.lineJoin = 'miter'; g.lineWidth = 1;
  }

  // HQ briefing-room backdrop: dark control room wall with the AW
  // emblem crest centred high, flanked by small status monitors, a
  // console bank, and a floor. `pulse` brightens the crest + monitors
  // while the Computer is talking.
  function _cyDrawRescueHQ(g, t, pulse) {
    // Room gradient.
    var room = g.createLinearGradient(0, 0, 0, 180);
    room.addColorStop(0,   '#101626');
    room.addColorStop(0.6, '#161e34');
    room.addColorStop(1,   '#0c1120');
    g.fillStyle = room; g.fillRect(0, 0, 320, 180);
    // Back-wall panel seams.
    g.fillStyle = 'rgba(90,120,170,0.10)';
    for (var px = 0; px < 320; px += 32) g.fillRect(px, 0, 1, 150);
    for (var py = 0; py < 150; py += 24) g.fillRect(0, py, 320, 1);

    // AW EMBLEM crest, centred high on the wall.
    _cyDrawAWEmblem(g, 160, 38, 22, t, pulse);

    // Small status monitors flanking the crest (flavour). Pulse cyan
    // when the Computer talks.
    function miniMon(mx, my) {
      g.fillStyle = '#050a14'; g.fillRect(mx - 1, my - 1, 26, 18);
      g.fillStyle = pulse ? '#5af0ff' : '#2a6a80'; g.fillRect(mx - 1, my - 1, 26, 1);
      g.fillStyle = pulse ? '#0e2a38' : '#0a1622'; g.fillRect(mx, my, 24, 16);
      g.fillStyle = pulse ? 'rgba(90,240,255,0.16)' : 'rgba(90,240,255,0.06)';
      for (var ln = my + 1; ln < my + 16; ln += 3) g.fillRect(mx, ln, 24, 1);
      // a couple of moving data blips
      g.fillStyle = pulse ? '#5af0ff' : '#1e4a5a';
      g.fillRect(mx + 2 + ((t / 6 | 0) % 18), my + 4, 2, 2);
      g.fillRect(mx + 2 + ((t / 9 | 0) % 18), my + 10, 2, 1);
    }
    miniMon(28, 26); miniMon(266, 26);

    // Console bank low on the wall, behind the heroes' feet.
    g.fillStyle = '#0e1422'; g.fillRect(0, 168, 320, 12);
    g.fillStyle = '#1a2438'; g.fillRect(0, 168, 320, 1);
    for (var cl = 8; cl < 320; cl += 22) {
      var on = ((t / 12 | 0) + cl) % 3 === 0;
      g.fillStyle = on ? '#3aff60' : '#15351f';
      g.fillRect(cl, 172, 3, 2);
      g.fillStyle = ((cl + 7) % 4 === 0 && on) ? '#ffd23a' : '#3a3010';
      g.fillRect(cl + 6, 172, 3, 2);
    }
    // Floor line where the heroes stand.
    g.fillStyle = '#243150'; g.fillRect(0, 168, 320, 1);
  }

  var CY_FLOOR = 120;   // ending-cutscene floor line (characters above the box)

  // Draw the 5 rescue heroes on the RIGHT via pixDraw. `activeId`
  // spotlights + steps the speaking hero forward; the rest dim.
  function _cyDrawRescueLineup(g, t, activeId) {
    var SP = SDD.sprites;
    for (var i = 0; i < RESCUE_LINEUP.length; i++) {
      var hero = RESCUE_LINEUP[i];
      var active = (hero.id === activeId);
      var idx = (Math.floor(t / 16) + i) % 4;           // idle breathing
      var step = active ? 3 : 0;
      var bob = Math.round(Math.sin(t * 0.08 + i) * 1);
      var baseY = CY_FLOOR + step + bob;
      // Contact shadow pinned to the floor (not bobbing) so each hero
      // visibly stands ON the surface.
      g.fillStyle = 'rgba(0,0,0,0.30)';
      g.beginPath(); g.ellipse(hero.x, CY_FLOOR + 1, 11, 3, 0, 0, Math.PI * 2); g.fill();
      // Spotlight pool under the active speaker.
      if (active) {
        var sp = g.createRadialGradient(hero.x, baseY + 1, 2, hero.x, baseY + 1, 26);
        sp.addColorStop(0, 'rgba(255,230,150,0.42)');
        sp.addColorStop(1, 'rgba(255,230,150,0)');
        g.fillStyle = sp; g.fillRect(hero.x - 26, baseY - 30, 52, 36);
      }
      if (activeId && !active) g.globalAlpha = 0.5;
      if (SP.pixDraw) SP.pixDraw(g, 'rescue', hero.anim, 'south', idx, hero.x, baseY);
      g.globalAlpha = 1;
    }
  }

  // Draw the Computer on the LEFT of the briefing. During the run-in
  // it uses the playable comp_run (facing the team); once briefing it
  // switches to the expressive comp2 'talk' / 'concerned'. `lit` adds
  // a cyan speaking glow.
  function _cyDrawComputerActor(g, t, cx, mode, lit) {
    var SP = SDD.sprites;
    var baseY = CY_FLOOR + Math.round(Math.sin(t * 0.08) * 1);
    // Contact shadow pinned to the floor so the Computer stands on it.
    g.fillStyle = 'rgba(0,0,0,0.30)';
    g.beginPath(); g.ellipse(cx, CY_FLOOR + 1, 12, 3, 0, 0, Math.PI * 2); g.fill();
    if (lit) {
      var gl = g.createRadialGradient(cx, baseY - 16, 3, cx, baseY - 16, 34);
      gl.addColorStop(0, 'rgba(90,240,255,0.34)');
      gl.addColorStop(1, 'rgba(90,240,255,0)');
      g.fillStyle = gl; g.fillRect(cx - 34, baseY - 52, 68, 52);
    }
    if (mode === 'runin') {
      if (SP.pixDraw) SP.pixDraw(g, 'big', 'comp_run', 'east', Math.floor(t / 4) % 8, cx, baseY);
    } else {
      // Expressive cutscene computer; 'talk' while speaking, else
      // 'concerned' as a calmer waiting idle.
      var anim = lit ? 'talk' : 'concerned';
      var n = (anim === 'concerned') ? 17 : 16;
      if (SP.pixDraw) SP.pixDraw(g, 'comp2', anim, 'south', Math.floor(t / 5) % n, cx, baseY);
    }
  }

  // v0.68: expose the cyber-theme painters so the decor editor scene
  // (js/decor_editor.js) can render its preview backdrop + the live
  // decor list. Keeps the editor decoupled from the level scene.
  SDD._drawSkyCyber       = drawSky_cyber;
  SDD._drawForegroundCyber = drawForeground_cyber;
  SDD._drawDecor          = _cyDrawDecor;
  // v0.76: expose the single-piece painter so the decor editor can
  // render catalog thumbnails of each kind/variant.
  SDD._paintDecorPiece    = _cyPaintDecorPiece;
  // v0.86: expose the full theme registries so the level editor can
  // render the parallax sky + foreground layers for any stage. Also
  // expose Adventure City's tower entrance + start sign painters.
  SDD.themes = { SKY: THEMES, FG: FOREGROUNDS };
  SDD._drawTowerEntrance   = _cyDrawTowerEntrance;
  SDD._drawTowerEntranceBg = _cyDrawTowerEntranceBg;
  SDD._drawTowerEntranceFg = _cyDrawTowerEntranceFg;
  SDD._drawStartSign       = _cyDrawStartSign;
  var DLG_WRAP = 44;          // chars per dialogue line (full-width box)
  var DLG_CPS  = 0.5;         // characters revealed per frame (~30/s)
  var CY_RUNIN = 54;          // run-in duration (frames)
  var CY_COMPX = 44;          // Computer's resting x on the left

  SDD.scenes.cityArrival = {
    enter: function (d) {
      this.d = d || {};
      this.phase = 'runin'; this.runT = 0;
      this.idx = 0; this.t = 0; this.clock = 0;
      this.shown = 0; this.full = false;
      this.lines = ['']; this.total = 0;
      // v0.90 (Mark): the closing cinematic uses the same theme as
      // Super Dude Danny's opening new-game cinematic (the `intro`
      // track) so the story bookends with the same music.
      A.startMusic('intro');
    },
    // Pre-wrap the current line + reset the typewriter + speaker sting.
    _prep: function () {
      var line = CITY_DIALOG[this.idx] || { text: '' };
      this.lines = _cyWrap(line.text, DLG_WRAP);
      this.total = line.text.length;
      this.shown = 0; this.full = false; this.t = 0;
      if (line.who === 'computer') A.sfx('hit');
      else if (line.who === 'kevin') A.sfx('1up');
      else if (line.who) A.sfx('select');
    },
    update: function () {
      this.clock++;
      // ---- run-in: the Computer (player) dashes into the Tower ----
      if (this.phase === 'runin') {
        this.runT++;
        if (this.runT >= CY_RUNIN || In.confirm()) {
          this.phase = 'talk'; this._prep();
        }
        return;
      }
      // ---- dialogue ----
      this.t++;
      if (!this.full) {
        this.shown += DLG_CPS;
        if (Math.floor(this.shown) % 3 === 0 && (this.shown - Math.floor(this.shown)) < DLG_CPS) {
          A.sfx('chirp');
        }
        if (this.shown >= this.total) { this.shown = this.total; this.full = true; }
      }
      if (In.confirm()) {
        if (!this.full) { this.shown = this.total; this.full = true; A.sfx('select'); }
        else {
          this.idx++;
          if (this.idx >= CITY_DIALOG.length) {
            A.stopMusic();
            if (!SDD.save.data.secretCleared) {
              SDD.save.data.secretCleared = true;
              SDD.save.save();
            }
            go('menu');   // back to the title screen
            return;
          }
          this._prep();
        }
      }
    },
    _banner: function (g) {
      var t = this.clock;
      g.fillStyle = 'rgba(8,10,22,0.92)'; g.fillRect(0, 0, 320, 16);
      g.fillStyle = '#ffd23a'; g.fillRect(0, 16, 320, 1);
      g.fillStyle = '#ff5a3a';
      if (t % 40 < 24) { g.fillRect(6, 5, 5, 5); g.fillRect(309, 5, 5, 5); }
      tsh(g, 'RESCUE HQ - EMERGENCY BRIEFING', 160, 4, '#ffd23a', '#5a3a10', 1, 'center');
    },
    _floor: function (g) {
      // v0.90 (Mark: "they seem like they're floating"): a SOLID floor
      // plane from CY_FLOOR down so the team is clearly standing on a
      // surface, not hovering in the dark room. Lit leading edge +
      // receding seams give it a bit of depth.
      var fy = CY_FLOOR;                                   // 120 = feet line
      var fl = g.createLinearGradient(0, fy, 0, 180);
      fl.addColorStop(0,    '#2c3c60');
      fl.addColorStop(0.18, '#1c2742');
      fl.addColorStop(1,    '#0b1120');
      g.fillStyle = fl; g.fillRect(0, fy, 320, 180 - fy);
      // Bright wall/floor seam where the surface starts.
      g.fillStyle = '#3d5485'; g.fillRect(0, fy, 320, 1);
      g.fillStyle = 'rgba(160,190,235,0.32)'; g.fillRect(0, fy + 1, 320, 1);
      // Receding perspective seams (short verticals at the seam line).
      g.fillStyle = 'rgba(10,16,30,0.45)';
      for (var sx = 16; sx < 320; sx += 32) g.fillRect(sx, fy + 2, 1, 7);
      // A faint horizontal tile band a few px down.
      g.fillStyle = 'rgba(90,120,170,0.12)'; g.fillRect(0, fy + 9, 320, 1);
    },
    render: function (g) {
      var cl = this.clock;

      // ---- RUN-IN PHASE: Computer sprints in from the left ----
      if (this.phase === 'runin') {
        _cyDrawRescueHQ(g, cl, false);
        this._floor(g);
        _cyDrawRescueLineup(g, cl, null);              // heroes waiting
        var p = Math.min(1, this.runT / CY_RUNIN);
        var rx = Math.round(-24 + p * (CY_COMPX + 24));
        _cyDrawComputerActor(g, cl, rx, 'runin', false);
        this._banner(g);
        return;
      }

      // ---- TALK PHASE ----
      var line = CITY_DIALOG[this.idx] || {};
      var who = line.who;
      var act = who && DIALOG_ACTOR[who];
      var isFinal = (this.idx === CITY_DIALOG.length - 1);
      var compTalk = (who === 'computer');
      var heroActive = (who && who !== 'computer') ? who : null;

      _cyDrawRescueHQ(g, cl, compTalk);
      this._floor(g);
      _cyDrawRescueLineup(g, cl, heroActive);
      _cyDrawComputerActor(g, cl, CY_COMPX, 'brief', compTalk);
      this._banner(g);

      // Final card overlay.
      if (isFinal) {
        for (var s = 0; s < 22; s++) {
          var sxx = ((s * 47 + cl * 1.4) % 320), syy = ((s * 29 + cl * 1.1) % 96) + 22;
          g.fillStyle = (s % 3 === 0) ? '#ffd23a' : (s % 3 === 1) ? '#5af0ff' : '#ff5a3a';
          g.fillRect(sxx | 0, syy | 0, 2, 2);
        }
        tsh(g, 'THE RESCUE BEGINS', 160, 58, '#ffd23a', '#7a4a10', 2, 'center');
        text(g, line.text, 160, 84, '#ffffff', 1, 'center');
        if (this.t > 8 && (cl % 40 < 26)) tsh(g, 'PRESS A', 160, 100, '#ffd23a', '#000', 1, 'center');
        return;
      }

      // ---- BOTTOM DIALOGUE BOX ----
      // v0.89: width shrinks on touch (mobile) so the box doesn't sit
      // under the A/B touch buttons on the right side of the viewport.
      var accent = act ? act.accent : '#ffd23a';
      var touchMode = (typeof document !== 'undefined' && document.body && document.body.classList.contains('touch'));
      var boxX = 6, boxY = 128, boxW = touchMode ? 218 : 308, boxH = 46;
      var psz = 40;
      g.fillStyle = 'rgba(8,10,22,0.95)'; g.fillRect(boxX, boxY, boxW, boxH);
      g.strokeStyle = accent; g.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
      // Speaker portrait inset on the left of the box.
      var portX = boxX + 3, portY = boxY + 3;
      if (act) _cyDrawPixPortrait(g, act.psize, act.panim, act.pdir, Math.floor(cl / 16) % 4, portX, portY, psz, accent);
      var textX = portX + psz + 8;
      // Name tag riding the box top edge. v0.89: tag is 11px tall +
      // 9px inner panel so the 7-row glyphs sit cleanly inside without
      // the bottom row being eaten by the accent border (Mark: "names
      // are too big and don't fit, they end up cropped").
      if (line.name) {
        var nw = line.name.length * 6 + 10;
        g.fillStyle = accent;       g.fillRect(textX, boxY - 8, nw, 11);
        g.fillStyle = '#0a0e18';    g.fillRect(textX + 1, boxY - 7, nw - 2, 9);
        text(g, line.name, textX + nw / 2, boxY - 6, accent, 1, 'center');
      }
      // Typed text. Wrap dynamically to the dialog box width so short
      // boxes (touch mode) still flow nicely.
      var maxChars = Math.max(20, Math.floor((boxW - psz - 16) / 6));
      this.lines = _cyWrap(line.text || '', maxChars);
      var revealed = Math.floor(this.shown), consumed = 0;
      for (var li = 0; li < this.lines.length; li++) {
        var ln = this.lines[li], show = ln;
        if (consumed + ln.length > revealed) show = ln.slice(0, Math.max(0, revealed - consumed));
        consumed += ln.length + 1;
        text(g, show, textX, boxY + 8 + li * 11, '#ffffff', 1, 'left');
        if (consumed > revealed) break;
      }
      if (this.full && (cl % 40 < 26)) {
        tsh(g, 'PRESS A >', boxX + boxW - 4, boxY + boxH - 11, accent, '#000000', 1, 'right');
      }
    }
  };

  // =====================================================================
  // CITY INTRO - opening cinematic for Adventure City (v0.83).
  // Plays right after Super Dude Danny vanishes: the Computer walks
  // into the wrecked lab, panics, then realises the rescue team at
  // Adventure Tower can help. Computer-only, expressive comp2 anims +
  // typed dialogue + portrait. Ends -> the playable level.
  // Each beat: { mood, text } where mood = the comp2 anim + portrait.
  // =====================================================================
  var INTRO_DIALOG = [
    { mood: 'alert',     text: "WHOA-! THE LAB'S A WRECK. SPARKS, SMOKE, LOOSE BOLTS EVERYWHERE..." },
    { mood: 'scared',    text: "...AND SUPER DUDE DANNY IS GONE?! THE TIME MACHINE ZAPPED HIM INTO WHO-KNOWS-WHEN!" },
    { mood: 'concerned', text: "OKAY. OKAAAY. DON'T PANIC, CIRCUITS. ...I'M PANICKING A LITTLE." },
    { mood: 'concerned', text: "I CAN'T DO THIS ALONE. I'M BASICALLY A TOASTER WITH FEELINGS." },
    { mood: 'talk',      text: "WAIT - THE RESCUE TEAM! THEY HANG OUT AT ADVENTURE TOWER!" },
    { mood: 'talk',      text: "HANG ON, DANNY. HELP IS COMING... RIGHT AFTER I CROSS THE WHOLE CITY. GULP." }
  ];
  var INTRO_FRAMES = { alert: 16, scared: 16, concerned: 17, talk: 16 };

  // Cold-open prologue timeline (steps @ 60fps). Danny is at the intact
  // time machine; it charges, flashes, and zaps him out of time; then
  // the Computer walks in from the left to find the lab wrecked.
  var PRO_FLASH = 118;   // white-flash peak (Danny + machine vanish here)
  var PRO_WALK  = 150;   // Computer starts walking in from the left edge
  var PRO_WALKEND = 244; // Computer reaches centre stage
  var PRO_END   = 268;   // auto-advance into the dialogue beats

  SDD.scenes.cityIntro = {
    enter: function () {
      this.phase = 'prologue'; this.pt = 0;
      this.idx = 0; this.t = 0; this.clock = 0;
      this.shown = 0; this.full = false;
      A.startMusic('level_8_1');
    },
    _prep: function () {
      var line = INTRO_DIALOG[this.idx] || { text: '' };
      this.lines = _cyWrap(line.text, 44);
      this.total = line.text.length;
      this.shown = 0; this.full = false; this.t = 0;
      if (line.mood === 'alert' || line.mood === 'scared') A.sfx('hit');
      else if (line.mood === 'talk') A.sfx('1up');
      else A.sfx('select');
    },
    update: function () {
      this.clock++;
      // --- Prologue: silent cinematic, auto-advancing, A skips it. ---
      if (this.phase === 'prologue') {
        this.pt++;
        if (this.pt === 1) A.sfx('power');                 // machine spins up
        if (this.pt === PRO_FLASH) A.sfx('grow');          // the teleport zap
        if (this.pt === PRO_WALK) A.sfx('step_computer');  // first footstep
        // v0.89: Computer footstep cadence while he walks in from
        // the left (PRO_WALK -> PRO_WALKEND). Every 14 steps to match
        // the in-game walk cadence.
        if (this.pt > PRO_WALK && this.pt < PRO_WALKEND &&
            ((this.pt - PRO_WALK) % 14) === 0) {
          A.sfx('step_computer');
        }
        var skip = In.confirm() && this.pt > 6;
        if (this.pt >= PRO_END || skip) { this.phase = 'dialogue'; this._prep(); }
        return;
      }
      this.t++;
      if (!this.full) {
        this.shown += 0.5;
        if (Math.floor(this.shown) % 3 === 0 && (this.shown - Math.floor(this.shown)) < 0.5) A.sfx('chirp');
        if (this.shown >= this.total) { this.shown = this.total; this.full = true; }
      }
      if (In.confirm()) {
        if (!this.full) { this.shown = this.total; this.full = true; A.sfx('select'); }
        else {
          this.idx++;
          if (this.idx >= INTRO_DIALOG.length) { go('level', { day: 8, stage: 1 }); return; }
          this._prep();
        }
      }
    },
    _renderProlog: function (g) {
      var pt = this.pt, cl = this.clock;
      var accent = '#5af0ff';
      var gone = pt >= PRO_FLASH;                     // Danny + machine zapped

      // --- Lab backdrop ---
      if (ART_LAB.ok) { g.imageSmoothingEnabled = false; g.drawImage(ART_LAB.img, 0, 0, 320, 180); }
      else {
        var rm = g.createLinearGradient(0, 0, 0, 180);
        rm.addColorStop(0, '#161226'); rm.addColorStop(1, '#0c0a18');
        g.fillStyle = rm; g.fillRect(0, 0, 320, 180);
      }
      g.fillStyle = 'rgba(10,12,28,0.30)'; g.fillRect(0, 0, 320, 180);

      // --- Time machine: intact + charging before the zap, broken after ---
      var mx = 250, mBaseY = 150;
      var charge = Math.max(0, Math.min(1, (pt - 24) / (PRO_FLASH - 24)));
      if (!gone) {
        if (ART_MACHINE.ok) {
          var mh = 100, mw = Math.round(mh * (1024 / 1536));
          g.drawImage(ART_MACHINE.img, mx - mw / 2, mBaseY - mh, mw, mh);
        } else { g.fillStyle = '#3a6a8a'; g.fillRect(mx - 18, mBaseY - 48, 36, 48); }
        // Dome glow swells as it charges.
        if (charge > 0) {
          var dg = g.createRadialGradient(mx, mBaseY - 58, 2, mx, mBaseY - 58, 18 + charge * 16);
          dg.addColorStop(0, 'rgba(150,235,255,' + (0.25 + charge * 0.5).toFixed(2) + ')');
          dg.addColorStop(1, 'rgba(150,235,255,0)');
          g.fillStyle = dg; g.fillRect(mx - 40, mBaseY - 100, 80, 80);
        }
        // Electric arcs crackle faster as the charge builds.
        if (charge > 0.2 && cl % Math.max(2, Math.round(8 - charge * 6)) < 2) {
          g.strokeStyle = '#bff4ff'; g.lineWidth = 1; g.beginPath();
          var ax0 = mx, ay0 = mBaseY - 60;
          for (var aa = 0; aa < 4; aa++) {
            var ex = mx - 22 + ((cl * 7 + aa * 19) % 44);
            var ey = mBaseY - 78 + ((cl * 5 + aa * 11) % 40);
            g.moveTo(ax0, ay0); g.lineTo(ex, ey);
          }
          g.stroke();
        }
      } else {
        // v0.87: machine is GONE - it took Danny with it (Mark: "the
        // broken Time Machine is not supposed to stay behind"). Just
        // a scorch mark on the floor + lingering smoke + sparks where
        // the machine USED to stand.
        var floorScY = mBaseY - 2;
        var scorch = g.createRadialGradient(mx, floorScY, 2, mx, floorScY, 32);
        scorch.addColorStop(0,   'rgba(20,8,12,0.85)');
        scorch.addColorStop(0.6, 'rgba(40,18,22,0.45)');
        scorch.addColorStop(1,   'rgba(40,18,22,0)');
        g.fillStyle = scorch;
        g.fillRect(mx - 36, mBaseY - 8, 72, 14);
        // A handful of charred bolts + debris on the floor.
        g.fillStyle = '#1a1820';
        g.fillRect(mx - 18, mBaseY - 2, 2, 2);
        g.fillRect(mx + 6,  mBaseY - 1, 3, 2);
        g.fillRect(mx - 4,  mBaseY,     2, 1);
        g.fillRect(mx + 14, mBaseY - 2, 2, 1);
        // Aftermath smoke rising from the empty spot.
        for (var s = 0; s < 5; s++) {
          var ph = ((pt - PRO_FLASH) * 0.8 + s * 26) % 70;
          var syy = mBaseY - 6 - ph * 0.9, a = 0.34 - ph * 0.004;
          if (a < 0.04) continue;
          g.fillStyle = 'rgba(150,160,180,' + a.toFixed(2) + ')';
          var sw = 5 + s + ph * 0.06;
          g.fillRect(mx - sw / 2 + Math.sin(syy * 0.2 + s) * 3, syy, sw, 3);
        }
      }

      // --- Super Dude Danny at the machine until the flash takes him ---
      if (!gone) {
        var dShake = charge > 0.5 ? Math.round(Math.sin(cl * 1.3) * charge * 2) : 0;
        var idleIdx = Math.floor(cl / 14) % 4;
        drawDannyScaled(g, 'big', 'idle', 'east', idleIdx, 206 + dShake, mBaseY, 1.7);
        // Rising teleport motes as the charge peaks.
        if (charge > 0.4) {
          g.fillStyle = '#bff4ff';
          for (var m = 0; m < 6; m++) {
            var mvy = (cl * 2 + m * 14) % 46;
            g.fillRect(200 + ((m * 9 + cl) % 18), mBaseY - 6 - mvy, 1, 2);
          }
        }
      }

      // --- The white teleport flash (covers the vanish) ---
      if (pt >= PRO_FLASH - 12 && pt <= PRO_FLASH + 18) {
        var fa;
        if (pt < PRO_FLASH) fa = (pt - (PRO_FLASH - 12)) / 12 * 0.9;
        else fa = Math.max(0, 1 - (pt - PRO_FLASH) / 18) * 0.95;
        g.fillStyle = 'rgba(220,245,255,' + fa.toFixed(2) + ')';
        g.fillRect(0, 0, 320, 180);
      }

      // --- Computer walks in from the left after the dust settles ---
      if (pt >= PRO_WALK) {
        var wp = Math.min(1, (pt - PRO_WALK) / (PRO_WALKEND - PRO_WALK));
        var cxp = Math.round(-24 + wp * (96 + 24));
        var walking = wp < 1;
        var cy = 150;
        // Spotlight pool so he reads against the busy lab.
        var spot = g.createRadialGradient(cxp, cy - 18, 4, cxp, cy - 6, 44);
        spot.addColorStop(0, 'rgba(120,200,255,0.26)');
        spot.addColorStop(1, 'rgba(120,200,255,0)');
        g.fillStyle = spot; g.fillRect(cxp - 44, cy - 54, 88, 58);
        if (SDD.sprites.pixDraw) {
          // v0.85: Computer scaled 1.25x in the prologue per Mark - the
          // run-in + arrived idle felt small against the lab backdrop.
          g.save();
          g.translate(cxp, cy);
          g.scale(1.25, 1.25);
          g.translate(-cxp, -cy);
          if (walking) SDD.sprites.pixDraw(g, 'big', 'comp_run', 'east', Math.floor(cl / 4) % 8, cxp, cy);
          else SDD.sprites.pixDraw(g, 'comp2', 'concerned', 'south', Math.floor(cl / 5) % 17, cxp, cy);
          g.restore();
        }
        // A startled "!" once he arrives and sees the wreck.
        if (!walking && (cl % 60 < 38)) {
          tsh(g, '!', cxp, cy - 64, '#ff6a4a', '#000000', 1, 'center');
        }
      }

      // --- Location banner ---
      g.fillStyle = 'rgba(8,10,22,0.9)'; g.fillRect(0, 0, 320, 14);
      g.fillStyle = accent; g.fillRect(0, 14, 320, 1);
      tsh(g, "SUPER DUDE DANNY'S LAB", 160, 3, accent, '#0a1622', 1, 'center');

      // --- Skip hint ---
      if (cl % 50 < 32) tsh(g, 'PRESS A TO SKIP >', 314, 168, accent, '#000000', 1, 'right');
    },

    render: function (g) {
      if (this.phase === 'prologue') { this._renderProlog(g); return; }
      var cl = this.clock, line = INTRO_DIALOG[this.idx] || {};
      var mood = line.mood || 'concerned';
      var accent = (mood === 'alert' || mood === 'scared') ? '#ff6a4a' : '#5af0ff';

      // --- Lab backdrop (painted lab if present, else dark room) ---
      if (ART_LAB.ok) { g.imageSmoothingEnabled = false; g.drawImage(ART_LAB.img, 0, 0, 320, 180); }
      else {
        var rm = g.createLinearGradient(0, 0, 0, 180);
        rm.addColorStop(0, '#161226'); rm.addColorStop(1, '#0c0a18');
        g.fillStyle = rm; g.fillRect(0, 0, 320, 180);
      }
      // Dim + cool the room a touch so the alarm-red FX read.
      g.fillStyle = 'rgba(10,12,28,0.34)'; g.fillRect(0, 0, 320, 180);

      // --- Aftermath: machine GONE (took Danny with it). Just a
      //     scorch mark + smoke + a few residual electric sparks
      //     where it used to stand. ---
      var mx = 250, mBaseY = 150;
      var dlgScorch = g.createRadialGradient(mx, mBaseY - 2, 2, mx, mBaseY - 2, 32);
      dlgScorch.addColorStop(0,   'rgba(20,8,12,0.80)');
      dlgScorch.addColorStop(0.6, 'rgba(40,18,22,0.42)');
      dlgScorch.addColorStop(1,   'rgba(40,18,22,0)');
      g.fillStyle = dlgScorch;
      g.fillRect(mx - 36, mBaseY - 8, 72, 14);
      // Charred bolts / debris.
      g.fillStyle = '#1a1820';
      g.fillRect(mx - 18, mBaseY - 2, 2, 2);
      g.fillRect(mx + 6,  mBaseY - 1, 3, 2);
      g.fillRect(mx - 4,  mBaseY,     2, 1);
      g.fillRect(mx + 14, mBaseY - 2, 2, 1);
      // Rising smoke puffs from the empty floor.
      for (var s = 0; s < 5; s++) {
        var ph = (cl * 0.8 + s * 26) % 70;
        var syy = mBaseY - 6 - ph * 0.9;
        var a = 0.34 - ph * 0.004; if (a < 0.04) continue;
        g.fillStyle = 'rgba(150,160,180,' + a.toFixed(2) + ')';
        var sw = 5 + s + (ph * 0.06);
        g.fillRect(mx - sw / 2 + Math.sin(syy * 0.2 + s) * 3, syy, sw, 3);
      }
      // Residual electric sparks dancing low to the ground.
      if (cl % 12 < 4) {
        g.fillStyle = '#9af0ff';
        for (var sp = 0; sp < 3; sp++) {
          var spx = mx - 14 + ((cl * 7 + sp * 13) % 28);
          var spy = mBaseY - 4 + ((cl * 5 + sp * 9) % 6);
          g.fillRect(spx, spy, 1, 2);
        }
      }
      // Alarm glow pulse across the top while alert/scared.
      if (mood === 'alert' || mood === 'scared') {
        var ap = 0.10 + Math.sin(cl * 0.25) * 0.06;
        g.fillStyle = 'rgba(255,60,40,' + Math.max(0, ap).toFixed(2) + ')';
        g.fillRect(0, 0, 320, 22);
      }

      // --- The Computer, centre-left, expression per beat ---
      var compX = 96, compY = 150 + Math.round(Math.sin(cl * 0.08) * 1);
      var n = INTRO_FRAMES[mood] || 16;
      // Spotlight pool so the robot pops off the busy lab backdrop.
      var spot = g.createRadialGradient(compX, compY - 18, 4, compX, compY - 6, 46);
      spot.addColorStop(0, 'rgba(120,200,255,0.30)');
      spot.addColorStop(1, 'rgba(120,200,255,0)');
      g.fillStyle = spot; g.fillRect(compX - 46, compY - 56, 92, 60);
      // Jitter slightly while scared/alert.
      var jit = (mood === 'alert' || mood === 'scared') ? Math.round(Math.sin(cl * 0.9) * 1) : 0;
      if (SDD.sprites.pixDraw) SDD.sprites.pixDraw(g, 'comp2', mood, 'south', Math.floor(cl / 5) % n, compX + jit, compY);

      // --- Location banner ---
      g.fillStyle = 'rgba(8,10,22,0.9)'; g.fillRect(0, 0, 320, 14);
      g.fillStyle = accent; g.fillRect(0, 14, 320, 1);
      tsh(g, "SUPER DUDE DANNY'S LAB", 160, 3, accent, '#0a1622', 1, 'center');

      // --- Dialogue box (bottom) + portrait + typed text ---
      // v0.89: width shrinks on touch so it doesn't sit under the
      // A/B touch buttons.
      var touchMode = (typeof document !== 'undefined' && document.body && document.body.classList.contains('touch'));
      var boxX = 6, boxY = 128, boxW = touchMode ? 218 : 308, boxH = 46, psz = 40;
      g.fillStyle = 'rgba(8,10,22,0.95)'; g.fillRect(boxX, boxY, boxW, boxH);
      g.strokeStyle = accent; g.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
      var portX = boxX + 3, portY = boxY + 3;
      _cyDrawPixPortrait(g, 'comp2', mood, 'south', Math.floor(cl / 5) % n, portX, portY, psz, accent);
      var textX = portX + psz + 8;
      // Name tag - 11px tall + 9px inner so glyphs aren't cropped.
      var nm = 'COMPUTER', nw = nm.length * 6 + 10;
      g.fillStyle = accent;    g.fillRect(textX, boxY - 8, nw, 11);
      g.fillStyle = '#0a0e18'; g.fillRect(textX + 1, boxY - 7, nw - 2, 9);
      text(g, nm, textX + nw / 2, boxY - 6, accent, 1, 'center');
      // Re-wrap to the current box width.
      var maxChars = Math.max(20, Math.floor((boxW - psz - 16) / 6));
      this.lines = _cyWrap(line.text || '', maxChars);
      // Typed text.
      var revealed = Math.floor(this.shown), consumed = 0;
      for (var li = 0; li < this.lines.length; li++) {
        var lnn = this.lines[li], show = lnn;
        if (consumed + lnn.length > revealed) show = lnn.slice(0, Math.max(0, revealed - consumed));
        consumed += lnn.length + 1;
        text(g, show, textX, boxY + 8 + li * 11, '#ffffff', 1, 'left');
        if (consumed > revealed) break;
      }
      if (this.full && (cl % 40 < 26)) tsh(g, 'PRESS A >', boxX + boxW - 4, boxY + boxH - 11, accent, '#000000', 1, 'right');
    }
  };
})();
