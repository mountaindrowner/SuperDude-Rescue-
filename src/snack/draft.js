// snack/draft.js - SNACK ATTACK level-up drafts (v0.80.0).
// [template section 10] The draft only offers what this save has
// unlocked; six weapons and six passives at most; a maxed item leaves the
// pool; an evolution is NEVER a draft card (it comes from a chest); a
// luck roll can make it four cards; reroll / skip / banish when owned;
// and a finished build gets gold or a snack instead of a dead end.
// Weapons have EIGHT ranks here [VS]. Ranks 1-5 are each weapon's own
// hand-tuned levels; ranks 6-8 scale its power through `mastery` (every
// weapon's damage reads it) and trim the cooldown once.
window.PC = window.PC || {};

PC.SnackDraft = {
  RANK_POWER: { 6: 1.15, 7: 1.32, 8: 1.5 },      // [TUNABLE] x base mastery

  weaponCardDesc: function (w) {
    var next = w.level + 1;
    if (next <= 5) return w.desc();
    if (next === 6) return 'More power! (+15% damage)';
    if (next === 7) return 'Faster and stronger!';
    return 'MAX RANK! Can EVOLVE from a chest';
  },

  draw: function (scene) {
    var sr = scene.snack, P = PC.SnackProfile, S = PC.SNACK;
    var pool = [], i, w, owned = {};
    for (i = 0; i < scene.weapons.length; i++) owned[scene.weapons[i].key] = scene.weapons[i];
    // owned weapons that can still rank up
    for (i = 0; i < scene.weapons.length; i++) {
      w = scene.weapons[i];
      if (w.evolved || w.level >= S.WEAPON_MAX || sr.banished[w.key]) continue;
      pool.push({ kind: 'weapon-up', w: w, key: w.key, wt: 1.4, title: w.name,
        sub: 'LV ' + (w.level + 1), desc: PC.SnackDraft.weaponCardDesc(w), icon: PC.WEAPON_ICONS[w.key] });
    }
    // new weapons while a slot is open
    if (scene.weapons.length < S.WEAPON_SLOTS) {
      for (var k in S.WEAPONS) {
        if (owned[k] || sr.banished[k] || !P.weaponInPool(k)) continue;
        pool.push({ kind: 'weapon-new', key: k, wt: 1.0, title: S.WEAPONS[k].title,
          sub: 'NEW!', desc: S.WEAPONS[k].desc, icon: PC.WEAPON_ICONS[k] });
      }
    }
    // passives: owned ones rank up; new ones while a slot is open
    var held = 0;
    for (var pk in scene.passives) if (scene.passives[pk] > 0) held++;
    for (var p in PC.PASSIVES) {
      var def = PC.PASSIVES[p], lv = scene.passives[p] || 0;
      if (sr.banished[p] || lv >= def.max) continue;
      if (lv === 0 && (held >= S.PASSIVE_SLOTS || !P.passiveInPool(p))) continue;
      pool.push({ kind: 'passive', pk: p, key: p, wt: lv ? 1.3 : 1.0, title: def.name,
        sub: lv ? 'LV ' + (lv + 1) : 'NEW!', desc: def.desc, icon: def.icon });
    }
    if (!pool.length) {
      // nothing left to grow [VS]: never a blank screen
      return [
        { kind: 'gold', amount: 25, title: 'POCKET MONEY', sub: '', desc: '+25 gold', icon: 'pickup_coin' },
        { kind: 'heal', title: 'SNACK BREAK', sub: '', desc: 'Heal 30 health', icon: 'pickup_medkit' },
      ];
    }
    var n = 3 + (Math.random() < (scene.stats.luck || 0) * S.FOURTH_CARD_PER_LUCK ? 1 : 0);
    var out = [];
    while (out.length < n && pool.length) {        // weighted, no duplicates
      var tot = 0, j;
      for (j = 0; j < pool.length; j++) tot += pool[j].wt;
      var r = Math.random() * tot;
      for (j = 0; j < pool.length; j++) { r -= pool[j].wt; if (r <= 0) break; }
      out.push(pool.splice(Math.min(j, pool.length - 1), 1)[0]);
    }
    return out;
  },

  rankUp: function (scene, w) {
    w.level++;
    if (w.level <= 5) { if (w.applyLevel) w.applyLevel(); }
    else {
      if (w._m0 === undefined) w._m0 = w.mastery || 1;
      w.mastery = w._m0 * (PC.SnackDraft.RANK_POWER[w.level] || 1);
      if (w.level === 7 && typeof w.cd === 'number') w.cd *= 0.9;
    }
    PC.SnackUnlocks.event(scene.snack, 'rank', { key: w.key, rank: w.level });
  },

  apply: function (scene, card) {
    var sr = scene.snack;
    if (card.kind === 'weapon-up') {
      PC.SnackDraft.rankUp(scene, card.w);
    } else if (card.kind === 'weapon-new') {
      var w = PC.SNACK.WEAPONS[card.key].make(scene);
      w.max = PC.SNACK.WEAPON_MAX;
      scene.weapons.push(w);
      PC.SnackUnlocks.event(sr, 'rank', { key: w.key, rank: w.level });
      PC.SnackUnlocks.event(sr, 'held', scene.weapons.length);
    } else if (card.kind === 'passive') {
      scene.passives[card.pk] = (scene.passives[card.pk] || 0) + 1;
      PC.PASSIVES[card.pk].apply(scene.stats, scene.passives[card.pk]);
    } else if (card.kind === 'gold') {
      PC.SnackProfile.addGold(card.amount);
      scene.pickups.gold += card.amount;
      PC.SnackUnlocks.event(sr, 'gold', card.amount);
    } else if (card.kind === 'heal') {
      var mh = PC.PLAYER.HP + (scene.stats.bonusHp || 0);
      var got = Math.max(0, Math.min(mh - scene.hp, 30));
      scene.hp += got;
      if (got > 0) PC.SnackUnlocks.event(sr, 'heal', got);
    }
  },

  // REROLL / SKIP / BANISH buttons under the cards [VS], only when owned
  decorate: function (scene, ui, y) {
    var sr = scene.snack, K = PC.uiK, W = PC.RENDER.W;
    var opts = [];
    if (sr.rerolls > 0) opts.push({ id: 'reroll', label: 'REROLL ' + sr.rerolls, col: 0x35d0ff });
    if (sr.skips > 0) opts.push({ id: 'skip', label: 'SKIP ' + sr.skips, col: 0xcfd4e8 });
    if (sr.banishes > 0) opts.push({ id: 'banish', label: (scene._banishMode ? 'TAP A CARD' : 'BANISH ' + sr.banishes), col: 0xff6b6b });
    if (!opts.length) return;
    var bw = K(74), gap = K(6), x0 = W / 2 - (opts.length * (bw + gap) - gap) / 2;
    opts.forEach(function (o, i) {
      var x = x0 + i * (bw + gap);
      var g = scene.add.graphics().setDepth(201);
      PC.labPanel(g, x, y, bw, K(20), { base: 0x1c1733, edge: o.col, radius: 3 });
      var t = scene.add.text(x + bw / 2, y + K(10), o.label, { fontFamily: 'monospace',
        fontSize: K(8) + 'px', color: '#' + ('00000' + o.col.toString(16)).slice(-6), fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(202);
      var z = scene.add.zone(x + bw / 2, y + K(10), bw, K(24)).setDepth(203).setInteractive({ useHandCursor: true });
      z.on('pointerdown', function (p, lx, ly, ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        if (Date.now() < (scene._cardsArmAt || 0)) return;     // a steering thumb, not a choice
        if (PC.audio) PC.audio.ui();
        if (o.id === 'reroll') { sr.rerolls--; scene._banishMode = false; scene.redrawCards(); }
        else if (o.id === 'skip') {
          sr.skips--; scene._banishMode = false;
          scene.xp += scene.xpNext * 0.1;            // [VS] a skip still gives a little XP
          scene.closeCards();
        } else if (o.id === 'banish') { scene._banishMode = !scene._banishMode; scene.redrawCards(true); }
      });
      ui.push(g, t, z);
    });
  },

  // banish mode: the tapped card leaves this run's pool, then a fresh draw
  banish: function (scene, card) {
    var sr = scene.snack;
    if (card.key && sr.banishes > 0 && card.kind !== 'gold' && card.kind !== 'heal') {
      sr.banished[card.key] = true;
      sr.banishes--;
    }
    scene._banishMode = false;
    scene.redrawCards();
  },
};
