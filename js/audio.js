// audio.js - synthesized chiptune music and sound effects (Web Audio API).
window.SDD = window.SDD || {};

(function () {
  var SDD = window.SDD;

  var ctx = null, master = null, musicGain = null, sfxGain = null;
  // `volume` kept as a legacy overall (unused by the new buses). Music
  // + SFX are now independent (Mark). MP3 tracks read musicVolume
  // directly via element.volume; chiptune routes through musicGain;
  // all sfx route through sfxGain.
  var muted = false, volume = 0.7, musicVolume = 0.5, sfxVolume = 0.85;
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
      master.gain.value = muted ? 0 : 1;          // master is now the mute switch
      master.connect(ctx.destination);
      // Independent SFX + chiptune-music buses under master so each can
      // be mixed separately. (MP3 music is volumed via element.volume.)
      musicGain = ctx.createGain(); musicGain.gain.value = musicVolume; musicGain.connect(master);
      sfxGain   = ctx.createGain(); sfxGain.gain.value   = sfxVolume;   sfxGain.connect(master);
    } catch (e) { ctx = null; }
    if (ctx && pendingSong) { var s = pendingSong; pendingSong = null; startMusic(s); }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function tone(freq, start, dur, type, vol, freqEnd, bus) {
    if (!ctx) return;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, start);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(8, freqEnd), start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(bus || sfxGain);
    o.start(start); o.stop(start + dur + 0.03);
  }

  function noise(start, dur, vol, bus) {
    if (!ctx) return;
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ctx.createBufferSource(); s.buffer = buf;
    var g = ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(bus || sfxGain);
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
      case 'step':     tone(180, t, 0.025, 'square', 0.06, 110); break;
      // Surface-aware step variants (Mark: "a light walking sound as
      // Super Dude Danny walks, consistent with what he's walking
      // on"). All deliberately quiet (0.04-0.08 amp) so they're
      // texture, not noise. Mix tone + brief noise burst to colour
      // each surface differently.
      case 'step_grass':  tone(220, t, 0.02, 'triangle', 0.05, 160); noise(t, 0.02, 0.04); break;
      case 'step_sand':   noise(t, 0.05, 0.07); tone(160, t, 0.02, 'sine', 0.04, 100); break;
      case 'step_stone':  tone(320, t, 0.02, 'square', 0.08, 200); break;
      case 'step_wood':   tone(140, t, 0.05, 'triangle', 0.08, 80); break;
      case 'step_cloud':  tone(440, t, 0.06, 'sine', 0.04, 280); break;
      case 'step_water':  noise(t, 0.07, 0.08); tone(280, t, 0.03, 'sine', 0.05, 180); break;
      case 'step_metal':  tone(520, t, 0.02, 'square', 0.06, 420); break;
      // Landing thump (heavier than a step). Surface picks colour.
      case 'land_grass':  tone(150, t, 0.06, 'triangle', 0.12, 80); noise(t, 0.04, 0.07); break;
      case 'land_sand':   noise(t, 0.10, 0.14); tone(120, t, 0.05, 'sine', 0.08, 60); break;
      case 'land_stone':  tone(220, t, 0.05, 'square', 0.18, 110); noise(t, 0.03, 0.07); break;
      case 'land_wood':   tone(110, t, 0.10, 'triangle', 0.18, 60); break;
      case 'land_cloud':  tone(360, t, 0.10, 'sine', 0.08, 240); break;
      case 'land_water':  noise(t, 0.14, 0.16); tone(220, t, 0.06, 'sine', 0.10, 150); break;
      case 'land_metal':  tone(440, t, 0.04, 'square', 0.16, 320); tone(330, t + 0.04, 0.05, 'square', 0.08, 220); break;
      // Quiet enemy ambient cues (very low amp). Used by enemies on a
      // rare random tick so passing them feels textured without
      // becoming noisy.
      case 'amb_buzz':    tone(380, t, 0.04, 'sawtooth', 0.04, 440); break;
      case 'amb_chirp':   tone(820, t, 0.03, 'sine', 0.05, 1100); break;
      case 'amb_growl':   tone(120, t, 0.10, 'triangle', 0.05, 90); break;
      case 'amb_skitter': noise(t, 0.04, 0.05); break;
      case 'shrink':   tone(660, t, 0.07, 'square', 0.18); tone(440, t + 0.07, 0.09, 'square', 0.16); tone(294, t + 0.16, 0.12, 'square', 0.14); break;
      case 'enter':    tone(330, t, 0.1, 'square', 0.2, 660); break;
      case 'win':      [523, 659, 784, 1047].forEach(function (f, i) { tone(f, t + i * 0.14, 0.24, 'square', 0.24); }); break;
      case 'gameover': [392, 330, 262].forEach(function (f, i) { tone(f, t + i * 0.24, 0.34, 'triangle', 0.26); }); break;
      case '1up':      [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, t + i * 0.1, 0.18, 'square', 0.2); }); break;
      // Pearl Shell crack - bright high snap descending into a short
      // noise burst so it reads as a brittle break.
      case 'crack':    tone(1400, t, 0.05, 'triangle', 0.22, 320); noise(t, 0.09, 0.14); tone(640, t + 0.05, 0.06, 'square', 0.16, 220); break;
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
      if (m[0] && NOTES[m[0]]) tone(NOTES[m[0]], s.melTime, md * 0.92, s.song.melType, 0.13, null, musicGain);
      s.melTime += md;
      s.melIdx = (s.melIdx + 1) % s.song.mel.length;
    }
    while (s.basTime < ahead) {
      var b = s.song.bass[s.basIdx];
      var bd = b[1] * s.stepDur;
      if (b[0] && NOTES[b[0]]) tone(NOTES[b[0]], s.basTime, bd * 0.9, 'triangle', 0.17, null, musicGain);
      s.basTime += bd;
      s.basIdx = (s.basIdx + 1) % s.song.bass.length;
    }
  }

  // ===================== MP3 music loader =====================
  // Real composed tracks (Mark's compositions) live in assets/music/
  // and take precedence over the procedural SONGS chiptune above.
  // Per-track gain multiplier applied on top of the user's master
  // volume. Mark Pass 9: "title music had a good volume, but have
  // the music for the rest of the game just a little bit lower."
  // title plays at full mix; everything else is dialled back to 0.7.
  var MUSIC_MIX = {
    title: 1.0
  };
  var MUSIC_MIX_DEFAULT = 0.7;
  function mixFor(id) {
    return MUSIC_MIX[id] != null ? MUSIC_MIX[id] : MUSIC_MIX_DEFAULT;
  }

  // A track key may resolve to several variants (e.g. 'level_2_2'
  // has _a, _b, _c) - on play we pick one at random.
  var FILE_TRACKS = {};      // id  -> { el, loop }
  var VARIANT_POOLS = {};    // key -> [id, id, id]
  var currentFileTrack = null;
  function loadFileTrack(id, path, loop) {
    var a = new Audio();
    a.preload = 'auto';
    a.loop = loop !== false;
    a.volume = muted ? 0 : musicVolume * mixFor(id);
    a.src = path;
    // Explicit load() nudges the browser to actually start downloading
    // - 'auto' is a HINT and many browsers defer audio until first
    // play(). For title/intro tracks especially we want the bytes
    // in memory by the time the user taps the title card.
    try { a.load(); } catch (e) {}
    FILE_TRACKS[id] = { el: a, loop: loop !== false, id: id };
  }
  function regPool(key, variantIds) { VARIANT_POOLS[key] = variantIds; }
  function tryFileTrack(name) {
    var ids = VARIANT_POOLS[name] || (FILE_TRACKS[name] ? [name] : null);
    if (!ids) return false;
    var id = ids[Math.floor(Math.random() * ids.length)];
    var tr = FILE_TRACKS[id]; if (!tr) return false;
    stopMusic();
    try {
      tr.el.currentTime = 0;
      tr.el.volume = muted ? 0 : musicVolume * mixFor(id);
      var p = tr.el.play();
      if (p && p.catch) p.catch(function () {});   // ignore autoplay rejection
      currentFileTrack = tr;
      return true;
    } catch (e) { return false; }
  }
  function stopFileTrack(immediate) {
    if (!currentFileTrack) return;
    var tr = currentFileTrack;
    currentFileTrack = null;
    var el = tr.el;
    if (immediate) { try { el.pause(); el.volume = muted ? 0 : musicVolume * mixFor(tr.id); } catch (e) {} return; }
    // Fade element.volume to 0 (de-click), then pause and restore vol.
    var v0 = el.volume, steps = 6, i = 0;
    var iv = setInterval(function () {
      i++;
      try { el.volume = Math.max(0, v0 * (1 - i / steps)); } catch (e) {}
      if (i >= steps) {
        clearInterval(iv);
        try { el.pause(); el.volume = muted ? 0 : musicVolume * mixFor(tr.id); } catch (e) {}
      }
    }, 20);
  }
  function loadAllFileTracks() {
    // Framing
    loadFileTrack('title',      'assets/music/title.mp3');
    loadFileTrack('menu',       'assets/music/menu.mp3');
    loadFileTrack('intro',      'assets/music/intro.mp3');
    loadFileTrack('overworld_a','assets/music/overworld_a.mp3');
    loadFileTrack('overworld_b','assets/music/overworld_b.mp3');
    loadFileTrack('results_a',  'assets/music/results_a.mp3', false);  // stinger
    loadFileTrack('results_b',  'assets/music/results_b.mp3', false);
    loadFileTrack('gameover_a', 'assets/music/gameover_a.mp3', false); // stinger
    loadFileTrack('gameover_b', 'assets/music/gameover_b.mp3', false);
    regPool('overworld', ['overworld_a', 'overworld_b']);
    regPool('results',   ['results_a', 'results_b']);
    regPool('gameover',  ['gameover_a', 'gameover_b']);
    // Per-level pools
    var levels = [
      ['1_1', ['a','b']], ['2_1', ['a']], ['2_2', ['a','b','c']],
      ['3_1', ['a','b','c']], ['3_2', ['a','b']],
      ['4_1', ['a','b','c']], ['4_2', ['a','b','c']],
      ['5_1', ['a','b','c']], ['5_2', ['a','b','c']],
      ['6_1', ['a','b','c']], ['6_2', ['a','b','c']], ['7_1', ['a','b']]
    ];
    for (var li = 0; li < levels.length; li++) {
      var key = 'level_' + levels[li][0];
      var ids = [];
      for (var vi = 0; vi < levels[li][1].length; vi++) {
        var v = levels[li][1][vi];
        var id = key + '_' + v;
        loadFileTrack(id, 'assets/music/' + id + '.mp3');
        ids.push(id);
      }
      regPool(key, ids);
    }
    // Finale: no dedicated track yet - reuse Day 7 Eden tracks.
    regPool('finale', ['level_7_1_a', 'level_7_1_b']);
  }
  loadAllFileTracks();

  function startMusic(name) {
    if (curSong === name && currentFileTrack) return;          // already playing
    if (curSong === name && songState) return;                  // chiptune playing
    if (!ctx) { pendingSong = name; curSong = name; return; }
    resume();
    // 1) Try Mark's MP3s first.
    if (tryFileTrack(name)) { curSong = name; return; }
    // 2) Fall back to procedural chiptune. If the name is a per-level
    //    key (e.g. 'level_6_2') with no dedicated chiptune, fall back
    //    further to the generic 'level' track.
    stopMusic();
    curSong = name;
    var song = SONGS[name];
    if (!song && /^level_/.test(name)) song = SONGS.level;
    if (!song && (name === 'overworld' || name === 'finale')) song = SONGS.overworld;
    if (!song && (name === 'title' || name === 'menu' || name === 'intro')) song = SONGS.title;
    if (!song) return;
    var stepDur = 60 / song.tempo / 4;
    var t0 = ctx.currentTime + 0.1;
    songState = { song: song, stepDur: stepDur, melIdx: 0, basIdx: 0, melTime: t0, basTime: t0 };
    schedTimer = setInterval(scheduler, 25);
    scheduler();
  }

  function stopMusic() {
    stopFileTrack();
    if (schedTimer) { clearInterval(schedTimer); schedTimer = null; }
    songState = null;
    curSong = null;
  }

  function applyGain() {
    if (master)    master.gain.value    = muted ? 0 : 1;     // master = mute switch
    if (musicGain) musicGain.gain.value = musicVolume;        // chiptune bus only
    if (sfxGain)   sfxGain.gain.value   = sfxVolume;          // sfx bus
    // MP3 tracks use HTMLAudioElement.volume directly (works everywhere
    // and avoids the createMediaElementSource pitfalls on iOS Safari -
    // wiring through WebAudio silently disconnected the element from
    // the speakers on some boots, which broke music entirely).
    for (var id in FILE_TRACKS) {
      var tr = FILE_TRACKS[id];
      if (tr) { try { tr.el.volume = muted ? 0 : musicVolume * mixFor(id); } catch (e) {} }
    }
  }

  SDD.audio = {
    init: init,
    resume: resume,
    sfx: sfx,
    startMusic: startMusic,
    stopMusic: stopMusic,
    setMuted: function (m) { muted = !!m; applyGain(); },
    setVolume: function (v) { volume = Math.max(0, Math.min(1, v)); applyGain(); },
    setMusicVolume: function (v) { musicVolume = Math.max(0, Math.min(1, v)); applyGain(); },
    setSfxVolume:   function (v) { sfxVolume   = Math.max(0, Math.min(1, v)); applyGain(); },
    isMuted: function () { return muted; },
    getVolume: function () { return volume; },
    getMusicVolume: function () { return musicVolume; },
    getSfxVolume: function () { return sfxVolume; },
    syncFromSave: function () {
      var o = SDD.save.data.options;
      muted = !!o.muted;
      volume = (typeof o.volume === 'number') ? o.volume : 0.7;
      musicVolume = (typeof o.musicVolume === 'number') ? o.musicVolume : 0.5;
      sfxVolume   = (typeof o.sfxVolume === 'number') ? o.sfxVolume : 0.85;
      applyGain();
    },
    // Debug accessor: returns a snapshot of every file track's
    // current Audio.element.volume so we can verify slider changes
    // are propagating to the actual playing track.
    _debugTracks: function () {
      var out = {};
      for (var id in FILE_TRACKS) {
        var tr = FILE_TRACKS[id];
        out[id] = {
          vol: tr.el.volume,
          paused: tr.el.paused,
          currentTime: tr.el.currentTime,
          src: tr.el.src.split('/').pop()
        };
      }
      return { currentFileTrack: currentFileTrack ? currentFileTrack.el.src.split('/').pop() : null,
               masterVol: volume, masterMuted: muted,
               ctxState: ctx ? ctx.state : 'no-ctx',
               tracks: out };
    }
  };
})();
