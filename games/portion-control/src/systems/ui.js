// ui.js - THE TEXT STANDARD (v0.25.0). Mark: "inspect all text and text
// boxes for dialogs, they almost always spill out and are too small or
// not formatted well. Create some rules to standardize quality."
//
// The audit that prompted this: 98 text objects across the game using
// FIFTEEN different font sizes from 6px to 26px with no system, and only
// 7 of them declaring a wrap width - so 91 could overflow their box.
// Level-up cards explained what they did in 7px. The dialogue box was a
// fixed 74px tall no matter how much text went in it.
//
// THE RULES (docs/UI_TEXT_STANDARD.md has the full version):
//   R1  Pick a ROLE, never a raw px size. Six roles, below.
//   R2  Sentences are never smaller than `body`. 8px and under is for
//       stamps the player never has to read (version, fps).
//   R3  Any text whose content can VARY must declare a wrap width, or
//       be passed through PC.ui.fit() to shrink/ellipsize.
//   R4  Panels are MEASURED from their text (PC.ui.panelFor), never
//       hardcoded - that's what makes boxes spill.
//   R5  Nothing sits closer than PC.SAFE to a screen edge, and
//       bottom-anchored UI clears PC.SAFE_BOTTOM (phone home indicator).
//   R6  Text over gameplay carries a stroke or a panel. No bare text on
//       a moving background.
window.PC = window.PC || {};

// ---- R1: the type scale (logical px) --------------------------------
PC.TYPE = {
  micro:   { size: 8,  line: 2 },   // version/fps stamps ONLY
  caption: { size: 9,  line: 3 },   // secondary labels, costs, hints
  body:    { size: 11, line: 4 },   // sentences: dialogue, descriptions
  label:   { size: 13, line: 4 },   // buttons, banners, row titles
  title:   { size: 18, line: 5 },   // screen headers
  display: { size: 26, line: 6 },   // logo / hero moments
};
PC.SAFE = 10;          // keep-clear margin from any screen edge
PC.SAFE_BOTTOM = 16;   // extra room at the bottom (home indicator)

PC.ui = {
  // build a Phaser text style for a role
  style: function (role, opts) {
    opts = opts || {};
    var t = PC.TYPE[role] || PC.TYPE.body;
    var st = {
      fontFamily: 'monospace',
      fontSize: (opts.size || t.size) + 'px',
      color: opts.color || '#f7f4ef',
      lineSpacing: opts.lineSpacing === undefined ? t.line : opts.lineSpacing,
    };
    if (opts.bold !== false) st.fontStyle = 'bold';
    if (opts.align) st.align = opts.align;
    if (opts.wrap) st.wordWrap = { width: opts.wrap };
    // R6: legibility over a moving world
    if (opts.stroke !== false && opts.onWorld) {
      st.stroke = opts.strokeColor || '#120e24';
      st.strokeThickness = opts.strokeWidth || 3;
    }
    return st;
  },

  text: function (scene, x, y, str, role, opts) {
    return scene.add.text(x, y, str, this.style(role, opts));
  },

  // R3: shrink a one-line string until it fits maxW, then ellipsize.
  // Returns the text object so it can be chained.
  fit: function (txt, maxW, minSize) {
    var floor = minSize || PC.TYPE.caption.size;
    var size = parseInt(txt.style.fontSize, 10) || PC.TYPE.body.size;
    while (txt.width > maxW && size > floor) {
      size -= 1;
      txt.setFontSize(size);
    }
    if (txt.width > maxW) {                       // still too wide: cut it
      var s = txt.text;
      while (s.length > 1 && txt.width > maxW) {
        s = s.slice(0, -1);
        txt.setText(s + '…');
      }
    }
    return txt;
  },

  // R4: draw a labPanel sized to what the text actually measures
  panelFor: function (g, txt, pad, opts) {
    pad = pad === undefined ? 8 : pad;
    var b = txt.getBounds();
    PC.labPanel(g, b.x - pad, b.y - pad, b.width + pad * 2, b.height + pad * 2,
      opts || { base: 0x1c1733, edge: 0x45356e, radius: 4 });
    return { x: b.x - pad, y: b.y - pad, w: b.width + pad * 2, h: b.height + pad * 2 };
  },

  // measure a string without leaving an object behind
  measure: function (scene, str, role, wrapW, opts) {
    opts = opts || {};
    opts.wrap = wrapW;
    var t = scene.add.text(0, 0, str, this.style(role, opts)).setVisible(false);
    var out = { w: t.width, h: t.height };
    t.destroy();
    return out;
  },

  // R5: clamp a rect inside the safe area
  clampRect: function (x, y, w, h) {
    var W = PC.RENDER.W, H = PC.RENDER.H;
    return {
      x: Math.max(PC.SAFE, Math.min(x, W - PC.SAFE - w)),
      y: Math.max(PC.SAFE, Math.min(y, H - PC.SAFE_BOTTOM - h)),
      w: w, h: h,
    };
  },
};
