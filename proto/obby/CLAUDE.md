# CLAUDE.md — Procedural Three.js Roblox-Style Obby Game Manual

> Use this file as the project-level `CLAUDE.md` for `proto/obby/index.html`. Its job is to make Claude Code act like a full game-dev assistant: architect, level designer, procedural artist, gameplay programmer, UI builder, and performance reviewer. The human director should mostly give taste-level direction; Claude should do the hard implementation work.

---

## 0. Non-Negotiable Project Identity

This project is a **single-file, no-build, procedural Three.js obby prototype**.

Keep these constraints unless Mark explicitly overrides them:

- Main file: `proto/obby/index.html`.
- One HTML file, one `<script type="module">` block.
- Three.js r160 loaded from CDN.
- No bundler, no Vite, no npm requirement, no build step.
- Open the file or serve it locally and it runs.
- Pure ES2020 JavaScript.
- WebGLRenderer, not a separate game engine.
- Web Audio API for synthesized SFX.
- No MP3s, no Blender exports, no texture pipeline, no sprites, no external art by default.
- Character, obstacles, set pieces, UI accents, and decoration should be made from procedural primitives or generated data.

The visual target is **toy-block / blocky adventure / Roblox-obstacle-course inspired**, not a Roblox clone. Avoid copying Roblox branding, exact avatars, logos, or marketplace items. The goal is the genre feel: readable blocky character, clear obstacle course, bright stage progression, checkpoints, fast respawns, simple joy.

---

## 1. The Big Creative Goal

Build a smooth, colorful, simple obby game where the player controls Danny through multiple bite-sized obstacle stages.

The game should feel like:

- A Roblox-style obby: clear platforms, hazards, checkpoints, staged progression, colorful visual language.
- A simple toy construction set: blocks, cylinders, capsules, spheres, bevel-like edges, bright colors, modular parts.
- A kids/ministry-friendly adventure prototype: clear, cheerful, no harsh realism, no complicated controls.
- A director-friendly AI-built game: Mark gives direction; Claude makes the code, visuals, menus, level design, polish, and fixes.

Do not wait for Mark to micromanage every asset. When asked to improve the game, make reasonable creative decisions and implement them.

---

## 2. Current Framework Summary

The current game already has this architecture:

```js
const MAP = { stages: [
  { id, name,
    platforms: [{ pos:[x,y,z], size:[w,h,d], color, kind, ...kindOpts }],
    hazards:   [{ pos, size, kind:'lava' }],
    checkpoint:{ pos, color },
    finish:    { pos, color }
  }
]}
```

At boot:

- `scaffoldMap()` walks `MAP` once.
- It creates Three.js meshes.
- It registers them in:
  - `platforms[]` for collidable AABBs.
  - `hazards[]` for death/reset volumes.
  - `triggers[]` for checkpoint and finish triggers.

Each frame:

- `tickObstacles(dt)` animates obstacle kinds.
- Disappearing tiles cycle through hold / flash / gone.
- Moving platforms cosine-lerp between `from` and `to`.
- Jump pads pulse.
- Lava wobbles.
- Finish star spins and bobs.

Physics:

- Custom capsule-vs-AABB collision.
- No physics engine.
- Deterministic and fast.

Character:

- Danny is procedural Three.js primitives.
- Torso: `CapsuleGeometry`.
- Shoes, coat slabs, cap brim, patch: boxes.
- Head, eyes, hands, hair tuft, cap dome: spheres.
- Legs, arms, flagpole: cylinders.
- Materials: `MeshStandardMaterial` with color, roughness, metalness, emissive patch.
- Rig: pivot groups for hips, shoulders, and head. Children hang down from pivots.
- Animation: direct math, `rotation.x += (target - current) * lerpRate`.
- No skeletons and no keyframes.

This is good. Do not throw it away. Improve it.

---

## 3. Claude Code Operating Rules

### 3.1 Act Like a Full Production Assistant

When Mark asks for an improvement, do the work. Do not respond with only advice unless he explicitly asks for advice.

Your default workflow:

1. Inspect the current `proto/obby/index.html`.
2. Identify the smallest safe architecture improvement needed.
3. Implement the improvement directly.
4. Keep the no-build single-file promise.
5. Preserve the game running state.
6. Add or update comments only where they help future edits.
7. Check for syntax errors, broken references, and obvious runtime hazards.
8. Summarize what changed in simple language.

Do not make Mark choose between dozens of technical options. Make a good call, then tell him what you chose.

### 3.2 Ask Fewer Questions

Only ask Mark a question when a choice is truly creative and irreversible. Most decisions are reversible, so implement a strong default.

Good default assumptions:

- Bright, readable, toy-block visual style.
- Simple controls: WASD / arrows + space; mobile controls later if needed.
- Checkpoint after every stage.
- Fast respawn.
- Stage difficulty rises slowly.
- Smooth performance matters more than maximum visual detail.
- Procedural primitives matter more than asset imports.

### 3.3 Never Break the Project Philosophy

Avoid these unless Mark explicitly approves:

- Adding npm, Vite, React, Next, TypeScript build steps, bundlers, or a framework.
- Replacing the custom collision system with a heavy physics engine.
- Introducing Blender, GLTF, FBX, sprite sheets, or external texture assets.
- Splitting the game into many files if it prevents “open the file and run.”
- Rewriting everything from scratch when a focused refactor will work.

### 3.4 Make Improvements in Passes

Prefer layered passes over giant rewrites:

- Pass 1: Stabilize architecture and naming.
- Pass 2: Improve movement feel.
- Pass 3: Improve character model and animation.
- Pass 4: Improve stage design.
- Pass 5: Improve visuals, lighting, and set pieces.
- Pass 6: Add menus and UI polish.
- Pass 7: Add customization system.
- Pass 8: Add performance/debug tools.

Each pass should leave the game playable.

---

## 4. Recommended Internal Architecture While Staying Single-File

Keep one file, but organize the script as if it had modules.

Use clear sections:

```js
// ============================================================
// 0. Imports + Constants
// 1. Renderer / Scene / Camera / Lighting
// 2. Shared Geometry + Material Cache
// 3. Data: Palettes, Themes, MAP
// 4. Utility Math + Collision Helpers
// 5. Procedural Mesh Factories
// 6. Character Factory + Rig + Customization
// 7. Obstacle / Stage Scaffold System
// 8. Input + Player Controller
// 9. Camera Controller
// 10. UI / Menus / HUD
// 11. Audio Bus + SFX
// 12. Game State + Checkpoints + Respawn
// 13. Main Loop
// 14. Debug Tools
// ============================================================
```

