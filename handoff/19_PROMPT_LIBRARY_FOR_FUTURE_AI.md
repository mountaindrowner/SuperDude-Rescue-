# 19 — Prompt Library for Future AI

Copy-paste-ready prompts for the most common tasks in a new project. Each is a starting point — adjust to your specifics.

## Project bootstrap

### Prompt: analyze a fresh repo

```
You are joining a new game development project. The repo is at [PATH].
Before doing anything:

1. Read these files in order: docs/handoff/00_README_START_HERE.md,
   docs/handoff/01_PROJECT_OVERVIEW.md, docs/handoff/04_REPO_AND_FILE_ORGANIZATION.md,
   docs/handoff/18_NEXT_GAME_RECOMMENDATIONS.md.

2. Run `git log --oneline | head -20` and tell me the most recent
   commits.

3. Run `cat package.json` and tell me what dependencies and scripts exist.

4. Show me the top-level folder structure.

5. Tell me in 5 lines:
   - What is this project?
   - What stack does it use?
   - What state is it in?
   - What conventions must I honor?
   - What would you suggest I work on next?

Wait for my response before doing anything else.
```

## Style bible

### Prompt: create a style bible for a new game

```
I'm starting a 2D pixel-art platformer for [AUDIENCE] with the theme
[THEME]. Help me lock in a style bible before I generate any art.

Required outputs:
1. Render resolution + aspect ratio recommendation, with rationale
2. Sprite frame size for characters (canonical), with rationale
3. Tile size, with rationale
4. Color palette: 5 hex codes that work together, named (e.g., "deep sky",
   "warm gold")
5. Character proportions (head : torso : legs ratio)
6. Animation set for the main character: idle, walk, jump, hurt, plus
   any genre-specific
7. Three reference games for visual style
8. Three pitfalls to avoid for this theme

Format the response as `docs/ART_STYLE.md` ready to commit.
```

## Parallax backgrounds

### Prompt: generate a parallax background for a new stage

```
Generate a 5-layer parallax background for a side-scrolling 2D platformer
stage. Theme: [THEME]. Render at [RESOLUTION].

For each of the 5 layers (far / mid-far / mid / near / foreground silhouette),
specify:
- What the layer contains
- Suggested parallax speed (typically 0.05 / 0.15 / 0.30 / 0.50 / 1.2)
- Color palette draw (use the project's locked 5-color palette: [LIST])
- Lighting direction and intensity

Then generate a complete image generation prompt I can paste into
[Midjourney / ChatGPT image / your tool] for each layer.

End with a checklist: how to verify the background works in-game once
the assets are in.
```

### Prompt: generate the next panel of an existing background

```
Here is the rightmost edge of an existing background panel [ATTACH or LINK].

Generate a continuation panel to the right that:
- Matches the existing palette exactly (do not introduce new colors)
- Matches the existing lighting direction
- Continues any midground silhouette so the join is invisible
- Introduces ONE new visual element for variety: [SPECIFY]
- Uses the same atmospheric perspective (haze / saturation gradient)
- Outputs as: layered PNG if your tool supports, else flat PNG with the
  locked 5-color palette
- Same resolution and aspect as the original

Then write a 1-paragraph note on what would need to change if a third
panel was added.
```

## Sprite work

### Prompt: create a master sprite character sheet

```
Generate a master character sheet for a 32×32 pixel art [DESCRIPTION].

Strict requirements (do not deviate):
- Frame size: exactly 32×32 px
- Feet anchor: bottom-center (x=16, y=30)
- Head: y=4 to y=12 (8 px tall)
- Torso: y=12 to y=22 (10 px tall)
- Legs: y=22 to y=30 (8 px tall)
- Proportions: 1:1.5:2 head:torso:legs (action-hero, NOT chibi)
- Color palette: exactly these 5 hex codes: [LIST]
- Black 1-px outline around the silhouette
- Visible eyes and feet
- Style reference: [GAME] sprite proportions
- Pose: idle, facing right

Output the master sheet only. Animations will come next, using this
sheet as the reference for consistency.
```

### Prompt: clean up an AI-generated sprite

