// handart.js - hand-authored pixel maps for the sprites the player stares
// at, painted into the atlas until PixelLab art replaces them (manifest
// override wins over these, these win over generic placeholders).
// Legend chars map to the 16-color palette only (L4 law).
window.PC = window.PC || {};
(function () {
  var P = PC.PAL;
  var LEGEND = {
    'K': P.INK, 'H': P.COCOA, 'F': P.CRUST, 'C': P.CYAN, 'L': P.CLOUD,
    'W': P.WHITE, 'G': P.GRAPE, 'S': P.STEEL, 'B': P.CYAN, 'M': P.MUSTARD,
    'R': P.KETCHUP, 'E': P.CHEESE, 'T': P.MINT, 'P': P.PINK,
  };

  // ---- DANNY 32x32, facing east, Resizer arm always extended (Mark:
  // "the character should always be firing / actively engaging") ----
  // White coat dominant, spiky hair, cyan goggle band, steel gun + cyan tip.
  var DANNY_TOP = [
    '.......K..KK..K.................',
    '......KHKKHHKKHK................',
    '.....KHHHHHHHHHHK...............',
    '....KHHHHHHHHHHHHK..............',
    '....KHHHHHHHHHHHHK..............',
    '....KKCCCCCCCCCCKK..............',
    '....KCLLCCCCCLLCCK..............',
    '....KFFFFFFFFFFFFK..............',
    '....KFKKFFFFFFKKFK..............',
    '....KFKKFFFFFFKKFK..............',
    '....KFFFFFFFFFFFFK..............',
    '....KFFKWWWWWWKFFK..............',
    '....KFFFKKKKKKFFFK..............',
    '.....KFFFFFFFFFFK...............',
    '......KKFFFFFFKK................',
    '.....KWWWWWWWWWWK...............',
    '....KWWWWWGGWWWWWKKK............',
    '...KWWWWWWGGWWWWWWWWKKKKK.......',
    '...KWWWWWWGGWWWWWFFKSSSBBK......',
    '...KWWWWWWGGWWWWWWWWKKKKK.......',
    '...KWWWWWWGGWWWWWKKK............',
    '...KWWWWWWWWWWWWK...............',
    '....KWWWWWWWWWWK................',
  ];
  // legs: 4-frame cycle - stride / together(squash) / stride(other) / together
  var DANNY_LEGS = [
    [ '....KGGKKKKKKGGK................',
      '...KSSSK....KSSSK...............',
      '..KSSSSK....KSSSSK..............',
      '..KKKKK......KKKKK..............',
    ],
    [ '.....KGGKKKKGGK.................',
      '.....KSSSKKSSSK.................',
      '.....KSSSKKSSSK.................',
      '.....KKKK..KKKK.................',
    ],
    [ '....KGGKKKKKKGGK................',
      '..KSSSK......KSSSK..............',
      '.KSSSSK......KSSSSK.............',
      '.KKKKK........KKKKK.............',
    ],
    [ '.....KGGKKKKGGK.................',
      '.....KSSSKKSSSK.................',
      '.....KSSSKKSSSK.................',
      '.....KKKK..KKKK.................',
    ],
  ];

  function dannyFrame(i) {
    // squash frames (2 & 4) sit 1px lower for the walk wobble
    var pad = (i === 2 || i === 4) ? ['................................'] : [];
    var rows = pad.concat(DANNY_TOP, DANNY_LEGS[i - 1]);
    while (rows.length < 32) rows.unshift('................................');
    return rows.slice(-32);
  }

  // ---- FRY TROOPER 24x24: red carton, mustard fries, goofy face ----
  var FRY_A = [
    '........................',
    '....M..MM..M..MM........',
    '...KMK.KMK.KMKKMK.......',
    '...KMKKKMKKKMKKMK.......',
    '..KKMMMMMMMMMMMMKK......',
    '..KRRRRRRRRRRRRRRK......',
    '..KRRRRRRRRRRRRRRK......',
    '..KRRKKRRRRRRKKRRK......',
    '..KRRKKRRRRRRKKRRK......',
    '..KRRRRRRRRRRRRRRK......',
    '..KRRRKKKKKKKKRRRK......',
    '..KRRRKWWKKWWKRRRK......',
    '..KRRRRKKKKKKRRRRK......',
    '..KRRRRRRRRRRRRRRK......',
    '...KRRRRRRRRRRRRK.......',
    '...KKRRRRRRRRRRKK.......',
    '....KKKK....KKKK........',
    '........................',
  ];
  var FRY_B = [
    '........................',
    '........................',
    '.....MM..M..MM..M.......',
    '....KMK.KMK.KMK.KMK.....',
    '..KKMMMMMMMMMMMMKK......',
    '..KRRRRRRRRRRRRRRK......',
    '..KRRRRRRRRRRRRRRK......',
    '..KRRKKRRRRRRKKRRK......',
    '..KRRKKRRRRRRKKRRK......',
    '..KRRRRRRRRRRRRRRK......',
    '..KRRRKKKKKKKKRRRK......',
    '..KRRRKWWKKWWKRRRK......',
    '..KRRRRKKKKKKRRRRK......',
    '..KRRRRRRRRRRRRRRK......',
    '...KRRRRRRRRRRRRK.......',
    '...KKRRRRRRRRRRKK.......',
    '......KKKKKKKK..........',
    '........................',
  ];
  var FRY_STILL = [   // harmless fries, no face
    '........................',
    '......M.MM.M.M..........',
    '.....KMKKMKKMKK.........',
    '....KKMMMMMMMKK.........',
    '....KRRRRRRRRRK.........',
    '....KRRRRRRRRRK.........',
    '....KRRRRRRRRRK.........',
    '.....KKKKKKKKK..........',
    '........................',
  ];

  function pad(rows, w, h) {
    var out = [], i, r;
    for (i = 0; i < rows.length; i++) {
      r = rows[i];
      while (r.length < w) r += '.';
      out.push(r.slice(0, w));
    }
    while (out.length < h) out.push(new Array(w + 1).join('.'));
    return out.slice(0, h);
  }

  function painter(rows) {
    return function (g, a) {
      var m = pad(rows, a.w, a.h);
      for (var y = 0; y < a.h; y++) {
        for (var x = 0; x < a.w; x++) {
          var ch = m[y].charAt(x);
          if (ch === '.' || ch === ' ') continue;
          var c = LEGEND[ch]; if (c == null) continue;
          g.fillStyle = '#' + ('00000' + c.toString(16)).slice(-6);
          g.fillRect(x, y, 1, 1);
        }
      }
    };
  }

  // portrait: head rows of the Danny map scaled 4x = chunky 96px pixel art
  function portraitPainter(rows, srcW) {
    return function (g, a) {
      var m = pad(rows, srcW, rows.length);
      var sc = Math.floor(a.w / srcW) || 1;
      var oy = Math.floor((a.h - rows.length * sc) / 2);
      for (var y = 0; y < rows.length; y++) {
        for (var x = 0; x < srcW; x++) {
          var ch = m[y].charAt(x);
          if (ch === '.' || ch === ' ') continue;
          var c = LEGEND[ch]; if (c == null) continue;
          g.fillStyle = '#' + ('00000' + c.toString(16)).slice(-6);
          g.fillRect(x * sc, oy + y * sc, sc, sc);
        }
      }
    };
  }

  PC.HANDART = {
    'char_danny_walk_1': painter(dannyFrame(1)),
    'char_danny_walk_2': painter(dannyFrame(2)),
    'char_danny_walk_3': painter(dannyFrame(3)),
    'char_danny_walk_4': painter(dannyFrame(4)),
    'portrait_danny': portraitPainter(DANNY_TOP.slice(0, 15).map(function (r) { return r.slice(3, 22); }), 19),
    'enemy_d1_fry_walk_1': painter(FRY_A),
    'enemy_d1_fry_walk_2': painter(FRY_B),
    'still_d1_fry': painter(FRY_STILL),
  };
})();
