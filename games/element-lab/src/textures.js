// textures.js — procedurally generates every sprite at preload time
// (Brief §13 placeholder path: bright colored balls + kawaii faces). No
// binary art assets; everything is drawn with Phaser Graphics so the chain
// can be reskinned purely from CONFIG.tiers.
window.DANNYLAB = window.DANNYLAB || {};

// ---- small color helpers (operate on 0xRRGGBB ints) ----
function _clamp8(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }
DANNYLAB.shade = function (color, pct) {
  var r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
  r = _clamp8(r + 255 * pct); g = _clamp8(g + 255 * pct); b = _clamp8(b + 255 * pct);
  return (r << 16) | (g << 8) | b;
};

DANNYLAB.buildTextures = function (scene) {
  var CONFIG = DANNYLAB.CONFIG;
  var made = scene.textures;

  // ---------- shared soft radial glow (white; tinted per element) ----------
  if (!made.exists('el_glow')) {
    var G = 128, gg = scene.add.graphics();
    for (var i = 30; i >= 0; i--) {
      var rr = (G / 2) * (i / 30);
      gg.fillStyle(0xffffff, 0.05);
      gg.fillCircle(G / 2, G / 2, rr);
    }
    gg.generateTexture('el_glow', G, G);
    gg.destroy();
  }

  // ---------- shared soft drop shadow ----------
  if (!made.exists('el_shadow')) {
    var S = 128, sg = scene.add.graphics();
    for (var j = 24; j >= 0; j--) {
      sg.fillStyle(0x0a1430, 0.06);
      sg.fillEllipse(S / 2, S / 2, S * (j / 24), S * 0.55 * (j / 24));
    }
    sg.generateTexture('el_shadow', S, S);
    sg.destroy();
  }

  // ---------- one ball texture per tier (shaded sphere + kawaii face) ----------
  CONFIG.tiers.forEach(function (cfg) {
    var key = 'el_ball_' + cfg.t;
    if (made.exists(key)) return;
    var r = cfg.radius;
    var pad = Math.ceil(r * 0.12) + 2;     // room for rim light
    var size = (r + pad) * 2;
    var c = r + pad;                        // center
    var g = scene.add.graphics();

    // body shading
    g.fillStyle(DANNYLAB.shade(cfg.color, -0.18), 1); g.fillCircle(c, c, r);            // rim/shade
    g.fillStyle(cfg.color, 1);                          g.fillCircle(c, c, r * 0.94);   // body
    g.fillStyle(DANNYLAB.shade(cfg.color, 0.22), 0.9);  g.fillCircle(c - r * 0.28, c - r * 0.30, r * 0.55); // upper light
    g.fillStyle(0xffffff, 0.30);                        g.fillCircle(c - r * 0.34, c - r * 0.38, r * 0.22);  // hotspot
    g.lineStyle(Math.max(1.5, r * 0.04), 0xffffff, 0.28); g.strokeCircle(c, c, r * 0.92); // rim light

    // ---- kawaii face ----
    var eyeY = c - r * 0.05, eyeDX = r * 0.34, eyeR = r * 0.16;
    var pupR = eyeR * 0.55;
    // eyes (white) + pupils
    g.fillStyle(0xffffff, 1);
    g.fillCircle(c - eyeDX, eyeY, eyeR);
    g.fillCircle(c + eyeDX, eyeY, eyeR);
    g.fillStyle(0x213040, 1);
    var look = (cfg.mood === 'cool') ? eyeR * 0.18 : 0;
    g.fillCircle(c - eyeDX + look, eyeY + eyeR * 0.18, pupR);
    g.fillCircle(c + eyeDX + look, eyeY + eyeR * 0.18, pupR);
    // eye sparkle
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(c - eyeDX + pupR * 0.4, eyeY, pupR * 0.4);
    g.fillCircle(c + eyeDX + pupR * 0.4, eyeY, pupR * 0.4);

    // cheek blush
    g.fillStyle(0xff8fa3, 0.35);
    g.fillCircle(c - r * 0.52, c + r * 0.30, r * 0.16);
    g.fillCircle(c + r * 0.52, c + r * 0.30, r * 0.16);

    // mouth by mood
    var my = c + r * 0.34;
    g.lineStyle(Math.max(2, r * 0.06), 0x213040, 0.95);
    if (cfg.mood === 'wow' || cfg.mood === 'glow') {
      g.fillStyle(0x6b2230, 0.95); g.fillCircle(c, my, r * 0.16);          // open "WHOA" mouth
      g.fillStyle(0xff8fa3, 0.9);  g.fillCircle(c, my + r * 0.06, r * 0.08); // tongue
    } else if (cfg.mood === 'cool') {
      g.beginPath(); g.moveTo(c - r * 0.2, my); g.lineTo(c + r * 0.2, my); g.strokePath(); // calm line
    } else { // happy / spark — smile arc
      g.beginPath(); g.arc(c, my - r * 0.12, r * 0.26, 0.15 * Math.PI, 0.85 * Math.PI, false); g.strokePath();
    }

    g.generateTexture(key, size, size);
    g.destroy();
  });

  // ---------- particle dabs (tinted at emit time) ----------
  if (!made.exists('p_dot')) {
    var pd = scene.add.graphics();
    pd.fillStyle(0xffffff, 1); pd.fillCircle(8, 8, 7);
    pd.generateTexture('p_dot', 16, 16); pd.destroy();
  }
  if (!made.exists('p_spark')) {
    var ps = scene.add.graphics();
    ps.fillStyle(0xffffff, 1);
    // 4-point sparkle
    ps.fillTriangle(16, 0, 13, 16, 19, 16);
    ps.fillTriangle(16, 32, 13, 16, 19, 16);
    ps.fillTriangle(0, 16, 16, 13, 16, 19);
    ps.fillTriangle(32, 16, 16, 13, 16, 19);
    ps.fillCircle(16, 16, 4);
    ps.generateTexture('p_spark', 32, 32); ps.destroy();
  }
  if (!made.exists('p_ring')) {
    var pr = scene.add.graphics();
    pr.lineStyle(3, 0xffffff, 1); pr.strokeCircle(16, 16, 13);
    pr.generateTexture('p_ring', 32, 32); pr.destroy();
  }
  if (!made.exists('p_bubble')) {
    var pb = scene.add.graphics();
    pb.lineStyle(2, 0xffffff, 0.9); pb.strokeCircle(8, 8, 6);
    pb.fillStyle(0xffffff, 0.25); pb.fillCircle(6, 6, 2);
    pb.generateTexture('p_bubble', 16, 16); pb.destroy();
  }
};
