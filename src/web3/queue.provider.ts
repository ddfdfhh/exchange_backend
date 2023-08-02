/* eslint-disable*/
import { Inject, Injectable } from '@nestjs/common';

import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { DatabaseService } from 'src/database/database.service';
import { Withdrawal } from 'src/database/withdrawal_entity/withdrawal.entity';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Deposit } from '../database/deposit_entity/deposit.entity';
 
@Injectable()
export class QueueService {
  private withdrawal_job: Job = null;
  private deposit_job: Job = null;
  constructor(
    @InjectQueue('withdrawal_queue') private wQueue: Queue,
    @InjectQueue('deposit_queue') private dQueue: Queue,
    @Inject(DatabaseService) private readonly dbService: DatabaseService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}
  async initiateWithdrawalJob() {
    const options = { removeOnComplete: true };
    const pendingWithdrawals: Partial<Withdrawal>[] =
      await this.dbService.getPendingWithdrawal(); /**we only pendign withdrawa of last 5 hrs */
    console.log('list', pendingWithdrawals.length);
    if (pendingWithdrawals.length > 0) {
      if (!this.withdrawal_job) {
        this.withdrawal_job = await this.wQueue.add(
          { pendingWithdrawals },
          options,
        );
        this.withdrawal_job.finished().then((v) => {
          console.log('finished job', this.withdrawal_job.id);
          this.withdrawal_job = null;
        });
      } else console.log('wait then to add to q', this.withdrawal_job.id);
    } else {
      this.withdrawal_job = null;

      const pl = this.schedulerRegistry.getCronJob('withdrawal_cron');
      console.log('withdrawal_cron cron closed');
      pl.stop();
    }
  }
  async initiateDepositJob() {
    const options = { removeOnComplete: true };
    const pendingDeposits: Partial<Deposit>[] =
      await this.dbService.getPendingDeposits(); /**we only pendign despits of last 5 hrs */
    console.log('deposit list', pendingDeposits.length);
    const start_time = new Date().getTime();
    if (pendingDeposits.length > 0) {
      if (!this.deposit_job) {
        this.deposit_job = await this.dQueue.add({ pendingDeposits }, options);
        this.deposit_job.finished().then((v) => {
          console.log('deposit finished job', this.deposit_job.id);
          this.deposit_job = null;
        });
      } else console.log('wait then to add to q', this.deposit_job.id);
    } else {
      this.deposit_job = null;

      const pl = this.schedulerRegistry.getCronJob('deposit_cron');
      console.log('deposit cron closed');
      pl.stop();
    }
  }
}
