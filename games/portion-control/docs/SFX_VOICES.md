# PER-ABILITY SFX — VOICE ARCHITECTURE & 26-WEAPON TABLE
## Mother-session deliverable for MOTHER_SESSION_BRIEFS §1
*Built entirely on the existing `src/systems/audio.js` primitives (`tone()`, `noise()`, buses,
ducking). No new engine, no audio files. Goal: every weapon gets its OWN voice, generated from a
few parameter axes, tuned so weapons in the same archetype FAMILY sound related.*

---

## §0 — THE APPROACH (why a table, not 26 more functions)

Hand-writing 26 more SFX methods = 26 sets of magic numbers and no coherence. Instead: define a
small set of **voice axes**, give each archetype **family** a shared timbre signature, and store each
weapon as a short **recipe** of deltas. A **combinator** turns a recipe into `tone()`/`noise()` calls.
Result: distinct-but-related voices, one data table, trivial to tune.

Kept from the existing "musical language": major/bright = good, low/minor = danger, everything
short and kid-friendly, never harsh. These 26 are the ACTIVATION voices; the existing ~18 event
SFX (gem, coin, fanfare, hurt, chest…) stay exactly as they are — this is additive.

---

## §1 — THE 8 VOICE AXES (the DNA, mapped to the primitives)

| Axis | Values | Maps to | Perceived as |
|---|---|---|---|
| **wave** | sine · triangle · square · sawtooth | `tone(type,…)` | material: energy(sine/tri) / retro-mech(square) / harsh-electric(saw) |
| **register** | base Hz (LOW 110–220 · MID 350–600 · HIGH 800–1100) | `tone` f0 | size: big=low, small/fast=high |
| **glide** | ratio pair [f0×, f1×] → rise / fall / flat / blip | `tone` f0→f1 | motion: launch(rise) / impact(fall) / drone(flat) |
| **dur** | seconds | `tone`/`noise` dur | snappy vs sustained |
| **noiseMix** | gain 0–0.25 + lowpass Hz | `noise(dur,gain,freq)` | texture: clean(low) vs explosive/fire(high) |
| **rhythm** | single · double · burst×N · tick(loop) | # scheduled calls | fire pattern |
| **air** | bool | `tone(…, air=true)` | space: big/called=airy, melee=dry |
| **jitter** | ± cents per trigger (+ `detune` for thickness) | randomize f, `detune` | stops machine-gun monotony |

---

## §2 — RECIPE SCHEMA + COMBINATOR

Families hold defaults; each weapon overrides only what differs.

```js
// audio.js — data
const SFX_FAMILY = {
  shot:    { wave:'sine',     air:false, mode:'throttle', throttle:0.12, jitter:40, gain:0.14 },
  orbiter: { wave:'triangle', air:true,  mode:'loop',     tickHz:4,      jitter:30, gain:0.06 },
  aura:    { wave:'sine',     air:false, mode:'loop',     tickHz:8,      jitter:70, gain:0.06 },
  zone:    { wave:'triangle', air:true,  mode:'throttle', throttle:0.2,  jitter:40, gain:0.12 },
  minion:  { wave:'square',   air:false, mode:'throttle', throttle:0.13, jitter:45, gain:0.10 },
  strike:  { wave:'square',   air:true,  mode:'event',    noiseMix:0.2,  jitter:25, gain:0.18 },
  boomer:  { wave:'sawtooth', air:true,  mode:'event',    jitter:30,     gain:0.12 },
  chain:   { wave:'sawtooth', air:false, mode:'throttle', throttle:0.10, jitter:80, gain:0.12 },
  melee:   { wave:'square',   air:false, mode:'throttle', throttle:0.14, jitter:45, gain:0.14 },
  control: { wave:'sine',     air:true,  mode:'event',    jitter:25,     gain:0.14 },
  homing:  { wave:'triangle', air:true,  mode:'throttle', throttle:0.13, jitter:60, gain:0.08 },
  sweep:   { wave:'sawtooth', air:true,  mode:'loop',     tickHz:0,      jitter:10, gain:0.08 },
};

// each weapon = family + deltas (see §4 table)
const SFX_VOICE = {
  resizer: { fam:'shot', base:620, glide:[1,1.7], dur:0.08, noiseMix:0.03, noiseLP:2000 },
  // …26 rows…
};

// combinator
function playWeaponVoice(key, active) {
  const v = { ...SFX_FAMILY[SFX_VOICE[key].fam], ...SFX_VOICE[key] };
  if (v.mode === 'loop') return setWeaponLoop(key, v, active);      // start/stop with weapon
  if (v.mode === 'throttle' && now - last[key] < v.throttle) return; // rate-limit
  last[key] = now;
  const j = 1 + rand(-v.jitter, v.jitter)/1200;                     // cents → ratio
  const reps = rhythmReps(v.rhythm);                                // 1 / 2 / N / …
  for (let i = 0; i < reps; i++) schedule(i * (v.dur*0.6), () => {
    tone(v.wave, v.base*v.glide[0]*j, v.base*v.glide[1]*j, v.dur, v.gain, sfxBus, 0.005, v.air, v.detune||0);
    if (v.noiseMix) noise(v.dur*0.8, v.noiseMix, v.noiseLP||2000);
  });
}
```
`mode:'loop'` weapons (auras, orbiters, beam, sweep) keep ONE quiet sustained/ticking voice while
the weapon is active — never a per-shot sound (see §5). `mode:'event'` fires once per activation
(strikes, lobs, retaliation, wall drop). `mode:'throttle'` is auto-fire with a floor between sounds.

