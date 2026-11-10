import { ApiError } from './api-error';

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
