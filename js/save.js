// save.js - progress, best stats and options, persisted in localStorage.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var KEY = 'superDudeDanny.save.v1';

  function defaults() {
    return {
      unlockedDay: 1,        // highest day the player may enter
      completedDays: [],     // list of finished day numbers
      bestTime: null,        // best Day 1 time in seconds (lower is better)
      bestCores: 0,          // most power cores collected in Day 1
      options: { muted: false, volume: 0.7 }
    };
  }

  var data = defaults();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw) || {};
        data = Object.assign(defaults(), p);
        data.options = Object.assign(defaults().options, p.options || {});
        if (!Array.isArray(data.completedDays)) data.completedDays = [];
      }
    } catch (e) {
      data = defaults();
    }
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function hasSave() {
    try { return localStorage.getItem(KEY) != null; } catch (e) { return false; }
  }

  function reset() {
    data = defaults();
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  // Record a finished day and (if better) its time / core count.
  function recordDay(day, timeSec, cores) {
    if (data.completedDays.indexOf(day) < 0) data.completedDays.push(day);
    if (data.unlockedDay < day + 1) data.unlockedDay = day + 1;
    if (data.bestTime == null || timeSec < data.bestTime) data.bestTime = timeSec;
    if (cores > data.bestCores) data.bestCores = cores;
    save();
  }

  SDD.save = {
    load: load,
    save: save,
    hasSave: hasSave,
    reset: reset,
    recordDay: recordDay,
    get data() { return data; }
  };
})();
