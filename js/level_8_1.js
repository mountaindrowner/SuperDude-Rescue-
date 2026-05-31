// Day 8-1: ADVENTURE CITY (v0.55 secret stage)
//
// Unlocked once the player has finished the finale (firstClear flag on
// the active save slot). Accessed from the main menu's ADVENTURE CITY
// entry, not the overworld - day 8 sits OUTSIDE the linear days-of-
// creation progression so the 7-days narrative stays clean.
//
// Long flat city street + parkour platforms + three lanes of futuristic
// car traffic that telegraphs (honk + flashing outline) before sweeping
// across at deadly speed. Reach the Towers at the right edge (TimePart
// goal) to trigger the cityArrival cutscene where the rescue team is
// waiting.
//
// All counts + positions are placeholders Mark can edit in-game via the
// level editor once the painted PNG layers + Computer + rescue team
// sprites land.
window.SDD = window.SDD || {};
SDD.levels = SDD.levels || {};

(function () {
  function rep(ch, n) { var s = ''; for (var i = 0; i < n; i++) s += ch; return s; }

  var W = 360;
  // Tile rows. Rows 0-7 are open sky for car lanes + parkour. Row 8
  // gets sparse one-way platforms ('=') for parkour stops. Row 11+ is
  // continuous ground so the kid can run flat. A small Towers ramp at
  // the right edge marks the goal.
  var SKY = rep(' ', W);
  function withPlats(positions) {
    var row = rep(' ', W).split('');
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      for (var x = p[0]; x < p[0] + p[1]; x++) row[x] = '=';
    }
    return row.join('');
  }

  // Parkour platforms: clusters every ~30 tiles, varying heights.
  var rowParkourHigh = withPlats([
    [44, 4], [78, 5], [120, 4], [164, 5], [210, 4], [254, 5], [300, 4]
  ]);
  // v0.74: parkour platform at col 188 restored - the v0.70 tunnel
  // was a brick-ceiling tile wraparound that conflicted with this
  // platform. Now the tunnel is a Layer-3 overlay (concrete overpass
  // at rows 4-6) painted by _cyDrawTunnelOverlay in scenes.js, so
  // the gameplay tiles stay normal.
  var rowParkourMid = withPlats([
    [28, 5], [60, 6], [100, 5], [140, 6], [188, 5], [232, 6], [276, 5], [318, 6]
  ]);

  var rowGround = rep('X', W);
  // Two pits in the street for danger (~5 tiles wide so a careful jump
  // clears them). Mark can edit if too punishing.
  function withPits(row, pits) {
    var arr = row.split('');
    for (var i = 0; i < pits.length; i++) {
      for (var x = pits[i][0]; x < pits[i][0] + pits[i][1]; x++) arr[x] = ' ';
    }
    return arr.join('');
  }
  var groundWithPits = withPits(rowGround, [[88, 4], [192, 4], [268, 4]]);
  var dirtWithPits   = withPits(rowGround, [[88, 4], [192, 4], [268, 4]]);
  var dirt2WithPits  = withPits(rowGround, [[88, 4], [192, 4], [268, 4]]);

  // Cores scattered along the road + on the parkour platforms.
  var spawns = [
    { type: 'player', tx: 3, ty: 10 }
  ];
  // Ground cores every ~8 tiles, skipping the pit columns.
  for (var i = 8; i < 348; i += 8) {
    if ((i > 86 && i < 94) || (i > 190 && i < 198) || (i > 266 && i < 274)) continue;
    spawns.push({ type: 'core', tx: i, ty: 10 });
  }
  // Parkour platform cores.
  [
    [30, 7], [32, 7], [46, 3], [62, 7], [80, 3], [104, 7], [122, 3],
    [142, 7], [166, 3], [192, 7], [212, 3], [234, 7], [256, 3], [278, 7],
    [302, 3], [320, 7]
  ].forEach(function (p) { spawns.push({ type: 'core', tx: p[0], ty: p[1] }); });

  // Mid-stage signature pickup (FLAME DASH - matches the "running
  // through a futuristic city" vibe).
  spawns.push({ type: 'signature', tx: 60, ty: 9, kind: 'coolwater' });

  // Three lanes of car spawners. Cars sweep from both ends. Periods
  // staggered so the player gets a readable rhythm. Lane ty values:
  //   ty=10  ground lane (cars on the road)
  //   ty=6   low sky lane (cars on a flyover above the street)
  //   ty=3   high sky lane (drones up in the sky)
  function laneRow(ty, dir, count, periodBase, color) {
    var step = Math.floor(W / count);
    for (var k = 0; k < count; k++) {
      spawns.push({
        type: 'carspawner',
        tx: 12 + k * step,
        ty: ty,
        dir: dir,
        spd: 2.2 + (k % 2) * 0.2,
        period: periodBase + (k * 20) % 60,
        phase: (k * 47) % periodBase,
        color: color
      });
    }
  }
  // Ground lane: warm solarpunk palette - amber + teal alternating.
  laneRow(10,  1, 4, 240, '#FFB25B');
  laneRow(10, -1, 4, 240, '#8FA7A8');
  // Low sky lane (flyover above the street).
  laneRow(7,  -1, 3, 200, '#FFE46B');
  laneRow(7,   1, 3, 200, '#F06AB4');
  // High sky lane (drone height) - clear of the HUD ribbon.
  laneRow(4,  -1, 2, 280, '#5DE2E7');
  laneRow(4,   1, 2, 280, '#A6E86F');

  // Rescue team near the goal (tx ~340-348). Computer character
  // greets at the very end.
  spawns.push({ type: 'npc', tx: 338, ty: 10, kind: 'rescue_leader' });
  spawns.push({ type: 'npc', tx: 342, ty: 10, kind: 'rescue_scientist' });
  spawns.push({ type: 'npc', tx: 346, ty: 10, kind: 'rescue_engineer' });
  spawns.push({ type: 'npc', tx: 350, ty: 10, kind: 'rescue_pilot' });
  spawns.push({ type: 'npc', tx: 354, ty: 10, kind: 'computer', line: 'WELCOME HOME!' });

  // Towers TimePart goal at the right edge.
  spawns.push({ type: 'timepart', tx: 357, ty: 10 });

  // Checkpoint at the midpoint so death isn't a full restart.
  spawns.push({ type: 'checkpoint', tx: 180, ty: 10 });

  SDD.levels['8-1'] = {
    name: 'ADVENTURE CITY',
    theme: 'cyber',
    width: W, height: 14, ground: 11,
    tiles: [
      SKY,
      SKY,
      SKY,
      rowParkourHigh,
      SKY,
      SKY,
      SKY,
      rowParkourMid,
      SKY,
      SKY,
      SKY,
      groundWithPits,
      dirtWithPits,
      dirt2WithPits
    ],
    spawns: spawns,
    movers: [],
    // v0.74: 4 zones across the tunnel range. Layer 3 concrete
    // overpass (painted by _cyDrawTunnelOverlay) spans cols 150-200.
    // The cyber background persists through the first half of the
    // tunnel, then HARD-swaps to cyber-dawn at col 175 (midpoint).
    // The tunnel-pass entries route to the same sky painters but
    // have no FOREGROUND entry, suppressing Layer 1 (anchor towers
    // + kiosk) inside the tunnel - "nothing in the tunnel for the
    // most part" per Mark.
    themeZones: [
      { startCol: 0,    theme: 'cyber' },
      { startCol: 150,  theme: 'cyber-tunnel-pass',     hard: true },
      { startCol: 175,  theme: 'cyber-dawn-tunnel-pass', hard: true },
      { startCol: 200,  theme: 'cyber-dawn',            hard: true }
    ]
  };
})();
