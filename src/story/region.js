// region.js - STORY-2: the authored-map layer (docs/STORY_BUILD_PLAN.md).
// ONE rendering path (ENV_PIPELINE guardrail): the existing city-fabric
// painter (world.js paintChunkD1) paints every in-bounds chunk exactly as
// in patrol mode; the region OVERLAYS landmark plates, clears/replaces
// collision inside landmark lots, walls the map border, and paints void
// beyond it. Memory model unchanged (same 512px chunk slots).
window.PC = window.PC || {};

PC.BLOCK = 512;                   // 1 story block == 1 fabric street cell

PC.Region = function (def) {
  this.def = def;
  this.size = def.blocks * PC.BLOCK;             // world px, 0..size
  // landmark rects in world px (lot-inset so plates sit inside blocks,
  // clear of the road bands: fabric roads live at 192..320 per cell)
  this.marks = [];
  for (var i = 0; i < def.landmarks.length; i++) {
    var L = def.landmarks[i];
    var x = L.c0 * PC.BLOCK + 20;
    var y = L.r0 * PC.BLOCK + 20;
    var w = (L.c1 - L.c0 + 1) * PC.BLOCK - 40;
    var h = (L.r1 - L.r0 + 1) * PC.BLOCK - 40;
    this.marks.push({ id: L.id, name: L.name, open: !!L.open,
      color: L.color, accent: L.accent,
      x: x, y: y, w: w, h: h,
      cx: x + w / 2, cy: y + h / 2 });
  }
  this.spawnX = (def.spawn.c + 0.5) * PC.BLOCK + 96;
  this.spawnY = (def.spawn.r + 0.5) * PC.BLOCK + 96;
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
  } else {
    // ground fabric per map (v0.21.0): city streets or park lawn. Both
    // use the SAME block geometry + solids, so only the paint differs.
    var paint = (this.def.fabric === 'park' && PC.paintChunkPark)
      ? PC.paintChunkPark : PC.paintChunkD1;
    paint(scene, g, cx, cy);
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
  // landmark plates overlapping this chunk (full plate drawn, canvas clips)
  for (var i = 0; i < this.marks.length; i++) {
    var mk = this.marks[i];
    if (mk.x >= wx + C || mk.x + mk.w <= wx || mk.y >= wy + C || mk.y + mk.h <= wy) continue;
    this.paintLandmark(g, mk, mk.x - wx, mk.y - wy);
  }
};

// placeholder landmark plate, quality-styled per the layer law: cast
// shadow, slab body, roof lighting, rim, signage. Real PixelLab set
// pieces replace these plate-by-plate later with zero code changes.
PC.Region.prototype.paintLandmark = function (g, mk, lx, ly) {
  var w = mk.w, h = mk.h;
  if (mk.open) {
    // ground feature: inlaid plaza ring + accent centerpiece
    g.fillStyle = 'rgba(10,8,18,0.25)';
    g.fillRect(lx + 6, ly + 6, w, h);
    g.fillStyle = mk.color; g.fillRect(lx, ly, w, h);
    // no-flat law: slab seams + specks on the open ground
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (var sx2 = 0; sx2 <= w; sx2 += 64) g.fillRect(lx + sx2, ly, 1, h);
    for (var sy2 = 0; sy2 <= h; sy2 += 64) g.fillRect(lx, ly + sy2, w, 1);
    g.fillStyle = 'rgba(255,246,224,0.05)';
    for (var sp = 0; sp < 60; sp++) {
      g.fillRect(lx + PC.hash01(sp, 31, 7) * w, ly + PC.hash01(sp, 32, 8) * h, 2, 2);
    }
    g.strokeStyle = mk.accent; g.lineWidth = 3;
    g.globalAlpha = 0.55; g.strokeRect(lx + 8, ly + 8, w - 16, h - 16);
    g.globalAlpha = 1;
    g.beginPath(); g.arc(lx + w / 2, ly + h / 2, Math.min(w, h) * 0.18, 0, Math.PI * 2);
    g.strokeStyle = mk.accent; g.lineWidth = 4; g.stroke();
    g.fillStyle = mk.accent; g.globalAlpha = 0.25;
    g.beginPath(); g.arc(lx + w / 2, ly + h / 2, Math.min(w, h) * 0.10, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
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
