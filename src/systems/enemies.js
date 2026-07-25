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
      phase: (i % 17) * 0.37,          // per-enemy wobble phase (ARTDNA 3)
      kbUntil: 0, kbx: 0, kby: 0, kbMult: 1,
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
    var cx = cam.worldView.centerX, cy = cam.worldView.centerY;
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
  e.kbUntil = 0;
  if (def) {
    e.spd = def.spd; e.hp = def.hp; e.dmg = def.dmg; e.xp = def.xp;
    e.frameA = def.key + '_walk_1'; e.frameB = def.key + '_walk_2';
    e.r = def.size / 2 - 2;
    e.kbMult = def.kbMult != null ? def.kbMult : 1;   // heavies 0.3, bosses 0
    e.still = def.still || null;
  }
  e.sprite.setFrame(e.frameA);
  this.liveCount++;
  return e;
};

PC.EnemySystem.prototype.update = function (dt, px, py) {
  this.animT += dt;
  var flip = Math.floor(this.animT * 6) % 2 === 1;   // shared 6fps flipbook
  var cam = this.scene.cameras.main;
  var x0 = cam.worldView.x - PC.CULL_MARGIN, x1 = cam.worldView.right + PC.CULL_MARGIN;
  var y0 = cam.worldView.y - PC.CULL_MARGIN, y1 = cam.worldView.bottom + PC.CULL_MARGIN;

  this.hash.clear();
  var now = this.scene.now || 0;
  var pool = this.pool;
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (!e.active) continue;
    var dx = px - e.x, dy = py - e.y;
    if (now < e.kbUntil) {
      // 120ms reversed-velocity knockback (ARTDNA 3) - half the game feel
      e.x += e.kbx * dt;
      e.y += e.kby * dt;
    } else {
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len > 1) {
        var m = e.spd * (now < e.slowUntil ? 0.45 : 1) * dt / len;
        e.x += dx * m;
        e.y += dy * m;
      }
    }
    // buildings block the swarm too
    var rs = PC.resolveCircle(e.x, e.y, e.r);
    e.x = rs.x; e.y = rs.y;
    this.hash.insert(e);
    var s = e.sprite;
    var vis = e.x > x0 && e.x < x1 && e.y > y0 && e.y < y1;
    s.visible = vis;
    if (vis) {
      s.x = e.x; s.y = e.y;
      s.setFrame(flip ? e.frameB : e.frameA);
      s.flipX = dx < 0;
      // THE wobble (ARTDNA 3, REQUIRED): sin rocking sells motion at 300 units
      s.rotation = Math.sin(this.animT * 6 + e.phase) * 0.06;
      // the WADDLE (Mark round 8: enemies are plain oversized food objects,
      // not monsters - a squash-stretch bounce makes an object walk)
      var sq = Math.sin(this.animT * 7 + e.phase * 2.3);
      s.scaleY = 1 + sq * 0.07;
      s.scaleX = 1 - sq * 0.045;
    }
  }

  // separation (ARTDNA 5, strengthened round 10: "still stacking too much").
  // Every same-cell PAIR shoves apart to their full combined radius, two
  // passes for firmness. Cell = 72px so buckets stay small; capped at 12
  // per bucket so a giant pile can't blow up the pair count.
  var keys = this.hash._usedKeys, buckets = this.hash.buckets;
  for (var pass = 0; pass < 2; pass++) {
    for (var ki = 0; ki < keys.length; ki++) {
      var b = buckets[keys[ki]];
      var n = b.length < 12 ? b.length : 12;
      for (var bi = 0; bi < n; bi++) {
        for (var bj = bi + 1; bj < n; bj++) {
          var e1 = b[bi], e2 = b[bj];
          var sx = e2.x - e1.x, sy = e2.y - e1.y;
          var want = (e1.r + e2.r) * 0.95;
          var d2s = sx * sx + sy * sy;
          if (d2s >= want * want) continue;
          var ds = Math.sqrt(d2s) || 0.01;
          var push = (want - ds) * 0.5 / ds;
          e1.x -= sx * push; e1.y -= sy * push;
          e2.x += sx * push; e2.y += sy * push;
        }
      }
    }
  }
};

// spawn n enemies in an off-screen ring around the camera center
PC.EnemySystem.prototype.spawnRing = function (n, def) {
  var cam = this.scene.cameras.main;
  var cx = cam.worldView.centerX, cy = cam.worldView.centerY;
  var R = 320;
  for (var i = 0; i < n; i++) {
    var a = (i / n) * Math.PI * 2;
    this.spawn(cx + Math.cos(a) * R, cy + Math.sin(a) * R, def);
  }
};
