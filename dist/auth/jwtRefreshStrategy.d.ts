import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from './auth.service';
declare const JwtRefreshTokenStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtRefreshTokenStrategy extends JwtRefreshTokenStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(request: Request, payload: any): Promise<{
        userId: any;
        uuid: any;
    }>;
}
export {};
