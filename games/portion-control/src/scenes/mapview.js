// mapview.js - PC_MapView (v0.29.0). Mark: "put a map view when the
// player presses pause or goes to the menu for story mode - it'll help
// with navigation."
//
// The maps are 7680px square and the camera only shows ~400 of that, so
// the compass arrow alone can't answer "where am I and what's around
// me." This is a SCHEMATIC of the whole district drawn from the layout
// engine's own geometry - park paths, suburb streets, labs service
// roads, city grid - so each district reads as itself at a glance.
//
// Two ways in:
//   in a run  -> the [MAP] button / M / ESC pauses and opens it as an
//                overlay ({overlay:true, resume:'PC_Game'}); shows YOU,
//                the live objective, the shops and the mission board.
//   from the  -> the mission map's MAP button ({back:'PC_Missions',
//   menu         mapId}); shows the district you're about to play with
//                its full beat route, no live player.
window.PC = window.PC || {};

PC.MapViewScene = function () { Phaser.Scene.call(this, { key: 'PC_MapView' }); };
PC.MapViewScene.prototype = Object.create(Phaser.Scene.prototype);
PC.MapViewScene.prototype.constructor = PC.MapViewScene;

PC.MapViewScene.prototype.init = function (data) {
  data = data || {};
  this._overlay = !!data.overlay;
  this._resume = data.resume || 'PC_Game';
  this._back = data.back || 'PC_Missions';
  this._mapId = data.mapId || null;
  this._missionId = data.missionId || null;
};

PC.MapViewScene.prototype.close = function () {
  if (PC.audio) PC.audio.ui();
  if (this._overlay) {
    this.scene.stop();
    this.scene.resume(this._resume);
    return;
  }
  this.scene.start(this._back);
};

