# Post-Stage Scripture Lessons — Design Spec

> **Status: THEORY-CRAFT.** Data lives in `js/scripture_data.js` but
> the scene is not implemented or wired in yet. This spec is the
> blueprint for when we light it up.
>
> Context (Mark, VBS 2026): a short Bible reflection between certain
> stages, designed to align with the church's "Days of Creation" VBS
> theme. Uses the **International Children's Bible** translation,
> Danny's **teaching/lecturing animation**, a **speech-bubble
> typewriter**, and a **read-along + tap-to-answer** interactive beat
> so kids participate, not just watch.

---

## 1. When the lesson fires

After **exactly the stages that don't already have a between-day
quiz**:

| Stage | Title | Genesis day | Followed by |
|---|---|---|---|
| 2-1 | Sky Above        | Day 2 | LESSON |
| 3-1 | Mountain Rise    | Day 3 | LESSON |
| 4-1 | Solar Climb      | Day 4 | LESSON |
| 5-1 | Wings of Day     | Day 5 | LESSON |
| 6-1 | Plains to Forest | Day 6 | LESSON |
| 8-1 | Adventure City   | bonus | LESSON (rescue/teamwork verse) |

Day 1-1, 2-2, 3-2, 4-2, 5-2, 6-2 all lead into the existing scripture
quiz, so they get nothing new. Day 7-1 (Sabbath) goes into the finale
cinematic.

The lesson **replaces the immediate jump to the overworld** — flow is
now:

```
level finish → results screen → [LESSON, on the eligible stages] → overworld
```

For Adventure City the chain is:
```
level 8-1 finish → fade-to-black → cityArrival cutscene → LESSON → menu
```

---

## 2. Scene layout (`SDD.scenes.lesson`)

