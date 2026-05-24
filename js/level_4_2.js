// level_4_2.js - Day 4-2 "MOON & STARS" (Pass 5 redesign, ~260 tiles).
// Signature mechanic: LOW GRAVITY + drifting meteors. Mark's note:
// "less land, more moving themed platforms" - the level is now mostly
// drifting cosmic platforms (stars / comets / moons) with sparse
// island ground. Danny floats from one cosmic platform to the next.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 260, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y) { spawns.push({ type: t_, tx: x, ty: y }); }
  function meteor(x, y, period, dir) {
    spawns.push({ type: 'skyhazard', kind: 'meteor', tx: x, ty: y, period: period || 120, dir: dir || 1 });
  }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // ============== TEACH (0-30): floaty intro on a tiny moonlet ==========
  // Shorter starting island, then a drifting comet bridge to a small
  // mid-air moonlet - the level reads as "space platforms" from the
  // very first second instead of "stand on a long ground stripe".
  ground(0, 7);                                            // tiny starting moonlet
  sp('player', 3, 10);
  sp('core', 6, 9);

  // Drifting comet bridges the first gap.
  mover(9, 10, 14, 10, 0.022, 0);
  qb(11, 6, 'G');                                          // growth power-up over the gap (bonk while crossing)
  sp('core', 12, 8);

  // Small landing moonlet with the first walker
  box(17, 10, 21, 13, 'X');
  sp('walker', 19, 9);
  sp('core', 19, 8);

  // First cosmic-platform hop (drifting comet)
  mover(23, 9, 28, 9, 0.022, 0);
  sp('core', 25, 7);

  // Tiny landing island
  box(29, 10, 31, 13, 'X');
  sp('core', 30, 8);

  // Two more drifting platforms with cores
  mover(31, 8, 35, 8, 0.022, 1.2);
  sp('core', 33, 6);
  mover(38, 7, 42, 7, 0.022, 0.4);
  sp('core', 40, 5);

  // ============== TEST (45-110): rhythm of cosmic platforms =========
  // Mid-air "starbase" island. qb moved up to row 2 so Big Danny
  // can actually stand on the starbase under it - row 4 put the
  // block in Big Danny's body region (head pixel 60 vs block
  // bottom 80).
  box(46, 6, 50, 7, 'X');
  qb(48, 2, '?');
  sp('core', 47, 5); sp('core', 49, 5); sp('core', 48, 4);
  sp('wisp', 52, 4);

  // Vertical-bobbing platforms (rise + fall, big amplitude under low-g)
  mover(54, 9, 57, 3, 0.025, 0);
  mover(60, 3, 63, 9, 0.025, 1.6);
  mover(66, 9, 69, 3, 0.025, 3.2);
  sp('core', 55, 7); sp('core', 61, 5); sp('core', 67, 7);

  // Mini moon
  box(73, 5, 78, 6, 'X');
  sp('core', 74, 3); sp('core', 76, 3); sp('core', 78, 3);
  qb(75, 1, '?');                                          // raised to row 1 so Big Danny fits

  // Long drifting comet to next island
  mover(81, 6, 88, 6, 0.018, 0);
  sp('core', 85, 4);

  // Mid island
  box(91, 8, 95, 9, 'X');
  sp('walker', 93, 7);
  sp('core', 92, 6); sp('core', 95, 6);

  // ============== TWIST (100-180): meteors + climbing platforms =====
  // Vertical climbing tower of moving platforms
  mover(100, 9, 103, 9, 0.024, 0);
  mover(105, 7, 108, 5, 0.024, 1.3);                       // climbs
  mover(110, 5, 113, 3, 0.024, 2.6);                       // higher
  mover(115, 3, 118, 1, 0.024, 0.5);                       // sky-high
  sp('core', 101, 7); sp('core', 107, 4); sp('core', 112, 2); sp('core', 117, 0);
  qb(117, 0, 'B');                                         // blast at the top

  // Pass 9 Mark: "Maybe in this one, no meteors. It's pretty tough
  // on day four two. Maybe this one should have these clouds. Maybe
  // this one shouldn't have any barriers at all. Just scattered
  // parkour." All meteor spawners removed - the challenge here is
  // pure platform-hopping in low gravity.

  // Descending chain back to a small island
  mover(122, 2, 125, 5, 0.024, 0);
  mover(127, 5, 130, 8, 0.024, 1.2);
  sp('core', 123, 1); sp('core', 128, 4);

  // Small island
  box(133, 9, 136, 10, 'X');
  // Removed the thrower here per Mark - already plenty of meteor +
  // wisp hazards in this stretch, no need for the purple launcher too.
  sp('core', 134, 7); sp('core', 136, 7);

  // Wide meteor field - 3 drifting platforms + 3 meteors crossing
  mover(140, 8, 144, 8, 0.022, 0);
  mover(147, 6, 151, 6, 0.022, 1.5);
  mover(154, 8, 158, 8, 0.022, 0.5);
  sp('core', 142, 6); sp('core', 149, 4); sp('core', 156, 6);
  sp('wisp', 145, 3); sp('wisp', 153, 4);

  // ============== REWARD (165-259): final cosmic descent ============
  // Wider platforms for the final stretch (Mark's "jumping comets")
  mover(165, 7, 170, 7, 0.020, 0);
  mover(174, 5, 179, 5, 0.020, 1.5);
  mover(183, 7, 188, 7, 0.020, 3.0);
  mover(192, 4, 197, 4, 0.020, 0);
  sp('core', 167, 5); sp('core', 176, 3); sp('core', 185, 5); sp('core', 194, 2);

  // Goal island at altitude - last island in the void.
  box(200, 5, 207, 6, 'X');
  oneway(209, 213, 5);
  box(215, 4, 222, 5, 'X');                                // goal pedestal at altitude
  box(259, 0, 259, 13, 'X');                               // right wall (end of level)
  sp('timepart', 218, 3);
  sp('walker', 204, 5);
  sp('wisp', 211, 3);
  sp('core', 202, 3); sp('core', 210, 3); sp('core', 218, 2);
  // Bottom decorative ground removed - the level is fully "space" now.
  // Goal is at col 218 so the player never needs to walk past it; the
  // right-side void (cols 224-258) is just visual breathing room
  // before the right-wall. Falling past the bottom triggers the
  // engine's standard pit-death (same as the other walking levels).

  SDD.levels = SDD.levels || {};
  SDD.levels['4-2'] = {
    width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers,
    gravityScale: 0.32, jumpScale: 0.75,
    // Open void: floating too far above the top of the map kills the
    // player same as falling off the bottom. Mark Pass 9: "no barriers
    // on the top or bottom. If you go too high or too low, you die."
    topDeath: true,
    name: 'MOON & STARS', theme: 'cosmic-night'
  };
})();
