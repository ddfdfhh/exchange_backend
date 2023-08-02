/*eslint-disable*/
import { Module } from '@nestjs/common';
import { BinanceController } from './binance.controller';
import { DatabaseModule } from 'src/database/database.module';
import { BullModule } from '@nestjs/bull';
import { TradeQueueService } from './trade_queue.service';
import { TradeConsumer } from './trade.consumer';

@Module({
  controllers: [BinanceController],
  imports: [
    DatabaseModule,
    BullModule.registerQueue(
      {
        name: 'trade_queue',
      }
    ),
  ],
  providers:[TradeQueueService,TradeConsumer]
})
export class BinanceModule {}
