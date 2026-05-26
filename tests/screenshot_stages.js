// Render each stage at its spawn point and one mid-level vantage,
// save PNGs for visual spot-check.
const p = require('/tmp/node_modules/puppeteer');
const w = (ms) => new Promise(r => setTimeout(r, ms));
const STAGES = [[1,1],[2,1],[2,2],[3,1],[3,2]];

(async () => {
  const b = await p.launch({ headless: true, args: ['--no-sandbox','--allow-file-access-from-files','--disable-web-security'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  await pg.goto('file:///home/user/SuperDude-Rescue-/index.html');
  for (let i = 0; i < 60; i++) {
    if (await pg.evaluate(() => window.SDD && SDD.sprites && SDD.sprites.pixelLab && SDD.sprites.pixelLab.ready)) break;
    await w(200);
  }
  await pg.evaluate(() => { SDD.save.data.options.god = true; SDD.save.save(); });
  for (const [day, stage] of STAGES) {
    await pg.evaluate((d, s) => SDD.setScene('level', { day: d, stage: s }), day, stage);
    await w(400);
    // spawn shot
    await pg.screenshot({ path: `/tmp/preflight_${day}_${stage}_spawn.png` });
    // teleport to ~25% in
    const width = await pg.evaluate(() => (SDD.levels[SDD.scene.day + '-' + SDD.scene.stage].width));
    await pg.evaluate((tx) => {
      var s = SDD.scene, pl = s.player;
      pl.x = tx * 16; pl.vx = 0; pl.vy = 0;
      s.camera.x = Math.max(0, pl.x - 160);
    }, Math.floor(width * 0.25));
    await w(200);
    await pg.screenshot({ path: `/tmp/preflight_${day}_${stage}_quarter.png` });
    // teleport to ~75%
    await pg.evaluate((tx) => {
      var s = SDD.scene, pl = s.player;
      pl.x = tx * 16; pl.vx = 0; pl.vy = 0;
      s.camera.x = Math.max(0, pl.x - 160);
    }, Math.floor(width * 0.75));
    await w(200);
    await pg.screenshot({ path: `/tmp/preflight_${day}_${stage}_three_quarter.png` });
    // teleport to exit
    await pg.evaluate((tx) => {
      var s = SDD.scene, pl = s.player;
      pl.x = tx * 16; pl.vx = 0; pl.vy = 0;
      s.camera.x = Math.max(0, pl.x - 320);
    }, width - 8);
    await w(200);
    await pg.screenshot({ path: `/tmp/preflight_${day}_${stage}_end.png` });
    console.log(`shot ${day}-${stage} (width ${width})`);
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(2); });
