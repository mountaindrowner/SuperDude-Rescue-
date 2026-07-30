// region.js - STORY-2: the authored-map layer (docs/STORY_BUILD_PLAN.md).
// ONE rendering path (ENV_PIPELINE guardrail): the existing city-fabric
// painter (world.js paintChunkD1) paints every in-bounds chunk exactly as
// in patrol mode; the region OVERLAYS landmark plates, clears/replaces
// collision inside landmark lots, walls the map border, and paints void
// beyond it. Memory model unchanged (same 512px chunk slots).
window.PC = window.PC || {};

PC.BLOCK = 512;                   // 1 fabric street cell

// ---- LAND PARCELS (v0.24.0) -----------------------------------------
// Mark, reviewing the whole-map renders: "it shouldn't cover streets."
// The fabric puts a 128px road band at 192..320 of every 512 cell, so
// the actual LAND between streets is a 384px square that straddles the
// cell boundary. Landmarks are now sized and placed in PARCELS, not
// cells, so every lot edge lands exactly on a street edge - no more
// rectangles slicing a road in half and leaving slivers.
//   parcel p spans x = 512p + 320 .. 512p + 704
PC.PARCEL = { ORIGIN: 320, SIZE: 384, STRIDE: 512 };
PC.parcelRect = function (c0, r0, c1, r1) {
  var P = PC.PARCEL;
  return {
    x: c0 * P.STRIDE + P.ORIGIN,
    y: r0 * P.STRIDE + P.ORIGIN,
    w: (c1 - c0) * P.STRIDE + P.SIZE,
    h: (r1 - r0) * P.STRIDE + P.SIZE,
  };
};

PC.Region = function (def) {
  this.def = def;
  this.size = def.blocks * PC.BLOCK;             // world px, 0..size
  // landmark rects in world px, snapped to the parcel grid
  this.marks = [];
  for (var i = 0; i < def.landmarks.length; i++) {
    var L = def.landmarks[i];
    var r = PC.parcelRect(L.c0, L.r0, L.c1, L.r1);
    this.marks.push({ id: L.id, name: L.name, open: !!L.open,
      shape: L.shape || 'rect',                  // rect | round | organic
      fenced: !!L.fenced,                         // draws an enclosure ring
      water: !!L.water,                          // unwalkable + dock spot
      custom: !!L.custom,                        // painted by the layout
      color: L.color, accent: L.accent,
      x: r.x, y: r.y, w: r.w, h: r.h,
      cx: r.x + r.w / 2, cy: r.y + r.h / 2 });
  }
  this.spawnX = (def.spawn.c + 0.5) * PC.BLOCK + 96;
  this.spawnY = (def.spawn.r + 0.5) * PC.BLOCK + 96;
  // v0.26.0: park maps get the ORGANIC layout engine - their own paths,
  // trees, ponds and set pieces, with paint and collision from the same
  // functions. The city keeps its street fabric untouched.
  this.layout = (def.fabric === 'park' && PC.ParkLayout)
    ? new PC.ParkLayout(def) : null;
};

PC.Region.prototype.landmark = function (id) {
  for (var i = 0; i < this.marks.length; i++) {
    if (this.marks[i].id === id) return this.marks[i];
  }
  return null;
};

