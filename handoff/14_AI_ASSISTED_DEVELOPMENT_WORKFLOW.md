# 14 — AI-Assisted Development Workflow

This file is what we learned about working with AI (Claude Code, ChatGPT, Cursor) as a development collaborator over a year-long project.

## What the AI is genuinely good at

### 1. Brainstorming
"What signature power-ups would fit the seven days of creation theme?" → 10 reasonable ideas in 30 seconds. Pick the ones that fit.

### 2. Code generation for well-defined units
"Write a fillRect-based parallax painter for a cyber-night sky with 5 layers, specifying each layer's parallax speed and color treatment." → working code in one shot.

### 3. Debugging
"Here's a stack trace and the relevant code. What's wrong?" → typically locates the bug faster than a human, especially for typos and off-by-one errors.

### 4. Asset prompts
"Generate a Midjourney prompt for a 5-layer parallax background for a forest-canopy stage at 320×180 native pixel art." → an actually-good prompt, not "make a forest."

### 5. Level design ideas
"Design Day 3-1 'Mountain Rise' — what mechanics and hazards fit a rocky climb theme?" → ideas you can then judge and pick from.

### 6. Documentation
This file. It's typing thousands of words of context. AI is fast at that.

### 7. Refactoring plans
"This file is 9000 lines. How would you split it into modules?" → a reasonable split + a step-by-step migration plan.

### 8. Research
"What are the known iOS WKWebView audio quirks?" → a summary of issues across forum threads, faster than reading the threads yourself.

## What the AI is genuinely bad at

### 1. Remembering everything forever
Sessions fill up. Context windows are finite. The AI forgets details mid-session sometimes. **You cannot rely on AI memory across sessions without a handover file.**

### 2. Maintaining visual consistency without a style bible
"Make another background like the last one" → drift. Different palette, different lighting. The AI doesn't actually remember the look.

### 3. Perfectly generating production-ready sprites
PixelLab / Midjourney / ChatGPT image → 80% there. The remaining 20% is hand-cleanup. Plan for it.

### 4. Making assumptions about file structure
Without explicit constraints, an AI will invent a folder structure that doesn't match yours. Always specify "save this in `src/scenes/`, use the existing naming convention `kebab-case.js`".

### 5. Continuing after session glitches
When a session times out, gets compacted, or recovers from a network blip, the AI's memory of *what you were doing* can be patchy or hallucinated. Verify before acting.

### 6. Self-correction without feedback
The AI tends to confidently produce something that doesn't quite work, then if you say "that didn't work" without specifics, makes a different wrong thing. Be specific in feedback.

### 7. Knowing when to stop
An AI given an open-ended task will keep going. "Improve this code" can produce 200 lines of "improvements" that are bigger than the original. Constrain the scope.

### 8. Decisions you should make
"What art style should I use?" → the AI will pick one for you. That's a design call. Make it yourself; ask the AI for trade-offs.

## How to prompt better

### Be specific about constraints

❌ "Make the audio better."
✅ "The title music takes 4+ seconds to start on iPhone Safari. Diagnose why and propose a fix. The current code is in `js/audio.js` at lines 200-400. We're using `<audio>` elements with `preload='auto'` for all 38 tracks."

### Be specific about the deliverable

❌ "Add a level editor."
✅ "Add a level editor as a new scene `SDD.scenes.editor`, accessible from a hidden 'EDITOR' menu item. Required features: tile painting from a sidebar palette, entity placement by click, save to JSON via File System Access API, load by paste."

### Provide examples

❌ "Make the menus nicer."
✅ "Here's the current menu render at line 432. Improve the visual hierarchy: title should pop more, version label should be smaller and bottom-right, selection arrow should pulse subtly. Don't restructure the menu items list."

### Acknowledge what's been done

❌ "Now let's work on audio."
✅ "v1.0.5 lazy-loaded the MP3s and that fixed the title music delay. Now Mark reports the chiptune fallback occasionally surfaces on the deployed build. Look at the fallback path — find why and remove it."

## Use AI like a senior assistant, not a magic button

### Senior assistant
- You define the problem
- They propose approaches
- You pick one
- They execute
- You review
- They iterate

