/*eslint-disable*/
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwtStrategy';
import { JwtRefreshTokenStrategy } from './jwtRefreshStrategy';
import { PassportModule } from '@nestjs/passport';
import { jwtConstants } from 'src/constants/contants';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.token_secret,
      signOptions: { expiresIn: jwtConstants.token_expiration },
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshTokenStrategy],
})
export class AuthModule {}
