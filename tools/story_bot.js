// tools/story_bot.js - STORY campaign autopilot (v0.80.2 bug sweep).
// Plays the whole campaign headless from the title's STORY button,
// through every cutscene, debrief, Upgrade Station, brief and the stage 7
// Hydro-Drill gate, with an autopilot that walks to each objective, taps
// dialogue, kills what the objective needs killed and chips bosses down.
// Logs every objective change, flags anything stuck for 90s (then forces
// past it so the sweep continues), screenshots each scene change, and
// reports page errors and the final save.
//   node tools/story_bot.js [outDir=/tmp/story_bot] [w=480] [h=854] [speed=4]
// A clean run ends with "RESULTS reached", all 8 stages cleared, ERRORS none.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const GAME = path.resolve(__dirname, '..'), OUT = process.argv[2] || '/tmp/story_bot';
const VW = +(process.argv[3] || 480), VH = +(process.argv[4] || 854), SPEED = +(process.argv[5] || 4);
try { fs.mkdirSync(OUT, { recursive: true }); } catch (e) {}
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { let rel = decodeURIComponent(q.url.split('?')[0]); if (rel === '/') rel = '/index.html';
  fs.readFile(path.join(GAME, rel), (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(rel)] || 'application/octet-stream' }); r.end(d); }); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log('[' + ((Date.now() - T0) / 1000).toFixed(0).padStart(4) + 's]', ...a);
let T0 = Date.now();

function installPilot(speed) {
  var P = window.__pilot = { events: [], key: '', since: 0, stuck: [], scene: null };
  function ev(s) { P.events.push(s); }
  function kill(g, e) { if (e && e.active !== false && e.hp > 0) PC.damageEnemy(g, e, 1e7, 0, 0, g._onKillCb); }
  function step(g) {
    var q = g.quest;
    g.invUntil = 1e9;
    var mh = PC.PLAYER.HP + ((g.stats && g.stats.bonusHp) || 0); if (g.hp < mh * 0.6) g.hp = mh;
    if (g.cardsOpen && g._shownCards && g._shownCards[0]) g.pickCard(g._shownCards[0]);
    if (!q) return;
    if (q.box && q.box.active) { q.box.tap(); return; }
    var o = q.cur(); if (!o || q.done) return;
    var key = g.__mid + '#' + q.idx + ':' + o.type + ':' + q.state;
    if (key !== P.key) { P.key = key; P.since = Date.now(); ev(key + ' @' + Math.round(g.runT) + 's'); }
    var tx = null, ty = null;
    if (o.type === 'fetch') {
      var it = q.items.filter(function (i) { return !i.taken; })[0]; if (it) { tx = it.x; ty = it.y; }
    } else if (o.type === 'sequence') {
      var sw = q.items[q.seqNext]; if (sw) { tx = sw.x; ty = sw.y; }
      if (q._seqLock) { tx = (sw ? sw.x : g.px) + 160; ty = sw ? sw.y : g.py; }
    } else if (o.type === 'arrive') {
      var am = q.region.landmark(o.at); if (am) { tx = am.x + am.w / 2; ty = am.y + am.h / 2; }
    } else if (o.type === 'reach' && q.state === 'travel') {
      var m3 = q.region.landmark(o.at); if (m3) { tx = m3.x + m3.w / 2; ty = m3.y + m3.h / 2; }
    } else { var t = q.targetXY(); if (t) { tx = t.x; ty = t.y; } }
    if (o.type === 'defend' && q.state === 'active') { var z = q.spotOf(q.region.landmark(o.at), 60); if (z) { tx = z.x; ty = z.y; } }
    if (o.type === 'clear' && q.state === 'active') (q.tracked || []).slice().forEach(function (e) { kill(g, e); });
    if (g.boss && g.boss.hp > 0 && !g.boss.dead) g.boss.damage(Math.max(5, g.boss.maxHp * 0.01), 0, 0);
    if (tx !== null && !g.storyPause) {
      g.px = tx; g.py = ty + (o.type === 'boss' ? 120 : 0);
    }
    // clear crowds so the pilot isn't buried (but never touch boss)
    if (g.enemies && g.enemies.liveCount > 70) g.enemies.pool.forEach(function (e) { if (e.active && Math.random() < 0.3) kill(g, e); });
  }
  P.timer = setInterval(function () {
    var g = PC.game.scene.getScene('PC_Game');
    if (!g || !PC.game.scene.isActive('PC_Game') || PC.game.scene.isPaused('PC_Game') || g.dead) return;
    g.__mid = (g.quest && g.quest.mission && g.quest.mission.id) || '?';
    if (g.moveInput) g.moveInput.vec = { x: 0, y: 0 };
    for (var s = 0; s < speed; s++) {
      try { step(g); g.update(0, 33.3); } catch (e) { ev('PILOT/UPDATE THROW ' + e.message); break; }
      if (!PC.game.scene.isActive('PC_Game') || g.dead) break;
    }
  }, 16);
}

