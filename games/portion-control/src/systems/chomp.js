// chomp.js - CHOMP, the last boss (v0.46.0).
//
// It does not attack. It SERVES. Every move is an act of generosity that
// happens to be lethal, because CHOMP genuinely believes feeding = helping
// and cannot understand why anyone would want it to stop. That is the
// whole joke, the whole theme, and the reason the fight ends with it
// asking "...did I... not help?" rather than exploding.
//
// It duck-types as PC.Boss (x, y, r, dead, damage()) so it is assigned
// straight to scene.boss and EVERY existing weapon, aim helper and hit
// path works on it unchanged - no special cases anywhere else.
//
// v0.46.0 ships the entity, the three phases and the death that isn't a
// death. The moveset lands on top of this.
window.PC = window.PC || {};
(function () {

  PC.CHOMP_DEF = {
    hp: 5200,
    contact: 22,
    name: 'CHOMP',
    r: 96,
    // phase boundaries as a fraction of max HP
    p2: 0.66, p3: 0.33,
  };

  PC.Chomp = function (scene, x, y, figure) {
    var d = PC.CHOMP_DEF;
    this.scene = scene;
    this.x = x; this.y = y;
    this.r = d.r;
    this.name = d.name;
    this.hp = this.maxHp = d.hp;
    this.contact = d.contact;
    // story tier fights with kid numbers - same boss, same fight
    var ez = PC.ease ? PC.ease(scene) : null;
    if (ez && ez.bossHp && ez.bossHp !== 1) {
      this.hp = this.maxHp = Math.round(d.hp * ez.bossHp);
      this.contact = Math.round(d.contact * (ez.bossContact || 1));
    }
    this.phase = 1;
    this.dead = false;
    this.powering = false;          // the shutdown, not an explosion
    this.t = 0;
    this.flashUntil = 0;
    // it reuses the confrontation's figure so the thing the player was
    // just talking to is the thing they are now fighting - no swap, no
    // cut, same object on screen
    this.fig = figure || new PC.ChompFigure(scene, x, y);
    this.fig.x = x; this.fig.y = y;
    this.fig.rise = 1;
    this.fig.phase = 1;
  };

  PC.Chomp.prototype.phaseOf = function () {
    var f = this.hp / this.maxHp;
    if (f > PC.CHOMP_DEF.p2) return 1;
    if (f > PC.CHOMP_DEF.p3) return 2;
    return 3;
  };

  PC.Chomp.prototype.update = function (dt) {
    if (this.dead) return;
    this.t += dt;
    var s = this.scene;

    // phase changes are STORY beats, not stat bumps
    var p = this.phaseOf();
    if (p !== this.phase && !this.powering) {
      this.phase = p;
      if (this.fig) this.fig.phase = p;
      if (s.onChompPhase) s.onChompPhase(p);
    }

    if (this.powering) {
      // winding down: it sinks, the lights go out, and it stops moving
      this.fig.rise = Math.max(0.22, this.fig.rise - dt * 0.35);
      this.fig.powered = true;
      this.fig.update(dt, 'down', this.t);
      return;
    }
    this.fig.update(dt, 'fight', this.t);

    // contact: standing inside it hurts, but gently - it is not trying
    // to hurt you, you are standing in the serving area
    if (!s.dead && s.now > s.invUntil) {
      var dx = s.px - this.x, dy = s.py - this.y;
      if (dx * dx + dy * dy < (this.r + 14) * (this.r + 14)) {
        s.hp -= this.contact;
        s.invUntil = s.now + 0.7;
        s.drawHud();
        if (s.hp <= 0) s.die();
      }
    }
    this._drawBar();
  };

  PC.Chomp.prototype.damage = function (dmg) {
    if (this.dead || this.powering) return;
    this.hp -= dmg;
    this.flashUntil = this.scene.now + 0.08;
    if (this.fig) this.fig.flash = this.flashUntil;
    if (this.hp <= 0) { this.hp = 0; this.powerDown(); }
  };

  // THE END OF THE GAME. It does not blow up. It runs out of power in
  // the middle of trying to give you something, which is the only
  // ending the written script allows.
  PC.Chomp.prototype.powerDown = function () {
    if (this.powering) return;
    this.powering = true;
    this.scene.cameras.main.shake(300, 0.006);
    if (PC.audio && PC.audio.bossDie) PC.audio.bossDie();
    if (this.scene.onChompDown) this.scene.onChompDown();
  };

  PC.Chomp.prototype._drawBar = function () {
    var g = this.scene.bossBar; if (!g) return;
    var W = PC.RENDER.W, y = PC.RENDER.H - 8;
    g.clear();
    g.fillStyle(0x1b1530, 0.85).fillRect(8, y, W - 16, 6);
    // the bar is segmented by PHASE so a kid can see the fight's shape
    var f = this.hp / this.maxHp;
    g.fillStyle(0xff6b6b, 1).fillRect(9, y + 1, Math.max(0, (W - 18) * f), 4);
    g.fillStyle(0x1b1530, 0.9);
    g.fillRect(9 + (W - 18) * PC.CHOMP_DEF.p2, y, 2, 6);
    g.fillRect(9 + (W - 18) * PC.CHOMP_DEF.p3, y, 2, 6);
  };

  PC.Chomp.prototype.finalDestroy = function () {
    if (this.fig) this.fig.destroy();
  };
})();
