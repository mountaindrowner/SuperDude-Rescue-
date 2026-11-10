// tools/snack_bot.js - SNACK ATTACK balance bot (v0.80.0).
// [template section 26] Plays whole 15-minute runs, fast, and reports the
// numbers the template says to watch: level by minute, time survived,
// gold, kills, chests, evolutions, unlocks. Runs the game in headless
// Chromium (Playwright), speeding the simulation up with extra update
// steps on top of Phaser's own loop.
//
//   node tools/snack_bot.js [runs=3] [stage=street] [hero=danny] [speed=6] [keepSave=0]
//
// keepSave=1 carries the save between runs (gold, unlocks, purchases),
// so a series of runs shows the progression curve, not just one run.
// The bot buys the cheapest affordable PowerUp / hero between runs.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const [RUNS, STAGE, HERO, SPEED, KEEP] = [parseInt(process.argv[2] || '3', 10), process.argv[3] || 'street',
  process.argv[4] || 'danny', parseInt(process.argv[5] || '6', 10), process.argv[6] === '1'];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { let rel = decodeURIComponent(q.url.split('?')[0]); if (rel === '/') rel = '/index.html';
  fs.readFile(path.join(ROOT, rel), (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(rel)] || 'application/octet-stream' }); r.end(d); }); });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- runs INSIDE the page ----
function installBot(speed) {
  // chests grant instantly (no reveal to tap through)
  PC.SnackChest.open = function (scene, kind, evo) { return PC.SnackChest.grant(scene, kind, evo); };
  var B = window.__bot = { snaps: [], lastMin: -1, stuckT: 0, lastP: null, detour: 0, detourA: 0, done: false };
  function pickCard(g) {
    var cards = g._shownCards || [];
    var score = function (c) {
      if (c.kind === 'weapon-new') return g.weapons.length < 4 ? 10 : 4;
      if (c.kind === 'weapon-up') return 8 + c.w.level * 0.1;
      if (c.kind === 'passive') {
        // smart-ish: an item that evolves something we hold
        var partner = (PC.EVOLUTIONS || []).some(function (r) {
          return r.requires === c.pk && g.weapons.some(function (w) { return w.key === r.base; });
        });
        return partner ? 9 : 5;
      }
      return 1;
    };
    var best = cards[0];
    cards.forEach(function (c) { if (score(c) > score(best)) best = c; });
    g.pickCard(best);
  }
  function steer(g) {
    var px = g.px, py = g.py, rx = 0, ry = 0, ax = 0, ay = 0, i;
    var pool = g.enemies.pool;
    for (i = 0; i < pool.length; i++) {
      var e = pool[i]; if (!e.active) continue;
      var dx = px - e.x, dy = py - e.y, d2 = dx * dx + dy * dy;
      if (d2 < 140 * 140) { var w = 1 / Math.max(d2, 64); rx += dx * w; ry += dy * w; }
    }
    if (g.boss && !g.boss.dead) {
      var bdx = px - g.boss.x, bdy = py - g.boss.y, bd2 = bdx * bdx + bdy * bdy;
      if (bd2 < 260 * 260) { var bw = 6 / Math.max(bd2, 100); rx += bdx * bw; ry += bdy * bw; }
    }
    // nearest worthwhile thing: gem, pickup, chest
    var best = null, bd = 520 * 520;
    var gp = g.gems.pool;
    for (i = 0; i < gp.length; i++) {
      var gg = gp[i]; if (!gg.active) continue;
      var d = (gg.x - px) * (gg.x - px) + (gg.y - py) * (gg.y - py);
      if (d < bd) { bd = d; best = gg; }
    }
    var fl = g.pickups.floats;
    for (i = 0; i < fl.length; i++) {
      var f = fl[i]; if (!f.active) continue;
      var d3 = (f.x - px) * (f.x - px) + (f.y - py) * (f.y - py) - 60000;   // prefer pickups
      if (d3 < bd) { bd = d3; best = f; }
    }
    (g.snack.chests || []).forEach(function (c) {
      var d4 = (c.x - px) * (c.x - px) + (c.y - py) * (c.y - py) - 200000;
      if (d4 < bd) { bd = d4; best = c; }
    });
    if (g.pickups.crates) g.pickups.crates.forEach(function (c) {
      if (!c.active) return;
      var d5 = (c.x - px) * (c.x - px) + (c.y - py) * (c.y - py) - 30000;
      if (d5 < bd) { bd = d5; best = c; }
    });
    if (best) { var l = Math.sqrt((best.x - px) * (best.x - px) + (best.y - py) * (best.y - py)) || 1; ax = (best.x - px) / l; ay = (best.y - py) / l; }
    else { var a = g.runT * 0.4; ax = Math.cos(a); ay = Math.sin(a); }
    var rl = Math.sqrt(rx * rx + ry * ry);
    var vx = ax * 0.7 + (rl ? rx / rl : 0) * Math.min(2.5, rl * 140);
    var vy = ay * 0.7 + (rl ? ry / rl : 0) * Math.min(2.5, rl * 140);
    // unstick from walls
    if (B.detour > 0) { B.detour -= 0.033; vx = Math.cos(B.detourA); vy = Math.sin(B.detourA); }
    var L = Math.sqrt(vx * vx + vy * vy) || 1;
    g.moveInput.vec = { x: vx / L, y: vy / L };
    if (B.lastP) {
      var mv = Math.abs(px - B.lastP.x) + Math.abs(py - B.lastP.y);
      B.stuckT = mv < 0.3 ? B.stuckT + 0.033 : 0;
      if (B.stuckT > 0.6) { B.detour = 0.7; B.detourA = Math.random() * Math.PI * 2; B.stuckT = 0; }
    }
    B.lastP = { x: px, y: py };
  }
  var g0 = PC.game.scene.getScene('PC_Game');
  g0.moveInput.update = function () {};          // the bot owns the stick
  B.timer = setInterval(function () {
    var g = PC.game.scene.getScene('PC_Game');
    if (!PC.game.scene.isActive('PC_Game') || !g.snack || g.dead || g.snack.ended) {
      if (!B.done) { B.done = true; clearInterval(B.timer); }
      return;
    }
    for (var s = 0; s < speed; s++) {
      if (g.cardsOpen) pickCard(g);
      if (g.snackHold) { g.snackHold = false; }
      steer(g);
      g.update(0, 33.3);
      if (g.dead || g.snack.ended) break;
      var m = Math.floor(g.runT / 60);
      if (m !== B.lastMin) {
        B.lastMin = m;
        B.snaps.push({ m: m, lv: g.level, kills: g.kills, gold: g.pickups.gold, hp: Math.round(g.hp),
          foes: g.enemies.liveCount, w: g.weapons.map(function (w) { return w.key + (w.evolved ? '*' : w.level); }).join(' '),
          p: Object.keys(g.passives).filter(function (k) { return g.passives[k]; }).map(function (k) { return k + g.passives[k]; }).join(' ') });
      }
    }
  }, 0);
}

