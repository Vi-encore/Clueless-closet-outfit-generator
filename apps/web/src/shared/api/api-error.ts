/** The API answered, and the answer was not a success. A network failure is not this. */
export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`The API answered ${status}`);
    this.name = 'ApiError';
  }
}

export function hasStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}
