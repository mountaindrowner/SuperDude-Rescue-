// sprites.js - hand-coded pixel art and a bitmap font, rendered to offscreen
// canvases once at boot. Every sprite is referenced by name elsewhere, so the
// art here can later be swapped for final PNG assets without touching gameplay.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var sprites = {};

  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function px(g, x, y, w, h, col) { if (!col) return; g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function flip(src) {
    var c = cv(src.width, src.height), g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
    return c;
  }

  // ---- palette ----
  var C = {
    out: '#1a1626', skin: '#f2c089', skinD: '#cf9a63', hair: '#46301c',
    capR: '#d83c30', capD: '#9c241c', coat: '#f3f4fb', coatD: '#b9bdcf',
    shirt: '#1d1b29', atom: '#ffd23a', lens: '#cdebff',
    jean: '#3a5bd0', jeanD: '#27408f', shoe: '#2b2733', watch: '#ffe070',
    shA: '#3a2f5c', shB: '#251d3e', shEye: '#ff7fae',
    wiA: '#7b5fb6', wiB: '#b79ce8', wiEye: '#fff2ff',
    thA: '#46365f', thB: '#2c2240', thEye: '#ff5d5d',
    orbA: '#8a36a0', orbB: '#d27ce6',
    bl1: '#ffffff', bl2: '#fff09a', bl3: '#ffae3a',
    grass: '#86cf45', grassD: '#57983a', dirt: '#bb7a40', dirtD: '#8c5328',
    brick: '#cda072', brickD: '#9b7344', mortar: '#7a5630',
    qA: '#ffc63c', qB: '#dc9320', qC: '#8d6c44', metal: '#9aa6c2', metalD: '#5d6884',
    core: '#46f0ff', coreD: '#1aa7ca', coreL: '#e6ffff',
    growA: '#ff8a30', growB: '#ffd060', growL: '#ffffff',
    gear: '#cdd6e6', gearD: '#7d889c', glow: '#9bf0ff',
    skyU: '#9fd8ff', skyL: '#dff3ff', white: '#ffffff', black: '#000000'
  };

  // ================= bitmap font (5x7) =================
  var F = {
    'A': [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
    'B': ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '],
    'C': [' ####', '#    ', '#    ', '#    ', '#    ', '#    ', ' ####'],
    'D': ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '],
    'E': ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
    'F': ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#    '],
    'G': [' ####', '#    ', '#    ', '#  ##', '#   #', '#   #', ' ####'],
    'H': ['#   #', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
    'I': ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '#####'],
    'J': ['#####', '   # ', '   # ', '   # ', '   # ', '#  # ', ' ##  '],
    'K': ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'],
    'L': ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
    'M': ['#   #', '## ##', '# # #', '# # #', '#   #', '#   #', '#   #'],
    'N': ['#   #', '##  #', '# # #', '# # #', '#  ##', '#   #', '#   #'],
    'O': [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
    'P': ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '],
    'Q': [' ### ', '#   #', '#   #', '#   #', '# # #', '#  # ', ' ## #'],
    'R': ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
    'S': [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
    'T': ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
    'U': ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
    'V': ['#   #', '#   #', '#   #', '#   #', '#   #', ' # # ', '  #  '],
    'W': ['#   #', '#   #', '#   #', '# # #', '# # #', '## ##', '#   #'],
    'X': ['#   #', '#   #', ' # # ', '  #  ', ' # # ', '#   #', '#   #'],
    'Y': ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  ', '  #  '],
    'Z': ['#####', '    #', '   # ', '  #  ', ' #   ', '#    ', '#####'],
    '0': [' ### ', '#   #', '#  ##', '# # #', '##  #', '#   #', ' ### '],
    '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
    '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'],
    '3': ['#####', '   # ', '  #  ', '   # ', '    #', '#   #', ' ### '],
    '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # ', '   # '],
    '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
    '6': [' ### ', '#    ', '#    ', '#### ', '#   #', '#   #', ' ### '],
    '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '],
    '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '],
    '9': [' ### ', '#   #', '#   #', ' ####', '    #', '    #', ' ### '],
    ' ': ['     ', '     ', '     ', '     ', '     ', '     ', '     '],
    '.': ['     ', '     ', '     ', '     ', '     ', ' ##  ', ' ##  '],
    ',': ['     ', '     ', '     ', '     ', ' ##  ', ' ##  ', ' #   '],
    '!': ['  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '     ', '  #  '],
    '?': [' ### ', '#   #', '    #', '   # ', '  #  ', '     ', '  #  '],
    ':': ['     ', ' ##  ', ' ##  ', '     ', ' ##  ', ' ##  ', '     '],
    '-': ['     ', '     ', '     ', '#####', '     ', '     ', '     '],
    '/': ['    #', '    #', '   # ', '  #  ', ' #   ', '#    ', '#    '],
    "'": ['  #  ', '  #  ', '  #  ', '     ', '     ', '     ', '     '],
    '(': ['   # ', '  #  ', ' #   ', ' #   ', ' #   ', '  #  ', '   # '],
    ')': [' #   ', '  #  ', '   # ', '   # ', '   # ', '  #  ', ' #   '],
    '+': ['     ', '  #  ', '  #  ', '#####', '  #  ', '  #  ', '     '],
    '*': ['     ', '# # #', ' ### ', '#####', ' ### ', '# # #', '     '],
    '%': ['##  #', '##  #', '   # ', '  #  ', ' #   ', '#  ##', '#  ##'],
    '&': [' ##  ', '#  # ', '#  # ', ' ##  ', '#  # ', '#  # ', ' ## #'],
    '>': ['#    ', ' #   ', '  #  ', '   # ', '  #  ', ' #   ', '#    ']
  };

  function glyphWidth() { return 5; }
  function textWidth(str, scale) { scale = scale || 1; return str.length * 6 * scale - scale; }

  function text(g, str, x, y, color, scale, align) {
    scale = scale || 1;
    str = ('' + str).toUpperCase();
    var w = textWidth(str, scale);
    if (align === 'center') x = Math.round(x - w / 2);
    else if (align === 'right') x = Math.round(x - w);
    x = x | 0; y = y | 0;
    g.fillStyle = color;
    for (var i = 0; i < str.length; i++) {
      var gl = F[str[i]] || F['?'];
      var cx = x + i * 6 * scale;
      for (var r = 0; r < 7; r++) {
        var row = gl[r];
        for (var c = 0; c < 5; c++) {
          if (row[c] === '#') g.fillRect(cx + c * scale, y + r * scale, scale, scale);
        }
      }
    }
  }

  // text with a 1px (scaled) drop shadow - used for titles / HUD.
  function textShadow(g, str, x, y, color, shadow, scale, align) {
    scale = scale || 1;
    text(g, str, x + scale, y + scale, shadow, scale, align);
    text(g, str, x, y, color, scale, align);
  }

  // ================= Danny =================
  function paintHead(g, oy) {
    px(g, 5, oy, 7, 2, C.capR);
    px(g, 6, oy - 1 < 0 ? 0 : oy - 1, 5, 1, C.capR);
    px(g, 4, oy + 2, 8, 1, C.capR);
    px(g, 2, oy + 2, 3, 2, C.capR);          // backwards brim
    px(g, 2, oy + 4, 3, 1, C.capD);
    px(g, 11, oy + 3, 1, 4, C.hair);         // hair at back
    px(g, 5, oy + 3, 6, 5, C.skin);
    px(g, 11, oy + 4, 1, 2, C.skin);
    px(g, 5, oy + 4, 7, 1, C.out);           // glasses frame
    px(g, 6, oy + 4, 1, 1, C.lens);
    px(g, 9, oy + 4, 1, 1, C.lens);
    px(g, 10, oy + 5, 1, 1, C.skinD);        // nose
    px(g, 5, oy + 6, 7, 2, C.hair);          // beard
    px(g, 7, oy + 6, 2, 1, C.skinD);         // mouth
  }

  function legParams(frame) {
    if (frame === 'walk1') return { lx: 3, rx: 10, lsh: 2, rsh: 10 };
    if (frame === 'walk2') return { lx: 5, rx: 8, lsh: 4, rsh: 8 };
    return { lx: 4, rx: 9, lsh: 3, rsh: 9 };
  }

  function paintDannySmall(g, frame) {
    paintHead(g, 0);
    px(g, 7, 8, 3, 1, C.skinD);               // neck
    px(g, 4, 8, 8, 4, C.coat);                // coat torso
    px(g, 7, 8, 3, 3, C.shirt);               // shirt
    px(g, 8, 9, 1, 1, C.atom);
    px(g, 6, 8, 1, 4, C.coatD);
    px(g, 10, 8, 1, 4, C.coatD);
    if (frame === 'jump') {
      px(g, 3, 6, 1, 3, C.coat); px(g, 12, 6, 1, 3, C.coat);
      px(g, 3, 5, 1, 1, C.skin); px(g, 12, 5, 1, 1, C.skin);
    } else if (frame === 'blast') {
      px(g, 3, 9, 1, 3, C.coat); px(g, 3, 12, 1, 1, C.skin);
      px(g, 12, 9, 2, 1, C.coat); px(g, 14, 9, 1, 1, C.skin);
      px(g, 12, 8, 1, 1, C.watch);
    } else {
      px(g, 3, 8, 1, 4, C.coat); px(g, 12, 8, 1, 4, C.coat);
      px(g, 3, 12, 1, 1, C.skin); px(g, 12, 12, 1, 1, C.skin);
      px(g, 3, 11, 1, 1, C.watch);
    }
    var L = legParams(frame);
    px(g, L.lx, 12, 3, 3, C.jean); px(g, L.rx, 12, 3, 3, C.jean);
    px(g, L.lx, 13, 1, 2, C.jeanD); px(g, L.rx + 2, 13, 1, 2, C.jeanD);
    px(g, L.lsh, 15, 4, 1, C.shoe); px(g, L.rsh, 15, 4, 1, C.shoe);
  }

  function paintDannyBig(g, frame) {
    paintHead(g, 2);
    px(g, 6, 10, 4, 1, C.skinD);              // neck
    px(g, 3, 10, 11, 13, C.coat);             // coat torso
    px(g, 6, 10, 4, 9, C.shirt);              // shirt
    px(g, 7, 13, 2, 2, C.atom);
    px(g, 5, 10, 1, 13, C.coatD);
    px(g, 10, 10, 1, 13, C.coatD);
    if (frame === 'jump') {
      px(g, 2, 7, 2, 5, C.coat); px(g, 12, 7, 2, 5, C.coat);
      px(g, 2, 6, 2, 1, C.skin); px(g, 12, 6, 2, 1, C.skin);
    } else if (frame === 'blast') {
      px(g, 2, 12, 2, 7, C.coat); px(g, 2, 19, 2, 2, C.skin);
      px(g, 13, 13, 3, 2, C.coat); px(g, 16, 13, 1, 2, C.skin);
      px(g, 13, 12, 1, 1, C.watch);
    } else {
      px(g, 2, 12, 2, 8, C.coat); px(g, 12, 12, 2, 8, C.coat);
      px(g, 2, 20, 2, 2, C.skin); px(g, 12, 20, 2, 2, C.skin);
      px(g, 2, 19, 2, 1, C.watch);
    }
    var s = frame === 'walk1' ? 1 : (frame === 'walk2' ? -1 : 0);
    px(g, 3 + s, 23, 4, 7, C.jean); px(g, 9 - s, 23, 4, 7, C.jean);
    px(g, 3 + s, 25, 1, 4, C.jeanD); px(g, 11 - s, 25, 1, 4, C.jeanD);
    px(g, 2 + s, 30, 5, 2, C.shoe); px(g, 9 - s, 30, 5, 2, C.shoe);
  }

  // ================= enemies =================
  function paintWalker(g, frame) {
    var sq = frame === 1 ? 1 : 0;             // squish frame
    var top = 3 + sq, h = 9 - sq;
    px(g, 1, top + 1, 12, h - 1, C.shB);
    px(g, 2, top, 10, h, C.shA);
    px(g, 0, 11, 14, 1, C.shB);               // base shadow
    // feet
    px(g, 2, 12 - sq, 3, 1, C.shB); px(g, 9, 12 - sq, 3, 1, C.shB);
    // eyes (cute)
    px(g, 4, top + 2, 2, 2, C.white); px(g, 9, top + 2, 2, 2, C.white);
    px(g, 5, top + 3, 1, 1, C.shB); px(g, 10, top + 3, 1, 1, C.shB);
    px(g, 5, top + 5, 4, 1, C.shEye);         // little smile
  }

  function paintWisp(g, frame) {
    var bob = frame === 1 ? 1 : 0;
    px(g, 3, 0 + bob, 6, 2, C.wiB);
    px(g, 2, 2 + bob, 8, 6, C.wiA);
    px(g, 1, 4 + bob, 10, 3, C.wiA);
    // wavy tail
    px(g, 2, 8 + bob, 2, 2, C.wiA); px(g, 5, 8 + bob, 2, 3, C.wiA); px(g, 8, 8 + bob, 2, 2, C.wiA);
    px(g, 3, 2 + bob, 6, 2, C.wiB);
    // eyes
    px(g, 3, 4 + bob, 2, 2, C.wiEye); px(g, 7, 4 + bob, 2, 2, C.wiEye);
    px(g, 4, 5 + bob, 1, 1, C.shB); px(g, 8, 5 + bob, 1, 1, C.shB);
  }

  function paintThrower(g, frame) {
    px(g, 2, 4, 12, 12, C.thB);               // cloak body
    px(g, 3, 3, 10, 12, C.thA);
    px(g, 4, 1, 8, 3, C.thA);                 // hood top
    px(g, 1, 14, 14, 2, C.thB);               // base
    // glowing eyes
    var lit = frame === 1 ? C.white : C.thEye;
    px(g, 4, 6, 3, 2, lit); px(g, 9, 6, 3, 2, lit);
    // mouth / cast point
    px(g, 6, 11, 4, 2, frame === 1 ? C.orbB : C.thB);
  }

  function paintOrb(g) {
    px(g, 2, 1, 4, 6, C.orbA); px(g, 1, 2, 6, 4, C.orbA);
    px(g, 2, 2, 2, 2, C.orbB);
    px(g, 0, 3, 1, 2, C.orbB); px(g, 7, 3, 1, 2, C.orbB);
  }

  function paintBlast(g) {
    px(g, 3, 1, 6, 6, C.bl3);
    px(g, 2, 2, 8, 4, C.bl2);
    px(g, 3, 3, 6, 2, C.bl1);
    px(g, 0, 3, 2, 2, C.bl2); px(g, 10, 3, 2, 2, C.bl2);
    px(g, 5, 0, 2, 1, C.bl1); px(g, 5, 7, 2, 1, C.bl1);
  }

  // ================= tiles (16x16) =================
  function paintGround(g) {
    px(g, 0, 0, 16, 16, C.dirt);
    px(g, 0, 0, 16, 4, C.grass);
    px(g, 0, 4, 16, 1, C.grassD);
    px(g, 0, 3, 16, 1, C.grassD);
    px(g, 3, 8, 2, 2, C.dirtD); px(g, 10, 11, 3, 2, C.dirtD);
    px(g, 7, 6, 2, 2, C.dirtD); px(g, 12, 6, 1, 1, C.dirtD);
    px(g, 0, 15, 16, 1, C.dirtD);
  }
  function paintDirt(g) {
    px(g, 0, 0, 16, 16, C.dirt);
    px(g, 2, 2, 3, 2, C.dirtD); px(g, 9, 3, 3, 2, C.dirtD);
    px(g, 5, 8, 2, 3, C.dirtD); px(g, 11, 10, 3, 2, C.dirtD);
    px(g, 0, 0, 16, 1, C.dirtD); px(g, 0, 15, 16, 1, C.dirtD);
  }
  function paintBrick(g) {
    px(g, 0, 0, 16, 16, C.mortar);
    px(g, 1, 1, 14, 6, C.brick); px(g, 1, 9, 6, 6, C.brick); px(g, 9, 9, 6, 6, C.brick);
    px(g, 1, 6, 14, 1, C.brickD); px(g, 1, 14, 14, 1, C.brickD);
  }
  function paintQ(g, kind) {
    // kind: 'core','grow','blast','used'
    var a = kind === 'used' ? C.qC : C.qA;
    var b = kind === 'used' ? '#6a513a' : C.qB;
    px(g, 0, 0, 16, 16, b);
    px(g, 1, 1, 14, 14, a);
    px(g, 2, 2, 12, 1, '#ffffff'); px(g, 2, 2, 1, 12, '#ffffff');
    px(g, 2, 13, 12, 1, b); px(g, 13, 2, 1, 12, b);
    // rivets
    px(g, 2, 2, 1, 1, b); px(g, 13, 2, 1, 1, b); px(g, 2, 13, 1, 1, b); px(g, 13, 13, 1, 1, b);
    if (kind === 'used') return;
    // a "?" mark
    var m = '#5a3a10';
    px(g, 6, 5, 4, 1, m); px(g, 9, 5, 1, 2, m); px(g, 8, 7, 1, 1, m);
    px(g, 7, 8, 1, 2, m); px(g, 7, 11, 1, 1, m);
  }
  function paintPlatform(g) {
    px(g, 0, 0, 16, 6, C.brick);
    px(g, 0, 0, 16, 1, '#e6c898');
    px(g, 0, 5, 16, 1, C.brickD);
    px(g, 3, 2, 2, 1, C.brickD); px(g, 10, 2, 2, 1, C.brickD);
  }

  function paintMovPlat(g) {
    px(g, 0, 0, 32, 12, C.metalD);
    px(g, 1, 1, 30, 9, C.metal);
    px(g, 1, 1, 30, 1, '#d6def0');
    px(g, 0, 11, 32, 1, '#3a435c');
    for (var i = 3; i < 30; i += 7) { px(g, i, 4, 3, 3, C.metalD); }
  }

  // ================= items =================
  function paintCore(g, frame) {
    var p = frame === 1 ? 1 : 0;
    px(g, 5, 0 + p, 4, 14 - p * 2, C.coreD);
    px(g, 4, 3 + p, 6, 8, C.core);
    px(g, 6, 2 + p, 2, 10 - p, C.coreL);
    px(g, 3, 6, 1, 2, C.core); px(g, 10, 6, 1, 2, C.core);
    px(g, 6, 4 + p, 1, 3, C.white);
  }
  function paintGrow(g, frame) {
    var p = frame === 1 ? 1 : 0;
    px(g, 3 - p, 3 - p, 10 + p * 2, 10 + p * 2, C.growA);
    px(g, 4, 4, 8, 8, C.growB);
    px(g, 6, 6, 4, 4, C.growL);
    px(g, 7, 2, 2, 12, C.growB); px(g, 2, 7, 12, 2, C.growB);  // plus shape glow
  }
  function paintBlastItem(g, frame) {
    var p = frame === 1 ? 1 : 0;
    px(g, 4, 4, 8, 8, C.bl3);
    px(g, 5, 5, 6, 6, C.bl2);
    px(g, 6, 6, 4, 4, C.bl1);
    // rays
    px(g, 7, 0 + p, 2, 3, C.bl2); px(g, 7, 13 - p, 2, 3, C.bl2);
    px(g, 0 + p, 7, 3, 2, C.bl2); px(g, 13 - p, 7, 3, 2, C.bl2);
    px(g, 2, 2, 2, 2, C.bl2); px(g, 12, 2, 2, 2, C.bl2);
    px(g, 2, 12, 2, 2, C.bl2); px(g, 12, 12, 2, 2, C.bl2);
  }
  function paintTimePart(g) {
    // a glowing time-machine gear / component
    px(g, 2, 2, 12, 12, C.gearD);
    px(g, 3, 3, 10, 10, C.gear);
    px(g, 0, 6, 16, 4, C.gearD); px(g, 6, 0, 4, 16, C.gearD);   // gear teeth
    px(g, 1, 7, 16, 2, C.gear); px(g, 7, 1, 2, 16, C.gear);
    px(g, 5, 5, 6, 6, C.glow);
    px(g, 6, 6, 4, 4, C.coreL);
    px(g, 7, 7, 2, 2, C.white);
  }

  // ================= church logo placeholder =================
  function buildLogoPlaceholder() {
    var c = cv(220, 150), g = c.getContext('2d');
    // dark rounded panel
    g.fillStyle = '#101630'; g.fillRect(0, 0, 220, 150);
    g.fillStyle = '#1b2750'; g.fillRect(6, 6, 208, 138);
    // crossroads emblem: a circle with a cross
    g.fillStyle = '#2a3a72'; g.beginPath(); g.arc(110, 56, 38, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd23a';
    g.fillRect(102, 24, 16, 64);   // vertical bar
    g.fillRect(82, 44, 56, 16);    // horizontal bar
    g.fillStyle = '#ffe893';
    g.fillRect(105, 24, 6, 64); g.fillRect(82, 47, 56, 6);
    // little roads meeting under the cross
    g.fillStyle = '#cdd6e6';
    g.fillRect(40, 96, 140, 6);
    g.fillRect(107, 70, 6, 40);
    g.fillStyle = '#8d97ad';
    for (var i = 50; i < 175; i += 18) g.fillRect(i, 98, 8, 2);
    // church name
    text(g, 'CHURCH OF THE', 110, 112, '#dfe6ff', 2, 'center');
    text(g, 'CROSSROADS', 110, 128, '#ffd23a', 2, 'center');
    sprites['logoPlaceholder'] = c;
  }

  // ================= build all =================
  function frameCanvas(w, h, painter) {
    var c = cv(w, h); painter(c.getContext('2d')); return c;
  }

  function build() {
    var dFrames = ['idle', 'walk1', 'walk2', 'jump', 'blast', 'hurt'];
    dFrames.forEach(function (f) {
      var fr = f === 'hurt' ? 'idle' : f;
      var s = frameCanvas(16, 16, function (g) { paintDannySmall(g, fr); });
      var b = frameCanvas(16, 32, function (g) { paintDannyBig(g, fr); });
      sprites['danny_small_' + f + '_r'] = s;
      sprites['danny_small_' + f + '_l'] = flip(s);
      sprites['danny_big_' + f + '_r'] = b;
      sprites['danny_big_' + f + '_l'] = flip(b);
    });

    [0, 1].forEach(function (i) {
      var w = frameCanvas(14, 14, function (g) { paintWalker(g, i); });
      sprites['walker_' + i + '_r'] = w;
      sprites['walker_' + i + '_l'] = flip(w);
      sprites['wisp_' + i] = frameCanvas(12, 14, function (g) { paintWisp(g, i); });
      var t = frameCanvas(16, 16, function (g) { paintThrower(g, i); });
      sprites['thrower_' + i + '_r'] = t;
      sprites['thrower_' + i + '_l'] = flip(t);
      sprites['core_' + i] = frameCanvas(14, 16, function (g) { paintCore(g, i); });
      sprites['grow_' + i] = frameCanvas(16, 16, function (g) { paintGrow(g, i); });
      sprites['blastitem_' + i] = frameCanvas(16, 16, function (g) { paintBlastItem(g, i); });
    });

    sprites['orb'] = frameCanvas(8, 8, paintOrb);
    var bl = frameCanvas(12, 8, paintBlast);
    sprites['playerblast_r'] = bl;
    sprites['playerblast_l'] = flip(bl);

    sprites['tile_ground'] = frameCanvas(16, 16, paintGround);
    sprites['tile_dirt'] = frameCanvas(16, 16, paintDirt);
    sprites['tile_brick'] = frameCanvas(16, 16, paintBrick);
    sprites['tile_platform'] = frameCanvas(16, 16, paintPlatform);
    sprites['tile_qcore'] = frameCanvas(16, 16, function (g) { paintQ(g, 'core'); });
    sprites['tile_qgrow'] = frameCanvas(16, 16, function (g) { paintQ(g, 'grow'); });
    sprites['tile_qblast'] = frameCanvas(16, 16, function (g) { paintQ(g, 'blast'); });
    sprites['tile_qused'] = frameCanvas(16, 16, function (g) { paintQ(g, 'used'); });
    sprites['movplat'] = frameCanvas(32, 12, paintMovPlat);
    sprites['timepart'] = frameCanvas(16, 16, paintTimePart);

    buildLogoPlaceholder();
  }

  // ---- LOGO SWAP POINT --------------------------------------------------
  // The intro card uses sprites['logoPlaceholder'] above. To use the real
  // Church of the Crossroads logo instead:
  //   1. Save the logo into the assets folder as  assets/logo.png
  //   2. Nothing else - the loader below picks it up automatically and the
  //      intro scene will display it in place of the placeholder.
  var realLogo = new Image();
  var realLogoOk = false;
  realLogo.onload = function () { realLogoOk = (realLogo.width > 0); };
  realLogo.onerror = function () { realLogoOk = false; };
  realLogo.src = 'assets/logo.png';
  // -----------------------------------------------------------------------

  SDD.sprites = {
    build: build,
    get: function (name) { return sprites[name]; },
    text: text,
    textShadow: textShadow,
    textWidth: textWidth,
    palette: C,
    hasRealLogo: function () { return realLogoOk; },
    realLogo: function () { return realLogo; }
  };
})();
