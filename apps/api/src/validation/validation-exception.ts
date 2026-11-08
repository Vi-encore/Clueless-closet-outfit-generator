import { BadRequestException, HttpStatus } from '@nestjs/common';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ValidationError } from './validation.interfaces.js';

/**
 * A Standard Schema issue points at a field with an array of segments, each either a key
 * or an object wrapping one. Joining them with dots gives a path a client can read and
 * map back to its own form: `items.0.type`.
 */
function formatPath(path: StandardSchemaV1.Issue['path']): string {
  return (path ?? [])
    .map((segment) => String(typeof segment === 'object' ? segment.key : segment))
    .join('.');
}

/**
 * Turns the issues a schema reports into one 400 response that lists every invalid field
 * at once, so a form can mark all of them in a single round trip instead of revealing them
 * one at a time.
 */
export function validationException(
  issues: readonly StandardSchemaV1.Issue[],
): BadRequestException {
  const errors: ValidationError[] = issues.map((issue) => ({
    path: formatPath(issue.path),
    message: issue.message,
  }));

  return new BadRequestException({
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Validation failed',
    errors,
  });
}
