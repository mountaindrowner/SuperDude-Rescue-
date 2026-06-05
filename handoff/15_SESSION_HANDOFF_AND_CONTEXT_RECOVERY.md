# 15 — Session Handoff and Context Recovery

## Why this matters

AI assistants have memory limits. Sessions fill up, compact, glitch, or simply end. **Without an external handover document, every new session starts from scratch.** Every time. Wasting hours re-explaining the project before you can do new work.

This file is how to never have that problem again.

## What broke for us

In this project, we hit:
- Multiple sessions that filled their context window mid-conversation
- A session that "compacted" and lost specific details
- A session that recovered after network blips with patchy memory
- A session that hallucinated previous decisions
- Sessions where the new AI confidently claimed to remember things that hadn't happened

The fix that worked every time: **`CLAUDE.md` as a living handover document.** Updated continuously. Read at the start of every session. Treated as the source of truth.

## What information must be preserved

Across sessions, the things you MUST be able to recover:

### Project identity
- Project name
- Repo URL
- Active branch
- Current version
- Target platform(s)

### Architecture
- Tech stack
- Folder structure
- Module organization
- Key conventions (naming, code style, version-bump-in-lockstep, etc.)

### Status
- What was just finished
- What's about to be worked on
- What's known broken
- What's blocked and why

### Art / asset rules
- Sprite dimensions
- Color palette
- Audio bitrate
- Resolution
- Aspect ratio

### Level format
- Tile codes
- Spawn types
- Level data schema

### Build / deploy rules
- Version-bump-in-lockstep (which files)
- Build commands
- Deploy targets
- Required secrets / env vars

### Known gotchas
- "Don't do X because last time it broke Y"
- "Service worker cache requires bumping CACHE_NAME"
- "iOS contentInset must be 'never'"

If a new session is missing any of these, they will rediscover them — slowly.

## The CLAUDE.md (or HANDOVER.md) template

```markdown
# Project Name — Session Handover

> **If you're a new AI session reading this for the first time:** read this whole file before touching anything. It is the durable handover between sessions. Only what's pushed to git survives a session crash. Update this file as major work lands.

---

## WHERE WE ARE RIGHT NOW (latest first)

- **Active branch:** `feature/level-editor`
- **Live build:** v1.0.23 / cache-shell-v123
- **Most recent commit:** `83d3fd1` — "v1.0.23: AW badge on menu"
- **Last finished:** AW unlock badge replaces text menu item (v1.0.23)
- **Currently working on:** waiting for App Store review of v1.0.20
- **Known broken:** none
- **Blocked on:** Apple review (~24-48h)

---

## PROJECT STATE SNAPSHOT

### What this is
[1 paragraph description]

### Tech stack
- HTML5 Canvas 2D, plain JS, no build step
- Capacitor 6 for iOS wrap
- Codemagic for CI/CD
- Netlify for web PWA

### File layout
```
[a short tree]
```

### Conventions to honor
- VAR not let (ES5-ish for compatibility)
- Version bumps in lockstep: `SDD.VERSION`, `CACHE_NAME`, `MARKETING_VERSION`
- All assets in `public/assets/`
- No spaces in filenames
- Sprite frame size: 32×32, feet anchor at y=30

### Architecture
[brief description of scene manager, entity system, etc.]

---

## GOTCHAS (don't re-learn these the hard way)

1. **Service worker cache trap.** Bump CACHE_NAME every release or users see old build.
2. **iOS contentInset.** Must be "never" in capacitor.config.json for fullscreen.
3. **@capacitor/assets needs icon-only.png**, not icon.png. Otherwise no icon ships.
4. **Audio gesture-gate.** Don't try to play before user input.
5. [list of project-specific gotchas]

---

## CHANGELOG (most recent first)

### v1.0.23 — AW badge
[brief]

### v1.0.22 — Bulletproof icon generation
[brief]

[etc., dating back to project start]
```

This is the template. Adapt to your project. Keep it under 200 lines.

## When to update CLAUDE.md

Update IT every time:
- You start a new major task (so the next session knows what you were doing)
- You finish a major task (so the next session knows what's done)
- You discover a gotcha (so the next session doesn't relearn it)
- You change architecture (so the next session has the new map)
- You decide a convention (so the next session honors it)

Don't update for trivia. Don't include every line of code you wrote. The handover is a **summary**, not a journal.

## When NOT to trust your own memory

In a long session, ask yourself periodically:

- Did I actually just do this, or am I thinking of last week?
- Is this file really there, or am I assuming?
- Did the test actually pass, or do I just remember it passing?

**Verify before continuing.** A 5-second `cat` or `ls` saves a 30-minute build on a wrong assumption.

## When NOT to trust the AI's memory

Same exercise. If the AI says "we already fixed that," verify in the code. If it says "this function is in `frob.js`," confirm `frob.js` exists. The AI can hallucinate continuity, especially after context recovery.

Verification habit: **the file is the source of truth.** Memory (yours or the AI's) is approximation.

## Templates

### Session-restart message (paste at the start of a new session)

```
I'm continuing work on [PROJECT NAME]. The repo is at [URL]. **Read CLAUDE.md first** — it has the full handover. Active branch is [BRANCH]. Don't switch branches.

When you've read CLAUDE.md, summarize in 5 lines:
1. What was the last finished work?
2. What's currently in progress?
3. What's blocked or known broken?
4. What conventions must I honor?
5. What's the next thing I should work on?

Then wait for my next request.
```

This forces the AI to ground itself before acting. Costs 30 seconds. Prevents an hour of confusion.

### Current project status file (template)

```
# Status — [DATE]

## Live build
- Version: vX.Y.Z
- Shipping at: [URL or platform]
- Last user-visible change: [brief]

## In progress
- [task] — [% complete] — [next subtask]

## Backlog (prioritized)
1. [item]
2. [item]
3. [item]

## Blocked
- [item] — blocked on [reason]

## Recently shipped
- vX.Y.Z-1 — [brief]
- vX.Y.Z-2 — [brief]
```

### Known bugs + next tasks (template)

```
# Known issues

## Critical (blocks shipping)
- [bug] — [symptoms] — [where to look]

## High (annoying)
- [bug] — [workaround if any]

## Low (cosmetic)
- [bug]

# Next tasks (prioritized)

1. [task] — [estimated effort] — [why important]
2. [task]
3. [task]
```

## The discipline

Treat CLAUDE.md / HANDOVER.md / STATUS.md as a **first-class artifact of the project.** Edit it with the same care you edit code. Commit it. Review it. Keep it lean.

The bug we hit most often: **the handover got out of date.** A new session reads it, acts on stale info, breaks something. The fix is to update on every meaningful change, not "later when I have time."

## A summary

- AI memory is finite. External documents are infinite.
- The handover is the most important file in the repo after `package.json`.
- Read it at the start of every session.
- Update it at the end of every meaningful change.
- Verify file/code reality before trusting any memory.
- One file, kept current, in git, is worth 100 well-meaning conversations.

## A line to live by

> *"The handover is the project's brain. Code is the project's body. Lose either, you have a corpse."*
