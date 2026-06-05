# 20 — Final Senior Designer Advice

*(Read this last. Written as a senior designer talking to a junior developer about to start their next game.)*

---

Hi.

You're about to start a new game project. You're going to read 19 other files in this folder. Most of them are concrete: "do this, not that, here's why." This file is the one that's mostly about how to think while you do all of it.

Take an hour with it before you write any code. It's not long.

## The biggest production lesson: scope discipline beats talent

Every game I've worked on that shipped was 60% smaller than the original vision. Every game I've worked on that didn't ship tried to be everything.

The trick isn't talent. The trick isn't even time. It's the **discipline to say no to your own ideas.**

Halfway through Super Dude Adventures, the team had ideas for: co-op multiplayer, a level editor for kids, online leaderboards, daily challenges, a parent dashboard, animated cinematics for every level, voice-over for every lesson, secret characters, branching paths, a sequel hook. We said no to all of them. We shipped 12 levels + 1 secret level.

If we'd said yes to even three of those ideas, the game wouldn't have shipped. It would still be in development. Forever in development.

**Pick a tight scope. Defend it.** The game you ship is the only one anyone plays.

## The biggest creative lesson: gameplay readability is everything

Pretty art is easy. Readable art is hard. Players play games by **reading the screen** — finding the player, the enemy, the platform, the goal — and reacting fast.

If your beautiful background makes the player invisible, your beautiful background is broken. If your detailed enemy sprite blends into the tileset, your detailed enemy sprite is broken. If your platforms look like decoration and your decoration looks like platforms, your level is broken.

The fix is **silhouette discipline.** Player silhouette should be unmistakable. Enemy silhouettes should be unmistakable. Platforms should be unmistakable. The eye should find the gameplay elements first, the art second.

A 10/10 game with 7/10 art outperforms a 7/10 game with 10/10 art. Always.

## The biggest technical lesson: infrastructure compounds

The week you spend writing the level editor saves a month of level building. The day you spend setting up the build pipeline saves a week of every release. The hour you spend writing a screenshot test saves a day of debugging.

These investments don't feel productive while you're doing them. You're not "making the game." You're making the *thing that makes the game easier to make.*

Do them anyway. The teams that ship are the teams that built the infrastructure first. The teams that don't ship are the teams that "couldn't justify the time" for it.

In this project, we wrote the level editor at version 0.6. By v1.0 we'd built 12 levels in it. Counterfactually: hand-coding 12 levels in JS arrays would have taken weeks longer and produced worse levels. The editor paid for itself 8x over.

Same for screenshot tests, automated builds, audio gesture-warming, cache versioning. All of it. Build the tools before you need them.

## How to protect the project from chaos

Chaos is the default state. Every project drifts toward inconsistency, duplicated effort, half-finished features, and accumulating bugs. The forces of chaos are stronger than the forces of order.

The disciplines that hold chaos back:

### 1. The handover document

CLAUDE.md (or HANDOVER.md). The living source of truth about what the project is and where it is. Updated continuously. Read at the start of every session. **One file. Kept current. Saves the project from every memory glitch and session reset.**

### 2. Convention enforcement

Folder structure, naming convention, sprite size, color palette, version bumps — these become invisible when consistent and painful when broken. Decide them on day 1, document them, **don't deviate**.

When you spot a deviation, fix it the same day. Don't let it accumulate. A second sprite at the wrong size becomes the precedent for ten more.

### 3. Real-device testing weekly

The simulator lies. The desktop browser lies. The phone is the truth. Get the build onto a real phone every week.

### 4. Scope discipline

Already covered. Worth repeating. Don't say yes to your own ideas without saying no to something else.

### 5. Iterate small, ship often

A build a week is better than a build a month. A new commit a day is better than a giant push at the end. Small frequent ships catch bugs while they're small. Big infrequent ships ship five bugs at once and you can't tell which fixed what.

### 6. Document gotchas the day you hit them

When you find that iOS Capacitor needs `contentInset: "never"` after spending 4 hours on it — write it down immediately. In the handover. In the relevant doc file. Today.

Next year, when you forget, you'll thank yourself. Or next month, when you start the next project, you won't repeat the mistake.

## How to make the next game feel more polished earlier

