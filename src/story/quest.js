// quest.js - STORY-3: the mission engine (docs/STORY_BUILD_PLAN.md).
// Runs INSIDE GameScene when a region mission is active: objective chain
// (clear / fetch / defend / boss / rescue), edge-of-screen compass, the
// objective banner, in-game dialogue (world pauses), TP awards, and THE
// CHANT. Beat scripts come verbatim from data/story/mission1.js.
window.PC = window.PC || {};

PC.Quest = function (scene, region, mission) {
  var W = PC.RENDER.W;
  this.scene = scene;
  this.region = region;
  this.mission = mission;
  this.idx = -1;
  this.state = 'travel';          // travel -> active -> (script gates)
  this.tracked = [];              // spawned objective enemies (clear beats)
  this.items = [];                // fetch item sprites
  this.defendT = 0;
  this._waveAcc = 0;
  this.tpEarned = 0;
  this.done = false;
  // objective swarms pull from the REGION's roster, so each map's rings
  // match its creatures (v0.21.0; table-driven since v0.27.0)
  this.ringKinds = ({
    park:   ['apple', 'apple', 'peeler', 'tomato'],
    suburb: ['donut', 'donut', 'chipbit', 'cupcake'],
  })[region.def.spawnSet] || ['fry', 'fry', 'popcorn', 'hotdog'];

  // dialogue box pinned to the camera (world-space ui container)
  this.box = new PC.DialogueBox(scene);
  [this.box.gfx, this.box.portrait, this.box.nameTxt, this.box.bodyTxt,
   this.box.moreTxt].forEach(function (o) { scene.uiAttach(o); });

  // objective banner (top, under the HUD)
  this.bannerGfx = scene.add.graphics().setDepth(101);
  this.bannerTxt = scene.add.text(W / 2, PC.uiK(30), '', {
    fontFamily: 'monospace', fontSize: PC.uiK(9) + 'px', color: '#f7f4ef', fontStyle: 'bold',
  }).setOrigin(0.5, 0).setDepth(102);
  scene.uiAttach(this.bannerGfx);
  scene.uiAttach(this.bannerTxt);

  // compass arrow (edge of screen toward the target)
  this.compass = scene.add.graphics().setDepth(102);
  scene.uiAttach(this.compass);

  // tap-through for in-game dialogue
  var self = this;
  scene.input.on('pointerdown', function () {
    if (self.box.active) self.box.tap();
  });

  // v0.20.0: Vic's radio tutorial runs once ever, before objective 0
  if (mission.tutorial && PC.storyState && !PC.storyState.tutorialSeen()) {
    PC.storyState.markTutorialSeen();
    this.playScript(mission.tutorial, function () { self.next(); });
  } else {
    this.next();                  // arm objective 0
  }
};

// v0.24.0: where an objective actually happens AT a landmark. Solid
// lots put the action on the apron outside their south face; OPEN lots
// (plazas, ponds, the park gates) put it in the middle, because there
// is no building to stand outside of. Several beats used to hardcode
// "+ h/2 + 80" and quietly landed outside open landmarks entirely.
PC.Quest.prototype.spotOf = function (mk, pad) {
  if (!mk) return null;
  // water lots (the Big Pond) are unwalkable - the action happens on the
  // painted dock at the south shore instead of in the middle of the lake
  if (mk.water) return { x: mk.cx, y: mk.y + mk.h - 14 };
  return { x: mk.cx, y: mk.open ? mk.cy : mk.cy + mk.h / 2 + (pad || 40) };
};

// ---- helpers ----
PC.Quest.prototype.cur = function () { return this.mission.objectives[this.idx]; };
PC.Quest.prototype.targetXY = function () {
  var o = this.cur();
  if (!o) return null;
  if (o.type === 'fetch') {
    for (var i = 0; i < this.items.length; i++) {
      if (!this.items[i].taken) {
        return { x: this.items[i].x, y: this.items[i].y };
      }
    }
    return null;
  }
  return this.spotOf(this.region.landmark(o.at));
};

