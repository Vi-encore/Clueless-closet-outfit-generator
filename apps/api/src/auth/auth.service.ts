import { hash } from '@node-rs/argon2';
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SignUpRequest } from './requests/sign-up.request.js';

/** What the API is willing to say about an account. Notably, not its hash. */
export interface AccountView {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
}

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

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
}
