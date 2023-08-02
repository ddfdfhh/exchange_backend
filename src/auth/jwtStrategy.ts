/*eslint-disable*/
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from '../constants/contants';
import { Request } from 'express';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
     
      secretOrKey: jwtConstants.token_secret,
      
    });
  }

  async validate(payload: any) {
  
    /***jwt gives extracted jwt payload here that payload was enrcytped when generating jwt same you get ,
     * any return from this function will be req.user value in controller *********/
    return { userId: payload.sub, uuid: payload.uuid }
   
  
  
   
  }
  
}
