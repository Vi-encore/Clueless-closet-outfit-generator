# Design

## Context

The guard is global and opens routes only where `@Public()` says so. Any padlock that is decided somewhere else is a second copy of that rule, and two copies drift.

## Goals / Non-Goals

**Goals:** the padlocks match the guard without anybody keeping them in step by hand.

**Non-Goals:** Swagger UI signing in on its own; documenting the refresh cookie.

## Decisions

### 1. Locked by default, opened by `@Public()` — not the other way round

`@ApiBearerAuth()` on each protected route is the arrangement the Nest documentation shows, and it is the wrong way round here. It would mean every future route needs two decorators remembered instead of none, and a forgotten one leaves a protected route looking open — the same shape of mistake the global guard was chosen to prevent, even if here it only misleads rather than exposes.

Instead the document carries a root-level `security` requirement, which OpenAPI applies to every operation, and the exemption is attached to `@Public()` itself:

```ts
export const Public = () => applyDecorators(SetMetadata(IS_PUBLIC, true), ApiSecurity({}));
```

One decorator now says both "the guard lets this through" and "the documentation shows no padlock", because those are the same fact. A new protected route is marked automatically by saying nothing.

### 2. `ApiSecurity({})`, because an empty requirement is the only way down

An operation's `security` replaces the root one rather than adding to it, so an exemption has to write something. `@nestjs/swagger` has no decorator that writes `security: []`: `ApiSecurity` always appends an entry. Passing `{}` appends the empty requirement object, which OpenAPI reads as "this operation is satisfied by presenting nothing". Verified in the generated document and in the UI: public operations come out as `security: [{}]` and render without a padlock.

### 3. The scheme is named, not anonymous

`addBearerAuth(options, 'access-token')` registers it under a name the UI prints in the Authorize dialog. The default name is `bearer`, which says how the token travels; `access-token` says which of our two tokens it is, and the refresh token is the one that must not go there.

## Common pitfalls

- **The scheme has to be declared even though nothing refers to it by name.** The root requirement names it, but `components.securitySchemes` is what gives the UI the input field; without `addBearerAuth` the requirement points at nothing and no button appears.
- **The padlock is cosmetic.** It reflects the document, not the guard. A test that asserts a route is protected still has to call the route.

## Risks / Trade-offs

- [A route that opts out of the global guard some other way than `@Public()` would keep its padlock] → there is no other way today, and adding one means touching the guard, where this rule is visible.
