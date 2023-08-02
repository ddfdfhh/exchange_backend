/*eslint-disable*/
import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueProgress,
} from '@nestjs/bull';

import { Job } from 'bull';
import { Inject } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';



@Processor('trade_queue')
export class TradeConsumer {
  constructor(

    @Inject(DatabaseService) private readonly dbService: DatabaseService,
  ) { }
  @Process({ concurrency: 5 })
  async processTrade(job: Job<any>) {
    let row = job.data.item
    const order=await this.dbService.getOrderFromTable(row['orderId'], row['clientId'])
    if ( order!=null && order['status']!= 'FILLED') {
      await this.dbService.updateBinanceTrade(
        row['clientId'],
        row['side'],
        row['type'],
        row['current_status'],
        row['symbol'],
        row['orderId'],
        row['date'],
        row['quantity'],
        row['settled_price'],
      );
      let coin = row['symbol'].substr(0, row['symbol'].indexOf('USDT'));
      let network = 'BEP20';
      if (coin == 'BNB' || coin == 'DRNH' || coin == 'USDT')
        network = 'BEP20';
      else if (coin == 'ETH') network = 'Ethereum';
      else if (coin == 'BTC') network = 'Bitcoin';
      let main_column = coin.toLowerCase() + '_balance';
      console.log('==================workign on job queue========');
      if (row['side'] == 'BUY') {
        /***main coin will be added and usdt will be decuted */
        let usdt_to_deduct = row['cummulativeQuoteQty'];
        let q = "UPDATE tbl_wallet SET `" + main_column + "`=`" + main_column + "`+" + row['quantity'] + " ,`usdt_balance` =`usdt_balance`-" + usdt_to_deduct + " WHERE `user_id`='" + order['user_id'] + "' AND `network`='" + network + "'";
        console.log('consumer buy query', q);
        await this.dbService.updateWalletQuery(q);

      }
      else {
        let usdt_to_add = row['cummulativeQuoteQty'];
        let q = "UPDATE tbl_wallet SET `" + main_column + "`=`" + main_column + "`-" + row['quantity'] + " ,`usdt_balance` =`usdt_balance`+" + usdt_to_add + " WHERE `user_id`='" + order['user_id'] + "' AND `network`='" + network + "'";
        console.log('consumter sell query', q);

        await this.dbService.updateWalletQuery(q);
 
      }

    }
  }


}
