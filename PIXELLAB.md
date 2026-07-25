# PIXELLAB API — Project Reference (Portion Control)

> The complete, battle-tested knowledge of the PixelLab AI connection.
> Read this before generating ANY art.
>
> ## THE HEADLINE (2026-07-22): USE THE V2 API
>
> There are TWO APIs. Everything below the v1 section was learned on
> `/v1` — the low-level single-image primitives. **The real asset
> platform is `https://api.pixellab.ai/v2`** (discovered via Mark's
> other project; verified live). v2 is what PixelLab's own app uses:
>
> - **`GET /v2/llms.txt`** — LLM-targeted docs; **`/v2/openapi.json`**
>   — full spec (~50 endpoints). Saved copies in session scratchpad.
> - **`GET /v2/balance`** — the REAL meter: returns subscription
>   `{plan: 'Tier 1: Pixel Apprentice', generations: N, total: 2000}`.
>   (v1 /balance only shows the useless USD number.)
> - **Characters**: `POST /create-character-with-4-directions` (also
>   -8-directions, -pro, -v3): description + image_size -> ASYNC job
>   (`background_job_id` + `character_id`; poll
>   `/background-jobs/{id}`) -> consistent multi-direction character
>   built on a template (e.g. `template_id: mannequin`), PERSISTED to
>   the account library (visible on the website!). Then
>   `POST /animate-character` `{character_id, mode: 'template',
>   template_animation_id: 'walk'}` -> professional template walk
>   cycles for ALL directions at once (one async job per direction).
>   `GET /characters/{id}` for metadata + rotation_urls;
>   **`GET /characters/{id}/zip`** to download everything — use the
>   ZIP: the CDN host (backblaze.pixellab.ai) is BLOCKED by the
>   sandbox egress proxy, but api.pixellab.ai serves the zip.
>   Verified: 48px request produced 68x68 canvases (template size).
> - **Objects**: create-1/8-direction-object + states + animations —
>   library-persistent props.
> - **Tilesets**: top-down Wang tilesets, sidescroller tilesets,
>   isometric tiles, tiles-pro — all async with list/get/delete.
> - **Pro image tools**: generate-image-v2, generate-with-style-v2,
>   generate-ui-v2, pixen model, image-to-pixelart, resize,
>   remove-background, inpaint-v3, edit-images-v2, edit-animation-v2,
>   interpolation-v2, transfer-outfit-v2, portrait<->character,
>   generate-font-pro, animate-with-text-v3, 8-rotations-v2/v3,
>   prompt enhancers.
>
> **Why this matters**: v1 one-shot images do NOT persist to the
> account library and forced us to hand-stitch animation (the source
> of every walk-cycle struggle). v2 characters/objects/tilesets are
> consistent, template-animated, library-persisted assets. CHARACTERS
> AND ANIMATIONS GO THROUGH V2 FROM NOW ON. The v1 notes below remain
> valid for quick one-off images and the skeleton/rotate/inpaint
> primitives.

## Capability survey 2026-07-24 (Mark asked "what else is there?")

Sources: live `/v2/openapi.json` + `/v2/llms.txt` + the MCP docs at
`api.pixellab.ai/mcp/docs`. The MCP server (`https://api.pixellab.ai/
mcp`, HTTP transport, same Bearer token) wraps the SAME API we already
drive with scripts — plus a chat agent + code sandbox we don't need.
Direct REST remains our path; nothing is MCP-only.

**Character creation — THREE modes** (all persist to the library and
all work with `/animate-character`):

| Mode | Endpoint | Cost | Directions | Max size | Notes |
|---|---|---|---|---|---|
| standard | create-character-with-4/8-directions | 1 gen | 4 or 8 | 128px | What made Danny + the 5 heroes. Template skeleton (`mannequin`, quadrupeds: bear/cat/dog/horse/lion). |
| v3 | create-character-v3 | 2-9 gens | always 8 | **256px** | Highest quality. **Accepts a `reference_image` (south-facing sprite) and rotates it into 8 directions** — the tool for upgrading an existing sprite to 8-dir, or for big high-res versions. From-scratch mode uses the Pixen model. |
| pro | create-character-pro | 20-40 gens | always 8 | 128px | Reference-based. `method: create_from_concept` takes a **concept image up to 1024x1024** (e.g. an Element Lab trading card) + optional style ref (max 168px) — the card-accuracy tool. Expensive. |

