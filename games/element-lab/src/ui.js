// ui.js — reusable kawaii UI widgets (chunky buttons, frosted panels,
// toggle rows). Deliberately small/simple so the sub-game reads as a
// sub-game, not the parent app shell (Brief §7).
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.UI = {
  FONT: '"Baloo 2", "Trebuchet MS", system-ui, sans-serif',

  // rounded-rect chunky button with press-bounce + click sound.
  button: function (scene, x, y, w, h, label, onClick, opts) {
    opts = opts || {};
    var fill = opts.fill != null ? opts.fill : 0x5b8def;
    var fillDark = DANNYLAB.shade(fill, -0.18);
    var c = scene.add.container(x, y);

    var g = scene.add.graphics();
    function paint(top) {
      g.clear();
      // drop / 3D base
      g.fillStyle(fillDark, 1);
      g.fillRoundedRect(-w / 2, -h / 2 + (top ? 3 : 6), w, h, 16);
      // face
      g.fillStyle(fill, 1);
      g.fillRoundedRect(-w / 2, -h / 2 + (top ? 0 : 3), w, h - 3, 16);
      // gloss
      g.fillStyle(0xffffff, 0.18);
      g.fillRoundedRect(-w / 2 + 6, -h / 2 + (top ? 3 : 6), w - 12, h * 0.34, 10);
    }
    paint(false);

    var txt = scene.add.text(0, 0, label, {
      fontFamily: DANNYLAB.UI.FONT,
      fontSize: (opts.fontSize || Math.round(h * 0.42)) + 'px',
      color: opts.textColor || '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);
    txt.setShadow(0, 2, 'rgba(0,0,0,0.25)', 2);

    c.add([g, txt]);
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    c.on('pointerdown', function () { paint(true); txt.y = 3; });
    function release(fire) {
      paint(false); txt.y = 0;
      if (fire) {
        var a = scene.registry.get('audio'); if (a) a.click();
        scene.tweens.add({ targets: c, scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true, ease: 'Quad.out' });
        if (onClick) onClick();
      }
    }
    c.on('pointerup', function () { release(true); });
    c.on('pointerout', function () { release(false); });

    c.setLabel = function (s) { txt.setText(s); };
    c.txt = txt;
    return c;
  },

  // frosted rounded panel (background for overlays)
  panel: function (scene, x, y, w, h, opts) {
    opts = opts || {};
    var g = scene.add.graphics();
    g.fillStyle(0x0c1430, opts.shade != null ? opts.shade : 0.55);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 24);
    g.lineStyle(3, 0x8fc7ff, 0.5);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 24);
    // top gloss
    g.fillStyle(0xffffff, 0.06);
    g.fillRoundedRect(x - w / 2 + 8, y - h / 2 + 8, w - 16, h * 0.22, 16);
    return g;
  },

  // full-screen dim behind an overlay
  scrim: function (scene, alpha) {
    var cam = scene.cameras.main;
    var g = scene.add.graphics();
    g.fillStyle(0x040814, alpha == null ? 0.5 : alpha);
    g.fillRect(0, 0, cam.width, cam.height);
    g.setInteractive(new Phaser.Geom.Rectangle(0, 0, cam.width, cam.height), Phaser.Geom.Rectangle.Contains);
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
};
