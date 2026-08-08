// gauntlet.js - THE SEVENTEEN-FLOOR GAUNTLET (v0.68.0).
//
// Mark: "constant wave of enemies, with healing - just a basic
// gauntlet." The climb was the longest walk in the game with the least
// in it: one objective at the top and a spawn clock that idled at
// quarter speed the whole way.
//
// Now the TOWER is the director: the spawn clock is driven by ALTITUDE,
// not time - every floor climbed is a permanent step up the heat curve
// (floor 1 opens gently, floor 17 runs at the roster's ceiling), so
// pushing upward is what raises the pressure and resting on a floor
// never makes it worse. A FLOOR N/17 counter marks progress, and every
// third floor drops a medkit at the landing - the breather that makes
// a constant-pressure climb fair for a kid.
window.PC = window.PC || {};
(function () {

  var HEAL_EVERY = 3;              // medkit on floors 3, 6, 9, 12, 15
  var PER_FLOOR = 12.5;            // spawn-clock seconds granted per floor

  PC.TowerGauntlet = function (scene) {
    this.scene = scene;
    this.floor = 0;                // 0 = lobby / unknown
    this.healed = {};              // floors that dropped their medkit
    this.done = false;
  };

  // which floor band the player stands in (f1 bottom .. f17 top)
  PC.TowerGauntlet.prototype._floorAt = function (x, y) {
    var region = this.scene.region;
    for (var n = 1; n <= 17; n++) {
      var mk = region.landmark('f' + n);
      if (!mk) continue;
      if (y >= mk.y && y < mk.y + mk.h) return n;
    }
    return 0;
  };

  PC.TowerGauntlet.prototype.update = function (dt) {
    var s = this.scene;
    if (this.done || !s.region || !s.quest || s.quest.done) return;

    // the roof ends the gauntlet: the confrontation owns everything up
    // there, and the crowd must not follow Danny into the cutscene
    var roof = s.region.landmark('roof');
    if (roof && s.py < roof.y + roof.h) {
      this.done = true;
      if (s.enemies) s.enemies.clearAll();
      return;
    }

    var f = this._floorAt(s.px, s.py);
    if (!f) return;

    // ALTITUDE IS THE DIFFICULTY DIAL. Monotonic via max() - falling
    // back down a stairwell never cools the tower off.
    s.spawnT = Math.max(s.spawnT || 0, f * PER_FLOOR);

    if (f !== this.floor) {
      var up = f > this.floor;
      this.floor = f;
      if (up) {
        s.floatText('FLOOR ' + f + ' / 17', 0xffd977);
        if (PC.audio && PC.audio.ui) PC.audio.ui();
        // the breather: a medkit waiting at every third landing
        if (f % HEAL_EVERY === 0 && !this.healed[f]) {
          this.healed[f] = true;
          s.pickups.drop(s.px, s.py - 70, 'medkit', PC.PLAYER.MEDKIT_HEAL || 35);
          s.floatText('SUPPLIES!', 0xa8e04a);
        }
      }
    }
  };
})();
