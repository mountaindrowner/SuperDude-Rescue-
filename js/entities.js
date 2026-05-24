// entities.js - the player, enemies, items, projectiles, moving platforms.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var C = SDD.C;
  var mc = SDD.engine.moveAndCollide;
  var overlap = SDD.engine.overlap;
  var clamp = SDD.engine.clamp;

  function spr(name) { return SDD.sprites.get(name); }
  function drawBC(ctx, name, e, cam) {
    var s = spr(name); if (!s) return;
    var dx = Math.round(e.x - cam.x + e.w / 2 - s.width / 2);
    var dy = Math.round(e.y - cam.y + e.h - s.height);
    ctx.drawImage(s, dx, dy);
  }
  // soft blob shadow at an entity's feet
  function softShadow(ctx, e, cam, rx, ry) {
    var sx = e.x + e.w / 2 - cam.x, sy = e.y + e.h - cam.y;
    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = '#0a0a16';
    ctx.beginPath();
    ctx.ellipse(sx, sy, rx || (e.w * 0.62), ry || 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // soft radial glow behind collectibles / projectiles
  function glow(ctx, cx, cy, r, color, alpha) {
    var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grd.addColorStop(0, color);
    grd.addColorStop(1, 'rgba(10,10,22,0)');
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = grd;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  }

  // ===================== PLAYER =====================
  function Player(x, y) {
    this.x = x; this.y = y; this.w = 13; this.h = 23;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.big = false; this.hasBlast = false;
    this.onGround = false; this.coyote = 0; this.jumpBuf = 0;
    this.dropThrough = 0;
    this.invuln = 0; this.shrinkAnim = 0;
    this.frame = 'idle'; this.animT = 0; this.blastAnim = 0; this.blastCD = 0;
    this.ridePlat = null;
    this.climbing = false; this.vineCooldown = 0; this.inWater = false;
    this.prevOnGround = false; this.landT = 0;
    this.dead = false; this.deadT = 0; this.deadDone = false; this.pitDeath = false;
    this.win = false; this.winT = 0;
  }

  Player.prototype.grow = function () {
    if (this.big) return;
    this.big = true;
    this.y -= 8; this.h = 31; this.w = 14; this.x -= 1;
    SDD.audio.sfx('grow');
  };
  Player.prototype.giveBlast = function () {
    this.hasBlast = true;
    SDD.audio.sfx('power');
  };
  Player.prototype.shrink = function () {
    if (!this.big) return;
    this.big = false;
    this.y += 8; this.h = 23; this.w = 13; this.x += 1;
    // Quick size flicker (handled in draw) + audible shrink cue.
    this.shrinkAnim = 24;
    SDD.audio.sfx('shrink');
  };

  // returns true if the hit "lands" (used to suppress repeated hits)
  Player.prototype.hurt = function () {
    if (SDD.save && SDD.save.data && SDD.save.data.options && SDD.save.data.options.god) return false;
    if (this.invuln > 0 || this.dead || this.win) return false;
    if (this.big) {
      this.shrink();
      this.invuln = C.INVULN_STEPS;
      return true;
    }
    this.die(false);
    return true;
  };

  Player.prototype.die = function (pit) {
    if (this.dead) return;
    this.dead = true; this.deadT = 0; this.pitDeath = !!pit;
    this.vx = 0; this.vy = pit ? 2 : -5;
    SDD.audio.sfx('die');
  };

  Player.prototype.victory = function () {
    if (this.win) return;
    this.win = true; this.winT = 0; this.vx = 0;
  };

  Player.prototype.updateDead = function () {
    this.deadT++;
    if (this.pitDeath) {
      this.y += 4;
      if (this.deadT > 36) this.deadDone = true;
    } else {
      if (this.deadT > 22) { this.vy += 0.34; this.y += this.vy; }
      // Flappy deaths trigger so often (one wrong flap = die) that
      // the standard 2.5 sec animation feels punishing. 1 sec is
      // enough for the knockback + fall to read in flappy mode.
      var doneT = (this.diedInFlappy) ? 60 : 150;
      if (this.deadT > doneT) this.deadDone = true;
    }
  };

  Player.prototype.onHeadBump = function () {};  // set per-update by the level

  Player.prototype.update = function (level) {
    if (this.dead) { this.updateDead(); return; }
    var gs = level.gravityScale || 1;
    if (this.win) {
      this.winT++;
      this.vy += C.GRAVITY * gs;
      this.vx *= 0.8;
      mc(this, level.map);
      this.frame = (this.winT % 40 < 20) ? 'victory' : 'idle0';
      return;
    }

    var In = SDD.input;
    var T = C.TILE;

    // ----- vine climb detection (Day 3+) -----
    // Three grab conditions:
    //   1. Standing under a vine and press UP  (intentional grab).
    //   2. Falling through a vine (vy > 0.5)   (auto-grab so vines act
    //      as a safety net, not something you fall straight past).
    //   3. Already climbing                    (sticky - stay on the
    //      vine when you release up/down, like Mario's vines / DK ropes).
    // Drop off by pressing JUMP (handled below).
    var atVine = false, grabCol = -1;
    var midCol = Math.floor((this.x + this.w / 2) / T);
    var topRow = Math.floor((this.y + 2) / T);
    var botRow = Math.floor((this.y + this.h - 2) / T);
    for (var vy_ = topRow; vy_ <= botRow; vy_++) {
      if (level.map.get(midCol, vy_) === 'V') { atVine = true; grabCol = midCol; break; }
    }
    if (this.vineCooldown > 0) this.vineCooldown--;
    if (atVine) {
      // Sticky: stay on if already climbing. During vineCooldown, no
      // new grabs of any kind so a recent jump-off or drop-through
      // doesn't immediately yank the player back onto the vine - this
      // includes blocking manual grabs (otherwise holding DOWN to
      // drop through a canopy would re-grab the vine the moment the
      // player falls past it).
      var canGrab = this.vineCooldown === 0;
      var autoGrab = canGrab && this.vy > 0.5;
      // UP-grab works from the ground (player walks up to a vine and
      // climbs). DOWN-grab only from mid-air (otherwise pressing DOWN
      // while standing on a canopy that has a vine through it would
      // grab the vine and block the player's drop-through).
      var manualGrab = canGrab &&
        (In.held('up') || (!this.onGround && In.held('down')));
      if (this.climbing || autoGrab || manualGrab) {
        if (!this.climbing && autoGrab) {
          this.vy = 0;                        // catch the fall
        }
        this.climbing = true;
        // Snap horizontally toward the vine column so player doesn't
        // sit half-off and slip back to gravity next frame.
        if (grabCol >= 0) {
          var targetX = grabCol * T + (T - this.w) / 2;
          this.x += (targetX - this.x) * 0.4;
        }
      }
    } else {
      this.climbing = false;
    }

    if (this.climbing) {
      this.vx = 0; this.vy = 0;
      // Pass through one-way tiles in BOTH directions while climbing
      // (otherwise climbing down through a canopy one-way-tile would
      // get blocked at the canopy level).
      this.dropThrough = 2;
      if (In.held('up')) this.vy = -1.3;
      else if (In.held('down')) this.vy = 1.4;
      if (In.held('left')) { this.vx = -0.7; this.facing = -1; }
      else if (In.held('right')) { this.vx = 0.7; this.facing = 1; }
      if (In.pressed('jump')) {
        this.climbing = false;
        // Full jump impulse off the vine so the player can actually
        // reach the ledge that the vine reaches up to. (0.7x impulse
        // wasn't enough to clear the ledge top.)
        this.vy = C.JUMP_SMALL;
        // Cooldown so the auto-grab on the way down doesn't yank the
        // player straight back onto this vine before they can drift
        // onto the adjacent ledge.
        this.vineCooldown = 24;
        SDD.audio.sfx('jump');
      }
      if (this.blastCD > 0) this.blastCD--;
      if (this.hasBlast && In.pressed('blast') && this.blastCD <= 0) {
        var bx_ = this.facing > 0 ? this.x + this.w - 2 : this.x - 8;
        var by_ = this.y + (this.big ? 9 : 4);
        level.spawnBlast(bx_, by_, this.facing);
        this.blastCD = 20; this.blastAnim = 11;
        SDD.audio.sfx('blast');
      }
      this.onHeadBump = function () {};
      this.hitWall = 0;
      mc(this, level.map);
      this.animT++;
      this.frame = (this.blastAnim > 0) ? 'blast'
        : (Math.abs(this.vy) > 0.1 || Math.abs(this.vx) > 0.1)
          ? 'walk' + (Math.floor(this.animT / 6) % 4)
          : 'idle';
      if (this.blastAnim > 0) this.blastAnim--;
      if (this.invuln > 0) this.invuln--;
      if (this.y > level.map.pxH + 28) {
      if (SDD.save.data.options.god) { this.y = 32; this.vy = 0; }
      else this.die(true);
    }
      return;
    }

    var maxV = this.big ? C.MOVE_MAX_BIG : C.MOVE_MAX_SMALL;
    var left = In.held('left'), right = In.held('right');

    // ----- Flappy mode (Day 5.1) -----
    // Danny auto-flies forward; tap A to flap up. Left/right ignored.
    // Touching the ground OR ceiling = death.
    if (level.flappy) {
      this.facing = 1;
      this.vx = level.flappySpeed || 1.4;
      this.vy += C.GRAVITY * (level.flappyGravity || 0.85) * gs;
      var maxFall = level.flappyMaxFall || 4.5;
      if (this.vy > maxFall) this.vy = maxFall;
      if (In.pressed('jump')) {
        this.vy = -(level.flappyFlap || 3.4);
        SDD.audio.sfx('jump');
      }
      // ceiling cap so a button-mashed Danny doesn't fly off the top
      if (this.y < 4) { this.y = 4; if (this.vy < 0) this.vy = 0; }
      this.coyote = 0; this.jumpBuf = 0;
      this.onHeadBump = function () {};
      this.hitWall = 0;
      mc(this, level.map);
      // Hitting the ground OR a pillar wall is death in flappy mode -
      // there is no "ground" to land on and pillars are impassable.
      if ((this.onGround || this.hitWall) && !SDD.save.data.options.god) {
        this.diedInFlappy = true;
        this.die(false);
      } else if ((this.onGround || this.hitWall) && SDD.save.data.options.god) {
        // God mode: skip the pillar instead of teleporting to y=32
        // (which is inside the top-pillar of every gate). Bump past
        // the offending tile so we don't oscillate on it.
        this.x += 32; this.y = 90; this.vy = 0;
        this.onGround = false; this.hitWall = 0;
      }
      this.animT++;
      if (this.invuln > 0) this.invuln--;
      return;
    }

    if (left && !right) {
      this.vx -= C.MOVE_ACCEL; if (this.vx < -maxV) this.vx = -maxV;
      this.facing = -1;
    } else if (right && !left) {
      this.vx += C.MOVE_ACCEL; if (this.vx > maxV) this.vx = maxV;
      this.facing = 1;
    } else {
      if (this.vx > 0) { this.vx -= C.FRICTION; if (this.vx < 0) this.vx = 0; }
      else if (this.vx < 0) { this.vx += C.FRICTION; if (this.vx > 0) this.vx = 0; }
    }

    // water detection (Day 5+): center-tile lookup
    this.inWater = false;
    {
      var wcx = Math.floor((this.x + this.w / 2) / T);
      var wcy = Math.floor((this.y + this.h / 2) / T);
      var wt = level.map.get(wcx, wcy);
      if (wt === 'W' || wt === '~') this.inWater = true;
    }

    if (this.inWater) {
      // swim physics: heavy drag, mild gravity, paddle on jump press
      this.vy *= 0.92; this.vx *= 0.92;
      this.vy += C.GRAVITY * 0.18 * gs;
      if (this.vy > 2.2) this.vy = 2.2;
      if (In.pressed('jump')) { this.vy = -2.7; SDD.audio.sfx('jump'); }
      this.coyote = 0; this.jumpBuf = 0;
    } else {
      // god mode: lighter gravity + extra-high jumps for fast testing
      var godMul = SDD.save.data.options.god ? 0.6 : 1.0;
      var godJumpMul = SDD.save.data.options.god ? 1.4 : 1.0;
      this.vy += C.GRAVITY * gs * godMul;
      if (this.vy > C.MAX_FALL) this.vy = C.MAX_FALL;

      if (this.onGround) this.coyote = C.COYOTE; else if (this.coyote > 0) this.coyote--;
      if (In.pressed('jump')) this.jumpBuf = C.JUMP_BUFFER; else if (this.jumpBuf > 0) this.jumpBuf--;

      // Drop-through one-way platform: Down + A while standing on a
      // one-way tile bypasses the jump and phases through the platform.
      if (this.dropThrough > 0) this.dropThrough--;
      var didDrop = false;
      if (this.onGround && In.held('down') && this.jumpBuf > 0) {
        var footRow = Math.floor((this.y + this.h) / T);
        var fcLft = Math.floor(this.x / T);
        var fcRgt = Math.floor((this.x + this.w - 1) / T);
        for (var fx = fcLft; fx <= fcRgt; fx++) {
          if (level.map.isOneWay(fx, footRow) && !level.map.isSolid(fx, footRow)) {
            // 20 frames so the player falls fully past a 2-row canopy
            // (3-2). 6 frames was enough for a single-thickness one-way
            // but the sub-pixel probe caught the player on the second
            // row of a 2-row stack.
            this.dropThrough = 20; this.jumpBuf = 0; this.coyote = 0;
            this.y += 2; this.vy = 0.5; this.onGround = false;
            // Disable vine auto-grab so the drop-through doesn't
            // immediately snag a vine that hangs from this canopy.
            this.vineCooldown = 30;
            SDD.audio.sfx('jump');
            didDrop = true; break;
          }
        }
      }

      if (!didDrop && this.jumpBuf > 0 && this.coyote > 0) {
        // Per-level jumpScale lets a low-grav level (e.g. 4-2) soften
        // the launch so the jump feels floaty instead of explosive.
        var js = level.jumpScale || 1.0;
        this.vy = (this.big ? C.JUMP_BIG : C.JUMP_SMALL) * godJumpMul * js;
        this.jumpBuf = 0; this.coyote = 0;
        SDD.audio.sfx(this.big ? 'jumpbig' : 'jump');
      }
      // variable jump height: releasing A caps upward speed (looser in god)
      var capV = SDD.save.data.options.god ? -3.6 : -2.6;
      if (!In.held('jump') && this.vy < capV) this.vy = capV;
    }

    // blast
    if (this.blastCD > 0) this.blastCD--;
    if (this.hasBlast && In.pressed('blast') && this.blastCD <= 0) {
      var bx = this.facing > 0 ? this.x + this.w - 2 : this.x - 8;
      var by = this.y + (this.big ? 9 : 4);
      level.spawnBlast(bx, by, this.facing);
      this.blastCD = 20; this.blastAnim = 11;
      SDD.audio.sfx('blast');
    }

    var prevFeet = this.y + this.h;

    // ride a moving platform from the previous step
    if (this.ridePlat) { this.x += this.ridePlat.dx; this.y += this.ridePlat.dy; }

    var self = this;
    this.onHeadBump = function (tx, ty, code) { level.hitBlock(tx, ty, code); };
    this.hitWall = 0;
    mc(this, level.map);

    // moving platforms (one-way: land on top)
    this.ridePlat = null;
    for (var i = 0; i < level.platforms.length; i++) {
      var p = level.platforms[i];
      var feet = this.y + this.h;
      var horiz = this.x + this.w > p.x + 2 && this.x < p.x + p.w - 2;
      if (this.vy >= 0 && horiz && prevFeet <= p.y + 3 && feet >= p.y && feet <= p.y + 10) {
        this.y = p.y - this.h; this.vy = 0; this.onGround = true; this.ridePlat = p;
      }
    }

    // land detection (transition from airborne to onGround)
    if (!this.prevOnGround && this.onGround) this.landT = 6;
    this.prevOnGround = this.onGround;
    if (this.landT > 0) this.landT--;

    // animation
    this.animT++;
    if (this.blastAnim > 0) { this.blastAnim--; this.frame = 'blast'; }
    else if (!this.onGround) {
      if (this.vy < -1.0) this.frame = 'jump';
      else this.frame = 'fall';
    }
    else if (this.landT > 0) this.frame = 'land';
    else if (Math.abs(this.vx) > 0.4) {
      this.frame = 'walk' + (Math.floor(this.animT / 4) % 4);
    } else {
      this.frame = (Math.floor(this.animT / 28) % 2) ? 'idle1' : 'idle0';
    }

    // Quiet footstep tick while walking on the ground - fires every
    // ~14 frames so it matches the walk cycle.
    if (this.onGround && Math.abs(this.vx) > 0.4) {
      if ((this.animT % 14) === 0) SDD.audio.sfx('step');
    }

    if (this.invuln > 0) this.invuln--;
    if (this.shrinkAnim > 0) this.shrinkAnim--;

    // fell into a pit (skipped in fully-underwater levels - water IS the level)
    if (!level.underwater && this.y > level.map.pxH + 28) {
      if (SDD.save.data.options.god) { this.y = 32; this.vy = 0; }
      else this.die(true);
    }
  };

  Player.prototype.draw = function (ctx, cam) {
    // Heavy "ouch" pose plays for the first ~24 steps of invuln, then we
    // fall back to the classic invincibility flicker.
    var freshHurt = this.invuln > C.INVULN_STEPS - 24;
    if (!freshHurt && this.invuln > 0 && (this.invuln % 8) < 4) return;
    var size = this.big ? 'big' : 'small';
    // Big->small shrink: flicker between sizes for ~24 frames so the
    // transition reads visually (not just an instant size change).
    if (this.shrinkAnim > 0 && (this.shrinkAnim % 6) < 3) size = 'big';

    // Prefer the PixelLab PNG sprites once they've finished loading.
    if (SDD.sprites.pixelLab && SDD.sprites.pixelLab.ready &&
        SDD.sprites.pixelLab.failed === 0) {
      var anim, idx, dirPL = this.facing > 0 ? 'east' : 'west';
      var maxV = this.big ? C.MOVE_MAX_BIG : C.MOVE_MAX_SMALL;
      if (this.win) {
        anim = 'celebrate'; dirPL = 'south';
        idx = Math.floor(this.animT / 5) % 9;
      } else if (this.dead) {
        anim = 'die';
        idx = Math.min(6, Math.floor(this.deadT / 10));
      } else if (freshHurt) {
        anim = 'hurt';
        idx = Math.min(5, Math.floor((C.INVULN_STEPS - this.invuln) / 4));
      } else if (this.blastAnim > 0) {
        anim = 'blast';
        idx = Math.floor((11 - this.blastAnim) / 4);
      } else if (this.landT > 0) {
        anim = 'jump'; idx = 8;
      } else if (!this.onGround) {
        anim = 'jump';
        if (this.vy < -3) idx = 1;
        else if (this.vy < 0) idx = 3;
        else if (this.vy < 2) idx = 5;
        else idx = 7;
      } else if (Math.abs(this.vx) > 0.4) {
        // Run for all horizontal movement - the walk frames are very
        // subtle and read as "not moving" when Danny is centered on the
        // camera. Run frames have clear leg/arm swing.
        anim = 'run';
        idx = Math.floor(this.animT / 4) % 4;
      } else {
        anim = 'idle';
        idx = Math.floor(this.animT / 18) % 4;
      }
      var cx = Math.round(this.x + this.w / 2 - cam.x);
      var baselineY = Math.round(this.y + this.h - cam.y);
      if (SDD.sprites.pixDraw(ctx, size, anim, dirPL, idx, cx, baselineY)) return;
    }
    // Fallback: code-drawn Danny (used during loading and if the PNGs are missing)
    var fr = this.dead ? 'die' : this.frame;
    var dir = this.facing > 0 ? 'r' : 'l';
    drawBC(ctx, 'danny_' + size + '_' + fr + '_' + dir, this, cam);
  };

  // ===================== WALKER =====================
  function Walker(x, y) {
    this.x = x; this.y = y; this.w = 12; this.h = 10;
    this.vx = 0; this.vy = 0; this.dir = -1;
    this.onGround = false; this.dead = false; this.deadT = 0; this.remove = false;
    this.animT = 0; this.stompable = true;
  }
  Walker.prototype.update = function (level) {
    if (this.dead) { this.deadT++; if (this.deadT > 24) this.remove = true; return; }
    this.vy += C.GRAVITY; if (this.vy > C.MAX_FALL) this.vy = C.MAX_FALL;
    this.vx = this.dir * 0.55;
    this.hitWall = 0;
    mc(this, level.map);
    if (this.hitWall) this.dir = -this.hitWall;
    if (this.onGround) {
      var T = C.TILE;
      var footX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
      var bx = Math.floor(footX / T), by = Math.floor((this.y + this.h + 3) / T);
      if (!level.map.isSolid(bx, by) && !level.map.isOneWay(bx, by)) this.dir = -this.dir;
    }
    this.animT++;
  };
  Walker.prototype.stomped = function () { this.dead = true; this.deadT = 0; };
  Walker.prototype.zap = function () { this.dead = true; this.deadT = 0; };
  Walker.prototype.draw = function (ctx, cam) {
    var f = this.dead ? 1 : (Math.floor(this.animT / 8) % 2);
    var dir = this.dir > 0 ? 'r' : 'l';
    var base = 'walker_' + f + '_' + dir;
    drawBC(ctx, (this.variant && SDD.sprites.get(base + '_' + this.variant)) ? base + '_' + this.variant : base, this, cam);
  };

  // ===================== WISP (flyer) =====================
  function Wisp(x, y) {
    this.x = x; this.y = y; this.w = 10; this.h = 10;
    this.homeY = y; this.minX = x - 26; this.maxX = x + 26;
    this.t = Math.random() * 6.28; this.dir = Math.random() < 0.5 ? -1 : 1;
    this.dead = false; this.deadT = 0; this.remove = false;
    this.animT = 0; this.stompable = true;
  }
  Wisp.prototype.update = function (level) {
    if (this.dead) { this.deadT++; this.y += 2.4; if (this.deadT > 22) this.remove = true; return; }
    this.t += 0.05;
    this.y = this.homeY + Math.sin(this.t) * 28;
    this.x += this.dir * 0.5;
    if (this.x < this.minX) { this.x = this.minX; this.dir = 1; }
    if (this.x > this.maxX) { this.x = this.maxX; this.dir = -1; }
    this.animT++;
    // shoot variant: periodic downward orb (cloud-creature rain drop)
    if (this.shoots) {
      if (this.shootCD == null) this.shootCD = SDD.engine.randInt(80, 140);
      this.shootCD--;
      if (this.shootCD <= 0 && level) {
        this.shootCD = SDD.engine.randInt(140, 220);
        var orb = new Orb(this.x + this.w / 2 - 4, this.y + this.h, 0);
        orb.vx = 0; orb.vy = 0.6;       // drift down
        level.projectiles.push(orb);
        SDD.audio.sfx('bump');
      }
    }
  };
  Wisp.prototype.stomped = function () { this.dead = true; this.deadT = 0; };
  Wisp.prototype.zap = function () { this.dead = true; this.deadT = 0; };
  Wisp.prototype.draw = function (ctx, cam) {
    var f = this.dead ? 1 : (Math.floor(this.animT / 14) % 2);
    var base = 'wisp_' + f;
    drawBC(ctx, (this.variant && SDD.sprites.get(base + '_' + this.variant)) ? base + '_' + this.variant : base, this, cam);
  };

  // ===================== THROWER =====================
  function Thrower(x, y) {
    this.x = x; this.y = y; this.w = 12; this.h = 14;
    this.vx = 0; this.vy = 0; this.onGround = false;
    this.facing = -1; this.cd = SDD.engine.randInt(70, 130);
    this.throwAnim = 0; this.dead = false; this.deadT = 0; this.remove = false;
    this.stompable = false;
  }
  Thrower.prototype.update = function (level) {
    if (this.dead) { this.deadT++; if (this.deadT > 24) this.remove = true; return; }
    this.vy += C.GRAVITY; if (this.vy > C.MAX_FALL) this.vy = C.MAX_FALL;
    this.vx = 0;
    mc(this, level.map);
    this.facing = (level.player.x + level.player.w / 2 < this.x + this.w / 2) ? -1 : 1;
    this.cd--;
    if (this.cd <= 0) {
      this.cd = SDD.engine.randInt(110, 170);
      this.throwAnim = 20;
      var ox = this.facing > 0 ? this.x + this.w : this.x - 8;
      level.spawnOrb(ox, this.y + 4, this.facing);
      SDD.audio.sfx('bump');
    }
    if (this.throwAnim > 0) this.throwAnim--;
  };
  Thrower.prototype.zap = function () { this.dead = true; this.deadT = 0; };
  Thrower.prototype.draw = function (ctx, cam) {
    var f = this.dead ? 1 : (this.throwAnim > 8 ? 1 : 0);
    var dir = this.facing > 0 ? 'r' : 'l';
    var base = 'thrower_' + f + '_' + dir;
    drawBC(ctx, (this.variant && SDD.sprites.get(base + '_' + this.variant)) ? base + '_' + this.variant : base, this, cam);
  };

  // ===================== DARK ORB =====================
  function Orb(x, y, dir) {
    this.x = x; this.y = y; this.w = 8; this.h = 8;
    this.vx = dir * 1.15; this.vy = -0.5; this.life = 280; this.remove = false;
  }
  Orb.prototype.update = function (level) {
    this.vy += 0.022;
    this.x += this.vx; this.y += this.vy;
    this.life--;
    if (this.life <= 0 || this.y > level.map.pxH + 40) this.remove = true;
  };
  Orb.prototype.draw = function (ctx, cam) {
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 9, '#c061da', 0.5);
    drawBC(ctx, 'orb', this, cam);
  };

  // ===================== WATER JET (Day 2-2 crab projectile) =====================
  // Slow horizontal-arc projectile; same hit logic as Orb.
  function WaterJet(x, y, dir) {
    this.x = x; this.y = y; this.w = 8; this.h = 6;
    this.vx = dir * 1.6; this.vy = -1.2;
    this.life = 220; this.remove = false;
  }
  WaterJet.prototype.update = function (level) {
    this.vy += 0.06;
    this.x += this.vx; this.y += this.vy;
    this.life--;
    if (this.life <= 0 || this.y > level.map.pxH + 40) this.remove = true;
  };
  WaterJet.prototype.draw = function (ctx, cam) {
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 9, '#6cd0ff', 0.55);
    drawBC(ctx, this.vx > 0 ? 'waterjet_r' : 'waterjet_l', this, cam);
  };

  // ===================== CRAB (Day 2-2 - walker that throws) =====================
  // Walks back and forth like a Walker AND periodically lobs a WaterJet
  // at the player. Stompable (top is soft shell).
  function Crab(x, y) {
    this.x = x; this.y = y; this.w = 14; this.h = 10;
    this.vx = 0; this.vy = 0; this.dir = -1;
    this.onGround = false; this.dead = false; this.deadT = 0; this.remove = false;
    this.animT = 0; this.stompable = true;
    this.cd = SDD.engine.randInt(120, 200);
    this.throwAnim = 0;
  }
  Crab.prototype.update = function (level) {
    if (this.dead) { this.deadT++; if (this.deadT > 24) this.remove = true; return; }
    this.vy += C.GRAVITY; if (this.vy > C.MAX_FALL) this.vy = C.MAX_FALL;
    this.vx = this.dir * 0.5;
    this.hitWall = 0;
    mc(this, level.map);
    if (this.hitWall) this.dir = -this.hitWall;
    if (this.onGround) {
      var T = C.TILE;
      var footX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
      var bx = Math.floor(footX / T), by = Math.floor((this.y + this.h + 3) / T);
      if (!level.map.isSolid(bx, by) && !level.map.isOneWay(bx, by)) this.dir = -this.dir;
    }
    this.animT++;
    // periodic water-jet
    this.cd--;
    if (this.cd <= 0 && this.onGround) {
      // 33% longer cooldown (120-200 -> 160-266) per Mark's feedback -
      // crab water-jets fired too often on Day 2-2.
      this.cd = SDD.engine.randInt(160, 266);
      this.throwAnim = 16;
      var jetDir = (level.player.x + level.player.w / 2 < this.x + this.w / 2) ? -1 : 1;
      var ox = jetDir > 0 ? this.x + this.w : this.x - 6;
      level.projectiles.push(new WaterJet(ox, this.y + 2, jetDir));
      SDD.audio.sfx('bump');
    }
    if (this.throwAnim > 0) this.throwAnim--;
  };
  Crab.prototype.stomped = function () { this.dead = true; this.deadT = 0; };
  Crab.prototype.zap = function () { this.dead = true; this.deadT = 0; };
  Crab.prototype.draw = function (ctx, cam) {
    var f = this.dead ? 1 : (this.throwAnim > 8 ? 1 : (Math.floor(this.animT / 8) % 2));
    var dir = this.dir > 0 ? 'r' : 'l';
    drawBC(ctx, 'crab_' + f + '_' + dir, this, cam);
  };

  // ===================== LAVA PLUME (Day 3-1) =====================
  // Rises from a ground anchor, peaks, then falls back. Damages player
  // on contact. Sister-class to SolarFlare but inverted.
  function LavaPlume(x, y) {
    this.x = x; this.y = y; this.w = 10; this.h = 14;
    this.vx = 0; this.vy = -3.2;     // rises fast
    this.life = 110; this.remove = false;
    this.startY = y;
  }
  LavaPlume.prototype.update = function (level) {
    this.vy += 0.10;                  // gravity pulls back down
    this.y += this.vy;
    this.life--;
    if (this.life <= 0 || this.y > this.startY + 4) this.remove = true;
  };
  LavaPlume.prototype.draw = function (ctx, cam) {
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 14, '#ff7430', 0.75);
    drawBC(ctx, 'lavaplume', this, cam);
  };

  // ===================== SKY HAZARDS (Day 4) =====================
  // Solar flare - drops straight down with increasing speed. Hits player
  // on contact like an Orb.
  function SolarFlare(x, y) {
    this.x = x; this.y = y; this.w = 8; this.h = 10;
    this.vx = 0; this.vy = 1.0; this.life = 360; this.remove = false;
  }
  SolarFlare.prototype.update = function (level) {
    this.vy += 0.045;
    if (this.vy > 3.6) this.vy = 3.6;
    this.y += this.vy;
    this.life--;
    if (this.life <= 0 || this.y > level.map.pxH + 40) this.remove = true;
  };
  SolarFlare.prototype.draw = function (ctx, cam) {
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 12, '#ffe070', 0.65);
    drawBC(ctx, 'flare', this, cam);
  };

  // Meteor - drifts diagonally across the screen.
  function Meteor(x, y, dir) {
    this.x = x; this.y = y; this.w = 10; this.h = 8;
    this.vx = (dir || 1) * 1.5; this.vy = 0.9;
    this.life = 320; this.remove = false;
  }
  Meteor.prototype.update = function (level) {
    this.vy += 0.012; // slight downward acceleration
    this.x += this.vx; this.y += this.vy;
    this.life--;
    if (this.life <= 0 || this.y > level.map.pxH + 40 ||
        this.x > level.map.pxW + 60 || this.x < -60) this.remove = true;
  };
  Meteor.prototype.draw = function (ctx, cam) {
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 10, '#ff9050', 0.7);
    drawBC(ctx, this.vx > 0 ? 'meteor_r' : 'meteor_l', this, cam);
  };

  // HazardSpawner - invisible periodic spawner placed in level data.
  // Lives in the "enemies" list so its update is called every frame.
  function HazardSpawner(x, y, kind, period, dir) {
    this.x = x; this.y = y; this.w = 1; this.h = 1;
    this.kind = kind || 'flare';
    this.period = period || 90;
    this.t = Math.floor(Math.random() * this.period);
    this.dir = dir || 1;
    this.dead = false; this.deadT = 0; this.remove = false;
    this.stompable = false; this.invisible = true;
  }
  HazardSpawner.prototype.update = function (level) {
    this.t++;
    if (this.t >= this.period) {
      this.t = 0;
      if (this.kind === 'flare') {
        level.projectiles.push(new SolarFlare(this.x, this.y));
      } else if (this.kind === 'meteor') {
        level.projectiles.push(new Meteor(this.x, this.y, this.dir));
      } else if (this.kind === 'meteorH') {
        // horizontal meteor (Day 4-1) - flat trajectory, no downward drift
        var m = new Meteor(this.x, this.y, this.dir);
        m.vy = 0;             // override the default downward bias
        level.projectiles.push(m);
      } else if (this.kind === 'lavaPlume') {
        level.projectiles.push(new LavaPlume(this.x, this.y));
      }
    }
  };
  HazardSpawner.prototype.draw = function () {};
  HazardSpawner.prototype.zap = function () {};      // blast can't kill the sky

  // ===================== PLAYER BLAST =====================
  function Blast(x, y, dir) {
    this.x = x; this.y = y; this.w = 10; this.h = 6;
    this.dir = dir; this.vx = dir * 3.3; this.traveled = 0; this.remove = false;
  }
  Blast.prototype.update = function (level) {
    this.x += this.vx; this.traveled += 3.3;
    var T = C.TILE;
    var cx = Math.floor((this.x + (this.dir > 0 ? this.w : 0)) / T);
    var cy = Math.floor((this.y + this.h / 2) / T);
    if (level.map.isSolid(cx, cy)) this.remove = true;
    if (this.traveled > 70) this.remove = true;
  };
  Blast.prototype.draw = function (ctx, cam) {
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 12, '#fff0a0', 0.6);
    drawBC(ctx, this.dir > 0 ? 'playerblast_r' : 'playerblast_l', this, cam);
  };

  // ===================== MOVING PLATFORM =====================
  function MovPlat(x, y, opt) {
    this.x = x; this.y = y; this.w = 32; this.h = 10;
    this.x0 = x; this.y0 = y;
    this.x1 = (opt && opt.x1 != null) ? opt.x1 : x;
    this.y1 = (opt && opt.y1 != null) ? opt.y1 : y;
    this.spd = (opt && opt.spd) || 0.018;
    this.t = (opt && opt.phase) || 0;
    this.dx = 0; this.dy = 0;
  }
  MovPlat.prototype.update = function () {
    var px = this.x, py = this.y;
    this.t += this.spd;
    var k = (Math.sin(this.t) + 1) / 2;
    this.x = clamp(this.x0 + (this.x1 - this.x0) * k, Math.min(this.x0, this.x1), Math.max(this.x0, this.x1));
    this.y = this.y0 + (this.y1 - this.y0) * k;
    this.dx = this.x - px; this.dy = this.y - py;
  };
  MovPlat.prototype.draw = function (ctx, cam) {
    var s = spr('movplat');
    ctx.drawImage(s, Math.round(this.x - cam.x), Math.round(this.y - cam.y));
  };

  // ===================== POWER CORE =====================
  function Core(x, y) {
    this.x = x; this.y = y; this.w = 12; this.h = 14;
    this.baseY = y; this.t = Math.random() * 6.28; this.remove = false;
  }
  Core.prototype.update = function () { this.t += 0.1; this.y = this.baseY + Math.sin(this.t) * 2.5; };
  Core.prototype.draw = function (ctx, cam) {
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y,
      11, '#46f0ff', 0.4 + Math.sin(this.t * 1.5) * 0.18);
    var f = (Math.floor(this.t * 2) % 2);
    drawBC(ctx, 'core_' + f, this, cam);
  };

  // ===================== ITEM DROP (grow / blast) =====================
  function ItemDrop(x, y, kind) {
    this.x = x; this.y = y; this.w = 14; this.h = 14;
    this.kind = kind;                 // 'grow' or 'blast'
    this.emerge = 16; this.vx = 0; this.vy = 0; this.t = 0;
    this.remove = false;
  }
  ItemDrop.prototype.update = function (level) {
    this.t++;
    if (this.emerge > 0) { this.y -= 1; this.emerge--; if (this.emerge === 0 && this.kind === 'grow') this.vx = 0.55; return; }
    if (this.kind === 'grow') {
      this.vy += C.GRAVITY; if (this.vy > C.MAX_FALL) this.vy = C.MAX_FALL;
      this.hitWall = 0;
      mc(this, level.map);
      if (this.hitWall) this.vx = -this.hitWall * 0.55;
      if (this.vx === 0) this.vx = 0.55;
    } else {
      this.y += Math.sin(this.t * 0.12) * 0.35;
    }
  };
  ItemDrop.prototype.draw = function (ctx, cam) {
    var col = this.kind === 'grow' ? '#ffb24a' : '#fff0a0';
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 13, col, 0.55);
    var f = (Math.floor(this.t / 10) % 2);
    drawBC(ctx, (this.kind === 'grow' ? 'grow_' : 'blastitem_') + f, this, cam);
  };

  // ===================== TIME MACHINE PART (goal) =====================
  function TimePart(x, y) {
    this.x = x; this.y = y; this.w = 14; this.h = 14;
    this.baseY = y; this.t = 0; this.remove = false;
  }
  TimePart.prototype.update = function () { this.t += 0.08; this.y = this.baseY + Math.sin(this.t) * 3; };
  TimePart.prototype.draw = function (ctx, cam) {
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y,
      19, '#9bf0ff', 0.4 + Math.sin(this.t * 2) * 0.16);
    drawBC(ctx, 'timepart', this, cam);
  };

  // ===================== NPC (Day 6 Stage 2: Mankind) =====================
  function NPC(x, y, kind) {
    this.x = x; this.y = y; this.w = 12; this.h = 26;
    this.kind = kind || 'adam';
    this.gave = false; this.bubbleT = 0; this.t = 0;
    this.remove = false;
  }
  NPC.prototype.update = function () {
    this.t++;
    if (this.bubbleT > 0) this.bubbleT--;
  };
  NPC.prototype.draw = function (ctx, cam) {
    drawBC(ctx, 'npc_' + this.kind, this, cam);
    if (this.bubbleT > 0) {
      var bx = Math.round(this.x + this.w / 2 - cam.x);
      var by = Math.round(this.y - cam.y - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(bx - 22, by - 10, 44, 10);
      ctx.strokeStyle = '#1a1a2a'; ctx.lineWidth = 1;
      ctx.strokeRect(bx - 22 + 0.5, by - 10 + 0.5, 43, 9);
      SDD.sprites.text(ctx, 'BLESSINGS!', bx, by - 8, '#1a1a2a', 1, 'center');
    }
  };

  SDD.ent = {
    Player: Player, Walker: Walker, Wisp: Wisp, Thrower: Thrower,
    Orb: Orb, Blast: Blast, MovPlat: MovPlat, Core: Core,
    ItemDrop: ItemDrop, TimePart: TimePart, NPC: NPC,
    SolarFlare: SolarFlare, Meteor: Meteor, HazardSpawner: HazardSpawner,
    Crab: Crab, WaterJet: WaterJet, LavaPlume: LavaPlume
  };
})();