The early polish isn't about having more art. It's about having less rough edges.

### Lock the menu flow in week 2

Title → main menu → game → pause → game over → restart. All wired. All visually consistent. All with sound. Even with placeholder content, a fully-wired menu flow makes the game feel real. A half-wired flow makes everything else look unfinished.

### Pick the audio bitrate on day 1

A 50 MB game feels lighter than a 130 MB game. Smaller bundle = faster install = more downloads = more plays. Even if no one consciously thinks about file size, they feel it.

### Use the same palette across all art

Five colors. Locked. Every asset. The reason this matters: when the player walks from one stage to another, the world looks continuous. Different palettes per stage = the game feels like a collection of demos.

### Touch controls that feel right

Pointer capture, larger touch zones than visual buttons, safe-area aware positioning, anchored to canvas. We iterated for a dozen versions. Get these right on day 5, save dozens of fixes.

### Music that loops cleanly

Trim leading silence. Test the loop point in Audacity. A music track with a 200ms gap at the loop point ruins immersion. A clean loop you barely notice = perfect.

### Cinematic transitions, even cheap ones

Fade to black. Title card. Brief silence. These cost minutes to implement and make the game feel composed. Without them, scenes just snap to other scenes and the game feels janky.

### A consistent SFX vocabulary

Same "menu select" SFX everywhere. Same "confirm" SFX. Same "back" SFX. The brain memorizes these and the game feels coherent. Different SFX per menu = chaos.

## On working with AI

You're going to be doing a lot of pair-programming with an AI. Here's how to do it well:

- **You make the design decisions.** The AI proposes options; you pick. Don't outsource taste.
- **The AI handles the typing.** It's faster than you at producing the first draft of well-defined code. Use that.
- **Verify before trusting.** Read what it generated. Test it. Don't just commit.
- **Use the handover doc.** When the AI's session ends or drifts, the doc is what brings it back.
- **Constrain the scope of every request.** Open-ended asks produce open-ended outputs that don't fit.
- **Ask for diagnosis before fix.** "Where's the bug" before "fix the bug."

Done well, AI pair-programming makes a solo developer 5-10× more productive on rote work and roughly the same on design decisions. Done poorly, it produces inconsistent code, bugs you don't understand, and architecture you can't explain.

You decide which mode you're in by how you prompt.

## On finishing

Most game projects don't ship. Most of the ones that don't ship were good ideas, started well, by capable people. They didn't ship because somewhere around 60% complete, the work got hard and unrewarding and the developer drifted away.

Finishing is the rarest skill in game development.

When you hit the wall — and you will — remember:

- **The wall is normal.** Every shipped game has a developer who hit the wall and pushed through.
- **The wall is not a sign you're doing it wrong.** It's a sign you've gotten to the boring polish part.
- **The wall passes if you commit small things daily.** "Today I'll fix one thing" repeated for weeks gets you to ship.
- **The shipped game beats the perfect unfinished game.** Always. Even if shipped-you is embarrassed by it next year. Embarrassment is for the living.

In this project, we wrote the words "feature-complete at v1.0.2" weeks before we actually shipped. Versions 1.0.3 through 1.0.23 were all "just one more fix." That's normal. You ship when you decide to ship, not when you've fixed everything. There is no "fixed everything."

## On the audience

You're making this for someone. Probably kids. Probably parents. Probably for a specific event. Probably for a specific time of year.

The audience is more important than the engine, the art style, the code quality, the AI assistance, the platform. Everything else serves them.

When you're stuck on a decision:
- "What would the player rather have?"
- "What would the parent see when they watch the kid play?"
- "What would make the church leader proud to recommend this?"

The right answer is almost always the simpler, more polished, more welcoming option. Not the more impressive, more clever, more technically interesting one.

Make it for them. Not for your portfolio. Not for the dev community. Not for the AI to be proud of. For **them**.

That's how games get made.

## A closing thought

You're going to learn more from making this next game than from reading any document. Including this one.

The handover is here to spare you the avoidable pain. The unavoidable pain is yours to discover. That's also how games get made.

Go build something. Ship it. Get it in someone's hands. See what they do with it. Then make it better.

Good luck.

— from a project that shipped, after a year of trying.