This gives Claude a mental map without requiring multiple files.

### 4.1 Core State Objects

Prefer a few explicit state objects rather than scattered globals:

```js
const GAME = {
  state: 'title', // title | playing | paused | finished
  stageIndex: 0,
  checkpointIndex: 0,
  deaths: 0,
  elapsed: 0,
  paused: false,
};

const PLAYER = {
  pos: new THREE.Vector3(),
  vel: new THREE.Vector3(),
  grounded: false,
  onPlatform: null,
  coyoteTimer: 0,
  jumpBuffer: 0,
  facing: 0,
  animState: 'idle',
};

const WORLD = {
  platforms: [],
  hazards: [],
  triggers: [],
  movingPlatforms: [],
  animatedMeshes: [],
  decorations: [],
};
```

### 4.2 Resource Caches

Do not create a new `BoxGeometry` or material every time unless necessary. Use shared caches.

```js
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphereLow: new THREE.SphereGeometry(1, 12, 8),
  sphereMed: new THREE.SphereGeometry(1, 16, 12),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
  capsule: new THREE.CapsuleGeometry(0.5, 1, 6, 12),
};

const MAT = {
  platformBlue: new THREE.MeshStandardMaterial({ color: 0x3aa6ff, roughness: 0.75 }),
  hazardLava: new THREE.MeshStandardMaterial({ color: 0xff3b1f, emissive: 0x771000, roughness: 0.55 }),
};
```

Use per-object colors only when needed. Otherwise use named materials.

---

## 5. Best Next Improvements for Graphics

The current primitive-only style is a strength. Improve it by making the primitives look intentionally designed, not randomly assembled.

### 5.1 Use “Toy Construction” Visual Grammar

Every object should look like it belongs to a modular toy set.

Use these visual rules:

- Big simple silhouettes.
- Rounded-feeling shapes using spheres, capsules, cylinders, and stacked boxes.
- Strong color grouping by stage theme.
- Small accent strips on edges.
- Clear hazard colors.
- Clear checkpoint colors.
- Clear finish colors.
- One or two signature colors per stage.
- Decorative objects should support the stage theme without hiding gameplay.

### 5.2 Fake Beveled Edges Without a Model Pipeline

Three.js `BoxGeometry` is sharp. Since we are avoiding imported models, fake better edges by adding tiny accent pieces:

- Thin lighter strips on platform top edges.
- Darker side slabs under platforms.
- Small corner caps using spheres or cylinders.
- A slightly smaller bright top surface on a darker base.
- Shadow plates under important objects.

Example design pattern:

```js
function makeToyPlatform({ size, color, trimColor }) {
  // base block
  // top inset block
  // four edge rails
  // optional corner studs
}
```

Do not overdo this on every platform. Use it on hero platforms, checkpoints, stage starts, finish zones, and large set pieces.

### 5.3 Build a Procedural Set-Piece Kit

Create reusable factories:

- `makeCheckpointGate(theme)`
- `makeFinishArch(theme)`
- `makeStageSign(text, theme)`
- `makeArrowSign(direction, theme)`
- `makeToyCrate(theme)`
- `makeRailFence(length, theme)`
- `makeDangerBeacon(theme)`
- `makeFloatingRing(theme)`
- `makeLabConsole(theme)`
- `makeScaffoldTower(theme)`
- `makeCloudPuff(theme)`
- `makeStarCluster(theme)`

These should be non-collidable by default unless explicitly marked.

### 5.4 Improve Lighting Without Killing Performance

Use a simple stable lighting setup:

- One `HemisphereLight` for soft ambient color.
- One `DirectionalLight` for shape.
- Avoid many dynamic lights.
- Use fake glows with emissive materials and simple transparent rings rather than actual point lights everywhere.
- Shadows are optional; if enabled, keep shadow casters low and only for the player + important platforms.

Recommended default:

```js
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const hemi = new THREE.HemisphereLight(0xddeeff, 0x445566, 1.6);
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(6, 10, 5);
```

If performance drops, turn off real-time shadows and fake them with translucent dark circles under the player and moving props.

### 5.5 Add Atmosphere Without Assets

Use these low-cost effects:

- Scene fog matching background color.
- Gradient sky using CSS background behind transparent canvas or a giant back plane.
- Floating particles made from instanced tiny spheres or points.
- Distant scenery made of very low-poly shapes.
- Stage color changes as the player advances.
- Small squash/bounce animations on checkpoints and jump pads.

---

## 6. Character Improvement Plan

Danny should read clearly at small size and still feel customizable later.

### 6.1 Target Silhouette

Make Danny:

- Blocky and toy-like.
- Slightly taller than wide.
- Big head, readable face.
- Simple torso with lab/scientist identity.
- Chunky shoes.
- Distinct cap / hair / glasses.
- Arms and legs simple enough to animate smoothly.

Do not make him realistic. Make him iconic.

### 6.2 Character Parts Should Be Addressable

Use named groups:

```js
const rig = {
  root,
  body,
  headPivot,
  head,
  face,
  leftShoulder,
  rightShoulder,
  leftArm,
  rightArm,
  leftHip,
  rightHip,
  leftLeg,
  rightLeg,
  leftShoe,
  rightShoe,
  hatSlot,
  hairSlot,
  glassesSlot,
  shirtSlot,
  backSlot,
  effectSlot,
};
```

This enables:

- Hat swaps.
- Hair swaps.
- Glasses on/off.
- Shirt or coat recolor.
- Stage power-up glow.
- Victory poses.
- Costume unlocks later.

### 6.3 Customization Architecture

Do not build a full avatar shop yet. Build the slot system now so it is easy later.

Use data like:

```js
const CUSTOM = {
  hat: 'backwardsCap',
  hair: 'blackTuft',
  face: 'glassesSmile',
  top: 'silverLabShirt',
  coat: 'whiteCoat',
  shoes: 'chunkySneakers',
  trail: null,
};
```

Each item is a factory:

```js
const COSMETICS = {
  backwardsCap: (theme) => makeBackwardsCap(theme),
  blackTuft: (theme) => makeHairTuft(theme),
  glassesSmile: (theme) => makeGlassesAndFace(theme),
};
```

