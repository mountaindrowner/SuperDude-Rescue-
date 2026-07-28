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

  // ---- per-weapon SFX voices (docs/SFX_VOICES.md, mother-session
  // table, v0.15.0). Family defaults + per-weapon deltas -> one
  // combinator. Continuous weapons call weaponVoice() every frame and
  // the per-key gap turns that into their tick loop (anti-cacophony
  // rule 1); everything else is throttled/event by the same gap.
  var VOICE_FAM = {
    shot:    { w: 'sine',     air: 0, gap: 0.12, jit: 40, g: 0.14 },
    orbiter: { w: 'triangle', air: 1, gap: 0.25, jit: 30, g: 0.06 },
    aura:    { w: 'sine',     air: 0, gap: 0.13, jit: 80, g: 0.06 },
    zone:    { w: 'triangle', air: 1, gap: 0.20, jit: 40, g: 0.12 },
    minion:  { w: 'square',   air: 0, gap: 0.13, jit: 45, g: 0.10 },
    strike:  { w: 'square',   air: 1, gap: 0.12, jit: 25, g: 0.18 },
    boomer:  { w: 'sawtooth', air: 1, gap: 0.08, jit: 30, g: 0.12 },
    chain:   { w: 'sawtooth', air: 0, gap: 0.10, jit: 80, g: 0.12 },
    melee:   { w: 'square',   air: 0, gap: 0.11, jit: 45, g: 0.14 },
    control: { w: 'sine',     air: 1, gap: 0.15, jit: 25, g: 0.14 },
    homing:  { w: 'triangle', air: 1, gap: 0.13, jit: 60, g: 0.08 },
    sweep:   { w: 'sawtooth', air: 1, gap: 0.22, jit: 10, g: 0.08 },
  };
  var VOICES = {
    resizer:   { f: 'shot', b: 620, g0: 1, g1: 1.7, d: 0.08, n: 0.03, nl: 2000, gap: 0.09 },
    blaster:   { f: 'shot', w: 'square', b: 480, g0: 1, g1: 0.7, d: 0.10, n: 0.12, nl: 1500, reps: 3, gap: 0.18 },
    beam:      { f: 'strike', gap: 2.0, layers: [
      { w: 'sawtooth', f0: 120, f1: 640, d: 0.85, g: 0.07, air: 1 },
      { t: 0.9, w: 'sawtooth', f0: 520, f1: 180, d: 0.55, g: 0.16, n: 0.14, nl: 1600, air: 1 }] },
    espresso:  { f: 'shot', gap: 0.4, layers: [
      { w: 'triangle', f0: 300, f1: 900, d: 0.5, g: 0.08, air: 1 },
      { t: 0.5, w: 'sine', f0: 900, f1: 600, d: 0.09, g: 0.16, n: 0.05, nl: 2000 }] },
    whisk:     { f: 'orbiter', b: 520, g0: 1, g1: 1.3, d: 0.12, n: 0.02, nl: 1800, gap: 0.25 },
    lasso:     { f: 'orbiter', w: 'sine', b: 200, g0: 1, g1: 1.5, d: 0.16, n: 0.02, nl: 1200, gap: 0.33 },
    salt:      { f: 'aura', b: 900, g0: 1, g1: 1, d: 0.05, n: 0.10, nl: 4000, gap: 0.13 },
    pineapple: { f: 'aura', w: 'square', b: 420, g0: 1, g1: 1.8, d: 0.12, n: 0.15, nl: 2500, g: 0.16, gap: 0.3 },
    seeds:     { f: 'zone', w: 'sine', b: 360, g0: 1, g1: 0.6, d: 0.09, n: 0.03, nl: 1500, gap: 0.2 },
    grease:    { f: 'zone', w: 'sawtooth', b: 160, g0: 1, g1: 1, d: 0.18, n: 0.18, nl: 900, g: 0.08, gap: 0.17 },
    ketchup:   { f: 'zone', gap: 0.25, layers: [
      { w: 'triangle', f0: 300, f1: 480, d: 0.12, g: 0.12, air: 1 },
      { t: 0.12, w: 'triangle', f0: 200, f1: 120, d: 0.10, g: 0.10, n: 0.16, nl: 1200 }] },
    drone:     { f: 'minion', b: 1000, g0: 1, g1: 1.4, d: 0.05, n: 0.04, nl: 3000, gap: 0.12 },
    sentry:    { f: 'minion', b: 560, g0: 1, g1: 0.8, d: 0.07, n: 0.10, nl: 2000, gap: 0.15 },
    sentrybot: { f: 'minion', w: 'triangle', b: 700, g0: 1, g1: 1.3, d: 0.09, n: 0.05, nl: 2500, reps: 2, gap: 0.14 },
    strike:    { f: 'strike', b: 150, g0: 1, g1: 0.5, d: 0.22, n: 0.20, nl: 1000, gap: 0.16 },
    comet:     { f: 'strike', gap: 0.3, layers: [
      { w: 'sine', f0: 1200, f1: 250, d: 0.32, g: 0.12, air: 1 },
      { t: 0.3, w: 'sine', f0: 200, f1: 90, d: 0.16, g: 0.16, n: 0.22, nl: 900 }] },
    cutter:    { f: 'boomer', b: 600, g0: 1, g1: 1.5, d: 0.10, n: 0.05, nl: 2500, reps: 2, gap: 0.3 },
    jaw:       { f: 'boomer', w: 'triangle', b: 500, g0: 1, g1: 1.6, d: 0.08, n: 0.03, nl: 2000, gap: 0.08 },
    zap:       { f: 'chain', b: 900, g0: 1, g1: 1, d: 0.06, n: 0.16, nl: 5000, gap: 0.10 },
    skillet:   { f: 'melee', b: 420, g0: 1, g1: 0.6, d: 0.09, n: 0.14, nl: 2500, gap: 0.16 },
    haymaker:  { f: 'melee', b: 300, g0: 1, g1: 0.8, d: 0.06, n: 0.08, nl: 1800, reps: 2, gap: 0.11 },
    freeze:    { f: 'control', b: 700, g0: 1, g1: 0.57, d: 0.16, n: 0.14, nl: 3000, gap: 0.18 },
    fridge:    { f: 'control', w: 'square', b: 140, g0: 1, g1: 0.7, d: 0.14, n: 0.16, nl: 1000, gap: 0.2 },
    vortex:    { f: 'control', b: 200, g0: 1, g1: 2.5, d: 0.20, n: 0.10, nl: 1500, gap: 0.3 },
    sprinkle:  { f: 'homing', b: 950, g0: 1, g1: 1.3, d: 0.05, n: 0.02, nl: 3000, reps: 4, gap: 0.13 },
    microwave: { f: 'sweep', b: 380, g0: 1, g1: 1.12, d: 0.16, n: 0.03, nl: 2500, gap: 0.22 },
  };
  var vLast = {};
  function playVoice(key) {
    if (!PC.SFX_VOICES || !ctx) return;
    var v = VOICES[key];
    if (!v) return;
    var fam = VOICE_FAM[v.f] || {};
    var gap = v.gap !== undefined ? v.gap : (fam.gap || 0.12);
    var t = ctx.currentTime;
    if (vLast[key] && t - vLast[key] < gap) return;
    vLast[key] = t;
    var jit = v.jit !== undefined ? v.jit : (fam.jit || 40);
    var j = Math.pow(2, ((Math.random() * 2 - 1) * jit) / 1200);
    if (v.layers) {
      for (var li = 0; li < v.layers.length; li++) (function (L) {
        var go = function () {
          tone(L.w, L.f0 * j, L.f1 * j, L.d, L.g, null, 0.006, !!L.air);
          if (L.n) noise(L.d * 0.8, L.n, L.nl || 2000);
        };
        if (L.t) setTimeout(go, L.t * 1000); else go();
      })(v.layers[li]);
      return;
    }
    var wave = v.w || fam.w || 'sine';
    var gain = v.g !== undefined ? v.g : (fam.g || 0.12);
    var reps = v.reps || 1;
    for (var i = 0; i < reps; i++) (function (i2) {
      var go = function () {
        tone(wave, v.b * v.g0 * j, v.b * v.g1 * j, v.d, gain, null, 0.006, !!fam.air);
        if (v.n) noise(v.d * 0.8, v.n, v.nl || 2000);
      };
      if (i2) setTimeout(go, i2 * v.d * 600); else go();
    })(i);
  }

  PC.audio = {
    // fire a weapon's voice (throttled per-key; safe to call every frame)
    weaponVoice: function (key) { playVoice(key); },
    // debug earcon test: all 26 voices in sequence (dev mode)
    earconTest: function () {
      if (!ensure()) return;
      var keys = Object.keys(VOICES);
      keys.forEach(function (k, i) {
        setTimeout(function () { vLast[k] = 0; playVoice(k); }, i * 500);
      });
      return keys.length;
    },
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
    // story dialogue blip (STORY-1): one soft tick per few letters,
    // pitched per speaker (CHOMP uses square = robotic)
    textBlip: function (pitch, wave) {
      tone(wave || 'triangle', 460 * (pitch || 1), 520 * (pitch || 1),
        0.035, 0.05);
    },
    // cutscene music cues - synth stub loops per mood until Suno
    // tracks land; each is a soft two-note pad via the music bus
    musicCue: function (tag) {
      if (!ensure()) return;
      this.stopMusic();
      var NOTES = { hopeful: [392, 494], tense: [196, 208],
                    lift: [330, 415], warm: [262, 330],
                    boss: [147, 156], triumphant: [392, 523] };
      var pair = NOTES[tag] || NOTES.hopeful;
      var step = 0;
      musicTimer = setInterval(function () {
        var f = pair[step++ % 2];
        tone('triangle', f, f, 0.9, 0.05, musicGain, 0.05, true);
        if (tag === 'tense' || tag === 'boss') noise(0.06, 0.02, 900);
      }, 1000);
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
