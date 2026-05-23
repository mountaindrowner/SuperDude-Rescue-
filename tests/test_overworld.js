// Overworld placement test.
//
// Verifies that each STAGE in js/scenes.js:
//   1. Has Danny's feet (cur.x, cur.dy) landing ON the painted island
//      (inside the hand-measured ground-truth bbox).
//   2. Has Danny's feet in the TOP STRIP of the island (so he stands on
//      the surface, not floats in the middle).
//
// Plus an in-game screenshot check (run after the static test passes):
//   3. Renders the overworld with each stage selected, screenshots at
//      320x180 native, and verifies the bobbing arrow indicator's
//      bright-yellow pixels appear above Danny on the correct island.
//
// Run:  node tests/test_overworld.js              (static check only)
//       node tests/test_overworld.js --ingame     (static + browser render)
// Exits non-zero if any stage fails. Writes a debug image to
// /tmp/over_test_debug.png showing each island bbox + Danny coord dot.

const fs = require('fs');
const { loadImage, createCanvas } = require('/tmp/node_modules/canvas');

const GAME_W = 320, GAME_H = 180;

// Hand-measured island bounding boxes in 320x180 game coords against
// assets/overworld.png (the painted serpentine map). Format: [x0,y0,x1,y1]
// inclusive. These are the painted island silhouettes - any frame/Danny
// placement should sit inside these for the stage to "land in the
// center" per Mark's brief.
// bbox = the painted island silhouette. walkable_y = the band where
// Danny can plausibly stand on top of the island surface (i.e. the
// "visible top edge plus a few px in"). Islands with tall features
// (mountains' peaks, Eden's tree) have walkable_y override that points
// at the actual ground level rather than the bbox top.
const ISLANDS = [
  { d:1, s:1, name:'COSMIC VOID', bbox:[ 16, 48,  48,  72], walkable_y:[48,54] },
  { d:2, s:1, name:'DAWN SKY',    bbox:[ 56, 48,  96,  80], walkable_y:[48,56] },
  { d:2, s:2, name:'OCEAN',       bbox:[104, 56, 152,  88], walkable_y:[56,64] },
  // Mountains are floating peaks (no flat top). Danny stands on the
  // rocky shelf at the path-connector level (~y=52-60).
  { d:3, s:1, name:'MOUNTAINS',   bbox:[168, 36, 216,  72], walkable_y:[50,62] },
  { d:3, s:2, name:'FOREST',      bbox:[216, 48, 272,  88], walkable_y:[50,58] },
  { d:4, s:1, name:'DESERT',      bbox:[272, 56, 318,  88], walkable_y:[56,64] },
  { d:4, s:2, name:'NIGHT SKY',   bbox:[264,108, 318, 160], walkable_y:[108,124] },
  { d:5, s:1, name:'CLOUDS',      bbox:[200,104, 264, 152], walkable_y:[104,120] },
  { d:5, s:2, name:'UNDERWATER',  bbox:[128,112, 200, 152], walkable_y:[112,124] },
  { d:6, s:1, name:'SAVANNA',     bbox:[ 72,112, 128, 152], walkable_y:[112,124] },
  { d:6, s:2, name:'VILLAGE',     bbox:[  8,104,  72, 152], walkable_y:[108,124] },
  // Eden has a tall tree; grass walkable surface is below at y~150-166.
  { d:7, s:1, name:'EDEN GARDEN', bbox:[208,128, 272, 176], walkable_y:[152,168] }
];

function parseStages() {
  const src = fs.readFileSync('js/scenes.js', 'utf8');
  const stageBlock = src.match(/var STAGES = \[([\s\S]*?)\];/)[1];
  const lines = stageBlock.split('\n').filter(l => l.includes('{ d:'));
  return lines.map(l => {
    const m = l.match(/d:\s*(\d+),\s*s:\s*(\d+),\s*x:\s*(\d+),(?:\s*y:\s*(\d+),)?\s*dy:\s*(\d+)/);
    if (!m) throw new Error('Cant parse: ' + l);
    return { d:+m[1], s:+m[2], x:+m[3], y: m[4]?+m[4]:null, dy:+m[5], _line:l.trim() };
  });
}

