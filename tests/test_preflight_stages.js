// Pre-flight check for stages: load each, verify no JS errors, the
// player spawns, doesn't insta-die, and a timepart entity exists.
const p = require('/tmp/node_modules/puppeteer');
const w = (ms) => new Promise(r => setTimeout(r, ms));

const STAGES = [
  { day: 1, stage: 1 },
  { day: 2, stage: 1 },
  { day: 2, stage: 2 },
  { day: 3, stage: 1 },
  { day: 3, stage: 2 },
];

(async () => {
  const b = await p.launch({ headless: true, args: ['--no-sandbox','--allow-file-access-from-files','--disable-web-security'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 640, height: 360 });
  const errors = [];
  pg.on('pageerror', e => errors.push(e.message));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await pg.goto('file:///home/user/SuperDude-Rescue-/index.html');
  for (let i = 0; i < 60; i++) {
    if (await pg.evaluate(() => window.SDD && SDD.sprites && SDD.sprites.pixelLab && SDD.sprites.pixelLab.ready)) break;
    await w(200);
  }
  await pg.evaluate(() => { SDD.save.data.options.god = false; SDD.save.save(); });
  let fails = 0;
  for (const s of STAGES) {
    errors.length = 0;
    await pg.evaluate((day, stage) => SDD.setScene('level', { day, stage }), s.day, s.stage);
    await w(500);
    const initial = await pg.evaluate(() => {
      var sc = SDD.scene, pl = sc.player;
      var items = sc.items || [], enemies = sc.enemies || [];
      var hasTimepart = items.some(e => e instanceof SDD.ent.TimePart);
      var hasPlayer = !!pl;
      var L = SDD.levels[sc.day + '-' + sc.stage] || {};
      return {
        levelName: L.name || '?',
        width: L.width, height: L.height,
        playerX: pl && pl.x, playerY: pl && pl.y,
        playerDead: pl && pl.dead,
        hasTimepart, hasPlayer,
        itemCount: items.length,
        enemyCount: enemies.length,
      };
    });
    await w(2000);
    const after = await pg.evaluate(() => {
      var pl = SDD.scene.player;
      return { x: pl.x, y: pl.y, dead: pl.dead, deadDone: pl.deadDone };
    });
    const label = `${s.day}-${s.stage} (${initial.levelName})`;
    const issues = [];
    if (errors.length) issues.push(`${errors.length} js errors: ` + errors.slice(0,2).join(' | '));
    if (!initial.hasTimepart) issues.push('no timepart entity');
    if (initial.playerDead || after.dead) issues.push('player dead');
    if (after.y > (initial.height + 4) * 16) issues.push('player fell out of world');
    if (!initial.hasPlayer) issues.push('no player');
    const ok = issues.length === 0;
    if (!ok) fails++;
    console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label.padEnd(28)} enemies=${initial.enemyCount} items=${initial.itemCount} px=${(initial.playerX|0)} py=${(initial.playerY|0)} -> py=${(after.y|0)}${issues.length ? '  [' + issues.join('; ') + ']' : ''}`);
  }
  await b.close();
  console.log(`\n=== ${fails} / ${STAGES.length} stages failed ===`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