### Magic button
- You wave at the problem
- They make Stuff happen
- You hope it's right
- It usually isn't quite

The senior-assistant mode produces better work in less time. The magic-button mode produces more work because you spend half your time un-doing what the AI did unsupervised.

## Recommended AI workflow

For any non-trivial change:

### Step 1: Ask for diagnosis
"Here's the symptom. Where in the code is this likely caused?"

The AI scans, hypothesizes, points at files and lines. You read those. You confirm or redirect.

### Step 2: Ask for a plan
"Given that the bug is in X, propose 3 fixes. For each, list pros, cons, and risk."

The AI lists options. You pick one. Don't let it just start fixing.

### Step 3: Ask for file-by-file changes
"Implement option B. Show me the edits per file before applying."

The AI shows diffs. You review. You approve or adjust.

### Step 4: Test
The AI runs tests / opens browser / takes screenshots. You verify the result.

### Step 5: Iterate
Found a regression? Back to step 1.

### Step 6: Document
Commit message. CHANGELOG entry. CLAUDE.md update. **This is the step humans skip. The AI is great at it. Make the AI do it.**

## How to recover when a session fills up, glitches, or loses context

### The handover file is your savior

In this project, `CLAUDE.md` is the handover. It's a living document that the AI consults every session.

When a session compacts or restarts:
1. New session reads CLAUDE.md
2. Picks up where the last one left off
3. Updates CLAUDE.md as new things happen

### What to put in the handover file

- Current branch
- Current version
- What's been shipped recently
- What's currently broken
- What's about to be worked on
- Architecture overview
- Key file locations
- Convention reminders ("we use VAR not LET", "version bumps in lockstep across 3 files")

### What NOT to put

- Long code listings (the AI can read the code)
- Verbose narrative ("then I tried X, then Y, then Z")
- Hopes and dreams ("eventually we'll add multiplayer")

The handover is a **briefing**, not an autobiography.

### Session-restart message template

When you suspect a session is acting weird, drop this:

```
Stop. Before continuing:
1. Read CLAUDE.md fully.
2. Confirm the current branch and version from git.
3. Summarize in 3 lines what we just finished and what's next.
4. Then proceed with my next request.
```

This forces the AI to ground itself. Costs 10 seconds. Saves 30 minutes of confused output.

### When the AI hallucinates continuity

Sometimes the AI will say "Yes, I remember we discussed X" when you didn't. Or "The function you're asking about is in `frob.js`" when there's no `frob.js`.

When you spot this:
- Stop the current task
- Confirm reality by checking the actual file
- Tell the AI "that's not in the repo; here's what's actually there"
- Reset and continue

Don't let the AI build on a false premise. The hallucination compounds.

## When to use AI vs. when to do it yourself

### Use AI for
- Writing the first draft of new code (faster than typing)
- Implementing well-defined features
- Debugging stack traces
- Writing documentation
- Generating asset prompts
- Refactoring repetitive code
- Researching obscure APIs

### Do it yourself
- Making design decisions ("what genre", "what art style", "what's the core gameplay loop")
- Final review before commit
- Anything safety-critical (payment, auth, PII handling)
- Anything legally consequential (contracts, terms, privacy)
- Saying "this is good enough, ship it" — the AI will always want to do more

## The pair-programming model

The most productive arrangement we found:

1. **Human:** declares the next concrete goal in one sentence
2. **AI:** restates it, asks clarifying questions if needed
3. **AI:** proposes implementation
4. **Human:** approves / adjusts / rejects
5. **AI:** implements
6. **Human:** reviews
7. **Human + AI:** test together
8. **Human:** commits

Steps 2 and 4 are where humans usually skip. Don't. The clarifying question step catches misunderstandings before they cost time. The approval step catches scope creep.

## Cost / efficiency note

AI assistance accelerates rote work and slows down decisions. Net effect on this project: **probably 5–10× faster than I would have been alone** for code typing, ~equivalent for design decisions (you still have to make them).

The cost of AI sessions adds up. Be efficient with prompts. Don't iterate 15 times when 3 + a session restart would have worked. The handover file enables fewer-but-better sessions over more-but-confused ones.