---

## §3 — FAMILY TIMBRE SIGNATURES (the coherence layer)

Weapons in a family share these so they read as relatives:

- **Shots** — clean short blip, per-shot jitter, dry, MID/HIGH. (Resizer, Blaster, Beam, Espresso)
- **Orbiters** — soft airy swish on a slow loop, quiet. (Whisk, Lasso)
- **Auras** — granular high tick loop, quiet. (Salt, and Pineapple's retaliate as a sharp variant)
- **Zones** — wet/organic, airy, throttled. (Seeds, Grease, Ketchup)
- **Minions** — tiny mechanical "pew," square, HIGH, throttled. (Gizmotron, Sentry, SentryBot)
- **Called strikes** — LOW airy boom + a short rising telegraph cue. (Strike, Comet)
- **Boomerang/ricochet** — spinning whir / boing, up-down glide, airy. (Cutter, Jaw)
- **Chain** — bright saw crackle, electric. (Zap)
- **Melee** — dry, short, noisy whoosh+thwack. (Skillet, Haymaker)
- **Control** — filtered noise whoosh, airy, glide. (Freeze, Fridge, Vortex)
- **Homing** — cute high triangle flurry. (Sprinkle)
- **Sweep** — sustained rotating hum. (Microwave)

---

## §4 — THE 26-WEAPON VOICE TABLE

`glide` = [f0×, f1×]. noise = gain/lowpassHz. All buildable from `tone()`+`noise()`.

| Weapon | Family | wave | base Hz | glide | dur | noise | rhythm | air | jitter¢ | mode | character |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Resizer | shot | sine | 620 | 1→1.7 | .08 | .03/2000 | single | – | 40 | throttle .09 | clean rising shrink-pew |
| Blaster | shot | square | 480 | 1→0.7 | .10 | .12/1500 | burst×3 | – | 60 | throttle .18 | scattergun triple-chuff |
| Beam | shot | saw | 700 | 1→1.02 | loop | .02/3000 | tick | – | 15 | loop | thin steady laser line |
| Espresso | shot | tri→sine | 300→900 | rise→pop | .5+.09 | .05/2000 | single | ✓ | 20 | event | wind-up whistle → pop |
| Whisk | orbiter | triangle | 520 | 1→1.3→1 | .12 | .02/1800 | tick | ✓ | 30 | loop | airy orbit swish |
| Lasso | orbiter | sine | 200 | 1→1.5 | .16 | .02/1200 | tick(3Hz) | ✓ | 20 | loop | growing rope whoomp |
| Salt | aura | sine | 900 | flat | .05 | .10/4000 | tick(8Hz) | – | 80 | loop | granular shaker tick |
| Pineapple | aura* | square | 420 | 1→1.8→.6 | .12 | .15/2500 | single | – | 40 | event | spiky thorn burst (on-hit) |
| Seeds | zone | sine | 360 | 1→0.6 | .09 | .03/1500 | single | ✓ | 50 | throttle .2 | soft seed plip |
| Grease | zone | saw | 160 | flat | .18 | .18/900 | tick(6Hz) | ✓ | 30 | loop | low fire fwoosh |
| Ketchup | zone | triangle | 300 | 1→1.6 | .12+.10 | .16/1200 | single | ✓ | 40 | event | thwup → wet splat |
| Gizmotron | minion | square | 1000 | 1→1.4 | .05 | .04/3000 | single | – | 50 | throttle .12 | tiny orbit pew |
| Sentry | minion | square | 560 | 1→0.8 | .07 | .10/2000 | single | – | 40 | throttle .15 | heavier turret chuff |
| SentryBot | minion | tri+sq | 700 | 1→1.3 | .09 | .05/2500 | double | – | 40 | throttle .14 | friendly bloop-pew |
| Strike | strike | square | 150 | 1→0.5 | .22 | .20/1000 | burst | ✓ | 30 | event | telegraph → walking booms |
| Comet | strike | sine→noise | 1200→200 | fall | .35 | .22/900 | single | ✓ | 20 | event | sky whistle → crash |
| Cutter | boomer | saw | 600 | up-down | .10×2 | .05/2500 | double | ✓ | 30 | event | spinning whir out & back |
| Jaw | boomer | triangle | 500 | 1→1.6→1 | .08 | .03/2000 | tick/bounce | – | 60 | event .08 | bouncy boing (pitch↑/bounce) |
| Zap | chain | saw | 900 | flat | .06 | .16/5000 | burst | – | 80 | throttle .10 | bright electric crackle |
| Skillet | melee | square | 420 | 1→0.6 | .09 | .14/2500 | single | – | 40 | throttle .16 | metallic pan clang |
| Haymaker | melee | square | 300 | 1→0.8 | .06 | .08/1800 | burst×2 | – | 50 | throttle .11 | rapid soft jabs (pap-pap) |
| Freeze | control | sine+noise | 700→400 | fall | .16 | .14/3000 | single | ✓ | 30 | throttle .18 | icy descending shhww |
| Fridge | control | square | 140 | 1→0.7 | .14 | .16/1000 | single | – | 20 | event | heavy wall chunk-thud |
| Vortex | control | sine | 200→500 | rise | .20 | .10/1500 | single | ✓ | 20 | event | rising suction whoop |
| Sprinkle | homing | triangle | 950 | 1→1.3 | .05 | .02/3000 | burst×4 | ✓ | 60 | throttle .13 | cute sprinkle fwip-flurry |
| Microwave | sweep | saw+tri | 380 | LFO 4Hz | loop | .03/2500 | tick | ✓ | 10 | loop | rotating hum shimmer |

*Pineapple sits in the aura family for timbre kinship but fires as an on-hit `event`, not a loop.

**Register spacing is deliberate:** minions/auras/homing live HIGH (800–1000), shots MID (300–700),
strikes/control/fire LOW (140–300). Simultaneous weapons occupy different bands → the mix stays legible.

---

## §5 — ANTI-CACOPHONY RULES (critical — auto-fire × fast weapons × 300 enemies)

1. **Continuous weapons never play per-shot.** Beam, Salt, Grease, Whisk, Lasso, Microwave use ONE
   sustained/ticking `loop` voice started when the weapon activates and stopped when it stops. This
   is the single most important rule — per-projectile sound on these = instant noise wall.
2. **Throttle floor per weapon** (`throttle` col): a weapon can't retrigger its voice faster than its
   floor (~90–180 ms). Fast fire still *feels* fast; the ear isn't machine-gunned.
3. **Per-trigger pitch jitter** so repeats don't sound identical.
4. **Global voice cap** (keep the existing ~8-voice cap): drop the oldest when exceeded; prioritize
   event voices (strikes, hits) over ambient loops.
5. **Duck music** under dense SFX (already implemented) — keep it.
6. **Impacts reuse the shared `pop`/`splat`/`bossHit` SFX** (already rate-limited to ~10/s) — do NOT
   add a per-weapon impact sound; the activation voice + shared impact is enough.

---

## §6 — BUILD STEPS & ACCEPTANCE

1. Add `SFX_FAMILY` + `SFX_VOICE` tables and `playWeaponVoice()` (+ `setWeaponLoop`) to `audio.js`.
   Flag `SFX_VOICES` in CONFIG (default on).
2. Hook each weapon's fire/activate to `playWeaponVoice(key)`; wire `mode:'loop'` weapons to
   start/stop with their active state.
3. Implement throttle map, rhythm scheduler, and jitter.
4. **Earcon test (debug):** a hidden menu that plays all 26 voices in sequence. Verify: each is
   distinct; family members sound related; nothing harsh; then a live full-swarm run to confirm the
   mix isn't cacophonous with 4 weapons firing.
5. Leave the existing 18 event SFX untouched.

---

## §7 — GUARDRAILS

- **Additive & flagged:** existing SFX and the audio engine are untouched; new table behind `SFX_VOICES`.
- **Kid-friendly:** keep durations short and gains modest; cap sawtooth harshness (short dur + low
  gain on Beam/Grease/Zap). Bright and playful, never grating.
- **No new engine, no files:** only `tone()`/`noise()` — the brief confirmed these suffice.
- **Family coherence is the point:** never tune a single weapon so it breaks its family's timbre; adjust
  the family default instead.
- **Perf:** loops are one voice each; respect the voice cap; ducking stays.

*Deliverable complete: schema + combinator + 12 family signatures + 26 concrete voices + the
anti-cacophony rules that keep it clean at swarm scale. Hand to Claude Code as one build task.*
