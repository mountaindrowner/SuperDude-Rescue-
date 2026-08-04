// subway.js - THE LOOP LINE (v0.35.0). Mark: "a sewer slash subway
// combo. The subway rotates around the whole map slowly, and it's a
// constant threat - it causes damage." A ghost train circulates the
// outer ring tunnels (cols/rows 1 and 17) forever: three lit cars,
// headlight beam, rumble-and-glow telegraph, hurts the player on
// contact (i-frames respected) and FLATTENS any food monster on the
// rails - dodging it is the skill, riding its wake is the reward.
// The track itself is painted by world_sewer.js (rails replace the
// water gutter on ring corridors); this file is the moving train.
window.PC = window.PC || {};
(function () {
  var CH = PC.CHUNK || 512;

  var RING_LO = 1 * CH + CH / 2;      // 768  - ring corner coordinate
  var RING_HI = 17 * CH + CH / 2;     // 8960
  var SIDE = RING_HI - RING_LO;       // 8192 per side

  PC.SUBWAY = {
    SPEED: 210,                       // px/s - a slow, inevitable orbit
    CARS: 3,
    CAR_LEN: 118, CAR_W: 54, GAP: 14,
    DMG: 14,                          // per touch, through the normal armor math
    KILL_R: 46,                       // food monsters within this of a car center pop
  };

  // perimeter t (0..4*SIDE) -> {x, y, horiz, dirSign}
  function posAt(t) {
    t = ((t % (4 * SIDE)) + 4 * SIDE) % (4 * SIDE);
    if (t < SIDE) return { x: RING_LO + t, y: RING_LO, horiz: true, s: 1 };
    if (t < 2 * SIDE) return { x: RING_HI, y: RING_LO + (t - SIDE), horiz: false, s: 1 };
    if (t < 3 * SIDE) return { x: RING_HI - (t - 2 * SIDE), y: RING_HI, horiz: true, s: -1 };
    return { x: RING_LO, y: RING_HI - (t - 3 * SIDE), horiz: false, s: -1 };
  }

  PC.Subway = function (scene) {
    this.scene = scene;
    this.t = 0.35 * 4 * SIDE;         // start far from the player's spawn
    this.g = scene.add.graphics().setDepth(9);       // over floor, under HUD
    this.beam = scene.add.graphics().setDepth(8);
    this._rumbleCd = 0;
  };

  PC.Subway.prototype.update = function (dt) {
    var scene = this.scene, S = PC.SUBWAY;
    this.t += S.SPEED * dt;
    var g = this.g, beam = this.beam;
    g.clear(); beam.clear();

    var px = scene.px, py = scene.py;
    var lead = posAt(this.t);

    // headlight beam ahead of the lead car
    var bdx = lead.horiz ? lead.s : 0, bdy = lead.horiz ? 0 : lead.s;
    beam.fillStyle(0xfff3c4, 0.10);
    beam.beginPath();
    beam.moveTo(lead.x + bdx * S.CAR_LEN * 0.5 - bdy * 16, lead.y + bdy * S.CAR_LEN * 0.5 - bdx * 16);
    beam.lineTo(lead.x + bdx * S.CAR_LEN * 0.5 + bdy * 16, lead.y + bdy * S.CAR_LEN * 0.5 + bdx * 16);
    beam.lineTo(lead.x + bdx * 330 + bdy * 52, lead.y + bdy * 330 + bdx * 52);
    beam.lineTo(lead.x + bdx * 330 - bdy * 52, lead.y + bdy * 330 - bdx * 52);
    beam.closePath(); beam.fillPath();

    // rumble + shake as it nears the player (the telegraph)
    var nd = Math.hypot(lead.x - px, lead.y - py);
    this._rumbleCd -= dt;
    if (nd < 620 && this._rumbleCd <= 0) {
      this._rumbleCd = 0.9;
      if (scene.vfx && scene.vfx.shake) scene.vfx.shake(1 + (620 - nd) / 320, 90);
      if (PC.audio && PC.audio.rumble) PC.audio.rumble();
      else if (PC.audio && PC.audio.telegraph && nd < 360) PC.audio.telegraph();
    }

    // draw + collide each car back from the lead
    for (var c = 0; c < S.CARS; c++) {
      var ct = this.t - c * (S.CAR_LEN + S.GAP);
      var p = posAt(ct);
      var hw = (p.horiz ? S.CAR_LEN : S.CAR_W) / 2;
      var hh = (p.horiz ? S.CAR_W : S.CAR_LEN) / 2;

      // body: dark steel slab, lit windows, under-skirt
      g.fillStyle(0x0d1312, 0.5);
      g.fillRect(p.x - hw + 4, p.y - hh + 6, hw * 2, hh * 2);        // shadow
      g.fillStyle(0x514e6b, 1);
      g.fillRect(p.x - hw, p.y - hh, hw * 2, hh * 2);
      g.fillStyle(0x6d6a8e, 1);
      g.fillRect(p.x - hw, p.y - hh, hw * 2, 6);
      g.fillStyle(0x2a2833, 1);
      g.fillRect(p.x - hw + 2, p.y + hh - 8, hw * 2 - 4, 6);
      // windows: a row of warm lit panes along the long axis
      g.fillStyle(0xf2c33c, 0.9);
      if (p.horiz) {
        for (var wx = -hw + 14; wx < hw - 16; wx += 26) {
          g.fillRect(p.x + wx, p.y - 12, 16, 11);
        }
      } else {
        for (var wy = -hh + 14; wy < hh - 16; wy += 26) {
          g.fillRect(p.x - 12, p.y + wy, 11, 16);
        }
      }
      // lead car: headlight + cab stripe
      if (c === 0) {
        g.fillStyle(0x35d0ff, 1);
        g.fillRect(p.x + bdx * (hw - 5) - 4, p.y + bdy * (hh - 5) - 4, 8, 8);
        g.fillStyle(0xd93a3a, 1);
        if (p.horiz) g.fillRect(p.x + (p.s > 0 ? hw - 10 : 4 - hw), p.y - hh, 6, hh * 2);
        else g.fillRect(p.x - hw, p.y + (p.s > 0 ? hh - 10 : 4 - hh), hw * 2, 6);
      }

      // ---- player contact: normal damage math, i-frames respected ----
      if (!scene.dead && scene.now > scene.invUntil &&
          px > p.x - hw - 10 && px < p.x + hw + 10 &&
          py > p.y - hh - 10 && py < p.y + hh + 10) {
        scene.hp -= Math.max(1, S.DMG * scene.dmgTakenMult - scene.stats.armor);
        scene.lastHurtT = scene.now;
        scene.invUntil = scene.now + PC.PLAYER.IFRAMES;
        scene.cameras.main.shake(180, 0.01);
        if (PC.audio) PC.audio.hurt();
        scene.drawHud();
        if (scene.hp <= 0) { scene.die(); return; }
      }

      // ---- food monsters on the rails get flattened (POP + gems) ----
      if (scene.enemies && scene.enemies.hash) {
        (function (car) {
          scene.enemies.hash.eachNear(car.x, car.y, function (e) {
            var dx = e.x - car.x, dy = e.y - car.y;
            if (dx * dx + dy * dy < S.KILL_R * S.KILL_R) {
              PC.damageEnemy(scene, e, 9999, dx * 0.1, dy * 0.1, scene._onKillCb);
            }
          });
        })(p);
      }
    }
  };

  PC.Subway.prototype.destroy = function () {
    this.g.destroy(); this.beam.destroy();
  };
})();
