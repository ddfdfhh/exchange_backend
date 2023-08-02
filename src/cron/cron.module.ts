import { Module } from '@nestjs/common';
import { Web3Module } from 'src/web3/web3.module.';
import { CronService } from './cron.service';

@Module({
    imports: [Web3Module],
  providers: [CronService],
       exports: [CronService],
})
export class CronModule {}
