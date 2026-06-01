# Super Dude Danny — iOS App Store build guide

Wraps the existing HTML5 game (no code changes) into a native iOS app
with **Capacitor**, for submission to the App Store. The web game still
runs as a standalone PWA from `index.html`; this is purely packaging.

> You need a **Mac with Xcode** and your **Apple Developer account**
> (you already have both). Everything in `resources/`,
> `capacitor.config.json`, `package.json`, and `scripts/` is committed
> and ready.

---

## One-time setup (on the Mac)

```sh
# From the repo root:
npm install                 # installs Capacitor + the asset generator
npm run build:web           # assembles ./www (the clean game bundle)
npx cap add ios             # generates the native ios/ Xcode project
npm run ios:assets          # builds the iOS icon set + splash from resources/
npx cap sync ios            # copies www/ + assets into the native project
npx cap open ios            # opens the project in Xcode
```

If `npx cap add ios` asks for CocoaPods, install it once with
`sudo gem install cocoapods` (or `brew install cocoapods`).

## In Xcode

1. Select the **App** target → **Signing & Capabilities** → set your
   **Team** (your existing Apple Developer account).
2. Confirm the **Bundle Identifier**. It's `org.thecrossroads.superdudedanny`
   in `capacitor.config.json` — **change it** there (and re-run
   `npx cap sync ios`) if your team uses a different reverse-domain.
3. Set **Deployment Target** to iOS 14 or later.
4. Devices: **iPhone + iPad** (Universal) — or untick iPad for
   iPhone-only.
5. Run on the **Simulator** and a **real iPhone** to sanity-check touch
   controls, sound (first tap unlocks audio), fullscreen, and the
   notch/safe-area letterboxing in both orientations.

## Submit

1. Xcode → **Product → Archive** → **Distribute App → App Store Connect**.
2. In **App Store Connect**, create the app record (see listing copy
   below), attach the build, fill the privacy + age-rating
   questionnaires, add screenshots, **Submit for Review**.

## After any game change

```sh
npm run build:web && npx cap sync ios   # re-bundle + push to the native project
```
Then re-archive in Xcode.

---

## App Store Connect — listing copy (ready to paste)

- **Name:** Super Dude Danny
- **Subtitle:** A retro adventure through creation
- **Bundle ID:** `org.thecrossroads.superdudedanny` (match your team)
- **Primary category:** Games → Adventure (Secondary: Education)
- **Privacy Policy URL:** host `privacy.html` (e.g. on your Subsplash
  site or the web host) and paste that URL. The page is committed at
  the repo root.

**Description:**
> Help Super Dude Danny — a scientist stranded in time — journey through
> God's seven days of creation! Run, jump, and collect power cores to
> rebuild his time machine and get home.
>
> • 12 hand-crafted stages across seven days of creation, each with its
>   own world, enemies, and a special power-up.
> • Learn a Bible verse between each day.
> • Three difficulty modes with their own save slots — easy mode has
>   unlimited lives, perfect for younger players.
> • Finish the game to unlock a secret bonus level: Adventure City!
> • Plays great on phone or tablet, in portrait or landscape, with
>   simple touch controls.
> • Completely offline. No ads. No accounts. No data collected. Ever.
>
> Built for The Crossroads Foundation.

**Keywords:** platformer, kids, retro, pixel, bible, creation, adventure,
jump, family, offline

**Age rating:** 4+ (no objectionable content). Answer the questionnaire
all "None."

**App Privacy → Data Collection:** select **"Data Not Collected."**
(The game makes zero network calls and stores only local progress.)

---

## Notes / follow-ups

- **Bundle size:** `www/` is ~130 MB, mostly audio + sprite art. That's
  within App Store limits but chunky for a kids game. To slim it later:
  re-encode the MP3s in `assets/music/` + `assets/New Assets/Adventure
  city Music/` at a lower bitrate, and prune any unused reference PNG
  folders. Not a blocker for v1.
- **Guideline 4.2 (web wrapper):** Apple occasionally flags web-wrapped
  apps. This is a real game (rich interactivity, fully offline,
  fullscreen) so it should pass; budget for one possible rejection
  round.
- **Kids Category (optional):** the app qualifies (no ads, no analytics,
  no external links, no data collection). If you choose it, Apple
  applies extra scrutiny but you already meet the bar.
- **Service worker:** harmless inside the Capacitor WebView (assets are
  bundled locally, so it's offline regardless). No action needed.
- The `ios/`, `www/`, and `node_modules/` folders are git-ignored —
  they're generated on the build machine.
