// scenes/snack.js - SNACK ATTACK menus (v0.80.0).
// [template section 4] HUB (play / power-ups / unlocks) -> HEROES (pick
// or buy) -> STAGES (pick an open one) -> the run -> RESULTS -> back.
// Plus the in-run PAUSE overlay. Everything reads PC.SnackProfile, the
// Snack Attack save, and never touches Story's.
window.PC = window.PC || {};

// ---------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------
PC.SnackUI = {
  header: function (scene, title, sub) {
    var W = PC.RENDER.W, K = PC.uiK;
    var g = scene.add.graphics().setDepth(10);
    PC.labPanel(g, 4, 4, W - 8, K(40), { rivets: true, base: 0x1c1733, edge: 0x6d6a8e });
    PC.ui.text(scene, W / 2, K(9), title, 'title', { color: '#f2c33c', align: 'center' }).setOrigin(0.5, 0).setDepth(11);
    var s = PC.ui.text(scene, W / 2, K(29), sub || '', 'caption', { color: '#cfd4e8', align: 'center' }).setOrigin(0.5, 0).setDepth(11);
    return s;
  },
  wallet: function () { return '$ ' + PC.SnackProfile.get().wallet; },
  button: function (scene, x, y, w, h, label, col, fn, depth) {
    var K = PC.uiK, d = depth || 20;
    var g = scene.add.graphics().setDepth(d);
    PC.labPanel(g, x - w / 2, y - h / 2, w, h, { rivets: true, base: 0x1c1733, edge: col });
    var t = PC.ui.text(scene, x, y, label, 'label', { color: '#' + ('00000' + col.toString(16)).slice(-6), align: 'center' })
      .setOrigin(0.5).setDepth(d + 1);
    PC.ui.fit(t, w - K(10));
    var z = scene.add.zone(x, y, w, h).setDepth(d + 2).setInteractive({ useHandCursor: true });
    z.on('pointerdown', function (p, lx, ly, ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      if (PC.audio) { PC.audio.unlock(); PC.audio.ui(); }
      fn();
    });
    return { g: g, t: t, z: z };
  },
  backdrop: function (scene, col) {
    var W = PC.RENDER.W, H = PC.RENDER.H;
    scene.cameras.main.setBackgroundColor(col || 0x161226);
    var g = scene.add.graphics().setDepth(0);
    g.lineStyle(1, 0x241f3d, 0.6);
    for (var x = 0; x < W; x += 24) g.lineBetween(x, 0, x, H);
    for (var y = 0; y < H; y += 24) g.lineBetween(0, y, W, y);
    var foods = ['still_d1_fry', 'still_d1_hotdog', 'still_d1_popcorn', 'still_d1_pretzel', 'still_d1_toast'];
    for (var i = 0; i < 14; i++) {
      scene.add.image(PC.hash01(i, 3, 7) * W, PC.hash01(i, 4, 8) * H, 'atlas', foods[i % 5])
        .setAlpha(0.10).setAngle(PC.hash01(i, 5, 9) * 360).setScale(1.2).setDepth(0);
    }
  },
};

// a drag-to-scroll list that resolves its own taps (a masked container
// hides rows but does not stop their input, so rows have no zones)
PC.SnackList = function (scene, x, y, w, h, rowH) {
  var self = this;
  this.scene = scene; this.x = x; this.y = y; this.w = w; this.h = h; this.rowH = rowH;
  this.rows = []; this.scroll = 0;
  this.c = scene.add.container(0, 0).setDepth(5);
  var mg = scene.make.graphics({ add: false });
  mg.fillStyle(0xffffff).fillRect(x, y, w, h);
  this.c.setMask(mg.createGeometryMask());
  this.bar = scene.add.graphics().setDepth(6);
  var zone = scene.add.zone(x + w / 2, y + h / 2, w, h).setDepth(4).setInteractive();
  var drag = null;
  var wp = function (p) { return scene.cameras.main.getWorldPoint(p.x, p.y); };
  zone.on('pointerdown', function (p) { drag = { y0: wp(p).y, s0: self.scroll, moved: false }; });
  scene.input.on('pointermove', function (p) {
    if (!drag || !p.isDown) return;
    var d = wp(p).y - drag.y0;
    if (Math.abs(d) > 6) drag.moved = true;
    if (drag.moved) self.setScroll(drag.s0 - d);
  });
  scene.input.on('pointerup', function (p) {
    if (!drag) return;
    var was = drag; drag = null;
    if (was.moved) return;
    var pt = wp(p);
    if (pt.x < self.x || pt.x > self.x + self.w || pt.y < self.y || pt.y > self.y + self.h) return;
    var i = Math.floor((pt.y - self.y + self.scroll) / self.rowH);
    var row = self.rows[i];
    if (row && row.onTap) { if (PC.audio) { PC.audio.unlock(); } row.onTap(); }
  });
  scene.input.on('wheel', function (p, go, dx, dy) { self.setScroll(self.scroll + dy * 0.6); });
};
PC.SnackList.prototype.maxScroll = function () { return Math.max(0, this.rows.length * this.rowH - this.h); };
PC.SnackList.prototype.setScroll = function (s, keepWant) {
  this.scroll = Math.max(0, Math.min(this.maxScroll(), s));
  if (!keepWant) this._want = this.scroll;
  this.c.y = -this.scroll;
  var g = this.bar; g.clear();
  var ms = this.maxScroll();
  if (ms <= 0) return;
  var th = Math.max(20, this.h * this.h / (this.h + ms));
  var ty = this.y + (this.h - th) * (this.scroll / ms);
  g.fillStyle(0x45356e, 0.9).fillRect(this.x + this.w - 3, ty, 3, th);
};
// build(c, x, y, w, h) adds objects into container c and returns
// { onTap: fn } (optional)
PC.SnackList.prototype.add = function (build) {
  var y = this.y + this.rows.length * this.rowH;
  var row = build(this.c, this.x, y, this.w - 6, this.rowH) || {};
  this.rows.push(row);
  // a rebuild (tap to select) keeps where you'd scrolled: it used to jump
  // to the top, so the second tap ("tap again = go") hit another row
  this.setScroll(this._want || 0, true);
  return row;
};
PC.SnackList.prototype.clear = function () {
  this.c.removeAll(true);
  this.rows = [];
  this.setScroll(0, true);         // _want survives: add() restores it
};

