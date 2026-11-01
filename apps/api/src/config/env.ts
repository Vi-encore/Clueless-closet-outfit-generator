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
  /**
   * Where the photographs live.
   *
   * The endpoint, the region and the addressing style default to the MinIO that
   * `docker compose up` starts, because that is what somebody opening this
   * repository has. The bucket and the credentials have no defaults for the same
   * reason `DATABASE_URL` has none: a wrong-but-present value would have the API
   * quietly reading and writing somewhere nobody meant.
   */
  S3_ENDPOINT: z.url().default('http://localhost:9000'),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  /**
   * MinIO addresses a bucket by path (`host/bucket/key`); Backblaze by host
   * (`bucket.host/key`). Guessing is wrong in one direction or the other, so the
   * deployment says which, and the default is what works locally.
   */
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  /**
   * The origins a browser is allowed to call this API from, separated by commas.
   *
   * Empty by default, which allows nothing: a deployment opens the API to a client
   * deliberately rather than by inheriting a permissive default. Each entry has to be
   * an origin and nothing more - CORS compares the `Origin` header to this string
   * exactly, so a path or a trailing slash is not a stricter rule, it is a rule that
   * never matches, and the failure appears in a browser rather than here.
   */
  WEB_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    )
    .pipe(
      z.array(
        z
          .url()
          .refine(
            (origin) => URL.parse(origin)?.origin === origin,
            'expected a bare origin, with no path or trailing slash',
          ),
      ),
    ),
  /**
   * The refresh cookie's `SameSite` attribute.
   *
   * `lax` by default, because that is what works when the client and the API are the
   * same site - which includes development, where they differ only by port. A client
   * served from somewhere else entirely is a cross-site request, and a `lax` cookie is
   * simply not sent on one: the refresh then works locally and stops working on the
   * first day of a deployment, with nothing in the logs to say why. `none` is the
   * answer there, and it forces `Secure`, because browsers reject `None` without it.
   */
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  /** Long enough to pick a file and upload it, short enough that a leaked link dies. */
  S3_UPLOAD_URL_TTL: z.coerce.number().int().positive().default(300),
  /** Long enough to render a page of a wardrobe, and to leave it open a while. */
  S3_VIEW_URL_TTL: z.coerce.number().int().positive().default(900),
});

export type Env = z.infer<typeof envSchema>;
