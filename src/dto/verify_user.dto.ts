/* eslint-disable*/
import { IsEmail, IsNotEmpty } from 'class-validator';

export class VerifyUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}
