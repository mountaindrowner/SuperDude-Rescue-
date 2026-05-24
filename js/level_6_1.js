// level_6_1.js - Day 6-1 "WILD ANIMALS" (Pass 3 redesign, ~240 tiles).
// Signature mechanic: ENEMY GAUNTLET. Teach: 1 enemy -> Test: a pair
// -> Twist: small wave + blast power-up acquired -> Reward: cleared
// path through a big wave.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 240, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  function oneway(x0, x1, y) { for (var x = x0; x <= x1; x++) setT(x, y, '='); }
  function qb(x, y, ch) { setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y, variant) { spawns.push({ type: t_, tx: x, ty: y, variant: variant }); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // ============== TEACH (0-50): 1 enemy at a time ==============
  ground(0, 30);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  qb(13, 7, 'G');                                          // grow early - need it
  sp('walker', 18, 10, 'porcupine');                       // first porcupine
  sp('core', 16, 9); sp('core', 22, 9); sp('core', 26, 9);

  ground(31, 60);
  // open arena with one wisp
  sp('wisp', 38, 7);
  qb(42, 7, '?');
  sp('walker', 48, 10, 'lion');                            // first prowling lion
  sp('core', 33, 9); sp('core', 38, 5); sp('core', 44, 9); sp('core', 54, 9);

  // ============== TEST (60-130): pairs of enemies ==============
  // First pair - one of each
  ground(61, 100);
  sp('walker', 68, 10, 'porcupine'); sp('walker', 75, 10, 'lion');
  sp('wisp', 72, 5);
  sp('core', 65, 9); sp('core', 72, 4); sp('core', 78, 9); sp('core', 88, 9);

  // pair + thrower
  sp('thrower', 92, 10);
  sp('walker', 84, 10, 'porcupine');
  sp('wisp', 96, 4);
  sp('core', 92, 7); sp('core', 96, 2);

  // ============== TWIST (100-180): BLAST acquired, small wave ==============
  // gap with platform
  mover(101, 9, 105, 9, 0.022, 0);
  sp('core', 103, 7);

  ground(107, 145);
  // Blast power-up arc: tower with the blast at top
  box(112, 6, 115, 7, 'X');
  oneway(118, 122, 4);
  qb(120, 2, 'B');                                         // blast block - REWARD for climbing
  sp('thrower', 125, 10);                                  // hide a thrower below
  sp('wisp', 116, 4);
  sp('core', 113, 4); sp('core', 120, 1); sp('core', 130, 9); sp('core', 138, 9);

  // wave 1: pride of lions clustered (blast-clearable)
  sp('walker', 132, 10, 'lion'); sp('walker', 138, 10, 'lion'); sp('walker', 144, 10, 'porcupine');

  // ============== TWIST 2 (145-200): bigger waves ==============
  ground(147, 200);
  // mixed savanna dense line - lions on the hunt + a few porcupines
  sp('walker', 152, 10, 'lion');     sp('walker', 158, 10, 'porcupine');
  sp('walker', 164, 10, 'lion');     sp('walker', 170, 10, 'porcupine');
  sp('thrower', 176, 10);
  // platform up for safety/cores
  box(155, 8, 168, 9, 'X');
  oneway(172, 178, 6);
  sp('wisp', 168, 6); sp('wisp', 184, 4);
  qb(180, 7, '?'); qb(182, 7, '?');
  sp('core', 150, 9); sp('core', 160, 7); sp('core', 167, 7);
  sp('core', 175, 5); sp('core', 181, 5); sp('core', 188, 9);
  sp('core', 194, 9);

  // ============== REWARD (200-239): cleared path to goal ==============
  // smaller pit, easier
  mover(201, 9, 205, 9, 0.022, 0);
  sp('core', 203, 7);

  ground(207, 239);
  box(213, 9, 216, 13, 'X');
  box(220, 8, 224, 13, 'X');                               // goal pedestal
  box(239, 0, 239, 13, 'X');
  sp('timepart', 222, 7);
  sp('walker', 211, 10, 'lion');                           // last lone lion
  sp('core', 209, 9); sp('core', 215, 7); sp('core', 222, 6);
  sp('core', 230, 9); sp('core', 236, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['6-1'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'WILD ANIMALS', theme: 'savanna' };
})();