// ---------------------------------------------------------------
// HUB
// ---------------------------------------------------------------
PC.SnackHubScene = function () { Phaser.Scene.call(this, { key: 'PC_SnackHub' }); };
PC.SnackHubScene.prototype = Object.create(Phaser.Scene.prototype);
PC.SnackHubScene.prototype.constructor = PC.SnackHubScene;
PC.SnackHubScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK, self = this, P = PC.SnackProfile;
  PC.SnackUI.backdrop(this, 0x161226);
  if (PC.audio) PC.audio.startMusic('menu');
  var prof = P.get();
  // the logo, in the title screen's plate style
  // short, wide screens (landscape: H is only ~K(312)) cannot fit the
  // logo over five buttons, so the logo goes left and the buttons right
  var wide = H < K(410) && W > H;
  var cx = wide ? W * 0.3 : W / 2, bx = wide ? W * 0.7 : W / 2;
  var top = wide ? H / 2 - K(52) : Math.max(K(70), H * 0.17);
  var plate = function (word, col, hex, y) {
    var g = self.add.graphics().setDepth(2);
    var w = K(200), h = K(38);
    PC.labPanel(g, cx - w / 2, y - h / 2, w, h, { rivets: true, base: 0x1c1733, edge: 0x6d6a8e });
    g.fillStyle(hex, 0.12).fillRoundedRect(cx - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4, 4);
    PC.logoText(self, cx, y, word, K(26), col).setDepth(3);   // a container: above its plate
  };
  plate('SNACK', '#ff9ecb', 0xff9ecb, top);
  plate('ATTACK', '#f2c33c', 0xf2c33c, top + K(46));
  PC.ui.text(this, cx, top + K(74), 'SURVIVE 15 MINUTES. GET STRONGER EVERY RUN.', 'caption',
    { color: '#cfd4e8', align: 'center' }).setOrigin(0.5);
  PC.ui.text(this, cx, top + K(92), 'GOLD  ' + PC.SnackUI.wallet(), 'label', { color: '#f2c33c', align: 'center' }).setOrigin(0.5);

  var bw = wide ? Math.min(W * 0.4, K(220)) : Math.min(W - K(60), K(220)), bh = K(34);
  var y0 = wide ? H / 2 - K(88) : top + K(130);
  var done = prof.done.length, total = PC.SNACK.ACHIEVEMENTS.length;
  PC.SnackUI.button(this, bx, y0, bw, bh, '>> PLAY <<', 0xa8e04a, function () { self.scene.start('PC_SnackHeroes'); });
  PC.SnackUI.button(this, bx, y0 + K(44), bw, bh, 'POWER-UPS', 0xf2c33c, function () { self.scene.start('PC_SnackShop'); });
  PC.SnackUI.button(this, bx, y0 + K(88), bw, bh, 'UNLOCKS  ' + done + '/' + total, 0x35d0ff, function () { self.scene.start('PC_SnackUnlocks'); });
  PC.SnackUI.button(this, bx, y0 + K(132), bw, bh, 'OPTIONS', 0xcfd4e8, function () { PC.OptionsPanel.open(self); });
  PC.SnackUI.button(this, bx, y0 + K(176), bw, bh, '< BACK', 0x6d6a8e, function () { self.scene.start('PC_Title'); });

  // first visit: the whole mode in three lines
  if (!prof.seenIntro) {
    prof.seenIntro = true; P.save();
    var ph = K(116), pw = Math.min(W - K(24), K(300));
    var ui = [];
    ui.push(this.add.rectangle(W / 2, H / 2, W, H, 0x0b0818, 0.85).setDepth(50));
    var g = this.add.graphics().setDepth(51);
    PC.labPanel(g, W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, { rivets: true, base: 0x1c1733, edge: 0xff9ecb });
    ui.push(g);
    ui.push(PC.ui.text(this, W / 2, H / 2 - ph / 2 + K(10), 'HOW SNACK ATTACK WORKS', 'label', { color: '#ff9ecb', align: 'center' }).setOrigin(0.5, 0).setDepth(52));
    ui.push(PC.ui.text(this, W / 2, H / 2 - ph / 2 + K(32),
      'Move. Your gear fires itself.\nLevel up, pick an upgrade. Every run builds different.\nCoins you grab stay yours: buy heroes and POWER-UPS.\nHit high levels to open new stages.',
      'caption', { color: '#f7f4ef', align: 'center', wrap: pw - K(20) }).setOrigin(0.5, 0).setDepth(52));
    ui.push(PC.ui.text(this, W / 2, H / 2 + ph / 2 - K(16), 'TAP', 'caption', { color: '#a8e04a' }).setOrigin(0.5).setDepth(52));
    var z = this.add.zone(W / 2, H / 2, W, H).setDepth(53).setInteractive();
    ui.push(z);
    z.on('pointerdown', function (p, lx, ly, ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      if (PC.audio) PC.audio.unlock();
      ui.forEach(function (o) { o.destroy(); });
    });
  }
};

