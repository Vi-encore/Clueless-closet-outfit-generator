/** One invalid field: where it is in the body, and what is wrong with it. */
export interface ValidationError {
  path: string;
  message: string;
}
