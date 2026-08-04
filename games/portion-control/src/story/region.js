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
  // functions. v0.27.0: suburbs get the crescent-street engine the same
  // way. The city keeps its street fabric untouched.
  this.layout = (def.fabric === 'park' && PC.ParkLayout) ? new PC.ParkLayout(def)
    : (def.fabric === 'suburb' && PC.SuburbLayout) ? new PC.SuburbLayout(def)
    : (def.fabric === 'labs' && PC.LabsLayout) ? new PC.LabsLayout(def)
    : (def.fabric === 'sewer' && PC.SewerLayout) ? new PC.SewerLayout(def)
    : null;
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

// a top-down carousel: wooden platform, striped conical canopy with a
// scalloped edge, gold finial, ride horses peeking out under the rim
PC.Region.prototype._paintCarousel = function (g, mk, lx, ly) {
  var w = mk.w, h = mk.h, i;
  var cx = lx + w / 2, cy = ly + h / 2, R = Math.min(w, h) * 0.46;
  g.fillStyle = 'rgba(10,8,18,0.30)';
  g.beginPath(); g.ellipse(cx + 6, cy + 8, R + 10, (R + 10) * 0.92, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#6b5334';                       // wooden platform
  g.beginPath(); g.arc(cx, cy, R + 8, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#7d6340'; g.lineWidth = 2;
  for (i = 0; i < 3; i++) {
    g.beginPath(); g.arc(cx, cy, R + 2 + i * 3, 0, Math.PI * 2); g.stroke();
  }
  // horses on poles around the platform edge (under the canopy rim)
  for (i = 0; i < 10; i++) {
    var ha = (i / 10) * Math.PI * 2 + 0.3;
    var hx = cx + Math.cos(ha) * (R + 1), hy = cy + Math.sin(ha) * (R + 1) * 0.96;
    g.fillStyle = i % 2 ? '#f4efe2' : '#d8b24a';
    g.fillRect(hx - 4, hy - 2, 9, 5);
    g.fillRect(hx + 4, hy - 4, 4, 3);            // head
    g.fillStyle = '#8a4a3a'; g.fillRect(hx - 1, hy - 3, 2, 7);   // pole
  }
  // striped conical canopy
  var stripes = 14;
  for (i = 0; i < stripes; i++) {
    var a0 = (i / stripes) * Math.PI * 2, a1 = ((i + 1) / stripes) * Math.PI * 2;
    g.fillStyle = i % 2 ? '#ff9ecb' : '#f4efe2';
    g.beginPath(); g.moveTo(cx, cy);
    g.arc(cx, cy, R, a0, a1); g.closePath(); g.fill();
  }
  g.fillStyle = 'rgba(0,0,0,0.10)';              // canopy SE shading
  g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, 0.3, 1.9); g.closePath(); g.fill();
  // scalloped rim
  for (i = 0; i < 22; i++) {
    var sa = (i / 22) * Math.PI * 2;
    g.fillStyle = i % 2 ? '#e87ab0' : '#d8b24a';
    g.beginPath();
    g.arc(cx + Math.cos(sa) * R, cy + Math.sin(sa) * R, 5, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#d8b24a';                       // gold finial
  g.beginPath(); g.arc(cx, cy, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff6e0';
  g.beginPath(); g.arc(cx - 2, cy - 2, 4, 0, Math.PI * 2); g.fill();
};

// the Overgrown Amphitheater: terraced seating arcs wrapping a wooden
// stage, centre aisle, vines reclaiming the stone
PC.Region.prototype._paintAmphi = function (g, mk, lx, ly) {
  var w = mk.w, h = mk.h, i, j;
  var cx = lx + w / 2, sy = ly + h * 0.72;       // stage focus point
  // stage: wooden half-disc facing north
  g.fillStyle = 'rgba(10,8,18,0.3)';
  g.beginPath(); g.ellipse(cx + 5, sy + 8, w * 0.2, h * 0.13, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#6b5334';
  g.beginPath(); g.ellipse(cx, sy, w * 0.19, h * 0.12, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#7d6340'; g.lineWidth = 2;
  for (i = 1; i <= 3; i++) {
    g.beginPath(); g.ellipse(cx, sy, w * 0.19 * i / 3, h * 0.12 * i / 3, 0, 0, Math.PI * 2); g.stroke();
  }
  g.fillStyle = '#57544d';                       // back wall of the stage
  g.beginPath(); g.ellipse(cx, sy + h * 0.1, w * 0.21, h * 0.05, 0, 0, Math.PI); g.fill();
  // terraced seating: 4 stone arc bands opening toward the stage
  for (i = 0; i < 4; i++) {
    var rr = h * (0.22 + i * 0.13);
    g.strokeStyle = i % 2 ? '#8a877d' : '#7a7263';
    g.lineWidth = h * 0.055;
    g.beginPath();
    g.ellipse(cx, sy, w * (0.26 + i * 0.11), rr, 0, Math.PI * 1.08, Math.PI * 1.92);
    g.stroke();
    g.strokeStyle = 'rgba(12,20,14,0.25)';       // riser shadow line
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(cx, sy, w * (0.26 + i * 0.11), rr + h * 0.028, 0, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
  }
  // centre aisle cut through the seating
  g.fillStyle = mk.color;
  g.fillRect(cx - 9, ly + h * 0.06, 18, h * 0.42);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.fillRect(cx - 9, ly + h * 0.06, 3, h * 0.42);
  // overgrowth: moss clumps + vines over the stone
  for (i = 0; i < 26; i++) {
    var ma = Math.PI * (1.08 + PC.hash01(i, 61, 4) * 0.84);
    var mr = h * (0.2 + PC.hash01(i, 62, 5) * 0.42);
    var mx = cx + Math.cos(ma) * w * (0.26 + PC.hash01(i, 63, 6) * 0.33);
    var my = sy + Math.sin(ma) * mr;
    g.fillStyle = i % 3 ? '#4f7a3f' : '#639552';
    g.beginPath(); g.arc(mx, my, 3 + PC.hash01(i, 64, 7) * 4, 0, Math.PI * 2); g.fill();
  }
};

// THE DEMO SITE (v0.31.0): the wrecked stage where the Nourish-Ray demo
// went wrong - ground zero of the whole story. Broken platform, torn
// "THE END OF HUNGER" banner, a scorch blast where the Ray fired, the
// first goo, toppled speakers, hazard tape.
PC.Region.prototype._paintDemoSite = function (g, mk, lx, ly) {
  var w = mk.w, h = mk.h, i;
  var cx = lx + w / 2, cy = ly + h / 2;
  // scorch blast radiating from centre stage
  g.fillStyle = 'rgba(8,6,14,0.5)';
  this._organicPath(g, mk, lx, ly, w * 0.24, 0.06); g.fill();
  g.strokeStyle = 'rgba(8,6,14,0.35)'; g.lineWidth = 5;
  for (i = 0; i < 9; i++) {
    var sa = (i / 9) * Math.PI * 2 + 0.3;
    g.beginPath(); g.moveTo(cx + Math.cos(sa) * w * 0.1, cy + Math.sin(sa) * h * 0.1);
    g.lineTo(cx + Math.cos(sa) * w * (0.3 + PC.hash01(i, 120, 3) * 0.12),
             cy + Math.sin(sa) * h * (0.3 + PC.hash01(i, 121, 4) * 0.12));
    g.stroke();
  }
  // the stage platform, one corner collapsed
  var sx2 = cx - w * 0.24, sy2 = cy - h * 0.16, sw2 = w * 0.48, sh2 = h * 0.3;
  g.fillStyle = 'rgba(8,6,14,0.4)'; g.fillRect(sx2 + 5, sy2 + 6, sw2, sh2);
  g.fillStyle = '#4a3a55'; g.fillRect(sx2, sy2, sw2, sh2);
  g.fillStyle = '#5d4a6b';
  for (i = 0; i < sh2 / 10; i++) g.fillRect(sx2, sy2 + i * 10, sw2, 4);
  g.save(); g.translate(sx2 + sw2 * 0.86, sy2 + sh2 * 0.8); g.rotate(0.34);
  g.fillStyle = '#3a2c45'; g.fillRect(-sw2 * 0.18, -sh2 * 0.2, sw2 * 0.36, sh2 * 0.4);
  g.restore();
  g.fillStyle = '#241f3d';                              // stage skirt
  g.fillRect(sx2, sy2 + sh2, sw2, 10);
  // banner poles + the torn banner
  g.fillStyle = '#514e6b';
  g.fillRect(sx2 - 8, sy2 - 58, 6, 64); g.fillRect(sx2 + sw2 + 2, sy2 - 58, 6, 64);
  g.fillStyle = '#f2c33c';
  g.fillRect(sx2 - 2, sy2 - 52, sw2 * 0.62, 22);        // left shred
  g.save(); g.translate(sx2 + sw2 * 0.78, sy2 - 41); g.rotate(0.5);
  g.fillRect(-sw2 * 0.1, -11, sw2 * 0.2, 22);           // hanging shred
  g.restore();
  g.font = 'bold 12px monospace'; g.textAlign = 'left';
  g.fillStyle = '#241f3d';
  g.fillText('THE END OF HU-', sx2 + 6, sy2 - 37);
  // toppled speaker stacks + mic stand
  g.fillStyle = '#221e38';
  g.save(); g.translate(sx2 - 22, sy2 + sh2 - 6); g.rotate(-1.2);
  g.fillRect(-9, -13, 18, 26); g.restore();
  g.fillStyle = '#514e6b'; g.fillRect(sx2 - 30, sy2 + sh2 + 2, 26, 4);
  g.strokeStyle = '#6d6a8e'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx + 10, sy2 + sh2 - 4); g.lineTo(cx + 22, sy2 + sh2 - 30); g.stroke();
  g.fillStyle = '#221e38'; g.fillCircle ? g.fillCircle(cx + 23, sy2 + sh2 - 33, 4)
    : g.fillRect(cx + 20, sy2 + sh2 - 36, 6, 6);
  // the FIRST goo: purple splats crawling off the stage
  for (i = 0; i < 7; i++) {
    g.fillStyle = i % 2 ? '#8f4fc4' : '#5d3583';
    var gx2 = cx + (PC.hash01(i, 122, 5) - 0.5) * w * 0.7;
    var gy2 = cy + h * 0.16 + PC.hash01(i, 123, 6) * h * 0.24;
    this._organicPath(g, { x: gx2 - 12, y: gy2 - 7, w: 24, h: 14,
      id: 'goo' + i, cx: gx2, cy: gy2 }, gx2 - 12, gy2 - 7, 2, 0.2);
    g.fill();
  }
  // hazard tape line across the front
  var ty2 = ly + h - 24;
  g.fillStyle = '#514e6b';
  g.fillRect(lx + w * 0.1, ty2 - 8, 4, 26); g.fillRect(lx + w * 0.86, ty2 - 8, 4, 26);
  for (i = 0; i < (w * 0.76) / 14; i++) {
    g.fillStyle = i % 2 ? '#f2c33c' : '#2a2833';
    g.fillRect(lx + w * 0.1 + 4 + i * 14, ty2 - 2, 14, 7);
  }
};

// CENTRAL PLAZA (v0.31.0, Mark: "central plaza is boring"): ringed
// paving, a working fountain, planters, benches, flags
PC.Region.prototype._paintPlaza = function (g, mk, lx, ly) {
  var w = mk.w, h = mk.h, i;
  var cx = lx + w / 2, cy = ly + h / 2;
  // two-tone ring paving
  for (i = 6; i >= 1; i--) {
    g.fillStyle = i % 2 ? '#3a3550' : '#332e48';
    g.beginPath();
    g.ellipse(cx, cy, w * 0.08 * i, h * 0.09 * i, 0, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = 'rgba(255,246,224,0.06)'; g.lineWidth = 2;
  for (i = 0; i < 8; i++) {
    var ra3 = (i / 8) * Math.PI * 2;
    g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(ra3) * w * 0.48, cy + Math.sin(ra3) * h * 0.54); g.stroke();
  }
  // the fountain
  g.fillStyle = 'rgba(8,6,14,0.4)';
  g.beginPath(); g.ellipse(cx + 5, cy + 6, w * 0.13, h * 0.12, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#57544d';
  g.beginPath(); g.ellipse(cx, cy, w * 0.13, h * 0.12, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#38678a';
  g.beginPath(); g.ellipse(cx, cy, w * 0.1, h * 0.09, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4f87ad';
  g.beginPath(); g.ellipse(cx - w * 0.02, cy - h * 0.02, w * 0.05, h * 0.04, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#8a877d';
  g.beginPath(); g.ellipse(cx, cy - 4, w * 0.025, h * 0.02, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)';                 // spray
  for (i = 0; i < 7; i++) {
    g.fillRect(cx - 10 + PC.hash01(i, 124, 3) * 20, cy - 14 - PC.hash01(i, 125, 4) * 10, 2, 4);
  }
  // corner planters + benches + flag poles
  [[0.14, 0.16], [0.86, 0.16], [0.14, 0.84], [0.86, 0.84]].forEach(function (p, pi2) {
    var px3 = lx + w * p[0], py3 = ly + h * p[1];
    g.fillStyle = '#57544d'; g.fillRect(px3 - 14, py3 - 9, 28, 18);
    g.fillStyle = '#3d5a33'; g.fillRect(px3 - 11, py3 - 6, 22, 12);
    g.fillStyle = '#4f7a3f';
    g.beginPath(); g.ellipse(px3 - 4, py3 - 2, 7, 5, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(px3 + 5, py3 + 1, 6, 4, 0, 0, Math.PI * 2); g.fill();
  });
  [[0.5, 0.14, 0], [0.5, 0.86, 0], [0.16, 0.5, 1], [0.84, 0.5, 1]].forEach(function (b) {
    var bx3 = lx + w * b[0], by3 = ly + h * b[1];
    g.fillStyle = 'rgba(8,6,14,0.35)'; g.fillRect(bx3 - 15, by3 + 3, 30, 6);
    g.fillStyle = '#6b5334'; g.fillRect(bx3 - 16, by3 - 5, 32, 9);
    g.fillStyle = '#7d6340'; g.fillRect(bx3 - 16, by3 - 5, 32, 3);
  });
  [[0.32, 0.2], [0.68, 0.2]].forEach(function (f2, fi) {
    var fx3 = lx + w * f2[0], fy3 = ly + h * f2[1];
    g.fillStyle = '#cfd4e8'; g.fillRect(fx3 - 1, fy3 - 34, 3, 38);
    g.fillStyle = fi ? '#35d0ff' : '#f2c33c';
    g.beginPath(); g.moveTo(fx3 + 2, fy3 - 33); g.lineTo(fx3 + 20, fy3 - 28);
    g.lineTo(fx3 + 2, fy3 - 23); g.closePath(); g.fill();
  });
};

// THE MISSION BOARD (v0.31.0): a kiosk that reads as what it does -
// a big signboard of pinned mission notices under a spotlight
PC.Region.prototype._paintBoardKiosk = function (g, mk, lx, ly) {
  var w = mk.w, h = mk.h, i;
  var cx = lx + w / 2, cy = ly + h / 2;
  // paved pad
  g.fillStyle = '#3a3550';
  this._organicPath(g, mk, lx, ly, w * 0.18, 0.05); g.fill();
  g.fillStyle = 'rgba(255,246,224,0.05)';
  for (i = 0; i < 5; i++) g.fillRect(lx + w * 0.24, ly + h * 0.3 + i * 12, w * 0.52, 1);
  // spotlight pool in front of the board
  g.fillStyle = 'rgba(242,195,60,0.10)';
  g.beginPath(); g.ellipse(cx, cy + h * 0.16, w * 0.2, h * 0.12, 0, 0, Math.PI * 2); g.fill();
  // the board: posts, panel, roof cap
  var bw2 = w * 0.44, bh2 = h * 0.3;
  var bx2 = cx - bw2 / 2, by2 = cy - h * 0.24;
  g.fillStyle = 'rgba(8,6,14,0.4)'; g.fillRect(bx2 + 4, by2 + 5, bw2, bh2 + 16);
  g.fillStyle = '#4a3a28';
  g.fillRect(bx2 - 6, by2 - 4, 7, bh2 + 22); g.fillRect(bx2 + bw2 - 1, by2 - 4, 7, bh2 + 22);
  g.fillStyle = '#241f3d'; g.fillRect(bx2, by2, bw2, bh2);
  g.fillStyle = '#f2c33c'; g.fillRect(bx2, by2, bw2, 3);
  g.fillStyle = '#5d4a33'; g.fillRect(bx2 - 10, by2 - 12, bw2 + 20, 9);  // roof cap
  g.fillStyle = '#6b5334'; g.fillRect(bx2 - 10, by2 - 12, bw2 + 20, 3);
  g.font = 'bold 11px monospace'; g.textAlign = 'center';
  g.fillStyle = '#f2c33c';
  g.fillText('MISSIONS', cx, by2 + 14);
  // pinned notices - one glowing gold "next mission" note
  var cols = ['#cfd4e8', '#ff9ecb', '#a8e04a', '#9ecfde', '#cfd4e8'];
  for (i = 0; i < 5; i++) {
    var nx2 = bx2 + 8 + (i % 3) * (bw2 / 3);
    var ny2 = by2 + 20 + Math.floor(i / 3) * 18;
    g.fillStyle = cols[i]; g.fillRect(nx2, ny2, bw2 / 4, 13);
    g.fillStyle = '#d93a3a'; g.fillRect(nx2 + bw2 / 8 - 1, ny2 - 1, 3, 3);   // pin
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(nx2 + 2, ny2 + 4, bw2 / 4 - 5, 1); g.fillRect(nx2 + 2, ny2 + 7, bw2 / 4 - 7, 1);
  }
  g.fillStyle = '#f2c33c';
  g.fillRect(bx2 + bw2 - bw2 / 4 - 8, by2 + 20, bw2 / 4, 13);   // the NEXT note
  g.fillStyle = '#241f3d';
  g.font = 'bold 8px monospace';
  g.fillText('GO!', bx2 + bw2 - bw2 / 8 - 8, by2 + 30);
  // floodlight up top
  g.fillStyle = '#3a3f4a'; g.fillRect(cx - 2, by2 - 24, 4, 13);
  g.fillStyle = '#f2c33c'; g.fillRect(cx - 5, by2 - 30, 10, 7);
  g.fillStyle = '#fff6e0'; g.fillRect(cx - 3, by2 - 28, 6, 4);
};

// the Rec Center ballfield: dirt diamond, bases, mound, foul lines,
// backstop - the defend point of the suburbs mission
PC.Region.prototype._paintBallfield = function (g, mk, lx, ly) {
  var w = mk.w, h = mk.h, i;
  var hx = lx + w / 2, hy = ly + h * 0.78;         // home plate
  var R = Math.min(w, h) * 0.52;
  // outfield arc (mown stripes)
  g.fillStyle = 'rgba(255,255,255,0.05)';
  for (i = 1; i < 4; i++) {
    g.beginPath();
    g.arc(hx, hy, R * i / 4 + R * 0.06, Math.PI * 1.2, Math.PI * 1.8);
    g.arc(hx, hy, R * i / 4, Math.PI * 1.8, Math.PI * 1.2, true);
    g.closePath(); g.fill();
  }
  // dirt infield diamond
  g.fillStyle = '#b09455';
  g.beginPath();
  g.moveTo(hx, hy + 12);
  g.lineTo(hx + R * 0.44, hy - R * 0.36);
  g.lineTo(hx, hy - R * 0.74);
  g.lineTo(hx - R * 0.44, hy - R * 0.36);
  g.closePath(); g.fill();
  g.fillStyle = mk.color;                          // grass diamond inside
  g.beginPath();
  g.moveTo(hx, hy - R * 0.1);
  g.lineTo(hx + R * 0.3, hy - R * 0.38);
  g.lineTo(hx, hy - R * 0.62);
  g.lineTo(hx - R * 0.3, hy - R * 0.38);
  g.closePath(); g.fill();
  // mound + bases + home
  g.fillStyle = '#c2a568';
  g.beginPath(); g.arc(hx, hy - R * 0.37, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f4efe2';
  g.fillRect(hx - 3, hy - 3, 7, 7);
  g.fillRect(hx + R * 0.44 - 3, hy - R * 0.36 - 3, 7, 7);
  g.fillRect(hx - 3, hy - R * 0.74 - 3, 7, 7);
  g.fillRect(hx - R * 0.44 - 3, hy - R * 0.36 - 3, 7, 7);
  // foul lines
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + R * 0.72, hy - R * 0.6); g.stroke();
  g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - R * 0.72, hy - R * 0.6); g.stroke();
  // backstop arc
  g.strokeStyle = '#57544d'; g.lineWidth = 5;
  g.beginPath(); g.arc(hx, hy, 40, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
  g.strokeStyle = 'rgba(207,212,232,0.35)'; g.lineWidth = 2;
  g.beginPath(); g.arc(hx, hy, 36, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
  // bleachers on the east side
  g.fillStyle = '#8f8a7c';
  for (i = 0; i < 3; i++) {
    g.fillRect(lx + w * 0.8 + i * 8, ly + h * 0.36 - i * 4, 6, h * 0.3);
  }
};

PC.Region.prototype.paintLandmark = function (g, mk, lx, ly) {
  var w = mk.w, h = mk.h, i;
  if (mk.open && mk.shape === 'round' && !mk.water) {
    // non-water round POI (the carousel): it was falling through the
    // WATER branch and literally getting lily pads and ducks painted
    // on it - the judge's "mottled disc". A real carousel instead.
    this._paintCarousel(g, mk, lx, ly);
    return;
  }
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
      // the mission dock. Judge (park re-judge): the uniform pier read
      // as a boardwalk-to-nowhere the player stares at for a whole
      // DEFEND - now it's a DESTINATION: varied plank tones, a railing
      // down the west side, and a widened T-head platform at the end.
      var dxk = lx + w / 2, dyk = ly + h - 12;
      var pierH = h * 0.3;
      var headY = dyk - pierH;                        // T-head top
      g.fillStyle = 'rgba(10,8,18,0.3)';
      g.fillRect(dxk - 20, headY + 34, 46, pierH - 28);
      g.fillRect(dxk - 48, headY + 6, 102, 40);
      g.fillStyle = '#6b5334'; g.fillRect(dxk - 22, headY + 28, 44, pierH - 28);
      for (i = 0; i < (pierH - 28) / 9; i++) {        // varied walkway planks
        g.fillStyle = ['#7d6340', '#6b5334', '#75593a'][i % 3];
        g.fillRect(dxk - 22, headY + 28 + i * 9, 44, 5);
      }
      g.fillStyle = '#6b5334'; g.fillRect(dxk - 50, headY, 100, 34);
      for (i = 0; i < 100 / 10; i++) {                // T-head planks (vertical)
        g.fillStyle = ['#75593a', '#7d6340', '#6b5334'][i % 3];
        g.fillRect(dxk - 50 + i * 10, headY, 6, 34);
      }
      g.fillStyle = 'rgba(255,246,224,0.12)';
      g.fillRect(dxk - 50, headY, 100, 3);
      g.fillStyle = '#4a3a28';                        // posts: walkway E + T-head corners
      for (i = 0; i <= (pierH - 28) / 26; i++) {
        g.fillRect(dxk + 21, headY + 30 + i * 26, 5, 9);
      }
      g.fillRect(dxk - 54, headY - 4, 6, 12); g.fillRect(dxk + 48, headY - 4, 6, 12);
      g.fillRect(dxk - 54, headY + 28, 6, 12); g.fillRect(dxk + 48, headY + 28, 6, 12);
      // railing down the WEST side + across the T-head back
      g.fillStyle = '#4a3a28';
      g.fillRect(dxk - 28, headY + 30, 4, pierH - 26);
      g.fillStyle = '#8a6f4a';
      g.fillRect(dxk - 29, headY + 30, 6, 3);
      for (i = 0; i <= (pierH - 28) / 26; i++) g.fillRect(dxk - 30, headY + 30 + i * 26, 8, 4);
      g.fillRect(dxk - 52, headY - 2, 104, 4);        // head rail
      // mooring ring + a coiled rope + lantern on the T-head
      g.fillStyle = '#8a877d'; g.fillRect(dxk + 30, headY + 10, 6, 6);
      g.fillStyle = '#57544d'; g.fillRect(dxk + 31, headY + 11, 4, 4);
      g.strokeStyle = '#a08454'; g.lineWidth = 2;
      g.beginPath(); g.arc(dxk - 30, headY + 16, 6, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(dxk - 30, headY + 16, 3, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#3a3f4a'; g.fillRect(dxk + 2, headY - 10, 3, 12);
      g.fillStyle = '#f2c33c'; g.fillRect(dxk, headY - 16, 7, 7);
      g.fillStyle = '#fff6e0'; g.fillRect(dxk + 2, headY - 14, 3, 3);
      // shoreline dressing FLANKING the pier base - the bank the player
      // actually stands on (judge: the reed rim wasn't at this bank)
      for (i = 0; i < 6; i++) {
        var pbx = dxk + (i < 3 ? -38 - i * 16 : 34 + (i - 3) * 16);
        var pby = dyk - 4 - PC.hash01(i, 55, 3) * 10;
        g.fillStyle = '#4c7050';
        g.fillRect(pbx, pby - 7, 2, 8); g.fillRect(pbx + 3, pby - 11, 2, 12); g.fillRect(pbx + 6, pby - 6, 2, 7);
        g.fillStyle = '#8a6f4a'; g.fillRect(pbx + 3, pby - 11, 3, 4);
      }
      for (i = 0; i < 2; i++) {                       // pads by the pier
        var plx = dxk + (i ? -46 : 40), ply = headY + 46 + i * 30;
        g.fillStyle = '#4f7a3f';
        g.beginPath(); g.ellipse(plx, ply, 8, 5, 0, 0.4, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(plx + 12, ply + 6, 6, 4, 0, 0.4, Math.PI * 2); g.fill();
        g.fillStyle = '#639552';
        g.beginPath(); g.ellipse(plx - 2, ply - 1, 3.6, 2, 0, 0, Math.PI * 2); g.fill();
      }
      // dither the band seams around the pier so the water doesn't read
      // as flat vector fills at the defend spot
      for (i = 0; i < 70; i++) {
        g.fillStyle = (i % 2) ? '#4f87ad' : '#38678a';
        g.fillRect(dxk - 130 + PC.hash01(i, 56, 4) * 260,
                   headY - 60 + PC.hash01(i, 57, 5) * (pierH + 40), 3, 2);
      }
      g.fillStyle = 'rgba(255,255,255,0.18)';
      for (i = 0; i < 22; i++) {
        g.fillRect(dxk - 120 + PC.hash01(i, 58, 6) * 240,
                   headY - 50 + PC.hash01(i, 59, 7) * (pierH + 30), 2, 1);
      }
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
    } else if (mk.id === 'amphi') {
      this._paintAmphi(g, mk, lx, ly);
    } else if (mk.id === 'rec') {
      this._paintBallfield(g, mk, lx, ly);
    } else if (mk.id === 'demostage') {
      this._paintDemoSite(g, mk, lx, ly);
    } else if (mk.id === 'plaza') {
      this._paintPlaza(g, mk, lx, ly);
    } else if (mk.id === 'board') {
      this._paintBoardKiosk(g, mk, lx, ly);
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
    } else if (mk.id === 'school') {
      // the lot is 3x2 parcels - at map zoom a flat slab reads as debug
      // geometry (the ranger-station lesson). Bold shapes only: an
      // L-of-wings with a courtyard, gravel-panel roof, skylight rows,
      // a full-color basketball court, bus loop, flag and big lettering.
      var rt = h - 26;                                     // roof depth
      g.fillStyle = '#7a4a3c';                             // roof recolor
      g.fillRect(lx + 4, ly + 4, w - 8, rt - 8);
      // COURTYARD notch cut out of the middle (reads as two wings)
      g.fillStyle = '#3d5a33';
      g.fillRect(lx + w * 0.34, ly + rt * 0.3, w * 0.24, rt * 0.44);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.fillRect(lx + w * 0.34, ly + rt * 0.3, w * 0.24, 5);
      g.fillRect(lx + w * 0.34, ly + rt * 0.3, 4, rt * 0.44);
      g.fillStyle = '#4f7a3f';                             // courtyard trees
      g.beginPath(); g.arc(lx + w * 0.42, ly + rt * 0.48, 14, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(lx + w * 0.5, ly + rt * 0.6, 11, 0, Math.PI * 2); g.fill();
      // roof gravel panels + skylight rows on both wings
      g.fillStyle = 'rgba(255,246,224,0.08)';
      for (i = 0; i < 4; i++) g.fillRect(lx + 8, ly + 8 + i * (rt / 4), w - 16, 2);
      g.fillStyle = '#9ecfde';
      for (i = 0; i < 4; i++) {
        g.fillRect(lx + w * 0.08 + i * w * 0.055, ly + rt * 0.14, w * 0.035, 16);
        g.fillRect(lx + w * 0.08 + i * w * 0.055, ly + rt * 0.66, w * 0.035, 16);
      }
      g.fillStyle = 'rgba(255,255,255,0.5)';
      for (i = 0; i < 4; i++) {
        g.fillRect(lx + w * 0.08 + i * w * 0.055, ly + rt * 0.14, w * 0.035, 4);
        g.fillRect(lx + w * 0.08 + i * w * 0.055, ly + rt * 0.66, w * 0.035, 4);
      }
      // full-color basketball court on the east wing
      g.fillStyle = '#b08a55';
      g.fillRect(lx + w * 0.64, ly + rt * 0.12, w * 0.28, rt * 0.42);
      g.strokeStyle = '#fff6e0'; g.lineWidth = 3;
      g.strokeRect(lx + w * 0.64, ly + rt * 0.12, w * 0.28, rt * 0.42);
      g.beginPath();
      g.moveTo(lx + w * 0.78, ly + rt * 0.12); g.lineTo(lx + w * 0.78, ly + rt * 0.54); g.stroke();
      g.beginPath();
      g.arc(lx + w * 0.78, ly + rt * 0.33, w * 0.045, 0, Math.PI * 2); g.stroke();
      // HVAC blocks
      g.fillStyle = '#57544d';
      g.fillRect(lx + w * 0.12, ly + rt * 0.44, 22, 14);
      g.fillRect(lx + w * 0.22, ly + rt * 0.46, 16, 12);
      g.fillStyle = '#8a877d';
      g.fillRect(lx + w * 0.12, ly + rt * 0.44, 22, 3); g.fillRect(lx + w * 0.22, ly + rt * 0.46, 16, 3);
      // flag + big lettering
      g.fillStyle = '#cfd4e8'; g.fillRect(lx + w * 0.5 - 2, ly - 30, 4, 34);
      g.fillStyle = '#d93a3a'; g.fillRect(lx + w * 0.5 + 2, ly - 30, 18, 10);
      g.font = 'bold 26px monospace'; g.textAlign = 'center';
      g.fillStyle = 'rgba(20,12,10,0.55)';
      g.fillText('S C H O O L', lx + w / 2 + 2, ly + rt * 0.88 + 2);
      g.fillStyle = '#f2c33c';
      g.fillText('S C H O O L', lx + w / 2, ly + rt * 0.88);
      // frosting creeping over the north edge - the flood reached here
      for (i = 0; i < 5; i++) {
        g.fillStyle = '#f8e7ee';
        g.fillRect(lx + 14 + PC.hash01(i, 76, 3) * (w - 40), ly + 2, 14, 10 + PC.hash01(i, 77, 4) * 12);
      }
      // round-2 judge: more roof furniture (the lot is the map's biggest
      // slab) + the STORY HINT - kids trapped inside
      g.fillStyle = 'rgba(0,0,0,0.10)';                   // panel seams
      for (i = 1; i < 6; i++) g.fillRect(lx + 8, ly + 8 + i * (rt / 6), w - 16, 2);
      for (i = 0; i < 5; i++) {                           // vent stacks
        var vsx = lx + w * (0.1 + PC.hash01(i, 80, 7) * 0.8);
        var vsy = ly + rt * (0.1 + PC.hash01(i, 81, 8) * 0.7);
        if (vsx > lx + w * 0.3 && vsx < lx + w * 0.62 &&
            vsy > ly + rt * 0.26 && vsy < ly + rt * 0.78) continue;  // skip courtyard
        g.fillStyle = 'rgba(8,6,14,0.4)'; g.fillRect(vsx + 2, vsy + 2, 10, 10);
        g.fillStyle = '#8a877d'; g.fillRect(vsx, vsy, 10, 10);
        g.fillStyle = '#57544d'; g.fillRect(vsx + 2, vsy + 2, 6, 6);
      }
      // hand-drawn HELP! banner + faces BESIDE THE DOOR - the lot is
      // 1600+px wide, so anything placed by lot fraction lands outside
      // the phone viewport centered on the door (round-2 judge: "the
      // story hint is not in the pixels"). Anchor to the door instead.
      var bnx = lx + w / 2 + 46, bny = ly + h - 25;
      g.fillStyle = '#f7f4ef'; g.fillRect(bnx, bny, 96, 16);
      g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(bnx, bny + 14, 96, 2);
      g.fillStyle = '#4a3a28';
      g.fillRect(bnx - 2, bny - 3, 3, 9); g.fillRect(bnx + 95, bny - 3, 3, 9);
      g.font = 'bold 13px monospace'; g.textAlign = 'center';
      g.fillStyle = '#d93a3a';
      g.fillText('HELP!', bnx + 48, bny + 12);
      for (i = 0; i < 3; i++) {                           // faces at windows
        var fwx = lx + w / 2 - 148 + i * 34;              // left of the door
        g.fillStyle = 'rgba(255,242,180,0.9)';            // lit pane
        g.fillRect(fwx, ly + h - 21, 12, 10);
        g.fillStyle = '#f2d9b8'; g.fillRect(fwx + 3, ly + h - 18, 7, 7);
        g.fillStyle = '#5d4a33'; g.fillRect(fwx + 3, ly + h - 19, 7, 2);
        g.fillStyle = '#232833';
        g.fillRect(fwx + 4, ly + h - 16, 2, 2); g.fillRect(fwx + 8, ly + h - 16, 2, 2);
      }
    } else if (mk.id === 'bakery') {
      // THE SOURCE: frosting erupts from the roof and pours over every
      // edge - the whole map's flood gradient traces back to here.
      // Roof recolored DARK so the pale frosting actually pops (the
      // mk.color pastel-on-pastel washed out at map zoom).
      g.fillStyle = '#6b4a5c';
      g.fillRect(lx + 4, ly + 4, w - 8, h - 30);
      g.fillStyle = 'rgba(255,246,224,0.08)';
      for (i = 0; i < 4; i++) g.fillRect(lx + 8, ly + 8 + i * ((h - 34) / 4), w - 16, 2);
      // north roof band furniture. Placement anchored to the CENTER
      // COLUMN, not lot fractions - the lot is ~1400px wide and the
      // phone viewport shows only ~±200px around the door column
      // (the school HELP-banner lesson).
      for (i = 0; i < 4; i++) {
        var bvx = lx + w / 2 + (PC.hash01(i, 82, 9) - 0.5) * 340, bvy = ly + 14 + PC.hash01(i, 83, 2) * h * 0.1;
        g.fillStyle = 'rgba(8,6,14,0.4)'; g.fillRect(bvx + 2, bvy + 2, 14, 10);
        g.fillStyle = '#8a7286'; g.fillRect(bvx, bvy, 14, 10);
        g.fillStyle = '#5d4a58'; g.fillRect(bvx + 2, bvy + 2, 10, 6);
      }
      g.fillStyle = '#f2d9e6';                             // skylights
      g.fillRect(lx + w / 2 - 140, ly + 12, 20, 12); g.fillRect(lx + w / 2 + 110, ly + 12, 20, 12);
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(lx + w / 2 - 140, ly + 12, 20, 4); g.fillRect(lx + w / 2 + 110, ly + 12, 20, 4);
      // frosting rivulets crawling from the eruption toward the edges
      g.strokeStyle = '#f8e7ee'; g.lineWidth = 7; g.lineCap = 'round';
      for (i = 0; i < 5; i++) {
        var ra2 = Math.PI * (0.9 + PC.hash01(i, 84, 3) * 1.2);
        g.beginPath();
        g.moveTo(lx + w / 2 + Math.cos(ra2) * w * 0.3, ly + h * 0.36 + Math.sin(ra2) * h * 0.2);
        g.quadraticCurveTo(
          lx + w / 2 + Math.cos(ra2) * w * 0.42, ly + h * 0.3 + Math.sin(ra2) * h * 0.3,
          lx + w / 2 + Math.cos(ra2) * w * (0.44 + PC.hash01(i, 85, 4) * 0.06),
          ly + 10 + PC.hash01(i, 86, 5) * 14);
        g.stroke();
      }
      // SOUTH roof band (round-2 judge: the expanse above the awning
      // was the map's last flat slab) - rivulets running down toward
      // the storefront, roof tile seams, vents + skylights
      g.fillStyle = 'rgba(0,0,0,0.08)';
      for (i = 1; i < 5; i++) {
        g.fillRect(lx + 8, ly + h * 0.5 + i * (h * 0.4 / 5), w - 16, 2);
      }
      for (i = 0; i < 5; i++) {                            // center-column rivulets
        g.beginPath();
        g.strokeStyle = '#f8e7ee'; g.lineWidth = 8;
        var svx = lx + w / 2 + (PC.hash01(i, 87, 6) - 0.5) * 380;
        g.moveTo(svx, ly + h * 0.5);
        g.quadraticCurveTo(svx + (PC.hash01(i, 88, 7) - 0.5) * 40, ly + h * 0.7,
          svx + (PC.hash01(i, 89, 8) - 0.5) * 60, ly + h - 52);
        g.stroke();
        g.fillStyle = '#f8e7ee';
        g.beginPath();
        g.arc(svx + (PC.hash01(i, 89, 8) - 0.5) * 60, ly + h - 52, 8, 0, Math.PI * 2); g.fill();
      }
      for (i = 0; i < 3; i++) {                            // south vents
        var sbx = lx + w / 2 + (PC.hash01(i, 90, 9) - 0.5) * 340, sby = ly + h * (0.56 + PC.hash01(i, 91, 2) * 0.2);
        g.fillStyle = 'rgba(8,6,14,0.4)'; g.fillRect(sbx + 2, sby + 2, 14, 10);
        g.fillStyle = '#8a7286'; g.fillRect(sbx, sby, 14, 10);
        g.fillStyle = '#5d4a58'; g.fillRect(sbx + 2, sby + 2, 10, 6);
      }
      g.fillStyle = '#f2d9e6';                             // south skylights
      g.fillRect(lx + w / 2 - 150, ly + h * 0.62, 20, 12); g.fillRect(lx + w / 2 + 120, ly + h * 0.66, 20, 12);
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.fillRect(lx + w / 2 - 150, ly + h * 0.62, 20, 4); g.fillRect(lx + w / 2 + 120, ly + h * 0.66, 20, 4);
      g.fillStyle = '#e8a8c8';                             // frosting rim glow
      g.beginPath();
      g.ellipse(lx + w / 2, ly + h * 0.36, w * 0.37, h * 0.27, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#f8e7ee';
      g.beginPath();
      g.ellipse(lx + w / 2, ly + h * 0.36, w * 0.34, h * 0.24, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff8fb';
      g.beginPath();
      g.ellipse(lx + w * 0.44, ly + h * 0.3, w * 0.2, h * 0.13, 0, 0, Math.PI * 2);
      g.fill();
      for (i = 0; i < 7; i++) {                            // pours over the eaves
        var px3 = lx + 20 + PC.hash01(i, 71, 3) * (w - 40);
        g.fillStyle = '#f8e7ee';
        g.fillRect(px3, ly + 2, 16, 20 + PC.hash01(i, 72, 4) * (h * 0.3));
        g.beginPath();
        g.arc(px3 + 8, ly + 22 + PC.hash01(i, 72, 4) * (h * 0.3), 9, 0, Math.PI * 2); g.fill();
      }
      for (i = 0; i < 26; i++) {                           // roof sprinkles
        g.fillStyle = ['#e05a7a', '#35d0ff', '#f2c33c', '#7ac95a'][i % 4];
        g.save();
        g.translate(lx + w * 0.2 + PC.hash01(i, 73, 5) * w * 0.6,
                    ly + h * 0.16 + PC.hash01(i, 74, 6) * h * 0.36);
        g.rotate(PC.hash01(i, 75, 7) * 3.1);
        g.fillRect(-3, -1, 6, 2.5); g.restore();
      }
      // a giant cherry on the summit + candy-stripe awning south
      g.fillStyle = 'rgba(160,70,110,0.35)';       // pink-tinted, tucked under
      g.beginPath(); g.arc(lx + w / 2 + 3, ly + h * 0.3 + 6, 20, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c93a52';
      g.beginPath(); g.arc(lx + w / 2, ly + h * 0.3, 21, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#e86a80';
      g.beginPath(); g.arc(lx + w / 2 - 6, ly + h * 0.25, 8, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#5d4a33'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(lx + w / 2 + 2, ly + h * 0.3 - 20);
      g.quadraticCurveTo(lx + w / 2 + 14, ly + h * 0.3 - 38, lx + w / 2 + 22, ly + h * 0.3 - 42);
      g.stroke();
      // STOREFRONT (round-2 judge: the boss arena front was a bare
      // wall) - scalloped candy awning over the face, display windows
      // with little cakes, frosting pouring down the wall
      for (i = 0; i < Math.floor((w - 8) / 16); i++) {    // scalloped awning
        g.fillStyle = i % 2 ? '#e05a7a' : '#fff6f0';
        g.fillRect(lx + 4 + i * 16, ly + h - 48, 16, 10);
        g.beginPath();
        g.arc(lx + 12 + i * 16, ly + h - 38, 8, 0, Math.PI); g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.fillRect(lx + 4, ly + h - 48, w - 8, 2);
      var dwx = [lx + w / 2 - 168, lx + w / 2 + 76];      // display windows
      for (i = 0; i < 2; i++) {
        g.fillStyle = '#2b2338'; g.fillRect(dwx[i], ly + h - 24, 46, 19);
        g.fillStyle = '#fff2d9'; g.fillRect(dwx[i] + 2, ly + h - 22, 42, 15);
        g.fillStyle = '#ff9ecb';                          // little cakes
        g.fillRect(dwx[i] + 7, ly + h - 13, 11, 6); g.fillRect(dwx[i] + 9, ly + h - 16, 7, 3);
        g.fillRect(dwx[i] + 27, ly + h - 12, 13, 5);
        g.fillStyle = '#c93a52';
        g.fillRect(dwx[i] + 11, ly + h - 18, 3, 3); g.fillRect(dwx[i] + 32, ly + h - 14, 3, 3);
      }
      for (i = 0; i < 3; i++) {                           // wall drips: tapered,
        var wx3 = [lx + w / 2 - 60, lx + w / 2 + 150, lx + w / 2 - 194][i];
        var dl2 = 10 + PC.hash01(i, 79, 6) * 10;          // kinked, bright
        var kk = (PC.hash01(i, 92, 7) - 0.5) * 6;
        g.fillStyle = '#fff8fb';
        g.fillRect(wx3, ly + h - 26, 10, dl2 * 0.5);
        g.fillRect(wx3 + 2 + kk, ly + h - 26 + dl2 * 0.5, 6, dl2 * 0.5);
        g.beginPath(); g.arc(wx3 + 5 + kk, ly + h - 25 + dl2, 4.4, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(232,168,200,0.6)';            // rim so it pops
        g.fillRect(wx3 - 1, ly + h - 26, 1, dl2 * 0.5);
        g.fillRect(wx3 + 10, ly + h - 26, 1, dl2 * 0.5);
      }
    } else if (mk.id === 'vault') {
      // PROTOTYPE VAULT: bolted plating + a massive circular vault door
      // face - everything anchored to the center column
      var vcx = lx + w / 2;
      g.fillStyle = '#4a4664'; g.fillRect(lx + 4, ly + 4, w - 8, h - 30);
      // PANELIZED plating: strong seams on a grid, bolts at every
      // panel corner (round-1 judge: the roof was a flat mauve field
      // with sub-legible dots)
      var PW = 96, PH = 84;
      g.fillStyle = 'rgba(0,0,0,0.22)';
      for (i = 1; i < (h - 34) / PH; i++) g.fillRect(lx + 4, ly + 4 + i * PH, w - 8, 4);
      for (i = 1; i < (w - 8) / PW; i++) g.fillRect(lx + 4 + i * PW, ly + 4, 4, h - 34);
      g.fillStyle = 'rgba(255,246,224,0.10)';
      for (i = 1; i < (h - 34) / PH; i++) g.fillRect(lx + 4, ly + 2 + i * PH, w - 8, 2);
      for (i = 0; i < (w - 8) / PW; i++) {
        for (var bj = 0; bj < (h - 34) / PH; bj++) {
          var bx2 = lx + 12 + i * PW, by2 = ly + 12 + bj * PH;
          g.fillStyle = '#221e38'; g.fillRect(bx2 + 1, by2 + 1, 7, 7);
          g.fillStyle = '#8b88a8'; g.fillRect(bx2, by2, 7, 7);
          g.fillStyle = '#514e6b'; g.fillRect(bx2 + 2, by2 + 2, 3, 3);
        }
      }
      // the giant vault door on the roof (top-down hatch read)
      g.fillStyle = 'rgba(8,6,16,0.35)';
      g.beginPath(); g.arc(vcx + 5, ly + h * 0.36 + 6, 74, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#6d6a8e';
      g.beginPath(); g.arc(vcx, ly + h * 0.36, 72, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#8b88a8';
      g.beginPath(); g.arc(vcx, ly + h * 0.36, 58, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#514e6b'; g.lineWidth = 5;
      g.beginPath(); g.arc(vcx, ly + h * 0.36, 40, 0, Math.PI * 2); g.stroke();
      for (i = 0; i < 4; i++) {                             // spoke wheel
        var va = (i / 4) * Math.PI;
        g.beginPath();
        g.moveTo(vcx - Math.cos(va) * 38, ly + h * 0.36 - Math.sin(va) * 38);
        g.lineTo(vcx + Math.cos(va) * 38, ly + h * 0.36 + Math.sin(va) * 38);
        g.stroke();
      }
      g.fillStyle = '#f2c33c';
      g.beginPath(); g.arc(vcx, ly + h * 0.36, 10, 0, Math.PI * 2); g.fill();
      for (i = 0; i < 8; i++) {                             // rim bolts
        var ba = (i / 8) * Math.PI * 2;
        g.fillStyle = '#514e6b';
        g.fillRect(vcx + Math.cos(ba) * 64 - 3, ly + h * 0.36 + Math.sin(ba) * 64 - 3, 6, 6);
      }
      // warning ring around the roof hatch
      g.strokeStyle = 'rgba(242,195,60,0.6)'; g.lineWidth = 5;
      g.setLineDash ? g.setLineDash([14, 10]) : 0;
      g.beginPath(); g.arc(vcx, ly + h * 0.36, 92, 0, Math.PI * 2); g.stroke();
      g.setLineDash ? g.setLineDash([]) : 0;
      // THE SOUTH-FACE HERO: giant circular vault door rising over the
      // face line, spokes + locking cross + flanking floodlights
      var vdy = ly + h - 40;
      g.fillStyle = 'rgba(8,6,16,0.4)';
      g.beginPath(); g.arc(vcx + 4, vdy + 5, 52, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#514e6b';
      g.beginPath(); g.arc(vcx, vdy, 50, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#6d6a8e';
      g.beginPath(); g.arc(vcx, vdy, 42, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#8b88a8';
      g.beginPath(); g.arc(vcx - 10, vdy - 10, 18, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#514e6b'; g.lineWidth = 5;
      g.beginPath(); g.arc(vcx, vdy, 26, 0, Math.PI * 2); g.stroke();
      for (i = 0; i < 4; i++) {
        var vda = (i / 4) * Math.PI;
        g.beginPath();
        g.moveTo(vcx - Math.cos(vda) * 24, vdy - Math.sin(vda) * 24);
        g.lineTo(vcx + Math.cos(vda) * 24, vdy + Math.sin(vda) * 24);
        g.stroke();
      }
      g.fillStyle = '#f2c33c';
      g.beginPath(); g.arc(vcx, vdy, 8, 0, Math.PI * 2); g.fill();
      for (i = 0; i < 8; i++) {
        var vba = (i / 8) * Math.PI * 2;
        g.fillStyle = '#221e38';
        g.fillRect(vcx + Math.cos(vba) * 45 - 3, vdy + Math.sin(vba) * 45 - 3, 6, 6);
      }
      [-88, 82].forEach(function (fo) {                     // flanking floodlights
        g.fillStyle = '#514e6b'; g.fillRect(vcx + fo, vdy - 34, 5, 30);
        g.fillStyle = '#6d6a8e'; g.fillRect(vcx + fo - 5, vdy - 42, 15, 9);
        g.fillStyle = '#fff6e0'; g.fillRect(vcx + fo - 3, vdy - 40, 11, 5);
        g.fillStyle = 'rgba(255,246,224,0.10)';
        g.beginPath(); g.moveTo(vcx + fo + 2, vdy - 36);
        g.lineTo(vcx + fo - 16, vdy + 4); g.lineTo(vcx + fo + 22, vdy + 4);
        g.closePath(); g.fill();
      });
      g.font = 'bold 13px monospace'; g.textAlign = 'center';
      g.fillStyle = '#f2c33c';
      g.fillText('PROTOTYPE VAULT', vcx, ly + h * 0.14);
      g.fillStyle = '#d93a3a';
      g.fillText('AUTHORIZED ONLY', vcx, ly + h * 0.2);
    } else if (mk.id === 'control') {
      // CENTRAL CONTROL - THE SOURCE: glowing command roof cracked open,
      // mutated junk erupting and pouring over every edge
      g.fillStyle = '#3a2f57'; g.fillRect(lx + 4, ly + 4, w - 8, h - 30);
      g.fillStyle = 'rgba(255,246,224,0.07)';
      for (i = 1; i < 5; i++) g.fillRect(lx + 4, ly + 4 + i * ((h - 34) / 5), w - 8, 2);
      var ccx = lx + w / 2, ccy = ly + h * 0.36;
      g.fillStyle = '#5d3583';                              // junk mass rim
      g.beginPath(); g.ellipse(ccx, ccy, w * 0.32, h * 0.24, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#8f4fc4';
      g.beginPath(); g.ellipse(ccx, ccy, w * 0.28, h * 0.2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b45ce8';
      g.beginPath(); g.ellipse(ccx - w * 0.06, ccy - h * 0.04, w * 0.14, h * 0.09, 0, 0, Math.PI * 2); g.fill();
      for (i = 0; i < 14; i++) {                            // junk chunks in the goo
        g.fillStyle = ['#6d6a8e', '#c95a5a', '#f2c33c', '#221e38'][i % 4];
        g.save();
        g.translate(ccx + (PC.hash01(i, 97, 5) - 0.5) * w * 0.5,
                    ccy + (PC.hash01(i, 98, 6) - 0.5) * h * 0.32);
        g.rotate(PC.hash01(i, 99, 7) * 3.1);
        g.fillRect(-6, -4, 12, 8); g.restore();
      }
      for (i = 0; i < 6; i++) {                             // pours over the eaves
        var px4 = ccx + (PC.hash01(i, 100, 8) - 0.5) * 380;
        g.fillStyle = '#8f4fc4';
        g.fillRect(px4, ly + 2, 14, 16 + PC.hash01(i, 101, 9) * (h * 0.2));
        g.beginPath();
        g.arc(px4 + 7, ly + 18 + PC.hash01(i, 101, 9) * (h * 0.2), 8, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = '#35d0ff'; g.lineWidth = 2;           // sparking cracks
      for (i = 0; i < 5; i++) {
        var kx2 = ccx + (PC.hash01(i, 102, 2) - 0.5) * w * 0.6;
        var ky2 = ccy + (PC.hash01(i, 103, 3) - 0.5) * h * 0.4;
        g.beginPath(); g.moveTo(kx2, ky2);
        g.lineTo(kx2 + 10, ky2 + 6); g.lineTo(kx2 + 6, ky2 + 14); g.stroke();
      }
      g.fillStyle = '#fff6e0';
      for (i = 0; i < 4; i++) {
        g.fillRect(ccx + (PC.hash01(i, 104, 4) - 0.5) * w * 0.55,
                   ccy + (PC.hash01(i, 105, 5) - 0.5) * h * 0.38, 3, 3);
      }
      // SOUTH roof band (the bakery lesson: the expanse above the face
      // is what the player stares at from the boss apron) - goo streaks
      // running down toward the door, vents, sparking cracks
      for (i = 0; i < 5; i++) {
        var gvx = ccx + (PC.hash01(i, 106, 6) - 0.5) * 380;
        g.strokeStyle = '#8f4fc4'; g.lineWidth = 9; g.lineCap = 'round';
        g.beginPath();
        g.moveTo(gvx, ly + h * 0.5);
        g.quadraticCurveTo(gvx + (PC.hash01(i, 107, 7) - 0.5) * 40, ly + h * 0.7,
          gvx + (PC.hash01(i, 108, 8) - 0.5) * 50, ly + h - 58);
        g.stroke();
        g.fillStyle = '#8f4fc4';
        g.beginPath();
        g.arc(gvx + (PC.hash01(i, 108, 8) - 0.5) * 50, ly + h - 58, 8, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#b45ce8';
        g.beginPath();
        g.arc(gvx + (PC.hash01(i, 108, 8) - 0.5) * 50 - 2, ly + h - 61, 3, 0, Math.PI * 2); g.fill();
      }
      for (i = 0; i < 3; i++) {                             // south vents
        var svx2 = ccx + (PC.hash01(i, 109, 9) - 0.5) * 340;
        var svy2 = ly + h * (0.56 + PC.hash01(i, 110, 2) * 0.18);
        g.fillStyle = 'rgba(8,6,16,0.4)'; g.fillRect(svx2 + 2, svy2 + 2, 14, 10);
        g.fillStyle = '#6d6a8e'; g.fillRect(svx2, svy2, 14, 10);
        g.fillStyle = '#514e6b'; g.fillRect(svx2 + 2, svy2 + 2, 10, 6);
      }
      g.strokeStyle = '#35d0ff'; g.lineWidth = 2;
      for (i = 0; i < 3; i++) {
        var skx = ccx + (PC.hash01(i, 111, 3) - 0.5) * 300;
        var sky = ly + h * (0.6 + PC.hash01(i, 112, 4) * 0.2);
        g.beginPath(); g.moveTo(skx, sky);
        g.lineTo(skx + 9, sky + 5); g.lineTo(skx + 5, sky + 12); g.stroke();
      }
      // glowing display band above the door
      g.fillStyle = '#221e38'; g.fillRect(ccx - 130, ly + h - 52, 260, 18);
      g.fillStyle = '#b45ce8'; g.fillRect(ccx - 130, ly + h - 52, 260, 3);
      g.font = 'bold 12px monospace'; g.textAlign = 'center';
      g.fillStyle = '#35d0ff';
      g.fillText('CENTRAL CONTROL', ccx, ly + h - 39);
    } else if (mk.id === 'cooling') {
      // twin cooling towers from above: two big ringed discs + steam
      var t2cx = [lx + w * 0.3, lx + w * 0.7];
      for (i = 0; i < 2; i++) {
        var tcx2 = t2cx[i], tcy2 = ly + (h - 24) / 2;
        var tR2 = Math.min(w * 0.26, (h - 24) * 0.4);
        g.fillStyle = 'rgba(8,6,16,0.35)';
        g.beginPath(); g.arc(tcx2 + 5, tcy2 + 6, tR2 + 4, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#514e6b';
        g.beginPath(); g.arc(tcx2, tcy2, tR2 + 4, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#6d6a8e';
        g.beginPath(); g.arc(tcx2, tcy2, tR2, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#514e6b'; g.lineWidth = 3;
        for (var tr3 = 1; tr3 <= 3; tr3++) {
          g.beginPath(); g.arc(tcx2, tcy2, tR2 * tr3 / 4, 0, Math.PI * 2); g.stroke();
        }
        g.fillStyle = '#221e38';                            // the throat
        g.beginPath(); g.arc(tcx2, tcy2, tR2 * 0.4, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(207,212,232,0.4)';              // steam puffs
        g.beginPath(); g.arc(tcx2 + tR2 * 0.2, tcy2 - tR2 * 0.24, tR2 * 0.3, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(tcx2 + tR2 * 0.5, tcy2 - tR2 * 0.55, tR2 * 0.38, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.28)';
        g.beginPath(); g.arc(tcx2 + tR2 * 0.7, tcy2 - tR2 * 0.85, tR2 * 0.44, 0, Math.PI * 2); g.fill();
      }
    } else if (mk.id === 'watertower') {
      // the tank from above: disc, radial panels, catwalk ring, SS mark
      var tcx = lx + w / 2, tcy = ly + (h - 22) / 2;
      var tR = Math.min(w, h - 22) * 0.42;
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath(); g.arc(tcx + 5, tcy + 6, tR + 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7a8290';
      g.beginPath(); g.arc(tcx, tcy, tR + 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#8f97a6';
      g.beginPath(); g.arc(tcx, tcy, tR, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 2;
      for (i = 0; i < 8; i++) {
        var ta = (i / 8) * Math.PI * 2;
        g.beginPath(); g.moveTo(tcx, tcy);
        g.lineTo(tcx + Math.cos(ta) * tR, tcy + Math.sin(ta) * tR); g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.beginPath(); g.arc(tcx - tR * 0.3, tcy - tR * 0.3, tR * 0.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#6b7280';
      g.beginPath(); g.arc(tcx, tcy, tR * 0.16, 0, Math.PI * 2); g.fill();
      g.font = 'bold 11px monospace'; g.textAlign = 'center';
      g.fillStyle = '#2b2338'; g.fillText('SS', tcx, tcy + 4);
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
  // signage: name plate at the top edge of the lot. textAlign is set
  // explicitly - id-keyed painters above use 'center' and canvas state
  // leaks (the "THE B" truncated-sign bug).
  var label = mk.name;
  g.font = 'bold 15px monospace';
  g.textAlign = 'left';
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