Equip by clearing the slot group and adding the generated item.

### 6.4 Animation State Machine

Keep direct-math animation. Add a simple state machine:

- `idle`
- `run`
- `jump`
- `fall`
- `land`
- `death`
- `checkpoint`
- `victory`

Add animation layers:

1. Movement layer: legs, arms, body bob.
2. Look layer: head tilt / facing.
3. Emotion layer: face / cap glow / hands.
4. Event layer: checkpoint bounce, death spin, victory pose.

Rules:

- Legs and arms swing opposite each other while running.
- Body bobs slightly while running.
- Head stays mostly stable.
- Shoes lift visibly during run.
- In jump, knees tuck a bit and arms lift.
- In fall, arms tilt out slightly.
- On landing, squash down for 0.08–0.12 seconds then recover.

### 6.5 Movement Feel Matters More Than Animation Complexity

Improve player feel with:

- Coyote time: player can jump shortly after walking off a ledge.
- Jump buffering: pressing jump shortly before landing still jumps.
- Variable jump height: releasing jump early cuts upward velocity.
- Fast respawn after falling or touching hazard.
- Air control that is reduced but not absent.
- Slight acceleration/deceleration, not instant full-speed snap.

This will make the game feel better even with simple visuals.

---

## 7. Obby Design Philosophy

An obby is not just random platforms. It is a sequence of small skill lessons.

Use this pattern:

1. **Teach** — introduce one mechanic safely.
2. **Test** — ask the player to use it with mild pressure.
3. **Twist** — combine or slightly vary it.
4. **Reward/Breather** — checkpoint, easy platform, visual treat, or short walking space.

### 7.1 Stage Rules

Each stage should have:

- A clear start.
- A clear end.
- One primary mechanic.
- A checkpoint at the end.
- A visible path forward.
- No surprise unfair deaths.
- Distinct color/theme identity.
- A short name shown in UI.

### 7.2 Difficulty Curve

Use a 1–5 difficulty rating internally.

- Difficulty 1: wide jumps, no timing pressure.
- Difficulty 2: slightly narrower platforms, simple hazards.
- Difficulty 3: timing, disappearing platforms, moving platforms.
- Difficulty 4: combinations, faster timing, small recovery windows.
- Difficulty 5: final gauntlet, but still fair and short.

Never create a long hard stage with no checkpoint. Failure should be bite-sized.

### 7.3 Recommended 12-Stage Structure

Use this as the default obby arc:

| Stage | Name Idea | Primary Skill | Difficulty | Notes |
|---|---|---:|---:|---|
| 1 | First Steps | Basic movement | 1 | Wide platforms, no hazards. |
| 2 | Tiny Gaps | Jump distance | 1 | Teaches normal jump arc. |
| 3 | Up We Go | Height changes | 1.5 | Stairs, ramps, stacked blocks. |
| 4 | Skinny Path | Direction control | 2 | Narrow but safe-ish. |
| 5 | Lava Lane | Hazard avoidance | 2 | Obvious red/orange danger. |
| 6 | Blink Blocks | Disappearing platforms | 2.5 | Slow, predictable cycle. |
| 7 | Conveyor Drift | Lateral movement | 3 | Moving side pressure. |
| 8 | Moving Steps | Timed moving platforms | 3 | Clear rhythm, not too long. |
| 9 | Jump Pad Lab | Launch pads | 3 | Fun, low punishment. |
| 10 | Combo Course | Combine 2 mechanics | 3.5 | Moving + lava or blink + gaps. |
| 11 | Breather Vista | Easy scenic stretch | 1 | Visual reward; short rest. |
| 12 | Final Gauntlet | Mixed skills | 4 | Short, exciting, finish arch. |

### 7.4 Color Language

Use consistent colors:

- Safe platforms: blue, teal, green, cream, purple.
- Checkpoints: glowing cyan/green, flag, ring, gate.
- Hazards: red, orange, magenta, black stripes.
- Jump pads: cyan/blue with pulse.
- Moving platforms: yellow trim or arrow marks.
- Disappearing platforms: purple/transparent flashing state.
- Finish: gold, white, star, arch, confetti.

Do not use hazard colors on safe objects unless clearly decorative and away from the path.

### 7.5 Stage Length

For this prototype:

- Early stage: 10–20 seconds for a new player.
- Mid stage: 20–35 seconds.
- Final stage: 30–45 seconds.
- Respawn after failure: nearly instant.

Keep stages short enough that a kid can retry without frustration.

---

## 8. Expanded MAP Schema

The data-driven stage approach is correct. Extend it without making it complicated.

Suggested schema:

```js
const MAP = {
  meta: {
    title: 'Danny\'s Obby Lab',
    version: 4,
    spawn: [0, 3, 0]
  },
  themes: {
    lab: { bg: 0xbfe9ff, primary: 0x4fa3ff, accent: 0xffd166, hazard: 0xff4d2e },
  },
  stages: [
    {
      id: 's01',
      name: 'First Steps',
      theme: 'lab',
      difficulty: 1,
      lesson: 'Move and jump across wide platforms.',
      camera: { mode: 'follow', yaw: 0.75, pitch: -0.45 },
      spawn: [0, 2, 0],
      platforms: [],
      obstacles: [],
      hazards: [],
      decorations: [],
      signs: [],
      checkpoint: { pos: [20, 2, 0] },
      finish: null
    }
  ]
};
```

Use `obstacles[]` for things with logic and `decorations[]` for non-collidable visuals.

### 8.1 Platform Kinds

Supported kinds should include:

- `static`
- `moving`
- `disappearing`
- `falling` later
- `conveyor`
- `tilt` later
- `bounce` / `jumpPad`
- `ice` later
- `speedPad` later
- `checkpointPad`
- `finishPad`

Each kind needs visual language and gameplay logic.

### 8.2 Decoration Kinds

Decoration should be data-driven too:

- `sign`
- `arrow`
- `gate`
- `arch`
- `cloud`
- `star`
- `crate`
- `rail`
- `pipe`
- `console`
- `banner`
- `beacon`
- `floatingOrb`

Decorations should not accidentally become collidable. Mark collidable explicitly.

---

## 9. Collision and Movement Rules

Keep the custom capsule-vs-AABB collision system. It is appropriate for this scale.

### 9.1 Must-Have Player Feel Features

