# 17 — Testing, Debugging, and Visual QA

## Why QA happens late on solo / small projects (and why that's a mistake)

Solo + AI-assisted projects skip QA in favor of "I'll just test it as I build." This works for the first 10 hours. By hour 100, you have a backlog of small bugs that interact in surprising ways. By hour 500, you can't tell what's new vs. old breakage.

We hit this. The Adventure City stage shipped with tunnel-loading bugs we missed for weeks because we tested on desktop. The icon shipped as a placeholder twice because we didn't visually verify the build output.

This file: the testing patterns that catch bugs before they ship.

## Screenshot testing

The single highest-value QA habit. Add this from day 1.

### What it is
Open a level. Capture a screenshot. Compare to expectation. Catch regressions.

### How to automate

```js
// Headless puppeteer script
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 852, height: 393 });
await page.goto('http://localhost:8000');
// Wait for ready
await page.waitForFunction(() => window.GAME_READY);
// Enter the level
await page.evaluate(() => {
  GAME.setScene('level', { day: 4, stage: 1 });
});
// Wait a few frames
await new Promise(r => setTimeout(r, 200));
// Screenshot
await page.screenshot({ path: '/tmp/level-4-1.png' });
```

We did this throughout the project for sanity-checks. Should have automated it as a CI step.

### What to screenshot
- Every menu scene at idle
- Every level at start (player spawn)
- Every level mid-stage (camera in middle)
- Every level at end (near goal)
- Every cinematic at key beats
- HUD states (full, low time, low lives)

## Checking layers render correctly

Visual issue: a parallax layer doesn't draw, or draws at the wrong scroll speed.

### Test
- Toggle each layer individually (some debug key or query string)
- Confirm each layer's content is correct in isolation
- Confirm layered together they read correctly

Build a `?debug=layers` mode that draws each layer with a tinted overlay so you can see them separately.

## Checking player appears in right place

Symptoms: player spawns inside a wall, falls through the floor, or appears off-screen.

### Test
- For every level: load it, check player y-coord against the floor tile y. Player feet should be at floor-tile-top.
- For every level: confirm player is visible in the initial camera view.

Automate this. Loop through all levels, check `player.x` and `player.y` are within expected bounds, fail the test if not.

## Checking collisions

Symptoms: walk through walls, fall through floors, jumps go through ceilings.

### Manual test
- Walk left edge → wall stops me
- Walk right edge → wall stops me
- Stand on platform → don't fall
- Walk off platform edge → fall (with gravity)
- Jump into ceiling → bonk, don't pass through
- Stand on one-way platform from below → pass through
- Stand on one-way platform from above → stay

### Automated test
Spawn player at known positions, simulate fixed inputs for fixed durations, assert final positions.

## Checking animation frame math

Symptoms: animation plays at wrong speed, wrong frames, or doesn't loop.

### Test
- For each animation: count frames in the sprite sheet
- Run the animation at runtime
- Confirm frame timing matches expected (e.g., 8 frames at 12 fps = 0.667s cycle)
- Confirm looping behavior is correct (loop, ping-pong, or one-shot)

Build a sprite preview page (`tools/sprite-preview.html`) that shows every animation cycling at runtime. Visual catch of frame issues.

## Checking controls

### Manual test
- Keyboard: arrow keys move, space jumps, X blasts, P pauses
- Touch: joystick moves, A jumps, B blasts, pause icon pauses
- Gamepad: standard mapping works

### Automated test
- Synthesize keyboard events; assert player moves
- Synthesize touch events; assert touch UI registers

## Checking mobile controls

What the simulator catches:
- Layout
- Basic touch interaction

What the simulator does NOT catch:
- Latency / responsiveness feel
- Accidental edge-of-button releases
- Multi-touch interactions (joystick + A simultaneously)
- iOS magnifier loupe popping up
- Whether the joystick feels "draggy" or "snappy"

**Mobile controls must be tested on a real device.**

## Checking audio

### Manual test
- Title music starts on first tap
- Level music starts on level entry
- SFX play with low latency
- Music transitions are smooth
- Volume sliders work
- Mute mutes

### Common audio bugs
- Music doesn't start on first cold load (autoplay block)
- Music delays many seconds (preload starvation — see audio doc)
- First SFX stutters (audio session not warmed)
- Audio survives backgrounding (verify on phone)

## Checking performance

### Local check
- Open DevTools Performance tab
- Record 5 seconds of gameplay
- Look at frame timing — should be flat 16.6ms per frame
- Look for long tasks (> 50ms)

### Mobile check
- Use Safari iOS DevTools (connect iPhone to Mac, develop menu)
- Run Timeline / Performance recorder
- Confirm 60fps on the target device
- If lower, profile to find the hot function

### Common perf killers
- Painting parallax layers every frame (we hit this; fixed by caching)
- Per-frame allocations (object pools help)
- Filter / shadow on canvas (can be slow on mobile)
- Excessive draw calls (batch where possible)

