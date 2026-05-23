// level_4_1.js - Day 4-1 "THE SUN" (Pass 3 redesign, ~240 tiles).
// Signature mechanic: solar-flare drops - bright projectiles fall
// periodically from invisible sky spawners. Teach: 1 flare zone you
// can walk around -> Test: walking through flares -> Twist: flares +
// walker enemies combined -> Reward: blast power-up to clear the
// final flare gauntlet.
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
  function flare(x, period) { spawns.push({ type: 'skyhazard', kind: 'flare', tx: x, ty: 0, period: period || 110 }); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // ============== TEACH (0-55): single sun spot, easy to avoid ==============
  ground(0, 35);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  qb(13, 7, 'G');
  sp('walker', 18, 10);                                    // flame sprite
  sp('core', 16, 9); sp('core', 22, 9); sp('core', 28, 9);

  // First flare zone - small, visible, can walk around
  flare(30, 130);
  sp('core', 30, 9);                                       // tempting core under the flare!

  ground(36, 70);
  qb(40, 7, '?');
  sp('walker', 46, 10);
  sp('wisp', 52, 6);
  sp('core', 38, 9); sp('core', 44, 9); sp('core', 50, 6); sp('core', 58, 9);

  // ============== TEST (70-130): walking THROUGH flares ==============
  flare(64, 100);
  flare(72, 100);
  sp('core', 64, 8); sp('core', 72, 8);

  box(74, 9, 76, 13, 'X');
  flare(80, 90);
  flare(88, 90);
  sp('core', 80, 8); sp('core', 88, 8);
  sp('walker', 84, 10);

  ground(94, 130);
  flare(96, 80);
  flare(104, 80);
  flare(112, 80);
  sp('thrower', 102, 10);
  sp('wisp', 116, 5);
  sp('core', 98, 9); sp('core', 106, 9); sp('core', 114, 9); sp('core', 122, 9);

  // ============== TWIST (130-185): flares + ground enemies combined ==============
  // gap with platform UNDER a flare zone
  mover(132, 9, 137, 9, 0.022, 0);
  flare(135, 90);
  sp('core', 134, 7); sp('core', 137, 7);

  ground(139, 175);
  flare(145, 70);
  flare(153, 70);
  flare(161, 70);
  flare(169, 70);
  sp('walker', 142, 10); sp('walker', 158, 10);
  sp('thrower', 165, 10);
  sp('wisp', 150, 4); sp('wisp', 167, 5);
  // The light-blast power-up tucked at the top of a one-way
  oneway(146, 149, 4);
  qb(147, 2, 'B');
  sp('core', 142, 9); sp('core', 147, 1); sp('core', 154, 9);
  sp('core', 161, 9); sp('core', 169, 9); sp('core', 173, 9);

  // ============== REWARD (175-239): final flare-storm to goal ==============
  mover(176, 9, 180, 9, 0.024, 0);

  ground(182, 215);
  // dense flare storm - if you have blast you can clear flares,
  // otherwise weave
  flare(184, 60); flare(190, 60); flare(196, 60);
  flare(202, 60); flare(208, 60);
  sp('walker', 187, 10); sp('walker', 200, 10);
  sp('thrower', 210, 10);
  sp('core', 184, 9); sp('core', 190, 9); sp('core', 196, 9);
  sp('core', 202, 9); sp('core', 208, 9); sp('core', 213, 9);

  ground(216, 239);
  box(220, 9, 223, 13, 'X');
  box(225, 8, 228, 13, 'X');
  box(231, 7, 235, 13, 'X');                               // goal pedestal
  box(239, 0, 239, 13, 'X');
  sp('timepart', 233, 6);
  sp('core', 218, 9); sp('core', 221, 7); sp('core', 226, 6);
  sp('core', 233, 5); sp('core', 237, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['4-1'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'THE SUN', theme: 'sunlit' };
})();
