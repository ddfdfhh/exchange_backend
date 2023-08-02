/* eslint-disable*/
import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Status } from '../user/user.entity';

 enum YesNo {
  YES = 'Yes',
  NO = 'No',
}
export enum Coin {
  BTC = 'BTC',
  BNB = 'BNB',
  USDT = 'USDT',
  ETH='ETH',
  DRNH='DRNH',
  BUSD = 'BUSD',
  TRX='TRX'
  
}

@Entity('tbl_wallet')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;
  @Column({ length: 100, nullable: true })
  deposit_address: string;
  
  @Column({
    type: 'decimal',
    precision: 17,
    scale: 8,
    default: () => 0.0,
  })
  usdt_balance: number;
  @Column({
    type: 'decimal',
    precision: 17,
    scale: 8,
    default: () => 0.0,
  })
  bnb_balance: number;
  @Column({
    type: 'decimal',
    precision: 17,
    scale: 8,
    default: () => 0.0,
  })
  eth_balance: number;
  @Column({
    type: 'decimal',
    precision: 17,
    scale: 8,
    default: () => 0.0,
  })
  btc_balance: number;
  @Column({
    type: 'decimal',
    precision: 17,
    scale: 8,
    default: () => 0.0,
  })
  drnh_balance: number;
  
  
  @Column({
    type: 'enum',
    enum: YesNo,
    default: YesNo.NO,
  })
  white_listed: YesNo;
  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ACTIVE,
  })
  status: Status;
  @Column({ length: 300, nullable: true })
  network: string;
  
  @Column({ length: 400, nullable: true })
  privateKey: string;
  
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
