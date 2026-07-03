// Completability harness for the Element Lab: boots the real game headless
// and lets a greedy bot play full Endless runs, measuring how often the
// element chain can actually be completed (Uranium created) before overflow.
//
//   node test/completability.mjs                 # 100 games, 4 parallel pages
//   GAMES=8 PAGES=2 node test/completability.mjs # quick pilot
//
// The bot plays like a fast, competent human: it aims the current piece at
// an exposed same-tier element (deepest first), otherwise at the lowest
// column; mystery samples are dropped on the highest-tier element (effects
// key off the first element touched). Physics, overflow grace, weights and
// mystery cadence are all stock — only the drop cooldown is shortened so a
// run doesn't take 8 real minutes (cadence is still throttled to ~300 ms,
// about as fast as a human speed-player).
import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' };

const GAMES = parseInt(process.env.GAMES || '100', 10);
const PAGES = parseInt(process.env.PAGES || '4', 10);
const CAP_DROPS = 900;          // safety cap per game (never hit in practice)
const CAP_MS = 8 * 60 * 1000;   // per-game wall clock cap
const COOLDOWN_MS = 200;        // shipped: 450 — shortened for throughput only
const MIN_GAP_MS = 300;         // bot won't drop faster than this anyway

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await chromium.launch({
  executablePath: EXE,
  args: [
    '--no-sandbox', '--mute-audio',
    // keep every page's rAF running at full speed even when not focused
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],
});

// ---- the bot, installed into each page ----
function installBot(opts) {
  const D = window.DANNYLAB;
  const B = window.__bot = { target: opts.target, results: [], cur: null, done: false, err: null };
  D.CONFIG.dropCooldownMs = opts.cooldownMs;   // throughput only; physics stock
  const mgr = () => D.game.scene;
  const gameScene = () => {
    const s = mgr().getScene('DANNYLAB_Game');
    return s && s.scene.isActive() ? s : null;
  };

  function startRun() {
    const m = mgr();
    ['DANNYLAB_GameOver', 'DANNYLAB_Pause', 'DANNYLAB_Loading', 'DANNYLAB_HowTo',
     'DANNYLAB_Options', 'DANNYLAB_Collection', 'DANNYLAB_Menu', 'DANNYLAB_Game'].forEach(k => {
      try { const s = m.getScene(k); if (s && (s.scene.isActive() || s.scene.isPaused())) m.stop(k); } catch (e) { /* scene not present */ }
    });
    m.start('DANNYLAB_Game', { mode: 'endless' });
    B.cur = { drops: 0, t0: performance.now(), maxTier: 0, lastDrop: 0 };
  }

  function finish(sc, result) {
    const c = B.cur;
    B.results.push({
      result, drops: c.drops, maxTier: c.maxTier,
      score: sc ? sc.score : 0, ms: Math.round(performance.now() - c.t0),
    });
    B.cur = null;
    if (B.results.length >= B.target) { B.done = true; clearInterval(B.timer); return; }
    startRun();
  }

  // pick the drop column for the piece in the tweezers
  function chooseX(sc, els) {
    const G = D.GEO;
    const exposed = (e) => !els.some(o => o !== e && !o.consumed &&
      Math.abs(o.x - e.x) < (o.radius + e.radius) * 0.7 && o.y < e.y - e.radius * 0.6);
    if (sc.nextIsMystery) {   // effects key off the first element touched — feed it the biggest
      let top = null;
      for (const e of els) if (e.tier >= 1 && exposed(e) && (!top || e.tier > top.tier)) top = e;
      return top ? top.x : (G.bx0 + G.bx1) / 2;
    }
    const t = sc.nextTier;
    const same = els.filter(e => e.tier === t && exposed(e)).sort((a, b) => b.y - a.y);
    if (same.length) return same[0].x;
    // no reachable twin: keep the pile flat — drop where the surface is lowest
    let bestX = (G.bx0 + G.bx1) / 2, bestY = -1;
    const r = sc.nextRadius();
    for (let cx = G.bx0 + r + 4; cx <= G.bx1 - r - 4; cx += 20) {
      let topY = G.floorTop;
      for (const e of els) if (Math.abs(e.x - cx) < e.radius + r * 0.5) topY = Math.min(topY, e.y - e.radius);
      if (topY > bestY) { bestY = topY; bestX = cx; }
    }
    return bestX;
  }

  function step() {
    try {
      if (B.done) return;
      if (!B.cur) { startRun(); return; }
      const sc = gameScene();
      const c = B.cur;
      if (!sc) {   // scene mid-transition (or gameOver overlay took it over)
        const m = mgr(), s = m.getScene('DANNYLAB_Game');
        if (s && s.scene.isPaused() && s.gameOver) finish(s, 'loss');
        return;
      }
      // track progress + terminal states
      const els = sc.elements.filter(e => e.active && e.body && !e.consumed);
      for (const e of els) if (e.tier > c.maxTier) c.maxTier = e.tier;
      if (sc.runDiscovered && sc.runDiscovered['U']) { finish(sc, 'win'); return; }
      if (sc.gameOver) { finish(sc, 'loss'); return; }
      if (c.drops >= opts.capDrops || performance.now() - c.t0 > opts.capMs) { finish(sc, 'cap'); return; }
      // auto-pause fired (headless visibility blip)? resume and carry on
      if (sc.paused) {
        try { mgr().stop('DANNYLAB_Pause'); sc.scene.resume(); sc.resumeFromOverlay(); } catch (e) { /* retry next tick */ }
        return;
      }
      if (sc.dropCooling || sc.aiming) return;
      const now = performance.now();
      if (now - c.lastDrop < opts.minGapMs) return;
      // wait for the previous piece to arrive before committing the next
      const inFlight = els.filter(e => e.tier >= 1 && e.body.speed > 1.5 && e.y < sc.fillLineY + 90).length;
      if (inFlight > 1) return;
      const x = chooseX(sc, els.filter(e => e.tier >= 1));
      sc.beginAim(x); sc.commitDrop();
      c.drops++; c.lastDrop = now;
    } catch (e) {
      B.err = String(e && e.stack || e);
    }
  }
  B.timer = setInterval(step, 50);
}

