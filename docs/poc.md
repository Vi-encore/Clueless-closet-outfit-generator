# Proof of concept: no spending, no card

## Principle

The proof of concept doesn't need the cloud: everything runs on your own PC, and the phone connects through a free tunnel. The code goes through abstractions (`StorageService` on the S3 API, `TryOnProvider`), so moving to R2, Modal or hosting later is a configuration change, not a rewrite.

## Components

| What | PoC (no card) | Later (once there is a budget) |
|---|---|---|
| Database | Neon (no card) or Postgres in Docker | Neon |
| Files | Backblaze B2 (10 GB, no card, S3 API) | R2 or B2 |
| API (NestJS) | Locally on the PC | Render / VPS |
| Client (PWA) | Vite dev server on the PC | Cloudflare Pages / Netlify / Vercel |
| Phone access | Cloudflare Quick Tunnel — an HTTPS `*.trycloudflare.com` address, no account | Own domain / hosting |
| Auto-tagging | Gemini free tier (only a Google account needed) or manual | Gemini, paid tier |
| Try-on | 2D doll; AI — see [below](#try-on-without-a-card) | Modal or Gemini |

### Phone access through a tunnel

Built in `reach-from-a-phone`. To open the application on a phone:

1. Start the containers: `docker start closet-db closet-storage`.
2. Start the API with photo links through the proxy. Either use the `api-phone` entry in `.claude/launch.json`, or run `pnpm dev:api` with `S3_PUBLIC_URL=/storage`.
3. Start the client in the phone mode. Either use the `web-phone` entry, or run `pnpm dev:phone`.
4. Start the tunnel: `cloudflared tunnel --url http://localhost:5173`, after a one-time `winget install --id Cloudflare.cloudflared`. It prints a `https://….trycloudflare.com` address.
5. Open that address on the phone.

How it holds together (`apps/web/vite.server.ts`):

- **One HTTPS address.** PWA installation and the camera need HTTPS, and the tunnel provides it.
- **One tunnel for everything.** In the phone mode Vite passes on three kinds of request:
  - `/api` goes to Nest with the prefix stripped, WebSockets included, so the chat goes through too.
  - `/storage` goes to MinIO with the prefix stripped. The API hands out photo links under `/storage` (`S3_PUBLIC_URL`). The proxy presents MinIO's own host, which is the host the links were signed for, so the signatures hold.
  - Everything else is the client.

  The client and the API share one address, so CORS never applies.
- **The cookie's path is rewritten.** `cookiePathRewrite: { '/auth/refresh': '/api/auth/refresh' }` makes the browser send the refresh cookie back through the proxy. Without it, every reload signs you out ([ADR-0012](adr/0012-the-client-is-another-site.md)).
- **The chat's connection** goes to the page's own origin on the path `/api/socket.io`. `io('/api')` would read `/api` as a namespace instead.
- **Vite blocks unknown hosts,** so the phone mode allows `.trycloudflare.com`.
- **HMR is off.** Its client reloads the page whenever its WebSocket through the tunnel drops, and on Samsung Internet that meant pages reloading by themselves. A manual reload picks up a change.
- **The address changes on every run,** and the tunnel lives as long as the command runs. This is for tests and demos only, with no availability guarantees. Anybody with the address reaches the application while it runs, though they still need an account.

## Try-on without a card

| Option | Limitations | Role in the PoC |
|---|---|---|
| 2D doll (canvas) | None | The main way to show an outfit |
| Public CatVTON / IDM-VTON demo on Hugging Face, called from Nest via `@gradio/client` | A free account gets a few GPU minutes a day; the demo may break or disappear; photos go to someone else's server | A few AI try-ons on your own photos for the "wow effect" |
| Google Colab / Kaggle (free GPU in a notebook) | Limited sessions, not a server | Checking CatVTON quality without installing it on the PC |
| Locally on the RTX 4070 Ti SUPER | No limits | Whenever you feel like it; ComfyUI Desktop has a Windows installer |

In Nest these are implementations of one `TryOnProvider` interface: for the PoC — `HuggingFaceSpaceProvider`, later — `ModalProvider`, `LocalProvider` or `GeminiProvider`.

## What the PoC must show

- Adding 10–20 of your own items from a phone: photo → background removal → tags.
- Generating outfits for 3–4 occasions and judging whether the algorithm gives sensible combinations.
- Showing an outfit on the 2D doll.
- (Optional) 2–3 AI try-ons through a public demo.
- Two accounts — checking that users don't see each other's items.

## PoC limitations

- Works only while the PC is on and the API, client and tunnel are running.
- The tunnel address changes on every run.
- Data in Neon and B2 lives in real cloud services, so it survives the move from the PoC to the full version.

Sources: [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/), [Neon Pricing](https://neon.com/pricing), [Backblaze B2](https://www.backblaze.com/cloud-storage), [Hugging Face ZeroGPU](https://huggingface.co/docs/hub/en/spaces-zerogpu).
