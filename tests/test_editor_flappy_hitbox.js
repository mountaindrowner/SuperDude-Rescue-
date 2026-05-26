// Quick smoke test for the editor's new STAGE tab on the flappy
// stage. Verifies (a) the tab button exists, (b) clicking it shows
// the hitbox inputs populated from the level data, (c) changing an
// input updates the in-memory level data, (d) the editor reports no
// JS errors throughout.
const p = require('/tmp/node_modules/puppeteer');
const w = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await p.launch({ headless: true, args: ['--no-sandbox','--allow-file-access-from-files','--disable-web-security'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1280, height: 720 });
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) errs.push('console: ' + m.text()); });
  pg.on('dialog', async d => { await d.accept(); });
  await pg.goto('file:///home/user/SuperDude-Rescue-/index.html');
  for (let i = 0; i < 60; i++) {
    if (await pg.evaluate(() => window.SDD && SDD.sprites && SDD.sprites.pixelLab && SDD.sprites.pixelLab.ready)) break;
    await w(200);
  }
  try {
    await pg.evaluate(() => SDD.setScene('editor', { day: 5, stage: 1 }));
  } catch (e) {
    console.log('setScene editor threw:', e.message);
    console.log('errors so far:', errs);
    await b.close();
    process.exit(2);
  }
  await w(800);
  const sceneCheck = await pg.evaluate(() => ({
    sceneIsEditor: SDD.scene && SDD.scene.lvl !== undefined,
    day: SDD.scene && SDD.scene.day,
    stage: SDD.scene && SDD.scene.stage,
    uiExists: !!document.querySelector('.ed-bar.ed-right'),
  }));
  console.log('after setScene:', JSON.stringify(sceneCheck));
  if (!sceneCheck.uiExists) {
    console.log('errors:', errs);
    await b.close(); process.exit(2);
  }

  const initial = await pg.evaluate(() => {
    var ui = document.querySelector('.ed-bar.ed-right');
    var stageBtn = ui && ui.querySelector('button[data-rtab="stage"]');
    return {
      hasStageTabBtn: !!stageBtn,
      stageTabHiddenBefore: !!document.querySelector('#ed-tab-stage').hidden,
    };
  });
  await pg.evaluate(() => { document.querySelector('button[data-rtab="stage"]').click(); });
  await w(100);
  const visible = await pg.evaluate(() => {
    var T = document.querySelector('#ed-tab-stage');
    return {
      hidden: T.hidden,
      smallHitbox: SDD.scene.lvl.flappySmallHitbox,
      bigHitbox: SDD.scene.lvl.flappyBigHitbox,
      isFlappy: !!SDD.scene.lvl.flappy,
      warnHidden: !!document.querySelector('#ed-flappy-warn').hidden,
      sdx: document.querySelector('#ed-fb-sdx').value,
      sw:  document.querySelector('#ed-fb-sw').value,
      sh:  document.querySelector('#ed-fb-sh').value,
      bdx: document.querySelector('#ed-fb-bdx').value,
      bw:  document.querySelector('#ed-fb-bw').value,
      bh:  document.querySelector('#ed-fb-bh').value,
    };
  });
  // Change small h to 17 via input event
  await pg.evaluate(() => {
    var el = document.querySelector('#ed-fb-sh');
    el.value = '17';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const afterEdit = await pg.evaluate(() => ({
    smallH: SDD.scene.lvl.flappySmallHitbox.h,
    dirty: !!SDD.scene.dirty,
  }));

  // Switch to a non-flappy stage and verify warn appears
  await pg.evaluate(() => SDD.scene.switchStage(2, 1));
  await w(150);
  const onNonFlappy = await pg.evaluate(() => ({
    isFlappy: !!SDD.scene.lvl.flappy,
    warnHidden: !!document.querySelector('#ed-flappy-warn').hidden,
  }));

  await b.close();

  const ok = initial.hasStageTabBtn
    && !visible.hidden
    && visible.isFlappy
    && visible.warnHidden
    && visible.sdx == '2' && visible.sw == '9' && visible.sh == '19'
    && visible.bdx == '0' && visible.bw == '11' && visible.bh == '26'
    && afterEdit.smallH === 17 && afterEdit.dirty
    && onNonFlappy.isFlappy === false && onNonFlappy.warnHidden === false
    && errs.length === 0;
  console.log('hasStageTabBtn:', initial.hasStageTabBtn);
  console.log('tab visible after click:', !visible.hidden);
  console.log('inputs populated:', visible.sdx, visible.sw, visible.sh, '/', visible.bdx, visible.bw, visible.bh);
  console.log('edit applies to data:', afterEdit.smallH, 'dirty:', afterEdit.dirty);
  console.log('warn shows on 2-1:', !onNonFlappy.warnHidden);
  console.log('errors:', errs.length, errs.slice(0, 3));
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
