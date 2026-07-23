// audio.js - synthesized music + SFX (COMPENDIUM 11). No files: WebAudio
// only, so the game has sound from the first build. Voice-capped (~8), pop
// rate-limited. Unlocks on first gesture (browser autoplay policy).
window.PC = window.PC || {};
(function () {
  var ctx = null, master = null, musicGain = null, sfxGain = null;
  var musicTimer = null, step = 0;
  var voices = 0, lastPopT = 0, popCount = 0;

  function ensure() {
    if (ctx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.8; sfxGain.connect(master);
    } catch (e) { ctx = null; }
    return !!ctx;
  }

  function tone(type, f0, f1, dur, gain, bus, attack) {
    if (!ctx || voices >= PC.CAPS.SFX_VOICES) return;
    voices++;
    var t0 = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + (attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || sfxGain);
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

  // ---- D1 music: bright bouncy street-chaos loop, 32 steps @ ~136bpm ----
  var BASS = [130.8, 0, 130.8, 0, 164.8, 0, 130.8, 0, 174.6, 0, 174.6, 0, 196.0, 0, 164.8, 0,
              130.8, 0, 130.8, 0, 164.8, 0, 130.8, 0, 174.6, 0, 196.0, 0, 220.0, 0, 196.0, 0];
  var MEL =  [523.3, 0, 659.3, 523.3, 0, 784.0, 0, 659.3, 698.5, 0, 523.3, 0, 587.3, 0, 659.3, 0,
              523.3, 0, 659.3, 784.0, 0, 880.0, 0, 784.0, 698.5, 659.3, 0, 587.3, 659.3, 0, 523.3, 0];

  // Adventure City tracks (Mark round 10: "bring in the Adventure City
  // music"). Plays a random one per run via a plain HTMLAudioElement
  // (works everywhere, avoids the iOS createMediaElementSource pitfall);
  // the synth loop below is the fallback if an mp3 fails to load.
  var CITY_TRACKS = ['assets/music/city_a.mp3', 'assets/music/city_b.mp3', 'assets/music/city_c.mp3'];
  var musicEl = null, MUSIC_VOL = 0.42;

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
        musicEl.loop = true; musicEl.volume = MUSIC_VOL;
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
    hurt: function () { tone('sawtooth', 220, 70, 0.25, 0.3); noise(0.12, 0.15, 500); },
    levelup: function () {
      var f = [523.3, 659.3, 784.0, 1046.5];
      for (var i = 0; i < 4; i++) (function (fr, d) {
        setTimeout(function () { tone('triangle', fr, 0, 0.16, 0.22); }, d);
      })(f[i], i * 70);
    },
    ui: function () { tone('square', 660, 880, 0.05, 0.1); },
    heal: function () { tone('sine', 523, 784, 0.18, 0.2); tone('sine', 784, 1046, 0.2, 0.12); },
    coin: function () { tone('square', 988, 1319, 0.06, 0.14); },
    chest: function () { tone('square', 440, 660, 0.08, 0.14); noise(0.12, 0.1, 1800); tone('sine', 880, 1318, 0.2, 0.14); },
  };
})();