function verifyStatic() {
  const stages = parseStages();
  let fails = 0;
  console.log('\n=== Static placement check (Danny on painted island) ===');
  ISLANDS.forEach((isl, idx) => {
    const cur = stages[idx];
    if (!cur || cur.d !== isl.d || cur.s !== isl.s) {
      console.log(`#${idx+1} ${isl.name}: FAIL - STAGES[${idx}] missing or wrong (d,s)`);
      fails++; return;
    }
    const [x0, y0, x1, y1] = isl.bbox;
    const errs = [];
    // Danny feet inside bbox?
    if (cur.x < x0 || cur.x > x1) errs.push(`Danny x=${cur.x} outside [${x0}..${x1}]`);
    if (cur.dy < y0 || cur.dy > y1) errs.push(`Danny dy=${cur.dy} outside [${y0}..${y1}]`);
    // Danny in the top "standing" portion?
    // For islands with explicit walkable_y, use that. Otherwise the
    // top quarter of the bbox (so he visibly stands on the surface).
    const wy = isl.walkable_y || [y0, y0 + Math.ceil((y1 - y0) / 3)];
    if (cur.dy < wy[0] || cur.dy > wy[1]) {
      errs.push(`Danny dy=${cur.dy} outside walkable y-range [${wy[0]}..${wy[1]}]`);
    }
    if (errs.length) {
      console.log(`#${idx+1} ${isl.name.padEnd(12)}: FAIL`);
      errs.forEach(e => console.log('   - ' + e));
      // Suggest a fix: center x in bbox, dy at top of walkable range + 4
      const sx = Math.round((x0 + x1) / 2);
      const sdy = wy[0] + 4;
      console.log(`   suggest: x=${sx} dy=${sdy}`);
      fails++;
    } else {
      console.log(`#${idx+1} ${isl.name.padEnd(12)}: OK  (x=${cur.x} dy=${cur.dy} bbox=[${x0},${y0}-${x1},${y1}])`);
    }
  });
  return { stages, fails };
}

async function paintDebug(stages) {
  const img = await loadImage('assets/overworld.png');
  const native = createCanvas(GAME_W, GAME_H);
  const ng = native.getContext('2d');
  ng.imageSmoothingEnabled = false;
  ng.drawImage(img, 0, 0, GAME_W, GAME_H);
  const out = createCanvas(GAME_W * 6, GAME_H * 6);
  const og = out.getContext('2d');
  og.imageSmoothingEnabled = false;
  og.drawImage(native, 0, 0, GAME_W * 6, GAME_H * 6);
  ISLANDS.forEach((isl, idx) => {
    const [x0, y0, x1, y1] = isl.bbox;
    og.strokeStyle = 'lime'; og.lineWidth = 2;
    og.strokeRect(x0*6, y0*6, (x1-x0)*6, (y1-y0)*6);
    if (isl.walkable_y) {
      og.strokeStyle = 'rgba(0,255,255,0.7)'; og.lineWidth = 1;
      og.strokeRect(x0*6, isl.walkable_y[0]*6, (x1-x0)*6, (isl.walkable_y[1]-isl.walkable_y[0])*6);
    }
    const cur = stages[idx];
    if (cur) {
      og.fillStyle = 'red'; og.beginPath();
      og.arc(cur.x*6, cur.dy*6, 6, 0, 6.28); og.fill();
      og.fillStyle = 'yellow'; og.font = 'bold 18px sans';
      og.fillText('#'+(idx+1), (x0+1)*6, (y0-1)*6);
    }
  });
  fs.writeFileSync('/tmp/over_test_debug.png', out.toBuffer('image/png'));
  console.log('\nDebug: /tmp/over_test_debug.png (GREEN=island bbox, CYAN=walkable area, RED=Danny feet)');
}

