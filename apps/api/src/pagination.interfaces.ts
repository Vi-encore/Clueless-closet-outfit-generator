/** A slice of a list, and where the next one starts. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * What the two walks below hand to `findMany`.
 *
 * Spelled out rather than inferred so that both have the same type: a caller
 * choosing between them spreads the result of a ternary, and two shapes whose
 * sort direction is a literal cannot be spread together.
 */
export interface PageArgs {
  orderBy: Array<{ createdAt: 'asc' | 'desc' } | { id: 'asc' | 'desc' }>;
  take: number;
  cursor?: { id: string };
  skip?: number;
}
