// main.js — Phaser game config, scene registry, the §8 exit contract, and
// the two integration paths (shared-scene for a Phaser parent; div-mount
// for a non-Phaser parent like the Super Dude Danny canvas game).
window.DANNYLAB = window.DANNYLAB || {};

// Render every Text at the device pixel density by default (the Scale
// Manager zoom sharpens graphics/images, but text needs its own resolution
// bump). Patch the factory once so we don't touch every add.text call.
(function () {
  if (!window.Phaser || DANNYLAB._textPatched) return;
  DANNYLAB._textPatched = true;
  var F = Phaser.GameObjects.GameObjectFactory.prototype;
  var orig = F.text;
  F.text = function (x, y, text, style) {
    style = style || {};
    if (style.resolution == null) style.resolution = DANNYLAB.RES;
    return orig.call(this, x, y, text, style);
  };
})();

// Zoom a scene's camera by RES and frame the logical 540x960 world, so the
// world renders supersampled into the larger backing store while all game
// coordinates remain 540x960. Call at the top of every visible scene's create.
DANNYLAB.applyRes = function (scene) {
  var cam = scene.cameras.main;
  cam.setOrigin(0, 0);          // anchor zoom at the top-left so world (0,0) = screen (0,0)
  cam.setZoom(DANNYLAB.RES);
  cam.setScroll(0, 0);
};

// ordered scene classes (Boot first)
DANNYLAB.sceneClasses = function () {
  return [
    DANNYLAB.BootScene, DANNYLAB.PreloadScene, DANNYLAB.MenuScene, DANNYLAB.GameScene,
    DANNYLAB.PauseScene, DANNYLAB.OptionsScene, DANNYLAB.ConfirmScene,
    DANNYLAB.GameOverScene, DANNYLAB.HowToScene,
    DANNYLAB.CollectionScene, DANNYLAB.LoadingScene,
  ];
};

// Exit — hands control back to the parent. NEVER calls game.destroy(). (§8)
DANNYLAB.exitSubgame = function (scene) {
  var game = scene.game;
  var keys = ['DANNYLAB_Pause', 'DANNYLAB_Options', 'DANNYLAB_Confirm', 'DANNYLAB_GameOver',
    'DANNYLAB_HowTo', 'DANNYLAB_Discovery', 'DANNYLAB_Collection', 'DANNYLAB_Loading', 'DANNYLAB_Game', 'DANNYLAB_Menu'];
  keys.forEach(function (k) { if (game.scene.getScene(k)) game.scene.stop(k); });
  var audio = scene.registry.get('audio'); if (audio) audio.stopMusic();

  var onExit = scene.registry.get('onExit');
  game.events.emit('dannylab:exit');              // fallback signal for the parent
  if (onExit) { onExit(); return; }
  game.scene.start('DANNYLAB_Menu');              // standalone: back to our own menu
};

// Standard Phaser config used by both paths.
DANNYLAB.makeConfig = function (parentEl) {
  return {
    type: Phaser.AUTO,
    parent: parentEl || undefined,
    // Backing store is RES× the logical 540x960 (true supersampling); each
    // scene camera zooms by RES so game coordinates stay 540x960. See applyRes.
    width: DANNYLAB.GEO.W * DANNYLAB.RES,
    height: DANNYLAB.GEO.H * DANNYLAB.RES,
    backgroundColor: '#070d22',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 1 },
        enableSleeping: false,
        // debug: true,
      },
    },
    scene: DANNYLAB.sceneClasses(),
  };
};

// ---- Path A (preferred when parent is Phaser): add scenes to the parent
// game, then `parent.scene.start('DANNYLAB_Boot', payload)`. Helper: ----
DANNYLAB.installInto = function (phaserGame) {
  DANNYLAB.sceneClasses().forEach(function (S) {
    var key = new S().sys.settings.key;     // key is set in each scene's ctor
    if (!phaserGame.scene.getScene(key)) phaserGame.scene.add(key, S, false);
  });
};

// ---- Path B (non-Phaser parent): mount a dedicated Phaser.Game in a div ----
// payload: { parent, onExit, lang, audioEnabled, musicEnabled }
DANNYLAB.launch = function (payload) {
  payload = payload || {};
  var parentEl = payload.parent || 'dannylab-root';
  var game = new Phaser.Game(DANNYLAB.makeConfig(parentEl));
  game.events.once('ready', function () {
    game.scene.start('DANNYLAB_Boot', {
      onExit: payload.onExit || null,
      lang: payload.lang || 'en',
      audioEnabled: payload.audioEnabled !== false,
      musicEnabled: payload.musicEnabled !== false,
    });
  });
  DANNYLAB.game = game;
  return game;
};
