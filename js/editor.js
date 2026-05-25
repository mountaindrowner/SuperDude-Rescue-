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
    '6-1': 'Plains to Forest', '6-2': 'Eden Trail',
    '7-1': 'Sabbath Finale'
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
    { c: ' ', label: 'erase',  desc: 'Empty space - paints over any tile.' },
    { c: 'X', label: 'ground', desc: 'Solid ground / dirt. Theme-aware visuals.' },
    { c: '#', label: 'brick',  desc: 'Solid brick. Theme-aware.' },
    { c: '=', label: 'oneway', desc: 'One-way platform - jump up through, land on top.' },
    { c: 'V', label: 'vine',   desc: 'Climbable vine. Player grabs to climb up/down.' },
    { c: 'W', label: 'water',  desc: 'Submerged water - slow swim physics.' },
    { c: '~', label: 'w.surf', desc: 'Water surface tile (top row of water).' },
    { c: 'L', label: 'lava',   desc: 'Damaging lava. Touch = lose a life.' },
    { c: '?', label: 'q-core', desc: 'Mystery brick - hit from below to release a power core.' },
    { c: 'G', label: 'q-grow', desc: 'Mystery brick - hit from below for a Grow powerup.' },
    { c: 'B', label: 'q-blast',desc: 'Mystery brick - hit from below for a Blast powerup.' },
    { c: 'U', label: 'q-used', desc: 'Already-spent mystery brick (solid).' }
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
      { id: 'walker',  desc: 'Walks back and forth. Stompable. Theme-skinned (lion, leaf, rock...).' },
      { id: 'thrower', desc: 'Stationary thrower - lobs projectiles. NOW stompable.' },
      { id: 'crab',    desc: 'Crab - sideways scuttle on the floor.' }
    ]},
    { title: 'FLYING / WATER', items: [
      { id: 'wisp',    desc: 'Floating wisp. Stompable. Set "shoots:true" for storm-cloud shooter.' },
      { id: 'octopus', desc: 'Underwater octopus - eight-arm hazard. NOT stompable.' },
      { id: 'eel',     desc: 'Electric eel - vertical patrol with shock. NOT stompable.' }
    ]},
    { title: 'HAZARDS', items: [
      { id: 'skyhazard', desc: 'Sky hazard (sun flare, etc). Periodic descend. NOT stompable.' },
      { id: 'twister',   desc: 'Tornado - sweeping ground hazard. NOT stompable.' },
      { id: 'bubble',    desc: 'Bubble-up vertical hazard (water levels).' }
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
      default:           return {};
    }
  }

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
      '  <div class="ed-actions">',
      '    <button id="ed-test" title="Test the current edits live (T) - jumps into the level scene with the in-memory edits.">▶ TEST</button>',
      '    <button id="ed-save-variant" title="Save the current edits as a named variant in your browser library (no disk write).">SAVE VARIANT</button>',
      '    <button id="ed-save" title="Write the current edits to disk as js/level_X_Y.js (Ctrl+S). Picks a file once, then writes directly.">EXPORT .js</button>',
      '    <button id="ed-saveas" title="Pick a different target file and write the level there.">EXPORT AS</button>',
      '    <button id="ed-exit" title="Exit back to the title menu (Esc)">EXIT</button>',
      '  </div>',
      '</div>',

      '<div class="ed-bar ed-desc" id="ed-tool-desc"></div>',

      '<div class="ed-bar ed-left">',
      '  <div class="ed-section" id="ed-tile-pal">',
      '    <h4>TILES <span class="ed-help" title="Click a tile, then paint on the canvas. Right-click to erase. Brush size below.">?</span></h4>',
      '    <div class="ed-palette" id="ed-tile-buttons"></div>',
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
      '    <button data-rtab="variants" title="Library of saved variants of this stage. Load, rename, delete, or mark one as the main version used by the game.">VARIANTS</button>',
      '  </div>',
      '  <div id="ed-tab-props" class="ed-tab-body">',
      '    <div id="ed-props-body"><p class="ed-hint">Nothing selected. Switch to SELECT tool and click any spawn or mover.</p></div>',
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
      '</div>'
    ].join('');
    document.body.appendChild(ui);

    // ---- Tile palette ----
    var tbox = ui.querySelector('#ed-tile-buttons');
    TILE_DEFS.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'ed-tile-btn';
      b.setAttribute('data-tile', t.c);
      b.title = t.label.toUpperCase() + ' - ' + t.desc;
      b.innerHTML = '<span class="ed-tile-glyph">' + (t.c === ' ' ? '·' : t.c) +
        '</span><span class="ed-tile-label">' + t.label + '</span>' +
        '<span class="ed-badge" data-usage="' + t.c + '" hidden></span>';
      tbox.appendChild(b);
    });

    // ---- Spawn palette (grouped) ----
    var sgroupBox = ui.querySelector('#ed-spawn-groups');
    SPAWN_GROUPS.forEach(function (g) {
      var section = document.createElement('div');
      section.className = 'ed-spawn-group';
      section.innerHTML = '<h5>' + g.title + '</h5><div class="ed-palette"></div>';
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
      sgroupBox.appendChild(section);
    });

    // ---- Tool-description bar updates with tool ----
    function refreshToolDesc() {
      var d = TOOL_DEFS.filter(function (t) { return t.id === scene.tool; })[0];
      ui.querySelector('#ed-tool-desc').textContent = d ? d.label + ': ' + d.desc : '';
    }
    ui._refreshToolDesc = refreshToolDesc;

    // ---- Initial state ----
    refreshToolHighlight(ui, scene);
    refreshTileHighlight(ui, scene);
    refreshSpawnHighlight(ui, scene);
    refreshStatus(ui, scene);
    refreshToolDesc();
    refreshUsageBadges(ui, scene);
    refreshVariantList(ui, scene);
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
    ui.querySelector('#ed-test').addEventListener('click', function () { scene.test(); });
    ui.querySelector('#ed-exit').addEventListener('click', function () { scene.exitToMenu(); });

    // Right-panel tab switching
    ui.querySelectorAll('[data-rtab]').forEach(function (b) {
      b.addEventListener('click', function () {
        var name = b.getAttribute('data-rtab');
        ui.querySelectorAll('[data-rtab]').forEach(function (x) {
          x.classList.toggle('active', x === b);
        });
        ui.querySelector('#ed-tab-props').hidden = name !== 'props';
        ui.querySelector('#ed-tab-variants').hidden = name !== 'variants';
        if (name === 'variants') refreshVariantList(ui, scene);
      });
    });

    return ui;
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
    if (!sel) { body.innerHTML = '<p class="ed-hint">Nothing selected.</p>'; return; }
    // Render simple field editors. Each field's onchange writes back
    // into the underlying spawn/mover object.
    var html = '<p><strong>' + sel.kind + '</strong></p>';
    if (sel.kind === 'spawn') {
      var sp = sel.ref;
      html += fieldRow('type', sp.type, true);
      html += fieldRow('tx', sp.tx);
      html += fieldRow('ty', sp.ty);
      // Optional fields based on type
      var optional = {
        wisp: ['variant', 'shoots'],
        walker: ['variant'],
        thrower: ['variant'],
        npc: ['kind'],
        signature: ['kind'],
        skyhazard: ['kind', 'period', 'dir'],
        twister: ['spd'],
        eel: ['maxH', 'period', 'phase']
      };
      var ext = optional[sp.type] || [];
      ext.forEach(function (k) { html += fieldRow(k, sp[k] !== undefined ? sp[k] : ''); });
      html += '<button id="ed-del">DELETE</button>';
    } else if (sel.kind === 'mover') {
      var m = sel.ref;
      html += fieldRow('tx', m.tx);
      html += fieldRow('ty', m.ty);
      html += fieldRow('tx1', m.tx1);
      html += fieldRow('ty1', m.ty1);
      html += fieldRow('spd', m.spd);
      html += fieldRow('phase', m.phase);
      html += '<button id="ed-del">DELETE</button>';
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
  function fieldRow(name, val, readonly) {
    var v = val == null ? '' : String(val);
    return '<label>' + name +
      '<input type="text" data-field="' + name + '" value="' + escapeHtml(v) + '"' +
      (readonly ? ' readonly' : '') + '></label>';
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
      canvas.addEventListener('pointerdown', this._onDown);
      canvas.addEventListener('pointermove', this._onMove);
      canvas.addEventListener('pointerup', this._onUp);
      canvas.addEventListener('pointercancel', this._onUp);
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
      canvas.removeEventListener('wheel', this._onWheel);
      canvas.removeEventListener('contextmenu', this._onCtx);
    },
    pointerToTile: function (e) {
      var canvas = SDD.canvas;
      var r = canvas.getBoundingClientRect();
      var sx = (e.clientX - r.left) / r.width * 320;       // game-pixel x
      var sy = (e.clientY - r.top) / r.height * 180;       // game-pixel y
      var wx = sx + this.cam.x;
      var wy = sy + this.cam.y;
      return { col: Math.floor(wx / 16), row: Math.floor(wy / 16), wx: wx, wy: wy, sx: sx, sy: sy };
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
          refreshProps(this.ui, this);
        } else if (rightClick && mhit) {
          this.removeMover(mhit);
        } else {
          this.drag = { startCol: p.col, startRow: p.row, curCol: p.col, curRow: p.row };
        }
      } else if (this.tool === 'select') {
        var s = this.hitTestSpawn(p.col, p.row);
        var m = this.hitTestMover(p.col, p.row);
        if (s) { this.selection = { kind: 'spawn', ref: s }; }
        else if (m) { this.selection = { kind: 'mover', ref: m }; }
        else { this.selection = null; }
        refreshProps(this.ui, this);
      }
    },
    onPointerMove: function (e) {
      var p = this.pointerToTile(e);
      this.hoverCol = p.col; this.hoverRow = p.row;
      this.ui.querySelector('#ed-coords').textContent = p.col + ', ' + p.row;
      if (!this.pointerDown) return;
      if (this.tool === 'tile') {
        this.paintAt(p.col, p.row, this.pointerDown.right ? ' ' : this.brushTile);
      } else if (this.tool === 'mover' && this.drag) {
        this.drag.curCol = p.col; this.drag.curRow = p.row;
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
      this.pointerDown = null;
    },
    onWheel: function (e) {
      e.preventDefault();
      // Horizontal pan with wheel; shift+wheel = vertical
      var dx = e.deltaY;
      if (e.shiftKey) {
        this.cam.y = Math.max(0, this.cam.y + dx * 0.5);
      } else {
        this.cam.x = Math.max(0, this.cam.x + dx * 0.5);
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
      // Camera pan with arrows
      var panStep = 32;
      if (k === 'ArrowLeft')  { this.cam.x = Math.max(0, this.cam.x - panStep); this.clampCam(); }
      if (k === 'ArrowRight') { this.cam.x = this.cam.x + panStep; this.clampCam(); }
      if (k === 'ArrowUp')    { this.cam.y = Math.max(0, this.cam.y - panStep); this.clampCam(); }
      if (k === 'ArrowDown')  { this.cam.y = this.cam.y + panStep; this.clampCam(); }
    },
    clampCam: function () {
      var maxX = Math.max(0, this.lvl.width * 16 - 320);
      var maxY = Math.max(0, this.lvl.height * 16 - 180);
      this.cam.x = Math.min(this.cam.x, maxX);
      this.cam.y = Math.min(this.cam.y, maxY);
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
      var numeric = ['tx', 'ty', 'tx1', 'ty1', 'spd', 'phase', 'period', 'maxH', 'dir'];
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

    // --- per-frame ---
    update: function () {
      this.t++;
    },
    render: function (g) {
      // Flat backdrop so the grid stays readable
      g.fillStyle = '#0e0e1a';
      g.fillRect(0, 0, 320, 180);
      var lvl = this.lvl;
      if (!lvl) return;
      var T = 16;
      var camx = Math.round(this.cam.x), camy = Math.round(this.cam.y);
      var t0x = Math.max(0, Math.floor(camx / T));
      var t1x = Math.min(lvl.width - 1, Math.ceil((camx + 320) / T));
      var t0y = Math.max(0, Math.floor(camy / T));
      var t1y = Math.min(lvl.height - 1, Math.ceil((camy + 180) / T));

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
          else if (code === 'L') name = 'tile_lava';
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
        g.moveTo(px, 0); g.lineTo(px, 180);
      }
      for (var gy = t0y; gy <= t1y + 1; gy++) {
        var py = Math.round(gy * T - camy) + 0.5;
        g.moveTo(0, py); g.lineTo(320, py);
      }
      g.stroke();

      // Spawns - simple colored dots with type letter
      var typeColors = {
        player: '#ffd23a', walker: '#ff8a6a', thrower: '#c050a0',
        wisp: '#a8c8ff', crab: '#ff7050', core: '#46f0ff',
        timepart: '#fff', npc: '#9bf0a0', checkpoint: '#ffe070',
        signature: '#ffe890', skyhazard: '#ff5418', bubble: '#a8e6ff',
        octopus: '#d068a0', twister: '#dfe6ff', eel: '#7adfff'
      };
      var spawns = lvl.spawns;
      for (var i = 0; i < spawns.length; i++) {
        var sp = spawns[i];
        var sxp = sp.tx * T - camx + 8;
        var syp = sp.ty * T - camy + 8;
        if (sxp < -8 || sxp > 328 || syp < -8 || syp > 188) continue;
        var col = typeColors[sp.type] || '#fff';
        g.fillStyle = col;
        g.fillRect(sxp - 4, syp - 4, 8, 8);
        g.fillStyle = '#000';
        g.fillRect(sxp - 3, syp - 3, 6, 6);
        g.fillStyle = col;
        g.fillRect(sxp - 1, syp - 1, 2, 2);
        // First letter label
        if (S && S.text) S.text(g, sp.type.charAt(0).toUpperCase(), sxp, syp + 6, col, 1, 'center');
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
                'flappyFlap', 'flappyGravity', 'flappyMaxFall', 'themeZones'];
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
