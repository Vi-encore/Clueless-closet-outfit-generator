# Proposal

## Why

Step 11 is about a real phone, and today a phone cannot reach anything: the client, the API and the photo storage each listen on the laptop's `localhost`, on three ports.

A phone also needs HTTPS before it will open its camera or install an app. [docs/poc.md](../../../docs/poc.md#phone-access-through-a-tunnel) planned for this: one Cloudflare Quick Tunnel to the Vite server, which passes `/api` on to the API. ADR-0012 already noted that this proxy must rewrite the refresh cookie's path. Nothing of it has been built or tried yet.

The photos need the same treatment. The author chose to send them through the same tunnel rather than move them to Backblaze, so that everything stays local and keyless.

This is the first of three changes that make up [roadmap step 11](../../../docs/roadmap.md#step-11--pwa-and-phone-test). `add-pwa` and `add-invite-link` follow, and both depend on the app being reachable from a phone.

## What Changes

- **A "phone" mode for the client.** `pnpm dev:phone` starts Vite with `--mode phone`. It serves the client, passes `/api` to the API (HTTP and the chat's WebSocket alike), passes `/storage` to the object store, and accepts the tunnel's `*.trycloudflare.com` hosts. The refresh cookie's path is rewritten to `/api/auth/refresh`, so that a reload keeps the session.
- **The client accepts a relative API address.** `VITE_API_URL=/api` comes from a committed `apps/web/.env.phone`. The chat connects to the page's own origin on the path `/api/socket.io` whenever the address is relative.
- **The API can hand out photo links through a public base.** A new optional setting, `S3_PUBLIC_URL`, replaces the storage endpoint's origin in every presigned link it gives out. The phone mode sets it to `/storage`. The signature stays valid, because the proxy presents the endpoint's own host to the store.
- **A way to run it.** `.claude/launch.json` gains `api-phone` and `web-phone` entries. `docs/poc.md` gains the exact steps, from starting the tunnel to opening the address on a phone.
- **A first look on a phone:** signing in, a reload that keeps the session, the wardrobe's photos, adding an item with the camera, and the chat. This is the part of the step 9 and step 11 checklists that does not need installing.

Out of scope:

- **The manifest, the service worker and installing.** That is `add-pwa`.
- **The invitation link.** That is `add-invite-link`.
- **A stable address or hosting.** The Quick Tunnel's address changes on every run, as `docs/poc.md` accepts.
- **Backblaze for the phone.** The author chose the local store.

## Capabilities

### New Capabilities
- `phone-access`: serving the client, the API and the photos from one HTTPS address through a tunnel, with the session, the chat and the photos working through it.

### Modified Capabilities
- `photo-storage`: adds the requirement that presigned links go through a public base when one is set.
- `service-config`: adds the `S3_PUBLIC_URL` setting and how it is checked.

## Impact

- **`apps/web`:**
  - `vite.config.ts` gains a mode-dependent proxy, allowed hosts and HMR settings;
  - a new `.env.phone`, with `!apps/web/.env.phone` in `.gitignore`;
  - `shared/config.ts` accepts a relative address;
  - `chat/chat.socket.ts` takes its URL and path from a helper;
  - `package.json` gets a `dev:phone` script, and the root gets one too.
- **`apps/api`:**
  - `S3_PUBLIC_URL` in `config/env.ts` and `.env.example`;
  - `storage.service.ts` rewrites the links it signs.
- **Tooling:** `.claude/launch.json`. `cloudflared` is needed only on the machine that runs the tunnel, and it is not a project dependency.
- **Docs:** `docs/poc.md` (tunnel steps), `docs/roadmap.md` (step 11 split into three changes), `openspec/config.yaml`.
