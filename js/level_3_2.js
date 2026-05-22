// level_3_2.js - Day 3 Stage 2 "Vegetation". Forest with climbable VINES.
// New mechanic: hold UP on a vine tile to grab and climb; press JUMP to dismount.
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
  function vine(x, y0, y1) { for (var y = y0; y <= y1; y++) setT(x, y, 'V'); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // segment 1: leafy intro
  ground(0, 15);
  sp('player', 3, 10);
  qb(8, 7, '?'); qb(10, 7, 'G');
  sp('walker', 7, 10);
  sp('core', 5, 9); sp('core', 12, 5);

  // pit 16-18
  sp('core', 16, 7); sp('core', 17, 6); sp('core', 18, 7);

  // segment 2: stepped ground -> first vine to a one-way overhang
  ground(19, 30);
  bricks(22, 25, 8);
  sp('wisp', 24, 6);
  box(28, 9, 29, 13, 'X');
  sp('core', 21, 9); sp('core', 24, 5); sp('core', 28, 8);
  // VINE 1: spans from row 4 down to row 10, lets player reach a high oneway with cores
  vine(31, 4, 10);
  oneway(32, 37, 4);
  sp('core', 33, 3); sp('core', 35, 3); sp('core', 37, 3);

  // segment 3: drop back down, run across ground with a thrower
  ground(33, 50);
  sp('thrower', 44, 10);
  qb(40, 7, '?'); qb(41, 7, '?');
  sp('walker', 47, 10);
  sp('core', 38, 9); sp('core', 41, 5); sp('core', 48, 8);

  // pit 51-53 with mover
  mover(51, 9, 53, 9, 0.02, 0);
  sp('core', 52, 7);

  // segment 4: forest plateau + VINE 2 leading up to a hidden blast block
  ground(54, 72);
  box(57, 8, 60, 13, 'X');                  // small plateau
  box(64, 7, 68, 13, 'X');
  vine(70, 2, 10);                          // tall vine
  oneway(71, 75, 2);                        // high reward platform
  qb(73, 2, 'B');                           // light-blast power-up high up (must climb the vine)
  sp('walker', 60, 7); sp('wisp', 66, 5);
  sp('core', 58, 7); sp('core', 66, 6); sp('core', 71, 1); sp('core', 74, 1);

  // pit 73-76: actually we used 71-75 as high oneway above ground 54-72; ground resumes 76
  // (oneway at y2 is up in the sky; the ground gap is below as designed)
  mover(73, 10, 76, 10, 0.022, 0.6);

  // segment 5: forest floor crossing
  ground(77, 95);
  bricks(80, 83, 8); bricks(86, 88, 7);
  sp('thrower', 89, 10);
  sp('wisp', 84, 5);
  qb(82, 6, '?'); qb(83, 6, '?');
  sp('core', 78, 9); sp('core', 82, 4); sp('core', 87, 5); sp('core', 92, 8);

  // pit 96-99 mover
  mover(96, 9, 99, 9, 0.02, 0.4);

  // segment 6: VINE 3 + a high core trail to the goal
  ground(100, 129);
  box(104, 9, 105, 13, 'X');
  box(107, 8, 108, 13, 'X');
  vine(110, 3, 10);                         // last vine: top-of-canopy core trail
  oneway(111, 117, 3);
  sp('core', 112, 2); sp('core', 114, 2); sp('core', 116, 2);
  // pedestal + goal
  box(122, 9, 124, 13, 'X');
  box(129, 0, 129, 13, 'X');
  sp('timepart', 123, 8);
  sp('core', 102, 9); sp('core', 119, 9); sp('core', 121, 6); sp('core', 125, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['3-2'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'VEGETATION' };
})();
