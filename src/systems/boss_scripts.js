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

  // party pastels for anything frosting-flavoured - never a single red
  // splotch (v0.65.0, Mark: "it starts looking like blood")
  var PASTELS = [0xff9ecb, 0xffd977, 0x9be8ff, 0xb4f2a8, 0xc9a8ff];

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
        if (b.splatCd <= 0) { b.splatCd = 9; b.say('KETCHUP RAIN!'); b.splat(5, 0xd93a3a, 'dmg'); }
        if (b.chargeCd <= 0) {
          b.chargeCd = b.enraged() ? 4 : 6;
          b.state = 'telegraph'; b.stateT = 0;
          b.say('COMING THROUGH!');
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
        if (b.fanCd <= 0) { b.fanCd = b.enraged() ? 3.2 : 4.5; b.state = 'fan'; b.stateT = 0; b.say('FLORET FLURRY!'); }
        else if (b.digCd <= 0) {
          b.digCd = b.enraged() ? 7 : 10;
          b.state = 'burrow'; b.stateT = 0;
          b.say('DOWN I GO!');
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
        // v0.63.0 (Mark: "the dig animation could disappear then appear
        // under the player"). It is fully GONE now - no mound to kite.
        // Instead a reticle shadows you, then LOCKS 0.7s before the
        // eruption, so stepping off the mark always works (doc 2.3.4:
        // dodgeable by a perfect player, and it never reads your
        // buttons, only your position).
        if (b.stateT < 1.5) {
          b.mx = px; b.my = py;                        // shadowing you
          g.lineStyle(3, TELL(), 0.30 + 0.15 * Math.sin(s.now * 10));
          g.strokeCircle(b.mx, b.my, 66);
          if (Math.random() < dt * 5 && s.fx) s.fx.burst(b.mx + (Math.random() - 0.5) * 60, b.my + 20, 'fx_pop', 1, 0.2);
        } else {
          // LOCKED: the ring tightens on the spot it chose
          var lk = Math.min(1, (b.stateT - 1.5) / 0.7);
          ringTell(g, b.mx, b.my, lk, 60);
          g.fillStyle(TELL(), 0.10 + 0.15 * lk);
          g.fillCircle(b.mx, b.my, 60 * lk);
        }
        if (b.stateT > 2.2) {
          b.state = 'erupt'; b.stateT = 0;
          b.guard = 1; b.noContact = false;
          b.x = b.mx; b.y = b.my;                      // it surfaces HERE
          b.say('SURPRISE!');
          b.sprite.setVisible(true); b.shadow.setVisible(true);
          var edx = px - b.mx, edy = py - b.my;
          if (edx * edx + edy * edy < 70 * 70) hurt(s, 14);
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
      b.split = false; b.mortarCd = 4;
      b.baseS = 1.32; b.spd = 76;                      // starts huge and slow
    },
    update: function (b, dt, px, py) {
      var s = b.scene, g = b.gfx;
      // THE SPLIT (v0.65.0, Mark: "a large cake that splits into
      // multiple cupcakes when you get it to sixty percent"). ONE gate,
      // one big moment: the colossus bursts apart - four live cupcakes
      // scatter out of it, and what is left is a smaller, angrier cake.
      if (!b.split && b.hp <= b.maxHp * 0.6 && b.state !== 'shed') {
        b.split = true;
        b.state = 'shed'; b.stateT = 0; b.vuln = 2.0; b.noContact = true;
        b.say('CUPCAKE SPLIT!', 0xff9ecb);
        for (var c4 = 0; c4 < 4; c4++) {
          var sa2 = (c4 / 4) * Math.PI * 2 + 0.6;
          spawnKid(s, b.x + Math.cos(sa2) * 85, b.y + 20 + Math.sin(sa2) * 45, 'cupcake');
        }
        b.baseS = 0.92; b.spd = 124;                   // less cake, more angry
        b.r = Math.round(b.r * 0.78);
        s.cameras.main.shake(280, 0.011);
        if (s.fx) { s.fx.burst(b.x, b.y - 30, 'fx_pop', 18, 0.7); s.fx.burst(b.x, b.y, 'fx_spark', 10, 0.5); }
        if (s.floatText) s.floatText('IT SPLIT!', 0xff9ecb);
      }
      if (b.state === 'active') {
        var dx = px - b.x, dy = py - b.y, len = Math.hypot(dx, dy) || 1;
        b.x += (dx / len) * b.spd * dt;
        b.y += (dy / len) * b.spd * dt;
        b.mortarCd -= dt;
        if (b.mortarCd <= 0) {
          b.mortarCd = b.enraged() ? 5 : 7;
          b.say('STICKY FROSTING!', 0xff9ecb);
          // pastel party splotches with sprinkles - slow, never chip
          b.splat(b.split ? 5 : 4, PASTELS, 'slow');
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
  // VENDING BEHEMOTH - THE WALKING MACHINE (District 4, the Labs).
  // v0.63.0 remake (Mark: "a walking vending machine who goes slowly
  // but spawns tons of junk food and launches candy corn rockets").
  // It never stops WALKING at you - slow, heavy, inevitable - and it
  // fights by vending: RESTOCK flings the front door open and floods
  // the floor with junk-food minions; the launcher lobs CANDY CORN
  // ROCKETS onto reticles that lock where you WERE (step off, doc
  // 2.3.4); every third salvo it OVERHEATS - SOLD OUT, sparks, the
  // longest punish window before the Tower.
  // ==================================================================
  var Vend = {
    init: function (b) {
      b.rockets = []; b.marks = [];
      b.launchCd = 4.5; b.restockCd = 7.5; b.salvoN = 0;
    },
    update: function (b, dt, px, py) {
      var s = b.scene, g = b.gfx;

      // rockets + reticles live independently of state
      for (var i = b.marks.length - 1; i >= 0; i--) {
        var m = b.marks[i];
        m.t += dt;
        var k = Math.min(1, m.t / m.eta);
        ringTell(g, m.x, m.y, k, 56);
        g.fillStyle(TELL(), 0.08 + 0.14 * k);
        g.fillCircle(m.x, m.y, 56 * k);
        if (m.t >= m.eta) {
          b.marks.splice(i, 1);
          var ddx = px - m.x, ddy = py - m.y;
          if (ddx * ddx + ddy * ddy < 62 * 62) hurt(s, 13);
          s.cameras.main.shake(150, 0.006);
          if (s.fx) { s.fx.burst(m.x, m.y, 'fx_pop', 8, 0.5); s.fx.burst(m.x, m.y, 'fx_spark', 6, 0.4); }
        }
      }
      for (var r = b.rockets.length - 1; r >= 0; r--) {
        var rk = b.rockets[r];
        rk.t += dt;
        var f = Math.min(1, rk.t / rk.dur);
        var rx = rk.x0 + (rk.x1 - rk.x0) * f;
        var ry = rk.y0 + (rk.y1 - rk.y0) * f - Math.sin(f * Math.PI) * 180;
        if (f >= 1) { b.rockets.splice(r, 1); continue; }
        // a candy corn in flight: yellow base, orange band, white tip,
        // nose pointed along the arc, sputtering flame behind it
        var ang = Math.atan2((rk.y1 - rk.y0) / rk.dur - Math.cos(f * Math.PI) * Math.PI / rk.dur * 180,
                             (rk.x1 - rk.x0) / rk.dur);
        var ca = Math.cos(ang), sa = Math.sin(ang);
        g.fillStyle(0xffd977, 1);
        g.fillTriangle(rx - ca * 14 - sa * 9, ry - sa * 14 + ca * 9,
                       rx - ca * 14 + sa * 9, ry - sa * 14 - ca * 9,
                       rx + ca * 14, ry + sa * 14);
        g.fillStyle(0xf2a03c, 1);
        g.fillTriangle(rx - ca * 2 - sa * 6, ry - sa * 2 + ca * 6,
                       rx - ca * 2 + sa * 6, ry - sa * 2 - ca * 6,
                       rx + ca * 14, ry + sa * 14);
        g.fillStyle(0xffffff, 1);
        g.fillTriangle(rx + ca * 7 - sa * 3, ry + sa * 7 + ca * 3,
                       rx + ca * 7 + sa * 3, ry + sa * 7 - ca * 3,
                       rx + ca * 14, ry + sa * 14);
        g.fillStyle(0xff6b6b, 0.7 + 0.3 * Math.sin(s.now * 30));
        g.fillCircle(rx - ca * 16, ry - sa * 16, 5);
      }

      if (b.state === 'active') {
        // it WALKS. Always. Slowly. At you.
        var dx = px - b.x, dy = py - b.y, len = Math.hypot(dx, dy) || 1;
        b.x += (dx / len) * b.spd * dt;
        b.y += (dy / len) * b.spd * dt;
        b.launchCd -= dt; b.restockCd -= dt;
        if (b.restockCd <= 0) { b.state = 'restock'; b.stateT = 0; b.say('SNACK TIME!', 0xf2a03c); }
        else if (b.launchCd <= 0) { b.state = 'launch'; b.stateT = 0; b.say('CANDY CORN AWAY!', 0xffd977); }
      } else if (b.state === 'restock') {
        // the door swings open and the floor floods with junk food
        if (b.stateT > 0.6 && !b._poured) {
          b._poured = true;
          var POUR = ['zipper', 'sodacan', 'chipbag', 'zipper', 'sodacan', 'chipbag'];
          for (var pj = 0; pj < POUR.length; pj++) {
            var pa = -Math.PI / 2 + (pj / (POUR.length - 1) - 0.5) * 1.8;
            spawnKid(s, b.x + Math.cos(pa) * 70, b.y + 40 + Math.sin(pa) * 30, POUR[pj]);
          }
          if (s.fx) s.fx.burst(b.x, b.y + 30, 'fx_pop', 10, 0.5);
          if (PC.audio) PC.audio.splat();
        }
        if (b.stateT > 1.3) {
          b.state = 'active'; b.stateT = 0; b._poured = false;
          b.restockCd = b.enraged() ? 6.5 : 9;
          b.vuln = 1.0;                                // the door was open
        }
      } else if (b.state === 'launch') {
        // hatch opens, three rockets go up, reticles LOCK where you are
        if (b.stateT > 0.5 && !b._fired) {
          b._fired = true;
          for (var n = 0; n < 3; n++) {
            var ox = n === 0 ? 0 : (Math.random() - 0.5) * 180;
            var oy = n === 0 ? 0 : (Math.random() - 0.5) * 140;
            var tx = px + ox, ty = py + oy;
            var dur = 1.1 + n * 0.15;
            b.marks.push({ x: tx, y: ty, t: 0, eta: dur });
            b.rockets.push({ x0: b.x, y0: b.y - 50, x1: tx, y1: ty, t: 0, dur: dur });
          }
          s.cameras.main.shake(120, 0.004);
          if (PC.audio) PC.audio.roar();
        }
        if (b.stateT > 1.0) {
          b.state = 'active'; b.stateT = 0; b._fired = false;
          b.launchCd = b.enraged() ? 3.6 : 5.5;
          b.salvoN++;
          if (b.salvoN % 3 === 0) {
            // it vended too hard: SOLD OUT
            b.state = 'overheat'; b.stateT = 0; b.vuln = 2.5;
            b.say('SOLD OUT!', 0x35d0ff);
          } else {
            b.vuln = 1.1;
          }
        }
      } else if (b.state === 'overheat') {
        if (Math.random() < dt * 10 && s.fx) s.fx.burst(b.x + (Math.random() - 0.5) * 60, b.y - 30, 'fx_spark', 1, 0.3);
        if (b.stateT > 2.5) { b.state = 'active'; b.stateT = 0; }
      }
    },
    pose: function (b) {
      if (b.state === 'overheat') {
        b.sprite.setScale(b.baseS, b.baseS * (1 - 0.05 * Math.abs(Math.sin(b.animT * 12))));
        b.sprite.setAngle(Math.sin(b.animT * 30) * 2);
        return true;
      }
      if (b.state === 'launch') {
        b.sprite.setScale(b.baseS, b.baseS * (1 - 0.08 * Math.min(1, b.stateT * 2)));
        return true;
      }
      return false;
    },
  };

  // ==================================================================
  // THE GLOOP KING - BULLET HEAVEN'S BULLET HELL (District 5).
  // v0.64.0 (Mark: "have him more of a bullet hell but for kids").
  // A sewer monarch who barely moves and fills the room with slow,
  // fat, readable goo - the danmaku fantasy at kid speeds. THE RULES
  // THAT MAKE IT KID-SAFE, all doc-backed:
  //   - every blob flies SLOWER than the player walks (<=130 vs 190),
  //     so walking out of a wave always works (2.3.4)
  //   - patterns are geometry, not aim-spam: a turning two-armed
  //     SPIRAL you lane through, expanding RINGS with two wide gaps,
  //     and aimed FANS with step-aside spacing - rhythm, not
  //     randomness (doc 8)
  //   - after EVERY pattern he sags, vents, and takes double damage -
  //     the fight breathes: dodge-phase, punish-phase (1.2)
  //   - the puddle DIVE stays as his reposition (guard 0.25, never
  //     immune - 2.3.9), erupting with a slick and a daze
  // ==================================================================
  var Gloop = {
    init: function (b) {
      b.rings = []; b.cyc = 0; b.spiralA = 0; b.emitT = 0; b.burstN = 0;
      b.dripCd = 14; b.diveN = 0;
    },
    update: function (b, dt, px, py) {
      var s = b.scene, g = b.gfx;
      // expanding rings live independently of state
      for (var i = b.rings.length - 1; i >= 0; i--) {
        var r0 = b.rings[i];
        r0.r += 130 * dt;
        if (r0.r > 360) { b.rings.splice(i, 1); continue; }
        for (var aa = 0; aa < 22; aa++) {
          var ang = (aa / 22) * Math.PI * 2;
          var dGap = Math.min(Math.abs(((ang - r0.gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI),
                              Math.abs(((ang - r0.gap - Math.PI + Math.PI * 3) % (Math.PI * 2)) - Math.PI));
          if (dGap > Math.PI - 0.55) continue;       // two WIDE gaps
          var bx2 = r0.cx + Math.cos(ang) * r0.r, by2 = r0.cy + Math.sin(ang) * r0.r * 0.85;
          g.fillStyle(0x556b2f, 0.9); g.fillCircle(bx2, by2 + 3, 12);
          g.fillStyle(0xa8e04a, 1); g.fillCircle(bx2, by2, 11);
          g.fillStyle(0xd6f5a8, 0.8); g.fillCircle(bx2 - 3, by2 - 3, 4);
        }
        if (!r0.hit) {
          var pr = Math.hypot(px - r0.cx, (py - r0.cy) / 0.85);
          var pAng = Math.atan2((py - r0.cy) / 0.85, px - r0.cx);
          var pGap = Math.min(Math.abs(((pAng - r0.gap + Math.PI * 3) % (Math.PI * 2)) - Math.PI),
                              Math.abs(((pAng - r0.gap - Math.PI + Math.PI * 3) % (Math.PI * 2)) - Math.PI));
          if (Math.abs(pr - r0.r) < 22 && pGap <= Math.PI - 0.55) { r0.hit = true; hurt(s, 11); }
        }
      }
      b.dripCd -= dt;
      if (b.dripCd <= 0 && b.state !== 'dive') {
        b.dripCd = 15;
        for (var dc = 0; dc < 3; dc++) {
          spawnKid(s, b.x + (Math.random() - 0.5) * 160, b.y + (Math.random() - 0.5) * 120, 'drip');
        }
      }

      if (b.state === 'active') {
        // he WADDLES, barely - the danmaku boss holds court. But he
        // never fires from OFF SCREEN: far away he closes at full
        // speed and holds his patterns (bullets from nowhere is the
        // doc's fairness complaint), then settles in and performs.
        var dx = px - b.x, dy = py - b.y, len = Math.hypot(dx, dy) || 1;
        if (len > 340) {
          b.x += (dx / len) * b.spd * dt; b.y += (dy / len) * b.spd * dt;
          b.stateT = Math.min(b.stateT, 0.8);
        } else if (len > 260) {
          b.x += (dx / len) * b.spd * 0.5 * dt; b.y += (dy / len) * b.spd * 0.5 * dt;
        }
        if (b.stateT > 1.1) {
          b.stateT = 0;
          // the CYCLE: spiral -> rings -> fans -> (every 2nd loop) dive
          var seq = ['spiral', 'ringTell', 'burst'];
          var nxt = seq[b.cyc % 3];
          b.cyc++;
          if (b.cyc % 7 === 0) nxt = 'dive';
          if (nxt === 'dive') {
            b.state = 'dive'; b.stateT = 0;
            b.say('DOWN THE DRAIN!', 0xa8e04a);
            b.guard = 0.25; b.noContact = true;
            b.sprite.setVisible(false); b.shadow.setVisible(false);
            b.mx = b.x; b.my = b.y;
            if (s.fx) s.fx.burst(b.x, b.y, 'fx_splash', 10, 0.5);
          } else {
            b.state = nxt; b.stateT = 0; b.emitT = 0; b.burstN = 0;
            b.say(nxt === 'spiral' ? 'GOO SPIRAL!' : nxt === 'ringTell' ? 'RIPPLE TIME!' : 'SPLAT SPLAT!', 0xa8e04a);
          }
        }
      } else if (b.state === 'spiral') {
        // TWO ARMS of fat slow blobs on a lazily turning emitter: the
        // safe lane rotates with it, wide enough to stroll through
        b.spiralA += dt * (b.enraged() ? 1.5 : 1.1);
        b.emitT -= dt;
        if (b.emitT <= 0) {
          b.emitT = 0.16;
          for (var arm = 0; arm < 2; arm++) {
            var sa = b.spiralA + arm * Math.PI;
            fireShot(b, b.x, b.y, sa, 105, 10, 0xa8e04a, 13);
          }
        }
        if (b.stateT > 3.0) { b.state = 'vent'; b.stateT = 0; b.vuln = 1.5; }
      } else if (b.state === 'ringTell') {
        ringTell(g, b.x, b.y, Math.min(1, b.stateT / 0.7), b.r + 20);
        if (b.stateT > 0.7) {
          b.rings.push({ cx: b.x, cy: b.y, r: b.r + 10, gap: Math.random() * Math.PI * 2, hit: false });
          if (!b._ring2) { b._ring2 = true; b.stateT = 0.25; }   // a second, offset
          else { b._ring2 = false; b.state = 'vent'; b.stateT = 0; b.vuln = 1.4;
                 if (PC.audio) PC.audio.splat(); }
        }
      } else if (b.state === 'burst') {
        // three aimed FANS with a step-aside beat between them
        if (b.stateT > 0.55) {
          b.stateT = 0; b.burstN++;
          var aim = Math.atan2(py - b.y, px - b.x);
          for (var f2 = -2; f2 <= 2; f2++) {
            fireShot(b, b.x, b.y, aim + f2 * 0.30, 130, 10, 0x7dd97b, 11);
          }
          if (PC.audio) PC.audio.splat();
          if (b.burstN >= 3) { b.state = 'vent'; b.stateT = 0; b.vuln = 1.5; }
        }
      } else if (b.state === 'vent') {
        // the breather: he sags and bubbles while the window is open
        if (Math.random() < dt * 6 && s.fx) s.fx.burst(b.x + (Math.random() - 0.5) * 50, b.y - 20, 'fx_splash', 1, 0.3);
        if (b.stateT > 1.5) { b.state = 'active'; b.stateT = 0; }
      } else if (b.state === 'dive') {
        var mdx = px - b.mx, mdy = py - b.my, ml = Math.hypot(mdx, mdy) || 1;
        b.mx += (mdx / ml) * 140 * dt; b.my += (mdy / ml) * 140 * dt;
        b.x = b.mx; b.y = b.my;
        var wob = 1 + Math.sin(s.now * 6) * 0.08;
        g.fillStyle(0x556b2f, 0.75); g.fillEllipse(b.mx, b.my, 110 * wob, 60 * wob);
        g.fillStyle(0x7a9b3f, 0.7); g.fillEllipse(b.mx, b.my, 78 * wob, 42 * wob);
        ringTell(g, b.mx, b.my, (b.stateT % 0.5) * 2, 70);
        if (b.stateT > 2.4) {
          b.state = 'erupt'; b.stateT = 0;
          b.guard = 1; b.noContact = false;
          b.sprite.setVisible(true); b.shadow.setVisible(true);
          var edx = px - b.mx, edy = py - b.my;
          if (edx * edx + edy * edy < 90 * 90) hurt(s, 15);
          b.splat(2, 0x7a9b3f, 'slow');
          s.cameras.main.shake(220, 0.009);
          if (s.fx) s.fx.burst(b.mx, b.my, 'fx_splash', 16, 0.6);
          b.vuln = 1.5;
        }
      } else if (b.state === 'erupt') {
        if (b.stateT > 1.5) { b.state = 'active'; b.stateT = 0; }
      }
    },
    pose: function (b) {
      if (b.state === 'vent') {
        b.sprite.setScale(b.baseS * 1.06, b.baseS * (0.88 + 0.04 * Math.sin(b.animT * 9)));
        return true;
      }
      if (b.state === 'spiral') {
        b.sprite.setAngle(Math.sin(b.animT * 3) * 5);
        b.sprite.setScale(b.baseS, b.baseS);
        return true;
      }
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
