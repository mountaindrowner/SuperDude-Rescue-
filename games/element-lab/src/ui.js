// ui.js — reusable kawaii UI widgets (chunky buttons, frosted panels,
// toggle rows). Deliberately small/simple so the sub-game reads as a
// sub-game, not the parent app shell (Brief §7).
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.UI = {
  FONT: '"Baloo 2", "Trebuchet MS", system-ui, sans-serif',

  // brushed-metal chunky button with a neon accent edge + press-bounce.
  button: function (scene, x, y, w, h, label, onClick, opts) {
    opts = opts || {};
    var neon = opts.fill != null ? opts.fill : 0x4fd9ff;   // accent (neon) colour
    var neonStr = '#' + neon.toString(16).padStart(6, '0');
    var c = scene.add.container(x, y);

    // metallic body bands (top light steel → bottom dark steel)
    var g = scene.add.graphics();
    function paint(top) {
      g.clear();
      var off = top ? 3 : 0;
      // neon outer glow
      g.fillStyle(neon, 0.16); g.fillRoundedRect(-w / 2 - 4, -h / 2 - 4 + off, w + 8, h + 8, 18);
      g.fillStyle(neon, 0.10); g.fillRoundedRect(-w / 2 - 7, -h / 2 - 7 + off, w + 14, h + 14, 20);
      // 3D base lip
      g.fillStyle(0x10182e, 1); g.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, 14);
      // brushed-metal body (3 vertical bands)
      g.fillStyle(0x46546f, 1); g.fillRoundedRect(-w / 2, -h / 2 + off, w, h - 3, 14);
      g.fillStyle(0x586784, 1); g.fillRoundedRect(-w / 2, -h / 2 + off, w, (h - 3) * 0.5, 14);
      g.fillStyle(0x6b7c9b, 0.9); g.fillRoundedRect(-w / 2 + 4, -h / 2 + off + 3, w - 8, (h - 3) * 0.30, 10);
      // gloss highlight
      g.fillStyle(0xffffff, 0.16); g.fillRoundedRect(-w / 2 + 6, -h / 2 + off + 4, w - 12, h * 0.22, 8);
      // neon accent border
      g.lineStyle(2.5, neon, 0.95); g.strokeRoundedRect(-w / 2, -h / 2 + off, w, h - 3, 14);
      // bottom inner shadow line
      g.lineStyle(2, 0x0a1024, 0.5); g.beginPath();
      g.moveTo(-w / 2 + 10, h / 2 - 5 + off); g.lineTo(w / 2 - 10, h / 2 - 5 + off); g.strokePath();
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

    // Input is driven by a transparent interactive Rectangle child, NOT the
    // Container's own hitArea: a Container + Geom.Rectangle hit test has a
    // right-half dead-zone on scaled/mobile canvases. A Shape GameObject has
    // a reliable, correctly-centered hit area.
    var hit = scene.add.rectangle(0, 0, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    c.add(hit);

    hit.on('pointerdown', function () { paint(true); txt.y = 3; });
    function release(fire) {
      paint(false); txt.y = 0;
      if (fire) {
        var a = scene.registry.get('audio'); if (a) a.click();
        scene.tweens.add({ targets: c, scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true, ease: 'Quad.out' });
        if (onClick) onClick();
      }
    }
    hit.on('pointerup', function () { release(true); });
    hit.on('pointerout', function () { release(false); });
    hit.on('pointerupoutside', function () { release(false); });

    c.setLabel = function (s) { txt.setText(s); };
    c.txt = txt;
    c.hit = hit;
    return c;
  },

  // frosted dark-glass panel with a neon edge (overlay background)
  panel: function (scene, x, y, w, h, opts) {
    opts = opts || {};
    var neon = opts.neon != null ? opts.neon : 0x4fd9ff;
    var g = scene.add.graphics();
    var L = x - w / 2, T = y - h / 2;
    // neon outer halo
    g.fillStyle(neon, 0.10); g.fillRoundedRect(L - 5, T - 5, w + 10, h + 10, 26);
    // dark glass body
    g.fillStyle(0x0a1228, opts.shade != null ? opts.shade : 0.82);
    g.fillRoundedRect(L, T, w, h, 22);
    // brushed sheen at the very top
    g.fillStyle(0x182a4a, 0.5);
    g.fillRoundedRect(L, T, w, 40, { tl: 22, tr: 22, bl: 0, br: 0 });
    g.fillStyle(0xffffff, 0.05);
    g.fillRoundedRect(L + 8, T + 8, w - 16, h * 0.16, 14);
    // neon double border
    g.lineStyle(2.5, neon, 0.85); g.strokeRoundedRect(L, T, w, h, 22);
    g.lineStyle(1, neon, 0.35); g.strokeRoundedRect(L + 4, T + 4, w - 8, h - 8, 18);
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
