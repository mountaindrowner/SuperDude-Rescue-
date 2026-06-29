// background.js — a fully procedural SCI-FI lab behind the play area: clean
// panels, pipe runs, glass sample tubes, gauges and blinking status lights,
// pushed into a blurred + faded layer so it reads as deep, expansive space.
// A scheduler fires one of ~12 quiet "ambient events" (a robot trundling past,
// a tube filling, a door sliding, steam venting…) every 30-60s, each with a
// muted little sound, so the lab feels alive without distracting from the game.
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.buildLab = function (scene, opts) {
  opts = opts || {};
  var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H;
  var dustMotes = [];

  function snd(name) { var a = scene.registry.get('audio'); if (a && a[name]) a[name](); }

  // ============ BACK WALL (blurred + faded) ============
  var back = scene.add.container(0, 0).setDepth(-100);
  var g = scene.add.graphics(); back.add(g);

  // cool gradient backdrop
  var bands = 36;
  for (var i = 0; i < bands; i++) {
    var col = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x18283f),
      Phaser.Display.Color.ValueToColor(0x080f1e), bands, i);
    g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
    g.fillRect(0, H * (i / bands), W, H / bands + 1);
  }

  // wall panels (clean rounded tiles with seams + a lit top edge)
  var pw = 128, ph = 96, gap = 10;
  for (var py = 6; py < H * 0.92; py += ph + gap) {
    for (var pxx = 6; pxx < W; pxx += pw + gap) {
      g.fillStyle(0x213a55, 1);
      g.fillRoundedRect(pxx, py, pw, ph, 8);
      g.fillStyle(0x2b486a, 1);
      g.fillRoundedRect(pxx, py, pw, 10, { tl: 8, tr: 8, bl: 0, br: 0 });
      g.lineStyle(1, 0x14233a, 1); g.strokeRoundedRect(pxx, py, pw, ph, 8);
    }
  }

  // a few wall readouts (dark screens with coloured bars)
  var readoutSpots = [[W * 0.1, H * 0.1], [W * 0.66, H * 0.07], [W * 0.2, H * 0.63], [W * 0.72, H * 0.7]];
  readoutSpots.forEach(function (s) {
    g.fillStyle(0x07101e, 1); g.fillRoundedRect(s[0], s[1], 56, 34, 4);
    var bars = [0x4fd9ff, 0x7CFF6B, 0xFBD38D];
    for (var k = 0; k < 3; k++) { g.fillStyle(bars[k], 0.7); g.fillRect(s[0] + 6, s[1] + 7 + k * 8, 20 + (k * 11) % 36, 3); }
  });

  // pipe runs (horizontal + a riser), metallic with a highlight stripe
  function pipe(x, y, w, h) {
    g.fillStyle(0x33415c, 1); g.fillRoundedRect(x, y, w, h, Math.min(w, h) / 2);
    g.fillStyle(0x47567a, 1); g.fillRoundedRect(x + 2, y + 2, w - 4, Math.max(2, h * 0.28), Math.min(w, h) / 3);
  }
  pipe(0, H * 0.22, W, 14); pipe(0, H * 0.78, W, 12);
  pipe(W * 0.84, H * 0.22, 12, H * 0.56);
  // pipe joints
  [[W * 0.84, H * 0.22], [W * 0.84, H * 0.78]].forEach(function (j) { g.fillStyle(0x3a4a68, 1); g.fillCircle(j[0] + 6, j[1] + 6, 11); });

  // gauges (dials) on the wall
  function gauge(cx, cy, r) {
    g.fillStyle(0x0c1626, 1); g.fillCircle(cx, cy, r);
    g.lineStyle(2, 0x4a5f86, 1); g.strokeCircle(cx, cy, r);
    for (var a = 0; a < 8; a++) { var an = -Math.PI * 0.75 + a * (Math.PI * 1.5 / 7); g.lineStyle(1, 0x6a80a8, 0.8); g.lineBetween(cx + Math.cos(an) * (r - 4), cy + Math.sin(an) * (r - 4), cx + Math.cos(an) * r, cy + Math.sin(an) * r); }
    var needle = scene.add.graphics(); back.add(needle);
    needle.lineStyle(2, 0x4fd9ff, 0.9); needle.lineBetween(0, 0, r - 5, 0);
    needle.setPosition(cx, cy); needle.rotation = -Math.PI * 0.6;
    return needle;
  }
  var gauges = [gauge(W * 0.46, H * 0.12, 18), gauge(W * 0.9, H * 0.5, 16)];

  // tall glass sample tubes with coloured liquid + rising bubbles
  var tubes = [];
  var tubeCols = [0x4FD1C5, 0xF687B3, 0x9F7AEA, 0xFBD38D];
  for (var ti = 0; ti < 4; ti++) {
    var tx = W * (0.12 + ti * 0.2), ty = H * 0.30, tw = 26, th = H * 0.2;
    g.fillStyle(0x0a1626, 0.5); g.fillRoundedRect(tx, ty, tw, th, 12);
    var liquid = scene.add.graphics(); back.add(liquid);
    var fill = 0.5 + Math.random() * 0.3;
    function paintLiquid(lg, x, y, w, h, f, c) { lg.clear(); lg.fillStyle(c, 0.6); lg.fillRoundedRect(x + 3, y + h * (1 - f), w - 6, h * f - 3, 10); }
    paintLiquid(liquid, tx, ty, tw, th, fill, tubeCols[ti]);
    g.lineStyle(2, 0x9fdfff, 0.3); g.strokeRoundedRect(tx, ty, tw, th, 12);
    var tube = { x: tx, y: ty, w: tw, h: th, col: tubeCols[ti], liquid: liquid, fill: fill, paint: paintLiquid };
    tubes.push(tube);
    // a couple of rising bubbles
    for (var z = 0; z < 2; z++) {
      var bub = scene.add.circle(tx + tw * (0.35 + 0.3 * z), ty + th - 8, 2, 0xffffff, 0.5); back.add(bub);
      (function (bub, sy, ey) { scene.tweens.add({ targets: bub, y: ey, alpha: 0, duration: 1600 + Math.random() * 1400, repeat: -1, repeatDelay: Math.random() * 1000, onRepeat: function () { bub.y = sy; bub.alpha = 0.5; } }); })(bub, ty + th - 8, ty + th * 0.3);
    }
  }

  // blinking status lights scattered on panels
  var lightCols = [0x7CFF6B, 0x4fd9ff, 0xFBD38D, 0xff6b8b];
  for (var sl = 0; sl < 10; sl++) {
    var dot = scene.add.circle(W * (0.05 + Math.random() * 0.9), H * (0.05 + Math.random() * 0.85), 3, lightCols[sl % 4], 0.9);
    back.add(dot);
    scene.tweens.add({ targets: dot, alpha: 0.15, duration: 500 + Math.random() * 1200, yoyo: true, repeat: -1, delay: Math.random() * 1500, ease: 'Sine.inOut' });
  }

  // a far walkway ledge (where the robot trundles)
  g.fillStyle(0x1a2740, 1); g.fillRect(0, H * 0.515, W, 5);
  g.fillStyle(0x0e1a2e, 1); g.fillRect(0, H * 0.52, W, 3);

  // soft light shaft over the beaker
  var shaft = scene.add.graphics();
  shaft.fillStyle(0xbfe3ff, 0.05);
  shaft.fillTriangle(W * 0.26, 0, W * 0.44, 0, W * 0.6, H);
  shaft.fillTriangle(W * 0.26, 0, W * 0.6, H, W * 0.12, H);
  back.add(shaft);
  scene.tweens.add({ targets: shaft, alpha: 0.6, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  back.setAlpha(0.8);
  try { if (back.postFX) back.postFX.addBlur(0, 2, 2, 1.0, 0xffffff, 5); } catch (e) {}

  // ============ AMBIENT EVENT LAYER (subtle, lightly blurred) ============
  var amb = scene.add.container(0, 0).setDepth(-90).setAlpha(0.6);
  try { if (amb.postFX) amb.postFX.addBlur(0, 1, 1, 0.7); } catch (e) {}
  var walkY = H * 0.5;

  // --- each event spawns temp shapes, animates a few seconds, cleans up ---
  function evRobot() {
    var dir = Math.random() < 0.5 ? 1 : -1, x0 = dir > 0 ? -34 : W + 34, x1 = dir > 0 ? W + 34 : -34;
    var r = scene.add.container(x0, walkY); amb.add(r);
    var gg = scene.add.graphics();
    gg.fillStyle(0x101c30, 1); gg.fillRoundedRect(-10, -16, 20, 18, 4);     // body
    gg.fillRoundedRect(-7, -24, 14, 9, 3);                                   // head
    gg.fillStyle(0x4fd9ff, 0.9); gg.fillCircle(0, -19, 2);                   // eye light
    gg.fillStyle(0x0b1424, 1); gg.fillRect(-8, 2, 5, 7); gg.fillRect(3, 2, 5, 7); // legs
    r.add(gg);
    scene.tweens.add({ targets: r, x: x1, duration: 6500, ease: 'Linear', onComplete: function () { r.destroy(); } });
    var up = false, steps = scene.time.addEvent({ delay: 360, repeat: 16, callback: function () { r.y = walkY + (up ? 2 : -2); up = !up; snd('ambStep'); } });
    scene.time.delayedCall(6600, function () { if (steps) steps.remove(false); });
  }
  function evTubeFill() {
    if (!tubes.length) return;
    var tb = tubes[Math.floor(Math.random() * tubes.length)], start = tb.fill, peak = 0.95;
    snd('ambHum');
    scene.tweens.addCounter({ from: start, to: peak, duration: 2200, yoyo: true, hold: 600, onUpdate: function (tw) { tb.fill = tw.getValue(); tb.paint(tb.liquid, tb.x, tb.y, tb.w, tb.h, tb.fill, tb.col); }, onComplete: function () { tb.fill = start; tb.paint(tb.liquid, tb.x, tb.y, tb.w, tb.h, tb.fill, tb.col); } });
  }
  function evPanelLights() {
    var x = W * (0.1 + Math.random() * 0.7), y = H * (0.1 + Math.random() * 0.7);
    for (var k = 0; k < 5; k++) (function (k) {
      var d = scene.add.circle(x + k * 9, y, 3, 0x7CFF6B, 0).setBlendMode('ADD'); amb.add(d);
      scene.tweens.add({ targets: d, alpha: 1, duration: 120, delay: k * 140, yoyo: true, onComplete: function () { d.destroy(); } });
    })(k);
    snd('ambBeep');
  }
  function evDoor() {
    var x = W * (0.55 + Math.random() * 0.2), y = H * 0.4, w = 54, hh = 64;
    var L = scene.add.rectangle(x, y, w / 2, hh, 0x0a1424).setOrigin(1, 0.5);
    var R = scene.add.rectangle(x, y, w / 2, hh, 0x0a1424).setOrigin(0, 0.5);
    var sh = scene.add.rectangle(x, y, 14, hh * 0.7, 0x4fd9ff, 0.25);
    amb.add([L, R, sh]); snd('ambDoor');
    scene.tweens.add({ targets: L, scaleX: 0.05, duration: 600, yoyo: true, hold: 1400, ease: 'Quad.inOut', onComplete: function () { L.destroy(); } });
    scene.tweens.add({ targets: R, scaleX: 0.05, duration: 600, yoyo: true, hold: 1400, ease: 'Quad.inOut', onComplete: function () { R.destroy(); } });
    scene.tweens.add({ targets: sh, x: x + 30, alpha: 0, duration: 1200, delay: 500, onComplete: function () { sh.destroy(); } });
  }
  function evWeld() {
    var x = W * (0.1 + Math.random() * 0.8), y = H * (0.15 + Math.random() * 0.6);
    snd('ambSpark');
    var em = scene.add.particles(x, y, 'p_spark', { speed: { min: 20, max: 80 }, angle: { min: 200, max: 340 }, scale: { start: 0.3, end: 0 }, lifespan: 400, quantity: 6, tint: 0xffd27a, blendMode: 'ADD', emitting: false });
    amb.add(em); em.explode(8);
    var fl = scene.add.circle(x, y, 8, 0xffe9b0, 0.8).setBlendMode('ADD'); amb.add(fl);
    scene.tweens.add({ targets: fl, alpha: 0, scale: 1.6, duration: 300, repeat: 2, yoyo: true, onComplete: function () { fl.destroy(); } });
    scene.time.delayedCall(700, function () { em.destroy(); });
  }
  function evClaw() {
    var x = W * (0.3 + Math.random() * 0.4);
    var arm = scene.add.container(x, -10); amb.add(arm);
    var ag = scene.add.graphics();
    ag.lineStyle(4, 0x33415c, 1); ag.lineBetween(0, 0, 0, 70);
    ag.fillStyle(0x47567a, 1); ag.fillTriangle(-7, 70, 7, 70, 0, 84);
    arm.add(ag);
    snd('ambServo');
    scene.tweens.add({ targets: arm, y: H * 0.34, duration: 900, yoyo: true, hold: 500, ease: 'Quad.inOut', onComplete: function () { arm.destroy(); } });
  }
  function evSteam() {
    var x = W * (0.2 + Math.random() * 0.6), y = H * 0.78;
    snd('ambHiss');
    var em = scene.add.particles(x, y, 'p_bubble', { speed: { min: 10, max: 40 }, angle: { min: 250, max: 290 }, scale: { start: 0.5, end: 1.4 }, alpha: { start: 0.4, end: 0 }, lifespan: 1200, quantity: 2, frequency: 80, tint: 0xcfe0ff });
    amb.add(em);
    scene.time.delayedCall(900, function () { em.stop(); });
    scene.time.delayedCall(2400, function () { em.destroy(); });
  }
  function evGauge() {
    if (!gauges.length) return;
    var nd = gauges[Math.floor(Math.random() * gauges.length)];
    snd('ambBeep');
    scene.tweens.add({ targets: nd, rotation: Math.PI * 0.5, duration: 1100, yoyo: true, hold: 400, ease: 'Quad.inOut' });
  }
  function evScan() {
    var x = W * (0.1 + Math.random() * 0.5), y = H * (0.1 + Math.random() * 0.6), w = 90;
    var bar = scene.add.rectangle(x, y, 4, 60, 0x4fd9ff, 0.5).setBlendMode('ADD'); amb.add(bar);
    snd('ambHum');
    scene.tweens.add({ targets: bar, x: x + w, duration: 1400, yoyo: true, onComplete: function () { bar.destroy(); } });
  }
  function evDrone() {
    var dir = Math.random() < 0.5 ? 1 : -1, x0 = dir > 0 ? -20 : W + 20, x1 = dir > 0 ? W + 20 : -20;
    var y = H * (0.12 + Math.random() * 0.2);
    var dr = scene.add.container(x0, y); amb.add(dr);
    var dg = scene.add.graphics();
    dg.fillStyle(0x101c30, 1); dg.fillEllipse(0, 0, 18, 10);
    dg.fillStyle(0xff6b8b, 0.9); dg.fillCircle(0, 2, 2);
    dr.add(dg);
    snd('ambHum');
    scene.tweens.add({ targets: dr, x: x1, duration: 7000, ease: 'Sine.inOut', onComplete: function () { dr.destroy(); } });
    scene.tweens.add({ targets: dr, y: y - 8, duration: 1500, yoyo: true, repeat: 3, ease: 'Sine.inOut' });
  }
  function evConveyor() {
    var y = H * 0.79, dir = Math.random() < 0.5 ? 1 : -1, x0 = dir > 0 ? -16 : W + 16, x1 = dir > 0 ? W + 16 : -16;
    var box = scene.add.rectangle(x0, y - 10, 16, 14, 0x2b486a).setStrokeStyle(1, 0x4fd9ff, 0.5); amb.add(box);
    snd('ambHum');
    scene.tweens.add({ targets: box, x: x1, duration: 5500, ease: 'Linear', onComplete: function () { box.destroy(); } });
  }
  function evAlert() {
    var x = W * (0.2 + Math.random() * 0.6), y = H * (0.1 + Math.random() * 0.7);
    var d = scene.add.circle(x, y, 5, 0xff5b5b, 0).setBlendMode('ADD'); amb.add(d);
    snd('ambBeep');
    scene.tweens.add({ targets: d, alpha: 0.9, duration: 260, yoyo: true, repeat: 3, onComplete: function () { d.destroy(); } });
  }

  var events = [evRobot, evTubeFill, evPanelLights, evDoor, evWeld, evClaw, evSteam, evGauge, evScan, evDrone, evConveyor, evAlert];
  var lastEv = -1;
  function runRandomEvent() {
    var idx; do { idx = Math.floor(Math.random() * events.length); } while (idx === lastEv && events.length > 1);
    lastEv = idx;
    try { events[idx](); } catch (e) {}
  }
  var nextTimer = null, dead = false;
  function scheduleNext(first) {
    if (dead) return;
    var delay = first ? 9000 + Math.random() * 6000 : 30000 + Math.random() * 30000;
    nextTimer = scene.time.delayedCall(delay, function () { if (dead) return; runRandomEvent(); scheduleNext(false); });
  }
  scheduleNext(true);
  // stop the ambient scheduler the moment this scene is torn down so it can
  // never re-arm or run an event against a dead scene
  scene.events.once('shutdown', function () { dead = true; if (nextTimer) nextTimer.remove(false); });

  // ============ MIDGROUND: metallic lab table (in focus) ============
  var tableTopY = H * 0.905;
  var table = scene.add.graphics().setDepth(-12);
  table.fillStyle(0x2a3450, 1); table.fillRect(0, tableTopY, W, H - tableTopY);
  table.fillStyle(0x39455f, 1); table.fillRect(0, tableTopY, W, 14);
  table.lineStyle(1, 0x4a586f, 0.5);
  for (var sx = 0; sx < W; sx += 26) { table.beginPath(); table.moveTo(sx, tableTopY + 18); table.lineTo(sx + 60, H); table.strokePath(); }
  table.fillStyle(0x4fd9ff, 0.5); table.fillRect(0, tableTopY, W, 2);
  table.fillStyle(0x4fd9ff, 0.12); table.fillRect(0, tableTopY + 2, W, 6);
  var contact = scene.add.graphics().setDepth(-11);
  contact.fillStyle(0x04060e, 0.4); contact.fillEllipse(W / 2, tableTopY + 4, W * 0.62, 26);

  // ============ FOREGROUND: drifting dust + vignette ============
  var nDust = opts.dust == null ? 16 : opts.dust;
  for (var d = 0; d < nDust; d++) {
    var m = scene.add.circle(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 0xbfe3ff, 0.08 + Math.random() * 0.10).setDepth(60);
    m.driftX = (Math.random() - 0.5) * 6; m.driftY = -3 - Math.random() * 6;
    dustMotes.push(m);
  }
  var vig = scene.add.graphics().setDepth(58);
  for (var k = 0; k < 26; k++) { var a = 0.05 * (1 - k / 26); vig.lineStyle(3, 0x04060e, a); vig.strokeRect(k * 1.6, k * 1.6, W - k * 3.2, H - k * 3.2); }

  return {
    update: function (dt) {
      var s = dt / 1000;
      for (var k = 0; k < dustMotes.length; k++) {
        var m = dustMotes[k];
        m.x += m.driftX * s; m.y += m.driftY * s;
        if (m.y < -4) { m.y = H + 4; m.x = Math.random() * W; }
        if (m.x < -4) m.x = W + 4; else if (m.x > W + 4) m.x = -4;
      }
    },
    parallax: function (nx) { for (var k = 0; k < dustMotes.length; k++) dustMotes[k].x += nx * 0.4; },
  };
};
