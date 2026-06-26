// main.js — Phaser game config, scene registry, the §8 exit contract, and
// the two integration paths (shared-scene for a Phaser parent; div-mount
// for a non-Phaser parent like the Super Dude Danny canvas game).
window.DANNYLAB = window.DANNYLAB || {};

// ordered scene classes (Boot first)
DANNYLAB.sceneClasses = function () {
  return [
    DANNYLAB.BootScene, DANNYLAB.PreloadScene, DANNYLAB.MenuScene, DANNYLAB.GameScene,
    DANNYLAB.PauseScene, DANNYLAB.OptionsScene, DANNYLAB.ConfirmScene,
    DANNYLAB.GameOverScene, DANNYLAB.HowToScene, DANNYLAB.DiscoveryScene,
    DANNYLAB.CollectionScene,
  ];
};

// Exit — hands control back to the parent. NEVER calls game.destroy(). (§8)
DANNYLAB.exitSubgame = function (scene) {
  var game = scene.game;
  var keys = ['DANNYLAB_Pause', 'DANNYLAB_Options', 'DANNYLAB_Confirm', 'DANNYLAB_GameOver',
    'DANNYLAB_HowTo', 'DANNYLAB_Discovery', 'DANNYLAB_Collection', 'DANNYLAB_Game', 'DANNYLAB_Menu'];
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
    width: DANNYLAB.GEO.W,
    height: DANNYLAB.GEO.H,
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
