// level_6_1.js - Day 6-1 "WILD ANIMALS" (Pass 9 multi-biome redesign).
// Three connected biomes within one level: plains -> forest ->
// bug-scale. Same gameplay arc (enemy gauntlet) but the world
// transforms around Danny: lions roam the open savanna, leaf-flyers
// haunt the jungle, and then Danny "shrinks" into the grass for the
// final bug-scale gauntlet where giant blades sway around him.
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

  // ============== ZONE 1 - PLAINS (cols 0-80) ==============
  // Open savanna with lions + porcupines. Same as the Pass 3 teach
  // section but tightened to fit zone width.
  ground(0, 30);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  qb(13, 7, 'G');                                          // grow early
  sp('walker', 18, 10, 'lion');                            // first lion
  sp('core', 16, 9); sp('core', 22, 9); sp('core', 26, 9);

  ground(31, 60);
  sp('wisp', 38, 7);                                       // savanna bird
  qb(42, 7, '?');
  sp('walker', 48, 10, 'porcupine');                       // pair: lion + porcupine
  sp('walker', 52, 10, 'lion');
  sp('core', 33, 9); sp('core', 38, 5); sp('core', 44, 9); sp('core', 54, 9);

  // Plains-to-jungle transition - a few acacia stumps as the savanna
  // begins to give way to denser trees.
  ground(61, 80);
  box(64, 9, 66, 13, 'X');                                 // small log
  box(72, 9, 74, 13, 'X');
  sp('walker', 70, 10, 'lion');                            // last plains lion
  sp('core', 65, 8); sp('core', 73, 8); sp('core', 78, 9);

  // ============== ZONE 2 - JUNGLE (cols 80-160) ==============
  // Leaf-themed enemies, hanging vines, denser obstacles. Forest
  // wisps replace the savanna birds.
  ground(81, 110);
  sp('walker', 86, 10, 'leaf');                            // leaf-walker (jungle creature)
  sp('wisp', 92, 6, 'leaf');                               // falling leaf flyer
  sp('core', 82, 9); sp('core', 86, 7); sp('core', 92, 4); sp('core', 98, 9);

  // Mid-jungle: vine + blast power-up arc
  box(102, 6, 105, 7, 'X');                                // log perch
  oneway(108, 112, 4);                                     // high one-way
  qb(110, 2, 'B');                                         // blast tucked up high
  sp('thrower', 115, 10, 'seed');                          // seed-spitter
  sp('wisp', 106, 4, 'leaf');
  sp('core', 103, 4); sp('core', 110, 1); sp('core', 116, 9); sp('core', 124, 9);

  ground(111, 145);
  // Mid-stage checkpoint flag - between the blast arc and the jungle pack.
  sp('checkpoint', 118, 10);
  // Day 6-1 signature: CALLING HORN freezes every enemy on the level
  // for the duration. Placed before the jungle pack so the kid can
  // walk straight through the pride if they time it right.
  spawns.push({ type: 'signature', tx: 50, ty: 10, kind: 'callinghorn' });
  // Pride / jungle pack (wave of mixed enemies)
  sp('walker', 122, 10, 'leaf'); sp('walker', 130, 10, 'porcupine');
  sp('walker', 138, 10, 'leaf');
  sp('wisp', 134, 5, 'leaf');
  sp('core', 122, 9); sp('core', 130, 9); sp('core', 138, 9); sp('core', 144, 9);

  // ============== ZONE 3 - BUG-SCALE (cols 160-239) ==============
  // Danny has "shrunk" - giant grass blades fill the parallax. The
  // gameplay is the densest enemy gauntlet of the level. Porcupines
  // re-skin as beetles (small, armoured, ground-walkers), leaf wisps
  // as butterflies. Smaller tiles + tighter terrain to sell the
  // tiny scale.
  ground(147, 165);
  // Quick bridge into the bug zone - a row of small mushroom-like
  // bumps that read as fungi at ant scale.
  box(150, 10, 151, 13, 'X');
  box(155, 10, 156, 13, 'X');
  box(160, 10, 161, 13, 'X');
  sp('walker', 152, 9, 'porcupine');                       // "beetle"
  sp('wisp', 158, 7, 'leaf');                              // "butterfly"
  sp('core', 150, 8); sp('core', 155, 8); sp('core', 160, 8);

  // Bug gauntlet: tight terrain + bouncing platforms + dense enemies
  ground(167, 200);
  mover(168, 9, 172, 9, 0.024, 0);
  mover(175, 8, 179, 8, 0.024, 1.2);
  sp('walker', 170, 10, 'porcupine');                      // beetle pack
  sp('walker', 176, 10, 'porcupine');
  sp('walker', 184, 10, 'porcupine');
  sp('wisp', 180, 5, 'leaf');                              // butterflies
  sp('wisp', 192, 4, 'leaf');
  sp('thrower', 198, 10, 'seed');                          // big ant-thrower
  sp('core', 169, 7); sp('core', 176, 6); sp('core', 184, 9);
  sp('core', 190, 5); sp('core', 195, 5);
  qb(186, 6, '?');

  // ============== REWARD (200-239): cleared path to goal ==============
  // Final stretch back to a peaceful section as Danny "grows" again.
  // Goal pedestal looks like an over-sized dewdrop on a leaf.
  ground(207, 239);
  // small lily-pad style stepping platforms (one-ways)
  oneway(202, 205, 9);
  sp('core', 203, 7);
  box(213, 9, 216, 13, 'X');                               // green ledge
  box(220, 8, 224, 13, 'X');                               // goal pedestal
  box(239, 0, 239, 13, 'X');
  sp('timepart', 222, 7);
  sp('walker', 230, 10, 'porcupine');                      // last beetle
  sp('core', 209, 9); sp('core', 215, 7); sp('core', 222, 6);
  sp('core', 230, 9); sp('core', 236, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['6-1'] = {
    width: W, height: H, ground: GROUND,
    tiles: t, spawns: spawns, movers: movers,
    name: 'WILD ANIMALS',
    theme: 'savanna',                                      // base / fallback
    // Multi-biome arc: parallax + enemy variants shift as Danny
    // walks right. Each entry: startCol where this biome takes over.
    // The scene renderer crossfades between adjacent zones over a
    // 24-col band so transitions don't snap.
    themeZones: [
      { startCol: 0,   theme: 'savanna'  },
      { startCol: 84,  theme: 'forest'   },
      { startCol: 162, theme: 'bugscale' }
    ]
  };
})();
