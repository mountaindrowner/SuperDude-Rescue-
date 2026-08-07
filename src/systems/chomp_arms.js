// chomp_arms.js - THE BOOM ARMS + THE TETHERS.
//
// TETHERS are pure dressing and they do the job the silhouette alone
// could not: thick feed pipes and slack cables running from the roof's
// plant and parapet INTO CHOMP, so it reads as something plumbed into
// the building rather than a sprite parked on it. They droop, they
// sag, and they twitch when it takes a hit.
//
// THE ARMS are the fight. Four booms on the plinth hardpoints, drawn
// in CODE rather than stamped, because a sprite arm is only correct at
// the one angle it was drawn at and these sweep through all of them.
// Each is destructible on its own, and while any of them lives the
// core is armoured - so the fight has a shape: strip the arms, then
// the machine.
//
// v0.59.0 - FOUR JOBS, NOT FOUR HP BARS (Mark: "make the arms longer by
// 75%, have those blades at the end spinning, and maybe have each arm
// have a different purpose?"). Until now the four arms were identical,
// so which one you shot first never mattered. Now each is a different
// appliance with its own head, its own colour and its own attack on its
// own clock:
//
//   SERVER    - a food cannon. Lobs aimed portions at you.
//   BLENDER   - a spinning blade rotor. Lethal to touch, no cooldown.
//   ATTRACTOR - a tractor beam that DRAGS you toward it. Never damages
//               you itself; it pulls you into everything else.
//   SAUCER    - sprays goop puddles that slow you down. Also harmless
//               alone, and also the reason the next thing lands.
//
// That turns "shoot the arms" into a real decision - kill the blender
// because it hurts, or kill the attractor because it is what makes the
// rest of the fight land. This is the boss doc's "a good boss gives you
// options" (2.3.9) and its bullet-heaven note that variety, not health,
// is what stops a long fight feeling like a sponge (2.3.5).
window.PC = window.PC || {};
(function () {

  var SEG = 3;                     // segments per boom
  // +75% (Mark). 320 -> 560.
  var REACH = 560;
  // A 560px boom does not FIT across a 402px-wide portrait screen, and
  // the arm tips are TARGETS - each carries the HP pip you are shooting
  // at, so one that wanders off the edge is a target you cannot hit.
  //
  // The camera's half-width at PC.FIGHT_ZOOM 0.8 is only 402/2/0.8 =
  // 251 world px, against a half-height of 546. A 560px boom therefore
  // cannot fit sideways at all, and since the anti-camp shove keeps the
  // player ~245px off the core the camera is never centred on CHOMP
  // either - so all four tips on screen at once is not a thing this
  // geometry can promise, and pretending otherwise would mean either a
  // silly zoom-out or arms that are not actually longer.
  //
  // What it CAN promise, and what the gate checks, is that the arm you
  // are engaging is on screen: every arm is aimed within ~24 degrees of
  // straight up or straight down, capping the sideways excursion at
  //   560 * 0.82 (max ext) * sin(24 deg) = 187px
  // well inside 251, so walking toward any boom always brings its head
  // and its HP pip into view.
  var YSQ = 0.85;
  var SWEEP = 0.18;                // radians either side of rest
  var ARM_HP = 900;
  PC.CHOMP_ARM_REACH = REACH;      // exposed so the gate can assert the +75%

  // Two up, two down, each pair split either side of vertical - but
  // DELIBERATELY NOT MIRRORED. Four booms leaving one point in a
  // symmetric X reads as a thing standing on legs, which is the exact
  // note that killed the old generated CHOMP ("he's not enough of a
  // stationary machine"). Staggering the angles and bolting each boom to
  // its OWN hardpoint on the plinth (see mountOf) reads as machinery
  // mounted on a frame instead.
  var REST = [-1.86, -1.30, 1.34, 1.88];

  // where each boom is bolted to the chassis, as a fraction of the
  // body's radius - these line up with the four gold boom sockets the
  // body texture already paints along the plinth.
  var MOUNT = [-0.52, 0.46, 0.52, -0.46];

  // ---- THE FOUR APPLIANCES -------------------------------------------
  // tint is the arm's identity colour and is used for its head, its beam
  // and its kill message. None of them is the reserved magenta - that
  // stays locked to "this will hurt you, move" (doc 1.4). The two
  // non-damaging arms (attractor, saucer) deliberately do NOT get a
  // danger colour, because they cannot hurt you.
  var ROLES = [
    { k: 'server',  name: 'SERVER',    tint: 0xf2c33c, spin: 3.0, cd: [2.8, 4.0] },
    { k: 'blender', name: 'BLENDER',   tint: 0xff6b6b, spin: 14.0, cd: [0, 0] },
    { k: 'magnet',  name: 'ATTRACTOR', tint: 0x8f7dff, spin: 1.6, cd: [4.6, 6.2] },
    { k: 'saucer',  name: 'SAUCER',    tint: 0xa8e04a, spin: 4.5, cd: [3.8, 5.2] },
  ];

  var BLADE_DMG = 16;              // blender contact
  var BLADE_R = 78;                // how close is too close
  var PELLET_DMG = 14;
  var PULL_SPD = 105;              // < player speed, so it is always escapable
  var GOOP_SLOW = 0.60;            // and 190*0.60 = 114 still beats the pull
  var GOOP_LIFE = 7.0;
  var GOOP_R = 96;

  function roll(r) { return r[0] + Math.random() * (r[1] - r[0]); }

  PC.ChompArms = function (scene, chomp) {
    this.scene = scene;
    this.chomp = chomp;
    this.g = scene.add.graphics().setDepth(17);       // under the body
    this.arms = [];
    this.goop = [];
    var ez = PC.ease ? PC.ease(scene) : null;
    var hp = Math.round(ARM_HP * ((ez && ez.bossHp) || 1));
    for (var i = 0; i < 4; i++) {
      var role = ROLES[i];
      this.arms.push({
        i: i, role: role, rest: REST[i], ang: REST[i], hp: hp, maxHp: hp,
        dead: false, t: Math.random() * 6, ext: 0.75, flash: 0,
        deathT: 0, spin: Math.random() * 6, cd: roll(role.cd) + 1.5,
        state: '', stateT: 0,
      });
    }
  };

  PC.ChompArms.prototype.alive = function () {
    var n = 0;
    for (var i = 0; i < this.arms.length; i++) if (!this.arms[i].dead) n++;
    return n;
  };

  // is a given appliance still on the machine?
  PC.ChompArms.prototype.has = function (kind) {
    for (var i = 0; i < this.arms.length; i++) {
      if (!this.arms[i].dead && this.arms[i].role.k === kind) return true;
    }
    return false;
  };

  // the hardpoint this boom swings from
  PC.ChompArms.prototype.mountOf = function (a) {
    var c = this.chomp;
    return { x: c.x + MOUNT[a.i] * c.r, y: c.y + c.r * 0.30 };
  };

  // where an arm's damageable tip sits right now
  PC.ChompArms.prototype.tipOf = function (a) {
    var m = this.mountOf(a);
    var r = REACH * a.ext;
    return { x: m.x + Math.cos(a.ang) * r, y: m.y + Math.sin(a.ang) * r * YSQ };
  };

  // a shot at (x,y): if it lands on a live arm, that arm eats it. Called
  // from scene.hitBoss BEFORE the core, so arms genuinely shield it.
  PC.ChompArms.prototype.tryHit = function (x, y, dmg) {
    var best = null, bd = 1e9;
    for (var i = 0; i < this.arms.length; i++) {
      var a = this.arms[i];
      if (a.dead) continue;
      var t = this.tipOf(a);
      var d = (t.x - x) * (t.x - x) + (t.y - y) * (t.y - y);
      if (d < 74 * 74 && d < bd) { bd = d; best = a; }
    }
    if (!best) return false;
    best.hp -= dmg;
    best.flash = this.scene.now + 0.08;
    if (this.chomp.moves) this.chomp.moves.recentHitAt = this.scene.now;
    if (best.hp <= 0) this._kill(best);
    return true;
  };

  PC.ChompArms.prototype._kill = function (a) {
    a.dead = true;
    a.deathT = this.scene.now;
    a.state = '';
    var t = this.tipOf(a), s = this.scene;
    if (s.fx) s.fx.burst(t.x, t.y, 'fx_spark', 18, 0.5);
    s.cameras.main.shake(220, 0.006);
    if (PC.audio && PC.audio.bossHit) PC.audio.bossHit();
    var left = this.alive();
    // NAME the appliance that died - the whole point of giving them
    // different jobs is that the player learns which one to take first
    if (s.floatText) {
      s.floatText(left ? a.role.name + ' DOWN - ' + left + ' LEFT' : 'ALL ARMS DOWN!',
        left ? a.role.tint : 0xa8e04a);
    }
    if (!left && s.onChompArmsCleared) s.onChompArmsCleared();
  };

  // phase transitions and the power-down clear everything the arms have
  // in flight, same amnesty the moveset honours (doc 3.4)
  PC.ChompArms.prototype.amnesty = function () {
    this.goop.length = 0;
    for (var i = 0; i < this.arms.length; i++) {
      this.arms[i].state = ''; this.arms[i].stateT = 0;
      this.arms[i].cd = Math.max(this.arms[i].cd, 1.2);
    }
    this.scene.armSlow = 1;
  };

  PC.ChompArms.prototype.update = function (dt) {
    var s = this.scene, c = this.chomp, g = this.g;
    g.clear();
    s.armSlow = 1;                                    // recomputed below
    if (!c || c.dead) return;
    var powered = c.powering;

    this._tethers(g, c, powered);
    this._goop(dt, g, powered);

    for (var i = 0; i < this.arms.length; i++) {
      var a = this.arms[i];
      a.t += dt;
      if (a.dead) { this._drawDead(g, a); continue; }
      a.spin += dt * a.role.spin * (a.state ? 2.2 : 1);
      // a slow sweep, each arm on its own phase so they never march in
      // step - the two-clock rule from the VFX notes
      if (!powered) {
        a.ang = a.rest + Math.sin(a.t * 0.55 + a.i) * SWEEP;
        a.ext = 0.72 + Math.sin(a.t * 0.9 + a.i * 1.7) * 0.10;
      }
      if (!powered && !s.storyPause && !s.dead) this._role(dt, g, a);
      this._draw(g, a, powered);
    }
  };

  // ---- what each appliance actually DOES ------------------------------
  PC.ChompArms.prototype._role = function (dt, g, a) {
    var s = this.scene, c = this.chomp, tip = this.tipOf(a);
    // the blender never waits: it is dangerous simply by existing, which
    // is what makes it the arm you want gone first
    if (a.role.k === 'blender') {
      // even the always-on arm honours the transition grace - nothing
      // may land on you during a scripted beat (doc 3.4)
      if (c.graceT > 0) return;
      var bx = s.px - tip.x, by = s.py - tip.y;
      if (bx * bx + by * by < BLADE_R * BLADE_R && this.chomp.moves) {
        this.chomp.moves._hurt(BLADE_DMG);
        if (s.fx) s.fx.burst(s.px, s.py, 'fx_spark', 5, 0.3);
      }
      return;
    }
    // grace and the punish window quiet the other three too, so recovery
    // really is recovery rather than "the core naps while the arms work"
    if (c.graceT > 0 || (c.moves && c.moves.vulnerable())) return;

    if (a.state === '') {
      a.cd -= dt;
      if (a.cd <= 0) { a.state = 'wind'; a.stateT = 0; }
      return;
    }
    a.stateT += dt;

    if (a.role.k === 'server') {
      // a food cannon: a short muzzle tell, then aimed portions
      if (a.state === 'wind') {
        this._tell(g, tip, a.stateT / 0.7, 0xff3ea5);   // it WILL hurt: reserved
        if (a.stateT >= 0.7) { a.state = ''; a.cd = roll(a.role.cd); this._fire(a, tip); }
      }
      return;
    }

    if (a.role.k === 'magnet') {
      // TRACTOR BEAM. It never damages you - it drags you toward the tip
      // slower than you can walk, so it is always escapable (doc 2.3.4,
      // no guaranteed damage) but it ruins your positioning.
      if (a.state === 'wind') {
        this._tell(g, tip, a.stateT / 0.9, a.role.tint);
        if (a.stateT >= 0.9) { a.state = 'pull'; a.stateT = 0; }
        return;
      }
      var dx = tip.x - s.px, dy = tip.y - s.py;
      var d = Math.max(1, Math.hypot(dx, dy));
      s.px += (dx / d) * PULL_SPD * dt;
      s.py += (dy / d) * PULL_SPD * dt;
      this._beam(g, tip, s.px, s.py, a.role.tint);
      if (a.stateT >= 1.4) { a.state = ''; a.cd = roll(a.role.cd); }
      return;
    }

    if (a.role.k === 'saucer') {
      // sprays puddles. Harmless to touch - it is a setup move, and it
      // is drawn in its own green so it never reads as damage.
      if (a.state === 'wind') {
        this._tell(g, tip, a.stateT / 0.8, a.role.tint);
        if (a.stateT >= 0.8) {
          a.state = ''; a.cd = roll(a.role.cd);
          for (var i = 0; i < 3; i++) {
            var ang = Math.random() * Math.PI * 2, r = Math.random() * 150;
            this.goop.push({ x: s.px + Math.cos(ang) * r, y: s.py + Math.sin(ang) * r * 0.7,
              life: GOOP_LIFE, seed: Math.random() * 9 });
          }
          if (PC.audio && PC.audio.telegraph) PC.audio.telegraph();
        }
      }
    }
  };

  // the server's portions ride the moveset's crumb list, so they are
  // collided, drawn and AMNESTIED by exactly the same code as everything
  // else CHOMP throws - no second projectile system
  PC.ChompArms.prototype._fire = function (a, tip) {
    var s = this.scene, m = this.chomp.moves;
    if (!m) return;
    var base = Math.atan2(s.py - tip.y, s.px - tip.x);
    for (var i = -1; i <= 1; i++) {
      var ang = base + i * 0.22;
      m.crumbs.push({ x: tip.x, y: tip.y, vx: Math.cos(ang) * 260,
        vy: Math.sin(ang) * 200, life: 2.6, hit: false, kind: (i + 1) % 3,
        dmg: PELLET_DMG });
    }
    if (PC.audio && PC.audio.telegraph) PC.audio.telegraph();
  };

  // a shrinking ring at the tip: the universal "this thing is about to
  // go off" tell, tinted by whatever is about to happen
  PC.ChompArms.prototype._tell = function (g, tip, k, tint) {
    k = Math.max(0, Math.min(1, k));
    g.lineStyle(5, tint, 0.35 + 0.45 * Math.sin(this.scene.now * 15));
    g.strokeCircle(tip.x, tip.y, 30 + (1 - k) * 46);
    g.lineStyle(2, tint, 0.5);
    g.strokeCircle(tip.x, tip.y, 30);
  };

  PC.ChompArms.prototype._beam = function (g, tip, px, py, tint) {
    var t = this.scene.now;
    g.lineStyle(26, tint, 0.10);
    g.beginPath(); g.moveTo(tip.x, tip.y); g.lineTo(px, py); g.strokePath();
    g.lineStyle(10, tint, 0.28);
    g.beginPath(); g.moveTo(tip.x, tip.y); g.lineTo(px, py); g.strokePath();
    // rungs travelling UP the beam, so the direction of the pull is
    // visible rather than something you infer from being dragged
    for (var i = 0; i < 6; i++) {
      var k = ((t * 0.9 + i / 6) % 1);
      var bx = px + (tip.x - px) * k, by = py + (tip.y - py) * k;
      g.fillStyle(tint, 0.55 * (1 - k) + 0.2);
      g.fillCircle(bx, by, 4 + 3 * (1 - k));
    }
  };

  // ---- the goop puddles ------------------------------------------------
  PC.ChompArms.prototype._goop = function (dt, g, powered) {
    var s = this.scene;
    for (var i = this.goop.length - 1; i >= 0; i--) {
      var p = this.goop[i];
      p.life -= dt;
      if (p.life <= 0 || powered) { this.goop.splice(i, 1); continue; }
      var fade = Math.min(1, p.life / 1.2);
      var wob = 1 + Math.sin(s.now * 1.7 + p.seed) * 0.04;
      g.fillStyle(0x3f8a4c, 0.42 * fade);
      g.fillEllipse(p.x, p.y, GOOP_R * 2 * wob, GOOP_R * 1.35 * wob);
      g.fillStyle(0xa8e04a, 0.30 * fade);
      g.fillEllipse(p.x, p.y, GOOP_R * 1.5 * wob, GOOP_R * 0.95 * wob);
      g.fillStyle(0xb4f2a8, 0.30 * fade);
      g.fillEllipse(p.x - GOOP_R * 0.3, p.y - GOOP_R * 0.2, GOOP_R * 0.4, GOOP_R * 0.22);
      var dx = s.px - p.x, dy = (s.py - p.y) / 0.7;
      if (dx * dx + dy * dy < GOOP_R * GOOP_R) s.armSlow = GOOP_SLOW;
    }
  };

  // ---- feed pipes and cables from the roof into the machine ----
  PC.ChompArms.prototype._tethers = function (g, c, powered) {
    var L = this.scene.region && this.scene.region.layout;
    if (!L || !L.roof) return;
    var r = L.roof.rect, t = this.scene.now;
    var anchors = [
      { x: r.x + 150, y: r.y + 210 }, { x: r.x + r.w - 150, y: r.y + 210 },
      { x: r.x + 260, y: r.y + r.h - 260 }, { x: r.x + r.w - 260, y: r.y + r.h - 260 },
      { x: r.x + r.w / 2, y: r.y + 130 },
    ];
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var sway = powered ? 0 : Math.sin(t * 0.8 + i * 1.3) * 5;
      // the sag point: pipes hang, they do not run straight
      var mx = (a.x + c.x) / 2 + sway;
      var my = (a.y + c.y) / 2 + 34 + Math.sin(t * 0.6 + i) * 3;
      // thick pipe: dark casing, then a lit core line on top of it
      g.lineStyle(11, 0x2a2733, 1);
      g.beginPath(); g.moveTo(a.x, a.y);
      g.lineTo(mx, my); g.lineTo(c.x, c.y + 10); g.strokePath();
      g.lineStyle(7, 0x4a4760, 1);
      g.beginPath(); g.moveTo(a.x, a.y);
      g.lineTo(mx, my); g.lineTo(c.x, c.y + 10); g.strokePath();
      g.lineStyle(2, 0x6d6a8e, 0.9);                 // top-left highlight
      g.beginPath(); g.moveTo(a.x, a.y - 3);
      g.lineTo(mx, my - 3); g.lineTo(c.x, c.y + 7); g.strokePath();
      // a slack cable alongside, thinner and sagging further
      g.lineStyle(2, 0x15131c, 0.9);
      g.beginPath(); g.moveTo(a.x + 9, a.y + 4);
      g.lineTo(mx + 9, my + 16); g.lineTo(c.x + 8, c.y + 14); g.strokePath();
      // the amber pulse travelling INTO the machine, so the wires read
      // as feeding it rather than as scenery
      if (!powered) {
        var k = ((t * 0.35 + i * 0.2) % 1);
        var px = a.x + (c.x - a.x) * k, py = a.y + (c.y + 10 - a.y) * k + Math.sin(k * Math.PI) * 30;
        g.fillStyle(0xf2a03c, 0.75);
        g.fillCircle(px, py, 3);
      }
      // socket collar where it enters the roof
      g.fillStyle(0x4a4760, 1); g.fillCircle(a.x, a.y, 8);
      g.fillStyle(0xe0b232, 1); g.fillCircle(a.x, a.y, 4);
    }
  };

  PC.ChompArms.prototype._draw = function (g, a, powered) {
    var s = this.scene;
    var hurt = s.now < a.flash;
    var reach = REACH * a.ext, mnt = this.mountOf(a);
    var pts = [];
    for (var k = 0; k <= SEG; k++) {
      var f = k / SEG;
      // a slight elbow bend so it reads as jointed, not a stick
      var bend = Math.sin(f * Math.PI) * 0.16;
      var ang = a.ang + bend * (a.i % 2 ? 1 : -1);
      pts.push({ x: mnt.x + Math.cos(ang) * reach * f,
                 y: mnt.y + Math.sin(ang) * reach * YSQ * f });
    }
    // the socket the boom swings out of, so it is bolted to the plinth
    // rather than sprouting from the middle of the body
    g.fillStyle(0x15131c, 1); g.fillCircle(mnt.x, mnt.y, 17);
    g.fillStyle(0xa8791c, 1); g.fillCircle(mnt.x, mnt.y, 13);
    g.fillStyle(0xe0b232, 1); g.fillCircle(mnt.x - 2, mnt.y - 2, 8);
    // shadow on the deck
    g.fillStyle(0x0a0716, 0.30);
    for (var sh = 1; sh <= SEG; sh++) {
      g.fillEllipse(pts[sh].x, pts[sh].y + 16, 34 - sh * 4, 12);
    }
    // boom segments, each a lozenge with a lit top edge
    for (var i2 = 0; i2 < SEG; i2++) {
      var p0 = pts[i2], p1 = pts[i2 + 1];
      var w = 19 - i2 * 3;          // heavier booms at the +30% scale
      g.lineStyle(w + 4, 0x15131c, 1);
      g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.strokePath();
      g.lineStyle(w, hurt ? 0xffffff : 0xc9c1a8, 1);
      g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.strokePath();
      g.lineStyle(Math.max(2, w - 8), 0xe8e2cc, 0.9);
      g.beginPath(); g.moveTo(p0.x, p0.y - 2); g.lineTo(p1.x, p1.y - 2); g.strokePath();
      // gold hinge at every joint
      g.fillStyle(0x15131c, 1); g.fillCircle(p1.x, p1.y, w * 0.52);
      g.fillStyle(0xe0b232, 1); g.fillCircle(p1.x, p1.y, w * 0.36);
      g.fillStyle(0xffd977, 1); g.fillCircle(p1.x - 1, p1.y - 1, w * 0.16);
    }
    // the head is the arm's IDENTITY - four different tools, so which
    // boom is which is legible at a glance from across the roof
    this._head(g, a, pts[SEG], hurt, powered);
    // health pip under the tip, so a kid can see it is a target
    var tip = pts[SEG];
    var f2 = Math.max(0, a.hp / a.maxHp);
    g.fillStyle(0x15131c, 0.8); g.fillRect(tip.x - 22, tip.y + 30, 44, 5);
    g.fillStyle(f2 > 0.4 ? 0xa8e04a : 0xff6b6b, 1);
    g.fillRect(tip.x - 21, tip.y + 31, 42 * f2, 3);
  };

  // ---- the four heads --------------------------------------------------
  PC.ChompArms.prototype._head = function (g, a, tip, hurt, powered) {
    var s = this.scene, tint = hurt ? 0xffffff : a.role.tint;
    var live = !powered;
    // the shared mount every tool bolts onto
    g.fillStyle(0x15131c, 1); g.fillRect(tip.x - 20, tip.y - 14, 40, 28);
    g.fillStyle(0x4a4760, 1); g.fillRect(tip.x - 17, tip.y - 11, 34, 22);
    g.fillStyle(0x6d6a8e, 1); g.fillRect(tip.x - 17, tip.y - 11, 34, 4);

    if (a.role.k === 'blender') {
      // SPINNING BLADE ROTOR. Four blades on a real rotation, plus a
      // faint blur disc behind them so it reads as fast rather than as
      // four triangles that happen to be at an angle (Mark: "have those
      // blades at the end spinning").
      g.fillStyle(0x8f2f2c, live ? 0.22 : 0.08);
      g.fillCircle(tip.x, tip.y, 46);
      for (var b = 0; b < 4; b++) {
        var ang = a.spin + (b / 4) * Math.PI * 2;
        var ca = Math.cos(ang), sa = Math.sin(ang) * 0.72;
        var nx = -Math.sin(ang) * 9, ny = Math.cos(ang) * 9 * 0.72;
        g.fillStyle(0x15131c, 1);
        g.fillTriangle(tip.x + nx, tip.y + ny, tip.x - nx, tip.y - ny,
                       tip.x + ca * 44, tip.y + sa * 44);
        g.fillStyle(hurt ? 0xffffff : 0xe8e2cc, 1);
        g.fillTriangle(tip.x + nx * 0.7, tip.y + ny * 0.7,
                       tip.x - nx * 0.7, tip.y - ny * 0.7,
                       tip.x + ca * 40, tip.y + sa * 40);
        g.fillStyle(0xff6b6b, live ? 0.9 : 0.3);      // hazard edge
        g.fillCircle(tip.x + ca * 40, tip.y + sa * 40, 3);
      }
      g.fillStyle(0x15131c, 1); g.fillCircle(tip.x, tip.y, 10);
      g.fillStyle(tint, live ? 1 : 0.3); g.fillCircle(tip.x, tip.y, 6);
      return;
    }

    if (a.role.k === 'server') {
      // a cannon: a barrel pointing where it last fired, and a slowly
      // turning intake fan feeding it
      var aim = Math.atan2(s.py - tip.y, s.px - tip.x);
      var bx = Math.cos(aim), by = Math.sin(aim) * 0.72;
      g.lineStyle(17, 0x15131c, 1);
      g.beginPath(); g.moveTo(tip.x, tip.y); g.lineTo(tip.x + bx * 34, tip.y + by * 34); g.strokePath();
      g.lineStyle(11, 0xc9c1a8, 1);
      g.beginPath(); g.moveTo(tip.x, tip.y); g.lineTo(tip.x + bx * 32, tip.y + by * 32); g.strokePath();
      g.fillStyle(0x15131c, 1); g.fillCircle(tip.x + bx * 34, tip.y + by * 34, 8);
      g.fillStyle(tint, live ? (a.state ? 1 : 0.55) : 0.2);
      g.fillCircle(tip.x + bx * 34, tip.y + by * 34, 5);
      for (var f = 0; f < 3; f++) {                    // the intake fan
        var fa = a.spin + (f / 3) * Math.PI * 2;
        g.lineStyle(5, 0x8b88a8, 0.9);
        g.beginPath(); g.moveTo(tip.x, tip.y);
        g.lineTo(tip.x + Math.cos(fa) * 16, tip.y + Math.sin(fa) * 16 * 0.72);
        g.strokePath();
      }
      g.fillStyle(0xe0b232, 1); g.fillCircle(tip.x, tip.y, 5);
      return;
    }

    if (a.role.k === 'magnet') {
      // a dish. Two arcs and an emitter pip, with the dish ring turning
      // slowly so it is alive even between pulls.
      var pull = a.state === 'pull';
      for (var d = 0; d < 2; d++) {
        g.lineStyle(6 - d * 2, d ? 0x8b88a8 : 0x15131c, 1);
        g.strokeCircle(tip.x, tip.y, 30 - d * 3);
      }
      for (var k2 = 0; k2 < 5; k2++) {                 // rotating dish ribs
        var ra = a.spin + (k2 / 5) * Math.PI * 2;
        g.lineStyle(3, 0x6d6a8e, 0.85);
        g.beginPath(); g.moveTo(tip.x, tip.y);
        g.lineTo(tip.x + Math.cos(ra) * 27, tip.y + Math.sin(ra) * 27 * 0.72);
        g.strokePath();
      }
      g.fillStyle(0x15131c, 1); g.fillCircle(tip.x, tip.y, 11);
      g.fillStyle(tint, live ? (pull ? 1 : 0.5 + 0.3 * Math.sin(s.now * 3)) : 0.2);
      g.fillCircle(tip.x, tip.y, 7);
      if (pull) { g.lineStyle(3, tint, 0.5); g.strokeCircle(tip.x, tip.y, 34 + 8 * Math.sin(s.now * 9)); }
      return;
    }

    // SAUCER: a nozzle with a drum of goop above it, spinning, and a
    // drip hanging off the lip between sprays
    g.fillStyle(0x15131c, 1); g.fillCircle(tip.x, tip.y - 4, 20);
    g.fillStyle(0x3f8a4c, 1); g.fillCircle(tip.x, tip.y - 4, 16);
    for (var q = 0; q < 4; q++) {
      var qa = a.spin + (q / 4) * Math.PI * 2;
      g.fillStyle(0x7dd97b, 0.85);
      g.fillCircle(tip.x + Math.cos(qa) * 9, tip.y - 4 + Math.sin(qa) * 9 * 0.72, 4);
    }
    g.fillStyle(0x15131c, 1); g.fillRect(tip.x - 7, tip.y + 8, 14, 12);
    g.fillStyle(tint, live ? 1 : 0.3); g.fillRect(tip.x - 5, tip.y + 10, 10, 8);
    if (live) {
      var drip = (s.now * 0.8 + a.i) % 1;
      g.fillStyle(0xa8e04a, 0.8 * (1 - drip));
      g.fillCircle(tip.x, tip.y + 20 + drip * 16, 4);
    }
  };

  PC.ChompArms.prototype._drawDead = function (g, a) {
    var s = this.scene;
    // a dead boom hangs from its socket: shorter, drooped, dark, and it
    // sparks now and then so the kill stays readable for the rest of
    // the fight
    var reach = REACH * 0.42, mnt = this.mountOf(a);
    var ang = a.rest + 0.55 * (a.i % 2 ? 1 : -1);
    var ex = mnt.x + Math.cos(ang) * reach;
    var ey = mnt.y + Math.sin(ang) * reach * YSQ + 34;
    g.fillStyle(0x0a0716, 0.25);
    g.fillEllipse(ex, ey + 14, 26, 10);
    g.lineStyle(13, 0x15131c, 1);
    g.beginPath(); g.moveTo(mnt.x, mnt.y); g.lineTo(ex, ey); g.strokePath();
    g.lineStyle(9, 0x3a3448, 1);
    g.beginPath(); g.moveTo(mnt.x, mnt.y); g.lineTo(ex, ey); g.strokePath();
    g.fillStyle(0x22202c, 1); g.fillRect(ex - 18, ey - 10, 36, 20);
    g.fillStyle(0x15131c, 1); g.fillCircle(ex, ey, 6);
    if (Math.sin(s.now * 7 + a.i * 2) > 0.93) {
      g.fillStyle(0x35d0ff, 0.9); g.fillCircle(ex + 3, ey - 4, 2);
    }
  };

  PC.ChompArms.prototype.destroy = function () {
    this.scene.armSlow = 1;
    this.g.destroy();
  };
})();
