# 12 — Menus, UI, and Game Flow

## Why menu flow matters more than you think

A game can have brilliant gameplay and feel cheap if the menu flow is sloppy. Conversely, a modest game with **polished menus** feels professional. Players judge polish by the seconds *between* the gameplay, not during it.

This file documents the menu inventory you need and the rules for making them feel good.

## The full menu inventory

For a single-player platformer, plan to build:

| Scene | Purpose | First-build priority |
|---|---|---|
| **Logo / Splash** | Brand card, masks loading time | Day 1 |
| **Title screen** | Press-A entry point | Day 1 |
| **Main menu** | New game / Continue / Options / How to play | Day 1 |
| **New game / Slot picker** | Pick difficulty / save slot | Day 5 |
| **Erase confirm** | Don't delete saves accidentally | Day 10 |
| **Options** | Music + SFX volume, mute, language | Day 5 |
| **How to play** | Controls explanation | Day 5 |
| **Overworld** | Level selector | Day 7 |
| **Stage intro** | "DAY 1-1 — LIGHT AND DARKNESS" card | Day 7 |
| **Level** | The game itself | Day 1 |
| **Pause menu** | Resume / Restart / Options / Quit | Day 8 |
| **Results / Stage clear** | Time, cores, "Continue?" | Day 8 |
| **Game over** | Lives ran out, restart? | Day 8 |
| **Quiz** | Bible quiz between days (project-specific) | Day 15 |
| **Lesson** | Scripture lesson after stage (project-specific) | Day 15 |
| **Finale** | Game-complete cinematic | Day 25 |
| **Cinematics** | Intro, secret-unlock alert | Day 25 |

That's 17 scenes for a small game. Plan for all of them. **Don't try to ship without any of these — players will notice the missing pieces and the game will feel half-done.**

## Title screen

The first thing the player sees after the logo card. Should:
- Show your game's name prominently
- Show ONE action: "Press any key" or "Tap to start"
- Have music starting after the first user gesture
- Look like a poster, not a menu

Avoid:
- Multiple options on the title screen (use a main menu after, separately)
- Tiny "click here to start" text that's hard to spot
- Long auto-advance timer (let the player set the pace)

## Start button / first input

The first input on the title is the audio unlock gesture. Critical: this is the moment you can start music. Use it.

Pattern: title shows → user taps → music starts + transition to main menu. The user doesn't notice; you've smuggled in the audio init.

## Level select / overworld

We used a "creation map" overworld: 13 island icons connected by paths, player walks across to enter a level. Worked great. Players see progress visually.

**Alternative patterns:**
- Linear list (1-1, 1-2, 2-1, …) — fine for simpler games
- World map (Mario-style) — like ours
- Hub area (Sonic Adventure) — more game effort

For kid-friendly: visual icons > text list. Even non-readers can navigate.

## Pause menu

Mandatory for any game longer than 30 seconds. Options:
- **Resume** — back to play
- **Restart level** — restart with current life count
- **Options** — open options sub-menu
- **Quit to map** — exit level

Always **Resume is first** and selected by default. Player who hit pause by accident can just hit A and be back.

Pause should:
- Freeze the world completely
- Dim or darken the background
- Use the same input controls as menus (up/down/A)

Pause should NOT:
- Block the screen totally (player still wants to see where they are)
- Take long to open or close (instant response)
- Trigger SFX too aggressively

## Settings / options

Must include:
- Music volume slider
- SFX volume slider
- Mute toggle (or "everything off" master)
- Optionally: language, difficulty (if not per-slot)

Should be accessible from BOTH the main menu AND the in-game pause menu, using the same code.

## Mute / music controls

On mobile: a quick mute button somewhere accessible. We didn't add one to the in-game HUD. Should have — kids playing in public places need quick mute.

For next project: a small speaker icon button on the HUD, top-left or bottom-left. Tap to toggle mute. Single button, three states (full / SFX only / silent) is fine.

## Mobile buttons (touch UI)

The full touch control layout we settled on:
- **Virtual joystick** on the left half — appears where the player touches, drag to move
- **A button** on the bottom-right — large, primary action
- **B button** to A's left — smaller, secondary action
- **Pause button** top-right of canvas — small, semi-transparent, only visible during gameplay

