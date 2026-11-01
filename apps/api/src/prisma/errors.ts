import { Prisma } from '../generated/prisma/client.js';

/**
 * PostgreSQL's unique violation, as Prisma reports it.
 *
 * Three places treat this as an answer rather than a failure: a friendship
 * asked for from both sides at once, a conversation created by two first
 * messages, and a message resent after its acknowledgement was lost. Each had
 * its own copy of this check until they were counted.
 */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
