// level_4_1.js - Day 4 Stage 1 "The Sun" (the bright daylight half of Day 4).
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

  ground(0, 14);
  sp('player', 3, 10);
  qb(8, 7, 'G'); qb(10, 7, '?');
  sp('walker', 7, 10);
  sp('core', 5, 9); sp('core', 11, 5);
  sp('core', 15, 7); sp('core', 16, 6); sp('core', 17, 7);

  ground(18, 32);
  oneway(21, 24, 8); oneway(26, 29, 6);
  sp('wisp', 25, 5);
  qb(28, 3, '?');
  sp('core', 22, 7); sp('core', 27, 5); sp('core', 28, 2);

  mover(33, 9, 36, 9, 0.02, 0);
  sp('core', 34, 7);

  ground(37, 54);
  bricks(40, 43, 8);
  oneway(45, 48, 6);
  qb(46, 3, 'B');                           // light-blast power-up
  sp('thrower', 50, 10);
  sp('walker', 42, 7);
  sp('core', 41, 5); sp('core', 46, 4); sp('core', 51, 8);

  mover(55, 9, 58, 9, 0.022, 0.8);
  sp('core', 56, 7);

  ground(59, 78);
  box(62, 8, 66, 13, 'X');
  oneway(68, 72, 5);
  sp('walker', 64, 7); sp('wisp', 70, 4);
  qb(63, 6, '?'); qb(70, 3, '?');
  sp('core', 63, 5); sp('core', 70, 2); sp('core', 75, 9);

  mover(79, 9, 82, 9, 0.02, 0.4);

  ground(83, 99);
  box(85, 7, 90, 13, 'X');
  bricks(92, 95, 8);
  sp('thrower', 96, 10);
  sp('walker', 88, 6);
  sp('core', 86, 6); sp('core', 93, 7); sp('core', 97, 9);

  ground(100, 119);
  box(105, 10, 106, 13, 'X');
  box(108, 9, 109, 13, 'X');
  box(111, 8, 112, 13, 'X');
  box(115, 9, 117, 13, 'X');
  box(119, 0, 119, 13, 'X');
  sp('timepart', 116, 8);
  sp('core', 103, 9); sp('core', 110, 7); sp('core', 113, 9); sp('core', 116, 6);

  SDD.levels = SDD.levels || {};
  SDD.levels['4-1'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'THE SUN', theme: 'sunlit' };
})();
