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

  // -----------------------------------------------------------------
  // DOM overlay - built on enter(), torn down on exit().
  // -----------------------------------------------------------------
  function buildUI(scene) {
    var ui = document.createElement('div');
    ui.id = 'editor-ui';
    ui.innerHTML = [
      '<div class="ed-bar ed-top">',
      '  <label>STAGE',
      '    <select id="ed-stage">',
      STAGE_KEYS.map(function (k) { return '<option value="' + k + '">DAY ' + k + '</option>'; }).join(''),
      '    </select>',
      '  </label>',
      '  <div class="ed-tools">',
      '    <button data-tool="tile">TILE [1]</button>',
      '    <button data-tool="spawn">SPAWN [2]</button>',
      '    <button data-tool="mover">MOVER [3]</button>',
      '    <button data-tool="select">SELECT [4]</button>',
      '  </div>',
      '  <div class="ed-actions">',
      '    <button id="ed-save" title="Save (Ctrl+S)">SAVE</button>',
      '    <button id="ed-saveas" title="Save As...">SAVE AS</button>',
      '    <button id="ed-test" title="Test (T)">TEST</button>',
      '    <button id="ed-exit" title="Exit (Esc)">EXIT</button>',
      '  </div>',
      '</div>',

      '<div class="ed-bar ed-left">',
      '  <div class="ed-section" id="ed-tile-pal">',
      '    <h4>TILES</h4>',
      '    <div class="ed-palette" id="ed-tile-buttons"></div>',
      '    <label class="ed-brush">BRUSH <select id="ed-brush-size"><option>1</option><option>3</option><option>5</option></select></label>',
      '  </div>',
      '  <div class="ed-section" id="ed-spawn-pal" hidden>',
      '    <h4>SPAWNS</h4>',
      '    <div class="ed-palette" id="ed-spawn-buttons"></div>',
      '  </div>',
      '  <div class="ed-section" id="ed-mover-pal" hidden>',
      '    <h4>MOVER</h4>',
      '    <p>Click + drag from start to end tile to define a new mover. Click an existing mover to select.</p>',
      '  </div>',
      '  <div class="ed-section" id="ed-select-pal" hidden>',
      '    <h4>SELECT</h4>',
      '    <p>Click any spawn / mover to inspect. Arrows nudge; Delete removes.</p>',
      '  </div>',
      '</div>',

      '<div class="ed-bar ed-right" id="ed-props">',
      '  <h4>PROPERTIES</h4>',
      '  <div id="ed-props-body"><p class="ed-hint">Nothing selected.</p></div>',
      '</div>',

      '<div class="ed-bar ed-bottom" id="ed-status">',
      '  <span id="ed-coords">--, --</span>',
      '  <span id="ed-counts"></span>',
      '  <span id="ed-dirty"></span>',
      '  <span id="ed-toast"></span>',
      '</div>'
    ].join('');
    document.body.appendChild(ui);

    // Populate tile palette buttons
    var TILE_DEFS = [
      { c: ' ', label: 'erase' },
      { c: 'X', label: 'ground' },
      { c: '#', label: 'brick' },
      { c: '=', label: 'oneway' },
      { c: 'V', label: 'vine' },
      { c: 'W', label: 'water' },
      { c: '~', label: 'wsurf' },
      { c: '?', label: '? core' },
      { c: 'G', label: 'G grow' },
      { c: 'B', label: 'B blast' },
      { c: 'U', label: 'used' },
      { c: 'L', label: 'lava' }
    ];
    var tbox = ui.querySelector('#ed-tile-buttons');
    TILE_DEFS.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'ed-tile-btn';
      b.setAttribute('data-tile', t.c);
      b.innerHTML = '<span class="ed-tile-glyph">' + (t.c === ' ' ? '·' : t.c) + '</span><span class="ed-tile-label">' + t.label + '</span>';
      tbox.appendChild(b);
    });

    var SPAWN_DEFS = [
      'player', 'walker', 'thrower', 'wisp', 'crab',
      'core', 'timepart', 'npc', 'checkpoint', 'signature',
      'skyhazard', 'bubble', 'octopus', 'twister', 'eel'
    ];
    var sbox = ui.querySelector('#ed-spawn-buttons');
    SPAWN_DEFS.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'ed-spawn-btn';
      b.setAttribute('data-spawn', s);
      b.textContent = s;
      sbox.appendChild(b);
    });

    // Initial highlight
    refreshToolHighlight(ui, scene);
    refreshTileHighlight(ui, scene);
    refreshSpawnHighlight(ui, scene);
    refreshStatus(ui, scene);

    // ---- Event wiring ----
    ui.querySelector('#ed-stage').value = scene.day + '-' + scene.stage;
    ui.querySelector('#ed-stage').addEventListener('change', function (e) {
      var parts = e.target.value.split('-');
      scene.switchStage(parseInt(parts[0], 10), parseInt(parts[1], 10));
      refreshStatus(ui, scene);
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
      });
    });
    ui.querySelectorAll('.ed-spawn-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        scene.brushSpawn = b.getAttribute('data-spawn');
        scene.tool = 'spawn';
        refreshToolHighlight(ui, scene);
        refreshSpawnHighlight(ui, scene);
      });
    });
    ui.querySelector('#ed-brush-size').addEventListener('change', function (e) {
      scene.brushSize = parseInt(e.target.value, 10) || 1;
    });
    ui.querySelector('#ed-save').addEventListener('click', function () { scene.save(false); });
    ui.querySelector('#ed-saveas').addEventListener('click', function () { scene.save(true); });
    ui.querySelector('#ed-test').addEventListener('click', function () { scene.test(); });
    ui.querySelector('#ed-exit').addEventListener('click', function () { scene.exitToMenu(); });

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
      // Default optional fields where useful
      if (sp.type === 'signature') sp.kind = 'sunburst';
      if (sp.type === 'skyhazard') { sp.kind = 'flare'; sp.period = 110; }
      if (sp.type === 'npc') sp.kind = 'adam';
      if (sp.type === 'twister') sp.spd = 1.6;
      if (sp.type === 'eel') { sp.maxH = 96; sp.period = 220; sp.phase = 0; }
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
})();
