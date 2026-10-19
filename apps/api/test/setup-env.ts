// AppModule validates its settings the moment it is imported, which happens before
// any `beforeAll` could run. Vitest executes setup files before the test file is
// loaded, so this is the only place early enough - and it is what keeps the suites
// from depending on a .env file that git never sees.
process.env.DATABASE_URL ??= 'postgresql://closet:closet@localhost:5432/closet_test';
process.env.JWT_SECRET ??= 'a secret only these tests ever use, long enough';

// As in setup-db.ts: the suites make far more requests than a real caller would.
process.env.RATE_LIMIT_MAX = '100000';
process.env.AUTH_RATE_LIMIT_MAX = '100000';
