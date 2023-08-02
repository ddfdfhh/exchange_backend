/* eslint-disable*/
import { Entity, Column,CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tbl_trades')
export class Trade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  buyer_id: number;

  @Column()
  seller_id: number;
  @Column({ type: 'decimal', precision: 17, scale:8 })
  price: number;
  @Column({ type: 'decimal', precision: 17, scale: 8 })
  size: number;
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  volume: number;
  @Column()
  type: string;
  @Column()
  symbol: string;
  @Column({type:'tinyint',nullable:true})
  is_buyer: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
