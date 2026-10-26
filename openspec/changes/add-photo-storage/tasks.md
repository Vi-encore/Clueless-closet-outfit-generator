# Tasks

## 1. Somewhere to put a file

- [x] 1.1 Claude writes the tests "Lifetimes default", "Addressing style defaults to path" and "A lifetime that is not a number stops the application"
- [x] 1.2 Add MinIO to `docker-compose.yml` with a healthcheck, and decide once how the bucket comes into being — a one-shot container or the service at startup — then write the decision down where the next person will meet it
- [x] 1.3 Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`, add the storage settings to the environment schema and to `.env.example`
- [x] 1.4 Add `StorageService` with `uploadUrl`, `viewUrl` and `remove`, and `keys.ts` with the owner-carrying key and the reader that gets the owner back out; verify the 1.1 tests pass

## 2. Asking for somewhere to put it

- [x] 2.1 Claude writes the tests "A URL and a key come back", "The key names its owner", "Only images are accepted", "Signing in is required", "Bytes go up and come back" and "An unsigned request is refused"
- [x] 2.2 Add `POST /items/upload-url`, accepting only image content types and answering with the key, the URL and its lifetime
- [x] 2.3 Verify the 2.1 tests pass, including the round trip that puts real bytes through the signed URL and reads them back

## 3. An item that has a photograph

- [ ] 3.1 Claude writes the tests "Somebody else's key is refused", "An invented key is refused", "Your own key is accepted", "The owner's item carries a link", "An item without a photo says so" and "A list carries links too"
- [ ] 3.2 Accept `photoOriginalKey` on create and patch, refusing a key whose owner segment is not the caller
- [ ] 3.3 Attach the link wherever an item is returned, so the rule about who may see it is not written a second time; verify the 3.1 tests pass

## 4. A friend's view, and tidying up

- [ ] 4.1 Claude writes the tests "A friend gets a link to a shared item", "The old object goes" and "The new object stays"
- [ ] 4.2 Carry the link into the friend's wardrobe
- [ ] 4.3 Delete the replaced object after the row is updated, logging and swallowing a failure rather than telling the owner their edit failed; verify the 4.1 tests pass and the whole suite stays green
