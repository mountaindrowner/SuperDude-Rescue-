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
  // 5-second title card: 60 frames fade-in -> 180 frames hold ->
  // 60 frames fade-out. Uses assets/title.png when present; falls
  // back to the placeholder logo when not so the game still runs
  // before the art is dropped in.
  SDD.scenes.logo = {
    enter: function () {
      this.t = 0; this.phase = 'in'; this.alpha = 0; this.chirped = false;
    },
    update: function () {
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
      g.save();
      g.globalAlpha = this.alpha;
      g.imageSmoothingEnabled = false;
      if (ART_TITLE.ok) {
        // Painted card fills the full 16:9 canvas.
        g.drawImage(ART_TITLE.img, 0, 0, 320, 180);
      } else {
        var logo = S.hasRealLogo() ? S.realLogo() : S.get('logoPlaceholder');
        if (logo) {
          var maxW = 240, maxH = 120;
          var sc = Math.min(maxW / logo.width, maxH / logo.height);
          var w = logo.width * sc, h = logo.height * sc;
          g.drawImage(logo, (320 - w) / 2, (180 - h) / 2 - 6, w, h);
        }
        g.globalAlpha = this.alpha * 0.7;
        text(g, 'PRESENTS', 160, 158, '#8a93b5', 1, 'center');
      }
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
    enter: function () { this.beat = 0; this.t = 0; },
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
            // Warm dome glow at the top of the machine + soft cyan
            // halo around the body.
            g.fillStyle = 'rgba(255,232,147,0.50)';
            g.beginPath(); g.arc(cx, my + 12, mw * 0.45, 0, Math.PI * 2); g.fill();
            g.fillStyle = 'rgba(190,240,255,0.22)';
            g.fillRect(mx - 6, my - 6, mw + 12, mh + 12);
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
      A.startMusic('title');
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
        var y = 110 + i * 16;
        var sel = i === this.idx;
        if (sel) text(g, '>', 110, y, '#ffd23a', 1, 'left');
        text(g, this.items[i].label, 160, y, sel ? '#ffffff' : '#9aa0c4', sel ? 2 : 1, 'center');
      }
      // Shorter tagline so it fits cleanly under the menu items.
      if (this.t % 50 < 34) text(g, 'A CREATION ADVENTURE', 160, 172, '#aab0d4', 1, 'center');
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
      // Danny glides to where his feet should rest on the selected island
      this.dannyX += (STAGES[this.idx].x  - this.dannyX) * 0.25;
      this.dannyY += (STAGES[this.idx].dy - this.dannyY) * 0.25;
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
  function puff(g, x, y, s) {
    g.beginPath();
    g.arc(x, y, 7 * s, 0, 6.29);
    g.arc(x + 9 * s, y + 2 * s, 9 * s, 0, 6.29);
    g.arc(x + 20 * s, y, 6.5 * s, 0, 6.29);
    g.arc(x + 11 * s, y - 5 * s, 7 * s, 0, 6.29);
    g.fill();
  }
  function drawCloud(g, x, y, s, alpha) {
    g.save();
    g.globalAlpha = alpha * 0.8;
    g.fillStyle = '#c6d2ea'; puff(g, x, y + 2.5 * s, s);
    g.globalAlpha = alpha;
    g.fillStyle = '#ffffff'; puff(g, x, y, s);
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
      drawCloud(g, cx, c.y + camy * 0.04, c.s, alpha);
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
    vGradient(g, '#7ec0f0', '#3a86d6', '#d8c490');
    g.fillStyle = '#5fa0e6';
    for (var i = 0; i < 320; i += 14) {
      g.fillRect(((i + (t / 8) % 14) | 0), 108, 7, 1);
    }
    driftClouds(g, camx, camy, 0.6);
    for (var f = 0; f < 4; f++) {
      var fx = ((f * 80 + t * 0.3) % 320);
      var fy = 130 + Math.sin(t * 0.1 + f) * 2;
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
  function drawSky_forest(g, camx, camy, prog, t) {
    // Layered forest: bright sky -> distant mountains -> mid pines ->
    // near pines -> dense undergrowth, with sun shafts cutting through.
    vGradient(g, '#88c4f0', '#cdf0e6');                 // pale sky
    // Far mountains (very low parallax)
    mountainRidge(g, camx, 0.08, 168, '#5f7a5e', 80);
    mountainRidge(g, camx, 0.14, 172, '#4a6248', 60);
    // Sun shafts through the canopy
    for (var s = 0; s < 4; s++) {
      var sx = 50 + s * 80 + Math.sin(t * 0.015 + s) * 6 - (camx * 0.3) % 320;
      sx = ((sx % 380) + 380) % 380 - 30;
      g.fillStyle = 'rgba(255,250,200,0.10)';
      g.beginPath();
      g.moveTo(sx, 0); g.lineTo(sx + 22, 0);
      g.lineTo(sx + 34, 180); g.lineTo(sx - 8, 180);
      g.closePath(); g.fill();
    }
    // Mid pine layer
    pineRow(g, camx, 0.22, 174, '#2a5a26', 1.0);
    // Near pine layer - bigger + darker
    pineRow(g, camx, 0.45, 180, '#143818', 1.3);
    // Dense underbrush at the very bottom
    g.fillStyle = '#0e2810';
    g.fillRect(0, 176, 320, 4);
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
  function drawSky_bird_sky(g, camx, camy, prog, t) {
    vGradient(g, '#70bce0', '#bce0f0');
    driftClouds(g, camx, camy, 0.5);
    for (var i = 0; i < 8; i++) {
      var bx = ((i * 53 - camx * 0.15 + t * 0.2) % 320 + 320) % 320;
      var by = 30 + (i * 13) % 60;
      g.strokeStyle = '#26486a'; g.lineWidth = 1;
      g.beginPath();
      g.moveTo(bx - 3, by + 2); g.lineTo(bx, by); g.lineTo(bx + 3, by + 2);
      g.stroke();
    }
  }
  function drawSky_seaside(g, camx, camy, prog, t) {
    vGradient(g, '#5fa0e6', '#1a5080');
    for (var i = 0; i < 320; i += 18) {
      g.fillStyle = 'rgba(255,255,255,0.16)';
      g.fillRect((((i + t * 0.4) % 320) | 0), 90 + (i % 50), 9, 1);
    }
    g.fillStyle = '#3a2860';
    for (var c = 0; c < 4; c++) {
      var cX = c * 80 + 20;
      g.beginPath();
      g.moveTo(cX, 178);
      g.lineTo(cX + 4, 150); g.lineTo(cX + 10, 160); g.lineTo(cX + 14, 145);
      g.lineTo(cX + 20, 155); g.lineTo(cX + 26, 178);
      g.fill();
    }
  }
  function drawSky_savanna(g, camx, camy, prog, t) {
    vGradient(g, '#f8a648', '#ffd58a');
    simpleSun(g, 240, 60, 22, '#ffe080', false);
    for (var i = 0; i < 6; i++) {
      var tx = ((i * 70 - camx * 0.18) % 320 + 320) % 320;
      g.fillStyle = '#3a2818';
      g.fillRect(tx + 5, 128, 2, 22);
      g.beginPath();
      g.ellipse(tx + 6, 126, 12, 4, 0, 0, 6.28);
      g.fill();
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
      A.startMusic('level');
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
        'sea-surface':  { walker: 'cloud', wisp: 'bird', thrower: 'rain' },
        'rocky':        { walker: 'rock',  wisp: 'leaf', thrower: 'rock' },
        'forest':       { walker: 'leaf',  wisp: 'leaf', thrower: 'seed' },
        'sunlit':       { walker: 'flame', wisp: 'star', thrower: 'sun'  },
        'cosmic-night': { walker: null,    wisp: 'star', thrower: null   },
        'bird-sky':     { walker: 'cloud', wisp: 'bird', thrower: 'rain' },
        'seaside':      { walker: 'cloud', wisp: 'bird', thrower: 'rain' },
        'savanna':      { walker: 'rock',  wisp: 'bird', thrower: 'rock' },
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
          e.variant = variants.walker;
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
          if (s.shoots) e.shoots = true;
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
          e = new SDD.ent.TimePart(0, 0);
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
          this.enemies.push(e);
        }
      }
      for (var m = 0; m < L.movers.length; m++) {
        var mv = L.movers[m];
        this.platforms.push(new SDD.ent.MovPlat(mv.tx * T, mv.ty * T,
          { x1: mv.tx1 * T, y1: mv.ty1 * T, spd: mv.spd, phase: mv.phase }));
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
        this.map.set(tx, ty, 'U'); this.cores++; this.score += 50;
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
            e.remove = true; this.cores++; this.score += 50;
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
            this.cores += 3; this.score += 150;
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
      listNav(this, 3);
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
      A.startMusic('overworld');
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
      S.drawDanny(g, 'big', 'celebrate', 'south', Math.floor(this.t / 5) % 9, 144, 40 + Math.sin(this.t * 0.1) * 3);

      var sv = SDD.save.data, key = day + '-' + stage;
      var bestT = sv.bestTimes && sv.bestTimes[key];
      var bestC = (sv.bestCores && sv.bestCores[key]) || 0;
      // Tightened block - no LIVES LEFT row, no spacer; four contiguous
      // rows starting higher up. Was line-height 11 starting at y=104.
      var rows = [
        'TIME           ' + this.d.timeSec + ' SEC',
        'POWER CORES    ' + this.d.cores,
        'BEST TIME      ' + (bestT != null ? bestT + ' SEC' : '-'),
        'BEST CORES     ' + bestC
      ];
      for (var i = 0; i < rows.length; i++) text(g, rows[i], 70, 92 + i * 11, '#1a1630', 1, 'left');
      if (this.t % 44 < 30) text(g, 'PRESS A TO RETURN TO THE MAP', 160, 168, '#1a1630', 1, 'center');
    }
  };

  // =====================================================================
  // GAME OVER
  // =====================================================================
  SDD.scenes.gameover = {
    enter: function (d) { this.d = d || {}; this.t = 0; },
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
      A.startMusic('title');
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
