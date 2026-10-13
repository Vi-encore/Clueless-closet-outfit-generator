import type { INestApplication } from '@nestjs/common';
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
