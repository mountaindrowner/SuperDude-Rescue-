// cards.js — PROOF OF CONCEPT: a holographic collectible card.
// Front art + back + a moving rainbow "foil" sheen and a glare highlight that
// react to drag (tilt) and idle shimmer; tap to flip. Self-contained: the art
// is a placeholder element "character" (real set would feature Danny + cast).
window.DANNYLAB = window.DANNYLAB || {};
(function () {
  var CW = 240, CH = 336;   // base card size (5:7-ish)

  // one-time rainbow foil texture: diagonal gradient + shine streaks + sparkle
  function ensureFoil(scene) {
    if (scene.textures.exists('holo_foil')) return;
    var cw = 256, ch = 358;
    var canvas = scene.textures.createCanvas('holo_foil', cw, ch);
    if (!canvas) return;
    var ctx = canvas.getContext();
    var grad = ctx.createLinearGradient(0, 0, cw, ch);
    var stops = ['#ff2d6f', '#ff8a3a', '#ffe14d', '#49ff7a', '#3ad0ff', '#7a5cff', '#ff5ce6', '#ff2d6f'];
    for (var i = 0; i < stops.length; i++) grad.addColorStop(i / (stops.length - 1), stops[i]);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, cw, ch);
    // bright diagonal shine streaks
    ctx.globalCompositeOperation = 'lighter';
    for (var s = 0; s < 16; s++) {
      ctx.globalAlpha = 0.04 + Math.random() * 0.10;
      ctx.fillStyle = '#ffffff';
      ctx.save(); ctx.translate(Math.random() * cw, 0); ctx.rotate(-0.5);
      ctx.fillRect(0, -ch, 5 + Math.random() * 18, ch * 2);
      ctx.restore();
    }
    // sparkle dust
    ctx.globalAlpha = 0.85;
    for (var k = 0; k < 130; k++) { ctx.fillStyle = '#ffffff'; var sz = Math.random() < 0.18 ? 2 : 1; ctx.fillRect(Math.random() * cw, Math.random() * ch, sz, sz); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    canvas.refresh();
  }

  // Build a holographic card centered at (x,y). Returns an object with the root
  // container plus shimmer(dx,dy) and flip() controls, and the world half-size.
  DANNYLAB.buildHoloCard = function (scene, opts) {
    opts = opts || {};
    ensureFoil(scene);
    var UI = DANNYLAB.UI, scale = opts.scale || 1, tier = opts.tier || 9;
    var cfg = DANNYLAB.tierCfg(tier), sym = cfg.sym;
    var lang = scene.registry.get('lang') || 'en';
    var name = DANNYLAB.elementName(sym, lang).toUpperCase();
    var fact = DANNYLAB.elementFact(sym, lang);
    var rarity = opts.rarity || (tier >= 8 ? 'LEGENDARY' : tier >= 5 ? 'RARE' : 'COMMON');
    var stars = rarity === 'LEGENDARY' ? 5 : rarity === 'RARE' ? 3 : 1;
    function hex(c) { return '#' + c.toString(16).padStart(6, '0'); }

    var root = scene.add.container(opts.x || 0, opts.y || 0).setScale(scale);

    // window geometry (the art "porthole")
    var wy0 = -CH / 2 + 44, wh = 172, wcx = 0, wcy = wy0 + wh / 2;

    // ---------------- FRONT ----------------
    var front = scene.add.container(0, 0);
    var g = scene.add.graphics();
    g.fillStyle(0x0a1330, 1);     g.fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 18);
    g.fillStyle(cfg.color, 0.16); g.fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 18);
    g.fillStyle(0x060c1e, 1);     g.fillRoundedRect(-CW / 2 + 10, wy0, CW - 20, wh, 12);   // window well
    front.add(g);

    // art: the element "character" (body + resting face), big in the window
    var bodyKey = scene.textures.exists('jelly_body_' + tier) ? 'jelly_body_' + tier : DANNYLAB.iconKey(scene, tier);
    var art = scene.add.image(wcx, wcy + 6, bodyKey).setDisplaySize(150, 150);
    front.add(art);
    if (scene.textures.exists('jelly_face_' + tier + '_rest')) {
      front.add(scene.add.image(wcx, wcy - 4, 'jelly_face_' + tier + '_rest').setDisplaySize(120, 120));
    }

    // holo foil over the window (ADD); slightly larger so a parallax shift never
    // bares an edge — the frame border drawn on top crops the bleed.
    var foil = scene.add.image(wcx, wcy, 'holo_foil').setDisplaySize(CW - 4, wh + 26)
      .setBlendMode('ADD').setAlpha(0.25);
    front.add(foil);

    // glare highlight (radial), follows the pointer
    var glare = scene.add.image(wcx, wcy, 'el_glow').setTint(0xffffff).setBlendMode('ADD')
      .setDisplaySize(190, 190).setAlpha(0);
    front.add(glare);

    // frame over the foil: title bar, window border, footer, labels
    var f = scene.add.graphics();
    f.fillStyle(cfg.color, 0.9); f.fillRoundedRect(-CW / 2 + 8, -CH / 2 + 8, CW - 16, 30, { tl: 12, tr: 12, bl: 0, br: 0 });
    f.lineStyle(3, 0xffffff, 0.85); f.strokeRoundedRect(-CW / 2 + 10, wy0, CW - 20, wh, 12);   // window rim crops foil
    f.lineStyle(2.5, cfg.color, 0.95); f.strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 18);       // outer neon edge
    f.lineStyle(1, 0xffffff, 0.18); f.strokeRoundedRect(-CW / 2 + 4, -CH / 2 + 4, CW - 8, CH - 8, 15);
    front.add(f);

    var titleCol = '#10204a';
    front.add(scene.add.text(-CW / 2 + 18, -CH / 2 + 23, name, {
      fontFamily: UI.DISPLAY, fontSize: '18px', color: titleCol, fontStyle: 'bold' }).setOrigin(0, 0.5));
    front.add(scene.add.text(CW / 2 - 16, -CH / 2 + 23, 'No.' + ('00' + tier).slice(-3), {
      fontFamily: UI.DISPLAY, fontSize: '13px', color: titleCol, fontStyle: 'bold' }).setOrigin(1, 0.5));
    // element symbol badge (bottom-left of window)
    var bx = -CW / 2 + 30, by = wy0 + wh - 22;
    var bg = scene.add.graphics(); bg.fillStyle(0x081026, 0.85); bg.fillCircle(bx, by, 18);
    bg.lineStyle(2, cfg.color, 1); bg.strokeCircle(bx, by, 18); front.add(bg);
    front.add(scene.add.text(bx, by, sym, { fontFamily: UI.DISPLAY, fontSize: '16px', color: hex(cfg.color), fontStyle: 'bold' }).setOrigin(0.5));
    // rarity pips (drawn diamonds — font-subset safe)
    var pipCol = rarity === 'LEGENDARY' ? 0xffd84d : rarity === 'RARE' ? 0x8fd0ff : 0x9fb2cf;
    var pg = scene.add.graphics(); var py = wy0 + wh + 24, p0 = -(stars - 1) * 9;
    for (var pi = 0; pi < stars; pi++) {
      var ppx = p0 + pi * 18;
      pg.fillStyle(pipCol, 1); pg.fillPoints([{ x: ppx, y: py - 6 }, { x: ppx + 5, y: py }, { x: ppx, y: py + 6 }, { x: ppx - 5, y: py }], true);
    }
    front.add(pg);
    front.add(scene.add.text(0, wy0 + wh + 44, rarity, {
      fontFamily: UI.DISPLAY, fontSize: '12px', color: '#cfe0ff', fontStyle: 'bold' }).setOrigin(0.5));
    // flavour
    front.add(scene.add.text(0, wy0 + wh + 60, fact, {
      fontFamily: UI.FONT, fontSize: '11px', color: '#aebfe0', align: 'center', lineSpacing: 2, wordWrap: { width: CW - 40 } }).setOrigin(0.5, 0));
    front.add(scene.add.text(0, CH / 2 - 12, 'SUPER DUDE DANNY · ELEMENT LAB', {
      fontFamily: UI.DISPLAY, fontSize: '9px', color: '#5f74a6', fontStyle: 'bold' }).setOrigin(0.5));

    // ---------------- BACK ----------------
    var back = scene.add.container(0, 0).setVisible(false);
    var bgk = scene.add.graphics();
    bgk.fillStyle(0x101a3c, 1); bgk.fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 18);
    bgk.fillStyle(0x0a1330, 1); bgk.fillRoundedRect(-CW / 2 + 22, -CH / 2 + 22, CW - 44, CH - 44, 14);
    bgk.lineStyle(2.5, 0x4fd9ff, 0.9); bgk.strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 18);
    bgk.lineStyle(2, 0x4fd9ff, 0.5); bgk.strokeRoundedRect(-CW / 2 + 22, -CH / 2 + 22, CW - 44, CH - 44, 14);
    back.add(bgk);
    back.add(scene.add.image(0, -28, 'el_glow').setTint(0x4fd9ff).setBlendMode('ADD').setDisplaySize(150, 150).setAlpha(0.5));
    // drawn atom emblem (nucleus + 3 orbits) — font-subset safe
    var atom = scene.add.graphics();
    atom.fillStyle(0xbfe9ff, 1); atom.fillCircle(0, -34, 11);
    atom.lineStyle(2.5, 0x9fe0ff, 0.9);
    for (var oa = 0; oa < 3; oa++) { atom.save(); atom.translateCanvas(0, -34); atom.rotateCanvas(oa * Math.PI / 3); atom.strokeEllipse(0, 0, 78, 30); atom.restore(); }
    back.add(atom);
    back.add(scene.add.text(0, 44, 'ELEMENT LAB', { fontFamily: UI.DISPLAY, fontSize: '22px', color: '#eafffb', fontStyle: 'bold' }).setOrigin(0.5));
    back.add(scene.add.text(0, 72, 'COLLECTOR CARD', { fontFamily: UI.DISPLAY, fontSize: '12px', color: '#7fb0d8', fontStyle: 'bold' }).setOrigin(0.5));

    root.add([front, back]);

    var api = {
      root: root, front: front, back: back, foil: foil, glare: glare,
      half: { x: CW / 2 * scale, y: CH / 2 * scale },
      _flipping: false, _face: 'front',
      shimmer: function (dx, dy) {
        var mag = Math.min(1, Math.hypot(dx, dy));
        foil.x = wcx - dx * 14; foil.y = wcy - dy * 14;
        foil.setAlpha(0.18 + mag * 0.55);
        glare.x = wcx + dx * 70; glare.y = wcy + dy * 46;
        glare.setAlpha(0.12 + mag * 0.40);
        if (!api._flipping) { root.rotation = dx * 0.05; root.scaleY = scale * (1 - Math.abs(dy) * 0.04); }
      },
      flip: function () {
        if (api._flipping) return;
        api._flipping = true; root.rotation = 0;
        scene.tweens.add({ targets: root, scaleX: 0, duration: 150, ease: 'Quad.in', onComplete: function () {
          api._face = api._face === 'front' ? 'back' : 'front';
          front.setVisible(api._face === 'front'); back.setVisible(api._face === 'back');
          scene.tweens.add({ targets: root, scaleX: scale, duration: 170, ease: 'Quad.out', onComplete: function () { api._flipping = false; } });
        } });
      },
    };
    return api;
  };

  // ---------------- full 3D interactive viewer (DOM/CSS-3D overlay) ----------------
  // Real perspective rotation + momentum spin + a color-dodge holo foil, with
  // proper backface culling. Each face clips its own contents, so nothing bleeds
  // past the card. Reliable on iOS Safari (where CSS 3D + blend modes excel).

  function injectStyles() {
    if (document.getElementById('dlc-styles')) return;
    var css = ''
      + '.dlc-overlay{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;'
      + 'background:radial-gradient(120% 90% at 50% 30%,rgba(18,26,50,.92),rgba(4,6,15,.96));touch-action:none;'
      + 'font-family:"Baloo 2","Trebuchet MS",system-ui,sans-serif;-webkit-user-select:none;user-select:none;opacity:0;transition:opacity .25s;}'
      + '.dlc-overlay.show{opacity:1;}'
      + '.dlc-h{color:#7CFF6B;font-weight:800;font-size:22px;letter-spacing:2px;text-shadow:0 0 12px rgba(124,255,107,.6);margin-bottom:24px;}'
      + '.dlc-stage{perspective:1100px;width:280px;height:392px;}'
      + '.dlc-card{position:relative;width:100%;height:100%;transform-style:preserve-3d;will-change:transform;cursor:grab;}'
      + '.dlc-face{position:absolute;inset:0;border-radius:18px;overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden;box-shadow:0 18px 40px rgba(0,0,0,.55);}'
      + '.dlc-back{transform:rotateY(180deg);}'
      + '.dlc-foil{position:absolute;inset:0;pointer-events:none;border-radius:inherit;'
      + 'background:linear-gradient(115deg,transparent 12%,rgba(255,45,111,.55),rgba(255,225,77,.55),rgba(73,255,122,.55),rgba(58,208,255,.55),rgba(150,92,255,.55),rgba(255,92,230,.55),transparent 88%);'
      + 'background-size:280% 280%;mix-blend-mode:color-dodge;opacity:.35;}'
      + '.dlc-glare{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.55),transparent 42%);mix-blend-mode:screen;opacity:.18;}'
      + '.dlc-hint{color:#cfe0ff;font-weight:700;font-size:16px;margin-top:26px;opacity:.9;}'
      + '.dlc-done{margin-top:18px;padding:14px 44px;border:none;border-radius:16px;background:#46506e;color:#eafffb;font-weight:800;font-size:20px;'
      + 'font-family:inherit;box-shadow:0 6px 16px rgba(0,0,0,.4);cursor:pointer;}'
      + '.dlc-done:active{transform:translateY(2px);}';
    var st = document.createElement('style'); st.id = 'dlc-styles'; st.textContent = css;
    document.head.appendChild(st);
  }

  // draw the element "character" (body + face) to a data URL for the DOM card
  function portraitURL(scene, tier) {
    try {
      var s = 320, c = document.createElement('canvas'); c.width = s; c.height = s;
      var ctx = c.getContext('2d');
      var bk = scene.textures.exists('jelly_body_' + tier) ? 'jelly_body_' + tier : DANNYLAB.iconKey(scene, tier);
      var body = scene.textures.get(bk).getSourceImage();
      var bw = s * 0.9; ctx.drawImage(body, (s - bw) / 2, (s - bw) / 2, bw, bw);
      if (scene.textures.exists('jelly_face_' + tier + '_rest')) {
        var face = scene.textures.get('jelly_face_' + tier + '_rest').getSourceImage();
        var fw = s * 0.7; ctx.drawImage(face, (s - fw) / 2, (s - fw) / 2 - s * 0.02, fw, fw);
      }
      return c.toDataURL();
    } catch (e) { return ''; }
  }

  // Open the full-screen 3D card. Non-Phaser DOM overlay; closes itself.
  DANNYLAB.openCardViewer = function (scene, opts) {
    if (document.querySelector('.dlc-overlay')) return;   // already open
    opts = opts || {};
    injectStyles();
    var tier = opts.tier || 9, cfg = DANNYLAB.tierCfg(tier);
    var lang = scene.registry.get('lang') || 'en';
    var name = DANNYLAB.elementName(cfg.sym, lang).toUpperCase();
    var fact = DANNYLAB.elementFact(cfg.sym, lang);
    var accent = '#' + cfg.color.toString(16).padStart(6, '0');
    var art = portraitURL(scene, tier);

    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    var frontHTML =
      '<div class="dlc-face dlc-front" style="background:linear-gradient(160deg,#0e1a3e,#0a1330);border:2px solid ' + accent + ';padding:8px;box-sizing:border-box;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;background:' + accent + ';color:#0a1330;font-weight:800;border-radius:10px 10px 0 0;padding:5px 12px;font-size:15px;">'
      + '<span style="letter-spacing:1px;">' + esc(name) + '</span><span style="font-size:12px;">No.' + ('00' + tier).slice(-3) + '</span></div>'
      + '<div style="position:relative;margin:8px 4px;height:196px;border-radius:10px;overflow:hidden;background:radial-gradient(circle at 50% 45%,' + accent + '33,#05122a);border:2px solid rgba(255,255,255,.85);">'
      + (art ? '<img src="' + art + '" style="position:absolute;left:50%;top:48%;width:78%;transform:translate(-50%,-50%);image-rendering:auto;">' : '')
      + '<div class="dlc-foil"></div><div class="dlc-glare"></div>'
      + '<div style="position:absolute;left:8px;bottom:8px;width:34px;height:34px;border-radius:50%;background:#081026cc;border:2px solid ' + accent + ';color:' + accent + ';font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px;">' + esc(cfg.sym) + '</div>'
      + '</div>'
      + '<div style="text-align:center;color:#ffd84d;font-size:16px;letter-spacing:3px;margin-top:2px;">★★★★★</div>'
      + '<div style="text-align:center;color:#cfe0ff;font-weight:800;font-size:12px;letter-spacing:2px;">LEGENDARY</div>'
      + '<div style="text-align:center;color:#aebfe0;font-size:11px;line-height:1.25;margin:6px 12px 0;">' + esc(fact) + '</div>'
      + '<div style="text-align:center;color:#5f74a6;font-weight:800;font-size:9px;letter-spacing:1px;position:absolute;left:0;right:0;bottom:8px;">SUPER DUDE DANNY · ELEMENT LAB</div>'
      + '</div>';
    var atomSVG = '<svg width="120" height="120" viewBox="-60 -60 120 120"><circle r="11" fill="#bfe9ff"/>'
      + '<g fill="none" stroke="#9fe0ff" stroke-width="2.5">'
      + '<ellipse rx="46" ry="18"/><ellipse rx="46" ry="18" transform="rotate(60)"/><ellipse rx="46" ry="18" transform="rotate(120)"/></g></svg>';
    var backHTML =
      '<div class="dlc-face dlc-back" style="background:#101a3c;border:2px solid #4fd9ff;box-sizing:border-box;display:flex;align-items:center;justify-content:center;">'
      + '<div style="position:absolute;inset:16px;border:2px solid rgba(79,217,255,.5);border-radius:12px;"></div>'
      + '<div style="text-align:center;">' + atomSVG
      + '<div style="color:#eafffb;font-weight:800;font-size:22px;letter-spacing:1px;margin-top:6px;">ELEMENT LAB</div>'
      + '<div style="color:#7fb0d8;font-weight:800;font-size:11px;letter-spacing:2px;">COLLECTOR CARD</div></div></div>';

    var ov = document.createElement('div'); ov.className = 'dlc-overlay';
    ov.innerHTML = '<div class="dlc-h">HOLO CARD — PROTOTYPE</div>'
      + '<div class="dlc-stage"><div class="dlc-card">' + frontHTML + backHTML + '</div></div>'
      + '<div class="dlc-hint">Drag to spin · double-tap to flip</div>'
      + '<button class="dlc-done">Done</button>';
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('show'); });

    var card = ov.querySelector('.dlc-card');
    var foil = ov.querySelector('.dlc-foil'), glare = ov.querySelector('.dlc-glare');
    var rx = -8, ry = -18, vx = 0, vy = 0, dragging = false, lastX = 0, lastY = 0, lastTap = 0;
    var raf = 0, closed = false, phase = 0, flipTarget = null;

    function apply() {
      card.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      var a = Math.abs(Math.sin(ry * Math.PI / 180));
      if (foil) { foil.style.opacity = 0.22 + 0.55 * a; foil.style.backgroundPosition = (50 + ry * 0.7) + '% ' + (50 + rx * 0.7) + '%'; }
      if (glare) { glare.style.transform = 'translate(' + (ry * 0.5) + '%,' + (-rx * 0.5) + '%)'; glare.style.opacity = 0.12 + 0.32 * Math.min(1, (Math.abs(rx) + Math.abs(ry)) / 55); }
    }
    function loop() {
      if (closed) return;
      phase += 0.02;
      if (flipTarget !== null) {                 // clean 180° snap
        ry += (flipTarget - ry) * 0.16;
        if (Math.abs(flipTarget - ry) < 0.4) { ry = flipTarget; flipTarget = null; }
      } else if (!dragging) {
        ry += vy; rx += vx; vy *= 0.94; vx *= 0.94;
        if (Math.abs(vy) < 0.05) vy = 0; if (Math.abs(vx) < 0.05) vx = 0;
        if (vy === 0 && vx === 0) {               // settled → gentle live wobble
          ry += Math.sin(phase) * 0.35;
          rx += (Math.cos(phase * 0.9) * 5 - rx) * 0.04;
        } else { rx += (0 - rx) * 0.04; }
      }
      if (rx > 44) rx = 44; if (rx < -44) rx = -44;
      apply(); raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    function down(e) {
      if (e.target.closest && e.target.closest('.dlc-done')) return;
      var now = Date.now();
      if (now - lastTap < 320) { flipTarget = Math.round(ry / 180) * 180 + 180; vy = 0; vx = 0; }   // double-tap → flip
      lastTap = now;
      dragging = true; card.style.cursor = 'grabbing';
      lastX = e.clientX; lastY = e.clientY;
      if (e.preventDefault) e.preventDefault();
    }
    function move(e) {
      if (!dragging || flipTarget !== null) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      ry += dx * 0.6; rx -= dy * 0.6; vy = dx * 0.6; vx = -dy * 0.6;
    }
    function upp() { dragging = false; card.style.cursor = 'grab'; }
    ov.addEventListener('pointerdown', down);
    ov.addEventListener('pointermove', move);
    ov.addEventListener('pointerup', upp);
    ov.addEventListener('pointercancel', upp);

    function close() {
      if (closed) return; closed = true;
      cancelAnimationFrame(raf);
      ov.classList.remove('show');
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 220);
      if (opts.onClose) opts.onClose();
    }
    ov.querySelector('.dlc-done').addEventListener('click', close);
    return { close: close };
  };
})();