```
Here is an AI-generated sprite [ATTACH]. It needs cleanup before going
into the game.

Checklist to apply:
1. Quantize the color palette to exactly these 5 hex codes: [LIST].
   Remove any in-between colors.
2. Confirm frame size is exactly 32×32. Crop or pad if not.
3. Confirm feet are aligned to y=30. Move the sprite up or down if not.
4. Confirm sprite center is at x=16. Move left or right if not.
5. Remove anti-aliased / sub-pixel rendering.
6. Ensure transparency is binary (alpha 0 or 255 only).
7. Check the silhouette reads clearly at 32×32.

Output the cleaned sprite plus a list of what changed.
```

## Tilesets

### Prompt: design a tileset for a new theme

```
Design a tileset for a [THEME] level in a 2D platformer. Tile size: 16×16.

Required tiles:
1. Solid ground (top edge, middle, bottom edge variants if needed)
2. Wall block
3. One-way platform (player can jump up through, land on top)
4. Decorative elements: 3-5 props (e.g., bushes, signs, rocks)
5. Hazard: spikes (or theme equivalent)
6. Special: [GAME-SPECIFIC]: e.g., breakable block, ladder, water tile

Output:
- A description / prompt for each tile
- A suggested arrangement on a sprite sheet (rows × columns)
- A Contents.json or equivalent metadata describing tile IDs

Then list 3 ways the tileset could be expanded later (more variants,
animated tiles, etc.) without breaking what we made first.
```

## Level design

### Prompt: design a level for the next stage

```
Design a level for [GAME], stage [N]. Theme: [THEME]. New mechanic
introduced: [MECHANIC].

Apply the "teach, test, twist" framework:
- Teach room: introduce [MECHANIC] safely with no other enemies
- Test room: require [MECHANIC] under mild pressure
- Twist room: combine [MECHANIC] with [OTHER ELEMENT]

Requirements:
- Length: ~60-90 seconds for an average player
- Difficulty: medium tier of 3 (easy / medium / hard)
- Include: 1 signature power-up pickup, 8-15 collectibles, 1 checkpoint,
  1 exit goal
- Background theme: [THEME]
- Tile codes available: [LIST]
- Spawn types available: [LIST]

Output:
- ASCII art tile map (rough)
- List of spawn positions with type and coordinates
- Notes on intended pacing
- Notes on what could break (places to playtest carefully)
```

## Level editor

### Prompt: build a minimal level editor

```
Build a minimum-viable-level-editor (MVLE) for [GAME] as a new scene
`scenes.editor`. It should:

1. Show a sidebar palette of available tile codes (clickable to select)
2. Show a sidebar palette of available spawn types
3. Render the current level in the main area
4. Click on a tile cell: paint the selected tile
5. Click and drag: paint multiple tiles
6. Right-click: erase
7. Click on a spawn type, then click on a position: place spawn
8. Camera scrolling via arrow keys or click-drag
9. Save: serialize level to JSON, output via download or copy-to-clipboard
10. Load: paste JSON or upload file
11. Grid overlay so I can see what I'm clicking

Use the game's existing render code so the editor preview matches the
game exactly. Editor should NOT modify the live level data — keep a
local copy and only commit on Save.

Add a hidden 'EDITOR' menu item that opens this scene. Don't ship it
in production builds.
```

## Audio debugging

### Prompt: debug audio not playing on iOS

```
Audio is not playing in the game. Specifically: [SPECIFIC SYMPTOM].
Platform: iOS Safari / WKWebView / [DETAIL].

Before suggesting fixes, ask me:
1. What error appears in the console (if any)?
2. Is audio reaching the device (network tab shows MP3 fetched)?
3. Is the first audio call inside a user gesture handler?
4. Is the service worker intercepting and what does it return for the
   first Range request?
5. What does Web Audio's `ctx.state` report?

Based on my answers, identify the likely cause from this list:
- Browser autoplay block (gesture not detected)
- AVAudioSession not warmed on iOS
- Service worker Range request returning 200 instead of 206
- preload="auto" on too many files starving bandwidth
- Audio file 404 or wrong MIME type
- ctx.state stuck on suspended (need resume())

Then propose the specific fix for that cause, with the relevant code.
Do not propose multiple fixes simultaneously.
```

