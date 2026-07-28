// ground.js - endless painted district. Chunks are 512px canvases painted
// by the world painter (world.js) - the Adventure City approach: structured
// streets, world-keyed detail, invisible chunk borders. Canvases + their
// textures live in a fixed slot pool: zero allocation churn while walking.
window.PC = window.PC || {};

PC.CHUNK = 512;

// deterministic 0..1 hash from world ints + salt (stable across sessions)
PC.hash01 = function (x, y, salt) {
  var n = (Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663) ^ Math.imul(salt | 0, 83492791)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

PC.Ground = function (scene, district, painter) {
  this.scene = scene;
  this.d = district || 1;
  this.painter = painter || PC.paintChunkD1;   // region maps swap this in
  this.live = {};                 // "cx,cy" -> slot
  this.slots = [];
  for (var i = 0; i < 12; i++) {
    var canvas = document.createElement('canvas');
    canvas.width = PC.CHUNK; canvas.height = PC.CHUNK;
    var key = 'pc_chunk_' + i;
    // textures are GAME-global: on scene restart the key still exists and
    // addCanvas would silently no-op, leaving images bound to the previous
    // run's stale canvases (the "floating building block" artifact)
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
    this.slots.push({
      key: key, canvas: canvas, inUse: false,
      img: scene.add.image(0, 0, key).setOrigin(0).setDepth(0).setVisible(false),
    });
  }
};

PC.Ground.prototype.update = function (cam) {
  var C = PC.CHUNK;
  var x0 = Math.floor((cam.worldView.x - 64) / C), x1 = Math.floor((cam.worldView.right + 64) / C);
  var y0 = Math.floor((cam.worldView.y - 64) / C), y1 = Math.floor((cam.worldView.bottom + 64) / C);
  var want = {}, k;
  for (var cy = y0; cy <= y1; cy++) {
    for (var cx = x0; cx <= x1; cx++) {
      want[cx + ',' + cy] = true;
    }
  }
  // release chunks that scrolled away
  for (k in this.live) {
    if (!want[k]) {
      var s = this.live[k];
      s.inUse = false;
      s.img.setVisible(false);
      delete this.live[k];
    }
  }
  // bake newly needed chunks into free slots
  for (k in want) {
    if (this.live[k]) continue;
    var free = null;
    for (var i = 0; i < this.slots.length; i++) {
      if (!this.slots[i].inUse) { free = this.slots[i]; break; }
    }
    if (!free) continue;                       // margin guarantees enough slots
    var parts = k.split(',');
    this._bake(free, parseInt(parts[0], 10), parseInt(parts[1], 10));
    this.live[k] = free;
  }
};

PC.Ground.prototype._bake = function (slot, cx, cy) {
  var g = slot.canvas.getContext('2d');
  g.clearRect(0, 0, PC.CHUNK, PC.CHUNK);
  this.painter(this.scene, g, cx, cy);
  var tex = this.scene.textures.get(slot.key);
  if (tex && tex.refresh) tex.refresh();       // push canvas -> GPU
  slot.inUse = true;
  slot.img.setPosition(cx * PC.CHUNK, cy * PC.CHUNK).setVisible(true);
};

// ---- collision against building solids (world.js chunkSolids) ----
// Circle vs axis-aligned rects; resolves by least-penetration axis.
PC.resolveCircle = function (x, y, r) {
  var C = PC.CHUNK;
  var cx0 = Math.floor((x - r) / C), cx1 = Math.floor((x + r) / C);
  var cy0 = Math.floor((y - r) / C), cy1 = Math.floor((y + r) / C);
  for (var cy = cy0; cy <= cy1; cy++) {
    for (var cx = cx0; cx <= cx1; cx++) {
      var solids = PC.chunkSolids(cx, cy);
      for (var i = 0; i < solids.length; i++) {
        var s = solids[i];
        var nx = Math.max(s.x, Math.min(x, s.x + s.w));
        var ny = Math.max(s.y, Math.min(y, s.y + s.h));
        var dx = x - nx, dy = y - ny;
        var d2 = dx * dx + dy * dy;
        if (d2 >= r * r) continue;
        if (d2 > 0.0001) {
          var d = Math.sqrt(d2), push = (r - d) / d;
          x += dx * push; y += dy * push;
        } else {
          // center inside the rect: exit along the nearest face
          var left = x - s.x, right = s.x + s.w - x;
          var top = y - s.y, bot = s.y + s.h - y;
          var m = Math.min(left, right, top, bot);
          if (m === left) x = s.x - r;
          else if (m === right) x = s.x + s.w + r;
          else if (m === top) y = s.y - r;
          else y = s.y + s.h + r;
        }
      }
    }
  }
  return { x: x, y: y };
};
