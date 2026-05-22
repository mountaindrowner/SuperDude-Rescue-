// level_6_1.js - Day 6 Stage 1 "Wild Animals". Savanna/jungle platforming.
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
  var spawns = []; function sp(t_, x, y, k) { var o = { type: t_, tx: x, ty: y }; if (k) o.kind = k; spawns.push(o); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  ground(0, 16);
  sp('player', 3, 10);
  qb(8, 7, 'G'); qb(10, 7, '?');
  sp('walker', 7, 10); sp('walker', 13, 10);
  sp('core', 5, 9); sp('core', 11, 5); sp('core', 14, 8);

  sp('core', 17, 7); sp('core', 18, 6); sp('core', 19, 7);

  ground(20, 35);
  bricks(24, 27, 8);
  sp('wisp', 26, 6); sp('thrower', 32, 10);
  qb(29, 6, '?');
  sp('core', 23, 9); sp('core', 29, 4); sp('core', 33, 8);

  mover(36, 9, 39, 9, 0.02, 0);
  sp('core', 37, 7);

  ground(40, 58);
  box(43, 8, 46, 13, 'X');
  box(50, 7, 53, 13, 'X');
  oneway(55, 57, 5);
  qb(56, 2, 'B');
  sp('walker', 45, 7); sp('walker', 52, 6); sp('wisp', 55, 4);
  sp('core', 44, 7); sp('core', 51, 6); sp('core', 56, 1);

  mover(59, 9, 62, 9, 0.022, 0.7);

  ground(63, 80);
  box(66, 9, 67, 13, 'X');
  box(70, 8, 72, 13, 'X');
  box(75, 7, 77, 13, 'X');
  sp('thrower', 78, 10);
  sp('wisp', 73, 5);
  qb(71, 5, '?'); qb(76, 4, '?');
  sp('core', 68, 9); sp('core', 71, 4); sp('core', 76, 3); sp('core', 79, 8);

  mover(81, 9, 84, 9, 0.02, 0.4);

  ground(85, 99);
  bricks(88, 91, 8);
  sp('walker', 92, 10); sp('wisp', 95, 6);
  sp('core', 86, 9); sp('core', 90, 6); sp('core', 95, 5); sp('core', 98, 9);

  ground(100, 119);
  box(105, 10, 106, 13, 'X');
  box(108, 9, 109, 13, 'X');
  box(111, 8, 112, 13, 'X');
  box(115, 9, 117, 13, 'X');
  box(119, 0, 119, 13, 'X');
  sp('timepart', 116, 8);
  sp('core', 103, 9); sp('core', 110, 7); sp('core', 113, 9); sp('core', 116, 6);

  SDD.levels = SDD.levels || {};
  SDD.levels['6-1'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'WILD ANIMALS' };
})();
