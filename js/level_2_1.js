// level_2_1.js - Day 2 Stage 1 "The Firmament" (the sky half of Day 2).
// Same engine and helpers as Day 1; theme is elevated / aerial. Final art
// (sky tiles, cloud platforms) will swap in later via the sprites system.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  var W = 120, H = 14, GROUND = 11;

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

  // ---- segment 1: gentle aerial start ----
  ground(0, 15);
  sp('player', 3, 10);
  qb(8, 7, '?');                  // core block
  qb(10, 7, 'G');                 // growth power-up
  sp('walker', 7, 10);
  sp('core', 5, 9); sp('core', 12, 8);
  // pit 16-18 (3 tiles, jumpable)
  sp('core', 16, 7); sp('core', 17, 6); sp('core', 18, 7);

  // ---- segment 2: floating staircase up ----
  ground(19, 32);
  oneway(22, 24, 8);
  oneway(26, 28, 6);
  oneway(30, 32, 4);
  qb(31, 2, 'B');                 // light-blast power-up, high & tricky
  sp('wisp', 24, 6);
  sp('core', 23, 7); sp('core', 27, 5); sp('core', 31, 1);
  // pit 33-36 (4 tiles) with a horizontal mover
  mover(33, 9, 36, 9, 0.02, 0);
  sp('core', 35, 7);

  // ---- segment 3: elevated bricks + a thrower ----
  ground(37, 52);
  bricks(40, 43, 8);
  bricks(46, 49, 6);
  sp('thrower', 47, 10);
  qb(41, 5, '?'); qb(48, 3, '?');
  sp('core', 38, 9); sp('core', 42, 7); sp('core', 47, 5);
  // pit 53-55
  sp('core', 53, 7); sp('core', 54, 6); sp('core', 55, 7);

  // ---- segment 4: open sky with a flyer + walker ----
  ground(56, 72);
  box(60, 9, 62, 13, 'X');        // small plateau
  box(66, 8, 68, 13, 'X');        // higher plateau
  sp('walker', 64, 10);
  sp('wisp', 68, 6);
  sp('core', 58, 9); sp('core', 61, 8); sp('core', 67, 7); sp('core', 71, 9);
  // pit 73-76 (4 tiles) with mover
  mover(73, 9, 76, 9, 0.022, 1.0);
  sp('core', 74, 7);

  // ---- segment 5: rolling open sky ----
  ground(77, 95);
  qb(82, 7, '?'); qb(83, 7, '?');
  sp('walker', 86, 10);
  sp('thrower', 92, 10);
  sp('wisp', 89, 5);
  sp('core', 80, 9); sp('core', 84, 5); sp('core', 88, 8); sp('core', 93, 9);
  // pit 96-99 (4 tiles) with mover
  mover(96, 9, 99, 9, 0.02, 0.5);

  // ---- segment 6: approach to the goal ----
  ground(100, 119);
  box(105, 10, 106, 13, 'X');
  box(108, 9, 109, 13, 'X');
  box(111, 8, 112, 13, 'X');      // staircase up
  box(116, 9, 118, 13, 'X');      // pedestal
  box(119, 0, 119, 13, 'X');      // end wall
  sp('timepart', 117, 8);
  sp('core', 103, 9); sp('core', 107, 9); sp('core', 110, 8); sp('core', 114, 9); sp('core', 116, 6);

  SDD.levels = SDD.levels || {};
  SDD.levels['2-1'] = {
    width: W, height: H, ground: GROUND,
    tiles: t, spawns: spawns, movers: movers,
    name: 'THE FIRMAMENT',
    theme: 'sky'
  };
})();
