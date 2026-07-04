// Per-effect verification for the Mystery Sample: for each tier 1-9 it
// builds a controlled board (target element of that tier + fillers), drops a
// real mystery orb onto the target through the actual collision path, and
// asserts (a) the tier keyed the right effect, (b) the board changed exactly
// as the on-screen description claims, (c) the description was shown.
//
//   node test/mystery.mjs
import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r => server.listen(0, r));

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 420, height: 740 } });
await page.route(/\.mp3(\?|$)/, r => r.abort());
await page.addInitScript(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (/webgl/i.test(String(type))) return null;
    return orig.call(this, type, ...rest);
  };
  localStorage.setItem('dannylab.opt.volMusic', '0');
  localStorage.setItem('dannylab.opt.volSfx', '0');
});
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => {
  const g = window.DANNYLAB && window.DANNYLAB.game;
  const m = g && g.scene.getScene('DANNYLAB_Menu');
  return !!(m && m.scene.isActive());
}, null, { timeout: 30000 });

// fillers: [tier, x] pairs settled on the floor beside the target (at cx)
const CASES = [
  { tier: 1, effect: 'updraft',            fillers: [[1, 100], [1, 390]],                    check: 'no tier-1 left' },
  { tier: 2, effect: 'float',              fillers: [[1, 125], [1, 365]],                    check: 'no tier-1/2 left nearby' },
  { tier: 3, effect: 'crystallizeUpgrade', fillers: [[1, 155], [1, 335]],                    check: 'target grew to tier 4' },
  { tier: 4, effect: 'combustPop',         fillers: [[1, 135], [1, 355]],                    check: 'small pieces blasted' },
  { tier: 5, effect: 'glowBoost',          fillers: [[1, 125], [1, 365]],                    check: 'lowest pieces upgraded' },
  { tier: 6, effect: 'fizzPop',            fillers: [[1, 80], [2, 400]],                     check: 'no tier-1/2 anywhere' },
  { tier: 7, effect: 'magnetMerge',        fillers: [[1, 70], [1, 420]],                     check: 'pieces pulled inward' },
  { tier: 8, effect: 'midas',              fillers: [[1, 121], [2, 375]],                    check: 'tier-1..2 to gold dust, +300' },
  { tier: 9, effect: 'miniFission',        fillers: [[1, 121], [2, 380], [3, 105], [4, 400]], check: 'tier-1..4 vaporized' },
];

