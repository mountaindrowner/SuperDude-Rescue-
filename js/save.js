// save.js - progress, best stats, and options persisted to localStorage.
// v3 schema: three independent save slots (easy / medium / hard) plus
// global options. Old v2 and v1 saves migrate forward into the medium slot.
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;
  var KEY = 'superDudeDanny.save.v3';
  var KEY_V2 = 'superDudeDanny.save.v2';
  var OLD_KEY = 'superDudeDanny.save.v1';

  // Day 1 has one stage (the original POC level). Days 2-6 each have two
  // stages (one per Genesis creation). Day 7 is one peaceful stage + finale.
  var STAGES_PER_DAY = { 1: 1, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 1 };
  function stagesForDay(d) { return STAGES_PER_DAY[d] || 1; }

  var DIFFICULTIES = ['easy', 'medium', 'hard'];

  function emptySlot() {
    return {
      unlockedDay: 1,
      unlockedStage: 1,
      completedStages: [],   // ["d-s", ...]
      completedDays: [],     // [day#, ...]
      bestTimes: {},         // { "d-s": seconds }
      bestCores: {},         // { "d-s": int }
      quizzesPassed: []      // ["day2", "day3", ...]
    };
  }

  function defaults() {
    return {
      version: 3,
      difficulty: 'medium',
      slots: { easy: emptySlot(), medium: emptySlot(), hard: emptySlot() },
      options: { muted: false, volume: 0.7, god: false }
    };
  }

  var raw = defaults();

  // `data` is a back-compat view exposing the active slot's fields plus
  // global options at the top level (the same shape the rest of the codebase
  // grew up reading). Slot fields are live proxies, so mutations through
  // `data.completedStages.push(...)` still hit the underlying slot.
  var data = {};
  Object.defineProperty(data, 'version', {
    get: function () { return raw.version; }, enumerable: true
  });
  Object.defineProperty(data, 'options', {
    get: function () { return raw.options; }, enumerable: true
  });
  ['unlockedDay', 'unlockedStage', 'completedStages', 'completedDays',
   'bestTimes', 'bestCores', 'quizzesPassed'].forEach(function (k) {
    Object.defineProperty(data, k, {
      get: function () { return raw.slots[raw.difficulty][k]; },
      set: function (v) { raw.slots[raw.difficulty][k] = v; },
      enumerable: true
    });
  });

  function migrateV2(v2) {
    // All v2 progress predates difficulty modes - land it in medium.
    var d = defaults();
    var m = d.slots.medium;
    if (typeof v2.unlockedDay === 'number') m.unlockedDay = v2.unlockedDay;
    if (typeof v2.unlockedStage === 'number') m.unlockedStage = v2.unlockedStage;
    if (Array.isArray(v2.completedStages)) m.completedStages = v2.completedStages.slice();
    if (Array.isArray(v2.completedDays))   m.completedDays   = v2.completedDays.slice();
    if (v2.bestTimes && typeof v2.bestTimes === 'object') m.bestTimes = Object.assign({}, v2.bestTimes);
    if (v2.bestCores && typeof v2.bestCores === 'object') m.bestCores = Object.assign({}, v2.bestCores);
    if (v2.options) d.options = Object.assign(d.options, v2.options);
    return d;
  }

  function migrateV1(v1) {
    var d = defaults();
    var m = d.slots.medium;
    if (Array.isArray(v1.completedDays) && v1.completedDays.indexOf(1) >= 0) {
      m.completedStages = ['1-1'];
      m.completedDays = [1];
      m.unlockedDay = Math.max(2, v1.unlockedDay || 2);
      m.unlockedStage = 1;
      if (v1.bestTime != null) m.bestTimes['1-1'] = v1.bestTime;
      if (v1.bestCores) m.bestCores['1-1'] = v1.bestCores;
    }
    if (v1.options) d.options = Object.assign(d.options, v1.options);
    return d;
  }

  function reconstruct(p) {
    // Defensive rebuild from a parsed v3 payload - any missing/garbled
    // fields fall back to defaults instead of throwing.
    var d = defaults();
    if (p.difficulty && d.slots[p.difficulty]) d.difficulty = p.difficulty;
    if (p.options) d.options = Object.assign(d.options, p.options);
    if (p.slots && typeof p.slots === 'object') {
      DIFFICULTIES.forEach(function (k) {
        var s = p.slots[k];
        if (!s) return;
        var t = d.slots[k];
        if (typeof s.unlockedDay === 'number')   t.unlockedDay = s.unlockedDay;
        if (typeof s.unlockedStage === 'number') t.unlockedStage = s.unlockedStage;
        if (Array.isArray(s.completedStages))    t.completedStages = s.completedStages.slice();
        if (Array.isArray(s.completedDays))      t.completedDays   = s.completedDays.slice();
        if (s.bestTimes) t.bestTimes = Object.assign({}, s.bestTimes);
        if (s.bestCores) t.bestCores = Object.assign({}, s.bestCores);
        if (Array.isArray(s.quizzesPassed))      t.quizzesPassed   = s.quizzesPassed.slice();
      });
    }
    return d;
  }

  function load() {
    try {
      var rawStr = localStorage.getItem(KEY);
      if (rawStr) {
        try {
          raw = reconstruct(JSON.parse(rawStr) || {});
        } catch (parseErr) {
          // Corrupt save - rather than wiping silently, log a warning
          // so a player who suddenly lost progress can tell something
          // went wrong (and we can spot it in console).
          if (typeof console !== 'undefined') {
            console.warn('superDudeDanny: corrupt save, resetting to defaults', parseErr);
          }
          raw = defaults();
        }
      } else {
        var v2raw = localStorage.getItem(KEY_V2);
        if (v2raw) {
          raw = migrateV2(JSON.parse(v2raw) || {});
          save();
          // Migration to v3 succeeded - the old v2 blob is now dead
          // weight, remove it so localStorage doesn't keep two copies
          // of the same progress.
          try { localStorage.removeItem(KEY_V2); } catch (e) {}
        } else {
          var v1raw = localStorage.getItem(OLD_KEY);
          if (v1raw) {
            raw = migrateV1(JSON.parse(v1raw) || {});
            save();
            try { localStorage.removeItem(OLD_KEY); } catch (e) {}
          }
        }
      }
    } catch (e) {
      if (typeof console !== 'undefined') {
        console.warn('superDudeDanny: save load failed, using defaults', e);
      }
      raw = defaults();
    }
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(raw)); } catch (e) {}
  }

  function slotHasProgress(s) {
    return s && (s.completedStages.length > 0
      || s.unlockedDay > 1
      || s.unlockedStage > 1
      || (s.quizzesPassed && s.quizzesPassed.length > 0));
  }

  function hasSave() {
    try {
      if (localStorage.getItem(KEY) != null) {
        for (var i = 0; i < DIFFICULTIES.length; i++) {
          if (slotHasProgress(raw.slots[DIFFICULTIES[i]])) return true;
        }
      }
      return localStorage.getItem(KEY_V2) != null || localStorage.getItem(OLD_KEY) != null;
    } catch (e) { return false; }
  }

  function reset() {
    // "New Game" wipes ALL slots but keeps the user's audio/god prefs -
    // those are preferences, not progress.
    var keepOptions = raw && raw.options
      ? Object.assign({}, raw.options)
      : defaults().options;
    raw = defaults();
    raw.options = keepOptions;
    try { localStorage.removeItem(KEY); localStorage.removeItem(KEY_V2); localStorage.removeItem(OLD_KEY); } catch (e) {}
    save();
  }

  // Wipe one slot without touching the others or options.
  function resetSlot(d) {
    if (!raw.slots[d]) return;
    raw.slots[d] = emptySlot();
    save();
  }

  function setDifficulty(d) {
    if (raw.slots[d]) {
      raw.difficulty = d;
      save();
    }
  }
  function curDifficulty() { return raw.difficulty; }

  function recordStage(day, stage, timeSec, cores) {
    var slot = raw.slots[raw.difficulty];
    var key = day + '-' + stage;
    if (slot.completedStages.indexOf(key) < 0) slot.completedStages.push(key);
    var total = stagesForDay(day);
    if (stage < total) {
      if (slot.unlockedDay < day) { slot.unlockedDay = day; slot.unlockedStage = 1; }
      if (slot.unlockedDay === day && slot.unlockedStage < stage + 1) slot.unlockedStage = stage + 1;
    } else {
      if (slot.completedDays.indexOf(day) < 0) slot.completedDays.push(day);
      if (slot.unlockedDay < day + 1) { slot.unlockedDay = day + 1; slot.unlockedStage = 1; }
    }
    if (slot.bestTimes[key] == null || timeSec < slot.bestTimes[key]) slot.bestTimes[key] = timeSec;
    if (!slot.bestCores[key] || cores > slot.bestCores[key]) slot.bestCores[key] = cores;
    save();
  }

  function recordDay(day, timeSec, cores) { recordStage(day, 1, timeSec, cores); }

  function nextStage(day) {
    var total = stagesForDay(day);
    var slot = raw.slots[raw.difficulty];
    for (var s = 1; s <= total; s++) {
      if (slot.completedStages.indexOf(day + '-' + s) < 0) return s;
    }
    return total;
  }

  function isStageUnlocked(day, stage) {
    var slot = raw.slots[raw.difficulty];
    if (day < slot.unlockedDay) return true;
    if (day === slot.unlockedDay && stage <= slot.unlockedStage) return true;
    return false;
  }
  function isStageCompleted(day, stage) {
    var slot = raw.slots[raw.difficulty];
    return slot.completedStages.indexOf(day + '-' + stage) >= 0;
  }
  function completedStagesOf(day) {
    var n = 0, total = stagesForDay(day);
    for (var s = 1; s <= total; s++) if (isStageCompleted(day, s)) n++;
    return n;
  }

  function recordQuizPassed(day) {
    var slot = raw.slots[raw.difficulty];
    var key = 'day' + day;
    if (slot.quizzesPassed.indexOf(key) < 0) {
      slot.quizzesPassed.push(key);
      save();
    }
  }
  function isQuizPassed(day) {
    var slot = raw.slots[raw.difficulty];
    return slot.quizzesPassed.indexOf('day' + day) >= 0;
  }

  // Read-only snapshot of any slot, even when it isn't the active one.
  // Powers the difficulty picker's status text.
  function slotSummary(d) {
    var s = raw.slots[d];
    if (!s) return null;
    return {
      empty: !slotHasProgress(s),
      unlockedDay: s.unlockedDay,
      unlockedStage: s.unlockedStage,
      completedStages: s.completedStages.slice(),
      completedDays: s.completedDays.slice(),
      quizzesPassed: s.quizzesPassed.slice()
    };
  }

  SDD.save = {
    load: load,
    save: save,
    hasSave: hasSave,
    reset: reset,
    resetSlot: resetSlot,
    setDifficulty: setDifficulty,
    curDifficulty: curDifficulty,
    recordDay: recordDay,
    recordStage: recordStage,
    nextStage: nextStage,
    isStageUnlocked: isStageUnlocked,
    isStageCompleted: isStageCompleted,
    completedStagesOf: completedStagesOf,
    stagesForDay: stagesForDay,
    recordQuizPassed: recordQuizPassed,
    isQuizPassed: isQuizPassed,
    slotSummary: slotSummary,
    DIFFICULTIES: DIFFICULTIES.slice(),
    get data() { return data; }
  };
})();
