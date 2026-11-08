import type { INestApplication } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import type { AnswerRow, CountRow } from './test.interfaces.js';

/** A client of its own, so it can watch the application's connections from outside. */
let observer: PrismaClient;
let app: INestApplication;
let baseline: number;

/** How many backends this database is serving right now. */
async function connectionCount(): Promise<number> {
  const rows = await observer.$queryRaw<CountRow[]>`
    SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()
  `;
  return Number(rows[0]?.count ?? 0);
}

/** PostgreSQL retires a backend shortly after the client goes away, not instantly. */
async function waitForCount(atMost: number): Promise<number> {
  let count = await connectionCount();
  for (let attempt = 0; attempt < 50 && count > atMost; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    count = await connectionCount();
  }
  return count;
}

beforeAll(async () => {
  observer = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  // Counted before the application exists, so the observer's own connections and
  // anything else attached to this database cannot be mistaken for the application's.
  baseline = await connectionCount();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  await app.init();
});

afterAll(async () => {
  await observer.$disconnect();
});

describe('Requirement: The connection is opened and closed with the application', () => {
  it('Scenario: Connected after startup', async () => {
    const prisma = app.get(PrismaService);

    const rows = await prisma.$queryRaw<AnswerRow[]>`SELECT 1 AS answer`;

    expect(rows[0]?.answer).toBe(1);
    expect(await connectionCount()).toBeGreaterThan(baseline);
  });

  it('Scenario: Closed on shutdown', async () => {
    await app.close();

    expect(await waitForCount(baseline)).toBe(baseline);
  });
});
