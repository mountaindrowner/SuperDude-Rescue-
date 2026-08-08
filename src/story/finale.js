// finale.js - THE ENDING (v0.68.0).
//
// Mark: "as you defeat the boss, it's like explosions and all kinds of
// effects. Add a lot of details to it, so it feels special."
//
// The last hole in the campaign. Until now CHOMP powered down into two
// dialogue lines and a code path that would have CRASHED (the Frank
// celebration tweens b.sprite and hides b.tele - CHOMP has neither).
//
// The sequence, ~9s of spectacle then the story's landing:
//   BOOMS    0.0-3.6  a chain of escalating explosions walks across the
//                     machine; the four arms blow out one by one; the
//                     five roof tethers SNAP one by one
//   THE BIG ONE  3.6  full white flash, the hardest shake in the game,
//                     a steam gush from every vent
//   QUIET    4.6-6.2  smoke thins, it sinks, the lenses go dark -
//                     CHOMP STOPPED card
//   FIREWORKS 6.2-8.8 pastel bursts over the roof + a coin rain
//   then: the dialogue that lands the theme ("...did I... not help?"),
//   the CAMPAIGN COMPLETE card, the campaignComplete flag, and the
//   mission close through quest.onBossDown() - the same path every
//   other mission ends on.
//
// Driven from the storyPause block in game.js, exactly like the phase
// cinematic - a system that stops the world must be driven from inside
// the stop (the v0.60.0 lesson, twice-learned).
window.PC = window.PC || {};
(function () {

  var PASTELS = [0xff9ecb, 0xffd977, 0x9be8ff, 0xb4f2a8, 0xc9a8ff, 0x35d0ff];

  var BOOMS = 3.6, BIG = 3.6, QUIET = 4.6, CARD = 5.2, FIRE = 6.2, END = 8.8;

  PC.ChompFinale = function (scene, chomp) {
    this.scene = scene; this.chomp = chomp;
    this.t = 0; this.done = false;
    this.boomAcc = 0; this.fireAcc = 0; this.coinAcc = 0;
    this.armN = 0; this.tetherN = 0; this.bigDone = false;
    scene.storyPause = true;
    var cam = scene.cameras.main;
    cam.stopFollow();
    this._zoomFrom = scene.zoomTarget || cam.zoom;
    scene.zoomTarget = this._zoomFrom * 1.22;
    this.g = scene.add.graphics().setDepth(400);
    this.tCard = scene.add.text(0, 0, 'CHOMP STOPPED!', {
      fontFamily: 'monospace', fontSize: PC.uiK(18) + 'px',
      color: '#ffd977', fontStyle: 'bold', stroke: '#0b0818', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(402).setAlpha(0);
    if (PC.audio && PC.audio.bossDie) PC.audio.bossDie();
  };

  // a point somewhere on the machine's body, in world space
  PC.ChompFinale.prototype._bodyPt = function () {
    var c = this.chomp;
    var a = Math.random() * Math.PI * 2, r = Math.random() * c.r * 0.9;
    return { x: c.x + Math.cos(a) * r, y: c.y - 60 + Math.sin(a) * r * 1.3 };
  };

  PC.ChompFinale.prototype.update = function (dt) {
    var s = this.scene, c = this.chomp, cam = s.cameras.main;
    this.t += dt;
    var t = this.t;
    cam.centerOn(c.x, c.y - 60);

    // ---- THE BOOM CHAIN: escalating, walking across the body ----
    if (t < BOOMS) {
      this.boomAcc -= dt;
      if (this.boomAcc <= 0) {
        this.boomAcc = 0.30 - t * 0.05;                // faster and faster
        var p = this._bodyPt();
        var big = 1 + t * 0.5;
        if (s.fx) {
          s.fx.burst(p.x, p.y, 'fx_pop', Math.round(5 * big), 0.5 * big);
          s.fx.burst(p.x, p.y, 'fx_spark', Math.round(4 * big), 0.45 * big);
        }
        cam.shake(120, 0.004 + t * 0.002);
        if (PC.audio && PC.audio.splat) PC.audio.splat();
      }
      // the ARMS blow out one by one
      var wantArms = Math.min(4, Math.floor(t / 0.7) + (t > 0.4 ? 1 : 0));
      while (this.armN < wantArms && c.arms) {
        var a2 = c.arms.arms[this.armN++];
        if (a2 && !a2.dead) {
          a2.dead = true;
          var tip = c.arms.tipOf(a2);
          if (s.fx) s.fx.burst(tip.x, tip.y, 'fx_spark', 16, 0.6);
          cam.shake(200, 0.007);
        }
      }
      // the TETHERS snap one by one, whipping sparks at the socket
      var wantTethers = Math.min(5, Math.floor((t - 0.8) / 0.55));
      while (this.tetherN < wantTethers && c.arms && c.arms._anchors) {
        var an = c.arms._anchors[this.tetherN];
        c.arms.snapped = ++this.tetherN;
        if (an && s.fx) {
          s.fx.burst(an.x, an.y, 'fx_spark', 10, 0.5);
          s.fx.burst((an.x + c.x) / 2, (an.y + c.y) / 2 + 20, 'fx_pop', 4, 0.35);
        }
        cam.shake(140, 0.005);
      }
    }

    // ---- THE BIG ONE ----
    if (t >= BIG && !this.bigDone) {
      this.bigDone = true;
      cam.flash(600, 255, 255, 255, true);
      cam.shake(700, 0.022);                            // the hardest in the game
      if (s.fx) {
        for (var bb = 0; bb < 10; bb++) {
          var bp = this._bodyPt();
          s.fx.burst(bp.x, bp.y, bb % 2 ? 'fx_nova' : 'fx_pop', 8, 0.9);
        }
      }
      if (PC.audio && PC.audio.bossDie) PC.audio.bossDie();
    }
    // the steam GUSH after the big one: every vent at full boil
    if (t >= BIG && t < QUIET + 0.6 && c.fig && c.fig.face) c.fig.face.emit = 0;

    // ---- CHOMP STOPPED card ----
    var v = cam.worldView;
    var k = (s.baseZoom || cam.zoom) / cam.zoom;
    this.g.clear();
    if (t >= CARD) {
      var a3 = Math.min(1, (t - CARD) / 0.5);
      this.g.fillStyle(0x0a0716, 0.35 * a3);
      this.g.fillRect(v.x, v.y, v.width, v.height * 0.16);
      this.g.fillRect(v.x, v.y + v.height * 0.84, v.width, v.height * 0.16);
      this.g.fillStyle(0xffd977, 0.9 * a3);
      this.g.fillRect(v.x, v.y + v.height * 0.30 - PC.uiK(20) * k, v.width, PC.uiK(2) * k);
      this.g.fillRect(v.x, v.y + v.height * 0.30 + PC.uiK(18) * k, v.width, PC.uiK(2) * k);
      this.tCard.setScale(k).setPosition(v.x + v.width / 2, v.y + v.height * 0.30).setAlpha(a3);
    }

    // ---- FIREWORKS + COIN RAIN over the roof ----
    if (t >= FIRE) {
      this.fireAcc -= dt;
      if (this.fireAcc <= 0) {
        this.fireAcc = 0.24;
        var fx2 = v.x + 40 + Math.random() * (v.width - 80);
        var fy2 = v.y + 40 + Math.random() * (v.height * 0.45);
        if (s.fx) {
          s.fx.burst(fx2, fy2, Math.random() < 0.5 ? 'fx_nova' : 'fx_levelup', 8, 0.7);
          s.fx.burst(fx2, fy2, 'fx_spark', 5, 0.5);
        }
        if (PC.audio && PC.audio.chest) PC.audio.chest();
      }
      this.coinAcc -= dt;
      if (this.coinAcc <= 0 && s.pickups) {
        this.coinAcc = 0.18;
        var ca = Math.random() * Math.PI * 2, cr = 40 + Math.random() * 130;
        s.pickups.drop(s.px + Math.cos(ca) * cr, s.py + Math.sin(ca) * cr, 'coin', 3);
      }
    }

    if (t >= END) this.finish();
  };

  PC.ChompFinale.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    var s = this.scene, cam = s.cameras.main;
    this.g.destroy(); this.tCard.destroy();
    s.zoomTarget = this._zoomFrom;
    cam.startFollow(s.player, true, PC.RENDER.CAMERA_LERP, PC.RENDER.CAMERA_LERP);
    s.chompFinale = null;
    s.chompEndingDialogue();                            // the story lands now
  };
})();
