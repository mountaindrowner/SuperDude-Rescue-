# ASSET QUALITY PIPELINE — FORMALIZED RULE + FLAT-PRIMITIVE PUNCH LIST
## Mother-session deliverable for MOTHER_SESSION_BRIEFS §3
*Formalizes Mark's rule: "nothing visible in-run reads as a FLAT PRIMITIVE." Ties together the
existing generate-big pipeline (shipped gems + resizer bolt), the code-drawn FX layer idea, the
COMPENDIUM palette, and the screenshot harness. Additive; protects all shipped art.*

---

## §0 — THE PRINCIPLE (one line)

Cohesion is the whole game's look (per the VS teardown: everything at the same fidelity, pulling the
same direction). **A single flat-color shape breaks it louder than any good asset can fix.** So every
visible element earns depth by one of exactly two paths (§1). Nothing ships as a raw fill.

---

## §1 — THE RULE (formalized) — two paths, one decision

**Decision tree — for any visible element, ask "does it scale / animate / tint dynamically?"**
- **NO → it's an OBJECT** (pickup, icon, thrown-food projectile, set piece) → **Path A: Generate big,
  ship exact** (§2).
- **YES → it's an EFFECT** (burst, ring, aura, trail, beam, nova, telegraph) → **Path B: The Layer
  Law**, code-drawn (§3). Generating frames for dynamic FX is wasteful *and* PixelLab is weak at the
  small, fast-changing shapes FX need.

Both paths obey: **16-color COMPENDIUM palette, light from top-left, and the screenshot gate (§6).**

---

## §2 — PATH A: GENERATE BIG, SHIP EXACT (objects)

The pipeline that already shipped gems + the resizer bolt, formalized:
1. Generate in PixelLab at **48–64px** (its strong size — it's weak ≤16px, so never generate native-tiny).
2. **Alpha-threshold** `a ≥ 90` (kill soft fringe).
3. **Content-crop** to the drawn pixels.
4. **Center on a square.**
5. **NEAREST-neighbor** downscale to the registry size (12/16/24…). Integer-friendly; snap to palette
   after if any stray colors appear (per the cleanup toolchain in the PixelLab playbook).
Use for: pickups (heart, magnet, bomb, coin, chest), distinctive thrown-food enemy projectiles
(tomato, soda can) if you want them to have character, the rescue cage, any new icon.

---

## §3 — PATH B: THE LAYER LAW (code-drawn FX)

**Minimum 3 layers, never a flat fill.** Build ONE reusable helper set (the FX equivalent of
`PC.labPanel`) so every effect gets depth for free. Proposed API in the `PC.` namespace:

```
PC.fxOrb(ctx, x, y, r, color, {glow})      // solid round bit (bolts, debris, drawn pickups)
PC.fxBurst(ctx, x, y, r, color)            // impact/hit spark
PC.fxRing(ctx, x, y, r, color, {width})    // telegraph / nova / aura / shockwave
PC.fxTrail(ctx, pts, color)                // projectile / grease / beam segment
```

**Layer recipes (what "3 layers" means per shape):**

*Solid bit (`fxOrb`, drawn pickups, debris):*
- **base** fill = mid palette color.
- **highlight** = lighter ramp step (hue-shifted toward yellow-white), a small cap offset **up-left**
  ~15% of radius.
- **occlusion** = darker ramp step (hue toward violet), a bottom-right crescent.
- optional 1px darker **rim** (the Konami outline). `glow:true` adds an additive halo — energy only.

*Ring / nova / telegraph (`fxRing`):*
- **edge** = bright thin stroke in the role color.
- **falloff** = radial gradient color→transparent (soft body, never a solid disc).
- **rim** = slightly darker outer edge so it doesn't dissolve into the ground.
- animate scale/alpha (pulse for telegraph, expand for nova).

*Burst / spark (`fxBurst`):*
- **flash** = bright core dot (white→color), additive.
- **spark** = 3–5 short radial quads in color, fading fast.
- optional **debris** = 2–3 tiny palette dots flung out.

All pooled and capped (perf law). This helper is built ONCE; every weapon/effect calls it.

---

## §4 — THE FLAT-PRIMITIVE PUNCH LIST (prioritized — the deliverable)

Ordered by **visibility × frequency**. ✅ = already real art (do NOT re-touch): heroes, D1 enemies,
icons, portraits, signature weapons, XP gems, resizer bolt.

### P0 — constant, central, seen every second (do first)
| Primitive | Now | Path | Notes |
|---|---|---|---|
| **Impact burst / hit spark** | flat/none | B `fxBurst` | highest-frequency thing on screen; every hit. Cyan (player) core. |
| **Enemy projectiles** (tomato, soda spit, seed spit, boss bullets) | flat | B `fxOrb` pink core+glow (generic) · A for characterful thrown food | must always read **PINK = threat** (color law). |
| **Player projectile bodies + muzzle flash + trail** | some flat | B `fxOrb`+`fxTrail` | cyan core+glow+trail; kills the "dot/box" shot look. |
| **Pickups: heart / magnet / bomb** | flat | **A** generate-big | reward grabs — juicy little objects; PixelLab handles at 48–64→downscale. |
| **Coin / gold + chest** (if still flat) | flat | **A** generate-big | frequent reward; the chest is a slot-machine moment — make it pop. |

### P1 — frequent, often large/translucent (upgrade next)
| Primitive | Now | Path | Notes |
|---|---|---|---|
| **Telegraph rings** (AoE previews) | flat ring | B `fxRing` | ketchup/cherry; pulsing edge + falloff, not a flat outline. |
| **Nova / shockwave** (Fridge, Microwave, Salt, nova weapons) | flat ring | B `fxRing` | expanding, edge-highlighted. |
| **Aura fields** (Salt, Grease zone, Pineapple retaliate) | flat disc | B `fxRing`/field | flickering translucent, **never a solid fill**. |
| **Pop puff** (enemy defeat → normal-food still) | flat circle | B `fxBurst` + sprite-swap | the puff mustn't be a flat blob; keep the food-still swap. |
| **Level-up burst** | flat | B `fxBurst` | celebratory radial — a peak-dopamine moment, make it sing. |

### P2 — less frequent / one-offs / HUD (upgrade last)
| Primitive | Now | Path | Notes |
|---|---|---|---|
| **Explosions** (Kevin airstrike bombs, boss) | flat/box | B multi-`fxRing`+debris+flash | per the airstrike VFX spec. |
| **Freeze shatter · vortex pull · retaliate spike · held beam** | flat | B per-weapon | each built from the helpers. |
| **Screen-clear flash · gold-fever glow** | flat | B | rare but screen-wide; make them feel like ultimates. |
| **HUD: XP bar fill, cooldown rings, damage numbers** | flat | B layer law | bars get base+highlight+shadow; damage numbers get an outline/shadow so they don't read flat (they're new — see the Phase 2.0 spec). |

