// snack/achievements.js - the SNACK ATTACK unlock catalogue (v0.80.0).
// The template's key design trick: one reward is never just one thing.
// Breaking crates puts KETCHUP ARTILLERY in the pool; ranking up the
// MICROWAVE BEAM lets you BUY Carlos; Carlos then unlocks COMET BEAM for
// everyone. Each row: id, title, how (the goal as a kid reads it), a
// check(run, life) over the run / lifetime counters kept by
// snack/unlocks.js, and rewards. Rewards pay exactly once.
//   run  = this run so far:  t, level, stage, hero, ranks{}, held, gold,
//          kills, healed, pickups{}, curse
//   life = all runs ever:    kills, fam{}, healed, crates, medkits, chests,
//          elites, bosses, gold, pickups{}, evolved{}, clears{}, runs
// Template row it mirrors is noted where it maps to a [VS] unlock.
window.PC = window.PC || {};

PC.SNACK.ACHIEVEMENTS = [
  // ---- first-run discoveries ----
  { id: 'lvl5',   title: 'GETTING STRONGER', how: 'Reach level 5',                  // [VS] Wings
    check: function (r) { return r.level >= 5; },   rewards: [{ type: 'passive', id: 'shoes' }] },
  { id: 'lvl10',  title: 'STAR STUDENT',     how: 'Reach level 10',                 // [VS] Crown
    check: function (r) { return r.level >= 10; },  rewards: [{ type: 'passive', id: 'growth' }] },
  { id: 'surv1',  title: 'STILL STANDING',   how: 'Survive 1 minute',               // [VS] Hollow Heart
    check: function (r) { return r.t >= 60; },      rewards: [{ type: 'passive', id: 'leftovers' }] },
  { id: 'surv5',  title: 'HALFWAY HERO',     how: 'Survive 5 minutes',              // [VS] Peachone (10 min, halved)
    check: function (r) { return r.t >= 300; },     rewards: [{ type: 'weapon', id: 'drone' }] },
  { id: 'surv10', title: 'IRON STOMACH',     how: 'Survive 10 minutes',             // [VS] Pentagram (20 min, halved)
    check: function (r) { return r.t >= 600; },     rewards: [{ type: 'weapon', id: 'vortex' }] },
  { id: 'crates', title: 'BOX BREAKER',      how: 'Break 10 supply crates (all runs)', // [VS] 20 light sources
    check: function (r, l) { return l.crates >= 10; }, rewards: [{ type: 'weapon', id: 'ketchup' }] },
  { id: 'medkits', title: 'FIRST AID FAN',   how: 'Pick up 5 medkits (all runs)',   // [VS] floor chicken -> Garlic
    check: function (r, l) { return l.medkits >= 5; }, rewards: [{ type: 'weapon', id: 'pineapple' }] },
  { id: 'vacuum', title: 'SNACK VACUUM',     how: 'Find a Snack Vacuum in a crate', // [VS] Vacuum -> Attractorb
    check: function (r, l) { return (l.pickups.vacuum || 0) >= 1; }, rewards: [{ type: 'passive', id: 'magnet' }] },
  { id: 'bomb',   title: 'BIG POP',          how: 'Find a Snack Bomb in a crate',   // [VS] Rosary -> Cross
    check: function (r, l) { return (l.pickups.bomb || 0) >= 1; }, rewards: [{ type: 'weapon', id: 'cutter' }] },
  { id: 'freeze', title: 'BRAIN FREEZE',     how: 'Find a Freeze Bell in a crate',  // [VS] Orologion -> Clock Lancet
    check: function (r, l) { return (l.pickups.freeze || 0) >= 1; }, rewards: [{ type: 'weapon', id: 'freeze' }] },
  { id: 'penny',  title: 'LUCKY DAY',        how: 'Find a Lucky Penny in a crate',  // [VS] Little Clover -> Clover
    check: function (r, l) { return (l.pickups.penny || 0) >= 1; }, rewards: [{ type: 'passive', id: 'luck' }] },

  // ---- the stage ladder [VS]: reach the level DURING a run there ----
  { id: 'gate_park',  title: 'INTO THE PARK',     how: 'Reach level 20 on MAIN STREET',
    check: function (r) { return r.stage === 'street' && r.level >= 20; }, rewards: [{ type: 'stage', id: 'park' }] },
  { id: 'gate_sub',   title: 'SUGAR RUSH',        how: 'Reach level 30 in ADVENTURE PARK',
    check: function (r) { return r.stage === 'park' && r.level >= 30; }, rewards: [{ type: 'stage', id: 'suburbs' }] },
  { id: 'gate_labs',  title: 'LAB ACCESS',        how: 'Reach level 40 in SWEET SUBURBS',
    check: function (r) { return r.stage === 'suburbs' && r.level >= 40; }, rewards: [{ type: 'stage', id: 'labs' }] },
  { id: 'gate_under', title: 'DOWN THE DRAIN',    how: 'Reach level 50 in SUPER DUDE LABS',
    check: function (r) { return r.stage === 'labs' && r.level >= 50; }, rewards: [{ type: 'stage', id: 'underground' }] },

  // ---- heroes share their signature weapons [VS: Pasqualina -> Runetracer] ----
  // v0.80.6: 5 -> 8 minutes - they always landed on the same second as
  // 'Survive 5 minutes', stacking run 1's unlock flood
  { id: 'sig_danny', title: 'SHRINK IT ALL',  how: 'Survive 8 minutes as DANNY',
    check: function (r) { return r.hero === 'danny' && r.t >= 480; },    rewards: [{ type: 'weapon', id: 'resizer' }] },
  { id: 'sig_vic',   title: 'TURRET TIME',    how: 'Survive 8 minutes as VICTORIA',
    check: function (r) { return r.hero === 'victoria' && r.t >= 480; }, rewards: [{ type: 'weapon', id: 'sentry' }] },
  { id: 'sig_josh',  title: 'YEE-HAW',        how: 'Survive 8 minutes as JOSH',
    check: function (r) { return r.hero === 'josh' && r.t >= 480; },     rewards: [{ type: 'weapon', id: 'lasso' }] },
  { id: 'sig_kevin', title: 'AIR SUPPORT',    how: 'Survive 8 minutes as KEVIN',
    check: function (r) { return r.hero === 'kevin' && r.t >= 480; },    rewards: [{ type: 'weapon', id: 'strike' }] },
  { id: 'sig_carlos', title: 'STARGAZER',     how: 'Survive 8 minutes as CARLOS',
    check: function (r) { return r.hero === 'carlos' && r.t >= 480; },   rewards: [{ type: 'weapon', id: 'beam' }] },
  { id: 'sig_nayah', title: 'GREEN THUMB',    how: 'Survive 8 minutes as NAYAH',
    check: function (r) { return r.hero === 'nayah' && r.t >= 480; },    rewards: [{ type: 'weapon', id: 'seeds' }] },

  // ---- weapon ranks open new things [VS: rank 4 / rank 7 rows] ----
  { id: 'whisk4',  title: 'WHISK IT',          how: 'Get WHISK CYCLONE to rank 4',
    check: function (r) { return (r.ranks.whisk || 0) >= 4; },     rewards: [{ type: 'passive', id: 'lens' }] },
  { id: 'salt4',   title: 'A PINCH MORE',      how: 'Get SALT SHAKER to rank 4',
    check: function (r) { return (r.ranks.salt || 0) >= 4; },      rewards: [{ type: 'passive', id: 'servo' }] },
  { id: 'carlos',  title: 'BEAM ME UP',        how: 'Get MICROWAVE BEAM to rank 4',      // [VS] Fire Wand 4 -> Arca
    check: function (r) { return (r.ranks.microwave || 0) >= 4; }, rewards: [{ type: 'hero', id: 'carlos' }] },
  { id: 'resizer7', title: 'COPY THAT',        how: 'Get RESIZER RAY to rank 7',         // [VS] Magic Wand 7 -> Duplicator
    check: function (r) { return (r.ranks.resizer || 0) >= 7; },   rewards: [{ type: 'passive', id: 'duplicator' }] },
  { id: 'drone7',  title: 'GIZMO GANG',        how: 'Get THE GIZMOTRON to rank 7',       // [VS] Peachone 7 -> Ebony Wings
    check: function (r) { return (r.ranks.drone || 0) >= 7; },     rewards: [{ type: 'weapon', id: 'sprinkle' }] },
  { id: 'freeze7', title: 'COLD AS ICE',       how: 'Get FREEZE RAY to rank 7',          // [VS] Runetracer 7 -> Spellbinder
    check: function (r) { return (r.ranks.freeze || 0) >= 7; },    rewards: [{ type: 'passive', id: 'slowcooker' }] },
  { id: 'pine7',   title: 'SPIKY',             how: 'Get PINEAPPLE GUARD to rank 7',
    check: function (r) { return (r.ranks.pineapple || 0) >= 7; }, rewards: [{ type: 'weapon', id: 'grease' }] },
  { id: 'hold6',   title: 'FULL HANDS',        how: 'Hold 6 different weapons at once',  // [VS] Empty Tome
    check: function (r) { return r.held >= 6; },                   rewards: [{ type: 'passive', id: 'fan' }] },

  // ---- lifetime and big-run goals [VS: Clerici / Dommario / Mortaccio / Lama] ----
  { id: 'nayah',   title: 'PATCHED UP',        how: 'Recover 300 health (all runs)',
    check: function (r, l) { return l.healed >= 300; },  rewards: [{ type: 'hero', id: 'nayah' }] },
  { id: 'rich',    title: 'POCKETS FULL',      how: 'Collect 300 gold in one run',
    check: function (r) { return r.gold >= 300; },       rewards: [{ type: 'weapon', id: 'skillet' }] },
  { id: 'fries',   title: 'FRY FIGHTER',       how: 'Pop 1,000 fries (all runs)',
    check: function (r, l) { return (l.fam.fry || 0) >= 1000; }, rewards: [{ type: 'weapon', id: 'jaw' }] },
  { id: 'cursed',  title: 'BRING IT ON',       how: 'Survive 10 minutes with TOUGH CROWD on',
    check: function (r) { return r.curse > 0 && r.t >= 600; }, rewards: [{ type: 'weapon', id: 'espresso' }] },
  { id: 'greedy',  title: 'PIGGY BANK',        how: 'Collect 1,000 gold (all runs)',
    check: function (r, l) { return l.gold >= 1000; },   rewards: [{ type: 'passive', id: 'greed' }] },
  { id: 'pops100', title: 'POP STAR',          how: 'Pop 250 snacks (all runs)',      // v0.80.6: 100 -> 250 (spreads run 1)
    check: function (r, l) { return l.kills >= 250; },   rewards: [{ type: 'gold', amount: 50 }] },
  { id: 'pops5k',  title: 'POP LEGEND',        how: 'Pop 5,000 snacks (all runs)',
    check: function (r, l) { return l.kills >= 5000; },  rewards: [{ type: 'gold', amount: 500 }] },
  { id: 'elites5', title: 'GOLDEN GOBBLER',    how: 'Pop 5 golden elites (all runs)',
    check: function (r, l) { return l.elites >= 5; },    rewards: [{ type: 'gold', amount: 150 }] },
  { id: 'chests10', title: 'TREASURE HUNTER',  how: 'Open 10 treasure chests (all runs)',
    check: function (r, l) { return l.chests >= 10; },   rewards: [{ type: 'gold', amount: 200 }] },
  { id: 'lvl35',   title: 'SUPER DUPER',       how: 'Reach level 35 in any run',
    check: function (r) { return r.level >= 35; },       rewards: [{ type: 'gold', amount: 300 }] },
];

