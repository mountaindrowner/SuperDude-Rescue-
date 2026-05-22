// level_4_2.js - Day 4 Stage 2 "Moon & Stars". Low-gravity night cosmos:
// every jump goes much higher and falls slower, so the level uses bigger
// gaps, higher platforms and floating sky-islands.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 130, H = 14, GROUND = 11;
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

  // gentle starting island
  ground(0, 14);
  sp('player', 3, 10);
  qb(8, 7, 'G'); qb(11, 7, '?');
  sp('walker', 7, 10);
  sp('core', 5, 9); sp('core', 12, 5);

  // big jumpable gap thanks to low gravity (5 tiles, normally tough)
  sp('core', 15, 5); sp('core', 17, 3); sp('core', 19, 5);

  // mid platform high up - reachable only with low-gravity jumps
  ground(20, 32);
  oneway(23, 26, 5); oneway(28, 31, 3);
  qb(30, 0, 'B');
  sp('wisp', 27, 4);
  sp('core', 24, 4); sp('core', 30, 0);

  // long pit + mover; with low gravity the jump alone might also clear it
  mover(33, 9, 38, 9, 0.022, 0);
  sp('core', 35, 5); sp('core', 36, 3);

  // mountainous moon plateau
  ground(39, 60);
  box(43, 7, 48, 13, 'X');
  box(52, 5, 56, 13, 'X');
  sp('thrower', 58, 10);
  sp('walker', 45, 6); sp('wisp', 54, 3);
  qb(47, 4, '?'); qb(55, 2, '?');
  sp('core', 46, 4); sp('core', 53, 2); sp('core', 59, 9);

  // huge cosmic chasm with a mid mover
  mover(61, 7, 66, 7, 0.022, 0.7);
  sp('core', 63, 4); sp('core', 65, 2); sp('core', 67, 4);

  // floating star-islands
  ground(67, 78);
  oneway(70, 73, 5);
  oneway(75, 78, 3);
  sp('wisp', 72, 4); sp('walker', 76, 2);
  sp('core', 70, 4); sp('core', 77, 2);

  mover(79, 7, 84, 7, 0.02, 1.1);

  // long arc of cores in zero-g
  ground(85, 100);
  for (var i = 86; i <= 99; i += 3) spawns.push({ type: 'core', tx: i, ty: 4 });
  sp('thrower', 95, 10);
  qb(90, 6, '?'); qb(91, 6, '?');

  mover(101, 8, 106, 8, 0.022, 0.3);

  ground(107, 129);
  box(112, 9, 113, 13, 'X');
  box(115, 8, 116, 13, 'X');
  box(118, 7, 119, 13, 'X');
  box(123, 8, 125, 13, 'X');
  box(129, 0, 129, 13, 'X');
  sp('timepart', 124, 7);
  sp('core', 110, 9); sp('core', 119, 6); sp('core', 122, 7); sp('core', 126, 7);

  SDD.levels = SDD.levels || {};
  SDD.levels['4-2'] = {
    width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers,
    gravityScale: 0.5,
    name: 'MOON & STARS'
  };
})();