// ---- collision: default fabric solids, minus lots under landmarks,
// plus the landmark slab itself (non-open) + the map border ----
PC.Region.prototype.chunkSolids = function (cx, cy) {
  var C = PC.CHUNK, S = this.size, out = [];
  var x0 = cx * C, y0 = cy * C;
  // border walls (thick, just outside the playfield)
  if (x0 < 0 || y0 < 0 || x0 >= S || y0 >= S) {
    out.push({ x: x0, y: y0, w: C, h: C });      // whole out-of-bounds chunk
    return out;
  }
  if (this.layout) {
    // park: trees / rocks / ponds / fences / gear from the layout - the
    // city's building-quadrant solids do NOT apply here
    var ls = this.layout.solidsForChunk(cx, cy);
    for (var li = 0; li < ls.length; li++) out.push(ls[li]);
    // water landmarks are unwalkable except their shore
    for (var wm = 0; wm < this.marks.length; wm++) {
      var wk = this.marks[wm];
      if (!wk.water) continue;
      if (wk.x < x0 + C && wk.x + wk.w > x0 && wk.y < y0 + C && wk.y + wk.h > y0) {
        out.push({ x: wk.x + wk.w * 0.13, y: wk.y + wk.h * 0.16,
                   w: wk.w * 0.74, h: wk.h * 0.64 });
      }
    }
  } else {
    var base = PC.defaultChunkSolids(cx, cy);
    for (var i = 0; i < base.length; i++) {
      var b = base[i], drop = false;
      for (var m = 0; m < this.marks.length; m++) {
        var mk = this.marks[m];
        if (b.x < mk.x + mk.w + 24 && b.x + b.w > mk.x - 24 &&
            b.y < mk.y + mk.h + 24 && b.y + b.h > mk.y - 24) { drop = true; break; }
      }
      if (!drop) out.push(b);
    }
  }
  for (var m2 = 0; m2 < this.marks.length; m2++) {
    var mk2 = this.marks[m2];
    if (mk2.open) continue;
    if (mk2.x < x0 + C && mk2.x + mk2.w > x0 && mk2.y < y0 + C && mk2.y + mk2.h > y0) {
      // slab collision, minus a door notch on the south face (center)
      var doorW = 72;
      var dx0 = mk2.cx - doorW / 2, dx1 = mk2.cx + doorW / 2;
      out.push({ x: mk2.x, y: mk2.y, w: dx0 - mk2.x, h: mk2.h });
      out.push({ x: dx1, y: mk2.y, w: mk2.x + mk2.w - dx1, h: mk2.h });
      out.push({ x: dx0, y: mk2.y, w: doorW, h: mk2.h - 60 });   // door bay south
    }
  }
  return out;
};

// ---- paint: fabric first, then landmark plates + border/void ----
PC.Region.prototype.paintChunk = function (scene, g, cx, cy) {
  var C = PC.CHUNK, S = this.size;
  var wx = cx * C, wy = cy * C;
  if (wx < 0 || wy < 0 || wx >= S || wy >= S) {
    // the void beyond the city: dark with a faint grid + hazard rim
    g.fillStyle = '#120e24';
    g.fillRect(0, 0, C, C);
    g.strokeStyle = 'rgba(69,53,110,0.25)'; g.lineWidth = 1;
    for (var vx = 0; vx < C; vx += 64) { g.beginPath(); g.moveTo(vx, 0); g.lineTo(vx, C); g.stroke(); }
    for (var vy = 0; vy < C; vy += 64) { g.beginPath(); g.moveTo(0, vy); g.lineTo(C, vy); g.stroke(); }
  } else if (this.layout) {
    this.layout.paintChunk(scene, g, cx, cy);    // the organic park engine
  } else {
    PC.paintChunkD1(scene, g, cx, cy);           // city street fabric
  }
  // hazard border stripe along the playfield rim
  g.save();
  g.fillStyle = '#f2c33c';
  var self = this;
  function stripe(x, y, w, h, vert) {
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = '#1b1530'; g.fillRect(x, y, w, h);
    g.fillStyle = '#f2c33c';
    for (var s2 = -16; s2 < (vert ? h : w) + 16; s2 += 16) {
      g.beginPath();
      if (vert) {
        g.moveTo(x, y + s2); g.lineTo(x + w, y + s2 + 8);
        g.lineTo(x + w, y + s2 + 16); g.lineTo(x, y + s2 + 8);
      } else {
        g.moveTo(x + s2, y); g.lineTo(x + s2 + 8, y + h);
        g.lineTo(x + s2 + 16, y + h); g.lineTo(x + s2 + 8, y);
      }
      g.closePath(); g.fill();
    }
    g.restore();
  }
  if (0 >= wx && 0 < wx + C) stripe(-wx, 0, 8, C, true);
  if (S > wx && S <= wx + C) stripe(S - wx - 8, 0, 8, C, true);
  if (0 >= wy && 0 < wy + C) stripe(0, -wy, C, 8, false);
  if (S > wy && S <= wy + C) stripe(0, S - wy - 8, C, 8, false);
  g.restore();
  // landmark plates overlapping this chunk (full plate drawn, canvas
  // clips). `custom` lots (park gates, the zoo) are painted by the
  // layout engine itself and skip the generic plate.
  for (var i = 0; i < this.marks.length; i++) {
    var mk = this.marks[i];
    if (mk.custom) continue;
    if (mk.x >= wx + C || mk.x + mk.w <= wx || mk.y >= wy + C || mk.y + mk.h <= wy) continue;
    this.paintLandmark(g, mk, mk.x - wx, mk.y - wy);
  }
};

