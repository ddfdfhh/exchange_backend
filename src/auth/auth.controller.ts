/*eslint-disable*/
import { authenticator } from 'otplib';
import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Get,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  Req,
  Res,
  UploadedFiles,
  UnsupportedMediaTypeException,
  Inject,
  HttpException,
  Header,
  UnauthorizedException,
 
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { SignInDto } from 'src/dto/signin.dto';
import { SignUpDto } from 'src/dto/signUp.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import JwtRefreshGuard from './refresh.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Response } from 'express'
import { MulterError, diskStorage } from 'multer';
import { DatabaseService } from 'src/database/database.service';
import { ResponseMessage } from 'src/response_message.decorator';
import { jwtConstants } from 'src/constants/contants';
import { YesNo } from 'src/database/user/user.entity';
const  path =require('path');
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(DatabaseService) private readonly dbService: DatabaseService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Header('Access-Control-Allow-Credentials', 'true')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  @Header('Access-Control-Allow-Headers', 'Content-Type, Accept')
  @Post('login')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res() res: Response,
  ): Promise<any> {
    const { accessToken, refreshToken, user } = await this.authService.signIn(
      signInDto.email,
      signInDto.password,
    );
    var today = new Date();
    var tokenTime = new Date();
    tokenTime.setDate(today.getDate() + 1);
    var refeshTokenTime = new Date();
    refeshTokenTime.setDate(today.getDate() + 7);

    return res.send(
      JSON.stringify({
        success: true,
        message: '',
        data: {
          uuid: user.uuid,
          email: user.email,
          name: user.name,
          accessToken,
          refreshToken,
          is_two_fa_enabled: user.is_two_fa_enabled,
          id_verified: user.id_verified,
          logged_in_at: user.logged_in_at,
          email_verified: user.email_verified,
          accessTokenExpiration: tokenTime,
          refreshTokenExpiration: refeshTokenTime,
        },
      }),
    );
  }
  @HttpCode(HttpStatus.OK)
  @Post('register')
  async signUp(@Body() signpDto: SignUpDto) {
    const [existEmail, existPhone] = await Promise.all([
      this.dbService.existUserData({ email: signpDto.email }),
      this.dbService.existUserData({ phone_number: signpDto.phone_number }),
    ]);
    if (existEmail) {
      return { success: false, message: 'Email already  registered' };
    } else if (existPhone) {
      return { success: false, message: 'Phone Number already  registered' };
    }

    await this.authService.signUp(signpDto);
    return { success: true, message: 'Successfully registered' };
  }
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'adhar_front', maxCount: 1 },
        { name: 'adhar_back', maxCount: 1 },
        { name: 'pan', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: function (req, file, cb) {
            if (file.fieldname === 'adhar_front')
              cb(null, 'uploads/adhar/front');
            if (file.fieldname === 'adhar_back') cb(null, 'uploads/adhar/back');
            if (file.fieldname === 'pan') cb(null, 'uploads/pan');
          },

          filename: (req, file, cb) => {
            // Generating a 32 random chars long string
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            //Calling the callback passing the random name generated with the original extension name
            cb(null, `${randomName}${path.extname(file.originalname)}`);
          },
        }),

        limits: { fileSize: 170000 },
        fileFilter: function (_req, file, cb) {
          const filetypes = /jpeg|jpg|gif|png/;
          // Check ext
          const cur_Ext = path.extname(file.originalname);
          const extname = filetypes.test(cur_Ext);
          // Check mime
          const mimetype = filetypes.test(file.mimetype);

          if (mimetype && extname) {
            return cb(null, true);
          } else {
            return cb(
              new UnsupportedMediaTypeException(
                'Only jpeg,gif,png file are supported',
              ),
              false,
            );
          }
        },
      },
    ),
  )
  async uploadFile(
    @UploadedFiles()
    files: {
      adhar_front?: Express.Multer.File[];
      adhar_back?: Express.Multer.File[];
      pan?: Express.Multer.File[];
    },
    @Body() post: Record<string, any>,
    @Request() req,
  ) {
    console.log('files', files);
    const adhar_front =
      files.adhar_front !== undefined && files.adhar_front[0]
        ? files.adhar_front[0]['filename']
        : null;
    const adhar_back =
      files.adhar_back !== undefined && files.adhar_back[0]
        ? files.adhar_back[0]['filename']
        : null;
    const pan =
      files.pan !== undefined && files.pan[0] ? files.pan[0]['filename'] : null;
    const selfie = post['selfie'] === undefined ? null : post['selfie'];
    console.log('selfie', selfie);
    const y = await this.dbService.existUserData({ id: req.user.userId });

    if (!y) {
      throw new HttpException('user Not found', 500);
    }
    const pic = { front_path: adhar_front, back_path: adhar_back, pan, selfie };
    const data = { ...post, ...pic };
    data['user_id'] = req.user.userId;
    await this.dbService.updateIdentity(data as any);

    return {
      success: true,
      message: 'Document succesfully uploaded',
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = req.user;
    const existuser = await this.dbService.existUserData({
      id: user.id,
      uuid: user.uuid,
    });
    if (!existuser) {
      throw new UnauthorizedException('Access denied');
    }
    return { success: true, message: '', data: existuser };
  }
  @UseGuards(JwtAuthGuard)
  @Post('changePassword')
  async changePassword(@Body() post: Partial<SignUpDto>, @Request() req) {
    const salt = await bcrypt.genSalt();
    const data = {
      zasper_id: post.password,
      password: await bcrypt.hash(post.password, salt),
    };
    return await this.dbService.updateUser(req.user.uuid, data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('changeEmail')
  async changeEmail(@Body() post: Partial<SignUpDto>, @Request() req) {
    const y = await this.dbService.existUserData({ email: post.email });

    if (y) {
      throw new HttpException('Email aready exist', 500);
    }
    await this.dbService.updateUser(req.user.uuid, { email: post.email });

    return {
      statusCode: 200,
      message: 'Email succesfully updated',
      data: null,
    };
  }
  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@Req() request: any) {
    const accessToken = this.authService.getCookieWithJwtAccessToken(
      request.user,
    );

    // request.res.setHeader('Set-Cookie', accessTokenCookie);
    return { success: true, message: '', data: accessToken };
  }
  @UseGuards(JwtAuthGuard)
  @Post('log-out')
  @HttpCode(200)
  async logOut(@Req() request: any) {
    const logoutCookie = [
      'Authentication=; HttpOnly; Path=/; Max-Age=0',
      'Refresh=; HttpOnly; Path=/; Max-Age=0',
    ];
    await this.authService.removeRefreshToken(request.user.id);
    request.res.setHeader('Set-Cookie', logoutCookie);
  }

  @Post('2fa/turn-on')
  @UseGuards(JwtAuthGuard)
  async turnOnTwoFactorAuthentication(
    @Body() post: Record<string, any>,
    @Req() req,
  ) {
    let secret = post.secret;
    let otp = post.otp;
 const verify_resp = authenticator.verify({
   token:otp,
   secret,
 });
    console.log('ddd', req.user.userId);
    if (verify_resp) {
      await this.dbService.updateUserById(req.user.userId, {
        twofa_secret: secret,
        is_two_fa_enabled: YesNo.YES,
      });
      return { success: true, message: 'Two FA enabled Successfully' };
    }
    else
    return { success: false, message: 'Otp is expired or wrong' };
  }
  @Post('2fa/verify') 
  @UseGuards(JwtAuthGuard)
  async verifyTwoFaCode(@Body() post, @Req() req) {
    const userInfo = await this.dbService.findUserById(req.user.userId)
    const secret = userInfo.twofa_secret
    console.log('rere', {
      token: post.otp,
      secret,
      userInfo,
    });
    const resp=authenticator.verify({
      token: post.otp,
      secret
    });
    if (resp)
      return { success: true, message: 'Logged In successfully' };
     else return { success: false, message: 'Otp is expired or wrong' };
  }
}
