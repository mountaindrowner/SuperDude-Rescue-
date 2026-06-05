# 05 — Art Direction and Style Bible

## A theme is a TRIPLE (load-bearing architecture rule)

Before anything else about pretty backgrounds: **a theme in a tile-based platformer is not one thing. It is three things, locked together:**

1. **Tile family** — the visual tileset (ground, walls, decoration) that defines what the world is built from.
2. **Sky painter** — the parallax background function (`drawSky_<theme>` in this project) that paints the depth layers.
3. **Entity variant map** — which walker / wisp / thrower visual variants spawn (e.g. forest walker = mushroom, savanna walker = porcupine, bugscale walker = goliath beetle).

**If any one of the three is missing or mismatched, the stage looks borrowed from another level.** We learned this the hard way when Day 6-2 first launched with a forest sky painter, savanna walker variants, and bugscale tiles. Mark's exact verdict: *"borrowed from the savanna level."* All three legs of the triple have to match before a theme reads as its own place.

### The rule for adding a new theme

1. Pick the **theme name** (a single token like `bugscale`, `cyber`).
2. Build the **tile family**: ground, brick, one-way, plus 1–2 decoratives.
3. Write the **sky painter**: `drawSky_<theme>(g, camx, camy, prog, t)`.
4. Add the **variant map**: tell every enemy class which sub-art to use under this theme (`THEME_VARIANT.walker.bugscale = 'beetle'` etc.).
5. Register the theme in your `THEMES` table.
6. Verify with a screenshot pre-flight: spawn each enemy class on a one-tile bare stage and check the right variant rendered.

Don't ship a new theme that's missing any leg of the triple. The per-stage triple table is in `22_REFERENCE_PROJECT_SPECIFICS.md`.

---

## The shift that changed everything

For the first 9 stages, the game's backgrounds were **procedural** — drawn entirely by JS functions like `drawSky_sky`, `drawSky_forest`, `drawSky_cosmic_night`. They worked. They were on-brand. They were also kind of flat.

Adventure City (Day 8-1) was different. It's the only stage in the game with a **fully painted, multi-layer, atmospheric, stylized backdrop** built from cached canvases that simulate true parallax depth. **It's the most-praised visual in the game.** The whole game would have looked better if every stage worked like Adventure City.

This file is how to do that on the next game from day one.

## The concept-vs-production distinction

Most artists / AIs jump to "make a beautiful background." That gets you a Pinterest-tier piece of concept art that's *unusable for gameplay*. There are four distinct stages of background asset:

### 1. Concept art
- A single rendered image showing the mood, palette, vibe
- Looks great in isolation
- NOT directly usable in the game
- Purpose: align the team / AI on style
- Output: one image, any aspect, layered file optional

### 2. Production background
- The concept, **re-staged for gameplay readability**
- Player silhouette must read clearly against it
- Action zone (where gameplay happens) is visually quieter
- Detail concentrated in dead zones (sky, distant skyline)
- Output: an image at the target render resolution, ideally **layered**

### 3. Parallax layer
- ONE slice of the production background, isolated
- Has its own transparency, depth, color treatment
- Will be drawn at its own parallax speed against the camera
- 3–5 such layers per scene

### 4. Tileable / loopable
- Either tiles seamlessly left-right (for endless scrolling)
- Or is wide enough to never repeat in the visible level (1024 wide for a 320-game-pixel viewport = 3+ screens of unique art)
- Has matching edges if it tiles

**The mistake:** generating concept art and shipping it as a background. The art looks great in the preview, then the player walks behind it and disappears. Or it doesn't tile. Or the foreground silhouettes blend with enemies.

## What made Adventure City's backgrounds work

### 1. **Atmospheric perspective (the big one)**

Far things are hazier, less saturated, more blue/grey. Mid things are more saturated. Near things are dark and high-contrast.

In our cyber theme:
- Far skyline: faded indigo-grey, low contrast, no detail finer than 2 px
- Mid skyline: full saturation neon, sharp edges, recognizable buildings
- Near foreground: near-black silhouettes with rim-lighting

This creates **depth** that screenshots can't fake. The eye reads it as a 3D scene even though every layer is 2D.

### 2. **Foreground silhouettes for gameplay readability**

The closest parallax layer is essentially black with subtle internal details. It defines the *front of the world*. Critically: **it gives the player a darker backdrop to silhouette against.**

Without this, mid-tone player sprites on mid-tone backgrounds = lost player. With it, the player always reads.

