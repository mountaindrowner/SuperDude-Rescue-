// level_6_2.js - Day 6-2 "MANKIND" (Pass 3 redesign, ~240 tiles).
// Signature mechanic: NPC TRAIL / village navigation. Friendly chain
// of NPCs, almost no combat. Cooldown level after the 6-1 gauntlet.
// Teach: greet 1 NPC -> Test: short path between 2 NPCs -> Twist:
// village navigation with a few hazards -> Reward: final NPC at goal.
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
  var spawns = []; function sp(t_, x, y, k) { var o = { type: t_, tx: x, ty: y }; if (k) o.kind = k; spawns.push(o); }
  var movers = []; function mover(tx, ty, tx1, ty1, spd, ph) {
    movers.push({ tx: tx, ty: ty, tx1: tx1, ty1: ty1, spd: spd || 0.018, phase: ph || 0 });
  }

  // ============== TEACH (0-50): first friendly meeting ==============
  ground(0, 35);
  sp('player', 3, 10);
  sp('core', 6, 9); sp('core', 9, 9);
  // FIRST NPC right on the path
  sp('npc', 14, 10, 'adam');
  sp('core', 12, 7); sp('core', 16, 7); sp('core', 19, 9);
  // Early growth power-up on a small village rooftop - have to
  // jump onto the roof box first to bonk it. Mark's "at least one
  // power-up early, behind a hard-access spot."
  box(24, 8, 27, 10, 'X');                                 // small house roof
  qb(25, 6, 'G');
  sp('core', 25, 7);

  // a single mild walker
  sp('walker', 24, 10);
  sp('core', 26, 9); sp('core', 30, 9); sp('core', 33, 9);

  // ============== TEST (40-100): two NPCs separated by a gap ==============
  mover(36, 9, 39, 9, 0.022, 0);
  sp('core', 37, 7);

  ground(41, 80);
  sp('npc', 46, 10, 'adam');                               // second NPC
  sp('core', 44, 9); sp('core', 48, 9);

  // gentle path with a few cores
  qb(54, 7, '?');
  sp('wisp', 60, 6);                                       // single bat flyer
  sp('core', 56, 9); sp('core', 60, 4); sp('core', 65, 9); sp('core', 70, 9);

  sp('npc', 76, 10, 'adam');                               // third NPC
  sp('core', 74, 7); sp('core', 78, 7);

  // ============== TWIST (80-160): village navigation ==============
  // small bridges + houses (just visual decoration via bricks)
  ground(82, 130);
  box(88, 9, 92, 10, 'X');                                 // house 1 (low platform on top)
  box(96, 8, 102, 10, 'X');                                // house 2 (taller)
  box(108, 9, 112, 10, 'X');                               // house 3
  qb(100, 6, '?');
  oneway(105, 107, 7);
  sp('npc', 94, 10, 'adam');                               // NPC in front of house 2
  sp('walker', 117, 10);                                   // mild challenge
  sp('wisp', 105, 5);
  // Mid-stage checkpoint flag - between the houses in the village square.
  sp('checkpoint', 120, 10);
  // Day 6-2 signature: FRIENDSHIP TOKEN - NPCs gift 5 cores instead
  // of 3 for the rest of the stage. Sits between the second + third
  // NPCs so the kid still has unmet villagers to spend it on.
  spawns.push({ type: 'signature', tx: 60, ty: 10, kind: 'friendshiptoken' });
  sp('core', 84, 9); sp('core', 90, 8); sp('core', 100, 5);
  sp('core', 110, 8); sp('core', 115, 9); sp('core', 122, 9);
  sp('core', 127, 9);

  // small gap (village edge)
  mover(131, 9, 134, 9, 0.022, 0);
  sp('core', 133, 7);

  ground(136, 175);
  sp('npc', 142, 10, 'adam');                              // fourth NPC
  box(148, 8, 154, 10, 'X');                               // big house
  qb(152, 6, 'G');                                         // grow block on a house!
  sp('wisp', 158, 6); sp('walker', 165, 10);
  sp('core', 140, 9); sp('core', 145, 7); sp('core', 152, 5);
  sp('core', 160, 6); sp('core', 168, 9); sp('core', 173, 9);

  // ============== REWARD (175-239): village square + final NPC ==============
  ground(177, 239);
  // open village square
  box(184, 9, 188, 10, 'X');                               // central well/platform
  oneway(192, 198, 7);                                     // bridge
  sp('npc', 200, 10, 'adam');                              // fifth NPC near goal
  box(206, 9, 210, 13, 'X');
  box(214, 8, 220, 13, 'X');                               // goal pedestal
  box(239, 0, 239, 13, 'X');
  sp('timepart', 216, 7);
  sp('wisp', 196, 5);                                      // mild flyer
  sp('core', 182, 9); sp('core', 186, 8); sp('core', 194, 6);
  sp('core', 200, 7); sp('core', 208, 8); sp('core', 216, 6);
  sp('core', 225, 9); sp('core', 232, 9); sp('core', 237, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['6-2'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: movers, name: 'MANKIND', theme: 'village-dusk' };
})();
