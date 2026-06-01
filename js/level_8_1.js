// Day 8-1: ADVENTURE CITY (v0.85 secret stage - long edition)
//
// Twice as long as v0.83 (720 cols vs 360). Three acts:
//
//   0-250   Cyber city (street + parkour + cars)
//   250-440 EXPANDED TUNNEL with multi-deck platforming. Walkable
//           upper deck on top of the overpass beam + lower street
//           level. Cars run both decks. Hard background swap to
//           cyber-dawn at the tunnel midpoint.
//   440-720 Cyber-dawn city + approach to ADVENTURE TOWER. Stage
//           ends at the tower entrance (timepart triggers the
//           cityArrival cinematic - no rescue NPCs on the level
//           itself; Mark wants the entrance to feel like a closed
//           door we pass through into the cutscene).
//
window.SDD = window.SDD || {};
SDD.levels = SDD.levels || {};

(function () {
  function rep(ch, n) { var s = ''; for (var i = 0; i < n; i++) s += ch; return s; }

  var W = 720;

  // ---- helpers ----------------------------------------------------
  function blank() { return rep(' ', W).split(''); }
  function placePlats(row, positions) {
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      for (var x = p[0]; x < p[0] + p[1]; x++) row[x] = '=';
    }
  }
  function placeSolid(row, positions) {
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      for (var x = p[0]; x < p[0] + p[1]; x++) row[x] = 'X';
    }
  }
  function carve(row, ranges) {
    for (var i = 0; i < ranges.length; i++) {
      for (var x = ranges[i][0]; x < ranges[i][0] + ranges[i][1]; x++) row[x] = ' ';
    }
  }

  // Tunnel structural footprint (cols).
  var T_START = 250, T_DAWN = 345, T_END = 440;
  // Upper deck (top of the overpass beam) sits at row 6, supported
  // by the painted concrete beam at rows 4-5. Lower street is at
  // row 11 as usual.
  var DECK_ROW = 6;

  // ---- ROW 3 (high sky parkour, drones overhead) -----------------
  var row3 = blank();
  // High parkour platforms outside the tunnel.
  placePlats(row3, [
    [44, 4], [78, 5], [120, 4], [164, 5], [210, 4],
    // After-tunnel:
    [464, 4], [510, 5], [560, 4], [608, 5], [658, 4]
  ]);

  // ---- ROW 4-5 (the OVERPASS BEAM - painted background) ----------
  // These rows are intentionally LEFT BLANK so the painted concrete
  // overpass overlay can pass behind them. The walkable upper deck
  // tiles live on row 6.

  // ---- ROW 6 (upper deck inside the tunnel) ----------------------
  var row6 = blank();
  // Outside the tunnel: a couple of high parkour stops.
  placePlats(row6, [[60, 6], [108, 5], [156, 6], [496, 6], [542, 5], [596, 6]]);
  // INSIDE tunnel: continuous upper deck with strategic gaps. Walls
  // at each end so the player can't accidentally walk off into the
  // void; mid-tunnel gaps require jumps. Deck is one-way platforms
  // ('=') so the player can drop back down to the street through them.
  placePlats(row6, [
    [T_START + 2,  20],   // entry ramp top
    [T_START + 28, 14],   // first stretch
    [T_START + 48, 10],   // narrow island
    [T_START + 64, 18],   // mid stretch
    [T_START + 88, 12],   // halfway between START+90 and DAWN
    [T_DAWN   +  6, 14],  // dawn-side first
    [T_DAWN   + 26, 16],  // dawn-side mid
    [T_DAWN   + 48, 12],  // dawn-side late
    [T_DAWN   + 66, 18],  // exit run-up
    [T_END    -  4, 6]    // exit ramp top
  ]);

  // ---- ROW 8 (mid-air parkour between ground + deck) -------------
  var row8 = blank();
  placePlats(row8, [
    [28, 5], [60, 6], [100, 5], [140, 6], [188, 5], [232, 6],
    // Tunnel approach + interior support platforms (help climb to
    // the upper deck).
    [T_START - 14, 6], [T_START + 12, 5], [T_START + 42, 5],
    [T_START + 60, 4], [T_START + 84, 5],
    [T_DAWN   +  2, 5], [T_DAWN   + 22, 5], [T_DAWN   + 44, 4],
    [T_DAWN   + 62, 5], [T_END    +  4, 6],
    // After tunnel:
    [468, 5], [508, 6], [552, 5], [598, 6], [644, 5], [690, 5]
  ]);

  // ---- GROUND (row 11) + foundation rows 12-13 -------------------
  var ground = rep('X', W).split('');
  // Street pits before tunnel.
  var prePits = [[88, 4], [148, 4], [212, 4]];
  // Pits inside tunnel (forcing the player to choose: jump them
  // street-side or go up onto the deck). Avoid placing pits where
  // they'd land directly under a support platform jump.
  var tunnelPits = [
    [T_START + 14, 4],
    [T_START + 46, 5],
    [T_START + 78, 4],
    [T_DAWN   + 16, 5],
    [T_DAWN   + 50, 4],
    [T_DAWN   + 78, 5]
  ];
  // Pits after tunnel.
  var postPits = [[486, 4], [556, 4], [620, 4]];
  var allPits = prePits.concat(tunnelPits, postPits);
  carve(ground, allPits);

  // Tower entrance plinth at cols 706-718 (slightly raised step into
  // the door). One tile higher so it visually reads as a threshold.
  // Use solid 'X' on row 10 for a single-tile step up.
  // (Implemented below on the row10 variable.)

  var row10 = blank();
  placeSolid(row10, [[706, 12]]);

  // ---- TILE ROWS ASSEMBLY -----------------------------------------
  // 14 rows.
  function row(arr) { return arr.join(''); }
  var SKY = rep(' ', W);
  var dirt = ground.slice();                       // dirt layer 1
  var dirt2 = ground.slice();                      // dirt layer 2
  // Tower plinth dirt fill - extend the solid block downward.
  for (var dp = 706; dp < 718; dp++) { dirt[dp] = 'X'; dirt2[dp] = 'X'; }

  var tiles = [
    SKY,                       // 0
    SKY,                       // 1
    SKY,                       // 2
    row(row3),                 // 3  high parkour / drone lane area
    SKY,                       // 4  overpass beam (painted bg)
    SKY,                       // 5  overpass beam (painted bg)
    row(row6),                 // 6  UPPER DECK + outdoor high stops
    SKY,                       // 7  low sky car lane
    row(row8),                 // 8  mid parkour
    SKY,                       // 9
    row(row10),                // 10 tower plinth
    row(ground),               // 11 street
    row(dirt),                 // 12 dirt
    row(dirt2)                 // 13 dirt
  ];

  // ---- SPAWNS -----------------------------------------------------
  var spawns = [
    { type: 'player', tx: 3, ty: 10 }
  ];

  // Cores along the road every ~10 tiles, skipping pit columns.
  function isPit(x) {
    for (var k = 0; k < allPits.length; k++) {
      if (x >= allPits[k][0] - 1 && x < allPits[k][0] + allPits[k][1] + 1) return true;
    }
    return false;
  }
  for (var i = 8; i < 700; i += 10) {
    if (isPit(i)) continue;
    spawns.push({ type: 'core', tx: i, ty: 10 });
  }

  // Bonus cores stacked on upper deck inside tunnel (reward for
  // climbing up there).
  var deckCores = [
    T_START + 6,  T_START + 14, T_START + 32, T_START + 50,
    T_START + 70, T_START + 92, T_DAWN + 10,  T_DAWN + 30,
    T_DAWN + 52,  T_DAWN + 70,  T_DAWN + 86
  ];
  deckCores.forEach(function (cx) { spawns.push({ type: 'core', tx: cx, ty: 5 }); });

  // Cores on the high parkour platforms.
  [
    [30, 7], [46, 3], [62, 7], [80, 3], [104, 7], [122, 3],
    [142, 7], [166, 3], [192, 7], [212, 3], [234, 7],
    [468, 7], [510, 3], [560, 3], [596, 7], [644, 7]
  ].forEach(function (p) { spawns.push({ type: 'core', tx: p[0], ty: p[1] }); });

  // Mid-stage signature pickup (FLAME DASH).
  spawns.push({ type: 'signature', tx: 60, ty: 9, kind: 'coolwater' });
  // Second signature inside the tunnel for the dawn half - shield
  // helps with the deck-jump density.
  spawns.push({ type: 'signature', tx: T_DAWN + 4, ty: 5, kind: 'sunshield' });

  // ---- CAR LANES -------------------------------------------------
  // Cars cover both decks inside the tunnel + the full street outside.
  // v0.85 base spd = 1.125 (25% slower than the previous 1.5). Cars
  // are also 50% bigger now (33x15) so they read clearly.
  function laneRow(ty, dir, count, periodBase, color, opts) {
    opts = opts || {};
    var step = Math.floor(W / count);
    for (var k = 0; k < count; k++) {
      var x0 = (opts.startCol || 12) + k * step;
      var x1 = opts.endCol || (W - 12);
      if (x0 > x1) continue;
      spawns.push({
        type: 'carspawner',
        tx: x0,
        ty: ty,
        dir: dir,
        spd: 1.125 + (k % 2) * 0.12,
        period: periodBase + (k * 20) % 60,
        phase: (k * 47) % periodBase,
        color: color
      });
    }
  }

  // Ground lane: amber + teal alternating, full length.
  laneRow(10,  1, 8, 240, '#FFB25B');
  laneRow(10, -1, 8, 240, '#8FA7A8');
  // Low sky lane (flyover, full length).
  laneRow(7,  -1, 6, 200, '#FFE46B');
  laneRow(7,   1, 6, 200, '#F06AB4');
  // High sky lane (drone height).
  laneRow(4,  -1, 4, 280, '#5DE2E7');
  laneRow(4,   1, 4, 280, '#A6E86F');
  // UPPER DECK car lane (inside the tunnel only). Two emitters per
  // direction so the deck feels dangerous, slightly slower.
  spawns.push({ type: 'carspawner', tx: T_START + 8,  ty: 5, dir:  1, spd: 1.05, period: 220, phase: 0,   color: '#FFB25B' });
  spawns.push({ type: 'carspawner', tx: T_START + 70, ty: 5, dir: -1, spd: 1.05, period: 220, phase: 110, color: '#8FA7A8' });
  spawns.push({ type: 'carspawner', tx: T_DAWN  + 14, ty: 5, dir:  1, spd: 1.05, period: 220, phase: 60,  color: '#F06AB4' });
  spawns.push({ type: 'carspawner', tx: T_DAWN  + 76, ty: 5, dir: -1, spd: 1.05, period: 220, phase: 160, color: '#FFE46B' });

  // ---- ENDING: tower entrance + timepart -------------------------
  // v0.85: NO rescue NPC line at the end - Mark wants the entrance
  // to read as a closed tower door we pass through into the
  // cinematic. Visual entrance painted by _cyDrawTowerEntrance
  // (scenes.js) based on the `towerEntrance` flag below.
  spawns.push({ type: 'timepart', tx: 712, ty: 10 });

  // Checkpoints: mid-stage (before tunnel) + post-tunnel.
  spawns.push({ type: 'checkpoint', tx: 220, ty: 10 });
  spawns.push({ type: 'checkpoint', tx: 460, ty: 10 });

  SDD.levels['8-1'] = {
    name: 'ADVENTURE CITY',
    theme: 'cyber',
    hint: 'AVOID THE CARS! REACH ADVENTURE TOWER >',
    startSign: { col: 9, label: 'TOWER >' },
    // v0.85: tower entrance painted at the right edge of the level
    // (cols ~700-720). Triggers the special draw in scenes.js.
    towerEntrance: { col: 706, width: 16 },
    width: W, height: 14, ground: 11,
    tiles: tiles,
    spawns: spawns,
    movers: [],
    // v0.85: 4 zones across the EXPANDED tunnel. Layer 3 painted
    // overpass spans cols 250-440; hard-swap to cyber-dawn at the
    // midpoint (T_DAWN = 345). Foreground (Layer 1 anchors) is
    // suppressed inside the tunnel range via the *-tunnel-pass
    // aliases.
    themeZones: [
      { startCol: 0,        theme: 'cyber' },
      { startCol: T_START,  theme: 'cyber-tunnel-pass',      hard: true },
      { startCol: T_DAWN,   theme: 'cyber-dawn-tunnel-pass', hard: true },
      { startCol: T_END,    theme: 'cyber-dawn',             hard: true }
    ]
  };
})();