## Checking loading

### Test
- Fresh page load (clear cache, reload) — how long until playable?
- Re-load (with cache) — how long until playable?
- Offline load — does it work after first cache?
- Cold network — does the title music load eventually?

### Common loading bugs
- All MP3s preload=auto (bandwidth crisis)
- Service worker doesn't catch requests (broken offline)
- Cache version not bumped (users see old build)

## Repeatable QA checklist

Run this before every shipped build:

### Boot
- [ ] Logo card displays
- [ ] Title screen displays
- [ ] First tap starts music
- [ ] Main menu appears
- [ ] All menu items navigate

### New game
- [ ] Picking difficulty starts intro
- [ ] Intro plays / can be skipped
- [ ] Overworld appears
- [ ] Day 1-1 is selectable

### Gameplay
- [ ] Level loads
- [ ] Player spawns correctly
- [ ] Player can move
- [ ] Player can jump
- [ ] Collision works (walls, floors, platforms)
- [ ] Enemies move and animate
- [ ] Cores can be collected
- [ ] HUD updates
- [ ] Camera follows player
- [ ] Player can die and respawn

### Level completion
- [ ] Reaching goal ends stage
- [ ] Results screen shows
- [ ] Returns to correct next scene (overworld, quiz, lesson)

### Pause
- [ ] P / pause button pauses
- [ ] Resume works
- [ ] Restart works
- [ ] Options accessible
- [ ] Quit returns to overworld

### Audio
- [ ] Music plays on title
- [ ] Music plays on level
- [ ] Music changes between scenes
- [ ] SFX play (jump, stomp, pickup, blast)
- [ ] Volume sliders work

### Settings
- [ ] Music volume change persists across reload
- [ ] SFX volume change persists
- [ ] Mute persists

### Save
- [ ] Save persists across reload
- [ ] Continue resumes correct stage
- [ ] Each difficulty slot has independent progress
- [ ] Erase confirm works

### Mobile (test on real device)
- [ ] Joystick works
- [ ] A button works (including at edges)
- [ ] B button works
- [ ] Pause button works
- [ ] Audio survives backgrounding
- [ ] No magnifier loupe on drag
- [ ] No accidental zooming
- [ ] HUD readable past notch
- [ ] Canvas fills screen edge-to-edge

### Offline
- [ ] After first cache, app loads offline
- [ ] No "missing asset" errors

### App Store build (if applicable)
- [ ] Icon shows on home screen (not placeholder)
- [ ] App launches to title screen
- [ ] Landscape lock works
- [ ] Performance acceptable

## Common bugs we learned to watch for

### Sprite frame mismatch
- Symptom: animation displays wrong frames, or stretches
- Cause: frame size in code doesn't match sprite sheet
- Fix: verify frame width/height matches sheet exactly

### Wrong bounding boxes
- Symptom: player clips into wall, or dies without touching enemy
- Cause: collision box wrong size or wrong position
- Fix: enable HitboxDebug overlay, verify boxes visually

### Collision phase-through
- Symptom: player passes through solid tile at high velocity
- Cause: collision check doesn't account for entity moving more than one tile per frame
- Fix: implement swept collision, or cap velocity

### Unreachable platforms
- Symptom: a platform the player can never reach
- Cause: level design didn't test the actual jump arc
- Fix: walk the level start to finish, verify every platform is reachable

### Audio not playing
- Symptom: silence on first load
- Cause: tried to play before user gesture, or chiptune fallback, or wrong MP3 path
- Fix: see audio document

### Background layer problems
- Symptom: gap between tiles, wrong scroll speed, layer doesn't draw
- Cause: pre-rendered canvas wasn't built, or parallax math is wrong
- Fix: verify the cache canvas exists, check parallax speed values

### Mobile layout issues
- Symptom: buttons hidden, UI off-screen, controls don't register
- Cause: anchor to viewport instead of canvas, or hardcoded pixel positions that don't scale
- Fix: anchor to canvas, use vmin/vw/vh units, test on multiple screen sizes

### Asset path errors
- Symptom: blank image, silent audio, broken background
- Cause: file path wrong, file not in build, URL encoding issue
- Fix: open DevTools Network tab, look for 404s

## Investment over time

The QA habits compound:
- Building screenshot tests on day 5 catches regressions on day 50
- Building a real-device test workflow on day 5 catches mobile bugs by day 50, not day 500
- Building a per-level smoke test on day 5 catches level-load bugs constantly

The teams that ship polished games:
- Test on real devices weekly from day 1
- Have a 1-hour QA pass before every shipped build
- Automate the obvious checks
- Trust nothing without verifying

The teams that ship buggy games:
- Test in DevTools "and it looked fine"
- Skip QA before ship
- Trust the AI's "it works now"
- Find out from users
