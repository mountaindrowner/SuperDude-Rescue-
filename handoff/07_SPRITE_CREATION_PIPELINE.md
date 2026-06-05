# 07 — Sprite Creation Pipeline

## The fundamental rule

**Decide your sprite frame size before you generate a single sprite.**

This sounds obvious. We didn't do it. Every PixelLab-generated sprite came back at a slightly different aspect, bbox, and feet position. We measured each one post-hoc and stored the measurements in a giant `PL_BBOX` lookup table. That table is the scar.

## The master character sheet (build this BEFORE animation)

Before generating any animation, you need ONE reference image: the **character sheet**. It defines:

- **Canonical frame size** (e.g., 32×32)
- **Anchor / origin point** (where x,y "is" — usually the feet centerpoint)
- **Visual bounding box** (where the visible art lives within the frame)
- **Collision bounding box** (smaller than visual — what tile-collides)
- **Color palette** (5–8 colors, locked)
- **Proportions** (head : torso : legs, e.g., 1 : 1.5 : 2)

Put this on a single PNG with a 1-px grid overlay and labels. Reference it for every generation.

### What our character sheet should have looked like

```
+---32px---+
|          |
|   ##     |  ← head (y=4-12)
|   ##     |
|  ####    |  ← torso (y=12-22)
|  ####    |
|   ##     |
|   ##     |  ← legs (y=22-28)
|  #  #    |
|  #  #    |  ← feet anchor: bottom-center (x=16, y=30)
+---------+
   anchor: (16, 30)
   visual bbox: (10, 4) to (22, 30) — 12×26
   collision bbox: (12, 6) to (20, 30) — 8×24 (centered, slightly tighter than visual)
```

Every animation frame fits inside this. Every feet position is at y=30. Period.

## Animation rows / columns convention

Pick ONE convention and stick with it.

**Recommended: row-per-animation, columns-per-frame.**

```
                col0    col1    col2    col3    col4    col5    col6    col7
row 0 idle      [f0]    [f1]    [f2]    [f3]    [-]     [-]     [-]     [-]
row 1 walk      [f0]    [f1]    [f2]    [f3]    [f4]    [f5]    [-]     [-]
row 2 run       [f0]    [f1]    [f2]    [f3]    [-]     [-]     [-]     [-]
row 3 jump      [f0]    [f1]    [f2]    [f3]    [f4]    [f5]    [f6]    [f7]
row 4 hurt      [f0]    [f1]    [f2]    [f3]    [-]     [-]     [-]     [-]
row 5 attack    [f0]    [f1]    [f2]    [f3]    [-]     [-]     [-]     [-]
```

In code:

```js
function getFrame(animRow, frameIndex) {
  return {
    sx: frameIndex * FRAME_W,
    sy: animRow * FRAME_H,
    sw: FRAME_W,
    sh: FRAME_H
  };
}
```

Constant. Predictable. Easy to extend.

### Why row-per-animation matters

If you do column-per-animation instead (one column = idle, next column = walk), adding a new animation requires re-cutting every existing image. Row-per-animation = add a new row at the bottom, done.

## What animations does a typical platformer character need?

In order of "you must have this" to "nice to have":

