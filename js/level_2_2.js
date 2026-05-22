// level_2_2.js - Day 2 Stage 2 "The Waters Below" (the sea half of Day 2).
// Pit-heavy island-hopping over the water - lots of moving platforms, short
// safe stretches, watery vibes. Swimming proper comes on Day 5; here the
// water reads as pits/danger to keep mechanics consistent with Day 1.
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

  // ---- island 1: starting beach ----
  ground(0, 10);
  sp('player', 3, 10);
  qb(7, 7, 'G');
  sp('core', 5, 9); sp('core', 8, 8);
  // pit 11-13 (3 tiles, jumpable)
  sp('core', 11, 7); sp('core', 12, 6); sp('core', 13, 7);

  // ---- island 2 ----
  ground(14, 22);
  qb(17, 7, '?'); qb(18, 7, '?');
  sp('walker', 19, 10);
  sp('core', 15, 9); sp('core', 17, 5);
  // pit 23-26 (4 tiles) with mover
  mover(23, 9, 26, 9, 0.02, 0);
  sp('core', 24, 7);

  // ---- island 3: brick steps ----
  ground(27, 36);
  bricks(30, 33, 8);
  sp('wisp', 31, 6);
  sp('core', 28, 9); sp('core', 32, 7); sp('core', 34, 5);
  // pit 37-40 (4 tiles) with mover
  mover(37, 9, 40, 9, 0.022, 0.8);

  // ---- island 4: thrower guard ----
  ground(41, 50);
  sp('thrower', 46, 10);
  qb(43, 7, '?');
  box(48, 9, 49, 13, 'X');
  sp('core', 42, 9); sp('core', 44, 6); sp('core', 49, 8);
  // pit 51-53 (3 tiles, jumpable)
  sp('core', 51, 7); sp('core', 53, 7);

  // ---- island 5: high reward ----
  ground(54, 64);
  oneway(57, 59, 8);
  oneway(61, 63, 6);
  qb(62, 4, 'B');                 // light-blast power-up, high & tricky
  sp('walker', 56, 10);
  sp('wisp', 60, 5);
  sp('core', 58, 7); sp('core', 62, 3); sp('core', 63, 5);
  // pit 65-68 (4 tiles) with mover
  mover(65, 9, 68, 9, 0.02, 1.2);
  sp('core', 66, 7);

  // ---- island 6: open sea hop ----
  ground(69, 77);
  bricks(72, 74, 9);
  sp('thrower', 75, 10);
  sp('core', 70, 9); sp('core', 73, 8); sp('core', 76, 9);
  // pit 78-81 with mover
  mover(78, 9, 81, 9, 0.022, 0);

  // ---- island 7 ----
  ground(82, 92);
  sp('wisp', 86, 6);
  sp('walker', 88, 10);
  qb(89, 6, '?'); qb(90, 6, '?');
  sp('core', 84, 9); sp('core', 89, 4); sp('core', 91, 8);
  // pit 93-96 with mover
  mover(93, 9, 96, 9, 0.02, 0.4);

  // ---- final island: the lighthouse / goal ----
  ground(97, 119);
  box(103, 10, 104, 13, 'X');
  box(106, 9, 107, 13, 'X');
  box(109, 8, 110, 13, 'X');
  box(115, 9, 117, 13, 'X');      // pedestal
  box(119, 0, 119, 13, 'X');      // end wall
  sp('timepart', 116, 8);
  sp('core', 99, 9); sp('core', 105, 9); sp('core', 110, 7); sp('core', 113, 9); sp('core', 115, 6);

  SDD.levels = SDD.levels || {};
  SDD.levels['2-2'] = {
    width: W, height: H, ground: GROUND,
    tiles: t, spawns: spawns, movers: movers,
    name: 'THE WATERS BELOW'
  };
})();
