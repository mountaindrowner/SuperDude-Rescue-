// level_2_1.js - Day 2-1 "THE FIRMAMENT" (Pass 3 redesign, ~240 tiles).
// Signature mechanic: stacked one-way cloud ladders (vertical climbing
// without vines). Teach: one cloud step -> Test: staircase -> Twist:
// narrow vertical column with a thrower below -> Reward: high core
// trail and a sky-high blast power-up.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 240, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // ============== TEACH (0-50): one cloud step at a time ==============
  ground(0, 30);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9); sp('core', 12, 9);
  qb(15, 7, '?');
  // First single one-way "cloud" floating above
  oneway(18, 21, 8);
  sp('core', 19, 6); sp('core', 20, 6);
  sp('walker', 24, 10);
  sp('core', 27, 9);

  // small gap then a TWO-step ladder
  sp('core', 31, 8); sp('core', 32, 7);
  ground(34, 70);
  oneway(38, 41, 9);
  oneway(43, 46, 7);
  sp('core', 39, 7); sp('core', 44, 5);
  sp('walker', 50, 10);
  sp('wisp', 55, 6);
  sp('core', 53, 9); sp('core', 58, 7);

  // ============== TEST (50-115): full cloud staircases ==============
  oneway(60, 63, 9);
  oneway(66, 69, 7);
  oneway(72, 75, 5);
  sp('core', 61, 7); sp('core', 67, 5); sp('core', 73, 3);
  qb(73, 1, '?');

  ground(76, 100);
  sp('thrower', 84, 10);
  sp('wisp', 80, 6); sp('wisp', 92, 4);
  sp('core', 78, 9); sp('core', 88, 9); sp('core', 96, 9);

  // descending 3-step
  oneway(102, 105, 4);
  oneway(108, 111, 6);
  oneway(114, 117, 8);
  sp('walker', 116, 10);
  sp('core', 103, 2); sp('core', 109, 4); sp('core', 115, 6);

  // ============== TWIST (115-160): narrow vertical column ==============
  ground(120, 160);
  // wall splits the path - climb a column of one-ways on the left side
  box(140, 0, 142, 13, 'X');
  oneway(133, 138, 9);
  oneway(133, 138, 7);
  oneway(133, 138, 5);
  oneway(133, 138, 3);
  oneway(143, 148, 3);
  oneway(143, 148, 5);
  oneway(143, 148, 7);
  oneway(143, 148, 9);
  sp('thrower', 137, 10);
  sp('wisp', 135, 6); sp('wisp', 145, 4);
  sp('core', 135, 8); sp('core', 135, 6); sp('core', 135, 4); sp('core', 135, 2);
  sp('core', 145, 2); sp('core', 145, 4); sp('core', 145, 6); sp('core', 145, 8);
  qb(135, 1, 'B');                                          // blast at the top of the tower

  sp('walker', 152, 10); sp('walker', 158, 10);
  sp('core', 150, 9); sp('core', 154, 9); sp('core', 158, 9);

  // ============== REWARD (160-239): sky high-route to goal ==============
  mover(161, 9, 165, 9, 0.022, 0);
  sp('core', 163, 7);

  ground(166, 200);
  oneway(170, 173, 5);
  oneway(176, 179, 3);
  oneway(182, 185, 5);
  oneway(188, 191, 7);
  oneway(194, 197, 5);
  sp('core', 171, 3); sp('core', 177, 1); sp('core', 183, 3);
  sp('core', 189, 5); sp('core', 195, 3);
  sp('thrower', 175, 10); sp('thrower', 192, 10);
  sp('wisp', 184, 2); sp('wisp', 194, 1);

  mover(201, 10, 204, 5, 0.024, 0);
  sp('core', 202, 7); sp('core', 203, 4);

  ground(206, 239);
  box(212, 9, 214, 13, 'X');
  box(217, 8, 219, 13, 'X');
  box(222, 7, 224, 13, 'X');
  box(228, 8, 232, 13, 'X');                               // goal pedestal
  box(239, 0, 239, 13, 'X');
  sp('timepart', 230, 7);
  sp('walker', 210, 10); sp('wisp', 220, 4);
  sp('core', 208, 9); sp('core', 213, 7); sp('core', 218, 6);
  sp('core', 223, 5); sp('core', 230, 5); sp('core', 234, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['2-1'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'THE FIRMAMENT', theme: 'sky' };
})();