**Recommendation:** ship the `PC.fx*` helper set FIRST (one task), then walk P0 → P1 → P2. The helper
converts most of the list mechanically — you're mostly swapping call sites, not authoring each effect.

---

## §5 — STYLE-LAW AMENDMENTS (add to COMPENDIUM.md)

1. **No-flat-fill law:** nothing in-run is a single flat color. Solid bits ≥3 layers
   (base + top-left highlight + bottom-right occlusion); rings/glows ≥3 (bright edge + soft falloff +
   darker rim). Enforced by the `PC.fx*` helpers.
2. **Color-role law** (from the VFX doc — make it canon): player shots **Cyan `#35d0ff`**, enemy shots
   **Pink `#ff9ecb`**, XP **Lime `#a8e04a`**, danger telegraphs **Ketchup/Cherry `#d93a3a`/`#ff6b6b`**,
   fire **Mustard→Cheese→Ketchup**, heal **Mint `#7dd97b`**. A *player* effect is never pink.
3. **Light from top-left, always.** Highlight up-left, occlusion bottom-right — generated AND code-drawn.
4. **Hue-shifted ramps:** highlights shift toward yellow-white, shadows toward violet — applies to
   palette ramps and to the layer helper's lighten/darken steps (not a flat lighten/darken).
5. **Additive glow = energy only** (cyan shots, comets, level-up). Objects (pickups) get NO additive
   glow — it washes them out and hurts readability.
6. **Small-object rule:** anything rendering **≤16px** on screen is hand-authored or generated-big-and-
   downscaled (Path A) — never generated at native ≤16px (PixelLab's weak zone).
7. **Screenshot gate is mandatory** (§6).

---

## §6 — ACCEPTANCE GATE (before any asset/effect commits)

Run the existing headless screenshot harness at **3x**, then check:
- [ ] **Not flat** — passes the layer law (≥3 layers / helper-built).
- [ ] **Silhouette test** — recognizable as solid black (objects).
- [ ] **Value test** — grayscale still reads; no extreme-contrast "AI-tell" flatness.
- [ ] **Actual-size test** — legible at true scale on a phone, not just at 3x.
- [ ] **Palette-legal** — only the 16 COMPENDIUM colors (+ ramp steps).
- [ ] **Color-role correct** — player cyan / enemy pink / XP lime / danger red / fire warm.

---

## §7 — GUARDRAILS

- **Additive & flagged.** Don't re-touch shipped real art (§4 ✅ list). Build the `PC.fx*` helpers as
  new code; behind a flag if it risks current rendering.
- **Perf law holds:** all FX pooled and capped; the helpers must be cheap (they run hundreds of times/frame).
- **Meter PixelLab:** Path-A generation calls `get_balance` first, reuses the style master + forced
  palette, batches small icons in the cheap lane.
- **One helper, everywhere.** Never hand-roll a bespoke flat effect — if it's not in `PC.fx*`, add it there.

*Deliverable complete: the formalized two-path rule, the layer recipes + reusable helper API, the
prioritized flat-primitive punch list (P0→P2), the COMPENDIUM style-law amendments, and the
screenshot acceptance gate. Hand to Claude Code as: build `PC.fx*` first, then clear the punch list.*
