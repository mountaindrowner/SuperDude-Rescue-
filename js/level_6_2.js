// level_6_2.js - Day 6 Stage 2 "Mankind". A peaceful Eden village - very
// few enemies, friendly NPCs (Adam) scattered along the path who gift Danny
// power cores when greeted.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 120, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function bricks(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '#'); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y, k) { var o = { type: t_, tx: x, ty: y }; if (k) o.kind = k; spawns.push(o); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  ground(0, 20);
  sp('player', 3, 10);
  qb(8, 7, 'G');
  sp('npc', 12, 10, 'adam');                  // first villager
  sp('core', 5, 9); sp('core', 9, 6); sp('core', 16, 8); sp('core', 18, 6);

  sp('core', 21, 7); sp('core', 22, 6); sp('core', 23, 7);

  ground(24, 42);
  bricks(28, 31, 8);
  sp('walker', 33, 10);                       // one wild critter wandered in
  sp('npc', 39, 10, 'adam');
  qb(36, 6, '?');
  sp('core', 27, 9); sp('core', 30, 5); sp('core', 38, 7); sp('core', 41, 9);

  mover(43, 9, 46, 9, 0.02, 0);
  sp('core', 44, 7);

  ground(47, 65);
  box(50, 8, 53, 13, 'X');
  oneway(57, 60, 6);
  qb(58, 3, 'B');                              // tucked-away blast power-up
  sp('npc', 55, 10, 'adam');
  sp('wisp', 60, 4);
  sp('core', 51, 7); sp('core', 58, 2); sp('core', 62, 8);

  mover(66, 9, 69, 9, 0.022, 0.4);

  ground(70, 88);
  box(73, 8, 76, 13, 'X');
  bricks(79, 82, 7);
  sp('npc', 85, 10, 'adam');
  qb(81, 4, '?');
  sp('core', 74, 7); sp('core', 80, 5); sp('core', 81, 3); sp('core', 86, 9);

  ground(89, 119);
  box(95, 10, 96, 13, 'X');
  box(98, 9, 99, 13, 'X');
  box(101, 8, 102, 13, 'X');
  box(108, 9, 110, 13, 'X');
  box(119, 0, 119, 13, 'X');
  sp('npc', 92, 10, 'adam');                  // last greeter near the goal
  sp('timepart', 109, 8);
  sp('core', 90, 9); sp('core', 100, 7); sp('core', 105, 9); sp('core', 113, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['6-2'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'MANKIND', theme: 'village-dusk' };
})();
