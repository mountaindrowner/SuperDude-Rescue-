# 13 — Mobile, PWA, and iOS Shipping

This file is the survival guide. If you ship anything to a phone in 2026, read this twice.

## The desktop vs. phone delta

A game that "works on desktop" might:
- Not load at all on a phone
- Load but show audio-blocked silence
- Show with dark bands on the sides of the screen
- Have touch buttons that don't register
- Have HUD text hidden behind the notch
- Have a service worker cache that breaks Safari audio
- Have an icon that's invisible on the home screen

We hit all of these. This file is how to avoid them.

## PWA basics

A Progressive Web App is a web page with three extra files:

1. **`manifest.webmanifest`** — declares app name, icons, theme color, display mode, orientation
2. **`service-worker.js`** — caches assets for offline use, intercepts requests
3. **A few `<meta>` tags** in HTML — viewport, theme color, apple-mobile-web-app-* tags

Once these exist, the browser offers "Add to Home Screen." Once added, the page acts like an installed app (icon on home screen, full screen, offline).

### Minimum PWA setup

**`manifest.webmanifest`:**
```json
{
  "name": "Game Name",
  "short_name": "Game",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#0a0a1a",
  "theme_color": "#0a0a1a",
  "icons": [
    { "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "assets/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**`index.html` `<head>`:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Game">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png">
```

**`service-worker.js`:** see our actual implementation — cache-first for assets, network-first for code, Range request handling for audio.

## iOS Add to Home Screen considerations

When a user adds the PWA to home screen:

