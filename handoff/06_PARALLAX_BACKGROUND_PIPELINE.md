# 06 — Parallax Background Pipeline

## What multi-layer parallax actually is

Parallax = drawing multiple background layers at **different scroll speeds** relative to the camera. Layers further "behind" scroll slower; layers "in front" scroll faster. The brain reads the difference as depth.

A 2D side-scrolling game with a single backdrop looks flat. A 2D side-scrolling game with 4 well-tuned parallax layers looks 3D. This is the cheapest, highest-impact visual upgrade in 2D game design.

## The 5-layer model (what we converged on)

| Layer | Parallax speed | What it contains | Opacity |
|---|---|---|---|
| **Layer 1 (Far)** | 0.05 × camera | Sky, distant horizon, atmospheric gradient | Opaque |
| **Layer 2 (Mid-far)** | 0.15 × camera | Distant skyline, mountain ranges, far city buildings | Mostly opaque |
| **Layer 3 (Mid)** | 0.30 × camera | Main skyline / treeline, recognizable landmarks | Mostly opaque |
| **Layer 4 (Near-bg)** | 0.50 × camera | Closer buildings, larger trees, bridges | Mostly opaque |
| **Layer 5 (Foreground silhouette)** | 1.20–1.50 × camera | Dark architectural silhouettes, hanging branches, frame elements | Transparent — overlay only |
| **Layer 6 (Gameplay)** | 1.00 × camera | Tile-based world, entities, player | (handled by engine) |

Note: parallax speeds < 1 = scrolls slower than camera (background). > 1 = scrolls faster (overlay). The gameplay world is exactly 1.

You don't need 6 layers per scene. Some scenes use 3. The Cyber theme used all 5 plus a tunnel-overlay sublayer. **The minimum useful count is 3.** Above 5 is diminishing returns.

## Which layers should be opaque vs. transparent

### Opaque layers
- Far / mid-far / mid: each fills its vertical band completely. Solid sky color, solid landmark silhouette.
- These can be drawn cumulatively: far first, then mid-far covers part of it, then mid, etc.

### Transparent layers
- Foreground silhouette (layer 5): drawn LAST, on top of gameplay. Mostly transparent except where a near object covers the frame. Branches hanging from the top of the screen. A close pillar at the screen edge.
- Foreground layers are accent / framing — they should never cover the action zone.

### Rule of thumb
- Layers 1–4: opaque base + decoration
- Layer 5: 70%+ transparent, used as a frame

## How to make panels continue logically left-to-right

