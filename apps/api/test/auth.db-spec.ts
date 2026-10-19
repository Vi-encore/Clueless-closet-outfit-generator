import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../src/auth/auth.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createDatabaseApp } from './create-app.js';

let app: INestApplication<App>;
let prisma: PrismaService;

const account = {
  email: 'cher@example.com',
  username: 'cher',
  password: 'as if! whatever',
  displayName: 'Cher Horowitz',
};

beforeAll(async () => {
  app = await createDatabaseApp();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await prisma.user.deleteMany();
});

function signUp(body: object) {
  return request(app.getHttpServer()).post('/auth/sign-up').send(body);
}

function signIn(body: object) {
  return request(app.getHttpServer()).post('/auth/sign-in').send(body);
}

/** One registered, signed-in account, which most of these tests start from. */
async function register(): Promise<{ id: string; accessToken: string }> {
  const created = await signUp(account);
  const signedIn = await signIn({ email: account.email, password: account.password });

  return { id: created.body.id, accessToken: signedIn.body.accessToken };
}

/** The `name=value` part of the refresh cookie a response set, ready to send back. */
function refreshCookie(response: { headers: Record<string, unknown> }): string {
  const cookies = response.headers['set-cookie'] as string[];
  const cookie = cookies.find((candidate) => candidate.startsWith('refresh_token='));

  if (cookie === undefined) {
    throw new Error('the response set no refresh cookie');
  }

  return cookie.split(';')[0] as string;
}

function me(token?: string) {
  const call = request(app.getHttpServer()).get('/auth/me');

  return token === undefined ? call : call.set('Authorization', `Bearer ${token}`);
}

describe('Requirement: Sign-up creates an account', () => {
  it('Scenario: Account created', async () => {
    const response = await signUp(account);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      email: account.email,
      username: account.username,
      displayName: account.displayName,
    });
    expect(response.body.id).toBeTypeOf('string');
  });

  it('Scenario: Email already registered', async () => {
    await signUp(account);

    const response = await signUp({ ...account, username: 'dionne' });

    expect(response.status).toBe(409);
  });

  it('Scenario: Username already taken', async () => {
    await signUp(account);

    const response = await signUp({ ...account, email: 'dionne@example.com' });

    expect(response.status).toBe(409);
  });

  it('Scenario: Password too short', async () => {
    const response = await signUp({ ...account, password: 'as if!' });

    expect(response.status).toBe(400);
    expect(response.body.errors.map((error: { path: string }) => error.path)).toContain('password');
  });
});

describe('Requirement: A password is never stored or returned in the clear', () => {
  it('Scenario: Password stored as an argon2 hash', async () => {
    await signUp(account);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: account.email } });

    expect(stored.passwordHash).not.toContain(account.password);
    expect(stored.passwordHash.startsWith('$argon2')).toBe(true);
  });

  it('Scenario: Nothing leaks through the response', async () => {
    const response = await signUp(account);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain(account.password);
    expect(body).not.toContain('argon2');
    expect(body).not.toContain('passwordHash');
  });
});

