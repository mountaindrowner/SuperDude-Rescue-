// snack/chest.js - SNACK ATTACK treasure chests (v0.80.0).
// [template section 9] A chest holds 1, 3 or 5 rewards (luck helps). A
// reward upgrades something you already carry. EVOLUTION happens only
// here, only from a chest flagged eligible (elites from 5:00 on, every
// boss), and only for a weapon at rank 8 whose partner passive you own:
// maxing a weapon is never enough by itself. One evolution per chest.
window.PC = window.PC || {};

PC.SnackChest = {
  // pure resolver (tests call this directly): what the chest gives
  roll: function (scene, kind, evo) {
    var cfg = PC.SNACK.CHEST[kind] || PC.SNACK.CHEST.normal;
    var luck = scene.stats.luck || 0;
    var p5 = cfg.five * (1 + luck * 2), p3 = cfg.three * (1 + luck);
    var r = Math.random();
    var count = r < p5 ? 5 : (r < p5 + p3 ? 3 : 1);
    var out = [], evolved = false;
    for (var i = 0; i < count; i++) {
      var rec = (evo && !evolved) ? PC.SnackChest.evolvable(scene) : null;
      if (rec) {
        PC.SnackChest.evolve(scene, rec.rec, rec.w);
        out.push({ type: 'evolve', rec: rec.rec, w: rec.w }); evolved = true; continue;
      }
      // applied as we go, so a 5-chest can never pick an item it just maxed
      var up = PC.SnackChest.upgradable(scene);
      if (up) { PC.SnackChest.applyOne(scene, up); out.push(up); }
      else out.push({ type: 'gold', amount: 10 });
    }
    var g = cfg.gold[0] + Math.floor(Math.random() * (cfg.gold[1] - cfg.gold[0] + 1));
    out.forEach(function (it) { if (it.type === 'gold') g += it.amount; });
    return { count: count, items: out, gold: g };
  },

  evolvable: function (scene) {
    if (!PC.EVOLUTIONS) return null;
    for (var i = 0; i < scene.weapons.length; i++) {
      var w = scene.weapons[i];
      if (w.evolved || w.level < PC.SNACK.WEAPON_MAX) continue;
      for (var j = 0; j < PC.EVOLUTIONS.length; j++) {
        var rec = PC.EVOLUTIONS[j];
        if (rec.base === w.key && (scene.passives[rec.requires] || 0) > 0) return { rec: rec, w: w };
      }
    }
    return null;
  },

  upgradable: function (scene) {
    var c = [], i;
    for (i = 0; i < scene.weapons.length; i++) {
      var w = scene.weapons[i];
      if (!w.evolved && w.level < PC.SNACK.WEAPON_MAX) c.push({ type: 'weapon', w: w });
    }
    for (var k in scene.passives) {
      if (scene.passives[k] > 0 && scene.passives[k] < PC.SNACK.passive(k).max) c.push({ type: 'passive', pk: k });
    }
    return c.length ? c[(Math.random() * c.length) | 0] : null;
  },

  applyOne: function (scene, it) {
    if (it.type === 'weapon') PC.SnackDraft.rankUp(scene, it.w);
    else if (it.type === 'passive') {
      scene.passives[it.pk]++;
      PC.SNACK.passive(it.pk).apply(scene.stats, scene.passives[it.pk]);
    }
  },

  evolve: function (scene, rec, w) {
    rec.apply(w);
    w.evolved = true;
    PC.SnackUnlocks.event(scene.snack, 'evolve', rec.base);
  },

  // everything a chest DOES, with no UI (the reveal, tests and the
  // balance bot all go through this one path)
  grant: function (scene, kind, evo) {
    var sr = scene.snack;
    var res = PC.SnackChest.roll(scene, kind, evo);   // rewards already applied
    var gold = Math.max(1, Math.round(res.gold * (scene.stats.greedMult || 1) * sr.stage.mods.gold));
    PC.SnackProfile.addGold(gold);
    scene.pickups.gold += gold;
    PC.SnackUnlocks.event(sr, 'gold', gold);
    PC.SnackUnlocks.event(sr, 'chest');
    scene.drawHud();
    res.goldPaid = gold;
    return res;
  },

  open: function (scene, kind, evo) {
    var K = PC.uiK, W = PC.RENDER.W, H = PC.RENDER.H;
    scene.snackHold = true;
    var res = PC.SnackChest.grant(scene, kind, evo);
    var gold = res.goldPaid;
    if (PC.audio) { PC.audio.chest(); if (PC.audio.fanfare && res.count > 1) PC.audio.fanfare(); }

    // ---- the reveal ----
    var ui = [];
    var keep = function (o) { ui.push(o); scene.uiAttach(o); return o; };
    keep(scene.add.rectangle(W / 2, H / 2, W, H, 0x0b0818, 0.78).setDepth(200));
    var rowH = K(30), ph = K(64) + res.items.length * rowH + K(26);
    var pw = Math.min(W - K(24), K(260)), px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    var g = keep(scene.add.graphics().setDepth(201));
    var edge = res.count === 5 ? 0xff9ecb : (res.count === 3 ? 0x35d0ff : 0xf2c33c);
    PC.labPanel(g, px, py, pw, ph, { rivets: true, base: 0x2a2210, edge: edge });
    keep(PC.ui.text(scene, W / 2, py + K(10), res.count === 5 ? 'MEGA TREASURE!' : res.count === 3 ? 'BIG TREASURE!' : 'TREASURE!',
      'title', { color: '#f2c33c', align: 'center' }).setOrigin(0.5, 0).setDepth(202));
    res.items.forEach(function (it, i) {
      var y = py + K(40) + i * rowH;
      var icon, label, col = '#f7f4ef';
      if (it.type === 'evolve') { icon = PC.WEAPON_ICONS[it.w.key]; label = 'EVOLVED: ' + it.rec.name; col = '#ff9ecb'; }
      else if (it.type === 'weapon') { icon = PC.WEAPON_ICONS[it.w.key]; label = it.w.name + '  LV ' + it.w.level; }
      else if (it.type === 'passive') { icon = PC.PASSIVES[it.pk].icon; label = PC.PASSIVES[it.pk].name + '  LV ' + scene.passives[it.pk]; }
      else { icon = 'pickup_coin'; label = '+' + it.amount + ' GOLD'; }
      var im = keep(scene.add.image(px + K(22), y + rowH / 2, 'atlas', icon).setDisplaySize(K(22), K(22)).setDepth(202).setAlpha(0));
      var t = keep(PC.ui.text(scene, px + K(40), y + rowH / 2, label, it.type === 'evolve' ? 'label' : 'body', { color: col })
        .setOrigin(0, 0.5).setDepth(202).setAlpha(0));
      PC.ui.fit(t, pw - K(52));
      scene.tweens.add({ targets: [im, t], alpha: 1, delay: 250 + i * 260, duration: 200 });
    });
    keep(PC.ui.text(scene, W / 2, py + ph - K(36), '+' + gold + ' GOLD', 'label', { color: '#f2c33c', align: 'center' })
      .setOrigin(0.5, 0).setDepth(202));
    var hint = keep(PC.ui.text(scene, W / 2, py + ph - K(16), 'TAP TO KEEP GOING', 'caption', { color: '#a8e04a', align: 'center' })
      .setOrigin(0.5, 0).setDepth(202).setAlpha(0));
    var ready = false;
    scene.time.delayedCall(300 + res.items.length * 260, function () {
      ready = true;
      scene.tweens.add({ targets: hint, alpha: 1, duration: 200, yoyo: true, repeat: -1 });
    });
    var zone = keep(scene.add.zone(W / 2, H / 2, W, H).setDepth(203).setInteractive());
    var close = function () {
      if (!ready) return;
      ui.forEach(function (o) { o.destroy(); });
      scene.releaseHold();
      scene.input.keyboard.off('keydown-SPACE', close);
      scene.input.keyboard.off('keydown-ENTER', close);
      scene.drawHud();
    };
    zone.on('pointerdown', function (p, lx, ly, ev) { if (ev && ev.stopPropagation) ev.stopPropagation(); close(); });
    scene.input.keyboard.on('keydown-SPACE', close);
    scene.input.keyboard.on('keydown-ENTER', close);
    return res;
  },
};
