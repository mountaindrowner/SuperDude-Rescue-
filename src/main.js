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

  function logicalW() {
    var aw = window.innerWidth || 960, ah = window.innerHeight || 540;
    var w = Math.round(PC.RENDER.H * (aw / ah));
    return Math.max(320, Math.min(640, w));
  }
  PC.RENDER.W = logicalW();

  var config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: PC.RENDER.W,
    height: PC.RENDER.H,
    backgroundColor: '#1b1530',
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [PC.BootScene, PC.GameScene, PC.ResultsScene, PC.GalleryScene],
  };

  PC.game = new Phaser.Game(config);

  // live re-fit on rotation / resize: same 270 height, new width
  var rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var w = logicalW();
      if (w !== PC.RENDER.W) {
        PC.RENDER.W = w;
        PC.game.scale.setGameSize(w, PC.RENDER.H);
      }
      PC.game.scale.refresh();
    }, 120);
  });
})();
