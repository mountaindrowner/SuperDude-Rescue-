// world_sewer.js - PC.SewerLayout (v0.34.0): MAP 5 THE UNDERGROUND.
// The fifth fabric geometry, and the first INVERTED one: every other
// map is open ground with solid things ON it - the sewers are solid
// ROCK with space carved OUT. Corridors run along the odd block lines
// (256px wide, walls 768px thick between), junction chambers open up
// where tunnels cross, and the eight spec landmarks are carved caverns
// with their own dressing. Wet stone, rusty pipes, bioluminescent
// moss, and a spoiled-sludge flood that thickens toward the Deep Sump.
// Same architecture law as Park/Suburb/Labs: ONE deterministic source
// (carvedAt) feeds the painter AND solidsForChunk, so collision always
// matches pixels. Corridor bounds sit exactly on the 64px solid grid.
window.PC = window.PC || {};
(function () {
  var CH = PC.CHUNK || 512;
  var HW = 128;                 // corridor half-width (256 total, 64-aligned)
  var CELL = 64;                // solid scan cell

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

  var COL = {
    // READABILITY LAW (v0.39.0, Mark on-device: "I don't know if I'm
    // under or in... anything not walkable should be rock, bordered by
    // walls"): rock is FLAT near-black - no boulders, no cracks, no
    // mid-tones that read as a roof. Floor is clearly lighter. The
    // boundary gets a REAL brick wall edge, drawn only where floor
    // truly meets rock.
    rock: '#0c1110', rockMottle: '#090d0c',
    floor: '#4a5a52', floorLite: '#56695f', floorDark: '#404f48',
    seam: '#37453e',
    wallBrick: '#6b5844', wallBrickDark: '#4e3f2e', wallLip: '#9ab5a8',
    wallVoid: '#040706',
    water: '#14383f', waterLite: '#1d5560', waterGlint: '#35d0ff',
    moss: '#5a7a4a', mossGlow: '#7a9a66',
    mush: '#8fd14f', mushSpot: '#d9f2a8', mushStem: '#c9c2a6',
    mushGlow: 'rgba(174,240,106,0.22)', mushOutline: '#2a3a14',
    pipe: '#6e4a2f', pipeLite: '#b5793f', pipeDark: '#4d3421',
    metal: '#514e6b', metalLite: '#6d6a8e',
    iron: '#4a4038', ironLite: '#8a7a60', rust: '#7a5030',
    goo: '#7fb043', gooLite: '#a3d45f', gooDark: '#4f7328',
    gooOutline: '#2f4a17', gooBubble: '#d9f2a8',
    lagoon: '#454e10', lagoonRim: '#262a08', junkDark: '#2e3310',
    glowCyan: '#35d0ff', beam: 'rgba(255,243,196,0.26)',
    brick: '#7a5a48', brickDark: '#5c4436', brickLite: '#8d6c58',
    stoneBrick: '#3d4a41', stoneBrickLite: '#4a5a4f',
    handle: '#c33a2e',
    shadow: 'rgba(6,10,9,0.45)',
  };

  // =====================================================================
  PC.SewerLayout = function (def) {
    this.def = def;
    this.blocks = def.blocks;
    this.size = def.blocks * CH;
    // landmark caverns in world px (inset 16 so a wall ring survives
    // around each cavern even when it kisses a corridor)
    this.marks = [];
    for (var i = 0; i < def.landmarks.length; i++) {
      var L = def.landmarks[i];
      this.marks.push({
        id: L.id, name: L.name,
        x: L.c0 * CH + 16, y: L.r0 * CH + 16,
        w: (L.c1 - L.c0 + 1) * CH - 32, h: (L.r1 - L.r0 + 1) * CH - 32,
      });
    }
    // TWISTS (v0.35.1, Mark: "add twisting and turning spaces... it
    // shouldn't just be straight lines"): non-ring tunnels serpentine
    // (bend baked into carvedAt), chambers go lumpy, and DIAGONAL
    // connector tunnels cut between junction nodes like a real
    // interchange. The subway ring stays engineering-straight - the
    // train needs it, and the contrast sells both identities.
    this.diags = [];
    for (var di = 3; di <= this.blocks - 5; di += 2) {
      for (var dj = 3; dj <= this.blocks - 5; dj += 2) {
        if (h2(di, dj, 66) > 0.16) continue;
        var down = h2(di, dj, 67) < 0.5;
        var dj2 = down ? dj + 2 : dj - 2;
        if (dj2 < 3 || dj2 > this.blocks - 3) continue;
        this.diags.push({
          x1: di * CH + CH / 2, y1: dj * CH + CH / 2,
          x2: (di + 2) * CH + CH / 2, y2: dj2 * CH + CH / 2,
        });
      }
    }
    this._spokeCache = {};

    // THE GRID (v0.40.0, Mark: "boundaries more strict... a nice
    // straight line at the edge... tiling should not mix"): the
    // analytic carve (serpentines, lumpy chambers, diagonals) is
    // QUANTIZED once onto the 64px collision grid, then cleaned -
    // rock islands stranded inside paths become floor, floor pockets
    // sealed off from the spawn become rock. From here on, this grid
    // IS the level: collision, paint clip and wall edges all read the
    // same cells, so every boundary is a hard axis-aligned line.
    var N = this.gridN = Math.floor(this.size / CELL);
    var walk = this.grid = new Uint8Array(N * N);
    var gi, gx, gy;
    for (gy = 0; gy < N; gy++) {
      for (gx = 0; gx < N; gx++) {
        walk[gy * N + gx] =
          this._analyticCarved(gx * CELL + CELL / 2, gy * CELL + CELL / 2) ? 1 : 0;
      }
    }
    // one smoothing pass: lone nubs join their neighborhood, so the
    // stepped edges read as deliberate tiles, not noise
    var snap = new Uint8Array(walk);
    for (gy = 1; gy < N - 1; gy++) {
      for (gx = 1; gx < N - 1; gx++) {
        gi = gy * N + gx;
        var nOpen = snap[gi - 1] + snap[gi + 1] + snap[gi - N] + snap[gi + N];
        if (snap[gi] === 1 && nOpen <= 1) walk[gi] = 0;
        else if (snap[gi] === 0 && nOpen >= 3) walk[gi] = 1;
      }
    }
    // rock ISLANDS: label every rock component; only genuinely tiny
    // ones (a few stray cells sitting in a walkway) become floor.
    // (v0.40.0 lesson: the first version removed rock "not connected
    // to the border" - but the subway ring is a floor MOAT, so every
    // interior rock mass counted as an island and the map melted into
    // one plaza. Size is the correct test, not connectivity.)
    var MIN_ROCK = 12;                       // cells (< ~12 = debris)
    var seen = new Uint8Array(N * N);
    for (gi = 0; gi < N * N; gi++) {
      if (walk[gi] || seen[gi]) continue;
      var comp = [gi], qh2 = 0;
      seen[gi] = 1;
      while (qh2 < comp.length) {
        var c0 = comp[qh2++], cxg = c0 % N, cyg = (c0 / N) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var nx2 = cxg + d[0], ny2 = cyg + d[1];
          if (nx2 < 0 || ny2 < 0 || nx2 >= N || ny2 >= N) return;
          var ni = ny2 * N + nx2;
          if (!walk[ni] && !seen[ni]) { seen[ni] = 1; comp.push(ni); }
        });
      }
      if (comp.length < MIN_ROCK) {
        for (var ci2 = 0; ci2 < comp.length; ci2++) walk[comp[ci2]] = 1;
      }
    }
    // flood FLOOR from the spawn: floor the player can never reach
    // becomes rock (kills sealed pockets AND guarantees one region)
    var sgx = Math.floor(((def.spawn.c + 0.5) * CH + 96) / CELL);
    var sgy = Math.floor(((def.spawn.r + 0.5) * CH + 96) / CELL);
    var seen2 = new Uint8Array(N * N), q2 = [sgy * N + sgx];
    seen2[q2[0]] = 1; qh = 0;
    while (qh < q2.length) {
      var c1 = q2[qh++], cx1 = c1 % N, cy1 = (c1 / N) | 0;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var nx3 = cx1 + d[0], ny3 = cy1 + d[1];
        if (nx3 < 0 || ny3 < 0 || nx3 >= N || ny3 >= N) return;
        var ni2 = ny3 * N + nx3;
        if (walk[ni2] && !seen2[ni2]) { seen2[ni2] = 1; q2.push(ni2); }
      });
    }
    for (gi = 0; gi < N * N; gi++) if (walk[gi] && !seen2[gi]) walk[gi] = 0;

    // ---- SIGNAGE + STATIONS (v0.41.0, Mark: "obvious subway
    // distinction and sewer distinction... signs... obvious subway
    // hubs"). All precomputed in world coords; painted per chunk. ----
    var RL = 1 * CH + CH / 2, RH = (this.blocks - 1) * CH + CH / 2;
    var RM = 9 * CH + CH / 2;
    // 8 stations: 4 ring corners + 4 mid-ring (incl. under the Grate)
    this.stations = [
      { x: RL, y: RL, horiz: true }, { x: RH, y: RL, horiz: true },
      { x: RL, y: RH, horiz: true }, { x: RH, y: RH, horiz: true },
      { x: RM, y: RL, horiz: true }, { x: RM, y: RH, horiz: true },
      { x: RL, y: RM, horiz: false }, { x: RH, y: RM, horiz: false },
    ];
    this.signs = [];
    var self2 = this;
    function addSign(x, y, text, arrow, tone) {
      self2.signs.push({ x: x, y: y, text: text, arrow: arrow || null,
                        tone: tone || 'sewer' });
    }
    // landmark direction signs: first walkable pad just outside the
    // rect (S, N, E, W tried in order), arrow pointing INTO the room
    var SHORT = { grate: 'MAIN GRATE', junction: 'JUNCTION ALPHA',
      pumps: 'PUMP WORKS', fungal: 'FUNGAL CAVERN', catwalk: 'CATWALK MAZE',
      reservoir: 'RESERVOIR', sump: 'DEEP SUMP', cistern: 'OLD CISTERN' };
    this.marks.forEach(function (m) {
      var mcx2 = m.x + m.w / 2, mcy2 = m.y + m.h / 2;
      var tries = [
        { x: mcx2, y: m.y + m.h + 40, arrow: 'up' },
        { x: mcx2, y: m.y - 40, arrow: 'down' },
        { x: m.x + m.w + 40, y: mcy2, arrow: 'left' },
        { x: m.x - 40, y: mcy2, arrow: 'right' },
      ];
      for (var t = 0; t < tries.length; t++) {
        if (self2._analyticCarved(tries[t].x, tries[t].y)) {
          addSign(tries[t].x, tries[t].y, SHORT[m.id] || m.id.toUpperCase(),
                  tries[t].arrow, 'sewer');
          break;
        }
      }
    });
    // flavor + safety signage
    var grate = this.marks.filter(function (m) { return m.id === 'grate'; })[0];
    if (grate) {
      addSign(grate.x + grate.w / 2 - 90, grate.y + grate.h - 60,
              'SEWER ACCESS', 'down', 'sewer');
      addSign(grate.x + grate.w / 2 + 100, grate.y + 100,
              'AUTHORIZED PERSONNEL ONLY', null, 'warn');
    }
    var sump = this.marks.filter(function (m) { return m.id === 'sump'; })[0];
    if (sump) addSign(sump.x + sump.w / 2 - 150, sump.y + 70, 'NO SWIMMING', null, 'warn');
    var cist = this.marks.filter(function (m) { return m.id === 'cistern'; })[0];
    if (cist) addSign(cist.x + cist.w / 2 + 110, cist.y + 50, 'CITY VAULT - KEEP OUT', null, 'warn');
    var cat = this.marks.filter(function (m) { return m.id === 'catwalk'; })[0];
    if (cat) {
      addSign(cat.x + cat.w / 2, cat.y - 40, 'SURGE ZONE - DO NOT STOP', null, 'warn');
      addSign(cat.x + 140, cat.y + 70, 'STAY ON THE CATWALKS', null, 'warn');
    }
    var resv = this.marks.filter(function (m) { return m.id === 'reservoir'; })[0];
    if (resv) addSign(resv.x + resv.w / 2, resv.y + 76, 'STRUCTURE UNSAFE', null, 'warn');
    var fung = this.marks.filter(function (m) { return m.id === 'fungal'; })[0];
    if (fung) addSign(fung.x + fung.w / 2 - 130, fung.y + 66, 'SPORE ZONE - SLOW GOING', null, 'warn');
    // MIND THE TRAIN plates along the ring, every 4th block
    for (var mb = 3; mb < this.blocks - 2; mb += 4) {
      addSign(mb * CH + CH / 2, RL - HW - 34, 'MIND THE TRAIN', null, 'metro');
      addSign(mb * CH + CH / 2, RH + HW + 34, 'MIND THE TRAIN', null, 'metro');
      addSign(RL - HW - 34, mb * CH + CH / 2, 'LOOP LINE', null, 'metro');
      addSign(RH + HW + 34, mb * CH + CH / 2, 'LOOP LINE', null, 'metro');
    }

    // schematic export for PC_MapView: the tunnel network as data
    this.tunnels = { v: [], h: [], chambers: [], hw: HW };
    for (var tc = 1; tc < this.blocks; tc += 2) {
      this.tunnels.v.push(tc * CH + CH / 2);
      this.tunnels.h.push(tc * CH + CH / 2);
      for (var tr = 1; tr < this.blocks; tr += 2) {
        var R = this._chamber(tc, tr);
        if (R) this.tunnels.chambers.push({ x: tc * CH + CH / 2, y: tr * CH + CH / 2, r: R });
      }
    }
  };

  // ---- the ONE source of truth ---------------------------------------
  PC.SewerLayout.prototype._chamber = function (i, j) {
    // junction chamber where odd tunnel lines cross; ~60% of junctions
    if ((i % 2) !== 1 || (j % 2) !== 1) return 0;
    if (i < 0 || j < 0 || i >= this.blocks || j >= this.blocks) return 0;
    var r = h2(i, j, 7);
    if (r > 0.6) return 0;
    return 240 + r * 130;                       // radius 240..318
  };

  // serpentine offset of a non-ring tunnel's centerline at coord t
  PC.SewerLayout.prototype._bendV = function (c, y) {
    if (c === 1 || c === this.blocks - 1) return 0;      // subway: straight
    return (smooth(c * 997, y, 1300, 23) * 2 - 1) * 104;
  };
  PC.SewerLayout.prototype._bendH = function (r, x) {
    if (r === 1 || r === this.blocks - 1) return 0;
    return (smooth(x, r * 997, 1300, 24) * 2 - 1) * 104;
  };
  // 8 lumpy spoke radii per chamber (cached), lerped by angle
  PC.SewerLayout.prototype._spokes = function (i, j, R) {
    var key = i + '_' + j, sp = this._spokeCache[key];
    if (!sp) {
      sp = [];
      for (var k = 0; k < 8; k++) sp.push(R * (0.78 + 0.42 * h2(i * 8 + k, j, 61)));
      this._spokeCache[key] = sp;
    }
    return sp;
  };
  PC.SewerLayout.prototype._chamberRAt = function (i, j, R, ang) {
    var sp = this._spokes(i, j, R);
    var a = ((ang / (Math.PI / 4)) % 8 + 8) % 8;
    var k0 = Math.floor(a), f = a - k0;
    return sp[k0 % 8] * (1 - f) + sp[(k0 + 1) % 8] * f;
  };

  PC.SewerLayout.prototype.markAt = function (x, y) {
    for (var i = 0; i < this.marks.length; i++) {
      var m = this.marks[i];
      if (x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h) return m;
    }
    return null;
  };

  PC.SewerLayout.prototype._analyticCarved = function (x, y) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return false;
    if (this.markAt(x, y)) return true;
    // vertical tunnels on odd block columns (serpentine off-ring)
    var c = Math.round((x - CH / 2) / CH);
    if ((c % 2) === 1 && c > 0 && c < this.blocks &&
        Math.abs(x - (c * CH + CH / 2 + this._bendV(c, y))) < HW) return true;
    // horizontal tunnels on odd block rows
    var r = Math.round((y - CH / 2) / CH);
    if ((r % 2) === 1 && r > 0 && r < this.blocks &&
        Math.abs(y - (r * CH + CH / 2 + this._bendH(r, x))) < HW) return true;
    // lumpy junction chambers
    var ci = Math.round((x - CH / 2) / CH), cj = Math.round((y - CH / 2) / CH);
    var R = this._chamber(ci, cj);
    if (R) {
      var dx = x - (ci * CH + CH / 2), dy = y - (cj * CH + CH / 2);
      var dd = Math.sqrt(dx * dx + dy * dy);
      if (dd < this._chamberRAt(ci, cj, R, Math.atan2(dy, dx))) return true;
    }
    // diagonal interchange connectors
    for (var dg = 0; dg < this.diags.length; dg++) {
      var D = this.diags[dg];
      var vx = D.x2 - D.x1, vy = D.y2 - D.y1;
      var wx = x - D.x1, wy = y - D.y1;
      var tt = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
      var ex = D.x1 + vx * tt - x, ey = D.y1 + vy * tt - y;
      if (ex * ex + ey * ey < 92 * 92) return true;
    }
    return false;
  };

  // ---- ZONE EFFECTS (v0.42.0): the map pushes back. Fungal spores
  // thicken the air; catwalk water is wading-deep off the planks.
  // Pure rect/band math - the caller just multiplies its speed. ----
  PC.SewerLayout.prototype.zoneEffectAt = function (x, y) {
    for (var i = 0; i < this.marks.length; i++) {
      var m = this.marks[i];
      if (x < m.x || x >= m.x + m.w || y < m.y || y >= m.y + m.h) continue;
      if (m.id === 'fungal') return { slow: 0.78, kind: 'spore' };
      if (m.id === 'catwalk') {
        // on a plank lane = full speed; in the water = wading
        var laneW = 56, fx = (x - m.x) / m.w, fy = (y - m.y) / m.h;
        var hL = [0.2, 0.5, 0.8], vL = [0.16, 0.49, 0.82], k;
        for (k = 0; k < 3; k++) {
          if (Math.abs(y - (m.y + m.h * hL[k])) < laneW / 2 + 4) return null;
          if (Math.abs(x - (m.x + m.w * vL[k])) < laneW / 2 + 4) return null;
        }
        return { slow: 0.6, kind: 'water' };
      }
      return null;
    }
    return null;
  };

  // the grid IS the truth: paint, walls and solids all read this
  PC.SewerLayout.prototype.carvedAt = function (x, y) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return false;
    var N = this.gridN;
    return !!this.grid[Math.floor(y / CELL) * N + Math.floor(x / CELL)];
  };

  // ---- collision ------------------------------------------------------
  PC.SewerLayout.prototype.solidsForChunk = function (cx, cy) {
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

  // =====================================================================
  // PAINT
  // =====================================================================
  PC.SewerLayout.prototype.paintChunk = function (scene, g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH, self = this;

    // ---- 1. solid rock: FLAT near-black. Texture is the enemy of
    // readability here - the old boulder blobs read as a ceiling. ----
    g.fillStyle = COL.rock;
    g.fillRect(0, 0, CH, CH);
    g.fillStyle = COL.rockMottle;
    for (var rm2 = 0; rm2 < 9; rm2++) {
      var rmx = h2(cx * 9 + rm2, cy, 21) * CH, rmy = h2(cx, cy * 9 + rm2, 22) * CH;
      var rms = 40 + h2(rm2, cx + cy, 23) * 70;
      g.beginPath(); g.ellipse(rmx, rmy, rms, rms * 0.7, 0, 0, Math.PI * 2); g.fill();
    }

    // ---- 2. carve: clip to the FLOOR CELLS of this chunk. The grid
    // is the truth, so every painted edge lands exactly on a cell
    // line - hard, straight, and identical to the collision. ----
    var clipRects = this._floorRects(cx, cy);
    if (!clipRects.length) return;

    g.save();
    g.beginPath();
    for (var si = 0; si < clipRects.length; si++) {
      var crr = clipRects[si];
      g.rect(crr.x - x0, crr.y - y0, crr.w, crr.h);
    }
    g.clip();

    // floor base: wet flagstone in OFFSET courses (brick-like, not the
    // clean panel grid that made round 1 read as the Labs)
    g.fillStyle = COL.floor;
    g.fillRect(0, 0, CH, CH);
    for (var fy = 0; fy < CH; fy += 32) {
      for (var fx2 = 0; fx2 < CH; fx2 += 32) {
        var fn = smooth(x0 + fx2, y0 + fy, 70, 13);
        if (fn > 0.6) { g.fillStyle = COL.floorLite; g.fillRect(fx2, fy, 32, 32); }
        else if (fn < 0.36) { g.fillStyle = COL.floorDark; g.fillRect(fx2, fy, 32, 32); }
      }
    }
    g.strokeStyle = COL.seam; g.lineWidth = 1;
    for (var sy = ((-(y0 % 48)) + 48) % 48; sy < CH; sy += 48) {
      g.beginPath(); g.moveTo(0, sy); g.lineTo(CH, sy); g.stroke();
      // vertical joints offset every other course
      var course = Math.floor((y0 + sy) / 48);
      var joff = (course % 2) * 40;
      for (var jx = ((-((x0 - joff) % 80)) + 80) % 80; jx < CH; jx += 80) {
        g.beginPath(); g.moveTo(jx, sy); g.lineTo(jx, Math.min(CH, sy + 48)); g.stroke();
      }
    }
    // (wet glints + ambient puddles removed v0.39.0 - noise, not info)

    // ---- water gutters down corridor centers ----
    this._gutters(g, cx, cy);

    // ---- moss + drips near walls ----
    this._moss(g, cx, cy);

    // ---- landmark cavern dressing (before the wall skirt caps it) ----
    for (var mi = 0; mi < this.marks.length; mi++) {
      var mk = this.marks[mi];
      if (mk.x < x0 + CH && mk.x + mk.w > x0 && mk.y < y0 + CH && mk.y + mk.h > y0) {
        this._dressMark(g, mk, x0, y0, cx, cy);
      }
    }
    g.restore();

    // ---- 3. THE WALL EDGE (v0.39.0): scan 16px cells; wherever floor
    // touches rock, draw a real brick wall band on that side - void
    // gap at the boundary, brick course, bright lip toward the floor.
    // Cell-tested from carvedAt itself, so it only ever appears at TRUE
    // rock boundaries - no phantom lines across open rooms. ----
    this._wallEdges(g, cx, cy);

    // ---- 4. pipes + goo, ALSO clipped to floor cells: decor never
    // bleeds across a boundary onto rock (Mark: "tiling should not
    // mix with other spaces") ----
    g.save();
    g.beginPath();
    for (var si2 = 0; si2 < clipRects.length; si2++) {
      var crr2 = clipRects[si2];
      g.rect(crr2.x - x0, crr2.y - y0, crr2.w, crr2.h);
    }
    g.clip();
    this._pipes(g, cx, cy);
    this._gooPass(g, cx, cy);
    g.restore();

    // ---- 5. stations + signage LAST: nothing may ever occlude a sign
    // (judge round: a goo blob sat on the RESERVOIR plate) ----
    this._signage(g, cx, cy);
  };

  PC.SewerLayout.prototype._drawSign = function (g, x, y, text, arrow, tone) {
    g.font = 'bold 10px monospace';
    var tw = Math.ceil(g.measureText(text).width);
    var w = tw + 16 + (arrow ? 13 : 0), h = 20;
    var plate = tone === 'warn' ? '#f2c33c' : tone === 'metro' ? '#1c2733' : '#233029';
    var ink = tone === 'warn' ? '#1b1530' : '#efe9da';
    var trim = tone === 'warn' ? '#1b1530' : tone === 'metro' ? '#35d0ff' : '#9ab5a8';
    // pole + shadow so it stands IN the world
    g.fillStyle = 'rgba(6,10,9,0.45)';
    g.beginPath(); g.ellipse(x + 3, y + 16, w * 0.4, 5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#4e3f2e'; g.fillRect(x - 2, y + 4, 4, 12);
    g.fillStyle = plate;
    g.fillRect(x - w / 2, y - h + 4, w, h);
    g.strokeStyle = trim; g.lineWidth = 2;
    g.strokeRect(x - w / 2, y - h + 4, w, h);
    g.fillStyle = ink;
    g.textAlign = 'left'; g.textBaseline = 'middle';
    var tx2 = x - w / 2 + 7, ty2 = y - h / 2 + 4;
    if (arrow) {
      g.beginPath();
      if (arrow === 'up') { g.moveTo(tx2, ty2 + 4); g.lineTo(tx2 + 8, ty2 + 4); g.lineTo(tx2 + 4, ty2 - 5); }
      else if (arrow === 'down') { g.moveTo(tx2, ty2 - 4); g.lineTo(tx2 + 8, ty2 - 4); g.lineTo(tx2 + 4, ty2 + 5); }
      else if (arrow === 'left') { g.moveTo(tx2 + 8, ty2 - 4); g.lineTo(tx2 + 8, ty2 + 4); g.lineTo(tx2 - 1, ty2); }
      else { g.moveTo(tx2, ty2 - 4); g.lineTo(tx2, ty2 + 4); g.lineTo(tx2 + 9, ty2); }
      g.closePath(); g.fill();
      tx2 += 12;
    }
    g.fillText(text, tx2, ty2);
  };

  PC.SewerLayout.prototype._signage = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH, i;
    var RL = 1 * CH + CH / 2, RH = (this.blocks - 1) * CH + CH / 2;
    var isRingCoord = function (v) { return v === RL || v === RH; };

    // ---- rail diamonds: a dark crossing plate under every
    // track-x-track intersection so the rails ride a junction plate
    // instead of interleaving (judge: raw overlaps read as a bug) ----
    var corners = [[RL, RL], [RH, RL], [RL, RH], [RH, RH]];
    for (i = 0; i < corners.length; i++) {
      var cnx = corners[i][0] - x0, cny = corners[i][1] - y0;
      if (cnx < -80 || cnx > CH + 80 || cny < -80 || cny > CH + 80) continue;
      g.fillStyle = '#0a0e0d';
      g.fillRect(cnx - 40, cny - 40, 80, 80);
      g.strokeStyle = '#8b88a8'; g.lineWidth = 2;
      g.strokeRect(cnx - 40, cny - 40, 80, 80);
      g.strokeStyle = '#514e6b'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cnx - 40, cny - 40); g.lineTo(cnx + 40, cny + 40); g.stroke();
      g.beginPath(); g.moveTo(cnx + 40, cny - 40); g.lineTo(cnx - 40, cny + 40); g.stroke();
    }

    // ---- station platforms (split into two decks when a crossing
    // track bisects the station; yellow safety caps at every track
    // edge, deck NEVER runs under a rail) ----
    for (i = 0; i < this.stations.length; i++) {
      var st = this.stations[i];
      if (st.x + 260 < x0 || st.x - 260 > x0 + CH ||
          st.y + 260 < y0 || st.y - 260 > y0 + CH) continue;
      var lx3 = st.x - x0, ly3 = st.y - y0;
      var atCorner = isRingCoord(st.x) && isRingCoord(st.y);
      if (st.horiz) {
        var py3 = ly3 - 100;
        var segs = atCorner ? [[-220, -52], [52, 220]] : [[-220, 220]];
        for (var sgi = 0; sgi < segs.length; sgi++) {
          var a0 = segs[sgi][0], a1 = segs[sgi][1];
          g.fillStyle = '#b9b2a0'; g.fillRect(lx3 + a0, py3, a1 - a0, 56);
          g.strokeStyle = '#8a8474'; g.lineWidth = 1;
          for (var tgx = a0; tgx <= a1; tgx += 22) {
            g.beginPath(); g.moveTo(lx3 + tgx, py3); g.lineTo(lx3 + tgx, py3 + 56); g.stroke();
          }
          g.beginPath(); g.moveTo(lx3 + a0, py3 + 28); g.lineTo(lx3 + a1, py3 + 28); g.stroke();
          // safety line: along the track edge + capping any inner end
          g.fillStyle = '#f2c33c';
          g.fillRect(lx3 + a0, py3 + 50, a1 - a0, 6);
          if (atCorner) {
            var capX = sgi === 0 ? a1 - 6 : a0;
            g.fillRect(lx3 + capX, py3, 6, 56);
          }
          // columns on each deck
          var colAt = sgi === 0 ? a0 + 60 : a1 - 60;
          g.fillStyle = 'rgba(6,10,9,0.4)';
          g.beginPath(); g.ellipse(lx3 + colAt + 4, py3 + 16, 12, 5, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#6d6a8e'; g.fillRect(lx3 + colAt - 6, py3 - 2, 12, 14);
          g.fillStyle = '#8b88a8'; g.fillRect(lx3 + colAt - 6, py3 - 2, 12, 3);
        }
        // bench only on an unbroken deck
        if (!atCorner) {
          g.fillStyle = '#4e3f2e'; g.fillRect(lx3 - 40, py3 + 10, 80, 8);
          g.fillStyle = '#6b5844'; g.fillRect(lx3 - 40, py3 + 8, 80, 4);
        }
      } else {
        var px3 = lx3 - 100;
        var segsV = atCorner ? [[-220, -52], [52, 220]] : [[-220, 220]];
        for (var sgj = 0; sgj < segsV.length; sgj++) {
          var b0 = segsV[sgj][0], b1 = segsV[sgj][1];
          g.fillStyle = '#b9b2a0'; g.fillRect(px3, ly3 + b0, 56, b1 - b0);
          g.strokeStyle = '#8a8474'; g.lineWidth = 1;
          for (var tgy = b0; tgy <= b1; tgy += 22) {
            g.beginPath(); g.moveTo(px3, ly3 + tgy); g.lineTo(px3 + 56, ly3 + tgy); g.stroke();
          }
          g.beginPath(); g.moveTo(px3 + 28, ly3 + b0); g.lineTo(px3 + 28, ly3 + b1); g.stroke();
          g.fillStyle = '#f2c33c';
          g.fillRect(px3 + 50, ly3 + b0, 6, b1 - b0);
          if (atCorner) {
            var capY = sgj === 0 ? b1 - 6 : b0;
            g.fillRect(px3, ly3 + capY, 56, 6);
          }
          var colAtV = sgj === 0 ? b0 + 60 : b1 - 60;
          g.fillStyle = 'rgba(6,10,9,0.4)';
          g.beginPath(); g.ellipse(px3 + 20, ly3 + colAtV + 12, 12, 5, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#6d6a8e'; g.fillRect(px3 + 10, ly3 + colAtV - 6, 12, 14);
          g.fillStyle = '#8b88a8'; g.fillRect(px3 + 10, ly3 + colAtV - 6, 12, 3);
        }
      }
    }

    // ---- ALL boards + plates LAST (judge: a sign nothing may occlude
    // or clip; 8px clear zone via the plate's own opaque body) ----
    for (i = 0; i < this.stations.length; i++) {
      var st2 = this.stations[i];
      if (st2.x + 260 < x0 || st2.x - 260 > x0 + CH ||
          st2.y + 260 < y0 || st2.y - 260 > y0 + CH) continue;
      if (st2.horiz) this._drawSign(g, st2.x - x0, st2.y - y0 - 112, 'LOOP LINE - STATION', null, 'metro');
      else this._drawSign(g, st2.x - x0 - 72, st2.y - y0 - 232, 'LOOP LINE - STATION', null, 'metro');
    }
    for (i = 0; i < this.signs.length; i++) {
      var sg = this.signs[i];
      if (sg.x + 140 < x0 || sg.x - 140 > x0 + CH ||
          sg.y + 70 < y0 || sg.y - 70 > y0 + CH) continue;
      this._drawSign(g, sg.x - x0, sg.y - y0, sg.text, sg.arrow, sg.tone);
    }
  };

  // merged horizontal runs of FLOOR cells in a chunk (mirror of
  // solidsForChunk, other polarity)
  PC.SewerLayout.prototype._floorRects = function (cx, cy) {
    var out = [], x0 = cx * CH, y0 = cy * CH;
    for (var gy = 0; gy < CH; gy += CELL) {
      var run = null;
      for (var gx = 0; gx < CH; gx += CELL) {
        var open = this.carvedAt(x0 + gx + CELL / 2, y0 + gy + CELL / 2);
        if (open) {
          if (run) run.w += CELL;
          else { run = { x: x0 + gx, y: y0 + gy, w: CELL, h: CELL }; out.push(run); }
        } else run = null;
      }
    }
    return out;
  };

  // is this point beside the Loop Line? (transit walls get subway
  // tile instead of sewer brick - instant zone identity)
  PC.SewerLayout.prototype._nearRing = function (wx, wy) {
    var RL = 1 * CH + CH / 2, RH = (this.blocks - 1) * CH + CH / 2;
    var pad = HW + CELL * 2;
    return Math.abs(wx - RL) < pad || Math.abs(wx - RH) < pad ||
           Math.abs(wy - RL) < pad || Math.abs(wy - RH) < pad;
  };

  PC.SewerLayout.prototype._wallEdges = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH, T = 16;
    for (var ly2 = 0; ly2 < CH; ly2 += T) {
      for (var lx2 = 0; lx2 < CH; lx2 += T) {
        var wx = x0 + lx2 + T / 2, wy = y0 + ly2 + T / 2;
        if (!this.carvedAt(wx, wy)) continue;
        var nN = !this.carvedAt(wx, wy - T);
        var nS = !this.carvedAt(wx, wy + T);
        var nW = !this.carvedAt(wx - T, wy);
        var nE = !this.carvedAt(wx + T, wy);
        if (!(nN || nS || nW || nE)) continue;
        var brickOff = (Math.floor((x0 + lx2) / T) % 2) * 5;
        var metro = this._nearRing(wx, wy);
        var CB = metro ? '#cfc9b8' : COL.wallBrick;
        var CD = metro ? '#9a948a' : COL.wallBrickDark;
        var CL = metro ? '#2e8fb0' : COL.wallLip;
        if (nN) {
          g.fillStyle = COL.wallVoid;  g.fillRect(lx2, ly2, T, 4);
          g.fillStyle = CB; g.fillRect(lx2, ly2 + 4, T, 12);
          g.fillStyle = CD; g.fillRect(lx2 + brickOff, ly2 + 4, 2, 12);
          g.fillStyle = CL;   g.fillRect(lx2, ly2 + 16, T, 3);
        }
        if (nS) {
          g.fillStyle = COL.wallVoid;  g.fillRect(lx2, ly2 + T - 4, T, 4);
          g.fillStyle = CB; g.fillRect(lx2, ly2 + T - 16, T, 12);
          g.fillStyle = CD; g.fillRect(lx2 + brickOff, ly2 + T - 16, 2, 12);
          g.fillStyle = CL;   g.fillRect(lx2, ly2 + T - 19, T, 3);
        }
        if (nW) {
          g.fillStyle = COL.wallVoid;  g.fillRect(lx2, ly2, 4, T);
          g.fillStyle = CB; g.fillRect(lx2 + 4, ly2, 12, T);
          g.fillStyle = CD; g.fillRect(lx2 + 4, ly2 + brickOff, 12, 2);
          g.fillStyle = CL;   g.fillRect(lx2 + 16, ly2, 3, T);
        }
        if (nE) {
          g.fillStyle = COL.wallVoid;  g.fillRect(lx2 + T - 4, ly2, 4, T);
          g.fillStyle = CB; g.fillRect(lx2 + T - 16, ly2, 12, T);
          g.fillStyle = CD; g.fillRect(lx2 + T - 16, ly2 + brickOff, 12, 2);
          g.fillStyle = CL;   g.fillRect(lx2 + T - 19, ly2, 3, T);
        }
      }
    }
  };

  // every carve shape that touches chunk (cx,cy), in WORLD coords.
  // Winding corridors and lumpy chambers come out as POLYGONS sampled
  // from the same math carvedAt uses, so paint always matches solids.
  PC.SewerLayout.prototype._shapesFor = function (cx, cy) {
    var out = [], x0 = cx * CH, y0 = cy * CH, self = this;
    for (var i = 0; i < this.marks.length; i++) {
      var m = this.marks[i];
      if (m.x < x0 + CH && m.x + m.w > x0 && m.y < y0 + CH && m.y + m.h > y0) {
        out.push({ kind: 'rect', x: m.x, y: m.y, w: m.w, h: m.h });
      }
    }
    // vertical corridors: straight ring = rect, sewer lines = poly strip
    for (var c = cx - 1; c <= cx + 1; c++) {
      if ((c % 2) !== 1 || c <= 0 || c >= this.blocks) continue;
      var vx = c * CH + CH / 2;
      if (vx + HW + 110 < x0 || vx - HW - 110 > x0 + CH) continue;
      if (c === 1 || c === this.blocks - 1) {
        out.push({ kind: 'rect', x: vx - HW, y: 0, w: HW * 2, h: this.size });
        continue;
      }
      var L = [], Rr = [];
      for (var sy = y0 - 96; sy <= y0 + CH + 96; sy += 64) {
        var bcx = vx + this._bendV(c, sy);
        L.push([bcx - HW, sy]); Rr.push([bcx + HW, sy]);
      }
      out.push({ kind: 'poly', pts: L.concat(Rr.reverse()) });
    }
    // horizontal corridors
    for (var r = cy - 1; r <= cy + 1; r++) {
      if ((r % 2) !== 1 || r <= 0 || r >= this.blocks) continue;
      var vy = r * CH + CH / 2;
      if (vy + HW + 110 < y0 || vy - HW - 110 > y0 + CH) continue;
      if (r === 1 || r === this.blocks - 1) {
        out.push({ kind: 'rect', x: 0, y: vy - HW, w: this.size, h: HW * 2 });
        continue;
      }
      var T = [], B = [];
      for (var sx = x0 - 96; sx <= x0 + CH + 96; sx += 64) {
        var bcy = vy + this._bendH(r, sx);
        T.push([sx, bcy - HW]); B.push([sx, bcy + HW]);
      }
      out.push({ kind: 'poly', pts: T.concat(B.reverse()) });
    }
    // lumpy junction chambers as 16-gons off the spoke radii
    for (var j = cy - 1; j <= cy + 1; j++) {
      for (var i2 = cx - 1; i2 <= cx + 1; i2++) {
        var R = this._chamber(i2, j);
        if (!R) continue;
        var chx = i2 * CH + CH / 2, chy = j * CH + CH / 2;
        var maxR = R * 1.2;
        if (chx + maxR < x0 || chx - maxR > x0 + CH || chy + maxR < y0 || chy - maxR > y0 + CH) continue;
        var pts = [];
        for (var k = 0; k < 16; k++) {
          var a = k * Math.PI / 8;
          var rr2 = this._chamberRAt(i2, j, R, a);
          pts.push([chx + Math.cos(a) * rr2, chy + Math.sin(a) * rr2]);
        }
        out.push({ kind: 'poly', pts: pts });
      }
    }
    // diagonal connectors as quads
    for (var dg = 0; dg < this.diags.length; dg++) {
      var D = this.diags[dg];
      var lo = Math.min(D.x1, D.x2) - 92, hi = Math.max(D.x1, D.x2) + 92;
      var lo2 = Math.min(D.y1, D.y2) - 92, hi2 = Math.max(D.y1, D.y2) + 92;
      if (hi < x0 || lo > x0 + CH || hi2 < y0 || lo2 > y0 + CH) continue;
      var vx2 = D.x2 - D.x1, vy2 = D.y2 - D.y1;
      var vl = Math.hypot(vx2, vy2) || 1;
      var nx = -vy2 / vl * 92, ny = vx2 / vl * 92;
      out.push({ kind: 'poly', pts: [
        [D.x1 + nx, D.y1 + ny], [D.x2 + nx, D.y2 + ny],
        [D.x2 - nx, D.y2 - ny], [D.x1 - nx, D.y1 - ny]] });
    }
    return out;
  };

  // trace any shape into the current path (local coords)
  function traceShape(g, sh, x0, y0) {
    if (sh.kind === 'rect') g.rect(sh.x - x0, sh.y - y0, sh.w, sh.h);
    else if (sh.kind === 'circle') {
      g.moveTo(sh.x - x0 + sh.r, sh.y - y0);
      g.arc(sh.x - x0, sh.y - y0, sh.r, 0, Math.PI * 2);
    } else {
      var pts = sh.pts;
      g.moveTo(pts[0][0] - x0, pts[0][1] - y0);
      for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0] - x0, pts[i][1] - y0);
      g.closePath();
    }
  }

  // the LOOP LINE ring (v0.35.0 sewer/subway combo): cols+rows 1 and 17
  PC.SewerLayout.prototype._isTrackCol = function (c) { return c === 1 || c === this.blocks - 1; };
  PC.SewerLayout.prototype._isTrackRow = function (r) { return r === 1 || r === this.blocks - 1; };

  // subway rails down a track corridor: twin steel rails on dark ties
  PC.SewerLayout.prototype._railsV = function (g, vx, x0, y0) {
    var GA = 18;                       // half rail gauge
    g.fillStyle = '#241f1c';
    g.fillRect(vx - 34, 0, 68, CH);
    g.fillStyle = '#4d3421';
    for (var ty = ((-(y0 % 26)) + 26) % 26; ty < CH; ty += 26) {
      g.fillRect(vx - 30, ty, 60, 8);
    }
    g.fillStyle = '#8b88a8';
    g.fillRect(vx - GA - 2, 0, 4, CH); g.fillRect(vx + GA - 2, 0, 4, CH);
    g.fillStyle = '#cfd4e8';
    g.fillRect(vx - GA - 2, 0, 1, CH); g.fillRect(vx + GA - 2, 0, 1, CH);
    // third-rail warning stripe on the west edge
    g.fillStyle = '#f2c33c';
    for (var wy = ((-(y0 % 64)) + 64) % 64; wy < CH; wy += 64) {
      g.fillRect(vx - 44, wy, 6, 22);
    }
  };
  PC.SewerLayout.prototype._railsH = function (g, vy, x0, y0) {
    var GA = 18;
    g.fillStyle = '#241f1c';
    g.fillRect(0, vy - 34, CH, 68);
    g.fillStyle = '#4d3421';
    for (var tx = ((-(x0 % 26)) + 26) % 26; tx < CH; tx += 26) {
      g.fillRect(tx, vy - 30, 8, 60);
    }
    g.fillStyle = '#8b88a8';
    g.fillRect(0, vy - GA - 2, CH, 4); g.fillRect(0, vy + GA - 2, CH, 4);
    g.fillStyle = '#cfd4e8';
    g.fillRect(0, vy - GA - 2, CH, 1); g.fillRect(0, vy + GA - 2, CH, 1);
    g.fillStyle = '#f2c33c';
    for (var wx = ((-(x0 % 64)) + 64) % 64; wx < CH; wx += 64) {
      g.fillRect(wx, vy - 44, 22, 6);
    }
  };

  // ---- water gutter strips down the middle of each corridor ----
  PC.SewerLayout.prototype._gutters = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH;
    var GW = 44;
    for (var c = cx - 1; c <= cx + 1; c++) {
      if ((c % 2) !== 1 || c <= 0 || c >= this.blocks) continue;
      var vx = c * CH + CH / 2 - x0;
      if (vx + GW / 2 < 0 || vx - GW / 2 > CH) continue;
      if (this._isTrackCol(c)) { this._railsV(g, vx, x0, y0); continue; }
      // the water channel snakes with its tunnel
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.strokeStyle = COL.floorDark; g.lineWidth = GW + 6;
      g.beginPath();
      for (var wy0 = -64; wy0 <= CH + 64; wy0 += 48) {
        var wxc = vx + this._bendV(c, y0 + wy0);
        if (wy0 === -64) g.moveTo(wxc, wy0); else g.lineTo(wxc, wy0);
      }
      g.stroke();
      g.strokeStyle = COL.water; g.lineWidth = GW;
      g.beginPath();
      for (var wy1 = -64; wy1 <= CH + 64; wy1 += 48) {
        var wxc1 = vx + this._bendV(c, y0 + wy1);
        if (wy1 === -64) g.moveTo(wxc1, wy1); else g.lineTo(wxc1, wy1);
      }
      g.stroke();
      g.fillStyle = COL.waterLite;
      for (var wy = 0; wy < CH; wy += 28) {
        var wn = smooth(x0 + vx, y0 + wy, 60, 17);
        g.fillRect(vx + this._bendV(c, y0 + wy) - GW / 2 + 4, wy + wn * 10, GW - 8, 3);
      }
      for (var by = ((-(y0 % 256)) + 256) % 256; by < CH; by += 256) {
        var bxc = vx + this._bendV(c, y0 + by);
        g.fillStyle = COL.brick; g.fillRect(bxc - GW / 2 - 4, by - 14, GW + 8, 28);
        g.strokeStyle = COL.brickLite; g.lineWidth = 1;
        g.strokeRect(bxc - GW / 2 - 4, by - 14, GW + 8, 28);
      }
    }
    for (var r = cy - 1; r <= cy + 1; r++) {
      if ((r % 2) !== 1 || r <= 0 || r >= this.blocks) continue;
      var vy = r * CH + CH / 2 - y0;
      if (vy + GW / 2 < 0 || vy - GW / 2 > CH) continue;
      if (this._isTrackRow(r)) { this._railsH(g, vy, x0, y0); continue; }
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.strokeStyle = COL.floorDark; g.lineWidth = GW + 6;
      g.beginPath();
      for (var hx0 = -64; hx0 <= CH + 64; hx0 += 48) {
        var hyc = vy + this._bendH(r, x0 + hx0);
        if (hx0 === -64) g.moveTo(hx0, hyc); else g.lineTo(hx0, hyc);
      }
      g.stroke();
      g.strokeStyle = COL.water; g.lineWidth = GW;
      g.beginPath();
      for (var hx1 = -64; hx1 <= CH + 64; hx1 += 48) {
        var hyc1 = vy + this._bendH(r, x0 + hx1);
        if (hx1 === -64) g.moveTo(hx1, hyc1); else g.lineTo(hx1, hyc1);
      }
      g.stroke();
      g.fillStyle = COL.waterLite;
      for (var wx = 0; wx < CH; wx += 28) {
        var wn2 = smooth(x0 + wx, y0 + vy, 60, 18);
        g.fillRect(wx + wn2 * 10, vy + this._bendH(r, x0 + wx) - GW / 2 + 4, 3, GW - 8);
      }
      for (var bx = ((-(x0 % 256)) + 256) % 256; bx < CH; bx += 256) {
        var byc = vy + this._bendH(r, x0 + bx);
        g.fillStyle = COL.brick; g.fillRect(bx - 14, byc - GW / 2 - 4, 28, GW + 8);
        g.strokeStyle = COL.brickLite; g.lineWidth = 1;
        g.strokeRect(bx - 14, byc - GW / 2 - 4, 28, GW + 8);
      }
    }
  };

  // ---- moss: small DESATURATED patches that hug wall lips only.
  // Judge round 2: one green blob was playing moss, sludge AND
  // mushrooms - now each has its own grammar. Moss = muted, small,
  // no outline, never on open floor. ----
  PC.SewerLayout.prototype._moss = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH;
    for (var i = 0; i < 20; i++) {
      var mx = h2(cx * 5 + i, cy, 71) * CH, my = h2(cx, cy * 5 + i, 72) * CH;
      var wx = x0 + mx, wy = y0 + my;
      if (!this.carvedAt(wx, wy)) continue;
      // strictly at the wall lip (probe 34px out)
      var nearWall = !this.carvedAt(wx + 34, wy) || !this.carvedAt(wx - 34, wy) ||
                     !this.carvedAt(wx, wy + 34) || !this.carvedAt(wx, wy - 34);
      if (!nearWall) continue;
      var big = h2(i, cx + cy, 73);
      g.fillStyle = COL.moss;
      g.beginPath(); g.ellipse(mx, my, 10 + big * 14, 6 + big * 7, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.mossGlow;
      g.beginPath(); g.ellipse(mx, my, 5 + big * 6, 3 + big * 3, 0, 0, Math.PI * 2); g.fill();
    }
  };

  // ---- rusty pipe runs clinging to corridor walls ----
  PC.SewerLayout.prototype._pipes = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH;
    // vertical corridors get a pipe on their west wall face
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (var c = cx - 1; c <= cx + 1; c++) {
      if ((c % 2) !== 1 || c <= 0 || c >= this.blocks) continue;
      if (h2(c, 0, 81) > 0.7) continue;
      var vxn = c * CH + CH / 2 - HW + 10 - x0;
      if (vxn < -130 || vxn > CH + 130) continue;
      var passesV = [[10, COL.pipeDark], [6, COL.pipe], [2, COL.pipeLite]];
      for (var pv = 0; pv < passesV.length; pv++) {
        g.lineWidth = passesV[pv][0]; g.strokeStyle = passesV[pv][1];
        g.beginPath();
        for (var py0 = -48; py0 <= CH + 48; py0 += 48) {
          var pxx2 = vxn + this._bendV(c, y0 + py0);
          if (py0 === -48) g.moveTo(pxx2, py0); else g.lineTo(pxx2, py0);
        }
        g.stroke();
      }
      for (var py2 = ((-(y0 % 160)) + 160) % 160; py2 < CH; py2 += 160) {
        var pbx = vxn + this._bendV(c, y0 + py2);
        g.fillStyle = COL.metal; g.fillRect(pbx - 7, py2, 14, 8);
        g.fillStyle = COL.metalLite; g.fillRect(pbx - 7, py2, 14, 2);
      }
    }
    // horizontal corridors get one on the north wall face
    for (var r = cy - 1; r <= cy + 1; r++) {
      if ((r % 2) !== 1 || r <= 0 || r >= this.blocks) continue;
      if (h2(0, r, 82) > 0.7) continue;
      var vyn = r * CH + CH / 2 - HW + 10 - y0;
      if (vyn < -130 || vyn > CH + 130) continue;
      var passesH = [[10, COL.pipeDark], [6, COL.pipe], [2, COL.pipeLite]];
      for (var ph = 0; ph < passesH.length; ph++) {
        g.lineWidth = passesH[ph][0]; g.strokeStyle = passesH[ph][1];
        g.beginPath();
        for (var px0 = -48; px0 <= CH + 48; px0 += 48) {
          var pyy2 = vyn + this._bendH(r, x0 + px0);
          if (px0 === -48) g.moveTo(px0, pyy2); else g.lineTo(px0, pyy2);
        }
        g.stroke();
      }
      for (var px2 = ((-(x0 % 160)) + 160) % 160; px2 < CH; px2 += 160) {
        var pby = vyn + this._bendH(r, x0 + px2);
        g.fillStyle = COL.metal; g.fillRect(px2, pby - 7, 8, 14);
        g.fillStyle = COL.metalLite; g.fillRect(px2, pby - 7, 8, 2);
      }
    }
  };

  // ---- the spoiled-sludge flood: DARK sickly olive with an outline
  // and bubbles (its own grammar - never confusable with moss or the
  // fungal glow), thicker toward the Deep Sump ----
  PC.SewerLayout.prototype._gooPass = function (g, cx, cy) {
    var x0 = cx * CH, y0 = cy * CH;
    var depth = Math.max(0, Math.min(1, (y0 / this.size) * 1.5 - 0.15));
    var n = Math.round(depth * 6);
    for (var i = 0; i < n; i++) {
      var gx = h2(cx * 7 + i, cy, 91) * CH, gy = h2(cx, cy * 7 + i, 92) * CH;
      if (!this.carvedAt(x0 + gx, y0 + gy)) continue;
      // biome identity (judge round 3): clean zones stay clean, the
      // fungal cavern belongs to the mushrooms
      var inMk = this.markAt(x0 + gx, y0 + gy);
      if (inMk && (inMk.id === 'grate' || inMk.id === 'cistern' || inMk.id === 'fungal')) continue;
      if (this._nearRing(x0 + gx, y0 + gy)) continue;   // the subway stays swept
      var s = 10 + h2(i, cx, 93) * (14 + depth * 26);
      g.strokeStyle = COL.gooOutline; g.lineWidth = 3;
      g.fillStyle = COL.goo;
      g.beginPath(); g.ellipse(gx, gy, s, s * 0.62, 0, 0, Math.PI * 2);
      g.fill(); g.stroke();
      // lumpy sub-blob so the puddle isn't a clean ellipse
      g.fillStyle = COL.goo;
      g.beginPath(); g.ellipse(gx + s * 0.8, gy + s * 0.25, s * 0.4, s * 0.26, 0, 0, Math.PI * 2);
      g.fill(); g.stroke();
      // bubbles
      g.strokeStyle = COL.gooBubble; g.lineWidth = 2;
      for (var bu2 = 0; bu2 < 2 + (s > 24 ? 1 : 0); bu2++) {
        var bax = gx + (h2(i, bu2, 95) - 0.5) * s * 1.2;
        var bay = gy + (h2(bu2, i, 96) - 0.5) * s * 0.5;
        g.beginPath(); g.arc(bax, bay, 2 + h2(i + bu2, cy, 97) * 4, 0, Math.PI * 2); g.stroke();
      }
    }
  };

  // =====================================================================
  // LANDMARK CAVERN DRESSING (painted inside the floor clip)
  // =====================================================================
  PC.SewerLayout.prototype._dressMark = function (g, mk, x0, y0, cx, cy) {
    var lx = mk.x - x0, ly = mk.y - y0;   // local
    var w = mk.w, h = mk.h;
    var mcx = lx + w / 2, mcy = ly + h / 2;
    var id = mk.id;

    if (id === 'grate') {
      // THE MAIN GRATE: iron hatch (judge: not purple), torn bars
      // CLIPPED to the ring, and a warm daylight beam pooling on the
      // floor - the map's one shaft of surface light
      var gr = Math.min(220, Math.min(w, h) * 0.24);
      g.fillStyle = COL.iron;
      g.beginPath(); g.arc(mcx, mcy, gr * 1.13, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.floorDark;
      g.beginPath(); g.arc(mcx, mcy, gr, 0, Math.PI * 2); g.fill();
      g.strokeStyle = COL.ironLite; g.lineWidth = 5;
      g.beginPath(); g.arc(mcx, mcy, gr * 1.07, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = COL.rust; g.lineWidth = 2;
      g.beginPath(); g.arc(mcx, mcy, gr * 0.99, 0.4, 2.2); g.stroke();
      // bars clipped to the hatch circle; two are bent by the drill
      g.save();
      g.beginPath(); g.arc(mcx, mcy, gr, 0, Math.PI * 2); g.clip();
      g.lineWidth = 6;
      for (var b = -3; b <= 3; b++) {
        g.strokeStyle = (b === 0 || b === 1) ? COL.rust : COL.ironLite;
        var bx = mcx + b * gr * 0.27;
        g.beginPath();
        if (b === 0) { g.moveTo(bx, mcy - gr); g.quadraticCurveTo(bx + 30, mcy, bx + 18, mcy + gr); }
        else if (b === 1) { g.moveTo(bx, mcy - gr); g.quadraticCurveTo(bx - 24, mcy + 10, bx - 6, mcy + gr); }
        else { g.moveTo(bx, mcy - gr); g.lineTo(bx, mcy + gr); }
        g.stroke();
      }
      g.restore();
      // the light shaft: warm beam widening to a bright floor pool
      g.fillStyle = COL.beam;
      g.beginPath();
      g.moveTo(mcx - 54, ly); g.lineTo(mcx + 54, ly);
      g.lineTo(mcx + 128, mcy + 30); g.lineTo(mcx - 128, mcy + 30);
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,243,196,0.30)';
      g.beginPath(); g.ellipse(mcx, mcy + 6, 130, 58, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,250,230,0.18)';
      g.beginPath(); g.ellipse(mcx, mcy + 2, 74, 32, 0, 0, Math.PI * 2); g.fill();
      // service ladder up the north wall
      g.fillStyle = COL.pipeLite;
      g.fillRect(mcx - 20, ly + 6, 6, 60); g.fillRect(mcx + 14, ly + 6, 6, 60);
      for (var lr = 0; lr < 5; lr++) g.fillRect(mcx - 20, ly + 12 + lr * 11, 40, 4);

    } else if (id === 'junction') {
      // JUNCTION CHAMBER ALPHA (the named objective - most
      // architectural room on the map): bold double ring, four pipe
      // mouths with DARK tunnel holes, big valve-wheel medallion
      var R = Math.min(w, h) * 0.36;
      g.strokeStyle = COL.stoneBrick; g.lineWidth = 22;
      g.beginPath(); g.arc(mcx, mcy, R, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = COL.wallLip; g.lineWidth = 5;
      g.beginPath(); g.arc(mcx, mcy, R + 13, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(mcx, mcy, R - 13, 0, Math.PI * 2); g.stroke();
      // compass spokes
      g.strokeStyle = COL.floorDark; g.lineWidth = 8;
      for (var sp = 0; sp < 8; sp++) {
        var a = sp * Math.PI / 4;
        g.beginPath();
        g.moveTo(mcx + Math.cos(a) * R * 0.45, mcy + Math.sin(a) * R * 0.45);
        g.lineTo(mcx + Math.cos(a) * (R - 16), mcy + Math.sin(a) * (R - 16));
        g.stroke();
      }
      // the medallion: concentric stone rings + a giant iron valve wheel
      g.fillStyle = COL.stoneBrick;
      g.beginPath(); g.arc(mcx, mcy, R * 0.42, 0, Math.PI * 2); g.fill();
      g.strokeStyle = COL.stoneBrickLite; g.lineWidth = 4;
      g.beginPath(); g.arc(mcx, mcy, R * 0.42, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(mcx, mcy, R * 0.30, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = COL.ironLite; g.lineWidth = 7;
      g.beginPath(); g.arc(mcx, mcy, R * 0.2, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 5;
      for (var vk = 0; vk < 4; vk++) {
        var vka = vk * Math.PI / 2 + 0.4;
        g.beginPath();
        g.moveTo(mcx + Math.cos(vka) * R * 0.06, mcy + Math.sin(vka) * R * 0.06);
        g.lineTo(mcx + Math.cos(vka) * R * 0.2, mcy + Math.sin(vka) * R * 0.2);
        g.stroke();
      }
      g.fillStyle = COL.iron;
      g.beginPath(); g.arc(mcx, mcy, R * 0.06, 0, Math.PI * 2); g.fill();
      // four outfall mouths: iron arch + BLACK hole + water spilling
      for (var om = 0; om < 4; om++) {
        var oa = om * Math.PI / 2 + Math.PI / 4;
        var ox = mcx + Math.cos(oa) * (R + 30), oy = mcy + Math.sin(oa) * (R + 30);
        g.fillStyle = '#08100f';
        g.beginPath(); g.arc(ox, oy, 32, 0, Math.PI * 2); g.fill();
        g.strokeStyle = COL.ironLite; g.lineWidth = 6;
        g.beginPath(); g.arc(ox, oy, 32, Math.PI * 0.9, Math.PI * 2.1); g.stroke();
        g.fillStyle = COL.water;
        g.fillRect(ox - 16, oy + 6, 32, 22);
        g.fillStyle = COL.waterLite;
        g.fillRect(ox - 12, oy + 10, 24, 3);
      }

    } else if (id === 'pumps') {
      // THE PUMP WORKS (v0.42.0 definition pass): an industrial hall -
      // plate floor zone, two riveted pressure tanks, a floor pipe run
      // linking all three pumps, drain channels to the gutter
      // industrial plate floor under the machine row
      g.fillStyle = 'rgba(80,76,90,0.18)';
      g.fillRect(lx + w * 0.05, ly + h * 0.06, w * 0.9, h * 0.72);
      g.strokeStyle = 'rgba(120,116,134,0.5)'; g.lineWidth = 1;
      for (var pfy = ly + h * 0.06; pfy < ly + h * 0.78; pfy += 40) {
        g.beginPath(); g.moveTo(lx + w * 0.05, pfy); g.lineTo(lx + w * 0.95, pfy); g.stroke();
      }
      // two big pressure tanks flanking the hall
      for (var tk = 0; tk < 2; tk++) {
        var tkx = lx + w * (tk ? 0.9 : 0.1), tky = ly + h * 0.52;
        g.fillStyle = COL.shadow;
        g.beginPath(); g.ellipse(tkx + 6, tky + 10, 34, 16, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#5d5a78';
        g.beginPath(); g.arc(tkx, tky, 32, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#7f7c9c';
        g.beginPath(); g.arc(tkx - 9, tky - 9, 13, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#4a4762'; g.lineWidth = 2;
        g.beginPath(); g.arc(tkx, tky, 32, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.arc(tkx, tky, 22, 0, Math.PI * 2); g.stroke();
        // tank feed pipe into the hall
        g.fillStyle = COL.pipeDark;
        g.fillRect(Math.min(tkx, lx + w * 0.5), tky - 4, Math.abs(w * 0.4 - 32), 8);
      }
      g.fillStyle = COL.iron;
      g.fillRect(lx + w * 0.08, ly + h * 0.1, w * 0.84, h * 0.16);
      g.fillStyle = COL.ironLite;
      g.fillRect(lx + w * 0.08, ly + h * 0.1, w * 0.84, 6);
      // panel seams + rivets so the manifold reads as machinery
      g.strokeStyle = COL.rust; g.lineWidth = 2;
      for (var mfs = 0.16; mfs < 0.92; mfs += 0.12) {
        g.beginPath();
        g.moveTo(lx + w * mfs, ly + h * 0.1);
        g.lineTo(lx + w * mfs, ly + h * 0.26);
        g.stroke();
      }
      g.fillStyle = COL.ironLite;
      for (var mfr = 0.12; mfr < 0.92; mfr += 0.06) {
        g.fillRect(lx + w * mfr, ly + h * 0.12, 3, 3);
        g.fillRect(lx + w * mfr, ly + h * 0.22, 3, 3);
      }
      for (var pm = 0; pm < 3; pm++) {
        var pxx = lx + w * (0.22 + pm * 0.28), pyy = ly + h * 0.42;
        // rounded-top machine body
        g.fillStyle = COL.iron;
        g.beginPath();
        g.moveTo(pxx - 40, pyy + 42); g.lineTo(pxx - 40, pyy - 18);
        g.arc(pxx, pyy - 18, 40, Math.PI, 0);
        g.lineTo(pxx + 40, pyy + 42); g.closePath(); g.fill();
        g.fillStyle = COL.ironLite;
        g.fillRect(pxx - 40, pyy + 34, 80, 8);
        // rivets
        g.fillStyle = COL.ironLite;
        for (var rv = 0; rv < 4; rv++) {
          g.fillRect(pxx - 34 + rv * 20, pyy - 6, 4, 4);
          g.fillRect(pxx - 34 + rv * 20, pyy + 22, 4, 4);
        }
        // gauge face with a red needle
        g.fillStyle = '#e8e2d4';
        g.beginPath(); g.arc(pxx, pyy - 22, 15, 0, Math.PI * 2); g.fill();
        g.strokeStyle = COL.iron; g.lineWidth = 3;
        g.beginPath(); g.arc(pxx, pyy - 22, 15, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = COL.handle; g.lineWidth = 3;
        var na = -0.6 + pm * 0.9;
        g.beginPath(); g.moveTo(pxx, pyy - 22);
        g.lineTo(pxx + Math.cos(na) * 11, pyy - 22 + Math.sin(na) * 11); g.stroke();
        // solid machine block under the dome, then the floor pipe
        g.fillStyle = COL.iron; g.fillRect(pxx - 26, pyy + 42, 52, 30);
        g.fillStyle = COL.ironLite; g.fillRect(pxx - 26, pyy + 42, 52, 5);
        g.fillStyle = COL.ironLite;
        g.fillRect(pxx - 20, pyy + 58, 4, 4); g.fillRect(pxx + 16, pyy + 58, 4, 4);
        g.fillStyle = COL.pipeDark; g.fillRect(pxx - 9, pyy + 72, 18, h * 0.09);
        g.fillStyle = COL.pipeLite; g.fillRect(pxx - 9, pyy + 72, 5, h * 0.09);
        g.fillStyle = COL.metal; g.fillRect(pxx - 16, pyy + 70, 32, 8);
        // feed pipe up to the manifold
        g.fillStyle = COL.pipeDark; g.fillRect(pxx - 7, ly + h * 0.26, 14, h * 0.1);
        // valve pedestal south of each pump: gray column + RED handwheel
        var vy2 = ly + h * 0.64;
        g.fillStyle = COL.shadow;
        g.beginPath(); g.ellipse(pxx + 5, vy2 + 16, 26, 9, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = COL.metal; g.fillRect(pxx - 12, vy2 - 10, 24, 26);
        g.fillStyle = COL.metalLite; g.fillRect(pxx - 12, vy2 - 10, 24, 5);
        g.strokeStyle = COL.handle; g.lineWidth = 5;
        g.beginPath(); g.arc(pxx, vy2 - 14, 13, 0, Math.PI * 2); g.stroke();
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(pxx - 13, vy2 - 14); g.lineTo(pxx + 13, vy2 - 14); g.stroke();
        g.beginPath(); g.moveTo(pxx, vy2 - 27); g.lineTo(pxx, vy2 - 1); g.stroke();
      }

    } else if (id === 'fungal') {
      // FUNGAL CAVERN (v0.42.0): the whole cavern breathes green - a
      // moss wash over the floor sets it apart before a single
      // mushroom is seen, and the hero caps got BIG
      g.fillStyle = 'rgba(96,168,72,0.16)';
      g.fillRect(lx, ly, w, h);
      g.fillStyle = 'rgba(96,168,72,0.12)';
      for (var fw = 0; fw < 8; fw++) {
        var fwx = lx + h2(fw, 31, 161) * w, fwy = ly + h2(31, fw, 162) * h;
        g.beginPath(); g.ellipse(fwx, fwy, 90 + h2(fw, fw, 163) * 80, 60, 0, 0, Math.PI * 2); g.fill();
      }
      // clusters of 2-3 around anchor points, one hero mushroom per
      // cluster (judge round 3: mushrooms must OUTNUMBER sludge here)
      for (var f = 0; f < 44; f++) {
        var anchor = Math.floor(f / 3) + (f % 3);
        var ax3 = lx + (0.12 + h2(anchor, 1, 106) * 0.76) * w;
        var ay3 = ly + (0.12 + h2(1, anchor, 107) * 0.76) * h;
        var fx3 = ax3 + (h2(f, 4, 108) - 0.5) * 110;
        var fy3 = ay3 + (h2(4, f, 109) - 0.5) * 90;
        var fs = (f % 3 === 0) ? 42 + h2(f, f, 103) * 34 : 14 + h2(f, f, 103) * 18;
        // glow pool first (under everything)
        g.fillStyle = COL.mushGlow;
        g.beginPath(); g.arc(fx3, fy3 - fs * 0.2, fs * 1.9, 0, Math.PI * 2); g.fill();
        // stem
        g.fillStyle = COL.mushStem;
        g.strokeStyle = COL.mushOutline; g.lineWidth = 2;
        g.beginPath();
        g.rect(fx3 - fs * 0.16, fy3 - fs * 0.15, fs * 0.32, fs * 0.62);
        g.fill(); g.stroke();
        // cap
        g.fillStyle = COL.mush;
        g.beginPath(); g.ellipse(fx3, fy3 - fs * 0.2, fs, fs * 0.6, 0, Math.PI, 0);
        g.fill(); g.stroke();
        g.beginPath(); g.moveTo(fx3 - fs, fy3 - fs * 0.2); g.lineTo(fx3 + fs, fy3 - fs * 0.2); g.stroke();
        // pale spots
        g.fillStyle = COL.mushSpot;
        g.beginPath(); g.arc(fx3 - fs * 0.4, fy3 - fs * 0.5, fs * 0.14, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(fx3 + fs * 0.3, fy3 - fs * 0.42, fs * 0.1, 0, Math.PI * 2); g.fill();
      }
      // drifting spores
      g.fillStyle = 'rgba(217,242,168,0.6)';
      for (var sp2 = 0; sp2 < 16; sp2++) {
        g.fillRect(lx + h2(sp2, 3, 104) * w, ly + h2(3, sp2, 105) * h, 2, 2);
      }

    } else if (id === 'catwalk') {
      // CATWALK MAZE: dark water + a true plank LATTICE - slats on
      // every lane, rails on every edge, ripple dashes in the water
      g.fillStyle = COL.water; g.fillRect(lx, ly, w, h);
      g.strokeStyle = '#2a4a6a'; g.lineWidth = 2;
      for (var wv = 0; wv < 110; wv++) {
        var wvx = lx + h2(wv, 5, 111) * w, wvy = ly + h2(5, wv, 112) * h;
        g.beginPath(); g.moveTo(wvx, wvy); g.lineTo(wvx + 24 + h2(wv, 6, 113) * 30, wvy); g.stroke();
      }
      var laneW = 56;
      var hLanes = [0.2, 0.5, 0.8], vLanes = [0.16, 0.49, 0.82];
      // decks
      g.fillStyle = COL.pipeLite;
      hLanes.forEach(function (t) { g.fillRect(lx, ly + h * t - laneW / 2, w, laneW); });
      vLanes.forEach(function (t) { g.fillRect(lx + w * t - laneW / 2, ly, laneW, h); });
      // slats: across EVERY lane, both directions
      g.strokeStyle = COL.pipeDark; g.lineWidth = 2;
      hLanes.forEach(function (t) {
        var yy = ly + h * t - laneW / 2;
        for (var pk = 0; pk < w; pk += 22) {
          g.beginPath(); g.moveTo(lx + pk, yy); g.lineTo(lx + pk, yy + laneW); g.stroke();
        }
      });
      vLanes.forEach(function (t) {
        var xx = lx + w * t - laneW / 2;
        for (var pk2 = 0; pk2 < h; pk2 += 22) {
          g.beginPath(); g.moveTo(xx, ly + pk2); g.lineTo(xx + laneW, ly + pk2); g.stroke();
        }
      });
      // rails on every deck edge
      g.strokeStyle = COL.metalLite; g.lineWidth = 3;
      hLanes.forEach(function (t) {
        var yy2 = ly + h * t;
        g.beginPath(); g.moveTo(lx, yy2 - laneW / 2); g.lineTo(lx + w, yy2 - laneW / 2); g.stroke();
        g.beginPath(); g.moveTo(lx, yy2 + laneW / 2); g.lineTo(lx + w, yy2 + laneW / 2); g.stroke();
      });
      vLanes.forEach(function (t) {
        var xx2 = lx + w * t;
        g.beginPath(); g.moveTo(xx2 - laneW / 2, ly); g.lineTo(xx2 - laneW / 2, ly + h); g.stroke();
        g.beginPath(); g.moveTo(xx2 + laneW / 2, ly); g.lineTo(xx2 + laneW / 2, ly + h); g.stroke();
      });

    } else if (id === 'reservoir') {
      // COLLAPSED RESERVOIR (v0.42.0, Mark: "needs more defining...
      // so it makes sense"): a giant drained water tank. Tiered basin
      // rings with waterline stains, one collapsed corner buried in
      // rubble with fallen roof beams, the last puddle at the bottom.
      // rubble scattered on ordinary flagstone (no third value)
      for (var ub = 0; ub < 8; ub++) {
        var ubx = lx + h2(ub, 21, 151) * w, ubs = 6 + h2(21, ub, 152) * 10;
        g.fillStyle = COL.floorDark;
        g.beginPath(); g.arc(ubx + 3, ly + h * 0.06 + 3, ubs, 0, Math.PI * 2); g.fill();
        g.fillStyle = COL.stoneBrickLite;
        g.beginPath(); g.arc(ubx, ly + h * 0.06, ubs, 0, Math.PI * 2); g.fill();
      }
      // the tank wall: thick concrete ring
      g.strokeStyle = COL.stoneBrickLite; g.lineWidth = 12;
      g.strokeRect(lx + w * 0.1, ly + h * 0.14, w * 0.8, h * 0.78);
      g.strokeStyle = COL.wallVoid; g.lineWidth = 3;
      g.strokeRect(lx + w * 0.1 + 8, ly + h * 0.14 + 8, w * 0.8 - 16, h * 0.78 - 16);
      // tiered drained basin: three stepped waterline stains going down
      var tiers = [[0.14, '#455349'], [0.24, '#3d4a42'], [0.34, '#35413b']];
      for (var tr2 = 0; tr2 < tiers.length; tr2++) {
        var inset = tiers[tr2][0];
        g.fillStyle = tiers[tr2][1];
        g.fillRect(lx + w * inset, ly + h * (inset + 0.04), w * (1 - 2 * inset), h * (0.9 - 2 * inset));
        g.strokeStyle = '#5a6a5e'; g.lineWidth = 2;
        g.strokeRect(lx + w * inset, ly + h * (inset + 0.04), w * (1 - 2 * inset), h * (0.9 - 2 * inset));
      }
      // basin seams so every tier still reads as walkable floor
      g.strokeStyle = COL.seam; g.lineWidth = 1;
      for (var bsy = ly + h * 0.2; bsy < ly + h * 0.9; bsy += 48) {
        g.beginPath(); g.moveTo(lx + w * 0.14, bsy); g.lineTo(lx + w * 0.86, bsy); g.stroke();
      }
      // the last puddle at the deepest tier
      var pox = mcx + w * 0.08, poy = mcy + h * 0.16;
      g.fillStyle = COL.water;
      g.beginPath(); g.ellipse(pox, poy, w * 0.13, h * 0.07, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#5a6a5e'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(pox, poy, w * 0.15, h * 0.085, 0, 0, Math.PI * 2); g.stroke();
      // cracks radiating from the puddle rim
      g.strokeStyle = COL.wallVoid; g.lineWidth = 4;
      for (var cr = 0; cr < 5; cr++) {
        var ca = cr * (Math.PI * 2 / 5) + 0.5;
        var cpx = pox + Math.cos(ca) * w * 0.13, cpy = poy + Math.sin(ca) * h * 0.07;
        g.beginPath(); g.moveTo(cpx, cpy);
        for (var cs = 0; cs < 2; cs++) {
          cpx += Math.cos(ca) * (26 + h2(cr, cs, 121) * 30) + (h2(cs, cr, 122) - 0.5) * 22;
          cpy += Math.sin(ca) * (26 + h2(cs, cr, 123) * 30);
          g.lineTo(cpx, cpy);
        }
        g.stroke();
      }
      // THE COLLAPSE: the NE corner caved in - rubble cone + two
      // fallen roof beams + a bite taken out of the tank wall
      var ccx = lx + w * 0.82, ccy = ly + h * 0.22;
      g.fillStyle = COL.rockMottle;
      g.beginPath();
      g.moveTo(ccx - 90, ccy - 40); g.lineTo(ccx + 60, ccy - 70);
      g.lineTo(ccx + 80, ccy + 60); g.lineTo(ccx - 30, ccy + 80);
      g.closePath(); g.fill();
      for (var rb = 0; rb < 9; rb++) {
        var rbx = ccx + (h2(rb, 9, 124) - 0.5) * 150;
        var rby = ccy + (h2(9, rb, 125) - 0.5) * 130;
        var rbs = 8 + h2(rb, rb, 126) * 16;
        g.fillStyle = COL.floorDark;
        g.beginPath(); g.arc(rbx + 3, rby + 3, rbs, 0, Math.PI * 2); g.fill();
        g.fillStyle = COL.stoneBrickLite;
        g.beginPath(); g.arc(rbx, rby, rbs, 0, Math.PI * 2); g.fill();
        g.fillStyle = COL.floorLite;
        g.beginPath(); g.arc(rbx - rbs * 0.25, rby - rbs * 0.25, rbs * 0.4, 0, Math.PI * 2); g.fill();
      }
      // fallen I-beams
      g.save();
      g.translate(ccx - 20, ccy + 10); g.rotate(0.5);
      g.fillStyle = '#4e4b62'; g.fillRect(-90, -7, 180, 14);
      g.fillStyle = '#6d6a8e'; g.fillRect(-90, -7, 180, 4);
      g.restore();
      g.save();
      g.translate(ccx + 30, ccy - 30); g.rotate(-0.35);
      g.fillStyle = '#4e4b62'; g.fillRect(-70, -6, 140, 12);
      g.fillStyle = '#6d6a8e'; g.fillRect(-70, -6, 140, 3);
      g.restore();
      // dust/stain fan spilling from the breach
      g.fillStyle = 'rgba(90,106,94,0.25)';
      g.beginPath(); g.ellipse(ccx - 40, ccy + 60, 110, 46, 0.3, 0, Math.PI * 2); g.fill();

    } else if (id === 'sump') {
      // THE DEEP SUMP: a DIRTY lagoon (dark, rimmed, junk floating in
      // it) and a real junk-heap throne - not a lawn (judge round 2)
      g.fillStyle = COL.lagoonRim;
      g.beginPath(); g.ellipse(mcx, mcy, w * 0.29, h * 0.26, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.lagoon;
      g.beginPath(); g.ellipse(mcx, mcy, w * 0.26, h * 0.23, 0, 0, Math.PI * 2); g.fill();
      // oily sheen band
      g.fillStyle = 'rgba(200,217,106,0.10)';
      g.beginPath(); g.ellipse(mcx - w * 0.06, mcy - h * 0.05, w * 0.24, h * 0.08, -0.3, 0, Math.PI * 2); g.fill();
      // slow swirls
      g.strokeStyle = COL.gooLite; g.lineWidth = 3;
      for (var sw = 0; sw < 3; sw++) {
        g.beginPath();
        g.arc(mcx, mcy, 36 + sw * 44, sw * 1.2, sw * 1.2 + Math.PI * (1.1 - sw * 0.2));
        g.stroke();
      }
      // floating junk silhouettes: tire, boot, fishbone
      g.fillStyle = COL.junkDark;
      g.beginPath(); g.arc(mcx - w * 0.12, mcy + h * 0.06, 18, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.lagoon;
      g.beginPath(); g.arc(mcx - w * 0.12, mcy + h * 0.06, 8, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.junkDark;
      g.fillRect(mcx + w * 0.1, mcy + h * 0.09, 26, 12);
      g.fillRect(mcx + w * 0.1 + 18, mcy + h * 0.09 - 10, 10, 14);
      g.strokeStyle = COL.junkDark; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(mcx + w * 0.05, mcy - h * 0.14); g.lineTo(mcx + w * 0.13, mcy - h * 0.14);
      g.stroke();
      g.lineWidth = 2;
      for (var fb = 0; fb < 4; fb++) {
        var fbx = mcx + w * 0.06 + fb * 8;
        g.beginPath(); g.moveTo(fbx, mcy - h * 0.14 - 6); g.lineTo(fbx, mcy - h * 0.14 + 6); g.stroke();
      }
      // bubbles
      g.strokeStyle = COL.gooBubble; g.lineWidth = 2;
      for (var bu = 0; bu < 10; bu++) {
        var bux = mcx + (h2(bu, 11, 131) - 0.5) * w * 0.4;
        var buy = mcy + (h2(11, bu, 132) - 0.5) * h * 0.34;
        g.beginPath(); g.arc(bux, buy, 3 + h2(bu, bu, 133) * 7, 0, Math.PI * 2); g.stroke();
      }
      // stone ring walkway
      g.strokeStyle = COL.stoneBrickLite; g.lineWidth = 10;
      g.beginPath(); g.ellipse(mcx, mcy, w * 0.31, h * 0.28, 0, 0, Math.PI * 2); g.stroke();
      // extra shore junk so the arena floor is dressed too
      g.fillStyle = COL.junkDark;
      g.fillRect(lx + w * 0.12, mcy + h * 0.3, 24, 10);
      g.fillRect(lx + w * 0.8, mcy - h * 0.2, 12, 22);
      g.beginPath(); g.arc(lx + w * 0.18, mcy - h * 0.26, 12, 0, Math.PI * 2); g.fill();
      // THE JUNK THRONE (north): the boss-arena centerpiece at proper
      // scale (judge round 3) - wide stepped junk base, tall tapering
      // seat back, continuous gold trim + finial, warm spotlight pool
      var thx = mcx, thy = ly + h * 0.16;
      g.fillStyle = 'rgba(255,243,196,0.12)';
      g.beginPath(); g.ellipse(thx, thy + 70, 190, 52, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.shadow;
      g.beginPath(); g.ellipse(thx, thy + 92, 180, 26, 0, 0, Math.PI * 2); g.fill();
      // stepped junk base: three tiers of trash silhouette
      g.fillStyle = COL.junkDark;
      g.beginPath();
      g.moveTo(thx - 180, thy + 88); g.lineTo(thx - 150, thy + 46); g.lineTo(thx - 96, thy + 58);
      g.lineTo(thx - 70, thy + 12); g.lineTo(thx - 26, thy + 30);
      g.lineTo(thx, thy - 22); g.lineTo(thx + 30, thy + 26); g.lineTo(thx + 74, thy + 8);
      g.lineTo(thx + 102, thy + 54); g.lineTo(thx + 152, thy + 44); g.lineTo(thx + 180, thy + 88);
      g.closePath(); g.fill();
      // junk detail: tires, crates, pipes at readable size
      g.fillStyle = '#20240b';
      g.beginPath(); g.arc(thx - 118, thy + 62, 26, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.junkDark;
      g.beginPath(); g.arc(thx - 118, thy + 62, 12, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5c4436'; g.fillRect(thx - 80, thy + 40, 46, 36);
      g.strokeStyle = '#8d6c58'; g.lineWidth = 3; g.strokeRect(thx - 80, thy + 40, 46, 36);
      g.beginPath(); g.moveTo(thx - 80, thy + 40); g.lineTo(thx - 34, thy + 76); g.stroke();
      g.fillStyle = '#5c4436'; g.fillRect(thx + 52, thy + 36, 40, 42);
      g.strokeRect(thx + 52, thy + 36, 40, 42);
      g.fillStyle = COL.pipeLite; g.fillRect(thx - 148, thy + 12, 10, 44);
      g.fillStyle = COL.pipeDark; g.fillRect(thx + 118, thy + 20, 9, 40);
      g.fillStyle = COL.pipeLite; g.fillRect(thx + 96, thy - 4, 8, 30);
      // the tall seat back: tapering slab with continuous gold trim
      g.fillStyle = '#2a2e0d';
      g.beginPath();
      g.moveTo(thx - 44, thy + 34); g.lineTo(thx - 30, thy - 58);
      g.lineTo(thx + 30, thy - 58); g.lineTo(thx + 44, thy + 34);
      g.closePath(); g.fill();
      g.strokeStyle = '#f2c33c'; g.lineWidth = 4;
      g.beginPath();
      g.moveTo(thx - 44, thy + 34); g.lineTo(thx - 30, thy - 58);
      g.lineTo(thx + 30, thy - 58); g.lineTo(thx + 44, thy + 34);
      g.stroke();
      // gold finial on top
      g.fillStyle = '#f2c33c';
      g.beginPath(); g.arc(thx, thy - 66, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffe28a'; g.fillRect(thx - 2, thy - 78, 4, 12);
      // the cushion seat: purple with a full gold band
      g.fillStyle = '#8f4fc4';
      g.fillRect(thx - 34, thy + 6, 68, 26);
      g.strokeStyle = '#f2c33c'; g.lineWidth = 4;
      g.strokeRect(thx - 34, thy + 6, 68, 26);
      // goo drip skirt under the whole heap
      g.fillStyle = COL.gooLite;
      g.beginPath(); g.ellipse(thx, thy + 86, 120, 14, 0, 0, Math.PI * 2); g.fill();

    } else if (id === 'cistern') {
      // OLD CISTERN: true brown-brick vault, columns with brick-ring
      // tops + offset shadows, and a real coin pile with twinkles
      g.fillStyle = COL.brickDark; g.fillRect(lx, ly, w, h);
      g.fillStyle = COL.brick;
      for (var br = 0; br < h; br += 24) {
        for (var bc = ((br / 24) % 2) * 28; bc < w; bc += 56) {
          g.fillRect(lx + bc + 1, ly + br + 1, 54, 22);
        }
      }
      g.strokeStyle = COL.brickDark; g.lineWidth = 2;
      for (var br2 = 0; br2 < h; br2 += 24) {
        g.beginPath(); g.moveTo(lx, ly + br2); g.lineTo(lx + w, ly + br2); g.stroke();
      }
      // shallow mirror water
      g.fillStyle = 'rgba(20,56,63,0.5)';
      g.fillRect(lx + w * 0.08, ly + h * 0.08, w * 0.84, h * 0.84);
      // columns (3x2): brick-course ring tops + offset drop shadow
      for (var cc = 0; cc < 3; cc++) {
        for (var rr2 = 0; rr2 < 2; rr2++) {
          var colx = lx + w * (0.25 + cc * 0.25), coly = ly + h * (0.33 + rr2 * 0.34);
          g.fillStyle = COL.shadow;
          g.beginPath(); g.ellipse(colx + 10, coly + 12, 26, 13, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = COL.brick;
          g.beginPath(); g.arc(colx, coly, 22, 0, Math.PI * 2); g.fill();
          g.strokeStyle = COL.brickDark; g.lineWidth = 2;
          g.beginPath(); g.arc(colx, coly, 22, 0, Math.PI * 2); g.stroke();
          g.beginPath(); g.arc(colx, coly, 15, 0, Math.PI * 2); g.stroke();
          g.fillStyle = '#3a2c22';
          g.beginPath(); g.arc(colx, coly, 8, 0, Math.PI * 2); g.fill();
          g.fillStyle = COL.brickLite;
          g.beginPath(); g.arc(colx - 6, coly - 6, 6, 0, Math.PI * 2); g.fill();
        }
      }
      // edge vignette so the vault's brightness pools at the treasure
      g.fillStyle = 'rgba(10,14,12,0.35)';
      g.fillRect(lx, ly, w, 34); g.fillRect(lx, ly + h - 34, w, 34);
      g.fillRect(lx, ly, 34, h); g.fillRect(lx + w - 34, ly, 34, h);
      g.fillStyle = 'rgba(255,226,138,0.08)';
      g.beginPath(); g.arc(mcx, mcy, 120, 0, Math.PI * 2); g.fill();
      // the coin pile: mound + individual coins + star twinkles
      g.fillStyle = '#b5793f';
      g.beginPath(); g.ellipse(mcx, mcy + 4, 26, 11, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f2c33c';
      g.beginPath(); g.ellipse(mcx, mcy, 22, 9, 0, 0, Math.PI * 2); g.fill();
      for (var cn = 0; cn < 6; cn++) {
        var cnx = mcx + (h2(cn, 2, 141) - 0.5) * 40;
        var cny = mcy + (h2(2, cn, 142) - 0.5) * 14;
        g.fillStyle = '#ff9d3b';
        g.beginPath(); g.ellipse(cnx, cny, 5, 3, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#f2c33c'; g.lineWidth = 1;
        g.beginPath(); g.ellipse(cnx, cny, 5, 3, 0, 0, Math.PI * 2); g.stroke();
      }
      // 4-point star twinkles
      g.fillStyle = '#ffe28a';
      [[mcx - 14, mcy - 10], [mcx + 18, mcy - 4], [mcx + 2, mcy + 12]].forEach(function (tw) {
        g.fillRect(tw[0] - 1, tw[1] - 5, 2, 10);
        g.fillRect(tw[0] - 5, tw[1] - 1, 10, 2);
      });
    }
  };
})();
