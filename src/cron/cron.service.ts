/*eslint-disable*/
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { QueueService } from '../web3/queue.provider';

@Injectable()
export class CronService {
  // private readonly logger = new Logger('Cron Logiin'),
  constructor(
    @Inject(QueueService)
    private readonly queueService: QueueService,
  ) {}
  @Cron('*/2 * * * * *', {
    name: 'withdrawal_cron',
   
})
  async handleWithdrawalCron() {
    console.log('running cron every withdral')
    await this.queueService.initiateWithdrawalJob();
  }
  @Cron('*/2 * * * * *', {
    name: 'deposit_cron',
   
})
  async handleDepositCron() {
    console.log('running cron every 4')
    await this.queueService.initiateDepositJob();
  }
}
