/** What the API is willing to say about an account. Notably, not its hash. */
export interface AccountView {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

/** The claims an access token carries. `sub` is the convention for "who this is". */
export interface AccessTokenPayload {
  sub: string;
}

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

/** What signing in and refreshing answer with. The refresh token travels as a cookie. */
export interface AccessTokenResponse {
  accessToken: string;
}

/** A request once the JWT strategy has put the person on it. */
export interface AuthenticatedRequest {
  user: AccountView;
}
