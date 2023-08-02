/* eslint-disable*/
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';
import { Coin } from './database/wallet/wallet.entity';
import { Status } from './database/withdrawal_entity/withdrawal.entity';
import { Web3Service } from './web3/web3.service';
import { QueueService } from './web3/queue.provider';


@Controller()
export class AppController {
  constructor(
    @Inject(DatabaseService)
    private readonly dbService: DatabaseService,
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    @Inject(QueueService)
    private readonly queueService: QueueService, //  private readonly httpService: HttpService,
  ) {}

  @Get('/first')
  async first() {
  

    return 'ok';
  }
  @Post('webhook')
  hook(@Body() obj: any) {
    if (
      obj['block_hash'] !== undefined &&
      obj['block_height'] > 0 &&
      obj['confirmations'] > 0
    ) {
      console.log('souccess hook', obj);
      try {
        let p = this.dbService.updateWtihdrawalStatus(
          obj.hash,
          Status.Approved,
        );
        console.log('status updated', JSON.parse(JSON.stringify(p)));
      } catch (err) {
        console.log('eeror in up', err);
      }
    } else console.log('hook', obj);
  }
  @Post('addWebhookId')
  addWebhookId(
    @Body()
    obj: {
      hook_id: string;
      hash: string;
      to: string;
      coin: Coin;
      network: string;
    },
  ) {
    let p = this.dbService.updateWebhookId(
      obj.hash,
      obj.hook_id,
      obj.to,
      obj.coin,
      obj.network,
    );
    return 'ok';
  }
}
