/* eslint-disable*/
import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from 'src/database/trade/trade.entity';
import { OrderBook } from './order_book/order_book.entity';
import { DatabaseService } from './database.service';
import { User } from './user/user.entity';
import { Wallet } from './wallet/wallet.entity';
import { Identity } from './identity/identity.entity';
import { NetworkFee } from './network_fees/network_fees.entity';
import { Withdrawal } from './withdrawal_entity/withdrawal.entity';
import { ErrorSave } from './error_handling.entity';
import { Deposit } from './deposit_entity/deposit.entity';
import { TokenAddressBalance } from './address_balance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trade,
      OrderBook,
      User,
      Wallet,
      Identity,
      NetworkFee,
      Withdrawal,
      ErrorSave,
      Deposit,
      TokenAddressBalance
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