## iOS / PWA shipping

### Prompt: prepare a game for iOS App Store submission

```
I'm preparing [GAME NAME] for iOS App Store submission. Walk me through
the pre-submission audit.

Check each of these in the repo:
1. capacitor.config.json — confirm contentInset: "never", appId matches
   the Bundle ID I registered
2. codemagic.yaml — confirm version bumps in lockstep, signing config,
   icon generation step (including sips fallback if @capacitor/assets
   has been flaky)
3. resources/icon.png AND resources/icon-only.png exist, both 1024×1024
   opaque PNG
4. Info.plist customizations for landscape lock + UIRequiresFullScreen
5. privacy.html exists at /privacy.html and is publicly hostable
6. App Store listing fields ready: name (≤30 chars), subtitle (≤30
   chars), description (≤4000 chars), keywords (≤100 chars), category
7. Screenshots at exact sizes: iPhone 6.7" = 2796×1290, iPad 13" = 2732×2048
8. Privacy questionnaire answer: "Data Not Collected" if applicable
9. Encryption compliance: ITSAppUsesNonExemptEncryption = false in plist
10. Service worker cache version bumped

For each, report PASS / FAIL with the specific file:line if FAIL.

End with a "ready / not-ready" verdict and a list of must-fixes.
```

## Session handoff

### Prompt: write a session handoff entry

```
Add a new entry to CLAUDE.md (or HANDOVER.md) summarizing what we just
did this session. Keep it under 200 words.

Include:
- Current version after this session's work
- Major changes (1-3 bullets)
- Any gotchas discovered that future sessions should know
- What's currently in progress vs. shipped
- Any known issues introduced or not yet fixed

After writing the entry, show me the diff so I can review before
committing.
```

### Prompt: recover after a session compaction / restart

```
This is a continuing session. Before doing any new work:

1. Read CLAUDE.md fully (or docs/handoff/00_README_START_HERE.md if
   CLAUDE.md doesn't exist).
2. Read the last 3 commits' messages.
3. Run `git status` and tell me what's currently modified.

Summarize in 5 lines what was happening, what's current, and what I
should work on next. Do not assume anything. Verify from files.

Then wait for my next request.
```

## Documentation

### Prompt: generate documentation for an existing system

```
Generate developer-facing documentation for the [SYSTEM] in this
project. Read the relevant source files first, then write the doc as a
Markdown file at `docs/[SYSTEM].md`.

Required sections:
- Overview (1 paragraph: what this system does, why it exists)
- Architecture (how the parts fit together)
- Public API (functions and parameters)
- Gotchas (known issues, edge cases, things to watch for)
- Common tasks (how to do typical operations)
- Where to extend (if I need to add a feature, where do I add it?)

Be specific. Cite file:line for code references.
```

## Refactoring

### Prompt: plan a refactor for a large file

```
File [PATH] has grown to [LINES] lines. Propose a refactor plan to split
it into smaller modules.

Constraints:
- Maintain backward compatibility — existing callers should still work
- Don't change behavior, only structure
- Each new module should be under 1000 lines
- Group by responsibility, not by chronology

Output:
1. A proposed module split with file names and a 1-line description of
   each
2. The order in which to do the refactor (least risky first)
3. A list of files that will need their imports updated
4. Risks and mitigations

Don't make any changes yet. Wait for my approval of the plan.
```

## General principles

These prompt patterns work across the board:

- **Specific over vague.** "Fix the bug at file:line because it does X but should do Y" > "fix the bug."
- **Constrain the scope.** "Only modify the audio system. Don't touch other files." > "improve audio."
- **Demand verification.** "Show me before applying." > "go ahead."
- **Reference docs.** "Following the conventions in docs/handoff/04..." > unspecified style.
- **Demand grounding.** "Read the file first. Don't assume." > acting on memory.

Use these patterns consistently and AI sessions produce more reliable output across the project's life.
