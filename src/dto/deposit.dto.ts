/* eslint-disable*/
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Coin } from '../database/wallet/wallet.entity';

export class DepositDto {
  @IsNotEmpty()
  user_id: number;
  @IsNotEmpty()
  coin: string;
  @IsNotEmpty()
  to_address: string;
  @IsNotEmpty()
  network: string;
}
