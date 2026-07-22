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

  // blit a named atlas frame into the chunk canvas (props, litter)
  function blit(g, scene, frame, x, y) {
    var tex = scene.textures.get('atlas');
    var f = tex.frames[frame];
    if (!f) return;
    g.drawImage(tex.getSourceImage(), f.cutX, f.cutY, f.width, f.height,
      Math.round(x - f.width / 2), Math.round(y - f.height), f.width, f.height);
  }

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

    // ---- 8. lamp glow pools + props (blitted from the atlas, LOGICALLY
    // placed: lamps at intersection corners, street furniture on the
    // sidewalks, litter on roads + plaza) ----
    var corners = [[R0 - 12, R0 - 8], [R1 + 12, R0 - 8], [R0 - 12, R1 + 20], [R1 + 12, R1 + 20]];
    for (var cn = 0; cn < 4; cn++) {
      if (H(cx, cy, 110 + cn) < 0.35) continue;
      var lx = corners[cn][0], ly = corners[cn][1];
      var grad = g.createRadialGradient(lx, ly - 6, 4, lx, ly - 6, 60);
      grad.addColorStop(0, COL.glow); grad.addColorStop(1, 'rgba(242,195,60,0)');
      g.fillStyle = grad;
      g.fillRect(lx - 60, ly - 66, 120, 120);
      blit(g, scene, 'prop_d1_lamppost', lx, ly);
    }
    var FURN = ['prop_d1_hydrant', 'prop_d1_trashcan', 'prop_d1_newsbox', 'prop_d1_bench', 'prop_d1_crate'];
    for (var fy = 48; fy < C; fy += 112) {              // along the vertical sidewalks
      var rf = H(cx, cy, 130 + fy);
      if (inRoadBand(wy + fy) || rf < 0.45) continue;
      blit(g, scene, FURN[((rf * 977) | 0) % FURN.length], R0 + 11, fy);
    }
    for (var fx2 = 72; fx2 < C; fx2 += 128) {           // along the horizontal sidewalks
      var rf2 = H(cx, cy, 150 + fx2);
      if (inRoadBand(wx + fx2) || rf2 < 0.5) continue;
      blit(g, scene, FURN[((rf2 * 787) | 0) % FURN.length], fx2, A1 + 22);
    }
    if (H(cx, cy, 170) > 0.6) {                          // a parked car on the road edge
      blit(g, scene, 'prop_d1_car', A0 + 18, 90 + H(cx, cy, 171) * 120);
    }
    for (var lt = 0; lt < 5; lt++) {                     // the food flood, sparse
      var rl = H(cx, cy, 180 + lt);
      if (rl < 0.35) continue;
      blit(g, scene, 'decal_flood_' + (1 + ((rl * 887) | 0) % 6),
        (H(cx, cy, 190 + lt) * (C - 40)) + 20, (H(cx, cy, 200 + lt) * (C - 40)) + 36);
    }
  };
})();
