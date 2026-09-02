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
  // v0.75.0 (Mark: "Vic's cage should always be there, with her in it,
  // visible from the start, opened after the rescue"): if this mission
  // rescues someone, the cage stands at that landmark's door from the
  // first frame, captive visible inside, and rescueSequence cracks it.
  this.cageImg = null; this.captiveImg = null;
  for (var ri = 0; ri < mission.objectives.length; ri++) {
    var ro = mission.objectives[ri];
    if (ro.type !== 'rescue') continue;
    var rmk = region.landmark(ro.at);
    if (!rmk) break;
    var rbx = rmk.cx, rby = rmk.y + rmk.h - 40;
    this.cageImg = scene.add.image(rbx, rby, 'atlas', 'pickup_cage_1').setScale(1.4).setDepth(11);
    this.captiveImg = scene.add.image(rbx, rby - 4, 'atlas', 'char_' + (ro.hero || 'victoria') + '_idle')
      .setScale(0.9).setDepth(10).setTint(0x9a9ab8);
    this.cageHero = ro.hero || 'victoria';
    break;
  }
  // objective swarms pull from the REGION's roster, so each map's rings
  // match its creatures (v0.21.0; table-driven since v0.27.0)
  this.ringKinds = ({
    park:   ['apple', 'apple', 'peeler', 'tomato'],
    suburb: ['donut', 'donut', 'chipbit', 'cupcake'],
    junk:   ['zipper', 'zipper', 'sodacan', 'chipbag'],
    goo:    ['blob', 'blob', 'drip', 'eggy'],
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

  // v0.20.0: Vic's tutorial runs once ever, before objective 0.
  // v0.33.0: it's a full-screen PAD TRANSMISSION to the player now
  // (PC.TutorialPad) - icons, five taps - not the six-paragraph radio.
  if (mission.tutorial && PC.storyState && !PC.storyState.tutorialSeen()) {
    PC.storyState.markTutorialSeen();
    if (PC.TutorialPad) {
      new PC.TutorialPad(scene, function () { self.next(); });
    } else {
      this.playScript(mission.tutorial, function () { self.next(); });
    }
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
  if (o.type === 'sequence') {
    var nx2 = this.items[this.seqNext];
    if (nx2) return { x: nx2.x, y: nx2.y };
    return null;
  }
  if (o.type === 'reach') {
    // the FAR SIDE of the landmark, not its middle - the arrow leads
    // the crossing (only 'south' is used so far; add sides as needed)
    var rm = this.region.landmark(o.at);
    if (rm) return this.snapWalk({ x: rm.cx, y: rm.y + rm.h + 40 });
  }
  return this.snapWalk(this.spotOf(this.region.landmark(o.at)));
};

// Pull a target onto ground the player can actually stand on. The
// sewers (v0.43.0) carve tunnels on odd block lines, so a landmark's
// geometric centre-line can land in solid rock - the arrow would then
// point at a wall and the objective could never close. Layouts that
// expose carvedAt get a short outward search; everything else is
// fully walkable and passes straight through.
PC.Quest.prototype.snapWalk = function (p) {
  if (!p) return p;
  var L = this.region && this.region.layout;
  if (!L || !L.carvedAt || L.carvedAt(p.x, p.y)) return p;
  var STEP = 48;
  for (var r = 1; r <= 14; r++) {
    for (var a = 0; a < 16; a++) {
      var th = a * Math.PI / 8;
      var x = p.x + Math.cos(th) * r * STEP;
      var y = p.y + Math.sin(th) * r * STEP;
      if (L.carvedAt(x, y)) return { x: x, y: y };
    }
  }
  return p;
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
    } else if (b.action === 'reveal') {
      self.towerReveal(step);
    } else {
      step();
    }
  }
  step();
};

