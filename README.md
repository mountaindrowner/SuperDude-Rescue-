# Super Dude Danny

A kid-friendly retro platformer that takes Super Dude Danny — a scientist
stranded in time — through God's seven days of creation. Collect power cores,
recover time-machine parts, learn a Bible verse between each day, and get him
home.

Built in plain HTML + CSS + JavaScript on top of the HTML5 Canvas and Web
Audio APIs. No build step, no dependencies. Runs in any modern browser, on
desktop, phone, or tablet.

## Play it

Easiest: open the live build in a browser.

```
https://raw.githack.com/mountaindrowner/SuperDude-Rescue-/claude/super-dude-danny-platformer-Jftc7/index.html
```

On phones and tablets you can use **Add to Home Screen** to install it as an
app — the game ships as a Progressive Web App, runs full-screen, and works
offline after the first visit.

To run a local copy, start any static server from the repo root and open
`http://localhost:8000/` (a server is needed so the music files load
correctly):

```sh
python3 -m http.server 8000
```

## Controls

| Action          | Keyboard                | Mouse / Touch |
| --------------- | ----------------------- | ------------- |
| Move            | Arrow keys / WASD       | D-pad         |
| Jump (A)        | Space / Z               | A button      |
| Drop through a one-way platform | Down + Jump | Down + A    |
| Light Blast (B) | X / J / Shift           | Left-click / B button |
| Pause           | Esc / P                 | Pause button (top-right) |
| Confirm menu    | Enter                   | A button      |

## What's in the game

- **12 stages across 7 days of creation** — Cosmic Void → Dawn Sky → Ocean
  → Mountains → Forest → Desert → Night Sky → Clouds → Underwater → Savanna
  → Creeping Things → Eden Garden, each with its own painted backdrop,
  enemies, and signature mechanic (cloud-glide, vine-maze, low gravity,
  flappy mode, underwater swim, falling-leaf streams, and more).
- **Three difficulty modes** — Easy (unlimited lives + checkpoints + slower
  forgiving platforms), Medium (checkpoints, classic three lives), Hard
  (no checkpoints, full restart on death). Each difficulty has its own
  save slot.
- **Bible verses between days** — at the end of each day you're given a
  fill-in-the-blank scripture from that day's creation passage (ESV). Get
  it right to unlock the next day. Hints are graduated so kids learn
  rather than just guess.
- **Per-stage signature power-ups** — each stage has one themed power-up
  hidden in a special block: pearl shell, cooling water, leaf shot,
  star jump, friendly bugs, pollen trail, beetle ride, dove blessing,
  and more. Each one shows a kid-readable hint on pickup.
- **Animated cinematics** — opening lab + cosmic-arrival intro, time-travel
  finale, plus an Eden setting before the trip home.
- **38 MP3 music tracks** — title, menu, intro, overworld, results,
  game-over, plus per-level main + variant themes that cycle on retries.
- **Painted backdrops** for the overworld map and several stages, with
  procedural overlays (clouds drifting over Dawn Sky, stars twinkling
  over Cosmic Void, water shimmering on Ocean).

## Project layout

```
index.html              entry point
manifest.webmanifest    PWA manifest
service-worker.js       offline cache
css/style.css           page + touch-control layout
js/                     game code (~13k lines)
  save.js               localStorage progress (per-difficulty slots)
  input.js              keyboard + touch input
  audio.js              chiptune synth + MP3 loader
  sprites.js            procedural pixel art + image loaders
  engine.js             physics, collisions, camera
  entities.js           player + enemies + items + signatures
  level_*.js            per-stage layout data (12 files)
  quiz_data.js          per-day scripture questions
  scenes.js             logo / title / menu / intro / overworld /
                        level / quiz / results / gameover / finale
  main.js               boot + scene manager + fixed-timestep loop
assets/
  music/                37 MP3 tracks
  *.png                 painted backdrops + icons
```

## Tech

- HTML5 Canvas 2D at a fixed internal resolution (320×180), scaled up with
  nearest-neighbour for crisp pixel art at any window size.
- Fixed-timestep game loop (60 Hz) for deterministic physics.
- Web Audio API with two paths: a synthesised chiptune fallback that always
  works, plus an MP3 loader that prefers the painted soundtrack when
  available.
- Three-slot save system in `localStorage`, with forward migration from
  earlier schema versions so existing players never lose progress.
- Service-worker shell so the game can be installed and played offline.

## Credits

Built for Church of the Crossroads. Title artwork, painted backdrops, and
custom music by Mark.
