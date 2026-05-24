// level_7_1.js - Day 7-1 "DAY OF REST" (Pass 3 expansion, ~200 tiles).
// Calm Eden garden - no enemies, no pits, no hazards. Just NPCs to
// greet and power cores to gather. Reaching the time-machine part
// triggers the grand finale. Now ~2x wider with rolling hills,
// more NPCs, decorative bumps.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var W = 200, H = 14, GROUND = 11;
  var t = []; for (var r = 0; r < H; r++) { var row = []; for (var c = 0; c < W; c++) row.push(' '); t.push(row); }
  function setT(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) t[y][x] = ch; }
  function ground(x0, x1) { for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) setT(x, y, 'X'); }
  function box(x0, y0, x1, y1, ch) { ch = ch || 'X'; for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) setT(x, y, ch); }
  var spawns = []; function sp(t_, x, y, k) { var o = { type: t_, tx: x, ty: y }; if (k) o.kind = k; spawns.push(o); }

  // unbroken peaceful ground - no pits, no danger
  ground(0, W - 1);

  sp('player', 3, 10);

  // gentle rolling hills as decoration
  box(15, 10, 17, 13, 'X');
  box(28, 10, 30, 13, 'X');
  box(42, 9, 45, 13, 'X');
  box(58, 10, 60, 13, 'X');
  box(72, 9, 75, 13, 'X');
  box(88, 10, 90, 13, 'X');
  box(102, 9, 106, 13, 'X');
  box(120, 10, 122, 13, 'X');
  box(135, 9, 138, 13, 'X');
  box(152, 10, 154, 13, 'X');
  box(168, 9, 171, 13, 'X');

  // Roaming Eden animals - decorative, no harm, no cores. Doves
  // perch higher in the air; deer and lions stand at ground level.
  sp('npc', 12, 10, 'deer');
  sp('npc', 26, 10, 'lion');
  sp('npc', 38,  5, 'dove');                  // dove perched mid-air
  sp('npc', 48, 10, 'deer');
  sp('npc', 64, 10, 'lion');
  sp('npc', 76,  4, 'dove');
  sp('npc', 92, 10, 'deer');
  sp('npc', 110, 10, 'lion');
  sp('npc', 128,  5, 'dove');
  sp('npc', 142, 10, 'deer');
  sp('npc', 158, 10, 'lion');
  sp('npc', 174,  4, 'dove');

  // Mid-stage checkpoint flag - peaceful stage, still gets one for
  // visual consistency with the other days.
  sp('checkpoint', 100, 10);
  // Day 7-1 signature: DOVE BLESSING - bonus power cores rain from
  // the canopy as Danny walks. A celebratory final-day reward.
  spawns.push({ type: 'signature', tx: 60, ty: 10, kind: 'doveblessing' });

  // A few Adam + Eve NPCs scattered along the way that DO give cores
  // for greeting them - rewards exploration.
  sp('npc', 20, 10, 'adam');
  sp('npc', 56, 10, 'eve');
  sp('npc', 84, 10, 'adam');
  sp('npc', 118, 10, 'eve');
  sp('npc', 150, 10, 'adam');

  // Generous trail of power cores - celebratory final harvest
  for (var x = 6; x <= 180; x += 3) sp('core', x, 6 + (x % 5));

  // Pedestal with the final time-machine part - Adam AND Eve both
  // greet Danny at the end (Mark Pass 9: 'Adam + Eve at the goal').
  box(184, 8, 190, 13, 'X');
  box(199, 0, 199, 13, 'X');
  sp('timepart', 187, 7);
  sp('npc', 191, 10, 'adam');
  sp('npc', 195, 10, 'eve');
  // Dove perched above the time-part as a final blessing
  sp('npc', 187, 3, 'dove');
  // Pass 10 round 2 (Mark): the time-part radiates alone - cores
  // flank it left/right but nothing directly above.
  sp('core', 184, 6); sp('core', 190, 6);
  sp('core', 194, 9); sp('core', 196, 9);

  SDD.levels = SDD.levels || {};
  SDD.levels['7-1'] = { width: W, height: H, ground: GROUND, tiles: t, spawns: spawns, movers: [], name: 'DAY OF REST', theme: 'eden' };
})();
