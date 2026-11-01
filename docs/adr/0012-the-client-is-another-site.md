# 12. The client is another site, and the settings say so

- **Status:** accepted
- **Decided in:** `add-web-shell`, roadmap step 8
- **Date:** 2026-11-01

## Context

The client goes on static hosting and the API somewhere else, so the browser sees
two origins. Two differences hide behind that, and both fail silently.

An **origin** is scheme, host and port. A **site** ignores the port and takes only
the registrable domain. `localhost:5173` and `localhost:3000` are two origins and
one site, while `*.pages.dev` and `*.onrender.com` are two origins and two sites.
A `SameSite=Lax` cookie travels between origins of one site and not between sites,
so a refresh that works on a laptop stops working on the first day of a deployment,
with nothing in any log.

The refresh cookie also has a narrow `Path`, `/auth/refresh`. A proxy that strips a
prefix has the browser call `/api/auth/refresh`, the cookie never matches, and the
refresh fails with a 401 that looks exactly like an expired token.

## Decision

Development talks to the API directly and across origins, with no proxy, so that
CORS is exercised every day rather than first in production.

`WEB_ORIGINS` names the origins allowed to call the API, and allows none by
default. Each entry must be a bare origin, and a trailing slash stops the
application at startup, because CORS compares strings exactly and the rule would
otherwise never match.

`COOKIE_SAMESITE` sets the cookie's attribute. It stays `lax` by default, and a
deployment with the client on another site sets `none`, which forces `Secure`.

## Consequences

- A deployment has two settings it must get right. `.env.example` explains both.
- `none` gives up the CSRF defence `lax` provided. The cookie only reaches
  `/auth/refresh` and `/auth/sign-out`, and CORS stops another page reading the
  answer, but a forged request can still spend the token and sign somebody out.
  That is accepted as a nuisance rather than a breach.
- One owned domain, with the client on `app.` and the API on `api.`, is one site.
  `lax` then works unchanged, and this cost goes away.
- The phone test in step 11 does use a proxy, because one tunnel has one address.
  It has to rewrite the cookie's path as well as the request's; `docs/poc.md`
  records how.
