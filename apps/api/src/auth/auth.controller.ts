import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { Env } from '../config/env.js';
import { AuthService, type AccountView, type TokenPair } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { Public } from './public.decorator.js';
import { signInRequestSchema, type SignInRequest } from './requests/sign-in.request.js';
import { signUpRequestSchema, type SignUpRequest } from './requests/sign-up.request.js';

/** The cookie the refresh token travels in, and the only path that ever receives it. */
export const REFRESH_COOKIE = 'refresh_token';
export const REFRESH_PATH = '/auth/refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** 201 is left as it is: signing up is the one route here that creates something. */
  @Public()
  @Post('sign-up')
  signUp(@Body({ schema: signUpRequestSchema }) body: SignUpRequest): Promise<AccountView> {
    return this.auth.signUp(body);
  }

  @Public()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body({ schema: signInRequestSchema }) body: SignInRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.auth.signIn(body);
    this.sendRefreshCookie(response, tokens);

    return { accessToken: tokens.accessToken };
  }

  @Get('me')
  me(@CurrentUser() user: AccountView): AccountView {
    return user;
  }

  /**
   * `httpOnly` keeps the token away from page scripts, and the narrow path keeps the
   * browser from attaching it to every other request. `secure` follows the
   * environment: a secure cookie is simply dropped over plain http, which would make
   * it invisible in local development and in the tests.
   */
  private sendRefreshCookie(response: Response, tokens: TokenPair): void {
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      path: REFRESH_PATH,
      expires: tokens.refreshTokenExpiresAt,
    });
  }
}