1. **Idle** (4 frames) — standing, gentle breathing
2. **Walk / run** (6 frames) — cyclic
3. **Jump** (3 frames: ascending, apex, descending)
4. **Fall** (1 frame — reuse jump's last frame is OK)
5. **Hurt** (2 frames — flash)
6. **Die** (4 frames — slump to ground)
7. **Land** (2 frames — squash + recover) — adds a lot of game feel
8. **Climb** (4 frames — for vines, ladders, etc.)
9. **Swim** (4 frames — if water)
10. **Attack / interact** (4 frames — context-dependent)
11. **Celebrate** (4 frames — for victory)

**Minimum viable platformer character: idle + walk + jump + hurt = 4 animations, ~15 frames total.** Don't generate the others until you need them.

## Keeping a character consistent across animations

When generating animations with PixelLab or any AI tool:

### 1. Provide the character sheet as a reference image every single time

Don't trust the AI to "remember" the character. Every animation request must include the character sheet.

### 2. Lock the prompt prefix

Same prompt prefix for every animation:

```
A 32x32 pixel art character: [DESCRIPTION FROM CHARACTER SHEET].
Render the [ANIMATION NAME] animation, [FRAMES] frames, left-to-right
sequence on a single horizontal strip.
Character must:
- Stay within 32x32 frame per cell
- Feet at y=30 (bottom-center anchor)
- Match the exact color palette: [5 HEX]
- Match the proportions: head=8px, torso=10px, legs=8px
- Match the silhouette of the reference character sheet
- NEVER change pose dramatically — only the limb positions move
```

### 3. Reject obvious drift

If the generated frame has the head 2 px taller than the reference, reject it. Don't ship it. Re-generate or hand-fix.

### 4. Pixel-level cleanup is mandatory

Almost no AI-generated sprite is pixel-perfect on first generation. Expect to:
- Re-align the feet baseline (eyeballed feet often drift ±2 px)
- Erase stray anti-aliased pixels (most AI tools sneak in 16-bit-style sub-pixels even when asked for 8-bit)
- Snap the palette (re-quantize to your 5-color list using a script or Aseprite's color-replace tool)
- Re-time the animation (AIs often give you the right frames at the wrong sub-pixel positions)

**This cleanup is ~20–30 minutes per animation, even with good AI output. Budget for it.**

## Avoiding chibi when you want action-hero proportions

Almost every AI defaults to **chibi proportions** (big head, small body) when you say "pixel art character." Chibi reads well at very small sizes (8×8, 16×16) but feels childish at 32×32+ for an action hero.

**Action-hero proportions:** head : torso : legs ≈ 1 : 1.5 : 2. Head is the smallest body section.

**Chibi proportions:** head : torso : legs ≈ 1 : 0.7 : 0.5. Head is the largest body section.

To avoid chibi:
- Explicitly state proportions in the prompt: "1:1.5:2 head:torso:legs"
- Provide a reference of a non-chibi character (e.g., Mega Man, Mario, Celeste's Madeline)
- Reject and re-generate when chibi shows up

## Tools

### PixelLab.ai (what we used)

**Strengths:** generates 4 and 8-directional sprites, animation variants, consistent style within a single character. Useful for prototypes and concept-acceleration.

**Weaknesses:** alignment / feet baseline drifts between animations. Color palette drifts slightly between batches. Requires bbox measurement post-generation. Subscription-based pricing.

**Best for:** generating the *first version* of a sprite set, especially when you need 8 directions. Manual cleanup mandatory.

### Aseprite ($20, one-time, gold standard)

The pixel-art tool. Use it for:
- Cleaning up AI-generated sprites
- Drawing original sprites by hand
- Animation timeline editing
- Color palette management
- Exporting per-frame PNGs or sprite sheets with `.json` metadata

**Strongly recommend** owning Aseprite from day 1 of the next project. The integration with sprite generation is the missing step we kept improvising around.

### Piskel (free, browser-based)

Decent for very basic editing. Aseprite is meaningfully better. Use only if Aseprite isn't an option.

### Hand-drawing in Photoshop / Procreate

Workable, but the pixel-art-specific tools (palette quantization, per-frame timeline, onion-skinning, tile preview) make Aseprite faster.

## Cleanup process after AI generation

For every AI-generated sprite, run through this:

1. **Open in Aseprite.**
2. **Trim the frame to canonical size** (32×32 or whatever). Crop unnecessary padding.
3. **Re-align the feet.** Use the reference grid. Move the entire frame down/up so feet are at y=30.
4. **Color-replace.** Use the canonical palette. Drop any off-palette pixels.
5. **Remove anti-aliased pixels.** Hard-quantize to no in-between pixel colors.
6. **Compare frame-to-frame.** Step through the animation. Does anything jump or drift unnaturally? Fix.
7. **Test in-engine.** Place it. Walk it. Does it look right when scrolling?
8. **Export.** PNG sprite sheet + JSON metadata (frame sizes, anchors, animation rows).

Budget ~20 minutes per animation for cleanup.

## Prompt templates for action-hero pixel sprites

### Template — Master character sheet (do this first)

```
Generate a master character sheet for a 32x32 pixel art action hero,
classic Mega Man / Mario style.

Output: a single image, 32x32, showing the character in IDLE pose,
facing right.

Requirements:
- Frame size: exactly 32x32
- Feet anchor: bottom-center (x=16, y=30)
- Head: top-center, occupies y=4 to y=12 (8 px tall)
- Torso: y=12 to y=22 (10 px tall)
- Legs: y=22 to y=30 (8 px tall)
- Proportions: 1:1.5:2 head:torso:legs (action hero, NOT chibi)
- Color palette: exactly 5 colors: [LIST 5 HEX]
- Black 1-px outline around the character silhouette
- Visible eye(s), visible feet, recognizable silhouette
- Style reference: Mega Man X sprite proportions
- NOT chibi, NOT cute, NOT mascot-style
```

### Template — Walk animation (after master sheet is locked)

```
[ATTACH MASTER SHEET as reference]

Generate a WALK animation for this exact character.

Output: a horizontal sprite sheet, 6 frames left-to-right, each cell 32x32.

Requirements:
- Use the exact character from the reference image
- Match the palette, proportions, outline
- 6 frames of walk cycle (right-facing, will be flipped horizontally for left)
- Feet anchor at y=30 in every frame
- Sprite center stays at x=16 in every frame — character does NOT drift
  horizontally within its frame
- Walk cycle: foot-down, foot-passing, foot-extended, foot-down (other foot)…
- Bounce: head moves up 1 px on passing frames, down on contact frames
- Arms swing opposite to legs
- Frame timing: 8 frames per cycle at 12 fps = 0.5 second cycle
```

### Template — Jump animation

```
[ATTACH MASTER SHEET as reference]

Generate a JUMP animation for this character.

Output: horizontal sprite sheet, 3 frames left-to-right:
Frame 1: crouch / pre-jump (feet planted, knees bent, ready to launch)
Frame 2: airborne ascending (arms up, legs tucked)
Frame 3: airborne descending (arms down, legs extended)

Requirements:
- Use the exact character from the reference image
- Match the palette, proportions, outline
- Frame size: 32x32 per cell
- Feet anchor at y=30 for grounded frames; airborne frames center anchor at y=24
- This is a SMALL jump (game-feel "controlled hop"), NOT a heroic backflip
```

## Common sprite mistakes

| Symptom | Cause | Fix |
|---|---|---|
| Player jitters horizontally during walk | Sprite center drifts in each frame | Re-center every frame to the same x in the canvas |
| Player drifts vertically during walk | Inconsistent feet baseline | Re-align each frame to feet-at-y=30 |
| Bad transparency / halos around sprite | Anti-aliased pixels | Hard-quantize, re-do edge pixels |
| Sprite "swims" through the air | Frame timing too slow or too uneven | Use consistent ms-per-frame (typically 80–120 ms) |
| Player feels small / weak | Proportions are chibi | Re-prompt for action-hero proportions |
| Player feels too cluttered | Too many colors, too much detail | Reduce to 5 colors, simplify silhouette |
| Inconsistent across animations | Each animation was prompted fresh | Always include master character sheet as reference |
| Feet misaligned with ground tiles | Visual feet ≠ collision baseline | Set collision feet baseline to exact tile-y in code |
| Sprite has wrong palette | Each generation pulls slightly different colors | Hard-quantize every output to the locked palette |

## Sprite implementation checklist

Before declaring a sprite "imported":

- [ ] Frame size matches canonical size
- [ ] Feet baseline at canonical y (e.g., y=30)
- [ ] Sprite center at canonical x (e.g., x=16)
- [ ] Palette quantized to canonical 5 colors
- [ ] Transparency is binary (alpha 0 or 255, no in-between)
- [ ] Visual bbox documented in metadata
- [ ] Collision bbox documented in metadata (usually smaller, centered)
- [ ] Animation row / frame index documented
- [ ] Frame timing (ms per frame) documented
- [ ] Tested in-engine at multiple positions
- [ ] Tested adjacent to other sprites (no visual jarring transitions)
- [ ] Tested with backgrounds (silhouette reads clearly)
- [ ] Stored as PNG sprite sheet + JSON metadata (not in code)

## Recommendation for the next project

1. **Build the master character sheet first.** Don't generate animations until the sheet is locked.
2. **Pick a canonical frame size and never deviate.** 32×32 is a great default.
3. **Use Aseprite for cleanup.** Budget time for cleanup like budget time for code.
4. **Use AI for concept acceleration, not finished assets.** AI gets you to 80% in 5 minutes. The remaining 20% is hand-cleanup, and it's worth it.
5. **Store sprites as sheet + JSON metadata,** not as code constants.