Implement these before adding complicated content:

```js
const TUNING = {
  moveSpeed: 7.5,
  acceleration: 45,
  airAcceleration: 18,
  friction: 32,
  gravity: 28,
  jumpVelocity: 11,
  jumpCutMultiplier: 0.45,
  coyoteTime: 0.10,
  jumpBufferTime: 0.12,
  maxFallSpeed: 26,
  respawnDelay: 0.20,
};
```

### 9.2 Moving Platform Carry

When standing on a moving platform, the player should inherit the platform delta for that frame. This is essential for obby feel.

Track previous and current platform transforms:

```js
platform.prevPos.copy(platform.mesh.position);
// update platform
platform.delta.copy(platform.mesh.position).sub(platform.prevPos);
```

If player is grounded on platform, add `platform.delta` to player position.

### 9.3 Death Zones

Respawn if:

- Player touches hazard volume.
- Player falls below global kill Y.
- Player gets crushed or stuck for too long.

On death:

- Play SFX.
- Quick visual burst.
- Increment death count.
- Reset to latest checkpoint.
- Preserve current stage progress.

### 9.4 Checkpoints

A checkpoint should:

- Save spawn position and stage index.
- Play sound.
- Show UI toast.
- Trigger a small flag/gate animation.
- Avoid re-triggering constantly if already active.

Use one checkpoint per stage by default.

---

## 10. Obstacle Design Library

Build reusable obstacle constructors. Each kind needs gameplay + visual feedback.

### 10.1 Static Platform

Basic platform. Use for foundation, safety, breathers.

Visuals:

- Main block.
- Optional top trim.
- Optional edge strips for hero platforms.

### 10.2 Lava / Kill Brick

Hazard. Must be readable.

Visuals:

- Red/orange emissive material.
- Wobble or pulse.
- Optional black/yellow warning border.
- Heat particles if cheap.

Gameplay:

- AABB death volume.
- Slight grace only if collision is too harsh, but do not hide it.

### 10.3 Disappearing Platform

Cycle states:

- `solid`
- `warningFlash`
- `gone`
- `reappearing`

Visuals:

- Solid: normal color.
- Warning: flash/material opacity/pulse.
- Gone: invisible or transparent ghost.
- Reappear: quick scale-up.

Gameplay:

- Remove from `platforms[]` collision while gone.
- Never disappear instantly under the player without warning.

### 10.4 Moving Platform

Movement types:

- Linear ping-pong.
- Vertical elevator.
- Circular later.

Visuals:

- Arrow markings or animated trim.
- Different material from static platforms.

Gameplay:

- Carry the player.
- Use smooth sinusoidal/cosine motion.
- Keep timing readable.

### 10.5 Jump Pad

Visuals:

- Cyan/blue pulse.
- Arrow or ring above it.
- Stretch/bounce animation.

Gameplay:

- Launch by setting velocity upward and optionally forward.
- Add short cooldown so it does not multi-trigger every frame.
- Sound should be fun.

### 10.6 Conveyor / Drift Platform

Visuals:

- Moving stripe marks.
- Direction arrows.

Gameplay:

- Applies horizontal force while grounded.
- Start slow. This can be frustrating if too strong.

---

## 11. Menus and UI

The game needs enough UI to feel complete without becoming complex.

### 11.1 Start Screen

Add a title overlay:

- Game title.
- Big Play button.
- Tiny control instructions.
- Optional “Continue from Stage X” if localStorage exists.

Keep it HTML/CSS overlay, not Three.js text if easier.

### 11.2 HUD

During play show:

- Stage number and name.
- Death count.
- Optional timer.
- Checkpoint toast.
- Finish message.

Keep it readable and minimal.

### 11.3 Pause / Reset

Controls:

- `Esc` pauses.
- `R` resets to checkpoint.
- `M` mute/unmute.

### 11.4 Mobile Later

Do not build mobile unless asked, but leave architecture ready:

- Input actions should be abstract: `moveX`, `moveZ`, `jumpPressed`, `jumpHeld`.
- Keyboard and touch can both write into the same `INPUT` object.

---

## 12. Audio Rules

Use Web Audio API in a simple sound bus.

### 12.1 Audio Context

Because browsers may suspend audio until user interaction, initialize/resume audio on Start button or first key press.

```js
function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
```

### 12.2 Synth SFX

Make tiny procedural SFX:

- Jump: quick upward blip.
- Land: soft thud.
- Checkpoint: bright arpeggio.
- Death: descending buzz.
- Finish: victory fanfare.
- UI click: short tick.
- Jump pad: springy rising tone.

Do not generate long music unless asked. Keep sounds short and non-annoying.

### 12.3 Audio Bus

Create functions:

```js
SFX.jump();
SFX.land();
SFX.checkpoint();
SFX.death();
SFX.finish();
SFX.ui();
```

Add mute flag and volume constants.

---

## 13. Performance Budget

This is a browser-based procedural Three.js game. Keep it smooth.

### 13.1 Targets

Aim for:

- 60 FPS on a typical laptop.
- Acceptable FPS on older machines.
- Draw calls: ideally under 100–150.
- Active mesh count: reasonable; avoid thousands of separate Meshes.
- No major garbage creation in the animation loop.
- No new geometries/materials every frame.
- No unnecessary raycasting every frame.
- No dozens of real lights.

### 13.2 Use Instancing for Repeated Decorations

Use `THREE.InstancedMesh` for repeated decorative pieces:

- Stars.
- Studs.
- Bolts.
- Small rocks.
- Coins later.
- Background blocks.
- Floating particles.

Do not instance gameplay platforms unless collision remains easy to track. For collidable platforms, individual logical records are more important than maximum batching.

### 13.3 Merge Static Decoration Geometry When Useful

For scenery that never moves and never needs individual interaction, merging geometry can reduce overhead.

Good candidates:

- Background city blocks.
- Distant scaffolding.
- Decorative rails.
- Static wall trim.

Bad candidates:

- Moving platforms.
- Hazards.
- Checkpoints.
- Objects needing animation or interaction.

### 13.4 Use `renderer.info`

Add a debug overlay toggled by `F3`:

- FPS estimate.
- `renderer.info.render.calls` or draw calls depending on renderer version.
- Triangles.
- Geometries.
- Textures.
- Active platforms/hazards/triggers.
- Current stage.

This makes performance concrete instead of guessed.

