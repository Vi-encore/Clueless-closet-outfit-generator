/**
 * The form of a Ukrainian noun for a count: one (1, 21, 101), few (2-4, 22-24) or many
 * (0, 5-20, 25-30, 111-114). The last two digits decide, and eleven to fourteen are
 * always many, whatever their last digit says.
 */
export function pluralUk(count: number, one: string, few: string, many: string): string {
  const lastTwo = Math.abs(count) % 100;
  const last = lastTwo % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return many;
  }

  if (last === 1) {
    return one;
  }

  return last >= 2 && last <= 4 ? few : many;
}
