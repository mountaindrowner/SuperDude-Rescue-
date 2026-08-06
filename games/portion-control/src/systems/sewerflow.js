// sewerflow.js - LIVE WATER (v0.42.0, Mark: "a little bit of animation
// on the water trails... might be a hard ask"). The terrain chunks are
// cached canvases, so the painted gutters can't move - but a thin live
// overlay can (same trick as the Loop Line train). Every frame, for
// the tunnels near the camera, flow dashes drift along each gutter
// toward the Deep Sump, plus a soft shimmer on the Catwalk Maze water.
// VFX DNA rules: pooled-nothing (pure per-frame draw), two-clock math,
// per-line phase seeds so no two gutters pulse in sync.
window.PC = window.PC || {};
(function () {
  var CH = PC.CHUNK || 512;

  // the painted bridge decks (every 256px) stay dry - no flow over them
  function onBridge(v) {
    var m = ((v % 256) + 256) % 256;
    return m <= 18 || m >= 238;
  }

  PC.SewerFlow = function (scene) {
    this.scene = scene;
    this.g = scene.add.graphics().setDepth(5);   // above floor, below actors
  };

  PC.SewerFlow.prototype.update = function () {
    var scene = this.scene, g = this.g;
    g.clear();
    var L = scene.region && scene.region.layout;
    if (!L || !L._bendV) return;
    var cam = scene.cameras.main.worldView;
    var now = scene.now;
    var x0 = cam.x - 40, x1 = cam.right + 40;
    var y0 = cam.y - 40, y1 = cam.bottom + 40;

    // ---- gutter flow: dashes drifting along each sewer tunnel ----
    var FLOW = 46;                     // px/s drift
    var SPACING = 88;
    var c, r, k, t;
    for (c = 1; c < L.blocks; c += 2) {
      if (c === 1 || c === L.blocks - 1) continue;         // ring = rails
      var vx = c * CH + CH / 2;
      if (vx + 140 < x0 || vx - 140 > x1) continue;
      var phase = ((now * FLOW + c * 37) % SPACING);
      for (t = y0 - SPACING; t < y1 + SPACING; t += SPACING) {
        var dy = t + phase;
        if (dy < y0 || dy > y1) continue;
        if (onBridge(dy)) continue;              // dry stone crossing
        var bx = vx + L._bendV(c, dy);
        if (!L.carvedAt(bx, dy)) continue;
        var wob = Math.sin(now * 3 + c + dy * 0.02);
        g.fillStyle(0x35d0ff, 0.22 + 0.1 * wob);
        g.fillRect(bx - 2, dy, 4, 14);
        g.fillStyle(0xffffff, 0.10 + 0.06 * wob);
        g.fillRect(bx - 1, dy + 3, 2, 6);
      }
    }
    for (r = 1; r < L.blocks; r += 2) {
      if (r === 1 || r === L.blocks - 1) continue;
      var vy = r * CH + CH / 2;
      if (vy + 140 < y0 || vy - 140 > y1) continue;
      var phase2 = ((now * FLOW + r * 53) % SPACING);
      for (t = x0 - SPACING; t < x1 + SPACING; t += SPACING) {
        var dx = t + phase2;
        if (dx < x0 || dx > x1) continue;
        if (onBridge(dx)) continue;
        var by = vy + L._bendH(r, dx);
        if (!L.carvedAt(dx, by)) continue;
        var wob2 = Math.sin(now * 3 + r + dx * 0.02);
        g.fillStyle(0x35d0ff, 0.22 + 0.1 * wob2);
        g.fillRect(dx, by - 2, 14, 4);
        g.fillStyle(0xffffff, 0.10 + 0.06 * wob2);
        g.fillRect(dx + 3, by - 1, 6, 2);
      }
    }

    // ---- catwalk water shimmer: drifting glints on the dark water ----
    var cat = null;
    for (var mi = 0; mi < L.marks.length; mi++) {
      if (L.marks[mi].id === 'catwalk') { cat = L.marks[mi]; break; }
    }
    if (cat && cat.x < x1 && cat.x + cat.w > x0 && cat.y < y1 && cat.y + cat.h > y0) {
      for (k = 0; k < 14; k++) {
        var sx2 = cat.x + ((k * 731 + now * 18) % cat.w);
        var sy2 = cat.y + ((k * 977) % cat.h);
        if (sx2 < x0 || sx2 > x1 || sy2 < y0 || sy2 > y1) continue;
        if (L.carvedAt(sx2, sy2)) continue;      // planks stay dry (v0.43.0)
        var tw2 = 0.5 + 0.5 * Math.sin(now * 2.2 + k * 1.7);
        g.fillStyle(0x35d0ff, 0.10 + 0.12 * tw2);
        g.fillRect(sx2, sy2, 10 + 8 * tw2, 2);
      }
    }

    // ---- fungal spore motes: slow-drifting green flecks ----
    var fun = null;
    for (var mj = 0; mj < L.marks.length; mj++) {
      if (L.marks[mj].id === 'fungal') { fun = L.marks[mj]; break; }
    }
    if (fun && fun.x < x1 && fun.x + fun.w > x0 && fun.y < y1 && fun.y + fun.h > y0) {
      for (k = 0; k < 12; k++) {
        var fx2 = fun.x + ((k * 613) % fun.w) + Math.sin(now * 0.7 + k) * 16;
        var fy2 = fun.y + ((k * 419 - now * 9) % fun.h + fun.h) % fun.h;
        if (fx2 < x0 || fx2 > x1 || fy2 < y0 || fy2 > y1) continue;
        var pl = 0.5 + 0.5 * Math.sin(now * 1.9 + k * 2.3);
        g.fillStyle(0xa8e04a, 0.25 + 0.3 * pl);
        g.fillRect(fx2, fy2, 2 + pl, 2 + pl);
      }
    }
  };

  PC.SewerFlow.prototype.destroy = function () { this.g.destroy(); };
})();
