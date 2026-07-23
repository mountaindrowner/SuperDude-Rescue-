// assets.js - PORTION CONTROL asset registry + placeholder generator +
// runtime atlas (COMPENDIUM M0). Every art asset in the 2.5 manifest exists
// here at its final size under its final name. At boot we pack ONE atlas
// texture: a real PNG from assets/art/<key>.png is used when listed in the
// art manifest; everything else gets a code-drawn placeholder (colored
// chunky shape + face). Real art replaces placeholders file-by-file with a
// manifest line, zero code changes. The game is never blocked on art.
window.PC = window.PC || {};
(function () {
  var P = PC.PAL;

  // ---------- registry ----------
  // entry: { key, w, h, kind, c1, c2, f (frame index for walk wobble) }
  var R = [];
  function add(key, w, h, kind, c1, c2, f) {
    R.push({ key: key, w: w, h: h, kind: kind, c1: c1, c2: c2 || P.INK, f: f || 0 });
  }
  function creature(key, size, c1, c2, frames) {
    for (var i = 1; i <= frames; i++) add(key + '_walk_' + i, size, size, 'creature', c1, c2, i);
  }

  // -- player characters (6) : 4-frame walk + portrait (COMPENDIUM 6) --
  // Danny renders at 48 (Mark picked option B: native PixelLab quality,
  // no downscale); other heroes get sized when their art is made.
  var CHARS = [
    { k: 'danny',  c1: P.WHITE,  c2: P.CYAN, size: 68, frames: 6 },   // v2 char (option A)
    { k: 'cook',   c1: P.CLOUD,  c2: P.MUSTARD },
    { k: 'tech',   c1: P.STEEL,  c2: P.CYAN },
    { k: 'muscle', c1: P.GRAPE,  c2: P.CHERRY },
    { k: 'scout',  c1: P.MINT,   c2: P.LIME },
    { k: 'medic',  c1: P.WHITE,  c2: P.CHERRY },
  ];
  CHARS.forEach(function (c) {
    creature('char_' + c.k, c.size || PC.SIZE.PLAYER, c.c1, c.c2, c.frames || 4);
    add('portrait_' + c.k, PC.SIZE.PORTRAIT, PC.SIZE.PORTRAIT, 'portrait', c.c1, c.c2);
  });
  add('char_danny_idle', 68, 68, 'creature', P.WHITE, P.CYAN, 1);
  ['cook', 'tech', 'muscle', 'scout', 'medic'].forEach(function (k) {
    add('captured_' + k, PC.SIZE.PLAYER, PC.SIZE.PLAYER, 'captured', P.MINT, P.INK);
  });

  // -- enemies (COMPENDIUM 8, incl. split minions) : 2-frame walk + still --
  var ENEMIES = [
    // d1 street food
    { k: 'enemy_d1_fry', s: 24, c1: P.MUSTARD, c2: P.CHEESE },
    { k: 'enemy_d1_popcorn', s: 24, c1: P.WHITE,   c2: P.MUSTARD },
    { k: 'enemy_d1_hotdog', s: 32, c1: P.KETCHUP, c2: P.CRUST },
    { k: 'enemy_d1_pretzel', s: 48, c1: P.CRUST,   c2: P.COCOA },
    { k: 'enemy_d1_toast', s: 32, c1: P.CRUST,   c2: P.STEEL },
    // d2 produce
    { k: 'enemy_d2_apple',    s: 24, c1: P.KETCHUP, c2: P.MINT },
    { k: 'enemy_d2_banana',   s: 40, c1: P.MUSTARD, c2: P.COCOA },
    { k: 'enemy_d2_banana_single', s: 16, c1: P.MUSTARD, c2: P.COCOA },
    { k: 'enemy_d2_tomato',   s: 32, c1: P.KETCHUP, c2: P.MINT },
    { k: 'enemy_d2_melon',    s: 48, c1: P.MINT,    c2: P.KETCHUP },
    { k: 'enemy_d2_peeler',   s: 28, c1: P.STEEL,   c2: P.CLOUD },
    // d3 desserts
    { k: 'enemy_d3_donut',    s: 24, c1: P.PINK,    c2: P.CHEESE },
    { k: 'enemy_d3_cupcake',  s: 32, c1: P.PINK,    c2: P.CRUST },
    { k: 'enemy_d3_sludge',   s: 48, c1: P.CLOUD,   c2: P.PINK },
    { k: 'enemy_d3_golemite', s: 48, c1: P.COCOA,   c2: P.CRUST },
    { k: 'enemy_d3_chip_bit', s: 16, c1: P.COCOA,   c2: P.CRUST },
    { k: 'enemy_d3_blender',  s: 32, c1: P.STEEL,   c2: P.CHERRY },
    // d4 junk food
    { k: 'enemy_d4_zipper',   s: 24, c1: P.CHEESE,  c2: P.KETCHUP },
    { k: 'enemy_d4_chipbag',  s: 32, c1: P.MUSTARD, c2: P.STEEL },
    { k: 'enemy_d4_soda',     s: 32, c1: P.KETCHUP, c2: P.STEEL },
    { k: 'enemy_d4_burger',   s: 48, c1: P.CRUST,   c2: P.MUSTARD },
    { k: 'enemy_d4_microwave',s: 40, c1: P.STEEL,   c2: P.CLOUD },
    // d5 glitch lab
    { k: 'enemy_d5_nugget',   s: 24, c1: P.BERRY,   c2: P.MUSTARD },
    { k: 'enemy_d5_blob',     s: 32, c1: P.BERRY,   c2: P.COCOA },
    { k: 'enemy_d5_hybrid',   s: 48, c1: P.BERRY,   c2: P.MINT },
    { k: 'enemy_d5_spawnling',s: 20, c1: P.BERRY,   c2: P.PINK },
    { k: 'enemy_d5_fridge',   s: 48, c1: P.CLOUD,   c2: P.STEEL },
    // shared
    { k: 'enemy_golden_snack',s: 24, c1: P.MUSTARD, c2: P.CHEESE },
  ];
  ENEMIES.forEach(function (e) {
    creature(e.k, e.s, e.c1, e.c2, 2);
    if (e.k !== 'enemy_golden_snack') {
      add(e.k.replace('enemy_', 'still_'), e.s, e.s, 'still', e.c1, e.c2);
    }
  });
  add('fx_elite_aura', 72, 72, 'ring', P.MUSTARD, P.CHEESE);

  // -- bosses : 4-frame (COMPENDIUM 8) --
  var BOSSES = [
    { k: 'boss_d1_frank',   s: 128, c1: P.KETCHUP, c2: P.CRUST },
    { k: 'boss_d2_melon',   s: 128, c1: P.MINT,    c2: P.KETCHUP },
    { k: 'boss_d3_cake',    s: 128, c1: P.PINK,    c2: P.CHEESE },
    { k: 'boss_d4_vending', s: 144, c1: P.STEEL,   c2: P.KETCHUP },
    { k: 'boss_d5_mother',  s: 160, c1: P.BERRY,   c2: P.STEEL },
    { k: 'boss_d5_mother_p2', s: 160, c1: P.BERRY, c2: P.CHERRY },
  ];
  BOSSES.forEach(function (b) { creature(b.k, b.s, b.c1, b.c2, 4); });

  // -- projectiles : 1 frame, rotated in code. Cyan = player, Pink = enemy --
  ['resizer:12', 'pellet:8', 'whisk:16', 'drone_bolt:8', 'salt:8', 'freeze:10',
   'ketchup_lob:12', 'micro_spark:8'].forEach(function (s) {
    var p = s.split(':');
    add('proj_' + p[0], +p[1], +p[1], 'proj', P.CYAN, P.CLOUD);
  });
  ['toast:12', 'tomato:10', 'seed:8', 'soda:10', 'candle:10', 'ice_shard:10'].forEach(function (s) {
    var p = s.split(':');
    add('eproj_' + p[0], +p[1], +p[1], 'proj', P.PINK, P.CHERRY);
  });

  // -- FX loops (COMPENDIUM 2.5) --
  function fx(key, n, size, c1, c2, kind) {
    for (var i = 1; i <= n; i++) add(key + '_' + i, size, size, kind || 'burst', c1, c2, i);
  }
  fx('fx_pop', 4, 32, P.WHITE, P.CLOUD);
  fx('fx_spark', 3, 16, P.CLOUD, P.WHITE);
  fx('fx_levelup', 4, 48, P.LIME, P.MINT, 'ring');
  fx('fx_nova', 3, 64, P.CYAN, P.CLOUD, 'ring');
  fx('fx_aura', 2, 64, P.MINT, P.LIME, 'ring');
  fx('fx_cyclone', 2, 40, P.CLOUD, P.STEEL, 'ring');
  fx('fx_puddle', 2, 48, P.KETCHUP, P.CHERRY, 'puddle');
  fx('fx_freeze', 1, 24, P.CYAN, P.CLOUD);
  fx('fx_muzzle', 2, 12, P.CYAN, P.WHITE);

  // -- icons (weapons 10 + passives 8) --
  ['resizer', 'blaster', 'whisk', 'drone', 'fridge', 'salt', 'soothe',
   'microwave', 'freeze', 'ketchup'].forEach(function (k) {
    add('icon_weapon_' + k, PC.SIZE.ICON, PC.SIZE.ICON, 'icon', P.CYAN, P.GRAPE);
  });
  ['battery', 'fan', 'capacitor', 'lens', 'servo', 'coat', 'shoes', 'magnet'].forEach(function (k) {
    add('icon_passive_' + k, PC.SIZE.ICON, PC.SIZE.ICON, 'icon', P.MUSTARD, P.GRAPE);
  });

  // -- pickups --
  add('gem_small', 12, 12, 'gem', P.LIME, P.MINT);
  add('gem_med', 14, 14, 'gem', P.CYAN, P.CLOUD);
  add('gem_gold', 16, 16, 'gem', P.MUSTARD, P.CHEESE);
  add('pickup_health', 16, 16, 'heart', P.CHERRY, P.WHITE);
  add('pickup_magnet', 16, 16, 'magnet', P.CHERRY, P.CLOUD);
  add('pickup_bomb', 16, 16, 'bomb', P.INK, P.CHERRY);
  add('pickup_crate', 32, 32, 'crate', P.STEEL, P.CYAN);       // supply crate
  add('pickup_medkit', 16, 16, 'medkit', P.WHITE, P.CHERRY);   // heal
  add('pickup_coin', 14, 14, 'coin', P.MUSTARD, P.CHEESE);     // gold currency
  fx('pickup_chest', 4, 32, P.CRUST, P.MUSTARD, 'chest');
  fx('pickup_cage', 3, 48, P.STEEL, P.MINT, 'cage');

  // -- tiles : 5 districts x (base + 2 variants + 2 decals) --
  var DISTRICT_TILE = [
    { d: 1, base: 0x3a3652, varc: 0x433f5e, dec: P.MUSTARD },  // asphalt + fry litter
    { d: 2, base: 0x6e5136, varc: 0x7a5b3d, dec: P.KETCHUP },  // dock planks + fruit
    { d: 3, base: 0x4e7a4a, varc: 0x577f52, dec: P.PINK },     // lawn + frosting
    { d: 4, base: 0x4a4a5e, varc: 0x525268, dec: P.CHEESE },   // metal + wrappers
    { d: 5, base: 0x35304e, varc: 0x3d3758, dec: P.BERRY },    // lab + glitch
  ];
  DISTRICT_TILE.forEach(function (t) {
    add('tile_d' + t.d + '_base', 32, 32, 'tile', t.base, t.varc);
    add('tile_d' + t.d + '_var1', 32, 32, 'tile', t.varc, t.base, 1);
    add('tile_d' + t.d + '_var2', 32, 32, 'tile', t.varc, t.base, 2);
    add('tile_d' + t.d + '_decal1', 32, 32, 'decal', t.dec, t.base, 1);
    add('tile_d' + t.d + '_decal2', 32, 32, 'decal', t.dec, t.base, 2);
  });

  // -- props (5 districts x 8) + flood decals 6 + shared rubble 4 --
  var PROPS = {
    1: ['lamppost:32:64', 'bench:48:32', 'hydrant:32:32', 'trashcan:32:32',
        'newsbox:32:48', 'crate:32:32', 'car:64:64', 'sign:32:48'],
    2: ['stall:96:64', 'crates:48:40', 'barrel:24:32', 'dockpost:16:40',
        'net:48:32', 'awning:64:32', 'scale:24:40', 'fruitpile:32:24'],
    3: ['fence:64:24', 'mailbox:16:32', 'gnome:16:24', 'hedge:48:32',
        'lawnchair:32:24', 'pool:64:48', 'grill:32:32', 'tricycle:24:24'],
    4: ['conveyor:96:32', 'vat:48:56', 'pipes:32:64', 'panel:32:40',
        'forklift:48:40', 'pallet:40:24', 'warnsign:24:32', 'vent:32:24'],
    5: ['serverrack:32:64', 'tube:32:64', 'cables:48:24', 'monitors:48:40',
        'console:40:32', 'strobe:16:32', 'wreckage:48:32', 'resizer_machine:128:128'],
  };
  var PROP_TINT = { 1: P.STEEL, 2: P.CRUST, 3: P.MINT, 4: P.STEEL, 5: P.GRAPE };
  Object.keys(PROPS).forEach(function (d) {
    PROPS[d].forEach(function (s) {
      var p = s.split(':');
      add('prop_d' + d + '_' + p[0], +p[1], +p[2], 'prop', PROP_TINT[d], P.INK);
    });
  });
  for (var fd = 1; fd <= 6; fd++) add('decal_flood_' + fd, 32, 32, 'decal', P.CHEESE, P.MUSTARD, fd);
  for (var rb = 1; rb <= 4; rb++) add('prop_rubble_' + rb, 32, 24, 'prop', P.STEEL, P.INK, rb);

  // -- UI shells (most UI is drawn live; these are the reusable frames) --
  add('ui_card', 96, 120, 'panel', P.GRAPE, P.CYAN);
  add('ui_btn', 64, 24, 'panel', P.GRAPE, P.STEEL);
  add('ui_slot', 28, 28, 'panel', P.INK, P.STEEL);
  add('ui_bar', 64, 8, 'panel', P.INK, P.CLOUD);

  PC.ASSETS = R;

  // ---------- placeholder painters ----------
  function hex(c) { return '#' + ('00000' + c.toString(16)).slice(-6); }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

  // chunky rounded blob with 1px Ink outline, drawn with rects only
  function blob(g, x, y, w, h, color) {
    g.fillStyle = hex(P.INK);
    g.fillRect(x + 1, y, w - 2, h);
    g.fillRect(x, y + 1, w, h - 2);
    g.fillStyle = hex(color);
    g.fillRect(x + 2, y + 1, w - 4, h - 2);
    g.fillRect(x + 1, y + 2, w - 2, h - 4);
  }

  function face(g, key, cx, eyeY, scale) {
    var v = hash(key), s = Math.max(1, scale | 0);
    var gap = (2 + (v % 2)) * s;
    g.fillStyle = hex(P.INK);                       // eyes
    g.fillRect(cx - gap - s, eyeY, s, s + s);
    g.fillRect(cx + gap, eyeY, s, s + s);
    g.fillStyle = hex(P.WHITE);                     // glint
    g.fillRect(cx - gap - s, eyeY, 1, 1);
    g.fillRect(cx + gap, eyeY, 1, 1);
    var m = v % 3, my = eyeY + 3 * s;               // mouth: grin / open / fangs
    g.fillStyle = hex(P.INK);
    if (m === 0) { g.fillRect(cx - 2 * s, my, 4 * s, s); }
    else if (m === 1) { g.fillRect(cx - s, my, 2 * s, 2 * s); }
    else {
      g.fillRect(cx - 2 * s, my, 4 * s, s);
      g.fillStyle = hex(P.WHITE);
      g.fillRect(cx - 2 * s + 1, my, s, s);
      g.fillRect(cx + s, my, s, s);
    }
  }

  var PAINTERS = {
    creature: function (g, a) {
      // walk wobble: odd frames squash 1 step wider/shorter; frame 3 leans
      var sq = (a.f % 2 === 0) ? 1 : 0;
      var w = a.w - 4 + sq * 2, h = a.h - 4 - sq * 2;
      var x = (a.w - w) / 2, y = a.h - 2 - h;
      blob(g, x, y, w, h, a.c1);
      var s = Math.max(1, Math.round(a.w / 24));
      face(g, a.key.replace(/_walk_\d$/, ''), a.w / 2, y + Math.round(h * 0.3), s);
      g.fillStyle = hex(a.c2);                       // accent band (goggles/hat)
      g.fillRect(x + 2, y + 2, w - 4, Math.max(1, 2 * s));
      g.fillStyle = hex(P.INK);                      // feet
      var fo = (a.f % 2 === 0) ? 2 : -2;
      g.fillRect(a.w / 2 - 3 * s + fo, a.h - 2, 2 * s, 2);
      g.fillRect(a.w / 2 + s - fo, a.h - 2, 2 * s, 2);
    },
    still: function (g, a) {   // harmless normal-food item: no face, soft
      var w = Math.round(a.w * 0.6), h = Math.round(a.h * 0.5);
      blob(g, (a.w - w) / 2, (a.h - h) / 2, w, h, a.c1);
      g.fillStyle = hex(a.c2);
      g.fillRect(a.w / 2 - 2, a.h / 2 - 2, 4, 2);
    },
    captured: function (g, a) {  // goo-trapped silhouette
      blob(g, 4, 6, a.w - 8, a.h - 8, P.MINT);
      g.fillStyle = hex(P.INK);
      g.fillRect(a.w / 2 - 4, a.h / 2 - 6, 8, 10);   // dark silhouette inside
      g.fillStyle = hex(P.LIME);
      g.fillRect(6, 8, 3, 3); g.fillRect(a.w - 10, a.h - 12, 3, 3);  // goo bubbles
    },
    portrait: function (g, a) {
      blob(g, 8, 8, a.w - 16, a.h - 16, a.c1);
      face(g, a.key, a.w / 2, a.h * 0.38, 3);
      g.fillStyle = hex(a.c2);
      g.fillRect(12, 14, a.w - 24, 6);
    },
    proj: function (g, a) {      // diamond
      var c = a.w / 2;
      g.fillStyle = hex(P.INK);
      for (var i = 0; i < a.w; i++) {
        var d = Math.abs(i - c), t = Math.max(0, c - d);
        g.fillRect(i, c - t, 1, t * 2);
      }
      g.fillStyle = hex(a.c1);
      for (var j = 1; j < a.w - 1; j++) {
        var d2 = Math.abs(j - c), t2 = Math.max(0, c - d2 - 1);
        if (t2 > 0) g.fillRect(j, c - t2, 1, t2 * 2);
      }
      g.fillStyle = hex(a.c2);
      g.fillRect(c - 1, c - 1, 2, 2);
    },
    burst: function (g, a) {     // expanding starburst by frame
      var c = a.w / 2, r = (a.w / 2 - 2) * (a.f ? a.f / 4 : 0.75);
      g.fillStyle = hex(a.c1);
      for (var k = 0; k < 8; k++) {
        var ang = k * Math.PI / 4;
        g.fillRect(Math.round(c + Math.cos(ang) * r) - 1, Math.round(c + Math.sin(ang) * r) - 1, 3, 3);
      }
      g.fillStyle = hex(a.c2);
      g.fillRect(c - 2, c - 2, 4, 4);
    },
    ring: function (g, a) {      // hollow ring, radius by frame
      var c = a.w / 2, r = Math.max(3, (a.w / 2 - 2) * (a.f ? (0.4 + a.f * 0.2) : 0.9));
      g.fillStyle = hex(a.c1);
      for (var k = 0; k < 24; k++) {
        var ang = k * Math.PI / 12;
        g.fillRect(Math.round(c + Math.cos(ang) * r) - 1, Math.round(c + Math.sin(ang) * r) - 1, 2, 2);
      }
    },
    puddle: function (g, a) {
      blob(g, 2, a.h / 2, a.w - 4, a.h / 2 - 2, a.c1);
      g.fillStyle = hex(a.c2);
      g.fillRect(a.w / 4, a.h * 0.6, 3, 2); g.fillRect(a.w * 0.6, a.h * 0.7, 4, 2);
    },
    icon: function (g, a) {
      blob(g, 0, 0, a.w, a.h, a.c2);
      g.fillStyle = hex(a.c1);
      g.fillRect(4, 4, a.w - 8, a.h - 8);
      g.fillStyle = hex(P.INK);
      var glyph = a.key.split('_').pop().charAt(0).toUpperCase();
      g.font = '10px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(glyph, a.w / 2, a.h / 2 + 1);
    },
    gem: function (g, a) { PAINTERS.proj(g, a); },
    crate: function (g, a) {                         // shiny lab supply crate
      blob(g, 3, 5, a.w - 6, a.h - 8, a.c1);
      g.fillStyle = hex(P.CYAN);
      g.fillRect(5, 7, a.w - 10, 2);                 // glowing top band
      g.fillRect(a.w / 2 - 1, 9, 2, a.h - 14);       // vertical seam
      g.fillStyle = hex(P.CLOUD);
      g.fillRect(6, a.h - 8, 3, 2); g.fillRect(a.w - 9, a.h - 8, 3, 2);
    },
    medkit: function (g, a) {
      blob(g, 1, 2, a.w - 2, a.h - 4, a.c1);
      g.fillStyle = hex(P.CHERRY);
      g.fillRect(a.w / 2 - 1, 4, 2, a.h - 8);        // red cross
      g.fillRect(4, a.h / 2 - 1, a.w - 8, 2);
    },
    coin: function (g, a) {
      var c = a.w / 2;
      g.fillStyle = hex(P.INK);
      g.beginPath(); g.arc(c, c, c - 1, 0, Math.PI * 2); g.fill();
      g.fillStyle = hex(a.c1);
      g.beginPath(); g.arc(c, c, c - 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = hex(a.c2);
      g.fillRect(c - 2, 3, 1, a.w - 6);
    },
    heart: function (g, a) {
      blob(g, 1, 3, a.w - 2, a.h - 6, a.c1);
      g.fillStyle = hex(a.c2); g.fillRect(4, 5, 2, 2);
    },
    magnet: function (g, a) {
      g.fillStyle = hex(a.c1);
      g.fillRect(2, 2, 4, a.h - 4); g.fillRect(a.w - 6, 2, 4, a.h - 4);
      g.fillRect(2, 2, a.w - 4, 4);
      g.fillStyle = hex(a.c2);
      g.fillRect(2, a.h - 5, 4, 3); g.fillRect(a.w - 6, a.h - 5, 4, 3);
    },
    bomb: function (g, a) {
      blob(g, 2, 4, a.w - 4, a.h - 6, a.c1);
      g.fillStyle = hex(a.c2); g.fillRect(a.w / 2, 0, 2, 4);
      g.fillStyle = hex(P.WHITE); g.fillRect(5, 7, 2, 2);
    },
    chest: function (g, a) {     // frames: closed -> opening -> open -> burst
      var lid = Math.min(3, a.f - 1) * 3;
      blob(g, 4, 12, a.w - 8, a.h - 14, a.c1);
      blob(g, 3, 8 - lid, a.w - 6, 8, a.c2);
      if (a.f >= 3) { g.fillStyle = hex(P.LIME); g.fillRect(a.w / 2 - 2, 2, 4, 6); }
    },
    cage: function (g, a) {      // frames: intact -> cracked -> shattered
      g.fillStyle = hex(a.c1);
      for (var b = 4; b < a.w - 2; b += 8) g.fillRect(b, 4, 3, a.h - 8);
      g.fillRect(2, 3, a.w - 4, 3); g.fillRect(2, a.h - 6, a.w - 4, 3);
      if (a.f >= 2) { g.fillStyle = hex(P.INK); g.fillRect(a.w / 2 - 1, 4, 4, a.h - 10); }
      if (a.f >= 3) { g.fillStyle = hex(a.c2); g.fillRect(a.w / 2 - 6, a.h / 2 - 4, 12, 8); }
    },
    tile: function (g, a) {
      g.fillStyle = hex(a.c1); g.fillRect(0, 0, a.w, a.h);
      var v = hash(a.key);
      g.fillStyle = hex(a.c2);
      for (var i = 0; i < 5; i++) {
        g.fillRect((v >> i) % a.w, (v >> (i + 3)) % a.h, 2, 1);
      }
    },
    decal: function (g, a) {     // transparent splat
      var v = hash(a.key);
      g.fillStyle = hex(a.c1);
      for (var i = 0; i < 6; i++) {
        var x = 4 + (v >> i) % (a.w - 10), y = 4 + (v >> (i + 4)) % (a.h - 10);
        g.fillRect(x, y, 3 + (v >> i) % 4, 2 + (v >> (i + 2)) % 3);
      }
    },
    prop: function (g, a) {
      blob(g, 1, 1, a.w - 2, a.h - 2, a.c1);
      g.fillStyle = 'rgba(27,21,48,0.35)';
      g.fillRect(3, a.h - Math.max(4, a.h / 4), a.w - 6, Math.max(2, a.h / 4 - 2));
      g.fillStyle = hex(P.CLOUD);
      g.fillRect(3, 3, Math.max(2, a.w / 4), 2);
    },
    panel: function (g, a) {
      blob(g, 0, 0, a.w, a.h, a.c1);
      g.fillStyle = hex(a.c2);
      g.fillRect(2, 2, a.w - 4, 1); g.fillRect(2, a.h - 3, a.w - 4, 1);
    },
  };

  // ---------- runtime atlas builder ----------
  // Packs every registry entry into ONE canvas texture ('atlas'), drawing the
  // real loaded image when present, else the placeholder painter. Shelf pack,
  // 2px padding, sorted tallest-first. Returns { frames, missing, size }.
  PC.buildAtlas = function (scene, realKeys) {
    var W = 1024, pad = 2;
    var sorted = PC.ASSETS.slice().sort(function (a, b) { return b.h - a.h; });
    var x = pad, y = pad, shelf = 0, maxY = 0;
    var places = [];
    sorted.forEach(function (a) {
      if (x + a.w + pad > W) { x = pad; y += shelf + pad; shelf = 0; }
      places.push({ a: a, x: x, y: y });
      x += a.w + pad;
      if (a.h > shelf) shelf = a.h;
      maxY = Math.max(maxY, y + a.h);
    });
    var H = 1; while (H < maxY + pad) H *= 2;   // pow2 height for safety
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;

    var missing = 0;
    places.forEach(function (p) {
      var a = p.a;
      g.save();
      g.translate(p.x, p.y);
      var loaded = realKeys && realKeys['art_' + a.key] && scene.textures.exists('art_' + a.key);
      if (loaded) {
        var img = scene.textures.get('art_' + a.key).getSourceImage();
        g.drawImage(img, 0, 0, a.w, a.h);
      } else if (PC.HANDART && PC.HANDART[a.key]) {
        PC.HANDART[a.key](g, a);      // hand-authored pixel map
      } else {
        missing++;
        (PAINTERS[a.kind] || PAINTERS.prop)(g, a);
      }
      g.restore();
    });

    if (scene.textures.exists('atlas')) scene.textures.remove('atlas');
    var tex = scene.textures.addCanvas('atlas', canvas);
    places.forEach(function (p) {
      tex.add(p.a.key, 0, p.x, p.y, p.a.w, p.a.h);
    });
    // free the individual real-art textures - only the atlas goes to the GPU
    if (realKeys) Object.keys(realKeys).forEach(function (k) {
      if (scene.textures.exists(k)) scene.textures.remove(k);
    });
    return { frames: places.length, placeholders: missing, w: W, h: H };
  };
})();