// ---- generated rows: every stage clear and every evolution [VS: "Evolve X" -> gold]
(function () {
  var A = PC.SNACK.ACHIEVEMENTS;
  var CLEAR_REWARD = { street: { type: 'weapon', id: 'zap' } };
  PC.SNACK.STAGES.forEach(function (st) {
    var rw = [{ type: 'gold', amount: 250 }];
    if (CLEAR_REWARD[st.id]) rw.push(CLEAR_REWARD[st.id]);
    A.push({ id: 'clear_' + st.id, title: st.title + ' CLEARED', how: 'Survive all 15:00 in ' + st.title,
      cat: 'stage', check: function (r, l) { return !!l.clears[st.id]; }, rewards: rw });
  });
  (PC.EVOLUTIONS || []).forEach(function (rec) {
    A.push({ id: 'evo_' + rec.base, title: rec.name, how: 'Evolve a weapon into ' + rec.name,
      cat: 'evolve', secret: true, check: function (r, l) { return !!l.evolved[rec.base]; },
      rewards: [{ type: 'gold', amount: 150 }] });
  });
})();

PC.SNACK.achievementById = function (id) {
  for (var i = 0; i < PC.SNACK.ACHIEVEMENTS.length; i++) if (PC.SNACK.ACHIEVEMENTS[i].id === id) return PC.SNACK.ACHIEVEMENTS[i];
  return null;
};

// startup validation [template section 22]: every reward points at real
// content, so a typo can never hand out a broken unlock
PC.SNACK.validate = function () {
  var bad = [];
  PC.SNACK.ACHIEVEMENTS.forEach(function (a) {
    a.rewards.forEach(function (rw) {
      if (rw.type === 'weapon' && !PC.SNACK.WEAPONS[rw.id]) bad.push(a.id + ' -> weapon ' + rw.id);
      if (rw.type === 'passive' && !(PC.PASSIVES && PC.PASSIVES[rw.id])) bad.push(a.id + ' -> passive ' + rw.id);
      if (rw.type === 'stage' && !PC.SNACK.stageById(rw.id)) bad.push(a.id + ' -> stage ' + rw.id);
      if (rw.type === 'hero' && !PC.SNACK.heroDef(rw.id)) bad.push(a.id + ' -> hero ' + rw.id);
    });
  });
  PC.SNACK.HEROES.forEach(function (h) {
    if (h.unlockBy && !PC.SNACK.achievementById(h.unlockBy)) bad.push('hero ' + h.id + ' unlockBy ' + h.unlockBy);
  });
  if (bad.length && typeof console !== 'undefined') console.warn('SNACK content errors:', bad);
  return bad;
};
