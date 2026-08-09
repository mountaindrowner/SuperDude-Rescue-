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
  // The real SDD roster. Sizes = each hero's actual PixelLab canvas
  // (v2 standard Danny 68, Victoria pro 84, v3 heroes 88-92); the
  // in-game footprint is normalized via PC.ROSTER scale, not here.
  var CHARS = [
    { k: 'danny',    c1: P.WHITE,  c2: P.CYAN,    size: 92 },
    { k: 'victoria', c1: P.CLOUD,  c2: P.BERRY,   size: 96 },
    { k: 'nayah',    c1: P.MINT,   c2: P.LIME,    size: 96 },
    { k: 'kevin',    c1: P.STEEL,  c2: P.MUSTARD, size: 88 },
    { k: 'carlos',   c1: P.MUSTARD,c2: P.CYAN,    size: 92 },
    { k: 'josh',     c1: P.CRUST,  c2: P.COCOA,   size: 88 },
  ];
  CHARS.forEach(function (c) {
    creature('char_' + c.k, c.size, c.c1, c.c2, 6);
    add('char_' + c.k + '_idle', c.size, c.size, 'creature', c.c1, c.c2, 1);
    add('portrait_' + c.k, PC.SIZE.PORTRAIT, PC.SIZE.PORTRAIT, 'portrait', c.c1, c.c2);
    // defeat variant (results lose screen; edit-image of the shipped portrait)
    add('portrait_' + c.k + '_ko', PC.SIZE.PORTRAIT, PC.SIZE.PORTRAIT, 'portrait', c.c1, c.c2);
  });
  // story NPC portraits (STORY-1; real PNGs via manifest)
  ['bloom', 'sal', 'pip', 'chomp', 'anchor'].forEach(function (n) {
    add('portrait_' + n, PC.SIZE.PORTRAIT, PC.SIZE.PORTRAIT, 'portrait', P.CLOUD, P.GRAPE);
  });
  // park critters (v0.26.0): 2-frame ambient wildlife
  ['critter_squirrel', 'critter_bird', 'critter_rabbit'].forEach(function (n) {
    for (var ci = 1; ci <= 2; ci++) add(n + '_' + ci, 32, 32, 'creature', P.CRUST, P.COCOA, ci);
  });
  // newscast cutscene figures (v0.18.2): crowd from behind + npc minis
  ['cs_civ_a', 'cs_civ_b', 'cs_civ_c', 'cs_bloom', 'cs_sal', 'cs_pip',
   'cs_reporter', 'cs_danny_mic'].forEach(function (n) {
    add(n, 48, 48, 'creature', P.CLOUD, P.GRAPE, 1);
  });

  // The District 1 rescued teammate - stays a stasis-pod placeholder
  // until Mark names which roster hero is in Big Frank's cage.
  add('hero_placeholder', 48, 64, 'herofig', P.CYAN, P.CLOUD);

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
    // d5 spoiled sludge (MAP 5 sewers - the shipped roster; the old
    // "glitch lab" nugget/hybrid/spawnling/fridge names stay as inert
    // fallbacks below in case the compendium roster ever returns)
    { k: 'enemy_d5_blob',     s: 24, c1: P.LIME,    c2: P.MINT },
    { k: 'enemy_d5_drip',     s: 16, c1: P.LIME,    c2: P.CYAN },
    { k: 'enemy_d5_moldy',    s: 32, c1: P.CRUST,   c2: P.MINT },
    { k: 'enemy_d5_eggy',     s: 32, c1: P.CLOUD,   c2: P.LIME },
    { k: 'enemy_d5_heap',     s: 48, c1: P.COCOA,   c2: P.LIME },
    { k: 'enemy_d5_nugget',   s: 24, c1: P.BERRY,   c2: P.MUSTARD },
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
    { k: 'boss_d2_broc',    s: 128, c1: P.MINT,    c2: P.LIME },
    { k: 'boss_d3_cake',    s: 128, c1: P.PINK,    c2: P.CHEESE },
    { k: 'boss_d4_vending', s: 128, c1: P.STEEL,   c2: P.KETCHUP, f: 6 },
    { k: 'boss_d5_mother',  s: 160, c1: P.BERRY,   c2: P.STEEL },
    { k: 'boss_d5_mother_p2', s: 160, c1: P.BERRY, c2: P.CHERRY },
    // v0.64.0: THE GLOOP KING had PNGs on disk and manifest lines but
    // NO SLOT HERE, so the atlas never packed him and the boss shipped
    // INVISIBLE - the exact CHOMP lesson repeated. PC.ASSETS is what
    // the atlas packs; a PNG + manifest line are NOT enough.
    { k: 'boss_d5_gloop',   s: 128, c1: P.LIME,    c2: P.MINT, f: 6 },
  ];
  BOSSES.forEach(function (b) { creature(b.k, b.s, b.c1, b.c2, b.f || 4); });
  // CHOMP (v0.47.0): three phase forms + the serve telegraph + the
  // powered-down pose. Declared here because PC.ASSETS is what the atlas
  // packs - a PNG on disk and a manifest line are NOT enough, the frame
  // has to have a slot reserved (this cost a debug round: CHOMP shipped
  // invisible, shadow only, because nothing reserved its frames).
  // CHOMP: 256 square. Eleven design rounds landed on a colossal
  // riveted STEW CAULDRON - a machine shaped like food, bolted in
  // place, with sensor lenses and a grille for a face and ladle mounts
  // round the rim where the four boom arms bolt on.
  ['chomp_p1', 'chomp_p2', 'chomp_p3'].forEach(function (k) {
    for (var i = 1; i <= 2; i++) add(k + '_walk_' + i, 256, 256, 'creature', P.CLOUD, P.CYAN, i);
    add(k + '_serve_1', 256, 256, 'creature', P.CLOUD, P.MUSTARD, 1);
  });
  add('chomp_down', 256, 256, 'creature', P.STEEL, P.INK, 1);
  // extra per-state boss frame sets (v0.22.0 - boss.js `anims`)
  [['boss_d2_broc_rear', 128, P.MINT, P.LIME],
   ['boss_d2_broc_lunge', 128, P.MINT, P.LIME],
   ['boss_d3_cake_rear', 128, P.PINK, P.CHEESE],
   ['boss_d3_cake_lunge', 128, P.PINK, P.CHEESE],
   ['boss_d4_vending_rear', 128, P.STEEL, P.KETCHUP],
   ['boss_d4_vending_lunge', 128, P.STEEL, P.KETCHUP],
   ['boss_d5_gloop_rear', 128, P.LIME, P.MINT],
   ['boss_d5_gloop_lunge', 128, P.LIME, P.MINT]].forEach(function (b) {
    for (var i = 1; i <= 2; i++) add(b[0] + '_' + i, b[1], b[1], 'creature', b[2], b[3], i);
  });

  // -- projectiles : 1 frame, rotated in code. Cyan = player, Pink = enemy --
  ['pellet:8', 'whisk:16', 'salt:8', 'freeze:10',
   'ketchup_lob:12', 'micro_spark:8',
   'candy_pinwheel:16', 'candy_strawberry:16', 'candy_mint:16'].forEach(function (s) {
    var p = s.split(':');
    add('proj_' + p[0], +p[1], +p[1], 'proj', P.CYAN, P.CLOUD);
  });
  // directional energy bolts (v0.23.0): NON-SQUARE and shaped, so the
  // rotation BulletSystem already applies actually reads. Mark: "almost
  // like a little beam of light... the front part should always be
  // oriented in the direction that it's being shot."
  add('proj_resizer', 30, 14, 'bolt', P.CYAN, P.CLOUD);
  add('proj_drone_bolt', 20, 10, 'bolt', P.CYAN, P.CLOUD);
  ['toast:12', 'tomato:10', 'seed:8', 'soda:10', 'candle:10', 'ice_shard:10'].forEach(function (s) {
    var p = s.split(':');
    add('eproj_' + p[0], +p[1], +p[1], 'proj', P.PINK, P.CHERRY);
  });

  // -- signature-weapon props (hero reworks; real PNGs via manifest) --
  add('sig_sentrybot', 32, 32, 'proj', P.STEEL, P.CYAN);
  add('sig_turret', 40, 40, 'proj', P.STEEL, P.MUSTARD);
  add('sig_comet', 48, 48, 'proj', P.CHEESE, P.MUSTARD);
  add('sig_bomb', 32, 32, 'proj', P.STEEL, P.MUSTARD);
  add('sig_ketchup_shell', 32, 32, 'proj', P.KETCHUP, P.CHERRY);

  // -- FX loops (COMPENDIUM 2.5) --
  function fx(key, n, size, c1, c2, kind) {
    for (var i = 1; i <= n; i++) add(key + '_' + i, size, size, kind || 'burst', c1, c2, i);
  }
  fx('fx_pop', 4, 40, P.WHITE, P.CLOUD);
  fx('fx_spark', 3, 22, P.CLOUD, P.WHITE);
  fx('fx_levelup', 4, 48, P.LIME, P.MINT, 'ring');
  fx('fx_nova', 3, 64, P.CYAN, P.CLOUD, 'ring');
  fx('fx_aura', 2, 64, P.MINT, P.LIME, 'ring');
  fx('fx_cyclone', 2, 40, P.CLOUD, P.STEEL, 'ring');
  fx('fx_puddle', 2, 64, P.KETCHUP, P.CHERRY, 'puddle');
  fx('fx_freeze', 1, 24, P.CYAN, P.CLOUD);
  // directional (non-square) muzzle flash, oriented by the shooter
  for (var mz = 1; mz <= 2; mz++) add('fx_muzzle_' + mz, 28, 18, 'muzzle', P.CYAN, P.WHITE, mz);
  // v0.23.0: the blobby impact splash + the living flame tongue
  fx('fx_splat', 4, 60, P.KETCHUP, P.CHERRY, 'splat');
  fx('fx_flame', 4, 40, P.MUSTARD, P.CHEESE, 'flame');

  // -- icons: one per weapon key (26) + one per passive key (10). --
  // 48px native (pixflux generation size, no rescale); cards draw at 0.8.
  ['resizer', 'blaster', 'whisk', 'sentry', 'seeds', 'strike', 'beam',
   'lasso', 'salt', 'drone', 'freeze', 'ketchup', 'microwave', 'fridge',
   'cutter', 'zap', 'grease', 'jaw', 'sprinkle', 'skillet', 'vortex',
   'espresso', 'pineapple', 'sentrybot', 'comet', 'haymaker'].forEach(function (k) {
    add('icon_weapon_' + k, 48, 48, 'icon', P.CYAN, P.GRAPE);
  });
  ['battery', 'fan', 'shoes', 'magnet', 'lens', 'servo', 'coat',
   'duplicator', 'slowcooker', 'leftovers'].forEach(function (k) {
    add('icon_passive_' + k, 48, 48, 'icon', P.MUSTARD, P.GRAPE);
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

  // -- title-sequence textures (security-lab bulkhead, v0.13.0) --
  add('ui_door_plate', 64, 64, 'tile', 0x2a2740, 0x3a3652);
  add('ui_hazard', 32, 32, 'tile', P.MUSTARD, P.INK);
  add('ui_emblem', 64, 64, 'ring', P.STEEL, P.CYAN);

  // -- UI shells (most UI is drawn live; these are the reusable frames) --
  add('ui_card', 96, 120, 'panel', P.GRAPE, P.CYAN);
  add('ui_btn', 64, 24, 'panel', P.GRAPE, P.STEEL);
  add('ui_slot', 28, 28, 'panel', P.INK, P.STEEL);
  add('ui_bar', 64, 8, 'panel', P.INK, P.CLOUD);

  PC.ASSETS = R;

  // ---------- placeholder painters ----------
  function hex(c) { return '#' + ('00000' + c.toString(16)).slice(-6); }
  // hue-shifted ramps (ASSET_QUALITY law 4): highlights lean yellow-white,
  // shadows lean violet - never a flat lighten/darken
  function lerpC(c, t, k) {
    var r = ((c >> 16) & 255) + (((t >> 16) & 255) - ((c >> 16) & 255)) * k;
    var g2 = ((c >> 8) & 255) + (((t >> 8) & 255) - ((c >> 8) & 255)) * k;
    var b2 = (c & 255) + ((t & 255) - (c & 255)) * k;
    return (Math.round(r) << 16) | (Math.round(g2) << 8) | Math.round(b2);
  }
  function lite(c, k) { return lerpC(c, 0xfff6e0, k === undefined ? 0.45 : k); }
  function shade(c, k) { return lerpC(c, 0x2a1040, k === undefined ? 0.45 : k); }
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
    proj: function (g, a) {      // layered orb (ASSET_QUALITY layer law):
      // rim -> base -> bottom-right occlusion -> up-left highlight -> core
      var c = a.w / 2, r = a.w / 2 - 1;
      g.fillStyle = hex(P.INK);                               // 1px rim
      g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = hex(a.c1);                                // base
      g.beginPath(); g.arc(c, c, r - 1, 0, Math.PI * 2); g.fill();
      g.save();                                               // occlusion crescent
      g.beginPath(); g.arc(c, c, r - 1, 0, Math.PI * 2); g.clip();
      g.fillStyle = hex(shade(a.c1));
      g.beginPath(); g.arc(c + r * 0.35, c + r * 0.35, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = hex(a.c1);                                // re-carve base
      g.beginPath(); g.arc(c - r * 0.12, c - r * 0.12, r * 0.82, 0, Math.PI * 2); g.fill();
      g.fillStyle = hex(lite(a.c1));                          // up-left highlight
      g.beginPath(); g.arc(c - r * 0.32, c - r * 0.32, r * 0.42, 0, Math.PI * 2); g.fill();
      g.restore();
      g.fillStyle = hex(lite(a.c2, 0.7));                     // hot core
      g.fillRect(Math.round(c) - 1, Math.round(c) - 1, 2, 2);
    },
    burst: function (g, a) {     // layer law: flash core + radial spark
      // quads + flung debris dots, expanding + fading by frame
      var c = a.w / 2, n = 4;
      var k0 = a.f ? a.f / n : 0.75;                          // 0..1 progress
      var r = (a.w / 2 - 2) * k0;
      var seed = hash(a.key);
      for (var k = 0; k < 6; k++) {                           // spark quads
        var ang = k * Math.PI / 3 + (seed % 7) * 0.13;
        var sr = r * (0.8 + ((seed >> k) % 3) * 0.12);
        var qx = c + Math.cos(ang) * sr, qy = c + Math.sin(ang) * sr;
        var ql = Math.max(2, (a.w / 8) * (1 - k0 * 0.5));
        g.strokeStyle = hex(a.c1); g.lineWidth = 2;
        g.beginPath(); g.moveTo(qx, qy);
        g.lineTo(qx + Math.cos(ang) * ql, qy + Math.sin(ang) * ql); g.stroke();
        g.fillStyle = hex(lite(a.c1));                        // bright tip
        g.fillRect(Math.round(qx) - 1, Math.round(qy) - 1, 2, 2);
      }
      for (var d3 = 0; d3 < 3; d3++) {                        // debris dots
        var da = d3 * 2.1 + (seed % 5) * 0.4;
        g.fillStyle = hex(shade(a.c1, 0.3));
        g.fillRect(Math.round(c + Math.cos(da) * r * 1.15),
                   Math.round(c + Math.sin(da) * r * 1.15), 1, 1);
      }
      var coreR = Math.max(1.5, (a.w / 7) * (1.2 - k0));      // flash core
      g.fillStyle = hex(a.c2);
      g.beginPath(); g.arc(c, c, coreR + 1, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(c, c, coreR * 0.55, 0, Math.PI * 2); g.fill();
    },
    ring: function (g, a) {      // layer law: darker outer rim + bright
      // edge + soft inward falloff (never a bare outline)
      var c = a.w / 2, r = Math.max(3, (a.w / 2 - 2) * (a.f ? (0.4 + a.f * 0.2) : 0.9));
      g.strokeStyle = hex(shade(a.c1, 0.55)); g.lineWidth = 2; // outer rim
      g.beginPath(); g.arc(c, c, Math.min(a.w / 2 - 1, r + 1.5), 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 0.22;                                   // falloff bands
      g.strokeStyle = hex(a.c1);
      g.lineWidth = 2;
      g.beginPath(); g.arc(c, c, r - 2, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 0.1;
      g.beginPath(); g.arc(c, c, Math.max(1, r - 4), 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 1;
      g.strokeStyle = hex(lite(a.c1, 0.35)); g.lineWidth = 2; // bright edge
      g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#ffffff'; g.globalAlpha = 0.5;           // edge glints
      for (var k = 0; k < 4; k++) {
        var ang = k * Math.PI / 2 + 0.6;
        g.fillRect(Math.round(c + Math.cos(ang) * r) - 1,
                   Math.round(c + Math.sin(ang) * r) - 1, 2, 1);
      }
      g.globalAlpha = 1;
    },
    // ---- v0.23.0 VFX PASS (Mark: "not just a cube or that round shape";
    // "a little beam of light... always pointing in the right direction";
    // "animate real flames"). These three painters replace the round
    // primitives with SHAPED, directional, irregular art. All scanline-
    // drawn (fillRect per column/row) so edges stay crisp pixel art
    // instead of the soft anti-aliased curves arc() produces. ----

    // a DIRECTIONAL muzzle flash pointing +X: hot core, a forward cone of
    // escaping light, and short back-blast rays. Was a plain 12px blob -
    // the one effect that fires on literally every shot deserved shape.
    muzzle: function (g, a) {
      var w = a.w, h = a.h, cy = h / 2, cx = w * 0.20;
      var k = a.f === 2 ? 0.72 : 1;            // 2nd frame: collapsing
      // forward cone: narrow and bright at the barrel, widening and
      // FADING toward the tip so it dissipates instead of ending in a
      // hard blue edge
      g.fillStyle = hex(a.c1);
      for (var x = Math.round(cx); x < w; x++) {
        var t = (x - cx) / (w - cx);
        var hh = (h / 2) * (0.26 + 0.90 * t) * k;
        if (hh < 0.5) continue;
        g.globalAlpha = Math.pow(1 - t, 1.15) * 0.95 * k;  // fades to the tip
        g.fillRect(x, Math.round(cy - hh), 1, Math.max(1, Math.round(hh * 2)));
      }
      // two bright inner streaks down the middle of the cone
      g.fillStyle = hex(lite(a.c1, 0.45));
      for (var x2 = Math.round(cx); x2 < w * 0.82; x2++) {
        var t2 = (x2 - cx) / (w - cx);
        g.globalAlpha = (1 - t2) * 0.8 * k;
        g.fillRect(x2, Math.round(cy - 1), 1, 2);
      }
      g.globalAlpha = 1;
      // back-blast rays
      g.fillStyle = hex(lite(a.c1, 0.3)); g.globalAlpha = 0.7 * k;
      g.fillRect(0, Math.round(cy), Math.round(w * 0.24), 1);
      g.fillRect(Math.round(cx), Math.round(cy - h * 0.42 * k), 1, Math.round(h * 0.2 * k));
      g.fillRect(Math.round(cx), Math.round(cy + h * 0.24 * k), 1, Math.round(h * 0.2 * k));
      g.globalAlpha = 1;
      // ejected sparks riding the cone
      g.fillStyle = hex(lite(a.c1, 0.6)); g.globalAlpha = 0.85 * k;
      for (var sp = 0; sp < 3; sp++) {
        var sa = (sp - 1) * 0.34;
        var sd = w * (0.46 + sp % 2 * 0.20);
        g.fillRect(Math.round(cx + Math.cos(sa) * sd),
                   Math.round(cy + Math.sin(sa) * sd), 2, 2);
      }
      g.globalAlpha = 1;
      // white-hot core at the barrel
      g.fillStyle = '#ffffff';
      var cr = Math.max(1.5, h * 0.19 * k);
      g.beginPath(); g.arc(cx, cy, cr, 0, Math.PI * 2); g.fill();
      g.fillStyle = hex(lite(a.c2 || a.c1, 0.5)); g.globalAlpha = 0.8;
      g.beginPath(); g.arc(cx, cy, cr * 1.45, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    },

    // an elongated energy BOLT pointing +X (rotation 0 = travelling right,
    // which is what BulletSystem sets from atan2(dy,dx)). Teardrop
    // profile: pointed nose, fat shoulder, tapered tail.
    bolt: function (g, a) {
      var w = a.w, h = a.h, cy = h / 2;
      // half-height profile: a long THIN TAIL that swells to a BLUNT
      // ROUND NOSE near the front. Asymmetric on purpose - Mark: "there's
      // a front part, there's a back part". A shape that tapers at both
      // ends reads as a lens and loses its direction.
      var SHOULDER = 0.78;
      function prof(t) {
        if (t <= 0 || t >= 1) return 0;
        if (t < SHOULDER) return Math.pow(t / SHOULDER, 1.45);   // slow swell
        return Math.sqrt(1 - Math.pow((t - SHOULDER) / (1 - SHOULDER), 2)); // round cap
      }
      function band(scaleH, x0, x1, color, alpha, yOff) {
        g.globalAlpha = alpha === undefined ? 1 : alpha;
        g.fillStyle = hex(color);
        for (var x = Math.floor(x0); x < Math.ceil(x1); x++) {
          var t = (x - x0) / (x1 - x0);
          var hh = prof(t) * (h / 2) * scaleH;
          if (hh < 0.5) continue;
          g.fillRect(x, Math.round(cy - hh) + (yOff || 0), 1, Math.max(1, Math.round(hh * 2)));
        }
        g.globalAlpha = 1;
      }
      band(1.0, 0, w, a.c1, 0.28);                       // soft outer glow
      band(0.74, 0, w, a.c1, 1);                         // body
      band(0.44, w * 0.30, w, lite(a.c1, 0.5), 1);       // inner heat (front-loaded)
      band(0.22, w * 0.50, w, '#ffffff', 0.95);          // white-hot core
      // a 1px wisp running the whole tail so the back never just stops
      g.globalAlpha = 0.5; g.fillStyle = hex(lite(a.c1, 0.25));
      g.fillRect(0, Math.round(cy), Math.round(w * 0.34), 1);
      g.globalAlpha = 1;
    },

    // a BLOBBY splash - overlapping lobes of different sizes, never a
    // circle - with droplets flung outward. Frames expand + thin out.
    splat: function (g, a) {
      var c = a.w / 2, seed = hash(a.key), n = 4;
      var k = a.f ? a.f / n : 0.6;                  // 0..1 progress
      var R = (a.w / 2 - 2) * (0.42 + 0.58 * k);
      var lobes = 7;
      function lobeSet(rMult, color, alpha) {
        g.globalAlpha = alpha === undefined ? 1 : alpha;
        g.fillStyle = hex(color);
        for (var i = 0; i < lobes; i++) {
          var ang = (i / lobes) * Math.PI * 2 + (seed % 11) * 0.21;
          // irregular: each lobe sits at its own distance with its own size
          var wob = 0.55 + ((seed >> i) % 9) / 9 * 0.75;
          var lr = R * 0.42 * wob * rMult;
          var ld = R * (0.30 + ((seed >> (i + 3)) % 7) / 7 * 0.42) * rMult;
          g.beginPath();
          g.arc(c + Math.cos(ang) * ld, c + Math.sin(ang) * ld * 0.72, lr, 0, Math.PI * 2);
          g.fill();
        }
        g.beginPath();                              // the mass in the middle
        g.arc(c, c, R * 0.52 * rMult, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1;
      }
      lobeSet(1.0, shade(a.c1, 0.4), 0.9);          // dark under-splash
      lobeSet(0.86, a.c1, 1);                       // body
      lobeSet(0.42, lite(a.c1, 0.35), 1);           // wet highlight core
      // flung droplets: many, small, and STREAKED along their fling
      // direction so they read as thrown liquid, not scattered squares
      for (var d = 0; d < 22; d++) {
        var da = (d / 22) * Math.PI * 2 + (seed % 5) * 0.4 + ((seed >> d) % 5) * 0.09;
        var dd = R * (0.92 + 0.38 * k) + ((seed >> (d + 2)) % 4);
        var dx0 = c + Math.cos(da) * dd, dy0 = c + Math.sin(da) * dd * 0.74;
        var len = 2 + ((seed >> d) % 3);
        g.globalAlpha = 0.9 - 0.35 * k;
        g.fillStyle = hex(d % 4 === 0 ? lite(a.c1, 0.3) : a.c1);
        for (var s2 = 0; s2 < len; s2++) {          // 1px streak outward
          g.fillRect(Math.round(dx0 + Math.cos(da) * s2),
                     Math.round(dy0 + Math.sin(da) * s2 * 0.74),
                     s2 === 0 ? 2 : 1, s2 === 0 ? 2 : 1);
        }
        g.globalAlpha = 1;
      }
      g.fillStyle = hex(lite(a.c1, 0.6));           // one bright gloss dot
      g.fillRect(Math.round(c - R * 0.28), Math.round(c - R * 0.30), 3, 2);
    },

    // a FLAME TONGUE: wide guttering base, wavy narrowing tip, layered
    // red -> orange -> yellow -> white. The wave shifts per frame so the
    // 4 frames read as fire moving, not a pulsing blob.
    flame: function (g, a) {
      var w = a.w, h = a.h, cx = w / 2, n = 4;
      var ph = (a.f || 1) / n * Math.PI * 2;
      // one layer = a tapering tongue with a sine wobble down its axis
      function tongue(width, height, color, alpha, wob, yBase) {
        g.globalAlpha = alpha;
        g.fillStyle = hex(color);
        for (var y = 0; y < height; y++) {
          var t = y / height;                       // 0 base -> 1 tip
          var half = width * 0.5 * Math.pow(1 - t, 0.7) * (1 - 0.15 * Math.sin(t * 9 + ph));
          if (half < 0.5) continue;
          var off = Math.sin(t * 3.2 + ph) * wob * t;
          var yy = Math.round(yBase - y);
          g.fillRect(Math.round(cx + off - half), yy, Math.max(1, Math.round(half * 2)), 1);
        }
        g.globalAlpha = 1;
      }
      // per-frame flicker: each frame is a different height + lean, so
      // the 4-frame loop reads as fire MOVING rather than pulsing
      var lick = 0.86 + 0.14 * Math.sin(ph * 1.5);
      var lean = Math.sin(ph) * w * 0.06;
      var base = h - 2;
      tongue(w * 0.74, h * 0.92 * lick, '#d93a3a', 0.5, w * 0.13 + lean, base);
      tongue(w * 0.50, h * 0.80 * lick, '#ff6b3b', 0.85, w * 0.15 + lean, base);
      tongue(w * 0.31, h * 0.62 * lick, '#f2c33c', 0.95, w * 0.16 + lean, base);
      tongue(w * 0.15, h * 0.40 * lick, '#fff6e0', 0.95, w * 0.17 + lean, base);
      // embers popping off the tip
      g.fillStyle = '#f2c33c'; g.globalAlpha = 0.8;
      for (var e = 0; e < 3; e++) {
        var ea = ph + e * 2.1;
        g.fillRect(Math.round(cx + Math.sin(ea) * w * 0.28),
                   Math.round(base - h * (0.86 + 0.05 * Math.sin(ea * 2))), 2, 2);
      }
      g.globalAlpha = 1;
    },

    puddle: function (g, a) {    // now an irregular SETTLED splat, not an
      // ellipse: uneven lobes, droplet flecks, wet gloss (v0.23.0)
      var c = a.w / 2, cy = a.h * 0.62, seed = hash(a.key), i;
      var R = a.w / 2 - 3;
      function pool(rMult, color, alpha) {
        g.globalAlpha = alpha; g.fillStyle = hex(color);
        for (i = 0; i < 8; i++) {
          var ang = (i / 8) * Math.PI * 2 + (seed % 7) * 0.3;
          var wob = 0.5 + ((seed >> i) % 9) / 9 * 0.7;
          g.beginPath();
          g.arc(c + Math.cos(ang) * R * 0.42 * rMult,
                cy + Math.sin(ang) * R * 0.26 * rMult,
                R * 0.40 * wob * rMult, 0, Math.PI * 2);
          g.fill();
        }
        g.beginPath(); g.ellipse(c, cy, R * 0.62 * rMult, R * 0.36 * rMult, 0, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1;
      }
      pool(1.0, shade(a.c1, 0.45), 0.85);           // dark spread edge
      pool(0.82, a.c1, 1);                          // body
      pool(0.34, shade(a.c1, 0.18), 1);             // deeper middle
      g.fillStyle = hex(a.c2);                      // flecks that broke off
      for (i = 0; i < 5; i++) {
        var fa = i * 1.9 + (seed % 4);
        g.fillRect(Math.round(c + Math.cos(fa) * R * 1.02),
                   Math.round(cy + Math.sin(fa) * R * 0.58), 2, 2);
      }
      g.fillStyle = hex(lite(a.c1, 0.55));          // wet gloss, up-left
      g.fillRect(Math.round(c - R * 0.34), Math.round(cy - R * 0.26), 5, 2);
      g.fillRect(Math.round(c - R * 0.10), Math.round(cy - R * 0.32), 3, 1);
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
    herofig: function (g, a) {                       // placeholder rescued hero
      var w = a.w, h = a.h;
      g.fillStyle = 'rgba(53,208,255,0.18)';         // cyan lab glow halo
      g.fillRect(2, 2, w - 4, h - 4);
      // stasis pod outline
      g.fillStyle = hex(P.INK); g.fillRect(6, 4, w - 12, h - 8);
      g.fillStyle = hex(P.STEEL); g.fillRect(8, 6, w - 16, h - 12);
      // silhouette figure inside
      g.fillStyle = hex(P.GRAPE);
      g.fillRect(w / 2 - 5, 12, 10, 10);             // head
      g.fillRect(w / 2 - 7, 22, 14, 20);             // body
      g.fillStyle = hex(P.CYAN);
      g.font = '14px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('?', w / 2, h / 2 + 2);             // mystery hero
      // sparkles
      g.fillStyle = hex(P.WHITE);
      g.fillRect(10, 10, 2, 2); g.fillRect(w - 12, h - 16, 2, 2);
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

    g.clearRect(W - 6, H - 6, 6, 6);   // reserved transparent px_missing cell

    if (scene.textures.exists('atlas')) scene.textures.remove('atlas');
    var tex = scene.textures.addCanvas('atlas', canvas);
    places.forEach(function (p) {
      tex.add(p.a.key, 0, p.x, p.y, p.a.w, p.a.h);
    });
    // SAFE FALLBACK (v0.11.4, the "purple squares" lesson): Phaser
    // resolves a missing frame to the atlas's FIRST frame - here the
    // 160px purple D5 boss, i.e. a giant purple square on screen. Remap
    // unknown frame names to a guaranteed-transparent 4px corner frame
    // instead, so a miss renders invisible and only logs a warning.
    tex.add('px_missing', 0, W - 6, H - 6, 4, 4);
    var origGet = Phaser.Textures.Texture.prototype.get;
    tex.get = function (name) {
      if (typeof name === 'string' && name !== '__BASE' && !this.has(name)) {
        if (typeof console !== 'undefined') console.warn('PC missing frame -> blank:', name);
        name = 'px_missing';
      }
      return origGet.call(this, name);
    };
    // free the individual real-art textures - only the atlas goes to the GPU
    if (realKeys) Object.keys(realKeys).forEach(function (k) {
      if (scene.textures.exists(k)) scene.textures.remove(k);
    });
    return { frames: places.length, placeholders: missing, w: W, h: H };
  };
})();
