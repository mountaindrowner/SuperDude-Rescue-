// chomptest.js - THE DEV LEVEL TESTER (v0.50.0, Mark: "let's do a dev
// level tester with both options").
//
// Reached with ?chomptest=1 on the finale. It drops you on the roof
// with the cutscene skipped and BOTH CHOMP designs standing side by
// side at real play scale, labelled, cycling phase 1 -> 2 -> 3 ->
// powered down every few seconds so every state can be compared
// directly. Screenshots of a sprite sheet lie about scale; this does
// not - it is the actual camera, the actual zoom, the actual roof.
//
// Runtime only. Nothing here touches the shipped fight.
window.PC = window.PC || {};
(function () {

  var HOLD = 3.2;                  // seconds per phase before it cycles
  var GAP = 210;                   // world px between the two designs
  var ZOOM = 0.46;                 // wide enough that BOTH fit the frame

  PC.ChompTest = function (scene) {
    var L = scene.region && scene.region.layout;
    if (!L || !L.roof) return;
    this.scene = scene;
    this.t = 0;
    this.step = 0;                 // 0,1,2 = phases; 3 = powered down

    var c = L.chompMark;
    var mode = PC.CHOMP_TEST || 'both';
    this.figs = [];
    this.labels = [];
    if (mode === 'both') {
      this.a = new PC.ChompFigure(scene, c.x - GAP, c.y, 'art');
      this.b = new PC.ChompFigure(scene, c.x + GAP, c.y, 'drawn');
      this.figs = [this.a, this.b];
      this.labels.push(this._label(c.x - GAP, c.y + 40, 'GENERATED', 0xf2c33c));
      this.labels.push(this._label(c.x + GAP, c.y + 40, 'DRAWN', 0x35d0ff));
      this.zoom = ZOOM;
    } else {
      this.a = new PC.ChompFigure(scene, c.x, c.y, mode);
      this.figs = [this.a];
      this.labels.push(this._label(c.x, c.y + 40,
        mode === 'drawn' ? 'DRAWN' : 'GENERATED',
        mode === 'drawn' ? 0x35d0ff : 0xf2c33c));
      this.zoom = 0.74;                      // one alone gets a closer look
    }
    for (var fi = 0; fi < this.figs.length; fi++) this.figs[fi].rise = 1;
    this.labels.push(this._label(c.x, c.y - 210, 'PHASE 1', 0xfff6e0));
    this.phaseLabel = this.labels[this.labels.length - 1];
    // Danny stands between them for SCALE - the whole point of testing
    // in-engine rather than on a sprite sheet is seeing how big they
    // read next to the character you actually play.
    scene.px = c.x; scene.py = c.y + 150;
    scene.player.setPosition(scene.px, scene.py);
    // SPAWN-PROOF the rig. Silencing the director is not enough: it
    // gets ticks in before the delayed arm fires, and one stray hot dog
    // standing in front of the boss is exactly what muddies an art
    // judgement. Shut the door as well as sweeping the floor.
    if (scene.enemies) {
      scene.enemies.clearAll();
      scene.enemies.spawn = function () { return null; };
    }
    if (scene.director) scene.director.update = function () {};
    if (scene.pickups && scene.pickups.clearAll) scene.pickups.clearAll();
    // GUNS DOWN. Danny auto-fires, and in the first build he shot the
    // one enemy that got in and left its harmless still-sprite corpse
    // parked in front of the boss for the rest of the test.
    if (scene.weapons) scene.weapons.length = 0;
    if (scene.enemies && scene.enemies.clearStills) scene.enemies.clearStills();
    if (scene.confront) { scene.confront.state = 'over'; scene.confront.done = true; }
    // the camera holds the pair; following the player would swing it
    var cam = scene.cameras.main;
    cam.stopFollow();
    scene.zoomTarget = scene.baseZoom * this.zoom;
    this._camAt = { x: c.x, y: c.y + 30 };
    cam.centerOn(this._camAt.x, this._camAt.y);
    if (scene.ui) scene.ui.setVisible(false);      // nothing but the test
    if (scene.floatText) scene.floatText('CHOMP A/B TEST', 0x35d0ff);
  };

  PC.ChompTest.prototype._label = function (x, y, text, tint) {
    var t = this.scene.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: '20px', color: '#fff6e0',
      fontStyle: 'bold', stroke: '#0a0716', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(120);
    t.setTint(tint);
    return t;
  };

  PC.ChompTest.prototype.update = function (dt) {
    this.t += dt;
    if (this._camAt) this.scene.cameras.main.centerOn(this._camAt.x, this._camAt.y);
    // the rig stays clean: the director gets one tick in before the
    // delayed arm fires, and one stray hot dog in the middle of an art
    // comparison is exactly the kind of thing that muddies a judgement
    // A DEV RIG MUST NOT BE ABLE TO KILL YOU. The first build did:
    // enemies spawned in the 400ms before the rig armed, chewed through
    // Danny while he stood posing, and the art comparison ended on the
    // OVERWHELMED screen. Belt and braces - clear the field AND make
    // him untouchable.
    var s2 = this.scene;
    if (s2.enemies) s2.enemies.clearAll();
    s2.invUntil = s2.now + 999;
    s2.hp = PC.PLAYER.HP + (s2.stats.bonusHp || 0);
    if (this.t >= HOLD) {
      this.t = 0;
      this.step = (this.step + 1) % 4;
      var powered = this.step === 3;
      var ph = powered ? 3 : this.step + 1;
      for (var i = 0; i < this.figs.length; i++) {
        this.figs[i].phase = ph;
        this.figs[i].powered = powered;
      }
      this.phaseLabel.setText(powered ? 'POWERED DOWN' : 'PHASE ' + ph);
    }
    for (var j = 0; j < this.figs.length; j++) this.figs[j].update(dt, 'fight', this.t);
  };

  PC.ChompTest.prototype.destroy = function () {
    for (var i = 0; i < this.figs.length; i++) this.figs[i].destroy();
    for (var i = 0; i < this.labels.length; i++) this.labels[i].destroy();
  };
})();
