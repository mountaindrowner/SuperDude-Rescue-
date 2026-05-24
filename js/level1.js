// level1.js - Day 1 "LIGHT AND DARKNESS" (Pass 3 redesign, ~380 tiles).
// Foundational level. Teach jump -> Test with pits -> Twist with a
// moving platform + first enemy -> Reward with growth + light-blast.
// Galactic palette: glowing white platforms against the void.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 380, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function bricks(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '#'); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(type, tx, ty) { spawns.push({ type: type, tx: tx, ty: ty }); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, phase) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: phase || 0 });
  }

  // ============================================================
  // ACT 1: TEACH (cols 0-90) - flat ground, one block, one walker,
  // first pit. Player learns: move, jump, hit blocks, growth power-up.
  // ============================================================
  ground(0, 30);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 8, 9); sp('core', 10, 9);   // a "trail" leading forward
  qb(13, 7, 'G');                                          // growth block right on the path
  qb(15, 7, '?');                                          // bonus cores
  sp('walker', 20, 10);                                    // first enemy
  sp('core', 22, 9); sp('core', 24, 9); sp('core', 26, 6);

  // First pit (jump teaches itself - small + visible)
  // gap: 31-33
  sp('core', 31, 7); sp('core', 32, 6); sp('core', 33, 7);

  ground(34, 70);
  bricks(40, 42, 8);
  qb(45, 7, '?');
  sp('walker', 48, 10); sp('walker', 56, 10);
  sp('wisp', 52, 6);                                       // first flyer
  sp('core', 38, 9); sp('core', 41, 6); sp('core', 50, 5);
  sp('core', 58, 9); sp('core', 64, 9); sp('core', 68, 7);

  // ============================================================
  // ACT 2: TEST (cols 70-180) - more pits, moving platforms,
  // throw-enemy introduced. Player applies what they learned.
  // ============================================================
  // gap with moving platform: 71-75
  mover(71, 9, 75, 9, 0.022, 0);
  sp('core', 73, 7);

  ground(76, 105);
  box(82, 9, 84, 13, 'X');                                 // mini ledge
  oneway(88, 91, 7);                                       // one-way (teach)
  sp('thrower', 94, 10);                                   // first shade thrower
  sp('core', 80, 9); sp('core', 89, 5); sp('core', 96, 7); sp('core', 100, 9);

  // wider gap with TWO moving platforms in opposite phases
  mover(106, 9, 110, 9, 0.022, 0);
  mover(112, 9, 116, 9, 0.022, 1.4);
  sp('core', 108, 7); sp('core', 114, 7);

  ground(117, 150);
  bricks(122, 125, 7);
  qb(130, 6, '?'); qb(132, 6, '?');
  sp('walker', 119, 10); sp('walker', 138, 10);
  sp('wisp', 128, 5); sp('wisp', 144, 7);
  sp('core', 120, 9); sp('core', 131, 4); sp('core', 140, 9); sp('core', 148, 9);

  // taller plateau requires a jump up
  box(151, 8, 158, 13, 'X');
  oneway(154, 156, 6);
  sp('core', 153, 7); sp('core', 156, 4);

  // gap with vertical moving platform (rises)
  mover(159, 10, 161, 6, 0.024, 0);
  sp('core', 160, 8);

  ground(163, 195);
  box(167, 9, 170, 13, 'X');
  bricks(174, 177, 7);
  sp('thrower', 180, 10);
  sp('walker', 188, 10);
  sp('core', 168, 7); sp('core', 175, 5); sp('core', 182, 9); sp('core', 192, 9);

  // ============================================================
  // ACT 3: TWIST (cols 195-300) - the LIGHT BLAST power-up arc.
  // High route with one-ways guarded by a thrower; getting the blast
  // makes the rest of the level easier (thrower-clearing).
  // ============================================================
  // first pit segment - either jump or use moving platform
  mover(196, 9, 200, 9, 0.02, 0.5);
  sp('core', 198, 7);

  ground(202, 240);
  // climbing staircase of one-ways leading up to a blast block
  oneway(206, 209, 8);
  oneway(211, 214, 6);
  oneway(216, 219, 4);
  oneway(221, 224, 2);
  qb(222, 0, 'B');                                         // blast power-up at the TOP
  sp('thrower', 215, 10);                                  // guardian on the ground
  sp('wisp', 218, 5); sp('wisp', 224, 3);
  sp('core', 207, 7); sp('core', 212, 5); sp('core', 217, 3); sp('core', 222, 1);

  // long flat stretch after the blast - test the new ability
  sp('thrower', 230, 10); sp('thrower', 238, 10);          // throwers to blast!
  sp('walker', 234, 10);
  sp('core', 228, 9); sp('core', 232, 9); sp('core', 236, 9);

  // gap chain - two pits back-to-back
  mover(241, 9, 245, 9, 0.024, 0);
  sp('core', 243, 7);
  mover(247, 9, 251, 9, 0.024, 1.2);
  sp('core', 249, 7);

  ground(252, 290);
  box(258, 9, 260, 13, 'X');
  box(264, 8, 266, 13, 'X');
  box(270, 7, 272, 13, 'X');                               // staircase up
  oneway(275, 278, 6);
  qb(281, 6, '?'); qb(282, 6, '?'); qb(283, 6, 'G');       // recovery growth block
  sp('walker', 256, 10); sp('walker', 268, 7); sp('walker', 286, 10);
  sp('wisp', 274, 4); sp('wisp', 288, 6);
  sp('thrower', 278, 10);
  sp('core', 254, 9); sp('core', 259, 7); sp('core', 265, 6); sp('core', 271, 5);
  sp('core', 277, 4); sp('core', 282, 4); sp('core', 290, 9);

  // ============================================================
  // ACT 4: REWARD (cols 295-379) - climactic stretch then a calm
  // final run-up. Wider pits, more enemies, then a clear path to
  // the time-machine part on the pedestal.
  // ============================================================
  // Wide pit with two slow platforms in series. Mark called this
  // the "especially hard" twin-platform near the end - tightened the
  // travel range so the platforms swing closer to the main path,
  // narrowing the worst jump from ~4 tiles to ~3.
  mover(296, 9, 299, 9, 0.018, 0);
  mover(301, 9, 304, 9, 0.018, 1.5);
  sp('core', 297, 7); sp('core', 303, 7);

  ground(307, 340);
  bricks(311, 314, 8);
  oneway(317, 320, 6);
  oneway(322, 325, 4);
  sp('thrower', 316, 10); sp('thrower', 330, 10);
  sp('walker', 327, 10); sp('walker', 335, 10);
  sp('wisp', 323, 3); sp('wisp', 332, 5);
  sp('core', 309, 9); sp('core', 313, 5); sp('core', 319, 4);
  sp('core', 324, 2); sp('core', 328, 9); sp('core', 336, 9);

  // climactic final pit with a vertically-moving platform
  mover(341, 10, 343, 6, 0.022, 0);
  sp('core', 342, 8); sp('core', 342, 4);

  // ============================================================
  // RELIEF + GOAL (cols 345-379) - clear straight run to the goal.
  // ============================================================
  ground(345, 379);
  box(352, 10, 353, 13, 'X');
  box(355, 9, 356, 13, 'X');
  box(358, 8, 359, 13, 'X');
  box(361, 7, 362, 13, 'X');
  box(370, 9, 374, 13, 'X');                               // goal pedestal
  box(379, 0, 379, 13, 'X');                               // end wall
  sp('timepart', 372, 8);
  sp('core', 347, 9); sp('core', 354, 8); sp('core', 359, 7);
  sp('core', 362, 6); sp('core', 366, 9); sp('core', 372, 6);
  sp('core', 376, 9);

  SDD.level1 = {
    width: W, height: H, ground: GROUND,
    tiles: t, spawns: spawns, movers: movers,
    name: 'LIGHT AND DARKNESS',
    theme: 'galactic'
  };
  SDD.levels = SDD.levels || {};
  SDD.levels['1-1'] = SDD.level1;
})();
