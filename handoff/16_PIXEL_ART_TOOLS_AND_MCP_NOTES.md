# 16 — Pixel Art Tools and MCP Notes

## What we used

### PixelLab.ai
The primary sprite generator for this project. Used for:
- The big Danny character + animations
- The small Danny variant
- The Computer character (Day 8-1 player)
- The 5 rescue team members (Victoria, Nayah, Kevin, Carlos, Josh)
- The expressive "comp2" Computer cutscene sprites
- 4-directional and 8-directional walk cycles

### Aseprite
We did not use Aseprite in this project. **We should have.** Every "AI-generated sprite needs cleanup" complaint in this document is a problem Aseprite is built to solve.

### Hand-coded procedural art
A lot of the sky / parallax / background painting was procedural — JS functions that draw scenes via fillRect, fillStyle, createLinearGradient, etc. Worked, but Adventure City showed that painted backdrops are a tier above.

## Where PixelLab helped

### 1. Speed of first version
"Generate 4 directional walk animations for a kid scientist in a lab coat" → 8 animation strips in ~10 minutes. Hand-drawing that = a day of work.

### 2. Consistent style within a character set
Once you've trained PixelLab on a character (via its character builder), additional animations / poses come back in the same style. The walk and the jump look like the same character.

### 3. Multiple directions for free
4-directional and 8-directional walk cycles are tedious to hand-draw. PixelLab spits them out.

### 4. Cutscene poses
"Computer character looking concerned / scared / alert" → distinct expressive frames suitable for dialogue scenes. Worked great.

## Where PixelLab struggled

### 1. Alignment between animations
Same character, different animation, slightly different feet baseline. Required `PL_BBOX` measurement table to compensate. Walk's feet might be at y=29 while idle's are at y=30. The drift was 1-2 pixels but visible.

### 2. Color palette drift
Animations generated days apart used slightly different palettes. Walk's red might be `#dd3030` while jump's is `#d83838`. Small drift, large visible inconsistency.

### 3. Off-grid pixels
PixelLab output often had sub-pixel anti-aliasing despite being "pixel art." Manual quantization required.

### 4. Frame count requested vs. delivered
Asking for 8 frames sometimes got 6. Asking for symmetric flips sometimes got asymmetric.

### 5. Cleanup expectations
**Every animation needed 10-30 minutes of hand-touchup** in any pixel editor. Aseprite would have been the right tool. We did most of this with manual pixel-replacement scripts and PL_BBOX measurements — painful and lossy.

## MCP — what is it and how could it help

MCP (Model Context Protocol) is a standard for connecting external tools to AI assistants like Claude Code or Cursor. It exposes external services as "tools" the AI can call directly during a conversation.

### PixelLab MCP
PixelLab offers an MCP server that lets the AI call PixelLab's API directly. Instead of:
1. Human goes to pixellab.ai
2. Generates sprite
3. Downloads file
4. Drops in project
5. Asks AI to integrate

You get:
1. AI calls PixelLab via MCP
2. Sprite returns
3. AI integrates immediately

**Saves 10-15 minutes per sprite.** For a project with 50+ sprites, that's hours.

### When MCP helps
- Greenfield projects where you'll generate dozens of assets
- Rapid prototyping
- Iterating on the same character (regenerate with tweaks)
- Tilesets / decorative environment assets at scale

### When MCP doesn't help
- This project, now, shipping. The assets are done.
- Final-polish art where review-before-integration matters
- Projects with a strict art bible that AI prompts can't reliably hit

### The risk
- Pay-per-credit billing model can run up costs if the AI is poorly constrained
- An AI in a loop can burn credits fast
- Mitigations: subscription tier ($9-$22/month caps cost), per-call approval mode in your AI tool, manual credit budget per session

## Recommendations for the next project's art pipeline

### Day 1: Lock the constraints
- Frame size (e.g., 32×32)
- Feet baseline y-position
- Color palette (5–8 hex codes)
- Style references (3 Pinterest pins or game screenshots)

Write these in `docs/ART_STYLE.md`. Reference them in every prompt.

### Day 2: Generate the master character sheet
- One sprite in idle pose
- Confirms proportions, palette, style work
- Lock this as the reference for everything

### Day 3+: Generate per-animation, clean up, integrate
- For each animation: provide the master sheet as reference
- Generate via PixelLab (or PixelLab MCP if enabled)
- Clean up in Aseprite (~20 min per animation)
- Quantize palette (Aseprite has a color-replace tool — use it)
- Re-align baseline (snap to canonical y)
- Export as sprite sheet PNG + JSON metadata
- Drop into `public/assets/sprites/[character]/`
- Add to the engine's sprite registry

### Per environment background
- Reference the style bible
- Generate concept (Midjourney / ChatGPT image)
- Iterate on prompt until it matches style
- Re-cut into parallax layers manually if needed
- Test in-engine immediately — does the player read against it?
- Iterate

## The "AI art = concept acceleration" rule

This is the most important sentence:

> **AI-generated art is concept acceleration. It is not finished art.**

Treat every AI output as a starting point. Plan for 20-50% of the asset's time budget to be hand-cleanup. If you skip the cleanup, you ship inconsistent art and the players feel it (even if they can't articulate why).

## Tool recommendations

### Mandatory
- **Aseprite ($20 one-time)** — the pixel art tool. Buy on day 1. Use for cleanup, color management, animation, export.

### Strong recommendation
- **PixelLab subscription** — sprite generation, especially multi-directional
- **Midjourney** or **ChatGPT image** — backdrops, concept art

### Optional / situational
- **Procreate** (iPad) — if you have an iPad and want to hand-draw
- **Photoshop / Affinity Photo** — for big composited backdrops
- **Piskel** — only if Aseprite truly isn't an option
- **Pixaki** (iPad) — pixel art on iPad

### MCP tools (when ready)
- **PixelLab MCP** — for AI-assisted sprite pipeline
- **Midjourney MCP** — for AI-assisted backdrops (varies; check current availability)

## Warning section

**AI art is not a magic button.** It is a starting point. The teams that ship polished pixel art games:
- Generate fast
- Clean up rigorously
- Have a style bible they enforce
- Have a single artist (or AI-prompter) who owns the look
- Don't ship the first generation

The teams that ship inconsistent-looking pixel art games:
- Generate fast
- Skip cleanup
- Have no style bible
- Let many people generate without coordination
- Ship the first generation

Be the first team.

## Cost guardrails for MCP-enabled workflows

- Stay on a subscription tier (caps monthly cost)
- Require per-call approval in your AI tool
- Monitor credit balance weekly
- Set a budget per work session ("max 10 generations today")
- When generating in a loop, verify each output before generating the next
- Don't run AI in autopilot with MCP enabled

For SDA, we never enabled the MCP — Mark generated sprites manually on pixellab.ai. That worked, but slowly. For the next project, MCP + the guardrails above would be a real productivity win.
