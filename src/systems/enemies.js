// enemies.js - pooled enemy swarm (Perf Bible 1/2/4/7). Every enemy sprite
// is allocated at boot and recycled forever: no physics bodies, positions
// moved manually by dt, off-camera sprites hidden, at the cap the farthest
// off-screen enemy is recycled as the new spawn. Update loops are plain
// for-loops with zero allocations.
window.PC = window.PC || {};

PC.EnemySystem = function (scene) {
  this.scene = scene;
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  this.cap = isTouch ? PC.CAPS.ENEMY_MOBILE : PC.CAPS.ENEMY_DESKTOP;
  this.pool = [];
  this.liveCount = 0;
  this.hash = new PC.SpatialHash();
  this.animT = 0;
  for (var i = 0; i < this.cap; i++) {
    var spr = scene.add.image(0, 0, 'atlas', 'enemy_d1_fry_walk_1').setDepth(5).setVisible(false);
    this.pool.push({
      active: false, x: 0, y: 0, spd: 80, hp: 10, dmg: 6, xp: 1,
      frameA: 'enemy_d1_fry_walk_1', frameB: 'enemy_d1_fry_walk_2',
      r: 10, sprite: spr,
    });
  }
};

// spawn one enemy at world (x, y). At cap: recycle the farthest live enemy.
PC.EnemySystem.prototype.spawn = function (x, y, def) {
  var e = null, i;
  for (i = 0; i < this.pool.length; i++) {
    if (!this.pool[i].active) { e = this.pool[i]; break; }
  }
  if (!e) {
    var far = -1, farD = -1;
    var cam = this.scene.cameras.main;
    var cx = cam.scrollX + PC.RENDER.W / 2, cy = cam.scrollY + PC.RENDER.H / 2;
    for (i = 0; i < this.pool.length; i++) {
      var p = this.pool[i];
      var d = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy);
      if (d > farD) { farD = d; far = i; }
    }
    e = this.pool[far];
    this.liveCount--;
  }
  e.active = true;
  e.x = x; e.y = y;
  if (def) {
    e.spd = def.spd; e.hp = def.hp; e.dmg = def.dmg; e.xp = def.xp;
    e.frameA = def.key + '_walk_1'; e.frameB = def.key + '_walk_2';
    e.r = def.size / 2 - 2;
  }
  e.sprite.setFrame(e.frameA);
  this.liveCount++;
  return e;
};

PC.EnemySystem.prototype.update = function (dt, px, py) {
  this.animT += dt;
  var flip = Math.floor(this.animT * 6) % 2 === 1;   // shared 6fps flipbook
  var cam = this.scene.cameras.main;
  var x0 = cam.scrollX - PC.CULL_MARGIN, x1 = cam.scrollX + PC.RENDER.W + PC.CULL_MARGIN;
  var y0 = cam.scrollY - PC.CULL_MARGIN, y1 = cam.scrollY + PC.RENDER.H + PC.CULL_MARGIN;

  this.hash.clear();
  var pool = this.pool;
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (!e.active) continue;
    var dx = px - e.x, dy = py - e.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      var m = e.spd * dt / len;
      e.x += dx * m;
      e.y += dy * m;
    }
    this.hash.insert(e);
    var s = e.sprite;
    var vis = e.x > x0 && e.x < x1 && e.y > y0 && e.y < y1;
    s.visible = vis;
    if (vis) {
      s.x = e.x; s.y = e.y;
      s.setFrame(flip ? e.frameB : e.frameA);
      s.flipX = dx < 0;
    }
  }
};

// spawn n enemies in an off-screen ring around the camera center
PC.EnemySystem.prototype.spawnRing = function (n, def) {
  var cam = this.scene.cameras.main;
  var cx = cam.scrollX + PC.RENDER.W / 2, cy = cam.scrollY + PC.RENDER.H / 2;
  var R = 320;
  for (var i = 0; i < n; i++) {
    var a = (i / n) * Math.PI * 2;
    this.spawn(cx + Math.cos(a) * R, cy + Math.sin(a) * R, def);
  }
};
