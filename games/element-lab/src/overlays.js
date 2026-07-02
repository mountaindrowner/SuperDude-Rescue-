// overlays.js — parallel overlay scenes (Brief §7/§8): Pause, Options,
// GameOver, HowTo, Discovery, Collection. Each launches over a paused
// parent and resumes it on close. None ever destroys the Phaser game.
window.DANNYLAB = window.DANNYLAB || {};
(function () {
  var UI = DANNYLAB.UI, t = DANNYLAB.t;

  // proto helper
  function defscene(key, createFn) {
    var S = function () { Phaser.Scene.call(this, { key: key }); };
    S.prototype = Object.create(Phaser.Scene.prototype);
    S.prototype.constructor = S;
    S.prototype.init = function (data) { this.data2 = data || {}; };
    S.prototype.create = function () { DANNYLAB.applyRes(this); createFn.call(this, this.data2); };
    return S;
  }

  // resume the parent scene (and re-enable its physics if it's the game)
  function closeTo(scene, parentKey) {
    var parent = scene.scene.get(parentKey);
    scene.scene.stop();
    scene.scene.resume(parentKey);
    if (parent && parent.resumeFromOverlay) parent.resumeFromOverlay();
  }

  // ================= PAUSE =================
  DANNYLAB.PauseScene = defscene('DANNYLAB_Pause', function (data) {
    var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H, lang = this.registry.get('lang');
    UI.scrim(this, 0.55);
    UI.panel(this, W / 2, H / 2, Math.min(420, W * 0.86), 470);
    this.add.text(W / 2, H / 2 - 180, t('paused', lang), {
      fontFamily: UI.FONT, fontSize: '40px', color: '#7CFF6B', fontStyle: 'bold',
    }).setOrigin(0.5);
    var self = this, bw = Math.min(320, W * 0.7), gap = 84, y0 = H / 2 - 90;
    UI.button(this, W / 2, y0, bw, 66, t('resume', lang), function () { closeTo(self, 'DANNYLAB_Game'); }, { fill: 0x46b85e });
    UI.button(this, W / 2, y0 + gap, bw, 66, t('restart', lang), function () {
      self.scene.stop();
      self.scene.stop('DANNYLAB_Game');
      self.scene.start('DANNYLAB_Game', { mode: self.registry.get('mode') });
    }, { fill: 0x5b8def });
    UI.button(this, W / 2, y0 + gap * 2, bw, 66, t('options', lang), function () {
      self.scene.pause(); self.scene.launch('DANNYLAB_Options', { parent: 'DANNYLAB_Pause' });
    }, { fill: 0x5b8def });
    UI.button(this, W / 2, y0 + gap * 3, bw, 66, t('exit_to_select', lang), function () {
      DANNYLAB.exitSubgame(self);
    }, { fill: 0xc05b7a, fontSize: 22 });
  });

  // ================= OPTIONS =================
  DANNYLAB.OptionsScene = defscene('DANNYLAB_Options', function (data) {
    var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H;
    var lang = this.registry.get('lang'), store = DANNYLAB.store, audio = this.registry.get('audio');
    var parent = data.parent || 'DANNYLAB_Menu';
    UI.scrim(this, 0.6);
    UI.panel(this, W / 2, H / 2, Math.min(460, W * 0.9), 560);
    this.add.text(W / 2, H / 2 - 230, t('options', lang), {
      fontFamily: UI.FONT, fontSize: '38px', color: '#7CFF6B', fontStyle: 'bold',
    }).setOrigin(0.5);

    var self = this, rw = Math.min(400, W * 0.8), x = W / 2, y = H / 2 - 150, gap = 70;

    // Sound (SFX) volume — drag slider, 0 = muted
    UI.slider(this, x, y, rw, t('sound', lang), audio ? audio.getSfxVol() : 0.5, function (v) {
      if (audio) audio.setSfxVolume(v);
      store.setOpt('volSfx', v);
    });
    // Music volume — drag slider, 0 = muted
    UI.slider(this, x, y + gap, rw, t('music', lang), audio ? audio.getMusicVol() : 0.5, function (v) {
      if (audio) audio.setMusicVolume(v);
      store.setOpt('volMusic', v);
    });
    // Language (live relabel: restart this panel + flag UI rebuild)
    UI.toggleRow(this, x, y + gap * 2, rw, t('language', lang), lang.toUpperCase(), function () {
      var nv = self.registry.get('lang') === 'en' ? 'es' : 'en';
      self.registry.set('lang', nv); store.setOpt('lang', nv);
      self.registry.set('uiDirty', true);
      self.scene.restart(data);    // relabel the options panel itself
      return nv.toUpperCase();
    });
    // Mode
    UI.toggleRow(this, x, y + gap * 3, rw, t('mode', lang),
      t(this.registry.get('mode'), lang), function () {
        var nv = self.registry.get('mode') === 'endless' ? 'zen' : 'endless';
        self.registry.set('mode', nv); store.setOpt('mode', nv);
        return t(nv, lang);
      });

    // Reset Collection (with confirm)
    UI.button(this, x, y + gap * 4 + 10, rw, 56, t('reset_collection', lang), function () {
      self.scene.launch('DANNYLAB_Confirm', {
        message: t('confirm', lang),
        onYes: function () { store.resetCollection(); },
      });
    }, { fill: 0xc05b7a, fontSize: 22 });

    // Back
    UI.button(this, x, H / 2 + 230, rw, 60, t('back', lang), function () {
      var dirty = self.registry.get('uiDirty');
      self.registry.set('uiDirty', false);
      self.scene.stop();
      self.scene.resume(parent);
      if (dirty) {
        // rebuild whichever UI we came from so the new language shows live
        if (parent === 'DANNYLAB_Menu' || parent === 'DANNYLAB_Pause') self.scene.get(parent).scene.restart();
      }
    }, { fill: 0x46506e });
  });

  // ================= CONFIRM (tiny yes/no) =================
  DANNYLAB.ConfirmScene = defscene('DANNYLAB_Confirm', function (data) {
    var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H, lang = this.registry.get('lang');
    UI.scrim(this, 0.5);
    UI.panel(this, W / 2, H / 2, Math.min(400, W * 0.84), 220);
    this.add.text(W / 2, H / 2 - 50, data.message || '?', {
      fontFamily: UI.FONT, fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
      align: 'center', wordWrap: { width: W * 0.7 },
    }).setOrigin(0.5);
    var self = this;
    UI.button(this, W / 2 - 90, H / 2 + 50, 150, 60, t('yes', lang), function () {
      if (data.onYes) data.onYes(); self.scene.stop();
    }, { fill: 0xc05b7a });
    UI.button(this, W / 2 + 90, H / 2 + 50, 150, 60, t('no', lang), function () {
      self.scene.stop();
    }, { fill: 0x46506e });
  });

  // ================= GAME OVER (run recap) =================
  DANNYLAB.GameOverScene = defscene('DANNYLAB_GameOver', function (data) {
    var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H, lang = data.lang || this.registry.get('lang');
    var self = this;
    UI.scrim(this, 0.62);
    UI.panel(this, W / 2, H / 2, Math.min(452, W * 0.9), 640);
    this.add.text(W / 2, H / 2 - 274, t('game_over', lang), {
      fontFamily: UI.FONT, fontSize: '28px', color: '#FBD38D', fontStyle: 'bold',
      align: 'center', wordWrap: { width: W * 0.76 },
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 216, t('score', lang) + ': ' + data.score, {
      fontFamily: UI.FONT, fontSize: '34px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    var bestLine = data.daily
      ? data.daily.mod.name + '  ·  ' + t('go_dailybest', lang) + ': ' + data.dailyBest
      : t('best', lang) + ': ' + data.best;
    this.add.text(W / 2, H / 2 - 176, bestLine, {
      fontFamily: UI.FONT, fontSize: data.daily ? '18px' : '22px',
      color: data.daily ? '#ffd84d' : '#7CFF6B', fontStyle: 'bold',
    }).setOrigin(0.5);

    // run recap: lab level reached + biggest chain
    var recap = t('lab_level', lang) + ' ' + (data.level || 0);
    if (data.combo > 1) recap += '   ·   ' + t('go_combo', lang) + ' x' + data.combo;
    this.add.text(W / 2, H / 2 - 136, recap, {
      fontFamily: UI.FONT, fontSize: '19px', color: '#8fe6ff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // elements discovered this run (icon strip)
    var disc = data.discovered || [];
    if (disc.length) {
      this.add.text(W / 2, H / 2 - 100, t('go_discovered', lang), {
        fontFamily: UI.DISPLAY, fontSize: '13px', color: '#bfe3ff', fontStyle: 'bold',
      }).setOrigin(0.5);
      var dw = 36, dx0 = W / 2 - (disc.length - 1) * dw / 2;
      for (var di = 0; di < disc.length && di < 9; di++) {
        var tierN = 1; DANNYLAB.CONFIG.tiers.forEach(function (c) { if (c.sym === disc[di]) tierN = c.t; });
        this.add.image(dx0 + di * dw, H / 2 - 66, DANNYLAB.iconKey(this, tierN)).setDisplaySize(30, 30);
      }
    }

    // new cards earned this run (mini gold-edged thumbs)
    var cards = data.newCards || [];
    if (cards.length) {
      this.add.text(W / 2, H / 2 - 22, t('go_newcards', lang), {
        fontFamily: UI.DISPLAY, fontSize: '14px', color: '#ffd84d', fontStyle: 'bold',
      }).setOrigin(0.5);
      var cw = 44, ch = 61, cgap = 12, cx0 = W / 2 - (Math.min(cards.length, 5) - 1) * (cw + cgap) / 2;
      for (var ci = 0; ci < cards.length && ci < 5; ci++) {
        var ccx = cx0 + ci * (cw + cgap), ccy = H / 2 + 26;
        var cg = this.add.graphics();
        cg.lineStyle(2.5, 0xffd84d, 1); cg.strokeRoundedRect(ccx - cw / 2 - 2, ccy - ch / 2 - 2, cw + 4, ch + 4, 6);
        var texKey = DANNYLAB.cardTexKey(cards[ci].file);
        if (this.textures.exists(texKey)) this.add.image(ccx, ccy, texKey).setDisplaySize(cw, ch);
      }
    } else if (DANNYLAB.nextLockedCard) {
      // nothing new this run -> point at the next card worth chasing
      var nxt = DANNYLAB.nextLockedCard();
      if (nxt) {
        this.add.text(W / 2, H / 2 - 22, t('go_next', lang), {
          fontFamily: UI.DISPLAY, fontSize: '13px', color: '#bfe3ff', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 16, nxt.name + '\n' + nxt.req, {
          fontFamily: UI.FONT, fontSize: '17px', color: '#dceaff', fontStyle: 'bold',
          align: 'center', lineSpacing: 4, wordWrap: { width: 360 },
        }).setOrigin(0.5);
      }
    }

    var bw = Math.min(320, W * 0.7);
    UI.button(this, W / 2, H / 2 + 128, bw, 62, t('play_again', lang), function () {
      self.scene.stop('DANNYLAB_Game');
      self.scene.stop();
      // route through the loading interstitial (a wonder-of-creation fact);
      // a daily run replays the same daily
      self.scene.start('DANNYLAB_Loading', { mode: self.registry.get('mode'), daily: data.daily || null });
    }, { fill: 0x46b85e });
    UI.button(this, W / 2, H / 2 + 202, bw, 58, t('exit', lang), function () {
      DANNYLAB.exitSubgame(self);
    }, { fill: 0xc05b7a });
  });

  // ================= HOW TO PLAY =================
  DANNYLAB.HowToScene = defscene('DANNYLAB_HowTo', function (data) {
    var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H, lang = this.registry.get('lang');
    var parent = data.parent || 'DANNYLAB_Menu';
    UI.scrim(this, 0.6);
    UI.panel(this, W / 2, H / 2, Math.min(440, W * 0.9), 480);
    this.add.text(W / 2, H / 2 - 200, t('how_to', lang), {
      fontFamily: UI.FONT, fontSize: '34px', color: '#7CFF6B', fontStyle: 'bold',
    }).setOrigin(0.5);

    var cards = [t('howto_1', lang), t('howto_2', lang), t('howto_3', lang),
                 t('howto_4', lang), t('howto_5', lang), t('howto_6', lang)];
    var icons = [DANNYLAB.iconKey(this, 1), DANNYLAB.iconKey(this, 3), null,
                 'mystery_body', 'jelly_star', 'card_back'];
    this.idx = 0;
    var self = this;
    var img = this.add.image(W / 2, H / 2 - 80, DANNYLAB.iconKey(this, 1));
    img.setDisplaySize(86, 86);
    var body = this.add.text(W / 2, H / 2 + 30, '', {
      fontFamily: UI.FONT, fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
      align: 'center', wordWrap: { width: W * 0.74 },
    }).setOrigin(0.5);
    var dots = this.add.text(W / 2, H / 2 + 120, '', {
      fontFamily: UI.FONT, fontSize: '22px', color: '#8fb6ff',
    }).setOrigin(0.5);

    function show(i) {
      body.setText(cards[i]);
      if (icons[i] && self.textures.exists(icons[i])) {
        // keep the card-back thumb card-shaped; everything else square
        if (icons[i] === 'card_back') img.setTexture(icons[i]).setDisplaySize(66, 92).setVisible(true);
        else img.setTexture(icons[i]).setDisplaySize(86, 86).setVisible(true);
      } else img.setVisible(false);
      dots.setText(cards.map(function (_, k) { return k === i ? '●' : '○'; }).join(' '));
      self.tweens.add({ targets: body, scale: { from: 0.9, to: 1 }, duration: 150 });
    }
    show(0);

    var nextBtn = UI.button(this, W / 2, H / 2 + 190, Math.min(300, W * 0.66), 60, t('next_label', lang), function () {
      self.idx++;
      if (self.idx >= cards.length) {
        self.scene.stop(); self.scene.resume(parent);
      } else {
        show(self.idx);
        if (self.idx === cards.length - 1) nextBtn.setLabel(t('back', lang));
      }
    }, { fill: 0x5b8def });
  });

  // ================= COLLECTION (periodic shelf) =================
  DANNYLAB.CollectionScene = defscene('DANNYLAB_Collection', function (data) {
    var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H, lang = this.registry.get('lang');
    var parent = data.parent || 'DANNYLAB_Menu';
    var self = this;
    UI.scrim(this, 0.62);
    UI.panel(this, W / 2, H / 2, Math.min(468, W * 0.94), 704);
    var counts = DANNYLAB.ownedCardCount ? DANNYLAB.ownedCardCount() : null;
    this.add.text(W / 2, H / 2 - 316, t('collection', lang) + (counts ? '  ' + counts.owned + '/' + counts.total : ''), {
      fontFamily: UI.FONT, fontSize: '32px', color: '#7CFF6B', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ----- Character Cards: a row of tappable thumbnails -> 3D holo viewer -----
    this.add.text(W / 2, H / 2 - 276, 'CHARACTER CARDS', {
      fontFamily: UI.DISPLAY, fontSize: '16px', color: '#bfe3ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    var heroes = DANNYLAB.HEROES || [];
    var tw = 62, th = 86, gap = 10, cardsY = H / 2 - 210;
    var startCX = W / 2 - (heroes.length - 1) * (tw + gap) / 2;
    var thumbs = [];
    var rarColor = { common: 0x9fb2cf, rare: 0x8fd0ff, ultra: 0xffd84d };
    heroes.forEach(function (h, i) {
      var cx = startCX + i * (tw + gap);
      var best = DANNYLAB.heroBestIndex(h);              // -1 if nothing unlocked
      var unlocked = best >= 0;
      var edge = unlocked ? (rarColor[h.variants[best].rarity] || 0x8fd0ff) : 0x3a4a66;
      var g = self.add.graphics();
      g.fillStyle(0x0c1430, 0.7); g.fillRoundedRect(cx - tw / 2 - 2, cardsY - th / 2 - 2, tw + 4, th + 4, 8);
      g.lineStyle(2.5, edge, 0.9); g.strokeRoundedRect(cx - tw / 2 - 2, cardsY - th / 2 - 2, tw + 4, th + 4, 8);
      var texKey = unlocked ? DANNYLAB.cardTexKey(h.variants[best].file) : 'card_back';
      if (self.textures.exists(texKey)) self.add.image(cx, cardsY, texKey).setDisplaySize(tw, th).setAlpha(unlocked ? 1 : 0.7);
      if (!unlocked) {
        var lk = self.add.graphics();
        lk.lineStyle(4, 0xcfe0ff, 1); lk.strokeCircle(cx, cardsY - 4, 8);
        lk.fillStyle(0xcfe0ff, 1); lk.fillRoundedRect(cx - 11, cardsY - 2, 22, 17, 4);
        lk.fillStyle(0x0c1430, 1); lk.fillCircle(cx, cardsY + 6, 2.5);
      }
      // binder pips: one per variant, lit in its rarity colour once earned
      var stats0 = DANNYLAB.cardStats(), seen0 = DANNYLAB.store.getCardList('cardsSeen');
      var pipY = cardsY + th / 2 + 9, pipW = 13, pipX0 = cx - (h.variants.length - 1) * pipW / 2;
      var pg = self.add.graphics();
      var hasNew = false;
      h.variants.forEach(function (v, vi) {
        var on = v.req.test(stats0);
        if (on && seen0.indexOf(h.key + ':' + v.rarity) === -1) hasNew = true;
        pg.fillStyle(on ? (rarColor[v.rarity] || 0x8fd0ff) : 0x22304e, 1);
        pg.fillCircle(pipX0 + vi * pipW, pipY, 3.6);
        if (!on) { pg.lineStyle(1, 0x3a4a66, 1); pg.strokeCircle(pipX0 + vi * pipW, pipY, 3.6); }
      });
      // gold "!" dot on thumbs holding an earned-but-unviewed card
      if (hasNew) {
        var nd = self.add.graphics();
        nd.fillStyle(0xffd84d, 1); nd.fillCircle(cx + tw / 2 - 2, cardsY - th / 2 + 2, 8);
        nd.lineStyle(1.5, 0x0c1430, 1); nd.strokeCircle(cx + tw / 2 - 2, cardsY - th / 2 + 2, 8);
        self.add.text(cx + tw / 2 - 2, cardsY - th / 2 + 2, '!', {
          fontFamily: UI.FONT, fontSize: '12px', color: '#0c1430', fontStyle: 'bold' }).setOrigin(0.5);
      }
      thumbs.push({ x: cx, y: cardsY, key: h.key, best: best });
    });
    var elemCells = [];   // populated by the element grid below
    this.input.on('pointerdown', function (p) {
      var k, o;
      for (k = 0; k < thumbs.length; k++) {
        o = thumbs[k];
        if (Math.abs(p.worldX - o.x) < tw / 2 + 4 && Math.abs(p.worldY - o.y) < th / 2 + 4) {
          if (DANNYLAB.openCardViewer) DANNYLAB.openCardViewer(self, { deck: DANNYLAB.heroDeck(o.key), index: Math.max(0, o.best) });
          return;
        }
      }
      for (k = 0; k < elemCells.length; k++) {
        o = elemCells[k];
        if (Math.abs(p.worldX - o.x) < o.w / 2 && Math.abs(p.worldY - o.y) < o.h / 2) {
          if (DANNYLAB.openCardViewer) DANNYLAB.openCardViewer(self, { deck: DANNYLAB.elementDeck(), index: o.tier - 1 });
          return;
        }
      }
    });

    // ----- Elements shelf -----
    this.add.text(W / 2 - 150, H / 2 - 142, 'ELEMENTS', {
      fontFamily: UI.DISPLAY, fontSize: '16px', color: '#bfe3ff', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(W / 2 + 150, H / 2 - 142, t('lab_level', lang) + ': ' + DANNYLAB.store.getBestLevel(), {
      fontFamily: UI.FONT, fontSize: '15px', color: '#FBD38D', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    var discovered = DANNYLAB.store.getDiscovered();
    var cols = 3, cellW = Math.min(132, (W * 0.82) / cols), cellH = 112;
    var startX = W / 2 - cellW, startY = H / 2 - 72;
    DANNYLAB.CONFIG.tiers.forEach(function (cfg, i) {
      var col = i % cols, row = Math.floor(i / cols);
      var cx = startX + col * cellW, cyy = startY + row * cellH;
      var known = discovered.indexOf(cfg.sym) !== -1;
      elemCells.push({ x: cx, y: cyy, w: cellW - 12, h: cellH - 10, tier: cfg.t });
      var cell = self.add.graphics();
      cell.fillStyle(0x0c1430, 0.6); cell.fillRoundedRect(cx - cellW / 2 + 6, cyy - cellH / 2 + 5, cellW - 12, cellH - 10, 12);
      cell.lineStyle(2, known ? cfg.color : 0x334066, 0.8);
      cell.strokeRoundedRect(cx - cellW / 2 + 6, cyy - cellH / 2 + 5, cellW - 12, cellH - 10, 12);
      if (known) {
        self.add.image(cx, cyy - 12, DANNYLAB.iconKey(self, cfg.t)).setDisplaySize(50, 50);
        self.add.text(cx, cyy + 30, DANNYLAB.elementName(cfg.sym, lang), {
          fontFamily: UI.FONT, fontSize: '14px', color: '#dceaff', fontStyle: 'bold',
        }).setOrigin(0.5);
      } else {
        self.add.text(cx, cyy, '?', {
          fontFamily: UI.FONT, fontSize: '36px', color: '#3a4a66', fontStyle: 'bold',
        }).setOrigin(0.5);
      }
    });

    UI.button(this, W / 2, H / 2 + 312, Math.min(300, W * 0.66), 58, t('back', lang), function () {
      self.scene.stop(); self.scene.resume(parent);
    }, { fill: 0x46506e });
  });

  // ================= LOADING (between runs) =================
  // A short interstitial shown after a loss while the next run spins up: a real
  // "wonder of creation" science fact. Auto-advances; tap to skip.
  DANNYLAB.LoadingScene = defscene('DANNYLAB_Loading', function (data) {
    var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H, lang = this.registry.get('lang');
    var self = this, mode = (data && data.mode) || this.registry.get('mode');

    // a fresh neon accent each time, for that cool electric-lab glow
    var neons = [0x4fd9ff, 0xff66ff, 0x7CFF6B, 0xFBD38D, 0xF687B3, 0x9F7AEA, 0x4FD1C5];
    var neon = neons[Math.floor(Math.random() * neons.length)];
    var neonHex = '#' + neon.toString(16).padStart(6, '0');

    // --- backdrop: deep gradient + a few drifting motes ---
    var g = this.add.graphics();
    var bands = 32;
    for (var i = 0; i < bands; i++) {
      var col = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x16263d),
        Phaser.Display.Color.ValueToColor(0x060c1a), bands, i);
      g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
      g.fillRect(0, H * (i / bands), W, H / bands + 1);
    }
    for (var mi = 0; mi < 16; mi++) {
      var px = Math.random() * W, py = Math.random() * H, pr = 1 + Math.random() * 2.4;
      var mote = this.add.circle(px, py, pr, neon, 0.55).setBlendMode('ADD');
      this.tweens.add({ targets: mote, y: py - 30 - Math.random() * 50, alpha: 0,
        duration: 2600 + Math.random() * 1800, repeat: -1, ease: 'Sine.inOut', delay: Math.random() * 1200 });
    }

    // --- header ---
    var header = this.add.text(W / 2, H * 0.205, t('loading_header', lang), {
      fontFamily: UI.DISPLAY, fontSize: '30px', color: '#FBD38D', fontStyle: 'bold',
      align: 'center', wordWrap: { width: W * 0.86 },
    }).setOrigin(0.5).setAlpha(0);
    header.setShadow(0, 0, '#e0a020', 12);
    this.tweens.add({ targets: header, alpha: 1, duration: 400 });

    // --- a sample element bobbing above the card (lab flavour) ---
    var tier = 1 + Math.floor(Math.random() * DANNYLAB.MAX_TIER);
    var icon = this.add.image(W / 2, H * 0.34, DANNYLAB.iconKey(this, tier)).setDisplaySize(78, 78).setAlpha(0);
    this.tweens.add({ targets: icon, alpha: 1, duration: 500 });
    this.tweens.add({ targets: icon, y: icon.y - 12, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // --- glass card holding the fact, lit with the neon accent ---
    var cardW = Math.min(440, W * 0.88), cardH = 240, cy = H * 0.53;
    UI.panel(this, W / 2, cy, cardW, cardH, { neon: neon });
    var fact = this.add.text(W / 2, cy + 14, DANNYLAB.randomFact(lang), {
      fontFamily: UI.FONT, fontSize: '24px', color: '#f3fbff', fontStyle: 'bold',
      align: 'center', lineSpacing: 6, wordWrap: { width: cardW - 56 },
    }).setOrigin(0.5).setAlpha(0);
    fact.setShadow(0, 0, neonHex, 16);     // neon halo around the words
    this.tweens.add({ targets: fact, alpha: 1, duration: 500, delay: 150 });

    // --- progress bar ---
    var barW = Math.min(380, W * 0.74), barH = 14, barX = W / 2 - barW / 2, barY = H * 0.76;
    var track = this.add.graphics();
    track.fillStyle(0x0b1530, 0.85); track.fillRoundedRect(barX, barY, barW, barH, 7);
    track.lineStyle(1.5, neon, 0.6); track.strokeRoundedRect(barX, barY, barW, barH, 7);
    var fill = this.add.rectangle(barX + 3, barY + barH / 2, barW - 6, barH - 6, neon).setOrigin(0, 0.5).setBlendMode('ADD');
    fill.scaleX = 0;
    this.add.text(W / 2, barY + 36, t('loading_sub', lang), {
      fontFamily: UI.FONT, fontSize: '18px', color: '#8fb6ff',
    }).setOrigin(0.5);

    // --- advance to the next run (once) ---
    var DUR = 2900, started = false;
    function go() { if (started) return; started = true; self.scene.start('DANNYLAB_Game', { mode: mode, daily: (data && data.daily) || null }); }
    this.tweens.add({ targets: fill, scaleX: 1, duration: DUR, ease: 'Sine.inOut', onComplete: go });
    // tap to skip, after a short readable minimum
    this.time.delayedCall(650, function () { self.input.once('pointerdown', go); });
    // if we're torn down early (e.g. Exit to Game Select), make sure a pending
    // tween/timer can't fire go() and resurrect the game after we're gone.
    this.events.once('shutdown', function () { started = true; });
  });
})();
