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
    skin: '#e7a778', skinL: '#ffc89a', skinD: '#bb7c49',
    hair: '#46331f', hairL: '#6a4f30',
    cap: '#34344c', capL: '#52526e', capD: '#20202f',
    coat: '#eef0f8', coatL: '#ffffff', coatD: '#c3c7da',
    shirt: '#1c1c28', shirtL: '#30303f',
    atom: '#ffffff',
    jean: '#4060bd', jeanL: '#5c80de', jeanD: '#2b4181',
    shoe: '#edeff6', shoeL: '#ffffff', shoeD: '#363643',
    lens: '#bfe6ff',
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
  // ---- tall Danny: 24x36, articulated arms + legs, 13 animation frames ----
  function paintDannyBig(g, frame) {
    var bob = 0, legL = 0, legR = 0;
    var armBack = 'down', armFront = 'down';
    var hurt = false, die = false, victory = false;
    switch (frame) {
      case 'idle1':   bob = 1; break;
      case 'walk0':   legL = -1; legR = 2;  armBack = 'fwd';  armFront = 'back'; break;
      case 'walk1':   bob = -1; break;
      case 'walk2':   legL = 2;  legR = -1; armBack = 'back'; armFront = 'fwd';  break;
      case 'walk3':   bob = -1; break;
      case 'jump':    bob = -1; armBack = 'up';  armFront = 'up';  break;
      case 'fall':    armBack = 'out'; armFront = 'out'; break;
      case 'land':    bob = 2; legL = -1; legR = 1; armBack = 'out'; armFront = 'out'; break;
      case 'blast':   armFront = 'forward'; break;
      case 'hurt':    hurt = true; bob = 1; armBack = 'out'; armFront = 'out'; break;
      case 'die':     hurt = true; die = true; armBack = 'down'; armFront = 'down'; break;
      case 'victory': bob = -1; armBack = 'up'; armFront = 'up'; victory = true; break;
    }

    // ===== HEAD =====
    var cy = 1 + bob;
    px(g, 9, cy, 7, 1, C.cap);
    px(g, 8, cy + 1, 9, 1, C.cap);
    px(g, 7, cy + 2, 11, 1, C.cap);
    px(g, 6, cy + 3, 13, 2, C.cap);
    px(g, 9, cy, 4, 1, C.capL);
    px(g, 8, cy + 1, 4, 1, C.capL);
    px(g, 7, cy + 2, 4, 1, C.capL);
    px(g, 6, cy + 3, 4, 1, C.capL);
    px(g, 6, cy + 5, 13, 1, C.capD);
    px(g, 1, cy + 3, 5, 2, C.cap);
    px(g, 1, cy + 3, 5, 1, C.capL);
    px(g, 1, cy + 5, 5, 1, C.capD);
    px(g, 17, cy + 5, 3, 7, C.hair);
    px(g, 18, cy + 6, 2, 5, C.hairL);
    px(g, 6, cy + 8, 1, 2, C.hair);
    px(g, 6, cy + 5, 13, 8, C.skin);
    px(g, 6, cy + 5, 13, 1, C.skinL);
    px(g, 6, cy + 5, 1, 6, C.skinD);
    px(g, 4, cy + 8, 2, 3, C.skin);                          // ear
    if (hurt) {
      px(g, 7, cy + 7, 2, 3, '#ff5d5d');
      px(g, 13, cy + 7, 2, 3, '#ff5d5d');
      px(g, 6, cy + 8, 4, 1, C.out);
      px(g, 12, cy + 8, 4, 1, C.out);
    } else {
      px(g, 6, cy + 8, 4, 1, C.out);
      px(g, 7, cy + 8, 2, 1, C.lens);
      px(g, 12, cy + 8, 4, 1, C.out);
      px(g, 13, cy + 8, 2, 1, C.lens);
      px(g, 10, cy + 8, 2, 1, C.out);                        // bridge
    }
    px(g, 16, cy + 10, 1, 1, C.skinD);                       // nose
    px(g, 6, cy + 11, 13, 2, C.hair);
    px(g, 6, cy + 11, 13, 1, C.hairL);
    px(g, 10, cy + 11, 5, 1, C.skinD);                       // mouth
    px(g, 11, cy + 13, 4, 1, C.skinD);                       // neck

    // ===== TORSO (fixed) =====
    var by = 14, bh = 11;
    px(g, 4, by, 17, bh, C.coat);
    px(g, 4, by, 3, bh, C.coatL);
    px(g, 19, by, 2, bh, C.coatD);
    px(g, 7, by, 3, 1, C.coatD); px(g, 14, by, 3, 1, C.coatD); // collar
    px(g, 8, by, 1, bh, C.coatD); px(g, 15, by, 1, bh, C.coatD); // lapel seams
    // black shirt
    px(g, 9, by, 6, bh, C.shirt);
    px(g, 9, by, 6, 1, C.shirtL);
    // atom emblem (diamond)
    px(g, 11, 16, 1, 1, C.atom); px(g, 13, 16, 1, 1, C.atom);
    px(g, 10, 17, 1, 1, C.atom); px(g, 14, 17, 1, 1, C.atom);
    px(g, 12, 18, 1, 1, C.atom);
    px(g, 10, 19, 1, 1, C.atom); px(g, 14, 19, 1, 1, C.atom);
    px(g, 11, 20, 1, 1, C.atom); px(g, 13, 20, 1, 1, C.atom);

    if (!die) {
      // coat tails
      px(g, 3, 25, 4, 3, C.coat); px(g, 17, 25, 4, 3, C.coat);
      px(g, 3, 25, 2, 3, C.coatL); px(g, 19, 25, 2, 3, C.coatD);
    }

    // ===== ARMS =====
    function arm(side, pose) {
      var isBack = side === 'back';
      if (pose === 'forward' && !isBack) {
        px(g, 19, 15, 5, 3, C.coat);
        px(g, 19, 15, 1, 3, C.coatL);
        px(g, 23, 15, 1, 3, C.skin);
        return;
      }
      if (pose === 'forward' && isBack) pose = 'down';
      var dx, ay, ah, handY;
      if (pose === 'down') { dx = isBack ? 2 : 19; ay = 14; ah = 8; handY = 22; }
      else if (pose === 'fwd')  { dx = isBack ? 3 : 18; ay = 15; ah = 7; handY = 22; }
      else if (pose === 'back') { dx = isBack ? 1 : 20; ay = 14; ah = 8; handY = 22; }
      else if (pose === 'up')   { dx = isBack ? 2 : 19; ay = 8 + bob; ah = 6; handY = 7 + bob; }
      else if (pose === 'out')  { dx = isBack ? 0 : 21; ay = 16; ah = 4; handY = 20; }
      else                       { dx = isBack ? 2 : 19; ay = 14; ah = 8; handY = 22; }
      px(g, dx, ay, 3, ah, C.coat);
      if (isBack) px(g, dx, ay, 1, ah, C.coatL);
      else        px(g, dx + 2, ay, 1, ah, C.coatD);
      px(g, dx, handY, 3, 2, C.skin);
      if (!isBack && pose === 'down') px(g, dx, handY - 1, 2, 1, '#d8def0'); // watch
    }
    arm('back', armBack);
    arm('front', armFront);

    // ===== LEGS + SHOES =====
    if (!die) {
      var lx = 7 + legL, rx = 13 + legR;
      px(g, lx, 28, 4, 4, C.jean); px(g, lx, 28, 1, 4, C.jeanL); px(g, lx + 3, 28, 1, 4, C.jeanD);
      px(g, rx, 28, 4, 4, C.jean); px(g, rx, 28, 1, 4, C.jeanL); px(g, rx + 3, 28, 1, 4, C.jeanD);
      px(g, lx - 1, 32, 6, 3, C.shoe); px(g, lx - 1, 32, 6, 1, C.shoeL); px(g, lx - 1, 34, 6, 1, C.shoeD);
      px(g, rx - 1, 32, 6, 3, C.shoe); px(g, rx - 1, 32, 6, 1, C.shoeL); px(g, rx - 1, 34, 6, 1, C.shoeD);
    } else {
      // collapsed shape on the ground
      px(g, 2, 32, 20, 3, C.coat);
      px(g, 2, 32, 20, 1, C.coatL);
      px(g, 2, 34, 20, 1, C.coatD);
    }

    if (victory) {
      px(g, 11, 0, 1, 1, C.atom); px(g, 13, 0, 1, 1, C.atom);
      px(g, 4, 4, 1, 1, C.atom); px(g, 20, 4, 1, 1, C.atom);
      px(g, 2, 12, 1, 1, C.atom); px(g, 22, 12, 1, 1, C.atom);
    }
  }

  // ---- short (chibi) Danny: 18x22, same 13 frames at smaller scale ----
  function paintDannySmall(g, frame) {
    var bob = 0, legL = 0, legR = 0;
    var armBack = 'down', armFront = 'down';
    var hurt = false, die = false, victory = false;
    switch (frame) {
      case 'idle1':   bob = 1; break;
      case 'walk0':   legL = -1; legR = 1; armBack = 'fwd';  armFront = 'back'; break;
      case 'walk1':   bob = -1; break;
      case 'walk2':   legL = 1;  legR = -1; armBack = 'back'; armFront = 'fwd';  break;
      case 'walk3':   bob = -1; break;
      case 'jump':    bob = -1; armBack = 'up'; armFront = 'up'; break;
      case 'fall':    armBack = 'out'; armFront = 'out'; break;
      case 'land':    bob = 1; armBack = 'out'; armFront = 'out'; break;
      case 'blast':   armFront = 'forward'; break;
      case 'hurt':    hurt = true; bob = 1; armBack = 'out'; armFront = 'out'; break;
      case 'die':     hurt = true; die = true; break;
      case 'victory': bob = -1; armBack = 'up'; armFront = 'up'; victory = true; break;
    }

    // ===== HEAD =====
    var cy = 0 + bob;
    px(g, 6, cy, 6, 1, C.cap);
    px(g, 5, cy + 1, 8, 1, C.cap);
    px(g, 4, cy + 2, 10, 2, C.cap);
    px(g, 6, cy, 3, 1, C.capL); px(g, 5, cy + 1, 3, 1, C.capL); px(g, 4, cy + 2, 3, 1, C.capL);
    px(g, 4, cy + 3, 10, 1, C.capD);
    px(g, 1, cy + 2, 3, 2, C.cap);
    px(g, 1, cy + 2, 3, 1, C.capL); px(g, 1, cy + 3, 3, 1, C.capD);
    px(g, 12, cy + 4, 3, 4, C.hair);
    px(g, 13, cy + 5, 2, 2, C.hairL);
    px(g, 5, cy + 4, 9, 5, C.skin);
    px(g, 5, cy + 4, 9, 1, C.skinL);
    px(g, 5, cy + 4, 1, 4, C.skinD);
    px(g, 4, cy + 6, 1, 2, C.skin);                          // ear
    if (hurt) {
      px(g, 6, cy + 5, 2, 2, '#ff5d5d');
      px(g, 10, cy + 5, 2, 2, '#ff5d5d');
    } else {
      px(g, 5, cy + 6, 3, 1, C.out); px(g, 6, cy + 6, 1, 1, C.lens);
      px(g, 9, cy + 6, 3, 1, C.out); px(g, 10, cy + 6, 1, 1, C.lens);
      px(g, 8, cy + 6, 1, 1, C.out);                          // bridge
    }
    px(g, 12, cy + 7, 1, 1, C.skinD);                         // nose
    px(g, 5, cy + 8, 9, 1, C.hair);                           // beard line
    px(g, 7, cy + 8, 4, 1, C.skinD);                          // mouth
    px(g, 8, cy + 9, 3, 1, C.skinD);                          // neck

    // ===== TORSO =====
    var by = 10;
    px(g, 3, by, 13, 6, C.coat);
    px(g, 3, by, 2, 6, C.coatL);
    px(g, 14, by, 2, 6, C.coatD);
    px(g, 5, by, 2, 1, C.coatD); px(g, 12, by, 2, 1, C.coatD);
    px(g, 6, by, 1, 6, C.coatD); px(g, 12, by, 1, 6, C.coatD);
    px(g, 7, by, 5, 6, C.shirt);
    px(g, 7, by, 5, 1, C.shirtL);
    // atom (small cross)
    px(g, 9, 11, 1, 1, C.atom);
    px(g, 8, 12, 1, 1, C.atom); px(g, 10, 12, 1, 1, C.atom); px(g, 9, 12, 1, 1, C.atom);
    px(g, 9, 13, 1, 1, C.atom);

    if (!die) {
      // coat tails
      px(g, 2, 16, 3, 2, C.coat); px(g, 13, 16, 3, 2, C.coat);
      px(g, 2, 16, 1, 2, C.coatL); px(g, 15, 16, 1, 2, C.coatD);
    }

    // ===== ARMS =====
    function arm(side, pose) {
      var isBack = side === 'back';
      if (pose === 'forward' && !isBack) {
        px(g, 14, 11, 4, 2, C.coat);
        px(g, 17, 11, 1, 2, C.skin);
        return;
      }
      if (pose === 'forward' && isBack) pose = 'down';
      var dx, ay, ah, handY;
      if (pose === 'down') { dx = isBack ? 1 : 14; ay = 10; ah = 5; handY = 15; }
      else if (pose === 'fwd')  { dx = isBack ? 2 : 13; ay = 11; ah = 4; handY = 15; }
      else if (pose === 'back') { dx = isBack ? 0 : 15; ay = 10; ah = 5; handY = 15; }
      else if (pose === 'up')   { dx = isBack ? 1 : 14; ay = 5 + bob; ah = 4; handY = 4 + bob; }
      else if (pose === 'out')  { dx = isBack ? 0 : 15; ay = 12; ah = 3; handY = 15; }
      else                       { dx = isBack ? 1 : 14; ay = 10; ah = 5; handY = 15; }
      px(g, dx, ay, 2, ah, C.coat);
      if (isBack) px(g, dx, ay, 1, ah, C.coatL);
      else        px(g, dx + 1, ay, 1, ah, C.coatD);
      px(g, dx, handY, 2, 1, C.skin);
      if (!isBack && pose === 'down') px(g, dx, handY - 1, 2, 1, '#d8def0'); // watch
    }
    arm('back', armBack);
    arm('front', armFront);

    // ===== LEGS + SHOES =====
    if (!die) {
      var lx = 4 + legL, rx = 9 + legR;
      px(g, lx, 17, 3, 2, C.jean); px(g, lx, 17, 1, 2, C.jeanL); px(g, lx + 2, 17, 1, 2, C.jeanD);
      px(g, rx, 17, 3, 2, C.jean); px(g, rx, 17, 1, 2, C.jeanL); px(g, rx + 2, 17, 1, 2, C.jeanD);
      px(g, lx - 1, 19, 5, 2, C.shoe); px(g, lx - 1, 19, 5, 1, C.shoeL); px(g, lx - 1, 20, 5, 1, C.shoeD);
      px(g, rx - 1, 19, 5, 2, C.shoe); px(g, rx - 1, 19, 5, 1, C.shoeL); px(g, rx - 1, 20, 5, 1, C.shoeD);
    } else {
      px(g, 1, 19, 16, 2, C.coat);
      px(g, 1, 19, 16, 1, C.coatL);
      px(g, 1, 20, 16, 1, C.coatD);
    }

    if (victory) {
      px(g, 8, 0, 1, 1, C.atom); px(g, 10, 0, 1, 1, C.atom);
      px(g, 1, 4, 1, 1, C.atom); px(g, 16, 4, 1, 1, C.atom);
    }
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
  function paintNPC(g) {
    // long brown hair (no cap)
    px(g, 5, 0, 10, 4, '#6e4a26');
    px(g, 5, 0, 10, 1, '#9a7340');
    px(g, 4, 4, 1, 5, '#6e4a26');
    px(g, 15, 4, 1, 5, '#6e4a26');
    // face
    px(g, 5, 4, 10, 6, C.skin);
    px(g, 5, 4, 10, 1, C.skinL);
    px(g, 5, 5, 1, 4, C.skinD);
    // simple eyes
    px(g, 7, 7, 1, 1, C.out); px(g, 12, 7, 1, 1, C.out);
    // beard
    px(g, 5, 9, 10, 2, '#6e4a26');
    px(g, 8, 9, 4, 1, C.skinD);
    // neck
    px(g, 9, 11, 4, 1, C.skinD);
    // tunic
    px(g, 4, 12, 12, 14, '#c9a374');
    px(g, 4, 12, 2, 14, '#dbb98e');
    px(g, 14, 12, 2, 14, '#a07f4f');
    px(g, 9, 14, 2, 2, '#7a8d3d');   // little leaf accent
    // belt
    px(g, 4, 20, 12, 2, '#7a4f24');
    // arms
    px(g, 2, 13, 2, 9, C.skin);
    px(g, 16, 13, 2, 9, C.skin);
    px(g, 2, 22, 2, 2, C.skin); px(g, 16, 22, 2, 2, C.skin);
    // legs (bare)
    px(g, 6, 26, 3, 4, C.skin); px(g, 11, 26, 3, 4, C.skin);
    // sandals
    px(g, 5, 30, 5, 1, '#6e4a26'); px(g, 10, 30, 5, 1, '#6e4a26');
  }
  function paintVine(g) {
    px(g, 7, 0, 2, 16, '#3a7a32');               // stem
    px(g, 6, 0, 1, 16, '#2c5524');
    px(g, 9, 0, 1, 16, '#5fa14a');
    // leaves
    px(g, 3, 2, 3, 2, '#4c8d3d'); px(g, 4, 1, 2, 1, '#74b65a');
    px(g, 10, 8, 3, 2, '#4c8d3d'); px(g, 11, 7, 2, 1, '#74b65a');
    px(g, 2, 11, 3, 2, '#3a7a32'); px(g, 3, 12, 1, 1, '#74b65a');
    px(g, 11, 13, 3, 2, '#4c8d3d'); px(g, 12, 14, 2, 1, '#74b65a');
  }
  function paintWater(g) {
    px(g, 0, 0, 16, 16, '#2a6cb8');
    px(g, 0, 0, 16, 1, '#3a86d6');
    px(g, 0, 8, 16, 1, '#3a7ac6');
    px(g, 2, 4, 3, 1, '#5fa0e6'); px(g, 9, 11, 3, 1, '#5fa0e6');
    px(g, 11, 3, 2, 1, '#5fa0e6'); px(g, 3, 13, 2, 1, '#5fa0e6');
  }
  function paintWaterTop(g) {
    px(g, 0, 0, 16, 16, '#2a6cb8');
    // wavy surface stripe at top
    px(g, 0, 0, 16, 3, '#74c2ff');
    px(g, 0, 3, 16, 1, '#3a86d6');
    px(g, 2, 1, 3, 1, '#ffffff'); px(g, 8, 0, 3, 1, '#ffffff'); px(g, 13, 1, 2, 1, '#ffffff');
    px(g, 0, 0, 1, 4, '#3a7ac6'); px(g, 15, 0, 1, 4, '#3a7ac6');
    // belly shimmer
    px(g, 4, 9, 3, 1, '#5fa0e6'); px(g, 11, 12, 3, 1, '#5fa0e6');
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
    var frames = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3',
      'jump', 'fall', 'land', 'blast', 'hurt', 'die', 'victory'];
    frames.forEach(function (f) {
      var s = spriteO(18, 22, function (g) { paintDannySmall(g, f); });
      var b = spriteO(24, 36, function (g) { paintDannyBig(g, f); });
      sprites['danny_small_' + f + '_r'] = s;
      sprites['danny_small_' + f + '_l'] = flip(s);
      sprites['danny_big_' + f + '_r'] = b;
      sprites['danny_big_' + f + '_l'] = flip(b);
    });
    // legacy aliases (existing scenes reference 'idle' by old name)
    ['small', 'big'].forEach(function (sz) {
      ['r', 'l'].forEach(function (dir) {
        sprites['danny_' + sz + '_idle_' + dir] = sprites['danny_' + sz + '_idle0_' + dir];
      });
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
    sprites['tile_vine'] = spritePlain(16, 16, paintVine);
    sprites['npc_adam'] = spriteO(20, 31, paintNPC);
    sprites['tile_water'] = spritePlain(16, 16, paintWater);
    sprites['tile_water_top'] = spritePlain(16, 16, paintWaterTop);
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
