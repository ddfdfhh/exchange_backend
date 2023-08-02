/* eslint-disable*/
import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coin } from '../wallet/wallet.entity';
import { Status } from '../withdrawal_entity/withdrawal.entity';
import { YesNo } from '../user/user.entity';
@Entity('tbl_deposit')
export class Deposit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;
  @Column({ length: 400 })
  from_address: string;
  @Column({ length: 400 })
  to_address: string;
  @Column({
    type: 'decimal',
    precision: 17,
    scale: 8,
    default: () => 0.0,
  })
  amount: number;
  @Column({
    type: 'enum',
    enum: Coin,
  })
  coin: Coin;
  @Column({ length: 100 })
  network: string;
  @Column({ type: 'enum', enum: YesNo, default: YesNo.NO })
  deleted: YesNo;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.Pending,
  })
  status: Status;
  @Column({ length: 300, nullable: true })
  transaction_hash: string;
  @Column({ nullable: true })
  response: string;
  @Column({ nullable: true })
  reason: string;
  @Column({ nullable: true })
  start_block: number;
  @Column({
    default: () => 0.0,
  })
  confirmations: number;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
