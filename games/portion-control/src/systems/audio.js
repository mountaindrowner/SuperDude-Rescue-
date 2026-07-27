// audio.js - synthesized music + SFX (COMPENDIUM 11, upgraded per
// PHASE2 WP-AUDIO). WebAudio synthesis + mp3 music. Voice-capped (~8),
// pop rate-limited, music DUCKS under big events, light feedback-delay
// "air" on chime SFX. Volumes persist (portioncontrol.audio).
// Musical language: consonant/major = good events, low/minor = danger.
window.PC = window.PC || {};
(function () {
  var ctx = null, master = null, musicGain = null, sfxGain = null, airSend = null;
  var musicTimer = null, step = 0;
  var voices = 0, lastPopT = 0, popCount = 0;
  var duckUntil = 0, duckTimer = null;

  // persisted mix (PHASE2 default: music .35 / sfx .85)
  // v2 mix (Mark 2026-07-25): music default 10%. The v field migrates
  // older saves - their sfx choice survives, music resets to the new
  // default once.
  var VOLS = { music: 0.10, sfx: 0.85, v: 2 };
  try {
    var saved = JSON.parse(localStorage.getItem('portioncontrol.audio') || 'null');
    if (saved && saved.v === 2) VOLS = saved;
    else if (saved && typeof saved.sfx === 'number') VOLS.sfx = saved.sfx;
  } catch (e) {}

  function ensure() {
    if (ctx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = VOLS.music; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = VOLS.sfx; sfxGain.connect(master);
      // light "air": one shared feedback delay for chime-type SFX
      var delay = ctx.createDelay(0.5); delay.delayTime.value = 0.13;
      var fb = ctx.createGain(); fb.gain.value = 0.25;
      var wet = ctx.createGain(); wet.gain.value = 0.16;
      delay.connect(fb); fb.connect(delay);
      delay.connect(wet); wet.connect(sfxGain);
      airSend = delay;
    } catch (e) { ctx = null; }
    return !!ctx;
  }

  // detune: cents offset for subtle richness on chimes
  function tone(type, f0, f1, dur, gain, bus, attack, air, detune) {
    if (!ctx || voices >= PC.CAPS.SFX_VOICES) return;
    voices++;
    var t0 = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (detune) o.detune.value = detune;
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + (attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || sfxGain);
    if (air && airSend) { var s = ctx.createGain(); s.gain.value = 0.5; g.connect(s); s.connect(airSend); }
    o.start(t0); o.stop(t0 + dur + 0.03);
    o.onended = function () { voices--; };
  }
  function noise(dur, gain, freq) {
    if (!ctx || voices >= PC.CAPS.SFX_VOICES) return;
    voices++;
    var t0 = ctx.currentTime;
    var buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1400;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t0); src.stop(t0 + dur);
    src.onended = function () { voices--; };
  }
  // chord helper: staggered notes, chime timbre with air
  function arp(freqs, stepMs, dur, gain) {
    for (var i = 0; i < freqs.length; i++) (function (fr, d) {
      setTimeout(function () {
        tone('triangle', fr, 0, dur, gain, null, 0.006, true);
        tone('sine', fr, 0, dur * 1.1, gain * 0.4, null, 0.006, true, 8);
      }, d);
    })(freqs[i], i * stepMs);
  }

  // duck music ~35% for big events, quick recovery ramp
  function duck(ms) {
    if (!ctx || !musicGain) return;
    var t0 = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t0);
    musicGain.gain.setValueAtTime(VOLS.music * 0.62, t0);
    musicGain.gain.linearRampToValueAtTime(VOLS.music, t0 + (ms || 220) / 1000 + 0.25);
    if (musicEl) {
      musicEl.volume = VOLS.music * 0.62;
      if (duckTimer) clearTimeout(duckTimer);
      duckTimer = setTimeout(function () {
        if (musicEl) musicEl.volume = VOLS.music;
      }, (ms || 220) + 120);
    }
  }

  // ---- D1 music: bright bouncy street-chaos loop, 32 steps @ ~136bpm ----
  var BASS = [130.8, 0, 130.8, 0, 164.8, 0, 130.8, 0, 174.6, 0, 174.6, 0, 196.0, 0, 164.8, 0,
              130.8, 0, 130.8, 0, 164.8, 0, 130.8, 0, 174.6, 0, 196.0, 0, 220.0, 0, 196.0, 0];
  var MEL =  [523.3, 0, 659.3, 523.3, 0, 784.0, 0, 659.3, 698.5, 0, 523.3, 0, 587.3, 0, 659.3, 0,
              523.3, 0, 659.3, 784.0, 0, 880.0, 0, 784.0, 698.5, 659.3, 0, 587.3, 659.3, 0, 523.3, 0];

  // Adventure City tracks via HTMLAudioElement (iOS-safe); synth loop is
  // the fallback. Per-district loops slot in here later (Suno exports).
  var CITY_TRACKS = ['assets/music/city_a.mp3', 'assets/music/city_b.mp3', 'assets/music/city_c.mp3'];
  var musicEl = null;

  function startSynth() {
    if (!ensure() || musicTimer) return;
    musicTimer = setInterval(function () {
      var b = BASS[step % 32], m = MEL[step % 32];
      if (b) tone('square', b, 0, 0.16, 0.10, musicGain);
      if (m) tone('triangle', m, 0, 0.14, 0.12, musicGain);
      if (step % 4 === 2) noise(0.03, 0.025, 6000);        // hat
      if (step % 8 === 0) tone('sine', 65, 40, 0.1, 0.2, musicGain); // kick
      step++;
    }, 110);
  }

  PC.audio = {
    unlock: function () {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      this.startMusic();
    },
    startMusic: function () {
      if ((musicEl && !musicEl.paused) || musicTimer) return;
      try {
        var src = CITY_TRACKS[(Math.random() * CITY_TRACKS.length) | 0];
        musicEl = new Audio(src);
        musicEl.loop = true; musicEl.volume = VOLS.music;
        musicEl.addEventListener('error', function () { startSynth(); });
        var p = musicEl.play();
        if (p && p.catch) p.catch(function () { startSynth(); });
      } catch (e) { startSynth(); }
    },
    stopMusic: function () {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      if (musicEl) { try { musicEl.pause(); } catch (e) {} }
    },
    setHidden: function (h) {
      if (musicEl) { try { h ? musicEl.pause() : musicEl.play(); } catch (e) {} }
      if (!ctx) return;
      try { if (h && ctx.state === 'running') ctx.suspend(); else if (!h) ctx.resume(); } catch (e) {}
    },

    // ---- mix control (persisted) ----
    getVols: function () { return { music: VOLS.music, sfx: VOLS.sfx }; },
    setMusicVol: function (v) {
      VOLS.music = Math.max(0, Math.min(1, v));
      if (musicGain) musicGain.gain.value = VOLS.music;
      if (musicEl) musicEl.volume = VOLS.music;
      try { localStorage.setItem('portioncontrol.audio', JSON.stringify(VOLS)); } catch (e) {}
    },
    setSfxVol: function (v) {
      VOLS.sfx = Math.max(0, Math.min(1, v));
      if (sfxGain) sfxGain.gain.value = VOLS.sfx;
      try { localStorage.setItem('portioncontrol.audio', JSON.stringify(VOLS)); } catch (e) {}
      // audible tick so the level is hearable while dragging
      tone('sine', 880, 0, 0.06, 0.2, null, 0.004, true);
    },

    // ---- combat / economy ----
    pop: function () {
      var now = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
      if (now - lastPopT > 1) { popCount = 0; lastPopT = now; }
      if (popCount++ > PC.CAPS.POP_SFX_PER_S) return;
      var v = 1 + (popCount % 3) * 0.15;                     // 3 pitch variants
      tone('sine', 620 * v, 140, 0.14, 0.3);
      noise(0.06, 0.12, 2200);
    },
    shoot: function () {
      tone('square', 980, 620, 0.05, 0.05);
      tone('sawtooth', 240, 150, 0.07, 0.04);   // low body layer
    },
    gem: function () { tone('sine', 1318, 1760, 0.07, 0.12); },
    coin: function () { tone('square', 988, 1319, 0.06, 0.14, null, 0.006, true); },
    hurt: function () { tone('sawtooth', 220, 70, 0.25, 0.3); noise(0.12, 0.15, 500); },
    heal: function () { arp([523.3, 784.0], 60, 0.2, 0.18); },

    // ---- progression: consonant, bright, ducks the music ----
    levelup: function () {
      duck(300);
      arp([523.3, 659.3, 784.0, 1046.5], 70, 0.18, 0.2);    // C major run up
    },
    cardSelect: function () {
      tone('triangle', 659.3, 0, 0.09, 0.16, null, 0.006, true);      // E
      setTimeout(function () { tone('triangle', 987.8, 0, 0.14, 0.18, null, 0.006, true); }, 70); // B (P5 up)
    },
    // title sequence (v0.13.0): heavy door clank + pneumatic hiss
    clank: function () {
      tone('square', 190, 60, 0.16, 0.28);
      tone('sawtooth', 95, 45, 0.3, 0.2);
      tone('sine', 52, 30, 0.4, 0.26);
      noise(0.1, 0.22, 900); noise(0.28, 0.09, 300);
    },
    hiss: function () {
      noise(0.5, 0.09, 5200); noise(0.6, 0.045, 2400);
    },
    ui: function () { tone('square', 660, 880, 0.05, 0.1); },
    chest: function () {
      duck(200);
      tone('square', 440, 660, 0.08, 0.14); noise(0.12, 0.1, 1800);
      arp([880, 1108.7, 1318.5], 55, 0.18, 0.14);           // A major shimmer
    },
    evolve: function () {                                    // reserved: WP-EVOLUTIONS
      duck(500);
      arp([523.3, 659.3, 784.0, 1046.5, 1318.5, 1568.0], 55, 0.3, 0.16);
    },
    revive: function () {
      duck(400);
      arp([392.0, 523.3, 659.3, 784.0], 90, 0.35, 0.18);    // warm G-C rise
      noise(0.4, 0.04, 900);
    },

    // ---- danger: low, dark, minor ----
    telegraph: function () {
      tone('sawtooth', 98, 92, 0.28, 0.22);                  // low G growl
      tone('sawtooth', 103.8, 98, 0.28, 0.14, null, 0.01, false, -6); // minor 2nd rub
    },
    roar: function () {
      duck(350);
      tone('sawtooth', 130, 55, 0.5, 0.34);
      tone('square', 65, 40, 0.5, 0.2);
      noise(0.3, 0.2, 700);
    },
    splat: function () { noise(0.16, 0.2, 900); tone('sine', 300, 90, 0.18, 0.16); },
    bossHit: function () {
      tone('sine', 160, 60, 0.16, 0.3); noise(0.08, 0.16, 1200);
    },
    bossDie: function () {
      duck(700);
      tone('sawtooth', 200, 30, 0.8, 0.32); noise(0.5, 0.22, 600);
      setTimeout(function () { arp([523.3, 659.3, 784.0, 1046.5, 1318.5], 80, 0.3, 0.2); }, 500);
    },
    fanfare: function () {
      duck(700);
      arp([523.3, 659.3, 784.0], 90, 0.3, 0.2);              // C major triad
      setTimeout(function () {
        tone('triangle', 1046.5, 0, 0.5, 0.2, null, 0.01, true);
        tone('triangle', 1568.0, 0, 0.5, 0.12, null, 0.01, true, 6);  // held C+G
      }, 300);
    },
  };
})();
