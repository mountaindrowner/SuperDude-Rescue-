// jelly.js — procedural "jelly drop" element art (Idea 2). Generates smooth
// translucent gradient bodies (strong rim colour -> lighter centre) and a set
// of expression face frames (smile / blink / laugh / wow) that overlay any
// body. The per-element assembly + animation lives in game.js; this file only
// bakes the textures so they're cheap to reuse across ~70 live elements.
window.DANNYLAB = window.DANNYLAB || {};

// per-tier translucency — gases read glassier, metals more solid (Brief vibe)
DANNYLAB.JELLY_ALPHA = { 1: 0.80, 2: 0.82, 3: 0.95, 4: 0.84, 5: 0.86, 6: 0.90, 7: 0.97, 8: 0.97, 9: 0.86 };

// per-tier internal effect — each element is alive inside in its OWN way.
DANNYLAB.JELLY_FX = {
  1: { type: 'sparks',  n: 4, tint: 0xeaf6ff },                          // H  electric sparks zipping
  2: { type: 'bubbles', n: 2, speed: 0.62, size: 1.35, tint: 0xffffff }, // He slow balloon bubbles
  3: { type: 'glint',   tint: 0xdfeaff },                                // C  diamond glints
  4: { type: 'bubbles', n: 3, speed: 1.1,  size: 1.0,  tint: 0xddfff8, sway: true }, // O bubble stream + swirl
  5: { type: 'flicker', n: 2, speed: 1.0,  size: 1.0,  tint: 0xffd0ef }, // Ne neon flicker/pulse
  6: { type: 'bubbles', n: 6, speed: 2.0,  size: 0.55, tint: 0xffffff }, // Na rapid soda fizz
  7: { type: 'sweep',   tint: 0xeef3fb, fleck: true },                   // Fe metallic shine sweep + rust
  8: { type: 'sweep',   tint: 0xfff0b0, sparkle: true },                 // Au gold sparkles + shine
  9: { type: 'motes',   n: 3, tint: 0xc8ffb0 },                          // U  orbiting radioactive motes
};

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
  // each element gets its OWN personality: a "rest" face, a matching "blink",
  // and an "alt" (the big expression used on merge-birth + the occasional
  // giggle). Specs below; drawFace renders any (eyes, mouth) combo.
  var FACE = {
    1: { eyes: 'wide',       mouth: 'ohh',    blush: true,  alt: { eyes: 'star',       mouth: 'grin' } }, // H  curious-excitable
    2: { eyes: 'happy',      mouth: 'smile',  blush: true,  alt: { eyes: 'happy',      mouth: 'grin' } }, // He cheerful
    3: { eyes: 'cool',       mouth: 'smirk',  blush: false, alt: { eyes: 'cool',       mouth: 'smile' } }, // C  chill
    4: { eyes: 'round',      mouth: 'grin',   blush: true,  alt: { eyes: 'round',      mouth: 'open' } },  // O  bright
    5: { eyes: 'star',       mouth: 'grin',   blush: true,  spark: true, alt: { eyes: 'star',  mouth: 'open' } }, // Ne hyper
    6: { eyes: 'wink',       mouth: 'tongue', blush: true,  alt: { eyes: 'wink',       mouth: 'grin' } }, // Na mischievous
    7: { eyes: 'determined', mouth: 'smile',  blush: false, alt: { eyes: 'determined', mouth: 'grin' } }, // Fe tough
    8: { eyes: 'star',       mouth: 'smirk',  blush: true,  spark: true, alt: { eyes: 'star',  mouth: 'grin' } }, // Au smug-fancy
    9: { eyes: 'wide',       mouth: 'open',   blush: true,  spark: true, alt: { eyes: 'wide',  mouth: 'open' } }, // U  awe
  };

  function drawFace(key, eyes, mouth, opts) {
    if (made.exists(key)) return;
    var S = 128, c = S / 2, g = scene.add.graphics();
    var INK = 0x1d2a3a, ex = 24, ey = c - 4, my = ey + 16, PINK = 0xff8fa3, TONGUE = 0xff6b8b;

    if (opts.blush) {
      g.fillStyle(PINK, 0.4);
      g.fillEllipse(c - ex - 6, ey + 16, 16, 10); g.fillEllipse(c + ex + 6, ey + 16, 16, 10);
    }

    function star(x, y, s) {
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(x, y - s, x - s * 0.32, y, x + s * 0.32, y);
      g.fillTriangle(x, y + s, x - s * 0.32, y, x + s * 0.32, y);
      g.fillTriangle(x - s, y, x, y - s * 0.32, x, y + s * 0.32);
      g.fillTriangle(x + s, y, x, y - s * 0.32, x, y + s * 0.32);
    }
    function roundEye(x, r) {
      g.fillStyle(0xffffff, 1); g.fillCircle(x, ey, r);
      g.fillStyle(INK, 1); g.fillCircle(x + 1, ey + 2, r * 0.55);
      g.fillStyle(0xffffff, 0.95); g.fillCircle(x - r * 0.25, ey - r * 0.2, r * 0.22);
    }
    function happyArc(x) { g.lineStyle(5, INK, 1); g.beginPath(); g.arc(x, ey + 3, 13, 1.15 * Math.PI, 1.85 * Math.PI, false); g.strokePath(); }
    function closedArc(x) { g.lineStyle(5, INK, 1); g.beginPath(); g.arc(x, ey, 12, 0.15 * Math.PI, 0.85 * Math.PI, false); g.strokePath(); }

    if (eyes === 'closed') { closedArc(c - ex); closedArc(c + ex); }
    else if (eyes === 'happy') { happyArc(c - ex); happyArc(c + ex); }
    else if (eyes === 'star') { g.fillStyle(INK, 1); g.fillCircle(c - ex, ey, 6); g.fillCircle(c + ex, ey, 6); star(c - ex, ey, 11); star(c + ex, ey, 11); }
    else if (eyes === 'wide') { roundEye(c - ex, 15); roundEye(c + ex, 15); }
    else if (eyes === 'round') { roundEye(c - ex, 12); roundEye(c + ex, 12); }
    else if (eyes === 'wink') { roundEye(c - ex, 12); happyArc(c + ex); }
    else if (eyes === 'cool') {
      roundEye(c - ex, 11); roundEye(c + ex, 11);
      g.lineStyle(7, INK, 1); g.lineBetween(c - ex - 12, ey - 4, c - ex + 12, ey - 4); g.lineBetween(c + ex - 12, ey - 4, c + ex + 12, ey - 4);
    } else if (eyes === 'determined') {
      roundEye(c - ex, 11); roundEye(c + ex, 11);
      g.lineStyle(5, INK, 1); g.lineBetween(c - ex - 12, ey - 16, c - ex + 10, ey - 9); g.lineBetween(c + ex + 12, ey - 16, c + ex - 10, ey - 9);
    }

    g.lineStyle(5, INK, 1);
    if (mouth === 'smile') { g.beginPath(); g.arc(c, my - 4, 15, 0.18 * Math.PI, 0.82 * Math.PI, false); g.strokePath(); }
    else if (mouth === 'grin') { g.fillStyle(INK, 1); g.slice(c, my - 4, 17, 0.05 * Math.PI, 0.95 * Math.PI, false); g.fillPath(); g.fillStyle(TONGUE, 1); g.fillEllipse(c, my + 6, 15, 6); }
    else if (mouth === 'open') { g.fillStyle(INK, 1); g.fillEllipse(c, my + 2, 15, 19); g.fillStyle(TONGUE, 1); g.fillEllipse(c, my + 9, 8, 7); }
    else if (mouth === 'ohh') { g.fillStyle(INK, 1); g.fillCircle(c, my, 8); }
    else if (mouth === 'smirk') { g.beginPath(); g.arc(c + 3, my - 6, 12, 0.08 * Math.PI, 0.55 * Math.PI, false); g.strokePath(); }
    else if (mouth === 'tongue') { g.beginPath(); g.arc(c, my - 4, 14, 0.15 * Math.PI, 0.85 * Math.PI, false); g.strokePath(); g.fillStyle(TONGUE, 1); g.fillEllipse(c + 6, my + 7, 9, 7); }

    if (opts.spark) { g.fillStyle(0xffffff, 0.9); star(c + 24, ey - 18, 5); star(c - 26, my + 2, 4); }

    g.generateTexture(key, S, S);
    g.destroy();
  }

  for (var t = 1; t <= 9; t++) {
    var sp = FACE[t];
    drawFace('jelly_face_' + t + '_rest', sp.eyes, sp.mouth, sp);
    drawFace('jelly_face_' + t + '_blink', 'closed', sp.mouth, sp);
    drawFace('jelly_face_' + t + '_alt', sp.alt.eyes, sp.alt.mouth, sp);
  }

  // ---------- internal bubble (soft light dot) ----------
  if (!made.exists('jelly_bub')) {
    var b = scene.add.graphics();
    b.fillStyle(0xffffff, 0.5); b.fillCircle(10, 10, 8);
    b.fillStyle(0xffffff, 0.9); b.fillCircle(7, 7, 3);
    b.generateTexture('jelly_bub', 20, 20); b.destroy();
  }
  // ---------- internal sparkle star (glints / sparkles) ----------
  if (!made.exists('jelly_star')) {
    var s = scene.add.graphics(), m = 16, sz = 14;
    s.fillStyle(0xffffff, 1);
    s.fillTriangle(m, m - sz, m - sz * 0.3, m, m + sz * 0.3, m);
    s.fillTriangle(m, m + sz, m - sz * 0.3, m, m + sz * 0.3, m);
    s.fillTriangle(m - sz, m, m, m - sz * 0.3, m, m + sz * 0.3);
    s.fillTriangle(m + sz, m, m, m - sz * 0.3, m, m + sz * 0.3);
    s.fillCircle(m, m, 3);
    s.generateTexture('jelly_star', 32, 32); s.destroy();
  }
};

// is the jelly skin available + selected?
DANNYLAB.useJelly = function (scene) {
  return DANNYLAB.SKIN === 'jelly' && scene.textures.exists('jelly_body_1');
};
