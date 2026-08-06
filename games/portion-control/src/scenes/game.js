// game.js - PC_Game. M3 combat core on the M1/M2 foundation: Danny always
// auto-firing the Resizer at the nearest food, pops -> harmless stills ->
// gems -> XP/levels, HP + timestamp i-frames, ambient spawner, results on
// death. HUD: HP bar, XP bar, timer, kills, fps-foes readout.
window.PC = window.PC || {};

PC.GameScene = function () { Phaser.Scene.call(this, { key: 'PC_Game' }); };
PC.GameScene.prototype = Object.create(Phaser.Scene.prototype);
PC.GameScene.prototype.constructor = PC.GameScene;

var FRY_DEF = { key: 'enemy_d1_fry', spd: 80, hp: 10, dmg: 6, xp: 1, size: 24, still: 'still_d1_fry' };

PC.GameScene.prototype.create = function () {
  PC.applyRenderScale(this);
  this.cameras.main.setBackgroundColor(0x2a2544);

  // STORY-4 linear spine: PC.STORY.pendingMission (set by the mission
  // map's GO button) carries { map, hero, id } - the story assigns BOTH
  // the region and the hero (Mark: "you're given the character and then
  // given the mission"). Patrol/quick-run path is untouched (null).
  this.storyMission = (PC.STORY && PC.STORY.pendingMission) || null;
  this.region = null;
  if (this.storyMission && PC.STORY.maps[this.storyMission.map]) {
    this.region = new PC.Region(PC.STORY.maps[this.storyMission.map]);
  }
  PC.installRegion(this.region);
  var regionSelf = this;
  this.ground = new PC.Ground(this, 1, this.region
    ? function (sc, g2, cx2, cy2) { regionSelf.region.paintChunk(sc, g2, cx2, cy2); }
    : null);
  // screen-space UI lives in a world-space container pinned to the
  // camera's worldView corner every frame - the ONLY reliable way to
  // anchor UI under a zoomed camera (sf-0 + zoom mispositions, seen
  // on-device v0.7.2). Children keep plain logical coords.
  var uiSelf = this;
  this.ui = this.add.container(0, 0).setDepth(100);
  this.uiAttach = function (o) { uiSelf.ui.add(o); return o; };
  this.moveInput = new PC.MoveInput(this);

  // a mission launched from the free-roam board starts where the player
  // stood, not back at the district entry (v0.31.0)
  var ps = PC.STORY && PC.STORY.pendingSpawn;
  if (PC.STORY) PC.STORY.pendingSpawn = null;
  this.px = (this.region && ps) ? ps.x : this.region ? this.region.spawnX : 0;
  this.py = (this.region && ps) ? ps.y : this.region ? this.region.spawnY : 0;
  this.facing = 1;
  this.aimX = 1; this.aimY = 0;      // last movement direction = fire direction
  this.moving = false;
  this.walkT = 0;
  this.now = 0;
  // origin at the feet (0.82 down) so his world position IS where he stands -
  // collision stops his FEET at buildings, not his center (Mark round 10:
  // "some buildings are walk-throughable / strange collisions")
  // hero = the picked roster entry; scale normalizes figure height to
  // Danny's so every hero occupies the same world footprint.
  this.hero = this.storyMission ? PC.heroById(this.storyMission.hero)
                                : PC.selectedHero();
  this.player = this.add.image(0, 0, 'atlas', this.hero.art + '_walk_1')
    .setOrigin(0.5, 0.82).setDepth(10).setScale(this.hero.scale);

  // ghost trail (VS after-image, code-side): 6 pooled ghosts
  this.ghosts = [];
  for (var gi = 0; gi < 6; gi++) {
    this.ghosts.push({ t: 0, life: 0,
      img: this.add.image(0, 0, 'atlas', this.hero.art + '_walk_1').setOrigin(0.5, 0.82).setDepth(9)
        .setScale(this.hero.scale).setVisible(false) });
  }
  this._ghostAcc = 0;

  this.enemies = new PC.EnemySystem(this);
  this.bullets = new PC.BulletSystem(this);
  this.fx = new PC.FxSystem(this);
  this.juice = new PC.Juice(this);
  this.vfx = new PC.Vfx(this);
  var self = this;
  this.gems = new PC.GemSystem(this, function (v) { self.gainXp(v); });
  this.stats = { dmgMult: 1, cdMult: 1, spdMult: 1, heroDmg: 1, heroCd: 1,
                 heroSpd: 1, critChance: 0, projMult: 1, areaMult: 1,
                 armor: 0, pickupMult: 1, extraProj: 0, durMult: 1,
                 bonusHp: 0, regen: 0 };
  this.xpMult = 1; this.dmgTakenMult = 1; this.kbMult = 1;
  this.passives = {};
  PC.applyHeroKit(this);            // signature weapon + hero passive (kits.js)
  if (PC.meta) PC.meta.applyAll(this);   // permanent shop power-ups (WP-METASHOP)
  // v0.30.2 CUT (Mark: "there's like this persistent cone that's on the
  // [character]... it's not a good idea, I don't like it"). It was a
  // muzzle-cone sprite pinned to the hero and pulsing forever - it read
  // as a bug, not a light. The hero's own art carries the look now.
  this.itemGlow = null;
  this._onKillCb = function (e) { self.onKill(e); };
  this.pendingLevels = 0;
  this.cardsOpen = false;
  if (this._mustardSeed) {
    var msSelf = this;
    this.time.delayedCall(800, function () {
      if (msSelf.dead || msSelf.won) return;
      msSelf.floatText('MUSTARD SEED!', 0x7dd97b);
      if (msSelf.storyMission) {
        // story has no level-ups (v0.30.0), so the seed grants the way
        // a boss drop does: one upgrade outright, matching its promise
        var cards = PC.drawCards ? PC.drawCards(msSelf) : [];
        var pick = null;
        for (var ci = 0; ci < cards.length && !pick; ci++) {
          if (cards[ci].kind !== 'heal') pick = cards[ci];
        }
        if (pick) { PC.applyCard(msSelf, pick); msSelf.drawHud(); }
      } else {
        msSelf.gainXp(msSelf.xpNext - msSelf.xp);
      }
    });
  }
  // ?unlock=1 preview: two free upgrades at story-run start so any
  // stage is testable on a fresh kit (runtime-only - nothing saved)
  if (PC.UNLOCK_ALL && this.storyMission) {
    var ulSelf = this;
    this.time.delayedCall(1200, function () {
      if (ulSelf.dead || ulSelf.won) return;
      ulSelf.floatText('PREVIEW LOADOUT!', 0x35d0ff);
      for (var ug = 0; ug < 2; ug++) {
        var uCards = PC.drawCards ? PC.drawCards(ulSelf) : [];
        var uPick = null;
        for (var uc = 0; uc < uCards.length && !uPick; uc++) {
          if (uCards[uc].kind !== 'heal') uPick = uCards[uc];
        }
        if (uPick) PC.applyCard(ulSelf, uPick);
      }
      ulSelf.drawHud();
    });
  }

  // STORY-3: the mission engine rides on top of the run
  this.storyPause = false;
  this.quest = null;
  this.freeRoam = null;              // STORY-5: the between-missions seam
  this.doors = this.region ? new PC.Doors(this) : null;   // walk-in stores
  // ambient wildlife belongs to the green maps only - a squirrel in the
  // junk-flooded Labs breaks the fiction (v0.28.0)
  this.critters = (this.region && this.region.layout && PC.Critters &&
    (this.region.def.fabric === 'park' || this.region.def.fabric === 'suburb'))
    ? new PC.Critters(this) : null;    // ambient park wildlife
  if (this.region && PC.STORY.missions && this.storyMission &&
      PC.STORY.missions[this.storyMission.id]) {
    this.quest = new PC.Quest(this, this.region,
      PC.STORY.missions[this.storyMission.id]);
  }
  this.cardUi = [];

  // run state
  this.hp = PC.PLAYER.HP + (this.stats.bonusHp || 0);
  this.invUntil = 0;
  this.xp = 0; this.level = 1; this.xpNext = PC.XP.FIRST;
  this.bankedXp = 0;                 // story mode: XP is currency, not levels
  this.kills = 0;
  this.runT = 0;
  this.spawnT = 0;                 // story spawn clock (scene is REUSED)
  this.dead = false;
  this.director = new PC.SpawnDirector(this);
  this._rings = {};
  this.pickups = new PC.PickupSystem(this);
  this.boss = null; this.bossSpawned = false; this.won = false;
  this.bossDrop = null;              // one scene instance, every run resets
  this.bossBar = this.add.graphics().setDepth(103);
  // THE LOOP LINE (v0.35.0): the sewers' circulating subway hazard
  this.subway = (this.region && this.region.def.id === 'sewers' && PC.Subway)
    ? new PC.Subway(this) : null;
  this.sewerFlow = (this.region && this.region.def.id === 'sewers' && PC.SewerFlow)
    ? new PC.SewerFlow(this) : null;
  this.confront = (this.region && this.region.def.id === 'tower' && PC.Confront)
    ? new PC.Confront(this) : null;
  this.allies = null;                // built when the roof fight starts
  // CINEMATIC ZOOM (v0.47.0, Mark: "for the CHOMP fight we should zoom
  // the camera out a little bit... maybe even twenty percent, so they
  // can see more of the fight and it feels more cinematic"). The camera
  // lerps toward zoomTarget; null means leave it alone.
  this.baseZoom = this.cameras.main.zoom;
  this.zoomTarget = null;
  this._zoneSeen = {};

  var cam = this.cameras.main;
  cam.startFollow(this.player, true, PC.RENDER.CAMERA_LERP, PC.RENDER.CAMERA_LERP);
  // story beats hand off through a fade (freeroam.launch fades out, the
  // restarted scene fades back in) - a cut, never a menu
  if (this.region) cam.fadeIn(280, 0, 0, 0);
  this.ground.update(cam);

  // ---- HUD (screen-space) ----
  // font sizes + row offsets ride PC.uiK so the HUD keeps its physical
  // size across zoom changes (v0.27.2 BASE 312 -> 400)
  var K = PC.uiK;
  this.hud = this.add.graphics().setDepth(100);
  this.timerText = this.add.text(PC.RENDER.W / 2, K(4), '0:00', {
    fontFamily: 'monospace', fontSize: K(12) + 'px', color: '#f7f4ef',
  }).setOrigin(0.5, 0).setDepth(101);
  // PAUSE/MAP button, top-right (Mark: "a map view when the player
  // presses pause... it'll help with navigation"). Story runs only -
  // a quick run has no district to navigate.
  // GameScene is ONE instance reused for every run, so these must be
  // cleared on every create - a quick run (no region) would otherwise
  // re-attach the DESTROYED buttons left by the last story run
  // v0.31.0 (Mark: "the top area is cluttered... let's move map to the
  // bottom"): the MAP button lives bottom-right now, above the home
  // indicator, leaving the top strip to timer / POPS / banner.
  this.mapBtn = null; this.mapBtnG = null; this.mapZone = null;
  if (this.region) {
    var mbY = PC.RENDER.H - PC.SAFE_BOTTOM - K(22);
    var mbX = PC.RENDER.W - PC.SAFE - K(30);
    this.mapBtnG = this.add.graphics().setDepth(101);
    this.mapBtnG.fillStyle(0x1c1733, 0.9);
    this.mapBtnG.fillRect(mbX, mbY, K(34), K(20));
    this.mapBtnG.lineStyle(2, 0x35d0ff, 0.9);
    this.mapBtnG.strokeRect(mbX, mbY, K(34), K(20));
    this.mapBtnG.fillStyle(0x35d0ff, 0.85);        // folded-map glyph
    this.mapBtnG.fillRect(mbX + K(3), mbY + K(5), K(7), K(10));
    this.mapBtnG.fillStyle(0x35d0ff, 0.55);
    this.mapBtnG.fillRect(mbX + K(10), mbY + K(4), K(7), K(10));
    this.mapBtn = this.add.text(mbX + K(25), mbY + K(6), 'MAP', {
      fontFamily: 'monospace', fontSize: K(7) + 'px', color: '#35d0ff', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(102);
    this.mapZone = this.add.zone(mbX + K(17), mbY + K(10), K(48), K(34))
      .setInteractive({ useHandCursor: true });
    this.mapZone.on('pointerdown', function (p, lx, ly, ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      this.openMap();
    }, this);
  }
  this.killText = this.add.text(PC.RENDER.W - 4, K(4), 'POPS 0', {
    fontFamily: 'monospace', fontSize: K(9) + 'px', color: '#f2c33c',
  }).setOrigin(1, 0).setDepth(101);
  // HP readout printed on the gauge itself
  this.hpText = this.add.text(0, 0, '', {
    fontFamily: 'monospace', fontSize: K(9) + 'px', color: '#f7f4ef',
    fontStyle: 'bold', stroke: '#0b0818', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(102);
  // the tray sits under the bars, so the run stats move below it
  this.buildLoadout();
  // story runs skip the XP bar, so the stat column sits higher there
  var statY = K(5) + K(14) + K(8) + 2 * this.slotBox + this.slotGap + K(7) +
              (this.region ? 0 : K(14));
  this.levelText = this.add.text(PC.SAFE - K(6), statY,
    this.region ? 'TECH +0' : 'LV 1', {
    fontFamily: 'monospace', fontSize: K(9) + 'px', color: '#a8e04a',
  }).setDepth(101);
  this.goldText = this.add.text(PC.SAFE - K(6), statY + K(11), '', {
    fontFamily: 'monospace', fontSize: K(9) + 'px', color: '#f2c33c',
  }).setDepth(101);
  this.debugText = this.add.text(PC.SAFE, PC.RENDER.H - PC.SAFE_BOTTOM - K(10), '', {
    fontFamily: 'monospace', fontSize: K(8) + 'px', color: '#a8e04a',
  }).setDepth(101).setVisible(!!PC.DEV_MODE);
  // R5: the build stamp lives TOP-right in game. It used to sit bottom-
  // right, which is exactly where the dialogue box and its ▼ land - so a
  // conversation always had the version number printed inside it.
  this.verText = this.add.text(PC.RENDER.W - PC.SAFE,
    PC.DEV_MODE ? K(30) : K(18), PC.VERSION, {
    fontFamily: 'monospace', fontSize: K(8) + 'px', color: '#6d6a8e',
  }).setOrigin(1, 0).setDepth(101);
  this._dbgAcc = 0;
  this.drawHud();

  // dev swarm button (works on touch - Mark can't press T on a phone)
  this.swarmBtn = this.add.text(PC.RENDER.W - 4, K(30), '[SWARM]', {
    fontFamily: 'monospace', fontSize: K(9) + 'px', color: '#6d6a8e',
  }).setOrigin(1, 0).setDepth(101)
    .setInteractive({ useHandCursor: true });
  this.swarmBtn.on('pointerdown', function (p, lx, ly, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    this.stress();
  }, this);
  this.swarmBtn.setVisible(!!PC.DEV_MODE);

  [this.bossBar, this.hud, this.timerText, this.killText, this.levelText,
   this.goldText, this.debugText, this.verText, this.swarmBtn,
   this.mapBtnG, this.mapBtn, this.mapZone, this.hpText]
    .forEach(function (o) { if (o) this.uiAttach(o); }, this);
  this.attachLoadout();
  this.input.keyboard.on('keydown-M', function () { this.openMap(); }, this);
  this.input.keyboard.on('keydown-ESC', function () { this.openMap(); }, this);

  this.input.keyboard.on('keydown-G', function () { this.scene.start('PC_Gallery'); }, this);
  this.input.keyboard.on('keydown-T', function () { this.stress(); }, this);
  if (/[?&]stress=1/.test(window.location.search)) {
    this.time.delayedCall(400, this.stress, [], this);
  }

  // audio: unlock on first gesture, pause when tab hidden
  var unlock = function () { PC.audio.unlock(); };
  this.input.once('pointerdown', unlock);
  this.input.keyboard.once('keydown', unlock);
  if (!this._visHooked) {
    this._visHooked = true;
    document.addEventListener('visibilitychange', function () {
      PC.audio.setHidden(document.hidden);
    });
  }
};

PC.GameScene.prototype.stress = function () {
  var left = this.enemies.cap - this.enemies.liveCount;
  while (left > 0) {
    this.enemies.spawnRing(Math.min(60, left), FRY_DEF);
    left -= 60;
  }
};

PC.GameScene.prototype.gainXp = function (v) {
  if (PC.audio) PC.audio.gem();
  this.xp += v * this.xpMult;
  // STORY MODE (v0.30.0, Mark: "I don't think our players should level
  // up in story mode - it should only be gathering exp and cash and
  // then upgrading after completions or losses"). XP is BANKED, never
  // spent on a mid-run card pick: no menu interrupts an objective, and
  // the loadout you walked in with is the loadout you fight with. New
  // power comes from the shops between missions and from boss drops.
  // Quick run keeps the classic level-and-pick loop untouched.
  if (this.storyMission) {
    this.bankedXp = Math.floor(this.xp);
    // ONE currency name on screen (v0.31.0): the counter IS tech, live
    this.levelText.setText('TECH +' + this.bankedTp());
    this.drawHud();
    return;
  }
  while (this.xp >= this.xpNext) {
    this.xp -= this.xpNext;
    this.level++;
    this.xpNext = Math.round(this.xpNext * PC.XP.CURVE_MULT + PC.XP.CURVE_ADD);
    this.levelText.setText('LV ' + this.level);
    if (PC.audio) PC.audio.levelup();
    if (this.kit && this.kit.onLevelUp) this.kit.onLevelUp(this);
    this.pendingLevels++;
  }
  if (this.pendingLevels > 0 && !this.cardsOpen) this.showCards();
  this.drawHud();
};

// XP banked this run -> TECH at the results desk (10 XP = 1 TP)
PC.GameScene.prototype.bankedTp = function () {
  return Math.floor((this.bankedXp || 0) / PC.XP.PER_TP);
};

PC.GameScene.prototype.onKill = function (e) {
  // guard: overlapping damage (two bullets, an AoE tick) can call this
  // twice for the same enemy in one frame. Without the guard the live
  // counter drifts NEGATIVE and kills/gems get double-awarded - that's
  // the "foes -31" in Mark's v0.20.1 screenshot.
  if (!e.active) return;
  e.active = false;
  e.sprite.setVisible(false);
  e.sprite.clearTint();
  this.enemies.liveCount = Math.max(0, this.enemies.liveCount - 1);
  this.kills++;
  if (this.quest) this.quest.notifyKill(e);
  this.killText.setText('POPS ' + this.kills);
  this.fx.burst(e.x, e.y, 'fx_pop', 4, 0.3);
  if (e.still) this.fx.still(e.x, e.y, e.still, 0.4);
  this.gems.spawn(e.x, e.y, e.xp);
  var roll = Math.random();
  // story kills roll medkits at double odds (v0.33.0, Mark: recovery
  // should come from the tables - "random drops of health... whenever
  // you kill an enemy or when you see those boxes" - not from gifts)
  var mkOdds = this.storyMission ? 0.03 : 0.015;
  if (roll < mkOdds) this.pickups.drop(e.x, e.y, 'medkit', PC.PLAYER.MEDKIT_HEAL);
  else if (roll < 0.115 + mkOdds) this.pickups.drop(e.x, e.y, 'coin', 2);
  if (PC.audio) PC.audio.pop();
};

// ---- THE LOADOUT TRAY (v0.30.1) -----------------------------------
// Mark: "a section under that, that shows which abilities and weapons
// have been chosen and filling out the boxes. Like vampire survivor
// does." Two rows of slot boxes under the bars - weapons on top (cyan),
// passives below (gold). Empty slots are dim outlines you can see
// waiting to be filled; a filled slot shows its icon plus rank pips,
// and goes gold-framed when it's maxed or evolved.
PC.GameScene.prototype.buildLoadout = function () {
  var K = PC.uiK, self = this;
  this.slotBox = K(20); this.slotGap = K(3);
  // the right edge of the HUD column - the quest banner keeps clear of it
  this.hudRight = PC.SAFE - K(6) + (PC.XP.WEAPON_SLOTS || 4) * (this.slotBox + this.slotGap) + K(6);
  this.slotIcons = [];
  var n = (PC.XP.WEAPON_SLOTS || 4) + (PC.XP.PASSIVE_SLOTS || 4);
  for (var i = 0; i < n; i++) {
    var im = this.add.image(0, 0, 'atlas', 'icon_weapon_resizer')
      .setDepth(101).setVisible(false);
    var pip = this.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: K(7) + 'px', color: '#f7f4ef',
      fontStyle: 'bold', stroke: '#0b0818', strokeThickness: 3,
    }).setOrigin(1, 1).setDepth(102).setVisible(false);
    this.slotIcons.push({ im: im, pip: pip });
  }
};

// icons attach to the UI container LAST: a Phaser Container renders its
// children in ADD order, so anything added after the `hud` graphics sits
// above the slot beds - add these first and the boxes paint over them
PC.GameScene.prototype.attachLoadout = function () {
  for (var i = 0; i < this.slotIcons.length; i++) {
    this.uiAttach(this.slotIcons[i].im);
    this.uiAttach(this.slotIcons[i].pip);
  }
};

PC.GameScene.prototype.drawLoadout = function (g, top) {
  if (!this.slotIcons) return;
  var K = PC.uiK, B = this.slotBox, GAP = this.slotGap;
  var WSLOTS = PC.XP.WEAPON_SLOTS || 4, PSLOTS = PC.XP.PASSIVE_SLOTS || 4;
  var pk = [], k;
  for (k in this.passives) if (this.passives[k] > 0) pk.push(k);
  var self = this;

  function row(y, count, filled, accent) {
    for (var i = 0; i < count; i++) {
      var x = PC.SAFE - K(6) + i * (B + GAP);
      var has = !!filled[i];
      // a FILLED slot gets a lighter slate bed so the icon reads; an
      // empty one stays near-black so the tray shows what's still open
      g.fillStyle(0x0b0818, 0.92).fillRect(x, y, B, B);
      if (has) g.fillStyle(0x39344f, 1).fillRect(x + 2, y + 2, B - 4, B - 4);
      g.lineStyle(2, has ? filled[i].col : 0x3a3550, has ? 1 : 0.9);
      g.strokeRect(x + 1, y + 1, B - 2, B - 2);
      if (!has) {
        // an empty socket reads as a waiting slot, not a bug
        g.lineStyle(1, 0x3a3550, 0.8);
        g.beginPath();
        g.moveTo(x + B * 0.32, y + B / 2); g.lineTo(x + B * 0.68, y + B / 2);
        g.strokePath();
      } else {
        // dark chip behind the rank pip so the digit never fights the art
        g.fillStyle(0x0b0818, 0.85).fillRect(x + B - K(9), y + B - K(9), K(8), K(8));
      }
    }
  }

  // gather what's in each row
  var wf = [], pf = [], i;
  for (i = 0; i < WSLOTS; i++) {
    var w = this.weapons[i];
    wf.push(w ? { icon: PC.WEAPON_ICONS[w.key] || 'icon_weapon_resizer',
                  lvl: w.level, maxed: w.evolved || w.level >= w.max,
                  col: (w.evolved || w.level >= w.max) ? 0xf2c33c : 0x35d0ff } : null);
  }
  for (i = 0; i < PSLOTS; i++) {
    var key = pk[i], def = key && PC.PASSIVES[key];
    pf.push(def ? { icon: def.icon, lvl: this.passives[key],
                    maxed: this.passives[key] >= def.max,
                    col: this.passives[key] >= def.max ? 0xf2c33c : 0xa8e04a } : null);
  }
  row(top, WSLOTS, wf, 0x35d0ff);
  row(top + B + GAP, PSLOTS, pf, 0xa8e04a);

  // icons + rank pips ride on top of the boxes
  var all = wf.concat(pf);
  for (i = 0; i < this.slotIcons.length; i++) {
    var s = this.slotIcons[i], f = all[i];
    if (!f) { s.im.setVisible(false); s.pip.setVisible(false); continue; }
    var ri = i < WSLOTS ? i : i - WSLOTS;
    var bx = PC.SAFE - K(6) + ri * (B + GAP), by = top + (i < WSLOTS ? 0 : B + GAP);
    // setDisplaySize, not setScale: the icon frames are NOT all the same
    // source size, so a fixed scale let some art spill out of its box
    s.im.setFrame(f.icon).setVisible(true)
      .setPosition(bx + B / 2, by + B / 2)
      .setDisplaySize(B - K(7), B - K(7));
    s.pip.setText(f.maxed ? '★' : String(f.lvl))
      .setColor(f.maxed ? '#f2c33c' : '#f7f4ef')
      .setVisible(true).setPosition(bx + B - 1, by + B - 1);
  }
};

PC.GameScene.prototype.drawHud = function () {
  var g = this.hud, K = PC.uiK;
  g.clear();
  // ---- HP bar (v0.30.1, Mark: "easier to read hp bar") -------------
  // was a 70x8 sliver of flat colour. Now: a framed gauge with a dark
  // socket, a lit top edge on the fill, segment ticks every 25 HP so
  // you can read damage at a glance, and the number printed on it.
  var maxHp = PC.PLAYER.HP + (this.stats.bonusHp || 0);
  var hpw = K(104), hph = K(14);
  var L = PC.SAFE - K(6), T = K(5);          // clear of the screen edge
  var frac2 = Math.max(0, Math.min(1, this.hp / maxHp));
  g.fillStyle(0x0b0818, 0.92).fillRect(L, T, hpw + 4, hph + 4);      // socket
  g.fillStyle(PC.PAL.INK, 1).fillRect(L + 1, T + 1, hpw + 2, hph + 2);
  var hpCol = frac2 > 0.5 ? PC.PAL.CHERRY : (frac2 > 0.25 ? PC.PAL.CHEESE : PC.PAL.KETCHUP);
  g.fillStyle(hpCol, 1).fillRect(L + 2, T + 2, Math.max(0, hpw * frac2), hph);
  g.fillStyle(0xffffff, 0.28).fillRect(L + 2, T + 2, Math.max(0, hpw * frac2), K(3));
  g.fillStyle(0x0b0818, 0.45);                                        // segments
  for (var seg = 25; seg < maxHp; seg += 25) {
    g.fillRect(L + 2 + hpw * (seg / maxHp), T + 2, 1, hph);
  }
  g.lineStyle(1, 0xcfd4e8, 0.55).strokeRect(L + 1.5, T + 1.5, hpw + 2, hph + 2);
  if (this.hpText) {
    this.hpText.setText(Math.max(0, Math.ceil(this.hp)) + '/' + Math.round(maxHp));
    this.hpText.setPosition(L + 2 + hpw / 2, T + 2 + hph / 2);
  }
  // v0.31.0 (Mark: "get rid of the exp bar... are tech points the same
  // as exp? that's all confusing"): STORY shows NO XP anywhere - gems
  // feed a live TECH counter (drawn as text below the tray) and that's
  // the whole economy: coins for Sal's, TECH for the Garage. Quick run
  // keeps its XP/level bar - levelling is that mode's loop.
  var xpy = T + hph + K(4);
  if (!this.storyMission) {
    xpy = T + hph + K(8);
    var frac = this.xp / this.xpNext;
    g.fillStyle(PC.PAL.INK, 0.9).fillRect(L + 1, xpy, hpw + 2, K(5));
    g.fillStyle(PC.PAL.LIME, 1).fillRect(L + 2, xpy + 1, Math.max(0, hpw * Math.min(1, frac)), K(5) - 2);
    g.lineStyle(1, 0x6d6a8e, 0.5).strokeRect(L + 0.5, xpy - 0.5, hpw + 3, K(5) + 1);
    xpy += K(5);
  }
  this.drawLoadout(g, xpy + K(4));
  if (this.goldText && this.pickups) this.goldText.setText('$ ' + this.pickups.gold);
};

// small rising label (heals, pickups)
PC.GameScene.prototype.floatText = function (str, color) {
  var t = this.add.text(this.player.x, this.player.y - 30, str, {
    fontFamily: 'monospace', fontSize: PC.uiK(10) + 'px',
    color: '#' + ('00000' + (color || 0xffffff).toString(16)).slice(-6), fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(102);
  this.tweens.add({ targets: t, y: t.y - 16, alpha: 0, duration: 700,
    onComplete: function () { t.destroy(); } });
};

// ---- THE BOSS DROP (v0.30.0) --------------------------------------
// A defeated boss leaves a supply chest. Walking over it GRANTS one of
// the existing upgrades outright - no menu, no three-way decision, just
// a reveal - because in story mode this is the only power spike inside
// a mission and it should feel like a trophy, not homework.
PC.GameScene.prototype.dropBossPower = function (x, y) {
  if (this.bossDrop) return;
  var self = this;
  var glow = this.add.image(x, y, 'atlas', 'fx_nova_1')
    .setScale(1.1).setDepth(5).setAlpha(0.55)
    .setBlendMode(Phaser.BlendModes.ADD).setTint(0xf2c33c);
  this.tweens.add({ targets: glow, scale: 1.6, alpha: 0.2,
    duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  var img = this.add.image(x, y, 'atlas', 'pickup_chest_1').setDepth(6).setScale(1.1);
  this.tweens.add({ targets: img, y: y - 6, duration: 750,
    yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  var hint = this.add.text(x, y - 26, 'POWER-UP', {
    fontFamily: 'monospace', fontSize: PC.uiK(8) + 'px', color: '#f2c33c',
    fontStyle: 'bold', stroke: '#120e24', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(7);
  this.tweens.add({ targets: hint, alpha: 0.45, duration: 600, yoyo: true, repeat: -1 });
  this.bossDrop = { x: x, y: y, img: img, glow: glow, hint: hint };
  if (PC.audio) PC.audio.chest();
};

PC.GameScene.prototype.updateBossDrop = function () {
  var d = this.bossDrop;
  var dx = this.px - d.x, dy = this.py - d.y;
  if (dx * dx + dy * dy > 34 * 34) return;
  // pick the most exciting thing on offer: a brand new weapon beats a
  // rank-up, and a plain heal is the last resort
  var cards = (PC.drawCards ? PC.drawCards(this) : []) || [];
  var card = null, i;
  for (i = 0; i < cards.length && !card; i++) if (cards[i].kind === 'weapon-new') card = cards[i];
  for (i = 0; i < cards.length && !card; i++) if (cards[i].kind === 'evolve') card = cards[i];
  for (i = 0; i < cards.length && !card; i++) if (cards[i].kind !== 'heal') card = cards[i];
  if (!card && cards.length) card = cards[0];
  d.img.destroy(); d.glow.destroy(); d.hint.destroy();
  this.bossDrop = null;
  if (!card) return;
  PC.applyCard(this, card);
  if (PC.audio) { PC.audio.fanfare(); PC.audio.cardSelect(); }
  this.fx.burst(this.px, this.py - 8, 'fx_levelup', 4, 0.7);
  this.cameras.main.shake(180, 0.004);
  this.drawHud();
  // the reveal: one banner, no decision
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  var g = this.add.graphics().setDepth(150);
  PC.labPanel(g, W / 2 - PC.uiK(84), H * 0.34, PC.uiK(168), PC.uiK(40),
    { rivets: true, base: 0x2a2210, edge: 0xf2c33c });
  var t1 = PC.ui.text(this, W / 2, H * 0.34 + PC.uiK(6), 'POWER-UP!', 'caption',
    { color: '#f2c33c', align: 'center' }).setOrigin(0.5, 0).setDepth(151);
  var t2 = PC.ui.text(this, W / 2, H * 0.34 + PC.uiK(19), card.title || 'UPGRADE', 'label',
    { color: '#f7f4ef', align: 'center' }).setOrigin(0.5, 0).setDepth(151);
  PC.ui.fit(t2, PC.uiK(156));
  [g, t1, t2].forEach(this.uiAttach);
  this.time.delayedCall(2200, function () {
    self.tweens.add({ targets: [g, t1, t2], alpha: 0, duration: 500,
      onComplete: function () { g.destroy(); t1.destroy(); t2.destroy(); } });
  });
};

// ---- the district map: pause the run, show where everything is ----
PC.GameScene.prototype.openMap = function () {
  if (!this.region || this.cardsOpen || this.storyPause || this.dead) return;
  if (this.scene.isPaused()) return;
  if (PC.audio) { PC.audio.unlock(); PC.audio.ui(); }
  this.scene.pause();
  this.scene.launch('PC_MapView', { overlay: true, resume: 'PC_Game' });
  // a paused scene still RENDERS and PC_MapView is registered before
  // PC_Game, so without this the map draws under the frozen street
  this.scene.bringToTop('PC_MapView');
};

// ---- M4: the 3-card pick (pause world, choose, resume) ----
PC.GameScene.prototype.showCards = function () {
  this.cardsOpen = true;
  var W = PC.RENDER.W, H = PC.RENDER.H;
  var self = this;
  var ui = this.cardUi;
  var scrim = this.add.rectangle(W / 2, H / 2, W, H, 0x0b0818, 0.72)
    .setDepth(200);
  ui.push(scrim);
  ui.push(this.add.text(W / 2, H / 2 - PC.uiK(96), 'LEVEL UP! PICK ONE', {
    fontFamily: 'monospace', fontSize: PC.uiK(13) + 'px', color: '#a8e04a', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(201));
  var cards = PC.drawCards(this);
  this._shownCards = cards;   // testability hook (balance bots)
  var cw = PC.uiK(78), ch = PC.uiK(120), gap = 8;
  var x0 = W / 2 - (cards.length * (cw + gap) - gap) / 2 + cw / 2;
  cards.forEach(function (card, i) {
    var cx = x0 + i * (cw + gap), cy = H / 2;
    var isEvo = card.kind === 'evolve';
    var panel = self.add.rectangle(cx, cy, cw, ch, isEvo ? 0x3a2c10 : 0x2a2544, 1)
      .setStrokeStyle(isEvo ? 3 : 2,
        isEvo ? 0xf2c33c : (card.sub === 'NEW!' ? 0xf2c33c : 0x35d0ff))
      .setDepth(201).setInteractive({ useHandCursor: true });
    if (isEvo) {
      self.tweens.add({ targets: panel, scaleX: 1.04, scaleY: 1.04,
        duration: 380, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    var icon = self.add.image(cx, cy - PC.uiK(32), 'atlas', card.icon)
      .setScale(0.8).setDepth(202);
    var title = self.add.text(cx, cy + PC.uiK(2), card.title, {
      fontFamily: 'monospace', fontSize: PC.uiK(11) + 'px', color: '#f7f4ef', fontStyle: 'bold',
      align: 'center', wordWrap: { width: cw - 10 }, lineSpacing: 3,
    }).setOrigin(0.5).setDepth(202);
    var sub = self.add.text(cx, cy + PC.uiK(22), card.sub, {
      fontFamily: 'monospace', fontSize: PC.uiK(9) + 'px', color: '#f2c33c', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(202);
    var desc = self.add.text(cx, cy + PC.uiK(42), card.desc, {
      fontFamily: 'monospace', fontSize: PC.uiK(9) + 'px', color: '#cfd4e8',
      align: 'center', wordWrap: { width: cw - 10 }, lineSpacing: 3,
    }).setOrigin(0.5).setDepth(202);
    ui.push(panel, icon, title, sub, desc);
    panel.on('pointerdown', function () { self.pickCard(card); });
  });
  ui.forEach(function (o) { self.uiAttach(o); });
  this._cardKeys = [];
  cards.forEach(function (card, i) {
    var h = function () { self.pickCard(card); };
    self.input.keyboard.on('keydown-' + ['ONE', 'TWO', 'THREE'][i], h);
    self._cardKeys.push(['keydown-' + ['ONE', 'TWO', 'THREE'][i], h]);
  });
};

PC.GameScene.prototype.pickCard = function (card) {
  if (!this.cardsOpen) return;
  PC.applyCard(this, card);
  if (PC.audio) PC.audio.cardSelect();
  var self = this;
  this.cardUi.forEach(function (o) { o.destroy(); });
  this.cardUi = [];
  this._cardKeys.forEach(function (k) { self.input.keyboard.off(k[0], k[1]); });
  this._cardKeys = [];
  this.cardsOpen = false;
  this.pendingLevels--;
  this.drawHud();
  if (this.pendingLevels > 0) this.showCards();
};

PC.GameScene.prototype.update = function (time, delta) {
  if (this.dead) return;
  var cam0 = this.cameras.main;
  if (this.zoomTarget && Math.abs(cam0.zoom - this.zoomTarget) > 0.0005) {
    var dz = Math.min(1, (this.game.loop.delta / 1000) * 2.2);
    cam0.setZoom(cam0.zoom + (this.zoomTarget - cam0.zoom) * dz);
  }
  var wv = cam0.worldView;
  this.ui.setPosition(wv.x, wv.y);
  // the HUD lives in this world-space container, so a camera zoom would
  // shrink it too. Counter-scale it and the interface holds its real
  // on-screen size at any zoom.
  if (this.baseZoom) {
    var fix = this.baseZoom / cam0.zoom;
    if (Math.abs(this.ui.scaleX - fix) > 0.001) this.ui.setScale(fix);
  }
  // Leftovers regen (arsenal expansion): slow trickle, hud at 1Hz
  if (this.stats.regen > 0 && this.hp > 0) {
    var mh = PC.PLAYER.HP + (this.stats.bonusHp || 0);
    if (this.hp < mh) {
      this.hp = Math.min(mh, this.hp + this.stats.regen * (this.game.loop.delta / 1000));
      this._regenHud = (this._regenHud || 0) + this.game.loop.delta / 1000;
      if (this._regenHud > 1) { this._regenHud = 0; this.drawHud(); }
    }
  }
  if (this.cardsOpen) return;                 // world paused during the pick
  var dt = Math.min(PC.DT_CLAMP, delta / 1000);
  // storefront doormats keep drawing through dialogue (they'd blink out
  // every time someone talked otherwise); Doors hides its own prompt
  if (this.doors) this.doors.update();
  if (this.critters) this.critters.update(dt);
  if (this.bossDrop) this.updateBossDrop();
  if (this.storyPause) {                       // story dialogue: world holds
    if (this.quest) this.quest.update(dt);
    this.ground.update(this.cameras.main);
    return;
  }
  // the roof cutscene must claim the frame BEFORE objective logic does,
  // or a quest beat arms its wave on the very frame Danny steps up
  if (this.confront) this.confront.check();
  if (this.quest) this.quest.update(dt);
  if (this.freeRoam) this.freeRoam.update(dt);
  // THE OLD CISTERN (spec Map 5 "loot vault = big TP cache"): first
  // time any run walks into the vault, the floor erupts in gems and
  // coins. Once per save - the glint stays painted as a memory.
  if (this.region && this.region.def.id === 'sewers' &&
      PC.meta && !PC.meta.stat('cistern_looted')) {
    var cst = this.region.landmark('cistern');
    if (cst && this.px > cst.x && this.px < cst.x + cst.w &&
        this.py > cst.y && this.py < cst.y + cst.h) {
      PC.meta.setFlag('cistern_looted');
      this.floatText('THE OLD CISTERN - JACKPOT!', 0xf2c33c);
      if (PC.audio) PC.audio.chest();
      for (var cj = 0; cj < 14; cj++) {
        var ca2 = (cj / 14) * Math.PI * 2, cr2 = 30 + (cj % 4) * 22;
        this.pickups.drop(this.px + Math.cos(ca2) * cr2,
                          this.py + Math.sin(ca2) * cr2, 'coin', 5);
      }
      for (var gj = 0; gj < 20; gj++) {
        var ga2 = (gj / 20) * Math.PI * 2, gr2 = 46 + (gj % 5) * 18;
        this.gems.spawn(this.px + Math.cos(ga2) * gr2,
                        this.py + Math.sin(ga2) * gr2, 3);
      }
    }
  }
  this.now += dt;
  this.runT += dt;

  // input -> motion, same frame
  this.moveInput.update();
  var v = this.moveInput.vec;
  // THE CONFRONTATION (v0.45.0): on the Tower roof the stick is taken
  // away and the cinematic drives the SAME pipeline - so Danny's walk
  // cycle, facing and footsteps in the cutscene are the ones the player
  // has had their thumb on all game.
  if (this.confront) {
    if (this.confront.armed()) {
      this.confront.update(dt);
      v = this.confront.driveVec();
    }
  }
  this.moving = (v.x !== 0 || v.y !== 0);
  var spd = PC.PLAYER.SPEED * this.stats.spdMult;
  // sewer zone effects (v0.42.0): spore haze + wading water slow the
  // player; a tiny label the first time so the kid knows WHY
  this._zone = null;
  if (this.region && this.region.layout && this.region.layout.zoneEffectAt) {
    this._zone = this.region.layout.zoneEffectAt(this.px, this.py);
    if (this._zone) {
      spd *= this._zone.slow;
      // ONCE PER RUN per kind (v0.43.0) - the gutter drains are thin, so
      // a per-entry label would flicker every few steps down a corridor
      this._zoneSeen = this._zoneSeen || {};
      if (!this._zoneSeen[this._zone.kind]) {
        this._zoneSeen[this._zone.kind] = 1;
        this.floatText(this._zone.kind === 'spore' ? 'THICK SPORES...' : 'WADING...',
          this._zone.kind === 'spore' ? 0xa8e04a : 0x35d0ff);
      }
    }
  }
  if (this.moving) {
    this.px += v.x * spd * dt;
    this.py += v.y * spd * dt;
    if (this.region) {
      this.px = Math.max(20, Math.min(this.region.size - 20, this.px));
      this.py = Math.max(20, Math.min(this.region.size - 20, this.py));
    }
    if (v.x > 0.01) this.facing = 1;
    else if (v.x < -0.01) this.facing = -1;
    this.aimX = v.x; this.aimY = v.y;
    this.walkT += dt;
    this.player.setFrame(this.hero.art + '_walk_' + (1 + (Math.floor(this.walkT * 10) % 6)));
  } else {
    this.walkT = 0;
    this.player.setFrame(this.hero.art + '_idle');
  }
  // buildings are solid (Mark round 6)
  var rp = PC.resolveCircle(this.px, this.py, 13);
  this.px = rp.x; this.py = rp.y;
  // walk juice (ARTDNA): 1px step bob + a whisper of lean
  var bob = this.moving ? Math.round(Math.sin(this.walkT * 11)) : 0;
  this.player.setPosition(Math.round(this.px), Math.round(this.py) + bob);
  this.player.rotation = this.moving ? this.facing * 0.03 : 0;

  // item glow: steady faint spark on the held item; breathes while
  // walking (Danny's ray gun glow etc.) - pure code-side life
  if (this.itemGlow) {
    var gl = this.kit.glow, hs = this.hero.scale;
    this.itemGlow.setPosition(
      Math.round(this.px + gl.x * hs * this.facing),
      Math.round(this.py + gl.y * hs) + bob);
    var pulse = this.moving ? 0.5 + 0.35 * Math.sin(this.now * 9) : 0.22;
    this.itemGlow.setAlpha(pulse).setScale(this.moving ? 1.15 : 0.85);
  }

  // ghost trail: drop a faint after-image every 70ms of movement; it stays
  // put as Danny moves on, so the trail streams opposite his heading
  this._ghostAcc += dt;
  if (this.moving && this._ghostAcc > 0.07) {
    this._ghostAcc = 0;
    var gh = null;
    for (var g1 = 0; g1 < this.ghosts.length; g1++) {
      if (this.ghosts[g1].life <= 0) { gh = this.ghosts[g1]; break; }
    }
    if (gh) {
      gh.life = 0.22; gh.t = 0.22;
      gh.img.setFrame(this.player.frame.name)
        .setFlipX(this.player.flipX)
        .setPosition(this.player.x, this.player.y)
        .setAlpha(0.16).setVisible(true);
    }
  }
  for (var g2 = 0; g2 < this.ghosts.length; g2++) {
    var gg = this.ghosts[g2];
    if (gg.life <= 0) continue;
    gg.life -= dt;
    if (gg.life <= 0) { gg.img.setVisible(false); continue; }
    gg.img.setAlpha(0.16 * (gg.life / gg.t));
  }

  // systems
  this.enemies.update(dt, this.px, this.py);
  // guns down during the roof confrontation: Danny does not open fire on
  // something that is still saying hello (v0.45.0)
  if (!(this.confront && this.confront.armed())) {
    for (var wi = 0; wi < this.weapons.length; wi++) this.weapons[wi].update(dt, this);
  }
  var self = this;
  if (this.allies) this.allies.update(dt);
  this.bullets.update(dt, this.enemies, this._onKillCb);
  this.juice.update(dt);
  this.vfx.update(dt);
  this.gems.update(dt, this.px, this.py, PC.PLAYER.PICKUP_R * this.stats.pickupMult);
  this.pickups.update(dt, this.px, this.py, PC.PLAYER.PICKUP_R);
  this.fx.update(dt);
  this.player.setFlipX(this.facing < 0);

  // enemy hit-flash decay (timestamp, never a stuck boolean)
  var pool = this.enemies.pool;
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (e.active && e.flashUntil && this.now > e.flashUntil) {
      e.flashUntil = 0;
      if (this.now < e.slowUntil) e.sprite.setTint(0x9adfff);   // frozen
      else e.sprite.clearTint();
    }
    if (e.active && e.slowUntil && this.now > e.slowUntil && !e.flashUntil) {
      e.slowUntil = 0;
      e.sprite.clearTint();
    }
  }

  // contact damage via 3x3 hash query + timestamp i-frames.
  // !dead guard (v0.33.0): damage kept applying through the death anim
  // and a last-frame win, so the bar could read deep negative
  if (this.now > this.invUntil && !this.dead) {
    var hitDmg = 0;
    this.enemies.hash.eachNear(this.px, this.py, function (e) {
      var dx = e.x - self.px, dy = e.y - self.py;
      if (dx * dx + dy * dy < (e.r + 8) * (e.r + 8)) { hitDmg = e.dmg; return true; }
    });
    if (hitDmg > 0) {
      this.hp -= Math.max(1, hitDmg * this.dmgTakenMult - this.stats.armor);
      this.lastHurtT = this.now;
      this.invUntil = this.now + PC.PLAYER.IFRAMES;
      this.cameras.main.shake(PC.SHAKE.MS, 0.004);
      if (PC.audio) PC.audio.hurt();
      this.drawHud();
      if (this.hp <= 0) { this.die(); return; }
    }
  }
  // i-frame blink at 10Hz
  this.player.setAlpha(this.now < this.invUntil && Math.floor(this.now * 10) % 2 ? 0.35 : 1);

  // spawn director (COMPENDIUM 8.1, kid-tuned): sparse early, intense late,
  // 5 food types introduced on a timeline. Ambient spawns thin out while
  // the boss lives (COMPENDIUM 5.1 x1.8 interval) so the fight can breathe.
  var dirScale = (this.boss && !this.boss.dead) ? 0.55 : 1;
  if (this.region) dirScale *= 0.5;            // story: ambient stays thin
  if (this.freeRoam) dirScale *= 0.25;         // between beats: calm streets
  // STORY SPAWN CLOCK (v0.32.0). Quick run's difficulty curve is wall-
  // clock because power growth is wall-clock (leveling). Story has NO
  // leveling, but walking/fetching burned the same clock - a slow
  // traveler reached the late phases (0.3s interval, cap 260) with a
  // base kit and got buried (campaign bot: 129 live enemies at a
  // t=210s defend, zero stage wins). Story missions advance the
  // director on their own clock instead: full speed only while an
  // objective is HOT (clear/defend/boss active), quarter speed while
  // traveling, and capped before the deep-run phases ever arrive.
  // Enemy hp/dmg time-scaling rides the same clock, so late-mission
  // strays stop being spongy too. Quick run: spawnT === runT, no cap.
  if (this.region) {
    var qHot = this.quest && !this.quest.done && this.quest.state === 'active';
    this.spawnT = Math.min(210, (this.spawnT || 0) + dt * (qHot ? 1 : 0.25));
  } else this.spawnT = this.runT;
  this.director.update(dt * dirScale, this.spawnT);
  // timeline ring events ride the spawn clock, themed to the map's roster
  var rings = [[45, 16, 'fry'], [120, 22, 'popcorn'], [200, 28, 'hotdog']];
  var rk = this.quest && this.quest.ringKinds;
  for (var ri = 0; ri < rings.length; ri++) {
    if (this.spawnT >= rings[ri][0] && !this._rings[ri]) {
      this._rings[ri] = true;
      this.director.ring(rings[ri][1], rk ? rk[ri % rk.length] : rings[ri][2], this.spawnT / 60);
    }
  }

  // ---- BOSS (M5): Big Frank at the timer, then run his fight ----
  if (!this.region && !this.bossSpawned && this.runT >= PC.RUN.BOSS_AT_S) this.spawnBoss();
  if (this.boss) this.boss.update(dt, this.px, this.py);
  if (this.subway) this.subway.update(dt);
  if (this.sewerFlow) this.sewerFlow.update();

  this.ground.update(this.cameras.main);

  // timer + debug
  this._dbgAcc += dt;
  if (this._dbgAcc > 0.25) {
    this._dbgAcc = 0;
    var m = Math.floor(this.runT / 60), sec = Math.floor(this.runT % 60);
    this.timerText.setText(m + ':' + (sec < 10 ? '0' : '') + sec);
    if (PC.DEV_MODE) {
      this.debugText.setText('fps ' + Math.round(this.game.loop.actualFps) +
        ' - foes ' + this.enemies.liveCount);
    }
  }
};

// STORY-5: mission over, city stays open. The swarm scatters, the
// director calms down, and a marker points at the next story beat.
PC.GameScene.prototype.enterFreeRoam = function (nextEntry, earned) {
  if (this.freeRoam || this.dead) return;
  this.enemies.clearAll(this.fx);
  if (this.boss && !this.boss.dead) this.boss = null;
  this.freeRoam = new PC.FreeRoam(this, nextEntry, earned);
};

// lifetime stats feed the hero-unlock conditions (kits.js HERO_UNLOCKS)
PC.GameScene.prototype.recordRunStats = function (won) {
  if (this._statsRecorded || !PC.meta) return;
  this._statsRecorded = true;
  PC.meta.bump('totalPops', this.kills);
  PC.meta.maxStat('bestLevel', this.level);
  if (this.bossSpawned) PC.meta.setFlag('reachedBoss');
  if (won) PC.meta.setFlag('wonD1');
};

// ---- THE ROOF FIGHT'S STORY BEATS -----------------------------------
// Phase changes are not stat bumps, they are lines. Phase 3 is where the
// whole crew arrives at once and Vic gets the only shout he ever gets.
PC.GameScene.prototype.onChompPhase = function (p) {
  var self = this;
  if (p === 2) {
    this.floatText('HERE IS MORE!', 0xe2574c);
    if (this.quest && this.quest.box) {
      this.quest.box.show({ speaker: 'chomp', text: 'Here is MORE!' }, function () {});
    }
  } else if (p === 3) {
    if (this.allies) this.allies.allIn();
    this.cameras.main.shake(400, 0.008);
    if (this.quest && this.quest.box) {
      this.storyPause = true;
      this.quest.box.show({ speaker: 'vic',
        text: "Danny - the override's ready! Give it everything!" }, function () {
        self.storyPause = false;
      });
    }
  }
};

// It powers down mid-sentence. The rest of the ending is authored on top
// of this hook - for now the fight simply stops and hands to the win.
PC.GameScene.prototype.onChompDown = function () {
  var self = this;
  this.zoomTarget = this.baseZoom;         // back to normal for the ending
  if (this.allies) this.allies.running = false;
  this.enemies.clearAll();
  this.storyPause = true;
  var beats = [
    { speaker: 'chomp', text: '...did I... not help?' },
    { speaker: 'danny', text: "You wanted to feed everyone. That's a good heart, CHOMP. But helping means listening first." },
  ];
  var i = 0;
  function step() {
    if (i >= beats.length) {
      self.storyPause = false;
      if (self.boss) self.boss.dead = true;
      self.onBossDefeated();
      return;
    }
    self.quest.box.show(beats[i++], step);
  }
  if (this.quest && this.quest.box) step();
  else { this.storyPause = false; if (this.boss) this.boss.dead = true; this.onBossDefeated(); }
};

PC.GameScene.prototype.die = function () {
  if (this.dead || this.won) return;
  // THE CREW PICKS YOU UP (v0.46.0). On the Tower roof, going down does
  // not end the game the first time in a phase - one of the five drops
  // in and hauls Danny to his feet. It is the story's own answer to the
  // difficulty question, and it means a kid cannot wall on the last
  // screen in the game. Once per phase, so it is a net, not immortality.
  if (this.allies && this.boss && !this.boss.dead && !this.boss.powering) {
    var ph = this.boss.phase || 1;
    var helper = this.allies.tryRevive(ph);
    if (helper) {
      var mhA = PC.PLAYER.HP + (this.stats.bonusHp || 0);
      this.hp = Math.ceil(mhA * 0.5);
      this.invUntil = this.now + 3.0;
      this.floatText('ON YOUR FEET!', helper.def.tint);
      this.drawHud();
      return;
    }
  }
  // AMAZING GRACE (shop flagship): get back up once per run at half HP
  if (this.reviveCharges > 0) {
    this.reviveCharges--;
    var mhG = PC.PLAYER.HP + (this.stats.bonusHp || 0);
    this.hp = Math.ceil(mhG * 0.5);
    this.invUntil = this.now + 2.5;
    var gSelf = this;
    // fling the crowd back so the fresh start isn't instantly undone
    this.enemies.hash.eachNear(this.px, this.py, function (e) {
      var dx = e.x - gSelf.px, dy = e.y - gSelf.py;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d > 110) return;
      e.kbUntil = gSelf.now + 0.5;
      e.kbx = dx / d * 220; e.kby = dy / d * 220;
    });
    this.fx.burst(this.px, this.py - 8, 'fx_nova', 3, 0.4);
    this.fx.burst(this.px, this.py - 8, 'fx_levelup', 4, 0.5);
    if (this.vfx) this.vfx.shake(2.5, 110);
    if (PC.audio && PC.audio.revive) PC.audio.revive();
    this.floatText('AMAZING GRACE!', 0xf2c33c);
    this.drawHud();
    return;
  }
  this.dead = true;
  this.recordRunStats(false);
  if (PC.audio) { PC.audio.stopMusic(); PC.audio.hurt(); }
  this.fx.burst(this.px, this.py, 'fx_pop', 4, 0.4);
  this.player.setVisible(false);
  var self = this;
  this.time.delayedCall(700, function () {
    // a LOSS still pays out (Mark: "upgrading after completions or
    // losses") - the banked XP converts to TECH either way
    self.scene.start('PC_Results', { time: self.runT, kills: self.kills, level: self.level,
      gold: self.pickups.gold, win: false, story: !!self.quest,
      tp: self.quest ? self.quest.tpEarned : 0, hero: self.hero.id,
      xp: self.bankedXp || 0, xpTp: self.bankedTp() });
  });
};

// ---- BOSS spawn: big cinematic entrance (dopamine) ----
PC.GameScene.prototype.spawnBoss = function () {
  this.bossSpawned = true;
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  // spawn off the top edge, drifting toward the player
  this.boss = new PC.Boss(this, this.px, this.py - Math.max(W, H) * 0.55);
  // white flash + shake + roar
  var flash = this.uiAttach(this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.7).setDepth(150));
  this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: function () { flash.destroy(); } });
  this.cameras.main.shake(400, 0.01);
  if (PC.audio) PC.audio.roar();
  this.bossBanner(this.boss.name);
};

// shared "<NAME> APPEARS!" card (story bosses raise it from the quest)
PC.GameScene.prototype.bossBanner = function (name) {
  var W = PC.RENDER.W, H = PC.RENDER.H;
  var banner = this.add.text(W / 2, H * 0.32, (name || 'BIG FRANK') + '\nAPPEARS!', {
    fontFamily: 'monospace', fontSize: PC.uiK(20) + 'px', color: '#ff6b6b', fontStyle: 'bold',
    align: 'center', stroke: '#1b1530', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(151).setScale(0.5);
  this.uiAttach(banner);
  this.tweens.add({ targets: banner, scale: 1, duration: 300, ease: 'Back.out' });
  this.tweens.add({ targets: banner, alpha: 0, delay: 1600, duration: 500,
    onComplete: function () { banner.destroy(); } });
};

// weapons/bullets route boss hits here (single damage path stays in Boss)
PC.GameScene.prototype.hitBoss = function (x, y, dmg, dx, dy) {
  var b = this.boss;
  if (!b || b.dead) return false;
  var ddx = b.x - x, ddy = b.y - y;
  if (ddx * ddx + ddy * ddy > (b.r + 8) * (b.r + 8)) return false;
  b.damage(dmg, dx, dy);
  this.fx.burst(x, y, 'fx_spark', 3, 0.16);
  if (this.juice) this.juice.dmgNum(x, y - 10, dmg, this._lastCrit);
  if (PC.audio && this.now >= (this._bossHitSfxCd || 0)) {   // throttled thunk
    this._bossHitSfxCd = this.now + 0.25;
    PC.audio.bossHit();
  }
  return true;
};

// ---- VICTORY: shrink + confetti + slowmo + DISTRICT CLEARED + rescue ----
PC.GameScene.prototype.onBossDefeated = function () {
  if (this.won) return;
  this.won = true;
  this.recordRunStats(true);
  var self = this, W = PC.RENDER.W, H = PC.RENDER.H, b = this.boss;
  if (PC.audio) { PC.audio.stopMusic(); PC.audio.bossDie(); }
  this.cameras.main.shake(500, 0.012);
  // slowmo
  this.time.timeScale = 0.4;

  // Frank shrinks back to a normal hot dog then pops into gold
  b.tele.setVisible(false); b.shadow.setVisible(false);
  this.tweens.add({ targets: b.sprite, scale: 0.35, angle: 360, duration: 900, ease: 'Cubic.in',
    onComplete: function () {
      b.sprite.setVisible(false);
      self.fx.burst(b.x, b.y, 'fx_pop', 4, 0.5);
      // confetti of coins raining toward Danny
      for (var i = 0; i < 24; i++) {
        var a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 60;
        self.pickups.drop(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, 'coin', 5);
      }
    } });

  // banner + cage rescue after a beat (story missions hand the moment
  // to the quest engine instead)
  this.time.delayedCall(1100, function () {
    self.time.timeScale = 1;
    if (self.quest) {
      // a story boss kill is an OBJECTIVE, not the mission: `won` must
      // not stick, or die() no-ops for the whole rescue tail and the
      // player walks it unkillable at negative HP (bot: won at -56)
      self.won = false;
      self.hp = Math.max(1, self.hp);
      self.quest.onBossDown();
      return;
    }
    self._rescueSequence(b.x, b.y);
  }, [], this);
};

PC.GameScene.prototype._rescueSequence = function (bx, by) {
  var self = this, W = PC.RENDER.W, H = PC.RENDER.H;
  // DISTRICT CLEARED banner
  var t1 = this.add.text(W / 2, H * 0.3, 'DISTRICT CLEARED!', {
    fontFamily: 'monospace', fontSize: PC.uiK(20) + 'px', color: '#a8e04a', fontStyle: 'bold',
    stroke: '#1b1530', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(151).setScale(0.4);
  this.uiAttach(t1);
  this.tweens.add({ targets: t1, scale: 1, duration: 350, ease: 'Back.out' });

  // a cage where Frank was; it cracks, The Cook pops out
  var cage = this.add.image(bx, by, 'atlas', 'pickup_cage_1').setScale(1.6).setDepth(11);
  var cook = this.add.image(bx, by - 4, 'atlas', PC.D1_RESCUE.art).setScale(0.8).setDepth(12).setVisible(false);
  if (PC.D1_RESCUE.hero) PC.unlockHero(PC.D1_RESCUE.hero);
  if (PC.audio) PC.audio.chest();
  this.time.delayedCall(500, function () {
    cage.setFrame('pickup_cage_2'); self.cameras.main.shake(120, 0.006);
  });
  this.time.delayedCall(900, function () {
    cage.setFrame('pickup_cage_3');
    cook.setVisible(true).setScale(0.4);
    self.tweens.add({ targets: cook, scale: 0.9, y: cook.y - 10, duration: 400, ease: 'Back.out' });
    self.fx.burst(bx, by - 8, 'fx_levelup', 4, 0.5);
    if (PC.audio) PC.audio.fanfare();
    self.time.delayedCall(200, function () { cage.destroy(); });
    // sparkle ring of coins/gems joy
    for (var i = 0; i < 10; i++) self.fx.burst(bx + (Math.random() - 0.5) * 40, by - 8 + (Math.random() - 0.5) * 30, 'fx_spark', 3, 0.4);
    var t2 = self.add.text(W / 2, H * 0.4, 'TEAMMATE RESCUED!', {
      fontFamily: 'monospace', fontSize: PC.uiK(15) + 'px', color: '#f2c33c', fontStyle: 'bold',
      stroke: '#1b1530', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(151);
    self.uiAttach(t2);
  });
  // to results
  this.time.delayedCall(2800, function () {
    self.scene.start('PC_Results', { time: self.runT, kills: self.kills, level: self.level,
      gold: self.pickups.gold, win: true, rescued: PC.D1_RESCUE.name,
      xp: self.bankedXp || 0, xpTp: self.bankedTp() });
  });
};
