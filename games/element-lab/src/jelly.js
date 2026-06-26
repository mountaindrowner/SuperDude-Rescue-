// jelly.js — procedural "jelly drop" element art (Idea 2). Generates smooth
// translucent gradient bodies (strong rim colour -> lighter centre) and a set
// of expression face frames (smile / blink / laugh / wow) that overlay any
// body. The per-element assembly + animation lives in game.js; this file only
// bakes the textures so they're cheap to reuse across ~70 live elements.
window.DANNYLAB = window.DANNYLAB || {};

// per-tier translucency — gases read glassier, metals more solid (Brief vibe)
DANNYLAB.JELLY_ALPHA = { 1: 0.80, 2: 0.82, 3: 0.95, 4: 0.84, 5: 0.86, 6: 0.90, 7: 0.97, 8: 0.97, 9: 0.86 };

function _lerpColor(a, b, t) {
  var ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  var br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  var r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

DANNYLAB.buildJellyTextures = function (scene) {
  var made = scene.textures, CONFIG = DANNYLAB.CONFIG;

  // ---------- bodies: smooth radial gradient + gloss + rim + base shadow ----------
  CONFIG.tiers.forEach(function (cfg) {
    var key = 'jelly_body_' + cfg.t;
    if (made.exists(key)) return;
    var S = 256, c = S / 2, R = 120;
    var base = cfg.color;
    var rim = DANNYLAB.shade(base, -0.16);     // strong colour at the rim
    var light = DANNYLAB.shade(base, 0.46);    // lighter toward the centre
    var g = scene.add.graphics();

    // radial gradient (fine steps so there's no banding)
    for (var i = R; i >= 0; i--) {
      var tt = i / R;                          // 1 at rim, 0 at centre
      g.fillStyle(_lerpColor(light, rim, tt), 1);
      g.fillCircle(c, c, i);
    }
    // soft inner shadow low + right for volume
    g.fillStyle(DANNYLAB.shade(base, -0.34), 0.30); g.fillEllipse(c + R * 0.12, c + R * 0.34, R * 1.5, R * 1.15);
    // re-light the centre a touch (kawaii soft core)
    g.fillStyle(light, 0.22); g.fillCircle(c - R * 0.06, c - R * 0.08, R * 0.5);
    // glossy top-left highlight
    g.fillStyle(0xffffff, 0.45); g.fillEllipse(c - R * 0.34, c - R * 0.42, R * 0.5, R * 0.32);
    g.fillStyle(0xffffff, 0.85); g.fillEllipse(c - R * 0.36, c - R * 0.48, R * 0.2, R * 0.12);
    // crisp rim light
    g.lineStyle(3, 0xffffff, 0.22); g.strokeCircle(c, c, R - 1);

    g.generateTexture(key, S, S);
    g.destroy();
  });

  // ---------- face frames (dark features + white on transparent) ----------
  function face(key, mood) {
    if (made.exists(key)) return;
    var S = 128, c = S / 2, g = scene.add.graphics();
    var INK = 0x1d2a3a;
    var ex = 24, ey = c - 4, eR = 13;          // eye spacing / position / radius

    function eyesOpen(big) {
      var r = big ? eR + 2 : eR;
      g.fillStyle(0xffffff, 1);
      g.fillCircle(c - ex, ey, r); g.fillCircle(c + ex, ey, r);
      g.fillStyle(INK, 1);
      g.fillCircle(c - ex + 1, ey + 2, r * 0.55); g.fillCircle(c + ex + 1, ey + 2, r * 0.55);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(c - ex - r * 0.25, ey - r * 0.2, r * 0.22); g.fillCircle(c + ex - r * 0.25, ey - r * 0.2, r * 0.22);
    }
    function blush() {
      g.fillStyle(0xff8fa3, 0.4);
      g.fillEllipse(c - ex - 6, ey + 18, 16, 10); g.fillEllipse(c + ex + 6, ey + 18, 16, 10);
    }

    if (mood === 'smile') {
      eyesOpen(false); blush();
      g.lineStyle(5, INK, 1); g.beginPath(); g.arc(c, ey + 12, 16, 0.18 * Math.PI, 0.82 * Math.PI, false); g.strokePath();
    } else if (mood === 'blink') {
      blush();
      g.lineStyle(5, INK, 1);
      g.beginPath(); g.arc(c - ex, ey + 3, eR, 1.15 * Math.PI, 1.85 * Math.PI, false); g.strokePath();
      g.beginPath(); g.arc(c + ex, ey + 3, eR, 1.15 * Math.PI, 1.85 * Math.PI, false); g.strokePath();
      g.lineStyle(5, INK, 1); g.beginPath(); g.arc(c, ey + 12, 15, 0.2 * Math.PI, 0.8 * Math.PI, false); g.strokePath();
    } else if (mood === 'laugh') {
      blush();
      // happy upturned eyes ^ ^
      g.lineStyle(5, INK, 1);
      g.beginPath(); g.arc(c - ex, ey + 6, eR, 1.15 * Math.PI, 1.85 * Math.PI, false); g.strokePath();
      g.beginPath(); g.arc(c + ex, ey + 6, eR, 1.15 * Math.PI, 1.85 * Math.PI, false); g.strokePath();
      // big open laughing mouth
      g.fillStyle(INK, 1); g.slice(c, ey + 16, 17, 0.05 * Math.PI, 0.95 * Math.PI, false); g.fillPath();
      g.fillStyle(0xff8fa3, 1); g.fillEllipse(c, ey + 26, 16, 7);
    } else { // wow
      eyesOpen(true); blush();
      g.fillStyle(INK, 1); g.fillEllipse(c, ey + 20, 16, 20);
      g.fillStyle(0xff8fa3, 1); g.fillEllipse(c, ey + 26, 9, 8);
    }
    g.generateTexture(key, S, S);
    g.destroy();
  }
  face('jelly_face_smile', 'smile');
  face('jelly_face_blink', 'blink');
  face('jelly_face_laugh', 'laugh');
  face('jelly_face_wow', 'wow');

  // ---------- internal bubble (soft light dot) ----------
  if (!made.exists('jelly_bub')) {
    var b = scene.add.graphics();
    b.fillStyle(0xffffff, 0.5); b.fillCircle(10, 10, 8);
    b.fillStyle(0xffffff, 0.9); b.fillCircle(7, 7, 3);
    b.generateTexture('jelly_bub', 20, 20); b.destroy();
  }
};

// is the jelly skin available + selected?
DANNYLAB.useJelly = function (scene) {
  return DANNYLAB.SKIN === 'jelly' && scene.textures.exists('jelly_body_1');
};