### 3. **Lighting as a layer, not a paint detail**

Adventure City has a `_cyDrawShaders` pass that:
- Applies a warm vignette top, cool vignette bottom
- Multiplies a soft gradient over the entire scene
- Pulses subtly with time

This single pass made every cyber screenshot look "cinematic" without any individual element changing.

### 4. **Per-building paint stack**

Each tall building in the midground was painted by a function that drew:
- Outline / silhouette
- Solid color body
- Window grid
- Random lit windows (warm yellow + cyan)
- Edge highlights
- Roof signage / antennas

This **layered stack** = the same building shape feels different per instance because random window-light placement makes each building unique.

### 5. **Pre-rendered to a hidden canvas, drawn each frame**

Each layer was painted once to a `<canvas>` element in memory, then **drawn as a single image** every frame. Zero per-frame computation. Scrolled at its parallax speed by translating where on the source canvas we sampled.

This is the trick. Painting 50 buildings every frame at 60fps = laggy. Painting them ONCE to a cache, then drawing the cache = smooth.

## The 5 painter rules (a checklist)

For every new theme, before painting:

- [ ] **Depth:** is there a clear far / mid / near plane?
- [ ] **Lighting:** what's the single lighting direction or color treatment that unifies the scene?
- [ ] **Foreground / midground / background separation:** is the foreground visibly darker than the midground, which is visibly darker than the background? (Or whatever your atmospheric perspective dictates.)
- [ ] **Color palette:** maximum 5 hue families per scene. Pick 'em up front.
- [ ] **Atmospheric perspective:** is there haze / desaturation in the back?
- [ ] **Stylized shapes:** are the silhouettes simple enough to read at 320 px wide? (Most painters over-detail.)
- [ ] **Readable gameplay space:** when the player is at game y=120, is there a quiet zone behind them?
- [ ] **No clutter behind the player:** detail is concentrated in dead zones. The action plane is "loud," the background is "quiet" relative to it.

## Color palette guidelines

Pick a tight palette per scene. Examples from this project:

**Cyber-night (Adventure City):**
- Deep navy `#0a1422`
- Mid-purple `#2e1e58`
- Magenta accent `#ff4dab`
- Cyan accent `#46f0ff`
- Warm window glow `#ffd23a`

**Forest (Day 3-2):**
- Mid-green `#2c4a2d`
- Highlight green `#7eb86a`
- Brown trunks `#5a3220`
- Sky pale-cyan `#a8d5e8`

Rule: **2 base hues + 2 accents + 1 highlight = 5 colors.** Less = boring. More = noisy. Stick to 5.

## Prompt formulas for generating future backgrounds

When asking an AI image tool (ChatGPT image, Midjourney, PixelLab) for a background, use these templates.

### Template A — "Cinematic side-scrolling background" (one-screen)

```
A side-scrolling 2D platformer background, 16:9 aspect ratio, [SETTING],
rendered in pixel art style at 320x180 native resolution upscaled 4x.
Five-layer parallax composition:
- Far layer: [SKY/HORIZON ELEMENT], hazy, desaturated, no detail below 2 px,
  occupies top 60% of frame
- Mid layer: [LANDMARK / SKYLINE / TREELINE], saturated, recognizable
  silhouettes, occupies middle 40% with strong silhouette
- Near layer: [FOREGROUND ELEMENT], near-black with rim lighting, occupies
  bottom 25% but does NOT cover the gameplay zone (middle horizontal band y=80 to y=140)
- Lighting: [DIRECTION + COLOR], with [WARM/COOL] vignette
- Color palette: limit to 5 hue families: [LIST 5]
- The middle horizontal band (where the player will run) MUST be visually
  quieter than the top and bottom — push detail to the dead zones
- No enemies, no characters, no UI — environment only
- Style reference: [GAME NAME WITH SIMILAR LOOK]
```

### Template B — "Continue this background to the right"

```
Continue this background image seamlessly to the right [ATTACH IMAGE].
The new panel should:
- Match the same lighting direction, palette, and atmospheric perspective
- Continue any midground silhouette so the join is smooth
- Use the SAME 5-color palette
- Introduce ONE new visual element to keep variety [SPECIFY: a new building
  shape, a vehicle, a sign] — but keep style consistent
- Same aspect ratio, same render scale
- The leftmost ~10% of the new panel should match the rightmost ~10% of
  the existing panel for seamless joining
```

### Template C — "Parallax layer isolated" (for asset packs)

