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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const contants_1 = require("../constants/contants");
let AuthService = class AuthService {
    constructor(dbService, jwtService) {
        this.dbService = dbService;
        this.jwtService = jwtService;
    }
    getCookieWithJwtAccessToken(user) {
        const payload = { sub: user.id, uuid: user.uuid };
        const token = this.jwtService.sign(payload, {
            secret: contants_1.jwtConstants.token_secret,
            expiresIn: contants_1.jwtConstants.token_expiration,
        });
        return token;
    }
    getCookieWithJwtRefreshToken(user) {
        const payload = { sub: user.id, uuid: user.uuid };
        const token = this.jwtService.sign(payload, {
            secret: contants_1.jwtConstants.refresh_token_secret,
            expiresIn: contants_1.jwtConstants.refresh_token_expiration,
        });
        const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${contants_1.jwtConstants.refresh_token_expiration}`;
        return token;
    }
    async signIn(email, pass) {
        const user = await this.dbService.findUser(email);
        if (!user) {
            throw new common_1.HttpException('Invalid login credentials', 401);
        }
        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch) {
            throw new common_1.HttpException('Invalid login credentials', 401);
        }
        const accessToken = this.getCookieWithJwtAccessToken(user);
        const refreshToken = this.getCookieWithJwtRefreshToken(user);
        await this.dbService.updateUserById(user.id, { logged_in_at: new Date() });
        await this.dbService.setCurrentRefreshToken(refreshToken, user.id);
        return { accessToken, refreshToken, user };
    }
    async signUp(signUpDto) {
        return await this.dbService.saveUser(signUpDto);
    }
    async removeRefreshToken(id) {
        return await this.dbService.removeRefreshToken(id);
    }
    async getUserIfRefreshTokenMatches(refreshToken, userId) {
        const user = await this.dbService.findUserById(userId);
        const isRefreshTokenMatching = await bcrypt.compare(refreshToken, user.refreshToken);
        if (isRefreshTokenMatching) {
            return user;
        }
    }
};
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_service_1.DatabaseService)),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        jwt_1.JwtService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map