The Adventure City stage spans cols 0–720 (vs the original game's 320). That's 4–5 screens of unique art. Each screen had to feel like part of the same world, not stitched.

### Strategy 1: tileable units

Some assets tile horizontally. A row of streetlamps every 64 world-pixels. A repeating window pattern on a building. These are cheap and add density.

### Strategy 2: variant overlays on a base

The cyber buildings used a base silhouette + randomized window-lighting pattern + random rooftop element. Same shape, different details = repeats don't feel like repeats.

### Strategy 3: hand-painted panels with overlap zones

For genuinely unique landmarks, paint 3-5 panels at 320 wide each, with the rightmost 32 px of panel N matching the leftmost 32 px of panel N+1. Draw them edge-to-edge in the camera transform.

### Strategy 4: procedural with a seed

Most far/mid layers are abstract enough that a seeded random function produces "the same building city" wherever the camera goes. The Adventure City cyber theme uses this for the far skyline — `Math.sin(worldX * 0.073)` gives a deterministic skyline outline that's the same every frame at the same camera position but never repeats verbatim within a stage.

## Keeping visual consistency across panels

Two enemies of consistency:
1. **Palette drift** — when you AI-generate panel B with the prompt from panel A, the AI uses a slightly different green. After 5 panels, the world is rainbow.
2. **Lighting drift** — panel A has light from upper-right, panel B has light from upper-left. The eye notices instantly.

### Mitigations:

1. **Lock the palette in a document.** 5 hex codes. Every panel uses exactly those.
2. **Lock the lighting direction.** "Light comes from upper-right at 45°." Every panel honors it.
3. **Use a single source for atmospheric perspective.** "Far elements have 30% added blue + 30% desaturation." Apply consistently.
4. **When generating with AI, include the previous panel as a reference image.** Most image AIs (Midjourney, ChatGPT image) let you supply a "style reference." Use the previous panel as the reference, not a new prompt.
5. **Do all panels in one session.** Don't paint panel A on Monday and panel C on Friday. Memory + mood drift.

## How to test if a background works in-game

Open the level. Put the player in walking pose. Take a screenshot. Now answer:

- [ ] Can you spot the player without searching?
- [ ] Can you spot enemies without searching?
- [ ] Can you spot collectibles without searching?
- [ ] Where is the "ground"? Does the eye find the platform line instantly?
- [ ] Where does the background end and the world begin? Should be obvious.
- [ ] Does anything in the background look like a platform? (If yes — readability bug.)
- [ ] Does anything in the foreground silhouette block the player's view of incoming enemies? (If yes — gameplay bug.)
- [ ] Does the screenshot look interesting? (If no — the background isn't doing its job either.)

If any of these are "no," fix the background before adding more content.

## Prompt templates

### Template — "Generate a new panel to the right of an existing scene"

```
Here is the current panel of a side-scrolling background [ATTACH PANEL N].
Generate the next panel that continues seamlessly to the right.

Requirements:
- Same palette: [LIST 5 HEX]
- Same lighting direction: light from [DIRECTION]
- Same atmospheric perspective: far elements [HAZE LEVEL], mid [SAT LEVEL], near [DARK]
- Same parallax structure: 5 layers, far to near
- Match the right edge of the input panel exactly at the left edge of the output panel
- Introduce ONE new landmark / element: [SPECIFY] so the new panel has variety
- Style reference: [GAME NAME]
- Resolution: [TARGET]
- Format: layered PNG if possible, else flat PNG with the 5-color palette
```

### Template — "Generate the foreground silhouette layer only"

```
Generate ONE asset: the foreground silhouette layer for a side-scrolling
[SETTING] scene.

Requirements:
- Transparent PNG with alpha
- Near-black silhouettes only, with [WARM/COOL] rim lighting along top edges
- Frames the gameplay — elements ONLY at the top edge (hanging branches /
  signs / wires) and bottom edge (close foliage / debris / railings)
- NEVER covers the middle horizontal band (y=60 to y=140 in a 180-pixel
  scene) — that's where the player runs
- Style: minimalist silhouette, 1-2 px outline highlights
- Resolution: [TARGET], to be drawn as the closest parallax layer at speed 1.2-1.5
```

### Template — "Test a background at the gameplay layer"

```
Take this background image [ATTACH] and overlay a small bright-colored
silhouette of a player character at the following positions:
- Bottom-left ground level
- Center ground level
- Mid-air center
- Bottom-right ground level

Does the player silhouette read clearly against the background at all
four positions? If any position fails, identify what to change.
```

## Per-layer canvas caching (the performance trick)

Don't paint the parallax layers every frame. Paint each layer ONCE to a hidden `<canvas>` element, then `drawImage` the cache each frame.

Pseudo-code:

```js
function buildCyberFar() {
  const cache = document.createElement('canvas');
  cache.width = 1024;
  cache.height = 540;
  const g = cache.getContext('2d');
  // Expensive painting here — runs once
  paintFarSkyline(g);
  paintFarBuildings(g);
  paintAtmosphericHaze(g);
  return cache;
}

const farCache = buildCyberFar();

function renderFrame(camera) {
  // Cheap: just draw the cached canvas with scroll offset
  const offset = -(camera.x * 0.05) % farCache.width;
  ctx.drawImage(farCache, offset, 0);
  ctx.drawImage(farCache, offset + farCache.width, 0); // tile-wrap
}
```

This is what `_cyBuild` does in `scenes.js`. The first time the cyber theme is loaded, it builds all 5 cached canvases. Every frame after that is cheap `drawImage` calls.

**Without this, the cyber theme would run at 10 fps. With it, 60 fps.**

## Parallax readiness checklist

Before declaring a parallax background "done":

- [ ] All layers paint at the correct parallax speed (test by walking past the same x-position twice and confirming the camera framing looks right)
- [ ] Foreground silhouette layer is transparent except in narrow top/bottom bands
- [ ] No layer obscures the player at any reasonable Y position
- [ ] Layers don't have hard color jumps at their join lines (tile boundaries)
- [ ] Color palette is consistent across all layers
- [ ] Lighting direction is consistent across all layers
- [ ] Painted to cached canvases, NOT re-painted per frame
- [ ] Performance: confirmed 60 fps on the target device (test on the actual phone, not desktop)
- [ ] Tested with player silhouettes at multiple positions — readable
- [ ] Tested with enemies overlaid — readable
- [ ] Has a `meta.json` or comment block documenting the palette, lighting, and parallax speeds

## Common parallax mistakes

| Symptom | Cause | Fix |
|---|---|---|
| Backgrounds look flat | All layers scroll at speed 1.0 | Vary speeds — 0.05 / 0.15 / 0.30 / 0.50 / 1.0 |
| Backgrounds judder | Per-frame canvas operations | Cache layers, drawImage only |
| Player disappears mid-jump | Background too busy in vertical middle | Push detail to top/bottom, quiet the middle |
| Layers look misaligned | Inconsistent palette / lighting | Lock palette + lighting before painting any layer |
| Hard color jumps at tile edges | Tiles don't seamlessly loop | Bake horizontal tileability into the layer source |
| Foreground silhouette covers gameplay | Layer 5 is too dense | Reduce silhouette to top/bottom bands only |
| Backgrounds repeat boringly | Single tileable asset | Add variant overlays + randomized lighting per instance |
| Bad performance on phone | Painting layers per frame | Pre-render to cached canvas |
