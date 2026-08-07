// chomp_drawn.js - CHOMP, THE DRAWN OPTION (v0.50.0).
//
// Mark liked the hand-drawn blocky face but wanted "more shadowing and
// detailing and texturing on your design". So this is not a flat
// blockout any more: every surface gets a proper 3-value ramp with
// hue-shifted lights and darks (ASSET_QUALITY law 4 - highlights lean
// warm, shadows lean violet, never a flat lighten/darken), dithered
// transition bands, rivets with their own highlight and shadow pixels,
// panel wear, ambient occlusion under every overhang, and scanlines in
// the eye panels.
//
// It renders ONCE into a canvas texture per phase at boot, so the
// per-frame cost is identical to the generated sprite - it is just a
// frame in the atlas by another route. Drawing it keeps three things a
// stamped sprite cannot give: exact blockiness, phases that are
// provably the same machine, and the option to animate the face later.
//
// Lit from the TOP-LEFT throughout. Every highlight and every occlusion
// band in this file obeys that one light.
window.PC = window.PC || {};
(function () {

  var D = 64;              // design grid
  var K = 4;               // 4x nearest -> 256px frames, same as the art

  // 3-value ramps. Mid is the surface, LIT leans warm/yellow, DARK
  // leans violet - a flat brightness shift reads as plastic.
  var M = {
    steel:  { d: '#3a3448', m: '#4a4760', l: '#6d6a8e' },
    cream:  { d: '#9c9078', m: '#c9c1a8', l: '#e8e2cc' },
    gold:   { d: '#a8791c', m: '#e0b232', l: '#ffd977' },
    amber:  { d: '#b06a1c', m: '#f2a03c', l: '#ffd479' },
    red:    { d: '#8f2f2c', m: '#e2574c', l: '#ff8f7a' },
    mint:   { d: '#3f8a4c', m: '#7dd97b', l: '#b4f2a8' },
    dark:   { d: '#15131c', m: '#22202c', l: '#332f3f' },
  };
  var VOID = '#12101a';

  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }

  // a slab lit from the top-left: light top+left edge, dark bottom+right,
  // and a 1px contact shadow under it
  function slab(g, x, y, w, h, mat, opts) {
    opts = opts || {};
    rect(g, x, y, w, h, mat.m);
    rect(g, x, y, w, 1, mat.l);                      // lit top
    rect(g, x, y, 1, h, mat.l);                      // lit left
    rect(g, x, y + h - 1, w, 1, mat.d);              // shaded bottom
    rect(g, x + w - 1, y, 1, h, mat.d);              // shaded right
    if (!opts.noOutline) {
      g.strokeStyle = VOID; g.lineWidth = 1;
      g.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    }
    if (opts.ao) rect(g, x, y + h, w, 2, 'rgba(10,8,20,0.35)');   // occlusion
  }

  // dither band: the checkerboard step between two values, which is what
  // makes a limited palette read as a gradient instead of a stripe
  function dither(g, x, y, w, h, c) {
    g.fillStyle = c;
    for (var yy = 0; yy < h; yy++) {
      for (var xx = (yy % 2); xx < w; xx += 2) g.fillRect(x + xx, y + yy, 1, 1);
    }
  }

  function rivet(g, x, y, mat) {
    rect(g, x, y, 2, 2, mat.d);
    rect(g, x, y, 1, 1, mat.l);
  }

  function rivetRow(g, x, y, w, step, mat) {
    for (var i = 0; i < w; i += step) rivet(g, x + i, y, mat);
  }

  // ---------------------------------------------------------------
  function paint(g, phase, powered) {
    g.clearRect(0, 0, D, D);
    var grow = [0, 0, 2, 4][phase] || 0;
    var eye = powered ? M.dark : M.amber;
    var crys = powered ? M.steel : M.red;

    // ---- TIER 1: plinth. Thin, wide, and it carries the arm sockets ----
    var b0 = 2 - grow, bw = (D - 4) + grow * 2;
    slab(g, b0, 52, bw, 9, M.steel);
    dither(g, b0 + 1, 56, bw - 2, 2, M.steel.d);          // shade toward base
    rivetRow(g, b0 + 3, 54, bw - 6, 5, M.steel);
    // four boom-arm sockets, gold so the eye finds them
    [b0 + 1, b0 + 10, b0 + bw - 13, b0 + bw - 4].forEach(function (hx) {
      slab(g, hx, 50, 4, 12, M.gold);
      rect(g, hx + 1, 53, 2, 5, M.gold.d);                // socket bore
    });

    // ---- TIER 2: shoulder block ----
    var m0 = 7 - grow, mw = (D - 14) + grow * 2;
    slab(g, m0, 43, mw, 11, M.cream, { ao: true });
    rect(g, m0 + 1, 43, mw - 2, 1, M.gold.m);             // gold band
    dither(g, m0 + 1, 49, mw - 2, 3, M.cream.d);          // underside falls off
    for (var px = m0 + 4; px < m0 + mw - 3; px += 8) {    // panel seams
      rect(g, px, 45, 1, 7, M.cream.d);
      rect(g, px + 1, 45, 1, 7, M.cream.l);
    }
    rivetRow(g, m0 + 2, 44, mw - 4, 8, M.cream);

    // ---- TIER 3: THE FACE BLOCK ----
    var f0 = 11, fw = D - 22;
    slab(g, f0, 12, fw, 32, M.cream, { ao: true });
    dither(g, f0 + 1, 38, fw - 2, 4, M.cream.d);          // lower half sinks
    rect(g, f0 + 1, 13, 1, 30, M.cream.l);                // lit inner left
    rect(g, f0 + fw - 2, 13, 1, 30, M.cream.d);
    // wear: a few scuffed pixels, never a pattern
    rect(g, f0 + 6, 16, 3, 1, M.cream.d);
    rect(g, f0 + fw - 11, 34, 4, 1, M.cream.d);
    rect(g, f0 + 20, 15, 2, 1, M.cream.l);

    // BROW - overhangs the eyes and drops a real shadow on them
    slab(g, f0 - 3, 7, fw + 6, 7, M.gold);
    dither(g, f0 - 2, 11, fw + 4, 2, M.gold.d);
    rivetRow(g, f0 - 1, 8, fw + 4, 6, M.gold);
    rect(g, f0, 14, fw, 2, 'rgba(10,8,20,0.40)');         // cast shadow

    // EYES - deep sockets, mismatched, scanlined
    function panel(x, y, w, h) {
      rect(g, x - 1, y - 1, w + 2, h + 2, VOID);          // socket
      rect(g, x, y, w, h, eye.m);
      rect(g, x, y, w, 1, eye.l);                         // lit top edge
      rect(g, x, y + h - 1, w, 1, eye.d);
      if (!powered) {
        for (var sy = y + 2; sy < y + h - 1; sy += 2) {   // scanlines
          rect(g, x, sy, w, 1, 'rgba(255,255,255,0.10)');
        }
        rect(g, x + 1, y + 1, 2, 1, '#ffffff');           // specular
      }
      rect(g, x, y + h, w, 1, 'rgba(10,8,20,0.30)');
    }
    panel(f0 + 4, 19, 15, 9);
    panel(f0 + fw - 17, 21, 13, 8);                       // smaller, lower

    // MOUTH - grille slats with depth: dark gap, lit slat face
    var gx0 = f0 + 5, gw = fw - 10, gy = 33, gh = 8;
    rect(g, gx0 - 1, gy - 1, gw + 2, gh + 2, VOID);
    rect(g, gx0, gy, gw, gh, M.dark.m);
    for (var s = 0; s < gw - 2; s += 3) {
      rect(g, gx0 + s + 1, gy + 1, 2, gh - 2, M.steel.m);
      rect(g, gx0 + s + 1, gy + 1, 1, gh - 2, M.steel.l);
    }
    rect(g, gx0, gy, gw, 2, 'rgba(10,8,20,0.45)');        // shadow in the throat
    rect(g, gx0 - 1, gy - 2, gw + 2, 1, M.gold.m);        // lip
    rect(g, gx0 - 1, gy - 1, gw + 2, 1, M.gold.d);

    // ---- the stolen Ray in its mount ----
    slab(g, D / 2 - 5, 1, 10, 7, M.steel);
    rect(g, D / 2 - 3, 2, 6, 5, crys.m);
    rect(g, D / 2 - 3, 2, 6, 1, crys.l);
    if (!powered) rect(g, D / 2 - 2, 3, 2, 1, '#ffffff');

    // ---- phase dressing: food fusing onto the chassis ----
    if (phase >= 2) {
      [[m0 - 3, 45], [m0 + mw - 2, 45]].forEach(function (p) {
        slab(g, p[0], p[1], 6, 5, M.gold);
        rect(g, p[0] + 1, p[1] + 2, 4, 2, M.red.m);
      });
    }
    if (phase >= 3) {
      [[f0 - 7, 24], [f0 + fw + 1, 26], [b0 - 1, 48], [b0 + bw - 5, 48]].forEach(function (p) {
        slab(g, p[0], p[1], 7, 8, M.cream);
        rect(g, p[0] + 1, p[1] + 2, 5, 3, M.mint.m);
        rect(g, p[0] + 1, p[1] + 2, 5, 1, M.mint.l);
      });
    }
  }

  // ---------------------------------------------------------------
  // build the four frames into atlas-style canvas textures, once
  PC.buildChompDrawn = function (scene) {
    if (PC._chompDrawnBuilt) return;
    PC._chompDrawnBuilt = true;
    var jobs = [['chompdrawn_p1', 1, false], ['chompdrawn_p2', 2, false],
                ['chompdrawn_p3', 3, false], ['chompdrawn_down', 1, true]];
    for (var i = 0; i < jobs.length; i++) {
      var key = jobs[i][0];
      if (scene.textures.exists(key)) continue;
      var tex = scene.textures.createCanvas(key, D * K, D * K);
      var ctx = tex.getContext();
      // draw at design scale into a scratch canvas, then blit up NEAREST
      var tmp = document.createElement('canvas');
      tmp.width = D; tmp.height = D;
      var tg = tmp.getContext('2d');
      paint(tg, jobs[i][1], jobs[i][2]);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, D * K, D * K);
      ctx.drawImage(tmp, 0, 0, D, D, 0, 0, D * K, D * K);
      tex.refresh();
    }
  };
})();
