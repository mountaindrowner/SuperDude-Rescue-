// Whole-map renderer: paints every chunk of a story region with the
// GAME'S OWN painters into one downscaled image, then overlays the
// landmark plan, the spawn point and the mission route so the layout
// can be critiqued as a whole. 15x15 chunks of 512px = 7680px maps;
// rendered chunk-by-chunk so we never allocate a 59-megapixel canvas.
const { chromium } = require('playwright-core');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = '/home/user/SuperDude-Rescue-/games/portion-control';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  fs.readFile(path.join(ROOT, rel), (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(rel)] || 'application/octet-stream' });
    res.end(data);
  });
});

const MAPS = [
  { map: 'central', mission: 'stage1', out: 'map_central.png' },
  { map: 'park',    mission: 'stage3', out: 'map_park.png' },
];
const SIZE = 1800;               // output px per side

(async () => {
  await new Promise(r => server.listen(8975, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) {
      if (t === 'webgl' || t === 'webgl2' || t === 'experimental-webgl') return null;
      return orig.call(this, t, ...a);
    };
    localStorage.clear();
  });
  await page.goto('http://localhost:8975/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.PC && PC.game && PC.game.scene.isActive('PC_Title'), null, { timeout: 25000 });

  for (const job of MAPS) {
    const dataUrl = await page.evaluate(async ({ mapId, missionId, SIZE }) => {
      const scene = PC.game.scene.getScene('PC_Title');
      const def = PC.STORY.maps[mapId];
      const region = new PC.Region(def);
      PC.installRegion(region);                 // hedges/solids match the paint
      const N = def.blocks;                     // chunks per side
      const C = PC.CHUNK;
      const S = SIZE / N;                       // output px per chunk

      const out = document.createElement('canvas');
      out.width = SIZE; out.height = SIZE;
      const o = out.getContext('2d');
      o.imageSmoothingEnabled = true;
      o.fillStyle = '#120e24'; o.fillRect(0, 0, SIZE, SIZE);

      // paint each chunk at native res into a scratch canvas, then blit
      // it down - keeps peak memory at 512x512
      const tmp = document.createElement('canvas');
      tmp.width = C; tmp.height = C;
      const t = tmp.getContext('2d');
      for (let cy = 0; cy < N; cy++) {
        for (let cx = 0; cx < N; cx++) {
          t.setTransform(1, 0, 0, 1, 0, 0);
          t.clearRect(0, 0, C, C);
          region.paintChunk(scene, t, cx, cy);
          o.drawImage(tmp, 0, 0, C, C, cx * S, cy * S, S, S);
        }
      }

      // ---------- overlay ----------
      const k = SIZE / region.size;             // world px -> output px
      o.lineWidth = 1;
      // block grid, faint
      o.strokeStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i <= N; i++) {
        o.beginPath(); o.moveTo(i * S, 0); o.lineTo(i * S, SIZE); o.stroke();
        o.beginPath(); o.moveTo(0, i * S); o.lineTo(SIZE, i * S); o.stroke();
      }

      function label(text, x, y, color, size, align) {
        o.font = 'bold ' + (size || 15) + 'px monospace';
        o.textAlign = align || 'center';
        o.lineJoin = 'round';
        o.strokeStyle = 'rgba(8,6,14,0.95)'; o.lineWidth = 4;
        o.strokeText(text, x, y);
        o.fillStyle = color; o.fillText(text, x, y);
        o.lineWidth = 1;
      }

      // landmark lots
      region.marks.forEach((m) => {
        o.strokeStyle = m.accent; o.lineWidth = 2;
        o.strokeRect(m.x * k, m.y * k, m.w * k, m.h * k);
        o.lineWidth = 1;
        label(m.name, (m.cx) * k, (m.y) * k - 8, m.accent, 15);
      });

      // mission route: numbered beats joined in order
      const mission = PC.STORY.missions[missionId];
      const stops = [];
      if (mission) {
        mission.objectives.forEach((ob, i) => {
          const ids = ob.items ? ob.items.map(it => it.at) : [ob.at];
          ids.filter(Boolean).forEach((id) => {
            const mk = region.landmark(id);
            if (mk) stops.push({ n: i + 1, x: mk.cx * k, y: mk.cy * k, type: ob.type });
          });
        });
      }
      // spawn
      const sx = region.spawnX * k, sy = region.spawnY * k;
      o.setLineDash([9, 7]);
      o.strokeStyle = 'rgba(255,246,224,0.85)'; o.lineWidth = 3;
      o.beginPath(); o.moveTo(sx, sy);
      stops.forEach(s => o.lineTo(s.x, s.y));
      o.stroke();
      o.setLineDash([]); o.lineWidth = 1;

      // spawn marker
      o.fillStyle = '#a8e04a';
      o.beginPath(); o.arc(sx, sy, 13, 0, Math.PI * 2); o.fill();
      o.strokeStyle = '#0a0716'; o.lineWidth = 2; o.stroke(); o.lineWidth = 1;
      label('START', sx, sy - 20, '#a8e04a', 14);

      stops.forEach((s) => {
        o.fillStyle = '#f2c33c';
        o.beginPath(); o.arc(s.x, s.y, 17, 0, Math.PI * 2); o.fill();
        o.strokeStyle = '#0a0716'; o.lineWidth = 3; o.stroke(); o.lineWidth = 1;
        label(String(s.n), s.x, s.y + 6, '#120e24', 18);
        label(s.type.toUpperCase(), s.x, s.y + 34, '#f2c33c', 13);
      });

      // title bar
      o.fillStyle = 'rgba(8,6,14,0.85)';
      o.fillRect(0, 0, SIZE, 54);
      label(def.name + '   -   ' + region.size + 'x' + region.size + 'px   (' +
            N + 'x' + N + ' blocks)', SIZE / 2, 35, '#f7f4ef', 22);

      PC.installRegion(null);
      return out.toDataURL('image/png');
    }, { mapId: job.map, missionId: job.mission, SIZE });

    const b64 = dataUrl.split(',')[1];
    fs.writeFileSync(job.out, Buffer.from(b64, 'base64'));
    console.log('wrote', job.out, (Buffer.from(b64, 'base64').length / 1024 | 0) + 'kb');
  }
  console.log(errs.length ? 'ERRORS: ' + errs.join(' | ') : 'zero errors');
  await browser.close(); server.close();
})();
