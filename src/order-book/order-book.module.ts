import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { OrderBookService } from './order-book.service';
import { OrderBookController } from './order-book.controller';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [DatabaseModule, SocketModule],
  providers: [OrderBookService],
  controllers: [OrderBookController],
  exports: [OrderBookService],
})
export class OrderBookModule {}
