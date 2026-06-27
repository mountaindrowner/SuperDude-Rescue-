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
      var game = self.scene.get('DANNYLAB_Game');
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

    function onoff(v) { return v === 'on' ? t('on', lang) : t('off', lang); }

    // Sound
    UI.toggleRow(this, x, y, rw, t('sound', lang), onoff(this.registry.get('sfx')), function () {
      var nv = self.registry.get('sfx') === 'on' ? 'off' : 'on';
      self.registry.set('sfx', nv); store.setOpt('sfx', nv); if (audio) audio.setSfx(nv === 'on');
      return onoff(nv);
    });
    // Music
    UI.toggleRow(this, x, y + gap, rw, t('music', lang), onoff(this.registry.get('music')), function () {
      var nv = self.registry.get('music') === 'on' ? 'off' : 'on';
      self.registry.set('music', nv); store.setOpt('music', nv); if (audio) audio.setMusic(nv === 'on');
      return onoff(nv);
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
        var p = self.scene.get(parent);
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

  // ================= GAME OVER =================
  DANNYLAB.GameOverScene = defscene('DANNYLAB_GameOver', function (data) {
    var W = DANNYLAB.GEO.W, H = DANNYLAB.GEO.H, lang = data.lang || this.registry.get('lang');
    UI.scrim(this, 0.62);
    UI.panel(this, W / 2, H / 2, Math.min(440, W * 0.88), 440);
    this.add.text(W / 2, H / 2 - 150, t('game_over', lang), {
      fontFamily: UI.FONT, fontSize: '30px', color: '#FBD38D', fontStyle: 'bold',
      align: 'center', wordWrap: { width: W * 0.74 },
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 60, t('score', lang) + ': ' + data.score, {
      fontFamily: UI.FONT, fontSize: '34px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 14, t('best', lang) + ': ' + data.best, {
      fontFamily: UI.FONT, fontSize: '26px', color: '#7CFF6B', fontStyle: 'bold',
    }).setOrigin(0.5);

    var self = this, bw = Math.min(320, W * 0.7);
    UI.button(this, W / 2, H / 2 + 60, bw, 64, t('play_again', lang), function () {
      self.scene.stop('DANNYLAB_Game');
      self.scene.stop();
      self.scene.start('DANNYLAB_Game', { mode: self.registry.get('mode') });
    }, { fill: 0x46b85e });
    UI.button(this, W / 2, H / 2 + 134, bw, 60, t('exit', lang), function () {
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

    var cards = [t('howto_1', lang), t('howto_2', lang), t('howto_3', lang)];
    var icons = [DANNYLAB.iconKey(this, 1), DANNYLAB.iconKey(this, 3), null];
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
      if (icons[i]) { img.setTexture(icons[i]).setDisplaySize(86, 86).setVisible(true); } else img.setVisible(false);
      dots.setText(['○○○', '○○○', '○○○'][0].split('').map(function (_, k) { return k === i ? '●' : '○'; }).join(' '));
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
    UI.scrim(this, 0.62);
    UI.panel(this, W / 2, H / 2, Math.min(460, W * 0.92), 600);
    this.add.text(W / 2, H / 2 - 260, t('collection', lang), {
      fontFamily: UI.FONT, fontSize: '34px', color: '#7CFF6B', fontStyle: 'bold',
    }).setOrigin(0.5);
    // best Lab Level flex (Addendum §3)
    this.add.text(W / 2, H / 2 - 228, t('lab_level', lang) + ': ' + DANNYLAB.store.getBestLevel(), {
      fontFamily: UI.FONT, fontSize: '18px', color: '#FBD38D', fontStyle: 'bold',
    }).setOrigin(0.5);

    var discovered = DANNYLAB.store.getDiscovered();
    var cols = 3, cellW = Math.min(130, (W * 0.8) / cols), cellH = 130;
    var startX = W / 2 - cellW, startY = H / 2 - 180;
    var self = this;
    DANNYLAB.CONFIG.tiers.forEach(function (cfg, i) {
      var col = i % cols, row = Math.floor(i / cols);
      var cx = startX + col * cellW, cyy = startY + row * cellH;
      var known = discovered.indexOf(cfg.sym) !== -1;
      var cell = self.add.graphics();
      cell.fillStyle(0x0c1430, 0.6); cell.fillRoundedRect(cx - cellW / 2 + 6, cyy - cellH / 2 + 6, cellW - 12, cellH - 12, 12);
      cell.lineStyle(2, known ? cfg.color : 0x334066, 0.8);
      cell.strokeRoundedRect(cx - cellW / 2 + 6, cyy - cellH / 2 + 6, cellW - 12, cellH - 12, 12);
      if (known) {
        var im = self.add.image(cx, cyy - 14, DANNYLAB.iconKey(self, cfg.t));
        im.setDisplaySize(58, 58);
        self.add.text(cx, cyy + 34, DANNYLAB.elementName(cfg.sym, lang), {
          fontFamily: UI.FONT, fontSize: '15px', color: '#dceaff', fontStyle: 'bold',
        }).setOrigin(0.5);
      } else {
        self.add.text(cx, cyy, '?', {
          fontFamily: UI.FONT, fontSize: '40px', color: '#3a4a66', fontStyle: 'bold',
        }).setOrigin(0.5);
      }
    });

    UI.button(this, W / 2, H / 2 + 250, Math.min(300, W * 0.66), 60, t('back', lang), function () {
      self.scene.stop(); self.scene.resume(parent);
    }, { fill: 0x46506e });
  });
})();