// THE REVEAL (mission 6): the world dims, a cyan signal arc traces up
// the screen to a distant Adventure Tower silhouette, holds, releases.
// Carlos's dialogue frames it; this is the pure visual beat.
PC.Quest.prototype.towerReveal = function (done) {
  var scene = this.scene;
  var W = PC.RENDER.W, H = PC.RENDER.H;
  var ui = [];
  var dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x0b0818, 0)
    .setDepth(290);
  ui.push(dim);
  scene.uiAttach(dim);
  // the tower silhouette rises at the top of the frame
  var g = scene.add.graphics().setDepth(291).setAlpha(0);
  var tx = W / 2, ty = H * 0.16;
  g.fillStyle(0x1b1530, 1);
  g.fillRect(tx - 26, ty - 40, 52, 90);                 // shaft
  g.fillRect(tx - 38, ty + 30, 76, 20);                 // base flare
  g.fillRect(tx - 14, ty - 62, 28, 26);                 // crown
  g.fillStyle(0x45356e, 1);
  g.fillRect(tx - 22, ty - 36, 6, 82); g.fillRect(tx + 16, ty - 36, 6, 82);
  g.fillStyle(0xb45ce8, 1);                             // the Ray's glow
  g.fillCircle(tx, ty - 66, 9);
  g.fillStyle(0xff9ecb, 1);
  g.fillCircle(tx, ty - 66, 4);
  for (var i = 0; i < 4; i++) {                         // lit windows
    g.fillStyle(0x35d0ff, 0.8);
    g.fillRect(tx - 8, ty - 26 + i * 20, 5, 8); g.fillRect(tx + 4, ty - 26 + i * 20, 5, 8);
  }
  ui.push(g); scene.uiAttach(g);
  // the signal arc, drawn point by point from the bottom to the crown
  var arc = scene.add.graphics().setDepth(292);
  ui.push(arc); scene.uiAttach(arc);
  var t = { v: 0 };
  scene.tweens.add({ targets: dim, fillAlpha: 0.55, duration: 500 });
  scene.tweens.add({ targets: g, alpha: 1, duration: 700, delay: 300 });
  scene.tweens.add({
    targets: t, v: 1, duration: 1600, delay: 700, ease: 'Sine.inOut',
    onUpdate: function () {
      arc.clear();
      var x0 = W / 2 - 10, y0 = H * 0.86;
      var steps = Math.floor(26 * t.v);
      arc.lineStyle(3, 0x35d0ff, 0.9);
      arc.beginPath();
      for (var s = 0; s <= steps; s++) {
        var tt = s / 26;
        var xx = x0 + (tx - x0) * tt + Math.sin(tt * Math.PI) * 60;
        var yy = y0 + ((ty - 66) - y0) * tt;
        if (s === 0) arc.moveTo(xx, yy); else arc.lineTo(xx, yy);
      }
      arc.strokePath();
      if (steps > 0) {
        var ht = steps / 26;
        arc.fillStyle(0xf7f4ef, 1);
        arc.fillCircle(x0 + (tx - x0) * ht + Math.sin(ht * Math.PI) * 60,
                       y0 + ((ty - 66) - y0) * ht, 4);
      }
    },
    onComplete: function () {
      // pulse on arrival, hold a beat, then release
      if (PC.audio && PC.audio.fanfare) PC.audio.fanfare();
      scene.cameras.main.flash(300, 180, 92, 232);
      scene.time.delayedCall(1400, function () {
        ui.forEach(function (o) {
          scene.tweens.add({ targets: o, alpha: 0, duration: 500,
            onComplete: function () { o.destroy(); } });
        });
        scene.time.delayedCall(550, done);
      });
    },
  });
};

// THE CHANT (call-and-response, fires at every rescue)
PC.Quest.prototype.chant = function (done) {
  var self = this, scene = this.scene;
  var W = PC.RENDER.W, H = PC.RENDER.H;
  var lines = [
    { speaker: 'danny', text: 'For peace!' },
    { speaker: 'vic', text: 'For love!' },
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
    // CHECKPOINT PATCH-UP (v0.32.0). Story missions chain 3-5 fights
    // with no leveling and only lucky crate medkits between them, so
    // HP loss compounded across objectives - the campaign bot entered
    // stage 1's boss at 2 HP after surviving everything before it.
    // Finishing a job heals a third of the bar: attrition resets per
    // objective, dying WITHIN one still bites.
    var mh = PC.PLAYER.HP + (scene.stats.bonusHp || 0);
    if (scene.hp < mh) {
      scene.hp = Math.min(mh, scene.hp + Math.round(mh / 3));
      scene.floatText('PATCHED UP!', 0x7dd97b);
      if (scene.fx) scene.fx.burst(scene.px, scene.py - 10, 'fx_spark', 3, 0.3);
      if (PC.audio && PC.audio.heal) PC.audio.heal();
      scene.drawHud();
    }
  }
  // clear any leftover objective visuals (green switches, hold rings)
  for (var iv = 0; iv < this.items.length; iv++) {
    var lv = this.items[iv];
    if (lv.img && lv.img.scene) lv.img.destroy();
    if (lv.glow && lv.glow.scene) lv.glow.destroy();
    if (lv.num && lv.num.scene) lv.num.destroy();
  }
  this.items = [];
  if (this.itemGfx) { this.itemGfx.destroy(); this.itemGfx = null; }
  this.idx++;
  if (this.idx >= this.mission.objectives.length) { this.complete(); return; }
  var o = this.cur();
  this.state = 'travel';
  this.tracked = [];
  this._armed = false;
  if (o.type === 'fetch') this.spawnItems(o);
  if (o.type === 'sequence') this.spawnSwitches(o);
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
      line: it.line, guarded: false, holdT: 0 });
  });
  // v0.37.0 hold-to-take (Mark: "make the valves a moment... keep it
  // simple so there's no room for glitches"): pure timer + distance.
  // Standing near an item fills its ring; walking away PAUSES the
  // timer (never resets - friendly and unbreakable).
  if (o.hold) {
    this.itemGfx = scene.add.graphics().setDepth(7);
  }
};