PC.MapViewScene.prototype.create = function () {
  PC.applyRenderScale(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this, K = PC.uiK;
  this.cameras.main.setBackgroundColor(0x120e24);

  // ---- resolve what we're looking at -------------------------------
  var game = this._overlay ? this.scene.get('PC_Game') : null;
  var region = null, def = null;
  if (game && game.region) { region = game.region; def = region.def; }
  else {
    def = PC.STORY.maps[this._mapId] || PC.STORY.maps.central;
    region = new PC.Region(def);          // read-only: never installRegion
  }
  var layout = region.layout;
  var quest = game && game.quest;
  var mission = (quest && quest.mission) ||
                (this._missionId && PC.STORY.missions[this._missionId]) || null;
  var beatIdx = quest ? quest.idx : -1;      // -1 = previewing from the menu

  // ---- chrome: header ----------------------------------------------
  var hdrH = K(32);
  var hdr = this.add.graphics();
  PC.labPanel(hdr, 4, 4, W - 8, hdrH, { rivets: true, base: 0x1c1733, edge: 0x6d6a8e });
  PC.ui.text(this, W / 2, 4 + K(4), def.name, 'label',
    { color: '#f2c33c', align: 'center' }).setOrigin(0.5, 0);
  var sub = this._overlay ? (game && game.freeRoam ? 'FREE ROAM' : 'PAUSED')
                          : (mission ? mission.name : 'DISTRICT MAP');
  PC.ui.text(this, W / 2, 4 + K(19), sub, 'caption',
    { color: '#6d6a8e', align: 'center' }).setOrigin(0.5, 0);

  // ---- the map square ----------------------------------------------
  var footer = K(34);                      // the RESUME button strip
  var strip = K(26);                       // the objective line
  var rowH = K(13);
  var legendH = Math.ceil(region.marks.length / 2) * rowH + K(8);
  var beatsH = mission ? (mission.objectives.length * rowH + K(22)) : 0;
  var avail = H - hdrH - footer - strip - legendH - beatsH - K(26);
  var size = Math.min(W - K(10), avail);
  size = Math.max(size, K(150));
  // the map is square, so on a tall phone the width caps it - centre the
  // whole stack in the leftover instead of pooling it above RESUME
  var slack = Math.max(0, avail - size);
  var ox = Math.round((W - size) / 2);
  var oy = Math.round(4 + hdrH + K(8) + slack / 2);
  var k = size / region.size;              // world px -> screen px
  function mx(wx) { return ox + wx * k; }
  function my(wy) { return oy + wy * k; }

  var g = this.add.graphics();
  this._paintBase(g, def, ox, oy, size);
  this._paintRoads(g, region, layout, def, ox, oy, k);

  // ---- landmarks: pin + index number, legend below -------------------
  var marks = region.marks;
  var objMk = null, objIdx = -1;
  if (mission) {
    // in a run: the live beat. from the menu: where the mission starts.
    var ob = mission.objectives[beatIdx >= 0 ? beatIdx : 0];
    if (ob) {
      var atId = ob.at || (ob.items && ob.items[0] && ob.items[0].at);
      for (var mi = 0; mi < marks.length; mi++) if (marks[mi].id === atId) { objMk = marks[mi]; objIdx = mi; }
    }
  }
  // walk-in storefronts wear their glyph INSTEAD of an index number -
  // one chip per lot, no stacked markers
  var doorGlyph = {};
  if (game && game.doors) game.doors.spots.forEach(function (s) {
    doorGlyph[s.def.at] = { ch: s.def.scene === 'PC_Shop' ? '$' : 'G', col: s.def.color };
  });
  marks.forEach(function (mk, i) {
    var x = mx(mk.x), y = my(mk.y), w = Math.max(K(5), mk.w * k), h = Math.max(K(5), mk.h * k);
    g.fillStyle(PC.hexNum(mk.color), mk.open ? 0.5 : 0.85);
    g.fillRect(x, y, w, h);
    g.lineStyle(2, PC.hexNum(mk.accent), i === objIdx ? 1 : 0.7);
    g.strokeRect(x, y, w, h);
    // index chip centred on the lot
    var d = doorGlyph[mk.id];
    var cx = x + w / 2, cy = y + h / 2;
    g.fillStyle(0x120e24, 0.9); g.fillCircle(cx, cy, K(7));
    g.lineStyle(2, i === objIdx ? 0xf2c33c : (d ? d.col : PC.hexNum(mk.accent)), 1);
    g.strokeCircle(cx, cy, K(7));
    PC.ui.text(self, cx, cy, d ? d.ch : String(i + 1), 'micro',
      { color: i === objIdx ? '#f2c33c'
             : (d ? '#' + ('00000' + d.col.toString(16)).slice(-6) : '#f7f4ef') })
      .setOrigin(0.5);
  });

  // ---- live markers: objective, doors, board, player -----------------
  if (objMk) {
    var t = (quest && quest.targetXY()) || { x: objMk.cx, y: objMk.cy };
    this._pulseRing(mx(t.x), my(t.y), K(11), 0xf2c33c);
  }
  if (game && game.freeRoam && game.freeRoam.tx !== undefined) {
    var fr = game.freeRoam;
    this._pulseRing(mx(fr.tx), my(fr.ty), K(10), 0xa8e04a);
    PC.ui.text(this, mx(fr.tx), my(fr.ty) - K(13), 'NEXT', 'micro',
      { color: '#a8e04a', onWorld: true }).setOrigin(0.5);
  }
  if (game) {
    var px = mx(game.px), py = my(game.py);
    g.fillStyle(0x0b0818, 0.9); g.fillCircle(px, py, K(7));
    g.fillStyle(0xa8e04a, 1); g.fillCircle(px, py, K(4.5));
    g.fillStyle(0xf7f4ef, 1); g.fillCircle(px - K(1), py - K(1), K(1.6));
    var ping = this.add.circle(px, py, K(5), 0xa8e04a, 0).setStrokeStyle(2, 0xa8e04a, 0.9);
    this.tweens.add({ targets: ping, radius: K(15), alpha: 0, duration: 1200, repeat: -1 });
  } else if (region.spawnX !== undefined) {
    g.fillStyle(0xa8e04a, 1); g.fillCircle(mx(region.spawnX), my(region.spawnY), K(4.5));
    PC.ui.text(this, mx(region.spawnX), my(region.spawnY) - K(12), 'START', 'micro',
      { color: '#a8e04a', onWorld: true }).setOrigin(0.5);
  }
  // map frame last so nothing spills over the edge
  g.lineStyle(2, 0x6d6a8e, 0.9); g.strokeRect(ox, oy, size, size);

  // ---- the objective line -------------------------------------------
  var sy = oy + size + K(6);
  if (quest && mission && mission.objectives[quest.idx]) {
    var o2 = mission.objectives[quest.idx];
    var line = 'OBJECTIVE ' + (quest.idx + 1) + '/' + mission.objectives.length +
               ': ' + (o2.banner || '');
    var dist = '';
    var tt = quest.targetXY();
    if (tt && game) {
      var dx = tt.x - game.px, dy = tt.y - game.py;
      dist = Math.round(Math.sqrt(dx * dx + dy * dy) / 32) + 'm ' + PC.compassDir(dx, dy);
    }
    var og = this.add.graphics();
    PC.labPanel(og, 6, sy, W - 12, K(20), { base: 0x241f3d, edge: 0xf2c33c });
    PC.ui.fit(PC.ui.text(this, K(12), sy + K(5), line, 'caption', { color: '#f2c33c' }),
      W - K(24) - (dist ? K(52) : 0));
    if (dist) {
      PC.ui.text(this, W - K(12), sy + K(5), dist, 'caption',
        { color: '#a8e04a' }).setOrigin(1, 0);
    }
  } else if (game && game.freeRoam) {
    var fg = this.add.graphics();
    PC.labPanel(fg, 6, sy, W - 12, K(20), { base: 0x241f3d, edge: 0xa8e04a });
    PC.ui.text(this, W / 2, sy + K(5), 'WALK TO THE MISSION BOARD', 'caption',
      { color: '#a8e04a', align: 'center' }).setOrigin(0.5, 0);
  } else if (mission) {
    var rg = this.add.graphics();
    PC.labPanel(rg, 6, sy, W - 12, K(20), { base: 0x241f3d, edge: 0x6d6a8e });
    PC.ui.text(this, W / 2, sy + K(5), mission.objectives.length + ' OBJECTIVES', 'caption',
      { color: '#cfd4e8', align: 'center' }).setOrigin(0.5, 0);
  }

  // ---- legend: two columns of numbered landmarks --------------------
  var ly = sy + K(26);
  var colW = (W - K(20)) / 2;
  marks.forEach(function (mk, i) {
    var col = i % 2, row = Math.floor(i / 2);
    var lx = K(10) + col * colW, yy = ly + row * rowH;
    var lg = self.add.graphics();
    lg.fillStyle(PC.hexNum(mk.accent), i === objIdx ? 1 : 0.75);
    lg.fillRect(lx, yy + K(3), K(4), K(7));
    var dg = doorGlyph[mk.id];
    PC.ui.fit(PC.ui.text(self, lx + K(8), yy,
      (dg ? dg.ch : (i + 1)) + '. ' + mk.name, 'micro',
      { color: i === objIdx ? '#f2c33c'
             : (dg ? '#' + ('00000' + dg.col.toString(16)).slice(-6) : '#cfd4e8') }),
      colW - K(14));
  });

  // ---- the beat checklist: what's done, what's now, what's coming ----
  if (mission) {
    var by2 = ly + Math.ceil(marks.length / 2) * rowH + K(8);
    PC.ui.text(this, K(10), by2, 'MISSION', 'caption', { color: '#6d6a8e' });
    by2 += K(12);
    mission.objectives.forEach(function (ob2, i) {
      var done = beatIdx >= 0 && i < beatIdx;
      var now = beatIdx >= 0 ? i === beatIdx : i === 0;
      var glyph = done ? '✓' : (now ? '▶' : '·');
      var col2 = done ? '#a8e04a' : (now ? '#f2c33c' : '#6d6a8e');
      PC.ui.text(self, K(12), by2 + i * rowH, glyph, 'micro', { color: col2 });
      PC.ui.fit(PC.ui.text(self, K(24), by2 + i * rowH,
        (ob2.banner || (ob2.type || '').toUpperCase()), 'micro',
        { color: done ? '#6d6a8e' : (now ? '#f7f4ef' : '#8f8ba8') }), W - K(36));
    });
  }

  // ---- close / resume ----------------------------------------------
  var by = H - PC.SAFE_BOTTOM - K(24);
  var bg = this.add.graphics();
  PC.labPanel(bg, K(10), by, W - K(20), K(24), { base: 0x2a2544, edge: 0x35d0ff });
  PC.ui.text(this, W / 2, by + K(6), this._overlay ? 'RESUME' : 'BACK', 'label',
    { color: '#35d0ff', align: 'center' }).setOrigin(0.5, 0);
  var z = this.add.zone(W / 2, by + K(12), W - K(20), K(30))
    .setInteractive({ useHandCursor: true });
  z.on('pointerdown', function () { self.close(); });
  this.input.keyboard.on('keydown-ESC', function () { self.close(); });
  this.input.keyboard.on('keydown-M', function () { self.close(); });
  PC.stampVersion(this);
};

// a soft pulsing target ring
PC.MapViewScene.prototype._pulseRing = function (x, y, r, color) {
  var ring = this.add.circle(x, y, r, color, 0).setStrokeStyle(2, color, 1);
  this.tweens.add({ targets: ring, scale: 1.35, alpha: 0.3,
    duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  var dot = this.add.circle(x, y, Math.max(2, r * 0.3), color, 1);
  return dot;
};

// district-tinted paper
PC.MapViewScene.prototype._paintBase = function (g, def, ox, oy, size) {
  var base = ({ park: 0x2b4230, suburb: 0x35502f, labs: 0x2e2c38 })[def.fabric] || 0x241f3d;
  g.fillStyle(base, 1); g.fillRect(ox, oy, size, size);
  g.lineStyle(1, 0xffffff, 0.05);
  for (var i = 1; i < def.blocks; i++) {
    var t = ox + size * i / def.blocks;
    g.beginPath(); g.moveTo(t, oy); g.lineTo(t, oy + size); g.strokePath();
    var t2 = oy + size * i / def.blocks;
    g.beginPath(); g.moveTo(ox, t2); g.lineTo(ox + size, t2); g.strokePath();
  }
};

// the district's OWN geometry, so each map reads as itself
PC.MapViewScene.prototype._paintRoads = function (g, region, layout, def, ox, oy, k) {
  function mx(wx) { return ox + wx * k; }
  function my(wy) { return oy + wy * k; }
  var i, j;
  if (layout && layout.paths) {              // park + suburbs: polylines
    var roadCol = def.fabric === 'suburb' ? 0x55535f : 0x5d5140;
    layout.paths.forEach(function (p) {
      g.lineStyle(Math.max(1.2, p.w * k * 0.9), roadCol, 0.95);
      g.beginPath();
      p.pts.forEach(function (q, n) {
        if (n === 0) g.moveTo(mx(q.x), my(q.y)); else g.lineTo(mx(q.x), my(q.y));
      });
      g.strokePath();
    });
    if (layout.culs) layout.culs.forEach(function (c) {
      g.fillStyle(roadCol, 0.95); g.fillCircle(mx(c.x), my(c.y), Math.max(2, c.r * k));
    });
    if (layout.ponds) layout.ponds.forEach(function (p) {
      g.fillStyle(0x38678a, 0.9);
      g.fillCircle(mx(p.x), my(p.y), Math.max(2, p.r * k));
    });
    if (layout.rivers) layout.rivers.forEach(function (p) {   // frosting flows
      g.lineStyle(Math.max(1.5, p.w * k), 0xf8e7ee, 0.85);
      g.beginPath();
      p.pts.forEach(function (q, n) {
        if (n === 0) g.moveTo(mx(q.x), my(q.y)); else g.lineTo(mx(q.x), my(q.y));
      });
      g.strokePath();
    });
  } else if (layout && layout.roads) {       // labs: axis-aligned bands
    layout.roads.forEach(function (r) {
      var x = mx(r.horiz ? r.x0 : r.x0 - r.w / 2);
      var y = my(r.horiz ? r.y0 - r.w / 2 : r.y0);
      var w = r.horiz ? (r.x1 - r.x0) * k : Math.max(1.5, r.w * k);
      var h = r.horiz ? Math.max(1.5, r.w * k) : (r.y1 - r.y0) * k;
      g.fillStyle(0x2c2a35, 1); g.fillRect(x, y, w, h);
      g.fillStyle(0x35d0ff, 0.45);           // the glowing centre seam
      if (r.horiz) g.fillRect(x, y + h / 2 - 0.5, w, 1);
      else g.fillRect(x + w / 2 - 0.5, y, 1, h);
    });
  } else {                                   // the city fabric's street grid
    // asphalt must read DARKER than the blocks or the grid disappears
    var B = PC.BLOCK, road = 128, off = 192;
    for (i = 0; i < def.blocks; i++) {
      var rx = mx(i * B + off), rw = Math.max(2, road * k);
      g.fillStyle(0x171327, 1);
      g.fillRect(rx, oy, rw, region.size * k);
      g.fillRect(ox, my(i * B + off), region.size * k, rw);
      g.fillStyle(0xf2c33c, 0.16);           // faint centre line
      g.fillRect(rx + rw / 2 - 0.5, oy, 1, region.size * k);
      g.fillRect(ox, my(i * B + off) + rw / 2 - 0.5, region.size * k, 1);
    }
  }
};

// 8-point compass label for a delta
PC.compassDir = function (dx, dy) {
  var a = Math.atan2(dy, dx) * 180 / Math.PI;
  var names = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  return names[(Math.round(a / 45) + 8) % 8];
};

// '#rrggbb' -> 0xrrggbb (map data stores CSS strings)
PC.hexNum = function (c) {
  if (typeof c === 'number') return c;
  return parseInt(String(c).replace('#', ''), 16) || 0x6d6a8e;
};
