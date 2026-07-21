// main.js - PORTION CONTROL boot. Render lock per HANDOVER L3:
// 480x270 logical, Scale.FIT, pixelArt + roundPixels, DPR capped at 2.
window.PC = window.PC || {};
(function () {
  var dpr = Math.max(1, Math.min(PC.RENDER.DPR_CAP,
    (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
  PC.RES = dpr;

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
    scene: [PC.BootScene, PC.GalleryScene],
  };

  PC.game = new Phaser.Game(config);
})();
