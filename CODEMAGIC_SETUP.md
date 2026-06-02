# Super Dude Danny → App Store via Codemagic (cloud build)

**Goal:** get Super Dude Danny onto the Apple App Store *without* a local
Xcode and *without* upgrading your Mac's OS. A cloud service (Codemagic)
runs the build on its own modern macOS + Xcode machines. Everything you
do is in a **web browser**. Your Mac only needs Safari/Chrome.

This guide assumes you already have:
- An **active Apple Developer Program membership** (the paid $99/yr one —
  you have it, you've shipped an app on this account before).
- This repo on **GitHub** (`mountaindrowner/SuperDude-Rescue-`).

You do **not** need: Xcode, CocoaPods, Node, or a newer macOS. The build
config (`codemagic.yaml`, already in the repo root) handles all of that
in the cloud.

> **Time:** ~60–90 min the first time (most of it Apple's forms +
> screenshots). Every later release is ~10 min: push to the branch,
> click Build, submit.

---

## The big picture (read once)

```
  YOU (browser)                         CLOUD
  -----------------------------------   --------------------------------
  Phase 1  Apple Developer portal  ───► register the App ID (bundle id)
  Phase 2  App Store Connect       ───► create the app record + listing
  Phase 3  App Store Connect       ───► create an API key (.p8 file)
  Phase 4  Codemagic               ───► connect GitHub repo
  Phase 5  Codemagic               ───► upload the API key (signing)
  Phase 6  Codemagic               ───► run the build  ──► .ipa ──► TestFlight
  Phase 7  App Store Connect       ───► screenshots + metadata + Submit
  Phase 8  Apple review            ───► ~24–48h ──► LIVE
```

Three identifiers you'll reuse throughout — write them down as you go:

| Name | Value | Where it comes from |
|---|---|---|
| **Bundle ID** | `org.thecrossroads.superdudedanny` | already set in `capacitor.config.json` — use exactly this |
| **App name** | `Super Dude Danny` | what shows on the store |
| **API key files** | Issuer ID + Key ID + `.p8` | Phase 3 |

---

## Phase 1 — Register the App ID (Apple Developer portal)

This reserves the bundle identifier for your account.

1. Go to **https://developer.apple.com/account** and sign in.
2. Left sidebar → **Certificates, Identifiers & Profiles**.
3. Click **Identifiers** (left), then the blue **+** button (top, next to
   "Identifiers").
4. Select **App IDs** → **Continue**.
5. Type → choose **App** → **Continue**.
6. Fill in:
   - **Description:** `Super Dude Danny`
   - **Bundle ID:** select **Explicit**, then type exactly:
     `org.thecrossroads.superdudedanny`
7. **Capabilities:** leave everything **unchecked**. The game needs no
   push notifications, no iCloud, no special entitlements — it's a
   self-contained offline game. (Leaving these off makes review simpler.)
8. Click **Continue** → review → **Register**.

✅ You now have an App ID. You do **not** need to create certificates or
provisioning profiles by hand — Codemagic does that automatically in
Phase 5/6 using the API key.

> If you ever see "An App ID with Identifier 'org.thecrossroads...' is not
> available" it means it's already registered (maybe from an earlier
> attempt) — that's fine, skip to Phase 2.

---

## Phase 2 — Create the app record (App Store Connect)

This is the listing the public sees. **Do not touch your existing
published app** — we're making a brand-new record.

1. Go to **https://appstoreconnect.apple.com** and sign in.
2. Click **Apps** (top) → the blue **+** (top-left) → **New App**.
3. Fill in the dialog:
   - **Platforms:** check **iOS**.
   - **Name:** `Super Dude Danny`
     *(must be globally unique on the App Store; if it's taken, try
     `Super Dude Danny - Creation` or similar and note what you chose).*
   - **Primary Language:** English (U.S.).
   - **Bundle ID:** pick **`org.thecrossroads.superdudedanny`** from the
     dropdown (it appears because you registered it in Phase 1).
   - **SKU:** any internal string, e.g. `superdudedanny2026`
     (not shown publicly — just your own reference).
   - **User Access:** Full Access (default).
4. Click **Create**.

