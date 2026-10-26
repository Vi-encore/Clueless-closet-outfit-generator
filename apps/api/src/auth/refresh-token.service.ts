import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

/**
 * SHA-256, not argon2.
 *
 * Argon2 is slow on purpose, which is right for a short password someone might guess
 * and wrong for 32 random bytes nobody will. Here the slowness would only tax the
 * server on every refresh, while a fast hash still makes the stored value useless to
 * whoever reads the table.
 */
function fingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Returns the token to hand to the client; only its hash is written down. */
  async issue(userId: string): Promise<IssuedRefreshToken> {
    const token = randomBytes(32).toString('base64url');
    const lifetimeSeconds = this.config.get('REFRESH_TOKEN_TTL', { infer: true });
    const expiresAt = new Date(Date.now() + lifetimeSeconds * 1000);

    await this.clearExpired(userId);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: fingerprint(token), expiresAt },
    });

    return { token, expiresAt };
  }

  /**
   * Drops this user's dead tokens, here rather than in a scheduled job.
   *
   * This method already writes a row for them, so the sweep costs one statement and
   * needs no process that could quietly stop running. What it does not reach is
   * abandoned accounts: nobody signs in to those, so nothing clears them. That is
   * the known price of doing it here, and the roadmap records the rest.
   *
   * By `expiresAt` and never by `usedAt`. A spent but unexpired token is evidence -
   * presenting one almost always means it was stolen, since an honest client
   * discards its old token after exchanging it - and deleting those rows would make
   * a replayed token indistinguishable from an invented one, closing the door on
   * reuse detection before it is built.
   */
  private async clearExpired(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  }

  /**
   * Marks the token used and issues its replacement.
   *
   * Returns null when the token is unknown, already used or expired. The caller
   * cannot tell which, and neither can whoever sent it: all three mean the same
   * thing to an honest client and nothing useful to a dishonest one.
   */
  async rotate(token: string): Promise<(IssuedRefreshToken & { userId: string }) | null> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: fingerprint(token) },
    });

    if (!stored || stored.usedAt !== null || stored.expiresAt <= new Date()) {
      return null;
    }

    // Marking it used before issuing the replacement: if anything fails after this
    // point, the old token is already spent rather than still usable.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    });

    return { ...(await this.issue(stored.userId)), userId: stored.userId };
  }
}
