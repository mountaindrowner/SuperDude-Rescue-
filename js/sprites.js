// sprites.js - hand-coded pixel art and a bitmap font, rendered to offscreen
// canvases once at boot. Characters/enemies/items get an automatic dark
// outline; every material is drawn with base + shadow + highlight tones.
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
  function hexRGB(h) {
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  }

  // Adds a 1px dark outline around every opaque shape (8-connected).
  function addOutline(canvas, col) {
    var g = canvas.getContext('2d'), w = canvas.width, h = canvas.height, img;
    try { img = g.getImageData(0, 0, w, h); } catch (e) { return; }
    var d = img.data;
    if (!d || !d.length) return;
    var src = new Uint8ClampedArray(d);
    var oc = hexRGB(col);
    function solid(x, y) { return x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 12; }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        if (src[i + 3] > 12) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1) ||
            solid(x - 1, y - 1) || solid(x + 1, y - 1) || solid(x - 1, y + 1) || solid(x + 1, y + 1)) {
          d[i] = oc[0]; d[i + 1] = oc[1]; d[i + 2] = oc[2]; d[i + 3] = 255;
        }
      }
    }
    g.putImageData(img, 0, 0);
  }

  // ---- palette ----
  var C = {
    out: '#15111e',
    skin: '#edb079', skinL: '#ffd2a2', skinD: '#c4854f',
    hair: '#43301f', hairL: '#6c4d31',
    capR: '#e2433a', capL: '#ff7060', capD: '#a52a22',
    coat: '#eef0fa', coatL: '#ffffff', coatD: '#b9bed4',
    shirt: '#23222f',
    atom: '#ffd23a', atomL: '#fff0a8',
    jean: '#3f63d8', jeanL: '#5f81ec', jeanD: '#293f93',
    shoe: '#2d2937', shoeL: '#4c4860',
    lens: '#cfecff',
    shA: '#4b3d72', shB: '#332a52', shL: '#6f5d9c', shEye: '#ff89b0',
    wiA: '#7d61b8', wiB: '#594390', wiL: '#bca4ec', wiEye: '#fff4ff',
    thA: '#4e3d68', thB: '#34294a', thL: '#705c92', thEye: '#ff5d5d',
    orbA: '#9b3fb0', orbB: '#6d2280', orbL: '#dd92ea',
    bl1: '#ffffff', bl2: '#fff0a0', bl3: '#ffb43a',
    grass: '#7ec844', grassL: '#a8e86c', grassD: '#549231',
    dirt: '#bb7a42', dirtL: '#d6975c', dirtD: '#8a5328', dirtK: '#673c1d',
    brick: '#cca06f', brickL: '#e8bf90', brickD: '#9a7040', mortar: '#5f4127',
    qA: '#ffc63c', qL: '#ffe590', qB: '#d98f1e', qD: '#9c6512',
    qC: '#a98f6a', qCd: '#6f5638',
    metal: '#aab4cc', metalL: '#dde3f0', metalD: '#5d6884',
    core: '#46f0ff', coreL: '#e8ffff', coreD: '#1a9fc4',
    growA: '#ff8a30', growB: '#e0641a', growL: '#ffd06a', growW: '#ffffff',
    gear: '#ced7e8', gearL: '#ffffff', gearD: '#7d889c', glow: '#9bf0ff',
    white: '#ffffff', black: '#000000'
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
        for (var c = 0; c < 5; c++) {
          if (gl[r][c] === '#') g.fillRect(cx + c * scale, y + r * scale, scale, scale);
        }
      }
    }
  }
  function textShadow(g, str, x, y, color, shadow, scale, align) {
    scale = scale || 1;
    text(g, str, x + scale, y + scale, shadow, scale, align);
    text(g, str, x, y, color, scale, align);
  }

  // ================= Danny =================
  function paintHead(g, oy) {
    // backwards cap
    px(g, 6, oy, 5, 1, C.capR);
    px(g, 5, oy + 1, 7, 2, C.capR);
    px(g, 4, oy + 3, 8, 1, C.capR);
    px(g, 6, oy, 4, 1, C.capL);          // dome highlight
    px(g, 5, oy + 1, 5, 1, C.capL);
    px(g, 4, oy + 3, 8, 1, C.capD);      // cap band shadow
    px(g, 2, oy + 3, 3, 2, C.capR);      // backwards brim
    px(g, 2, oy + 4, 3, 1, C.capD);
    // hair at the back
    px(g, 11, oy + 3, 2, 4, C.hair);
    px(g, 12, oy + 3, 1, 3, C.hairL);
    // face
    px(g, 5, oy + 4, 6, 5, C.skin);
    px(g, 11, oy + 4, 1, 3, C.skin);
    px(g, 5, oy + 4, 6, 1, C.skinL);     // forehead highlight
    px(g, 5, oy + 4, 1, 4, C.skinD);     // cheek shadow under brim
    // glasses
    px(g, 5, oy + 5, 7, 1, C.out);
    px(g, 6, oy + 5, 2, 1, C.lens);
    px(g, 9, oy + 5, 2, 1, C.lens);
    px(g, 8, oy + 5, 1, 1, C.out);
    // nose + beard
    px(g, 10, oy + 6, 1, 1, C.skinD);
    px(g, 5, oy + 7, 7, 2, C.hair);
    px(g, 5, oy + 7, 7, 1, C.hairL);
    px(g, 7, oy + 7, 3, 1, C.skinD);     // mouth
  }

  function legParams(frame) {
    if (frame === 'walk1') return { lx: 3, rx: 9, ls: 2, rs: 9 };
    if (frame === 'walk2') return { lx: 5, rx: 8, ls: 5, rs: 8 };
    return { lx: 4, rx: 8, ls: 3, rs: 8 };
  }

  function paintDannySmall(g, frame) {
    paintHead(g, 1);
    px(g, 7, 10, 3, 1, C.skinD);                 // neck
    // coat torso
    px(g, 4, 10, 9, 4, C.coat);
    px(g, 12, 10, 1, 4, C.coatD);                // coat right shade
    px(g, 4, 10, 1, 4, C.coatL);                 // coat left highlight
    px(g, 7, 10, 3, 3, C.shirt);                 // shirt
    px(g, 8, 11, 1, 1, C.atom);                  // atom symbol
    px(g, 6, 10, 1, 3, C.coatD); px(g, 10, 10, 1, 3, C.coatD); // lapels
    if (frame === 'jump') {
      px(g, 3, 8, 1, 3, C.coat); px(g, 13, 8, 1, 3, C.coat);
      px(g, 3, 7, 1, 1, C.skin); px(g, 13, 7, 1, 1, C.skin);
    } else if (frame === 'blast') {
      px(g, 3, 11, 1, 3, C.coat); px(g, 3, 14, 1, 1, C.skin);
      px(g, 13, 11, 2, 1, C.coat); px(g, 15, 11, 1, 1, C.skin);
      px(g, 13, 10, 1, 1, C.atom);
    } else {
      px(g, 3, 10, 1, 4, C.coat); px(g, 13, 10, 1, 4, C.coat);
      px(g, 3, 14, 1, 1, C.skin); px(g, 13, 14, 1, 1, C.skin);
      px(g, 3, 13, 1, 1, C.atom);                // watch
    }
    var L = legParams(frame);
    px(g, L.lx, 14, 3, 3, C.jean); px(g, L.rx, 14, 3, 3, C.jean);
    px(g, L.lx, 14, 1, 3, C.jeanL); px(g, L.rx, 14, 1, 3, C.jeanL);
    px(g, L.lx + 2, 14, 1, 3, C.jeanD); px(g, L.rx + 2, 14, 1, 3, C.jeanD);
    px(g, L.ls, 17, 4, 1, C.shoe); px(g, L.rs, 17, 4, 1, C.shoe);
    px(g, L.ls, 17, 4, 1, C.shoe);
  }

  function paintDannyBig(g, frame) {
    paintHead(g, 3);
    px(g, 7, 12, 3, 1, C.skinD);                 // neck
    px(g, 3, 12, 11, 13, C.coat);                // coat torso
    px(g, 13, 12, 1, 13, C.coatD);
    px(g, 3, 12, 1, 13, C.coatL);
    px(g, 6, 12, 4, 9, C.shirt);                 // shirt
    px(g, 7, 15, 2, 2, C.atom);
    px(g, 5, 12, 1, 12, C.coatD); px(g, 10, 12, 1, 12, C.coatD);
    if (frame === 'jump') {
      px(g, 2, 9, 2, 5, C.coat); px(g, 13, 9, 2, 5, C.coat);
      px(g, 2, 8, 2, 1, C.skin); px(g, 13, 8, 2, 1, C.skin);
    } else if (frame === 'blast') {
      px(g, 2, 14, 2, 7, C.coat); px(g, 2, 21, 2, 2, C.skin);
      px(g, 14, 15, 3, 2, C.coat); px(g, 17, 15, 1, 2, C.skin);
      px(g, 14, 14, 1, 1, C.atom);
    } else {
      px(g, 2, 13, 2, 9, C.coat); px(g, 13, 13, 2, 9, C.coat);
      px(g, 2, 22, 2, 2, C.skin); px(g, 13, 22, 2, 2, C.skin);
      px(g, 2, 21, 2, 1, C.atom);
    }
    var s = frame === 'walk1' ? 1 : (frame === 'walk2' ? -1 : 0);
    px(g, 3 + s, 25, 5, 7, C.jean); px(g, 9 - s, 25, 5, 7, C.jean);
    px(g, 3 + s, 25, 1, 7, C.jeanL); px(g, 9 - s, 25, 1, 7, C.jeanL);
    px(g, 6 + s, 25, 2, 7, C.jeanD); px(g, 12 - s, 25, 2, 7, C.jeanD);
    px(g, 2 + s, 32, 6, 2, C.shoe); px(g, 9 - s, 32, 6, 2, C.shoe);
    px(g, 2 + s, 32, 6, 1, C.shoeL); px(g, 9 - s, 32, 6, 1, C.shoeL);
  }

  // ================= enemies =================
  function paintWalker(g, frame) {
    var sq = frame === 1 ? 1 : 0;                // squish frame: shorter, wider
    var t = 4 + sq;
    // rounded blob silhouette
    px(g, 5, t, 6, 1, C.shA);
    px(g, 4, t + 1, 8, 1, C.shA);
    px(g, 3, t + 2, 10, 1, C.shA);
    px(g, 2, t + 3, 12, 5 - sq, C.shA);
    px(g, 3, t + 8 - sq, 10, 1, C.shA);
    // shading
    px(g, 5, t, 6, 1, C.shL);
    px(g, 4, t + 1, 5, 1, C.shL);
    px(g, 3, t + 2, 4, 1, C.shL);
    px(g, 2, t + 6 - sq, 12, 2, C.shB);
    // little feet
    px(g, 3, t + 9 - sq, 3, 1, C.shB);
    px(g, 10, t + 9 - sq, 3, 1, C.shB);
    // big cute eyes
    px(g, 4, t + 3, 3, 3, C.white);
    px(g, 9, t + 3, 3, 3, C.white);
    px(g, 5, t + 4, 2, 2, C.out);
    px(g, 10, t + 4, 2, 2, C.out);
    px(g, 6, t + 7 - sq, 4, 1, C.shEye);         // smile
  }

  function paintWisp(g, frame) {
    var b = frame === 1 ? 1 : 0;
    px(g, 3, 1 + b, 8, 8, C.wiA);
    px(g, 2, 3 + b, 10, 5, C.wiA);
    px(g, 3, 1 + b, 8, 2, C.wiL);                // top glow
    px(g, 2, 6 + b, 10, 2, C.wiB);               // belly shadow
    // wavy tail
    px(g, 2, 8 + b, 3, 2, C.wiA); px(g, 6, 8 + b, 2, 3, C.wiA); px(g, 9, 8 + b, 3, 2, C.wiA);
    px(g, 2, 9 + b, 3, 1, C.wiB); px(g, 9, 9 + b, 3, 1, C.wiB);
    // eyes
    px(g, 4, 4 + b, 2, 2, C.wiEye); px(g, 8, 4 + b, 2, 2, C.wiEye);
    px(g, 4, 5 + b, 1, 1, C.out); px(g, 8, 5 + b, 1, 1, C.out);
  }

  function paintThrower(g, frame) {
    px(g, 3, 1, 9, 4, C.thA);                    // hood
    px(g, 2, 4, 12, 12, C.thA);                  // cloak
    px(g, 2, 4, 12, 2, C.thL);                   // hood highlight
    px(g, 2, 12, 12, 4, C.thB);                  // hem shadow
    px(g, 11, 5, 2, 10, C.thB);                  // right shade
    var lit = frame === 1 ? C.white : C.thEye;
    px(g, 4, 6, 3, 2, lit); px(g, 9, 6, 3, 2, lit);
    px(g, 4, 6, 3, 1, C.white);
    px(g, 6, 11, 4, 2, frame === 1 ? C.orbL : C.thB);   // casting mouth
  }

  function paintOrb(g) {
    px(g, 2, 1, 5, 7, C.orbA);
    px(g, 1, 2, 7, 5, C.orbA);
    px(g, 2, 2, 3, 3, C.orbL);                   // highlight
    px(g, 3, 5, 3, 2, C.orbB);                   // shadow
    px(g, 0, 3, 1, 3, C.orbA); px(g, 8, 3, 1, 3, C.orbA);
  }

  function paintBlast(g) {
    px(g, 3, 1, 7, 6, C.bl3);
    px(g, 2, 2, 9, 4, C.bl2);
    px(g, 3, 3, 7, 2, C.bl1);
    px(g, 0, 3, 2, 2, C.bl2); px(g, 11, 3, 2, 2, C.bl2);
    px(g, 5, 0, 3, 1, C.bl1); px(g, 5, 7, 3, 1, C.bl1);
  }

  // ================= tiles (16x16, no outline - they tile) =================
  function paintGround(g) {
    px(g, 0, 0, 16, 16, C.dirt);
    px(g, 0, 0, 16, 5, C.grass);                 // grass cap
    px(g, 0, 0, 16, 2, C.grassL);
    px(g, 0, 4, 16, 1, C.grassD);
    // grass blades poking down
    px(g, 2, 5, 1, 2, C.grassD); px(g, 7, 5, 1, 2, C.grassD); px(g, 12, 5, 1, 2, C.grassD);
    px(g, 0, 5, 16, 1, C.dirtL);
    // dirt texture
    px(g, 3, 8, 2, 2, C.dirtD); px(g, 10, 11, 3, 2, C.dirtD);
    px(g, 7, 7, 2, 1, C.dirtL); px(g, 12, 7, 1, 1, C.dirtD); px(g, 2, 12, 2, 1, C.dirtL);
    px(g, 0, 15, 16, 1, C.dirtK);
  }
  function paintDirt(g) {
    px(g, 0, 0, 16, 16, C.dirt);
    px(g, 0, 0, 16, 1, C.dirtL);
    px(g, 2, 2, 3, 2, C.dirtD); px(g, 9, 3, 3, 2, C.dirtD);
    px(g, 5, 8, 2, 3, C.dirtD); px(g, 11, 10, 3, 2, C.dirtD);
    px(g, 7, 5, 2, 1, C.dirtL); px(g, 12, 12, 2, 1, C.dirtL);
    px(g, 0, 15, 16, 1, C.dirtK); px(g, 0, 0, 1, 16, C.dirtD);
  }
  function paintBrick(g) {
    px(g, 0, 0, 16, 16, C.mortar);
    function b(x, y, w, h) {
      px(g, x, y, w, h, C.brick);
      px(g, x, y, w, 1, C.brickL);
      px(g, x, y + h - 1, w, 1, C.brickD);
    }
    b(1, 1, 14, 6); b(1, 9, 6, 6); b(9, 9, 6, 6);
  }
  function paintPlatform(g) {
    px(g, 0, 0, 16, 7, C.brick);
    px(g, 0, 0, 16, 2, C.brickL);
    px(g, 0, 6, 16, 1, C.brickD);
    px(g, 4, 3, 3, 1, C.brickD); px(g, 10, 3, 3, 1, C.brickD);
  }
  function paintQ(g, kind) {
    var used = kind === 'used';
    var a = used ? C.qC : C.qA, b = used ? C.qCd : C.qB, lt = used ? '#c3ab84' : C.qL;
    px(g, 0, 0, 16, 16, b);
    px(g, 1, 1, 14, 14, a);
    px(g, 1, 1, 14, 2, lt);                      // top bevel
    px(g, 1, 1, 2, 14, lt);                      // left bevel
    px(g, 1, 13, 14, 2, b);                      // bottom shade
    px(g, 13, 1, 2, 14, b);
    px(g, 2, 2, 1, 1, b); px(g, 13, 2, 1, 1, b);
    px(g, 2, 13, 1, 1, b); px(g, 13, 13, 1, 1, b);
    if (used) return;
    var m = C.qD;
    px(g, 6, 5, 4, 1, m); px(g, 9, 5, 1, 2, m); px(g, 8, 7, 1, 1, m);
    px(g, 7, 8, 1, 2, m); px(g, 7, 11, 1, 1, m);
    px(g, 6, 4, 4, 1, C.white);
  }
  function paintMovPlat(g) {
    px(g, 0, 0, 36, 13, C.metalD);
    px(g, 1, 1, 34, 10, C.metal);
    px(g, 1, 1, 34, 2, C.metalL);
    px(g, 1, 9, 34, 2, C.metalD);
    px(g, 0, 12, 36, 1, '#3a435c');
    for (var i = 4; i < 33; i += 8) { px(g, i, 4, 4, 4, C.metalD); px(g, i, 4, 4, 1, '#7c879e'); }
  }

  // ================= items =================
  function paintCore(g, frame) {
    var p = frame === 1 ? 1 : 0;
    px(g, 5, 1 + p, 4, 12 - p * 2, C.coreD);
    px(g, 4, 3 + p, 6, 8, C.core);
    px(g, 5, 2 + p, 3, 9 - p, C.coreL);
    px(g, 3, 6, 1, 2, C.core); px(g, 10, 6, 1, 2, C.core);
    px(g, 6, 3 + p, 1, 4, C.white);
  }
  function paintGrow(g, frame) {
    var p = frame === 1 ? 1 : 0;
    px(g, 3, 3, 10, 10, C.growA);
    px(g, 4, 4, 8, 8, C.growL);
    px(g, 5, 5, 5, 5, C.growW);
    px(g, 3, 3, 10, 1, C.growL);
    px(g, 3, 12, 10, 1, C.growB);
    px(g, 7, 1 - p, 2, 14 + p * 2, C.growL);     // plus glow
    px(g, 1 - p, 7, 14 + p * 2, 2, C.growL);
  }
  function paintBlastItem(g, frame) {
    var p = frame === 1 ? 1 : 0;
    px(g, 4, 4, 8, 8, C.bl3);
    px(g, 5, 5, 6, 6, C.bl2);
    px(g, 6, 6, 4, 4, C.bl1);
    px(g, 7, 0 + p, 2, 3, C.bl2); px(g, 7, 13 - p, 2, 3, C.bl2);
    px(g, 0 + p, 7, 3, 2, C.bl2); px(g, 13 - p, 7, 3, 2, C.bl2);
    px(g, 2, 2, 2, 2, C.bl2); px(g, 12, 2, 2, 2, C.bl2);
    px(g, 2, 12, 2, 2, C.bl2); px(g, 12, 12, 2, 2, C.bl2);
  }
  function paintTimePart(g) {
    px(g, 6, 0, 4, 16, C.gearD); px(g, 0, 6, 16, 4, C.gearD);
    px(g, 7, 0, 2, 16, C.gear); px(g, 0, 7, 16, 2, C.gear);
    px(g, 2, 2, 12, 12, C.gearD);
    px(g, 3, 3, 10, 10, C.gear);
    px(g, 3, 3, 10, 2, C.gearL);
    px(g, 5, 5, 6, 6, C.glow);
    px(g, 6, 6, 4, 4, C.coreL);
    px(g, 6, 6, 2, 2, C.white);
  }

  // ================= church logo placeholder =================
  function buildLogoPlaceholder() {
    var c = cv(224, 152), g = c.getContext('2d');
    g.fillStyle = '#0e1430'; g.fillRect(0, 0, 224, 152);
    var grd = g.createLinearGradient(0, 0, 0, 152);
    grd.addColorStop(0, '#243066'); grd.addColorStop(1, '#161e44');
    g.fillStyle = grd; g.fillRect(6, 6, 212, 140);
    g.strokeStyle = '#3a4a8c'; g.strokeRect(6.5, 6.5, 211, 139);
    g.fillStyle = 'rgba(255,210,80,0.16)';
    g.beginPath(); g.arc(112, 56, 48, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a3a72'; g.beginPath(); g.arc(112, 56, 38, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd23a'; g.fillRect(104, 24, 16, 64); g.fillRect(84, 44, 56, 16);
    g.fillStyle = '#fff0a8'; g.fillRect(107, 24, 5, 64); g.fillRect(84, 47, 56, 5);
    g.fillStyle = '#cdd6e6'; g.fillRect(42, 96, 140, 6); g.fillRect(109, 70, 6, 32);
    g.fillStyle = '#8d97ad';
    for (var i = 52; i < 176; i += 18) g.fillRect(i, 98, 8, 2);
    text(g, 'CHURCH OF THE', 112, 112, '#dfe6ff', 2, 'center');
    text(g, 'CROSSROADS', 112, 128, '#ffd23a', 2, 'center');
    sprites['logoPlaceholder'] = c;
  }

  // ================= build =================
  // outlined sprite: 2px side / top padding, flush bottom, then dark outline.
  function spriteO(w, h, painter) {
    var c = cv(w + 4, h + 2), g = c.getContext('2d');
    g.translate(2, 2);
    painter(g);
    addOutline(c, C.out);
    return c;
  }
  function spritePlain(w, h, painter) {
    var c = cv(w, h); painter(c.getContext('2d')); return c;
  }

  function build() {
    var frames = ['idle', 'walk1', 'walk2', 'jump', 'blast', 'hurt'];
    frames.forEach(function (f) {
      var fr = f === 'hurt' ? 'idle' : f;
      var s = spriteO(16, 18, function (g) { paintDannySmall(g, fr); });
      var b = spriteO(18, 34, function (g) { paintDannyBig(g, fr); });
      sprites['danny_small_' + f + '_r'] = s;
      sprites['danny_small_' + f + '_l'] = flip(s);
      sprites['danny_big_' + f + '_r'] = b;
      sprites['danny_big_' + f + '_l'] = flip(b);
    });

    [0, 1].forEach(function (i) {
      var w = spriteO(16, 14, function (g) { paintWalker(g, i); });
      sprites['walker_' + i + '_r'] = w;
      sprites['walker_' + i + '_l'] = flip(w);
      sprites['wisp_' + i] = spriteO(14, 14, function (g) { paintWisp(g, i); });
      var t = spriteO(16, 16, function (g) { paintThrower(g, i); });
      sprites['thrower_' + i + '_r'] = t;
      sprites['thrower_' + i + '_l'] = flip(t);
      sprites['core_' + i] = spriteO(14, 16, function (g) { paintCore(g, i); });
      sprites['grow_' + i] = spriteO(16, 16, function (g) { paintGrow(g, i); });
      sprites['blastitem_' + i] = spriteO(16, 16, function (g) { paintBlastItem(g, i); });
    });

    sprites['orb'] = spriteO(9, 8, paintOrb);
    var bl = spriteO(13, 8, paintBlast);
    sprites['playerblast_r'] = bl;
    sprites['playerblast_l'] = flip(bl);
    sprites['movplat'] = spriteO(36, 13, paintMovPlat);
    sprites['timepart'] = spriteO(16, 16, paintTimePart);

    sprites['tile_ground'] = spritePlain(16, 16, paintGround);
    sprites['tile_dirt'] = spritePlain(16, 16, paintDirt);
    sprites['tile_brick'] = spritePlain(16, 16, paintBrick);
    sprites['tile_platform'] = spritePlain(16, 16, paintPlatform);
    sprites['tile_qcore'] = spritePlain(16, 16, function (g) { paintQ(g, 'core'); });
    sprites['tile_qgrow'] = spritePlain(16, 16, function (g) { paintQ(g, 'grow'); });
    sprites['tile_qblast'] = spritePlain(16, 16, function (g) { paintQ(g, 'blast'); });
    sprites['tile_qused'] = spritePlain(16, 16, function (g) { paintQ(g, 'used'); });

    buildLogoPlaceholder();
  }

  // ---- LOGO SWAP POINT --------------------------------------------------
  // To use the real Church of the Crossroads logo: save it as assets/logo.png
  // - the loader below picks it up automatically and the intro scene shows it.
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
