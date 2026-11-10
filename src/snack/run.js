// snack/run.js - one SNACK ATTACK run (v0.80.0). Rides on PC_Game the
// same way a story mission does: the scene keeps its combat engine,
// weapons, gems and bosses; this object owns everything the template
// adds on top - the stage clock, the authored waves, elites and their
// chests, the district boss, crate prizes, the separate gold wallet,
// unlock events and the 15:00 clear.
// Lifecycle: PC.Snack.pending = { hero, stage } -> PC_Game.create builds
// a SnackRun -> setupStats() replaces Story's shop -> afterCreate() once
// the HUD exists -> update(dt) every frame -> end() -> PC_SnackResults.
window.PC = window.PC || {};
PC.Snack = PC.Snack || { pending: null };

PC.SnackRun = function (scene, cfg) {
  this.scene = scene;
  this.stage = PC.SNACK.stageById(cfg.stage) || PC.SNACK.STAGES[0];
  this.heroId = cfg.hero || 'danny';
  this.run = {
    id: 'run_' + Date.now() + '_' + Math.floor(Math.random() * 1e6),
    t: 0, level: 1, stage: this.stage.id, hero: this.heroId, ranks: {}, held: 1,
    gold: 0, kills: 0, healed: 0, pickups: {}, curse: 0, cleared: false, chests: 0, evolved: [],
  };
  this.newUnlocks = [];
  this.rerolls = 0; this.skips = 0; this.banishes = 0; this.banished = {};
  this.densityK = 1;            // [TUNABLE] global spawn-rate dial (balance bot)
  this._ev = 0; this._acc = 0; this._tick = 0; this._save = 0; this._heal = 0;
  this.ended = false; this.cleared = false;
  this.chests = [];
  this.relic = null;
  this._toasts = []; this._toastBusy = false;
};

// ---- stats: the Snack PowerUps shop, NOT Story's (separate saves) ----
PC.SnackRun.prototype.setupStats = function (scene) {
  var st = scene.stats, P = PC.SnackProfile;
  st.metaHp = 0; st.metaArea = 1; st.metaPickup = 1; st.metaProj = 1; st.metaExtraProj = 0;
  st.metaArmor = 0; st.metaRegen = 0; st.metaLuck = 0; st.metaGrowth = 1; st.metaGreed = 1;
  st.metaDur = 1; st.curse = 0;
  scene.reviveCharges = 0; scene.goldMult = 1;
  PC.SNACK.POWERUPS.forEach(function (p) { var r = P.rank(p.id); if (r > 0) p.apply(scene, r); });
  st.dmgMult = st.heroDmg; st.cdMult = st.heroCd; st.spdMult = st.heroSpd;
  st.bonusHp += st.metaHp; st.areaMult *= st.metaArea; st.pickupMult *= st.metaPickup;
  st.projMult *= st.metaProj; st.extraProj += st.metaExtraProj; st.armor += st.metaArmor;
  st.regen += st.metaRegen; st.durMult = st.metaDur;
  st.luck = st.metaLuck; st.growthMult = st.metaGrowth; st.greedMult = st.metaGreed;
  this.run.curse = st.curse;
};

PC.SnackRun.prototype.afterCreate = function (scene) {
  var self = this, K = PC.uiK;
  var w0 = scene.weapons[0];
  if (w0) { w0.max = PC.SNACK.WEAPON_MAX; this.run.ranks[w0.key] = w0.level; }
  scene.xpNext = PC.SNACK.xpToNext(1);
  scene.pickups.gold = 0;                       // the HUD shows THIS run's gold
  scene.pickups.crateEvery = PC.SNACK.CRATE_EVERY;
  scene.pickups.crateMax = 2;
  scene.levelText.setText('LV 1');
  scene.drawHud();
  this.placeRelic();
  this.buildPauseButton();
  // the opening card: where you are and the one rule
  var W = PC.RENDER.W, H = PC.RENDER.H;
  var t1 = PC.ui.text(scene, W / 2, H * 0.26, this.stage.title, 'title', { color: '#f2c33c', align: 'center' })
    .setOrigin(0.5).setDepth(150);
  var t2 = PC.ui.text(scene, W / 2, H * 0.26 + K(24), 'SURVIVE 15:00!', 'label', { color: '#f7f4ef', align: 'center' })
    .setOrigin(0.5).setDepth(150);
  [t1, t2].forEach(scene.uiAttach);
  scene.tweens.add({ targets: [t1, t2], alpha: 0, delay: 1800, duration: 600,
    onComplete: function () { t1.destroy(); t2.destroy(); } });
  PC.SnackUnlocks.event(this, 'held', scene.weapons.length);
};

