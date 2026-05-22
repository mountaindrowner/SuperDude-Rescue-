# Super Dude Danny

A kid-friendly retro platformer built as a proof of concept. Help Super Dude
Danny — a scientist stranded in time — journey through God's seven days of
creation, collecting power cores and time-machine parts to get home.

This proof of concept contains the full game framework (title card, menu,
animated intro, 7-day overworld map, results screen) plus a complete, playable
**Day 1: Light & Darkness**.

## How to play

Open `index.html` in any modern web browser — no install and no build step.
It also works on phones and tablets, where on-screen controls appear
automatically.

### Controls

| Action          | Keyboard          | Touch    |
| --------------- | ----------------- | -------- |
| Move            | Arrow keys / WASD | D-pad    |
| Jump (A)        | Space / Z         | A button |
| Light Blast (B) | X / J             | B button |
| Pause           | Esc / P           | —        |

Stomp enemies or zap them with the light-blast power-up, collect power cores,
grow bigger with the growth power-up, and reach the time-machine part to
complete the day.

## Project layout

- `index.html` — entry point
- `css/` — page styles and touch-control layout
- `js/` — game code: engine, entities, scenes, level data, audio, sprites
- `assets/` — drop the real Church of the Crossroads logo here as `logo.png`
  (see `assets/README.txt`); all other art and music are generated in code

Built with the HTML5 Canvas and Web Audio API. No dependencies.
