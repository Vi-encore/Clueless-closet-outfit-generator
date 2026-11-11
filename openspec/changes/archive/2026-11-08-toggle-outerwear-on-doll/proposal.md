# Proposal

## Why

On the doll, outerwear is drawn over everything else. A cut-out is flat and opaque, so a closed trench coat hides the top under it completely: the person tried it on a real outfit and could see only the sleeves of the T-shirt. Drawing a coat "open" would need a second image of it, which there is not; taking it off the doll for a look is enough.

## What Changes

- A checkbox "Показати верхній одяг" under the doll, shown only when the outfit has outerwear on the doll, on by default.
- Unticked, the outerwear is not drawn; the outfit itself is unchanged, so liking, saving and wearing still mean the whole outfit.

Out of scope: an "open coat" drawing, remembering the choice between outfits.

## Capabilities

### Modified Capabilities
- `web-outfits`: outerwear can be taken off the doll.

## Impact

- `apps/web/src/features/outfits/doll/doll.tsx`, `doll.spec.tsx`, `shared/i18n/uk.ts`.
