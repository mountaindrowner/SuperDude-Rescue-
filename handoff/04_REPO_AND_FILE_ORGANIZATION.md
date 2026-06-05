# 04 — Repo and File Organization

## Why this matters more than you think

A messy repo costs you time on **every single session**. You spend cycles hunting for files, debugging path bugs, deciding where new things go. A clean repo is invisible — your brain stays on the game.

The Super Dude Adventures repo started clean and accumulated mess. By the end:
- `assets/` had folders with spaces in names (URL encoding bugs)
- `js/` had 24 files, some > 9000 lines, none in subfolders
- Audio lived in three different folders
- Legacy `Super Dude Danny Big Sprites/` lived alongside the rename to "Adventures"

We never fixed it. Here's how to not start there.

## Recommended folder structure

```
project-name/
├── src/                          # All gameplay source code
│   ├── scenes/                   # One file per scene (menu, level, lesson…)
│   ├── entities/                 # Player, Enemy, Pickup, etc.
│   ├── systems/                  # Audio, Input, Save, Camera
│   ├── data/                     # Level data, quiz/lesson data, constants
│   ├── ui/                       # HUD, menus, dialog renderer
│   └── main.js                   # Entry point
│
├── public/                       # Static files served as-is by the web host
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── service-worker.js
│   ├── privacy.html
│   ├── icons/                    # PWA icons (separate from in-game art)
│   └── assets/                   # All RUNTIME assets — what the game fetches
│       ├── sprites/              # Character + entity sprite sheets
│       │   ├── player/
│       │   │   ├── idle.png
│       │   │   ├── walk.png
│       │   │   ├── jump.png
│       │   │   └── meta.json     # Frame size, anchor, bbox per anim
│       │   ├── enemies/
│       │   │   └── …
│       │   └── ui/               # In-game UI sprites (buttons, etc.)
│       ├── backgrounds/          # Painted backdrops (one file per scene)
│       │   ├── lab.png
│       │   └── title.png
│       ├── tilesets/             # Tile sheets for the level editor
│       │   ├── ground.png
│       │   ├── cyber.png
│       │   └── meta.json         # Tile size, collision flags per tile
│       ├── music/                # Loopable BGM tracks
│       │   ├── title.mp3
│       │   └── level-01.mp3
│       ├── sfx/                  # Short sound effects (< 2 seconds)
│       │   ├── jump.mp3
│       │   └── pickup.mp3
│       └── fonts/                # If you use any
│
├── levels/                       # Level data files (one per level)
│   ├── level-01.json
│   ├── level-02.json
│   └── README.md                 # Level schema doc
│
├── tools/                        # Dev-only scripts, NOT shipped
│   ├── level-editor/             # The level editor (HTML page or module)
│   ├── sprite-bbox-measure.html  # One-off utilities
│   └── README.md
│
├── resources/                    # Source art (1024+ originals, layered files)
│   ├── icon.png                  # 1024x1024 app icon source
│   ├── icon-only.png             # Same as icon.png (for @capacitor/assets v3)
│   ├── splash.png                # 2732x2732 splash source
│   ├── concept/                  # Concept art, sketches, exploratory work
│   └── sources/                  # Layered PSDs / Aseprite files
│
├── docs/                         # Documentation (this handoff folder, design docs)
│   ├── handoff/                  # ← this folder
│   ├── DESIGN.md
│   ├── ART_STYLE.md
│   └── CHANGELOG.md
│
├── tests/                        # Test scripts (puppeteer / vitest / etc.)
│
├── build/                        # Build output (gitignored)
├── node_modules/                 # (gitignored)
├── ios/                          # Capacitor-generated iOS project (gitignored)
├── android/                      # Capacitor-generated Android project (gitignored)
│
├── package.json                  # Dependencies + scripts
├── package-lock.json             # Lock file (DO commit this)
├── capacitor.config.json         # If shipping mobile native
├── codemagic.yaml                # CI/CD config
├── netlify.toml / wrangler.toml  # Web host config
├── .gitignore
├── .env.example                  # Template for env vars (NEVER commit .env)
└── README.md                     # 5-line description + "see docs/handoff/00 for everything"
```

## File naming conventions

### Strict rules

- **`kebab-case`** for filenames: `player-idle.png`, `level-01.json`
- **`snake_case`** for IDs in code: `player_idle`, `level_01`
- **`PascalCase`** for class names: `Player`, `EnemyWalker`
- **`camelCase`** for variables / functions: `playerSpeed`, `loadLevel`
- **`UPPER_SNAKE_CASE`** for constants: `GRAVITY`, `TILE_SIZE`

### What never to do

- ❌ Spaces in filenames or folder names. *Ever.* You will URL-encode for the rest of the project's life. (We lost weeks to `assets/New Assets/Adventure city Music/SDDG city 2.mp3`.)
- ❌ Capital letters in URLs / file paths. Some servers are case-sensitive, some aren't. Pick lowercase, stay safe.
- ❌ Special characters: `!`, `@`, `#`, `%`, `&`, `(`, `)`, `'`, `"`
- ❌ Versions in filenames: `player_v2.png`, `final_final.png`. Use git. Never put version in a filename.
- ❌ Date prefixes: `2026-01-05_player.png`. Same reason.
- ❌ Author initials: `mk_player.png`. Same reason.

### Naming patterns to use

