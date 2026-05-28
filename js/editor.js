// editor.js - in-game level editor (dev tool, removable for release).
//
// SDD.scenes.editor lets a designer paint tiles, place/edit spawns +
// movers, save the result back into js/level_X_Y.js via the File
// System Access API (Chrome/Edge desktop) or a download fallback, and
// hot-test the level by jumping into the regular level scene.
//
// Mutates SDD.levels[key] in place while editing so Test instantly
// reflects edits. Save serialises that live object back to the file.
//
// REMOVAL (for public release):
//   1. Delete this file.
//   2. Delete the `<script src="js/editor.js"></script>` in index.html.
//   3. Delete the LEVEL EDITOR menu item + handler in scenes.js.
// No other code references the editor scene.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  var STAGE_KEYS = ['1-1', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2',
                    '5-1', '5-2', '6-1', '6-2', '7-1'];
  var STAGE_NAMES = {
    '1-1': 'Light & Darkness',
    '2-1': 'Sky Above', '2-2': 'Sea Below',
    '3-1': 'Mountain Rise', '3-2': 'Garden Path',
    '4-1': 'Solar Climb',   '4-2': 'Moonlit Run',
    '5-1': 'Wings of Day',  '5-2': 'Deep Currents',
    '6-1': 'Plains to Forest', '6-2': 'Creeping Things',
    '7-1': 'The Garden'
  };

  // -----------------------------------------------------------------
  // Palette definitions. Tools / tile codes / spawn types each get a
  // one-line "what is this" description so designers (and Mark) don't
  // have to read the engine to know what a button does.
  // -----------------------------------------------------------------
  var TOOL_DEFS = [
    { id: 'tile',   key: '1', label: 'TILE',
      desc: 'Paint solid blocks, water, lava, and power-up bricks. Brush size 1/3/5. Right-click to erase.' },
    { id: 'spawn',  key: '2', label: 'SPAWN',
      desc: 'Place enemies, cores, NPCs, checkpoints, etc. Right-click an existing spawn to delete.' },
    { id: 'mover',  key: '3', label: 'MOVER',
      desc: 'Click-and-drag from a START tile to an END tile to define a moving platform. Click an existing mover to edit.' },
    { id: 'select', key: '4', label: 'SELECT',
      desc: 'Click any spawn or mover to inspect / edit / delete its properties.' }
  ];

  var TILE_DEFS = [
    { c: ' ', label: 'erase',  desc: 'Empty space - paints over any tile.', color: '#3a3a4a' },
    { c: 'X', label: 'ground', desc: 'Solid ground / dirt. Theme-aware visuals.', color: '#8a6a3c' },
    { c: '#', label: 'brick',  desc: 'Solid brick. Theme-aware.', color: '#a85030' },
    { c: '=', label: 'oneway', desc: 'One-way platform - jump up through, land on top.', color: '#c4a070' },
    { c: 'V', label: 'vine',   desc: 'Climbable vine. Player grabs to climb up/down.', color: '#5a9038' },
    { c: 'W', label: 'water',  desc: 'Submerged water - slow swim physics.', color: '#3a78a8' },
    { c: '~', label: 'w.surf', desc: 'Water surface tile (top row of water).', color: '#7ac0e0' },
    { c: 'L', label: 'lava',   desc: 'Damaging lava. Touch = lose a life.', color: '#ff5418' },
    { c: '?', label: 'q-core', desc: 'Mystery brick - hit from below to release a power core.', color: '#46f0ff' },
    { c: 'G', label: 'q-grow', desc: 'Mystery brick - hit from below for a Grow powerup.', color: '#ffb24a' },
    { c: 'B', label: 'q-blast',desc: 'Mystery brick - hit from below for a Blast powerup.', color: '#fff0a0' },
    { c: 'U', label: 'q-used', desc: 'Already-spent mystery brick (solid).', color: '#605040' }
  ];
  // Grouped tile palette - mirrors the spawn groups for visual consistency.
  var TILE_GROUPS = [
    { title: 'SOLID',         codes: ['X', '#'] },
    { title: 'PLATFORMS',     codes: ['=', 'V'] },
    { title: 'WATER',         codes: ['~', 'W'] },
    { title: 'HAZARDS',       codes: ['L'] },
    { title: 'POWER BLOCKS',  codes: ['?', 'G', 'B', 'U'] },
    { title: 'TOOLS',         codes: [' '] }
  ];

  // Grouped spawn palette. Each entry: id, label, desc. Mark wants
  // every spawn type from any stage available everywhere - groups
  // are for navigability, not restriction.
  var SPAWN_GROUPS = [
    { title: 'PLAYER & FLOW', items: [
      { id: 'player',     desc: 'The player start position. Each stage needs exactly one.' },
      { id: 'checkpoint', desc: 'Mid-level checkpoint - reset point on death.' }
    ]},
    { title: 'COLLECTIBLES', items: [
      { id: 'core',     desc: 'Power core - collect to power the time machine. 100 pts.' },
      { id: 'timepart', desc: 'Time-machine part. One per stage finishes the run.' }
    ]},
    { title: 'GROUND ENEMIES', items: [
      { id: 'walker',  desc: 'Walks back and forth. Stompable except lion + porcupine variants (unkillable).' },
      { id: 'thrower', desc: 'Stationary thrower - lobs projectiles. NOW stompable.' },
      { id: 'crab',    desc: 'Crab - sideways scuttle on the floor.' },
      { id: 'stampede', desc: 'Wildebeest stampede - 8 tiles wide, 1 tall, charges back and forth. NOT stompable. range = patrol radius in tiles.' }
    ]},
    { title: 'FLYING / WATER', items: [
      { id: 'wisp',    desc: 'Floating wisp. Stompable. Set "shoots:true" for storm-cloud shooter.' },
      { id: 'octopus', desc: 'Underwater octopus - eight-arm hazard. NOT stompable.' },
      { id: 'eel',     desc: 'Electric eel - vertical patrol with shock. NOT stompable.' }
    ]},
    { title: 'HAZARDS', items: [
      { id: 'skyhazard',  desc: 'Sky hazard (sun flare, etc). Periodic descend. NOT stompable.' },
      { id: 'twister',    desc: 'Tornado - sweeping ground hazard. NOT stompable.' },
      { id: 'bubble',     desc: 'Bubble-up vertical hazard (water levels).' },
      { id: 'leafstream', desc: 'Falling-leaf platform stream. Use to bridge a vertical gap.' }
    ]},
    { title: 'NPC & SIGNATURE', items: [
      { id: 'npc',       desc: 'NPC - kind: adam, eve, etc. Talks on overlap.' },
      { id: 'signature', desc: 'Day-signature power (sunburst, cloudglide, pearl, airbubble, ...).' }
    ]}
  ];

  // Friendly default field values per spawn type (used by placeSpawn).
  function spawnDefaults(type) {
    switch (type) {
      case 'signature':  return { kind: 'sunburst' };
      case 'skyhazard':  return { kind: 'flare', period: 110 };
      case 'npc':        return { kind: 'adam' };
      case 'twister':    return { spd: 1.6 };
      case 'eel':        return { maxH: 96, period: 220, phase: 0 };
      case 'stampede':   return { range: 24, spd: 2.0, dir: -1 };
      case 'leafstream': return { period: 70, fallSpeed: 1.0, swayAmp: 2 };
      default:           return {};
    }
  }

  // Catalog of valid string values for property dropdowns. Empty entry
  // means "theme default" so a level designer can leave it auto.
  var FIELD_ENUMS = {
    // spawn.kind values
    'signature.kind': [
      'sunburst', 'cloudglide', 'pearl', 'coolingwater', 'leafshot',
      'sunshield', 'starjump', 'airbubble', 'callinghorn',
      'friendlybugs', 'pollentrail', 'beetleride', 'doveblessing'
    ],
    'skyhazard.kind': ['flare', 'meteor', 'meteorH', 'lavaPlume'],
    'npc.kind':       ['adam', 'eve', 'lion', 'deer', 'dove'],
    // spawn.variant values (theme default = empty)
    'walker.variant':  ['', 'lion', 'porcupine', 'beetle', 'leaf', 'rock', 'clam', 'flame', 'cloud', 'fruit'],
    'wisp.variant':    ['', 'bird', 'star', 'jellyfish', 'leaf', 'bat', 'smoke', 'stormcloud', 'bee'],
    'thrower.variant': ['', 'rain', 'rock', 'seed', 'sun', 'fruit'],
    // Boolean-ish flag
    'wisp.shoots': ['false', 'true']
  };
  // Editable property layouts. Each entry: { field, optional? }
  var SPAWN_FIELDS = {
    player:     [{f:'tx'},{f:'ty'},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    walker:     [{f:'tx'},{f:'ty'},{f:'variant',opt:true},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    thrower:    [{f:'tx'},{f:'ty'},{f:'variant',opt:true},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    wisp:       [{f:'tx'},{f:'ty'},{f:'variant',opt:true},{f:'shoots',opt:true},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    crab:       [{f:'tx'},{f:'ty'},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    core:       [{f:'tx'},{f:'ty'},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    timepart:   [{f:'tx'},{f:'ty'},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    npc:        [{f:'tx'},{f:'ty'},{f:'kind'},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    checkpoint: [{f:'tx'},{f:'ty'}],
    signature:  [{f:'tx'},{f:'ty'},{f:'kind'},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    skyhazard:  [{f:'tx'},{f:'ty'},{f:'kind'},{f:'period',opt:true},{f:'dir',opt:true},{f:'scale',opt:true},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    bubble:     [{f:'tx'},{f:'ty'},{f:'scale',opt:true},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    octopus:    [{f:'tx'},{f:'ty'},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    twister:    [{f:'tx'},{f:'ty'},{f:'spd',opt:true},{f:'scale',opt:true},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    eel:        [{f:'tx'},{f:'ty'},{f:'maxH',opt:true},{f:'period',opt:true},{f:'phase',opt:true},{f:'offsetX',opt:true},{f:'offsetY',opt:true}],
    stampede:   [{f:'tx'},{f:'ty'},{f:'range',opt:true},{f:'spd',opt:true},{f:'dir',opt:true},{f:'offsetX',opt:true},{f:'offsetY',opt:true}]
  };

  // -----------------------------------------------------------------
  // DOM overlay - built on enter(), torn down on exit().
  //
  // Layout (LDtk / Tiled-inspired):
  //   top bar   = stage picker + tool tabs + action buttons
  //   tool-desc = one-line "what this tool does"
  //   left      = palette section for the active tool (tile | spawn | ...)
  //   right     = a tabbed inspector: PROPERTIES | VARIANTS
  //   bottom    = hover coords + counts + dirty + toast
  // -----------------------------------------------------------------
  function buildUI(scene) {
    var ui = document.createElement('div');
    ui.id = 'editor-ui';

    var stageOpts = STAGE_KEYS.map(function (k) {
      return '<option value="' + k + '">DAY ' + k + ' - ' + (STAGE_NAMES[k] || '') + '</option>';
    }).join('');
    var toolBtns = TOOL_DEFS.map(function (t) {
      return '<button data-tool="' + t.id + '" title="' + escapeHtml(t.desc) + ' (' + t.key + ')">' +
             t.label + ' <span class="ed-key">[' + t.key + ']</span></button>';
    }).join('');

    ui.innerHTML = [
      '<div class="ed-bar ed-top">',
      '  <label title="Switch which stage to edit">STAGE',
      '    <select id="ed-stage">', stageOpts, '</select>',
      '  </label>',
      '  <div class="ed-tools">', toolBtns, '</div>',
      '  <div class="ed-zoom">',
      '    <button id="ed-zoom-out" title="Zoom out (-)">−</button>',
      '    <span id="ed-zoom-pct" title="Current zoom level">100%</span>',
      '    <button id="ed-zoom-in" title="Zoom in (+)">+</button>',
      '    <button id="ed-zoom-fit" title="Fit the entire stage in view">FIT</button>',
      '    <button id="ed-zoom-100" title="Reset to 100% (1:1 game scale)">1:1</button>',
      '  </div>',
      '  <div class="ed-actions">',
      '    <button id="ed-test" title="Test the current edits live (T) - jumps into the level scene with the in-memory edits.">▶ TEST</button>',
      '    <button id="ed-save-variant" title="Save the current edits as a named variant in your browser library (no disk write).">SAVE VARIANT</button>',
      '    <button id="ed-save" title="Write the current edits to disk as js/level_X_Y.js (Ctrl+S). Picks a file once, then writes directly.">EXPORT .js</button>',
      '    <button id="ed-saveas" title="Pick a different target file and write the level there.">EXPORT AS</button>',
      '    <button id="ed-copy-mains" title="Copy every stage flagged MAIN as a single JSON blob to your clipboard. Paste it to Claude to commit as the official maps.">COPY MAINS</button>',
      '    <button id="ed-exit" title="Exit back to the title menu (Esc)">EXIT</button>',
      '  </div>',
      '</div>',

      '<div class="ed-bar ed-desc" id="ed-tool-desc"></div>',

      '<div class="ed-bar ed-left">',
      '  <div class="ed-section" id="ed-tile-pal">',
      '    <h4>TILES <span class="ed-help" title="Click a tile, then paint on the canvas. Right-click to erase. Brush size below.">?</span></h4>',
      '    <div id="ed-tile-groups"></div>',
      '    <label class="ed-brush" title="Brush radius - 1 paints one cell, 3 paints a 3x3, 5 paints a 5x5.">BRUSH ',
      '      <select id="ed-brush-size"><option>1</option><option>3</option><option>5</option></select>',
      '    </label>',
      '  </div>',
      '  <div class="ed-section" id="ed-spawn-pal" hidden>',
      '    <h4>SPAWNS <span class="ed-help" title="Click a spawn type, then click on the canvas to place. Right-click an existing spawn to delete.">?</span></h4>',
      '    <div id="ed-spawn-groups"></div>',
      '  </div>',
      '  <div class="ed-section" id="ed-mover-pal" hidden>',
      '    <h4>MOVER PLATFORMS</h4>',
      '    <p class="ed-hint">Click-and-drag on the canvas from a <b>START</b> tile (yellow dot) to an <b>END</b> tile (orange dot) to define a new moving platform.</p>',
      '    <p class="ed-hint">Click an existing mover to select it and edit its speed / phase / endpoints in the right panel.</p>',
      '  </div>',
      '  <div class="ed-section" id="ed-select-pal" hidden>',
      '    <h4>SELECT</h4>',
      '    <p class="ed-hint">Click any spawn or mover on the canvas to select it. Its fields appear on the right.</p>',
      '    <p class="ed-hint">Arrow keys nudge tile-by-tile, <b>Delete</b> removes.</p>',
      '  </div>',
      '</div>',

      '<div class="ed-bar ed-right">',
      '  <div class="ed-tab-row">',
      '    <button data-rtab="props"    class="active" title="Inspect & edit the currently selected spawn / mover">PROPERTIES</button>',
      '    <button data-rtab="stage"    title="Stage-wide settings: flappy hitbox tuning per Danny size, etc.">STAGE</button>',
      '    <button data-rtab="variants" title="Library of saved variants of this stage. Load, rename, delete, or mark one as the main version used by the game.">VARIANTS</button>',
      '  </div>',
      '  <div id="ed-tab-props" class="ed-tab-body">',
      '    <div id="ed-props-body"><p class="ed-hint">Nothing selected. Switch to SELECT tool and click any spawn or mover.</p></div>',
      '  </div>',
      '  <div id="ed-tab-stage" class="ed-tab-body" hidden>',
      '    <h5>FLAPPY HITBOX <span class="ed-help" title="Only used when this stage has flappy: true. Adjust Danny\'s collision box per size. Sprite stays the same; just the box that registers hits changes.">?</span></h5>',
      '    <p class="ed-hint" id="ed-flappy-warn" hidden>This stage is not flappy. The fields below are still saved but unused until you set flappy: true.</p>',
      '    <div class="ed-prop-row"><b style="display:inline-block;width:90px">SMALL DANNY</b>',
      '      <label>dx <input id="ed-fb-sdx" type="number" step="1" style="width:54px"></label>',
      '      <label>w <input id="ed-fb-sw" type="number" step="1" min="1" max="48" style="width:54px"></label>',
      '      <label>h <input id="ed-fb-sh" type="number" step="1" min="1" max="64" style="width:54px"></label>',
      '    </div>',
      '    <div class="ed-prop-row"><b style="display:inline-block;width:90px">BIG DANNY</b>',
      '      <label>dx <input id="ed-fb-bdx" type="number" step="1" style="width:54px"></label>',
      '      <label>w <input id="ed-fb-bw" type="number" step="1" min="1" max="48" style="width:54px"></label>',
      '      <label>h <input id="ed-fb-bh" type="number" step="1" min="1" max="64" style="width:54px"></label>',
      '    </div>',
      '    <p class="ed-hint"><b>dx</b> shifts the box right (+) or left (-) from the sprite center. <b>w</b> / <b>h</b> are the box width / height in pixels. Changes apply immediately to any live player when you TEST, and bake into the file when you EXPORT .js.</p>',
      '  </div>',
      '  <div id="ed-tab-variants" class="ed-tab-body" hidden>',
      '    <p class="ed-hint">Each variant is a renamable saved copy of this stage stored in your browser. Marking one as <b>MAIN</b> tells the game to use it at boot instead of the on-disk file.</p>',
      '    <div id="ed-variant-list"></div>',
      '  </div>',
      '</div>',

      '<div class="ed-bar ed-bottom" id="ed-status">',
      '  <span id="ed-coords" title="Hovered tile column, row">--, --</span>',
      '  <span id="ed-counts" title="Live counts for the current stage"></span>',
      '  <span id="ed-dirty" title="Unsaved changes indicator"></span>',
      '  <span id="ed-toast"></span>',
      '</div>',
      // Floating tooltip that follows the mouse over the canvas, showing
      // whatever spawn/mover/tile is under the cursor. Pure-DOM so it can
      // render outside the canvas's pixel grid without aliasing.
      '<div id="ed-hover-tip" hidden></div>'
    ].join('');
    document.body.appendChild(ui);

    // ---- Tile palette (grouped, collapsible like spawn palette) ----
    var groupState = loadGroupState();
    var tgroupBox = ui.querySelector('#ed-tile-groups');
    TILE_GROUPS.forEach(function (g) {
      var section = document.createElement('div');
      section.className = 'ed-tile-group';
      var open = groupState['tile.' + g.title] !== false;
      section.classList.toggle('collapsed', !open);
      section.innerHTML =
        '<h5 class="ed-group-head" title="Click to collapse / expand">' +
        '  <span class="ed-group-arrow">' + (open ? '▼' : '▶') + '</span> ' + g.title +
        '</h5>' +
        '<div class="ed-palette"></div>';
      var pal = section.querySelector('.ed-palette');
      g.codes.forEach(function (code) {
        var t = TILE_DEFS.filter(function (x) { return x.c === code; })[0];
        if (!t) return;
        var b = document.createElement('button');
        b.className = 'ed-tile-btn';
        b.setAttribute('data-tile', t.c);
        b.title = t.label.toUpperCase() + ' - ' + t.desc;
        b.innerHTML =
          '<span class="ed-tile-glyph" style="color:' + t.color + '">' +
          (t.c === ' ' ? '·' : t.c) + '</span>' +
          '<span class="ed-tile-label">' + t.label + '</span>' +
          '<span class="ed-badge" data-usage="' + t.c + '" hidden></span>';
        pal.appendChild(b);
      });
      section.querySelector('.ed-group-head').addEventListener('click', function () {
        var nowOpen = section.classList.toggle('collapsed');
        groupState['tile.' + g.title] = !nowOpen;
        section.querySelector('.ed-group-arrow').textContent = nowOpen ? '▶' : '▼';
        saveGroupState(groupState);
      });
      tgroupBox.appendChild(section);
    });

    // ---- Spawn palette (grouped, collapsible) ----
    // Collapse state persists in localStorage so a designer's chosen
    // open sections survive scene re-enters / page reloads.
    var sgroupBox = ui.querySelector('#ed-spawn-groups');
    SPAWN_GROUPS.forEach(function (g) {
      var section = document.createElement('div');
      section.className = 'ed-spawn-group';
      var open = groupState[g.title] !== false;
      section.classList.toggle('collapsed', !open);
      section.innerHTML =
        '<h5 class="ed-group-head" title="Click to collapse / expand this group">' +
        '  <span class="ed-group-arrow">' + (open ? '▼' : '▶') + '</span> ' + g.title +
        '</h5>' +
        '<div class="ed-palette"></div>';
      var pal = section.querySelector('.ed-palette');
      g.items.forEach(function (s) {
        var b = document.createElement('button');
        b.className = 'ed-spawn-btn';
        b.setAttribute('data-spawn', s.id);
        b.title = s.id.toUpperCase() + ' - ' + s.desc;
        b.innerHTML = '<span class="ed-spawn-name">' + s.id + '</span>' +
          '<span class="ed-badge" data-usage-spawn="' + s.id + '" hidden></span>';
        pal.appendChild(b);
      });
      section.querySelector('.ed-group-head').addEventListener('click', function () {
        var nowOpen = section.classList.toggle('collapsed');
        // collapsed class flipped: nowOpen=true means it's NOW collapsed
        groupState[g.title] = !nowOpen;
        section.querySelector('.ed-group-arrow').textContent = nowOpen ? '▶' : '▼';
        saveGroupState(groupState);
      });
      sgroupBox.appendChild(section);
    });

    // ---- Tool-description bar updates with tool ----
    function refreshToolDesc() {
      var d = TOOL_DEFS.filter(function (t) { return t.id === scene.tool; })[0];
      ui.querySelector('#ed-tool-desc').textContent = d ? d.label + ': ' + d.desc : '';
    }
    ui._refreshToolDesc = refreshToolDesc;

    // ---- Stage tab: flappy hitbox controls ----
    var FB_FIELDS = [
      { id: 'ed-fb-sdx', key: 'flappySmallHitbox', sub: 'dx' },
      { id: 'ed-fb-sw',  key: 'flappySmallHitbox', sub: 'w'  },
      { id: 'ed-fb-sh',  key: 'flappySmallHitbox', sub: 'h'  },
      { id: 'ed-fb-bdx', key: 'flappyBigHitbox',   sub: 'dx' },
      { id: 'ed-fb-bw',  key: 'flappyBigHitbox',   sub: 'w'  },
      { id: 'ed-fb-bh',  key: 'flappyBigHitbox',   sub: 'h'  }
    ];
    FB_FIELDS.forEach(function (f) {
      ui.querySelector('#' + f.id).addEventListener('input', function (e) {
        var v = parseInt(e.target.value, 10);
        if (!isFinite(v)) return;
        var lvl = scene.lvl;
        if (!lvl[f.key]) {
          lvl[f.key] = (f.key === 'flappySmallHitbox')
            ? { dx: 2, w: 9, h: 19 }
            : { dx: 0, w: 11, h: 26 };
        }
        lvl[f.key][f.sub] = v;
        scene.dirty = true;
        // Live-update the player's hitbox if the level scene is
        // currently running (TEST mode). The next grow/shrink also
        // re-reads these values via applyFlappyHitboxNow.
        if (SDD.scene && SDD.scene.player && SDD.scene.flappy &&
            typeof SDD.applyFlappyHitboxNow === 'function') {
          SDD.applyFlappyHitboxNow(SDD.scene.player, !!SDD.scene.player.big);
        }
        refreshStatus(ui, scene);
      });
    });
    ui._refreshStageTab = function () {
      var lvl = scene.lvl;
      ui.querySelector('#ed-flappy-warn').hidden = !!lvl.flappy;
      var s = lvl.flappySmallHitbox || { dx: 2, w: 9, h: 19 };
      var b = lvl.flappyBigHitbox   || { dx: 0, w: 11, h: 26 };
      ui.querySelector('#ed-fb-sdx').value = s.dx;
      ui.querySelector('#ed-fb-sw').value  = s.w;
      ui.querySelector('#ed-fb-sh').value  = s.h;
      ui.querySelector('#ed-fb-bdx').value = b.dx;
      ui.querySelector('#ed-fb-bw').value  = b.w;
      ui.querySelector('#ed-fb-bh').value  = b.h;
    };

    // ---- Initial state ----
    refreshToolHighlight(ui, scene);
    refreshTileHighlight(ui, scene);
    refreshSpawnHighlight(ui, scene);
    refreshStatus(ui, scene);
    refreshToolDesc();
    refreshUsageBadges(ui, scene);
    refreshVariantList(ui, scene);
    ui._refreshStageTab();
    ui.querySelector('#ed-stage').value = scene.day + '-' + scene.stage;

    // ---- Event wiring ----
    ui.querySelector('#ed-stage').addEventListener('change', function (e) {
      var parts = e.target.value.split('-');
      scene.switchStage(parseInt(parts[0], 10), parseInt(parts[1], 10));
    });
    ui.querySelectorAll('[data-tool]').forEach(function (b) {
      b.addEventListener('click', function () {
        scene.setTool(b.getAttribute('data-tool'));
      });
    });
    ui.querySelectorAll('.ed-tile-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        scene.brushTile = b.getAttribute('data-tile');
        scene.tool = 'tile';
        refreshToolHighlight(ui, scene);
        refreshTileHighlight(ui, scene);
        refreshToolDesc();
      });
    });
    ui.querySelectorAll('.ed-spawn-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        scene.brushSpawn = b.getAttribute('data-spawn');
        scene.tool = 'spawn';
        refreshToolHighlight(ui, scene);
        refreshSpawnHighlight(ui, scene);
        refreshToolDesc();
      });
    });
    ui.querySelector('#ed-brush-size').addEventListener('change', function (e) {
      scene.brushSize = parseInt(e.target.value, 10) || 1;
    });
    ui.querySelector('#ed-save').addEventListener('click', function () { scene.save(false); });
    ui.querySelector('#ed-saveas').addEventListener('click', function () { scene.save(true); });
    ui.querySelector('#ed-save-variant').addEventListener('click', function () { scene.saveVariant(); });
    ui.querySelector('#ed-copy-mains').addEventListener('click', function () { scene.copyMainsToClipboard(); });
    ui.querySelector('#ed-test').addEventListener('click', function () { scene.test(); });
    ui.querySelector('#ed-zoom-in').addEventListener('click', function () { scene.zoomStep(+1); });
    ui.querySelector('#ed-zoom-out').addEventListener('click', function () { scene.zoomStep(-1); });
    ui.querySelector('#ed-zoom-fit').addEventListener('click', function () { scene.zoomFit(); });
    ui.querySelector('#ed-zoom-100').addEventListener('click', function () { scene.setZoom(1); });
    refreshZoomLabel(ui, scene);
    ui.querySelector('#ed-exit').addEventListener('click', function () { scene.exitToMenu(); });

    // Right-panel tab switching
    ui.querySelectorAll('[data-rtab]').forEach(function (b) {
      b.addEventListener('click', function () {
        var name = b.getAttribute('data-rtab');
        ui.querySelectorAll('[data-rtab]').forEach(function (x) {
          x.classList.toggle('active', x === b);
        });
        ui.querySelector('#ed-tab-props').hidden = name !== 'props';
        ui.querySelector('#ed-tab-stage').hidden = name !== 'stage';
        ui.querySelector('#ed-tab-variants').hidden = name !== 'variants';
        if (name === 'variants') refreshVariantList(ui, scene);
      });
    });

    return ui;
  }

  // Used by the SELECT/MOVER drag handlers so undo can restore the
  // pre-drag state regardless of how the drag mutated the entity.
  function snapshotSpawn(s) {
    return { tx: s.tx, ty: s.ty, offsetX: s.offsetX, offsetY: s.offsetY };
  }
  function snapshotMover(m) {
    return { tx: m.tx, ty: m.ty, tx1: m.tx1, ty1: m.ty1, spd: m.spd, phase: m.phase };
  }
  function restoreSnapshot(ref, snap) {
    for (var k in snap) {
      if (!snap.hasOwnProperty(k)) continue;
      if (snap[k] === undefined) delete ref[k];
      else ref[k] = snap[k];
    }
  }

  // Discrete zoom stops. Whole-numbers around 1.0 + halves below for
  // wide overviews. Ctrl+wheel snaps between these levels.
  var ZOOM_STOPS = [0.20, 0.25, 0.33, 0.5, 0.66, 0.85, 1.0, 1.25, 1.5, 2.0, 3.0];
  var ZOOM_KEY = 'sdd.editorUI.zoom.v1';
  function loadZoom() {
    var v = parseFloat(localStorage.getItem(ZOOM_KEY) || '1');
    return isFinite(v) && v > 0 ? v : 1;
  }
  function persistZoom(z) {
    try { localStorage.setItem(ZOOM_KEY, String(z)); } catch (e) {}
  }
  function nearestStop(z) {
    var best = ZOOM_STOPS[0], bestD = Infinity;
    for (var i = 0; i < ZOOM_STOPS.length; i++) {
      var d = Math.abs(ZOOM_STOPS[i] - z);
      if (d < bestD) { best = ZOOM_STOPS[i]; bestD = d; }
    }
    return best;
  }
  function refreshZoomLabel(ui, scene) {
    var el = ui.querySelector('#ed-zoom-pct');
    if (el) el.textContent = Math.round(scene.zoom * 100) + '%';
  }

  var GROUP_STATE_KEY = 'sdd.editorUI.groups.v1';
  function loadGroupState() {
    try { return JSON.parse(localStorage.getItem(GROUP_STATE_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function saveGroupState(s) {
    try { localStorage.setItem(GROUP_STATE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  function refreshToolHighlight(ui, scene) {
    ui.querySelectorAll('[data-tool]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tool') === scene.tool);
    });
    // Show only the relevant section
    ui.querySelector('#ed-tile-pal').hidden = scene.tool !== 'tile';
    ui.querySelector('#ed-spawn-pal').hidden = scene.tool !== 'spawn';
    ui.querySelector('#ed-mover-pal').hidden = scene.tool !== 'mover';
    ui.querySelector('#ed-select-pal').hidden = scene.tool !== 'select';
    if (ui._refreshToolDesc) ui._refreshToolDesc();
  }
  // "● 12" badges next to each palette entry showing how many of that
  // tile / spawn type exist in the current stage. Helps a designer
  // see at a glance what's actually used in the level they're editing.
  function refreshUsageBadges(ui, scene) {
    var lvl = scene.lvl;
    if (!lvl) return;
    var tileCounts = {};
    for (var r = 0; r < lvl.height; r++) {
      var row = lvl.tiles[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row[c];
        tileCounts[ch] = (tileCounts[ch] || 0) + 1;
      }
    }
    ui.querySelectorAll('[data-usage]').forEach(function (b) {
      var ch = b.getAttribute('data-usage');
      var n = tileCounts[ch] || 0;
      if (n > 0) { b.textContent = '● ' + n; b.hidden = false; }
      else { b.hidden = true; }
    });
    var spawnCounts = {};
    lvl.spawns.forEach(function (sp) {
      spawnCounts[sp.type] = (spawnCounts[sp.type] || 0) + 1;
    });
    ui.querySelectorAll('[data-usage-spawn]').forEach(function (b) {
      var k = b.getAttribute('data-usage-spawn');
      var n = spawnCounts[k] || 0;
      if (n > 0) { b.textContent = '● ' + n; b.hidden = false; }
      else { b.hidden = true; }
    });
  }
  // Variant library list UI - reads from localStorage via SDD.editorLib.
  function refreshVariantList(ui, scene) {
    var box = ui.querySelector('#ed-variant-list');
    if (!box) return;
    var key = scene.day + '-' + scene.stage;
    var entry = SDD.editorLib.get(key);
    var html = [];
    html.push('<div class="ed-variant-row ed-variant-row-default">');
    html.push('  <div class="ed-variant-name"><b>On-disk file</b><div class="ed-variant-sub">js/level_' + scene.day + '_' + scene.stage + '.js</div></div>');
    if (entry.active === -1) html.push('  <span class="ed-active">MAIN</span>');
    else html.push('  <button data-vact="-1" title="Use the on-disk level instead of any saved variant.">SET MAIN</button>');
    html.push('</div>');
    if (!entry.variants.length) {
      html.push('<p class="ed-hint">No saved variants yet. Use SAVE VARIANT to create one.</p>');
    } else {
      entry.variants.forEach(function (v, i) {
        html.push('<div class="ed-variant-row">');
        html.push('  <div class="ed-variant-name"><b>' + escapeHtml(v.name) + '</b>' +
                  '<div class="ed-variant-sub">' + new Date(v.savedAt).toLocaleString() + '</div></div>');
        html.push('  <div class="ed-variant-acts">');
        html.push('    <button data-vload="' + i + '" title="Load this variant into the editor (replaces current edits).">LOAD</button>');
        html.push('    <button data-vren="' + i + '" title="Rename this variant.">REN</button>');
        if (entry.active === i)
          html.push('    <span class="ed-active">MAIN</span>');
        else
          html.push('    <button data-vact="' + i + '" title="Mark this variant as the main version - the game will use it at boot.">SET MAIN</button>');
        html.push('    <button data-vdel="' + i + '" title="Delete this variant." class="ed-danger">DEL</button>');
        html.push('  </div>');
        html.push('</div>');
      });
    }
    box.innerHTML = html.join('');
    box.querySelectorAll('[data-vload]').forEach(function (b) {
      b.addEventListener('click', function () { scene.loadVariant(parseInt(b.getAttribute('data-vload'), 10)); });
    });
    box.querySelectorAll('[data-vren]').forEach(function (b) {
      b.addEventListener('click', function () { scene.renameVariant(parseInt(b.getAttribute('data-vren'), 10)); });
    });
    box.querySelectorAll('[data-vdel]').forEach(function (b) {
      b.addEventListener('click', function () { scene.deleteVariant(parseInt(b.getAttribute('data-vdel'), 10)); });
    });
    box.querySelectorAll('[data-vact]').forEach(function (b) {
      b.addEventListener('click', function () { scene.setActiveVariant(parseInt(b.getAttribute('data-vact'), 10)); });
    });
  }
  function refreshTileHighlight(ui, scene) {
    ui.querySelectorAll('.ed-tile-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tile') === scene.brushTile);
    });
  }
  function refreshSpawnHighlight(ui, scene) {
    ui.querySelectorAll('.ed-spawn-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-spawn') === scene.brushSpawn);
    });
  }
  function refreshStatus(ui, scene) {
    var lvl = scene.lvl;
    if (!lvl) return;
    ui.querySelector('#ed-counts').textContent =
      lvl.spawns.length + ' spawns / ' + lvl.movers.length + ' movers / ' +
      lvl.width + 'x' + lvl.height + ' tiles';
    ui.querySelector('#ed-dirty').textContent = scene.dirty ? '● UNSAVED' : '';
  }
  function refreshProps(ui, scene) {
    var body = ui.querySelector('#ed-props-body');
    var sel = scene.selection;
    if (!sel) { body.innerHTML = '<p class="ed-hint">Nothing selected. Switch to SELECT tool [4] and click any spawn or mover.</p>'; return; }
    var html = '';
    if (sel.kind === 'spawn') {
      var sp = sel.ref;
      html += '<p class="ed-prop-title">SPAWN: <strong>' + sp.type + '</strong>' +
              (sp.kind ? ' <span class="ed-prop-sub">[' + sp.kind + ']</span>' :
               sp.variant ? ' <span class="ed-prop-sub">[' + sp.variant + ']</span>' : '') +
              '</p>';
      html += fieldRow('type', sp.type, { readonly: true });
      var fields = SPAWN_FIELDS[sp.type] || [{f:'tx'},{f:'ty'}];
      fields.forEach(function (fd) {
        if (fd.f === 'tx' || fd.f === 'ty') return;
        var val = sp[fd.f] !== undefined ? sp[fd.f] : '';
        html += fieldRow(fd.f, val, {
          enum: FIELD_ENUMS[sp.type + '.' + fd.f],
          optional: fd.opt
        });
      });
      html += '<div class="ed-field-pair">';
      html += fieldRow('tx', sp.tx);
      html += fieldRow('ty', sp.ty);
      html += '</div>';
      html += '<p class="ed-hint" style="margin-top:6px">Tip: with SELECT tool active, arrows nudge by 1 tile; <b>Shift+Arrow</b> nudges offsetX/offsetY by 1 pixel; drag to move.</p>';
      html += '<button id="ed-del" class="ed-danger">DELETE</button>';
    } else if (sel.kind === 'mover') {
      var m = sel.ref;
      html += '<p class="ed-prop-title">MOVER PLATFORM</p>';
      html += '<div class="ed-field-pair">';
      html += fieldRow('tx', m.tx);
      html += fieldRow('ty', m.ty);
      html += '</div>';
      html += '<div class="ed-field-pair">';
      html += fieldRow('tx1', m.tx1);
      html += fieldRow('ty1', m.ty1);
      html += '</div>';
      html += fieldRow('spd', m.spd);
      html += fieldRow('phase', m.phase);
      html += '<button id="ed-del" class="ed-danger">DELETE</button>';
    }
    body.innerHTML = html;
    body.querySelectorAll('input,select').forEach(function (inp) {
      inp.addEventListener('change', function () {
        scene.updateSelectionField(inp.getAttribute('data-field'), inp.value);
      });
    });
    var del = body.querySelector('#ed-del');
    if (del) del.addEventListener('click', function () { scene.deleteSelection(); });
  }
  function fieldRow(name, val, opts) {
    opts = opts || {};
    // Back-compat: old call sites pass a boolean for "readonly".
    if (opts === true) opts = { readonly: true };
    var v = val == null ? '' : String(val);
    if (opts.enum) {
      var options = opts.enum.map(function (o) {
        var lbl = o === '' ? '(theme default)' : o;
        return '<option value="' + escapeHtml(o) + '"' + (o === v ? ' selected' : '') + '>' + escapeHtml(lbl) + '</option>';
      }).join('');
      return '<label>' + name +
        '<select data-field="' + name + '">' + options + '</select></label>';
    }
    return '<label>' + name +
      '<input type="text" data-field="' + name + '" value="' + escapeHtml(v) + '"' +
      (opts.readonly ? ' readonly' : '') + '></label>';
  }
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toast(ui, msg) {
    var el = ui.querySelector('#ed-toast');
    if (!el) return;
    el.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.textContent = ''; }, 2400);
  }

  // -----------------------------------------------------------------
  // Editor scene
  // -----------------------------------------------------------------
  SDD.scenes.editor = {
    enter: function (d) {
      d = d || {};
      this.day = d.day || 1;
      this.stage = d.stage || 1;
      this.tool = 'tile';
      this.brushTile = 'X';
      this.brushSpawn = 'walker';
      this.brushSize = 1;
      this.selection = null;
      this.drag = null;
      this.dirty = false;
      this.history = [];
      this.future = [];
      this.fileHandles = this.fileHandles || {};   // per stage, persists across enters
      this.cam = { x: 0, y: 0 };
      // Persisted across sessions so a designer who likes a zoomed-out
      // overview keeps it on re-open.
      this.zoom = loadZoom();
      this.t = 0;
      this.hoverCol = -1; this.hoverRow = -1;
      this.loadStage();
      this.ui = buildUI(this);
      this.installCanvasHandlers();
      this.installKeyHandlers();
    },
    exit: function () {
      if (this.ui && this.ui.parentNode) this.ui.parentNode.removeChild(this.ui);
      this.removeCanvasHandlers();
      this.removeKeyHandlers();
    },
    loadStage: function () {
      var key = this.day + '-' + this.stage;
      this.lvl = SDD.levels[key];
      // Normalise tile rows to char arrays so paint can mutate cells
      // in place. Serialiser-emitted levels arrive as string rows.
      if (this.lvl && this.lvl.tiles) {
        this.lvl.tiles = this.lvl.tiles.map(function (r) {
          return typeof r === 'string' ? r.split('') : r;
        });
      }
      this.cam.x = 0; this.cam.y = 0;
      this.selection = null;
      this.history = []; this.future = [];
      this.dirty = false;
    },
    switchStage: function (day, stage) {
      if (this.dirty) {
        if (!confirm('Unsaved changes on Day ' + this.day + '-' + this.stage + '. Discard and switch?')) {
          this.ui.querySelector('#ed-stage').value = this.day + '-' + this.stage;
          return;
        }
      }
      this.day = day; this.stage = stage;
      this.loadStage();
      refreshProps(this.ui, this);
      refreshStatus(this.ui, this);
      refreshUsageBadges(this.ui, this);
      refreshVariantList(this.ui, this);
      if (this.ui._refreshStageTab) this.ui._refreshStageTab();
    },
    setTool: function (t) {
      this.tool = t;
      refreshToolHighlight(this.ui, this);
    },

    // --- canvas event handlers ---
    installCanvasHandlers: function () {
      var scene = this;
      var canvas = SDD.canvas;
      this._onDown = function (e) { scene.onPointerDown(e); };
      this._onMove = function (e) { scene.onPointerMove(e); };
      this._onUp   = function (e) { scene.onPointerUp(e); };
      this._onWheel= function (e) { scene.onWheel(e); };
      this._onCtx  = function (e) { e.preventDefault(); };
      this._onLeave= function () {
        var tip = scene.ui && scene.ui.querySelector('#ed-hover-tip');
        if (tip) tip.hidden = true;
      };
      canvas.addEventListener('pointerdown', this._onDown);
      canvas.addEventListener('pointermove', this._onMove);
      canvas.addEventListener('pointerup', this._onUp);
      canvas.addEventListener('pointercancel', this._onUp);
      canvas.addEventListener('pointerleave', this._onLeave);
      canvas.addEventListener('wheel', this._onWheel, { passive: false });
      canvas.addEventListener('contextmenu', this._onCtx);
    },
    removeCanvasHandlers: function () {
      var canvas = SDD.canvas;
      if (!canvas) return;
      canvas.removeEventListener('pointerdown', this._onDown);
      canvas.removeEventListener('pointermove', this._onMove);
      canvas.removeEventListener('pointerup', this._onUp);
      canvas.removeEventListener('pointercancel', this._onUp);
      canvas.removeEventListener('pointerleave', this._onLeave);
      canvas.removeEventListener('wheel', this._onWheel);
      canvas.removeEventListener('contextmenu', this._onCtx);
    },
    pointerToTile: function (e) {
      var canvas = SDD.canvas;
      var r = canvas.getBoundingClientRect();
      var sx = (e.clientX - r.left) / r.width * 320;       // canvas-game-pixel x
      var sy = (e.clientY - r.top) / r.height * 180;       // canvas-game-pixel y
      // With zoom, one canvas pixel covers 1/zoom world pixels, so we
      // scale the screen offset back up before adding the camera.
      var z = this.zoom || 1;
      var wx = sx / z + this.cam.x;
      var wy = sy / z + this.cam.y;
      return { col: Math.floor(wx / 16), row: Math.floor(wy / 16), wx: wx, wy: wy, sx: sx, sy: sy };
    },
    // --- zoom ---
    setZoom: function (z) {
      // 0.05 min is small enough that FIT can show even 380-tile-wide
      // Day 1-1 in a single view (320 / 6080 = 0.053).
      var minZ = 0.05, maxZ = 4;
      z = Math.max(minZ, Math.min(maxZ, z));
      // Keep the world point under the screen center stable across
      // zoom changes (avoids the level "jumping" away on each click).
      var oldZ = this.zoom || 1;
      var centerWx = this.cam.x + (320 / oldZ) / 2;
      var centerWy = this.cam.y + (180 / oldZ) / 2;
      this.zoom = z;
      this.cam.x = centerWx - (320 / z) / 2;
      this.cam.y = centerWy - (180 / z) / 2;
      this.clampCam();
      persistZoom(z);
      if (this.ui) refreshZoomLabel(this.ui, this);
    },
    zoomStep: function (dir) {
      var z = this.zoom || 1;
      // Snap to current stop, then move by ±1 in the stops array.
      var idx = ZOOM_STOPS.indexOf(nearestStop(z));
      idx = Math.max(0, Math.min(ZOOM_STOPS.length - 1, idx + dir));
      this.setZoom(ZOOM_STOPS[idx]);
    },
    // Fit-the-stage: pick the largest zoom that shows the entire level.
    zoomFit: function () {
      if (!this.lvl) return;
      var lvlPxW = this.lvl.width * 16;
      var lvlPxH = this.lvl.height * 16;
      var z = Math.min(320 / lvlPxW, 180 / lvlPxH);
      this.zoom = Math.max(0.05, z);
      this.cam.x = 0; this.cam.y = 0;
      persistZoom(this.zoom);
      if (this.ui) refreshZoomLabel(this.ui, this);
    },
    onPointerDown: function (e) {
      e.preventDefault();
      var p = this.pointerToTile(e);
      var rightClick = e.button === 2;
      this.pointerDown = { col: p.col, row: p.row, right: rightClick };
      if (this.tool === 'tile') {
        this.paintAt(p.col, p.row, rightClick ? ' ' : this.brushTile);
      } else if (this.tool === 'spawn') {
        if (rightClick) {
          var hit = this.hitTestSpawn(p.col, p.row);
          if (hit) this.removeSpawn(hit);
        } else {
          this.placeSpawn(p.col, p.row);
        }
      } else if (this.tool === 'mover') {
        var mhit = this.hitTestMover(p.col, p.row);
        if (mhit && !rightClick) {
          this.selection = { kind: 'mover', ref: mhit };
          // Drag-to-move: shift the whole mover, preserving its span.
          this.moveDrag = { ref: mhit, refKind: 'mover',
                            startCol: p.col, startRow: p.row,
                            origTx: mhit.tx, origTy: mhit.ty,
                            origTx1: mhit.tx1, origTy1: mhit.ty1,
                            before: snapshotMover(mhit) };
          refreshProps(this.ui, this);
        } else if (rightClick && mhit) {
          this.removeMover(mhit);
        } else {
          this.drag = { startCol: p.col, startRow: p.row, curCol: p.col, curRow: p.row };
        }
      } else if (this.tool === 'select') {
        var s = this.hitTestSpawn(p.col, p.row);
        var m = this.hitTestMover(p.col, p.row);
        // SELECT tool also supports drag-to-move on whatever you hit.
        if (s) {
          this.selection = { kind: 'spawn', ref: s };
          this.moveDrag = { ref: s, refKind: 'spawn',
                            startCol: p.col, startRow: p.row,
                            origTx: s.tx, origTy: s.ty,
                            before: snapshotSpawn(s) };
        } else if (m) {
          this.selection = { kind: 'mover', ref: m };
          this.moveDrag = { ref: m, refKind: 'mover',
                            startCol: p.col, startRow: p.row,
                            origTx: m.tx, origTy: m.ty,
                            origTx1: m.tx1, origTy1: m.ty1,
                            before: snapshotMover(m) };
        } else {
          this.selection = null;
          this.moveDrag = null;
        }
        refreshProps(this.ui, this);
      }
    },
    onPointerMove: function (e) {
      var p = this.pointerToTile(e);
      this.hoverCol = p.col; this.hoverRow = p.row;
      this.ui.querySelector('#ed-coords').textContent = p.col + ', ' + p.row;
      this.updateHoverTip(e, p);
      if (!this.pointerDown) return;
      if (this.tool === 'tile') {
        this.paintAt(p.col, p.row, this.pointerDown.right ? ' ' : this.brushTile);
      } else if (this.tool === 'mover' && this.drag) {
        this.drag.curCol = p.col; this.drag.curRow = p.row;
      } else if (this.moveDrag) {
        // Drag-to-move: shift the spawn (or whole mover) by tile delta.
        var d = this.moveDrag;
        var dx = p.col - d.startCol, dy = p.row - d.startRow;
        if (d.refKind === 'spawn') {
          d.ref.tx = d.origTx + dx;
          d.ref.ty = d.origTy + dy;
        } else if (d.refKind === 'mover') {
          d.ref.tx  = d.origTx + dx;
          d.ref.ty  = d.origTy + dy;
          d.ref.tx1 = d.origTx1 + dx;
          d.ref.ty1 = d.origTy1 + dy;
        }
        // No history push until pointer-up so a long drag is one undo.
        this.markDirty();
        refreshProps(this.ui, this);
      }
    },
    onPointerUp: function (e) {
      if (this.tool === 'mover' && this.drag) {
        var d = this.drag;
        if (d.startCol !== d.curCol || d.startRow !== d.curRow) {
          this.addMover(d.startCol, d.startRow, d.curCol, d.curRow);
        }
        this.drag = null;
      }
      if (this.moveDrag) {
        // Commit drag as a single history op if the position actually changed.
        var md = this.moveDrag;
        var after = md.refKind === 'spawn' ? snapshotSpawn(md.ref) : snapshotMover(md.ref);
        var changed = JSON.stringify(after) !== JSON.stringify(md.before);
        if (changed) {
          this.pushHistory({ kind: 'move-snapshot', ref: md.ref,
                             before: md.before, after: after });
        }
        this.moveDrag = null;
      }
      this.pointerDown = null;
    },
    // Renders a small floating tooltip next to the mouse showing what's
    // under the cursor: spawn type + kind/variant, mover endpoints, or
    // tile code label.
    updateHoverTip: function (e, p) {
      var tip = this.ui.querySelector('#ed-hover-tip');
      if (!tip || !this.lvl) return;
      var lvl = this.lvl;
      var sp = this.hitTestSpawn(p.col, p.row);
      var mv = sp ? null : this.hitTestMover(p.col, p.row);
      var lines = [];
      if (sp) {
        lines.push('SPAWN: ' + sp.type);
        if (sp.kind)     lines.push('  kind: ' + sp.kind);
        if (sp.variant)  lines.push('  variant: ' + sp.variant);
        if (sp.shoots)   lines.push('  shoots: true');
        if (sp.period)   lines.push('  period: ' + sp.period);
        if (sp.offsetX || sp.offsetY) lines.push('  offset: ' + (sp.offsetX||0) + ',' + (sp.offsetY||0));
        lines.push('  at: ' + sp.tx + ',' + sp.ty);
      } else if (mv) {
        lines.push('MOVER PLATFORM');
        lines.push('  from: ' + mv.tx + ',' + mv.ty);
        lines.push('  to: ' + mv.tx1 + ',' + mv.ty1);
        lines.push('  spd: ' + mv.spd);
      } else if (p.col >= 0 && p.col < lvl.width && p.row >= 0 && p.row < lvl.height) {
        var ch = lvl.tiles[p.row][p.col];
        var tdef = TILE_DEFS.filter(function (t) { return t.c === ch; })[0];
        var label = tdef ? (tdef.label.toUpperCase() + ' (' + (ch === ' ' ? 'space' : ch) + ')') :
                    (ch === ' ' ? 'EMPTY' : 'tile ' + ch);
        lines.push(label);
        if (tdef) lines.push('  ' + tdef.desc);
      }
      if (!lines.length) { tip.hidden = true; return; }
      tip.innerHTML = lines.map(function (l) { return '<div>' + escapeHtml(l) + '</div>'; }).join('');
      tip.style.left = (e.clientX + 14) + 'px';
      tip.style.top  = (e.clientY + 14) + 'px';
      tip.hidden = false;
    },
    onWheel: function (e) {
      e.preventDefault();
      // Ctrl+wheel = zoom (one step per notch). Otherwise horizontal
      // pan with the wheel; shift+wheel = vertical pan.
      if (e.ctrlKey || e.metaKey) {
        this.zoomStep(e.deltaY < 0 ? +1 : -1);
        return;
      }
      var dx = e.deltaY;
      if (e.shiftKey) {
        this.cam.y = this.cam.y + dx * 0.5;
      } else {
        this.cam.x = this.cam.x + dx * 0.5;
      }
      this.clampCam();
    },

    installKeyHandlers: function () {
      var scene = this;
      this._onKey = function (e) { scene.onKey(e); };
      window.addEventListener('keydown', this._onKey);
    },
    removeKeyHandlers: function () {
      if (this._onKey) window.removeEventListener('keydown', this._onKey);
    },
    onKey: function (e) {
      // If a form control is focused, ignore game shortcuts
      var t = e.target;
      var inForm = t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA');
      if (inForm) return;
      var k = e.key;
      if (k === 'Escape') { e.preventDefault(); this.exitToMenu(); return; }
      if (k === '1') { e.preventDefault(); this.setTool('tile'); return; }
      if (k === '2') { e.preventDefault(); this.setTool('spawn'); return; }
      if (k === '3') { e.preventDefault(); this.setTool('mover'); return; }
      if (k === '4') { e.preventDefault(); this.setTool('select'); return; }
      if (k === 't' || k === 'T') { e.preventDefault(); this.test(); return; }
      if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'S')) { e.preventDefault(); this.save(false); return; }
      if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z') && !e.shiftKey) { e.preventDefault(); this.undo(); return; }
      if (((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'Y')) ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'Z' || k === 'z'))) {
        e.preventDefault(); this.redo(); return;
      }
      if (k === 'Delete' || k === 'Backspace') {
        if (this.selection) { e.preventDefault(); this.deleteSelection(); return; }
      }
      // Arrow keys: if SELECT tool with a selection -> nudge the
      // selection (1 tile, Shift = 1 pixel via offsetX/offsetY).
      // Otherwise -> pan the camera.
      var isArrow = (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown');
      if (isArrow && this.tool === 'select' && this.selection) {
        e.preventDefault();
        this.nudgeSelection(k, e.shiftKey);
        return;
      }
      if (isArrow) {
        // Scale pan step with the viewport so it feels right at any
        // zoom level (always ~10% of the visible width).
        var panStep = Math.max(16, Math.round(32 / (this.zoom || 1)));
        if (k === 'ArrowLeft')  { this.cam.x -= panStep; this.clampCam(); }
        if (k === 'ArrowRight') { this.cam.x += panStep; this.clampCam(); }
        if (k === 'ArrowUp')    { this.cam.y -= panStep; this.clampCam(); }
        if (k === 'ArrowDown')  { this.cam.y += panStep; this.clampCam(); }
      }
    },
    // Nudge the selected spawn / mover. Plain arrow = 1 tile,
    // Shift+arrow = 1 pixel via offsetX/offsetY (spawn only).
    nudgeSelection: function (key, shift) {
      var sel = this.selection;
      if (!sel) return;
      var dx = 0, dy = 0;
      if (key === 'ArrowLeft')  dx = -1;
      if (key === 'ArrowRight') dx =  1;
      if (key === 'ArrowUp')    dy = -1;
      if (key === 'ArrowDown')  dy =  1;
      var ref = sel.ref;
      var before, after;
      if (shift && sel.kind === 'spawn') {
        before = snapshotSpawn(ref);
        ref.offsetX = (ref.offsetX || 0) + dx;
        ref.offsetY = (ref.offsetY || 0) + dy;
        after = snapshotSpawn(ref);
      } else if (sel.kind === 'spawn') {
        before = snapshotSpawn(ref);
        ref.tx = ref.tx + dx; ref.ty = ref.ty + dy;
        after = snapshotSpawn(ref);
      } else if (sel.kind === 'mover') {
        before = snapshotMover(ref);
        ref.tx = ref.tx + dx; ref.ty = ref.ty + dy;
        ref.tx1 = ref.tx1 + dx; ref.ty1 = ref.ty1 + dy;
        after = snapshotMover(ref);
      }
      this.pushHistory({ kind: 'move-snapshot', ref: ref, before: before, after: after });
      refreshProps(this.ui, this);
    },
    clampCam: function () {
      // Pass 12 (Mark): "I can't put blocks on those corners because
      // there's an overlay on top of them." Allow the camera to
      // overscroll past the stage by half a viewport on each side,
      // so the stage's top / left / right / bottom edge can land in
      // the middle of the screen - well clear of the UI panels.
      var z = this.zoom || 1;
      var visW = 320 / z, visH = 180 / z;
      var minX = -visW / 2;
      var minY = -visH / 2;
      var maxX = Math.max(0, this.lvl.width * 16 - visW) + visW / 2;
      var maxY = Math.max(0, this.lvl.height * 16 - visH) + visH / 2;
      if (this.cam.x < minX) this.cam.x = minX;
      if (this.cam.y < minY) this.cam.y = minY;
      if (this.cam.x > maxX) this.cam.x = maxX;
      if (this.cam.y > maxY) this.cam.y = maxY;
    },

    // --- editing primitives ---
    pushHistory: function (op) {
      this.history.push(op);
      if (this.history.length > 200) this.history.shift();
      this.future.length = 0;
      this.markDirty();
    },
    markDirty: function () {
      this.dirty = true;
      refreshStatus(this.ui, this);
      refreshUsageBadges(this.ui, this);
    },
    paintAt: function (col, row, code) {
      var lvl = this.lvl;
      var bs = this.brushSize;
      var half = (bs - 1) / 2;
      var changed = [];
      for (var dr = -half; dr <= half; dr++) {
        for (var dc = -half; dc <= half; dc++) {
          var c = col + dc, r = row + dr;
          if (c < 0 || c >= lvl.width || r < 0 || r >= lvl.height) continue;
          var before = lvl.tiles[r][c];
          if (before === code) continue;
          lvl.tiles[r][c] = code;
          changed.push({ c: c, r: r, before: before });
        }
      }
      if (changed.length) {
        this.pushHistory({ kind: 'tile', cells: changed, after: code });
      }
    },
    placeSpawn: function (col, row) {
      var sp = { type: this.brushSpawn, tx: col, ty: row };
      var defs = spawnDefaults(this.brushSpawn);
      for (var k in defs) if (defs.hasOwnProperty(k)) sp[k] = defs[k];
      this.lvl.spawns.push(sp);
      this.pushHistory({ kind: 'spawn-add', ref: sp });
      this.selection = { kind: 'spawn', ref: sp };
      refreshProps(this.ui, this);
      refreshStatus(this.ui, this);
    },
    removeSpawn: function (sp) {
      var idx = this.lvl.spawns.indexOf(sp);
      if (idx < 0) return;
      this.lvl.spawns.splice(idx, 1);
      this.pushHistory({ kind: 'spawn-remove', ref: sp, idx: idx });
      if (this.selection && this.selection.ref === sp) this.selection = null;
      refreshProps(this.ui, this);
      refreshStatus(this.ui, this);
    },
    addMover: function (sc, sr, ec, er) {
      var m = { tx: sc, ty: sr, tx1: ec, ty1: er, spd: 0.018, phase: 0 };
      this.lvl.movers.push(m);
      this.pushHistory({ kind: 'mover-add', ref: m });
      this.selection = { kind: 'mover', ref: m };
      refreshProps(this.ui, this);
      refreshStatus(this.ui, this);
    },
    removeMover: function (m) {
      var idx = this.lvl.movers.indexOf(m);
      if (idx < 0) return;
      this.lvl.movers.splice(idx, 1);
      this.pushHistory({ kind: 'mover-remove', ref: m, idx: idx });
      if (this.selection && this.selection.ref === m) this.selection = null;
      refreshProps(this.ui, this);
      refreshStatus(this.ui, this);
    },
    deleteSelection: function () {
      var sel = this.selection;
      if (!sel) return;
      if (sel.kind === 'spawn') this.removeSpawn(sel.ref);
      else if (sel.kind === 'mover') this.removeMover(sel.ref);
    },
    updateSelectionField: function (field, raw) {
      var sel = this.selection;
      if (!sel) return;
      var ref = sel.ref;
      var before = ref[field];
      // Number-ish fields: parse to number
      var numeric = ['tx', 'ty', 'tx1', 'ty1', 'spd', 'phase', 'period', 'maxH', 'dir', 'offsetX', 'offsetY', 'scale'];
      var val;
      if (numeric.indexOf(field) >= 0) {
        val = parseFloat(raw);
        if (isNaN(val)) val = before;
      } else if (raw === 'true' || raw === 'false') {
        val = (raw === 'true');
      } else if (raw === '') {
        delete ref[field];
        this.pushHistory({ kind: 'field-set', ref: ref, field: field, before: before, after: undefined });
        return;
      } else {
        val = raw;
      }
      if (val === before) return;
      ref[field] = val;
      this.pushHistory({ kind: 'field-set', ref: ref, field: field, before: before, after: val });
    },
    undo: function () {
      var op = this.history.pop();
      if (!op) return;
      this.applyOpInverse(op);
      this.future.push(op);
      refreshProps(this.ui, this);
      refreshStatus(this.ui, this);
    },
    redo: function () {
      var op = this.future.pop();
      if (!op) return;
      this.applyOp(op);
      this.history.push(op);
      refreshProps(this.ui, this);
      refreshStatus(this.ui, this);
    },
    applyOp: function (op) {
      var lvl = this.lvl;
      if (op.kind === 'tile') op.cells.forEach(function (c) { lvl.tiles[c.r][c.c] = op.after; });
      else if (op.kind === 'spawn-add') lvl.spawns.push(op.ref);
      else if (op.kind === 'spawn-remove') {
        var i = lvl.spawns.indexOf(op.ref);
        if (i >= 0) lvl.spawns.splice(i, 1);
      }
      else if (op.kind === 'mover-add') lvl.movers.push(op.ref);
      else if (op.kind === 'mover-remove') {
        var im = lvl.movers.indexOf(op.ref);
        if (im >= 0) lvl.movers.splice(im, 1);
      }
      else if (op.kind === 'field-set') {
        if (op.after === undefined) delete op.ref[op.field];
        else op.ref[op.field] = op.after;
      }
      else if (op.kind === 'move-snapshot') restoreSnapshot(op.ref, op.after);
      this.dirty = true;
    },
    applyOpInverse: function (op) {
      var lvl = this.lvl;
      if (op.kind === 'tile') op.cells.forEach(function (c) { lvl.tiles[c.r][c.c] = c.before; });
      else if (op.kind === 'spawn-add') {
        var i = lvl.spawns.indexOf(op.ref);
        if (i >= 0) lvl.spawns.splice(i, 1);
      }
      else if (op.kind === 'spawn-remove') lvl.spawns.splice(op.idx, 0, op.ref);
      else if (op.kind === 'mover-add') {
        var im = lvl.movers.indexOf(op.ref);
        if (im >= 0) lvl.movers.splice(im, 1);
      }
      else if (op.kind === 'mover-remove') lvl.movers.splice(op.idx, 0, op.ref);
      else if (op.kind === 'field-set') {
        if (op.before === undefined) delete op.ref[op.field];
        else op.ref[op.field] = op.before;
      }
      else if (op.kind === 'move-snapshot') restoreSnapshot(op.ref, op.before);
      this.dirty = true;
    },

    // --- hit-testing for spawn / mover selection ---
    hitTestSpawn: function (col, row) {
      // Reverse order so the last-drawn (top-most) wins
      var arr = this.lvl.spawns;
      for (var i = arr.length - 1; i >= 0; i--) {
        if (arr[i].tx === col && arr[i].ty === row) return arr[i];
      }
      return null;
    },
    hitTestMover: function (col, row) {
      var arr = this.lvl.movers;
      for (var i = arr.length - 1; i >= 0; i--) {
        var m = arr[i];
        if ((m.tx === col && m.ty === row) || (m.tx1 === col && m.ty1 === row)) return m;
      }
      return null;
    },

    // --- save (FSAPI primary, download fallback) ---
    save: function (forcePick) {
      var key = this.day + '-' + this.stage;
      var src = serializeLevel(key, this.lvl);
      var fname = (this.day === 1 && this.stage === 1) ? 'level1.js' : ('level_' + this.day + '_' + this.stage + '.js');
      var scene = this;
      var handle = forcePick ? null : this.fileHandles[key];
      var supportsFSAPI = typeof window.showSaveFilePicker === 'function';
      if (!handle && supportsFSAPI) {
        try {
          window.showSaveFilePicker({
            suggestedName: fname,
            types: [{ description: 'JavaScript', accept: { 'text/javascript': ['.js'] } }]
          }).then(function (h) {
            scene.fileHandles[key] = h;
            writeHandle(h, src).then(function () {
              scene.dirty = false; refreshStatus(scene.ui, scene); toast(scene.ui, 'Saved ' + fname);
            }).catch(function (err) { console.warn('Editor save failed:', err); toast(scene.ui, 'Save failed: ' + err.message); });
          }).catch(function () {
            // user cancelled - fall back to download
            downloadAs(fname, src);
            scene.dirty = false; refreshStatus(scene.ui, scene); toast(scene.ui, 'Downloaded ' + fname);
          });
        } catch (e) {
          downloadAs(fname, src);
          scene.dirty = false; refreshStatus(scene.ui, scene); toast(scene.ui, 'Downloaded ' + fname);
        }
      } else if (handle) {
        writeHandle(handle, src).then(function () {
          scene.dirty = false; refreshStatus(scene.ui, scene); toast(scene.ui, 'Saved ' + fname);
        }).catch(function (err) {
          console.warn('Editor save failed:', err); toast(scene.ui, 'Save failed: ' + err.message);
        });
      } else {
        // No FSAPI: just download
        downloadAs(fname, src);
        scene.dirty = false; refreshStatus(scene.ui, scene); toast(scene.ui, 'Downloaded ' + fname);
      }
    },

    test: function () {
      // The in-memory level data already reflects edits, so the
      // level scene picks them up. Coming back to the editor is a
      // fresh enter() that re-loads SDD.levels[key], which is also
      // the in-memory edited copy - edits survive the round trip.
      SDD.setScene('level', { day: this.day, stage: this.stage });
    },

    exitToMenu: function () {
      if (this.dirty) {
        if (!confirm('Unsaved changes. Exit anyway?')) return;
      }
      SDD.setScene('menu');
    },

    // --- variant library (localStorage-backed) ---
    saveVariant: function () {
      var key = this.day + '-' + this.stage;
      var defaultName = 'Variant ' + (SDD.editorLib.get(key).variants.length + 1);
      var name = prompt('Variant name:', defaultName);
      if (!name) return;
      SDD.editorLib.save(key, name, this.lvl);
      this.dirty = false;
      refreshStatus(this.ui, this);
      refreshVariantList(this.ui, this);
      toast(this.ui, 'Saved variant "' + name + '"');
    },
    loadVariant: function (idx) {
      var key = this.day + '-' + this.stage;
      var v = SDD.editorLib.get(key).variants[idx];
      if (!v) return;
      if (this.dirty && !confirm('Discard current edits and load "' + v.name + '"?')) return;
      // Deep-copy the variant data into the live SDD.levels[key] so
      // editor + game both see the loaded copy.
      var clone = JSON.parse(JSON.stringify(v.data));
      SDD.levels[key] = clone;
      this.lvl = clone;
      this.history = []; this.future = [];
      this.dirty = false;
      this.selection = null;
      refreshProps(this.ui, this);
      refreshStatus(this.ui, this);
      refreshUsageBadges(this.ui, this);
      toast(this.ui, 'Loaded "' + v.name + '"');
    },
    renameVariant: function (idx) {
      var key = this.day + '-' + this.stage;
      var v = SDD.editorLib.get(key).variants[idx];
      if (!v) return;
      var name = prompt('Rename variant:', v.name);
      if (!name) return;
      SDD.editorLib.rename(key, idx, name);
      refreshVariantList(this.ui, this);
    },
    deleteVariant: function (idx) {
      var key = this.day + '-' + this.stage;
      var v = SDD.editorLib.get(key).variants[idx];
      if (!v) return;
      if (!confirm('Delete variant "' + v.name + '"? This cannot be undone.')) return;
      SDD.editorLib.del(key, idx);
      refreshVariantList(this.ui, this);
      toast(this.ui, 'Deleted "' + v.name + '"');
    },
    setActiveVariant: function (idx) {
      var key = this.day + '-' + this.stage;
      SDD.editorLib.setActive(key, idx);
      refreshVariantList(this.ui, this);
      if (idx === -1) toast(this.ui, 'Main: on-disk file');
      else {
        var v = SDD.editorLib.get(key).variants[idx];
        toast(this.ui, 'Main: "' + (v ? v.name : '?') + '"');
      }
    },
    // Dump every stage whose active variant is a saved one (not the
    // on-disk file) as a single JSON blob and copy to the clipboard.
    // Paste it into chat and Claude can write each stage as the
    // official level_X_Y.js. Skips stages still pointing at the disk.
    copyMainsToClipboard: function () {
      var out = {};
      var count = 0;
      var lib;
      try { lib = JSON.parse(localStorage.getItem('sdd.editorLibrary.v1') || '{}'); }
      catch (e) { toast(this.ui, 'Could not read library: ' + e.message); return; }
      for (var key in lib) {
        if (!lib.hasOwnProperty(key)) continue;
        var entry = lib[key];
        if (entry.active == null || entry.active < 0) continue;
        var v = entry.variants[entry.active];
        if (!v) continue;
        out[key] = { name: v.name, savedAt: v.savedAt, data: v.data };
        count++;
      }
      if (count === 0) {
        toast(this.ui, 'No MAIN variants to copy. Mark stages MAIN first.');
        return;
      }
      var blob = JSON.stringify({ kind: 'sdd.mains.v1', stages: out }, null, 2);
      var scene = this;
      var done = function () { toast(scene.ui, 'Copied ' + count + ' MAIN stage(s) - paste to Claude.'); };
      var fail = function () {
        // Clipboard API may be blocked; fall back to a textarea download
        var name = 'sdd-mains.json';
        var b = new Blob([blob], { type: 'application/json' });
        var url = URL.createObjectURL(b);
        var a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        toast(scene.ui, 'Downloaded ' + name + ' (' + count + ' stage(s))');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(blob).then(done).catch(fail);
      } else { fail(); }
    },

    // --- per-frame ---
    update: function () {
      this.t++;
    },
    render: function (g) {
      // Flat backdrop so the grid stays readable - drawn pre-zoom
      // so the unused area (when zoomed-out level doesn't fill the
      // canvas) reads as the editor backdrop, not garbage.
      g.fillStyle = '#0e0e1a';
      g.fillRect(0, 0, 320, 180);
      var lvl = this.lvl;
      if (!lvl) return;
      var T = 16;
      // Zoom transform: every subsequent draw is scaled around (0,0).
      // World coords stay in pixels; ctx.scale handles the rest.
      var z = this.zoom || 1;
      g.save();
      if (z !== 1) g.scale(z, z);
      var camx = Math.round(this.cam.x), camy = Math.round(this.cam.y);
      // Visible world extent grows when zoomed out (320/z by 180/z).
      var visW = 320 / z, visH = 180 / z;
      var t0x = Math.max(0, Math.floor(camx / T));
      var t1x = Math.min(lvl.width - 1, Math.ceil((camx + visW) / T));
      var t0y = Math.max(0, Math.floor(camy / T));
      var t1y = Math.min(lvl.height - 1, Math.ceil((camy + visH) / T));

      // Tiles via the existing sprite set (themed where available).
      var S = SDD.sprites, theme = lvl.theme;
      for (var ty = t0y; ty <= t1y; ty++) {
        for (var tx = t0x; tx <= t1x; tx++) {
          var code = lvl.tiles[ty][tx], name = null;
          if (code === 'X') {
            var above = ty > 0 ? lvl.tiles[ty - 1][tx] : ' ';
            var baseDirt = (above === 'X' || above === '#');
            name = baseDirt ? 'tile_dirt' : 'tile_ground';
            if (theme && S.get(name + '_' + theme)) name = name + '_' + theme;
          } else if (code === '#') {
            name = (theme && S.get('tile_brick_' + theme)) ? 'tile_brick_' + theme : 'tile_brick';
          } else if (code === '=') {
            name = (theme && S.get('tile_platform_' + theme)) ? 'tile_platform_' + theme : 'tile_platform';
          } else if (code === 'V') name = 'tile_vine';
          else if (code === 'W') name = 'tile_water';
          else if (code === '~') name = 'tile_water_top';
          else if (code === 'L') {
            var aboveL = ty > 0 ? lvl.tiles[ty - 1][tx] : ' ';
            if (aboveL === 'L' || aboveL === 'X' || aboveL === '#') {
              name = 'tile_lava_base';
            } else {
              name = 'tile_lava_top_' + (Math.floor(this.t / 7) % 4);
            }
          }
          else if (code === '?') name = 'tile_qcore';
          else if (code === 'G') name = 'tile_qgrow';
          else if (code === 'B') name = 'tile_qblast';
          else if (code === 'U') name = 'tile_qused';
          if (name) {
            var s = S.get(name);
            if (s) g.drawImage(s, tx * T - camx, ty * T - camy);
          }
        }
      }

      // Light grid overlay
      g.strokeStyle = 'rgba(255,255,255,0.05)';
      g.lineWidth = 1;
      g.beginPath();
      for (var gx = t0x; gx <= t1x + 1; gx++) {
        var px = Math.round(gx * T - camx) + 0.5;
        g.moveTo(px, 0); g.lineTo(px, visH);
      }
      for (var gy = t0y; gy <= t1y + 1; gy++) {
        var py = Math.round(gy * T - camy) + 0.5;
        g.moveTo(0, py); g.lineTo(visW, py);
      }
      g.stroke();

      // Spawns - colored dot + readable label tag with type + variant.
      var typeColors = {
        player: '#ffd23a', walker: '#ff8a6a', thrower: '#c050a0',
        wisp: '#a8c8ff', crab: '#ff7050', core: '#46f0ff',
        timepart: '#fff', npc: '#9bf0a0', checkpoint: '#ffe070',
        signature: '#ffe890', skyhazard: '#ff5418', bubble: '#a8e6ff',
        octopus: '#d068a0', twister: '#dfe6ff', eel: '#7adfff'
      };
      // Short labels so the on-canvas tag doesn't overflow.
      var typeShort = {
        player: 'PLR', walker: 'walk', thrower: 'throw', wisp: 'wisp',
        crab: 'crab', core: 'CORE', timepart: 'PART', npc: 'NPC',
        checkpoint: 'CHK', signature: 'SIG', skyhazard: 'HZRD',
        bubble: 'bubl', octopus: 'oct', twister: 'twst', eel: 'eel'
      };
      var spawns = lvl.spawns;
      for (var i = 0; i < spawns.length; i++) {
        var sp = spawns[i];
        // Apply offsetX/offsetY in editor view so on-screen position
        // matches what the game will show after pixel-nudging.
        var sxp = sp.tx * T - camx + 8 + (sp.offsetX || 0);
        var syp = sp.ty * T - camy + 8 + (sp.offsetY || 0);
        if (sxp < -16 || sxp > visW + 16 || syp < -16 || syp > visH + 16) continue;
        var col = typeColors[sp.type] || '#fff';
        // Anchor dot
        g.fillStyle = col;
        g.fillRect(sxp - 3, syp - 3, 6, 6);
        g.fillStyle = '#000';
        g.fillRect(sxp - 2, syp - 2, 4, 4);
        g.fillStyle = col;
        g.fillRect(sxp - 1, syp - 1, 2, 2);
        // Type + (kind/variant if any) tag, sits above the anchor.
        var tag = typeShort[sp.type] || sp.type;
        var sub = sp.kind || sp.variant || '';
        if (sp.shoots) sub = 'shoots';
        var label = sub ? (tag + ':' + sub.substring(0, 6)) : tag;
        if (S && S.textShadow) {
          S.textShadow(g, label, sxp, syp - 9, col, '#000', 1, 'center');
        } else if (S && S.text) {
          S.text(g, label, sxp, syp - 9, col, 1, 'center');
        }
      }

      // Movers - lines from start to end
      var movers = lvl.movers;
      g.strokeStyle = '#ffd23a';
      g.lineWidth = 1;
      for (var mi = 0; mi < movers.length; mi++) {
        var m = movers[mi];
        var ax = m.tx * T - camx + 8, ay = m.ty * T - camy + 8;
        var bx = m.tx1 * T - camx + 8, by = m.ty1 * T - camy + 8;
        g.beginPath();
        g.moveTo(ax + 0.5, ay + 0.5);
        g.lineTo(bx + 0.5, by + 0.5);
        g.stroke();
        // Endpoint dots
        g.fillStyle = '#ffd23a';
        g.fillRect(ax - 1, ay - 1, 3, 3);
        g.fillStyle = '#a8631a';
        g.fillRect(bx - 1, by - 1, 3, 3);
      }

      // Mover drag preview
      if (this.tool === 'mover' && this.drag) {
        var d = this.drag;
        var dx = d.startCol * T - camx + 8, dy = d.startRow * T - camy + 8;
        var ex = d.curCol * T - camx + 8, ey = d.curRow * T - camy + 8;
        g.strokeStyle = '#46f0ff';
        g.beginPath();
        g.moveTo(dx + 0.5, dy + 0.5);
        g.lineTo(ex + 0.5, ey + 0.5);
        g.stroke();
      }

      // Selection highlight
      if (this.selection) {
        var sel = this.selection;
        g.strokeStyle = '#46f0ff';
        g.lineWidth = 1;
        if (sel.kind === 'spawn') {
          var sp2 = sel.ref;
          g.strokeRect(sp2.tx * T - camx + 0.5, sp2.ty * T - camy + 0.5, T - 1, T - 1);
        } else if (sel.kind === 'mover') {
          var m2 = sel.ref;
          g.strokeRect(m2.tx * T - camx + 0.5, m2.ty * T - camy + 0.5, T - 1, T - 1);
          g.strokeRect(m2.tx1 * T - camx + 0.5, m2.ty1 * T - camy + 0.5, T - 1, T - 1);
        }
      }

      // Hover ghost
      if (this.hoverCol >= 0) {
        g.strokeStyle = 'rgba(255,255,255,0.35)';
        g.strokeRect(this.hoverCol * T - camx + 0.5, this.hoverRow * T - camy + 0.5, T - 1, T - 1);
      }
      g.restore();
    }
  };

  // -----------------------------------------------------------------
  // Save helpers
  // -----------------------------------------------------------------
  function downloadAs(name, contents) {
    var blob = new Blob([contents], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function writeHandle(handle, contents) {
    return handle.createWritable().then(function (w) {
      return w.write(contents).then(function () { return w.close(); });
    });
  }

  // -----------------------------------------------------------------
  // Serializer - emits a self-contained level_X_Y.js that assigns
  // SDD.levels[key] directly (no helper-function reconstruction).
  // -----------------------------------------------------------------
  function serializeLevel(key, lvl) {
    var lines = [];
    lines.push('// Auto-generated by editor.js - safe to overwrite by saving from the editor.');
    lines.push('window.SDD = window.SDD || {};');
    lines.push('SDD.levels = SDD.levels || {};');
    lines.push("SDD.levels['" + key + "'] = {");
    lines.push('  width: ' + lvl.width + ', height: ' + lvl.height + ', ground: ' + lvl.ground + ',');
    lines.push('  tiles: [');
    for (var r = 0; r < lvl.height; r++) {
      var row = lvl.tiles[r].join('');
      lines.push("    " + JSON.stringify(row) + (r === lvl.height - 1 ? '' : ','));
    }
    lines.push('  ],');
    lines.push('  spawns: [');
    lvl.spawns.forEach(function (sp, i) {
      lines.push('    ' + jsObj(sp) + (i === lvl.spawns.length - 1 ? '' : ','));
    });
    lines.push('  ],');
    lines.push('  movers: [');
    lvl.movers.forEach(function (m, i) {
      lines.push('    ' + jsObj(m) + (i === lvl.movers.length - 1 ? '' : ','));
    });
    lines.push('  ],');
    // Metadata + optional fields preserved
    var meta = ['name', 'theme', 'gravityScale', 'jumpScale', 'skyTheme',
                'topDeath', 'underwater', 'flappy', 'flappySpeed',
                'flappyFlap', 'flappyGravity', 'flappyMaxFall',
                'flappySmallHitbox', 'flappyBigHitbox', 'themeZones'];
    meta.forEach(function (k) {
      if (lvl[k] !== undefined) {
        lines.push('  ' + k + ': ' + JSON.stringify(lvl[k]) + ',');
      }
    });
    // Trim trailing comma after the last property to keep strict parsers happy
    var last = lines[lines.length - 1];
    if (last && last.charAt(last.length - 1) === ',') {
      lines[lines.length - 1] = last.slice(0, -1);
    }
    lines.push('};');
    lines.push('');
    // Day 1's original file also assigned SDD.level1 - preserve that
    // alias so any legacy reference keeps working.
    if (key === '1-1') {
      lines.push("SDD.level1 = SDD.levels['1-1'];");
    }
    return lines.join('\n');
  }

  // Stable JSON output that keeps key order matching the source style
  // and uses single-quoted strings where natural.
  function jsObj(o) {
    var parts = [];
    for (var k in o) {
      if (!o.hasOwnProperty(k)) continue;
      var v = o[k];
      parts.push(k + ': ' + JSON.stringify(v));
    }
    return '{ ' + parts.join(', ') + ' }';
  }

  // Expose for tests / external use
  SDD.editor = { serializeLevel: serializeLevel };

  // -----------------------------------------------------------------
  // Variant library - localStorage-backed per-stage saved files.
  //
  // Each stage gets:
  //   { active: number | -1, variants: [{ name, savedAt, data }, ...] }
  //   active = -1  -> game uses the on-disk SDD.levels[key]
  //   active >= 0  -> game uses variants[active].data, applied at boot
  //
  // applyMainVariants() is called from main.js after the level
  // scripts have populated SDD.levels but before any scene reads it.
  // -----------------------------------------------------------------
  var LIB_KEY = 'sdd.editorLibrary.v1';
  function load() {
    try { return JSON.parse(localStorage.getItem(LIB_KEY) || '{}') || {}; }
    catch (e) { console.warn('editorLib parse fail:', e); return {}; }
  }
  function persist(lib) {
    try { localStorage.setItem(LIB_KEY, JSON.stringify(lib)); }
    catch (e) { console.warn('editorLib persist fail:', e); }
  }
  function entryOf(lib, key) {
    if (!lib[key]) lib[key] = { active: -1, variants: [] };
    return lib[key];
  }
  SDD.editorLib = {
    get: function (key) { var lib = load(); return entryOf(lib, key); },
    save: function (key, name, data) {
      var lib = load();
      var e = entryOf(lib, key);
      e.variants.push({ name: name, savedAt: Date.now(), data: JSON.parse(JSON.stringify(data)) });
      persist(lib);
    },
    rename: function (key, idx, name) {
      var lib = load();
      var e = entryOf(lib, key);
      if (e.variants[idx]) { e.variants[idx].name = name; persist(lib); }
    },
    del: function (key, idx) {
      var lib = load();
      var e = entryOf(lib, key);
      if (idx < 0 || idx >= e.variants.length) return;
      e.variants.splice(idx, 1);
      if (e.active === idx) e.active = -1;
      else if (e.active > idx) e.active = e.active - 1;
      persist(lib);
    },
    setActive: function (key, idx) {
      var lib = load();
      var e = entryOf(lib, key);
      e.active = idx;
      persist(lib);
    },
    // Boot hook: replace SDD.levels[key] with the active variant data
    // for any stage that has one. Run after level files load.
    applyMainVariants: function (levels) {
      var lib = load();
      for (var key in lib) {
        if (!lib.hasOwnProperty(key)) continue;
        var e = lib[key];
        if (e.active < 0 || !e.variants[e.active]) continue;
        levels[key] = JSON.parse(JSON.stringify(e.variants[e.active].data));
      }
    }
  };
})();
