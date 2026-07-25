// main.js - PORTION CONTROL boot. Render lock per HANDOVER L3 (rev):
// logical HEIGHT locked at 270, WIDTH follows the device aspect so phones
// get true edge-to-edge widescreen (iPhone 17 ~19.5:9 -> ~585 logical px,
// no letterbox). Sprites stay native size; wider screens just see more
// world. pixelArt + roundPixels, DPR capped at 2.
window.PC = window.PC || {};
(function () {
  var dpr = Math.max(1, Math.min(PC.RENDER.DPR_CAP,
    (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
  PC.RES = dpr;

  // PORTRAIT-FIRST (Mark: "a strong, well looking portrait version just
  // like Vampire Survivors"). Portrait: logical WIDTH locked 270, height
  // follows the device aspect (iPhone ~270x585) - tall view, swarm above
  // and below. Landscape/desktop: height locked 270, width follows.
  function logicalSize() {
    var B = PC.RENDER.BASE;
    var aw = window.innerWidth || 960, ah = window.innerHeight || 540;
    if (ah >= aw) {
      var h = Math.round(B * (ah / aw));
      return { w: B, h: Math.max(Math.round(B * 1.3), Math.min(Math.round(B * 2.4), h)) };
    }
    var w = Math.round(B * (aw / ah));
    return { w: Math.max(Math.round(B * 1.15), Math.min(Math.round(B * 2.4), w)), h: B };
  }
  var ls = logicalSize();
  PC.RENDER.W = ls.w; PC.RENDER.H = ls.h;

  // sharpness (Mark: "text fuzzy, edges soft"): backing store renders at
  // logical*SCALE; every scene camera zooms SCALE so layout stays logical.
  var S = PC.RENDER.SCALE;
  // helper each scene calls first in create()
  PC.applyRenderScale = function (scene) {
    scene.cameras.main.setZoom(S);
    scene.cameras.main.centerOn(PC.RENDER.W / 2, PC.RENDER.H / 2);
  };
  // crisp text: default every Text object to SCALE resolution so glyph
  // canvases are dense enough for the zoomed camera
  var origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
  Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, t, style) {
    style = style || {};
    if (!style.resolution) style.resolution = S;
    return origText.call(this, x, y, t, style);
  };

  var config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: PC.RENDER.W * S,
    height: PC.RENDER.H * S,
    backgroundColor: '#1b1530',
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [PC.BootScene, PC.SelectScene, PC.GameScene, PC.ResultsScene, PC.GalleryScene],
  };

  PC.game = new Phaser.Game(config);

  // live re-fit on rotation / resize
  var rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var s = logicalSize();
      if (s.w !== PC.RENDER.W || s.h !== PC.RENDER.H) {
        PC.RENDER.W = s.w; PC.RENDER.H = s.h;
        PC.game.scale.setGameSize(s.w * S, s.h * S);
      }
      PC.game.scale.refresh();
    }, 120);
  });
})();
