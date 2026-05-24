// level_5_1.js - Day 5-1 "THE SKIES" (Pass 9 trim, ~200 tiles).
// Flappy mode: Danny auto-flies forward, tap A to flap. Hit a pillar
// or the ground = lose a life. Mark's feedback: previous ~360-tile
// length was too punishing to retry; gaps were one block too tight.
// Now ~half length + every gap is +1 block taller.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 200, H = 14, GROUND = 13;
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

  // ============== TEACH (cols 0-70): wide easy gates ==============
  var teachGates = [[18, 3, 8], [36, 4, 6], [54, 5, 6]];
  for (var i = 0; i < teachGates.length; i++) gate(teachGates[i][0], teachGates[i][1], teachGates[i][2]);
  for (var i = 0; i < teachGates.length; i++) {
    var gc = teachGates[i][0], gt = teachGates[i][1];
    sp('core', gc, gt + 1); sp('core', gc, gt + 2);
  }

  // ============== TEST (cols 70-140): standard gates ==============
  var testGates = [[72, 4, 5], [90, 6, 5], [108, 3, 5], [126, 5, 5]];
  for (var i = 0; i < testGates.length; i++) gate(testGates[i][0], testGates[i][1], testGates[i][2]);
  for (var i = 0; i < testGates.length; i++) {
    var gc = testGates[i][0], gt = testGates[i][1];
    sp('core', gc, gt + 1); sp('core', gc, gt + 2);
  }
  sp('wisp', 82, 6); sp('wisp', 100, 4); sp('wisp', 118, 7);

  // ============== REWARD (cols 140-199): final stretch ==============
  var rewardGates = [[144, 5, 5], [162, 4, 5], [180, 6, 5]];
  for (var i = 0; i < rewardGates.length; i++) gate(rewardGates[i][0], rewardGates[i][1], rewardGates[i][2]);
  for (var i = 0; i < rewardGates.length; i++) {
    var gc = rewardGates[i][0], gt = rewardGates[i][1];
    sp('core', gc, gt + 1); sp('core', gc, gt + 2);
  }
  sp('wisp', 154, 7); sp('wisp', 172, 4);

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
