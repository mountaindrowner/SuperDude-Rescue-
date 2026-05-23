// level_5_2.js - Day 5 Stage 2 "THE SEAS" (fully underwater!)
// One continuous water world. No dry land - Danny swims the whole way.
// Coral rocks and seaweed walls block the path; jellyfish-style flyers
// drift around. Water IS the level so there is no pit death.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 160, H = 14, GROUND = 13;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }

  // Sea floor (solid - Danny can walk on it briefly between paddles).
  for (var x = 0; x < W; x++) setT(x, 13, 'X');

  // Fill rows 1..12 with water; row 0 is water surface marker.
  for (var x = 0; x < W; x++) {
    setT(x, 0, '~');
    for (var y = 1; y <= 12; y++) setT(x, y, 'W');
  }

  sp('player', 4, 11);

  // ---- Coral wall obstacles (vertical brick stacks) with swim-through gaps ----
  function coralWall(col, gapTop, gapH) {
    gapH = gapH || 4;
    for (var y = 1; y < gapTop; y++) setT(col, y, '#');
    for (var y = gapTop + gapH; y <= 12; y++) setT(col, y, '#');
  }
  var walls = [
    [16, 3, 5], [28, 7, 4], [40, 2, 5], [54, 8, 4],
    [68, 4, 5], [82, 7, 4], [98, 3, 5], [114, 6, 4],
    [130, 4, 5]
  ];
  for (var i = 0; i < walls.length; i++) coralWall(walls[i][0], walls[i][1], walls[i][2]);

  // Power cores threaded through the gaps
  for (var i = 0; i < walls.length; i++) {
    var c = walls[i][0], gt = walls[i][1];
    sp('core', c, gt + 1);
    sp('core', c, gt + 2);
  }
  // a few extra cores in open water
  sp('core', 10, 6); sp('core', 22, 4); sp('core', 35, 8);
  sp('core', 48, 5); sp('core', 62, 9); sp('core', 76, 6);
  sp('core', 92, 7); sp('core', 108, 10); sp('core', 122, 5);

  // ---- Jellyfish (re-skinned wisps) drifting in the open water ----
  sp('wisp', 12, 5); sp('wisp', 24, 9); sp('wisp', 36, 4);
  sp('wisp', 50, 7); sp('wisp', 64, 10); sp('wisp', 78, 4);
  sp('wisp', 94, 8); sp('wisp', 110, 5); sp('wisp', 126, 8);

  // Hidden blast power-up tucked behind a coral wall
  qb(70, 9, 'B');
  qb(100, 5, '?');

  // Final approach: bigger gap, then the goal pillar.
  box(W - 8, 1, W - 8, 12, '#');         // last coral wall (gap row 4-8)
  for (var y = 4; y <= 8; y++) setT(W - 8, y, ' ');
  for (var y = 4; y <= 8; y++) setT(W - 8, y, 'W');
  box(W - 1, 0, W - 1, 13, 'X');         // back wall
  sp('timepart', W - 4, 8);
  sp('core', W - 4, 6);

  SDD.levels = SDD.levels || {};
  SDD.levels['5-2'] = {
    width: W, height: H, ground: GROUND,
    tiles: t, spawns: spawns, movers: [],
    name: 'THE SEAS', theme: 'seaside',
    underwater: true
  };
})();
