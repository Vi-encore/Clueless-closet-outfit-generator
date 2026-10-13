// These tests write to a real database, so they use `closet_test` rather than the
// one holding the wardrobe being built by hand. Pointing DATABASE_URL at it here
// means nothing else in the suite has to know which database it is talking to.
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? 'postgresql://closet:closet@localhost:5432/closet_test';
