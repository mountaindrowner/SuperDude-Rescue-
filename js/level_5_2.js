// level_5_2.js - Day 5 Stage 2 "The Seas". Underwater swimming section:
// Danny dives into a pool, swims through, surfaces and continues.
// Water tiles: 'W' = water body, '~' = water surface. Solid floor seals
// the bottom of each pool so the player never falls out of the world.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 140, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function bricks(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '#'); }
  function qb(x, y, ch) { setT(x, y, ch); }
  // pool: solid floor at row 13, water body rows 7-12, surface row 6
  function pool(x0, x1) {
    for (var x = x0; x <= x1; x++) {
      setT(x, 13, 'X');                       // floor
      for (var y = 7; y <= 12; y++) setT(x, y, 'W');
      setT(x, 6, '~');                        // surface
    }
  }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // beach: dry start
  ground(0, 22);
  sp('player', 3, 10);
  qb(8, 7, 'G'); qb(11, 7, '?');
  sp('walker', 7, 10);
  sp('core', 5, 9); sp('core', 13, 5);
  sp('core', 17, 7); sp('core', 19, 6); sp('core', 21, 8);

  // POOL 1: cols 23-44 (deep enough to swim through)
  pool(23, 44);
  // cores at varying depths inside the pool
  sp('core', 26, 8); sp('core', 30, 10); sp('core', 34, 9); sp('core', 38, 8);
  sp('core', 42, 10); sp('core', 32, 6); sp('core', 38, 6);

  // dry island
  ground(45, 62);
  sp('thrower', 55, 10);
  qb(50, 7, '?');
  bricks(52, 54, 8);
  sp('walker', 58, 10);
  sp('core', 47, 9); sp('core', 50, 5); sp('core', 57, 7);

  // POOL 2: cols 63-86 with a hidden blast power-up inside
  pool(63, 86);
  qb(70, 8, 'B');                              // light-blast under water
  sp('core', 66, 8); sp('core', 70, 9); sp('core', 74, 10); sp('core', 78, 7);
  sp('core', 82, 9); sp('core', 84, 8);

  // back on dry land
  ground(87, 109);
  box(90, 8, 93, 13, 'X');
  box(98, 7, 102, 13, 'X');
  sp('walker', 96, 7); sp('wisp', 100, 5);
  qb(101, 4, '?');
  sp('core', 91, 7); sp('core', 100, 4); sp('core', 106, 9);

  mover(110, 9, 113, 9, 0.022, 0.5);

  // final stretch + goal
  ground(114, 139);
  box(118, 10, 119, 13, 'X');
  box(121, 9, 122, 13, 'X');
  box(124, 8, 125, 13, 'X');
  box(130, 9, 132, 13, 'X');
  box(139, 0, 139, 13, 'X');
  sp('timepart', 131, 8);
  sp('core', 116, 9); sp('core', 124, 7); sp('core', 128, 9); sp('core', 134, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['5-2'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'THE SEAS', theme: 'seaside' };
})();
