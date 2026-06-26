// Headless smoke test for Element Lab: boots the game, plays the menu →
// game, drops elements to force merges, and reports console/page errors.
import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

await new Promise(r => server.listen(0, r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/index.html`;
console.log('serving', url);

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 440, height: 780 } });

const errors = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + (e.stack||e.message)));

await page.goto(url, { waitUntil: 'networkidle' });

// wait for the Menu scene to be active
async function activeScenes() {
  return await page.evaluate(() => {
    const g = window.DANNYLAB && window.DANNYLAB.game;
    if (!g) return null;
    return g.scene.getScenes(true).map(s => s.sys.settings.key);
  });
}

let scenes = null;
for (let i = 0; i < 40; i++) {
  scenes = await activeScenes();
  if (scenes && scenes.includes('DANNYLAB_Menu')) break;
  await page.waitForTimeout(150);
}
console.log('after boot, active scenes:', scenes);
await page.screenshot({ path: path.join(__dirname, 'shot-menu.png') });

// Click "Play" — it's a green button ~45% down center. Use canvas coords.
const box = await page.evaluate(() => {
  const c = document.querySelector('#dannylab-root canvas');
  const r = c.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
// game internal is 540x960 fit into the canvas; map internal->screen
function mapXY(ix, iy) {
  const scale = Math.min(box.w / 540, box.h / 960);
  const dx = box.x + (box.w - 540 * scale) / 2;
  const dy = box.y + (box.h - 960 * scale) / 2;
  return { x: dx + ix * scale, y: dy + iy * scale };
}
// Play button center ≈ (270, 432) internal
let pb = mapXY(270, 960 * 0.45);
await page.mouse.click(pb.x, pb.y);
await page.waitForTimeout(400);
scenes = await activeScenes();
console.log('after Play, active scenes:', scenes);

// Drop a bunch of elements across columns to force merges + cascades
for (let i = 0; i < 40; i++) {
  const col = 110 + (i % 5) * 80;           // internal x within beaker
  const pt = mapXY(col, 500);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(180);
}
await page.waitForTimeout(800);

const stats = await page.evaluate(() => {
  const g = window.DANNYLAB.game.scene.getScene('DANNYLAB_Game');
  if (!g) return null;
  return { score: g.score, elements: g.elements.length, combo: g.combo, gameOver: g.gameOver,
    discovered: (window.DANNYLAB.store.getDiscovered() || []) };
});
console.log('game stats:', JSON.stringify(stats));
await page.screenshot({ path: path.join(__dirname, 'shot-game.png') });

// ---- pause overlay open/close ----
let pbtn = mapXY(496, 58);   // pause button is top-right corner
await page.mouse.click(pbtn.x, pbtn.y);
await page.waitForTimeout(300);
console.log('after pause click, active scenes:', await activeScenes());
await page.screenshot({ path: path.join(__dirname, 'shot-pause.png') });
// Resume button ≈ internal (270, 390)
let rb = mapXY(270, 390);
await page.mouse.click(rb.x, rb.y);
await page.waitForTimeout(300);
console.log('after resume, active scenes:', await activeScenes());

// ---- force overflow → game over by filling the beaker deterministically ----
await page.evaluate(() => {
  const g = window.DANNYLAB.game.scene.getScene('DANNYLAB_Game');
  // 2x2-block 4-coloring so no two adjacent pieces share a tier (no merges)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 4; col++) {
      const tier = 2 + ((col % 2) + 2 * (row % 2));   // tiers 2..5, king-graph safe
      g.spawnElement(tier, 130 + col * 70, 380 + row * 56, {});
    }
  }
});
await page.waitForTimeout(3600);   // settle + let the overflow grace period elapse
const over = await page.evaluate(() => {
  const g = window.DANNYLAB.game.scene.getScene('DANNYLAB_Game');
  return { gameOver: g && g.gameOver, scenes: window.DANNYLAB.game.scene.getScenes(true).map(s => s.sys.settings.key), best: window.DANNYLAB.store.getBest() };
});
console.log('overflow result:', JSON.stringify(over));
await page.screenshot({ path: path.join(__dirname, 'shot-gameover.png') });

console.log('--- ERRORS (' + errors.length + ') ---');
errors.slice(0, 30).forEach(e => console.log(e));

await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
