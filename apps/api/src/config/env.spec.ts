import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { envSchema, type Env } from './env.js';

/**
 * Loads the configuration the way `AppModule` does, but from the environment given here
 * and never from a local `.env` file, so the result cannot depend on one machine's setup.
 */
async function loadConfig(env: Record<string, string>): Promise<ConfigService<Env, true>> {
  Object.assign(process.env, env);

  const moduleRef = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ ignoreEnvFile: true, validationSchema: envSchema })],
  }).compile();

  return moduleRef.get(ConfigService);
}

/** Valid, and pointing at nothing: these tests never open a connection. */
const SOME_DATABASE_URL = 'postgresql://user:password@localhost:5432/database';

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  // Vitest sets NODE_ENV itself, and a validated config is written back into
  // process.env, so both settings start each test unset.
  delete process.env.PORT;
  delete process.env.NODE_ENV;
  // DATABASE_URL has no default, so every test needs one unless it is the thing
  // being tested.
  process.env.DATABASE_URL = SOME_DATABASE_URL;
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Requirement: Settings from the environment', () => {
  it('Scenario: Defaults', async () => {
    const config = await loadConfig({});

    expect(config.get('PORT', { infer: true })).toBe(3000);
    expect(config.get('NODE_ENV', { infer: true })).toBe('development');
  });

  it('Scenario: Port from the environment', async () => {
    const config = await loadConfig({ PORT: '4000' });

    expect(config.get('PORT', { infer: true })).toBe(4000);
  });

  it('Scenario: Database connection string missing', async () => {
    delete process.env.DATABASE_URL;

    await expect(loadConfig({})).rejects.toThrow(/DATABASE_URL/);
  });

  it('Scenario: Database connection string malformed', async () => {
    await expect(loadConfig({ DATABASE_URL: 'localhost:5432' })).rejects.toThrow(/DATABASE_URL/);
  });
});

describe('Requirement: Invalid settings stop startup', () => {
  it('Scenario: Port is not a number', async () => {
    await expect(loadConfig({ PORT: 'abc' })).rejects.toThrow(/PORT/);
  });

  it('Scenario: Unknown environment name', async () => {
    await expect(loadConfig({ NODE_ENV: 'staging' })).rejects.toThrow(/NODE_ENV/);
  });
});
