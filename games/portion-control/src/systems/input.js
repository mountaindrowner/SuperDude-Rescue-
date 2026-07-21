// input.js - movement input (COMPENDIUM 4): WASD/arrows + floating virtual
// joystick (appears where the thumb lands, dead zone 8px, max radius 62px,
// normalized). Zero latency rule: the scene reads .vec directly in update,
// nothing sits between the joystick vector and the position change.
window.PC = window.PC || {};

PC.MoveInput = function (scene) {
  this.scene = scene;
  this.vec = { x: 0, y: 0 };      // normalized move vector, length 0 or 1
  this.touchActive = false;
  this._origin = { x: 0, y: 0 };
  this._ptrId = -1;

  this.keys = scene.input.keyboard.addKeys({
    up: 'W', down: 'S', left: 'A', right: 'D',
    up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT',
  });

  // joystick ghost, drawn in screen space
  this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(100);

  var self = this;
  scene.input.on('pointerdown', function (p) {
    if (self._ptrId !== -1) return;
    self._ptrId = p.id;
    self._origin.x = p.x; self._origin.y = p.y;
    self.touchActive = true;
    self._updateTouch(p);
  });
  scene.input.on('pointermove', function (p) {
    if (p.id === self._ptrId) self._updateTouch(p);
  });
  function release(p) {
    if (p.id !== self._ptrId) return;
    self._ptrId = -1;
    self.touchActive = false;
    self._touchVec = null;
    self.gfx.clear();
  }
  scene.input.on('pointerup', release);
  scene.input.on('pointerupoutside', release);
};

PC.MoveInput.prototype._updateTouch = function (p) {
  var dx = p.x - this._origin.x, dy = p.y - this._origin.y;
  var len = Math.sqrt(dx * dx + dy * dy);
  var J = PC.JOY;
  if (len < J.DEAD) { this._touchVec = { x: 0, y: 0 }; }
  else { this._touchVec = { x: dx / len, y: dy / len }; }
  // ghost: base ring at origin + knob clamped to radius
  var kx = this._origin.x + (len > 0 ? dx / Math.max(1, len / Math.min(len, J.RADIUS)) : 0);
  var ky = this._origin.y + (len > 0 ? dy / Math.max(1, len / Math.min(len, J.RADIUS)) : 0);
  var g = this.gfx;
  g.clear();
  g.lineStyle(2, PC.PAL.CLOUD, 0.3).strokeCircle(this._origin.x, this._origin.y, J.RADIUS);
  g.fillStyle(PC.PAL.CYAN, 0.45).fillCircle(kx, ky, 10);
};

PC.MoveInput.prototype.update = function () {
  var k = this.keys;
  var x = 0, y = 0;
  if (k.left.isDown || k.left2.isDown) x -= 1;
  if (k.right.isDown || k.right2.isDown) x += 1;
  if (k.up.isDown || k.up2.isDown) y -= 1;
  if (k.down.isDown || k.down2.isDown) y += 1;
  if (x !== 0 || y !== 0) {
    var l = Math.sqrt(x * x + y * y);
    this.vec.x = x / l; this.vec.y = y / l;
    return;
  }
  if (this._touchVec) { this.vec.x = this._touchVec.x; this.vec.y = this._touchVec.y; return; }
  this.vec.x = 0; this.vec.y = 0;
};
