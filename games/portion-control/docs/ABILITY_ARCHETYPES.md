# Ability Archetype Audit (Mark, 2026-07-27: "we're doubling up too
# much... break it down to archetypes and figure out where we're at")

The genre's archetypes (Vampire Survivors et al) and where our 26
weapons sit. An archetype earns its place by creating a DISTINCT
player decision (positioning, timing, or build focus) — two weapons in
the same cell must differ in FEEL or one is redundant.

## The taxonomy

| Archetype | What it asks of the player | VS reference | Ours |
|---|---|---|---|
| Directional shot | face/kite toward threats | Magic Wand, Knife | Resizer, Blaster (spread), **Beam (pierce)**, Espresso (charge-standstill) |
| Orbiter | let things come to you | King Bible | Whisk (satellites), **Lasso (single growing ring)** |
| Contact aura | stand your ground | Garlic | Salt (Seasoned debuff), **Pineapple (aura + retaliate)** |
| Zone / DoT field | paint the floor, herd foes | Santa Water | Seeds, Grease (trail), Ketchup (artillery puddles) |
| Minion | fire-and-forget autonomy | — (VS has none!) | Gizmotron (orbit drone), Sentry (static turrets), **SentryBot (walking pal + button)** |
| Called strike | watch the telegraph | Lightning Ring | Strike (carpet line), Comet (vertical sniper) |
| Boomerang / ricochet | angle play | Cross | Cutter (return), Jaw (bounces) |
| Chain | density scaling | — (PoE-style) | Zap |
| Melee arc | face the crowd | Whip | Skillet, **Haymaker (lifesteal)** |
| Control | shape the swarm | — | Freeze (slow), Fridge (walls), Vortex (pull) |
| Homing swarm | zero-aim comfort | — | Sprinkle |
| Microwave sweep | rotation timing | — | Microwave |

## Where we're doubling up (the honest list)

1. **Pineapple vs Salt vs Lasso** — Mark's on-device catch is right:
   three "circle around the player" reads. Salt owns the aura slot
   (Seasoned debuff identity). Lasso owns the orbiter-ring slot.
   **FIX Pineapple: drop its aura ring entirely — make it a pure
   RETALIATION archetype** (nothing until you're hit, then a spiky
   burst + brief thorns skin). New cell, new read, kid-legible
   ("it fights back"). Evolution (FORTRESS FRUIT heal field) keeps.
2. **Beam vs Resizer** — same straight-shot read. v0.14.7 gives Beam
   a golden pierce-bolt identity; if still too close on-device,
   next step is a held-beam (brief laser LINE, not a bullet).
3. **Sentry vs SentryBot vs Gizmotron** — three gun-minions, but the
   FEELS differ (static emplacement / walking pal + button / orbit
   pecker) and minions are our franchise archetype (VS has none).
   Keep all three; ensure ART differs (fixed: turret art v0.14.7).
4. **Cutter vs Jaw** — return-arc vs pinball; distinct enough. Watch.
5. **Strike vs Comet** — carpet line vs single vertical snipe;
   distinct after the comet's on-screen/vertical fix. Keep.

## What's genuinely ours (protect these)
- The Deploy button (only active input in the genre-copy).
- Seasoned (debuff-amp aura — build-around).
- The growing lasso (level-visible geometry).
- Espresso's stand-still charge (risk posture).
- Faith flagships in the meta shop.

## Proposed next actions (Mark to approve)
- [ ] Pineapple → pure retaliation rework (drops the third ring).
- [ ] If Beam still reads as "Danny's laser" after the gold pass:
      held-line laser rework.
- [ ] Per-ability SFX voices (see MOTHER_SESSION_BRIEFS §1) — sound
      is half of ability identity.
- [ ] No new weapon may enter an occupied cell without a new
      player-decision axis (rule going forward).
