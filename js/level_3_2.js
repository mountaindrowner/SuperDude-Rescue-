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

  // ============== TEACH (0-50): introduce the vine ==============
  ground(0, 30);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  qb(13, 7, 'G');
  sp('walker', 18, 10);
  sp('core', 16, 9); sp('core', 22, 9);

  // First single vine - hanging from a high ledge with cores at top
  box(28, 4, 32, 5, 'X');                                  // ledge with cores on top
  vine(30, 6, 10);
  sp('core', 30, 3); sp('core', 31, 3); sp('core', 29, 3);

  ground(33, 60);
  sp('walker', 38, 10);
  sp('wisp', 44, 6);
  sp('core', 36, 9); sp('core', 42, 9); sp('core', 48, 9); sp('core', 56, 9);

  // ============== TEST (60-130): two vines, pick one ==============
  ground(61, 110);
  box(64, 4, 80, 5, 'X');                                  // canopy ledge
  vine(66, 6, 10);                                          // left vine
  vine(78, 6, 10);                                          // right vine
  sp('core', 66, 7); sp('core', 78, 7);
  sp('core', 70, 3); sp('core', 72, 3); sp('core', 74, 3); sp('core', 76, 3);
  qb(75, 3, '?');                                          // bonus
  sp('thrower', 72, 10);                                   // threat at ground level
  // gap and another canopy section
  ground(82, 110);
  box(85, 3, 105, 4, 'X');
  vine(88, 5, 10);
  vine(93, 5, 10);
  vine(98, 5, 10);
  vine(102, 5, 10);
  sp('core', 90, 2); sp('core', 95, 2); sp('core', 100, 2);
  sp('wisp', 96, 6);
  qb(102, 1, 'B');                                         // blast tucked at top
  sp('walker', 107, 10);

  // ============== TWIST (115-185): vertical vines over pits ==============
  ground(112, 130);
  sp('thrower', 118, 10);
  sp('core', 114, 9); sp('core', 122, 9); sp('core', 128, 9);

  // PIT with multiple vines hanging from the ceiling (climb or swing
  // across). Vines extend all the way up to row 1 so they look rooted
  // to the canopy / sky instead of floating in mid-air.
  box(131, 0, 131, 4, 'X');                                // anchor for vines
  box(180, 0, 180, 4, 'X');
  vine(135, 1, 10);
  vine(141, 1, 9);
  vine(147, 1, 11);
  vine(154, 1, 8);
  vine(161, 1, 10);
  vine(168, 1, 9);
  vine(175, 1, 11);
  sp('core', 135, 6); sp('core', 141, 6); sp('core', 147, 6);
  sp('core', 154, 6); sp('core', 161, 6); sp('core', 168, 6); sp('core', 175, 6);
  sp('wisp', 140, 4); sp('wisp', 152, 3); sp('wisp', 165, 4);

  ground(181, 215);
  box(188, 9, 192, 13, 'X');
  sp('walker', 197, 10);
  sp('core', 184, 9); sp('core', 190, 7); sp('core', 200, 9); sp('core', 208, 9);

  // ============== REWARD (215-259): vine climb to a canopy ==============
  // Open ground at the base - walk in from the left. Four vines
  // run from the canopy ledge down to ground level so any climb works
  // (the original "maze" had a ceiling that sealed the gate). Goal is
  // the time-machine part further along, after dropping off the canopy.
  ground(215, 232);
  // Canopy ledge - tall enough that you must climb to reach it.
  box(220, 4, 232, 5, 'X');
  // Four vines, all reaching from canopy down to ground.
  vine(218, 6, 10);
  vine(222, 6, 10);
  vine(225, 6, 10);
  vine(229, 6, 10);
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
