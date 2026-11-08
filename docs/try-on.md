# "The outfit on me" generation (virtual try-on)

## Decisions (September 2026)

0. **Proof of concept (no card)** — the 2D doll + optionally a few try-ons through a public Hugging Face demo. See [poc.md](poc.md#try-on-without-a-card).
1. **MVP — a 2D "paper doll" without AI.** Instant, free, works everywhere.
2. **Next — an open try-on model (CatVTON) on [Modal](https://modal.com/pricing)**: serverless GPU with $30 of free credits every month. A linked card is required, so we set a spending limit right away (see [below](#modal-card-and-spending-limit)).
3. **Fallbacks:** running locally on your own GPU (RTX 4070 Ti SUPER, 16 GB) or paid Gemini (see the [reference](#paid-alternative-gemini-reference)).

## Stage 0: 2D doll

Cut-out item photos are layered onto a silhouette / mannequin — like on Cher's screen in the film. No AI, no costs, works on a phone too. It fits the retro style well and stays as the fallback whenever AI generation is unavailable.

### How it works

1. **Doll base = image + "anchors".** Anchors are coordinates of key lines: shoulders, waist, hips, ankles, feet. Coordinates are relative (0–1), so the doll looks the same on any screen. The render code only knows "picture + anchors", so bases are interchangeable:
   - **A drawn mannequin** (the default, in the PoC) — a simple SVG silhouette, possibly with a few body shapes to pick from. Works for everyone, including people who don't want to upload a photo of themselves.
   - **Your own photo** (optional, closer to the film — Cher herself was on the screen) — a full-length photo → background removal → anchors are found by the pose estimation model **MediaPipe Pose Landmarker** (free, right in the browser: shoulders, hips, knees, ankles, feet; the waist is computed between shoulders and hips) → the user adjusts the markers. This is the same base photo that later goes to AI try-on.

   Tips for a base photo: full length, facing the camera, phone at waist height from 2–3 m (less distortion), arms slightly away from the body, tight neutral clothes (otherwise your own sleeves or trouser legs will peek out from under the items), a plain background.
2. **Item bounds.** After background removal, the PNG contains only the item on a transparent background. A pass over the pixels' alpha channel gives the box where the item really starts and ends, and the cut-out is cropped to it before it is saved (`photo/trim.ts`). The stored image then is the item's box, so the doll never reads pixels from storage, which would need CORS on the bucket.
3. **Auto-fit by slot:**
   - top — the top edge of the box on the shoulder line, width matched to the shoulder width (with a factor for sleeves);
   - bottom — the top edge on the waist, width matched to the hips;
   - dress — from the shoulders; shoes — on the feet.

   Length isn't adjusted separately: a crop top stays short, a midi stays long. The item's proportions are kept.
4. **Manual fine-tuning — once per item (later; step 10 ships auto-fit only, by the author's decision).** Auto-fit isn't perfect (different shooting distances, asymmetry), so when adding an item there's a "try on the mannequin" screen: drag, scale, rotate a little. The result is saved in `Item.dollFit` and used in all outfits. `dollFit` is computed **relative to the anchors** (offset and scale in shoulder-width units), not in pixels — so an item fitted once sits the same way on the mannequin and on your photo.
5. **Layers (bottom to top):** silhouette → bottom → top → outerwear → shoes → accessories. A "tuck in" toggle puts the bottom over the top.
6. **Rendering:**
   - display — `<img>` layers with CSS `transform` in a container with the silhouette's aspect ratio (easy to animate);
   - fitting editor — `react-konva` (ready-made scale and rotation handles);
   - saving an outfit as a picture — the same layers in a `<canvas>` → `toBlob()`.
7. **Photo tip:** items laid out on the floor, shot from above, straight, fully in frame — like in the inspiration video.

Retro bonus: in the film "MIS-MATCH" appeared on Cher's screen — we can show that when an outfit's score is low.

Limitation: it's a collage, not a photo — items are flat, with no folds and no fit to the body.

### Mannequin from your measurements

Three levels, from simple to complex. For rendering all three are the same: "picture + anchors".

| Level | What it is | When |
|---|---|---|
| **Standard mannequin** | One drawn SVG silhouette with anchors | PoC, step 10 |
| **Mannequin from measurements** | The SVG is generated from your parameters | Step 14 (optional) |
| **Your own photo** | Anchors from MediaPipe (see above) | Step 14 (optional) |

**Parameters** (all optional; anything not entered falls back to a default):
- height;
- bust, waist, hip circumference — the same measurements as in shops' size charts;
- shoulder width and leg length — optional; if missing, they're computed from height and circumferences;
- appearance: skin tone, later a hairstyle. The default is a neutral grey mannequin.

Measurements are entered in centimeters or with sliders and a live preview.

**How a silhouette comes out of the measurements:**
1. **Anchor heights come from the height** using standard body proportions: shoulders, bust, waist, hips, knees, ankles — each at its own fraction of the height. Leg length, if given, shifts the hips and knees.
2. **The width at each anchor comes from the circumference.** The body's cross-section is roughly elliptical, so the width visible from the front ≈ circumference × a factor (≈ 0.3–0.36; tuned by eye).
3. **The outline** is a smooth curve through the left-side points at each anchor, mirrored for the right side; arms and legs are simple shapes.
4. **The scale is relative:** the doll always fills its frame; centimeters only set the proportions.

**How items sit on such a mannequin:**
- `dollFit` is stored relative to its slot's anchors: tops relative to the shoulders, bottoms relative to the waist and hips. Wider hips → wider trousers, with no re-fitting.
- An item photo is flat, so it can be stretched horizontally only slightly (±15%), otherwise prints get distorted.
- **The doll can't show whether something fits:** the item's own dimensions are unknown. A possible later idea: enter the item's length in centimeters → the doll shows where on **your** height a dress ends (mini or midi).

**Privacy:** only you see your measurements. They aren't shown to friends and aren't sent to AI; they're deleted with the account. Data model: [`BodyProfile`](data-model.md#bodyprofile-optional).

## Two types of models

| Type | How it works | Examples |
|---|---|---|
| Specialized try-on | Take **one** photo of you and repaint only the clothing area (by a mask). Face, pose and background stay original | CatVTON, Leffa, IDM-VTON |
| General-purpose with several references | Generate a **new** image from several photos | Gemini (Nano Banana) — paid; open FLUX Kontext, Qwen-Image-Edit — heavy and more expensive to run |

**For our own generation — specialized try-on models.** They're lighter (so cheaper on GPU), more predictable, and don't change the face. 3–4 reference photos become a set of base photos (different poses and angles), one of which is picked for each try-on.

## Open try-on models

| Model | VRAM | Notes |
|---|---|---|
| CatVTON | < 8 GB | Light, 1024×768, masks are built automatically; the cheapest GPUs on Modal (T4 / L4) are enough |
| Leffa (Meta) | 8–12 GB | Control over both clothing and pose |
| IDM-VTON | 16+ GB | Realistic textures; needs a more expensive GPU |

The starting model is **CatVTON**. Licenses of open try-on models are mostly non-commercial: fine for a free personal project, to be reviewed before monetization.

## Pipeline

1. **Base photo** — one of the reference photos of yourself.
2. **Mask** — which area to replace (top / bottom / the whole figure). Built automatically by a human parsing model (human parsing, DensePose); CatVTON has this built in.
3. **Item photo** — cut out from the background.
4. **Diffusion model** → result.
5. **Top + bottom = two passes:** first the top, then the bottom on the resulting image. A dress is one pass.

## How hard it is

Training our own model is unrealistic. "Our own generation" means running a ready open model and writing the glue around it.

| Step | Difficulty | Roughly |
|---|---|---|
| Check quality on your own photos: the public CatVTON demo on Hugging Face (a few runs a day; photos go to someone else's server) | No code | An hour |
| A Python function on Modal based on the code from the CatVTON repository | Medium; easier than locally — Modal builds the CUDA environment itself from a description in code | 2–5 days |
| Connecting it to NestJS (call + webhook) | Easy | 1–2 days |
| Quality tuning (masks, lighting, two-pass artifacts) | The longest | As long as you like |

Python at the "read and adapt someone else's code" level: ~100–200 lines. No machine learning math needed.

## Modal: card and spending limit

- **A card is required.** Official docs: a workspace must have a payment method to use Modal.
- **$30 of credits every month** on the Starter plan. GPU prices are per second: T4 ≈ $0.59 / h, L4 ≈ $0.80 / h.
- **The spending limit (workspace spend limit)** caps exactly the charges above the credits. When it's reached, Modal stops jobs that would cost money. Set the lowest possible value right after signing up.
- **Roughly:** $30 ≈ 37 h on an L4 → very roughly 1–2 thousand try-ons a month (counting two passes and cold starts).
- **Cold start:** the first try-on after idling adds 30–60+ s to load the model. Keeping a "warm" container all the time is expensive, so we live with it and show the scanning animation.

Sources: [Modal Pricing](https://modal.com/pricing), [Billing](https://modal.com/docs/guide/billing), [Budgets](https://modal.com/docs/guide/budgets).

## NestJS integration

```
NestJS ──POST (jobId, presigned URLs)──► Modal web endpoint ──► spawn GPU function
   ▲                                                              │
   │                                  downloads photos via GET URLs,
   │                                  generates, puts the result at the PUT URL
   └──────── webhook POST /internal/try-on-jobs/:id/complete ─────┘
```

- **Nest calls the Modal endpoint** and passes `jobId`, presigned GET URLs of the photos (base photo + items) and a presigned PUT URL for the result. The endpoint replies `202` immediately and starts the GPU function in the background.
- **Modal never gets storage keys** — only temporary links to specific files.
- **After generating, Modal calls the webhook** in Nest with a secret token (stored in Modal Secrets and in the API's `.env`).
- **Nest has a `TryOnProvider` interface:** a `ModalProvider` implementation now; `LocalWorkerProvider` or `GeminiProvider` can be added later without changing the rest of the code.
- **Cache key** — a hash of `itemIds` + base photo + model version.

### Flow

1. The client calls `POST /outfits/:id/try-on`.
2. The API checks the daily limit (`UsageCounter`) and the cache. If a result exists — returns a presigned URL right away. If not — creates a `TryOnJob` (`pending`) and calls Modal.
3. Modal generates, puts the result into storage, calls the webhook → `done` (or `failed` with a reason).
4. The client polls `GET /try-on-jobs/:id` and meanwhile shows the "scanning" animation — the same retro effect as in the video.
5. If the month's credits are used up or Modal is unavailable — "the fitting room is closed right now" and the 2D doll.

## Preparing item photos

- **Background removal:** `@imgly/background-removal` — right in the browser (WASM / ONNX), free, no keys. AGPL license — fine for a personal project, to be reviewed for a commercial one.
- **Main colors:** `node-vibrant` or `colorthief` on the cut-out image.
- **Auto-tagging:** see [auto-tagging.md](auto-tagging.md).
- **Compression:** WebP, ~1024 px on the longer side.

## Paid alternative: Gemini (reference)

As of September 2026, source: [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing). Image generation in the Gemini API has **no** free tier.

| Model | id | Price per image |
|---|---|---|
| Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` | $0.034 (1K) |
| Nano Banana | `gemini-2.5-flash-image` | $0.039 |
| Nano Banana 2 | `gemini-3.1-flash-image` | $0.067 (1K) |
| Nano Banana Pro | `gemini-3-pro-image` | $0.134 (1K / 2K) |

- Roughly: 1 person × 1 try-on a day ≈ $1 / month; 10 people × 3 a day ≈ $30–35 / month.
- Google AI Studio (the web UI) is free — handy for comparing quality with CatVTON.
- Google Cloud's $300 credits don't apply to the Gemini API.
- On the free tier (text models) Google may use data to improve its products; on the paid tier it doesn't.

## Risks

- **Quality:** artifacts at the mask edges, complex prints and logos; two passes (top + bottom) accumulate artifacts.
- **Credits run out:** with many users $30 may not be enough → daily limits, caching, generation only on request.
- **Cold starts:** the first try-on after idling is slow.
- **Privacy:** photos are processed on Modal's servers, but by our own code, and aren't passed to third-party AI providers.
