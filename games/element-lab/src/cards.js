// cards.js — collectible character cards. Full-art fronts + a shared back
// (real assets in assets/cards/), shown with an interactive holographic 3D
// look: a CSS-3D DOM viewer (drag to spin in perspective, double-tap to flip,
// a moving foil sheen + shine), and a small shimmering Phaser card on the menu.
window.DANNYLAB = window.DANNYLAB || {};
(function () {
  // the set (order = browse order). Fronts are full baked art; back is shared.
  DANNYLAB.CARDS = [
    { key: 'kevin',    file: 'assets/cards/kevin.jpg',    name: 'Captain Kevin' },
    { key: 'nayah',    file: 'assets/cards/nayah.jpg',    name: 'Nature Expert Nayah' },
    { key: 'carlos',   file: 'assets/cards/carlos.jpg',   name: 'Galaxy Guide Carlos' },
    { key: 'victoria', file: 'assets/cards/victoria.jpg', name: 'Time Tech Victoria' },
    { key: 'josh',     file: 'assets/cards/josh.jpg',     name: 'Zookeeper Josh' },
  ];
  DANNYLAB.CARD_BACK = 'assets/cards/back.jpg';

  // ---------------- full 3D holographic viewer (DOM / CSS-3D overlay) ----------------
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
      + '.dlc-done:active{transform:translateY(2px);}';
    var st = document.createElement('style'); st.id = 'dlc-styles'; st.textContent = css;
    document.head.appendChild(st);
  }

  // Open the full-screen 3D card. index = starting card in DANNYLAB.CARDS.
  DANNYLAB.openCardViewer = function (scene, opts) {
    if (document.querySelector('.dlc-overlay')) return;
    opts = opts || {};
    injectStyles();
    var CARDS = DANNYLAB.CARDS, idx = opts.index || 0;

    var ov = document.createElement('div'); ov.className = 'dlc-overlay';
    ov.innerHTML = '<div class="dlc-h">CARD COLLECTION</div>'
      + '<div class="dlc-row">'
      + '<button class="dlc-nav dlc-prev">&#8249;</button>'
      + '<div class="dlc-stage"><div class="dlc-card">'
      + '<div class="dlc-face dlc-front"><img class="dlc-img" src="' + CARDS[idx].file + '"><div class="dlc-foil"></div><div class="dlc-shine"></div><div class="dlc-glare"></div></div>'
      + '<div class="dlc-face dlc-back"><img class="dlc-img" src="' + DANNYLAB.CARD_BACK + '"><div class="dlc-foil"></div><div class="dlc-shine"></div></div>'
      + '</div></div>'
      + '<button class="dlc-nav dlc-next">&#8250;</button>'
      + '</div>'
      + '<div class="dlc-count">' + (idx + 1) + ' / ' + CARDS.length + '</div>'
      + '<div class="dlc-hint">Drag to spin &middot; double-tap to flip</div>'
      + '<button class="dlc-done">Done</button>';
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('show'); });

    var card = ov.querySelector('.dlc-card');
    var frontImg = ov.querySelector('.dlc-front .dlc-img');
    var count = ov.querySelector('.dlc-count');
    var foils = ov.querySelectorAll('.dlc-foil'), shines = ov.querySelectorAll('.dlc-shine');
    var glare = ov.querySelector('.dlc-glare');
    var rx = -8, ry = -16, vx = 0, vy = 0, dragging = false, lastX = 0, lastY = 0, lastTap = 0;
    var raf = 0, closed = false, phase = 0, flipTarget = null;

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
      idx = (idx + d + CARDS.length) % CARDS.length;
      frontImg.src = CARDS[idx].file;
      count.textContent = (idx + 1) + ' / ' + CARDS.length;
      flipTarget = Math.round(ry / 360) * 360;   // snap to the front to show the new card
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
