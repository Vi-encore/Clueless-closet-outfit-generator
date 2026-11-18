# Design

## Context

In development, three things listen on the laptop:

- the client: Vite, `http://localhost:5173`;
- the API: Nest, `http://localhost:3000`, both HTTP and Socket.IO;
- the object store: MinIO, `http://localhost:9000`.

The client calls the API across origins, by design (ADR-0012). The refresh cookie has `Path=/auth/refresh`. The API hands out presigned S3 links signed for `localhost:9000`.

A phone sees none of these. A Cloudflare Quick Tunnel (`cloudflared tunnel --url http://localhost:5173`) gives one public HTTPS address for one local port. [docs/poc.md](../../../docs/poc.md#phone-access-through-a-tunnel) chose to tunnel the Vite server and have it proxy the rest. ADR-0012 recorded that this proxy must rewrite the cookie's path. See proposal.md for scope.

What was checked before writing this:

- **The API refuses no origin.** `enableCors` with an origin list only decides whether to add `Access-Control-Allow-Origin`. `OriginIoAdapter` passes the same list to Socket.IO's `cors` option, which affects headers only. So requests that arrive through the proxy with the tunnel's `Origin` are answered. The browser needs no CORS headers either, because to it they are same-origin.
- **A presigned SigV4 link signs the `host` header.** A proxy that sends the store's own host keeps the signature valid. `changeOrigin: true` does exactly that.

## Goals / Non-Goals

**Goals:**
- One command per side (`api-phone`, `web-phone`) plus the tunnel, and the whole application works from a phone.
- Ordinary development unchanged: no proxy, CORS exercised every day (ADR-0012).
- The proxy's configuration is code that a test can read, not knowledge in a doc.

**Non-Goals:**
- A stable address, hosting, or Backblaze for the phone.
- PWA installation (`add-pwa`).
- Making HMR work through every tunnel. It is set up for the tunnel's port, and a reload is enough when it does not connect.

## Decisions

### 1. A Vite mode, not a separate config

`vite --mode phone` reads `apps/web/.env.phone` (`VITE_API_URL=/api`), and `vite.config.ts` becomes `defineConfig(({ mode }) => …)`. The server settings come from a small module beside it, `apps/web/vite.server.ts`, which exports `serverFor(mode)`. The test imports that function. Ordinary development gets the same `port` and `strictPort` as today.

For the phone mode, `serverFor` adds:

- **`proxy['/api']`:**
  - `target: 'http://localhost:3000'` and `changeOrigin: true`;
  - `ws: true`, so that the chat's WebSocket upgrade goes through;
  - `rewrite` that strips `/api`;
  - `cookiePathRewrite: { '/auth/refresh': '/api/auth/refresh' }`.
- **`proxy['/storage']`:** `target: 'http://localhost:9000'`, `changeOrigin: true`, and `rewrite` that strips `/storage`.
- **`allowedHosts: ['.trycloudflare.com']`:** Vite refuses unknown hosts otherwise.
- **`hmr: { clientPort: 443 }`:** the page is served on 443 through the tunnel. On `localhost:5173` in this mode HMR does not connect, and that is acceptable.

*Alternative:* tunnel each port separately, three tunnels with three addresses. Then CORS, cookies across sites and `COOKIE_SAMESITE=none` would all have to hold on random addresses. One origin removes all of it.

### 2. A relative API address in the client

- **`shared/config.ts`** accepts a value that starts with `/`, besides an absolute URL. `fetch('/api/…')` resolves against the page.
- **Socket.IO is the catch.** `io('/api')` reads `/api` as a *namespace* on the current host, not as a URL path. A helper in `chat/chat.utils.ts`, `socketAddress(apiUrl)`, returns:
  - `{ url: apiUrl, path: '/socket.io' }` for an absolute address;
  - `{ url: undefined, path: '/api/socket.io' }` for a relative one, where `io(undefined, …)` means "this origin".

  `connectChat` spreads it. The shape is named `SocketAddress` in `chat.interfaces.ts`.

*Pitfall:* the API's Socket.IO server stays at its default path `/socket.io`. The proxy strips `/api`, so `/api/socket.io/?EIO=4…` arrives as `/socket.io/?EIO=4…`.

### 3. `S3_PUBLIC_URL`: rewrite the origin, keep the signature

- **The setting.** It is optional, and it is either a bare origin or a path such as `/storage`, with no trailing slash. A trailing slash is refused at startup, as with `WEB_ORIGINS`.
- **The rewrite.** `StorageService` passes every link it signs through `throughPublicBase(url, endpoint, base)` in `storage/storage.utils.ts`. When a base is set and the link starts with the endpoint, the endpoint is replaced by the base. Otherwise the link is returned unchanged.
- **Why the signature still holds.** The query, and with it the signature, stays as it is. The proxy's `changeOrigin` sends `Host: localhost:9000`, which is the host the link was signed for.
- **What it does to the photos.** A relative link (`/storage/closet-photos/…`) works as an `<img src>` and as a `fetch` URL on the page that received it. Uploading through the proxy is a `PUT` to the same origin, so the bucket's CORS rules do not matter.

*Alternative:* set `S3_ENDPOINT` to the tunnel's address. The API also uses the endpoint to reach the store itself, for deleting a replaced photo and for initialising the bucket, so that would route its own traffic through the internet and the tunnel.

### 4. Running it

- **`.claude/launch.json`** gains two entries:
  - `api-phone`: `pnpm dev:api` with `S3_PUBLIC_URL=/storage`;
  - `web-phone`: `pnpm dev:phone`, port 5173.
- **The tunnel** runs in a terminal: `cloudflared tunnel --url http://localhost:5173`.
- **`docs/poc.md`** gets the steps: containers, the two entries, the tunnel, and opening the printed `https://….trycloudflare.com` on the phone.

## Risks / Trade-offs

- **[Risk]** The tunnel buffers or drops the WebSocket upgrade. → Cloudflare Tunnel supports WebSockets, and Socket.IO falls back to polling, which the proxy also passes. The check on a phone covers it.
- **[Risk]** The cookie rewrite is wrong in a way no unit test sees. → The test asserts the configuration, and the phone check asserts the behaviour: a reload keeps the session.
- **[Trade-off]** In phone mode, a desktop browser on `localhost:5173` gets relative photo links and API calls through the proxy, which is fine, but loses HMR.
- **[Trade-off]** Anybody with the tunnel's address reaches the application while it runs. It still needs an account, and the address is random and short-lived.

## Migration Plan

Nothing changes unless the phone mode is used. Rollback is a revert.
