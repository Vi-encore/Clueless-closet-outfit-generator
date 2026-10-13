import { Body, Controller, Post } from '@nestjs/common';
import { AuthService, type AccountView } from './auth.service.js';
import { signUpRequestSchema, type SignUpRequest } from './requests/sign-up.request.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** 201 is left as it is: signing up is the one route here that creates something. */
  @Post('sign-up')
  signUp(@Body({ schema: signUpRequestSchema }) body: SignUpRequest): Promise<AccountView> {
    return this.auth.signUp(body);
  }
}
