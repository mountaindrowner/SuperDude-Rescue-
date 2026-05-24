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

  // Helper: a free-hanging vine column reaching from the top of the
  // canvas down to one tile above the ground. Replaces the old
  // canopy() helper which dragged in wooden one-way ledges that Mark
  // didn't like ("those platform things, I don't totally understand
  // their function. Maybe they can go up and there's stuff up there.")
  function vineFull(x) { for (var y = 0; y <= 10; y++) setT(x, y, 'V'); }

  // ============== TEACH (0-50): introduce the vine ==============
  ground(0, 30);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  qb(13, 7, 'G');
  sp('walker', 18, 10);
  sp('core', 16, 9); sp('core', 22, 9);

  // First single vine - hangs free from above the canvas; climb up
  // to a small ring of cores in mid-air. No wooden ledge.
  vineFull(30);
  sp('core', 30, 3); sp('core', 30, 2); sp('core', 30, 1);

  ground(33, 60);
  sp('walker', 38, 10);
  sp('wisp', 44, 6);
  sp('core', 36, 9); sp('core', 42, 9); sp('core', 48, 9); sp('core', 56, 9);

  // ============== TEST (60-130): two vines, pick one ==============
  ground(61, 110);
  vineFull(66); vineFull(78);
  sp('core', 66, 7); sp('core', 78, 7);
  sp('core', 66, 3); sp('core', 66, 2); sp('core', 78, 3); sp('core', 78, 2);
  qb(72, 3, '?');                                          // bonus floats in the air between
  sp('thrower', 72, 10);                                   // threat at ground level
  // Four-vine cluster - dense climb section
  ground(82, 110);
  vineFull(88); vineFull(93); vineFull(98); vineFull(102);
  sp('core', 88, 3); sp('core', 93, 2); sp('core', 98, 3); sp('core', 102, 2);
  sp('wisp', 96, 6);
  qb(102, 1, 'B');                                         // blast tucked at top of its vine
  sp('walker', 107, 10);

  // ============== TWIST (115-185): vertical vines over pits ==============
  ground(112, 130);
  sp('thrower', 118, 10);
  sp('core', 114, 9); sp('core', 122, 9); sp('core', 128, 9);
  // Mid-stage checkpoint flag - placed before the vine pit so dying
  // in the pit puts the kid back at the safe edge.
  sp('checkpoint', 125, 10);

  // PIT with multiple vines hanging from the ceiling (climb or swing
  // across). Vines extend to row 0 (top of canvas) per Mark - reads
  // as "the canopy is way up off the screen, vines drop from above."
  // Mark's other note: drop the tall suspended ground pillars that
  // bookended the pit - they were difficulty for the sake of it.
  vine(135, 0, 10);
  vine(140, 0, 9);
  vine(145, 0, 11);
  vine(150, 0, 8);
  vine(155, 0, 10);
  vine(160, 0, 9);
  vine(165, 0, 11);
  vine(170, 0, 9);
  vine(175, 0, 10);
  sp('core', 135, 6); sp('core', 140, 6); sp('core', 145, 6);
  sp('core', 150, 6); sp('core', 155, 6); sp('core', 160, 6);
  sp('core', 165, 6); sp('core', 170, 6); sp('core', 175, 6);
  sp('wisp', 142, 4); sp('wisp', 157, 3); sp('wisp', 172, 4);

  ground(181, 215);
  box(188, 9, 192, 13, 'X');
  sp('walker', 197, 10);
  sp('core', 184, 9); sp('core', 190, 7); sp('core', 200, 9); sp('core', 208, 9);

  // ============== REWARD (215-259): VINE-MAZE GATE before the goal ==
  // Mark Pass 2 / Pass 9: "a vine-maze gate right before the goal,
  // reusing the existing climb mechanic. Only one vine path leads up
  // correctly." Implementation: a solid wall blocks forward progress
  // and the path up. 5 vines hang in front of the wall. Four are
  // dead-ends - the wall stays solid above them so climbing bumps the
  // head. ONE vine has a gap cut in the wall above it and continues
  // up to the canopy line - that's the only way through.
  ground(215, 259);
  // Solid wall blocking the air-route at rows 2-3 across the section
  box(217, 2, 233, 3, 'X');
  // Decorative hints above the wall - canopy silhouette
  // (just paint via tiles? No - parallax handles it. Leave clear.)
  // Five hanging vines from row 4 down to ground (row 10). Four are
  // "wrong" - they end at row 4 (wall blocks the climb). The CORRECT
  // vine (the centre one, col 225) extends all the way to row 0
  // because the wall has a gap cut above it.
  vine(219, 4, 10);                              // wrong
  vine(222, 4, 10);                              // wrong
  vine(225, 0, 10);                              // CORRECT
  setT(225, 2, 'V'); setT(225, 3, 'V');          // continue through the gap
  vine(228, 4, 10);                              // wrong
  vine(231, 4, 10);                              // wrong
  // Small "BLESSING" platform above the wall, just to the right of
  // the correct vine - this is where Danny lands after climbing
  // through and finds the time-machine part.
  box(226, 1, 232, 1, '=');                      // one-way platform at row 1
  sp('timepart', 229, 0);
  // Cores per vine - reward exploration, hint where to try
  sp('core', 219, 6); sp('core', 219, 5);
  sp('core', 222, 6); sp('core', 222, 5);
  sp('core', 225, 6); sp('core', 225, 5);
  sp('core', 225, 4); sp('core', 225, 1);        // bonus cores along the winning path
  sp('core', 228, 6); sp('core', 228, 5);
  sp('core', 231, 6); sp('core', 231, 5);
  sp('core', 227, 0); sp('core', 231, 0);        // goal-area cores
  // Right-wall closer
  box(259, 0, 259, 13, 'X');
  sp('walker', 237, 10);
  sp('core', 240, 9); sp('core', 245, 9); sp('core', 251, 9); sp('core', 256, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['3-2'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'VEGETATION', theme: 'forest' };
})();
