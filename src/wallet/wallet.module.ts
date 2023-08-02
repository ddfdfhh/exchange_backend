import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { DatabaseModule } from 'src/database/database.module';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [WalletController],
})
export class WalletModule {}
