import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importedPaths, isDeclarationFile } from '@closet/conventions';

const ROOT = join(import.meta.dirname, '..');
const SOURCE = join(ROOT, 'src');
const FEATURES = join(SOURCE, 'features');
const SHARED = join(SOURCE, 'shared');

/** Every file under `folder` with one of `extensions`, as paths from `folder` with forward slashes. */
function filesIn(folder: string, extensions: RegExp): string[] {
  if (!existsSync(folder)) {
    return [];
  }

  return readdirSync(folder, { recursive: true, encoding: 'utf8' })
    .map((file) => file.split(sep).join('/'))
    .filter((file) => extensions.test(file));
}

const code = [
  ...filesIn(SOURCE, /\.tsx?$/).map((file) => join(SOURCE, file)),
  ...filesIn(join(ROOT, 'test'), /\.tsx?$/).map((file) => join(ROOT, 'test', file)),
].filter((file) => !isDeclarationFile(file));

/** Where a relative import from `file` lands, or null for a package. */
function target(file: string, path: string): string | null {
  return path.startsWith('.') ? join(dirname(file), path) : null;
}

/** The first folder of `path` under `folder`, or null when it is not under it. */
function firstFolder(folder: string, path: string): string | null {
  const steps = relative(folder, path).split(sep);

  return steps[0] === '..' || steps.length < 2 ? null : (steps[0] ?? null);
}

/**
 * The client's own layout. The rules every package keeps, about shapes and `any`, are
 * checked for all of them at once in `packages/conventions`.
 */
describe("Requirement: The client's code is grouped by feature", () => {
  it('Scenario: A feature is reached through its index', () => {
    const features = existsSync(FEATURES) ? readdirSync(FEATURES) : [];
    const reachingIn = code
      .filter((file) => firstFolder(FEATURES, file) !== null)
      .flatMap((file) => {
        const own = firstFolder(FEATURES, file);

        return importedPaths(readFileSync(file, 'utf8'))
          .filter((path) => {
            const lands = target(file, path);

            if (lands === null) {
              return false;
            }

            // `../chat` and `../chat/index` are the front door; anything deeper is not.
            const [other, ...rest] = relative(FEATURES, lands).split(sep);
            const throughIndex = rest.length === 0 || (rest.length === 1 && rest[0] === 'index');

            return other !== '..' && other !== own && !throughIndex;
          })
          .map((path) => `${relative(SOURCE, file)} imports ${path}`);
      });

    expect(features).toEqual(
      expect.arrayContaining(['chat', 'desktop', 'friends', 'session', 'wardrobe']),
    );
    expect(reachingIn).toEqual([]);
  });

  it('Scenario: Shared code knows no feature', () => {
    const shared = code.filter((file) => !relative(SHARED, file).startsWith('..'));
    const knowing = shared.flatMap((file) =>
      importedPaths(readFileSync(file, 'utf8'))
        .filter((path) => {
          const lands = target(file, path);

          return lands !== null && ['features', 'app'].includes(firstFolder(SOURCE, lands) ?? '');
        })
        .map((path) => `${relative(SOURCE, file)} imports ${path}`),
    );

    expect(shared.map((file) => relative(SHARED, file).split(sep).join('/'))).toContain(
      'api/client.ts',
    );
    expect(knowing).toEqual([]);
  });

  it('Scenario: Every stylesheet is in the components layer', () => {
    const entry = readFileSync(join(SOURCE, 'index.css'), 'utf8');
    const sheets = filesIn(SOURCE, /\.css$/).filter((file) => file !== 'index.css');
    const unlayered = sheets.filter(
      (sheet) => !entry.includes(`@import './${sheet}' layer(components);`),
    );
    const importedByCode = code.flatMap((file) =>
      importedPaths(readFileSync(file, 'utf8'))
        .filter(
          (path) => path.startsWith('.') && path.endsWith('.css') && !path.endsWith('index.css'),
        )
        .map((path) => `${relative(SOURCE, file)} imports ${path}`),
    );

    expect(sheets).toContain('features/chat/chat.css');
    expect(unlayered).toEqual([]);
    expect(importedByCode).toEqual([]);
  });
});
