// boss_scripts.js - ONE FIGHT PER BOSS (v0.61.0).
//
// Mark: "let's take a look at all our boss battles and make sure they're
// all different and related to their setting and their character itself
// and to our boss md file. I want every boss to feel different and fun."
//
// The audit finding was stark: all five district bosses ran the SAME
// script - drift, red ketchup splat, telegraphed charge - with only the
// numbers and the sprite changed. The Broccolisk lobbed ketchup. The
// Gloop King, a sewer goo monarch, fought exactly like a hot dog. That
// is the boss doc's sponge complaint in its purest form (2.3.5: the
// sponge problem is really a VARIETY problem).
//
// Now each boss is one script keyed by its character and its district,
// and the doc's spine runs through all of them:
//   - every telegraph is the reserved magenta (1.4), and the hit lands
//     the frame the visual lands (2.3.1)
//   - every big move ends in a punish window - cyan ring, double
//     damage (1.2: the window is the boss's own animation)
//   - no guaranteed damage anywhere (2.3.4), and nothing reacts to a
//     button press, only to position (2.3.3)
//   - each boss teaches ONE new word in campaign order (1.5): Frank the
//     charge, Broc the ground marker, Cake the phase shed, Vending the
//     bullet grid, Gloop the area wave - so by the Tower the player has
//     the whole vocabulary CHOMP speaks.
//
// FRANK the CHARGER      - keeps charge + condiment splat; they are HIS
//                          now, nobody else copies them. Skid recovery.
// BROCCOLISK the BURROWER- park serpent. Slither weave, floret fan,
//                          burrow -> mound chase -> erupt -> dazed.
// CAKE the SHEDDER       - its HP phases ARE its tiers: at 2/3 and 1/3
//                          it sheds a layer (into cupcake minions),
//                          shrinking and SPEEDING UP. Frosting mortar
//                          slows instead of damaging.
// VENDING the ARTILLERY  - plants itself and vends: aimed can volleys,
//                          a falling snack grid with safe gaps, restock
//                          minions, then OVERHEAT (SOLD OUT window).
// GLOOP the TIDE         - goo ring with gaps, puddle dive (25% damage,
//                          never fully immune - doc 2.3.9 anti-trope),
//                          erupt + slick, drip call.
window.PC = window.PC || {};
(function () {

  function TELL() { return PC.CHOMP_TELL_COLOR || 0xff3ea5; }

  function hurt(s, dmg) {
    if (s.dead || s.now < s.invUntil) return;
    s.hp -= Math.max(1, Math.round(dmg * (s.dmgTakenMult || 1)) - (s.stats.armor || 0));
    s.lastHurtT = s.now;
    s.invUntil = s.now + PC.PLAYER.IFRAMES;
    s.cameras.main.shake(120, 0.007);
    if (PC.audio) PC.audio.hurt();
    s.drawHud();
    if (s.hp <= 0) s.die();
  }

  // a shrinking magenta ring: the universal "this spot, now" tell
  function ringTell(g, x, y, k, r) {
    g.lineStyle(4, TELL(), 0.35 + 0.4 * Math.sin(k * 40));
    g.strokeCircle(x, y, r + (1 - k) * 40);
    g.lineStyle(2, TELL(), 0.5);
    g.strokeCircle(x, y, r);
  }

  // pooled straight-line shots, hand-collided like CHOMP's crumbs -
  // nothing here touches the bullet system
  function fireShot(b, x, y, ang, spd, dmg, tint, r) {
    b.shots.push({ x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: 3.0, hit: false, dmg: dmg, tint: tint, r: r || 11 });
  }

  function stepShots(b, dt, g) {
    var s = b.scene;
    for (var i = b.shots.length - 1; i >= 0; i--) {
      var sh = b.shots[i];
      sh.life -= dt;
      sh.x += sh.vx * dt; sh.y += sh.vy * dt;
      if (sh.life <= 0) { b.shots.splice(i, 1); continue; }
      g.fillStyle(0x15131c, 0.5); g.fillCircle(sh.x, sh.y + 4, sh.r + 1);
      g.fillStyle(sh.tint, 1); g.fillCircle(sh.x, sh.y, sh.r);
      g.fillStyle(0xffffff, 0.5); g.fillCircle(sh.x - 3, sh.y - 3, sh.r * 0.35);
      if (!sh.hit) {
        var dx = s.px - sh.x, dy = s.py - sh.y;
        if (dx * dx + dy * dy < (sh.r + 12) * (sh.r + 12)) { sh.hit = true; hurt(s, sh.dmg); }
      }
    }
  }

  function spawnKid(s, x, y, key) {
    var d = PC.ENEMY_DEFS[key];
    if (!d || !s.enemies) return;
    s.enemies.spawn(x, y, { key: d.key, still: d.still, size: d.size, xp: d.xp,
      kbMult: d.kbMult, spd: d.spd, hp: d.hp, dmg: d.dmg });
  }

  // the punish window, in the cyan the whole game already uses for SAFE
  function drawVuln(b, g) {
    var k = Math.min(1, b.vuln / 0.6);
    g.lineStyle(5, 0x35d0ff, 0.5 * k * (0.5 + 0.3 * Math.sin(b.scene.now * 7)));
    g.strokeCircle(b.x, b.y, b.r + 30);
  }

  // ==================================================================
  // BIG FRANK - THE CHARGER (District 1, the bank).
  // The tutorial boss keeps the original fight - drift, condiment
  // splat, telegraphed charge - because it is a good FIRST fight and
  // now it is his alone. New: the charge ends in a SKID (doc 1.2, the
  // window is the animation - a sausage at speed does not corner).
  // ==================================================================
  var Frank = {
    init: function (b) { b.chargeCd = 6; b.splatCd = 4; },
    update: function (b, dt, px, py) {
      var s = b.scene, g = b.gfx;
      if (b.state === 'active') {
        var dx = px - b.x, dy = py - b.y, len = Math.hypot(dx, dy) || 1;
        b.x += (dx / len) * b.spd * dt;
        b.y += (dy / len) * b.spd * dt;
        b.chargeCd -= dt; b.splatCd -= dt;
        if (b.splatCd <= 0) { b.splatCd = 9; b.splat(5, 0xd93a3a, 'dmg'); }
        if (b.chargeCd <= 0) {
          b.chargeCd = b.enraged() ? 4 : 6;
          b.state = 'telegraph'; b.stateT = 0;
          b._tdx = dx / len; b._tdy = dy / len;
        }
      } else if (b.state === 'telegraph') {
        g.lineStyle(10, TELL(), 0.35 + 0.15 * Math.sin(b.stateT * 20));
        g.lineBetween(b.x, b.y, b.x + b._tdx * 360, b.y + b._tdy * 360);
        if (b.stateT > 0.7) {
          b.state = 'charge'; b.stateT = 0;
          var ezc = PC.ease ? (PC.ease(s).bossCharge || 1) : 1;
          b.cvx = b._tdx * 320 * ezc; b.cvy = b._tdy * 320 * ezc;
          if (PC.audio) PC.audio.roar();
        }
      } else if (b.state === 'charge') {
        b.x += b.cvx * dt; b.y += b.cvy * dt;
        if (b.stateT > 1.1) { b.state = 'skid'; b.stateT = 0; b.vuln = 1.2; }
      } else if (b.state === 'skid') {
        // ploughing to a stop: still sliding, can't turn, wide open
        b.x += b.cvx * dt * Math.max(0, 1 - b.stateT * 2.4);
        b.y += b.cvy * dt * Math.max(0, 1 - b.stateT * 2.4);
        if (b.stateT > 1.2) { b.state = 'active'; b.stateT = 0; }
      }
    },
    pose: function (b) {
      if (b.state === 'skid') {
        b.sprite.setScale(b.baseS * 1.22, b.baseS * 0.9);
        b.sprite.setAngle(Math.sin(b.animT * 18) * 6);
        return true;
      }
      return false;
    },
  };

  // ==================================================================
  // THE BROCCOLISK - THE BURROWER (District 2, Adventure Park).
  // A garden serpent fights like a garden pest: it WEAVES instead of
  // walking straight, spits florets (green - it is a vegetable, the
  // ketchup was never its), and dives into the flowerbeds. The mound
  // chases you SLOWER than you walk (2.3.4), erupts where it stops,
  // and the snake surfaces dazed.
  // ==================================================================
  var Broc = {
    init: function (b) { b.fanCd = 3.5; b.digCd = 7; b.mx = b.x; b.my = b.y; },
    update: function (b, dt, px, py) {
      var s = b.scene, g = b.gfx;
      if (b.state === 'active') {
        var dx = px - b.x, dy = py - b.y, len = Math.hypot(dx, dy) || 1;
        // serpentine weave: forward drift plus a perpendicular sway
        var sway = Math.sin(s.now * 2.6) * 70;
        b.x += ((dx / len) * b.spd + (-dy / len) * sway) * dt;
        b.y += ((dy / len) * b.spd + (dx / len) * sway) * dt;
        b.fanCd -= dt; b.digCd -= dt;
        if (b.fanCd <= 0) { b.fanCd = b.enraged() ? 3.2 : 4.5; b.state = 'fan'; b.stateT = 0; }
        else if (b.digCd <= 0) {
          b.digCd = b.enraged() ? 7 : 10;
          b.state = 'burrow'; b.stateT = 0;
          b.mx = b.x; b.my = b.y;
          b.guard = 0.25; b.noContact = true;          // shots plink into the dirt
          b.sprite.setVisible(false); b.shadow.setVisible(false);
          if (s.fx) s.fx.burst(b.x, b.y, 'fx_pop', 10, 0.5);
        }
      } else if (b.state === 'fan') {
        var aim = Math.atan2(py - b.y, px - b.x);
        if (b.stateT < 0.7) {
          g.lineStyle(4, TELL(), 0.4 + 0.3 * Math.sin(b.stateT * 22));
          g.beginPath(); g.arc(b.x, b.y, 70, aim - 0.55, aim + 0.55); g.strokePath();
        } else {
          for (var i = -2; i <= 2; i++) fireShot(b, b.x, b.y, aim + i * 0.24, 240, 10, 0x7dd97b, 10);
          b.state = 'active'; b.stateT = 0; b.vuln = 1.0;
          if (PC.audio) PC.audio.splat();
        }
      } else if (b.state === 'burrow') {
        // the mound: slower than you, so walking away always works
        var mdx = px - b.mx, mdy = py - b.my, ml = Math.hypot(mdx, mdy) || 1;
        b.mx += (mdx / ml) * 130 * dt; b.my += (mdy / ml) * 130 * dt;
        b.x = b.mx; b.y = b.my;                        // hitbox travels with it
        g.fillStyle(0x6b5537, 0.7); g.fillEllipse(b.mx, b.my, 76, 40);
        g.fillStyle(0x8a7048, 0.8); g.fillEllipse(b.mx, b.my - 4, 52, 26);
        ringTell(g, b.mx, b.my, (b.stateT % 0.5) * 2, 80);
        if (Math.random() < dt * 8 && b.scene.fx) b.scene.fx.burst(b.mx + (Math.random() - 0.5) * 50, b.my, 'fx_pop', 1, 0.25);
        if (b.stateT > 2.4) {
          b.state = 'erupt'; b.stateT = 0;
          b.guard = 1; b.noContact = false;
          b.sprite.setVisible(true); b.shadow.setVisible(true);
          var edx = px - b.mx, edy = py - b.my;
          if (edx * edx + edy * edy < 80 * 80) hurt(s, 14);
          s.cameras.main.shake(200, 0.008);
          if (s.fx) s.fx.burst(b.mx, b.my, 'fx_spark', 14, 0.5);
          b.vuln = 1.6;                                // surfaced and dazed
        }
      } else if (b.state === 'erupt') {
        if (b.stateT > 1.6) { b.state = 'active'; b.stateT = 0; }
      }
    },
    pose: function (b) {
      if (b.state === 'erupt') {
        b.sprite.setScale(b.baseS, b.baseS * (1 + 0.2 * Math.max(0, 1 - b.stateT * 2)));
        b.sprite.setAngle(Math.sin(b.animT * 10) * 8);
        return true;
      }
      return false;
    },
  };

  // ==================================================================
  // LAYER CAKE COLOSSUS - THE SHEDDER (District 3, Sweet Suburbs).
  // Its health bar phases ARE its body: at 2/3 and 1/3 HP a whole tier
  // flies off (and lands as cupcake minions), the colossus gets
  // SMALLER and FASTER, and the shed leaves it stunned - the doc's
  // phase transition (1.9) made physical. Frosting mortar lays pink
  // puddles that SLOW instead of damaging - pressure, not chip.
  // ==================================================================
  var Cake = {
    init: function (b) {
      b.tier = 3; b.mortarCd = 4;
      b.baseS = 1.32; b.spd = 76;                      // starts huge and slow
    },
    update: function (b, dt, px, py) {
      var s = b.scene, g = b.gfx;
      // tier gates, idempotent like CHOMP's
      var f = b.hp / b.maxHp;
      var wantTier = f > 2 / 3 ? 3 : f > 1 / 3 ? 2 : 1;
      if (wantTier < b.tier && b.state !== 'shed') {
        b.tier = wantTier;
        b.state = 'shed'; b.stateT = 0; b.vuln = 2.0; b.noContact = true;
        // the tier lands beside it as living cupcakes
        spawnKid(s, b.x - 70, b.y + 20, 'cupcake');
        spawnKid(s, b.x + 70, b.y + 20, 'cupcake');
        b.baseS = b.tier === 2 ? 1.08 : 0.88;          // visibly less cake
        b.spd = b.tier === 2 ? 108 : 138;              // visibly more angry
        b.r = Math.round(b.r * 0.82);
        s.cameras.main.shake(260, 0.01);
        if (s.fx) s.fx.burst(b.x, b.y - 30, 'fx_pop', 16, 0.6);
        if (s.floatText) s.floatText(b.tier === 2 ? 'A LAYER DOWN!' : 'LAST LAYER!', 0xff9ecb);
      }
      if (b.state === 'active') {
        var dx = px - b.x, dy = py - b.y, len = Math.hypot(dx, dy) || 1;
        b.x += (dx / len) * b.spd * dt;
        b.y += (dy / len) * b.spd * dt;
        b.mortarCd -= dt;
        if (b.mortarCd <= 0) {
          b.mortarCd = b.enraged() ? 5 : 7;
          b.splat(4 - b.tier + 3, 0xff9ecb, 'slow');   // more mortar as it sheds
          b.vulnAfter = 1.0;
        }
      } else if (b.state === 'shed') {
        if (b.stateT > 1.4) { b.state = 'active'; b.stateT = 0; b.noContact = false; }
      }
    },
    pose: function (b) {
      if (b.state === 'shed') {
        b.sprite.setScale(b.baseS * (1 + Math.sin(b.animT * 22) * 0.06), b.baseS * 0.92);
        b.sprite.setAngle(Math.sin(b.animT * 16) * 7);
        return true;
      }
      return false;
    },
  };

  // ==================================================================
  // VENDING BEHEMOTH - THE ARTILLERY (District 4, the Labs).
  // A vending machine does not chase anyone. It PLANTS itself and
  // vends: aimed can volleys, then a falling snack GRID with safe gaps
  // (read the gap, doc 8 - rhythm not randomness), a minion restock -
  // and then it OVERHEATS: SOLD OUT, lights flicker, the longest
  // punish window of any district boss. The doc's punish economy on a
  // machine that genuinely cannot corner you.
  // ==================================================================
  var Vend = {
    init: function (b) { b.cycle = 0; b.restockCd = 12; b.grid = []; },
    update: function (b, dt, px, py) {
      var s = b.scene, g = b.gfx;
      // it only waddles if you leave its range entirely
      var dx = px - b.x, dy = py - b.y, len = Math.hypot(dx, dy) || 1;
      if (len > 480 && b.state === 'active') {
        b.x += (dx / len) * b.spd * dt; b.y += (dy / len) * b.spd * dt;
      }
      b.restockCd -= dt;
      if (b.restockCd <= 0 && b.state === 'active') {
        b.restockCd = 12;
        spawnKid(s, b.x - 60, b.y + 30, 'zipper');
        spawnKid(s, b.x + 60, b.y + 30, 'sodacan');
        if (s.fx) s.fx.burst(b.x, b.y + 20, 'fx_spark', 8, 0.4);
      }
      if (b.state === 'active') {
        b.stateT2 = (b.stateT2 || 0) + dt;
        if (b.stateT2 > (b.enraged() ? 2.2 : 3.2)) {
          b.stateT2 = 0;
          b.cycle = (b.cycle + 1) % 3;
          b.state = b.cycle === 2 ? 'gridTell' : 'volleyTell';
          b.stateT = 0;
          if (b.state === 'gridTell') this._layGrid(b, px, py);
        }
      } else if (b.state === 'volleyTell') {
        var aim = Math.atan2(py - b.y, px - b.x);
        ringTell(g, b.x + Math.cos(aim) * 60, b.y + Math.sin(aim) * 60, Math.min(1, b.stateT / 0.8), 22);
        if (b.stateT > 0.8) {
          for (var i = -1; i <= 1; i++) fireShot(b, b.x, b.y, aim + i * 0.2, 270, 11, 0xf2a03c, 12);
          b.state = 'active'; b.stateT = 0;
          if (PC.audio) PC.audio.splat();
        }
      } else if (b.state === 'gridTell') {
        for (var gi = 0; gi < b.grid.length; gi++) {
          var c = b.grid[gi];
          ringTell(g, c.x, c.y, Math.min(1, b.stateT / 1.0), 40);
        }
        if (b.stateT > 1.0) {
          for (var gj = 0; gj < b.grid.length; gj++) {
            var c2 = b.grid[gj];
            var pdx = px - c2.x, pdy = py - c2.y;
            if (pdx * pdx + pdy * pdy < 52 * 52) hurt(s, 13);
            if (s.fx) s.fx.burst(c2.x, c2.y, 'fx_pop', 6, 0.4);
          }
          s.cameras.main.shake(180, 0.007);
          b.grid.length = 0;
          // THE OVERHEAT: it vended too hard. Longest window in the game
          // before the Tower.
          b.state = 'overheat'; b.stateT = 0; b.vuln = 2.5;
          if (s.floatText) s.floatText('SOLD OUT!', 0x35d0ff);
        }
      } else if (b.state === 'overheat') {
        // lights flicker while it reboots
        if (Math.random() < dt * 10 && s.fx) s.fx.burst(b.x + (Math.random() - 0.5) * 60, b.y - 30, 'fx_spark', 1, 0.3);
        if (b.stateT > 2.5) { b.state = 'active'; b.stateT = 0; }
      }
    },
    _layGrid: function (b, px, py) {
      b.grid.length = 0;
      // a 3x3 snack grid centred on where you STAND, with two cells
      // left safe - the answer is read the gap, never tank it
      var skipA = Math.floor(Math.random() * 9), skipB = (skipA + 4) % 9;
      for (var i = 0; i < 9; i++) {
        if (i === skipA || i === skipB) continue;
        b.grid.push({ x: px + ((i % 3) - 1) * 110, y: py + (Math.floor(i / 3) - 1) * 110 });
      }
    },
    pose: function (b) {
      if (b.state === 'overheat') {
        b.sprite.setScale(b.baseS, b.baseS * (1 - 0.05 * Math.abs(Math.sin(b.animT * 12))));
        b.sprite.setAngle(Math.sin(b.animT * 30) * 2);
        return true;
      }
      return false;
    },
  };

  // ==================================================================
  // THE GLOOP KING - THE TIDE (District 5, the Undercity).
  // A sewer monarch owns the GROUND. An expanding goo ring with two
  // gaps (step through, never tank), a puddle DIVE that slides at you
  // - shots into the puddle still land at 25%, because a boss that is
  // invulnerable-until-X is the doc's named anti-trope (2.3.9) - an
  // eruption that leaves a slick, and drips called up from the flow.
  // ==================================================================
  var Gloop = {
    init: function (b) { b.ringCd = 5; b.diveCd = 9; b.dripCd = 14; b.rings = []; },
    update: function (b, dt, px, py) {
      var s = b.scene, g = b.gfx;
      // rings live independently of state so a dive can overlap one
      for (var i = b.rings.length - 1; i >= 0; i--) {
        var r0 = b.rings[i];
        r0.r += 150 * dt;
        if (r0.r > 340) { b.rings.splice(i, 1); continue; }
        // draw the ring with its two gaps
        for (var aa = 0; aa < 24; aa++) {
          var ang = (aa / 24) * Math.PI * 2;
          var dGap = Math.min(Math.abs(((ang - r0.gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI),
                              Math.abs(((ang - r0.gap - Math.PI + Math.PI * 3) % (Math.PI * 2)) - Math.PI));
          if (dGap > Math.PI - 0.45) continue;
          g.fillStyle(0x7a9b3f, 0.85);
          g.fillCircle(r0.cx + Math.cos(ang) * r0.r, r0.cy + Math.sin(ang) * r0.r * 0.85, 12);
          g.fillStyle(0xa8e04a, 0.5);
          g.fillCircle(r0.cx + Math.cos(ang) * r0.r, r0.cy + Math.sin(ang) * r0.r * 0.85 - 3, 6);
        }
        if (!r0.hit) {
          var pr = Math.hypot(px - r0.cx, (py - r0.cy) / 0.85);
          var pAng = Math.atan2((py - r0.cy) / 0.85, px - r0.cx);
          var pGap = Math.min(Math.abs(((pAng - r0.gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI),
                              Math.abs(((pAng - r0.gap - Math.PI + Math.PI * 3) % (Math.PI * 2)) - Math.PI));
          if (Math.abs(pr - r0.r) < 24 && pGap <= Math.PI - 0.45) { r0.hit = true; hurt(s, 12); }
        }
      }
      if (b.state === 'active') {
        var dx = px - b.x, dy = py - b.y, len = Math.hypot(dx, dy) || 1;
        b.x += (dx / len) * b.spd * dt;
        b.y += (dy / len) * b.spd * dt;
        b.ringCd -= dt; b.diveCd -= dt; b.dripCd -= dt;
        if (b.dripCd <= 0) {
          b.dripCd = 14;
          for (var dcount = 0; dcount < 3; dcount++) {
            spawnKid(s, b.x + (Math.random() - 0.5) * 160, b.y + (Math.random() - 0.5) * 120, 'drip');
          }
        }
        if (b.ringCd <= 0) { b.ringCd = b.enraged() ? 5 : 7.5; b.state = 'ringTell'; b.stateT = 0; }
        else if (b.diveCd <= 0) {
          b.diveCd = b.enraged() ? 9 : 13;
          b.state = 'dive'; b.stateT = 0;
          b.guard = 0.25; b.noContact = true;
          b.sprite.setVisible(false); b.shadow.setVisible(false);
          b.mx = b.x; b.my = b.y;
          if (s.fx) s.fx.burst(b.x, b.y, 'fx_splash', 10, 0.5);
        }
      } else if (b.state === 'ringTell') {
        ringTell(g, b.x, b.y, Math.min(1, b.stateT / 0.8), b.r + 20);
        if (b.stateT > 0.8) {
          b.rings.push({ cx: b.x, cy: b.y, r: b.r + 10, gap: Math.random() * Math.PI * 2, hit: false });
          b.state = 'active'; b.stateT = 0; b.vuln = 1.2;
          if (PC.audio) PC.audio.splat();
        }
      } else if (b.state === 'dive') {
        // the puddle slides at you - slower than you walk
        var mdx = px - b.mx, mdy = py - b.my, ml = Math.hypot(mdx, mdy) || 1;
        b.mx += (mdx / ml) * 140 * dt; b.my += (mdy / ml) * 140 * dt;
        b.x = b.mx; b.y = b.my;
        var wob = 1 + Math.sin(s.now * 6) * 0.08;
        g.fillStyle(0x556b2f, 0.75); g.fillEllipse(b.mx, b.my, 110 * wob, 60 * wob);
        g.fillStyle(0x7a9b3f, 0.7); g.fillEllipse(b.mx, b.my, 78 * wob, 42 * wob);
        ringTell(g, b.mx, b.my, (b.stateT % 0.5) * 2, 70);
        if (b.stateT > 2.6) {
          b.state = 'erupt'; b.stateT = 0;
          b.guard = 1; b.noContact = false;
          b.sprite.setVisible(true); b.shadow.setVisible(true);
          var edx = px - b.mx, edy = py - b.my;
          if (edx * edx + edy * edy < 90 * 90) hurt(s, 15);
          b.splat(2, 0x7a9b3f, 'slow');                 // the slick it leaves
          s.cameras.main.shake(220, 0.009);
          if (s.fx) s.fx.burst(b.mx, b.my, 'fx_splash', 16, 0.6);
          b.vuln = 1.5;
        }
      } else if (b.state === 'erupt') {
        if (b.stateT > 1.5) { b.state = 'active'; b.stateT = 0; }
      }
    },
    pose: function (b) {
      if (b.state === 'erupt') {
        b.sprite.setScale(b.baseS * (1 + 0.15 * Math.max(0, 1 - b.stateT * 2)), b.baseS);
        return true;
      }
      return false;
    },
  };

  PC.BossScripts = {
    frank: Frank,
    broccolisk: Broc,
    cakeColossus: Cake,
    vendingBehemoth: Vend,
    gloopKing: Gloop,
    _hurt: hurt, _fireShot: fireShot, _stepShots: stepShots, _drawVuln: drawVuln,
  };
})();
