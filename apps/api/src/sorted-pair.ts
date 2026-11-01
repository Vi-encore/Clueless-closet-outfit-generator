/**
 * Two ids in a settled order, smaller first.
 *
 * Two tables identify a pair of people this way - `Friendship` by a pair of
 * columns, `Conversation` by one joined string - so that a unique index can
 * promise "one of these per pair" rather than "one per pair in this direction".
 * The comparison is the rule they share, and it lived in both services until it
 * had been written twice in two shapes.
 *
 * Only the comparison is shared. How a table spells the result stays with that
 * table: a module naming `Friendship`'s columns would be coupled to a model it
 * knows nothing else about.
 */
export function sortedPair(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}
