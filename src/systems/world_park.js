// world_park.js - MAP 2 ground fabric: ADVENTURE PARK (v0.21.0).
// Same 512px block geometry as the city painter (world.js) so collision
// is IDENTICAL and free: the road bands become garden paths and the
// deterministic quadrant "buildings" become hedge blocks, painted from
// the very same PC.defaultChunkSolids rects. Only the paint changes.
// Obeys the no-flat law: grass gets mow stripes + tufts + clover specks,
// paths get gravel + stone edging, hedges get canopy lumps + cast shadow.
window.PC = window.PC || {};
(function () {
  var C = 512;
  var R0 = 192, R1 = 320;          // path band (matches the city's road band)
  var P0 = 216, P1 = 296;          // packed-earth track inside it
  function H(x, y, s) { return PC.hash01(x, y, s); }

  var COL = {
    grass:    '#2f4a33', grassMow: '#33513a', grassDark: '#294029',
    tuft:     '#3d6141', clover:   '#457a4a', bloom1: '#c96b9a',
    bloom2:   '#d8b24a', bloom3:   '#8f6fc4',
    verge:    '#3a5c3e', edging:   '#6b6a58',
    path:     '#5a4f3c', pathDark: '#4d4333', gravel: '#6e6148',
    pathWear: 'rgba(30,24,16,0.30)',
    hedge:    '#274a2c', hedgeTop: '#39683c', hedgeLip: '#4a8049',
    hedgeDark:'#1c3720', shadow:   'rgba(12,20,14,0.38)',
    trunk:    '#4a3a28',
  };

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

  PC.paintChunkPark = function (scene, g, cx, cy) {
    var wx = cx * C, wy = cy * C, i;
    g.imageSmoothingEnabled = false;

    // ---- 1. lawn everywhere ----
    g.fillStyle = COL.grass;
    g.fillRect(0, 0, C, C);
    // mown stripes, world-aligned so they run unbroken across chunks
    g.fillStyle = COL.grassMow;
    for (var my = -(((wy % 48) + 48) % 48); my < C; my += 48) g.fillRect(0, my, C, 24);
    speck(g, wx, wy, 0, 0, C, C, 61, 0.10, COL.grassDark, 2);
    speck(g, wx, wy, 0, 0, C, C, 62, 0.05, COL.clover, 1);
    // grass tufts
    g.fillStyle = COL.tuft;
    for (i = 0; i < 46; i++) {
      var tx = H(cx, cy, 700 + i) * C, ty = H(cx, cy, 760 + i) * C;
      g.fillRect(tx, ty, 1, 3); g.fillRect(tx + 2, ty + 1, 1, 2);
      g.fillRect(tx - 2, ty + 1, 1, 2);
    }
    // wildflower dots (the park's only saturated ground note - kept tiny
    // so actors still win the readability fight)
    for (i = 0; i < 16; i++) {
      var fr = H(cx, cy, 820 + i);
      var fx = H(cx, cy, 840 + i) * C, fy = H(cx, cy, 860 + i) * C;
      if (fx > R0 - 8 && fx < R1 + 8) continue;
      if (fy > R0 - 8 && fy < R1 + 8) continue;
      g.fillStyle = fr < 0.4 ? COL.bloom1 : fr < 0.75 ? COL.bloom2 : COL.bloom3;
      g.fillRect(fx, fy, 2, 2);
    }

    // ---- 2. garden paths (where the city has roads) ----
    g.fillStyle = COL.verge;
    g.fillRect(R0, 0, R1 - R0, C);
    g.fillRect(0, R0, C, R1 - R0);
    g.fillStyle = COL.path;
    g.fillRect(P0, 0, P1 - P0, C);
    g.fillRect(0, P0, C, P1 - P0);
    // gravel + wear
    speck(g, wx, wy, P0, 0, P1 - P0, C, 71, 0.16, COL.gravel, 1);
    speck(g, wx, wy, 0, P0, C, P1 - P0, 72, 0.16, COL.gravel, 1);
    speck(g, wx, wy, P0, 0, P1 - P0, C, 73, 0.08, COL.pathDark, 2);
    speck(g, wx, wy, 0, P0, C, P1 - P0, 74, 0.08, COL.pathDark, 2);
    g.fillStyle = COL.pathWear;
    g.fillRect(P0 + 6, 0, 3, C); g.fillRect(P1 - 9, 0, 3, C);
    g.fillRect(0, P0 + 6, C, 3); g.fillRect(0, P1 - 9, C, 3);
    // stone edging along both sides of each path
    g.fillStyle = COL.edging;
    for (var ey = -(((wy % 14) + 14) % 14); ey < C; ey += 14) {
      g.fillRect(P0 - 3, ey, 3, 9); g.fillRect(P1, ey, 3, 9);
    }
    for (var ex = -(((wx % 14) + 14) % 14); ex < C; ex += 14) {
      g.fillRect(ex, P0 - 3, 9, 3); g.fillRect(ex, P1, 9, 3);
    }

    // ---- 3. hedge blocks on the SAME footprints the city uses for
    // buildings, so collision needs no park-specific code at all ----
    var solids = PC.defaultChunkSolids(cx, cy);
    for (i = 0; i < solids.length; i++) {
      var b = solids[i];
      var x = b.x - wx, y = b.y - wy, w = b.w, h = b.h;
      // cast shadow (SE, matches the city's light direction)
      g.fillStyle = COL.shadow;
      g.fillRect(x + 5, y + 7, w, h);
      // body + lit top face
      g.fillStyle = COL.hedgeDark; g.fillRect(x, y, w, h);
      g.fillStyle = COL.hedge; g.fillRect(x + 2, y + 2, w - 4, h - 6);
      g.fillStyle = COL.hedgeTop; g.fillRect(x + 2, y + 2, w - 4, Math.max(8, h * 0.42));
      // canopy lumps along the top edge so it never reads as a box
      g.fillStyle = COL.hedgeLip;
      for (var lx = x + 4; lx < x + w - 6; lx += 11) {
        var lr = H(b.x + lx, b.y, 90);
        g.beginPath();
        g.ellipse(lx + 4, y + 3 + lr * 3, 6, 4, 0, 0, Math.PI * 2);
        g.fill();
      }
      // leaf speckle + a trimmed base line
      speck(g, b.x, b.y, x, y, w, h - 4, 80, 0.13, COL.hedgeDark, 2);
      speck(g, b.x, b.y, x, y, w, Math.max(8, h * 0.42), 81, 0.10, COL.clover, 1);
      g.fillStyle = COL.hedgeDark;
      g.fillRect(x + 2, y + h - 5, w - 4, 3);
      // an occasional topiary ball on the corner
      if (b.v > 0.72) {
        g.fillStyle = COL.trunk; g.fillRect(x + w - 16, y + h - 14, 4, 10);
        g.fillStyle = COL.hedge;
        g.beginPath(); g.ellipse(x + w - 14, y + h - 18, 10, 9, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = COL.hedgeLip;
        g.beginPath(); g.ellipse(x + w - 17, y + h - 21, 5, 4, 0, 0, Math.PI * 2); g.fill();
      }
    }

    // ---- 4. loose park furniture on the verges (paint only) ----
    for (i = 0; i < 3; i++) {
      var pr = H(cx, cy, 900 + i);
      if (pr < 0.55) continue;
      var bx = (pr * 7919) % (C - 40) , by = (H(cx, cy, 930 + i) * 6367) % (C - 40);
      if (bx > R0 - 30 && bx < R1) bx = (bx + 150) % (C - 40);
      if (by > R0 - 30 && by < R1) by = (by + 150) % (C - 40);
      // a flower bed: dark soil ring + blooms
      g.fillStyle = COL.grassDark;
      g.beginPath(); g.ellipse(bx, by, 16, 11, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3b2f22';
      g.beginPath(); g.ellipse(bx, by, 13, 8, 0, 0, Math.PI * 2); g.fill();
      for (var fb = 0; fb < 7; fb++) {
        var a = (fb / 7) * Math.PI * 2;
        g.fillStyle = fb % 3 === 0 ? COL.bloom1 : fb % 3 === 1 ? COL.bloom2 : COL.bloom3;
        g.fillRect(bx + Math.cos(a) * 8 - 1, by + Math.sin(a) * 5 - 1, 3, 3);
      }
    }
  };
})();
