// audio.js - synthesized chiptune music and sound effects (Web Audio API).
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  var ctx = null, master = null;
  var muted = false, volume = 0.7;
  var curSong = null, pendingSong = null;
  var schedTimer = null, songState = null;

  // note name -> frequency, octaves 2..6
  var NOTES = {};
  (function () {
    var names = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
    for (var o = 2; o <= 6; o++) {
      for (var i = 0; i < 12; i++) {
        NOTES[names[i] + o] = 440 * Math.pow(2, (o - 4) + (i - 9) / 12);
      }
    }
  })();

  function init() {
    if (ctx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : volume;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    if (ctx && pendingSong) { var s = pendingSong; pendingSong = null; startMusic(s); }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, start, dur, type, vol, freqEnd) {
    if (!ctx) return;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, start);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(8, freqEnd), start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(master);
    o.start(start); o.stop(start + dur + 0.03);
  }

  function noise(start, dur, vol) {
    if (!ctx) return;
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ctx.createBufferSource(); s.buffer = buf;
    var g = ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(master);
    s.start(start); s.stop(start + dur);
  }

  function sfx(name) {
    if (!ctx) return;
    resume();
    var t = ctx.currentTime;
    switch (name) {
      case 'jump':     tone(320, t, 0.17, 'square', 0.22, 760); break;
      case 'jumpbig':  tone(260, t, 0.21, 'square', 0.24, 640); break;
      case 'stomp':    tone(440, t, 0.12, 'square', 0.26, 120); noise(t, 0.07, 0.1); break;
      case 'blast':    tone(900, t, 0.18, 'sawtooth', 0.2, 220); noise(t, 0.05, 0.08); break;
      case 'core':     tone(660, t, 0.09, 'triangle', 0.26); tone(990, t + 0.09, 0.1, 'triangle', 0.26); tone(1320, t + 0.19, 0.16, 'triangle', 0.24); break;
      case 'power':    tone(440, t, 0.1, 'square', 0.24); tone(660, t + 0.1, 0.1, 'square', 0.24); tone(990, t + 0.2, 0.2, 'square', 0.24); break;
      case 'grow':     tone(330, t, 0.09, 'square', 0.24); tone(494, t + 0.09, 0.09, 'square', 0.24); tone(660, t + 0.18, 0.16, 'square', 0.24); break;
      case 'hit':      tone(220, t, 0.26, 'sawtooth', 0.26, 70); break;
      case 'die':      tone(440, t, 0.13, 'square', 0.26); tone(330, t + 0.13, 0.13, 'square', 0.26); tone(196, t + 0.27, 0.5, 'square', 0.26, 90); break;
      case 'chirp':    tone(1250, t, 0.07, 'sine', 0.22, 1950); tone(1950, t + 0.07, 0.13, 'sine', 0.18); break;
      case 'select':   tone(620, t, 0.05, 'square', 0.16); break;
      case 'confirm':  tone(660, t, 0.07, 'square', 0.2); tone(990, t + 0.07, 0.12, 'square', 0.2); break;
      case 'block':    tone(180, t, 0.07, 'square', 0.22, 90); break;
      case 'bump':     tone(120, t, 0.07, 'square', 0.18, 70); break;
      case 'pause':    tone(520, t, 0.08, 'square', 0.18); break;
      case 'enter':    tone(330, t, 0.1, 'square', 0.2, 660); break;
      case 'win':      [523, 659, 784, 1047].forEach(function (f, i) { tone(f, t + i * 0.14, 0.24, 'square', 0.24); }); break;
      case 'gameover': [392, 330, 262].forEach(function (f, i) { tone(f, t + i * 0.24, 0.34, 'triangle', 0.26); }); break;
      case '1up':      [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, t + i * 0.1, 0.18, 'square', 0.2); }); break;
    }
  }

  // --- music: independent melody + bass cursors that each loop ---
  var SONGS = {
    title: {
      tempo: 104, melType: 'triangle',
      mel: [['E5', 4], ['G5', 4], ['A5', 4], ['G5', 4], ['E5', 4], ['D5', 4], ['C5', 8]],
      bass: [['A2', 8], ['F2', 8], ['C3', 8], ['G2', 8]]
    },
    overworld: {
      tempo: 128, melType: 'square',
      mel: [['C5', 2], ['E5', 2], ['G5', 2], ['E5', 2], ['F5', 2], ['A5', 2], ['G5', 2], ['E5', 2],
            ['D5', 2], ['F5', 2], ['E5', 2], ['C5', 2], ['D5', 4], [null, 4]],
      bass: [['C3', 4], ['C3', 4], ['F2', 4], ['F2', 4], ['G2', 4], ['G2', 4], ['C3', 4], ['G2', 4]]
    },
    level: {
      tempo: 144, melType: 'square',
      mel: [['G4', 2], ['C5', 2], ['E5', 2], ['G5', 2], ['E5', 2], ['C5', 2], ['D5', 2], ['E5', 2],
            ['F5', 2], ['E5', 2], ['D5', 2], ['C5', 2], ['D5', 2], ['B4', 2], ['G4', 2], [null, 2]],
      bass: [['C3', 4], ['G2', 4], ['A2', 4], ['E2', 4], ['F2', 4], ['C3', 4], ['G2', 4], ['G2', 4]]
    }
  };

  function scheduler() {
    if (!ctx || !songState) return;
    var s = songState, ahead = ctx.currentTime + 0.22;
    while (s.melTime < ahead) {
      var m = s.song.mel[s.melIdx];
      var md = m[1] * s.stepDur;
      if (m[0] && NOTES[m[0]]) tone(NOTES[m[0]], s.melTime, md * 0.92, s.song.melType, 0.13);
      s.melTime += md;
      s.melIdx = (s.melIdx + 1) % s.song.mel.length;
    }
    while (s.basTime < ahead) {
      var b = s.song.bass[s.basIdx];
      var bd = b[1] * s.stepDur;
      if (b[0] && NOTES[b[0]]) tone(NOTES[b[0]], s.basTime, bd * 0.9, 'triangle', 0.17);
      s.basTime += bd;
      s.basIdx = (s.basIdx + 1) % s.song.bass.length;
    }
  }

  function startMusic(name) {
    if (curSong === name) return;
    if (!ctx) { pendingSong = name; curSong = name; return; }
    resume();
    stopMusic();
    curSong = name;
    var song = SONGS[name];
    if (!song) return;
    var stepDur = 60 / song.tempo / 4;  // 16th-note grid
    var t0 = ctx.currentTime + 0.1;
    songState = { song: song, stepDur: stepDur, melIdx: 0, basIdx: 0, melTime: t0, basTime: t0 };
    schedTimer = setInterval(scheduler, 25);
    scheduler();
  }

  function stopMusic() {
    if (schedTimer) { clearInterval(schedTimer); schedTimer = null; }
    songState = null;
    curSong = null;
  }

  function applyGain() { if (master) master.gain.value = muted ? 0 : volume; }

  SDD.audio = {
    init: init,
    resume: resume,
    sfx: sfx,
    startMusic: startMusic,
    stopMusic: stopMusic,
    setMuted: function (m) { muted = !!m; applyGain(); },
    setVolume: function (v) { volume = Math.max(0, Math.min(1, v)); applyGain(); },
    isMuted: function () { return muted; },
    getVolume: function () { return volume; },
    syncFromSave: function () {
      var o = SDD.save.data.options;
      muted = !!o.muted;
      volume = (typeof o.volume === 'number') ? o.volume : 0.7;
      applyGain();
    }
  };
})();
