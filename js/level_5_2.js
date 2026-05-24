// level_5_2.js - Day 5-2 "THE SEAS" (Pass 3 expansion, ~320 tiles).
// Fully underwater. Danny swims the whole way. Now twice as long with
// a difficulty curve - wide-gap coral walls early, tight gaps later,
// jellyfish drifting in open water.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 320, H = 14, GROUND = 13;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }

  // Sea floor
  for (var x = 0; x < W; x++) setT(x, 13, 'X');
  // Fill rows 1..12 with water; row 0 is surface marker.
  for (var x = 0; x < W; x++) {
    setT(x, 0, '~');
    for (var y = 1; y <= 12; y++) setT(x, y, 'W');
  }

  sp('player', 4, 11);

  // Coral wall with a swim-through gap
  function coralWall(col, gapTop, gapH) {
    gapH = gapH || 4;
    for (var y = 1; y < gapTop; y++) setT(col, y, '#');
    for (var y = gapTop + gapH; y <= 12; y++) setT(col, y, '#');
  }

  // ============== TEACH (cols 0-80): wide gaps, sparse walls ==============
  var teach = [[16, 3, 6], [32, 7, 6], [48, 3, 6], [64, 7, 6]];
  for (var i = 0; i < teach.length; i++) coralWall(teach[i][0], teach[i][1], teach[i][2]);
  for (var i = 0; i < teach.length; i++) {
    sp('core', teach[i][0], teach[i][1] + 1);
    sp('core', teach[i][0], teach[i][1] + 3);
  }
  // a few open-water cores
  sp('core', 8, 6); sp('core', 24, 4); sp('core', 40, 9); sp('core', 56, 5); sp('core', 72, 8);
  // Early growth power-up tucked at the TOP of the second coral
  // wall's gap (col 32, row 5) - player has to swim up to reach.
  qb(32, 5, 'G');
  // first jellyfish
  sp('wisp', 12, 5); sp('wisp', 28, 8); sp('wisp', 44, 4); sp('wisp', 60, 9);

  // ============== TEST (cols 80-180): standard gaps, more jellyfish ==============
  var test = [[80, 4, 5], [94, 7, 5], [108, 3, 5], [122, 6, 5],
              [136, 4, 5], [150, 7, 5], [164, 3, 5], [178, 6, 5]];
  for (var i = 0; i < test.length; i++) coralWall(test[i][0], test[i][1], test[i][2]);
  for (var i = 0; i < test.length; i++) {
    sp('core', test[i][0], test[i][1] + 1);
    sp('core', test[i][0], test[i][1] + 3);
  }
  sp('wisp', 86, 9); sp('wisp', 100, 4); sp('wisp', 114, 7);
  sp('wisp', 128, 4); sp('wisp', 142, 8); sp('wisp', 156, 5);
  sp('wisp', 170, 9);
  // blast power-up tucked behind a wall
  qb(95, 9, 'B');
  qb(140, 4, '?');

  // ============== TWIST (cols 180-260): tight gaps + thicker walls ==============
  var twist = [[190, 5, 3], [200, 7, 3], [210, 3, 3], [220, 6, 3],
               [230, 4, 3], [240, 7, 3], [250, 3, 3]];
  for (var i = 0; i < twist.length; i++) coralWall(twist[i][0], twist[i][1], twist[i][2]);
  for (var i = 0; i < twist.length; i++) {
    sp('core', twist[i][0], twist[i][1] + 1);
  }
  sp('wisp', 195, 9); sp('wisp', 205, 4); sp('wisp', 215, 8);
  sp('wisp', 225, 4); sp('wisp', 235, 9); sp('wisp', 245, 5);
  sp('wisp', 255, 8);

  // ============== REWARD (cols 260-319): open water + goal ==============
  // a couple final walls
  coralWall(270, 5, 6);
  coralWall(285, 5, 6);
  sp('core', 270, 7); sp('core', 285, 7);
  sp('wisp', 278, 5); sp('wisp', 292, 8);
  sp('core', 264, 6); sp('core', 278, 9); sp('core', 295, 5);

  // ============== PASS 9: chaos additions ==============
  // Bubble updraft columns - push Danny upward when he swims through.
  // Adds rhythm interest + helps reach the higher coral gaps.
  sp('bubble', 56, 4);
  sp('bubble', 130, 4);
  sp('bubble', 200, 4);
  sp('bubble', 280, 4);
  // Sprawled octopus - body damages on contact, just go around. One
  // each per third of the level, in clear water so the player has
  // room to navigate.
  sp('octopus', 100, 7);
  sp('octopus', 220, 7);

  // Goal: back wall + time-part
  box(W - 1, 0, W - 1, 13, 'X');
  sp('timepart', W - 5, 8);
  sp('core', W - 5, 5); sp('core', W - 10, 7);

  SDD.levels = SDD.levels || {};
  SDD.levels['5-2'] = {
    width: W, height: H, ground: GROUND,
    tiles: t, spawns: spawns, movers: [],
    name: 'THE SEAS', theme: 'seaside',
    underwater: true
  };
})();
