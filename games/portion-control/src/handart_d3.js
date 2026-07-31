// handart_d3.js - procedural themed painters for the MAP 3 dessert
// roster + the LAYER CAKE COLOSSUS (v0.27.0). PixelLab credits ran out,
// so these are code-drawn to the same chunky-outline language as the
// hand pixel maps: bold silhouette, INK outline, big kid-friendly faces.
// Override order stands: real art (manifest) > these > generic blobs -
// when Mark tops up PixelLab, generated PNGs replace these file-by-file
// with zero code changes.
window.PC = window.PC || {};
(function () {
  var P = PC.PAL;
  function css(c) { return '#' + ('00000' + c.toString(16)).slice(-6); }
  var INK = css(P.INK), PINK = css(P.PINK), WHITE = css(P.WHITE);
  var CRUST = css(P.CRUST), COCOA = css(P.COCOA), CHEESE = css(P.CHEESE);
  var CHERRY = '#c93a52', CHERRY_LT = '#e86a80';
  var FROST = '#f8e7ee', FROST_LT = '#fff8fb';
  var SPRINK = ['#e05a7a', '#35d0ff', '#f2c33c', '#7ac95a'];

  function h1(i, salt) {
    var n = (i * 374761393 + (salt || 0) * 668265263) | 0;
    n = (n ^ (n >>> 13)) | 0; n = Math.imul(n, 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function sprinkles(g, cx, cy, rx, ry, n, seed) {
    for (var i = 0; i < n; i++) {
      g.fillStyle = SPRINK[i % SPRINK.length];
      g.save();
      g.translate(cx + (h1(i, seed) - 0.5) * rx * 2, cy + (h1(i, seed + 1) - 0.5) * ry * 2);
      g.rotate(h1(i, seed + 2) * 3.1);
      g.fillRect(-2, -1, 4, 2);
      g.restore();
    }
  }
  function eyes(g, x1, x2, y, r, angry) {
    g.fillStyle = WHITE;
    g.beginPath(); g.arc(x1, y, r, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(x2, y, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK;
    g.beginPath(); g.arc(x1 + r * 0.25, y + r * 0.2, r * 0.45, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(x2 - r * 0.25, y + r * 0.2, r * 0.45, 0, Math.PI * 2); g.fill();
    if (angry) {
      g.strokeStyle = INK; g.lineWidth = Math.max(2, r * 0.5); g.lineCap = 'round';
      g.beginPath(); g.moveTo(x1 - r, y - r * 1.1); g.lineTo(x1 + r * 0.8, y - r * 0.5); g.stroke();
      g.beginPath(); g.moveTo(x2 + r, y - r * 1.1); g.lineTo(x2 - r * 0.8, y - r * 0.5); g.stroke();
    }
  }

  // ---- DONUT 24: a frosted ring up on stub legs ----
  function donut(f) {
    return function (g, a) {
      var c = a.w / 2, cy = a.h / 2 - 1 + (f === 2 ? 1 : 0);
      var R = a.w * 0.38;
      g.fillStyle = INK;                              // legs
      var lo = f === 2 ? 2 : -2;
      g.fillRect(c - 6 + lo, a.h - 4, 4, 4); g.fillRect(c + 2 - lo, a.h - 4, 4, 4);
      g.fillStyle = INK;                              // outline ring
      g.beginPath(); g.arc(c, cy, R + 1.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = CRUST;
      g.beginPath(); g.arc(c, cy, R, 0, Math.PI * 2); g.fill();
      g.fillStyle = PINK;                             // frosting cap + drips
      g.beginPath(); g.arc(c, cy, R, Math.PI, Math.PI * 2); g.fill();
      g.fillRect(c - R, cy - 1, R * 2, 2);
      for (var i = 0; i < 4; i++) {
        var dx = c - R + 2 + i * (R * 2 - 4) / 3;
        g.fillRect(dx - 1, cy, 3, 3 + (i % 2) * 2);
      }
      g.fillStyle = INK;                              // the hole
      g.beginPath(); g.arc(c, cy + 1, R * 0.3, 0, Math.PI * 2); g.fill();
      sprinkles(g, c, cy - R * 0.5, R * 0.8, R * 0.34, 5, 3);
      eyes(g, c - R * 0.42, c + R * 0.42, cy - R * 0.44, 2.4, true);
    };
  }
  function donutStill(g, a) {
    var c = a.w / 2, cy = a.h - 7;
    g.fillStyle = INK;
    g.beginPath(); g.ellipse(c, cy, a.w * 0.42, 5.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = CRUST;
    g.beginPath(); g.ellipse(c, cy, a.w * 0.38, 4.4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = PINK;
    g.beginPath(); g.ellipse(c, cy - 1, a.w * 0.3, 3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = INK;
    g.beginPath(); g.ellipse(c, cy, a.w * 0.1, 1.6, 0, 0, Math.PI * 2); g.fill();
    sprinkles(g, c, cy - 2, a.w * 0.26, 2, 4, 5);
  }

  // ---- CHIP BIT 16: a scurrying cookie chunk ----
  function chip(f) {
    return function (g, a) {
      var c = a.w / 2, cy = a.h / 2 + (f === 2 ? 1 : 0);
      g.fillStyle = INK;
      var lo = f === 2 ? 1.5 : -1.5;
      g.fillRect(c - 4 + lo, a.h - 3, 3, 3); g.fillRect(c + 1 - lo, a.h - 3, 3, 3);
      g.fillStyle = INK;
      g.beginPath(); g.arc(c, cy, 6.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = CRUST;
      g.beginPath(); g.arc(c, cy, 5.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = CHEESE;
      g.beginPath(); g.arc(c - 1.6, cy - 1.6, 2.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = COCOA;                            // choc chips
      g.fillRect(c - 4, cy + 1, 2, 2); g.fillRect(c + 2, cy - 3, 2, 2);
      eyes(g, c - 2.2, c + 2.2, cy - 0.6, 1.5, false);
    };
  }
  function chipStill(g, a) {
    var c = a.w / 2, cy = a.h - 4;
    g.fillStyle = INK;
    g.beginPath(); g.ellipse(c, cy, 6.6, 3, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = CRUST;
    g.beginPath(); g.ellipse(c, cy, 5.4, 2.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = COCOA; g.fillRect(c - 3, cy - 1, 2, 2); g.fillRect(c + 1, cy - 1, 2, 2);
  }

  // ---- CUPCAKE 32: crinkle liner + towering swirl + cherry ----
  function cupcake(f) {
    return function (g, a) {
      var c = a.w / 2, lean = f === 2 ? 1.5 : -1.5;
      var ly = a.h - 13;                              // liner top
      g.fillStyle = INK;                              // feet
      g.fillRect(c - 7 - lean, a.h - 3, 5, 3); g.fillRect(c + 2 + lean, a.h - 3, 5, 3);
      g.fillStyle = INK;                              // liner outline
      g.beginPath();
      g.moveTo(c - 11, ly); g.lineTo(c + 11, ly);
      g.lineTo(c + 8, a.h - 2); g.lineTo(c - 8, a.h - 2);
      g.closePath(); g.fill();
      g.fillStyle = css(P.MUSTARD);
      g.beginPath();
      g.moveTo(c - 9.6, ly + 1.4); g.lineTo(c + 9.6, ly + 1.4);
      g.lineTo(c + 6.8, a.h - 3.2); g.lineTo(c - 6.8, a.h - 3.2);
      g.closePath(); g.fill();
      g.fillStyle = CRUST;                            // crinkle stripes
      for (var i = -2; i <= 2; i++) g.fillRect(c + i * 4 - 1, ly + 2, 2, a.h - ly - 5);
      // frosting swirl: three stacked bulges, leaning with the step
      g.save(); g.translate(c, ly); g.rotate(lean * 0.045);
      g.fillStyle = INK;
      g.beginPath(); g.ellipse(0, -3, 12.4, 5.4, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(0, -9, 9.4, 4.9, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(0, -14.4, 6.4, 4.4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = PINK;
      g.beginPath(); g.ellipse(0, -3, 11, 4.2, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(0, -9, 8, 3.7, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = FROST;
      g.beginPath(); g.ellipse(0, -14.4, 5, 3.2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = FROST_LT;
      g.beginPath(); g.ellipse(-2, -15.4, 2.4, 1.5, 0, 0, Math.PI * 2); g.fill();
      // cherry
      g.fillStyle = INK;
      g.beginPath(); g.arc(0, -19.4, 3.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = CHERRY;
      g.beginPath(); g.arc(0, -19.4, 2.7, 0, Math.PI * 2); g.fill();
      g.fillStyle = CHERRY_LT;
      g.beginPath(); g.arc(-1, -20.2, 1.1, 0, Math.PI * 2); g.fill();
      sprinkles(g, 0, -8, 8, 5, 5, 7);
      eyes(g, -4, 4, -8.4, 2.2, true);
      g.fillStyle = INK; g.fillRect(-2, -4.4, 4, 1.6);   // grump mouth
      g.restore();
    };
  }
  function cupcakeStill(g, a) {
    var c = a.w / 2, cy = a.h - 6;
    g.fillStyle = INK;
    g.beginPath(); g.ellipse(c, cy, 12, 4.4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = PINK;
    g.beginPath(); g.ellipse(c, cy, 10.6, 3.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = FROST;
    g.beginPath(); g.ellipse(c - 2, cy - 1, 5, 1.8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = CHERRY;
    g.beginPath(); g.arc(c + 7, cy - 2, 2.6, 0, Math.PI * 2); g.fill();
    sprinkles(g, c, cy, 8, 2.4, 4, 9);
  }

  // ---- FROSTING SLUDGE 48: a melting grinning glob ----
  function sludge(f) {
    return function (g, a) {
      var c = a.w / 2, sq = f === 2 ? 0.92 : 1.02;
      var base = a.h - 5, hh = 30 * sq;
      g.save(); g.translate(c, base); g.scale(1 + (1 - sq) * 0.8, sq);
      g.fillStyle = INK;
      g.beginPath();
      g.moveTo(-20, 0);
      g.bezierCurveTo(-22, -hh * 0.8, -10, -hh - 4, 0, -hh - 4);
      g.bezierCurveTo(10, -hh - 4, 22, -hh * 0.8, 20, 0);
      g.closePath(); g.fill();
      g.fillStyle = FROST;
      g.beginPath();
      g.moveTo(-18, -1.6);
      g.bezierCurveTo(-20, -hh * 0.8, -9, -hh - 2, 0, -hh - 2);
      g.bezierCurveTo(9, -hh - 2, 20, -hh * 0.8, 18, -1.6);
      g.closePath(); g.fill();
      g.fillStyle = PINK;                             // melty skirt
      for (var i = 0; i < 5; i++) {
        var dx = -16 + i * 8;
        g.beginPath(); g.ellipse(dx, -3, 4.4, 5 + (i % 2) * 3, 0, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = FROST_LT;
      g.beginPath(); g.ellipse(-6, -hh * 0.78, 6, 4, -0.4, 0, Math.PI * 2); g.fill();
      // sprinkles on the SHOULDERS, off the face (judge: face confetti
      // read as whiskers at small size)
      sprinkles(g, -13, -hh * 0.4, 4, 4, 3, 11);
      sprinkles(g, 13, -hh * 0.42, 4, 4, 3, 12);
      eyes(g, -6.5, 6.5, -hh * 0.62, 3.2, true);
      g.fillStyle = INK;                              // wide wobbly grin
      g.beginPath();
      g.moveTo(-8, -hh * 0.36);
      g.quadraticCurveTo(0, -hh * 0.2, 8, -hh * 0.36);
      g.quadraticCurveTo(0, -hh * 0.28, -8, -hh * 0.36);
      g.fill();
      g.restore();
    };
  }
  function sludgeStill(g, a) {
    var c = a.w / 2, cy = a.h - 8;
    g.fillStyle = INK;
    g.beginPath(); g.ellipse(c, cy, 20, 7, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = FROST;
    g.beginPath(); g.ellipse(c, cy, 18, 5.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = PINK;
    g.beginPath(); g.ellipse(c - 6, cy + 1, 6, 2.6, 0, 0, Math.PI * 2); g.fill();
    sprinkles(g, c, cy, 13, 3.4, 6, 13);
  }

  // ---- COOKIE GOLEMITE 48: a lumbering two-scoop cookie bruiser ----
  function golem(f) {
    return function (g, a) {
      var c = a.w / 2, arm = f === 2 ? 3 : -3;
      var by = a.h - 16;                              // body centre
      g.fillStyle = INK;                              // feet
      g.fillRect(c - 11, a.h - 5, 8, 5); g.fillRect(c + 3, a.h - 5, 8, 5);
      // crumb fists swing with the step
      g.fillStyle = INK;
      g.beginPath(); g.arc(c - 19, by + arm, 6.4, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(c + 19, by - arm, 6.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = CRUST;
      g.beginPath(); g.arc(c - 19, by + arm, 5.2, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(c + 19, by - arm, 5.2, 0, Math.PI * 2); g.fill();
      // body cookie
      g.fillStyle = INK;
      g.beginPath(); g.arc(c, by, 14.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = CRUST;
      g.beginPath(); g.arc(c, by, 13.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#d8a058';                        // toasted highlight
      g.beginPath(); g.arc(c - 4, by - 4, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = COCOA;                            // body chips
      g.fillRect(c - 9, by + 3, 4, 4); g.fillRect(c + 5, by - 2, 4, 4);
      g.fillRect(c - 2, by + 7, 3, 3);
      // head cookie
      var hy = by - 17;
      g.fillStyle = INK;
      g.beginPath(); g.arc(c, hy, 9.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = CRUST;
      g.beginPath(); g.arc(c, hy, 8.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = COCOA;
      g.fillRect(c - 6, hy - 4, 3, 3); g.fillRect(c + 4, hy + 2, 3, 3);
      eyes(g, c - 3.4, c + 3.4, hy - 0.6, 2.2, true);
      g.fillStyle = INK; g.fillRect(c - 2, hy + 4, 4, 1.6);
    };
  }
  function golemStill(g, a) {
    var c = a.w / 2, cy = a.h - 9;
    g.fillStyle = INK;
    g.beginPath(); g.ellipse(c, cy, 19, 7, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = CRUST;
    g.beginPath(); g.ellipse(c, cy, 17.4, 5.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = COCOA;
    g.fillRect(c - 10, cy - 2, 4, 4); g.fillRect(c + 2, cy - 1, 4, 4); g.fillRect(c - 3, cy + 1, 3, 3);
    g.fillStyle = '#d8a058';
    g.beginPath(); g.arc(c + 10, cy - 2, 4, 0, Math.PI * 2); g.fill();
  }

  // ---- THE LAYER CAKE COLOSSUS 128: three tiers of trouble ----
  // pose: 'walk' t 0..3 | 'rear' t 0..1 | 'lunge' t 0..1
  function cake(pose, t) {
    return function (g, a) {
      var W = a.w, c = W / 2;
      var lean = 0, rise = 0, shear = 0, armY = 0, armOut = 0, mouthOpen = false;
      if (pose === 'walk') {
        lean = [-3, 0, 3, 0][t];
        rise = [0, -2, 0, -2][t];
      } else if (pose === 'rear') {
        rise = t ? -8 : -5; armY = t ? -26 : -18; mouthOpen = true;
      } else {                                        // lunge
        shear = t ? 16 : 10; rise = 3; armOut = t ? 14 : 8; mouthOpen = true;
      }
      var base = a.h - 8 + rise;
      // feet
      g.fillStyle = INK;
      g.fillRect(c - 30 + lean, a.h - 10, 20, 10);
      g.fillRect(c + 10 + lean, a.h - 10, 20, 10);
      g.fillStyle = FROST;
      g.fillRect(c - 28 + lean, a.h - 9, 16, 6); g.fillRect(c + 12 + lean, a.h - 9, 16, 6);
      // tier painter: plate of cake + frosting scallop + drips
      function tier(cx2, y, w2, h3) {
        g.fillStyle = INK;
        g.fillRect(cx2 - w2 / 2 - 2, y - 2, w2 + 4, h3 + 4);
        g.fillStyle = PINK;
        g.fillRect(cx2 - w2 / 2, y, w2, h3);
        g.fillStyle = CHERRY_LT;                       // jam stripe
        g.fillRect(cx2 - w2 / 2, y + h3 * 0.55, w2, 3);
        g.fillStyle = FROST;                           // scallop cap
        var n = Math.floor(w2 / 12);
        for (var i = 0; i <= n; i++) {
          g.beginPath();
          g.arc(cx2 - w2 / 2 + i * (w2 / n), y + 2, 7, 0, Math.PI * 2); g.fill();
        }
        g.fillRect(cx2 - w2 / 2, y - 4, w2, 7);
        g.fillStyle = FROST;                           // drips
        for (i = 0; i < 4; i++) {
          var dx = cx2 - w2 / 2 + 6 + h1(i, w2) * (w2 - 12);
          g.fillRect(dx, y + 3, 5, 6 + h1(i, w2 + 1) * 6);
        }
      }
      var b1 = base - 34, b2 = b1 - 30, b3 = b2 - 24;
      tier(c + lean, b1, 96, 34);
      tier(c + lean + shear * 0.5, b2, 70, 30);
      tier(c + lean + shear, b3, 46, 24);
      // candles on the bottom + mid tier edges
      var candles = [[c - 40, b1], [c + 40, b1], [c - 26, b2], [c + 26, b2]];
      for (var ci = 0; ci < candles.length; ci++) {
        var kx = candles[ci][0] + lean + (ci >= 2 ? shear * 0.5 : 0);
        var ky = candles[ci][1];
        g.fillStyle = ci % 2 ? '#35d0ff' : '#f2c33c';
        g.fillRect(kx - 2, ky - 12, 5, 12);
        g.fillStyle = INK; g.fillRect(kx - 2, ky - 12, 5, 1);
        g.fillStyle = '#ffd977';
        g.beginPath(); g.ellipse(kx + 0.5, ky - 15, 2.6, 4, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff6e0';
        g.beginPath(); g.ellipse(kx + 0.5, ky - 14, 1.2, 2, 0, 0, Math.PI * 2); g.fill();
      }
      // frosting arms off the middle tier
      var ax = 44, ay = b2 + 12 + armY;
      g.fillStyle = INK;
      g.beginPath(); g.arc(c - ax + lean - armOut * 0.3, ay, 10.4, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(c + ax + lean + shear * 0.6 + armOut, ay, 10.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = FROST;
      g.beginPath(); g.arc(c - ax + lean - armOut * 0.3, ay, 9, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(c + ax + lean + shear * 0.6 + armOut, ay, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = PINK;
      g.beginPath(); g.arc(c - ax + lean - armOut * 0.3, ay + 3, 4.4, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(c + ax + lean + shear * 0.6 + armOut, ay + 3, 4.4, 0, Math.PI * 2); g.fill();
      // the face lives on the middle tier
      var fx = c + lean + shear * 0.5, fy = b2 + 13;
      eyes(g, fx - 12, fx + 12, fy - 2, 4.6, true);
      g.fillStyle = INK;
      if (mouthOpen) {
        g.beginPath(); g.ellipse(fx, fy + 10, 9, 6.4, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = CHERRY;
        g.beginPath(); g.ellipse(fx, fy + 12, 5, 2.6, 0, 0, Math.PI * 2); g.fill();
      } else {
        g.beginPath();
        g.moveTo(fx - 9, fy + 11);
        g.quadraticCurveTo(fx, fy + 6, fx + 9, fy + 11);
        g.quadraticCurveTo(fx, fy + 9, fx - 9, fy + 11);
        g.fill();
      }
      // the summit cherry - the crown
      var chx = c + lean + shear, chy = b3 - 12;
      g.strokeStyle = COCOA; g.lineWidth = 3;
      g.beginPath(); g.moveTo(chx, chy - 6); g.quadraticCurveTo(chx + 6, chy - 16, chx + 10, chy - 18); g.stroke();
      g.fillStyle = INK;
      g.beginPath(); g.arc(chx, chy, 11.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = CHERRY;
      g.beginPath(); g.arc(chx, chy, 10, 0, Math.PI * 2); g.fill();
      g.fillStyle = CHERRY_LT;
      g.beginPath(); g.arc(chx - 3.4, chy - 3.4, 4, 0, Math.PI * 2); g.fill();
      sprinkles(g, c + lean, b1 + 16, 42, 10, 8, 17);
      sprinkles(g, c + lean + shear * 0.5, b2 + 14, 30, 8, 6, 19);
    };
  }

  // ---- registry ----
  var H = PC.HANDART = PC.HANDART || {};
  H['enemy_d3_donut_walk_1'] = donut(1);
  H['enemy_d3_donut_walk_2'] = donut(2);
  H['still_d3_donut'] = donutStill;
  H['enemy_d3_chip_bit_walk_1'] = chip(1);
  H['enemy_d3_chip_bit_walk_2'] = chip(2);
  H['still_d3_chip_bit'] = chipStill;
  H['enemy_d3_cupcake_walk_1'] = cupcake(1);
  H['enemy_d3_cupcake_walk_2'] = cupcake(2);
  H['still_d3_cupcake'] = cupcakeStill;
  H['enemy_d3_sludge_walk_1'] = sludge(1);
  H['enemy_d3_sludge_walk_2'] = sludge(2);
  H['still_d3_sludge'] = sludgeStill;
  H['enemy_d3_golemite_walk_1'] = golem(1);
  H['enemy_d3_golemite_walk_2'] = golem(2);
  H['still_d3_golemite'] = golemStill;
  H['boss_d3_cake_walk_1'] = cake('walk', 0);
  H['boss_d3_cake_walk_2'] = cake('walk', 1);
  H['boss_d3_cake_walk_3'] = cake('walk', 2);
  H['boss_d3_cake_walk_4'] = cake('walk', 3);
  H['boss_d3_cake_rear_1'] = cake('rear', 0);
  H['boss_d3_cake_rear_2'] = cake('rear', 1);
  H['boss_d3_cake_lunge_1'] = cake('lunge', 0);
  H['boss_d3_cake_lunge_2'] = cake('lunge', 1);
})();
