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

/** Whether the API refused this field, by its top-level name. */
export function refusedField(error: unknown, field: string): boolean {
  return (
    error instanceof ApiError &&
    error.fields.some((path) => path === field || path.startsWith(`${field}.`))
  );
}

export function hasStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}