// ---------------------------------------------------------------
// HEROES: pick an owned hero, buy one for sale, see how to earn the rest
// ---------------------------------------------------------------
PC.SnackHeroesScene = function () { Phaser.Scene.call(this, { key: 'PC_SnackHeroes' }); };
PC.SnackHeroesScene.prototype = Object.create(Phaser.Scene.prototype);
PC.SnackHeroesScene.prototype.constructor = PC.SnackHeroesScene;
PC.SnackHeroesScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK, self = this, P = PC.SnackProfile;
  PC.SnackUI.backdrop(this);
  this.sub = PC.SnackUI.header(this, 'PICK A HERO', '');
  var top = K(50), bottom = H - K(52);
  this.list = new PC.SnackList(this, K(8), top, W - K(16), bottom - top, K(62));
  PC.SnackUI.button(this, K(8) + K(44), H - K(26), K(84), K(30), '< BACK', 0x6d6a8e, function () { self.scene.start('PC_SnackHub'); });
  PC.SnackUI.button(this, W - K(8) - K(64), H - K(26), K(124), K(30), 'NEXT >', 0xa8e04a, function () {
    if (P.heroState(P.get().selectedHero) !== 'owned') return;
    self.scene.start('PC_SnackStages');
  });
  this.build();
};
PC.SnackHeroesScene.prototype.build = function () {
  var self = this, K = PC.uiK, P = PC.SnackProfile, prof = P.get();
  this.sub.setText('GOLD  ' + PC.SnackUI.wallet());
  this.list.clear();
  PC.SNACK.HEROES.forEach(function (hd) {
    var hero = PC.heroById(hd.id), kit = PC.KITS && PC.KITS[hd.id];
    var st = P.heroState(hd.id), sel = prof.selectedHero === hd.id && st === 'owned';
    self.list.add(function (c, x, y, w, h) {
      var g = self.add.graphics();
      var price = P.heroPrice(hd.id), afford = prof.wallet >= price;
      PC.labPanel(g, x, y + 2, w, h - 4, { radius: 5,
        base: sel ? 0x24343f : (st === 'locked' ? 0x171330 : 0x1f1b35),
        edge: sel ? 0xa8e04a : (st === 'forSale' && afford ? 0xf2c33c : 0x45356e) });
      var im = self.add.image(x + K(28), y + h / 2, 'atlas', 'portrait_' + hd.id).setDisplaySize(K(44), K(44));
      if (st === 'locked') im.setTint(0x120e24).setAlpha(0.6);    // no face spoilers
      var name = PC.ui.text(self, x + K(58), y + K(8), st === 'locked' ? '???' : hero.name, 'label', { color: '#f7f4ef' });
      var role = PC.ui.text(self, x + K(58), y + K(26), st === 'locked' ? '' : (kit ? kit.kitName : '') , 'caption', { color: '#35d0ff' });
      var how = '';
      if (st === 'locked') {
        var a = PC.SNACK.achievementById(hd.unlockBy);
        how = 'TO UNLOCK: ' + (a ? a.how : '???');
      } else if (PC.SNACK.HERO_GROWTH && PC.SNACK.HERO_GROWTH[hd.id]) {
        how = 'GROWS: ' + PC.SNACK.HERO_GROWTH[hd.id].label;      // v0.81.2
      }
      // locked rows have no kit line, so the unlock goal takes that space
      var hint = PC.ui.text(self, x + K(58), y + (st === 'locked' ? K(26) : K(40)), how, 'caption',
        st === 'locked' ? { color: '#8d8aa8', wrap: w - K(130) } : { color: '#a8e04a' });
      if (st !== 'locked') PC.ui.fit(hint, w - K(130));   // one line, never clipped
      var right = st === 'owned' ? (sel ? 'PICKED' : 'OWNED') : st === 'forSale' ? '$ ' + price : 'LOCKED';
      var rc = st === 'owned' ? (sel ? '#a8e04a' : '#cfd4e8') : st === 'forSale' ? (afford ? '#f2c33c' : '#6d6a8e') : '#45356e';
      var rt = PC.ui.text(self, x + w - K(8), y + h / 2, right, 'label', { color: rc }).setOrigin(1, 0.5);
      c.add([g, im, name, role, hint, rt]);
      return { onTap: function () {
        if (st === 'owned') { prof.selectedHero = hd.id; P.save(); if (PC.audio) PC.audio.ui(); self.build(); }
        else if (st === 'forSale') {
          if (P.buyHero(hd.id)) {
            prof.selectedHero = hd.id; P.save();
            if (PC.audio) { PC.audio.levelup(); }
            self.build();
          } else if (PC.audio) PC.audio.hurt();
        } else if (PC.audio) PC.audio.hurt();
      } };
    });
  });
};