**Template animation catalog is ~50 deep, not just walk** (1 gen per
direction, identity-locked): `attack`, `attack-back/left/right`,
`cross-punch`, `lead-jab`, `high-kick`, `roundhouse-kick`,
`hurricane-kick`, `flying-kick`, `leg-sweep`, `surprise-uppercut`,
`fireball`, `throw-object`, `taking-punch`, `falling-back-death`,
`getting-up`, `breathing-idle`, `fight-stance-idle-8-frames`,
`jumping-1/2`, `two-footed-jump`, `running-jump`, `running-slide`,
`running-4/6/8-frames`, `crouching`, `crouched-walking`, `pushing`,
`pull-heavy-object`, `picking-up`, `drinking`, `sad-walk`,
`scary-walk`, `backflip`, `front-flip`, many `walking-*` variants,
`angry`, `bark`. (Quadruped templates have their own set.)
KIT FIT: throw-object (Victoria wrench), fireball (Carlos stars),
attack/cross-punch (melee), taking-punch + falling-back-death +
getting-up (player hurt/KO/revive), breathing-idle (select screen).

**Other high-value endpoints we haven't used yet:**
- `create-character-state`: text-edit an existing character, applied
  consistently across ALL rotations, saved as a grouped variant —
  costumes, powered-up forms, held-weapon states.
- `portrait-character-pro`: full-body sprite -> BUST PORTRAIT (or
  reverse). Output sizes 16..160 (128/160 render at 2K). The tool for
  character-select / results portraits of the roster.
- `transfer-outfit-v2`: apply an outfit from a reference image across
  2-16 animation frames.
- `animate-character mode:'v3'`: free-form animation by text (2-16
  frames, even counts) with optional start/end poses — for actions no
  template covers. Template mode remains the identity-safe default.
- `edit-animation-v2`, `interpolation-v2`, `inpaint-v3`,
  `image-to-pixelart-pro`, `generate-font-pro` (pixel fonts!),
  `create-ui-asset` (pixel UI panels), building kits + path tiles +
  Wang tilesets (top-down maps — future districts).

## The v1 layer (historical + still useful for one-offs)

Everything verified live on 2026-07-21 (v1 OpenAPI + real calls).

## Connection & billing

- Base URL: `https://api.pixellab.ai/v1`
- Auth: `Authorization: Bearer $PIXELLAB_API_KEY` (env var, present in
  the remote exec environment; also used by the Element Lab sessions).
- **Billing is by subscription GENERATIONS, not dollars.** Every
  successful call returns `usage: {type:'generations', generations:1}`.
  `GET /balance` returns the pay-as-you-go USD balance which can read
  `$0.00 while generations remain` — do NOT treat $0 as blocked
  (that mistake cost us a detour; Mark confirmed plenty of
  generations). One call = one generation, whether it makes 1 image
  or a 4-frame animation — animations are the best value.

## The 8 endpoints

| Endpoint | What it does | Size limits (empirical) |
|---|---|---|
| `POST /generate-image-pixflux` | text -> pixel art | **32..64 px per side at runtime** (schema says 16-256 but server rejects <32x32 area "Canvas must be size 32x32 area or larger" and >64 "less than or equal to 64") |
| `POST /generate-image-bitforge` | text + STYLE IMAGE -> pixel art in that style | schema 16-400; `style_image` must EXACTLY match `image_size` (500 error otherwise) |
| `POST /animate-with-text` | reference image + action -> n frames | **exactly 64x64** (min 64 enforced; schema pins 64) |
| `POST /animate-with-skeleton` | keypoint-driven animation frames | 16-200 |
| `POST /rotate` | re-face a sprite (view/direction change) | 16-200 |
| `POST /inpaint` | repaint a masked region | 16-200 |
| `POST /estimate-skeleton` | image -> skeleton keypoints | — |
| `GET /balance` | USD balance only (see billing note) | — |

## Shared parameter vocabulary (exact enum strings)

- `outline`: `single color black outline` | `single color outline` |
  `selective outline` | `lineless`
- `shading`: `flat shading` | `basic shading` | `medium shading` |
  `detailed shading` | `highly detailed shading`
- `detail`: `low detail` | `medium detail` | `highly detailed`
- `view`: `side` | `low top-down` | `high top-down`
- `direction`: `north` | `north-east` | `east` | `south-east` |
  `south` | `south-west` | `west` | `north-west`
- `text_guidance_scale` 1-20 (default 8); `init_image` +
  `init_image_strength` 1-999 (default 300); `isometric`,
  `no_background` booleans; `seed` for reproducibility (0 = random);
  `negative_description`.
- **`color_image`** (pixflux, bitforge, animate, rotate, inpaint):
  a Base64 image whose colors act as a FORCED PALETTE. Untested by
  us so far — the tool for strict 16-color palette enforcement if
  ever wanted.
- bitforge extras: `style_image` + `style_strength` 0-100,
  `extra_guidance_scale`, `coverage_percentage`,
  `skeleton_guidance_scale` + `skeleton_keypoints`,
  `inpainting_image`/`mask_image`, `oblique_projection`.
