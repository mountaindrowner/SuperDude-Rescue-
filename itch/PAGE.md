# Portion Control: itch.io launch kit

Everything needed to fill in the itch.io project page. The upload itself
is built by `tools/build_itch.sh` (see "Upload" below). Page copy avoids
em dashes on purpose (house rule).

---

## 1. Basics (Edit project > top of page)

| Field | Value |
| --- | --- |
| Title | Portion Control |
| Project URL | `portion-control` (or `super-dude-danny-portion-control`) |
| Short description / tagline | Super Dude Danny's food machine buried the city in snacks. Blast the junk food, rescue your team, and climb Adventure Tower. |
| Classification | Games |
| Kind of project | HTML |
| Release status | Released (or "In development" for a soft launch) |
| Pricing | Your call: free, or "No payments" / "Donate" / pay what you want |

## 2. Upload

1. Run `tools/build_itch.sh` (or use the zip from the session). It makes
   `dist/portion-control-<version>-itch.zip` with `index.html` at the
   zip root, which is what itch requires.
2. Upload the zip under **Uploads**.
3. Tick **"This file will be played in the browser"**.

## 3. Embed options (shown once the HTML upload is set)

| Option | Setting | Why |
| --- | --- | --- |
| Embed in page | Manually set size | |
| Viewport dimensions | **450 x 800** | Portrait game; fits a laptop screen without scrolling. The game scales to any size, so 405 x 720 also works. |
| Mobile friendly | **On** | It was built phone-first (touch to move). |
| Orientation | **Portrait** | |
| Automatically start on page load | Off | Players tap anyway (audio needs a tap). |
| Fullscreen button | **On** | Best way to play on desktop. |
| Enable scrollbars | Off | |
| SharedArrayBuffer support | Off | Not used. |

## 4. Details

**Genre:** Action

**Tags** (itch allows 10): `survivors-like`, `roguelite`, `pixel-art`,
`family-friendly`, `top-down-shooter`, `bullet-hell`, `mobile`,
`singleplayer`, `funny`, `story-rich`

**App store links:** none. **Custom noun:** leave as "game".

**Made with:** Phaser

**Inputs:** Touchscreen, Mouse, Keyboard

**Average session:** 15 minutes per Snack Attack run; about a half-hour for Story

**Languages:** English

**Accessibility:** "Interactive tutorial" (Vic's pad tutorial)

**Content / mature content:** none. Enemies "pop" into gems; no blood.

## 5. Generative AI disclosure (required)

itch.io's edit page has a **Generative AI Disclosure** field, and a project
that uses generative AI without disclosing it can be dropped from search.
Answer **Yes** and tick:

- **Graphics**: the sprites, portraits and bosses were generated with PixelLab.
- **Code**: much of the game code was written with an AI coding assistant.
- **Text and dialogue**: a lot of the connective dialogue (debriefs, mission
  lines) was drafted with an AI assistant and edited by Mark.

The music is Mark's own and is not AI-generated. Don't add the "AI
Generated" tag by hand; the form adds it.

---

## 6. Description (paste into the main description box)

> **The Nourish-Ray was supposed to end hunger forever.**
> Then somebody spilled a soda on it.
>
> Now Adventure City is buried in junk food, and the junk food is
> **fighting back**. Fries march down Main Street. Hot dogs swarm City Hall.
> A cake the size of a house is stomping through the suburbs.
>
> Super Dude Danny made this mess. Super Dude Danny is going to fix it,
> and he is going to need his whole team.
>
> **HOW IT PLAYS**
>
> - **Move. That's it.** Your gear fires on its own. You pick where to stand,
>   when to run, and which fights to take.
> - **Story Mode: eight missions across six districts.** Clear swarms, pull
>   fuses under fire, hold the line, and take down **five huge bosses**
>   before the very hungry machine waiting at the top of Adventure Tower.
> - **Rescue the crew.** Free Vic, Josh, Kevin, Carlos and Nayah one at a
>   time. Each hero has their own signature weapon, and Vic and Josh take
>   the lead on missions of their own.
> - **Upgrade between missions.** Gems become TECH for team-wide passives.
>   Coins become GOLD for each hero's signature weapon.
> - **SNACK ATTACK**, the survival mode: last 15 minutes against a growing
>   swarm. Level up, pick one of three random upgrades, carry up to six
>   weapons and six items, and crack open golden chests to **evolve** a
>   maxed weapon into something huge. No two runs build the same way.
> - **Every run counts.** Coins you grab stay yours: buy new heroes and
>   permanent POWER-UPS. Hit high levels to open five stages, and chase 70
>   unlocks that add weapons, items and heroes as you go.
>
> **CONTROLS**
>
> - Phone / tablet: touch and drag anywhere to move.
> - Desktop: click and drag, or WASD / arrow keys. M opens the map.
> - Level-up cards: tap, or press 1 / 2 / 3. P or Esc pauses Snack Attack.
>
> Your progress saves in your browser. Play in fullscreen for the best view.
>
> Made for kids and families. Nobody gets hurt; the food just pops.

## 7. Screenshots and cover

- **Cover image:** `itch/cover@2x.png` (1260 x 1000, itch's 630 x 500 ratio
  at 2x so it stays crisp). `itch/cover.png` is the 630 x 500 version.
- **Screenshots** (`itch/screenshots/`, 960 x 1708 portrait). Suggested
  order: `03_swarm`, `04_bigfrank`, `05_chomp`, `06_levelup`,
  `02_newscast`, `08_upgrade`, `07_teamlink`, `01_title`, `09_danny_live`.
  itch shows the first few most, so lead with action.
- Note: `03_swarm` and `06_levelup` were taken in the old Rush Mode (4+4
  slot tray). Snack Attack shows a 6+6 tray; retake those two from a Snack
  run before launch so the page matches the game.

## 8. Before you press Publish

- [ ] Play the uploaded build once in itch's own preview, on a phone and on
      a desktop, start to the end of mission 1.
- [ ] Decide on the NASA patch on Vic's jacket (see HANDOVER, launch notes):
      NASA's name and insignia are protected and NASA restricts their use
      in commercial products; safest is to regenerate her art with an
      invented agency patch before selling the game.
- [ ] Fill in the Generative AI disclosure (section 5).
- [ ] Check `CREDITS.txt` credits read the way you want.
- [ ] Set visibility to Public (Draft until you're happy).
