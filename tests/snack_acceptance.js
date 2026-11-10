// tests/snack_acceptance.js - SNACK ATTACK acceptance tests (v0.80.0, OPTIONS v0.80.1).
// The template's section 23 checklist, as executable checks against the
// real game in headless Chromium, plus the Portion Control specifics
// (separate saves, the Story PowerUps fix, blocked storage, title).
//
//   node tests/snack_acceptance.js
//
// Exit code 1 if anything fails. Uses the preinstalled Playwright.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => { let rel = decodeURIComponent(q.url.split('?')[0]); if (rel === '/') rel = '/index.html';
  fs.readFile(path.join(ROOT, rel), (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(rel)] || 'application/octet-stream' }); r.end(d); }); });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
let page;

async function boot(ctx) {
  const p = await ctx.newPage();
  p._errs = [];
  p.on('pageerror', e => p._errs.push(e.message.slice(0, 200)));
  await p.goto('http://localhost:9140/');
  await p.waitForFunction(() => window.PC && PC.game && PC.game.scene.isActive('PC_Title'), null, { timeout: 30000 });
  return p;
}
// start a Snack run (fresh save unless keep) and wait for the scene
async function startRun(opts) {
  opts = opts || {};
  await page.evaluate((o) => {
    if (!o.keep) PC.SnackProfile.reset();
    var d = PC.SnackProfile.get();
    if (o.stage && d.stages.indexOf(o.stage) < 0) d.stages.push(o.stage);
    if (o.hero && d.heroes.owned.indexOf(o.hero) < 0) d.heroes.owned.push(o.hero);
    if (o.powerups) for (var k in o.powerups) d.powerups[k] = o.powerups[k];
    PC.SnackProfile.save();
    if (PC.STORY) PC.STORY.pendingMission = null;
    PC.Snack.pending = { hero: o.hero || 'danny', stage: o.stage || 'street' };
    PC.game.scene.getScenes(true)[0].scene.start('PC_Game');
  }, opts);
  await page.waitForFunction(() => PC.game.scene.isActive('PC_Game') && PC.game.scene.getScene('PC_Game').snack, null, { timeout: 20000 });
  await sleep(250);
  // the test drives time by hand: freeze the real loop's clock effects
  await page.evaluate(() => { var g = PC.game.scene.getScene('PC_Game'); g.invUntil = 1e9; });
}
const G = (fn, arg) => page.evaluate(fn, arg);
async function test(section, name, fn) {
  try {
    const out = await fn();
    if (out === true || out === undefined) results.push({ ok: true, section, name });
    else results.push({ ok: false, section, name, why: JSON.stringify(out) });
  } catch (e) { results.push({ ok: false, section, name, why: e.message.split('\n')[0].slice(0, 200) }); }
}