// ---------------------------------------------------------------
// STAGES: open ones are playable; locked ones say exactly what opens them
// ---------------------------------------------------------------
PC.SnackStagesScene = function () { Phaser.Scene.call(this, { key: 'PC_SnackStages' }); };
PC.SnackStagesScene.prototype = Object.create(Phaser.Scene.prototype);
PC.SnackStagesScene.prototype.constructor = PC.SnackStagesScene;
PC.SnackStagesScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK, self = this, P = PC.SnackProfile, prof = P.get();
  PC.SnackUI.backdrop(this);
  var hero = PC.heroById(prof.selectedHero);
  PC.SnackUI.header(this, 'PICK A STAGE', 'PLAYING AS ' + (hero ? hero.name : 'DANNY'));
  var top = K(50), bottom = H - K(52);
  this.list = new PC.SnackList(this, K(8), top, W - K(16), bottom - top, K(70));
  PC.SnackUI.button(this, K(8) + K(44), H - K(26), K(84), K(30), '< BACK', 0x6d6a8e, function () { self.scene.start('PC_SnackHeroes'); });
  this.go = PC.SnackUI.button(this, W - K(8) - K(64), H - K(26), K(124), K(30), 'GO! >', 0xa8e04a, function () { self.launch(); });
  if (!P.stageOpen(prof.selectedStage)) prof.selectedStage = 'street';
  this.build();
};
PC.SnackStagesScene.prototype.build = function () {
  var self = this, K = PC.uiK, P = PC.SnackProfile, prof = P.get();
  this.list.clear();
  PC.SNACK.STAGES.forEach(function (st, i) {
    var open = P.stageOpen(st.id), sel = open && prof.selectedStage === st.id;
    var rec = prof.records[st.id];
    self.list.add(function (c, x, y, w, h) {
      var g = self.add.graphics();
      PC.labPanel(g, x, y + 2, w, h - 4, { radius: 5, base: sel ? 0x24343f : (open ? 0x1f1b35 : 0x171330),
        edge: sel ? 0xa8e04a : (open ? 0x45356e : 0x2a2442) });
      var num = PC.ui.text(self, x + K(18), y + h / 2, String(i + 1), 'title', { color: open ? '#f2c33c' : '#45356e' }).setOrigin(0.5);
      var name = PC.ui.text(self, x + K(36), y + K(8), open ? st.title : '???', 'label', { color: open ? '#f7f4ef' : '#45356e' });
      var info = open ? (st.shape + '  -  BOSS: ' + (PC.BOSSES[st.boss] ? PC.BOSSES[st.boss].name : '?')) : '';
      var t2 = PC.ui.text(self, x + K(36), y + K(26), info, 'caption', { color: '#35d0ff' });
      PC.ui.fit(t2, w - K(46));
      var line3 = '';
      if (!open && st.gate) {
        var prev = PC.SNACK.stageById(st.gate.stage);
        line3 = 'TO OPEN: reach level ' + st.gate.level + ' in ' + (P.stageOpen(prev.id) ? prev.title : '???');
      } else if (rec) {
        var m = Math.floor(rec.t / 60), s = rec.t % 60;
        line3 = (rec.cleared ? 'CLEARED!  ' : '') + 'BEST: LV ' + rec.level + '  ' + m + ':' + (s < 10 ? '0' : '') + s +
          (rec.ot ? '  OT +' + Math.floor(rec.ot / 60) + ':' + (rec.ot % 60 < 10 ? '0' : '') + (rec.ot % 60) : '');
      } else line3 = st.blurb;
      var t3 = PC.ui.text(self, x + K(36), y + K(42), line3, 'caption', { color: rec && rec.cleared ? '#a8e04a' : '#8d8aa8' });
      PC.ui.fit(t3, w - K(46));
      c.add([g, num, name, t2, t3]);
      return { onTap: function () {
        if (!open) { if (PC.audio) PC.audio.hurt(); return; }
        if (prof.selectedStage === st.id) { self.launch(); return; }   // second tap = go
        prof.selectedStage = st.id; P.save();
        self.build();
      } };
    });
  });
};
PC.SnackStagesScene.prototype.launch = function () {
  var prof = PC.SnackProfile.get();
  if (!PC.SnackProfile.stageOpen(prof.selectedStage)) return;
  if (PC.SnackProfile.heroState(prof.selectedHero) !== 'owned') prof.selectedHero = 'danny';
  PC.Snack.pending = { hero: prof.selectedHero, stage: prof.selectedStage };
  if (PC.STORY) PC.STORY.pendingMission = null;
  if (PC.audio) PC.audio.stopMusic();
  this.scene.start('PC_Game');
};

