# 00 — README: Start Here

## What this is

This folder is a **professional project handoff package** distilled from the build of **Super Dude Adventures**, a kid-friendly HTML5 platformer shipped to the iOS App Store for The Crossroads Foundation's VBS 2026. It captures every meaningful lesson — technical, creative, production — that the team (Mark + AI assistant) earned the hard way over ~30 sessions, ~120 versions, and one full App Store submission cycle.

It is not a casual journal. It is the document **you should read before writing a single line of code on the next game.**

## Who it is for

- The next AI session that picks up a new game project
- A future Mark who has forgotten the trenches
- A junior developer brought in to help
- Anyone whose first question is "how should I start a small 2D game in 2026 that ships to mobile?"

## How to use this

1. **Read `00` through `04` before opening the next code editor.** Those four files answer "what stack, what folders, what rules" — the questions you'll regret skipping.
2. **Skim `05` through `13` to understand the pipelines** — art, parallax, sprites, collisions, tilesets, level editor, audio, UI, mobile. Reference these as you actually build the corresponding system.
3. **Read `14` and `15` if you're working with an AI assistant.** They explain how to prompt well, how to recover from session loss, and how to keep the AI honest.
4. **Use `19` as a copy-paste library** when you need to write prompts.
5. **Read `20` last** — it's the senior-designer-to-junior pep talk that ties everything together.

## The top 10 lessons (TL;DR for impatient readers)

1. **Pick a framework before you write anything.** Vanilla HTML5 Canvas works for prototypes but compounds into pain. Phaser, Godot HTML5, or a tiny purpose-built engine save weeks. We chose vanilla and paid for it in editor build-out, scene management, and asset pipelines we had to invent from scratch.

2. **A level editor must exist on day one.** Hand-coding levels in JSON or arrays is fine for the first stage. By stage 4 you're miserable. We built ours mid-project and lost weeks before that — and the editor still drops custom level fields on save, requiring manual re-attachment.

3. **Define your render resolution and aspect ratio before drawing a pixel.** We were 320×180 (16:9) for a year, then refactored to dynamic-width late so the canvas could fill modern iPhone screens (19.5:9). That refactor touched ~50 files. Decide your aspect on day one — or commit to dynamic from the start.

4. **Decide sprite frame size, bounding box, and origin point before generating sprites.** Every AI-generated sprite needs measurement and alignment. Without a master rule, every animation drifts. We had to measure bboxes per-animation post-hoc.

5. **Audio is the silent killer on mobile web.** `preload="auto"` on 30+ MP3s starves bandwidth and the title track never plays. iOS WKWebView ignores audio session config and freezes the first `play()`. Service worker caches break Safari MP3 streaming via Range requests. Plan lazy loading + Range support + AVAudioSession warming **before** you have a music problem.

6. **iOS shipping has 15 specific gotchas you cannot Google in time.** Capacitor's `contentInset` setting silently confines your viewport. `@capacitor/assets` v3 needs `icon-only.png` not `icon.png`. Universal apps need `UIRequiresFullScreen=true` for landscape lock. Privacy URL must be reachable before submission. We tripped every one of these. See `13_MOBILE_PWA_AND_IOS_SHIPPING.md`.

7. **Backgrounds need to be designed for gameplay, not for beauty.** A breathtaking parallax that obscures the player or visually competes with enemies is broken. We finally figured this out building Adventure City: foreground silhouettes at high opacity, midground saturated, far-background hazed. The painter's-rule for clarity matters more than the painter's-rule for prettiness.

8. **Version every release in lockstep across THREE files.** `SDD.VERSION` in code + `CACHE_NAME` in service worker + `MARKETING_VERSION` in CI config. Miss one and you ship a build users can't even see because their service worker holds the old version.

9. **AI sessions die, fill up, and forget.** Without a persistent handover file (`CLAUDE.md` in our case), every session reinvents the wheel. Write the handover *first*, edit it *often*, treat it as the source of truth.

10. **Ship one tiny thing end-to-end before building anything else.** A black canvas with a moving square that you got onto a real iPhone via TestFlight teaches you more than four weeks of feature work. We didn't do this first. We learned every pipeline bug at v0.85.

## ⚠️ Do not repeat these mistakes

- ❌ **Don't start without a render-resolution plan.** "We'll figure it out later" = a multi-day refactor at v1.0.
- ❌ **Don't hand-code more than 2 levels** before you build the editor.
- ❌ **Don't ship MP3s without lazy loading.** 38 files at preload=auto crashes the title screen on slow networks.
- ❌ **Don't trust `@capacitor/assets` without verifying the icon shows up in the generated AppIcon.appiconset.** It can silently produce nothing.
- ❌ **Don't commit `node_modules`, `www/`, `ios/`, or any built artifact** to git. The build server makes those.
- ❌ **Don't put text labels at game x=160 if your view width might become dynamic.** Use `VIEW_W / 2`.
- ❌ **Don't write `innerHTML =` anywhere in production code** — XSS risk + makes auditing painful.
- ❌ **Don't paint cinematic backgrounds without a foreground silhouette plan.** They'll fight the gameplay layer.
- ❌ **Don't use `eval` or `new Function`.** Apple reviewers and security auditors look for these.
- ❌ **Don't decide engine choice after writing 5000 lines of vanilla JS.** Pick before line 1.
- ❌ **Don't trust an AI session that "remembers" something — verify in the file.** Sessions hallucinate continuity.
- ❌ **Don't ship without testing on a real device.** Puppeteer is not a phone.

## What this handoff WILL NOT do

- Teach you JavaScript or Godot syntax — find a tutorial.
- Make all decisions for you — context matters.
- Replace shipping your own first prototype — that's the only real teacher.

## A sentence to keep in mind

> *"The biggest predictor of a polished game is not the engine, the artist, or the AI — it's how early the team locked in their constraints and how brutally they policed scope against them."*

— from the trenches.
