// gems.js - pooled XP gems (Perf Bible 1/4). Idle until the player's
// pickup radius reaches them, then vacuum in with acceleration. At the cap
// the farthest gem's value merges into the nearest live gem (VS-style, XP
// is never lost) and the frame upgrades small -> med -> gold by value.
window.PC = window.PC || {};

PC.GemSystem = function (scene, onCollect) {
  this.scene = scene;
  this.onCollect = onCollect;
  this.pool = [];
  for (var i = 0; i < PC.CAPS.GEMS; i++) {
    this.pool.push({
      active: false, x: 0, y: 0, v: 1, fly: false, spd: 0,
      sprite: scene.add.image(0, 0, 'atlas', 'gem_small').setDepth(3).setVisible(false),
    });
  }
};

function gemFrame(v) {
  return v >= PC.XP.GEM_GOLD ? 'gem_gold' : (v >= PC.XP.GEM_MED ? 'gem_med' : 'gem_small');
}

PC.GemSystem.prototype.spawn = function (x, y, v) {
  var g = null, i;
  for (i = 0; i < this.pool.length; i++) {
    if (!this.pool[i].active) { g = this.pool[i]; break; }
  }
  if (!g) {
    // merge: fold the farthest gem into its nearest live neighbor
    var far = null, farD = -1;
    var px = this.scene.px, py = this.scene.py;
    for (i = 0; i < this.pool.length; i++) {
      var p = this.pool[i];
      var d = (p.x - px) * (p.x - px) + (p.y - py) * (p.y - py);
      if (d > farD) { farD = d; far = p; }
    }
    var near = null, nearD = 1e18;
    for (i = 0; i < this.pool.length; i++) {
      var q = this.pool[i];
      if (q === far) continue;
      var d2 = (q.x - far.x) * (q.x - far.x) + (q.y - far.y) * (q.y - far.y);
      if (d2 < nearD) { nearD = d2; near = q; }
    }
    if (near) { near.v += far.v; near.sprite.setFrame(gemFrame(near.v)); }
    g = far;
  }
  g.active = true; g.x = x; g.y = y; g.v = v || 1; g.fly = false; g.spd = 0;
  g.sprite.setFrame(gemFrame(g.v)).setPosition(x, y).setVisible(true);
};

PC.GemSystem.prototype.update = function (dt, px, py, pickupR) {
  this._shT = (this._shT || 0) + dt;
  var sh = this._shT;
  var r2 = pickupR * pickupR;
  var pool = this.pool;
  for (var i = 0; i < pool.length; i++) {
    var g = pool[i];
    if (!g.active) continue;
    g.sprite.setScale(1 + 0.12 * Math.sin(sh * 5 + i * 1.7));   // shimmer
    var dx = px - g.x, dy = py - g.y;
    var d2 = dx * dx + dy * dy;
    if (!g.fly && d2 < r2) { g.fly = true; g.spd = 120; }
    if (g.fly) {
      var d = Math.sqrt(d2) || 1;
      g.spd += 900 * dt;
      g.x += (dx / d) * g.spd * dt;
      g.y += (dy / d) * g.spd * dt;
      if (d < 12) {
        g.active = false;
        g.sprite.setVisible(false);
        this.onCollect(g.v);
        continue;
      }
      g.sprite.setPosition(g.x, g.y);
    }
  }
};
