/// <reference types="multer" />
import { AuthService } from './auth.service';
import { SignInDto } from 'src/dto/signin.dto';
import { SignUpDto } from 'src/dto/signUp.dto';
import { Response } from 'express';
import { DatabaseService } from 'src/database/database.service';
export declare class AuthController {
    private authService;
    private readonly dbService;
    constructor(authService: AuthService, dbService: DatabaseService);
    signIn(signInDto: SignInDto, res: Response): Promise<any>;
    signUp(signpDto: SignUpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadFile(files: {
        adhar_front?: Express.Multer.File[];
        adhar_back?: Express.Multer.File[];
        pan?: Express.Multer.File[];
    }, post: Record<string, any>, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getProfile(req: any): Promise<{
        success: boolean;
        message: string;
        data: import("src/database/user/user.entity").User;
    }>;
    changePassword(post: Partial<SignUpDto>, req: any): Promise<import("typeorm").UpdateResult>;
    changeEmail(post: Partial<SignUpDto>, req: any): Promise<{
        statusCode: number;
        message: string;
        data: any;
    }>;
    refresh(request: any): {
        success: boolean;
        message: string;
        data: string;
    };
    logOut(request: any): Promise<void>;
    turnOnTwoFactorAuthentication(post: Record<string, any>, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyTwoFaCode(post: any, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
