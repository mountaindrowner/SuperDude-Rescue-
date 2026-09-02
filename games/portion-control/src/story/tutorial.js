// tutorial.js - VIC'S PAD TRANSMISSION (v0.33.0). Mark: the opening
// tutorial should be FULL SCREEN, Vic talking to the PLAYER (not to
// Danny), minimal text, icons, "like she's sending a message through
// our personal pad." Replaces the old six-paragraph radio dialogue:
// five taps, one idea per screen, ~40 words total. The world holds
// (storyPause) while the pad is up; plays once per save, same flag as
// the old radio version.
window.PC = window.PC || {};

PC.TutorialPad = function (scene, onDone) {
  var W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK;
  var self = this;
  this.scene = scene;
  this.onDone = onDone;
  this.page = 0;
  this.objs = [];
  scene.storyPause = true;

  var D = 150;                       // above every quest/HUD element
  function keep(o) { self.objs.push(o); scene.uiAttach(o); return o; }

  // dark scrim: the city drops away, the pad IS the screen
  keep(scene.add.rectangle(W / 2, H / 2, W + 4, H + 4, 0x0b0818, 0.86).setDepth(D));

  // the pad frame - tall centered slab with a cyan service border
  var pw = Math.min(W - K(28), K(330)), ph = Math.min(H - K(120), K(430));
  var px = W / 2, py = H / 2;
  var g = keep(scene.add.graphics().setDepth(D + 1));
  g.fillStyle(0x1b1530, 1).fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, K(10));
  g.lineStyle(2, 0x35d0ff, 0.9).strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, K(10));
  g.fillStyle(0x45356e, 0.5).fillRoundedRect(px - pw / 2 + 3, py - ph / 2 + 3, pw - 6, K(24), K(7));
  // signal bars, blinking like a live call
  this.bars = keep(scene.add.graphics().setDepth(D + 2));
  this.barX = px + pw / 2 - K(26); this.barY = py - ph / 2 + K(16);

  keep(scene.add.text(px - pw / 2 + K(10), py - ph / 2 + K(8),
    'INCOMING - TIME TECH VIC', {
      fontFamily: 'monospace', fontSize: PC.TYPE.caption.size + 'px',
      color: '#35d0ff', fontStyle: 'bold',
    }).setDepth(D + 2));

  // Vic herself, up top, looking at YOU
  keep(scene.add.image(px, py - ph / 2 + K(70), 'atlas', 'portrait_victoria')
    .setDisplaySize(K(72), K(72)).setDepth(D + 2));

  // per-page content slots (filled by _show)
  this.icon = keep(scene.add.image(px, py + K(0), 'atlas', 'pickup_coin')
    .setDepth(D + 2).setVisible(false));
  this.icon2 = keep(scene.add.image(px, py, 'atlas', 'gem_gold')
    .setDepth(D + 2).setVisible(false));
  this.glyph = keep(scene.add.graphics().setDepth(D + 2));
  this.head = keep(scene.add.text(px, py + K(44), '', {
    fontFamily: 'monospace', fontSize: PC.TYPE.label.size + 'px',
    color: '#f7f4ef', fontStyle: 'bold', align: 'center',
    wordWrap: { width: pw - K(28) },
  }).setOrigin(0.5, 0).setDepth(D + 2));
  this.sub = keep(scene.add.text(px, py + K(70), '', {
    fontFamily: 'monospace', fontSize: PC.TYPE.body.size + 'px',
    color: '#cfd4e8', align: 'center', wordWrap: { width: pw - K(32) },
  }).setOrigin(0.5, 0).setDepth(D + 2));

  // progress dots + tap hint
  this.dots = keep(scene.add.graphics().setDepth(D + 2));
  this.dotY = py + ph / 2 - K(30);
  var hint = keep(scene.add.text(px, py + ph / 2 - K(16), 'TAP', {
    fontFamily: 'monospace', fontSize: PC.TYPE.caption.size + 'px',
    color: '#f2c33c', fontStyle: 'bold',
  }).setOrigin(0.5, 0.5).setDepth(D + 2));
  scene.tweens.add({ targets: hint, alpha: 0.35, duration: 520, yoyo: true, repeat: -1 });

  this.cx = px; this.cy = py; this.pw = pw;

  // one idea per screen, in Vic's voice, aimed at the player
  this.pages = [
    { head: 'HEY - YOU WITH THE PAD.', sub: "I'm Vic. Four things and you're ready.", kind: 'wave' },
    { head: 'DRAG TO MOVE', sub: 'Anywhere on the screen.', kind: 'stick' },
    { head: 'YOUR GEAR FIRES ITSELF', sub: "You steer. It shoots what's close.", kind: 'icon', frame: 'icon_weapon_resizer' },
    { head: 'FOLLOW THE GOLD ARROW', sub: 'It always points at the job.', kind: 'arrow' },
    { head: 'GRAB DROPS. UPGRADE AFTER.', sub: 'Gems become TECH: team passives. Coins are GOLD: your own gear. Spend both after every mission.', kind: 'loot' },
  ];

  // full-screen tap zone (interactive, camera-fixed via uiAttach)
  var zone = keep(scene.add.zone(W / 2, H / 2, W, H).setDepth(D + 3)
    .setInteractive());
  zone.on('pointerdown', function () {
    if (PC.audio) PC.audio.ui();
    self.page++;
    if (self.page >= self.pages.length) { self.destroy(); return; }
    self._show();
  });

  this._pulse = 0;
  this._show();
  // blink the signal bars on the scene clock (destroyed with us)
  this.timer = scene.time.addEvent({ delay: 260, loop: true, callback: function () {
    self._pulse++;
    self.bars.clear();
    for (var i = 0; i < 3; i++) {
      var on = ((self._pulse + i) % 4) !== 0;
      self.bars.fillStyle(0x35d0ff, on ? 0.9 : 0.25);
      self.bars.fillRect(self.barX + i * K(7), self.barY - K(3) - i * K(3), K(4), K(6) + i * K(3));
    }
  } });
};

