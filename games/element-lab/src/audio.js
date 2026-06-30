// audio.js — fully synthesized SFX + ambient music via Web Audio (Brief §11).
// No audio files needed; everything is generated so the sub-game is self-
// contained. Merge "pop" pitch rises one step per tier. Gated by sfx/music
// options and the parent's initial audio state.
window.DANNYLAB = window.DANNYLAB || {};

DANNYLAB.makeAudio = function (sfxOn, musicOn) {
  var ctx = null;
  var master, sfxGain, musicGain;
  var musicTimer = null;
  var musicStep = 0;
  var tracks = {};            // name -> decoded mp3 AudioBuffer
  var trackSource = null;     // currently-playing looping source
  var wantTrack = null;       // name of the track we want playing
  var playingTrack = null;    // name of the track actually playing (null = synth/none)
  var state = { sfx: !!sfxOn, music: !!musicOn };

  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();   master.gain.value = 0.5;  master.connect(ctx.destination);  // start at 50%
    sfxGain = ctx.createGain();  sfxGain.gain.value = 0.85; sfxGain.connect(master);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.25; musicGain.connect(master);
    return true;
  }

  // Browsers suspend audio until a user gesture — call on first tap.
  function resume() {
    if (ensure() && ctx.state === 'suspended') ctx.resume();
  }

  // ---- low-level voice: one enveloped oscillator ----
  function tone(opts) {
    if (!state.sfx || !ensure()) return;
    var t0 = ctx.currentTime;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.f0, t0);
    if (opts.f1 != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.f1), t0 + opts.dur);
    var peak = opts.gain == null ? 0.4 : opts.gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (opts.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(g);
    g.connect(opts.bus || sfxGain);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  }

  // ---- short noise burst (fizz / fission / geiger) ----
  function noise(opts) {
    if (!state.sfx || !ensure()) return;
    var t0 = ctx.currentTime;
    var dur = opts.dur || 0.25;
    var buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var filt = ctx.createBiquadFilter();
    filt.type = opts.filter || 'bandpass';
    filt.frequency.value = opts.freq || 1200;
    filt.Q.value = opts.q || 1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(opts.gain == null ? 0.3 : opts.gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt); filt.connect(g); g.connect(sfxGain);
    src.start(t0); src.stop(t0 + dur);
  }

  // ==== named cues (Brief §11 table) ====
  var api = {
    resume: resume,

    // read-only music diagnostics (which loop is playing / loaded)
    status: function () {
      var loaded = []; for (var k in tracks) loaded.push(k);
      return { music: state.music, want: wantTrack, playing: playingTrack, loaded: loaded };
    },

    setSfx: function (on) { state.sfx = !!on; },
    setMusic: function (on) {
      state.music = !!on;
      if (state.music) api.startMusic(); else api.stopMusic();
    },

    // soft "bloop" when released from tweezers
    drop: function () { tone({ type: 'sine', f0: 420, f1: 200, dur: 0.16, gain: 0.35 }); },

    // merge pop — pitch up one semitone-ish step per tier (tier 2 low .. 9 high)
    merge: function (tier) {
      var base = 180 * Math.pow(2, (tier - 2) / 7); // tier2≈180Hz .. tier9≈360+
      tone({ type: 'triangle', f0: base, f1: base * 2.2, dur: 0.18, gain: 0.4, attack: 0.004 });
      tone({ type: 'sine', f0: base * 2, f1: base * 3, dur: 0.12, gain: 0.18 });
    },

    // cascade — brighter sparkle each step in the chain
    cascade: function (step) {
      var f = 700 + step * 220;
      tone({ type: 'square', f0: f, f1: f * 1.6, dur: 0.12, gain: 0.12 });
      tone({ type: 'sine', f0: f * 1.5, dur: 0.1, gain: 0.1 });
    },

    // discovery — bright chime + page flip feel
    discovery: function () {
      [880, 1175, 1568].forEach(function (f, i) {
        setTimeout(function () { tone({ type: 'sine', f0: f, dur: 0.3, gain: 0.22 }); }, i * 70);
      });
      noise({ filter: 'highpass', freq: 3000, dur: 0.12, gain: 0.08 });
    },

    // element signatures
    fizz: function () { noise({ filter: 'highpass', freq: 2200, dur: 0.4, gain: 0.18 }); },
    magnet: function () { tone({ type: 'square', f0: 140, f1: 90, dur: 0.1, gain: 0.25 }); },
    coin: function () {
      tone({ type: 'square', f0: 988, dur: 0.08, gain: 0.18 });
      setTimeout(function () { tone({ type: 'square', f0: 1319, dur: 0.18, gain: 0.18 }); }, 70);
    },
    geiger: function () {
      for (var i = 0; i < 6; i++) {
        setTimeout(function () { noise({ filter: 'bandpass', freq: 4000, q: 6, dur: 0.03, gain: 0.12 }); }, i * 55 + Math.random() * 30);
      }
    },

    // fission — contained cartoon whoomph + sparkle shower
    fission: function () {
      tone({ type: 'sawtooth', f0: 220, f1: 40, dur: 0.5, gain: 0.4 });
      noise({ filter: 'lowpass', freq: 800, dur: 0.5, gain: 0.4 });
      for (var i = 0; i < 8; i++) {
        setTimeout(function () { tone({ type: 'sine', f0: 1200 + Math.random() * 1600, dur: 0.2, gain: 0.12 }); }, 60 + i * 40);
      }
    },

    // Lab Charge level-up — triumphant rising charge
    chargeUp: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        setTimeout(function () { tone({ type: 'triangle', f0: f, f1: f * 1.5, dur: 0.22, gain: 0.28 }); tone({ type: 'sine', f0: f * 2, dur: 0.15, gain: 0.12 }); }, i * 80);
      });
    },
    // high-combo cascade stinger
    stinger: function () {
      [784, 988, 1319].forEach(function (f, i) { setTimeout(function () { tone({ type: 'square', f0: f, dur: 0.12, gain: 0.16 }); }, i * 55); });
    },
    // mystery sample reveal — rainbow shimmer
    mystery: function () {
      for (var i = 0; i < 6; i++) setTimeout(function () { tone({ type: 'sine', f0: 600 + Math.random() * 1400, dur: 0.18, gain: 0.14 }); }, i * 55);
    },

    // overflow / game over — gentle descending "aww"
    aww: function () {
      tone({ type: 'sine', f0: 440, f1: 180, dur: 0.6, gain: 0.3 });
      tone({ type: 'triangle', f0: 330, f1: 140, dur: 0.7, gain: 0.18 });
    },

    // button press
    click: function () { tone({ type: 'square', f0: 660, f1: 880, dur: 0.05, gain: 0.14 }); },

    // ---- haptics (Vibration API; Android web/native — iOS Safari ignores it,
    // a native iOS build would use the Capacitor Haptics plugin). Gated by the
    // SFX option so it shares the feedback on/off switch. ----
    haptic: function (combo) {
      if (!state.sfx) return;
      if (typeof navigator === 'undefined' || !navigator.vibrate) return;
      var n = combo || 1, p;
      if (n <= 1) p = 14;                                  // single merge: a light tick
      else if (n === 2) p = 22;
      else if (n === 3) p = [24, 26, 24];                  // double buzz
      else if (n === 4) p = [26, 28, 26, 28, 30];
      else p = [30, 28, 30, 28, 34, 28, 48];               // big cascade: long roll
      try { navigator.vibrate(p); } catch (e) {}
    },
    // a celebratory buzz for big moments (level-up, fission)
    hapticBig: function () {
      if (!state.sfx) return;
      if (typeof navigator === 'undefined' || !navigator.vibrate) return;
      try { navigator.vibrate([40, 40, 60, 40, 90]); } catch (e) {}
    },

    // ---- quiet background-lab ambience (very low in the mix) ----
    ambBeep: function () { tone({ type: 'sine', f0: 1200 + Math.random() * 400, dur: 0.09, gain: 0.045 }); },
    ambClunk: function () { tone({ type: 'square', f0: 130, f1: 80, dur: 0.08, gain: 0.05 }); },
    ambStep: function () { tone({ type: 'sine', f0: 90, f1: 60, dur: 0.06, gain: 0.04 }); noise({ filter: 'lowpass', freq: 300, dur: 0.05, gain: 0.03 }); },
    ambHiss: function () { noise({ filter: 'highpass', freq: 2600, dur: 0.55, gain: 0.045 }); },
    ambServo: function () { tone({ type: 'sawtooth', f0: 300, f1: 620, dur: 0.22, gain: 0.04 }); },
    ambHum: function () { tone({ type: 'sine', f0: 110, dur: 0.6, gain: 0.035 }); tone({ type: 'sine', f0: 165, dur: 0.6, gain: 0.02 }); },
    ambSpark: function () { for (var i = 0; i < 3; i++) setTimeout(function () { noise({ filter: 'bandpass', freq: 3800, q: 5, dur: 0.03, gain: 0.05 }); }, i * 60 + Math.random() * 40); },
    ambDoor: function () { tone({ type: 'sawtooth', f0: 220, f1: 120, dur: 0.4, gain: 0.04 }); noise({ filter: 'lowpass', freq: 500, dur: 0.4, gain: 0.03 }); },

    // ---- load a named mp3 track to use as a music loop ----
    // Decodes in the background; if it's the track we currently want playing
    // (and music is on), it swaps in seamlessly the moment it's ready.
    loadTrack: function (name, url) {
      if (!ensure()) return Promise.resolve(false);
      return fetch(url)
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); })
        .then(function (buf) { return ctx.decodeAudioData(buf); })
        .then(function (decoded) {
          tracks[name] = decoded;
          if (state.music && wantTrack === name && playingTrack !== name) api.startMusic(name);
          return true;
        })
        .catch(function (e) {                      // fall back to synth loop
          if (typeof console !== 'undefined') console.warn('Element Lab: music track "' + name + '" failed to load, using synth -', (e && e.message) || e);
          return false;
        });
    },

    // ---- start (or switch to) a named music loop; falls back to the synth ----
    // arpeggio until the requested track has finished decoding.
    startMusic: function (name) {
      if (name) wantTrack = name;
      if (!state.music || !ensure()) return;
      var buf = wantTrack ? tracks[wantTrack] : null;
      if (buf) {
        if (trackSource && playingTrack === wantTrack) return;   // already on it
        if (trackSource) { try { trackSource.stop(0); } catch (e) {} trackSource = null; }
        if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }   // leave the synth
        trackSource = ctx.createBufferSource();
        trackSource.buffer = buf;
        trackSource.loop = true;
        trackSource.connect(musicGain);
        try { trackSource.start(0); } catch (e) {}
        playingTrack = wantTrack;
        return;
      }
      api._startSynth();   // requested track not decoded yet
    },

    _startSynth: function () {
      if (!state.music || !ensure() || musicTimer) return;
      // pentatonic-ish, calm
      var notes = [261.63, 311.13, 349.23, 392.00, 466.16, 392.00, 349.23, 311.13];
      var stepMs = 380;
      musicTimer = setInterval(function () {
        if (!state.music) return;
        var f = notes[musicStep % notes.length];
        var t0 = ctx.currentTime;
        var osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
        osc.connect(g); g.connect(musicGain);
        osc.start(t0); osc.stop(t0 + 0.75);
        // soft bass every 4 steps
        if (musicStep % 4 === 0) {
          var b = ctx.createOscillator(), bg = ctx.createGain();
          b.type = 'triangle'; b.frequency.value = f / 2;
          bg.gain.setValueAtTime(0.0001, t0);
          bg.gain.exponentialRampToValueAtTime(0.1, t0 + 0.08);
          bg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
          b.connect(bg); bg.connect(musicGain);
          b.start(t0); b.stop(t0 + 1.25);
        }
        musicStep++;
      }, stepMs);
    },
    stopMusic: function () {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      if (trackSource) { try { trackSource.stop(0); } catch (e) {} trackSource = null; }
      playingTrack = null;
    },

    // duck music briefly under a big SFX
    duck: function () {
      if (!ensure() || !state.music) return;
      var t0 = ctx.currentTime;
      musicGain.gain.cancelScheduledValues(t0);
      musicGain.gain.setValueAtTime(musicGain.gain.value, t0);
      musicGain.gain.linearRampToValueAtTime(0.08, t0 + 0.05);
      musicGain.gain.linearRampToValueAtTime(0.25, t0 + 0.9);
    },
  };

  return api;
};
