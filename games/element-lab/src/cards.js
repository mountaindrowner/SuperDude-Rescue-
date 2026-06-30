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
    // diamond lattice
    bgk.lineStyle(1, 0x2a3e74, 0.7);
    for (var dx = -CW / 2; dx < CW / 2 + 40; dx += 28) { bgk.lineBetween(dx, -CH / 2, dx - CH, CH / 2); bgk.lineBetween(dx, -CH / 2, dx + CH, CH / 2); }
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

  // ---------------- full-screen interactive demo (the POC viewer) ----------------
  DANNYLAB.CardDemoScene = function () { Phaser.Scene.call(this, { key: 'DANNYLAB_CardDemo' }); };
  DANNYLAB.CardDemoScene.prototype = Object.create(Phaser.Scene.prototype);
  DANNYLAB.CardDemoScene.prototype.constructor = DANNYLAB.CardDemoScene;
  DANNYLAB.CardDemoScene.prototype.init = function (d) { this.d2 = d || {}; };
  DANNYLAB.CardDemoScene.prototype.create = function () {
    DANNYLAB.applyRes(this);
    var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H, UI = DANNYLAB.UI, self = this;
    var sc = this.add.graphics(); sc.fillStyle(0x04060f, 0.86); sc.fillRect(0, 0, W, H);
    sc.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);

    this.add.text(W / 2, 120, 'HOLO CARD — PROTOTYPE', {
      fontFamily: UI.DISPLAY, fontSize: '26px', color: '#7CFF6B', fontStyle: 'bold' }).setOrigin(0.5).setShadow(0, 0, '#7CFF6B', 10);

    this.holo = DANNYLAB.buildHoloCard(this, { x: W / 2, y: H * 0.45, scale: 1.08, tier: this.d2.tier || 9 });
    this.add.text(W / 2, H * 0.73, 'Drag to tilt  ·  Tap to flip', {
      fontFamily: UI.FONT, fontSize: '20px', color: '#cfe0ff', fontStyle: 'bold' }).setOrigin(0.5);

    UI.button(this, W / 2, H * 0.85, 220, 60, 'Done', function () {
      self.scene.stop(); self.scene.resume(self.d2.parent || 'DANNYLAB_Menu');
    }, { fill: 0x46506e });

    var cx = this.holo.root.x, cy = this.holo.root.y, half = this.holo.half;
    this.dragging = false; this.tdx = 0; this.tdy = 0; this.cdx = 0; this.cdy = 0;
    this.input.on('pointerdown', function (p) {
      if (Math.abs(p.worldX - cx) < half.x * 1.15 && Math.abs(p.worldY - cy) < half.y * 1.15) {
        self.dragging = true; self._dx = p.worldX; self._dy = p.worldY; self._moved = 0; self._dt = self.time.now;
      }
    });
    this.input.on('pointermove', function (p) {
      if (!self.dragging) return;
      self._moved = Math.max(self._moved, Math.hypot(p.worldX - self._dx, p.worldY - self._dy));
      self.tdx = Phaser.Math.Clamp((p.worldX - cx) / half.x, -1, 1);
      self.tdy = Phaser.Math.Clamp((p.worldY - cy) / half.y, -1, 1);
    });
    function up() {
      if (!self.dragging) return;
      self.dragging = false; self.tdx = 0; self.tdy = 0;
      if (self._moved < 12 && (self.time.now - self._dt) < 450) self.holo.flip();
    }
    this.input.on('pointerup', up); this.input.on('pointerupoutside', up);
  };
  DANNYLAB.CardDemoScene.prototype.update = function (time) {
    if (!this.holo) return;
    if (!this.dragging) { this.tdx = Math.sin(time * 0.0006) * 0.5; this.tdy = Math.cos(time * 0.00085) * 0.35; }
    this.cdx += (this.tdx - this.cdx) * 0.12; this.cdy += (this.tdy - this.cdy) * 0.12;
    this.holo.shimmer(this.cdx, this.cdy);
  };
})();
