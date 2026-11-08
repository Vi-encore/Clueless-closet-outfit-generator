/**
 * Two ids in a settled order, smaller first.
 *
 * Two uses, one rule. `Conversation` joins the sorted pair into `directKey`, so that
 * a unique index can promise one conversation per pair rather than one per pair in
 * each direction. `FriendsService` writes the two sides of a relation in this order,
 * so that two people acting at once take the rows' locks in the same order and wait
 * rather than deadlock (ADR-0016).
 *
 * Only the comparison is shared. How a caller uses the result stays with it.
 */
export function sortedPair(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}
