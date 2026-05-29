// entities.js - the player, enemies, items, projectiles, moving platforms.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var C = SDD.C;
  var mc = SDD.engine.moveAndCollide;
  var overlap = SDD.engine.overlap;
  var clamp = SDD.engine.clamp;

  function spr(name) { return SDD.sprites.get(name); }

  // Flappy stages can override Danny's collision box per-size. The
  // sprite still renders at sprite-natural dimensions; only the hitbox
  // changes. Feet position (y + h) is preserved across the resize.
  function applyFlappyHitboxNow(p, isBig) {
    if (!SDD.scene || !SDD.scene.flappy) return;
    var L = SDD.levels && SDD.levels[SDD.scene.day + '-' + SDD.scene.stage];
    if (!L) return;
    var hb = isBig
      ? (L.flappyBigHitbox || { dx: 0, w: 11, h: 26 })
      : (L.flappySmallHitbox || { dx: 2, w: 9, h: 19 });
    var feet = p.y + p.h;
    p.w = hb.w; p.h = hb.h;
    p.y = feet - p.h;
    p.x += (hb.dx || 0);
  }
  SDD.applyFlappyHitboxNow = applyFlappyHitboxNow;

  // Theme -> step / land SFX surface suffix. Used by Player to pick
  // surface-aware step + landing cues so the kid hears sand crunch
  // on Day 4-1, cloud pillow on Day 5-1, wood thud on Day 6-2 etc.
  // SFX names are wired in audio.js as step_<surface> / land_<surface>.
  var THEME_SURFACE = {
    'sky':           'grass',
    'sea-surface':   'wood',
    'rocky':         'stone',
    'forest':        'grass',
    'sunlit':        'sand',
    'cosmic-night':  'metal',
    'bird-sky':      'cloud',
    'seaside':       'sand',
    'savanna':       'grass',
    'village-dusk':  'wood',
    'eden':          'grass',
    'bugscale':      'wood',
    'galactic':      'metal'
  };
  function surfaceForTheme(theme) {
    return THEME_SURFACE[theme] || 'grass';
  }

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
    this.invuln = 0; this.shrinkAnim = 0; this.flappyStunT = 0;
    this.swimStrokeT = 0; this.swimStrokeIdx = 0;
    this.frame = 'idle'; this.animT = 0; this.blastAnim = 0; this.blastCD = 0;
    this.ridePlat = null;
    this.climbing = false; this.vineCooldown = 0; this.inWater = false;
    this.prevOnGround = false; this.landT = 0;
    this.dead = false; this.deadT = 0; this.deadDone = false; this.pitDeath = false;
    this.win = false; this.winT = 0;
    // Per-stage signature power-up state. Each stage drops ONE themed
    // pickup that activates a kind-specific effect for a few seconds.
    // signatureKind = a string identifier; signatureT counts down to 0.
    this.signatureKind = null;
    this.signatureT = 0;
    this.signatureJumpsUsed = 0;
    // Pearl Shell crack-and-fade animation. Set to ~18 frames when the
    // shell absorbs a hit so the broken shell stays visible for a beat
    // before disappearing - sells the "the shell took it for you" beat.
    this.pearlCrackT = 0;
    // Pass 12 (Mark): in easy mode each size (small / big) takes 2
    // hits before it loses a level (shrink / die). Set on spawn to
    // the current difficulty's max; refilled on grow + on shrink.
    this.hp = maxHP();
  }
  // Per-difficulty hit-points: easy = 2 (2 hits to shrink, then 2 to
  // die = 4 hits total from big), medium / hard = 1 (1 hit = level loss).
  function maxHP() {
    var diff = SDD && SDD.scene && SDD.scene.difficulty;
    return diff === 'easy' ? 2 : 1;
  }

  Player.prototype.grow = function () {
    if (this.big) return;
    this.big = true;
    this.y -= 8; this.h = 31; this.w = 14; this.x -= 1;
    applyFlappyHitboxNow(this, true);
    this.hp = maxHP();
    SDD.audio.sfx('grow');
  };
  Player.prototype.giveBlast = function () {
    this.hasBlast = true;
    SDD.audio.sfx('power');
  };
  // Per-stage signature power-up. Each stage drops a unique themed
  // pickup; consuming it activates `kind` for SIGNATURE_DURATIONS[kind]
  // frames, after which signatureKind clears. Effects are queried
  // throughout the engine via player.signatureKind / signatureT checks.
  Player.prototype.giveSignature = function (kind) {
    // Mark, Pass 12: doubled across the board so kids actually have
    // time to use + appreciate the power before it expires.
    var DURATIONS = {
      sunburst:       16 * 60,
      cloudglide:     20 * 60,
      pearl:          16 * 60,
      flamedash:      16 * 60,
      leafshot:       20 * 60,
      sunshield:      16 * 60,
      starjump:       20 * 60,
      airbubble:      16 * 60,
      callinghorn:    12 * 60,
      friendlybugs:   16 * 60,
      pollentrail:    16 * 60,
      doveblessing:   20 * 60
    };
    this.signatureKind = kind;
    this.signatureT = DURATIONS[kind] || 12 * 60;
    this.signatureJumpsUsed = 0;
    SDD.audio.sfx('power');
  };
  Player.prototype.shrink = function () {
    if (!this.big) return;
    this.big = false;
    this.y += 8; this.h = 23; this.w = 13; this.x += 1;
    applyFlappyHitboxNow(this, false);
    // Refill HP for the small form so easy mode gets its second
    // small-hit before death (Pass 12, Mark).
    this.hp = maxHP();
    // Quick size flicker (handled in draw) + audible shrink cue.
    this.shrinkAnim = 24;
    SDD.audio.sfx('shrink');
  };

  // returns true if the hit "lands" (used to suppress repeated hits)
  Player.prototype.hurt = function () {
    if (SDD.save && SDD.save.data && SDD.save.data.options && SDD.save.data.options.god) return false;
    if (this.invuln > 0 || this.dead || this.win) return false;
    // Sun-burst signature: brief invincibility halo on Day 1.
    if (this.signatureKind === 'sunburst') return false;
    // Pearl signature (Day 2-2): protective shell soaks the next hit,
    // then breaks and the signature ends. Plays a brief invuln window
    // so a chain of jets / jellyfish / etc. doesn't burn through it on
    // the same frame.
    if (this.signatureKind === 'pearl') {
      this.signatureKind = null;
      this.signatureT = 0;
      this.invuln = C.INVULN_STEPS;
      // Crack-and-fade visual for ~18 frames so the shell visibly
      // breaks instead of just blinking out (Mark: "you hear a little
      // crack, and the shell cracks, and it's down one").
      this.pearlCrackT = 18;
      SDD.audio.sfx('crack');
      return false;
    }
    // Pass 12 (Mark): easy mode gives each size 2 hits. HP > 1 means
    // this hit only burns a level of HP, no shrink / death yet.
    if (this.hp == null) this.hp = maxHP();
    this.hp--;
    if (this.hp > 0) {
      this.invuln = C.INVULN_STEPS;
      SDD.audio.sfx('shrink');                     // short cue so the hit reads
      return true;
    }
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
    // celebration / funny-dance coin-flip per win. Only BIG Danny has
    // a 'dance' anim (no small-Danny dance asset), so small always
    // celebrates - otherwise pixDraw would miss and fall back.
    this.winPose = (this.big && Math.random() < 0.5) ? 'dance' : 'celebrate';
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
      var canLeaf_ = this.signatureKind === 'leafshot';
      if ((this.hasBlast || canLeaf_) && In.pressed('blast') && this.blastCD <= 0) {
        var bx_ = this.facing > 0 ? this.x + this.w - 2 : this.x - 8;
        // Blast at lower-body height so it actually hits ground-walking
        // enemies (Mark: "I have a lot of enemies that I can't hit
        // because I'm too tall"). Old offset put the blast at chest
        // level which flew over walkers.
        var by_ = this.y + this.h - (this.big ? 16 : 12);
        level.spawnBlast(bx_, by_, this.facing, canLeaf_ ? 'leaf' : 'blast');
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
    // FLAME DASH signature: run noticeably faster (flame trail drawn in
    // Player.draw). Replaces the old broken "walk on lava" cooling-water.
    if (this.signatureKind === 'flamedash') maxV *= 1.4;
    var left = In.held('left'), right = In.held('right');

    // ----- Flappy mode (Day 5.1) -----
    // Danny auto-flies forward; tap A to flap up. Left/right ignored.
    // Hitting the GROUND = death. Hitting a pillar WALL = bounce off
    // (lose forward momentum + fall) per Mark's "you shouldn't die
    // if he hits the wall - he should just fall down."
    if (level.flappy) {
      this.facing = 1;
      // Default forward speed - dropped to 0 when we just hit a wall
      // so we don't immediately re-collide on the next frame.
      if (this.flappyStunT > 0) {
        this.flappyStunT--;
        this.vx = -0.3;                    // tiny backward nudge while stunned
      } else {
        this.vx = level.flappySpeed || 1.4;
      }
      this.vy += C.GRAVITY * (level.flappyGravity || 0.85) * gs;
      var maxFall = level.flappyMaxFall || 4.5;
      if (this.vy > maxFall) this.vy = maxFall;
      if (In.pressed('jump') && this.flappyStunT <= 0) {
        this.vy = -(level.flappyFlap || 3.4);
        SDD.audio.sfx('jump');
      }
      // ceiling cap so a button-mashed Danny doesn't fly off the top
      if (this.y < 4) { this.y = 4; if (this.vy < 0) this.vy = 0; }
      this.coyote = 0; this.jumpBuf = 0;
      this.onHeadBump = function () {};
      this.hitWall = 0;
      mc(this, level.map);
      // Floor hit = death (no ground to land on in flappy mode).
      if (this.onGround && !SDD.save.data.options.god) {
        this.diedInFlappy = true;
        this.die(false);
      } else if (this.onGround && SDD.save.data.options.god) {
        this.x += 32; this.y = 90; this.vy = 0;
        this.onGround = false;
      } else if (this.hitWall) {
        // Wall hit = bounce. Stun for ~24 frames so the auto-vx
        // doesn't immediately re-push into the wall; player falls
        // (gravity), can flap to recover. SFX cue so it reads.
        this.flappyStunT = 24;
        this.vy = Math.max(this.vy, 1.2);              // small downward kick
        SDD.audio.sfx('bump');
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

    // In fully-underwater levels, the collision hitbox matches the
    // swim sprite outline. Pass 10 round 2 (Mark): "shrink it by 40%"
    // - the previous 59x36 / 51x36 hitbox couldn't thread the tight
    // 3-tile coral gaps. New dims hold the same bbox aspect at 22 high.
    if (level.underwater) {
      var swimW = this.big ? 36 : 31;
      var swimH = 22;
      if (this.w !== swimW || this.h !== swimH) {
        // Keep center horizontal + bottom edge stable across the swap.
        this.x += (this.w - swimW) / 2;
        this.y += (this.h - swimH);
        this.w = swimW;
        this.h = swimH;
      }
    }

    if (this.inWater) {
      // swim physics: heavy drag, mild gravity, paddle on jump press.
      // Underwater drag - constant. Pearl no longer modifies it; pearl
      // is now a one-hit protective shell (see Player.hurt).
      this.vy *= 0.92; this.vx *= 0.92;
      this.vy += C.GRAVITY * 0.18 * gs;
      if (this.vy > 2.2) this.vy = 2.2;
      if (In.pressed('jump')) {
        // Stronger paddle in the small escape pools of walking levels
        // (6-1 water-over-pits) so spamming jump reliably climbs out;
        // the fully-underwater 5-2 keeps its tuned -2.7 feel.
        this.vy = level.underwater ? -2.7 : -3.4;
        SDD.audio.sfx('jump');
        // Each spacebar press triggers a fresh stroke animation cycle.
        // Mark Pass 9: "should change every time I press the spacebar
        // to swim. It's just like cycling too fast" - so we now gate
        // the animation on input instead of free-running on time.
        this.swimStrokeT = 24;
      }
      if (this.swimStrokeT > 0) this.swimStrokeT--;
      this.coyote = 0; this.jumpBuf = 0;
    } else {
      // god mode: lighter gravity + extra-high jumps for fast testing
      var godMul = SDD.save.data.options.god ? 0.6 : 1.0;
      var godJumpMul = SDD.save.data.options.god ? 1.4 : 1.0;
      this.vy += C.GRAVITY * gs * godMul;
      // Cloud-glide signature: hold A while falling to descend slowly.
      // Applies only during the descent so jumping still has full launch.
      if (this.signatureKind === 'cloudglide' && !this.onGround && this.vy > 0 && In.held('jump')) {
        this.vy *= 0.55;
      }
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
        if (this.onGround) this.signatureJumpsUsed = 0;
      } else if (this.signatureKind === 'starjump' && !this.onGround && this.jumpBuf > 0 && this.signatureJumpsUsed < 2) {
        // Star-jump signature: two extra mid-air jumps in low gravity.
        var js2 = level.jumpScale || 1.0;
        this.vy = (this.big ? C.JUMP_BIG : C.JUMP_SMALL) * godJumpMul * js2 * 0.85;
        this.jumpBuf = 0;
        this.signatureJumpsUsed++;
        SDD.audio.sfx('jump');
      }
      if (this.onGround) this.signatureJumpsUsed = 0;
      // variable jump height: releasing A caps upward speed (looser in god)
      var capV = SDD.save.data.options.god ? -3.6 : -2.6;
      if (!In.held('jump') && this.vy < capV) this.vy = capV;
    }

    // blast / leaf-shot (lower-body height so it hits ground-walkers).
    // Leaf-shot signature (Day 3-2) lets the player fire green leaf
    // projectiles even without the blast power-up; while the signature
    // is active every B press fires a leaf instead of a light blast.
    if (this.blastCD > 0) this.blastCD--;
    var canLeaf = this.signatureKind === 'leafshot';
    if ((this.hasBlast || canLeaf) && In.pressed('blast') && this.blastCD <= 0) {
      var bx = this.facing > 0 ? this.x + this.w - 2 : this.x - 8;
      var by = this.y + this.h - (this.big ? 16 : 12);
      level.spawnBlast(bx, by, this.facing, canLeaf ? 'leaf' : 'blast');
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

    // Moving platforms (one-way: land on top). Per Mark: Danny floats
    // visually a couple px above movers - sink him down so he reads
    // as actually standing on them. Small Danny: +2 px deeper, Big
    // Danny: +3 px deeper. Also widened horizontal overlap by 2 px on
    // each side so small Danny doesn't slip off edges that he isn't
    // really at.
    this.ridePlat = null;
    var sink = this.big ? 3 : 2;
    for (var i = 0; i < level.platforms.length; i++) {
      var p = level.platforms[i];
      var feet = this.y + this.h;
      var horiz = this.x + this.w > p.x && this.x < p.x + p.w;
      // Re-latch threshold must cover (a) the visual "sink" offset
      // baked into the standing y, AND it has to be measured against
      // the platform's PREVIOUS-frame top, not its current top.
      // Otherwise a fast downward-moving platform (a falling LeafFall
      // in 6-2) whose top dips within sink+2 of a player standing on
      // the ground in the same frame will yank the player upward onto
      // it - "squish glitch". Using prevTop = p.y - p.dy keeps the
      // legitimate Pass-9 upward-platform case working and tightens
      // the downward case to exactly "feet were above the platform
      // last frame".
      var prevTop = p.y - (p.dy || 0);
      if (this.vy >= 0 && horiz && prevFeet <= prevTop + sink + 2 &&
          feet >= p.y && feet <= p.y + 10) {
        this.y = p.y - this.h + sink; this.vy = 0; this.onGround = true; this.ridePlat = p;
      }
    }

    // land detection (transition from airborne to onGround). Play a
    // surface-aware landing thump (Mark: "running and landing cues
    // consistent with what he's walking on").
    if (!this.prevOnGround && this.onGround) {
      this.landT = 6;
      SDD.audio.sfx('land_' + surfaceForTheme(level.theme));
    }
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
    // ~14 frames so it matches the walk cycle. SFX name picks a
    // surface variant based on level.theme (grass / sand / stone /
    // wood / cloud / metal / water).
    if (this.onGround && Math.abs(this.vx) > 0.4) {
      if ((this.animT % 14) === 0) {
        SDD.audio.sfx('step_' + surfaceForTheme(level.theme));
      }
    }

    if (this.invuln > 0) this.invuln--;
    if (this.shrinkAnim > 0) this.shrinkAnim--;
    if (this.signatureT > 0) {
      this.signatureT--;
      if (this.signatureT === 0) {
        this.signatureKind = null;
        this.signatureJumpsUsed = 0;
      }
    }
    if (this.pearlCrackT > 0) this.pearlCrackT--;

    // fell into a pit (skipped in fully-underwater levels - water IS the level)
    if (!level.underwater && this.y > level.map.pxH + 28) {
      if (SDD.save.data.options.god) { this.y = 32; this.vy = 0; }
      else this.die(true);
    }
    // Lava floor hazard (Day 3-1 pit gaps): touching the 'L' tile kills
    // the same as a pit-fall. Checked at the player's feet row so a
    // brush at full speed registers cleanly.
    if (!this.dead && level && level.map) {
      var lvT = 16;
      var lTx0 = Math.floor((this.x + 2) / lvT);
      var lTx1 = Math.floor((this.x + this.w - 2) / lvT);
      var lTyBot = Math.floor((this.y + this.h - 1) / lvT);
      for (var ltx = lTx0; ltx <= lTx1; ltx++) {
        if (level.map.get(ltx, lTyBot) === 'L') {
          if (SDD.save.data.options.god) { this.y = 32; this.vy = 0; }
          else this.die(true);
          break;
        }
      }
    }

    // Open-void levels (Day 4-2 cosmic-night): rising too high above
    // the top of the map kills the same as falling off the bottom.
    if (level.topDeath && this.y < -48) {
      if (SDD.save.data.options.god) { this.y = 32; this.vy = 0; }
      else this.die(true);
    }
  };

  // Pass 12 (Mark): "if he has the sun power he has a little sun
  // above his head; wing power, a little wing; etc." A small pixel
  // glyph floats above Danny's head for the duration of the active
  // signature so a kid can SEE what power they're holding without
  // reading the HUD. Each kind gets a 12x12 procedural icon.
  Player.prototype.drawSignatureSymbol = function (ctx, cam) {
    if (!this.signatureKind || this.signatureT <= 0) return;
    var cx = Math.round(this.x + this.w / 2 - cam.x);
    var bob = Math.round(Math.sin((this.signatureT) * 0.18) * 1);
    var top = Math.round(this.y - cam.y) - 17 + bob;   // raised ~6px (Mark)
    var kind = this.signatureKind;
    // Soft glow behind the icon so it pops on dark / busy backgrounds.
    var col = SIG_ICON_COLOR[kind] || '#ffe890';
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(this.signatureT * 0.22);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(cx, top + 5, 7, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    drawSigIcon(ctx, kind, cx, top, col);
    ctx.restore();
    // Per-kind particle emission around the indicator so each
    // signature visually broadcasts what it's doing (Batch F).
    drawSigParticles(ctx, kind, cx, top, this.signatureT);
  };
  var SIG_ICON_COLOR = {
    sunburst: '#ffd84a', cloudglide: '#e8f0ff', pearl: '#a0e0ff',
    flamedash: '#ff7a2a', leafshot: '#90e060', sunshield: '#ffe890',
    starjump: '#ffe890', airbubble: '#a8e6ff',
    callinghorn: '#ffce46', friendlybugs: '#e8a838',
    pollentrail: '#fff2a6',
    doveblessing: '#ffffff'
  };
  function drawSigIcon(ctx, kind, cx, top, col) {
    var y = top;
    ctx.fillStyle = '#ffffff';
    if (kind === 'sunburst' || kind === 'sunshield') {
      // Sun disc + 4 rays
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(cx - 2, y + 3, 4, 4);
      ctx.fillStyle = '#ffe890'; ctx.fillRect(cx - 1, y + 4, 2, 2);
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - 4, y + 4, 1, 2);
      ctx.fillRect(cx + 3, y + 4, 1, 2); ctx.fillRect(cx - 1, y + 1, 2, 1);
      ctx.fillRect(cx - 1, y + 8, 2, 1);
      if (kind === 'sunshield') {                          // halo ring
        ctx.strokeStyle = '#ffe890'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, y + 5, 6, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (kind === 'cloudglide') {
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - 3, y + 4, 7, 3);
      ctx.fillRect(cx - 2, y + 3, 5, 5); ctx.fillRect(cx - 4, y + 5, 9, 1);
    } else if (kind === 'pearl') {
      ctx.fillStyle = '#406890'; ctx.fillRect(cx - 3, y + 3, 6, 6);
      ctx.fillStyle = '#a0e0ff'; ctx.fillRect(cx - 2, y + 4, 4, 4);
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - 1, y + 4, 1, 1);
    } else if (kind === 'flamedash') {
      // flame: orange teardrop with a yellow core
      ctx.fillStyle = '#ff7a2a'; ctx.fillRect(cx - 1, y + 1, 3, 2);
      ctx.fillRect(cx - 2, y + 3, 5, 5); ctx.fillRect(cx - 3, y + 6, 7, 2);
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(cx - 1, y + 4, 2, 3);
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - 1, y + 5, 1, 1);
    } else if (kind === 'leafshot') {
      // Leaf: teardrop / lance shape with a centre vein.
      ctx.fillStyle = '#345020';
      ctx.fillRect(cx - 1, y + 2, 3, 1);
      ctx.fillRect(cx - 2, y + 3, 5, 2);
      ctx.fillRect(cx - 2, y + 5, 5, 2);
      ctx.fillRect(cx - 1, y + 7, 3, 1);
      ctx.fillStyle = '#90e060';
      ctx.fillRect(cx - 1, y + 3, 3, 1);
      ctx.fillRect(cx - 1, y + 5, 3, 1);
      ctx.fillStyle = '#c8ee7a';
      ctx.fillRect(cx, y + 4, 1, 1);
    } else if (kind === 'starjump') {
      ctx.fillStyle = '#ffe890';
      ctx.fillRect(cx - 1, y + 1, 2, 8); ctx.fillRect(cx - 4, y + 4, 8, 2);
      ctx.fillStyle = '#fff'; ctx.fillRect(cx, y + 4, 1, 2);
    } else if (kind === 'airbubble') {
      ctx.strokeStyle = '#a8e6ff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, y + 5, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - 2, y + 3, 1, 1);
    } else if (kind === 'callinghorn') {
      ctx.fillStyle = '#ffce46';
      ctx.fillRect(cx - 3, y + 5, 6, 2); ctx.fillRect(cx + 3, y + 4, 2, 4);
      ctx.fillRect(cx - 4, y + 4, 1, 4); ctx.fillStyle = '#a07820';
      ctx.fillRect(cx - 3, y + 5, 1, 2);
    } else if (kind === 'friendlybugs') {
      // Bee with stripes + tiny wings.
      ctx.fillStyle = '#e8a838'; ctx.fillRect(cx - 2, y + 4, 5, 3);
      ctx.fillStyle = '#1a1208';
      ctx.fillRect(cx - 2, y + 4, 1, 3); ctx.fillRect(cx, y + 4, 1, 3);
      ctx.fillRect(cx + 2, y + 4, 1, 3);
      ctx.fillStyle = '#e8f0ff';
      ctx.fillRect(cx - 3, y + 3, 2, 1); ctx.fillRect(cx + 2, y + 3, 2, 1);
    } else if (kind === 'pollentrail') {
      // Cluster of pollen dots.
      ctx.fillStyle = '#fff2a6';
      ctx.fillRect(cx - 3, y + 4, 1, 1); ctx.fillRect(cx - 1, y + 2, 1, 1);
      ctx.fillRect(cx + 1, y + 5, 1, 1); ctx.fillRect(cx + 3, y + 3, 1, 1);
      ctx.fillRect(cx + 2, y + 7, 1, 1); ctx.fillRect(cx - 2, y + 6, 1, 1);
      ctx.fillStyle = '#fff'; ctx.fillRect(cx, y + 4, 1, 1);
    } else if (kind === 'doveblessing') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx - 3, y + 4, 6, 2); ctx.fillRect(cx - 4, y + 5, 2, 1);
      ctx.fillRect(cx + 2, y + 5, 2, 1); ctx.fillRect(cx + 1, y + 3, 2, 2);
      ctx.fillStyle = '#ffce46'; ctx.fillRect(cx + 3, y + 4, 1, 1);
    } else {
      ctx.fillStyle = col;
      ctx.fillRect(cx - 3, y + 3, 6, 6);
    }
  }

  // Per-kind particle field around the signature indicator. Drawn
  // every frame the signature is active so each effect reads
  // instantly: pollen drifts up, leaves spiral, bees orbit, water
  // drips, sound waves ripple, etc. All effects use signatureT as
  // their phase so they animate without needing per-particle state.
  function drawSigParticles(ctx, kind, cx, top, t) {
    var cy = top + 5;                                 // icon centre Y
    ctx.save();
    if (kind === 'sunburst') {
      // 4 rotating golden rays radiating outward.
      var ang = t * 0.06;
      ctx.fillStyle = '#ffd84a';
      for (var sb = 0; sb < 4; sb++) {
        var a = ang + sb * 1.57;
        var rx = cx + Math.round(Math.cos(a) * 10);
        var ry = cy + Math.round(Math.sin(a) * 10);
        ctx.fillRect(rx, ry, 2, 2);
      }
    } else if (kind === 'cloudglide') {
      // White wisps drifting down below the icon.
      ctx.fillStyle = '#fff';
      for (var cg = 0; cg < 3; cg++) {
        var phase = (t + cg * 20) % 60;
        var cgy = cy + 6 + Math.round(phase * 0.25);
        var cgx = cx + Math.round(Math.sin((t + cg * 15) * 0.1) * 4) - 1;
        ctx.globalAlpha = 1 - phase / 60;
        ctx.fillRect(cgx, cgy, 3, 1);
        ctx.fillRect(cgx + 1, cgy - 1, 1, 1);
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'pearl') {
      // Soft blue sparkles cycling around the shell.
      ctx.fillStyle = '#fff';
      for (var p = 0; p < 4; p++) {
        var ap = t * 0.08 + p * 1.57;
        var px = cx + Math.round(Math.cos(ap) * 8);
        var py = cy + Math.round(Math.sin(ap) * 8);
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.15 + p);
        ctx.fillRect(px, py, 1, 1);
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'flamedash') {
      // Flame flecks flickering up off the icon.
      for (var cw = 0; cw < 4; cw++) {
        var cwphase = (t + cw * 9) % 30;
        var cwy = cy + 4 - Math.round(cwphase * 0.4);
        var cwx = cx + Math.round((cw - 1.5) * 3 + Math.sin((t + cw * 5) * 0.2) * 2);
        ctx.globalAlpha = 1 - cwphase / 30;
        ctx.fillStyle = (cw % 2) ? '#ffd23a' : '#ff7a2a';
        ctx.fillRect(cwx, cwy, 1, 2);
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'leafshot') {
      // Tiny green leaves spiralling around the icon.
      ctx.fillStyle = '#90e060';
      for (var lf = 0; lf < 4; lf++) {
        var al = t * 0.07 + lf * 1.57;
        var lr = 9 + Math.sin(t * 0.08 + lf) * 1.5;
        var lx = cx + Math.round(Math.cos(al) * lr);
        var ly = cy + Math.round(Math.sin(al) * lr);
        ctx.fillRect(lx, ly, 2, 1);
      }
    } else if (kind === 'sunshield') {
      // Expanding golden halo rings.
      ctx.strokeStyle = '#ffe890';
      ctx.lineWidth = 1;
      for (var sh = 0; sh < 2; sh++) {
        var shPhase = ((t + sh * 18) % 36) / 36;
        ctx.globalAlpha = 1 - shPhase;
        ctx.beginPath();
        ctx.arc(cx, cy, 6 + shPhase * 10, 0, 6.28);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'starjump') {
      // Small star sparkles popping around the icon.
      ctx.fillStyle = '#fff';
      for (var st = 0; st < 5; st++) {
        var stPhase = ((t + st * 12) % 30) / 30;
        ctx.globalAlpha = Math.sin(stPhase * 3.14);
        var stx = cx + ((st * 7 + (t >> 3) * 3) % 18) - 9;
        var sty = cy + ((st * 5 + (t >> 2)) % 14) - 7;
        ctx.fillRect(stx, sty, 1, 1);
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'airbubble') {
      // Tiny bubbles rising up from below.
      ctx.strokeStyle = '#e8f6ff';
      ctx.lineWidth = 1;
      for (var ab = 0; ab < 3; ab++) {
        var abPhase = (t + ab * 16) % 50;
        var aby = cy + 6 - Math.round(abPhase * 0.4);
        var abx = cx + Math.round(Math.sin(abPhase * 0.2) * 3) + (ab - 1) * 3;
        ctx.globalAlpha = 1 - abPhase / 50;
        ctx.beginPath(); ctx.arc(abx, aby, 1.5, 0, 6.28); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'callinghorn') {
      // Concentric sound waves rippling outward.
      ctx.strokeStyle = '#ffce46';
      ctx.lineWidth = 1;
      for (var ch = 0; ch < 3; ch++) {
        var chPhase = ((t + ch * 12) % 36) / 36;
        ctx.globalAlpha = 1 - chPhase;
        ctx.beginPath();
        ctx.arc(cx, cy, 4 + chPhase * 12, -0.5, 0.5);     // forward-facing arc
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'friendlybugs') {
      // 3 small bee dots orbiting around the icon.
      for (var fb = 0; fb < 3; fb++) {
        var afb = t * 0.10 + fb * 2.09;
        var fbx = cx + Math.round(Math.cos(afb) * 10);
        var fby = cy + Math.round(Math.sin(afb) * 6);
        ctx.fillStyle = '#e8a838';
        ctx.fillRect(fbx, fby, 2, 1);
        ctx.fillStyle = '#1a1208';
        ctx.fillRect(fbx + 1, fby, 1, 1);
      }
    } else if (kind === 'pollentrail') {
      // Yellow pollen flecks drifting upward in a slim column.
      ctx.fillStyle = '#fff2a6';
      for (var pt = 0; pt < 5; pt++) {
        var ptPhase = (t + pt * 12) % 40;
        var pty = cy + 4 - Math.round(ptPhase * 0.3);
        var ptx = cx + Math.round(Math.sin((t + pt * 10) * 0.18) * 3);
        ctx.globalAlpha = 1 - ptPhase / 40;
        ctx.fillRect(ptx, pty, 1, 1);
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'doveblessing') {
      // White feathers drifting down with side-to-side sway.
      ctx.fillStyle = '#fff';
      for (var db = 0; db < 3; db++) {
        var dbPhase = (t + db * 18) % 54;
        var dby = cy + 5 + Math.round(dbPhase * 0.22);
        var dbx = cx + Math.round(Math.sin((t + db * 14) * 0.13) * 6);
        ctx.globalAlpha = 1 - dbPhase / 54;
        ctx.fillRect(dbx, dby, 1, 2);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  Player.prototype.draw = function (ctx, cam) {
    // Heavy "ouch" pose plays for the first ~24 steps of invuln, then we
    // fall back to the classic invincibility flicker.
    var freshHurt = this.invuln > C.INVULN_STEPS - 24;
    if (!freshHurt && this.invuln > 0 && (this.invuln % 8) < 4) return;
    this.drawSignatureSymbol(ctx, cam);
    // Pearl Shell signature: large iridescent oval shell around Danny
    // (Mark: "a bigger effect, like a big white outline above my
    // character that looks like a pearlescent shell"). Stays during
    // signature lifetime, plus a brief crack-and-fade overlay for ~18
    // frames after a hit consumes it.
    if ((this.signatureKind === 'pearl' && this.signatureT > 0) || this.pearlCrackT > 0) {
      var psx = Math.round(this.x + this.w / 2 - cam.x);
      var psy = Math.round(this.y + this.h / 2 - cam.y);
      // Slightly oval (vertical), larger than the airbubble.
      var psRX = (this.big ? 30 : 24);
      var psRY = (this.big ? 36 : 28);
      var cracking = this.pearlCrackT > 0;
      // Cracking phase fades + shakes the shell out over its lifetime.
      var crackProg = cracking ? (1 - this.pearlCrackT / 18) : 0;     // 0 -> 1
      var shellAlpha = cracking ? (1 - crackProg) : 1;
      var shake = cracking ? Math.round((Math.random() - 0.5) * 3 * (1 - crackProg)) : 0;
      ctx.save();
      ctx.translate(shake, 0);
      // Outer halo glow (pearl-blue).
      ctx.globalAlpha = 0.22 * shellAlpha;
      ctx.fillStyle = '#a0e0ff';
      ctx.beginPath(); ctx.ellipse(psx, psy, psRX + 4, psRY + 4, 0, 0, 6.28); ctx.fill();
      // Soft pearl body (white, ~35% alpha so Danny's still visible).
      ctx.globalAlpha = 0.35 * shellAlpha;
      ctx.fillStyle = '#f8fbff';
      ctx.beginPath(); ctx.ellipse(psx, psy, psRX, psRY, 0, 0, 6.28); ctx.fill();
      // Iridescent shimmer band rotating around the rim - pink + cyan
      // alternating arcs driven by a slow time index so the shell
      // reads as pearlescent rather than just white. Drawn as a thin
      // stroked arc at the equator + slow rotation.
      var shimmerT = (this.signatureT || 0) * 0.04 + crackProg * 2;
      ctx.globalAlpha = 0.55 * shellAlpha;
      ctx.lineWidth = 1;
      var bandColors = ['#ffd2ee', '#cef4ff', '#fff2c8', '#e2cffd'];
      for (var ib = 0; ib < 4; ib++) {
        ctx.strokeStyle = bandColors[ib];
        var a0 = shimmerT + ib * 1.57;
        ctx.beginPath();
        ctx.ellipse(psx, psy, psRX - 1, psRY - 1, 0, a0, a0 + 0.9);
        ctx.stroke();
      }
      // Bright outline + highlight sparkle on the upper-left.
      ctx.globalAlpha = 0.85 * shellAlpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(psx, psy, psRX, psRY, 0, 0, 6.28); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(psx - psRX + 5, psy - psRY / 2, 3, 2);
      ctx.fillRect(psx - psRX + 7, psy - psRY / 2 + 3, 1, 1);
      // Crack lines: three jagged fractures branching outward from the
      // center, growing in length as crackProg goes 0 -> 1.
      if (cracking) {
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#1a1a3a';
        ctx.lineWidth = 1;
        var crackAngles = [-0.5, 0.8, 2.1, -2.4];
        for (var cr = 0; cr < crackAngles.length; cr++) {
          var caA = crackAngles[cr];
          var segs = 3 + cr;
          var rx = 0, ry = 0;
          var lenMax = Math.min(psRX, psRY) * crackProg;
          ctx.beginPath();
          ctx.moveTo(psx, psy);
          for (var sg = 1; sg <= segs; sg++) {
            var frac = sg / segs;
            var jitter = (cr + sg) % 2 ? 3 : -3;
            rx = Math.cos(caA) * lenMax * frac + Math.cos(caA + 1.57) * jitter * frac;
            ry = Math.sin(caA) * lenMax * frac + Math.sin(caA + 1.57) * jitter * frac;
            ctx.lineTo(psx + rx, psy + ry);
          }
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Air-bubble signature (Day 5-2): visible bubble shell around
    // Danny so the kid SEES that jellyfish + sea creatures bounce
    // off (Mark: "not sure what she does" - because it was invisible).
    if (this.signatureKind === 'airbubble' && this.signatureT > 0) {
      var abx = Math.round(this.x + this.w / 2 - cam.x);
      var aby = Math.round(this.y + this.h / 2 - cam.y);
      var abR = (this.big ? 22 : 17) + Math.round(Math.sin(this.signatureT * 0.18));
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#a8e6ff';
      ctx.beginPath(); ctx.arc(abx, aby, abR, 0, 6.28); ctx.fill();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#e8f6ff';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(abx, aby, abR, 0, 6.28); ctx.stroke();
      // Sparkle on the upper-left.
      ctx.fillStyle = '#fff';
      ctx.fillRect(abx - abR + 4, aby - abR / 2, 2, 2);
      ctx.restore();
    }
    var size = this.big ? 'big' : 'small';
    // Big->small shrink: flicker between sizes for ~24 frames so the
    // transition reads visually (not just an instant size change).
    if (this.shrinkAnim > 0 && (this.shrinkAnim % 6) < 3) size = 'big';
    var drewSprite = false;

    // Prefer the PixelLab PNG sprites once they've finished loading.
    if (SDD.sprites.pixelLab && SDD.sprites.pixelLab.ready &&
        SDD.sprites.pixelLab.failed === 0) {
      var anim, idx, dirPL = this.facing > 0 ? 'east' : 'west';
      var maxV = this.big ? C.MOVE_MAX_BIG : C.MOVE_MAX_SMALL;
      // Per-level costume suffix - cosmic-night = spacesuit anims for
      // run/jump/hurt/die, flappy = jetpack anim while flying.
      var scene = SDD && SDD.scene;
      var theme = scene && scene.theme;
      var isFlappy = scene && scene.flappy;
      var isUnder  = scene && scene.underwater;
      // Spacesuit costume on 4-2 (cosmic-night) AND 4-1 (sun) - Mark
      // wanted more mileage out of the spacesuit by wearing it near
      // the sun too. 4-1 keeps its normal gravity; only the costume
      // (and the dropped sweat overlay below) changes there.
      var costume = (theme === 'cosmic-night' || theme === 'sunlit') ? 'space' : '';
      if (this.win) {
        // celebrate (9f) or funny dance (16f), chosen at victory().
        anim = (this.winPose === 'dance') ? 'dance' : 'celebrate';
        dirPL = 'south';
        idx = Math.floor(this.animT / 5) % (anim === 'dance' ? 16 : 9);
      } else if (this.climbing) {
        anim = 'climb'; dirPL = 'north';
        idx = Math.floor(this.animT / 5) % 9;
      } else if (isFlappy) {
        // Jetpack ignite anim runs continuously while flying. Pause
        // the cycle on the brief flap-stun so the burst loop pauses.
        anim = 'jet';
        idx = this.flappyStunT > 0 ? 0 : Math.floor(this.animT / 3) % 9;
      } else if (this.dead) {
        anim = costume ? 'space_die' : 'die';
        idx = Math.min(6, Math.floor(this.deadT / 10));
      } else if (freshHurt) {
        anim = costume ? 'space_hurt' : 'hurt';
        idx = Math.min(5, Math.floor((C.INVULN_STEPS - this.invuln) / 4));
      } else if (this.blastAnim > 0) {
        anim = 'blast';                                 // no spacesuit blast variant
        idx = Math.floor((11 - this.blastAnim) / 4);
      } else if (isUnder) {
        // Underwater swim anim - frame index ramps through the stroke
        // on each spacebar press, then rests at frame 0 between strokes.
        anim = 'swim';
        if (this.swimStrokeT > 0) {
          // Map remaining stroke time (24 -> 0) onto frames 0 -> 8.
          idx = Math.min(8, Math.floor((24 - this.swimStrokeT) / 3));
        } else {
          idx = 0;                                   // rest pose
        }
      } else if (this.landT > 0) {
        anim = costume ? 'space_jump' : 'jump'; idx = 8;
      } else if (!this.onGround) {
        anim = costume ? 'space_jump' : 'jump';
        if (this.vy < -3) idx = 1;
        else if (this.vy < 0) idx = 3;
        else if (this.vy < 2) idx = 5;
        else idx = 7;
      } else if (Math.abs(this.vx) > 0.4) {
        anim = costume ? 'space_run' : 'run';
        idx = Math.floor(this.animT / 4) % (costume ? 9 : 4);
      } else {
        anim = costume ? 'space_idle' : 'idle';          // spacesuit breathing idle on 4-1/4-2
        idx = Math.floor(this.animT / 18) % 4;
      }
      var cx = Math.round(this.x + this.w / 2 - cam.x);
      var baselineY = Math.round(this.y + this.h - cam.y);
      var ok = SDD.sprites.pixDraw(ctx, size, anim, dirPL, idx, cx, baselineY);
      // Day 4-1 "sweating" overlay: tiny animated water drops on
      // Danny's head + cheeks while in the sunlit theme. Sells the
      // "African heat" feel of the Sun stage (Mark Pass 9: "subtle
      // sweating overlay on Big/Small Danny while in this level").
      // Sweat overlay is suppressed when the spacesuit is on (the
      // helmet covers his head) - so it no longer shows on 4-1 now
      // that the sun level uses the spacesuit costume.
      if (ok && theme === 'sunlit' && !costume && !this.dead && !this.win) {
        var t = this.animT;
        var headY = baselineY - (this.big ? 32 : 22);
        var leftX = cx - 5, rightX = cx + 4;
        ctx.fillStyle = '#a8e0ff';
        // Drop 1 - left temple, falls + resets
        var d1 = (t * 0.6) % 28;
        if (d1 < 14) ctx.fillRect(leftX, (headY + d1) | 0, 1, 2);
        // Drop 2 - right cheek, offset phase
        var d2 = ((t * 0.6) + 14) % 32;
        if (d2 < 14) ctx.fillRect(rightX, (headY + 2 + d2) | 0, 1, 2);
        // Tiny shine on each active drop
        ctx.fillStyle = '#ffffff';
        if (d1 < 14) ctx.fillRect(leftX, (headY + d1) | 0, 1, 1);
        if (d2 < 14) ctx.fillRect(rightX, (headY + 2 + d2) | 0, 1, 1);
      }
      drewSprite = ok;
    }
    // If the PixelLab path didn't render (still loading, a missing
    // frame, or a costume/pose with no variant), fall back to the IDLE
    // frames - which always exist for both sizes - never the old
    // hand-coded first-iteration sprite (Mark: "remove the old version
    // completely"). While frames are still downloading, draw nothing
    // for that sub-second window.
    if (!drewSprite) {
      var pl = SDD.sprites.pixelLab;
      if (!pl || pl.ready) {
        var fdir = this.facing > 0 ? 'east' : 'west';
        var fcx = Math.round(this.x + this.w / 2 - cam.x);
        var fby = Math.round(this.y + this.h - cam.y);
        SDD.sprites.pixDraw(ctx, size, 'idle', fdir, 0, fcx, fby);
      }
    }

    // Friendly-Bugs signature: two thin antennas wiggle out the top of
    // Danny's head so the kid sees the buff (Mark: "the friendly buff,
    // it looks like my character gains antennas").
    if (this.signatureKind === 'friendlybugs' && this.signatureT > 0) {
      var hcx = Math.round(this.x + this.w / 2 - cam.x);
      var hty = Math.round(this.y - cam.y) + (this.big ? -2 : 0);
      var wig = Math.sin(this.signatureT * 0.18) * 1.2;
      ctx.save();
      ctx.strokeStyle = '#1a1004';
      ctx.lineWidth = 1;
      // Left antenna
      ctx.beginPath();
      ctx.moveTo(hcx - 3, hty);
      ctx.lineTo(hcx - 4 + wig, hty - 4);
      ctx.lineTo(hcx - 5 + wig, hty - 7);
      ctx.stroke();
      // Right antenna
      ctx.beginPath();
      ctx.moveTo(hcx + 3, hty);
      ctx.lineTo(hcx + 4 - wig, hty - 4);
      ctx.lineTo(hcx + 5 - wig, hty - 7);
      ctx.stroke();
      // Antenna tip beads (warm pollen-yellow)
      ctx.fillStyle = '#ffd23a';
      ctx.fillRect(hcx - 6 + Math.round(wig), hty - 8, 2, 2);
      ctx.fillRect(hcx + 4 - Math.round(wig), hty - 8, 2, 2);
      ctx.restore();
    }

    // FLAME DASH signature: flames stream off Danny's sneakers while he
    // dashes along the ground (Mark: "leaves a little trail of fire").
    if (this.signatureKind === 'flamedash' && this.onGround && Math.abs(this.vx) > 0.3) {
      var ftX = Math.round(this.x + this.w / 2 - cam.x) - this.facing * 4;
      var ftY = Math.round(this.y + this.h - cam.y) - 2;
      for (var ft = 0; ft < 4; ft++) {
        var ph = (this.animT * 1.5 + ft * 6) % 20;
        var fxp = ftX - this.facing * Math.round(ph * 0.7 + ft * 2);
        var fyp = ftY - Math.round(ph * 0.25) + (ft % 2);
        ctx.globalAlpha = (1 - ph / 20) * 0.85;
        ctx.fillStyle = (ft % 2) ? '#ffd23a' : '#ff7a2a';
        var fsz = 2 - Math.floor(ph / 12);
        if (fsz > 0) ctx.fillRect(fxp, fyp, fsz, fsz);
      }
      ctx.globalAlpha = 1;
    }
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
    // Quiet ambient cue every ~5-10 sec while the player is nearby.
    // amb_growl for lion / amb_skitter for everything else.
    if (level.player && Math.random() < 0.003) {
      var pl = level.player;
      var ad = Math.abs((this.x + this.w / 2) - (pl.x + pl.w / 2));
      if (ad < 220) {
        SDD.audio.sfx(this.variant === 'lion' ? 'amb_growl' : 'amb_skitter');
      }
    }
    if (this.onGround) {
      var T = C.TILE;
      var footX = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
      var bx = Math.floor(footX / T), by = Math.floor((this.y + this.h + 3) / T);
      if (!level.map.isSolid(bx, by) && !level.map.isOneWay(bx, by)) this.dir = -this.dir;
    }
    this.animT++;
  };
  Walker.prototype.stomped = function () {
    if (this.unkillable) return;       // savanna lions / porcupines no-sell stomps
    this.dead = true; this.deadT = 0;
  };
  Walker.prototype.zap = function () {
    if (this.unkillable) return;       // blast bounces off too
    this.dead = true; this.deadT = 0;
  };
  Walker.prototype.draw = function (ctx, cam) {
    var f = this.dead ? 1 : (Math.floor(this.animT / 8) % 2);
    var dir = this.dir > 0 ? 'r' : 'l';
    var base = 'walker_' + f + '_' + dir;
    drawBC(ctx, (this.variant && SDD.sprites.get(base + '_' + this.variant)) ? base + '_' + this.variant : base, this, cam);
    // Porcupine quills: three always-extended spikes along the back.
    // Cols mirror with facing direction so they stay above the body
    // instead of sprouting from the head when walking left. The
    // walker's already unkillable + non-stompable at spawn time (see
    // scenes.js), so the visible spikes match the actual hit logic.
    if (this.variant === 'porcupine' && !this.dead) {
      var s = SDD.sprites.get(base + '_porcupine');
      if (s) {
        var dx = Math.round(this.x - cam.x + this.w / 2 - s.width / 2);
        var dy = Math.round(this.y - cam.y + this.h - s.height);
        var cols = (this.dir > 0) ? [4, 7, 10] : [10, 13, 16];
        var quillH = 5;
        var quillBaseY = dy + 7;  // bumped from dy+3, Mark: "move the porcupine spines down by 4 pixels"
        ctx.fillStyle = '#1a1004';
        for (var i = 0; i < cols.length; i++) {
          ctx.fillRect(dx + cols[i], quillBaseY - quillH, 1, quillH);
        }
        ctx.fillStyle = '#8a6040';
        for (var j = 0; j < cols.length; j++) {
          ctx.fillRect(dx + cols[j], quillBaseY - quillH, 1, 1);
        }
      }
    }
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
    if (this.dead) { this.deadT++; this.y += 2.4; this.t += 0.05; if (this.deadT > 22) this.remove = true; return; }
    this.t += 0.05;
    this.y = this.homeY + Math.sin(this.t) * 28;
    this.x += this.dir * 0.5;
    if (this.x < this.minX) { this.x = this.minX; this.dir = 1; }
    if (this.x > this.maxX) { this.x = this.maxX; this.dir = -1; }
    this.animT++;
    // Quiet ambient cue when player is near (bee buzz / bird chirp).
    if (level.player && Math.random() < 0.003) {
      var pl = level.player;
      var ad = Math.abs((this.x + this.w / 2) - (pl.x + pl.w / 2));
      if (ad < 220) {
        SDD.audio.sfx(this.variant === 'bee' ? 'amb_buzz' : 'amb_chirp');
      }
    }
    // shoot variant: periodic downward orb (cloud-creature rain drop)
    if (this.shoots) {
      if (this.shootCD == null) this.shootCD = SDD.engine.randInt(80, 140);
      this.shootCD--;
      if (this.shootCD <= 0 && level) {
        this.shootCD = SDD.engine.randInt(140, 220);
        var orb = new Orb(this.x + this.w / 2 - 4, this.y + this.h, 0);
        orb.vx = 0; orb.vy = 0.6;       // drift down
        // Storm-cloud wisps drop thunderbolts, not orbs. Same damage,
        // different sprite + no purple glow.
        orb.variant = 'bolt';
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
    var name = (this.variant && SDD.sprites.get(base + '_' + this.variant)) ? base + '_' + this.variant : base;
    var s = spr(name); if (!s) return;
    var dx = Math.round(this.x - cam.x + this.w / 2 - s.width / 2);
    var dy = Math.round(this.y - cam.y + this.h - s.height);
    // Bird/leaf/smoke wisps face their movement direction. dir < 0
    // means moving left -> mirror the sprite horizontally so the
    // bird actually points the way it's flying (per Mark on Day 2-1).
    if (this.dir < 0) {
      ctx.save();
      ctx.translate(dx + s.width, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(s, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(s, dx, dy);
    }
  };

  // ===================== THROWER =====================
  function Thrower(x, y) {
    this.x = x; this.y = y; this.w = 12; this.h = 14;
    this.vx = 0; this.vy = 0; this.onGround = false;
    this.facing = -1; this.cd = SDD.engine.randInt(70, 130);
    this.throwAnim = 0; this.dead = false; this.deadT = 0; this.remove = false;
    this.stompable = true;
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
  Thrower.prototype.stomped = function () { this.dead = true; this.deadT = 0; };
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
    if (this.variant === 'bolt') {
      // Storm-cloud thunderbolt - bright yellow halo instead of purple.
      glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 10, '#ffd23a', 0.6);
      drawBC(ctx, 'bolt', this, cam);
    } else {
      glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 9, '#c061da', 0.5);
      drawBC(ctx, 'orb', this, cam);
    }
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

  // ===================== STAMPEDE (Day 6-1 wildebeest herd) =====================
  // A horizontal "moving wall" hazard 8 tiles wide and 1 tile tall.
  // Patrols a fixed pixel range, hurts on touch, cannot be stomped or
  // zapped (it's a mob, not a single creature). Renders as tiled
  // wildebeest silhouettes with a dust trail behind the herd.
  function Stampede(x, y, opts) {
    opts = opts || {};
    this.x = x; this.y = y;
    this.w = 8 * C.TILE; this.h = C.TILE;
    this.dir = opts.dir || -1;
    this.spd = opts.spd || 2.0;
    this.minX = (opts.minX != null) ? opts.minX : x - 20 * C.TILE;
    this.maxX = (opts.maxX != null) ? opts.maxX : x + 20 * C.TILE + this.w;
    this.dead = false; this.remove = false;
    this.stompable = false; this.unkillable = true;
    this.animT = 0;
  }
  Stampede.prototype.update = function (/*level*/) {
    this.x += this.dir * this.spd;
    if (this.x < this.minX)            { this.x = this.minX; this.dir = 1; }
    if (this.x + this.w > this.maxX)   { this.x = this.maxX - this.w; this.dir = -1; }
    this.animT++;
  };
  Stampede.prototype.stomped = function () { /* no-op: it's a herd, not a head */ };
  Stampede.prototype.zap     = function () { /* no-op */ };
  Stampede.prototype.draw = function (ctx, cam) {
    var s = SDD.sprites.get('wildebeest');
    if (!s) return;
    var dx0 = Math.round(this.x - cam.x);
    var dy  = Math.round(this.y - cam.y + this.h - s.height);
    // Dust kicked up behind the herd (opposite of travel direction).
    ctx.fillStyle = 'rgba(150,110,70,0.55)';
    for (var d = 0; d < 8; d++) {
      var sign = this.dir > 0 ? -1 : 1;
      var dxd = dx0 + (this.dir > 0 ? -1 : this.w) + sign * d * 4;
      var dyd = dy + s.height - 3 - ((d + Math.floor(this.animT / 4)) % 2);
      ctx.fillRect(dxd, dyd, 3, 2);
    }
    // Tile the wildebeest silhouettes across the herd, with a 1-px
    // bob phased per beast so the herd reads as galloping animals
    // rather than a static row.
    var n = Math.max(1, Math.floor(this.w / s.width));
    for (var i = 0; i < n; i++) {
      var bob = ((i + Math.floor(this.animT / 5)) % 2) ? 0 : 1;
      if (this.dir > 0) {
        ctx.save();
        ctx.translate(dx0 + (i + 1) * s.width, dy + bob);
        ctx.scale(-1, 1);
        ctx.drawImage(s, 0, 0);
        ctx.restore();
      } else {
        ctx.drawImage(s, dx0 + i * s.width, dy + bob);
      }
    }
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
  // Anchored at the ground. Grows upward as a tall slim column over 1
  // sec, holds at full height ~0.4 sec, retracts over 1 sec. Total
  // cycle ~2.4 sec - "tiny and enjoyable" per Mark. Damages player on
  // contact with the visible column rectangle.
  function LavaPlume(x, y, scale) {
    // Pass 10 round 2 (Mark): column was sitting 5px right + 6px low
    // of the visible crater. Recenter (-1 of spawner x for a 1px nudge
    // left, anchor 6px higher) so the plume reads as erupting cleanly
    // from the painted nozzle.
    var sc = scale || 1;
    this.scale = sc;
    this.ax = x - 1;                 // column horizontal center (was x+5)
    this.ay = y + 10;                // anchor at ground top (was y+16)
    this.maxH = Math.round(40 * sc);              // taller plume on scale-up
    this.colW = Math.round(14 * sc);              // wider plume on scale-up
    this.t = 0;
    // Pass 10 round 2: slower rise + fall so the kid has time to read
    // the timing before committing. ~2.8 sec full cycle (was 2.0).
    this.rise = 70; this.hold = 28; this.fall = 70;   // frames
    this.remove = false;
    this.curH = 0;
    // Bbox - kept narrow so the player isn't damaged for grazing past.
    this.w = this.colW; this.h = 0;
    this.x = this.ax - this.colW / 2; this.y = this.ay;
  }
  LavaPlume.prototype.update = function (level) {
    this.t++;
    var h;
    if (this.t <= this.rise) h = this.maxH * (this.t / this.rise);
    else if (this.t <= this.rise + this.hold) h = this.maxH;
    else if (this.t <= this.rise + this.hold + this.fall)
      h = this.maxH * (1 - (this.t - this.rise - this.hold) / this.fall);
    else { this.remove = true; return; }
    this.curH = h;
    this.h = h;
    this.y = this.ay - h;
    this.x = this.ax - this.colW / 2;
  };
  LavaPlume.prototype.draw = function (ctx, cam) {
    if (this.curH < 1) return;
    var sc = this.scale || 1;
    var R = function (n) { return Math.round(n * sc); };  // scaled pixel
    var cx = Math.round(this.ax - cam.x);
    var by = Math.round(this.ay - cam.y);
    var h = Math.round(this.curH);
    // Heat glow around the column (soft)
    glow(ctx, cx, by - h / 2, Math.round(16 * sc), '#ff6028', 0.4);
    // Column body: outer (darker), inner (bright), core (white-hot)
    ctx.fillStyle = '#9a2a10';
    ctx.fillRect(cx - R(6), by - h, R(12), h);
    ctx.fillStyle = '#ff5018';
    ctx.fillRect(cx - R(4), by - h, R(8), h);
    ctx.fillStyle = '#ffa030';
    ctx.fillRect(cx - R(2), by - h, R(4), h);
    // White-hot core wavers slightly
    var jitter = (this.t % 4 < 2) ? 0 : 1;
    ctx.fillStyle = '#ffe890';
    ctx.fillRect(cx - R(1) + jitter, by - h + 2, Math.max(1, R(1)), Math.max(0, h - 4));
    // Crown of fire at the top (3 flickering tongues)
    var t = this.t;
    var c1 = Math.sin(t * 0.5) * 1.4;
    var c2 = Math.cos(t * 0.6) * 1.2;
    ctx.fillStyle = '#ffe070';
    ctx.fillRect(cx - R(4) + Math.round(c1), by - h - 2, R(2), R(2));
    ctx.fillRect(cx - R(1), by - h - 3, R(2), R(3));
    ctx.fillRect(cx + R(2) + Math.round(c2), by - h - 2, R(2), R(2));
    ctx.fillStyle = '#fff8c0';
    ctx.fillRect(cx, by - h - R(4), Math.max(1, R(1)), R(2));
    // Embers rising above the crown
    var ex = (t * 7) % 12 - 6;
    ctx.fillStyle = '#ff9050';
    ctx.fillRect(cx + Math.round(ex), by - h - 6 - (t % 6), 1, 1);
  };

  // ===================== SKY HAZARDS (Day 4) =====================
  // Solar flare - drops straight down with increasing speed. Hits player
  // on contact like an Orb.
  // Wraps a sprite draw with a center-anchored scale so a hazard's
  // visual size matches its scaled hitbox without authoring multiple
  // sprite resolutions. Falls back to the raw drawBC at scale=1.
  function drawScaledSprite(ctx, name, ent, cam) {
    var sc = ent.scale || 1;
    if (sc === 1) { drawBC(ctx, name, ent, cam); return; }
    var cx = ent.x + ent.w / 2 - cam.x;
    var cy = ent.y + ent.h / 2 - cam.y;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    var s = SDD.sprites.get(name);
    if (s) ctx.drawImage(s, Math.round(-ent.w / (2 * sc)), Math.round(-ent.h / (2 * sc)));
    ctx.restore();
  }

  function SolarFlare(x, y, scale) {
    var sc = scale || 1;
    this.scale = sc;
    this.x = x; this.y = y;
    this.w = Math.round(8 * sc); this.h = Math.round(10 * sc);
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
    var sc = this.scale || 1;
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 12 * sc, '#ffe070', 0.65);
    drawScaledSprite(ctx, 'flare', this, cam);
  };

  // Meteor - drifts diagonally across the screen.
  // Slowed from vx=1.5 (Pass 9 difficulty audit: "the meteor should
  // be a little bit slower"). Lower horizontal speed gives Mark more
  // reaction time to dodge.
  function Meteor(x, y, dir, scale) {
    var sc = scale || 1;
    this.scale = sc;
    this.x = x; this.y = y;
    this.w = Math.round(10 * sc); this.h = Math.round(8 * sc);
    this.vx = (dir || 1) * 1.0; this.vy = 0.7;
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
    var sc = this.scale || 1;
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y, 10 * sc, '#ff9050', 0.7);
    drawScaledSprite(ctx, this.vx > 0 ? 'meteor_r' : 'meteor_l', this, cam);
  };

  // HazardSpawner - invisible periodic spawner placed in level data.
  // Lives in the "enemies" list so its update is called every frame.
  function HazardSpawner(x, y, kind, period, dir, scale) {
    this.x = x; this.y = y; this.w = 1; this.h = 1;
    this.kind = kind || 'flare';
    this.period = period || 90;
    this.t = Math.floor(Math.random() * this.period);
    this.dir = dir || 1;
    this.scale = scale || 1;
    this.dead = false; this.deadT = 0; this.remove = false;
    this.stompable = false; this.invisible = true;
  }
  HazardSpawner.prototype.update = function (level) {
    this.t++;
    if (this.t >= this.period) {
      this.t = 0;
      var sc = this.scale || 1;
      if (this.kind === 'flare') {
        level.projectiles.push(new SolarFlare(this.x, this.y, sc));
      } else if (this.kind === 'meteor') {
        level.projectiles.push(new Meteor(this.x, this.y, this.dir, sc));
      } else if (this.kind === 'meteorH') {
        var m = new Meteor(this.x, this.y, this.dir, sc);
        m.vy = 0;
        level.projectiles.push(m);
      } else if (this.kind === 'lavaPlume') {
        level.projectiles.push(new LavaPlume(this.x, this.y, sc));
      }
    }
  };
  HazardSpawner.prototype.draw = function (ctx, cam) {
    if (this.kind !== 'lavaPlume') return;
    var T = 16, sc = this.scale || 1;
    var gx = Math.round(this.x - cam.x);
    var gy = Math.round((this.ty + 1) * T - cam.y);
    // Crater dimensions scale with the plume so a 2x lava is
    // obviously a 2x crater on the ground.
    var w1 = Math.round(22 * sc), w2 = Math.round(20 * sc),
        w3 = Math.round(16 * sc), w4 = Math.round(12 * sc),
        w5 = Math.round(10 * sc);
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(gx - w1 / 2, gy - 4, w1, 4);
    ctx.fillStyle = '#2a1408';
    ctx.fillRect(gx - w2 / 2, gy - 3, w2, 1);
    ctx.fillStyle = '#7a1c0a';
    ctx.fillRect(gx - w3 / 2, gy - 3, w3, 2);
    var remain = Math.max(0, this.period - this.t);
    var ratio = remain / Math.max(1, this.period);
    var hot = ratio < 0.3 ? '#ffd048' : '#ff5418';
    ctx.fillStyle = hot;
    ctx.fillRect(gx - w4 / 2, gy - 2, w4, 1);
    ctx.fillStyle = '#ff8030';
    ctx.fillRect(gx - w5 / 2, gy - 1, w5, 1);
  };
  HazardSpawner.prototype.zap = function () {};      // blast can't kill the sky

  // ===================== PLAYER BLAST =====================
  function Blast(x, y, dir, kind) {
    this.x = x; this.y = y; this.w = 10; this.h = 6;
    this.dir = dir; this.vx = dir * 3.3; this.traveled = 0; this.remove = false;
    // 'blast' = light blast (yellow glow). 'leaf' = leafshot signature
    // projectile (green leaf, slight spin).
    this.kind = kind || 'blast';
    this.spinT = 0;
  }
  Blast.prototype.update = function (level) {
    this.x += this.vx; this.traveled += 3.3;
    this.spinT++;
    var T = C.TILE;
    var cx = Math.floor((this.x + (this.dir > 0 ? this.w : 0)) / T);
    var cy = Math.floor((this.y + this.h / 2) / T);
    if (level.map.isSolid(cx, cy)) this.remove = true;
    // Pass 12 (Mark): doubled the blast range. The old 70-px cap
    // meant a kid had to be right next to an enemy to land a hit;
    // 140 lets a blast actually clear the screen ahead of them.
    if (this.traveled > 140) this.remove = true;
  };
  Blast.prototype.draw = function (ctx, cam) {
    var dx = Math.round(this.x + this.w / 2 - cam.x);
    var dy = Math.round(this.y + this.h / 2 - cam.y);
    if (this.kind === 'leaf') {
      // Spinning green leaf. Two phases: wide ellipse / narrow ellipse
      // so it reads as flipping through the air.
      ctx.save();
      ctx.translate(dx, dy);
      var phase = (this.spinT >> 2) & 1;
      ctx.fillStyle = '#3c6020';
      if (phase === 0) {
        ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0.2, 0, 6.28); ctx.fill();
      } else {
        ctx.beginPath(); ctx.ellipse(0, 0, 3, 4, 0.2, 0, 6.28); ctx.fill();
      }
      ctx.fillStyle = '#90e060';
      ctx.fillRect(-2, -1, 4, 1);
      ctx.fillStyle = '#c8ee7a';
      ctx.fillRect(-1, -1, 2, 1);
      ctx.restore();
      return;
    }
    glow(ctx, dx, dy, 12, '#fff0a0', 0.6);
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
    // Per-platform variant set by the level scene from the theme.
    // Defaults to the brass wood plank. 5-arg drawImage so the sprite
    // can be stretched horizontally - easy mode widens the platforms
    // for a more forgiving landing rhythm.
    var s = spr((this.variant && SDD.sprites.get('movplat_' + this.variant))
      ? 'movplat_' + this.variant : 'movplat');
    var dw = Math.round(this.w);
    var dh = Math.round(this.h);
    ctx.drawImage(s, Math.round(this.x - cam.x), Math.round(this.y - cam.y), dw, dh);
  };

  // ===================== LEAF FALL (Day 6-2 streaming platform) =====
  // A leaf that drifts downward at a constant speed with a gentle
  // horizontal sway, then despawns after it falls off the bottom of
  // the level. Acts as a one-way moving platform Danny can stand on;
  // plugs into the same level.platforms array as MovPlat so the
  // existing ride logic carries the player along without any engine
  // changes. Spawned periodically by a LeafSpawner placed at the top
  // of a vertical gap.
  function LeafFall(x, y, opt) {
    this.x = x; this.y = y; this.baseX = x;
    this.w = 18; this.h = 6;
    this.vy = (opt && opt.vy) || 1.0;
    this.swayAmp = (opt && opt.swayAmp) || 2;
    this.t = Math.random() * 6.28;     // random phase so adjacent leaves don't sync
    this.dx = 0; this.dy = 0;
    this.remove = false;
  }
  LeafFall.prototype.update = function (level) {
    var px = this.x, py = this.y;
    this.t += 0.08;
    this.x = this.baseX + Math.sin(this.t) * this.swayAmp;
    this.y += this.vy;
    this.dx = this.x - px; this.dy = this.y - py;
    if (level && level.map && this.y > level.map.pxH + 12) {
      this.remove = true;
    }
  };
  LeafFall.prototype.draw = function (ctx, cam) {
    var dx = Math.round(this.x - cam.x);
    var dy = Math.round(this.y - cam.y);
    var w = this.w, h = this.h;
    // Leaf body: dark outline, mid green fill, bright highlight.
    ctx.fillStyle = '#284018';
    ctx.fillRect(dx + 1, dy, w - 2, 1);
    ctx.fillRect(dx + 1, dy + h - 1, w - 2, 1);
    ctx.fillRect(dx, dy + 1, 1, h - 2);
    ctx.fillRect(dx + w - 1, dy + 1, 1, h - 2);
    ctx.fillStyle = '#3c6020';
    ctx.fillRect(dx + 1, dy + 1, w - 2, h - 2);
    ctx.fillStyle = '#5e8a3a';
    ctx.fillRect(dx + 2, dy + 1, w - 4, h - 3);
    ctx.fillStyle = '#90e060';
    ctx.fillRect(dx + 4, dy + 2, w - 8, 1);
    // Centre vein.
    ctx.fillStyle = '#284018';
    ctx.fillRect(dx + Math.floor(w / 2), dy + 1, 1, h - 2);
  };

  // ===================== LEAF SPAWNER (invisible, ticks LeafFall) =====
  // Placed at the top of a gap. Every `period` frames it pushes a new
  // LeafFall into level.platforms with the configured fall speed +
  // horizontal-sway range. Marked invisible + harmless so the
  // enemy-collision + draw loops skip it; only its update() runs.
  function LeafSpawner(x, y, period, fallSpeed, swayAmp) {
    this.x = x; this.y = y; this.w = 4; this.h = 4;
    this.period = period || 70;
    // Mark: "slow the descent of the falling leaves by 25%". Whatever
    // fallSpeed the level data passes gets multiplied by 0.75 here so
    // we don't have to rewrite every leafstream entry across levels.
    this.fallSpeed = (fallSpeed || 1.0) * 0.75;
    this.swayAmp = (swayAmp != null) ? swayAmp : 2;
    this.t = 0;
    this.invisible = true;
    this.harmless = true;
    this.stompable = false;
    this.dead = false;
    this.remove = false;
  }
  LeafSpawner.prototype.update = function (level) {
    this.t++;
    if (this.t >= this.period) {
      this.t = 0;
      var leaf = new LeafFall(this.x - 9, this.y, {
        vy: this.fallSpeed, swayAmp: this.swayAmp
      });
      level.platforms.push(leaf);
    }
  };
  LeafSpawner.prototype.draw = function () {};       // invisible
  LeafSpawner.prototype.stomped = function () {};    // immune

  // ===================== POWER CORE =====================
  function Core(x, y) {
    this.x = x; this.y = y; this.w = 12; this.h = 14;
    this.baseY = y; this.t = Math.random() * 6.28; this.remove = false;
  }
  Core.prototype.update = function (level) {
    this.t += 0.1;
    // Pollen-trail signature (Day 6-2): cores within a 96-px radius
    // magnet toward the player at a gentle pull so they read as
    // "drawn in" rather than teleporting. Radius doubled from 48 per
    // Mark: "pollen trail ability has to be doubled, like in space".
    if (level && level.player &&
        level.player.signatureKind === 'pollentrail' &&
        !this.remove && !level.player.dead) {
      var px = level.player.x + level.player.w / 2;
      var py = level.player.y + level.player.h / 2;
      var cx = this.x + this.w / 2, cy = this.y + this.h / 2;
      var dx = px - cx, dy = py - cy;
      var d2 = dx * dx + dy * dy;
      if (d2 < 96 * 96) {
        var d = Math.sqrt(d2) || 1;
        var pull = 1.4;
        this.x += (dx / d) * pull;
        this.baseY += (dy / d) * pull;
      }
    }
    this.y = this.baseY + Math.sin(this.t) * 2.5;
  };
  Core.prototype.draw = function (ctx, cam) {
    glow(ctx, this.x + this.w / 2 - cam.x, this.y + this.h / 2 - cam.y,
      11, '#46f0ff', 0.4 + Math.sin(this.t * 1.5) * 0.18);
    var f = (Math.floor(this.t * 2) % 2);
    drawBC(ctx, 'core_' + f, this, cam);
  };

  // ===================== ITEM DROP (grow / blast) =====================
  function ItemDrop(x, y, kind, hover) {
    this.x = x; this.y = y; this.baseY = y; this.w = 14; this.h = 14;
    this.kind = kind;                 // 'grow' or 'blast'
    this.emerge = 16; this.vx = 0; this.vy = 0; this.t = 0;
    // hover=true: a level-placed pickup that bobs in place instead of
    // emerging from a block + falling. Lets a grow item sit reachable
    // at the start of flappy / underwater levels where there's no
    // ground for the normal walking grow to rest on.
    this.hover = !!hover;
    this.remove = false;
  }
  ItemDrop.prototype.update = function (level) {
    this.t++;
    if (this.hover) { this.y = this.baseY + Math.sin(this.t * 0.1) * 1.5; return; }
    if (this.emerge > 0) {
      this.y -= 1; this.emerge--;
      if (this.emerge === 0 && this.kind === 'grow') this.vx = 0.55;
      return;
    }
    // Pass 10 r2 (Mark, follow-up): the grow super power core must still
    // WALK off its block onto the ground so small Danny can chase it
    // down. The bob-in-place version left it unreachable. Visuals stay
    // as the new chaotic gold diamond; only the physics revert.
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

  // ===================== SIGNATURE POWER-UP =====================
  // One unique pickup per stage. Hovers in place with a per-stage tint
  // pulled from TIME_PART_VARIANTS so it visually echoes the stage's
  // time-machine part. On overlap, triggers Player.giveSignature(kind)
  // where kind is sub-specific (e.g. 'sunburst', 'cloudglide', ...).
  function Signature(x, y, kind, stageKey) {
    this.x = x; this.y = y; this.baseY = y;
    this.w = 14; this.h = 14;
    this.kind = kind;
    this.stageKey = stageKey || '1-1';
    this.t = 0;
    this.remove = false;
  }
  Signature.prototype.update = function () {
    this.t++;
    this.y = this.baseY + Math.sin(this.t * 0.10) * 1.5;
  };
  Signature.prototype.draw = function (ctx, cam) {
    var v = (typeof TIME_PART_VARIANTS !== 'undefined' && TIME_PART_VARIANTS[this.stageKey]) ||
      { glow: '#fff09a', a: '#a8631a', b: '#ffd23a', c: '#ffffff' };
    var cx = this.x + this.w / 2 - cam.x;
    var cy = this.y + this.h / 2 - cam.y;
    glow(ctx, cx, cy, 14, v.glow, 0.65);
    // Tinted diamond emblem - simple painted shape, no sprite needed.
    var f = (Math.floor(this.t / 8) % 2);
    var off = f === 0 ? 0 : 1;
    ctx.fillStyle = v.a;
    ctx.fillRect(Math.round(cx) - 5, Math.round(cy) - 3 + off, 10, 6);
    ctx.fillStyle = v.b;
    ctx.fillRect(Math.round(cx) - 4, Math.round(cy) - 2 + off, 8, 4);
    ctx.fillStyle = v.c;
    ctx.fillRect(Math.round(cx) - 2, Math.round(cy) - 2 + off, 4, 1);
    // Sparkle ring
    var sx = Math.round(cx + Math.cos(this.t * 0.15) * 10);
    var sy = Math.round(cy + Math.sin(this.t * 0.15) * 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, sy, 1, 1);
  };

  // ===================== TIME MACHINE PART (goal) =====================
  // Per-stage variant (Pass 9 Mark: "each one could be really uniquely
  // different, like a bit of a different color and stuff. different
  // parts of the time machine that fell off"). Painted procedurally
  // so we don't need 12 sprite assets.
  var TIME_PART_VARIANTS = {
    '1-1': { name: 'Power core',   glow: '#9bf0ff', a: '#3a78a8', b: '#a8f0ff', c: '#ffffff' },
    '2-1': { name: 'Cloud-vane',   glow: '#dbeefc', a: '#7a9ec8', b: '#d6e4f4', c: '#ffffff' },
    '2-2': { name: 'Hull plate',   glow: '#80e0d8', a: '#1a6c70', b: '#4ec0b8', c: '#a8f0e8' },
    '3-1': { name: 'Gear bolt',    glow: '#f0c878', a: '#704028', b: '#c08858', c: '#f0c890' },
    '3-2': { name: 'Vine coil',    glow: '#a8f070', a: '#2a4818', b: '#5a9038', c: '#b0e870' },
    '4-1': { name: 'Sun cell',     glow: '#ffe070', a: '#a06028', b: '#f0a838', c: '#ffe890' },
    '4-2': { name: 'Star chip',    glow: '#c8b0ff', a: '#5040a0', b: '#9080d0', c: '#e0d8ff' },
    '5-1': { name: 'Feather fin',  glow: '#a0d8ff', a: '#406890', b: '#80b0d8', c: '#d8eaff' },
    '5-2': { name: 'Coral gem',    glow: '#a0ffe0', a: '#1a7060', b: '#50c0a0', c: '#a8f8d0' },
    '6-1': { name: 'Ivory chunk',  glow: '#fff0c8', a: '#a08858', b: '#dcc090', c: '#fff0c0' },
    '6-2': { name: 'Wood wheel',   glow: '#f0c068', a: '#603018', b: '#a06838', c: '#d8a070' },
    '7-1': { name: 'Halo crown',   glow: '#ffe890', a: '#a07820', b: '#f0d040', c: '#ffffff' }
  };
  function TimePart(x, y, variantKey) {
    this.x = x; this.y = y; this.w = 14; this.h = 14;
    this.baseY = y; this.t = 0; this.remove = false;
    this.variantKey = variantKey || '1-1';
    this.variant = TIME_PART_VARIANTS[this.variantKey] || TIME_PART_VARIANTS['1-1'];
  }
  TimePart.prototype.update = function () { this.t += 0.08; this.y = this.baseY + Math.sin(this.t) * 3; };
  TimePart.prototype.draw = function (ctx, cam) {
    var v = this.variant;
    var cx = Math.round(this.x + this.w / 2 - cam.x);
    var cy = Math.round(this.y + this.h / 2 - cam.y);
    // Pass 10 round 2 (Mark): time-machine parts should "radiate" - bigger
    // pulsing aura, rotating ray spokes, and a brighter inner glow.
    var pulse = 0.55 + Math.sin(this.t * 2) * 0.25;
    glow(ctx, cx, cy, 30, v.glow, pulse);
    glow(ctx, cx, cy, 16, v.c, 0.4 + Math.sin(this.t * 3.2) * 0.2);
    // Rotating ray spokes (4 short lines around the center, rotating
    // slowly) - readable as "this is special, look here".
    for (var r = 0; r < 4; r++) {
      var a = this.t * 0.6 + r * Math.PI / 2;
      var rx = cx + Math.cos(a) * 13;
      var ry = cy + Math.sin(a) * 13;
      ctx.fillStyle = v.glow;
      ctx.fillRect(rx | 0, ry | 0, 2, 2);
      var rx2 = cx + Math.cos(a) * 16;
      var ry2 = cy + Math.sin(a) * 16;
      ctx.fillStyle = v.c;
      ctx.fillRect(rx2 | 0, ry2 | 0, 1, 1);
    }
    var x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
    // Pass 10 round 2: each variant now paints its OWN silhouette from
    // scratch (no shared 10x10 base square) so parts read as distinctly
    // different - cell vs vane vs gear vs star vs feather etc.
    switch (this.variantKey) {
      case '1-1':                                          // Power core (vertical battery cell)
        ctx.fillStyle = v.a;
        ctx.fillRect(x + 4, y + 2, 6, 10);                 // body
        ctx.fillStyle = v.b;
        ctx.fillRect(x + 5, y + 3, 4, 8);                  // inner
        ctx.fillStyle = v.glow;
        ctx.fillRect(x + 6, y + 4, 2, 6);                  // glowing core
        ctx.fillStyle = v.c;
        ctx.fillRect(x + 5, y + 1, 4, 1);                  // top cap
        ctx.fillRect(x + 5, y + 12, 4, 1);                 // bottom cap
        // energy bands
        ctx.fillStyle = v.glow;
        ctx.fillRect(x + 4, y + 5, 6, 1);
        ctx.fillRect(x + 4, y + 9, 6, 1);
        break;
      case '2-1':                                          // Cloud-vane (4 curved propeller blades)
        ctx.fillStyle = v.a;
        // top blade
        ctx.fillRect(x + 6, y + 1, 2, 5);
        ctx.fillRect(x + 5, y + 4, 4, 2);
        // right blade
        ctx.fillRect(x + 8, y + 6, 5, 2);
        ctx.fillRect(x + 8, y + 5, 2, 4);
        // bottom blade
        ctx.fillRect(x + 6, y + 8, 2, 5);
        ctx.fillRect(x + 5, y + 8, 4, 2);
        // left blade
        ctx.fillRect(x + 1, y + 6, 5, 2);
        ctx.fillRect(x + 4, y + 5, 2, 4);
        // hub
        ctx.fillStyle = v.c;
        ctx.fillRect(x + 6, y + 6, 2, 2);
        break;
      case '2-2':                                          // Hull plate (hexagonal)
        ctx.fillStyle = v.a;
        ctx.fillRect(x + 4, y + 2, 6, 2);
        ctx.fillRect(x + 2, y + 4, 10, 6);
        ctx.fillRect(x + 4, y + 10, 6, 2);
        ctx.fillStyle = v.b;
        ctx.fillRect(x + 5, y + 3, 4, 1);
        ctx.fillRect(x + 3, y + 5, 8, 4);
        ctx.fillRect(x + 5, y + 9, 4, 1);
        // rivets at the 6 corners
        ctx.fillStyle = v.c;
        ctx.fillRect(x + 4, y + 3, 1, 1); ctx.fillRect(x + 9, y + 3, 1, 1);
        ctx.fillRect(x + 2, y + 6, 1, 1); ctx.fillRect(x + 11, y + 6, 1, 1);
        ctx.fillRect(x + 4, y + 10, 1, 1); ctx.fillRect(x + 9, y + 10, 1, 1);
        break;
      case '3-1':                                          // Gear bolt (cogwheel)
        ctx.fillStyle = v.a;
        // 8 outer teeth
        ctx.fillRect(x + 6, y, 2, 2);
        ctx.fillRect(x + 6, y + 12, 2, 2);
        ctx.fillRect(x, y + 6, 2, 2);
        ctx.fillRect(x + 12, y + 6, 2, 2);
        ctx.fillRect(x + 2, y + 2, 2, 2);
        ctx.fillRect(x + 10, y + 2, 2, 2);
        ctx.fillRect(x + 2, y + 10, 2, 2);
        ctx.fillRect(x + 10, y + 10, 2, 2);
        // disc body
        ctx.fillRect(x + 3, y + 3, 8, 8);
        ctx.fillStyle = v.b;
        ctx.fillRect(x + 4, y + 4, 6, 6);
        // central hole
        ctx.fillStyle = v.glow;
        ctx.fillRect(x + 6, y + 6, 2, 2);
        break;
      case '3-2':                                          // Vine coil (spiral/curl)
        ctx.fillStyle = v.a;
        // Outer ring
        ctx.fillRect(x + 3, y + 2, 8, 1);
        ctx.fillRect(x + 11, y + 3, 1, 8);
        ctx.fillRect(x + 3, y + 11, 8, 1);
        ctx.fillRect(x + 2, y + 3, 1, 8);
        // Inner curl
        ctx.fillStyle = v.b;
        ctx.fillRect(x + 5, y + 4, 5, 1);
        ctx.fillRect(x + 9, y + 5, 1, 4);
        ctx.fillRect(x + 5, y + 8, 5, 1);
        ctx.fillRect(x + 5, y + 6, 1, 2);
        // Tip leaf
        ctx.fillStyle = v.c;
        ctx.fillRect(x + 7, y + 6, 2, 1);
        break;
      case '4-1':                                          // Sun cell (8-point star)
        ctx.fillStyle = v.a;
        // 8 points
        ctx.fillRect(x + 6, y, 2, 4);                      // N
        ctx.fillRect(x + 6, y + 10, 2, 4);                 // S
        ctx.fillRect(x, y + 6, 4, 2);                      // W
        ctx.fillRect(x + 10, y + 6, 4, 2);                 // E
        ctx.fillRect(x + 2, y + 2, 2, 2);                  // NW
        ctx.fillRect(x + 10, y + 2, 2, 2);                 // NE
        ctx.fillRect(x + 2, y + 10, 2, 2);                 // SW
        ctx.fillRect(x + 10, y + 10, 2, 2);                // SE
        // center disc
        ctx.fillRect(x + 4, y + 4, 6, 6);
        ctx.fillStyle = v.glow;
        ctx.fillRect(x + 5, y + 5, 4, 4);
        ctx.fillStyle = v.c;
        ctx.fillRect(x + 6, y + 6, 2, 2);
        break;
      case '4-2':                                          // Star chip (5-point star)
        ctx.fillStyle = v.a;
        ctx.fillRect(x + 6, y + 1, 2, 3);                  // top point
        ctx.fillRect(x + 3, y + 4, 8, 3);                  // upper arms
        ctx.fillRect(x + 4, y + 7, 6, 2);                  // body
        ctx.fillRect(x + 3, y + 9, 3, 4);                  // lower-left point
        ctx.fillRect(x + 8, y + 9, 3, 4);                  // lower-right point
        ctx.fillStyle = v.b;
        ctx.fillRect(x + 6, y + 3, 2, 1);
        ctx.fillRect(x + 4, y + 5, 6, 2);
        ctx.fillRect(x + 5, y + 7, 4, 1);
        ctx.fillStyle = v.glow;
        ctx.fillRect(x + 6, y + 5, 2, 2);
        break;
      case '5-1':                                          // Feather fin (asymmetric wing)
        ctx.fillStyle = v.a;
        // Spine running diagonally
        ctx.fillRect(x + 3, y + 11, 9, 1);
        ctx.fillRect(x + 4, y + 10, 8, 1);
        // Vanes curving up
        ctx.fillRect(x + 5, y + 8, 7, 2);
        ctx.fillRect(x + 6, y + 6, 6, 2);
        ctx.fillRect(x + 7, y + 4, 5, 2);
        ctx.fillRect(x + 8, y + 2, 4, 2);
        ctx.fillStyle = v.b;
        ctx.fillRect(x + 6, y + 9, 6, 1);
        ctx.fillRect(x + 7, y + 7, 5, 1);
        ctx.fillRect(x + 8, y + 5, 4, 1);
        ctx.fillRect(x + 9, y + 3, 3, 1);
        // shaft
        ctx.fillStyle = v.c;
        ctx.fillRect(x + 4, y + 11, 8, 1);
        break;
      case '5-2':                                          // Coral gem (branching cluster)
        ctx.fillStyle = v.a;
        // Trunk
        ctx.fillRect(x + 6, y + 8, 2, 5);
        // Left branch
        ctx.fillRect(x + 3, y + 6, 3, 2);
        ctx.fillRect(x + 2, y + 4, 2, 3);
        // Right branch
        ctx.fillRect(x + 8, y + 5, 3, 2);
        ctx.fillRect(x + 10, y + 3, 2, 3);
        // Top tip
        ctx.fillRect(x + 6, y + 2, 2, 6);
        ctx.fillStyle = v.b;
        ctx.fillRect(x + 6, y + 3, 2, 4);
        ctx.fillRect(x + 3, y + 6, 2, 1);
        ctx.fillRect(x + 9, y + 5, 2, 1);
        // sparkle nodes
        ctx.fillStyle = v.glow;
        ctx.fillRect(x + 6, y + 1, 2, 1);
        ctx.fillRect(x + 2, y + 4, 1, 1);
        ctx.fillRect(x + 11, y + 3, 1, 1);
        break;
      case '6-1':                                          // Ivory chunk (curved tusk fragment)
        ctx.fillStyle = v.a;
        // Curved silhouette (broader at bottom, narrowing up-right)
        ctx.fillRect(x + 2, y + 8, 6, 4);
        ctx.fillRect(x + 4, y + 5, 6, 4);
        ctx.fillRect(x + 6, y + 3, 5, 3);
        ctx.fillRect(x + 8, y + 1, 4, 3);
        ctx.fillStyle = v.b;
        ctx.fillRect(x + 3, y + 9, 4, 2);
        ctx.fillRect(x + 5, y + 6, 4, 2);
        ctx.fillRect(x + 7, y + 4, 3, 1);
        // Cracks for the "weathered fragment" look
        ctx.fillStyle = v.a;
        ctx.fillRect(x + 5, y + 8, 1, 2);
        ctx.fillRect(x + 8, y + 5, 1, 1);
        break;
      case '6-2':                                          // Wood wheel (spoked cart wheel)
        ctx.fillStyle = v.a;
        // Outer rim (donut)
        ctx.fillRect(x + 3, y + 1, 8, 1);
        ctx.fillRect(x + 1, y + 3, 1, 8);
        ctx.fillRect(x + 12, y + 3, 1, 8);
        ctx.fillRect(x + 3, y + 12, 8, 1);
        ctx.fillRect(x + 2, y + 2, 2, 1);
        ctx.fillRect(x + 10, y + 2, 2, 1);
        ctx.fillRect(x + 2, y + 11, 2, 1);
        ctx.fillRect(x + 10, y + 11, 2, 1);
        // Inner rim
        ctx.fillStyle = v.b;
        ctx.fillRect(x + 3, y + 2, 8, 1);
        ctx.fillRect(x + 2, y + 3, 1, 8);
        ctx.fillRect(x + 11, y + 3, 1, 8);
        ctx.fillRect(x + 3, y + 11, 8, 1);
        // Spokes (4 going to hub)
        ctx.fillStyle = v.a;
        ctx.fillRect(x + 6, y + 3, 2, 3);
        ctx.fillRect(x + 6, y + 8, 2, 3);
        ctx.fillRect(x + 3, y + 6, 3, 2);
        ctx.fillRect(x + 8, y + 6, 3, 2);
        // Hub
        ctx.fillStyle = v.c;
        ctx.fillRect(x + 6, y + 6, 2, 2);
        break;
      case '7-1':                                          // Halo crown (concentric rings + cross)
        ctx.fillStyle = v.a;
        // Outer halo ring
        ctx.fillRect(x + 3, y + 1, 8, 1);
        ctx.fillRect(x + 1, y + 3, 1, 8);
        ctx.fillRect(x + 12, y + 3, 1, 8);
        ctx.fillRect(x + 3, y + 12, 8, 1);
        ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + 11, y + 2, 1, 1);
        ctx.fillRect(x + 2, y + 11, 1, 1); ctx.fillRect(x + 11, y + 11, 1, 1);
        // Inner halo ring
        ctx.fillStyle = v.glow;
        ctx.fillRect(x + 4, y + 3, 6, 1);
        ctx.fillRect(x + 3, y + 4, 1, 6);
        ctx.fillRect(x + 10, y + 4, 1, 6);
        ctx.fillRect(x + 4, y + 10, 6, 1);
        // Cross inside
        ctx.fillStyle = v.c;
        ctx.fillRect(x + 6, y + 5, 2, 4);
        ctx.fillRect(x + 5, y + 6, 4, 2);
        break;
    }
  };

  // ===================== NPC (Day 7-1 + legacy Day 6-2 Mankind) ===========
  // NPC kinds and metadata. Animal kinds are 'decorative' - they
  // never speak and never award cores; they just stand / bob in place
  // for atmosphere. Each named NPC has a default dialogue line, but
  // individual spawns can override it via `{ ..., line: '...' }` in
  // level data so multiple Adams / Eves in the same level can say
  // different things.
  var NPC_META = {
    adam: { decorative: false, line: 'BLESSINGS!' },
    eve:  { decorative: false, line: 'WELCOME, DANNY!' },
    deer: { decorative: true },
    lion: { decorative: true },
    dove: { decorative: true }
  };
  function NPC(x, y, kind, line) {
    this.x = x; this.y = y; this.w = 12; this.h = 26;
    this.kind = kind || 'adam';
    var meta = NPC_META[this.kind] || NPC_META.adam;
    this.decorative = !!meta.decorative;
    this.line = line || meta.line || 'HELLO!';
    // Animals never trigger the "give cores" branch in scenes -
    // marking them already-gave at spawn is the simplest gate.
    this.gave = this.decorative;
    this.bubbleT = 0; this.t = 0;
    this.remove = false;
    // Subtle vertical bob for decorative animals so they read as alive
    this.baseY = y; this.bobPhase = Math.random() * 6.28;
  }
  NPC.prototype.update = function () {
    this.t++;
    if (this.bubbleT > 0) this.bubbleT--;
    if (this.decorative) {
      this.y = this.baseY + Math.sin(this.t * 0.06 + this.bobPhase) * 1;
    }
  };
  NPC.prototype.draw = function (ctx, cam) {
    drawBC(ctx, 'npc_' + this.kind, this, cam);
    if (this.bubbleT > 0) {
      var bx = Math.round(this.x + this.w / 2 - cam.x);
      var by = Math.round(this.y - cam.y - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      // Width derived from the dialogue string so longer lines fit.
      var lineW = Math.max(44, this.line.length * 6 + 8);
      ctx.fillRect(bx - lineW / 2, by - 10, lineW, 10);
      ctx.strokeStyle = '#1a1a2a'; ctx.lineWidth = 1;
      ctx.strokeRect(bx - lineW / 2 + 0.5, by - 10 + 0.5, lineW - 1, 9);
      SDD.sprites.text(ctx, this.line, bx, by - 8, '#1a1a2a', 1, 'center');
    }
  };

  // ===================== BUBBLE UPDRAFT (Day 5-2 chaos mechanic) =====
  // Stationary column at a fixed x. Anywhere a player overlaps the
  // column gets a strong upward push (vy clamped to negative). No
  // damage - just throws the rhythm off as Mark wanted. Bubbles
  // visually rise from the seabed.
  function BubbleUp(x, y, scale) {
    var sc = scale || 1;
    this.scale = sc;
    this.x = x; this.y = y;
    this.w = Math.round(14 * sc); this.h = Math.round(100 * sc);
    this.dead = false; this.remove = false;
    this.invisible = true; this.stompable = false;
    // Pass 12 (Mark): "in the underwater level the bubbles cause
    // damage - that's no good." Bubble is a push-up zone, never
    // damages. The collisions loop skips entities with this flag.
    this.harmless = true;
    this.t = 0;
  }
  BubbleUp.prototype.update = function (level) {
    this.t++;
    var pl = level.player;
    if (!pl || pl.dead) return;
    if (overlap(pl, this)) {
      // Push player up - cap their vy at a negative value so the
      // updraft can't be neutralised by gravity.
      if (pl.vy > -2.2) pl.vy = Math.max(-2.4, pl.vy - 0.6);
    }
  };
  BubbleUp.prototype.draw = function (ctx, cam) {
    // Drifting bubble column - small light rings rising
    for (var i = 0; i < 6; i++) {
      var by = this.y + this.h - ((this.t * 1.2 + i * 18) % this.h);
      var bx = this.x + this.w / 2 + Math.sin(this.t * 0.05 + i) * 3;
      var bs = 1 + (i % 3);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(Math.round(bx - cam.x), Math.round(by - cam.y), bs, 0, 6.28);
      ctx.fill();
    }
  };
  BubbleUp.prototype.zap = function () {};
  BubbleUp.prototype.stomped = function () {};

  // ===================== OCTOPUS (Day 5-2 boss-y obstacle) ============
  // Big sprawled silhouette. Body damages on contact - tentacles wave
  // but aren't separate hitboxes (just visual). Doesn't move - the
  // player goes AROUND.
  function Octopus(x, y) {
    this.x = x; this.y = y;
    this.w = 56; this.h = 40;
    this.dead = false; this.remove = false;
    this.invisible = false; this.stompable = false;
    this.t = 0;
  }
  Octopus.prototype.update = function (level) {
    this.t++;
    var pl = level.player;
    if (!pl || pl.dead || pl.invuln > 0) return;
    if (overlap(pl, this)) pl.hurt();
  };
  Octopus.prototype.draw = function (ctx, cam) {
    var cx = Math.round(this.x + this.w / 2 - cam.x);
    var cy = Math.round(this.y + 14 - cam.y);
    // Dome body
    ctx.fillStyle = '#a04068';
    ctx.beginPath(); ctx.ellipse(cx, cy, 22, 14, 0, Math.PI, 0); ctx.fill();
    // Lighter top dome highlight
    ctx.fillStyle = '#d068a0';
    ctx.beginPath(); ctx.ellipse(cx, cy - 2, 16, 8, 0, Math.PI, 0); ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath(); ctx.arc(cx - 7, cy + 1, 3, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 7, cy + 1, 3, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#1a1640';
    ctx.beginPath(); ctx.arc(cx - 7, cy + 2, 1.5, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 7, cy + 2, 1.5, 0, 6.28); ctx.fill();
    // 6 tentacles draped down + sideways with slow sine sway
    ctx.strokeStyle = '#a04068'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (var i = 0; i < 6; i++) {
      var ang = (i / 5) * Math.PI - Math.PI;     // -PI to 0 (left to right)
      var bx = cx + Math.cos(ang) * 18;
      var by = cy + Math.abs(Math.sin(ang)) * 8 + 6;
      var sway = Math.sin(this.t * 0.05 + i) * 3;
      var ex = bx + (i - 2.5) * 2 + sway;
      var ey = by + 20;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + sway, by + 10, ex, ey);
      ctx.stroke();
    }
    // Suction cup dots on tentacles
    ctx.fillStyle = '#ffd0e0';
    for (var s = 0; s < 6; s++) {
      var sx = cx + (s - 2.5) * 9 + Math.sin(this.t * 0.05 + s) * 2;
      ctx.fillRect(sx | 0, cy + 24, 1, 1);
      ctx.fillRect(sx | 0, cy + 30, 1, 1);
    }
  };
  Octopus.prototype.zap = function () {};
  Octopus.prototype.stomped = function () {};

  // -----------------------------------------------------------------
  // Electric eel - fixed underwater hazard. Sits dormant in a socket on
  // the sea floor; periodically rises as a tall electrified pillar,
  // crackles briefly, then retracts. Touching the extended body kills.
  // Used on Day 5-2 (Mark Pass 10 r2: "electric eels that are fixed in
  // place and they go up, coming out of a hole, they electrify, you
  // can't touch them, and they're like at a timed thing").
  //
  // Cycle (default 220 frames ~ 3.7 sec):
  //   idle    [0..40)   socket pulses warning glow
  //   rise    [40..80)  pillar grows to maxH, body live
  //   hold    [80..140) full height, lethal
  //   fall    [140..180)pillar shrinks
  //   dormant [180..end) socket dim
  // The pillar bbox tracks the visible body so brushes hit at the
  // expected edge.
  // -----------------------------------------------------------------
  function ElectricEel(x, y, opt) {
    // x, y is the socket position (top-left of the 16x16 floor tile
    // the eel emerges from). The pillar grows UP from socket top.
    this.ax = x + 8;                              // pillar center x
    this.ay = y;                                  // socket top y (pillar base)
    this.maxH = (opt && opt.maxH) || 9 * 16;      // 9 tiles tall when full
    this.colW = 10;                               // collision width
    this.period = (opt && opt.period) || 220;
    this.phase = (opt && opt.phase) || 0;
    this.t = this.phase % this.period;
    this.curH = 0;
    this.dead = false; this.remove = false;
    this.stompable = false;
    // Bbox - resized each frame so collision matches the visible body
    this.x = this.ax - this.colW / 2;
    this.y = this.ay;
    this.w = this.colW; this.h = 0;
    // Phase boundaries (in frames within the period)
    this.tIdle = 40;
    this.tRise = 80;
    this.tHold = 140;
    this.tFall = 180;
  }
  ElectricEel.prototype.update = function (level) {
    this.t = (this.t + 1) % this.period;
    var t = this.t;
    var h = 0;
    if (t < this.tIdle) {
      h = 0;
    } else if (t < this.tRise) {
      h = this.maxH * ((t - this.tIdle) / (this.tRise - this.tIdle));
    } else if (t < this.tHold) {
      h = this.maxH;
    } else if (t < this.tFall) {
      h = this.maxH * (1 - (t - this.tHold) / (this.tFall - this.tHold));
    } else {
      h = 0;
    }
    this.curH = h;
    this.h = h;
    this.y = this.ay - h;
    this.x = this.ax - this.colW / 2;
    // Lethal only while the pillar is visible at any height. Use the
    // same hurt path as other enemies so easy/medium just respawn.
    if (h < 2) return;
    var pl = level.player;
    if (!pl || pl.dead || pl.invuln > 0) return;
    if (overlap(pl, this)) pl.hurt();
  };
  ElectricEel.prototype.draw = function (ctx, cam) {
    var sx = Math.round(this.ax - cam.x);
    var sy = Math.round(this.ay - cam.y);
    // Socket on the sea floor - dim metallic ring, brightens during
    // the warning/idle phase so the kid sees where the next zap is.
    var warn = this.t < this.tIdle ? (this.t / this.tIdle) : 0;
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(sx - 7, sy - 4, 14, 4);              // dark crater rim
    ctx.fillStyle = '#0c1018';
    ctx.fillRect(sx - 6, sy - 3, 12, 1);
    var glowCol = warn > 0
      ? 'rgba(120,220,255,' + (0.25 + 0.5 * warn).toFixed(2) + ')'
      : 'rgba(60,90,140,0.3)';
    ctx.fillStyle = glowCol;
    ctx.fillRect(sx - 5, sy - 3, 10, 2);              // inner glow
    // If pillar is up, paint the eel body.
    if (this.curH >= 2) {
      var h = Math.round(this.curH);
      var bx = sx - 5;                                 // pillar 10 wide
      var by = sy - h;
      // Outer dark body with a ROUNDED crown - the top 2 rows are
      // inset so the head tapers instead of showing a square tip as
      // the eel rises/falls (Mark: "square at the very tip when he
      // goes up and back down").
      ctx.fillStyle = '#1a4030';
      ctx.fillRect(bx + 3, by, 4, 1);          // crown row 0 (narrow)
      ctx.fillRect(bx + 1, by + 1, 8, 1);      // crown row 1
      ctx.fillRect(bx, by + 2, 10, Math.max(0, h - 2)); // main body
      // Lighter inner body w/ vertical segments
      ctx.fillStyle = '#3a8a4a';
      ctx.fillRect(bx + 4, by, 2, 1);
      ctx.fillRect(bx + 2, by + 1, 6, 1);
      ctx.fillRect(bx + 1, by + 2, 8, Math.max(0, h - 2));
      // Segment rings - alternating darker bands every 6px
      ctx.fillStyle = '#2a5a38';
      for (var sy0 = by + 3; sy0 < by + h; sy0 += 6) {
        ctx.fillRect(bx + 1, sy0, 8, 1);
      }
      // Highlight stripe down the left edge (starts below the crown)
      ctx.fillStyle = '#7adfa0';
      ctx.fillRect(bx + 1, by + 2, 1, Math.max(0, h - 2));
      // Eyes at the top of the pillar - glowing cyan, look forward
      ctx.fillStyle = '#dffaff';
      ctx.fillRect(bx + 2, by + 1, 2, 2);
      ctx.fillRect(bx + 6, by + 1, 2, 2);
      ctx.fillStyle = '#003a4a';
      ctx.fillRect(bx + 3, by + 2, 1, 1);
      ctx.fillRect(bx + 7, by + 2, 1, 1);
      // Slit mouth under the eyes. The two 1x1 white fang pixels that
      // used to sit at the mouth corners rendered as stray squares at
      // 3x scale (Mark: "odd little square at the edge of their
      // mouth"), so just the dark slit now.
      ctx.fillStyle = '#1a1828';
      ctx.fillRect(bx + 3, by + 4, 4, 1);
      // Electric crackle arcs along the body during the lethal hold
      // phase (and during rise/fall so the threat reads). Random-ish
      // by hashing the frame.
      var crackle = (this.t > this.tIdle && this.t < this.tFall);
      if (crackle) {
        ctx.fillStyle = '#aef0ff';
        for (var a = 0; a < 5; a++) {
          var ay0 = by + 6 + ((this.t * 7 + a * 31) % Math.max(1, h - 6));
          var dir = ((this.t + a) % 2) ? -1 : 1;
          ctx.fillRect(bx + (dir > 0 ? 9 : -2), ay0, 3, 1);
          ctx.fillRect(bx + (dir > 0 ? 11 : -4), ay0 + 1, 2, 1);
        }
        // Bright top halo crowning the eel
        ctx.fillStyle = 'rgba(180,240,255,0.55)';
        ctx.fillRect(bx - 3, by - 2, 16, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + 4, by - 2, 2, 1);
      }
    }
  };
  ElectricEel.prototype.zap = function () {};        // immune to blast
  ElectricEel.prototype.stomped = function () {};   // never stompable

  // ===================== TWISTER (Day 5-1 background-drift hazard) ===
  // Drifts left-to-right across the screen at the player's altitude
  // band. Contact triggers the same flappy wall-hit behaviour as
  // hitting a pillar.
  function Twister(x, y, scale) {
    var sc = scale || 1;
    this.scale = sc;
    this.x = x; this.y = y;
    // Pass 10 round 2 (Mark): bigger, more dramatic twister.
    this.w = Math.round(18 * sc); this.h = Math.round(40 * sc);
    this.vx = 1.6;
    this.dead = false; this.remove = false;
    this.stompable = false;
    // Pass 12 (Mark): "tornadoes in the wind level are too destructive
    // - just have them as visual noise." Harmless = collision loop
    // skips the damage path. Twister.update applies the soft nudge.
    this.harmless = true;
    this.t = 0;
  }
  Twister.prototype.update = function (level) {
    this.t++;
    this.x += this.vx;
    // Wrap across the visible camera area in either direction
    var cam = level.camera;
    if (cam) {
      if (this.vx > 0 && this.x > cam.x + 360) this.x = cam.x - 40;
      if (this.vx < 0 && this.x < cam.x - 40)  this.x = cam.x + 360;
    }
    var pl = level.player;
    if (!pl || pl.dead) return;
    if (overlap(pl, this)) {
      // Pass 12 (Mark): tornadoes are no longer destructive. They
      // give a small annoying nudge (slight downdraft + tiny push in
      // their direction of travel) but never damage / stun the
      // player. Visual noise + mild interference, that's it.
      if (pl.vy < 1.8) pl.vy += 0.18;
      pl.x += this.vx * 0.25;
      // Rate-limit the bump SFX so a long overlap doesn't spam.
      if ((this.t % 24) === 0) SDD.audio.sfx('bump');
    }
  };
  Twister.prototype.draw = function (ctx, cam) {
    var sc = this.scale || 1;
    var origW = this.w, origH = this.h;
    if (sc !== 1) {
      // Temporarily revert to unscaled size for the procedural draw,
      // then scale around the visual center.
      this.w = this.w / sc; this.h = this.h / sc;
      var cxs = this.x + this.w / 2 - cam.x;
      var cys = this.y + this.h / 2 - cam.y;
      ctx.save();
      ctx.translate(cxs, cys); ctx.scale(sc, sc); ctx.translate(-cxs, -cys);
    }
    var cx = Math.round(this.x + this.w / 2 - cam.x);
    var cy = Math.round(this.y - cam.y);
    var sway1 = Math.sin(this.t * 0.18) * 3;
    var sway2 = Math.sin(this.t * 0.22 + 1.5) * 3;
    var sway3 = Math.sin(this.t * 0.26 + 3.0) * 2;
    var sway4 = Math.sin(this.t * 0.14 + 4.2) * 4;
    // Pass 12 (Mark): "increase their quality." Adds outer wisp halo,
    // ground dust ring, brighter inner core, doubled debris, top
    // turbulence shadow above the funnel. Same multi-band funnel as
    // before plus the new layers.
    // Top turbulence halo - faint inrushing air above the cone
    ctx.fillStyle = 'rgba(180,195,230,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx + sway4 * 0.5, cy - 5, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(160,180,220,0.12)';
    ctx.beginPath();
    ctx.ellipse(cx + sway4, cy - 9, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Outer wisp halo (soft outline a few pixels wider than the funnel)
    ctx.fillStyle = 'rgba(70,80,110,0.35)';
    ctx.beginPath();
    ctx.moveTo(cx - 16 + sway4, cy);
    ctx.lineTo(cx + 16 + sway4, cy);
    ctx.lineTo(cx + 8 + sway2, cy + 26);
    ctx.lineTo(cx + 4 + sway3, cy + 40);
    ctx.lineTo(cx - 4 + sway3, cy + 40);
    ctx.lineTo(cx - 8 + sway2, cy + 26);
    ctx.closePath(); ctx.fill();
    // Outer dark funnel
    ctx.fillStyle = 'rgba(50,55,80,0.65)';
    ctx.beginPath();
    ctx.moveTo(cx - 12 + sway1, cy);
    ctx.lineTo(cx + 12 + sway1, cy);
    ctx.lineTo(cx + 6 + sway2, cy + 24);
    ctx.lineTo(cx + 2 + sway3, cy + 38);
    ctx.lineTo(cx - 2 + sway3, cy + 38);
    ctx.lineTo(cx - 6 + sway2, cy + 24);
    ctx.closePath(); ctx.fill();
    // Mid swirl
    ctx.fillStyle = 'rgba(110,120,150,0.75)';
    ctx.beginPath();
    ctx.moveTo(cx - 9 + sway1, cy + 2);
    ctx.lineTo(cx + 9 + sway1, cy + 2);
    ctx.lineTo(cx + 4 + sway2, cy + 22);
    ctx.lineTo(cx + 1 + sway3, cy + 34);
    ctx.lineTo(cx - 1 + sway3, cy + 34);
    ctx.lineTo(cx - 4 + sway2, cy + 22);
    ctx.closePath(); ctx.fill();
    // Brighter spiral lines (3 bands at different heights)
    ctx.fillStyle = 'rgba(220,230,255,0.85)';
    ctx.fillRect((cx - 9 + sway1) | 0, cy + 4, 18, 1);
    ctx.fillStyle = 'rgba(200,215,245,0.75)';
    ctx.fillRect((cx - 7 + sway2) | 0, cy + 10, 14, 1);
    ctx.fillStyle = 'rgba(180,200,240,0.7)';
    ctx.fillRect((cx - 5 + sway1) | 0, cy + 16, 10, 1);
    ctx.fillStyle = 'rgba(160,185,235,0.65)';
    ctx.fillRect((cx - 3 + sway2) | 0, cy + 22, 6, 1);
    ctx.fillStyle = 'rgba(140,170,230,0.6)';
    ctx.fillRect((cx - 2 + sway3) | 0, cy + 28, 4, 1);
    // Inner bright core - thin white-blue glow up the spine for life
    ctx.fillStyle = 'rgba(230,240,255,0.45)';
    ctx.fillRect((cx - 1 + sway1) | 0, cy + 4, 2, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillRect((cx + sway2) | 0, cy + 8, 1, 14);
    // Debris specks orbiting the body (doubled count + varied sizes)
    for (var d = 0; d < 10; d++) {
      var a = this.t * 0.2 + d * 0.65;
      var dx = Math.cos(a) * (11 - (d % 6));
      var dy = 4 + (d % 6) * 5.5 + Math.sin(a * 1.3) * 1.7;
      var sz = (d % 3 === 0) ? 2 : 1;
      var dirAlt = (d & 1);
      ctx.fillStyle = dirAlt ? '#dfe6ff' : '#9aa0c4';
      ctx.fillRect((cx + dx) | 0, (cy + dy) | 0, sz, 1);
    }
    // Lifted dust at the bottom
    ctx.fillStyle = 'rgba(120,130,160,0.7)';
    ctx.fillRect((cx - 6 + sway3) | 0, cy + 36, 12, 2);
    // Ground dust ring - elliptical shadow at the touch-point
    ctx.fillStyle = 'rgba(140,150,180,0.45)';
    ctx.beginPath();
    ctx.ellipse(cx + sway3, cy + 40, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,210,235,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx + sway3, cy + 41, 16, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (sc !== 1) { ctx.restore(); this.w = origW; this.h = origH; }
  };
  Twister.prototype.zap = function () {};
  Twister.prototype.stomped = function () {};

  // -----------------------------------------------------------------
  // Checkpoint - a flag the player walks past to set a respawn point.
  // On easy + medium difficulty, death respawns at the most recently
  // triggered checkpoint instead of the stage start. Hard ignores them.
  // The flag rises from grey/lowered to bright yellow/raised when hit.
  // Sits on the entity list (this.items) for collision-against-player.
  // -----------------------------------------------------------------
  function Checkpoint(x, y, tx, ty) {
    this.x = x; this.y = y; this.w = 12; this.h = 24;
    this.tx = tx; this.ty = ty;          // tile coords - identity across respawns
    this.triggered = false;
    this.t = 0;        // animation tick - drives the raise transition
    this.raiseT = 0;   // 0..20 lerp into the raised pose on trigger
    this.remove = false;
  }
  Checkpoint.prototype.update = function (level) {
    this.t++;
    if (this.triggered && this.raiseT < 20) this.raiseT++;
    if (this.triggered) return;
    var p = level && level.player;
    if (!p || p.dead || p.win) return;
    if (overlap(this, p)) {
      this.triggered = true;
      // Respawn at the flag's base so death always puts the player
      // back on the visible checkpoint - avoids weird mid-air respawns
      // if the kid happened to brush the flag mid-jump.
      level.lastCheckpoint = { x: this.x - p.w / 2 + this.w / 2, y: this.y + this.h - p.h };
      if (!level.triggeredCheckpoints) level.triggeredCheckpoints = [];
      level.triggeredCheckpoints.push(this.tx + ',' + this.ty);
      if (SDD.audio && SDD.audio.sfx) SDD.audio.sfx('1up');
    }
  };
  Checkpoint.prototype.draw = function (ctx, cam) {
    var x = Math.round(this.x - cam.x);
    var y = Math.round(this.y - cam.y);
    // Pole (always present, stone-grey)
    ctx.fillStyle = '#9aa0b0';
    ctx.fillRect(x + 5, y, 2, this.h);
    ctx.fillStyle = '#5a6070';
    ctx.fillRect(x + 5, y, 1, this.h);
    // Base block
    ctx.fillStyle = '#5a6070';
    ctx.fillRect(x + 1, y + this.h - 3, 10, 3);
    ctx.fillStyle = '#3a4050';
    ctx.fillRect(x + 1, y + this.h - 1, 10, 1);
    // Flag - slides up the pole and changes colour when triggered.
    // Untriggered flag sits at the bottom of the pole, dull grey.
    // Triggered flag rises to the top and turns bright yellow.
    var lerp = this.raiseT / 20;
    var flagTop = this.triggered ? (y + 2 + Math.round(lerp * 0) ) : (y + this.h - 12);
    // Animate the lerp
    flagTop = Math.round((y + this.h - 12) + (this.triggered ? -((this.h - 14) * lerp) : 0));
    var wave = this.triggered ? Math.sin(this.t * 0.18) * 1.5 : 0;
    var flagW = 8;
    var flagH = 6;
    var fx = x + 7;
    var fy = flagTop;
    if (this.triggered) {
      ctx.fillStyle = '#ffd23a';                  // bright sunflower
      ctx.fillRect(fx, fy, flagW + Math.round(wave), flagH);
      ctx.fillStyle = '#a8631a';                  // edge shadow
      ctx.fillRect(fx, fy + flagH - 1, flagW + Math.round(wave), 1);
      ctx.fillRect(fx + flagW + Math.round(wave) - 1, fy + 1, 1, flagH - 1);
      // Sparkle on first trigger
      if (this.raiseT < 14 && (this.raiseT % 3) === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx + 2, fy - 1, 1, 1);
        ctx.fillRect(fx + flagW - 1, fy + 2, 1, 1);
      }
    } else {
      ctx.fillStyle = '#7a8090';                  // dull grey
      ctx.fillRect(fx, fy, flagW, flagH);
      ctx.fillStyle = '#5a6070';
      ctx.fillRect(fx, fy + flagH - 1, flagW, 1);
    }
  };
  Checkpoint.prototype.zap = function () {};
  Checkpoint.prototype.stomped = function () {};

  SDD.ent = {
    Player: Player, Walker: Walker, Wisp: Wisp, Thrower: Thrower,
    Orb: Orb, Blast: Blast, MovPlat: MovPlat, Core: Core,
    ItemDrop: ItemDrop, TimePart: TimePart, NPC: NPC,
    Checkpoint: Checkpoint, Signature: Signature,
    SolarFlare: SolarFlare, Meteor: Meteor, HazardSpawner: HazardSpawner,
    Crab: Crab, WaterJet: WaterJet, LavaPlume: LavaPlume,
    BubbleUp: BubbleUp, Octopus: Octopus, Twister: Twister,
    ElectricEel: ElectricEel, Stampede: Stampede,
    LeafFall: LeafFall, LeafSpawner: LeafSpawner
  };
})();
