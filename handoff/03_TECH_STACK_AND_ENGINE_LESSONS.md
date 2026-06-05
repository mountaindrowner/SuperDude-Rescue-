# 03 — Tech Stack and Engine Lessons

## What we used

| Layer | Choice | Verdict |
|---|---|---|
| Render | Vanilla HTML5 Canvas 2D | ✅ Adequate; ❌ Wrote our own scene manager |
| Logic | Plain JS (ES5-ish, `var`/`function`) | ✅ Runs anywhere; ❌ No type safety |
| Bundler | None | ✅ Zero build step; ❌ No tree-shaking, manual `<script>` tags |
| State | `window.SDD` namespace + IIFEs per module | ✅ Simple; ❌ Cross-module wiring is implicit |
| Levels | JS objects in `level_*.js` files | ✅ Easy to read; ❌ Brittle to refactor |
| Audio | `<audio>` element + Web Audio API for SFX | ✅ Works; ❌ iOS quirks bit us hard |
| Save | localStorage with custom v1→v4 migrator | ✅ Reliable; ❌ Wrote our own migration |
| PWA wrap | Manifest + Service Worker (cache-first) | ✅ Worked; ❌ Cache trap on every release |
| iOS wrap | Capacitor 6 | ✅ Got us to App Store; ❌ A dozen Capacitor-specific gotchas |
| CI/CD | Codemagic (cloud Mac) | ✅ Bypassed local-Xcode-too-old; ❌ Multiple signing-config rounds |

## What worked

- **No build step.** First-load was instant. We could edit a file and `cmd-R` reload. Zero `npm run dev` cycle.
- **Plain `<script>` tags.** New module = add a tag in dependency order. No bundler complaints.
- **`window.SDD` namespace.** Globally accessible, easy to inspect in DevTools, no module-resolution gymnastics.
- **Canvas 2D.** Sufficient for a 2D platformer at 60 fps. No WebGL needed.
- **localStorage.** Save persisted across sessions without account / server.
- **MP3 + `<audio>` element.** Streamed, didn't bloat memory like decoded buffers.

## What didn't work — and what we'd do instead

### 1. No scene manager out of the box

We wrote `SDD.setScene(name, data)` with a registry of `{ enter, update, render, exit }` objects. Adequate. But every framework gives this for free.

**Next time:** Phaser scenes / Godot nodes / Three.js + a small scene module.

### 2. No asset loader

We had `loadArt()` for images (in `sprites.js`) and `loadFileTrack()` for audio (in `audio.js`). Worked, but: no progress UI, no error handling beyond `failed: true`, no preload prioritization until v1.0.5.

**Next time:** Phaser's `LoaderPlugin` handles progress, retries, and per-scene loading queues for free.

### 3. No input system

`js/input.js` is ~400 lines that merges keyboard, mouse, touch, and gamepad into a unified action API (`pressed/held/confirm/back`). We wrote that. It works. It was a week of effort.

**Next time:** Phaser has an input plugin. Godot has actions. Don't write this.

### 4. No physics engine

Our collision is in `engine.js`: `moveAndCollide(e, map)` does AABB-vs-tile resolution. Works for a tile-based platformer. Doesn't handle slopes, conveyors, complex shapes.

**Next time:** if your game needs anything beyond AABB-on-tilemap, use Arcade Physics in Phaser or KinematicBody2D in Godot. We got lucky we never needed slopes.

### 5. No tilemap tooling

We wrote our own tilemap class and our own editor. Both took weeks.

**Next time:** **use Tiled** (the free editor). Both Phaser and Godot import Tiled maps natively. Saved weeks.

### 6. No animation system

Sprite animation = our own frame index counter per entity. Worked. But Phaser animations + Godot `AnimatedSprite2D` are richer.

**Next time:** use the engine's.

### 7. No save serialization

We wrote a v1→v4 migrator from scratch. ~150 lines. Worked. But Godot has `ResourceSaver` and Phaser projects typically use a JSON helper.

