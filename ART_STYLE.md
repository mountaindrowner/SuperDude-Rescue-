# Super Dude Danny — Adventure City Pixel Art Style Guide

> **Authoritative reference for the cyber-theme look + the master
> formula future passes should replicate.** Mark called Layer 4
> (mid-city) a "masterclass" and wants this approach extended to
> everything. If you are touching the Adventure City stage, read this
> first.

This file lives next to `CLAUDE.md`. If something in here changes,
update both.

---

## 1. The 5-layer parallax structure

Mark thinks in 5 layers, front-to-back. Code mirrors this with cached
canvases + a dispatch sequence in `drawSky_cyber` (scenes.js).

| Mark's # | Code name | Painter | Cache canvas | Parallax (X / Y) | Rendered when |
|---|---|---|---|---|---|
| **1** | foreground | `_cyPaintForeground` + `_cyPaintFgAnchor` | 960×180 | 0.70 / 1.00 | AFTER entities, BEFORE HUD (via `FOREGROUNDS` registry in scenes.js). |
| **2** | road/street | tile sprites `paintRoadTop_cyber` + `paintRoadBody_cyber` (sprites.js) + spawn data in `level_8_1.js` + procedural street furniture from `_cyDrawStreetFurniture` | n/a (tiles) | 1.00 / 1.00 (world geometry) | World tiles draw between sky and entities. |
| **3** | shop row / "bridge" | `_cyPaintBridge` | 960×240 (taller so it covers when camera scrolls up) | 0.50 / 0.50 | Inside `drawSky_cyber`, after mid + monorail. |
| **4** | mid-distance city | `_cyPaintMid` | 960×180 | 0.25 / 0.25 | Inside `drawSky_cyber`, after far. |
| **5** | far skyline | `_cyPaintFar` | 960×180 (with 2.4px blur applied during build) | 0.10 / 0.10 | Inside `drawSky_cyber`, after the sky gradient + clouds + sun + airship. |

Sky gradient + clouds + sun are NOT cached — they paint per-frame at
the top of `drawSky_cyber`. Sky is screen-static (no parallax).

All cache canvases are built once in `_cyBuild()` (scenes.js) and
re-blitted per frame.

---

## 2. Color palette — the 10-tone deep solarpunk set

**No pastels.** Pastels read as washed-out under the global multiply
darken pass. Every body color must hold up under multiply.

The mid-city building-tone picker (`_cyPaintMid` line ~2840) rotates
across 10 tones. Cream + warm-brown dominate by frequency for cohesion;
the accents punch through.

```
warm cream      body=#D6BD8E  shade=#8A6D40  hi=#F0DEB0
warm ochre      body=#B89066  shade=#7A5A38  hi=#D8B080
deep teal glass body=#5A8590  shade=#2C4858  hi=#88B0B8
coral           body=#D87060  shade=#8A3838  hi=#F4A088
rich peach      body=#E89860  shade=#A05828  hi=#FFC088
deep lavender   body=#806CA0  shade=#4A3868  hi=#A892C0
forest mint     body=#6A9878  shade=#365844  hi=#90C098
saturated rose  body=#D078A0  shade=#883858  hi=#F0A0C8
```

Foreground anchor palette (`_cyPaintFgAnchor`) picks one of 3 DARK
tones — these are the deepest in the scene:

```
deep teal-slate body=#3F5670  shade=#243648  hi=#5F7894
warm dark brown body=#7A5D44  shade=#4A3826  hi=#A0825E
charcoal grey   body=#3D3F4A  shade=#22232C  hi=#5E6173
```

Leaf / blossom / window accents (defined in `_CYP` palette object,
scenes.js near `function _cyRng`):

```
leafDkr  #1F4B2A    leafDk   #2F7D4F    leafMid  #65B95F    leafLt #A6E86F
blossom  #F8B0E0    blossomDk #F284C0    bark     #8C5A3A
warmWin  #FFB860    warmWinH #FFE4A0    coolWin  #5AB8E8   coolWinH #9AE0FF
outline  #1A1E2A    outlineD #0E1422
```

Neon glyph palette (5 colors, picked per sign):
```
pink   #FF4FA8     cyan   #5AE8FF     yellow #FFD23A
orange #FF8A40     lime   #A0F060
```

---

## 3. Brightness inversion (atmospheric perspective)

**The single most important principle.** Mark's reference images all
follow this and our gold-standard Layer 4 follows this:

- **Far** = pale + near-white + low contrast → recedes
- **Mid** = saturated body tones with controlled lit windows
- **Foreground** = DARK body silhouettes with VIVID neon + glowing
  windows → contrast hard against the pale sky

Implementation: the `_cyDrawShaders` MULTIPLY-DARKEN pass at the end
of the shader stack halves brightness on everything BEHIND the
foreground. Foreground draws AFTER the shader pass, so it keeps full
saturation. The result is a punchy near/far split.

Don't ever flip this. Distance = brightness, proximity = darkness.

