# 02 — How We Should Have Started

This file is brutally honest. Read it before opening the code editor on the next project.

## The decisions that should have been locked on Day 1

### 1. Engine / framework

**What we did:** vanilla HTML5 Canvas + plain JS, no framework, no build step.

**What we paid:** months of inventing a scene manager, asset loader, audio system, input merger, level editor, save migration, camera, collision engine, animation cycler, parallax system. Each one would have been one line of `import` in Phaser.

**What we should have done:** Phaser 3 for a small browser game, Godot for anything art-heavy.

**Rule:** *if you cannot name your framework before writing any code, you do not have a project — you have a hobby.*

### 2. Render resolution and aspect ratio

**What we did:** picked 320×180 (16:9) and rendered 3× to a 960×540 canvas. Locked that for ~12 months.

**What we paid:** the entire wide-screen-mobile refactor at v1.0.15. Modern iPhones are 19.5:9, so our 16:9 canvas letterboxed with dark bars. Refactoring `VIEW_W` from a constant to a dynamic value touched ~50 files (sky painters, HUD positions, camera bounds, every fillRect at 320 width, every centered text at x=160, every level-end position).

**What we should have done:** **decide dynamic vs. fixed from day 1.** If fixed, pick the aspect that matches your target device — for mobile-first, that's 19.5:9 or wider. If dynamic, use `VIEW_W / 2` instead of `160` from line 1.

**Rule:** *every coordinate in your render code is either "relative to the world" or "relative to the viewport." Mixing them is the bug.*

### 3. Asset folder structure

**What we did:** assets accumulated organically. `assets/`, then `assets/music/`, then `assets/New Assets/` (with spaces in folder names!), then `assets/city/`, then `assets/Super Dude Danny Big Sprites/`, then `assets/level 6 bugs background.png` (with spaces!). A mess.

**What we paid:** `encodeURI()` calls scattered through audio.js for spaces. Migration headaches. Confusing file paths in service worker precache list. Permanent inconsistency in the bundle.

**What we should have done:** a strict folder schema before any asset lands. See `04_REPO_AND_FILE_ORGANIZATION.md`.

**Rule:** *no spaces in filenames or folder names. Ever. Use `kebab-case` or `snake_case`. URL-encoding bugs will find you.*

### 4. Sprite dimensions

**What we did:** PixelLab-generated sprites at various sizes (big/small/rescue/comp2/etc.), each with its own bounding-box quirks. We measured bboxes per-animation after the fact and stored them in `PL_BBOX` lookup table.

**What we paid:** every animation had a slightly different baseline alignment. Feet drift. Sprite jitter. The `PL_DISPLAY_H = { big:36, small:26, rescue:34, comp2:52 }` table is the scar.

**What we should have done:** define **one canonical sprite size** for player + enemies (e.g., 32×32 frame, character occupies central 24×24, feet baseline at y=30). Generate every sprite to that grid. Sprite tools and engines work this way; we worked against the grain.

**Rule:** *the sprite frame box is a contract, not a suggestion. Every frame fits in it. Every feet baseline is at the same Y.*

### 5. Tile size

**What we did:** 16×16 tiles. This was correct. The choice was implicit but mercifully consistent.

**What we should have done:** explicitly document it in a `CONSTANTS.md` on day 1.

**Rule:** *tile size affects level math, collision, art generation, and editor UI. Pick once, document, never argue about it.*

### 6. Collision / bounding box standards

**What we did:** entity collision boxes overlapped sprite sizes inconsistently. Cars had drawW/drawH separate from collision w/h (added v0.93). Player hitbox was tight. Enemy hitboxes varied.

**What we paid:** Mark complained that car collisions felt unfair (too punishing). The fix required decoupling visual size from collision size on every entity, then tuning each one.

**What we should have done:** a rule from day 1: **collision box = central 80% of sprite box, centered on the visual feet anchor.** Visual-collision decoupling is the default, not the exception.

**Rule:** *what you see and what you hit are not always the same rectangle, and that should be designed in, not retrofitted.*

### 7. Audio format + compression

**What we did:** 38 MP3s at stereo ~192 kbps = 130 MB bundle. Late in the project, re-encoded to mono VBR ~96 kbps and dropped to 50 MB (no audible loss on a phone speaker).

**What we paid:** 12 months of an oversized bundle. Slow first loads. App Store cellular-download anxiety.

**What we should have done:** at first audio, encode at the final shipping bitrate. `ffmpeg -codec:a libmp3lame -q:a 6 -ac 1` for mono VBR ~96 kbps. **Verify it sounds fine on a phone speaker.** Stop carrying bytes you can't hear.

**Rule:** *the asset bitrate at first commit is the asset bitrate forever. Re-encoding mid-project causes Mark fatigue.*

### 8. Level editor plan

**What we did:** hand-coded the first 4 levels in JS arrays. Built the editor at v0.6-ish. Used the editor for everything after. Even then, the editor's save serializer **dropped custom fields** on save, requiring manual re-attach.

**What we paid:** weeks of pain hand-coding level data. The level editor's serializer bug bit us twice on `level_8_1.js` — re-saving dropped `hint`, `startSign`, `towerEntrance` and we had to re-attach them at the bottom of the file.

