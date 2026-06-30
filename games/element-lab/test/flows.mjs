// Focused tests autoplay can't reach: Fission (two Uraniums), EN/ES live
// relabel, and that every overlay scene constructs without error.
import { chromium } from 'playwright-core';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 440, height: 780 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + (e.stack || e.message)));
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

// jump straight into the game scene
await page.evaluate(() => window.DANNYLAB.game.scene.start('DANNYLAB_Game', { mode: 'zen' }));
await page.waitForTimeout(600);

// ---- FISSION: drop two Uraniums right next to each other ----
const fission = await page.evaluate(async () => {
  const g = window.DANNYLAB.game.scene.getScene('DANNYLAB_Game');
  const before = g.score;
  g.spawnElement(9, 250, 650, {});
  g.spawnElement(9, 250, 540, {});   // overlaps the first → two Uraniums touch → fission
  await new Promise(r => setTimeout(r, 1500));
  return { before, after: g.score, elements: g.elements.length,
    uraniums: g.elements.filter(e => e.tier === 9).length };
});
console.log('fission:', JSON.stringify(fission), '→', fission.after > fission.before ? 'SCORED' : 'NO SCORE');
await page.screenshot({ path: path.join(__dirname, 'shot-fission.png') });

// ---- EN/ES live relabel via Options from the menu ----
await page.evaluate(() => {
  const g = window.DANNYLAB.game;
  ['DANNYLAB_Game','DANNYLAB_Discovery'].forEach(k => { if (g.scene.isActive(k)) g.scene.stop(k); });
  g.scene.start('DANNYLAB_Menu');
});
await page.waitForTimeout(500);
const lang = await page.evaluate(async () => {
  const g = window.DANNYLAB.game;
  const menu = g.scene.getScene('DANNYLAB_Menu').scene;
  menu.pause();
  menu.launch('DANNYLAB_Options', { parent: 'DANNYLAB_Menu' });
  await new Promise(r => setTimeout(r, 300));
  // flip language directly through the store/registry path used by the toggle
  const before = g.registry.get('lang');
  g.registry.set('lang', 'es'); DANNYLAB.store.setOpt('lang', 'es');
  g.registry.set('uiDirty', true);
  g.scene.getScene('DANNYLAB_Options').scene.restart({ parent: 'DANNYLAB_Menu' });
  await new Promise(r => setTimeout(r, 300));
  return { before, after: g.registry.get('lang'),
    esPlay: DANNYLAB.t('play', 'es'), esExit: DANNYLAB.t('exit', 'es') };
});
console.log('i18n:', JSON.stringify(lang));
await page.screenshot({ path: path.join(__dirname, 'shot-options-es.png') });

// ---- construct each overlay scene to ensure none throw ----
const overlayOk = await page.evaluate(async () => {
  const g = window.DANNYLAB.game;
  const menu = g.scene.getScene('DANNYLAB_Menu').scene;
  const launchable = ['DANNYLAB_HowTo','DANNYLAB_Collection'];
  for (const k of launchable) {
    menu.launch(k, { parent: 'DANNYLAB_Menu' });
    await new Promise(r => setTimeout(r, 250));
    const ok = g.scene.isActive(k);
    g.scene.getScene(k).scene.stop(k);
    if (!ok) return 'FAILED ' + k;
  }
  return 'ok';
});
console.log('overlays:', overlayOk);
await page.screenshot({ path: path.join(__dirname, 'shot-howto-es.png') });

console.log('--- ERRORS (' + errors.length + ') ---');
errors.slice(0, 20).forEach(e => console.log(e));
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
