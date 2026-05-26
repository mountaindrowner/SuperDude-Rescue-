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
    // bird (sky / sea-surface / bird-sky / seaside / savanna) - warm
    // peach / coral palette so the birds don't read as the same yellow
    // as the sun + cores.
    bdA:  '#f08850', bdL:  '#ffc090', bdB:  '#a04420', bdBeak: '#3a1410',
    // star (sunlit / cosmic-night / galactic)
    stA:  '#ffe680', stL:  '#ffffff', stB:  '#c69a30',
    // bat (village-dusk)
    btA:  '#5a3f78', btL:  '#7d5fa8', btB:  '#3a2854', btEye: '#ff5e5e',
    // jellyfish (seaside) - translucent magenta/pink bell + trailing tentacles
    jfA:  '#d878d8', jfL:  '#ffaee8', jfB:  '#8a3a90', jfEye: '#3a1234',
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

  // Thunderbolt - jagged yellow lightning bolt with white core.
  // Used by storm-cloud shooter wisps (Day 2-1) instead of purple orbs.
  function paintBolt(g) {
    var Y = '#ffd23a', W = '#ffffff', O = '#1a1640';
    // Black outline first so the bolt reads on any background.
    px(g, 5, 0, 2, 1, O); px(g, 4, 1, 3, 1, O); px(g, 3, 2, 3, 1, O);
    px(g, 2, 3, 3, 1, O); px(g, 3, 4, 4, 1, O); px(g, 2, 5, 3, 1, O);
    px(g, 1, 6, 4, 1, O); px(g, 2, 7, 2, 1, O);
    // Yellow body
    px(g, 5, 1, 1, 1, Y); px(g, 4, 2, 2, 1, Y);
    px(g, 3, 3, 2, 1, Y); px(g, 4, 4, 2, 1, Y);
    px(g, 3, 5, 1, 1, Y); px(g, 2, 6, 2, 1, Y);
    // Bright white spine
    px(g, 4, 3, 1, 1, W); px(g, 4, 5, 1, 1, W);
    px(g, 3, 6, 1, 1, W);
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

  // Clam walker (Day 2-2 sea-surface only) - pink/cream shell with a
  // visible hinge + soft mantle peeking out + cute eyes. Frame 0
  // shell closed, frame 1 slightly open.
  function paintWalker_clam(g, frame) {
    var b = frame === 1 ? 1 : 0;
    var sh = '#f4c0c4', shL = '#ffe0d8', shD = '#a85a60', mn = '#fff4d0', eye = '#1a1640';
    // Lower shell (flat clam bottom)
    px(g, 1, 8, 14, 3, sh);
    px(g, 0, 9, 16, 2, sh);
    px(g, 1, 10, 14, 1, shD);                         // shadow line
    // Upper shell (dome)
    px(g, 2, 4, 12, 4, sh);
    px(g, 1, 5, 14, 3, sh);
    px(g, 3, 3, 10, 1, sh);
    // Highlight along the top
    px(g, 3, 4, 8, 1, shL);
    px(g, 4, 3, 6, 1, shL);
    // Hinge / shell ribs (subtle vertical lines)
    px(g, 4, 5, 1, 3, shD);
    px(g, 8, 5, 1, 3, shD);
    px(g, 11, 5, 1, 3, shD);
    // Slight gap between upper + lower shell (the "mouth")
    px(g, 2, 8 - b, 12, 1, mn);
    // Tiny eyes peeking
    px(g, 5, 6, 1, 1, eye);
    px(g, 10, 6, 1, 1, eye);
  }

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

  // Lion (Day 6-1 savanna). Full-bodied predator silhouette: shaggy
  // mane wider than the body, tapered haunches, four articulated
  // legs, prominent tail with tuft. Frame 1 squashes one row for the
  // prowl crouch. Mark, batch B: "way more definition and body
  // silhouette - it's a lion."
  function paintWalker_lion(g, frame) {
    var sq = frame === 1 ? 1 : 0, t = 3 + sq;             // top row of the silhouette
    var body = '#d89860', bodyD = '#a8682c', mane = '#7a3c12',
        maneL = '#b86838', dk = '#3a2008', light = '#ffe098',
        eye = '#1a1640', tuft = '#5a280c';

    // --- Tail (left side) + tuft ---
    px(g, 0, t + 3, 1, 1, body);
    px(g, 1, t + 2, 1, 3, body);
    px(g, 2, t + 1, 1, 2, body);
    px(g, 0, t + 4, 1, 1, tuft);                          // dark tuft pixel

    // --- Body (low, tapered) ---
    // Haunches (back-left) thicker than shoulders.
    px(g, 2, t + 3, 4, 4 - sq, body);                     // rear chunk
    px(g, 3, t + 2, 8, 1, bodyD);                         // spine top dark
    px(g, 4, t + 3, 7, 4 - sq, body);                     // mid body
    px(g, 4, t + 3, 6, 1, light);                         // back highlight
    px(g, 3, t + 6 - sq, 8, 1, bodyD);                    // belly shadow

    // --- Mane (right side, bigger than head) ---
    px(g, 9,  t,     5, 1, mane);                         // top puff
    px(g, 8,  t + 1, 7, 2, mane);                         // upper mane
    px(g, 8,  t + 3, 7, 3, mane);                         // mid mane
    px(g, 9,  t + 5, 6, 1, mane);                         // lower mane
    // Mane highlights / texture
    px(g, 10, t,     1, 1, maneL);
    px(g, 13, t,     1, 1, maneL);
    px(g, 9,  t + 2, 1, 1, maneL);
    px(g, 13, t + 3, 1, 1, maneL);
    px(g, 11, t + 5, 1, 1, maneL);
    // Stray mane tufts that break the silhouette outline
    px(g, 8,  t,     1, 1, mane);
    px(g, 14, t + 2, 1, 1, mane);
    px(g, 14, t + 4, 1, 1, mane);

    // --- Face (inside mane) ---
    px(g, 11, t + 2, 3, 3, body);                         // face
    px(g, 12, t + 3, 1, 1, eye);                          // eye
    px(g, 13, t + 4, 1, 1, dk);                           // nose
    px(g, 11, t + 4, 1, 1, dk);                           // mouth corner

    // --- Legs: 4 visible (front pair right of mane, back pair left) ---
    px(g, 3, t + 7 - sq, 1, 2, body);                     // back-far leg
    px(g, 4, t + 7 - sq, 1, 2, dk);                       // paw
    px(g, 6, t + 7 - sq, 1, 2, body);                     // back-near leg
    px(g, 7, t + 7 - sq, 1, 2, dk);                       // paw
    px(g, 9, t + 7 - sq, 1, 2, body);                     // front-near leg
    px(g, 10, t + 7 - sq, 1, 2, dk);                      // paw
    px(g, 12, t + 7 - sq, 1, 2, body);                    // front-far leg
    px(g, 13, t + 7 - sq, 1, 2, dk);                      // paw
  }

  // Goliath beetle walker (Day 6-2 bug world). Dark chitin elytra
  // with cream chevrons, broad pronotum, short jut-jaws, six legs
  // tucked under the shell. Frame 1 lifts a leg pair for the walk.
  function paintWalker_beetle(g, frame) {
    var sq = frame === 1 ? 1 : 0, t = 5 + sq;
    var body  = '#1a1208', shell = '#241a10', cream = '#e8d8a8',
        creamD = '#9c8650', leg = '#0a0604', light = '#3a2814';
    // Pronotum (head shield, front-right, slightly raised)
    px(g, 11, t,     3, 3, body);
    px(g, 11, t,     3, 1, light);                    // top sheen on the shield
    px(g, 14, t + 1, 1, 1, body);                     // small horn nub
    // Eye / mandible specks
    px(g, 13, t + 2, 1, 1, cream);
    px(g, 14, t + 3, 1, 1, body);
    // Elytra (back shell) - main mass
    px(g, 2, t,     9, 7 - sq, shell);
    px(g, 2, t,     9, 1, body);                      // top edge dark
    px(g, 2, t + 1, 9, 1, light);                     // sheen band
    // Center split between the two wing covers
    px(g, 6, t,     1, 7 - sq, body);
    // Goliath chevrons (cream pattern across the elytra)
    px(g, 3, t + 2, 2, 1, cream);
    px(g, 7, t + 2, 3, 1, cream);
    px(g, 3, t + 3, 3, 1, creamD);
    px(g, 7, t + 3, 2, 1, creamD);
    px(g, 4, t + 4, 1, 1, cream);
    px(g, 8, t + 4, 1, 1, cream);
    // Belly shadow
    px(g, 2, t + 6 - sq, 9, 1, body);
    // Six legs (three per side, tucked under the shell)
    px(g, 2, t + 6 - sq, 1, 2, leg);
    px(g, 5, t + 6 - sq, 1, 2, leg);
    px(g, 9, t + 6 - sq, 1, 2, leg);
    // Lifted leg pair for the walk frame
    px(g, 3, t + 7 - sq, 2, 1, leg);
    px(g, 7, t + 7 - sq, 2, 1, leg);
    px(g, 10, t + 7 - sq, 1, 1, leg);
    // Tail-end taper
    px(g, 1, t + 2, 1, 3, shell);
  }

  // Wildebeest (Day 6-1 stampede mob, tiled 8x across the herd). Dark
  // muscular silhouette with curving horns, shoulder hump, beard
  // under chin, and four legs blurred by running. Drawn 16x16 and
  // repeated by Stampede.draw with a per-beast bob.
  function paintWildebeest(g) {
    var dk = '#100a06', body = '#241810', mid = '#2e2014',
        horn = '#74532a', hornL = '#a6804a', beard = '#060402';
    // Shoulder hump (back rises forward).
    px(g, 4, 2, 6, 1, dk);
    px(g, 5, 1, 4, 1, dk);
    // Back / body
    px(g, 1, 3, 11, 5, body);
    px(g, 2, 3, 10, 1, dk);                                 // spine top dark
    px(g, 1, 7, 11, 1, dk);                                 // belly shadow
    px(g, 3, 4, 7, 1, mid);                                 // back highlight band
    // Head (front-right, lower than the hump)
    px(g, 11, 4, 4, 4, body);
    px(g, 12, 4, 3, 1, dk);
    px(g, 14, 5, 1, 1, dk);                                 // eye socket
    // Horns curving up + out
    px(g, 11, 2, 1, 2, horn);
    px(g, 10, 1, 1, 1, horn);
    px(g, 14, 2, 1, 2, horn);
    px(g, 15, 1, 1, 1, horn);
    px(g, 10, 1, 1, 1, hornL);                              // horn tip highlight
    px(g, 15, 1, 1, 1, hornL);
    // Beard / dewlap below chin
    px(g, 12, 8, 2, 2, beard);
    px(g, 11, 9, 1, 1, beard);
    // Tail tuft (back-left)
    px(g, 0, 5, 1, 2, body);
    px(g, 0, 6, 1, 1, beard);
    // Legs (running blur - four legs with motion smear at the bottom)
    px(g, 2, 8, 1, 6, dk);
    px(g, 5, 8, 1, 6, dk);
    px(g, 8, 8, 1, 6, dk);
    px(g, 11, 8, 1, 6, dk);
    // Hoof-level motion smear
    px(g, 1, 13, 4, 1, dk);
    px(g, 6, 13, 4, 1, dk);
    px(g, 10, 13, 4, 1, dk);
  }

  // Porcupine (Day 6-1 savanna). Brown body with spike row on top,
  // small face on the right, short legs.
  function paintWalker_porcupine(g, frame) {
    var sq = frame === 1 ? 1 : 0, t = 4 + sq;
    var body = '#7a5230', face = '#3a1f10', spk = '#2a1a08', spkL = '#9a7050', eye = '#fff8d0';
    // Body
    px(g, 3, t + 2, 9, 4 - sq, body);
    px(g, 2, t + 4, 11, 2 - sq, body);
    px(g, 4, t + 1, 7, 1, body);
    // Spikes along the top (alternating heights)
    px(g, 3, t - 1, 1, 2, spk); px(g, 4, t,     1, 1, spk);
    px(g, 5, t - 2, 1, 3, spk); px(g, 6, t,     1, 1, spk);
    px(g, 7, t - 1, 1, 2, spk); px(g, 8, t - 2, 1, 3, spk);
    px(g, 9, t,     1, 1, spk); px(g, 10, t - 1, 1, 2, spk);
    // Spike highlights
    px(g, 5, t - 2, 1, 1, spkL); px(g, 8, t - 2, 1, 1, spkL);
    // Face (right side - dark snout)
    px(g, 11, t + 2, 3, 3, face);
    px(g, 13, t + 2, 1, 1, eye);                           // eye
    px(g, 13, t + 4, 1, 1, '#000');                        // nose
    // Legs (4 short stubs)
    px(g, 3, t + 6 - sq, 2, 1, face);
    px(g, 6, t + 6 - sq, 2, 1, face);
    px(g, 9, t + 6 - sq, 2, 1, face);
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
  // Hawk silhouette - bigger, chunkier body, big spread wings that
  // flap dramatically. Frame 0: wings DOWN (full glide spread),
  // Frame 1: wings UP (sharp upstroke). Mark Pass 9 redraw: "bigger,
  // more obviously bird, animated flap." The 14x14 sprite is now
  // packed - body fills the centre, wings reach the full width.
  function paintWisp_bird(g, frame) {
    var flap = frame === 1 ? 1 : 0;

    // Body - chunky teardrop centered around (6,7)
    px(g, 5, 5, 5, 4, C.bdA);                    // main body block
    px(g, 6, 4, 3, 1, C.bdA);                    // shoulder hump
    px(g, 4, 6, 1, 2, C.bdA);                    // breast curve left
    px(g, 10, 6, 1, 2, C.bdA);                   // breast curve right
    // Lighter belly
    px(g, 5, 7, 5, 2, C.bdL);
    px(g, 4, 7, 1, 1, C.bdL);
    // Body top shadow (definition between body + wings)
    px(g, 5, 4, 3, 1, C.bdB);

    // Head - distinct round head on top of body
    px(g, 6, 3, 3, 1, C.bdA);
    px(g, 6, 4, 2, 1, C.bdA);
    // Eye - one bright dot on the head
    px(g, 7, 3, 1, 1, C.out);

    // Beak - hooked triangular point, pointing forward (right)
    px(g, 9, 4, 1, 1, C.bdBeak);
    px(g, 10, 4, 1, 1, C.bdBeak);
    px(g, 9, 5, 1, 1, C.bdB);                    // beak underside shadow

    // Tail - fanned, sweeping back
    px(g, 2, 7, 3, 1, C.bdA);
    px(g, 1, 8, 4, 1, C.bdA);
    px(g, 2, 9, 3, 1, C.bdB);

    // Wings - dramatic full-width on either frame
    if (flap) {
      // Wings UPSTROKE - swept up + slightly forward, dramatic V shape
      // Left wing climbing up
      px(g, 1, 3, 1, 1, C.bdB);
      px(g, 2, 2, 2, 1, C.bdA);
      px(g, 3, 1, 2, 1, C.bdL);
      px(g, 4, 2, 2, 1, C.bdA);
      px(g, 5, 3, 1, 1, C.bdB);
      // Right wing climbing up
      px(g, 7, 3, 1, 1, C.bdB);
      px(g, 8, 2, 2, 1, C.bdA);
      px(g, 9, 1, 2, 1, C.bdL);
      px(g, 11, 2, 2, 1, C.bdA);
      px(g, 13, 3, 1, 1, C.bdB);
    } else {
      // Wings DOWNSTROKE / GLIDE - fully spread horizontal
      // Left wing
      px(g, 0, 6, 2, 1, C.bdA);
      px(g, 1, 5, 3, 1, C.bdA);
      px(g, 2, 6, 3, 1, C.bdL);
      px(g, 3, 7, 1, 1, C.bdB);
      px(g, 0, 7, 1, 1, C.bdB);                  // wing-tip droop
      // Right wing
      px(g, 12, 6, 2, 1, C.bdA);
      px(g, 10, 5, 3, 1, C.bdA);
      px(g, 9, 6, 3, 1, C.bdL);
      px(g, 10, 7, 1, 1, C.bdB);
      px(g, 13, 7, 1, 1, C.bdB);                 // wing-tip droop
    }
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

  // Storm-cloud shooter wisp (14x14). A small flying rain cloud that
  // drops orbs - visual cue that THIS wisp shoots, distinct from the
  // harmless bird/leaf/star/bat variants. Frame 0 idle, frame 1 charging
  // (bright lightning crackle inside).
  function paintWisp_stormcloud(g, frame) {
    var lit = frame === 1;
    // puffy dark cloud body
    px(g, 3, 2,  8, 3, C.rnA);
    px(g, 2, 3, 10, 3, C.rnA);
    px(g, 4, 1,  6, 1, C.rnA);
    px(g, 1, 4,  1, 2, C.rnA); px(g, 12, 4, 1, 2, C.rnA);
    // top highlight
    px(g, 4, 2, 6, 1, C.rnL);
    px(g, 3, 3, 4, 1, C.rnL);
    // dark underbelly
    px(g, 2, 6, 10, 1, C.rnB);
    px(g, 3, 7,  3, 1, C.rnB); px(g, 8, 7, 3, 1, C.rnB);
    // tiny menacing eyes
    px(g, 4, 4, 1, 1, C.rnDrop); px(g, 9, 4, 1, 1, C.rnDrop);
    // dripping rain tail underneath (more vivid when charging)
    px(g, 4,  9, 1, 2, C.rnDrop);
    px(g, 7,  9, 1, 2, C.rnDrop);
    px(g, 10, 9, 1, 2, C.rnDrop);
    if (lit) {
      // crackle of energy across the cloud belly + a longer drop
      px(g, 5, 5, 4, 1, C.rnDrop);
      px(g, 7, 11, 1, 2, C.rnDrop);
    }
  }
  // Smoke wisp (Day 3-1 rocky / mountain). Dark gray puff with
  // glowing ember eyes - reads as a smoke spirit rising off the
  // mountain.
  function paintWisp_smoke(g, frame) {
    var b = frame === 1 ? 1 : 0;
    var dk = '#3a3340', md = '#5a525e', lt = '#867d8c', emb = '#ff8030';
    // Outer puff
    px(g, 3, 2,  8, 2, dk);
    px(g, 2, 3, 10, 3, dk);
    px(g, 1, 4,  2, 2, dk); px(g, 11, 4, 2, 2, dk);
    px(g, 3, 6,  8, 2, dk);
    // Mid layer
    px(g, 4, 3,  6, 1, md);
    px(g, 3, 4,  8, 2, md);
    px(g, 4, 6,  6, 1, md);
    // Top highlight
    px(g, 5, 3,  4, 1, lt);
    px(g, 4, 4,  3, 1, lt);
    // Trailing wisps below
    px(g, 4, 8 + b, 1, 2, dk);
    px(g, 7, 9 - b, 1, 2, dk);
    px(g, 10, 8 + b, 1, 2, dk);
    // Ember eyes
    px(g, 5, 5, 1, 1, emb);
    px(g, 9, 5, 1, 1, emb);
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

  // Bee wisp (Day 6-2 bug world). Yellow + black striped body, two
  // wings that flap between frames. Stinger pointed back-left.
  function paintWisp_bee(g, frame) {
    var b = frame === 1 ? 1 : 0;
    var yel = '#ffce28', dk = '#1a1208', wing = 'rgba(220,240,255,0.8)',
        wingD = 'rgba(180,200,220,0.6)', eye = '#0a0604';
    // Body (oval, striped)
    px(g, 3, 4, 7, 4, yel);
    px(g, 4, 3, 5, 1, yel);
    px(g, 4, 8, 5, 1, yel);
    // Black stripes (3 bands)
    px(g, 4, 4, 1, 4, dk);
    px(g, 6, 4, 1, 4, dk);
    px(g, 8, 4, 1, 4, dk);
    // Head (right side, slightly bigger)
    px(g, 9, 4, 3, 4, dk);
    px(g, 10, 5, 1, 1, eye);                       // eye dot (white-of-eye)
    px(g, 11, 5, 1, 1, yel);                       // tiny yellow accent
    // Antennae (two short forward-curling)
    px(g, 11, 3, 1, 1, dk);
    px(g, 12, 2, 1, 1, dk);
    px(g, 12, 4, 1, 1, dk);
    px(g, 13, 3, 1, 1, dk);
    // Stinger (left rear)
    px(g, 2, 5, 1, 2, dk);
    px(g, 1, 6, 1, 1, dk);
    // Wings - large flapping above the body. Frame 1 = wings raised.
    if (b) {
      px(g, 5, 0, 4, 2, wing);
      px(g, 5, 0, 2, 1, wingD);
      px(g, 9, 0, 4, 2, wing);
      px(g, 9, 0, 2, 1, wingD);
    } else {
      px(g, 5, 1, 4, 2, wing);
      px(g, 7, 1, 2, 1, wingD);
      px(g, 9, 1, 4, 2, wing);
      px(g, 11, 1, 2, 1, wingD);
    }
  }

  // Jellyfish flyer (seaside / underwater) - translucent magenta bell
  // with hanging tentacles that sway between frames. Properly aquatic
  // (was rendering as a hawk before because seaside used wisp:'bird').
  function paintWisp_jellyfish(g, frame) {
    var b = frame === 1 ? 1 : 0;
    // Bell dome (top half) - rounded
    px(g, 4, 3, 6, 1, C.jfA);
    px(g, 3, 4, 8, 2, C.jfA);
    px(g, 2, 6, 10, 1, C.jfA);
    // Bell highlight - top-left sheen
    px(g, 5, 3, 3, 1, C.jfL);
    px(g, 4, 4, 2, 1, C.jfL);
    // Bell shadow underside
    px(g, 2, 7, 10, 1, C.jfB);
    // Eyes - cute glowing dots under the bell
    px(g, 5, 5, 1, 1, C.jfEye);
    px(g, 8, 5, 1, 1, C.jfEye);
    // Tentacles - 5 strands hanging down, swaying with frame
    var sway = b ? 1 : -1;
    px(g, 2 + sway, 8, 1, 4, C.jfA);     // far left
    px(g, 4 - sway, 8, 1, 5, C.jfA);     // left
    px(g, 6, 8, 1, 6, C.jfA);            // center (longest)
    px(g, 9 + sway, 8, 1, 5, C.jfA);     // right
    px(g, 11 - sway, 8, 1, 4, C.jfA);    // far right
    // Tentacle highlights (pink tips)
    px(g, 6, 12, 1, 2, C.jfL);
    px(g, 4 - sway, 11, 1, 2, C.jfL);
    px(g, 9 + sway, 11, 1, 2, C.jfL);
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
  // Sun-ray "flare" - bright vertical light shaft + warm halo. Reads
  // as a beam of sunlight falling from the sky (Day 4-1) per Mark's
  // "Maybe just rays of sun?" comment, instead of a generic fireball.
  function paintFlare(g) {
    // Soft outer halo
    px(g, 2, 0, 4, 10, 'rgba(255,232,140,0.5)');
    // Mid-bright beam
    px(g, 3, 0, 2, 10, '#ffe070');
    // Hot white core
    px(g, 3, 1, 2, 7, '#fff7c4');
    px(g, 3, 0, 2, 1, '#ffffff');
    // Small sparkle spurs along the beam
    px(g, 1, 4, 1, 1, '#ffd048');
    px(g, 6, 6, 1, 1, '#ffd048');
    px(g, 1, 8, 1, 1, '#ffd048');
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

  // Meteor - chunkier irregular rock with a longer flaming trail.
  // Reads as a meteor instead of the old bullet-shape per Mark's
  // "I would like to work on the meteors looking more like meteors
  // and less, like, bullets" feedback.
  function paintMeteor(g) {
    // Rock body (right side) - irregular silhouette
    px(g, 4, 1, 4, 1, '#5a4a40');
    px(g, 3, 2, 6, 1, '#7a6a5e');
    px(g, 3, 3, 6, 2, '#5a4a40');
    px(g, 4, 5, 5, 1, '#3a2e24');
    px(g, 5, 6, 3, 1, '#2a1e14');
    // Lit face (upper-right since meteor flies leftward)
    px(g, 6, 2, 2, 1, '#8a7a6e');
    px(g, 7, 3, 1, 1, '#a89886');
    // Cratered shadow
    px(g, 4, 4, 1, 1, '#2a1e14');
    px(g, 7, 4, 1, 1, '#2a1e14');
    // Long flaming trail (left side, multi-coloured)
    px(g, 0, 3, 4, 2, '#ffe070');
    px(g, 0, 2, 3, 1, '#ff8030');
    px(g, 0, 5, 2, 1, '#ff5018');
    // White-hot spurs at the head of the trail
    px(g, 2, 3, 1, 1, '#ffffff');
    px(g, 1, 4, 1, 1, '#ffffff');
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
  // Pass 10 round 2 (Mark): Day 1 (galactic) needs a one-way platform
  // that reads as "cosmic band" instead of wooden plank. Glowing edge
  // with constellation pinpoints.
  function paintPlatform_galactic(g) {
    // Outer glow band
    px(g, 0, 0, 16, 7, 'rgba(120,180,255,0.18)');
    // Dark core slab
    px(g, 0, 1, 16, 5, '#1a1d40');
    // Bright top light beam (the visible "you can stand here" cue)
    px(g, 0, 1, 16, 2, '#7adfff');
    px(g, 1, 1, 14, 1, '#ffffff');
    // Bottom shadow
    px(g, 0, 5, 16, 1, '#0e1028');
    // Star pinpoints
    px(g, 3,  4, 1, 1, '#ffffff');
    px(g, 8,  4, 1, 1, '#e0e8ff');
    px(g, 13, 4, 1, 1, '#ffffff');
    // Edge nodes
    px(g, 0, 3, 1, 2, '#5a8de0');
    px(g, 15, 3, 1, 2, '#5a8de0');
  }
  // Pass 10 round 2: eden-themed canopy - tinted leaf-green plank
  // with a curl of foliage along the top edge instead of plain wood.
  function paintPlatform_eden(g) {
    // Mid plank
    px(g, 0, 0, 16, 7, '#7a5a32');
    px(g, 0, 0, 16, 1, '#9a7642');
    px(g, 0, 6, 16, 1, '#5a3e22');
    // Leaf canopy ridge along the top
    px(g, 0, 0, 16, 2, '#5fa848');
    px(g, 0, 0, 16, 1, '#a8e070');
    px(g, 2, 1, 2, 1, '#7fc858');
    px(g, 6, 1, 2, 1, '#7fc858');
    px(g, 10, 1, 2, 1, '#7fc858');
    px(g, 14, 1, 2, 1, '#7fc858');
    // Wood grain hint
    px(g, 4, 4, 4, 1, '#5a3e22');
    px(g, 10, 4, 4, 1, '#5a3e22');
  }
  // Pass 10 round 2 (Mark): themed one-way platforms for the remaining
  // 9 biomes so canopies match the world the kid is in.
  function paintPlatform_sky(g) {
    // Fluffy cloud strip - white puffs with a soft shadow underside.
    px(g, 0, 1, 16, 5, '#e8ecf5');
    px(g, 0, 0, 16, 2, '#ffffff');
    px(g, 1, 5, 14, 1, '#9aa6c2');                   // shadow lip
    // Cloud lump bumps along the top
    px(g, 2, 0, 2, 1, '#ffffff');
    px(g, 6, 0, 3, 1, '#ffffff');
    px(g, 12, 0, 2, 1, '#ffffff');
    // Side puffs
    px(g, 0, 2, 1, 2, '#dfe3ed');
    px(g, 15, 2, 1, 2, '#dfe3ed');
  }
  function paintPlatform_bird_sky(g) {
    // Slightly warmer cloud - more golden hour
    px(g, 0, 1, 16, 5, '#f4e8cc');
    px(g, 0, 0, 16, 2, '#fff4d6');
    px(g, 1, 5, 14, 1, '#c0a878');
    px(g, 2, 0, 2, 1, '#ffffff');
    px(g, 6, 0, 3, 1, '#ffffff');
    px(g, 12, 0, 2, 1, '#ffffff');
    px(g, 0, 2, 1, 2, '#e0d098');
    px(g, 15, 2, 1, 2, '#e0d098');
  }
  function paintPlatform_sea(g) {
    // Floating wood raft slat over water - brass-trimmed plank.
    px(g, 0, 0, 16, 7, '#6e4a26');
    px(g, 0, 0, 16, 1, '#a07842');
    px(g, 0, 6, 16, 1, '#4a3018');
    // Diagonal wood grain
    px(g, 2, 2, 12, 1, '#7e5a36');
    px(g, 2, 4, 12, 1, '#5e3e1e');
    // Brass-trim ends
    px(g, 0, 0, 1, 7, '#c4a070');
    px(g, 15, 0, 1, 7, '#c4a070');
    // Water-shimmer hint underneath
    px(g, 2, 6, 12, 1, '#3c7aa8');
  }
  function paintPlatform_rocky(g) {
    // Stone ledge with moss specks
    px(g, 0, 0, 16, 7, '#6e6260');
    px(g, 0, 0, 16, 1, '#8a8078');
    px(g, 0, 6, 16, 1, '#3a3230');
    // Cracks
    px(g, 4, 3, 1, 2, '#52464a');
    px(g, 11, 2, 1, 2, '#52464a');
    // Moss tufts
    px(g, 2, 0, 2, 1, '#7da848');
    px(g, 8, 0, 2, 1, '#7da848');
    px(g, 13, 0, 2, 1, '#7da848');
  }
  function paintPlatform_forest(g) {
    // Wood plank with leafy moss running along the top
    px(g, 0, 0, 16, 7, '#6a4a28');
    px(g, 0, 0, 16, 1, '#8a6438');
    px(g, 0, 6, 16, 1, '#4a3018');
    // Wood grain
    px(g, 3, 3, 10, 1, '#3a2410');
    // Top moss with leaf specks
    px(g, 0, 0, 16, 1, '#4a8a3a');
    px(g, 2, 0, 1, 1, '#7fbe5a');
    px(g, 7, 0, 1, 1, '#7fbe5a');
    px(g, 12, 0, 1, 1, '#7fbe5a');
  }
  function paintPlatform_sunlit(g) {
    // Warm sandstone slab
    px(g, 0, 0, 16, 7, '#d8a262');
    px(g, 0, 0, 16, 1, '#f0c884');
    px(g, 0, 6, 16, 1, '#9a6238');
    // Bedding lines (sandstone layers)
    px(g, 0, 3, 16, 1, '#b88248');
    // Embedded specks
    px(g, 4, 2, 1, 1, '#fff0c0');
    px(g, 11, 4, 1, 1, '#fff0c0');
  }
  function paintPlatform_cosmic_night(g) {
    // Dark purple version of the galactic platform - night vs day
    px(g, 0, 0, 16, 7, 'rgba(160,140,220,0.22)');
    px(g, 0, 1, 16, 5, '#241a3a');
    px(g, 0, 1, 16, 2, '#a08adc');
    px(g, 1, 1, 14, 1, '#dfd0ff');
    px(g, 0, 5, 16, 1, '#100a1e');
    px(g, 3, 4, 1, 1, '#ffffff');
    px(g, 8, 4, 1, 1, '#dcd0ff');
    px(g, 13, 4, 1, 1, '#ffffff');
    px(g, 0, 3, 1, 2, '#7060b8');
    px(g, 15, 3, 1, 2, '#7060b8');
  }
  function paintPlatform_seaside(g) {
    // Underwater plank - mossy + barnacle-encrusted
    px(g, 0, 0, 16, 7, '#3a6a5a');
    px(g, 0, 0, 16, 1, '#5a9a82');
    px(g, 0, 6, 16, 1, '#1a4030');
    // Barnacles
    px(g, 3, 2, 1, 2, '#dfe4d8');
    px(g, 9, 2, 2, 2, '#dfe4d8');
    px(g, 13, 3, 1, 1, '#dfe4d8');
    // Algae fringe
    px(g, 0, 0, 16, 1, '#7fc868');
    px(g, 2, 0, 1, 1, '#a8e088');
    px(g, 6, 0, 1, 1, '#a8e088');
    px(g, 11, 0, 1, 1, '#a8e088');
  }
  function paintPlatform_savanna(g) {
    // Bone-pale plank with dry grass tufts
    px(g, 0, 0, 16, 7, '#c8b48e');
    px(g, 0, 0, 16, 1, '#e8d8a8');
    px(g, 0, 6, 16, 1, '#8a724a');
    // Bone-segment seams
    px(g, 5, 1, 1, 6, '#8a724a');
    px(g, 10, 1, 1, 6, '#8a724a');
    // Dry grass tufts on top
    px(g, 1, 0, 1, 1, '#b8a058');
    px(g, 6, 0, 1, 1, '#b8a058');
    px(g, 12, 0, 1, 1, '#b8a058');
  }
  function paintPlatform_village_dusk(g) {
    // Dark wooden cart-board with iron banding
    px(g, 0, 0, 16, 7, '#4a3018');
    px(g, 0, 0, 16, 1, '#684628');
    px(g, 0, 6, 16, 1, '#2a1a08');
    // Iron rivets
    px(g, 1, 2, 2, 2, '#9aa0b0');
    px(g, 13, 2, 2, 2, '#9aa0b0');
    px(g, 1, 2, 1, 1, '#dfe4ec');
    px(g, 13, 2, 1, 1, '#dfe4ec');
    // Wood grain
    px(g, 4, 4, 8, 1, '#3a2410');
  }
  // Tree-bark ground tile (Day 6-2 BUG WORLD). Top edge catches a
  // bit of canopy light, body is rough furrowed bark with two darker
  // knot bumps for the bumpy-branch look Mark referenced.
  function paintGroundWood(g) {
    var dk = '#3a2410', body = '#6a4222', mid = '#8a5a30',
        light = '#a8723c', shade = '#241608', knot = '#1c0e04';
    px(g, 0, 0, 16, 16, body);
    // Top-edge highlight (sun catches the curve of the branch)
    px(g, 0, 0, 16, 1, light);
    px(g, 0, 1, 16, 1, mid);
    px(g, 0, 2, 16, 1, body);
    // Vertical bark furrows
    px(g, 2, 3, 1, 11, dk);
    px(g, 5, 4, 1, 11, dk);
    px(g, 9, 3, 1, 11, dk);
    px(g, 13, 5, 1, 9, dk);
    // Furrow shadows beside each
    px(g, 3, 4, 1, 9, shade);
    px(g, 6, 5, 1, 9, shade);
    px(g, 10, 4, 1, 9, shade);
    px(g, 14, 6, 1, 7, shade);
    // Knot bumps (the spurs from Mark's bark photo)
    px(g, 7, 6, 2, 2, knot);
    px(g, 7, 6, 1, 1, dk);
    px(g, 11, 10, 2, 2, knot);
    px(g, 11, 10, 1, 1, dk);
    // Bottom shadow (separates stacked tiles)
    px(g, 0, 15, 16, 1, shade);
  }
  function paintDirtWood(g) {
    // Wood core - rings and grain when the tile is buried under more
    // bark. Slightly redder than the surface.
    var body = '#542d10', dk = '#2a1608', light = '#7a4220';
    px(g, 0, 0, 16, 16, body);
    // Concentric grain arcs
    px(g, 4, 4, 8, 1, light);
    px(g, 3, 5, 1, 6, light);
    px(g, 12, 5, 1, 6, light);
    px(g, 4, 11, 8, 1, light);
    px(g, 6, 7, 4, 2, dk);                            // heart of the grain
    // Faint speckle (worm holes / bark detail)
    px(g, 1, 2, 1, 1, dk);
    px(g, 14, 1, 1, 1, dk);
    px(g, 14, 13, 1, 1, dk);
    px(g, 2, 14, 1, 1, dk);
  }

  function paintPlatform_bugscale(g) {
    // Giant leaf fragment - reads as "you're tiny in the grass"
    px(g, 0, 1, 16, 5, '#4a9a3a');
    px(g, 0, 0, 16, 2, '#7fc858');
    px(g, 0, 5, 16, 1, '#2a6a1a');
    // Central vein
    px(g, 0, 3, 16, 1, '#a8e070');
    // Side ribs
    px(g, 4, 2, 1, 1, '#a8e070');
    px(g, 11, 2, 1, 1, '#a8e070');
    px(g, 4, 4, 1, 1, '#2a6a1a');
    px(g, 11, 4, 1, 1, '#2a6a1a');
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

  // Eve - long flowing red-brown hair, soft green tunic, no beard,
  // smaller frame than Adam. 20x31 same canvas as Adam.
  function paintNPC_eve(g) {
    // Long hair that drapes past the shoulders
    px(g, 4, 0, 12, 3, '#a83020');
    px(g, 5, 0, 10, 1, '#d04030');
    px(g, 3, 3, 1, 8, '#8a2418');             // left hair fall
    px(g, 16, 3, 1, 8, '#8a2418');            // right hair fall
    px(g, 4, 3, 1, 9, '#a83020');
    px(g, 15, 3, 1, 9, '#a83020');
    // Face
    px(g, 5, 4, 10, 6, C.skin);
    px(g, 5, 4, 10, 1, C.skinL);
    px(g, 6, 6, 1, 4, C.skinD);                // left cheek shading
    // Soft eyes with lashes
    px(g, 7, 7, 1, 1, C.out); px(g, 12, 7, 1, 1, C.out);
    px(g, 7, 6, 1, 1, '#3a1810'); px(g, 12, 6, 1, 1, '#3a1810');
    // Small mouth + cheek blush
    px(g, 9, 9, 2, 1, '#a83020');
    px(g, 6, 8, 1, 1, '#e88080'); px(g, 13, 8, 1, 1, '#e88080');
    // Neck
    px(g, 9, 10, 4, 2, C.skinD);
    // Tunic - soft sage green with leaf-pattern collar
    px(g, 4, 12, 12, 14, '#8ab564');
    px(g, 4, 12, 2, 14, '#a8d088');            // left highlight
    px(g, 14, 12, 2, 14, '#6a9248');           // right shadow
    px(g, 9, 12, 2, 2, '#456a28');             // collar V
    px(g, 8, 14, 4, 1, '#cae09a');             // floral accent
    // Belt of woven flowers
    px(g, 4, 20, 12, 1, '#456a28');
    px(g, 7, 20, 1, 1, '#ffd040');
    px(g, 11, 20, 1, 1, '#ffd040');
    // Arms - slimmer than Adam's
    px(g, 3, 13, 1, 9, C.skin);
    px(g, 16, 13, 1, 9, C.skin);
    px(g, 3, 22, 1, 2, C.skin);
    px(g, 16, 22, 1, 2, C.skin);
    // Bare legs
    px(g, 6, 26, 3, 4, C.skin);
    px(g, 11, 26, 3, 4, C.skin);
    // Sandals
    px(g, 5, 30, 5, 1, '#6e4a26');
    px(g, 10, 30, 5, 1, '#6e4a26');
  }

  // Eden decorative animals - small bobbing silhouettes that don't
  // harm Danny. Painted at NPC scale (20x31 canvas) so they slot
  // straight into the same draw path.
  function paintAnimal_deer(g) {
    var col = '#9a6a3a', dark = '#6a4828', white = '#e8d8c0';
    // Body (rows 14-22)
    px(g, 4, 14, 12, 6, col);
    px(g, 4, 14, 12, 1, white);                 // back highlight
    px(g, 4, 19, 12, 1, dark);                  // belly shadow
    // White rump dot
    px(g, 13, 16, 2, 2, white);
    // Long neck rising up and forward
    px(g, 12, 8, 3, 6, col);
    px(g, 12, 8, 3, 1, white);
    // Head
    px(g, 13, 5, 4, 3, col);
    px(g, 14, 4, 2, 1, col);                    // forehead
    // Antlers (forking up)
    px(g, 13, 2, 1, 3, dark);
    px(g, 12, 1, 1, 1, dark);
    px(g, 14, 1, 1, 1, dark);
    px(g, 16, 2, 1, 3, dark);
    px(g, 15, 1, 1, 1, dark);
    px(g, 17, 1, 1, 1, dark);
    // Eye
    px(g, 15, 6, 1, 1, C.out);
    // Legs (4 slim, slightly staggered)
    px(g, 5, 20, 1, 8, col);
    px(g, 8, 20, 1, 8, col);
    px(g, 11, 20, 1, 8, col);
    px(g, 14, 20, 1, 8, col);
    // Hooves
    px(g, 5, 28, 1, 2, dark);
    px(g, 8, 28, 1, 2, dark);
    px(g, 11, 28, 1, 2, dark);
    px(g, 14, 28, 1, 2, dark);
    // Tail
    px(g, 3, 14, 1, 3, col);
    px(g, 3, 14, 1, 1, white);
  }

  function paintAnimal_lion(g) {
    var mane = '#a8642a', body = '#d8a062', dark = '#6a4020', face = '#e8c890';
    // Body - wider, lower than deer (Eden lion is peaceful + lazy)
    px(g, 4, 18, 12, 8, body);
    px(g, 4, 18, 12, 1, face);                  // back highlight
    px(g, 4, 25, 12, 1, dark);                  // belly shadow
    // Mane - shaggy halo around the head
    px(g, 11, 11, 7, 7, mane);
    px(g, 12, 10, 5, 1, mane);
    px(g, 12, 18, 5, 1, mane);
    px(g, 10, 12, 1, 5, mane);
    px(g, 18, 12, 1, 5, mane);
    px(g, 11, 11, 7, 1, '#c0834a');             // mane top highlight
    // Face inside the mane
    px(g, 12, 13, 5, 4, face);
    // Eyes + nose
    px(g, 13, 14, 1, 1, C.out);
    px(g, 16, 14, 1, 1, C.out);
    px(g, 14, 15, 2, 1, dark);                  // muzzle
    px(g, 14, 16, 2, 1, '#3a1810');             // mouth line
    // Ears (poking through mane)
    px(g, 12, 11, 1, 1, mane);
    px(g, 17, 11, 1, 1, mane);
    // Legs (stubby, lounging)
    px(g, 5, 26, 2, 4, body);
    px(g, 8, 26, 2, 4, body);
    px(g, 11, 26, 2, 4, body);
    px(g, 14, 26, 2, 4, body);
    px(g, 5, 29, 2, 1, dark);                   // paw shadows
    px(g, 8, 29, 2, 1, dark);
    px(g, 11, 29, 2, 1, dark);
    px(g, 14, 29, 2, 1, dark);
    // Tail with tuft
    px(g, 2, 22, 2, 1, body);
    px(g, 1, 23, 2, 1, body);
    px(g, 0, 24, 2, 2, mane);                   // tail tuft
  }

  function paintAnimal_dove(g) {
    var body = '#ffffff', shade = '#c0c8d8', beak = '#ffa830';
    // Dove silhouette - smaller / higher on the canvas (it perches
    // on bushes / hovers). 20x31 canvas, character roughly in rows 8-18.
    // Body
    px(g, 6, 12, 8, 4, body);
    px(g, 7, 11, 6, 1, body);
    px(g, 6, 15, 8, 1, shade);                  // belly shadow
    // Head
    px(g, 11, 9, 4, 3, body);
    px(g, 12, 8, 2, 1, body);
    px(g, 11, 9, 1, 1, shade);                  // head shadow
    // Beak
    px(g, 15, 10, 1, 1, beak);
    px(g, 16, 10, 1, 1, beak);
    // Eye
    px(g, 13, 9, 1, 1, C.out);
    // Wings spread (always extended - reads as flying)
    px(g, 3, 11, 4, 1, body);
    px(g, 2, 12, 5, 1, body);
    px(g, 3, 13, 4, 1, shade);
    // Tail
    px(g, 4, 14, 3, 1, body);
    px(g, 4, 15, 3, 1, shade);
    // A second wing tip on the right (mid-flap silhouette)
    px(g, 14, 11, 4, 1, body);
    px(g, 14, 12, 5, 1, body);
    px(g, 14, 13, 4, 1, shade);
  }
  // glowing white platform for Day 1's "let there be light" theme
  function paintGroundGalactic(g) {
    // Glassy / semi-polished obsidian look per Mark - body is a
    // deeper pale-blue with a strong glossy top cap, a diagonal
    // reflection stripe, scattered specular sparkles, and a darker
    // base shadow. Reads as polished obsidian / ice instead of
    // matte stone.
    px(g, 0, 0, 16, 16, '#92b0d8');
    // Bright top cap (the "polish")
    px(g, 0, 0, 16, 2, '#ffffff');
    px(g, 0, 2, 16, 1, '#e8f0ff');
    px(g, 0, 3, 16, 1, '#b7cce8');
    // Single diagonal reflection stripe sweeping top-left -> bot-right
    px(g, 2, 5, 2, 1, '#ffffff');
    px(g, 4, 6, 2, 1, '#ffffff');
    px(g, 6, 7, 2, 1, '#e8f0ff');
    px(g, 8, 8, 2, 1, '#dfe8ff');
    px(g, 10, 9, 2, 1, '#cdd9f0');
    px(g, 12, 10, 2, 1, '#b7cce8');
    // Sparkle dots
    px(g, 13, 4, 1, 1, '#ffffff');
    px(g, 4, 11, 1, 1, '#cdebff');
    px(g, 11, 13, 1, 1, '#cdebff');
    // Darker base shadow
    px(g, 0, 13, 16, 1, '#6985b0');
    px(g, 0, 14, 16, 2, '#475c84');
    px(g, 0, 15, 16, 1, '#2f3e5e');
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
    // Semi-transparent water tint so the multi-layer reef parallax
    // behind (drawSky_seaside) shows through. Pass-9 underwater
    // polish - solid blue tiles were hiding all the coral / fish /
    // bubbles / light shafts.
    px(g, 0, 0, 16, 16, 'rgba(42,108,184,0.42)');
    px(g, 0, 0, 16, 1, 'rgba(58,134,214,0.55)');
    px(g, 0, 8, 16, 1, 'rgba(58,122,198,0.40)');
    px(g, 2, 4, 3, 1, 'rgba(170,220,255,0.55)');
    px(g, 9, 11, 3, 1, 'rgba(170,220,255,0.55)');
    px(g, 11, 3, 2, 1, 'rgba(170,220,255,0.55)');
    px(g, 3, 13, 2, 1, 'rgba(170,220,255,0.55)');
  }
  function paintWaterTop(g) {
    // Water surface row - keep the wavy top opaque, rest translucent.
    px(g, 0, 4, 16, 12, 'rgba(42,108,184,0.42)');
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

    // Pass 10 round 2 (Mark images): the inner window now hints at
    // what's inside - gold for the super power core (grow), white-hot
    // for the blast core, cyan for the bonus power core (?). Spent
    // blocks stay grey.
    var winDark, winLit, spark, trace;
    if (used) {
      winDark = '#1d1814'; winLit = '#3a322a'; spark = '#5a4e3c'; trace = null;
    } else if (kind === 'grow') {
      winDark = '#2a1808'; winLit = '#f0a420'; spark = '#fff09a'; trace = '#a86420';
    } else if (kind === 'blast') {
      winDark = '#221a08'; winLit = '#fff09a'; spark = '#ffffff'; trace = '#f0c068';
    } else {
      winDark = '#0f1422'; winLit = '#5fcfff'; spark = '#bff0ff'; trace = '#2c8cb0';
    }
    px(g, 4, 4, 8, 8, winDark);
    px(g, 6, 6, 4, 4, winLit);
    px(g, 7, 7, 2, 2, spark);
    if (trace) {
      px(g, 4, 7, 1, 1, trace); px(g, 11, 7, 1, 1, trace);
      px(g, 7, 4, 1, 1, trace); px(g, 8, 11, 1, 1, trace);
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
  // Pass 10 r2 (Mark, image 5): pit gaps in 3-1 need visible lava at
  // the bottom so the kid reads them as deadly hot pools. Animated
  // wave bands + bubble specks. Non-solid; player dies on contact via
  // the hazard-tile check in Player.update.
  function paintLava(g) {
    // Molten base
    px(g, 0, 0, 16, 16, '#7a1c0a');
    px(g, 0, 1, 16, 4, '#c83018');
    px(g, 0, 2, 16, 2, '#ff5418');
    px(g, 0, 3, 16, 1, '#ffd048');
    px(g, 0, 0, 16, 1, '#ff8030');
    // Bright bubble specks
    px(g, 2, 6, 2, 1, '#ff8030');
    px(g, 7, 8, 1, 1, '#ffd048');
    px(g, 11, 5, 1, 1, '#ff8030');
    px(g, 13, 9, 2, 1, '#ffd048');
    px(g, 4, 11, 1, 1, '#ff8030');
    px(g, 9, 13, 2, 1, '#ffd048');
    // bottom shadow
    px(g, 0, 14, 16, 2, '#3a0a04');
  }
  // Deep / base lava - molten body without the bright wave band, so
  // it tiles cleanly below the surface frame.
  function paintLavaBase(g) {
    px(g, 0, 0, 16, 16, '#5a1208');
    px(g, 0, 0, 16, 4, '#7a1c0a');
    px(g, 0, 4, 16, 4, '#a82414');
    px(g, 0, 8, 16, 4, '#7a1c0a');
    px(g, 0, 12, 16, 4, '#3a0a04');
    // scattered bright cells - phase-shifted per row so adjacent
    // tiles don't form an obvious grid
    px(g, 3, 2, 1, 1, '#ff5418');
    px(g, 9, 3, 2, 1, '#ff8030');
    px(g, 5, 6, 1, 1, '#ffd048');
    px(g, 11, 7, 1, 1, '#ff5418');
    px(g, 2, 9, 2, 1, '#ff5418');
    px(g, 13, 10, 1, 1, '#ff8030');
    px(g, 7, 12, 1, 1, '#ff5418');
    px(g, 4, 14, 1, 1, '#ff8030');
  }
  // Animated surface ripple - 4 frames advancing the wave crest one
  // pixel each. Bright yellow band sits on top of an orange melt.
  function paintLavaTop(g, frame) {
    // Deep body
    px(g, 0, 4, 16, 12, '#a82414');
    px(g, 0, 14, 16, 2, '#5a1208');
    // Orange melt under the surface
    px(g, 0, 2, 16, 3, '#ff5418');
    px(g, 0, 3, 16, 1, '#ff8030');
    // Bright yellow crest with a wavy lip - phase shifts per frame
    var phase = (frame || 0) * 4;
    for (var x = 0; x < 16; x++) {
      var wave = Math.sin((x + phase) * 0.7) > 0 ? 0 : 1;
      px(g, x, 0 + wave, 1, 1, '#ffe070');
      px(g, x, 1 + wave, 1, 1, '#ffd048');
    }
    // Scattered crest sparkles - shift with frame so it feels alive
    var sparkleX = [1, 5, 9, 13][frame % 4];
    px(g, sparkleX, 0, 1, 1, '#ffffff');
    px(g, (sparkleX + 8) % 16, 1, 1, 1, '#fff09a');
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

  // Cosmic-night moving platform - constellation / light-beam look
  // for Day 4-2 per Mark. Dark purple core, bright cyan light beam
  // along the top, scattered star pinpoints along the length.
  function paintMovPlat_cosmic(g) {
    // Soft outer glow band
    px(g, 0, 1, 36, 11, 'rgba(120,180,255,0.18)');
    // Dark core body
    px(g, 1, 2, 34,  9, '#1a1d40');
    px(g, 1, 2, 34,  1, '#3a4078');                // top edge
    px(g, 1, 10, 34, 1, '#0e1028');                // bottom edge
    // Bright cyan light beam along the top
    px(g, 2, 3, 32,  2, '#7adfff');
    px(g, 3, 3, 30,  1, '#ffffff');
    // Star pinpoints (the "constellation" feel)
    px(g,  5, 7, 1, 1, '#ffffff');
    px(g, 11, 6, 1, 1, '#e0e8ff');
    px(g, 17, 8, 1, 1, '#ffffff');
    px(g, 23, 6, 1, 1, '#e0e8ff');
    px(g, 29, 7, 1, 1, '#ffffff');
    // Two-pixel "endpoint" dots (constellation node markers)
    px(g, 2, 5, 2, 3, '#5a8de0');
    px(g, 32, 5, 2, 3, '#5a8de0');
  }

  // Cloud platform (Day 2-1 sky / 5-1 bird-sky if it ever uses movers).
  // White puffy cloud with darker undercarriage shadow.
  function paintMovPlat_cloud(g) {
    var clA = '#e8ecf5', clL = '#ffffff', clB = '#9aa6c2';
    // Body
    px(g, 2, 2, 32, 8, clA);
    // Soft round corners (notch the edges)
    px(g, 0, 4, 2, 4, clA);
    px(g, 34, 4, 2, 4, clA);
    px(g, 4, 1, 28, 1, clA);
    px(g, 6, 0, 24, 1, clA);
    // Top puff highlights
    px(g, 5, 1, 26, 1, clL);
    px(g, 7, 0, 22, 1, clL);
    px(g, 4, 2, 28, 1, clL);
    // Bottom shadow / curve
    px(g, 1, 9, 34, 2, clB);
    px(g, 2, 10, 32, 1, '#7080a0');
    // Soft underglow
    px(g, 3, 11, 30, 1, 'rgba(232,236,245,0.4)');
  }

  // Wooden raft (Day 2-2 sea-surface). Brown planks with rope wraps.
  function paintMovPlat_raft(g) {
    var wA = '#8b5a2a', wL = '#c89858', wB = '#5a3a18', rope = '#d4b070';
    // Plank body
    px(g, 0, 1, 36, 11, wB);
    px(g, 1, 2, 34, 8, wA);
    px(g, 1, 2, 34, 1, wL);                        // top sun stripe
    px(g, 1, 9, 34, 1, '#6a4218');                 // shadow
    // Plank seams (4 planks)
    for (var i = 8; i < 33; i += 8) { px(g, i, 2, 1, 8, wB); }
    // Grain marks
    px(g, 4, 5, 3, 1, wB);
    px(g, 13, 6, 3, 1, wB);
    px(g, 22, 5, 3, 1, wB);
    px(g, 28, 7, 3, 1, wB);
    // Rope wraps at the ends
    px(g, 1, 3, 2, 6, rope);
    px(g, 33, 3, 2, 6, rope);
    px(g, 1, 4, 2, 1, '#8a6028'); px(g, 33, 4, 2, 1, '#8a6028');
    px(g, 1, 7, 2, 1, '#8a6028'); px(g, 33, 7, 2, 1, '#8a6028');
    px(g, 0, 12, 36, 1, '#3a2010');
  }

  // Stone slab (Day 3-1 rocky). Gray chiseled stone with cracks + moss.
  function paintMovPlat_stone(g) {
    var sA = '#7e7268', sL = '#a89c8e', sB = '#4a4038', moss = '#5fb046';
    // Slab body
    px(g, 0, 1, 36, 11, sB);
    px(g, 1, 2, 34, 9, sA);
    px(g, 1, 2, 34, 2, sL);                        // top light
    px(g, 1, 4, 34, 1, '#988672');
    px(g, 1, 10, 34, 1, '#3a302a');
    // Cracks
    px(g, 6, 5, 1, 4, sB);
    px(g, 16, 6, 1, 3, sB);
    px(g, 24, 5, 1, 5, sB);
    px(g, 30, 7, 1, 2, sB);
    // Moss tufts on top
    px(g, 4, 1, 4, 1, moss);
    px(g, 14, 1, 5, 1, moss);
    px(g, 24, 1, 3, 1, moss);
    px(g, 4, 0, 2, 1, '#86d860');
    px(g, 16, 0, 2, 1, '#86d860');
    px(g, 0, 12, 36, 1, '#2a221c');
  }

  // Sunbeam platform (Day 4-1). Glowing horizontal bar of light.
  function paintMovPlat_sunbeam(g) {
    // Outer warm glow
    px(g, 0, 1, 36, 11, 'rgba(255,200,80,0.22)');
    // Core beam (golden orange gradient top to dark base)
    px(g, 1, 2, 34, 9, '#ff9020');
    px(g, 1, 2, 34, 2, '#ffe070');                 // bright top
    px(g, 2, 3, 32, 1, '#fff7c4');
    px(g, 1, 4, 34, 1, '#ffd048');
    px(g, 1, 10, 34, 1, '#c83214');
    // Sun-shine striations along the length
    for (var i = 4; i < 33; i += 6) {
      px(g, i, 5, 2, 1, '#ffffff');
      px(g, i + 2, 7, 1, 1, '#ffe070');
    }
    // Endpoint sun-burst dots
    px(g, 1, 5, 1, 3, '#fff7c4');
    px(g, 34, 5, 1, 3, '#fff7c4');
    px(g, 0, 6, 1, 1, '#ffffff'); px(g, 35, 6, 1, 1, '#ffffff');
  }

  // Bone / tribal plank (Day 6-1 savanna). Ivory bone-textured plank
  // with tribal stripe markings + rope wraps at the ends.
  function paintMovPlat_bone(g) {
    var bA = '#e8d4b4', bL = '#fff4d8', bB = '#a08868', stripe = '#7a4218';
    // Body
    px(g, 0, 1, 36, 11, bB);
    px(g, 1, 2, 34, 8, bA);
    px(g, 1, 2, 34, 1, bL);                        // top highlight
    px(g, 1, 9, 34, 1, '#806848');                 // bottom shadow
    // Tribal stripes
    px(g, 6, 4, 2, 5, stripe);
    px(g, 13, 4, 1, 5, stripe);
    px(g, 18, 5, 2, 3, stripe);
    px(g, 23, 4, 1, 5, stripe);
    px(g, 28, 4, 2, 5, stripe);
    // Knobs at the ends (the "joint" feel of a bone)
    px(g, 0, 3, 3, 7, '#d8c098');
    px(g, 33, 3, 3, 7, '#d8c098');
    px(g, 0, 2, 3, 1, bL); px(g, 33, 2, 3, 1, bL);
    px(g, 0, 12, 36, 1, '#4a3820');
  }

  // Village cart (Day 6-2). Wooden cart bed with iron banding.
  function paintMovPlat_cart(g) {
    var wA = '#9a6a3a', wL = '#c89858', wB = '#5a3a18', iron = '#3a3a44';
    // Body
    px(g, 0, 1, 36, 11, wB);
    px(g, 1, 2, 34, 8, wA);
    px(g, 1, 2, 34, 1, wL);                        // sun stripe
    px(g, 1, 9, 34, 1, '#5a3818');
    // Plank seams
    for (var i = 6; i < 33; i += 6) { px(g, i, 2, 1, 8, wB); }
    // Iron banding (two bands across)
    px(g, 0, 3, 36, 1, iron);
    px(g, 0, 8, 36, 1, iron);
    px(g, 1, 3, 34, 1, '#5a5a64');                 // band highlight
    // Iron rivets
    for (var r = 2; r < 34; r += 8) {
      px(g, r, 3, 1, 1, '#cccccc');
      px(g, r, 8, 1, 1, '#cccccc');
    }
    // Iron endcaps
    px(g, 0, 2, 2, 9, iron);
    px(g, 34, 2, 2, 9, iron);
    px(g, 0, 2, 2, 1, '#5a5a64'); px(g, 34, 2, 2, 1, '#5a5a64');
    px(g, 0, 12, 36, 1, '#2a1a0e');
  }

  // Eden glow leaf-platform (Day 7). Bright green leafy slab with
  // golden-light edges + sparkle dots.
  function paintMovPlat_eden(g) {
    var lA = '#5fb046', lL = '#86d860', lB = '#3b7a2a', gold = '#ffd23a';
    // Outer warm glow
    px(g, 0, 1, 36, 11, 'rgba(255,232,140,0.20)');
    // Leafy body
    px(g, 1, 2, 34, 9, lA);
    px(g, 1, 2, 34, 1, lL);                        // top light
    px(g, 2, 3, 32, 1, '#a8e890');
    px(g, 1, 9, 34, 1, lB);
    px(g, 1, 10, 34, 1, '#2a5a1a');
    // Leaf vein lines
    px(g, 18, 3, 1, 7, lB);                        // central vein
    for (var i = 4; i < 33; i += 6) {
      px(g, i, 5, 4, 1, lB);
      px(g, i, 7, 4, 1, lB);
    }
    // Golden sparkles
    px(g, 6, 4, 1, 1, gold);
    px(g, 15, 6, 1, 1, gold);
    px(g, 25, 5, 1, 1, gold);
    px(g, 31, 7, 1, 1, gold);
    px(g, 6, 3, 1, 1, '#ffffff');
    px(g, 25, 4, 1, 1, '#ffffff');
    // Bottom shadow
    px(g, 0, 12, 36, 1, '#1a3a0e');
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
    // Pass 10 round 2 (Mark): "definitely not a mushroom" - replaces the
    // mushroom-style power-up with a SUPER POWER CORE. Reads as the
    // regular blue power core's overcharged sibling: chaotic gold
    // diamond with a crackling white-hot center and starburst aura.
    var goldD = '#a86420';                       // dark gold rim
    var goldM = '#f0a420';                       // mid gold body
    var goldL = '#ffd860';                       // bright gold
    var sun   = '#fff09a';                       // pale yellow inner glow
    var white = '#ffffff';

    // Starburst aura - 12 sparks around the diamond
    // Diagonal corner spikes
    px(g, 1, 1,  1, 1, goldL); px(g, 2, 2,  1, 1, goldM);
    px(g, 14, 1, 1, 1, goldL); px(g, 13, 2, 1, 1, goldM);
    px(g, 1, 14, 1, 1, goldL); px(g, 2, 13, 1, 1, goldM);
    px(g, 14,14, 1, 1, goldL); px(g, 13,13, 1, 1, goldM);
    // Cardinal spikes (top, bottom, left, right)
    px(g, 7, 0, 2, 1, goldL); px(g, 7, 1, 2, 1, goldM);
    px(g, 7,15, 2, 1, goldL); px(g, 7,14, 2, 1, goldM);
    px(g, 0, 7, 1, 2, goldL); px(g, 1, 7, 1, 2, goldM);
    px(g,15, 7, 1, 2, goldL); px(g,14, 7, 1, 2, goldM);

    // Diamond body silhouette - dark rim
    px(g, 7, 3, 2, 1, goldD);
    px(g, 6, 4, 4, 1, goldD);
    px(g, 5, 5, 6, 1, goldD);
    px(g, 4, 6, 8, 4, goldD);                    // wide middle
    px(g, 5, 10, 6, 1, goldD);
    px(g, 6, 11, 4, 1, goldD);
    px(g, 7, 12, 2, 1, goldD);

    // Inner gold (one step in from the dark rim)
    px(g, 7, 4, 2, 1, goldM);
    px(g, 6, 5, 4, 1, goldM);
    px(g, 5, 6, 6, 3, goldM);
    px(g, 6, 9, 4, 1, goldM);
    px(g, 7, 10, 2, 1, goldM);
    px(g, 7, 11, 2, 1, goldM);

    // Bright gold core
    px(g, 7, 5, 2, 1, goldL);
    px(g, 6, 6, 4, 2, goldL);
    px(g, 7, 8, 2, 1, goldL);

    // Hot white center - pulses + crackles on frame 1
    px(g, 7, 6, 2, 2, sun);
    if (p) {
      px(g, 7, 6, 2, 1, white);
      px(g, 7, 7, 2, 1, white);
      // chaotic crackle sparks at the diamond corners
      px(g, 4, 4, 1, 1, white);
      px(g, 11, 4, 1, 1, white);
      px(g, 4, 11, 1, 1, white);
      px(g, 11, 11, 1, 1, white);
    } else {
      px(g, 7, 7, 2, 1, white);
    }
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
        cloud:     paintWalker_cloud,
        clam:      paintWalker_clam,
        rock:      paintWalker_rock,
        leaf:      paintWalker_leaf,
        flame:     paintWalker_flame,
        lion:      paintWalker_lion,
        porcupine: paintWalker_porcupine,
        beetle:    paintWalker_beetle
      };
      Object.keys(WALK_VARS).forEach(function (k) {
        var painter = WALK_VARS[k];
        var s = spriteO(16, 14, function (g) { painter(g, i); });
        sprites['walker_' + i + '_r_' + k] = s;
        sprites['walker_' + i + '_l_' + k] = flip(s);
      });

      // Wisp re-skins
      var WISP_VARS = {
        bird:       paintWisp_bird,
        leaf:       paintWisp_leaf,
        star:       paintWisp_star,
        bat:        paintWisp_bat,
        smoke:      paintWisp_smoke,
        stormcloud: paintWisp_stormcloud,
        jellyfish:  paintWisp_jellyfish,
        bee:        paintWisp_bee
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

    sprites['wildebeest'] = spriteO(16, 16, paintWildebeest);
    sprites['orb'] = spriteO(9, 8, paintOrb);
    sprites['bolt'] = spriteO(9, 8, paintBolt);
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
    sprites['movplat_cosmic']  = spriteO(36, 13, paintMovPlat_cosmic);
    sprites['movplat_cloud']   = spriteO(36, 13, paintMovPlat_cloud);
    sprites['movplat_raft']    = spriteO(36, 13, paintMovPlat_raft);
    sprites['movplat_stone']   = spriteO(36, 13, paintMovPlat_stone);
    sprites['movplat_sunbeam'] = spriteO(36, 13, paintMovPlat_sunbeam);
    sprites['movplat_bone']    = spriteO(36, 13, paintMovPlat_bone);
    sprites['movplat_cart']    = spriteO(36, 13, paintMovPlat_cart);
    sprites['movplat_eden']    = spriteO(36, 13, paintMovPlat_eden);
    sprites['timepart'] = spriteO(16, 16, paintTimePart);

    sprites['tile_ground'] = spritePlain(16, 16, paintGround);
    sprites['tile_dirt'] = spritePlain(16, 16, paintDirt);
    sprites['tile_brick'] = spritePlain(16, 16, paintBrick);
    sprites['tile_platform'] = spritePlain(16, 16, paintPlatform);
    sprites['tile_platform_galactic']     = spritePlain(16, 16, paintPlatform_galactic);
    sprites['tile_platform_eden']         = spritePlain(16, 16, paintPlatform_eden);
    sprites['tile_platform_sky']          = spritePlain(16, 16, paintPlatform_sky);
    sprites['tile_platform_bird-sky']     = spritePlain(16, 16, paintPlatform_bird_sky);
    sprites['tile_platform_sea-surface']  = spritePlain(16, 16, paintPlatform_sea);
    sprites['tile_platform_rocky']        = spritePlain(16, 16, paintPlatform_rocky);
    sprites['tile_platform_forest']       = spritePlain(16, 16, paintPlatform_forest);
    sprites['tile_platform_sunlit']       = spritePlain(16, 16, paintPlatform_sunlit);
    sprites['tile_platform_cosmic-night'] = spritePlain(16, 16, paintPlatform_cosmic_night);
    sprites['tile_platform_seaside']      = spritePlain(16, 16, paintPlatform_seaside);
    sprites['tile_platform_savanna']      = spritePlain(16, 16, paintPlatform_savanna);
    sprites['tile_platform_village-dusk'] = spritePlain(16, 16, paintPlatform_village_dusk);
    sprites['tile_platform_bugscale']     = spritePlain(16, 16, paintPlatform_bugscale);
    sprites['tile_lava'] = spritePlain(16, 16, paintLava);
    // Pass 12 (Mark): lava gets a top surface + base distinction
    // (same idea as ground vs dirt). Surface tile has 4 ripple frames
    // that the level renderer cycles through for visible motion.
    sprites['tile_lava_base'] = spritePlain(16, 16, paintLavaBase);
    sprites['tile_lava_top_0'] = spritePlain(16, 16, function (g) { paintLavaTop(g, 0); });
    sprites['tile_lava_top_1'] = spritePlain(16, 16, function (g) { paintLavaTop(g, 1); });
    sprites['tile_lava_top_2'] = spritePlain(16, 16, function (g) { paintLavaTop(g, 2); });
    sprites['tile_lava_top_3'] = spritePlain(16, 16, function (g) { paintLavaTop(g, 3); });

    // ---- Themed tile variants per family ----
    // Family painters
    var FAM_PAINTERS = {
      cosmic:    { ground: paintGroundGalactic, dirt: paintDirtGalactic, brick: paintBrickGalactic },
      'bright-sky': { ground: paintGroundSky,   dirt: paintDirtSky,      brick: paintBrickSky },
      sea:       { ground: paintGroundSea,      dirt: paintDirtSea,      brick: paintBrickSea },
      rocky:     { ground: paintGroundRocky,    dirt: paintDirtRocky,    brick: paintBrickRocky },
      sunlit:    { ground: paintGroundSunlit,   dirt: paintDirtSunlit,   brick: paintBrickSunlit },
      lush:      { ground: paintGround,         dirt: paintDirt,         brick: paintBrickLush },
      // Bug-world: tree-bark ground + wood-core "dirt".
      wood:      { ground: paintGroundWood,     dirt: paintDirtWood,     brick: paintBrickLush }
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
      'village-dusk': 'lush',
      'bugscale':     'wood'
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
    sprites['npc_eve']  = spriteO(20, 31, paintNPC_eve);
    sprites['npc_deer'] = spriteO(20, 31, paintAnimal_deer);
    sprites['npc_lion'] = spriteO(20, 31, paintAnimal_lion);
    sprites['npc_dove'] = spriteO(20, 31, paintAnimal_dove);
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
  // Costume sprite folders (uploaded by Mark): spacesuit (4-2 cosmic
  // night), jetpack (5-1 flappy), climbing (3-2 vines), swimming
  // (5-2 underwater). Climbing uses NORTH-facing frames (player
  // looks up at the wall) - the manifest's `north` flag tells the
  // loader where to fetch from. Jetpack is a single ignition anim
  // looped during flight.
  var PL_BIG_SPACE = PL_BIG.replace('/superdude dany big/animations',
                                    '/In_a_spacesuit/animations');
  var PL_BIG_JET   = PL_BIG.replace('/superdude dany big/animations',
                                    '/With_a_jet_pack/animations');
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
        celebrate: { folder: 'Celebration_Southward-947d4e92', frames: 9, south: true },
        // costumes / mode-specific anims
        climb:     { base: 'assets/Super Dude Danny Big Sprites/Climbing_wall_Northward-c611a79f',
                     folder: '', frames: 9, north: true, flat: true },
        swim:      { base: 'assets/Super Dude Danny Big Sprites/Swimming_right_body_horizontal_paddling_with_hand-820a931e',
                     folder: '', frames: 9, flat: true },
        space_run:  { base: PL_BIG_SPACE, folder: 'Running-371bd9a3',          frames: 6 },
        space_jump: { base: PL_BIG_SPACE, folder: 'Jumping-9fc36d7c',          frames: 9 },
        space_hurt: { base: PL_BIG_SPACE, folder: 'Taking_Punch-19dd094a',     frames: 6 },
        space_die:  { base: PL_BIG_SPACE, folder: 'Falling_Back_Death-e05d6ecc', frames: 7 },
        jet:        { base: PL_BIG_JET,   folder: 'The_character_remains_in_a_profile_view_as_the_jet-0a9ef652',
                      frames: 9 }
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
        celebrate: { folder: 'Super Dude Danny Small Sprites - Celebrating_southward-8d9f3045', frames: 9, south: true },
        // costumes / mode-specific anims
        climb:     { base: 'assets/Super Dude Danny Small Sprites -/Climbing_a_wall_northward-0eb39d4b',
                     folder: '', frames: 9, north: true, flat: true },
        swim:      { base: 'assets/Super Dude Danny Small Sprites -/Swimming_right_body_horizontal_paddling_with_hands-f8bee37d',
                     folder: '', frames: 9, flat: true },
        space_run:  { base: 'assets/Super Dude Danny Small Sprites -/In_a_spacesuit/animations',
                      folder: 'Running-38414bec',          frames: 6 },
        space_jump: { base: 'assets/Super Dude Danny Small Sprites -/In_a_spacesuit/animations',
                      folder: 'Two-Footed_Jump-bbb9b56b',  frames: 7 },
        space_hurt: { base: 'assets/Super Dude Danny Small Sprites -/In_a_spacesuit/animations',
                      folder: 'Taking_Punch-6f96794c',     frames: 6 },
        space_die:  { base: 'assets/Super Dude Danny Small Sprites -/In_a_spacesuit/animations',
                      folder: 'Falling_Back_Death-8c64bce0', frames: 7 },
        jet:        { base: 'assets/Super Dude Danny Small Sprites -/With_a_jetpack/animations',
                      folder: 'The_characters_jetpack_ignites_emitting_a_burst_of-1690deaa',
                      frames: 9 }
      }
    }
  };
  // Target on-screen height of the CHARACTER (not the padded PNG canvas).
  // The renderer crops each frame to the per-animation non-transparent
  // bounding box and scales the crop to this height. Big > small gives
  // the "I just took a hit" health-bar feedback.
  var PL_DISPLAY_H = { big: 36, small: 26 };
  // Per-anim display-height overrides. Swim renders at full standing
  // height for both sizes - the corrected bbox is naturally wide
  // (aspect ~1.5) so the sprite reads as a horizontal swim pose
  // even without shrinking the height. Mark Pass 9 round 2: "Column 1
  // from each row is the only one even close" - col 1 = h-driven at
  // original height (36 big, 36 small for swim).
  var PL_DISPLAY_OVERRIDE = {
    // Pass 10 round 2 (Mark): "shrink it by 40%" - the underwater Danny
    // was too big to thread through the tight coral-wall gaps in 5-2.
    // Down from 36 -> 22 in both sizes. Hitbox in entities.js follows
    // suit so the visual + collision stay aligned.
    big:   { swim: 22 },
    small: { swim: 22 }
  };

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
      celebrate: { south: { x: 27, y: 23, w: 44, h: 49 } },
      // Costume bboxes (Pass 9 sprite drop). Hand-tuned to roughly
      // match the analogous base-anim bbox - approximations only;
      // can be re-measured if any look noticeably off.
      // Climb bbox padded 4 px L/R + 3 px bottom (Pass 9 feedback:
      // "edges to the left and right are being cut off by like maybe
      // three pixels on each side").
      climb:      { north: { x: 32, y: 22, w: 32, h: 53 } },
      // Swim bbox MEASURED from the PNG via /tmp/measure_swim.js. The
      // old hand-tuned 40x36 was clipping ~half the character (the
      // outstretched arm in the swim pose). True union across 9 frames
      // is 78x48 - much wider than tall, which now reads as a proper
      // horizontal swimming pose.
      swim:       { east:  { x: 8,  y: 23, w: 78, h: 48 }, west: { x: 8,  y: 23, w: 78, h: 48 } },
      space_run:  { east:  { x: 35, y: 25, w: 26, h: 48 }, west: { x: 35, y: 25, w: 26, h: 48 } },
      space_jump: { east:  { x: 31, y: 25, w: 37, h: 50 }, west: { x: 30, y: 26, w: 35, h: 49 } },
      space_hurt: { east:  { x: 33, y: 26, w: 30, h: 47 }, west: { x: 33, y: 26, w: 30, h: 47 } },
      space_die:  { east:  { x: 32, y: 26, w: 39, h: 46 }, west: { x: 25, y: 26, w: 39, h: 46 } },
      jet:        { east:  { x: 31, y: 25, w: 37, h: 50 }, west: { x: 30, y: 26, w: 35, h: 49 } }
    },
    small: {
      idle:      { east: { x: 36, y: 24, w: 19, h: 45 }, west: { x: 35, y: 24, w: 20, h: 45 } },
      walk:      { east: { x: 36, y: 24, w: 22, h: 45 }, west: { x: 35, y: 24, w: 20, h: 45 } },
      run:       { east: { x: 31, y: 25, w: 28, h: 45 }, west: { x: 34, y: 24, w: 24, h: 46 } },
      jump:      { east: { x: 33, y: 26, w: 28, h: 45 }, west: { x: 30, y: 26, w: 29, h: 45 } },
      blast:     { east: { x: 35, y: 25, w: 28, h: 44 }, west: { x: 29, y: 25, w: 28, h: 44 } },
      hurt:      { east: { x: 30, y: 26, w: 28, h: 43 }, west: { x: 34, y: 26, w: 28, h: 43 } },
      die:       { east: { x: 29, y: 25, w: 36, h: 44 }, west: { x: 28, y: 26, w: 33, h: 42 } },
      celebrate: { south: { x: 24, y: 22, w: 44, h: 47 } },
      // Costume bboxes for small Danny (92x92 PNGs - slightly tighter
      // than the 96x96 big ones).
      // Climb padded 4 L/R + 3 bottom (same Pass 9 fix as big).
      climb:      { north: { x: 30, y: 20, w: 32, h: 51 } },
      // Swim bbox MEASURED from PNG (72x51, aspect 1.41) - same fix as big.
      swim:       { east:  { x: 10, y: 21, w: 72, h: 51 }, west: { x: 10, y: 21, w: 72, h: 51 } },
      space_run:  { east:  { x: 31, y: 25, w: 28, h: 45 }, west: { x: 34, y: 24, w: 24, h: 46 } },
      space_jump: { east:  { x: 33, y: 26, w: 28, h: 45 }, west: { x: 30, y: 26, w: 29, h: 45 } },
      space_hurt: { east:  { x: 30, y: 26, w: 28, h: 43 }, west: { x: 34, y: 26, w: 28, h: 43 } },
      space_die:  { east:  { x: 29, y: 25, w: 36, h: 44 }, west: { x: 28, y: 26, w: 33, h: 42 } },
      jet:        { east:  { x: 33, y: 26, w: 30, h: 45 }, west: { x: 30, y: 26, w: 30, h: 45 } }
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
        // dir set: per-anim override (south for celebrate, north for
        // climb), else default east+west pair.
        var dirs = a.south ? ['south'] : a.north ? ['north'] : ['east', 'west'];
        // per-anim base path override (costume folders sit OUTSIDE
        // the main "superdude dany big/animations" tree).
        var animBase = a.base || m.base;
        dirs.forEach(function (dir) {
          pixelLab.frames[size][anim][dir] = [];
          for (var f = 0; f < a.frames; f++) {
            var fn = 'frame_' + (f < 10 ? '00' + f : f < 100 ? '0' + f : '' + f) + '.png';
            // flat=true means the dir folder lives at base/dir/...
            // (no nested anim folder, used by Climb + Swim).
            var path = a.flat
              ? (animBase + '/' + dir + '/' + fn)
              : (animBase + '/' + a.folder + '/' + dir + '/' + fn);
            var url = encodeURI(path);
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
    var override = PL_DISPLAY_OVERRIDE[size] && PL_DISPLAY_OVERRIDE[size][anim];
    var dispH = override || PL_DISPLAY_H[size];
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

  // ---- BUG-SCALE CANOPY BACKGROUND --------------------------------------
  // Pre-blurred once into a screen-sized offscreen canvas so drawSky_bugscale
  // can blit it with a single drawImage per parallax tile. The source PNG is
  // a painted jungle canopy with foreground branches already baked in, so
  // the sky function drops the procedural foliage in favour of this image.
  var bugBg = new Image();
  var bugBgCanvas = null;
  bugBg.onload = function () {
    if (!bugBg.width || !bugBg.height) return;
    var c = document.createElement('canvas');
    c.width = 320; c.height = 180;
    var g = c.getContext('2d');
    g.filter = 'blur(1.5px)';
    g.drawImage(bugBg, 0, 0, c.width, c.height);
    g.filter = 'none';
    bugBgCanvas = c;
  };
  bugBg.onerror = function () { bugBgCanvas = null; };
  bugBg.src = 'assets/level%206%20bugs%20background.png';
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
