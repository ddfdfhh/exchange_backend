/* eslint-disable*/
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Coin } from 'src/database/wallet/wallet.entity';

export class WithdrawalDto {
 
  @IsNotEmpty()
  user_id: number;

  @IsNotEmpty()
  coin: Coin;
  @IsNotEmpty()
  network: string;
  @IsNotEmpty()
  amount: number;
  @IsNotEmpty()
  fees: number;
  @IsNotEmpty()
  balance: number;
  @IsNotEmpty()
  to_address: string;
 
  memo: string;
}
