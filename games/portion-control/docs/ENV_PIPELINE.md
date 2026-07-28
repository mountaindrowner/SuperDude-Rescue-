# ENVIRONMENT & CITY — THE NO-FLAT PIPELINE FOR THE BACKGROUND WORLD
## Applying the asset-quality rule to ground, roads, buildings, props — the city itself
*Companion to the Asset Quality Pipeline doc (which covered in-run FX/pickups). This is the
world-building half. Built on the existing `src/systems/ground.js` chunk painter + PixelLab
tiles/props in the atlas. Additive; protects the working chunk + collision system.*

---

## §0 — THE THING THAT MAKES CITIES LOOK FLAT

The world is a **hybrid**, and that's where flatness hides:
- **Composition = procedural Canvas 2D** (`ground.js` decides where roads, buildings, lawns, props go
  in 512×512 chunks).
- **Surface = PixelLab tiles/props** stamped from the atlas.

The trap: anywhere the painter draws a **bare `fillRect(color)`** — a gray road, a green lawn, a
building-colored box — that's a flat primitive at city scale. And the single worst offender is
**buildings drawn as flat collision boxes.** A city of flat rectangles is the "giant pink box"
problem wearing a trench coat. Fixing the world = making sure every surface is a *texture* and every
building is a *shadowed object*.

---

## §1 — THREE LAWS FOR THE WORLD

1. **Textures, not fills.** No surface is a flat Canvas color. Every ground/road/lawn is a real
   PixelLab **tile** (with detail) tiled + varied + decaled. The painter composites *textured tiles*,
   never a bare `fillRect`.
2. **Buildings are shadowed objects, not boxes.** Every building = real art (kit or sprite) + a **cast
   shadow** + top-left lighting. Collision (`PC.resolveCircle`) stays; the *visual* gets dimension.
3. **Controlled irregularity + depth lighting.** Tiled + zoomed-out reads as a real place only with
   variant tiles, scattered decals, and **consistent shadows/AO**. This is the environment version of
   the 3-layer law.

---

## §2 — GROUND & SURFACES (roads, lawns, plazas, the flood)

Mark's own instinct from way back: VS's grass is copy-pasted but *so high-detail you get away with it,
zoomed out*. That's the target — high-fidelity tiles that tile convincingly.

- **Every surface is a PixelLab tile set**, authored at high res (generate-big → downscale, so detail
  survives the zoom-out). Per surface: **base tile + 2 variants + 2 decal tiles.**
- **Roads are a KIT**, not a gray strip: asphalt base + variants, **curb/edge tiles**, **intersection
  pieces**, and decals (lane markings, crosswalk, manhole, cracks). Wang/edge tiles for clean seams.
- **Transitions** where lawn meets road meets plaza = edge tiles, never a hard flat seam.
- **Grounds sit 20–30% darker & desaturated vs. actors** (VS rule) so the food swarm pops against them.
- **The flood is told on the ground:** food-spill decals increasing in density per district (D1 light →
  D5 buried). This is world-building *and* it breaks up tile repetition — two jobs at once.

---

## §3 — BUILDINGS (the big fix)

Two approaches, use both:

**A) Building KIT (the generic city fabric) — few assets, endless variety.**
A building = a footprint rectangle the painter fills by compositing tiles:
- **roof-fill** tile (+ 1–2 variants),
- **roof-edge** tiles (N/E/S/W + 4 corners) for a clean silhouette,
- optional **facade strip** under the south edge (a sliver of wall + windows/door) so tall buildings
  show height in the slightly-angled top-down view,
- **cast shadow** (below).
The painter already places footprints for collision — now it stamps this kit onto them. **One kit →
thousands of unique buildings** (different sizes, roof variants, facades). Use PixelLab's building-kit /
Wang-tileset generators (the brief says they're ready).

**B) Bespoke landmark sprites (set pieces) — character where it counts.**
Whole-building PNGs for the places that matter: the lab, a diner, the church, a hero's HQ, the docks
crane. Generate-big, one per landmark. These are the "hero assets" for authored story maps (§6).

**The lighting law on every building:** top-left roof **highlight**, bottom-right roof/edge
**occlusion**, 1px darker **rim** — the 3-layer law, architectural edition. Collision footprint can be
simpler than the art (art overhangs; collision is the base).

---

## §4 — DEPTH LIGHTING: THE SINGLE BIGGEST LEVER

The one change that turns a flat top-down scene into a *place*: **consistent shadows + ambient occlusion, baked into the chunk paint.**
- **Cast shadows.** Every building and tall prop paints a soft, semi-transparent dark shadow offset
  toward **bottom-right** (opposite the top-left light), onto the ground layer, *before* the object.
- **Contact AO.** A subtle darkening where buildings/props meet the ground (a short gradient skirt) so
  they sit *in* the world, not *on* it.
- **Bake it.** Shadows/AO are painted into the cached chunk canvas — **zero runtime cost**, and they
  move correctly because the chunk is the world. No dynamic lights needed.

This plus the palette is 80% of "not flat" for the environment. A textured ground with correctly
shadowed buildings reads as a real city even if every individual tile is simple.

---

## §5 — PROPS & DECALS

- **Props = PixelLab objects** (generate-big): lampposts, benches, hydrants, cars, crates, market
  stalls, factory vats, lab servers. Each casts a shadow (§4). Scatter with **controlled irregularity**
  (variants + jittered placement) so a street isn't a repeating stamp.
