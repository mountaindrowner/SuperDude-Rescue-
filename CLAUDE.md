# Portion Control - standalone branch

**This branch IS the game.** Develop Portion Control here:
`claude/portion-control-standalone`. The repo root is the game root.

- It was split out of `games/portion-control/` on
  `claude/portion-control-vslice` (2026-11-10, `git subtree split`, full
  history kept). That old branch is history now; do not develop there.
- The Super Dude Danny **platformer** lives on its own trunk
  (`claude/super-dude-danny-platformer-Jftc7`) and is not on this branch.

## Read first

1. `HANDOVER.md` - living state, newest entry first.
2. `COMPENDIUM.md` - design law. `PIXELLAB.md` before generating ANY art.
3. `itch/PAGE.md` - the itch.io launch kit.

## Standing rules

- Commit and push after every change (`git push -u origin claude/portion-control-standalone`);
  the environment is ephemeral and only pushes survive.
- Bump `PC_BUILD` in `index.html` and `version.json` together on every ship.
- Keep `HANDOVER.md` updated. Never open a PR unless asked.
- ES5, plain script tags, `window.PC` namespace, no bundler.
- `PC.RELEASE = true` (src/config.js): dev mode is `?dev=1` only, and every
  test hook (gallery, G/T keys, boss arena, `?roof`, `?chomptest`,
  `?unlock`) is gated on it. Keep new debug hooks behind `PC.DEV_MODE`.
- All storage access goes through try/catch: itch.io embeds the game in a
  cross-site iframe where blocked storage THROWS.
- Player-facing text: kid-safe, and no em dashes.
- Test harness: Playwright (`require('playwright')`, preinstalled Chromium),
  canvas renderer forced by denying WebGL, viewport 402x874 or 480x854.

## Build the itch upload

`tools/build_itch.sh` -> `dist/portion-control-<version>-itch.zip`.
