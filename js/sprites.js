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
    // ---- themed enemy variants ----
    // cloud (sky / sea-surface / bird-sky / seaside)
    cldA: '#e8ecf5', cldL: '#ffffff', cldB: '#9aa6c2', cldEye: '#3a4055',
    // rock (rocky / savanna)
    rkA:  '#a89884', rkL:  '#cbb89e', rkB:  '#6b5a47', rkEye: '#241c14',
    // leaf (forest / eden / village-dusk)
    lfA:  '#5fb046', lfL:  '#86d860', lfB:  '#3b7a2a', lfStem: '#6a4528',
    // flame (sunlit)
    flA:  '#ff7430', flL:  '#ffd24a', flB:  '#c53a14', flEye: '#fff5d0',
    // bird (sky / sea-surface / bird-sky / seaside / savanna)
    bdA:  '#f7c84a', bdL:  '#ffe890', bdB:  '#b88a18', bdBeak: '#ff7a2a',
    // star (sunlit / cosmic-night / galactic)
    stA:  '#ffe680', stL:  '#ffffff', stB:  '#c69a30',
    // bat (village-dusk)
    btA:  '#5a3f78', btL:  '#7d5fa8', btB:  '#3a2854', btEye: '#ff5e5e',
    // rain (sky / sea-surface)
    rnA:  '#7a8db0', rnL:  '#a9bbe0', rnB:  '#43526f', rnDrop: '#6cd0ff',
    // seed (forest / eden)
    sdA:  '#3e7a32', sdL:  '#6cb44e', sdB:  '#235018', sdSeed: '#d8b97a',
    // sun (sunlit)
    snA:  '#ffc94a', snL:  '#fff2a8', snB:  '#cf8a12', snRay: '#ff8a30',
    // fruit (village-dusk)
    ftA:  '#d44a4a', ftL:  '#ff9090', ftB:  '#7a1f1f', ftLeaf: '#5fb046',
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

  // Sea crab (Day 2-2) - red shell with claws + eyestalks. Frame 0
  // walks, frame 1 has claws raised (about to spit a water jet).
  function paintCrab(g, frame) {
    var lift = frame === 1 ? 1 : 0;
    // shell body
    px(g, 3, 5, 10, 4, '#d44a4a');
    px(g, 4, 4, 8, 1, '#d44a4a');
    px(g, 3, 5, 10, 2, '#ff7a6a');               // top highlight
    px(g, 3, 8, 10, 1, '#7a1f1f');               // shadow
    // shell spots
    px(g, 5, 6, 1, 1, '#7a1f1f'); px(g, 10, 6, 1, 1, '#7a1f1f');
    // eyes on stalks
    px(g, 5, 2, 1, 2, '#d44a4a');
    px(g, 4, 1, 2, 1, '#ffffff'); px(g, 4, 1, 1, 1, '#241010');
    px(g, 10, 2, 1, 2, '#d44a4a');
    px(g, 10, 1, 2, 1, '#ffffff'); px(g, 11, 1, 1, 1, '#241010');
    // mouth
    px(g, 7, 8, 2, 1, '#241010');
    // legs (move with frame)
    var leg = frame === 1 ? 1 : 0;
    px(g, 1, 9, 2, 1, '#7a1f1f'); px(g, 13, 9, 2, 1, '#7a1f1f');
    px(g, 1, 10 + leg, 2, 1, '#7a1f1f'); px(g, 13, 10 - leg, 2, 1, '#7a1f1f');
    px(g, 4, 9, 2, 1, '#7a1f1f'); px(g, 10, 9, 2, 1, '#7a1f1f');
    px(g, 4, 10 - leg, 2, 1, '#7a1f1f'); px(g, 10, 10 + leg, 2, 1, '#7a1f1f');
    // claws (raised when about to throw)
    px(g, 0, 5 - lift, 2, 2, '#d44a4a'); px(g, 14, 5 - lift, 2, 2, '#d44a4a');
    px(g, 0, 4 - lift, 1, 1, '#ff7a6a'); px(g, 15, 4 - lift, 1, 1, '#ff7a6a');
  }

  // ----- themed Walker variants (16w x 14h, frame 0=normal, 1=squish) -----

  // Cloud-puff walker - white blobby cloud with eyes (sky / sea / seaside).
  function paintWalker_cloud(g, frame) {
    var sq = frame === 1 ? 1 : 0, t = 4 + sq;
    px(g, 4, t, 8, 1, C.cldA);
    px(g, 3, t + 1, 10, 1, C.cldA);
    px(g, 2, t + 2, 12, 5 - sq, C.cldA);
    px(g, 3, t + 7 - sq, 10, 1, C.cldA);
    px(g, 4, t + 8 - sq, 8, 1, C.cldA);
    // puffs
    px(g, 1, t + 4, 2, 2, C.cldA); px(g, 13, t + 4, 2, 2, C.cldA);
    // highlight
    px(g, 3, t + 1, 8, 2, C.cldL);
    px(g, 5, t, 5, 1, C.cldL);
    // shading underneath
    px(g, 2, t + 6 - sq, 12, 1, C.cldB);
    // eyes + smile
    px(g, 4, t + 3, 2, 2, C.cldEye);
    px(g, 10, t + 3, 2, 2, C.cldEye);
    px(g, 6, t + 6 - sq, 4, 1, C.cldEye);
  }

  // Rock-crab walker - earthen stone with stubby legs (rocky / savanna).
  function paintWalker_rock(g, frame) {
    var sq = frame === 1 ? 1 : 0, t = 4 + sq;
    px(g, 3, t + 1, 10, 6 - sq, C.rkA);
    px(g, 2, t + 3, 12, 3 - sq, C.rkA);
    px(g, 4, t, 8, 1, C.rkA);
    // top highlights (lit edges)
    px(g, 4, t + 1, 8, 2, C.rkL);
    px(g, 3, t + 3, 1, 1, C.rkL); px(g, 12, t + 3, 1, 1, C.rkL);
    // dark crack/shadow
    px(g, 4, t + 6 - sq, 8, 1, C.rkB);
    px(g, 6, t + 4, 2, 1, C.rkB);
    px(g, 10, t + 4, 1, 1, C.rkB);
    // legs (claws)
    px(g, 2, t + 7 - sq, 2, 2, C.rkB); px(g, 12, t + 7 - sq, 2, 2, C.rkB);
    px(g, 6, t + 7 - sq, 2, 2, C.rkB); px(g, 8, t + 7 - sq, 2, 2, C.rkB);
    // eyes
    px(g, 5, t + 2, 2, 2, C.white); px(g, 10, t + 2, 2, 2, C.white);
    px(g, 6, t + 3, 1, 1, C.rkEye); px(g, 11, t + 3, 1, 1, C.rkEye);
  }

  // Leaf/seed walker - green critter with leaves sprouting (forest / eden / village).
  function paintWalker_leaf(g, frame) {
    var sq = frame === 1 ? 1 : 0, t = 4 + sq;
    // body
    px(g, 4, t + 1, 8, 6 - sq, C.lfA);
    px(g, 3, t + 2, 10, 4 - sq, C.lfA);
    px(g, 5, t, 6, 1, C.lfA);
    // leaf tufts on top
    px(g, 4, t - 1, 2, 1, C.lfL);
    px(g, 10, t - 1, 2, 1, C.lfL);
    px(g, 7, t - 2, 2, 1, C.lfL);
    // highlights
    px(g, 4, t + 1, 8, 1, C.lfL);
    // underside shadow
    px(g, 3, t + 5 - sq, 10, 1, C.lfB);
    // feet
    px(g, 3, t + 7 - sq, 3, 1, C.lfStem);
    px(g, 10, t + 7 - sq, 3, 1, C.lfStem);
    // eyes + smile
    px(g, 5, t + 3, 2, 2, C.white);
    px(g, 9, t + 3, 2, 2, C.white);
    px(g, 6, t + 4, 1, 1, C.out);
    px(g, 10, t + 4, 1, 1, C.out);
    px(g, 6, t + 6 - sq, 4, 1, C.lfB);
  }

  // Flame sprite walker - orange/red flame body (sunlit).
  function paintWalker_flame(g, frame) {
    var sq = frame === 1 ? 1 : 0, t = 4 + sq;
    // flame outline
    px(g, 5, t - 1, 6, 1, C.flA);
    px(g, 4, t, 8, 1, C.flA);
    px(g, 3, t + 1, 10, 6 - sq, C.flA);
    px(g, 4, t + 7 - sq, 8, 1, C.flA);
    // wavy flame tips
    px(g, 4, t - 2, 1, 1, C.flA); px(g, 7, t - 3, 2, 1, C.flA); px(g, 11, t - 2, 1, 1, C.flA);
    // bright core
    px(g, 5, t + 2, 6, 3, C.flL);
    px(g, 6, t + 1, 4, 2, C.flL);
    // dark base
    px(g, 4, t + 6 - sq, 8, 1, C.flB);
    px(g, 3, t + 7 - sq, 2, 1, C.flB); px(g, 11, t + 7 - sq, 2, 1, C.flB);
    // eyes (bright)
    px(g, 5, t + 3, 2, 2, C.flEye); px(g, 9, t + 3, 2, 2, C.flEye);
    px(g, 6, t + 4, 1, 1, C.out); px(g, 10, t + 4, 1, 1, C.out);
  }

  // ----- themed Wisp variants (14w x 14h flying) -----

  // Small bird (sky / sea / bird-sky / seaside / savanna).
  // Hawk silhouette - wider than tall, outstretched wings, pointy beak.
  // Frame 0: wings gliding flat, Frame 1: wings raised (mid-flap).
  function paintWisp_bird(g, frame) {
    var flap = frame === 1 ? 1 : 0;
    // Body (narrow, centered)
    px(g, 6, 5, 4, 4, C.bdA);
    px(g, 5, 6, 6, 2, C.bdL);                    // lighter belly
    px(g, 6, 5, 4, 1, C.bdB);                    // top of body shadow
    // Tail (back, fanned)
    px(g, 0, 6, 5, 1, C.bdA);
    px(g, 1, 7, 4, 1, C.bdB);
    px(g, 0, 5, 3, 1, C.bdA);                    // small upper-tail tuft
    // Wings - the dramatic part. Outstretched flat (frame 0) or raised (frame 1).
    if (flap) {
      // raised wings - swept up + forward, angular
      px(g, 7, 1, 4, 1, C.bdA);
      px(g, 8, 2, 3, 1, C.bdL);
      px(g, 9, 3, 3, 1, C.bdA);
      px(g, 10, 4, 2, 1, C.bdB);
    } else {
      // glide wings - flat, full span
      px(g, 7, 4, 6, 1, C.bdA);
      px(g, 9, 5, 5, 1, C.bdL);
      px(g, 10, 6, 4, 1, C.bdB);
      px(g, 12, 7, 2, 1, C.bdB);                 // wingtip droop
    }
    // Sharp triangular beak
    px(g, 4, 6, 1, 1, C.bdBeak);
    px(g, 3, 6, 1, 1, C.bdBeak);
    // Hawk eye (dark intense)
    px(g, 7, 6, 1, 1, C.bdBeak);
    px(g, 7, 6, 1, 1, C.out);
    // Tail spread silhouette underneath
    px(g, 2, 8, 4, 1, C.bdB);
    px(g, 3, 9, 2, 1, C.bdB);
  }

  // Falling leaf flyer (forest / eden).
  function paintWisp_leaf(g, frame) {
    var b = frame === 1 ? 1 : 0;
    // tilted leaf
    px(g, 4 + b, 2, 6, 1, C.lfA);
    px(g, 3 + b, 3, 8, 2, C.lfA);
    px(g, 2 + b, 5, 10, 3, C.lfA);
    px(g, 3 + b, 8, 8, 2, C.lfA);
    px(g, 4 + b, 10, 6, 1, C.lfA);
    // highlights
    px(g, 4 + b, 3, 4, 2, C.lfL);
    px(g, 3 + b, 5, 3, 2, C.lfL);
    // dark mid-vein
    px(g, 6 + b, 4, 1, 6, C.lfB);
    // stem
    px(g, 9 - b, 11, 2, 2, C.lfStem);
    // tiny eyes (cute leaf face)
    px(g, 4 + b, 6, 1, 1, C.out); px(g, 8 + b, 6, 1, 1, C.out);
  }

  // Star flyer (sunlit / cosmic-night).
  function paintWisp_star(g, frame) {
    var b = frame === 1 ? 1 : 0;
    // 5-point star silhouette
    px(g, 6, 1 + b, 2, 1, C.stA);
    px(g, 5, 2 + b, 4, 2, C.stA);
    px(g, 1, 4 + b, 12, 3, C.stA);
    px(g, 3, 7 + b, 8, 2, C.stA);
    px(g, 1, 9 + b, 3, 1, C.stA); px(g, 10, 9 + b, 3, 1, C.stA);
    px(g, 5, 10 + b, 4, 1, C.stA);
    // bright core
    px(g, 5, 4 + b, 4, 2, C.stL);
    px(g, 6, 3 + b, 2, 1, C.stL);
    // shading
    px(g, 5, 6 + b, 4, 1, C.stB);
    // eyes
    px(g, 4, 5 + b, 1, 1, C.out); px(g, 9, 5 + b, 1, 1, C.out);
  }

  // Bat flyer (village-dusk).
  function paintWisp_bat(g, frame) {
    var b = frame === 1 ? 1 : 0;
    // body
    px(g, 5, 4, 4, 5, C.btA);
    px(g, 6, 3, 2, 1, C.btA);
    // wings (frame-driven flap)
    if (b) {
      px(g, 1, 3, 4, 2, C.btA); px(g, 9, 3, 4, 2, C.btA);
      px(g, 2, 5, 3, 1, C.btA); px(g, 9, 5, 3, 1, C.btA);
    } else {
      px(g, 0, 5, 5, 3, C.btA); px(g, 9, 5, 5, 3, C.btA);
      px(g, 1, 4, 4, 1, C.btL); px(g, 9, 4, 4, 1, C.btL);
    }
    // ears
    px(g, 5, 2, 1, 1, C.btA); px(g, 8, 2, 1, 1, C.btA);
    // belly shadow
    px(g, 5, 7, 4, 1, C.btB);
    // eyes (glowing red)
    px(g, 5, 5, 1, 1, C.btEye); px(g, 8, 5, 1, 1, C.btEye);
  }

  // ----- themed Thrower variants (16w x 16h stationary) -----

  // Rain cloud (sky / sea-surface).
  function paintThrower_rain(g, frame) {
    // puffy cloud body
    px(g, 3, 2, 10, 4, C.rnA);
    px(g, 2, 3, 12, 5, C.rnA);
    px(g, 4, 1, 8, 1, C.rnA);
    // bumpy edges
    px(g, 1, 4, 1, 2, C.rnA); px(g, 14, 4, 1, 2, C.rnA);
    // highlight
    px(g, 3, 2, 10, 2, C.rnL);
    px(g, 4, 1, 6, 1, C.rnL);
    // dark base + dripping
    px(g, 2, 7, 12, 2, C.rnB);
    px(g, 3, 9, 3, 2, C.rnB); px(g, 7, 9, 3, 2, C.rnB); px(g, 11, 9, 3, 2, C.rnB);
    // raindrops below (more on frame 1)
    var lit = frame === 1;
    px(g, 4, 11, 1, 3, C.rnDrop);
    px(g, 8, 11, 1, 3, C.rnDrop);
    px(g, 12, 11, 1, 3, C.rnDrop);
    if (lit) {
      px(g, 3, 14, 1, 1, C.rnDrop);
      px(g, 11, 14, 1, 1, C.rnDrop);
    }
    // eyes
    px(g, 4, 4, 2, 2, C.white); px(g, 10, 4, 2, 2, C.white);
    px(g, 5, 5, 1, 1, C.out); px(g, 11, 5, 1, 1, C.out);
  }

  // Seed pod thrower (forest / eden).
  function paintThrower_seed(g, frame) {
    // bulb body
    px(g, 4, 6, 8, 9, C.sdA);
    px(g, 5, 5, 6, 1, C.sdA);
    px(g, 3, 8, 10, 5, C.sdA);
    // highlight on bulb
    px(g, 4, 7, 4, 2, C.sdL);
    // dark seam
    px(g, 7, 8, 1, 6, C.sdB);
    // little leaves at top sprouting
    px(g, 5, 4, 2, 1, C.lfL); px(g, 9, 4, 2, 1, C.lfL);
    px(g, 6, 3, 1, 1, C.lfL); px(g, 9, 3, 1, 1, C.lfL);
    px(g, 7, 2, 2, 2, C.lfA);
    // seeds in the mouth (visible when ready to throw)
    var lit = frame === 1;
    px(g, 6, 11, 4, 2, lit ? C.sdSeed : C.sdB);
    // eyes
    px(g, 4, 7, 2, 2, C.white); px(g, 10, 7, 2, 2, C.white);
    px(g, 5, 8, 1, 1, C.out); px(g, 11, 8, 1, 1, C.out);
  }

  // Sun caster (sunlit) - bright sun with face.
  function paintThrower_sun(g, frame) {
    // core sun disc
    px(g, 4, 4, 8, 8, C.snA);
    px(g, 3, 5, 10, 6, C.snA);
    px(g, 5, 3, 6, 1, C.snA); px(g, 5, 12, 6, 1, C.snA);
    // bright center
    px(g, 5, 5, 6, 6, C.snL);
    px(g, 6, 4, 4, 8, C.snL);
    // shadow underside
    px(g, 4, 10, 8, 2, C.snB);
    // rays (8 directions; longer/shorter by frame)
    var r = frame === 1 ? 3 : 2;
    for (var i = 0; i < r; i++) {
      px(g, 8, 0 + i, 1, 1, C.snRay);          // up
      px(g, 8, 14 - i, 1, 1, C.snRay);         // down
      px(g, 0 + i, 8, 1, 1, C.snRay);          // left
      px(g, 14 - i, 8, 1, 1, C.snRay);         // right
    }
    // eyes
    px(g, 5, 6, 2, 2, C.out); px(g, 10, 6, 2, 2, C.out);
    px(g, 6, 6, 1, 1, C.white); px(g, 11, 6, 1, 1, C.white);
    // smile
    px(g, 7, 9, 3, 1, C.snB);
  }

  // Stone pillar (rocky / savanna).
  function paintThrower_rock(g, frame) {
    // pillar body
    px(g, 4, 2, 8, 13, C.rkA);
    px(g, 3, 3, 10, 11, C.rkA);
    px(g, 5, 1, 6, 1, C.rkA);
    // top highlight
    px(g, 4, 2, 8, 2, C.rkL);
    px(g, 5, 1, 6, 1, C.rkL);
    // cracks
    px(g, 6, 5, 1, 3, C.rkB);
    px(g, 9, 7, 1, 3, C.rkB);
    px(g, 5, 11, 6, 1, C.rkB);
    // dark base
    px(g, 3, 13, 10, 2, C.rkB);
    // eyes
    var lit = frame === 1;
    px(g, 5, 6, 2, 2, lit ? C.flL : C.white);
    px(g, 9, 6, 2, 2, lit ? C.flL : C.white);
    px(g, 6, 7, 1, 1, C.out); px(g, 10, 7, 1, 1, C.out);
    px(g, 6, 10, 4, 1, C.rkB);                // mouth
  }

  // Fruit thrower (village-dusk) - cute fruit critter (gentle, no scary face).
  function paintThrower_fruit(g, frame) {
    // round fruit body
    px(g, 4, 4, 8, 10, C.ftA);
    px(g, 3, 5, 10, 8, C.ftA);
    px(g, 5, 3, 6, 1, C.ftA);
    // highlight
    px(g, 5, 5, 4, 3, C.ftL);
    px(g, 6, 4, 2, 1, C.ftL);
    // dark side
    px(g, 11, 7, 1, 5, C.ftB);
    // stem + leaf on top
    px(g, 8, 2, 1, 2, C.lfStem);
    px(g, 5, 2, 3, 1, C.ftLeaf);
    px(g, 6, 1, 2, 1, C.ftLeaf);
    // little fruit it's holding (lit when about to throw)
    var lit = frame === 1;
    if (lit) {
      px(g, 4, 11, 2, 2, C.ftA);
      px(g, 10, 11, 2, 2, C.ftA);
    }
    // friendly eyes (closed-ish smile)
    px(g, 5, 7, 1, 1, C.out); px(g, 10, 7, 1, 1, C.out);
    px(g, 6, 9, 4, 1, C.ftB);                // smile
  }

  function paintBlast(g) {
    px(g, 3, 1, 7, 6, C.bl3);
    px(g, 2, 2, 9, 4, C.bl2);
    px(g, 3, 3, 7, 2, C.bl1);
    px(g, 0, 3, 2, 2, C.bl2); px(g, 11, 3, 2, 2, C.bl2);
    px(g, 5, 0, 3, 1, C.bl1); px(g, 5, 7, 3, 1, C.bl1);
  }

  // Solar flare - bright yellow teardrop falling from sky
  function paintFlare(g) {
    px(g, 3, 0, 2, 1, '#ffffff');
    px(g, 2, 1, 4, 2, '#fff4a0');
    px(g, 1, 3, 6, 4, '#ffd048');
    px(g, 1, 7, 6, 2, '#ff9020');
    px(g, 2, 9, 4, 1, '#ff5a18');
    // bright core
    px(g, 3, 3, 2, 3, '#ffffff');
    px(g, 3, 6, 2, 1, '#fff48a');
  }

  // Water jet - small blue droplet stream (Day 2-2 crab)
  function paintWaterJet(g) {
    px(g, 1, 1, 5, 4, '#6cd0ff');
    px(g, 0, 2, 7, 2, '#6cd0ff');
    px(g, 1, 1, 4, 2, '#bce8ff');                // bright top
    px(g, 1, 4, 5, 1, '#3a90c8');                // shadow
    // spray dots
    px(g, 0, 5, 1, 1, '#6cd0ff'); px(g, 6, 5, 1, 1, '#6cd0ff');
    px(g, 2, 0, 2, 1, '#ffffff');                // sparkle highlight
  }

  // Lava plume - tall orange/red column with flickering top
  function paintLavaPlume(g) {
    px(g, 3, 0, 4, 1, '#ffe070');                // bright top
    px(g, 2, 1, 6, 2, '#ff9020');
    px(g, 1, 3, 8, 4, '#ff5418');
    px(g, 2, 7, 6, 3, '#c83214');                // dark base
    px(g, 3, 10, 4, 3, '#7a1c0a');
    // hot core
    px(g, 4, 2, 2, 4, '#ffe890');
    px(g, 4, 6, 2, 2, '#ffd048');
    // licks at the sides
    px(g, 0, 4, 1, 2, '#ff7430');
    px(g, 9, 4, 1, 2, '#ff7430');
  }

  // Meteor - gray/brown rock with a flaming trail
  function paintMeteor(g) {
    // rock body (right half)
    px(g, 3, 2, 6, 4, '#5a4a40');
    px(g, 3, 2, 6, 1, '#8a7a6e');           // top highlight
    px(g, 4, 3, 4, 2, '#7a6a5e');           // lit face
    px(g, 3, 5, 6, 1, '#3a2e24');           // shadow
    // craters
    px(g, 5, 3, 1, 1, '#3a2e24'); px(g, 7, 4, 1, 1, '#3a2e24');
    // flaming trail (left side)
    px(g, 0, 2, 2, 1, '#ff8030');
    px(g, 0, 3, 3, 2, '#ffd048');
    px(g, 0, 5, 2, 1, '#ff5018');
    px(g, 1, 2, 1, 1, '#fff4a0');
    px(g, 1, 5, 1, 1, '#ffffff');
  }

  // ================= tiles (16x16, no outline - they tile) =================
  function paintGround(g) {
    px(g, 0, 0, 16, 16, C.dirt);
    px(g, 0, 0, 16, 5, C.grass);                 // grass cap
    px(g, 0, 0, 16, 2, C.grassL);
    px(g, 0, 4, 16, 1, C.grassD);
    // glassy sheen highlight stripe at the very top
    px(g, 0, 0, 16, 1, '#dfffbf');
    // faint diagonal reflection inside the grass
    px(g, 3, 1, 1, 1, '#ffffff'); px(g, 11, 1, 1, 1, '#ffffff');
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
    // ancient ruined masonry - uneven stones in earthen palette
    px(g, 0, 0, 16, 16, '#4a3320');                // dark mortar base
    // big stone block (upper-left), shape uneven
    px(g, 1, 1, 8, 6, '#9c7440');
    px(g, 1, 1, 8, 1, '#bb9056');                  // highlight
    px(g, 1, 6, 8, 1, '#6d4f24');                  // shadow
    px(g, 2, 2, 1, 1, '#7a5728');                  // chip
    // medium stone (upper-right)
    px(g, 10, 1, 5, 4, '#b68c50');
    px(g, 10, 1, 5, 1, '#d4a766');
    px(g, 10, 4, 5, 1, '#7a5728');
    // stone (mid-right)
    px(g, 10, 6, 5, 4, '#9c7440');
    px(g, 10, 6, 5, 1, '#bb9056');
    px(g, 10, 9, 5, 1, '#6d4f24');
    // small stones bottom row
    px(g, 1, 8, 4, 4, '#a07c44');
    px(g, 1, 8, 4, 1, '#c19262');
    px(g, 1, 11, 4, 1, '#6d4f24');
    px(g, 6, 8, 3, 4, '#8e6938');
    px(g, 6, 8, 3, 1, '#a98052');
    px(g, 6, 11, 3, 1, '#5f4220');
    // bottom stones
    px(g, 1, 13, 6, 3, '#aa7e48');
    px(g, 1, 13, 6, 1, '#c89556');
    px(g, 8, 13, 7, 3, '#92692f');
    px(g, 8, 13, 7, 1, '#b6864a');
    px(g, 8, 15, 7, 1, '#5f4220');
    // small dark chips for character
    px(g, 5, 3, 1, 1, '#6d4f24'); px(g, 12, 2, 1, 1, '#6d4f24');
    px(g, 3, 9, 1, 1, '#6d4f24'); px(g, 13, 8, 1, 1, '#6d4f24');
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
  // glowing white platform for Day 1's "let there be light" theme
  function paintGroundGalactic(g) {
    // body: pale blue holy glow
    px(g, 0, 0, 16, 16, '#a8c4e8');
    // bright cap on top
    px(g, 0, 0, 16, 3, '#ffffff');
    px(g, 0, 3, 16, 1, '#dfe8ff');
    px(g, 0, 4, 16, 1, '#7e9cd4');
    // glassy specular highlight + diagonal reflection
    px(g, 2, 1, 4, 1, '#ffffff'); px(g, 9, 1, 5, 1, '#ffffff');
    px(g, 3, 6, 1, 1, '#ffffff'); px(g, 6, 8, 1, 1, '#ffffff');
    px(g, 9, 10, 1, 1, '#ffffff'); px(g, 12, 12, 1, 1, '#ffffff');
    // subtle sparkles
    px(g, 4, 5, 1, 1, '#cdebff'); px(g, 11, 6, 1, 1, '#cdebff');
    px(g, 7, 11, 1, 1, '#cdebff'); px(g, 14, 9, 1, 1, '#cdebff');
    // darker base
    px(g, 0, 14, 16, 2, '#5070a0');
    px(g, 0, 15, 16, 1, '#374a78');
  }
  function paintDirtGalactic(g) {
    // deep glowing pale blue interior
    px(g, 0, 0, 16, 16, '#7a9ed0');
    px(g, 0, 0, 16, 1, '#9ec0e4');
    // dotted starlit specks
    px(g, 2, 3, 1, 1, '#dfeeff'); px(g, 10, 4, 1, 1, '#dfeeff');
    px(g, 6, 8, 1, 1, '#dfeeff'); px(g, 13, 10, 1, 1, '#dfeeff');
    px(g, 4, 12, 1, 1, '#dfeeff'); px(g, 11, 13, 1, 1, '#dfeeff');
    px(g, 0, 15, 16, 1, '#3f5680');
  }
  function paintBrickGalactic(g) {
    // dark cosmic meteor stone with star specks
    px(g, 0, 0, 16, 16, '#1a1a2e');
    px(g, 1, 1, 7, 6, '#2f2f4a'); px(g, 1, 1, 7, 1, '#4a4a6e');
    px(g, 9, 1, 6, 5, '#262640'); px(g, 9, 1, 6, 1, '#3e3e60');
    px(g, 1, 8, 6, 6, '#2c2c46'); px(g, 1, 8, 6, 1, '#444466');
    px(g, 8, 7, 7, 7, '#272742'); px(g, 8, 7, 7, 1, '#404060');
    // star specks
    px(g, 3, 3, 1, 1, '#ffffff'); px(g, 12, 4, 1, 1, '#bfdfff');
    px(g, 5, 11, 1, 1, '#bfdfff'); px(g, 11, 10, 1, 1, '#ffffff');
    px(g, 0, 15, 16, 1, '#0e0e1c');
  }

  // ---- Bright-Sky family (sky / bird-sky): soft cloud ground ----
  function paintGroundSky(g) {
    px(g, 0, 0, 16, 16, '#cfe1f5');                 // pale cloud body
    px(g, 0, 0, 16, 3, '#ffffff');                  // bright cap
    px(g, 0, 3, 16, 1, '#e8f1ff');
    px(g, 0, 4, 16, 1, '#8fb3da');                  // separator
    // wispy highlights
    px(g, 2, 1, 4, 1, '#ffffff'); px(g, 9, 1, 5, 1, '#ffffff');
    px(g, 3, 6, 2, 1, '#ffffff'); px(g, 9, 7, 2, 1, '#ffffff');
    // soft puff dots
    px(g, 5, 9, 2, 2, '#dceafa'); px(g, 11, 11, 2, 2, '#dceafa');
    // base shadow
    px(g, 0, 14, 16, 2, '#7f9bc4'); px(g, 0, 15, 16, 1, '#5d769e');
  }
  function paintDirtSky(g) {
    px(g, 0, 0, 16, 16, '#a5c1e1');
    px(g, 0, 0, 16, 1, '#c2d8ef');
    px(g, 2, 3, 1, 1, '#ffffff'); px(g, 10, 5, 1, 1, '#ffffff');
    px(g, 6, 9, 1, 1, '#dceafa'); px(g, 13, 11, 1, 1, '#dceafa');
    px(g, 0, 15, 16, 1, '#5d769e');
  }
  function paintBrickSky(g) {
    // pillowy white/blue cloud bricks
    px(g, 0, 0, 16, 16, '#7195c0');
    px(g, 1, 1, 7, 6, '#e8f1ff'); px(g, 1, 1, 7, 1, '#ffffff');
    px(g, 9, 1, 6, 5, '#dceafa'); px(g, 9, 1, 6, 1, '#ffffff');
    px(g, 1, 8, 6, 6, '#dceafa'); px(g, 1, 8, 6, 1, '#ffffff');
    px(g, 8, 7, 7, 7, '#e8f1ff'); px(g, 8, 7, 7, 1, '#ffffff');
    px(g, 0, 15, 16, 1, '#5d769e');
  }

  // ---- Sea family (sea-surface / seaside): sandy beach + coral ----
  function paintGroundSea(g) {
    px(g, 0, 0, 16, 16, '#d4b066');                 // sand body
    px(g, 0, 0, 16, 3, '#f4d68c');                  // pale top sand
    px(g, 0, 3, 16, 1, '#ecc77a');
    px(g, 0, 4, 16, 1, '#a07a3e');                  // separator
    // sparkle highlights (sun on sand)
    px(g, 3, 1, 1, 1, '#ffffff'); px(g, 11, 2, 1, 1, '#ffffff');
    // shells / pebbles
    px(g, 4, 8, 2, 1, '#ffead0'); px(g, 11, 11, 2, 1, '#ffead0');
    px(g, 7, 12, 1, 1, '#9a6f30'); px(g, 2, 13, 1, 1, '#9a6f30');
    px(g, 0, 15, 16, 1, '#7c5520');
  }
  function paintDirtSea(g) {
    px(g, 0, 0, 16, 16, '#b89052');
    px(g, 0, 0, 16, 1, '#d4ad6c');
    px(g, 2, 3, 2, 1, '#9a6f30'); px(g, 10, 5, 3, 2, '#9a6f30');
    px(g, 5, 9, 2, 2, '#9a6f30'); px(g, 12, 12, 2, 1, '#9a6f30');
    px(g, 7, 6, 1, 1, '#ffead0'); px(g, 4, 12, 1, 1, '#ffead0');
    px(g, 0, 15, 16, 1, '#7c5520');
  }
  function paintBrickSea(g) {
    // coral brick - pinkish/orange chunks
    px(g, 0, 0, 16, 16, '#7c4434');
    px(g, 1, 1, 7, 6, '#ff8a72'); px(g, 1, 1, 7, 1, '#ffb09a');
    px(g, 9, 1, 6, 5, '#e07058'); px(g, 9, 1, 6, 1, '#ff9a82');
    px(g, 1, 8, 6, 6, '#e57860'); px(g, 1, 8, 6, 1, '#ffa68f');
    px(g, 8, 7, 7, 7, '#d56850'); px(g, 8, 7, 7, 1, '#f08e76');
    // coral pores
    px(g, 3, 3, 1, 1, '#7c4434'); px(g, 12, 4, 1, 1, '#7c4434');
    px(g, 5, 11, 1, 1, '#7c4434'); px(g, 11, 10, 1, 1, '#7c4434');
    px(g, 0, 15, 16, 1, '#4a2820');
  }

  // ---- Rocky family (rocky / savanna): gray-tan stone ----
  function paintGroundRocky(g) {
    px(g, 0, 0, 16, 16, '#8a7a6c');                 // stone body
    px(g, 0, 0, 16, 3, '#b09e88');                  // weathered top
    px(g, 0, 3, 16, 1, '#a08e78');
    px(g, 0, 4, 16, 1, '#6a5c4e');                  // separator
    // small grass tufts
    px(g, 2, 0, 1, 2, '#7ab846'); px(g, 8, 0, 1, 1, '#7ab846');
    // chips + cracks
    px(g, 4, 6, 3, 1, '#6a5c4e'); px(g, 11, 8, 2, 1, '#6a5c4e');
    px(g, 3, 11, 2, 1, '#a89784'); px(g, 9, 12, 3, 1, '#a89784');
    px(g, 6, 9, 1, 1, '#544638'); px(g, 13, 10, 1, 1, '#544638');
    px(g, 0, 15, 16, 1, '#3e3328');
  }
  function paintDirtRocky(g) {
    px(g, 0, 0, 16, 16, '#776656');
    px(g, 0, 0, 16, 1, '#8d7a68');
    px(g, 3, 3, 2, 2, '#544638'); px(g, 10, 5, 3, 2, '#544638');
    px(g, 5, 9, 2, 2, '#544638'); px(g, 11, 11, 2, 2, '#544638');
    px(g, 7, 7, 1, 1, '#a89784'); px(g, 2, 11, 1, 1, '#a89784');
    px(g, 0, 15, 16, 1, '#3e3328');
  }
  function paintBrickRocky(g) {
    // jagged gray rock chunks
    px(g, 0, 0, 16, 16, '#3a2f28');
    px(g, 1, 1, 7, 6, '#7c6c5e'); px(g, 1, 1, 7, 1, '#a08e78');
    px(g, 9, 1, 6, 5, '#6e5e50'); px(g, 9, 1, 6, 1, '#8d7a68');
    px(g, 1, 8, 6, 6, '#705f50'); px(g, 1, 8, 6, 1, '#8d7a68');
    px(g, 8, 7, 7, 7, '#6a5a4c'); px(g, 8, 7, 7, 1, '#8a7868');
    // cracks
    px(g, 4, 3, 1, 2, '#3a2f28'); px(g, 11, 9, 1, 3, '#3a2f28');
    px(g, 0, 15, 16, 1, '#241c14');
  }

  // ---- Sunlit family (sunlit): gold sand ----
  function paintGroundSunlit(g) {
    px(g, 0, 0, 16, 16, '#e8a346');                 // warm sand body
    px(g, 0, 0, 16, 3, '#ffd068');                  // bright sun-bleached cap
    px(g, 0, 3, 16, 1, '#f8b860');
    px(g, 0, 4, 16, 1, '#a86820');                  // separator
    // glittering specks
    px(g, 3, 1, 1, 1, '#ffffff'); px(g, 11, 2, 1, 1, '#ffffff');
    px(g, 6, 1, 1, 1, '#fff4c0');
    // small dunes / pebbles
    px(g, 4, 8, 3, 1, '#c08030'); px(g, 11, 11, 3, 1, '#c08030');
    px(g, 7, 12, 1, 1, '#7e4e16'); px(g, 2, 13, 1, 1, '#7e4e16');
    px(g, 0, 15, 16, 1, '#7e4e16');
  }
  function paintDirtSunlit(g) {
    px(g, 0, 0, 16, 16, '#c98330');
    px(g, 0, 0, 16, 1, '#dc9842');
    px(g, 3, 3, 2, 1, '#7e4e16'); px(g, 11, 5, 2, 1, '#7e4e16');
    px(g, 6, 9, 2, 2, '#7e4e16'); px(g, 12, 12, 2, 1, '#7e4e16');
    px(g, 4, 7, 1, 1, '#fff4c0'); px(g, 10, 11, 1, 1, '#fff4c0');
    px(g, 0, 15, 16, 1, '#5e3a10');
  }
  function paintBrickSunlit(g) {
    // sandstone blocks
    px(g, 0, 0, 16, 16, '#7e4e16');
    px(g, 1, 1, 7, 6, '#e0a050'); px(g, 1, 1, 7, 1, '#ffc878');
    px(g, 9, 1, 6, 5, '#cc923c'); px(g, 9, 1, 6, 1, '#f0b462');
    px(g, 1, 8, 6, 6, '#d4983e'); px(g, 1, 8, 6, 1, '#f4b86a');
    px(g, 8, 7, 7, 7, '#c88a32'); px(g, 8, 7, 7, 1, '#eaae5a');
    // grain lines
    px(g, 2, 3, 4, 1, '#a06820'); px(g, 11, 4, 3, 1, '#946018');
    px(g, 2, 10, 4, 1, '#a06820'); px(g, 10, 11, 4, 1, '#946018');
    px(g, 0, 15, 16, 1, '#5e3a10');
  }

  // ---- Lush brick variant (forest/eden/village-dusk): mossy stone ----
  function paintBrickLush(g) {
    px(g, 0, 0, 16, 16, '#3a2818');                 // dark earth mortar
    px(g, 1, 1, 7, 6, '#7c6238'); px(g, 1, 1, 7, 1, '#9a7e4e');
    px(g, 9, 1, 6, 5, '#6e5530'); px(g, 9, 1, 6, 1, '#8c7048');
    px(g, 1, 8, 6, 6, '#705730'); px(g, 1, 8, 6, 1, '#8e7148');
    px(g, 8, 7, 7, 7, '#6a5028'); px(g, 8, 7, 7, 1, '#8a6e44');
    // moss tufts
    px(g, 2, 1, 2, 1, '#5fa14a'); px(g, 11, 1, 2, 1, '#5fa14a');
    px(g, 6, 8, 1, 1, '#74b65a'); px(g, 14, 7, 1, 1, '#74b65a');
    // small chips
    px(g, 5, 5, 1, 1, '#3a2818'); px(g, 12, 11, 1, 1, '#3a2818');
    px(g, 0, 15, 16, 1, '#1f1408');
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
    // outer metal casing
    var shellL = used ? '#7a6850' : '#cfa05a';
    var shellD = used ? '#544632' : '#8a6028';
    var shell  = used ? '#9a8062' : '#b08040';
    px(g, 0, 0, 16, 16, shellD);
    px(g, 1, 1, 14, 14, shell);
    px(g, 1, 1, 14, 2, shellL);              // top bevel
    px(g, 1, 1, 2, 14, shellL);              // left bevel
    px(g, 1, 13, 14, 2, shellD);             // bottom shade
    px(g, 13, 1, 2, 14, shellD);
    // corner rivets
    px(g, 2, 2, 1, 1, shellD); px(g, 13, 2, 1, 1, shellD);
    px(g, 2, 13, 1, 1, shellD); px(g, 13, 13, 1, 1, shellD);

    // dark inset window in centre
    var winDark = used ? '#1d1814' : '#0f1422';
    var winLit  = used ? '#3a322a' : '#5fcfff';
    var spark   = used ? '#5a4e3c' : '#bff0ff';
    px(g, 4, 4, 8, 8, winDark);
    // glowing core
    px(g, 6, 6, 4, 4, winLit);
    px(g, 7, 7, 2, 2, spark);
    if (!used) {
      // tiny circuit traces
      px(g, 4, 7, 1, 1, '#2c8cb0'); px(g, 11, 7, 1, 1, '#2c8cb0');
      px(g, 7, 4, 1, 1, '#2c8cb0'); px(g, 8, 11, 1, 1, '#2c8cb0');
    }
    // cogs at corners (3x3 each)
    function cog(cx, cy) {
      var dark = used ? '#3a3026' : '#4a3a1e';
      var lite = used ? '#7a6850' : '#e6b870';
      px(g, cx - 1, cy, 3, 1, dark);
      px(g, cx, cy - 1, 1, 3, dark);
      px(g, cx, cy, 1, 1, lite);
    }
    cog(3, 3); cog(12, 3); cog(3, 12); cog(12, 12);
  }
  function paintMovPlat(g) {
    // warm brass / dark wood hover plank instead of cold blue metal
    px(g, 0, 0, 36, 13, '#4a3220');
    px(g, 1, 1, 34, 10, '#8b6a3c');
    px(g, 1, 1, 34, 2, '#c4a070');                 // top highlight
    px(g, 1, 9, 34, 2, '#5c4126');                 // bottom shade
    px(g, 0, 12, 36, 1, '#2a1a0e');
    // brass bolts evenly spaced
    for (var i = 4; i < 33; i += 8) {
      px(g, i, 3, 3, 3, '#3a2a14');
      px(g, i, 3, 3, 1, '#e6c486');
      px(g, i + 1, 4, 1, 1, '#fff4d0');
    }
    // soft glow underline
    px(g, 2, 11, 32, 1, 'rgba(255,200,120,0.4)');
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

      // ---- themed enemy variants ----
      // Walker re-skins keyed by variant suffix
      var WALK_VARS = {
        cloud: paintWalker_cloud,
        rock:  paintWalker_rock,
        leaf:  paintWalker_leaf,
        flame: paintWalker_flame
      };
      Object.keys(WALK_VARS).forEach(function (k) {
        var painter = WALK_VARS[k];
        var s = spriteO(16, 14, function (g) { painter(g, i); });
        sprites['walker_' + i + '_r_' + k] = s;
        sprites['walker_' + i + '_l_' + k] = flip(s);
      });

      // Wisp re-skins
      var WISP_VARS = {
        bird: paintWisp_bird,
        leaf: paintWisp_leaf,
        star: paintWisp_star,
        bat:  paintWisp_bat
      };
      Object.keys(WISP_VARS).forEach(function (k) {
        var painter = WISP_VARS[k];
        sprites['wisp_' + i + '_' + k] = spriteO(14, 14, function (g) { painter(g, i); });
      });

      // Thrower re-skins
      var THROW_VARS = {
        rain:  paintThrower_rain,
        seed:  paintThrower_seed,
        sun:   paintThrower_sun,
        rock:  paintThrower_rock,
        fruit: paintThrower_fruit
      };
      Object.keys(THROW_VARS).forEach(function (k) {
        var painter = THROW_VARS[k];
        var ts = spriteO(16, 16, function (g) { painter(g, i); });
        sprites['thrower_' + i + '_r_' + k] = ts;
        sprites['thrower_' + i + '_l_' + k] = flip(ts);
      });
    });

    sprites['orb'] = spriteO(9, 8, paintOrb);
    sprites['flare'] = spriteO(8, 10, paintFlare);
    sprites['lavaplume'] = spriteO(10, 13, paintLavaPlume);
    var mtr = spriteO(10, 8, paintMeteor);
    sprites['meteor_r'] = mtr;
    sprites['meteor_l'] = flip(mtr);
    var wj = spriteO(7, 6, paintWaterJet);
    sprites['waterjet_r'] = wj;
    sprites['waterjet_l'] = flip(wj);
    // Sea crab (Day 2-2) - 16x14 walker variant.
    [0, 1].forEach(function (f) {
      var c = spriteO(16, 12, function (g) { paintCrab(g, f); });
      sprites['crab_' + f + '_r'] = c;
      sprites['crab_' + f + '_l'] = flip(c);
    });
    var bl = spriteO(13, 8, paintBlast);
    sprites['playerblast_r'] = bl;
    sprites['playerblast_l'] = flip(bl);
    sprites['movplat'] = spriteO(36, 13, paintMovPlat);
    sprites['timepart'] = spriteO(16, 16, paintTimePart);

    sprites['tile_ground'] = spritePlain(16, 16, paintGround);
    sprites['tile_dirt'] = spritePlain(16, 16, paintDirt);
    sprites['tile_brick'] = spritePlain(16, 16, paintBrick);
    sprites['tile_platform'] = spritePlain(16, 16, paintPlatform);

    // ---- Themed tile variants per family ----
    // Family painters
    var FAM_PAINTERS = {
      cosmic:    { ground: paintGroundGalactic, dirt: paintDirtGalactic, brick: paintBrickGalactic },
      'bright-sky': { ground: paintGroundSky,   dirt: paintDirtSky,      brick: paintBrickSky },
      sea:       { ground: paintGroundSea,      dirt: paintDirtSea,      brick: paintBrickSea },
      rocky:     { ground: paintGroundRocky,    dirt: paintDirtRocky,    brick: paintBrickRocky },
      sunlit:    { ground: paintGroundSunlit,   dirt: paintDirtSunlit,   brick: paintBrickSunlit },
      lush:      { ground: paintGround,         dirt: paintDirt,         brick: paintBrickLush }
    };
    // Theme -> family
    var THEME_FAMILY = {
      'galactic':     'cosmic',
      'cosmic-night': 'cosmic',
      'sky':          'bright-sky',
      'bird-sky':     'bright-sky',
      'sea-surface':  'sea',
      'seaside':      'sea',
      'rocky':        'rocky',
      'savanna':      'rocky',
      'sunlit':       'sunlit',
      'forest':       'lush',
      'eden':         'lush',
      'village-dusk': 'lush'
    };
    Object.keys(THEME_FAMILY).forEach(function (theme) {
      var fam = FAM_PAINTERS[THEME_FAMILY[theme]];
      sprites['tile_ground_' + theme] = spritePlain(16, 16, fam.ground);
      sprites['tile_dirt_'   + theme] = spritePlain(16, 16, fam.dirt);
      sprites['tile_brick_'  + theme] = spritePlain(16, 16, fam.brick);
    });
    // legacy galactic-named aliases (some existing code paths use this)
    sprites['tile_ground_galactic'] = sprites['tile_ground_galactic'];
    sprites['tile_dirt_galactic']   = sprites['tile_dirt_galactic'];
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

  // ---- PixelLab Danny sprite loader -----------------------------------
  // Asynchronously loads the real PNG-per-frame sprite sheets that PixelLab
  // exported (assets/Super Dude Danny ...). Once every frame has loaded
  // (or failed), pixelLab.ready flips true and the Player.draw uses the
  // real art. Falls back to the code-drawn Danny if the assets are missing.
  var PL_BIG  = 'assets/Super Dude Danny Big Sprites/superdude dany big/animations';
  var PL_SM   = 'assets/Super Dude Danny Small Sprites -';
  var PL_MANIFEST = {
    big: {
      base: PL_BIG,
      anims: {
        idle:      { folder: 'Breathing_Idle-d3deb533', frames: 4 },
        walk:      { folder: 'Walk-a2ee175e',           frames: 6 },
        run:       { folder: 'Running-b41545c8',        frames: 4 },
        jump:      { folder: 'Jumping-74f7c99d',        frames: 9 },
        blast:     { folder: 'Blast-7c8ae1e9',          frames: 3 },
        hurt:      { folder: 'Taking_Punch-a33d4f84',   frames: 6 },
        die:       { folder: 'Falling_Back_Death-e9590e90', frames: 7 },
        celebrate: { folder: 'Celebration_Southward-947d4e92', frames: 9, south: true }
      }
    },
    small: {
      base: PL_SM,
      anims: {
        idle:      { folder: 'Super Dude Danny Small Sprites - Breathing_Idle-a56ef1e4', frames: 4 },
        walk:      { folder: 'Super Dude Danny Small Sprites - walk-',                    frames: 6 },
        run:       { folder: 'Super Dude Danny Small Sprites - Running-393e3511',         frames: 4 },
        jump:      { folder: 'Super Dude Danny Small Sprites - Jumping-f1b9a485',         frames: 9 },
        blast:     { folder: 'Super Dude Danny Small Sprites - blast-40255b94',           frames: 6 },
        hurt:      { folder: 'Super Dude Danny Small Sprites - Taking_Punch-6de79945',    frames: 6 },
        die:       { folder: 'Super Dude Danny Small Sprites - Falling_Back_Death-e41fb900', frames: 7 },
        celebrate: { folder: 'Super Dude Danny Small Sprites - Celebrating_southward-8d9f3045', frames: 9, south: true }
      }
    }
  };
  // Target on-screen height of the CHARACTER (not the padded PNG canvas).
  // The renderer crops each frame to the per-animation non-transparent
  // bounding box and scales the crop to this height. Big > small gives
  // the "I just took a hit" health-bar feedback.
  var PL_DISPLAY_H = { big: 36, small: 26 };

  // Precomputed per-animation union bounding boxes (non-transparent
  // pixels) for every PixelLab frame. The PNGs have huge transparent
  // padding around the character, so we crop to these and scale up to
  // PL_DISPLAY_H. Generated by /tmp/measure_sprites.js + gen_union_bboxes.js.
  var PL_BBOX = {
    big: {
      idle:      { east: { x: 39, y: 26, w: 17, h: 46 }, west: { x: 40, y: 26, w: 17, h: 46 } },
      walk:      { east: { x: 38, y: 25, w: 22, h: 47 }, west: { x: 36, y: 25, w: 22, h: 47 } },
      run:       { east: { x: 35, y: 25, w: 26, h: 48 }, west: { x: 35, y: 25, w: 26, h: 48 } },
      jump:      { east: { x: 31, y: 25, w: 37, h: 50 }, west: { x: 30, y: 26, w: 35, h: 49 } },
      blast:     { east: { x: 35, y: 26, w: 34, h: 46 }, west: { x: 26, y: 27, w: 33, h: 45 } },
      hurt:      { east: { x: 33, y: 26, w: 30, h: 47 }, west: { x: 33, y: 26, w: 30, h: 47 } },
      die:       { east: { x: 32, y: 26, w: 39, h: 46 }, west: { x: 25, y: 26, w: 39, h: 46 } },
      celebrate: { south: { x: 27, y: 23, w: 44, h: 49 } }
    },
    small: {
      idle:      { east: { x: 36, y: 24, w: 19, h: 45 }, west: { x: 35, y: 24, w: 20, h: 45 } },
      walk:      { east: { x: 36, y: 24, w: 22, h: 45 }, west: { x: 35, y: 24, w: 20, h: 45 } },
      run:       { east: { x: 31, y: 25, w: 28, h: 45 }, west: { x: 34, y: 24, w: 24, h: 46 } },
      jump:      { east: { x: 33, y: 26, w: 28, h: 45 }, west: { x: 30, y: 26, w: 29, h: 45 } },
      blast:     { east: { x: 35, y: 25, w: 28, h: 44 }, west: { x: 29, y: 25, w: 28, h: 44 } },
      hurt:      { east: { x: 30, y: 26, w: 28, h: 43 }, west: { x: 34, y: 26, w: 28, h: 43 } },
      die:       { east: { x: 29, y: 25, w: 36, h: 44 }, west: { x: 28, y: 26, w: 33, h: 42 } },
      celebrate: { south: { x: 24, y: 22, w: 44, h: 47 } }
    }
  };

  var pixelLab = { ready: false, frames: {}, bboxes: PL_BBOX, pending: 0, total: 0, failed: 0 };

  function loadPixelLab() {
    function done() { if (--pixelLab.pending === 0) pixelLab.ready = true; }
    Object.keys(PL_MANIFEST).forEach(function (size) {
      var m = PL_MANIFEST[size];
      pixelLab.frames[size] = {};
      Object.keys(m.anims).forEach(function (anim) {
        var a = m.anims[anim];
        pixelLab.frames[size][anim] = {};
        var dirs = a.south ? ['south'] : ['east', 'west'];
        dirs.forEach(function (dir) {
          pixelLab.frames[size][anim][dir] = [];
          for (var f = 0; f < a.frames; f++) {
            var fn = 'frame_' + (f < 10 ? '00' + f : f < 100 ? '0' + f : '' + f) + '.png';
            var url = encodeURI(m.base + '/' + a.folder + '/' + dir + '/' + fn);
            var img = new Image();
            pixelLab.pending++; pixelLab.total++;
            img.onload  = done;
            img.onerror = function () { pixelLab.failed++; done(); };
            img.src = url;
            pixelLab.frames[size][anim][dir][f] = img;
          }
        });
      });
    });
  }
  function pixFrame(size, anim, dir, idx) {
    if (!pixelLab.ready) return null;
    var ms = pixelLab.frames[size]; if (!ms) return null;
    var ma = ms[anim];               if (!ma) return null;
    var md = ma[dir] || ma.east || ma.south;
    if (!md || !md.length) return null;
    return md[((idx % md.length) + md.length) % md.length] || null;
  }
  function pixBBox(size, anim, dir) {
    var ms = PL_BBOX[size]; if (!ms) return null;
    var ma = ms[anim];      if (!ma) return null;
    return ma[dir] || ma.east || ma.south || null;
  }
  // Draw a PixelLab frame at the target character height, cropped to the
  // per-animation union bbox and bottom-centered at (cx, baselineY).
  // Returns true on success, false if the frame/bbox aren't ready.
  function pixDraw(ctx, size, anim, dir, idx, cx, baselineY) {
    var img = pixFrame(size, anim, dir, idx);
    if (!img || !img.complete || !img.naturalWidth) return false;
    var bb = pixBBox(size, anim, dir);
    if (!bb) return false;
    var dispH = PL_DISPLAY_H[size];
    var scale = dispH / bb.h;
    var dispW = Math.round(bb.w * scale);
    var dH = Math.round(bb.h * scale);
    var dx = Math.round(cx - dispW / 2);
    var dy = Math.round(baselineY - dH);
    ctx.drawImage(img, bb.x, bb.y, bb.w, bb.h, dx, dy, dispW, dH);
    return true;
  }
  // kick off loading at boot
  loadPixelLab();

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
    pixelLab: pixelLab,
    pixDisplayH: PL_DISPLAY_H,
    pixFrame: pixFrame,
    pixBBox: pixBBox,
    pixDraw: pixDraw,
    // Convenience: draw PixelLab Danny at the same (x, y) top-left that
    // the old code-drawn sprites used in scenes (menu, intro, finale,
    // overworld, results, game over). Falls back to the code-drawn art
    // if PixelLab isn't loaded.
    drawDanny: function (g, size, anim, dir, idx, x, y) {
      var oldW = size === 'big' ? 28 : 22;
      var oldH = size === 'big' ? 38 : 24;
      if (pixelLab.ready && pixelLab.failed === 0 &&
          pixDraw(g, size, anim, dir, idx, x + oldW / 2, y + oldH)) return;
      var legacy = anim === 'celebrate' ? 'victory' : anim;
      var s = sprites['danny_' + size + '_' + legacy + '_' + (dir === 'east' ? 'r' : 'l')];
      if (s) g.drawImage(s, x, y);
    },
    hasRealLogo: function () { return realLogoOk; },
    realLogo: function () { return realLogo; }
  };
})();
