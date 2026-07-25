// juice.js - WP-JUICE (PHASE2 Track A): pooled damage numbers +
// projectile trails. Everything pooled and hard-capped (Perf Bible);
// damage numbers are rate-limited and toggleable in settings.
window.PC = window.PC || {};

// persisted feature settings (portioncontrol.settings)
PC.settings = { dmgNums: true };
try {
  var _s = JSON.parse(localStorage.getItem('portioncontrol.settings') || 'null');
  if (_s && typeof _s.dmgNums === 'boolean') PC.settings = _s;
} catch (e) {}
PC.setDmgNumbers = function (v) {
  PC.settings.dmgNums = !!v;
  try { localStorage.setItem('portioncontrol.settings', JSON.stringify(PC.settings)); } catch (e) {}
};

PC.Juice = function (scene) {
  this.scene = scene;
  // damage-number pool: small texts, world-space, rise + fade ~0.45s
  this.nums = [];
  for (var i = 0; i < 24; i++) {
    this.nums.push({ active: false, t: 0, dur: 0.45,
      txt: scene.add.text(0, 0, '', {
        fontFamily: 'monospace', fontSize: '8px', color: '#f2c33c',
        fontStyle: 'bold', stroke: '#1b1530', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(30).setVisible(false) });
  }
  this._numWindowT = 0; this._numCount = 0;      // rate limit ~14/s
  // trail pool: tiny additive sparks behind projectiles
  this.trails = [];
  for (var j = 0; j < 70; j++) {
    this.trails.push({ active: false, t: 0,
      img: scene.add.image(0, 0, 'atlas', 'fx_spark_1')
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(7).setVisible(false) });
  }
};

PC.Juice.prototype.dmgNum = function (x, y, amount, crit) {
  if (!PC.settings.dmgNums) return;
  var now = this.scene.now;
  if (now - this._numWindowT > 1) { this._numWindowT = now; this._numCount = 0; }
  if (this._numCount++ > 14) return;
  var n = null;
  for (var i = 0; i < this.nums.length; i++) {
    if (!this.nums[i].active) { n = this.nums[i]; break; }
  }
  if (!n) return;
  n.active = true; n.t = 0;
  n.txt.setText('' + Math.round(amount))
    .setColor(crit ? '#ff6b6b' : '#f2c33c')
    .setFontSize(crit ? 11 : 8)
    .setPosition(Math.round(x), Math.round(y))
    .setAlpha(1).setScale(crit ? 1.2 : 1).setVisible(true);
};

PC.Juice.prototype.trail = function (x, y, tint) {
  var t = null;
  for (var i = 0; i < this.trails.length; i++) {
    if (!this.trails[i].active) { t = this.trails[i]; break; }
  }
  if (!t) return;                                 // cap hit: drop, never grow
  t.active = true; t.t = 0;
  t.img.setPosition(x, y).setAlpha(0.7).setScale(0.9)
    .setTint(tint || 0x35d0ff).setVisible(true);
};

PC.Juice.prototype.update = function (dt) {
  var i, n, t;
  for (i = 0; i < this.nums.length; i++) {
    n = this.nums[i];
    if (!n.active) continue;
    n.t += dt;
    if (n.t >= n.dur) { n.active = false; n.txt.setVisible(false); continue; }
    var k = n.t / n.dur;
    n.txt.y -= 22 * dt;
    n.txt.setAlpha(k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4);
  }
  for (i = 0; i < this.trails.length; i++) {
    t = this.trails[i];
    if (!t.active) continue;
    t.t += dt;
    if (t.t >= 0.18) { t.active = false; t.img.setVisible(false); continue; }
    var kk = 1 - t.t / 0.18;
    t.img.setAlpha(0.7 * kk).setScale(0.9 * kk);
  }
};
