// store.js — namespaced localStorage wrapper (Brief §9). All keys dannylab.*
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.store = (function () {
  var PREFIX = 'dannylab.';

  function read(key, dflt) {
    try {
      var v = window.localStorage.getItem(PREFIX + key);
      return v == null ? dflt : v;
    } catch (e) { return dflt; }
  }
  function write(key, val) {
    try { window.localStorage.setItem(PREFIX + key, String(val)); } catch (e) {}
  }
  function remove(key) {
    try { window.localStorage.removeItem(PREFIX + key); } catch (e) {}
  }

  return {
    // ---- best score ----
    getBest: function () {
      var n = parseInt(read('bestScore', '0'), 10);
      return isNaN(n) ? 0 : n;
    },
    setBest: function (n) { write('bestScore', Math.max(0, n | 0)); },

    // ---- best Lab Level (Addendum §3) ----
    getBestLevel: function () {
      var n = parseInt(read('bestLevel', '0'), 10);
      return isNaN(n) ? 0 : n;
    },
    setBestLevel: function (n) { write('bestLevel', Math.max(0, n | 0)); },

    // ---- discovered elements (JSON array of symbols) ----
    getDiscovered: function () {
      try {
        var a = JSON.parse(read('discovered', '[]'));
        return Array.isArray(a) ? a : [];
      } catch (e) { return []; }
    },
    addDiscovered: function (sym) {
      var a = this.getDiscovered();
      if (a.indexOf(sym) === -1) {
        a.push(sym);
        write('discovered', JSON.stringify(a));
        return true; // first ever
      }
      return false;
    },
    isDiscovered: function (sym) {
      return this.getDiscovered().indexOf(sym) !== -1;
    },

    // ---- games played (drives some card unlocks) ----
    getGamesPlayed: function () { var n = parseInt(read('gamesPlayed', '0'), 10); return isNaN(n) ? 0 : n; },
    addGamePlayed: function () { write('gamesPlayed', this.getGamesPlayed() + 1); },

    // ---- lifetime stats (card unlocks + game-over recap) ----
    getStat: function (name) { var n = parseInt(read('stat.' + name, '0'), 10); return isNaN(n) ? 0 : n; },
    bumpStat: function (name, by) { write('stat.' + name, this.getStat(name) + (by == null ? 1 : by)); },
    maxStat: function (name, v) { if ((v | 0) > this.getStat(name)) write('stat.' + name, v | 0); },

    // ---- card unlock bookkeeping (toast once; NEW badge until viewed) ----
    getCardList: function (key) {
      try { var a = JSON.parse(read(key, '[]')); return Array.isArray(a) ? a : []; } catch (e) { return []; }
    },
    addCardList: function (key, id) {
      var a = this.getCardList(key);
      if (a.indexOf(id) === -1) { a.push(id); write(key, JSON.stringify(a)); }
    },

    // ---- options ----
    getOpt: function (name, dflt) { return read('opt.' + name, dflt); },
    setOpt: function (name, val) { write('opt.' + name, val); },

    // ---- reset collection (clears cards + best + progress) ----
    resetCollection: function () {
      remove('discovered');
      remove('bestScore');
      remove('bestLevel');
      remove('gamesPlayed');
      remove('cardsNotified');
      remove('cardsSeen');
      var stats = ['merges', 'bestCombo', 'fissions', 'mysteries'];
      for (var i = 0; i < stats.length; i++) remove('stat.' + stats[i]);
    },
  };
})();