// ---------------------------------------------------------------
// POWER-UPS: the gold shop [VS prices + fee], with REFUND ALL
// ---------------------------------------------------------------
PC.SnackShopScene = function () { Phaser.Scene.call(this, { key: 'PC_SnackShop' }); };
PC.SnackShopScene.prototype = Object.create(Phaser.Scene.prototype);
PC.SnackShopScene.prototype.constructor = PC.SnackShopScene;
PC.SnackShopScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK, self = this, P = PC.SnackProfile;
  PC.SnackUI.backdrop(this);
  this.sub = PC.SnackUI.header(this, 'POWER-UPS', '');
  var top = K(50), bottom = H - K(52);
  this.list = new PC.SnackList(this, K(8), top, W - K(16), bottom - top, K(50));
  PC.SnackUI.button(this, K(8) + K(44), H - K(26), K(84), K(30), '< BACK', 0x6d6a8e, function () { self.scene.start('PC_SnackHub'); });
  PC.SnackUI.button(this, W - K(8) - K(64), H - K(26), K(124), K(30), 'REFUND ALL', 0xff6b6b, function () {
    P.refundAll(); if (PC.audio) PC.audio.chest(); self.build();
  });
  this.build();
};
PC.SnackShopScene.prototype.build = function () {
  var self = this, K = PC.uiK, P = PC.SnackProfile, prof = P.get();
  this.sub.setText('GOLD  ' + PC.SnackUI.wallet() + '   (HELPS EVERY HERO)');
  var keepScroll = this.list.scroll;
  this.list.clear();
  PC.SNACK.POWERUPS.forEach(function (pu) {
    self.list.add(function (c, x, y, w, h) {
      var rank = P.rank(pu.id), cost = P.powerupCost(pu.id), maxed = cost === null;
      var afford = !maxed && prof.wallet >= cost;
      var g = self.add.graphics();
      PC.labPanel(g, x, y + 2, w, h - 4, { radius: 5, base: maxed ? 0x1c3320 : 0x1f1b35,
        edge: maxed ? 0x7dd97b : (afford ? 0xf2c33c : 0x45356e) });
      var im = self.add.image(x + K(20), y + h / 2, 'atlas', pu.icon).setDisplaySize(K(26), K(26));
      var name = PC.ui.text(self, x + K(40), y + K(6), pu.name, 'label', { color: '#f7f4ef' });
      var desc = PC.ui.text(self, x + K(40), y + K(24), pu.desc, 'caption', { color: '#8d8aa8' });
      PC.ui.fit(desc, w - K(130));
      for (var r = 0; r < pu.max; r++) {
        g.fillStyle(r < rank ? 0xa8e04a : 0x45356e, 1).fillRect(x + w - K(80) + r * K(9), y + h - K(14), K(7), K(4));
      }
      var ct = PC.ui.text(self, x + w - K(8), y + K(8), maxed ? 'MAXED' : '$ ' + cost, 'label',
        { color: maxed ? '#7dd97b' : (afford ? '#f2c33c' : '#6d6a8e') }).setOrigin(1, 0);
      c.add([g, im, name, desc, ct]);
      return { onTap: function () {
        if (P.buyPowerup(pu.id)) { if (PC.audio) PC.audio.levelup(); }
        else if (PC.audio) PC.audio.hurt();
        self.build();
      } };
    });
  });
  this.list.setScroll(keepScroll);
};

