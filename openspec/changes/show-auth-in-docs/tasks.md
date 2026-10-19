# Tasks

## 1. Show the token in the documentation

- [ ] 1.1 Claude writes the tests "A token can be supplied", "A protected route requires the token" and "A public route requires nothing"
- [ ] 1.2 Declare the bearer scheme as `access-token` and make it the document's default requirement
- [ ] 1.3 Compose the exemption into `@Public()`, so the padlocks follow the guard with no controller touched; verify the new tests pass and the four existing documentation scenarios still do
