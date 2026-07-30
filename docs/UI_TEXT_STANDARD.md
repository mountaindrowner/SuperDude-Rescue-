# PORTION CONTROL — UI & TEXT STANDARD

*Written after Mark's v0.20.1 screenshot: "inspect all text and text boxes for dialogs, they almost
always spill out and are too small or not formatted well. Create some rules to standardize quality."*

**The audit that prompted it:** 98 text objects across the game, using **fifteen** different font
sizes from 6px to 26px with no system, and **only 7 of them declared a wrap width** — so 91 could
overflow their container. Level-up cards explained what they did in 7px. The dialogue box was a
fixed 74px tall no matter how much text went into it, its text column started 6px *inside* the
portrait well, and it sat 8px off the bottom of the screen — under the home indicator on a phone,
with the version stamp printed inside it.

Implementation lives in `src/systems/ui.js` (`PC.TYPE`, `PC.SAFE`, `PC.ui`).

---

## The six roles — never pick a raw px size

| Role | Size | Line | Use for |
|---|---|---|---|
| `micro` | 8 | 2 | Build stamp, fps readout. **Things the player never has to read.** |
| `caption` | 9 | 3 | Secondary labels, costs, sub-lines, speaker names |
| `body` | 11 | 4 | **Anything that forms a sentence** — dialogue, card descriptions, briefs |
| `label` | 13 | 4 | Buttons, banners, row titles |
| `title` | 18 | 5 | Screen headers |
| `display` | 26 | 6 | Logo and hero moments |

```js
PC.ui.text(scene, x, y, 'DEFEAT THE BROCCOLISK', 'label', { color: '#f7f4ef', onWorld: true });
```

---

## The rules

**R1 — Pick a role, not a number.** If a new size feels necessary, the layout is wrong or the scale
needs a new role. Adding a sixteenth ad-hoc size is how we got here.

**R2 — Sentences are never smaller than `body` (11px).** 8px and below is reserved for stamps. On a
~400pt phone, one logical px is ~1.3pt, so 7px reads at about 9pt — too small for a kid holding a
phone at arm's length. The level-up cards violated this worst: the text that explains what a
power-up *does* was the smallest text in the game.

**R3 — Any text whose content can vary declares a wrap width, or goes through `PC.ui.fit()`.**
Dialogue, mission names, hero names, card descriptions, landmark labels. `fit()` shrinks a single
line toward a floor and then ellipsizes; wrapping is for multi-line copy.

**R4 — Panels are measured from their text, never hardcoded.** `PC.ui.panelFor(gfx, txt, pad)`
sizes the box from `txt.getBounds()`. A fixed-size box with variable text inside is the definition
of a spill — that was the dialogue box's whole problem.

**R5 — Respect the safe area.** Nothing closer than `PC.SAFE` (10px) to any edge; bottom-anchored UI
clears `PC.SAFE_BOTTOM` (16px) for the phone home indicator. Bottom-right is *dialogue territory* —
the ▼ advance arrow lives there, so nothing else may. (This is why the in-game build stamp moved to
the top-right.)

**R6 — Text over gameplay carries a stroke or a panel.** Never bare text on a moving background.
`PC.ui.text(..., { onWorld: true })` adds the stroke automatically.

**R7 — A dialogue box never exceeds ~45% of screen height.** Past that, the copy is too long: split
it into two beats. Enforced by test, not by truncation.

---

## Dialogue box anatomy (`src/story/dialogue.js`)

```
 SAFE ├─────────────────────────────────────────────┤ SAFE
      │ PAD                                          │
      │  ┌────────┐   VIC            ← caption, gold │
      │  │portrait│   Body copy wraps inside its own │
      │  │  well  │   column and the box GROWS to    │
      │  └────────┘   fit it.                     ▼  │  ← inside, padded
      │ PAD                                          │
                     SAFE_BOTTOM
```

- `PAD` 9 · portrait 52 in a 62 well · `GAP` 10 between well and text column
- Text column x = `SAFE + PAD + WELL + GAP` — it **clears the portrait**, which the old layout didn't
- Height = `max(WELL, nameH + textH) + PAD*2`, measured per line via `PC.ui.measure()`
- Minimum 2 lines so one-word lines don't make the box jitter between beats

---

## Verification

`scratchpad/verify-text.js` runs the box at three phone shapes (19.5:9 tall, 16:9, landscape) with a
short line, the real Stage-1 line, and a deliberately over-long line, asserting:

- text bottom/right never crosses the box
- box height always fits `name + text + padding`, and never shrinks as copy grows
- box clears the bottom safe area
- text column clears the portrait well
- body copy is ≥ 11px
- box stays under 45% of screen height

Run it after any change to dialogue, the type scale, or the render base.

---

## Known remaining debt

- The other ~90 text objects still use literal sizes. They're not *broken* (fixed strings in fixed
  boxes), but new work should use `PC.ui`, and any of them touched should be converted.
- `shop.js` / `select.js` / `results.js` row text is close to the `caption` floor and would read
  better at `body` if the rows were given a little more height.
