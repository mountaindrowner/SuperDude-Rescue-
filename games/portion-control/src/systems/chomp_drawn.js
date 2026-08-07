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
  // GEOMETRY, in design units, shared with the LIVE FACE overlay so the
  // pupils and the mouth land exactly in the holes the body leaves.
  // v0.55.0 restacked for Mark's notes: wider plinth, and a real NECK
  // segment between the face block and the shoulders.
  var G = {
    ray:  { y0: 0,  y1: 8 },
    brow: { y0: 7,  y1: 15 },
    face: { x0: 11, x1: 53, y0: 13, y1: 41 },
    neck: { x0: 23, x1: 41, y0: 40, y1: 47 },
    shld: { x0: 6,  x1: 58, y0: 46, y1: 55 },
    base: { x0: 0,  x1: 64, y0: 54, y1: 63 },      // FULL width now
    eyeL: { x: 15, y: 19, w: 15, h: 10 },
    eyeR: { x: 37, y: 21, w: 12, h: 9 },
    mouth: { x: 17, y: 32, w: 30, h: 8 },
    vents: [{ x: 20, y: 6 }, { x: 32, y: 3 }, { x: 43, y: 6 }],
  };
  PC.CHOMP_DRAWN_G = G;
  PC.CHOMP_DRAWN_D = D;
  PC.CHOMP_DRAWN_K = K;

  function paint(g, phase, powered) {
    g.clearRect(0, 0, D, D);
    var grow = [0, 0, 2, 4][phase] || 0;
    var crys = powered ? M.steel : M.red;

    // ---- TIER 1: the plinth, now the full width of the frame ----
    var b0 = G.base.x0, bw = G.base.x1 - G.base.x0;
    slab(g, b0, G.base.y0, bw - 1, G.base.y1 - G.base.y0, M.steel);
    dither(g, b0 + 1, G.base.y0 + 4, bw - 3, 2, M.steel.d);
    rivetRow(g, b0 + 3, G.base.y0 + 2, bw - 6, 5, M.steel);
    [b0 + 1, b0 + 11, b0 + bw - 14, b0 + bw - 5].forEach(function (hx) {
      slab(g, hx, G.base.y0 - 2, 4, 12, M.gold);     // boom-arm sockets
      rect(g, hx + 1, G.base.y0 + 1, 2, 5, M.gold.d);
    });
    for (var jb = 0; jb < 3; jb++) {                 // junction boxes
      var jx = b0 + 15 + jb * Math.floor((bw - 30) / 2);
      slab(g, jx, G.base.y0 - 5, 5, 4, M.steel);
      rect(g, jx + 1, G.base.y0 - 4, 1, 1, M.amber.m);
    }

    // ---- TIER 2: shoulders ----
    var m0 = G.shld.x0 - grow, mw = (G.shld.x1 - G.shld.x0) + grow * 2;
    slab(g, m0, G.shld.y0, mw, G.shld.y1 - G.shld.y0, M.cream, { ao: true });
    rect(g, m0 + 1, G.shld.y0, mw - 2, 1, M.gold.m);
    dither(g, m0 + 1, G.shld.y1 - 4, mw - 2, 3, M.cream.d);
    for (var px = m0 + 4; px < m0 + mw - 3; px += 8) {
      rect(g, px, G.shld.y0 + 2, 1, 5, M.cream.d);
      rect(g, px + 1, G.shld.y0 + 2, 1, 5, M.cream.l);
    }
    rivetRow(g, m0 + 2, G.shld.y0 + 1, mw - 4, 8, M.cream);
    for (var vs = 0; vs < 4; vs++) {                 // shoulder vent stacks
      var vx2 = m0 + 6 + vs * Math.floor((mw - 14) / 3);
      slab(g, vx2, G.shld.y0 - 3, 3, 4, M.steel);
      rect(g, vx2, G.shld.y0 - 3, 3, 1, M.steel.l);
    }

    // ---- THE NECK: a narrow ribbed segment carrying the head ----
    var n0 = G.neck.x0, nw = G.neck.x1 - G.neck.x0;
    slab(g, n0, G.neck.y0, nw, G.neck.y1 - G.neck.y0, M.steel, { ao: true });
    for (var nr = G.neck.y0 + 1; nr < G.neck.y1 - 1; nr += 2) {
      rect(g, n0 + 1, nr, nw - 2, 1, M.steel.d);     // ribbed conduit
      rect(g, n0 + 1, nr + 1, nw - 2, 1, M.steel.l);
    }
    rect(g, n0 - 2, G.neck.y0, 2, G.neck.y1 - G.neck.y0, M.gold.m);   // collars
    rect(g, n0 + nw, G.neck.y0, 2, G.neck.y1 - G.neck.y0, M.gold.m);
    rect(g, n0 - 2, G.neck.y0, 2, 1, M.gold.l);
    rect(g, n0 + nw, G.neck.y0, 2, 1, M.gold.l);

    // ---- TIER 3: THE FACE BLOCK ----
    var f0 = G.face.x0, fw = G.face.x1 - G.face.x0;
    slab(g, f0, G.face.y0, fw, G.face.y1 - G.face.y0, M.cream, { ao: true });
    dither(g, f0 + 1, G.face.y1 - 5, fw - 2, 4, M.cream.d);
    rect(g, f0 + 1, G.face.y0 + 1, 1, 26, M.cream.l);
    rect(g, f0 + fw - 2, G.face.y0 + 1, 1, 26, M.cream.d);
    rect(g, f0 + 6, G.face.y0 + 3, 3, 1, M.cream.d);          // scuffs
    rect(g, f0 + fw - 11, G.face.y1 - 6, 4, 1, M.cream.d);

    // BROW - overhangs and casts a real shadow into the sockets
    slab(g, f0 - 3, G.brow.y0, fw + 6, G.brow.y1 - G.brow.y0, M.gold);
    dither(g, f0 - 2, G.brow.y1 - 3, fw + 4, 2, M.gold.d);
    rivetRow(g, f0 - 1, G.brow.y0 + 1, fw + 4, 6, M.gold);
    rect(g, f0, G.brow.y1, fw, 2, 'rgba(10,8,20,0.40)');

    // EYE SOCKETS ONLY - the LENS and the tracking PUPIL are drawn live
    // by PC.ChompFace so they can follow the player. Baking them here
    // would show a second, staring pair through the overlay.
    [G.eyeL, G.eyeR].forEach(function (e) {
      rect(g, e.x - 1, e.y - 1, e.w + 2, e.h + 2, VOID);
      rect(g, e.x, e.y, e.w, e.h, M.dark.d);
      rect(g, e.x, e.y + e.h, e.w, 1, 'rgba(10,8,20,0.30)');
    });

    // MOUTH CAVITY ONLY - the aperture and slats are live too
    rect(g, G.mouth.x - 1, G.mouth.y - 1, G.mouth.w + 2, G.mouth.h + 2, VOID);
    rect(g, G.mouth.x, G.mouth.y, G.mouth.w, G.mouth.h, M.dark.d);
    rect(g, G.mouth.x - 1, G.mouth.y - 2, G.mouth.w + 2, 1, M.gold.m);
    rect(g, G.mouth.x - 1, G.mouth.y - 1, G.mouth.w + 2, 1, M.gold.d);

    // cheek hardware
    rect(g, f0 + 2, G.mouth.y - 3, 7, 5, M.dark.m);
    rect(g, f0 + 3, G.mouth.y - 2, 2, 2, M.mint.m);
    rect(g, f0 + 6, G.mouth.y - 2, 2, 2, M.amber.m);
    for (var hz = 0; hz < 3; hz++) {
      rect(g, f0 + fw - 9 + hz * 3, G.mouth.y - 3, 2, 5, hz % 2 ? M.dark.m : M.gold.m);
    }

    // ---- the stolen Ray + the vent stacks the steam pours from ----
    slab(g, D / 2 - 5, G.ray.y0 + 1, 10, 7, M.steel);
    rect(g, D / 2 - 3, G.ray.y0 + 2, 6, 5, crys.m);
    rect(g, D / 2 - 3, G.ray.y0 + 2, 6, 1, crys.l);
    if (!powered) rect(g, D / 2 - 2, G.ray.y0 + 3, 2, 1, '#ffffff');
    G.vents.forEach(function (v) {
      slab(g, v.x, v.y, 4, 5, M.steel);
      rect(g, v.x + 1, v.y, 2, 1, M.dark.m);         // the bore
    });

    // ---- phase dressing: food fusing onto the chassis ----
    if (phase >= 2) {
      [[m0 - 3, G.shld.y0 + 2], [m0 + mw - 2, G.shld.y0 + 2]].forEach(function (p2) {
        slab(g, p2[0], p2[1], 6, 5, M.gold);
        rect(g, p2[0] + 1, p2[1] + 2, 4, 2, M.red.m);
      });
    }
    if (phase >= 3) {
      [[f0 - 7, 24], [f0 + fw + 1, 26], [b0 + 2, G.base.y0 - 8],
       [b0 + bw - 9, G.base.y0 - 8]].forEach(function (p3) {
        slab(g, p3[0], p3[1], 7, 8, M.cream);
        rect(g, p3[0] + 1, p3[1] + 2, 5, 3, M.mint.m);
        rect(g, p3[0] + 1, p3[1] + 2, 5, 1, M.mint.l);
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

// =====================================================================
// THE LIVE FACE (v0.55.0, Mark: "make his eyes follow the player
// character wherever they go, make the mouth open and close a bit,
// maybe a bit of smoke or steam out the top").
//
// The body stays a baked texture - it never changes - and only the
// parts that MOVE are drawn per frame on top of it. Same split as the
// sewer water over the cached terrain: cheap, and it keeps the heavy
// shading work out of the frame loop.
//
// The eyes are the whole point. A machine whose lenses track you is
// alive in a way no amount of greeble achieves, and it costs two
// clamped lerps.
// =====================================================================
(function () {
  var G, D, K;

  PC.ChompFace = function (scene, fig) {
    G = PC.CHOMP_DRAWN_G; D = PC.CHOMP_DRAWN_D; K = PC.CHOMP_DRAWN_K;
    this.scene = scene;
    this.fig = fig;
    this.g = scene.add.graphics().setDepth(19);      // just above the body
    this.gaze = { x: 0, y: 0 };                      // smoothed, -1..1
    this.mouth = 0.5;                                // 0 shut, 1 wide
    this.t = 0;
    this.puffs = [];
    for (var i = 0; i < 10; i++) this.puffs.push({ life: 0, x: 0, y: 0, r: 0, vy: 0, vx: 0 });
    this.emit = 0;
  };

  // design-space -> world, honouring the figure's current scale and the
  // 0.9 origin the body sprite is drawn with
  PC.ChompFace.prototype._w = function (dx, dy) {
    var f = this.fig, sc = (f.sprite ? f.sprite.scaleX : 1) * K;
    return { x: f.x + (dx - D / 2) * sc,
             y: f.y + (dy - D * 0.9) * sc + (f.sprite ? 0 : 0), s: sc };
  };

  PC.ChompFace.prototype.update = function (dt) {
    var s = this.scene, f = this.fig, g = this.g;
    g.clear();
    if (!f || !f.sprite || !f.sprite.visible || f.rise < 0.9) return;
    this.t += dt;
    var powered = f.powered;

    // ---- GAZE: lenses track the player, smoothed so they glide ----
    var dx = s.px - f.x, dy = s.py - f.y;
    var d = Math.max(1, Math.hypot(dx, dy));
    var tx = Math.max(-1, Math.min(1, dx / 260));
    var ty = Math.max(-1, Math.min(1, dy / 260));
    if (powered) { tx = 0; ty = 0.6; }               // dead eyes look down
    var k = Math.min(1, dt * 3.4);
    this.gaze.x += (tx - this.gaze.x) * k;
    this.gaze.y += (ty - this.gaze.y) * k;

    // ---- MOUTH: a slow idle chew, wide open while it SERVES ----
    var target = powered ? 0.15
      : (f.serving > 0 ? 1 : 0.42 + Math.sin(this.t * 1.7) * 0.28);
    this.mouth += (target - this.mouth) * Math.min(1, dt * 6);

    var blink = (!powered && Math.sin(this.t * 0.63) > 0.982) ? 0.12 : 1;
    this._eye(g, G.eyeL, blink, powered);
    this._eye(g, G.eyeR, blink, powered);
    this._mouth(g, powered);
    this._steam(g, dt, powered);
    void d;
  };

  PC.ChompFace.prototype._eye = function (g, e, blink, powered) {
    var a = this._w(e.x, e.y), sc = a.s;
    var w = e.w * sc, h = e.h * sc * blink;
    var cy = a.y + (e.h * sc) / 2;
    // lens: lit top edge, so it still obeys the top-left light
    g.fillStyle(powered ? 0x22202c : 0xb06a1c, 1);
    g.fillRect(a.x, cy - h / 2, w, h);
    g.fillStyle(powered ? 0x2a2733 : 0xf2a03c, 1);
    g.fillRect(a.x, cy - h / 2, w, Math.max(1, h * 0.72));
    if (blink < 0.5) return;
    if (!powered) {
      g.fillStyle(0xffd479, 1);
      g.fillRect(a.x, cy - h / 2, w, Math.max(1, h * 0.16));
    }
    // THE PUPIL - the tracking part
    var pw = w * 0.34, ph = h * 0.46;
    var px = a.x + w / 2 + this.gaze.x * (w / 2 - pw / 2) - pw / 2;
    var py = cy + this.gaze.y * (h / 2 - ph / 2) - ph / 2;
    g.fillStyle(powered ? 0x15131c : 0x15131c, 1);
    g.fillRect(px, py, pw, ph);
    if (!powered) {
      g.fillStyle(0x35d0ff, 0.85);                   // a lit iris ring
      g.fillRect(px, py, pw, Math.max(1, ph * 0.3));
      g.fillStyle(0xffffff, 0.9);                    // specular, fixed to
      g.fillRect(a.x + 2, cy - h / 2 + 2, Math.max(1, w * 0.14), Math.max(1, h * 0.14));
    }
  };

  PC.ChompFace.prototype._mouth = function (g, powered) {
    var m = G.mouth, a = this._w(m.x, m.y), sc = a.s;
    var w = m.w * sc, full = m.h * sc;
    var open = full * (0.25 + 0.75 * this.mouth);
    var top = a.y + (full - open);
    g.fillStyle(0x15131c, 1);                        // the throat
    g.fillRect(a.x, top, w, open);
    // slats ride the aperture: they compress as it closes
    var slat = Math.max(1, open * 0.55);
    var n = Math.floor(m.w / 3);
    for (var i = 0; i < n; i++) {
      var sx = a.x + (i * w) / n;
      g.fillStyle(powered ? 0x3a3448 : 0x6d6a8e, 1);
      g.fillRect(sx + sc * 0.4, top + (open - slat) / 2, Math.max(1, sc * 1.6), slat);
      g.fillStyle(powered ? 0x4a4760 : 0x8b88a8, 1);
      g.fillRect(sx + sc * 0.4, top + (open - slat) / 2, Math.max(1, sc * 0.7), slat);
    }
    g.fillStyle(0x0a0716, 0.45);                     // shadow inside the lip
    g.fillRect(a.x, top, w, Math.max(1, sc));
    if (!powered && this.mouth > 0.8) {              // amber glow when wide
      g.fillStyle(0xf2a03c, 0.22);
      g.fillRect(a.x, top, w, open);
    }
  };

  PC.ChompFace.prototype._steam = function (g, dt, powered) {
    var i, p;
    // emit from the vent stacks: slower and thinner when powered down
    this.emit -= dt;
    if (this.emit <= 0) {
      this.emit = powered ? 0.9 : 0.16;
      var v = G.vents[Math.floor(Math.random() * G.vents.length)];
      var a = this._w(v.x + 2, v.y);
      for (i = 0; i < this.puffs.length; i++) {
        p = this.puffs[i];
        if (p.life > 0) continue;
        p.life = 1; p.x = a.x; p.y = a.y;
        p.r = a.s * (1.2 + Math.random() * 0.8);
        p.vy = -(26 + Math.random() * 18);
        p.vx = (Math.random() - 0.5) * 14;
        break;
      }
    }
    for (i = 0; i < this.puffs.length; i++) {
      p = this.puffs[i];
      if (p.life <= 0) continue;
      p.life -= dt * (powered ? 0.75 : 0.5);
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy *= 0.985;
      var grow = 1 + (1 - p.life) * 2.2;             // puffs swell as they rise
      g.fillStyle(0xcfd4e8, 0.30 * p.life);
      g.fillCircle(p.x, p.y, p.r * grow);
      g.fillStyle(0xffffff, 0.14 * p.life);
      g.fillCircle(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * grow * 0.5);
    }
  };

  PC.ChompFace.prototype.destroy = function () { this.g.destroy(); };
})();
