# Briefs for the Mother Session (2026-07-27)

Three context packages Mark requested during the v0.14.x playtest, so
the mother session can architect on top of what actually exists.

---

## 1. HOW SOUND EFFECTS ARE MADE TODAY (for the per-ability SFX architecture)

Everything is **synthesized live in WebAudio** (`src/systems/audio.js`)
— zero audio files for SFX. The building blocks:

- **`tone(type, f0, f1, dur, gain, bus, attack, air, detune)`** — one
  oscillator: waveform `sine|square|sawtooth|triangle`, frequency
  glides f0→f1 over `dur` seconds, short attack envelope, exponential
  release. `air=true` routes through a feedback-delay "air" send
  (subtle echo). `detune` adds cents for thickness.
- **`noise(dur, gain, freq)`** — filtered white-noise burst (lowpass
  at `freq`); the percussion/impact layer.
- **Buses**: master → musicGain / sfxGain (user sliders, persisted).
  Music ducks under heavy SFX moments.
- **A "musical language"**: good things use major intervals (gem =
  E→up, fanfare = major arpeggio), danger uses low minor/dissonant
  slides (hurt = sawtooth 220→70). Kid-friendly = short, bright,
  never harsh.
- Each SFX today is a hand-written method (~18: shoot, pop, gem, coin,
  hurt, ui, chest, telegraph, roar, splat, bossHit, bossDie, fanfare,
  revive, evolve, cardSelect, clank, hiss) = 1-4 tone() + noise()
  calls with hand-picked numbers.

**What Mark wants**: every ability gets its OWN voice. The natural
architecture (mother session to design): a **data-driven SFX recipe
table** keyed by weapon key — e.g.
`{ wave, freqSeq: [f0, f1], dur, noiseMix, pitchJitter, layers: [...] }`
— plus a small combinator so ~26 weapons get distinct voices from
~6-8 parameter axes (waveform, register, glide direction, noise
amount, rhythm, air) instead of 26 hand-written functions. The
existing tone/noise primitives are sufficient; no new engine needed.
Deliverable wanted from mother session: the recipe schema + a
26-row voice table (weapon key → parameters) tuned for FAMILY
coherence (e.g. all "called strikes" share a telegraph timbre).

---

## 2. HOW MAPS/ENVIRONMENTS ARE MADE (for the QUEST MAP / STORY MODE idea)

Current system (`src/systems/ground.js`): the world is painted in
**512x512-px canvas chunks**, generated on demand from a seeded
procedural painter — roads, buildings (collision via
`PC.resolveCircle`), lawns, props, decals, all drawn with Canvas 2D
using the district palette + real PixelLab tiles/props from the atlas.
Chunks in camera view are live; off-view chunks are recycled. Memory
is therefore ~9-12 live canvases (~1 MB each) NO MATTER how big the
world is.

**Answer to Mark's size question**: a fully UNIQUE, hand-authored,
connected map is limited by DATA, not memory. Tile+prop data at 32-px
resolution costs ~1 byte/tile:
- 4096x4096 px (~12x7 phone screens) = 16k tiles = trivial. SAFE.
- **8192x8192 px (~24x14 screens) = 65k tiles = still trivial. This is
  the realistic ceiling for a single connected quest map** — beyond
  that, navigation (not tech) becomes the problem for kids.
- Recommend the story-mode vertical slice at **4096x4096**.

How authoring would work: a **region map JSON** (grid of zone types +
building rects + prop placements + decal seeds) that the SAME chunk
painter consumes instead of noise — so the art pipeline (procedural
paint + PixelLab tiles/props from the atlas) is unchanged, only the
LAYOUT source changes. Quest layer on top: objective points
{x, y, radius, portraitId, text}, an edge-of-screen compass arrow to
the active objective, trigger → swarm wave / boss / rescue.
PixelLab handles characters/enemies/props (as today); environment
stays procedural canvas.

Mark's story frame: one map per hero, unlock the team one by one,
mission text delivered via the hero PORTRAITS (exists in atlas).
Mother session deliverable: the story outline + per-map layout briefs
(zones, objective chain, boss); Claude Code then builds the region
JSON + painters + the quest/compass system. Vertical slice: Stage 1,
Super Dude Danny, flooded city, 3 objectives + boss.

---

## 3. ASSET QUALITY PIPELINE RULE (for "icons/gems/blasts need depth")

Current inventory has three tiers: real PixelLab art (heroes, D1
enemies, icons, portraits, sig weapons, gems/bolt as of v0.14.7),
hand-authored pixel maps (handart.js), and code-drawn primitives
(FX bursts, rings, some projectiles). Mark's rule request: nothing
visible in-run should read as a FLAT PRIMITIVE.

Proposed rule (mother session to formalize):
1. **Generate big, ship exact**: PixelLab at 48-64px → alpha-threshold
   (a>=90) → content-crop → center-square → NEAREST to registry size.
   (This is the pipeline that shipped gems + the resizer bolt.)
2. **Layer law for code-drawn FX**: minimum 3 layers — base fill +
   top-left highlight + bottom occlusion (PC.labPanel is the UI
   version of this; FX need an equivalent tiny helper).
3. **Screenshot gate**: every new asset is verified via an in-game
   headless screenshot at 3x before commit (existing harness).
4. Palette lock: the 16-color COMPENDIUM palette, always.

Mother session deliverable: prioritized list of remaining flat
primitives to upgrade (FX bursts/rings, enemy projectiles, pickup
hearts/magnets/bombs) + any style-law amendments.
