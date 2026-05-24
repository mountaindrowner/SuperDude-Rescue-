// level_3_2.js - Day 3-2 "VEGETATION" (Pass 3 redesign, ~260 tiles).
// Signature mechanic: vine climbing -> vine MAZE. Teach: 1 vine ->
// Test: 2 vines, pick one -> Twist: vertical vine grid above pits ->
// Reward: vine-maze gate before the goal (only one vine leads up).
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 260, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function vine(x, y0, y1) { for (var y = y0; y <= y1; y++) setT(x, y, 'V'); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // Helper: ledge from (x0,y0) to (x1,y1) with vines passing through it.
  // At vine columns the ledge tiles become one-way (=) so the player
  // can walk across the ledge from above but pass through them while
  // climbing up. Vine itself extends from one row ABOVE the ledge top
  // down to ground row 10, with the ledge rows in between kept as = so
  // the ledge stays walkable.
  function canopy(x0, y0, x1, y1, vineCols) {
    for (var x = x0; x <= x1; x++) {
      var isVine = vineCols.indexOf(x) >= 0;
      for (var y = y0; y <= y1; y++) {
        setT(x, y, isVine ? '=' : 'X');
      }
    }
    for (var i = 0; i < vineCols.length; i++) {
      var vc = vineCols[i];
      setT(vc, y0 - 1, 'V');                     // vine above ledge
      for (var vy = y1 + 1; vy <= 10; vy++) setT(vc, vy, 'V');   // below ledge
    }
  }

  // ============== TEACH (0-50): introduce the vine ==============
  ground(0, 30);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  qb(13, 7, 'G');
  sp('walker', 18, 10);
  sp('core', 16, 9); sp('core', 22, 9);

  // First single vine - hanging from a high ledge with cores on top.
  // Vine extends through the ledge as a one-way (solid from above when
  // walking, pass-through when climbing up).
  canopy(28, 4, 32, 5, [30]);
  sp('core', 30, 3); sp('core', 31, 3); sp('core', 29, 3);

  ground(33, 60);
  sp('walker', 38, 10);
  sp('wisp', 44, 6);
  sp('core', 36, 9); sp('core', 42, 9); sp('core', 48, 9); sp('core', 56, 9);

  // ============== TEST (60-130): two vines, pick one ==============
  ground(61, 110);
  canopy(64, 4, 80, 5, [66, 78]);                          // canopy w/ 2 vines
  sp('core', 66, 7); sp('core', 78, 7);
  sp('core', 70, 3); sp('core', 72, 3); sp('core', 74, 3); sp('core', 76, 3);
  qb(75, 3, '?');                                          // bonus
  sp('thrower', 72, 10);                                   // threat at ground level
  // gap and another canopy section
  ground(82, 110);
  canopy(85, 3, 105, 4, [88, 93, 98, 102]);                // canopy w/ 4 vines
  sp('core', 90, 2); sp('core', 95, 2); sp('core', 100, 2);
  sp('wisp', 96, 6);
  qb(102, 1, 'B');                                         // blast tucked at top
  sp('walker', 107, 10);

  // ============== TWIST (115-185): vertical vines over pits ==============
  ground(112, 130);
  sp('thrower', 118, 10);
  sp('core', 114, 9); sp('core', 122, 9); sp('core', 128, 9);

  // PIT with multiple vines hanging from the ceiling (climb or swing
  // across). Gaps tightened to 5 cols so the swing-jump is actually
  // reachable - the old 6/7-col gaps were beyond small Danny's jump
  // arc (max ~5 tiles). Vines extend to row 1 so they look rooted
  // to the canopy. Player auto-grabs the next vine on the way down.
  box(131, 0, 131, 4, 'X');                                // anchor for vines
  box(180, 0, 180, 4, 'X');
  vine(135, 1, 10);
  vine(140, 1, 9);
  vine(145, 1, 11);
  vine(150, 1, 8);
  vine(155, 1, 10);
  vine(160, 1, 9);
  vine(165, 1, 11);
  vine(170, 1, 9);
  vine(175, 1, 10);
  sp('core', 135, 6); sp('core', 140, 6); sp('core', 145, 6);
  sp('core', 150, 6); sp('core', 155, 6); sp('core', 160, 6);
  sp('core', 165, 6); sp('core', 170, 6); sp('core', 175, 6);
  sp('wisp', 142, 4); sp('wisp', 157, 3); sp('wisp', 172, 4);

  ground(181, 215);
  box(188, 9, 192, 13, 'X');
  sp('walker', 197, 10);
  sp('core', 184, 9); sp('core', 190, 7); sp('core', 200, 9); sp('core', 208, 9);

  // ============== REWARD (215-259): vine climb to a canopy ==============
  // Open ground at the base - walk in from the left. Vines pass through
  // the canopy as one-way tiles so any climb path reaches the top.
  ground(215, 232);
  canopy(220, 4, 232, 5, [222, 225, 229]);                 // canopy w/ 3 vines
  // A free-hanging vine outside the canopy on the left for variety
  // (extends from row 4 to ground - top at row 4 is at canopy top level
  // so the player can step right onto the canopy from its top).
  for (var rv = 4; rv <= 10; rv++) setT(218, rv, 'V');
  // Cores on each vine to encourage exploration.
  sp('core', 218, 7); sp('core', 222, 7); sp('core', 225, 7);
  sp('core', 229, 7); sp('core', 226, 3);

  // After the canopy, the ground resumes for the run to the goal.
  ground(233, 259);
  box(240, 8, 244, 13, 'X');
  box(248, 7, 252, 13, 'X');                               // goal pedestal
  box(259, 0, 259, 13, 'X');
  sp('timepart', 250, 6);
  sp('walker', 237, 10); sp('wisp', 246, 4);
  sp('core', 235, 9); sp('core', 241, 7); sp('core', 248, 6);
  sp('core', 250, 5); sp('core', 254, 9); sp('core', 257, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['3-2'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'VEGETATION', theme: 'forest' };
})();