- Sprite sheets: `<entity>-<animation>.png` → `player-walk.png`, `enemy-attack.png`
- Music: `<scene>.mp3` or `<scene>-<variant>.mp3` → `title.mp3`, `level-01-a.mp3`
- SFX: `<verb>-<noun>.mp3` → `jump-small.mp3`, `pickup-coin.mp3`
- Levels: `level-<##>.json` (zero-pad: `level-01`, not `level-1`)
- Tilesets: `tileset-<theme>.png` → `tileset-cyber.png`, `tileset-grass.png`

## Why `public/assets` (or equivalent) matters

Web hosts serve `public/` (or `dist/`, `www/`, etc.) as the document root. Files outside are not reachable. Files inside are reachable. This is the boundary between "ships to user" and "stays dev-only."

**What goes in `public/`:**
- Anything the running game fetches at runtime: HTML, CSS, JS, images, audio, fonts, JSON level data, manifest, service worker, privacy page.

**What stays OUTSIDE `public/`:**
- Source art (`resources/`) — the 8K Photoshop file that produced the 1024 sprite. User doesn't need 8K.
- Dev tools (`tools/`) — the level editor stays in dev.
- Documentation (`docs/`) — handoff files, design docs.
- Tests (`tests/`).
- CI configs.
- Source `.aseprite` / `.psd` / `.kra` layered files.
- Anything > the final shipping bitrate / resolution.

If you mix them, you ship 200 MB of art sources to every user. We didn't (build script had an allow-list), but it's the easy mistake.

## How to prevent asset chaos

1. **Folder schema is law.** New asset = goes in the right folder based on type. No "I'll move it later." There is no later.

2. **Naming convention is law.** No spaces, no caps, no versions, no dates. Enforce in PR review or via a linter script.

3. **`meta.json` next to assets that need metadata.** Sprite folder has `meta.json` declaring frame size, animations, bboxes. Tileset has `meta.json` declaring collision tiles. Source of truth is the JSON, not the developer's memory.

4. **One asset per concept.** Don't keep `player-v1.png` and `player-v2.png`. Replace. Git remembers.

5. **Build script is an allow-list, not a deny-list.** Specify what to copy to `public/`/`dist/`. New files don't accidentally ship.

6. **Asset weight budget.** Decide before any art is generated: "level music ≤ 200 KB each, SFX ≤ 10 KB each, sprites ≤ 64 KB each, backgrounds ≤ 300 KB each." Enforce by reading file sizes in a script weekly.

## Example ideal folder tree (small platformer for next project)

```
super-dude-2/
├── src/
│   ├── scenes/
│   │   ├── boot-scene.js
│   │   ├── menu-scene.js
│   │   ├── level-scene.js
│   │   └── lesson-scene.js
│   ├── entities/
│   │   ├── player.js
│   │   ├── enemy-walker.js
│   │   └── pickup-core.js
│   ├── systems/
│   │   ├── audio.js
│   │   ├── input.js
│   │   └── save.js
│   ├── data/
│   │   ├── scripture.js
│   │   ├── quizzes.js
│   │   └── constants.js
│   └── main.js
│
├── public/
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── service-worker.js
│   └── assets/
│       ├── sprites/player/
│       ├── sprites/enemies/
│       ├── backgrounds/
│       ├── tilesets/
│       ├── music/
│       └── sfx/
│
├── levels/                       # Tiled .json files
│   ├── level-01.json
│   └── level-02.json
│
├── tools/
│   └── (Tiled is external; no internal tools needed)
│
├── resources/
│   ├── icon.png
│   ├── icon-only.png
│   ├── splash.png
│   └── sources/                  # Original Aseprite / Photoshop files
│
├── docs/handoff/                 # ← this knowledge base
│
├── package.json
├── capacitor.config.json
├── codemagic.yaml
└── .gitignore
```

## `.gitignore` template

```
# Dependencies
node_modules/

# Build outputs
build/
dist/
public/assets/  # if you generate these at build time
www/

# Mobile native projects (Capacitor generates these on the build server)
ios/
android/
.gradle/
*.xcuserstate

# IDE / editor scratch
.vscode/settings.json
.idea/
*.swp

# OS files
.DS_Store
Thumbs.db

# Environment / secrets
.env
.env.local
*.p8
*.p12
*.pem
*.key

# Logs
*.log

# Local config
.local/
.claude/
```

## Rules for what should never go where

- ❌ **Source art files (.psd, .aseprite, .kra)** in `public/`. They're huge and the user doesn't need them.
- ❌ **Tests in `src/`.** Tests live in `tests/`. Mixing means tests ship with the game.
- ❌ **Dev tools in `src/`.** Editor lives in `tools/`. Not loaded by the game.
- ❌ **CI configs in `src/`.** Top level only.
- ❌ **Audio files outside `public/assets/music/` or `public/assets/sfx/`.** Pick one location per type.
- ❌ **Level data inside `src/`.** Levels are data, not code. They live in `levels/` (or `public/assets/levels/` if loaded at runtime via fetch).
- ❌ **`node_modules/` ever committed to git.** It's gigabytes. Use `package-lock.json` for reproducibility.

## A clear rule for the next project

> *The folder you pick for an asset on Day 1 is the folder it lives in forever. There is no "we'll reorganize later." Reorganizing means breaking every path reference in the code. Pick correctly the first time.*
