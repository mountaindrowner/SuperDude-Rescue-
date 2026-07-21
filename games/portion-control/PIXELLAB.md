# PIXELLAB API — Project Reference (Portion Control)

> The complete, battle-tested knowledge of the PixelLab AI connection.
> Read this before generating ANY art. Everything here was verified
> live against the API on 2026-07-21 (OpenAPI spec + real calls).

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
- `/animate-with-skeleton` + `/estimate-skeleton`: precise pose
  control for bosses (e.g. Big Frank's charge telegraph pose).
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
