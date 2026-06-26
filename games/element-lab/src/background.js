// background.js — Danny's wacky lab, in layered parallax (Brief §10.1):
//   back wall (periodic poster + bubbling beakers) → mid shelves/gizmos →
//   foreground bench edge + drifting dust/bokeh + a soft light shaft.
// The foreground drift is "the secret ingredient."
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.buildLab = function (scene, opts) {
  opts = opts || {};
  var W = scene.cameras.main.width, H = scene.cameras.main.height;
  var dustMotes = [];

  // ---------- back wall: vertical gradient ----------
  var wall = scene.add.graphics().setDepth(-100);
  var bands = 40;
  for (var i = 0; i < bands; i++) {
    var f = i / bands;
    var col = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x10204a),
      Phaser.Display.Color.ValueToColor(0x070d22), bands, i);
    wall.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
    wall.fillRect(0, H * f, W, H / bands + 1);
  }

  // ---------- periodic-table poster (top-left on the wall) ----------
  var poster = scene.add.graphics().setDepth(-95);
  var px = W * 0.06, py = H * 0.07, pw = W * 0.42, ph = H * 0.16;
  poster.fillStyle(0x1b2c55, 0.85); poster.fillRoundedRect(px, py, pw, ph, 8);
  poster.lineStyle(2, 0x4f7bd6, 0.6); poster.strokeRoundedRect(px, py, pw, ph, 8);
  var cols = 9, rows = 4, cellW = (pw - 16) / cols, cellH = (ph - 16) / rows;
  var swatch = [0xBEE3F8, 0xFBD38D, 0x7B8A9B, 0x4FD1C5, 0xF687B3, 0x9F7AEA, 0x8696A7, 0xECC94B, 0x7CFF6B];
  for (var r2 = 0; r2 < rows; r2++) {
    for (var c2 = 0; c2 < cols; c2++) {
      if ((r2 === 0 && c2 > 0 && c2 < cols - 1)) continue; // poster-y gap on top row
      poster.fillStyle(swatch[(r2 * cols + c2) % swatch.length], 0.5);
      poster.fillRect(px + 8 + c2 * cellW + 1, py + 8 + r2 * cellH + 1, cellW - 2, cellH - 2);
    }
  }

  // ---------- back-wall shelf with bubbling beakers (upper-right wall) ----------
  var shelfY = H * 0.175;
  var shelf = scene.add.graphics().setDepth(-92);
  shelf.fillStyle(0x24345e, 1); shelf.fillRect(W * 0.58, shelfY, W * 0.36, 7);
  shelf.fillStyle(0x1a2747, 1); shelf.fillRect(W * 0.58, shelfY + 7, W * 0.36, 4);
  var beakerCols = [0x4FD1C5, 0xF687B3, 0xFBD38D];
  for (var bk = 0; bk < 3; bk++) {
    var bx = W * 0.61 + bk * W * 0.11;
    var bw = W * 0.06, bh = H * 0.04;
    var bg = scene.add.graphics().setDepth(-91);
    bg.fillStyle(beakerCols[bk], 0.45); bg.fillRoundedRect(bx, shelfY - bh, bw, bh, 4);
    bg.lineStyle(2, 0x9fdfff, 0.4); bg.strokeRoundedRect(bx, shelfY - bh, bw, bh, 4);
    // animated bubbles rising inside
    for (var z = 0; z < 3; z++) {
      var bub = scene.add.circle(bx + bw * (0.3 + 0.2 * z), shelfY - 4, 2 + Math.random() * 2, 0xffffff, 0.5).setDepth(-90);
      (function (bub, startY, topY) {
        scene.tweens.add({
          targets: bub, y: topY, alpha: 0, duration: 1400 + Math.random() * 1200,
          repeat: -1, repeatDelay: Math.random() * 800,
          onRepeat: function () { bub.y = startY; bub.alpha = 0.5; },
        });
      })(bub, shelfY - 4, shelfY - bh);
    }
  }

  // ---------- soft light shaft from the top ----------
  var shaft = scene.add.graphics().setDepth(-80);
  shaft.fillStyle(0xbfe3ff, 0.06);
  shaft.fillTriangle(W * 0.42, 0, W * 0.58, 0, W * 0.78, H);
  shaft.fillTriangle(W * 0.42, 0, W * 0.78, H, W * 0.30, H);
  scene.tweens.add({ targets: shaft, alpha: 0.6, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  // ---------- foreground: lab bench edge ----------
  var bench = scene.add.graphics().setDepth(50);
  bench.fillStyle(0x0a1126, 1); bench.fillRect(0, H - 26, W, 26);
  bench.fillStyle(0x16213f, 1); bench.fillRect(0, H - 26, W, 5);

  // ---------- foreground drifting dust / bokeh (the secret ingredient) ----------
  var nDust = opts.dust == null ? 18 : opts.dust;
  for (var d = 0; d < nDust; d++) {
    var m = scene.add.circle(
      Math.random() * W, Math.random() * H,
      1 + Math.random() * 3, 0xbfe3ff, 0.10 + Math.random() * 0.12
    ).setDepth(60);
    m.driftX = (Math.random() - 0.5) * 6;
    m.driftY = -3 - Math.random() * 6;
    dustMotes.push(m);
  }

  return {
    // call each update; gentle parallax drift on the foreground motes
    update: function (dt) {
      var s = dt / 1000;
      for (var k = 0; k < dustMotes.length; k++) {
        var m = dustMotes[k];
        m.x += m.driftX * s; m.y += m.driftY * s;
        if (m.y < -4) { m.y = H + 4; m.x = Math.random() * W; }
        if (m.x < -4) m.x = W + 4; else if (m.x > W + 4) m.x = -4;
      }
    },
    // tilt/drift hook (device tilt or pointer) shifts the foreground layer
    parallax: function (nx) {
      for (var k = 0; k < dustMotes.length; k++) dustMotes[k].x += nx * 0.4;
    },
  };
};
