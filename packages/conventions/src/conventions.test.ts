import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  anyTypes,
  declaredShapes,
  inlineObjectTypes,
  isDeclarationFile,
  isInterfacesFile,
} from './conventions.js';

const REPOSITORY = join(import.meta.dirname, '..', '..', '..');

/** Where each package keeps code a person writes. Generated code is left out below. */
const FOLDERS = [
  'packages/core/src',
  'packages/conventions/src',
  'apps/api/src',
  'apps/api/test',
  'apps/web/src',
  'apps/web/test',
];

/** Every TypeScript file in the repository's own code, from the repository root. */
const code = FOLDERS.flatMap((folder) => {
  const absolute = join(REPOSITORY, folder);

  return existsSync(absolute)
    ? readdirSync(absolute, { recursive: true, encoding: 'utf8' }).map(
        (file) => `${folder}/${file.split(sep).join('/')}`,
      )
    : [];
})
  .filter((file) => /\.tsx?$/.test(file) && !isDeclarationFile(file))
  .filter((file) => !file.split('/').includes('generated'));

/** `finder`'s findings in every file it applies to, named by file, so a failure says where. */
function everywhere(finder: (source: string) => string[], files = code): string[] {
  return files.flatMap((file) =>
    finder(readFileSync(join(REPOSITORY, file), 'utf8')).map((found) => `${file}:${found}`),
  );
}

const outsideInterfaces = () => code.filter((file) => !isInterfacesFile(file));

describe('Requirement: Shapes are named in interfaces files', () => {
  it('Scenario: A shape is declared in an interfaces file', () => {
    // Guards the guard: a wrong path finds no files, no files means no findings, and
    // the test would pass for ever. One known file in every package.
    expect(code).toEqual(
      expect.arrayContaining([
        'packages/core/src/index.ts',
        'apps/api/src/main.ts',
        'apps/web/src/main.tsx',
      ]),
    );
    expect(everywhere(declaredShapes, outsideInterfaces())).toEqual([]);
  });

  it('Scenario: No object type is written inline', () => {
    expect(everywhere(inlineObjectTypes, outsideInterfaces())).toEqual([]);
  });
});

describe('Requirement: Nothing is typed any', () => {
  it('Scenario: No source says any', () => {
    expect(everywhere(anyTypes)).toEqual([]);
  });
});
