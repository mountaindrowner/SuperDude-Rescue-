// chomp_moves.js - CHOMP'S MOVESET (v0.56.0).
//
// It does not attack. It SERVES. Every move is an act of generosity
// that happens to be lethal, because CHOMP cannot conceive that being
// fed might be unwelcome. That is the joke, and it is also why every
// telegraph is a piece of hospitality: a plate laid on the floor, a
// belt of food swung your way, a buffet spread outward, seconds.
//
// FOUR MOVES:
//   PORTION SERVE - a plate ring painted on the deck under you, filled
//                   over a beat, then a meal lands in it. Dodge by
//                   walking out of the plate.
//   CONVEYOR      - a boom arm winds up and sweeps a belt of food
//                   through an arc. Only while that arm still lives,
//                   which is what makes the arms worth killing.
//   BUFFET        - a radial spread of food from the chute, with GAPS
//                   you step through. Read the gap, not the wall.
//   SECONDS!      - a wave of the actual campaign foods, every district
//                   at once. The greatest-hits crowd.
//
// Everything damaging is drawn in one graphics layer and collided by
// hand against the player, the same way the boss puddles work - it
// never touches the bullet system, so nothing here can leak into
// normal play.
window.PC = window.PC || {};
(function () {

  // per-phase behaviour. Cadence is the gap between moves; the weights
  // decide what it reaches for. Phase 1 teaches the plate, phase 2 adds
  // the spread, phase 3 opens everything up.
  var PHASE = {
    1: { gap: [3.4, 4.6], moves: ['serve', 'serve', 'conveyor'] },
    2: { gap: [2.6, 3.6], moves: ['serve', 'conveyor', 'buffet', 'serve'] },
    3: { gap: [1.9, 2.8], moves: ['serve', 'conveyor', 'buffet', 'seconds'] },
  };

  // ---- THE RESERVED TELEGRAPH COLOUR --------------------------------
  // Boss doc, Part 1.4: lock ONE hue to "danger, move now" and protect
  // it religiously. Nothing else in this game may use it - not UI, not
  // friendly VFX, not decoration. We were using GOLD, which is also
  // CHOMP's own trim, the pickup colour and half the HUD; that is
  // exactly the mistake the rule exists to prevent.
  var TELL = 0xff3ea5;             // magenta. Reserved. Do not reuse.
  PC.CHOMP_TELL_COLOR = TELL;

  var PLATE_R = 132;               // the ring you must leave
  var PLATE_TELL = 1.35;           // seconds of warning before it lands
  var PLATE_DMG = 22;
  var BELT_DMG = 18;
  var CRUMB_DMG = 14;

  // ---- THE POSITIONING WINDOW ---------------------------------------
  // Boss doc, Appendix: in an auto-attack game the punish window is not
  // an attack window, it is a POSITIONING window - the boss stops
  // emitting zone denial and the player can safely stand in high-DPS
  // range. So every move ends in a real recovery during which CHOMP
  // cannot act and takes bonus damage, and the size of the recovery
  // scales with the size of the threat (Part 1.2).
  var RECOVER = { serve: 1.5, conveyor: 2.1, buffet: 1.4, seconds: 1.1 };
  var VULN_MULT = 2.0;             // damage multiplier while recovering

  PC.ChompMoves = function (scene, chomp) {
    this.scene = scene;
    this.chomp = chomp;
    this.g = scene.add.graphics().setDepth(6);       // on the deck, under actors
    this.plates = [];
    this.crumbs = [];
    this.belt = null;
    this.acc = 2.2;                                  // a beat to breathe first
    this.last = '';
    this.recover = 0;                                // >0 = punish window
    this.recentHitAt = 0;                            // for pity aggression
    this.shoveCd = 0;                                // anti-camp cooldown
  };

  // is CHOMP in its punish window right now?
  PC.ChompMoves.prototype.vulnerable = function () { return this.recover > 0; };

  PC.ChompMoves.prototype._hurt = function (dmg) {
    var s = this.scene;
    // DEATH CANCEL (doc 3.4): if the player is already down, nothing in
    // flight may land on them.
    if (s.dead || s.now < s.invUntil) return;
    s.hp -= dmg;
    s.invUntil = s.now + 0.7;
    s.drawHud();
    if (s.juice && s.juice.hurt) s.juice.hurt();
    if (s.hp <= 0) s.die();
  };

  PC.ChompMoves.prototype.update = function (dt) {
    var c = this.chomp, s = this.scene, g = this.g;
    g.clear();
    if (!c || c.dead || c.powering) { this.plates.length = 0; this.crumbs.length = 0; this.belt = null; return; }
    if (s.storyPause) return;                        // never during dialogue

    // RECOVERY: it stops denying ground, glows, and takes double damage.
    // This is the whole punish economy in an auto-attack game.
    if (this.recover > 0) {
      this.recover -= dt;
      this._drawRecover(g, c);
      if (this.recover <= 0) this.acc = Math.max(this.acc, 0.35);
    }

    // PHASE GRACE (doc 3.4): no attacks for a beat after a gate, which
    // is the free heal window and a hard reset of the player's rhythm.
    if (c.graceT > 0) { c.graceT -= dt; this.acc = Math.max(this.acc, 0.2); }

    // PITY AGGRESSION (doc 3.4): a player who has not landed a hit in a
    // while is struggling and needs MORE openings, not fewer.
    var pity = (s.now - this.recentHitAt > 15) ? 1.45 : 1;

    this._antiCamp(dt, g, c);

    if (this.recover <= 0 && c.graceT <= 0) {
      this.acc -= dt / pity;
      if (this.acc <= 0) this._pick();
    }

    this._plates(dt, g);
    this._beltUpdate(dt, g);
    this._crumbs(dt, g);
  };

  // the punish window, made obvious: a cyan ring pulsing at the core.
  // Cyan, never the reserved magenta - this marks SAFE, not danger.
  PC.ChompMoves.prototype._drawRecover = function (g, c) {
    var k = Math.min(1, this.recover / 0.6);
    var pulse = 0.45 + 0.3 * Math.sin(this.scene.now * 7);
    g.lineStyle(6, 0x35d0ff, 0.5 * k * pulse);
    g.strokeCircle(c.x, c.y, c.r + 44);
    g.lineStyle(3, 0xa8e04a, 0.55 * k);
    g.strokeCircle(c.x, c.y, c.r + 26);
  };

  // ANTI-CAMP (doc 3.2 onPlayerAdjacent): hugging a stationary boss must
  // not be free. A short, fast, clearly-telegraphed shove - and it
  // reacts to POSITION, never to a button press (doc 2.3.3).
  PC.ChompMoves.prototype._antiCamp = function (dt, g, c) {
    var s = this.scene;
    this.shoveCd -= dt;
    var dx = s.px - c.x, dy = s.py - c.y;
    var near = dx * dx + dy * dy < (c.r + 60) * (c.r + 60);
    if (!near) { this._camp = 0; return; }
    this._camp = (this._camp || 0) + dt;
    if (this._camp < 0.9 || this.shoveCd > 0) {
      if (this._camp > 0.35) {                    // the tell, before it fires
        g.lineStyle(5, TELL, 0.4 + 0.4 * Math.sin(s.now * 16));
        g.strokeCircle(c.x, c.y, c.r + 54);
      }
      return;
    }
    this._camp = 0; this.shoveCd = 3.4;
    this._hurt(12);
    // stand on the exact centre and dx/dy are both zero, so a delta-based
    // shove pushes you nowhere - the one spot camping would still be free.
    // Shove to a fixed RADIUS instead, and fall back to "downhill, toward
    // the open roof" when there is no direction to preserve.
    var d = Math.hypot(dx, dy);
    if (d < 1) { dx = 0; dy = 1; d = 1; }
    var out = c.r + 120;
    s.px = c.x + (dx / d) * out; s.py = c.y + (dy / d) * out;
    if (s.player) s.player.setPosition(s.px, s.py);
    s.cameras.main.shake(160, 0.005);
    if (s.floatText) s.floatText('TOO CLOSE!', TELL);
  };

  // choose the next move, never the same one twice running
  PC.ChompMoves.prototype._pick = function () {
    var c = this.chomp;
    var P = PHASE[c.phase] || PHASE[1];
    var pool = P.moves.filter(function (m) { return m !== this.last; }, this);
    if (!pool.length) pool = P.moves;
    var m = pool[Math.floor(Math.random() * pool.length)];
    // the conveyor needs a living arm to swing
    if (m === 'conveyor' && (!c.arms || !c.arms.alive())) m = 'buffet';
    this.last = m;
    this.acc = P.gap[0] + Math.random() * (P.gap[1] - P.gap[0]);
    if (m === 'serve') this._serve();
    else if (m === 'conveyor') this._conveyor();
    else if (m === 'buffet') this._buffet();
    else this._seconds();
    // the punish window opens when the move's active frames end. Bigger
    // commitment, bigger opening (doc 1.2).
    this._pending = RECOVER[m] || 1.2;
  };

  // ---- PORTION SERVE -------------------------------------------------
  PC.ChompMoves.prototype._serve = function () {
    var s = this.scene, c = this.chomp;
    var n = c.phase >= 2 ? 2 : 1;                    // doubles from phase 2
    for (var i = 0; i < n; i++) {
      // the first plate is laid where you STAND; extras lead you a little
      var lead = i === 0 ? 0 : 120;
      var a = Math.random() * Math.PI * 2;
      this.plates.push({
        x: s.px + Math.cos(a) * lead, y: s.py + Math.sin(a) * lead,
        t: 0, done: false,
      });
    }
    if (c.fig) c.fig.serving = PLATE_TELL + 0.4;     // mouth gapes, serve pose
    if (PC.audio && PC.audio.telegraph) PC.audio.telegraph();
    if (s.floatText && c.phase === 1) s.floatText('MOVE OFF THE PLATE!', 0xf2c33c);
  };

  PC.ChompMoves.prototype._plates = function (dt, g) {
    var s = this.scene;
    for (var i = this.plates.length - 1; i >= 0; i--) {
      var p = this.plates[i];
      p.t += dt;
      var k = Math.min(1, p.t / PLATE_TELL);
      if (!p.done) {
        // a dinner plate drawn on the deck, filling up as it arms
        g.lineStyle(5, TELL, 0.85);
        g.strokeCircle(p.x, p.y, PLATE_R);
        g.lineStyle(2, TELL, 0.45);
        g.strokeCircle(p.x, p.y, PLATE_R - 9);
        g.fillStyle(TELL, 0.10 + 0.20 * k);
        g.fillCircle(p.x, p.y, PLATE_R * k);
        if (p.t >= PLATE_TELL) {
          p.done = true; p.t = 0;
          var dx = s.px - p.x, dy = s.py - p.y;
          if (dx * dx + dy * dy < PLATE_R * PLATE_R) this._hurt(PLATE_DMG);
          s.cameras.main.shake(200, 0.006);
          if (s.fx) s.fx.burst(p.x, p.y, 'fx_pop', 12, 0.4);
          if (PC.audio && PC.audio.bossHit) PC.audio.bossHit();
          this._openWindow();
        }
      } else {
        // the meal itself, sitting there for a moment
        var f = 1 - Math.min(1, p.t / 0.65);
        g.fillStyle(0xe2574c, 0.55 * f);
        g.fillCircle(p.x, p.y, PLATE_R * (0.55 + 0.45 * (1 - f)));
        g.fillStyle(0xf2c33c, 0.5 * f);
        g.fillCircle(p.x, p.y, PLATE_R * 0.34);
        if (p.t > 0.65) this.plates.splice(i, 1);
      }
    }
  };

  // ---- CONVEYOR ------------------------------------------------------
  PC.ChompMoves.prototype._conveyor = function () {
    var c = this.chomp, s = this.scene;
    if (!c.arms) return;
    // the arm nearest the player winds up, then sweeps through them
    var live = c.arms.arms.filter(function (a) { return !a.dead; });
    if (!live.length) return;
    var best = live[0], bd = 1e9;
    for (var i = 0; i < live.length; i++) {
      var t = c.arms.tipOf(live[i]);
      var d = (t.x - s.px) * (t.x - s.px) + (t.y - s.py) * (t.y - s.py);
      if (d < bd) { bd = d; best = live[i]; }
    }
    var toward = Math.atan2(s.py - c.y, s.px - c.x);
    this.belt = { arm: best, t: 0, from: toward - 0.9, to: toward + 0.9, hit: false };
    best.wind = 1;
    if (PC.audio && PC.audio.telegraph) PC.audio.telegraph();
  };

  PC.ChompMoves.prototype._beltUpdate = function (dt, g) {
    var b = this.belt;
    if (!b) return;
    var c = this.chomp, s = this.scene;
    b.t += dt;
    var WIND = 0.85, SWING = 0.6;
    if (b.arm.dead) { b.arm.wind = 0; this.belt = null; return; }
    if (b.t < WIND) {
      // wind-up: the arm pulls back and the jaws flare
      b.arm.wind = 1 - b.t / WIND * 0.2;
      b.arm.ang = b.from - 0.35;
      b.arm.ext = 0.6;
      // the arc it is about to sweep, painted on the deck
      g.lineStyle(7, TELL, 0.45 + 0.35 * Math.sin(s.now * 14));
      g.beginPath();
      g.arc(c.x, c.y, 260, b.from, b.to);
      g.strokePath();
      return;
    }
    var k = Math.min(1, (b.t - WIND) / SWING);
    var e = k * k * (3 - 2 * k);
    b.arm.wind = 0;
    b.arm.ang = b.from + (b.to - b.from) * e;
    b.arm.ext = 0.95;
    // the belt itself: a line of food riding the boom
    var tip = c.arms.tipOf(b.arm);
    for (var i = 0; i < 7; i++) {
      var f = 0.35 + (i / 6) * 0.65;
      var fx = c.x + (tip.x - c.x) * f, fy = c.y + (tip.y - c.y) * f;
      g.fillStyle(i % 2 ? 0xf2c33c : 0xe2574c, 0.9);
      g.fillCircle(fx, fy, 13);
      g.fillStyle(0xffd977, 0.7);
      g.fillCircle(fx - 3, fy - 3, 5);
    }
    if (!b.hit) {
      var dx = s.px - tip.x, dy = s.py - tip.y;
      if (dx * dx + dy * dy < 92 * 92) { b.hit = true; this._hurt(BELT_DMG); }
    }
    if (k >= 1) { b.arm.wind = 0; this.belt = null; this._openWindow(); }
  };

  // ---- BUFFET --------------------------------------------------------
  PC.ChompMoves.prototype._buffet = function () {
    var c = this.chomp;
    var n = c.phase >= 3 ? 16 : 12;
    // TWO gaps, opposite each other, so there is always somewhere to be
    var gapA = Math.random() * Math.PI * 2;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var d1 = Math.abs(((a - gapA + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      var d2 = Math.abs(((a - gapA - Math.PI + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (d1 > Math.PI - 0.45 || d2 > Math.PI - 0.45) continue;   // the gaps
      this.crumbs.push({
        x: c.x, y: c.y + 20, vx: Math.cos(a) * 210, vy: Math.sin(a) * 150,
        life: 3.2, hit: false, kind: i % 3,
      });
    }
    if (c.fig) c.fig.serving = 0.5;
    if (PC.audio && PC.audio.telegraph) PC.audio.telegraph();
    var self = this;
    this.scene.time.delayedCall(700, function () { self._openWindow(); });
  };

  PC.ChompMoves.prototype._crumbs = function (dt, g) {
    var s = this.scene;
    for (var i = this.crumbs.length - 1; i >= 0; i--) {
      var c2 = this.crumbs[i];
      c2.life -= dt;
      c2.x += c2.vx * dt; c2.y += c2.vy * dt;
      if (c2.life <= 0) { this.crumbs.splice(i, 1); continue; }
      var col = c2.kind === 0 ? 0xf2c33c : c2.kind === 1 ? 0xe2574c : 0xff9ecb;
      g.fillStyle(0x15131c, 0.5);
      g.fillCircle(c2.x, c2.y + 4, 12);
      g.fillStyle(col, 1);
      g.fillCircle(c2.x, c2.y, 11);
      g.fillStyle(0xffffff, 0.55);
      g.fillCircle(c2.x - 3, c2.y - 3, 4);
      if (!c2.hit) {
        var dx = s.px - c2.x, dy = s.py - c2.y;
        if (dx * dx + dy * dy < 34 * 34) { c2.hit = true; this._hurt(CRUMB_DMG); }
      }
    }
  };

  // ---- SECONDS! ------------------------------------------------------
  PC.ChompMoves.prototype._seconds = function () {
    var s = this.scene, c = this.chomp;
    if (!s.enemies || !PC.ENEMY_DEFS) return;
    // the greatest-hits wave: one creature from every district at once
    var roster = ['fry', 'apple', 'donut', 'zipper', 'blob'];
    var n = 9;
    for (var i = 0; i < n; i++) {
      var d = PC.ENEMY_DEFS[roster[i % roster.length]];
      if (!d) continue;
      var a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
      var r = 300 + Math.random() * 90;
      s.enemies.spawn(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r * 0.7, {
        key: d.key, still: d.still, size: d.size, xp: d.xp, kbMult: d.kbMult,
        spd: d.spd, hp: d.hp, dmg: d.dmg,
      });
    }
    if (s.floatText) s.floatText('HERE IS MORE!', 0xe2574c);
    this._openWindow();
    if (s.quest && s.quest.box && !s.quest.box.active) {
      s.quest.box.show({ speaker: 'chomp', text: 'Here is MORE!' }, function () {});
    }
  };

  // the move is over: open the positioning window
  PC.ChompMoves.prototype._openWindow = function () {
    if (this._pending) { this.recover = this._pending; this._pending = 0; }
  };

  // PROJECTILE AMNESTY (doc 3.4): on a phase gate or a death, everything
  // in flight is despawned. Nothing may kill you during a transition.
  PC.ChompMoves.prototype.amnesty = function () {
    this.plates.length = 0;
    this.crumbs.length = 0;
    if (this.belt && this.belt.arm) this.belt.arm.wind = 0;
    this.belt = null;
    this.recover = 0;
    this._pending = 0;
    this.acc = Math.max(this.acc, 1.0);
  };

  PC.ChompMoves.prototype.destroy = function () { this.g.destroy(); };
})();
