// scenes/options.js - the OPTIONS panel (v0.80.1).
// The only settings UI used to live on the old Rush hero select; v0.80.0
// retired that screen and took the settings with it. This is the same
// three controls as one overlay any screen can open:
//   MUSIC volume, SOUND FX volume, DAMAGE NUMBERS on/off
// Opened from the title menu (the template's OPTIONS), the SNACK ATTACK
// hub, the in-run Snack pause and the district map (the Story pause).
// Values persist through PC.audio and PC.setDmgNumbers, which already
// guard their storage in try/catch.
//
// PC.OptionsPanel.open(scene, { onClose })
// In PC_Game the panel lives in the camera-pinned UI container, so taps
// are converted into that container's space before they move a slider.
window.PC = window.PC || {};

PC.OptionsPanel = {
  open: function (scene, opts) {
    opts = opts || {};
    if (scene._optionsOpen) return null;
    scene._optionsOpen = true;
    var W = PC.RENDER.W, H = PC.RENDER.H, K = PC.uiK, D = 260;
    var inGame = !!(scene.ui && scene.uiAttach);
    var ui = [];
    var keep = function (o) { ui.push(o); if (inGame) scene.uiAttach(o); return o; };
    // pointer -> panel coordinates (menus: the centered camera; in game:
    // the UI container pinned to the camera's world view, counter-scaled)
    var local = function (p) {
      var wp = scene.cameras.main.getWorldPoint(p.x, p.y);
      if (!inGame) return wp;
      var s = scene.ui.scaleX || 1;
      return { x: (wp.x - scene.ui.x) / s, y: (wp.y - scene.ui.y) / s };
    };

    keep(scene.add.rectangle(W / 2, H / 2, W, H, 0x0b0818, 0.82).setDepth(D));
    var swallow = keep(scene.add.zone(W / 2, H / 2, W, H).setDepth(D).setInteractive());
    swallow.on('pointerdown', function (p, lx, ly, ev) { if (ev && ev.stopPropagation) ev.stopPropagation(); });

    var pw = Math.min(W - K(24), K(280)), ph = K(214);
    var px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    var g = keep(scene.add.graphics().setDepth(D + 1));
    PC.labPanel(g, px, py, pw, ph, { rivets: true, base: 0x1c1733, edge: 0xf2c33c });
    keep(PC.ui.text(scene, W / 2, py + K(12), 'OPTIONS', 'title', { color: '#f2c33c', align: 'center' })
      .setOrigin(0.5, 0).setDepth(D + 2));

    var vols = function () { return PC.audio ? PC.audio.getVols() : { music: 0.10, sfx: 0.85 }; };
    var sliders = [];
    var slider = function (y, label, get, set) {
      var bw = pw - K(48), bx = W / 2 - bw / 2, bh = K(12);
      keep(PC.ui.text(scene, bx, y - K(18), label, 'caption', { color: '#cfd4e8' }).setDepth(D + 2));
      var pct = keep(PC.ui.text(scene, bx + bw, y - K(18), '', 'caption', { color: '#f2c33c' })
        .setOrigin(1, 0).setDepth(D + 2));
      var bar = keep(scene.add.graphics().setDepth(D + 2));
      var draw = function () {
        var v = get();
        bar.clear();
        bar.fillStyle(0x45356e, 1).fillRoundedRect(bx, y, bw, bh, bh / 2);
        bar.fillStyle(0xf2c33c, 1).fillRoundedRect(bx, y, Math.max(bh, bw * v), bh, bh / 2);
        bar.fillStyle(0xfff6e0, 1).fillCircle(bx + Math.max(bh / 2, bw * v - bh / 2), y + bh / 2, bh * 0.75);
        pct.setText(Math.round(v * 100) + '%');
      };
      var zone = keep(scene.add.zone(bx + bw / 2, y + bh / 2, bw + K(24), K(34)).setDepth(D + 3)
        .setInteractive({ useHandCursor: true }));
      var held = false;
      var dragTo = function (p) {
        var pt = local(p);
        set(Math.max(0, Math.min(1, (pt.x - bx) / bw)));
        draw();
      };
      zone.on('pointerdown', function (p, lx, ly, ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        if (PC.audio) PC.audio.unlock();
        held = true; dragTo(p);
      });
      var move = function (p) { if (held && p.isDown) dragTo(p); };
      var up = function () { held = false; };
      scene.input.on('pointermove', move);
      scene.input.on('pointerup', up);
      sliders.push({ move: move, up: up, draw: draw, bx: bx, bw: bw, y: y, set: set });
      draw();
    };
    slider(py + K(64), 'MUSIC',
      function () { return vols().music; },
      function (v) { if (PC.audio) PC.audio.setMusicVol(v); });
    slider(py + K(110), 'SOUND FX',
      function () { return vols().sfx; },
      function (v) { if (PC.audio) PC.audio.setSfxVol(v); });

    // damage numbers: a real toggle row
    var ty = py + K(136), tw = pw - K(48), tx = W / 2 - tw / 2, th = K(26);
    var tg = keep(scene.add.graphics().setDepth(D + 2));
    var tt = keep(PC.ui.text(scene, tx + K(10), ty + th / 2, 'DAMAGE NUMBERS', 'caption', { color: '#cfd4e8' })
      .setOrigin(0, 0.5).setDepth(D + 3));
    var tv = keep(PC.ui.text(scene, tx + tw - K(10), ty + th / 2, '', 'label', { color: '#a8e04a' })
      .setOrigin(1, 0.5).setDepth(D + 3));
    var drawToggle = function () {
      var on = !!PC.settings.dmgNums;
      tg.clear();
      PC.labPanel(tg, tx, ty, tw, th, { radius: 4, base: on ? 0x1c3320 : 0x1f1b35, edge: on ? 0xa8e04a : 0x45356e });
      tv.setText(on ? 'ON' : 'OFF').setColor(on ? '#a8e04a' : '#6d6a8e');
    };
    drawToggle();
    var tz = keep(scene.add.zone(W / 2, ty + th / 2, tw, th + K(6)).setDepth(D + 4).setInteractive({ useHandCursor: true }));
    tz.on('pointerdown', function (p, lx, ly, ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      PC.setDmgNumbers(!PC.settings.dmgNums);
      drawToggle();
      if (PC.audio) PC.audio.ui();
    });

    var close = function () {
      if (!scene._optionsOpen) return;
      scene._optionsOpen = false;
      sliders.forEach(function (s) { scene.input.off('pointermove', s.move); scene.input.off('pointerup', s.up); });
      scene.input.keyboard.off('keydown-ESC', escClose);
      ui.forEach(function (o) { o.destroy(); });
      if (opts.onClose) opts.onClose();
    };
    var escClose = function () { close(); };
    var bw = K(130), by = py + ph - K(24);
    var bg = keep(scene.add.graphics().setDepth(D + 2));
    PC.labPanel(bg, W / 2 - bw / 2, by - K(14), bw, K(28), { rivets: true, base: 0x1c3320, edge: 0xa8e04a });
    keep(PC.ui.text(scene, W / 2, by, 'DONE', 'label', { color: '#a8e04a', align: 'center' }).setOrigin(0.5).setDepth(D + 3));
    var bz = keep(scene.add.zone(W / 2, by, bw, K(32)).setDepth(D + 4).setInteractive({ useHandCursor: true }));
    bz.on('pointerdown', function (p, lx, ly, ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      if (PC.audio) PC.audio.ui();
      close();
    });
    // Esc closes it; armed after this frame so the key that opened a
    // parent overlay can't also close this one
    scene.time.delayedCall(0, function () { if (scene._optionsOpen) scene.input.keyboard.on('keydown-ESC', escClose); });
    // a scene restart must not leave the flag stuck
    scene.events.once('shutdown', function () { scene._optionsOpen = false; });
    return { close: close, sliders: sliders, toggle: tz };
  },
};
