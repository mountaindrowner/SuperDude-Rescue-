// level1.js - Day 1 "Light & Darkness" level data, built programmatically so
// tile coordinates stay consistent. Exports a tile grid + spawn lists; the
// level scene clones this and brings it to life.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  var W = 190, H = 14, GROUND = 11;

  var t = [];
  for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }

  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function bricks(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '#'); }
  function qb(x, y, ch) { setT(x, y, ch); }

  var spawns = [];
  function sp(type, tx, ty) { spawns.push({ type: type, tx: tx, ty: ty }); }
  var movers = [];
  function mover(tx, ty, tx1, ty1, spd, phase) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: phase || 0 });
  }

  // ---- segment 1: gentle start, the growth block, first pit ----
  ground(0, 18);
  sp('player', 3, 10);
  qb(11, 7, '?');
  qb(13, 7, 'G');                 // growth power-up, early and on the path
  sp('walker', 9, 10);
  sp('core', 7, 8); sp('core', 16, 9); sp('core', 13, 5);
  // pit 1 (cols 19-21)
  sp('core', 19, 7); sp('core', 20, 6); sp('core', 21, 7);

  // ---- segment 2 ----
  ground(22, 41);
  bricks(26, 28, 8);
  qb(31, 7, '?'); qb(32, 7, '?');
  sp('walker', 34, 10);
  sp('wisp', 30, 7);
  sp('core', 24, 9); sp('core', 27, 6); sp('core', 38, 9); sp('core', 33, 5);
  // pit 2 (cols 42-45) with a moving platform
  mover(42, 9, 45, 9, 0.02, 0);
  sp('core', 43, 7);

  // ---- segment 3: the high route + blast power block ----
  ground(46, 66);
  oneway(49, 52, 8);
  oneway(54, 57, 6);
  oneway(59, 62, 4);
  qb(60, 2, 'B');                 // light-blast power-up, high up and guarded
  sp('thrower', 56, 10);
  sp('core', 48, 9); sp('core', 50, 6); sp('core', 55, 4); sp('core', 60, 0);
  sp('core', 64, 9);
  // pit 3 (cols 67-69) with a rising platform
  mover(67, 8, 69, 10, 0.022, 0);

  // ---- segment 4: plateaus, a second (recovery) growth block ----
  ground(70, 95);
  box(73, 9, 76, 13, 'X');
  box(80, 8, 83, 13, 'X');
  sp('walker', 78, 7); sp('walker', 88, 10);
  sp('wisp', 86, 6);
  qb(89, 7, '?'); qb(90, 7, 'G');
  sp('core', 74, 7); sp('core', 81, 6); sp('core', 85, 9); sp('core', 92, 9);
  // pit 4 (cols 96-100, wide) with a moving platform
  mover(96, 9, 100, 9, 0.016, 0);
  sp('core', 98, 7);

  // ---- segment 5: tricky platforming staircase ----
  ground(101, 125);
  oneway(104, 106, 9);
  oneway(109, 111, 8);
  oneway(114, 116, 7);
  oneway(119, 121, 8);
  sp('walker', 103, 10);
  sp('wisp', 112, 5);
  sp('thrower', 124, 10);
  sp('core', 105, 7); sp('core', 110, 6); sp('core', 115, 5); sp('core', 120, 6);
  // pit 5 (cols 126-129)
  mover(126, 9, 129, 9, 0.02, 1.5);

  // ---- segment 6 ----
  ground(130, 160);
  qb(140, 6, '?'); qb(141, 6, '?'); qb(142, 6, '?');
  box(148, 10, 150, 13, 'X');
  sp('walker', 136, 10); sp('walker', 152, 10);
  sp('thrower', 146, 10);
  sp('wisp', 156, 6);
  sp('core', 134, 9); sp('core', 141, 4); sp('core', 149, 8); sp('core', 158, 9);
  // pit 6 (cols 161-163)
  mover(161, 9, 163, 9, 0.022, 0.7);

  // ---- segment 7: run-up staircase to the goal ----
  ground(164, 189);
  box(170, 10, 171, 13, 'X');
  box(173, 9, 174, 13, 'X');
  box(176, 8, 177, 13, 'X');
  box(184, 9, 186, 13, 'X');      // pedestal
  box(189, 0, 189, 13, 'X');      // end wall
  sp('timepart', 185, 8);
  sp('core', 167, 9); sp('core', 172, 8); sp('core', 175, 7); sp('core', 181, 9); sp('core', 183, 6);

  SDD.level1 = {
    width: W, height: H, ground: GROUND,
    tiles: t, spawns: spawns, movers: movers,
    name: 'LIGHT AND DARKNESS'
  };
})();
