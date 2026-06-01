// Generate Super Dude Danny app icons.
// Design: circular badge, deep navy gradient background with subtle
// starfield, 12 sunburst rays radiating from the center, large bold
// stylized "SD" monogram in beveled italic hero font (same style as
// the AW emblem we did earlier), cyan ring border, golden flares on
// the letter apexes. The 512 + 192 variants include a small wordmark
// strip at the bottom; the maskable variant omits the wordmark and
// pads the safe-zone heavily.

const { createCanvas } = require('/tmp/node_modules/canvas');
const fs = require('fs');
const path = require('path');

function render(size, opts) {
  opts = opts || {};
  const c = createCanvas(size, size);
  const g = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  // Outer mask: square fill black so PWA can render any shape.
  g.fillStyle = '#0a1424';
  g.fillRect(0, 0, size, size);

  // Maskable variant uses the full square area with a subtle gradient.
  // Non-maskable uses a clipped circular badge.
  if (!opts.maskable) {
    g.save();
    g.beginPath();
    g.arc(cx, cy, r + size * 0.03, 0, Math.PI * 2);
    g.closePath();
    g.clip();
  }

  // Background gradient inside the badge.
  const bg = g.createRadialGradient(cx, cy * 0.95, size * 0.05, cx, cy, r);
  bg.addColorStop(0, '#1a3a78');
  bg.addColorStop(0.55, '#0e1f44');
  bg.addColorStop(1, '#040814');
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);

  // Starfield - small white dots scattered. Deterministic via simple LCG.
  let seed = 1337;
  function rng() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xFFFFFFFF; }
  const stars = Math.floor(size * 0.32);
  for (let i = 0; i < stars; i++) {
    const sx = rng() * size;
    const sy = rng() * size;
    const dx = sx - cx, dy = sy - cy;
    if (!opts.maskable && Math.sqrt(dx * dx + dy * dy) > r * 1.02) continue;
    const a = 0.30 + rng() * 0.55;
    const ss = (rng() < 0.85) ? 1 : 2;
    g.fillStyle = `rgba(${190 + Math.floor(rng() * 65)}, ${220 + Math.floor(rng() * 35)}, 255, ${a.toFixed(2)})`;
    g.fillRect(sx | 0, sy | 0, ss, ss);
  }

  // Sunburst rays (12), gold semi-transparent.
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const ang = (i / rays) * Math.PI * 2 + (i % 2 === 0 ? 0 : Math.PI / rays * 0.18);
    g.save();
    g.translate(cx, cy);
    g.rotate(ang);
    const len = r * (0.95 + (i % 3) * 0.04);
    const w = size * (i % 2 === 0 ? 0.028 : 0.014);
    const grd = g.createLinearGradient(0, 0, len, 0);
    grd.addColorStop(0, 'rgba(255, 220, 110, 0.00)');
    grd.addColorStop(0.30, 'rgba(255, 220, 110, 0.38)');
    grd.addColorStop(0.85, 'rgba(255, 240, 180, 0.55)');
    grd.addColorStop(1, 'rgba(255, 255, 220, 0.05)');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, -w / 2);
    g.lineTo(len, -w / 4);
    g.lineTo(len, w / 4);
    g.lineTo(0, w / 2);
    g.closePath();
    g.fill();
    g.restore();
  }

  // Inner aura (warm halo behind the monogram).
  const aura = g.createRadialGradient(cx, cy + size * 0.02, size * 0.02, cx, cy + size * 0.02, size * 0.28);
  aura.addColorStop(0, 'rgba(255, 220, 120, 0.40)');
  aura.addColorStop(0.5, 'rgba(255, 180, 80, 0.18)');
  aura.addColorStop(1, 'rgba(255, 180, 80, 0)');
  g.fillStyle = aura;
  g.fillRect(0, 0, size, size);

  // ===== "SD" MONOGRAM - beveled italic hero font =====
  // Use the system bold + a shear transform for the italic slant; layer
  // a dark underlay stroke for the bevel + a bright fill on top + warm
  // apex flares.
  const fontPx = Math.floor(size * 0.55);
  const fontSpec = `900 ${fontPx}px "Impact", "Arial Black", "Helvetica", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // Italic shear (forward-leaning by ~12 degrees).
  const slant = -Math.tan(12 * Math.PI / 180);
  const txt = 'SD';

  function paintText(fill, stroke, strokeWidth, yShift) {
    g.save();
    g.translate(cx + (yShift || 0), cy + size * 0.018);
    g.transform(1, 0, slant, 1, 0, 0);
    g.font = fontSpec;
    if (stroke) {
      g.lineWidth = strokeWidth;
      g.strokeStyle = stroke;
      g.lineJoin = 'round';
      g.miterLimit = 2;
      g.strokeText(txt, 0, 0);
    }
    if (fill) {
      g.fillStyle = fill;
      g.fillText(txt, 0, 0);
    }
    g.restore();
  }

  // Drop shadow (warm orange, soft).
  g.save();
  g.shadowColor = 'rgba(255, 140, 40, 0.55)';
  g.shadowBlur = size * 0.045;
  g.shadowOffsetY = size * 0.012;
  paintText(null, '#06080e', Math.max(4, size * 0.045));
  g.restore();

  // Dark under-stroke for bevel depth.
  paintText(null, '#06080e', Math.max(3, size * 0.038));

  // Bright text fill: pale cyan → white gradient + warm highlight on top.
  const lg = g.createLinearGradient(0, cy - fontPx * 0.45, 0, cy + fontPx * 0.45);
  lg.addColorStop(0, '#ffffff');
  lg.addColorStop(0.5, '#cfeaff');
  lg.addColorStop(1, '#7bbfff');
  paintText(lg, null);

  // Apex flares (small bright dots at the top of each letter for sparkle).
  // Placement is approximate; the goal is "glints", not precision.
  const flareSpots = [
    { x: cx - size * 0.16, y: cy - size * 0.16 },
    { x: cx + size * 0.05, y: cy - size * 0.18 }
  ];
  for (const s of flareSpots) {
    const fg2 = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, size * 0.04);
    fg2.addColorStop(0, 'rgba(255, 255, 200, 0.95)');
    fg2.addColorStop(1, 'rgba(255, 255, 200, 0)');
    g.fillStyle = fg2;
    g.fillRect(s.x - size * 0.05, s.y - size * 0.05, size * 0.1, size * 0.1);
  }

  // Ring border in cyan (only on non-maskable; maskable needs clear safe zone).
  if (!opts.maskable) {
    g.lineWidth = Math.max(2, size * 0.015);
    g.strokeStyle = '#5af0ff';
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
    // Inner dark ring just inside.
    g.lineWidth = Math.max(1, size * 0.005);
    g.strokeStyle = 'rgba(10, 20, 40, 0.85)';
    g.beginPath();
    g.arc(cx, cy, r - Math.max(2, size * 0.012), 0, Math.PI * 2);
    g.stroke();
    // Ring inner highlight (top arc, white-ish).
    g.lineWidth = Math.max(1, size * 0.006);
    g.strokeStyle = 'rgba(200, 240, 255, 0.85)';
    g.beginPath();
    g.arc(cx, cy, r, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
  }

  // Wordmark strip near the bottom (omitted on maskable).
  if (!opts.maskable && opts.wordmark !== false) {
    const txtY = cy + r * 0.78;
    const txtH = size * 0.10;
    const txtW = r * 1.42;
    // Dark band background.
    g.fillStyle = 'rgba(8, 12, 28, 0.85)';
    g.fillRect(cx - txtW / 2, txtY - txtH / 2, txtW, txtH);
    g.lineWidth = Math.max(1, size * 0.004);
    g.strokeStyle = '#5af0ff';
    g.strokeRect(cx - txtW / 2, txtY - txtH / 2, txtW, txtH);
    // Wordmark text.
    g.font = `900 ${Math.floor(size * 0.055)}px "Arial Black", "Helvetica", sans-serif`;
    g.fillStyle = '#ffd23a';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('SUPER DUDE DANNY', cx, txtY);
  }

  if (!opts.maskable) g.restore();
  return c;
}

function save(canvas, file) {
  const out = canvas.toBuffer('image/png');
  fs.writeFileSync(file, out);
  console.log('wrote', file, '(' + out.length + ' bytes)');
}

const outDir = '/home/user/SuperDude-Rescue-/assets';
save(render(512, {}),                          path.join(outDir, 'icon-512.png'));
save(render(192, {}),                          path.join(outDir, 'icon-192.png'));
save(render(180, {}),                          path.join(outDir, 'apple-touch-icon.png'));
save(render(512, { maskable: true }),          path.join(outDir, 'icon-512-maskable.png'));
console.log('done.');
