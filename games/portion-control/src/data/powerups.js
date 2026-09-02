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
    desc: 'ALL weapons hit 4% harder per rank',
    costs: [30, 60, 110, 180, 280],
    apply: function (scene, r) { scene.stats.heroDmg *= 1 + 0.04 * r; } },
  { id: 'quickhands', name: 'QUICK HANDS', icon: 'icon_passive_fan',
    desc: 'ALL weapons fire sooner (3% per rank)',
    costs: [30, 60, 110, 180, 280],
    apply: function (scene, r) { scene.stats.heroCd *= 1 - 0.03 * r; } },
  { id: 'runningstart', name: 'RUNNING START', icon: 'icon_passive_shoes',
    desc: 'You run 3% faster per rank',
    costs: [30, 60, 110, 180, 280],
    apply: function (scene, r) { scene.stats.heroSpd *= 1 + 0.03 * r; } },
  { id: 'bigappetite', name: 'BIG APPETITE', icon: 'icon_passive_leftovers',
    desc: '+10 max health per rank',
    costs: [30, 60, 110, 180, 280],
    apply: function (scene, r) { scene.stats.metaHp += 10 * r; } },
  { id: 'longarms', name: 'LONG ARMS', icon: 'icon_passive_servo',
    desc: 'Blasts, rings & swings reach 6% wider per rank',
    costs: [40, 90, 160],
    apply: function (scene, r) { scene.stats.metaArea *= 1 + 0.06 * r; } },
  { id: 'snackradar', name: 'SNACK RADAR', icon: 'icon_passive_magnet',
    desc: 'Gems & coins fly to you from farther away',
    costs: [40, 90, 160],
    apply: function (scene, r) { scene.stats.metaPickup *= 1 + 0.15 * r; } },
  { id: 'fastfood', name: 'FAST FOOD', icon: 'icon_passive_lens',
    desc: 'Anything you SHOOT flies 6% faster per rank',
    costs: [40, 90, 160],
    apply: function (scene, r) { scene.stats.metaProj *= 1 + 0.06 * r; } },
  { id: 'sharpeyes', name: 'SHARP EYES', icon: 'icon_weapon_beam',
    desc: 'Gems are worth 5% more per rank',
    costs: [30, 60, 110, 180, 280],
    apply: function (scene, r) { scene.xpMult *= 1 + 0.05 * r; } },
  { id: 'luckyspoon', name: 'LUCKY SPOON', icon: 'pickup_coin',
    desc: 'Coins are worth 10% more per rank',
    costs: [25, 50, 90, 140, 200],
    apply: function (scene, r) { scene.goldMult = (scene.goldMult || 1) * (1 + 0.10 * r); } },
  { id: 'secondhelping', name: 'SECOND HELPING', icon: 'icon_passive_duplicator',
    desc: 'Shooting weapons fire +1 extra shot, always',
    costs: [800],
    apply: function (scene, r) { scene.stats.metaExtraProj += r; } },
  // ---- faith-themed (kid-friendly, encouraging - Mark reviews) ----
  { id: 'armorofgod', name: 'ARMOR OF GOD', icon: 'icon_passive_coat',
    desc: 'Every hit hurts you 1 less per rank',
    costs: [80, 180, 320],
    apply: function (scene, r) { scene.stats.metaArmor += r; } },
  { id: 'dailybread', name: 'DAILY BREAD', icon: 'still_d1_toast',
    desc: 'Heal a little every second, forever',
    costs: [60, 140, 240],
    apply: function (scene, r) { scene.stats.metaRegen += 0.4 * r; } },
  { id: 'mustardseed', name: 'MUSTARD SEED', icon: 'icon_weapon_seeds',
    desc: 'Head start: a free upgrade at every mission start',
    costs: [300],
    apply: function (scene, r) { scene._mustardSeed = true; } },
  { id: 'amazinggrace', name: 'AMAZING GRACE', icon: 'pickup_medkit',
    desc: 'Get back up once per run at half health',
    costs: [1600],
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
  if (!data.st) data.st = {};   // lifetime stats (hero unlock conditions)

  return {
    rank: function (id) { return data.pu[id] || 0; },
    // ---- lifetime stat tracking (v0.13.0 hero unlocks) ----
    stat: function (k) { return data.st[k] || 0; },
    bump: function (k, v) { data.st[k] = (data.st[k] || 0) + (v || 1); save(); },
    maxStat: function (k, v) {
      if ((v || 0) > (data.st[k] || 0)) { data.st[k] = v; save(); }
    },
    setFlag: function (k) {
      if (!data.st[k]) { data.st[k] = 1; save(); }
    },
    spendGold: function (n) {
      if (this.gold() < n) return false;
      try { localStorage.setItem('portioncontrol.gold', String(this.gold() - n)); } catch (e) {}
      return true;
    },
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
    // v0.76.0 (Mark: "spend your tech points on passives, spend your
    // money on abilities and weapons"): passives are bought with TECH
    // now. Costs in PC.POWERUPS are TECH amounts.
    buy: function (id) {
      var cost = this.nextCost(id);
      if (cost === null || this.stat('tp') < cost) return false;
      data.st.tp = (data.st.tp || 0) - cost;
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
