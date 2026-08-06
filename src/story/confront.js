// confront.js - THE CONFRONTATION (v0.45.0, Mark: "our character moves
// up on its own, but it's like the playable animation... a cinematic
// that uses the gameplay engine, so it's the sprite that we play with").
//
// This is NOT PC_Cutscene. Nothing switches scenes, nothing is drawn in
// a separate art style: the camera, the world, the lighting and above
// all DANNY'S OWN WALK CYCLE are the ones the player has had their
// thumb on for the whole game. We simply take the stick away for
// ninety seconds and drive it ourselves.
//
// It arms when the player steps off the last stair onto the roof, and
// runs: WALK (Danny paces out to his mark) -> REVEAL (camera drifts up
// to CHOMP, who rises) -> TALK (the written finale lines, in the normal
// dialogue box, with portraits) -> BRACE (both sides square up) -> the
// boss fight takes over.
window.PC = window.PC || {};
(function () {

  var WALK_SPD = 0.75;               // fraction of normal speed: a walk,
                                     // not a jog - he is out of breath

  PC.Confront = function (scene) {
    this.scene = scene;
    this.state = 'idle';
    this.t = 0;
    this.vec = { x: 0, y: 0 };
    this.done = false;
    var L = scene.region && scene.region.layout;
    this.L = L;
    this.mark = (L && L.dannyMark) || null;
    this.chompAt = (L && L.chompMark) || null;
    this.chomp = null;
  };

  PC.Confront.prototype.armed = function () {
    return this.state !== 'idle' && this.state !== 'over';
  };

  // step onto the roof and it starts - no trigger volume to miss, the
  // roof IS the trigger
  PC.Confront.prototype.check = function () {
    if (this.state !== 'idle' || this.done) return;
    var L = this.L, s = this.scene;
    if (!L || !L.roof) return;
    var r = L.roof.rect;
    if (s.px < r.x || s.px > r.x + r.w || s.py < r.y || s.py > r.y + r.h) return;
    this.begin();
  };

  PC.Confront.prototype.begin = function () {
    var s = this.scene;
    this.state = 'walk';
    this.t = 0;
    // the roof is the boss and nothing else: clear the climb's crowd and
    // stop the director from feeding more
    if (s.enemies) s.enemies.clearAll();
    if (s.director) { this._dirUpd = s.director.update; s.director.update = function () {}; }
    if (s.hud && s.hud.setBanner) s.hud.setBanner('');
    this.chomp = new PC.ChompFigure(s, this.chompAt.x, this.chompAt.y);
    if (PC.audio && PC.audio.telegraph) PC.audio.telegraph();
  };

  // the drive vector game.js uses in place of the player's stick
  PC.Confront.prototype.driveVec = function () { return this.vec; };

  PC.Confront.prototype.update = function (dt) {
    if (this.state === 'idle' || this.state === 'over') return;
    var s = this.scene, self = this;
    this.t += dt;
    this.vec.x = 0; this.vec.y = 0;
    if (this.chomp) this.chomp.update(dt, this.state, this.t);

    if (this.state === 'walk') {
      // walk to the mark. Real movement through the real pipeline, so
      // the walk cycle, the facing and the footstep timing are all the
      // ones the player knows.
      var dx = this.mark.x - s.px, dy = this.mark.y - s.py;
      var d = Math.hypot(dx, dy);
      if (d > 26) {
        this.vec.x = (dx / d) * WALK_SPD;
        this.vec.y = (dy / d) * WALK_SPD;
      } else {
        this.state = 'reveal'; this.t = 0;
      }
      if (this.t > 20) { this.state = 'reveal'; this.t = 0; }   // never stick

    } else if (this.state === 'reveal') {
      // the camera leaves Danny and drifts up to what is waiting
      var cam = s.cameras.main;
      if (this.t < 0.05) {
        cam.stopFollow();
        this._camFrom = { x: s.px, y: s.py };
      }
      var k = Math.min(1, this.t / 2.6);
      var e = k * k * (3 - 2 * k);
      cam.centerOn(
        this._camFrom.x + (this.chompAt.x - this._camFrom.x) * e,
        this._camFrom.y + (this.chompAt.y - this._camFrom.y) * e);
      if (this.t > 3.4) { this.state = 'talk'; this.t = 0; this._talk(); }

    } else if (this.state === 'brace') {
      // THE WIDE SHOT: pull back until the pair of them share a frame -
      // the whole point of standing them 620px apart. The zoom is
      // restored on the way out so the fight starts at normal scale.
      var cam2 = s.cameras.main;
      if (this._baseZoom === undefined) {
        this._baseZoom = cam2.zoom;
        // the HUD lives in a world-space container pinned to the camera,
        // so zooming out shrinks it into the corner. For the wide shot
        // there is no HUD at all - which is what a wide shot wants.
        if (s.ui) s.ui.setVisible(false);
      }
      var k2 = Math.min(1, this.t / 1.8);
      var e2 = k2 * k2 * (3 - 2 * k2);
      cam2.setZoom(this._baseZoom * (1 - 0.48 * e2));
      cam2.centerOn(
        this.chompAt.x + (s.px - this.chompAt.x) * e2 * 0.5,
        this.chompAt.y + (s.py - this.chompAt.y) * e2 * 0.5 - 40 * (1 - e2));
      if (this.t > 3.0) this.finish();
    }
    void self;
  };

  // The dialogue is stepped HERE rather than through quest.playScript,
  // because a confrontation is shot/reverse-shot: the camera has to be
  // on whoever is speaking, and only this loop knows who that is.
  PC.Confront.prototype._talk = function () {
    var self = this, s = this.scene;
    var beats = (PC.STORY.scripts && PC.STORY.scripts.confront) || [];
    if (!beats.length || !s.quest || !s.quest.box) {
      this.state = 'brace'; this.t = 0; return;
    }
    s.storyPause = true;
    var i = 0;
    function step() {
      if (i >= beats.length) {
        s.storyPause = false;
        self.state = 'brace'; self.t = 0;
        return;
      }
      var b = beats[i++];
      if (!b.say) { step(); return; }
      // cut to the speaker
      var who = b.say.speaker === 'chomp' ? self.chompAt : { x: s.px, y: s.py };
      s.cameras.main.centerOn(who.x, who.y - (b.say.speaker === 'chomp' ? 90 : 0));
      s.quest.box.show(b.say, step);
    }
    step();
  };

  PC.Confront.prototype.finish = function () {
    var s = this.scene;
    this.state = 'over';
    this.done = true;
    this.vec.x = 0; this.vec.y = 0;
    var cam = s.cameras.main;
    if (this._baseZoom !== undefined) cam.setZoom(this._baseZoom);
    if (s.ui) s.ui.setVisible(true);
    cam.startFollow(s.player, true, PC.RENDER.CAMERA_LERP, PC.RENDER.CAMERA_LERP);
    // hand the roof over: the figure the player was just talking to
    // BECOMES the boss - no swap, no cut, the same object on screen
    if (PC.Chomp && !s.boss) {
      s.boss = new PC.Chomp(s, this.chompAt.x, this.chompAt.y, this.chomp);
      s.bossSpawned = true;
      this.chomp = null;              // the fight owns the figure now
      if (PC.AllySystem && !s.allies) s.allies = new PC.AllySystem(s);
      if (s.allies) s.allies.start();
      if (s.floatText) s.floatText('CHOMP', 0xe2574c);
    }
    if (this._dirUpd && s.director) s.director.update = this._dirUpd;
    if (s.onConfrontDone) s.onConfrontDone();
  };

  PC.Confront.prototype.destroy = function () {
    if (this.chomp) this.chomp.destroy();
  };

  // =====================================================================
  // CHOMP, drawn in-world. PLACEHOLDER FIGURE: real PixelLab art is the
  // next art job (3 phase forms + the powered-down pose). Built from the
  // silhouette the story needs - a food machine that grew: a big hopper
  // body, a serving chute for a mouth that reads as a grin, two conveyor
  // arms, and friendly round eyes. It has to look like it MEANS well.
  // =====================================================================
  PC.ChompFigure = function (scene, x, y) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.t = 0;
    this.rise = 0;                    // 0 = folded down, 1 = fully risen
    this.g = scene.add.graphics().setDepth(18);
  };

  PC.ChompFigure.prototype.update = function (dt, state, stateT) {
    this.t += dt;
    var target = (state === 'walk') ? 0 : 1;
    this.rise += (target - this.rise) * Math.min(1, dt * 1.4);
    var g = this.g, x = this.x, y = this.y, r = this.rise;
    var bob = Math.sin(this.t * 1.6) * 5 * r;
    g.clear();
    if (r < 0.02) return;

    var H = 216 * r, W = 176;
    var top = y - H + bob;

    // ---- shadow ----
    g.fillStyle(0x0a0716, 0.45);
    g.fillEllipse(x, y + 10, W * 1.05, 40);

    // ---- treads ----
    g.fillStyle(0x3a3746, 1); g.fillRect(x - W / 2, y - 34, W, 34);
    g.fillStyle(0x2a2733, 1);
    for (var tr = 0; tr < 7; tr++) g.fillRect(x - W / 2 + 6 + tr * 24, y - 31, 10, 28);

    // ---- hopper body ----
    g.fillStyle(0x8b88a8, 1);
    g.fillRoundedRect(x - W / 2, top, W, H - 40, 26);
    g.fillStyle(0x6d6a8e, 1);
    g.fillRoundedRect(x - W / 2 + 14, top + 16, W - 28, H - 90, 20);
    // riveted bands
    g.fillStyle(0x514e6b, 1);
    g.fillRect(x - W / 2, top + H * 0.42, W, 12);
    g.fillRect(x - W / 2, top + H * 0.62, W, 8);

    // ---- the chute: a wide grin ----
    var my = top + H * 0.60;
    g.fillStyle(0x15131c, 1);
    g.fillRoundedRect(x - 60, my, 120, 40, 11);
    g.fillStyle(0xf2c33c, 0.85);
    for (var tk = 0; tk < 6; tk++) g.fillRect(x - 51 + tk * 19, my + 3, 12, 11);
    g.fillStyle(0xa8e04a, 0.55 + 0.2 * Math.sin(this.t * 3));
    g.fillRect(x - 54, my + 29, 108, 5);

    // ---- eyes: round, lit, and far too cheerful ----
    var ey = top + H * 0.28;
    var blink = (Math.sin(this.t * 0.7) > 0.97) ? 0.15 : 1;
    g.fillStyle(0x15131c, 1);
    g.fillEllipse(x - 34, ey, 46, 46 * blink);
    g.fillEllipse(x + 34, ey, 46, 46 * blink);
    g.fillStyle(0x35d0ff, 1);
    g.fillEllipse(x - 34, ey, 29, 29 * blink);
    g.fillEllipse(x + 34, ey, 29, 29 * blink);
    g.fillStyle(0xffffff, 0.9);
    g.fillEllipse(x - 27, ey - 7, 10, 10 * blink);
    g.fillEllipse(x + 41, ey - 7, 10, 10 * blink);

    // ---- conveyor arms, held out like it wants a hug ----
    var ay = top + H * 0.46;
    var sway = Math.sin(this.t * 1.1) * 10;
    g.fillStyle(0x514e6b, 1);
    g.fillRoundedRect(x - W / 2 - 68, ay + sway, 72, 26, 10);
    g.fillRoundedRect(x + W / 2 - 4, ay - sway, 72, 26, 10);
    g.fillStyle(0x8b88a8, 1);
    g.fillRoundedRect(x - W / 2 - 82, ay + sway - 8, 34, 42, 10);
    g.fillRoundedRect(x + W / 2 + 48, ay - sway - 8, 34, 42, 10);

    // ---- the Ray, still socketed in its crown ----
    g.fillStyle(0xe2574c, 0.9);
    g.fillTriangle(x - 30, top + 6, x + 30, top + 6, x, top - 40);
    g.fillStyle(0xf2c33c, 0.5 + 0.3 * Math.sin(this.t * 4));
    g.fillCircle(x, top - 14, 11);
  };

  PC.ChompFigure.prototype.destroy = function () { this.g.destroy(); };
})();
