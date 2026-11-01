# Tasks

## 1. The bucket lets a browser in

- [x] 1.1 Claude writes the tests "The rules name the configured origins", "Only an upload is allowed", "No origins is refused" and "No checksum in the URL"
- [x] 1.2 Turn off the client's default checksums in `s3.ts`, and prove the round trip against MinIO still passes
- [x] 1.3 Add `cors-rules.ts` and the `storage:cors` script, with the reasoning in the file as `init-bucket.ts` has it
- [x] 1.4 Apply the rules to the Backblaze bucket and send a real preflight at it; if the scoped key may not write them, set them from Backblaze's side and record that

## 2. A list of your things

- [x] 2.1 Claude writes the tests "The desktop opens the wardrobe", "Items are shown with their photographs", "An item without a photo is still shown", "An empty wardrobe says so", "More can be asked for", "The end offers nothing", "A slot narrows the list", "The choice survives in the URL", "A late answer changes nothing" and "No code is without a label"
- [x] 2.2 Add `@closet/core` to the client, make the scripts build it first, and add the labels to `i18n/uk.ts`
- [x] 2.3 Add `api/items.ts` and `shell/use-pages.ts`
- [x] 2.4 Add the wardrobe screen and the desktop shortcut; verify the 2.1 tests pass, then look at it at phone width

## 3. Adding an item

- [x] 3.1 Claude writes the tests "The types follow the slot", "An item is added with its photograph", "A photograph is required" and "A failed upload creates nothing"
- [x] 3.2 Add the upload, sending no credentials of any kind
- [x] 3.3 Add the form, with `accept` and the API's content types being one list in `@closet/core`; verify the 3.1 tests pass
- [x] 3.4 Claude writes the tests "A refused form opens a dialog", "The dialog is dismissed with OK" and "Escape dismisses the dialog"
- [x] 3.5 Add `ErrorDialog` and use it in every form; verify the 3.4 tests pass
- [x] 3.6 Make the file button stand out, and give what a pointer can press an answer to hovering, kept away from touch screens and from anybody who asked for less motion; look at both in a browser

## 4. One item

- [x] 4.1 Claude writes the tests "The card names the item in Ukrainian", "The card leads back to where the person was", "A card opened directly still leads to the wardrobe", "Somebody else's item is simply not there", "Sharing an item", "Archiving asks why" and "Archiving returns to where the person was"
- [x] 4.2 Add the card, answering a 404 with the not-found window
- [x] 4.3 Add sharing and archiving; verify the 4.1 tests pass

## 5. Together

- [ ] 5.1 Run both suites, the type check, the linter and the formatter, and check what `@closet/core` added to the client's bundle
- [ ] 5.2 Point the API at Backblaze and the local database, then add an item with a real photograph from a browser, reload, see it, share it and archive it. Read the console: this is the check the whole change exists for
- [ ] 5.3 Tick what step 8 now satisfies in the roadmap, and note the bucket rules in `.env.example` where the next deployment will meet them