// play a beat list as in-game dialogue (world paused via storyPause)
PC.Quest.prototype.playScript = function (beats, onDone) {
  var self = this, scene = this.scene;
  if (!beats || !beats.length) { if (onDone) onDone(); return; }
  scene.storyPause = true;
  var i = 0;
  function step() {
    if (i >= beats.length) {
      scene.storyPause = false;
      if (onDone) onDone();
      return;
    }
    var b = beats[i++];
    if (b.say) {
      self.box.show(b.say, step);
    } else if (b.action === 'chant') {
      self.chant(step);
    } else {
      step();
    }
  }
  step();
};

// THE CHANT (call-and-response, fires at every rescue)
PC.Quest.prototype.chant = function (done) {
  var self = this, scene = this.scene;
  var W = PC.RENDER.W, H = PC.RENDER.H;
  var lines = [
    { speaker: 'danny', text: 'For peace—!' },
    { speaker: 'vic', text: 'For love—!' },
    { speaker: 'danny', text: 'VICTORY!' },
  ];
  var i = 0;
  function step() {
    if (i >= lines.length) {
      // confetti + fanfare over the world
      if (PC.audio && PC.audio.fanfare) PC.audio.fanfare();
      var COLORS = [0xa8e04a, 0xf2c33c, 0x35d0ff, 0xff6b6b, 0xff9ecb];
      for (var ci = 0; ci < 36; ci++) {
        var wv = scene.cameras.main.worldView;
        var cf = scene.add.rectangle(wv.x + Math.random() * W,
          wv.y - 10 - Math.random() * 40, 4, 6,
          COLORS[ci % COLORS.length]).setDepth(250);
        scene.tweens.add({ targets: cf, y: wv.y + H + 20,
          x: cf.x + (Math.random() - 0.5) * 60, angle: 360,
          duration: 1300 + Math.random() * 800,
          onComplete: (function (r) { return function () { r.destroy(); }; })(cf) });
      }
      scene.time.delayedCall(1300, done);
      return;
    }
    self.box.show(lines[i++], step);
  }
  step();
};

// ---- advance to the next objective ----
PC.Quest.prototype.next = function () {
  var self = this, scene = this.scene;
  // award TP for the finished one
  if (this.idx >= 0) {
    this.tpEarned += 10;
    if (PC.meta) PC.meta.bump('tp', 10);
    scene.floatText('+10 TP', 0x35d0ff);
  }
  this.idx++;
  if (this.idx >= this.mission.objectives.length) { this.complete(); return; }
  var o = this.cur();
  this.state = 'travel';
  this.tracked = [];
  this._armed = false;
  if (o.type === 'fetch') this.spawnItems(o);
  this.playScript(o.intro, null);   // intro plays immediately (radio style)
};

PC.Quest.prototype.spawnItems = function (o) {
  var self = this, scene = this.scene;
  this.items = [];
  o.items.forEach(function (it) {
    var mk = self.region.landmark(it.at);
    var sp = self.spotOf(mk, 60);        // water lots -> the dock, etc.
    // it.dx/dy spread multiple items across ONE landmark (mission5: the
    // three kids are all at the School); o.icon reskins the pickup.
    var x = sp.x + (it.dx || 0), y = sp.y + (it.dy || 0);
    var img = scene.add.image(x, y, 'atlas', o.icon || 'icon_passive_battery')
      .setScale(o.icon ? 0.8 : 0.62).setDepth(6);
    scene.tweens.add({ targets: img, y: y - 5, duration: 700, yoyo: true,
      repeat: -1, ease: 'Sine.inOut' });
    var glow = scene.add.image(x, y, 'atlas', 'fx_nova_1')
      .setScale(0.7).setDepth(5).setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(0x35d0ff);
    scene.tweens.add({ targets: glow, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 });
    self.items.push({ x: x, y: y, img: img, glow: glow, taken: false,
      line: it.line, guarded: false });
  });
};

