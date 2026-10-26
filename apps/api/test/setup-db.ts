// These tests write to a real database, so they use `closet_test` rather than the
// one holding the wardrobe being built by hand. Pointing DATABASE_URL at it here
// means nothing else in the suite has to know which database it is talking to.
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ?? 'postgresql://closet:closet@localhost:5432/closet_test';

// These suites sign in dozens of times in a few seconds, which is well past any
// allowance worth shipping. The limits are configuration precisely so that the
// tests about them can set their own; everything else runs as if there were none.
process.env.RATE_LIMIT_MAX = '100000';
process.env.AUTH_RATE_LIMIT_MAX = '100000';
