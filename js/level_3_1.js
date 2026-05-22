// level_3_1.js - Day 3 Stage 1 "Forming Land" (the rocky-land half of Day 3).
// Rocky, mountainous platforming with stepped plateaus. No new mechanic.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 120, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function bricks(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '#'); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // segment 1: gentle start, growth block early
  ground(0, 15);
  sp('player', 3, 10);
  qb(8, 7, '?'); qb(10, 7, 'G');
  sp('walker', 7, 10);
  sp('core', 5, 9); sp('core', 11, 5);
  sp('core', 16, 7); sp('core', 17, 6); sp('core', 18, 7);

  // segment 2: rocky staircase up + down
  ground(19, 32);
  box(22, 10, 23, 13, 'X');
  box(25, 9, 27, 13, 'X');
  box(28, 8, 30, 13, 'X');
  bricks(24, 26, 7); bricks(28, 30, 6);
  sp('walker', 26, 8); sp('wisp', 29, 5);
  sp('core', 23, 9); sp('core', 26, 6); sp('core', 30, 5); sp('core', 32, 9);

  mover(33, 9, 36, 9, 0.02, 0);
  sp('core', 34, 7);

  // segment 3: rock labyrinth
  ground(37, 52);
  bricks(40, 42, 8); bricks(45, 48, 9);
  qb(43, 7, '?'); qb(44, 7, '?');
  sp('thrower', 47, 10);
  sp('walker', 50, 10);
  sp('core', 38, 9); sp('core', 43, 5); sp('core', 49, 6);
  sp('core', 53, 7); sp('core', 54, 6); sp('core', 55, 7);

  // segment 4: open canyon + flyer
  ground(56, 72);
  oneway(60, 63, 7);
  oneway(66, 69, 5);
  qb(68, 2, 'B');                          // light-blast block up high
  sp('wisp', 62, 6); sp('thrower', 70, 10);
  sp('core', 58, 9); sp('core', 61, 6); sp('core', 67, 4); sp('core', 68, 1);

  mover(73, 9, 76, 9, 0.022, 1.0);
  sp('core', 74, 7);

  // segment 5: high mountain plateau
  ground(77, 95);
  box(80, 7, 89, 13, 'X');                 // big plateau
  sp('walker', 84, 6); sp('walker', 88, 6);
  bricks(83, 86, 5);
  qb(87, 4, '?');
  sp('core', 81, 6); sp('core', 85, 4); sp('core', 92, 9);

  mover(96, 9, 99, 9, 0.02, 0.5);

  // final stretch + goal
  ground(100, 119);
  box(105, 10, 106, 13, 'X');
  box(108, 9, 109, 13, 'X');
  box(111, 8, 112, 13, 'X');
  box(115, 9, 117, 13, 'X');
  box(119, 0, 119, 13, 'X');
  sp('timepart', 116, 8);
  sp('core', 103, 9); sp('core', 108, 8); sp('core', 113, 9); sp('core', 116, 6);

  SDD.levels = SDD.levels || {};
  SDD.levels['3-1'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'FORMING LAND' };
})();