async function verifyInGame(stages) {
  // Launch puppeteer and screenshot the overworld at native 320x180
  // with each stage selected. Check that:
  //   1. Danny's coat (white pixels) is in the upper portion of the bbox
  //   2. The bobbing yellow arrow is just above where Danny is
  const puppeteer = require('/tmp/node_modules/puppeteer');
  const b = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--allow-file-access-from-files','--disable-web-security'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1184, height: 666 });
  let pageErrs = [];
  pg.on('pageerror', e => pageErrs.push(e.message));
  await pg.goto('file://' + require('path').resolve('index.html'));
  // wait for sprites
  for (let i = 0; i < 60; i++) {
    const r = await pg.evaluate(() => SDD.sprites.pixelLab && SDD.sprites.pixelLab.ready);
    if (r) break; await new Promise(r => setTimeout(r, 200));
  }
  await pg.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 600));
  await pg.evaluate(() => {
    SDD.save.data.completedStages = ['1-1','2-1','2-2','3-1','3-2','4-1','4-2','5-1','5-2','6-1','6-2','7-1'];
    SDD.save.data.options.god = true;
    SDD.save.save();
    SDD.setScene('overworld');
  });
  await new Promise(r => setTimeout(r, 400));

  let fails = 0;
  console.log('\n=== In-game render check ===');
  for (let i = 0; i < 12; i++) {
    await pg.evaluate((idx) => {
      SDD.scene.idx = idx;
      // Snap Danny to target instantly (skip glide for deterministic test)
      var s = SDD.scene; s.dannyX = SDD.scene_overworld_target_x = 0;
      // Force glide complete by running 30 update ticks worth of damping
      for (var n = 0; n < 60; n++) {
        s.dannyX += (SDD._STAGES_X_ ? SDD._STAGES_X_[idx] : 0);
      }
    }, i);
    await new Promise(r => setTimeout(r, 700)); // let glide settle
    // Screenshot the actual game canvas at 320x180 native.
    // Use the page-level screenshot then resize, since the canvas is upscaled in DOM.
    const buf = await pg.screenshot();
    const img = await loadImage(buf);
    const c = createCanvas(GAME_W, GAME_H);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, GAME_W, GAME_H);
    const data = g.getImageData(0, 0, GAME_W, GAME_H).data;
    fs.writeFileSync('/tmp/over_native_' + (i+1) + '.png', c.toBuffer('image/png'));
    // Verify the bobbing arrow is at the expected position above Danny.
    // Arrow draws at approx (stage.x, stage.dy - 26 - 8) = stage.dy - 34
    // give or take 2 px (bob) and 1 px integer rounding.
    const isl = ISLANDS[i];
    const cur = stages[i];
    const expectX = cur.x;
    const expectY = cur.dy - 34;
    // Sample an 8x10 window centered on expected position, count yellow pixels.
    // Yellow arrow color #ffd23a -> (255, 210, 58)
    let yellowCount = 0;
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = expectX + dx, y = expectY + dy;
        if (x < 0 || y < 0 || x >= GAME_W || y >= GAME_H) continue;
        const k = (y * GAME_W + x) * 4;
        const r = data[k], gn = data[k+1], b = data[k+2];
        if (r > 230 && gn > 180 && gn < 230 && b < 100) yellowCount++;
      }
    }
    // The arrow's yellow fill spans 7+5+3+1 = 16 pixels. Require at
    // least 6 yellow pixels in the window (sloppy enough to allow
    // for ±2 px bob and for some pixels being on path/island edge,
    // strict enough to fail when the arrow simply isn't there).
    const [x0, y0, x1, y1] = isl.bbox;
    if (yellowCount < 6) {
      console.log(`#${i+1} ${isl.name.padEnd(12)}: FAIL - only ${yellowCount} yellow px at expected arrow window centered (${expectX},${expectY})`);
      fails++;
    } else {
      // Also verify Danny is on the right island visually:
      // find his coat (white pixels) at expected danny torso area.
      // Danny torso at (x, dy - 12), width ~10 px wide.
      let whiteCount = 0;
      for (let dy = -16; dy <= -4; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          const x = cur.x + dx, y = cur.dy + dy;
          if (x < 0 || y < 0 || x >= GAME_W || y >= GAME_H) continue;
          const k = (y * GAME_W + x) * 4;
          const r = data[k], gn = data[k+1], b = data[k+2];
          if (r > 220 && gn > 220 && b > 220) whiteCount++;
        }
      }
      if (whiteCount < 8) {
        console.log(`#${i+1} ${isl.name.padEnd(12)}: FAIL - only ${whiteCount} white (lab coat) px where Danny should be`);
        fails++;
      } else {
        console.log(`#${i+1} ${isl.name.padEnd(12)}: OK  arrow@(${expectX},${expectY}) yellow=${yellowCount} coat=${whiteCount}`);
      }
    }
  }
  if (pageErrs.length) {
    console.log('\nPage errors:'); pageErrs.forEach(e => console.log('  ' + e)); fails += pageErrs.length;
  }
  await b.close();
  return fails;
}

(async () => {
  const { stages, fails: staticFails } = verifyStatic();
  await paintDebug(stages);
  let gameFails = 0;
  if (process.argv.includes('--ingame')) {
    gameFails = await verifyInGame(stages);
  } else {
    console.log('\n(skipping in-game render check; pass --ingame to run)');
  }
  const total = staticFails + gameFails;
  console.log(`\n=== RESULT: ${staticFails} static / ${gameFails} in-game failures ===`);
  process.exit(total ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