(async () => {
  await new Promise(r => srv.listen(9140, r));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 480, height: 854 } });
  await ctx.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/.test(t)) return null; return o.call(this, t, ...a); }; });
  page = await boot(ctx);

  // ================= STARTER STATE AND NAVIGATION =================
  await test('start', 'fresh save: wallet 0, owns only Danny, Main Street only', () => G(() => {
    PC.SnackProfile.reset(); var d = PC.SnackProfile.get();
    return d.wallet === 0 && d.heroes.owned.join() === 'danny' && d.stages.join() === 'street' || d;
  }));
  await test('start', 'Vic / Josh / Kevin for sale at 10 / 100 / 500 without any achievement', () => G(() => {
    PC.SnackProfile.reset(); var P = PC.SnackProfile;
    return ['victoria', 'josh', 'kevin'].map(function (h) { return P.heroState(h) + ':' + P.heroPrice(h); }).join()
      === 'forSale:10,forSale:100,forSale:500' || ['victoria', 'josh', 'kevin'].map(function (h) { return P.heroState(h) + ':' + P.heroPrice(h); });
  }));
  await test('start', 'locked heroes show a readable unlock condition', () => G(() => {
    PC.SnackProfile.reset();
    return ['carlos', 'nayah'].every(function (h) {
      var def = PC.SNACK.heroDef(h); var a = PC.SNACK.achievementById(def.unlockBy);
      return PC.SnackProfile.heroState(h) === 'locked' && a && a.how.length > 5;
    });
  }));
  await test('start', 'every unlock reward points at real content (startup validation)', () => G(() => {
    var bad = PC.SNACK.validate(); return bad.length === 0 || bad;
  }));
  await test('start', 'title shows SNACK ATTACK and no longer offers RUSH MODE', () => G(() => {
    var s = PC.game.scene.getScene('PC_Title');
    var texts = s.children.list.concat(s.menu ? s.menu.list : []).map(function (o) { return o.text; }).filter(Boolean);
    return texts.indexOf('SNACK ATTACK') >= 0 && texts.indexOf('RUSH MODE') < 0 || texts;
  }));
  for (const hero of ['danny', 'victoria', 'josh', 'kevin', 'carlos', 'nayah']) {
    await test('start', 'a run as ' + hero + ' starts with exactly their own kit weapon', async () => {
      await startRun({ hero });
      return G((h) => { var g = PC.game.scene.getScene('PC_Game');
        var want = PC.KITS[h].weapon(g).key;
        return (g.weapons.length === 1 && g.weapons[0].key === want && g.weapons[0].max === 8) || g.weapons.map(function (w) { return w.key + '/' + w.max; }); }, hero);
    });
  }

  // ================= CORE RUN =================
  await test('run', 'XP curve follows the template: 5, then +10 a level, walls at 20 and 40', () => G(() => {
    var x = PC.SNACK.xpToNext;
    return x(1) === 5 && x(2) === 15 && x(19) === 185 && x(20) === 195 + PC.SNACK.XP_SPIKES[20] && x(21) === 195 + 13 && x(40) > x(39) + 500 || [x(1), x(2), x(19), x(20), x(21)];
  }));
  await startRun();
  await test('run', 'waves come from the stage table: minute 0 spawns tier A only, minute 14 spawns heavies too', () => G(() => {
    var sr = PC.game.scene.getScene('PC_Game').snack;
    var R = PC.SNACK.WAVE_ROWS;
    return R[0][3].join() === '1,0,0,0,0' && R[14][3][4] > 0 && sr.stage.roster.length === 5;
  }));
  await test('run', 'a big XP gain queues several level-ups and shows them one at a time', () => G(() => {
    var g = PC.game.scene.getScene('PC_Game');
    g.gainXp(400);
    var lv = g.level, pend = g.pendingLevels, open = g.cardsOpen, n = g._shownCards.length;
    return (lv >= 5 && pend >= 3 && open && n >= 3) || { lv: lv, pend: pend, open: open, n: n };
  }));
  await test('run', 'the level-up pauses combat (the clock does not move while cards are up)', async () => {
    const t0 = await G(() => PC.game.scene.getScene('PC_Game').runT);
    await sleep(600);
    const t1 = await G(() => PC.game.scene.getScene('PC_Game').runT);
    return t1 === t0 || { t0, t1 };
  });
  await test('run', 'a draft has 3-4 different cards and never an evolution', () => G(() => {
    var g = PC.game.scene.getScene('PC_Game'), bad = [];
    for (var i = 0; i < 60; i++) {
      var c = PC.SnackDraft.draw(g);
      var keys = c.map(function (x) { return x.kind + ':' + x.key; });
      if (c.length < 3 || c.length > 4) bad.push('count ' + c.length);
      if (new Set(keys).size !== keys.length) bad.push('dup ' + keys.join());
      if (c.some(function (x) { return x.kind === 'evolve'; })) bad.push('evolve card');
    }
    return bad.length === 0 || bad.slice(0, 3);
  }));
  // finish the queued picks so the run is live again
  await G(() => { var g = PC.game.scene.getScene('PC_Game'); var n = 0; while (g.cardsOpen && n++ < 50) g.pickCard(g._shownCards[0]); });
  await test('run', 'the draft only offers weapons this save has unlocked', () => G(() => {
    var g = PC.game.scene.getScene('PC_Game'), P = PC.SnackProfile, bad = [];
    for (var i = 0; i < 80; i++) PC.SnackDraft.draw(g).forEach(function (c) {
      if (c.kind === 'weapon-new' && !P.weaponInPool(c.key)) bad.push(c.key);
      if (c.kind === 'passive' && !(g.passives[c.pk] > 0) && !P.passiveInPool(c.pk)) bad.push(c.pk);
    });
    return bad.length === 0 || Array.from(new Set(bad));
  }));
  await test('run', 'six weapons: no seventh is ever offered', () => G(() => {
    var g = PC.game.scene.getScene('PC_Game'), d = PC.SnackProfile.get();
    Object.keys(PC.SNACK.WEAPONS).forEach(function (k) { if (d.weapons.indexOf(k) < 0) d.weapons.push(k); });
    var keys = ['blaster', 'whisk', 'salt', 'microwave', 'fridge'];
    keys.forEach(function (k) { if (!g.weapons.some(function (w) { return w.key === k; })) {
      var w = PC.SNACK.WEAPONS[k].make(g); w.max = 8; g.weapons.push(w); } });
    g.weapons = g.weapons.slice(0, 6);
    var offered = false;
    for (var i = 0; i < 80; i++) PC.SnackDraft.draw(g).forEach(function (c) { if (c.kind === 'weapon-new') offered = true; });
    return g.weapons.length === 6 && !offered || { n: g.weapons.length, offered: offered };
  }));
  await test('run', 'six passives: no seventh new passive through drafts', () => G(() => {
    var g = PC.game.scene.getScene('PC_Game'), d = PC.SnackProfile.get();
    Object.keys(PC.PASSIVES).forEach(function (k) { if (d.passives.indexOf(k) < 0) d.passives.push(k); });
    ['battery', 'coat', 'fan', 'shoes', 'magnet', 'lens'].forEach(function (k) { g.passives[k] = g.passives[k] || 1; });
    var newOffered = false;
    for (var i = 0; i < 80; i++) PC.SnackDraft.draw(g).forEach(function (c) { if (c.kind === 'passive' && !(g.passives[c.pk] > 0)) newOffered = true; });
    return !newOffered;
  }));
  await test('run', 'ranks 6-8 grow the weapon; a rank-8 weapon leaves the pool', () => G(() => {
    var g = PC.game.scene.getScene('PC_Game'), w = g.weapons[0];
    while (w.level < 5) PC.SnackDraft.rankUp(g, w);
    var m5 = w.mastery || 1;
    PC.SnackDraft.rankUp(g, w); var m6 = w.mastery;
    PC.SnackDraft.rankUp(g, w); PC.SnackDraft.rankUp(g, w);
    var offered = false;
    for (var i = 0; i < 60; i++) PC.SnackDraft.draw(g).forEach(function (c) { if (c.kind === 'weapon-up' && c.w === w) offered = true; });
    return (w.level === 8 && m6 > m5 && w.mastery > m6 && !offered) || { lv: w.level, m5: m5, m6: m6, m8: w.mastery, offered: offered };
  }));
  await test('run', 'a fully maxed build gets gold or a snack, never a blank draft', () => G(() => {
    var g = PC.game.scene.getScene('PC_Game');
    g.weapons.forEach(function (w) { w.level = 8; });
    for (var k in g.passives) if (g.passives[k]) g.passives[k] = PC.PASSIVES[k].max;
    var c = PC.SnackDraft.draw(g);
    return (c.length > 0 && c.every(function (x) { return x.kind === 'gold' || x.kind === 'heal'; })) || c.map(function (x) { return x.kind; });
  }));
  await test('run', 'REROLL / SKIP / BANISH only appear when bought, and banish removes a card', async () => {
    await startRun();
    const none = await G(() => { var g = PC.game.scene.getScene('PC_Game'); g.gainXp(10);
      var labels = g.cardUi.map(function (o) { return o.text; }).filter(Boolean);
      var n = 0; while (g.cardsOpen && n++ < 20) g.pickCard(g._shownCards[0]);
      return labels.filter(function (t) { return /REROLL|SKIP|BANISH/.test(t); }); });
    await startRun({ powerups: { reroll: 1, skip: 1, banish: 1 } });
    const r = await G(() => { var g = PC.game.scene.getScene('PC_Game'), sr = g.snack;
      var counts = [sr.rerolls, sr.skips, sr.banishes].join();
      g.gainXp(10);
      var labels = g.cardUi.map(function (o) { return o.text; }).filter(Boolean).filter(function (t) { return /REROLL|SKIP|BANISH/.test(t); });
      var victim = g._shownCards[0].key;
      g._banishMode = true; g.pickCard(g._shownCards[0]);
      var again = false;
      for (var i = 0; i < 60; i++) PC.SnackDraft.draw(g).forEach(function (c) { if (c.key === victim && c.kind !== 'weapon-up') again = true; });
      return { counts: counts, labels: labels.length, banished: !!sr.banished[victim], again: again, left: sr.banishes };
    });
    return (none.length === 0 && r.counts === '2,2,2' && r.labels === 3 && r.banished && !r.again && r.left === 1) || { none, r };
  });

  // ================= CHESTS AND EVOLUTION =================
  await test('chest', 'max weapon + its item is NOT enough: a non-evolution chest never evolves', async () => {
    await startRun();
    return G(() => { var g = PC.game.scene.getScene('PC_Game'), w = g.weapons[0];
      while (w.level < 8) PC.SnackDraft.rankUp(g, w);
      g.passives.lens = 1; PC.PASSIVES.lens.apply(g.stats, 1);
      for (var i = 0; i < 20; i++) PC.SnackChest.grant(g, 'normal', false);
      return !w.evolved; });
  });
  await test('chest', 'an eligible chest evolves it, keeps the item, records it, pays the achievement once', () => G(() => {
    var g = PC.game.scene.getScene('PC_Game'), w = g.weapons[0], P = PC.SnackProfile;
    var w0 = P.get().wallet;
    var res = PC.SnackChest.grant(g, 'normal', true);
    var evolved = res.items.filter(function (i) { return i.type === 'evolve'; }).length;
    var paid = P.get().wallet - w0 - res.goldPaid;
    var again = PC.SnackChest.grant(g, 'normal', true);
    var paid2 = P.get().wallet - w0 - res.goldPaid - again.goldPaid;
    return (w.evolved && w.name === 'MEGA RESIZER' && g.passives.lens >= 1 && evolved === 1 &&
      P.get().life.evolved.resizer && P.isDone('evo_resizer') && paid === 150 && paid2 === 150) || { ev: w.evolved, name: w.name, evolved: evolved, paid: paid, paid2: paid2 };
  }));
  await test('chest', 'a chest gives 1, 3 or 5 rewards (and big ones happen)', () => G(() => {
    var g = PC.game.scene.getScene('PC_Game'), seen = {};
    g.stats.luck = 0.5;                                  // normal chest: 1 usually, 3 sometimes, 5 rarely
    var w = PC.SNACK.WEAPONS.whisk.make(g); w.max = 8; g.weapons.push(w);
    for (var i = 0; i < 400; i++) { w.level = 1; g.passives.battery = 1; seen[PC.SnackChest.roll(g, 'normal', false).count] = 1; }
    return Object.keys(seen).sort().join() === '1,3,5' || Object.keys(seen).join();
  }));
  await test('chest', 'elites before 5:00 carry plain chests; from 5:00 they can evolve; bosses always can', () => G(() => {
    var E = PC.SNACK.EVENTS, cut = PC.SNACK.EVO_CHEST_FROM_SEC;
    var early = E.filter(function (e) { return e.type === 'elite' && e.at < cut; });
    var late = E.filter(function (e) { return e.type === 'elite' && e.at >= cut; });
    return early.length >= 2 && late.length >= 3 && cut === 300;
  }));
  await test('chest', 'a killed golden elite drops a chest flagged by its spawn time', async () => {
    await startRun();
    return G(() => { var g = PC.game.scene.getScene('PC_Game'), sr = g.snack;
      sr.fire({ type: 'elite', tier: 'C', at: 60 });
      var e = g.enemies.pool.find(function (x) { return x.active && x.elite; });
      PC.damageEnemy(g, e, 1e9, 0, 0, g._onKillCb);
      sr.fire({ type: 'elite', tier: 'C', at: 600 });
      var e2 = g.enemies.pool.find(function (x) { return x.active && x.elite; });
      PC.damageEnemy(g, e2, 1e9, 0, 0, g._onKillCb);
      return (sr.chests.length === 2 && sr.chests[0].evo === false && sr.chests[1].evo === true) || sr.chests.map(function (c) { return c.evo; }); });
  });
  await test('run', 'the stage clock brings the district boss at 7:30 on its own', async () => {
    await startRun();
    await G(() => { var g = PC.game.scene.getScene('PC_Game'); g.runT = 449.5; });
    await sleep(1200);
    return G(() => { var g = PC.game.scene.getScene('PC_Game');
      return (g.boss && g.boss.name === 'BIG FRANK' && g.bossSpawned) || { boss: g.boss && g.boss.name, t: g.runT, cards: g.cardsOpen, hold: g.snackHold }; });
  });
  await test('chest', 'the district boss drops an evolution chest and the run goes on', async () => {
    await startRun();
    await G(() => { var g = PC.game.scene.getScene('PC_Game'); g.snack.chests.forEach(function (c) { c.img.destroy(); c.glow.destroy(); }); g.snack.chests = [];
      g.spawnBoss('frank'); g.boss.damage(1e9, 0, 1); });
    await sleep(3600);                                 // slow-motion beat, then the chest
    return G(() => { var g = PC.game.scene.getScene('PC_Game');
      return (!g.boss && !g.won && !g.dead && g.snack.chests.length === 1 && g.snack.chests[0].kind === 'boss' && g.snack.chests[0].evo) ||
        { boss: !!g.boss, won: g.won, chests: g.snack.chests.map(function (c) { return c.kind + c.evo; }) }; });
  });
  await test('chest', 'a chest overlay and the level-up cards never stack', async () => {
    return G(() => { var g = PC.game.scene.getScene('PC_Game');
      g.snack.chests.forEach(function (c) { c.img.destroy(); c.glow.destroy(); }); g.snack.chests = [];
      PC.SnackChest.open(g, 'normal', false);
      g.gainXp(200);
      var stacked = g.cardsOpen;
      g.releaseHold();
      var after = g.cardsOpen;
      var n = 0; while (g.cardsOpen && n++ < 50) g.pickCard(g._shownCards[0]);
      g.children.list.filter(function (o) { return o.depth >= 200 && o.depth <= 203; }).forEach(function (o) { o.destroy(); });
      return (!stacked && after) || { stacked: stacked, after: after }; });
  });

  // ================= ACHIEVEMENTS, GATES AND DEATH =================
  await test('gates', 'reaching level 20 on Main Street opens the Park on the spot, and dying keeps it', async () => {
    await startRun();
    const mid = await G(() => { var g = PC.game.scene.getScene('PC_Game');
      for (var i = 0; i < 40 && g.level < 20; i++) g.gainXp(g.xpNext / (PC.SNACK.GEM_VALUE * g.snack.stage.mods.xp) + 1);
      return { lv: g.level, open: PC.SnackProfile.stageOpen('park') }; });
    await G(() => { var g = PC.game.scene.getScene('PC_Game'); g.invUntil = 0; g.hp = 0; g.cardsOpen = false; g.die(); });
    await page.waitForFunction(() => PC.game.scene.isActive('PC_SnackResults'), null, { timeout: 8000 });
    const after = await G(() => { PC.SnackProfile.reload(); return PC.SnackProfile.stageOpen('park'); });
    return (mid.lv >= 20 && mid.open && after) || { mid, after };
  });
  await test('gates', 'stages 3/4/5 open at level 30/40/50 of the stage before', () => G(() => {
    var S = PC.SNACK.STAGES;
    return S[2].gate.stage === 'park' && S[2].gate.level === 30 && S[3].gate.level === 40 && S[4].gate.level === 50 &&
      ['gate_sub', 'gate_labs', 'gate_under'].every(function (id) { return PC.SNACK.achievementById(id); });
  }));
  await test('gates', 'weapon-rank goals use WEAPON rank, not character level', async () => {
    await startRun();
    return G(() => { var g = PC.game.scene.getScene('PC_Game'), sr = g.snack;
      sr.run.level = 50; PC.SnackUnlocks.check(sr);
      var before = PC.SnackProfile.isDone('whisk4');
      var w = PC.SNACK.WEAPONS.whisk.make(g); w.max = 8; g.weapons.push(w);
      while (w.level < 4) PC.SnackDraft.rankUp(g, w);
      return (!before && PC.SnackProfile.isDone('whisk4')) || { before: before }; });
  });
  await test('gates', 'single-run goals do not add up across runs; lifetime goals do', async () => {
    await startRun();
    await G(() => { var sr = PC.game.scene.getScene('PC_Game').snack;
      PC.SnackUnlocks.event(sr, 'gold', 200); PC.SnackUnlocks.event(sr, 'heal', 200); sr.end('quit'); });
    await page.waitForFunction(() => PC.game.scene.isActive('PC_SnackResults'));
    await startRun({ keep: true });
    return G(() => { var sr = PC.game.scene.getScene('PC_Game').snack;
      PC.SnackUnlocks.event(sr, 'gold', 200); PC.SnackUnlocks.event(sr, 'heal', 150);
      PC.SnackUnlocks.event(sr, 'tick', 1);               // goals are checked on the half-second tick
      return (!PC.SnackProfile.isDone('rich') && PC.SnackProfile.isDone('nayah') && PC.SnackProfile.heroState('nayah') === 'forSale') ||
        { rich: PC.SnackProfile.isDone('rich'), nayah: PC.SnackProfile.isDone('nayah'), healed: PC.SnackProfile.get().life.healed }; });
  });
  await test('gates', 'surviving the full 15:00 registers the clear', async () => {
    await startRun();
    await G(() => { var g = PC.game.scene.getScene('PC_Game'); g.runT = PC.SNACK.RUN_SEC + 0.1; });
    await page.waitForFunction(() => PC.game.scene.isActive('PC_SnackResults'), null, { timeout: 9000 });
    return G(() => { var s = PC.game.scene.getScene('PC_SnackResults'), d = PC.SnackProfile.get();
      return (s.d.cleared && d.life.clears.street && d.records.street.cleared && PC.SnackProfile.isDone('clear_street')) || s.d; });
  });
  await test('gates', 'an early death still keeps every coin and unlock', async () => {
    await startRun();
    const r = await G(() => { var g = PC.game.scene.getScene('PC_Game'), sr = g.snack;
      g.runT = 65; PC.SnackUnlocks.event(sr, 'tick', 65);
      sr.collect({ kind: 'coinbag', val: 40 });
      var w = PC.SnackProfile.get().wallet;
      g.invUntil = 0; g.hp = 0; g.die();
      return { w: w, surv1: PC.SnackProfile.isDone('surv1') }; });
    await page.waitForFunction(() => PC.game.scene.isActive('PC_SnackResults'));
    return G((r) => { PC.SnackProfile.reload(); var d = PC.SnackProfile.get();
      return (d.wallet === r.w && r.surv1 && PC.SnackProfile.isDone('surv1') && d.runCount === 1) || { r: r, wallet: d.wallet, runs: d.runCount }; }, r);
  });
  await test('gates', 'rewards pay exactly once, even across a reload, and a run is counted once', () => G(() => {
    var P = PC.SnackProfile; P.reset();
    var a = PC.SNACK.achievementById('pops100');
    var first = P.complete(a), second = P.complete(a);
    P.reload();
    var third = P.complete(a);
    var run = { id: 'r1', stage: 'street', level: 3, t: 10, cleared: false };
    var c1 = P.commitRun(run), c2 = P.commitRun(run);
    return (first && !second && !third && P.get().wallet === 50 && c1 && !c2 && P.get().runCount === 1) || { first: first, second: second, third: third, wallet: P.get().wallet };
  }));

  // ================= SHOP AND PROFILE =================
  await test('shop', 'hero price goes up 10% of its base per hero already bought (additive)', () => G(() => {
    var P = PC.SnackProfile; P.reset(); var d = P.get(); d.wallet = 5000;
    var p0 = P.heroPrice('kevin'); P.buyHero('victoria');
    var p1 = P.heroPrice('kevin'); P.buyHero('josh');
    var p2 = P.heroPrice('kevin');
    return (p0 === 500 && p1 === 550 && p2 === 600) || [p0, p1, p2];
  }));
  await test('shop', 'buying a hero takes the gold and sticks after a reload', () => G(() => {
    var P = PC.SnackProfile; P.reset(); P.get().wallet = 30; P.save();
    var ok = P.buyHero('victoria'); var broke = P.buyHero('josh');
    P.reload();
    return (ok && !broke && P.get().wallet === 20 && P.heroState('victoria') === 'owned') || P.get();
  }));
  await test('shop', 'PowerUp price = base x (1 + owned) + floor(20 x 1.1^all ranks)', () => G(() => {
    var P = PC.SnackProfile; P.reset(); P.get().wallet = 1e6;
    var c = [P.powerupCost('might')]; P.buyPowerup('might');
    c.push(P.powerupCost('might')); c.push(P.powerupCost('greed')); P.buyPowerup('greed');
    c.push(P.powerupCost('might'));
    var want = [200, 400 + Math.floor(20 * 1.1), 200 + Math.floor(20 * 1.1), 400 + Math.floor(20 * Math.pow(1.1, 2))];
    return c.join() === want.join() || { got: c, want: want };
  }));
  await test('shop', 'REFUND ALL returns every coin, resets ranks, keeps heroes and unlocks', () => G(() => {
    var P = PC.SnackProfile; P.reset(); var d = P.get(); d.wallet = 3000;
    P.buyHero('victoria'); P.complete(PC.SNACK.achievementById('pops100'));
    var before = d.wallet;
    P.buyPowerup('might'); P.buyPowerup('might'); P.buyPowerup('greed');
    P.refundAll();
    return (d.wallet === before && P.totalRanks() === 0 && P.heroState('victoria') === 'owned' && P.isDone('pops100')) || d;
  }));
  await test('shop', 'an older save missing new fields loads without losing money or unlocks', () => G(() => {
    localStorage.setItem('portioncontrol.snack', JSON.stringify({ schemaVersion: 1, wallet: 777, heroes: { owned: ['danny', 'josh'], forSale: [] },
      stages: ['street', 'park'], powerups: { might: 2 }, weapons: ['blaster'], passives: ['battery'], done: ['lvl5'],
      life: { kills: 10 } }));
    var P = PC.SnackProfile; P.reload(); var d = P.get();
    return (d.wallet === 777 && P.heroState('josh') === 'owned' && P.stageOpen('park') && P.rank('might') === 2 &&
      P.isDone('lvl5') && d.life.healed === 0 && d.weapons.indexOf('whisk') >= 0 && d.relics.length === 0) || d;
  }));
  await test('shop', 'a PowerUp actually changes the run (BIGGER MUSCLES raises live damage)', async () => {
    await startRun({ powerups: { might: 5 } });
    return G(() => { var g = PC.game.scene.getScene('PC_Game');
      return Math.abs(g.stats.dmgMult / (g.stats.heroDmg / Math.pow(1, 1)) - 1) < 1e-9 && g.stats.heroDmg > 1.2 || g.stats; });
  });

  // ================= SEPARATE SAVES =================
  await test('saves', 'a Snack run never writes Story gold, Story power-ups or Story stats', async () => {
    await G(() => { try { localStorage.setItem('portioncontrol.gold', '123'); } catch (e) {} });
    const storyBefore = await G(() => JSON.stringify([localStorage.getItem('portioncontrol.gold'), localStorage.getItem('portioncontrol.meta')]));
    await startRun();
    await G(() => { var g = PC.game.scene.getScene('PC_Game'), sr = g.snack;
      sr.collect({ kind: 'coin', val: 5 }); sr.collect({ kind: 'coinbag', val: 40 }); g.kills += 50; sr.end('quit'); });
    await page.waitForFunction(() => PC.game.scene.isActive('PC_SnackResults'));
    const storyAfter = await G(() => JSON.stringify([localStorage.getItem('portioncontrol.gold'), localStorage.getItem('portioncontrol.meta')]));
    return storyBefore === storyAfter || { storyBefore, storyAfter };
  });
  await test('saves', 'Story power-ups never reach a Snack run (and Snack ones never reach Story)', async () => {
    await G(() => { var d = JSON.parse(localStorage.getItem('portioncontrol.meta') || '{"pu":{},"st":{}}'); d.pu = d.pu || {}; d.pu.muscles = 5;
      localStorage.setItem('portioncontrol.meta', JSON.stringify(d)); });
    await page.reload(); await page.waitForFunction(() => window.PC && PC.game && PC.game.scene.isActive('PC_Title'));
    await startRun();
    const snackDmg = await G(() => PC.game.scene.getScene('PC_Game').stats.dmgMult);
    return Math.abs(snackDmg - 1) < 1e-9 || { snackDmg };
  });
  await test('saves', 'Story fix: BIGGER MUSCLES now really raises Story damage', async () => {
    await G(() => { PC.STORY.pendingMission = PC.STORY.chainById('stage1'); PC.storyState.markTutorialSeen();
      PC.game.scene.getScenes(true)[0].scene.start('PC_Game'); });
    await page.waitForFunction(() => PC.game.scene.isActive('PC_Game') && PC.game.scene.getScene('PC_Game').storyMission);
    await sleep(300);
    return G(() => { var g = PC.game.scene.getScene('PC_Game');
      return (!g.snack && g.stats.dmgMult > 1.15) || { dmg: g.stats.dmgMult, heroDmg: g.stats.heroDmg }; });
  });

  // ================= OPTIONS (v0.80.1) =================
  // real mouse clicks on a label, through the camera (and, in PC_Game,
  // the camera-pinned UI container: getBounds is already world space)
  const clickLabel = async (p, key, label) => {
    const sp = await p.evaluate(({ key, label }) => {
      const s = PC.game.scene.getScene(key), all = [];
      const walk = (l) => l.forEach(o => { all.push(o); if (o.list) walk(o.list); });
      walk(s.children.list);
      const t = all.filter(o => o.text === label && o.visible !== false).pop();
      if (!t) return null;
      const b = t.getBounds(), cam = s.cameras.main, wv = cam.worldView, c = PC.game.canvas, r = c.getBoundingClientRect();
      return { x: r.left + (b.centerX - wv.x) * cam.zoom * r.width / c.width, y: r.top + (b.centerY - wv.y) * cam.zoom * r.height / c.height };
    }, { key, label });
    if (!sp) throw new Error('no ' + label + ' on ' + key);
    await p.mouse.click(sp.x, sp.y);
  };
  const optOpen = (key) => G((k) => !!PC.game.scene.getScene(k)._optionsOpen, key);
  await test('options', 'title OPTIONS button opens the panel; DONE closes it', async () => {
    await G(() => { PC.game.scene.getScenes(true)[0].scene.start('PC_Title'); }); await sleep(400);
    await G(() => { var t = PC.game.scene.getScene('PC_Title'); t.tweens.timeScale = 50; t.time.timeScale = 50; }); await sleep(400);
    await clickLabel(page, 'PC_Title', 'OPTIONS'); await sleep(150);
    const a = await optOpen('PC_Title');
    await clickLabel(page, 'PC_Title', 'DONE'); await sleep(150);
    const b = await optOpen('PC_Title');
    return (a && !b) || { opened: a, stillOpen: b };
  });
  await test('options', 'hub OPTIONS: volumes and damage numbers change and are saved', async () => {
    await G(() => { var d = PC.SnackProfile.get(); d.seenIntro = true; PC.SnackProfile.save();
      PC.game.scene.getScenes(true)[0].scene.start('PC_SnackHub'); }); await sleep(400);
    const before = await G(() => !!PC.settings.dmgNums);
    await clickLabel(page, 'PC_SnackHub', 'OPTIONS'); await sleep(150);
    if (!(await optOpen('PC_SnackHub'))) return 'panel did not open';
    await clickLabel(page, 'PC_SnackHub', 'DAMAGE NUMBERS'); await sleep(100);
    return G((before) => {
      var s = PC.game.scene.getScene('PC_SnackHub');
      // drive the sliders through their own set() (the real-mouse drag is
      // covered by the scratch harness; this pins the save path)
      PC.audio.setMusicVol(0.3); PC.audio.setSfxVol(0.7);
      var a = null, st = null;
      try { a = JSON.parse(localStorage.getItem('portioncontrol.audio')); st = JSON.parse(localStorage.getItem('portioncontrol.settings')); } catch (e) {}
      var ok = PC.settings.dmgNums === !before && st && st.dmgNums === !before && a && Math.abs(a.music - 0.3) < 1e-6 && Math.abs(a.sfx - 0.7) < 1e-6;
      PC.setDmgNumbers(before);
      return ok || { dmg: PC.settings.dmgNums, st: st, a: a };
    }, before);
  });
  await test('options', 'in a run: pause > OPTIONS opens over the pause; Esc closes OPTIONS first, then the pause', async () => {
    await startRun();
    await G(() => PC.game.scene.getScene('PC_Game').snack.pause()); await sleep(200);
    await clickLabel(page, 'PC_Game', 'OPTIONS'); await sleep(150);
    const a = await optOpen('PC_Game');
    await page.keyboard.press('Escape'); await sleep(150);
    const s1 = await G(() => { var g = PC.game.scene.getScene('PC_Game'); return { opt: !!g._optionsOpen, hold: !!g.snackHold }; });
    await page.keyboard.press('Escape'); await sleep(150);
    const s2 = await G(() => { var g = PC.game.scene.getScene('PC_Game'); return { opt: !!g._optionsOpen, hold: !!g.snackHold }; });
    return (a && !s1.opt && s1.hold && !s2.opt && !s2.hold) || { opened: a, s1, s2 };
  });
  await test('options', 'district map (the Story pause): OPTIONS opens; Esc closes OPTIONS, then the map', async () => {
    await startRun({ stage: 'park' });
    await G(() => PC.game.scene.getScene('PC_Game').openMap()); await sleep(400);
    await clickLabel(page, 'PC_MapView', 'OPTIONS'); await sleep(150);
    const a = await optOpen('PC_MapView');
    await page.keyboard.press('Escape'); await sleep(150);
    const s1 = await G(() => ({ map: PC.game.scene.isActive('PC_MapView'), opt: !!PC.game.scene.getScene('PC_MapView')._optionsOpen }));
    await page.keyboard.press('Escape'); await sleep(200);
    const s2 = await G(() => ({ map: PC.game.scene.isActive('PC_MapView'), running: !PC.game.scene.isPaused('PC_Game') }));
    return (a && s1.map && !s1.opt && !s2.map && s2.running) || { opened: a, s1, s2 };
  });
  await test('options', 'landscape (1280x720): every hub and title button is on screen', async () => {
    const c3 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    await c3.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/.test(t)) return null; return o.call(this, t, ...a); }; });
    const p3 = await boot(c3);
    const off = [];
    for (const k of ['PC_Title', 'PC_SnackHub']) {
      if (k !== 'PC_Title') { await p3.evaluate((key) => PC.game.scene.getScenes(true)[0].scene.start(key), k); await sleep(400); }
      else { await p3.evaluate(() => { var t = PC.game.scene.getScene('PC_Title'); t.tweens.timeScale = 50; t.time.timeScale = 50; }); await sleep(400); }
      off.push(...await p3.evaluate((key) => { var s = PC.game.scene.getScene(key), H = PC.RENDER.H, W = PC.RENDER.W, out = [];
        s.children.list.forEach(o => { if (o.text && o.visible) { var b = o.getBounds();
          if (b.top < 0 || b.bottom > H || b.left < 0 || b.right > W) out.push(key + ':' + o.text); } });
        return out; }, k));
    }
    await c3.close();
    return off.length === 0 || off;
  });

  // ================= RESILIENCE =================
  await test('itch', 'with storage blocked (itch iframe), a full Snack menu-to-results loop runs without errors', async () => {
    const ctx2 = await browser.newContext({ viewport: { width: 480, height: 854 } });
    await ctx2.addInitScript(() => {
      const o = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/.test(t)) return null; return o.call(this, t, ...a); };
      const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
      Object.defineProperty(window, 'localStorage', { get: boom, configurable: true });
      Object.defineProperty(window, 'sessionStorage', { get: boom, configurable: true });
    });
    const p2 = await boot(ctx2);
    for (const k of ['PC_SnackHub', 'PC_SnackHeroes', 'PC_SnackStages', 'PC_SnackShop', 'PC_SnackUnlocks']) {
      await p2.evaluate((key) => PC.game.scene.getScenes(true)[0].scene.start(key), k); await sleep(300);
      if (k === 'PC_SnackHub') await p2.evaluate(() => {   // OPTIONS writes settings: must not throw
        var o = PC.OptionsPanel.open(PC.game.scene.getScene('PC_SnackHub'));
        o.sliders[0].set(0.2); o.sliders[1].set(0.4); o.toggle.emit('pointerdown', {}, 0, 0, {}); o.close(); });
    }
    await p2.evaluate(() => PC.game.scene.getScene('PC_SnackStages').launch());
    await p2.waitForFunction(() => PC.game.scene.isActive('PC_Game'));
    await p2.evaluate(() => { var g = PC.game.scene.getScene('PC_Game'); g.invUntil = 1e9; g.gainXp(30);
      var n = 0; while (g.cardsOpen && n++ < 20) g.pickCard(g._shownCards[0]);
      g.snack.collect({ kind: 'coin', val: 5 }); PC.SnackChest.grant(g, 'normal', true); g.snack.end('quit'); });
    await p2.waitForFunction(() => PC.game.scene.isActive('PC_SnackResults'));
    const errs = p2._errs.slice(); await ctx2.close();
    return errs.length === 0 || errs;
  });
  await test('itch', 'no page errors anywhere in this suite', async () => page._errs.length === 0 || page._errs.slice(0, 5));

  // ================= REPORT =================
  let pass = 0;
  let sec = '';
  for (const r of results) {
    if (r.section !== sec) { sec = r.section; console.log('\n[' + sec + ']'); }
    console.log((r.ok ? '  PASS  ' : '  FAIL  ') + r.name + (r.ok ? '' : '\n        -> ' + r.why));
    if (r.ok) pass++;
  }
  console.log('\n' + pass + ' / ' + results.length + ' passed');
  await browser.close(); srv.close();
  process.exit(pass === results.length ? 0 : 1);
})();