- The icon comes from `apple-touch-icon.png` (180×180 PNG)
- The title comes from `<meta name="apple-mobile-web-app-title">` (or manifest `short_name`)
- The launch screen comes from `manifest` `background_color` initially (iOS doesn't honor splash assets in PWAs)
- The page runs without browser chrome (`display: standalone` in manifest)
- The page stays installed even after Safari is cleared

### iOS PWA limitations
- No push notifications (until 2023+, very limited)
- No background sync
- Limited local storage (~50 MB before throttling)
- Service worker can be evicted after 7 days of non-use
- No camera/photo access without specific user prompts

## Viewport sizing

The single most-critical meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
```

Each part matters:

- **`width=device-width`** — match the device's CSS pixel width
- **`initial-scale=1`** — start at 1:1
- **`maximum-scale=1`** — disable pinch zoom (the game handles its own scaling)
- **`user-scalable=no`** — same intent
- **`viewport-fit=cover`** — **CRITICAL on iPhone with notch.** Tells iOS to allow content to extend behind the notch and home indicator. Without this, the layout viewport excludes those areas and your canvas can't reach the screen edges.

## Touch controls

See `12_MENUS_UI_AND_GAME_FLOW.md` for the touch button architecture. Plus:

### Touch event handling

Use **Pointer Events** (`pointerdown`, `pointermove`, `pointerup`), not Touch Events. Pointer Events unify mouse, touch, and stylus. Easier code, fewer bugs.

### Prevent default

On `pointerdown` for buttons, call `e.preventDefault()` to stop double-tap zoom and other browser gestures.

On `pointermove` for the joystick zone, ALSO call `e.preventDefault()`. Without this, iOS Safari interprets a drag as a text-selection gesture and pops up the magnifier loupe. (We hit this. Hard.)

### Pointer capture

```js
btn.addEventListener('pointerdown', e => {
  btn.setPointerCapture(e.pointerId);
  // handle press
});
```

Captures the pointer so the press stays bound to the button even if the finger drifts off. Eliminates the "dead spots" near button edges.

## Safe areas

On iPhones with notches and home indicators, parts of the screen are obscured. CSS `env(safe-area-inset-*)` values report the inset.

### To respect safe areas
```css
#hud { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
```

### To extend behind the notch (immersive game)
- Set `viewport-fit=cover` (the `<meta>` line above)
- Use `100vw` and `100dvh` for canvas size
- Position UI elements at `env(safe-area-inset-*)` offsets so they don't get hidden

### To read safe-area values from JS
You can't read `env()` directly. Use a hidden probe element:

```js
const probe = document.createElement('div');
probe.style.cssText = `
  position: fixed;
  visibility: hidden;
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left);
`;
document.body.appendChild(probe);
const cs = getComputedStyle(probe);
const top = parseFloat(cs.paddingTop);
// etc.
```

## Orientation

For landscape-locked games: set `orientation: landscape` in manifest. On iOS Safari, this is **advisory** — Safari does its own thing.

For Capacitor-wrapped iOS apps: enforce via Info.plist's `UISupportedInterfaceOrientations`. We do this in `codemagic.yaml`. Hard lock.

## Audio unlock

See `11_AUDIO_AND_MUSIC_PIPELINE.md`. The headline:

**Don't try to play audio before the first user gesture. Wait for the tap, then init.**

## Performance

### Canvas-based games on phones

- 60 fps is achievable on modern phones (iPhone 12+, mid-range Android 2022+)
- 30 fps is the floor for "feels playable"
- Below 30 fps = unplayable, fix immediately

### Common performance killers on phone
- Painting parallax layers every frame instead of caching (we hit this; fixed by pre-rendering)
- Large image draws via `drawImage` with scale (browsers handle scaled blits fine; non-scale blits faster)
- Decoded audio buffers consuming RAM
- Per-frame allocations causing GC pauses

### Measure on a phone
Desktop performance is misleading. iPhone Pro is faster than most laptops; older iPhone SEs are not. Test on an actual mid-range device.

## Image compression

Same logic as audio: ship at the bitrate you need, not the bitrate you started with.

- **PNG for sprites + UI** — lossless, indexed-color where possible
- **JPG for painted backdrops** at quality 85 — much smaller than PNG, no alpha
- **WebP** if you need alpha + small size — Safari support is now universal (iOS 14+)
- **Don't ship 4K source art.** Resize to target resolution.

Example: a 1920×1080 painted backdrop at 600 KB as PNG → re-encode at 1280×720 WebP → 120 KB. Same visual at phone size.

## Offline / cache concerns

### Service worker basics

A service worker intercepts fetches and can serve from cache. Once installed, the page works offline.

### Caching strategy

We use **cache-first for assets, network-first for code:**
- HTML/CSS/JS/JSON → network-first (so deploys roll out immediately)
- PNG/MP3/font → cache-first (load fast, deploys roll on cache bump)

Code in `service-worker.js`:

```js
if (isCode) {
  // network-first
  return fetch(req).then(...).catch(() => caches.match(req));
} else {
  // cache-first
  return caches.match(req).then(cached => cached || fetch(req).then(cache));
}
```

### The cache trap (we hit this every release)

When you update assets:
1. New asset uploaded to server
2. User's browser already has old asset cached
3. Service worker serves old asset
4. User sees "the update didn't apply"
5. Curse the cache

**Fix:** bump `CACHE_NAME` constant in `service-worker.js` on every release. Old cache invalidates, new cache rebuilds. We did this in lockstep with `SDD.VERSION` and `MARKETING_VERSION`.

```js
const CACHE_NAME = 'game-shell-v123';  // bump this every release
```

## App icons

For PWA: 192×192 and 512×512 PNGs referenced in manifest.
For iOS Add to Home Screen: 180×180 `apple-touch-icon.png` linked in HTML.
For Capacitor iOS App Store build: 1024×1024 `resources/icon.png` AND `resources/icon-only.png` (see iOS section below).

**All icons must be opaque (no alpha).** Apple rejects transparent icons.

## Splash screens

For PWA: not really supported on iOS reliably. Browser shows the manifest's `background_color` while loading.

For Capacitor iOS app: 2732×2732 `resources/splash.png`. Used as the launch screen.

## Manifest

Already covered above. Key fields: name, icons, display, orientation, background_color, theme_color.

## Service worker

Already covered. Use a versioned `CACHE_NAME`. Handle Range requests for audio. Don't cache opaque cross-origin responses. Network-first for code, cache-first for assets.

## Safari limitations

Things Safari does that Chrome doesn't:
- Stricter audio autoplay enforcement
- More aggressive cache eviction for service workers
- Range request quirks (see above)
- `100vh` includes/excludes safe-area inconsistently (use `100dvh`)
- Pinch-zoom can fire even with `user-scalable=no` on some iOS versions
- `localStorage` evicted after 7 days of non-use

Plan for the strictest browser. If it works in Safari iOS, it works everywhere.

## What to test on actual iPhones

These you cannot test in Chrome DevTools:

1. **Audio plays on first tap** (browser autoplay enforcement is real)
2. **Audio survives backgrounding the app** (phone call, switching apps)
3. **Touch controls feel right** (DevTools touch emulation doesn't capture latency)
4. **Canvas extends to screen edges** (notch / home indicator handling)
5. **HUD text is readable** with notch in the way
6. **Buttons aren't hidden by home indicator**
7. **Performance is 60 fps** in actual conditions
8. **Cold-start audio works** (after closing the app fully)
9. **Service worker offline behavior** (turn on airplane mode, reload)
10. **Install to home screen** works and the icon shows correctly

## Mobile shipping checklist

Before declaring the mobile build ready:

- [ ] `viewport-fit=cover` meta tag set
- [ ] `apple-mobile-web-app-capable` meta tag set
- [ ] Manifest declares orientation, display=standalone, icons
- [ ] Service worker registers and caches assets
- [ ] Service worker handles Range requests for audio
- [ ] Cache version bumps on each release
- [ ] All audio waits for user gesture
- [ ] AVAudioSession warmed on first gesture (for iOS)
- [ ] Touch controls anchored to canvas, not viewport
- [ ] Touch controls use Pointer Events with capture
- [ ] HUD respects safe-area-inset
- [ ] Canvas fills screen edge-to-edge using 100vw/100dvh
- [ ] Tested on a real iPhone (not just simulator)
- [ ] Tested on an older / slower phone
- [ ] Tested offline after first load
- [ ] Tested backgrounding and returning
- [ ] Icons opaque (no alpha)
- [ ] Privacy policy URL hosted somewhere public

## Capacitor + iOS App Store specifics (the painful ones)

If wrapping the PWA in Capacitor for App Store distribution:

### 1. `contentInset: "never"` in `capacitor.config.json`

The default is `"always"`, which makes the WebView auto-pad for safe areas. This was our v1.0.18 fix.

```json
{ "ios": { "contentInset": "never" } }
```

Without this, your canvas can't reach the screen edges on iPhones with notches.

### 2. `@capacitor/assets` needs `icon-only.png`, NOT `icon.png`

The v3 plugin silently produces no icons if you only have `icon.png`. We shipped two builds with the placeholder icon before catching this.

```bash
cp resources/icon.png resources/icon-only.png
```

Even better: the bulletproof fallback step in `codemagic.yaml` uses `sips` to manually generate every icon size, bypassing `@capacitor/assets` entirely.

### 3. `UIRequiresFullScreen=true` for landscape-only Universal apps

Apple rejects Universal apps (iPhone + iPad) with landscape-only orientation unless `UIRequiresFullScreen=true` is set. This says "no iPad multitasking." For a game, fine.

We added this via PlistBuddy in `codemagic.yaml`.

### 4. Code signing requires a private key

The App Store Connect API can create a distribution certificate, but it needs YOUR private key. The `--certificate-key` flag in the codemagic-cli-tools provides it.

```bash
openssl genrsa 2048 > /tmp/cert.pem
app-store-connect fetch-signing-files "$BUNDLE_ID" \
  --type IOS_APP_STORE \
  --certificate-key @file:/tmp/cert.pem \
  --create
```

Without this, the build fails at signing with "Cannot save Signing Certificates without certificate private key."

### 5. Cert reuse via stored private key

Apple caps you at 2 distribution certificates per account. Don't generate a new one per build. Store your private key as `CERT_PRIVATE_KEY` in Codemagic env vars; reuse it.

### 6. Subtitle is hard-capped at 30 characters

App Store Connect rejects subtitles > 30 chars silently. (We hit this with "A retro adventure through creation" = 35 chars.)

### 7. Privacy policy URL must be publicly accessible

Apple checks it during review. If it 404s, rejected.

### 8. Screenshots at exact pixel sizes

iPhone 6.7" landscape = **2796×1290**. iPad 13" landscape = **2732×2048**.

Universal apps require BOTH sets. To skip iPad: set `TARGETED_DEVICE_FAMILY = 1` (iPhone only).

### 9. Encryption compliance

Set `ITSAppUsesNonExemptEncryption = false` in Info.plist to avoid the manual "Does your app use encryption?" prompt on every submission.

### 10. App Privacy questionnaire

"Data Not Collected" = the easy answer if you genuinely collect no data. Saves you 20 questions.

## A line to live by

> *"The desktop browser is the develop-and-pretend environment. The phone is the truth. Build for the truth from day one."*
