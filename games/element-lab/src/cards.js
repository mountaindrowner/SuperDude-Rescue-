// cards.js — collectible cards in a holographic 3D viewer, with rarities.
// Heroes have common/rare/ultra variants. Ultra cards run a CONTINUOUS themed
// ambience (storm, space, snow, jungle, warp, sparkle) for as long as the card
// is on screen, plus premium depth layers: parallax art, a floating sparkle
// layer, a pulsing theme-colored rim, and a depth vignette. Elements are their
// own deck. Shared card back (assets/cards/back.jpg).
window.DANNYLAB = window.DANNYLAB || {};
(function () {
  var A = 'assets/cards/';

  // rarity: common = flat (no shine), rare = holo shine, ultra = shine + ambience
  DANNYLAB.HEROES = [
    { key: 'kevin', name: 'Captain Kevin', variants: [
      { rarity: 'common', file: A + 'kevin_c.jpg',  req: { text: 'Play your first game', test: function (s) { return s.games >= 1; } } },
      { rarity: 'rare',   file: A + 'kevin.jpg',     req: { text: 'Reach Lab Level 3',    test: function (s) { return s.level >= 3; } } },
      { rarity: 'ultra',  file: A + 'kevin_ur.jpg',  fx: 'storm',  req: { text: 'Reach Lab Level 8', test: function (s) { return s.level >= 8; } } },
    ] },
    { key: 'josh', name: 'Zookeeper Josh', variants: [
      { rarity: 'common', file: A + 'josh_c.jpg',  req: { text: 'Discover 3 elements', test: function (s) { return s.discovered >= 3; } } },
      { rarity: 'rare',   file: A + 'josh.jpg',     req: { text: 'Discover 5 elements', test: function (s) { return s.discovered >= 5; } } },
      { rarity: 'ultra',  file: A + 'josh_ur.jpg',  fx: 'jungle', req: { text: 'Discover all 9 elements', test: function (s) { return s.discovered >= 9; } } },
    ] },
    { key: 'carlos', name: 'Galaxy Guide Carlos', variants: [
      { rarity: 'common', file: A + 'carlos_c.jpg', req: { text: 'Reach Lab Level 3', test: function (s) { return s.level >= 3; } } },
      { rarity: 'rare',   file: A + 'carlos.jpg',    req: { text: 'Reach Lab Level 5', test: function (s) { return s.level >= 5; } } },
      { rarity: 'ultra',  file: A + 'carlos_ur.jpg', fx: 'space', req: { text: 'Reach Lab Level 10', test: function (s) { return s.level >= 10; } } },
    ] },
    { key: 'nayah', name: 'Nature Expert Nayah', variants: [
      { rarity: 'common', file: A + 'nayah_c.jpg', req: { text: 'Discover 6 elements', test: function (s) { return s.discovered >= 6; } } },
      { rarity: 'rare',   file: A + 'nayah.jpg',    req: { text: 'Discover 7 elements', test: function (s) { return s.discovered >= 7; } } },
      { rarity: 'ultra',  file: A + 'nayah_ur.jpg', fx: 'snow', req: { text: 'Discover all 9 elements', test: function (s) { return s.discovered >= 9; } } },
    ] },
    { key: 'victoria', name: 'Time Tech Victoria', variants: [
      { rarity: 'common', file: A + 'victoria_c.jpg', req: { text: 'Reach Lab Level 6', test: function (s) { return s.level >= 6; } } },
      { rarity: 'rare',   file: A + 'victoria.jpg',    req: { text: 'Reach Lab Level 8', test: function (s) { return s.level >= 8; } } },
      { rarity: 'ultra',  file: A + 'victoria_ur.jpg', fx: 'warp', req: { text: 'Reach Lab Level 12', test: function (s) { return s.level >= 12; } } },
    ] },
    { key: 'danny', name: 'Super Dude Danny', variants: [
      { rarity: 'ultra', file: A + 'danny.jpg', fx: 'sparkle', req: { text: 'Collect the whole rescue team to find Danny!', test: function (s) { return s.games >= 1 && s.discovered >= 6 && s.level >= 6; } } },
    ] },
  ];
  DANNYLAB.CARD_BACK = A + 'back.jpg';

  function stem(file) { return file.split('/').pop().replace(/\.[a-z]+$/, ''); }
  DANNYLAB.cardTexKey = function (file) { return 'card_' + stem(file); };

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

  // ---------- stats / unlocks ----------
  DANNYLAB.cardStats = function () {
    var st = DANNYLAB.store;
    return { games: st.getGamesPlayed(), best: st.getBest(), level: st.getBestLevel(), discovered: st.getDiscovered().length };
  };
  DANNYLAB.cardUnlocked = function (spec) {
    if (spec.element) return DANNYLAB.store.isDiscovered(DANNYLAB.tierCfg(spec.element).sym);
    return spec.reqTest ? !!spec.reqTest(DANNYLAB.cardStats()) : true;
  };
  DANNYLAB.cardRequirement = function (spec) {
    if (spec.element) return 'Create this element in the lab to unlock its card.';
    return spec.reqText || 'Keep playing to unlock.';
  };

  // ---------- decks ----------
  function variantSpec(v) { return { img: v.file, rarity: v.rarity, fx: v.fx, reqTest: v.req.test, reqText: v.req.text }; }
  DANNYLAB.heroByKey = function (k) { for (var i = 0; i < DANNYLAB.HEROES.length; i++) if (DANNYLAB.HEROES[i].key === k) return DANNYLAB.HEROES[i]; return null; };
  DANNYLAB.heroDeck = function (key) { var h = DANNYLAB.heroByKey(key); return h ? h.variants.map(variantSpec) : []; };
  DANNYLAB.elementDeck = function () { return DANNYLAB.CONFIG.tiers.map(function (t) { return { element: t.t, rarity: 'holo' }; }); };
  // index of the best (highest-rarity) unlocked variant for a hero, else -1
  DANNYLAB.heroBestIndex = function (h) {
    var s = DANNYLAB.cardStats(), best = -1;
    for (var i = 0; i < h.variants.length; i++) if (h.variants[i].req.test(s)) best = i;
    return best;
  };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

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
    return '<div class="elc" style="--acc:' + accent + ';"><div class="elc-in">'
      + '<div class="elc-top"><span>ELEMENT</span><span>No.' + ('00' + meta.z).slice(-3) + '</span></div>'
      + '<div class="elc-hero"><div class="elc-glow"></div>' + (art ? '<img class="elc-art" src="' + art + '">' : '')
      + '<div class="elc-sym">' + esc(sym) + '</div>' + (meta.kind ? '<div class="elc-kind">' + esc(meta.kind) + '</div>' : '') + '</div>'
      + '<div class="elc-name">' + esc(name) + '</div><div class="elc-epi">"' + esc(meta.epi) + '"</div>'
      + '<div class="elc-stars">' + starStr + '</div>'
      + '<div class="elc-note"><div class="elc-note-h">LAB NOTE</div><div class="elc-note-b">' + esc(fact) + '</div></div>'
      + '<div class="elc-brand">SUPER DUDE DANNY &middot; ELEMENT LAB</div></div></div>';
  }

  function lockedFrontHTML(spec) {
    var lock = '<svg width="66" height="74" viewBox="0 0 64 74"><rect x="9" y="30" width="46" height="38" rx="8" fill="#6f83b0"/>'
      + '<path d="M18 32 v-9 a14 14 0 0 1 28 0 v9" fill="none" stroke="#6f83b0" stroke-width="7"/>'
      + '<circle cx="32" cy="46" r="5.5" fill="#0c1430"/><rect x="29.5" y="48" width="5" height="11" rx="2.5" fill="#0c1430"/></svg>';
    return '<div class="lock-card"><div class="lock-in">' + lock + '<div class="lock-t">LOCKED</div>'
      + '<div class="lock-sub">HOW TO UNLOCK</div><div class="lock-req">' + esc(DANNYLAB.cardRequirement(spec)) + '</div></div></div>';
  }

  var RARITY = { common: { label: 'COMMON', color: '#9fb2cf' }, rare: { label: 'RARE', color: '#8fd0ff' }, ultra: { label: 'ULTRA RARE', color: '#ffd84d' }, holo: { label: '', color: '#8fd0ff' } };
  // rim-glow accent per ultra theme
  var FX_COLOR = { storm: '#8fb8ff', space: '#c39bff', snow: '#cfeaff', jungle: '#7fe09a', warp: '#5ec8ff', sparkle: '#ffd84d' };

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
      + '.dlc-card.punch{animation:dlcpunch .6s ease-out;}'
      + '@keyframes dlcpunch{0%{filter:brightness(2.2)}30%{filter:brightness(1.4)}100%{filter:brightness(1)}}'
      + '.dlc-face{position:absolute;inset:0;border-radius:20px;overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden;box-shadow:0 18px 46px rgba(0,0,0,.6);}'
      + '.dlc-back{transform:rotateY(180deg);}'
      + '.dlc-content{position:absolute;inset:0;}'
      + '.dlc-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;will-change:transform;}'
      // depth vignette (settles the eye, makes the parallax pop)
      + '.dlc-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(115% 95% at 50% 38%,transparent 55%,rgba(2,6,18,.42));}'
      + '.dlc-foil{position:absolute;inset:0;pointer-events:none;'
      + 'background:linear-gradient(115deg,transparent 26%,rgba(255,80,140,.4),rgba(255,220,90,.4),rgba(90,255,150,.4),rgba(90,200,255,.4),rgba(160,110,255,.4),transparent 74%);'
      + 'background-size:240% 240%;mix-blend-mode:color-dodge;opacity:.14;}'
      + '.dlc-shine{position:absolute;inset:-45%;pointer-events:none;background:linear-gradient(103deg,transparent 44%,rgba(255,255,255,.6) 50%,transparent 56%);mix-blend-mode:screen;opacity:.25;}'
      + '.dlc-glare{position:absolute;inset:-25%;pointer-events:none;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.5),transparent 42%);mix-blend-mode:screen;opacity:.14;}'
      // floating sparkle layer (drifts more than the art -> reads as depth)
      + '.dlc-sparks{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;will-change:transform;}'
      + '.dlc-sparks span{position:absolute;border-radius:50%;background:radial-gradient(circle,#fff 0%,rgba(255,255,255,0) 70%);opacity:0;animation:dlcspk 2s ease-in-out infinite;}'
      + '@keyframes dlcspk{0%,100%{opacity:0;transform:scale(.3)}50%{opacity:.95;transform:scale(1)}}'
      // pulsing rim light, tinted to the card theme
      + '.dlc-rim{position:absolute;inset:0;border-radius:20px;pointer-events:none;animation:dlcrim 2.6s ease-in-out infinite;}'
      + '@keyframes dlcrim{0%,100%{opacity:.45}50%{opacity:1}}'
      + '.dlc-nav{width:52px;height:52px;border-radius:50%;border:none;background:#1b2748;color:#cfe0ff;font-size:26px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4);flex:0 0 auto;}'
      + '.dlc-nav:active{transform:translateY(2px);}'
      + '.dlc-meta{margin-top:14px;text-align:center;}'
      + '.dlc-rarity{font-weight:800;font-size:13px;letter-spacing:2px;}'
      + '.dlc-count{color:#8fb0e6;font-weight:700;font-size:13px;letter-spacing:1px;margin-top:2px;}'
      + '.dlc-hint{color:#cfe0ff;font-weight:700;font-size:15px;margin-top:6px;opacity:.85;}'
      + '.dlc-done{margin-top:14px;padding:13px 44px;border:none;border-radius:16px;background:#46506e;color:#eafffb;font-weight:800;font-size:19px;font-family:inherit;box-shadow:0 6px 16px rgba(0,0,0,.4);cursor:pointer;}'
      + '.dlc-done:active{transform:translateY(2px);}'
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
      + '.lock-card{position:absolute;inset:0;border-radius:20px;overflow:hidden;background:conic-gradient(from 210deg,#46506e,#2a3860,#556089,#2a3860,#46506e);}'
      + '.lock-in{position:absolute;inset:5px;border-radius:16px;background:linear-gradient(160deg,#0c1430,#060b1c);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;}'
      + '.lock-t{color:#8fa6cf;font-weight:800;font-size:22px;letter-spacing:5px;}'
      + '.lock-sub{color:#6f83b0;font-weight:800;font-size:11px;letter-spacing:2px;}'
      + '.lock-req{color:#eaf2ff;font-size:16px;line-height:1.4;font-weight:700;max-width:80%;}';
    var st = document.createElement('style'); st.id = 'dlc-styles'; st.textContent = css;
    document.head.appendChild(st);
  }

  // scatter twinkling sparkle specks over the card (fresh layout per card)
  function buildSparks(el) {
    var html = '';
    for (var i = 0; i < 18; i++) {
      var l = 4 + Math.random() * 92, t = 4 + Math.random() * 92, s = 2 + Math.random() * 3.5;
      var d = (Math.random() * 2.4).toFixed(2), du = (1.4 + Math.random() * 2.2).toFixed(2);
      html += '<span style="left:' + l + '%;top:' + t + '%;width:' + s + 'px;height:' + s + 'px;animation-delay:' + d + 's;animation-duration:' + du + 's;"></span>';
    }
    el.innerHTML = html;
  }

  // ---------- ultra-rare ambience (canvas; runs until stop()) ----------
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function startCardFX(ov, theme) {
    var stage = ov.querySelector('.dlc-stage'); if (!stage) return null;
    var r = stage.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var W = window.innerWidth, H = window.innerHeight;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cv = document.createElement('canvas'); cv.className = 'dlc-cine';
    cv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:100000;';
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ov.appendChild(cv);
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var card = ov.querySelector('.dlc-card');
    if (card) { card.classList.remove('punch'); void card.offsetWidth; card.classList.add('punch'); }

    var P = [], rings = [], bolt = null, nextBolt = 260, nextRing = 120;
    var t0 = performance.now(), stopped = false, raf = 0;

    // splash droplet arcing out from behind the card, then falling away
    function newDrop(seed) {
      var side = Math.random() < 0.5 ? -1 : 1;
      return { k: 'drop', x: cx + side * rnd(r.width * 0.3, r.width * 0.55), y: cy + rnd(0, r.height * 0.45),
        vx: side * rnd(40, 300), vy: -rnd(120, 420), r: rnd(2, 5), c: 'rgba(180,225,255,' + rnd(0.5, 0.9) + ')',
        delay: seed ? rnd(0, 1.2) : 0 };
    }
    // golden mote drifting up around the card, fading in and out
    function newGold(seed) {
      return { k: 'gold', x: cx + rnd(-r.width * 0.75, r.width * 0.75), y: cy + rnd(-r.height * 0.55, r.height * 0.65),
        vy: -rnd(14, 46), vx: rnd(-10, 10), life: rnd(1.2, 2.6), age: seed ? -rnd(0, 2) : 0, r: rnd(1.2, 3.4),
        c: Math.random() < 0.6 ? '#ffd84d' : '#fff2b0' };
    }

    if (theme === 'storm') {
      for (var i = 0; i < 90; i++) P.push({ k: 'rain', x: rnd(0, W), y: rnd(-H, H), vy: rnd(700, 1100), vx: rnd(120, 200), len: rnd(12, 26), c: 'rgba(190,220,255,' + rnd(0.3, 0.7) + ')' });
    } else if (theme === 'space') {
      for (var i2 = 0; i2 < 80; i2++) P.push({ k: 'star', x: rnd(0, W), y: rnd(0, H), r: rnd(0.6, 2.2), ph: rnd(0, 6.28), sp: rnd(2, 6) });
      for (var i3 = 0; i3 < 4; i3++) P.push({ k: 'shoot', x: rnd(W * 0.2, W), y: rnd(0, H * 0.5), vx: rnd(-900, -500), vy: rnd(300, 500), life: rnd(0.4, 0.9), age: -rnd(0, 2.5) });
      for (var i4 = 0; i4 < 26; i4++) P.push({ k: 'mote', x: rnd(0, W), y: rnd(0, H), vy: -rnd(8, 30), ph: rnd(0, 6.28), r: rnd(1, 2.4), c: Math.random() < 0.5 ? '255,233,168' : '191,227,255' });
    } else if (theme === 'snow') {
      for (var i5 = 0; i5 < 110; i5++) P.push({ k: 'snow', x: rnd(0, W), y: rnd(-H, H), vy: rnd(120, 260), sway: rnd(20, 55), ph: rnd(0, 6.28), r: rnd(1.5, 3.6) });
      for (var iw = 0; iw < 22; iw++) P.push({ k: 'wind', x: rnd(-W, W), y: rnd(0, H), len: rnd(90, 260), spd: rnd(0.8, 1.6), a: rnd(0.1, 0.26) });
    } else if (theme === 'jungle') {
      for (var i6 = 0; i6 < 60; i6++) P.push(newDrop(true));
      for (var i7 = 0; i7 < 14; i7++) P.push({ k: 'leaf', x: rnd(0, W), y: rnd(-H, 0), vx: rnd(-40, 40), vy: rnd(60, 140), rot: rnd(0, 6.28), vr: rnd(-3, 3), sway: rnd(20, 60), ph: rnd(0, 6.28), sz: rnd(6, 13), c: Math.random() < 0.5 ? '#4caf50' : '#8bc34a' });
    } else if (theme === 'warp') {
      for (var i8 = 0; i8 < 46; i8++) P.push({ k: 'streak', a: rnd(0, 6.28), sp: rnd(400, 850), t0: -rnd(0, 900), c: 'rgba(90,190,255,' + rnd(0.4, 0.8) + ')' });
    } else { // sparkle (Danny)
      for (var i9 = 0; i9 < 46; i9++) P.push(newGold(true));
      rings.push({ t: 40, c: '255,216,77' });
    }

    function frame(now) {
      if (stopped) return;
      var el = now - t0, dt = 1 / 60;
      ctx.clearRect(0, 0, W, H);
      // reveal flash, then the ambience just keeps going
      if (el < 320) { ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - el / 320)) + ')'; ctx.fillRect(0, 0, W, H); }
      if (theme === 'sparkle') {
        var ra = el < 1300 ? (1 - el / 1300) * 0.16 + 0.05 : 0.05;   // big on reveal, soft forever after
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(el * 0.00045); ctx.globalCompositeOperation = 'lighter';
        for (var k = 0; k < 12; k++) { ctx.rotate(Math.PI / 6); ctx.fillStyle = 'rgba(255,216,77,' + ra + ')'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-26, -700); ctx.lineTo(26, -700); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      }
      if (theme === 'warp' && el > nextRing) { rings.push({ t: el }); nextRing = el + rnd(550, 850); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var ri = rings.length - 1; ri >= 0; ri--) {
        var rg = rings[ri], age = (el - rg.t) / 900;
        if (age >= 1) { rings.splice(ri, 1); continue; }
        if (age > 0) { ctx.strokeStyle = 'rgba(' + (rg.c || '90,190,255') + ',' + (0.8 * (1 - age)) + ')'; ctx.lineWidth = 5 * (1 - age) + 1; ctx.beginPath(); ctx.arc(cx, cy, age * 520, 0, 6.28); ctx.stroke(); }
      }
      ctx.restore();
      if (theme === 'storm') {   // lightning keeps striking on a loose rhythm
        if (!bolt && el > nextBolt) bolt = { t: el, path: null };
        if (bolt) {
          var ba = (el - bolt.t) / 130;
          if (ba < 1) {
            ctx.fillStyle = 'rgba(210,230,255,' + (0.55 * (1 - ba)) + ')'; ctx.fillRect(0, 0, W, H);
            if (!bolt.path) { bolt.path = []; var bx = rnd(W * 0.2, W * 0.8), by = 0; while (by < H * 0.75) { bolt.path.push([bx, by]); bx += rnd(-60, 60); by += rnd(40, 90); } }
            ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bolt.path[0][0], bolt.path[0][1]);
            for (var pi = 1; pi < bolt.path.length; pi++) ctx.lineTo(bolt.path[pi][0], bolt.path[pi][1]);
            ctx.stroke();
          } else { bolt = null; nextBolt = el + rnd(1400, 3200); }
        }
      }
      // gusting wind (rightward), pulses stronger every few seconds
      var gust = (theme === 'snow') ? (70 + 110 * Math.sin(el * 0.0009) + 80 * Math.max(0, Math.sin(el * 0.0024))) : 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        if (p.k === 'rain') { p.x += p.vx * dt; p.y += p.vy * dt; if (p.y > H) { p.y = -20; p.x = rnd(0, W); } if (p.x > W + 20) p.x = -10; ctx.strokeStyle = p.c; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.02, p.y - p.len); ctx.stroke(); }
        else if (p.k === 'snow') { p.y += p.vy * dt; p.x += (Math.sin((el / 500) + p.ph) * p.sway + gust) * dt; if (p.y > H) { p.y = -10; p.x = rnd(0, W); } if (p.x > W + 12) p.x = -12; else if (p.x < -12) p.x = W + 12; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); }
        else if (p.k === 'wind') { p.x += (190 + gust * 2.4) * p.spd * dt; if (p.x > W + p.len) { p.x = -p.len - rnd(0, W * 0.5); p.y = rnd(0, H); } ctx.strokeStyle = 'rgba(224,240,255,' + (p.a * (0.5 + 0.5 * Math.max(0, Math.sin(el * 0.0024)))) + ')'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.len, p.y + p.len * 0.06); ctx.stroke(); }
        else if (p.k === 'star') { var tw = 0.4 + 0.6 * Math.abs(Math.sin(el / 1000 * p.sp + p.ph)); ctx.fillStyle = 'rgba(255,255,255,' + tw + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); }
        else if (p.k === 'shoot') { p.age += dt; if (p.age > p.life) { p.x = rnd(W * 0.2, W); p.y = rnd(0, H * 0.5); p.age = -rnd(0.6, 3); } if (p.age > 0) { var sx = p.x + p.vx * p.age, sy = p.y + p.vy * p.age; ctx.strokeStyle = 'rgba(255,255,255,' + (1 - p.age / p.life) + ')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - p.vx * 0.05, sy - p.vy * 0.05); ctx.stroke(); } }
        else if (p.k === 'mote') { p.y += p.vy * dt; if (p.y < -6) { p.y = H + 6; p.x = rnd(0, W); } var ma = 0.25 + 0.5 * Math.abs(Math.sin(el / 900 + p.ph)); ctx.fillStyle = 'rgba(' + p.c + ',' + ma + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); }
        else if (p.k === 'drop') { if (p.delay > 0) { p.delay -= dt; continue; } p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y > H + 12 || p.x < -12 || p.x > W + 12) { P[i] = newDrop(false); continue; } ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); }
        else if (p.k === 'leaf') { p.x += (p.vx + Math.sin(el / 700 + p.ph) * p.sway) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > H + 16) { p.y = -14; p.x = rnd(0, W); } ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 0.85; ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.sz, p.sz * 0.45, 0, 0, 6.28); ctx.fill(); ctx.restore(); }
        else if (p.k === 'streak') { var sAge = (el - p.t0) / 1000; var d = p.sp * sAge; if (d > 640) { p.t0 = el; p.a = rnd(0, 6.28); d = 0; } if (d > 0) { ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(p.a) * d * 0.5, cy + Math.sin(p.a) * d * 0.5); ctx.lineTo(cx + Math.cos(p.a) * d, cy + Math.sin(p.a) * d); ctx.stroke(); } }
        else if (p.k === 'gold') { p.age += dt; if (p.age > p.life) { P[i] = newGold(false); continue; } if (p.age > 0) { p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.sin(Math.PI * p.age / p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; } }
      }
      ctx.restore();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return { stop: function () { if (stopped) return; stopped = true; cancelAnimationFrame(raf); if (cv.parentNode) cv.parentNode.removeChild(cv); if (card) card.classList.remove('punch'); } };
  }

  // opts: { deck, index }
  DANNYLAB.openCardViewer = function (scene, opts) {
    if (document.querySelector('.dlc-overlay')) return;
    opts = opts || {};
    injectStyles();
    var deck = opts.deck || DANNYLAB.elementDeck(), idx = opts.index || 0;
    if (idx < 0 || idx >= deck.length) idx = 0;

    var ov = document.createElement('div'); ov.className = 'dlc-overlay';
    ov.innerHTML = '<div class="dlc-h">CARD COLLECTION</div>'
      + '<div class="dlc-row"><button class="dlc-nav dlc-prev">&#8249;</button>'
      + '<div class="dlc-stage"><div class="dlc-card">'
      + '<div class="dlc-face dlc-front"><div class="dlc-content"></div><div class="dlc-vig"></div><div class="dlc-foil"></div><div class="dlc-shine"></div><div class="dlc-glare"></div><div class="dlc-sparks"></div><div class="dlc-rim"></div></div>'
      + '<div class="dlc-face dlc-back"><img class="dlc-img" src="' + DANNYLAB.CARD_BACK + '"><div class="dlc-foil"></div><div class="dlc-shine"></div></div>'
      + '</div></div><button class="dlc-nav dlc-next">&#8250;</button></div>'
      + '<div class="dlc-meta"><div class="dlc-rarity"></div><div class="dlc-count"></div></div>'
      + '<div class="dlc-hint">Drag to spin &middot; double-tap to flip</div><button class="dlc-done">Done</button>';
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('show'); });

    var card = ov.querySelector('.dlc-card'), content = ov.querySelector('.dlc-content');
    var frontFace = ov.querySelector('.dlc-front'), backFace = ov.querySelector('.dlc-back');
    var count = ov.querySelector('.dlc-count'), rarityEl = ov.querySelector('.dlc-rarity');
    var foils = ov.querySelectorAll('.dlc-foil'), shines = ov.querySelectorAll('.dlc-shine');
    var glare = ov.querySelector('.dlc-glare');
    var vigEl = ov.querySelector('.dlc-vig'), rimEl = ov.querySelector('.dlc-rim'), sparksEl = ov.querySelector('.dlc-sparks');
    var rx = -8, ry = -16, vx = 0, vy = 0, dragging = false, lastX = 0, lastY = 0, lastTap = 0;
    var raf = 0, closed = false, phase = 0, flipTarget = null, holoOn = true;
    var artEl = null, fxHandle = null;

    function render() {
      if (fxHandle) { fxHandle.stop(); fxHandle = null; }
      var spec = deck[idx], unlocked = DANNYLAB.cardUnlocked(spec);
      var rar = spec.rarity || (spec.element ? 'holo' : 'common');
      var ultra = false;
      if (!unlocked) { content.innerHTML = lockedFrontHTML(spec); holoOn = false; rarityEl.textContent = ''; }
      else {
        content.innerHTML = spec.img ? '<img class="dlc-img" src="' + spec.img + '">' : elementCardHTML(scene, spec.element);
        holoOn = rar !== 'common';
        ultra = rar === 'ultra';
        var info = RARITY[rar] || RARITY.common;
        rarityEl.textContent = info.label; rarityEl.style.color = info.color;
      }
      artEl = content.querySelector('.dlc-img');
      // premium layers: vignette + rim for any holo card; sparkles + ambience for ultra
      vigEl.style.display = holoOn ? 'block' : 'none';
      rimEl.style.display = holoOn ? 'block' : 'none';
      var rimC = (ultra && deck[idx].fx && FX_COLOR[deck[idx].fx]) || '#8fd0ff';
      rimEl.style.boxShadow = 'inset 0 0 30px ' + rimC + (ultra ? 'cc' : '66') + ', inset 0 0 7px ' + rimC + '99';
      sparksEl.style.display = ultra ? 'block' : 'none';
      if (ultra) buildSparks(sparksEl);
      if (ultra && deck[idx].fx) fxHandle = startCardFX(ov, deck[idx].fx);
      count.textContent = (idx + 1) + ' / ' + deck.length;
    }
    render();

    function apply() {
      card.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      // Show exactly one face by rotation angle. iOS Safari breaks
      // backface-visibility when a face has overflow:hidden, so a mirrored
      // front leaks through when spun past 90 — this guarantees the flip.
      var f = ((ry % 360) + 360) % 360, showingBack = (f > 90 && f < 270);
      frontFace.style.visibility = showingBack ? 'hidden' : 'visible';
      backFace.style.visibility = showingBack ? 'visible' : 'hidden';
      var a = Math.abs(Math.sin(ry * Math.PI / 180));
      for (var i = 0; i < foils.length; i++) { foils[i].style.opacity = holoOn ? (0.10 + 0.28 * a) : 0; foils[i].style.backgroundPosition = (50 + ry * 0.8) + '% ' + (50 + rx * 0.8) + '%'; }
      for (var j = 0; j < shines.length; j++) { shines[j].style.opacity = holoOn ? (0.12 + 0.4 * a) : 0; shines[j].style.transform = 'translateX(' + (ry * 1.1) + '%)'; }
      if (glare) { glare.style.opacity = holoOn ? (0.1 + 0.3 * Math.min(1, (Math.abs(rx) + Math.abs(ry)) / 55)) : 0; glare.style.transform = 'translate(' + (ry * 0.5) + '%,' + (-rx * 0.5) + '%)'; }
      // parallax depth: the art sits behind the frame, sparkles float in front
      if (artEl) artEl.style.transform = 'scale(1.07) translate(' + (-ry * 0.28) + 'px,' + (rx * 0.28) + 'px)';
      sparksEl.style.transform = 'translate(' + (ry * 0.55) + 'px,' + (-rx * 0.55) + 'px)';
    }
    function loop() {
      if (closed) return;
      phase += 0.02;
      if (flipTarget !== null) { ry += (flipTarget - ry) * 0.16; if (Math.abs(flipTarget - ry) < 0.4) { ry = flipTarget; flipTarget = null; } }
      else if (!dragging) {
        ry += vy; rx += vx; vy *= 0.94; vx *= 0.94;
        if (Math.abs(vy) < 0.05) vy = 0; if (Math.abs(vx) < 0.05) vx = 0;
        if (vy === 0 && vx === 0) { ry += Math.sin(phase) * 0.35; rx += (Math.cos(phase * 0.9) * 5 - rx) * 0.04; } else { rx += (0 - rx) * 0.04; }
      }
      if (rx > 44) rx = 44; if (rx < -44) rx = -44;
      apply(); raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    function cycle(d) { idx = (idx + d + deck.length) % deck.length; render(); flipTarget = Math.round(ry / 360) * 360; vy = vx = 0; }
    function down(e) {
      if (e.target.closest && e.target.closest('.dlc-done,.dlc-nav')) return;
      var now = Date.now();
      if (now - lastTap < 320) { flipTarget = Math.round(ry / 180) * 180 + 180; vy = vx = 0; }
      lastTap = now; dragging = true; card.style.cursor = 'grabbing'; lastX = e.clientX; lastY = e.clientY;
      if (e.preventDefault) e.preventDefault();
    }
    function move(e) { if (!dragging || flipTarget !== null) return; var dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; ry += dx * 0.6; rx -= dy * 0.6; vy = dx * 0.6; vx = -dy * 0.6; }
    function upp() { dragging = false; card.style.cursor = 'grab'; }
    ov.addEventListener('pointerdown', down); ov.addEventListener('pointermove', move);
    ov.addEventListener('pointerup', upp); ov.addEventListener('pointercancel', upp);
    ov.querySelector('.dlc-prev').addEventListener('click', function () { cycle(-1); });
    ov.querySelector('.dlc-next').addEventListener('click', function () { cycle(1); });

    function close() {
      if (closed) return; closed = true; cancelAnimationFrame(raf);
      if (fxHandle) { fxHandle.stop(); fxHandle = null; }
      ov.classList.remove('show');
      setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 220);
      if (opts.onClose) opts.onClose();
    }
    ov.querySelector('.dlc-done').addEventListener('click', close);
    return { close: close };
  };
})();
