# THE VAMPIRE SURVIVORS ART DNA
## A research-backed replication spec for Portion Control
*Companion to the Build Compendium. Where the two disagree, this file wins on ART matters;
the Compendium wins on gameplay/engineering. Sources: developer statements on Steam,
the official VS wiki's sprite archive and enemy data, the Phaser team, Game Informer's
developer interview coverage, and a technical case study of VS's internals.*

---

# §1 — THE BIG PICTURE (read this even if you skip the rest)

Vampire Survivors' "art style" is not a polished aesthetic — it's a **survival strategy
that became a brand**. The facts:

1. **The art was bought, not drawn.** Creator Luca Galante built VS with essentially zero
   budget and used a purchased asset pack: Oryx Design Lab's **"HiFi Gothic"** set — a
   gothic-horror collection openly based on the Castlevania series. Fans noticed the
   resemblance in week one; the dev confirmed the pack's origin and reworked the item
   sprites that were too close. He literally said he "just used what he had."
2. **It began with engine-default assets** in **Phaser** — the same free HTML5 framework
   in our Compendium — and stayed on Phaser until update 1.6, when a grown team ported
   it to Unity. Success came first; the "real" art team (Alessio Greco, Glauber Kotaki,
   Studio CiAbbatte) came after.
3. **The scrappiness IS the charm.** Mixed sprite scales, borrowed 90s-Konami energy,
   fake-retro rendering with visible scaling artifacts — players read it as confident and
   nostalgic, not cheap.

**The lesson for us:** generating a cohesive pack with PixelLab is the 2026 version of
buying the Oryx pack. We are not copying VS's sprites (we can't and shouldn't — food, not
skeletons); we are copying its *production model and visual grammar*, which is exactly
what the whole survivor genre already did.

---

# §2 — HARD NUMBERS FROM THE REAL GAME (sprite sizes)

Measured from the official wiki's archive of actual game files (classic-era sprites):

| VS class | Real examples (canvas px) | Typical body size |
|---|---|---|
| Tiny swarm (bats, fleas) | Bat frames 19×21 → 30×27 · Fleaman 24×24 · Barm 28×22 | ~16–26 px |
| Standard walker (zombies, mermen) | Card Sharp 36×39 · Fishman 40×40 · Daimon 37×39 · Flying Zombie 37×36 | ~28–38 px |
| Big / armored | Bugbear 48×71 · Devil 56×64 · Disc Armor 60×60 · Bone Golem 68×68 | ~48–68 px |
| Classic bosses | Amalaric Sniper 92×92 · Bat Dragon 97×99 · Behemoth 130×62 · Death 240×150 · Eligor 224×176 · Beelzebub 165×265 | ~90–260 px |
| Modern/DLC era | standardized 256×256, 300×300, 400×400 canvases (mostly padding) | varies |
| Projectiles | Bone Pillar bullet 16×16 · Death Spiral 16×16 · egg bullet 13×16 | 13–16 px |

**Two takeaways:**
- **Our Compendium grid (24 / 32 / 48 / 128 / 160) is a cleaned-up match** for VS's real
  distribution. No changes needed. Keep our fixed grid (VS's canvases are chaotic; a fixed
  grid packs into atlases better) but **draw the body smaller than the canvas** like VS
  does — a 24×24 swarm enemy's body should be ~18–20 px with air around it.
- **Non-uniform pixel scale is canon.** VS freely mixes sprite densities and scales things
  in code (bigger variants of the same enemy are literally the same art scaled up). We're
  allowed to do this too — e.g., the Elite is the same sprite ×1.5, no new art.

**Rendering:** VS runs a 3:2 internal ratio and upscales; community measurements show
clean pixel scaling only at 3:2 resolutions (960×640 family) — meaning at most window
sizes the game shows scaling artifacts *and nobody cares*. Sprites are authored small and
displayed at roughly 2× or more. Our Phaser settings (`pixelArt`, `roundPixels`, zoom ~2)
reproduce this exactly.

---

# §3 — ANIMATION DNA (this is where the smoothness illusion lives)

**Confirmed from game data:** the baseline Zombie is **3 sprite files total** (its entire
existence: HP 10, damage 10, speed 100, XP 1, knockback 0.8). Bats have ~5 frames across
files; simple enemies get 2–4; many props/hazards get 1. There are no attack animations
on the swarm — enemies damage you by *touching* you.

The motion you remember from VS is mostly **code, not frames**:
- **The wobble:** sprites rock/tilt slightly as they move — a rotation oscillation applied
  in code, plus horizontal flip for direction. This single trick makes a 2-frame flipbook
  feel alive at 300 units.
- **Knockback:** on hit, an enemy's velocity is *reversed* and multiplied (base multiplier
  ~0.8, stacking to a max of ~3) for roughly **120 ms**. This constant micro-shoving is
  half the game feel.
- **Hit flash:** a flashing VFX on damaged enemies (prominent enough that VS lets you
  toggle it in options).
- **Floating damage numbers:** present and *toggleable* — many players turn them off.
- **Crowd jostle:** enemies are physics bodies that push each other; slow enemies get
  shoved into you by the mob behind them (documented in a technical case study of VS's
  internals). Expensive at scale — see §5 for our cheap version.

