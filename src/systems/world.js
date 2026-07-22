// world.js - District 1 street painter (the Adventure City approach: the
// world is PAINTED in code, structured and continuous - not scattered
// tiles). Every detail is keyed to WORLD coordinates so chunk borders are
// invisible: one endless city with a real street grid.
//
// Layout per 512px block (repeats world-wide):
//   vertical road band   x 192..319   (24 sidewalk / 80 asphalt / 24 sidewalk)
//   horizontal road band y 192..319   (same)
//   intersection where they cross, plaza concrete in the 4 corners.
// All colors are palette-family ramps (ARTDNA: ramps allowed, ground darker
// + quieter than actors - the VS readability law).
window.PC = window.PC || {};
(function () {
  var C = 512;
  var R0 = 192, R1 = 320;          // road band (incl. sidewalks)
  var A0 = 216, A1 = 296;          // asphalt band
  function H(x, y, s) { return PC.hash01(x, y, s); }   // lazy: ground.js defines it

  var COL = {
    plaza:    '#2e2a45', plazaSeam: '#272339', plazaStain: '#282440',
    walk:     '#413d5c', walkSeam:  '#363152', curb: '#5a5678',
    asphalt:  '#232031', aSpeck1:   '#282438', aSpeck2: '#1e1b2b',
    wear:     'rgba(20,17,30,0.35)', dash: '#c9a032',
    crack:    '#1a1726', manhole:   '#2b2739', manholeRim: '#413d5c',
    zebra:    'rgba(207,212,232,0.28)',
    glow:     'rgba(242,195,60,0.10)',
  };

  // world-keyed speckle: same result no matter which chunk paints it
  function speck(g, wx0, wy0, x0, y0, w, h, salt, density, color, size) {
    g.fillStyle = color;
    for (var y = 0; y < h; y += 4) {
      for (var x = 0; x < w; x += 4) {
        var r = H((wx0 + x0 + x) >> 2, (wy0 + y0 + y) >> 2, salt);
        if (r < density) {
          g.fillRect(x0 + x + ((r * 97) | 0) % 3, y0 + y + ((r * 53) | 0) % 3, size, size);
        }
      }
    }
  }

  function inRoadBand(v) { var m = ((v % C) + C) % C; return m >= R0 && m < R1; }

  // ---- deterministic building footprints per chunk (world coords) ----
  // Shared by the painter AND collision. Buildings live in the 4 plaza
  // quadrants, clear of the road bands. Mark round 6: buildings are real
  // OBSTACLES (overrides COMPENDIUM 2.6 "no obstacles").
  var QUADS = [[14, 14, 178, 178], [334, 14, 498, 178], [14, 334, 178, 498], [334, 334, 498, 498]];
  var solidsCache = {};
  var solidsCacheN = 0;
  PC.chunkSolids = function (cx, cy) {
    var k = cx + ',' + cy;
    if (solidsCache[k]) return solidsCache[k];
    if (solidsCacheN > 300) { solidsCache = {}; solidsCacheN = 0; }
    var out = [];
    for (var q = 0; q < 4; q++) {
      var r = H(cx, cy, 500 + q);
      if (r < 0.30) continue;                       // empty plaza quadrant
      var Q = QUADS[q];
      var maxW = Q[2] - Q[0], maxH = Q[3] - Q[1];
      var w = Math.round(maxW * (0.62 + H(cx, cy, 510 + q) * 0.34));
      var h = Math.round(maxH * (0.62 + H(cx, cy, 520 + q) * 0.34));
      var x = Q[0] + Math.round((maxW - w) * H(cx, cy, 530 + q));
      var y = Q[1] + Math.round((maxH - h) * H(cx, cy, 540 + q));
      out.push({ x: cx * C + x, y: cy * C + y, w: w, h: h, v: H(cx, cy, 550 + q) });
    }
    solidsCache[k] = out; solidsCacheN++;
    return out;
  };



  PC.paintChunkD1 = function (scene, g, cx, cy) {
    var wx = cx * C, wy = cy * C;
    g.imageSmoothingEnabled = false;

    // ---- 1. plaza base everywhere ----
    g.fillStyle = COL.plaza;
    g.fillRect(0, 0, C, C);
    speck(g, wx, wy, 0, 0, C, C, 11, 0.05, COL.plazaStain, 2);
    // big slab seams every 64, world-aligned
    g.fillStyle = COL.plazaSeam;
    for (var sx = -(((wx % 64) + 64) % 64); sx < C; sx += 64) g.fillRect(sx, 0, 1, C);
    for (var sy = -(((wy % 64) + 64) % 64); sy < C; sy += 64) g.fillRect(0, sy, C, 1);
    // occasional plaza stains (bigger soft blobs)
    for (var st = 0; st < 5; st++) {
      var rs = H(cx, cy, 400 + st);
      if (rs < 0.5) continue;
      var sx2 = (rs * 7919) % C, sy2 = (H(cx, cy, 450 + st) * 6367) % C;
      g.fillStyle = COL.plazaStain;
      g.beginPath();
      g.ellipse(sx2, sy2, 18 + rs * 20, 12 + rs * 12, 0, 0, Math.PI * 2);
      g.fill();
    }

    // ---- 2. sidewalks (full road band, painted under asphalt) ----
    g.fillStyle = COL.walk;
    g.fillRect(R0, 0, R1 - R0, C);
    g.fillRect(0, R0, C, R1 - R0);
    // sidewalk slab seams every 24, world-aligned, only inside walk strips
    g.fillStyle = COL.walkSeam;
    for (var wsy = -(((wy % 24) + 24) % 24); wsy < C; wsy += 24) {
      g.fillRect(R0, wsy, 24, 1); g.fillRect(A1, wsy, 24, 1);
    }
    for (var wsx = -(((wx % 24) + 24) % 24); wsx < C; wsx += 24) {
      g.fillRect(wsx, R0, 1, 24); g.fillRect(wsx, A1, 1, 24);
    }
    speck(g, wx, wy, R0, 0, 24, C, 21, 0.04, COL.walkSeam, 1);
    speck(g, wx, wy, A1, 0, 24, C, 22, 0.04, COL.walkSeam, 1);
    speck(g, wx, wy, 0, R0, C, 24, 23, 0.04, COL.walkSeam, 1);
    speck(g, wx, wy, 0, A1, C, 24, 24, 0.04, COL.walkSeam, 1);

    // ---- 3. asphalt ----
    g.fillStyle = COL.asphalt;
    g.fillRect(A0, 0, A1 - A0, C);
    g.fillRect(0, A0, C, A1 - A0);
    speck(g, wx, wy, A0, 0, A1 - A0, C, 31, 0.10, COL.aSpeck1, 1);
    speck(g, wx, wy, A0, 0, A1 - A0, C, 32, 0.07, COL.aSpeck2, 2);
    speck(g, wx, wy, 0, A0, C, A1 - A0, 33, 0.10, COL.aSpeck1, 1);
    speck(g, wx, wy, 0, A0, C, A1 - A0, 34, 0.07, COL.aSpeck2, 2);
    // wheel-wear strips (darker translucent lanes)
    g.fillStyle = COL.wear;
    g.fillRect(A0 + 12, 0, 14, C); g.fillRect(A1 - 26, 0, 14, C);
    g.fillRect(0, A0 + 12, C, 14); g.fillRect(0, A1 - 26, C, 14);

    // ---- 4. curbs (light edge between sidewalk and asphalt) ----
    g.fillStyle = COL.curb;
    g.fillRect(A0 - 2, 0, 2, C); g.fillRect(A1, 0, 2, C);
    g.fillRect(0, A0 - 2, C, 2); g.fillRect(0, A1, C, 2);

    // ---- 5. center dashes (skip through the intersection) ----
    g.fillStyle = COL.dash;
    var mid = (A0 + A1) / 2;
    for (var dy = -(((wy % 40) + 40) % 40); dy < C; dy += 40) {
      if (dy + 18 > A0 - 8 && dy < A1 + 8) continue;
      g.fillRect(mid - 2, dy, 4, 18);
    }
    for (var dx2 = -(((wx % 40) + 40) % 40); dx2 < C; dx2 += 40) {
      if (dx2 + 18 > A0 - 8 && dx2 < A1 + 8) continue;
      g.fillRect(dx2, mid - 2, 18, 4);
    }

    // ---- 6. crosswalk zebras on the 4 intersection approaches ----
    g.fillStyle = COL.zebra;
    for (var z = A0 + 6; z < A1 - 4; z += 12) {
      g.fillRect(z, A0 - 20, 8, 14);            // top approach
      g.fillRect(z, A1 + 6, 8, 14);             // bottom
      g.fillRect(A0 - 20, z, 14, 8);            // left
      g.fillRect(A1 + 6, z, 14, 8);             // right
    }

    // ---- 7. manholes + cracks + patches on asphalt ----
    if (H(cx, cy, 71) > 0.4) {
      var mhy = 60 + H(cx, cy, 72) * 100;
      g.fillStyle = COL.manholeRim;
      g.beginPath(); g.arc(mid, mhy, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.manhole;
      g.beginPath(); g.arc(mid, mhy, 7, 0, Math.PI * 2); g.fill();
      g.fillStyle = COL.manholeRim;
      g.fillRect(mid - 4, mhy - 1, 8, 1); g.fillRect(mid - 1, mhy - 4, 1, 8);
    }
    for (var ck = 0; ck < 3; ck++) {
      if (H(cx, cy, 80 + ck) < 0.45) continue;
      var cxx = A0 + 6 + H(cx, cy, 84 + ck) * (A1 - A0 - 12);
      var cyy = H(cx, cy, 88 + ck) * C;
      g.strokeStyle = COL.crack; g.lineWidth = 1;
      g.beginPath(); g.moveTo(cxx, cyy);
      for (var seg = 1; seg <= 4; seg++) {
        g.lineTo(cxx + (H(cx, cy, 90 + ck * 7 + seg) - 0.5) * 22 * seg,
                 cyy + seg * (5 + H(cx, cy, 96 + ck * 7 + seg) * 8));
      }
      g.stroke();
    }

    // ---- 8. hand-painted street furniture, litter and BUILDINGS ----
    // (all PixelLab map assets retired - Mark round 6: paint by hand)

    function pole(lx, ly) {                        // lamppost + warm pool
      var grad = g.createRadialGradient(lx, ly - 4, 4, lx, ly - 4, 56);
      grad.addColorStop(0, COL.glow); grad.addColorStop(1, 'rgba(242,195,60,0)');
      g.fillStyle = grad; g.fillRect(lx - 56, ly - 60, 112, 112);
      g.fillStyle = '#191627';
      g.fillRect(lx - 4, ly + 2, 8, 3);            // base plate
      g.fillRect(lx - 1, ly - 34, 3, 36);          // pole
      g.fillRect(lx - 5, ly - 38, 11, 5);          // head housing
      g.fillStyle = '#f2c33c'; g.fillRect(lx - 3, ly - 37, 7, 3);   // lamp
      g.fillStyle = 'rgba(247,244,239,0.75)'; g.fillRect(lx - 2, ly - 37, 2, 1);
    }
    function hydrant(x, y) {
      g.fillStyle = '#8f2626'; g.fillRect(x - 4, y - 9, 9, 10);
      g.fillStyle = '#b03030'; g.fillRect(x - 4, y - 9, 4, 10);
      g.fillStyle = '#701d1d'; g.fillRect(x - 6, y - 4, 3, 4); g.fillRect(x + 4, y - 4, 3, 4);
      g.fillStyle = '#b03030'; g.fillRect(x - 2, y - 12, 5, 3);
      g.fillStyle = '#191627'; g.fillRect(x - 5, y + 1, 11, 2);
    }
    function trashcan(x, y) {
      g.fillStyle = '#3f3b58'; g.fillRect(x - 6, y - 14, 13, 15);
      g.fillStyle = '#55516f'; g.fillRect(x - 6, y - 14, 5, 15);
      g.fillStyle = '#191627';
      g.fillRect(x - 7, y - 16, 15, 3);
      g.fillRect(x - 3, y - 11, 1, 10); g.fillRect(x + 1, y - 11, 1, 10);
      g.fillRect(x - 7, y + 1, 15, 1);
    }
    function bench(x, y) {
      g.fillStyle = '#4a3945';
      g.fillRect(x - 13, y - 6, 27, 5);
      g.fillStyle = '#5c4854'; g.fillRect(x - 13, y - 6, 27, 2);
      g.fillStyle = '#191627';
      g.fillRect(x - 12, y - 1, 3, 4); g.fillRect(x + 10, y - 1, 3, 4);
    }
    function planter(x, y) {
      g.fillStyle = '#3a3550'; g.fillRect(x - 10, y - 7, 21, 8);
      g.fillStyle = '#191627'; g.fillRect(x - 10, y + 1, 21, 1);
      g.fillStyle = '#3f6b3d';
      g.fillRect(x - 8, y - 12, 7, 7); g.fillRect(x - 2, y - 14, 8, 9); g.fillRect(x + 5, y - 11, 5, 6);
      g.fillStyle = '#57895a'; g.fillRect(x - 1, y - 13, 4, 3); g.fillRect(x - 7, y - 11, 3, 2);
    }
    function litterFries(x, y) {
      g.fillStyle = '#8f2626'; g.fillRect(x - 3, y - 4, 7, 6);
      g.fillStyle = '#c9a032';
      g.fillRect(x - 2, y - 8, 2, 5); g.fillRect(x + 1, y - 7, 2, 4);
      g.fillRect(x + 5, y - 2, 4, 2); g.fillRect(x - 8, y + 1, 4, 2);
    }
    function litterWrapper(x, y) {
      g.fillStyle = '#8b879f';
      g.fillRect(x - 4, y - 2, 8, 5); g.fillRect(x - 2, y - 4, 5, 3);
      g.fillStyle = '#a5a1b8'; g.fillRect(x - 2, y - 2, 3, 2);
    }
    function litterCup(x, y) {
      g.fillStyle = '#8f2626'; g.fillRect(x - 3, y - 5, 7, 9);
      g.fillStyle = '#cfd4e8'; g.fillRect(x - 3, y - 3, 7, 2); g.fillRect(x - 3, y + 1, 7, 2);
      g.fillStyle = '#191627'; g.fillRect(x + 3, y - 8, 1, 5);
    }

    // lampposts at intersection corners
    var corners = [[R0 - 12, R0 - 10], [R1 + 12, R0 - 10], [R0 - 12, R1 + 22], [R1 + 12, R1 + 22]];
    for (var cn = 0; cn < 4; cn++) {
      if (H(cx, cy, 110 + cn) < 0.35) continue;
      pole(corners[cn][0], corners[cn][1]);
    }
    // street furniture along the sidewalks
    var FURN = [hydrant, trashcan, bench, planter];
    for (var fy = 48; fy < C; fy += 112) {
      var rf = H(cx, cy, 130 + fy);
      if (inRoadBand(wy + fy) || rf < 0.45) continue;
      FURN[((rf * 977) | 0) % FURN.length](R0 + 11, fy);
    }
    for (var fx2 = 72; fx2 < C; fx2 += 128) {
      var rf2 = H(cx, cy, 150 + fx2);
      if (inRoadBand(wx + fx2) || rf2 < 0.5) continue;
      FURN[((rf2 * 787) | 0) % FURN.length](fx2, A1 + 22);
    }
    // food-flood litter, sparse and warm
    var LIT = [litterFries, litterWrapper, litterCup];
    for (var lt = 0; lt < 6; lt++) {
      var rl = H(cx, cy, 180 + lt);
      if (rl < 0.35) continue;
      LIT[((rl * 887) | 0) % LIT.length](
        (H(cx, cy, 190 + lt) * (C - 40)) + 20, (H(cx, cy, 200 + lt) * (C - 40)) + 30);
    }

    // ---- 9. BUILDINGS (real obstacles; rects shared with collision) ----
    var solids = PC.chunkSolids(cx, cy);
    for (var bi = 0; bi < solids.length; bi++) {
      var b = solids[bi];
      var bx = b.x - wx, by = b.y - wy;
      var ROOFS = [
        { base: '#3a3550', lite: '#453f60', dark: '#2c2840' },
        { base: '#463a48', lite: '#544459', dark: '#362c38' },
        { base: '#35415a', lite: '#3f4d6a', dark: '#293246' },
      ];
      var R = ROOFS[((b.v * 883) | 0) % 3];
      // drop shadow to the lower-right (fake height)
      g.fillStyle = 'rgba(15,12,24,0.45)';
      g.fillRect(bx + 5, by + 7, b.w, b.h);
      // wall strip along the bottom edge (the visible face)
      g.fillStyle = R.dark;
      g.fillRect(bx, by, b.w, b.h);
      // roof slab, inset - parapet edge reads as height
      g.fillStyle = R.base;
      g.fillRect(bx + 2, by + 2, b.w - 4, b.h - 8);
      g.fillStyle = R.lite;
      g.fillRect(bx + 2, by + 2, b.w - 4, 2);
      g.fillRect(bx + 2, by + 2, 2, b.h - 8);
      // roof speckle, world-keyed
      speck(g, wx, wy, bx + 4, by + 4, b.w - 8, b.h - 12, 600 + bi, 0.06, R.dark, 2);
      // AC units + vents
      var nAc = 1 + ((b.v * 7) | 0) % 3;
      for (var ac = 0; ac < nAc; ac++) {
        var ax = bx + 10 + H(cx, cy, 700 + bi * 9 + ac) * (b.w - 34);
        var ay = by + 10 + H(cx, cy, 720 + bi * 9 + ac) * (b.h - 34);
        g.fillStyle = '#55516f'; g.fillRect(ax, ay, 16, 11);
        g.fillStyle = '#6d6a8e'; g.fillRect(ax, ay, 16, 3);
        g.fillStyle = '#191627'; g.beginPath(); g.arc(ax + 8, ay + 7, 3, 0, Math.PI * 2); g.fill();
      }
      // rooftop hatch + pipe
      g.fillStyle = R.dark;
      g.fillRect(bx + b.w - 18, by + 6, 10, 8);
      g.fillStyle = '#55516f';
      g.fillRect(bx + 6, by + b.h - 18, 3, 6);
      // street-facing awning stripe on the bottom face (a hint of shopfront)
      if (b.v > 0.5) {
        var awW = Math.min(40, b.w - 16);
        var awX = bx + ((b.w - awW) / 2) | 0;
        g.fillStyle = '#8f2626'; g.fillRect(awX, by + b.h - 5, awW, 5);
        g.fillStyle = '#cfd4e8';
        for (var aw = awX + 5; aw < awX + awW - 4; aw += 10) g.fillRect(aw, by + b.h - 5, 5, 5);
      }
    }
  };
})();
