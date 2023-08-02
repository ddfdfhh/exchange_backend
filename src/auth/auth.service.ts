/*eslint-disable*/

import { HttpException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { User } from 'src/database/user/user.entity';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from 'src/constants/contants';
@Injectable()
export class AuthService {
  constructor(
    @Inject(DatabaseService) private readonly dbService: DatabaseService,
    private jwtService: JwtService,
  ) {}
  public getCookieWithJwtAccessToken(user: User) {
    
    const payload = { sub: user.id, uuid: user.uuid };
    const token = this.jwtService.sign(payload, {
      secret: jwtConstants.token_secret,
      expiresIn: jwtConstants.token_expiration,
    });
    return token;
  }

  public getCookieWithJwtRefreshToken(user: User) {
    const payload = { sub: user.id, uuid: user.uuid };
    const token = this.jwtService.sign(payload, {
      secret: jwtConstants.refresh_token_secret,
      expiresIn: jwtConstants.refresh_token_expiration,
    });
    const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${jwtConstants.refresh_token_expiration}`;
    return token;
  }
  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.dbService.findUser(email);
     if (!user) {
       throw new HttpException('Invalid login credentials',401);
     }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new HttpException('Invalid login credentials', 401);
    }
    const accessToken = this.getCookieWithJwtAccessToken(user);
    const refreshToken = this.getCookieWithJwtRefreshToken(user);
    await this.dbService.updateUserById(user.id, {logged_in_at:new Date()});
    await this.dbService.setCurrentRefreshToken(refreshToken, user.id);
 
    return { accessToken, refreshToken, user };
  }
  async signUp(signUpDto): Promise<User> {
    
      return await this.dbService.saveUser(signUpDto as User);
  }
  async removeRefreshToken(id:number): Promise<any> {
    return await this.dbService.removeRefreshToken(id);
  }
  async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
    const user = await this.dbService.findUserById(userId);

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }
  }
}