// ---- the per-frame stage clock ----
PC.SnackRun.prototype.update = function (dt) {
  var scene = this.scene;
  if (this.ended) return;
  var t = scene.runT;
  this.run.t = t;
  if (!this.cleared && t >= PC.SNACK.RUN_SEC) { this.clearStage(); return; }
  if (this.cleared) return;

  // authored waves: one row per minute [template section 12]
  var row = PC.SNACK.WAVE_ROWS[Math.min(PC.SNACK.WAVE_ROWS.length - 1, Math.floor(t / 60))];
  var curse = scene.stats.curse || 0;
  var interval = row[0] / ((1 + curse) * this.densityK);
  if (scene.boss && !scene.boss.dead) interval *= 1.8;          // let the boss fight breathe
  var cap = Math.min(scene.enemies.cap - 8, Math.round(row[2] * (1 + curse)));
  this._acc += dt;
  if (this._acc >= interval && scene.enemies.liveCount < cap) {
    this._acc = 0;
    for (var n = 0; n < row[1]; n++) this.spawn(this.makeDef(this.pickTier(row[3]), false));
  }
  // timed set pieces
  var E = PC.SNACK.EVENTS;
  while (this._ev < E.length && t >= E[this._ev].at) { this.fire(E[this._ev]); this._ev++; }

  this.updateChests();
  this.updateRelic();
  this.drawPointers();

  this._tick += dt;
  if (this._tick >= 0.5) {
    this._tick = 0;
    PC.SnackUnlocks.event(this, 'held', scene.weapons.length);
    PC.SnackUnlocks.event(this, 'tick', t);
  }
  this._save += dt;
  if (this._save >= 3) { this._save = 0; PC.SnackProfile.save(); }   // lifetime counters
};

PC.SnackRun.prototype.pickTier = function (weights) {
  var total = 0, i;
  for (i = 0; i < weights.length; i++) total += weights[i];
  var r = Math.random() * total;
  for (i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return i; }
  return 0;
};

PC.SnackRun.prototype.makeDef = function (tierIdx, elite) {
  var key = this.stage.roster[tierIdx] || this.stage.roster[0];
  var d = PC.ENEMY_DEFS[key];
  var min = this.scene.runT / 60, curse = this.scene.stats.curse || 0;
  var def = {
    key: d.key, still: d.still, size: d.size, xp: d.xp, kbMult: d.kbMult, fam: key,
    spd: d.spd * (1 + 0.5 * curse),
    hp: Math.round(d.hp * (1 + PC.TIMESCALE.HP_PER_MIN * min) * this.stage.mods.enemyHp * (1 + curse)),
    dmg: Math.round(d.dmg * (1 + PC.TIMESCALE.DMG_PER_MIN * min)),
  };
  if (elite) {
    // a GOLDEN SNACK: big, slow-ish, tough, and it carries a chest
    def.elite = true; def.scaleK = 1.6; def.size = Math.round(d.size * 1.6);
    def.hp = Math.round(def.hp * 10); def.xp = d.xp * 8; def.kbMult = 0.12;
    def.spd = def.spd * 0.85; def.dmg = Math.round(def.dmg * 1.5);
  }
  return def;
};

// [template section 13] spawn just off-screen, never inside a wall or
// outside a bounded map; give up after a few tries rather than cheat
PC.SnackRun.prototype.validSpot = function (x, y, r) {
  var reg = this.scene.region;
  if (reg && (x < 48 || y < 48 || x > reg.size - 48 || y > reg.size - 48)) return false;
  var rs = PC.resolveCircle(x, y, r);
  return Math.abs(rs.x - x) + Math.abs(rs.y - y) < 1;
};
PC.SnackRun.prototype.spawn = function (def, ang) {
  var scene = this.scene, wv = scene.cameras.main.worldView;
  var cx = wv.centerX, cy = wv.centerY;
  var ringR = Math.sqrt(wv.width * wv.width + wv.height * wv.height) / 2 + 30;
  var r = def.size / 2;
  for (var tries = 0; tries < 10; tries++) {
    var a = (ang !== undefined && tries === 0) ? ang : Math.random() * Math.PI * 2;
    var rr = ringR + Math.random() * 50;
    var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (!this.validSpot(x, y, r)) continue;
    return scene.enemies.spawn(x, y, def);
  }
  return null;
};

