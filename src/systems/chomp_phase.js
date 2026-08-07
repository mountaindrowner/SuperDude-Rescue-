// chomp_phase.js - THE PHASE TRANSITION AS A MOMENT (v0.60.0).
//
// Mark: "we also didn't have phases in the fight with boss model
// changes? cinematic moments? difficulty spikes?"
//
// The phases were real - separate baked body art per phase, a size
// escalation, cadence that tightened, a line of dialogue - but they
// went past in a shake and a flash, so they did not READ as phases.
// A boss doc transition (1.9) is supposed to do four jobs at once:
// drama, a free heal window, a hard reset of the player's rhythm, and
// an announcement that the rules just changed. Only the middle two were
// landing.
//
// So a gate now takes the camera. The world stops, the shot pushes in
// on CHOMP, it rears up and SLAMS every boom into the deck, a title
// card names the phase, it says something, and the camera hands back.
// About three seconds - long enough to be an event, short enough that
// it is not a cutscene you resent on the third attempt (2.3.8).
//
// It runs on the SAME storyPause the dialogue uses, so every attack
// system already stops for it - the moveset returns early on
// storyPause, the arms skip their roles, and the transition grace does
// not begin ticking until the camera is back.
window.PC = window.PC || {};
(function () {

  // what the player is being told just changed. Kept short - this is a
  // banner on a phone, not a paragraph.
  var CARD = {
    2: { title: 'SECOND HELPINGS', line: 'You have barely eaten!' },
    3: { title: 'EVERYTHING ON THE MENU', line: 'I made it ALL for you!' },
  };

  var PUSH = 0.35;                 // s, camera moves in
  var SLAM = 0.55;                 // s, the booms come down
  var HOLD = 2.35;                 // s, card is up
  var BACK = 2.95;                 // s, camera returns
  var END = 3.30;

  PC.ChompPhaseBeat = function (scene, chomp, n) {
    var W = PC.RENDER.W;
    this.scene = scene; this.chomp = chomp; this.n = n;
    this.t = 0; this.done = false; this.slammed = false;
    scene.storyPause = true;
    var cam = scene.cameras.main;
    cam.stopFollow();
    this._zoomFrom = scene.zoomTarget || cam.zoom;
    scene.zoomTarget = this._zoomFrom * 1.28;         // push in on it

    var card = CARD[n] || { title: 'PHASE ' + n, line: '' };
    // WORLD SPACE, re-anchored to the camera every frame (see _lay).
    //
    // The obvious route - screen space parented to scene.ui, the way the
    // HUD does it - does not work here: the game re-positions that
    // container from cameras.main.worldView at the TOP of update, and
    // this beat moves the camera afterwards, so the card lands a frame
    // behind a camera that is travelling several hundred px. Anchoring
    // to the live camera rect instead is immune to the ordering, and it
    // is verifiable by sampling pixels.
    this.g = scene.add.graphics().setDepth(400);
    this.tPhase = scene.add.text(0, 0, 'PHASE ' + n, {
      fontFamily: 'monospace', fontSize: PC.uiK(9) + 'px',
      color: '#ff3ea5', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(402);
    this.tTitle = scene.add.text(0, 0, card.title, {
      fontFamily: 'monospace', fontSize: PC.uiK(17) + 'px',
      color: '#ffd977', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(402);
    this.tLine = scene.add.text(0, 0, card.line, {
      fontFamily: 'monospace', fontSize: PC.uiK(10) + 'px',
      color: '#e8e2cc',
    }).setOrigin(0.5).setDepth(402);
    void W;
    this._lay(0);
  };

  PC.ChompPhaseBeat.prototype._lay = function (a) {
    if (!this.g) return;
    var cam = this.scene.cameras.main, v = cam.worldView;
    // hold a constant ON-SCREEN size however far the shot has pushed in
    var k = (this.scene.baseZoom || cam.zoom) / cam.zoom;
    var W = v.width, H = v.height;
    var cx = v.x + W / 2, y = v.y + H * 0.34;
    var slide = (1 - a) * PC.uiK(14) * k;             // drops in from above
    var U = function (n) { return PC.uiK(n) * k; };
    this.g.clear();
    this.tPhase.setScale(k); this.tTitle.setScale(k); this.tLine.setScale(k);
    this.tPhase.setPosition(cx, y - U(16) + slide);
    this.tTitle.setPosition(cx, y - U(2) + slide);
    this.tLine.setPosition(cx, y + U(15) + slide);
    if (a <= 0) { this.tPhase.setAlpha(0); this.tTitle.setAlpha(0); this.tLine.setAlpha(0); return; }
    // a letterbox pair plus a banner plate, all magenta-edged because
    // this IS the "the rules changed, move" colour
    this.g.fillStyle(0x0a0716, 0.55 * a);
    this.g.fillRect(v.x, v.y, W, H * 0.20 * a);
    this.g.fillRect(v.x, v.y + H - H * 0.20 * a, W, H * 0.20 * a);
    this.g.fillStyle(0x1b1530, 0.92 * a);
    this.g.fillRect(v.x, y - U(26) + slide, W, U(56));
    this.g.fillStyle(0xff3ea5, 0.95 * a);
    this.g.fillRect(v.x, y - U(26) + slide, W, U(2));
    this.g.fillRect(v.x, y + U(28) + slide, W, U(2));
    this.tPhase.setAlpha(a); this.tTitle.setAlpha(a); this.tLine.setAlpha(a);
  };

  PC.ChompPhaseBeat.prototype.update = function (dt) {
    var s = this.scene, c = this.chomp, cam = s.cameras.main;
    this.t += dt;
    var t = this.t;

    // ---- the shot: in on CHOMP, then back to the player ----
    var k = Math.min(1, t / PUSH);
    var ease = k * k * (3 - 2 * k);
    if (t < BACK) {
      cam.centerOn(c.x + (s.px - c.x) * (1 - ease), c.y - 40 + (s.py - (c.y - 40)) * (1 - ease));
    } else {
      var kb = Math.min(1, (t - BACK) / (END - BACK));
      var eb = kb * kb * (3 - 2 * kb);
      cam.centerOn(c.x + (s.px - c.x) * eb, (c.y - 40) + (s.py - (c.y - 40)) * eb);
      s.zoomTarget = this._zoomFrom * (1.28 + (1 - 1.28) * eb);
    }

    // ---- the slam: every boom drives into the deck at once ----
    if (t >= SLAM && !this.slammed) {
      this.slammed = true;
      if (c.arms) {
        for (var i = 0; i < c.arms.arms.length; i++) {
          var a = c.arms.arms[i];
          if (a.dead) continue;
          a.ext = 1.0;                                // punched out full
          var tip = c.arms.tipOf(a);
          if (s.fx) s.fx.burst(tip.x, tip.y, 'fx_spark', 14, 0.55);
        }
      }
      cam.shake(520, 0.020);
      cam.flash(240, 255, 62, 165, true);
      if (PC.audio && PC.audio.bossHit) PC.audio.bossHit();
      if (c.fig) c.fig.serving = 1.1;                 // mouth gapes wide
    }
    // it rears: the body lifts on the push-in and settles on the way out
    if (c.fig) {
      var rear = t < BACK ? Math.min(1, t / PUSH) : Math.max(0, 1 - (t - BACK) / 0.35);
      c.fig.rise = 1 + rear * 0.10;
    }

    // ---- the card ----
    var a2 = t < PUSH ? 0
      : t < SLAM ? (t - PUSH) / (SLAM - PUSH)
      : t < HOLD ? 1
      : t < BACK ? 1 - (t - HOLD) / (BACK - HOLD) : 0;
    this._lay(Math.max(0, Math.min(1, a2)));

    if (t >= END) this.finish();
  };

  PC.ChompPhaseBeat.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    var s = this.scene, cam = s.cameras.main;
    s.storyPause = false;
    s.zoomTarget = this._zoomFrom;
    if (this.chomp.fig) this.chomp.fig.rise = 1;
    cam.startFollow(s.player, true, PC.RENDER.CAMERA_LERP, PC.RENDER.CAMERA_LERP);
    this.destroy();
    // the grace window starts NOW, not while the camera was busy - the
    // free breathing beat is supposed to be playable time
    this.chomp.graceT = 1.5;
    if (s.onChompPhase) s.onChompPhase(this.n);
  };

  PC.ChompPhaseBeat.prototype.destroy = function () {
    if (this.g) this.g.destroy();
    if (this.tPhase) this.tPhase.destroy();
    if (this.tTitle) this.tTitle.destroy();
    if (this.tLine) this.tLine.destroy();
    this.g = this.tPhase = this.tTitle = this.tLine = null;
  };
})();
