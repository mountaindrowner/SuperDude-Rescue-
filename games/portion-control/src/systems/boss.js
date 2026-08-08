// boss.js - THE DISTRICT BOSS CHASSIS (v0.61.0).
// One shared chassis - spawn, the single damage path, the bar, contact,
// art flipbook, pose amplification, defeat flow - and ONE SCRIPT PER
// BOSS in boss_scripts.js, because five bosses running the same fight
// with different sprites is the boss doc's sponge complaint verbatim.
// damage() is the ONLY thing that changes boss HP and the ONLY caller
// of bossDefeated() (Perf Bible 10 - win can never miss).
window.PC = window.PC || {};

PC.BOSS_D1 = { key: 'boss_d1_frank', size: 128, hp: 3000, spd: 100, contact: 20, name: 'BIG FRANK' };

// v0.21.0: bosses are now a table keyed by id; a mission's boss beat
// names one (`boss: 'broccolisk'`), and everything else - the fight
// script, the health bar, the defeat flow - is shared.
PC.BOSSES = {
  frank: PC.BOSS_D1,
  // `anims` maps a STATE to an extra frame set (v0.22.0). Missing sets
  // fall back to the walk flipbook, so a boss can ship with as much or
  // as little animation as its art batch has produced.
  // v0.63.0: each boss's SPECIAL states map onto its art sets (rear =
  // the wind-up/tell frames, lunge = the strike frames), so every boss
  // has a real ability animation on top of the 4-frame walk flipbook.
  broccolisk: { key: 'boss_d2_broc', size: 128, hp: 3400, spd: 108,
                contact: 20, name: 'THE BROCCOLISK',
                anims: { fan:   { set: 'rear', frames: 2, fps: 5 },
                         erupt: { set: 'lunge', frames: 2, fps: 10 } } },
  cakeColossus: { key: 'boss_d3_cake', size: 128, hp: 4200, spd: 94,
                contact: 24, name: 'LAYER CAKE COLOSSUS',
                anims: { shed:  { set: 'rear', frames: 2, fps: 6 } } },
  // v0.63.0 remake: spd 78 -> 46. It WALKS, slowly, always - the
  // threat is the junk-food floods and the candy corn rockets, not the
  // chase (Mark: "a walking vending machine who goes slowly").
  // v0.69.0: vend + gloop art moved to the clean 64-grid (128px canvas,
  // real animate-with-text walk cycles); baseS 1.29 holds the on-screen
  // size the 144 canvas used to give. Hitboxes (size) unchanged.
  vendingBehemoth: { key: 'boss_d4_vending', size: 144, baseS: 1.29, hp: 5000, spd: 46,
                contact: 26, name: 'VENDING BEHEMOTH',
                anims: { restock:  { set: 'rear', frames: 2, fps: 6 },
                         launch:   { set: 'lunge', frames: 2, fps: 8 },
                         overheat: { set: 'rear', frames: 2, fps: 3 } } },
  gloopKing: { key: 'boss_d5_gloop', size: 144, baseS: 1.29, hp: 5600, spd: 70,
                contact: 26, name: 'THE GLOOP KING',
                anims: { ringTell: { set: 'rear', frames: 2, fps: 5 },
                         spiral:   { set: 'rear', frames: 2, fps: 6 },
                         burst:    { set: 'rear', frames: 2, fps: 8 },
                         erupt:    { set: 'lunge', frames: 2, fps: 10 } } },
};

