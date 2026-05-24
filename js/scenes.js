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

  // simple vertical-list menu helper
  function listNav(state, count) {
    if (In.pressed('up')) { state.idx = (state.idx - 1 + count) % count; A.sfx('select'); }
    if (In.pressed('down')) { state.idx = (state.idx + 1) % count; A.sfx('select'); }
  }

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
    },
    update: function () {
      // Wait up to ~30 frames (0.5 sec) for title.png to decode. If it
      // hasn't loaded by then, skip straight to the menu - no
      // placeholder card.
      if (!ART_TITLE.ok) {
        this.waited++;
        if (this.waited > 30) { go('menu'); return; }
        return;
      }
      this.t++;
      if (!this.chirped && this.t > 6) { A.sfx('chirp'); this.chirped = true; }
      if (this.phase === 'in') {
        this.alpha += 1 / 60;            // 1 sec to full alpha
        if (this.alpha >= 1) { this.alpha = 1; this.phase = 'hold'; this.t = 0; }
      } else if (this.phase === 'hold') {
        if (this.t > 180) this.phase = 'out';   // 3 sec hold
      } else {
        this.alpha -= 1 / 60;            // 1 sec fade-out
        if (this.alpha <= 0) { this.alpha = 0; go('menu'); return; }
      }
      if (In.confirm() && this.phase !== 'out') { this.phase = 'out'; }
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
    }
  };

  // =====================================================================
  // INTRO - short animated cinematic
  // =====================================================================
  var INTRO_BEATS = [
    { lines: ['DANNY THE SCIENTIST BUILT', 'A TIME MACHINE...'] },
    { lines: ['...TO TRAVEL BACK AND WITNESS', "GOD'S SEVEN DAYS OF CREATION."] },
    { lines: ['BUT THE JUMP WENT WRONG', 'AND THE MACHINE BROKE APART!'] },
    { lines: ['STRANDED IN TIME, DANNY MUST FIND', 'POWER CORES AND MACHINE PARTS', 'TO REBUILD IT AND GET HOME.'] }
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
        var grd = g.createLinearGradient(0, 0, 0, 180);
        grd.addColorStop(0, '#3a2c66'); grd.addColorStop(1, '#caa6c0');
        g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
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
            // Warm dome glow at the top of the machine only. Removed
            // the cyan rectangular halo around the machine body (Mark
            // saw it as "a circle in a big square" in beat 1).
            g.fillStyle = 'rgba(255,232,147,0.50)';
            g.beginPath(); g.arc(cx, my + 12, mw * 0.45, 0, Math.PI * 2); g.fill();
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
        machine(g, 160, 103, false, true);
        drawDannyScaled(g, 'big', 'idle', 'east', idleIdx, 70, 150, 2);
        // dawn ground
        g.fillStyle = '#86cf45'; g.fillRect(0, 150, 320, 30);
        g.fillStyle = '#ffd23a';
        g.beginPath(); g.arc(260, 150, 26, Math.PI, 0); g.fill();
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
      A.startMusic('menu');
      this.items = [{ label: 'NEW GAME', act: 'new' }];
      if (SDD.save.hasSave()) this.items.splice(1, 0, { label: 'CONTINUE', act: 'continue' });
      this.items.push({ label: 'OPTIONS', act: 'options' });
      this.items.push({ label: 'HOW TO PLAY', act: 'howto' });
      this.idx = SDD.save.hasSave() ? 1 : 0;
    },
    update: function () {
      this.t++;
      listNav(this, this.items.length);
      if (In.confirm()) {
        var act = this.items[this.idx].act;
        A.sfx('confirm');
        if (act === 'new') { SDD.save.reset(); SDD.save.save(); go('intro'); }
        else if (act === 'continue') { go('overworld'); }
        else if (act === 'options') { go('options', { from: 'menu' }); }
        else if (act === 'howto') { go('howto', { from: 'menu' }); }
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
      S.drawDanny(g, 'big', 'idle', 'east', Math.floor(this.t / 18) % 4, 40, 96);

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
    }
  };

  // =====================================================================
  // OPTIONS
  // =====================================================================
  SDD.scenes.options = {
    enter: function (d) { this.from = (d && d.from) || 'menu'; this.idx = 0; this.t = 0; },
    update: function () {
      this.t++;
      listNav(this, 4);
      var o = SDD.save.data.options;
      if (this.idx === 0 && In.confirm()) {
        o.muted = !o.muted; A.setMuted(o.muted); SDD.save.save();
        if (!o.muted) A.sfx('confirm');
      }
      if (this.idx === 1) {
        if (In.pressed('left')) { o.volume = Math.max(0, o.volume - 0.1); A.setVolume(o.volume); A.sfx('select'); SDD.save.save(); }
        if (In.pressed('right')) { o.volume = Math.min(1, o.volume + 0.1); A.setVolume(o.volume); A.sfx('select'); SDD.save.save(); }
      }
      if (this.idx === 2 && In.confirm()) {
        o.god = !o.god; SDD.save.save(); A.sfx('confirm');
      }
      if (this.idx === 3 && In.confirm()) { A.sfx('confirm'); go(this.from); }
      if (In.pressed('pause')) { A.sfx('confirm'); go(this.from); }
    },
    render: function (g) {
      g.fillStyle = '#1a1640'; g.fillRect(0, 0, 320, 180);
      drawStarfield(g, this.t);
      tsh(g, 'OPTIONS', 160, 22, '#ffd23a', '#a8631a', 3, 'center');
      var o = SDD.save.data.options;
      var rows = [
        'SOUND:    ' + (o.muted ? 'OFF' : 'ON'),
        'VOLUME:   ' + ('[' + repeat('=', Math.round(o.volume * 10)) + repeat('.', 10 - Math.round(o.volume * 10)) + ']'),
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
      if (In.confirm() || In.pressed('pause')) { A.sfx('confirm'); go(this.from); }
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
    { d: 6, s: 2, x:  40, dy: 120, name: 'VILLAGE',     nextDir: 'down'  },
    { d: 7, s: 1, x: 240, dy: 160, name: 'EDEN GARDEN', nextDir: null    }
  ];
  var OPPOSITE = { right: 'left', left: 'right', up: 'down', down: 'up' };
  // Optional swap-in art (assets/overworld.png). Drawn under the path
  // when present; otherwise we draw the gradient + starfield fallback.
  var overworldImg = new Image();
  var overworldImgOk = false;
  overworldImg.onload  = function () { overworldImgOk = (overworldImg.width > 0); };
  overworldImg.onerror = function () { overworldImgOk = false; };
  overworldImg.src = 'assets/overworld.png';

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
          A.sfx('enter'); go('level', { day: st.d, stage: st.s });
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
    vGradient(g, '#5fa8d8', '#a8d8f0', '#dcefff');
    // Distant high-altitude wispy clouds (very slow parallax)
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (var w = 0; w < 6; w++) {
      var wx = ((w * 70 - camx * 0.04) % 380 + 380) % 380 - 30;
      var wy = 22 + (w * 11) % 32;
      g.fillRect(wx | 0, wy | 0, 20, 1);
      g.fillRect((wx | 0) + 4, wy + 1, 14, 1);
    }
    // Far layer puffy clouds (slow parallax)
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
    // Mid layer (existing variety - puffy / wispy / layered)
    driftClouds(g, camx, camy, 0.85);
    // Distant twister silhouettes - SLOW left-to-right drift across
    // the upper-mid sky. These are decorative only; the actual
    // gameplay twister is a separate entity.
    for (var ti = 0; ti < 3; ti++) {
      var tx = ((ti * 130 + t * 0.15 - camx * 0.18) % 420 + 420) % 420 - 60;
      var ty = 65 + ti * 14;
      g.fillStyle = 'rgba(70,90,120,0.55)';
      // Twister cone: wide at top, narrow at bottom, swaying
      var sway = Math.sin(t * 0.04 + ti) * 2;
      g.beginPath();
      g.moveTo(tx - 8 + sway,    ty);
      g.lineTo(tx + 8 + sway,    ty);
      g.lineTo(tx + 4 + sway/2,  ty + 14);
      g.lineTo(tx + 2,           ty + 22);
      g.lineTo(tx + 1,           ty + 22);
      g.lineTo(tx - 1 + sway/2,  ty + 14);
      g.closePath(); g.fill();
      // Spiral hint lines
      g.fillStyle = 'rgba(70,90,120,0.7)';
      g.fillRect((tx - 6 + sway) | 0, ty + 3, 12, 1);
      g.fillRect((tx - 4 + sway) | 0, ty + 7, 8, 1);
    }
    // Distant birds (existing chevrons but slower / less prominent)
    g.strokeStyle = 'rgba(38,72,106,0.6)'; g.lineWidth = 1;
    for (var i = 0; i < 6; i++) {
      var bx = ((i * 73 - camx * 0.12 + t * 0.15) % 360 + 360) % 360 - 20;
      var by = 30 + (i * 17) % 40;
      g.beginPath();
      g.moveTo(bx - 3, by + 2); g.lineTo(bx, by); g.lineTo(bx + 3, by + 2);
      g.stroke();
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
    // Big setting sun (lower-right)
    g.fillStyle = '#fff0a0';
    g.beginPath(); g.arc(250 - camx * 0.04, 88, 24, 0, 6.28); g.fill();
    g.fillStyle = 'rgba(255,180,90,0.45)';
    g.beginPath(); g.arc(250 - camx * 0.04, 88, 32, 0, 6.28); g.fill();
    // Distant haze band on the horizon
    g.fillStyle = 'rgba(255,200,140,0.35)';
    g.fillRect(0, 118, 320, 14);
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
    // Dry grass tufts at the horizon
    g.fillStyle = '#6a4a20';
    for (var gi = 0; gi < 40; gi++) {
      var gx = ((gi * 10 - camx * 0.5) % 320 + 320) % 320;
      g.fillRect(gx | 0, 144, 1, 3);
    }
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
    vGradient(g, '#a8d860', '#ffd28a');
    simpleSun(g, 250, 50, 22, '#fff0a0', false);
    var tX = 160 - camx * 0.08, tY = 150;
    g.fillStyle = '#3a2818';
    g.fillRect(tX - 3, tY - 60, 6, 60);
    g.fillStyle = '#2c5a24';
    g.beginPath(); g.arc(tX, tY - 70, 40, 0, 6.28); g.fill();
    g.fillStyle = '#3a7a32';
    g.beginPath(); g.arc(tX - 10, tY - 80, 25, 0, 6.28); g.fill();
    g.beginPath(); g.arc(tX + 15, tY - 75, 22, 0, 6.28); g.fill();
    g.fillStyle = '#ff8a5a';
    for (var k = 0; k < 5; k++) g.fillRect(tX - 20 + k * 9, tY - 50 - (k % 2) * 8, 2, 2);
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
    'eden': drawSky_eden
  };

  SDD.scenes.level = {
    enter: function (d) {
      this.day = (d && d.day) || 1;
      this.stage = (d && d.stage) || 1;
      this.lives = 3;
      this.loadLevel();
      // Per-level music key (e.g. 'level_3_2'). Audio loader picks a
      // variant (a/b/c) at random if multiple exist. Falls back to the
      // generic 'level' chiptune for biomes without a track yet.
      A.startMusic('level_' + this.day + '_' + this.stage);
    },

    loadLevel: function () {
      var L = SDD.levels[this.day + '-' + this.stage] || SDD.level1, T = C.TILE;
      var grid = L.tiles.map(function (r) { return r.slice(); });
      this.map = new E.TileMap(grid);
      this.gravityScale = L.gravityScale || 1;
      this.skyTheme = L.skyTheme || null;
      this.theme = L.theme || null;
      // Mode flags - Player.update reads these via the level reference
      // it gets each frame.
      this.flappy = !!L.flappy;
      this.flappySpeed = L.flappySpeed;
      this.flappyFlap = L.flappyFlap;
      this.flappyGravity = L.flappyGravity;
      this.flappyMaxFall = L.flappyMaxFall;
      this.underwater = !!L.underwater;
      this.topDeath = !!L.topDeath;
      this.enemies = []; this.platforms = []; this.items = [];
      this.projectiles = []; this.particles = [];
      this.cores = 0; this.score = 0; this.timeSteps = 0;
      this.state = 'play'; this.deathHandled = false;
      this.winTimer = 0; this.goTimer = 0;
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
        'eden':         { walker: 'leaf',  wisp: 'leaf', thrower: 'fruit'}
      };
      var variants = THEME_VARIANTS[this.theme] || {};
      for (var i = 0; i < L.spawns.length; i++) {
        var s = L.spawns[i], e;
        if (s.type === 'player') {
          e = new SDD.ent.Player(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          this.player = e;
        } else if (s.type === 'walker') {
          e = new SDD.ent.Walker(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          // Per-spawn variant override (Mark: lions + porcupines side
          // by side in savanna), else default to the theme variant.
          e.variant = s.variant || variants.walker;
          this.enemies.push(e);
        } else if (s.type === 'thrower') {
          e = new SDD.ent.Thrower(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          e.variant = variants.thrower;
          this.enemies.push(e);
        } else if (s.type === 'wisp') {
          e = new SDD.ent.Wisp(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = s.ty * T + 8 - e.h / 2;
          e.homeY = e.y; e.minX = e.x - 26; e.maxX = e.x + 26;
          e.variant = variants.wisp;
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
        } else if (s.type === 'timepart') {
          // Each stage drops a different piece of the time machine.
          // Variant key = day-stage so each part can render with a
          // unique palette/shape.
          e = new SDD.ent.TimePart(0, 0, this.day + '-' + this.stage);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h; e.baseY = e.y;
          this.items.push(e);
        } else if (s.type === 'npc') {
          e = new SDD.ent.NPC(0, 0, s.kind || 'adam');
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          this.items.push(e);
        } else if (s.type === 'skyhazard') {
          // periodic projectile spawner placed in the level data
          e = new SDD.ent.HazardSpawner(
            s.tx * T + 8, s.ty * T + 8,
            s.kind || 'flare', s.period || 90, s.dir || 1);
          e.tx = s.tx; e.ty = s.ty;                        // for nozzle decoration
          this.enemies.push(e);
        } else if (s.type === 'bubble') {
          e = new SDD.ent.BubbleUp(s.tx * T + 1, (s.ty || 1) * T);
          this.enemies.push(e);
        } else if (s.type === 'octopus') {
          e = new SDD.ent.Octopus(s.tx * T, s.ty * T);
          this.enemies.push(e);
        } else if (s.type === 'twister') {
          e = new SDD.ent.Twister(s.tx * T, (s.ty || 4) * T);
          if (s.spd) e.vx = s.spd;
          this.enemies.push(e);
        }
      }
      // Per-theme platform skin so movers don't all look like the
      // same brass plank everywhere (Mark: "all the platforms looking
      // the same on every level is a little strange"). Unknown
      // themes (or themes with no variant) fall back to the default.
      var PLAT_VARS = {
        'galactic':     null,            // keep brass plank - matches Day 1's machine
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
      this.camera = new E.Camera();
      this.camera.snap(this.player, this.map);
      // god mode: start powered up
      if (SDD.save.data.options.god && this.player) {
        this.player.grow();
        this.player.giveBlast();
      }
    },

    // ---- level callbacks used by entities ----
    spawnBlast: function (x, y, dir) { this.projectiles.push(new SDD.ent.Blast(x, y, dir)); },
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
      A.stopMusic(); A.sfx('win');
      this.burst(this.player.x + 5, this.player.y, '#ffd23a', 14);
    },

    finish: function () {
      var timeSec = Math.floor(this.timeSteps / 60);
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
      for (i = 0; i < this.platforms.length; i++) this.platforms[i].update();
      this.player.update(this);
      for (i = 0; i < this.enemies.length; i++) this.enemies[i].update(this);
      for (i = 0; i < this.items.length; i++) this.items[i].update(this);
      for (i = 0; i < this.projectiles.length; i++) this.projectiles[i].update(this);
      for (i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        p.vy += 0.13; p.x += p.vx; p.y += p.vy; p.life--;
      }
      this.collisions();
      // cull
      this.enemies = this.enemies.filter(function (e) { return !e.remove; });
      this.items = this.items.filter(function (e) { return !e.remove; });
      this.projectiles = this.projectiles.filter(function (e) { return !e.remove; });
      this.particles = this.particles.filter(function (e) { return e.life > 0; });
      this.camera.follow(this.player, this.map);
    },

    collisions: function () {
      var pl = this.player, i, e;
      // player vs enemies
      if (!pl.dead && !pl.win) {
        for (i = 0; i < this.enemies.length; i++) {
          e = this.enemies[i];
          if (e.dead || !E.overlap(pl, e)) continue;
          var stomp = e.stompable && pl.vy > 1 && (pl.y + pl.h - e.y) < 13;
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
          if (!pl.dead && !pl.win && pl.invuln <= 0 && E.overlap(pl, pr)) {
            // LavaPlume persists (it's a vertical column, not a single hit)
            if (!(pr instanceof SDD.ent.LavaPlume)) pr.remove = true;
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
        this.lives--;
        if (this.lives > 0) { this.loadLevel(); }
        else { this.state = 'gameover'; this.goTimer = 0; A.stopMusic(); A.sfx('gameover'); }
      }
    },

    updatePaused: function () {
      // listNav() writes to state.idx, but the pause scene keys off
      // pauseIdx (to avoid clobbering the level scene's own .idx).
      // Inline the nav so up/down actually moves the cursor.
      if (In.pressed('up'))   { this.pauseIdx = (this.pauseIdx + 2) % 3; A.sfx('select'); }
      if (In.pressed('down')) { this.pauseIdx = (this.pauseIdx + 1) % 3; A.sfx('select'); }
      if (In.pressed('pause')) { this.state = 'play'; A.sfx('pause'); return; }
      if (In.confirm()) {
        A.sfx('confirm');
        if (this.pauseIdx === 0) { this.state = 'play'; }
        else if (this.pauseIdx === 1) { this.loadLevel(); }
        else { A.stopMusic(); go('overworld'); }
      }
    },

    render: function (g) {
      var cam = { x: Math.round(this.camera.x), y: Math.round(this.camera.y) };
      var prog = E.clamp(this.camera.x / Math.max(1, this.map.pxW - C.VIEW_W), 0, 1);

      // per-day signature sky (falls back to the original drawSky when no theme)
      var skyFn = THEMES[this.theme];
      if (skyFn) skyFn(g, cam.x, cam.y, prog, this.timeSteps);
      else drawSky(g, cam.x, cam.y, prog, this.timeSteps);

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
      for (i = 0; i < this.enemies.length; i++) this.enemies[i].draw(g, cam);
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

      this.drawHUD(g);

      if (this.state === 'won') {
        var sf = SDD.save.stagesForDay(this.day);
        var msg = sf > 1 ? ('DAY ' + this.day + '-' + this.stage + ' COMPLETE!') : ('DAY ' + this.day + ' COMPLETE!');
        this.drawBanner(g, msg, '#ffd23a');
      }
      if (this.state === 'gameover') this.drawBanner(g, 'GAME OVER', '#ff5d4a');
      if (this.state === 'paused') this.drawPause(g);
    },

    drawHUD: function (g) {
      // taller bar so we can fit a theme-name subtitle without crowding the play area
      g.fillStyle = 'rgba(8,8,20,0.7)'; g.fillRect(0, 0, 320, 22);
      text(g, 'LIVES ' + this.lives, 6, 4, '#ffffff', 1, 'left');
      text(g, 'CORES ' + this.cores, 86, 4, '#46f0ff', 1, 'left');
      var sv = SDD.save;
      var dlabel = 'DAY ' + this.day + (sv.stagesForDay(this.day) > 1 ? '-' + this.stage : '');
      text(g, dlabel, 160, 4, '#ffd23a', 1, 'center');
      // theme name (level.name) as a small subtitle under DAY
      var L = SDD.levels[this.day + '-' + this.stage];
      if (L && L.name) text(g, L.name, 160, 14, '#dfe6ff', 1, 'center');
      var sec = Math.floor(this.timeSteps / 60);
      text(g, 'TIME ' + sec, 314, 4, '#ffffff', 1, 'right');
      if (sv.data.options.god) {
        g.fillStyle = 'rgba(255,210,80,0.85)'; g.fillRect(284, 14, 32, 8);
        text(g, 'GOD', 300, 15, '#1a1630', 1, 'center');
      }
    },

    drawBanner: function (g, msg, col) {
      g.fillStyle = 'rgba(8,8,20,0.55)'; g.fillRect(0, 70, 320, 40);
      tsh(g, msg, 160, 80, col, '#000000', 3, 'center');
    },

    drawPause: function (g) {
      g.fillStyle = 'rgba(6,6,16,0.78)'; g.fillRect(0, 0, 320, 180);
      tsh(g, 'PAUSED', 160, 40, '#ffd23a', '#a8631a', 3, 'center');
      var opts = ['RESUME', 'RESTART LEVEL', 'QUIT TO MAP'];
      for (var i = 0; i < opts.length; i++) {
        var y = 86 + i * 18, sel = i === this.pauseIdx;
        if (sel) text(g, '>', 96, y, '#ffd23a', 1, 'left');
        text(g, opts[i], 160, y, sel ? '#ffffff' : '#9aa0c4', sel ? 2 : 1, 'center');
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
      if (this.t > 30 && In.confirm()) { A.sfx('confirm'); go('overworld'); }
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
  // GAME OVER
  // =====================================================================
  SDD.scenes.gameover = {
    enter: function (d) { this.d = d || {}; this.t = 0; A.startMusic('gameover'); },
    update: function () {
      this.t++;
      if (this.t > 30 && In.confirm()) { A.sfx('confirm'); go('overworld'); }
    },
    render: function (g) {
      g.fillStyle = '#14101e'; g.fillRect(0, 0, 320, 180);
      drawStarfield(g, this.t);
      tsh(g, 'GAME OVER', 160, 52, '#ff5d4a', '#5a1810', 3, 'center');
      S.drawDanny(g, 'small', 'die', 'east', 6, 152, 92);
      text(g, "DANNY WILL TRY AGAIN!", 160, 124, '#dfe6ff', 1, 'center');
      if (this.t % 44 < 30) text(g, 'PRESS A TO RETURN TO THE MAP', 160, 150, '#ffd23a', 1, 'center');
    }
  };

  // =====================================================================
  // FINALE - grand ending cinematic played after Day 7 is completed
  // =====================================================================
  var FINALE_BEATS = [
    { lines: ['DANNY INSTALLS THE LAST', 'TIME-MACHINE PART...'] },
    { lines: ["...HE HAS WITNESSED ALL SEVEN", "DAYS OF GOD'S CREATION."] },
    { lines: ['THE TIME MACHINE ROARS TO LIFE!'] },
    { lines: ['DANNY HURTLES THROUGH TIME...'] },
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
          go('menu');
        }
      }
    },
    render: function (g) {
      var b = this.beat, t = this.t;
      // backdrop varies per beat
      var grd = g.createLinearGradient(0, 0, 0, 180);
      if (b <= 1) { grd.addColorStop(0, '#1d2a52'); grd.addColorStop(1, '#7a92c0'); }
      else if (b === 2) { grd.addColorStop(0, '#322a78'); grd.addColorStop(1, '#caa6c0'); }
      else if (b === 3) {
        // swirling time-travel: rapidly shifting bands
        var k = (t / 4) % 1;
        grd.addColorStop(0, 'hsl(' + Math.floor(t * 6) + ',70%,40%)');
        grd.addColorStop(1, 'hsl(' + Math.floor(t * 6 + 120) + ',70%,60%)');
      } else if (b === 4) { grd.addColorStop(0, '#1a2238'); grd.addColorStop(1, '#3a4870'); }
      else { grd.addColorStop(0, '#142b40'); grd.addColorStop(1, '#e8c878'); }
      g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
      if (b <= 1 || b === 4 || b === 5) drawStarfield(g, this.t);

      // shared time-machine drawing
      function machine(g, x, y, glow, broken, glowStrong) {
        g.fillStyle = '#3b4a6a'; g.fillRect(x, y, 56, 44);
        g.fillStyle = '#586a92'; g.fillRect(x + 3, y + 3, 50, 24);
        g.fillStyle = glow ? '#bff0ff' : '#23304a'; g.fillRect(x + 7, y + 7, 42, 16);
        g.fillStyle = '#2a3550'; g.fillRect(x, y + 44, 56, 6);
        g.fillStyle = glow ? '#ffe893' : '#7a8bb0';
        g.beginPath(); g.arc(x + 28, y + 3, 14, Math.PI, 0); g.fill();
        if (glowStrong) {
          g.fillStyle = 'rgba(255,236,170,0.45)';
          g.fillRect(x - 14, y - 12, 84, 6);
          g.fillRect(x - 6, y - 22, 68, 4);
        }
      }

      var idleIdx = Math.floor(t / 18) % 4;
      if (b === 0) {
        machine(g, 132, 84, false, false, false);
        S.drawDanny(g, 'big', 'idle', 'east', idleIdx, 100, 102);
        text(g, "DANNY'S LAB", 160, 24, '#cdd6e6', 1, 'center');
      } else if (b === 1) {
        machine(g, 132, 84, (t % 24 < 12), false, false);
        S.drawDanny(g, 'big', 'idle', 'east', idleIdx, 100, 102);
      } else if (b === 2) {
        // machine glowing intensely
        machine(g, 132, 84, true, false, true);
        electricArcs(g, 160, 105, t, 6, 48);
        if (t % 22 < 10) { g.fillStyle = 'rgba(190,240,255,0.14)'; g.fillRect(0, 0, 320, 180); }
        S.drawDanny(g, 'big', 'celebrate', 'south', Math.floor(t / 5) % 9, 100, 102);
      } else if (b === 3) {
        // swirl
        for (var i = 0; i < 28; i++) {
          var a = (t * 0.04 + i * 0.224) % 6.28;
          var r = 8 + (i * 4 + t * 1.2) % 160;
          var cx = 160 + Math.cos(a) * r, cy = 90 + Math.sin(a) * r * 0.7;
          g.fillStyle = 'hsl(' + Math.floor(a * 80 + t * 4) + ',80%,75%)';
          g.fillRect(cx, cy, 3, 3);
        }
        S.drawDanny(g, 'big', 'jump', 'east', 3, 144, 70 + Math.sin(t * 0.2) * 10);
      } else if (b === 4) {
        // arrived in lab
        machine(g, 132, 84, false, false, false);
        S.drawDanny(g, 'big', 'celebrate', 'south', Math.floor(t / 5) % 9, 168, 102);
        // lab floor + door
        g.fillStyle = '#3a435c'; g.fillRect(0, 146, 320, 34);
        g.fillStyle = '#2a3350'; g.fillRect(40, 100, 24, 46);
      } else {
        // The End card
        tsh(g, 'THE END', 160, 60, '#ffd23a', '#a8631a', 5, 'center');
        text(g, "DANNY'S CREATION ADVENTURE", 160, 110, '#1a1630', 1, 'center');
        text(g, "IS COMPLETE", 160, 122, '#1a1630', 1, 'center');
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
})();
