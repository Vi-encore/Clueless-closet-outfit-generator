import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { flagsFrom } from '../flags/flags.utils.js';
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
  // None of these has a default, so every test needs them unless they are the
  // thing being tested. The bucket and its credentials are deliberately among
  // them: a wrong-but-present value would have the API quietly reading and
  // writing somewhere nobody meant.
  process.env.DATABASE_URL = SOME_DATABASE_URL;
  process.env.JWT_SECRET = SOME_SECRET;
  process.env.S3_BUCKET = 'some-bucket';
  process.env.S3_ACCESS_KEY_ID = 'some-key';
  process.env.S3_SECRET_ACCESS_KEY = 'some-secret';
  delete process.env.S3_FORCE_PATH_STYLE;
  delete process.env.S3_UPLOAD_URL_TTL;
  delete process.env.S3_VIEW_URL_TTL;
  delete process.env.ACCESS_TOKEN_TTL;
  delete process.env.REFRESH_TOKEN_TTL;
  delete process.env.WEB_ORIGINS;
  delete process.env.COOKIE_SAMESITE;
  delete process.env.FEATURES_ON;
  delete process.env.FEATURES_OFF;
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

describe('Requirement: The storage is described by settings', () => {
  it('Scenario: Lifetimes default', async () => {
    const config = await loadConfig({});

    expect(config.get('S3_UPLOAD_URL_TTL', { infer: true })).toBe(300);
    expect(config.get('S3_VIEW_URL_TTL', { infer: true })).toBe(900);
  });

  it('Scenario: Addressing style defaults to path', async () => {
    const config = await loadConfig({});

    // A string in the environment, a boolean by the time anybody reads it:
    // `forcePathStyle` takes a boolean and `'false'` is a truthy string.
    expect(config.get('S3_FORCE_PATH_STYLE', { infer: true })).toBe(true);
  });

  it('Scenario: A lifetime that is not a number stops the application', async () => {
    await expect(loadConfig({ S3_UPLOAD_URL_TTL: 'soon' })).rejects.toThrow(/S3_UPLOAD_URL_TTL/);
  });
});

describe('Requirement: The origins a browser may call from are configured', () => {
  it('Scenario: Origins are read as a list', async () => {
    const config = await loadConfig({
      WEB_ORIGINS: 'http://localhost:5173, https://closet.pages.dev',
    });

    expect(config.get('WEB_ORIGINS', { infer: true })).toEqual([
      'http://localhost:5173',
      'https://closet.pages.dev',
    ]);
  });

  it('Scenario: Nothing is allowed by default', async () => {
    const config = await loadConfig({});

    expect(config.get('WEB_ORIGINS', { infer: true })).toEqual([]);
  });

  it('Scenario: A nonsense origin stops the application', async () => {
    await expect(loadConfig({ WEB_ORIGINS: 'localhost:5173' })).rejects.toThrow(/WEB_ORIGINS/);

    // Not pedantry: CORS compares the `Origin` header to this string exactly, so a
    // trailing slash is not a stricter rule - it is a rule that never matches.
    await expect(loadConfig({ WEB_ORIGINS: 'http://localhost:5173/' })).rejects.toThrow(
      /WEB_ORIGINS/,
    );
  });
});

describe('Requirement: A deployment switches flags in its settings', () => {
  /** The flags as the API will answer them, from the settings it was started with. */
  async function flagsWith(env: Record<string, string>) {
    const config = await loadConfig(env);

    return flagsFrom(
      config.get('FEATURES_ON', { infer: true }),
      config.get('FEATURES_OFF', { infer: true }),
    );
  }

  it('Scenario: Nothing set means the defaults', async () => {
    expect(await flagsWith({})).toEqual({ photoCutout: true });
  });

  it('Scenario: A flag is switched off', async () => {
    expect(await flagsWith({ FEATURES_OFF: 'photoCutout' })).toEqual({ photoCutout: false });
  });

  it('Scenario: An unknown flag stops startup', async () => {
    await expect(loadConfig({ FEATURES_OFF: 'photoCutout, teleport' })).rejects.toThrow(
      /FEATURES_OFF/,
    );
  });

  it('Scenario: A flag in both lists stops startup', async () => {
    await expect(
      loadConfig({ FEATURES_ON: 'photoCutout', FEATURES_OFF: 'photoCutout' }),
    ).rejects.toThrow(/photoCutout/);
  });
});
