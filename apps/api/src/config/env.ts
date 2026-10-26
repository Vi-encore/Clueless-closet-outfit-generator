import { z } from 'zod';

/** The environment names the API accepts. `test` is here because Vitest sets it. */
export const ENVIRONMENTS = ['development', 'production', 'test'] as const;

/**
 * The settings the API reads from its environment.
 *
 * Everything in `process.env` is a string, so `PORT` is coerced before it is checked -
 * which is also what turns a nonsense value into a startup failure instead of a port
 * number of NaN. `PORT` and `NODE_ENV` have defaults; `DATABASE_URL` deliberately has
 * none, because a wrong-but-present connection string would have the API quietly talk
 * to the wrong database.
 */
export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(ENVIRONMENTS).default('development'),
  // The protocol check is the whole point of this line. A plain `z.url()` accepts
  // `localhost:5432`, because the URL parser happily reads `localhost:` as a protocol.
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Short secrets are the weak point of HS256: the signature is only as strong as
  // the string it is keyed with, and a guessable one lets anyone mint their own tokens.
  JWT_SECRET: z.string().min(32),
  // Lifetimes in seconds. A number, not a duration string, because the same value
  // also sets a cookie's lifetime and computes an expiry date.
  ACCESS_TOKEN_TTL: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  REFRESH_TOKEN_TTL: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 24 * 60 * 60),
  /** The rate-limit window, in seconds, shared by both allowances. */
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
  /** Requests per window, per caller, on everything that takes no password. */
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  /** The same window on sign-up, sign-in and refresh, where guessing pays off. */
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  /**
   * How many proxy hops to believe when working out who is calling.
   *
   * Zero by default, which means the socket's own address and nothing else. Behind a
   * proxy every request arrives from the proxy, so a limiter that counts the socket
   * treats the whole world as one caller and bans everybody together; a limiter that
   * trusts `X-Forwarded-For` without a proxy in front lets anyone forge their way
   * around it. Neither is a safe guess, so the deployment says which it is.
   */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

export type Env = z.infer<typeof envSchema>;
