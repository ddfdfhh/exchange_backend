/* eslint-disable*/
import {
  Entity,
  Column, PrimaryGeneratedColumn,
} from 'typeorm';
import { Coin } from './wallet/wallet.entity';

@Entity('address_balance')
export class TokenAddressBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: Coin })
  coin: Coin;
  @Column()
  network: string;
  @Column()
  address: string;
  @Column({
    type: 'decimal',
    precision: 17,
    scale: 8,
    default: () => 0.0,
  })
  balance: number;
}
