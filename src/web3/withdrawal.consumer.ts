/*eslint-disable*/
import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueProgress,
} from '@nestjs/bull';

import { Job } from 'bull';
import { Web3Service } from './web3.service';
import { Inject } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  Status,
  Withdrawal,
} from 'src/database/withdrawal_entity/withdrawal.entity';
import { ErrorSave } from 'src/database/error_handling.entity';

@Processor('withdrawal_queue')
export class WithdrawalConsumer {
  constructor(
    @Inject(Web3Service) private readonly web3Service: Web3Service,
    @Inject(DatabaseService) private readonly dbService: DatabaseService,
  ) {}
  @Process({ concurrency: 5 })
  async processWithdrawal(job: Job<any>) {
    let pendingWithdrawals = job.data.pendingWithdrawals;

    pendingWithdrawals.forEach(async (v: Withdrawal) => {
      console.log('started looping');
      try {
        let receipt = await this.web3Service.receipt(
          v.transaction_hash,
          v.from_address, v.network
        );
        console.log('receipt got');
        if (receipt) {/*receipt is also null if  comfiration count not match target count for network*/
          let update_data: Partial<Withdrawal> = (typeof receipt == 'bigint' || typeof receipt == 'number')
            ? { confirmations: parseInt(String(receipt)) }
            : {
              status: receipt.status ? Status.Approved : Status.Reverted,
              reason: receipt.status == 1 ? '' : 'Reverted transaction',
              confirmations: receipt.confirmationCount,
              response: JSON.stringify(
                {
                  gasUsed: receipt.gasUsed,
                  block_hash: receipt.blockHash,
                  to: receipt.to,
                  from: receipt.from,
                  time: Date.now(),
                },
                (key, value) =>
                  typeof value === 'bigint' ? value.toString() : value, // return everything else unchanged
              ),
              updated_at: new Date(),
            };
          await this.dbService.updateWtihdrawalById(v.id, update_data);
        }
      }
      catch (error) {
        await this.dbService.saveError({ error: error, from: 'Looping throug get receipt' } as ErrorSave)
      }
    });
    
  }
  async updateWithdrawlConfirmationCount(id:number,count: BigInt|0) {
   let g= await this.dbService.updateWtihdrawalById(id, { confirmations: parseInt(String(count)) });
  }
  async updateWithdrawlWithStatus(withdrawal:Withdrawal,update_data) {
  let g = await this.dbService.updateWtihdrawalById(withdrawal.id, update_data);
    if (update_data.status==Status.Approved) {
      this.dbService.updateWallet(
        withdrawal.user_id,
        withdrawal.with_amount,
        withdrawal.from_address,
        withdrawal.coin,
        withdrawal.network,
        'Dec',
      );
      /**save or update in address token balance tablemeans decrease balance */
      await this.dbService.saveTokenAddressBalance(
        withdrawal.from_address,
        withdrawal.coin,
        withdrawal.network,
        withdrawal.with_amount+0.0001,
        'Dec',
      );
    }
  }
  @OnQueueActive()
  onActive(job: Job) {
    // console.log(
    //   `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    // );
  }
  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    console.log('Proceress. ' + progress);
  }
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    //   console.log('complete notify. '+job.id, result);
  }
}