(async () => {
  await new Promise(r => srv.listen(9131, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 480, height: 854 } });
  await ctx.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/.test(t)) return null; return o.call(this, t, ...a); }; });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.goto('http://localhost:9131/'); await p.waitForFunction(() => window.PC && PC.game && PC.game.scene.isActive('PC_Title'), null, { timeout: 30000 });
  if (!KEEP) await p.evaluate(() => PC.SnackProfile.reset());
  for (let run = 1; run <= RUNS; run++) {
    if (!KEEP) await p.evaluate(() => PC.SnackProfile.reset());
    await p.evaluate(({ stage, hero }) => {
      var P = PC.SnackProfile, d = P.get();
      if (d.stages.indexOf(stage) < 0) d.stages.push(stage);
      if (d.heroes.owned.indexOf(hero) < 0) d.heroes.owned.push(hero);
      PC.Snack.pending = { hero: hero, stage: stage };
      PC.game.scene.getScenes(true)[0].scene.start('PC_Game');
    }, { stage: STAGE, hero: HERO });
    await p.waitForFunction(() => PC.game.scene.isActive('PC_Game') && PC.game.scene.getScene('PC_Game').snack, null, { timeout: 20000 });
    await sleep(300);
    const t0 = Date.now();
    await p.evaluate((sp) => { (0, eval)('(' + sp.fn + ')')(sp.speed); }, { fn: installBot.toString(), speed: SPEED });
    await p.waitForFunction(() => window.__bot && window.__bot.done, null, { timeout: 30 * 60 * 1000, polling: 1000 });
    await sleep(1500);
    const rep = await p.evaluate(() => {
      var d = PC.SnackProfile.get();
      var last = PC.SnackProfile.get().records;
      return { snaps: window.__bot.snaps, wallet: d.wallet, done: d.done.slice(), stages: d.stages.slice(), records: last,
        life: { kills: d.life.kills, chests: d.life.chests, elites: d.life.elites, crates: d.life.crates, gold: d.life.gold } };
    });
    const res = await p.evaluate(() => { var s = PC.game.scene.getScene('PC_SnackResults'); return s && s.d ? s.d : null; });
    console.log('\n=== RUN ' + run + ' (' + STAGE + ', ' + HERO + ')  real ' + Math.round((Date.now() - t0) / 1000) + 's');
    rep.snaps.forEach(s => console.log('  ' + String(s.m).padStart(2) + 'm  LV ' + String(s.lv).padStart(2) + '  kills ' + String(s.kills).padStart(4) +
      '  gold ' + String(s.gold).padStart(4) + '  hp ' + String(s.hp).padStart(3) + '  foes ' + String(s.foes).padStart(3) + '  [' + s.w + ']  {' + s.p + '}'));
    if (res) console.log('  END: ' + res.reason + '  t=' + Math.floor(res.t) + 's  LV ' + res.level + '  gold +' + res.gold + '  cleared=' + res.cleared +
      '  evolved=' + (res.evolved || []).join(',') + '  unlocks=' + (res.unlocks || []).join(','));
    console.log('  wallet ' + rep.wallet + '  stages ' + rep.stages.join(',') + '  life ' + JSON.stringify(rep.life));
    if (KEEP) {
      // spend like a sensible kid: cheapest affordable hero first, then cheapest PowerUp
      const bought = await p.evaluate(() => {
        var P = PC.SnackProfile, out = [];
        for (var guard = 0; guard < 30; guard++) {
          var opts = [];
          PC.SNACK.HEROES.forEach(function (h) { if (P.heroState(h.id) === 'forSale') opts.push({ k: 'hero', id: h.id, c: P.heroPrice(h.id) }); });
          PC.SNACK.POWERUPS.forEach(function (u) { var c = P.powerupCost(u.id); if (c !== null && ['curse', 'revival', 'amount'].indexOf(u.id) < 0) opts.push({ k: 'pu', id: u.id, c: c }); });
          opts.sort(function (a, b) { return a.c - b.c; });
          var o = opts[0];
          if (!o || o.c > P.get().wallet) break;
          if (o.k === 'hero') P.buyHero(o.id); else P.buyPowerup(o.id);
          out.push(o.id + ' $' + o.c);
        }
        return out;
      });
      console.log('  bought: ' + (bought.join(', ') || 'nothing'));
    }
  }
  console.log('\nerrors:', errs.length ? errs.slice(0, 5) : 'none');
  await b.close(); srv.close();
})();