```
Generate ONE layer of a parallax background, transparent background PNG.
This is the [FAR/MID/NEAR] layer of a [SETTING] scene.
- Far layer: [PROMPT for far elements only]: hazy distant mountains / city skyline / clouds
- Output: PNG with alpha, [DIMENSIONS], transparent areas where other layers will fill in
- Style: pixel art at 320 native resolution upscaled, palette of [5 COLORS]
- No characters, no foreground vegetation
```

## How to prompt image AIs for *better* backgrounds

The single biggest unlock with ChatGPT-image / Midjourney / Sora / similar:

**Stop asking for "a beautiful background." Start asking for "a STAGED background designed for gameplay readability."**

Specifically:

1. **Tell it the aspect ratio.** "16:9" not "wide." "320×180 source pixel art" not "small pixel art."

2. **Tell it the parallax depth structure.** "Far / mid / near with atmospheric perspective." Most AIs will skip this if you don't ask.

3. **Tell it where the player goes.** "The middle horizontal band y=80 to y=140 should be visually quieter — keep detail in the sky and underground areas." This is the single most-skipped instruction and the source of "beautiful but unusable" output.

4. **Lock the palette.** "5 colors: [hex list]." Generic prompts produce 50-color outputs that don't match your other scenes.

5. **Reference a game by name.** "Style of Hollow Knight backgrounds." "Style of Celeste backgrounds." Vague style prompts produce vague results.

6. **Ask for a layered file or per-layer renders.** A single flat PNG = you re-cut it. Per-layer renders save hours.

7. **Iterate by editing, not by re-generating.** Once you have a decent base, ask for "the same image but with X changed." Re-generating loses palette.

## Style direction recommendations for common settings

### Adventure / cyber city
- Atmosphere: night, neon, soft fog
- Palette: deep navy + magenta + cyan + warm yellow windows
- Foreground: near-black architecture silhouettes
- Avoid: too many simultaneous neon colors, "vaporwave" pink-purple-only

### Jungle / forest
- Atmosphere: layered canopy with light shafts
- Palette: 2 greens (mid + highlight) + brown trunks + sky tone
- Foreground: hanging vines, broad leaf silhouettes
- Avoid: every leaf detailed; broad shapes work better at low res

### Solarpunk / utopian
- Atmosphere: warm gold + green plant overlays + clear sky
- Palette: warm green + gold + cream + soft blue sky + plant-flower accent
- Foreground: vines climbing buildings, soft architectural curves
- Avoid: cold tech aesthetic; solarpunk is *warm*

### Biblical / spiritual / "Sunday school adventure"
- Atmosphere: soft warm light, sky-as-blessing, naturalistic
- Palette: warm sand + sky blue + olive green + accent gold
- Avoid: anything that reads as fantasy magic (sparkles, ethereal beams). Stay grounded.
- Avoid: dark / scary aesthetics; keep it bright and inviting

### Space / cosmic
- Atmosphere: deep field with rim-lit nebulae
- Palette: deep navy + 2 nebula colors (one cool, one warm) + star white
- Foreground: dark planet silhouettes or asteroid debris
- Avoid: rainbow nebula; pick 2 hues only

### Kid-friendly platformer general
- Always: high color contrast, bright accents, rounded shapes
- Always: silhouette readability for player + enemies
- Avoid: muddy mid-tones that compete with character sprites
- Avoid: high-frequency detail in the gameplay band

## When backgrounds look beautiful but break gameplay

Symptoms:
- Player sprite "disappears" against the background mid-jump
- Enemies are hard to spot until the player is on top of them
- Pickups blend into decoration
- Players say "too busy" or "I can't tell what's happening"

Fix order:
1. Reduce contrast / detail in the gameplay band (middle 50% vertical)
2. Add a foreground silhouette layer at high opacity
3. Increase player sprite outline / rim lighting
4. Desaturate background colors

If after all 4 it's still wrong: throw the background out, restart with the production rules above.

## What we shipped vs. what we should have shipped

**What we shipped:** procedural backdrops for stages 1–7, painted backdrops for the lab + title + Adventure City.

**What we should have shipped:** painted backdrops for *every* stage, each with the cyber theme's layered painter approach. Procedural is fine for prototypes; painted is what makes a game feel finished.

**Recommendation for next game:** treat every level's backdrop as a painted scene with 3–5 parallax layers, painted into cached canvases, drawn at 60fps via image blits. Build the painter helper once, reuse it for every scene.
