// allies.js - THE CREW DROPS IN (v0.46.0, Mark: "every now and then one
// of the crew steps in or flies in, and they get to help. Like, they're
// automatically just running around with their ability doing damage").
//
// This is the payoff for the whole campaign: five rescues become five
// arrivals. It is also the reason the roof fight has a heartbeat -
// pressure builds, the sky opens, someone lands, relief, they leave,
// pressure builds again.
//
// Order is the order you rescued them. In phase 3 they all come at once.
// If Danny goes down, the next one up hauls him back to his feet - once
// per phase, so it is a safety net and not immortality.
window.PC = window.PC || {};
(function () {

  var EVERY = 25;                  // seconds between arrivals
  var STAY = 15;                   // seconds on the deck
  var FALL = 0.9;                  // seconds of shadow-grow before landing
  var LEAVE = 0.7;                 // seconds of crouch-and-go
  var ORBIT = 150;                 // how far they range from the player
  var FIRE_CD = 0.55;              // their shots are steady, not spammy

  // rescue order, with what each of them does when they land. The shout
  // is the one thing the player reads, so it has to sound like them.
  PC.ALLY_ROSTER = [
    { id: 'victoria', art: 'char_victoria', tint: 0x7dd97b, dmg: 26,
      shout: 'Cover the left!',        style: 'shot' },
    { id: 'josh',   art: 'char_josh',   tint: 0xf2c33c, dmg: 22,
      shout: 'Easy up here, critters!', style: 'spread' },
    { id: 'kevin',  art: 'char_kevin',  tint: 0x35d0ff, dmg: 34,
      shout: 'Steady climb, team.',    style: 'heavy' },
    { id: 'carlos', art: 'char_carlos', tint: 0xff9ecb, dmg: 24,
      shout: 'I see the whole frame.', style: 'beam' },
    { id: 'nayah',  art: 'char_nayah',  tint: 0xa8e04a, dmg: 20,
      shout: 'Told you the climb was worth it!', style: 'fast' },
  ];

  PC.AllySystem = function (scene) {
    this.scene = scene;
    this.active = [];
    this.next = 0;                 // index into the roster
    this.acc = EVERY * 0.45;       // the first one comes early
    this.running = false;
    this.revivedInPhase = -1;      // one pick-up per phase
    this.g = scene.add.graphics().setDepth(7);       // shadows + landing rings
  };

  PC.AllySystem.prototype.start = function () { this.running = true; };

  PC.AllySystem.prototype.stop = function () {
    this.running = false;
    for (var i = 0; i < this.active.length; i++) this.active[i].sprite.destroy();
    this.active.length = 0;
    this.g.clear();
  };

  // everyone at once - the phase 3 crescendo
  PC.AllySystem.prototype.allIn = function () {
    for (var i = 0; i < PC.ALLY_ROSTER.length; i++) {
      var live = false;
      for (var j = 0; j < this.active.length; j++) {
        if (this.active[j].def.id === PC.ALLY_ROSTER[i].id) live = true;
      }
      if (!live) this._drop(PC.ALLY_ROSTER[i], 999);      // they stay for good
    }
  };

  // Danny is down and someone is close enough to care
  PC.AllySystem.prototype.tryRevive = function (phase) {
    if (this.revivedInPhase === phase) return null;
    var a = this.active.length ? this.active[0] : null;
    if (!a) {                                   // nobody here? send the next
      a = this._drop(PC.ALLY_ROSTER[this.next % PC.ALLY_ROSTER.length], STAY);
      this.next++;
      this.acc = 0;
    }
    this.revivedInPhase = phase;
    a.reviving = 1.1;
    return a;
  };

  PC.AllySystem.prototype._drop = function (def, stay) {
    var s = this.scene;
    // they land NEAR the player but never on top of them
    var ang = Math.random() * Math.PI * 2;
    var d = 190 + Math.random() * 90;
    var a = {
      def: def, state: 'falling', t: 0, stay: stay || STAY,
      x: s.px + Math.cos(ang) * d, y: s.py + Math.sin(ang) * d,
      fireT: Math.random() * FIRE_CD, walkT: 0, reviving: 0,
      orbit: Math.random() * Math.PI * 2,
      sprite: s.add.image(0, 0, 'atlas', def.art + '_walk_1')
        .setOrigin(0.5, 0.82).setDepth(12).setAlpha(0),
    };
    // keep them on the roof
    var L = s.region && s.region.layout;
    if (L && L.roof) {
      var r = L.roof.rect;
      a.x = Math.max(r.x + 120, Math.min(r.x + r.w - 120, a.x));
      a.y = Math.max(r.y + 120, Math.min(r.y + r.h - 120, a.y));
    }
    this.active.push(a);
    return a;
  };

  PC.AllySystem.prototype.update = function (dt) {
    var s = this.scene, g = this.g;
    g.clear();
    if (!this.running) return;

    // the timer only runs while the fight does
    if (this.next < PC.ALLY_ROSTER.length) {
      this.acc += dt;
      if (this.acc >= EVERY) {
        this.acc = 0;
        this._drop(PC.ALLY_ROSTER[this.next], STAY);
        this.next++;
      }
    }

    for (var i = this.active.length - 1; i >= 0; i--) {
      var a = this.active[i];
      a.t += dt;

      if (a.state === 'falling') {
        // a growing shadow, then the landing ring: you get to look up
        var k = Math.min(1, a.t / FALL);
        g.fillStyle(0x0a0716, 0.15 + 0.35 * k);
        g.fillEllipse(a.x, a.y + 6, 20 + 46 * k, 8 + 18 * k);
        a.sprite.setPosition(a.x, a.y - (1 - k) * (1 - k) * 260).setAlpha(k);
        if (a.t >= FALL) {
          a.state = 'fight'; a.t = 0;
          s.cameras.main.shake(180, 0.005);
          if (s.fx) s.fx.burst(a.x, a.y, 'fx_spark', 10, 0.3);
          if (s.floatText) s.floatText(a.def.shout, a.def.tint);
          if (PC.audio && PC.audio.telegraph) PC.audio.telegraph();
        }
        continue;
      }

      if (a.state === 'leaving') {
        var lk = Math.min(1, a.t / LEAVE);
        a.sprite.setAlpha(1 - lk).setPosition(a.x, a.y - lk * lk * 300);
        if (a.t >= LEAVE) { a.sprite.destroy(); this.active.splice(i, 1); }
        continue;
      }

      // ---- fighting: they run their own patrol near the player and
      // shoot the boss on their own clock. No orders, no micromanaging -
      // Mark: "they're automatically just running around with their
      // ability doing damage".
      if (a.reviving > 0) {
        // stand over Danny and haul him up
        a.reviving -= dt;
        var rdx = s.px - a.x, rdy = s.py - a.y, rd = Math.hypot(rdx, rdy) || 1;
        if (rd > 44) { a.x += (rdx / rd) * 220 * dt; a.y += (rdy / rd) * 220 * dt; }
        g.lineStyle(3, a.def.tint, 0.7);
        g.strokeCircle(s.px, s.py, 30 + Math.sin(a.t * 12) * 4);
        a.sprite.setPosition(a.x, a.y).setAlpha(1);
        if (a.reviving <= 0 && s.onAllyRevive) s.onAllyRevive(a);
        continue;
      }

      a.orbit += dt * 0.9;
      var tx = s.px + Math.cos(a.orbit) * ORBIT;
      var ty = s.py + Math.sin(a.orbit) * ORBIT * 0.7;
      var dx = tx - a.x, dy = ty - a.y, dd = Math.hypot(dx, dy);
      if (dd > 8) {
        var spd = 200;
        a.x += (dx / dd) * spd * dt;
        a.y += (dy / dd) * spd * dt;
        a.walkT += dt;
      }
      a.sprite.setPosition(a.x, a.y).setAlpha(1)
        .setFrame(a.def.art + '_walk_' + (1 + (Math.floor(a.walkT * 10) % 6)));
      a.sprite.setFlipX(s.px < a.x);

      // contact shadow so they are standing on the roof, not hovering
      g.fillStyle(0x0a0716, 0.35);
      g.fillEllipse(a.x, a.y + 6, 40, 16);

      // ---- their ability. Goes through the SAME damage door every
      // weapon uses (scene.hitBoss), so an ally can never do something
      // the player's own guns cannot.
      a.fireT -= dt;
      if (a.fireT <= 0) {
        a.fireT = FIRE_CD;
        this._fire(a);
      }

      a.stay -= dt;
      if (a.stay <= 0) { a.state = 'leaving'; a.t = 0; }
    }
  };

  PC.AllySystem.prototype._fire = function (a) {
    var s = this.scene, b = s.boss;
    if (!b || b.dead || b.powering) return;
    var g = this.g;
    var dmg = a.def.dmg;
    // a visible line of intent from them to the boss, in their colour -
    // five allies firing must never read as one anonymous light show
    g.lineStyle(a.def.style === 'heavy' ? 5 : a.def.style === 'beam' ? 3 : 2,
      a.def.tint, 0.55);
    g.beginPath();
    g.moveTo(a.x, a.y - 14);
    g.lineTo(b.x, b.y);
    g.strokePath();
    if (s.fx) s.fx.burst(b.x, b.y, 'fx_spark', 2, 0.12);
    s.hitBoss(b.x, b.y, dmg, 0, 0);
    // the spread shooter also clips whatever crowd is on the deck
    if (a.def.style === 'spread' && s.enemies && PC.damageEnemy) {
      var pool = s.enemies.pool;
      for (var i = 0; i < pool.length; i++) {
        var e = pool[i];
        if (!e.active) continue;
        var ex = e.x - a.x, ey = e.y - a.y;
        if (ex * ex + ey * ey < 220 * 220) PC.damageEnemy(s, e, dmg * 0.5);
      }
    }
  };

  PC.AllySystem.prototype.destroy = function () {
    this.stop();
    this.g.destroy();
  };
})();
