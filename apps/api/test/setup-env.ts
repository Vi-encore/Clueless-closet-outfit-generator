// AppModule validates its settings the moment it is imported, which happens before
// any `beforeAll` could run. Vitest executes setup files before the test file is
// loaded, so this is the only place early enough - and it is what keeps the suites
// from depending on a .env file that git never sees.
process.env.DATABASE_URL ??= 'postgresql://closet:closet@localhost:5432/closet_test';
process.env.JWT_SECRET ??= 'a secret only these tests ever use, long enough';

// As in setup-db.ts: the suites make far more requests than a real caller would.
process.env.RATE_LIMIT_MAX = '100000';
process.env.AUTH_RATE_LIMIT_MAX = '100000';

// Never reached: these suites replace PrismaService and touch no storage. The
// settings are here because the schema requires them to start at all.
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_REGION = 'us-east-1';
process.env.S3_FORCE_PATH_STYLE = 'true';
process.env.S3_BUCKET = 'closet-photos-test';
process.env.S3_ACCESS_KEY_ID = 'closet';
process.env.S3_SECRET_ACCESS_KEY = 'closet-secret';