PC.Boss = function (scene, x, y, id) {
  this.scene = scene;
  var d = PC.BOSSES[id] || PC.BOSS_D1;
  this.x = x; this.y = y;
  this.hp = d.hp; this.maxHp = d.hp;
  this.spd = d.spd; this.contact = d.contact; this.r = d.size / 2 - 18;
  // story tier fights with a near-base kit - same boss, kid numbers
  var ez = PC.ease ? PC.ease(scene) : null;
  if (ez && ez.bossHp && ez.bossHp !== 1) {
    this.hp = this.maxHp = Math.round(d.hp * ez.bossHp);
    this.contact = Math.round(d.contact * ez.bossContact);
  }
  this.name = d.name;
  this.state = 'intro'; this.stateT = 0;
  this.animT = 0;
  this.flashUntil = 0;
  this.dead = false; this.defeated = false;
  // ---- the per-boss fight script (v0.61.0) ----
  this.script = (PC.BossScripts && (PC.BossScripts[id] || PC.BossScripts.frank)) || null;
  this.vuln = 0;                   // punish window: >0 = double damage, cyan ring
  this.vulnAfter = 0;              // window queued by a move in flight
  this.guard = 1;                  // burrow/dive damage multiplier (never 0)
  this.noContact = false;          // underground things don't body-block
  this.baseS = d.baseS || 1.15;    // pose base scale (per-def; Cake's script shrinks it)
  this.shots = [];                 // pooled hand-collided projectiles
  this.gfx = scene.add.graphics().setDepth(6);   // tells, mounds, rings

  this.artKey = d.key;             // per-boss art (the walk anim reads this)
  this.anims = d.anims || null;    // optional per-state frame sets
  this.sprite = scene.add.image(x, y, 'atlas', d.key + '_walk_1').setDepth(11).setScale(1.15);
  this.shadow = scene.add.image(x, y + 26, 'atlas', 'fx_pop_1')
    .setTint(0x0a0812).setAlpha(0.35).setScale(3.2, 1.4).setDepth(4);
  this.tele = scene.add.graphics().setDepth(6).setVisible(false);   // charge telegraph

  // themed puddle hazards (pooled; tint + kind set per splat)
  this.puddles = [];
  for (var i = 0; i < 14; i++) {
    this.puddles.push({ active: false, x: 0, y: 0, r: 0, life: 0, tick: 0, kind: 'dmg',
      img: scene.add.image(0, 0, 'atlas', 'fx_puddle_1').setTint(0xd93a3a).setAlpha(0.75).setDepth(3).setVisible(false) });
  }
  this.walkT = 0;                  // drives the waddle (v0.65.0)
  this.prevX = x; this.prevY = y;
  this.sayTxt = null;              // one callout at a time
  if (this.script && this.script.init) this.script.init(this);
};

// THE CALLOUT (v0.65.0, Mark: "each boss announces what they're
// attacking with, to take away any of the mystery"). A short shout
// above the head when a move starts. One at a time - a new shout
// replaces the old. All strings live in the scripts and were reviewed
// for kid-appropriateness (VBS audience): food puns only, no violence.
PC.Boss.prototype.say = function (text, tint) {
  var scene = this.scene;
  if (this.sayTxt) { this.sayTxt.destroy(); this.sayTxt = null; }
  var t = scene.add.text(this.x, this.y - this.r - 34, text, {
    fontFamily: 'monospace', fontSize: PC.uiK(11) + 'px',
    color: '#' + ('00000' + (tint || 0xffd977).toString(16)).slice(-6),
    fontStyle: 'bold', stroke: '#0b0818', strokeThickness: 4,
  }).setOrigin(0.5).setDepth(103);
  this.sayTxt = t;
  var self = this;
  scene.tweens.add({ targets: t, y: t.y - 14, duration: 1400, ease: 'Cubic.out' });
  scene.tweens.add({ targets: t, alpha: 0, delay: 950, duration: 450,
    onComplete: function () { t.destroy(); if (self.sayTxt === t) self.sayTxt = null; } });
};

PC.Boss.prototype.enraged = function () { return this.hp < this.maxHp * 0.25; };

// THE single HP path (Perf Bible 10)
PC.Boss.prototype.damage = function (amount, dirx, diry) {
  if (this.dead) return;
  // guard < 1 while burrowed/dived (shots plink into the dirt - never a
  // full immunity, doc 2.3.9); vuln doubles it in the punish window
  this.hp -= amount * this.guard * (this.vuln > 0 ? 2 : 1);
  this.flashUntil = this.scene.now + 0.06;
  this.sprite.setTintFill(0xffffff);
  if (this.hp <= 0) { this.hp = 0; this.die(); }
};

// splat(n, tint, kind): lob n blobs near the player. kind 'dmg' ticks
// damage (Frank's ketchup); kind 'slow' drags your feet (Cake frosting,
// Gloop slick) - pressure without chip, doc 2.3.4. The warning shadow
// is the reserved magenta; the puddle itself keeps its themed colour.
PC.Boss.prototype.splat = function (n, tint, kind) {
  var scene = this.scene, self = this;
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, r = Math.random() * 70;
    var tx = scene.px + Math.cos(a) * r, ty = scene.py + Math.sin(a) * r;
    // an ARRAY tint means multicoloured: each blob picks its own pastel
    // (v0.65.0, Mark: the red splotches "start looking like blood")
    var bt = Array.isArray(tint) ? tint[Math.floor(Math.random() * tint.length)] : tint;
    (function (px2, py2, tint2) {
      var warn = scene.add.image(px2, py2, 'atlas', 'fx_pop_1')
        .setTint(PC.CHOMP_TELL_COLOR || 0xff3ea5).setAlpha(0.3).setScale(1.6, 0.9).setDepth(3);
      scene.tweens.add({ targets: warn, alpha: 0.55, scaleX: 2, scaleY: 1.1, duration: 500, yoyo: false,
        onComplete: function () {
          warn.destroy();
          self._puddle(px2, py2, tint2, kind);
        } });
    })(tx, ty, bt);
  }
  if (PC.audio) PC.audio.splat();
  // a volley is a commitment: the window opens when the last blob lands
  if (this.vulnAfter) { var va = this.vulnAfter; this.vulnAfter = 0;
    scene.time.delayedCall(600, function () { self.vuln = Math.max(self.vuln, va); }); }
};

