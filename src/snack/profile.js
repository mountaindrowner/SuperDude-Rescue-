// snack/profile.js - the SNACK ATTACK save (v0.80.0). Separate from Story
// (Mark's call): its own key, its own wallet, its own shop and roster.
// [template section 21: ProfileSave] One JSON blob, written whole on
// every change (atomic as localStorage gets), every access in try/catch
// because itch.io's cross-site iframe can THROW on storage. If storage is
// blocked the game still plays; progress just lives for the session.
window.PC = window.PC || {};

PC.SnackProfile = (function () {
  var KEY = 'portioncontrol.snack';
  var SCHEMA = 1;
  var data = null;

  function fresh() {
    var heroes = { owned: ['danny'], forSale: [] };
    PC.SNACK.HEROES.forEach(function (h) { if (h.forSale) heroes.forSale.push(h.id); });
    var weapons = [];
    for (var k in PC.SNACK.WEAPONS) if (PC.SNACK.WEAPONS[k].start) weapons.push(k);
    return {
      schemaVersion: SCHEMA,
      wallet: 0,                       // gold you can spend
      lifetimeGold: 0,                 // gold ever collected (never spent down)
      spentPowerups: 0,                // for REFUND ALL
      heroes: heroes,                  // owned / for sale (unlocked to buy)
      selectedHero: 'danny',
      selectedStage: 'street',
      stages: ['street'],
      powerups: {},                    // id -> rank
      weapons: weapons,                // in the level-up pool
      passives: PC.SNACK.PASSIVES_START.slice(),
      relics: [],
      done: [],                        // completed achievement ids
      life: { kills: 0, fam: {}, healed: 0, crates: 0, medkits: 0, chests: 0, elites: 0,
              bosses: 0, gold: 0, pickups: {}, evolved: {}, clears: {}, runs: 0 },
      records: {},                     // stage -> { level, t, cleared }
      runCount: 0,
      lastRunId: null,
      seenIntro: false,
    };
  }
  // fill any field a newer build added, so old saves never lose money or unlocks
  function migrate(d) {
    var f = fresh(), k;
    for (k in f) if (d[k] === undefined) d[k] = f[k];
    for (k in f.life) if (d.life[k] === undefined) d.life[k] = f.life[k];
    for (k in PC.SNACK.WEAPONS) {
      if (PC.SNACK.WEAPONS[k].start && d.weapons.indexOf(k) < 0) d.weapons.push(k);
    }
    d.schemaVersion = SCHEMA;
    return d;
  }
  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    data = (d && typeof d === 'object' && d.schemaVersion) ? migrate(d) : fresh();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  function has(list, id) { return list.indexOf(id) >= 0; }

  var P = {
    get: function () { if (!data) load(); return data; },
    save: save,
    reset: function () { data = fresh(); save(); },
    reload: function () { load(); },

    // ---- heroes [VS]: price = base * (1 + 10% per hero already bought) ----
    heroState: function (id) {
      var d = P.get();
      if (has(d.heroes.owned, id)) return 'owned';
      if (has(d.heroes.forSale, id)) return 'forSale';
      return 'locked';
    },
    heroPrice: function (id) {
      var def = PC.SNACK.heroDef(id); if (!def) return 0;
      var bought = Math.max(0, P.get().heroes.owned.length - 1);
      return Math.floor(Math.min(def.price * (1 + PC.SNACK.HERO_PRICE_STEP * bought),
                                 def.price * PC.SNACK.HERO_PRICE_CAP));
    },
    buyHero: function (id) {
      var d = P.get();
      if (P.heroState(id) !== 'forSale') return false;
      var price = P.heroPrice(id);
      if (d.wallet < price) return false;
      d.wallet -= price;
      d.heroes.owned.push(id);
      d.heroes.forSale.splice(d.heroes.forSale.indexOf(id), 1);
      save();
      return true;
    },

    // ---- PowerUps [VS fee formula]:
    //   base = price * (1 + ranks of THIS powerup owned)
    //   fee  = 0 if no ranks bought anywhere, else floor(20 * 1.1^totalRanks)
    rank: function (id) { return P.get().powerups[id] || 0; },
    totalRanks: function () {
      var n = 0, pu = P.get().powerups;
      for (var k in pu) n += pu[k];
      return n;
    },
    powerupCost: function (id) {
      var def = PC.SNACK.powerupById(id); if (!def) return null;
      var own = P.rank(id);
      if (own >= def.max) return null;
      var total = P.totalRanks();
      var fee = total === 0 ? 0 : Math.floor(20 * Math.pow(1.1, total));
      return def.price * (1 + own) + fee;
    },
    buyPowerup: function (id) {
      var d = P.get(), cost = P.powerupCost(id);
      if (cost === null || d.wallet < cost) return false;
      d.wallet -= cost;
      d.spentPowerups += cost;
      d.powerups[id] = (d.powerups[id] || 0) + 1;
      save();
      return true;
    },
    // [VS] REFUND ALL: every rank back to zero, every coin back; heroes,
    // stages and achievements are untouched
    refundAll: function () {
      var d = P.get();
      d.wallet += d.spentPowerups;
      d.spentPowerups = 0;
      d.powerups = {};
      save();
    },

    stageOpen: function (id) { return has(P.get().stages, id); },
    weaponInPool: function (k) { return has(P.get().weapons, k); },
    passiveInPool: function (k) { return has(P.get().passives, k); },
    hasRelic: function (id) { return has(P.get().relics, id); },
    isDone: function (id) { return has(P.get().done, id); },

    // credit gold the moment it is picked up (template policy B: the
    // results screen only DISPLAYS it, so nothing is ever added twice)
    addGold: function (n) {
      var d = P.get();
      d.wallet += n; d.lifetimeGold += n; d.life.gold += n;
      save();
    },
    addRelic: function (id) {
      var d = P.get();
      if (has(d.relics, id)) return false;     // one-time, ever
      d.relics.push(id); save();
      return true;
    },

    // apply one achievement's rewards AND record it in the same write:
    // a reload between "paid" and "marked done" is impossible
    complete: function (ach) {
      var d = P.get();
      if (has(d.done, ach.id)) return false;
      d.done.push(ach.id);
      ach.rewards.forEach(function (rw) {
        if (rw.type === 'gold') { d.wallet += rw.amount; }
        else if (rw.type === 'weapon' && !has(d.weapons, rw.id)) d.weapons.push(rw.id);
        else if (rw.type === 'passive' && !has(d.passives, rw.id)) d.passives.push(rw.id);
        else if (rw.type === 'stage' && !has(d.stages, rw.id)) d.stages.push(rw.id);
        else if (rw.type === 'hero' && !has(d.heroes.owned, rw.id) && !has(d.heroes.forSale, rw.id)) d.heroes.forSale.push(rw.id);
      });
      save();
      return true;
    },

    // end of run: count it ONCE per run id, keep records
    commitRun: function (run) {
      var d = P.get();
      if (d.lastRunId === run.id) return false;
      d.lastRunId = run.id;
      d.runCount++;
      d.life.runs++;
      var rec = d.records[run.stage] || (d.records[run.stage] = { level: 0, t: 0, cleared: false });
      rec.level = Math.max(rec.level, run.level);
      rec.t = Math.max(rec.t, Math.floor(run.t));
      if (run.cleared) rec.cleared = true;
      save();
      return true;
    },
  };
  return P;
})();