PC.SnackRun.prototype.fire = function (ev) {
  var scene = this.scene, self = this;
  if (ev.type === 'elite') {
    var e = this.spawn(this.makeDef(PC.SNACK.TIERS.indexOf(ev.tier), true));
    if (e) {
      e.chestEvo = ev.at >= PC.SNACK.EVO_CHEST_FROM_SEC;
      scene.floatText('GOLDEN SNACK!', 0xf2c33c);
      if (PC.audio && PC.audio.roar) PC.audio.roar();
    }
  } else if (ev.type === 'ring') {
    var def = this.makeDef(PC.SNACK.TIERS.indexOf(ev.tier), false);
    for (var i = 0; i < ev.n; i++) this.spawn(def, (i / ev.n) * Math.PI * 2);
  } else if (ev.type === 'boss') {
    if (!scene.boss && PC.BOSSES && PC.BOSSES[this.stage.boss]) {
      scene.spawnBoss(this.stage.boss);
      // a survive-it boss: HP from the level you bring (see data.js)
      var S = PC.SNACK, lv = Math.max(S.BOSS_HP_MIN_LEVEL, scene.level);
      var bhp = Math.round(PC.BOSSES[this.stage.boss].hp * S.BOSS_HP_PER_LEVEL * lv);
      scene.boss.hp = scene.boss.maxHp = bhp;
      this.run.bossHp = bhp;
      var bs = this; scene.time.delayedCall(2200, function () { if (scene.boss && !bs.cleared) scene.floatText('SURVIVE ' + scene.boss.name + '!', 0xff6b6b); });
    }
  }
};

// ---- kills, drops and prizes ----
PC.SnackRun.prototype.onKill = function (e) {
  var scene = this.scene;
  PC.SnackUnlocks.event(this, 'kill', { fam: e.fam, elite: e.elite });
  if (e.elite) { this.dropChest(e.x, e.y, 'normal', !!e.chestEvo); return; }
  // kill coins TAPER as the run's pops climb [TUNABLE]: a snowballing
  // build pops thousands, and gold should spike from chests and the boss,
  // not flood from every kill (template section 11)
  var coinOdds = PC.SNACK.COIN_ODDS * 1500 / (1500 + this.run.kills);
  var roll = Math.random();
  if (roll < 0.01) scene.pickups.drop(e.x, e.y, 'medkit', PC.PLAYER.MEDKIT_HEAL);
  else if (roll < 0.01 + coinOdds) scene.pickups.drop(e.x, e.y, 'coin', 2);
};

PC.SnackRun.prototype.onCrate = function (c) {
  var scene = this.scene, T = PC.SNACK.CRATE_TABLE, total = 0, i;
  PC.SnackUnlocks.event(this, 'crate');
  for (i = 0; i < T.length; i++) total += T[i].w;
  var r = Math.random() * total, kind = T[0].kind;
  for (i = 0; i < T.length; i++) { r -= T[i].w; if (r <= 0) { kind = T[i].kind; break; } }
  if (kind === 'coin') {
    var n = 2 + ((Math.random() * 3) | 0);
    for (i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, rr = 4 + Math.random() * 10;
      scene.pickups.drop(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr, 'coin', 5);
    }
  } else if (kind === 'coinbag') scene.pickups.drop(c.x, c.y, 'coinbag', 40);
  else if (kind === 'medkit') scene.pickups.drop(c.x, c.y, 'medkit', PC.PLAYER.MEDKIT_HEAL || 35);
  else scene.pickups.drop(c.x, c.y, kind, 0);
};

