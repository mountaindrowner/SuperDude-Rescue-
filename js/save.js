// save.js - progress, best stats and options, persisted in localStorage.
// v2 schema: supports per-stage tracking. Old v1 saves auto-migrate forward.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var KEY = 'superDudeDanny.save.v2';
  var OLD_KEY = 'superDudeDanny.save.v1';

  // Day 1 has one stage (the original POC level). Days 2-6 each have two
  // stages (one per Genesis creation). Day 7 is one peaceful stage + finale.
  var STAGES_PER_DAY = { 1: 1, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 1 };
  function stagesForDay(d) { return STAGES_PER_DAY[d] || 1; }

  function defaults() {
    return {
      version: 2,
      unlockedDay: 1,
      unlockedStage: 1,
      completedStages: [],   // array of "d-s" strings
      completedDays: [],     // day numbers fully completed (all stages done)
      bestTimes: {},         // { "d-s": seconds }
      bestCores: {},         // { "d-s": int }
      options: { muted: false, volume: 0.7, god: false }
    };
  }

  var data = defaults();

  function migrateV1(v1) {
    var d = defaults();
    if (Array.isArray(v1.completedDays) && v1.completedDays.indexOf(1) >= 0) {
      d.completedStages = ['1-1'];
      d.completedDays = [1];
      d.unlockedDay = Math.max(2, v1.unlockedDay || 2);
      d.unlockedStage = 1;
      if (v1.bestTime != null) d.bestTimes['1-1'] = v1.bestTime;
      if (v1.bestCores) d.bestCores['1-1'] = v1.bestCores;
    }
    if (v1.options) d.options = Object.assign(d.options, v1.options);
    return d;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw) || {};
        data = Object.assign(defaults(), p);
        data.options = Object.assign(defaults().options, p.options || {});
        if (!Array.isArray(data.completedStages)) data.completedStages = [];
        if (!Array.isArray(data.completedDays)) data.completedDays = [];
        if (!data.bestTimes || typeof data.bestTimes !== 'object') data.bestTimes = {};
        if (!data.bestCores || typeof data.bestCores !== 'object') data.bestCores = {};
      } else {
        var v1raw = localStorage.getItem(OLD_KEY);
        if (v1raw) {
          var v1 = JSON.parse(v1raw) || {};
          data = migrateV1(v1);
          save();
        }
      }
    } catch (e) { data = defaults(); }
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function hasSave() {
    try { return localStorage.getItem(KEY) != null || localStorage.getItem(OLD_KEY) != null; }
    catch (e) { return false; }
  }

  function reset() {
    // Preserve user-set options across reset - god / audio settings
    // are preferences, not progress, so a "New Game" shouldn't undo
    // them.
    var keepOptions = data && data.options
      ? Object.assign({}, data.options)
      : defaults().options;
    data = defaults();
    data.options = keepOptions;
    try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch (e) {}
    save();    // write back the reset state with options intact
  }

  // Record a finished stage and (if better) its stats; advance progress pointer.
  function recordStage(day, stage, timeSec, cores) {
    var key = day + '-' + stage;
    if (data.completedStages.indexOf(key) < 0) data.completedStages.push(key);
    var total = stagesForDay(day);
    if (stage < total) {
      if (data.unlockedDay < day) { data.unlockedDay = day; data.unlockedStage = 1; }
      if (data.unlockedDay === day && data.unlockedStage < stage + 1) data.unlockedStage = stage + 1;
    } else {
      if (data.completedDays.indexOf(day) < 0) data.completedDays.push(day);
      if (data.unlockedDay < day + 1) { data.unlockedDay = day + 1; data.unlockedStage = 1; }
    }
    if (data.bestTimes[key] == null || timeSec < data.bestTimes[key]) data.bestTimes[key] = timeSec;
    if (!data.bestCores[key] || cores > data.bestCores[key]) data.bestCores[key] = cores;
    save();
  }

  // Legacy entry point (Day 1 only). Keeps older calls working.
  function recordDay(day, timeSec, cores) { recordStage(day, 1, timeSec, cores); }

  // Next stage to play for a given day (1..stagesForDay), or last stage if done.
  function nextStage(day) {
    var total = stagesForDay(day);
    for (var s = 1; s <= total; s++) {
      if (data.completedStages.indexOf(day + '-' + s) < 0) return s;
    }
    return total;
  }

  function isStageUnlocked(day, stage) {
    if (day < data.unlockedDay) return true;
    if (day === data.unlockedDay && stage <= data.unlockedStage) return true;
    return false;
  }
  function isStageCompleted(day, stage) {
    return data.completedStages.indexOf(day + '-' + stage) >= 0;
  }
  function completedStagesOf(day) {
    var n = 0, total = stagesForDay(day);
    for (var s = 1; s <= total; s++) if (isStageCompleted(day, s)) n++;
    return n;
  }

  SDD.save = {
    load: load, save: save, hasSave: hasSave, reset: reset,
    recordDay: recordDay,
    recordStage: recordStage,
    nextStage: nextStage,
    isStageUnlocked: isStageUnlocked,
    isStageCompleted: isStageCompleted,
    completedStagesOf: completedStagesOf,
    stagesForDay: stagesForDay,
    get data() { return data; }
  };
})();