// ---------------------------------------------------------------
// UNLOCKS: done, in progress, and secrets
// ---------------------------------------------------------------
PC.SnackUnlocksScene = function () { Phaser.Scene.call(this, { key: 'PC_SnackUnlocks' }); };
PC.SnackUnlocksScene.prototype = Object.create(Phaser.Scene.prototype);
PC.SnackUnlocksScene.prototype.constructor = PC.SnackUnlocksScene;
PC.SnackUnlocksScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK, self = this, P = PC.SnackProfile, prof = P.get();
  PC.SnackUI.backdrop(this);
  var A = PC.SNACK.ACHIEVEMENTS;
  PC.SnackUI.header(this, 'UNLOCKS', prof.done.length + ' OF ' + A.length + ' DONE');
  var top = K(50), bottom = H - K(52);
  var list = new PC.SnackList(this, K(8), top, W - K(16), bottom - top, K(44));
  PC.SnackUI.button(this, W / 2, H - K(26), K(120), K(30), '< BACK', 0x6d6a8e, function () { self.scene.start('PC_SnackHub'); });
  // open goals first, then done ones; secret rows stay ??? until earned
  var rows = A.slice().sort(function (a, b) {
    var da = P.isDone(a.id) ? 1 : 0, db = P.isDone(b.id) ? 1 : 0;
    if (da !== db) return da - db;
    return (a.secret ? 1 : 0) - (b.secret ? 1 : 0);
  });
  rows.forEach(function (a) {
    var done = P.isDone(a.id), hide = a.secret && !done;
    list.add(function (c, x, y, w, h) {
      var g = self.add.graphics();
      PC.labPanel(g, x, y + 2, w, h - 4, { radius: 4, base: done ? 0x1c3320 : 0x1f1b35, edge: done ? 0x7dd97b : 0x45356e });
      var t1 = PC.ui.text(self, x + K(10), y + K(6), (done ? 'DONE  ' : '') + (hide ? '???' : a.title), 'caption',
        { color: done ? '#a8e04a' : '#f7f4ef' });
      var t2 = PC.ui.text(self, x + K(10), y + K(21), hide ? 'A secret. Keep playing!' : a.how, 'caption', { color: '#cfd4e8' });
      var rw = hide ? '' : a.rewards.map(PC.SnackUnlocks.rewardText).join(', ');
      var t3 = PC.ui.text(self, x + w - K(8), y + K(6), rw, 'caption', { color: '#f2c33c' }).setOrigin(1, 0);
      PC.ui.fit(t3, w * 0.5); PC.ui.fit(t1, w * 0.48); PC.ui.fit(t2, w - K(20));
      c.add([g, t1, t2, t3]);
      return {};
    });
  });
};