// every floater in a Snack run lands here; true = handled
PC.SnackRun.prototype.collect = function (f) {
  var scene = this.scene, self = this;
  if (f.kind === 'coin' || f.kind === 'coinbag') {
    var v = Math.max(1, Math.round(f.val * (scene.stats.greedMult || 1) * this.stage.mods.gold));
    PC.SnackProfile.addGold(v);
    scene.pickups.gold += v;
    PC.SnackUnlocks.event(this, 'gold', v);
    if (PC.audio) PC.audio.coin ? PC.audio.coin() : PC.audio.gem();
    if (f.kind === 'coinbag') scene.floatText('+' + v + ' GOLD', 0xf2c33c);
    scene.drawHud();
    return true;
  }
  if (f.kind === 'medkit') {
    var mh = PC.PLAYER.HP + (scene.stats.bonusHp || 0);
    var got = Math.max(0, Math.min(mh - scene.hp, f.val));
    scene.hp += got;
    PC.SnackUnlocks.event(this, 'medkit');
    if (got > 0) PC.SnackUnlocks.event(this, 'heal', got);
    if (PC.audio) PC.audio.heal();
    scene.floatText('+' + f.val, 0xff6b6b);
    scene.drawHud();
    return true;
  }
  if (f.kind === 'vacuum') {                        // every gem on the map flies home
    var g = scene.gems.pool;
    for (var i = 0; i < g.length; i++) if (g[i].active) { g[i].fly = true; g[i].spd = 200; }
    scene.floatText('SNACK VACUUM!', 0x35d0ff);
  } else if (f.kind === 'bomb') {                   // pops every snack on screen
    var wv = scene.cameras.main.worldView, pool = scene.enemies.pool;
    for (var j = 0; j < pool.length; j++) {
      var e = pool[j];
      if (!e.active || e.elite) continue;
      if (e.x < wv.x || e.x > wv.right || e.y < wv.y || e.y > wv.bottom) continue;
      PC.damageEnemy(scene, e, 99999, 0, 0, scene._onKillCb);
    }
    var flash = scene.uiAttach(scene.add.rectangle(PC.RENDER.W / 2, PC.RENDER.H / 2, PC.RENDER.W, PC.RENDER.H, 0xffffff, 0.6).setDepth(150));
    scene.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: function () { flash.destroy(); } });
    scene.cameras.main.shake(250, 0.008);
    scene.floatText('SNACK BOMB!', 0xff6b6b);
  } else if (f.kind === 'freeze') {                 // everything stops for a moment
    scene.freezeUntil = scene.now + 6;
    scene.floatText('FREEZE!', 0x9adfff);
  } else if (f.kind === 'penny') {                  // a little luck for this run
    // into the run's base luck too, or the LUCKY PENNY item (which
    // recomputes luck from metaLuck) wipes it out (v0.80.2)
    scene.stats.metaLuck = (scene.stats.metaLuck || 0) + 0.10;
    scene.stats.luck = (scene.stats.luck || 0) + 0.10;
    scene.floatText('LUCKY PENNY! +LUCK', 0x7dd97b);
  } else return false;
  if (PC.audio) PC.audio.chest ? PC.audio.chest() : PC.audio.gem();
  PC.SnackUnlocks.event(this, 'pickup', f.kind);
  return true;
};

// health regained by regen (called from PC_Game's regen tick)
PC.SnackRun.prototype.healed = function (amt) {
  this._heal += amt;
  if (this._heal >= 1) {
    var whole = Math.floor(this._heal);
    this._heal -= whole;
    PC.SnackUnlocks.event(this, 'heal', whole);
  }
};

// XP gained from a gem, with the stage and Growth bonuses
PC.SnackRun.prototype.xpFor = function (v) {
  // xpMult = the hero kit's XP passive (Danny +10%, Nayah +15%): it only
  // reached Story's path before v0.80.2
  return v * PC.SNACK.GEM_VALUE * this.stage.mods.xp * (this.scene.stats.growthMult || 1) *
    (this.scene.xpMult || 1);
};

