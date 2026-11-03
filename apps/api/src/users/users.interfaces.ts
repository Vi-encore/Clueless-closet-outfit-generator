/**
 * What anybody signed in may learn about anybody else.
 *
 * Deliberately smaller than `AccountView`: that one describes you to yourself and
 * carries your email. This one describes a stranger, and an email is the thing a
 * stranger has no business collecting.
 */
export interface PublicUser {
  id: string;
  username: string;
  displayName: string | null;
}
