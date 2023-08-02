/* eslint-disable*/
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Coin } from 'src/database/wallet/wallet.entity';

export class GetAddressDto {
  @IsNotEmpty()
  user_id: number;
  @IsNotEmpty()
  coin: Coin;
  @IsNotEmpty()
  network: string;
}