- animate-with-text extras: `action` (required), `n_frames` (default
  4), `start_frame_index`, `image_guidance_scale` (default 1.4),
  `init_images`, `inpainting_images`/`mask_images` arrays.

## Request/response shape

```json
POST /generate-image-pixflux
{ "description": "...", "image_size": {"width": 48, "height": 48},
  "no_background": true, "outline": "single color black outline",
  "shading": "flat shading", "detail": "low detail",
  "view": "low top-down" }
-> { "usage": {"type": "generations", "generations": 1.0},
     "image": {"type": "base64", "base64": "..."} }
```
`animate-with-text` returns `images: [{base64}, ...]` (n_frames of
them). Reference/style/init images are sent as
`{"type":"base64","base64":"..."}`.

## Proven recipes (what shipped District 1)

1. **Character/enemy base**: pixflux at the nearest legal size, prompt
   = subject + `facing right` + the COMPENDIUM 2.4 style suffix
   (chunky/outline/goofy-cute-menacing/kid-friendly). `low top-down`
   view, flat shading, low detail, black outline, no_background.
2. **Size ladder** (API window is 32..64; game sizes differ):
   - 24px targets -> generate 48, downscale x0.5 NEAREST.
   - 16px targets -> generate 32, downscale x0.5 NEAREST.
   - 32/48/64 targets -> generate native.
   - 128px bosses -> generate 64, upscale x2 NEAREST (chunky = on-style).
   Integer scaling only; never fractional.
3. **Walk cycles**: animate-with-text at 64x64 (upscale smaller refs
   x2 NEAREST first), `action:'walk'`, `direction:'east'`, 4 frames,
   then scale frames to target. ONE generation for all 4 frames.
4. **2-frame enemy walks**: cheaper than animate - pixflux again with
   `init_image` = frame A (strength 300) + prompt "same character,
   second walk frame, legs and body in alternate pose, small squash
   and stretch wobble".
5. **Alpha cleanup**: threshold semi-transparent pixels (a >= 90 ->
   255 else 0) to kill AA halos before shipping.
6. **Ground/environment cohesion grade** (the "levels look cohesive"
   recipe): generate one 64x64 opaque texture (`no_background:false`,
   `outline:'lineless'`), crop 32px tiles from it, then grade:
   desaturate x0.55, brightness x0.62, 30% blend toward the game's
   navy (0x2a2544). Ground must stay BACKGROUND (readability pillar).
   Use `gradeKeepAlpha` for transparent decals. Props: same chunky
   outline as sprites but prompt "muted cool colors" so they recede.
7. **Style transfer for family cohesion** (bitforge): pass an existing
   game sprite as `style_image` (RESIZED to match image_size exactly).
   Tested: `style_strength` 60 transfers palette/shape so hard it can
   override the description - use ~20-40 when the new subject must
   read as itself, higher for variants of the same creature.
8. **Batch scripts** live in the session scratchpad (`pl-batch-d1.py`,
   `pl-batch-d1env.py`) - copy their `call/gen/animate/clean/grade`
   helpers for new batches; they retry transient errors and 422s are
   fatal (fix the request, don't retry).

## Untested-but-available (for future needs)

- `/rotate`: multi-directional sprites (e.g. north/south walk sets)
  without hand-flipping. `from_image` + from/to view+direction.
- `/animate-with-skeleton` + `/estimate-skeleton`: PROVEN (round 7) -
  THE pipeline for character animation without identity drift.
  Rules: canvas must be exactly 256/128/64/32/16 square (pad odd
  sizes in, crop back - never scale); the model is a 3-FRAME WINDOW
  (send exactly 3 skeleton frames; a 4-frame walk cycle = stride/
  pass/stride + reuse pass); 18 keypoint labels (NOSE, L/R EYE, L/R
  EAR, NECK, L/R SHOULDER, L/R ELBOW, L/R ARM, L/R HIP, L/R KNEE,
  L/R LEG) with normalized 0..1 x/y + z_index; estimate-skeleton
  costs 0.1 generation, the animate call 1. Contrast:
  animate-with-text animates nicely but MUTATES identity (hats,
  faces, age) - use it only for throwaway motion studies.
- `/inpaint`: fix a bad region of an otherwise good sprite instead of
  re-rolling the whole generation.
- `color_image` forced palette (see above).
- `seed`: pin a seed to re-generate the same result deterministically;
  vary description around a pinned seed for consistent families.

## Errors seen in the wild

- 422 `Canvas must be size 32x32 area or larger` — too small (pixflux).
- 422 `Input should be less than or equal to 64` — too big (pixflux).
- 422 `Input should be greater than or equal to 64` — too small (animate).
- 500 `style_image must be size (W, H), not torch.Size([w, h])` —
  style ref not resized to match image_size.
- Auth works even when `/balance` shows $0.00 (subscription).
