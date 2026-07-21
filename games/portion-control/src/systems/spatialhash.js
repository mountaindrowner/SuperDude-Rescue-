// spatialhash.js - fixed-cell spatial hash (Perf Bible 3). Rebuilt every
// frame from live enemies; bullets and the player query only their 3x3
// neighborhood. Buckets are reused arrays (length reset, never reallocated)
// so a rebuild allocates nothing.
window.PC = window.PC || {};

PC.SpatialHash = function () {
  this.cell = PC.GRID_CELL;
  this.buckets = {};              // "cx,cy" -> array (persistent, reused)
  this._usedKeys = [];            // keys touched this frame, for cheap reset
};

PC.SpatialHash.prototype.clear = function () {
  var u = this._usedKeys;
  for (var i = 0; i < u.length; i++) this.buckets[u[i]].length = 0;
  u.length = 0;
};

PC.SpatialHash.prototype.insert = function (e) {
  var cx = Math.floor(e.x / this.cell), cy = Math.floor(e.y / this.cell);
  var k = cx + ',' + cy;
  var b = this.buckets[k];
  if (!b) { b = this.buckets[k] = []; }
  if (b.length === 0) this._usedKeys.push(k);
  b.push(e);
};

// visit every entity in the 3x3 neighborhood of (x, y). cb returns true to
// stop early (e.g. first contact found).
PC.SpatialHash.prototype.eachNear = function (x, y, cb) {
  var cx = Math.floor(x / this.cell), cy = Math.floor(y / this.cell);
  for (var oy = -1; oy <= 1; oy++) {
    for (var ox = -1; ox <= 1; ox++) {
      var b = this.buckets[(cx + ox) + ',' + (cy + oy)];
      if (!b) continue;
      for (var i = 0; i < b.length; i++) {
        if (cb(b[i])) return;
      }
    }
  }
};