**Next time:** still write the serializer yourself (it's domain-specific) but plan for migration from v1.

## Engine comparison for a small solo / AI-assisted project

### Vanilla HTML5 Canvas + plain JS

**Use it when:**
- Game is tiny (< 5 stages, < 3 enemies, < 10 hours of intended play)
- You're a maximalist who wants ZERO dependencies
- You're learning by doing and want to feel every system you build
- You'll throw the prototype out and write the real thing later

**Avoid it when:**
- You actually want to ship a polished thing
- You need a level editor
- You need a tilemap editor
- You have any deadline at all

### Phaser 3

**Use it when:**
- Browser / PWA / Capacitor-wrap is your target
- 2D platformer / top-down / runner / casual game
- You want scenes, animations, tilemap loading, input merging, audio out of the box
- You'll iterate via reload, not via heavy IDE

**Avoid it when:**
- You need a full IDE with visual scene composition (use Godot)
- You're shipping to console / native AAA targets

**Specifics for the next mobile platformer:**
- Phaser + Capacitor = identical iOS shipping path we used
- Use `scale.mode: Phaser.Scale.FIT` + `scale.autoCenter` for the fullscreen-canvas trick
- Audio: still use HTML5 mode (`html5: true` in Phaser) for music tracks — same lazy-load best practice
- Tilemap: load Tiled JSON, use `addTilesetImage` + `createLayer`

### Godot (HTML5 export)

**Use it when:**
- Game is bigger than 6 stages or has notable cinematic ambitions
- You want a built-in scene editor, animation editor, tilemap editor, audio mixer
- You might also export native (desktop / mobile / console) later
- You're willing to learn Godot's UI and GDScript (or use C#)

**Avoid it when:**
- Target is browser-only and you want a minimal-byte distribution (Godot HTML5 binary is bigger than Phaser)
- HTML5 audio limitations are a dealbreaker (no progressive streaming on web — all audio loads to RAM)

**Specifics:**
- Godot 4's HTML5 export is heavier (~30 MB compressed) than Phaser
- Mobile-on-web is rougher in Godot than native iOS
- If you go Godot, **export native iOS** via Godot's iOS export rather than wrapping the HTML5 build

### Native Swift / SpriteKit / SwiftUI

**Use it when:**
- iOS-only with no future browser distribution
- Need top-tier performance and integration
- Have a current Mac + current Xcode

**Avoid it when:**
- Anything else

## Specific recommendations

### For another small mobile platformer for a church / school audience

**Stack: Phaser 3 + Tiled + Capacitor + Codemagic.**
- Phaser handles the engine concerns we hand-wrote.
- Tiled handles the level editor we hand-wrote (and then patched up).
- Capacitor wraps the same web bundle to iOS.
- Codemagic handles signing without needing a current Mac.

### For a browser-only PWA

**Stack: Phaser 3 + Tiled + Netlify/Cloudflare Pages.**
- Skip Capacitor.
- Use Cloudflare Pages for unlimited bandwidth (Netlify free tier capped at 100 GB/month, we hit it during testing).

### For an iOS-friendly web app with rich UI (less game-y)

**Stack: React or Svelte + Capacitor + Cloudflare Pages.**
- Not Phaser — overkill.
- React Native is also an option if you want native components but don't mind heavier toolchain.

### For a more ambitious 2D adventure with cutscenes

**Stack: Godot 4.**
- The integrated editor is worth the weight.
- Export native iOS via Godot rather than HTML5+Capacitor.

## What each tool is best for (one-line summary)

- **Phaser 3** — small to mid 2D web games, fastest path from idea to shipped browser game
- **Godot** — mid to large 2D/3D games with cutscenes, animations, native exports
- **Vanilla Canvas** — extreme minimalism, learning, throwaway prototypes
- **Three.js** — 3D, not relevant here
- **Unity** — heavy, expensive Pro tier, overkill for 2D unless you've already learned it
- **Unreal** — heaviest, AAA, definitely overkill
- **Construct 3** — visual scripting, good for non-coders, weaker for AI-assisted text-driven development

## Final recommendation for the next project

If the next project is **"another small platformer for the church / kids audience"**:

> **Phaser 3 + Tiled (level editor) + Capacitor (iOS wrap) + Codemagic (CI/CD) + Cloudflare Pages (web host).**

Why:
- Phaser eliminates 5 weeks of engine-writing.
- Tiled eliminates the level-editor weekend.
- Capacitor + Codemagic = the iOS shipping path we already know.
- Cloudflare Pages = no bandwidth cap, free forever.

This stack avoids every architectural mistake of this project while keeping the exact iOS shipping path we now have working.

If the next project is **"something bigger / more cinematic / possibly native"** — **Godot 4**. The integrated editor and tilemap workflow alone are worth the heavier learning curve.

If the next project is **"the simplest possible thing for a quick experiment"** — **vanilla Canvas**, but be honest that you're prototyping.

## Anti-recommendation

**Do not start the next project in vanilla HTML5 Canvas + plain JS unless you specifically want to spend the next 3 months writing infrastructure.** We did. It was educational. It was not efficient.