```
┌────────────────────────────────────────────────────────────┐
│ DAY 3 LESSON                                  GENESIS 1:9  │  ← banner
├────────────────────────────────────────────────────────────┤
│                                                            │
│              ┌──────────────────────────────────────┐      │
│              │  "Then God said, 'Let the water      │      │
│   ╱──╲   ╱──< │   under the sky be gathered..."     │      │  ← speech bubble
│  ┃    ┃   ╲   └──────────────────────────────────────┘      │     with TAIL
│  ┃Danny    ╲                                                │     pointing to
│  ┃teach     ╲    READ WITH ME!  PRESS A                     │     Danny
│  ┗━━━━━┛                                                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Pieces:**
- **Backdrop:** `ART_LAB` (the painted lab from the intro / finale).
  Dimmed ~30% so the text reads clearly.
- **Danny:** size `big`, animation `teach` (17 frames, south-facing),
  positioned at `x=64, baseY=158`, scale 1.5. He breathes/gestures the
  whole time — never goes idle.
- **Speech bubble:** rounded rectangle, white-on-dark-navy with a
  golden 1-px border, tail pointing toward Danny's mouth.
- **Top banner:** thin band with the day label and the verse
  reference, matches the existing level/results banner styling.
- **Bottom prompt:** "PRESS A" / "READ WITH ME" / "YOUR TURN" depending
  on the beat.

**Mobile (`body.touch`):** speech bubble shrinks `boxW` from 240 → 188
so the A/B touch buttons on the right of the viewport never overlap
the verse — same fix we applied to the cityArrival dialogue in v0.89.

---

## 3. Beat structure (per lesson)

Each lesson plays through 5 beats. The player presses A to advance.

| Beat | Bubble content | Anim | Prompt |
|---|---|---|---|
| 0 | `intro` text (Danny greets) | `teach` 0–8 | PRESS A |
| 1 | Verse, **types one char at a time** with a soft tick SFX | `teach` looping | PRESS A TO CONTINUE |
| 2 | Same verse displayed in full, **word-highlight karaoke** moves left→right ~3 words/sec as Danny "reads" it. | `teach` 9–16 | READ WITH ME |
| 3 | `reflect.question` + 2–3 tappable answer buttons | `teach` 0–4 | TAP YOUR ANSWER |
| 4 | `close` text (gentle encouragement, always positive — every answer is affirmed) | `teach` 9–16 + dance frame on the last 12 frames | PRESS A TO CONTINUE |

After beat 4, the lesson scene calls the next scene in the chain
(`overworld` for stages 2-1..6-1, `menu` for 8-1).

### Beat 1 — typewriter detail
- Reveal **one character every 3 frames** (~20 chars/sec, kid-readable
  cadence; ~2.5 seconds for a 50-char verse).
- Every 3rd revealed char plays a low-volume `typewriter_tick` SFX —
  a new tiny tone (~620 Hz, 0.02s duration, 0.08 amplitude — softer
  than `select`). Mark explicitly asked for "little fun typing noises."
- **Press A** during typing → instantly reveals the full verse +
  advances to beat 2.

### Beat 2 — read-with-me (the participation moment)
- Verse stays on screen, fully revealed.
- A **golden highlight pill** slides across the words at ~3 words/sec.
  Each word "lights up" as Danny reads it — gives the kid a pacing cue
  for reading aloud.
- The pill loops twice. Kid can press A any time to advance — no
  time pressure.
- Mobile-friendly: the highlight pill is calculated word-by-word from
  the wrapped lines so it always tracks the visible layout.

### Beat 3 — reflect (the interactive moment)
- Speech bubble shows the question + 2–3 buttons stacked below it.
- Each button is tappable on touch and selectable with up/down +
  confirm on keyboard.
- **Every answer advances** — there's no "wrong" answer in a kid VBS
  context. The `right:true` answer gets a brighter affirmation
  ("EXACTLY!") and the others get a gentle "GOOD GUESS!" before beat 4
  plays.
- Selecting an answer plays `confirm` SFX + briefly pulses the picked
  button.

---

## 4. Sound design

| Cue | When | SFX |
|---|---|---|
| Lesson opens | scene enter | new `lesson_open` — soft warm chime (G5 + C6, sine, 0.4s) |
| Char revealed | every 3 typed chars | new `typewriter_tick` — 620 Hz square, 0.02s, 0.08 amp |
| Beat advance | A press | existing `select` |
| Answer selected | beat 3 tap | existing `confirm` |
| Lesson closes | scene exit | new `lesson_close` — descending arpeggio (C6, A5, F5) |

Music: **mute the level/results track and play a soft lab-ambient
loop** during the lesson. The existing `intro` track at low volume
works fine — no new music asset required.

---

## 5. Verse text (already authored in `js/scripture_data.js`)

All six lessons, ICB, lightly trimmed to fit a kid's reading speed.
See the data file for the exact strings; the intent is captured in:

- **Day 2** (Sky): "Let there be something to divide the water in
  two… God named the air sky." — Genesis 1:6, 8
- **Day 3** (Land): "Let the dry land appear… God saw that this was
  good." — Genesis 1:9-10
- **Day 4** (Sun): "Let there be lights in the sky to separate day
  from night." — Genesis 1:14, 16
- **Day 5** (Birds): "Let birds fly in the air above the earth… God
  saw that this was good." — Genesis 1:20-21
- **Day 6** (Animals): "Let the earth be filled with animals — tame
  animals, small crawling animals, and wild animals." — Genesis
  1:24-25
- **Adventure City** (rescue): "Two people are better than one. They
  get more done by working together. If one falls down, the other can
  help him up." — Ecclesiastes 4:9-10

---

## 6. Implementation sketch (when we're ready to wire it)

Three changes — none required yet:

1. **Add the script** in `index.html` after `quiz_data.js`:
   ```html
   <script src="js/scripture_data.js"></script>
   ```

2. **Register the scene** in `scenes.js`:
   ```js
   SDD.scenes.lesson = {
     enter: function (d) {
       this.day = d.day; this.stage = d.stage;
       this.next = d.next || 'overworld';        // chain target
       this.lesson = SDD.scriptureFor(this.day, this.stage);
       this.beat = 0; this.t = 0; this.shown = 0; this.full = false;
       this.answerIdx = 0; this.picked = -1;
       A.startMusic('intro');                   // low-key lab ambience
     },
     update: function () { /* per-beat handling, A-to-advance */ },
     render: function (g) {
       _drawLessonBackdrop(g);                  // ART_LAB dimmed
       _drawLessonDanny(g, this.beat, this.t);  // teach anim
       _drawLessonBubble(g, this.lesson, this.beat, this.shown, /* etc */);
       _drawLessonPrompt(g, this.beat);
     }
   };
   ```

3. **Wire the trigger** in `scenes.level.finish()` — insert a single
   conditional that routes through the lesson scene for the eligible
   stages, then chains on to results/overworld:
   ```js
   var lessonStages = { '2-1':1, '3-1':1, '4-1':1, '5-1':1, '6-1':1, '8-1':1 };
   if (lessonStages[this.day + '-' + this.stage]) {
     go('lesson', { day: this.day, stage: this.stage, next: 'overworld' });
   }
   ```

That's it — **no engine changes, no new assets** (Danny's teaching
animation, lab backdrop, and pixel font are all already registered and
shipped). Estimated effort to light up: half a day, mostly tuning the
typewriter cadence + the bubble + the read-along highlight.

---

## 7. Design decisions (locked)

These were the open questions; Mark answered them.

1. **Replay frequency: every clear.** The lesson fires every time an
   eligible stage is finished, not just the first time. No
   `lessonsSeen` set on the save slot, no gating — just trigger the
   scene every time `finish()` runs on a lesson-eligible stage.
2. **No skip.** No hold-B-to-skip, no leader bypass. The lesson plays
   in full each time. Kids press A to advance beat-by-beat at their
   own pace, but they can't jump out.
3. **No Adventure-Week-2026 callback in the 8-1 closing.** Keep the
   8-1 close generic to the Ecclesiastes verse — no AW2026 mention.
   The Adventure Week 2026 banner stays exclusive to the cityArrival
   final card.
4. **Voiceover** — still out of scope for v1, but the data structure
   can grow a per-beat `audio` field later if Mark or a VBS leader
   wants to record themselves reading the verse.
