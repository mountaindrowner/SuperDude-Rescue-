// boot.js - PC_Boot: load any real art listed in the manifest, build the
// single runtime atlas (real art where present, placeholders elsewhere),
// then show the M0 asset gallery so every frame is visually verifiable.
// The gallery doubles as the art QA screen for the whole project.
window.PC = window.PC || {};

PC.BootScene = function () { Phaser.Scene.call(this, { key: 'PC_Boot' }); };
PC.BootScene.prototype = Object.create(Phaser.Scene.prototype);
PC.BootScene.prototype.constructor = PC.BootScene;

PC.BootScene.prototype.preload = function () {
  var loadedReal = this._loadedReal = {};
  var list = PC.ART_MANIFEST || [];
  var self = this;
  // ?v busts stale caches: art files change content under stable names
  // (e.g. portrait redos), so they version with the build like the code
  var bust = '?v=' + (window.PC_BUILD || 'dev');
  list.forEach(function (key) {
    self.load.image('art_' + key, 'assets/art/' + key + '.png' + bust);
  });
  this.load.on('filecomplete', function (key) {
    if (key.indexOf('art_') === 0) loadedReal[key] = true;
  });
  this.load.on('loaderror', function (file) {
    if (typeof console !== 'undefined') console.warn('PC art missing, placeholder used:', file.key);
  });
};

PC.BootScene.prototype.create = function () {
  var info = PC.buildAtlas(this, this._loadedReal);
  PC.atlasInfo = info;
  var wantGallery = /[?&]gallery=1/.test(window.location.search);
  this.scene.start(wantGallery ? 'PC_Gallery' : 'PC_Select');
};

// ---------- M0 gallery ----------
PC.GalleryScene = function () { Phaser.Scene.call(this, { key: 'PC_Gallery' }); };
PC.GalleryScene.prototype = Object.create(Phaser.Scene.prototype);
PC.GalleryScene.prototype.constructor = PC.GalleryScene;

PC.GalleryScene.prototype.create = function () {
  PC.applyRenderScale(this);
  PC.stampVersion(this);
  var W = PC.RENDER.W, H = PC.RENDER.H;
  this.cameras.main.setBackgroundColor(0x241f3d);

  // lay frames out in pages of rows, biggest categories first (registry order)
  var pad = 6, x = pad, y = 26, rowH = 0, page = 0;
  this.pages = [[]];
  var self = this;
  PC.ASSETS.forEach(function (a) {
    if (x + a.w + pad > W) { x = pad; y += rowH + pad; rowH = 0; }
    if (y + a.h > H - 16) { page++; self.pages.push([]); x = pad; y = 26; rowH = 0; }
    self.pages[page].push({ key: a.key, x: x + a.w / 2, y: y + a.h / 2 });
    x += a.w + pad;
    if (a.h > rowH) rowH = a.h;
  });

  this.pageImgs = [];
  this.pageIdx = 0;

  var info = PC.atlasInfo || { frames: 0, placeholders: 0, w: 0, h: 0 };
  this.add.text(W / 2, 4, 'PORTION CONTROL - M0 ASSET GALLERY', {
    fontFamily: 'monospace', fontSize: '10px', color: '#f2c33c',
  }).setOrigin(0.5, 0).setDepth(5);
  this.info = this.add.text(W / 2, 15, '', {
    fontFamily: 'monospace', fontSize: '8px', color: '#cfd4e8',
  }).setOrigin(0.5, 0).setDepth(5);
  this.fpsText = this.add.text(2, H - 12, '', {
    fontFamily: 'monospace', fontSize: '8px', color: '#a8e04a',
  }).setDepth(5);
  this._statLine = 'atlas ' + info.w + 'x' + info.h + ' | ' + info.frames +
    ' frames | ' + info.placeholders + ' placeholder / ' +
    (info.frames - info.placeholders) + ' real art';

  this.showPage(0);

  // page flip: arrows / A-D, tap left or right half
  this.input.keyboard.on('keydown-RIGHT', function () { this.showPage(this.pageIdx + 1); }, this);
  this.input.keyboard.on('keydown-LEFT', function () { this.showPage(this.pageIdx - 1); }, this);
  this.input.on('pointerdown', function (p) {
    this.showPage(this.pageIdx + (p.x / PC.RENDER.SCALE > W / 2 ? 1 : -1));
  }, this);
};

PC.GalleryScene.prototype.showPage = function (idx) {
  var n = this.pages.length;
  this.pageIdx = ((idx % n) + n) % n;
  this.pageImgs.forEach(function (i) { i.destroy(); });
  this.pageImgs = [];
  var self = this;
  this.pages[this.pageIdx].forEach(function (f) {
    self.pageImgs.push(self.add.image(f.x, f.y, 'atlas', f.key));
  });
  this.info.setText(this._statLine + ' | page ' + (this.pageIdx + 1) + '/' + n +
    ' (arrows or tap to flip)');
};

PC.GalleryScene.prototype.update = function () {
  if (this.fpsText && this.game.loop) {
    this.fpsText.setText('fps ' + Math.round(this.game.loop.actualFps));
  }
};