**What we should have done:** **week-1 task: build the level editor.** Even a minimal one. See `10_LEVEL_EDITOR_LESSONS.md`.

**Rule:** *if your game has more than 3 levels, your editor exists before your second level.*

### 9. GitHub repo organization

**What we did:** single repo on `main`, then everything on a feature branch `claude/super-dude-danny-platformer-Jftc7` for 12 months. Never merged back. The branch name had "danny" even after the app was renamed to "Adventures." Other branches were dead.

**What we paid:** every push and Netlify deploy targeted that branch. Other devs would have been confused. The branch name was awkward in CI logs.

**What we should have done:** work on `main` from day 1, use feature branches for actual features, merge them. Keep `main` as the source of truth.

**Rule:** *if you have one developer, you have one branch. If you have many, you have a branching policy in writing.*

### 10. Testing checklist

**What we did:** ran puppeteer tests sometimes. Visual inspection mostly. Real-device testing only at the very end via TestFlight.

**What we paid:** countless desktop-vs-phone surprises. Touch button placement bugs. Audio loading bugs. Fullscreen issues. All discovered when Mark installed a TestFlight build.

**What we should have done:** **week-1 task: ship a black-screen-with-moving-square to a real iPhone via TestFlight.** Every week thereafter, install a new build on a real device.

**Rule:** *the desktop browser is a development tool. The phone is the real game. Test on the phone weekly.*

### 11. Mobile / PWA requirements

**What we did:** added PWA manifest + service worker partway through. Added `viewport-fit=cover` later. Discovered `contentInset: "never"` at v1.0.18 after dark bands shipped. Discovered safe-area-inset in game pixels at v1.0.16.

**What we paid:** half a dozen "oh THAT'S why iOS does this" moments late in the cycle.

**What we should have done:** Day 1 web meta tags:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
```
Day 1 CSS:
```css
html, body { width: 100%; height: 100dvh; margin: 0; -webkit-touch-callout: none; }
#game { position: fixed; inset: 0; width: 100vw; height: 100dvh; }
```
Day 1 Capacitor config:
```json
{ "ios": { "contentInset": "never" } }
```

**Rule:** *the mobile shipping checklist (see `13_MOBILE_PWA_AND_IOS_SHIPPING.md`) is a Day-1 read, not a Week-40 panic.*

## What problems came from not deciding early

1. **VIEW_W refactor at v1.0.15** — touched 200+ lines, broke and re-fixed Adventure City tunnel rendering, required new wide-zone logic in `main.js` for non-level scenes.
2. **Icon pipeline silent failure** — `@capacitor/assets` v3 produced no icons because we used `icon.png` instead of `icon-only.png`. Shipped two builds with a placeholder icon before catching it.
3. **Audio bandwidth crisis** — `preload="auto"` on 38 MP3s meant the title track was bandwidth-starved on cold loads. Fixed at v1.0.5 with lazy loading.
4. **Bezel-canvas mismatch** — lab-tech decorative bezels were at viewport edges, canvas moved per safe-area, so they floated apart visually. Fixed in v1.0.13 with CSS-variable plumbing.
5. **Editor save dropping fields** — required manual re-attach of `hint`, `startSign`, `towerEntrance` after every editor save on Day 8-1.

## Recommended first-week plan for the next game

### Day 1 — Decisions and scaffolding
- Pick the engine. Write `00_DECISIONS.md` in the repo with: framework, render resolution, aspect strategy, tile size, sprite size convention, audio bitrate target, save format version, target platforms.
- Initialize the repo. Commit `.gitignore` excluding `node_modules`, `build/`, `dist/`, `www/`, `ios/`, `.env*`, `*.p8`.
- Set up the web meta tags + CSS reset + service worker stub + manifest.

### Day 2 — Black-square-on-screen
- Get a single colored square to render on screen.
- Get a key press / touch tap to move it.
- That's it. Commit.

### Day 3 — Real device test
- Push to a free static host (Netlify / Cloudflare Pages / Vercel — Cloudflare Pages has no bandwidth cap).
- Open on a real phone.
- Verify the moving square moves on the phone.
- If iOS-bound: scaffold Capacitor + Codemagic setup right now. Build the iOS app shell with that moving square. Get it onto TestFlight.

### Day 4 — Asset pipeline
- Pick one real sprite, one real audio file.
- Render the sprite. Play the audio (gated on user gesture).
- Define your asset folder structure now and never change it.

### Day 5 — Level data + collision
- Pick your level data format (JSON array of tile codes is fine).
- Render a tile map. Add basic player-vs-tile collision.
- Player jumps. Player lands. Player walks on a platform.

### Day 6 — The level editor
- Yes, **already**.
- Even a minimal one: click a tile in a sidebar, click in the level area to place it. Save to localStorage.
- This is the tool you'll use 1000 times. Build it now.

### Day 7 — Audit and revise
- Re-read `00_DECISIONS.md`.
- Anything wrong? Change it now. The cost of a Day-7 decision change is small. The cost of a Day-200 change is enormous.

## A line to live by

> *"Show me your day-1 decisions and I'll predict your day-200 refactor budget."*

If you cannot answer "what tile size, what frame size, what aspect ratio, what audio format, what folder structure" before you push your first commit — go back and answer them. The week you spend deciding is the month you don't spend re-deciding.
