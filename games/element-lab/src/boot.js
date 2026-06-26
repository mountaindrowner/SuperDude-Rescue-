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
  var mode = store.getOpt('mode', 'endless');
  var sfx = store.getOpt('sfx', (data.audioEnabled === false ? 'off' : 'on'));
  var music = store.getOpt('music', (data.musicEnabled === false ? 'off' : 'on'));

  reg.set('lang', (lang === 'es') ? 'es' : 'en');
  reg.set('mode', (mode === 'zen') ? 'zen' : 'endless');
  reg.set('sfx', sfx === 'off' ? 'off' : 'on');
  reg.set('music', music === 'off' ? 'off' : 'on');

  // 3) build the synthesized audio engine once, share via registry
  var audio = DANNYLAB.makeAudio(reg.get('sfx') === 'on', reg.get('music') === 'on');
  reg.set('audio', audio);

  this.scene.start('DANNYLAB_Preload');
};
