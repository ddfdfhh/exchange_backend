/* eslint-disable*/
import { Inject, Injectable } from '@nestjs/common';

import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class TradeQueueService {
  private job: Job = null;

  constructor(
    @InjectQueue('trade_queue') private tQueue: Queue,
  ) { }
  async initiateTradeJob(item: any) {
    const options = { removeOnComplete: true };
     this.job = await this.tQueue.add({ item }, options);
      this.job.finished().then((v) => {
        console.log('deposit finished job', this.job.id);
        this.job = null;
      });
   
    return;
  }
}
 

