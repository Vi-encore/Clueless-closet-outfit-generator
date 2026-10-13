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
});

export type Env = z.infer<typeof envSchema>;
