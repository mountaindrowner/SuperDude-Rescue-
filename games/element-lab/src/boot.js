// boot.js — DANNYLAB_Boot. Stores the sub-game integration contract in the
// registry (Brief §8) and loads persisted settings, then → Preload.
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.BootScene = function () {
  Phaser.Scene.call(this, { key: 'DANNYLAB_Boot' });
};
DANNYLAB.BootScene.prototype = Object.create(Phaser.Scene.prototype);
DANNYLAB.BootScene.prototype.constructor = DANNYLAB.BootScene;

DANNYLAB.BootScene.prototype.create = function (data) {
  data = data || {};
  var reg = this.registry;
  var store = DANNYLAB.store;

  // 1) the parent's exit callback (may be null when run standalone)
  reg.set('onExit', data.onExit || null);

  // 2) settings: persisted value wins, else parent-provided, else default
  var lang = store.getOpt('lang', data.lang || 'en');

  reg.set('lang', (lang === 'es') ? 'es' : 'en');
  reg.set('mode', 'endless');   // single mode; Zen retired

  // audio volumes (0..1): a saved slider value wins; otherwise fall back to the
  // legacy on/off option (or the parent's audio/music flag), starting at 50%.
  function vol(volKey, legacyKey, parentOff) {
    var raw = store.getOpt(volKey, null);
    if (raw != null) { var n = parseFloat(raw); if (!isNaN(n)) return Math.max(0, Math.min(1, n)); }
    return store.getOpt(legacyKey, parentOff ? 'off' : 'on') === 'off' ? 0 : 0.5;
  }
  var sfxVol = vol('volSfx', 'sfx', data.audioEnabled === false);
  var musicVol = vol('volMusic', 'music', data.musicEnabled === false);

  // 3) build the synthesized audio engine once, share via registry
  var audio = DANNYLAB.makeAudio(sfxVol, musicVol);
  reg.set('audio', audio);

  // 4) silently mark already-earned cards as celebrated, so a returning player
  // isn't hit with a toast backlog — only unlocks from here on celebrate live
  if (DANNYLAB.newCardUnlocks) DANNYLAB.newCardUnlocks();

  this.scene.start('DANNYLAB_Preload');
};
