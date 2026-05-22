// level_7_1.js - Day 7 "Day of Rest". A calm Eden garden: no enemies, no
// pits, no hazards - just NPCs to greet, power cores to gather, and the
// final time-machine part on the pedestal that triggers the grand finale.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 100, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y, k) { var o = { type: t_, tx: x, ty: y }; if (k) o.kind = k; spawns.push(o); }

  ground(0, 99);                                  // unbroken peaceful ground

  sp('player', 3, 10);

  // gentle rolling hills as decoration
  box(15, 10, 17, 13, 'X');
  box(28, 10, 30, 13, 'X');
  box(45, 10, 47, 13, 'X');
  box(62, 10, 64, 13, 'X');
  box(78, 10, 80, 13, 'X');

  // NPCs scattered through the garden, each gifting a final blessing
  sp('npc', 10, 10, 'adam');
  sp('npc', 24, 10, 'adam');
  sp('npc', 40, 10, 'adam');
  sp('npc', 56, 10, 'adam');
  sp('npc', 72, 10, 'adam');

  // a generous trail of power cores - a celebratory final harvest
  for (var x = 6; x <= 90; x += 3) sp('core', x, 6 + (x % 5));

  // pedestal with the final time-machine part
  box(88, 8, 92, 13, 'X');
  box(99, 0, 99, 13, 'X');
  sp('timepart', 90, 7);

  SDD.levels = SDD.levels || {};
  SDD.levels['7-1'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: [], name: 'DAY OF REST' };
})();
