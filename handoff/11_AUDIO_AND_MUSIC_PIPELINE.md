# 11 — Audio and Music Pipeline

## The big lesson

**Audio on mobile web is the silent killer.** It looks fine in your desktop browser. Then on a real iPhone, the title track never plays, the first SFX hangs, the chiptune fallback surfaces, and you can't figure out why.

We hit every gotcha. This file documents them so you don't.

## File formats

| Format | Use case | Verdict |
|---|---|---|
| **MP3** | BGM tracks | ✅ Use this. Universal support, decent compression, streamable via `<audio>` |
| **OGG** | BGM alternate | ✅ Better compression than MP3, but Safari support has been historically iffy. Mixed feelings. |
| **WAV** | Short SFX (< 1 second) | ✅ Decoded into Web Audio buffers for low-latency playback |
| **M4A / AAC** | BGM alternate | ✅ Fine on iOS; less universal on web |
| **FLAC** | Anything | ❌ Too big. Use MP3 or OGG. |
| **OPUS** | Modern alternative | ✅ Best compression, but no Safari support pre-iOS 17. Skip until 2027. |

**Recommendation:** MP3 for everything until you have a specific reason to use something else.

## Compression / bitrate

We shipped at **mono VBR ~96 kbps** for music. Down from stereo 192 kbps. **No audible difference on a phone speaker.** Bundle size dropped 58%.

### Rule of thumb

- **Music**: 96 kbps mono VBR (`ffmpeg -codec:a libmp3lame -q:a 6 -ac 1`)
- **SFX**: 128 kbps stereo if effect benefits from stereo, else mono
- **Voice / dialog**: 64 kbps mono is fine, prioritize compression over quality
- **Ambient loops**: 96 kbps mono

The phone speaker is ~2 cm wide. Stereo separation barely matters. Save bytes.

### Why we re-encoded mid-project

Because we didn't decide bitrate up front. Encoding 38 tracks at 192 kbps stereo gave us a 130 MB bundle. Re-encoding at the project's end is annoying but cheap (one ffmpeg loop, ~5 min). **Just do it up front to skip the re-do.**

### `ffmpeg` one-liner for mass re-encoding

```bash
for f in assets/music/*.mp3; do
  ffmpeg -i "$f" -codec:a libmp3lame -q:a 6 -ac 1 "out/$(basename $f)" </dev/null
done
```

The `</dev/null` is important — without it, ffmpeg can consume part of your loop variable. (We hit this exact bug.)

## Looping music

For `<audio>` element music: set `loop = true`. Browsers handle the loop natively, gapless on modern Chrome and iOS Safari.

**Watch out:** if your music has a leading silence (DAW export artifact), the loop point will have an audible gap. Fix: trim leading silence in Audacity before encoding.

For Web Audio API decoded buffers: looping is via `source.loop = true` + `source.loopStart` / `source.loopEnd`. More control, more complexity. We didn't need this for SDA.

## Music priority and structure

Our music organization:

```
title.mp3        — title screen (eager)
menu.mp3         — main menu (eager)
intro.mp3        — opening cinematic (eager)
overworld_a.mp3  — overworld map variant A (lazy)
overworld_b.mp3  — overworld map variant B (lazy)
results_a.mp3    — stage complete jingle (lazy)
results_b.mp3    — same, alternate variant
gameover_a.mp3   — game over jingle
gameover_b.mp3   — same, alternate
level_1_1_a.mp3  — Day 1-1, variant A
level_1_1_b.mp3  — Day 1-1, variant B
…and so on for every level…
```

### Variant pools

For repeatable scenes (overworld, results, gameover, each level), we pool 2-3 variants and pick randomly each time the scene starts. **Listener fatigue is dramatically reduced** — playing the same overworld track 30 times in a session is grating; rotating between 2 variants feels fresh.

Cost: more files = more bandwidth. Acceptable when variants are < 1 MB each.

## SFX organization

Synthesized in code via Web Audio API (`tone()` and `noise()` functions in `audio.js`). ~46 different SFX, each a few lines of JavaScript. **Zero audio files for SFX in this project.**

### Pros of synthesized SFX

- No file loading delay
- No bundle size cost
- Easy to tweak (just edit numbers)
- Stylistically consistent (all chiptune-feel)
- Plays through Web Audio mixer for free

### Cons

- Limited sonic range — can't make a recorded voice or layered orchestral sting
- Engineering time to write each one
- Hard to do "realistic" sounds

**Recommendation:** synthesized SFX is great for retro / chiptune games. For more polished games, mix synthesized + sampled. The synthesized ones are cheap; the recorded ones are richer.

## Browser autoplay restrictions

The number-one mobile audio gotcha:

**Browsers will not let audio play before the user has interacted with the page.**

This means:
- Calling `play()` on page load → silently fails
- `<audio autoplay>` → silently fails
- Music must wait for the first tap/click/keypress

### The pattern

1. Page loads. Show your title card or "Press any key" message.
2. Wait for first user gesture (tap, click, keypress).
3. Inside that gesture's event handler, call `audio.play()`.
4. From that point, audio works for the rest of the session.

In our project: `In.onFirstGesture(callback)` queues callbacks to run on first input. `A.init()` and `A.startMusic('title')` go in that callback.

### Why "inside the event handler"

Browsers track "user activation." The first tap/click sets it active for ~5 seconds (and persistently in some browsers). Calling `play()` inside that gesture's handler is allowed; calling it later is technically not (and works on desktop, fails on iOS).

**Pattern:** kick off audio init **inside** the first-gesture callback, not in a `setTimeout` or `requestAnimationFrame`.

## iOS audio quirks (the big ones)

