# 08 — Bounding Boxes, Collisions, and Hitboxes

## The fundamental rule

**What the player sees and what the player hits are two different rectangles. Design them as two different rectangles from day 1.**

When they're the same rectangle, gameplay feels punishing — players hit corners they couldn't see, enemies hit them from "the side of the cape." The fix is to decouple visual size from collision size.

We retrofitted this for cars at v0.93 (collision box = 80% of visual size). It worked. It should have been the rule from day 1 for every entity.

## The 5 boxes that exist per entity

For any in-game object, there are potentially **5 different rectangles**:

1. **Visual sprite box** — the full image, including transparent padding
2. **Visual content box** — the painted pixels only (visual bbox)
3. **Collision box** — what stops movement on tile collision
4. **Hurtbox** — area where the entity can BE damaged (player's body)
5. **Hitbox** — area where the entity DEALS damage (enemy's spikes, player's attack)

For a generic enemy walker, you typically need:
- Visual sprite box: 32×32 (the frame size)
- Visual content box: 24×24 (where the art is painted)
- Collision box: 20×24 (slightly tighter — what tile-collides)
- Hurtbox: 24×20 (slightly shorter — top is "soft," can be stomped)
- Hitbox: 24×24 (touching the body damages player)

For the player, similar but with one important addition: the **stomp box** at the bottom edge — the small bar that lets the player land on enemies' heads safely.

## Why visual and collision boxes are not always the same

### Reason 1: gameplay feel

Tight collision boxes inside generous visual sprites feel **forgiving**. The player thinks "I made that jump by a hair!" In reality the collision box passed comfortably. This is the secret sauce of Mario / Sonic / Celeste.

### Reason 2: art / hitbox mismatch

A character with a big helmet plume should not have the plume be hittable. A bird enemy with long tail feathers should not be deathfully tail-feathered. The collision box ignores the decoration.

### Reason 3: depth illusion

Some games use parallax-like overlap between layers — the player's "feet" partly hide behind a foreground tile while their body is in front of it. The visual sprite is in front for the whole height, but the collision box only counts the feet.

### Reason 4: stomping mechanic

In a stomp-on-head platformer, the top of the enemy's hitbox should be a small "soft" zone where the player lands and stomps instead of taking damage. That's the upper ~15% of the hurtbox being "stompable" and the rest being "damaging."

## How to set each box

### Visual sprite box (the frame)

This is fixed by your sprite frame size. 32×32 means the visual sprite box is 32×32. Set it once, never change.

### Visual content box

Measure in Aseprite or with a quick script. Where do the painted pixels go? Store as `[xMin, yMin, xMax, yMax]` per animation.

For a character whose pose changes between idle and jump, the visual content box can be different per animation. Store per-animation. The `PL_BBOX` table in this project tried to do this; it worked but was brittle.

### Collision box

Slightly smaller than the visual content box. Rules of thumb:
- Width: 80% of visual content width, centered horizontally on the anchor
- Height: matches feet-to-top-of-shoulder (not feet-to-top-of-head, so jumping feels less punishing on low ceilings)

For a 32×32 character with visual content 24×26 centered at (16, 30):
- Collision box: 16 wide × 24 tall, centered at (16, 28) → corners (8, 4) and (24, 28)

### Hurtbox

Often equals collision box for simplicity. Differs when:
- Top edge is "soft" (stompable) — define an upper stomp zone
- Some part of the visual is decoration not vital (plume, tail, cape)

### Hitbox (for entities that damage)

For melee attacks: a separate rectangle that appears for a few frames during attack animation. For body-contact damagers (most enemies in this game): same as the collision box.

## How bad bounding boxes ruin platforming

### Symptom: "I died but I didn't touch the spike!"
Cause: collision box is bigger than the visual sprite. Player sees their character clear the spike but actually clipped it.
Fix: tighten collision box. Make it slightly smaller than visual.

### Symptom: "I clipped through the wall!"
Cause: collision box is smaller than the visual sprite, AND the entity is moving fast enough to skip the wall in one frame.
Fix: collision box should be at least 0.5 × tile size in each dimension. Implement swept collision if entities move > 1 tile per frame.

### Symptom: "I landed on the enemy's head but still took damage!"
Cause: no stomp zone defined, or stomp zone is too small.
Fix: top 4–6 px of enemy hurtbox is "stompable" — player landing on it damages the enemy, not the player.

### Symptom: "Jumps require pixel-perfect accuracy!"
Cause: collision box too big at the feet, too tall at the head.
Fix: make collision box narrower than visual sprite, slightly shorter than visual sprite. Forgiving = fun.

### Symptom: "Enemies hit me from the side of their decoration!"
Cause: enemy hitbox includes non-damaging decoration (tail, cape).
Fix: tighten enemy hitbox to body only.

## Practical rules

1. **Feet must align consistently.** Every sprite's "feet baseline" is at the same y inside its frame box. Every collision box's bottom is at the same y inside its sprite. If a character's feet are at y=30 in the 32-tall sprite, the collision box bottom is at y=30 too.

2. **Collision box should usually be slightly smaller than the art.** ~80% width, ~85–90% height. Tunable per entity.

3. **Visual effects should not change collision.** Particles, glows, smoke, dust — drawn on top, ignored for collision.

4. **All sprites need consistent anchor / origin points.** Pick "bottom-center" or "center-center" once. Never mix. In this project we used bottom-center for entities and top-left for tiles. Be consistent within each entity type.

5. **For enemies that stomp, define `stompZone` explicitly.** Don't infer it from the hurtbox. Different enemies might have different stomp zones (e.g., a Goomba's stomp zone is the top 6 px; a spike enemy has NO stomp zone — touching its top still hurts).

