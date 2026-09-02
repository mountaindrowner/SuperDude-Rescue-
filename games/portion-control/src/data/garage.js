// garage.js - THE SUPER DUDE GARAGE: the Tech Point sink (STORY_SPEC
// I.1 "TP -> hero ABILITIES at the Super Dude Garage").
// Mark's economy split, in one sentence a kid can hold:
//   COINS make the WHOLE TEAM tougher   (Sal's Corner Store passives)
//   TECH  makes YOUR hero's OWN power cooler (here)
// A garage rank pre-levels that hero's SIGNATURE weapon, so you START
// the mission at level 1+rank instead of 1. Signatures stay exclusive -
// buying Kevin's Air Support never gives it to Danny, it just makes
// Kevin's better (Mark: "Super Dude Danny would not get Kevin's
// bombing run"). Ranks stop at 3 of the weapon's 5 levels so in-run
// level-ups still have somewhere to climb.
window.PC = window.PC || {};

// v0.76.0 ECONOMY FLIP (Mark: "spend your tech points on passives and
// your money on abilities and weapons"): signature ranks and gadgets
// are bought with GOLD now; TECH went to the passives (powerups.js).
// tp() is kept for callers that still print the wallet.
PC.GARAGE = {
  COSTS: [120, 240, 400],         // GOLD for rank 1, 2, 3

  // ---- GEAR: one-time TP gadgets that soft-gate story maps (spec
  // I.2 "you must engage the Garage to progress"). v0.34.0: the
  // Hydro-Drill opens the Sewers' sealed Main Grate. ----
  GEAR: [
    { id: 'hydrodrill', name: 'HYDRO-DRILL', cost: 300, icon: 'icon_weapon_cutter',
      desc: "Vic's water-jet cutter. Opens the sealed Main Grate down to THE UNDERGROUND." },
  ],
  gearById: function (id) {
    for (var i = 0; i < this.GEAR.length; i++) if (this.GEAR[i].id === id) return this.GEAR[i];
    return null;
  },
  hasGear: function (id) { return PC.meta ? !!PC.meta.stat('gear_' + id) : false; },
  buyGear: function (id) {
    var g = this.gearById(id);
    if (!g || this.hasGear(id) || this.gold() < g.cost) return false;
    PC.meta.spendGold(g.cost);
    PC.meta.setFlag('gear_' + id);
    return true;
  },

  rank: function (heroId) { return PC.meta ? PC.meta.stat('garage_' + heroId) : 0; },
  maxRank: function () { return this.COSTS.length; },
  tp: function () { return PC.meta ? PC.meta.stat('tp') : 0; },
  gold: function () { return PC.meta ? PC.meta.gold() : 0; },

  nextCost: function (heroId) {
    var r = this.rank(heroId);
    return r >= this.COSTS.length ? null : this.COSTS[r];
  },

  canBuy: function (heroId) {
    var c = this.nextCost(heroId);
    return c !== null && this.gold() >= c;
  },

  buy: function (heroId) {
    var c = this.nextCost(heroId);
    if (c === null || this.gold() < c) return false;
    PC.meta.spendGold(c);
    PC.meta.bump('garage_' + heroId, 1);
    return true;
  },

  // what the next rank actually does, straight from the weapon's own
  // per-level description so the shop can never lie about the effect
  nextDesc: function (heroId) {
    var kit = PC.KITS && PC.KITS[heroId];
    if (!kit) return '';
    var r = this.rank(heroId);
    if (r >= this.COSTS.length) return 'FULLY TUNED';
    try {
      var w = kit.weapon({ stats: {}, now: 0, px: 0, py: 0 });
      w.level = 1 + r;
      return (w.desc && w.desc()) || 'Power up!';
    } catch (e) { return 'Power up!'; }
  },
};
