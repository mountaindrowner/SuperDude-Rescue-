// cards.js — collectible cards shown in a holographic 3D viewer.
// Two decks share the same back (assets/cards/back.jpg):
//   * character cards  — full baked art (assets/cards/*.jpg)
//   * element cards     — built here from the jelly element characters
// Viewer: DOM/CSS-3D overlay (drag to spin, double-tap to flip, prev/next).
window.DANNYLAB = window.DANNYLAB || {};
(function () {
  // display order = unlock ramp (easy -> hard). Each has a requirement.
  DANNYLAB.CARDS = [
    { key: 'kevin',    file: 'assets/cards/kevin.jpg',    name: 'Captain Kevin',        req: { text: 'Play your first game',  test: function (s) { return s.games >= 1; } } },
    { key: 'josh',     file: 'assets/cards/josh.jpg',     name: 'Zookeeper Josh',       req: { text: 'Discover 3 elements',   test: function (s) { return s.discovered >= 3; } } },
    { key: 'carlos',   file: 'assets/cards/carlos.jpg',   name: 'Galaxy Guide Carlos',  req: { text: 'Reach Lab Level 3',     test: function (s) { return s.level >= 3; } } },
    { key: 'nayah',    file: 'assets/cards/nayah.jpg',    name: 'Nature Expert Nayah',  req: { text: 'Discover 6 elements',   test: function (s) { return s.discovered >= 6; } } },
    { key: 'victoria', file: 'assets/cards/victoria.jpg', name: 'Time Tech Victoria',   req: { text: 'Reach Lab Level 6',     test: function (s) { return s.level >= 6; } } },
  ];
  DANNYLAB.CARD_BACK = 'assets/cards/back.jpg';

  // ---------- unlock rules ----------
  DANNYLAB.cardStats = function () {
    var st = DANNYLAB.store;
    return { games: st.getGamesPlayed(), best: st.getBest(), level: st.getBestLevel(), discovered: st.getDiscovered().length };
  };
  // spec: { element:tier } or { reqTest, reqText } (character)
  DANNYLAB.cardUnlocked = function (spec) {
    if (spec.element) return DANNYLAB.store.isDiscovered(DANNYLAB.tierCfg(spec.element).sym);
    return spec.reqTest ? !!spec.reqTest(DANNYLAB.cardStats()) : true;
  };
  DANNYLAB.cardRequirement = function (spec) {
    if (spec.element) return 'Create this element in the lab to unlock its card.';
    return spec.reqText || 'Keep playing to unlock.';
  };

  // real atomic numbers + a state tag + a fun epithet per element
  var ELEMENT_META = {
    H:  { z: 1,  kind: 'GAS',   epi: 'Spark of the Stars' },
    He: { z: 2,  kind: 'GAS',   epi: 'Featherlight Wonder' },
    C:  { z: 6,  kind: 'SOLID', epi: 'Builder of Life' },
    O:  { z: 8,  kind: 'GAS',   epi: 'Breath of the World' },
    Ne: { z: 10, kind: 'GAS',   epi: 'The Bright Glow' },
    Na: { z: 11, kind: 'METAL', epi: 'The Lively Metal' },
    Fe: { z: 26, kind: 'METAL', epi: 'Heart of the Earth' },
    Au: { z: 79, kind: 'METAL', epi: 'Everlasting Treasure' },
    U:  { z: 92, kind: 'METAL', epi: 'Heavyweight Powerhouse' },
  };

  DANNYLAB.characterDeck = function () { return DANNYLAB.CARDS.map(function (c) { return { img: c.file, key: c.key, reqTest: c.req.test, reqText: c.req.text }; }); };
  DANNYLAB.elementDeck = function () { return DANNYLAB.CONFIG.tiers.map(function (t) { return { element: t.t }; }); };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // render the element "character" (body + face) to a data URL
  function portraitURL(scene, tier) {
    try {
      var s = 320, c = document.createElement('canvas'); c.width = s; c.height = s;
      var ctx = c.getContext('2d');
      var bk = scene.textures.exists('jelly_body_' + tier) ? 'jelly_body_' + tier : DANNYLAB.iconKey(scene, tier);
      var body = scene.textures.get(bk).getSourceImage();
      var bw = s * 0.92; ctx.drawImage(body, (s - bw) / 2, (s - bw) / 2, bw, bw);
      if (scene.textures.exists('jelly_face_' + tier + '_rest')) {
        var face = scene.textures.get('jelly_face_' + tier + '_rest').getSourceImage();
        var fw = s * 0.72; ctx.drawImage(face, (s - fw) / 2, (s - fw) / 2 - s * 0.02, fw, fw);
      }
      return c.toDataURL();
    } catch (e) { return ''; }
  }

  // full element-card front markup (its own holo frame; viewer adds foil/shine)
  function elementCardHTML(scene, tier) {
    var cfg = DANNYLAB.tierCfg(tier), sym = cfg.sym;
    var lang = scene.registry.get('lang') || 'en';
    var name = DANNYLAB.elementName(sym, lang).toUpperCase();
    var fact = DANNYLAB.elementFact(sym, lang);
    var meta = ELEMENT_META[sym] || { z: tier, kind: '', epi: '' };
    var accent = '#' + cfg.color.toString(16).padStart(6, '0');
    var stars = Math.min(5, Math.ceil(tier / 2));
    var starStr = ''; for (var i = 0; i < 5; i++) starStr += (i < stars ? '★' : '☆');
    var art = portraitURL(scene, tier);
    return '<div class="elc" style="--acc:' + accent + ';">'
      + '<div class="elc-in">'
      + '<div class="elc-top"><span>ELEMENT</span><span>No.' + ('00' + meta.z).slice(-3) + '</span></div>'
      + '<div class="elc-hero"><div class="elc-glow"></div>'
      + (art ? '<img class="elc-art" src="' + art + '">' : '')
      + '<div class="elc-sym">' + esc(sym) + '</div>'
      + (meta.kind ? '<div class="elc-kind">' + esc(meta.kind) + '</div>' : '')
      + '</div>'
      + '<div class="elc-name">' + esc(name) + '</div>'
      + '<div class="elc-epi">"' + esc(meta.epi) + '"</div>'
      + '<div class="elc-stars">' + starStr + '</div>'
      + '<div class="elc-note"><div class="elc-note-h">LAB NOTE</div><div class="elc-note-b">' + esc(fact) + '</div></div>'
      + '<div class="elc-brand">SUPER DUDE DANNY &middot; ELEMENT LAB</div>'
      + '</div></div>';
  }

  // the "not yet earned" face: muted holo frame, padlock, requirement text
  function lockedFrontHTML(spec) {
    var req = DANNYLAB.cardRequirement(spec);
    var lock = '<svg width="66" height="74" viewBox="0 0 64 74">'
      + '<rect x="9" y="30" width="46" height="38" rx="8" fill="#6f83b0"/>'
      + '<path d="M18 32 v-9 a14 14 0 0 1 28 0 v9" fill="none" stroke="#6f83b0" stroke-width="7"/>'
      + '<circle cx="32" cy="46" r="5.5" fill="#0c1430"/><rect x="29.5" y="48" width="5" height="11" rx="2.5" fill="#0c1430"/></svg>';
    return '<div class="lock-card"><div class="lock-in">'
      + lock + '<div class="lock-t">LOCKED</div>'
      + '<div class="lock-sub">HOW TO UNLOCK</div>'
      + '<div class="lock-req">' + esc(req) + '</div>'
      + '</div></div>';
  }

  function injectStyles() {
    if (document.getElementById('dlc-styles')) return;
    var css = ''
      + '.dlc-overlay{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;'
      + 'background:radial-gradient(120% 90% at 50% 30%,rgba(16,24,48,.93),rgba(4,6,15,.97));touch-action:none;'
      + 'font-family:"Baloo 2","Trebuchet MS",system-ui,sans-serif;-webkit-user-select:none;user-select:none;opacity:0;transition:opacity .25s;}'
      + '.dlc-overlay.show{opacity:1;}'
      + '.dlc-h{color:#7CFF6B;font-weight:800;font-size:20px;letter-spacing:2px;text-shadow:0 0 12px rgba(124,255,107,.6);margin-bottom:18px;}'
      + '.dlc-row{display:flex;align-items:center;gap:10px;}'
      + '.dlc-stage{perspective:1200px;width:300px;height:410px;}'
      + '.dlc-card{position:relative;width:100%;height:100%;transform-style:preserve-3d;will-change:transform;cursor:grab;}'
      + '.dlc-face{position:absolute;inset:0;border-radius:20px;overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden;box-shadow:0 18px 46px rgba(0,0,0,.6);}'
      + '.dlc-back{transform:rotateY(180deg);}'
      + '.dlc-content{position:absolute;inset:0;}'
      + '.dlc-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}'
      + '.dlc-foil{position:absolute;inset:0;pointer-events:none;'
      + 'background:linear-gradient(115deg,transparent 26%,rgba(255,80,140,.4),rgba(255,220,90,.4),rgba(90,255,150,.4),rgba(90,200,255,.4),rgba(160,110,255,.4),transparent 74%);'
      + 'background-size:240% 240%;mix-blend-mode:color-dodge;opacity:.14;}'
      + '.dlc-shine{position:absolute;inset:-45%;pointer-events:none;background:linear-gradient(103deg,transparent 44%,rgba(255,255,255,.6) 50%,transparent 56%);mix-blend-mode:screen;opacity:.25;}'
      + '.dlc-glare{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.5),transparent 42%);mix-blend-mode:screen;opacity:.14;}'
      + '.dlc-nav{width:52px;height:52px;border-radius:50%;border:none;background:#1b2748;color:#cfe0ff;font-size:26px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4);flex:0 0 auto;}'
      + '.dlc-nav:active{transform:translateY(2px);}'
      + '.dlc-count{color:#8fb0e6;font-weight:700;font-size:14px;margin-top:14px;letter-spacing:1px;}'
      + '.dlc-hint{color:#cfe0ff;font-weight:700;font-size:15px;margin-top:4px;opacity:.85;}'
      + '.dlc-done{margin-top:16px;padding:13px 44px;border:none;border-radius:16px;background:#46506e;color:#eafffb;font-weight:800;font-size:19px;'
      + 'font-family:inherit;box-shadow:0 6px 16px rgba(0,0,0,.4);cursor:pointer;}'
      + '.dlc-done:active{transform:translateY(2px);}'
      // ----- element card face -----
      + '.elc{position:absolute;inset:0;border-radius:20px;overflow:hidden;background:conic-gradient(from 210deg,#ff2d6f,#ff8a3a,#ffe14d,#49ff7a,#3ad0ff,#7a5cff,#ff5ce6,#ff2d6f);}'
      + '.elc-in{position:absolute;inset:5px;border-radius:16px;overflow:hidden;background:linear-gradient(165deg,#12203f,#070d1e);border:2px solid rgba(255,255,255,.14);display:flex;flex-direction:column;}'
      + '.elc-top{display:flex;justify-content:space-between;align-items:center;background:var(--acc);color:#0a1330;font-weight:800;font-size:12px;letter-spacing:2px;padding:5px 12px;}'
      + '.elc-hero{position:relative;height:152px;margin:7px 9px 0;border-radius:12px;overflow:hidden;background:radial-gradient(circle at 50% 46%,rgba(255,255,255,.05),#050c1e);border:2px solid rgba(255,255,255,.8);}'
      + '.elc-glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%,var(--acc),transparent 62%);opacity:.4;}'
      + '.elc-art{position:absolute;left:50%;top:50%;width:74%;transform:translate(-50%,-50%);filter:drop-shadow(0 6px 16px rgba(0,0,0,.5));}'
      + '.elc-sym{position:absolute;left:8px;bottom:8px;width:34px;height:34px;border-radius:50%;background:rgba(8,16,38,.8);border:2px solid var(--acc);color:var(--acc);font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px;}'
      + '.elc-kind{position:absolute;right:8px;bottom:8px;background:rgba(8,16,38,.8);border:1px solid var(--acc);color:#dfeaff;font-weight:700;font-size:10px;letter-spacing:1px;padding:3px 8px;border-radius:8px;}'
      + '.elc-name{text-align:center;color:#fff;font-weight:800;font-size:27px;letter-spacing:1px;margin-top:6px;text-shadow:0 0 10px var(--acc);}'
      + '.elc-epi{text-align:center;color:#bcd0f2;font-style:italic;font-size:13px;margin-top:-1px;}'
      + '.elc-stars{text-align:center;color:#ffd84d;font-size:16px;letter-spacing:3px;margin-top:2px;}'
      + '.elc-note{margin:6px 12px 0;background:rgba(8,16,38,.7);border:1px solid rgba(143,208,255,.3);border-radius:10px;padding:6px 10px;}'
      + '.elc-note-h{color:var(--acc);font-weight:800;font-size:10px;letter-spacing:2px;}'
      + '.elc-note-b{color:#dbe7ff;font-size:12px;line-height:1.32;margin-top:2px;}'
      + '.elc-brand{margin-top:auto;text-align:center;color:#5f74a6;font-weight:800;font-size:8px;letter-spacing:1px;padding:6px 0;}'
      // ----- locked card face -----
      + '.lock-card{position:absolute;inset:0;border-radius:20px;overflow:hidden;background:conic-gradient(from 210deg,#46506e,#2a3860,#556089,#2a3860,#46506e);}'
      + '.lock-in{position:absolute;inset:5px;border-radius:16px;background:linear-gradient(160deg,#0c1430,#060b1c);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;}'
      + '.lock-t{color:#8fa6cf;font-weight:800;font-size:22px;letter-spacing:5px;}'
      + '.lock-sub{color:#6f83b0;font-weight:800;font-size:11px;letter-spacing:2px;}'
      + '.lock-req{color:#eaf2ff;font-size:16px;line-height:1.4;font-weight:700;max-width:80%;}';
    var st = document.createElement('style'); st.id = 'dlc-styles'; st.textContent = css;
    document.head.appendChild(st);
  }

  // opts: { deck: [ {img:'..'} | {element:tier} ], index }
  DANNYLAB.openCardViewer = function (scene, opts) {
    if (document.querySelector('.dlc-overlay')) return;
    opts = opts || {};
    injectStyles();
    var deck = opts.deck || DANNYLAB.characterDeck(), idx = opts.index || 0;
    if (idx < 0 || idx >= deck.length) idx = 0;

    var ov = document.createElement('div'); ov.className = 'dlc-overlay';
    ov.innerHTML = '<div class="dlc-h">CARD COLLECTION</div>'
      + '<div class="dlc-row">'
      + '<button class="dlc-nav dlc-prev">&#8249;</button>'
      + '<div class="dlc-stage"><div class="dlc-card">'
      + '<div class="dlc-face dlc-front"><div class="dlc-content"></div><div class="dlc-foil"></div><div class="dlc-shine"></div><div class="dlc-glare"></div></div>'
      + '<div class="dlc-face dlc-back"><img class="dlc-img" src="' + DANNYLAB.CARD_BACK + '"><div class="dlc-foil"></div><div class="dlc-shine"></div></div>'
      + '</div></div>'
      + '<button class="dlc-nav dlc-next">&#8250;</button>'
      + '</div>'
      + '<div class="dlc-count"></div>'
      + '<div class="dlc-hint">Drag to spin &middot; double-tap to flip</div>'
      + '<button class="dlc-done">Done</button>';
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('show'); });

    var card = ov.querySelector('.dlc-card');
    var content = ov.querySelector('.dlc-content');
    var count = ov.querySelector('.dlc-count');
    var foils = ov.querySelectorAll('.dlc-foil'), shines = ov.querySelectorAll('.dlc-shine');
    var glare = ov.querySelector('.dlc-glare');
    var rx = -8, ry = -16, vx = 0, vy = 0, dragging = false, lastX = 0, lastY = 0, lastTap = 0;
    var raf = 0, closed = false, phase = 0, flipTarget = null;

    function render() {
      var spec = deck[idx];
      if (!DANNYLAB.cardUnlocked(spec)) content.innerHTML = lockedFrontHTML(spec);
      else content.innerHTML = spec.img ? '<img class="dlc-img" src="' + spec.img + '">' : elementCardHTML(scene, spec.element);
      count.textContent = (idx + 1) + ' / ' + deck.length;
    }
    render();

    function apply() {
      card.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      var a = Math.abs(Math.sin(ry * Math.PI / 180));
      for (var i = 0; i < foils.length; i++) { foils[i].style.opacity = 0.10 + 0.28 * a; foils[i].style.backgroundPosition = (50 + ry * 0.8) + '% ' + (50 + rx * 0.8) + '%'; }
      for (var j = 0; j < shines.length; j++) { shines[j].style.transform = 'translateX(' + (ry * 1.1) + '%)'; shines[j].style.opacity = 0.12 + 0.4 * a; }
      if (glare) { glare.style.transform = 'translate(' + (ry * 0.5) + '%,' + (-rx * 0.5) + '%)'; glare.style.opacity = 0.1 + 0.3 * Math.min(1, (Math.abs(rx) + Math.abs(ry)) / 55); }
    }
    function loop() {
      if (closed) return;
      phase += 0.02;
      if (flipTarget !== null) {
        ry += (flipTarget - ry) * 0.16;
        if (Math.abs(flipTarget - ry) < 0.4) { ry = flipTarget; flipTarget = null; }
      } else if (!dragging) {
        ry += vy; rx += vx; vy *= 0.94; vx *= 0.94;
        if (Math.abs(vy) < 0.05) vy = 0; if (Math.abs(vx) < 0.05) vx = 0;
        if (vy === 0 && vx === 0) { ry += Math.sin(phase) * 0.35; rx += (Math.cos(phase * 0.9) * 5 - rx) * 0.04; }
        else { rx += (0 - rx) * 0.04; }
      }
      if (rx > 44) rx = 44; if (rx < -44) rx = -44;
      apply(); raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    function cycle(d) {
      idx = (idx + d + deck.length) % deck.length;
      render();
      flipTarget = Math.round(ry / 360) * 360;   // snap to front to show the new card
      vy = vx = 0;
    }
    function down(e) {
      if (e.target.closest && e.target.closest('.dlc-done,.dlc-nav')) return;
      var now = Date.now();
      if (now - lastTap < 320) { flipTarget = Math.round(ry / 180) * 180 + 180; vy = vx = 0; }
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
    ov.querySelector('.dlc-prev').addEventListener('click', function () { cycle(-1); });
    ov.querySelector('.dlc-next').addEventListener('click', function () { cycle(1); });

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