// spawn a guarding/objective swarm ring around a point
PC.Quest.prototype.ring = function (x, y, n, track) {
  var scene = this.scene, out = [];
  for (var i = 0; i < n; i++) {
    var a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
    var r = 170 + Math.random() * 90;
    var d = PC.ENEMY_DEFS[this.ringKinds[i % this.ringKinds.length]];
    var e = scene.enemies.spawn(x + Math.cos(a) * r, y + Math.sin(a) * r, {
      key: d.key, still: d.still, size: d.size, xp: d.xp, kbMult: d.kbMult,
      spd: d.spd, hp: d.hp, dmg: d.dmg,
    });
    if (e && track) { e._quest = true; out.push(e); }
  }
  return out;
};

PC.Quest.prototype.notifyKill = function (e) {
  if (!e._quest) return;
  e._quest = false;
  for (var i = 0; i < this.tracked.length; i++) {
    if (this.tracked[i] === e) this.tracked.splice(i, 1);
  }
};

// mission complete: payout, unlock, hand-off
PC.Quest.prototype.complete = function () {
  var self = this, scene = this.scene;
  this.done = true;
  var first = PC.meta && !PC.meta.stat('clear_' + this.mission.id);
  var bonus = 50 + (first ? 25 : 0);
  this.tpEarned += bonus;
  if (PC.meta) {
    PC.meta.bump('tp', bonus);
    PC.meta.setFlag('clear_' + this.mission.id);
    PC.meta.setFlag('wonD1');
  }
  // the mission's rescue beat names who joins the roster
  var rescueHero = null;
  for (var ri = 0; ri < this.mission.objectives.length; ri++) {
    if (this.mission.objectives[ri].type === 'rescue') {
      rescueHero = this.mission.objectives[ri].hero;
    }
  }
  if (rescueHero) PC.unlockHero(rescueHero);
  // linear spine (v0.18): bank the campaign clear so the mission map
  // reveals + unlocks the next stage
  if (PC.storyState) PC.storyState.markCleared(this.mission.id);
  var chainEntry = PC.STORY.chainById && PC.STORY.chainById(this.mission.id);
  scene.recordRunStats(true);

  // v0.19: the city STAYS OPEN between beats (Mark: linear flow, no
  // menu bounce). Hand off to free roam when the next beat is playable;
  // the results screen is now only for death / campaign end / a next
  // beat whose map isn't built yet.
  var next = PC.STORY.nextInChain ? PC.STORY.nextInChain(this.mission.id) : null;
  if (next && PC.STORY.beatBuilt(next)) {
    scene.time.delayedCall(700, function () {
      scene.enterFreeRoam(next, { tp: self.tpEarned, gold: scene.pickups.gold,
        kills: scene.kills });
    });
    return;
  }
  scene.won = true;
  scene.time.delayedCall(600, function () {
    scene.scene.start('PC_Results', {
      time: scene.runT, kills: scene.kills, level: scene.level,
      gold: scene.pickups.gold, win: true, story: true,
      tp: self.tpEarned, hero: scene.hero.id,
      rescued: (chainEntry && chainEntry.rescued) || 'A TEAMMATE',
      rescuedArt: rescueHero ? 'char_' + rescueHero + '_idle' : null,
    });
  });
};