6. **Player invincibility frames apply to the hurtbox only.** Hitbox (attacks) still register during invincibility.

## Text diagram example: a walker enemy

```
Visual sprite frame (32x32):

  0                              32
0 +------------------------------+
  |        +----------+          |  ← visual content box: (8, 4) to (24, 28)
  |        | ##  ##   |          |
  |        | OO  OO   |          |  Head region
  |        |  ____    |          |
  |        | /    \   |          |
  |        | \____/   |          |  Body region
  |        |  ||||    |          |
  |        |  ||||    |          |
  |        +----------+          |
30|         <feet>               |  ← feet baseline at y=30
32+------------------------------+

Collision box (used for tile collisions): (10, 6) to (22, 30) → 12 wide × 24 tall

Hurtbox (where player can damage this enemy by stomping):
  - Top 6 px: (10, 6) to (22, 12) → STOMP ZONE (player jumps on top → enemy dies)
  - Rest: same as collision → DAMAGE ZONE (player touches → player takes damage)

Hitbox (where this enemy damages player): same as collision box
```

## Checklist for importing a new sprite correctly

For every new sprite (character, enemy, prop) added to the game:

- [ ] Frame size matches the project's canonical size
- [ ] Anchor (feet for entities, top-left for tiles) is consistent with project convention
- [ ] Visual content bbox measured and documented
- [ ] Collision box defined — usually 80% of visual content, centered on anchor
- [ ] Hurtbox defined — for damageable entities, with stomp zone if applicable
- [ ] Hitbox defined — for damaging entities
- [ ] All boxes stored in a metadata block / JSON, NOT hardcoded in scattered places
- [ ] Visual sprite renders at the correct position relative to entity (x, y) — anchor is correct
- [ ] Collision tests pass: walks on tiles, doesn't fall through floor, doesn't clip walls
- [ ] Stomp test passes (for enemies): jumping on head kills enemy, walking into side hurts player
- [ ] Edge tests pass: sprite at level edge doesn't disappear visually; collision still works at edge

## Anti-patterns we hit

1. **Per-entity inline bbox math.** Scattering `e.x + 4, e.y + 6, e.w - 8, e.h - 12` style code across collision functions. After 20 entities you can't remember what's what. **Fix:** define `e.hurtbox` and `e.hitbox` once per entity, reuse.

2. **Visual size driving collision size.** Initially, our Car entity had `w = 33, h = 15` as both visual AND collision. Mark complained cars felt unfair. We added `drawW, drawH` for visual and reduced `w, h` to 80% for collision. Painful retrofit. **Fix:** decouple from day 1.

3. **Implicit anchor changes.** Some sprites were anchored to top-left, some to feet, depending on the frame. Caused subtle drift bugs. **Fix:** anchor convention is project-wide, not per-entity.

4. **Forgetting collision box on visual-only entities.** Particles and decorations got `w` and `h` defaulted to something nonzero, and accidentally collided. **Fix:** decorations get `e.collidable = false` flag, collision system skips them.

## Case study: the flappy-mode hitbox bug (mode-behavior-in-data)

A specific bug worth memorizing because it generalizes.

**Day 5-1** is the "flappy mode" stage — the player flaps continuously, hits feel different because the player's pose is different. The flappy hitbox needs different dimensions than the standing hitbox.

**What we did first:** hardcoded the flappy hitbox override inside `scenes.js` (around line 2160 at the time). It was applied during the level's update tick. It worked.

**What broke it:** when Danny grew from `small` → `big` via the power-up, the engine's standard hitbox swap kicked in mid-stage and overwrote our flappy-specific override. The bigger collision box meant brushing past obstacles started registering as hits. *Felt* like a difficulty spike. *Was* an unintentional bug.

**The real fix:** move the per-size, per-mode hitbox config out of code and into the level data:

```js
SDD.levels['5-1'] = {
  // ... usual fields ...
  flappySmallHitbox: { dx: 2, w: 9, h: 19 },
  flappyBigHitbox:   { dx: 0, w: 11, h: 26 }
};
```

The engine now reads the override from the level data at the right moment (after the size swap), so it can never be clobbered by the standard logic.

### The generalized lesson

**Any per-mode, per-size, or per-stage tunable belongs in level data, not code.**

- Hardcode it once → designers can't iterate without a developer.
- Hardcode it twice → you'll have a sync bug.
- Put it in data → the editor can expose sliders, the designer can tune in-browser, no code change required.

This is one of those rules that sounds obvious in retrospect but bites you at every game project until you internalize it. The check before writing any "magic number" inside an engine function: *would a designer ever want to tweak this per-level?* If yes — level data, not code.

## Recommendation

Build a small **`HitboxDebug` overlay** mode early in the project. When active, every entity renders its collision box (red outline), hurtbox (yellow), and hitbox (orange). One keypress toggles it.

This is the difference between "I think it's working" and "I can see it's working." For a platformer especially, this overlay saves dozens of hours over the project's life.
