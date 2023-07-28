import { DatabaseService } from 'src/database/database.service';
import { User } from 'src/database/user/user.entity';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly dbService;
    private jwtService;
    constructor(dbService: DatabaseService, jwtService: JwtService);
    getCookieWithJwtAccessToken(user: User): string;
    getCookieWithJwtRefreshToken(user: User): string;
    signIn(email: string, pass: string): Promise<any>;
    signUp(signUpDto: any): Promise<User>;
    removeRefreshToken(id: number): Promise<any>;
    getUserIfRefreshTokenMatches(refreshToken: string, userId: number): Promise<User>;
}
