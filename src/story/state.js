// state.js - STORY-4: persistent campaign progress. One tiny JSON blob
// ('portioncontrol.story'): intro seen, cleared stages, which reveals the
// player has already been shown (so the "NEW MISSION" fanfare fires once).
// Progressive-reveal rule (Mark: "you unlock more and more of a mission
// map... it reveals and unlocks the next mission"): a chain entry is
// visible if every entry before it is cleared, or it is at most ONE step
// past the frontier (shown as a fogged ??? tease). DEV mode reveals all.
window.PC = window.PC || {};

PC.storyState = (function () {
  var KEY = 'portioncontrol.story';
  var data = { introSeen: false, cleared: {}, revealSeen: {} };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var p = JSON.parse(raw);
      if (p && typeof p === 'object') {
        data.introSeen = !!p.introSeen;
        data.cleared = p.cleared || {};
        data.revealSeen = p.revealSeen || {};
      }
    }
  } catch (e) {}
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  return {
    introSeen: function () { return data.introSeen; },
    setIntroSeen: function () { data.introSeen = true; save(); },
    isCleared: function (id) { return !!data.cleared[id]; },
    markCleared: function (id) { data.cleared[id] = true; save(); },
    // index of the frontier mission (first uncleared); may equal length
    currentIndex: function () {
      var chain = PC.STORY.CHAIN || [];
      for (var i = 0; i < chain.length; i++) {
        if (!data.cleared[chain[i].id]) return i;
      }
      return chain.length;
    },
    // 'cleared' | 'active' (playable now) | 'soon' (unlocked, map not
    // built yet) | 'tease' (fogged ??? one past the frontier) | 'hidden'
    status: function (i) {
      var chain = PC.STORY.CHAIN || [];
      var entry = chain[i];
      if (!entry) return 'hidden';
      if (data.cleared[entry.id]) return 'cleared';
      var built = PC.STORY.beatBuilt(entry);
      if (PC.DEV_MODE) return built ? 'active' : 'soon';
      var cur = this.currentIndex();
      if (i === cur) return built ? 'active' : 'soon';
      if (i === cur + 1) return 'tease';
      return 'hidden';
    },
    revealSeen: function (id) { return !!data.revealSeen[id]; },
    markRevealSeen: function (id) { data.revealSeen[id] = true; save(); },
    reset: function () {
      data = { introSeen: false, cleared: {}, revealSeen: {} };
      save();
    },
  };
})();
