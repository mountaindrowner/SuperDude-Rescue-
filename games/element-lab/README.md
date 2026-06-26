# Super Dude Danny's Element Lab  ·  *ELEMENT LAB*

A physics merge/drop puzzle (Suika / Watermelon-Game style) built in **Phaser 3 +
Matter.js**. Tweezers drop elements into a beaker; two of the same element fuse
into the next element up the periodic chain — climb from Hydrogen all the way to
**Uranium** without overflowing the beaker.

It's a **sub-game**: it plugs into a parent game and hands control back cleanly,
and it never destroys the Phaser instance itself.

---

## Run it

No build step. Everything is vanilla JS + a vendored copy of Phaser, so you can
just serve the folder and open it:

```bash
# from games/element-lab/
python3 -m http.server 8000
# → open http://localhost:8000/
```

(Opening `index.html` directly via `file://` also works in most browsers.)

There are **zero binary art/audio assets** — every sprite is drawn procedurally
at load (`src/textures.js`) and every sound is synthesized with the Web Audio API
(`src/audio.js`). Phaser is vendored at `vendor/phaser.min.js` so the Lab runs
fully offline and bundles cleanly into the native app.

---

## Integrating it into the parent game

Two paths, per the build brief §8. Either way **Exit never calls
`game.destroy()`** — it calls the injected `onExit()` callback, or emits a
`dannylab:exit` event as a fallback.

### Path A — parent is also Phaser (shared canvas)

```js
DANNYLAB.installInto(parentPhaserGame);          // registers all DANNYLAB_* scenes
parentScene.scene.start('DANNYLAB_Boot', {
  onExit: () => parentScene.scene.start('ParentGameSelect'),
  lang: 'en',           // 'en' | 'es'
  audioEnabled: true,
  musicEnabled: true,
});
```

### Path B — parent is NOT Phaser (e.g. the Super Dude Danny canvas game)

Mount a dedicated `Phaser.Game` into a container `<div>` and pass the same
payload. From the host page, load `vendor/phaser.min.js` and `src/*.js`
(see `index.html` for the order), then:

```js
const lab = DANNYLAB.launch({
  parent: 'dannylab-root',                 // id of a container div
  onExit: () => {                          // hand control back to your menu
    document.getElementById('dannylab-root').style.display = 'none';
    showMainMenu();
  },
  lang: 'en', audioEnabled: true, musicEnabled: true,
});
```

To wire it into the main canvas game, drop a "Element Lab" button on the title
screen that shows the container and calls `DANNYLAB.launch(...)`; the `onExit`
callback hides it again. The sub-game persists its own data under `dannylab.*`
localStorage keys, so it never collides with the parent's saves.

---

## Tuning

Everything balance-related lives in **`src/config.js`** (`DANNYLAB.CONFIG`):
the element chain (radius / colour / symbol), drop weights, scoring, combo and
overflow timing, and the fission rules. Edit numbers there to rebalance or
reskin the whole chain without touching game logic.

All player-facing copy (EN + ES, in Danny's voice) lives in **`src/i18n.js`**.

---

## Source layout

| file | role |
|---|---|
| `config.js`     | tunable CONFIG block + derived constants + tier helpers |
| `i18n.js`       | EN/ES strings, element names, "Lab Notes" fun facts |
| `store.js`      | namespaced `dannylab.*` localStorage wrapper |
| `audio.js`      | synthesized SFX + ambient music (Web Audio) |
| `textures.js`   | procedural sprite generation (balls, faces, glow, particles) |
| `ui.js`         | reusable chunky buttons / panels / toggle rows |
| `background.js` | layered parallax lab (poster, shelves, light shaft, dust) |
| `boot.js`       | stores the §8 integration contract in the registry |
| `preload.js`    | builds textures, waits for the font |
| `menu.js`       | main menu (Play / How to Play / Options / Exit) |
| `game.js`       | the core merge loop, physics, cascade, overflow, fission |
| `overlays.js`   | Pause / Options / Confirm / GameOver / HowTo / Discovery / Collection |
| `main.js`       | Phaser config, scene registry, exit contract, mount API |

## Tests (dev only)

`test/smoke.mjs` and `test/flows.mjs` are headless Playwright checks (boot →
play → merge → cascade → pause → overflow → game-over, plus fission and EN/ES).
They need `npm i playwright-core` and a Chromium binary; they are **not** part of
the shipped game.
