# 10 — Level Editor Lessons

## The single biggest lesson

**Build the level editor before you build the second level.**

We built ours roughly mid-project, after 4 hand-coded levels. The transition felt like switching from carving wood with a butter knife to using a saw. Levels 5–12 took a fraction of the time levels 1–4 had.

If we could rewind: editor exists by end of week 1.

## Why hand-coded levels become painful fast

In the first level you write:

```js
SDD.levels['1-1'] = {
  tiles: [
    "                                                            ",
    "                                                            ",
    // ... and so on
    "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  ],
  ...
};
```

You can hand-edit this. It's tedious but doable.

By level 4, you're:
- Counting tiles to figure out where to put a platform
- Re-counting because you miscounted
- Re-counting because the spawn coords are off
- Re-painting a whole row because you wanted to add one tile in the middle
- Wishing you had keyboard arrows for fine adjustment
- Hand-typing JSON for spawn entries
- Cross-checking that the player spawn is on a solid tile, not in midair, not inside a wall

By level 6, you're miserable.

By level 10, you've built half an editor anyway because you couldn't stand it.

**Build the editor first.** Even a bad one. Even a 200-line one. You will thank yourself.

## What the level editor allowed us to do

When `editor.js` was complete:
- **Paint tiles by clicking and dragging** — way faster than re-typing strings
- **Place entities by clicking** — pick a spawn type, click a tile, done
- **Edit entity parameters** in a side panel — adjust patrol range, speed, etc.
- **Preview live** — see the level rendered with the actual theme
- **Save/load to file** — via File System Access API on desktop Chrome, JSON download fallback elsewhere
- **Variant library** — store multiple versions per stage, swap which one is active
- **Layer toggle** — see all 5 parallax layers in the editor, not just tiles

By the end, designing a level was 80% editor + 20% playtesting. Should have been 100% editor from the start.

## Minimum viable level editor (MVLE)

For a small platformer, the absolute minimum:

### Required features (build these first)

1. **Tile palette sidebar** — clickable list of all tile codes. Click one to select.
2. **Tile painting on the canvas** — click on a tile cell, paint the selected tile. Drag to paint multiple.
3. **Entity palette sidebar** — list of all spawn types (player, enemy types, pickups, checkpoint).
4. **Entity placement on the canvas** — click a position, place the selected entity.
5. **Entity deletion** — right-click or shift-click an entity to remove.
6. **Save** — serialize to JSON, output via download or copy-to-clipboard.
7. **Load** — paste JSON or upload file, parse, render.
8. **Camera scrolling** — arrow keys or click-drag to move around a larger-than-screen level.
9. **Grid overlay** — visible tile grid so you know where you're clicking.

That's it. Nine features. ~500 lines of code. **You can build this in two days.**

### Stretch features (after MVLE works)

10. Undo / redo (Ctrl+Z) — saves dozens of accidental-paint headaches
11. Multi-select / box select for area edits
12. Copy / paste blocks of tiles
13. Per-entity parameter editor (sidebar form fields)
14. Live test (jump from editor into running game at this level)
15. Theme preview (background art renders behind the tile grid)
16. Layer toggle for parallax preview
17. Snap-to-grid (always on, but maybe a free-place mode for decorations)
18. Validation warnings ("player spawn is inside a wall," "no exit defined")
19. Variant library (multiple level versions stored)
20. Resize level (add columns / rows from any side)

### Dream editor (eventually)

