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

  // how far out the camera sits for the fight itself. 0.8 = a 20% wider
  // view than normal play (Mark: "zoom out ten percent... maybe even
  // twenty"). One knob, one place.
  PC.FIGHT_ZOOM = 0.8;

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
    // do NOT snap back to normal: the fight is played wider than the
    // rest of the game, and the wide shot eases straight into it
    if (this._baseZoom !== undefined) {
      s.baseZoom = this._baseZoom;
      s.zoomTarget = this._baseZoom * PC.FIGHT_ZOOM;
    }
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
  // CHOMP in the world. REAL ART now (v0.47.0 PixelLab batch): three
  // phase forms plus the powered-down pose, all built from the same
  // base machine so it is recognisably the same character getting
  // buried in its own generosity. The art brief was one line - IT MUST
  // NEVER LOOK EVIL - because the ending only lands if a child feels
  // sorry for it. Size escalates in code on top of the art, so phase 3
  // physically towers over phase 1.
  // =====================================================================
  var PHASE_ART = ['chomp_p1', 'chomp_p1', 'chomp_p2', 'chomp_p3'];
  // The art is 256 square and the fight camera shows ~250 world px, so
  // full scale would fill the screen edge to edge. These land phase 1 at
  // about two thirds of the frame and phase 3 nearly filling it - the
  // cauldron art holds its silhouette between phases on purpose (a
  // machine should not morph), so the GROWTH is carried here.
  var PHASE_SCALE = [0.7, 0.7, 0.82, 0.95];

  PC.ChompFigure = function (scene, x, y) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.t = 0;
    this.rise = 0;                    // 0 = folded down, 1 = fully risen
    this.phase = 1;
    this.serving = 0;                 // >0 while the SERVE pose is held
    this.powered = false;
    this.flash = 0;
    this.g = scene.add.graphics().setDepth(4);        // its shadow
    this.sprite = scene.add.image(x, y, 'atlas', 'chomp_p1_walk_1')
      .setOrigin(0.5, 0.9).setDepth(18);       // it sits on its stand
  };

  PC.ChompFigure.prototype.update = function (dt, state, stateT) {
    this.t += dt;
    var target = (state === 'walk') ? 0 : 1;
    this.rise += (target - this.rise) * Math.min(1, dt * 1.4);
    if (this.serving > 0) this.serving -= dt;
    var r = this.rise, g = this.g;
    g.clear();
    this.sprite.setVisible(r > 0.02);
    if (r <= 0.02) return;

    var art = PHASE_ART[this.phase] || 'chomp_p1';
    var frame = this.powered ? 'chomp_down'
      : this.serving > 0 ? art + '_serve_1'
      : art + '_walk_' + (1 + (Math.floor(this.t * 2.2) % 2));
    this.sprite.setFrame(frame);

    // a MACHINE does not bob up and down like a creature - it hums. A
    // tiny vertical shiver at machine frequency, an order of magnitude
    // smaller than a footstep, keeps it alive without it ever looking
    // like something that could walk.
    var bob = this.powered ? 0 : Math.sin(this.t * 9) * 1.2;
    var sc = (PHASE_SCALE[this.phase] || 1) * r * (this.powered ? 0.86 : 1);
    this.sprite.setPosition(this.x, this.y + bob).setScale(sc);
    this.sprite.setAlpha(1);
    // damage flash, on the same clock the rest of the game uses
    this.sprite.setTintFill && (this.scene.now < this.flash
      ? this.sprite.setTintFill(0xffffff) : this.sprite.clearTint());

    g.fillStyle(0x0a0716, 0.42);
    g.fillEllipse(this.x, this.y + 6, 230 * sc, 54 * sc);
  };

  PC.ChompFigure.prototype.destroy = function () {
    this.g.destroy();
    this.sprite.destroy();
  };
})();
