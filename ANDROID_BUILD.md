# Super Dude Adventures — Google Play build guide

Wraps the existing HTML5 game (no code changes) into a native Android
app with **Capacitor**, for submission to Google Play. The web game
still runs as a standalone PWA from `index.html`; this is purely
packaging. It reuses the SAME web bundle, icons (`resources/`), bundle
id, and `build-web.mjs` step as the iOS build.

> **Cloud-build path (recommended).** Like iOS, the whole thing builds
> on **Codemagic** — no Android Studio, no local SDK. The
> `android-googleplay` workflow in `codemagic.yaml` does it. Unlike iOS
> there's no macOS requirement, so this path has fewer moving parts.

- **App name:** Super Dude Adventures
- **Package name / applicationId:** `org.thecrossroads.superdudeadventures`
  (same as the iOS bundle id, on purpose)
- **Account type:** Google Play **Organization** account for The
  Crossroads Foundation (DUNS-verified).

---

## Phase 1 — Generate the upload keystore (ONE TIME, ~2 min)

Google Play uses **two** keys: an *upload key* (you hold) and an *app
signing key* (Google holds, via Play App Signing — recommended). You
generate the upload key once and reuse it forever. **If this file is
ever lost you can reset it** through Play Console, so it's far less
fragile than iOS certs — but still back it up.

On any machine with a JDK (`keytool` ships with Java):

```sh
keytool -genkeypair -v \
  -keystore superdude-upload.jks \
  -alias superdude \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype JKS
```

It prompts for a **store password**, a **key password** (use the same
for both to keep it simple), and a name/org ("The Crossroads
Foundation", etc.). Keep `superdude-upload.jks` + the two passwords +
the alias (`superdude`) somewhere safe (password manager). **Do NOT
commit the .jks to git** — it's a private signing key.

## Phase 2 — Store the keystore in Codemagic (ONE TIME)

Codemagic UI → **Teams / Personal settings → Code signing identities →
Android keystores → Add keystore**:

- Upload `superdude-upload.jks`
- **Keystore password**, **Key alias** (`superdude`), **Key password**
- **Reference name:** `superdude_upload` ← must match
  `codemagic.yaml` (`android_signing: - superdude_upload`)

Codemagic then injects `CM_KEYSTORE_PATH` / `CM_KEYSTORE_PASSWORD` /
`CM_KEY_ALIAS` / `CM_KEY_PASSWORD` into the build, which the workflow's
"Wire the upload keystore" step reads.

## Phase 3 — Run the build

Codemagic → connect this repo + branch → run the **android-googleplay**
workflow. It will:

1. `npm ci` → `build:web` (the clean `www/` bundle)
2. `cap add android` + `cap sync android`
3. Generate launcher icons + splash from `resources/`
4. Lock orientation to landscape
5. Sign the release with your upload keystore
6. Set `versionCode` = build number, `versionName` = `MARKETING_VERSION`
7. `./gradlew bundleRelease` → **`app-release.aab`** (downloadable
   artifact)

> The Android workflow is a first draft (same as the iOS one was) —
> budget for one or two iteration rounds on the first real run. The most
> likely fix-ups: the `build.gradle` patch anchors and the JDK/Android
> Gradle Plugin version on Codemagic's image.

## Phase 4 — First upload to Play Console (BY HAND)

Google won't let an API create an app's **first** release, so the first
`.aab` goes up manually:

1. Play Console → **Create app** (name, language, app/game, free).
2. **Set up Play App Signing** when prompted — let Google generate +
   manage the app signing key (recommended). Your upload key stays the
   one from Phase 1.
3. **Testing → Internal testing → Create release** → upload the `.aab`
   artifact from Codemagic → add yourself as a tester → roll out.
4. Walk the **Dashboard checklist**: privacy policy URL, data-safety
   form, content rating questionnaire, target audience, store listing
   (copy below), screenshots.
5. Promote Internal → Closed → Production when ready. (New accounts may
   owe a **closed test with 12+ testers for 14 days** before production
   — Organization accounts can be exempt; Play Console will tell you.)

## Phase 5 — (Optional) automate uploads after the first

Once the app exists in Play Console, flip on the commented `publishing:
google_play:` block at the bottom of the `android-googleplay` workflow:

1. Play Console → **Setup → API access** → create/link a Google Cloud
   **service account**, grant it **Release** permission.
2. Download its JSON key, store it in Codemagic as the env var
   `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` (Secure).
3. Uncomment the block. Builds then auto-publish to the `internal`
   track as a draft.

## After any game change

The web bundle is rebuilt every Codemagic run, so just re-run the
workflow. `versionCode` auto-increments off the build number; bump
`MARKETING_VERSION` in `codemagic.yaml` (and `SDD.VERSION` in
`js/main.js`) when you want the store version string to change.

Local Android Studio path, if ever needed:
```sh
npm run android:add      # build:web + cap add android + icons + sync
npm run android:open     # opens the project in Android Studio
```

---

## Play Console — store listing copy (ready to paste)

Reuses the iOS copy; Play's fields differ slightly.

- **App name:** Super Dude Adventures
- **Short description (≤80 chars):**
  > A retro platform adventure through the seven days of creation.
- **Full description:**
  > Help Super Dude Danny — a scientist stranded in time — journey
  > through God's seven days of creation! Run, jump, and collect power
  > cores to rebuild his time machine and get home.
  >
  > • 12 hand-crafted stages across seven days of creation, each with
  >   its own world, enemies, and a special power-up.
  > • Learn a Bible verse between each day.
  > • Three difficulty modes with their own save slots — easy mode has
  >   unlimited lives, perfect for younger players.
  > • Finish the game to unlock a secret bonus level: Adventure City!
  > • Plays great on phone or tablet with simple touch controls.
  > • Completely offline. No ads. No accounts. No data collected. Ever.
  >
  > Built for The Crossroads Foundation.

- **Category:** Games → Adventure (or Educational)
- **Tags:** platformer, kids, retro, bible, creation, family
- **Content rating:** complete the IARC questionnaire — answer all
  "None"; lands at **Everyone**.
- **Data safety:** **No data collected, no data shared.** The game makes
  zero network calls and stores only local progress.
- **Privacy policy URL:** host `privacy.html` (committed at repo root)
  and paste its URL — Play **requires** a privacy policy URL.
- **Target audience:** include the "Children" / under-13 bracket
  (Designed for Families eligible: no ads, no analytics, no data).

## Graphics assets Play requires

- **App icon:** 512×512 PNG (generated from `resources/icon.png`).
- **Feature graphic:** 1024×500 PNG (needs to be made — a banner; can
  generate on request).
- **Phone screenshots:** 2–8, 16:9 landscape (same shots as iOS; can
  generate on request).
- **(Optional) tablet screenshots** for better tablet placement.

---

## Notes / parity with iOS

- **Bundle size:** `www/` is ~47 MB after the v1.0.5 mono MP3 re-encode
  — well within Play's 150 MB base-AAB limit. No action needed.
- **AAB not APK:** Play requires the App Bundle (`bundleRelease`), which
  the workflow produces. Google generates per-device APKs from it.
- **Landscape lock:** done via `screenOrientation="sensorLandscape"` on
  the Capacitor MainActivity (workflow step), mirroring the iOS plist
  lock.
- **Service worker:** harmless inside the Capacitor WebView — assets are
  bundled locally so it's offline regardless.
- `android/`, `www/`, `node_modules/` are git-ignored — generated on the
  build machine.
