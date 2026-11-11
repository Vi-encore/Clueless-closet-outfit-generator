import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import type { Env } from '../config/env.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { PasswordRoute } from '../throttling/password-route.decorator.js';
import { Public } from './public.decorator.js';
import { refreshRequestSchema, type RefreshRequest } from './requests/refresh.request.js';
import { signInRequestSchema, type SignInRequest } from './requests/sign-in.request.js';
import { signUpRequestSchema, type SignUpRequest } from './requests/sign-up.request.js';
import type { AccessTokenResponse, AccountView, TokenPair } from './auth.interfaces.js';
import { REFRESH_COOKIE, REFRESH_PATH } from './auth.constants.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** 201 is left as it is: signing up is the one route here that creates something. */
  @Public()
  @PasswordRoute()
  @Post('sign-up')
  signUp(@Body({ schema: signUpRequestSchema }) body: SignUpRequest): Promise<AccountView> {
    return this.auth.signUp(body);
  }

  @Public()
  @PasswordRoute()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body({ schema: signInRequestSchema }) body: SignInRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponse> {
    const tokens = await this.auth.signIn(body);
    this.sendRefreshCookie(response, tokens);

    return { accessToken: tokens.accessToken };
  }

  /**
   * Public, because the access token is exactly what the caller does not have by the
   * time they get here. The refresh token is the credential this route checks.
   */
  @Public()
  @PasswordRoute()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body({ schema: refreshRequestSchema }) body: RefreshRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponse> {
    const token = body.refreshToken ?? request.cookies?.[REFRESH_COOKIE];

    if (typeof token !== 'string') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.auth.refresh(token);
    this.sendRefreshCookie(response, tokens);

    return { accessToken: tokens.accessToken };
  }

  /**
   * Public, and for the same reason `refresh` is: somebody whose access token has just
   * expired is exactly who is most likely to be signing out. The credential this route
   * checks is the refresh token, which is also the thing it retires.
   */
  @Public()
  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signOut(
    @Body({ schema: refreshRequestSchema }) body: RefreshRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token = body.refreshToken ?? request.cookies?.[REFRESH_COOKIE];

    if (typeof token === 'string') {
      await this.auth.signOut(token);
    }

    // Cleared even when there was nothing to retire. The client asked to be signed
    // out, and a request that can fail would leave it unable to get there.
    response.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
  }

  @Get('me')
  me(@CurrentUser() user: AccountView): AccountView {
    return user;
  }

  /**
   * How the refresh cookie is addressed, in one place because clearing it has to
   * repeat every one of these: a browser matches a cookie by name, path and domain,
   * so a `clearCookie` that forgets the path leaves the original one sitting there.
   *
   * `httpOnly` keeps the token away from page scripts, and the narrow path keeps the
   * browser from attaching it to every other request.
   */
  private refreshCookieOptions(): CookieOptions {
    const sameSite = this.config.get('COOKIE_SAMESITE', { infer: true });

    return {
      httpOnly: true,
      // `lax` while the client and the API are the same site, `none` when the client
      // is served from somewhere else entirely - a `lax` cookie is not sent on a
      // cross-site request at all. See `COOKIE_SAMESITE` in config/env.ts.
      sameSite,
      // `none` implies this: browsers reject it without `Secure`. Otherwise it follows
      // the environment, because a secure cookie is simply dropped over plain http,
      // which would make it invisible in local development and in the tests.
      secure: sameSite === 'none' || this.config.get('NODE_ENV', { infer: true }) === 'production',
      path: REFRESH_PATH,
    };
  }

  private sendRefreshCookie(response: Response, tokens: TokenPair): void {
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.refreshCookieOptions(),
      expires: tokens.refreshTokenExpiresAt,
    });
  }
}
