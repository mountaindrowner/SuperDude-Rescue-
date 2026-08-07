// chomp_arms.js - THE BOOM ARMS + THE TETHERS (v0.54.0).
//
// Mark: "more extended tubes and wires leading to him would improve his
// design" and "add the arm segments as well to the fight".
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
window.PC = window.PC || {};
(function () {

  var SEG = 3;                     // segments per boom
  var REACH = 250;                 // fully extended, world px
  var SWEEP = 0.55;                // radians either side of rest
  var ARM_HP = 900;

  // resting angles: two forward, two back, so the pair nearest the
  // player is always the pair you want to shoot
  var REST = [-2.45, -0.70, 0.70, 2.45];

  PC.ChompArms = function (scene, chomp) {
    this.scene = scene;
    this.chomp = chomp;
    this.g = scene.add.graphics().setDepth(17);       // under the body
    this.arms = [];
    var ez = PC.ease ? PC.ease(scene) : null;
    var hp = Math.round(ARM_HP * ((ez && ez.bossHp) || 1));
    for (var i = 0; i < 4; i++) {
      this.arms.push({
        i: i, rest: REST[i], ang: REST[i], hp: hp, maxHp: hp,
        dead: false, t: Math.random() * 6, ext: 0.75, flash: 0,
        deathT: 0,
      });
    }
  };

  PC.ChompArms.prototype.alive = function () {
    var n = 0;
    for (var i = 0; i < this.arms.length; i++) if (!this.arms[i].dead) n++;
    return n;
  };

  // where an arm's damageable tip sits right now
  PC.ChompArms.prototype.tipOf = function (a) {
    var c = this.chomp;
    var r = REACH * a.ext;
    return { x: c.x + Math.cos(a.ang) * r, y: c.y + Math.sin(a.ang) * r * 0.62 };
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
    if (best.hp <= 0) this._kill(best);
    return true;
  };

  PC.ChompArms.prototype._kill = function (a) {
    a.dead = true;
    a.deathT = this.scene.now;
    var t = this.tipOf(a), s = this.scene;
    if (s.fx) s.fx.burst(t.x, t.y, 'fx_spark', 18, 0.5);
    s.cameras.main.shake(220, 0.006);
    if (PC.audio && PC.audio.bossHit) PC.audio.bossHit();
    var left = this.alive();
    if (s.floatText) {
      s.floatText(left ? 'ARM DOWN - ' + left + ' LEFT' : 'ALL ARMS DOWN!',
        left ? 0xf2c33c : 0xa8e04a);
    }
    if (!left && s.onChompArmsCleared) s.onChompArmsCleared();
  };

  PC.ChompArms.prototype.update = function (dt) {
    var s = this.scene, c = this.chomp, g = this.g;
    g.clear();
    if (!c || c.dead) return;
    var powered = c.powering;

    this._tethers(g, c, powered);

    for (var i = 0; i < this.arms.length; i++) {
      var a = this.arms[i];
      a.t += dt;
      if (a.dead) { this._drawDead(g, a); continue; }
      // a slow sweep, each arm on its own phase so they never march in
      // step - the two-clock rule from the VFX notes
      if (!powered) {
        a.ang = a.rest + Math.sin(a.t * 0.55 + a.i) * SWEEP;
        a.ext = 0.72 + Math.sin(a.t * 0.9 + a.i * 1.7) * 0.16;
      }
      this._draw(g, a, powered);
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
    var c = this.chomp, s = this.scene;
    var hurt = s.now < a.flash;
    var reach = REACH * a.ext;
    var pts = [];
    for (var k = 0; k <= SEG; k++) {
      var f = k / SEG;
      // a slight elbow bend so it reads as jointed, not a stick
      var bend = Math.sin(f * Math.PI) * 0.16;
      var ang = a.ang + bend * (a.i % 2 ? 1 : -1);
      pts.push({ x: c.x + Math.cos(ang) * reach * f,
                 y: c.y + Math.sin(ang) * reach * 0.62 * f });
    }
    // shadow on the deck
    g.fillStyle(0x0a0716, 0.30);
    for (var sh = 1; sh <= SEG; sh++) {
      g.fillEllipse(pts[sh].x, pts[sh].y + 16, 34 - sh * 4, 12);
    }
    // boom segments, each a lozenge with a lit top edge
    for (var i2 = 0; i2 < SEG; i2++) {
      var p0 = pts[i2], p1 = pts[i2 + 1];
      var w = 15 - i2 * 3;
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
    // THE TIP: a panel wing and the lamp that goes out when it dies
    var tip = pts[SEG];
    g.fillStyle(0x15131c, 1); g.fillRect(tip.x - 26, tip.y - 15, 52, 30);
    g.fillStyle(0x3f8a4c, 1); g.fillRect(tip.x - 23, tip.y - 12, 46, 24);
    g.fillStyle(0x7dd97b, 1); g.fillRect(tip.x - 23, tip.y - 12, 46, 4);
    for (var pw = -18; pw < 20; pw += 9) {            // panel ribs
      g.fillStyle(0x2a5c33, 1); g.fillRect(tip.x + pw, tip.y - 10, 2, 20);
    }
    var lamp = 0.6 + 0.4 * Math.sin(s.now * 3 + a.i);
    g.fillStyle(0x15131c, 1); g.fillCircle(tip.x, tip.y, 8);
    g.fillStyle(hurt ? 0xffffff : 0xf2a03c, powered ? 0.25 : lamp);
    g.fillCircle(tip.x, tip.y, 5);
    // health pip under the tip, so a kid can see it is a target
    var f2 = Math.max(0, a.hp / a.maxHp);
    g.fillStyle(0x15131c, 0.8); g.fillRect(tip.x - 22, tip.y + 20, 44, 5);
    g.fillStyle(f2 > 0.4 ? 0xa8e04a : 0xff6b6b, 1);
    g.fillRect(tip.x - 21, tip.y + 21, 42 * f2, 3);
  };

  PC.ChompArms.prototype._drawDead = function (g, a) {
    var c = this.chomp, s = this.scene;
    // a dead boom hangs from its socket: shorter, drooped, dark, and it
    // sparks now and then so the kill stays readable for the rest of
    // the fight
    var reach = REACH * 0.42;
    var ang = a.rest + 0.55 * (a.i % 2 ? 1 : -1);
    var ex = c.x + Math.cos(ang) * reach;
    var ey = c.y + Math.sin(ang) * reach * 0.62 + 34;
    g.fillStyle(0x0a0716, 0.25);
    g.fillEllipse(ex, ey + 14, 26, 10);
    g.lineStyle(13, 0x15131c, 1);
    g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(ex, ey); g.strokePath();
    g.lineStyle(9, 0x3a3448, 1);
    g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(ex, ey); g.strokePath();
    g.fillStyle(0x22202c, 1); g.fillRect(ex - 18, ey - 10, 36, 20);
    g.fillStyle(0x15131c, 1); g.fillCircle(ex, ey, 6);
    if (Math.sin(s.now * 7 + a.i * 2) > 0.93) {
      g.fillStyle(0x35d0ff, 0.9); g.fillCircle(ex + 3, ey - 4, 2);
    }
  };

  PC.ChompArms.prototype.destroy = function () { this.g.destroy(); };
})();
