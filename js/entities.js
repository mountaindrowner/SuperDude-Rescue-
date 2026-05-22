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
  function softShadow(ctx, e, cam) {
    var sx = e.x + e.w / 2 - cam.x, sy = e.y + e.h - cam.y;
    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = '#0a0a16';
    ctx.beginPath();
    ctx.ellipse(sx, sy, e.w * 0.62, 2.6, 0, 0, Math.PI * 2);
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
    this.x = x; this.y = y; this.w = 10; this.h = 14;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.big = false; this.hasBlast = false;
    this.onGround = false; this.coyote = 0; this.jumpBuf = 0;
    this.invuln = 0;
    this.frame = 'idle'; this.animT = 0; this.blastAnim = 0; this.blastCD = 0;
    this.ridePlat = null;
    this.climbing = false; this.inWater = false;
    this.prevOnGround = false; this.landT = 0;
    this.dead = false; this.deadT = 0; this.deadDone = false; this.pitDeath = false;
    this.win = false; this.winT = 0;
  }

  Player.prototype.grow = function () {
    if (this.big) return;
    this.big = true;
    this.y -= 12; this.h = 26; this.w = 12; this.x -= 1;
    SDD.audio.sfx('grow');
  };
  Player.prototype.giveBlast = function () {
    this.hasBlast = true;
    SDD.audio.sfx('power');
  };
  Player.prototype.shrink = function () {
    if (!this.big) return;
    this.big = false;
    this.y += 12; this.h = 14; this.w = 10; this.x += 1;
  };

  // returns true if the hit "lands" (used to suppress repeated hits)
  Player.prototype.hurt = function () {
    if (this.invuln > 0 || this.dead || this.win) return false;
    if (this.big) {
      this.shrink();
      this.invuln = C.INVULN_STEPS;
      SDD.audio.sfx('hit');
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
      if (this.deadT > 150) this.deadDone = true;
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
    var atVine = false;
    var midCol = Math.floor((this.x + this.w / 2) / T);
    var topRow = Math.floor((this.y + 2) / T);
    var botRow = Math.floor((this.y + this.h - 2) / T);
    for (var vy_ = topRow; vy_ <= botRow; vy_++) {
      if (level.map.get(midCol, vy_) === 'V') { atVine = true; break; }
    }
    if (atVine && (In.held('up') || In.held('down') || this.climbing)) this.climbing = true;
    else this.climbing = false;

    if (this.climbing) {
      this.vx = 0; this.vy = 0;
      if (In.held('up')) this.vy = -1.3;
      else if (In.held('down')) this.vy = 1.4;
      if (In.held('left')) { this.vx = -0.7; this.facing = -1; }
      else if (In.held('right')) { this.vx = 0.7; this.facing = 1; }
      if (In.pressed('jump')) {
        this.climbing = false;
        this.vy = C.JUMP_SMALL * 0.7;
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
      if (this.y > level.map.pxH + 28) this.die(true);
      return;
    }

    var maxV = this.big ? C.MOVE_MAX_BIG : C.MOVE_MAX_SMALL;
    var left = In.held('left'), right = In.held('right');

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
      this.vy += C.GRAVITY * gs;
      if (this.vy > C.MAX_FALL) this.vy = C.MAX_FALL;

      if (this.onGround) this.coyote = C.COYOTE; else if (this.coyote > 0) this.coyote--;
      if (In.pressed('jump')) this.jumpBuf = C.JUMP_BUFFER; else if (this.jumpBuf > 0) this.jumpBuf--;
      if (this.jumpBuf > 0 && this.coyote > 0) {
        this.vy = this.big ? C.JUMP_BIG : C.JUMP_SMALL;
        this.jumpBuf = 0; this.coyote = 0;
        SDD.audio.sfx(this.big ? 'jumpbig' : 'jump');
      }
      // variable jump height: releasing A caps upward speed
      if (!In.held('jump') && this.vy < -2.6) this.vy = -2.6;
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

    if (this.invuln > 0) this.invuln--;

    // fell into a pit
    if (this.y > level.map.pxH + 28) this.die(true);
  };

  Player.prototype.draw = function (ctx, cam) {
    if (!this.dead) softShadow(ctx, this, cam);
    if (this.invuln > 0 && (this.invuln % 8) < 4) return;
    var size = this.big ? 'big' : 'small';
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
    if (!this.dead) softShadow(ctx, this, cam);
    var f = this.dead ? 1 : (Math.floor(this.animT / 8) % 2);
    var dir = this.dir > 0 ? 'r' : 'l';
    drawBC(ctx, 'walker_' + f + '_' + dir, this, cam);
  };

  // ===================== WISP (flyer) =====================
  function Wisp(x, y) {
    this.x = x; this.y = y; this.w = 10; this.h = 10;
    this.homeY = y; this.minX = x - 26; this.maxX = x + 26;
    this.t = Math.random() * 6.28; this.dir = Math.random() < 0.5 ? -1 : 1;
    this.dead = false; this.deadT = 0; this.remove = false;
    this.animT = 0; this.stompable = true;
  }
  Wisp.prototype.update = function () {
    if (this.dead) { this.deadT++; this.y += 2.4; if (this.deadT > 22) this.remove = true; return; }
    this.t += 0.05;
    this.y = this.homeY + Math.sin(this.t) * 28;
    this.x += this.dir * 0.5;
    if (this.x < this.minX) { this.x = this.minX; this.dir = 1; }
    if (this.x > this.maxX) { this.x = this.maxX; this.dir = -1; }
    this.animT++;
  };
  Wisp.prototype.stomped = function () { this.dead = true; this.deadT = 0; };
  Wisp.prototype.zap = function () { this.dead = true; this.deadT = 0; };
  Wisp.prototype.draw = function (ctx, cam) {
    var f = this.dead ? 1 : (Math.floor(this.animT / 14) % 2);
    drawBC(ctx, 'wisp_' + f, this, cam);
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
    if (!this.dead) softShadow(ctx, this, cam);
    var f = this.dead ? 1 : (this.throwAnim > 8 ? 1 : 0);
    var dir = this.facing > 0 ? 'r' : 'l';
    drawBC(ctx, 'thrower_' + f + '_' + dir, this, cam);
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
    softShadow(ctx, this, cam);
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
    ItemDrop: ItemDrop, TimePart: TimePart, NPC: NPC
  };
})();