---

## 4. Per-building paint stack (THE Layer-4 formula)

This is the order `_cyPaintMid` walks for every building. Replicate
this stack on any new building painter (foreground anchors, shop
variants, far towers' nearest tier).

Order matters — later passes draw on top.

1. **Silhouette body** — solid fill rectangle in the picked body tone.
2. **Silhouette variant** (~25% each: rounded top corners / tapered
   top / stepped setback / square — chosen by `Math.floor(rng()*4)`).
3. **Side shading + base shadow** — 1-px shade-color column on the
   left, 1-px hi-color column on the right, shade band at the bottom,
   hi line at the top.
4. **Panel seams** (`_cyPanelSeams`) — sparse horizontal divider lines
   in shade color, every ~10 px down the facade, with rivet
   highlights every 14 px.
5. **Window grid** (`_cyDrawWindowGrid`) — picks one of 4 styles per
   building (seeded by `(x*13 + y*7) & 0xff`):
   - **Glass curtain wall** (~25%): vertical bright glass strips +
     horizontal cream floor slabs + warm-window floor accents.
   - **Mostly-dark contrast silhouette** (~25%): sparse warm windows
     punching out of a dark facade.
   - **Feature floors** (~22%): 2-3 wide bright bars on full-width
     floors, alternating warm/cool, sparse dim windows elsewhere.
   - **Standard grid** (~28%): proper paned windows with frames +
     sashes + bright highlight on top.
6. **Rounded corners** (`_cyRoundCorners`) — chip the top corners
   with a 1-px AA pixel so the silhouette doesn't read as a perfect
   rectangle.
7. **Vertical garden** (~12%) — entire facade covered in leaf-tone
   texture + scattered blossoms + warm windows poking through. Skips
   the standard balcony / pipe / sign treatment.
8. **OR** standard cascading vine + side solar array (one or the
   other on non-vertical-garden buildings).
9. **Vertical neon sign** (~38%) — kanji-style glyph stack on one
   side. See section 5.
10. **Balcony shelves** with cascading planter foliage (~55%, 2-4
    shelves per facade). See section 6.
11. **Warm window glow halos** (~30%) — soft 6×6 yellow glow around
    2 random window positions + bright lit center pixel.
12. **Side pipe with joints** (~35%) — 1-px vertical pipe down one
    side, with 2-px-wide joint bands every 14 px.
13. **Rooftop ornament** (`_cyDrawRooftop`, 6 variants):
    - Roof garden (`_cyDrawRoofGarden`)
    - Solar canopy (`_cyDrawSolarCanopy`)
    - Domed observatory roof
    - Cherry blossom tree (`_cyDrawCherryRoof`) — pink focal accent,
      ~14% rate
    - Planter shelf + shrubs
14. **Billboard ad panel** (~12%) — 3 ad styles:
    - **Anime portrait**: hair + face + cheek blush + outfit +
      tagline text bar.
    - **Product / logo**: bright color block + centered glyph + text
      bars.
    - **Scrolling kanji panel**: dark bg + bright glyph grid.
    All ads have a soft white glow halo + support struts.
15. **Sky-bridge to previous tower** (if adjacency conditions met:
    gap <40px, height diff <20px). Two visual variants depending on
    gap width: short cream walkway with teal-glass inset, OR long
    teal-glass tube bridge with cascading vine drape underneath.

---

## 5. Neon sign formula

Every vertical neon sign follows this template (`_cyPaintFgAnchor`
in scenes.js + the mid-city sign block):

```
Panel: 6 × N dark slab (#0A0E18), width 6, height = building height - 20.
Halo:  same shape extended +3px on all sides, filled with the chosen
       neon color at 0.22-0.30 alpha (foreground = higher).
Glyphs: 4×4 cell stack, one cell every 6 or 8 pixels vertically.
        Each cell paints 1-3 fillRect chunks giving a glyph silhouette.
        6 glyph templates rotate procedurally (gear / block / dual-vert
        / cross / solid / O-shape).
Highlight: single white pixel at the top-left of each glyph.
```

Always pick the neon color from the 5-color palette in section 2.
Foreground anchor signs use longer 4×8 cells; mid-city signs use
smaller 4×6 cells + dimmer halos so the layer recedes.

---

## 6. Cascading planter foliage pattern

The signature look on every balcony shelf:

```
Shelf:     2-px shade-color band + 1-px hi-color highlight on top.
Railing:   1-px outline bar + vertical rivets every 3 px (2 px tall).
Foliage:   trails of _CYP.leafDk hanging down, length 3-6 px, spaced
           every 3 px across the shelf width. (length varies via
           `((pf*13 + balY*7) & 3)`.)
Highlights: _CYP.leafMid pixels every 4 px on the trails.
Tips:      _CYP.leafLt at center, occasional pixel.
Blossoms:  _CYP.blossom dots at random shelf-end positions, on every
           other balcony.
```

---

## 7. Shader stack (the dynamic lighting pass)

`_cyDrawShaders` runs at the END of `drawSky_cyber`, after all four
cached layers blit. Layered Canvas-2D compositing simulates
god-rays + grading + bloom without GPU shaders. Order matters
because each blend mode reads the running pixel values.

| # | Effect | Composite | Notes |
|---|---|---|---|
| 1 | Warm sun-side grade | `screen` | Radial gradient from sun position, breathes slowly via t. |
| 2 | Cool shadow grade | `multiply` | Linear gradient lower-left to upper-right, subtle teal tint. |
| 3 | God rays | `screen` | 5 soft diagonal beams emanating from the sun, each with its own slow angular drift + alpha pulse. |
| 4 | Sun flare + 4-point starburst | `screen` | Radial bloom on the sun + cross-shaped arms with slight length oscillation. |
| 5 | Volumetric mist drift | normal | Slow-moving translucent horizontal bands across the mid-city band. |
| 6 | Window light breathe | `screen` | Subtle warm pulse on the y=102-148 band so lit windows feel alive. |
| 7 | Soft vignette | `multiply` | Radial darkening at corners (subtle). |
| 8 | **Global multiply darken** | `multiply` | **THE brightness lever for Layers 2-5.** Deep blue-grey vertical gradient halves brightness while cooling shadows. Applied LAST so it grades everything that came before. Foreground layer draws AFTER (separate function) and stays at full value. |

`drawForeground_cyber` adds two more passes that DO affect the
foreground:

| # | Effect | Composite |
|---|---|---|
| 9 | Glass curtain glint sweep | `screen` |
| 10 | Cinematic contrast crush | `soft-light` |

---

## 8. Code map for future sessions

All in `js/scenes.js`.

| What | Where |
|---|---|
| Palette object | `var _CYP` near `function _cyRng` |
| Seeded RNG | `_cyRng(seed)` |
| Color helpers | `_cyMix(a, b, t)`, `_cyHex(r, g, b)` |
| Rounded corner chip | `_cyRoundCorners(g, x, y, w, h, shade)` |
| Panel seams + rivets | `_cyPanelSeams(g, x, y, w, h, shade, hi)` |
| Far skyline painter | `_cyPaintFar(g)` |
| Mid-city painter | `_cyPaintMid(g)` |
| Shop / bridge painter | `_cyPaintBridge(g)` |
| Foreground painter | `_cyPaintForeground(g)` + `_cyPaintFgAnchor(g, x, rng)` + `_cyPaintFgKiosk(g, x, rng)` |
| Cherry blossom tree | `_cyDrawCherryRoof(g, x, baseY, w, rng)` |
| Roof garden | `_cyDrawRoofGarden(g, x, baseY, w, rng)` |
| Solar canopy | `_cyDrawSolarCanopy(g, x, baseY, w)` |
| Rooftop dispatcher | `_cyDrawRooftop(g, x, baseY, w, idx, rng)` |
| Window grid + style picker | `_cyDrawWindowGrid(g, x, y, w, h, palette, density)` |
| Greenhouse dome | `_cyDrawGreenhouseDome(g, cx, cy)` |
| Foreground branch | `_cyPaintFgBranch(g, x, y, dir, rng)` |
| Hanging sign | `_cyPaintHangingSign(g, x, y, rng)` |
| Café patio cluster | `_cyPaintFgCafePatio(g, x, rng)` |
| Cache builder | `_cyBuild()` |
| Per-frame sky orchestrator | `drawSky_cyber(g, camx, camy, prog, t)` |
| Monorail + train | `_cyDrawMonorail(g, camx, t)` |
| Shader pass | `_cyDrawShaders(g, camx, camy, t)` |
| Foreground orchestrator | `drawForeground_cyber(g, camx, camy, prog, t)` |
| Street furniture overlay | `_cyDrawStreetFurniture(g, camx, camy, t)` |

Tile sprites for the road live in `js/sprites.js`:
`paintRoadTop_cyber` + `paintRoadBody_cyber` + `paintBrick_cyber` +
`paintPlatform_cyber`.

NPC placeholder painters: `paintNPC_computer`, `paintRescuer`.

---

## 9. When extending the style

- Pick a deep palette tone from section 2 — never invent a new pastel.
- Walk the per-building stack in section 4 in order. Skip individual
  passes but don't reorder.
- Every horizontal architectural element (shelf, railing, balcony,
  awning) needs cascading foliage somewhere on the facade.
- Distance = brightness, proximity = darkness. Test your change by
  visually comparing far / mid / foreground in a clean cityArrival
  screenshot. If far looks darker than mid, you've inverted it.
- The shader pass is calibrated against the current scene tone. If
  you add a major new bright element to the background, the
  multiply-darken stop colors in `_cyDrawShaders` Pass 8 will need
  rebalancing.
- Run `node /tmp/v_tour.js` (the puppeteer tour harness) to capture
  the cityArrival + 5 in-game camera positions for visual diff.