// placeholder landmark plate, quality-styled per the layer law: cast
// shadow, slab body, roof lighting, rim, signage. Real PixelLab set
// pieces replace these plate-by-plate later with zero code changes.
// trace an ORGANIC outline inside a rect: an ellipse whose radius is
// perturbed by a couple of sine terms keyed to the landmark id. Mark:
// "shouldn't be just straight lines that create the park outline...
// should be wavy, like an actual park."
PC.Region.prototype._organicPath = function (g, mk, lx, ly, inset, wobble) {
  var w = mk.w - inset * 2, h = mk.h - inset * 2;
  var cx = lx + mk.w / 2, cy = ly + mk.h / 2;
  var seed = 0;
  for (var si = 0; si < mk.id.length; si++) seed = (seed * 31 + mk.id.charCodeAt(si)) | 0;
  var ph = (seed % 100) / 100 * Math.PI * 2;
  var STEPS = 48;
  g.beginPath();
  for (var i = 0; i <= STEPS; i++) {
    var a = (i / STEPS) * Math.PI * 2;
    var k = 1 + wobble * (Math.sin(a * 3 + ph) * 0.6 + Math.sin(a * 5 - ph * 1.7) * 0.4);
    var px = cx + Math.cos(a) * (w / 2) * k;
    var py = cy + Math.sin(a) * (h / 2) * k;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath();
};

PC.Region.prototype.paintLandmark = function (g, mk, lx, ly) {
  var w = mk.w, h = mk.h, i;
  if (mk.open && mk.shape === 'round') {
    // WATER / ring features: concentric organic bands, no corners at all
    var self0 = this;
    g.fillStyle = 'rgba(10,8,18,0.28)';
    this._organicPath(g, mk, lx + 7, ly + 8, 4, 0.05); g.fill();
    // round-3 judge pass: DAYTIME water. The mk.color base read as
    // midnight against the sunny park, and the three organic bands had
    // hard seams - lift the whole stack + dither the transitions.
    g.fillStyle = '#38678a';                      // sunlit water base
    this._organicPath(g, mk, lx, ly, 2, 0.05); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.10)';       // shallows
    this._organicPath(g, mk, lx, ly, Math.min(w, h) * 0.10, 0.04); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.10)';             // deep middle
    this._organicPath(g, mk, lx, ly, Math.min(w, h) * 0.24, 0.03); g.fill();
    // dither speckle across the band seams
    for (i = 0; i < 180; i++) {
      var qa = PC.hash01(i, 48, 2) * Math.PI * 2;
      var qr = 0.14 + PC.hash01(i, 49, 3) * 0.3;
      g.fillStyle = (i % 2) ? '#4f87ad' : '#38678a';
      g.fillRect(lx + w / 2 + Math.cos(qa) * w * qr,
                 ly + h / 2 + Math.sin(qa) * h * qr, 3, 2);
    }
    g.fillStyle = 'rgba(255,255,255,0.18)';       // sun sparkle
    for (i = 0; i < 46; i++) {
      g.fillRect(lx + w * (0.18 + PC.hash01(i, 50, 4) * 0.64),
                 ly + h * (0.18 + PC.hash01(i, 51, 5) * 0.64), 2, 1);
    }
    g.strokeStyle = mk.accent; g.lineWidth = 3; g.globalAlpha = 0.6;
    this._organicPath(g, mk, lx, ly, 2, 0.05); g.stroke();
    g.globalAlpha = 1;
    // surface ripples
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2;
    for (i = 0; i < 7; i++) {
      var rx = lx + w * (0.2 + PC.hash01(i, 41, 3) * 0.6);
      var ry = ly + h * (0.2 + PC.hash01(i, 42, 4) * 0.6);
      g.beginPath(); g.ellipse(rx, ry, 16 + i * 3, 5 + i, 0, 0, Math.PI * 2); g.stroke();
    }
    // lily pad CLUSTERS - 2-3 pads each at 10-14px so they read at play
    // scale (round 2: single 8px pads resolved to green ticks)
    for (i = 0; i < 8; i++) {
      var px2 = lx + w * (0.22 + PC.hash01(i, 43, 5) * 0.56);
      var py2 = ly + h * (0.22 + PC.hash01(i, 44, 6) * 0.56);
      for (var pp = 0; pp < 3; pp++) {
        var pox = (PC.hash01(i * 3 + pp, 52, 6) - 0.5) * 22;
        var poy = (PC.hash01(i * 3 + pp, 53, 7) - 0.5) * 14;
        g.fillStyle = '#4f7a3f';
        g.beginPath(); g.ellipse(px2 + pox, py2 + poy, 7, 4.4, 0, 0.4, Math.PI * 2); g.fill();
        g.fillStyle = '#639552';
        g.beginPath(); g.ellipse(px2 + pox - 2, py2 + poy - 1, 3.4, 2, 0, 0, Math.PI * 2); g.fill();
      }
      if (i % 3 === 0) { g.fillStyle = '#ff9ecb'; g.fillRect(px2 - 1, py2 - 4, 4, 4); }
    }
    for (i = 0; i < 18; i++) {
      var ra = PC.hash01(i, 45, 7) * Math.PI * 2;
      var rrx = lx + w / 2 + Math.cos(ra) * w * 0.46;
      var rry = ly + h / 2 + Math.sin(ra) * h * 0.44;
      g.fillStyle = '#4c7050';
      g.fillRect(rrx, rry - 6, 1, 7); g.fillRect(rrx + 2, rry - 10, 1, 11); g.fillRect(rrx + 4, rry - 5, 1, 6);
      g.fillStyle = '#8a6f4a'; g.fillRect(rrx + 1, rry - 10, 2, 3);       // cattail
    }
    // ducks: 10px white-on-blue with V wakes (round 2: too small to read)
    for (i = 0; i < 4; i++) {
      var dxq = lx + w * (0.28 + PC.hash01(i, 46, 8) * 0.44);
      var dyq = ly + h * (0.28 + PC.hash01(i, 47, 9) * 0.44);
      g.strokeStyle = 'rgba(255,255,255,0.30)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(dxq - 14, dyq - 5); g.lineTo(dxq - 2, dyq); g.stroke();
      g.beginPath(); g.moveTo(dxq - 14, dyq + 5); g.lineTo(dxq - 2, dyq + 1); g.stroke();
      g.fillStyle = '#f4efe2'; g.fillRect(dxq, dyq - 3, 10, 6);           // body
      g.fillRect(dxq - 2, dyq - 2, 3, 4);                                 // tail
      g.fillStyle = '#e0d8c4'; g.fillRect(dxq, dyq + 1, 10, 2);
      g.fillStyle = '#3f6b41'; g.fillRect(dxq + 7, dyq - 8, 5, 6);        // head
      g.fillStyle = '#f2c33c'; g.fillRect(dxq + 12, dyq - 6, 3, 2);       // beak
      g.fillStyle = '#232833'; g.fillRect(dxq + 10, dyq - 7, 1, 1);       // eye
    }
    // v0.26.0: real water is unwalkable, so the mission spot moved to a
    // painted DOCK on the south shore (quest.spotOf water branch)
    if (mk.water) {
      // a proper pier: planked walkway reaching into the water, posts
      // down both sides, a mooring ring - the mission dock
      var dxk = lx + w / 2, dyk = ly + h - 12;
      var pierH = h * 0.3;
      g.fillStyle = 'rgba(10,8,18,0.3)'; g.fillRect(dxk - 20, dyk - pierH + 6, 46, pierH);
      g.fillStyle = '#6b5334'; g.fillRect(dxk - 22, dyk - pierH, 44, pierH);
      g.fillStyle = '#7d6340';
      for (i = 0; i < pierH / 9; i++) g.fillRect(dxk - 22, dyk - pierH + i * 9, 44, 3);
      g.fillStyle = '#4a3a28';
      for (i = 0; i <= pierH / 26; i++) {
        g.fillRect(dxk - 26, dyk - pierH + i * 26, 5, 9);
        g.fillRect(dxk + 21, dyk - pierH + i * 26, 5, 9);
      }
      g.fillStyle = '#8a877d'; g.fillRect(dxk + 10, dyk - pierH + 8, 5, 5);
      g.fillStyle = '#57544d'; g.fillRect(dxk + 11, dyk - pierH + 9, 3, 3);
    }
  } else if (mk.open) {
    // open GROUND feature with a soft irregular edge instead of a slab
    g.fillStyle = 'rgba(10,8,18,0.22)';
    this._organicPath(g, mk, lx + 6, ly + 7, 6, 0.07); g.fill();
    g.fillStyle = mk.color;
    this._organicPath(g, mk, lx, ly, 4, 0.07); g.fill();
    g.save();
    this._organicPath(g, mk, lx, ly, 4, 0.07); g.clip();
    g.fillStyle = 'rgba(0,0,0,0.16)';
    for (var sx2 = 0; sx2 <= w; sx2 += 64) g.fillRect(lx + sx2, ly, 1, h);
    for (var sy2 = 0; sy2 <= h; sy2 += 64) g.fillRect(lx, ly + sy2, w, 1);
    g.fillStyle = 'rgba(255,246,224,0.05)';
    for (var sp = 0; sp < 60; sp++) {
      g.fillRect(lx + PC.hash01(sp, 31, 7) * w, ly + PC.hash01(sp, 32, 8) * h, 2, 2);
    }
    g.restore();
    g.strokeStyle = mk.accent; g.lineWidth = 3; g.globalAlpha = 0.55;
    this._organicPath(g, mk, lx, ly, 4, 0.07); g.stroke();
    g.globalAlpha = 1;
    // FENCED enclosure (Mark: "create a sectioned off space for the zoo")
    if (mk.fenced) {
      g.strokeStyle = mk.accent; g.lineWidth = 4; g.globalAlpha = 0.85;
      this._organicPath(g, mk, lx, ly, 14, 0.055); g.stroke();
      g.globalAlpha = 1;
      // posts around the run
      g.fillStyle = '#4a3a28';
      var pcx = lx + w / 2, pcy = ly + h / 2;
      for (i = 0; i < 26; i++) {
        var pa = (i / 26) * Math.PI * 2;
        if (pa > 1.25 && pa < 1.95) continue;          // gate gap, south side
        g.fillRect(Math.round(pcx + Math.cos(pa) * (w / 2 - 14) * 0.98) - 2,
                   Math.round(pcy + Math.sin(pa) * (h / 2 - 14) * 0.98) - 3, 4, 7);
      }
    } else {
      g.beginPath(); g.arc(lx + w / 2, ly + h / 2, Math.min(w, h) * 0.18, 0, Math.PI * 2);
      g.strokeStyle = mk.accent; g.lineWidth = 4; g.stroke();
      g.fillStyle = mk.accent; g.globalAlpha = 0.25;
      g.beginPath(); g.arc(lx + w / 2, ly + h / 2, Math.min(w, h) * 0.10, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }
  } else {
    // cast shadow (SE) + contact halo
    g.fillStyle = 'rgba(10,8,18,0.30)';
    g.fillRect(lx - 4, ly - 3, w + 14, h + 16);
    g.fillStyle = 'rgba(8,6,14,0.55)';
    g.fillRect(lx + 8, ly + 10, w + 3, h + 3);
    // slab body + roof
    g.fillStyle = '#241f3d'; g.fillRect(lx, ly, w, h);
    g.fillStyle = mk.color; g.fillRect(lx + 4, ly + 4, w - 8, h - 26);
    // top-left roof light + bottom occlusion + rim
    g.fillStyle = 'rgba(255,246,224,0.16)';
    g.fillRect(lx + 4, ly + 4, w - 8, 6);
    g.fillRect(lx + 4, ly + 4, 6, h - 30);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(lx + 4, ly + h - 34, w - 8, 8);
    g.fillStyle = 'rgba(207,212,232,0.4)'; g.fillRect(lx, ly, w, 2);
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(lx + w - 2, ly + 2, 2, h - 2);
    // lit south face + door bay
    g.fillStyle = '#1c1733'; g.fillRect(lx + 4, ly + h - 26, w - 8, 22);
    var doorW = 72, dx = lx + w / 2 - doorW / 2;
    g.fillStyle = mk.accent; g.globalAlpha = 0.85;
    g.fillRect(dx, ly + h - 26, doorW, 24);
    g.globalAlpha = 1;
    g.fillStyle = '#120e24';
    g.fillRect(dx + 6, ly + h - 22, doorW - 12, 20);
    // windows strip on the face
    g.fillStyle = 'rgba(242,195,60,0.75)';
    for (var wx2 = lx + 12; wx2 < lx + w - 16; wx2 += 22) {
      if (wx2 > dx - 14 && wx2 < dx + doorW + 2) continue;
      g.fillRect(wx2, ly + h - 20, 10, 8);
    }
    // per-landmark roof FLAVOR (judge: 'placeholder landmarks read as
    // debug geometry') - painted INSIDE the roof face before the vents
    if (mk.id === 'green') {
      g.fillStyle = 'rgba(168,224,160,0.30)';
      g.fillRect(lx + 6, ly + 6, w - 12, h - 30);
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
      for (var gg = lx + 6; gg < lx + w - 6; gg += 18) {
        g.beginPath(); g.moveTo(gg, ly + 6); g.lineTo(gg, ly + h - 26); g.stroke();
      }
      for (var gh2 = ly + 6; gh2 < ly + h - 26; gh2 += 18) {
        g.beginPath(); g.moveTo(lx + 6, gh2); g.lineTo(lx + w - 6, gh2); g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.beginPath(); g.moveTo(lx + 10, ly + h * 0.5); g.lineTo(lx + w * 0.4, ly + 8);
      g.lineTo(lx + w * 0.5, ly + 8); g.lineTo(lx + 16, ly + h * 0.6); g.closePath(); g.fill();
    } else if (mk.id === 'aviary') {
      g.strokeStyle = 'rgba(207,212,232,0.45)'; g.lineWidth = 2;
      var acx = lx + w / 2, acy = ly + (h - 22) / 2;
      for (var ar2 = 1; ar2 <= 4; ar2++) {
        g.beginPath();
        g.ellipse(acx, acy, (w / 2 - 8) * ar2 / 4, (h / 2 - 16) * ar2 / 4, 0, 0, Math.PI * 2);
        g.stroke();
      }
      for (var as2 = 0; as2 < 8; as2++) {
        var aa = (as2 / 8) * Math.PI * 2;
        g.beginPath(); g.moveTo(acx, acy);
        g.lineTo(acx + Math.cos(aa) * (w / 2 - 8), acy + Math.sin(aa) * (h / 2 - 16));
        g.stroke();
      }
      g.fillStyle = '#cfd4e8'; g.fillRect(acx - 3, acy - 3, 6, 6);
    } else if (mk.id === 'ranger') {
      // round 3: plank alpha was too weak to survive the map zoom - the
      // roof read as one flat brown slab. Full-contrast planks + a lit
      // ridge line + a chunky chimney.
      g.fillStyle = '#4a3a28';
      for (var rp2 = ly + 10; rp2 < ly + h - 30; rp2 += 12) {
        g.fillRect(lx + 6, rp2, w - 12, 5);
      }
      g.fillStyle = 'rgba(255,246,224,0.22)';
      for (rp2 = ly + 6; rp2 < ly + h - 30; rp2 += 12) {
        g.fillRect(lx + 6, rp2, w - 12, 2);
      }
      g.fillStyle = '#8a6f4a';                             // lit ridge beam
      g.fillRect(lx + 6, ly + (h - 26) / 2 - 3, w - 12, 6);
      g.fillStyle = 'rgba(255,246,224,0.45)';
      g.fillRect(lx + 6, ly + (h - 26) / 2 - 3, w - 12, 2);
      g.fillStyle = '#d97862';                             // chunky chimney
      g.fillRect(lx + w * 0.68, ly + 12, 16, 22);
      g.fillStyle = '#b25a48'; g.fillRect(lx + w * 0.68, ly + 12, 16, 4);
      g.fillStyle = '#fff6e0'; g.fillRect(lx + w * 0.68 + 3, ly + 6, 10, 6);
      g.fillStyle = 'rgba(255,246,224,0.35)';              // smoke puffs
      g.beginPath(); g.arc(lx + w * 0.68 + 20, ly + 2, 5, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(lx + w * 0.68 + 30, ly - 4, 7, 0, Math.PI * 2); g.fill();
    }
    // roof detail: vents + a/c boxes keyed to id hash
    var seed = 0;
    for (var si = 0; si < mk.id.length; si++) seed = (seed * 31 + mk.id.charCodeAt(si)) | 0;
    for (var v2 = 0; v2 < 4; v2++) {
      var rx = lx + 16 + ((seed >> (v2 * 3)) % 97) / 97 * (w - 48);
      var ry = ly + 16 + ((seed >> (v2 * 5)) % 89) / 89 * (h - 70);
      g.fillStyle = 'rgba(8,6,14,0.45)'; g.fillRect(rx + 3, ry + 3, 18, 12);
      g.fillStyle = '#6d6a8e'; g.fillRect(rx, ry, 18, 12);
      g.fillStyle = 'rgba(255,246,224,0.35)'; g.fillRect(rx, ry, 18, 3);
    }
  }
  // signage: name plate at the top edge of the lot
  var label = mk.name;
  g.font = 'bold 15px monospace';
  var tw = g.measureText(label).width + 18;
  var sx = lx + w / 2 - tw / 2, sy = mk.open ? ly + 4 : ly - 10;
  g.fillStyle = 'rgba(8,6,14,0.5)'; g.fillRect(sx + 2, sy + 2, tw, 20);
  g.fillStyle = '#1c1733'; g.fillRect(sx, sy, tw, 20);
  g.strokeStyle = mk.accent; g.lineWidth = 1; g.strokeRect(sx, sy, tw, 20);
  g.fillStyle = '#f7f4ef';
  g.fillText(label, sx + 9, sy + 15);
};

// ---- install/uninstall the layout (collision override) ----
PC.installRegion = function (region) {
  PC.chunkSolids = region
    ? function (cx, cy) { return region.chunkSolids(cx, cy); }
    : PC.defaultChunkSolids;
};