✅ The app record now exists. Leave the metadata blank for now — we fill
it in Phase 7, after the first build is uploaded. The build can upload to
TestFlight before the store listing is complete.

---

## Phase 3 — Create an App Store Connect API key

This single key lets Codemagic sign + upload builds on your behalf. **No
Mac, no Xcode involved.**

1. Still in **App Store Connect**, top menu → **Users and Access**.
2. Sub-tab **Integrations** (older UIs call it **Keys**).
3. Section **App Store Connect API** → **Team Keys** → blue **+**
   (or **Generate API Key** if it's the first one).
4. Dialog:
   - **Name:** `Codemagic`
   - **Access:** choose **Admin** (simplest — guarantees it can manage
     signing AND upload builds). *App Manager* also works if you prefer
     least-privilege.
5. Click **Generate**.
6. The new key row appears. Note these **two** values from the page:
   - **Issuer ID** — a long UUID at the top of the Keys section
     (e.g. `69a6de7e-...`). Same for all your keys.
   - **Key ID** — the 10-character code in the key's row
     (e.g. `2X9R4HXF34`).
7. Click **Download API Key** on that row → you get a file named
   `AuthKey_XXXXXXXXXX.p8`. **You can only download it ONCE.** Save it
   somewhere safe (you'll upload it to Codemagic in Phase 5).

> **Already have an API key from your earlier app?** You can reuse it —
> as long as it has **Admin** or **App Manager** access. You'll just need
> the Issuer ID, Key ID, and the original `.p8` file. If you can't find
> the `.p8`, make a fresh key (step 3) — keys are free and you can have
> several.

---

## Phase 4 — Connect Codemagic to GitHub

1. Go to **https://codemagic.io** → **Sign up** → **Sign up with
   GitHub** (use the GitHub account that owns the repo).
2. Approve the GitHub authorization. When asked which repos Codemagic may
   access, you can grant **only** `SuperDude-Rescue-` (recommended) or
   all repos.
3. On the Codemagic dashboard → **Add application** →
   **GitHub** → select **`mountaindrowner/SuperDude-Rescue-`**.
4. When it asks "How would you like to configure the build?" choose
   **`codemagic.yaml`** (it's already in the repo root — Codemagic will
   detect it). If it asks for a project type, pick **Capacitor** /
   **Other** — the yaml overrides it anyway.

✅ Codemagic now sees the repo and the `ios-appstore` workflow defined in
`codemagic.yaml`.

---

## Phase 5 — Upload the API key to Codemagic (signing)

This is the link between Codemagic and Apple. Done **once**.

1. In Codemagic, click your avatar (top-right) → **Team settings** (or
   **Personal account settings** if you're on a personal account).
2. Left sidebar → **Integrations**.
3. Find **Developer Portal** / **App Store Connect** → **Manage keys** →
   **Add key**.
4. Fill in:
   - **API key name:** type exactly **`superdude_asc`**
     *(this must match the name in `codemagic.yaml` →
     `integrations: app_store_connect: superdude_asc`. If you want a
     different name, change it in BOTH places.)*
   - **Issuer ID:** paste from Phase 3.
   - **Key ID:** paste from Phase 3.
   - **API key (.p8):** upload the `AuthKey_XXXXXXXXXX.p8` file.
5. **Save**.

✅ Codemagic can now create the signing certificate + provisioning
profile automatically every build. You never touch a certificate file.

---

## Phase 6 — Run the first build

1. Codemagic dashboard → your app → you should see the **ios-appstore**
   workflow.
2. Set the branch to **`claude/super-dude-danny-platformer-Jftc7`**
   (the live branch — same one Netlify deploys).
3. Click **Start new build** → pick that branch + the `ios-appstore`
   workflow → **Start build**.
4. Watch the log. The steps run in order: install deps → assemble `www/`
   → add iOS platform → generate icons → CocoaPods → apply signing →
   set version → build `.ipa`. First build takes ~8–15 min (later builds
   are cached and faster).
5. On success you get a green check, a downloadable **`.ipa`** artifact,
   and the build is **auto-uploaded to TestFlight** (per the
   `publishing` block).

> **If it fails**, the log names the failing step. The usual first-time
> causes:
> - *"No matching profiles / signing"* → the API key name in Codemagic
>   doesn't match `superdude_asc` in the yaml, or the key lacks Admin
>   access. Recheck Phase 5.
> - *"App not found"* / upload rejected → the app record (Phase 2) isn't
>   created yet, or its bundle ID doesn't match. Recheck Phase 2.
> - *CocoaPods / Xcode version error* → rare; tell me the exact log line
>   and I'll adjust the yaml (e.g. pin a specific Xcode).

---

## Phase 7 — Fill in the store listing + screenshots

After the build lands in TestFlight you can complete the public listing.

1. App Store Connect → **Apps** → **Super Dude Danny** → the **iOS** app
   → the version (e.g. **1.0.2**) in the left sidebar under
   "iOS App".
2. **Listing copy** — ready-to-paste text (name, subtitle, description,
   keywords, promo text, what's-new, support URL, category) lives in
   **`IOS_BUILD.md`** in this repo. Copy each field across.
3. **Privacy:**
   - **Privacy Policy URL:** point to the live `privacy.html`, e.g.
     your Netlify URL + `/privacy.html`.
   - **App Privacy questionnaire** (the "data collection" form): answer
     **"No, we do not collect data from this app."** The game collects
     nothing — no analytics, no accounts, no network calls out (verified
     in the security audit). `IOS_BUILD.md` has the exact answers.
   - **Age Rating:** answer the questionnaire honestly — it's a
     kids' game with no objectionable content → rating **4+**.
4. **Screenshots (required):** Apple requires at least one **6.7-inch
   iPhone** screenshot (1290 × 2796 px) and one **6.5-inch** (1242 ×
   2688). The game is landscape, so screenshots are landscape inside the
   device frame.
   - **I can generate these for you** at the exact required sizes
     (title screen, an Adventure City action shot, a quiz, a scripture
     lesson, the overworld). Just ask and I'll produce the PNGs via the
     puppeteer harness and hand them over to upload here.
5. **Build:** in the version page, scroll to **Build** → **+** → pick the
   build that Codemagic uploaded to TestFlight.
6. **Pricing:** Apps → **Pricing and Availability** → **Free**.

---

## Phase 8 — Submit for review

1. On the version page, top-right → **Add for Review** → **Submit to App
   Review**.
2. Apple's review typically takes **24–48 hours** for a simple game.
3. You'll get an email on approval (or with any rejection reason — if
   that happens, paste it to me and I'll help resolve it).
4. On approval, choose **Manual** or **Automatic** release. Done — it's
   live on the App Store.

---

## Every later release (the easy path)

Once the above is set up once, shipping an update is:

1. Make game changes on the branch, **bump `SDD.VERSION`** in
   `js/main.js` and **`MARKETING_VERSION`** in `codemagic.yaml` (and the
   service-worker `CACHE_NAME`, as usual), push.
2. Codemagic → **Start new build** (or set it to build automatically on
   push — there's a trigger toggle in the workflow settings).
3. The new build auto-uploads to TestFlight.
4. App Store Connect → new version → attach the build → **Submit**.

The build number auto-increments (`$BUILD_NUMBER` in the yaml), so you
never collide with a previous upload.

---

## FAQ / gotchas

- **Does my old macOS matter at all?** No. The build runs on Codemagic's
  Macs. Your machine only needs a browser.
- **Cost?** Codemagic's free tier is 500 macOS build-minutes/month — far
  more than an occasional release needs. The Apple Developer membership
  ($99/yr) you already pay.
- **Do I need to commit the `ios/` folder?** No. It's `.gitignore`d on
  purpose; Codemagic regenerates it from `capacitor.config.json` +
  `resources/` on every build (the `npx cap add ios` step).
- **App size.** The `.ipa` will be ~130 MB (mostly the 38 MP3s). That's
  acceptable but chunky. If you want a smaller download, ask me to do an
  MP3 re-encode pass first — it can roughly halve the bundle with no
  audible loss for an 8-bit-style game.
- **The PWA is unaffected.** This whole pipeline is additive. The
  Netlify PWA keeps shipping from the same branch exactly as today; the
  App Store build is just a second distribution channel of the same game.
