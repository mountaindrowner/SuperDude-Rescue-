// level_5_1.js - Day 5 Stage 1 "THE SKIES" (Flappy mode!)
// Auto-scrolling sky scene. Danny flies forward on his own; tap A to flap.
// Touching the ground or hitting an obstacle = death. Fly through the
// gaps in each cloud-pillar gate, scoop up power cores, reach the
// time-machine part at the end.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 180, H = 14, GROUND = 13;     // long auto-scroll, ground at very bottom
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }

  // Floor of death (looks like distant clouds; touching = lose a life).
  ground(0, W - 1);

  // Top ceiling (one row of bricks - prevents flying off the top).
  // Player.update clamps y >= 4 in flappy mode so this is mostly visual.

  sp('player', 4, 8);

  // ---- Cloud-pillar gates ----
  // Each "gate" is a vertical wall with a gap somewhere between rows 2
  // and 10. Gap height = 4 tiles. Spaced ~12 tiles apart so the player
  // has time to react.
  function gate(col, gapTop) {
    // pillar from row 0 to gapTop-1
    for (var y = 0; y < gapTop; y++) setT(col, y, '#');
    // pillar from gapTop+4 down to the ground row 12
    for (var y = gapTop + 4; y <= 12; y++) setT(col, y, '#');
  }
  // gap row positions (top of gap), kid-friendly oscillation
  var gates = [
    [18, 4], [30, 6], [42, 3], [54, 7], [66, 5],
    [78, 2], [90, 6], [102, 4], [114, 7], [126, 3],
    [138, 5], [150, 6]
  ];
  for (var i = 0; i < gates.length; i++) gate(gates[i][0], gates[i][1]);

  // Power cores in each gap so flying through pays off.
  for (var i = 0; i < gates.length; i++) {
    var gc = gates[i][0], gt = gates[i][1];
    sp('core', gc, gt + 1);
    sp('core', gc, gt + 2);
  }

  // A few drifting wisps as bonus dodging challenge between gates.
  sp('wisp', 24, 5);
  sp('wisp', 48, 8);
  sp('wisp', 72, 4);
  sp('wisp', 96, 7);
  sp('wisp', 120, 5);
  sp('wisp', 144, 6);

  // Final stretch: clear sky leading to the goal pillar.
  box(W - 4, 0, W - 4, 12, 'X');     // back wall
  sp('timepart', W - 7, 8);

  SDD.levels = SDD.levels || {};
  SDD.levels['5-1'] = {
    width: W, height: H, ground: GROUND,
    tiles: t, spawns: spawns, movers: [],
    name: 'THE SKIES', theme: 'bird-sky',
    flappy: true,
    flappySpeed: 1.4,       // auto-forward velocity
    flappyFlap: 3.6,        // upward impulse on A tap
    flappyGravity: 0.85,    // multiplier on GRAVITY (snappy fall)
    flappyMaxFall: 4.5
  };
})();
