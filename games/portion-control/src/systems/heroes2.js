// heroes2.js - hero signature reworks (Weapons&VFX doc Tasks 6-8 +
// Task 9 Salt/Josh, ALL approved by Mark 2026-07-26). Each behind its
// own flag; legacy weapons remain for flag-off AND for inheritance
// (other heroes drafting "POCKET SENTRY"/"COMET BEAM"/"THORN SEEDS"
// get the classic versions - the reworks are owner-exclusive).
window.PC = window.PC || {};

// ---------------------------------------------------------------
// VIC - SENTRY BOT + DEPLOY BUTTON (flag VIC_SENTRY_BOT)
// A robot pal walks beside Vic firing aimed 3-round BURSTS
// (distinct from THE GIZMOTRON's orbiting single pecks), plus the
// game's ONLY active input: a Vic-exclusive Deploy button that
// drops a heavy turret on a cooldown.
// ---------------------------------------------------------------
PC.SentryBotWeapon = function (scene) {
  this.key = 'sentrybot'; this.name = 'SENTRY BOT';
  this.level = 1; this.max = 5;
  this.bots = 1; this.burstCd = 1.1; this.dmg = 7; this.range = 220;
  this.cd = 12;                 // DEPLOY button cooldown (masterize: *0.8)
  this.life = 10;               // heavy turret life (masterize: *1.5)
  this.deployT = 0; this.t = 0;
  this.botSprites = [];
  for (var i = 0; i < 2; i++) {
    this.botSprites.push({ x: 0, y: 0, burstT: 0.4 + i * 0.5, firing: 0, fireGap: 0,
      target: null,
      img: scene.add.image(0, 0, 'atlas', 'sig_sentrybot')
        .setScale(0.75).setDepth(9).setVisible(false) });
  }
  // heavy deployed turret (one alive)
  this.turret = { active: false, x: 0, y: 0, t: 0, fireT: 0,
    img: scene.add.image(0, 0, 'atlas', 'sig_turret')
      .setDepth(7).setVisible(false) };
  this._buildButton(scene);
};
PC.SentryBotWeapon.prototype.desc = function () {
  return ['', 'A robot pal + a deploy button', 'Faster bursts!', 'Damage up!',
          'Second bot!', 'Overcharged!'][Math.min(this.level + 1, 5)] || 'Faster bursts!';
};
PC.SentryBotWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.burstCd = 0.85;
  else if (this.level === 3) this.dmg = 11;
  else if (this.level === 4) this.bots = 2;
  else if (this.level === 5) { this.dmg = 15; this.range = 270; }
};
PC.SentryBotWeapon.prototype._buildButton = function (scene) {
  var W = PC.RENDER.W, H = PC.RENDER.H, self = this;
  this.btnGfx = scene.add.graphics().setDepth(102);
  this.btnTxt = scene.add.text(W - 30, H - 52, 'DEPLOY', {
    fontFamily: 'monospace', fontSize: '7px', color: '#f7f4ef', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(103);
  this.btnZone = scene.add.zone(W - 30, H - 52, 48, 48).setDepth(103)
    .setInteractive({ useHandCursor: true });
  this.btnZone.on('pointerdown', function (p, lx, ly, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();   // don't grab the joystick
    if (self.deployT > 0) return;
    self.deployT = self.cd * scene.stats.cdMult;
    var t = self.turret;
    t.active = true; t.x = scene.px; t.y = scene.py;
    t.t = self.life * (scene.stats.durMult || 1); t.fireT = 0.15;
    t.img.setPosition(t.x, t.y - 7).setVisible(true).setAlpha(1);
    if (scene.vfx) { scene.vfx.telegraphRing(t.x, t.y - 7, 22, 500, 0x35d0ff); scene.vfx.shake(2, 80); }
    scene.fx.burst(t.x, t.y - 7, 'fx_nova_1', 3, 0.25);
    if (PC.audio) PC.audio.chest();
  });
  scene.uiAttach(this.btnGfx);
  scene.uiAttach(this.btnTxt);
  scene.uiAttach(this.btnZone);
};
PC.SentryBotWeapon.prototype._drawButton = function (scene) {
  var W = PC.RENDER.W, H = PC.RENDER.H;
  var g = this.btnGfx;
  g.clear();
  var ready = this.deployT <= 0;
  g.fillStyle(0x120e24, 0.85).fillCircle(W - 30, H - 52, 20);
  g.lineStyle(2, ready ? 0x35d0ff : 0x45356e, 1).strokeCircle(W - 30, H - 52, 20);
  if (!ready) {
    // cooldown ring sweep
    var k = 1 - this.deployT / (this.cd * scene.stats.cdMult);
    g.lineStyle(3, 0xf2c33c, 0.9);
    g.beginPath();
    g.arc(W - 30, H - 52, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
    g.strokePath();
  } else {
    g.lineStyle(1, 0x35d0ff, 0.5 + 0.3 * Math.sin(scene.now * 6));
    g.strokeCircle(W - 30, H - 52, 15);
  }
};
PC.SentryBotWeapon.prototype.update = function (dt, scene) {
  this.t += dt;
  if (this.deployT > 0) this.deployT -= dt;
  this._drawButton(scene);
  // bots walk beside Vic (lerp to flanking offsets), aimed 3-round bursts
  for (var i = 0; i < this.botSprites.length; i++) {
    var b = this.botSprites[i];
    if (i >= this.bots) { b.img.setVisible(false); continue; }
    var side = i === 0 ? -1 : 1;
    var hx = scene.px + side * 22 * scene.facing - 10 * scene.facing;
    var hy = scene.py - 6 + Math.sin(this.t * 4 + i * 2) * 3;
    b.x += (hx - b.x) * Math.min(1, dt * 6);
    b.y += (hy - b.y) * Math.min(1, dt * 6);
    b.img.setPosition(Math.round(b.x), Math.round(b.y)).setVisible(true)
      .setFlipX(scene.facing < 0);
    if (b.firing > 0) {
      b.fireGap -= dt;
      if (b.fireGap <= 0 && b.target) {
        b.fireGap = 0.08; b.firing--;
        if (scene.vfx) scene.vfx.muzzleFlash(b.x, b.y - 4);
        scene.bullets.fire(b.x, b.y - 4, b.target.x, b.target.y,
          { speed: 500, dmg: PC.rollDmg(scene, this.dmg * (this.mastery || 1)),
            frame: 'proj_pellet', life: 0.6 });
        if (PC.audio) PC.audio.shoot();
      }
      continue;
    }
    b.burstT -= dt;
    if (b.burstT > 0) continue;
    var best = null, bestD = this.range * this.range;
    var pool = scene.enemies.pool;
    for (var k = 0; k < pool.length; k++) {
      var e = pool[k];
      if (!e.active) continue;
      var dx = e.x - b.x, dy = e.y - b.y;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) {
      b.burstT = this.burstCd * scene.stats.cdMult;
      b.firing = 3; b.fireGap = 0; b.target = best;
    } else { b.burstT = 0.25; }
  }
  // heavy deployed turret
  var t = this.turret;
  if (t.active) {
    t.t -= dt;
    if (t.t <= 0) { t.active = false; t.img.setVisible(false); }
    else {
      if (t.t < 2) t.img.setAlpha(0.4 + 0.3 * Math.sin(t.t * 12));
      t.fireT -= dt;
      if (t.fireT <= 0) {
        var tb = null, tbd = 240 * 240;
        var tp = scene.enemies.pool;
        for (var m = 0; m < tp.length; m++) {
          var te = tp[m];
          if (!te.active) continue;
          var tdx = te.x - t.x, tdy = te.y - t.y;
          var td = tdx * tdx + tdy * tdy;
          if (td < tbd) { tbd = td; tb = te; }
        }
        if (tb) {
          t.fireT = 0.25;
          if (scene.vfx) scene.vfx.muzzleFlash(t.x, t.y - 9, 0xf2c33c);
          scene.bullets.fire(t.x, t.y - 9, tb.x, tb.y,
            { speed: 520, dmg: PC.rollDmg(scene, (this.dmg + 8) * (this.mastery || 1)),
              frame: 'proj_pellet', life: 0.7 });
          if (PC.audio) PC.audio.shoot();
        } else { t.fireT = 0.2; }
      }
    }
  }
};

// ---------------------------------------------------------------
// CARLOS - COMET CALL (flag CARLOS_COMET_CALL)
// Spots the FARTHEST enemy; a beat later a comet falls from the sky
// onto it - big single-target crit + the streak damages the column.
// ---------------------------------------------------------------
PC.CometWeapon = function (scene) {
  this.key = 'comet'; this.name = 'COMET CALL';
  this.level = 1; this.max = 5;
  this.cd = 2.2; this.cdT = 0.8; this.dmg = 30; this.comets = 1;
  this.impactR = 34;
};
PC.CometWeapon.prototype.desc = function () {
  return ['', 'Calls comets on the farthest foe', 'Damage up!', 'Twin comets!',
          'Faster calls!', 'Heavier impact!'][Math.min(this.level + 1, 5)] || 'Damage up!';
};
PC.CometWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.dmg = 42;
  else if (this.level === 3) this.comets = 2;
  else if (this.level === 4) this.cd = 1.6;
  else if (this.level === 5) { this.dmg = 56; this.impactR = 44; }
};
PC.CometWeapon.prototype._call = function (scene, target, delay) {
  var self = this;
  var tx = target.x, ty = target.y;
  if (scene.vfx) scene.vfx.telegraphRing(tx, ty, this.impactR, 420 + delay, 0xff6b6b);
  scene.time.delayedCall(300 + delay, function () {
    // re-track the target a little so it feels aimed
    if (target.active) { tx = target.x; ty = target.y; }
    // sig_comet art is drawn mid-fall: head bottom-left, tail up-right -
    // matches the (+24,-170) -> target travel line with no rotation.
    var streak = scene.add.image(tx + 24, ty - 170, 'atlas', 'sig_comet')
      .setDepth(15);
    scene.tweens.add({ targets: streak, x: tx, y: ty, duration: 200, ease: 'Quad.in',
      onComplete: function () {
        streak.destroy();
        var R = self.impactR * scene.stats.areaMult;
        var dmg = PC.rollDmg(scene, self.dmg * (self.mastery || 1));
        if (self.critBoost && !scene._lastCrit && Math.random() < self.critBoost) {
          dmg *= 2; scene._lastCrit = true;
        }
        scene.fx.burst(tx, ty, 'fx_pop', 5, 0.3);
        scene.fx.burst(tx, ty, 'fx_nova_1', 3, 0.25, 0xf2c33c);
        if (scene.vfx) scene.vfx.shake(2.5, 90);
        scene.enemies.hash.eachNear(tx, ty, function (e) {
          var dx = e.x - tx, dy = e.y - ty;
          if (dx * dx + dy * dy > R * R) return;
          var dl = Math.sqrt(dx * dx + dy * dy) || 1;
          PC.damageEnemy(scene, e, dmg, dx / dl * 0.9, dy / dl * 0.9, scene._onKillCb);
        });
        // the streak scorches the column above the impact
        var pool = scene.enemies.pool;
        for (var i = 0; i < pool.length; i++) {
          var e2 = pool[i];
          if (!e2.active) continue;
          if (Math.abs(e2.x - tx) < 15 && e2.y < ty && e2.y > ty - 160) {
            PC.damageEnemy(scene, e2, dmg * 0.5, 0, 0.4, scene._onKillCb);
          }
        }
        if (scene.boss && !scene.boss.dead) {
          var bdx = scene.boss.x - tx, bdy = scene.boss.y - ty;
          if (bdx * bdx + bdy * bdy < (scene.boss.r + R) * (scene.boss.r + R)) {
            scene.hitBoss(tx, ty, dmg, 0, 0);
          }
        }
        if (PC.audio) PC.audio.pop();
      } });
  });
};
PC.CometWeapon.prototype.update = function (dt, scene) {
  this.cdT -= dt;
  if (this.cdT > 0) return;
  // farthest targets (Carlos's identity: snipe the FAR ones)
  var pool = scene.enemies.pool, list = [];
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (!e.active) continue;
    var dx = e.x - scene.px, dy = e.y - scene.py;
    list.push({ e: e, d: dx * dx + dy * dy });
  }
  if (!list.length) { this.cdT = 0.3; return; }
  list.sort(function (a, b) { return b.d - a.d; });
  this.cdT = this.cd * scene.stats.cdMult;
  for (var n = 0; n < Math.min(this.comets, list.length); n++) {
    this._call(scene, list[n].e, n * 160);
  }
  if (PC.audio) PC.audio.telegraph();
};

// ---------------------------------------------------------------
// NAYAH - HAYMAKER FLURRY (flag NAYAH_HAYMAKER)
// Rapid short-range punches at the nearest foe with LIFESTEAL.
// ---------------------------------------------------------------
PC.HaymakerWeapon = function (scene) {
  this.key = 'haymaker'; this.name = 'HAYMAKER FLURRY';
  this.level = 1; this.max = 5;
  this.cd = 0.35; this.cdT = 0.3; this.dmg = 7; this.reach = 58;
  this.lifesteal = 1; this.fists = 1; this.side = 1;
  this.gfx = scene.add.graphics().setDepth(9);
  this.flashT = 0; this.flashAng = 0;
};
PC.HaymakerWeapon.prototype.desc = function () {
  return ['', 'Fast punches that heal her', 'Faster fists!', 'Damage up!',
          'More lifesteal!', 'Double haymaker!'][Math.min(this.level + 1, 5)] || 'Faster fists!';
};
PC.HaymakerWeapon.prototype.applyLevel = function () {
  if (this.level === 2) this.cd = 0.28;
  else if (this.level === 3) this.dmg = 11;
  else if (this.level === 4) this.lifesteal = 2;
  else if (this.level === 5) { this.dmg = 15; this.fists = 2; }
};
PC.HaymakerWeapon.prototype.update = function (dt, scene) {
  if (this.flashT > 0) {
    this.flashT -= dt;
    var g = this.gfx;
    g.clear();
    if (this.flashT > 0) {
      var R = this.reach * scene.stats.areaMult;
      g.lineStyle(3, 0xf7f4ef, 0.7 * (this.flashT / 0.1));
      g.beginPath();
      g.arc(scene.px, scene.py - 6, R * 0.8, this.flashAng - 0.5, this.flashAng + 0.5);
      g.strokePath();
    }
  }
  this.cdT -= dt;
  if (this.cdT > 0) return;
  var R2 = this.reach * scene.stats.areaMult;
  var pool = scene.enemies.pool, targets = [];
  for (var i = 0; i < pool.length; i++) {
    var e = pool[i];
    if (!e.active) continue;
    var dx = e.x - scene.px, dy = e.y - scene.py;
    var d = dx * dx + dy * dy;
    if (d < R2 * R2) targets.push({ e: e, d: d });
  }
  if (!targets.length) { this.cdT = 0.1; return; }
  targets.sort(function (a, b) { return a.d - b.d; });
  this.cdT = this.cd * scene.stats.cdMult;
  this.side = -this.side;
  var healed = false;
  for (var n = 0; n < Math.min(this.fists, targets.length); n++) {
    var t = targets[n].e;
    var dmg = PC.rollDmg(scene, this.dmg * (this.mastery || 1));
    var ddx = t.x - scene.px, ddy = t.y - scene.py;
    var dl = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
    PC.damageEnemy(scene, t, dmg, ddx / dl * 0.7, ddy / dl * 0.7, scene._onKillCb);
    if (scene.vfx) scene.vfx.impactBurst(t.x, t.y, 0x7dd97b);
    if (n === 0) this.flashAng = Math.atan2(ddy, ddx) + this.side * 0.25;
    healed = true;
  }
  if (healed && this.lifesteal > 0) {
    var mh = PC.PLAYER.HP + (scene.stats.bonusHp || 0);
    if (scene.hp < mh) {
      scene.hp = Math.min(mh, scene.hp + this.lifesteal);
      this._healHud = (this._healHud || 0) + 1;
      if (this._healHud >= 4) { this._healHud = 0; scene.drawHud(); }
    }
  }
  this.flashT = 0.1;
  if (PC.audio && Math.random() < 0.5) PC.audio.pop();
};

// ---------------------------------------------------------------
// Flag wiring: swap the owners' kit weapons + display names.
// Legacy classes stay registered for inheritance + flag-off.
// ---------------------------------------------------------------
(function () {
  if (PC.VIC_SENTRY_BOT) {
    PC.KITS.victoria.weapon = function (scene) { return new PC.SentryBotWeapon(scene); };
    PC.KITS.victoria.kitName = 'SENTRY BOT';
  }
  if (PC.CARLOS_COMET_CALL) {
    PC.KITS.carlos.weapon = function (scene) { return new PC.CometWeapon(scene); };
    PC.KITS.carlos.kitName = 'COMET CALL';
  }
  if (PC.NAYAH_HAYMAKER) {
    PC.KITS.nayah.weapon = function (scene) { return new PC.HaymakerWeapon(scene); };
    PC.KITS.nayah.kitName = 'HAYMAKER FLURRY';
    PC.KITS.nayah.masterize = function (w) {
      if (w.key === 'haymaker') w.lifesteal = (w.lifesteal || 1) + 1;
      else w.root = true;
    };
  }
})();
