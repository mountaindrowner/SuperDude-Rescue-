# 09 — Tilesets and Level Building

## Why this is one of the most important files

Levels are where players actually spend time. The art and the music create mood, but the **level design is what makes them play, replay, get stuck, get unstuck, learn, and feel.**

The single biggest production lesson from Super Dude Adventures: **build the level editor before the levels.** We did the opposite. Hand-coded the first 4 stages in JS arrays, then built the editor in pain, then rebuilt those 4 stages.

This file: how to do it right.

## The taxonomy: 4 different layers per level

You always have at least 4 distinct "things" in a level. Designers conflate them. Don't.

### 1. Background art

The parallax painted scenery behind the gameplay. **Has no collision. Has no interaction.** It's wallpaper. (See `05`, `06`.)

### 2. Decorative tiles

In-world props that DON'T affect gameplay. A torch on the wall. A bush. A sign. Drawn at the same depth as the gameplay layer but the player walks through them.

### 3. Collision tiles

The actual platforms and walls. Solid. Player collides with them. **These are what makes the level navigable.**

### 4. Interactive objects

Things the player can use, collect, trigger: pickups, switches, doors, NPCs, signs you can read, checkpoints, exit triggers.

Plus separate but related:
- **Enemies** — spawn positions + behavior parameters
- **Level data** — width, height, tile array, spawn arrays, theme/zone info

**The mistake:** putting decoration in the collision tile array. Now you can't walk through bushes. Or putting collision into the decoration layer. Now you can't see what's solid. Keep them in separate arrays.

## How to design levels for kids ages 8–12

### Read the room

Ages 8–12 is a wide range. A 12-year-old will demolish your hardest stage. An 8-year-old will rage-quit on stage 2 if the difficulty curve is wrong. **Easy mode = unlimited lives** was the single best decision we made for inclusivity.

### Design principles for kid-friendly levels

1. **Readable paths.** The way forward is visually obvious. Color, lighting, and platform spacing all guide the eye left-to-right.

2. **Forgiving jumps.** Reachable from the slowest possible run-up. Jump arc has at least 1 tile of forgiveness on landing. Pit edges are slightly inset.

3. **Clear goals.** "Get to the time-machine part on the right." Every stage. Same goal. Predictable.

4. **Progressive challenge.** Each new mechanic is introduced in a safe space (empty room, no enemies), then tested (one enemy, one obstacle), then combined (multiple).

5. **Not too much punishment.** Falling off a cliff = respawn at checkpoint, not at the start of the level. Getting hit = brief invincibility + brief stun, not "you lose 10 minutes of progress."

6. **Satisfying collectibles.** Cores you can almost reach but require a small detour. Reward curiosity but never gate progress on them.

7. **Visual celebration on success.** Stage clear = banner, sound, animation. Picking up a power core = SFX + small particle burst. Never let an accomplishment go unrewarded sensorially.

### Design principles to AVOID

