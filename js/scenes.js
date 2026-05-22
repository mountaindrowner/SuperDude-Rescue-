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
  SDD.scenes.logo = {
    enter: function () {
      this.t = 0; this.phase = 'in'; this.alpha = 0; this.chirped = false;
    },
    update: function () {
      this.t++;
      if (!this.chirped && this.t > 6) { A.sfx('chirp'); this.chirped = true; }
      if (this.phase === 'in') {
        this.alpha += 0.03;
        if (this.alpha >= 1) { this.alpha = 1; this.phase = 'hold'; this.t = 0; }
      } else if (this.phase === 'hold') {
        if (this.t > 80) this.phase = 'out';
      } else {
        this.alpha -= 0.03;
        if (this.alpha <= 0) { this.alpha = 0; go('menu'); return; }
      }
      if (In.confirm() && this.phase !== 'out') { this.phase = 'out'; }
    },
    render: function (g) {
      g.fillStyle = '#05050d'; g.fillRect(0, 0, 320, 180);
      g.save();
      g.globalAlpha = this.alpha;
      var logo = S.hasRealLogo() ? S.realLogo() : S.get('logoPlaceholder');
      if (logo) {
        var maxW = 240, maxH = 120;
        var sc = Math.min(maxW / logo.width, maxH / logo.height);
        var w = logo.width * sc, h = logo.height * sc;
        g.imageSmoothingEnabled = false;
        g.drawImage(logo, (320 - w) / 2, (180 - h) / 2 - 6, w, h);
      }
      g.restore();
      g.globalAlpha = this.alpha * 0.7;
      text(g, 'PRESENTS', 160, 158, '#8a93b5', 1, 'center');
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
      if (b < 2) { g.fillStyle = '#14121f'; g.fillRect(0, 0, 320, 180); }
      else { var grd = g.createLinearGradient(0, 0, 0, 180); grd.addColorStop(0, '#3a2c66'); grd.addColorStop(1, '#caa6c0'); g.fillStyle = grd; g.fillRect(0, 0, 320, 180); }

      // time machine
      function machine(g, x, y, glow, broken) {
        g.fillStyle = '#3b4a6a'; g.fillRect(x, y, 46, 40);
        g.fillStyle = '#586a92'; g.fillRect(x + 3, y + 3, 40, 22);
        g.fillStyle = glow ? '#bff0ff' : '#23304a'; g.fillRect(x + 7, y + 7, 32, 14);
        g.fillStyle = '#2a3550'; g.fillRect(x, y + 40, 46, 6);
        // dome
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
      var sprName = 'danny_small_idle_r';
      if (b === 0) {
        machine(g, 150, 96, false, false);
        g.drawImage(S.get(sprName), 96, 116);
        text(g, 'THE LAB - PRESENT DAY', 160, 26, '#9aa6c8', 1, 'center');
      } else if (b === 1) {
        machine(g, 138, 92, (t % 16 < 8), false);
        g.drawImage(S.get('danny_small_jump_r'), 100, 116);
      } else if (b === 2) {
        if (t % 8 < 4) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 320, 180); }
        machine(g, 138, 92, true, false);
        g.drawImage(S.get('danny_small_hurt_l'), 150, 70 + Math.sin(t * 0.2) * 6);
      } else {
        machine(g, 150, 100, false, true);
        g.drawImage(S.get(sprName), 96, 124);
        // dawn ground
        g.fillStyle = '#86cf45'; g.fillRect(0, 150, 320, 30);
        g.fillStyle = '#ffd23a';
        g.beginPath(); g.arc(260, 150, 26, Math.PI, 0); g.fill();
      }

      // caption box
      var lines = INTRO_BEATS[b] ? INTRO_BEATS[b].lines : [];
      var bh = 16 + lines.length * 11;
      g.fillStyle = 'rgba(8,8,20,0.86)'; g.fillRect(10, 178 - bh - 6, 300, bh);
      g.strokeStyle = '#ffd23a'; g.strokeRect(10.5, 178 - bh - 5.5, 299, bh - 1);
      for (var i = 0; i < lines.length; i++) {
        text(g, lines[i], 160, 178 - bh + 2 + i * 11, '#ffffff', 1, 'center');
      }
      if (t % 40 < 26) text(g, 'PRESS A', 304, 168, '#ffd23a', 1, 'right');
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
      g.drawImage(S.get('danny_big_idle_r'), 40, 96);

      for (var i = 0; i < this.items.length; i++) {
        var y = 104 + i * 16;
        var sel = i === this.idx;
        if (sel) text(g, '>', 110, y, '#ffd23a', 1, 'left');
        text(g, this.items[i].label, 160, y, sel ? '#ffffff' : '#9aa0c4', sel ? 2 : 1, 'center');
      }
      if (this.t % 50 < 34) text(g, 'A SEVEN DAYS OF CREATION ADVENTURE', 160, 170, '#aab0d4', 1, 'center');
    }
  };

  // =====================================================================
  // OPTIONS
  // =====================================================================
  SDD.scenes.options = {
    enter: function (d) { this.from = (d && d.from) || 'menu'; this.idx = 0; this.t = 0; },
    update: function () {
      this.t++;
      listNav(this, 3);
      var o = SDD.save.data.options;
      if (this.idx === 0 && In.confirm()) {
        o.muted = !o.muted; A.setMuted(o.muted); SDD.save.save();
        if (!o.muted) A.sfx('confirm');
      }
      if (this.idx === 1) {
        if (In.pressed('left')) { o.volume = Math.max(0, o.volume - 0.1); A.setVolume(o.volume); A.sfx('select'); SDD.save.save(); }
        if (In.pressed('right')) { o.volume = Math.min(1, o.volume + 0.1); A.setVolume(o.volume); A.sfx('select'); SDD.save.save(); }
      }
      if (this.idx === 2 && In.confirm()) { A.sfx('confirm'); go(this.from); }
      if (In.pressed('pause')) { A.sfx('confirm'); go(this.from); }
    },
    render: function (g) {
      g.fillStyle = '#1a1640'; g.fillRect(0, 0, 320, 180);
      drawStarfield(g, this.t);
      tsh(g, 'OPTIONS', 160, 26, '#ffd23a', '#a8631a', 3, 'center');
      var o = SDD.save.data.options;
      var rows = [
        'SOUND:  ' + (o.muted ? 'OFF' : 'ON'),
        'VOLUME: ' + ('[' + repeat('=', Math.round(o.volume * 10)) + repeat('.', 10 - Math.round(o.volume * 10)) + ']'),
        'BACK'
      ];
      for (var i = 0; i < rows.length; i++) {
        var y = 76 + i * 22, sel = i === this.idx;
        if (sel) text(g, '>', 60, y, '#ffd23a', 1, 'left');
        text(g, rows[i], 76, y, sel ? '#ffffff' : '#9aa0c4', 1, 'left');
      }
      text(g, 'ARROWS TO CHANGE   A TO CONFIRM', 160, 158, '#8a90b4', 1, 'center');
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
  // OVERWORLD - 7-day creation map
  // =====================================================================
  var DAYS = [
    { n: 1, name: 'LIGHT & DARKNESS' },
    { n: 2, name: 'SKY & WATERS' },
    { n: 3, name: 'LAND & PLANTS' },
    { n: 4, name: 'SUN, MOON & STARS' },
    { n: 5, name: 'BIRDS & SEA LIFE' },
    { n: 6, name: 'ANIMALS & MANKIND' },
    { n: 7, name: 'DAY OF REST' }
  ];
  var NODES = [
    { x: 38, y: 122 }, { x: 78, y: 96 }, { x: 116, y: 130 }, { x: 158, y: 92 },
    { x: 198, y: 126 }, { x: 240, y: 96 }, { x: 282, y: 120 }
  ];
  SDD.scenes.overworld = {
    enter: function () {
      this.t = 0;
      this.idx = 0;
      this.msg = ''; this.msgT = 0;
      this.dannyX = NODES[0].x; this.dannyY = NODES[0].y;
      A.startMusic('overworld');
    },
    update: function () {
      this.t++;
      if (this.msgT > 0) this.msgT--;
      if (In.pressed('left') && this.idx > 0) { this.idx--; A.sfx('select'); }
      if (In.pressed('right') && this.idx < 6) { this.idx++; A.sfx('select'); }
      // danny glides to the selected node
      this.dannyX += (NODES[this.idx].x - this.dannyX) * 0.25;
      this.dannyY += (NODES[this.idx].y - this.dannyY) * 0.25;
      if (In.confirm()) {
        var day = this.idx + 1;
        var unlocked = SDD.save.data.unlockedDay;
        if (day > unlocked) { this.msg = 'THAT DAY IS LOCKED'; this.msgT = 110; A.sfx('bump'); }
        else {
          var stage = SDD.save.nextStage(day);
          var key = day + '-' + stage;
          if (SDD.levels && SDD.levels[key]) { A.sfx('enter'); go('level', { day: day, stage: stage }); }
          else { this.msg = 'DAY ' + day + ' - COMING SOON!'; this.msgT = 130; A.sfx('bump'); }
        }
      }
      if (In.pressed('pause')) { A.sfx('confirm'); go('menu'); }
    },
    render: function (g) {
      var grd = g.createLinearGradient(0, 0, 0, 180);
      grd.addColorStop(0, '#243a6e'); grd.addColorStop(1, '#6fae8a');
      g.fillStyle = grd; g.fillRect(0, 0, 320, 180);
      drawStarfield(g, this.t);
      // path
      g.strokeStyle = 'rgba(255,230,150,0.7)'; g.lineWidth = 3;
      g.setLineDash([4, 4]);
      g.beginPath();
      g.moveTo(NODES[0].x, NODES[0].y);
      for (var p = 1; p < NODES.length; p++) g.lineTo(NODES[p].x, NODES[p].y);
      g.stroke();
      g.setLineDash([]);
      // nodes
      var unlocked = SDD.save.data.unlockedDay;
      for (var i = 0; i < NODES.length; i++) {
        var nd = NODES[i], open = (i + 1) <= unlocked;
        var done = SDD.save.data.completedDays.indexOf(i + 1) >= 0;
        g.fillStyle = open ? (done ? '#7dff9a' : '#ffd23a') : '#5a5f78';
        g.beginPath(); g.arc(nd.x, nd.y, 9, 0, Math.PI * 2); g.fill();
        g.fillStyle = open ? '#1a1640' : '#34384c';
        text(g, '' + (i + 1), nd.x, nd.y - 3, open ? '#1a1640' : '#9498ac', 1, 'center');
        if (!open) {
          g.fillStyle = '#cdd2e4'; g.fillRect(nd.x - 3, nd.y + 6, 6, 5);
          g.fillRect(nd.x - 2, nd.y + 3, 4, 3);
        }
        if (i === this.idx) {
          g.strokeStyle = '#ffffff'; g.lineWidth = 1;
          g.strokeRect(nd.x - 12, nd.y - 12, 24, 24);
        }
      }
      // danny on the map
      g.drawImage(S.get('danny_small_idle_r'), this.dannyX - 8, this.dannyY - 26 + Math.sin(this.t * 0.1) * 1.5);

      // header / selected day info
      g.fillStyle = 'rgba(8,8,20,0.8)'; g.fillRect(0, 0, 320, 22);
      text(g, 'CREATION MAP', 8, 8, '#ffd23a', 1, 'left');
      var sel = DAYS[this.idx];
      var openSel = (this.idx + 1) <= unlocked;
      text(g, 'DAY ' + sel.n + ': ' + sel.name, 312, 8, openSel ? '#ffffff' : '#8a90b4', 1, 'right');
      // footer
      g.fillStyle = 'rgba(8,8,20,0.8)'; g.fillRect(0, 160, 320, 20);
      if (this.msgT > 0) text(g, this.msg, 160, 166, '#ff8a6a', 1, 'center');
      else text(g, 'ARROWS: CHOOSE DAY    A: ENTER', 160, 166, '#dfe6ff', 1, 'center');
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
      this.enemies = []; this.platforms = []; this.items = [];
      this.projectiles = []; this.particles = [];
      this.cores = 0; this.score = 0; this.timeSteps = 0;
      this.state = 'play'; this.deathHandled = false;
      this.winTimer = 0; this.goTimer = 0;
      this.pauseIdx = 0;

      for (var i = 0; i < L.spawns.length; i++) {
        var s = L.spawns[i], e;
        if (s.type === 'player') {
          e = new SDD.ent.Player(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          this.player = e;
        } else if (s.type === 'walker') {
          e = new SDD.ent.Walker(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          this.enemies.push(e);
        } else if (s.type === 'thrower') {
          e = new SDD.ent.Thrower(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h;
          this.enemies.push(e);
        } else if (s.type === 'wisp') {
          e = new SDD.ent.Wisp(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = s.ty * T + 8 - e.h / 2;
          e.homeY = e.y; e.minX = e.x - 26; e.maxX = e.x + 26;
          this.enemies.push(e);
        } else if (s.type === 'core') {
          e = new SDD.ent.Core(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = s.ty * T + 8 - e.h / 2; e.baseY = e.y;
          this.items.push(e);
        } else if (s.type === 'timepart') {
          e = new SDD.ent.TimePart(0, 0);
          e.x = s.tx * T + 8 - e.w / 2; e.y = (s.ty + 1) * T - e.h; e.baseY = e.y;
          this.items.push(e);
        }
      }
      for (var m = 0; m < L.movers.length; m++) {
        var mv = L.movers[m];
        this.platforms.push(new SDD.ent.MovPlat(mv.tx * T, mv.ty * T,
          { x1: mv.tx1 * T, y1: mv.ty1 * T, spd: mv.spd, phase: mv.phase }));
      }
      this.camera = new E.Camera();
      this.camera.snap(this.player, this.map);
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
      go('results', {
        day: this.day, stage: this.stage,
        timeSec: timeSec, cores: this.cores, lives: this.lives
      });
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
        } else if (pr instanceof SDD.ent.Orb) {
          if (!pl.dead && !pl.win && pl.invuln <= 0 && E.overlap(pl, pr)) {
            pr.remove = true;
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

      // cosmetic light/dark theme - the sky brightens as Danny progresses
      drawSky(g, cam.x, cam.y, prog, this.timeSteps);

      // tiles
      var T = C.TILE;
      var t0x = Math.max(0, Math.floor(cam.x / T)), t1x = Math.min(this.map.w - 1, Math.ceil((cam.x + 320) / T));
      var t0y = Math.max(0, Math.floor(cam.y / T)), t1y = Math.min(this.map.h - 1, Math.ceil((cam.y + 180) / T));
      for (var ty = t0y; ty <= t1y; ty++) {
        for (var tx = t0x; tx <= t1x; tx++) {
          var code = this.map.get(tx, ty), name = null;
          if (code === 'X') name = this.map.isSolid(tx, ty - 1) ? 'tile_dirt' : 'tile_ground';
          else if (code === '#') name = 'tile_brick';
          else if (code === '=') name = 'tile_platform';
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
      g.fillStyle = 'rgba(8,8,20,0.6)'; g.fillRect(0, 0, 320, 14);
      text(g, 'LIVES ' + this.lives, 6, 4, '#ffffff', 1, 'left');
      text(g, 'CORES ' + this.cores, 86, 4, '#46f0ff', 1, 'left');
      var sv = SDD.save;
      var dlabel = 'DAY ' + this.day + (sv.stagesForDay(this.day) > 1 ? '-' + this.stage : '');
      text(g, dlabel, 160, 4, '#ffd23a', 1, 'center');
      var sec = Math.floor(this.timeSteps / 60);
      text(g, 'TIME ' + sec, 314, 4, '#ffffff', 1, 'right');
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
      tsh(g, title, 160, 24, '#ffffff', '#a8631a', 3, 'center');
      g.drawImage(S.get('danny_big_jump_r'), 144, 58 + Math.sin(this.t * 0.1) * 3);

      var sv = SDD.save.data, key = day + '-' + stage;
      var bestT = sv.bestTimes && sv.bestTimes[key];
      var bestC = (sv.bestCores && sv.bestCores[key]) || 0;
      var rows = [
        'TIME           ' + this.d.timeSec + ' SEC',
        'POWER CORES    ' + this.d.cores,
        'LIVES LEFT     ' + this.d.lives,
        '',
        'BEST TIME      ' + (bestT != null ? bestT + ' SEC' : '-'),
        'BEST CORES     ' + bestC
      ];
      for (var i = 0; i < rows.length; i++) text(g, rows[i], 70, 104 + i * 11, '#1a1630', 1, 'left');
      if (this.t % 44 < 30) text(g, 'PRESS A TO RETURN TO THE MAP', 160, 172, '#1a1630', 1, 'center');
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
      g.drawImage(S.get('danny_small_hurt_r'), 152, 92);
      text(g, "DANNY WILL TRY AGAIN!", 160, 124, '#dfe6ff', 1, 'center');
      if (this.t % 44 < 30) text(g, 'PRESS A TO RETURN TO THE MAP', 160, 150, '#ffd23a', 1, 'center');
    }
  };
})();