describe('Requirement: Sign-in issues a token pair', () => {
  it('Scenario: Correct credentials', async () => {
    await signUp(account);

    const response = await signIn({ email: account.email, password: account.password });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeTypeOf('string');

    const cookies = response.headers['set-cookie'] as unknown as string[];
    const refreshCookie = cookies.find((cookie) => cookie.startsWith('refresh_token='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
  });

  it('Scenario: Wrong password', async () => {
    await signUp(account);

    const response = await signIn({ email: account.email, password: 'not the password' });

    expect(response.status).toBe(401);
  });

  it('Scenario: Unknown email tells nothing extra', async () => {
    await signUp(account);
    const wrongPassword = await signIn({ email: account.email, password: 'not the password' });

    const unknownEmail = await signIn({
      email: 'nobody@example.com',
      password: 'not the password',
    });

    expect(unknownEmail.status).toBe(401);
    // Identical down to the wording: any difference would answer the question
    // "does this person have an account here".
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });
});

describe('Requirement: A protected route needs a valid access token', () => {
  it('Scenario: Token missing', async () => {
    const response = await me();

    expect(response.status).toBe(401);
  });

  it('Scenario: Token tampered with', async () => {
    const { accessToken } = await register();
    // Same header and claims, one character off in the signature.
    const tampered = accessToken.slice(0, -1) + (accessToken.endsWith('a') ? 'b' : 'a');

    const response = await me(tampered);

    expect(response.status).toBe(401);
  });

  it('Scenario: Token expired', async () => {
    const { id } = await register();
    // Issued already expired, rather than waiting a quarter of an hour for it.
    const expired = await app.get(JwtService).signAsync({ sub: id }, { expiresIn: '-1s' });

    const response = await me(expired);

    expect(response.status).toBe(401);
  });

  it('Scenario: Signed-in user reaches the handler', async () => {
    const { id, accessToken } = await register();

    const response = await me(accessToken);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id,
      email: account.email,
      username: account.username,
    });
  });
});

describe('Requirement: A refresh token can be exchanged for a new pair', () => {
  async function signedIn() {
    await signUp(account);
    return signIn({ email: account.email, password: account.password });
  }

  it('Scenario: Pair exchanged', async () => {
    const first = await signedIn();

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie(first));

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeTypeOf('string');
    expect(refreshCookie(response)).not.toBe(refreshCookie(first));
  });

  it('Scenario: The used token stops working', async () => {
    const first = await signedIn();
    const cookie = refreshCookie(first);
    await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', cookie);

    const second = await request(app.getHttpServer()).post('/auth/refresh').set('Cookie', cookie);

    expect(second.status).toBe(401);
  });

  it('Scenario: Refresh token from the request body', async () => {
    const first = await signedIn();
    // The cookie's value alone, sent the way a native client without a cookie jar would.
    const token = refreshCookie(first).slice('refresh_token='.length);

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: token });

    expect(response.status).toBe(200);
  });

  it('Scenario: Unknown refresh token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'a token nobody ever issued' });

    expect(response.status).toBe(401);
  });
});

describe('Requirement: Access tokens can be verified without an HTTP request', () => {
  it('Scenario: Valid token resolves to its user', async () => {
    const { id, accessToken } = await register();

    // Called directly, with no request anywhere in sight - the way the chat
    // gateway will authenticate a handshake at step 6.
    const user = await app.get(AuthService).verifyAccessToken(accessToken);

    expect(user.id).toBe(id);
    expect(user.email).toBe(account.email);
  });

  it('Scenario: Invalid token is refused', async () => {
    const { accessToken } = await register();
    const tampered = accessToken.slice(0, -1) + (accessToken.endsWith('a') ? 'b' : 'a');

    await expect(app.get(AuthService).verifyAccessToken(tampered)).rejects.toThrow();
  });
});

describe('Requirement: An email is one address whatever its case', () => {
  it('Scenario: Case does not make a second account', async () => {
    await signUp(account);

    // A different username, so the 409 can only be about the address: the API
    // answers the same for either, and this has to isolate one of them.
    const response = await signUp({ ...account, email: 'Cher@Example.COM', username: 'cher2' });

    expect(response.status).toBe(409);
  });

  it('Scenario: Signing in ignores case', async () => {
    await signUp(account);

    const response = await signIn({ email: 'CHER@example.com', password: account.password });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
  });

  it('Scenario: Surrounding spaces are trimmed', async () => {
    const response = await signUp({ ...account, email: '  cher@example.com  ' });

    expect(response.status).toBe(201);

    // The obvious schema order validates before trimming and would have failed
    // above; this asserts the stored value, not only that the request got through.
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: response.body.id } });

    expect(stored.email).toBe('cher@example.com');
  });

  it('Scenario: Something that is not an address is still refused', async () => {
    const response = await signUp({ ...account, email: 'not-an-email' });

    expect(response.status).toBe(400);
  });
});
