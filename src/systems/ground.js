// ground.js - endless district plane (COMPENDIUM 2.6). World is chunked at
// 512px; each chunk is ONE RenderTexture baked once from deterministic
// hashes: 16x16 tiles (base/var1/var2), sprinkled decals, flood decals and
// non-colliding props. Chunks are pooled and rebaked as the camera crosses
// them - zero per-frame draw cost beyond Phaser blitting a handful of RTs.
window.PC = window.PC || {};

PC.CHUNK = 512;                   // 16 tiles of 32px

// deterministic 0..1 hash from world ints + salt (stable across sessions)
PC.hash01 = function (x, y, salt) {
  var n = (Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663) ^ Math.imul(salt | 0, 83492791)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

PC.Ground = function (scene, district) {
  this.scene = scene;
  this.d = district || 1;
  this.live = {};                 // "cx,cy" -> RenderTexture
  this.pool = [];
  this.propKeys = PC.ASSETS.filter(function (a) {
    return a.key.indexOf('prop_d' + (district || 1) + '_') === 0;
  }).map(function (a) { return a.key; });
};

PC.Ground.prototype.update = function (cam) {
  var C = PC.CHUNK;
  var x0 = Math.floor((cam.scrollX - 64) / C), x1 = Math.floor((cam.scrollX + PC.RENDER.W + 64) / C);
  var y0 = Math.floor((cam.scrollY - 64) / C), y1 = Math.floor((cam.scrollY + PC.RENDER.H + 64) / C);
  var want = {};
  for (var cy = y0; cy <= y1; cy++) {
    for (var cx = x0; cx <= x1; cx++) {
      var k = cx + ',' + cy;
      want[k] = true;
      if (!this.live[k]) this.live[k] = this._bake(cx, cy);
    }
  }
  for (var key in this.live) {
    if (!want[key]) {
      var rt = this.live[key];
      rt.setVisible(false);
      this.pool.push(rt);
      delete this.live[key];
    }
  }
};

PC.Ground.prototype._bake = function (cx, cy) {
  var C = PC.CHUNK, d = this.d;
  var rt = this.pool.pop();
  if (!rt) {
    rt = this.scene.add.renderTexture(0, 0, C, C).setOrigin(0).setDepth(0);
  }
  rt.setPosition(cx * C, cy * C).setVisible(true);
  rt.clear();

  // tiles
  for (var ty = 0; ty < 16; ty++) {
    for (var tx = 0; tx < 16; tx++) {
      var wx = cx * 16 + tx, wy = cy * 16 + ty;
      var r = PC.hash01(wx, wy, 1);
      var frame = 'tile_d' + d + '_base';
      if (r > 0.90) frame = 'tile_d' + d + '_var2';
      else if (r > 0.72) frame = 'tile_d' + d + '_var1';
      rt.drawFrame('atlas', frame, tx * 32, ty * 32);
      var r2 = PC.hash01(wx, wy, 2);
      if (r2 < 0.05) {
        rt.drawFrame('atlas', 'tile_d' + d + '_decal' + (r2 < 0.025 ? 1 : 2), tx * 32, ty * 32);
      }
    }
  }
  // flood decals - D1 light (3 per chunk); density grows per district later
  var floods = 2 + d;
  for (var f = 0; f < floods; f++) {
    var fi = 1 + Math.floor(PC.hash01(cx, cy, 30 + f) * 6);
    rt.drawFrame('atlas', 'decal_flood_' + fi,
      Math.floor(PC.hash01(cx, cy, 40 + f) * (C - 32)),
      Math.floor(PC.hash01(cx, cy, 50 + f) * (C - 32)));
  }
  // props: up to 8 per chunk (COMPENDIUM 2.6), non-colliding decor
  var n = this.propKeys.length;
  if (n) {
    for (var i = 0; i < 8; i++) {
      if (PC.hash01(cx, cy, 60 + i) < 0.35) continue;   // density thinning
      var pk = this.propKeys[Math.floor(PC.hash01(cx, cy, 70 + i) * n) % n];
      rt.drawFrame('atlas', pk,
        Math.floor(PC.hash01(cx, cy, 80 + i) * (C - 96)),
        Math.floor(PC.hash01(cx, cy, 90 + i) * (C - 96)));
    }
  }
  return rt;
};