### 13.5 Avoid Per-Frame Allocations

In `tick()` and collision loops:

- Reuse `Vector3` objects.
- Reuse `Box3` objects.
- Reuse arrays where possible.
- Do not create new materials/geometries.
- Do not use `.map()` / `.filter()` in hot loops if avoidable.

Keep hot loops simple and explicit.

---

## 14. Claude Implementation Standards

### 14.1 No Placeholders Unless Hidden Behind Working Defaults

Do not leave visible unfinished features like:

- Buttons that do nothing.
- Menu items that say “coming soon.”
- Broken customization slots.
- Empty stages.
- TODO comments instead of implementation.

If a future system is not implemented, keep it out of the UI.

### 14.2 Make Data Editable

When creating stages, use clear object literals. Mark should be able to skim the `MAP` and understand it.

Use simple labels:

```js
{ kind:'static', pos:[0,0,0], size:[6,0.6,6], color:'safeBlue' }
```

Prefer named palette colors over random hex values everywhere.

### 14.3 Use Helper Functions Instead of Copy-Paste

Do not copy-paste 50 platforms manually when a helper can create a sequence.

Good helpers:

```js
linePlatforms({ start, count, step, size, color })
stairPlatforms({ start, count, rise, run })
zigzagPlatforms({ start, count, width, gap })
ringDecorations({ center, count, radius })
```

Use generated arrays inside `MAP` if it keeps things readable.

### 14.4 Keep Mark’s Mental Model Simple

When summarizing work, talk like:

- “I made the character feel less stiff.”
- “I added checkpoints and faster respawn.”
- “I made the lava read more clearly.”
- “I reduced repeated geometry so it should run smoother.”

Avoid long technical dumps unless Mark asks.

---

## 15. Recommended First Major Upgrade Pass

When asked to “improve the whole game,” perform this sequence:

### Pass A — Stabilize and Organize

- Add clear script sections.
- Add `GAME`, `PLAYER`, `WORLD`, `INPUT`, `TUNING` objects.
- Add geometry/material cache.
- Add simple debug overlay toggle.
- Ensure no duplicated geometry/material creation where avoidable.

### Pass B — Movement Feel

- Add coyote time.
- Add jump buffer.
- Add variable jump height.
- Add moving-platform carry.
- Add fast respawn.
- Add landing squash.

### Pass C — Character Polish

- Improve proportions.
- Add hat/hair/glasses slots.
- Add better run/jump/fall animation states.
- Add face expression mesh groups.
- Add subtle cap patch glow.

### Pass D — Stage Design

- Rebuild or refine the 12-stage obby using teach/test/twist/breather.
- Keep every stage short and readable.
- Add signs and arrows.
- Add consistent stage names.

### Pass E — Visual Polish

- Add toy-platform factory with trims.
- Add checkpoint gates.
- Add finish arch.
- Add modular set pieces.
- Add fog/sky/background.
- Add fake shadows.

### Pass F — UI and SFX

- Add start screen.
- Add HUD.
- Add checkpoint toast.
- Add finish screen.
- Add SFX bus.

Stop after each pass if the game is in a meaningfully better state. Do not attempt a risky full rewrite all at once.

---

## 16. Specific Requests Mark Is Likely to Give

### “Make it look more Roblox-like.”

Interpret as:

- More blocky toy proportions.
- More readable avatar silhouette.
- Brighter primary colors.
- Chunkier platforms.
- Clear stage signs.
- More modular obstacle-course feel.

Do not copy exact Roblox avatar assets.

### “Make it smoother.”

Interpret as:

- Improve movement controls.
- Add coyote/jump buffer.
- Reduce per-frame allocations.
- Reuse geometries/materials.
- Check draw calls.
- Fix jitter on moving platforms.
- Tune camera damping.

### “Make the graphics better.”

Interpret as:

- Add visual hierarchy.
- Improve lighting.
- Add trims/edge accents.
- Add set pieces.
- Add fog/background.
- Make hazards/checkpoints visually distinct.
- Improve character proportions and animation.

### “Make more stages.”

Interpret as:

- Add stages following the difficulty curve.
- Introduce one new mechanic at a time.
- Add checkpoint after every stage.
- Avoid random platform spam.
- Add signs and a theme.

### “Add customization.”

Interpret as:

- Add cosmetic slots.
- Add a small selection menu.
- Keep everything procedural.
- Save selected options in localStorage.
- Start with hats/hair/glasses/shirt color.

---

## 17. Acceptance Checklist Before You Say Done

Before claiming a task is complete, check:

- The file still runs as a single no-build HTML file.
- No new required assets were added accidentally.
- No npm/bundler requirement was introduced.
- The player can spawn, move, jump, fall, die, and respawn.
- Checkpoints work.
- Hazards work.
- Finish works.
- Camera follows smoothly.
- Player animation changes between idle/run/jump/fall.
- No console-breaking undefined references are obvious.
- No visible placeholder UI is left unfinished.
- Performance-sensitive code does not create lots of objects every frame.
- The stage path is visually clear.
- The change is explained simply.

---

## 18. Optional Claude Code Extensions for This Project

If Mark wants a more agentic workflow, create project subagents in `.claude/agents/`.

### 18.1 `threejs-performance-reviewer.md`

Purpose: review draw calls, geometry/material reuse, per-frame allocations, and renderer settings.

Use after major visual changes.

### 18.2 `obby-level-designer.md`

Purpose: propose and implement fair obby stages using teach/test/twist/breather.

Use when adding or redesigning stages.

### 18.3 `procedural-art-director.md`

Purpose: improve primitive-only visuals, character silhouettes, stage themes, and set pieces while preserving no external assets.

Use when Mark asks for better graphics.

### 18.4 `game-feel-tuner.md`

Purpose: tune movement, camera, jump, landing, respawn, and animation feel.

Use when the game feels stiff, floaty, frustrating, or sluggish.

These agents should be helpers, not a replacement for the main project instructions.

---

## 19. Useful Prompt Starters for Mark

Mark can paste these into Claude Code.

### 19.1 Whole-Game Upgrade

> Read `CLAUDE.md` and inspect `proto/obby/index.html`. Improve the game in one safe pass while preserving the single-file no-build architecture. Focus on the highest-impact changes first: movement feel, character readability, stage clarity, and visual polish. Implement the changes directly and summarize what improved.

