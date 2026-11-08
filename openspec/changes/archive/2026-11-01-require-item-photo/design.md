# Design

## The rule goes in the schema

`photoOriginalKey` stops being optional in `createItemRequestSchema`. `updateItemRequestSchema` is built from the same shape and made partial, so `PATCH` keeps treating it as optional, which is right: a patch changes what it names, and it has no way to clear a photo.

Whose key it is stays where it was, in `assertOwnKey`, for the reason the schema's comment gives: a schema does not know who is asking.

## The column stays nullable

The database is not where this rule lives. A `NOT NULL` would need a decision about every row written before it, and the only rows like that are test data. `photoUrl: null` keeps meaning what it meant, and the client keeps drawing a tile for one.

So "an item without a photo" is now something that can exist but can no longer be created, and the two scenarios that describe it write the row directly rather than through the route.

## Tests no longer get an item for free

Nearly every test about items posts one and has no interest in photographs. The helper supplies a key built the way `keyFor` builds one, so those tests stay about what they are about. No file is uploaded: nothing checks the object exists.
