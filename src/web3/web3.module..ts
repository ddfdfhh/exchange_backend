/* eslint-disable*/
import { Module } from '@nestjs/common';
import Web3 from 'web3';
import { Web3Service } from './web3.service';
import { QueueService } from './queue.provider';
import { BullModule } from '@nestjs/bull';
import { WithdrawalConsumer } from './withdrawal.consumer';
import { DatabaseModule } from 'src/database/database.module';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue(
      {
        name: 'withdrawal_queue',
      },
      {
        name: 'deposit_queue',
      },
    ),
    DatabaseModule,
  ],
  providers: [
    {
      provide: 'Web3',
      useValue: new Web3(
        new Web3.providers.HttpProvider(
          'https://data-seed-prebsc-1-s2.binance.org:8545',
        ),
      ),
    },
    {
      provide: 'EthWeb3',
      useValue: new Web3(
        new Web3.providers.HttpProvider(
          'https://sepolia.infura.io/v3/55739af7e34c455ba6d78e039362c4a5',
        ),
      ),
    },

    Web3Service,
    QueueService,
    WithdrawalConsumer,
  ],
  exports: [Web3Service, QueueService],
})
export class Web3Module {}
