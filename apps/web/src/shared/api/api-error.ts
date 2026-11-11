/** The API answered, and the answer was not a success. A network failure is not this. */
export class ApiError extends Error {
  /**
   * @param fields Where a 400 from validation says what was wrong, the paths it named
   * (`username`, `materials.0.percent`); empty for anything else.
   */
  constructor(
    readonly status: number,
    readonly fields: readonly string[] = [],
  ) {
    super(`The API answered ${status}`);
    this.name = 'ApiError';
  }
}
