// ui.js — reusable kawaii UI widgets (chunky buttons, frosted panels,
// toggle rows). Deliberately small/simple so the sub-game reads as a
// sub-game, not the parent app shell (Brief §7).
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.UI = {
  FONT: '"Baloo 2", "Trebuchet MS", system-ui, sans-serif',           // readable body
  DISPLAY: '"Pixelify Sans", "Baloo 2", system-ui, sans-serif',       // pixel display

  // brushed-metal chunky button with a neon accent edge + press-bounce.
  button: function (scene, x, y, w, h, label, onClick, opts) {
    opts = opts || {};
    var neon = opts.fill != null ? opts.fill : 0x4fd9ff;   // accent (neon) colour
    var neonStr = '#' + neon.toString(16).padStart(6, '0');
    var c = scene.add.container(x, y);

    // frosted-glass body lit with the accent (neon) colour
    var g = scene.add.graphics();
    function paint(top) {
      g.clear();
      var off = top ? 3 : 0;
      // neon outer glow (the "energy")
      g.fillStyle(neon, 0.20); g.fillRoundedRect(-w / 2 - 5, -h / 2 - 5 + off, w + 10, h + 10, 20);
      g.fillStyle(neon, 0.10); g.fillRoundedRect(-w / 2 - 9, -h / 2 - 9 + off, w + 18, h + 18, 24);
      // translucent dark glass body (background shows through faintly)
      g.fillStyle(0x0c1730, 0.5);  g.fillRoundedRect(-w / 2, -h / 2 + off, w, h - 3, 16);
      // colour wash + a brighter pool toward the bottom (held energy)
      g.fillStyle(neon, 0.12);     g.fillRoundedRect(-w / 2, -h / 2 + off, w, h - 3, 16);
      g.fillStyle(neon, 0.10);     g.fillRoundedRect(-w / 2 + 5, h / 2 - 3 - (h - 3) * 0.4 + off, w - 10, (h - 3) * 0.4, 12);
      // glossy glass sheen across the top
      g.fillStyle(0xffffff, 0.16); g.fillRoundedRect(-w / 2 + 6, -h / 2 + off + 4, w - 12, (h - 3) * 0.36, 12);
      g.fillStyle(0xffffff, 0.08); g.fillRoundedRect(-w / 2 + 6, -h / 2 + off + 4, w - 12, (h - 3) * 0.18, 10);
      // bright neon rim + faint inner glass rim
      g.lineStyle(2.5, neon, 0.95); g.strokeRoundedRect(-w / 2, -h / 2 + off, w, h - 3, 16);
      g.lineStyle(1, 0xffffff, 0.18); g.strokeRoundedRect(-w / 2 + 4, -h / 2 + off + 3, w - 8, (h - 3) - 6, 13);
    }
    paint(false);

    var txt = scene.add.text(0, 0, label, {
      fontFamily: DANNYLAB.UI.FONT,
      fontSize: (opts.fontSize || Math.round(h * 0.42)) + 'px',
      color: opts.textColor || '#eafffb',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    txt.setShadow(0, 0, neonStr, 8);   // neon text glow

    c.add([g, txt]);

    // Input via the scene pointer + the button's WORLD bounds, not a Phaser
    // interactive object: the camera is zoomed for supersampling, and per-
    // camera zoom breaks Phaser's object hit-testing. Comparing the pointer's
    // worldX/worldY against the button's world transform is zoom-proof and also
    // handles buttons nested inside other containers (e.g. toggle rows).
    var pressed = false, tmp = new Phaser.GameObjects.Components.TransformMatrix();
    function inside(px, py) {
      if (!c.active || !c.visible) return false;
      c.getWorldTransformMatrix(tmp);
      return Math.abs(px - tmp.tx) <= w / 2 && Math.abs(py - tmp.ty) <= h / 2;
    }
    function onDown(p) { if (inside(p.worldX, p.worldY)) { pressed = true; paint(true); txt.y = 3; } }
    function onUp(p) {
      if (!pressed) return;
      pressed = false; paint(false); txt.y = 0;
      if (inside(p.worldX, p.worldY)) {
        var a = scene.registry.get('audio'); if (a) a.click();
        scene.tweens.add({ targets: c, scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true, ease: 'Quad.out' });
        if (onClick) onClick();
      }
    }
    scene.input.on('pointerdown', onDown);
    scene.input.on('pointerup', onUp);
    scene.input.on('pointerupoutside', onUp);
    c.once('destroy', function () {
      scene.input.off('pointerdown', onDown);
      scene.input.off('pointerup', onUp);
      scene.input.off('pointerupoutside', onUp);
    });

    c.setLabel = function (s) { txt.setText(s); };
    c.txt = txt;
    return c;
  },

  // frosted dark-glass panel with a neon edge (overlay background)
  panel: function (scene, x, y, w, h, opts) {
    opts = opts || {};
    var neon = opts.neon != null ? opts.neon : 0x4fd9ff;
    var g = scene.add.graphics();
    var L = x - w / 2, T = y - h / 2;
    // neon outer halo
    g.fillStyle(neon, 0.12); g.fillRoundedRect(L - 6, T - 6, w + 12, h + 12, 28);
    // translucent dark glass body (frosted)
    g.fillStyle(0x0b1530, opts.shade != null ? opts.shade : 0.64);
    g.fillRoundedRect(L, T, w, h, 22);
    g.fillStyle(neon, 0.06); g.fillRoundedRect(L, T, w, h, 22);
    // glossy sheen across the top
    g.fillStyle(0xffffff, 0.10);
    g.fillRoundedRect(L + 8, T + 8, w - 16, h * 0.18, 16);
    g.fillStyle(0xffffff, 0.05);
    g.fillRoundedRect(L + 8, T + 8, w - 16, h * 0.09, 12);
    // neon double border + inner glass rim
    g.lineStyle(2.5, neon, 0.85); g.strokeRoundedRect(L, T, w, h, 22);
    g.lineStyle(1, 0xffffff, 0.16); g.strokeRoundedRect(L + 4, T + 4, w - 8, h - 8, 18);
    return g;
  },

  // full-screen dim behind an overlay (logical 540x960 world)
  scrim: function (scene, alpha) {
    var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H;
    var g = scene.add.graphics();
    g.fillStyle(0x040814, alpha == null ? 0.5 : alpha);
    g.fillRect(0, 0, W, H);
    g.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
    return g;
  },

  // a label + value toggle row (used in Options). onToggle returns new label.
  toggleRow: function (scene, x, y, w, labelText, valueText, onToggle) {
    var lang = scene.registry.get('lang');
    var row = scene.add.container(x, y);
    var label = scene.add.text(-w / 2 + 18, 0, labelText, {
      fontFamily: DANNYLAB.UI.FONT, fontSize: '26px', color: '#dceaff', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    var btn = DANNYLAB.UI.button(scene, w / 2 - 80, 0, 140, 52, valueText, function () {
      var nv = onToggle();
      btn.setLabel(nv);
    }, { fill: 0x3aa6a0, fontSize: 22 });
    row.add([label, btn]);
    row.valueBtn = btn;
    return row;
  },

  // a label + drag slider row (used in Options for volume). value is 0..1;
  // onChange(value) fires live as you drag. Input uses the scene pointer + the
  // row's WORLD transform (zoom-proof, same approach as button()).
  slider: function (scene, x, y, w, labelText, value, onChange) {
    value = Math.max(0, Math.min(1, value || 0));
    var row = scene.add.container(x, y);
    var label = scene.add.text(-w / 2 + 18, 0, labelText, {
      fontFamily: DANNYLAB.UI.FONT, fontSize: '26px', color: '#dceaff', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    // track geometry, in row-local coords
    var tx0 = -w / 2 + 150, tx1 = w / 2 - 64, tw = tx1 - tx0;
    var g = scene.add.graphics();
    var knob = scene.add.circle(0, 0, 14, 0x7CFF6B).setStrokeStyle(2, 0xffffff, 0.65);
    var pct = scene.add.text(w / 2 - 6, 0, '', {
      fontFamily: DANNYLAB.UI.FONT, fontSize: '22px', color: '#9fe8c0', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    function draw() {
      var kx = tx0 + tw * value;
      g.clear();
      g.fillStyle(0x0b1530, 0.9); g.fillRoundedRect(tx0, -5, tw, 10, 5);
      g.lineStyle(1.5, 0x4fd9ff, 0.5); g.strokeRoundedRect(tx0, -5, tw, 10, 5);
      if (kx > tx0 + 1) { g.fillStyle(0x7CFF6B, 0.95); g.fillRoundedRect(tx0, -4, kx - tx0, 8, 4); }
      knob.setPosition(kx, 0);
      pct.setText(Math.round(value * 100) + '%');
    }
    draw();
    row.add([label, g, knob, pct]);

    var dragging = false, tmp = new Phaser.GameObjects.Components.TransformMatrix();
    function setFrom(px) {
      row.getWorldTransformMatrix(tmp);
      value = Math.max(0, Math.min(1, (px - tmp.tx - tx0) / tw));   // pointer → 0..1 (zoom-proof)
      draw();
      if (onChange) onChange(value);
    }
    function near(px, py) {
      if (!row.active || !row.visible) return false;
      row.getWorldTransformMatrix(tmp);
      var lx = px - tmp.tx, ly = py - tmp.ty;
      return ly > -28 && ly < 28 && lx > tx0 - 26 && lx < tx1 + 26;
    }
    function onDown(p) { if (near(p.worldX, p.worldY)) { dragging = true; setFrom(p.worldX); } }
    function onMove(p) { if (dragging) setFrom(p.worldX); }
    function onUp() { if (dragging) { dragging = false; var a = scene.registry.get('audio'); if (a) a.click(); } }
    scene.input.on('pointerdown', onDown);
    scene.input.on('pointermove', onMove);
    scene.input.on('pointerup', onUp);
    scene.input.on('pointerupoutside', onUp);
    row.once('destroy', function () {
      scene.input.off('pointerdown', onDown);
      scene.input.off('pointermove', onMove);
      scene.input.off('pointerup', onUp);
      scene.input.off('pointerupoutside', onUp);
    });
    return row;
  },
};
