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

PC.GARAGE = {
  COSTS: [60, 120, 200],          // TP for rank 1, 2, 3

  rank: function (heroId) { return PC.meta ? PC.meta.stat('garage_' + heroId) : 0; },
  maxRank: function () { return this.COSTS.length; },
  tp: function () { return PC.meta ? PC.meta.stat('tp') : 0; },

  nextCost: function (heroId) {
    var r = this.rank(heroId);
    return r >= this.COSTS.length ? null : this.COSTS[r];
  },

  canBuy: function (heroId) {
    var c = this.nextCost(heroId);
    return c !== null && this.tp() >= c;
  },

  buy: function (heroId) {
    var c = this.nextCost(heroId);
    if (c === null || this.tp() < c) return false;
    PC.meta.bump('tp', -c);
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
