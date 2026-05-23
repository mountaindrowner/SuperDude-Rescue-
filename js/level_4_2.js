// level_4_2.js - Day 4-2 "MOON & STARS" (Pass 3 redesign, ~260 tiles).
// Signature mechanic: LOW GRAVITY + drifting meteors. Teach: floaty
// jumps clearing wider gaps -> Test: vertical climbing via low-grav
// jumps -> Twist: meteors crossing the path -> Reward: big leap
// finale over a meteor storm.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 260, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }
  function meteor(x, y, period, dir) {
    spawns.push({ type: 'skyhazard', kind: 'meteor', tx: x, ty: y, period: period || 120, dir: dir || 1 });
  }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // ============== TEACH (0-50): floaty jumps clear wider gaps ==============
  ground(0, 25);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  qb(13, 6, 'G');                                          // grow block tucked HIGH (low-g)
  sp('walker', 18, 10);
  sp('core', 16, 9); sp('core', 22, 9);

  // first wide gap (impossible in normal gravity) cols 26-32
  sp('core', 26, 8); sp('core', 28, 6); sp('core', 30, 6); sp('core', 32, 8);

  ground(33, 65);
  box(38, 5, 41, 6, 'X');                                  // floating island high up
  qb(40, 4, '?');
  sp('wisp', 44, 5);
  sp('core', 36, 9); sp('core', 39, 3); sp('core', 47, 9); sp('core', 52, 5);
  // big leap over cols 56-62
  sp('core', 56, 7); sp('core', 59, 4); sp('core', 62, 7);

  // ============== TEST (65-130): vertical climbing via low-g jumps ==============
  ground(66, 105);
  // Tall floating-island staircase - tall jumps because of low-g
  box(70, 7, 73, 8, 'X');
  box(76, 4, 79, 5, 'X');
  box(82, 1, 85, 2, 'X');                                  // very high
  oneway(88, 91, 4);
  sp('thrower', 78, 10);
  sp('wisp', 87, 6);
  sp('core', 71, 5); sp('core', 77, 2); sp('core', 83, 0); sp('core', 89, 2);
  qb(83, 0, '?');

  // descending leap
  box(94, 6, 97, 7, 'X');
  box(100, 9, 103, 10, 'X');
  sp('core', 95, 4); sp('core', 101, 7);

  // wide gap with single high platform
  box(110, 4, 113, 5, 'X');
  sp('core', 110, 2); sp('core', 113, 2);

  // ============== TWIST (115-185): meteors cross the path ==============
  ground(116, 155);
  meteor(117, 2, 110, 1);                                  // meteor drifting right
  meteor(135, 2, 110, -1);                                 // meteor drifting left
  meteor(150, 2, 110, 1);
  sp('walker', 122, 10); sp('walker', 142, 10);
  sp('thrower', 130, 10);
  sp('wisp', 138, 5);
  box(125, 6, 128, 7, 'X');
  box(133, 4, 136, 5, 'X');
  box(141, 6, 144, 7, 'X');
  qb(144, 2, 'B');                                         // blast power-up high
  sp('core', 119, 9); sp('core', 126, 4); sp('core', 134, 2);
  sp('core', 142, 4); sp('core', 144, 1); sp('core', 152, 9);

  // gap with rising platform under meteor storm
  meteor(160, 2, 90, 1);
  meteor(170, 2, 90, -1);
  mover(157, 10, 159, 5, 0.024, 0);
  sp('core', 158, 7);

  ground(162, 195);
  box(167, 4, 170, 5, 'X');
  box(174, 1, 177, 2, 'X');                                // sky-high
  oneway(180, 184, 5);
  sp('thrower', 187, 10);
  sp('wisp', 175, 4); sp('wisp', 191, 3);
  sp('core', 168, 2); sp('core', 175, 0); sp('core', 182, 3); sp('core', 192, 9);

  // ============== REWARD (195-259): big leap over meteor storm ==============
  // wide pit with 2 sky platforms
  meteor(198, 2, 80, 1);
  meteor(208, 2, 80, -1);
  meteor(218, 2, 80, 1);
  box(200, 4, 203, 5, 'X');
  box(210, 4, 213, 5, 'X');
  box(220, 4, 223, 5, 'X');
  sp('core', 201, 2); sp('core', 211, 2); sp('core', 221, 2);

  ground(225, 259);
  box(230, 9, 234, 13, 'X');
  box(238, 6, 242, 13, 'X');                               // high goal pedestal
  box(259, 0, 259, 13, 'X');
  sp('timepart', 240, 5);
  sp('core', 227, 9); sp('core', 232, 7); sp('core', 240, 4);
  sp('core', 246, 9); sp('core', 252, 9); sp('core', 256, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['4-2'] = {
    width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers,
    gravityScale: 0.35, name: 'MOON & STARS', theme: 'cosmic-night'
  };
})();