**Portion Control ruling (updates our Compendium's §2.1, everything else stands):**
- Swarm/bruiser food: **2-frame walk**. Heavies and gadgets: **2–3 frames**. Player: 4.
- ADD the **code wobble**: `rotation = sin(time × 6 + phase) × 0.06 rad` while moving,
  per-enemy random phase. This is now REQUIRED — it's the single highest-value trick.
- ADD **knockback**: on bullet hit, push enemy backward at `enemySpeed × 0.8` for 120 ms
  (heavies ×0.3, bosses 0). Stack-cap ×3.
- Damage numbers stay out of v1 (perf), but if added later: toggleable, like VS.

---

# §4 — THE LOOK ITSELF (what to tell PixelLab)

VS's classic sprites are **90s-Konami-descended shaded pixel art**, not modern flat/pastel
pixel art. The grammar:

1. **Dark outline, but not pure black everywhere** — outlines shift hue with the material
   (dark brown around bone, deep purple around cloth).
2. **3–4 tone shading ramps** per material with a consistent top-left light. Sprites have
   real volume — this is what separates the look from flat "cute indie" pixel art.
3. **Strong silhouette first.** Every enemy is identifiable as a black shape. (Food is
   *great* at this — a pretzel silhouette beats a skeleton silhouette.)
4. **Slightly gross-cute menace.** VS monsters grin, bulge, and loom. Our food should too:
   goofy + cute + a little menacing was already our brief; VS confirms the recipe —
   big eyes/teeth, hungry grins, one unsettling detail per enemy.
5. **No global palette.** VS uses per-sprite ramps, unified by darkness and vibe, not a
   shared 16 colors. **We keep our 16-color palette anyway** — it's our upgrade over VS
   (their unity comes from one artist's hand; ours must come from constraint) — but
   PixelLab may shade *within* each swatch's ramp (each palette color ± one lighter and
   one darker step). Update Compendium §2.2 with this "ramps allowed" rule.
6. **Grounds are dark and low-contrast; actors are bright.** VS stages are murky so the
   swarm pops. Our districts should sit 20–30% darker and less saturated than the enemies
   walking on them. Flood decals mid-contrast.
7. **UI:** chunky gold-outlined retro display caps for headers over dark panels, plain
   readable body text, gold-bordered choice cards with the item icon big on the left.
   (Use a free chunky pixel display font — do NOT copy VS's actual font files.)

## The PixelLab style suffix, v2 (replaces the Compendium's)
> "…, top-down pixel art in the style of 90s SNES Konami sprites, chunky readable
> silhouette, dark colored outline, 3-tone shading with top-left light, goofy cute
> slightly menacing cartoon food monster, big expressive eyes, kid-friendly, transparent
> background, [SIZE]×[SIZE]"

Frame 2 prompt: "same character, second walk frame: legs swapped, body leaning slightly
the other way, small squash". Boss prompts add: "imposing, fills the canvas, hungry grin".

---

# §5 — SYSTEMS FACTS WORTH STEALING (all verified)

| VS fact | Our implementation |
|---|---|
| Hard cap: at **300 live enemies**, VS stops spawning | Compendium already says 300 (mobile). Now canon — keep it. |
| Waves arrive **one per minute**, each defining a minimum enemy count + spawn interval | Our spawn-director phases are 60–150 s — compatible; optionally snap phases to whole minutes for VS-authentic pacing. |
| Enemies spawn just off-screen; **despawn when the player moves far away** | We recycle far enemies as new spawns — same effect, zero waste. Keep. |
| Official code uses **object pooling** for projectiles (BulletPool, upper limit, SpawnAt) | Already law in our Performance Bible. |
| Enemies are physics bodies that **push each other**; the mob shoves stragglers into you | Their way is expensive. Our cheap version: soft-separation — each enemy nudges away from ONE same-cell neighbor per frame via the spatial hash (~0.3 px). Mob pressure feel, near-zero cost. STRETCH if fps allows. |
| Damage numbers and hit-flash exist but are **toggleable** | Ship flash on with a toggle; damage numbers v1.1, toggleable. |
| A final damage-power **cap** exists internally (keeps scaling sane) | Add soft caps to our stacking passives later during tuning. |

---

# §6 — WHAT WE DELIBERATELY DO *NOT* TAKE

- **No VS sprites, fonts, sounds, music, names, or the actual Oryx pack.** Style and
  mechanics are free; files and trade dress are not. Our art is 100% generated for us.
- **No gothic skin.** The DNA transfers to food completely: bats→popcorn, zombies→fries,
  bone golems→pretzels, Death→The Mother Batch.
- **Their inconsistency.** Mixed pixel scale is authentic to VS but our fixed grid + one
  palette will make Portion Control look *more* deliberate than its inspiration. That's
  the one place we beat the master.

---

# §7 — ACTION LIST (deltas to apply to the Compendium / Claude Code)

1. Add the **movement wobble** (sin-rotation) to the enemy update — REQUIRED juice.
2. Add **120 ms reversed-velocity knockback** on bullet hits (heavies reduced, bosses 0).
3. Amend palette rule: 16 swatches, **±1 shade ramp allowed per swatch** for shading.
4. Bodies drawn ~80% of canvas with breathing room; Elites = same sprite ×1.5 scale.
5. Grounds authored darker/desaturated vs. actors; verify contrast at M5.
6. Swap in the **style suffix v2** for all PixelLab prompts.
7. Optional: snap spawn-director phase boundaries to whole minutes.
8. STRETCH: soft-separation crowd jostle; toggleable damage numbers in v1.1.

*End. Everything above is style law for Portion Control; gameplay numbers stay governed
by the Compendium.*
