// snack/unlocks.js - the SNACK ATTACK unlock engine (v0.80.0).
// [template sections 14 + 22] Events update RUN counters (reset every run)
// and LIFETIME counters (never reset), then every not-yet-done achievement
// is checked. A completion pays through SnackProfile.complete(), which
// records it and pays it in one write, so it can never pay twice.
// Kills arrive hundreds of times a minute, so they only bump counters;
// the full check runs on discrete events and on a half-second tick.
window.PC = window.PC || {};

PC.SnackUnlocks = {
  // run: the SnackRun.run counters; kind: event name; a: payload
  event: function (sr, kind, a) {
    var r = sr.run, l = PC.SnackProfile.get().life;
    switch (kind) {
      case 'kill':
        r.kills++; l.kills++;
        if (a && a.fam) l.fam[a.fam] = (l.fam[a.fam] || 0) + 1;
        if (a && a.elite) { l.elites++; }
        return;                                    // checked on the tick
      case 'level':  r.level = a; break;
      case 'rank':   r.ranks[a.key] = Math.max(r.ranks[a.key] || 0, a.rank); break;
      case 'held':   r.held = Math.max(r.held, a); break;
      case 'gold':   r.gold += a; break;              // wallet already credited
      case 'heal':   r.healed += a; l.healed += a; return;
      case 'crate':  l.crates++; break;
      case 'medkit': l.medkits++; break;
      case 'pickup': r.pickups[a] = (r.pickups[a] || 0) + 1; l.pickups[a] = (l.pickups[a] || 0) + 1; break;
      case 'chest':  l.chests++; r.chests++; break;
      case 'boss':   l.bosses++; break;
      case 'evolve': l.evolved[a] = true; r.evolved.push(a); break;
      case 'clear':  l.clears[a] = true; r.cleared = true; break;
      case 'tick':   r.t = a; break;
    }
    PC.SnackUnlocks.check(sr);
  },

  check: function (sr) {
    var prof = PC.SnackProfile.get(), r = sr.run, l = prof.life;
    var A = PC.SNACK.ACHIEVEMENTS, got = [];
    for (var i = 0; i < A.length; i++) {
      var a = A[i];
      if (prof.done.indexOf(a.id) >= 0) continue;
      var ok = false;
      try { ok = !!a.check(r, l); } catch (e) { ok = false; }
      if (ok && PC.SnackProfile.complete(a)) got.push(a);
    }
    for (var j = 0; j < got.length; j++) {
      sr.newUnlocks.push(got[j].id);
      if (sr.toast) sr.toast(got[j]);
    }
    return got;
  },

  // what a reward reads as on a toast / the results screen
  rewardText: function (rw) {
    if (rw.type === 'gold') return '+' + rw.amount + ' GOLD';
    if (rw.type === 'weapon') return 'NEW WEAPON: ' + (PC.SNACK.WEAPONS[rw.id] ? PC.SNACK.WEAPONS[rw.id].title : rw.id);
    if (rw.type === 'passive') return 'NEW ITEM: ' + (PC.PASSIVES[rw.id] ? PC.PASSIVES[rw.id].name : rw.id);
    if (rw.type === 'stage') return 'NEW STAGE: ' + (PC.SNACK.stageById(rw.id) ? PC.SNACK.stageById(rw.id).title : rw.id);
    if (rw.type === 'hero') return 'HERO FOR SALE: ' + (PC.heroById(rw.id) ? PC.heroById(rw.id).name : rw.id);
    return '';
  },
};
