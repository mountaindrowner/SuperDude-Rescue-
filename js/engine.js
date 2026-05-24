// engine.js - constants, math helpers, tile map, collision and camera.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  SDD.C = {
    VIEW_W: 320, VIEW_H: 180, TILE: 16,
    GRAVITY: 0.36, MAX_FALL: 5.8,
    MOVE_ACCEL: 0.36, FRICTION: 0.30,
    MOVE_MAX_SMALL: 1.85, MOVE_MAX_BIG: 2.05,
    JUMP_SMALL: -6.5, JUMP_BIG: -7.0, JUMP_CUT: 0.42,
    COYOTE: 6, JUMP_BUFFER: 7,
    STOMP_BOUNCE: -5.0,
    INVULN_STEPS: 96
  };

  // ---- math ----
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function randRange(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ---- tile map ----
  var SOLID = { 'X': 1, '#': 1, 'U': 1, '?': 1, 'G': 1, 'B': 1 };
  var ONEWAY = { '=': 1 };
  var QBLOCK = { '?': 1, 'G': 1, 'B': 1 };

  function TileMap(grid) {
    this.grid = grid;            // array of arrays of single-char codes
    this.h = grid.length;
    this.w = grid[0].length;
    this.pxW = this.w * SDD.C.TILE;
    this.pxH = this.h * SDD.C.TILE;
  }
  TileMap.prototype.get = function (tx, ty) {
    if (ty < 0) return ' ';
    if (ty >= this.h) return ' ';            // below the map = open (pitfall)
    if (tx < 0 || tx >= this.w) return 'X';  // walls at the level edges
    return this.grid[ty][tx];
  };
  TileMap.prototype.set = function (tx, ty, code) {
    if (ty >= 0 && ty < this.h && tx >= 0 && tx < this.w) this.grid[ty][tx] = code;
  };
  TileMap.prototype.isSolid = function (tx, ty) { return !!SOLID[this.get(tx, ty)]; };
  TileMap.prototype.isOneWay = function (tx, ty) { return !!ONEWAY[this.get(tx, ty)]; };
  TileMap.prototype.isQ = function (tx, ty) { return !!QBLOCK[this.get(tx, ty)]; };

  // Move an entity by its velocity and resolve collisions against the map.
  // Entity needs: x, y, w, h, vx, vy. Sets e.onGround. Optional e.onHeadBump.
  function moveAndCollide(e, map) {
    var T = SDD.C.TILE;

    // --- horizontal ---
    e.x += e.vx;
    var top = Math.floor(e.y / T);
    var bot = Math.floor((e.y + e.h - 1) / T);
    var col, ty;
    if (e.vx > 0) {
      col = Math.floor((e.x + e.w - 1) / T);
      for (ty = top; ty <= bot; ty++) {
        if (map.isSolid(col, ty)) { e.x = col * T - e.w; e.vx = 0; e.hitWall = 1; break; }
      }
    } else if (e.vx < 0) {
      col = Math.floor(e.x / T);
      for (ty = top; ty <= bot; ty++) {
        if (map.isSolid(col, ty)) { e.x = (col + 1) * T; e.vx = 0; e.hitWall = -1; break; }
      }
    }

    // --- vertical ---
    var preBottom = e.y + e.h;
    e.y += e.vy;
    e.onGround = false;
    var lft = Math.floor(e.x / T);
    var rgt = Math.floor((e.x + e.w - 1) / T);
    var tx, row;
    if (e.vy > 0) {
      row = Math.floor((e.y + e.h - 1) / T);
      for (tx = lft; tx <= rgt; tx++) {
        var landSolid = map.isSolid(tx, row);
        // dropThrough: player pressed Down+A on a one-way platform.
        // Skip one-way landing checks for the next few frames so we
        // fall through cleanly.
        var landOne = map.isOneWay(tx, row) && preBottom <= row * T + 1 && !e.dropThrough;
        if (landSolid || landOne) { e.y = row * T - e.h; e.vy = 0; e.onGround = true; break; }
      }
    } else if (e.vy < 0) {
      row = Math.floor(e.y / T);
      for (tx = lft; tx <= rgt; tx++) {
        if (map.isSolid(tx, row)) {
          e.y = (row + 1) * T; e.vy = 0;
          if (e.onHeadBump) e.onHeadBump(tx, row, map.get(tx, row));
          break;
        }
      }
    }
    // Sub-pixel ground probe. Gravity adds <1px to vy each frame so when
    // an entity is sitting on ground its feet drift into the "air row"
    // above the tile and the vy>0 landing check fires for one frame then
    // misses the next. That flipped onGround every other frame, which
    // re-triggered Player.landT and locked Danny on the landing pose
    // instead of cycling the run animation. Probe one pixel below.
    if (!e.onGround && e.vy >= 0 && !e.dropThrough) {
      row = Math.floor((e.y + e.h) / T);
      for (tx = lft; tx <= rgt; tx++) {
        var probeSolid = map.isSolid(tx, row);
        var probeOne   = map.isOneWay && map.isOneWay(tx, row);
        if (probeSolid || probeOne) {
          e.y = row * T - e.h; e.vy = 0; e.onGround = true; break;
        }
      }
    }
  }

  // ---- camera ----
  function Camera() { this.x = 0; this.y = 0; }
  Camera.prototype.snap = function (target, level) {
    this.x = clamp(target.x + target.w / 2 - SDD.C.VIEW_W / 2, 0, Math.max(0, level.pxW - SDD.C.VIEW_W));
    this.y = clamp(target.y + target.h / 2 - SDD.C.VIEW_H / 2 - 12, 0, Math.max(0, level.pxH - SDD.C.VIEW_H));
  };
  Camera.prototype.follow = function (target, level) {
    var tx = target.x + target.w / 2 - SDD.C.VIEW_W / 2;
    var ty = target.y + target.h / 2 - SDD.C.VIEW_H / 2 - 12;
    this.x = lerp(this.x, tx, 0.16);
    this.y = lerp(this.y, ty, 0.12);
    this.x = clamp(this.x, 0, Math.max(0, level.pxW - SDD.C.VIEW_W));
    this.y = clamp(this.y, 0, Math.max(0, level.pxH - SDD.C.VIEW_H));
  };

  SDD.engine = {
    clamp: clamp, lerp: lerp, randRange: randRange, randInt: randInt, overlap: overlap,
    TileMap: TileMap, Camera: Camera, moveAndCollide: moveAndCollide
  };
})();
