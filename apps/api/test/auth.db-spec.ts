import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
