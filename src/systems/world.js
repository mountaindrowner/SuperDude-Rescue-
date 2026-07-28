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
  // the fabric's own solids; PC.chunkSolids is PLUGGABLE (region.js
  // overrides it for authored story maps, restores this default after)
  PC.defaultChunkSolids = function (cx, cy) {
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
      out.push({ x: cx * C + x, y: cy * C + y, w: w, h: h, v: H(cx, cy, 550 + q), q: q });
    }
    solidsCache[k] = out; solidsCacheN++;
    return out;
  };
  PC.chunkSolids = PC.defaultChunkSolids;



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

    // ---- 9. BUILDINGS with CHARACTER (Mark round 9: "give the
    // buildings some character... keep giving the city life") ----
    var solids = PC.chunkSolids(cx, cy);
    var usedQuads = {};
    for (var bi = 0; bi < solids.length; bi++) {
      var b = solids[bi];
      usedQuads[b.q] = true;
      var bx = b.x - wx, by = b.y - wy;
      var arch = b.v;                                  // archetype selector
      var FACE_H = 16;                                 // lit storefront face

      // ground contact shadow (soft, all around) + hard cast shadow so
      // every building clearly reads as RAISED off the plaza (Mark round
      // 10: "some invisible buildings")
      g.fillStyle = 'rgba(10,8,18,0.30)';
      g.fillRect(bx - 3, by - 2, b.w + 12, b.h + 14);      // soft halo
      g.fillStyle = 'rgba(8,6,14,0.55)';
      g.fillRect(bx + 6, by + 9, b.w + 2, b.h + 2);        // hard cast SE

      // roof family per archetype - brighter than the plaza so it pops
      var R;
      if (arch < 0.35)      R = { base: '#4a4570', lite: '#5a5388', dark: '#332f4e', name: 'shop' };
      else if (arch < 0.60) R = { base: '#5c4a54', lite: '#6e5866', dark: '#3c2f38', name: 'apt' };
      else if (arch < 0.82) R = { base: '#40567a', lite: '#4d688f', dark: '#2c3a52', name: 'office' };
      else                  R = { base: '#564a6c', lite: '#665882', dark: '#3a3050', name: 'diner' };

      // wall block + roof slab (roof inset leaves the south face visible)
      g.fillStyle = R.dark;
      g.fillRect(bx, by, b.w, b.h);
      g.fillStyle = R.base;
      g.fillRect(bx + 2, by + 2, b.w - 4, b.h - FACE_H - 2);
      g.fillStyle = R.lite;
      g.fillRect(bx + 2, by + 2, b.w - 4, 2);
      g.fillRect(bx + 2, by + 2, 2, b.h - FACE_H - 2);
      // bright top rim (roof edge catching light) - reads as "raised"
      g.fillStyle = 'rgba(207,212,232,0.35)';
      g.fillRect(bx, by, b.w, 1);
      g.fillStyle = 'rgba(0,0,0,0.35)';                    // dark right edge
      g.fillRect(bx + b.w - 1, by + 1, 1, b.h - 1);
      speck(g, wx, wy, bx + 4, by + 4, b.w - 8, b.h - FACE_H - 6, 600 + bi, 0.06, R.dark, 2);

      // ---- the lit south face: windows + door = life ----
      var faceY = by + b.h - FACE_H;
      g.fillStyle = '#221e33';
      g.fillRect(bx + 2, faceY, b.w - 4, FACE_H - 2);
      var doorX = bx + 8 + Math.floor(H(cx, cy, 900 + bi) * (b.w - 26));
      for (var wxp = bx + 6; wxp < bx + b.w - 10; wxp += 12) {
        if (wxp > doorX - 10 && wxp < doorX + 12) continue;   // door gap
        var lit = H(cx, cy, 910 + bi * 13 + wxp) > 0.3;
        g.fillStyle = lit ? '#c9a032' : '#2c2840';            // warm lit / dark
        g.fillRect(wxp, faceY + 3, 7, 6);
        if (lit) { g.fillStyle = '#e8c463'; g.fillRect(wxp + 1, faceY + 4, 2, 2); }
      }
      g.fillStyle = '#191627';                                 // door
      g.fillRect(doorX, faceY + 2, 9, FACE_H - 4);
      g.fillStyle = '#5a5678';
      g.fillRect(doorX + 6, faceY + 8, 2, 2);                  // handle
      g.fillStyle = 'rgba(201,160,50,0.12)';                   // door light spill
      g.fillRect(doorX - 3, by + b.h, 15, 6);

      // ---- archetype charm ----
      if (R.name === 'shop') {
        // striped awning over the face + hanging sign
        var awW = Math.min(b.w - 12, 44);
        var awX = bx + ((b.w - awW) / 2) | 0;
        for (var aw = 0; aw < awW; aw += 6) {
          g.fillStyle = (aw / 6) % 2 ? '#8f2626' : '#cfd4e8';
          g.fillRect(awX + aw, faceY - 4, Math.min(6, awW - aw), 5);
        }
        g.fillStyle = '#191627'; g.fillRect(awX, faceY + 1, awW, 1);
        g.fillStyle = '#c9a032'; g.fillRect(bx + b.w - 14, faceY - 8, 8, 6);   // glow sign
        g.fillStyle = '#191627'; g.fillRect(bx + b.w - 15, faceY - 9, 10, 1);
      } else if (R.name === 'apt') {
        // roof garden: planters + a clothesline
        for (var pg = 0; pg < 3; pg++) {
          var pgx = bx + 8 + H(cx, cy, 930 + bi * 7 + pg) * (b.w - 28);
          var pgy = by + 8 + H(cx, cy, 940 + bi * 7 + pg) * (b.h - FACE_H - 24);
          g.fillStyle = '#3a3550'; g.fillRect(pgx, pgy + 4, 14, 6);
          g.fillStyle = '#3f6b3d'; g.fillRect(pgx + 1, pgy, 12, 5);
          g.fillStyle = '#57895a'; g.fillRect(pgx + 3, pgy + 1, 4, 2);
        }
        g.fillStyle = '#6d6a8e';                                // clothesline
        g.fillRect(bx + 10, by + 10, 1, 8); g.fillRect(bx + b.w - 12, by + 10, 1, 8);
        g.fillRect(bx + 10, by + 12, b.w - 22, 1);
        var CLOTH = ['#8f2626', '#cfd4e8', '#3f6b3d'];
        for (var cl = 0; cl < 3; cl++) {
          g.fillStyle = CLOTH[cl];
          g.fillRect(bx + 16 + cl * 12, by + 13, 6, 5);
        }
      } else if (R.name === 'office') {
        // skylight grid, softly glowing
        for (var skr = 0; skr < 2; skr++) {
          for (var skc = 0; skc < 3; skc++) {
            var skx = bx + 10 + skc * 16, sky = by + 10 + skr * 14;
            if (skx + 12 > bx + b.w - 8 || sky + 10 > faceY - 6) continue;
            g.fillStyle = '#191627'; g.fillRect(skx, sky, 12, 10);
            g.fillStyle = H(cx, cy, 950 + bi * 11 + skr * 3 + skc) > 0.4 ? '#4a5d80' : '#2c3550';
            g.fillRect(skx + 1, sky + 1, 10, 8);
            g.fillStyle = 'rgba(207,212,232,0.35)';
            g.fillRect(skx + 2, sky + 2, 3, 2);
          }
        }
      } else {
        // diner: checker awning + big glowing roof sign with a burger disc
        var aw2 = Math.min(b.w - 10, 50), ax2 = bx + ((b.w - aw2) / 2) | 0;
        for (var ck2 = 0; ck2 < aw2; ck2 += 4) {
          g.fillStyle = (ck2 / 4) % 2 ? '#8f2626' : '#f2e6d8';
          g.fillRect(ax2 + ck2, faceY - 3, Math.min(4, aw2 - ck2), 4);
        }
        var sgx = bx + b.w / 2 - 10, sgy = by + 8;
        g.fillStyle = '#191627'; g.fillRect(sgx - 2, sgy - 2, 24, 16);
        g.fillStyle = '#2c2840'; g.fillRect(sgx, sgy, 20, 12);
        g.fillStyle = '#c9a032';                                // bun
        g.beginPath(); g.arc(sgx + 10, sgy + 6, 5, Math.PI, 0); g.fill();
        g.fillRect(sgx + 5, sgy + 8, 10, 2);
        g.fillStyle = '#8f2626'; g.fillRect(sgx + 4, sgy + 6, 12, 2);   // patty
        g.fillStyle = 'rgba(242,195,60,0.10)';
        g.fillRect(sgx - 8, sgy - 8, 36, 28);                    // sign glow
      }

      // ---- shared rooftop life ----
      if (H(cx, cy, 960 + bi) > 0.55) {                          // water tower
        var wtx = bx + 12 + H(cx, cy, 961 + bi) * (b.w - 40);
        var wty = by + 12 + H(cx, cy, 962 + bi) * ((b.h - FACE_H) * 0.4);
        g.fillStyle = '#191627';
        g.fillRect(wtx, wty + 12, 2, 6); g.fillRect(wtx + 12, wty + 12, 2, 6);
        g.fillRect(wtx + 3, wty + 14, 2, 5); g.fillRect(wtx + 9, wty + 14, 2, 5);
        g.fillStyle = '#4a3a40'; g.fillRect(wtx - 1, wty + 2, 16, 11);
        g.fillStyle = '#584550'; g.fillRect(wtx - 1, wty + 2, 16, 3);
        g.fillStyle = '#191627';
        g.beginPath(); g.moveTo(wtx - 2, wty + 2); g.lineTo(wtx + 7, wty - 4); g.lineTo(wtx + 16, wty + 2); g.fill();
      }
      var nAc = 1 + ((b.v * 7) | 0) % 2;                         // AC units
      for (var ac = 0; ac < nAc; ac++) {
        var ax3 = bx + 10 + H(cx, cy, 700 + bi * 9 + ac) * (b.w - 34);
        var ay3 = by + 10 + H(cx, cy, 720 + bi * 9 + ac) * (b.h - FACE_H - 26);
        g.fillStyle = '#55516f'; g.fillRect(ax3, ay3, 14, 10);
        g.fillStyle = '#6d6a8e'; g.fillRect(ax3, ay3, 14, 3);
        g.fillStyle = '#191627'; g.beginPath(); g.arc(ax3 + 7, ay3 + 6, 3, 0, Math.PI * 2); g.fill();
      }
      if (H(cx, cy, 970 + bi) > 0.5) {                           // antenna
        var anx = bx + b.w - 14, any2 = by + 8;
        g.fillStyle = '#6d6a8e';
        g.fillRect(anx, any2, 1, 10);
        g.fillRect(anx - 3, any2, 7, 1); g.fillRect(anx - 2, any2 + 3, 5, 1);
      }
      g.fillStyle = R.dark;                                      // roof hatch
      g.fillRect(bx + 6, by + b.h - FACE_H - 12, 10, 8);
      g.fillStyle = R.lite;
      g.fillRect(bx + 6, by + b.h - FACE_H - 12, 10, 2);
    }

    // ---- 10. CITY LIFE in the empty plaza quadrants ----
    for (var q2 = 0; q2 < 4; q2++) {
      if (usedQuads[q2]) continue;
      var Q2 = QUADS[q2];
      var qcx = (Q2[0] + Q2[2]) / 2, qcy = (Q2[1] + Q2[3]) / 2;
      var rq = H(cx, cy, 980 + q2);
      if (rq < 0.35) {
        // mini-park: grass pad + path cross + planters + benches
        var pw = 110, ph = 100;
        g.fillStyle = '#33473a';
        g.fillRect(qcx - pw / 2, qcy - ph / 2, pw, ph);
        g.fillStyle = '#3c5244';
        g.fillRect(qcx - pw / 2, qcy - ph / 2, pw, 3);
        speck(g, wx, wy, qcx - pw / 2, qcy - ph / 2, pw, ph, 985 + q2, 0.08, '#2c3d33', 2);
        g.fillStyle = COL.walk;                                   // paths
        g.fillRect(qcx - 6, qcy - ph / 2, 12, ph);
        g.fillRect(qcx - pw / 2, qcy - 6, pw, 12);
        for (var tp = 0; tp < 4; tp++) {                          // trees
          var tx2 = qcx + (tp % 2 ? 1 : -1) * (pw / 4 + 6);
          var ty2 = qcy + (tp < 2 ? -1 : 1) * (ph / 4 + 4);
          g.fillStyle = 'rgba(15,12,24,0.3)';
          g.beginPath(); g.ellipse(tx2 + 2, ty2 + 3, 9, 5, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#3f6b3d';
          g.beginPath(); g.arc(tx2, ty2, 9, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#57895a';
          g.beginPath(); g.arc(tx2 - 3, ty2 - 3, 4, 0, Math.PI * 2); g.fill();
        }
      } else if (rq < 0.6) {
        // fountain: stone ring + shimmer water
        g.fillStyle = 'rgba(15,12,24,0.3)';
        g.beginPath(); g.ellipse(qcx + 3, qcy + 4, 30, 26, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#5a5678';
        g.beginPath(); g.arc(qcx, qcy, 28, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#413d5c';
        g.beginPath(); g.arc(qcx, qcy, 24, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#2b4a66';
        g.beginPath(); g.arc(qcx, qcy, 20, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#3d6485';
        for (var sh = 0; sh < 8; sh++) {
          var sa = H(cx, cy, 990 + q2 * 9 + sh) * Math.PI * 2;
          var sr = 4 + H(cx, cy, 995 + q2 * 9 + sh) * 14;
          g.fillRect(qcx + Math.cos(sa) * sr, qcy + Math.sin(sa) * sr, 3, 1);
        }
        g.fillStyle = '#6d6a8e';
        g.beginPath(); g.arc(qcx, qcy, 5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#8fb8d8'; g.fillRect(qcx - 1, qcy - 8, 2, 6);
      }
      // else: open plaza (breathing room is life too)
    }
  };
})();