// ---- drive PAGES pages in parallel ----
const per = Array.from({ length: PAGES }, (_, i) => Math.floor(GAMES / PAGES) + (i < GAMES % PAGES ? 1 : 0));
const pages = [];
for (let i = 0; i < PAGES; i++) {
  const page = await browser.newPage({ viewport: { width: 420, height: 740 } });
  await page.route(/\.mp3(\?|$)/, r => r.abort());   // skip soundtrack decode entirely
  await page.addInitScript(() => {
    // headless has no GPU: WebGL = SwiftShader software GL pinning every core.
    // Deny it so Phaser.AUTO falls back to the (much cheaper) Canvas renderer.
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (/webgl/i.test(String(type))) return null;
      return orig.call(this, type, ...rest);
    };
    localStorage.setItem('dannylab.opt.volMusic', '0');
    localStorage.setItem('dannylab.opt.volSfx', '0');
  });
  page.on('pageerror', e => console.log(`[page${i}] PAGEERROR:`, e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => {
    const g = window.DANNYLAB && window.DANNYLAB.game;
    const m = g && g.scene.getScene('DANNYLAB_Menu');
    return !!(m && m.scene.isActive());
  }, null, { timeout: 30000 });
  await page.evaluate(installBot, { target: per[i], cooldownMs: COOLDOWN_MS, minGapMs: MIN_GAP_MS, capDrops: CAP_DROPS, capMs: CAP_MS });
  pages.push(page);
}
console.log(`playing ${GAMES} games across ${PAGES} pages (${per.join('/')}) ...`);

const t0 = Date.now();
let lastLine = '';
for (;;) {
  const states = await Promise.all(pages.map(p => p.evaluate(() => ({
    done: window.__bot.done, n: window.__bot.results.length, err: window.__bot.err,
    cur: window.__bot.cur ? { drops: window.__bot.cur.drops, maxTier: window.__bot.cur.maxTier } : null,
    wins: window.__bot.results.filter(r => r.result === 'win').length,
  })).catch(() => null)));
  for (let i = 0; i < states.length; i++) if (states[i] && states[i].err) { console.log(`[page${i}] BOT ERROR: ${states[i].err}`); process.exit(1); }
  const doneGames = states.reduce((a, s) => a + (s ? s.n : 0), 0);
  const wins = states.reduce((a, s) => a + (s ? s.wins : 0), 0);
  const line = `  ${Math.round((Date.now() - t0) / 1000)}s  games ${doneGames}/${GAMES}  wins ${wins}  | ` +
    states.map((s, i) => s ? `p${i}:${s.n}${s.cur ? `+(${s.cur.drops}d,t${s.cur.maxTier})` : ''}` : `p${i}:?`).join(' ');
  if (line !== lastLine) { console.log(line); lastLine = line; }
  if (states.every(s => s && s.done)) break;
  await new Promise(r => setTimeout(r, 10000));
}

const all = (await Promise.all(pages.map(p => p.evaluate(() => window.__bot.results)))).flat();
await browser.close();
server.close();

// ---- report ----
const wins = all.filter(r => r.result === 'win');
const losses = all.filter(r => r.result === 'loss');
const caps = all.filter(r => r.result === 'cap');
const avg = (xs, f) => xs.length ? Math.round(xs.reduce((a, x) => a + f(x), 0) / xs.length) : 0;
const tierDist = {};
for (const r of all) tierDist[r.maxTier] = (tierDist[r.maxTier] || 0) + 1;

console.log('\n==== COMPLETABILITY REPORT ====');
console.log(`games:  ${all.length}`);
console.log(`wins:   ${wins.length}  (${(100 * wins.length / all.length).toFixed(1)}%)  — Uranium created`);
console.log(`losses: ${losses.length}  (overflow)`);
if (caps.length) console.log(`capped: ${caps.length}  (hit safety cap — inspect!)`);
console.log(`win  runs: avg ${avg(wins, r => r.drops)} drops, ${avg(wins, r => r.score)} pts, ${avg(wins, r => r.ms / 1000)}s`);
console.log(`loss runs: avg ${avg(losses, r => r.drops)} drops, ${avg(losses, r => r.score)} pts, max tier avg ${losses.length ? (losses.reduce((a, r) => a + r.maxTier, 0) / losses.length).toFixed(1) : '-'}`);
console.log('highest tier reached, per game:');
for (let t = 1; t <= 9; t++) if (tierDist[t]) console.log(`  tier ${t} (${['H','He','C','O','Ne','Na','Fe','Au','U'][t-1]}): ${'#'.repeat(tierDist[t])} ${tierDist[t]}`);
fs.writeFileSync(path.join(__dirname, 'completability-results.json'), JSON.stringify(all, null, 1));
console.log('raw results -> test/completability-results.json');
