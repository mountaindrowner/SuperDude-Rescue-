// world_tower.js - PC.TowerLayout (v0.44.0): MAP 6, ADVENTURE TOWER.
// THE FINALE. The sixth and last fabric, and the only one that is not a
// place you wander - it is a place you CLIMB.
//
// PERSPECTIVE: the game is top-down, so the Tower cannot be a side-on
// cutaway. Each floor is a FLOOR PLAN seen from above, and the nine
// plans are stacked as bands up the map: F1 LOBBY at the bottom edge,
// the ROOF at the top. Walking up the screen IS walking up the
// building. Stairwells alternate ends floor to floor, so every floor
// must be crossed end to end - a switchback ascent.
//
// Three surfaces, and only three, so a child always knows where they
// stand: FLOOR (lit, walkable), STRUCTURE (the building's guts -
// concrete, solid), SKY (outside the building - night city far below,
// solid). Balconies are the one place floor pokes out into the sky.
//
// Same architecture law as the other five fabrics: ONE deterministic
// source (THE GRID) feeds paint, collision and wall edges, so the
// pixels and the physics can never disagree.
window.PC = window.PC || {};
(function () {
  var CH = PC.CHUNK || 512;
  var CELL = 64;                     // collision/paint quantization

  function h2(i, j, salt) {
    var n = (i * 374761393 + j * 668265263 + (salt || 0) * 2246822519) | 0;
    n = (n ^ (n >>> 13)) | 0; n = Math.imul(n, 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function smooth(x, y, scale, salt) {
    var gx = x / scale, gy = y / scale;
    var x0 = Math.floor(gx), y0 = Math.floor(gy);
    var fx = gx - x0, fy = gy - y0;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = h2(x0, y0, salt), b = h2(x0 + 1, y0, salt);
    var c = h2(x0, y0 + 1, salt), d = h2(x0 + 1, y0 + 1, salt);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function rectHit(r, x, y) {
    return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  }

  var COL = {
    // --- outside: night city, far below ---
    skyHi: '#141428', skyLo: '#0a0a18', skyHaze: '#1d2140',
    cityFar: '#151a33', cityNear: '#1b2140', win: '#f2c33c', winCool: '#35d0ff',
    // --- structure: the building's guts (solid, never walkable) ---
    struct: '#2a2733', structMottle: '#302d3a', structSeam: '#211f2a',
    rebar: '#3a3746',
    // --- floor: lit interior ---
    floor: '#5a5768', floorLite: '#66637a', floorDark: '#4d4a5b',
    seam: '#413e4e',
    // --- edges ---
    wallVoid: '#15131c', wallFace: '#6d6a8e', wallFaceDark: '#514e6b',
    wallLip: '#8b88a8',
    rail: '#8b88a8', railDark: '#514e6b', railPost: '#b6b3d0',
    // --- fittings ---
    glass: '#2e8fb0', glassLite: '#35d0ff',
    gold: '#f2c33c', red: '#e2574c', green: '#a8e04a',
    carpet: '#4a3358', carpetLite: '#5a3f6b',
    steel: '#6d6a8e', steelLite: '#8b88a8', steelDark: '#4a4760',
  };

  var BAND = 1024;                   // one floor's slice of the map
  var FW = 3584;                     // interior width (floors got NARROWER
                                     // as the tower got taller - 17 floors
                                     // of a 9-screen hall is a slog; 7
                                     // screens is a brisk crossing)
  var PAD_T = 96, IH = 832;          // interior top pad + height
  var SHAFT_W = 448;                 // stairwell width
  var JUT = 1408;                    // how far a balcony pokes into the sky

  // THE EIGHTEEN. index 0 = F1 (bottom band) ... index 17 = ROOF (top).
  // A real building program bottom to top, so the climb tells you how
  // high you are without a single number: you start in a marble lobby
  // and end up in the plant rooms and the penthouse.
  var FLOORS = [
    { id: 'f1',  label: 'F1  MAIN LOBBY',       kind: 'lobby'   },
    { id: 'f2',  label: 'F2  SECURITY & MAIL',  kind: 'mail'    },
    { id: 'f3',  label: 'F3  FOOD COURT',       kind: 'food'    },
    { id: 'f4',  label: 'F4  OFFICES',          kind: 'offices' },
    { id: 'f5',  label: 'F5  MECHANICAL',       kind: 'mech'    },
    { id: 'f6',  label: 'F6  ARCHIVE',          kind: 'archive' },
    { id: 'f7',  label: 'F7  SKY DECK',         kind: 'deck',   jut: 1 },
    { id: 'f8',  label: 'F8  ATRIUM',           kind: 'atrium'  },
    { id: 'f9',  label: 'F9  ACN STUDIO',       kind: 'studio'  },
    { id: 'f10', label: 'F10 PLANT ROOM',       kind: 'mech'    },
    { id: 'f11', label: 'F11 GREENHOUSE',       kind: 'green',  jut: 1 },
    { id: 'f12', label: 'F12 SERVER FLOOR',     kind: 'servers' },
    { id: 'f13', label: 'F13 EXECUTIVE',        kind: 'exec'    },
    { id: 'f14', label: 'F14 OBSERVATION',      kind: 'obs',    jut: -1 },
    { id: 'f15', label: 'F15 ANTENNA PLANT',    kind: 'antenna' },
    { id: 'f16', label: 'F16 PENTHOUSE',        kind: 'pent'    },
    { id: 'f17', label: 'F17 SKY LOBBY',        kind: 'skylob'  },
    { id: 'roof', label: 'ROOFTOP',             kind: 'roof'    },
  ];

  // =====================================================================
  PC.TowerLayout = function (def) {
    this.def = def;
    this.blocks = def.blocks || 18;
    this.size = this.blocks * CH;
    this.floors = [];
    var FX0 = this.fx0 = Math.round((this.size - FW) / 2 / CELL) * CELL;

    var i, f, top, r;
    for (i = 0; i < FLOORS.length; i++) {
      f = FLOORS[i];
      top = this.size - (i + 1) * BAND;
      r = { x: FX0, y: top + PAD_T, w: FW, h: IH };
      if (f.kind === 'roof') { r = { x: FX0 - 384, y: top + 64, w: FW + 768, h: 896 }; }
      var rec = {
        i: i, id: f.id, label: f.label, kind: f.kind,
        top: top, rect: r,
        // the balcony: floor that pokes OUT of the facade into the sky
        jut: f.jut ? { x: f.jut > 0 ? r.x + r.w : r.x - JUT, y: r.y + 168,
                       w: JUT, h: r.h - 336, side: f.jut } : null,
        // stairwell up: alternates ends so every floor is crossed
        exit: (i % 2 === 0) ? 'E' : 'W',
      };
      this.floors.push(rec);
    }
    // shafts: floor i -> floor i+1, through the 192px slab between bands
    this.shafts = [];
    for (i = 0; i < this.floors.length - 1; i++) {
      var lo = this.floors[i], hi = this.floors[i + 1];
      var sx = lo.exit === 'E' ? lo.rect.x + lo.rect.w - SHAFT_W : lo.rect.x;
      this.shafts.push({
        from: i, x: sx, y: hi.rect.y + hi.rect.h, w: SHAFT_W,
        h: lo.rect.y - (hi.rect.y + hi.rect.h),
      });
    }
    // the tower footprint: everything inside is STRUCTURE, outside is SKY
    this.foot = { x: FX0 - 192, y: 0, w: FW + 384, h: this.size };

    this._buildObstacles();
    this._buildGrid();
    this._buildSigns();

    // schematic export for the map screen
    this.tower = { floors: this.floors, shafts: this.shafts, foot: this.foot };
  };

  // ---- per-floor furniture: the thing that makes F4 not F12 -----------
  // Seventeen floors need seventeen silhouettes, so each kind is its own
  // generator. Everything is authored relative to the floor rect, so
  // widening or restacking the tower never breaks a room.
  PC.TowerLayout.prototype._buildObstacles = function () {
    var obs = this.obs = [];
    var self = this;
    var i, j, k, f, r, x, mid;
    function put(fi, x, y, w, h, t) { obs.push({ f: fi, x: x, y: y, w: w, h: h, t: t }); }

    for (i = 0; i < this.floors.length; i++) {
      f = this.floors[i]; r = f.rect; mid = r.y + r.h / 2;
      // per-floor jitter: two MECHANICAL floors or two rack floors must
      // not be identical twins, or the climb stops feeling like height
      var jit = Math.round((h2(i, 1, 71) - 0.5) * 180 / CELL) * CELL;
      var jit2 = Math.round((h2(i, 2, 72) - 0.5) * 120 / CELL) * CELL;
      var skip = 2 + Math.floor(h2(i, 3, 73) * 2);        // which bay is open

      // structural columns: the repeated motif that says BUILDING, and
      // the thing that makes a wide room fightable instead of empty.
      if (f.kind !== 'roof' && f.kind !== 'atrium') {
        for (j = 1; j <= 5; j++) {
          x = r.x + (r.w * j) / 6;
          put(i, x - 36, r.y + 150, 72, 72, 'col');
          put(i, x - 36, r.y + r.h - 222, 72, 72, 'col');
        }
      }

      if (f.kind === 'lobby') {
        put(i, r.x + 820, mid - 84, 640, 168, 'desk');
        for (j = 0; j < 3; j++) {
          put(i, r.x + 1900 + j * 480, mid - 300, 140, 140, 'planter');
          put(i, r.x + 2100 + j * 480, mid + 160, 140, 140, 'planter');
        }
      } else if (f.kind === 'mail') {
        // pigeonhole banks + a security counter you funnel past
        for (j = 0; j < 5; j++) put(i, r.x + 380 + jit + j * 620, r.y + 150, 300, 120, 'rack');
        put(i, r.x + r.w / 2 - 420, mid + 80, 840, 130, 'desk');
      } else if (f.kind === 'food') {
        for (j = 0; j < 3; j++) put(i, r.x + 380 + j * 1080, r.y + 150, 560, 150, 'kiosk');
        for (j = 0; j < 5; j++) put(i, r.x + 440 + j * 660, r.y + r.h - 300, 180, 130, 'table');
      } else if (f.kind === 'offices' || f.kind === 'exec') {
        var cw = f.kind === 'exec' ? 460 : 340;        // exec = bigger rooms
        for (j = 0; j < 6; j++) {
          for (k = 0; k < 3; k++) {
            x = r.x + 300 + jit2 + j * 540; var y2 = r.y + 190 + k * 230;
            if ((j + k + i) % 3 === 2) continue;        // gaps to weave
            put(i, x, y2, cw, 46, 'cube');
            if (k % 2 === 0) put(i, x, y2, 46, 190, 'cube');
          }
        }
      } else if (f.kind === 'mech' || f.kind === 'antenna') {
        // heavy plant in the corners, clear center: a boss can live here
        var flip = (i % 2) ? 1 : 0;                     // F10 is not F5
        put(i, r.x + 240, r.y + 180 + flip * 40, 540, 250 - flip * 60, 'plant');
        put(i, r.x + 240 + flip * 320, r.y + r.h - 430, 540, 250, 'plant');
        put(i, r.x + r.w - 780 - flip * 320, r.y + 180, 540, 250, 'plant');
        put(i, r.x + r.w - 780, r.y + r.h - 430 - flip * 40, 540, 250 - flip * 60, 'plant');
        put(i, r.x + r.w / 2 - 100, r.y + 140, 200, 110, 'duct');
        put(i, r.x + r.w / 2 - 100, r.y + r.h - 250, 200, 110, 'duct');
      } else if (f.kind === 'archive') {
        for (j = 0; j < 8; j++) {
          x = r.x + 240 + jit + j * 400;
          if (j % 4 === skip) continue;                   // an open aisle
          put(i, x, r.y + 170, 130, 260, 'rack');
          put(i, x, r.y + r.h - 430, 130, 260, 'rack');
        }
      } else if (f.kind === 'deck') {
        for (j = 0; j < 4; j++) put(i, r.x + 620 + j * 720, mid - 66, 190, 132, 'planter');
      } else if (f.kind === 'atrium') {
        // THE LIGHT WELL: a hole through the middle. You walk the ring.
        put(i, r.x + r.w / 2 - 980, r.y + 200, 1960, r.h - 400, 'void');
      } else if (f.kind === 'studio') {
        // ACN news set: the desk, the lighting rigs, a control booth
        put(i, r.x + 700, mid - 90, 620, 180, 'desk');
        put(i, r.x + r.w - 900, r.y + 170, 660, 250, 'booth');
        for (j = 0; j < 5; j++) put(i, r.x + 420 + j * 500, r.y + r.h - 280, 90, 90, 'light');
      } else if (f.kind === 'green') {
        // Vic's kind of room: planting beds in rows, glass on the jut
        for (j = 0; j < 6; j++) {
          put(i, r.x + 300 + jit2 + j * 540, r.y + 180, 380, 110, 'bed');
          put(i, r.x + 300 + jit2 + j * 540, r.y + r.h - 290, 380, 110, 'bed');
        }
      } else if (f.kind === 'servers') {
        for (j = 0; j < 7; j++) {
          x = r.x + 260 + jit + j * 460;
          if (j % 4 === skip) continue;                   // an open aisle
          put(i, x, r.y + 170, 140, 250, 'rack');
          put(i, x, r.y + r.h - 420, 140, 250, 'rack');
        }
      } else if (f.kind === 'obs' || f.kind === 'pent') {
        put(i, r.x + 700, mid - 85, 800, 170, 'bar');
        for (j = 0; j < 3; j++) put(i, r.x + 2000 + j * 460, mid - 230, 150, 150, 'lounge');
      } else if (f.kind === 'skylob') {
        // the last landing before the roof: bare, tense, a few benches
        for (j = 0; j < 4; j++) put(i, r.x + 620 + j * 700, mid - 45, 260, 90, 'bench');
      } else if (f.kind === 'roof') {
        put(i, r.x + 260, r.y + 130, 380, 200, 'ac');
        put(i, r.x + r.w - 640, r.y + 130, 380, 200, 'ac');
        put(i, r.x + 260, r.y + r.h - 330, 380, 200, 'ac');
        put(i, r.x + r.w - 640, r.y + r.h - 330, 380, 200, 'ac');
      }
    }
    // bucket by floor: the grid build asks this question ~340,000 times
    // on an 18-band tower, so it must not be a linear scan of everything
    this.obsBy = [];
    for (i = 0; i < this.floors.length; i++) this.obsBy.push([]);
    for (i = 0; i < obs.length; i++) this.obsBy[obs[i].f].push(obs[i]);
    void self;
  };

  // ---- the analytic shape, before quantization ------------------------
  PC.TowerLayout.prototype._analyticOpen = function (x, y) {
    // which band is this? straight arithmetic, no scan
    var bi = Math.floor((this.size - y) / BAND);
    var i, f, o, list;
    if (bi >= 0 && bi < this.floors.length) {
      f = this.floors[bi];
      if (rectHit(f.rect, x, y) || (f.jut && rectHit(f.jut, x, y))) {
        list = this.obsBy[bi];
        for (o = 0; o < list.length; o++) if (rectHit(list[o], x, y)) return false;
        return true;
      }
    }
    // the roof band is taller than its rect; neighbours can overlap the
    // slab, so check the two adjacent bands before giving up
    for (i = bi - 1; i <= bi + 1; i++) {
      if (i < 0 || i >= this.floors.length || i === bi) continue;
      f = this.floors[i];
      if (!(rectHit(f.rect, x, y) || (f.jut && rectHit(f.jut, x, y)))) continue;
      list = this.obsBy[i];
      for (o = 0; o < list.length; o++) if (rectHit(list[o], x, y)) return false;
      return true;
    }
    for (i = 0; i < this.shafts.length; i++) {
      if (rectHit(this.shafts[i], x, y)) return true;
    }
    return false;
  };

  // ---- THE GRID: quantize once, clean, and never disagree again ------
  PC.TowerLayout.prototype._buildGrid = function () {
    var N = this.gridN = Math.floor(this.size / CELL);
    var walk = this.grid = new Uint8Array(N * N);
    var gx, gy, gi;
    for (gy = 0; gy < N; gy++) {
      for (gx = 0; gx < N; gx++) {
        walk[gy * N + gx] =
          this._analyticOpen(gx * CELL + CELL / 2, gy * CELL + CELL / 2) ? 1 : 0;
      }
    }
    // seal anything the climb can't reach from the lobby spawn, so a
    // quest marker can never land in a sealed pocket
    var sx = Math.floor(((this.def.spawn.c + 0.5) * PC.BLOCK + 96) / CELL);
    var sy = Math.floor(((this.def.spawn.r + 0.5) * PC.BLOCK + 96) / CELL);
    var seen = new Uint8Array(N * N);
    var q = [sy * N + sx];
    seen[sy * N + sx] = 1;
    var head = 0;
    while (head < q.length) {
      var c = q[head++];
      var cx = c % N, cy = (c - cx) / N;
      var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var k = 0; k < 4; k++) {
        var nx = cx + nb[k][0], ny = cy + nb[k][1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        var ni = ny * N + nx;
        if (seen[ni] || !walk[ni]) continue;
        seen[ni] = 1; q.push(ni);
      }
    }
    for (gi = 0; gi < N * N; gi++) if (walk[gi] && !seen[gi]) walk[gi] = 0;
    this._reachable = q.length;
  };

  PC.TowerLayout.prototype.carvedAt = function (x, y) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return false;
    var N = this.gridN;
    return !!this.grid[Math.floor(y / CELL) * N + Math.floor(x / CELL)];
  };

  PC.TowerLayout.prototype.floorAt = function (x, y) {
    for (var i = 0; i < this.floors.length; i++) {
      var f = this.floors[i];
      if (rectHit(f.rect, x, y) || (f.jut && rectHit(f.jut, x, y))) return f;
    }
    return null;
  };

  // ---- collision ------------------------------------------------------
  PC.TowerLayout.prototype.solidsForChunk = function (cx, cy) {
    var out = [], x0 = cx * CH, y0 = cy * CH;
    for (var gy = 0; gy < CH; gy += CELL) {
      var run = null;
      for (var gx = 0; gx < CH; gx += CELL) {
        var solid = !this.carvedAt(x0 + gx + CELL / 2, y0 + gy + CELL / 2);
        if (solid) {
          if (run) run.w += CELL;
          else { run = { x: x0 + gx, y: y0 + gy, w: CELL, h: CELL }; out.push(run); }
        } else run = null;
      }
    }
    return out;
  };

  // merged walkable runs for this chunk, in world coords (paint clip)
  PC.TowerLayout.prototype._floorRects = function (cx, cy) {
    var out = [], x0 = cx * CH, y0 = cy * CH;
    for (var gy = 0; gy < CH; gy += CELL) {
      var run = null;
      for (var gx = 0; gx < CH; gx += CELL) {
        if (this.carvedAt(x0 + gx + CELL / 2, y0 + gy + CELL / 2)) {
          if (run) run.w += CELL;
          else { run = { x: x0 + gx, y: y0 + gy, w: CELL, h: CELL }; out.push(run); }
        } else run = null;
      }
    }
    return out;
  };

  // ---- signage: a tower is a place with FLOOR NUMBERS ON THE WALL -----
  PC.TowerLayout.prototype._buildSigns = function () {
    var s = this.signs = [];
    for (var i = 0; i < this.floors.length; i++) {
      var f = this.floors[i], r = f.rect;
      s.push({ x: r.x + 260, y: r.y + 74, text: f.label, tone: 'floor' });
      s.push({ x: r.x + r.w - 260, y: r.y + r.h - 52, text: f.label, tone: 'floor' });
      if (i < this.floors.length - 1) {
        var sh = this.shafts[i];
        s.push({ x: sh.x + sh.w / 2, y: this.floors[i].rect.y + 74,
                 text: 'STAIRS  UP', tone: 'exit', arrow: 'up' });
      }
      if (f.jut) {
        s.push({ x: f.jut.x + f.jut.w / 2, y: f.jut.y - 34,
                 text: 'OPEN  BALCONY', tone: 'warn' });
      }
    }
  };

  // =====================================================================
  // PAINT
  // =====================================================================
  PC.TowerLayout.prototype.paintChunk = function (scene, g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH;

    // ---- 1. OUTSIDE: night sky over the city, far below ----
    var grd = g.createLinearGradient(0, 0, 0, CH);
    grd.addColorStop(0, COL.skyHi); grd.addColorStop(1, COL.skyLo);
    g.fillStyle = grd; g.fillRect(0, 0, CH, CH);
    this._city(g, cx, cy);

    // ---- 2. STRUCTURE: inside the footprint, the building's guts ----
    var ft = this.foot;
    if (ft.x < x0 + CH && ft.x + ft.w > x0) {
      var sx = Math.max(ft.x, x0) - x0, sw = Math.min(ft.x + ft.w, x0 + CH) - x0 - sx;
      g.fillStyle = COL.struct; g.fillRect(sx, 0, sw, CH);
      g.fillStyle = COL.structMottle;
      for (var m = 0; m < 7; m++) {
        var mx = sx + h2(cx * 5 + m, cy, 31) * sw, my = h2(cx, cy * 5 + m, 32) * CH;
        var ms = 30 + h2(m, cx + cy, 33) * 60;
        g.beginPath(); g.ellipse(mx, my, ms, ms * 0.6, 0, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = COL.structSeam; g.lineWidth = 2;         // slab seams
      for (var sy2 = ((-(y0 % 128)) + 128) % 128; sy2 < CH; sy2 += 128) {
        g.beginPath(); g.moveTo(sx, sy2); g.lineTo(sx + sw, sy2); g.stroke();
      }
      g.strokeStyle = COL.rebar; g.lineWidth = 1;
      for (var rx = ((-(x0 % 96)) + 96) % 96; rx < CH; rx += 96) {
        if (rx < sx || rx > sx + sw) continue;
        g.beginPath(); g.moveTo(rx, 0); g.lineTo(rx, CH); g.stroke();
      }
    }

    // ---- 3. FLOOR: clip to the grid's walkable cells ----
    var clip = this._floorRects(cx, cy);
    if (clip.length) {
      g.save();
      g.beginPath();
      for (var ci = 0; ci < clip.length; ci++) {
        g.rect(clip[ci].x - x0, clip[ci].y - y0, clip[ci].w, clip[ci].h);
      }
      g.clip();
      this._floorBase(g, cx, cy);
      this._dressFloors(g, cx, cy);
      this._stairs(g, cx, cy);
      g.restore();
    }

    // ---- 4. EDGES: every boundary gets a real wall or a railing ----
    this._edges(g, cx, cy);

    // ---- 5. SIGNAGE LAST: nothing may ever occlude a sign ----
    this._signage(g, cx, cy);
  };

  // distant city lights below the tower
  PC.TowerLayout.prototype._city = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH, i;
    g.fillStyle = COL.cityFar;
    for (i = 0; i < 10; i++) {
      var bx = h2(cx * 3 + i, cy, 41) * CH;
      var bw = 40 + h2(i, cx, 42) * 90;
      var bh = 60 + h2(i, cy, 43) * 260;
      g.fillRect(bx, CH - bh, bw, bh);
    }
    g.fillStyle = COL.cityNear;
    for (i = 0; i < 6; i++) {
      var nx = h2(cx * 7 + i, cy + 3, 44) * CH;
      var nw = 60 + h2(i, cx + 1, 45) * 120;
      var nh = 90 + h2(i, cy + 1, 46) * 200;
      g.fillRect(nx, CH - nh, nw, nh);
    }
    for (i = 0; i < 46; i++) {
      var wx = Math.floor(h2(cx * 11 + i, cy, 47) * CH / 8) * 8;
      var wy = Math.floor(h2(cx, cy * 11 + i, 48) * CH / 8) * 8;
      var lit = h2(i, cx + cy, 49);
      if (lit < 0.45) continue;
      g.fillStyle = lit > 0.9 ? COL.winCool : COL.win;
      g.globalAlpha = 0.10 + lit * 0.16;
      g.fillRect(wx, wy, 3, 4);
    }
    g.globalAlpha = 1;
    g.fillStyle = COL.skyHaze; g.globalAlpha = 0.30;
    g.fillRect(0, 0, CH, CH); g.globalAlpha = 1;
  };

  PC.TowerLayout.prototype._floorBase = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH;
    // QUIET. The Underground taught us this: mid-tone blotches read as
    // camouflage, not as ground. A floor is a flat value plus a tile
    // grid, and the only variation is a rare, barely-there tile.
    g.fillStyle = COL.floor; g.fillRect(0, 0, CH, CH);
    for (var fy = ((-(y0 % 64)) + 64) % 64 - 64; fy < CH; fy += 64) {
      for (var fx = ((-(x0 % 64)) + 64) % 64 - 64; fx < CH; fx += 64) {
        var n = h2(Math.floor((x0 + fx) / 64), Math.floor((y0 + fy) / 64), 12);
        if (n > 0.88) { g.fillStyle = COL.floorLite; g.fillRect(fx, fy, 64, 64); }
        else if (n < 0.12) { g.fillStyle = COL.floorDark; g.fillRect(fx, fy, 64, 64); }
      }
    }
    g.strokeStyle = COL.seam; g.lineWidth = 1;
    for (var sy = ((-(y0 % 64)) + 64) % 64; sy < CH; sy += 64) {
      g.beginPath(); g.moveTo(0, sy + 0.5); g.lineTo(CH, sy + 0.5); g.stroke();
    }
    for (var sx = ((-(x0 % 64)) + 64) % 64; sx < CH; sx += 64) {
      g.beginPath(); g.moveTo(sx + 0.5, 0); g.lineTo(sx + 0.5, CH); g.stroke();
    }
  };

  // ---- STAIRS: the shaft has to LOOK like the way up. Steps across
  // the run, handrails down both sides, a bright landing nose at the
  // top so the eye is pulled upward. ----
  PC.TowerLayout.prototype._stairs = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH;
    for (var i = 0; i < this.shafts.length; i++) {
      var sh = this.shafts[i];
      if (sh.x > x0 + CH || sh.x + sh.w < x0) continue;
      if (sh.y > y0 + CH || sh.y + sh.h < y0) continue;
      var lx = sh.x - x0, ly = sh.y - y0;
      g.fillStyle = COL.steelDark; g.fillRect(lx, ly, sh.w, sh.h);
      for (var st = 0; st < sh.h; st += 24) {
        g.fillStyle = (st / 24) % 2 ? COL.steel : COL.steelLite;
        g.fillRect(lx + 34, ly + st, sh.w - 68, 18);
        g.fillStyle = 'rgba(10,9,20,0.45)';
        g.fillRect(lx + 34, ly + st + 18, sh.w - 68, 6);
      }
      g.fillStyle = COL.rail;
      g.fillRect(lx + 18, ly, 8, sh.h);
      g.fillRect(lx + sh.w - 26, ly, 8, sh.h);
      g.fillStyle = COL.railPost;
      for (var pp = 0; pp < sh.h; pp += 48) {
        g.fillRect(lx + 14, ly + pp, 16, 5);
        g.fillRect(lx + sh.w - 30, ly + pp, 16, 5);
      }
      g.fillStyle = COL.green;                       // landing nose, up top
      g.fillRect(lx + 34, ly - 4, sh.w - 68, 6);
    }
  };

  // per-floor identity paint (inside the floor clip). Each floor gets a
  // faint colour WASH plus one honest piece of floor-specific marking -
  // enough that F3 is never mistaken for F7, quiet enough to read as a
  // room and not a texture.
  var WASH = {
    lobby:  'rgba(242,195,60,0.10)', mail:    'rgba(139,136,168,0.10)',
    food:   'rgba(226,87,76,0.10)',  offices: 'rgba(139,136,168,0.07)',
    mech:   'rgba(242,195,60,0.09)', archive: 'rgba(176,138,90,0.11)',
    deck:   'rgba(53,208,255,0.10)', atrium:  'rgba(168,224,74,0.09)',
    studio: 'rgba(255,158,203,0.10)', green:  'rgba(168,224,74,0.14)',
    servers:'rgba(46,143,176,0.12)', exec:    'rgba(199,160,113,0.10)',
    obs:    'rgba(53,208,255,0.09)', antenna: 'rgba(46,143,176,0.09)',
    pent:   'rgba(242,195,60,0.12)', skylob:  'rgba(139,136,168,0.05)',
    roof:   'rgba(226,87,76,0.08)',
  };
  PC.TowerLayout.prototype._dressFloors = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH, j;
    for (var i = 0; i < this.floors.length; i++) {
      var f = this.floors[i], r = f.rect;
      if (r.y > y0 + CH || r.y + r.h < y0) continue;
      var lx = r.x - x0, ly = r.y - y0;
      var jx = f.jut ? f.jut.x - x0 : 0;
      g.fillStyle = WASH[f.kind] || 'rgba(0,0,0,0)';
      g.fillRect(lx - JUT, ly, r.w + JUT * 2, r.h);

      if (f.kind === 'studio') {
        // studio floor: taped marks and a lit set circle
        g.strokeStyle = COL.gold; g.lineWidth = 3; g.globalAlpha = 0.55;
        g.beginPath(); g.arc(lx + 1010, ly + r.h / 2, 300, 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 1;
        g.fillStyle = 'rgba(255,158,203,0.10)';
        g.fillRect(lx + 600, ly + 120, 900, r.h - 240);
      } else if (f.kind === 'green') {
        // soil aisles between the beds
        g.fillStyle = 'rgba(60,44,26,0.35)';
        for (j = 0; j < 6; j++) g.fillRect(lx + 300 + j * 540, ly + 170, 380, r.h - 340);
      } else if (f.kind === 'archive' || f.kind === 'mail') {
        g.fillStyle = 'rgba(176,138,90,0.08)';
        g.fillRect(lx, ly + 140, r.w, r.h - 280);
        g.strokeStyle = COL.seam; g.lineWidth = 2;
        g.beginPath(); g.moveTo(lx, ly + r.h / 2); g.lineTo(lx + r.w, ly + r.h / 2); g.stroke();
      } else if (f.kind === 'skylob') {
        // bare stone and one long light strip: the calm before the roof
        g.fillStyle = 'rgba(255,255,255,0.06)';
        g.fillRect(lx + 120, ly + r.h / 2 - 8, r.w - 240, 16);
      } else if (f.kind === 'lobby' || f.kind === 'obs' || f.kind === 'pent') {
        // a runner carpet down the middle of the room
        g.fillStyle = COL.carpet;
        g.fillRect(lx + 200, ly + r.h / 2 - 150, r.w - 400, 300);
        g.strokeStyle = COL.carpetLite; g.lineWidth = 6;
        g.strokeRect(lx + 218, ly + r.h / 2 - 132, r.w - 436, 264);
      } else if (f.kind === 'food') {
        // service-side floor tile, only under the counters
        g.fillStyle = 'rgba(255,255,255,0.05)';
        g.fillRect(lx, ly + 100, r.w, 240);
        g.fillStyle = COL.gold; g.globalAlpha = 0.35;
        g.fillRect(lx, ly + 340, r.w, 4); g.globalAlpha = 1;
      } else if (f.kind === 'mech' || f.kind === 'antenna') {
        g.fillStyle = COL.gold; g.globalAlpha = 0.55;
        for (j = 0; j < r.w; j += 44) {                 // hazard chevrons
          g.beginPath();
          g.moveTo(lx + j, ly + r.h / 2 - 14);
          g.lineTo(lx + j + 22, ly + r.h / 2);
          g.lineTo(lx + j, ly + r.h / 2 + 14);
          g.lineTo(lx + j - 10, ly + r.h / 2);
          g.closePath(); g.fill();
        }
        g.globalAlpha = 1;
      } else if (f.kind === 'servers') {
        g.strokeStyle = COL.glass; g.lineWidth = 3; g.globalAlpha = 0.5;
        for (j = 0; j < r.w; j += 470) {                // cable trays
          g.beginPath(); g.moveTo(lx + j + 75, ly + 420);
          g.lineTo(lx + j + 75, ly + r.h - 420); g.stroke();
        }
        g.globalAlpha = 1;
        g.strokeStyle = COL.glassLite; g.lineWidth = 2; g.globalAlpha = 0.4;
        g.beginPath(); g.moveTo(lx, ly + r.h / 2); g.lineTo(lx + r.w, ly + r.h / 2);
        g.stroke(); g.globalAlpha = 1;
      } else if (f.kind === 'deck' || f.kind === 'roof' || f.kind === 'obs' || f.kind === 'green') {
        // outdoor decking boards, carried out onto the balcony
        g.fillStyle = 'rgba(20,18,32,0.30)';
        var dx0 = f.jut ? Math.min(lx, jx) : lx;
        var dw = r.w + (f.jut ? JUT : 0);
        for (j = 0; j < dw; j += 128) g.fillRect(dx0 + j, ly, 5, r.h);
      }
      if (f.kind === 'atrium') {
        // light spilling up out of the well
        var vo = null;
        for (var o = 0; o < this.obs.length; o++) {
          if (this.obs[o].f === i && this.obs[o].t === 'void') { vo = this.obs[o]; break; }
        }
        if (vo) {
          g.strokeStyle = COL.green; g.globalAlpha = 0.45; g.lineWidth = 5;
          g.strokeRect(vo.x - x0 - 12, vo.y - y0 - 12, vo.w + 24, vo.h + 24);
          g.globalAlpha = 1;
        }
      }
    }
  };

  // ---- WALL EDGES: same grammar as the Underground, building tones.
  // Over the sky (balconies, roof) it becomes a RAILING instead. ----
  PC.TowerLayout.prototype._edges = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH, T = 16;
    for (var ly = 0; ly < CH; ly += T) {
      for (var lx = 0; lx < CH; lx += T) {
        var wx = x0 + lx + T / 2, wy = y0 + ly + T / 2;
        if (!this.carvedAt(wx, wy)) continue;
        var nN = !this.carvedAt(wx, wy - T), nS = !this.carvedAt(wx, wy + T);
        var nW = !this.carvedAt(wx - T, wy), nE = !this.carvedAt(wx + T, wy);
        if (!(nN || nS || nW || nE)) continue;
        // outside the footprint = open air: rail it, don't wall it
        var air = wx < this.foot.x || wx > this.foot.x + this.foot.w;
        var CB = air ? COL.railDark : COL.wallFace;
        var CD = air ? COL.railDark : COL.wallFaceDark;
        var CL = air ? COL.railPost : COL.wallLip;
        var CV = air ? 'rgba(10,10,24,0.85)' : COL.wallVoid;
        var off = (Math.floor((x0 + lx) / T) % 2) * 5;
        if (nN) {
          g.fillStyle = CV; g.fillRect(lx, ly, T, 4);
          g.fillStyle = CB; g.fillRect(lx, ly + 4, T, 12);
          g.fillStyle = CD; g.fillRect(lx + off, ly + 4, 2, 12);
          g.fillStyle = CL; g.fillRect(lx, ly + 16, T, 3);
        }
        if (nS) {
          g.fillStyle = CV; g.fillRect(lx, ly + T - 4, T, 4);
          g.fillStyle = CB; g.fillRect(lx, ly + T - 16, T, 12);
          g.fillStyle = CD; g.fillRect(lx + off, ly + T - 16, 2, 12);
          g.fillStyle = CL; g.fillRect(lx, ly + T - 19, T, 3);
        }
        if (nW) {
          g.fillStyle = CV; g.fillRect(lx, ly, 4, T);
          g.fillStyle = CB; g.fillRect(lx + 4, ly, 12, T);
          g.fillStyle = CD; g.fillRect(lx + 4, ly + off, 12, 2);
          g.fillStyle = CL; g.fillRect(lx + 16, ly, 3, T);
        }
        if (nE) {
          g.fillStyle = CV; g.fillRect(lx + T - 4, ly, 4, T);
          g.fillStyle = CB; g.fillRect(lx + T - 16, ly, 12, T);
          g.fillStyle = CD; g.fillRect(lx + T - 16, ly + off, 12, 2);
          g.fillStyle = CL; g.fillRect(lx + T - 19, ly, 3, T);
        }
      }
    }
  };

  PC.TowerLayout.prototype._drawSign = function (g, s, lx, ly) {
    var pad = 8;
    g.font = '10px monospace'; g.textBaseline = 'middle'; g.textAlign = 'center';
    var w = Math.ceil(g.measureText(s.text).width) + pad * 2 + (s.arrow ? 14 : 0);
    var h = 20;
    var plate = s.tone === 'exit' ? '#1d5c34' : s.tone === 'warn' ? '#6b3a1d' : '#232035';
    var edge = s.tone === 'exit' ? COL.green : s.tone === 'warn' ? COL.gold : COL.steelLite;
    g.fillStyle = 'rgba(6,6,14,0.55)'; g.fillRect(lx - w / 2 + 2, ly - h / 2 + 3, w, h);
    g.fillStyle = plate; g.fillRect(lx - w / 2, ly - h / 2, w, h);
    g.strokeStyle = edge; g.lineWidth = 1;
    g.strokeRect(lx - w / 2 + 0.5, ly - h / 2 + 0.5, w - 1, h - 1);
    g.fillStyle = edge;
    g.fillText(s.text, lx + (s.arrow ? 7 : 0), ly + 1);
    if (s.arrow === 'up') {
      var ax = lx - w / 2 + 10;
      g.beginPath(); g.moveTo(ax, ly - 5); g.lineTo(ax + 5, ly + 4); g.lineTo(ax - 5, ly + 4);
      g.closePath(); g.fill();
    }
  };

  PC.TowerLayout.prototype._signage = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH;
    for (var i = 0; i < this.signs.length; i++) {
      var s = this.signs[i];
      if (s.x < x0 - 140 || s.x > x0 + CH + 140) continue;
      if (s.y < y0 - 40 || s.y > y0 + CH + 40) continue;
      this._drawSign(g, s, s.x - x0, s.y - y0);
    }
  };
})();
