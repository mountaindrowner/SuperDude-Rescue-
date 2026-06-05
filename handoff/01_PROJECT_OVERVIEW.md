# 01 — Project Overview

## What we built

**Super Dude Adventures** — a 2D side-scrolling pixel-art platformer for kids ages ~5–12, themed around the seven days of biblical creation (Genesis 1–2). Built for **The Crossroads Foundation's Vacation Bible School 2026** ("Adventure Week 2026").

### Final shipping form

- **12 main stages** across 7 creation days + **1 secret bonus stage** ("Adventure City")
- **3 difficulty modes** (easy / medium / hard) with independent save slots
- **6 scripture lessons** (ICB translation) shown after non-quiz stages
- **5 Bible quizzes** (ESV fill-in-the-blank) between days
- **Multiple animated cinematics** (intro, finale, Adventure City opening + closing)
- **Per-stage signature power-up** for variety
- **Full touch + keyboard + gamepad** controls
- **~50 MB asset bundle** (43 MP3s + ~800 sprite frames + painted backdrops)
- **Locked landscape**, fullscreen edge-to-edge on iPhone

### Target audience

- **Primary:** kids ages 5–12 attending the church VBS week
- **Secondary:** parents (will see / play with their kids), Sunday school leaders (look for educational alignment)
- **Reading level:** ICB-equivalent (~3rd grade) for in-game text
- **Skill level:** easy mode = unlimited lives for very young players; medium = standard; hard = for the kid who beat Mario

### Tone

- Wholesome, encouraging, biblically literate
- Mario-meets-Bible-camp
- Lightly humorous (puns, gentle character humor, robot character with self-deprecating jokes)
- Never preachy — the lessons happen *between* stages and are short
- Never violent beyond cartoon stomping

### Genre

Run-and-jump platformer with light puzzle elements, signature power-ups per stage, and a between-level educational beat. Closest commercial analog: **early Mario titles + Sonic Dash + a Sunday school curriculum**.

### Core gameplay

- Player runs/jumps through a side-scrolling stage
- Collect **power cores** (the optional collectible)
- Reach the **time-machine part** at the stage end (the required goal)
- Touch a **signature power-up** mid-stage that grants a stage-specific ability (vine shot, flame dash, etc.)
- Avoid / stomp enemies
- Between days: scripture lesson OR Bible quiz
- After full game: secret "Adventure City" unlocks

## Platform journey

### Phase 1 — Browser-only PWA

The game lived on Netlify as a PWA. Anyone could play in a browser, install to home screen via "Add to Home Screen," play offline. This was the working baseline for months and still ships as the cheapest distribution.

**What worked:** zero gatekeeper, instant updates, free hosting, full offline once cached.

**What didn't:** iOS PWA install is buried under Share → Add to Home Screen (most users don't know this). PWAs lose features inside `<iframe>`s. Limited App Store discoverability.

### Phase 2 — iOS App Store via Capacitor + Codemagic

To reach App Store discoverability and an installable app icon, we wrapped the PWA in a Capacitor iOS shell and built via Codemagic (cloud Mac, since the developer's Mac was on macOS 12 — too old for current Xcode).

**What worked:** Codemagic cloud build solved the "no modern Xcode" problem. App Store Connect API key + auto-signing made it reproducible. Same web bundle ships to both Netlify and the iOS app.

**What didn't initially:** about 15 specific gotchas (see `13_MOBILE_PWA_AND_IOS_SHIPPING.md`) — content-inset auto-padding, missing icon source filename, viewport-fit semantics, signing certificate private-key requirement, App Privacy questionnaire, subtitle char limit, iPad screenshot requirement for Universal apps, encryption compliance, the list goes on.

### Phase 3 — possible Android (not done)

Android wrap via the same Capacitor project is theoretically one command away. We didn't do it because the VBS audience is heavily Apple-skewed and Google Play has different art / metadata requirements that would have stretched the timeline.

## Technical journey — what we learned about each direction

### Vanilla HTML5 Canvas + plain JS (what we used)

- ✅ No build step. Instant iteration. Runs from `file://` for quick local testing.
- ✅ Smallest possible distribution. No bundler, no framework runtime weight.
- ✅ Total architectural freedom — write whatever scene manager fits your brain.
- ❌ You write the scene manager. And the loader. And the input system. And the audio system. And the camera. And the collision engine. And the editor. And the save migration. **All of it.**
- ❌ No community. No StackOverflow shortcut. No "just use the audio plugin."
- ❌ Refactors at v1.0 are the worst, because there's no engine convention to lean on.

**Verdict:** correct for an "I want total control + tiny binary" project. Wrong for "I want to ship a polished kid's game in 6 months."

### Phaser 3 (what we should have considered seriously)

- ✅ Mature scene system, loader, input, audio, physics, animation, tilemap — all built in.
- ✅ Huge community, prolific tutorials.
- ✅ Compatible with mobile, PWA, Capacitor wrapping (same iOS path).
- ❌ Bigger runtime weight (~1 MB).
- ❌ Learning curve. You have to learn Phaser's idioms.
- ❌ Some inflexibility — fighting Phaser's defaults gets harder as you customize.

**Verdict:** if the next game is "another small browser platformer," **start here.** The 1 MB of runtime weight buys back weeks of solo development.

### Godot HTML5 export

- ✅ Editor + IDE + content pipeline + animation tools + tilemap editor + audio mixer — all integrated.
- ✅ Free, open source, no subscription, no telemetry, no platform lock-in.
- ✅ Exports to web, mobile native, desktop — choose at build time.
- ❌ HTML5 audio path has known limitations — no progressive streaming, all audio loads to RAM. Tight memory budgets on web.
- ❌ Editor is its own UI to learn.
- ❌ Capacitor wrap doesn't apply — Godot has its own iOS export.

**Verdict:** if the next game is bigger / more art-heavy / has any chance of going native, **strongly consider Godot.** The integrated editor and tilemap workflow alone are worth weeks.

### Native Swift / SpriteKit (we did not use)

- ✅ Best possible iOS performance and integration.
- ❌ iOS-only without rewriting the whole game.
- ❌ Need a current Mac + current Xcode.
- ❌ Steep learning curve.

**Verdict:** only if "iPhone-only premium game" is the explicit goal.

## Prototype vs. Real Maintainable Game

**Prototype:**
- One stage, one scene, one character
- No save system
- No audio
- No UI polish
- No menus beyond title → start
- Code lives in 1–3 files
- Could be thrown out in a week

**Real maintainable game (what SDA became):**
- 24 JS modules, 9000+ lines in the largest one
- Scene manager handling 17 scene types
- 3-tier save system with migration across 4 schema versions
- 43 audio tracks with lazy loading + Range support + chiptune fallback
- 12 painted backdrops + procedural sky painters per theme
- Full menu system: title, options, how-to-play, pause, results, quizzes, lessons, finale, intros
- Touch + keyboard + gamepad input merging
- App Store submission pipeline (CI/CD, signing, screenshots, metadata)
- Service worker with cache versioning + Range request handling
- Handoff documentation (the file you're reading)

**The leap from prototype to real game** is approximately 10x the work and 100x the discipline. You do not "iterate" your way there cheaply — you re-architect mid-flight, and it hurts.

**Lesson:** if your project is "real game" from day 1, write the architecture for that from day 1. If you're not sure, build a 3-day prototype and **throw it out** before building the real thing.