21. Inline play-test with hot reload
22. Tile auto-tiling (smart neighbors — drop a "ground" tile, auto-pick the right corner/edge variant)
23. Animation preview for entities
24. Collision visualization (toggle to see what's solid)
25. Heatmap overlay (show areas the playtester died most)

## Editor architecture

### Recommended: the editor is a separate "scene" in your game engine

In Phaser: `EditorScene` alongside `GameScene`.
In Godot: an editor scene with its own UI.
In our vanilla version: `js/editor.js` registered itself as a scene via `SDD.scenes.editor`.

### Why the same engine

- The editor renders levels using THE EXACT SAME render code as the game. What you see in the editor is what you'll see in-game.
- Shared collision/preview code = no drift between editor preview and runtime.
- Easy jump from editor to play (just change scene).

### Why NOT a separate desktop app

- It's another tool to build and maintain.
- It has to re-implement everything (rendering, parallax, entity types).
- Versioning drift between editor and game = pain.

The level editor scene living inside the game = the single best architectural decision in this project's level pipeline.

## Connecting the editor to the game engine

Our pattern:
1. Editor scene loads the same `SDD.levels[id]` data as the game.
2. Edits update a local copy.
3. On Save, the local copy is serialized and either written via File System Access API (Chrome) or downloaded as a JSON file (other browsers).
4. The file is committed to git and shipped as part of `level_X_Y.js`.

For the next project, prefer JSON files in a `levels/` directory over JS files. They're easier to load, easier to validate, easier to merge.

## The "editor mutates the same object the engine reads" pattern

The single architectural choice that made this editor work reliably:

> *The editor mutates `SDD.levels[key]` directly. The engine reads the same object when entering a level. No parallel data structure. No file I/O at runtime. No sync layer.*

Sounds obvious; easy to violate accidentally. Many editor designs put the "current edit" in a separate object that you copy back to the live data on "save." That copy step is where bugs live — off-by-one indices, missed fields, version drift. Sharing the same object eliminates the entire bug class.

The flow:
- Click "EDIT" on a stage → editor takes a reference to `SDD.levels['3-2']`.
- Paint a tile → the editor writes directly into that object's `tiles` array.
- Click "TEST" → scene-switch to the level scene, which reads the same object. Your edit is live, no save needed.
- Click "SAVE" → serializer reads the same object, writes JSON to disk.

When all three (edit, play-test, save) read and write the same in-memory object, drift cannot happen. The downside is small: the object is mutated even if you "discard" — handled by reloading the original file from disk if needed.

## The COPY MAINS / EXPORT round-trip pattern (designer-in-browser + AI-in-terminal)

A specific solution to a real workflow problem in this project: **Mark edits levels in his browser; the AI session edits files in a terminal; how do those two stay in sync?**

The naive approach — File System Access API directly writes `level_X_Y.js` — works only on desktop Chrome/Edge. It silently fails on Safari, Firefox, and mobile. And Mark wanted to edit on a laptop sometimes too.

The robust pattern:

1. Editor exposes a **`COPY MAINS`** button. Clicking it emits all MAIN-flagged levels as a single JSON blob to the clipboard.
2. Mark pastes the blob into a chat message.
3. The AI session writes the JSON to the proper level files and commits.
4. Mark pulls the commit; his next browser load sees the updated levels.

A complementary **`IMPORT`** button accepts a JSON paste so Mark can apply someone else's level pack without a git pull.

Why this works:
- Clipboard-based handoff works in every browser. No FSAPI required.
- The blob is human-readable JSON. The AI can validate and pretty-print it before writing.
- The git commit gives the change a permanent record and a way to roll back.
- It cleanly separates "I'm designing" (browser) from "I'm shipping" (terminal/CI) without any sync layer.

For the next project, build the COPY/IMPORT pair on day 1 of the editor. It's ~30 lines of code and saves the entire "how do I sync edits back to the repo" question.

## Mistakes to avoid

1. **Editor save dropping fields.** Our serializer only wrote `width/height/tiles/spawns/movers/name/theme/themeZones`. It dropped `hint`, `startSign`, `towerEntrance`. Every editor save on Day 8-1 required manual re-attachment of those three fields. **Fix:** serializer copies all top-level fields, not a hardcoded subset.

2. **Editor and game using different render code.** Tempting to "simplify" the editor's render. Then the editor preview lies about what the game shows. **Fix:** editor uses the game's render functions.

3. **No undo.** Painting a wrong row, then having to re-type the previous row, is the worst. **Fix:** maintain a command history with `Ctrl+Z`.

4. **No tile snap.** Freehand painting at sub-tile precision = misaligned tiles. **Fix:** snap to grid always.

5. **No validation.** Letting designers ship levels with player-spawn-in-wall, no exit, unreachable platforms. **Fix:** on save, run validation, refuse with warnings.

6. **Editor in source control but shipped to users.** We had `js/editor.js` commented out in `index.html` for production, but the file still shipped in the bundle (anyone unzipping the IPA could see ~90 KB of editor code). **Fix:** exclude from build bundle entirely.

7. **Editor UI built in canvas instead of HTML.** Hard to make text inputs, dropdowns, sidebars usable when you're hand-drawing them on canvas. **Fix:** use overlay HTML elements for the UI, canvas for the level preview.

## Recommendation for next project

**Use Tiled (tiled.org).**

Tiled is the open-source level editor 90% of indie 2D games use. It has:
- Tile painting with auto-tiling
- Per-entity property editing
- Multiple layers (collision, decoration, foreground)
- JSON export
- Phaser, Godot, and most engines import Tiled JSON natively
- Free, no telemetry, no account

This eliminates the entire build-your-own-editor effort. Spend that time on actually designing levels.

**If for some reason you can't use Tiled** (e.g., need custom features it doesn't support), build the MVLE above and stop. Don't over-build. Tiled is 99% of what you'd build anyway.

## The big picture

For the project that ships v1: editor effort is one of the highest-leverage investments. **One hour of editor-building saves five hours of level-building.** Get to the editor early, even if it's ugly.