// ---- per-frame ----
PC.Quest.prototype.update = function (dt) {
  var scene = this.scene, o = this.cur();
  this.drawHudBits();
  if (!o || this.done || this.box.active) {
    this.box.update(dt);
    return;
  }
  this.box.update(dt);
  var px = scene.px, py = scene.py;
  var t = this.targetXY();

  if (o.type === 'clear') {
    if (this.state === 'travel' && t) {
      var dx = t.x - px, dy = t.y - py;
      if (dx * dx + dy * dy < 220 * 220) {
        this.state = 'active';
        var sp = this.spotOf(this.region.landmark(o.at), 80);
        this.tracked = this.ring(sp.x, sp.y, o.count, true);
        if (PC.audio) PC.audio.telegraph();
      }
    } else if (this.state === 'active' && this.tracked.length === 0) {
      this.finishObjective(o);
    }
  } else if (o.type === 'fetch') {
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (it.taken) continue;
      var ddx = it.x - px, ddy = it.y - py;
      var d2 = ddx * ddx + ddy * ddy;
      if (!it.guarded && d2 < 300 * 300) {
        it.guarded = true;
        this.ring(it.x, it.y, 7, false);        // guard swarm (untracked)
      }
      if (d2 < 26 * 26) {
        it.taken = true;
        it.img.destroy(); it.glow.destroy();
        if (PC.audio) PC.audio.chest();
        scene.floatText(o.itemName + '!', 0x35d0ff);
        if (it.line) this.playScript([{ say: it.line }], null);
      }
    }
    var left = 0;
    for (var j = 0; j < this.items.length; j++) if (!this.items[j].taken) left++;
    if (left === 0) this.finishObjective(o);
  } else if (o.type === 'defend') {
    var mk2 = this.region.landmark(o.at);
    var zone = this.spotOf(mk2, 60);
    var inZone = false;
    if (zone) {
      var zx = zone.x - px, zy = zone.y - py;
      inZone = zx * zx + zy * zy < o.radius * o.radius;
    }
    if (this.state === 'travel' && inZone) {
      this.state = 'active';
      if (PC.audio) PC.audio.telegraph();
    }
    if (this.state === 'active') {
      if (inZone) this.defendT += dt;
      this._waveAcc += dt;
      if (this._waveAcc > 4.5) {
        this._waveAcc = 0;
        this.ring(zone.x, zone.y, 8, false);
      }
      if (this.defendT >= o.secs) this.finishObjective(o);
    }
  } else if (o.type === 'boss') {
    if (this.state === 'travel' && t) {
      var bdx = t.x - px, bdy = t.y - py;
      if (bdx * bdx + bdy * bdy < 300 * 300 && !scene.bossSpawned) {
        this.state = 'active';
        var bs = this.spotOf(this.region.landmark(o.at), 140);
        scene.bossSpawned = true;
        scene.boss = new PC.Boss(scene, bs.x, bs.y, o.boss);
        scene.bossBanner(scene.boss.name);
        if (PC.audio && PC.audio.roar) PC.audio.roar();
        this.playScript(o.intro, null);
      }
    }
    // completion signalled by scene.onBossDefeated -> quest.onBossDown()
  } else if (o.type === 'rescue') {
    if (this.state === 'travel' && t) {
      var rdx = t.x - px, rdy = t.y - py;
      if (rdx * rdx + rdy * rdy < 90 * 90) {
        this.state = 'active';
        this.rescueSequence(o);
      }
    }
  }
};

PC.Quest.prototype.finishObjective = function (o) {
  var self = this;
  this.state = 'done';
  this.playScript(o.done, function () { self.next(); });
};

PC.Quest.prototype.onBossDown = function () {
  var o = this.cur();
  if (o && o.type === 'boss') this.finishObjective(o);
};

// cage-crack rescue at the landmark door, then the script + chant
PC.Quest.prototype.rescueSequence = function (o) {
  var self = this, scene = this.scene;
  var mk = this.region.landmark(o.at);
  var bx = mk.cx, by = mk.y + mk.h - 40;
  scene.storyPause = true;
  var cage = scene.add.image(bx, by, 'atlas', 'pickup_cage_1').setScale(1.4).setDepth(11);
  var hero = scene.add.image(bx, by - 4, 'atlas', 'char_' + (o.hero || 'victoria') + '_idle')
    .setScale(0.9).setDepth(12).setVisible(false);
  if (PC.audio) PC.audio.chest();
  scene.time.delayedCall(500, function () {
    cage.setFrame('pickup_cage_2'); scene.cameras.main.shake(120, 0.006);
  });
  scene.time.delayedCall(1000, function () {
    cage.setFrame('pickup_cage_3'); scene.cameras.main.shake(160, 0.008);
    hero.setVisible(true);
    scene.fx.burst(bx, by - 8, 'fx_levelup', 4, 0.5);
  });
  scene.time.delayedCall(1500, function () {
    scene.storyPause = false;
    self.playScript(o.script, function () { self.next(); });
  });
};