- **Decals** (cracks, stains, road paint, the food-flood) are the cheapest anti-repetition tool and the
  main storytelling layer — lean on them heavily.

---

## §6 — THE PAINTER CONTRACT (procedural AND authored maps)

Formalize what a chunk may contain, so quality is identical whether the layout comes from noise or from
a hand-authored **region-map JSON** (the story-mode path in brief §2):

> A chunk is composited in this order: **ground tiles → ground decals → cast shadows → buildings/props
> → contact AO → overhead decals.** No layer is ever a bare `fillRect`. The region-JSON drives *layout*
> (zone types, building rects, prop/decal placement, landmark IDs); the SAME painter + SAME tiles/props
> render it. Authored maps additionally place **bespoke landmark sprites** at named points.

This means the story mode inherits every quality rule for free, and landmarks raise the ceiling only
where you author them.

---

## §7 — DISTRICT VISUAL IDENTITY (so the "background world" feels like real places)

The city shouldn't be one texture everywhere. Each district = a **palette tint + a signature tile set +
signature buildings/props**, so a glance says *where* you are:

| District | Ground | Signature buildings/props | Flood level |
|---|---|---|---|
| City Center | cracked asphalt/sidewalk | storefronts, lampposts, cars, hydrants | light |
| Market/Docks | dock planks + cobbles | stalls, crates, barrels, cranes, nets | moderate |
| Suburbs | grass + pavement | houses, fences, mailboxes, pools, grills | heavy |
| Food Factory | metal floor + grates | conveyors, vats, pipes, forklifts | heavy |
| Central Lab | lab tile w/ glowing seams | servers, tubes, consoles, the Resizer machine | maximum |

Same painter, same laws — different tile/prop/palette sets. That variety *is* the background world.

---

## §8 — PIXELLAB ENVIRONMENT ASSET LIST (per district)

Generate-big → alpha-threshold → content-crop → NEAREST to tile size. **`get_balance` first**, reuse the
style master + forced palette, batch in the cheap lane where possible.

| Asset group | Count per district | Size (author) | Notes |
|---|---|---|---|
| Ground tile set | base + 2 variants + 2 decals (5) | 64px → 32 | high detail; darker than actors |
| Road kit | base + 2 var + curb/edge (4) + intersection (2) + decals (3) | 64px → 32 | Wang edges for seams |
| Building kit | roof-fill + 2 var + 8 edge/corner + facade strip (12) | 64–96px | one kit → all generic buildings |
| Props | 8 | 32–96px | each casts a shadow |
| Decals (flood/cracks/stains) | 6 | varies | anti-repetition + story |
| Landmarks (authored maps) | 1–3 | 128–256px | bespoke set pieces |

Shadows/AO are **code-baked**, not generated. Everything obeys the 16-color palette.

---

## §9 — COHESION, PALETTE, ZOOM-OUT

- **Whole city on the 16-color COMPENDIUM palette**, district-tinted. Grounds darker/desaturated than
  actors. Hue-shifted ramps on tiles (highlights → yellow-white, shadows → violet).
- **Zoom-out = author tiles at higher res** so detail survives downscale (generate-big). This plays to
  PixelLab's strength at larger sizes and is exactly Mark's "high-detail tile you get away with."
- **Cohesion beats polish:** a consistent mid-fidelity city beats one gorgeous landmark surrounded by
  flat boxes. Bring everything to the same level first.

---

## §10 — PERFORMANCE (don't break the chunk system)

- Keep the **512×512 chunk cache** (~9–12 live canvases). Tiles/props come from the **single atlas** →
  batched draws.
- **Bake shadows/AO into the cached chunk paint** — free at runtime.
- Paint a chunk once on generation; only repaint on invalidation. Zoom-out means more world on screen →
  keep per-chunk paint cheap (tile stamps + decals, not per-pixel work).

---

## §11 — ACCEPTANCE GATE (environment)

Screenshot harness **at the real in-game zoom** (not 3x close-up — the city is *seen* zoomed out):
- [ ] No surface is a flat fill; every ground/road/lawn is a textured tile.
- [ ] Buildings read as 3D objects — cast shadow present, top-left lit, not a box.
- [ ] **Tiling test:** pan a full screen — repetition doesn't read as a grid (variants + decals working).
- [ ] **Contrast test:** actors clearly pop against the (darker) ground.
- [ ] District identity is legible at a glance.
- [ ] Palette-legal (16 colors); light from top-left everywhere.

---

## §12 — GUARDRAILS

- **Additive.** Don't rewrite the working chunk painter or `PC.resolveCircle` collision — extend the
  paint step to composite the kit + shadows. Feature-flag if it risks current rendering.
- **Collision unchanged.** Building art may overhang; the collision footprint stays as-is.
- **Meter PixelLab.** `get_balance` before generating tile/building/prop sets; reuse style master +
  forced palette; batch.
- **Region-JSON reuses the painter** — never a second rendering path.

*Bottom line for the city: make every surface a textured tile (not a fill), build generic buildings from
a kit + shadow them, hand-author a few landmark buildings for story beats, and bake consistent top-left
shadows/AO into the chunk paint. That last one — shadows — is the single biggest lever turning a flat
top-down grid into a real, dimensional city, and it's free at runtime.*
