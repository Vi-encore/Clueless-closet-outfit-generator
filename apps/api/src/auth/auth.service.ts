import { hash, verify } from '@node-rs/argon2';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RefreshTokenService } from './refresh-token.service.js';
import type { SignInRequest } from './requests/sign-in.request.js';
import type { SignUpRequest } from './requests/sign-up.request.js';
import type { AccountView, TokenPair, AccessTokenPayload } from './auth.interfaces.js';

/** The columns an account is described by. The hash is not among them. */
const accountFields = {
  id: true,
  email: true,
  username: true,
  displayName: true,
} as const;

/** PostgreSQL's unique-violation, as Prisma reports it. */
function isAlreadyTaken(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * A real argon2 hash of a value nobody will ever send, computed once.
 *
 * Signing in with an unknown email verifies against this instead of returning early.
 * Without it, "no such account" would answer in a millisecond while a wrong password
 * took a hundred, and the difference alone would say whether an address is registered.
 */
const absentAccountHash = hash('no account has this password');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async signUp(input: SignUpRequest): Promise<AccountView> {
    // Hashing before the insert, so a password never travels further than this method.
    const passwordHash = await hash(input.password);

    try {
      return await this.prisma.user.create({
        data: {
          email: input.email,
          username: input.username,
          displayName: input.displayName ?? null,
          passwordHash,
        },
        // `select` rather than trimming the result afterwards: the hash is never
        // fetched at all, so there is nothing to forget to remove.
        select: accountFields,
      });
    } catch (error) {
      if (isAlreadyTaken(error)) {
        // This does admit that the address or name is in use. Hiding it would mean
        // answering 201 and sending a mail instead, which needs a mailer we do not have.
        throw new ConflictException('That email or username is already taken');
      }
      throw error;
    }
  }

  async signIn(input: SignInRequest): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { ...accountFields, passwordHash: true },
    });

    const matches = await verify(user?.passwordHash ?? (await absentAccountHash), input.password);

    if (!user || !matches) {
      // One message for both cases, so the form cannot be used to ask whether
      // somebody has an account here.
      throw new UnauthorizedException('Email or password is wrong');
    }

    return this.issueTokens(user.id);
  }

  /** Issues a fresh pair for a user who has already been identified somehow. */
  async issueTokens(userId: string): Promise<TokenPair> {
    const refresh = await this.refreshTokens.issue(userId);

    return {
      accessToken: await this.jwt.signAsync({ sub: userId } satisfies AccessTokenPayload),
      refreshToken: refresh.token,
      refreshTokenExpiresAt: refresh.expiresAt,
    };
  }

  /**
   * Exchanges a refresh token for a new pair, retiring the one it was given.
   *
   * Unknown, already used and expired all end here as the same 401: an honest client
   * has to sign in again in every case, and a dishonest one learns nothing.
   */
  async refresh(token: string): Promise<TokenPair> {
    const rotated = await this.refreshTokens.rotate(token);

    if (!rotated) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      accessToken: await this.jwt.signAsync({ sub: rotated.userId } satisfies AccessTokenPayload),
      refreshToken: rotated.token,
      refreshTokenExpiresAt: rotated.expiresAt,
    };
  }

  /**
   * Ends the session this refresh token belongs to.
   *
   * Takes no access token and asks no questions: the refresh token is itself the
   * credential, and it is the thing being retired. Nothing is reported, because
   * there is nothing a client could usefully do differently.
   */
  async signOut(token: string): Promise<void> {
    await this.refreshTokens.revoke(token);
  }

  /**
   * Turns an access token into the person it belongs to, with no request involved.
   *
   * This is the entry point for callers that have a token and nothing else - the
   * WebSocket gateway authenticating a handshake, where there is no request for a
   * Passport strategy to run against.
   */
  async verifyAccessToken(token: string): Promise<AccountView> {
    let payload: AccessTokenPayload;

    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return this.userFromPayload(payload);
  }

  /**
   * The step both entry points share. Over HTTP the signature has already been
   * checked by the Passport strategy; elsewhere by `verifyAccessToken`.
   */
  async userFromPayload(payload: AccessTokenPayload): Promise<AccountView> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: accountFields,
    });

    if (!user) {
      // The signature was fine, but the account is gone. A token outliving its
      // owner must not keep working.
      throw new UnauthorizedException('Invalid token');
    }

    return user;
  }
}