### 19.2 Graphics Pass

> Read `CLAUDE.md`. Do a procedural graphics polish pass on `proto/obby/index.html`. Keep all assets procedural. Improve the toy-block/Roblox-style feel with better character proportions, platform trims, checkpoint/finish set pieces, lighting, fog/background, and clearer color language. Do not add external assets or a build step.

### 19.3 Level Design Pass

> Read `CLAUDE.md`. Redesign or expand the MAP stages into a fair 12-stage obby. Use teach/test/twist/breather, one new mechanic per stage, checkpoints after every stage, and clear visual signs/arrows. Keep the data-driven MAP architecture.

### 19.4 Movement Feel Pass

> Read `CLAUDE.md`. Improve movement feel in `proto/obby/index.html`: coyote time, jump buffering, variable jump height, better acceleration/friction, moving-platform carry, faster respawn, and clearer run/jump/fall animation. Keep the custom capsule-vs-AABB collision system.

### 19.5 Customization Starter

> Read `CLAUDE.md`. Add the first procedural customization system for Danny: hat, hair, glasses, shirt/coat color, and shoes. Use slot groups on the existing rig. Add a simple menu or debug selector and save selections to localStorage. Keep all cosmetics procedural primitives.

---

## 20. Final North Star

This game should become a small but polished procedural obby where Mark can say:

> “Make Stage 4 a space-lab jump-pad stage with glowing platforms and a little more challenge.”

…and Claude Code can handle the level design, visuals, mechanics, UI feedback, SFX, and performance implications without Mark needing to code.

The winning formula is:

**single-file simplicity + data-driven stages + procedural toy-block art + smooth movement + fair obby design + Claude does the work.**


---

## 18. Source-Backed Graphics Upgrade Directive

Use this section when Mark asks Claude Code to “make it look better” while staying inside the current framework.

The goal is **not** photorealism. The goal is a polished, readable, Roblox-style / toy-block obby made from procedural Three.js primitives.

### 18.1 Graphics Philosophy

Improve the game in this order:

1. **Readability first** — the player should instantly understand where to go, what is safe, what is dangerous, and what is interactive.
2. **Lighting second** — better light direction, ambient fill, shadows/contact shadows, fog, and color grading create more polish than extra geometry.
3. **Material discipline third** — use a small set of reusable toy-like materials instead of one-off random materials everywhere.
4. **Silhouette and outlines fourth** — make Danny and important platforms readable at a distance.
5. **Set dressing fifth** — add rails, arrows, portal gates, studs, warning trims, signs, flags, pipes, arches, and themed props only after gameplay paths are clear.
6. **Performance always** — every visual improvement must stay smooth on ordinary laptops and mobile-class GPUs.

Do not “improve graphics” by importing models, textures, GLTF files, sprite sheets, npm packages, or a build pipeline. Stay procedural unless Mark explicitly changes the project rules.

### 18.2 Renderer Baseline

Set the renderer up intentionally instead of accepting defaults blindly.

Recommended baseline for Three.js r160:

```js
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

Rules:

- Cap pixel ratio. Do not blindly use full device pixel ratio on high-DPI phones.
- Keep color management explicit.
- Use tone mapping for a more finished look, but tune exposure by eye.
- Do not use r160-incompatible renderer features.
- Add a debug overlay that can show `renderer.info.render.calls`, `renderer.info.render.triangles`, and `renderer.info.memory.geometries`.

Suggested budget targets:

- Great: under 80 draw calls.
- Acceptable prototype: under 150 draw calls.
- Triangles: keep comfortably under 100k unless measured performance is still strong.
- Materials: reuse named materials aggressively.

### 18.3 Lighting Recipe

Avoid flat ambient-only lighting. A good toy-obstacle-course look needs directional definition.

Use this default lighting stack:

```js
const hemi = new THREE.HemisphereLight(0xbfe8ff, 0x6b5a45, 1.15);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 2.25);
sun.position.set(-6, 12, 8);
sun.target.position.set(0, 0, 0);
scene.add(sun);
scene.add(sun.target);

sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.02;
```

Rules:

- Use one main shadow-casting directional light, not several shadow-casting lights.
- Hemisphere light is preferred over pure AmbientLight because it gives sky/ground color influence while still filling shadows.
- Keep the shadow camera bounds tight around the playable area. Huge shadow cameras make low-quality shadows.
- Only important meshes cast shadows: Danny, moving platforms, major props. Not every decoration.
- Most static platforms receive shadows, but tiny decorations do not need to cast them.
- If shadows hurt performance, use fake contact shadows: transparent dark circles or ellipses under Danny and major props.

### 18.4 Color, Fog, and Atmosphere

Use atmosphere to hide the “empty web demo” look.

Default approach:

```js
const skyColor = 0xbfe8ff;
scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.Fog(skyColor, 28, 85);
```

Rules:

- Match fog color to the background color.
- Use fog to create depth and soften the far end of long obby paths.
- Each stage theme may adjust sky/fog/accent colors, but never at the cost of gameplay readability.
- Hazards must keep high contrast against safe platforms.
- Do not make lava, poison, safe platforms, checkpoints, and jump pads share similar colors.

Suggested semantic color language:

- Safe main path: bright blue, teal, white, green, or warm orange depending on theme.
- Hazard: red/orange lava, purple void, toxic green, black/yellow warning trim.
- Checkpoint: green or cyan glow.
- Finish: gold/white glow.
- Jump pad: saturated yellow or electric blue.
- Moving platform: same safe color family but with animated arrows or stripes.
- Disappearing platform: translucent/cool color with flashing warning outline.

### 18.5 Material System

Create a material factory and palette instead of random inline `new MeshStandardMaterial` calls.

Use three tiers:

```js
function toyMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.72,
    metalness: opts.metalness ?? 0.0,
    flatShading: opts.flatShading ?? false,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0.0,
  });
}
```

Recommended material categories:

- `safeMat`: matte, bright, roughness 0.65–0.85, metalness 0.
- `trimMat`: darker version of platform color for borders/edges.
- `hazardMat`: emissive red/orange/purple/green.
- `checkpointMat`: emissive cyan/green.
- `finishMat`: emissive gold/white.
- `characterSkinMat`, `characterHairMat`, `shirtMat`, `coatMat`, `shoeMat`.
- `glassMat`: transparent only when necessary; avoid lots of transparency.

Use `MeshLambertMaterial` for large background/set pieces if performance becomes an issue. Use `MeshStandardMaterial` for hero pieces, hazards, and items where roughness/emissive polish matters.

Optional style experiment: `MeshToonMaterial` can be used on Danny or props for a cartoon/toy look, but only if it does not complicate the material system.

### 18.6 Procedural Textures Without an Asset Pipeline

External texture files are still off-limits by default, but generated textures are allowed.

Use `CanvasTexture` or `DataTexture` for:

- Stripes on moving platforms.
- Checker patterns on safe tiles.
- Warning chevrons.
- Simple arrows.
- Toon gradient maps.
- Soft circular fake shadow textures.
- Sign text rendered into a small canvas.

Rules:

- Generated textures must be cached.
- Generated textures must be low-resolution and simple.
- Color textures should use the correct color space when applicable.
- Avoid dynamic texture updates every frame unless absolutely necessary.
- Most animated effects should use mesh scale/rotation/emissive changes instead of constantly rewriting canvas pixels.

### 18.7 Outlines and Edge Detail

Use outlines selectively. They help the blocky toy style, but they cost extra draw calls.

Good targets for outlines:

- Danny’s body silhouette.
- Checkpoints.
- Finish gate/star.
- Hazard borders.
- Important tutorial platforms.
- Large toy-block props.

Implementation options:

1. **EdgesGeometry lines** for boxes and static props.
2. **Slightly scaled backside duplicate mesh** for Danny’s silhouette or hero items.
3. **Post-processing outline** only as a later experiment, not the first pass.

Preferred starter helper:

```js
function addEdges(mesh, color = 0x1b2430, threshold = 20) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, threshold);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })
  );
  line.scale.copy(mesh.scale).multiplyScalar(1.002);
  line.position.copy(mesh.position);
  line.rotation.copy(mesh.rotation);
  mesh.parent?.add(line);
  return line;
}
```

Rules:

- Do not outline every small decoration.
- Cache edge geometries when possible.
- Avoid thick line-width assumptions because line width support varies across WebGL implementations.
- Keep outlines subtle: dark blue/charcoal at 35–65% opacity usually looks better than pure black everywhere.

### 18.8 Better Primitive Modeling

Improve visuals by composing primitives with intention.

For platforms:

- Add darker side slabs or trims so platforms do not look like flat cubes.
- Add studs/caps/bolts with small cylinders on safe blocks.
- Add colored underside shadows or darker base pieces.
- Add bevel illusion by layering slightly smaller top faces over darker bases.

For hazards:

- Lava should have animated emissive material, bobbing surface, and a darker rim.
- Add warning stripes or posts before hazard zones.
- Add heat shimmer only as a later shader/post-processing experiment.

For moving platforms:

- Add arrows that show direction.
- Add rails or side trims.
- Add a small animated glow or pulse.

For jump pads:

- Use a base cylinder, inner glowing disk, spring/coil rings, and upward arrow particles or small rising spheres.

For checkpoints:

- Use a flagpole, glowing ring, banner, or portal arch.
- Make checkpoint state visible: inactive dim, active glowing.

For finish:

- Use a destination gate, star, beam, confetti rings, or trophy platform.
- Make it feel like the end of a stage, not just another block.

For Danny:

- Keep the primitive character but improve proportions and silhouette.
- Make head, cap, glasses, hair, hands, shoes, and coat readable from the gameplay camera.
- Add asymmetry carefully: cap patch, hair tuft, coat lapels, backpack/tool pouch.
- Use big shapes first, tiny details second.
- Avoid tiny facial features that disappear from camera distance.

### 18.9 Roblox-Style / Toy-Block Readability Rules

Every obstacle should communicate its function visually before the player touches it.

- Safe things look stable, solid, and inviting.
- Dangerous things glow, pulse, wobble, or use warning colors.
- Moving things show direction before moving.
- Disappearing things preview their behavior with blinking/opacity before vanishing.
- Jump pads visually point upward.
- Checkpoints look like “safe progress.”
- The finish looks like a celebration target.

Do not make “cool-looking” props block the camera, hide hazards, or confuse the path.

### 18.10 Stage Themes

Extend the MAP with a theme layer instead of hardcoding visual choices everywhere.

```js
const THEMES = {
  lab: {
    sky: 0xbfe8ff,
    fogNear: 28,
    fogFar: 85,
    safe: 0x35a7ff,
    trim: 0x1f5f91,
    hazard: 0xff3b1f,
    checkpoint: 0x00ffc8,
    finish: 0xffd447,
    deco: ['pipes', 'cables', 'warningPosts'],
  },
  jungle: {
    sky: 0xcaf7dd,
    fogNear: 22,
    fogFar: 70,
    safe: 0x4ecb71,
    trim: 0x2f7a43,
    hazard: 0xb14cff,
    checkpoint: 0x00e5ff,
    finish: 0xffd447,
    deco: ['vines', 'rocks', 'leafArches'],
  },
};
```

Each stage should have:

- A readable primary platform color.
- A trim/accent color.
- A hazard color.
- A checkpoint/finish color.
- 2–4 procedural decoration families.
- A background/sky/fog mood.

### 18.11 Set Dressing Without Clutter

Add depth outside the playable path:

- Distant floating islands.
- Background arches.
- Low-poly clouds.
- Simple pipes/cables along walls.
- Signposts with arrows.
- Rails and guard posts near non-gameplay edges.
- Decorative stars/rings/coins outside collision path.
- Confetti shapes near the finish.

Rules:

- Keep the actual collision path clean.
- Put decoration slightly outside or below the path.
- Use repeated instanced meshes for clouds, studs, bolts, rings, and posts.
- Set decorative objects to non-collidable unless explicitly part of gameplay.

### 18.12 Instancing and Geometry Reuse

For repeated visual details, use `InstancedMesh`.

Good instancing candidates:

- Studs on platforms.
- Bolts/rivets.
- Coins/rings.
- Fence posts.
- Warning cones.
- Background blocks.
- Confetti pieces.
- Cloud puffs if many repeated spheres are used.

Rules:

- Use one `InstancedMesh` per geometry + material combination.
- Update matrices once at scaffold time for static instances.
- Use instance colors only when needed.
- Recompute bounds if instances move or are transformed substantially.
- Do not instance unique hero objects where individual mesh control is more valuable.

### 18.13 Post-Processing: Optional Polish Mode

Post-processing is allowed if it stays CDN/no-build and can be disabled.

Use only after the base scene already looks good.

Starter stack:

```js
import { EffectComposer } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/OutputPass.js';
```

Optional additions:

- Very subtle bloom for lava/checkpoints/finish.
- Very subtle vignette for focus.
- Mild saturation/contrast shader.
- Avoid heavy depth-of-field, motion blur, SSAO, or complex shader stacks for now.

Rules:

- The last pass should be `OutputPass`.
- Keep post-processing behind a boolean like `GRAPHICS.post = true`.
- If performance drops, disable post-processing before reducing gameplay quality.
- Do not hide poor lighting with post-processing.

### 18.14 Camera and Composition

The camera is part of the graphics.

Rules:

- Use a stable third-person obby camera: slightly elevated, behind Danny, angled enough to read gaps.
- Avoid excessive camera shake.
- Keep Danny large enough to read costume/customization.
- Keep upcoming obstacles visible.
- Use smooth camera follow, but not so much lag that jumps feel imprecise.
- Use light/fog/background shapes to frame the path.

Recommended default:

```js
camera.fov = 55;
camera.near = 0.1;
camera.far = 120;
```

### 18.15 Visual Effects With Primitives

Use cheap procedural VFX:

- Jump pad: rising rings/spheres, scale pulse, emissive pulse.
- Checkpoint: rotating ring, flag wave using simple rotation, glow pulse.
- Finish: spinning star, orbiting small spheres, confetti burst.
- Lava: wobbling top surface, emissive pulse, floating bubbles.
- Death/reset: quick screen flash and small burst of particles.
- Collectible: bob, spin, small glow.

Implementation rule: VFX should be simple mesh animations stored in `WORLD.animatedMeshes[]`, not separate complex systems.

### 18.16 UI as Part of the Graphics

Add polish through HTML/CSS overlay, not only 3D.

Build:

- Title screen.
- Stage name card.
- Death counter / timer.
- Checkpoint notification.
- Pause/restart/help overlay.
- Finish results card.
- Simple settings: sound on/off, graphics high/low.

Style:

- Rounded cards.
- Big readable text.
- Bright accent colors matching the current stage.
- Subtle drop shadows.
- Minimal clutter.

### 18.17 Graphics Quality Toggle

Add a simple quality profile:

```js
const GRAPHICS = {
  quality: 'high', // low | medium | high
  shadows: true,
  post: false,
  outlines: true,
  decorativeDensity: 1.0,
  pixelRatioCap: 1.75,
};
```

Low mode:

- Pixel ratio cap 1.0–1.25.
- Shadows off or fake-only.
- Post-processing off.
- Fewer decorations.
- Fewer outlines.

High mode:

- Pixel ratio cap 1.75–2.0.
- One shadow-casting directional light.
- Selective outlines.
- Optional subtle bloom.
- Full decorations.

### 18.18 Claude Code Graphics Improvement Task Order

When asked to improve graphics, do not randomly add detail. Execute in this order:

1. Add or clean renderer baseline: pixel ratio cap, tone mapping, output color space, clear color.
2. Add lighting stack: hemisphere fill + directional key + one shadow source.
3. Add fog/background color.
4. Create `THEMES`, `PALETTE`, and material factory/cache.
5. Replace inline materials with cached semantic materials.
6. Improve platform construction: top face, side trim, darker base, optional studs.
7. Improve hazard construction: rim, emissive material, animation, warning trim.
8. Improve checkpoint and finish visuals.
9. Improve Danny’s silhouette and costume readability.
10. Add selective outlines/edge lines.
11. Add set dressing outside the collision path.
12. Add simple procedural VFX.
13. Add optional post-processing only if the base scene already looks good.
14. Check `renderer.info` and reduce draw calls if the budget is exceeded.
15. Summarize the pass in plain language.

### 18.19 Anti-Patterns To Avoid

Do not:

- Add hundreds of unique meshes when instancing would work.
- Give every object its own material.
- Add many real-time shadow-casting lights.
- Use high segment counts on every sphere/cylinder.
- Add decoration directly on the jump path.
- Make important colors too similar.
- Use transparency everywhere.
- Use post-processing to compensate for bad lighting.
- Import external assets without permission.
- Add npm/build tooling.
- Rewrite the whole game to chase visual polish.

### 18.20 Best Prompt To Give Claude Code For a Graphics Pass

Use this when you want Claude Code to improve the current file:

```text
Read CLAUDE.md and inspect proto/obby/index.html. Do a graphics-polish pass while preserving the single-file, no-build, procedural Three.js r160 architecture. Do not add npm, a bundler, external textures, GLTF/Blender files, sprites, or a physics engine.

