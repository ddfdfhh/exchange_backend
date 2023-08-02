/* eslint-disable*/
import {  IsNotEmpty } from 'class-validator';

export class UsdtTransferDto {
  @IsNotEmpty()
  amount: number;
  @IsNotEmpty()
  address: string;
}
