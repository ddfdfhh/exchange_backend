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
import { Deposit } from 'src/database/deposit_entity/deposit.entity';
import { YesNo } from 'src/database/user/user.entity';

@Processor('deposit_queue')
export class DepositConsumer {
  constructor(
    @Inject(Web3Service) private readonly web3Service: Web3Service,
    @Inject(DatabaseService) private readonly dbService: DatabaseService,
  ) { }
  @Process({ concurrency: 3 })
  async processDeposit(job: Job<any>) {
    let pendingDeposits = job.data.pendingDeposits;

    pendingDeposits.forEach(async (v: Deposit) => {
      console.log('started looping pendingDeposits',v);
      try {
        let transaction = await this.web3Service.findTransactionForDeposit(
          v.to_address,
          v.amount,
          v.coin,
          v.network,
          v.start_block,
        );
        console.log('found transaction', transaction);
        if (transaction) {
          /*receipt is also null if  comfiration count not match target count for network*/
          let update_data: Partial<Deposit> = {
            status: transaction.txreceipt_status
              ? Status.Approved
              : Status.Reverted,
            reason:
              transaction.txreceipt_status == 1
                ? ''
                : 'Reverted transaction',
            confirmations: transaction.confirmations,
            from_address: transaction.from,
            transaction_hash: transaction.hash,
            response: JSON.stringify(
              {
                gasUsed: transaction.gasUsed,
                block_hash: transaction.blockHash,
                time: Date.now(),
              },
              (key, value) =>
                typeof value === 'bigint' ? value.toString() : value, // return everything else unchanged
            ),
            updated_at: new Date(),
          };
          if (typeof transaction == 'bigint' || typeof transaction == 'number')
            await this.updateDepositConfirmationCount(
              v.id,
              transaction,
            );
          else {
            await this.updateDepositlWithStatus(v, update_data)
          }
        }
        else { 
       
            let diff = (new Date().getTime() - new Date(v.created_at).getTime()) / 1000;
            diff /= 60 * 60;
          const  diffin_hrs= Math.abs(Math.round(diff));
          if (diffin_hrs >= 6) { 
            await this.dbService.updateDepositById(v.id, {deleted:YesNo.YES} );
          }
        }
      } catch (error) {
        await this.dbService.saveError({
          error: error,
          from: 'Looping throug despit in deposit consumer file',
        } as ErrorSave);
      }
    });
  }
  async updateDepositConfirmationCount(id: number, count: bigint|number) {
    await this.dbService.updateWtihdrawalById(id, {
      confirmations: parseInt(String(count)),
    });
  }
  async updateDepositlWithStatus(deposit: Deposit, update_data) {
    let g = await this.dbService.updateDepositById(deposit.id, update_data);
    if (update_data.status==Status.Approved) {
     await this.dbService.updateWallet(
        deposit.user_id,
        deposit.amount,
        deposit.to_address,
        deposit.coin,
        deposit.network,'inc'
      );
      /**save or update in address token balance table */
      await this.dbService.saveTokenAddressBalance(
        deposit.to_address,
        deposit.coin,
        deposit.network,
        deposit.amount,'Inc'
      );
    }
  
  }
 
}