// ---- HUD: banner + compass ----
PC.Quest.prototype.drawHudBits = function () {
  var W = PC.RENDER.W, H = PC.RENDER.H;
  var o = this.cur(), g = this.bannerGfx;
  g.clear();
  this.compass.clear();
  if (!o || this.done) { this.bannerTxt.setVisible(false); return; }
  // banner text with live progress
  var label = o.banner || '';
  if (o.type === 'clear' && this.state === 'active') {
    label += '  ' + (o.count - this.tracked.length) + '/' + o.count;
  } else if (o.type === 'fetch') {
    var got = 0;
    for (var i = 0; i < this.items.length; i++) if (this.items[i].taken) got++;
    label += '  ' + got + '/' + this.items.length;
  } else if (o.type === 'defend' && this.state === 'active') {
    label += '  ' + Math.min(o.secs, Math.floor(this.defendT)) + '/' + o.secs + 's';
  }
  this.bannerTxt.setText(label).setVisible(true);
  PC.labPanel(g, W / 2 - this.bannerTxt.width / 2 - 10, 27,
    this.bannerTxt.width + 20, 15, { base: 0x1c1733, edge: 0x45356e, radius: 3 });
  // defend progress bar
  if (o.type === 'defend' && this.state === 'active') {
    var bw = 90;
    g.fillStyle(0x120e24, 0.9).fillRect(W / 2 - bw / 2, 45, bw, 5);
    g.fillStyle(0xf2c33c, 1).fillRect(W / 2 - bw / 2, 45,
      bw * Math.min(1, this.defendT / o.secs), 5);
  }
  // compass: edge arrow toward the target when it's off-screen
  var t = this.targetXY();
  if (!t) return;
  var scene = this.scene;
  var wv = scene.cameras.main.worldView;
  var sx = t.x - wv.x, sy = t.y - wv.y;      // target in screen space
  var onScreen = sx > 20 && sx < W - 20 && sy > 40 && sy < H - 40;
  var c = this.compass;
  if (onScreen) {
    // hovering marker over the target itself
    var bob = Math.sin(scene.now * 5) * 3;
    c.fillStyle(0xf2c33c, 0.95);
    c.fillTriangle(sx - 7, sy - 26 + bob, sx + 7, sy - 26 + bob, sx, sy - 14 + bob);
    c.fillStyle(0xfff6e0, 0.7);
    c.fillTriangle(sx - 4, sy - 25 + bob, sx + 4, sy - 25 + bob, sx, sy - 18 + bob);
    return;
  }
  var cxm = W / 2, cym = H / 2;
  var ang = Math.atan2(sy - cym, sx - cxm);
  var edgeR = Math.min(W, H) / 2 - 34;
  var ax = cxm + Math.cos(ang) * edgeR;
  var ay = cym + Math.sin(ang) * edgeR;
  var pulse = 0.8 + 0.2 * Math.sin(scene.now * 8);
  c.fillStyle(0x120e24, 0.7);
  c.fillCircle(ax, ay, 13);
  c.lineStyle(1, 0xf2c33c, 0.9).strokeCircle(ax, ay, 13);
  c.fillStyle(0xf2c33c, pulse);
  var a1 = ang, a2 = ang + 2.6, a3 = ang - 2.6;
  c.fillTriangle(
    ax + Math.cos(a1) * 10, ay + Math.sin(a1) * 10,
    ax + Math.cos(a2) * 6, ay + Math.sin(a2) * 6,
    ax + Math.cos(a3) * 6, ay + Math.sin(a3) * 6);
};