// ---- ORDERED SWITCHES (v0.37.0, Mark's pick of the labs idea):
// numbered stations flipped in order. Wrong one = harmless buzz +
// reset; the numbers are VISIBLE, so the "puzzle" is just walking
// 1-2-3 while the map pressures you. No physics, no state that can
// desync - a counter and some distance checks. ----
PC.Quest.prototype.spawnSwitches = function (o) {
  var self = this, scene = this.scene;
  this.items = [];
  this.seqNext = 0;
  this._seqLock = false;             // after a wrong touch, back off first
  o.items.forEach(function (it, n) {
    var mk = self.region.landmark(it.at);
    var sp = self.spotOf(mk, 60);
    var x = sp.x + (it.dx || 0), y = sp.y + (it.dy || 0);
    var img = scene.add.image(x, y, 'atlas', o.icon || 'icon_passive_battery')
      .setScale(0.8).setDepth(6);
    var glow = scene.add.image(x, y, 'atlas', 'fx_nova_1')
      .setScale(0.7).setDepth(5).setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(0xf2c33c);
    scene.tweens.add({ targets: glow, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 });
    var num = scene.add.text(x, y - 26, String(n + 1), {
      fontFamily: 'monospace', fontSize: '16px', color: '#f2c33c',
      fontStyle: 'bold', stroke: '#120e24', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(7);
    self.items.push({ x: x, y: y, img: img, glow: glow, num: num,
      taken: false, line: it.line, guarded: false });
  });
};

// spawn a guarding/objective swarm ring around a point
PC.Quest.prototype.ring = function (x, y, n, track) {
  var scene = this.scene, out = [];
  // v0.30.0 ease knob: a tracked ring IS the objective count, so it
  // scales on `clear`; untracked guard swarms scale on `ring`
  var ez = PC.ease ? PC.ease(scene) : null;
  if (ez) n = Math.max(3, Math.round(n * (track ? ez.clear : ez.ring)));
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
      xp: scene.bankedXp || 0, xpTp: scene.bankedTp ? scene.bankedTp() : 0,
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
  // THE CONFRONTATION owns the roof (v0.45.0). While it runs, objective
  // logic holds - otherwise a surge ring or a spawn wave would erupt in
  // the middle of the cutscene. Its dialogue still flows: it plays
  // through this same box, which updated above.
  if (scene.confront && scene.confront.armed()) return;
  var px = scene.px, py = scene.py;
  var t = this.targetXY();

  if (o.type === 'arrive') {
    // ARRIVE (v0.45.0): reaching the place is the whole objective. No
    // guard swarm, no surge - used where a cutscene owns what happens
    // next (the Tower roof) and a spawned wave would trample it.
    var am = this.region.landmark(o.at);
    if (am && px > am.x && px < am.x + am.w && py > am.y && py < am.y + am.h) {
      this.finishObjective(o);
    }
  } else if (o.type === 'clear') {
    if (this.state === 'travel' && t) {
      var dx = t.x - px, dy = t.y - py;
      if (dx * dx + dy * dy < 220 * 220) {
        this.state = 'active';
        var sp = this.spotOf(this.region.landmark(o.at), 80);
        this.tracked = this.ring(sp.x, sp.y, o.count, true);
        // the ease knob can spawn fewer than o.count - the counter must
        // read off what ACTUALLY spawned or it never reaches its total
        this.clearTotal = this.tracked.length;
        if (PC.audio) PC.audio.telegraph();
      }
    } else if (this.state === 'active' && this.tracked.length === 0) {
      this.finishObjective(o);
    }
  } else if (o.type === 'fetch') {
    if (this.itemGfx) this.itemGfx.clear();
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (it.taken) continue;
      var ddx = it.x - px, ddy = it.y - py;
      var d2 = ddx * ddx + ddy * ddy;
      if (!it.guarded && d2 < 300 * 300) {
        it.guarded = true;
        this.ring(it.x, it.y, 7, false);        // guard swarm (untracked)
      }
      if (o.hold) {
        // the valve moment (v0.37.0): stand close and crank; walking
        // away PAUSES the ring, never resets it
        var near = d2 < 44 * 44;
        if (near) {
          it.holdT += dt;
          this._holdTick = (this._holdTick || 0) + dt;
          if (this._holdTick > 0.45) {
            this._holdTick = 0;
            if (PC.audio) PC.audio.ui();
          }
        }
        var frac = Math.min(1, (it.holdT || 0) / o.hold);
        if (frac > 0 && frac < 1) {
          this.itemGfx.lineStyle(5, 0x2c3b38, 0.9);
          this.itemGfx.strokeCircle(it.x, it.y, 24);
          this.itemGfx.lineStyle(5, near ? 0xa8e04a : 0xf2c33c, 1);
          this.itemGfx.beginPath();
          this.itemGfx.arc(it.x, it.y, 24, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
          this.itemGfx.strokePath();
        }
        if ((it.holdT || 0) >= o.hold) {
          it.taken = true;
          it.img.destroy(); it.glow.destroy();
          if (PC.audio) PC.audio.chest();
          scene.floatText(o.itemName + '!', 0x35d0ff);
          if (it.line) this.playScript([{ say: it.line }], null);
        }
      } else if (d2 < 26 * 26) {
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
  } else if (o.type === 'sequence') {
    // ORDERED SWITCHES: flip 1-2-3 by walking to them; a wrong switch
    // buzzes and resets, and nothing re-triggers until you step back.
    // A counter plus distance checks - no state that can wedge.
    var anyNear = false;
    for (var sq = 0; sq < this.items.length; sq++) {
      var sw = this.items[sq];
      var sdx2 = sw.x - px, sdy2 = sw.y - py;
      var sd2 = sdx2 * sdx2 + sdy2 * sdy2;
      if (sd2 < 70 * 70) anyNear = true;
      if (this._seqLock || sw.taken || sd2 >= 34 * 34) continue;
      if (sq === this.seqNext) {
        sw.taken = true;
        this.seqNext++;
        sw.img.setTint(0x7dd97b);
        sw.glow.setTint(0x7dd97b);
        sw.num.setColor('#a8e04a');
        if (PC.audio) PC.audio.chest();
        scene.floatText('POWER ' + this.seqNext + '/' + this.items.length + '!', 0xa8e04a);
        if (sw.line) this.playScript([{ say: sw.line }], null);
        if (!sw.guarded) { sw.guarded = true; this.ring(sw.x, sw.y, 6, false); }
      } else {
        this._seqLock = true;
        this.seqNext = 0;
        for (var rs = 0; rs < this.items.length; rs++) {
          var rw = this.items[rs];
          rw.taken = false;
          rw.img.clearTint(); rw.glow.setTint(0xf2c33c);
          rw.num.setColor('#f2c33c');
        }
        if (PC.audio) PC.audio.hurt();
        scene.floatText('WRONG ORDER - START OVER!', 0xff6b6b);
      }
    }
    if (this._seqLock && !anyNear) this._seqLock = false;
    if (this.items.length && this.seqNext >= this.items.length) this.finishObjective(o);
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
      // waves were a flat 4.5s / 8 enemies on top of ambient spawns -
      // far too hot for a base kit; slower cadence, eased size
      if (this._waveAcc > 7) {
        this._waveAcc = 0;
        // don't pile waves onto an already-lost crowd: a player pushed
        // out of the zone pauses the timer but used to keep RECEIVING
        // waves - the crowd only ever grew and re-entry became
        // impossible (campaign bot survived 400s+ at two defends
        // without ever finishing them)
        if (scene.enemies.liveCount < 45) this.ring(zone.x, zone.y, 6, false);
      }
      if (this.defendT >= o.secs) {
        // v0.33.0 (Mark: "abilities need to be EARNED, not just given
        // ... unless you beat a boss or you collect resources"): the
        // chest is the REWARD for completing the hold, not a gift for
        // showing up. Boss chests likewise moved back to kill-only.
        if (scene.dropBossPower && !scene.bossDrop) {
          scene.dropBossPower(zone.x + 40, zone.y - 20);
        }
        this.finishObjective(o);
      }
    }
  } else if (o.type === 'reach') {
    // v0.34.0 (spec B3 "survive the sludge surge across the Catwalk
    // Maze - reach the far side"): a pressure crossing. Stepping onto
    // the landmark arms the surge; goo boils up around the player
    // every few seconds until they make the far-side exit. The timer
    // is the crowd - stand still and it swallows you.
    var mk3 = this.region.landmark(o.at);
    if (this.state === 'travel' && mk3 &&
        px > mk3.x && px < mk3.x + mk3.w && py > mk3.y && py < mk3.y + mk3.h) {
      this.state = 'active';
      this._surgeAcc = 3.5;                 // first boil comes fast
      if (PC.audio) PC.audio.telegraph();
      scene.floatText('THE SURGE IS COMING!', 0x8fb03f);
    }
    if (this.state === 'active') {
      this._surgeAcc += dt;
      if (this._surgeAcc > 5) {
        this._surgeAcc = 0;
        if (scene.enemies.liveCount < 60) this.ring(px, py, 8, false);
      }
      if (t) {
        var sdx = t.x - px, sdy = t.y - py;
        if (sdx * sdx + sdy * sdy < 90 * 90) this.finishObjective(o);
      }
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
  // the cage has stood here since mission start (constructor); crack it
  var cage = this.cageImg || scene.add.image(bx, by, 'atlas', 'pickup_cage_1').setScale(1.4).setDepth(11);
  var hero = scene.add.image(bx, by - 4, 'atlas', 'char_' + (o.hero || 'victoria') + '_idle')
    .setScale(0.9).setDepth(12).setVisible(false);
  if (this.captiveImg) { this.captiveImg.destroy(); this.captiveImg = null; }
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
    var tot = this.clearTotal || o.count;
    label += '  ' + (tot - this.tracked.length) + '/' + tot;
  } else if (o.type === 'fetch') {
    var got = 0;
    for (var i = 0; i < this.items.length; i++) if (this.items[i].taken) got++;
    label += '  ' + got + '/' + this.items.length;
  } else if (o.type === 'sequence') {
    label += '  ' + this.seqNext + '/' + this.items.length;
  } else if (o.type === 'defend' && this.state === 'active') {
    label += '  ' + Math.min(o.secs, Math.floor(this.defendT)) + '/' + o.secs + 's';
  }
  this.bannerTxt.setText(label).setVisible(true);
  // v0.31.0 (Mark: "the top weapon blocks and quest title are
  // overlapping"): the banner centres in the space RIGHT of the HUD
  // column instead of the whole screen, so it can never sit on the tray
  var hudR = this.scene.hudRight || 0;
  var bcx = Math.max((hudR + W) / 2, W / 2);
  PC.ui.fit(this.bannerTxt, W - hudR - PC.uiK(26));
  this.bannerTxt.setX(bcx);
  // R4: MEASURE the panel from the text. These were hardcoded (y 27,
  // h 15) and stopped matching the moment the type scale moved with the
  // zoom in v0.27.2 - the text hung below its own bar (Mark: "CLEAR
  // CITY HALL PLAZA is not centered on its bar").
  var padX = PC.uiK(10), padY = PC.uiK(3);
  var bx = bcx - this.bannerTxt.width / 2 - padX;
  var by = this.bannerTxt.y - padY;
  var bh = this.bannerTxt.height + padY * 2;
  PC.labPanel(g, bx, by, this.bannerTxt.width + padX * 2, bh,
    { base: 0x1c1733, edge: 0x45356e, radius: 3 });
  // defend progress bar, hung off the bottom of that panel
  if (o.type === 'defend' && this.state === 'active') {
    var bw = PC.uiK(90), byy = by + bh + PC.uiK(3);
    g.fillStyle(0x120e24, 0.9).fillRect(W / 2 - bw / 2, byy, bw, PC.uiK(5));
    g.fillStyle(0xf2c33c, 1).fillRect(W / 2 - bw / 2, byy,
      bw * Math.min(1, this.defendT / o.secs), PC.uiK(5));
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
