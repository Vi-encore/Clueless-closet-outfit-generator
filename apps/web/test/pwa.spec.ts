import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pwaOptions } from '../vite.pwa';

const options = pwaOptions();

describe('Requirement: The client declares itself installable', () => {
  it('Scenario: The manifest says what the app is', () => {
    const manifest = options.manifest;

    if (manifest === false || manifest === undefined) {
      throw new Error('no manifest');
    }

    expect(manifest.name).toBe('Clueless Closet');
    expect(manifest.short_name).toBe('Closet');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');

    const icons = manifest.icons ?? [];
    expect(icons.some(({ sizes }) => sizes === '192x192')).toBe(true);
    expect(icons.some(({ sizes, purpose }) => sizes === '512x512' && purpose !== 'maskable')).toBe(
      true,
    );
    expect(icons.some(({ purpose }) => purpose === 'maskable')).toBe(true);
  });

  it('Scenario: The page points at the manifest and the Apple icon', () => {
    const page = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf8');

    // The manifest's link is written into the built page by the plugin.
    expect(options.injectManifest ?? options.manifest).toBeTruthy();
    expect(page).toMatch(
      /<link rel="apple-touch-icon"[^>]*href="\/icons\/apple-touch-icon-180\.png"/,
    );
    expect(page).toMatch(/<meta name="theme-color"/);
  });
});

describe('Requirement: The shell is cached and server data never is', () => {
  it('Scenario: The built client is precached', () => {
    const patterns = options.workbox?.globPatterns ?? [];

    for (const kind of ['js', 'css', 'html', 'png']) {
      expect(patterns.some((pattern) => pattern.includes(kind))).toBe(true);
    }
  });

  it('Scenario: The API and the photos go to the network', () => {
    const denied = options.workbox?.navigateFallbackDenylist ?? [];
    const answeredFromCache = (path: string) => !denied.some((rule) => rule.test(path));

    expect(options.workbox?.navigateFallback).toBe('index.html');
    expect(answeredFromCache('/api/auth/refresh')).toBe(false);
    expect(answeredFromCache('/storage/closet-photos/a.webp')).toBe(false);
    expect(answeredFromCache('/wardrobe')).toBe(true);
    expect(options.workbox?.runtimeCaching ?? []).toEqual([]);
  });
});