### Rules
1. **Touch zones are larger than visual buttons.** A button's hit area extends 8 px beyond its visual edge so finger imprecision still registers.
2. **Pointer capture on press** keeps the button held even if the finger drifts off the visual.
3. **Don't release on `pointerleave`** — release only on `pointerup` or `pointercancel`. Otherwise finger rolling slightly off the button releases it.
4. **Buttons anchored to canvas edges**, not viewport edges — important if the canvas letterboxes or has safe-area insets.
5. **Safe-area aware positioning** on iPhone — push buttons inboard from the notch and home indicator.

This took us many iterations. Lock these patterns in from day 1 next time.

## Game over

Brief, focused, not punishing:
- "GAME OVER" banner
- Brief sad music sting
- "Continue?" with countdown or "Press A" prompt
- Restart at the level you died on, NOT the start of the game

A game that punishes failure with long restart cycles is one that kids will rage-quit.

## Restart

Pause → Restart Level option restarts at the level start with full lives. Death → respawns at the last checkpoint. Two different concepts, both needed.

## Victory / stage clear screen

Brief celebration:
- "STAGE CLEAR!" banner
- Time, cores collected, any stats
- Auto-advance to next scene (overworld, quiz, lesson, finale)
- Don't make the player click through — celebrate, then move on

For final game-complete: longer cinematic, credits-style. We did this for the finale.

## Loading screen

Most games show one. Our project mostly skipped it (assets load fast at boot). For a bigger project: a progress bar during initial asset load is mandatory.

Pattern: progress bar 0-100%, "LOADING..." text, ideally with a tip or art card to make the wait feel intentional.

## Why menu flow matters — the principles

1. **Predictable.** Once a player learns "down arrow scrolls menus, A confirms, B goes back," that pattern works everywhere. Violating it anywhere is jarring.

2. **Fast.** Menus shouldn't take longer to navigate than they take to use. No "press A to confirm you want to confirm." Click → done.

3. **Reversible.** Every menu has a back path. B button or "BACK" option always works. Never trap a player in a menu they can't escape.

4. **Skippable.** Cinematics on first view are great. On replay, players want to skip. Add a "press A to skip" with a 1-second cooldown so they can't accidentally skip on the very first frame.

5. **Mobile-first.** Buttons large enough for finger taps. Spacing wide enough for thumbs. Tested on a real phone, not just desktop.

6. **Readable for kids.** Text large enough to read at arm's length on a phone. No tiny fonts.

7. **Consistent visual language.** Yellow = selected. Bright = available. Dim = disabled. Same in every menu.

## Mobile-first UI rules

- Touch targets ≥ 44×44 CSS pixels (Apple HIG minimum)
- Spacing between targets ≥ 8 px
- High contrast text (white-on-dark or dark-on-bright)
- Font size ≥ 14 px CSS
- Important controls in thumb-reachable zones (bottom half, sides)
- Avoid hover-only interactions (no hover on touch)

## Accessibility / readability rules for kids

- Larger text where possible. Don't shrink to fit if you can make room.
- Use icons + text together, not icons alone (younger kids can't always decode icons).
- Color + shape together (don't rely on color alone — colorblind kids exist).
- Read-aloud option if budget allows.
- Quick mute (kids playing in shared spaces).
- Pause that holds — younger kids will get interrupted; the game should be patient.

## Menu screen checklist

For every menu / scene:

- [ ] Has a clear single primary action (or short list of choices)
- [ ] Navigation pattern matches the rest of the game (same keys, same SFX)
- [ ] Has a back button / cancel path
- [ ] Selection state visible (highlight, arrow, animation)
- [ ] Sound effect on input (subtle "tick" or "ding")
- [ ] Music continues or transitions smoothly (no dead silence between scenes unless intentional)
- [ ] Works with keyboard, gamepad, AND touch
- [ ] Tested at the smallest target screen size
- [ ] No layout shift / jitter on input
- [ ] Reachable in < 3 taps from any point in the game

## A line to remember

> *"Polish is invisible when present and obvious when missing. Players never compliment a smooth menu, but they always remember a janky one."*

— from someone who fought touch-button anchoring for 6 versions.