// ---------------------------------------------------------------
// RESULTS: what you did, what you earned, what just opened
// ---------------------------------------------------------------
PC.SnackResultsScene = function () { Phaser.Scene.call(this, { key: 'PC_SnackResults' }); };
PC.SnackResultsScene.prototype = Object.create(Phaser.Scene.prototype);
PC.SnackResultsScene.prototype.constructor = PC.SnackResultsScene;
PC.SnackResultsScene.prototype.init = function (d) { this.d = d || {}; };
PC.SnackResultsScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK, self = this, d = this.d, P = PC.SnackProfile;
  PC.SnackUI.backdrop(this, d.cleared ? 0x142a1a : 0x161226);
  if (PC.audio) PC.audio.startMusic(d.cleared ? 'results' : 'gameover');
  var st = PC.SNACK.stageById(d.stage);
  var title = d.cleared ? 'STAGE CLEARED!' : (d.reason === 'quit' ? 'RUN ENDED' : 'GOOD RUN!');
  PC.logoText(this, W / 2, K(40), title, K(22), d.cleared ? '#a8e04a' : '#f2c33c').setDepth(3);
  PC.ui.text(this, W / 2, K(64), (st ? st.title : '') + '  -  ' + (PC.heroById(d.hero) ? PC.heroById(d.hero).name : ''),
    'caption', { color: '#cfd4e8', align: 'center' }).setOrigin(0.5);
  var m = Math.floor((d.t || 0) / 60), s = Math.floor((d.t || 0) % 60);
  var g = this.add.graphics();
  var pw = Math.min(W - K(24), K(260)), px = W / 2 - pw / 2, py = K(78);
  var ot = d.overtime || 0, ph = ot ? K(88) : K(70);
  PC.labPanel(g, px, py, pw, ph, { rivets: true });
  PC.ui.text(this, px + K(14), py + K(10),
    'TIME     ' + m + ':' + (s < 10 ? '0' : '') + s + '\nLEVEL    ' + (d.level || 1) + '\nPOPS     ' + (d.kills || 0),
    'body', { color: '#f7f4ef' });
  if (ot) {          // OVERTIME (v0.80.4): how long you outran the supersized boss
    PC.ui.text(this, px + K(14), py + K(66), 'OVERTIME +' + Math.floor(ot / 60) + ':' + (ot % 60 < 10 ? '0' : '') + (ot % 60) +
      (d.otGold ? '   (+' + d.otGold + ' GOLD)' : ''), 'label', { color: '#b45ce8' });
  }
  PC.ui.text(this, px + pw - K(14), py + K(10), '+' + (d.gold || 0) + ' GOLD', 'label', { color: '#f2c33c' }).setOrigin(1, 0);
  PC.ui.text(this, px + pw - K(14), py + K(30), 'WALLET ' + PC.SnackUI.wallet(), 'caption', { color: '#cfd4e8' }).setOrigin(1, 0);
  if (d.evolved && d.evolved.length) {
    PC.ui.text(this, px + pw - K(14), py + K(48), d.evolved.length + ' EVOLVED!', 'caption', { color: '#ff9ecb' }).setOrigin(1, 0);
  }
  // new unlocks [template: "show a concise reward summary"]
  var u = d.unlocks || [];
  var ly = py + ph + K(14);
  PC.ui.text(this, W / 2, ly, u.length ? 'NEW UNLOCKS!' : 'NO NEW UNLOCKS THIS TIME', 'label',
    { color: u.length ? '#a8e04a' : '#6d6a8e', align: 'center' }).setOrigin(0.5, 0);
  var list = new PC.SnackList(this, K(12), ly + K(22), W - K(24), H - K(60) - (ly + K(22)), K(36));
  u.forEach(function (id) {
    var a, line1, line2;
    if (id.indexOf('relic:') === 0) {
      var rel = PC.SNACK.RELICS[id.slice(6)];
      line1 = rel.name; line2 = rel.desc;
    } else {
      a = PC.SNACK.achievementById(id); if (!a) return;
      line1 = a.title; line2 = a.rewards.map(PC.SnackUnlocks.rewardText).join(', ');
    }
    list.add(function (c, x, y, w, h) {
      var gg = self.add.graphics();
      PC.labPanel(gg, x, y + 2, w, h - 4, { radius: 4, base: 0x1c3320, edge: 0xa8e04a });
      var t1 = PC.ui.text(self, x + K(10), y + K(5), line1, 'caption', { color: '#a8e04a' });
      var t2 = PC.ui.text(self, x + K(10), y + K(19), line2, 'caption', { color: '#f7f4ef' });
      PC.ui.fit(t2, w - K(20));
      c.add([gg, t1, t2]);
      return {};
    });
  });
  var bw = Math.min(K(150), (W - K(36)) / 2);
  // a steering thumb lands here 900ms after a death: arm the buttons
  // after a beat so the results and unlocks are actually seen (v0.80.6)
  var armAt = Date.now() + 700;
  PC.SnackUI.button(this, W / 2 - bw / 2 - K(6), H - K(28), bw, K(32), 'PLAY AGAIN', 0xa8e04a, function () { if (Date.now() >= armAt) self.scene.start('PC_SnackStages'); });
  PC.SnackUI.button(this, W / 2 + bw / 2 + K(6), H - K(28), bw, K(32), 'MENU', 0xf2c33c, function () { if (Date.now() >= armAt) self.scene.start('PC_SnackHub'); });
};

