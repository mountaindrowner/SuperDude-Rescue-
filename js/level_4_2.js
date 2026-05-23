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

  // ============== TEACH (0-50): floaty intro on a small island ==============
  ground(0, 18);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  qb(13, 6, 'G');
  sp('walker', 16, 10);

  // First cosmic-platform hop (drifting comet)
  mover(20, 9, 24, 9, 0.022, 0);
  sp('core', 22, 7);

  // Tiny landing island
  box(26, 10, 29, 13, 'X');
  sp('core', 27, 8);

  // Two more drifting platforms with cores
  mover(31, 8, 35, 8, 0.022, 1.2);
  sp('core', 33, 6);
  mover(38, 7, 42, 7, 0.022, 0.4);
  sp('core', 40, 5);

  // ============== TEST (45-110): rhythm of cosmic platforms =========
  // Mid-air "starbase" island
  box(46, 6, 50, 7, 'X');
  qb(48, 4, '?');
  sp('core', 47, 5); sp('core', 49, 5); sp('core', 48, 3);
  sp('wisp', 52, 4);

  // Vertical-bobbing platforms (rise + fall, big amplitude under low-g)
  mover(54, 9, 57, 3, 0.025, 0);
  mover(60, 3, 63, 9, 0.025, 1.6);
  mover(66, 9, 69, 3, 0.025, 3.2);
  sp('core', 55, 7); sp('core', 61, 5); sp('core', 67, 7);

  // Mini moon
  box(73, 5, 78, 6, 'X');
  sp('core', 74, 3); sp('core', 76, 3); sp('core', 78, 3);
  qb(75, 3, '?');

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

  // Meteors sweep through the climbing zone
  meteor(100, 2, 100, 1);
  meteor(118, 2, 100, -1);

  // Descending chain back to a small island
  mover(122, 2, 125, 5, 0.024, 0);
  mover(127, 5, 130, 8, 0.024, 1.2);
  sp('core', 123, 1); sp('core', 128, 4);

  // Small island
  box(133, 9, 136, 10, 'X');
  sp('thrower', 134, 8);
  sp('core', 134, 7); sp('core', 136, 7);

  // Wide meteor field - 3 drifting platforms + 3 meteors crossing
  mover(140, 8, 144, 8, 0.022, 0);
  mover(147, 6, 151, 6, 0.022, 1.5);
  mover(154, 8, 158, 8, 0.022, 0.5);
  meteor(140, 3, 90, 1);
  meteor(160, 3, 90, -1);
  meteor(150, 2, 110, 1);
  sp('core', 142, 6); sp('core', 149, 4); sp('core', 156, 6);
  sp('wisp', 145, 3); sp('wisp', 153, 4);

  // ============== REWARD (165-259): final cosmic descent ============
  // Wider platforms for the final stretch (Mark's "jumping comets")
  mover(165, 7, 170, 7, 0.020, 0);
  mover(174, 5, 179, 5, 0.020, 1.5);
  mover(183, 7, 188, 7, 0.020, 3.0);
  mover(192, 4, 197, 4, 0.020, 0);
  sp('core', 167, 5); sp('core', 176, 3); sp('core', 185, 5); sp('core', 194, 2);

  // Meteor finale
  meteor(178, 1, 70, 1);
  meteor(188, 1, 70, -1);

  // Goal island at altitude
  box(200, 5, 207, 6, 'X');
  oneway(209, 213, 5);
  box(215, 4, 222, 5, 'X');                                // goal pedestal at altitude
  box(259, 0, 259, 13, 'X');
  sp('timepart', 218, 3);
  sp('walker', 204, 5);
  sp('wisp', 211, 3); sp('wisp', 225, 4);
  sp('core', 202, 3); sp('core', 210, 3); sp('core', 218, 2);
  sp('core', 230, 7); sp('core', 240, 9); sp('core', 250, 9);
  // Decorative ground stripe across the bottom so the world has SOMETHING
  // below the cosmic platforms - prevents pit anxiety.
  ground(225, 258);
  // few last cores at ground level for safety
  sp('core', 245, 9); sp('core', 255, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['4-2'] = {
    width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers,
    gravityScale: 0.35, name: 'MOON & STARS', theme: 'cosmic-night'
  };
})();
