/* eslint-disable*/
import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { Trade } from './database/trade/trade.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderBook } from './database/order_book/order_book.entity';
import { OrderBookModule } from './order-book/order-book.module';
import { DatabaseModule } from './database/database.module';
import { WalletModule } from './wallet/wallet.module';
import { AuthModule } from './auth/auth.module';
import { User } from './database/user/user.entity';
import { Wallet } from './database/wallet/wallet.entity';
import { Identity } from './database/identity/identity.entity';
import { NetworkFee } from './database/network_fees/network_fees.entity';
import { Withdrawal } from './database/withdrawal_entity/withdrawal.entity';
import { DatabaseService } from './database/database.service';
import { Web3Module } from './web3/web3.module.';
import { BullModule } from '@nestjs/bull';
import { WinstonModule } from 'nest-winston';
import { ScheduleModule } from '@nestjs/schedule';
import * as winston from 'winston';
import { CronModule } from './cron/cron.module';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Deposit } from './database/deposit_entity/deposit.entity';
import { TokenAddressBalance } from './database/address_balance.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/contants';
import { DataSource } from 'typeorm';
import { BinanceModule } from './binance/binance.module';
import { WSService } from './websocket.service';
var path = require('path');
@Module({
  imports: [
    ScheduleModule.forRoot(),
    CronModule,
    SocketModule,

    AuthModule,
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          dirname: path.join(__dirname, './../log/debug/'), //path to where save loggin result
          filename: 'debug.log', //name of file where will be saved logging result
          level: 'debug',
        }),
        new winston.transports.File({
          dirname: path.join(__dirname, './../log/info/'),
          filename: 'info.log',
          level: 'info',
        }),
      ],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: 'db-crypto-exchange.cdw9z07jl5zt.ap-south-1.rds.amazonaws.com',
        port: 3306,
        username: 'db_crypto',
        password: 'Shivbaba123456#',
        database: 'trading',
        entities: [
          Trade,
          OrderBook,
          User,
          Wallet,
          Identity,
          NetworkFee,
          Withdrawal,
          Deposit,
          TokenAddressBalance,
        ],
        synchronize: true,
      }),
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),

    BullModule.forRoot({
      redis: {
        host: 'redis-14582.c305.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 14582,
        password: 'ZrvLwcxPj0biXStChbLnsLDI4w6kwOdq',
      },
    }),
    OrderBookModule,
    WalletModule,
    AuthModule,

    DatabaseModule,
    Web3Module,
    BinanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