### 1. WKWebView starts AVAudioSession cold

The first `play()` after app launch on iOS can stutter / cut off / play silently. Cause: iOS hasn't activated the audio session until the first `play()` initializes it.

**Fix:** in the first-gesture callback, play a 1-frame silent buffer through the master gain BEFORE starting real music. This "warms" the audio session.

```js
function warmAudioSession() {
  const silent = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = silent;
  src.connect(master);
  src.start(0);
}
```

This was our v1.0.5 fix. Without it, the title track on Mark's iPhone stuttered or started silent.

### 2. Service worker Range request handling

Safari sends `Range: bytes=0-1` as the **first** request for any `<audio>` element. If your service worker returns a cached `200 OK` instead of synthesizing a `206 Partial Content`, Safari stops playback. The audio appears to "fail" silently.

**Fix:** in your service worker's fetch handler, detect Range requests for audio. Slice the cached blob and synthesize a 206 with `Content-Range`. (See `service-worker.js` in this project for a working implementation.)

This was our v1.0.5 fix B. Without it, audio after first cache load was unreliable on Safari.

### 3. Audio after phone-call interruption

Once a phone call interrupts iOS audio, the audio session may not auto-resume. The page has to reload, or the audio elements have to be re-triggered.

**Fix:** listen for `visibilitychange` events. On visibility return, re-call `play()` on the current track.

### 4. Multiple `<audio>` elements blocking

iOS has historically limited concurrent `<audio>` element playback. Mixing music + SFX as separate `<audio>` elements can interfere.

**Fix:** use Web Audio API (decoded buffers) for SFX, `<audio>` element only for music. Separate paths, no conflict.

## Loading audio only when needed (lazy loading)

The single most impactful audio fix in this project: **lazy load level music.**

### The bug

We had 38 MP3s, all with `preload="auto"`, all with `<audio>.load()` called at boot. The browser tried to fetch ~130 MB simultaneously. The title track was bandwidth-starved on cold loads. The "old chiptune music" surfaced because the v0.99 timeout fallback substituted it for slow MP3s.

### The fix (v1.0.5)

```js
function loadFileTrack(id, path, loop, eager) {
  const a = new Audio();
  // LAZY by default — only load when ensureLoading() called
  a.preload = eager ? 'auto' : 'none';
  a.src = path;
  if (eager) a.load();
  FILE_TRACKS[id] = { el: a, kicked: !!eager };
}

// Mark only title/menu/intro as eager
loadFileTrack('title', 'assets/music/title.mp3', true, true);
loadFileTrack('menu',  'assets/music/menu.mp3',  true, true);
loadFileTrack('intro', 'assets/music/intro.mp3', true, true);
// All others lazy
loadFileTrack('level_1_1_a', 'assets/music/level_1_1_a.mp3');

// In tryFileTrack (called when entering a scene)
function ensureLoading(tr) {
  if (!tr || tr.kicked) return;
  tr.kicked = true;
  tr.el.preload = 'auto';
  tr.el.load();
}
```

Boot loads only 3 MP3s (title, menu, intro). Level music kicks in when the level scene starts. Verified: **3 boot requests, down from 38.**

## Preventing lag

### Decoded buffers for SFX

Synthesize or decode SFX up front. Playing decoded buffers via Web Audio = instant, no delay.

### Streamed audio for music

`<audio>` element music streams progressively. Starts playing before fully downloaded. Don't decode music into buffers — memory bomb (a 5 MB MP3 = ~55 MB of PCM in RAM).

### Don't decode multiple tracks at once

If you do decode (e.g., for tightly-synced music), don't decode multiple in parallel. `decodeAudioData` is expensive on mobile (8+ seconds on low-end devices for short clips). Decode sequentially or only when needed.

## Audio testing checklist

Before declaring an audio system done:

- [ ] Title music plays on first load (gesture-gated)
- [ ] Title music plays on cold network (slow MP3 download)
- [ ] Level music plays when entering each level
- [ ] Music transitions are smooth (no pop / click on stop/start)
- [ ] SFX play with low latency (no delay between trigger and sound)
- [ ] Volume sliders work for music + SFX independently
- [ ] Mute mutes everything
- [ ] After phone-call interruption, music resumes when app is foregrounded
- [ ] After tab switch and back, music continues
- [ ] After page reload, music still works (no double-init issues)
- [ ] After install via Capacitor on iOS, all the above hold
- [ ] Service worker doesn't break Safari audio (Range request handling)
- [ ] Audio bundle size is reasonable for target platform
- [ ] No audio plays before user gesture (browser autoplay compliance)

## Naming and organization

```
assets/
├── music/
│   ├── title.mp3
│   ├── menu.mp3
│   ├── overworld-a.mp3
│   ├── overworld-b.mp3
│   ├── level-01-a.mp3
│   ├── level-01-b.mp3
│   └── …
└── sfx/
    ├── jump.mp3      (if using files; or hand-synthesized)
    ├── stomp.mp3
    └── …
```

Lowercase, kebab-case, no spaces, no special characters.

## Recommendation for next project

1. **Decide bitrate up front.** Mono VBR ~96 kbps for music. Don't ship 192 kbps stereo.
2. **Lazy load all but 2–3 startup tracks** from day 1.
3. **Use Web Audio for SFX**, `<audio>` element for music. Don't mix.
4. **Service worker Range handling** built in from day 1 if PWA.
5. **AVAudioSession warming** on first gesture if shipping iOS.
6. **First-gesture pattern** for all audio init.
7. **Variant pools** for repeatable tracks to reduce listener fatigue.
8. **One audio system file** that owns all this logic. Don't spread it.
