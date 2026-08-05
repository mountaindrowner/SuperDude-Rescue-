# VFX DNA — how Portion Control's effects are built

> Codified at Mark's request ("how did you make such smooth effects...
> so that we can codify that logic"). These are the working laws behind
> every ring, flame, splash and field in the game. Source of truth in
> code: `src/systems/vfx.js` (shared additive layer), `src/systems/fx.js`
> (pooled sprite bursts), plus per-weapon draws in kits/arsenal files.

## The five construction laws

### 1. Gradients are stacked additive circles
There is no per-frame radial gradient anywhere — too slow, and flat
fills look dead. A "smooth glow" is N plain circles on an ADD-blend
layer, radius shrinking while the color ramps hotter, each at low
alpha. Addition does the blending; the eye reads continuous falloff.

The fire heat-bed recipe (`vfx.js` BANDS):

| band | color | radius | alpha |
|---|---|---|---|
| 1 | KETCHUP `#d93a3a` | 100% | 0.055 |
| 2 | ember `#ff5a2b` | 78% | 0.065 |
| 3 | CHEESE `#ff9d3b` | 56% | 0.075 |
| 4 | MUSTARD `#f2c33c` | 34% | 0.085 |
| 5 | cream `#fff6e0` | 16% | 0.070 |

Five fillCircles ≈ one photoshop radial gradient, at 60fps, for free.

### 2. Effects are DATA in pools, drawn by ONE layer
One shared `Graphics` (ADD blend, depth 6) is cleared and fully redrawn
every frame from plain structs: `{active, x, y, r, t, dur, seed}`.
Pools are fixed-size (12 rings, 8 fields, 24 heat, `PC.CAPS.FX` burst
sprites). Pool full? Rings steal the OLDEST slot; bursts DROP. Never
allocate mid-play, never destroy mid-play — that is why it never
stutters and never leaks. (Perf Bible rules 1/8.)

### 3. Smoothness is math on two clocks
Every visible property is a pure function of:
- the effect's own life fraction `k = t/dur` (drives fade, growth,
  collapse — e.g. telegraph alpha `0.35 + 0.45k`, shrink-ring radius
  `r * (0.15 + 0.85k)`), and
- the global clock through sines at 13–17 Hz for flicker/pulse
  (`0.86 + 0.14 * sin(now*17)`).

**The seed rule:** every instance offsets its sine phase with a seed
(slot index `j*1.7`, or position `x*0.05 + y*0.03`). Two flames must
never flicker in sync — synchronized pulse is the #1 cheap-effect tell.

### 4. Describe, don't own (stateless submission)
A burning thing never manages a glow object. Each frame it SUBMITS
`vfx.heatBed(x, y, r, intensity)` — "this spot burns right now" — and
the renderer draws everything submitted, then zeroes the list
(`_heatN = 0`). No lifecycle, no cleanup, no way for the effect to
outlive, lag, or desync from its cause. Anything that moves while
burning gets a glued-on glow for free.

### 5. The layer law + the color law
- **Layer law:** bright edge + soft interior falloff. NEVER a solid
  fill (reads as a sticker), NEVER a bare outline (reads as debug).
  On the ADD layer a dark rim is impossible, so the low-alpha body
  fill is what keeps a ring from reading as a wireframe.
- **Color law (semantic, absolute):** player shots CYAN `#35d0ff`,
  enemy shots PINK, XP LIME, danger telegraphs KETCHUP/CHERRY, fire
  ramps MUSTARD→CHEESE→KETCHUP. A kid learns the language once and it
  is never violated.

## Sprite bursts (fx.js) — the other half

Hand-pixeled frame sets (`fx_pop_1..4`, `fx_spark_1..3`, splashes,
flames) played fast (0.15–0.4s) through the pooled images:
- **Few frames + random rotation** (`burstRot`) beats many frames:
  rotation kills the "identical stamp" tell when effects overlap.
- **One frame set, many scales:** the same splash serves a hero impact
  at scale 1 and its satellite droplets at 0.4.
- **Tint per use:** one white/neutral set tinted per team/enemy keeps
  the atlas small and the color law intact.

## Composition: how a "detailed" effect is assembled

A finished effect = 3 cheap layers, never 1 expensive one. The flame
jet, for example:
1. `heatBed` glow pool under it (law 1, glued via law 4),
2. a shaped code-drawn body (polygon/arc on the shared layer, flickered
   by law 3),
3. sprite `burst` accents on impact (spark frames, rotated).

Same recipe for everything: ground-truth layer + body + accents.

## Motion beats resolution

Nothing here is high-res. The perceived quality comes from: per-seed
flicker, pulse on radius AND alpha, drift offsets
(`x + sin(now*7+seed) * r*0.15`), squash-stretch on poses, and the
walk-bob/lean "code-side life" rule from ARTDNA. When an effect looks
flat, add MOTION, not pixels.

## Checklist for any new effect

- [ ] Is it drawn from pooled data on the shared layer (or fx pool)?
- [ ] Does it use stacked-ADD falloff instead of a flat fill?
- [ ] Is every property driven by `k` and/or a seeded sine?
- [ ] If it tracks a live thing: submitted per frame, not owned?
- [ ] Bright edge + soft body? Semantic color? Under the caps?
- [ ] Two instances side by side: do they flicker OUT of sync?
