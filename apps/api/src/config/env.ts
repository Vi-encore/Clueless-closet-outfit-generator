import { z } from 'zod';

/** The environment names the API accepts. `test` is here because Vitest sets it. */
export const ENVIRONMENTS = ['development', 'production', 'test'] as const;

/**
 * The settings the API reads from its environment.
 *
 * Everything in `process.env` is a string, so `PORT` is coerced before it is checked -
 * which is also what turns a nonsense value into a startup failure instead of a port
 * number of NaN. Both settings have defaults, so a bare `pnpm dev:api` just works.
 */
export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(ENVIRONMENTS).default('development'),
});

export type Env = z.infer<typeof envSchema>;
