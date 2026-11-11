/** The unique key of the record one person holds about another. */
export function sideOf(userId: string, otherUserId: string) {
  return { userId_otherUserId: { userId, otherUserId } };
}