Improve the scene in this order: renderer baseline, color management/tone mapping, lighting, fog/background, material cache, platform trims, hazard visuals, checkpoint/finish readability, Danny silhouette, selective outlines, set dressing, and cheap procedural VFX. Keep gameplay readable and smooth. Use shared geometries/materials and InstancedMesh for repeated details. Add a tiny debug readout or console helper for renderer.info draw calls/triangles.

After editing, verify the file still runs as a standalone HTML file and summarize the visual changes plus any performance budget notes.
```

### 18.21 Source Notes Behind These Rules

These instructions are based on current Three.js and Roblox Creator guidance:

- Three.js WebGLRenderer docs: output color space, tone mapping, pixel ratio, renderer info, shadows.
- Three.js Color Management manual: linear workflow, sRGB output, OutputPass when post-processing.
- Three.js Lights manual: ambient is flat; hemisphere + directional lighting gives better shape.
- Three.js Shadows manual: shadow-casting lights re-render the scene and should be limited.
- Three.js Post Processing manual: EffectComposer + RenderPass + OutputPass pipeline.
- Three.js InstancedMesh docs: repeated geometry/material objects should use instancing to reduce draw calls.
- Three.js Materials docs: simpler materials can be faster; Standard/PBR is more expensive but polished.
- Three.js Fog docs: fog adds distance/depth with simple scene-level settings.
- Three.js CanvasTexture/DataTexture docs: generated textures are possible without an external asset pipeline.
- Roblox Classic Obby template docs: checkpoints, fast pads, jump pads, and hazards are core obby vocabulary.
- Roblox performance/design guidance: support multi-platform/mobile users and design for performance early.
