/**
 * The checks behind the repository's conventions (ADR-0015), run over every package by
 * `conventions.test.ts` beside this file, and over the client's layout by its own test.
 *
 * Text in, findings out: reading files is the caller's business, so this module needs
 * nothing from Node and the client can import it as it is.
 *
 * It reads the source as text rather than parsing it. TypeScript 7 has no stable parser
 * API, and the rules are narrow enough for patterns once comments and strings are blanked,
 * so that a sentence about `any` is not a use of it. A finding is `line: text`, which is
 * what a person fixing it needs.
 */

const INTERFACE = /^[ \t]*(?:export[ \t]+)?(?:declare[ \t]+)?interface[ \t]+\w+/gm;
const ALIAS = /^[ \t]*(?:export[ \t]+)?(?:declare[ \t]+)?type[ \t]+\w+[^=;\n]*=([\s\S]*?);/gm;

/** The places an object type can be written where it is used, rather than named. */
const INLINE = [
  // ({ name }: { name: string })
  /\}:\s*\{/g,
  // (options: { name: string })
  /\(\s*\w+\??:\s*\{/g,
  // f(): { name: string }
  /\):\s*\{/g,
  // const value: { name: string } = ...
  /\b(?:const|let|var)\s+\w+\s*:\s*\{/g,
  // state as { name?: string }
  /\b(?:as|satisfies)\s+\{/g,
  // useState<{ name: string }>()
  /<\s*\{/g,
];

const ANY = [/(?::|\bas|<|,|\||&)\s*any\b/g, /\bany\s*\[\]/g];

const IMPORT = /(?:\bfrom|\bimport)\s*\(?\s*(['"])/g;

/**
 * Replaces comments, and the insides of strings and template literals, with spaces.
 *
 * Line breaks and quote marks stay, so that every offset still points at the same place
 * in the original and a string still reads as a string.
 */
export function blankCommentsAndStrings(source: string): string {
  const out = source.split('');
  const blank = (from: number, to: number) => {
    for (let i = from; i < to; i++) {
      if (out[i] !== '\n') {
        out[i] = ' ';
      }
    }
  };
  let i = 0;

  while (i < source.length) {
    const two = source.slice(i, i + 2);
    const char = source[i];

    if (two === '//') {
      const end = source.indexOf('\n', i);
      const stop = end === -1 ? source.length : end;
      blank(i, stop);
      i = stop;
    } else if (two === '/*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      blank(i, stop);
      i = stop;
    } else if (char === "'" || char === '"' || char === '`') {
      const stop = endOfLiteral(source, i);
      blank(i + 1, stop - 1);
      i = stop;
    } else {
      i += 1;
    }
  }

  return out.join('');
}

/** Where the literal opening at `start` ends, one past its closing quote. */
function endOfLiteral(source: string, start: number): number {
  const quote = source[start];
  let depth = 0;
  let i = start + 1;

  while (i < source.length) {
    const char = source[i];

    if (char === '\\') {
      i += 2;
      continue;
    }

    if (quote === '`' && source.slice(i, i + 2) === '${') {
      depth += 1;
      i += 2;
      continue;
    }

    if (depth > 0) {
      depth += char === '{' ? 1 : char === '}' ? -1 : 0;
    } else if (char === quote || (char === '\n' && quote !== '`')) {
      return i + 1;
    }

    i += 1;
  }

  return source.length;
}

function lineAt(source: string, offset: number): string {
  const start = source.lastIndexOf('\n', offset - 1) + 1;
  const end = source.indexOf('\n', offset);
  const number = source.slice(0, offset).split('\n').length;

  return `${number}: ${source.slice(start, end === -1 ? undefined : end).trim()}`;
}

function findAll(source: string, blanked: string, patterns: RegExp[]): string[] {
  return patterns
    .flatMap((pattern) => [...blanked.matchAll(pattern)].map((match) => match.index))
    .sort((a, b) => a - b)
    .map((offset) => lineAt(source, offset));
}

/** A type alias computed from a value, which may stay beside that value. */
function isDerived(alias: RegExpMatchArray): boolean {
  return /\btypeof\b/.test(alias[1] ?? '');
}

/** Interfaces, and type aliases written by hand: everything that belongs in an interfaces file. */
export function declaredShapes(source: string): string[] {
  const blanked = blankCommentsAndStrings(source);
  const interfaces = [...blanked.matchAll(INTERFACE)].map((match) => match.index);
  const aliases = [...blanked.matchAll(ALIAS)]
    .filter((alias) => !isDerived(alias))
    .map((alias) => alias.index);

  return [...interfaces, ...aliases].sort((a, b) => a - b).map((offset) => lineAt(source, offset));
}

/** Object types spelled out where they are used rather than named. */
export function inlineObjectTypes(source: string): string[] {
  // A derived alias may hold one, as in `GetPayload<{ include: typeof rows }>`.
  const blanked = blankCommentsAndStrings(source).replace(ALIAS, (alias, right: string) =>
    /\btypeof\b/.test(right) ? alias.replace(/[^\n]/g, ' ') : alias,
  );

  return findAll(source, blanked, INLINE);
}

/** `any` in a type position. */
export function anyTypes(source: string): string[] {
  return findAll(source, blankCommentsAndStrings(source), ANY);
}

/** The module named by each import, `export … from`, and dynamic import. */
export function importedPaths(source: string): string[] {
  const blanked = blankCommentsAndStrings(source);

  return [...blanked.matchAll(IMPORT)].map((match) => {
    const open = match.index + match[0].length;
    const close = source.indexOf(match[1] ?? "'", open);

    return source.slice(open, close);
  });
}

/** Where shapes belong. Declaration files describe what exists elsewhere, so they are left alone. */
export function isInterfacesFile(path: string): boolean {
  return path.endsWith('.interfaces.ts');
}

export function isDeclarationFile(path: string): boolean {
  return path.endsWith('.d.ts');
}