PC.TutorialPad.prototype._show = function () {
  var p = this.pages[this.page], K = PC.uiK;
  var cx = this.cx, cy = this.cy;
  this.head.setText(p.head);
  this.sub.setText(p.sub);
  this.icon.setVisible(false); this.icon2.setVisible(false);
  this.glyph.clear();
  if (p.kind === 'icon') {
    this.icon.setFrame(p.frame).setPosition(cx, cy - K(4)).setDisplaySize(K(52), K(52)).setVisible(true);
  } else if (p.kind === 'loot') {
    this.icon.setFrame('pickup_coin').setPosition(cx - K(34), cy - K(4)).setDisplaySize(K(40), K(40)).setVisible(true);
    this.icon2.setFrame('gem_gold').setPosition(cx + K(34), cy - K(4)).setDisplaySize(K(40), K(40)).setVisible(true);
  } else if (p.kind === 'stick') {
    // a thumb-stick: ring + offset nub + motion ticks
    this.glyph.lineStyle(3, 0xcfd4e8, 0.9).strokeCircle(cx, cy - K(4), K(26));
    this.glyph.fillStyle(0x35d0ff, 1).fillCircle(cx + K(10), cy - K(12), K(11));
    this.glyph.lineStyle(2, 0x35d0ff, 0.5);
    this.glyph.lineBetween(cx + K(26), cy - K(28), cx + K(34), cy - K(36));
    this.glyph.lineBetween(cx + K(30), cy - K(22), cx + K(40), cy - K(28));
  } else if (p.kind === 'arrow') {
    // the objective compass arrow, gold, unmistakable
    this.glyph.fillStyle(0xf2c33c, 1);
    this.glyph.fillTriangle(cx - K(16), cy + K(10), cx + K(16), cy + K(10), cx, cy - K(24));
    this.glyph.fillStyle(0xf2c33c, 0.35);
    this.glyph.fillTriangle(cx - K(24), cy + K(20), cx + K(24), cy + K(20), cx, cy - K(32));
  } else if (p.kind === 'wave') {
    // page zero: Vic herself in the ring, saying hi to the player
    this.glyph.fillStyle(0x35d0ff, 0.12).fillCircle(cx, cy - K(4), K(40));
    this.glyph.lineStyle(2, 0x35d0ff, 0.5).strokeCircle(cx, cy - K(4), K(40));
    this.icon.setFrame('portrait_victoria').setPosition(cx, cy - K(4))
      .setDisplaySize(K(60), K(60)).setVisible(true);
  }
  // progress dots
  this.dots.clear();
  var n = this.pages.length, dw = K(12);
  for (var i = 0; i < n; i++) {
    var dx = cx - ((n - 1) * dw) / 2 + i * dw;
    this.dots.fillStyle(i === this.page ? 0xf2c33c : 0x6d6a8e, 1)
      .fillCircle(dx, this.dotY, i === this.page ? K(3.4) : K(2.2));
  }
};

PC.TutorialPad.prototype.destroy = function () {
  if (this.timer) this.timer.remove();
  for (var i = 0; i < this.objs.length; i++) this.objs[i].destroy();
  this.objs = [];
  this.scene.storyPause = false;
  if (this.onDone) this.onDone();
};
