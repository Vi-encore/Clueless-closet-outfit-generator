import { z } from 'zod';

/**
 * The one definition of an email the API accepts, shared by sign-up and sign-in.
 *
 * Shared for the same reason `usernameSchema` is: a normalisation applied at sign-up
 * and forgotten at sign-in would be worse than none at all - the account would be
 * created under one spelling and refused under the other, with the sign-in form
 * saying only that the password is wrong.
 *
 * The order matters and is not the obvious one. Checks run as they are written, so
 * `z.email().trim()` would validate the raw string and reject an address padded with
 * spaces - which is exactly what a phone keyboard's autofill produces - before `trim`
 * ever ran. `.pipe()` puts the validation after the transforms, where it belongs.
 */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