- ❌ Hidden required paths (player can't see how to progress)
- ❌ Pixel-perfect jump requirements
- ❌ Unfair surprise enemies (drop from off-screen the moment you commit to a jump)
- ❌ Long stretches with no checkpoint
- ❌ Long stretches with no visual variety
- ❌ Enemies that respawn endlessly (frustrating, not challenging)
- ❌ Insta-death pits without warning
- ❌ Areas where falling = restart from the very beginning

## Teach, test, twist

A classic level-design framework. Each new mechanic gets three rooms:

1. **Teach room.** Mechanic introduced safely. "Here is a moving platform. Stand on it. It carries you across this gap." Nothing else happening.

2. **Test room.** Mechanic used with consequence. "Now there's a pit. The moving platform is the only way across."

3. **Twist room.** Mechanic combined with other elements. "Now there's a pit, the moving platform, AND a flying enemy that you have to dodge while riding the platform."

After "twist," the mechanic is yours to deploy anywhere in the level. The player knows it. Reusing it adds challenge without confusion.

## One mechanic at a time

**Day 2-1** introduces clouds-as-platforms. That's all it does. No new enemy types. No new collectibles. Just clouds.

**Day 4-1** introduces solar flares (timed hazards). No new platform types. No new enemies. Just flares.

This "one new thing per level" rule is how Mario does it. Every level has ONE new toy, played with for 2 minutes. The player masters it before moving on.

We followed this loosely. Strictly enforcing it would have made the game feel more designed.

## Visual language

Color and shape signal danger / safety / interaction:

- **Yellow** = collectible / interactive / friendly
- **Red** = damage / hazard / blood
- **Cyan / blue** = info / mild interactive / cores
- **Green** = healing / safe zone / completion
- **Magenta / purple** = secret / bonus
- **Brown / black** = solid terrain
- **Spikes** = pointing toward the player = hurt; spikes pointing away = safe to land on

When you violate the language, you confuse players. Yellow that hurts you = bug, not creativity.

## Reward curiosity

Hide cores in non-required spots. Slightly off the main path. Up a high platform. Behind a breakable wall.

When the player goes "I wonder if I can jump up there" and finds a core, they feel smart. They explore more. They engage more deeply. **Curiosity-rewarded gameplay is sticky gameplay.**

We did this lightly. Could have done it more.

## Tile types we needed (final inventory)

| Tile code | Meaning | Behavior |
|---|---|---|
| `' '` | Empty | No collision, transparent |
| `'X'` | Solid ground | Full collision |
| `'#'` | Brick | Full collision (sometimes breakable) |
| `'='` | One-way platform | Collide from above only |
| `'?'` | Question block | Collision + breakable into pickup |
| `'G'` | Goal block | Collision + level-end trigger |
| `'V'` | Vine | No collision, but climbable (special) |
| `'W'` | Water | No collision, slow / swim physics |
| `'L'` | Lava | No collision, damages on touch |
| `'C'` | Crumbling | Collision then breaks after standing |

About 10 tile codes covered every mechanic we built. Don't over-design tile types up front. 5 is enough to start.

Full tile code reference (including the render-only and special codes) is in `22_REFERENCE_PROJECT_SPECIFICS.md`. Use it as the canonical list when extending the tile set.

## Slopes

We didn't implement slopes. AABB-on-grid collision doesn't handle slopes natively. Adding them would have required a rewrite of `moveAndCollide`.

**Recommendation for next project:** if your game wants slopes, use Phaser Arcade Physics or Godot — both handle it. If you stay vanilla, plan slopes as the second day of work, not the second month.

## Checkpoints

Critical. Every stage past 1-1 has at least one checkpoint, usually two. Each one is a `Checkpoint` entity that stores the player's position on touch.

Rule of thumb: **a checkpoint every ~30 seconds of expected play time**. More for harder stages.

We added these throughout. Don't ship a non-trivial level without one.

## Hazards we used

- Spikes (static)
- Lava plumes (rise / hold / fall on timer)
- Solar flares (sweep horizontally with warning)
- Twisters (small tornado that pushes player)
- Falling leaves (one-way platforms that fall away)
- Crumbling road tiles (break after standing on)
- Cars / dump trucks (patrol-mob hazards)
- Hydrant jets (timed water column)

Pattern: each hazard has a **clear warning state** before it damages. Crumbling tile flashes for ~0.3s before breaking. Solar flare honks before sweeping. Players who pay attention can react.

**Hazards without warnings are unfair, not challenging.** This is non-negotiable for kid-friendly design.

## Pickups

We had:
- **Power Cores** — collectible, count toward stage completion
- **Time Machine Part** — required goal pickup, ends the stage
- **Signature Power-up** — mid-stage, grants stage-specific ability
- **1-Up items** — rare, grant extra lives

Less is more. We considered adding coins, gems, keys, multiple core colors — and rejected each one. The simpler the pickup set, the clearer the game feels.

## How to design a new level — the checklist

1. **Pick the theme** (sky, forest, lava, etc.) — match an existing painter.
2. **Pick the new mechanic** (vines, flappy mode, etc.) — one new thing only.
3. **Sketch the level on paper** — rough horizontal scroll, 3–6 segments.
4. **Identify the teach / test / twist rooms** for the new mechanic.
5. **Place the signature power-up** about 30% into the level.
6. **Place at least one checkpoint** about halfway.
7. **Place the time-machine part** at the level end.
8. **Build in the level editor** — paint tiles, place entities.
9. **Walk it** — play start to finish on medium difficulty. Time it. Expect 60–120 seconds.
10. **Spot-check easy mode** — does it feel forgiving? Spot-check hard — does it feel possible?
11. **Place power cores** — 10–20 per level, mostly on-path, a few off-path as bonus.
12. **Add visual decoration** — non-collision props for variety.
13. **Add a hint banner** if the new mechanic isn't obvious.
14. **Iterate** — record someone playing it for the first time, watch them. Where do they hesitate? Fix.
15. **Final pass** — confirm checkpoints work, exit triggers, all assets load.

## Level data format (what we used)

```js
SDD.levels['1-1'] = {
  width: 60, height: 14,   // in tiles (16px each → 960×224 world pixels)
  ground: 13,              // which row is the ground baseline
  tiles: [                 // 2D array of tile codes
    "                                                            ",
    "                                                            ",
    // ... 12 more rows
    "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  ],
  spawns: [
    { type: 'player',     tx: 2, ty: 11 },
    { type: 'walker',     tx: 12, ty: 12 },
    { type: 'core',       tx: 8, ty: 11 },
    { type: 'checkpoint', tx: 30, ty: 12 },
    { type: 'timepart',   tx: 58, ty: 11 }
  ],
  movers: [],              // moving platform paths
  name: 'LIGHT AND DARKNESS',
  theme: 'galactic',
  hint: 'GRAB CORES • REACH THE TIME-MACHINE PART'
};
```

Plain JS object. Easy to read, easy to edit by hand for small fixes. The editor produces this format.

**Full level file schema** (every field the engine actually reads, including the render-only fields the editor's serializer drops on Adventure City) is documented in `22_REFERENCE_PROJECT_SPECIFICS.md`. Re-attach those fields by hand after every editor save of `level_8_1.js`.

## Recommendation for next project

1. **Use Tiled** (tiled.org) as the level editor. Save weeks.
2. **Adopt Tiled's JSON format** as your level data. Both Phaser and Godot import it directly.
3. **One mechanic per level** rule, strictly.
4. **Teach / test / twist** structure for every new mechanic.
5. **Test on a real kid** before shipping. Adults misread difficulty.
6. **Checkpoint every ~30 seconds** of expected play.
7. **Visual warnings** for every hazard.
8. **Reward curiosity** with off-path collectibles, never gate progress on them.
