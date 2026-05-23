// level_2_2.js - Day 2-2 "THE WATERS BELOW" (Pass 3 redesign, ~240 tiles).
// Signature mechanic: timed moving platforms over wide water gaps -
// rhythm jumps. Teach: 1 bobbing platform -> Test: chain of 3 ->
// Twist: rising + falling platforms alternating -> Reward: high
// flying-leap finale.
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
  // shallow water in the gaps (visual only - level still uses pit physics)
  function water(x0, x1) {
    for (var x = x0; x <= x1; x++) {
      setT(x, 13, 'W');
    }
  }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // ============== TEACH (0-55): solid beach, 1 bobbing platform ==============
  ground(0, 28);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  qb(13, 7, 'G');
  sp('walker', 18, 10);
  sp('core', 16, 9); sp('core', 22, 9); sp('core', 26, 9);

  // first water gap with ONE bobbing platform (visual water at bottom)
  water(29, 36);
  mover(30, 9, 35, 9, 0.024, 0);
  sp('core', 32, 7);

  ground(37, 55);
  sp('walker', 42, 10);
  sp('wisp', 48, 6);
  qb(50, 7, '?');
  sp('core', 39, 9); sp('core', 45, 9); sp('core', 50, 5); sp('core', 53, 9);

  // ============== TEST (55-130): chains of bobbing platforms ==============
  // chain of 3 platforms in different phases
  water(56, 80);
  mover(57, 9, 62, 9, 0.024, 0);
  mover(64, 9, 69, 9, 0.024, 1.4);
  mover(71, 9, 76, 9, 0.024, 2.8);
  sp('core', 59, 7); sp('core', 66, 7); sp('core', 73, 7);

  ground(81, 110);
  box(86, 9, 88, 13, 'X');                                 // mini island
  sp('thrower', 92, 10);
  sp('wisp', 96, 5);
  sp('core', 83, 9); sp('core', 87, 7); sp('core', 94, 9);
  sp('core', 100, 9); sp('core', 105, 9);

  // wider chain with vertical bobbers
  water(111, 130);
  mover(112, 7, 115, 11, 0.026, 0);                        // vertical bob 1
  mover(117, 11, 120, 7, 0.026, 1.5);                      // vertical bob 2 (opposite)
  mover(122, 7, 125, 11, 0.026, 3.0);                      // vertical bob 3
  sp('core', 113, 5); sp('core', 119, 5); sp('core', 124, 5);

  // ============== TWIST (130-185): rising AND moving combined ==============
  ground(131, 150);
  box(135, 9, 137, 13, 'X');
  oneway(140, 143, 7);
  sp('walker', 146, 10);
  sp('thrower', 132, 10);
  sp('core', 136, 7); sp('core', 142, 5); sp('core', 148, 9);

  // 2 moving platforms diagonally arranged
  water(151, 175);
  mover(152, 10, 158, 6, 0.022, 0);                        // moves up-right
  mover(160, 6, 166, 10, 0.022, 1.6);                      // moves down-right
  mover(168, 10, 173, 6, 0.022, 0.8);
  sp('core', 154, 8); sp('core', 162, 5); sp('core', 170, 6);
  sp('wisp', 156, 3); sp('wisp', 165, 2);

  ground(176, 195);
  box(180, 8, 182, 13, 'X');
  qb(186, 4, 'B');                                         // blast power-up high up
  oneway(184, 188, 5);
  sp('thrower', 190, 10);
  sp('core', 178, 9); sp('core', 181, 6); sp('core', 186, 3); sp('core', 192, 9);

  // ============== REWARD (195-239): big flying-leap finale ==============
  water(196, 218);
  // a few sparse fast platforms
  mover(197, 8, 202, 8, 0.03, 0);
  mover(205, 7, 210, 7, 0.03, 1.5);
  mover(213, 8, 217, 8, 0.03, 0);
  sp('core', 200, 6); sp('core', 207, 5); sp('core', 215, 6);
  sp('wisp', 204, 3); sp('wisp', 212, 4);

  ground(219, 239);
  box(225, 9, 227, 13, 'X');
  box(229, 8, 231, 13, 'X');                               // goal pedestal
  box(239, 0, 239, 13, 'X');
  sp('timepart', 230, 7);
  sp('core', 221, 9); sp('core', 226, 7); sp('core', 230, 5);
  sp('core', 234, 9); sp('core', 237, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['2-2'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'THE WATERS BELOW', theme: 'sea-surface' };
})();
