# Portion Control

A Super Dude Danny adventure: a kid-friendly, survivors-like action game.
Super Dude Danny's Nourish-Ray buried Adventure City in junk food; rescue
the team, blast the snacks, and reach the top of Adventure Tower.

Plain HTML5 + [Phaser 3.80.1](https://phaser.io), no build step, no
bundler. Portrait-first, plays on phones and desktops.

## Run it locally

The game fetches its art and music, so it needs a web server (not
`file://`):

```sh
python3 -m http.server 8000
# open http://localhost:8000/
```

`?dev=1` turns on developer mode (boss arena on the mission map, gallery,
hotkeys, every hero unlocked, test gold). Players never see it otherwise.

## Two modes

- **STORY** - the eight-mission campaign (TECH / GOLD, the Upgrade Station).
- **SNACK ATTACK** - the survivors mode, built from Mark's *Vampire Survivors
  Game Template*: 15-minute runs, 6 weapons + 6 items, 8 weapon ranks,
  evolutions from chests, five level-gated stages, buyable heroes, a gold
  PowerUps shop with refund, 70 unlocks. Its own save
  (`portioncontrol.snack`), never shared with Story. Code in `src/snack/`
  (data, achievements, profile, unlocks, draft, chest, run) and
  `src/scenes/snack.js` (menus, results, pause).

```sh
node tests/snack_acceptance.js          # the template's section-23 checks (48)
node tools/snack_bot.js 6 street danny 8    # balance bot: 6 fresh runs, report
node tools/snack_bot.js 8 street danny 8 1  # same save across runs (progression)
```

## Ship to itch.io

```sh
tools/build_itch.sh
# -> dist/portion-control-<version>-itch.zip  (index.html at the zip root)
```

The store page kit (copy, settings, cover, screenshots, AI disclosure,
pre-publish checklist) lives in [`itch/PAGE.md`](itch/PAGE.md).

## Where things are

| Path | What |
| --- | --- |
| `index.html` | Entry point; `PC_BUILD` here and `version.json` are a lockstep pair |
| `src/` | Game code (`window.PC` namespace, one system per file, ES5) |
| `assets/art`, `assets/music` | Sprites (PixelLab) and soundtrack |
| `vendor/phaser.min.js` | Phaser 3.80.1 (MIT, see `CREDITS.txt`) |
| `tools/` | itch build script, map renderer, voice-script generator |
| `itch/` | Store page kit |
| `HANDOVER.md` | Living project state, newest first. Read this first. |
| `COMPENDIUM.md`, `PIXELLAB.md`, `docs/` | Design bible, art pipeline, specs |

History: this branch was split out of the Super Dude Danny platformer repo
(`games/portion-control/` on `claude/portion-control-vslice`) with
`git subtree split`, so the game's full commit history is preserved here.
