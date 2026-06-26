// background.js — Danny's wacky lab in layered depth (Brief §10.1).
// The back layers (wall, periodic poster, shelves, light shaft) are pushed
// into a blurred, faded container so they read as out-of-focus depth and
// never clash with the play area. In front sits a sharp metallic LAB TABLE
// that the beaker rests on, plus drifting foreground dust and a vignette.
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.buildLab = function (scene, opts) {
  opts = opts || {};
  var W = scene.cameras.main.width, H = scene.cameras.main.height;
  var dustMotes = [];

  // ============ BACK LAYERS (blurred + faded into the distance) ============
  var back = scene.add.container(0, 0).setDepth(-100);

  // wall gradient
  var wall = scene.add.graphics();
  var bands = 40;
  for (var i = 0; i < bands; i++) {
    var col = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x14254f),
      Phaser.Display.Color.ValueToColor(0x070d20), bands, i);
    wall.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
    wall.fillRect(0, H * (i / bands), W, H / bands + 1);
  }
  back.add(wall);

  // periodic-table poster (top-left)
  var poster = scene.add.graphics();
  var px = W * 0.05, py = H * 0.055, pw = W * 0.42, ph = H * 0.15;
  poster.fillStyle(0x1b2c55, 0.85); poster.fillRoundedRect(px, py, pw, ph, 8);
  poster.lineStyle(2, 0x4f7bd6, 0.5); poster.strokeRoundedRect(px, py, pw, ph, 8);
  var cols = 9, rows = 4, cellW = (pw - 16) / cols, cellH = (ph - 16) / rows;
  var swatch = [0xBEE3F8, 0xFBD38D, 0x7B8A9B, 0x4FD1C5, 0xF687B3, 0x9F7AEA, 0x8696A7, 0xECC94B, 0x7CFF6B];
  for (var r2 = 0; r2 < rows; r2++) for (var c2 = 0; c2 < cols; c2++) {
    if (r2 === 0 && c2 > 0 && c2 < cols - 1) continue;
    poster.fillStyle(swatch[(r2 * cols + c2) % swatch.length], 0.45);
    poster.fillRect(px + 8 + c2 * cellW + 1, py + 8 + r2 * cellH + 1, cellW - 2, cellH - 2);
  }
  back.add(poster);

  // upper-right shelf with bubbling beakers
  var shelfY = H * 0.165;
  var shelf = scene.add.graphics();
  shelf.fillStyle(0x24345e, 1); shelf.fillRect(W * 0.58, shelfY, W * 0.36, 7);
  shelf.fillStyle(0x1a2747, 1); shelf.fillRect(W * 0.58, shelfY + 7, W * 0.36, 4);
  back.add(shelf);
  var beakerCols = [0x4FD1C5, 0xF687B3, 0xFBD38D];
  for (var bk = 0; bk < 3; bk++) {
    var bx = W * 0.61 + bk * W * 0.11, bw = W * 0.06, bh = H * 0.04;
    var bg = scene.add.graphics();
    bg.fillStyle(beakerCols[bk], 0.4); bg.fillRoundedRect(bx, shelfY - bh, bw, bh, 4);
    bg.lineStyle(2, 0x9fdfff, 0.35); bg.strokeRoundedRect(bx, shelfY - bh, bw, bh, 4);
    back.add(bg);
    for (var z = 0; z < 3; z++) {
      var bub = scene.add.circle(bx + bw * (0.3 + 0.2 * z), shelfY - 4, 2 + Math.random() * 2, 0xffffff, 0.5);
      back.add(bub);
      (function (bub, startY, topY) {
        scene.tweens.add({ targets: bub, y: topY, alpha: 0, duration: 1400 + Math.random() * 1200,
          repeat: -1, repeatDelay: Math.random() * 800,
          onRepeat: function () { bub.y = startY; bub.alpha = 0.5; } });
      })(bub, shelfY - 4, shelfY - bh);
    }
  }

  // soft light shaft from the top
  var shaft = scene.add.graphics();
  shaft.fillStyle(0xbfe3ff, 0.05);
  shaft.fillTriangle(W * 0.42, 0, W * 0.58, 0, W * 0.78, H);
  shaft.fillTriangle(W * 0.42, 0, W * 0.78, H, W * 0.30, H);
  back.add(shaft);
  scene.tweens.add({ targets: shaft, alpha: 0.7, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  // push the whole back set out of focus
  back.setAlpha(0.78);
  try { if (back.postFX) back.postFX.addBlur(0, 2, 2, 1.1, 0xffffff, 6); } catch (e) {}

  // ============ MIDGROUND: metallic lab table (in focus) ============
  var tableTopY = H * 0.905;            // beaker floor sits ~ here
  var table = scene.add.graphics().setDepth(-12);
  // table surface slab
  table.fillStyle(0x2a3450, 1); table.fillRect(0, tableTopY, W, H - tableTopY);
  table.fillStyle(0x39455f, 1); table.fillRect(0, tableTopY, W, 14);            // lit top lip
  // brushed-metal streaks
  table.lineStyle(1, 0x4a586f, 0.5);
  for (var sx = 0; sx < W; sx += 26) { table.beginPath(); table.moveTo(sx, tableTopY + 18); table.lineTo(sx + 60, H); table.strokePath(); }
  // neon front edge highlight
  table.fillStyle(0x4fd9ff, 0.5); table.fillRect(0, tableTopY, W, 2);
  table.fillStyle(0x4fd9ff, 0.12); table.fillRect(0, tableTopY + 2, W, 6);
  // soft contact shadow where the beaker meets the table
  var contact = scene.add.graphics().setDepth(-11);
  contact.fillStyle(0x04060e, 0.4);
  contact.fillEllipse(W / 2, tableTopY + 4, W * 0.62, 26);

  // ============ FOREGROUND: drifting dust + vignette ============
  var nDust = opts.dust == null ? 16 : opts.dust;
  for (var d = 0; d < nDust; d++) {
    var m = scene.add.circle(Math.random() * W, Math.random() * H,
      1 + Math.random() * 3, 0xbfe3ff, 0.08 + Math.random() * 0.10).setDepth(60);
    m.driftX = (Math.random() - 0.5) * 6;
    m.driftY = -3 - Math.random() * 6;
    dustMotes.push(m);
  }

  // vignette: dark frame fading inward keeps focus on the beaker
  var vig = scene.add.graphics().setDepth(58);
  for (var k = 0; k < 26; k++) {
    var a = 0.05 * (1 - k / 26);
    vig.lineStyle(3, 0x04060e, a);
    vig.strokeRect(k * 1.6, k * 1.6, W - k * 3.2, H - k * 3.2);
  }

  return {
    update: function (dt) {
      var s = dt / 1000;
      for (var k = 0; k < dustMotes.length; k++) {
        var m = dustMotes[k];
        m.x += m.driftX * s; m.y += m.driftY * s;
        if (m.y < -4) { m.y = H + 4; m.x = Math.random() * W; }
        if (m.x < -4) m.x = W + 4; else if (m.x > W + 4) m.x = -4;
      }
    },
    parallax: function (nx) {
      for (var k = 0; k < dustMotes.length; k++) dustMotes[k].x += nx * 0.4;
    },
  };
};
