import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  anyTypes,
  crowdedFiles,
  declaredShapes,
  exportsMixedWithConstants,
  inlineObjectTypes,
  isDeclarationFile,
  isInterfacesFile,
  isTestFile,
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

/** The code a person ships: tests and the fixtures they read are left to their own habits. */
const outsideTests = () => code.filter((file) => !isTestFile(file));

/** Like `everywhere`, for a check that also needs to know the file's name. */
function everywhereByPath(finder: (source: string, path: string) => string[]): string[] {
  return outsideTests().flatMap((file) =>
    finder(readFileSync(join(REPOSITORY, file), 'utf8'), file).map((found) => `${file}:${found}`),
  );
}

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

describe('Requirement: A component, hook or class has its file to itself', () => {
  it('Scenario: No component, hook or class shares its file', () => {
    expect(everywhereByPath(crowdedFiles)).toEqual([]);
  });

  it('Scenario: A helper beside a component is found', () => {
    const source = [
      "import { uk } from './uk';",
      '',
      '/** The name a person reads. */',
      'function nameOf(item: Item): string {',
      '  return item.name ?? uk.unnamed;',
      '}',
      '',
      'export function Card({ item }: CardProps) {',
      '  const shown = nameOf(item);',
      '',
      '  return <p>{shown}</p>;',
      '}',
    ].join('\n');

    expect(crowdedFiles(source, 'card.tsx')).toEqual(['4: function nameOf(item: Item): string {']);
  });

  it('Scenario: A file of one class passes', () => {
    const source = [
      "import { Injectable } from '@nestjs/common';",
      '',
      '@Injectable()',
      'export class FriendsService {',
      '  constructor(private readonly prisma: PrismaService) {}',
      '',
      '  list(me: string) {',
      '    const rows = this.prisma.friendship.findMany({ where: { userId: me } });',
      '',
      '    return rows;',
      '  }',
      '}',
    ].join('\n');

    expect(crowdedFiles(source, 'friends.service.ts')).toEqual([]);
  });
});

describe('Requirement: Exported constants live apart from logic', () => {
  it('Scenario: No file exports constants beside logic', () => {
    expect(everywhereByPath(exportsMixedWithConstants)).toEqual([]);
  });

  it('Scenario: The check knows a constant from a function', () => {
    const source = [
      "export const SLOTS = ['top', 'bottom'] as const;",
      '',
      'export const Public = () => SetMetadata(IS_PUBLIC, true);',
    ].join('\n');
    // The spelling that hides an arrow best: a typed name and a parameter list over lines.
    const typed = [
      "export const DOCS_PATH = 'docs';",
      '',
      'export const converter: StandardSchemaConverter = (',
      '  schema,',
      '  { schemaType },',
      ') => schemaType;',
    ].join('\n');

    expect(exportsMixedWithConstants(source)).toEqual([
      "1: export const SLOTS = ['top', 'bottom'] as const;",
    ]);
    expect(exportsMixedWithConstants(typed)).toEqual(["1: export const DOCS_PATH = 'docs';"]);
  });

  it('Scenario: A constants file passes', () => {
    const source = [
      'export const SessionContext = createContext<Session | null>(null);',
      '',
      'export const nameSchema = z.object({ name: z.string().transform((name) => name.trim()) });',
      '',
      "export const SLOTS = ['top', 'bottom'] as const;",
      '',
      'export const itemKeys = {',
      "  all: ['items'] as const,",
      '  one: (id: string) => [...itemKeys.all, id] as const,',
      '};',
    ].join('\n');

    expect(exportsMixedWithConstants(source)).toEqual([]);
  });
});
