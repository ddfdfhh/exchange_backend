/*eslint-disable*/
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { jwtConstants } from 'src/constants/contants';
import { AuthService } from './auth.service';
@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(
   
     private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      secretOrKey: jwtConstants.refresh_token_secret,
    });
  }

  async validate(request: Request, payload: any) {
    //const refreshToken = request.cookies?.Refresh;
     return { userId: payload.sub, uuid: payload.uuid };
  }
}