// ---- chests in the world: walk onto one to open it ----
PC.SnackRun.prototype.dropChest = function (x, y, kind, evo) {
  var scene = this.scene;
  var glow = scene.add.image(x, y, 'atlas', 'fx_nova_1').setScale(1.1).setDepth(5).setAlpha(0.55)
    .setBlendMode(Phaser.BlendModes.ADD).setTint(kind === 'boss' ? 0xff9ecb : 0xf2c33c);
  scene.tweens.add({ targets: glow, scale: 1.6, alpha: 0.2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  var img = scene.add.image(x, y, 'atlas', 'pickup_chest_1').setDepth(6).setScale(kind === 'boss' ? 1.5 : 1.15);
  scene.tweens.add({ targets: img, y: y - 6, duration: 750, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  this.chests.push({ x: x, y: y, kind: kind, evo: evo, img: img, glow: glow });
  if (PC.audio) PC.audio.chest();
};
PC.SnackRun.prototype.updateChests = function () {
  var scene = this.scene;
  // one overlay at a time: a gem can level you up in the same frame you
  // step on a chest; the chest waits for the cards (v0.80.2)
  if (scene.cardsOpen || scene.snackHold) return;
  for (var i = this.chests.length - 1; i >= 0; i--) {
    var c = this.chests[i];
    var dx = scene.px - c.x, dy = scene.py - c.y;
    if (dx * dx + dy * dy > 34 * 34) continue;
    c.img.destroy(); c.glow.destroy();
    this.chests.splice(i, 1);
    PC.SnackChest.open(scene, c.kind, c.evo);
    return;                                        // one overlay at a time
  }
};

// an arrow on the screen edge for every chest you have not reached yet
// (a dropped chest is often off-screen - kids should not have to guess)
PC.SnackRun.prototype.drawPointers = function () {
  var scene = this.scene, W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK;
  if (!this.ptrG) { this.ptrG = scene.add.graphics().setDepth(103); scene.uiAttach(this.ptrG); }
  var g = this.ptrG; g.clear();
  var wv = scene.cameras.main.worldView, list = this.chests.slice();
  if (this.relic) list.push({ x: this.relic.x, y: this.relic.y, relic: true });
  for (var i = 0; i < list.length; i++) {
    var c = list[i], sx = c.x - wv.x, sy = c.y - wv.y;
    if (sx > K(12) && sx < W - K(12) && sy > K(12) && sy < H - K(12)) continue;
    var ang = Math.atan2(sy - H / 2, sx - W / 2);
    var r = Math.min(W, H) / 2 - K(24);
    var ax = W / 2 + Math.cos(ang) * r, ay = H / 2 + Math.sin(ang) * r;
    var col = c.relic ? 0xb45ce8 : (c.kind === 'boss' ? 0xff9ecb : 0xf2c33c);
    g.fillStyle(0x120e24, 0.75).fillCircle(ax, ay, K(11));
    g.lineStyle(2, col, 0.95).strokeCircle(ax, ay, K(11));
    g.fillStyle(col, 0.7 + 0.3 * Math.sin(scene.now * 8));
    g.fillTriangle(ax + Math.cos(ang) * K(9), ay + Math.sin(ang) * K(9),
      ax + Math.cos(ang + 2.5) * K(5), ay + Math.sin(ang + 2.5) * K(5),
      ax + Math.cos(ang - 2.5) * K(5), ay + Math.sin(ang - 2.5) * K(5));
  }
};

// ---- the district boss ----
PC.SnackRun.prototype.onBossDefeated = function (b) {
  var scene = this.scene, self = this;
  if (PC.audio) PC.audio.bossDie();
  scene.cameras.main.shake(500, 0.012);
  scene.time.timeScale = 0.4;
  if (b.tele) b.tele.setVisible(false);
  if (b.shadow) b.shadow.setVisible(false);
  if (b.sprite) {
    scene.tweens.add({ targets: b.sprite, scale: 0.35, angle: 360, duration: 900, ease: 'Cubic.in',
      onComplete: function () {
        b.sprite.setVisible(false);
        scene.fx.burst(b.x, b.y, 'fx_pop', 4, 0.5);
        for (var i = 0; i < 12; i++) {
          var a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 60;
          scene.pickups.drop(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, 'coin', 4);
        }
      } });
  }
  scene.time.delayedCall(1100, function () {
    scene.time.timeScale = 1;
    scene.boss = null;
    if (scene.bossBar) scene.bossBar.clear();
    self.dropChest(b.x, b.y, 'boss', true);
    PC.SnackUnlocks.event(self, 'boss');
    if (PC.audio) PC.audio.startMusic(self.musicSet());
  });
};
PC.SnackRun.prototype.musicSet = function () {
  var fab = this.scene.region ? this.scene.region.def.fabric : null;
  return ({ park: 'park', suburb: 'suburb', labs: 'labs', sewer: 'sewer' })[fab] || 'city';
};

// ---- relics: one-time finds on a map [template section 16] ----
PC.SnackRun.prototype.placeRelic = function () {
  var rel = this.stage.relic, scene = this.scene;
  if (!rel || PC.SnackProfile.hasRelic(rel.id) || !scene.region) return;
  var mk = scene.region.landmark(rel.landmark);
  if (!mk) return;
  var x = mk.cx, y = mk.cy + mk.h * 0.5 + 40;
  var g = scene.add.graphics().setDepth(6);
  g.fillStyle(0x5d3583, 1).fillRect(x - 9, y - 11, 18, 22);          // a little purple book
  g.fillStyle(0xb45ce8, 1).fillRect(x - 7, y - 9, 14, 18);
  g.fillStyle(0xf2c33c, 1).fillRect(x - 2, y - 6, 4, 4);
  g.fillStyle(0xfff6e0, 1).fillRect(x + 6, y - 10, 2, 20);
  var glow = scene.add.image(x, y, 'atlas', 'fx_nova_1').setDepth(5).setAlpha(0.5)
    .setBlendMode(Phaser.BlendModes.ADD).setTint(0xb45ce8);
  scene.tweens.add({ targets: glow, scale: 1.7, alpha: 0.15, duration: 1000, yoyo: true, repeat: -1 });
  var hint = scene.add.text(x, y - 24, '???', { fontFamily: 'monospace', fontSize: PC.uiK(8) + 'px',
    color: '#b45ce8', fontStyle: 'bold', stroke: '#120e24', strokeThickness: 3 }).setOrigin(0.5).setDepth(7);
  this.relic = { id: rel.id, x: x, y: y, parts: [g, glow, hint] };
};
PC.SnackRun.prototype.updateRelic = function () {
  var R = this.relic, scene = this.scene;
  if (!R) return;
  var dx = scene.px - R.x, dy = scene.py - R.y;
  if (dx * dx + dy * dy > 30 * 30) return;
  R.parts.forEach(function (o) { o.destroy(); });
  this.relic = null;
  if (!PC.SnackProfile.addRelic(R.id)) return;
  var def = PC.SNACK.RELICS[R.id];
  this.newUnlocks.push('relic:' + R.id);
  if (PC.audio && PC.audio.fanfare) PC.audio.fanfare();
  this.toast({ title: def.name + ' FOUND!', rewards: [], how: def.desc });
};

// ---- unlock toasts, one at a time ----
PC.SnackRun.prototype.toast = function (ach) {
  this._toasts.push(ach);
  if (!this._toastBusy) this._nextToast();
};
PC.SnackRun.prototype._nextToast = function () {
  var scene = this.scene, self = this, K = PC.uiK, W = PC.RENDER.W;
  var a = this._toasts.shift();
  if (!a) { this._toastBusy = false; return; }
  this._toastBusy = true;
  var line2 = a.rewards && a.rewards.length ? PC.SnackUnlocks.rewardText(a.rewards[0]) : (a.how || '');
  var y = K(118), w = Math.min(W - K(16), K(240)), h = K(34);
  var g = scene.add.graphics().setDepth(160);
  PC.labPanel(g, W / 2 - w / 2, y, w, h, { rivets: true, base: 0x1c3320, edge: 0xa8e04a });
  var t1 = PC.ui.text(scene, W / 2, y + K(5), 'UNLOCKED! ' + a.title, 'caption', { color: '#a8e04a', align: 'center' })
    .setOrigin(0.5, 0).setDepth(161);
  var t2 = PC.ui.text(scene, W / 2, y + K(18), line2, 'caption', { color: '#f7f4ef', align: 'center' })
    .setOrigin(0.5, 0).setDepth(161);
  PC.ui.fit(t1, w - K(10)); PC.ui.fit(t2, w - K(10));
  [g, t1, t2].forEach(scene.uiAttach);
  if (PC.audio && PC.audio.levelup) PC.audio.levelup();
  scene.time.delayedCall(2300, function () {
    scene.tweens.add({ targets: [g, t1, t2], alpha: 0, duration: 350, onComplete: function () {
      g.destroy(); t1.destroy(); t2.destroy(); self._nextToast(); } });
  });
};

// ---- pause button (top-right, under POPS) ----
PC.SnackRun.prototype.buildPauseButton = function () {
  var scene = this.scene, K = PC.uiK, W = PC.RENDER.W;
  var x = W - PC.SAFE - K(14), y = K(46);
  var g = scene.add.graphics().setDepth(101);
  g.fillStyle(0x1c1733, 0.9).fillRect(x - K(12), y - K(10), K(24), K(20));
  g.lineStyle(2, 0xf2c33c, 0.9).strokeRect(x - K(12), y - K(10), K(24), K(20));
  g.fillStyle(0xf2c33c, 1).fillRect(x - K(5), y - K(6), K(3), K(12)).fillRect(x + K(2), y - K(6), K(3), K(12));
  var z = scene.add.zone(x, y, K(40), K(32)).setInteractive({ useHandCursor: true });
  var self = this;
  z.on('pointerdown', function (p, lx, ly, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    self.pause();
  });
  scene.uiAttach(g); scene.uiAttach(z);
  scene.input.keyboard.on('keydown-P', function () { self.pause(); });
};
PC.SnackRun.prototype.pause = function () {
  var scene = this.scene;
  if (this.ended || this.cleared || scene.cardsOpen || scene.snackHold || scene.dead) return;
  if (PC.SnackPause) PC.SnackPause.open(scene);
};

// ---- the 15:00 clear [VS: the timer completing IS the clear] ----
PC.SnackRun.prototype.clearStage = function () {
  var scene = this.scene, self = this, W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK;
  this.cleared = true;
  scene.won = true;                                // nothing can hurt you now
  scene.enemies.clearAll(scene.fx);
  var outlasted = null;                            // a boss you survived, not beat
  if (scene.boss && !scene.boss.dead) {
    var b = scene.boss;
    outlasted = b.name;
    if (b.sprite) b.sprite.setVisible(false);
    if (b.shadow) b.shadow.setVisible(false);
    if (b.tele) b.tele.setVisible(false);
    scene.boss = null;
    if (scene.bossBar) scene.bossBar.clear();
  }
  PC.SnackUnlocks.event(this, 'clear', this.stage.id);
  if (PC.audio) { PC.audio.startMusic('results'); if (PC.audio.fanfare) PC.audio.fanfare(); }
  var t1 = PC.ui.text(scene, W / 2, H * 0.3, 'YOU SURVIVED!', 'title', { color: '#a8e04a', align: 'center' })
    .setOrigin(0.5).setDepth(151).setScale(0.4);
  var t2 = PC.ui.text(scene, W / 2, H * 0.3 + K(26),
    outlasted ? 'YOU OUTLASTED ' + outlasted + '!' : this.stage.title + ' CLEARED', 'label', { color: '#f2c33c', align: 'center' })
    .setOrigin(0.5).setDepth(151);
  PC.ui.fit && PC.ui.fit(t2, W - K(16));
  [t1, t2].forEach(scene.uiAttach);
  scene.tweens.add({ targets: t1, scale: 1, duration: 350, ease: 'Back.out' });
  var COLORS = [0xa8e04a, 0xf2c33c, 0x35d0ff, 0xff6b6b, 0xff9ecb];
  for (var i = 0; i < 40; i++) {
    var c = scene.uiAttach(scene.add.rectangle(Math.random() * W, -10 - Math.random() * 80, 4, 6, COLORS[i % 5]).setDepth(152));
    scene.tweens.add({ targets: c, y: H + 12, angle: 360, duration: 1400 + Math.random() * 900 });
  }
  scene.time.delayedCall(3200, function () { self.end('clear'); });
};

// ---- the end of every run: count it once, then the results desk ----
PC.SnackRun.prototype.end = function (reason) {
  if (this.ended) return;
  this.ended = true;
  var scene = this.scene, r = this.run;
  // a clear reads 15:00, not 15:00 plus the 3.2s celebration
  r.t = r.cleared ? Math.min(scene.runT, PC.SNACK.RUN_SEC) : scene.runT; r.level = scene.level;
  PC.SnackUnlocks.check(this);
  PC.SnackProfile.commitRun(r);
  PC.SnackProfile.save();
  scene.scene.start('PC_SnackResults', {
    reason: reason, stage: this.stage.id, hero: this.heroId, t: r.t, level: r.level,
    kills: scene.kills, gold: r.gold, cleared: !!r.cleared, unlocks: this.newUnlocks.slice(),
    evolved: r.evolved.slice(), runId: r.id,
  });
};
