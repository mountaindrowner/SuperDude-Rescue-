// Vine reachability test for level 3-2 ("VEGETATION").
//
// For each vine listed below, spawn the player at the vine's base, hold
// UP to climb to the top, then press RIGHT + JUMP. Asserts that the
// final player y is at or above the canopy ledge's top row (i.e. the
// player actually reached the ledge instead of falling back).
//
// Failures usually mean: (a) the X tile above the vine top blocks the
// jump (vine needs to extend ABOVE the ledge top, with the ledge tile
// at the vine column being one-way), or (b) horizontal drift wasn't
// enough to land on the ledge.
//
// Run: node tests/test_vines_3_2.js
//
// NOTE: this test only pushes the player RIGHT. Vines whose ledge is
// to the LEFT (e.g. right-edge vines or out-of-ledge vines on the left
// side of a ledge) won't pass with the default direction - those are
// reachable in real play by pressing LEFT, just not by this fixture.
const p = require('/tmp/node_modules/puppeteer');
const w = (ms) => new Promise(r => setTimeout(r, ms));

const VINES = [
  { label: 'TEACH vine 30 (ledge top row 4)', spawnCol: 30, ledgeTopY: 4 },
  { label: 'TEST L canopy1 vine 66 (ledge top row 4)', spawnCol: 66, ledgeTopY: 4 },
  { label: 'TEST R canopy1 vine 78 (ledge top row 4)', spawnCol: 78, ledgeTopY: 4 },
  { label: 'TEST canopy2 vine 88 (ledge top row 3)', spawnCol: 88, ledgeTopY: 3 },
  { label: 'TEST canopy2 vine 93 (ledge top row 3)', spawnCol: 93, ledgeTopY: 3 },
  { label: 'TEST canopy2 vine 102 to Blast (row 1)', spawnCol: 102, ledgeTopY: 3 },
  { label: 'REWARD vine 218 (ledge top row 4)', spawnCol: 218, ledgeTopY: 4 },
  { label: 'REWARD vine 222 inside ledge (top row 4)', spawnCol: 222, ledgeTopY: 4 },
  { label: 'REWARD vine 225 inside ledge (top row 4)', spawnCol: 225, ledgeTopY: 4 },
];

(async () => {
  const b = await p.launch({ headless: true, args: ['--no-sandbox','--allow-file-access-from-files','--disable-web-security'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 640, height: 360 });
  pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/SuperDude-Rescue-/index.html');
  for (let i = 0; i < 40; i++) {
    if (await pg.evaluate(() => SDD.sprites.pixelLab && SDD.sprites.pixelLab.ready)) break;
    await w(200);
  }
  await pg.evaluate(() => { SDD.save.data.options.god = false; SDD.save.save(); });
  let fails = 0;
  for (const v of VINES) {
    await pg.evaluate(() => SDD.setScene('level', { day: 3, stage: 2 }));
    await w(500);
    // Place player at vine column, ground level
    await pg.evaluate((col) => {
      var s = SDD.scene, p = s.player;
      p.x = col * 16; p.y = 10 * 16;          // ground row
      p.vx = 0; p.vy = 0;
      s.camera.x = Math.max(0, p.x - 320);
    }, v.spawnCol);
    await w(120);
    const startY = await pg.evaluate(() => SDD.scene.player.y);
    // Hold UP to climb
    await pg.keyboard.down('ArrowUp');
    await w(2500);                              // 2.5 sec to climb the vine
    const climbY = await pg.evaluate(() => SDD.scene.player.y);
    // Now JUMP to clear the top + drift right. Hold space so JUMP_CUT
    // doesn't shorten the jump.
    await pg.keyboard.down('ArrowRight');
    await pg.keyboard.down(' ');                // jump
    await w(450);
    const jumpY = await pg.evaluate(() => SDD.scene.player.y);
    await pg.keyboard.up(' ');
    // Wait for player to settle
    await pg.keyboard.up('ArrowRight');
    await pg.keyboard.up('ArrowUp');
    await w(800);
    const finalY = await pg.evaluate(() => SDD.scene.player.y);
    const targetY = v.ledgeTopY * 16;           // ledge top pixel y
    const success = finalY <= targetY + 8;      // landed at/above ledge top
    const indicator = success ? 'OK' : 'FAIL';
    console.log(`${indicator}  ${v.label.padEnd(48)} start=${startY|0} climb=${climbY|0} jump=${jumpY|0} final=${finalY|0} target<=${targetY}`);
    if (!success) fails++;
  }
  console.log(`\n=== ${fails} / ${VINES.length} vine paths failed ===`);
  await b.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
