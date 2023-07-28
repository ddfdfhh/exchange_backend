"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const otplib_1 = require("otplib");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const auth_service_1 = require("./auth.service");
const signin_dto_1 = require("../dto/signin.dto");
const signUp_dto_1 = require("../dto/signUp.dto");
const platform_express_1 = require("@nestjs/platform-express");
const refresh_guard_1 = require("./refresh.guard");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const multer_1 = require("multer");
const database_service_1 = require("../database/database.service");
const user_entity_1 = require("../database/user/user.entity");
const path = require('path');
let AuthController = class AuthController {
    constructor(authService, dbService) {
        this.authService = authService;
        this.dbService = dbService;
    }
    async signIn(signInDto, res) {
        const { accessToken, refreshToken, user } = await this.authService.signIn(signInDto.email, signInDto.password);
        var today = new Date();
        var tokenTime = new Date();
        tokenTime.setDate(today.getDate() + 1);
        var refeshTokenTime = new Date();
        refeshTokenTime.setDate(today.getDate() + 7);
        return res.send(JSON.stringify({
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
        }));
    }
    async signUp(signpDto) {
        const [existEmail, existPhone] = await Promise.all([
            this.dbService.existUserData({ email: signpDto.email }),
            this.dbService.existUserData({ phone_number: signpDto.phone_number }),
        ]);
        if (existEmail) {
            return { success: false, message: 'Email already  registered' };
        }
        else if (existPhone) {
            return { success: false, message: 'Phone Number already  registered' };
        }
        await this.authService.signUp(signpDto);
        return { success: true, message: 'Successfully registered' };
    }
    async uploadFile(files, post, req) {
        console.log('files', files);
        const adhar_front = files.adhar_front !== undefined && files.adhar_front[0]
            ? files.adhar_front[0]['filename']
            : null;
        const adhar_back = files.adhar_back !== undefined && files.adhar_back[0]
            ? files.adhar_back[0]['filename']
            : null;
        const pan = files.pan !== undefined && files.pan[0] ? files.pan[0]['filename'] : null;
        const selfie = post['selfie'] === undefined ? null : post['selfie'];
        console.log('selfie', selfie);
        const y = await this.dbService.existUserData({ id: req.user.userId });
        if (!y) {
            throw new common_1.HttpException('user Not found', 500);
        }
        const pic = { front_path: adhar_front, back_path: adhar_back, pan, selfie };
        const data = Object.assign(Object.assign({}, post), pic);
        data['user_id'] = req.user.userId;
        await this.dbService.updateIdentity(data);
        return {
            success: true,
            message: 'Document succesfully uploaded',
            data: null,
        };
    }
    async getProfile(req) {
        const user = req.user;
        const existuser = await this.dbService.existUserData({
            id: user.id,
            uuid: user.uuid,
        });
        if (!existuser) {
            throw new common_1.UnauthorizedException('Access denied');
        }
        return { success: true, message: '', data: existuser };
    }
    async changePassword(post, req) {
        const salt = await bcrypt.genSalt();
        const data = {
            zasper_id: post.password,
            password: await bcrypt.hash(post.password, salt),
        };
        return await this.dbService.updateUser(req.user.uuid, data);
    }
    async changeEmail(post, req) {
        const y = await this.dbService.existUserData({ email: post.email });
        if (y) {
            throw new common_1.HttpException('Email aready exist', 500);
        }
        await this.dbService.updateUser(req.user.uuid, { email: post.email });
        return {
            statusCode: 200,
            message: 'Email succesfully updated',
            data: null,
        };
    }
    refresh(request) {
        const accessToken = this.authService.getCookieWithJwtAccessToken(request.user);
        return { success: true, message: '', data: accessToken };
    }
    async logOut(request) {
        const logoutCookie = [
            'Authentication=; HttpOnly; Path=/; Max-Age=0',
            'Refresh=; HttpOnly; Path=/; Max-Age=0',
        ];
        await this.authService.removeRefreshToken(request.user.id);
        request.res.setHeader('Set-Cookie', logoutCookie);
    }
    async turnOnTwoFactorAuthentication(post, req) {
        let secret = post.secret;
        let otp = post.otp;
        const verify_resp = otplib_1.authenticator.verify({
            token: otp,
            secret,
        });
        console.log('ddd', req.user.userId);
        if (verify_resp) {
            await this.dbService.updateUserById(req.user.userId, {
                twofa_secret: secret,
                is_two_fa_enabled: user_entity_1.YesNo.YES,
            });
            return { success: true, message: 'Two FA enabled Successfully' };
        }
        else
            return { success: false, message: 'Otp is expired or wrong' };
    }
    async verifyTwoFaCode(post, req) {
        const userInfo = await this.dbService.findUserById(req.user.userId);
        const secret = userInfo.twofa_secret;
        console.log('rere', {
            token: post.otp,
            secret,
            userInfo,
        });
        const resp = otplib_1.authenticator.verify({
            token: post.otp,
            secret
        });
        if (resp)
            return { success: true, message: 'Logged In successfully' };
        else
            return { success: false, message: 'Otp is expired or wrong' };
    }
};
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Header)('Access-Control-Allow-Credentials', 'true'),
    (0, common_1.Header)('Access-Control-Allow-Origin', '*'),
    (0, common_1.Header)('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'),
    (0, common_1.Header)('Access-Control-Allow-Headers', 'Content-Type, Accept'),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signin_dto_1.SignInDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signIn", null);
__decorate([
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signUp_dto_1.SignUpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signUp", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'adhar_front', maxCount: 1 },
        { name: 'adhar_back', maxCount: 1 },
        { name: 'pan', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
    ], {
        storage: (0, multer_1.diskStorage)({
            destination: function (req, file, cb) {
                if (file.fieldname === 'adhar_front')
                    cb(null, 'uploads/adhar/front');
                if (file.fieldname === 'adhar_back')
                    cb(null, 'uploads/adhar/back');
                if (file.fieldname === 'pan')
                    cb(null, 'uploads/pan');
            },
            filename: (req, file, cb) => {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');
                cb(null, `${randomName}${path.extname(file.originalname)}`);
            },
        }),
        limits: { fileSize: 170000 },
        fileFilter: function (_req, file, cb) {
            const filetypes = /jpeg|jpg|gif|png/;
            const cur_Ext = path.extname(file.originalname);
            const extname = filetypes.test(cur_Ext);
            const mimetype = filetypes.test(file.mimetype);
            if (mimetype && extname) {
                return cb(null, true);
            }
            else {
                return cb(new common_1.UnsupportedMediaTypeException('Only jpeg,gif,png file are supported'), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('changePassword'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('changeEmail'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changeEmail", null);
__decorate([
    (0, common_1.UseGuards)(refresh_guard_1.default),
    (0, common_1.Get)('refresh'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('log-out'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logOut", null);
__decorate([
    (0, common_1.Post)('2fa/turn-on'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "turnOnTwoFactorAuthentication", null);
__decorate([
    (0, common_1.Post)('2fa/verify'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyTwoFaCode", null);
AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __param(1, (0, common_1.Inject)(database_service_1.DatabaseService)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        database_service_1.DatabaseService])
], AuthController);
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map