async function clickLabel(p, label) {
  const sp = await p.evaluate((label) => {
    const scs = PC.game.scene.getScenes(true);
    for (let k = scs.length - 1; k >= 0; k--) {
      const s = scs[k], all = []; const walk = l => l.forEach(o => { all.push(o); if (o.list) walk(o.list); }); walk(s.children.list);
      const t = all.filter(o => o.text === label && o.visible !== false).pop(); if (!t) continue;
      const b = t.getBounds(), cam = s.cameras.main, wv = cam.worldView, c = PC.game.canvas, r = c.getBoundingClientRect();
      return { x: r.left + (b.centerX - wv.x) * cam.zoom * r.width / c.width, y: r.top + (b.centerY - wv.y) * cam.zoom * r.height / c.height };
    }
    return null;
  }, label);
  if (!sp) return false; await p.mouse.click(sp.x, sp.y); return true;
}

(async () => {
  await new Promise(r => srv.listen(9160 + (VW % 7), r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH } });
  await ctx.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/.test(t)) return null; return o.call(this, t, ...a); };
    try { if (!sessionStorage.getItem('sim')) { localStorage.clear(); sessionStorage.setItem('sim', '1'); } } catch (e) {} });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { errs.push(e.message.slice(0, 300)); log('PAGE ERROR', e.message.slice(0, 300)); });
  await p.goto('http://localhost:' + (9160 + (VW % 7)) + '/');
  await p.waitForFunction(() => window.PC && PC.game && PC.game.scene.isActive('PC_Title'), null, { timeout: 30000 });
  T0 = Date.now();
  await p.evaluate(installPilot, SPEED);
  await p.mouse.click(VW / 2, VH / 2); await sleep(5600);
  if (!(await clickLabel(p, '>> STORY <<'))) log('no STORY button');
  let lastScene = '', evN = 0, lastKey = '', stuckSince = Date.now(), done = false, shots = 0;
  const seenScenes = [];
  const DEADLINE = Date.now() + 40 * 60 * 1000;
  while (!done && Date.now() < DEADLINE) {
    await sleep(300);
    const st = await p.evaluate(() => {
      const act = PC.game.scene.getScenes(true).map(s => s.sys.settings.key);
      const g = PC.game.scene.getScene('PC_Game'), P = window.__pilot;
      const evs = P.events.splice(0);
      let q = null;
      if (act.indexOf('PC_Game') >= 0 && g.quest) { const o = g.quest.cur(); q = { mid: g.__mid, idx: g.quest.idx, n: g.quest.mission.objectives.length, type: o && o.type, state: g.quest.state,
        box: !!(g.quest.box && g.quest.box.active), storyPause: !!g.storyPause, paused: PC.game.scene.isPaused('PC_Game'), hp: Math.round(g.hp), foes: g.enemies.liveCount, t: Math.round(g.runT),
        boss: g.boss ? { hp: Math.round(g.boss.hp), max: g.boss.maxHp, dead: !!g.boss.dead } : null, px: Math.round(g.px), py: Math.round(g.py), done: g.quest.done,
        confront: !!(g.confront && g.confront.armed && g.confront.armed()), gauntlet: !!g.gauntlet, cards: !!g.cardsOpen }; }
      return { act, evs, q, missionsBrief: act.indexOf('PC_Missions') >= 0 ? !!PC.game.scene.getScene('PC_Missions').briefUi : null };
    });
    st.evs.forEach(e => log('  obj', e));
    const top = st.act[st.act.length - 1] || '';
    if (st.act.join() !== lastScene) { lastScene = st.act.join(); log('SCENES', lastScene); seenScenes.push(lastScene);
      await p.screenshot({ path: OUT + '/story_' + String(shots++).padStart(3, '0') + '_' + top + '.png' }); stuckSince = Date.now(); }
    const key = JSON.stringify(st.q ? [st.q.mid, st.q.idx, st.q.state, st.q.boss && Math.round(st.q.boss.hp / 50)] : st.act);
    if (key !== lastKey) { lastKey = key; stuckSince = Date.now(); }
    if (Date.now() - stuckSince > 90000) {
      log('STUCK 90s', JSON.stringify(st));
      await p.screenshot({ path: OUT + '/story_STUCK_' + String(shots++).padStart(3, '0') + '.png' });
      // force past it so the sweep continues
      const forced = await p.evaluate(() => { const g = PC.game.scene.getScene('PC_Game');
        if (PC.game.scene.isActive('PC_Game') && g.quest && !g.quest.done) { const o = g.quest.cur(); if (o) { g.quest.finishObjective(o); return 'forced ' + o.type; } }
        return 'nothing to force'; });
      log('  ', forced); stuckSince = Date.now();
    }
    // menus
    if (st.act.indexOf('PC_Game') >= 0) { if (st.q && st.q.storyPause && !st.q.box) await p.mouse.click(VW / 2, VH * 0.6); continue; }
    if (top === 'PC_Results') { log('RESULTS reached'); await sleep(1500); await p.screenshot({ path: OUT + '/story_final_results.png' }); done = true; break; }
    if (top === 'PC_Cutscene') { await p.mouse.click(VW / 2, VH * 0.6); continue; }
    if (top === 'PC_Upgrade') { await sleep(400); if (!(await clickLabel(p, '>> NEXT MISSION <<'))) await clickLabel(p, '< BACK'); continue; }
    if (top === 'PC_Missions') {
      await sleep(500);
      if (await clickLabel(p, '>> GO! <<')) continue;
      if (await p.evaluate(() => { const m = PC.game.scene.getScene('PC_Missions'); const a = []; const w = l => l.forEach(o => { a.push(o); if (o.list) w(o.list); }); w(m.children.list); return a.some(o => o.text === 'SEALED - GET THE HYDRO-DRILL'); })) {
        const g0 = await p.evaluate(() => PC.meta.gold());
        log('DRILL GATE: gold on hand', g0, '(TP', await p.evaluate(() => PC.meta.stat('tp')), ')');
        if (g0 < 300) { log('  NOT ENOUGH GOLD for the drill: topping up (a real player replays a cleared stage)'); await p.evaluate(() => PC.meta.setGold(PC.meta.gold() + 300)); }
        await clickLabel(p, 'SEALED - GET THE HYDRO-DRILL'); await sleep(600);
        const gt = await p.evaluate(() => PC.game.scene.getScenes(true).map(s => s.sys.settings.key).join());
        log('  garage scene:', gt, 'gold', await p.evaluate(() => PC.meta.gold()));
        await p.screenshot({ path: OUT + '/story_garage_before.png' });
        await clickLabel(p, 'HYDRO-DRILL'); await sleep(400);
        log('  drill owned:', await p.evaluate(() => PC.GARAGE.hasGear('hydrodrill')));
        await p.screenshot({ path: OUT + '/story_garage_after.png' });
        await clickLabel(p, '< BACK'); await sleep(600);
        continue;
      }
      const opened = await p.evaluate(() => { const m = PC.game.scene.getScene('PC_Missions'), C = PC.STORY.CHAIN;
        for (let i = 0; i < C.length; i++) if (PC.storyState.status(i) === 'active') { m.openBrief(C[i], 'active'); return C[i].id; } return null; });
      log('  opened brief by hand:', opened); continue;
    }
    if (top === 'PC_Title') { await p.mouse.click(VW / 2, VH / 2); await sleep(400); await clickLabel(p, '>> STORY <<'); continue; }
    await p.mouse.click(VW / 2, VH * 0.6);
  }
  const fin = await p.evaluate(() => ({ cleared: PC.STORY.CHAIN.map(c => c.id + ':' + PC.storyState.isCleared(c.id)), tp: PC.meta && PC.meta.stat('tp'),
    saved: (() => { try { return localStorage.getItem('portioncontrol.story'); } catch (e) { return 'x'; } })() }));
  log('FINAL', JSON.stringify(fin));
  log('ERRORS', errs.length ? JSON.stringify(errs.slice(0, 10)) : 'none');
  log('done=' + done);
  await b.close(); srv.close();
})();
