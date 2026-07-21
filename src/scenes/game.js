// game.js - PC_Game. M1 feel harness: Danny walks the endless District 1
// street. Instant accel/stop, 4-frame walk with X-flip, idle = frame 1,
// camera follow lerp 0.12, dt clamped, fps-foes readout always on.
window.PC = window.PC || {};

PC.GameScene = function () { Phaser.Scene.call(this, { key: 'PC_Game' }); };
PC.GameScene.prototype = Object.create(Phaser.Scene.prototype);
PC.GameScene.prototype.constructor = PC.GameScene;

PC.GameScene.prototype.create = function () {
  this.cameras.main.setBackgroundColor(0x2a2544);

  this.ground = new PC.Ground(this, 1);
  this.moveInput = new PC.MoveInput(this);

  // player state lives in plain fields (perf bible: manual movement, the
  // sprite is only the visual)
  this.px = 0; this.py = 0;
  this.facing = 1;
  this.walkT = 0;
  this.player = this.add.image(0, 0, 'atlas', 'char_danny_walk_1').setDepth(10);

  var cam = this.cameras.main;
  cam.startFollow(this.player, true, PC.RENDER.CAMERA_LERP, PC.RENDER.CAMERA_LERP);
  this.ground.update(cam);

  this.debugText = this.add.text(2, PC.RENDER.H - 12, '', {
    fontFamily: 'monospace', fontSize: '8px', color: '#a8e04a',
  }).setScrollFactor(0).setDepth(101);
  this._dbgAcc = 0;

  // G opens the M0 asset gallery (QA screen)
  this.input.keyboard.on('keydown-G', function () {
    this.scene.start('PC_Gallery');
  }, this);
};

PC.GameScene.prototype.update = function (time, delta) {
  var dt = Math.min(PC.DT_CLAMP, delta / 1000);

  // input -> motion, same frame (latency budget, COMPENDIUM 4)
  this.moveInput.update();
  var v = this.moveInput.vec;
  var moving = (v.x !== 0 || v.y !== 0);
  if (moving) {
    this.px += v.x * PC.PLAYER.SPEED * dt;
    this.py += v.y * PC.PLAYER.SPEED * dt;
    if (v.x > 0.01) this.facing = 1;
    else if (v.x < -0.01) this.facing = -1;
    this.walkT += dt;
    var frame = 1 + (Math.floor(this.walkT * 9) % 4);
    this.player.setFrame('char_danny_walk_' + frame);
  } else {
    this.walkT = 0;
    this.player.setFrame('char_danny_walk_1');
  }
  this.player.setPosition(Math.round(this.px), Math.round(this.py));
  this.player.setFlipX(this.facing < 0);

  this.ground.update(this.cameras.main);

  this._dbgAcc += dt;
  if (this._dbgAcc > 0.25) {
    this._dbgAcc = 0;
    this.debugText.setText('fps ' + Math.round(this.game.loop.actualFps) + ' - foes 0 - M1');
  }
};
