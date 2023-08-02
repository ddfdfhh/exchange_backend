/* eslint-disable*/
import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coin } from '../wallet/wallet.entity';
import { YesNo } from '../user/user.entity';

export enum Status {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Reverted = 'Reverted'
}

@Entity('tbl_withdrawal')
export class Withdrawal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;
  @Column({ length: 400,nullable:true })
  from_address: string;
  @Column({ length: 400 })
  to_address: string;
  @Column({
    type: 'decimal',
    precision: 17,
    scale: 8,
    default: () => 0.0,
  })
  with_amount: number;
  @Column({
    default: () => 0.0,
  })
  confirmations: number;
  @Column({
    type: 'enum',
    enum: Coin,
  })
  coin: Coin;
  @Column({
    type: 'enum',
    enum: YesNo,
    default:YesNo.NO
  })
  pay_by_admin: YesNo;
  @Column({ type: 'enum', enum: YesNo, default: YesNo.NO })
  deleted: YesNo;
  @Column({ length: 100 })
  network: string;
  @Column({ length: 300, nullable: true })
  webhook_id: string;

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