async function runCase(c) {
  // fresh run
  await page.evaluate(() => {
    const m = window.DANNYLAB.game.scene;
    ['DANNYLAB_GameOver', 'DANNYLAB_Pause', 'DANNYLAB_Menu', 'DANNYLAB_Game'].forEach(k => {
      try { const s = m.getScene(k); if (s && (s.scene.isActive() || s.scene.isPaused())) m.stop(k); } catch (e) { /* absent */ }
    });
    m.start('DANNYLAB_Game', { mode: 'endless' });
  });
  await page.waitForFunction(() => {
    const s = window.DANNYLAB.game.scene.getScene('DANNYLAB_Game');
    return !!(s && s.scene.isActive() && s.elements);
  });
  await page.waitForTimeout(400);

  // build the board, then drop a real mystery orb onto the target
  await page.evaluate((c) => {
    const sc = window.DANNYLAB.game.scene.getScene('DANNYLAB_Game');
    const G = window.DANNYLAB.GEO, cx = window.DANNYLAB.beakerCx();
    const rT = window.DANNYLAB.tierCfg(c.tier).radius;
    sc.__tgt = sc.spawnElement(c.tier, cx, G.floorTop - rT - 2);
    sc.__fillers = c.fillers.map(([t, x]) => {
      const r = window.DANNYLAB.tierCfg(t).radius;
      return sc.spawnElement(t, x, G.floorTop - r - 2);
    });
  }, c);
  await page.waitForTimeout(1100);   // settle

  await page.evaluate(() => {
    const sc = window.DANNYLAB.game.scene.getScene('DANNYLAB_Game');
    sc.__fx = null; sc.__desc = null; sc.__score0 = sc.score;
    sc.__before = sc.elements.filter(e => e.active && e.tier >= 1).map(e => ({ t: e.tier, x: Math.round(e.x), y: Math.round(e.y) }));
    const orig = sc.applyMysteryEffect;
    sc.applyMysteryEffect = function (e, t, x, y) { sc.__fx = e; return orig.call(sc, e, t, x, y); };
    sc.spawnMystery(sc.__tgt.x, sc.__tgt.y - sc.__tgt.radius - 44);
  });

  // wait for the effect to key in, then for pops/upgrades/pulls to play out
  await page.waitForFunction(() => {
    const sc = window.DANNYLAB.game.scene.getScene('DANNYLAB_Game');
    return sc && sc.__fx !== null;
  }, null, { timeout: 8000 });
  // grab the description while it's on screen (it fades after ~3s)
  await page.waitForTimeout(800);
  const desc = await page.evaluate(() => {
    const sc = window.DANNYLAB.game.scene.getScene('DANNYLAB_Game');
    return sc._mysteryDescTxt && sc._mysteryDescTxt.active ? sc._mysteryDescTxt.text : null;
  });
  await page.waitForTimeout(3200);   // let ripples finish

  return await page.evaluate((desc) => {
    const sc = window.DANNYLAB.game.scene.getScene('DANNYLAB_Game');
    const after = sc.elements.filter(e => e.active && e.tier >= 1).map(e => ({ t: e.tier, x: Math.round(e.x), y: Math.round(e.y) }));
    const cnt = (list, lo, hi) => list.filter(p => p.t >= lo && p.t <= (hi || lo)).length;
    const maxT = after.reduce((a, p) => Math.max(a, p.t), 0);
    const cx = window.DANNYLAB.beakerCx();
    const spread = (list) => list.filter(p => p.t === 1).reduce((a, p) => a + Math.abs(p.x - cx), 0);
    return {
      fx: sc.__fx, desc, before: sc.__before, after,
      scoreGain: sc.score - sc.__score0,
      c: {
        t1_before: cnt(sc.__before, 1, 1), t1_after: cnt(after, 1, 1),
        t12_after: cnt(after, 1, 2), t13_after: cnt(after, 1, 3), t14_after: cnt(after, 1, 4),
        maxT, spread_before: spread(sc.__before), spread_after: spread(after),
      },
    };
  }, desc);
}

console.log('MYSTERY EFFECT VERIFICATION');
let failed = 0;
for (const c of CASES) {
  const r = await runCase(c);
  const checks = [];
  const ok = (name, pass) => { checks.push(`${pass ? 'ok' : 'FAIL'} ${name}`); if (!pass) failed++; };

  ok(`keyed '${c.effect}'`, r.fx === c.effect);
  ok('description shown', !!r.desc);
  switch (c.effect) {
    case 'updraft':            ok('all H popped', r.c.t1_after === 0 && r.c.t1_before >= 3); break;
    case 'float':              ok('small pieces popped', r.c.t12_after === 0); break;
    case 'crystallizeUpgrade': ok('cluster upgraded (t4+ present)', r.c.maxT >= 4); break;
    case 'combustPop':         ok('nearby small cleared', r.c.t1_after === 0); break;
    case 'glowBoost':          ok('lowest tier upgraded away', r.c.t1_after === 0); break;
    case 'fizzPop':            ok('every t1-2 popped', r.c.t12_after === 0); break;
    case 'magnetMerge':        ok('pieces pulled inward or merged',
                                  r.c.t1_after < r.c.t1_before || r.c.spread_after < r.c.spread_before - 30); break;
    case 'midas':              ok('t1-2 turned to dust', r.c.t12_after === 0);
                               ok('big gold payout', r.scoreGain >= 300); break;
    case 'miniFission':        ok('t1-4 vaporized', r.c.t14_after === 0); break;
  }
  console.log(`tier ${c.tier} -> ${c.effect.padEnd(18)} ${checks.join(' | ')}   desc: "${r.desc}"`);
}
if (errors.length) { console.log('--- PAGE ERRORS ---'); errors.forEach(e => console.log(e)); failed++; }
console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL MYSTERY EFFECTS VERIFIED');
await browser.close(); server.close();
process.exit(failed ? 1 : 0);
