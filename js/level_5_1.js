// level_5_1.js - Day 5-1 "THE SKIES" (Pass 10 round 2 rework).
// Flappy mode: Danny auto-flies forward, tap A to flap. Pass 10 r2
// (Mark): "Let's completely remove the obstacles - the walls. Replace
// with trails of cores and improve the tornadoes. Make them come from
// both sides at different rows so it's not a giant wave."
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 200, H = 14, GROUND = 13;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }

  // Visual-only ground band so Danny has terrain to read against, even
  // though pits below the floor still kill the same as before. No more
  // pillars/walls along the way - the sky is open.
  ground(0, W - 1);
  // Spawn at row 5 - upper-middle of the play space.
  sp('player', 4, 5);

  // ============== CORE TRAILS (cols 0-W) ==============
  // Pass 10 r2 (Mark): "trails of cores that allow the players to try
  // to get those, and also to dodge the tornadoes." Each "ridge" is a
  // shallow curve of cores that subtly guides the player's altitude.
  // Curves alternate up + down so the kid is flapping rhythmically.
  function coreRow(x0, x1, baseY, amp, phase) {
    for (var x = x0; x <= x1; x += 2) {
      var y = Math.round(baseY + Math.sin((x - x0) * 0.16 + phase) * amp);
      if (y < 1) y = 1; if (y > 11) y = 11;
      sp('core', x, y);
    }
  }
  // 3 swooping core ribbons spread across the level
  coreRow(8,  64, 6, 3, 0);
  coreRow(70, 130, 5, 4, 1.5);
  coreRow(136, 188, 7, 3, 0.5);

  // Bonus high-altitude clusters tempting risky climbs
  sp('core', 30,  2); sp('core', 32, 2); sp('core', 34, 2);
  sp('core', 80,  1); sp('core', 82, 1); sp('core', 84, 1);
  sp('core', 140, 2); sp('core', 142, 2); sp('core', 144, 2);

  // ============== TORNADOES (one at a time, alternating sides) ==============
  // Pass 10 r2 (Mark): "make sure that the tornadoes - it's only one
  // at a time, and maybe one's coming from the left, the other one's
  // coming from the right. Different rows. Not a giant wave."
  // Each twister covers a different stretch of the level. Spawn x is
  // placed at the START of their stretch and they wrap, so the player
  // encounters one moving twister per phase.
  // Direction convention: spd > 0 = moves right, spd < 0 = moves left.
  // The wrap logic in Twister.update brings them back around so each
  // tornado patrols its band continuously.
  spawns.push({ type: 'twister', tx: 50,  ty: 3,  spd:  1.6 });   // L->R, upper band
  spawns.push({ type: 'twister', tx: 90,  ty: 6,  spd: -1.6 });   // R->L, mid band
  spawns.push({ type: 'twister', tx: 130, ty: 9,  spd:  1.4 });   // L->R, lower band
  spawns.push({ type: 'twister', tx: 170, ty: 4,  spd: -1.5 });   // R->L, upper-mid

  // Storm wisps for atmosphere (slow background flyers, no shooting)
  sp('wisp', 60, 2); sp('wisp', 110, 10); sp('wisp', 150, 3);

  // Goal pedestal at the far right
  box(W - 4, 0, W - 4, 12, 'X');
  sp('timepart', W - 7, 8);

  SDD.levels = SDD.levels || {};
  SDD.levels['5-1'] = {
    width: W, height: H, ground: GROUND,
    tiles: t, spawns: spawns, movers: [],
    name: 'THE SKIES', theme: 'bird-sky',
    flappy: true, flappySpeed: 1.4, flappyFlap: 3.6,
    flappyGravity: 0.85, flappyMaxFall: 4.5
  };
})();
