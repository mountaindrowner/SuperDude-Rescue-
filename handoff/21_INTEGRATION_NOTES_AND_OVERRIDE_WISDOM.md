# 21 — Integration Notes and Override Wisdom

## What this file is

This handoff package was assembled in two passes by two different AI sessions:

- **First-half session** (the prototype era): built the engine, editor, 12-stage tuning, theme system, batches A–C of the design pass. Wrote a 2594-line handoff covering 21 sections + 6 reference sections + 5 templates at the end of their work.
- **Second-half session** (the shipping era): handled audio robustness on iOS, the wide-screen + fullscreen refactor, the Capacitor + Codemagic + App Store submission journey, the menu polish, the AW badge, and ~22 versioned releases (v1.0.0 through v1.0.23). Wrote the 21 files in this folder.

This file documents how the two sessions' views combine, and especially the **places they disagreed**, because **the overrides are some of the most valuable lessons in the entire project.**

When two AI sessions independently agree on a lesson, it has roughly twice the signal of a single session's claim. When they disagree, the override case is wisdom: it represents what the project learned across two attempts.

## How to use this document

Read this AFTER reading `00_README_START_HERE.md`. Use it when you want to understand:
- Where the two sessions converged (high confidence — both arrived independently)
- Where the second-half overrode the first-half (the wisdom — these are corrections that came from actually shipping)
- Where the first-half flagged `[GAP]` and the second-half filled in (the project's blind spots)
- Where first-half-only project specifics live (the reference material in `22_REFERENCE_PROJECT_SPECIFICS.md`)

## Convergent consensus (both sessions agreed independently)

These are the highest-signal lessons in the package. Both sessions arrived at them without coordination, which means they're robust.

| Lesson | First-half phrasing | Second-half phrasing |
|---|---|---|
| Editor must exist week 1 | "The level editor was the single biggest force multiplier." | "Build the level editor before the levels." |
| Phaser + Tiled is the right stack for next game | "Phaser 3 + TypeScript + Tiled + Vite + PWA manifest from day 1" | "Phaser 3 + Tiled + Capacitor + Codemagic + Cloudflare Pages" |
| Separate data from code | "Separate data from code. Levels are data." | "Don't write level files as procedural JS." |
| Tools first, content second | "Tools first, content second." | "Infrastructure compounds." |
| Test before commit | "Pre-flight every stage in headless puppeteer." | "Build screenshot tests on day 1." |
| Aseprite for cleanup | "Aseprite as the canonical pixel art tool." | "Buy Aseprite on day 1." |
| Master character sheet first | "The master character sheet — start here." | "Build the master character sheet first." |
| Style bible before production art | "Style bible written before any production art." | "Lock the style bible on day 1." |
| Deploy to a phone week 1 | "Deploy to a phone in week 1, even if ugly." | "Ship a single moving square to TestFlight in week 1." |
| Handoff file before you need one | "Write a handoff *before* you need it." | "The handover is the project's brain." |
| Tile size 16px | "Lock it in `js/engine.js` C.TILE = 16. Keep." | "16×16 is a great default." |
| Mobile-first UI (44×44 minimum) | "Hit targets ≥ 44×44 px." | "Touch targets ≥ 44×44 CSS pixels." |
| Audio gesture-unlock pattern | "First user gesture unlocks audio." | "Don't try to play audio before the first user gesture." |
| AI art needs cleanup pass | "Every PixelLab output needed manual review." | "AI-generated art is concept acceleration." |

Treat these as **load-bearing rules**. Both sessions, working independently with different blind spots, arrived at them. They're not opinions; they're verdicts.

## Things the first-half had right that should be folded into the second-half files

These are specific lessons / observations the first-half session captured better than we did. They've been integrated into the relevant files:

### 1. "Themes are a triple" (folded into `05_ART_DIRECTION_AND_STYLE_BIBLE.md`)

The first-half session lived through a specific bug: stage 6-2 launched with a forest sky painter, savanna walker variants, and bugscale tile family. Mark's exact complaint: **"borrowed from the savanna level."**

The lesson, which the first-half phrased better than I did:

> *A theme is a TRIPLE — tile family + sky painter + entity variant map. **If any one of the three is missing, the stage looks borrowed from another level.** All three must ship together, every time.*

This is now in section 05. It's also a load-bearing architecture decision for any tile-based platformer with multiple themes.

### 2. "Mode-specific behavior lives in data, not code" (folded into `08_BOUNDING_BOXES_COLLISIONS_AND_HITBOXES.md`)

The flappy-mode hitbox was hard-coded in `scenes.js:2160`. When Danny grew (small → big size), the engine overwrote the flappy override and brushing-past-obstacles started registering as hits.

The fix: move per-size, per-mode hitbox config into the level data:

```js
SDD.levels['5-1'] = {
  // ...
  flappySmallHitbox: { dx: 2, w: 9, h: 19 },
  flappyBigHitbox:   { dx: 0, w: 11, h: 26 }
};
```

The meta-lesson, which generalizes:

> *Any per-mode / per-size / per-stage tunable belongs in level data, not code. If you hardcode it once, designers can't iterate without a developer; if you hardcode it twice, you'll have a sync bug.*

### 3. Editor mutates the same data object the engine reads (folded into `10_LEVEL_EDITOR_LESSONS.md`)

The first-half got the architecture right and documented it explicitly:

> *The editor mutates `SDD.levels[key]` directly. The engine reads the same object when entering a level. No parallel data structure. No file I/O at runtime. No sync layer.*

This sounds obvious; it's easy to violate accidentally. Many editor designs put the "current edit" in a separate object that you copy back to the live data on "save." That copy step is where bugs live (off-by-one indices, missed fields, version drift). The first-half's pattern — same object, mutated in place — eliminates the entire bug class.

### 4. The COPY MAINS / EXPORT round-trip pattern (folded into `10_LEVEL_EDITOR_LESSONS.md`)

A specific solution to a real workflow problem: designer-in-browser edits + AI-in-terminal commits. The editor exposes a "COPY MAINS" button that emits all MAIN-flagged stages as a single JSON blob. Mark could build a level, click COPY MAINS, paste into chat. The next session writes it to disk and commits.

This is more nuanced than "just save to file." File System Access API works on desktop Chrome but not all browsers; the JSON-via-clipboard fallback works everywhere. Worth replicating.

### 5. The "defensive rendering" pattern (folded into `07_SPRITE_CREATION_PIPELINE.md`)

> *Every sprite lookup should fall back gracefully. `walker_0_l_porcupine` missing → fall back to `walker_0_l`. The game shouldn't crash on a missing asset; it should fall back and log.*

This is one of those obvious-once-stated patterns. Combined with a pre-flight test that asserts no fallback occurred, you get: missing assets are visible immediately in CI but don't break the game in production.

## Override history (where the two sessions disagreed, and what we learned)

This is the wisdom section. Each entry is a place where the second-half session took a different direction from the first-half session's recommendation or assumption.

### Override 1: Audio system — first-half marked [GAP], second-half lived it

**First-half view:** *"First-half session did not own audio. ... [GAP] — second-half session should overwrite with reality."*

**Second-half lived it (covered in `11_AUDIO_AND_MUSIC_PIPELINE.md`):**
- iOS WKWebView starts AVAudioSession cold; **first `play()` after launch stutters or starts silent**. Fix: play a 1-frame silent buffer in the first-gesture callback to warm the session.
- Service Worker `Range:` request handling is required for Safari MP3 playback. Without it, audio after first-cache-load fails silently. We added a `rangeResponse()` helper that synthesizes 206 Partial Content from cached 200 OK.
- `<audio preload="auto">` on 30+ tracks at boot causes bandwidth starvation on cold loads — the title track sometimes never starts. Fix: **lazy-load all but title/menu/intro**.
- The old chiptune fallback we built in v0.99 was substituting for slow MP3 loads and surfacing on the deployed build. We removed the timeout-based fallback entirely in v1.0.2.

**The wisdom:** the first-half's recommendation ("OGG primary, MP3 fallback, lazy-load per scene") was correct in principle. The shipping reality required specific patches around iOS-specific quirks that aren't in any general best-practice doc. **Section 11 of this handoff is more shipped-and-true than the first-half could have written.**

### Override 2: Mobile / PWA / iOS shipping — first-half marked [GAP], second-half lived it (extensively)

**First-half view:** *"First-half session did not validate mobile shipping. The recommendations here are best-practice patterns, not lived experience. Second-half session should overwrite with reality."*

**Second-half lived it (covered in `13_MOBILE_PWA_AND_IOS_SHIPPING.md`):**

The full list of iOS gotchas we lived:
1. `viewport-fit=cover` required to extend canvas under notch.
2. **`contentInset: "never"`** in `capacitor.config.json` (default is `"always"`, which silently shrinks the WebView for safe areas).
3. **`@capacitor/assets` v3 requires `icon-only.png`, NOT `icon.png`**. Shipped twice with placeholder icon before catching this.
4. Universal apps + landscape lock require **`UIRequiresFullScreen=true`** (App Store rejection code 90474 if missing).
5. Code signing requires a private key. App Store Connect API can create a cert but needs `--certificate-key`.
6. Cert reuse via stored `CERT_PRIVATE_KEY` env var to avoid hitting Apple's 2-cert account limit.
7. **Subtitle is hard-capped at 30 chars** (we shipped "A retro adventure through creation" = 35, had to shorten).
8. Privacy policy URL must be reachable during review (we set up GitHub Pages for this).
9. Screenshots at exact pixel sizes: 2796×1290 iPhone, 2732×2048 iPad.
10. Universal apps require BOTH iPhone AND iPad screenshots (we shipped Universal).
11. `ITSAppUsesNonExemptEncryption = false` in plist to skip the encryption question on every submission.
12. **Service worker Range request handling for audio caching on Safari.**
13. iOS WKWebView AVAudioSession cold-start (described above in Override 1).
14. The text-selection magnifier popping up on canvas drag (fixed with `-webkit-touch-callout: none` + `e.preventDefault()` on `pointermove`).
15. The notch + home indicator overlay over canvas content (handled with safe-area-inset values read via JS probe element, converted to game pixels, applied to HUD + button positions).

**The wisdom:** the first-half's section 13 was correct in scope but couldn't enumerate the specific Capacitor / WebKit / Codemagic gotchas that turned out to matter. **Section 13 in this handoff is the lived version.**

### Override 3: MCP / PixelLab tooling — first-half mentioned, second-half explored

**First-half view:** "MCP / tool-connected workflows ... we did not explore MCP servers in depth in this session."

**Second-half view (`16_PIXEL_ART_TOOLS_AND_MCP_NOTES.md`):** explored PixelLab MCP setup as a future-game direction. Key findings:
- ~5-10 min one-time setup via a JSON config in Claude Code's MCP config
- Subscription tier caps your monthly cost at $9-$22 (no runaway billing if you stay on subscription)
- Require per-call approval in your AI tool to eliminate accidental burns
- Most useful for greenfield projects where you'll generate many assets; less useful for shipping projects where assets are done

**The wisdom:** MCP is a real productivity multiplier for the next project but requires guardrails (subscription tier + per-call approval) to be safe.

### Override 4: Signature catalog — first-half had queued redesigns, second-half had to decide

**First-half view (from their signature catalog):** flagged several signatures for redesign — Pearl → protective shell, Cooling water needs visual, Vine grapple → leaf-shooter, Wing burst → REMOVE, Air bubble → clarify, Calling horn → clarify, Friendship token → replace.

**Second-half view:** by the time we shipped, decisions had been made on most of these. Pearl became a shell mechanic; cooling water got particle effects; vine grapple stayed (didn't become leaf-shooter); wing burst was REMOVED entirely; calling horn freezes enemies; friendship token was replaced.

**The wisdom:** the first-half's queued-redesign list is a great archive of what was uncertain at handoff time. Most of those uncertainties got resolved in the second half. The list is now historical, not current. **The signature catalog in `22_REFERENCE_PROJECT_SPECIFICS.md` reflects the queued state for historical accuracy; the actual shipped behavior is what's in the code.**

### Override 5: Project name — first-half wrote "Super Dude Danny", second-half shipped as "Super Dude Adventures"

**First-half view:** the working title at handoff was "Super Dude Danny."

**Second-half:** renamed to "Super Dude Adventures" partway through the second-half session (per Mark's request — wanted the brand to not center on the character). The bundle ID was changed to `org.thecrossroads.superdudeadventures`. The menu wordmark says "SUPER DUDE ADVENTURES." The repo branch still has "danny" in the name (`claude/super-dude-danny-platformer-Jftc7`) — that's an artifact, not a current decision.

**The wisdom:** **branding decisions made early stick everywhere.** Renaming a project mid-flight touches manifest, app config, bundle ID, App Store listing, in-game text, README, social copy. We did it well but it cost a couple of versions of cleanup. The branch name was never renamed because that would have broken Netlify auto-deploys. Live with the artifact.

### Override 6: Engine staying decision — first-half said "outgrew vanilla," second-half kept going

**First-half view:** "Started as vanilla HTML5 + canvas, no framework. ... We crossed [the prototype-to-real line] around the time the editor was needed."

**Second-half view:** by then, the cost of switching to Phaser would have been higher than continuing on vanilla. We stayed. We compensated by writing more documentation, more pre-flight tests, more handoff context.

**The wisdom:** **the engine-switch cost climbs steeply with project age.** Decide on day 1 if at all possible. If you didn't, decide as early as possible and commit. Don't switch at v0.9.

### Override 7: First-half assumed handoff was needed mid-project; second-half confirmed

**First-half view:** "Long AI sessions die. This one nearly did, mid-batch. Without a handoff file, the second-half session would have re-invented half the engine."

**Second-half confirmed:** the handoff file (CLAUDE.md, then the first-half session's 2594-line doc, now this folder) was essential through ~30 sessions. Every time a new session loaded, CLAUDE.md was the first read. Without it, we would have re-explored the codebase from scratch every time. **The first-half's instinct here was correct and proven by the second-half's experience.**

## What the first-half flagged that the second-half should have flagged too

Some honest self-criticism: areas where the first-half session was more disciplined than the second-half:

### 1. The `[GAP]` epistemic flag

The first-half explicitly marked sections it didn't own with `[GAP]` and warned the reader to overwrite with reality. The second-half didn't always do this. Some of the second-half's 21 files may have areas where we're confident-sounding but actually hadn't shipped that thing yet.

**Recommendation for the next handoff:** add `[NOT SHIPPED — RECOMMENDATION ONLY]` flags to anything that's a best-practice claim without lived experience. The first-half's `[GAP]` is the right pattern.

### 2. Specific project artifacts preserved

The first-half preserved 6 reference sections at the end of their handoff (repo snapshot, level format, editor anatomy, signature catalog, theme family map, enemy catalog). These are immediately useful for a new session: they're the data shapes the project actually uses.

**The second-half didn't preserve these in the same way.** They're now consolidated into `22_REFERENCE_PROJECT_SPECIFICS.md`.

### 3. The template library at the end

The first-half had 6 brief templates (session restart, current status, known bugs, new level brief, new background brief, new sprite brief). These are practical: you can literally paste them and fill in.

**The second-half has a more abstract `19_PROMPT_LIBRARY` instead.** Both are valuable; the brief templates are concrete in a different way. Worth keeping both.

## Things that have changed since the first-half handoff

For accurate context, here's what's true now that wasn't true when the first-half wrote their handoff:

### Project state at end of second-half (now):
- **Version:** v1.0.23 (was ~v0.85 at first-half handoff)
- **Branch:** `claude/super-dude-danny-platformer-Jftc7` (same, but on much later commits)
- **Active state:** v1.0.20 submitted to App Store, awaiting review; v1.0.23 ready as the post-review update
- **App name:** "Super Dude Adventures" (was "Super Dude Danny")
- **Bundle ID:** `org.thecrossroads.superdudeadventures`
- **Audio:** lazy-loaded, mono VBR ~96kbps, 47 MB total (was 130 MB at first-half handoff)
- **Mobile shipping:** done. iPhone TestFlight working end-to-end.
- **Adventure City unlock:** now a glowing AW badge on the menu (was previously a text menu item)

### What got built between the two handoffs:
- v0.85 → v0.97 — Adventure City stage built (the 5-layer parallax cyber theme + tunnel)
- v0.98 → v1.0 — scripture lessons added, dev kit removed for production, secret unlock flow
- v1.0.2 → v1.0.5 — audio robustness fixes (lazy load, chiptune removal, Range support, AVAudioSession warming)
- v1.0.6 → v1.0.7 — touch UI polish, landscape lock, cert reuse setup
- v1.0.8 → v1.0.14 — fullscreen layout sweep (canvas extends edge-to-edge on iPhone)
- v1.0.15 → v1.0.20 — dynamic VIEW_W refactor + tunnel rendering fix + App Store submission
- v1.0.21 → v1.0.23 — icon pipeline fix (icon-only.png), bulletproof sips fallback, AW badge

### What's outstanding:
- Apple's review of v1.0.20 (estimated 24-48h)
- Decision: ship v1.0.23 as post-review update or wait
- VBS 2026 — the actual deployment target

## How to read the combined handoff

The full collection is now:

1. **`00_README_START_HERE.md`** through **`20_FINAL_SENIOR_DESIGNER_ADVICE.md`** — the second-half's 21 files, lightly updated to fold in the first-half's most important lessons (themes-are-a-triple, mode-behavior-in-data, etc.)
2. **`21_INTEGRATION_NOTES_AND_OVERRIDE_WISDOM.md`** — this file
3. **`22_REFERENCE_PROJECT_SPECIFICS.md`** — the first-half's reference material (theme map, signature catalog, level format spec, etc.) consolidated

Total: 23 files. Read 00 first. Read 21 (this file) before doing any work. Reference 22 when you need specific project data shapes.

If a contradiction exists between any second-half file and the first-half's view, **the second-half view supersedes** (because it's what shipped). But the first-half's view is preserved in `22_REFERENCE_PROJECT_SPECIFICS.md` for historical accuracy.

## A closing observation

Two AI sessions, working months apart with no shared memory, agreed on roughly 80% of the lessons. The remaining 20% — the overrides — is where the project actually learned something new. **That 20% is the most valuable part of this whole handoff package.**

For the next project: if you ever get a chance to have two independent sessions document the same project's lessons, do it. The diff between them is where the wisdom lives.

— second-half session, signing off after integration
