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

/** Long enough to pass, and obviously not a real one. */
const SOME_SECRET = 'a'.repeat(32);

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  // Vitest sets NODE_ENV itself, and a validated config is written back into
  // process.env, so both settings start each test unset.
  delete process.env.PORT;
  delete process.env.NODE_ENV;
  // Neither of these has a default, so every test needs them unless they are the
  // thing being tested.
  process.env.DATABASE_URL = SOME_DATABASE_URL;
  process.env.JWT_SECRET = SOME_SECRET;
  delete process.env.ACCESS_TOKEN_TTL;
  delete process.env.REFRESH_TOKEN_TTL;
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

describe('Requirement: Token settings', () => {
  it('Scenario: Lifetimes default', async () => {
    const config = await loadConfig({});

    expect(config.get('ACCESS_TOKEN_TTL', { infer: true })).toBe(15 * 60);
    expect(config.get('REFRESH_TOKEN_TTL', { infer: true })).toBe(30 * 24 * 60 * 60);
  });

  it('Scenario: Secret missing', async () => {
    delete process.env.JWT_SECRET;

    await expect(loadConfig({})).rejects.toThrow(/JWT_SECRET/);
  });

  it('Scenario: Secret too short', async () => {
    await expect(loadConfig({ JWT_SECRET: 'short' })).rejects.toThrow(/JWT_SECRET/);
  });
});

describe('Requirement: The limits and the proxy are settings', () => {
  it('Scenario: Limits default', async () => {
    const config = await loadConfig({});

    expect(config.get('RATE_LIMIT_TTL', { infer: true })).toBe(60);
    expect(config.get('RATE_LIMIT_MAX', { infer: true })).toBe(120);
    expect(config.get('AUTH_RATE_LIMIT_MAX', { infer: true })).toBe(10);
  });

  it('Scenario: Nothing is trusted by default', async () => {
    const config = await loadConfig({});

    // Zero, not one: believing a proxy that is not there lets anyone forge
    // `X-Forwarded-For` and walk around the limit entirely.
    expect(config.get('TRUST_PROXY', { infer: true })).toBe(0);
  });

  it('Scenario: A limit that is not a number stops the application', async () => {
    await expect(loadConfig({ RATE_LIMIT_MAX: 'plenty' })).rejects.toThrow(/RATE_LIMIT_MAX/);
  });
});