PC.Boss.prototype._puddle = function (x, y, tint, kind) {
  for (var i = 0; i < this.puddles.length; i++) {
    var p = this.puddles[i];
    if (p.active) continue;
    p.active = true; p.x = x; p.y = y; p.r = kind === 'slow' ? 44 : 30;
    p.life = kind === 'slow' ? 4.5 : 3; p.tick = 0; p.kind = kind || 'dmg';
    p.seed = Math.random() * 100;
    p.img.setPosition(x, y).setTint(tint || 0xd93a3a)
      .setScale(kind === 'slow' ? 2.4 : 1.8).setAlpha(0.75).setVisible(true);
    this.scene.fx.burst(x, y, 'fx_spark', 3, 0.2);
    return;
  }
};

PC.Boss.prototype.update = function (dt, px, py) {
  if (this.dead) {
    // a boss killed mid-tell must not leave its last mound/ring/lane
    // painted on the deck forever
    this.gfx.clear();
    this.shots.length = 0;
    this.scene.bossSlow = 1;
    this._updatePuddles(dt, px, py);
    return;
  }
  this.animT += dt; this.stateT += dt;
  var scene = this.scene;
  var g = this.gfx;
  // movement-driven walk clock: the waddle only plays when it MOVES
  var mvd = Math.hypot(this.x - this.prevX, this.y - this.prevY);
  this.moving = mvd > 0.4;
  if (this.moving) this.walkT += dt;
  this.prevX = this.x; this.prevY = this.y;
  g.clear();
  scene.bossSlow = 1;                                  // recomputed by puddles

  // flash decay
  if (this.flashUntil && this.scene.now > this.flashUntil) { this.flashUntil = 0; this.sprite.clearTint(); }
  // enrage tint
  if (this.enraged() && !this.flashUntil) this.sprite.setTint(0xffb0b0);

  if (this.vuln > 0) {
    this.vuln -= dt;
    if (PC.BossScripts) PC.BossScripts._drawVuln(this, g);
  }

  // ---- the per-boss fight script ----
  if (this.state === 'intro') {
    if (this.stateT > 1.4) { this.state = 'active'; this.stateT = 0; }
  } else if (this.script) {
    this.script.update(this, dt, px, py);
  }
  if (this.script && PC.BossScripts) PC.BossScripts._stepShots(this, dt, g);

  // frame flipbook + bob. A state with its own art (wind-up, lunge)
  // plays that set; anything else uses the 4-frame walk cycle. The
  // texture check means a half-finished art batch degrades to walking
  // instead of showing the missing-frame box.
  var set = 'walk', frames = 4, fps = 6;
  var a = this.anims && this.anims[this.state];
  if (a && scene.textures.get('atlas').has(this.artKey + '_' + a.set + '_1')) {
    set = a.set; frames = a.frames; fps = a.fps;
  }
  var fr = 1 + (Math.floor(this.animT * fps) % frames);
  this.sprite.setFrame(this.artKey + '_' + set + '_' + fr);
  var hop = this.moving ? -Math.abs(Math.sin(this.walkT * 4)) * 5 : Math.sin(this.animT * 5) * 2;
  this.sprite.setPosition(Math.round(this.x), Math.round(this.y) + Math.round(hop));
  // POSE AMPLIFICATION (v0.22.0). Generated pose art stays close to the
  // reference by design - at 128px on a phone the difference is too
  // subtle to read on its own. So the states also deform in code: the
  // wind-up REARS UP and tilts back, the strike STRETCHES along its
  // heading. Same VS "code-side life" law the hero walk-bob uses.
  var baseS = this.baseS;
  if (this.script && this.script.pose && this.script.pose(this)) {
    // the script drew its own pose (skid wobble, shed shake, overheat)
  } else if (this.state === 'telegraph' || this.state === 'fan' ||
             this.state === 'volleyTell' || this.state === 'ringTell') {
    var w = Math.min(1, this.stateT / 0.55);
    this.sprite.setScale(baseS * (1 + 0.18 * w), baseS * (1 + 0.34 * w));
    this.sprite.setAngle(-9 * w);
  } else if (this.state === 'charge') {
    this.sprite.setScale(baseS * 1.30, baseS * 0.84);
    this.sprite.setAngle((this.cvx < 0 ? 7 : -7) + Math.sin(this.animT * 24) * 3);
  } else if (this.moving) {
    // THE WADDLE (v0.65.0, Mark: "they do move, but there's no walking
    // animation"). The flipbook alone was too subtle to read, so the
    // chassis performs the walk: a step-timed squash-and-stretch with a
    // side-to-side sway, the boss-scale version of the hero walk bob.
    var wob = this.walkT * 8;
    var sq = Math.sin(wob) * 0.045;                  // accent only: the real
    this.sprite.setScale(baseS * (1 - sq * 0.6), baseS * (1 + sq));   // walk
    this.sprite.setAngle(Math.sin(wob * 0.5) * 3.5); // lives in the frames now
  } else {
    this.sprite.setScale(baseS, baseS);
    this.sprite.setAngle(0);
  }
  // face the player (the art is drawn facing left)
  if (this.state !== 'charge') this.sprite.setFlipX(px > this.x);
  this.shadow.setPosition(this.x, this.y + 28);

  // ---- contact damage to the player (respects i-frames) ----
  var cdx = px - this.x, cdy = py - this.y;
  if (!this.noContact &&
      cdx * cdx + cdy * cdy < (this.r + 12) * (this.r + 12) && scene.now > scene.invUntil && !scene.dead) {
    scene.hp -= Math.max(1, this.contact * scene.dmgTakenMult - scene.stats.armor);
    scene.lastHurtT = scene.now;
    scene.invUntil = scene.now + PC.PLAYER.IFRAMES;
    scene.cameras.main.shake(140, 0.008);
    if (PC.audio) PC.audio.hurt();
    scene.drawHud();
    if (scene.hp <= 0) scene.die();
  }

  this._updatePuddles(dt, px, py);
  this._drawBar();
};

