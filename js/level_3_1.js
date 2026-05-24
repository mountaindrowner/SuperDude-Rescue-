// level_3_1.js - Day 3-1 "FORMING LAND" (Pass 3 redesign, ~240 tiles).
// Signature mechanic: brick-stack climbing (vertical scrambling up
// tight rock gaps). Teach: one ledge -> Test: brick column -> Twist:
// zig-zag wall + narrow chasm -> Reward: high mountain run-up to goal.
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
  function lava(x, period) { spawns.push({ type: 'skyhazard', kind: 'lavaPlume', tx: x, ty: 10, period: period || 90 }); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // ============== TEACH (0-50): flat ground, single ledge ==============
  ground(0, 30);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  qb(13, 7, 'G');
  sp('walker', 18, 10);                                    // first rock-crab
  sp('core', 16, 9); sp('core', 22, 9);

  // First single ledge to jump onto
  box(25, 9, 28, 13, 'X');
  sp('core', 26, 7);

  ground(30, 50);
  box(34, 8, 37, 13, 'X');                                 // taller ledge
  sp('walker', 42, 10);
  sp('wisp', 45, 7);
  sp('core', 32, 9); sp('core', 35, 6); sp('core', 48, 9);

  // ============== TEST (50-110): brick column climbs ==============
  ground(51, 90);
  // First brick column: 3-step climb
  box(55, 10, 56, 13, 'X');
  box(58, 9, 59, 13, 'X');
  box(61, 8, 62, 13, 'X');
  box(64, 7, 65, 13, 'X');
  sp('core', 55, 8); sp('core', 58, 7); sp('core', 61, 6); sp('core', 64, 5);

  // walking gap with a lava plume erupting at the seed-spitter's old spot
  sp('walker', 70, 10);
  lava(76, 100);
  sp('core', 68, 9); sp('core', 73, 9); sp('core', 80, 9);

  // 2-tall brick wall to climb over (tight)
  box(84, 8, 85, 13, 'X');
  box(88, 7, 89, 13, 'X');
  box(92, 6, 93, 13, 'X');
  sp('core', 84, 6); sp('core', 88, 5); sp('core', 92, 4);
  qb(92, 3, '?');

  // ============== TWIST (110-170): zig-zag wall climbing ==============
  ground(96, 140);
  // Zig-zag wall. Rising walls capped at row 8 (5 tiles tall) so small
  // Danny can actually jump onto them from ground - row-6 walls (8
  // tiles tall) needed an 80 px rise and small Danny max rise is 58.
  // Hanging walls stay as ceilings to duck under.
  box(102, 8, 104, 13, 'X');                               // rising wall
  box(108, 0, 110, 6, 'X');                                // hanging ceiling
  box(114, 8, 116, 13, 'X');
  box(120, 0, 122, 6, 'X');
  box(126, 8, 128, 13, 'X');
  // small one-way ledges to make the weave possible
  oneway(105, 107, 8);
  oneway(111, 113, 8);
  oneway(117, 119, 8);
  oneway(123, 125, 8);
  // Pass 10 round 2 (Mark): "The gaps between the ascending pillars
  // need to lead straight to the death of the character because if
  // not, they get stuck." Carve the floor out under each gap so a
  // miss = pit death rather than getting marooned between walls.
  function pitClear(x0, x1) {
    for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, ' ');
  }
  pitClear(105, 107);
  pitClear(111, 113);
  pitClear(117, 119);
  pitClear(123, 125);
  // Plume in the open path BETWEEN the rising walls (was at col 102
  // which spawned the column inside the solid rock at 102-104).
  lava(112, 130);
  sp('wisp', 113, 4); sp('wisp', 121, 4);
  sp('core', 106, 7); sp('core', 112, 7); sp('core', 118, 7); sp('core', 124, 7);
  qb(110, 8, 'B');                                          // blast power-up between zigs

  // Mid-stage checkpoint flag - past the zig-zag, easy/medium respawn here.
  sp('checkpoint', 132, 10);
  // Day 3-1 signature: COOLING WATER makes lava plumes harmless for
  // a few seconds - critical right before the zig-zag plume gauntlet.
  spawns.push({ type: 'signature', tx: 70, ty: 10, kind: 'coolingwater' });

  // gap with moving platform (relief after the climb)
  mover(141, 9, 145, 9, 0.022, 0);
  sp('core', 143, 7);

  // ============== TWIST 2 (147-185): narrow chasm ==============
  ground(147, 180);
  // tall walls with narrow gap; bricks form ascending stairs you must take
  box(150, 0, 150, 8, 'X');                                // hanging
  box(155, 9, 156, 13, 'X');
  box(158, 7, 159, 13, 'X');
  box(161, 5, 162, 13, 'X');
  box(164, 3, 165, 13, 'X');
  box(168, 0, 168, 5, 'X');                                // ceiling
  sp('walker', 172, 10);
  lava(178, 90);
  sp('core', 155, 8); sp('core', 158, 6); sp('core', 161, 4); sp('core', 164, 2);
  sp('core', 167, 4); sp('core', 174, 9); sp('core', 178, 9);

  // ============== REWARD (185-239): mountain run to goal ==============
  mover(181, 9, 184, 9, 0.022, 0);

  ground(186, 239);
  box(192, 9, 195, 13, 'X');
  box(199, 8, 202, 13, 'X');
  box(206, 7, 209, 13, 'X');                               // staircase to summit
  box(213, 6, 216, 13, 'X');                               // summit plateau
  // Descending victory staircase from summit -> goal pedestal per
  // Mark ("you should have stairs to congratulate the player almost").
  box(218, 7, 220, 13, 'X');                               // step 1
  box(222, 7, 225, 13, 'X');                               // step 2 (flat with pedestal)
  sp('wisp', 225, 5);
  box(228, 7, 233, 13, 'X');                               // goal pedestal at altitude
  box(239, 0, 239, 13, 'X');
  sp('timepart', 230, 6);
  sp('core', 188, 9); sp('core', 193, 7); sp('core', 200, 6);
  sp('core', 207, 5); sp('core', 214, 4); sp('core', 221, 9);
  sp('core', 230, 4); sp('core', 235, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['3-1'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'FORMING LAND', theme: 'rocky' };
})();
