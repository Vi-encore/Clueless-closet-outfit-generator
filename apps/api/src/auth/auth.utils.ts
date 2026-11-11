import { createHash } from 'node:crypto';

/**
 * SHA-256, not argon2.
 *
 * Argon2 is slow on purpose, which is right for a short password someone might guess
 * and wrong for 32 random bytes nobody will. Here the slowness would only tax the
 * server on every refresh, while a fast hash still makes the stored value useless to
 * whoever reads the table.
 */
export function fingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