PC.Boss.prototype._updatePuddles = function (dt, px, py) {
  for (var i = 0; i < this.puddles.length; i++) {
    var p = this.puddles[i];
    if (!p.active) continue;
    p.life -= dt; p.tick -= dt;
    if (p.life <= 0) { p.active = false; p.img.setVisible(false); continue; }
    p.img.setAlpha(0.75 * Math.min(1, p.life));
    // SPRINKLES on frosting puddles: little coloured dashes so the
    // splotch reads as party frosting, never as anything gorier
    if (p.kind === 'slow' && !this.dead) {
      var SPR = [0xffd977, 0x9be8ff, 0xff9ecb, 0xb4f2a8, 0xc9a8ff];
      for (var sp = 0; sp < 7; sp++) {
        var sa = (p.seed + sp * 61) % 6.28, sr = ((p.seed * 7 + sp * 37) % 100) / 100 * p.r * 0.8;
        this.gfx.fillStyle(SPR[(sp + Math.floor(p.seed)) % SPR.length], 0.9 * Math.min(1, p.life));
        this.gfx.fillRect(p.x + Math.cos(sa) * sr - 2, p.y + Math.sin(sa) * sr * 0.7 - 1, 5, 2);
      }
    }
    var dx = px - p.x, dy = py - p.y;
    var inside = dx * dx + dy * dy < (p.r) * (p.r);
    if (inside && p.kind === 'slow') {
      this.scene.bossSlow = 0.55;                            // drag, not chip
    } else if (inside && p.tick <= 0 && this.scene.now > this.scene.invUntil - 0.4 && !this.scene.dead) {
      p.tick = 0.5;
      this.scene.hp -= 4;                                    // 8 dmg/s while inside
      this.scene.drawHud();
      if (this.scene.hp <= 0) this.scene.die();
    }
  }
};

PC.Boss.prototype._drawBar = function () {
  var g = this.scene.bossBar; if (!g) return;
  var W = PC.RENDER.W, y = PC.RENDER.H - 8;
  g.clear();
  g.fillStyle(0x1b1530, 0.85).fillRect(8, y, W - 16, 6);
  g.fillStyle(0xff6b6b, 1).fillRect(9, y + 1, Math.max(0, (W - 18) * this.hp / this.maxHp), 4);
};

PC.Boss.prototype.die = function () {
  this.dead = true;
  // the boss's parting gift (v0.30.0, Mark: "give the bosses a power up
  // drop that the players can use - it can be a previously made
  // upgrade"). With story runs no longer levelling, this IS the in-run
  // power spike, so it drops where the boss fell and waits to be taken.
  if (this.scene.dropBossPower) this.scene.dropBossPower(this.x, this.y);
  this.scene.onBossDefeated();     // single-path win trigger
};

PC.Boss.prototype.finalDestroy = function () {
  this.scene.bossSlow = 1;
  if (this.sayTxt) this.sayTxt.destroy();
  this.sprite.destroy(); this.shadow.destroy(); this.tele.destroy();
  this.gfx.destroy();
  for (var i = 0; i < this.puddles.length; i++) this.puddles[i].img.destroy();
};
