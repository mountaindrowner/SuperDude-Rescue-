// level_5_1.js - Day 5-1 "THE SKIES" (Pass 3 expansion, ~360 tiles).
// Flappy mode: Danny auto-flies forward, tap A to flap. Hit a pillar
// or the ground = lose a life. Now twice as long with a difficulty
// curve - wide gaps early, tighter gates later, wisp dodges between.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 360, H = 14, GROUND = 13;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }

  ground(0, W - 1);
  // Spawn at row 5 so Danny starts at the upper edge of the first
  // gate's gap (gap is rows 5-9), giving time to flap and find the
  // rhythm before reaching the pillar. Was row 8 - gravity pulled
  // Danny straight into the lower pillar before he could react.
  sp('player', 4, 5);

  // Each gate: pillar from top to gapTop-1, then gap (gapH tall),
  // then pillar from gapTop+gapH down to row 12.
  function gate(col, gapTop, gapH) {
    gapH = gapH || 4;
    for (var y = 0; y < gapTop; y++) setT(col, y, '#');
    for (var y = gapTop + gapH; y <= 12; y++) setT(col, y, '#');
  }

  // ============== TEACH (cols 0-90): wide, easy gates ==============
  // gates spaced 18 tiles apart, gap height 5 (generous).
  // First gate is gap height 7 - extra forgiving for the very first
  // flap of the level so the player learns the rhythm.
  var teachGates = [[18, 4, 7], [36, 4, 5], [54, 6, 5], [72, 4, 5]];
  for (var i = 0; i < teachGates.length; i++) gate(teachGates[i][0], teachGates[i][1], teachGates[i][2]);
  for (var i = 0; i < teachGates.length; i++) {
    var gc = teachGates[i][0], gt = teachGates[i][1];
    sp('core', gc, gt + 1); sp('core', gc, gt + 2);
  }

  // ============== TEST (cols 90-200): standard gates ==============
  // 15-tile spacing, gap height 4
  var testGates = [[90, 5, 4], [105, 3, 4], [120, 6, 4], [135, 4, 4],
                   [150, 7, 4], [165, 2, 4], [180, 5, 4], [195, 6, 4]];
  for (var i = 0; i < testGates.length; i++) gate(testGates[i][0], testGates[i][1], testGates[i][2]);
  for (var i = 0; i < testGates.length; i++) {
    var gc = testGates[i][0], gt = testGates[i][1];
    sp('core', gc, gt + 1); sp('core', gc, gt + 2);
  }
  // wisps between to dodge
  sp('wisp', 97, 4); sp('wisp', 112, 7); sp('wisp', 127, 3);
  sp('wisp', 142, 6); sp('wisp', 157, 4); sp('wisp', 172, 7);
  sp('wisp', 187, 3);

  // ============== TWIST (cols 200-300): tighter gaps, faster ==============
  // 12-tile spacing, gap height 3
  var twistGates = [[208, 4, 3], [220, 6, 3], [232, 3, 3], [244, 7, 3],
                    [256, 4, 3], [268, 6, 3], [280, 3, 3], [292, 5, 3]];
  for (var i = 0; i < twistGates.length; i++) gate(twistGates[i][0], twistGates[i][1], twistGates[i][2]);
  for (var i = 0; i < twistGates.length; i++) {
    var gc = twistGates[i][0], gt = twistGates[i][1];
    sp('core', gc, gt + 1);
  }
  sp('wisp', 214, 7); sp('wisp', 226, 4); sp('wisp', 238, 7);
  sp('wisp', 250, 3); sp('wisp', 262, 7); sp('wisp', 274, 4);
  sp('wisp', 286, 7);

  // ============== REWARD (cols 300-359): final stretch, clear sky ==============
  // sparse gates, big gaps, then goal
  gate(308, 4, 5);
  gate(322, 6, 5);
  gate(336, 4, 5);
  for (var i = 0; i < 3; i++) {
    var cs = [308, 322, 336][i], ts = [4, 6, 4][i];
    sp('core', cs, ts + 1); sp('core', cs, ts + 2);
  }
  sp('wisp', 316, 5); sp('wisp', 330, 7);

  box(W - 4, 0, W - 4, 12, 'X');
  sp('timepart', W - 7, 8);
  sp('core', W - 10, 4); sp('core', W - 10, 7);

  SDD.levels = SDD.levels || {};
  SDD.levels['5-1'] = {
    width: W, height: H, ground: GROUND,
    tiles: t, spawns: spawns, movers: [],
    name: 'THE SKIES', theme: 'bird-sky',
    flappy: true, flappySpeed: 1.4, flappyFlap: 3.6,
    flappyGravity: 0.85, flappyMaxFall: 4.5
  };
})();