// ---------------------------------------------------------------
// PAUSE (in-run overlay): your build, the recipe book if found, quit
// ---------------------------------------------------------------
PC.SnackPause = {
  open: function (scene) {
    var W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK, sr = scene.snack;
    scene.snackHold = true;
    var ui = [];
    var keep = function (o) { ui.push(o); scene.uiAttach(o); return o; };
    keep(scene.add.rectangle(W / 2, H / 2, W, H, 0x0b0818, 0.86).setDepth(210));
    var swallow = keep(scene.add.zone(W / 2, H / 2, W, H).setDepth(210).setInteractive());
    swallow.on('pointerdown', function (p, lx, ly, ev) { if (ev && ev.stopPropagation) ev.stopPropagation(); });
    keep(PC.ui.text(scene, W / 2, K(40), 'PAUSED', 'title', { color: '#f2c33c', align: 'center' }).setOrigin(0.5).setDepth(211));
    var m = Math.floor(scene.runT / 60), s = Math.floor(scene.runT % 60);
    keep(PC.ui.text(scene, W / 2, K(60), sr.stage.title + '   ' + m + ':' + (s < 10 ? '0' : '') + s + '   LV ' + scene.level,
      'caption', { color: '#cfd4e8', align: 'center' }).setOrigin(0.5).setDepth(211));
    // the build. v0.80.6: on a short, wide screen (landscape: H is only
    // ~K(312)) a single column ran under the buttons, so weapons / items /
    // recipes sit side by side there
    var wide = H < K(420) && W > H * 1.2;
    var y = K(80), col = Math.min(W - K(24), K(300)), x0 = W / 2 - col / 2;
    if (wide) { col = Math.min(K(240), (W - K(24)) / 3); x0 = W / 2 - col * 1.5; }
    var top0 = y;
    keep(PC.ui.text(scene, x0, y, 'WEAPONS', 'caption', { color: '#35d0ff' }).setDepth(211));
    y += K(14);
    scene.weapons.forEach(function (w) {
      keep(scene.add.image(x0 + K(9), y + K(8), 'atlas', PC.WEAPON_ICONS[w.key] || 'icon_weapon_resizer').setDisplaySize(K(16), K(16)).setDepth(211));
      keep(PC.ui.text(scene, x0 + K(22), y + K(1), w.name + (w.evolved ? '  EVOLVED' : '  LV ' + w.level), 'caption',
        { color: w.evolved ? '#ff9ecb' : '#f7f4ef' }).setDepth(211));
      y += K(18);
    });
    y += K(6);
    if (wide) { x0 += col; y = top0; }
    keep(PC.ui.text(scene, x0, y, 'ITEMS', 'caption', { color: '#a8e04a' }).setDepth(211));
    y += K(14);
    for (var pk in scene.passives) {
      if (!scene.passives[pk]) continue;
      var pd = PC.PASSIVES[pk];
      keep(scene.add.image(x0 + K(9), y + K(8), 'atlas', pd.icon).setDisplaySize(K(16), K(16)).setDepth(211));
      keep(PC.ui.text(scene, x0 + K(22), y + K(1), pd.name + '  LV ' + scene.passives[pk], 'caption', { color: '#f7f4ef' }).setDepth(211));
      y += K(18);
    }
    // THE RECIPE BOOK relic: which weapon + item makes which evolution
    if (PC.SnackProfile.hasRelic('recipebook')) {
      y += K(6);
      if (wide) { x0 += col; y = top0; }
      var rbT = keep(PC.ui.text(scene, x0, y, 'RECIPE BOOK  (MAX RANK 8 + ITEM + A CHEST)', 'caption', { color: '#b45ce8' }).setDepth(211));
      PC.ui.fit(rbT, col - K(4));
      y += K(14);
      var P = PC.SnackProfile, shown = 0;
      (PC.EVOLUTIONS || []).forEach(function (rec) {
        if (shown >= 8) return;
        var held = false;
        scene.weapons.forEach(function (w) { if (w.key === rec.base) held = true; });
        if (!held) return;
        var wn = PC.SNACK.WEAPONS[rec.base] ? PC.SNACK.WEAPONS[rec.base].title : rec.base.toUpperCase();
        var t = keep(PC.ui.text(scene, x0 + K(4), y, wn + ' + ' + PC.PASSIVES[rec.requires].name + ' = ' + rec.name,
          'caption', { color: '#cfd4e8' }).setDepth(211));
        PC.ui.fit(t, col - K(8));
        y += K(14); shown++;
      });
      if (!shown) { keep(PC.ui.text(scene, x0 + K(4), y, 'Pick up weapons to see their recipes.', 'caption', { color: '#8d8aa8' }).setDepth(211)); }
    }
    var close = function () {
      ui.forEach(function (o) { o.destroy(); });
      scene.releaseHold();
      scene.input.keyboard.off('keydown-ESC', escClose);
      scene.input.keyboard.off('keydown-P', escClose);
    };
    var escClose = function () { if (!scene._optionsOpen) close(); };
    var gap = K(6), bw = Math.min(K(120), (W - K(24) - gap * 2) / 3);
    var b1 = PC.SnackUI.button(scene, W / 2 - bw - gap, H - K(40), bw, K(32), 'RESUME', 0xa8e04a, close, 212);
    var b3 = PC.SnackUI.button(scene, W / 2, H - K(40), bw, K(32), 'OPTIONS', 0xcfd4e8, function () {
      PC.OptionsPanel.open(scene);
    }, 212);
    var quitArmed = false;
    var b2 = PC.SnackUI.button(scene, W / 2 + bw + gap, H - K(40), bw, K(32), 'QUIT RUN', 0xff6b6b, function () {
      if (!quitArmed) { quitArmed = true; b2.t.setText('SURE?'); return; }
      close();
      sr.end('quit');
    }, 212);
    [b1, b3, b2].forEach(function (b) { keep(b.g); keep(b.t); keep(b.z); });
    // the run's own ESC/P handlers would reopen this, so they close it
    // only after this frame's keydown has finished dispatching
    scene.time.delayedCall(0, function () {
      scene.input.keyboard.on('keydown-ESC', escClose);
      scene.input.keyboard.on('keydown-P', escClose);
    });
  },
};
