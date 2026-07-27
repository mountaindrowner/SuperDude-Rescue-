// powerups.js - WP-METASHOP: permanent gold-bought power-ups with ranks
// (PHASE2 7). Pure data + the PC.meta persistence/apply layer. Effects
// EXTEND the existing stats pipeline: hero* bases compose with passives;
// meta* bases are folded into the passive formulas in weapons.js so a
// shop rank is never wiped by an in-run card. All costs are knobs.
// Faith-themed entries authored by Claude at Mark's request
// (2026-07-25 "I prefer if you did... I know you won't be
// disrespectful") - Mark reviews all copy.
window.PC = window.PC || {};

PC.POWERUPS = [
  { id: 'muscles', name: 'BIGGER MUSCLES', icon: 'icon_passive_battery',
    desc: '+4% damage per rank',
    costs: [150, 300, 550, 900, 1400],
    apply: function (scene, r) { scene.stats.heroDmg *= 1 + 0.04 * r; } },
  { id: 'quickhands', name: 'QUICK HANDS', icon: 'icon_passive_fan',
    desc: '-3% cooldowns per rank',
    costs: [150, 300, 550, 900, 1400],
    apply: function (scene, r) { scene.stats.heroCd *= 1 - 0.03 * r; } },
  { id: 'runningstart', name: 'RUNNING START', icon: 'icon_passive_shoes',
    desc: '+3% move speed per rank',
    costs: [150, 300, 550, 900, 1400],
    apply: function (scene, r) { scene.stats.heroSpd *= 1 + 0.03 * r; } },
  { id: 'bigappetite', name: 'BIG APPETITE', icon: 'icon_passive_leftovers',
    desc: '+10 max HP per rank',
    costs: [150, 300, 550, 900, 1400],
    apply: function (scene, r) { scene.stats.metaHp += 10 * r; } },
  { id: 'longarms', name: 'LONG ARMS', icon: 'icon_passive_servo',
    desc: '+6% weapon area per rank',
    costs: [200, 450, 800],
    apply: function (scene, r) { scene.stats.metaArea *= 1 + 0.06 * r; } },
  { id: 'snackradar', name: 'SNACK RADAR', icon: 'icon_passive_magnet',
    desc: '+15% pickup range per rank',
    costs: [200, 450, 800],
    apply: function (scene, r) { scene.stats.metaPickup *= 1 + 0.15 * r; } },
  { id: 'fastfood', name: 'FAST FOOD', icon: 'icon_passive_lens',
    desc: '+6% shot speed per rank',
    costs: [200, 450, 800],
    apply: function (scene, r) { scene.stats.metaProj *= 1 + 0.06 * r; } },
  { id: 'sharpeyes', name: 'SHARP EYES', icon: 'icon_weapon_beam',
    desc: '+5% XP per rank',
    costs: [150, 300, 550, 900, 1400],
    apply: function (scene, r) { scene.xpMult *= 1 + 0.05 * r; } },
  { id: 'luckyspoon', name: 'LUCKY SPOON', icon: 'pickup_coin',
    desc: '+10% gold per rank',
    costs: [120, 250, 450, 700, 1000],
    apply: function (scene, r) { scene.goldMult = (scene.goldMult || 1) * (1 + 0.10 * r); } },
  { id: 'secondhelping', name: 'SECOND HELPING', icon: 'icon_passive_duplicator',
    desc: '+1 projectile to all weapons',
    costs: [4000],
    apply: function (scene, r) { scene.stats.metaExtraProj += r; } },
  // ---- faith-themed (kid-friendly, encouraging - Mark reviews) ----
  { id: 'armorofgod', name: 'ARMOR OF GOD', icon: 'icon_passive_coat',
    desc: 'Block +1 damage per rank',
    costs: [400, 900, 1600],
    apply: function (scene, r) { scene.stats.metaArmor += r; } },
  { id: 'dailybread', name: 'DAILY BREAD', icon: 'still_d1_toast',
    desc: 'Slowly heal +0.4 HP/s per rank',
    costs: [300, 700, 1200],
    apply: function (scene, r) { scene.stats.metaRegen += 0.4 * r; } },
  { id: 'mustardseed', name: 'MUSTARD SEED', icon: 'icon_weapon_seeds',
    desc: 'Tiny seed, big start: begin every run with a level-up',
    costs: [1500],
    apply: function (scene, r) { scene._mustardSeed = true; } },
  { id: 'amazinggrace', name: 'AMAZING GRACE', icon: 'pickup_medkit',
    desc: 'Get back up once per run at half health',
    costs: [8000],
    apply: function (scene, r) { scene.reviveCharges = (scene.reviveCharges || 0) + 1; } },
];

// ---- persistence + application ----
PC.meta = (function () {
  var KEY = 'portioncontrol.meta';
  var data;
  try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!data || typeof data !== 'object') data = { pu: {} };
  if (!data.pu) data.pu = {};

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  function byId(id) {
    for (var i = 0; i < PC.POWERUPS.length; i++)
      if (PC.POWERUPS[i].id === id) return PC.POWERUPS[i];
    return null;
  }
  return {
    rank: function (id) { return data.pu[id] || 0; },
    // gold lives in pickups' existing key - extend, don't fork (PHASE2)
    gold: function () {
      var g = 0;
      try { g = parseInt(localStorage.getItem('portioncontrol.gold') || '0', 10) || 0; } catch (e) {}
      return g;
    },
    nextCost: function (id) {
      var p = byId(id); if (!p) return null;
      var r = data.pu[id] || 0;
      return r >= p.costs.length ? null : p.costs[r];
    },
    buy: function (id) {
      var cost = this.nextCost(id);
      if (cost === null || this.gold() < cost) return false;
      try { localStorage.setItem('portioncontrol.gold', String(this.gold() - cost)); } catch (e) {}
      data.pu[id] = (data.pu[id] || 0) + 1;
      save();
      return true;
    },
    // run-start hook: fold every purchased rank into the scene stats
    applyAll: function (scene) {
      var st = scene.stats;
      st.metaHp = 0; st.metaArea = 1; st.metaPickup = 1; st.metaProj = 1;
      st.metaExtraProj = 0; st.metaArmor = 0; st.metaRegen = 0;
      PC.POWERUPS.forEach(function (p) {
        var r = data.pu[p.id] || 0;
        if (r > 0) p.apply(scene, r);
      });
      // seed the live values (passive cards recompute them composing on meta*)
      st.bonusHp += st.metaHp;
      st.areaMult *= st.metaArea;
      st.pickupMult *= st.metaPickup;
      st.projMult *= st.metaProj;
      st.extraProj += st.metaExtraProj;
      st.armor += st.metaArmor;
      st.regen += st.metaRegen;
    },
  };
})();
